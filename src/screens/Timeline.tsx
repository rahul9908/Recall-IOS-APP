import { useState } from 'react'
import { Avatars, Empty, Icon, Press } from '../components/ui'
import { firstName } from '../engine/memory'
import { DAY_GROUPS, dayGroup, haptic, list, timeAgo } from '../lib/util'
import { useApp } from '../store'
import type { Memory } from '../types'

const FILTERS: Record<string, (m: Memory) => boolean> = {
  All: () => true,
  People: (m) => m.people.length > 1 || m.relationships.length > 0,
  Places: (m) => m.places.length > 0,
  Events: (m) => m.events.length > 0 || m.intent === 'Event',
  Ideas: (m) => ['Idea', 'Future plan', 'Reminder'].includes(m.intent),
}

export function Timeline() {
  const { memories, people, openMemory, openCapture } = useApp()
  const [filter, setFilter] = useState('All')
  const shown = memories.filter(FILTERS[filter])

  return (
    <>
      <h1 className="pt-3 text-4xl font-bold tracking-tight">Timeline</h1>
      <div role="tablist" aria-label="Filter" className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {Object.keys(FILTERS).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => {
              haptic()
              setFilter(f)
            }}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${filter === f ? 'bg-ink text-bg' : 'bg-card text-sub shadow-sm'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {memories.length === 0 ? (
        <Empty title="Nothing remembered yet" body="Every memory starts with something worth keeping.">
          <Press className="btn" onClick={() => openCapture()}>
            Capture your first memory
          </Press>
        </Empty>
      ) : shown.length === 0 ? (
        <Empty title={`No ${filter.toLowerCase()} yet`} body="Memories land here as Recall recognises them." />
      ) : (
        DAY_GROUPS.map((group) => {
          const items = shown.filter((m) => dayGroup(m.createdAt) === group)
          if (!items.length) return null
          return (
            <section key={group} className="mt-7">
              <h2 className="eyebrow mb-3">{group}</h2>
              <ol className="card divide-y divide-line !py-1">
                {items.map((m) => {
                  const who = people.filter((p) => m.people.includes(p.id))
                  return (
                    <li key={m.id}>
                      <button onClick={() => openMemory(m.id)} className="flex w-full gap-3 py-3.5 text-left">
                        {who.length ? (
                          <Avatars people={who} size={36} />
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fill text-sub">
                            <Icon name="pen" size={16} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold">{who.length ? list(who.map(firstName)) : 'Note'}</span>
                            <span className="shrink-0 text-xs text-sub">{timeAgo(m.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-[0.95rem] leading-snug">{m.summary}</span>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {[...m.places, ...m.topics].slice(0, 3).map((t) => (
                              <span key={t} className="chip">
                                {t}
                              </span>
                            ))}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })
      )}
    </>
  )
}
