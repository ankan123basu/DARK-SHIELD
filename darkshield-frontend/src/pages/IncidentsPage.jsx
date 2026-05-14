import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import API from '../api/axios';

// Status progression — what button appears at each stage
const NEXT_ACTION = {
  OPEN:         { label: 'ESCALATE',   action: 'escalate',   color: '#ff6d00', desc: '→ INVESTIGATING' },
  INVESTIGATING:{ label: 'CONTAIN',    action: 'contain',    color: '#b14eff', desc: '→ CONTAINMENT' },
  CONTAINMENT:  { label: 'ERADICATE', action: 'eradicate',  color: '#00e5ff', desc: '→ ERADICATION' },
  ERADICATION:  { label: 'RECOVER',   action: 'recover',    color: '#00ff88', desc: '→ RECOVERY' },
  RECOVERY:     { label: 'RESOLVE',   action: 'resolve',    color: '#00ff88', desc: '→ CLOSED' },
  CLOSED:       null,
};

const STATUS_COLOR = {
  OPEN:          '#ff003c',
  INVESTIGATING: '#ff6d00',
  CONTAINMENT:   '#b14eff',
  ERADICATION:   '#00e5ff',
  RECOVERY:      '#00ff88',
  CLOSED:        '#4a5568',
};

const STATUS_STEP = { OPEN: 1, INVESTIGATING: 2, CONTAINMENT: 3, ERADICATION: 4, RECOVERY: 5, CLOSED: 6 };

function ProgressBar({ status }) {
  const steps = ['OPEN', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'CLOSED'];
  const current = STATUS_STEP[status] || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12, marginBottom: 4 }}>
      {steps.map((s, i) => {
        const done = i < current - 1;
        const active = i === current - 1;
        const color = STATUS_COLOR[s];
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div title={s} style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: done || active ? color : 'rgba(255,255,255,0.06)',
              boxShadow: active ? `0 0 10px ${color}` : 'none',
              border: `1px solid ${done || active ? color : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.4s',
            }} />
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1,
                background: done ? `linear-gradient(90deg, ${color}, ${STATUS_COLOR[steps[i+1]]})` : 'rgba(255,255,255,0.05)',
                transition: 'all 0.4s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveId, setResolveId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', description: '', severity: 'P3', assignedTo: '', resolutionNotes: '' });

  const load = () => API.get('/incidents').then(r => setIncidents(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ title: '', description: '', severity: 'P3', assignedTo: '', resolutionNotes: '' }); setEditing(null); setShowModal(true); };
  const openEdit = (inc) => { setForm({ title: inc.title, description: inc.description, severity: inc.severity, assignedTo: inc.assignedTo || '', resolutionNotes: inc.resolutionNotes || '' }); setEditing(inc.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await API.put(`/incidents/${editing}`, form);
    else await API.post('/incidents', form);
    setShowModal(false); load();
  };

  const handleAction = async (id, action) => {
    if (action === 'resolve') {
      setResolveId(id);
      setResolveNotes('');
      setShowResolveModal(true);
      return;
    }
    try {
      await API.put(`/incidents/${id}/${action}`);
      load();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleResolveSubmit = async () => {
    try {
      await API.put(`/incidents/${resolveId}/resolve`, { resolutionNotes: resolveNotes || 'Resolved' });
      setShowResolveModal(false);
      load();
    } catch (err) {
      alert(`Resolve failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id) => { if (confirm('Delete this incident?')) { await API.delete(`/incidents/${id}`); load(); } };

  const sevBadge = (s) => s === 'P1' ? 'badge-critical' : s === 'P2' ? 'badge-high' : 'badge-medium';

  const allStatuses = ['ALL', 'OPEN', 'INVESTIGATING', 'CONTAINMENT', 'ERADICATION', 'RECOVERY', 'CLOSED'];
  const filtered = filter === 'ALL' ? incidents : incidents.filter(i => i.status === filter);

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">INCIDENT <span>RESPONSE</span></h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Status filter tabs */}
            {allStatuses.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.65rem', fontFamily: 'var(--font-display)',
                  letterSpacing: 2, cursor: 'pointer', border: '1px solid',
                  background: filter === s ? (STATUS_COLOR[s] ? `${STATUS_COLOR[s]}15` : 'rgba(0,255,136,0.1)') : 'transparent',
                  borderColor: filter === s ? (STATUS_COLOR[s] || '#00ff88') : 'rgba(255,255,255,0.08)',
                  color: filter === s ? (STATUS_COLOR[s] || '#00ff88') : '#4a5568',
                  transition: 'all 0.2s',
                }}>
                {s}
              </button>
            ))}
            <button className="btn-primary" onClick={openCreate}>+ NEW</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#4a5568', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              No incidents found
            </div>
          )}
          {filtered.map((inc, i) => {
            const nextAction = NEXT_ACTION[inc.status];
            const statusColor = STATUS_COLOR[inc.status] || '#4a5568';
            return (
              <motion.div key={inc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="glass-card" style={{ padding: '20px 28px' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span className={`badge ${sevBadge(inc.severity)}`}>{inc.severity}</span>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{inc.title}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 620 }}>{inc.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}`, display: 'inline-block', animation: inc.status !== 'CLOSED' ? 'pulse-red 2s infinite' : 'none' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: statusColor, fontWeight: 700 }}>{inc.status}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar status={inc.status} />

                {/* Meta + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ASSIGNED: <span style={{ color: '#00e5ff' }}>{inc.assignedTo || '—'}</span>
                    {' · '}THREATS: {inc.relatedThreats?.length || 0}
                    {' · '}ASSETS: {inc.affectedAssets?.length || 0}
                  </div>

                  {/* ACTION BUTTONS — context aware */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {nextAction && inc.status !== 'CLOSED' && (
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${nextAction.color}30` }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(inc.id, nextAction.action)}
                        style={{
                          padding: '6px 16px', background: `${nextAction.color}15`,
                          border: `1px solid ${nextAction.color}50`, borderRadius: 8,
                          color: nextAction.color, cursor: 'pointer',
                          fontSize: '0.7rem', fontFamily: 'var(--font-display)', letterSpacing: 1,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                        <span>{nextAction.label}</span>
                        <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>{nextAction.desc}</span>
                      </motion.button>
                    )}
                    <button onClick={() => openEdit(inc)}
                      style={{ padding: '6px 12px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
                      EDIT
                    </button>
                    <button onClick={() => handleDelete(inc.id)}
                      style={{ padding: '6px 12px', background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.2)', borderRadius: 8, color: 'var(--neon-red)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
                      DEL
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                {inc.timeline?.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {inc.timeline.slice(-4).map((entry, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--neon-cyan)', flexShrink: 0 }}>▸</span>
                        <span style={{ color: '#8892a4' }}>{entry.action}</span>
                        <span style={{ color: '#4a5568' }}>— {entry.performedBy}</span>
                        {entry.details && <span style={{ color: '#2d3748' }}>({entry.details.substring(0, 70)})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="modal-title">{editing ? 'EDIT INCIDENT' : 'NEW INCIDENT'}</div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group"><label className="form-label">TITLE</label><input className="input-field" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                  <div className="form-group"><label className="form-label">DESCRIPTION</label><textarea className="input-field" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} /></div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">SEVERITY</label>
                      <select className="input-field" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                        {['P1', 'P2', 'P3', 'P4'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">ASSIGN TO</label><input className="input-field" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} placeholder="Username" /></div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>CANCEL</button>
                    <button type="submit" className="btn-primary">{editing ? 'UPDATE' : 'CREATE'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resolve Modal — proper text input instead of browser prompt() */}
        <AnimatePresence>
          {showResolveModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResolveModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-title">RESOLVE INCIDENT</div>
                <div style={{ color: '#8892a4', fontFamily: 'var(--font-body)', fontSize: '0.9rem', marginBottom: 20 }}>
                  Describe how the incident was contained and resolved. This will be logged to the timeline.
                </div>
                <div className="form-group">
                  <label className="form-label">RESOLUTION NOTES</label>
                  <textarea className="input-field" rows={4} style={{ resize: 'vertical' }}
                    placeholder="e.g. Isolated web-prod-01, reimaged system, patched CVE-2024-xxx, monitoring for 48h..."
                    value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowResolveModal(false)}>CANCEL</button>
                  <button type="button" className="btn-primary" onClick={handleResolveSubmit}>CLOSE INCIDENT</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
