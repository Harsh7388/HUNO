import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import {
  createRoom, joinRoom, removePlayer, startGame,
  getRoomByPlayerId, buildClientState, setStacking, setTeamMode, resetRoom, getRoom,
  handleDisconnect, getRoomBySocketId
} from './roomManager';
import { playCard, drawCard, applyColorChoice, applySwapTarget } from './gameLogic';
import { CardColor } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

function broadcastRoom(roomCode: string) {
  const room = getRoom(roomCode);
  if (!room) return;
  for (const player of room.gameState.players) {
    if (player.isConnected && player.socketId) {
      const state = buildClientState(room, player.id);
      io.to(player.socketId).emit('game_state', state);
    }
  }
}

io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // ─── Create Room ─────────────────────────────────────────────
  socket.on('create_room', ({ username, playerId }: { username: string; playerId: string }) => {
    try {
      const room = createRoom(playerId, socket.id, username);
      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code });
      broadcastRoom(room.code);
    } catch (e) {
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // ─── Join Room ────────────────────────────────────────────────
  socket.on('join_room', ({ username, roomCode, playerId }: { username: string; roomCode: string; playerId: string }) => {
    const { room, error } = joinRoom(roomCode.toUpperCase(), playerId, socket.id, username);
    if (error || !room) {
      socket.emit('error', { message: error || 'Failed to join room' });
      return;
    }
    socket.join(room.code);
    socket.emit('room_joined', { roomCode: room.code });
    
    // Check if it's a reconnection
    const isRejoin = room.gameState.phase !== 'lobby';
    if (!isRejoin) {
      room.gameState.lastAction = `${username} joined the game!`;
    } else {
      room.gameState.lastAction = `${username} reconnected!`;
    }
    broadcastRoom(room.code);
  });

  // ─── Start Game ───────────────────────────────────────────────
  socket.on('start_game', ({ roomCode }: { roomCode: string }) => {
    const result = startGame(roomCode, socket.id);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(roomCode);
  });

  // ─── Play Card ────────────────────────────────────────────────
  socket.on('play_card', ({ cardId }: { cardId: string }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = playCard(room.gameState, player.id, cardId);
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
    if (result.needsColorChoice) {
      socket.emit('choose_color', {});
    }
    if (result.needsSwapTarget) {
      const others = room.gameState.players.filter(p => p.id !== player.id).map(p => ({ id: p.id, username: p.username }));
      socket.emit('choose_swap_target', { players: others });
    }
    broadcastRoom(room.code);
  });

  // ─── Draw Card ────────────────────────────────────────────────
  socket.on('draw_card', () => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = drawCard(room.gameState, player.id);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    if (result.canPlay && result.drawn.length > 0) {
      socket.emit('can_play_drawn', { card: result.drawn[0] });
    }
    broadcastRoom(room.code);
  });

  // ─── Call UNO ─────────────────────────────────────────────────
  socket.on('call_uno', () => {
    const room = getRoomBySocketId(socket.id);
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

  // ─── Color Chosen ─────────────────────────────────────────────
  socket.on('color_chosen', ({ color }: { color: CardColor }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const result = applyColorChoice(room.gameState, color);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(room.code);
  });

  // ─── Swap Target Chosen ───────────────────────────────────────
  socket.on('swap_target_chosen', ({ targetId }: { targetId: string }) => {
    const room = getRoomBySocketId(socket.id);
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const result = applySwapTarget(room.gameState, player.id, targetId);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(room.code);
  });

  // ─── Toggle Stacking ──────────────────────────────────────────
  socket.on('toggle_stacking', ({ roomCode, enabled }: { roomCode: string; enabled: boolean }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    setStacking(roomCode, enabled);
    broadcastRoom(roomCode);
  });

  // ─── Toggle Team Mode ─────────────────────────────────────────
  socket.on('toggle_team_mode', ({ roomCode, enabled }: { roomCode: string; enabled: boolean }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    setTeamMode(roomCode, enabled);
    broadcastRoom(roomCode);
  });

  // ─── Play Again ───────────────────────────────────────────────
  socket.on('play_again', ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    resetRoom(roomCode);
    broadcastRoom(roomCode);
  });

  // ─── Chat Message ─────────────────────────────────────────────
  socket.on('send_message', ({ text }: { text: string }) => {
    const room = getRoomBySocketId(socket.id);
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
        if (p.team === player.team && p.isConnected && p.socketId) {
          io.to(p.socketId).emit('chat_message', message);
        }
      });
    } else {
      io.to(room.code).emit('chat_message', message);
    }
  });

  // ─── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const result = handleDisconnect(socket.id);
    if (result) {
      const { room, playerId } = result;
      const player = room.gameState.players.find(p => p.id === playerId);
      room.gameState.lastAction = `${player?.username || 'A player'} disconnected`;
      broadcastRoom(room.code);
    }
  });
});

// Serve Static Assets in Production
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 HUNO Server running on http://localhost:${PORT}`);
});
