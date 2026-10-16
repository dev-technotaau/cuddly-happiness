import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { METALS, type Metal, type Personalization, type Product, type RentalPeriodId } from '../../data/catalog'
import { buildCostBreakdown, splitTaxes, type CostGroup, type CostLine } from '../../data/costing'
import { PROVINCES, US_STATES } from '../../data/tax'
import { useStore } from '../../store'
import Price from '../Price'
import SectionHeader from '../home/SectionHeader'

const GROUPS: { id: CostGroup; label: string; color: string }[] = [
  { id: 'materials', label: 'Materials', color: 'var(--text-espresso)' },
  { id: 'making', label: 'Making charges', color: 'var(--gold-vermeil)' },
  { id: 'services', label: 'Certification & services', color: 'var(--gold-champagne)' },
  { id: 'options', label: 'Selected options', color: '#8a6a32' },
  { id: 'margin', label: 'Maison margin', color: 'var(--text-linen)' },
]

// Rental fees, split by what they actually pay for.
function rentalLines(p: Product, period: RentalPeriodId, currency: 'CAD' | 'USD'): CostLine[] {
  const fee = p.rental![period][currency]
  const parts: [string, string, string, number][] = [
    ['insure', 'Full insurance cover', 'Loss, theft & damage for the rental period', 0.22],
    ['clean', 'Cleaning & re-certification', 'Ultrasonic clean, claw check, gemmologist sign-off', 0.08],
    ['courier', 'Bonded courier, both ways', 'Or in-salon fitting', 0.12],
  ]
  const lines: CostLine[] = parts.map(([id, label, detail, k]) => ({ id, group: 'services', label, detail, amount: Math.round(fee * k) }))
  const used = lines.reduce((s, l) => s + l.amount, 0)
  lines.unshift({ id: 'wear', group: 'materials', label: 'Use of the piece', detail: `${period === 'weekend' ? 'Weekend' : period === 'week' ? 'One week' : 'One month'} · retail value ${Math.round(p.price[currency]).toLocaleString('en-CA')}`, amount: fee - used })
  return lines
}

interface Props {
  product: Product
  index: string
  metal?: Metal
  personalization?: Personalization
  period: RentalPeriodId
}

export default function PriceBreakdown({ product, index, metal, personalization, period }: Props) {
  const { currency } = useStore()
  const [province, setProvince] = useState('QC')
  const [state, setState] = useState(US_STATES[0])
  const [visible, setVisible] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const rental = !!product.rental

  const { lines, price, metalWeight, labourHours } = useMemo(() => {
    if (rental) {
      const l = rentalLines(product, period, currency)
      return { lines: l, price: l.reduce((s, x) => s + x.amount, 0), metalWeight: 0, labourHours: 0 }
    }
    return buildCostBreakdown(product, currency, metal, personalization)
  }, [product, currency, metal, personalization, period, rental])

  // Animate the composition bar the first time it scrolls into view.
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const totals = GROUPS.map((g) => ({ ...g, amount: lines.filter((l) => l.group === g.id).reduce((s, l) => s + l.amount, 0) })).filter((g) => g.amount > 0)
  const isCA = currency === 'CAD'
  const taxes = isCA ? splitTaxes(PROVINCES[province].label, price) : []
  const taxTotal = taxes.reduce((s, t) => s + t.amount, 0)
  const deposit = product.rental?.deposit[currency] ?? 0
  const grand = price + taxTotal
  const pct = (n: number) => `${((n / price) * 100).toFixed(n / price < 0.1 ? 1 : 0)}%`

  const select = 'font-spec cursor-pointer border-b border-[var(--border-hairline)] bg-transparent py-1 text-xs outline-none focus:border-[var(--text-espresso)]'

  return (
    <section id="price-breakdown" className="scroll-mt-32 border-t border-[var(--border-hairline)]">
      <div className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
        <SectionHeader
          index={index}
          eyebrow="Transparent pricing"
          title={<>The price, <em className="text-[var(--gold-vermeil)]">itemised</em></>}
          aside={
            <p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">
              {rental
                ? 'What your rental fee covers, the refundable deposit, and tax — before you reserve.'
                : 'Every gram, every stone and every bench hour behind this piece, with our margin shown openly.'}
            </p>
          }
        />

        <div className="grid gap-16 lg:grid-cols-12">
          {/* Composition */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-36">
              <p className="text-[11px] uppercase tracking-[0.22em]">Composition</p>
              <p className="font-serif-editorial mt-3 text-6xl font-light leading-none"><Price amount={price} className="[&_span]:text-xl" /></p>
              <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-linen)]">
                {rental ? `${period} rental fee · before tax` : `${metal ? METALS[metal].label : ''} · before tax`}
              </p>

              <div ref={bar} className="mt-8 flex h-3 w-full overflow-hidden bg-[var(--bg-silk)]" role="img" aria-label="Price composition">
                {totals.map((g, i) => (
                  <span
                    key={g.id}
                    className="h-full transition-[width] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: visible ? `${(g.amount / price) * 100}%` : '0%', background: g.color, transitionDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
              <ul className="mt-6 space-y-3">
                {totals.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5" style={{ background: g.color }} />
                      {g.label}
                    </span>
                    <span className="flex items-baseline gap-4">
                      <span className="font-spec text-[10px] text-[var(--text-linen)]">{pct(g.amount)}</span>
                      <Price amount={g.amount} className="text-xs [&_span]:hidden" />
                    </span>
                  </li>
                ))}
              </ul>

              {!rental && (
                <dl className="mt-10 grid grid-cols-2 gap-px bg-[var(--border-hairline)] text-center">
                  <div className="bg-[var(--bg-travertine)] py-5">
                    <dd className="font-serif-editorial text-3xl">{metalWeight.toFixed(1)} g</dd>
                    <dt className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-linen)]">Metal weight</dt>
                  </div>
                  <div className="bg-[var(--bg-travertine)] py-5">
                    <dd className="font-serif-editorial text-3xl">{labourHours} h</dd>
                    <dt className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-linen)]">At the bench</dt>
                  </div>
                </dl>
              )}
            </div>
          </aside>

          {/* Itemised statement */}
          <div className="lg:col-span-7 lg:col-start-6">
            <div className="border border-[var(--border-hairline)]">
              {GROUPS.map((g) => {
                const rows = lines.filter((l) => l.group === g.id)
                if (rows.length === 0) return null
                const sub = rows.reduce((s, l) => s + l.amount, 0)
                return (
                  <div key={g.id} className="border-b border-[var(--border-hairline)] last:border-b-0">
                    <div className="flex items-center justify-between bg-[var(--bg-silk)]/60 px-6 py-3">
                      <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em]">
                        <span className="h-2 w-2" style={{ background: g.color }} />
                        {rental && g.id === 'materials' ? 'The piece' : g.label}
                      </p>
                      <Price amount={sub} className="text-xs [&_span]:hidden" />
                    </div>
                    <ul className="divide-y divide-[var(--border-hairline)]">
                      {rows.map((l) => (
                        <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 px-6 py-4">
                          <span className="text-sm">{l.label}</span>
                          <span className="text-right text-sm">
                            {l.included ? <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--gold-vermeil)]">Included</span> : <Price amount={l.amount} className="[&_span]:hidden" />}
                          </span>
                          {l.detail && <span className="font-spec col-span-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-linen)]">{l.detail}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              {/* Subtotal */}
              <div className="flex items-baseline justify-between border-t border-[var(--text-espresso)] px-6 py-5">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em]">{rental ? 'Rental fee' : 'Price before tax'}</span>
                <Price amount={price} className="text-base" />
              </div>

              {/* Taxes & duties */}
              <div className="border-t border-[var(--border-hairline)]">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-silk)]/60 px-6 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em]">Taxes & duties</p>
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">
                    {isCA ? 'Province' : 'State'}
                    {isCA ? (
                      <select value={province} onChange={(e) => setProvince(e.target.value)} className={select}>
                        {Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                    ) : (
                      <select value={state} onChange={(e) => setState(e.target.value)} className={select}>
                        {US_STATES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </label>
                </div>
                <ul className="divide-y divide-[var(--border-hairline)]">
                  {isCA ? (
                    taxes.map((t) => (
                      <li key={t.name} className="flex items-baseline justify-between px-6 py-4 text-sm">
                        <span>
                          {t.name}
                          <span className="font-spec ml-3 text-[10px] text-[var(--text-linen)]">{(t.rate * 100).toFixed(t.rate * 100 % 1 ? 3 : 0).replace(/0+$/, '').replace(/\.$/, '')}% of <Price amount={price} className="[&_span]:hidden" /></span>
                        </span>
                        <Price amount={t.amount} className="[&_span]:hidden" />
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-baseline justify-between gap-6 px-6 py-4 text-sm">
                        <span>
                          Sales tax · {state}
                          <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-linen)]">Calculated at checkout from your ZIP code</span>
                        </span>
                        <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">At checkout</span>
                      </li>
                      <li className="flex items-baseline justify-between gap-6 px-6 py-4 text-sm">
                        <span>
                          Import duties & customs fees
                          <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-linen)]">CUSMA-qualifying, cleared by Teresa & Sons</span>
                        </span>
                        <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--gold-vermeil)]">Prepaid</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Total */}
              <div className="flex items-baseline justify-between bg-[var(--text-espresso)] px-6 py-6 text-[var(--bg-travertine)]">
                <span className="text-[11px] font-medium uppercase tracking-[0.24em]">{isCA ? 'Total, tax included' : 'Total before sales tax'}</span>
                <Price amount={grand} className="text-2xl [&_span]:text-white/50" />
              </div>

              {rental && (
                <div className="flex items-baseline justify-between gap-6 px-6 py-5 text-sm">
                  <span>
                    Refundable security deposit
                    <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-linen)]">Card pre-authorisation · released within 48 h of return</span>
                  </span>
                  <Price amount={deposit} className="[&_span]:hidden" />
                </div>
              )}
            </div>

            <p className="mt-6 flex gap-3 text-xs leading-relaxed text-[var(--text-taupe)]">
              <Info size={14} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
              {rental
                ? 'Tax applies to the rental fee only. The deposit is a hold, not a charge.'
                : 'Metal values use indicative daily rates per gram for the chosen alloy. Stone values reflect our cost for this grade. Figures are rounded and reconcile exactly to the price shown.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
