// Capture: write, speak, photo or link → "Understanding this memory…" → extracted context animates in → saved.
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ai } from '../ai/provider'
import { firstName } from '../engine/memory'
import { delay, haptic, list } from '../lib/util'
import { useApp } from '../store'
import type { Memory, SourceType } from '../types'
import { Icon, Press, Segmented, Sheet, Thinking, spring } from './ui'

const MODES = [['write', 'Write'], ['speak', 'Speak'], ['photo', 'Photo'], ['link', 'Link']] as const
type Mode = (typeof MODES)[number][0]
type Phase = { s: 'input' } | { s: 'thinking'; label: string } | { s: 'done'; memory: Memory; extra: [string, string][] } | { s: 'error' }

const DEMO_TRANSCRIPT = 'Lucia mentioned she wants to save enough to get her mother out of Leonida before the summer.'

export function CaptureSheet() {
  const { capture, closeCapture } = useApp()
  return (
    <Sheet open={!!capture} onClose={closeCapture} title="Capture">
      {capture && <Capture prefill={capture.prefill} />}
    </Sheet>
  )
}

function Capture({ prefill }: { prefill: string }) {
  const { ctx, people, remember, closeCapture, openMemory } = useApp()
  const [mode, setMode] = useState<Mode>('write')
  const [phase, setPhase] = useState<Phase>({ s: 'input' })
  // Inputs live here so nothing the user entered is lost if understanding fails.
  const [text, setText] = useState(prefill)
  const [spoken, setSpoken] = useState('')
  const [photo, setPhoto] = useState<{ file: File; thumb: string } | null>(null)
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')

  async function understand(label: string, source: SourceType, read: () => Promise<{ text: string; fields?: Partial<Memory>; extra?: [string, string][] }>) {
    setPhase({ s: 'thinking', label })
    try {
      const [{ text, fields, extra = [] }] = await Promise.all([read(), delay(1500)])
      const memory = remember(text, await ai.extractMemory(text, ctx), source, fields)
      haptic()
      setPhase({ s: 'done', memory, extra })
    } catch {
      setPhase({ s: 'error' })
    }
  }

  const submit = {
    write: () => understand('Understanding this memory…', 'text', async () => ({ text })),
    speak: () => understand('Understanding this memory…', 'voice', async () => ({ text: spoken })),
    photo: () =>
      understand('Finding useful context…', 'image', async () => {
        const seen = await ai.describeImage(photo!.file, note)
        return { text: seen.text, fields: { image: photo!.thumb, simulated: seen.simulated }, extra: [['Text', seen.text]] }
      }),
    link: () =>
      understand('Analyzing link…', 'link', async () => {
        const info = await ai.analyzeLink(url)
        return { text: info.text, fields: { url: info.url }, extra: [['Title', info.title], ['Domain', info.domain]] }
      }),
  }[mode]
  const ready = { write: text.trim().length > 2, speak: spoken.trim().length > 2, photo: !!photo, link: url.trim().length > 3 }[mode]

  if (phase.s === 'thinking')
    return (
      <div className="py-10">
        <Thinking label={phase.label} />
        <div className="mt-6 space-y-3">
          {[80, 60, 70].map((w) => (
            <div key={w} className="skeleton h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )

  if (phase.s === 'error')
    return (
      <div className="py-8 text-center">
        <h3 className="text-xl font-bold tracking-tight">Recall couldn't understand that yet.</h3>
        <p className="mt-1.5 text-sub">Your original note is still safe.</p>
        <Press className="btn mt-6" onClick={() => setPhase({ s: 'input' })}>
          Try Again
        </Press>
      </div>
    )

  if (phase.s === 'done') {
    const { memory } = phase
    const who = people.filter((p) => memory.people.includes(p.id))
    const rows = [
      ...phase.extra,
      ['Person', list(who.map((p) => p.name))],
      ['Topic', memory.topics.join(' · ')],
      ['Intent', memory.intent],
      ['Place', memory.places.join(' · ')],
      ['Event', memory.events.join(' · ')],
      ['Sentiment', memory.sentiment.replace(' · ', ' / ')],
    ].filter(([, value]) => value)
    return (
      <div className="pt-2">
        <p className="rounded-2xl bg-fill p-4 leading-relaxed">{memory.rawText}</p>
        {memory.simulated && <p className="mt-2 text-xs text-sub">Demo reading. Connect a vision model for real image analysis, or add a note next time.</p>}
        <dl className="card mt-4 divide-y divide-line !py-1">
          {rows.map(([label, value], i) => (
            <motion.div key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.15 + i * 0.16 }} className="flex items-baseline gap-4 py-3">
              <dt className="eyebrow w-20 shrink-0">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </motion.div>
          ))}
        </dl>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.3 + rows.length * 0.16 }}>
          <div role="status" className="mt-5 flex items-center justify-center gap-2.5 font-semibold">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 0.4 + rows.length * 0.16 }} className="grid size-7 place-items-center rounded-full bg-accent text-white">
              <Icon name="check" size={16} />
            </motion.span>
            Saved to {who.length ? `${firstName(who[0])}'s` : 'your'} memory
          </div>
          <div className="mt-5 flex gap-3">
            <Press
              className="btn-quiet"
              onClick={() => {
                closeCapture()
                openMemory(memory.id)
              }}
            >
              View memory
            </Press>
            <Press className="btn" onClick={closeCapture}>
              Done
            </Press>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="pt-1">
      <Segmented id="capture-mode" options={MODES} value={mode} onChange={setMode} />
      <div className="mt-4 min-h-52">
        {mode === 'write' && (
          <textarea autoFocus aria-label="Memory" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell Recall something..." rows={6} className="field resize-none !text-lg leading-relaxed" />
        )}
        {mode === 'speak' && <Speak text={spoken} setText={setSpoken} />}
        {mode === 'photo' && <Photo photo={photo} setPhoto={setPhoto} note={note} setNote={setNote} onError={() => setPhase({ s: 'error' })} />}
        {mode === 'link' && (
          <>
            <input autoFocus type="url" inputMode="url" aria-label="Link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link" className="field" />
            <p className="mt-3 text-sm text-sub">Recall reads the title, domain and topic from the link and stores it as a memory.</p>
          </>
        )}
      </div>
      <Press className="btn mt-4" disabled={!ready} onClick={submit}>
        Remember this
      </Press>
    </div>
  )
}

function Speak({ text, setText }: { text: string; setText: (t: string) => void }) {
  const [listening, setListening] = useState(false)
  const [demo, setDemo] = useState(false)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])

  // Fallback when the browser has no speech recognition or the microphone is unavailable.
  function playDemo() {
    setDemo(true)
    setListening(true)
    let i = 0
    const timer = setInterval(() => {
      i += 2
      setText(DEMO_TRANSCRIPT.slice(0, i))
      if (i >= DEMO_TRANSCRIPT.length) stop.current()
    }, 45)
    stop.current = () => {
      clearInterval(timer)
      setListening(false)
    }
  }

  function start() {
    setText('')
    setDemo(false)
    /* eslint-disable @typescript-eslint/no-explicit-any -- the Web Speech API is not in TypeScript's DOM types */
    const Recognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!Recognition) return playDemo()
    let heard = false
    let fellBack = false
    try {
      const rec = new Recognition()
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e: any) => {
        heard = true
        setText(Array.from(e.results as ArrayLike<any>, (r) => r[0].transcript).join(''))
      }
      rec.onerror = (e: any) => {
        if (e.error === 'aborted' || heard) return
        fellBack = true
        playDemo()
      }
      rec.onend = () => !fellBack && setListening(false)
      rec.start()
      stop.current = () => rec.stop()
      setListening(true)
    } catch {
      playDemo()
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div aria-hidden="true" className={`flex h-14 items-center gap-1 ${listening ? 'wave-on' : ''}`}>
        {Array.from({ length: 27 }, (_, i) => (
          <span key={i} className="wave-bar" style={{ animationDelay: `${-((i * 37) % 90) / 100}s` }} />
        ))}
      </div>
      <Press
        aria-label={listening ? 'Stop recording' : 'Start recording'}
        aria-pressed={listening}
        onClick={() => (listening ? stop.current() : start())}
        className={`mt-3 grid size-16 place-items-center rounded-full text-white shadow-lg ${listening ? 'bg-red-500' : 'bg-accent'}`}
      >
        {listening ? <span className="size-5 rounded-md bg-white" /> : <Icon name="mic" size={26} />}
      </Press>
      <p className="mt-3 text-sm text-sub">{listening ? 'Listening…' : text ? 'Edit the transcript if needed' : 'Tap to speak'}</p>
      {(text || listening) && (
        <textarea aria-label="Transcript" aria-live="polite" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="field mt-3 resize-none leading-relaxed" />
      )}
      {demo && <p className="mt-2 text-xs text-sub">Microphone unavailable here, so this is a sample transcript.</p>}
    </div>
  )
}

/** Downscaled JPEG so a photo fits comfortably in local storage. */
async function thumbnail(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width * scale
  canvas.height = bitmap.height * scale
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

function Photo(props: { photo: { file: File; thumb: string } | null; setPhoto: (p: { file: File; thumb: string }) => void; note: string; setNote: (n: string) => void; onError: () => void }) {
  const pick = (file?: File) => file && thumbnail(file).then((thumb) => props.setPhoto({ file, thumb }), props.onError)
  return (
    <>
      <label className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-sub/40 text-sub focus-within:ring-2 focus-within:ring-accent">
        <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => pick(e.target.files?.[0])} />
        {props.photo ? (
          <img src={props.photo.thumb} alt="Selected" className="max-h-52 w-full object-cover" />
        ) : (
          <>
            <Icon name="image" size={28} />
            <span className="font-medium">Choose a photo or screenshot</span>
          </>
        )}
      </label>
      <input aria-label="Note about this image" value={props.note} onChange={(e) => props.setNote(e.target.value)} placeholder="Add a note (optional)" className="field mt-3" />
    </>
  )
}
