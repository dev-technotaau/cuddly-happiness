import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onStageClear } from '../lib/stage'

gsap.registerPlugin(ScrollTrigger)

/** Fades/slides in every [data-reveal] element and parallaxes every [data-parallax] image inside the scope. Under the
 *  splash or a page transition it waits, so what is on screen reveals as the page is uncovered. */
export default function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    if (!scope.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    return onStageClear(() => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.2,
              ease: 'expo.out',
              delay: Number(el.dataset.reveal) || 0,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            },
          )
        })
        gsap.utils.toArray<HTMLElement>('[data-reveal-img]').forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } },
          )
        })
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -8, scale: 1.12 },
            {
              yPercent: 8,
              scale: 1.12,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      }, scope)
      return () => ctx.revert()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
