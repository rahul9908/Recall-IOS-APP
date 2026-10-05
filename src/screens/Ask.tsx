import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { MemoryCard } from '../components/cards'
import { Icon, Press, Thinking } from '../components/ui'
import { plural } from '../lib/util'
import { useApp, type Turn } from '../store'

export const SUGGESTIONS = [
  'What do I know about Jason and Lucia?',
  'Who is connected to Leonida?',
  "What does Recall know about Arthur's relationship with Dutch?",
  'Who is connected to Ciri?',
  'Which memories involve family?',
]

export function Ask() {
  const { thread, ask, settings } = useApp()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(q)
    setQ('')
  }

  return (
    <>
      <h1 className="pt-3 text-4xl font-bold tracking-tight">Ask Recall</h1>
      <p className="mt-1 text-sub">Answers come only from what you've remembered.</p>
      <form onSubmit={submit} className="relative mt-4">
        <input aria-label="Ask Recall" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything you've remembered" enterKeyHint="search" className="field !bg-card !py-4 !pr-14 shadow-sm" />
        <Press type="submit" aria-label="Ask" disabled={!q.trim()} className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink text-bg disabled:opacity-30">
          <Icon name="send" size={18} />
        </Press>
      </form>

      <div className="mt-5 space-y-4">
        {[...thread].reverse().map((turn) => (
          <AnswerCard key={turn.id} turn={turn} />
        ))}
      </div>

      {settings.demo && (
        <div className="mt-6">
          <p className="eyebrow mb-3">Try asking</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <Press key={s} onClick={() => ask(s)} className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left text-[0.95rem] shadow-sm">
                <Icon name="ask" size={16} className="shrink-0 text-accent" />
                {s}
              </Press>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function AnswerCard({ turn }: { turn: Turn }) {
  const { ask } = useApp()
  const [open, setOpen] = useState(false)
  const { a } = turn
  return (
    <motion.article layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
      <p className="text-sm text-sub">{turn.q}</p>
      {turn.failed ? (
        <div className="mt-3">
          <p className="font-semibold">Recall couldn't look that up just now.</p>
          <Press className="btn-quiet mt-3 !min-h-11 text-sm" onClick={() => ask(turn.q)}>
            Try Again
          </Press>
        </div>
      ) : !a ? (
        <div className="mt-3">
          <Thinking label="Looking through your memories…" />
          <div className="mt-4 space-y-2.5">
            {[95, 88, 60].map((w) => (
              <div key={w} className="skeleton h-3" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-live="polite">
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{a.title}</h2>
          <p className="mt-0.5 text-sm font-medium text-accent">{a.countLine}</p>
          <p className="mt-3 leading-relaxed whitespace-pre-line">{a.text}</p>
          {a.sources.length > 0 && (
            <>
              <button aria-expanded={open} onClick={() => setOpen(!open)} className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-line pt-3 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Icon name="shield" size={16} className="text-accent" />
                  Based on {plural(a.sources.length, 'memory')}
                </span>
                <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-sub">
                  <Icon name="chevron" size={16} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-2 pt-2">
                      {a.sources.map((m) => (
                        <MemoryCard key={m.id} memory={m} compact />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      )}
    </motion.article>
  )
}
