import { priceFor, type Product } from '../data/catalog'
import { useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { href, useStore } from '../store'
import Price from './Price'
import WishButton from './WishButton'
import TryOnButton from './tryon/TryOnButton'

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { currency } = useStore()
  const t = useCopy(COMMON)
  const catalog = useCatalog()
  const copy = catalog.product(product)
  const isRental = product.category === 'rentals' && product.rental
  return (
    <a href={href.product(product.slug)} className="group block" data-reveal={(index % 3) * 0.08}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
        <img
          src={product.images[0]}
          alt={copy.name}
          loading="lazy"
          className="editorial-zoom h-full w-full object-cover"
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <WishButton slug={product.slug} className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 transition-all duration-500 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          <TryOnButton product={product} variant="chip" label={t.tryOn} />
        </div>
        {product.badges?.[0] && (
          <span className="font-spec absolute left-4 top-4 bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">
            {catalog.badge(product.badges[0])}
          </span>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-linen)]">
            {copy.collection}
          </p>
          <h3 className="font-serif-editorial mt-1.5 text-balance text-xl leading-tight sm:text-2xl">{copy.name}</h3>
        </div>
        <div className="shrink-0 text-sm sm:pt-5 sm:text-right">
          {isRental ? (
            <>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.from}</span>
              <Price amount={product.rental!.weekend[currency]} />
            </>
          ) : (
            <Price amount={priceFor(product, currency)} />
          )}
        </div>
      </div>
    </a>
  )
}
