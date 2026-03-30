import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  myCardCount: number;
  isMyTurn: boolean;
  onCallUno: () => void;
}

const UnoButton: React.FC<Props> = ({ myCardCount, onCallUno }) => {
  const [clicked, setClicked] = useState(false);
  const shouldPulse = myCardCount === 1;
  const canCallNow = myCardCount <= 2 && myCardCount > 0;

  const playSound = () => {
    try {
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-7.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const handleClick = () => {
    if (!canCallNow) return;
    setClicked(true);
    playSound();
    onCallUno();
    setTimeout(() => setClicked(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <motion.button
        id="uno-btn"
        onClick={handleClick}
        disabled={!canCallNow}
        whileTap={canCallNow ? { scale: 0.88 } : {}}
        animate={shouldPulse && !clicked
          ? { scale: [1, 1.06, 1], boxShadow: [
              '0 0 0 0 rgba(229,57,53,0.7)',
              '0 0 0 14px rgba(229,57,53,0)',
              '0 0 0 0 rgba(229,57,53,0)',
            ]}
          : {}
        }
        transition={{ duration: 1.2, repeat: shouldPulse && !clicked ? Infinity : 0 }}
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: '1.25rem',
          letterSpacing: '0.12em',
          padding: '14px 36px',
          borderRadius: 50,
          border: 'none',
          cursor: canCallNow ? 'pointer' : 'not-allowed',
          background: clicked
            ? 'linear-gradient(135deg, #43a047, #2e7d32)'
            : canCallNow
              ? 'linear-gradient(135deg, #e53935, #c62828)'
              : 'rgba(255,255,255,0.08)',
          color: canCallNow ? '#fff' : 'var(--muted)',
          boxShadow: canCallNow
            ? '0 4px 24px rgba(229,57,53,0.5)'
            : 'none',
          transition: 'background 0.3s, color 0.3s, box-shadow 0.3s',
          position: 'relative',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        <AnimatePresence mode="wait">
          {clicked ? (
            <motion.span
              key="said"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              HUNO! ✓
            </motion.span>
          ) : (
            <motion.span
              key="ready"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              HUNO
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      {myCardCount <= 2 && myCardCount > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '0.7rem', color: '#ff6b6b', fontWeight: 600, textAlign: 'center' }}
        >
          {myCardCount === 1 ? '🚨 You have 1 card!' : '⚠ Click HUNO when you play your 2nd-to-last!'}
        </motion.p>
      )}
    </div>
  );
};

export default UnoButton;
