import { useEffect, type RefObject } from 'react'

/** Plays a muted video while it is mostly on screen; pauses otherwise. Disabled for reduced motion. */
export default function useInViewPlay(ref: RefObject<HTMLVideoElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.6) el.play().catch(() => undefined)
        else el.pause()
      },
      { threshold: [0, 0.6, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, enabled])
}
