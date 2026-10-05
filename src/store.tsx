// App state: persisted memory data + in-session navigation. One context, consumed through useApp().
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ai } from './ai/provider'
import { seedDemo } from './data/demo'
import { delay, setHaptics, uid } from './lib/util'
import type { Answer, Extraction, Memory, MemoryContext, Person, SourceType } from './types'

export interface Settings {
  onboarded: boolean
  demo: boolean
  theme: 'system' | 'light' | 'dark'
  name: string
  haptics: boolean
  /** Create a profile automatically when a memory mentions someone new. */
  autoLink: boolean
}
interface Data extends MemoryContext {
  settings: Settings
}

export type Tab = 'home' | 'people' | 'ask' | 'timeline'
export type PageRef = { type: 'person'; id: string } | { type: 'graph'; focus?: string } | { type: 'settings' } | { type: 'privacy' }
export interface Turn {
  id: string
  q: string
  a?: Answer
  failed?: boolean
}

const KEY = 'recall.v1'
const DEFAULTS: Settings = { onboarded: false, demo: true, theme: 'system', name: '', haptics: true, autoLink: true }

function load(): Data {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (Array.isArray(saved?.people) && Array.isArray(saved?.memories)) return { ...saved, settings: { ...DEFAULTS, ...saved.settings } }
  } catch {
    // unreadable or blocked storage: fall through to a fresh demo
  }
  return { ...seedDemo(), settings: DEFAULTS }
}

function newPerson(name: string): Person {
  const hue = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7)
  return {
    id: uid(), name, universe: '', description: '', aliases: [name.split(' ')[0]], tags: [],
    colors: [`hsl(${hue} 72% 64%)`, `hsl(${(hue + 40) % 360} 62% 42%)`], relationships: [], createdAt: Date.now(),
  }
}

function useAppState() {
  const [data, setData] = useState(load)
  const [tab, setTab] = useState<Tab>('home')
  const [pages, setPages] = useState<PageRef[]>([])
  const [memoryId, setMemoryId] = useState<string | null>(null)
  const [capture, setCapture] = useState<{ prefill: string } | null>(null)
  const [thread, setThread] = useState<Turn[]>([])
  const { people, memories, settings } = data
  const ctx = useMemo(() => ({ people, memories }), [people, memories])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // storage full or unavailable: the session keeps working in memory
    }
  }, [data])

  useEffect(() => {
    setHaptics(settings.haptics)
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', settings.theme === 'dark' || (settings.theme === 'system' && media.matches))
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings.theme, settings.haptics])

  const setSettings = (patch: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  const patchMemory = (id: string, patch: (m: Memory) => Partial<Memory>) =>
    setData((d) => ({ ...d, memories: d.memories.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)) }))

  return {
    people, memories, settings, ctx, tab, pages, memoryId, capture, thread,
    setTab, setSettings,
    push: (page: PageRef) => setPages((p) => [...p, page]),
    pop: () => setPages((p) => p.slice(0, -1)),
    openMemory: setMemoryId,
    closeMemory: () => setMemoryId(null),
    openCapture: (prefill = '') => setCapture({ prefill }),
    closeCapture: () => setCapture(null),

    /** Saves an understood memory (or re-saves an edited one), creating profiles for anyone new. */
    remember(rawText: string, { newPeople, ...fields }: Extraction, sourceType: SourceType, extra: Partial<Memory> = {}, replaceId?: string): Memory {
      const created = settings.autoLink ? newPeople.map(newPerson) : []
      const previous = memories.find((m) => m.id === replaceId)
      const memory: Memory = {
        id: uid(), createdAt: Date.now(), sourceType, ...previous, ...fields, rawText,
        people: [...fields.people, ...created.map((p) => p.id)], ...extra,
      }
      setData((d) => ({
        ...d,
        people: [...d.people, ...created],
        memories: previous ? d.memories.map((m) => (m.id === previous.id ? memory : m)) : [memory, ...d.memories],
      }))
      return memory
    },
    deleteMemory: (id: string) => setData((d) => ({ ...d, memories: d.memories.filter((m) => m.id !== id) })),
    togglePin: (id: string) => patchMemory(id, (m) => ({ pinned: !m.pinned })),

    async ask(question: string) {
      const q = question.trim()
      if (!q) return
      const id = uid()
      setPages([])
      setMemoryId(null)
      setTab('ask')
      setThread((t) => [...t, { id, q }])
      const [a] = await Promise.all([ai.answerFromMemories(q, ctx).catch(() => undefined), delay(900)])
      setThread((t) => t.map((turn) => (turn.id === id ? { ...turn, a, failed: !a } : turn)))
    },

    loadDemo() {
      setThread([])
      setData((d) => ({ ...seedDemo(), settings: { ...d.settings, onboarded: true, demo: true } }))
    },
    startFresh() {
      setThread([])
      setData((d) => ({ people: [], memories: [], settings: { ...d.settings, onboarded: true, demo: false } }))
    },
  }
}

const AppContext = createContext<ReturnType<typeof useAppState> | null>(null)
export const AppProvider = ({ children }: { children: ReactNode }) => <AppContext.Provider value={useAppState()}>{children}</AppContext.Provider>
export const useApp = () => useContext(AppContext)!
