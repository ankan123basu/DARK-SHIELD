import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroGlobe3D from '../components/HeroGlobe3D';
import FloatingGeo from '../components/FloatingGeo';

const fadeUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function GlitchText({ text, color = '#00ff88' }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 150); }, 4000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ position: 'relative', display: 'inline-block', color }}>
      {text}
      {glitch && (<>
        <span style={{ position: 'absolute', left: 2, top: -1, color: '#ff003c', clipPath: 'inset(20% 0 40% 0)', opacity: 0.8 }}>{text}</span>
        <span style={{ position: 'absolute', left: -2, top: 1, color: '#00e5ff', clipPath: 'inset(60% 0 10% 0)', opacity: 0.8 }}>{text}</span>
      </>)}
    </span>
  );
}

function TypeWriter({ text, speed = 40, delay = 0 }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => { setDisplay(text.slice(0, ++i)); if (i >= text.length) clearInterval(id); }, speed);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return <span>{display}<span style={{ animation: 'pulse-red 1s infinite', color: '#00ff88' }}>▋</span></span>;
}

function HexRain() {
  const chars = '0123456789ABCDEF';
  const cols = 20;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={`col-${i}`} style={{
          position: 'absolute', left: `${(i / cols) * 100}%`, top: -200,
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#00ff88',
          lineHeight: 1.8, letterSpacing: 3, writingMode: 'vertical-rl',
          animation: `hexDrop ${8 + Math.random() * 12}s linear ${Math.random() * 8}s infinite`,
        }}>
          {Array.from({ length: 30 }).map((_, j) => chars[Math.floor(Math.random() * 16)]).join('\n')}
        </div>
      ))}
      <style>{`@keyframes hexDrop { 0% { transform: translateY(-100%); } 100% { transform: translateY(120vh); } }`}</style>
    </div>
  );
}

function FloatingHUD({ children, x, y, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', left: x, top: y, zIndex: 5, pointerEvents: 'none',
        background: 'rgba(4,6,11,0.7)', border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(12px)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568',
        animation: `float${Math.round(Math.random()*3)} 6s ease-in-out infinite`
      }}>
      {children}
      <style>{`
        @keyframes float0 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float1 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(1deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes float3 { 0%,100% { transform: translateY(-5px); } 50% { transform: translateY(5px); } }
      `}</style>
    </motion.div>
  );
}

function AnimatedCounter({ target, suffix = '', duration = 2000, delay = 0 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => {
      let start = 0;
      const step = target / (duration / 16);
      const id = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(id); } else setVal(Math.round(start)); }, 16);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [inView, target, duration, delay]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const features = [
    { icon: '⚡', title: 'THREAT SCORING', desc: 'Multi-factor AI scoring: severity + MITRE ATT&CK + IOC density + recency = quantified risk 0-100', color: '#00e5ff' },
    { icon: '🔥', title: 'AUTO ESCALATION', desc: 'Score ≥ 75 triggers P1 incident instantly. Zero human delay between detection and response', color: '#ff003c' },
    { icon: '🌐', title: 'ATTACK GLOBE', desc: 'Interactive 3D globe with real attack arcs. Drag to explore. Hover nodes for full threat intel', color: '#00ff88' },
    { icon: '🇮🇳', title: 'INDIA THREAT MAP', desc: 'City-level visualization of threats targeting Indian infrastructure. Pulsing impact zones', color: '#ff6d00' },
    { icon: '🛡️', title: 'NIST LIFECYCLE', desc: 'Full incident response: Detect → Investigate → Contain → Eradicate → Recover → Close', color: '#b14eff' },
    { icon: '🔐', title: 'RBAC + JWT', desc: 'Three-tier access: Analyst < Hunter < Admin. Stateless JWT with auto-refresh interceptors', color: '#ffd600' },
  ];

  return (
    <div style={{ background: '#04060b', minHeight: '100vh', overflowX: 'hidden' }}
      onMouseMove={(e) => { setMouseX((e.clientX / window.innerWidth - 0.5) * 20); setMouseY((e.clientY / window.innerHeight - 0.5) * 20); }}>

      {/* ════════ NAVBAR ════════ */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(4,6,11,0.95), rgba(4,6,11,0.4), transparent)',
          backdropFilter: 'blur(12px)'
        }}>
        <div onClick={() => navigate('/login')} style={{
          fontFamily: "'Orbitron', monospace", fontSize: '1.1rem', fontWeight: 900, letterSpacing: 4,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s'
        }}
          onMouseEnter={(e) => e.currentTarget.style.textShadow = '0 0 20px rgba(0,255,136,0.5)'}
          onMouseLeave={(e) => e.currentTarget.style.textShadow = 'none'}>
          <span style={{ color: '#00ff88', fontSize: '1.3rem' }}>◈</span>
          <span style={{ color: '#e8edf5' }}>DARK</span><span style={{ color: '#00ff88' }}>SHIELD</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 24px', background: 'transparent', border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: 10, color: '#00e5ff', fontFamily: "'Orbitron', monospace", fontSize: '0.7rem',
            fontWeight: 600, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)'; e.currentTarget.style.borderColor = '#00e5ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'; }}>
            LOGIN
          </button>
          <button onClick={() => navigate('/register')} style={{
            padding: '10px 24px', background: 'linear-gradient(135deg, #00ff88, #00cc6e)',
            border: 'none', borderRadius: 10, color: '#04060b', fontFamily: "'Orbitron', monospace",
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,255,136,0.3)', transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,255,136,0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,255,136,0.3)'}>
            REGISTER
          </button>
        </div>
      </motion.nav>

      {/* ════════ HERO ════════ */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale, y: heroY, height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <HexRain />

        {/* Parallax 3D Globe — full immersive hero */}
        <motion.div style={{ position: 'absolute', inset: '-5%', zIndex: 0, x: mouseX * -1.2, y: mouseY * -1.2 }}>
          <HeroGlobe3D style={{ width: '100%', height: '100%' }} />
        </motion.div>

        {/* Radial mask — lighter so globe shows through */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(4,6,11,0.45) 60%, rgba(4,6,11,0.85) 85%)', zIndex: 1 }} />

        {/* Floating HUD elements */}
        <FloatingHUD x="8%" y="18%" delay={1.2}>
          <div style={{ color: '#ff003c', fontWeight: 700 }}>● THREAT LEVEL</div>
          <div style={{ color: '#ff003c', fontSize: '1.2rem', fontFamily: "'Orbitron', monospace", fontWeight: 900 }}>SEVERE</div>
        </FloatingHUD>
        <FloatingHUD x="82%" y="22%" delay={1.5}>
          <div style={{ color: '#00ff88' }}>▲ SYSTEMS ONLINE</div>
          <div style={{ color: '#00ff88', fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: '1rem' }}>247 / 250</div>
        </FloatingHUD>
        <FloatingHUD x="5%" y="68%" delay={1.8}>
          <div style={{ color: '#00e5ff' }}>◆ ACTIVE SCANS</div>
          <div style={{ fontFamily: "'Orbitron', monospace", color: '#00e5ff', fontWeight: 700 }}>14,892</div>
        </FloatingHUD>
        <FloatingHUD x="78%" y="72%" delay={2.0}>
          <div style={{ color: '#b14eff' }}>⬡ SHIELD STATUS</div>
          <div style={{ color: '#00ff88', fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>ACTIVE</div>
        </FloatingHUD>

        {/* Crosshair center lines */}
        <div style={{ position: 'absolute', top: '50%', left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.08), transparent)', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: '50%', top: '25%', bottom: '25%', width: 1, background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.08), transparent)', zIndex: 2 }} />

        {/* Main Hero Content */}
        <motion.div initial="hidden" animate="visible" variants={stagger} style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: 900, padding: '0 24px' }}>
          <motion.div variants={fadeUp} transition={{ duration: 1 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#00e5ff', letterSpacing: 8, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 40, height: 1, background: '#00e5ff' }} />
              <TypeWriter text="CYBER THREAT INTELLIGENCE PLATFORM" speed={35} />
              <span style={{ width: 40, height: 1, background: '#00e5ff' }} />
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} transition={{ duration: 0.8, delay: 0.2 }} style={{
            fontFamily: "'Orbitron', monospace", fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: 6, marginBottom: 28
          }}>
            <span style={{ color: '#e8edf5' }}>DARK</span>
            <GlitchText text="SHIELD" />
          </motion.h1>

          <motion.p variants={fadeUp} transition={{ duration: 0.8, delay: 0.4 }} style={{
            fontSize: '1.2rem', color: '#8892a4', maxWidth: 620, margin: '0 auto 20px',
            lineHeight: 1.8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 400
          }}>
            Real-time threat detection. Automated incident response. 3D attack visualization.
            <span style={{ color: '#00ff88' }}> Built for the next generation of security operations.</span>
          </motion.p>

          {/* Terminal-style line */}
          <motion.div variants={fadeUp} transition={{ duration: 0.8, delay: 0.5 }} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#4a5568',
            marginBottom: 36, letterSpacing: 1
          }}>
            <span style={{ color: '#00ff88' }}>root@darkshield</span>:<span style={{ color: '#00e5ff' }}>~</span>$ ./initialize --mode=SOC --auth=JWT --db=MongoDB
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.8, delay: 0.6 }} style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(0,255,136,0.4)' }} whileTap={{ scale: 0.97 }}
              className="btn-primary" onClick={() => navigate('/register')} style={{ padding: '18px 48px', fontSize: '0.9rem', letterSpacing: 3 }}>
              ⚡ INITIALIZE SOC
            </motion.button>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,229,255,0.3)' }} whileTap={{ scale: 0.97 }}
              className="btn-secondary" onClick={() => navigate('/login')} style={{ padding: '18px 48px', fontSize: '0.9rem', letterSpacing: 3 }}>
              ⏎ OPERATOR LOGIN
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: 36, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 1, height: 30, background: 'linear-gradient(180deg, rgba(0,229,255,0.3), transparent)' }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', letterSpacing: 4 }}>SCROLL</div>
        </motion.div>
      </motion.section>

      {/* ════════ STATS BAR ════════ */}
      <section style={{ padding: '60px 40px', position: 'relative', background: 'linear-gradient(180deg, #04060b, rgba(0,255,136,0.015), #04060b)', borderTop: '1px solid rgba(0,229,255,0.06)', borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {[
            { value: 100, suffix: '+', label: 'THREAT VECTORS', color: '#00e5ff' },
            { value: 2, suffix: 's', label: 'ESCALATION TIME', color: '#ff003c' },
            { value: 100, suffix: '', label: 'COMPOSITE SCORE', color: '#00ff88' },
            { value: 24, suffix: '/7', label: 'MONITORING', color: '#b14eff' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '3.2rem', fontWeight: 900, color: s.color, textShadow: `0 0 40px ${s.color}30`, lineHeight: 1 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} delay={200} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#4a5568', letterSpacing: 3, marginTop: 10 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00e5ff', fontSize: '0.75rem', letterSpacing: 6, marginBottom: 16 }}>
              <span style={{ color: '#4a5568' }}>{'// '}</span>CAPABILITIES
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.4rem', fontWeight: 800, letterSpacing: 4 }}>
              ENTERPRISE-GRADE <GlitchText text="DEFENSE" />
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} transition={{ duration: 0.6 }}
                whileHover={{ y: -8, borderColor: `${f.color}30`, boxShadow: `0 20px 60px ${f.color}10` }}
                style={{
                  background: 'rgba(8,12,20,0.6)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 20, padding: '36px 28px', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                  position: 'relative', overflow: 'hidden', cursor: 'default'
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)` }} />
                <div style={{ fontSize: '2.2rem', marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.85rem', fontWeight: 700, letterSpacing: 3, marginBottom: 12, color: f.color }}>{f.title}</h3>
                <p style={{ color: '#8892a4', fontSize: '0.95rem', lineHeight: 1.7, fontFamily: "'Rajdhani', sans-serif" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════ 3D SHOWCASE ════════ */}
      <section style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left — 3D Geo */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: 400, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,255,136,0.08)', background: 'rgba(4,6,11,0.4)' }}>
              <FloatingGeo color="#00ff88" showParticles={true} />
            </div>
            <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', letterSpacing: 2 }}>
              THREAT MATRIX — 3D ANALYSIS
            </div>
          </motion.div>

          {/* Right — Text */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.15 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00ff88', fontSize: '0.7rem', letterSpacing: 5, marginBottom: 16 }}>
              <span style={{ color: '#4a5568' }}>{'// '}</span>MULTI-DIMENSIONAL
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.2rem', fontWeight: 800, letterSpacing: 3, lineHeight: 1.2, marginBottom: 24 }}>
              BEYOND 2D <span style={{ color: '#00ff88' }}>DASHBOARDS</span>
            </h2>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8892a4', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
              DARKSHIELD renders threat data in 3D space — interactive globe, India city-level heatmap, and depth-layered visualizations that reveal attack patterns invisible in flat tables.
            </p>
            {['Interactive 3D Attack Globe', 'India City-Level Threat Map', 'Real-time Arc Visualization', 'Hover Intel Tooltips'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ color: '#00ff88', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}>▸</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", color: '#e8edf5', fontSize: '1rem' }}>{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Row 2 — Terminal showcase */}
        <div style={{ maxWidth: 1200, margin: '80px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left — Text */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00e5ff', fontSize: '0.7rem', letterSpacing: 5, marginBottom: 16 }}>
              <span style={{ color: '#4a5568' }}>{'// '}</span>SOC TERMINAL
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.2rem', fontWeight: 800, letterSpacing: 3, lineHeight: 1.2, marginBottom: 24 }}>
              COMMAND THE <span style={{ color: '#00e5ff' }}>PLATFORM</span>
            </h2>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", color: '#8892a4', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
              A built-in Linux-style terminal lives inside your dashboard. Query live MongoDB data, simulate network scans, view threat feeds — all without leaving the SOC interface.
            </p>
            {['threats — live threat intel feed', 'stats — realtime SOC metrics', 'scan [ip] — network simulation', 'incidents — response queue'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#4a5568', marginBottom: 8, display: 'flex', gap: 10 }}>
                <span style={{ color: '#00ff88' }}>$</span>
                <span style={{ color: '#00e5ff' }}>{f}</span>
              </motion.div>
            ))}
          </motion.div>
          {/* Right — Terminal preview */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.15 }}
            style={{ background: 'rgba(2,4,8,0.95)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 16, padding: '20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', lineHeight: 2.2 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff003c' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffd600' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88' }} />
            </div>
            {[['threats', '#00e5ff'],['🔴 [CRITICAL] [92/100] APT29 Cozy Bear Activity', '#ff003c'],['🔴 [CRITICAL] [88/100] LockBit 3.0 Ransomware', '#ff003c'],['🟠 [HIGH    ] [71/100] SQL Injection on Portal', '#ff6d00'],['stats', '#00e5ff'],['  Active Threats    : 8', '#00ff88'],['  Critical          : 3', '#ff003c'],['  Avg Threat Score  : 67.4', '#ffd600']].map(([line, color], i) => (
              <div key={i} style={{ color, display: 'flex', gap: 8 }}>
                {line.startsWith('🔴') || line.startsWith('🟠') || line.startsWith(' ') ? <span style={{ opacity: 0 }}>$</span> : <span style={{ color: '#00ff88' }}>$</span>}
                <span>{line}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ color: '#00ff88' }}>$</span>
              <span style={{ color: '#00e5ff' }}>_</span>
              <span style={{ background: '#00ff88', width: 8, height: '1em', display: 'inline-block', animation: 'pulse-red 1s infinite', verticalAlign: 'middle' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ DATA FLOW PIPELINE ════════ */}
      <section style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,229,255,0.008) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.008) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ff6d00', fontSize: '0.75rem', letterSpacing: 6, marginBottom: 16 }}>
              <span style={{ color: '#4a5568' }}>{'// '}</span>HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.2rem', fontWeight: 800, letterSpacing: 4 }}>
              THREAT <span style={{ color: '#ff6d00' }}>RESPONSE PIPELINE</span>
            </h2>
          </motion.div>

          {/* Pipeline steps */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, position: 'relative' }}>
            {[
              { step: '01', label: 'DETECT', desc: 'Threat submitted with type, severity, source IP, geolocation & MITRE IDs', color: '#00e5ff', icon: '👁' },
              { step: '02', label: 'SCORE', desc: 'ThreatScoringEngine calculates 0-100 composite risk automatically', color: '#ffd600', icon: '⚡' },
              { step: '03', label: 'ESCALATE', desc: 'Score ≥ 75 triggers AutoEscalationService → P1 incident created', color: '#ff003c', icon: '🔥' },
              { step: '04', label: 'RESPOND', desc: 'Hunter investigates, escalates severity, follows NIST lifecycle', color: '#00ff88', icon: '🛡' },
              { step: '05', label: 'RESOLVE', desc: 'Incident closed with notes, timeline archived in audit log', color: '#b14eff', icon: '✓' },
            ].map((s, i) => (
              <div key={s.step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6 }}
                  style={{
                    background: 'rgba(8,12,20,0.8)', border: `1px solid ${s.color}20`,
                    borderTop: `3px solid ${s.color}60`, borderRadius: 16, padding: '28px 18px',
                    textAlign: 'center', width: '100%', boxSizing: 'border-box',
                    boxShadow: `0 0 30px ${s.color}05`, transition: 'all 0.4s'
                  }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#4a5568', marginBottom: 6 }}>{s.step}</div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.8rem', fontWeight: 700, color: s.color, letterSpacing: 2, marginBottom: 10 }}>{s.label}</div>
                  <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: '#8892a4', lineHeight: 1.6 }}>{s.desc}</p>
                </motion.div>
                {/* Connector arrow */}
                {i < 4 && (
                  <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 + 0.3, duration: 0.5 }}
                    style={{ position: 'absolute', top: 50, right: -16, zIndex: 10, color: s.color, fontSize: '1.2rem', transformOrigin: 'left' }}>
                    →
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ARCHITECTURE ════════ */}
      <section style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.01), transparent)', position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00e5ff', fontSize: '0.75rem', letterSpacing: 6, marginBottom: 16 }}>
              <span style={{ color: '#4a5568' }}>{'// '}</span>ARCHITECTURE
            </div>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '2rem', fontWeight: 800, letterSpacing: 4 }}>
              TECH <span style={{ color: '#00ff88' }}>STACK</span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: 'rgba(4,6,11,0.8)', border: '1px solid rgba(0,229,255,0.08)', borderRadius: 20, padding: '36px 40px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', lineHeight: 2.2, color: '#4a5568' }}>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Backend</span>  → <span style={{ color: '#00e5ff' }}>Spring Boot 4.0</span> + <span style={{ color: '#00e5ff' }}>Java 26</span> + <span style={{ color: '#00e5ff' }}>Maven</span></div>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Security</span> → <span style={{ color: '#ff003c' }}>Spring Security 7</span> + <span style={{ color: '#ff003c' }}>JWT (JJWT 0.12)</span></div>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Database</span> → <span style={{ color: '#00ff88' }}>MongoDB 7</span> + <span style={{ color: '#00ff88' }}>Spring Data</span></div>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Frontend</span> → <span style={{ color: '#b14eff' }}>React 18</span> + <span style={{ color: '#b14eff' }}>Vite</span> + <span style={{ color: '#b14eff' }}>Three.js</span></div>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Motion</span>  → <span style={{ color: '#ffd600' }}>Framer Motion</span> + <span style={{ color: '#ffd600' }}>React Three Fiber</span></div>
            <div><span style={{ color: '#00ff88' }}>{'>'}</span> <span style={{ color: '#8892a4' }}>Pattern</span> → <span style={{ color: '#ff6d00' }}>Spring MVC</span> + <span style={{ color: '#ff6d00' }}>REST Controllers</span> + <span style={{ color: '#ff6d00' }}>RBAC</span></div>
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
              <span style={{ color: '#00ff88' }}>✓</span> <span style={{ color: '#00ff88' }}>STATUS: ALL SYSTEMS OPERATIONAL</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section style={{ padding: '140px 40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,60,0.04), transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} style={{ fontFamily: "'Orbitron', monospace", fontSize: '2.8rem', fontWeight: 900, letterSpacing: 5, marginBottom: 24 }}>
            READY TO <GlitchText text="DEFEND" color="#ff003c" />?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: '#8892a4', marginBottom: 48, fontSize: '1.15rem', fontFamily: "'Rajdhani', sans-serif" }}>
            Initialize your Security Operations Center. Deploy in seconds.
          </motion.p>
          <motion.div variants={fadeUp}>
            <motion.button whileHover={{ scale: 1.08, boxShadow: '0 0 80px rgba(0,255,136,0.5)' }} whileTap={{ scale: 0.95 }}
              className="btn-primary" onClick={() => navigate('/register')}
              style={{ padding: '22px 60px', fontSize: '1.1rem', letterSpacing: 4 }}>
              DEPLOY DARKSHIELD
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#2d3748', letterSpacing: 3 }}>
          © 2026 DARKSHIELD — CYBER THREAT INTELLIGENCE PLATFORM
        </div>
      </footer>
    </div>
  );
}
