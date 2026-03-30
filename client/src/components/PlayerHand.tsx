import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import type { Card as CardType, ClientGameState } from '../types/game';
import { canPlay } from '../utils/cardHelpers';

interface Props {
  hand: CardType[];
  gameState: ClientGameState;
  onPlayCard: (cardId: string) => void;
  canPlayDrawn: { card: CardType } | null;
}

const PlayerHand: React.FC<Props> = ({ hand, gameState, onPlayCard, canPlayDrawn }) => {
  const isMyTurn = gameState.currentPlayerId === gameState.myId;
  const top = gameState.discardTop;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>
        YOUR HAND ({hand.length} cards)
        {isMyTurn && !gameState.pendingAction && (
          <span style={{ marginLeft: 10, color: '#ffd60a', animation: 'pulse-ring 1.5s infinite' }}>● YOUR TURN</span>
        )}
      </p>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        maxWidth: '90vw', padding: '8px 0 28px',
      }}>
        <AnimatePresence>
          {hand.map((card, i) => {
            const isPlayable = isMyTurn && !gameState.pendingAction && top
              ? canPlay(card, top, gameState.currentColor, gameState.pendingDraw, gameState.stackingEnabled)
              : undefined;
            const isDrawnPlayable = canPlayDrawn?.card.id === card.id;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 40, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.7 }}
                transition={{ delay: i * 0.03, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Card
                  card={card}
                  playable={isDrawnPlayable ? true : isPlayable}
                  onClick={() => (isPlayable || isDrawnPlayable) ? onPlayCard(card.id) : undefined}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlayerHand;
