import { useEffect, useRef, useState } from 'react'
import { formatPrice, type Currency } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'

const COPY = bilingual(
  { from: 'Lowest price', to: 'Highest price', any: 'Any price', over: (amount: string) => `${amount} and over` },
  { from: 'Prix minimum', to: 'Prix maximum', any: 'Tous les prix', over: (amount) => `${amount} et plus` },
)

interface Props {
  /** The prices the thumbs stop at, lowest first. */
  stops: number[]
  /** How many pieces fall between each pair of stops. */
  histogram: number[]
  min?: number
  max?: number
  currency: Currency
  /** Both ends at once; an end at the edge of the scale is open (undefined). */
  onChange: (min?: number, max?: number) => void
}

/** A price range on the shop's round-figure scale: two thumbs (sliders, by pointer or keys) over a histogram of the
 *  pieces, the range between them in ink. The range is written when a thumb is let go, so the address and the grid
 *  change once per move. */
export default function PriceRange({ stops, histogram, min, max, currency, onChange }: Props) {
  const t = useCopy(COPY)
  const last = stops.length - 1
  const lowAt = (v?: number) => (v === undefined ? 0 : stops.reduce((i, s, k) => (s <= v ? k : i), 0))
  const highAt = (v?: number) => {
    if (v === undefined) return last
    const k = stops.findIndex((s) => s >= v)
    return k < 0 ? last : k
  }
  const [range, setRange] = useState<[number, number]>(() => [lowAt(min), highAt(max)])
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<0 | 1 | null>(null)
  const live = useRef(range)
  live.current = range

  // The address is the truth; follow it whenever no thumb is held.
  useEffect(() => {
    if (drag.current === null) setRange([lowAt(min), highAt(max)])
    // lowAt and highAt read the stops, which the dependencies cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, stops])

  const commit = ([lo, hi]: [number, number]) => onChange(lo === 0 ? undefined : stops[lo], hi === last ? undefined : stops[hi])
  const move = (thumb: 0 | 1, to: number): [number, number] => {
    const [lo, hi] = live.current
    return thumb === 0 ? [Math.max(0, Math.min(to, hi - 1)), hi] : [lo, Math.min(last, Math.max(to, lo + 1))]
  }
  const indexAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    return Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * last)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const at = indexAt(e.clientX)
    const [lo, hi] = live.current
    // The nearer thumb takes the press; between two equally near, the one the pointer is moving toward.
    drag.current = Math.abs(at - lo) < Math.abs(at - hi) || (Math.abs(at - lo) === Math.abs(at - hi) && at < lo) ? 0 : 1
    e.currentTarget.setPointerCapture(e.pointerId)
    setRange(move(drag.current, at))
    const thumbs = e.currentTarget.querySelectorAll<HTMLElement>('[role="slider"]')
    thumbs[drag.current]?.focus({ preventScroll: true })
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current === null) return
    setRange(move(drag.current, indexAt(e.clientX)))
  }
  const onPointerUp = () => {
    if (drag.current === null) return
    drag.current = null
    commit(live.current)
  }

  const onKey = (thumb: 0 | 1) => (e: React.KeyboardEvent) => {
    const [lo, hi] = live.current
    const at = thumb === 0 ? lo : hi
    const to = { ArrowLeft: at - 1, ArrowDown: at - 1, ArrowRight: at + 1, ArrowUp: at + 1, PageDown: at - 3, PageUp: at + 3, Home: 0, End: last }[e.key]
    if (to === undefined) return
    e.preventDefault()
    const next = move(thumb, to)
    setRange(next)
    commit(next)
  }

  const [lo, hi] = range
  const pct = (i: number) => `${(i / last) * 100}%`
  const tallest = Math.max(1, ...histogram)
  const price = (i: number) => (i === last && i > 0 ? t.over(formatPrice(stops[i], currency)) : formatPrice(stops[i], currency))
  const thumb = 'absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--text-espresso)] bg-[var(--bg-travertine)] shadow-[0_2px_6px_rgba(20,19,17,0.18)] transition-transform duration-300 hover:scale-110 focus-visible:scale-110 active:scale-110 cursor-grab active:cursor-grabbing'

  return (
    <div>
      <p className="font-spec text-sm" aria-hidden="true">{lo === 0 && hi === last ? t.any : `${formatPrice(stops[lo], currency)} – ${hi === last ? t.over(formatPrice(stops[hi], currency)) : formatPrice(stops[hi], currency)}`}</p>
      {/* The pieces at each price, the chosen span in ink */}
      <div aria-hidden="true" className="mt-5 flex h-12 items-end gap-[2px]">
        {histogram.map((n, i) => (
          <span key={i} className={`flex-1 transition-colors duration-300 ${i >= lo && i < hi ? 'bg-[var(--text-espresso)]/75' : 'bg-[var(--border-hairline)]'}`} style={{ height: n ? `${Math.max(8, (n / tallest) * 100)}%` : '2px' }} />
        ))}
      </div>
      <div ref={track} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="relative h-8 touch-none select-none">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-hairline)]" />
        <span aria-hidden="true" className="absolute top-1/2 h-px bg-[var(--text-espresso)]" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
        {([0, 1] as const).map((k) => {
          const i = k === 0 ? lo : hi
          return (
            <span
              key={k}
              role="slider"
              tabIndex={0}
              aria-label={k === 0 ? t.from : t.to}
              aria-valuemin={k === 0 ? stops[0] : stops[lo + 1]}
              aria-valuemax={k === 0 ? stops[hi - 1] : stops[last]}
              aria-valuenow={stops[i]}
              aria-valuetext={price(i)}
              onKeyDown={onKey(k)}
              className={thumb}
              style={{ left: pct(i) }}
            />
          )
        })}
      </div>
      <div aria-hidden="true" className="font-spec mt-1 flex justify-between text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">
        <span>{formatPrice(stops[0], currency)}</span>
        <span>{t.over(formatPrice(stops[last], currency))}</span>
      </div>
    </div>
  )
}
