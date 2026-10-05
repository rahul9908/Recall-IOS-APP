import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { ai } from '../ai/provider'
import { Icon, Page, Press, Segmented, spring, type IconName } from '../components/ui'
import { haptic, plural } from '../lib/util'
import { useApp } from '../store'

const THEMES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const

const Group = ({ title, children, note }: { title: string; children: ReactNode; note?: string }) => (
  <section className="mt-6">
    <h2 className="eyebrow mb-2 px-1">{title}</h2>
    <div className="card divide-y divide-line !py-1">{children}</div>
    {note && <p className="mt-2 px-1 text-xs text-sub">{note}</p>}
  </section>
)

function Row({ icon, label, onClick, danger, children }: { icon: IconName; label: string; onClick?: () => void; danger?: boolean; children?: ReactNode }) {
  const body = (
    <>
      <Icon name={icon} size={20} className={danger ? 'text-red-500' : 'text-sub'} />
      <span className={`flex-1 text-left ${danger ? 'text-red-500' : ''}`}>{label}</span>
      {children}
    </>
  )
  return onClick ? (
    <button onClick={onClick} className="flex min-h-13 w-full items-center gap-3 py-2">
      {body}
    </button>
  ) : (
    <div className="flex min-h-13 items-center gap-3 py-2">{body}</div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        onChange(!on)
        haptic()
      }}
      className={`flex h-8 w-13 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? 'justify-end bg-accent' : 'justify-start bg-fill'}`}
    >
      <motion.span layout transition={spring} className="size-7 rounded-full bg-white shadow" />
    </button>
  )
}

export function SettingsPage() {
  const { settings, setSettings, people, memories, loadDemo, startFresh, pop, push } = useApp()
  const [confirm, setConfirm] = useState<'demo' | 'reset'>()

  const exportMemories = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), people, memories }, null, 2)], { type: 'application/json' }))
    link.download = 'recall-memories.json'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <Page title="Settings" onBack={pop}>
      <Group title="Profile">
        <Row icon="people" label="Name">
          <input aria-label="Your name" value={settings.name} onChange={(e) => setSettings({ name: e.target.value })} placeholder="Add your name" className="w-40 bg-transparent text-right outline-none placeholder:text-sub" />
        </Row>
      </Group>

      <Group title="Appearance">
        <div className="py-3">
          <Segmented id="theme" options={THEMES} value={settings.theme} onChange={(theme) => setSettings({ theme })} />
        </div>
      </Group>

      <Group title="Memory preferences" note="When on, Recall creates a profile for anyone new that a memory mentions.">
        <Row icon="graph" label="Connect people automatically">
          <Toggle label="Connect people automatically" on={settings.autoLink} onChange={(autoLink) => setSettings({ autoLink })} />
        </Row>
        <Row icon="ask" label="Haptic feedback">
          <Toggle label="Haptic feedback" on={settings.haptics} onChange={(haptics) => setSettings({ haptics })} />
        </Row>
      </Group>

      <Group title="Demo mode" note={settings.demo ? 'You are exploring sample memories. Anything you capture is added on top and stays on this device.' : 'You are using your own memories.'}>
        <Row icon="refresh" label={confirm === 'demo' ? 'Tap again to replace everything with the demo' : settings.demo ? 'Reset Demo' : 'Load demo memories'} onClick={() => (confirm === 'demo' ? (loadDemo(), setConfirm(undefined)) : setConfirm('demo'))} />
      </Group>

      <Group title="Your data" note={`${plural(memories.length, 'memory')} across ${people.length} people, stored in this browser.`}>
        <Row icon="download" label="Export memories" onClick={exportMemories} />
        <Row icon="trash" danger label={confirm === 'reset' ? 'Tap again to delete every memory' : 'Reset memories'} onClick={() => (confirm === 'reset' ? (startFresh(), setConfirm(undefined)) : setConfirm('reset'))} />
      </Group>

      <Group title="About">
        <Row icon="shield" label="Privacy" onClick={() => push({ type: 'privacy' })}>
          <Icon name="chevron" size={16} className="text-sub" />
        </Row>
        <Row icon="ask" label="About Recall">
          <span className="text-sm text-sub">v1.0 · {ai.name}</span>
        </Row>
      </Group>
      <p className="mt-6 text-center text-xs text-sub">Recall is a personal memory layer. Your life has context.</p>
    </Page>
  )
}

const PRIVACY: [IconName, string, string][] = [
  ['shield', 'Memories are private', 'In this demo, everything you capture is stored in this browser on this device. There is no account and nothing is uploaded.'],
  ['search', 'Sources are visible', 'Every answer shows the memories it was based on, so you can check where it came from.'],
  ['pen', 'You can edit anything', 'Open a memory to correct it. Recall re-reads the new text and updates what it understood.'],
  ['trash', 'You can delete anything', 'Remove a single memory, or reset everything from Settings. Deleted means gone from this device.'],
  ['ask', 'Answers are grounded', 'Recall answers only from stored memories. When it has nothing on a topic, it says so instead of guessing.'],
]

export function PrivacyPage() {
  const { pop } = useApp()
  return (
    <Page title="Privacy" onBack={pop}>
      <h2 className="mt-4 text-3xl font-bold tracking-tight">Your memory belongs to you.</h2>
      <p className="mt-2 text-sub">Recall holds personal context, so here is plainly how it is handled.</p>
      <ul className="mt-6 space-y-3">
        {PRIVACY.map(([icon, title, body], i) => (
          <motion.li key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="card flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-accent">
              <Icon name={icon} size={20} />
            </span>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-0.5 text-sm leading-relaxed text-sub">{body}</p>
            </div>
          </motion.li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-sub">
        Browser storage is not encrypted by Recall and can be cleared by your browser. If a hosted AI model is connected later, memory text would be sent to that service to be understood.
      </p>
      <Press className="btn mt-6" onClick={pop}>
        Got it
      </Press>
    </Page>
  )
}
