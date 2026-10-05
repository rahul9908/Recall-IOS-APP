import { motion } from 'framer-motion'
import { MemoryCard, RelationshipCard } from '../components/cards'
import { Avatar, Empty, Icon, Press, Section } from '../components/ui'
import { firstName, sharedMemories } from '../engine/memory'
import { greeting, plural } from '../lib/util'
import { useApp } from '../store'

export function Home() {
  const { people, memories, settings, push, openCapture, loadDemo } = useApp()
  const recent = [...memories.filter((m) => m.pinned), ...memories.filter((m) => !m.pinned)].slice(0, 6)
  const bond = people
    .flatMap((person) => person.relationships.map((rel) => ({ person, rel, shared: sharedMemories(person, rel, memories).length })))
    .sort((a, b) => b.shared - a.shared)[0]

  return (
    <>
      <header className="flex items-start justify-between pt-3">
        <div>
          <p className="eyebrow">
            {greeting()}
            {settings.name && `, ${settings.name}`}
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">Recall</h1>
          <p className="mt-1 text-sub">Your life has context. Recall remembers it.</p>
        </div>
        <Press aria-label="Settings" onClick={() => push({ type: 'settings' })} className="grid size-11 place-items-center rounded-full bg-card text-sub shadow-sm">
          <Icon name="settings" size={20} />
        </Press>
      </header>

      {memories.length === 0 ? (
        <Empty title="Nothing remembered yet" body="Every memory starts with something worth keeping.">
          <Press className="btn" onClick={() => openCapture()}>
            Capture your first memory
          </Press>
          <button className="min-h-11 text-sm font-medium text-sub underline-offset-4 hover:underline" onClick={loadDemo}>
            Try Demo
          </button>
        </Empty>
      ) : (
        <>
          <Press onClick={() => push({ type: 'graph' })} className="relative mt-6 block w-full overflow-hidden rounded-3xl bg-ink p-5 text-left text-bg shadow-xl">
            <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute -top-2 -right-2 size-36 opacity-30" fill="currentColor" stroke="currentColor">
              <path d="M30 40 70 25 95 60 60 90 30 40M70 25 60 90" fill="none" strokeWidth="1" strokeDasharray="2 4" />
              {[[30, 40, 5], [70, 25, 7], [95, 60, 4], [60, 90, 6]].map(([cx, cy, r]) => (
                <circle key={cx} cx={cx} cy={cy} r={r} stroke="none" />
              ))}
            </svg>
            <p className="eyebrow !text-bg/60">What Recall holds</p>
            <p className="relative mt-2 max-w-[16rem] text-2xl leading-snug font-semibold tracking-tight">
              You have {plural(memories.length, 'memory')} connected across {plural(people.length, 'person').replace('persons', 'people')}.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-bg/70">
              <Icon name="graph" size={16} /> Open memory graph <Icon name="chevron" size={14} />
            </p>
          </Press>

          <div className="no-scrollbar -mx-5 mt-6 flex gap-4 overflow-x-auto px-5 pb-1">
            {people.map((p) => (
              <Press key={p.id} onClick={() => push({ type: 'person', id: p.id })} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                <Avatar name={p.name} colors={p.colors} size={60} />
                <span className="w-full truncate text-center text-xs font-medium">{firstName(p)}</span>
              </Press>
            ))}
          </div>

          <Section title="Recently remembered">
            <div className="space-y-3">
              {recent.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <MemoryCard memory={m} />
                </motion.div>
              ))}
            </div>
          </Section>

          {bond && bond.shared > 0 && (
            <Section title="Strongest connection">
              <RelationshipCard person={bond.person} rel={bond.rel} />
            </Section>
          )}
        </>
      )}
    </>
  )
}
