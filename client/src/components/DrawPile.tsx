import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  deckCount: number;
  canDraw: boolean;
  onDraw: () => void;
}

const DrawPile: React.FC<Props> = ({ deckCount, canDraw, onDraw }) => {
  const [bumped, setBumped] = useState(false);

  const handleClick = () => {
    if (!canDraw) return;
    setBumped(true);
    onDraw();
    setTimeout(() => setBumped(false), 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>
        DRAW
      </span>
      <motion.div
        animate={bumped ? { scale: [1, 0.88, 1.08, 1] } : {}}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
        title={canDraw ? 'Draw a card' : 'Not your turn'}
        style={{
          width: 72,
          height: 108,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: canDraw
            ? '3px solid rgba(255,255,255,0.5)'
            : '3px solid rgba(255,255,255,0.15)',
          cursor: canDraw ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: canDraw
            ? '0 0 0 2px var(--accent), 0 0 20px 4px rgba(124,58,237,0.35)'
            : 'none',
          transition: 'box-shadow 0.25s, border-color 0.25s',
          filter: canDraw ? 'none' : 'brightness(0.6)',
        }}
      >
        {/* Stacked card illusion */}
        {[3, 2, 1].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 72, height: 108,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
            border: '2px solid rgba(255,255,255,0.1)',
            top: i * -2,
            left: i * 1,
            zIndex: -i,
          }} />
        ))}
        <div style={{
          width: 52,
          height: 82,
          borderRadius: 10,
          border: '2px solid rgba(255,255,255,0.2)',
          background: 'linear-gradient(135deg, #e84393 0%, #fdcb6e 33%, #00cec9 66%, #6c5ce7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: '0.9rem',
          color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}>
          HUNO
        </div>
      </motion.div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>
        {deckCount} left
      </span>
    </div>
  );
};

export default DrawPile;
