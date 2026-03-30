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

export interface Player {
  id: string;
  socketId: string;
  username: string;
  hand: Card[];
  isConnected: boolean;
  calledUno: boolean;
  team?: 'A' | 'B';
}

export interface PendingAction {
  type: 'choose_color' | 'choose_swap_target';
  playerId: string;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: Direction;
  currentColor: CardColor;
  phase: GamePhase;
  winner?: string;
  pendingDraw: number;
  stackingEnabled: boolean;
  isTeamMode: boolean;
  lastAction: string;
  pendingAction?: PendingAction;
}

export interface Room {
  code: string;
  hostId: string;
  gameState: GameState;
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
