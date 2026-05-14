import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

const PROMPT = 'operator@darkshield:~$';

const HELP_TEXT = `
╔══════════════════════════════════════════════╗
║        DARKSHIELD SOC TERMINAL v1.0          ║
╚══════════════════════════════════════════════╝

  COMMANDS:
  ─────────────────────────────────────────────
  help          Show this help menu
  whoami        Current operator identity
  stats         Live dashboard statistics
  threats       List all active threats
  incidents     List open incidents
  assets        List all network assets
  top           Top 5 highest-risk threats
  scan [ip]     Simulate network scan
  ping [host]   Ping a host
  clear         Clear terminal
  exit          Minimize terminal

  SHORTCUTS:
  ↑/↓           Navigate command history
  Ctrl+L        Clear screen
  Tab           Auto-complete
`;

function typewriterEffect(setText, text, speed = 8) {
  let i = 0;
  const lines = text.split('\n');
  let lineIdx = 0;
  let charIdx = 0;
  const interval = setInterval(() => {
    if (lineIdx >= lines.length) { clearInterval(interval); return; }
    charIdx++;
    const current = lines.slice(0, lineIdx).join('\n') + (lineIdx > 0 ? '\n' : '') + lines[lineIdx].slice(0, charIdx);
    setText(current);
    if (charIdx >= lines[lineIdx].length) { lineIdx++; charIdx = 0; }
  }, speed);
  return () => clearInterval(interval);
}

export default function CyberTerminal({ defaultMinimized = false }) {
  const [history, setHistory] = useState([
    { type: 'system', text: '████████╗███████╗██████╗ ███╗   ███╗' },
    { type: 'system', text: '╚══██╔══╝██╔════╝██╔══██╗████╗ ████║' },
    { type: 'system', text: '   ██║   █████╗  ██████╔╝██╔████╔██║' },
    { type: 'system', text: '   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║' },
    { type: 'system', text: '   ██║   ███████╗██║  ██║██║ ╚═╝ ██║' },
    { type: 'system', text: '   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝' },
    { type: 'system', text: '' },
    { type: 'output', text: 'DARKSHIELD Cyber Threat Intelligence Terminal', color: '#00ff88' },
    { type: 'output', text: 'Type "help" to see available commands.', color: '#8892a4' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addOutput = useCallback((lines, color = '#e8edf5') => {
    const entries = (Array.isArray(lines) ? lines : [lines]).map(text => ({ type: 'output', text, color }));
    setHistory(h => [...h, ...entries]);
  }, []);

  const runCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const args = trimmed.split(' ');
    const base = args[0];

    setHistory(h => [...h, { type: 'command', text: cmd }]);

    if (!trimmed) return;

    setCmdHistory(h => [cmd, ...h.filter(c => c !== cmd)]);
    setHistIdx(-1);

    if (base === 'clear' || (base === 'ctrl' && args[1] === 'l')) {
      setHistory([{ type: 'output', text: 'Terminal cleared.', color: '#4a5568' }]);
      return;
    }
    if (base === 'help') { addOutput(HELP_TEXT.split('\n'), '#00e5ff'); return; }
    if (base === 'exit') { setMinimized(true); return; }

    if (base === 'whoami') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      addOutput([
        `  Operator  : ${user.username || 'unknown'}`,
        `  Role      : ${user.role?.replace('ROLE_', '') || 'UNKNOWN'}`,
        `  Session   : JWT / Stateless`,
        `  Clearance : ${user.role === 'ROLE_ADMIN' ? 'TOP SECRET' : user.role === 'ROLE_HUNTER' ? 'SECRET' : 'CONFIDENTIAL'}`,
      ], '#00ff88');
      return;
    }

    if (base === 'ping') {
      const host = args[1] || 'darkshield.io';
      addOutput([`PING ${host}: 56 bytes of data.`], '#8892a4');
      for (let i = 1; i <= 4; i++) {
        const ms = (Math.random() * 20 + 5).toFixed(2);
        await new Promise(r => setTimeout(r, 300 * i));
        addOutput([`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms`], '#00ff88');
      }
      addOutput([`--- ${host} ping statistics ---`, '4 packets transmitted, 4 received, 0% packet loss'], '#8892a4');
      return;
    }

    if (base === 'scan') {
      const ip = args[1] || '10.0.0.0/24';
      addOutput([`Starting Nmap scan on ${ip}...`, 'Host discovery enabled.'], '#ffd600');
      await new Promise(r => setTimeout(r, 800));
      addOutput([
        'PORT     STATE  SERVICE',
        '22/tcp   open   ssh',
        '80/tcp   open   http',
        '443/tcp  open   https',
        '27017/tcp open  mongodb',
        '',
        `Scan complete: 4 open ports on ${ip}`,
      ], '#00e5ff');
      return;
    }

    if (base === 'ls') {
      addOutput([
        'total 5 directories',
        'drwxr-xr-x  threats/     → Active threat intelligence',
        'drwxr-xr-x  incidents/   → Incident response queue',
        'drwxr-xr-x  assets/      → Network asset inventory',
        'drwxr-xr-x  audit_logs/  → Forensic audit trail',
        'drwxr-xr-x  users/       → Operator accounts',
      ], '#b14eff');
      return;
    }

    // API commands
    setLoading(true);
    try {
      if (base === 'stats') {
        const res = await API.get('/dashboard/stats');
        const d = res.data;
        addOutput([
          '┌─────────────────────────────────────────┐',
          '│           LIVE SOC STATISTICS            │',
          '├─────────────────────────────────────────┤',
          `│  Total Threats     : ${String(d.totalThreats).padEnd(18)}│`,
          `│  Active Threats    : ${String(d.activeThreats).padEnd(18)}│`,
          `│  Critical          : ${String(d.criticalThreats).padEnd(18)}│`,
          `│  Open Incidents    : ${String(d.openIncidents).padEnd(18)}│`,
          `│  Total Assets      : ${String(d.totalAssets).padEnd(18)}│`,
          `│  Compromised       : ${String(d.compromisedAssets).padEnd(18)}│`,
          `│  Avg Threat Score  : ${String((d.averageThreatScore||0).toFixed(1)).padEnd(18)}│`,
          '└─────────────────────────────────────────┘',
        ], '#00ff88');
      } else if (base === 'threats') {
        const res = await API.get('/threats');
        const threats = res.data.slice(0, 8);
        addOutput(['ACTIVE THREAT FEED:', '─'.repeat(60)], '#ff003c');
        threats.forEach(t => {
          const sev = t.severity === 'CRITICAL' ? '🔴' : t.severity === 'HIGH' ? '🟠' : '🟡';
          addOutput([`${sev} [${t.severity.padEnd(8)}] [${String(t.threatScore).padStart(3)}/100] ${t.title}`],
            t.severity === 'CRITICAL' ? '#ff003c' : t.severity === 'HIGH' ? '#ff6d00' : '#ffd600');
        });
        addOutput([`─`.repeat(60), `Total: ${res.data.length} threats in database`], '#4a5568');
      } else if (base === 'incidents') {
        const res = await API.get('/incidents');
        addOutput(['INCIDENT RESPONSE QUEUE:', '─'.repeat(60)], '#ff6d00');
        res.data.slice(0, 6).forEach(inc => {
          const statusColor = inc.status === 'OPEN' ? '#ff003c' : inc.status === 'CLOSED' ? '#00ff88' : '#ffd600';
          addOutput([`  [${inc.severity}] ${inc.status.padEnd(14)} ${inc.title}`], statusColor);
        });
        addOutput([`─`.repeat(60), `Total: ${res.data.length} incidents`], '#4a5568');
      } else if (base === 'assets' || base === 'top') {
        const endpoint = base === 'top' ? '/threats/top-scoring' : '/assets';
        const res = await API.get(endpoint);
        if (base === 'top') {
          addOutput(['TOP 5 HIGHEST RISK THREATS:', '─'.repeat(50)], '#ff003c');
          res.data.slice(0, 5).forEach((t, i) => {
            addOutput([`  ${i + 1}. [${t.threatScore}/100] ${t.title} (${t.severity})`],
              t.threatScore >= 75 ? '#ff003c' : '#ff6d00');
          });
        } else {
          addOutput(['NETWORK ASSET INVENTORY:', '─'.repeat(55)], '#00e5ff');
          res.data.forEach(a => {
            const statusCol = a.status === 'ONLINE' ? '#00ff88' : a.status === 'COMPROMISED' ? '#ff003c' : '#ffd600';
            addOutput([`  ${a.status.padEnd(12)} ${a.hostname.padEnd(20)} ${a.ipAddress.padEnd(15)} [Risk: ${a.riskScore}]`], statusCol);
          });
        }
      } else {
        addOutput([`bash: ${base}: command not found. Type 'help' for available commands.`], '#ff003c');
      }
    } catch (err) {
      addOutput([`Error: ${err.response?.status === 401 ? 'Unauthorized — please login first' : err.message}`], '#ff003c');
    } finally {
      setLoading(false);
    }
  }, [addOutput]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter') { runCommand(input); setInput(''); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : cmdHistory[next]);
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setHistory([]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cmds = ['help', 'whoami', 'stats', 'threats', 'incidents', 'assets', 'top', 'scan', 'ping', 'clear', 'ls', 'exit'];
      const match = cmds.find(c => c.startsWith(input));
      if (match) setInput(match);
    }
  }, [input, histIdx, cmdHistory, runCommand]);

  const getColor = (entry) => {
    if (entry.type === 'command') return '#00e5ff';
    if (entry.type === 'system') return '#00ff8840';
    return entry.color || '#e8edf5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(2, 4, 8, 0.97)',
        border: `1px solid ${focused ? 'rgba(0,255,136,0.3)' : 'rgba(0,255,136,0.1)'}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: focused ? '0 0 40px rgba(0,255,136,0.08), inset 0 0 60px rgba(0,0,0,0.5)' : '0 4px 30px rgba(0,0,0,0.5)',
        transition: 'all 0.3s', fontFamily: "'JetBrains Mono', monospace",
      }}>

      {/* Title Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'rgba(0,255,136,0.04)',
        borderBottom: '1px solid rgba(0,255,136,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff003c', cursor: 'pointer' }} onClick={() => setMinimized(true)} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffd600' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', cursor: 'pointer' }} onClick={() => setMinimized(false)} />
          <span style={{ marginLeft: 12, fontSize: '0.65rem', color: '#4a5568', letterSpacing: 2 }}>
            SOC TERMINAL — darkshield@localhost
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {loading && <span style={{ fontSize: '0.6rem', color: '#ffd600', animation: 'pulse-red 1s infinite' }}>● RUNNING</span>}
          <button onClick={() => setMinimized(m => !m)}
            style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
            {minimized ? '▲ EXPAND' : '▼ MINIMIZE'}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <AnimatePresence>
        {!minimized && (
          <motion.div initial={{ height: 0 }} animate={{ height: 320 }} exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}>
            <div
              style={{ height: 320, overflowY: 'auto', padding: '12px 16px', cursor: 'text', fontSize: '0.72rem', lineHeight: 1.8 }}
              onClick={() => inputRef.current?.focus()}>

              {/* History */}
              {history.map((entry, i) => (
                <div key={i} style={{ color: getColor(entry), whiteSpace: 'pre', display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                  {entry.type === 'command' && (
                    <span style={{ color: '#00ff88', marginRight: 8, flexShrink: 0 }}>{PROMPT}</span>
                  )}
                  <span>{entry.text}</span>
                </div>
              ))}

              {/* Input line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ color: '#00ff88', flexShrink: 0 }}>{PROMPT}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                    caretColor: '#00ff88', lineHeight: 1.8
                  }} />
              </div>
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
