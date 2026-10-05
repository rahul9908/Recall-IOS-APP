import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CaptureSheet } from './components/Capture'
import { MemorySheet } from './components/MemorySheet'
import { Icon, Logo, Press, spring, type IconName } from './components/ui'
import { haptic, plural } from './lib/util'
import { Ask, SUGGESTIONS } from './screens/Ask'
import { GraphPage } from './screens/GraphPage'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { People } from './screens/People'
import { PersonPage } from './screens/PersonPage'
import { PrivacyPage, SettingsPage } from './screens/Settings'
import { Timeline } from './screens/Timeline'
import { AppProvider, useApp, type PageRef, type Tab } from './store'

const TABS: [Tab, string, IconName][] = [['home', 'Home', 'home'], ['people', 'People', 'people'], ['ask', 'Ask', 'ask'], ['timeline', 'Timeline', 'timeline']]
const SCREENS = { home: Home, people: People, ask: Ask, timeline: Timeline }

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <Shell />
      </AppProvider>
    </MotionConfig>
  )
}

/** Phone-sized app surface. Full-screen on mobile; framed with contextual panels on desktop. */
function Shell() {
  const { settings, tab, pages } = useApp()
  const [splash, setSplash] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1000)
    return () => clearTimeout(timer)
  }, [])
  const Screen = SCREENS[tab]

  return (
    <div className="flex h-full items-center justify-center gap-14 sm:bg-[radial-gradient(circle_at_50%_0%,var(--color-fill),transparent_70%)]">
      <DesktopIntro />
      <div className="relative h-full w-full shrink-0 overflow-hidden bg-bg sm:h-[min(844px,calc(100dvh-3rem))] sm:w-[390px] sm:rounded-[3rem] sm:shadow-2xl sm:ring-[10px] sm:ring-ink/90">
        {settings.onboarded ? (
          <>
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="no-scrollbar absolute inset-0 overflow-y-auto px-5 pt-[var(--sat)] pb-[calc(var(--sab)+7rem)]"
              >
                <Screen />
              </motion.main>
            </AnimatePresence>
            <TabBar />
            <AnimatePresence>
              {pages.map((page, i) => (
                <PageView key={`${i}-${page.type}`} page={page} />
              ))}
            </AnimatePresence>
            <MemorySheet />
            <CaptureSheet />
          </>
        ) : (
          <Onboarding />
        )}
        <AnimatePresence>
          {splash && (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 z-50 grid place-items-center bg-bg">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
                <Logo size={88} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <DesktopContext />
    </div>
  )
}

function PageView({ page }: { page: PageRef }) {
  if (page.type === 'person') return <PersonPage id={page.id} />
  if (page.type === 'graph') return <GraphPage focus={page.focus} />
  return page.type === 'settings' ? <SettingsPage /> : <PrivacyPage />
}

function TabBar() {
  const { tab, setTab, openCapture } = useApp()
  const button = ([id, label, icon]: (typeof TABS)[number]) => (
    <button
      key={id}
      aria-current={tab === id ? 'page' : undefined}
      onClick={() => {
        haptic()
        setTab(id)
      }}
      className={`flex h-full flex-col items-center justify-center gap-1 text-[0.68rem] font-medium transition-colors ${tab === id ? 'text-ink' : 'text-sub'}`}
    >
      <motion.span animate={{ scale: tab === id ? 1.08 : 1 }} transition={spring}>
        <Icon name={icon} />
      </motion.span>
      {label}
    </button>
  )
  return (
    <nav aria-label="Primary" className="absolute inset-x-0 bottom-0 z-10 border-t border-line bg-card/80 pb-[var(--sab)] backdrop-blur-xl">
      <div className="grid h-16 grid-cols-5 items-center">
        {TABS.slice(0, 2).map(button)}
        <Press aria-label="Capture a memory" onClick={() => openCapture()} className="mx-auto -mt-7 grid size-14 place-items-center rounded-full bg-ink text-bg shadow-xl ring-4 ring-bg">
          <Icon name="plus" size={26} />
        </Press>
        {TABS.slice(2).map(button)}
      </div>
    </nav>
  )
}

const TOUR = ['Open Jason and see what Recall understands', 'Capture a new memory and watch it extract context', 'Ask about Jason and Lucia, then inspect the sources', 'Open the memory graph to see how it all connects']

function DesktopIntro() {
  return (
    <aside className="hidden w-72 flex-col lg:flex">
      <Logo size={56} />
      <h1 className="mt-6 text-4xl font-bold tracking-tight">Recall</h1>
      <p className="mt-2 text-lg text-sub">Your life has context. Recall remembers it.</p>
      <ol className="mt-8 space-y-4">
        {TOUR.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fill text-xs font-semibold">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-sub">Built for iPhone. Add it to your Home Screen to run it as an app.</p>
    </aside>
  )
}

function DesktopContext() {
  const { people, memories, settings, ask } = useApp()
  const connections = people.reduce((n, p) => n + p.relationships.length, 0)
  return (
    <aside className="hidden w-72 flex-col lg:flex">
      <p className="eyebrow">Live memory</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {[[memories.length, 'memories'], [people.length, 'people'], [connections, 'links']].map(([value, label]) => (
          <div key={label} className="card !p-3 text-center">
            <dd className="text-2xl font-bold tabular-nums">{value}</dd>
            <dt className="text-xs text-sub">{label}</dt>
          </div>
        ))}
      </dl>
      {settings.onboarded && settings.demo && (
        <>
          <p className="eyebrow mt-8">Ask from here</p>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.slice(0, 4).map((q) => (
              <Press key={q} onClick={() => ask(q)} className="card block w-full !rounded-2xl !p-3 text-left text-sm">
                {q}
              </Press>
            ))}
          </div>
        </>
      )}
      <p className="mt-8 text-xs leading-relaxed text-sub">
        No account, no API key. {plural(memories.length, 'memory')} live in this browser, and every answer is assembled only from them.
      </p>
    </aside>
  )
}
