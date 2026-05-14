import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';

const TYPE_ICON = { SERVER: '🖥️', WORKSTATION: '💻', FIREWALL: '🛡️', ROUTER: '📡', SWITCH: '🔀', IOT_DEVICE: '📷', DATABASE: '🗄️', CLOUD_INSTANCE: '☁️' };
const STATUS_ORDER = ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'QUARANTINED', 'COMPROMISED'];
const STATUS_STYLE = {
  ONLINE:      { color: '#00ff88', bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.2)',  pulse: true },
  OFFLINE:     { color: '#4a5568', bg: 'rgba(74,85,104,0.08)', border: 'rgba(74,85,104,0.2)',  pulse: false },
  MAINTENANCE: { color: '#b14eff', bg: 'rgba(177,78,255,0.08)', border: 'rgba(177,78,255,0.2)', pulse: false },
  QUARANTINED: { color: '#ff6d00', bg: 'rgba(255,109,0,0.08)', border: 'rgba(255,109,0,0.2)',  pulse: true },
  COMPROMISED: { color: '#ff003c', bg: 'rgba(255,0,60,0.1)',   border: 'rgba(255,0,60,0.3)',   pulse: true },
};

function RiskRing({ score }) {
  const r = 22, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#ff003c' : score >= 40 ? '#ff6d00' : '#00ff88';
  return (
    <svg width="54" height="54" style={{ flexShrink: 0 }}>
      <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 27 27)" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x="27" y="32" textAnchor="middle" fill={color}
        style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 700 }}>{score}</text>
    </svg>
  );
}

// ── Scan Result Generator ─────────────────────────────────────────────────
const CVE_POOL = ['CVE-2024-3094','CVE-2024-1086','CVE-2023-44487','CVE-2023-4966','CVE-2024-21762','CVE-2023-46805','CVE-2024-0519'];
const PORT_SERVICES = { 22:'SSH',80:'HTTP',443:'HTTPS',3306:'MySQL',5432:'PostgreSQL',27017:'MongoDB',8080:'HTTP-Alt',6379:'Redis',21:'FTP',3389:'RDP' };

function generateScanLines(asset) {
  const ports = asset.openPorts?.length ? asset.openPorts : ['22','80','443'];
  const lines = [
    { t: 0,   text: `[INIT] DarkShield Vulnerability Scanner v3.1`, color: '#00e5ff' },
    { t: 200, text: `[TARGET] ${asset.ipAddress} (${asset.hostname})`, color: '#00e5ff' },
    { t: 400, text: `[INFO] OS Detection: ${asset.operatingSystem || 'Unknown'}`, color: '#8892a4' },
    { t: 700, text: `[SCAN] Starting port enumeration...`, color: '#b14eff' },
    ...ports.map((p, i) => ({
      t: 1000 + i * 300,
      text: `[PORT] ${p}/tcp  OPEN  ${PORT_SERVICES[p] || 'UNKNOWN'}`,
      color: '#00ff88'
    })),
    { t: 1000 + ports.length * 300 + 200, text: `[CVE] Checking NVD database...`, color: '#b14eff' },
    ...((asset.vulnerabilities?.length ? asset.vulnerabilities : []).map((v, i) => ({
      t: 1000 + ports.length * 300 + 600 + i * 400,
      text: `[VULN] ${v} — CRITICAL — Patch available`,
      color: '#ff003c'
    }))),
    { t: 1000 + ports.length * 300 + 2000, text: `[RISK] Computed Risk Score: ${asset.riskScore || 0}/100`, color: asset.riskScore >= 70 ? '#ff003c' : asset.riskScore >= 40 ? '#ff6d00' : '#00ff88' },
    { t: 1000 + ports.length * 300 + 2400, text: `[DONE] Scan complete. ${asset.vulnerabilities?.length || 0} vulnerabilities found.`, color: '#00e5ff' },
  ];
  return lines;
}

function ScanModal({ asset, onClose }) {
  const [lines, setLines] = useState([]);
  const bottomRef = useRef(null);
  const allLines = generateScanLines(asset);
  const totalMs = allLines[allLines.length - 1]?.t + 600 || 3000;

  useEffect(() => {
    const timers = allLines.map(l => setTimeout(() => setLines(p => [...p, l]), l.t));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
        onClick={e => e.stopPropagation()}
        style={{ width: 600, background: 'rgba(4,6,11,0.98)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,229,255,0.08)' }}>
        {/* Title bar */}
        <div style={{ background: 'rgba(0,229,255,0.06)', borderBottom: '1px solid rgba(0,229,255,0.1)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff', animation: 'pulse-red 1s infinite' }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', letterSpacing: 2, color: '#00e5ff' }}>DARKSHIELD VULN SCANNER — {asset.hostname}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        {/* Terminal output */}
        <div style={{ height: 340, overflowY: 'auto', padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', lineHeight: 1.8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.1) transparent' }}>
          {lines.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{ color: l.color, marginBottom: 2, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#2d3748', flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</span>
              <span>{l.text}</span>
            </motion.div>
          ))}
          {lines.length < allLines.length && (
            <div style={{ color: '#00e5ff', opacity: 0.5 }}>
              <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.8 }}>█</motion.span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Progress bar */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div initial={{ width: '0%' }} animate={{ width: lines.length >= allLines.length ? '100%' : `${(lines.length / allLines.length) * 100}%` }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #00e5ff, #00ff88)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568' }}>
            <span>{lines.length >= allLines.length ? '✓ SCAN COMPLETE' : `SCANNING... ${Math.round((lines.length/allLines.length)*100)}%`}</span>
            <span>{asset.vulnerabilities?.length || 0} VULNS DETECTED</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssetCard({ asset, onEdit, onDelete, onCycleStatus, onScan }) {
  const st = STATUS_STYLE[asset.status] || STATUS_STYLE.OFFLINE;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: `0 12px 40px ${st.color}15` }}
      style={{
        background: 'rgba(8,12,20,0.8)', border: `1px solid ${st.border}`,
        borderTop: `3px solid ${st.color}`, borderRadius: 18,
        padding: '20px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: asset.status === 'COMPROMISED' ? `0 0 30px rgba(255,0,60,0.1)` : 'none',
      }}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.3rem' }}>{TYPE_ICON[asset.type] || '💻'}</span>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', fontWeight: 700, color: '#e8edf5', letterSpacing: 1 }}>{asset.hostname}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#00e5ff' }}>{asset.ipAddress}</div>
            </div>
          </div>
        </div>
        <RiskRing score={asset.riskScore || 0} />
      </div>

      {/* Status badge — clickable to cycle */}
      <button onClick={() => onCycleStatus(asset)} title="Click to change status"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20,
          cursor: 'pointer', marginBottom: 12, transition: 'all 0.2s',
        }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, boxShadow: `0 0 6px ${st.color}`, animation: st.pulse ? 'pulse-red 1.5s infinite' : 'none' }} />
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', color: st.color, letterSpacing: 2 }}>{asset.status}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: '#2d3748' }}>▼</span>
      </button>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 14 }}>
        {[
          { label: 'TYPE', value: asset.type },
          { label: 'DEPT', value: asset.department || '—' },
          { label: 'OS', value: asset.operatingSystem || '—' },
          { label: 'PORTS', value: asset.openPorts?.join(', ') || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: '#2d3748', letterSpacing: 2 }}>{label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#8892a4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* CVE vulns */}
      {asset.vulnerabilities?.length > 0 && (
        <div style={{ marginBottom: 14, padding: '8px 10px', background: 'rgba(255,0,60,0.04)', border: '1px solid rgba(255,0,60,0.1)', borderRadius: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#ff003c', letterSpacing: 2, marginBottom: 4 }}>⚠ {asset.vulnerabilities.length} VULNERABILITY{asset.vulnerabilities.length > 1 ? 'S' : ''}</div>
          {asset.vulnerabilities.slice(0, 2).map((v, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#ff6d00' }}>{v}</div>
          ))}
          {asset.vulnerabilities.length > 2 && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4a5568' }}>+{asset.vulnerabilities.length - 2} more</div>}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onScan(asset)}
          style={{ flex: 1, padding: '6px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8, color: '#00e5ff', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.55rem', letterSpacing: 1 }}>
          ⟳ SCAN
        </button>
        <button onClick={() => onEdit(asset)}
          style={{ flex: 1, padding: '6px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 8, color: '#00e5ff', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.55rem', letterSpacing: 1 }}>
          EDIT
        </button>
        <button onClick={() => onDelete(asset.id)}
          style={{ padding: '6px 10px', background: 'rgba(255,0,60,0.06)', border: '1px solid rgba(255,0,60,0.15)', borderRadius: 8, color: '#ff003c', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.55rem' }}>
          ✕
        </button>
      </div>
    </motion.div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [form, setForm] = useState({ hostname: '', ipAddress: '', type: 'SERVER', operatingSystem: '', status: 'ONLINE', department: '', riskScore: 0, openPorts: '', vulnerabilities: '' });

  const load = () => API.get('/assets').then(r => setAssets(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ hostname: '', ipAddress: '', type: 'SERVER', operatingSystem: '', status: 'ONLINE', department: '', riskScore: 0, openPorts: '', vulnerabilities: '' });
    setEditing(null); setShowModal(true);
  };
  const openEdit = (a) => {
    setForm({ ...a, openPorts: (a.openPorts || []).join(', '), vulnerabilities: (a.vulnerabilities || []).join(', ') });
    setEditing(a.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, riskScore: parseInt(form.riskScore) || 0, openPorts: form.openPorts ? form.openPorts.split(',').map(s => s.trim()).filter(Boolean) : [], vulnerabilities: form.vulnerabilities ? form.vulnerabilities.split(',').map(s => s.trim()).filter(Boolean) : [] };
    if (editing) await API.put(`/assets/${editing}`, payload);
    else await API.post('/assets', payload);
    setShowModal(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm && !window.confirm('Delete this asset?')) return;
    await API.delete(`/assets/${id}`); load();
  };

  const handleCycleStatus = async (asset) => {
    const idx = STATUS_ORDER.indexOf(asset.status);
    const nextStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    await API.put(`/assets/${asset.id}`, { ...asset, openPorts: asset.openPorts || [], vulnerabilities: asset.vulnerabilities || [], status: nextStatus });
    load();
  };

  // Stats
  const total = assets.length;
  const online = assets.filter(a => a.status === 'ONLINE').length;
  const compromised = assets.filter(a => a.status === 'COMPROMISED').length;
  const quarantined = assets.filter(a => a.status === 'QUARANTINED').length;
  const avgRisk = total ? Math.round(assets.reduce((s, a) => s + (a.riskScore || 0), 0) / total) : 0;
  const totalVulns = assets.reduce((s, a) => s + (a.vulnerabilities?.length || 0), 0);

  const filtered = filterStatus === 'ALL' ? assets : assets.filter(a => a.status === filterStatus);

  const FILTER_TABS = ['ALL', ...STATUS_ORDER];

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">ASSET <span>INVENTORY</span></h1>
          <button className="btn-primary" onClick={openCreate}>+ REGISTER ASSET</button>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'TOTAL ASSETS', value: total, color: '#00e5ff' },
            { label: 'ONLINE', value: online, color: '#00ff88' },
            { label: 'COMPROMISED', value: compromised, color: '#ff003c' },
            { label: 'QUARANTINED', value: quarantined, color: '#ff6d00' },
            { label: 'AVG RISK', value: avgRisk, color: avgRisk >= 70 ? '#ff003c' : avgRisk >= 40 ? '#ff6d00' : '#00ff88', suffix: '/100' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(8,12,20,0.6)', border: `1px solid ${s.color}18`, borderTop: `2px solid ${s.color}50`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.4rem', fontWeight: 900, color: s.color, textShadow: `0 0 20px ${s.color}30` }}>{s.value}{s.suffix || ''}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4a5568', letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vuln alert bar */}
        {totalVulns > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20, padding: '10px 18px', background: 'rgba(255,0,60,0.06)', border: '1px solid rgba(255,0,60,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#ff003c' }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            {totalVulns} UNPATCHED VULNERABILITIES across {assets.filter(a => a.vulnerabilities?.length > 0).length} assets — immediate remediation recommended
          </motion.div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(s => {
            const st = STATUS_STYLE[s];
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${filterStatus === s ? (st?.color || '#00e5ff') : 'rgba(255,255,255,0.06)'}`, background: filterStatus === s ? `${st?.color || '#00e5ff'}10` : 'transparent', color: filterStatus === s ? (st?.color || '#00e5ff') : '#4a5568', cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', letterSpacing: 1, transition: 'all 0.15s' }}>
                {s} {s !== 'ALL' && <span style={{ opacity: 0.5 }}>({assets.filter(a => a.status === s).length})</span>}
              </button>
            );
          })}
        </div>

        {/* Asset cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#2d3748', fontFamily: "'JetBrains Mono', monospace" }}>No assets registered</div>
        ) : (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(a => (
              <AssetCard key={a.id} asset={a} onEdit={openEdit} onDelete={handleDelete} onCycleStatus={handleCycleStatus} onScan={setScanTarget} />
            ))}
          </motion.div>
        )}

        {/* Scan Modal */}
        <AnimatePresence>
          {scanTarget && <ScanModal asset={scanTarget} onClose={() => setScanTarget(null)} />}
        </AnimatePresence>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
                <div className="modal-title">{editing ? 'EDIT ASSET' : 'REGISTER ASSET'}</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">HOSTNAME</label><input className="input-field" value={form.hostname} onChange={e => setForm(p => ({ ...p, hostname: e.target.value }))} required placeholder="web-prod-01" /></div>
                    <div className="form-group"><label className="form-label">IP ADDRESS</label><input className="input-field" value={form.ipAddress} onChange={e => setForm(p => ({ ...p, ipAddress: e.target.value }))} required placeholder="10.0.1.10" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">TYPE</label>
                      <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                        {Object.keys(TYPE_ICON).map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">STATUS</label>
                      <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">OS</label><input className="input-field" value={form.operatingSystem} onChange={e => setForm(p => ({ ...p, operatingSystem: e.target.value }))} placeholder="Ubuntu 22.04" /></div>
                    <div className="form-group"><label className="form-label">DEPARTMENT</label><input className="input-field" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">RISK SCORE <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(0-100)</span></label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="range" min="0" max="100" value={form.riskScore} onChange={e => setForm(p => ({ ...p, riskScore: e.target.value }))} style={{ flex: 1 }} />
                        <span style={{ fontFamily: "'Orbitron', monospace", color: form.riskScore >= 70 ? '#ff003c' : form.riskScore >= 40 ? '#ff6d00' : '#00ff88', fontWeight: 700, fontSize: '0.9rem', minWidth: 30 }}>{form.riskScore}</span>
                      </div>
                    </div>
                    <div className="form-group"><label className="form-label">OPEN PORTS</label><input className="input-field" value={form.openPorts} onChange={e => setForm(p => ({ ...p, openPorts: e.target.value }))} placeholder="22, 80, 443" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">CVE VULNERABILITIES <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(comma separated)</span></label><input className="input-field" value={form.vulnerabilities} onChange={e => setForm(p => ({ ...p, vulnerabilities: e.target.value }))} placeholder="CVE-2024-1234, CVE-2023-5678" /></div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>CANCEL</button>
                    <button type="submit" className="btn-primary">{editing ? 'UPDATE' : 'REGISTER'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
