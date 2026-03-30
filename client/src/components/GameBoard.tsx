import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientGameState, CardColor, Card as CardType, ChatMessage } from '../types/game';
import DiscardPile from './DiscardPile';
import DrawPile from './DrawPile';
import PlayerHand from './PlayerHand';
import PlayerList from './PlayerList';
import UnoButton from './UnoButton';
import Chat from './Chat';
import ColorPicker from './ColorPicker';
import WinScreen from './WinScreen';
import Card from './Card';
// ChatMessage already imported above

interface Props {
  gameState: ClientGameState;
  messages: ChatMessage[];
  needColorChoice: boolean;
  swapTargets: { id: string; username: string }[] | null;
  canPlayDrawn: { card: CardType } | null;
  unoPenalty: { username: string } | null;
  unoCalled: { username: string } | null;
  onPlayCard: (cardId: string) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onChooseColor: (color: CardColor) => void;
  onChooseSwapTarget: (id: string) => void;
  onSendMessage: (text: string) => void;
  onToggleStacking: (enabled: boolean) => void;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

const GameBoard: React.FC<Props> = ({
  gameState, messages, needColorChoice, swapTargets,
  canPlayDrawn, unoPenalty, unoCalled,
  onPlayCard, onDrawCard, onCallUno, onChooseColor,
  onChooseSwapTarget, onSendMessage, onToggleStacking, onPlayAgain, onLeaveRoom
}) => {
  const myId = gameState.myId;
  const isMyTurn = gameState.currentPlayerId === myId;
  const myPlayer = gameState.players.find(p => p.id === myId);
  const opponents = gameState.players.filter(p => p.id !== myId);
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  const canDraw = isMyTurn && !gameState.pendingAction;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr 240px',
      gridTemplateRows: '1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* ─── LEFT SIDEBAR: Players + stacking toggle ─── */}
      <div style={{
        padding: '16px 14px',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900, fontSize: '1.4rem',
            background: 'linear-gradient(135deg, #e84393, #fdcb6e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            HUNO
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '2px 8px',
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)',
            letterSpacing: '0.1em',
          }}>
            {gameState.roomCode}
          </div>
        </div>

        <PlayerList
          players={gameState.players}
          currentPlayerId={gameState.currentPlayerId}
          myId={myId}
          direction={gameState.direction}
        />

        {/* Stacking toggle (host only) */}
        {gameState.hostId === myId && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                id="stacking-toggle"
                type="checkbox"
                checked={gameState.stackingEnabled}
                onChange={e => onToggleStacking(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
                  Stack +2/+4
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                  House rule
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Last action log */}
        {gameState.lastAction && (
          <div style={{
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: '0.72rem', color: 'var(--muted)',
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            {gameState.lastAction}
          </div>
        )}
      </div>

      {/* ─── CENTER: Main game area ─── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Pending draw banner */}
        <AnimatePresence>
          {gameState.pendingDraw > 0 && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #e53935, #c62828)',
                color: '#fff', borderRadius: 50, padding: '8px 24px',
                fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1rem',
                zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(229,57,53,0.5)',
              }}
            >
              🔥 Draw +{gameState.pendingDraw} incoming!
            </motion.div>
          )}
        </AnimatePresence>

        {/* UNO toast notifications */}
        <AnimatePresence>
          {unoCalled && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              style={{
                position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #e53935, #c62828)',
                color: '#fff', borderRadius: 50, padding: '10px 28px',
                fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.3rem',
                zIndex: 11, boxShadow: '0 4px 30px rgba(229,57,53,0.6)',
              }}
            >
              🗣 {unoCalled.username} yelled HUNO!
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {unoPenalty && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              style={{
                position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,20,147,0.9)',
                color: '#fff', borderRadius: 50, padding: '10px 28px',
                fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.1rem',
                zIndex: 11, boxShadow: '0 4px 30px rgba(255,20,147,0.5)',
              }}
            >
              ⚠ {unoPenalty.username} forgot HUNO! +2 cards!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opponents row */}
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 24 }}>
          {opponents.map(opp => (
            <div key={opp.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700,
                color: opp.id === gameState.currentPlayerId ? '#fdd835' : 'var(--muted)',
                transition: 'color 0.3s',
              }}>
                {opp.id === gameState.currentPlayerId ? '▶ ' : ''}{opp.username}
                {gameState.isTeamMode && opp.team === myPlayer?.team && <span style={{ color: 'var(--accent2)', marginLeft: 6, fontSize: '0.65rem' }}>TEAMMATE</span>}
                {opp.calledUno && <span style={{ color: '#e53935', marginLeft: 4 }}>HUNO!</span>}
              </div>
              <div style={{ display: 'flex', gap: -4 }}>
                {(opp.hand || Array.from({ length: Math.min(opp.cardCount, 10) })).map((cardOrPlaceholder, i) => {
                  const isActualCard = typeof cardOrPlaceholder === 'object' && 'type' in cardOrPlaceholder;
                  return (
                    <div key={isActualCard ? cardOrPlaceholder.id : i} style={{ marginLeft: i > 0 ? -28 : 0, zIndex: i }}>
                      <Card
                        card={isActualCard ? cardOrPlaceholder : { id: `back-${opp.id}-${i}`, color: 'wild', type: 'wild' }}
                        faceDown={!isActualCard}
                        small
                      />
                    </div>
                  );
                })}
                {!opp.hand && opp.cardCount > 10 && (
                  <div style={{
                    marginLeft: 6, fontSize: '0.7rem', color: 'var(--muted)',
                    display: 'flex', alignItems: 'center',
                  }}>
                    +{opp.cardCount - 10}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Swap target picker */}
        <AnimatePresence>
          {swapTargets && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 150,
              }}
            >
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 24, padding: '34px 40px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
              }}>
                <div style={{ fontSize: '2rem' }}>🔄</div>
                <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.3rem', color: '#fff' }}>
                  Who do you want to swap hands with?
                </h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {swapTargets.map(t => (
                    <motion.button
                      key={t.id}
                      id={`swap-target-${t.id}`}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onChooseSwapTarget(t.id)}
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 800, fontSize: '1rem',
                        padding: '12px 24px', borderRadius: 14,
                        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                        color: '#fff', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                        outline: 'none',
                      }}
                    >
                      {t.username}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck area — center of board */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 36,
          padding: '24px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid var(--border)',
          borderRadius: 24,
        }}>
          <DrawPile
            deckCount={gameState.deckCount}
            canDraw={canDraw}
            onDraw={onDrawCard}
          />

          {/* Direction indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={{ rotate: gameState.direction === 1 ? [0, 10, 0] : [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '2rem' }}
            >
              {gameState.direction === 1 ? '↻' : '↺'}
            </motion.div>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600 }}>
              {gameState.direction === 1 ? 'CLOCKWISE' : 'C-CLOCKWISE'}
            </span>
          </div>

          <DiscardPile
            topCard={gameState.discardTop}
            currentColor={gameState.currentColor}
          />
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign: 'center', minHeight: 24 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={gameState.currentPlayerId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{
                fontSize: '0.85rem', fontWeight: 700,
                color: isMyTurn ? '#fdd835' : 'var(--muted)',
              }}
            >
              {isMyTurn ? '⚡ Your turn!' : `Waiting for ${currentPlayer?.username ?? '…'}`}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Player's hand */}
        <div style={{ width: '100%' }}>
          <PlayerHand
            hand={gameState.myHand}
            gameState={gameState}
            onPlayCard={onPlayCard}
            canPlayDrawn={canPlayDrawn}
          />
        </div>

        {/* UNO button */}
        <div style={{ paddingBottom: 12 }}>
          <UnoButton
            myCardCount={gameState.myHand.length}
            isMyTurn={isMyTurn}
            onCallUno={onCallUno}
          />
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR: Chat ─── */}
      <div style={{
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Chat
          messages={messages}
          onSend={onSendMessage}
          isTeamMode={gameState.isTeamMode}
        />
        
        <div style={{
          marginTop: 'auto',
          padding: '12px 0 4px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          opacity: 0.7
        }}>
          <a 
            href="https://instagram.com/harsh_vm9281" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--accent2)', 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              textDecoration: 'none',
              letterSpacing: '0.02em'
            }}
          >
            📸 IG: harsh_vm9281
          </a>
        </div>
        
        <button 
          className="btn" 
          style={{ 
            marginTop: 8, 
            background: 'rgba(229,57,53,0.1)', 
            color: '#ff6b6b', 
            fontSize: '0.65rem', 
            padding: '8px', 
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
          onClick={() => {
            if (window.confirm('Are you sure you want to leave the game?')) {
              onLeaveRoom();
            }
          }}
        >
          🚪 Leave Game
        </button>
      </div>

      {/* ─── Overlays ─── */}
      {needColorChoice && <ColorPicker onChoose={onChooseColor} />}

      {gameState.phase === 'gameover' && gameState.winner && (
        <WinScreen
          winner={gameState.winner}
          isMe={gameState.isTeamMode ? (gameState.winner === `Team ${myPlayer?.team}`) : (gameState.winner === myPlayer?.username)}
          onPlayAgain={onPlayAgain}
        />
      )}
    </div>
  );
};

export default GameBoard;
