import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';

const SUGGESTED = [
  "What's our biggest active threat right now?",
  "Summarise all open incidents",
  "Which assets are currently compromised?",
  "What CVEs should we patch first?",
  "Give me a threat landscape overview",
  "Are there any signs of an APT attack?",
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e5ff' }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        gap: 14,
        marginBottom: 24,
        flexDirection: isAI ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
      }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: isAI ? 'rgba(0,229,255,0.1)' : 'rgba(177,78,255,0.1)',
        border: `1px solid ${isAI ? '#00e5ff40' : '#b14eff40'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
      }}>
        {isAI ? '🛡️' : '👤'}
      </div>
      {/* Bubble */}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
          color: isAI ? '#00e5ff' : '#b14eff', marginBottom: 6,
          letterSpacing: 1,
        }}>
          {isAI ? 'AEGIS — AI ANALYST' : 'YOU'}
        </div>
        <div style={{
          padding: '14px 18px',
          background: isAI ? 'rgba(0,229,255,0.05)' : 'rgba(177,78,255,0.05)',
          border: `1px solid ${isAI ? 'rgba(0,229,255,0.15)' : 'rgba(177,78,255,0.15)'}`,
          borderRadius: isAI ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
          fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem',
          color: '#e8edf5', lineHeight: 1.7, whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}

export default function AIAnalystPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Initializing AEGIS — Adaptive Exploration & Guidance Intelligence System.\n\nI have access to your live platform data: active threats, open incidents, compromised assets, and CVE reports.\n\nAsk me anything about your current security posture.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat', { message: query });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠ Failed to reach AEGIS. Check that the backend is running and your GROQ_API_KEY is set correctly.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>

        {/* Animated background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 32px', borderBottom: '1px solid rgba(0,229,255,0.08)',
          background: 'rgba(4,6,11,0.8)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, zIndex: 1,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
            boxShadow: '0 0 20px rgba(0,229,255,0.1)',
          }}>🛡️</div>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1rem', letterSpacing: 3, color: '#00e5ff' }}>
              AEGIS
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', marginTop: 2 }}>
              Adaptive Exploration & Guidance Intelligence System • Powered by Groq Llama 3
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#00ff88' }}>ONLINE</span>
          </div>
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '16px 32px', flexShrink: 0, zIndex: 1 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', letterSpacing: 3, marginBottom: 10 }}>
              SUGGESTED QUERIES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED.map((s, i) => (
                <motion.button key={i}
                  whileHover={{ scale: 1.03, borderColor: 'rgba(0,229,255,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '7px 14px', background: 'rgba(0,229,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.12)', borderRadius: 20,
                    color: '#8892a4', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.82rem', transition: 'all 0.2s',
                  }}>
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px 32px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.1) transparent', zIndex: 1,
        }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,229,255,0.1)', border: '1px solid #00e5ff40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🛡️</div>
              <div style={{ padding: '4px 0' }}><TypingIndicator /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 32px 24px', borderTop: '1px solid rgba(0,229,255,0.08)',
          background: 'rgba(4,6,11,0.6)', backdropFilter: 'blur(20px)', flexShrink: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask AEGIS about your threat landscape..."
              rows={2}
              style={{
                flex: 1, background: 'rgba(13,19,32,0.8)', border: '1px solid rgba(0,229,255,0.12)',
                borderRadius: 14, padding: '12px 16px', fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.95rem', color: '#e8edf5', outline: 'none', resize: 'none',
                lineHeight: 1.6, transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.12)'}
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '14px 22px', background: input.trim() && !loading ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${input.trim() && !loading ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 14, color: input.trim() && !loading ? '#00e5ff' : '#4a5568',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2,
                transition: 'all 0.2s', flexShrink: 0,
              }}>
              {loading ? '...' : 'ASK ▶'}
            </motion.button>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', marginTop: 8, paddingLeft: 2 }}>
            Enter to send · Shift+Enter for new line · Queries include live platform context
          </div>
        </div>
      </div>
    </div>
  );
}
