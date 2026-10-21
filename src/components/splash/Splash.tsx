import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { bilingual, useCopy } from '../../i18n'
import { clearStage, INTRO, markIntroSeen } from '../../lib/stage'
import Ampersand from '../brand/Ampersand'
import { getLenis } from '../SmoothScroll'

const FOUNDED = 1962
const NOW = new Date().getFullYear()
const WORDMARK = 'Teresa & Sons'
const SINCE = bilingual({ since: 'Montréal · Est. 1962' }, { since: 'Montréal · Depuis 1962' })
// Seconds the intro stays at least, once seen: long enough to be a moment, short enough not to be a wait.
const HOLD = { full: 2.4, short: 1.1, veil: 0 }
// Never wait longer than this (ms) for the page beneath, or for the fonts before the wordmark shows.
const LIMIT = { full: 2600, short: 2000, veil: 600 }
const FONT_WAIT = 1200

// The intro's stage cover (src/lib/stage.ts) lifts once per page load, even if React mounts the splash twice.
let lifted = false
const lift = () => {
  if (lifted) return
  lifted = true
  clearStage()
}

/** The first moment of a visit: the house mark draws itself in gold and the wordmark settles while a gold seam fills
 *  with the page's real loading progress, its year counting from 1962 to now. Then a glint runs along the seam and the
 *  case opens on the page. In full once per session (shorter on a deep link), a brief veil afterwards. Any key,
 *  click, tap or scroll skips ahead. */
export default function Splash() {
  const { since } = useCopy(SINCE)
  const [done, setDone] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Lenis is created after the splash mounts, so hold it on the next frame.
    const holdLenis = requestAnimationFrame(() => getLenis()?.stop())
    const anims: gsap.core.Animation[] = []
    const timers: number[] = []
    let alive = true
    let finished = false
    const finish = () => {
      if (finished || !alive) return
      finished = true
      lift()
      document.documentElement.classList.remove('tns-intro')
      document.body.style.overflow = prev
      getLenis()?.start()
      if (INTRO !== 'veil') markIntroSeen()
      setDone(true)
    }
    const cleanup = () => {
      alive = false
      cancelAnimationFrame(holdLenis)
      timers.forEach((t) => window.clearTimeout(t))
      // Revert, not kill: React's development double-run must find the letters as they were, not as a from-tween left them.
      anims.forEach((a) => a.revert())
      document.body.style.overflow = prev
    }
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)))
    // The fonts, or a fallback face after a short wait: a slow font must never hold the intro.
    const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(INTRO === 'veil' ? LIMIT.veil : FONT_WAIT)])

    // Later loads in the session: a travertine veil hides the font swap, then fades.
    if (INTRO === 'veil') {
      fontsReady.then(() => {
        if (!alive) return
        lift()
        anims.push(gsap.to(el, { opacity: 0, duration: reduced ? 0.2 : 0.5, ease: 'power2.out', onComplete: finish }))
      })
      return cleanup
    }

    const q = gsap.utils.selector(el)
    const full = INTRO === 'full'
    const line = el.querySelector<SVGPathElement>('[data-amp-line]')
    const seam = el.querySelector<HTMLElement>('[data-seam]')
    const year = el.querySelector<HTMLElement>('[data-year]')
    let hold = (reduced ? Math.min(HOLD[INTRO], 1.2) : HOLD[INTRO]) * 1000

    // The entrance waits, paused, until the tab is actually seen.
    const intro = gsap.timeline({ paused: true })
    anims.push(intro)
    if (!reduced && full) {
      const len = line?.getTotalLength() ?? 0
      intro
        .set(q('[data-amp-fill]'), { opacity: 0 })
        .set(line, { opacity: 1, strokeDasharray: len, strokeDashoffset: len })
        .to(line, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.1)
        .to(q('[data-amp-fill]'), { opacity: 1, duration: 0.9, ease: 'power2.out' }, 1.05)
        .to(line, { opacity: 0, duration: 0.7 }, 1.4)
        .from(year, { opacity: 0, duration: 0.8 }, 0.35)
        // The letters need their own face: give it a moment (FONT_WAIT at most) rather than show a fallback serif.
        .addPause(0.8, () => void fontsReady.then(() => {
          if (alive) intro.resume()
        }))
        .from(q('[data-letter]'), { yPercent: 70, opacity: 0, filter: 'blur(8px)', duration: 1, stagger: 0.04, ease: 'expo.out', clearProps: 'filter' }, 0.85)
        .from(q('[data-sub]'), { opacity: 0, y: 8, duration: 0.9, ease: 'expo.out' }, 1.35)
    } else if (!reduced) {
      intro
        .from(q('[data-mark]'), { opacity: 0, scale: 0.94, duration: 0.8, ease: 'expo.out' }, 0)
        .from(year, { opacity: 0, duration: 0.5 }, 0.15)
        .addPause(0.05, () => void fontsReady.then(() => {
          if (alive) intro.resume()
        }))
        .from(q('[data-letter]'), { yPercent: 50, opacity: 0, duration: 0.7, stagger: 0.02, ease: 'expo.out' }, 0.1)
        .from(q('[data-sub]'), { opacity: 0, duration: 0.6 }, 0.35)
    }

    // Progress: the fonts and every image on the first screen of the page beneath, eased so it never jumps.
    const shown = { p: 0 }
    let real = 0
    let started = 0
    let opening = false
    const render = () => {
      if (seam) seam.style.transform = `scaleX(${shown.p})`
      if (year) year.textContent = String(Math.round(FOUNDED + shown.p * (NOW - FOUNDED)))
    }
    let skipped = false
    const open = () => {
      opening = true
      // A visitor who skipped wants in: the same opening, quicker.
      const tl = gsap.timeline({ onComplete: finish }).timeScale(skipped ? 1.6 : 1)
      anims.push(tl)
      if (reduced) {
        tl.add(lift).to(el, { opacity: 0, duration: 0.5, ease: 'power2.out' })
        return
      }
      intro.progress(1)
      tl.fromTo(q('[data-glint]'), { xPercent: -100, opacity: 1 }, { xPercent: 340, duration: 0.75, ease: 'power2.inOut' })
        .to(q('[data-rise]'), { y: -14, opacity: 0, duration: 0.55, ease: 'power2.in', stagger: 0.05 }, 0.25)
        .to(year, { y: 10, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.25)
        // The page's own entrance starts as the case opens.
        .add(lift, 0.65)
        .to(q('[data-seam-wrap]'), { opacity: 0, duration: 0.4 }, 0.7)
        .to(q('[data-half="top"]'), { yPercent: -101, duration: 1.15, ease: 'expo.inOut' }, 0.65)
        .to(q('[data-half="bottom"]'), { yPercent: 101, duration: 1.15, ease: 'expo.inOut' }, 0.65)
    }
    const maybeOpen = () => {
      if (opening || !started || shown.p < 0.999) return
      const left = hold - (performance.now() - started)
      if (left > 0) timers.push(window.setTimeout(maybeOpen, left))
      else open()
    }
    let follow: gsap.core.Tween | null = null
    // Only real progress restarts the ease; an asset landing after the cap must not push the opening back.
    const advance = (to: number, duration = 0.9) => {
      if (!alive || to <= real) return
      real = to
      follow?.kill()
      follow = gsap.to(shown, { p: real, duration, ease: 'power2.out', onUpdate: render, onComplete: maybeOpen })
      anims.push(follow)
    }
    const tasks: Promise<unknown>[] = [fontsReady]
    document.querySelectorAll<HTMLImageElement>('main img').forEach((img) => {
      const r = img.getBoundingClientRect()
      if (r.width && r.bottom > 0 && r.top < window.innerHeight) tasks.push(img.decode().catch(() => undefined))
    })
    let loaded = 0
    tasks.forEach((t) =>
      t.then(() => {
        loaded += 1
        advance(loaded / tasks.length)
      }),
    )
    timers.push(window.setTimeout(() => advance(1, 0.6), reduced ? 1500 : LIMIT[INTRO]))

    const begin = () => {
      if (started) return
      started = performance.now()
      intro.play()
      maybeOpen()
    }
    // A key, click, tap or scroll: the visitor wants in, so fill the seam and open.
    const skip = () => {
      if (opening) return
      skipped = true
      begin()
      hold = 0
      advance(1, 0.35)
      maybeOpen()
    }
    const onVisible = () => {
      if (!document.hidden) begin()
    }
    if (document.hidden) document.addEventListener('visibilitychange', onVisible)
    else begin()
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      cleanup()
    }
  }, [])

  if (done) return null
  if (INTRO === 'veil') return <div ref={root} aria-hidden="true" className="fixed inset-0 z-[130] bg-[var(--bg-travertine)]" />
  return (
    <div ref={root} aria-hidden="true" className="fixed inset-0 z-[130] cursor-default select-none">
      {/* The case: two halves that part along the seam. They overlap by 2 px so no hairline of the page shows through. */}
      <div data-half="top" className="absolute inset-x-0 bottom-[calc(50%-1px)] top-0 bg-[var(--bg-vault)]">
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[clamp(28px,5vh,52px)]">
          <div data-rise data-mark>
            <Ampersand className="h-[clamp(64px,11vh,112px)] w-auto" />
          </div>
          <p data-rise className="font-serif-editorial -mr-[0.2em] mt-[clamp(16px,3vh,28px)] whitespace-nowrap text-[clamp(19px,2vw,28px)] uppercase tracking-[0.2em] text-[var(--bg-travertine)]">
            {WORDMARK.split('').map((ch, i) => (
              <span key={i} data-letter className={`inline-block whitespace-pre ${ch === '&' ? 'italic text-[var(--gold-champagne)]' : ''}`}>{ch}</span>
            ))}
          </p>
          <p data-rise data-sub className="font-spec -mr-[0.4em] mt-3 text-[10px] uppercase tracking-[0.4em] text-white/55">{since}</p>
        </div>
      </div>
      <div data-half="bottom" className="absolute inset-x-0 bottom-0 top-[calc(50%-1px)] bg-[var(--bg-vault)]">
        <p className="absolute inset-x-0 top-0 flex justify-center pt-[clamp(18px,3vh,32px)]">
          <span data-year className="font-spec -mr-[0.42em] text-[11px] tracking-[0.42em] text-[var(--gold-champagne)]">{FOUNDED}</span>
        </p>
      </div>
      {/* The seam fills with the page's loading, then a glint runs along it */}
      <div data-seam-wrap className="absolute left-1/2 top-1/2 h-px w-[min(60vw,680px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        {/* Scaled by inline transform: a Tailwind scale class sets the separate `scale` property, which would multiply with it */}
        <div data-seam className="h-full w-full origin-center bg-[var(--gold-champagne)]/70" style={{ transform: 'scaleX(0)' }} />
        <div data-glint className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-transparent via-white to-transparent opacity-0" />
      </div>
    </div>
  )
}
