import { pickSpawn } from './mvw.js'

// Planetarium dome. Units are meters. +x east, -z north, y up.

export const H = 8 // dome peak
export const SPEED = { walk: 10, run: 16 }
export const EYE = 1.65
export const R_PLAYER = 0.35
export const ROOM = { xMin: -9, xMax: 9, zMin: -9, zMax: 9 }
export const DOME_R = 8.6

export const SPAWNS = {
  default: { x: 0, z: 3.2, yaw: 0 }, // facing the Aetheroscope (north)
  from_square: { x: 0, z: 6.2, yaw: 0 }, // in front of south portal, facing in
}
export const SPAWN = pickSpawn(SPAWNS)

export const PORTAL = {
  x: 0,
  z: ROOM.zMax - 0.15,
  rot: Math.PI, // face into the room (toward -z)
  href: import.meta.env.DEV ? 'http://localhost:5178/' : 'https://zlisto.github.io/hub_world/',
  spawn: 'by_metaverse_observatory',
  back: 'from_square',
  label: 'Metaverse Square',
}

// Aetheroscope: giant brass viewing contraption aimed at the dome sky
export const SCOPE = { x: 0, z: -2.4, r: 1.1, yaw: 0 }
// Scientist Labubu beside it
export const GUIDE = { x: -2.4, z: -1.6, r: 0.45 }
GUIDE.rot = Math.atan2(SPAWNS.default.x - GUIDE.x, SPAWNS.default.z - GUIDE.z)

export function collide(pos) {
  // circular floor of the dome
  const d = Math.hypot(pos.x, pos.z)
  const max = DOME_R - R_PLAYER
  if (d > max) {
    pos.x = (pos.x / d) * max
    pos.z = (pos.z / d) * max
  }
  for (const o of [GUIDE, SCOPE]) {
    const dx = pos.x - o.x
    const dz = pos.z - o.z
    const dist = Math.hypot(dx, dz)
    const rr = R_PLAYER + o.r
    if (dist < rr && dist > 1e-6) {
      pos.x = o.x + (dx / dist) * rr
      pos.z = o.z + (dz / dist) * rr
    }
  }
  return pos
}

export function locate(x, z) {
  if (Math.hypot(x - SCOPE.x, z - SCOPE.z) < 2.4) return 'Observatory · at the Aetheroscope'
  if (Math.hypot(x - GUIDE.x, z - GUIDE.z) < 2.2) return 'Observatory · with Dr. Nova'
  if (z > PORTAL.z - 2.2) return 'Observatory · by the portal to Metaverse Square'
  return 'Observatory · under the dome'
}
