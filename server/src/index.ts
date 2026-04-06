import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import {
  createRoom, joinRoom, removePlayer, startGame,
  getRoomByPlayerId, buildClientState, setStacking, setTeamMode, resetRoom, getRoom,
  handleDisconnect, getRoomBySocketId, updateSocketId
} from './roomManager';
import { playCard, drawCard, applyColorChoice, applySwapTarget } from './gameLogic';
import { CardColor } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  // Allow polling → websocket upgrade (required for Render's reverse proxy)
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
});

// ─── Helper: broadcast updated game state to all connected players ─────────────
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

// ─── Helper: refresh socket ID mapping then look up room ──────────────────────
// Every client event includes its persistent playerId so we can keep the
// server's socketId mapping fresh even after reconnects / transport upgrades.
function refreshAndGetRoom(socketId: string, playerId?: string): ReturnType<typeof getRoomBySocketId> {
  if (playerId) {
    updateSocketId(playerId, socketId);
  }
  return getRoomBySocketId(socketId);
}

// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // ─── Register / Reconnect ─────────────────────────────────────────────
  // Called by client on every connect/reconnect so stale socketIds are fixed.
  socket.on('register', ({ playerId }: { playerId: string }) => {
    const updated = updateSocketId(playerId, socket.id);
    if (updated) {
      const room = getRoomBySocketId(socket.id);
      if (room) {
        socket.join(room.code);
        console.log(`🔄 Re-registered ${playerId} → ${socket.id} in room ${room.code}`);
        broadcastRoom(room.code);
      }
    }
  });

  // ─── Create Room ─────────────────────────────────────────────────────
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

  // ─── Join Room ────────────────────────────────────────────────────────
  socket.on('join_room', ({ username, roomCode, playerId }: { username: string; roomCode: string; playerId: string }) => {
    const trimmedCode = roomCode.trim().toUpperCase();
    console.log(`🔍 Try joining: ${trimmedCode} (${username} / ${playerId})`);

    const { room, error } = joinRoom(trimmedCode, playerId, socket.id, username);
    if (error || !room) {
      console.log(`❌ Join failed for ${username}: ${error || 'Room not found'}`);
      socket.emit('error', { message: error || 'Room not found' });
      return;
    }
    console.log(`🎯 Joined: ${room.code}`);
    socket.join(room.code);
    socket.emit('room_joined', { roomCode: room.code });

    const isRejoin = room.gameState.phase !== 'lobby';
    room.gameState.lastAction = isRejoin
      ? `${username} reconnected!`
      : `${username} joined the game!`;
    broadcastRoom(room.code);
  });

  // ─── Start Game ───────────────────────────────────────────────────────
  socket.on('start_game', ({ roomCode, playerId }: { roomCode: string; playerId?: string }) => {
    const trimmedCode = roomCode.trim().toUpperCase();
    // Refresh socketId mapping so stale IDs don't block the host check
    if (playerId) updateSocketId(playerId, socket.id);

    const result = startGame(trimmedCode, socket.id, playerId);
    if (!result.success) {
      console.log(`❌ Start game failed: ${result.error}`);
      socket.emit('error', { message: result.error });
      return;
    }
    console.log(`🎮 Game started in room ${trimmedCode}`);
    broadcastRoom(trimmedCode);
  });

  // ─── Play Card ────────────────────────────────────────────────────────
  socket.on('play_card', ({ cardId, playerId }: { cardId: string; playerId?: string }) => {
    const room = refreshAndGetRoom(socket.id, playerId);
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
    if (result.needsColorChoice) socket.emit('choose_color', {});
    if (result.needsSwapTarget) {
      const others = room.gameState.players
        .filter(p => p.id !== player.id)
        .map(p => ({ id: p.id, username: p.username }));
      socket.emit('choose_swap_target', { players: others });
    }
    broadcastRoom(room.code);
  });

  // ─── Draw Card ────────────────────────────────────────────────────────
  socket.on('draw_card', ({ playerId }: { playerId?: string } = {}) => {
    const room = refreshAndGetRoom(socket.id, playerId);
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

  // ─── Call UNO ─────────────────────────────────────────────────────────
  socket.on('call_uno', ({ playerId }: { playerId?: string } = {}) => {
    const room = refreshAndGetRoom(socket.id, playerId);
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

  // ─── Color Chosen ─────────────────────────────────────────────────────
  socket.on('color_chosen', ({ color, playerId }: { color: CardColor; playerId?: string }) => {
    const room = refreshAndGetRoom(socket.id, playerId);
    if (!room) return;
    const result = applyColorChoice(room.gameState, color);
    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }
    broadcastRoom(room.code);
  });

  // ─── Swap Target Chosen ───────────────────────────────────────────────
  socket.on('swap_target_chosen', ({ targetId, playerId }: { targetId: string; playerId?: string }) => {
    const room = refreshAndGetRoom(socket.id, playerId);
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

  // ─── Toggle Stacking ──────────────────────────────────────────────────
  socket.on('toggle_stacking', ({ roomCode, enabled, playerId }: { roomCode: string; enabled: boolean; playerId?: string }) => {
    if (playerId) updateSocketId(playerId, socket.id);
    const room = getRoom(roomCode.trim().toUpperCase());
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player || room.hostId !== player.id) return;
    setStacking(room.code, enabled);
    broadcastRoom(room.code);
  });

  // ─── Toggle Team Mode ─────────────────────────────────────────────────
  socket.on('toggle_team_mode', ({ roomCode, enabled, playerId }: { roomCode: string; enabled: boolean; playerId?: string }) => {
    if (playerId) updateSocketId(playerId, socket.id);
    const room = getRoom(roomCode.trim().toUpperCase());
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player || room.hostId !== player.id) return;
    setTeamMode(room.code, enabled);
    broadcastRoom(room.code);
  });

  // ─── Play Again ───────────────────────────────────────────────────────
  socket.on('play_again', ({ roomCode, playerId }: { roomCode: string; playerId?: string }) => {
    if (playerId) updateSocketId(playerId, socket.id);
    const room = getRoom(roomCode.trim().toUpperCase());
    if (!room) return;
    const player = room.gameState.players.find(p => p.socketId === socket.id);
    if (!player) return;
    if (room.gameState.phase !== 'gameover' && room.hostId !== player.id) return;
    resetRoom(room.code);
    startGame(room.code, socket.id, player.id);
    broadcastRoom(room.code);
  });

  // ─── Chat Message ─────────────────────────────────────────────────────
  socket.on('send_message', ({ text, playerId }: { text: string; playerId?: string }) => {
    const room = refreshAndGetRoom(socket.id, playerId);
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

  // ─── Disconnect ───────────────────────────────────────────────────────
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

// ─── Serve Static Client in Production ────────────────────────────────────────
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));
app.get('/health', (_req, res) => res.json({ status: 'ok', rooms: 'active' }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 HUNO Server running on http://localhost:${PORT}`);
});
