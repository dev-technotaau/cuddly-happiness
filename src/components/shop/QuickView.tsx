import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { METALS, isRentable, needsSize, pic, priceFor, quickAddable, rentFirst, type Metal, type Product } from '../../data/catalog'
import { purposeFor } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { href, lineKey, useStore } from '../../store'
import Price from '../Price'
import { getLenis } from '../SmoothScroll'
import WishButton from '../WishButton'
import TryOnButton from '../tryon/TryOnButton'
import VisitButton from '../visit/VisitButton'
import { btnPrimary } from '../ui'

const COPY = bilingual(
  {
    label: (name: string) => `Quick view: ${name}`,
    close: 'Close',
    previous: 'Previous photograph',
    next: 'Next photograph',
    photo: (i: number, n: number) => `Photograph ${i} of ${n}`,
    metal: 'Metal',
    gia: 'GIA report',
    made: (weeks: number) => `Made to order, in about ${weeks} weeks`,
    rentFrom: 'Or rent it from',
    weekend: 'a weekend',
    own: 'Or own it,',
    dates: 'Choose dates',
    personalize: 'Personalize this piece',
    options: 'Choose size & options',
    select: 'Select options',
    view: 'View the piece',
  },
  {
    label: (name) => `Aperçu : ${name}`,
    close: 'Fermer',
    previous: 'Photo précédente',
    next: 'Photo suivante',
    photo: (i, n) => `Photo ${i} sur ${n}`,
    metal: 'Métal',
    gia: 'Rapport GIA',
    made: (weeks) => `Faite sur commande, en ${weeks} semaines environ`,
    rentFrom: 'Ou louez-la dès',
    weekend: 'la fin de semaine',
    own: 'Ou à acheter,',
    dates: 'Choisir les dates',
    personalize: 'Personnaliser cette pièce',
    options: 'Choisir la taille et les options',
    select: 'Choisir les options',
    view: 'Voir la pièce',
  },
)

interface Props {
  product: Product
  /** The piece is shown to rent (its card led with the weekend rate). */
  rent: boolean
  onClose: () => void
}

/** A closer look at a piece without leaving the shop: its photographs, metals (each with its price), the GIA summary
 *  and key specs, then the same next step its page offers. A piece that needs choices first (a ring size, dates, a
 *  name, a commission) goes to its page for them; one that doesn't goes straight in the bag in the chosen metal, or
 *  says "Go to bag" when that exact piece is already there. A visit weighs as much as the bag. Any link to the piece
 *  carries the photograph on screen into its page. */
export default function QuickView({ product, rent, onClose }: Props) {
  const { currency, addToCart, cart, setCartOpen } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const copy = catalog.product(product)
  const [metal, setMetal] = useState<Metal | undefined>(product.metals[0])
  const [photo, setPhoto] = useState(0)
  const [shown, setShown] = useState(false)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const swipe = useRef<number | null>(null)
  const leaving = useRef(0)
  const photos = product.images
  const renting = rent && isRentable(product)

  // Close with a short fade (the links leave at once: the page transition takes over).
  const close = () => {
    if (leaving.current) return
    setShown(false)
    leaving.current = window.setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260)
  }
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const opener = document.activeElement
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focus = window.setTimeout(() => closeBtn.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    const onHash = () => onClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(focus)
      window.clearTimeout(leaving.current)
      lenis?.start()
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [onClose])

  const go = (step: number) => setPhoto((i) => (i + step + photos.length) % photos.length)
  const price = metal ? priceFor(product, currency, metal) : product.price[currency]
  const line = { slug: product.slug, metal }
  const inBag = cart.some((l) => l.key === lineKey(line))
  // A vault piece shown to own opens its page on owning (it opens on renting otherwise).
  const ownVault = !renting && rentFirst(product)
  const page = href.product(product.slug, renting, ownVault)
  // The step a piece's page asks for before the bag, named as the page names it.
  const configure = renting ? t.dates : ownVault ? t.view : product.personalization ? t.personalize : product.category === 'custom' ? common.commission : needsSize(product) ? t.options : t.select
  const gia = product.gia
  const specs = copy.specs.slice(0, 3)

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6 lg:p-10" role="dialog" aria-modal="true" aria-label={t.label(copy.name)}>
      <div onClick={close} aria-hidden className={`absolute inset-0 bg-[var(--bg-vault)]/55 backdrop-blur-[3px] transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'}`} />
      <div
        data-morph-scope
        onKeyDown={(e) => {
          if (photos.length < 2 || (e.target as HTMLElement).closest('input, [role="slider"]')) return
          if (e.key === 'ArrowLeft') go(-1)
          if (e.key === 'ArrowRight') go(1)
        }}
        className={`relative grid max-h-[94svh] w-full max-w-[1120px] overflow-hidden bg-[var(--bg-travertine)] shadow-[0_40px_120px_-40px_rgba(20,19,17,0.55)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:max-h-[min(860px,calc(100svh-3rem))] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] motion-reduce:translate-y-0 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
      >
        {/* The photographs: arrows, a swipe or the arrow keys */}
        <div
          className="relative aspect-[4/5] max-h-[46svh] w-full touch-pan-y overflow-hidden bg-[var(--bg-silk)] sm:max-h-none lg:aspect-auto lg:h-full lg:min-h-[560px]"
          onPointerDown={(e) => (swipe.current = e.clientX)}
          onPointerUp={(e) => {
            if (swipe.current === null) return
            const dx = e.clientX - swipe.current
            swipe.current = null
            if (Math.abs(dx) > 40 && photos.length > 1) go(dx < 0 ? 1 : -1)
          }}
        >
          {photos.map((src, i) => (
            <img key={src + i} {...pic(src, '(min-width: 1024px) 560px, 100vw')} alt={i === photo ? copy.name : ''} aria-hidden={i !== photo || undefined} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === photo ? 'z-[1] opacity-100' : 'opacity-0'}`} />
          ))}
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t.previous} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]"><ChevronLeft size={18} strokeWidth={1.3} /></button>
              <button type="button" onClick={() => go(1)} aria-label={t.next} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]"><ChevronRight size={18} strokeWidth={1.3} /></button>
              <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2" role="group" aria-label={t.photo(photo + 1, photos.length)}>
                {photos.map((_, i) => (
                  <button key={i} type="button" onClick={() => setPhoto(i)} aria-label={t.photo(i + 1, photos.length)} aria-pressed={i === photo} className="flex h-6 w-6 items-center justify-center">
                    <span className={`h-1.5 rounded-full transition-all duration-500 ${i === photo ? 'w-5 bg-[var(--bg-travertine)]' : 'w-1.5 bg-[var(--bg-travertine)]/60'}`} />
                  </button>
                ))}
              </div>
            </>
          )}
          {product.badges?.[0] && <span className="font-spec absolute left-4 top-4 z-10 bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">{catalog.badge(product.badges[0])}</span>}
        </div>

        {/* The piece */}
        <div className="relative flex min-h-0 flex-col overflow-y-auto overscroll-contain" data-lenis-prevent>
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-10">
            <p className="font-spec pt-3 text-[10px] uppercase tracking-[0.26em] text-[var(--gold-ink)]">{copy.collection} · {catalog.category(product.category).name}</p>
            <button ref={closeBtn} type="button" onClick={close} aria-label={t.close} className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center transition-colors hover:text-[var(--gold-vermeil)]"><X size={20} strokeWidth={1.3} /></button>
          </div>
          <div className="flex flex-1 flex-col px-6 pb-8 sm:px-10 sm:pb-10">
            <h2 className="font-serif-editorial text-4xl font-light leading-[1.02] tracking-[-0.01em] lg:text-5xl">
              <a href={page} onClick={onClose} className="transition-colors hover:text-[var(--gold-vermeil)]">{copy.name}</a>
            </h2>
            <p className="font-serif-editorial mt-3 text-lg italic text-[var(--text-taupe)]">{copy.tagline}</p>

            <div className="mt-6 border-t border-[var(--border-hairline)] pt-6">
              {renting && product.rental ? (
                <>
                  <p className="text-xl"><span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{common.from}</span><Price amount={product.rental.weekend[currency]} /> <span className="text-sm text-[var(--text-taupe)]">{common.perWeekend}</span></p>
                  <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.own} <Price amount={price} className="[&_span]:hidden" /></p>
                </>
              ) : (
                <>
                  <p className="text-xl"><Price amount={price} /></p>
                  {isRentable(product) && <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.rentFrom} <Price amount={product.rental!.weekend[currency]} className="[&_span]:hidden" /> {t.weekend}</p>}
                </>
              )}
            </div>

            {product.metals.length > 0 && !renting && (
              <div className="mt-6">
                <p id="qv-metal" className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{t.metal} <span className="ml-2 normal-case tracking-normal text-[var(--text-espresso)]">{metal && catalog.metal(metal)}</span></p>
                <div role="group" aria-labelledby="qv-metal" className="mt-3 flex flex-wrap gap-2.5">
                  {product.metals.map((m) => (
                    <button key={m} type="button" aria-pressed={m === metal} aria-label={catalog.metal(m)} title={catalog.metal(m)} onClick={() => setMetal(m)} className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ${m === metal ? 'border-[var(--text-espresso)]' : 'border-transparent hover:border-[var(--border-hairline)]'}`}>
                      <span className="h-7 w-7 rounded-full ring-1 ring-[var(--border-hairline)]" style={{ background: METALS[m].swatch }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(gia || specs.length > 0) && (
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t border-[var(--border-hairline)] pt-6 text-sm">
                {gia && (
                  <div className="contents">
                    <dt className="text-[var(--text-taupe)]">{t.gia}</dt>
                    <dd className="font-spec">{catalog.gia(gia.shape)} · {catalog.carat(gia)} ct · {gia.color} · {gia.clarity}</dd>
                  </div>
                )}
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-[var(--text-taupe)]">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {product.leadTimeWeeks && <p className="mt-4 text-sm text-[var(--text-taupe)]">{t.made(product.leadTimeWeeks)}</p>}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {inBag && !renting ? (
                <button type="button" onClick={() => { onClose(); setCartOpen(true) }} className={btnPrimary}>{common.goToBag}</button>
              ) : quickAddable(product) && !renting ? (
                <button type="button" onClick={() => { onClose(); addToCart({ ...line }) }} className={btnPrimary}>{common.addToBag} <span aria-hidden="true">—</span> <Price amount={price} className="[&_span]:hidden" /></button>
              ) : (
                <a href={page} onClick={onClose} className={btnPrimary}>{configure}</a>
              )}
              <VisitButton request={{ purpose: purposeFor(product, renting), pieces: [{ slug: product.slug, metal: renting ? undefined : metal, rent: renting || undefined }] }} onBefore={onClose} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <WishButton slug={product.slug} className="border border-[var(--border-hairline)]" />
                <TryOnButton product={product} metal={metal} variant="link" />
              </div>
              {!ownVault && <a href={page} onClick={onClose} className="link-line">{t.view} <ArrowRight size={14} strokeWidth={1.4} /></a>}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
