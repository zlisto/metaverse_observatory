import { useMemo } from 'react'
import * as THREE from 'three'
import Portal from './Portal.jsx'
import Aetheroscope from './Aetheroscope.jsx'
import Scientist from './guide/Scientist.jsx'
import { DOME_R, GUIDE, H, PORTAL } from './layout.js'

function starfield() {
  const n = 900
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = DOME_R * 0.96
    // upper hemisphere bias
    const y = Math.abs(Math.cos(phi)) * r
    const s = Math.sin(phi) * r
    pos[i * 3] = s * Math.cos(theta)
    pos[i * 3 + 1] = 0.4 + y * 0.85
    pos[i * 3 + 2] = s * Math.sin(theta)
  }
  return pos
}

export default function World({ talking, onTalk, onLook, scopeHot }) {
  const stars = useMemo(starfield, [])
  const domeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0c1020',
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.BackSide,
      }),
    [],
  )

  return (
    <>
      <color attach="background" args={['#05070f']} />
      <fog attach="fog" args={['#05070f', 14, 32]} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={['#6a7cff', '#1a1208', 0.55]} />
      <pointLight position={[0, 6.5, 0]} intensity={40} distance={22} color="#c9b8ff" />
      <pointLight position={[4, 2.5, 3]} intensity={18} distance={12} color="#ffb070" />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[DOME_R, 64]} />
        <meshStandardMaterial color="#1a1520" roughness={0.9} />
      </mesh>
      {/* inlaid ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.2, 3.45, 64]} />
        <meshStandardMaterial color="#b8954a" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* dome shell */}
      <mesh material={domeMat} position={[0, 0.2, 0]}>
        <sphereGeometry args={[DOME_R, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* ribs */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[0, H * 0.45, 0]} rotation={[0, a, 0]}>
            <torusGeometry args={[DOME_R * 0.98, 0.04, 6, 48, Math.PI]} />
            <meshStandardMaterial color="#2a3348" metalness={0.4} roughness={0.5} />
          </mesh>
        )
      })}

      {/* painted constellation on the dome (simple arcs) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={stars.length / 3} array={stars} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#e8f0ff" sizeAttenuation transparent opacity={0.85} />
      </points>

      {/* south arch + portal */}
      <mesh position={[0, 2.2, PORTAL.z - 0.05]}>
        <boxGeometry args={[4.2, 4.4, 0.35]} />
        <meshStandardMaterial color="#243044" />
      </mesh>
      <Portal
        x={PORTAL.x}
        z={PORTAL.z}
        rot={PORTAL.rot}
        href={PORTAL.href}
        spawn={PORTAL.spawn}
        back={PORTAL.back}
        label={PORTAL.label}
        color="#ff4fa3"
      />

      <Aetheroscope onLook={onLook} highlighted={scopeHot} />
      <Scientist position={[GUIDE.x, 0, GUIDE.z]} rotation={GUIDE.rot} talking={talking} onTalk={onTalk} />

      {/* low benches */}
      {[
        [-5.5, 2.5],
        [5.5, 2.5],
        [-5.5, -5],
        [5.5, -5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}>
          <boxGeometry args={[1.6, 0.44, 0.55]} />
          <meshStandardMaterial color="#3a2a22" roughness={0.85} />
        </mesh>
      ))}
    </>
  )
}
