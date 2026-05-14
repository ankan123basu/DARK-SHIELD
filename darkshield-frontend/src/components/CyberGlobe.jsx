import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Stars, Line, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function ThreatNode({ position, threat, color }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.8 : 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={hovered ? 1 : 0.8} />
      {hovered && (
        <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(4,6,11,0.95)', border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: 12, padding: '14px 18px', minWidth: 220, maxWidth: 280,
            backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            fontFamily: "'Rajdhani', sans-serif", transform: 'translateY(-10px)'
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', fontWeight: 700, color: '#00e5ff', letterSpacing: 2, marginBottom: 8 }}>
              THREAT INTEL
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e8edf5', marginBottom: 6, lineHeight: 1.3 }}>
              {threat.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.75rem' }}>
              <div style={{ color: '#8892a4' }}>Type</div>
              <div style={{ color: '#e8edf5', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}>{threat.type}</div>
              <div style={{ color: '#8892a4' }}>Severity</div>
              <div style={{
                color: threat.severity === 'CRITICAL' ? '#ff003c' : threat.severity === 'HIGH' ? '#ff6d00' : '#b14eff',
                fontWeight: 700
              }}>{threat.severity}</div>
              <div style={{ color: '#8892a4' }}>Score</div>
              <div style={{ color: threat.threatScore >= 75 ? '#ff003c' : threat.threatScore >= 50 ? '#ff6d00' : '#00ff88', fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>{threat.threatScore}/100</div>
              <div style={{ color: '#8892a4' }}>Source</div>
              <div style={{ color: '#e8edf5', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}>{threat.sourceIp || '—'}</div>
              <div style={{ color: '#8892a4' }}>Country</div>
              <div style={{ color: '#e8edf5' }}>{threat.sourceCountry || 'Unknown'}</div>
              <div style={{ color: '#8892a4' }}>Status</div>
              <div style={{ color: '#00e5ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}>{threat.status}</div>
            </div>
            {threat.indicators && threat.indicators.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.65rem', color: '#8892a4', letterSpacing: 1, marginBottom: 4 }}>IOC INDICATORS</div>
                <div style={{ fontSize: '0.7rem', color: '#ff6d00', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                  {threat.indicators.slice(0, 2).join(', ')}
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function AnimatedArc({ points, color, delay = 0 }) {
  const [progress, setProgress] = useState(0);
  
  useFrame((state, delta) => {
    if (progress < 1) setProgress(p => Math.min(p + delta * 0.8, 1));
  });

  const visiblePoints = points.slice(0, Math.floor(points.length * progress));
  if (visiblePoints.length < 2) return null;

  return <Line points={visiblePoints} color={color} lineWidth={1.5} transparent opacity={0.7} />;
}

function Globe({ threats = [] }) {
  const globeRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (globeRef.current) globeRef.current.rotation.y += 0.0008;
  });

  const attackArcs = useMemo(() => {
    return threats.filter(t => t.sourceLatitude && t.targetLatitude).map((t, i) => {
      const src = latLonToVec3(t.sourceLatitude, t.sourceLongitude, 2.02);
      const tgt = latLonToVec3(t.targetLatitude, t.targetLongitude, 2.02);
      const mid = new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5).normalize().multiplyScalar(3.2);
      const curve = new THREE.QuadraticBezierCurve3(src, mid, tgt);
      const points = curve.getPoints(40);
      const color = t.severity === 'CRITICAL' ? '#ff003c' : t.severity === 'HIGH' ? '#ff6d00' : '#00e5ff';
      return { points, color, key: `arc-${i}` };
    });
  }, [threats]);

  const threatNodes = useMemo(() => {
    return threats.filter(t => t.sourceLatitude).map((t, i) => {
      const pos = latLonToVec3(t.sourceLatitude, t.sourceLongitude, 2.06);
      const color = t.severity === 'CRITICAL' ? '#ff003c' : t.severity === 'HIGH' ? '#ff6d00' : '#b14eff';
      return { pos, color, threat: t, key: `node-${i}` };
    });
  }, [threats]);

  // Target node (your location)
  const targetNode = useMemo(() => {
    const t = threats.find(t => t.targetLatitude);
    if (!t) return null;
    return latLonToVec3(t.targetLatitude, t.targetLongitude, 2.06);
  }, [threats]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00e5ff" />
      <pointLight position={[-10, -5, 5]} intensity={0.4} color="#00ff88" />

      <group ref={globeRef}>
        <Sphere args={[2, 64, 64]}>
          <meshPhongMaterial color="#0a1628" emissive="#061220" shininess={20} transparent opacity={0.9} />
        </Sphere>
        <Sphere args={[2.01, 32, 32]}>
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.06} />
        </Sphere>

        {attackArcs.map(arc => (
          <AnimatedArc key={arc.key} points={arc.points} color={arc.color} />
        ))}

        {threatNodes.map(n => (
          <ThreatNode key={n.key} position={n.pos} threat={n.threat} color={n.color} />
        ))}

        {/* Target location (green pulsing node) */}
        {targetNode && (
          <mesh position={targetNode}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#00ff88" />
          </mesh>
        )}
      </group>

      <Sphere ref={glowRef} args={[2.15, 32, 32]}>
        <meshBasicMaterial color="#00ff88" transparent opacity={0.02} side={THREE.BackSide} />
      </Sphere>

      <Stars radius={80} depth={60} count={2500} factor={4} saturation={0} fade speed={0.5} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
        minDistance={3.5}
        maxDistance={9}
        autoRotate={false}
      />
    </>
  );
}

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function CyberGlobe({ threats = [], style = {} }) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }} gl={{ alpha: true, antialias: true }} raycaster={{ params: { Points: { threshold: 0.1 } } }}>
        <Globe threats={threats} />
      </Canvas>
    </div>
  );
}
