import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PRODUCTS, priceFor, type Product, type RentalBooking } from '../../data/catalog'
import { isBookingValid } from './RentalCalendar'
import { href, useStore } from '../../store'
import Price from '../Price'
import SectionHeader from '../home/SectionHeader'

export type RentalPeriod = 'weekend' | 'week' | 'month'

const PERIOD_LABEL: Record<RentalPeriod, string> = { weekend: 'Weekend', week: '1 Week', month: '1 Month' }

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

/** Pieces that complete the look. Rentals pair only with other rentals so the set can be reserved as one. */
export function getLookPieces(product: Product): Product[] {
  if (product.rental) {
    return PRODUCTS.filter((p) => p.rental && p.slug !== product.slug).slice(0, 2)
  }
  const cats = PAIRS[product.category] ?? []
  return cats
    .map((c) => PRODUCTS.find((p) => p.category === c && p.metals.some((m) => product.metals.includes(m))))
    .filter((p): p is Product => !!p)
}

interface Props {
  product: Product
  index: string
  period: RentalPeriod
  onPeriodChange: (p: RentalPeriod) => void
  booking?: Partial<RentalBooking>
  /** Called when the ensemble cannot be reserved until dates are chosen. */
  onNeedBooking?: () => void
}

export default function CompleteTheLook({ product, index, period, onPeriodChange, booking, onNeedBooking }: Props) {
  const { currency, addToCart } = useStore()
  const [conflict, setConflict] = useState<string | null>(null)
  const pieces = getLookPieces(product)
  if (pieces.length === 0) return null

  const isRental = !!product.rental
  const look = [product, ...pieces]
  const priceOf = (p: Product) => (isRental && p.rental ? p.rental[period][currency] : priceFor(p, currency))
  const total = look.reduce((s, p) => s + priceOf(p), 0)
  const deposit = isRental ? look.reduce((s, p) => s + (p.rental?.deposit[currency] ?? 0), 0) : 0

  const addSet = () => {
    if (!isRental) {
      look.forEach((p) => addToCart({ slug: p.slug, metal: p.metals[0] }))
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
      setConflict(`${busy.name} is reserved on these dates. Try another start date, or reserve pieces individually.`)
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
          eyebrow={isRental ? 'Styled for the evening' : 'Styled by the atelier'}
          title={isRental ? <>Complete the <em className="text-[var(--gold-vermeil)]">ensemble</em></> : <>Complete the <em className="text-[var(--gold-vermeil)]">look</em></>}
        />
        {/* grid-cols-1 bounds the phone column; an auto track would stretch to the cards' unwrapped names and push the page sideways. */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex items-center gap-3 lg:col-span-8">
            {look.map((p, i) => (
              <div key={p.id} className="contents">
                {i > 0 && <Plus size={18} strokeWidth={1.2} className="shrink-0 text-[var(--gold-vermeil)]" />}
                <a href={href.product(p.slug)} data-reveal={i * 0.08} className="group block min-w-0 flex-1">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-travertine)]">
                    <img src={p.images[0]} alt={p.name} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                  </div>
                  <p className="font-serif-editorial mt-4 truncate text-lg lg:text-xl">{p.name}</p>
                  <p className="text-xs text-[var(--text-taupe)]">
                    <Price amount={priceOf(p)} />
                    {isRental && <span className="ml-1">/ {PERIOD_LABEL[period].toLowerCase()}</span>}
                  </p>
                </a>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border-hairline)] pt-8 lg:col-span-3 lg:col-start-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0" data-reveal="0.2">
            {isRental && (
              <div className="mb-8 grid grid-cols-3 border border-[var(--border-hairline)]" role="group" aria-label="Rental period">
                {(Object.keys(PERIOD_LABEL) as RentalPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onPeriodChange(p)}
                    className={`py-2.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${period === p ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'hover:bg-[var(--bg-travertine)]'}`}
                  >
                    {PERIOD_LABEL[p]}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] uppercase tracking-[0.22em]">
              {isRental ? `The ensemble · ${PERIOD_LABEL[period]}` : `The set · ${look.length} pieces`}
            </p>
            <Price amount={total} className="mt-3 block text-3xl" />
            {isRental ? (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">
                Refundable deposit <Price amount={deposit} className="text-[var(--text-espresso)]" />. One fitting, one insured delivery, collected together.
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">Matched in metal and proportion, presented together in one travertine box.</p>
            )}
            <button
              onClick={addSet}
              className="mt-8 w-full bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]"
            >
              {isRental ? 'Reserve the ensemble' : 'Add the set to bag'}
            </button>
            {isRental && (
              <p className={`mt-3 text-xs ${conflict ? 'text-red-700' : 'text-[var(--text-linen)]'}`}>
                {conflict ?? (booking?.start ? 'Uses the dates and delivery you selected above.' : 'Choose your dates above to reserve the ensemble.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
