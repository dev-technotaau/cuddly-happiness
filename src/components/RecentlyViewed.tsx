import { useMemo } from 'react'
import { History, X } from 'lucide-react'
import { getProduct, priceFor, type Product } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
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

const COPY = bilingual(
  { eyebrow: 'Your journey', title: 'Recently <em>viewed</em>', clearHistory: 'Clear history', strip: 'Recently viewed', clearStrip: 'Clear recently viewed' },
  { eyebrow: 'Votre parcours', title: 'Vus <em>récemment</em>', clearHistory: 'Effacer l’historique', strip: 'Vus récemment', clearStrip: 'Effacer les pièces vues récemment' },
)

interface Props {
  index?: string
  exclude?: string
  limit?: number
  eyebrow?: string
  title?: React.ReactNode
  bordered?: boolean
}

/** Full section: editorial header plus product cards. Renders nothing when history is empty. */
export default function RecentlyViewed({ index = '—', exclude, limit = 4, eyebrow, title, bordered = true }: Props) {
  const { clearRecent } = useStore()
  const t = useCopy(COPY)
  const items = useRecentProducts(exclude, limit)
  if (items.length === 0) return null
  return (
    <section className={`mx-auto max-w-[1600px] px-6 py-28 lg:px-12 ${bordered ? 'border-t border-[var(--border-hairline)]' : ''}`}>
      <SectionHeader index={index} eyebrow={eyebrow ?? t.eyebrow} title={title ?? rich(t.title, 'text-[var(--gold-vermeil)]')} aside={<button onClick={clearRecent} className="link-line text-[var(--text-taupe)]">{t.clearHistory}</button>} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

/** Compact list for drawers, empty states and dashboards. */
export function RecentlyViewedStrip({ exclude, limit = 3, onNavigate, title }: { exclude?: string; limit?: number; onNavigate?: () => void; title?: string }) {
  const { currency, clearRecent } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const items = useRecentProducts(exclude, limit)
  if (items.length === 0) return null
  return (
    <div className="text-left">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
          <History size={14} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {title ?? t.strip}
        </p>
        <button onClick={clearRecent} aria-label={t.clearStrip} className="text-[var(--text-linen)] hover:text-[var(--text-espresso)]">
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
                <p className="font-serif-editorial truncate text-lg leading-tight group-hover:text-[var(--gold-vermeil)]">{catalog.name(p)}</p>
                <p className="font-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-linen)]">{catalog.product(p).collection}</p>
              </div>
              <Price amount={p.rental ? p.rental.weekend[currency] : priceFor(p, currency)} className="shrink-0 text-xs" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
