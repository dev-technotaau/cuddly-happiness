import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowRight, Check, Gift, MessageCircle, ShieldCheck, ShoppingBag, Star, Truck, Watch } from 'lucide-react'
import { METALS, formatDay, formatPrice, getCategory, getProduct, getProductsByCategory, isRentable, needsSize, openingPrice, parseIso, personalizationPrice, priceFor, rentFirst, tryOnKind, validatePersonalization, type Metal, type Personalization, type RentalBooking } from '../data/catalog'
import { HOUSE } from '../data/house'
import { purposeFor, type VisitRequest } from '../data/visits'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { rich } from '../i18n/rich'
import { onStageClear } from '../lib/stage'
import { href, lineKey, useStore } from '../store'
import Price from '../components/Price'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import Gallery from '../components/pdp/Gallery'
import { getLenis } from '../components/SmoothScroll'
import SectionHeader from '../components/home/SectionHeader'
import Accordion from '../components/pdp/Accordion'
import RingSize, { sizeLabel } from '../components/pdp/RingSize'
import RentalCalendar, { isBookingValid } from '../components/pdp/RentalCalendar'
import Personalizer from '../components/pdp/Personalizer'
import TryOnButton from '../components/tryon/TryOnButton'
import ShoppableVideos from '../components/video/ShoppableVideos'
import PriceBreakdown from '../components/pdp/PriceBreakdown'
import { hasCostBreakdown } from '../data/costing'
import { videosForCategory, videosForProduct } from '../data/media'
import StickyBar from '../components/pdp/StickyBar'
import CraftStory from '../components/pdp/CraftStory'
import CompleteTheLook, { getLookPieces } from '../components/pdp/CompleteTheLook'
import Reviews, { getRatingSummary } from '../components/pdp/Reviews'
import ProductFAQ from '../components/pdp/ProductFAQ'
import RecentlyViewed from '../components/RecentlyViewed'
import ShareButton from '../components/share/ShareButton'
import type { ShareSubject } from '../components/share/ShareSheet'
import Hallmark from '../components/brand/Hallmark'
import FourCs from '../components/home/FourCs'
import VisitBand from '../components/visit/VisitBand'
import VisitButton from '../components/visit/VisitButton'

type RentalPeriod = 'weekend' | 'week' | 'month'

const COPY = bilingual(
  {
    missing: 'This piece has returned to the vault.',
    from: (date: string) => `From ${date}`,
    eyebrow: (collection: string, chapter: string) => `${collection} · Chapter ${chapter}`,
    available: 'Available for your dates · fitted in the salon',
    madeToOrder: (weeks: number) => `Made to order in our atelier · about ${weeks} weeks`,
    inStock: 'Ready to try in the salon · ships within 48 hours',
    ship: {
      CAD: 'Complimentary insured shipping across Canada, 2–3 business days, signature required. Returns within 30 days, complimentary, for unworn pieces; engraved, personalized and made-to-order pieces are final sale.',
      USD: 'Complimentary insured shipping to the United States, 3–5 business days. Duties and import fees are prepaid — nothing due on delivery. Returns within 30 days, complimentary, for unworn pieces; engraved, personalized and made-to-order pieces are final sale.',
    },
    own: 'Own it',
    rent: 'Rent it',
    howLabel: 'Own or rent',
    visit: 'Book a visit',
    fitting: 'Book a fitting',
    consultation: 'Book a design consultation',
    ready: 'We’ll have it ready for you in the salon',
    readyRent: 'Try it on at your fitting; we deliver it for the evening',
    source: 'Prefer another shape or size? We’ll source it for your visit.',
    makersNote: 'Maker’s note',
    watchNote: 'Swiss movement, regulated in our atelier and serviced for life by our horologist.',
    remember: 'We’ll remember your size.',
    trustRent: { delivery: ['Insured courier', 'delivery & collection'], cover: ['Insurance', 'included'], fit: ['Fitted', 'in the salon'] } as Record<'delivery' | 'cover' | 'fit', [string, string]>,
    trustWatch: { service: ['Five-year', 'service plan'], engrave: ['Case-back', 'engraving'] } as Record<'service' | 'engrave', [string, string]>,
    breadcrumb: 'Breadcrumb',
    maison: 'Maison',
    ref: (id: string) => `Ref. ${id}`,
    hint: 'Drop a hint',
    per: { weekend: 'per weekend', week: 'per week', month: 'per month' } as Record<RentalPeriod, string>,
    deposit: 'Refundable deposit',
    insurance: 'insurance included',
    feeCovers: 'What the fee covers',
    instalments: 'Or 4 interest-free payments of',
    shopPay: 'with Shop Pay',
    dutiesPrepaid: 'Duties prepaid',
    taxesAtCheckout: 'Taxes calculated at checkout',
    fullBreakdown: 'See full cost breakdown',
    rentalPeriod: 'Rental period',
    metal: 'Metal',
    reverseEngraving: 'Reverse engraving',
    engraving: 'Engraving',
    optional: 'optional',
    complimentary: 'complimentary',
    engravingPlaceholder: 'Initials, a date, a word',
    yourEngraving: 'Your engraving',
    jeweller: 'Ask a jeweller',
    trust: {
      CAD: ['Free insured', 'shipping in Canada'],
      USD: ['Duties paid', 'shipping to the U.S.'],
      care: ['Lifetime', 'warranty & care'],
      gift: ['Signature', 'gift presentation'],
    } as Record<'CAD' | 'USD' | 'care' | 'gift', [string, string]>,
    giaReport: 'Diamond grading report',
    reportNo: 'Report №',
    gia: { shape: 'Shape', carat: 'Carat', color: 'Colour', clarity: 'Clarity', cut: 'Cut' },
    details: 'Details & dimensions',
    reference: 'Reference',
    care: 'Care & servicing',
    careText: 'Store separately in the pouch provided. Remove before swimming or applying lotions. Bring it to our salon each year for complimentary ultrasonic cleaning, claw inspection and polishing.',
    shipTitle: { CAD: 'Shipping & returns · Canada', USD: 'Shipping & returns · United States' },
    giftTitle: 'Gift presentation',
    giftText: 'Every piece arrives in our signature travertine box with a linen pouch, care card and an optional handwritten note. Gift receipts never show prices.',
    filmsEyebrow: 'Watch & shop',
    filmsTitle: 'See it in <em>motion</em>',
    alsoIn: (name: string) => `Also in <em>${name}</em>`,
    viewAll: 'View all',
  },
  {
    missing: 'Cette pièce est retournée au coffre.',
    from: (date) => `À partir du ${date}`,
    eyebrow: (collection, chapter) => `${collection} · Chapitre ${chapter}`,
    available: 'Offerte à vos dates · ajustée au salon',
    madeToOrder: (weeks) => `Faite sur commande dans notre atelier · environ ${weeks} semaines`,
    inStock: 'À essayer au salon · expédiée sous 48 heures',
    ship: {
      CAD: 'Livraison assurée offerte partout au Canada, en 2 à 3 jours ouvrables, signature requise. Retours sous 30 jours, sans frais, pour les pièces non portées ; les pièces gravées, personnalisées ou faites sur commande sont finales.',
      USD: 'Livraison assurée offerte vers les États-Unis, en 3 à 5 jours ouvrables. Droits et frais d’importation prépayés — rien à payer à la livraison. Retours sous 30 jours, sans frais, pour les pièces non portées ; les pièces gravées, personnalisées ou faites sur commande sont finales.',
    },
    own: 'L’acheter',
    rent: 'La louer',
    howLabel: 'Acheter ou louer',
    visit: 'Prendre rendez-vous',
    fitting: 'Réserver un essayage',
    consultation: 'Réserver une consultation création',
    ready: 'Nous l’aurons prête pour vous au salon',
    readyRent: 'Essayez-la lors de votre essayage, nous la livrons pour la soirée',
    source: 'Une autre forme ou une autre taille ? Nous la trouverons pour votre visite.',
    makersNote: 'Note de l’artisan',
    watchNote: 'Mouvement suisse, réglé dans notre atelier et entretenu à vie par notre horloger.',
    remember: 'Nous retiendrons votre taille.',
    trustRent: { delivery: ['Messager assuré', 'livraison et reprise'], cover: ['Assurance', 'incluse'], fit: ['Ajustée', 'au salon'] },
    trustWatch: { service: ['Service', 'de cinq ans'], engrave: ['Gravure', 'du fond'] },
    breadcrumb: 'Fil d’Ariane',
    maison: 'Maison',
    ref: (id) => `Réf. ${id}`,
    hint: 'Laisser un indice',
    per: { weekend: 'par fin de semaine', week: 'par semaine', month: 'par mois' },
    deposit: 'Dépôt remboursable',
    insurance: 'assurance incluse',
    feeCovers: 'Ce que couvrent les frais',
    instalments: 'Ou 4 versements sans intérêt de',
    shopPay: 'avec Shop Pay',
    dutiesPrepaid: 'Droits prépayés',
    taxesAtCheckout: 'Taxes calculées au paiement',
    fullBreakdown: 'Voir le détail complet des coûts',
    rentalPeriod: 'Période de location',
    metal: 'Métal',
    reverseEngraving: 'Gravure au verso',
    engraving: 'Gravure',
    optional: 'facultative',
    complimentary: 'offerte',
    engravingPlaceholder: 'Des initiales, une date, un mot',
    yourEngraving: 'Votre gravure',
    jeweller: 'Demander à un joaillier',
    trust: {
      CAD: ['Livraison assurée', 'offerte au Canada'],
      USD: ['Droits payés', 'livraison aux É.-U.'],
      care: ['Garantie', 'et entretien à vie'],
      gift: ['Écrin', 'signature'],
    },
    giaReport: 'Rapport de classement du diamant',
    reportNo: 'Rapport n°',
    gia: { shape: 'Forme', carat: 'Carat', color: 'Couleur', clarity: 'Pureté', cut: 'Taille' },
    details: 'Détails et dimensions',
    reference: 'Référence',
    care: 'Entretien et service',
    careText: 'Rangez-la à part, dans la pochette fournie. Retirez-la avant de vous baigner ou d’appliquer une lotion. Apportez-la à notre salon chaque année : nettoyage aux ultrasons, inspection des griffes et polissage vous sont offerts.',
    shipTitle: { CAD: 'Livraison et retours · Canada', USD: 'Livraison et retours · États-Unis' },
    giftTitle: 'Présentation cadeau',
    giftText: 'Chaque pièce arrive dans notre écrin travertin signature, avec une pochette de lin, une carte d’entretien et, si vous le souhaitez, un mot écrit à la main. Les reçus-cadeaux n’indiquent jamais les prix.',
    filmsEyebrow: 'Voir et magasiner',
    filmsTitle: 'En <em>mouvement</em>',
    alsoIn: (name) => `Également dans <em>${name}</em>`,
    viewAll: 'Tout voir',
  },
)

/** A piece: its gallery and configurator with three doors (the bag, a visit, a jeweller), Own or Rent when it can be
 *  rented, then its story, reviews, films, the look, its itemized price, questions and a visit to see it. `mode` comes
 *  from the address (`?mode=rent`, or `own` for a vault piece, which opens on renting). */
export default function Product({ slug, mode: asked }: { slug: string; mode?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const { currency, addToCart, recent, recordView, cart, setCartOpen, replaceQuery, openAsk, profile, setProfile } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const product = getProduct(slug)
  const [metal, setMetal] = useState<Metal | undefined>(product?.metals[0])
  const [added, setAdded] = useState(false)
  // The same piece, two ways: bought, or rented for a weekend, a week or a month.
  const [mode, setMode] = useState<'own' | 'rent'>(() => (product && isRentable(product) && (asked === 'rent' || (rentFirst(product) && asked !== 'own')) ? 'rent' : 'own'))
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [period, setPeriod] = useState<RentalPeriod>('weekend')
  const [engraving, setEngraving] = useState('')
  // A ring opens on the size the visitor gave before (kept on this device).
  const [size, setSize] = useState<string | undefined>(() => (product && needsSize(product) ? profile.ringSize : undefined))
  const [sizeError, setSizeError] = useState(false)
  const [booking, setBooking] = useState<Partial<RentalBooking>>({ method: 'courier' })
  const [bookingError, setBookingError] = useState(false)
  const [personal, setPersonal] = useState<Personalization>(() => ({
    text: '',
    font: product?.personalization?.fonts[0] ?? 'serif',
    chainLength: product?.personalization?.chainLengths?.[1] ?? product?.personalization?.chainLengths?.[0],
  }))
  const [personalError, setPersonalError] = useState(false)
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMetal(product?.metals[0])
    setEngraving('')
    setSizeError(false)
  }, [slug, product])

  // Snapshot history before recording this view so the section is stable while browsing.
  const [hadHistory] = useState(() => recent.some((s) => s !== slug))
  useEffect(() => {
    if (product) recordView(product.slug)
  }, [product, recordView])

  useReveal(root, [slug])

  // The details rise in as the page is uncovered (after the splash or a page transition).
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    return onStageClear(() => {
      const ctx = gsap.context(() => {
        gsap.from('[data-pdp-in]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.1 })
      }, root)
      return () => ctx.revert()
    })
  }, [slug])

  useEffect(() => {
    if (!added) return
    const id = window.setTimeout(() => setAdded(false), 2200)
    return () => window.clearTimeout(id)
  }, [added])

  if (!product) {
    return <p className="font-serif-editorial py-40 text-center text-4xl">{t.missing}</p>
  }

  const category = getCategory(product.category)!
  const copy = catalog.product(product)
  const chapterName = catalog.category(category).name
  const related = getProductsByCategory(product.category).filter((p) => p.slug !== slug)
  const rentable = isRentable(product)
  const rental = mode === 'rent' ? product.rental : undefined
  const sized = needsSize(product)
  const pcfg = product.personalization
  const amount = rental ? rental[period][currency] : priceFor(product, currency, metal) + personalizationPrice(product, pcfg ? personal : undefined, currency)
  const ctaLabel = rental ? common.reserve : product.category === 'custom' ? common.commission : common.addToBag
  // The address keeps Own or Rent when it differs from how the piece opens by default, so links and reloads keep it.
  const switchMode = (next: 'own' | 'rent') => {
    setMode(next)
    setBookingError(false)
    setSizeError(false)
    setPersonalError(false)
    replaceQuery(next === (rentFirst(product) ? 'rent' : 'own') ? {} : { mode: next })
  }
  const visit: VisitRequest = { purpose: purposeFor(product, !!rental), pieces: [{ slug: product.slug, metal: rental ? undefined : metal, size: sized ? size : undefined, rent: !!rental || undefined }] }
  const visitLabel = rental ? t.fitting : product.category === 'custom' ? t.consultation : t.visit
  const isWatch = product.type === 'watch'
  const detail = [
    rental ? common.rentalLabel[period] : metal && catalog.metal(metal),
    rental && booking.start && t.from(formatDay(parseIso(booking.start))),
    pcfg && personal.text.trim() && common.quote(personal.text.trim()),
    size && common.size(sizeLabel(size)),
  ].filter(Boolean).join(' · ')

  // Shares carry the piece as configured right now; hints are for pieces one can buy, not rentals.
  const share: ShareSubject = {
    kind: 'piece',
    id: product.slug,
    title: copy.name,
    eyebrow: t.eyebrow(copy.collection, category.eyebrow),
    image: product.images[0],
    route: href.product(product.slug, !!rental),
    detail,
    priceText: `${formatPrice(amount, currency)} ${currency}`,
    tagline: copy.tagline,
    hint: rental ? undefined : { metal: metal && catalog.metal(metal), size: size && sizeLabel(size) },
  }

  // Films featuring this piece first, then others from its category.
  const films = [...videosForProduct(product.slug), ...videosForCategory(product.category).filter((v) => !v.products.includes(product.slug))]

  // Number the lower sections in the order they actually render, so hidden ones never leave gaps. They run by how
  // much each helps the decision: the story, what clients say, the diamond (for a ring), then the rest.
  const engagement = product.type === 'engagement'
  const sectionOrder = [
    'story',
    'reviews',
    engagement && 'diamond',
    films.length > 0 && 'films',
    getLookPieces(product, !!rental).length > 0 && 'look',
    hasCostBreakdown(product) && 'pricing',
    'faq',
    related.length > 0 && 'related',
    hadHistory && 'recent',
  ].filter(Boolean) as string[]
  const num = (id: string) => String(sectionOrder.indexOf(id) + 1).padStart(2, '0')

  const configured = {
    slug: product.slug,
    metal: rental ? undefined : metal,
    rental: rental ? period : undefined,
    engraving: rental ? undefined : engraving.trim() || undefined,
    size: sized && !rental ? size : undefined,
    booking: rental ? (booking as RentalBooking) : undefined,
    personalization: pcfg && !rental ? { ...personal, text: personal.text.trim() } : undefined,
  }
  const inBag = cart.some((l) => l.key === lineKey(configured))

  // Adds the piece as configured, or shows the first missing choice. True when it went into the bag.
  const handleAdd = () => {
    const bookingOk = !rental || isBookingValid(product.slug, period, booking)
    const personalOk = !pcfg || !!rental || validatePersonalization(pcfg, personal.text) === null
    const sizeOk = !sized || !!rental || !!size
    setBookingError(!bookingOk)
    setPersonalError(!personalOk)
    setSizeError(!sizeOk)
    if (!bookingOk || !personalOk || !sizeOk) {
      const target = !bookingOk ? 'step-dates' : !personalOk ? 'step-personal' : 'step-size'
      const el = document.getElementById(target)
      const lenis = getLenis()
      if (el && lenis) lenis.scrollTo(el, { offset: -140 })
      else el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    addToCart(configured)
    setAdded(true)
    return true
  }

  // Once this exact configuration is in the bag, the CTA becomes "Go to bag".
  const onCta = () => {
    if (inBag) setCartOpen(true)
    else handleAdd()
  }

  const scrollToId = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  // The itemized price opens before the page glides to it.
  const openBreakdown = () => {
    setBreakdownOpen(true)
    requestAnimationFrame(() => scrollToId('price-breakdown'))
  }

  const scrollToReviews = () => {
    const el = document.getElementById('reviews')
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  const { rating, count } = getRatingSummary(product.slug)
  const availability = rental ? t.available : product.leadTimeWeeks ? t.madeToOrder(product.leadTimeWeeks) : t.inStock

  // Personalized pieces keep the plain engraving field only for the reverse side.
  const showEngraving = !!product.engravable && !rental && (!pcfg || !!pcfg.backEngraving)

  // Configurator steps, numbered in the order they render.
  const steps = [
    rental && 'period',
    rental && 'dates',
    !rental && product.metals.length > 0 && 'metal',
    !rental && pcfg && 'personal',
    !rental && sized && 'size',
    showEngraving && 'engraving',
  ].filter(Boolean) as string[]
  const stepNo = (id: string) => String(steps.indexOf(id) + 1).padStart(2, '0')
  const stepLabel = 'mb-4 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.22em]'
  const stepNum = 'font-spec mr-3 text-[10px] text-[var(--gold-ink)]'
  const metalSwatch = metal ? METALS[metal].swatch : '#D4B982'

  const shipCopy = t.ship[currency]
  // The GIA box shows the short form: the shape's first word, the cut's grade.
  const short = (value: string) => (value === 'Round Brilliant' && catalog.gia(value) !== value ? 'Rond' : catalog.gia(value).split(' ')[0])


  return (
    <div ref={root}>
      {/* Breadcrumb bar */}
      <div className="border-b border-[var(--border-hairline)]">
        <div className="font-spec mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)] lg:px-12">
          <nav aria-label={t.breadcrumb} className="flex min-w-0 items-center gap-3">
            <a href={href.home} className="hover:text-[var(--text-espresso)]">{t.maison}</a>
            <span>/</span>
            <a href={href.category(category.slug)} className="shrink-0 hover:text-[var(--text-espresso)]">{chapterName}</a>
            <span>/</span>
            <span className="truncate text-[var(--text-espresso)]">{copy.name}</span>
          </nav>
          <span className="hidden shrink-0 sm:inline">{t.ref(product.id.toUpperCase())}</span>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1600px] gap-12 px-6 py-10 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-14">
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-32">
            <Gallery product={product} />
          </div>
        </div>

        <div className="lg:col-span-5">
          {/* Header */}
          <div data-pdp-in className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-vermeil)]" /> {availability}
            </span>
            <div className="flex items-center gap-6">
              {share.hint && <ShareButton subject={share} mode="hint" label={t.hint} icon={Gift} />}
              <ShareButton subject={share} />
            </div>
          </div>
          <p data-pdp-in className="font-spec mt-8 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">
            {t.eyebrow(copy.collection, category.eyebrow)}
          </p>
          <h1 data-pdp-in className="font-serif-editorial mt-4 text-balance text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-[3.75rem] lg:text-[4.25rem]">
            {copy.name}
          </h1>
          <p data-pdp-in className="font-serif-editorial mt-4 text-2xl italic text-[var(--text-taupe)]">{copy.tagline}</p>
          <button data-pdp-in onClick={scrollToReviews} className="group mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
            <span className="flex gap-0.5 text-[var(--gold-vermeil)]">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={12} strokeWidth={1.2} className="fill-current" />)}
            </span>
            <span className="font-spec">{rating}</span>
            <span className="border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-taupe)] transition-colors group-hover:border-[var(--gold-vermeil)]">{common.reviews(count)}</span>
          </button>

          {/* Own or rent: the same piece, two ways */}
          {rentable && (
            <div data-pdp-in className="mt-8">
              <div role="radiogroup" aria-label={t.howLabel} className="grid grid-cols-2 border border-[var(--border-hairline)] p-1">
                {(['own', 'rent'] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => switchMode(m)} className={`flex flex-col items-center gap-1 py-3 transition-colors ${mode === m ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`}>
                    <span className="text-[11px] uppercase tracking-[0.22em]">{m === 'own' ? t.own : t.rent}</span>
                    <span className="text-xs">{m === 'own' ? <Price amount={openingPrice(product, currency)} className="[&_span]:hidden" /> : <>{common.from} <Price amount={product.rental!.weekend[currency]} className="[&_span]:hidden" /> {common.perWeekend}</>}</span>
                  </button>
                ))}
              </div>
              {rental && <p className="mt-3 text-xs leading-relaxed text-[var(--text-taupe)]">{house.rentalCredit}</p>}
            </div>
          )}

          {/* Price */}
          <div data-pdp-in className="mt-10 border-y border-[var(--border-hairline)] py-7">
            <div className="flex items-baseline justify-between gap-6">
              <Price amount={amount} className="text-[1.75rem] tracking-tight" />
              {rental && <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.per[period]}</span>}
            </div>
            <p className="mt-2 text-xs text-[var(--text-taupe)]">
              {rental ? (
                <>
                  {t.deposit} <Price amount={rental.deposit[currency]} className="text-[var(--text-espresso)]" /> · {t.insurance} ·{' '}
                  <button onClick={openBreakdown} className="border-b border-[var(--border-hairline)] text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)]">
                    {t.feeCovers}
                  </button>
                </>
              ) : (
                <>
                  {amount >= 400 && <>{t.instalments} <Price amount={Math.round(amount / 4)} className="text-[var(--text-espresso)]" /> {t.shopPay} · </>}
                  {currency === 'USD' ? t.dutiesPrepaid : t.taxesAtCheckout}
                  {hasCostBreakdown(product) && (
                    <>
                      {' · '}
                      <button onClick={openBreakdown} className="border-b border-[var(--border-hairline)] text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)]">
                        {t.fullBreakdown}
                      </button>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <p data-pdp-in className="mt-8 max-w-lg leading-[1.8] text-[var(--text-taupe)]">{copy.description}</p>

          {/* Configurator */}
          <div data-pdp-in className="mt-10 space-y-9">
            {rental && (
              <fieldset>
                <legend className={stepLabel}><span><span className={stepNum}>{stepNo('period')}</span>{t.rentalPeriod}</span></legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['weekend', 'week', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`border px-3 py-3.5 text-left transition-colors ${period === p ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.2em]">{common.periods[p]}</span>
                      <Price amount={rental[p][currency]} className={`mt-1 block text-xs ${period === p ? '[&_span]:text-white/60' : ''}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {rental && (
              <div id="step-dates">
                <RentalCalendar
                  slug={product.slug}
                  period={period}
                  step={stepNo('dates')}
                  value={booking}
                  error={bookingError}
                  onChange={(v) => {
                    setBooking(v)
                    setBookingError(false)
                  }}
                />
              </div>
            )}

            {!rental && product.metals.length > 0 && (
              <fieldset>
                <legend className={stepLabel}>
                  <span><span className={stepNum}>{stepNo('metal')}</span>{t.metal}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.metals.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetal(m)}
                      aria-pressed={metal === m}
                      className={`flex items-center gap-3 border py-2.5 pl-2.5 pr-4 text-[11px] tracking-[0.04em] transition-colors ${metal === m ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-linen)]'}`}
                    >
                      <span className="h-5 w-5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: `linear-gradient(135deg, ${METALS[m].swatch} 10%, #ffffffaa 45%, ${METALS[m].swatch} 85%)` }} />
                      {catalog.metal(m)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {!rental && pcfg && (
              <div id="step-personal">
                <Personalizer
                  product={product}
                  value={personal}
                  step={stepNo('personal')}
                  metalSwatch={metalSwatch}
                  showError={personalError}
                  onChange={(v) => {
                    setPersonal(v)
                    setPersonalError(false)
                  }}
                />
              </div>
            )}

            {!rental && sized && (
              <div id="step-size">
              <RingSize
                step={stepNo('size')}
                value={size}
                error={sizeError}
                onChange={(s) => {
                  setSize(s)
                  setSizeError(false)
                  setProfile({ ringSize: s })
                }}
              />
              {size && size === profile.ringSize && <p className="mt-2 text-xs text-[var(--text-taupe)]">{t.remember}</p>}
              </div>
            )}

            {showEngraving && (
              <div>
                <label htmlFor="engraving" className={stepLabel}>
                  <span><span className={stepNum}>{stepNo('engraving')}</span>{pcfg ? t.reverseEngraving : t.engraving} <span className="normal-case tracking-normal text-[var(--text-taupe)]">— {pcfg ? t.optional : t.complimentary}</span></span>
                  <span className="font-spec text-[10px] text-[var(--text-taupe)]">{engraving.length}/18</span>
                </label>
                <input
                  id="engraving"
                  value={engraving}
                  maxLength={18}
                  onChange={(e) => setEngraving(e.target.value)}
                  placeholder={t.engravingPlaceholder}
                  className="w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[var(--text-taupe)] focus:border-[var(--text-espresso)]"
                />
                {/* Live preview on a band tinted to the chosen metal */}
                <div
                  className="mt-2 flex h-14 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: `linear-gradient(180deg, #ffffff99 0%, ${metalSwatch} 35%, ${metalSwatch} 65%, #00000022 100%)` }}
                  aria-hidden
                >
                  <span className="font-serif-editorial truncate px-6 text-xl italic text-[#3b3226]/70 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">
                    {engraving || t.yourEngraving}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div data-pdp-in className="mt-10">
            <button
              ref={ctaRef}
              onClick={onCta}
              className={`group flex w-full items-center justify-center gap-3 py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors duration-500 ${added ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--text-espresso)] hover:bg-[var(--gold-vermeil)]'}`}
            >
              {added ? <><Check size={15} strokeWidth={1.6} /> {common.addedToBag}</> : inBag ? <><ShoppingBag size={15} strokeWidth={1.4} /> {common.goToBag} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></> : <>{ctaLabel} <span className="opacity-60">—</span> <Price amount={amount} className="[&_span]:text-white/50" /></>}
            </button>
            {/* The second door: a visit to see it, the same size as the first */}
            <div className={`mt-3 grid gap-3 ${tryOnKind(product) ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <VisitButton request={visit} className="w-full !px-3">{visitLabel}</VisitButton>
              {tryOnKind(product) && (
                <TryOnButton
                  product={product}
                  metal={metal}
                  text={pcfg && personal.text.trim() ? personal.text.trim() : undefined}
                  list={[product, ...related]}
                  className="h-full"
                />
              )}
            </div>
            <p className="mt-4 text-center text-xs leading-relaxed text-[var(--text-taupe)]">
              {rental ? t.readyRent : t.ready} · <button type="button" onClick={() => openAsk([product.slug])} className="inline-flex items-center gap-1.5 text-[var(--text-espresso)] underline decoration-[var(--gold-vermeil)] underline-offset-4"><MessageCircle size={12} strokeWidth={1.4} /> {t.jeweller}</button>
            </p>
            {engagement && <p className="mt-2 text-center text-xs text-[var(--text-taupe)]">{t.source}</p>}
          </div>

          {/* Maker's note: who made it, and where */}
          <div data-pdp-in className="mt-10 flex items-center gap-5 border-t border-[var(--border-hairline)] pt-7">
            {isWatch ? <Watch size={38} strokeWidth={0.9} className="shrink-0 text-[var(--gold-vermeil)]" /> : <Hallmark className="h-12 w-12 shrink-0 text-[var(--gold-vermeil)]" />}
            <p className="text-sm leading-relaxed text-[var(--text-taupe)]">
              <span className="font-spec block text-[10px] uppercase tracking-[0.24em] text-[var(--text-espresso)]">{t.makersNote}</span>
              {isWatch ? t.watchNote : <>{house.madeHere}. {house.hallmark}</>}
            </p>
          </div>

          {/* Trust row, in the terms of this piece: renting, a watch, or a piece to keep */}
          <ul data-pdp-in className="mt-8 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-center">
            {(rental
              ? ([[Truck, t.trustRent.delivery], [ShieldCheck, t.trustRent.cover], [Gift, t.trustRent.fit]] as const)
              : isWatch
                ? ([[Truck, t.trust[currency]], [ShieldCheck, t.trustWatch.service], [Gift, t.trustWatch.engrave]] as const)
                : ([[Truck, t.trust[currency]], [ShieldCheck, t.trust.care], [Gift, t.trust.gift]] as const)
            ).map(([Icon, [a, b]]) => (
              <li key={a} className="px-2 py-5">
                <Icon size={18} strokeWidth={1.2} className="mx-auto text-[var(--gold-vermeil)]" />
                <p className="mt-3 text-[10px] uppercase leading-relaxed tracking-[0.16em]">{a}<br /><span className="text-[var(--text-taupe)]">{b}</span></p>
              </li>
            ))}
          </ul>

          {product.gia && (
            <div data-pdp-in className="mt-10 border border-[var(--border-hairline)] p-1">
              <div className="border border-[var(--border-hairline)] bg-[var(--bg-silk)]/50 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-serif-editorial text-3xl tracking-[0.12em]">GIA</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{t.giaReport}</p>
                  </div>
                  <p className="font-spec text-right text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">
                    {t.reportNo}<br /><span className="text-xs text-[var(--gold-ink)]">{product.gia.reportNumber}</span>
                  </p>
                </div>
                <dl className="font-spec mt-6 grid grid-cols-5 divide-x divide-[var(--border-hairline)] border-t border-[var(--border-hairline)] pt-5 text-center">
                  {[[t.gia.shape, short(product.gia.shape)], [t.gia.carat, catalog.carat(product.gia)], [t.gia.color, product.gia.color], [t.gia.clarity, product.gia.clarity], [t.gia.cut, short(product.gia.cut)]].map(([k, v]) => (
                    <div key={k} className="px-1">
                      <dt className="text-[8px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{k}</dt>
                      <dd className="mt-1.5 truncate text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          <div data-pdp-in className="mt-10">
            <Accordion
              defaultOpen="details"
              items={[
                {
                  id: 'details',
                  title: t.details,
                  content: (
                    <dl className="divide-y divide-[var(--border-hairline)]">
                      {copy.specs.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-6 py-2.5">
                          <dt>{k}</dt>
                          <dd className="font-spec text-right text-xs">{v}</dd>
                        </div>
                      ))}
                      <div className="flex justify-between gap-6 py-2.5">
                        <dt>{t.reference}</dt>
                        <dd className="font-spec text-right text-xs uppercase">{product.id}</dd>
                      </div>
                    </dl>
                  ),
                },
                { id: 'care', title: t.care, content: t.careText },
                { id: 'ship', title: t.shipTitle[currency], content: shipCopy },
                { id: 'gift', title: t.giftTitle, content: t.giftText },
              ]}
            />
          </div>
        </div>
      </section>

      <CraftStory product={product} index={num('story')} />
      <Reviews product={product} index={num('reviews')} />
      {engagement && <FourCs index={num('diamond')} />}
      <ShoppableVideos
        videos={films}
        index={num('films')}
        eyebrow={t.filmsEyebrow}
        title={rich(t.filmsTitle, 'text-[var(--gold-vermeil)]')}
      />
      <CompleteTheLook product={product} index={num('look')} rent={!!rental} metal={metal} period={period} onPeriodChange={setPeriod} booking={booking} onAddMain={handleAdd} onNeedBooking={handleAdd} />
      {hasCostBreakdown(product) && (
        <PriceBreakdown
          product={product}
          index={num('pricing')}
          metal={metal}
          personalization={pcfg ? personal : undefined}
          period={period}
          rent={!!rental}
          open={breakdownOpen}
          onToggle={() => setBreakdownOpen((o) => !o)}
        />
      )}
      <ProductFAQ product={product} index={num('faq')} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1600px] border-t border-[var(--border-hairline)] px-6 py-28 lg:px-12 lg:py-36">
          <SectionHeader
            index={num('related')}
            eyebrow={common.chapter(category.eyebrow)}
            title={rich(t.alsoIn(chapterName), 'text-[var(--gold-vermeil)]')}
            aside={<a href={href.category(category.slug)} className="link-line">{t.viewAll}</a>}
          />
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      <RecentlyViewed exclude={product.slug} index={num('recent')} />
      <VisitBand pieces={visit.pieces} purpose={visit.purpose} />
      <StickyBar product={product} amount={amount} detail={detail} label={inBag ? common.goToBag : ctaLabel} target={ctaRef} onAction={onCta} visit={visit} rent={!!rental} />
    </div>
  )
}
