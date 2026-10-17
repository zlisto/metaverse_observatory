import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VIEWERS } from './guide/interact.js'
import { SCOPE } from './layout.js'

const SLUG = 'aetheroscope'

function brass(rough = 0.35) {
  return new THREE.MeshStandardMaterial({ color: '#b8954a', metalness: 0.85, roughness: rough })
}
function glass() {
  return new THREE.MeshPhysicalMaterial({
    color: '#7ec8ff',
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.65,
    thickness: 0.4,
    transparent: true,
    opacity: 0.9,
  })
}

function labelTex(hot) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(11,11,18,0.88)'
  g.beginPath()
  g.roundRect(8, 16, 496, 96, 24)
  g.fill()
  g.strokeStyle = hot ? '#7ec8ff' : '#b8954a'
  g.lineWidth = 6
  g.stroke()
  g.fillStyle = '#fff'
  g.font = 'bold 42px Georgia, serif'
  g.textAlign = 'center'
  g.fillText('Aetheroscope', 256, 62)
  g.fillStyle = hot ? '#7ec8ff' : '#c9b48a'
  g.font = '24px system-ui, sans-serif'
  g.fillText(hot ? 'E · look into the Metaverse' : 'peer into the Metaverse', 256, 96)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Aetheroscope({ onLook, highlighted }) {
  const root = useRef()
  const eye = useRef()
  const ring = useRef()
  const mats = useMemo(
    () => ({
      brass: brass(),
      dark: brass(0.55),
      glass: glass(),
      glow: new THREE.MeshBasicMaterial({ color: '#5ec8ff', toneMapped: false }),
    }),
    [],
  )
  const label = useMemo(() => labelTex(!!highlighted), [highlighted])

  useEffect(() => {
    VIEWERS.set(SLUG, root.current)
    return () => VIEWERS.delete(SLUG)
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (eye.current) eye.current.rotation.z = t * 0.35
    if (ring.current) {
      ring.current.rotation.y = t * 0.6
      ring.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.03)
    }
  })

  return (
    <group ref={root} position={[SCOPE.x, 0, SCOPE.z]} rotation={[0, SCOPE.yaw, 0]}>
      <mesh position={[0, 0.35, 0]} material={mats.dark}>
        <cylinderGeometry args={[0.55, 0.75, 0.7, 24]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={mats.brass}>
        <cylinderGeometry args={[0.35, 0.5, 0.18, 24]} />
      </mesh>

      <group position={[0, 1.05, 0]} rotation={[-0.55, 0, 0]}>
        <mesh position={[0, 0.55, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.22, 0.28, 1.1, 20]} />
        </mesh>
        <mesh position={[0, 1.15, 0]} material={mats.brass}>
          <sphereGeometry args={[0.32, 24, 16]} />
        </mesh>
        <mesh position={[0, 1.55, 0.55]} rotation={[1.1, 0, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.38, 0.48, 1.4, 28]} />
        </mesh>
        <mesh ref={eye} position={[0, 1.85, 1.05]} rotation={[1.1, 0, 0]} material={mats.glass}>
          <circleGeometry args={[0.36, 32]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.42 * s, 1.35, 0.2]} rotation={[0.8, 0, 0.4 * s]} material={mats.brass}>
            <cylinderGeometry args={[0.1, 0.12, 0.55, 16]} />
          </mesh>
        ))}
        <group ref={ring} position={[0, 1.15, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.brass}>
            <torusGeometry args={[0.7, 0.035, 10, 48]} />
          </mesh>
          <mesh rotation={[0.4, 0.5, 0]} material={mats.glow}>
            <torusGeometry args={[0.55, 0.012, 8, 48]} />
          </mesh>
        </group>
      </group>

      <sprite position={[0, 3.15, 0]} scale={[2.2, 0.55, 1]}>
        <spriteMaterial transparent depthTest={false} map={label} />
      </sprite>

      <pointLight position={[0, 2.2, 0.8]} color="#7ec8ff" intensity={highlighted ? 4.5 : 2.2} distance={6} />

      <mesh
        position={[0, 1.6, 0.3]}
        visible={false}
        onClick={(e) => {
          if (document.pointerLockElement) return
          e.stopPropagation()
          onLook?.()
        }}
      >
        <boxGeometry args={[1.8, 2.8, 1.8]} />
      </mesh>
    </group>
  )
}
