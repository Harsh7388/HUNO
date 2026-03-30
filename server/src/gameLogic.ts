import { Card, CardColor, GameState } from './types';
import { createDeck, shuffle } from './deck';

export function canPlay(
  card: Card,
  top: Card,
  currentColor: CardColor,
  pendingDraw: number,
  stackingEnabled: boolean
): boolean {
  if (pendingDraw > 0 && stackingEnabled) {
    return card.type === 'draw2' || card.type === 'wild4' || card.type === 'wild6';
  }
  if (pendingDraw > 0 && !stackingEnabled) return false;
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (top.type !== 'number' && card.type === top.type) return true;
  if (card.type === 'number' && top.type === 'number' && card.value === top.value) return true;
  return false;
}

export function drawFromDeck(state: GameState, count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discardPile.length <= 1) break;
      const top = state.discardPile[state.discardPile.length - 1];
      state.deck = shuffle(state.discardPile.slice(0, -1));
      state.discardPile = [top];
    }
    const c = state.deck.shift();
    if (c) drawn.push(c);
  }
  return drawn;
}

function addCards(state: GameState, playerId: string, cards: Card[]) {
  const p = state.players.find(x => x.id === playerId);
  if (p) p.hand.push(...cards);
}

export function nxt(state: GameState, skip = false): number {
  const n = state.players.length;
  let i = (state.currentPlayerIndex + state.direction + n) % n;
  if (skip) i = (i + state.direction + n) % n;
  return i;
}

export function initGame(state: GameState): void {
  state.deck = createDeck();
  state.discardPile = [];
  state.direction = 1;
  state.pendingDraw = 0;
  state.pendingAction = undefined;
  state.winner = undefined;

  for (const p of state.players) {
    p.hand = drawFromDeck(state, 7);
    p.calledUno = false;
  }

  // First card must not be wild
  let first = drawFromDeck(state, 1)[0];
  while (first && first.color === 'wild') {
    state.deck.push(first);
    state.deck = shuffle(state.deck);
    first = drawFromDeck(state, 1)[0];
  }
  state.discardPile = [first];
  state.currentColor = first.color as CardColor;
  state.currentPlayerIndex = 0;

  // Handle starting card effects
  if (first.type === 'skip') {
    state.currentPlayerIndex = nxt(state);
    state.lastAction = 'Game started! First player is skipped!';
  } else if (first.type === 'reverse') {
    state.direction = -1;
    state.lastAction = 'Game started! Reversed direction!';
  } else if (first.type === 'draw2') {
    const victim = state.players[0];
    addCards(state, victim.id, drawFromDeck(state, 2));
    state.currentPlayerIndex = nxt(state);
    state.lastAction = `Game started! ${victim.username} draws 2!`;
  } else {
    state.lastAction = 'Game started! Let the chaos begin! 🃏';
  }
  state.phase = 'playing';
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string
): { success: boolean; needsColorChoice: boolean; needsSwapTarget: boolean; error?: string; unoPenaltyId?: string } {
  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return { success: false, needsColorChoice: false, needsSwapTarget: false, error: 'Player not found' };
  if (playerIdx !== state.currentPlayerIndex) return { success: false, needsColorChoice: false, needsSwapTarget: false, error: 'Not your turn' };

  const player = state.players[playerIdx];
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) return { success: false, needsColorChoice: false, needsSwapTarget: false, error: 'Card not in hand' };

  const card = player.hand[cardIdx];
  const top = state.discardPile[state.discardPile.length - 1];

  if (!canPlay(card, top, state.currentColor, state.pendingDraw, state.stackingEnabled)) {
    return { success: false, needsColorChoice: false, needsSwapTarget: false, error: 'Cannot play this card' };
  }

  player.hand.splice(cardIdx, 1);
  state.discardPile.push(card);

  // UNO penalty check
  let unoPenaltyId: string | undefined;
  if (player.hand.length === 1 && !player.calledUno) {
    addCards(state, playerId, drawFromDeck(state, 2));
    unoPenaltyId = playerId;
    state.lastAction = `⚠️ ${player.username} forgot UNO! +2 penalty!`;
  }
  player.calledUno = false;

  if (player.hand.length === 0) {
    state.phase = 'gameover';
    if (state.isTeamMode && player.team) {
      state.winner = `Team ${player.team}`;
      state.lastAction = `🎉 Team ${player.team} wins! (${player.username} finished)`;
    } else {
      state.winner = player.username;
      state.lastAction = `🎉 ${player.username} wins!`;
    }
    return { success: true, needsColorChoice: false, needsSwapTarget: false, unoPenaltyId };
  }

  const n = state.players.length;
  let needsColorChoice = false;
  let needsSwapTarget = false;

  switch (card.type) {
    case 'number':
      state.currentColor = card.color;
      state.currentPlayerIndex = nxt(state);
      state.lastAction = `${player.username} played ${card.value}`;
      break;

    case 'skip': {
      state.currentColor = card.color;
      const vi = (state.currentPlayerIndex + state.direction + n) % n;
      state.lastAction = `${player.username} played Skip! ${state.players[vi].username} skipped!`;
      state.currentPlayerIndex = (vi + state.direction + n) % n;
      break;
    }

    case 'reverse':
      state.currentColor = card.color;
      state.direction = (state.direction * -1) as (1 | -1);
      if (n === 2) {
        state.currentPlayerIndex = nxt(state);
      } else {
        state.currentPlayerIndex = nxt(state);
      }
      state.lastAction = `${player.username} played Reverse!`;
      break;

    case 'draw2': {
      state.currentColor = card.color;
      const vi2 = (state.currentPlayerIndex + state.direction + n) % n;
      if (state.stackingEnabled) {
        state.pendingDraw += 2;
        state.currentPlayerIndex = vi2;
        state.lastAction = `${player.username} played +2! Stack: ${state.pendingDraw}! ${state.players[vi2].username} must stack or draw!`;
      } else {
        addCards(state, state.players[vi2].id, drawFromDeck(state, 2));
        state.currentPlayerIndex = (vi2 + state.direction + n) % n;
        state.lastAction = `${player.username} played +2! ${state.players[vi2].username} draws 2!`;
      }
      break;
    }

    case 'wild':
      needsColorChoice = true;
      state.pendingAction = { type: 'choose_color', playerId };
      state.lastAction = `${player.username} played Wild! Choosing color...`;
      break;

    case 'wild4': {
      const vi4 = (state.currentPlayerIndex + state.direction + n) % n;
      needsColorChoice = true;
      state.pendingAction = { type: 'choose_color', playerId };
      state.pendingDraw = state.stackingEnabled ? state.pendingDraw + 4 : 4;
      state.lastAction = `${player.username} played Wild +4! ${state.players[vi4].username} beware!`;
      break;
    }

    case 'wild6': {
      const vi6 = (state.currentPlayerIndex + state.direction + n) % n;
      needsColorChoice = true;
      state.pendingAction = { type: 'choose_color', playerId };
      state.pendingDraw = state.stackingEnabled ? state.pendingDraw + 6 : 6;
      state.lastAction = `${player.username} played Wild +6! ${state.players[vi6].username} is doomed!`;
      break;
    }

    case 'swap':
      needsSwapTarget = true;
      state.pendingAction = { type: 'choose_swap_target', playerId };
      state.lastAction = `${player.username} played Swap Hands!`;
      break;
  }

  return { success: true, needsColorChoice, needsSwapTarget, unoPenaltyId };
}

export function applyColorChoice(state: GameState, color: CardColor): { success: boolean; error?: string } {
  if (!state.pendingAction || state.pendingAction.type !== 'choose_color') {
    return { success: false, error: 'No color choice pending' };
  }
  const { playerId } = state.pendingAction;
  const player = state.players.find(p => p.id === playerId);
  const card = state.discardPile[state.discardPile.length - 1];
  const n = state.players.length;
  state.currentColor = color;
  state.pendingAction = undefined;

  if (card.type === 'wild4' || card.type === 'wild6') {
    const vi = (state.currentPlayerIndex + state.direction + n) % n;
    const victim = state.players[vi];
    if (state.stackingEnabled && state.pendingDraw > 0) {
      state.currentPlayerIndex = vi;
      state.lastAction = `${player?.username} chose ${color}! Pending draw: ${state.pendingDraw}!`;
    } else {
      const amt = state.pendingDraw;
      addCards(state, victim.id, drawFromDeck(state, amt));
      state.pendingDraw = 0;
      state.currentPlayerIndex = (vi + state.direction + n) % n;
      state.lastAction = `${player?.username} chose ${color}! ${victim.username} draws ${amt}!`;
    }
  } else {
    state.currentPlayerIndex = nxt(state);
    state.lastAction = `${player?.username} chose ${color}!`;
  }
  return { success: true };
}

export function applySwapTarget(
  state: GameState,
  requesterId: string,
  targetId: string
): { success: boolean; error?: string } {
  if (!state.pendingAction || state.pendingAction.type !== 'choose_swap_target') {
    return { success: false, error: 'No swap pending' };
  }
  const requester = state.players.find(p => p.id === requesterId);
  const target = state.players.find(p => p.id === targetId);
  if (!requester || !target) return { success: false, error: 'Player not found' };

  const tmp = requester.hand;
  requester.hand = target.hand;
  target.hand = tmp;

  state.pendingAction = undefined;
  state.currentPlayerIndex = nxt(state);
  state.lastAction = `${requester.username} swapped hands with ${target.username}!`;
  return { success: true };
}

export function drawCard(
  state: GameState,
  playerId: string
): { success: boolean; drawn: Card[]; canPlay: boolean; error?: string } {
  const playerIdx = state.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) return { success: false, drawn: [], canPlay: false, error: 'Player not found' };
  if (playerIdx !== state.currentPlayerIndex) return { success: false, drawn: [], canPlay: false, error: 'Not your turn' };

  const player = state.players[playerIdx];

  if (state.pendingDraw > 0) {
    const amt = state.pendingDraw;
    const drawn = drawFromDeck(state, amt);
    addCards(state, playerId, drawn);
    state.pendingDraw = 0;
    state.currentPlayerIndex = nxt(state);
    state.lastAction = `${player.username} absorbed the draw! +${amt} cards!`;
    return { success: true, drawn, canPlay: false };
  }

  const drawn = drawFromDeck(state, 1);
  addCards(state, playerId, drawn);
  const top = state.discardPile[state.discardPile.length - 1];
  const playable = drawn.length > 0 && canPlay(drawn[0], top, state.currentColor, 0, state.stackingEnabled);
  if (!playable) {
    state.currentPlayerIndex = nxt(state);
    state.lastAction = `${player.username} drew a card`;
  } else {
    state.lastAction = `${player.username} drew a card (can play it!)`;
  }
  return { success: true, drawn, canPlay: playable };
}
