import { useMemo } from 'react'
import { History, X } from 'lucide-react'
import { getProduct, priceFor, type Product } from '../data/catalog'
import { href, useStore } from '../store'
import ProductCard from './ProductCard'
import Price from './Price'
import SectionHeader from './home/SectionHeader'

function useRecentProducts(exclude?: string, limit = 4) {
  const { recent } = useStore()
  return useMemo(
    () => recent.filter((s) => s !== exclude).map(getProduct).filter((p): p is Product => !!p).slice(0, limit),
    [recent, exclude, limit],
  )
}

interface Props {
  index?: string
  exclude?: string
  limit?: number
  eyebrow?: string
  title?: React.ReactNode
  bordered?: boolean
}

/** Full section: editorial header plus product cards. Renders nothing when history is empty. */
export default function RecentlyViewed({
  index = '—',
  exclude,
  limit = 4,
  eyebrow = 'Your journey',
  title = <>Recently <em className="text-[var(--gold-vermeil)]">viewed</em></>,
  bordered = true,
}: Props) {
  const { clearRecent } = useStore()
  const items = useRecentProducts(exclude, limit)
  if (items.length === 0) return null
  return (
    <section className={`mx-auto max-w-[1600px] px-6 py-28 lg:px-12 ${bordered ? 'border-t border-[var(--border-hairline)]' : ''}`}>
      <SectionHeader index={index} eyebrow={eyebrow} title={title} aside={<button onClick={clearRecent} className="link-line text-[var(--text-taupe)]">Clear history</button>} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

/** Compact list for drawers, empty states and dashboards. */
export function RecentlyViewedStrip({ exclude, limit = 3, onNavigate, title = 'Recently viewed' }: { exclude?: string; limit?: number; onNavigate?: () => void; title?: string }) {
  const { currency, clearRecent } = useStore()
  const items = useRecentProducts(exclude, limit)
  if (items.length === 0) return null
  return (
    <div className="text-left">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
          <History size={14} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {title}
        </p>
        <button onClick={clearRecent} aria-label="Clear recently viewed" className="text-[var(--text-linen)] hover:text-[var(--text-espresso)]">
          <X size={14} strokeWidth={1.3} />
        </button>
      </div>
      <ul className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
        {items.map((p) => (
          <li key={p.id}>
            <a href={href.product(p.slug)} onClick={onNavigate} className="group flex items-center gap-4 py-3">
              <div className="h-16 w-13 shrink-0 overflow-hidden bg-[var(--bg-silk)]">
                <img src={p.images[0]} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif-editorial truncate text-lg leading-tight group-hover:text-[var(--gold-vermeil)]">{p.name}</p>
                <p className="font-mono-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-linen)]">{p.collection}</p>
              </div>
              <Price amount={p.rental ? p.rental.weekend[currency] : priceFor(p, currency)} className="shrink-0 text-xs" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
