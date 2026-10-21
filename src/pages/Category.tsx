import { useMemo, useRef, useState } from 'react'
import { getCategory, getProductsByCategory, priceFor, type CategorySlug } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import RecentlyViewed from '../components/RecentlyViewed'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import TryOnButton from '../components/tryon/TryOnButton'
import ShoppableVideos from '../components/video/ShoppableVideos'
import { videosForCategory } from '../data/media'
import { tryOnKind } from '../data/catalog'

type Sort = 'featured' | 'low' | 'high'

const COPY = bilingual(
  {
    missing: 'This chapter could not be found.',
    home: 'Return home',
    maison: 'Maison',
    chapter: (n: string) => `Chapter ${n}`,
    giftEyebrow: 'Carte-cadeau',
    giftTitle: 'Not sure what to choose? Give the <em>choice</em>.',
    giftText: 'Digital or mailed · scheduled delivery · never expires',
    giftCta: 'Send a gift card',
    rentalSteps: ['Reserve online or in salon', 'Fitting & ID verification', 'Insured courier delivery', 'Collected the next morning'],
    count: (n: number, currency: string) => `${n} piece${n === 1 ? '' : 's'} · Prices in ${currency}`,
    tryThese: 'Try these pieces on',
    sort: 'Sort',
    sorts: { featured: 'Featured', low: 'Price, low to high', high: 'Price, high to low' } as Record<Sort, string>,
    filmsEyebrow: (name: string) => `${name} · in motion`,
    filmsTitle: 'Worn & <em>filmed</em>',
  },
  {
    missing: 'Ce chapitre est introuvable.',
    home: 'Retour à l’accueil',
    maison: 'Maison',
    chapter: (n) => `Chapitre ${n}`,
    giftEyebrow: 'Carte-cadeau',
    giftTitle: 'Vous hésitez? Offrez le <em>choix</em>.',
    giftText: 'Numérique ou postale · envoi programmé · sans expiration',
    giftCta: 'Offrir une carte-cadeau',
    rentalSteps: ['Réservez en ligne ou au salon', 'Essayage et vérification d’identité', 'Livraison assurée par messager', 'Reprise le lendemain matin'],
    count: (n, currency) => `${n} pièce${n < 2 ? '' : 's'} · Prix en ${currency}`,
    tryThese: 'Essayer ces pièces',
    sort: 'Trier',
    sorts: { featured: 'En vedette', low: 'Prix croissant', high: 'Prix décroissant' },
    filmsEyebrow: (name) => `${name} · en mouvement`,
    filmsTitle: 'Portés et <em>filmés</em>',
  },
)

export default function Category({ slug }: { slug: string }) {
  const root = useRef<HTMLDivElement>(null)
  const { currency } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [sort, setSort] = useState<Sort>('featured')
  const category = getCategory(slug)

  const products = useMemo(() => {
    const list = [...getProductsByCategory(slug as CategorySlug)]
    if (sort === 'low') list.sort((a, b) => priceFor(a, currency) - priceFor(b, currency))
    if (sort === 'high') list.sort((a, b) => priceFor(b, currency) - priceFor(a, currency))
    return list
  }, [slug, sort, currency])

  useReveal(root, [slug, sort])

  if (!category) {
    return (
      <div className="py-40 text-center">
        <p className="font-serif-editorial text-4xl">{t.missing}</p>
        <a href={href.home} className="mt-6 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-vermeil)]">{t.home}</a>
      </div>
    )
  }

  const copy = catalog.category(category)
  return (
    <div ref={root}>
      <section className="relative h-[62vh] min-h-[460px] overflow-hidden bg-[var(--bg-vault)]">
        <img key={category.hero} data-parallax src={category.hero} alt={copy.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)]/90 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-14 text-[var(--bg-travertine)] lg:px-12">
          <p className="font-spec text-[10px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]">
            <a href={href.home} className="hover:text-white">{t.maison}</a> / {t.chapter(category.eyebrow)}
          </p>
          {/* Long names (French runs longer) step down a size so the title keeps to two lines at most */}
          <h1 className={`font-serif-editorial mt-5 font-light leading-none ${copy.name.length > 16 ? 'text-6xl lg:text-[6.5rem]' : 'text-7xl lg:text-[9rem]'}`}>
            {copy.name}
            {/* The accent travels whole: a French line of several words drops below the name rather than splitting */}
            <em className="ml-4 inline-block whitespace-nowrap align-top text-2xl text-[var(--gold-champagne)] lg:text-4xl">{copy.accent}</em>
          </h1>
          <p className="mt-6 max-w-lg text-white/75">{copy.description}</p>
        </div>
      </section>

      {slug === 'gifts' && (
        <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
          <a href={href.giftcards} className="group mx-auto grid max-w-[1600px] items-center gap-8 px-6 py-12 sm:grid-cols-[200px_1fr_auto] lg:px-12">
            <div className="w-48 -rotate-3 transition-transform duration-700 group-hover:rotate-0"><GiftCardArt design="travertine" currency={currency} amount={250} /></div>
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-vermeil)]">{t.giftEyebrow}</p>
              <p className="font-serif-editorial mt-2 text-4xl font-light">{rich(t.giftTitle, 'text-[var(--gold-vermeil)]')}</p>
              <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.giftText}</p>
            </div>
            <span className="link-line">{t.giftCta}</span>
          </a>
        </section>
      )}

      {slug === 'rentals' && (
        <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
          <ol className="mx-auto grid max-w-[1600px] gap-8 px-6 py-12 sm:grid-cols-4 lg:px-12">
            {t.rentalSteps.map((s, i) => (
              <li key={i} data-reveal={i * 0.06} className="flex items-baseline gap-4">
                <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
                <span className="font-serif-editorial text-xl">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="mb-12 flex items-center justify-between border-b border-[var(--border-hairline)] pb-5">
          <span className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">
            {t.count(products.length, currency)}
          </span>
          <div className="flex items-center gap-8">
          {(() => {
            const wearable = products.filter((p) => tryOnKind(p))
            return wearable[0] ? <TryOnButton product={wearable[0]} list={wearable} variant="link" label={t.tryThese} className="hidden sm:inline-flex" /> : null
          })()}
          <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
            {t.sort}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="cursor-pointer bg-transparent outline-none">
              {(['featured', 'low', 'high'] as const).map((s) => <option key={s} value={s}>{t.sorts[s]}</option>)}
            </select>
          </label>
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
      <ShoppableVideos
        videos={videosForCategory(category.slug as CategorySlug)}
        eyebrow={t.filmsEyebrow(copy.name)}
        title={rich(t.filmsTitle, 'text-[var(--gold-vermeil)]')}
        className="border-t border-[var(--border-hairline)]"
      />
      <RecentlyViewed />
    </div>
  )
}
