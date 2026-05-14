import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ScanLine() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, borderRadius: 'inherit' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.15), transparent)',
        animation: 'loginScan 4s ease-in-out infinite'
      }} />
      <style>{`@keyframes loginScan { 0% { top: -2px; } 50% { top: 100%; } 100% { top: -2px; } }`}</style>
    </div>
  );
}

function TypingPrompt({ text, delay = 0 }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => { setDisplay(text.slice(0, ++i)); if (i >= text.length) clearInterval(id); }, 30);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <span>{display}</span>;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(username, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Authentication failed. Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden',
      background: '#04060b'
    }}>
      {/* Left Panel — Branding & Visual */}
      <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '60px 40px', position: 'relative', overflow: 'hidden'
        }}>
        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(0,255,136,0.04), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,229,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.012) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Back to landing */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={() => navigate('/')}
          style={{
            position: 'absolute', top: 30, left: 30, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem',
            color: '#4a5568', letterSpacing: 2, transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#4a5568'}>
          ← BACK TO HOME
        </motion.div>

        {/* Logo + Tagline */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>◈</div>
            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.6rem', fontWeight: 900, letterSpacing: 6, marginBottom: 8 }}>
              <span style={{ color: '#e8edf5' }}>DARK</span><span style={{ color: '#00ff88', textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>SHIELD</span>
            </h1>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#4a5568', letterSpacing: 4, marginBottom: 40 }}>
              CYBER THREAT INTELLIGENCE
            </div>
          </motion.div>

          {/* Terminal-style info block */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              background: 'rgba(4,6,11,0.8)', border: '1px solid rgba(0,229,255,0.08)',
              borderRadius: 14, padding: '20px 24px', maxWidth: 340, textAlign: 'left',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', lineHeight: 2, color: '#4a5568'
            }}>
            <div><span style={{ color: '#00ff88' }}>$</span> <TypingPrompt text="system --status" delay={800} /></div>
            <div style={{ color: '#00ff88' }}>✓ MongoDB connected</div>
            <div style={{ color: '#00ff88' }}>✓ JWT auth enabled</div>
            <div style={{ color: '#00ff88' }}>✓ RBAC enforced</div>
            <div style={{ color: '#00e5ff' }}>⟳ Awaiting operator login...</div>
          </motion.div>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 28, maxWidth: 340 }}>
            {['Spring Boot 4', 'React 18', 'Three.js', 'MongoDB'].map(t => (
              <span key={t} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.6rem', fontFamily: "'Orbitron', monospace",
                letterSpacing: 1.5, color: '#4a5568', border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)'
              }}>{t}</span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Divider line */}
      <div style={{ width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.1), rgba(0,255,136,0.1), transparent)', flexShrink: 0 }} />

      {/* Right Panel — Login Form */}
      <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px', position: 'relative'
        }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.03), transparent)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Form header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', color: '#00e5ff', letterSpacing: 4, marginBottom: 8 }}>
              AUTHENTICATION REQUIRED
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.6rem', fontWeight: 800, letterSpacing: 3, marginBottom: 6 }}>
              OPERATOR <span style={{ color: '#00ff88' }}>LOGIN</span>
            </h2>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#4a5568', fontSize: '0.95rem', marginBottom: 36 }}>
              Enter your credentials to access the SOC dashboard
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.25)',
                borderRadius: 12, padding: '14px 18px', color: '#ff003c', fontSize: '0.85rem',
                marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'Rajdhani', sans-serif"
              }}>
              <span style={{ fontSize: '1.1rem' }}>⚠</span> {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', color: focused === 'user' ? '#00e5ff' : '#4a5568', letterSpacing: 2, marginBottom: 8, transition: 'color 0.3s' }}>
                CALLSIGN
              </label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused('user')} onBlur={() => setFocused(null)}
                placeholder="Enter username" required
                style={{
                  width: '100%', padding: '16px 18px', background: 'rgba(8,12,20,0.6)',
                  border: `1px solid ${focused === 'user' ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 14, color: '#e8edf5', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                  outline: 'none', transition: 'all 0.3s',
                  boxShadow: focused === 'user' ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
                  boxSizing: 'border-box'
                }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', color: focused === 'pass' ? '#00e5ff' : '#4a5568', letterSpacing: 2, marginBottom: 8, transition: 'color 0.3s' }}>
                PASSPHRASE
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                placeholder="Enter password" required
                style={{
                  width: '100%', padding: '16px 18px', background: 'rgba(8,12,20,0.6)',
                  border: `1px solid ${focused === 'pass' ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 14, color: '#e8edf5', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
                  outline: 'none', transition: 'all 0.3s',
                  boxShadow: focused === 'pass' ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
                  boxSizing: 'border-box'
                }} />
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(0,255,136,0.4)' }}
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '18px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: loading ? 'rgba(0,255,136,0.15)' : 'linear-gradient(135deg, #00ff88, #00cc6e)',
                color: loading ? '#00ff88' : '#04060b', fontFamily: "'Orbitron', monospace", fontSize: '0.85rem',
                fontWeight: 700, letterSpacing: 3, transition: 'all 0.3s',
                boxShadow: '0 4px 24px rgba(0,255,136,0.25)', position: 'relative', overflow: 'hidden'
              }}>
              {loading && <ScanLine />}
              {loading ? '◌ AUTHENTICATING...' : '⏎ ACCESS TERMINAL'}
            </motion.button>
          </form>

          {/* Links */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.95rem', color: '#4a5568' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.3s' }}
              onMouseEnter={(e) => e.currentTarget.style.textShadow = '0 0 10px rgba(0,229,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.textShadow = 'none'}>
              Register →
            </Link>
          </motion.div>

          {/* Demo credentials */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            style={{
              marginTop: 28, padding: '18px 20px', borderRadius: 14,
              background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4a5568', lineHeight: 2
            }}>
            <div style={{ color: '#00e5ff', fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', letterSpacing: 2, marginBottom: 6 }}>DEMO CREDENTIALS</div>
            <div><span style={{ color: '#00ff88' }}>admin</span> / admin123 <span style={{ color: '#ff003c', fontSize: '0.6rem' }}>ADMIN</span></div>
            <div><span style={{ color: '#00ff88' }}>hunter</span> / hunter123 <span style={{ color: '#ff6d00', fontSize: '0.6rem' }}>HUNTER</span></div>
            <div><span style={{ color: '#00ff88' }}>analyst</span> / analyst123 <span style={{ color: '#b14eff', fontSize: '0.6rem' }}>ANALYST</span></div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
