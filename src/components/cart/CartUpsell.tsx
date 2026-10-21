import { useMemo, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { PRODUCTS, openingPrice, quickAddable } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { href, useStore } from '../../store'
import Price from '../Price'

const PAIRS: Record<string, string[]> = {
  necklaces: ['earrings', 'bracelets'], earrings: ['necklaces', 'rings'], bracelets: ['rings', 'earrings'], rings: ['bracelets', 'earrings'],
  bridal: ['earrings', 'bracelets'], watches: ['bracelets', 'rings'], gifts: ['earrings', 'necklaces'], custom: ['earrings'], rentals: ['earrings'],
}

const COPY = bilingual(
  { title: 'Pairs beautifully with', add: (name: string) => `Add ${name} to bag`, added: 'Added', quick: 'Quick add', options: 'Options' },
  { title: 'S’accorde à merveille avec', add: (name) => `Ajouter ${name} au panier`, added: 'Ajouté', quick: 'Ajout rapide', options: 'Options' },
)

export default function CartUpsell({ layout = 'rail', onNavigate, limit = 3 }: { layout?: 'rail' | 'grid'; onNavigate?: () => void; limit?: number }) {
  const { cart, currency, addToCart } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [added, setAdded] = useState<string | null>(null)

  const picks = useMemo(() => {
    const inCart = new Set(cart.map((l) => l.slug))
    const cats = [...new Set(cart.flatMap((l) => PAIRS[PRODUCTS.find((p) => p.slug === l.slug)?.category ?? ''] ?? []))]
    const pool = PRODUCTS.filter((p) => !inCart.has(p.slug) && p.slug !== 'gift-card' && !/commission|redesign/i.test(p.name))
    const paired = pool.filter((p) => cats.includes(p.category))
    const fallback = pool.filter((p) => p.badges?.includes('Bestseller'))
    return [...new Set([...paired, ...fallback])].sort((a, b) => Number(quickAddable(b)) - Number(quickAddable(a))).slice(0, limit)
  }, [cart, limit])

  if (picks.length === 0) return null

  return (
    <div>
      <p className="mb-4 text-[11px] uppercase tracking-[0.22em]">{t.title}</p>
      <ul className={layout === 'grid' ? 'grid grid-cols-2 gap-6 lg:grid-cols-4' : 'space-y-3'}>
        {picks.map((p) => {
          const quick = quickAddable(p)
          return (
            <li key={p.id} className={layout === 'grid' ? '' : 'flex items-center gap-4'}>
              <a href={href.product(p.slug)} onClick={onNavigate} className={`group block shrink-0 overflow-hidden bg-[var(--bg-silk)] ${layout === 'grid' ? 'aspect-[4/5]' : 'h-16 w-13'}`}>
                <img src={p.images[0]} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
              </a>
              <div className={`min-w-0 flex-1 ${layout === 'grid' ? 'mt-3' : ''}`}>
                <a href={href.product(p.slug)} onClick={onNavigate} className="font-serif-editorial block truncate text-lg leading-tight hover:text-[var(--gold-vermeil)]">{catalog.name(p)}</a>
                <Price amount={openingPrice(p, currency)} className="text-xs text-[var(--text-taupe)]" />
              </div>
              {quick ? (
                <button
                  onClick={() => {
                    addToCart({ slug: p.slug, metal: p.metals[0] })
                    setAdded(p.slug)
                  }}
                  aria-label={t.add(catalog.name(p))}
                  className={`flex shrink-0 items-center justify-center gap-2 border text-[10px] uppercase tracking-[0.18em] transition-colors ${layout === 'grid' ? 'mt-3 w-full py-2.5' : 'h-9 w-9'} ${added === p.slug ? 'border-[var(--gold-vermeil)] bg-[var(--gold-vermeil)] text-white' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
                >
                  {added === p.slug ? <Check size={13} /> : <Plus size={13} />}
                  {layout === 'grid' && (added === p.slug ? t.added : t.quick)}
                </button>
              ) : (
                <a href={href.product(p.slug)} onClick={onNavigate} className={`shrink-0 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)] ${layout === 'grid' ? 'mt-3 block border border-[var(--border-hairline)] py-2.5 text-center' : ''}`}>
                  {t.options}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
