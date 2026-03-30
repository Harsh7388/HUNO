import { Card, CardColor, CardType } from './types';

let counter = 0;
function genId(): string {
  return `c${++counter}_${Math.random().toString(36).slice(2, 6)}`;
}

const COLORS: CardColor[] = ['red', 'green', 'blue', 'yellow'];

function mk(color: CardColor, type: CardType, value?: number): Card {
  return { id: genId(), color, type, ...(value !== undefined ? { value } : {}) };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const c of COLORS) {
    deck.push(mk(c, 'number', 0));
    for (let n = 1; n <= 9; n++) {
      deck.push(mk(c, 'number', n));
      deck.push(mk(c, 'number', n));
    }
    for (let i = 0; i < 2; i++) {
      deck.push(mk(c, 'skip'));
      deck.push(mk(c, 'reverse'));
      deck.push(mk(c, 'draw2'));
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push(mk('wild', 'wild'));
    deck.push(mk('wild', 'wild4'));
    deck.push(mk('wild', 'wild6'));
    deck.push(mk('wild', 'swap'));
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
