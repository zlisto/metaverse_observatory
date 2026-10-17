import { Fragment, useEffect, useRef, useState } from 'react'
import { GREETING, LESSONS } from './lessons.js'

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    return <Fragment key={i}>{part}</Fragment>
  })
}

function Rich({ text }) {
  return text.split('\n').map((line, i) =>
    line.trim() ? (
      <p key={i}>{inline(line)}</p>
    ) : null,
  )
}

let saved = null

export default function GuidePanel({ visitor, onClose }) {
  const [messages, setMessages] = useState(
    () => saved ?? [{ who: 'nova', text: GREETING.replace('Ah —', visitor ? `Ah, ${visitor} —` : 'Ah —') }],
  )
  const [typing, setTyping] = useState(false)
  const log = useRef()
  useEffect(() => {
    saved = messages
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])
  useEffect(() => {
    const esc = (e) => e.code === 'Escape' && onClose()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [onClose])

  const asked = new Set(messages.filter((m) => m.who === 'you').map((m) => m.text))
  const ask = (lesson) => {
    if (typing) return
    setMessages((m) => [...m, { who: 'you', text: lesson.q }])
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { who: 'nova', text: lesson.a }])
      setTyping(false)
    }, 550)
  }

  return (
    <div className="guide" role="dialog" aria-label="Dr. Nova">
      <header>
        <div className="guide-avatar">N</div>
        <div className="guide-title">
          Dr. Nova
          <span>Astronomer of the Metaverse Web</span>
        </div>
        <button className="guide-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="guide-log" ref={log}>
        {messages.map((m, i) => (
          <div key={i} className={`guide-msg ${m.who}`}>
            <Rich text={m.text} />
          </div>
        ))}
        {typing && <div className="guide-msg nova typing">···</div>}
      </div>
      <div className="guide-asks">
        {LESSONS.map((lesson) => (
          <button
            key={lesson.q}
            className={asked.has(lesson.q) ? 'asked' : ''}
            disabled={typing || asked.has(lesson.q)}
            onClick={() => ask(lesson)}
          >
            {lesson.q}
          </button>
        ))}
      </div>
      <div className="guide-foot">Esc or click outside to close</div>
    </div>
  )
}
