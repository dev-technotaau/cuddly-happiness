import { useEffect, useState, type RefObject } from 'react'
import type { Product } from '../../data/catalog'
import Price from '../Price'
import TryOnButton from '../tryon/TryOnButton'

interface Props {
  product: Product
  amount: number
  detail?: string
  label: string
  target: RefObject<HTMLElement | null>
  onAction: () => void
}

/** Slides up once the primary CTA has scrolled out of view. */
export default function StickyBar({ product, amount, detail, label, target, onAction }: Props) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = target.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [target])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-5 px-6 py-3 lg:px-12">
        <img src={product.images[0]} alt="" className="hidden h-12 w-10 object-cover sm:block" />
        <div className="min-w-0 flex-1">
          <p className="font-serif-editorial truncate text-xl leading-tight">{product.name}</p>
          {detail && <p className="font-mono-spec truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">{detail}</p>}
        </div>
        <Price amount={amount} className="hidden text-sm sm:inline" />
        <TryOnButton product={product} variant="icon" />
        <button onClick={onAction} tabIndex={show ? 0 : -1} className="bg-[var(--text-espresso)] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] sm:px-10">
          {label}
        </button>
      </div>
    </div>
  )
}
