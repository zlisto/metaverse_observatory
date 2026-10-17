import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Labubu from './Labubu.jsx'
import { useTalker } from './avatar.js'

// Dr. Nova — scientist Labubu in a white coat and brass goggles, keeps the Aetheroscope.
export const SCIENTIST = { slug: 'dr-nova', name: 'Dr. Nova' }

export default function Scientist({ position = [0, 0, 0], rotation = 0, talking = false, onTalk }) {
  const { root, gesture, clickProps } = useTalker(SCIENTIST.slug, {
    position,
    rotation,
    talking,
    headY: 0.85,
  })
  const clip = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const g = gesture.current
    if (clip.current) {
      clip.current.rotation.z = Math.sin(t * 2.1) * 0.15 + g * 0.1
    }
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} {...clickProps(onTalk)}>
      <Labubu
        fur="#c4a574"
        expression={talking ? 'happy' : 'grin'}
        shirt="#f4f1ea"
        pants="#2a3344"
        hat="#d4c4a0"
        anim={talking ? 'wave' : 'idle'}
        height={1.05}
      />
      {/* brass goggles perched on the hat brim */}
      <group position={[0, 0.92, 0.12]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.07 * s, 0, 0.02]}>
            <torusGeometry args={[0.045, 0.01, 8, 20]} />
            <meshStandardMaterial color="#b8954a" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
          <meshStandardMaterial color="#b8954a" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>
      {/* clipboard */}
      <group ref={clip} position={[0.28, 0.55, 0.12]} rotation={[0.3, -0.4, 0.2]}>
        <mesh>
          <boxGeometry args={[0.16, 0.22, 0.02]} />
          <meshStandardMaterial color="#8a6b4a" />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.13, 0.18, 0.005]} />
          <meshStandardMaterial color="#f7f2e6" />
        </mesh>
      </group>
    </group>
  )
}
