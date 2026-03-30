import type { Card, CardColor } from '../types/game';

/** Returns true if `card` can be played on top of `topCard` given current color / pending draw state */
export function canPlay(
  card: Card,
  topCard: Card,
  currentColor: CardColor,
  pendingDraw: number,
  stackingEnabled: boolean
): boolean {
  // Wild cards are always playable (unless stacking is active and we must stack)
  if (pendingDraw > 0 && stackingEnabled) {
    // When stacking is enabled, you must play a draw card to pass the penalty
    if (topCard.type === 'draw2') return card.type === 'draw2';
    if (topCard.type === 'wild4') return card.type === 'wild4' || card.type === 'wild6';
    if (topCard.type === 'wild6') return card.type === 'wild4' || card.type === 'wild6';
  }
  if (pendingDraw > 0 && !stackingEnabled) {
    // Must draw — nothing playable
    return false;
  }

  if (card.type === 'wild' || card.type === 'wild4' || card.type === 'wild6' || card.type === 'swap') {
    return true;
  }
  // Same color (using current active color for wild top card)
  if (card.color === currentColor) return true;
  // Same type
  if (card.type === topCard.type) return true;
  // Same number
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;

  return false;
}

export function colorVar(color: CardColor): string {
  switch (color) {
    case 'red':    return 'var(--red)';
    case 'green':  return 'var(--green)';
    case 'blue':   return 'var(--blue)';
    case 'yellow': return 'var(--yellow)';
    default:       return 'var(--accent)';
  }
}
