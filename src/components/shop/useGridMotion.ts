import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import type { Flip as FlipPlugin } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onStageClear } from '../../lib/stage'

gsap.registerPlugin(ScrollTrigger)

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Flip loads after the page, off the first load's path; a change made before it arrives simply doesn't glide.
let flip: typeof FlipPlugin | null = null
const loadFlip = () =>
  flip
    ? Promise.resolve()
    : import('gsap/Flip').then((m) => {
        gsap.registerPlugin(m.Flip)
        flip = m.Flip
      })

/** The shop grid's motion. Its cards rise in as the page is uncovered (those below the fold as they scroll in); then,
 *  whenever the selection changes, `capture()` notes where every card stands and the next render glides each one to
 *  its new place (GSAP Flip, matched by `data-flip-id`), the newcomers rising in. Nothing moves under reduced motion. */
export default function useGridMotion(grid: RefObject<HTMLElement | null>) {
  const entrance = useRef<gsap.Context | null>(null)
  const state = useRef<Flip.FlipState | null>(null)
  const running = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!reduced()) void loadFlip()
  }, [])

  useLayoutEffect(() => {
    const el = grid.current
    if (!el || reduced()) return
    const stop = onStageClear(() => {
      entrance.current = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>('[data-flip-id]')
        const fold = window.innerHeight * 0.94
        const near = items.filter((i) => i.getBoundingClientRect().top < fold)
        const below = items.filter((i) => !near.includes(i))
        if (near.length) gsap.fromTo(near, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.05 })
        if (!below.length) return
        gsap.set(below, { opacity: 0, y: 44 })
        ScrollTrigger.batch(below, { start: 'top 94%', once: true, onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }) })
      }, el)
      return () => entrance.current?.revert()
    })
    return () => {
      stop()
      running.current?.kill()
    }
  }, [grid])

  /** Notes where the cards stand, just before the selection changes. */
  const capture = useCallback(() => {
    const el = grid.current
    if (!el || reduced()) return
    // The first change ends the entrance: every card shows, wherever it waited.
    entrance.current?.revert()
    entrance.current = null
    running.current?.progress(1)
    state.current = flip?.getState(el.querySelectorAll('[data-flip-id]')) ?? null
  }, [grid])

  // After the render that follows a capture: from where they stood to where they are.
  useLayoutEffect(() => {
    const el = grid.current
    const from = state.current
    if (!el || !from || !flip) return
    state.current = null
    running.current = flip.from(from, {
      targets: el.querySelectorAll('[data-flip-id]'),
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.012,
      prune: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035, delay: 0.08 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
  })

  return useMemo(() => ({ capture }), [capture])
}
