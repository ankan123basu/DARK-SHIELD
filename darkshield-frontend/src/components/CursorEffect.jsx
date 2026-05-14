import { useEffect, useState } from 'react';

export default function CursorEffect() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail(prev => [...prev.slice(-12), { x: e.clientX, y: e.clientY, id: Date.now() }]);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9990 }}>
      {trail.map((p, i) => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x - 4, top: p.y - 4,
          width: 8, height: 8, borderRadius: '50%',
          background: `rgba(0, 255, 136, ${(i + 1) / trail.length * 0.4})`,
          boxShadow: `0 0 ${6 + i}px rgba(0, 255, 136, ${(i + 1) / trail.length * 0.3})`,
          transition: 'opacity 0.3s',
        }} />
      ))}
      <div style={{
        position: 'absolute', left: pos.x - 10, top: pos.y - 10,
        width: 20, height: 20, borderRadius: '50%',
        border: '1.5px solid rgba(0, 229, 255, 0.6)',
        boxShadow: '0 0 15px rgba(0, 229, 255, 0.3), inset 0 0 8px rgba(0, 229, 255, 0.1)',
        transition: 'transform 0.1s ease-out',
      }} />
      <div style={{
        position: 'absolute', left: pos.x - 2, top: pos.y - 2,
        width: 4, height: 4, borderRadius: '50%',
        background: '#00ff88', boxShadow: '0 0 10px #00ff88',
      }} />
    </div>
  );
}
