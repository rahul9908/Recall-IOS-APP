import { useMemo, useState } from 'react'
import { MemoryCard } from '../components/cards'
import { Avatar, Empty, Icon, Press, Section } from '../components/ui'
import { personMemories, personTags, search } from '../engine/memory'
import { plural, timeAgo } from '../lib/util'
import { useApp } from '../store'
import type { Person } from '../types'

export function People() {
  const { people, memories, ctx, push, openCapture } = useApp()
  const [query, setQuery] = useState('')
  const [grid, setGrid] = useState(true)

  const { shown, hits } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { shown: people, hits: [] }
    const hits = search(q, ctx).map((r) => r.memory)
    const rank = (p: Person) => {
      const direct = [p.name, p.universe, ...p.tags, ...p.relationships.flatMap((r) => [r.name, r.label])].some((s) => s.toLowerCase().includes(q))
      const i = hits.findIndex((m) => m.people.includes(p.id))
      return direct ? -1 : i < 0 ? Infinity : i
    }
    return { shown: people.filter((p) => rank(p) < Infinity).sort((a, b) => rank(a) - rank(b)), hits }
  }, [query, people, ctx])

  const card = (p: Person) => {
    const mems = personMemories(p.id, memories)
    const tags = personTags(p, memories).slice(0, 2)
    const meta = `${plural(mems.length, 'memory')}${mems[0] ? ` · ${timeAgo(mems[0].createdAt)}` : ''}`
    return (
      <Press key={p.id} onClick={() => push({ type: 'person', id: p.id })} className={`card w-full text-left ${grid ? 'block' : 'flex items-center gap-3'}`}>
        <Avatar name={p.name} colors={p.colors} size={grid ? 64 : 52} />
        <div className={`min-w-0 flex-1 ${grid ? 'mt-3' : ''}`}>
          <p className="truncate font-semibold">{p.name}</p>
          <p className="truncate text-xs text-sub">{p.universe || 'Added by you'}</p>
          <p className="mt-1 truncate text-xs text-sub">{meta}</p>
          <div className="mt-2 flex gap-1.5 overflow-hidden">
            {tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Press>
    )
  }

  return (
    <>
      <header className="flex items-end justify-between pt-3">
        <h1 className="text-4xl font-bold tracking-tight">People</h1>
        <Press aria-label={grid ? 'Show as list' : 'Show as grid'} onClick={() => setGrid(!grid)} className="grid size-11 place-items-center rounded-full bg-card text-sub shadow-sm">
          <Icon name={grid ? 'list' : 'grid'} size={20} />
        </Press>
      </header>
      <label className="relative mt-4 block">
        <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sub" />
        <input type="search" aria-label="Search people or memories" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or memories" className="field !bg-card !pl-11 shadow-sm" />
      </label>

      {people.length === 0 ? (
        <Empty title="No one here yet" body="People appear automatically when your memories mention them.">
          <Press className="btn" onClick={() => openCapture()}>
            Capture a memory
          </Press>
        </Empty>
      ) : shown.length === 0 && hits.length === 0 ? (
        <Empty title="Nothing matches that" body="Try a name, a place, or a theme like family." />
      ) : (
        <>
          <div className={`mt-5 ${grid ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>{shown.map(card)}</div>
          {hits.length > 0 && (
            <Section title="Memories">
              <div className="space-y-3">
                {hits.slice(0, 8).map((m) => (
                  <MemoryCard key={m.id} memory={m} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </>
  )
}
