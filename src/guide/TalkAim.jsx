import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { REACH, TALKERS, VIEWERS } from './interact.js'

// Ray through the crosshair. Hits a talker or the Aetheroscope within REACH.
// onAim({ kind: 'talk'|'view', id }) ; click / E calls onUse with the same payload.
export default function TalkAim({ enabled, onAim, onUse }) {
  const { camera, gl } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const aim = useRef(null)

  useFrame(() => {
    let hit = null
    if (enabled) {
      ray.setFromCamera(center, camera)
      ray.far = REACH
      let best = Infinity
      for (const [id, obj] of TALKERS) {
        const h = ray.intersectObject(obj, true)[0]
        if (h && h.distance < best) {
          best = h.distance
          hit = { kind: 'talk', id }
        }
      }
      for (const [id, obj] of VIEWERS) {
        const h = ray.intersectObject(obj, true)[0]
        if (h && h.distance < best) {
          best = h.distance
          hit = { kind: 'view', id }
        }
      }
    }
    const same = hit?.kind === aim.current?.kind && hit?.id === aim.current?.id
    if (!same) {
      aim.current = hit
      onAim(hit)
    }
  })

  useEffect(() => {
    const fire = () => aim.current && onUse(aim.current)
    const click = (e) => {
      if (e.button === 0 && aim.current && document.pointerLockElement === gl.domElement) fire()
    }
    const key = (e) => {
      if (e.code === 'KeyE' && aim.current && !e.target.closest?.('input, textarea, button, a')) fire()
    }
    window.addEventListener('mousedown', click)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', key)
    }
  }, [gl, onUse])
  return null
}
