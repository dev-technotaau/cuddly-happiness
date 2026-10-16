import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useStore } from '../store'
import { getLenis } from './SmoothScroll'

type Tone = 'light' | 'dark'
type Mode = 'top' | 'return'

const RING_R = 17
const RING_C = 2 * Math.PI * RING_R
const RETURN_MS = 8000
const GAP = 12
const MAGNET = 5

/** Long hops accelerate gently and settle softly. */
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2)

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Current scroll position and scrollable range, read from Lenis when it is running. */
function readScroll() {
  const lenis = getLenis()
  if (lenis) return { y: lenis.scroll, limit: lenis.limit }
  return { y: window.scrollY, limit: Math.max(0, document.documentElement.scrollHeight - window.innerHeight) }
}

/** The heading nearest above a scroll position, used to name the return trip. */
function headingNear(y: number): string | null {
  const probe = y + window.innerHeight * 0.4
  let found: string | null = null
  for (const h of document.querySelectorAll<HTMLElement>('main h1, main h2')) {
    const top = h.getBoundingClientRect().top + window.scrollY
    if (top > probe) break
    found = probe - top < window.innerHeight * 1.5 ? h.textContent?.replace(/\s+/g, ' ').trim() || null : null
  }
  return found && found.length > 32 ? `${found.slice(0, 31).trimEnd()}…` : found
}

let paint: CanvasRenderingContext2D | null = null
const toneCache = new Map<string, Tone | null>()

/** Light or dark for any computed colour string (rgb, color-mix, oklab…); null when mostly transparent. */
function toneOf(color: string): Tone | null {
  const cached = toneCache.get(color)
  if (cached !== undefined) return cached
  if (!paint) paint = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  let tone: Tone | null = null
  if (paint) {
    paint.clearRect(0, 0, 1, 1)
    paint.fillStyle = 'rgba(0, 0, 0, 0)'
    paint.fillStyle = color
    paint.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data
    if (a > 127) tone = 0.2126 * r + 0.7152 * g + 0.0722 * b < 140 ? 'dark' : 'light'
  }
  toneCache.set(color, tone)
  return tone
}

/** Tone of the first painted surface under a point, ignoring the button itself (the grain is pointer-events: none). */
function toneBehind(x: number, y: number, self: Element): Tone {
  for (const el of document.elementsFromPoint(x, y)) {
    if (self.contains(el)) continue
    const tone = toneOf(getComputedStyle(el).backgroundColor)
    if (tone) return tone
  }
  return 'light'
}

/**
 * Floating back-to-top. It shows only on long pages once the reader is well in, stays a compact progress bezel while
 * they read, opens when they scroll back up, rides above anything marked data-fab-avoid, adapts to dark sections,
 * and after the trip up offers a timed return to where they were.
 */
export default function BackToTop() {
  const { cartOpen, route } = useStore()
  const dock = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const core = useRef<HTMLSpanElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [tone, setTone] = useState<Tone>('light')
  const [mode, setMode] = useState<Mode>('top')
  const [heading, setHeading] = useState<string | null>(null)
  // Values the animation loop reads every frame, kept out of React state.
  const live = useRef({ cartOpen: false, hover: false, focus: false, mode: 'top' as Mode, travelling: false, travelUp: false, travelUntil: 0, returnTo: 0, returnAt: 0, openUntil: 0, mx: 0, my: 0 })

  const switchMode = (m: Mode) => {
    live.current.mode = m
    setMode(m)
  }

  useEffect(() => {
    live.current.cartOpen = cartOpen
  }, [cartOpen])

  // Every page starts fresh.
  useEffect(() => {
    live.current.mode = 'top'
    live.current.openUntil = 0
    setMode('top')
    setHeading(null)
  }, [route])

  useEffect(() => {
    const L = live.current
    // Mirrors of the React state, so the loop only calls a setter when something actually changes.
    let isVisible = false
    let isExpanded = false
    let isTone: Tone = 'light'
    const show = (v: boolean) => {
      if (v === isVisible) return
      isVisible = v
      setVisible(v)
    }
    const open = (v: boolean) => {
      if (v === isExpanded) return
      isExpanded = v
      setExpanded(v)
    }
    const shade = (t: Tone) => {
      if (t === isTone) return
      isTone = t
      setTone(t)
    }

    // Fixed UI near the bottom edge (sticky bars, the footer's last row) opts in with data-fab-avoid.
    const near = new Set<Element>()
    const watched = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) near.add(e.target)
        else near.delete(e.target)
      }
    })
    const scan = () => {
      for (const el of document.querySelectorAll('[data-fab-avoid]')) {
        if (watched.has(el)) continue
        watched.add(el)
        io.observe(el)
      }
      for (const el of watched) {
        if (el.isConnected) continue
        io.unobserve(el)
        watched.delete(el)
        near.delete(el)
      }
    }

    let raf = 0
    let frame = 0
    let last = performance.now()
    let lastY = readScroll().y
    let wanted = false
    let vel = 0
    let progress = 0
    let lift = 0
    let magX = 0
    let magY = 0
    let wroteOffset = -1
    let wroteLift = -1
    let wroteMag = ''

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - last)
      last = now
      // Frame-rate independent easing toward a target.
      const follow = (k: number) => 1 - Math.pow(1 - k, dt / 16.667)
      if (frame++ % 30 === 0) scan()

      // Read everything first, then write, so the loop never forces extra layouts.
      const lenis = getLenis()
      const { y, limit } = readScroll()
      const vh = window.innerHeight
      const locked = L.cartOpen || !!lenis?.isStopped || document.documentElement.style.overflow === 'hidden' || document.body.style.overflow === 'hidden'
      if (L.travelling && now > L.travelUntil) L.travelling = false

      // Scrolling up reads as intent to go back: open for a moment. Scrolling down means reading: stay compact.
      vel += (y - lastY - vel) * follow(0.3)
      lastY = y
      if (!L.travelling) {
        if (vel < -1.2) L.openUntil = now + 1600
        else if (vel > 1.2) L.openUntil = 0
      }

      // The return offer lapses after a while, or as soon as the reader moves on by hand.
      if (L.mode === 'return' && !L.travelling && (now - L.returnAt > RETURN_MS || y > vh * 0.25)) switchMode('top')

      const long = limit > vh * 1.8
      const deep = isVisible ? y > vh * 0.6 : y > vh * 1.1
      const want = !locked && (L.travelling || L.mode === 'return' || (long && deep))
      const justShown = want && !wanted
      wanted = want

      let liftTarget = 0
      const wrap = dock.current
      if (wrap && near.size) {
        const home = wrap.getBoundingClientRect()
        const top = home.top + lift
        const bottom = home.bottom + lift
        for (const el of near) {
          const r = el.getBoundingClientRect()
          if (!r.height || r.top >= vh || r.right <= home.left || r.left >= home.right || r.bottom <= top - GAP) continue
          liftTarget = Math.max(liftTarget, bottom - r.top + GAP)
        }
        liftTarget = Math.min(liftTarget, vh * 0.6)
      }

      const btn = button.current
      if (btn && want && (justShown || frame % 8 === 0)) {
        const r = btn.getBoundingClientRect()
        shade(toneBehind(r.left + r.width / 2, r.top + r.height / 2, btn))
      }

      show(want)
      open(want && (L.mode === 'return' || (L.travelling && L.travelUp) || L.hover || L.focus || now < L.openUntil))

      // Ring: reading progress, or the time left on the return offer.
      const ringTarget = L.mode === 'return' ? Math.max(0, 1 - (now - L.returnAt) / RETURN_MS) : limit > 0 ? Math.min(1, Math.max(0, y / limit)) : 0
      progress += (ringTarget - progress) * follow(L.mode === 'return' ? 0.12 : lenis ? 0.35 : 0.16)
      const offset = Math.round(RING_C * (1 - progress) * 100) / 100
      if (ring.current && offset !== wroteOffset) {
        ring.current.style.strokeDashoffset = String(offset)
        wroteOffset = offset
      }

      lift += (liftTarget - lift) * follow(0.22)
      if (Math.abs(liftTarget - lift) < 0.05) lift = liftTarget
      if (wrap && lift !== wroteLift) {
        wrap.style.transform = lift ? `translate3d(0, ${(-lift).toFixed(2)}px, 0)` : ''
        wroteLift = lift
      }

      magX += ((L.hover ? L.mx : 0) - magX) * follow(0.2)
      magY += ((L.hover ? L.my : 0) - magY) * follow(0.2)
      const mag = Math.abs(magX) < 0.02 && Math.abs(magY) < 0.02 ? '' : `translate3d(${magX.toFixed(2)}px, ${magY.toFixed(2)}px, 0)`
      if (core.current && mag !== wroteMag) {
        core.current.style.transform = mag
        wroteMag = mag
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  const travel = (to: number, done?: () => void) => {
    const L = live.current
    const lenis = getLenis()
    const from = readScroll().y
    if (!lenis || reducedMotion()) {
      window.scrollTo(0, to)
      done?.()
      return
    }
    // Longer trips take a little longer, never more than ~2 s.
    const duration = Math.min(2.2, 0.85 + (Math.abs(from - to) / window.innerHeight) * 0.12)
    L.travelling = true
    L.travelUp = to < from
    L.travelUntil = performance.now() + duration * 1000 + 250
    lenis.scrollTo(to, {
      duration,
      easing: easeInOutQuart,
      onComplete: () => {
        L.travelling = false
        done?.()
      },
    })
  }

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const L = live.current
    if (L.travelling) return
    if (L.mode === 'return') {
      switchMode('top')
      travel(L.returnTo)
      return
    }
    const viaKeyboard = e.detail === 0
    const from = readScroll().y
    L.returnTo = from
    setHeading(headingNear(from))
    travel(0, () => {
      // Keyboard users continue from the top of the page, not from a button at the bottom.
      if (viaKeyboard) document.querySelector<HTMLElement>('header a[href="#/"]')?.focus({ preventScroll: true })
      if (from > window.innerHeight * 1.5) {
        L.returnAt = performance.now()
        switchMode('return')
      }
    })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse' || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const L = live.current
    L.mx = Math.max(-MAGNET, Math.min(MAGNET, (e.clientX - (r.right - 24)) * 0.2))
    L.my = Math.max(-MAGNET, Math.min(MAGNET, (e.clientY - (r.top + r.height / 2)) * 0.2))
  }

  const dark = tone === 'dark'
  const label = mode === 'return' ? (heading ? `Return · ${heading}` : 'Return to where you were') : 'Back to top'

  return (
    <div ref={dock} className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[45] lg:bottom-8 lg:right-8">
      <button
        ref={button}
        type="button"
        onClick={onClick}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') live.current.hover = true }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { live.current.hover = false }}
        onFocus={(e) => { live.current.focus = e.currentTarget.matches(':focus-visible') }}
        onBlur={() => { live.current.focus = false }}
        inert={!visible}
        aria-label={mode === 'return' ? `Return to ${heading ?? 'where you were'}` : 'Back to top'}
        className={`group flex h-12 items-center rounded-full border outline-none backdrop-blur-md transition-[opacity,translate,scale,background-color,border-color,color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:[outline-offset:4px] focus-visible:[outline:1px_solid_var(--gold-vermeil)] motion-reduce:transition-opacity ${visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-3 scale-90 opacity-0'} ${dark ? 'border-white/15 bg-[var(--bg-vault)]/60 text-[var(--bg-travertine)] shadow-[0_14px_34px_-16px_rgba(0,0,0,0.7)]' : 'border-[var(--border-hairline)] bg-[var(--bg-travertine)]/80 text-[var(--text-espresso)] shadow-[0_14px_34px_-16px_rgba(20,19,17,0.4)]'}`}
      >
        <span className={`grid transition-[grid-template-columns] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${expanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'}`}>
          <span className="min-w-0 overflow-hidden">
            <span className={`block max-w-[min(56vw,17rem)] truncate whitespace-nowrap pl-5 text-[10px] font-medium uppercase tracking-[0.24em] transition-opacity duration-500 ${expanded ? 'opacity-100 delay-100' : 'opacity-0'}`}>
              {label}
            </span>
          </span>
        </span>
        <span ref={core} className="relative grid h-12 w-12 shrink-0 place-items-center">
          <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="24" cy="24" r={RING_R} fill="none" strokeWidth="1" className={`transition-[stroke] duration-700 ${dark ? 'stroke-white/15' : 'stroke-[var(--border-hairline)]'}`} />
            <circle ref={ring} cx="24" cy="24" r={RING_R} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C} className={`transition-[stroke] duration-700 ${dark ? 'stroke-[var(--gold-champagne)]' : 'stroke-[var(--gold-vermeil)]'}`} />
          </svg>
          <ArrowUp size={15} strokeWidth={1.4} className={`relative transition-[rotate,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mode === 'return' ? 'rotate-180' : 'group-hover:-translate-y-0.5'}`} />
        </span>
      </button>
    </div>
  )
}
