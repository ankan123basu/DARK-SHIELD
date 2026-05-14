import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform, animate, useMotionValue, useTransform as useMotionTransform } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import CyberGlobe from '../components/CyberGlobe';
import IndiaMap from '../components/IndiaMap';
import CyberTerminal from '../components/CyberTerminal';
import API from '../api/axios';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };
const fadeLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };
const fadeRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };

function AnimatedCounter({ value, color, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v)),
    });
    prevValue.current = value;
    return controls.stop;
  }, [value, decimals]);

  return (
    <span style={{ color, fontFamily: "'Orbitron', monospace", fontSize: '2rem', fontWeight: 900, lineHeight: 1, textShadow: `0 0 20px ${color}30` }}>
      {display}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, -25]);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, threatsRes, incidentsRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/threats'),
        API.get('/incidents'),
      ]);
      setStats(statsRes.data);
      // Sort: newest first (by detectedAt)
      const sorted = (threatsRes.data || []).sort((a, b) =>
        new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0)
      );
      setThreats(sorted);
      setIncidents(incidentsRes.data);
      setLastSync(new Date());
    } catch (err) { console.error('Dashboard fetch failed:', err); }
  }, []);

  useEffect(() => {
    fetchAll();
    let interval;
    if (isLive) interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll, isLive]);

  const sevColor = (s) => s === 'CRITICAL' ? '#ff003c' : s === 'HIGH' ? '#ff6d00' : s === 'MEDIUM' ? '#b14eff' : '#00ff88';
  const scoreColor = (s) => s >= 75 ? '#ff003c' : s >= 50 ? '#ff6d00' : '#00ff88';

  const statCards = [
    { value: stats?.totalThreats || 0, label: 'Total Threats', color: '#00e5ff', icon: '⚡' },
    { value: stats?.activeThreats || 0, label: 'Active', color: '#ff6d00', icon: '🔥' },
    { value: stats?.criticalThreats || 0, label: 'Critical', color: '#ff003c', icon: '☢' },
    { value: stats?.openIncidents || 0, label: 'Incidents', color: '#b14eff', icon: '⚠' },
    { value: stats?.totalAssets || 0, label: 'Assets', color: '#00ff88', icon: '◉' },
    { value: stats?.compromisedAssets || 0, label: 'Compromised', color: '#ff003c', icon: '💀' },
  ];

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content" ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Ambient Background Effects */}
        <div style={{ position: 'fixed', top: 0, right: 0, width: '50vw', height: '50vh', background: 'radial-gradient(ellipse at 80% 20%, rgba(0,229,255,0.03), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: 0, left: '260px', width: '40vw', height: '40vh', background: 'radial-gradient(ellipse at 20% 80%, rgba(0,255,136,0.02), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header with Parallax */}
        <motion.div style={{ y: parallaxY1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.8rem', fontWeight: 900, letterSpacing: 4, margin: 0 }}>
                SOC <span style={{ background: 'linear-gradient(135deg, #00ff88, #00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DASHBOARD</span>
              </h1>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', letterSpacing: 2, marginTop: 6 }}>
                DARKSHIELD CYBER THREAT INTELLIGENCE • REAL-TIME MONITORING
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setIsLive(!isLive)} style={{
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${isLive ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)'}`,
                background: isLive ? 'rgba(0,255,136,0.08)' : 'transparent',
                color: isLive ? '#00ff88' : '#4a5568',
                fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2,
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: isLive ? '0 0 20px rgba(0,255,136,0.1)' : 'none',
                transition: 'all 0.3s'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? '#00ff88' : '#4a5568', boxShadow: isLive ? '0 0 12px #00ff88' : 'none', transition: 'all 0.3s', animation: isLive ? 'pulse-red 1.5s infinite' : 'none' }} />
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', textAlign: 'right' }}>
                <div>SYNCED</div>
                <div style={{ color: '#00e5ff' }}>{lastSync.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid with Stagger */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 28, position: 'relative', zIndex: 1 }}>
          {statCards.map((s) => (
            <motion.div key={s.label} variants={fadeUp} whileHover={{ y: -6, boxShadow: `0 12px 40px ${s.color}20` }}
              style={{
                background: 'rgba(13,19,32,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '20px 18px', backdropFilter: 'blur(20px)',
                borderTop: `2px solid ${s.color}40`, cursor: 'default', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative', overflow: 'hidden'
              }}>
              {/* Subtle glow corner */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, ${s.color}10, transparent)` }} />
              <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{s.icon}</div>
              <AnimatedCounter value={s.value} color={s.color} decimals={s.label === 'Avg Score' ? 1 : 0} />
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', color: '#4a5568', letterSpacing: 2, marginTop: 8, fontWeight: 500 }}>{s.label.toUpperCase()}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Visualizations — 3 Column Layout */}
        <motion.div style={{ y: parallaxY2, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>

            {/* 3D Globe */}
            <motion.div variants={fadeLeft} initial="hidden" animate="visible"
              style={{
                background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, overflow: 'hidden', height: 380, position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
              <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 10, fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' }} />
                GLOBAL THREAT MAP
              </div>
              <div style={{ position: 'absolute', top: 14, right: 18, zIndex: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#00ff88' }}>
                {threats.filter(t => t.sourceLatitude).length} ARCS
              </div>
              <CyberGlobe threats={threats} />
            </motion.div>

            {/* India Threat Map */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, overflow: 'hidden', height: 380, position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
              <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 10, fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff003c', boxShadow: '0 0 8px #ff003c' }} />
                INDIA THREAT ZONE
              </div>
              <div style={{ padding: '36px 10px 10px', height: '100%', boxSizing: 'border-box' }}>
                <IndiaMap threats={threats} />
              </div>
            </motion.div>

            {/* Live Threat Feed */}
            <motion.div variants={fadeRight} initial="hidden" animate="visible"
              style={{
                background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, height: 380, position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
              }}>
              <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2, color: '#4a5568' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'pulse-red 1.5s infinite' }} />
                  LIVE THREAT FEED
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', padding: '2px 8px', borderRadius: 8 }}>{threats.length} TOTAL</span>
                  <span style={{ color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem' }}>MONGODB</span>
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 14px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,255,136,0.2) transparent' }}>
                <style>{`
                  .threat-feed-scroll::-webkit-scrollbar { width: 4px; }
                  .threat-feed-scroll::-webkit-scrollbar-track { background: transparent; }
                  .threat-feed-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.2); border-radius: 4px; }
                `}</style>

                {threats.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 30, color: '#4a5568', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>No threats found</div>
                )}
                {threats.map((t, i) => {
                  const ago = t.detectedAt ? (() => {
                    const mins = Math.floor((Date.now() - new Date(t.detectedAt)) / 60000);
                    if (mins < 1) return 'just now';
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    return `${Math.floor(hrs / 24)}d ago`;
                  })() : '';
                  return (
                  <motion.div key={t.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#e8edf5' }}>{t.title}</div>
                      <div style={{ fontSize: '0.65rem', color: '#4a5568', fontFamily: "'JetBrains Mono', monospace" }}>
                        {t.type} • {t.sourceCountry || '—'}
                        {ago && <span style={{ marginLeft: 8, color: '#2d3748' }}>{ago}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, fontFamily: "'Orbitron', monospace", color: sevColor(t.severity), background: `${sevColor(t.severity)}15`, border: `1px solid ${sevColor(t.severity)}30` }}>{t.severity}</span>
                      <div style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: scoreColor(t.threatScore), marginTop: 3, fontWeight: 700 }}>{t.threatScore}</div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>


        {/* Active Incidents with Parallax */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '24px 28px', position: 'relative', zIndex: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: 28
          }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 2, color: '#4a5568', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b14eff', boxShadow: '0 0 8px #b14eff' }} />
            ACTIVE INCIDENTS
          </div>
          {incidents.filter(i => i.status !== 'CLOSED').length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#4a5568', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
              No active incidents.
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>INCIDENT</th><th>SEVERITY</th><th>STATUS</th><th>ASSIGNED</th></tr></thead>
              <tbody>
                {incidents.filter(i => i.status !== 'CLOSED').map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontWeight: 600 }}>{inc.title}</td>
                    <td><span className={`badge badge-${inc.severity === 'P1' ? 'critical' : inc.severity === 'P2' ? 'high' : 'medium'}`}>{inc.severity}</span></td>
                    <td style={{ color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{inc.status}</td>
                    <td style={{ color: '#8892a4' }}>{inc.assignedTo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Score Distribution & Avg */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, position: 'relative', zIndex: 1, marginBottom: 28 }}>
          <motion.div initial="hidden" animate="visible" variants={fadeLeft} transition={{ delay: 0.5 }}
            style={{
              background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '24px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 2, color: '#4a5568', marginBottom: 18 }}>THREAT SCORE DISTRIBUTION</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
              {threats.map(t => (
                <motion.div key={t.id} initial={{ height: 0 }} animate={{ height: `${t.threatScore}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    flex: 1, borderRadius: '4px 4px 0 0',
                    background: `linear-gradient(180deg, ${scoreColor(t.threatScore)}, ${scoreColor(t.threatScore)}40)`,
                    boxShadow: `0 0 8px ${scoreColor(t.threatScore)}30`,
                    minWidth: 0, position: 'relative',
                  }}
                  title={`${t.title}: ${t.threatScore}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568' }}>
              <span>LOW RISK</span><span>HIGH RISK</span>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeRight} transition={{ delay: 0.5 }}
            style={{
              background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '24px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 2, color: '#4a5568', marginBottom: 12 }}>AVERAGE THREAT SCORE</div>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor(stats?.averageThreatScore || 0)} strokeWidth="8"
                  strokeDasharray={`${((stats?.averageThreatScore || 0) / 100) * 314} 314`}
                  strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${scoreColor(stats?.averageThreatScore || 0)})` }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '2rem', fontWeight: 900, color: scoreColor(stats?.averageThreatScore || 0) }}>{stats?.averageThreatScore || 0}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4a5568', letterSpacing: 1 }}>/ 100</div>
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', marginTop: 12 }}>
              {stats?.totalUsers || 0} OPERATORS ONLINE
            </div>
          </motion.div>
        </div>

        {/* ══ SOC TERMINAL ══ */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.7 }}
          style={{ marginTop: 28, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.75rem', fontWeight: 700, color: '#00ff88', letterSpacing: 3 }}>◈ SOC TERMINAL</div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,255,136,0.2), transparent)' }} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', letterSpacing: 2 }}>type "help" to start</div>
          </div>
          <CyberTerminal />
        </motion.div>
      </div>
    </div>
  );
}
