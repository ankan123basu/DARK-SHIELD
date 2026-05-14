import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import Sidebar from '../components/Sidebar';

// ─── Channel definitions ─────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'all',      label: '# ALL HANDS',      icon: '🌐', color: '#00e5ff', desc: 'Everyone' },
  { id: 'hunters',  label: '# HUNTERS',         icon: '🎯', color: '#ff003c', desc: 'Role: Hunter' },
  { id: 'analysts', label: '# ANALYSTS',        icon: '📡', color: '#00ff88', desc: 'Role: Analyst' },
  { id: 'admins',   label: '# ADMINS',          icon: '⚙️', color: '#b14eff', desc: 'Role: Admin' },
  { id: 'dm',       label: '⊕ DIRECT MESSAGE', icon: '🔒', color: '#ffd600', desc: 'Private' },
];

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getRoleColor(role) {
  if (!role) return '#4a5568';
  if (role.includes('ADMIN'))  return '#b14eff';
  if (role.includes('HUNTER')) return '#ff003c';
  if (role.includes('ANALYST')) return '#00ff88';
  return '#00e5ff';
}

function getRoleBadge(role) {
  if (!role) return '';
  if (role.includes('ADMIN'))  return 'ADMIN';
  if (role.includes('HUNTER')) return 'HUNTER';
  return 'ANALYST';
}

export default function ChatPage() {
  const username = localStorage.getItem('username') || 'user';
  const userRole = localStorage.getItem('userRole') || 'ROLE_ANALYST';

  const [activeChannel, setActiveChannel] = useState('all');
  const [dmTarget, setDmTarget] = useState('');
  const [dmInput, setDmInput] = useState('');
  const [messages, setMessages] = useState({}); // { channelId: [msg, ...] }
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [showDMPanel, setShowDMPanel] = useState(false);

  const clientRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const addMessage = useCallback((channelId, msg) => {
    setMessages(prev => {
      const existing = prev[channelId] || [];
      // Deduplicate by content+sender+timestamp
      const isDup = existing.some(m => m.sender === msg.sender && m.content === msg.content && m.timestamp === msg.timestamp);
      if (isDup) return prev;
      return { ...prev, [channelId]: [...existing.slice(-199), msg] };
    });
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');

    const client = new Client({
      brokerURL: 'ws://localhost:9091/ws-chat',
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        // Subscribe to all channel topics
        CHANNELS.filter(c => c.id !== 'dm').forEach(ch => {
          client.subscribe(`/topic/chat/${ch.id}`, (frame) => {
            try {
              const msg = JSON.parse(frame.body);
              addMessage(ch.id, msg);
            } catch {}
          });
        });

        // Subscribe to personal DM topic
        client.subscribe(`/topic/chat/dm/${username}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            const dmKey = `dm_${msg.sender === username ? msg.recipient : msg.sender}`;
            addMessage(dmKey, msg);
          } catch {}
        });

        // Announce join
        client.publish({
          destination: '/app/chat.join',
          body: JSON.stringify({ channel: 'all', sender: username, senderRole: userRole }),
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [username, userRole, addMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !clientRef.current?.connected) return;

    const msg = {
      type: 'CHAT',
      channel: activeChannel.startsWith('dm_') ? 'dm' : activeChannel,
      sender: username,
      senderRole: userRole,
      content: text,
      recipient: activeChannel.startsWith('dm_') ? activeChannel.replace('dm_', '') : undefined,
    };

    clientRef.current.publish({ destination: '/app/chat.send', body: JSON.stringify(msg) });

    // Optimistic local add for own message
    addMessage(activeChannel, { ...msg, timestamp: new Date().toISOString() });
    setInput('');
    inputRef.current?.focus();
  };

  const startDM = () => {
    const t = dmInput.trim();
    if (!t || t === username) return;
    setDmTarget(t);
    setActiveChannel(`dm_${t}`);
    setShowDMPanel(false);
    setDmInput('');
  };

  const currentMessages = messages[activeChannel] || [];
  const currentChannel = CHANNELS.find(c =>
    activeChannel.startsWith('dm_') ? c.id === 'dm' : c.id === activeChannel
  );

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content" style={{ padding: 0, display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* ── Channel List ──────────────────────────────── */}
        <div style={{
          width: 240, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(4,6,11,0.6)', display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 3, color: '#4a5568' }}>
              SOC COMMS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#00ff88' : '#ff003c', boxShadow: connected ? '0 0 8px #00ff88' : 'none' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: connected ? '#00ff88' : '#ff003c' }}>
                {connected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Channels */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', letterSpacing: 3, padding: '0 8px', marginBottom: 8 }}>CHANNELS</div>
            {CHANNELS.filter(c => c.id !== 'dm').map(ch => {
              const unread = (messages[ch.id] || []).filter(m => m.sender !== username).length > 0;
              return (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: activeChannel === ch.id ? `${ch.color}12` : 'transparent',
                    borderLeft: activeChannel === ch.id ? `2px solid ${ch.color}` : '2px solid transparent',
                    marginBottom: 2, transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  <span style={{ fontSize: '0.85rem' }}>{ch.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: activeChannel === ch.id ? ch.color : '#8892a4', letterSpacing: 0.5 }}>
                      {ch.label}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748' }}>{ch.desc}</div>
                  </div>
                  {unread && activeChannel !== ch.id && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ch.color, boxShadow: `0 0 6px ${ch.color}`, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}

            {/* DMs section */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', letterSpacing: 3, padding: '12px 8px 8px', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)' }}>DIRECT MESSAGES</div>
            <button onClick={() => setShowDMPanel(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px dashed rgba(255,214,0,0.15)', cursor: 'pointer', background: 'transparent', color: '#ffd600', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', marginBottom: 4 }}>
              + NEW DM
            </button>
            {/* Active DM conversations */}
            {Object.keys(messages).filter(k => k.startsWith('dm_')).map(k => {
              const peer = k.replace('dm_', '');
              return (
                <button key={k} onClick={() => setActiveChannel(k)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeChannel === k ? 'rgba(255,214,0,0.08)' : 'transparent', borderLeft: activeChannel === k ? '2px solid #ffd600' : '2px solid transparent', marginBottom: 2, transition: 'all 0.15s' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#ffd600', flexShrink: 0 }}>
                    {peer.slice(0, 1).toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: activeChannel === k ? '#ffd600' : '#8892a4' }}>{peer}</span>
                </button>
              );
            })}
          </div>

          {/* Self identity */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${getRoleColor(userRole)}20`, border: `1px solid ${getRoleColor(userRole)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: getRoleColor(userRole), flexShrink: 0 }}>
              {username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#e8edf5' }}>{username}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: getRoleColor(userRole) }}>{getRoleBadge(userRole)}</div>
            </div>
          </div>
        </div>

        {/* ── Chat Area ────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Channel header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,12,20,0.5)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: '1.1rem' }}>{currentChannel?.icon}</span>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', letterSpacing: 2, color: currentChannel?.color || '#00e5ff' }}>
                {activeChannel.startsWith('dm_') ? `DM → ${activeChannel.replace('dm_', '')}` : currentChannel?.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', marginTop: 2 }}>
                {activeChannel.startsWith('dm_') ? 'Private encrypted channel' : currentChannel?.desc}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.1) transparent' }}>
            {currentMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#2d3748', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📡</div>
                <div>No messages yet. Start the transmission.</div>
              </div>
            )}
            {currentMessages.map((msg, i) => {
              const isOwn = msg.sender === username;
              const isSystem = msg.type === 'JOIN' || msg.type === 'LEAVE' || msg.type === 'SYSTEM';
              const roleColor = getRoleColor(msg.senderRole);

              if (isSystem) return (
                <div key={i} style={{ textAlign: 'center', padding: '4px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#2d3748' }}>
                  ─ {msg.content} ─
                </div>
              );

              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${roleColor}18`, border: `1px solid ${roleColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: roleColor, flexShrink: 0, alignSelf: 'flex-end' }}>
                    {msg.sender?.slice(0, 1).toUpperCase()}
                  </div>
                  {/* Bubble */}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: roleColor, fontWeight: 700 }}>{msg.sender}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', background: `${roleColor}12`, padding: '1px 6px', borderRadius: 4 }}>{getRoleBadge(msg.senderRole)}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748' }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div style={{
                      padding: '10px 14px', borderRadius: isOwn ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      background: isOwn ? `${roleColor}15` : 'rgba(13,19,32,0.8)',
                      border: `1px solid ${isOwn ? roleColor + '30' : 'rgba(255,255,255,0.05)'}`,
                      fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#e8edf5', lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(4,6,11,0.4)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={connected ? `Message ${activeChannel.startsWith('dm_') ? activeChannel.replace('dm_', '') : '#' + activeChannel}...` : 'Connecting...'}
                  disabled={!connected}
                  style={{
                    width: '100%', background: 'rgba(13,19,32,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '12px 16px', fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem', color: '#e8edf5', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = (currentChannel?.color || '#00e5ff') + '50'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={sendMessage} disabled={!connected || !input.trim()}
                style={{
                  padding: '12px 20px', background: connected && input.trim() ? `${currentChannel?.color || '#00e5ff'}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${connected && input.trim() ? (currentChannel?.color || '#00e5ff') + '40' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, color: connected && input.trim() ? (currentChannel?.color || '#00e5ff') : '#4a5568',
                  cursor: connected && input.trim() ? 'pointer' : 'default', fontFamily: "'Orbitron', monospace",
                  fontSize: '0.7rem', letterSpacing: 2, transition: 'all 0.2s', flexShrink: 0,
                }}>
                SEND ▶
              </motion.button>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#2d3748', marginTop: 6, paddingLeft: 4 }}>
              Enter to send · Shift+Enter new line
            </div>
          </div>
        </div>
      </div>

      {/* DM Initiation Modal */}
      <AnimatePresence>
        {showDMPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDMPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 20, padding: '32px', width: 380, backdropFilter: 'blur(20px)' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.9rem', letterSpacing: 3, color: '#ffd600', marginBottom: 20 }}>DIRECT MESSAGE</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8892a4', fontSize: '0.9rem', marginBottom: 16 }}>
                Enter the username of the analyst/hunter/admin you want to DM:
              </div>
              <input
                value={dmInput} onChange={e => setDmInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startDM()}
                placeholder="e.g. hunter, analyst, admin"
                autoFocus
                style={{ width: '100%', background: 'rgba(13,19,32,0.8)', border: '1px solid rgba(255,214,0,0.2)', borderRadius: 10, padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#e8edf5', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDMPanel(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#4a5568', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem' }}>CANCEL</button>
                <button onClick={startDM} style={{ flex: 1, padding: '10px', background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', borderRadius: 10, color: '#ffd600', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem' }}>START DM</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
