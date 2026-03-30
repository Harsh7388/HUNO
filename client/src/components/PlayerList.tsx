import React from 'react';
import { motion } from 'framer-motion';
import type { PublicPlayer, Direction } from '../types/game';

interface Props {
  players: PublicPlayer[];
  currentPlayerId: string;
  myId: string;
  direction: Direction;
}

const PlayerList: React.FC<Props> = ({ players, currentPlayerId, myId, direction }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        Players
        <span style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '1px 7px',
          fontSize: '0.6rem', letterSpacing: '0.06em',
        }}>
          {direction === 1 ? '↻ CW' : '↺ CCW'}
        </span>
      </div>
      {players.map((p) => {
        const isActive = p.id === currentPlayerId;
        const isMe = p.id === myId;
        return (
          <motion.div
            key={p.id}
            animate={isActive ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px',
              borderRadius: 12,
              background: isActive
                ? 'rgba(124,58,237,0.18)'
                : 'rgba(255,255,255,0.03)',
              border: isActive
                ? '1px solid rgba(124,58,237,0.5)'
                : '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.3s, border 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: 'linear-gradient(180deg, var(--accent), var(--accent2))',
                borderRadius: '3px 0 0 3px',
              }} />
            )}
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: isMe
                ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff',
              flexShrink: 0, border: isActive ? '2px solid var(--accent2)' : '2px solid transparent',
              transition: 'border 0.3s',
            }}>
              {p.username.slice(0, 1).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: isActive ? '#fff' : 'var(--muted)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                transition: 'color 0.3s',
              }}>
                {p.username}{isMe ? ' (you)' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                {/* Mini card back icons */}
                {Array.from({ length: Math.min(p.cardCount, 7) }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 9, borderRadius: 2,
                    background: 'linear-gradient(135deg, #e84393, #6c5ce7)',
                    opacity: 0.7,
                  }} />
                ))}
                {p.cardCount > 7 && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>+{p.cardCount - 7}</span>
                )}
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginLeft: 2 }}>
                  {p.cardCount} card{p.cardCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* UNO badge */}
                {p.calledUno && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      background: 'linear-gradient(135deg, #e53935, #c62828)',
                      color: '#fff', fontSize: '0.55rem', fontWeight: 900,
                      padding: '2px 6px', borderRadius: 6, letterSpacing: '0.1em',
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    HUNO!
                  </motion.div>
                )}

            {/* Turn arrow */}
            {isActive && (
              <div style={{ color: 'var(--accent2)', fontSize: '0.85rem', flexShrink: 0 }}>▶</div>
            )}
            {!p.isConnected && (
              <div style={{ color: '#e53935', fontSize: '0.65rem', flexShrink: 0 }}>✕</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlayerList;
