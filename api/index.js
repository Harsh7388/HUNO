const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Note: Ensure server/dist is built!
const roomManager = require('../server/dist/roomManager');
const gameLogic = require('../server/dist/gameLogic');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

const httpServer = createServer(app);

// Optimizing for Vercel persistence
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'], // Allow both for better join stability
  allowEIO3: true,
  connectTimeout: 45000,
  pingTimeout: 120000, // 2 minutes to keep rooms alive
  pingInterval: 25000
});

function broadcastRoom(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  for (const player of room.gameState.players) {
    if (player.isConnected && player.socketId) {
      const state = roomManager.buildClientState(room, player.id);
      io.to(player.socketId).emit('game_state', state);
    }
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', ({ username, playerId }) => {
    try {
      const room = roomManager.createRoom(playerId, socket.id, username);
      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code });
      broadcastRoom(room.code);
    } catch (e) {
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('join_room', ({ username, roomCode, playerId }) => {
    console.log('Join attempt:', { username, roomCode, playerId });
    const code = roomCode.trim().toUpperCase();
    const { room, error } = roomManager.joinRoom(code, playerId, socket.id, username);
    
    if (error || !room) {
      console.log('Join failed:', error || 'Room not found');
      socket.emit('error', { message: error || 'Room not found' });
      return;
    }
    
    socket.join(room.code);
    socket.emit('room_joined', { roomCode: room.code });
    broadcastRoom(room.code);
    console.log('Join successful:', room.code);
  });

  socket.on('start_game', ({ roomCode }) => {
    const result = roomManager.startGame(roomCode, socket.id);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(roomCode);
  });

  socket.on('play_card', ({ cardId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = gameLogic.playCard(room.gameState, player.id, cardId);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    if (result.unoPenaltyId) {
      const penaltyPlayer = room.gameState.players.find(p => p.id === result.unoPenaltyId);
      io.to(room.code).emit('uno_penalty', {
        playerId: result.unoPenaltyId,
        username: penaltyPlayer?.username
      });
    }
    if (result.needsColorChoice) socket.emit('choose_color', {});
    if (result.needsSwapTarget) {
      const others = room.gameState.players.filter(p => p.id !== player.id).map(p => ({ id: p.id, username: p.username }));
      socket.emit('choose_swap_target', { players: others });
    }
    broadcastRoom(room.code);
  });

  socket.on('draw_card', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = gameLogic.drawCard(room.gameState, player.id);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    if (result.canPlay && result.drawn.length > 0) socket.emit('can_play_drawn', { card: result.drawn[0] });
    broadcastRoom(room.code);
  });

  socket.on('call_uno', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    if (player.hand.length <= 2) {
      player.calledUno = true;
      room.gameState.lastAction = `🔴 ${player.username} called UNO!`;
      io.to(room.code).emit('uno_called', { playerId: socket.id, username: player.username });
      broadcastRoom(room.code);
    }
  });

  socket.on('color_chosen', ({ color }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const result = gameLogic.applyColorChoice(room.gameState, color);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(room.code);
  });

  socket.on('swap_target_chosen', ({ targetId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = gameLogic.applySwapTarget(room.gameState, player.id, targetId);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(room.code);
  });

  socket.on('toggle_stacking', ({ roomCode, enabled }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    roomManager.setStacking(roomCode, enabled);
    broadcastRoom(roomCode);
  });

  socket.on('toggle_team_mode', ({ roomCode, enabled }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    roomManager.setTeamMode(roomCode, enabled);
    broadcastRoom(roomCode);
  });

  socket.on('play_again', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    if (room.gameState.phase !== 'gameover' && room.hostId !== socket.id) return;
    roomManager.resetRoom(roomCode);
    roomManager.startGame(roomCode, room.hostId);
    broadcastRoom(roomCode);
  });

  socket.on('send_message', ({ text }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const message = {
      id: Date.now().toString(),
      username: player.username,
      text: text.slice(0, 200),
      timestamp: Date.now(),
      team: room.gameState.isTeamMode ? player.team : undefined,
    };
    if (room.gameState.isTeamMode && player.team) {
      room.gameState.players.forEach(p => {
        if (p.team === player.team && p.isConnected && p.socketId) io.to(p.socketId).emit('chat_message', message);
      });
    } else {
      io.to(room.code).emit('chat_message', message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
    const result = roomManager.handleDisconnect(socket.id);
    if (result) {
      const { room, playerId } = result;
      const player = room.gameState.players.find(p => p.id === playerId);
      room.gameState.lastAction = `${player?.username || 'A player'} disconnected`;
      broadcastRoom(room.code);
    }
  });
});

const clientPath = path.join(process.cwd(), 'client/dist');
app.use(express.static(clientPath));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// For Vercel serverless function
module.exports = (req, res) => {
  if (req.url.startsWith('/socket.io/')) {
    return httpServer.emit('request', req, res);
  }
  return app(req, res);
};
