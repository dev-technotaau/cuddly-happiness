import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { priceFor } from '../../data/catalog'
import { videoProducts, type ShoppableVideo } from '../../data/media'
import { useStore } from '../../store'
import Price from '../Price'
import SectionHeader from '../home/SectionHeader'
import useInViewPlay from './useInViewPlay'
import VideoViewer from './VideoViewer'

function Tile({ video, onOpen, index }: { video: ShoppableVideo; onOpen: () => void; index: number }) {
  const { currency } = useStore()
  const ref = useRef<HTMLVideoElement>(null)
  useInViewPlay(ref)
  const [first, ...rest] = videoProducts(video)

  return (
    <button onClick={onOpen} data-reveal={(index % 4) * 0.06} className="group relative aspect-[9/16] w-[62vw] shrink-0 snap-start overflow-hidden bg-[var(--bg-vault)] text-left sm:w-[38vw] lg:w-[19vw] lg:min-w-[240px]">
      <video ref={ref} src={video.preview} poster={video.poster} muted loop playsInline preload="none" className="editorial-zoom h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
      <span className="font-spec absolute left-3 top-3 text-[10px] uppercase tracking-[0.18em] text-white/85">{video.handle}</span>
      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-[var(--text-espresso)]">
        <Play size={12} strokeWidth={1.5} className="ml-0.5 fill-current" />
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <p className="font-serif-editorial text-xl leading-tight text-white">{video.title}</p>
        {first && (
          <div className="mt-3 flex items-center gap-2.5 bg-[var(--bg-travertine)]/95 p-1.5 pr-3 text-[var(--text-espresso)] backdrop-blur">
            <img src={first.images[0]} alt="" className="h-10 w-8 object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium">{first.name}</span>
              <Price amount={first.rental ? first.rental.weekend[currency] : priceFor(first, currency)} className="text-[10px]" />
            </span>
            {rest.length > 0 && <span className="font-spec text-[10px] text-[var(--text-taupe)]">+{rest.length}</span>}
          </div>
        )}
      </div>
    </button>
  )
}

interface Props {
  videos: ShoppableVideo[]
  index?: string
  eyebrow?: string
  title?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}

/** Horizontal rail of autoplaying vertical films; each opens a shoppable viewer. */
export default function ShoppableVideos({
  videos,
  index = '—',
  eyebrow = 'Watch & shop',
  title = <>Seen in <em className="text-[var(--gold-vermeil)]">motion</em></>,
  tone = 'light',
  className = '',
}: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const rail = useRef<HTMLDivElement>(null)
  if (videos.length === 0) return null

  const scroll = (d: number) => rail.current?.scrollBy({ left: d * rail.current.clientWidth * 0.8, behavior: 'smooth' })
  const btn = tone === 'dark' ? 'border-white/20 hover:border-[var(--gold-champagne)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'

  return (
    <section className={`${tone === 'dark' ? 'bg-[var(--bg-vault)] text-[var(--bg-travertine)]' : ''} ${className}`}>
      <div className="mx-auto max-w-[1600px] px-6 pt-28 lg:px-12 lg:pt-36">
        <SectionHeader
          index={index}
          eyebrow={eyebrow}
          title={title}
          tone={tone}
          aside={
            videos.length > 3 && (
              <div className="flex gap-2">
                <button onClick={() => scroll(-1)} aria-label="Scroll films left" className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${btn}`}><ChevronLeft size={18} strokeWidth={1.3} /></button>
                <button onClick={() => scroll(1)} aria-label="Scroll films right" className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${btn}`}><ChevronRight size={18} strokeWidth={1.3} /></button>
              </div>
            )
          }
        />
      </div>
      <div ref={rail} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-28 [scrollbar-width:none] lg:-mt-20 lg:gap-4 lg:px-12 lg:pb-36 [&::-webkit-scrollbar]:hidden" data-lenis-prevent-wheel>
        {videos.map((x, k) => <Tile key={x.id} video={x} index={k} onOpen={() => setOpen(k)} />)}
      </div>
      {open !== null && createPortal(<VideoViewer videos={videos} start={open} onClose={() => setOpen(null)} />, document.body)}
    </section>
  )
}
