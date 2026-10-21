import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PRODUCTS, priceFor, quickAddable, rentFirst, type Metal, type Product, type RentalBooking } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { isBookingValid } from './RentalCalendar'
import { href, useStore } from '../../store'
import Price from '../Price'
import SectionHeader from '../home/SectionHeader'

export type RentalPeriod = 'weekend' | 'week' | 'month'

const PERIODS: RentalPeriod[] = ['weekend', 'week', 'month']

const COPY = bilingual(
  {
    period: { weekend: 'Weekend', week: '1 Week', month: '1 Month' } as Record<RentalPeriod, string>,
    per: { weekend: '/ weekend', week: '/ week', month: '/ month' } as Record<RentalPeriod, string>,
    busy: (name: string) => `${name} is reserved on these dates. Try another start date, or reserve pieces individually.`,
    eyebrowRental: 'Styled for the evening',
    eyebrowPiece: 'Styled by the atelier',
    titleRental: 'Complete the <em>ensemble</em>',
    titlePiece: 'Complete the <em>look</em>',
    rentalPeriod: 'Rental period',
    ensemble: (period: string) => `The ensemble · ${period}`,
    set: (n: number) => `The set · ${n} pieces`,
    deposit: 'Refundable deposit',
    together: 'One fitting, one insured delivery, collected together.',
    matched: 'Matched in metal and proportion, presented together in one travertine box.',
    reserve: 'Reserve the ensemble',
    addSet: 'Add the set to bag',
    usesDates: 'Uses the dates and delivery you selected above.',
    chooseDates: 'Choose your dates above to reserve the ensemble.',
  },
  {
    period: { weekend: 'Fin de semaine', week: '1 semaine', month: '1 mois' },
    per: { weekend: '/ fin de semaine', week: '/ semaine', month: '/ mois' },
    busy: (name) => `${name} est réservée à ces dates. Essayez une autre date de début, ou réservez les pièces une à une.`,
    eyebrowRental: 'Pour la soirée',
    eyebrowPiece: 'Agencé par l’atelier',
    titleRental: 'Complétez la <em>parure</em>',
    titlePiece: 'Complétez l’<em>ensemble</em>',
    rentalPeriod: 'Période de location',
    ensemble: (period) => `La parure · ${period}`,
    set: (n) => `L’ensemble · ${n} pièces`,
    deposit: 'Dépôt remboursable',
    together: 'Un essayage, une livraison assurée, une reprise commune.',
    matched: 'Assortis en métal et en proportions, présentés ensemble dans un seul écrin travertin.',
    reserve: 'Réserver la parure',
    addSet: 'Ajouter l’ensemble au panier',
    usesDates: 'Utilise les dates et la livraison choisies plus haut.',
    chooseDates: 'Choisissez vos dates plus haut pour réserver la parure.',
  },
)

// Categories that pair naturally with each other.
const PAIRS: Record<string, string[]> = {
  necklaces: ['earrings', 'bracelets'],
  earrings: ['necklaces', 'rings'],
  bracelets: ['rings', 'earrings'],
  rings: ['bracelets', 'earrings'],
  bridal: ['earrings', 'necklaces'],
  watches: ['bracelets', 'rings'],
  gifts: ['earrings', 'necklaces'],
  custom: ['bridal', 'earrings'],
}

const inChapter = (p: Product, of: Product) => p.category === of.category || !!p.alsoIn?.includes(of.category)

/** Pieces that complete the look. Renting, they are other rentable pieces, from other chapters first, so the set can be
 *  reserved as one; buying, they are pieces that can join the bag as they are, in a matching metal. */
export function getLookPieces(product: Product, rent = rentFirst(product)): Product[] {
  if (rent) {
    return PRODUCTS.filter((p) => p.rental && p.slug !== product.slug && p.type !== product.type)
      .sort((a, b) => Number(inChapter(a, product)) - Number(inChapter(b, product)))
      .slice(0, 2)
  }
  const cats = PAIRS[product.category] ?? []
  return cats
    .map((c) => PRODUCTS.find((p) => p.category === c && quickAddable(p) && p.metals.some((m) => product.metals.includes(m))))
    .filter((p): p is Product => !!p)
}

interface Props {
  product: Product
  index: string
  /** Renting rather than buying. */
  rent: boolean
  /** The metal chosen above: the set follows it where each piece offers it. */
  metal?: Metal
  period: RentalPeriod
  onPeriodChange: (p: RentalPeriod) => void
  booking?: Partial<RentalBooking>
  /** Adds the piece on this page as configured above; false (and the page shows the missing choice) when it can't. */
  onAddMain: () => boolean
  /** Called when the ensemble cannot be reserved until dates are chosen. */
  onNeedBooking?: () => void
}

export default function CompleteTheLook({ product, index, rent, metal, period, onPeriodChange, booking, onAddMain, onNeedBooking }: Props) {
  const { currency, addToCart } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [conflict, setConflict] = useState<Product | null>(null)
  const pieces = getLookPieces(product, rent)
  if (pieces.length === 0) return null

  const isRental = rent
  const look = [product, ...pieces]
  const metalFor = (p: Product) => (metal && p.metals.includes(metal) ? metal : p.metals[0])
  const priceOf = (p: Product) => (isRental && p.rental ? p.rental[period][currency] : priceFor(p, currency, metalFor(p)))
  const total = look.reduce((s, p) => s + priceOf(p), 0)
  const deposit = isRental ? look.reduce((s, p) => s + (p.rental?.deposit[currency] ?? 0), 0) : 0

  const addSet = () => {
    if (!isRental) {
      // The piece on this page goes in as configured (size, engraving…); the others in the matching metal.
      if (!onAddMain()) return
      pieces.forEach((p) => addToCart({ slug: p.slug, metal: metalFor(p) }))
      return
    }
    // The whole ensemble shares one booking, so every piece must be free on those dates.
    if (!booking || !isBookingValid(product.slug, period, booking)) {
      setConflict(null)
      onNeedBooking?.()
      return
    }
    const busy = look.find((p) => !isBookingValid(p.slug, period, booking))
    if (busy) {
      setConflict(busy)
      return
    }
    setConflict(null)
    look.forEach((p) => addToCart({ slug: p.slug, rental: period, booking: booking as RentalBooking }))
  }

  return (
    <section className="bg-[var(--bg-silk)]">
      <div className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
        <SectionHeader
          index={index}
          eyebrow={isRental ? t.eyebrowRental : t.eyebrowPiece}
          title={rich(isRental ? t.titleRental : t.titlePiece, 'text-[var(--gold-vermeil)]')}
        />
        {/* grid-cols-1 bounds the phone column; an auto track would stretch to the cards' unwrapped names and push the page sideways. */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex items-center gap-3 lg:col-span-8">
            {look.map((p, i) => (
              <div key={p.id} className="contents">
                {i > 0 && <Plus size={18} strokeWidth={1.2} className="shrink-0 text-[var(--gold-vermeil)]" />}
                <a href={href.product(p.slug, isRental)} data-reveal={i * 0.08} className="group block min-w-0 flex-1">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-travertine)]">
                    <img src={p.images[0]} alt={catalog.name(p)} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                  </div>
                  <p className="font-serif-editorial mt-4 truncate text-lg lg:text-xl">{catalog.name(p)}</p>
                  <p className="text-xs text-[var(--text-taupe)]">
                    <Price amount={priceOf(p)} />
                    {isRental && <span className="ml-1">{t.per[period]}</span>}
                  </p>
                </a>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border-hairline)] pt-8 lg:col-span-3 lg:col-start-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0" data-reveal="0.2">
            {isRental && (
              <div className="mb-8 grid grid-cols-3 border border-[var(--border-hairline)]" role="group" aria-label={t.rentalPeriod}>
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => onPeriodChange(p)}
                    aria-pressed={period === p}
                    className={`px-1 py-2.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${period === p ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'hover:bg-[var(--bg-travertine)]'}`}
                  >
                    {t.period[p]}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] uppercase tracking-[0.22em]">
              {isRental ? t.ensemble(t.period[period]) : t.set(look.length)}
            </p>
            <Price amount={total} className="mt-3 block text-3xl" />
            {isRental ? (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">
                {t.deposit} <Price amount={deposit} className="text-[var(--text-espresso)]" />. {t.together}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">{t.matched}</p>
            )}
            <button
              onClick={addSet}
              className="mt-8 w-full bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]"
            >
              {isRental ? t.reserve : t.addSet}
            </button>
            {isRental && (
              <p role={conflict ? 'alert' : undefined} className={`mt-3 text-xs ${conflict ? 'text-red-700' : 'text-[var(--text-taupe)]'}`}>
                {conflict ? t.busy(catalog.name(conflict)) : booking?.start ? t.usesDates : t.chooseDates}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
