import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  winner: string;
  isMe: boolean;
  onPlayAgain: () => void;
}

// Simple confetti particle component
const Confetti: React.FC = () => {
  const colors = ['#e84393', '#fdcb6e', '#00cec9', '#6c5ce7', '#e53935', '#43a047', '#1e88e5', '#fdd835'];
  const pieces = Array.from({ length: 60 });

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 299 }}>
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const x = Math.random() * 100;
        const delay = Math.random() * 2;
        const dur = 2.5 + Math.random() * 2;
        const size = 6 + Math.random() * 10;
        const rotate = Math.random() * 360;
        return (
          <motion.div
            key={i}
            initial={{ y: '-10%', x: `${x}vw`, opacity: 1, rotate }}
            animate={{ y: '110vh', opacity: [1, 1, 0], rotate: rotate + 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ delay, duration: dur, ease: 'linear' }}
            style={{
              position: 'absolute', top: 0,
              width: size, height: size * 0.5,
              background: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
};

interface Props {
  winner: string;
  isMe: boolean;
  onPlayAgain: () => void;
}

const WinScreen: React.FC<Props> = ({ winner, isMe, onPlayAgain }) => {
  return (
    <>
      <Confetti />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300,
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.15 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 28,
            padding: '52px 56px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
            maxWidth: 420,
            width: '90vw',
          }}
        >
          {/* Trophy */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '5rem', lineHeight: 1 }}
          >
            {isMe ? '🏆' : '😔'}
          </motion.div>

          {isMe ? (
            <>
              <div>
                <h1 style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900, fontSize: '2.2rem',
                  background: 'linear-gradient(135deg, #fdcb6e, #e84393)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 6,
                }}>
                  {winner.startsWith('Team') ? `${winner} Wins!` : 'You Win! 🎉'}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                  {winner.startsWith('Team') ? 'Great teamwork!' : 'Incredible! You went out first!'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900, fontSize: '2rem', color: '#fff',
                  marginBottom: 6,
                }}>
                  Game Over
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                  <strong style={{ color: '#fdd835' }}>{winner}</strong> wins this round!
                </p>
              </div>
            </>
          )}

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 24px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            <span style={{ fontWeight: 700, color: '#fdd835', fontSize: '1rem' }}>
              {winner}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <motion.button
              id="play-again-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onPlayAgain}
              className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '14px 32px' }}
            >
              🔄 Play Again
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default WinScreen;
