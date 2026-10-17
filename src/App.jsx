import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import TouchControls from './TouchControls.jsx'
import TalkAim from './guide/TalkAim.jsx'
import GuidePanel from './guide/GuidePanel.jsx'
import StellarMap from './StellarMap.jsx'
import { SCIENTIST } from './guide/Scientist.jsx'
import { EYE, SPAWN } from './layout.js'
import { onIdentity, presence } from './mvw.js'

const NAME = 'Metaverse Observatory'
const BLURB =
  'A planetarium under a painted sky. Talk to Dr. Nova, then peer into the Aetheroscope to see every registered world as a star — and teleport across the Metaverse Web.'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const lockRef = useRef()
  const onLock = useCallback((v) => {
    setLocked(v)
    if (v) setFree(false)
  }, [])
  const [free, setFree] = useState(false)
  const freeRef = useRef(free)
  freeRef.current = free
  const onWhere = useCallback((w) => {
    setWhere(w)
    presence(w)
  }, [])
  const [me, setMe] = useState(null)
  useEffect(() => onIdentity(setMe), [])

  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }

  const [aim, setAim] = useState(null)
  const [talking, setTalking] = useState(false)
  const [mapping, setMapping] = useState(false)

  const startTalk = useCallback(() => {
    setFree(false)
    setTalking(true)
    document.exitPointerLock?.()
  }, [])
  const endTalk = useCallback(() => {
    setTalking(false)
    if (touchOn) return
    setFree(true)
    lockRef.current?.()
  }, [touchOn])

  const openMap = useCallback(() => {
    setTalking(false)
    setFree(false)
    setMapping(true)
    document.exitPointerLock?.()
    presence('Observatory · inside the Aetheroscope')
  }, [])
  const closeMap = useCallback(() => {
    setMapping(false)
    if (touchOn) return
    setFree(true)
    lockRef.current?.()
    presence('Observatory · at the Aetheroscope')
  }, [touchOn])

  const onUse = useCallback(
    (hit) => {
      if (!hit) return
      if (hit.kind === 'talk') startTalk()
      if (hit.kind === 'view') openMap()
    },
    [startTalk, openMap],
  )

  useEffect(() => {
    document.body.classList.toggle('freelook', free && !mapping)
  }, [free, mapping])

  const playing = !mapping && (locked || touchOn || free || talking)

  useEffect(() => {
    if (!free || talking || mapping) return
    if (isTouch) {
      setTouch(true)
      setFree(false)
      return
    }
    const click = (e) => !e.target.closest('button, a, .guide, .stellarmap') && lockRef.current?.()
    addEventListener('mousedown', click)
    return () => removeEventListener('mousedown', click)
  }, [free, talking, mapping]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!talking || touchOn) return
    const clickOut = (e) => {
      if (e.button !== 0 || e.target.closest('.guide, button, a')) return
      endTalk()
    }
    addEventListener('mousedown', clickOut)
    return () => removeEventListener('mousedown', clickOut)
  }, [talking, touchOn, endTalk])

  const hint =
    aim?.kind === 'view'
      ? touchOn
        ? 'Look into the Aetheroscope'
        : locked
          ? 'Click or press E to look into the Aetheroscope'
          : 'Press E to look into the Aetheroscope'
      : aim?.kind === 'talk'
        ? touchOn
          ? `Talk to ${SCIENTIST.name}`
          : locked
            ? `Click or press E to talk to ${SCIENTIST.name}`
            : `Press E to talk to ${SCIENTIST.name}`
        : null

  return (
    <>
      {!mapping && (
        <Canvas camera={{ fov: 72, near: 0.05, far: 200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
          <World talking={talking} onTalk={startTalk} onLook={openMap} scopeHot={aim?.kind === 'view'} />
          <TalkAim enabled={playing && !talking} onAim={setAim} onUse={onUse} />
          <Player lockRef={lockRef} freeRef={freeRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
        </Canvas>
      )}

      {mapping && <StellarMap onClose={closeMap} />}

      {!mapping && (
        <div className="where">
          <span className="dot" style={me?.color ? { background: me.color } : undefined} />
          {where}
        </div>
      )}
      {playing && !talking && <div className="crosshair" />}
      {free && !talking && !mapping && (
        <div className="hint">Move the mouse to look · click to lock it · WASD to walk</div>
      )}
      {hint && playing && !talking && (
        <div className="talkhint">
          {touchOn && aim?.kind === 'talk' ? (
            <button onClick={startTalk}>Talk to {SCIENTIST.name}</button>
          ) : touchOn && aim?.kind === 'view' ? (
            <button onClick={openMap}>Look into the Aetheroscope</button>
          ) : (
            hint
          )}
        </div>
      )}
      {talking && <GuidePanel visitor={me?.name} onClose={endTalk} />}
      {touchOn && !mapping && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {!playing && !mapping && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">{me?.name ? `Welcome, ${me.name}` : 'Welcome'}</div>
            <h1>{NAME}</h1>
            <p className="sub">{BLURB}</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            <div className="keys">
              {isTouch ? (
                <>
                  <span>
                    <b>Left thumb</b> walk
                  </span>
                  <span>
                    <b>Right thumb</b> drag to look
                  </span>
                </>
              ) : (
                <>
                  <span>
                    <b>WASD</b> walk
                  </span>
                  <span>
                    <b>Mouse</b> look
                  </span>
                  <span>
                    <b>E</b> talk / look
                  </span>
                  <span>
                    <b>Esc</b> pause
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
