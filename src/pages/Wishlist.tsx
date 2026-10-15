import { useRef } from 'react'
import { Share2 } from 'lucide-react'
import { PRODUCTS } from '../data/catalog'
import { href, useStore } from '../store'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import TryOnButton from '../components/tryon/TryOnButton'
import { tryOnKind } from '../data/catalog'

export default function Wishlist() {
  const root = useRef<HTMLDivElement>(null)
  const { wishlist, user, addToCart } = useStore()
  const items = wishlist.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p) => p !== undefined)
  useReveal(root, [items.length])

  return (
    <div ref={root} className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-8 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Liste de souhaits</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-8xl">
            Your <em className="text-[var(--gold-vermeil)]">Wishlist</em>
          </h1>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {(() => {
              const wearable = items.filter((p) => tryOnKind(p))
              return wearable[0] ? (
                <TryOnButton product={wearable[0]} list={wearable} label="Try your wishlist on" className="!w-auto px-5 !py-3 !text-[11px]" />
              ) : null
            })()}
            <button
              onClick={() => navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/wishlist`)}
              className="flex items-center gap-2 border border-[var(--border-hairline)] px-5 py-3 text-[11px] uppercase tracking-[0.2em] hover:border-[var(--text-espresso)]"
            >
              <Share2 size={14} strokeWidth={1.4} /> Copy link
            </button>
            <button
              onClick={() => items.filter((p) => p.category !== 'rentals' && !p.personalization && p.slug !== 'gift-card').forEach((p) => addToCart({ slug: p.slug, metal: p.metals[0] }))}
              className="bg-[var(--text-espresso)] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]"
            >
              Add all to bag
            </button>
          </div>
        )}
      </div>

      {!user && items.length > 0 && (
        <p className="mt-6 text-sm text-[var(--text-taupe)]">
          Saved on this device. <a href={href.account} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">Sign in</a> to keep your wishlist across devices.
        </p>
      )}

      {items.length === 0 ? (
        <div className="py-32 text-center">
          <p className="font-serif-editorial text-3xl italic text-[var(--text-taupe)]">Nothing saved yet.</p>
          <p className="mt-3 text-sm text-[var(--text-linen)]">Tap the heart on any piece to keep it here.</p>
          <a href={href.category('rings')} className="mt-8 inline-block border-b border-[var(--text-espresso)] pb-1 text-[11px] uppercase tracking-[0.24em]">Explore Rings</a>
          <div className="mx-auto mt-20 max-w-md">
            <RecentlyViewedStrip title="Pieces you looked at" limit={4} />
          </div>
        </div>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
