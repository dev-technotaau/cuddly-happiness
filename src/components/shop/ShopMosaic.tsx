import { useEffect, useRef, type ReactNode } from 'react'
import { cardPrice, pic, rentFirst, type Product } from '../../data/catalog'
import { useCatalog } from '../../i18n/catalog'
import { href, useStore } from '../../store'
import Price from '../Price'

/** A track that drifts without end on the Web Animations API (on the compositor, like a CSS animation): down or up a
 *  column, or along a row. It eases to a stop under the mouse and while a tile has the focus, pauses off-screen and
 *  stands still under reduced motion. The second copy, there to close the loop, is inert. */
function Drift({ children, axis, speed, reverse = false, className = '' }: { children: ReactNode; axis: 'x' | 'y'; speed: number; reverse?: boolean; className?: string }) {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vp = viewport.current
    const tr = track.current
    const first = tr?.firstElementChild as HTMLElement | null | undefined
    if (!vp || !tr || !first || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let anim: Animation | null = null
    let size = 0
    let rate = 1
    let target = 1
    let raf = 0
    let last = 0
    let visible = true
    let held = 0

    const build = () => {
      const r = first.getBoundingClientRect()
      const s = axis === 'y' ? r.height : r.width
      if (!s || Math.abs(s - size) < 0.5) return
      const prior = anim && size ? (Number(anim.currentTime ?? 0) % ((size / speed) * 1000)) / ((size / speed) * 1000) : 0
      anim?.cancel()
      size = s
      const at = (n: number) => (axis === 'y' ? `translate3d(0, ${n}px, 0)` : `translate3d(${n}px, 0, 0)`)
      const duration = (s / speed) * 1000
      anim = tr.animate([{ transform: at(reverse ? -s : 0) }, { transform: at(reverse ? 0 : -s) }], { duration, iterations: Infinity, easing: 'linear' })
      anim.currentTime = prior * duration
      anim.playbackRate = rate
      if (!visible) anim.pause()
    }
    const step = (now: number) => {
      const dt = last ? now - last : 16
      last = now
      rate += (target - rate) * (1 - Math.exp(-dt / 220))
      if (Math.abs(target - rate) < 0.005) rate = target
      anim?.updatePlaybackRate(rate)
      raf = rate === target ? 0 : requestAnimationFrame(step)
    }
    const ease = () => {
      target = held > 0 ? 0 : 1
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }
    // A mouse over the column, or the focus on one of its tiles, holds it.
    const hold = (on: boolean) => {
      held = Math.max(0, held + (on ? 1 : -1))
      ease()
    }
    const onEnter = (e: PointerEvent) => e.pointerType === 'mouse' && hold(true)
    const onLeave = (e: PointerEvent) => e.pointerType === 'mouse' && hold(false)
    const onFocusIn = () => hold(true)
    const onFocusOut = () => hold(false)

    const ro = new ResizeObserver(build)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!anim) return
      if (visible) anim.play()
      else anim.pause()
    })
    build()
    ro.observe(first)
    io.observe(vp)
    vp.addEventListener('pointerenter', onEnter)
    vp.addEventListener('pointerleave', onLeave)
    vp.addEventListener('focusin', onFocusIn)
    vp.addEventListener('focusout', onFocusOut)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      vp.removeEventListener('pointerenter', onEnter)
      vp.removeEventListener('pointerleave', onLeave)
      vp.removeEventListener('focusin', onFocusIn)
      vp.removeEventListener('focusout', onFocusOut)
      anim?.cancel()
    }
  }, [axis, speed, reverse])

  return (
    <div ref={viewport} className={`overflow-hidden ${className}`}>
      <div ref={track} className={`flex will-change-transform [backface-visibility:hidden] ${axis === 'y' ? 'flex-col' : 'w-max'}`}>
        <div className={`flex shrink-0 ${axis === 'y' ? 'flex-col' : ''}`}>{children}</div>
        <div inert aria-hidden="true" className={`flex shrink-0 ${axis === 'y' ? 'flex-col' : ''}`}>{children}</div>
      </div>
    </div>
  )
}

/** One piece in the mosaic: its photograph as a link to its page (the page transition flies it there), with its
 *  name and price under the mouse or the focus. */
function Tile({ product, amount, sizes, lazy, className = '' }: { product: Product; amount: number; sizes: string; lazy: boolean; className?: string }) {
  const catalog = useCatalog()
  const name = catalog.name(product)
  return (
    <a href={href.product(product.slug, rentFirst(product))} className={`group relative block shrink-0 overflow-hidden bg-white/[0.04] ${className}`}>
      <img {...pic(product.images[0], sizes)} alt={name} loading={lazy ? 'lazy' : 'eager'} decoding="async" className="aspect-[4/5] h-full w-full object-cover opacity-75 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-[var(--bg-vault)]/85 to-transparent px-3 pb-3 pt-10 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <span className="font-serif-editorial block truncate text-[15px] leading-tight text-[var(--bg-travertine)]">{name}</span>
        <Price amount={amount} className="mt-1 block text-[11px] text-white/75 [&_span]:text-white/60" />
      </span>
    </a>
  )
}

/** The shop hero's mosaic: three columns of pieces drifting in turn on a desktop, one row on a phone. */
export default function ShopMosaic({ pieces, className = '' }: { pieces: Product[]; className?: string }) {
  const { currency } = useStore()
  const columns = [0, 1, 2].map((c) => pieces.filter((_, i) => i % 3 === c))
  return (
    <div className={className}>
      <div className="absolute inset-0 hidden grid-cols-3 gap-4 [mask-image:linear-gradient(180deg,transparent,#000_14%,#000_86%,transparent)] lg:grid">
        {columns.map((col, c) => (
          <Drift key={c} axis="y" speed={[16, 21, 18][c]} reverse={c === 1} className="h-full">
            {col.map((p, i) => <Tile key={p.slug} product={p} amount={cardPrice(p, currency).amount} sizes="16vw" lazy={i > 2} className="mb-4" />)}
          </Drift>
        ))}
      </div>
      <Drift axis="x" speed={22} className="[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] lg:hidden">
        {pieces.slice(0, 10).map((p, i) => <Tile key={p.slug} product={p} amount={cardPrice(p, currency).amount} sizes="34vw" lazy={i > 3} className="mr-3 w-[34vw] max-w-[180px]" />)}
      </Drift>
    </div>
  )
}
