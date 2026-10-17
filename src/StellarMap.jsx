import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { navigate } from './mvw.js'
import { fadeOut, whoosh } from './audio.js'

const OBS_BACK = 'from_square'
const HUB_ID = 'metaverse_square'

function hashColor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const hue = h % 360
  return `hsl(${hue} 70% 62%)`
}

function pickSpawn(node) {
  const spawns = node.spawns || []
  if (spawns.includes('from_square')) return 'from_square'
  if (node.id === HUB_ID) return 'default'
  if (spawns.includes('default')) return 'default'
  return spawns[0] || 'default'
}

function OrbitCamera({ radius0 = 18 }) {
  const { camera, gl } = useThree()
  const state = useRef({ theta: 0.55, phi: 0.85, r: radius0, dragging: false, last: [0, 0] })

  useEffect(() => {
    const el = gl.domElement
    const down = (e) => {
      if (e.button !== 0) return
      state.current.dragging = true
      state.current.last = [e.clientX, e.clientY]
    }
    const up = () => {
      state.current.dragging = false
    }
    const move = (e) => {
      const s = state.current
      if (!s.dragging) return
      const dx = e.clientX - s.last[0]
      const dy = e.clientY - s.last[1]
      s.last = [e.clientX, e.clientY]
      s.theta -= dx * 0.005
      s.phi = Math.max(0.2, Math.min(Math.PI - 0.2, s.phi + dy * 0.005))
    }
    const wheel = (e) => {
      e.preventDefault()
      state.current.r = Math.max(6, Math.min(40, state.current.r + e.deltaY * 0.02))
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointermove', move)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointermove', move)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame(() => {
    const { theta, phi, r } = state.current
    camera.position.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta),
    )
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Edge({ a, b }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...a),
      new THREE.Vector3(...b),
    ])
    return g
  }, [a, b])
  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#5ec8ff" transparent opacity={0.55} />
    </line>
  )
}

function Planet({ node, selected, onSelect }) {
  const ref = useRef()
  const color = useMemo(() => hashColor(node.id), [node.id])
  const r = node.id === HUB_ID ? 0.55 : 0.32
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.4
    const pulse = selected ? 1.15 + Math.sin(clock.elapsedTime * 4) * 0.08 : 1
    ref.current.scale.setScalar(pulse)
  })
  const p = node.position || [0, 0, 0]
  return (
    <group position={p}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(node)
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[r, 24, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.85 : 0.35}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      {!node.online && (
        <mesh>
          <sphereGeometry args={[r * 1.15, 16, 12]} />
          <meshBasicMaterial color="#444" wireframe transparent opacity={0.5} />
        </mesh>
      )}
      <sprite position={[0, r + 0.45, 0]} scale={[2.4, 0.55, 1]}>
        <spriteMaterial map={nameTex(node.name)} transparent depthTest={false} />
      </sprite>
    </group>
  )
}

const nameCache = new Map()
function nameTex(name) {
  if (nameCache.has(name)) return nameCache.get(name)
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 96
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(8,10,18,0.75)'
  g.beginPath()
  g.roundRect(8, 16, 496, 64, 16)
  g.fill()
  g.fillStyle = '#fff'
  g.font = 'bold 32px system-ui, sans-serif'
  g.textAlign = 'center'
  g.fillText(name, 256, 58, 470)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  nameCache.set(name, t)
  return t
}

function Scene({ graph, selected, onSelect }) {
  const byId = useMemo(() => Object.fromEntries((graph?.nodes || []).map((n) => [n.id, n])), [graph])
  const stars = useMemo(() => {
    const n = 1200
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 80
      a[i * 3 + 1] = (Math.random() - 0.5) * 80
      a[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    return a
  }, [])

  return (
    <>
      <color attach="background" args={['#02040c']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[8, 12, 6]} intensity={60} distance={60} color="#a8c4ff" />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={stars.length / 3} array={stars} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#9ab0d8" sizeAttenuation />
      </points>
      {(graph?.edges || []).map((e, i) => {
        const a = byId[e.from]?.position
        const b = byId[e.to]?.position
        if (!a || !b) return null
        return <Edge key={i} a={a} b={b} />
      })}
      {(graph?.nodes || []).map((n) => (
        <Planet key={n.id} node={n} selected={selected?.id === n.id} onSelect={onSelect} />
      ))}
      <OrbitCamera />
      <mesh
        onClick={() => onSelect(null)}
        visible={false}
      >
        <sphereGeometry args={[90, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>
    </>
  )
}

export default function StellarMap({ onClose }) {
  const [graph, setGraph] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`./network/network.json?t=${Date.now()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (alive) setGraph(data)
      } catch (e) {
        if (alive) setError(e.message || 'Could not load network')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const esc = (e) => {
      if (e.code === 'Escape') {
        if (selected) setSelected(null)
        else onClose()
      }
    }
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [onClose, selected])

  const teleport = () => {
    if (!selected?.address) return
    fadeOut()
    whoosh()
    navigate(selected.address, pickSpawn(selected), OBS_BACK)
  }

  const stats = graph?.stats

  return (
    <div className="stellarmap">
      <Canvas camera={{ fov: 55, near: 0.1, far: 200, position: [0, 8, 18] }} dpr={[1, 1.75]}>
        <Scene graph={graph} selected={selected} onSelect={setSelected} />
      </Canvas>

      <div className="map-chrome">
        <div className="map-title">
          <div className="kicker">Aetheroscope</div>
          <h2>Metaverse Network</h2>
          <p>
            {loading && 'Listening for worlds…'}
            {!loading && error && `Map offline — ${error}`}
            {!loading && !error && stats && (
              <>
                {stats.online}/{stats.worlds} worlds · {stats.edges} portal roads
              </>
            )}
          </p>
        </div>
        <button className="map-exit" onClick={onClose}>
          Leave eyepiece · Esc
        </button>
      </div>

      <div className="map-hint">Drag to orbit · scroll to zoom · click a world</div>

      {selected && (
        <div className="world-pop">
          <div className="world-pop-head">
            <span className={`world-dot ${selected.online ? '' : 'off'}`} />
            <b>{selected.name}</b>
            <button className="guide-close" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
          </div>
          <p className="world-pop-desc">{selected.description || 'No description in the manifest.'}</p>
          <div className="world-pop-meta">
            <span>{selected.owner ? `@${selected.owner}` : 'unknown owner'}</span>
            <span>{(selected.portals || []).length} portals out</span>
          </div>
          <button className="go" onClick={teleport} disabled={!selected.online}>
            {selected.online ? 'Teleport →' : 'Offline'}
          </button>
        </div>
      )}
    </div>
  )
}
