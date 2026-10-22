import { useId, useMemo } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatPrice, type Currency } from '../../data/catalog'
import { CARAT, MAGIC_CARATS, facesUpLike, patch, stoneSize, type RingDesign } from '../../data/ring'
import { ringPrice } from '../../data/ringPrice'
import { bilingual, formatNumber, useCopy } from '../../i18n'
import { signed } from './LivePrice'

const COPY = bilingual(
  {
    weight: 'Weight',
    size: (l: string, w: string) => `${l} × ${w} mm`,
    looksLike: (ct: string) => `Faces up like a ${ct} ct round`,
    less: 'A little lighter',
    more: 'A little heavier',
    quick: 'Weights jewellers work to',
    chart: 'The price at each weight',
    chartNote: 'It steps up at the half and whole carats: just under them, the same look costs less.',
    chartLabel: (from: string, to: string) => `Price from ${from} at the lightest to ${to} at the heaviest, rising in steps at the half and whole carats.`,
  },
  {
    weight: 'Poids',
    size: (l, w) => `${l} × ${w} mm`,
    looksLike: (ct) => `À l’allure d’un rond de ${ct} ct`,
    less: 'Un peu plus léger',
    more: 'Un peu plus lourd',
    quick: 'Les poids des joailliers',
    chart: 'Le prix selon le poids',
    chartNote: 'Il monte d’un cran à chaque demi-carat et carat entier : juste en dessous, le même effet coûte moins.',
    chartLabel: (from, to) => `Prix de ${from} au plus léger à ${to} au plus lourd, par paliers aux demi-carats et carats entiers.`,
  },
)

const QUICK = [0.5, 0.75, 1, 1.5, 2, 3]
const W = 300
const H = 64

interface Props {
  design: RingDesign
  currency: Currency
  price: number
  onChange: (carat: number) => void
}

/** The centre stone's weight: a slider marked at the weights jewellers work to, its size in millimetres, how large an
 *  elongated shape looks, and a chart of the price at every weight, with the steps where value hides. */
export default function CaratField({ design, currency, price, onChange }: Props) {
  const t = useCopy(COPY)
  const id = useId()
  const { carat, type, shape } = design.stone
  const s = stoneSize(type, shape, carat)
  const mm = (n: number) => formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const ct = (n: number) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const elongated = shape === 'oval' || shape === 'pear' || shape === 'marquise' || shape === 'emerald' || shape === 'radiant'
  const pct = (c: number) => ((c - CARAT.min) / (CARAT.max - CARAT.min)) * 100

  // The curve: this design at every weight, everything else as chosen. It changes only when something else does.
  const rest = JSON.stringify({ ...design, stone: { ...design.stone, carat: 0 } })
  const curve = useMemo(() => {
    const pts: [number, number][] = []
    for (let c = CARAT.min; c <= CARAT.max + 1e-9; c += 0.025) pts.push([c, ringPrice(patch(design, { stone: { carat: Math.round(c * 1000) / 1000 } }), currency)])
    return pts
    // The design's weight is left out on purpose: the curve is the same at every weight.
  }, [rest, currency])
  const lo = curve[0][1]
  const hi = curve[curve.length - 1][1]
  const x = (c: number) => (pct(c) / 100) * W
  const y = (p: number) => H - 4 - ((p - lo) / (hi - lo || 1)) * (H - 10)
  const line = curve.map(([c, p], i) => `${i ? 'L' : 'M'}${x(c).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const nudge = (d: number) => onChange(Math.round(Math.min(CARAT.max, Math.max(CARAT.min, carat + d)) * 100) / 100)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="text-[11px] uppercase tracking-[0.22em]">{t.weight}</label>
        <p className="font-spec text-right text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">{t.size(mm(s.length), mm(s.width))}</p>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={() => nudge(-0.01)} aria-label={t.less} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] transition-colors hover:border-[var(--text-espresso)]"><Minus size={14} strokeWidth={1.4} /></button>
        <p className="font-serif-editorial flex-1 text-center text-5xl font-light leading-none tabular-nums">{ct(carat)}<span className="ml-2 text-xl text-[var(--text-taupe)]">ct</span></p>
        <button type="button" onClick={() => nudge(0.01)} aria-label={t.more} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] transition-colors hover:border-[var(--text-espresso)]"><Plus size={14} strokeWidth={1.4} /></button>
      </div>
      {elongated && <p className="mt-2 text-center text-xs text-[var(--text-taupe)]">{t.looksLike(ct(facesUpLike(type, shape, carat)))}</p>}

      {/* The slider, marked at the jewellers' weights */}
      <div className="relative mt-5">
        <input id={id} type="range" min={CARAT.min} max={CARAT.max} step={CARAT.step} value={carat} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${ct(carat)} ct`} className="relative w-full accent-[var(--text-espresso)]" />
        <div aria-hidden className="pointer-events-none relative mx-2 h-4">
          {MAGIC_CARATS.map((m) => (
            <span key={m} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pct(m)}%` }}>
              <span className="h-1.5 w-px bg-[var(--text-taupe)]" />
              <span className="font-spec mt-0.5 text-[9px] text-[var(--text-taupe)]">{formatNumber(m)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Weights jewellers work to */}
      <div role="group" aria-label={t.quick} className="mt-4 flex flex-wrap gap-1.5">
        {QUICK.map((q) => {
          const on = Math.abs(carat - q) < 0.005
          const delta = ringPrice(patch(design, { stone: { carat: q } }), currency) - price
          return (
            <button key={q} type="button" onClick={() => onChange(q)} aria-pressed={on} className={`font-spec rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
              {formatNumber(q)} ct{!on && delta !== 0 && <span className="ml-1.5 text-[10px] text-[var(--text-taupe)]">{signed(delta, currency)}</span>}
            </button>
          )
        })}
      </div>

      {/* Price at every weight */}
      <figure className="mt-6">
        <figcaption className="flex items-baseline justify-between gap-4">
          <span className="font-spec text-[9px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{t.chart}</span>
        </figcaption>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 block h-16 w-full" role="img" aria-label={t.chartLabel(formatPrice(lo, currency), formatPrice(hi, currency))}>
          {MAGIC_CARATS.map((m) => <line key={m} x1={x(m)} x2={x(m)} y1="0" y2={H} stroke="var(--border-hairline)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
          <path d={`${line} L${W},${H} L0,${H} Z`} fill="var(--gold-champagne)" fillOpacity="0.18" />
          <path d={line} fill="none" stroke="var(--gold-vermeil)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <line x1={x(carat)} x2={x(carat)} y1="0" y2={H} stroke="var(--text-espresso)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-taupe)]">{t.chartNote}</p>
      </figure>
    </div>
  )
}
