import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientGameState, ChatMessage, CardColor } from '../types/game';

const SERVER_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [needColorChoice, setNeedColorChoice] = useState(false);
  const [swapTargets, setSwapTargets] = useState<{ id: string; username: string }[] | null>(null);
  const [canPlayDrawn, setCanPlayDrawn] = useState<{ card: import('../types/game').Card } | null>(null);
  const [unoPenalty, setUnoPenalty] = useState<{ username: string } | null>(null);
  const [unoCalled, setUnoCalled] = useState<{ username: string } | null>(null);

  // Stable persistent player ID (survives page reloads)
  const [playerId] = useState(() => {
    const saved = localStorage.getItem('huno_player_id');
    if (saved) return saved;
    const newId = 'p_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('huno_player_id', newId);
    return newId;
  });

  // Keep a ref so callbacks can always access the latest playerId / roomCode
  const playerIdRef = useRef(playerId);
  const roomCodeRef = useRef<string | null>(null);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    // Start with polling then upgrade to WebSocket — required for Render's proxy
    const socket = io(SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);

      // Always register with the server so stale socketIds get refreshed.
      // If we were in a room, this also lets the server fix its mapping.
      socket.emit('register', { playerId: playerIdRef.current });

      // Auto-rejoin if the player was already in a room (handles reconnects)
      const lastRoom = localStorage.getItem('huno_last_room');
      const lastName = localStorage.getItem('huno_last_name');
      if (lastRoom && lastName) {
        console.log('🔄 Auto-rejoining room:', lastRoom);
        socket.emit('join_room', {
          username: lastName,
          roomCode: lastRoom,
          playerId: playerIdRef.current,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err.message);
    });

    // ── Game events ──────────────────────────────────────────────────────
    socket.on('game_state', (state: ClientGameState) => {
      setGameState(state);
      setRoomCode(state.roomCode);
      roomCodeRef.current = state.roomCode;
    });

    socket.on('room_created', ({ roomCode: rc }: { roomCode: string }) => {
      setRoomCode(rc);
      roomCodeRef.current = rc;
      localStorage.setItem('huno_last_room', rc);
    });

    socket.on('room_joined', ({ roomCode: rc }: { roomCode: string }) => {
      setRoomCode(rc);
      roomCodeRef.current = rc;
      localStorage.setItem('huno_last_room', rc);
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.warn('Server error:', message);
      setError(message);
      if (message === 'Room not found') {
        localStorage.removeItem('huno_last_room');
        setRoomCode(null);
        roomCodeRef.current = null;
        setGameState(null);
      }
      setTimeout(() => setError(null), 4000);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('choose_color', () => setNeedColorChoice(true));

    socket.on('choose_swap_target', ({ players }: { players: { id: string; username: string }[] }) => {
      setSwapTargets(players);
    });

    socket.on('can_play_drawn', (data: { card: import('../types/game').Card }) => {
      setCanPlayDrawn(data);
      setTimeout(() => setCanPlayDrawn(null), 8000);
    });

    socket.on('uno_penalty', ({ username }: { username: string }) => {
      setUnoPenalty({ username });
      setTimeout(() => setUnoPenalty(null), 3000);
    });

    socket.on('uno_called', ({ username }: { username: string }) => {
      setUnoCalled({ username });
      setTimeout(() => setUnoCalled(null), 2500);
    });

    return () => { socket.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────
  const emit = useCallback((event: string, data: Record<string, unknown> = {}) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setError('Not connected — please wait a moment and try again.');
      setTimeout(() => setError(null), 4000);
      return false;
    }
    socket.emit(event, { ...data, playerId: playerIdRef.current });
    return true;
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const createRoom = useCallback((username: string) => {
    localStorage.setItem('huno_last_name', username);
    emit('create_room', { username });
  }, [emit]);

  const joinRoom = useCallback((username: string, code: string) => {
    localStorage.setItem('huno_last_name', username);
    emit('join_room', { username, roomCode: code.trim().toUpperCase() });
  }, [emit]);

  const startGame = useCallback(() => {
    const rc = roomCodeRef.current;
    if (rc) emit('start_game', { roomCode: rc });
  }, [emit]);

  const playCard = useCallback((cardId: string) => {
    emit('play_card', { cardId });
    setCanPlayDrawn(null);
  }, [emit]);

  const drawCard = useCallback(() => {
    emit('draw_card');
  }, [emit]);

  const callUno = useCallback(() => {
    emit('call_uno');
  }, [emit]);

  const chooseColor = useCallback((color: CardColor) => {
    emit('color_chosen', { color });
    setNeedColorChoice(false);
  }, [emit]);

  const chooseSwapTarget = useCallback((targetId: string) => {
    emit('swap_target_chosen', { targetId });
    setSwapTargets(null);
  }, [emit]);

  const sendMessage = useCallback((text: string) => {
    emit('send_message', { text });
  }, [emit]);

  const toggleStacking = useCallback((enabled: boolean) => {
    const rc = roomCodeRef.current;
    if (rc) emit('toggle_stacking', { roomCode: rc, enabled });
  }, [emit]);

  const toggleTeamMode = useCallback((enabled: boolean) => {
    const rc = roomCodeRef.current;
    if (rc) emit('toggle_team_mode', { roomCode: rc, enabled });
  }, [emit]);

  const playAgain = useCallback(() => {
    const rc = roomCodeRef.current;
    if (rc) emit('play_again', { roomCode: rc });
  }, [emit]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem('huno_last_room');
    setRoomCode(null);
    roomCodeRef.current = null;
    setGameState(null);
    window.location.reload();
  }, []);

  return {
    connected, gameState, roomCode, error, messages,
    needColorChoice, swapTargets, canPlayDrawn, unoPenalty, unoCalled,
    myId: playerId,
    createRoom, joinRoom, startGame, playCard, drawCard, callUno,
    chooseColor, chooseSwapTarget, sendMessage, toggleStacking, toggleTeamMode,
    playAgain, leaveRoom,
  };
}
