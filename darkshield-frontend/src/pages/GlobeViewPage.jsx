import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import CyberGlobe from '../components/CyberGlobe';
import API from '../api/axios';

export default function GlobeViewPage() {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, active: 0 });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [threatsRes, statsRes] = await Promise.all([
        API.get('/threats'),
        API.get('/dashboard/stats')
      ]);
      setThreats(threatsRes.data);
      setStats({
        total: statsRes.data.totalThreats || 0,
        critical: statsRes.data.criticalThreats || 0,
        high: statsRes.data.activeThreats || 0,
        active: statsRes.data.openIncidents || 0,
      });
      setLastUpdate(new Date());
    } catch (err) { console.error('Globe data fetch failed', err); }
  }, []);

  useEffect(() => {
    fetchData();
    let interval;
    if (isLive) {
      interval = setInterval(fetchData, 5000); // refresh every 5 seconds
    }
    return () => clearInterval(interval);
  }, [fetchData, isLive]);

  const geoThreats = threats.filter(t => t.sourceLatitude && t.targetLatitude);
  const sevColor = (s) => s === 'CRITICAL' ? '#ff003c' : s === 'HIGH' ? '#ff6d00' : s === 'MEDIUM' ? '#b14eff' : '#00ff88';

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>

        {/* Full-screen 3D Globe */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CyberGlobe threats={threats} />
        </div>

        {/* Top HUD Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(180deg, rgba(4,6,11,0.9) 0%, transparent 100%)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: 3 }}>
              GLOBAL <span style={{ color: 'var(--neon-green)' }}>THREAT MAP</span>
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: 2 }}>
              REAL-TIME CYBER ATTACK VISUALIZATION
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setIsLive(!isLive)} style={{
              padding: '8px 18px', borderRadius: 8, border: `1px solid ${isLive ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: isLive ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
              color: isLive ? '#00ff88' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? '#00ff88' : 'var(--text-muted)', boxShadow: isLive ? '0 0 10px #00ff88' : 'none', animation: isLive ? 'pulse-red 2s infinite' : 'none' }} />
              {isLive ? 'LIVE' : 'PAUSED'}
            </button>
            <button onClick={fetchData} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,229,255,0.3)',
              background: 'rgba(0,229,255,0.08)', color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, cursor: 'pointer'
            }}>
              ↻ REFRESH
            </button>
          </div>
        </div>

        {/* Stats HUD — Bottom Left */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{
          position: 'absolute', bottom: 32, left: 32, zIndex: 10,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
        }}>
          {[
            { value: stats.total, label: 'TOTAL THREATS', color: 'var(--neon-cyan)' },
            { value: stats.critical, label: 'CRITICAL', color: 'var(--neon-red)' },
            { value: geoThreats.length, label: 'GEO-TRACKED', color: 'var(--neon-green)' },
            { value: stats.active, label: 'OPEN INCIDENTS', color: 'var(--neon-purple)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(4,6,11,0.85)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(20px)', minWidth: 130
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Live Feed — Bottom Right */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} style={{
          position: 'absolute', bottom: 32, right: 32, zIndex: 10, width: 360,
          background: 'rgba(4,6,11,0.85)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '18px 20px', backdropFilter: 'blur(20px)', maxHeight: 300, overflow: 'auto'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>LIVE THREAT FEED</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--neon-green)' }}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          {threats.slice(0, 8).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {t.sourceCountry || t.sourceIp || '—'} → {t.targetIp || 'internal'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: '0.6rem', fontWeight: 700,
                  fontFamily: 'var(--font-display)', color: sevColor(t.severity),
                  background: `${sevColor(t.severity)}18`, border: `1px solid ${sevColor(t.severity)}40`
                }}>{t.severity}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: sevColor(t.severity) }}>{t.threatScore}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Timestamp */}
        <div style={{ position: 'absolute', top: 80, left: 32, zIndex: 10, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: 1 }}>
          LAST SYNC: {lastUpdate.toLocaleTimeString()} • {geoThreats.length} ARCS RENDERED
        </div>
      </div>
    </div>
  );
}
