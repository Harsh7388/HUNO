import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import './index.css';

function App() {
  const {
    gameState, roomCode, error, messages,
    needColorChoice, swapTargets, canPlayDrawn,
    unoPenalty, unoCalled,
    createRoom, joinRoom, startGame,
    playCard, drawCard, callUno,
    chooseColor, chooseSwapTarget,
    sendMessage, toggleStacking, toggleTeamMode, playAgain, leaveRoom,
  } = useSocket();

  const inGame = gameState?.phase === 'playing' || gameState?.phase === 'gameover';

  return (
    <>
      {/* Global error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999,
              background: 'var(--surface)',
              border: '1px solid #e53935',
              borderRadius: 12,
              padding: '12px 28px',
              color: '#ff6b6b',
              fontWeight: 600,
              boxShadow: '0 4px 24px rgba(229,57,53,0.35)',
              whiteSpace: 'nowrap',
              maxWidth: '90vw',
            }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!inGame ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <Lobby
              roomCode={roomCode}
              gameState={gameState}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onStartGame={startGame}
              onToggleTeamMode={toggleTeamMode}
              onLeaveRoom={leaveRoom}
              error={error}
            />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ height: '100vh', overflow: 'hidden' }}
          >
            <GameBoard
              gameState={gameState!}
              messages={messages}
              needColorChoice={needColorChoice}
              swapTargets={swapTargets}
              canPlayDrawn={canPlayDrawn}
              unoPenalty={unoPenalty}
              unoCalled={unoCalled}
              onPlayCard={playCard}
              onDrawCard={drawCard}
              onCallUno={callUno}
              onChooseColor={chooseColor}
              onChooseSwapTarget={chooseSwapTarget}
              onSendMessage={sendMessage}
              onToggleStacking={toggleStacking}
              onPlayAgain={playAgain}
              onLeaveRoom={leaveRoom}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
