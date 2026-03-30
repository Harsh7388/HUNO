import { Room, GameState, ClientGameState, PublicPlayer } from './types';
import { initGame } from './gameLogic';
import { shuffle } from './deck';

const rooms = new Map<string, Room>();

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function makeRoomCode(): string {
  let code = genCode();
  while (rooms.has(code)) code = genCode();
  return code;
}

export function createRoom(playerId: string, socketId: string, username: string): Room {
  const code = makeRoomCode();
  const gameState: GameState = {
    players: [{ id: playerId, socketId, username, hand: [], isConnected: true, calledUno: false }],
    deck: [],
    discardPile: [],
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: 'red',
    phase: 'lobby',
    pendingDraw: 0,
    stackingEnabled: false,
    isTeamMode: false,
    lastAction: 'Waiting for players...',
  };
  const room: Room = { code, hostId: playerId, gameState };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, playerId: string, socketId: string, username: string): { room: Room | null; error?: string } {
  const room = rooms.get(code);
  if (!room) return { room: null, error: 'Room not found' };

  const existing = room.gameState.players.find(p => p.id === playerId);
  if (existing) {
    existing.socketId = socketId;
    existing.isConnected = true;
    // If name changed, update it? (Optional, let's keep it same for now)
    return { room };
  }

  if (room.gameState.phase !== 'lobby') return { room: null, error: 'Game already in progress' };
  if (room.gameState.players.length >= 10) return { room: null, error: 'Room is full (max 10 players)' };

  room.gameState.players.push({ id: playerId, socketId, username, hand: [], isConnected: true, calledUno: false });
  return { room };
}

export function handleDisconnect(socketId: string): { room: Room; wasHost: boolean; playerId: string } | null {
  for (const room of rooms.values()) {
    const p = room.gameState.players.find(p => p.socketId === socketId);
    if (p) {
      const playerId = p.id;
      if (room.gameState.phase === 'lobby') {
        room.gameState.players = room.gameState.players.filter(x => x.socketId !== socketId);
        if (room.gameState.players.length === 0) {
          rooms.delete(room.code);
          return null;
        }
        const wasHost = room.hostId === playerId;
        if (wasHost) room.hostId = room.gameState.players[0].id;
        return { room, wasHost, playerId };
      } else {
        p.isConnected = false;
        return { room, wasHost: false, playerId };
      }
    }
  }
  return null;
}

export function removePlayer(playerId: string): { room: Room; wasHost: boolean } | null {
  for (const room of rooms.values()) {
    const p = room.gameState.players.find(p => p.id === playerId);
    if (p) {
      room.gameState.players = room.gameState.players.filter(x => x.id !== playerId);
      if (room.gameState.players.length === 0) {
        rooms.delete(room.code);
        return null;
      }
      const wasHost = room.hostId === playerId;
      if (wasHost) room.hostId = room.gameState.players[0].id;
      return { room, wasHost };
    }
  }
  return null;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomByPlayerId(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.gameState.players.some(p => p.id === playerId)) return room;
  }
  return undefined;
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.gameState.players.some(p => p.socketId === socketId)) return room;
  }
  return undefined;
}

export function startGame(code: string, socketId: string): { success: boolean; error?: string } {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found' };
  const player = room.gameState.players.find(p => p.socketId === socketId);
  if (!player || room.hostId !== player.id) return { success: false, error: 'Only the host can start the game' };
  if (room.gameState.players.length < 2) return { success: false, error: 'Need at least 2 players' };
  if (room.gameState.phase !== 'lobby') return { success: false, error: 'Game already started' };

  if (room.gameState.isTeamMode) {
    // Shuffle players and assign teams A/B alternately
    const shuffled = shuffle(room.gameState.players);
    shuffled.forEach((p, i) => {
      p.team = i % 2 === 0 ? 'A' : 'B';
    });
    room.gameState.players = shuffled;
  }

  initGame(room.gameState);
  return { success: true };
}

export function setTeamMode(code: string, enabled: boolean) {
  const room = rooms.get(code);
  if (room) room.gameState.isTeamMode = enabled;
}

export function setStacking(code: string, enabled: boolean) {
  const room = rooms.get(code);
  if (room) room.gameState.stackingEnabled = enabled;
}

export function resetRoom(code: string): { success: boolean; error?: string } {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found' };
  room.gameState.phase = 'lobby';
  room.gameState.players.forEach(p => { p.hand = []; p.calledUno = false; });
  room.gameState.deck = [];
  room.gameState.discardPile = [];
  room.gameState.pendingDraw = 0;
  room.gameState.pendingAction = undefined;
  room.gameState.winner = undefined;
  room.gameState.lastAction = 'Waiting for players...';
  return { success: true };
}

export function buildClientState(room: Room, playerId: string): ClientGameState {
  const { gameState, code, hostId } = room;
  const me = gameState.players.find(p => p.id === playerId);
  const top = gameState.discardPile[gameState.discardPile.length - 1];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const publicPlayers: PublicPlayer[] = gameState.players.map(p => ({
    id: p.id,
    username: p.username,
    cardCount: p.hand.length,
    isConnected: p.isConnected,
    calledUno: p.calledUno,
    team: p.team,
    // Show teammate's cards if in team mode
    hand: gameState.isTeamMode && me && p.team === me.team && p.id !== me.id ? p.hand : undefined,
  }));

  return {
    roomCode: code,
    hostId,
    players: publicPlayers,
    myHand: me ? me.hand : [],
    discardTop: top,
    deckCount: gameState.deck.length,
    currentColor: gameState.currentColor,
    direction: gameState.direction,
    currentPlayerId: currentPlayer?.id ?? '',
    phase: gameState.phase,
    winner: gameState.winner,
    lastAction: gameState.lastAction,
    stackingEnabled: gameState.stackingEnabled,
    isTeamMode: gameState.isTeamMode,
    pendingDraw: gameState.pendingDraw,
    myId: playerId,
    pendingAction: gameState.pendingAction,
  };
}
