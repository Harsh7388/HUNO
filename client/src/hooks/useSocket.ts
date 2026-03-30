import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientGameState, ChatMessage, CardColor } from '../types/game';

const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [needColorChoice, setNeedColorChoice] = useState(false);
  const [swapTargets, setSwapTargets] = useState<{ id: string; username: string }[] | null>(null);
  const [canPlayDrawn, setCanPlayDrawn] = useState<{ card: import('../types/game').Card } | null>(null);
  const [unoPenalty, setUnoPenalty] = useState<{ username: string } | null>(null);
  const [unoCalled, setUnoCalled] = useState<{ username: string } | null>(null);

  // Persistent Player ID
  const [playerId] = useState(() => {
    const saved = localStorage.getItem('huno_player_id');
    if (saved) return saved;
    const newId = 'p_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('huno_player_id', newId);
    return newId;
  });

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('game_state', (state: ClientGameState) => {
      setGameState(state);
      setRoomCode(state.roomCode);
    });
    socket.on('room_created', ({ roomCode }: { roomCode: string }) => {
      setRoomCode(roomCode);
      localStorage.setItem('huno_last_room', roomCode);
    });
    socket.on('room_joined', ({ roomCode }: { roomCode: string }) => {
      setRoomCode(roomCode);
      localStorage.setItem('huno_last_room', roomCode);
    });
    
    // Auto-rejoin on connect
    socket.on('connect', () => {
      const lastRoom = localStorage.getItem('huno_last_room');
      const lastName = localStorage.getItem('huno_last_name');
      if (lastRoom && lastName) {
        socket.emit('join_room', { username: lastName, roomCode: lastRoom, playerId });
      }
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      if (message === 'Room not found') {
        localStorage.removeItem('huno_last_room');
        setRoomCode(null);
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
  }, []);

  const createRoom = useCallback((username: string) => {
    localStorage.setItem('huno_last_name', username);
    socketRef.current?.emit('create_room', { username, playerId });
  }, [playerId]);

  const joinRoom = useCallback((username: string, code: string) => {
    localStorage.setItem('huno_last_name', username);
    socketRef.current?.emit('join_room', { username, roomCode: code, playerId });
  }, [playerId]);

  const startGame = useCallback(() => {
    if (roomCode) socketRef.current?.emit('start_game', { roomCode });
  }, [roomCode]);

  const playCard = useCallback((cardId: string) => {
    socketRef.current?.emit('play_card', { cardId });
    setCanPlayDrawn(null);
  }, []);

  const drawCard = useCallback(() => {
    socketRef.current?.emit('draw_card');
  }, []);

  const callUno = useCallback(() => {
    socketRef.current?.emit('call_uno');
  }, []);

  const chooseColor = useCallback((color: CardColor) => {
    socketRef.current?.emit('color_chosen', { color });
    setNeedColorChoice(false);
  }, []);

  const chooseSwapTarget = useCallback((targetId: string) => {
    socketRef.current?.emit('swap_target_chosen', { targetId });
    setSwapTargets(null);
  }, []);

  const sendMessage = useCallback((text: string) => {
    socketRef.current?.emit('send_message', { text });
  }, []);

  const toggleStacking = useCallback((enabled: boolean) => {
    if (roomCode) socketRef.current?.emit('toggle_stacking', { roomCode, enabled });
  }, [roomCode]);

  const toggleTeamMode = useCallback((enabled: boolean) => {
    if (roomCode) socketRef.current?.emit('toggle_team_mode', { roomCode, enabled });
  }, [roomCode]);

  const playAgain = useCallback(() => {
    if (roomCode) socketRef.current?.emit('play_again', { roomCode });
  }, [roomCode]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem('huno_last_room');
    setRoomCode(null);
    setGameState(null);
    window.location.reload(); // Hard reset
  }, []);

  const myId = playerId;

  return {
    gameState, roomCode, error, messages, needColorChoice, swapTargets,
    canPlayDrawn, unoPenalty, unoCalled, myId,
    createRoom, joinRoom, startGame, playCard, drawCard, callUno,
    chooseColor, chooseSwapTarget, sendMessage, toggleStacking, toggleTeamMode, playAgain, leaveRoom,
  };
}
