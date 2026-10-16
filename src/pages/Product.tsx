import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowRight, CalendarHeart, Check, Gift, MessageCircle, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react'
import { METALS, formatDay, formatPrice, getCategory, getProduct, getProductsByCategory, parseIso, personalizationPrice, priceFor, validatePersonalization, type Metal, type Personalization, type RentalBooking } from '../data/catalog'
import { href, lineKey, useStore } from '../store'
import Price from '../components/Price'
import ProductCard from '../components/ProductCard'
import useReveal from '../components/useReveal'
import Gallery from '../components/pdp/Gallery'
import { getLenis } from '../components/SmoothScroll'
import SectionHeader from '../components/home/SectionHeader'
import Accordion from '../components/pdp/Accordion'
import RingSize from '../components/pdp/RingSize'
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

type RentalPeriod = 'weekend' | 'week' | 'month'

export default function Product({ slug }: { slug: string }) {
  const root = useRef<HTMLDivElement>(null)
  const { currency, addToCart, recent, recordView, cart, setCartOpen } = useStore()
  const product = getProduct(slug)
  const [metal, setMetal] = useState<Metal | undefined>(product?.metals[0])
  const [added, setAdded] = useState(false)
  const [period, setPeriod] = useState<RentalPeriod>('weekend')
  const [engraving, setEngraving] = useState('')
  const [size, setSize] = useState<string | undefined>()
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
    setSize(undefined)
    setSizeError(false)
  }, [slug, product])

  // Snapshot history before recording this view so the section is stable while browsing.
  const [hadHistory] = useState(() => recent.some((s) => s !== slug))
  useEffect(() => {
    if (product) recordView(product.slug)
  }, [product, recordView])

  useReveal(root, [slug])

  useLayoutEffect(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('[data-pdp-in]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.1 })
    }, root)
    return () => ctx.revert()
  }, [slug])

  useEffect(() => {
    if (!added) return
    const id = window.setTimeout(() => setAdded(false), 2200)
    return () => window.clearTimeout(id)
  }, [added])

  if (!product) {
    return <p className="font-serif-editorial py-40 text-center text-4xl">This piece has returned to the vault.</p>
  }

  const category = getCategory(product.category)!
  const related = getProductsByCategory(product.category).filter((p) => p.slug !== slug)
  const rental = product.rental
  const needsSize = product.category === 'rings' || product.category === 'bridal'
  const pcfg = product.personalization
  const amount = rental ? rental[period][currency] : priceFor(product, currency, metal) + personalizationPrice(product, pcfg ? personal : undefined, currency)
  const ctaLabel = rental ? 'Reserve this piece' : product.category === 'custom' ? 'Begin commission' : 'Add to bag'
  const detail = [
    rental ? `${period} rental` : metal && METALS[metal].label,
    rental && booking.start && `From ${formatDay(parseIso(booking.start))}`,
    pcfg && personal.text.trim() && `“${personal.text.trim()}”`,
    size && `Size ${size}`,
  ].filter(Boolean).join(' · ')

  // Shares carry the piece as configured right now; hints are for pieces one can buy, not rentals.
  const share: ShareSubject = {
    kind: 'piece',
    id: product.slug,
    title: product.name,
    eyebrow: `${product.collection} · Chapter ${category.eyebrow}`,
    image: product.images[0],
    route: href.product(product.slug),
    detail,
    priceText: `${formatPrice(amount, currency)} ${currency}`,
    tagline: product.tagline,
    hint: rental ? undefined : { metal: metal && METALS[metal].label, size },
  }

  // Films featuring this piece first, then others from its category.
  const films = [...videosForProduct(product.slug), ...videosForCategory(product.category).filter((v) => !v.products.includes(product.slug))]

  // Number the lower sections in the order they actually render, so hidden ones never leave gaps.
  const sectionOrder = [
    hasCostBreakdown(product) && 'pricing',
    'story',
    films.length > 0 && 'films',
    getLookPieces(product).length > 0 && 'look',
    'reviews',
    'faq',
    related.length > 0 && 'related',
    hadHistory && 'recent',
  ].filter(Boolean) as string[]
  const num = (id: string) => String(sectionOrder.indexOf(id) + 1).padStart(2, '0')

  const configured = {
    slug: product.slug,
    metal: rental ? undefined : metal,
    rental: rental ? period : undefined,
    engraving: engraving.trim() || undefined,
    size: needsSize ? size : undefined,
    booking: rental ? (booking as RentalBooking) : undefined,
    personalization: pcfg ? { ...personal, text: personal.text.trim() } : undefined,
  }
  const inBag = cart.some((l) => l.key === lineKey(configured))

  const handleAdd = () => {
    const bookingOk = !rental || isBookingValid(product.slug, period, booking)
    const personalOk = !pcfg || validatePersonalization(pcfg, personal.text) === null
    const sizeOk = !needsSize || !!size
    setBookingError(!bookingOk)
    setPersonalError(!personalOk)
    setSizeError(!sizeOk)
    if (!bookingOk || !personalOk || !sizeOk) {
      const target = !bookingOk ? 'step-dates' : !personalOk ? 'step-personal' : 'step-size'
      const el = document.getElementById(target)
      const lenis = getLenis()
      if (el && lenis) lenis.scrollTo(el, { offset: -140 })
      else el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    addToCart(configured)
    setAdded(true)
  }

  // Once this exact configuration is in the bag, the CTA becomes "Go to bag".
  const onCta = () => (inBag ? setCartOpen(true) : handleAdd())

  const scrollToId = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToReviews = () => {
    const el = document.getElementById('reviews')
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -120 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  const { rating, count } = getRatingSummary(product.slug)
  const availability = rental
    ? 'Available for reservation · fitted in salon'
    : product.leadTimeWeeks
      ? `Made to order · approx. ${product.leadTimeWeeks} weeks`
      : 'In stock · ships within 48 hours'

  // Personalized pieces keep the plain engraving field only for the reverse side.
  const showEngraving = !!product.engravable && !rental && (!pcfg || !!pcfg.backEngraving)

  // Configurator steps, numbered in the order they render.
  const steps = [
    rental && 'period',
    rental && 'dates',
    !rental && product.metals.length > 0 && 'metal',
    pcfg && 'personal',
    needsSize && 'size',
    showEngraving && 'engraving',
  ].filter(Boolean) as string[]
  const stepNo = (id: string) => String(steps.indexOf(id) + 1).padStart(2, '0')
  const stepLabel = 'mb-4 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.22em]'
  const stepNum = 'font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]'
  const metalSwatch = metal ? METALS[metal].swatch : '#D4B982'

  const shipCopy =
    currency === 'CAD'
      ? 'Complimentary insured shipping across Canada, 2–3 business days, signature required. Returns accepted within 30 days on non-personalized pieces.'
      : 'Complimentary insured shipping to the United States, 3–5 business days. Duties and import fees are prepaid — nothing due on delivery. 30-day returns on non-personalized pieces.'


  return (
    <div ref={root}>
      {/* Breadcrumb bar */}
      <div className="border-b border-[var(--border-hairline)]">
        <div className="font-spec mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-linen)] lg:px-12">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-3">
            <a href={href.home} className="hover:text-[var(--text-espresso)]">Maison</a>
            <span>/</span>
            <a href={href.category(category.slug)} className="hover:text-[var(--text-espresso)]">{category.name}</a>
            <span>/</span>
            <span className="truncate text-[var(--text-espresso)]">{product.name}</span>
          </nav>
          <span className="hidden shrink-0 sm:inline">Ref. {product.id.toUpperCase()}</span>
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
              {share.hint && <ShareButton subject={share} mode="hint" label="Drop a hint" icon={Gift} />}
              <ShareButton subject={share} />
            </div>
          </div>
          <p data-pdp-in className="font-spec mt-8 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">
            {product.collection} · Chapter {category.eyebrow}
          </p>
          <h1 data-pdp-in className="font-serif-editorial mt-4 text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-[3.75rem] lg:text-[4.25rem]">
            {product.name}
          </h1>
          <p data-pdp-in className="font-serif-editorial mt-4 text-2xl italic text-[var(--text-taupe)]">{product.tagline}</p>
          <button data-pdp-in onClick={scrollToReviews} className="group mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
            <span className="flex gap-0.5 text-[var(--gold-vermeil)]">
              {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={12} strokeWidth={1.2} className="fill-current" />)}
            </span>
            <span className="font-spec">{rating}</span>
            <span className="border-b border-[var(--border-hairline)] pb-0.5 text-[var(--text-taupe)] transition-colors group-hover:border-[var(--gold-vermeil)]">{count} reviews</span>
          </button>

          {/* Price */}
          <div data-pdp-in className="mt-10 border-y border-[var(--border-hairline)] py-7">
            <div className="flex items-baseline justify-between gap-6">
              <Price amount={amount} className="text-[1.75rem] tracking-tight" />
              {rental && <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">per {period === 'weekend' ? 'weekend' : period}</span>}
            </div>
            <p className="mt-2 text-xs text-[var(--text-taupe)]">
              {rental ? (
                <>
                  Refundable deposit <Price amount={rental.deposit[currency]} className="text-[var(--text-espresso)]" /> · insurance included ·{' '}
                  <button onClick={() => scrollToId('price-breakdown')} className="border-b border-[var(--border-hairline)] text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)]">
                    What the fee covers
                  </button>
                </>
              ) : (
                <>
                  {amount >= 400 && <>Or 4 interest-free payments of <Price amount={Math.round(amount / 4)} className="text-[var(--text-espresso)]" /> with Shop Pay · </>}
                  {currency === 'USD' ? 'Duties prepaid' : 'Taxes calculated at checkout'}
                  {hasCostBreakdown(product) && (
                    <>
                      {' · '}
                      <button onClick={() => scrollToId('price-breakdown')} className="border-b border-[var(--border-hairline)] text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)]">
                        See full cost breakdown
                      </button>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <p data-pdp-in className="mt-8 max-w-lg leading-[1.8] text-[var(--text-taupe)]">{product.description}</p>

          {/* Configurator */}
          <div data-pdp-in className="mt-10 space-y-9">
            {rental && (
              <fieldset>
                <legend className={stepLabel}><span><span className={stepNum}>{stepNo('period')}</span>Rental period</span></legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['weekend', 'week', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`border px-3 py-3.5 text-left transition-colors ${period === p ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.2em]">{p === 'weekend' ? 'Weekend' : p === 'week' ? 'One week' : 'One month'}</span>
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
                  <span><span className={stepNum}>{stepNo('metal')}</span>Metal</span>
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
                      {METALS[m].label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {pcfg && (
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

            {needsSize && (
              <div id="step-size">
              <RingSize
                step={stepNo('size')}
                value={size}
                error={sizeError}
                onChange={(s) => {
                  setSize(s)
                  setSizeError(false)
                }}
              />
              </div>
            )}

            {showEngraving && (
              <div>
                <label htmlFor="engraving" className={stepLabel}>
                  <span><span className={stepNum}>{stepNo('engraving')}</span>{pcfg ? 'Reverse engraving' : 'Engraving'} <span className="normal-case tracking-normal text-[var(--text-linen)]">— {pcfg ? 'optional' : 'complimentary'}</span></span>
                  <span className="font-spec text-[10px] text-[var(--text-linen)]">{engraving.length}/18</span>
                </label>
                <input
                  id="engraving"
                  value={engraving}
                  maxLength={18}
                  onChange={(e) => setEngraving(e.target.value)}
                  placeholder="Initials, a date, a word"
                  className="w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]"
                />
                {/* Live preview on a band tinted to the chosen metal */}
                <div
                  className="mt-2 flex h-14 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: `linear-gradient(180deg, #ffffff99 0%, ${metalSwatch} 35%, ${metalSwatch} 65%, #00000022 100%)` }}
                  aria-hidden
                >
                  <span className="font-serif-editorial truncate px-6 text-xl italic text-[#3b3226]/70 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">
                    {engraving || 'Your engraving'}
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
              {added ? <><Check size={15} strokeWidth={1.6} /> Added to bag</> : inBag ? <><ShoppingBag size={15} strokeWidth={1.4} /> Go to bag <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></> : <>{ctaLabel} <span className="opacity-40">—</span> <Price amount={amount} className="[&_span]:text-white/50" /></>}
            </button>
            <TryOnButton
              product={product}
              metal={metal}
              text={pcfg && personal.text.trim() ? personal.text.trim() : undefined}
              list={[product, ...related]}
              className="mt-3"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <a href={href.atelier} className="flex items-center justify-center gap-2 border border-[var(--border-hairline)] py-3.5 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-[var(--text-espresso)]">
                <CalendarHeart size={14} strokeWidth={1.3} /> Book a viewing
              </a>
              <a href={href.atelier} className="flex items-center justify-center gap-2 border border-[var(--border-hairline)] py-3.5 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-[var(--text-espresso)]">
                <MessageCircle size={14} strokeWidth={1.3} /> Ask a jeweller
              </a>
            </div>
          </div>

          {/* Trust row */}
          <ul data-pdp-in className="mt-10 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-center">
            {[
              [Truck, currency === 'CAD' ? 'Free insured' : 'Duties paid', currency === 'CAD' ? 'shipping in Canada' : 'shipping to the U.S.'],
              [ShieldCheck, 'Lifetime', 'warranty & care'],
              [Gift, 'Signature', 'gift presentation'],
            ].map(([Icon, a, b]) => {
              const I = Icon as typeof Truck
              return (
                <li key={a as string} className="px-2 py-5">
                  <I size={18} strokeWidth={1.2} className="mx-auto text-[var(--gold-vermeil)]" />
                  <p className="mt-3 text-[10px] uppercase leading-relaxed tracking-[0.16em]">{a as string}<br /><span className="text-[var(--text-linen)]">{b as string}</span></p>
                </li>
              )
            })}
          </ul>

          {product.gia && (
            <div data-pdp-in className="mt-10 border border-[var(--border-hairline)] p-1">
              <div className="border border-[var(--border-hairline)] bg-[var(--bg-silk)]/50 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-serif-editorial text-3xl tracking-[0.12em]">GIA</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">Diamond grading report</p>
                  </div>
                  <p className="font-spec text-right text-[10px] uppercase tracking-[0.16em] text-[var(--text-linen)]">
                    Report №<br /><span className="text-xs text-[var(--gold-vermeil)]">{product.gia.reportNumber}</span>
                  </p>
                </div>
                <dl className="font-spec mt-6 grid grid-cols-5 divide-x divide-[var(--border-hairline)] border-t border-[var(--border-hairline)] pt-5 text-center">
                  {Object.entries({ Shape: product.gia.shape.split(' ')[0], Carat: product.gia.carat.toFixed(2), Color: product.gia.color, Clarity: product.gia.clarity, Cut: product.gia.cut.split(' ')[0] }).map(([k, v]) => (
                    <div key={k} className="px-1">
                      <dt className="text-[8px] uppercase tracking-[0.18em] text-[var(--text-linen)]">{k}</dt>
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
                  title: 'Details & dimensions',
                  content: (
                    <dl className="divide-y divide-[var(--border-hairline)]">
                      {Object.entries(product.specs).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-6 py-2.5">
                          <dt>{k}</dt>
                          <dd className="font-spec text-right text-xs">{v}</dd>
                        </div>
                      ))}
                      <div className="flex justify-between gap-6 py-2.5">
                        <dt>Reference</dt>
                        <dd className="font-spec text-right text-xs uppercase">{product.id}</dd>
                      </div>
                    </dl>
                  ),
                },
                { id: 'care', title: 'Care & servicing', content: 'Store separately in the pouch provided. Remove before swimming or applying lotions. Bring it to our salon each year for complimentary ultrasonic cleaning, claw inspection and polishing.' },
                { id: 'ship', title: currency === 'CAD' ? 'Shipping & returns · Canada' : 'Shipping & returns · United States', content: shipCopy },
                { id: 'gift', title: 'Gift presentation', content: 'Every piece arrives in our signature travertine box with a linen pouch, care card and an optional handwritten note. Gift receipts never show prices.' },
              ]}
            />
          </div>
        </div>
      </section>

      {hasCostBreakdown(product) && (
        <PriceBreakdown
          product={product}
          index={num('pricing')}
          metal={metal}
          personalization={pcfg ? personal : undefined}
          period={period}
        />
      )}
      <CraftStory product={product} index={num('story')} />
      <ShoppableVideos
        videos={films}
        index={num('films')}
        eyebrow="Watch & shop"
        title={<>See it in <em className="text-[var(--gold-vermeil)]">motion</em></>}
      />
      <CompleteTheLook product={product} index={num('look')} period={period} onPeriodChange={setPeriod} booking={booking} onNeedBooking={handleAdd} />
      <Reviews product={product} index={num('reviews')} />
      <ProductFAQ product={product} index={num('faq')} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1600px] border-t border-[var(--border-hairline)] px-6 py-28 lg:px-12 lg:py-36">
          <SectionHeader
            index={num('related')}
            eyebrow={`Chapter ${category.eyebrow}`}
            title={<>Also in <em className="text-[var(--gold-vermeil)]">{category.name}</em></>}
            aside={<a href={href.category(category.slug)} className="link-line">View all</a>}
          />
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      <RecentlyViewed exclude={product.slug} index={num('recent')} />
      <StickyBar product={product} amount={amount} detail={detail} label={inBag ? 'Go to bag' : ctaLabel} target={ctaRef} onAction={onCta} />
    </div>
  )
}
