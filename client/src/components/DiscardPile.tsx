import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType, CardColor } from '../types/game';
import Card from './Card';

interface Props {
  topCard?: CardType;
  currentColor: CardColor;
}

const DiscardPile: React.FC<Props> = ({ topCard, currentColor }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>
        DISCARD
      </span>
      <div style={{ position: 'relative', width: 72, height: 108 }}>
        {/* Color shadow glow */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: 18,
          background: `var(--${currentColor === 'wild' ? 'accent' : currentColor})`,
          opacity: 0.35,
          filter: 'blur(10px)',
          transition: 'background 0.5s',
        }} />
        <AnimatePresence mode="wait">
          {topCard && (
            <motion.div
              key={topCard.id}
              initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <Card card={topCard} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Active color indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className={`color-dot ${currentColor}`} />
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          {currentColor}
        </span>
      </div>
    </div>
  );
};

export default DiscardPile;
