import { useEffect, useMemo, useState } from 'react'
import { ai } from '../ai/provider'
import { MemoryCard, RelationshipCard } from '../components/cards'
import { GraphView } from '../components/GraphView'
import { Avatar, Empty, Icon, Page, Press, Section } from '../components/ui'
import { buildGraph, firstName, personMemories, personTags, top } from '../engine/memory'
import { delay, plural } from '../lib/util'
import { useApp } from '../store'

export function PersonPage({ id }: { id: string }) {
  const { people, memories, ctx, pop, push, ask, openCapture, openMemory } = useApp()
  const person = people.find((p) => p.id === id)
  const mems = useMemo(() => personMemories(id, memories), [id, memories])
  const graph = useMemo(() => buildGraph(ctx, id, 340), [ctx, id])
  const [summary, setSummary] = useState<string>()

  useEffect(() => {
    if (!person) return
    let live = true
    setSummary(undefined)
    Promise.all([ai.summarizePerson(person, ctx), delay(600)]).then(([s]) => live && setSummary(s), () => live && setSummary(person.description))
    return () => void (live = false)
  }, [person, ctx])

  if (!person)
    return (
      <Page title="Profile" onBack={pop}>
        <Empty title="This profile is gone" body="It may have been reset along with the demo." />
      </Page>
    )

  const name = firstName(person)
  const topics = top(mems.flatMap((m) => m.topics), 8)
  const places = top(mems.flatMap((m) => m.places), 8)
  const key = [...mems].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.importance - a.importance).slice(0, 3)

  return (
    <Page title={person.name} onBack={pop}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-35" style={{ background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${person.colors[0]}, ${person.colors[1]} 45%, transparent 100%)`, maskImage: 'linear-gradient(#000, transparent)' }} />
      <div className="relative flex flex-col items-center pt-2 text-center">
        <Avatar name={person.name} colors={person.colors} size={108} />
        <h2 className="mt-4 text-3xl font-bold tracking-tight">{person.name}</h2>
        <p className="text-sub">{person.universe || 'Added by you'}</p>
        <p className="mt-2 text-sm text-sub">
          {plural(mems.length, 'memory')} · {plural(person.relationships.length, 'connection')} · {plural(places.length, 'place')}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {personTags(person, memories).map((t) => (
            <span key={t} className="chip !bg-card">
              {t}
            </span>
          ))}
        </div>
      </div>

      <section className="card relative mt-6">
        <p className="eyebrow flex items-center gap-1.5 !text-accent">
          <Icon name="ask" size={14} /> What Recall knows
        </p>
        {summary ? (
          <p className="mt-2 leading-relaxed">{summary}</p>
        ) : (
          <div role="status" aria-label="Connecting the dots…" className="mt-3 space-y-2.5">
            {[100, 92, 96, 60].map((w) => (
              <div key={w} className="skeleton h-3" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Press className="btn-quiet !min-h-11 text-sm" onClick={() => ask(`What do I know about ${name}?`)}>
            Ask about {name}
          </Press>
          <Press className="btn !min-h-11 text-sm" onClick={() => openCapture(`${name} `)}>
            <Icon name="plus" size={16} /> Add memory
          </Press>
        </div>
      </section>

      {mems.length > 0 && (
        <Section title="Memories">
          <div className="space-y-3">
            {key.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        </Section>
      )}

      {mems.length > 0 && (
        <Section title="Timeline">
          <ol className="card relative space-y-4">
            {[...mems].reverse().map((m) => (
              <li key={m.id}>
                <button className="flex w-full gap-3 text-left" onClick={() => openMemory(m.id)}>
                  <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-fill" style={{ background: person.colors[0] }} />
                  <span>
                    <span className="block text-xs font-medium text-sub">
                      {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {m.category}
                    </span>
                    <span className="line-clamp-2 text-sm leading-relaxed">{m.summary}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {graph.nodes.length > 1 && (
        <Section
          title="Connections"
          action={
            <button className="min-h-11 text-sm font-semibold text-accent" onClick={() => push({ type: 'graph', focus: id })}>
              Full graph
            </button>
          }
        >
          <div className="card flex justify-center overflow-hidden !p-0">
            <GraphView graph={graph} onNode={(n) => (n.personId && n.personId !== id ? push({ type: 'person', id: n.personId }) : n.type !== 'person' && ask(`What do I know about ${name} and ${n.label}?`))} />
          </div>
          <div className="mt-3 space-y-3">
            {person.relationships.map((rel) => (
              <RelationshipCard key={rel.name} person={person} rel={rel} />
            ))}
          </div>
        </Section>
      )}

      {topics.length > 0 && (
        <Section title="Topics">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Press key={t} className="chip !bg-card !px-3.5 !py-2 !text-sm !text-ink shadow-sm" onClick={() => ask(`What do I know about ${name} and ${t}?`)}>
                {t}
              </Press>
            ))}
          </div>
        </Section>
      )}

      {places.length > 0 && (
        <Section title="Places">
          <div className="flex flex-wrap gap-2">
            {places.map((p) => (
              <Press key={p} className="chip !bg-card !px-3.5 !py-2 !text-sm !text-ink shadow-sm" onClick={() => ask(`Who is connected to ${p}?`)}>
                <Icon name="place" size={14} className="text-sub" /> {p}
              </Press>
            ))}
          </div>
        </Section>
      )}
    </Page>
  )
}
