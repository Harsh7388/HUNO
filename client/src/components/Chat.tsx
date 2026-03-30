import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../types/game';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isTeamMode: boolean;
}

const Chat: React.FC<Props> = ({ messages, onSend, isTeamMode }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', gap: 0,
    }}>
      <div style={{
        fontSize: '0.65rem', color: isTeamMode ? 'var(--accent2)' : 'var(--muted)', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '10px 12px 6px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{isTeamMode ? '👥' : '💬'}</span> {isTeamMode ? 'Team Chat' : 'Global Chat'}
      </div>

      {/* Message list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>
              No messages yet…
            </p>
          )}
          {messages.map((msg) => {
            const isSystem = msg.username === 'System';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isSystem ? 0 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  alignSelf: isSystem ? 'center' : 'flex-start',
                  maxWidth: '90%',
                }}
              >
                {isSystem ? (
                  <div style={{
                    fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic',
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                    padding: '3px 10px', textAlign: 'center',
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '5px 10px',
                    borderLeft: '3px solid var(--accent)',
                  }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--accent2)', fontWeight: 700, marginBottom: 2 }}>
                      {msg.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px 10px',
        display: 'flex', gap: 6,
      }}>
        <input
          id="chat-input"
          className="input"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
          placeholder={isTeamMode ? "Message team…" : "Type a message…"}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          maxLength={200}
        />
        <button
          id="chat-send-btn"
          className="btn btn-primary btn-sm"
          onClick={send}
          style={{ padding: '8px 14px', flexShrink: 0 }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat;
