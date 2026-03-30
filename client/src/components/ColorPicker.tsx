import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardColor } from '../types/game';

interface Props {
  onChoose: (color: CardColor) => void;
}

const COLORS: { color: CardColor; label: string; bg: string; glow: string }[] = [
  { color: 'red',    label: 'Red',    bg: 'radial-gradient(ellipse at 30% 30%, #ff6b6b, #c0392b)', glow: '#e53935' },
  { color: 'green',  label: 'Green',  bg: 'radial-gradient(ellipse at 30% 30%, #6bcf7f, #27ae60)', glow: '#43a047' },
  { color: 'blue',   label: 'Blue',   bg: 'radial-gradient(ellipse at 30% 30%, #74b9ff, #2980b9)', glow: '#1e88e5' },
  { color: 'yellow', label: 'Yellow', bg: 'radial-gradient(ellipse at 30% 30%, #ffeaa7, #f39c12)', glow: '#fdd835' },
];

const ColorPicker: React.FC<Props> = ({ onChoose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '36px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎨</div>
            <h2 style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900, fontSize: '1.4rem', color: '#fff', marginBottom: 4,
            }}>
              Choose a Color
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Select the active color for your Wild card
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {COLORS.map(({ color, label, bg, glow }, i) => (
              <motion.button
                key={color}
                id={`color-pick-${color}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.08, boxShadow: `0 0 0 3px ${glow}, 0 0 24px 6px ${glow}55` }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onChoose(color)}
                style={{
                  width: 100, height: 100,
                  borderRadius: 20,
                  background: bg,
                  border: '3px solid rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 6,
                  color: color === 'yellow' ? '#333' : '#fff',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900, fontSize: '0.95rem',
                  boxShadow: `0 4px 20px ${glow}44`,
                  outline: 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>
                  {color === 'red' ? '🔴' : color === 'green' ? '🟢' : color === 'blue' ? '🔵' : '🟡'}
                </span>
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ColorPicker;
