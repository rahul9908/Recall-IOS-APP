export const uid = () => Math.random().toString(36).slice(2, 10)
export const unique = <T,>(xs: T[]) => [...new Set(xs)]
export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word.replace(/y$/, 'ie') + 's'}`
export const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)

export function timeAgo(t: number, now = Date.now()) {
  const m = Math.round((now - t) / 60_000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const DAY_GROUPS = ['Today', 'Yesterday', 'Earlier this week', 'Older memories'] as const
export function dayGroup(t: number, now = Date.now()): (typeof DAY_GROUPS)[number] {
  const start = new Date(now).setHours(0, 0, 0, 0)
  if (t >= start) return 'Today'
  if (t >= start - 864e5) return 'Yesterday'
  if (t >= start - 6 * 864e5) return 'Earlier this week'
  return 'Older memories'
}

export function greeting() {
  const h = new Date().getHours()
  return h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : 'Good evening'
}

let hapticsOn = true
let hapticSwitch: HTMLLabelElement | undefined
export const setHaptics = (on: boolean) => (hapticsOn = on)

export function haptic() {
  if (!hapticsOn) return
  if (navigator.vibrate) return void navigator.vibrate(8)
  // iOS Safari has no Vibration API, but toggling a native switch control fires the system haptic (17.4+).
  if (!hapticSwitch) {
    hapticSwitch = document.createElement('label')
    hapticSwitch.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    hapticSwitch.append(input)
    document.body.append(hapticSwitch)
  }
  hapticSwitch.click()
}
