import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Logo, Press, spring } from '../components/ui'
import { haptic } from '../lib/util'
import { useApp } from '../store'

const FLOW = ['Capture', 'Understand', 'Remember', 'Recall']

export function Onboarding() {
  const { loadDemo, startFresh } = useApp()
  const [step, setStep] = useState(0)
  const go = (to: number) => {
    if (to < 0 || to > 2) return
    haptic()
    setStep(to)
  }

  return (
    <div className="absolute inset-0 flex flex-col px-7 pt-[var(--sat)] pb-[calc(var(--sab)+1.5rem)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex flex-1 cursor-grab flex-col items-center justify-center text-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={spring}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => Math.abs(info.offset.x) > 60 && go(step + (info.offset.x < 0 ? 1 : -1))}
        >
          {step === 0 && (
            <>
              <Logo size={96} />
              <h1 className="mt-8 text-4xl font-bold tracking-tight">Recall</h1>
              <p className="mt-3 text-xl text-sub">Remember more. Search less.</p>
            </>
          )}
          {step === 1 && (
            <>
              <ol className="flex w-full max-w-60 flex-col items-center">
                {FLOW.map((label, i) => (
                  <motion.li key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 + i * 0.14 }} className="flex w-full flex-col items-center">
                    {i > 0 && <span aria-hidden="true" className="h-5 w-px bg-sub/40" />}
                    <span className={`w-full rounded-2xl py-3.5 font-semibold shadow-sm ${i === 3 ? 'bg-ink text-bg' : 'bg-card'}`}>{label}</span>
                  </motion.li>
                ))}
              </ol>
              <p className="mt-9 text-2xl leading-snug font-semibold tracking-tight">Recall turns everyday information into connected memory.</p>
            </>
          )}
          {step === 2 && (
            <>
              <Logo size={72} />
              <h1 className="mt-7 text-3xl font-bold tracking-tight">Your life has context.</h1>
              <p className="mt-2 text-xl text-sub">Recall remembers it.</p>
              <p className="mt-6 text-sm text-sub">No account required.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mb-6 flex justify-center gap-2" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <button key={i} aria-label={`Go to step ${i + 1}`} onClick={() => go(i)} className="grid size-6 place-items-center">
            <span className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-ink' : 'w-2 bg-sub/40'}`} />
          </button>
        ))}
      </div>
      {step < 2 ? (
        <Press className="btn" onClick={() => go(step + 1)}>
          Continue
        </Press>
      ) : (
        <Press className="btn" onClick={loadDemo}>
          Explore Demo
        </Press>
      )}
      <button className="mt-2 min-h-12 font-medium text-sub" onClick={step < 2 ? loadDemo : startFresh}>
        {step < 2 ? 'Skip to the demo' : 'Start Fresh'}
      </button>
    </div>
  )
}
