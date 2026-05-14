import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [step, setStep] = useState(0); // which field was last filled
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => { setForm(p => ({ ...p, [key]: val })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(form.username, form.email, form.password, form.fullName); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed. Try a different username.'); }
    finally { setLoading(false); }
  };

  const filled = [form.fullName, form.username, form.email, form.password].filter(Boolean).length;
  const progress = (filled / 4) * 100;

  const fields = [
    { key: 'fullName', label: 'FULL NAME', placeholder: 'Your real name', type: 'text' },
    { key: 'username', label: 'CALLSIGN', placeholder: 'Choose a unique callsign', type: 'text' },
    { key: 'email', label: 'SECURE EMAIL', placeholder: 'operator@soc.internal', type: 'email' },
    { key: 'password', label: 'PASSPHRASE', placeholder: 'Min 6 characters', type: 'password' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#04060b', position: 'relative', overflow: 'hidden' }}>

      {/* ── Left branding panel ── */}
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 36px', position: 'relative', overflow: 'hidden' }}>

        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,136,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.012) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 60%, rgba(177,78,255,0.04), transparent 60%)' }} />

        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 30, left: 30, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#4a5568', letterSpacing: 2, transition: 'color 0.3s', zIndex: 2 }}
          onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a5568'}>
          ← BACK TO HOME
        </motion.div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 320 }}>
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ fontSize: '2.8rem', marginBottom: 14 }}>⚡</div>
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.2rem', fontWeight: 900, letterSpacing: 5, marginBottom: 6 }}>
              <span style={{ color: '#e8edf5' }}>DARK</span>
              <span style={{ color: '#00ff88', textShadow: '0 0 30px rgba(0,255,136,0.4)' }}>SHIELD</span>
            </h1>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', letterSpacing: 4, marginBottom: 40 }}>
              NEW OPERATOR ENROLLMENT
            </div>
          </motion.div>

          {/* Progress ring */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <svg viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <circle cx="55" cy="55" r="46" fill="none" stroke="#00ff88" strokeWidth="6"
                  strokeDasharray={`${(progress / 100) * 289} 289`} strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.5))', transition: 'stroke-dasharray 0.6s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.5rem', fontWeight: 900, color: '#00ff88' }}>{filled}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#4a5568', letterSpacing: 1 }}>/ 4 FIELDS</div>
              </div>
            </div>
          </motion.div>

          {/* Step list */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            {['Full Name', 'Callsign', 'Email', 'Passphrase'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: i < filled ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i < filled ? '#00ff88' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: i < filled ? '#00ff88' : '#4a5568',
                  transition: 'all 0.4s'
                }}>
                  {i < filled ? '✓' : i + 1}
                </div>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', letterSpacing: 2, color: i < filled ? '#00ff88' : '#4a5568', transition: 'color 0.4s' }}>
                  {label.toUpperCase()}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Divider */}
      <div style={{ width: 1, background: 'linear-gradient(180deg, transparent, rgba(177,78,255,0.12), rgba(0,229,255,0.08), transparent)', flexShrink: 0 }} />

      {/* ── Right form panel ── */}
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>

        <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(177,78,255,0.03), transparent)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.65rem', color: '#b14eff', letterSpacing: 4, marginBottom: 8 }}>
              OPERATOR ENROLLMENT
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.6rem', fontWeight: 800, letterSpacing: 3, marginBottom: 6 }}>
              CREATE <span style={{ color: '#00ff88' }}>ACCOUNT</span>
            </h2>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#4a5568', fontSize: '0.95rem', marginBottom: 32 }}>
              Register to access the SOC dashboard and threat intelligence systems
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.25)', borderRadius: 12, padding: '14px 18px', color: '#ff003c', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Rajdhani', sans-serif" }}>
                <span>⚠</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            {fields.map((f, i) => (
              <motion.div key={f.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', color: focused === f.key ? '#00e5ff' : '#4a5568', letterSpacing: 2, marginBottom: 7, transition: 'color 0.3s' }}>
                  {f.label}
                </label>
                <input type={f.type} value={form[f.key]} onChange={e => update(f.key, e.target.value)}
                  onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)}
                  placeholder={f.placeholder} required
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(8,12,20,0.6)',
                    border: `1px solid ${focused === f.key ? 'rgba(0,229,255,0.4)' : form[f.key] ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 12, color: '#e8edf5', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                    outline: 'none', transition: 'all 0.3s',
                    boxShadow: focused === f.key ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
                    boxSizing: 'border-box'
                  }} />
              </motion.div>
            ))}

            <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(0,255,136,0.4)' }}
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '17px', borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(0,255,136,0.12)' : 'linear-gradient(135deg, #00ff88, #00cc6e)',
                color: loading ? '#00ff88' : '#04060b', fontFamily: "'Orbitron', monospace",
                fontSize: '0.82rem', fontWeight: 700, letterSpacing: 3, transition: 'all 0.3s',
                boxShadow: '0 4px 24px rgba(0,255,136,0.2)', marginTop: 8
              }}>
              {loading ? '◌ REGISTERING OPERATOR...' : '⚡ DEPLOY OPERATOR'}
            </motion.button>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ textAlign: 'center', marginTop: 24, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#4a5568' }}>
            Already have access?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.textShadow = '0 0 10px rgba(0,229,255,0.4)'}
              onMouseLeave={e => e.currentTarget.style.textShadow = 'none'}>
              Login →
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            style={{ marginTop: 24, padding: '14px 18px', borderRadius: 12, background: 'rgba(177,78,255,0.03)', border: '1px solid rgba(177,78,255,0.08)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#4a5568', lineHeight: 1.8 }}>
            <span style={{ color: '#b14eff', fontFamily: "'Orbitron', monospace", fontSize: '0.58rem', letterSpacing: 2 }}>NOTE</span>
            <br />
            New operators are assigned <span style={{ color: '#b14eff' }}>ANALYST</span> role by default.
            Admin can upgrade your access via the User Management panel.
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
