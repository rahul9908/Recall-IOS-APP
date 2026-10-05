import { useEffect, useState, type ReactNode } from 'react'
import { ai } from '../ai/provider'
import { useApp } from '../store'
import type { Memory } from '../types'
import { MemoryCard } from './cards'
import { Avatar, Icon, Press, Sheet, Thinking } from './ui'

const SOURCE = { text: 'Typed manually', voice: 'Spoken aloud', image: 'Photo', link: 'Link' }

export function MemorySheet() {
  const { memories, memoryId, closeMemory } = useApp()
  const memory = memories.find((m) => m.id === memoryId)
  return (
    <Sheet open={!!memory} onClose={closeMemory} title="Memory">
      {memory && <Detail key={memory.id} memory={memory} />}
    </Sheet>
  )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="py-3">
    <dt className="eyebrow mb-1.5">{label}</dt>
    <dd>{children}</dd>
  </div>
)
const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((x) => (
      <span key={x} className="chip">
        {x}
      </span>
    ))}
  </div>
)

function Detail({ memory }: { memory: Memory }) {
  const { ctx, people, remember, deleteMemory, togglePin, closeMemory, push } = useApp()
  const [related, setRelated] = useState<Memory[]>([])
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const who = people.filter((p) => memory.people.includes(p.id))

  useEffect(() => {
    let live = true
    ai.findRelatedMemories(memory, ctx).then((r) => live && setRelated(r), () => {})
    return () => void (live = false)
  }, [memory, ctx])

  async function save() {
    setSaving(true)
    setFailed(false)
    try {
      remember(draft!, await ai.extractMemory(draft!, ctx), memory.sourceType, {}, memory.id)
      setDraft(null)
    } catch {
      setFailed(true)
    }
    setSaving(false)
  }

  if (draft !== null)
    return (
      <div className="pt-1">
        <textarea autoFocus aria-label="Edit memory" value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="field resize-none leading-relaxed" />
        <div className="mt-3 min-h-6">
          {saving && <Thinking label="Understanding this memory…" />}
          {failed && <p className="text-sm text-sub">Recall couldn't understand that yet. Your original note is still safe.</p>}
        </div>
        <div className="mt-3 flex gap-3">
          <Press className="btn-quiet" onClick={() => setDraft(null)}>
            Cancel
          </Press>
          <Press className="btn" disabled={saving} onClick={save}>
            Save
          </Press>
        </div>
      </div>
    )

  return (
    <>
      {memory.image && <img src={memory.image} alt="Attached to this memory" className="mb-3 max-h-56 w-full rounded-2xl object-cover" />}
      <dl className="divide-y divide-line">
        <Field label="Original memory">
          <p className="text-lg leading-relaxed">{memory.rawText}</p>
        </Field>
        <Field label="AI interpretation">
          <p className="leading-relaxed">{memory.summary}</p>
          <div className="mt-2">
            <Chips items={[memory.category, memory.intent, memory.sentiment]} />
          </div>
        </Field>
        {who.length > 0 && (
          <Field label="People">
            <div className="flex flex-wrap gap-2">
              {who.map((p) => (
                <Press
                  key={p.id}
                  onClick={() => {
                    closeMemory()
                    push({ type: 'person', id: p.id })
                  }}
                  className="flex items-center gap-2 rounded-full bg-fill py-1 pr-3 pl-1 text-sm font-medium"
                >
                  <Avatar name={p.name} colors={p.colors} size={28} />
                  {p.name}
                </Press>
              ))}
              {memory.relationships.map((name) => (
                <span key={name} className="flex items-center gap-2 rounded-full bg-fill py-1 pr-3 pl-1 text-sm font-medium text-sub">
                  <Avatar name={name} size={28} />
                  {name}
                </span>
              ))}
            </div>
          </Field>
        )}
        {memory.places.length > 0 && (
          <Field label="Places">
            <Chips items={memory.places} />
          </Field>
        )}
        {memory.topics.length > 0 && (
          <Field label="Topics">
            <Chips items={[...memory.topics, ...memory.events]} />
          </Field>
        )}
        <Field label="Date">{new Date(memory.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</Field>
        <Field label="Confidence">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
              <div className="h-full rounded-full bg-accent" style={{ width: `${memory.confidence * 100}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums">{Math.round(memory.confidence * 100)}%</span>
          </div>
        </Field>
        <Field label="Source">
          Source: {SOURCE[memory.sourceType]}
          {memory.simulated && ' (demo reading)'}
          {memory.url && (
            <a href={memory.url} target="_blank" rel="noreferrer noopener" className="mt-1 block truncate text-accent">
              {memory.url}
            </a>
          )}
        </Field>
        {related.length > 0 && (
          <Field label="Related memories">
            <div className="space-y-2">
              {related.map((m) => (
                <MemoryCard key={m.id} memory={m} compact />
              ))}
            </div>
          </Field>
        )}
      </dl>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Press className="btn-quiet !px-2 text-sm" aria-pressed={!!memory.pinned} onClick={() => togglePin(memory.id)}>
          <Icon name="pin" size={18} className={memory.pinned ? 'text-accent' : ''} />
          {memory.pinned ? 'Pinned' : 'Pin'}
        </Press>
        <Press className="btn-quiet !px-2 text-sm" onClick={() => setDraft(memory.rawText)}>
          <Icon name="pen" size={18} />
          Edit
        </Press>
        <Press className="btn-quiet !px-2 text-sm !text-red-500" onClick={() => (confirming ? deleteMemory(memory.id) : setConfirming(true))}>
          <Icon name="trash" size={18} />
          {confirming ? 'Confirm' : 'Delete'}
        </Press>
      </div>
    </>
  )
}
