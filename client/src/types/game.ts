export type CardColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4' | 'wild6' | 'swap';
export type Direction = 1 | -1;
export type GamePhase = 'lobby' | 'playing' | 'gameover';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}

export interface PublicPlayer {
  id: string;
  username: string;
  cardCount: number;
  isConnected: boolean;
  calledUno: boolean;
  team?: 'A' | 'B';
  hand?: Card[];
}

export interface PendingAction {
  type: 'choose_color' | 'choose_swap_target';
  playerId: string;
}

export interface ClientGameState {
  roomCode: string;
  hostId: string;
  players: PublicPlayer[];
  myHand: Card[];
  discardTop?: Card;
  deckCount: number;
  currentColor: CardColor;
  direction: Direction;
  currentPlayerId: string;
  phase: GamePhase;
  winner?: string;
  lastAction: string;
  stackingEnabled: boolean;
  isTeamMode: boolean;
  pendingDraw: number;
  myId: string;
  pendingAction?: PendingAction;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  team?: 'A' | 'B';
}
