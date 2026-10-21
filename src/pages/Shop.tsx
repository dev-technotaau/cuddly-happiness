import { useRef } from 'react'
import { CATEGORIES, IMG, PRODUCTS, pic } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore, type Query } from '../store'
import useReveal from '../components/useReveal'
import RecentlyViewed from '../components/RecentlyViewed'
import PieceGrid from '../components/catalog/PieceGrid'
import Interlude from '../components/catalog/Interlude'
import VisitBand from '../components/visit/VisitBand'

const COPY = bilingual(
  {
    maison: 'Maison',
    eyebrow: 'Nine chapters',
    title: 'Every <em>piece</em>',
    text: 'Everything the house makes and curates, in one place: designed and finished in our atelier on rue Sherbrooke.',
    chapters: 'Or walk the chapters',
    alt: 'A tray of pieces from every chapter',
  },
  {
    maison: 'Maison',
    eyebrow: 'Neuf chapitres',
    title: 'Toutes les <em>pièces</em>',
    text: 'Tout ce que la maison fait et choisit, au même endroit : dessiné et fini dans notre atelier, rue Sherbrooke.',
    chapters: 'Ou parcourez les chapitres',
    alt: 'Un plateau de pièces de tous les chapitres',
  },
)

/** Shop all (`#/shop`, Shopify's /collections/all): every piece, filterable by chapter, type, metal, price and renting. */
export default function Shop({ query }: { query: Query }) {
  const root = useRef<HTMLDivElement>(null)
  const { replaceQuery, openAsk } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  useReveal(root, [])
  // Gift cards have their own page; every other piece is here.
  const pieces = PRODUCTS.filter((p) => p.type !== 'gift-card')

  return (
    <div ref={root}>
      <section className="relative h-[56vh] min-h-[440px] overflow-hidden bg-[var(--bg-vault)]">
        <img data-parallax {...pic(IMG.tray)} alt={t.alt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)]/90 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-14 text-[var(--bg-travertine)] lg:px-12">
          <p className="font-spec text-[10px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]"><a href={href.home} className="hover:text-white">{t.maison}</a> / {t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-5 text-7xl font-light leading-none lg:text-[8.5rem]">{rich(t.title, 'text-[var(--gold-champagne)]')}</h1>
          <p className="mt-6 max-w-lg text-white/75">{t.text}</p>
        </div>
      </section>

      <nav aria-label={t.chapters} className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-8 overflow-x-auto overscroll-x-contain px-6 py-5 lg:px-12" data-lenis-prevent-horizontal>
          <span className="font-spec shrink-0 text-[10px] uppercase tracking-[0.26em] text-[var(--text-taupe)]">{t.chapters}</span>
          {CATEGORIES.map((c) => (
            <a key={c.slug} href={href.category(c.slug)} className="font-serif-editorial shrink-0 whitespace-nowrap text-lg transition-colors hover:text-[var(--gold-vermeil)]">
              <span className="font-spec mr-2 text-[10px] text-[var(--gold-ink)]">{c.eyebrow}</span>{catalog.category(c).name}
            </a>
          ))}
        </div>
      </nav>

      <PieceGrid pieces={pieces} initial={query} onQuery={replaceQuery} chapters interlude={<Interlude />} onAsk={() => openAsk()} />
      <VisitBand />
      <RecentlyViewed />
    </div>
  )
}
