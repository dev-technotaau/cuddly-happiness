import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import type { Product } from '../../data/catalog'
import WishButton from '../WishButton'
import TryOnButton from '../tryon/TryOnButton'
import { videosForProduct } from '../../data/media'

interface View {
  src: string
  label: string
  /** Detail views reuse a photo, cropped tighter. */
  crop?: { scale: number; origin: string }
  video?: string
}

function buildViews(product: Product): View[] {
  const views: View[] = product.images.map((src, i) => ({ src, label: i === 0 ? 'Front' : i === 1 ? 'Styled' : `View ${i + 1}` }))
  views.push({ src: product.images[0], label: 'Detail', crop: { scale: 1.9, origin: '50% 45%' } })
  const film = videosForProduct(product.slug)[0]
  if (film) views.splice(1, 0, { src: film.poster, label: 'Film', video: film.src })
  return views
}

export default function Gallery({ product }: { product: Product }) {
  const views = buildViews(product)
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const zoomImg = useRef<HTMLImageElement>(null)
  const view = views[index]

  const go = useCallback((d: number) => setIndex((i) => (i + d + views.length) % views.length), [views.length])

  useEffect(() => {
    gsap.fromTo(stage.current?.querySelector('[data-stage-img]') ?? null, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' })
  }, [index])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, go])

  // Hover lens: magnify around the pointer.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || view.video || !zoomImg.current || !stage.current) return
    const r = stage.current.getBoundingClientRect()
    zoomImg.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`
  }

  const cropStyle = (v: View) => (v.crop ? { transform: `scale(${v.crop.scale})`, transformOrigin: v.crop.origin } : undefined)

  return (
    <div className="flex gap-4 lg:gap-5">
      {/* Thumbnail rail */}
      <div className="hidden w-[72px] shrink-0 flex-col gap-3 lg:flex">
        {views.map((v, i) => (
          <button
            key={v.label}
            onClick={() => setIndex(i)}
            aria-label={`Show ${v.label} view`}
            className={`relative aspect-[4/5] overflow-hidden transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
          >
            <img src={v.src} alt="" className="h-full w-full object-cover" style={cropStyle(v)} />
            {v.video && <span className="font-spec absolute inset-0 flex items-center justify-center bg-black/25 text-[9px] uppercase tracking-[0.2em] text-white">Film</span>}
            <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ${i === index ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div
          ref={stage}
          onPointerMove={onMove}
          onClick={() => setLightbox(true)}
          className={`group relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)] ${view.video ? 'cursor-pointer' : 'cursor-zoom-in'}`}
        >
          <div data-stage-img className="absolute inset-0 overflow-hidden">
            {view.video ? (
              <video key={view.video} src={view.video} poster={view.src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
            <div className="h-full w-full" style={cropStyle(view)}>
              <img
                ref={zoomImg}
                src={view.src}
                alt={`${product.name} — ${view.label}`}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:group-hover:scale-[1.8]"
              />
            </div>
            )}
          </div>

          {product.badges?.[0] && (
            <span className="font-spec absolute left-5 top-5 bg-[var(--bg-travertine)]/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] backdrop-blur">
              {product.badges[0]}
            </span>
          )}
          <div className="absolute right-5 top-5 z-10 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
            <WishButton slug={product.slug} size="lg" />
          </div>
          <div className="absolute left-5 top-16 z-10" onClick={(e) => e.stopPropagation()}>
            <TryOnButton product={product} variant="chip" />
          </div>

          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <span className="font-spec bg-[var(--bg-travertine)]/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur">
              {String(index + 1).padStart(2, '0')} / {String(views.length).padStart(2, '0')} · {view.label}
            </span>
            <div className="flex gap-2">
              {[[-1, ChevronLeft, 'Previous'], [1, ChevronRight, 'Next']].map(([d, Icon, l]) => {
                const I = Icon as typeof ChevronLeft
                return (
                  <button key={l as string} onClick={() => go(d as number)} aria-label={`${l} image`} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]">
                    <I size={16} strokeWidth={1.4} />
                  </button>
                )
              })}
              <button onClick={() => setLightbox(true)} aria-label="Full screen" className="hidden h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)] sm:flex">
                <Expand size={15} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dots */}
        <div className="mt-4 flex justify-center gap-2 lg:hidden">
          {views.map((v, i) => (
            <button key={v.label} onClick={() => setIndex(i)} aria-label={`Show ${v.label} view`} className={`h-px transition-all duration-500 ${i === index ? 'w-10 bg-[var(--text-espresso)]' : 'w-5 bg-[var(--border-hairline)]'}`} />
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[95] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)]" role="dialog" aria-modal="true" aria-label={`${product.name} gallery`} data-lenis-prevent>
          <div className="flex items-center justify-between px-6 py-5 lg:px-10">
            <p className="font-serif-editorial text-2xl">{product.name}</p>
            <button onClick={() => setLightbox(false)} aria-label="Close gallery" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)]">
              <X size={18} strokeWidth={1.3} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-16">
            <div className="h-full max-h-[78vh] aspect-[4/5] overflow-hidden">
              {view.video ? (
                <video key={view.video} src={view.video} poster={view.src} autoPlay controls loop playsInline className="h-full w-full object-cover" />
              ) : (
                <img src={view.src} alt="" className="h-full w-full object-cover" style={cropStyle(view)} />
              )}
            </div>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)] lg:left-10"><ChevronLeft size={18} strokeWidth={1.3} /></button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)] lg:right-10"><ChevronRight size={18} strokeWidth={1.3} /></button>
          </div>
          <p className="font-spec py-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/50">
            {String(index + 1).padStart(2, '0')} / {String(views.length).padStart(2, '0')} · {view.label}
          </p>
        </div>
      )}
    </div>
  )
}
