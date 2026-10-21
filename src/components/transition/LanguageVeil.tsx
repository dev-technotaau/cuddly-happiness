import { useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LANGUAGE, registerSwitcher, type Lang } from '../../i18n'
import { rich } from '../../i18n/rich'
import { clearStage, coverStage } from '../../lib/stage'
import { useStore } from '../../store'
import Ampersand from '../brand/Ampersand'
import { getLenis } from '../SmoothScroll'

// What the veil says, in the language it is switching to: where the visitor now is, and a word of welcome.
const CARD: Record<Lang, { region: (us: boolean) => string; title: string; done: string }> = {
  en: { region: (us) => (us ? 'United States' : 'Canada'), title: '<em>Welcome</em>.', done: 'The site is now in English.' },
  fr: { region: () => 'Canada', title: '<em>Bienvenue</em>.', done: 'Le site est maintenant en français.' },
}

/** What the visitor is reading, so the page can be put back under them once the copy has changed length. */
function holdPlace() {
  if (window.scrollY < 8) return () => undefined
  const el = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight * 0.35, 360))
  const target = el?.closest<HTMLElement>('main *, footer *') ?? null
  if (!target) return () => undefined
  const top = target.getBoundingClientRect().top
  return () => {
    if (!target.isConnected) return
    const moved = target.getBoundingClientRect().top - top
    if (Math.abs(moved) > 1) window.scrollTo(0, window.scrollY + moved)
  }
}

/** The language switch. A travertine veil names the new language while every string swaps beneath it, then lifts on
 *  the same place in the page: nothing reloads, the bag, forms and open menus stay as they were. The change is
 *  announced in the new language. Under reduced motion, or during a page transition, the swap is immediate. */
export default function LanguageVeil() {
  const { currency } = useStore()
  const [to, setTo] = useState<Lang>('en')
  const veil = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const live = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let tl: gsap.core.Timeline | null = null
    const announce = (lang: Lang) => {
      if (!live.current) return
      live.current.lang = lang
      live.current.textContent = CARD[lang].done
    }
    registerSwitcher((next, apply) => {
      const root = document.documentElement
      const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!root.dataset.transition || !veil.current || !card.current
      if (quiet || tl) {
        tl?.progress(1)
        const restore = holdPlace()
        apply()
        restore()
        ScrollTrigger.refresh()
        announce(next)
        return
      }
      flushSync(() => setTo(next))
      getLenis()?.stop()
      const restore = holdPlace()
      // Entrances that rebuild with the new copy wait for the veil, like the page transitions' do.
      coverStage()
      root.dataset.switching = next
      let cleared = false
      const clear = () => {
        if (cleared) return
        cleared = true
        clearStage()
      }
      tl = gsap
        .timeline({
          onComplete: () => {
            tl = null
            getLenis()?.start()
            delete root.dataset.switching
            announce(next)
          },
          onInterrupt: clear,
        })
        .set(veil.current, { autoAlpha: 0 })
        .set(card.current, { autoAlpha: 0, y: 10 })
        .to(veil.current, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0)
        .to(card.current, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'expo.out' }, 0.1)
        .add(() => {
          apply()
          restore()
          ScrollTrigger.refresh()
        }, 0.32)
        .to(card.current, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in' }, 0.85)
        .add(clear, 0.9)
        .to(veil.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 0.95)
    })
    return () => {
      registerSwitcher(null)
      tl?.progress(1)
    }
  }, [])

  return (
    <>
      {createPortal(
        <div ref={veil} aria-hidden="true" className="invisible fixed inset-0 z-[125] flex items-center justify-center bg-[var(--bg-travertine)] px-6 text-center">
          <div ref={card} lang={to} className="invisible flex flex-col items-center">
            <Ampersand className="h-7 w-auto" />
            <p className="font-spec mt-5 text-[10px] uppercase tracking-[0.34em] text-[var(--text-taupe)]">
              {LANGUAGE[to].name} · {CARD[to].region(currency === 'USD')}
            </p>
            <p className="font-serif-editorial mt-3 text-[clamp(32px,3.6vw,48px)] font-light leading-tight text-[var(--text-espresso)] [&_em]:text-[var(--gold-vermeil)]">{rich(CARD[to].title)}</p>
          </div>
        </div>,
        document.body,
      )}
      <p ref={live} aria-live="polite" className="sr-only" />
    </>
  )
}
