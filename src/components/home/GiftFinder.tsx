import { useMemo, useState } from 'react'
import { PRODUCTS, priceFor, type Product } from '../../data/catalog'
import { href, useStore } from '../../store'
import ProductCard from '../ProductCard'

const BUDGETS = [
  { id: 'u1', label: 'Under $1,000', test: (n: number) => n < 1000 },
  { id: '1-5', label: '$1,000 – $5,000', test: (n: number) => n >= 1000 && n < 5000 },
  { id: '5-15', label: '$5,000 – $15,000', test: (n: number) => n >= 5000 && n < 15000 },
  { id: '15', label: '$15,000 +', test: (n: number) => n >= 15000 },
]

const OCCASIONS: { id: string; label: string; match: (p: Product) => boolean }[] = [
  { id: 'all', label: 'Any occasion', match: () => true },
  { id: 'love', label: 'Anniversary', match: (p) => ['bridal', 'necklaces', 'earrings'].includes(p.category) },
  { id: 'self', label: 'For myself', match: (p) => ['rings', 'bracelets', 'earrings'].includes(p.category) },
  { id: 'him', label: 'For him', match: (p) => ['watches', 'rings'].includes(p.category) || p.engravable === true },
  { id: 'milestone', label: 'Milestone', match: (p) => p.engravable === true },
]

export default function GiftFinder() {
  const { currency } = useStore()
  const [budget, setBudget] = useState(BUDGETS[1].id)
  const [occasion, setOccasion] = useState('all')

  const results = useMemo(() => {
    const b = BUDGETS.find((x) => x.id === budget)!
    const o = OCCASIONS.find((x) => x.id === occasion)!
    return PRODUCTS.filter((p) => p.category !== 'rentals' && p.category !== 'custom' && o.match(p) && b.test(priceFor(p, currency))).slice(0, 4)
  }, [budget, occasion, currency])

  const chip = (on: boolean) =>
    `whitespace-nowrap border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4" data-reveal>
          <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]"><span className="mr-4 text-[var(--text-linen)]">05</span>Le Trouveur de Cadeaux</p>
          <h2 className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">
            Find the <em className="text-[var(--gold-vermeil)]">perfect</em> gift.
          </h2>
          <p className="mt-6 max-w-sm text-[var(--text-taupe)]">Choose a budget and an occasion. Every gift arrives in our travertine box with a handwritten card.</p>

          <p className="mt-10 text-[11px] uppercase tracking-[0.22em]">Budget <span className="font-mono-spec text-[var(--text-linen)]">({currency})</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUDGETS.map((b) => <button key={b.id} onClick={() => setBudget(b.id)} className={chip(budget === b.id)}>{b.label}</button>)}
          </div>
          <p className="mt-8 text-[11px] uppercase tracking-[0.22em]">Occasion</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => <button key={o.id} onClick={() => setOccasion(o.id)} className={chip(occasion === o.id)}>{o.label}</button>)}
          </div>
          <a href={href.category('gifts')} className="mt-10 inline-block border-b border-[var(--text-espresso)] pb-1 text-[11px] font-medium uppercase tracking-[0.26em] hover:text-[var(--gold-vermeil)]">
            All gifts
          </a>
        </div>
        <div className="lg:col-span-8">
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12">
              {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center bg-[var(--bg-silk)] p-10 text-center">
              <p className="font-serif-editorial text-3xl italic text-[var(--text-taupe)]">Nothing in this pairing — yet.</p>
              <p className="mt-3 text-sm text-[var(--text-linen)]">Our concierge can source or commission something special.</p>
              <a href={href.atelier} className="mt-8 border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.24em]">Ask the concierge</a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
