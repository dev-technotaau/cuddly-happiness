import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { splitTaxes, type CostGroup } from '../../data/costing'
import type { RingStatement } from '../../data/ringPrice'
import { PROVINCES, US_STATES, provinceName, stateName, taxName } from '../../data/tax'
import { bilingual, formatNumber, useCopy } from '../../i18n'
import { useStore } from '../../store'
import Price from '../Price'

const GROUPS: { id: CostGroup; color: string }[] = [
  { id: 'materials', color: 'var(--text-espresso)' },
  { id: 'making', color: 'var(--gold-vermeil)' },
  { id: 'services', color: 'var(--gold-champagne)' },
  { id: 'margin', color: 'var(--text-linen)' },
]

const COPY = bilingual(
  {
    groups: { materials: 'Materials', making: 'Making charges', services: 'Certification & services', options: 'Selected options', margin: 'Maison margin' } as Record<CostGroup, string>,
    compositionLabel: 'What the price is made of',
    metalWeight: 'Metal weight',
    atBench: 'At the bench',
    stones: 'Stones set',
    included: 'Included',
    showLines: (n: number) => `Show every line (${n})`,
    hideLines: 'Hide the lines',
    priceBeforeTax: 'Price before tax',
    taxes: 'Taxes & duties',
    province: 'Province',
    state: 'State',
    rateOf: (rate: string) => `${rate} of`,
    salesTax: (state: string) => `Sales tax · ${state}`,
    zip: 'Calculated at checkout from your ZIP code',
    atCheckout: 'At checkout',
    duties: 'Import duties & customs fees',
    cusma: 'CUSMA-qualifying, cleared by Teresa & Sons',
    prepaid: 'Prepaid',
    totalTaxIn: 'Total, tax included',
    totalBeforeSales: 'Total before sales tax',
    note: 'Every line follows your choices as you make them. Metal uses indicative daily rates per gram; stones, our cost for their grade. Figures are rounded and reconcile exactly to the price.',
  },
  {
    groups: { materials: 'Matières', making: 'Façon', services: 'Certification et services', options: 'Options choisies', margin: 'Marge de la maison' },
    compositionLabel: 'Ce qui compose le prix',
    metalWeight: 'Poids du métal',
    atBench: 'À l’établi',
    stones: 'Pierres serties',
    included: 'Inclus',
    showLines: (n) => `Voir chaque ligne (${n})`,
    hideLines: 'Masquer le détail',
    priceBeforeTax: 'Prix avant taxes',
    taxes: 'Taxes et droits',
    province: 'Province',
    state: 'État',
    rateOf: (rate) => `${rate} de`,
    salesTax: (state) => `Taxe de vente · ${state}`,
    zip: 'Calculée au paiement selon votre code ZIP',
    atCheckout: 'Au paiement',
    duties: 'Droits d’importation et frais de douane',
    cusma: 'Admissible à l’ACEUM, dédouané par Teresa & Sons',
    prepaid: 'Prépayés',
    totalTaxIn: 'Total, taxes incluses',
    totalBeforeSales: 'Total avant taxe de vente',
    note: 'Chaque ligne suit vos choix à mesure que vous les faites. Le métal repose sur un cours indicatif du jour, au gramme; les pierres, sur notre coût pour leur qualité. Les montants sont arrondis et concordent exactement avec le prix.',
  },
)

interface Props {
  statement: RingStatement
  /** Stones set, for the figures under the bar. */
  stones: number
  /** The itemised lines show in full; otherwise only the composition and the totals. */
  open: boolean
  onToggle: () => void
}

/** A designed ring's price, line by line, as it is built: the composition bar moves with each choice, and the lines
 *  that changed light up for a moment. Taxes follow the market, as on a piece's page. */
export default function RingBreakdown({ statement, stones, open, onToggle }: Props) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const [province, setProvince] = useState('QC')
  const [state, setState] = useState(US_STATES[0])
  const { lines, price, metalWeight, labourHours } = statement

  // The lines whose amount just changed, lit for a moment.
  const before = useRef<Map<string, number> | null>(null)
  const [lit, setLit] = useState<Set<string>>(new Set())
  useEffect(() => {
    const now = new Map(lines.map((l) => [l.id, l.amount]))
    const prev = before.current
    before.current = now
    if (!prev) return
    const changed = new Set(lines.filter((l) => prev.get(l.id) !== l.amount).map((l) => l.id))
    if (!changed.size) return
    setLit(changed)
    const id = window.setTimeout(() => setLit(new Set()), 1600)
    return () => window.clearTimeout(id)
  }, [lines])

  const totals = GROUPS.map((g) => ({ ...g, amount: lines.filter((l) => l.group === g.id).reduce((s, l) => s + l.amount, 0) })).filter((g) => g.amount > 0)
  const isCA = currency === 'CAD'
  const taxes = isCA ? splitTaxes(PROVINCES[province], price) : []
  const grand = price + taxes.reduce((s, x) => s + x.amount, 0)
  const pct = (n: number) => formatNumber(n / price, { style: 'percent', maximumFractionDigits: n / price < 0.1 ? 1 : 0 })
  const select = 'font-spec cursor-pointer border-b border-[var(--border-hairline)] bg-transparent py-1 text-xs outline-none focus:border-[var(--text-espresso)]'

  return (
    <div>
      {/* Composition */}
      <div className="flex h-2.5 w-full overflow-hidden bg-[var(--bg-silk)]" role="img" aria-label={t.compositionLabel}>
        {totals.map((g) => (
          <span key={g.id} className="h-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ width: `${(g.amount / price) * 100}%`, background: g.color }} />
        ))}
      </div>
      <ul className="mt-5 space-y-2.5">
        {totals.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-3">
              <span className="h-2 w-2" style={{ background: g.color }} />
              {t.groups[g.id]}
            </span>
            <span className="flex items-baseline gap-4">
              <span className="font-spec text-[10px] text-[var(--text-taupe)]">{pct(g.amount)}</span>
              <Price amount={g.amount} className="text-xs [&_span]:hidden" />
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 grid grid-cols-3 gap-px bg-[var(--border-hairline)] text-center">
        {([
          [t.metalWeight, `${formatNumber(metalWeight, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} g`],
          [t.atBench, `${formatNumber(labourHours, { maximumFractionDigits: 2 })} h`],
          [t.stones, formatNumber(stones)],
        ] as const).map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse bg-[var(--bg-travertine)] px-2 py-4">
            <dt className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{label}</dt>
            <dd className="font-serif-editorial text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      {/* The statement */}
      <div className="mt-6 border border-[var(--border-hairline)]">
        {open && GROUPS.map((g) => {
          const rows = lines.filter((l) => l.group === g.id)
          if (rows.length === 0) return null
          return (
            <div key={g.id} className="border-b border-[var(--border-hairline)] last:border-b-0">
              <div className="flex items-center justify-between bg-[var(--bg-silk)]/60 px-5 py-2.5">
                <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em]">
                  <span className="h-2 w-2" style={{ background: g.color }} />
                  {t.groups[g.id]}
                </p>
                <Price amount={rows.reduce((s, l) => s + l.amount, 0)} className="text-xs [&_span]:hidden" />
              </div>
              <ul className="divide-y divide-[var(--border-hairline)]">
                {rows.map((l) => (
                  <li key={l.id} className={`grid grid-cols-[1fr_auto] gap-x-5 gap-y-1 px-5 py-3.5 transition-colors duration-700 ${lit.has(l.id) ? 'bg-[var(--gold-champagne)]/25' : ''}`}>
                    <span className="text-sm">{l.label}</span>
                    <span className="text-right text-sm">
                      {l.included ? <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--gold-ink)]">{t.included}</span> : <Price amount={l.amount} className="[&_span]:hidden" />}
                    </span>
                    {l.detail && <span className="font-spec col-span-2 text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{l.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        <button type="button" onClick={onToggle} aria-expanded={open} className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[11px] uppercase tracking-[0.22em] transition-colors hover:bg-[var(--bg-silk)]/60 ${open ? 'border-t border-[var(--border-hairline)]' : ''}`}>
          <span>{open ? t.hideLines : t.showLines(lines.length)}</span>
          <span aria-hidden className={`font-spec text-base leading-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${open ? 'rotate-45' : ''}`}>+</span>
        </button>

        <div className="flex items-baseline justify-between border-t border-[var(--text-espresso)] px-5 py-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em]">{t.priceBeforeTax}</span>
          <Price amount={price} className="text-base" />
        </div>

        {open && (
          <div className="border-t border-[var(--border-hairline)]">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-silk)]/60 px-5 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em]">{t.taxes}</p>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">
                {isCA ? t.province : t.state}
                {isCA ? (
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className={select}>
                    {Object.keys(PROVINCES).map((k) => <option key={k} value={k}>{provinceName(k)}</option>)}
                  </select>
                ) : (
                  <select value={state} onChange={(e) => setState(e.target.value)} className={select}>
                    {US_STATES.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}
                  </select>
                )}
              </label>
            </div>
            <ul className="divide-y divide-[var(--border-hairline)]">
              {isCA ? (
                taxes.map((x) => (
                  <li key={x.name} className="flex items-baseline justify-between gap-4 px-5 py-3.5 text-sm">
                    <span>
                      {taxName(x.name)}
                      <span className="font-spec ml-3 text-[10px] text-[var(--text-taupe)]">{t.rateOf(formatNumber(x.rate, { style: 'percent', maximumFractionDigits: 3 }))} <Price amount={price} className="[&_span]:hidden" /></span>
                    </span>
                    <Price amount={x.amount} className="[&_span]:hidden" />
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-baseline justify-between gap-6 px-5 py-3.5 text-sm">
                    <span>
                      {t.salesTax(stateName(state))}
                      <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{t.zip}</span>
                    </span>
                    <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{t.atCheckout}</span>
                  </li>
                  <li className="flex items-baseline justify-between gap-6 px-5 py-3.5 text-sm">
                    <span>
                      {t.duties}
                      <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{t.cusma}</span>
                    </span>
                    <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--gold-ink)]">{t.prepaid}</span>
                  </li>
                </>
              )}
            </ul>
            <div className="flex items-baseline justify-between bg-[var(--text-espresso)] px-5 py-5 text-[var(--bg-travertine)]">
              <span className="text-[11px] font-medium uppercase tracking-[0.24em]">{isCA ? t.totalTaxIn : t.totalBeforeSales}</span>
              <Price amount={grand} className="text-xl [&_span]:text-white/60" />
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 flex gap-3 text-xs leading-relaxed text-[var(--text-taupe)]">
        <Info size={14} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
        {t.note}
      </p>
    </div>
  )
}
