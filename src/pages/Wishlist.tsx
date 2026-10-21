import { useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { PRODUCTS, SIGNATURES, cardPrice, formatPrice, quickAddable, tryOnKind } from '../data/catalog'
import { HOUSE } from '../data/house'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import TryOnButton from '../components/tryon/TryOnButton'
import ShareButton from '../components/share/ShareButton'
import VisitBand from '../components/visit/VisitBand'
import VisitButton from '../components/visit/VisitButton'
import { btnQuiet } from '../components/ui'

const COPY = bilingual(
  {
    eyebrow: 'Liste de souhaits',
    title: 'Your <em>Wishlist</em>',
    subtitle: 'Your shortlist for a visit: we’ll have every piece ready, in your size.',
    see: 'Book a visit to see these',
    ask: 'Ask about these',
    tryOn: 'Try your wishlist on',
    share: 'Share list',
    shareTitle: 'Your wishlist',
    weekendFrom: (price: string) => `from ${price} a weekend`,
    addAll: 'Add all to bag',
    needOptions: (n: number) => (n === 1 ? 'One piece needs a size, dates or a name first: add it from its page.' : `${n} pieces need a size, dates or a name first: add them from their pages.`),
    device: 'Saved on this device.',
    signIn: 'Sign in',
    across: ' to keep your wishlist across devices.',
    empty: 'Nothing saved yet.',
    tap: 'Tap the heart on any piece to keep it here, then bring your shortlist to the salon.',
    explore: 'See every piece',
    looked: 'Pieces you looked at',
  },
  {
    eyebrow: 'Vos coups de cœur',
    title: 'Liste de <em>souhaits</em>',
    subtitle: 'Votre sélection pour une visite : nous préparerons chaque pièce, à votre taille.',
    see: 'Prendre rendez-vous pour les voir',
    ask: 'Poser une question',
    tryOn: 'Essayer votre liste',
    share: 'Partager la liste',
    shareTitle: 'Votre liste de souhaits',
    weekendFrom: (price) => `dès ${price} la fin de semaine`,
    addAll: 'Tout ajouter au panier',
    needOptions: (n) => (n === 1 ? 'Une pièce demande d’abord une taille, des dates ou un nom : ajoutez-la depuis sa page.' : `${n} pièces demandent d’abord une taille, des dates ou un nom : ajoutez-les depuis leur page.`),
    device: 'Enregistrée sur cet appareil.',
    signIn: 'Connectez-vous',
    across: ' pour retrouver votre liste sur tous vos appareils.',
    empty: 'Rien d’enregistré pour l’instant.',
    tap: 'Touchez le cœur d’une pièce pour la garder ici, puis apportez votre sélection au salon.',
    explore: 'Voir toutes les pièces',
    looked: 'Pièces que vous avez regardées',
  },
)

/** The wishlist as the visitor's shortlist for a visit: the pieces, a visit to see them all, a question about them,
 *  try-on, sharing, and the bag for the pieces that need no choices first. */
export default function Wishlist() {
  const root = useRef<HTMLDivElement>(null)
  const { wishlist, user, addToCart, currency, openAsk } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const items = wishlist.map((s) => PRODUCTS.find((p) => p.slug === s)).filter((p) => p !== undefined)
  const ready = items.filter(quickAddable)
  const waiting = items.filter((p) => !quickAddable(p) && p.type !== 'gift-card').length
  const pieces = items.filter((p) => p.type !== 'gift-card').map((p) => ({ slug: p.slug, metal: p.metals[0] }))
  useReveal(root, [items.length])

  return (
    <div ref={root}>
      <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-between gap-8 border-b border-[var(--border-hairline)] pb-10 lg:flex-row lg:items-end">
          <div>
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
            <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-8xl">
              {rich(t.title, 'text-[var(--gold-vermeil)]')}
            </h1>
            {items.length > 0 && <p className="mt-5 max-w-md text-[var(--text-taupe)]">{t.subtitle}</p>}
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <VisitButton request={{ pieces }}>{t.see}</VisitButton>
              <button type="button" onClick={() => openAsk(items.map((p) => p.slug))} className={btnQuiet}><MessageCircle size={14} strokeWidth={1.3} /> {t.ask}</button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {!user ? (
              <p className="text-sm text-[var(--text-taupe)]">
                {t.device} <a href={href.account} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{t.signIn}</a>{t.across}
              </p>
            ) : <span />}
            <div className="flex flex-wrap gap-3">
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
                  items: items.map((p) => {
                    const shown = cardPrice(p, currency)
                    return {
                      name: catalog.name(p),
                      route: href.product(p.slug, shown.rent),
                      image: p.images[0],
                      priceText: shown.rent ? t.weekendFrom(`${formatPrice(shown.amount, currency)} ${currency}`) : `${formatPrice(shown.amount, currency)} ${currency}`,
                    }
                  }),
                }}
              />
              {ready.length > 0 && (
                <button
                  onClick={() => ready.forEach((p) => addToCart({ slug: p.slug, metal: p.metals[0] }))}
                  className="bg-[var(--text-espresso)] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]"
                >
                  {t.addAll}
                </button>
              )}
            </div>
          </div>
        )}
        {items.length > 0 && waiting > 0 && <p className="mt-3 text-right text-xs text-[var(--text-taupe)]">{t.needOptions(waiting)}</p>}

        {items.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-serif-editorial text-3xl italic text-[var(--text-taupe)]">{t.empty}</p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--text-taupe)]">{t.tap}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {SIGNATURES.map((s) => <a key={s.id} href={href.category(s.category, { type: s.family })} className="border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.24em]">{house.signatures[s.id].name}</a>)}
              <a href={href.shop()} className="border-b border-[var(--text-espresso)] pb-1 text-[11px] uppercase tracking-[0.24em]">{t.explore}</a>
            </div>
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
      {items.length > 0 && <VisitBand pieces={pieces} />}
    </div>
  )
}
