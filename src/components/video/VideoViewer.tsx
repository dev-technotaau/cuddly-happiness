import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Pause, Play, ShoppingBag, Volume2, VolumeX, X } from 'lucide-react'
import { priceFor } from '../../data/catalog'
import { videoProducts, type ShoppableVideo } from '../../data/media'
import { href, useStore } from '../../store'
import { getLenis } from '../SmoothScroll'
import Price from '../Price'
import TryOnButton from '../tryon/TryOnButton'

interface Props {
  videos: ShoppableVideo[]
  start: number
  onClose: () => void
}

/** Full-screen vertical player with tagged products, swipe/keys to move between films. */
export default function VideoViewer({ videos, start, onClose }: Props) {
  const { currency, addToCart } = useStore()
  const [i, setI] = useState(start)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [added, setAdded] = useState<string | null>(null)
  const el = useRef<HTMLVideoElement>(null)
  const touchY = useRef<number | null>(null)
  const video = videos[i]
  const products = videoProducts(video)

  const go = (d: number) => {
    setI((x) => (x + d + videos.length) % videos.length)
    setProgress(0)
    setPaused(false)
  }

  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(-1)
      if (e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  useEffect(() => {
    el.current?.play().catch(() => undefined)
  }, [i])

  const toggle = () => {
    const v = el.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => undefined)
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  const ctrl = 'flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/75'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-vault)]/95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={video.title} data-lenis-prevent>
      <div className="relative flex h-full w-full items-center justify-center gap-8 p-0 sm:p-6 lg:gap-12">
        <div
          className="relative aspect-[9/16] h-full max-h-full overflow-hidden bg-black sm:rounded-sm"
          onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (touchY.current === null) return
            const d = e.changedTouches[0].clientY - touchY.current
            if (Math.abs(d) > 60) go(d < 0 ? 1 : -1)
            touchY.current = null
          }}
        >
          <video
            key={video.id}
            ref={el}
            src={video.src}
            poster={video.poster}
            autoPlay
            muted={muted}
            playsInline
            loop
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            onClick={toggle}
            className="h-full w-full cursor-pointer object-cover"
          />

          {/* Progress segments */}
          <div className="absolute inset-x-3 top-3 flex gap-1">
            {videos.map((x, k) => (
              <span key={x.id} className="h-0.5 flex-1 overflow-hidden bg-white/25">
                <span className="block h-full bg-white" style={{ width: k < i ? '100%' : k === i ? `${progress * 100}%` : '0%' }} />
              </span>
            ))}
          </div>

          <div className="absolute left-4 top-8 text-white">
            <p className="font-mono-spec text-[10px] uppercase tracking-[0.2em] text-white/70">{video.handle}</p>
          </div>

          {paused && (
            <button onClick={toggle} aria-label="Play" className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
              <Play size={24} strokeWidth={1.4} className="ml-1 fill-current" />
            </button>
          )}

          <div className="absolute right-3 top-8 flex flex-col gap-2">
            <button onClick={onClose} aria-label="Close video" className={ctrl}><X size={18} strokeWidth={1.4} /></button>
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'} className={ctrl}>
              {muted ? <VolumeX size={17} strokeWidth={1.4} /> : <Volume2 size={17} strokeWidth={1.4} />}
            </button>
            <button onClick={toggle} aria-label={paused ? 'Play' : 'Pause'} className={ctrl}>
              {paused ? <Play size={16} strokeWidth={1.4} /> : <Pause size={16} strokeWidth={1.4} />}
            </button>
          </div>

          {/* Caption + products (mobile overlay; desktop shows the side panel instead) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-24 text-white lg:hidden">
            <p className="font-serif-editorial text-2xl">{video.title}</p>
            <p className="mt-1 text-sm text-white/70">{video.caption}</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {products.map((p) => (
                <a key={p.id} href={href.product(p.slug)} onClick={onClose} className="flex min-w-[220px] items-center gap-3 bg-white/95 p-2 pr-3 text-[var(--text-espresso)]">
                  <img src={p.images[0]} alt="" className="h-12 w-10 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="font-serif-editorial block truncate text-base leading-tight">{p.name}</span>
                    <Price amount={p.rental ? p.rental.weekend[currency] : priceFor(p, currency)} className="text-[11px]" />
                  </span>
                  <ShoppingBag size={15} strokeWidth={1.3} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop side panel */}
        <aside className="hidden w-[340px] shrink-0 text-[var(--bg-travertine)] lg:block">
          <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
            {String(i + 1).padStart(2, '0')} / {String(videos.length).padStart(2, '0')} · Shop the film
          </p>
          <h3 className="font-serif-editorial mt-4 text-4xl font-light leading-tight">{video.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{video.caption}</p>
          <ul className="mt-8 space-y-3">
            {products.map((p) => {
              const configurable = !!p.rental || !!p.personalization || p.category === 'rings' || p.category === 'bridal'
              return (
                <li key={p.id} className="border border-white/10 p-3">
                  <a href={href.product(p.slug)} onClick={onClose} className="group flex items-center gap-4">
                    <img src={p.images[0]} alt="" className="h-20 w-16 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="font-serif-editorial block truncate text-xl leading-tight group-hover:text-[var(--gold-champagne)]">{p.name}</span>
                      <Price amount={p.rental ? p.rental.weekend[currency] : priceFor(p, currency)} className="mt-1 block text-xs text-white/70 [&_span]:text-white/40" />
                    </span>
                  </a>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {configurable ? (
                      <a href={href.product(p.slug)} onClick={onClose} className="bg-[var(--gold-champagne)] py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--bg-vault)] hover:bg-white">
                        Select options
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          addToCart({ slug: p.slug, metal: p.metals[0] })
                          setAdded(p.slug)
                        }}
                        className="bg-[var(--gold-champagne)] py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--bg-vault)] hover:bg-white"
                      >
                        {added === p.slug ? 'Added' : 'Add to bag'}
                      </button>
                    )}
                    <TryOnButton product={p} variant="chip" label="Try on" className="!w-full justify-center !rounded-none !bg-transparent !text-white ring-1 ring-white/20 hover:!bg-white/10" />
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-8 flex gap-2">
            <button onClick={() => go(-1)} aria-label="Previous film" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)]"><ChevronUp size={18} strokeWidth={1.3} /></button>
            <button onClick={() => go(1)} aria-label="Next film" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)]"><ChevronDown size={18} strokeWidth={1.3} /></button>
          </div>
        </aside>
      </div>
    </div>
  )
}
