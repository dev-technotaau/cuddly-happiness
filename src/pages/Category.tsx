import { useMemo, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { SIGNATURES, getCategory, getProductsByCategory, pic, signatureFor, signaturePieces, type CategorySlug } from '../data/catalog'
import { HOUSE, HOUSE_IMG } from '../data/house'
import { videosForCategory } from '../data/media'
import type { VisitPurpose } from '../data/visits'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore, type Query } from '../store'
import useReveal from '../components/useReveal'
import RecentlyViewed from '../components/RecentlyViewed'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import ShoppableVideos from '../components/video/ShoppableVideos'
import PieceGrid from '../components/catalog/PieceGrid'
import Interlude from '../components/catalog/Interlude'
import FourCs from '../components/home/FourCs'
import GiftFinder from '../components/home/GiftFinder'
import TennisGuide from '../components/home/TennisGuide'
import WatchSpotlight from '../components/home/WatchSpotlight'
import VisitBand from '../components/visit/VisitBand'
import VisitButton from '../components/visit/VisitButton'

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
    rentalOwn: 'Every piece in the vault can also be yours to keep.',
    fitting: 'Book a fitting',
    calloutEyebrow: (numeral: string) => `Our signature · ${numeral}`,
    calloutCount: (n: number) => `${n} pieces`,
    designOwn: 'Design your own',
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
    rentalOwn: 'Chaque pièce du coffre peut aussi devenir la vôtre.',
    fitting: 'Réserver un essayage',
    calloutEyebrow: (numeral) => `Notre signature · ${numeral}`,
    calloutCount: (n) => `${n} pièces`,
    designOwn: 'Créer la vôtre',
    filmsEyebrow: (name) => `${name} · en mouvement`,
    filmsTitle: 'Portés et <em>filmés</em>',
  },
)

const HERO: Record<string, string> = { engagement: HOUSE_IMG.signatures.engagement.hero, tennis: HOUSE_IMG.signatures.tennis.hero }

/** A chapter of the catalog, or one of the house's two signatures within it (`?type=engagement`, `?type=tennis`):
 *  the hero, the chapter's own band, every piece with filters in the address, the signature's guide, a visit, films. */
export default function Category({ slug, query }: { slug: string; query: Query }) {
  const root = useRef<HTMLDivElement>(null)
  const { currency, replaceQuery, openAsk } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const category = getCategory(slug)
  const signature = category ? signatureFor(category.slug, query.type) : undefined
  const callout = !signature ? SIGNATURES.find((s) => s.category === slug) : undefined
  const pieces = useMemo(() => (category ? getProductsByCategory(category.slug) : []), [category])

  useReveal(root, [slug])

  if (!category) {
    return (
      <div className="py-40 text-center">
        <p className="font-serif-editorial text-4xl">{t.missing}</p>
        <a href={href.home} className="mt-6 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{t.home}</a>
      </div>
    )
  }

  const copy = catalog.category(category)
  const sig = signature && house.signatures[signature.id]
  const purpose: VisitPurpose | undefined = signature ? (signature.id === 'engagement' ? 'engagement' : 'tennis') : slug === 'rentals' ? 'rental' : slug === 'bridal' ? 'engagement' : slug === 'watches' ? 'watches' : slug === 'custom' ? 'design' : slug === 'gifts' ? 'gift' : undefined
  const calloutCopy = callout && house.signatures[callout.id]

  return (
    <div ref={root}>
      <section className="relative h-[66vh] min-h-[480px] overflow-hidden bg-[var(--bg-vault)]">
        <img key={signature?.id ?? category.hero} data-parallax {...pic(signature ? HERO[signature.id] : category.hero)} alt={sig ? sig.name : copy.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)]/90 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-14 text-[var(--bg-travertine)] lg:px-12">
          <p className="font-spec text-[10px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]">
            <a href={href.home} className="hover:text-white">{t.maison}</a> / {sig ? <><a href={href.category(category.slug)} className="hover:text-white">{copy.name}</a> / {house.signature} {sig.numeral}</> : t.chapter(category.eyebrow)}
          </p>
          {sig ? (
            <>
              <h1 className="font-serif-editorial mt-5 max-w-5xl text-6xl font-light leading-[0.95] tracking-[-0.02em] lg:text-[7.5rem]">{rich(sig.title, 'text-[var(--gold-champagne)]')}</h1>
              <p className="mt-6 max-w-lg text-white/75">{sig.line}</p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <VisitButton tone="dark" request={{ purpose }} />
                {signature?.id === 'engagement' && <a href={href.category('custom')} className="link-line text-[var(--bg-travertine)]">{t.designOwn}</a>}
              </div>
            </>
          ) : (
            <>
              {/* Long names (French runs longer) step down a size so the title keeps to two lines at most */}
              <h1 className={`font-serif-editorial mt-5 font-light leading-none ${copy.name.length > 16 ? 'text-6xl lg:text-[6.5rem]' : 'text-7xl lg:text-[9rem]'}`}>
                {copy.name}
                {/* The accent travels whole: a French line of several words drops below the name rather than splitting */}
                <em className="ml-4 inline-block whitespace-nowrap align-top text-2xl text-[var(--gold-champagne)] lg:text-4xl">{copy.accent}</em>
              </h1>
              <p className="mt-6 max-w-lg text-white/75">{copy.description}</p>
            </>
          )}
        </div>
      </section>

      {/* A chapter that holds one of the two signatures leads to it */}
      {callout && calloutCopy && (
        <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
          <a href={href.category(callout.category, { type: callout.family })} className="group mx-auto grid max-w-[1600px] items-center gap-8 px-6 py-10 sm:grid-cols-[120px_1fr_auto] lg:px-12">
            <div className="hidden aspect-square overflow-hidden sm:block"><img {...pic(HOUSE_IMG.signatures[callout.id].card, '120px')} alt="" className="editorial-zoom h-full w-full object-cover" /></div>
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-ink)]">{t.calloutEyebrow(calloutCopy.numeral)} · {t.calloutCount(signaturePieces(callout.id).length)}</p>
              <p className="font-serif-editorial mt-2 text-4xl font-light">{rich(calloutCopy.title, 'text-[var(--gold-vermeil)]')}</p>
              <p className="mt-2 text-sm text-[var(--text-taupe)]">{calloutCopy.line}</p>
            </div>
            <span className="link-line">{calloutCopy.cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </a>
        </section>
      )}

      {slug === 'gifts' && (
        <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
          <a href={href.giftcards} className="group mx-auto grid max-w-[1600px] items-center gap-8 px-6 py-12 sm:grid-cols-[200px_1fr_auto] lg:px-12">
            <div className="w-48 -rotate-3 transition-transform duration-700 group-hover:rotate-0"><GiftCardArt design="travertine" currency={currency} amount={250} /></div>
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-ink)]">{t.giftEyebrow}</p>
              <p className="font-serif-editorial mt-2 text-4xl font-light">{rich(t.giftTitle, 'text-[var(--gold-vermeil)]')}</p>
              <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.giftText}</p>
            </div>
            <span className="link-line">{t.giftCta}</span>
          </a>
        </section>
      )}

      {slug === 'rentals' && (
        <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
          <div className="mx-auto max-w-[1600px] px-6 py-12 lg:px-12">
            <ol className="grid gap-8 sm:grid-cols-4">
              {t.rentalSteps.map((s, i) => (
                <li key={i} data-reveal={i * 0.06} className="flex items-baseline gap-4">
                  <span className="font-spec text-[10px] text-[var(--gold-ink)]">0{i + 1}</span>
                  <span className="font-serif-editorial text-xl">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col justify-between gap-6 border-t border-[var(--border-hairline)] pt-8 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-taupe)]"><span className="text-[var(--text-espresso)]">{t.rentalOwn}</span> {house.rentalCredit}</p>
              <VisitButton request={{ purpose: 'rental' }} className="shrink-0">{t.fitting}</VisitButton>
            </div>
          </div>
        </section>
      )}

      {/* Moved from Home on 2026-10-21: the gift finder opens the Gifts chapter, the watches' story the Watches chapter */}
      {slug === 'gifts' && <GiftFinder index="—" inChapter />}
      {slug === 'watches' && <WatchSpotlight index="—" inChapter />}

      <PieceGrid pieces={pieces} initial={query} onQuery={replaceQuery} rent={slug === 'rentals'} interlude={<Interlude purpose={purpose} />} onAsk={() => openAsk()} />

      {signature?.id === 'engagement' && <FourCs index="—" />}
      {signature?.id === 'tennis' && <TennisGuide index="—" />}

      <VisitBand purpose={purpose} />
      <ShoppableVideos
        videos={videosForCategory(category.slug as CategorySlug)}
        eyebrow={t.filmsEyebrow(sig ? sig.name : copy.name)}
        title={rich(t.filmsTitle, 'text-[var(--gold-vermeil)]')}
        className="border-t border-[var(--border-hairline)]"
      />
      <RecentlyViewed />
    </div>
  )
}
