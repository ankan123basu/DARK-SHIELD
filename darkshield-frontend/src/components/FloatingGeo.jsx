import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGeo({ color = '#00ff88', speed = 0.004, scale = 1 }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += speed;
      meshRef.current.rotation.y += speed * 1.6;
      meshRef.current.rotation.z += speed * 0.5;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x -= speed * 0.8;
      innerRef.current.rotation.y -= speed * 1.2;
    }
  });

  return (
    <>
      <group ref={meshRef} scale={scale}>
        {/* Outer icosahedron wireframe */}
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
        </mesh>
        {/* Inner octahedron */}
        <mesh ref={innerRef} scale={0.6}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.25} />
        </mesh>
        {/* Glow core */}
        <mesh scale={0.2}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        {/* Outer glow shell */}
        <mesh scale={1.1}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.04} side={THREE.BackSide} />
        </mesh>
      </group>
    </>
  );
}

function ParticleField({ count = 120 }) {
  const ref = useRef();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    const isGreen = Math.random() > 0.5;
    colors[i * 3] = isGreen ? 0 : 0;
    colors[i * 3 + 1] = isGreen ? 1 : 0.9;
    colors[i * 3 + 2] = isGreen ? 0.53 : 1;
  }

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function FloatingGeo({ style = {}, color = '#00ff88', showParticles = true }) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color={color} />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#00e5ff" />
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <RotatingGeo color={color} speed={0.005} scale={1} />
        </Float>
        {showParticles && <ParticleField count={80} />}
        <Stars radius={30} depth={20} count={800} factor={2} fade speed={0.3} />
      </Canvas>
    </div>
  );
}
