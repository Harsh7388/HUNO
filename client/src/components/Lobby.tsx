import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientGameState } from '../types/game';

interface Props {
  roomCode: string | null;
  gameState: ClientGameState | null;
  onCreateRoom: (username: string) => void;
  onJoinRoom: (username: string, code: string) => void;
  onStartGame: () => void;
  onToggleTeamMode: (enabled: boolean) => void;
  onLeaveRoom: () => void;
  error: string | null;
}

const Lobby: React.FC<Props> = ({ 
  roomCode, gameState, onCreateRoom, onJoinRoom, onStartGame, onToggleTeamMode, onLeaveRoom, error 
}) => {
  const [username, setUsername] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handle = (fn: () => void) => {
    if (!username.trim()) return;
    fn();
  };

  const isHost = gameState && gameState.players[0]?.id === gameState.myId;

  // Waiting Room View
  if (roomCode && gameState) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), var(--bg)',
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass"
          style={{ width: '100%', maxWidth: 460, padding: '40px', textAlign: 'center' }}
        >
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Room Code
            </span>
            <motion.h1 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              style={{ 
                fontFamily: 'Nunito', fontWeight: 900, fontSize: '3.1rem', color: '#fff', 
                letterSpacing: '0.15em', margin: '4px 0', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
            >
              {roomCode}
            </motion.h1>
            <p style={{ color: copied ? '#43a047' : 'var(--accent2)', fontSize: '0.85rem', fontWeight: 700, transition: 'color 0.3s' }}>
              {copied ? '✅ Code copied to clipboard!' : 'Click code to copy! 📎'}
            </p>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 32 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Players Joined ({gameState.players.length}/10)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gameState.players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)'
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: p.id === gameState.myId ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem', color: '#fff'
                  }}>
                    {p.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: '#fff' }}>
                    {p.username} {p.id === gameState.myId ? '(You)' : ''}
                  </span>
                  {i === 0 && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', background: 'rgba(253,216,53,0.15)', color: '#fdd835', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>HOST</span>}
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isHost && (
              <div style={{
                padding: '12px 16px', background: 'rgba(255,255,255,0.04)',
                borderRadius: 14, border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Automatic Team Mode</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>2v2 / 3v3 team play</div>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    checked={gameState.isTeamMode}
                    onChange={(e) => onToggleTeamMode(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: gameState.isTeamMode ? 'var(--accent)' : '#444',
                    transition: '0.3s', borderRadius: 24,
                  }}>
                    <span style={{
                      position: 'absolute', height: 16, width: 16, left: 4, bottom: 4,
                      backgroundColor: 'white', transition: '0.3s', borderRadius: '50%',
                      transform: gameState.isTeamMode ? 'translateX(20px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              </div>
            )}
            {!isHost && gameState.isTeamMode && (
              <div style={{ padding: '8px 12px', background: 'rgba(124,58,237,0.1)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.3)', color: 'var(--accent2)', fontSize: '0.8rem', fontWeight: 600 }}>
                👥 Team Mode is ENABLED
              </div>
            )}
          </div>

          {isHost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary"
                disabled={gameState.players.length < 2}
                onClick={onStartGame}
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
              >
                🎮 Start Game
              </button>
              <button 
                className="btn" 
                style={{ background: 'transparent', color: 'var(--muted)', fontSize: '0.8rem' }}
                onClick={onLeaveRoom}
              >
                ← Leave Room
              </button>
              {gameState.players.length < 2 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Need at least 2 players to start</p>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                ⌛ Waiting for host to start...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Home / Create / Join View
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.1) 0%, transparent 50%), var(--bg)',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: 420, padding: '48px 40px', textAlign: 'center' }}
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 88, height: 88, borderRadius: '50%',
            background: 'conic-gradient(#e84393, #fdcb6e, #00cec9, #6c5ce7, #e84393)',
            marginBottom: 20, boxShadow: '0 8px 40px rgba(124,58,237,0.5)',
          }}>
            <span style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: '1.8rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              HUNO
            </span>
          </div>
        </motion.div>

        <h1 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: '2.5rem', marginBottom: 6, background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          HUNO Online
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: 36, fontWeight: 600 }}>
          Real-time Team Multiplayer
        </p>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'rgba(229,57,53,0.15)', border: '1px solid rgba(229,57,53,0.4)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, color: '#ff6b6b', fontSize: '0.9rem' }}>
            {error}
          </motion.div>
        )}

        <div style={{ marginBottom: 20 }}>
          <input
            className="input"
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
          />
        </div>

        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div key="home" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }}
                onClick={() => setMode('create')}>
                🎮 Create Room
              </button>
              <button className="btn" style={{
                width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Nunito', fontWeight: 800
              }} onClick={() => setMode('join')}>
                🔗 Join Room
              </button>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div key="create" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button className="btn btn-success" style={{ width: '100%', padding: '14px' }}
                onClick={() => handle(() => onCreateRoom(username))}>
                ✨ Create My Room
              </button>
              <button className="btn" style={{
                background: 'transparent', color: 'var(--muted)', fontFamily: 'Nunito', fontWeight: 700
              }} onClick={() => setMode('home')}>← Back</button>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div key="join" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <input
                className="input"
                placeholder="Room code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }}
                onClick={() => handle(() => onJoinRoom(username, joinCode))}>
                🚀 Join Game
              </button>
              <button className="btn" style={{
                background: 'transparent', color: 'var(--muted)', fontFamily: 'Nunito', fontWeight: 700
              }} onClick={() => setMode('home')}>← Back</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            +2  •  +4  •  +6  •  Skip  •  Reverse  •  Swap ✨
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            opacity: 0.8
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              © 2024 HUNO. ALL COPYRIGHT RESERVED.
            </p>
            <a 
              href="https://instagram.com/harsh_vm9281" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: 'var(--accent2)', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>📸</span> Follow my Instagram: harsh_vm9281
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Lobby;
