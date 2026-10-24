import { Eye } from 'lucide-react'
import { METALS, cardPrice, isRentable, openingPrice, pic, rentFirst, type Product } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { href, useStore } from '../store'
import Price from './Price'
import WishButton from './WishButton'
import TryOnButton from './tryon/TryOnButton'

const COPY = bilingual(
  { rentFrom: 'Or rent from', perWeekend: 'a weekend', own: 'Or own it,', quickView: 'Quick view', quickViewOf: (name: string) => `Quick view: ${name}`, metals: (n: number) => `In ${n} metals` },
  { rentFrom: 'Ou en location dès', perWeekend: 'la fin de semaine', own: 'Ou à acheter,', quickView: 'Aperçu', quickViewOf: (name) => `Aperçu : ${name}`, metals: (n) => `En ${n} métaux` },
)

const SIZES = '(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw'

interface Props {
  product: Product
  index?: number
  /** Lead with renting (the Rentals chapter, a search or a filter for renting). */
  rent?: boolean
  /** Lead with this, whatever the piece's own lead: Shop all prices the vault's pieces to own once a price is asked. */
  lead?: 'rent' | 'own'
  /** Lead with the piece as worn (its second photograph), the piece alone on hover. */
  worn?: boolean
  /** The photograph's `sizes`, for grids of another density. */
  sizes?: string
  /** Offers a quick look without leaving the page (Shop all). */
  onQuickView?: (product: Product) => void
  /** Shows the metals it comes in. */
  swatches?: boolean
  /** Smaller type, for dense grids. */
  compact?: boolean
  /** Reveals as it scrolls into view; off where the grid animates its own cards. */
  reveal?: boolean
}

/** A piece in a grid: its photo (the second, on the body, on hover), name and price. A piece that can also be rented
 *  says so under its price; in the Rentals chapter (`rent`) the rate leads and the price follows. The whole card is the
 *  link, with its photograph inside, so the page transition can fly that photograph into the piece's page. */
export default function ProductCard({ product, index = 0, rent = false, lead, worn = false, sizes = SIZES, onQuickView, swatches = false, compact = false, reveal = true }: Props) {
  const { currency } = useStore()
  const t = useCopy(COMMON)
  const c = useCopy(COPY)
  const catalog = useCatalog()
  const copy = catalog.product(product)
  const leadsWithRent = (lead ? lead === 'rent' : rent || rentFirst(product)) && isRentable(product)
  const shown = cardPrice(product, currency, leadsWithRent)
  const [first, second] = worn && product.images[1] ? [product.images[1], product.images[0]] : [product.images[0], product.images[1]]
  return (
    <a href={href.product(product.slug, leadsWithRent, rentFirst(product) && !leadsWithRent)} className="group block" data-reveal={reveal ? (index % 3) * 0.08 : undefined}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
        <img {...pic(first, sizes)} alt={copy.name} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
        {second && (
          <img {...pic(second, sizes)} alt="" loading="lazy" className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 [@media(hover:hover)]:block" />
        )}
        <WishButton slug={product.slug} className="absolute right-3 top-3" />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="transition-all duration-500 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100">
            <TryOnButton product={product} variant="chip" label={t.tryOn} />
          </div>
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                // The card is a link; the quick look stays on the page.
                e.preventDefault()
                e.stopPropagation()
                onQuickView(product)
              }}
              aria-label={c.quickViewOf(copy.name)}
              aria-haspopup="dialog"
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--bg-travertine)]/90 px-2.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-espresso)] backdrop-blur transition-all duration-500 hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)] [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:px-3.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:translate-y-0 [@media(hover:hover)]:group-focus-visible:opacity-100 [@media(hover:hover)]:focus-visible:translate-y-0 [@media(hover:hover)]:focus-visible:opacity-100"
            >
              <Eye size={14} strokeWidth={1.3} />
              <span className="hidden [@media(hover:hover)]:inline">{c.quickView}</span>
            </button>
          )}
        </div>
        {product.badges?.[0] && (
          <span className={`font-spec absolute left-4 top-4 bg-[var(--bg-travertine)]/90 px-2.5 py-1 uppercase tracking-[0.2em] ${compact ? 'max-w-[calc(100%-4.5rem)] truncate text-[9px] max-sm:left-3 max-sm:top-3' : 'text-[10px]'}`}>
            {catalog.badge(product.badges[0])}
          </span>
        )}
      </div>
      <div className={`flex flex-col gap-2 ${compact ? 'mt-4' : 'mt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4'}`}>
        <div className="min-w-0">
          <p className={`font-spec truncate uppercase text-[var(--text-taupe)] ${compact ? 'text-[9px] tracking-[0.2em] sm:text-[10px]' : 'text-[10px] tracking-[0.24em]'}`}>
            {copy.collection}
          </p>
          <h3 className={`font-serif-editorial mt-1.5 text-balance leading-tight ${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}>{copy.name}</h3>
        </div>
        <div className={`shrink-0 text-sm ${compact ? '' : 'sm:pt-5 sm:text-right'}`}>
          {shown.rent ? (
            <>
              <span className={`text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)] ${compact ? 'mr-1.5' : 'block'}`}>{t.from}</span>
              <Price amount={shown.amount} />
            </>
          ) : (
            <Price amount={shown.amount} />
          )}
        </div>
      </div>
      {isRentable(product) && !compact && (
        <p className="mt-2 text-xs text-[var(--text-taupe)]">
          {shown.rent ? <>{c.own} <Price amount={openingPrice(product, currency)} className="[&_span]:hidden" /></> : <>{c.rentFrom} <Price amount={product.rental!.weekend[currency]} className="[&_span]:hidden" /> {c.perWeekend}</>}
        </p>
      )}
      {swatches && product.metals.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-taupe)]">
          <span aria-hidden="true" className="flex -space-x-0.5">
            {product.metals.map((m) => <span key={m} className="h-2.5 w-2.5 rounded-full border border-[var(--bg-travertine)] ring-1 ring-[var(--border-hairline)]" style={{ background: METALS[m].swatch }} />)}
          </span>
          {product.metals.length === 1 ? catalog.metal(product.metals[0]) : c.metals(product.metals.length)}
        </p>
      )}
    </a>
  )
}
