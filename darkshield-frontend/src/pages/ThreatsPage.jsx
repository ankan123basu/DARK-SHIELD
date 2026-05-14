import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';

// Indian target locations — city → lat/lon
const INDIA_TARGETS = {
  'Delhi (NCR)'        : { lat: 28.6139, lon: 77.2090 },
  'Mumbai'             : { lat: 19.0760, lon: 72.8777 },
  'Bangalore'          : { lat: 12.9716, lon: 77.5946 },
  'Chennai'            : { lat: 13.0827, lon: 80.2707 },
  'Kolkata'            : { lat: 22.5726, lon: 88.3639 },
  'Hyderabad'          : { lat: 17.3850, lon: 78.4867 },
  'Pune'               : { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad'          : { lat: 23.0225, lon: 72.5714 },
  'Jaipur'             : { lat: 26.9124, lon: 75.7873 },
  'Lucknow'            : { lat: 26.8467, lon: 80.9462 },
  'Chandigarh'         : { lat: 30.7333, lon: 76.7794 },
  'Bhopal'             : { lat: 23.2599, lon: 77.4126 },
  'Patna'              : { lat: 25.5941, lon: 85.1376 },
  'Bhubaneswar'        : { lat: 20.2961, lon: 85.8245 },
  'Guwahati'           : { lat: 26.1445, lon: 91.7362 },
  'Surat'              : { lat: 21.1702, lon: 72.8311 },
  'Kochi'              : { lat: 9.9312,  lon: 76.2673 },
  'Visakhapatnam'      : { lat: 17.6868, lon: 83.2185 },
  'Nagpur'             : { lat: 21.1458, lon: 79.0882 },
  'Thiruvananthapuram' : { lat: 8.5241,  lon: 76.9366 },
};

// ── Custom styled dropdown to replace native <select> ──
function CyberSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sevColor = (v) => {
    if (v === 'CRITICAL') return '#ff003c';
    if (v === 'HIGH') return '#ff6d00';
    if (v === 'MEDIUM') return '#b14eff';
    if (v === 'LOW') return '#00ff88';
    if (v === 'INFO') return '#00e5ff';
    if (v === 'RANSOMWARE' || v === 'APT' || v === 'ZERO_DAY') return '#ff003c';
    if (v === 'MALWARE' || v === 'DDOS') return '#ff6d00';
    return '#00e5ff';
  };

  const accent = sevColor(value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', letterSpacing: 3, marginBottom: 8 }}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'rgba(4,6,11,0.8)',
          border: `1px solid ${open ? accent + '60' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 10, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8rem', color: accent, letterSpacing: 1,
          boxShadow: open ? `0 0 16px ${accent}15` : 'none',
          transition: 'all 0.2s', textAlign: 'left'
        }}>
        <span>{value}</span>
        <span style={{ fontSize: '0.6rem', color: '#4a5568', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999,
              background: 'rgba(6,10,18,0.98)', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,255,0.06)',
              backdropFilter: 'blur(20px)'
            }}>
            {options.map((opt, i) => {
              const oColor = sevColor(opt);
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', background: isSelected ? `${oColor}12` : 'transparent',
                    border: 'none', borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.78rem', color: isSelected ? oColor : '#8892a4',
                    letterSpacing: 1, textAlign: 'left', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${oColor}10`; e.currentTarget.style.color = oColor; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? `${oColor}12` : 'transparent'; e.currentTarget.style.color = isSelected ? oColor : '#8892a4'; }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: oColor, flexShrink: 0, boxShadow: `0 0 6px ${oColor}` }} />
                  {opt}
                  {isSelected && <span style={{ marginLeft: 'auto', color: oColor, fontSize: '0.6rem' }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ThreatsPage() {
  const [threats, setThreats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({
    title: '', description: '', type: 'MALWARE', severity: 'MEDIUM',
    source: '', sourceIp: '', targetIp: '', sourceCountry: '',
    sourceLatitude: '', sourceLongitude: '',
    targetCity: 'Delhi (NCR)',
    indicators: '', mitreAttackIds: ''
  });

  const load = () => API.get('/threats').then(r => setThreats(r.data));
  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({
    title: '', description: '', type: 'MALWARE', severity: 'MEDIUM',
    source: '', sourceIp: '', targetIp: '', sourceCountry: '',
    sourceLatitude: '', sourceLongitude: '',
    targetCity: 'Delhi (NCR)',
    indicators: '', mitreAttackIds: ''
  });

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true); };
  const openEdit = (t) => {
    // find which city matches the stored coords (or default to Delhi)
    const matchedCity = Object.entries(INDIA_TARGETS).find(([, v]) =>
      Math.abs(v.lat - (t.targetLatitude || 0)) < 0.1 &&
      Math.abs(v.lon - (t.targetLongitude || 0)) < 0.1
    );
    setForm({
      ...t,
      indicators: (t.indicators || []).join(', '),
      mitreAttackIds: (t.mitreAttackIds || []).join(', '),
      sourceLatitude: t.sourceLatitude || '',
      sourceLongitude: t.sourceLongitude || '',
      targetCity: matchedCity ? matchedCity[0] : 'Delhi (NCR)',
    });
    setEditing(t.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetCoords = INDIA_TARGETS[form.targetCity] || INDIA_TARGETS['Delhi (NCR)'];
    const payload = {
      ...form,
      indicators: form.indicators ? form.indicators.split(',').map(s => s.trim()) : [],
      mitreAttackIds: form.mitreAttackIds ? form.mitreAttackIds.split(',').map(s => s.trim()) : [],
      sourceLatitude: form.sourceLatitude ? parseFloat(form.sourceLatitude) : null,
      sourceLongitude: form.sourceLongitude ? parseFloat(form.sourceLongitude) : null,
      targetLatitude: targetCoords.lat,
      targetLongitude: targetCoords.lon,
    };
    delete payload.targetCity;
    if (editing) await API.put(`/threats/${editing}`, payload);
    else await API.post('/threats', payload);
    setShowModal(false); load();
  };

  const handleDelete = async (id) => { if (confirm('Delete this threat?')) { await API.delete(`/threats/${id}`); load(); } };

  const sevColor = (s) => s === 'CRITICAL' ? 'var(--neon-red)' : s === 'HIGH' ? 'var(--neon-orange)' : s === 'MEDIUM' ? 'var(--neon-purple)' : s === 'LOW' ? 'var(--neon-green)' : 'var(--neon-cyan)';
  const scoreClass = (s) => s >= 75 ? 'score-high' : s >= 50 ? 'score-medium' : 'score-low';
  const filtered = filter === 'ALL' ? threats : threats.filter(t => t.severity === filter);

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">THREAT <span>INTELLIGENCE</span></h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 180, position: 'relative', zIndex: 100 }}>
              <CyberSelect
                value={filter}
                onChange={setFilter}
                options={['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']}
              />
            </div>
            <button className="btn-primary" onClick={openCreate}>+ NEW THREAT</button>
          </div>
        </div>

        <table className="data-table">
          <thead><tr><th>THREAT</th><th>TYPE</th><th>SEVERITY</th><th>SCORE</th><th>STATUS</th><th>SOURCE</th><th>ACTIONS</th></tr></thead>
          <tbody>
            {filtered.map((t, i) => (
              <motion.tr key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <td>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.sourceCountry || t.sourceIp || '—'}</div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.type}</td>
                <td><span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: sevColor(t.severity), background: `${sevColor(t.severity)}18`, border: `1px solid ${sevColor(t.severity)}40` }}>{t.severity}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: sevColor(t.severity), fontSize: '0.9rem' }}>{t.threatScore}</span>
                    <div className="score-bar" style={{ width: 60 }}><div className={`score-fill ${scoreClass(t.threatScore)}`} style={{ width: `${t.threatScore}%` }} /></div>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{t.status}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.source || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(t)} style={{ padding: '6px 14px', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-display)' }}>EDIT</button>
                    <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 14px', background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.2)', borderRadius: 8, color: 'var(--neon-red)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-display)' }}>DEL</button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                style={{ overflowY: 'auto', maxHeight: '90vh' }}>
                <div className="modal-title">{editing ? 'EDIT THREAT' : 'NEW THREAT'}</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><label className="form-label">TITLE</label><input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">DESCRIPTION</label><textarea className="input-field" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} /></div>

                  {/* TARGET CITY — Indian city/state picker (auto-fills lat/lon) */}
                  <div className="form-group" style={{ position: 'relative', zIndex: 190 }}>
                    <CyberSelect
                      label="🎯 TARGET CITY / STATE (India)"
                      value={form.targetCity}
                      onChange={v => setForm(p => ({ ...p, targetCity: v }))}
                      options={Object.keys(INDIA_TARGETS)}
                    />
                    <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', letterSpacing: 1 }}>
                      → auto-maps to lat: <span style={{ color: '#00ff88' }}>{INDIA_TARGETS[form.targetCity]?.lat}</span>, lon: <span style={{ color: '#00ff88' }}>{INDIA_TARGETS[form.targetCity]?.lon}</span>
                    </div>
                  </div>

                  {/* TYPE + SEVERITY — custom dropdowns */}

                  <div className="form-row" style={{ position: 'relative', zIndex: 210 }}>
                    <div className="form-group" style={{ position: 'relative', zIndex: 210 }}>
                      <CyberSelect
                        label="TYPE"
                        value={form.type}
                        onChange={v => setForm(p => ({ ...p, type: v }))}
                        options={['MALWARE', 'PHISHING', 'DDOS', 'APT', 'RANSOMWARE', 'ZERO_DAY', 'SQL_INJECTION', 'XSS', 'BRUTE_FORCE', 'INSIDER_THREAT']}
                      />
                    </div>
                    <div className="form-group" style={{ position: 'relative', zIndex: 210 }}>
                      <CyberSelect
                        label="SEVERITY"
                        value={form.severity}
                        onChange={v => setForm(p => ({ ...p, severity: v }))}
                        options={['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']}
                      />
                    </div>
                  </div>


                  <div className="form-row">
                    <div className="form-group"><label className="form-label">SOURCE IP</label><input className="input-field" value={form.sourceIp} onChange={e => setForm(p => ({ ...p, sourceIp: e.target.value }))} placeholder="e.g. 185.234.72.10" /></div>
                    <div className="form-group"><label className="form-label">TARGET IP</label><input className="input-field" value={form.targetIp} onChange={e => setForm(p => ({ ...p, targetIp: e.target.value }))} placeholder="e.g. 10.0.1.10" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">SOURCE COUNTRY</label><input className="input-field" value={form.sourceCountry} onChange={e => setForm(p => ({ ...p, sourceCountry: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">INTEL SOURCE</label><input className="input-field" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="e.g. VirusTotal" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">SRC LAT <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(for globe arc)</span></label><input className="input-field" value={form.sourceLatitude} onChange={e => setForm(p => ({ ...p, sourceLatitude: e.target.value }))} placeholder="e.g. 55.75" /></div>
                    <div className="form-group"><label className="form-label">SRC LON <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(for globe arc)</span></label><input className="input-field" value={form.sourceLongitude} onChange={e => setForm(p => ({ ...p, sourceLongitude: e.target.value }))} placeholder="e.g. 37.62" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">IOC INDICATORS <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(comma separated)</span></label><input className="input-field" value={form.indicators} onChange={e => setForm(p => ({ ...p, indicators: e.target.value }))} placeholder="hash, domain, IP..." /></div>
                  <div className="form-group"><label className="form-label">MITRE ATT&CK IDs <span style={{ color: '#4a5568', fontSize: '0.6rem' }}>(comma separated)</span></label><input className="input-field" value={form.mitreAttackIds} onChange={e => setForm(p => ({ ...p, mitreAttackIds: e.target.value }))} placeholder="T1566.001, T1190..." /></div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>CANCEL</button>
                    <button type="submit" className="btn-primary">{editing ? 'UPDATE' : 'CREATE'}</button>
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
