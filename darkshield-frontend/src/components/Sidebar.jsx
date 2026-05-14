import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { path: '/dashboard', label: 'Dashboard',    icon: '◈' },
  { path: '/globe',     label: 'Threat Globe', icon: '🌐' },
  { path: '/threats',   label: 'Threats',      icon: '⚡' },
  { path: '/incidents', label: 'Incidents',    icon: '⚠' },
  { path: '/assets',    label: 'Assets',       icon: '◉' },
  { path: '/chat',      label: 'SOC Comms',    icon: '💬' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const s = {
    sidebar: { position: 'fixed', left: 0, top: 0, width: 260, height: '100vh', background: 'rgba(8,12,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 100, backdropFilter: 'blur(20px)' },
    logo: { padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    logoText: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '3px', background: 'linear-gradient(135deg, #00ff88, #00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    logoSub: { fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '2px', marginTop: 4 },
    nav: { flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
    link: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, transition: 'all 0.3s', letterSpacing: '0.5px' },
    activeLink: { background: 'rgba(0,255,136,0.08)', color: '#00ff88', borderLeft: '3px solid #00ff88' },
    userBox: { padding: '20px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' },
    username: { fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '1px' },
    role: { fontSize: '0.7rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 },
    logoutBtn: { marginTop: 12, width: '100%', padding: '10px', background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.2)', borderRadius: 8, color: '#ff003c', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s' },
  };

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoText}>DARKSHIELD</div>
        <div style={s.logoSub}>CYBER THREAT INTEL</div>
      </div>
      <nav style={s.nav}>
        {links.map(l => (
          <NavLink key={l.path} to={l.path} style={({ isActive }) => ({ ...s.link, ...(isActive ? s.activeLink : {}) })}>
            <span style={{ fontSize: '1.1rem' }}>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={s.userBox}>
        <div style={s.username}>{user?.username?.toUpperCase()}</div>
        <div style={s.role}>{user?.role?.replace('ROLE_', '')}</div>
        <button style={s.logoutBtn} onClick={handleLogout} onMouseEnter={e => e.target.style.background = 'rgba(255,0,60,0.2)'} onMouseLeave={e => e.target.style.background = 'rgba(255,0,60,0.1)'}>
          ⏻ LOGOUT
        </button>
      </div>
    </div>
  );
}
