// Shared primitives: icons, avatars, pressable surfaces, bottom sheet, pushed page, loading and empty states.
import { AnimatePresence, motion, useDragControls, type HTMLMotionProps } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { haptic } from '../lib/util'

export const spring = { type: 'spring', stiffness: 380, damping: 34 } as const

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  people: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 20v-1a4 4 0 0 0-3-3.85M15.5 3.15a4 4 0 0 1 0 7.7',
  ask: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  timeline: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-3.5-3.5',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3M5 11v1a7 7 0 0 0 14 0v-1M12 19v3',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  graph: 'M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4M10 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M7.9 6.4l8.1 1.2M6.7 7.9l2.6 8.2M11.2 16.4l5.6-6.8',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M4 6h16M4 12h16M4 18h16',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  shield: 'M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6z',
  send: 'M12 19V5M6 11l6-6 6 6',
  place: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  refresh: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
} as const
export type IconName = keyof typeof ICONS

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={ICONS[name]} />
    </svg>
  )
}

export function Logo({ size = 64 }: { size?: number }) {
  return <img src="/icon.svg" alt="" width={size} height={size} style={{ borderRadius: size * 0.24 }} className="shadow-lg ring-1 ring-white/10" />
}

/** Generated profile artwork: a lit gradient with initials. Neutral when the person has no profile of their own. */
export function Avatar({ name, colors, size = 44 }: { name: string; colors?: [string, string]; size?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const [a, b] = colors ?? ['#a9a9b3', '#6d6d78']
  return (
    <div
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-card"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.4), transparent 55%), linear-gradient(140deg, ${a}, ${b})` }}
    >
      {initials}
    </div>
  )
}

export function Avatars({ people, size = 40 }: { people: { id: string; name: string; colors: [string, string] }[]; size?: number }) {
  return (
    <div className="flex shrink-0">
      {people.slice(0, 3).map((p, i) => (
        <div key={p.id} style={{ marginLeft: i ? -size * 0.3 : 0 }}>
          <Avatar name={p.name} colors={p.colors} size={size} />
        </div>
      ))}
    </div>
  )
}

/** A button with the iOS press-down feel and a light haptic. */
export function Press({ onClick, children, ...rest }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={spring}
      onClick={(e) => {
        haptic()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export function Segmented<T extends string>({ id, options, value, onChange }: { id: string; options: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex rounded-2xl bg-fill p-1">
      {options.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          onClick={() => {
            haptic()
            onChange(key)
          }}
          className="relative min-h-10 flex-1 rounded-xl text-sm font-semibold"
        >
          {value === key && <motion.span layoutId={id} transition={spring} className="absolute inset-0 rounded-xl bg-card shadow-sm" />}
          <span className={`relative ${value === key ? 'text-ink' : 'text-sub'}`}>{label}</span>
        </button>
      ))}
    </div>
  )
}

/** Bottom sheet. Drag the header down (or press Escape / tap the backdrop) to dismiss. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const controls = useDragControls()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-[1.75rem] bg-bg shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && onClose()}
          >
            <div onPointerDown={(e) => controls.start(e)} className="shrink-0 cursor-grab touch-none px-5 pt-2.5 pb-2">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-sub/40" />
              <div className="mt-2 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                <Press aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-fill text-sub">
                  <Icon name="close" size={18} />
                </Press>
              </div>
            </div>
            <div className="no-scrollbar overflow-y-auto overscroll-contain px-5 pb-[calc(var(--sab)+1.5rem)]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Full-screen page pushed in from the right, iOS navigation style. */
export function Page({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <motion.section className="absolute inset-0 z-20 flex flex-col bg-bg" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={spring}>
      <header className="flex shrink-0 items-center gap-2 px-3 pt-[var(--sat)] pb-2">
        <Press aria-label="Back" onClick={onBack} className="grid size-11 place-items-center rounded-full text-accent">
          <Icon name="back" />
        </Press>
        <h1 className="flex-1 truncate text-center font-semibold">{title}</h1>
        <div className="size-11" />
      </header>
      <div className="no-scrollbar relative flex-1 overflow-y-auto px-5 pb-[calc(var(--sab)+2rem)]">{children}</div>
    </motion.section>
  )
}

export function Thinking({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3">
      <span className="pulse-dot" />
      <span className="shimmer-text font-medium">{label}</span>
    </div>
  )
}

export function Empty({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-fill text-sub">
        <Icon name="ask" size={28} />
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sub">{body}</p>
      {children && <div className="mt-6 flex w-full max-w-64 flex-col items-center gap-3">{children}</div>}
    </motion.div>
  )
}

export const Section = ({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) => (
  <section className="mt-8">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)
