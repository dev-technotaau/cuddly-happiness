import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../data/catalog'
import { useStore } from '../../store'
import Price from '../Price'

/** A signed amount for a change: "+$420", "−$310" (a true minus), in the visitor's format. */
export function signed(delta: number, currency: 'CAD' | 'USD') {
  return `${delta < 0 ? '−' : '+'}${formatPrice(Math.abs(delta), currency)}`
}

/** A price that counts to its new amount when it changes, with the change itself shown beside it for a moment. */
export default function LivePrice({ amount, className = '', chip = true }: { amount: number; className?: string; chip?: boolean }) {
  const { currency } = useStore()
  const [shown, setShown] = useState(amount)
  const [delta, setDelta] = useState<number | null>(null)
  const from = useRef(amount)
  const last = useRef({ amount, currency })

  useEffect(() => {
    const prev = last.current
    last.current = { amount, currency }
    // A new market is a new price, not a change to the ring: no count, no chip.
    if (prev.currency !== currency || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(amount)
      from.current = amount
      return
    }
    if (prev.amount === amount) return
    if (chip) setDelta(amount - prev.amount)
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 650)
      const k = 1 - (1 - t) ** 4
      const v = Math.round(a + (amount - a) * k)
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const clear = window.setTimeout(() => setDelta(null), 2000)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(clear)
    }
  }, [amount, currency, chip])

  return (
    <span className={`relative inline-flex items-baseline whitespace-nowrap ${className}`}>
      <Price amount={shown} />
      {chip && (
        <span aria-hidden className={`font-spec pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap text-[11px] max-sm:hidden tracking-[0.04em] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${delta ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'} ${delta && delta < 0 ? 'text-[var(--gold-ink)]' : 'text-[var(--text-taupe)]'}`}>
          {delta ? signed(delta, currency) : ''}
        </span>
      )}
    </span>
  )
}
