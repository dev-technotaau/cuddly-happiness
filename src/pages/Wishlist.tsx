import { useRef } from 'react'
import { PRODUCTS, formatPrice, priceFor } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import TryOnButton from '../components/tryon/TryOnButton'
import { tryOnKind } from '../data/catalog'
import ShareButton from '../components/share/ShareButton'

const COPY = bilingual(
  {
    eyebrow: 'Liste de souhaits',
    title: 'Your <em>Wishlist</em>',
    tryOn: 'Try your wishlist on',
    share: 'Share list',
    shareTitle: 'Your wishlist',
    weekendFrom: (price: string) => `from ${price} a weekend`,
    addAll: 'Add all to bag',
    device: 'Saved on this device.',
    signIn: 'Sign in',
    across: ' to keep your wishlist across devices.',
    empty: 'Nothing saved yet.',
    tap: 'Tap the heart on any piece to keep it here.',
    explore: 'Explore Rings',
    looked: 'Pieces you looked at',
  },
  {
    eyebrow: 'Vos coups de cœur',
    title: 'Liste de <em>souhaits</em>',
    tryOn: 'Essayer votre liste',
    share: 'Partager la liste',
    shareTitle: 'Votre liste de souhaits',
    weekendFrom: (price) => `dès ${price} la fin de semaine`,
    addAll: 'Tout ajouter au panier',
    device: 'Enregistrée sur cet appareil.',
    signIn: 'Connectez-vous',
    across: ' pour retrouver votre liste sur tous vos appareils.',
    empty: 'Rien d’enregistré pour l’instant.',
    tap: 'Touchez le cœur d’une pièce pour la garder ici.',
    explore: 'Découvrir les bagues',
    looked: 'Pièces que vous avez regardées',
  },
)

export default function Wishlist() {
  const root = useRef<HTMLDivElement>(null)
  const { wishlist, user, addToCart, currency } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const items = wishlist.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p) => p !== undefined)
  useReveal(root, [items.length])

  return (
    <div ref={root} className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-8 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-8xl">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h1>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {(() => {
              const wearable = items.filter((p) => tryOnKind(p))
              return wearable[0] ? (
                <TryOnButton product={wearable[0]} list={wearable} label={t.tryOn} className="!w-auto px-5 !py-3 !text-[11px]" />
              ) : null
            })()}
            {/* The wishlist lives on this device, so a link to it would open the recipient's own list: share the pieces instead. */}
            <ShareButton
              variant="outline"
              label={t.share}
              subject={{
                kind: 'list',
                id: 'wishlist',
                title: t.shareTitle,
                items: items.map((p) => ({
                  name: catalog.name(p),
                  route: href.product(p.slug),
                  image: p.images[0],
                  priceText: p.rental ? t.weekendFrom(`${formatPrice(p.rental.weekend[currency], currency)} ${currency}`) : `${formatPrice(priceFor(p, currency), currency)} ${currency}`,
                })),
              }}
            />
            <button
              onClick={() => items.filter((p) => p.category !== 'rentals' && !p.personalization && p.slug !== 'gift-card').forEach((p) => addToCart({ slug: p.slug, metal: p.metals[0] }))}
              className="bg-[var(--text-espresso)] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]"
            >
              {t.addAll}
            </button>
          </div>
        )}
      </div>

      {!user && items.length > 0 && (
        <p className="mt-6 text-sm text-[var(--text-taupe)]">
          {t.device} <a href={href.account} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{t.signIn}</a>{t.across}
        </p>
      )}

      {items.length === 0 ? (
        <div className="py-32 text-center">
          <p className="font-serif-editorial text-3xl italic text-[var(--text-taupe)]">{t.empty}</p>
          <p className="mt-3 text-sm text-[var(--text-linen)]">{t.tap}</p>
          <a href={href.category('rings')} className="mt-8 inline-block border-b border-[var(--text-espresso)] pb-1 text-[11px] uppercase tracking-[0.24em]">{t.explore}</a>
          <div className="mx-auto mt-20 max-w-md">
            <RecentlyViewedStrip title={t.looked} limit={4} />
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
