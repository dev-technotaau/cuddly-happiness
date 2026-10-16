import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Travel speed in CSS pixels per second, the same whatever the content length. */
  speed?: number
  className?: string
}

/**
 * Seamless marquee on the Web Animations API, so it runs on the compositor like a CSS animation but stays controllable:
 * a constant speed, exact sub-pixel loop distance, enough copies to fill any width, an eased stop on hover, a pause
 * off-screen, and no movement under reduced motion. Children carry their own spacing; copies after the first are hidden
 * from assistive tech.
 */
export default function Marquee({ children, speed = 40, className = '' }: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(2)

  useEffect(() => {
    const vp = viewport.current
    const tr = track.current
    const first = tr?.firstElementChild as HTMLElement | null | undefined
    if (!vp || !tr || !first || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let anim: Animation | null = null
    let width = 0
    let visible = true
    let rate = 1
    let target = 1
    let raf = 0
    let last = 0
    let disposed = false

    // (Re)build the loop for the current copy width, keeping its place so a resize or late font never jumps.
    const build = () => {
      const w = first.getBoundingClientRect().width
      if (!w) return
      setCopies((c) => Math.max(c, Math.ceil(vp.clientWidth / w) + 1))
      if (anim && Math.abs(w - width) < 0.5) return
      const prior = anim && width ? (Number(anim.currentTime ?? 0) % ((width / speed) * 1000)) / ((width / speed) * 1000) : 0
      anim?.cancel()
      width = w
      const duration = (w / speed) * 1000
      anim = tr.animate([{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(${-w}px, 0, 0)` }], { duration, iterations: Infinity, easing: 'linear' })
      anim.currentTime = prior * duration
      anim.playbackRate = rate
      if (!visible) anim.pause()
    }

    // Hover eases the speed to a standstill (and back) instead of freezing mid-glide.
    const step = (now: number) => {
      const dt = last ? now - last : 16
      last = now
      rate += (target - rate) * (1 - Math.exp(-dt / 160))
      if (Math.abs(target - rate) < 0.005) rate = target
      anim?.updatePlaybackRate(rate)
      raf = rate === target ? 0 : requestAnimationFrame(step)
    }
    const ease = (to: number) => {
      target = to
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') ease(0)
    }
    const onLeave = () => ease(1)

    const ro = new ResizeObserver(() => build())
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!anim) return
      if (visible) anim.play()
      else anim.pause()
    })
    // Start once the web fonts are in, so the loop is measured on the final text.
    document.fonts.ready.then(() => {
      if (disposed) return
      build()
      ro.observe(first)
      ro.observe(vp)
    })
    io.observe(vp)
    vp.addEventListener('pointerenter', onEnter)
    vp.addEventListener('pointerleave', onLeave)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      vp.removeEventListener('pointerenter', onEnter)
      vp.removeEventListener('pointerleave', onLeave)
      anim?.cancel()
    }
  }, [speed])

  return (
    <div ref={viewport} className={`overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max [backface-visibility:hidden] will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} className="flex shrink-0" aria-hidden={i > 0 || undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}
