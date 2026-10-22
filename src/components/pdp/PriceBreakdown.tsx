import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { type Metal, type Personalization, type Product, type RentalPeriodId } from '../../data/catalog'
import { buildCostBreakdown, splitTaxes, type CostGroup, type CostLine } from '../../data/costing'
import { PROVINCES, US_STATES, provinceName, stateName, taxName } from '../../data/tax'
import { bilingual, formatNumber, pick, useCopy, useLocale, type Locale } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import Price from '../Price'
import SectionHeader from '../home/SectionHeader'

const GROUPS: { id: CostGroup; color: string }[] = [
  { id: 'materials', color: 'var(--text-espresso)' },
  { id: 'making', color: 'var(--gold-vermeil)' },
  { id: 'services', color: 'var(--gold-champagne)' },
  { id: 'options', color: '#8a6a32' },
  { id: 'margin', color: 'var(--text-linen)' },
]

const COPY = bilingual(
  {
    groups: { materials: 'Materials', making: 'Making charges', services: 'Certification & services', options: 'Selected options', margin: 'Maison margin' } as Record<CostGroup, string>,
    rental: [
      ['Full insurance cover', 'Loss, theft & damage for the rental period'],
      ['Cleaning & re-certification', 'Ultrasonic clean, claw check, gemmologist sign-off'],
      ['Bonded courier, both ways', 'Or in-salon fitting'],
    ] as [string, string][],
    use: 'Use of the piece',
    retail: (period: string, value: string) => `${period} · retail value ${value}`,
    eyebrow: 'Transparent pricing',
    title: 'The price, <em>itemized</em>',
    asideRental: 'What your rental fee covers, the refundable deposit, and tax — before you reserve.',
    asidePiece: 'Every gram, every stone and every bench hour behind this piece, with our margin shown openly.',
    composition: 'Composition',
    feeBeforeTax: (period: string) => `${period} rental fee · before tax`,
    beforeTax: (metal: string) => `${metal} · before tax`,
    compositionLabel: 'Price composition',
    metalWeight: 'Metal weight',
    atBench: 'At the bench',
    thePiece: 'The piece',
    included: 'Included',
    rentalFee: 'Rental fee',
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
    deposit: 'Refundable security deposit',
    hold: 'Card pre-authorization · released within 48 h of return',
    noteRental: 'Tax applies to the rental fee only. The deposit is a hold, not a charge.',
    showLines: (n: number) => `Show every line (${n})`,
    hideLines: 'Hide the lines',
    notePiece: 'Metal values use indicative daily rates per gram for the chosen alloy. Stone values reflect our cost for this grade. Figures are rounded and reconcile exactly to the price shown.',
  },
  {
    groups: { materials: 'Matières', making: 'Façon', services: 'Certification et services', options: 'Options choisies', margin: 'Marge de la maison' },
    rental: [
      ['Assurance complète', 'Perte, vol et dommages pendant la location'],
      ['Nettoyage et recertification', 'Nettoyage aux ultrasons, vérification des griffes, visa du gemmologue'],
      ['Messager cautionné, aller-retour', 'Ou essayage au salon'],
    ],
    use: 'Usage de la pièce',
    retail: (period, value) => `${period} · valeur au détail ${value}`,
    eyebrow: 'Prix transparents',
    title: 'Le prix, <em>détaillé</em>',
    asideRental: 'Ce que couvrent vos frais de location, le dépôt remboursable et les taxes — avant de réserver.',
    asidePiece: 'Chaque gramme, chaque pierre et chaque heure d’établi derrière cette pièce, avec notre marge affichée en toute transparence.',
    composition: 'Composition',
    feeBeforeTax: (period) => `Frais de location (${period.toLowerCase()}) · avant taxes`,
    beforeTax: (metal) => `${metal} · avant taxes`,
    compositionLabel: 'Composition du prix',
    metalWeight: 'Poids du métal',
    atBench: 'À l’établi',
    thePiece: 'La pièce',
    included: 'Inclus',
    rentalFee: 'Frais de location',
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
    deposit: 'Dépôt de garantie remboursable',
    hold: 'Préautorisation sur carte · libérée dans les 48 h suivant le retour',
    noteRental: 'Les taxes s’appliquent aux frais de location seulement. Le dépôt est une retenue, pas un paiement.',
    showLines: (n) => `Voir chaque ligne (${n})`,
    hideLines: 'Masquer le détail',
    notePiece: 'La valeur du métal repose sur un cours indicatif du jour, au gramme, pour l’alliage choisi. La valeur des pierres reflète notre coût pour cette qualité. Les montants sont arrondis et concordent exactement avec le prix affiché.',
  },
)

// Rental fees, split by what they actually pay for.
function rentalLines(p: Product, period: RentalPeriodId, currency: 'CAD' | 'USD', locale: Locale): CostLine[] {
  const t = pick(COPY, locale)
  const fee = p.rental![period][currency]
  const parts: [string, number][] = [['insure', 0.22], ['clean', 0.08], ['courier', 0.12]]
  const lines: CostLine[] = parts.map(([id, k], i) => ({ id, group: 'services', label: t.rental[i][0], detail: t.rental[i][1], amount: Math.round(fee * k) }))
  const used = lines.reduce((s, l) => s + l.amount, 0)
  lines.unshift({ id: 'wear', group: 'materials', label: t.use, detail: t.retail(pick(COMMON, locale).periods[period], formatNumber(Math.round(p.price[currency]), undefined, locale)), amount: fee - used })
  return lines
}

interface Props {
  product: Product
  index: string
  metal?: Metal
  personalization?: Personalization
  period: RentalPeriodId
  /** Renting rather than buying: the fee's breakdown instead of the piece's. */
  rent: boolean
  /** The itemized statement shows in full; otherwise only its totals, one tap from the rest. */
  open: boolean
  onToggle: () => void
}

export default function PriceBreakdown({ product, index, metal, personalization, period, rent, open, onToggle }: Props) {
  const { currency } = useStore()
  const { locale } = useLocale()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const [province, setProvince] = useState('QC')
  const [state, setState] = useState(US_STATES[0])
  const [visible, setVisible] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const rental = rent && !!product.rental

  const { lines, price, metalWeight, labourHours } = useMemo(() => {
    if (rental) {
      const l = rentalLines(product, period, currency, locale)
      return { lines: l, price: l.reduce((s, x) => s + x.amount, 0), metalWeight: 0, labourHours: 0 }
    }
    return buildCostBreakdown(product, currency, metal, personalization, locale)
  }, [product, currency, metal, personalization, period, rental, locale])

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
  const taxes = isCA ? splitTaxes(PROVINCES[province], price) : []
  const taxTotal = taxes.reduce((s, t) => s + t.amount, 0)
  const deposit = product.rental?.deposit[currency] ?? 0
  const grand = price + taxTotal
  const pct = (n: number) => formatNumber(n / price, { style: 'percent', maximumFractionDigits: n / price < 0.1 ? 1 : 0 })

  const select = 'font-spec cursor-pointer border-b border-[var(--border-hairline)] bg-transparent py-1 text-xs outline-none focus:border-[var(--text-espresso)]'

  return (
    <section id="price-breakdown" className="scroll-mt-32 border-t border-[var(--border-hairline)]">
      <div className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
        <SectionHeader
          index={index}
          eyebrow={t.eyebrow}
          title={rich(t.title, 'text-[var(--gold-vermeil)]')}
          aside={<p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">{rental ? t.asideRental : t.asidePiece}</p>}
        />

        <div className="grid gap-16 lg:grid-cols-12">
          {/* Composition */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-36">
              <p className="text-[11px] uppercase tracking-[0.22em]">{t.composition}</p>
              <p className="font-serif-editorial mt-3 text-6xl font-light leading-none"><Price amount={price} className="[&_span]:text-xl" /></p>
              <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">
                {rental ? t.feeBeforeTax(common.periods[period]) : t.beforeTax(metal ? catalog.metal(metal) : '')}
              </p>

              <div ref={bar} className="mt-8 flex h-3 w-full overflow-hidden bg-[var(--bg-silk)]" role="img" aria-label={t.compositionLabel}>
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
                      {t.groups[g.id]}
                    </span>
                    <span className="flex items-baseline gap-4">
                      <span className="font-spec text-[10px] text-[var(--text-taupe)]">{pct(g.amount)}</span>
                      <Price amount={g.amount} className="text-xs [&_span]:hidden" />
                    </span>
                  </li>
                ))}
              </ul>

              {!rental && (
                <dl className="mt-10 grid grid-cols-2 gap-px bg-[var(--border-hairline)] text-center">
                  <div className="bg-[var(--bg-travertine)] py-5">
                    <dd className="font-serif-editorial text-3xl">{formatNumber(metalWeight, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} g</dd>
                    <dt className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.metalWeight}</dt>
                  </div>
                  <div className="bg-[var(--bg-travertine)] py-5">
                    <dd className="font-serif-editorial text-3xl">{labourHours} h</dd>
                    <dt className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.atBench}</dt>
                  </div>
                </dl>
              )}
            </div>
          </aside>

          {/* Itemised statement */}
          <div className="lg:col-span-7 lg:col-start-6">
            <div className="border border-[var(--border-hairline)]">
              {open && GROUPS.map((g) => {
                const rows = lines.filter((l) => l.group === g.id)
                if (rows.length === 0) return null
                const sub = rows.reduce((s, l) => s + l.amount, 0)
                return (
                  <div key={g.id} className="border-b border-[var(--border-hairline)] last:border-b-0">
                    <div className="flex items-center justify-between bg-[var(--bg-silk)]/60 px-6 py-3">
                      <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em]">
                        <span className="h-2 w-2" style={{ background: g.color }} />
                        {rental && g.id === 'materials' ? t.thePiece : t.groups[g.id]}
                      </p>
                      <Price amount={sub} className="text-xs [&_span]:hidden" />
                    </div>
                    <ul className="divide-y divide-[var(--border-hairline)]">
                      {rows.map((l) => (
                        <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 px-6 py-4">
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

              {/* The statement opens on demand: its lines, then the taxes */}
              <button type="button" onClick={onToggle} aria-expanded={open} className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] transition-colors hover:bg-[var(--bg-silk)]/60 ${open ? 'border-t border-[var(--border-hairline)]' : ''}`}>
                <span>{open ? t.hideLines : t.showLines(lines.length)}</span>
                <span aria-hidden className={`font-spec text-base leading-none transition-transform duration-500 ${open ? 'rotate-45' : ''}`}>+</span>
              </button>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between border-t border-[var(--text-espresso)] px-6 py-5">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em]">{rental ? t.rentalFee : t.priceBeforeTax}</span>
                <Price amount={price} className="text-base" />
              </div>

              {/* Taxes & duties */}
              <div className={`border-t border-[var(--border-hairline)] ${open ? '' : 'hidden'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-silk)]/60 px-6 py-3">
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
                      <li key={x.name} className="flex items-baseline justify-between px-6 py-4 text-sm">
                        <span>
                          {taxName(x.name)}
                          <span className="font-spec ml-3 text-[10px] text-[var(--text-taupe)]">{t.rateOf(formatNumber(x.rate, { style: 'percent', maximumFractionDigits: 3 }))} <Price amount={price} className="[&_span]:hidden" /></span>
                        </span>
                        <Price amount={x.amount} className="[&_span]:hidden" />
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-baseline justify-between gap-6 px-6 py-4 text-sm">
                        <span>
                          {t.salesTax(stateName(state))}
                          <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{t.zip}</span>
                        </span>
                        <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{t.atCheckout}</span>
                      </li>
                      <li className="flex items-baseline justify-between gap-6 px-6 py-4 text-sm">
                        <span>
                          {t.duties}
                          <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{t.cusma}</span>
                        </span>
                        <span className="font-spec text-[10px] uppercase tracking-[0.18em] text-[var(--gold-ink)]">{t.prepaid}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Total */}
              <div className="flex items-baseline justify-between bg-[var(--text-espresso)] px-6 py-6 text-[var(--bg-travertine)]">
                <span className="text-[11px] font-medium uppercase tracking-[0.24em]">{isCA ? t.totalTaxIn : t.totalBeforeSales}</span>
                <Price amount={grand} className="text-2xl [&_span]:text-white/50" />
              </div>

              {rental && (
                <div className="flex items-baseline justify-between gap-6 px-6 py-5 text-sm">
                  <span>
                    {t.deposit}
                    <span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--text-taupe)]">{t.hold}</span>
                  </span>
                  <Price amount={deposit} className="[&_span]:hidden" />
                </div>
              )}
            </div>

            <p className="mt-6 flex gap-3 text-xs leading-relaxed text-[var(--text-taupe)]">
              <Info size={14} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
              {rental ? t.noteRental : t.notePiece}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
