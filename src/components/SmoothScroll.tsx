import { useEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null
export const getLenis = () => lenisInstance

/** Lenis on the GSAP ticker. Where a new page starts scrolling is PageTransition's call (top, or back where the visitor was). */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const edge = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    lenisInstance = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])

  // A scrollbar that appears without a resize event (the splash or an overlay gives the page its scrolling back) makes
  // the page narrower, while ScrollTrigger keeps a pinned section at the wider measure it took: the page would scroll
  // sideways by the scrollbar's width. A zero-height line across the page notices, and ScrollTrigger re-measures before
  // the next paint. A wider page needs nothing (nothing sticks out), and real resizes are ScrollTrigger's own business.
  useEffect(() => {
    const line = edge.current
    if (!line) return
    let inner = window.innerWidth
    let width = line.offsetWidth
    const ro = new ResizeObserver(() => {
      const narrower = line.offsetWidth < width && window.innerWidth === inner
      inner = window.innerWidth
      width = line.offsetWidth
      if (narrower) ScrollTrigger.refresh()
    })
    ro.observe(line)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div ref={edge} aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0" />
      {children}
    </>
  )
}
