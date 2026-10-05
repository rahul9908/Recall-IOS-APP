import { firstName, sharedMemories, shortName, top } from '../engine/memory'
import { list, plural, timeAgo, unique } from '../lib/util'
import { useApp } from '../store'
import type { Memory, Person, Relationship } from '../types'
import { Avatar, Avatars, Icon, Press } from './ui'

const SOURCE_ICON = { text: 'pen', voice: 'mic', image: 'image', link: 'link' } as const

export function MemoryCard({ memory, compact }: { memory: Memory; compact?: boolean }) {
  const { people, openMemory } = useApp()
  const who = people.filter((p) => memory.people.includes(p.id))
  const entities = unique([...memory.relationships, ...memory.places, ...memory.topics]).slice(0, 3)
  return (
    <Press onClick={() => openMemory(memory.id)} className={`block w-full text-left ${compact ? 'rounded-2xl bg-fill p-3' : 'card'}`}>
      <div className="flex items-center gap-3">
        {who.length ? (
          <Avatars people={who} size={compact ? 32 : 40} />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-sub">
            <Icon name={SOURCE_ICON[memory.sourceType]} size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{who.length ? list(who.map(firstName)) : 'Note'}</p>
          <p className="text-xs text-sub">
            {memory.category} · {timeAgo(memory.createdAt)}
          </p>
        </div>
        {memory.pinned && <Icon name="pin" size={16} className="text-accent" />}
      </div>
      <p className={`mt-3 leading-relaxed ${compact ? 'text-sm' : ''}`}>{memory.summary}</p>
      {!compact && entities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entities.map((e) => (
            <span key={e} className="chip">
              {e}
            </span>
          ))}
        </div>
      )}
    </Press>
  )
}

/** "Jason + Lucia · 4 shared memories · frequent topics" */
export function RelationshipCard({ person, rel }: { person: Person; rel: Relationship }) {
  const { people, memories, push, ask } = useApp()
  const other = people.find((p) => p.id === rel.personId)
  const shared = sharedMemories(person, rel, memories)
  const topics = top(shared.flatMap((m) => m.topics), 3)
  const otherName = other ? firstName(other) : shortName(rel.name)
  return (
    <Press
      onClick={() => (other ? push({ type: 'person', id: other.id }) : ask(`What do I know about ${firstName(person)} and ${otherName}?`))}
      className="card block w-full text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex">
          <Avatar name={person.name} colors={person.colors} size={40} />
          <div className="-ml-3">
            <Avatar name={rel.name} colors={other?.colors} size={40} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {firstName(person)} + {otherName}
          </p>
          <p className="truncate text-xs text-sub">
            {rel.label} · {plural(shared.length, 'shared memory')}
          </p>
        </div>
        <Icon name="chevron" size={18} className="text-sub" />
      </div>
      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-sub">Frequent topics</span>
          {topics.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}
    </Press>
  )
}
