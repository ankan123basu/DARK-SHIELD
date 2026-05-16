import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';

// ── Channels ─────────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'all',      label: '# ALL HANDS', icon: '🌐', color: '#00e5ff', desc: 'Everyone' },
  { id: 'hunters',  label: '# HUNTERS',   icon: '🎯', color: '#ff003c', desc: 'Role: Hunter' },
  { id: 'analysts', label: '# ANALYSTS',  icon: '📡', color: '#00ff88', desc: 'Role: Analyst' },
  { id: 'admins',   label: '# ADMINS',    icon: '⚙️', color: '#b14eff', desc: 'Role: Admin' },
];

// ── Channel Themes (neon variants) ───────────────────────────────────────────
const THEMES = [
  { id: 'matrix',  name: 'Matrix',    bg: 'rgba(0,255,136,0.03)',  border: '#00ff8820' },
  { id: 'cyber',   name: 'Cyber',     bg: 'rgba(0,229,255,0.03)', border: '#00e5ff20' },
  { id: 'crimson', name: 'Crimson',   bg: 'rgba(255,0,60,0.03)',  border: '#ff003c20' },
  { id: 'void',    name: 'Void',      bg: 'rgba(177,78,255,0.03)', border: '#b14eff20' },
];

// ── Emojis ───────────────────────────────────────────────────────────────────
const EMOJIS = ['😀','😂','😎','🔥','💀','⚡','🛡️','🎯','💻','🔴','🟢','⚠️','🚨','✅','❌','👁️','🔒','🔓','💣','🕵️','📡','🌐','⚙️','🏴'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function getRoleColor(role) {
  if (!role) return '#4a5568';
  if (role.includes('ADMIN'))   return '#b14eff';
  if (role.includes('HUNTER'))  return '#ff003c';
  if (role.includes('ANALYST')) return '#00ff88';
  return '#00e5ff';
}
function getRoleBadge(role) {
  if (!role) return 'USER';
  if (role.includes('ADMIN'))  return 'ADMIN';
  if (role.includes('HUNTER')) return 'HUNTER';
  return 'ANALYST';
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff' }} />
      ))}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', marginLeft: 6 }}>
        AEGIS thinking...
      </span>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({ summary, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', backdropFilter: 'blur(24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: '1.4rem' }}>✨</span>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.85rem', letterSpacing: 3, color: '#00e5ff' }}>CHANNEL INTEL BRIEF</div>
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#c8d6e5', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
          {summary}
        </div>
        <button onClick={onClose}
          style={{ marginTop: 20, padding: '10px 24px', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 10, color: '#00e5ff', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2 }}>
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  );
}

// -- MAIN COMPONENT ------------------------------------------------------------
export default function ChatPage() {
  const username = localStorage.getItem('username') || 'user';
  const userRole = localStorage.getItem('userRole') || 'ROLE_ANALYST';

  const [activeChannel, setActiveChannel] = useState('all');
  const [dmInput, setDmInput]       = useState('');
  const [messages, setMessages]     = useState({});
  const [input, setInput]           = useState('');
  const [connected, setConnected]   = useState(false);
  const [showDMPanel, setShowDMPanel] = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTheme, setActiveTheme] = useState(THEMES[1]);
  const [showThemes, setShowThemes] = useState(false);
  const [summary, setSummary]       = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [readLang, setReadLang]     = useState('Original');
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const clientRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const addMessage = useCallback((channelId, msg) => {
    setMessages(prev => {
      const existing = prev[channelId] || [];
      const isDup = existing.some(m =>
        m.sender === msg.sender && m.content === msg.content && m.timestamp === msg.timestamp
      );
      if (isDup) return prev;
      return { ...prev, [channelId]: [...existing.slice(-199), msg] };
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const client = new Client({
      brokerURL: 'ws://localhost:9091/ws-chat',
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        CHANNELS.forEach(ch => {
          client.subscribe(`/topic/chat/${ch.id}`, frame => {
            try { addMessage(ch.id, JSON.parse(frame.body)); } catch {}
          });
        });
        client.subscribe(`/topic/chat/dm/${username}`, frame => {
          try {
            const msg = JSON.parse(frame.body);
            addMessage(`dm_${msg.sender === username ? msg.recipient : msg.sender}`, msg);
          } catch {}
        });
        client.publish({ destination: '/app/chat.join',
          body: JSON.stringify({ channel: 'all', sender: username, senderRole: userRole }) });
      },
      onDisconnect: () => setConnected(false),
      onStompError:  () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [username, userRole, addMessage]);

  useEffect(() => {
    const load = async () => {
      try {
        if (activeChannel.startsWith('dm_')) {
          const res = await API.get(`/chat/history/dm/${activeChannel.replace('dm_', '')}`);
          setMessages(prev => ({ ...prev, [activeChannel]: res.data }));
        } else {
          const res = await API.get(`/chat/history/${activeChannel}`);
          setMessages(prev => ({ ...prev, [activeChannel]: res.data }));
        }
      } catch {}
    };
    load();
  }, [activeChannel]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChannel]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        type: 'CHAT',
        channel: activeChannel.startsWith('dm_') ? 'dm' : activeChannel,
        sender: username, senderRole: userRole, content: text,
        recipient: activeChannel.startsWith('dm_') ? activeChannel.replace('dm_', '') : undefined,
      }),
    });
    setInput(''); setShowEmoji(false); inputRef.current?.focus();
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome.'); return; }
    const r = new SR(); r.lang = 'en-US'; r.continuous = false;
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onresult = e => setInput(p => p + ' ' + e.results[0][0].transcript);
    r.start();
  };

  const handleSummarize = async () => {
    const msgs = messages[activeChannel] || [];
    if (!msgs.length) return;
    setSummarizing(true);
    try {
      const res = await API.post('/ai/summarize', { messages: msgs });
      setSummary(res.data.summary);
    } catch { setSummary('Could not reach AEGIS.'); } finally { setSummarizing(false); }
  };

  const startDM = () => {
    const t = dmInput.trim();
    if (!t || t === username) return;
    setActiveChannel(`dm_${t}`); setShowDMPanel(false); setDmInput('');
  };

  const currentMsgs    = messages[activeChannel] || [];
  const currentChannel = CHANNELS.find(c => c.id === (activeChannel.startsWith('dm_') ? 'dm' : activeChannel));
  const accent         = currentChannel?.color || '#00e5ff';

  // Live Translation
  const LANGUAGES = ['Original','English','Hindi','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Spanish','French','Arabic','Russian','Japanese','Chinese'];

  const handleLangChange = async (lang) => {
    setReadLang(lang);
    if (lang === 'Original' || lang === 'English') { setTranslations({}); return; }
    setTranslating(true);
    const newT = {};
    for (const msg of currentMsgs.filter(m => m.type !== 'JOIN' && m.type !== 'SYSTEM')) {
      const key = msg.sender + '_' + msg.timestamp;
      try {
        const res = await API.post('/translate', { text: msg.content, targetLang: lang });
        newT[key] = res.data.translation;
      } catch { newT[key] = ''; }
    }
    setTranslations(newT);
    setTranslating(false);
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content" style={{ padding: 0, display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Left: Channel List ────────────────────────────── */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(4,6,11,0.6)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)' }}>
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 3, color: '#4a5568' }}>SOC COMMS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#00ff88' : '#ff003c', boxShadow: connected ? '0 0 8px #00ff88' : 'none' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: connected ? '#00ff88' : '#ff003c' }}>{connected ? 'CONNECTED' : 'OFFLINE'}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', letterSpacing: 3, padding: '0 8px', marginBottom: 8 }}>CHANNELS</div>
            {CHANNELS.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeChannel === ch.id ? `${ch.color}12` : 'transparent', borderLeft: activeChannel === ch.id ? `2px solid ${ch.color}` : '2px solid transparent', marginBottom: 2, transition: 'all 0.15s', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem' }}>{ch.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: activeChannel === ch.id ? ch.color : '#8892a4', letterSpacing: 0.5 }}>{ch.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748' }}>{ch.desc}</div>
                </div>
              </button>
            ))}

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', letterSpacing: 3, padding: '12px 8px 8px', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)' }}>DIRECT MESSAGES</div>
            <button onClick={() => setShowDMPanel(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px dashed rgba(255,214,0,0.15)', cursor: 'pointer', background: 'transparent', color: '#ffd600', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', marginBottom: 4 }}>+ NEW DM</button>
            {Object.keys(messages).filter(k => k.startsWith('dm_')).map(k => {
              const peer = k.replace('dm_', '');
              return (
                <button key={k} onClick={() => setActiveChannel(k)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeChannel === k ? 'rgba(255,214,0,0.08)' : 'transparent', borderLeft: activeChannel === k ? '2px solid #ffd600' : '2px solid transparent', marginBottom: 2, transition: 'all 0.15s' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#ffd600', flexShrink: 0 }}>{peer[0]?.toUpperCase()}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: activeChannel === k ? '#ffd600' : '#8892a4' }}>{peer}</span>
                </button>
              );
            })}
          </div>

          {/* Cool 3D Cyber Core Animation in Sidebar */}
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', perspective: 800 }}>
            <motion.div animate={{ rotateY: [0, 360], rotateX: [0, 360] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ width: 50, height: 50, transformStyle: 'preserve-3d', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(0, 229, 255, 0.4)', background: 'rgba(0, 229, 255, 0.05)', boxShadow: '0 0 15px rgba(0,229,255,0.2) inset' }} />
              <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255, 0, 60, 0.4)', background: 'rgba(255, 0, 60, 0.05)', transform: 'rotateY(90deg)' }} />
              <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255, 214, 0, 0.4)', background: 'rgba(255, 214, 0, 0.05)', transform: 'rotateX(90deg)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 20, borderRadius: '50%', background: '#00e5ff', filter: 'blur(8px)', opacity: 0.7 }} />
            </motion.div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${getRoleColor(userRole)}20`, border: `1px solid ${getRoleColor(userRole)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: getRoleColor(userRole), flexShrink: 0 }}>{username[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#e8edf5' }}>{username}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: getRoleColor(userRole) }}>{getRoleBadge(userRole)}</div>
            </div>
          </div>
        </div>

        {/* ── Right: Chat Area ─────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: activeTheme.bg, position: 'relative' }}>
          
          {/* Immersive 3D Animated Cyber Background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {/* Moving Grid */}
            <motion.div animate={{ y: [0, 60] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              style={{ width: '100%', height: '200%', backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', position: 'absolute', top: '-100%' }} />
            
            {/* Giant 3D Wireframe Globe */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', perspective: 1500, opacity: 0.1 }}>
              <motion.div animate={{ rotateY: 360, rotateX: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                style={{ width: 700, height: 700, transformStyle: 'preserve-3d' }}>
                 <div style={{ position: 'absolute', inset: 0, border: '4px solid #00e5ff', borderRadius: '50%' }} />
                 <div style={{ position: 'absolute', inset: 0, border: '4px solid #00e5ff', borderRadius: '50%', transform: 'rotateX(90deg)' }} />
                 <div style={{ position: 'absolute', inset: 0, border: '4px solid #00e5ff', borderRadius: '50%', transform: 'rotateY(90deg)' }} />
                 <div style={{ position: 'absolute', inset: 0, border: '2px dashed #ff003c', borderRadius: '50%', transform: 'rotateX(45deg) rotateY(45deg)' }} />
                 <div style={{ position: 'absolute', inset: 0, border: '2px dashed #ff003c', borderRadius: '50%', transform: 'rotateX(-45deg) rotateY(-45deg)' }} />
              </motion.div>
            </div>
            
            {/* Floating Cyber Particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div key={`bg-part-${i}`}
                initial={{ left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', opacity: Math.random() * 0.5 + 0.2 }}
                animate={{ top: [null, `-${Math.random() * 20 + 10}%`] }}
                transition={{ duration: Math.random() * 20 + 15, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', width: Math.random() * 4 + 1, height: Math.random() * 4 + 1, borderRadius: '50%', background: i % 3 === 0 ? '#ff003c' : '#00e5ff', boxShadow: `0 0 10px ${i % 3 === 0 ? '#ff003c' : '#00e5ff'}` }} />
            ))}
          </div>

          {/* Header with tools */}
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${activeTheme.border}`, background: 'rgba(8,12,20,0.5)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative', zIndex: 10 }}>
            <span style={{ fontSize: '1.1rem' }}>{activeChannel.startsWith('dm_') ? '🔒' : (currentChannel?.icon || '🌐')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', letterSpacing: 2, color: accent }}>{activeChannel.startsWith('dm_') ? `DM → ${activeChannel.replace('dm_','')}` : currentChannel?.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', marginTop: 2 }}>{activeChannel.startsWith('dm_') ? 'Encrypted private channel' : currentChannel?.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Theme picker toggle */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowThemes(p => !p)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#8892a4', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem' }}>🎨 Theme</button>
                {showThemes && (
                  <div style={{ position: 'absolute', top: 36, right: 0, background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, zIndex: 50, minWidth: 140 }}>
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => { setActiveTheme(t); setShowThemes(false); }} style={{ width: '100%', padding: '6px 10px', background: activeTheme.id === t.id ? 'rgba(0,229,255,0.1)' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: activeTheme.id === t.id ? '#00e5ff' : '#8892a4', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', textAlign: 'left', marginBottom: 2 }}>{activeTheme.id === t.id ? '✓ ' : '  '}{t.name}</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Summarize button */}
              <button onClick={handleSummarize} disabled={summarizing} style={{ padding: '6px 12px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8, color: '#00e5ff', cursor: summarizing ? 'wait' : 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem' }}>{summarizing ? '...' : '✨ Summarize'}</button>
              {/* Language selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,255,136,0.04)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,255,136,0.12)' }}>
                <span style={{ fontSize: '0.75rem' }}>🌐</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4a5568' }}>Read in:</span>
                <select value={readLang} onChange={e => handleLangChange(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#00ff88', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', cursor: 'pointer', outline: 'none' }}>
                  {LANGUAGES.map(l => <option key={l} value={l} style={{ background: '#0a0e17', color: '#e8edf5' }}>{l}</option>)}
                </select>
                {translating && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: '#00ff88' }}>...</span>}
              </div>
              {/* Translation ON/OFF toggle (like reference) */}
              <button onClick={() => setShowTranslation(p => !p)}
                style={{ padding: '6px 12px', background: showTranslation ? 'rgba(177,78,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showTranslation ? 'rgba(177,78,255,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: showTranslation ? '#b14eff' : '#4a5568', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', transition: 'all 0.2s' }}>
                {showTranslation ? '🌐 Translation ON' : '🌐 Translation OFF'}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.1) transparent' }}>
            {currentMsgs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#2d3748', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📡</div>
                <div>No messages yet. Start the transmission.</div>
              </div>
            )}
            {currentMsgs.map((msg, i) => {
              const isOwn = msg.sender === username;
              const isSystem = msg.type === 'JOIN' || msg.type === 'LEAVE' || msg.type === 'SYSTEM';
              const rc = getRoleColor(msg.senderRole);
              if (isSystem) return (<div key={i} style={{ textAlign: 'center', padding: '4px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#2d3748' }}>— {msg.content} —</div>);
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${rc}18`, border: `1px solid ${rc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: rc, flexShrink: 0, alignSelf: 'flex-end' }}>{msg.sender?.[0]?.toUpperCase()}</div>
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: rc, fontWeight: 700 }}>{msg.sender}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', background: `${rc}12`, padding: '1px 6px', borderRadius: 4 }}>{getRoleBadge(msg.senderRole)}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748' }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: isOwn ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: isOwn ? `${rc}15` : 'rgba(13,19,32,0.8)', border: `1px solid ${isOwn ? rc + '30' : 'rgba(255,255,255,0.05)'}`, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#e8edf5', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {msg.content}
                      {showTranslation && readLang !== 'Original' && translations[msg.sender + '_' + msg.timestamp] && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: '#00ff88', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <span style={{ fontSize: '0.65rem', flexShrink: 0, marginTop: 2 }}>🌐</span>
                          <span>{translations[msg.sender + '_' + msg.timestamp]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(4,6,11,0.6)', position: 'relative', zIndex: 10, backdropFilter: 'blur(10px)' }}>
            {/* Emoji picker */}
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{ position: 'absolute', bottom: 80, right: 24, background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 14px', zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 6, width: 260, boxSizing: 'border-box', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { setInput(p => p + e); setShowEmoji(false); inputRef.current?.focus(); }}
                      style={{ fontSize: '1.1rem', padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, transition: 'background 0.15s' }}
                      onMouseEnter={ev => ev.target.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={ev => ev.target.style.background = 'transparent'}>{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Emoji toggle */}
              <button onClick={() => setShowEmoji(p => !p)} style={{ padding: '10px', background: showEmoji ? 'rgba(0,229,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: showEmoji ? '#00e5ff' : '#4a5568', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, transition: 'all 0.2s' }}>😊</button>
              {/* Voice */}
              <button onClick={startVoice} style={{ padding: '10px', background: isListening ? 'rgba(255,0,60,0.15)' : 'transparent', border: `1px solid ${isListening ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, color: isListening ? '#ff003c' : '#4a5568', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0, transition: 'all 0.2s', animation: isListening ? 'pulse 1s infinite' : 'none' }}>🎙️</button>
              {/* Text input */}
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={connected ? `Message ${activeChannel.startsWith('dm_') ? activeChannel.replace('dm_','') : '#'+activeChannel}...` : 'Connecting...'}
                disabled={!connected}
                style={{ flex: 1, background: 'rgba(13,19,32,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#e8edf5', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = accent + '50'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              {/* Send */}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={sendMessage} disabled={!connected || !input.trim()}
                style={{ padding: '12px 20px', background: connected && input.trim() ? `${accent}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${connected && input.trim() ? accent + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: connected && input.trim() ? accent : '#4a5568', cursor: connected && input.trim() ? 'pointer' : 'default', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 2, transition: 'all 0.2s', flexShrink: 0 }}>SEND ▶</motion.button>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', marginTop: 6, paddingLeft: 4 }}>Enter to send · Shift+Enter new line · 🎙️ Voice · ✨ AI Summarize</div>
          </div>
        </div>
      </div>

      {/* DM Modal */}
      <AnimatePresence>
        {showDMPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDMPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 20, padding: 32, width: 380, backdropFilter: 'blur(20px)' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.9rem', letterSpacing: 3, color: '#ffd600', marginBottom: 20 }}>DIRECT MESSAGE</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8892a4', fontSize: '0.9rem', marginBottom: 16 }}>Enter the username to DM:</div>
              <input value={dmInput} onChange={e => setDmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && startDM()} placeholder="e.g. hunter, analyst, admin" autoFocus
                style={{ width: '100%', background: 'rgba(13,19,32,0.8)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 10, padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#e8edf5', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDMPanel(false)} style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#4a5568', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem' }}>CANCEL</button>
                <button onClick={startDM} style={{ flex: 1, padding: 10, background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', borderRadius: 10, color: '#ffd600', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem' }}>START DM</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} />}
      </AnimatePresence>
    </div>
  );
}
