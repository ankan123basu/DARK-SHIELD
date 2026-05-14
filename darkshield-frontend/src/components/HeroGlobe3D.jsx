import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// ── Globe sphere with lat/lon grid ──
function GlobeSphere() {
  const sphereRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.0008;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += 0.0008;
      const t = state.clock.elapsedTime;
      glowRef.current.material.opacity = 0.06 + Math.sin(t * 0.7) * 0.015;
    }
  });

  // Build lat/lon grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const R = 1.001;
    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let lon = 0; lon <= 360; lon += 4) {
        const theta = lon * (Math.PI / 180);
        pts.push(new THREE.Vector3(
          R * Math.sin(phi) * Math.cos(theta),
          R * Math.cos(phi),
          R * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(pts);
    }
    // Longitude lines
    for (let lon = 0; lon < 360; lon += 15) {
      const pts = [];
      const theta = lon * (Math.PI / 180);
      for (let lat = -90; lat <= 90; lat += 3) {
        const phi = (90 - lat) * (Math.PI / 180);
        pts.push(new THREE.Vector3(
          R * Math.sin(phi) * Math.cos(theta),
          R * Math.cos(phi),
          R * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(pts);
    }
    return lines;
  }, []);

  return (
    <group ref={sphereRef}>
      {/* Core globe */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#020810"
          emissive="#001a0d"
          emissiveIntensity={0.3}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid lines */}
      {gridLines.map((pts, i) => {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial
              color={i % 6 === 0 ? '#00e5ff' : '#00ff88'}
              transparent
              opacity={i % 6 === 0 ? 0.12 : 0.06}
            />
          </line>
        );
      })}

      {/* Outer atmosphere glow */}
      <mesh ref={glowRef} scale={1.08}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inner atmosphere */}
      <mesh scale={1.03}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// ── City node markers on the globe ──
function CityNode({ lat, lon, color = '#ff003c', size = 0.018, pulse = true }) {
  const ref = useRef();
  const ringRef = useRef();
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = lon * (Math.PI / 180);
  const pos = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 2 + lat) * 0.3);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + (Math.sin(t * 1.5 + lon) + 1) * 0.8);
      ringRef.current.material.opacity = 0.6 - (Math.sin(t * 1.5 + lon) + 1) * 0.25;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {pulse && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 2.5, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      <pointLight color={color} intensity={0.3} distance={0.5} />
    </group>
  );
}

// ── Animated attack arc with flowing particles ──
function AttackArc({ srcLat, srcLon, tgtLat, tgtLon, color = '#ff003c', speed = 1 }) {
  const particlesRef = useRef();
  const trailRef = useRef();

  const { curve, tubeGeo } = useMemo(() => {
    const toVec = (lat, lon) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = lon * (Math.PI / 180);
      return new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
    };
    const src = toVec(srcLat, srcLon);
    const tgt = toVec(tgtLat, tgtLon);
    const mid = src.clone().add(tgt).multiplyScalar(0.5).normalize().multiplyScalar(1.45);
    const curve = new THREE.CatmullRomCurve3([src, mid, tgt]);
    const pts = curve.getPoints(80);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return { curve, tubeGeo: geo };
  }, [srcLat, srcLon, tgtLat, tgtLon]);

  // Particle positions along the arc
  const particlePositions = useMemo(() => {
    const count = 6;
    return new Float32Array(count * 3);
  }, []);

  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed * 0.12) % 1;
    for (let i = 0; i < 6; i++) {
      const offset = (t + i * 0.12) % 1;
      const pt = curve.getPoint(offset);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;
    }
    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Arc line */}
      <line geometry={tubeGeo}>
        <lineBasicMaterial color={color} transparent opacity={0.25} linewidth={1} />
      </line>
      {/* Moving particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
            count={6}
          />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.025} transparent opacity={0.9} sizeAttenuation />
      </points>
    </group>
  );
}

// ── Orbiting satellite ring ──
function SatelliteRing({ radius = 1.35, speed = 0.4, color = '#00e5ff', tilt = 0 }) {
  const ringRef = useRef();
  const satRef = useRef();
  const progressRef = useRef(0);

  const ringPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  useFrame((state, delta) => {
    progressRef.current = (progressRef.current + delta * speed * 0.1) % (Math.PI * 2);
    if (satRef.current) {
      satRef.current.position.set(
        Math.cos(progressRef.current) * radius,
        0,
        Math.sin(progressRef.current) * radius
      );
    }
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <line geometry={ringPoints}>
        <lineBasicMaterial color={color} transparent opacity={0.12} />
      </line>
      <group ref={satRef}>
        <mesh>
          <octahedronGeometry args={[0.022, 0]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <pointLight color={color} intensity={0.5} distance={0.4} />
      </group>
    </group>
  );
}

// ── Data stream particles around globe ──
function DataStreamRing({ count = 60, radius = 1.25, color = '#00ff88' }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.3;
      pos[i * 3] = Math.cos(angle) * (radius + spread);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = Math.sin(angle) * (radius + spread);
    }
    return pos;
  }, [count, radius]);

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.012} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ── Floating hex panels ──
function HexPanel({ position, rotation, color = '#00e5ff' }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.02;
    }
  });

  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const r = 0.08;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    return shape;
  }, []);

  return (
    <mesh position={position} rotation={rotation} ref={ref}>
      <shapeGeometry args={[hexShape]} />
      <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main scene ──
function GlobeScene() {
  const arcs = [
    { srcLat: 55.75, srcLon: 37.62, tgtLat: 28.61, tgtLon: 77.21, color: '#ff003c', speed: 1.2 },
    { srcLat: 35.68, srcLon: 139.65, tgtLat: 19.07, tgtLon: 72.88, color: '#ff003c', speed: 0.9 },
    { srcLat: 40.71, srcLon: -74.01, tgtLat: 12.97, tgtLon: 77.59, color: '#ff6d00', speed: 1.5 },
    { srcLat: 51.50, srcLon: -0.12, tgtLat: 28.61, tgtLon: 77.21, color: '#ffd600', speed: 0.7 },
    { srcLat: 39.91, srcLon: 116.39, tgtLat: 28.61, tgtLon: 77.21, color: '#ff003c', speed: 1.1 },
    { srcLat: 48.85, srcLon: 2.35, tgtLat: 22.57, tgtLon: 88.36, color: '#b14eff', speed: 0.85 },
    { srcLat: -33.87, srcLon: 151.21, tgtLat: 13.08, tgtLon: 80.27, color: '#ff6d00', speed: 1.3 },
  ];

  const cities = [
    { lat: 28.61, lon: 77.21, color: '#00ff88', size: 0.022 }, // Delhi
    { lat: 19.07, lon: 72.88, color: '#00ff88', size: 0.018 }, // Mumbai
    { lat: 12.97, lon: 77.59, color: '#00ff88', size: 0.016 }, // Bangalore
    { lat: 22.57, lon: 88.36, color: '#00ff88', size: 0.015 }, // Kolkata
    { lat: 13.08, lon: 80.27, color: '#00ff88', size: 0.015 }, // Chennai
    { lat: 17.38, lon: 78.49, color: '#00ff88', size: 0.013 }, // Hyderabad
    // Source countries
    { lat: 55.75, lon: 37.62, color: '#ff003c', size: 0.02 }, // Moscow
    { lat: 35.68, lon: 139.65, color: '#ff003c', size: 0.018 }, // Tokyo
    { lat: 40.71, lon: -74.01, color: '#ff6d00', size: 0.018 }, // NYC
    { lat: 39.91, lon: 116.39, color: '#ff003c', size: 0.02 }, // Beijing
    { lat: 51.50, lon: -0.12, color: '#ffd600', size: 0.016 }, // London
    { lat: 48.85, lon: 2.35, color: '#b14eff', size: 0.016 }, // Paris
  ];

  const hexPanels = [
    { position: [2.0, 0.4, 0], rotation: [0, -0.4, 0], color: '#00e5ff' },
    { position: [2.2, -0.6, 0.5], rotation: [0, -0.6, 0.2], color: '#00ff88' },
    { position: [-2.0, 0.6, 0.3], rotation: [0, 0.5, 0], color: '#b14eff' },
    { position: [-2.1, -0.3, -0.4], rotation: [0, 0.3, 0.1], color: '#00e5ff' },
    { position: [0.6, 1.9, 0.5], rotation: [0.4, 0, 0], color: '#ffd600' },
  ];

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[3, 3, 3]} intensity={1.5} color="#00ff88" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#00e5ff" />
      <pointLight position={[0, 4, 0]} intensity={0.4} color="#ffffff" />
      <pointLight position={[2, -3, -2]} intensity={0.6} color="#ff003c" />

      <GlobeSphere />

      {arcs.map((arc, i) => <AttackArc key={i} {...arc} />)}
      {cities.map((city, i) => <CityNode key={i} {...city} />)}

      <SatelliteRing radius={1.4} speed={0.5} color="#00e5ff" tilt={0.4} />
      <SatelliteRing radius={1.55} speed={-0.35} color="#b14eff" tilt={-0.7} />
      <SatelliteRing radius={1.65} speed={0.2} color="#00ff88" tilt={1.2} />

      <DataStreamRing count={80} radius={1.2} color="#00ff88" />
      <DataStreamRing count={50} radius={1.8} color="#00e5ff" />

      {hexPanels.map((p, i) => <HexPanel key={i} {...p} />)}

      <Stars radius={40} depth={25} count={2000} factor={2.5} fade speed={0.2} />
    </>
  );
}

export default function HeroGlobe3D({ style = {} }) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        camera={{ position: [0, 0.5, 2.8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <GlobeScene />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={1.8}
          maxDistance={5}
          autoRotate={true}
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
