import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck, Camera, ChevronLeft, ChevronRight, ImagePlus, Play, Star, X } from 'lucide-react'
import type { Product } from '../../data/catalog'
import { mediaPoolFor, type ReviewMedia } from '../../data/media'
import { getLenis } from '../SmoothScroll'
import SectionHeader from '../home/SectionHeader'

const POOL = [
  { a: 'Élodie M.', loc: 'Montréal, QC', t: 'Better than the photographs', b: 'The finish is impeccable and it catches light from across the room. Packaging felt like opening a keepsake.' },
  { a: 'James T.', loc: 'Boston, MA', t: 'Seamless cross-border order', b: 'Duties were prepaid as promised and it arrived in three days, insured and signed for. The concierge followed up personally.' },
  { a: 'Sophie L.', loc: 'Québec, QC', t: 'An heirloom already', b: 'I wear it every day. The weight feels substantial without being heavy. My daughter has already claimed it.' },
  { a: 'Marcus O.', loc: 'Toronto, ON', t: 'The engraving made it', b: 'Hand-engraved with our date — the lettering is beautiful. Marco even sent a photo before shipping.' },
  { a: 'Aisha R.', loc: 'New York, NY', t: 'Worth the visit', b: 'Booked a video appointment and they showed me three stones under the loupe. Zero pressure, all expertise.' },
  { a: 'Claire B.', loc: 'Ottawa, ON', t: 'Exquisite proportions', b: 'Delicate but not fragile. The clasp is secure and the polish is mirror-bright. Exactly as described.' },
  { a: 'Nathalie G.', loc: 'Laval, QC', t: 'Worn on the big day', b: 'Photographed beautifully in every light. Our photographer asked where it was from before the ceremony even started.' },
]

interface Review {
  id: string
  a: string
  loc: string
  t: string
  b: string
  stars: number
  days: number
  media: ReviewMedia[]
  mine?: boolean
}

// Deterministic per-product pseudo-randomness so reviews stay stable between renders.
function seed(str: string) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** Stable rating summary shared by the review section and the product header. */
export function getRatingSummary(slug: string) {
  const s = seed(slug)
  return { seed: s, count: 18 + (s % 140), rating: (4.7 + (s % 3) / 10).toFixed(1) }
}

function buildReviews(product: Product): Review[] {
  const s = seed(product.slug)
  const pool = mediaPoolFor(product)
  let m = s % pool.length
  const take = (n: number) => Array.from({ length: n }, () => pool[m++ % pool.length])
  const mediaCounts = [2, 1, 0, 3, 0, 1]
  return mediaCounts.map((n, i) => ({
    id: `r${i}`,
    ...POOL[(s + i) % POOL.length],
    stars: i === 4 && s % 2 ? 4 : 5,
    days: 3 + i * 9 + ((s >> i) % 7),
    media: take(n),
  }))
}

// Customer submissions are kept per device (images as compressed data URLs; videos for this session only).
const storeKey = (slug: string) => `tns-reviews-${slug}`
function loadMine(slug: string): Review[] {
  try {
    return JSON.parse(localStorage.getItem(storeKey(slug)) || '[]')
  } catch {
    return []
  }
}
function saveMine(slug: string, list: Review[]) {
  const persistable = list.map((r) => ({ ...r, media: r.media.filter((x) => x.type === 'image') }))
  try {
    localStorage.setItem(storeKey(slug), JSON.stringify(persistable))
  } catch {
    // Storage full: keep the review text, drop images.
    localStorage.setItem(storeKey(slug), JSON.stringify(persistable.map((r) => ({ ...r, media: [] }))))
  }
}

function compressImage(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

function useModalLock() {
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
    }
  }, [])
}

function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-[var(--gold-vermeil)]">
      {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={size} strokeWidth={1.2} className={k < n ? 'fill-current' : 'text-[var(--border-hairline)]'} />)}
    </span>
  )
}

function Thumb({ m, onClick, className = '', label }: { m: ReviewMedia; onClick: () => void; className?: string; label?: string }) {
  return (
    <button onClick={onClick} aria-label={label ?? (m.type === 'video' ? 'Play client video' : 'View client photo')} className={`group relative overflow-hidden bg-[var(--bg-silk)] ${className}`}>
      {m.type === 'video' && !m.poster ? (
        <video src={m.src} muted preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <img src={m.type === 'video' ? m.poster : m.src} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
      )}
      {m.type === 'video' && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--text-espresso)] backdrop-blur">
            <Play size={12} strokeWidth={1.5} className="ml-0.5 fill-current" />
          </span>
        </span>
      )}
    </button>
  )
}

interface FlatMedia {
  m: ReviewMedia
  r: Review
}

function MediaLightbox({ items, start, onClose }: { items: FlatMedia[]; start: number; onClose: () => void }) {
  useModalLock()
  const [i, setI] = useState(start)
  const { m, r } = items[i]
  const go = (d: number) => setI((x) => (x + d + items.length) % items.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)] lg:flex-row" role="dialog" aria-modal="true" aria-label="Client media" data-lenis-prevent>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 lg:p-10">
        {m.type === 'video' ? (
          <video key={m.src} src={m.src} poster={m.poster || undefined} controls autoPlay playsInline className="max-h-full max-w-full" />
        ) : (
          <img key={m.src} src={m.src} alt={`Photo from ${r.a}`} className="max-h-full max-w-full object-contain" />
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur hover:border-[var(--gold-champagne)]"><ChevronLeft size={18} strokeWidth={1.3} /></button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur hover:border-[var(--gold-champagne)]"><ChevronRight size={18} strokeWidth={1.3} /></button>
          </>
        )}
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 hover:border-[var(--gold-champagne)]"><X size={18} strokeWidth={1.3} /></button>
      </div>
      <aside className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-white/10 px-6 py-6 lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0 lg:px-8 lg:py-12">
        <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
          {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')} · Client {m.type}
        </p>
        <div className="mt-6"><Stars n={r.stars} /></div>
        <h3 className="font-serif-editorial mt-4 text-3xl font-light">{r.t}</h3>
        <p className="mt-3 leading-relaxed text-white/65">{r.b}</p>
        <p className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
          {r.a} <span className="text-white/40">· {r.loc}</span>
          {!r.mine && <BadgeCheck size={14} strokeWidth={1.3} className="text-[var(--gold-champagne)]" aria-label="Verified purchase" />}
        </p>
        <div className="mt-8 grid grid-cols-5 gap-1.5">
          {items.map((x, k) => (
            <button key={k} onClick={() => setI(k)} className={`relative aspect-square overflow-hidden ring-1 ${k === i ? 'ring-[var(--gold-champagne)]' : 'opacity-50 ring-transparent hover:opacity-90'}`}>
              {x.m.type === 'video' && !x.m.poster ? (
                <video src={x.m.src} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={x.m.type === 'video' ? x.m.poster : x.m.src} alt="" className="h-full w-full object-cover" />
              )}
              {x.m.type === 'video' && <Play size={10} className="absolute bottom-1 right-1 fill-white text-white" />}
            </button>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  )
}

function WriteReview({ product, onClose, onSubmit }: { product: Product; onClose: () => void; onSubmit: (r: Review) => void }) {
  useModalLock()
  const [stars, setStars] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [media, setMedia] = useState<ReviewMedia[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const MAX = 6

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setBusy(true)
    setError(null)
    const next: ReviewMedia[] = []
    for (const f of Array.from(files).slice(0, MAX - media.length)) {
      if (f.type.startsWith('image/')) next.push({ type: 'image', src: await compressImage(f) })
      else if (f.type.startsWith('video/')) {
        if (f.size > 60 * 1024 * 1024) {
          setError('Videos must be under 60 MB.')
          continue
        }
        const src = URL.createObjectURL(f)
        next.push({ type: 'video', src, poster: '' })
      }
    }
    setMedia((m) => [...m, ...next].slice(0, MAX))
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!stars) {
      setError('Please choose a rating.')
      return
    }
    const d = new FormData(e.currentTarget)
    onSubmit({
      id: `mine-${Date.now()}`,
      a: String(d.get('name')),
      loc: String(d.get('loc') || 'Canada'),
      t: String(d.get('title')),
      b: String(d.get('body')),
      stars,
      days: 0,
      media,
      mine: true,
    })
  }

  const field = 'mt-2 w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text-espresso)]'
  const label = 'text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--bg-vault)]/50 sm:items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Write a review" className="max-h-[92vh] w-full max-w-xl overflow-y-auto bg-[var(--bg-travertine)] p-6 sm:p-10" data-lenis-prevent>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Votre avis</p>
            <h3 className="font-serif-editorial mt-2 text-4xl font-light">Review {product.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} strokeWidth={1.3} /></button>
        </div>

        <div className="mt-8">
          <p className={label}>Your rating</p>
          <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverStar(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onMouseEnter={() => setHoverStar(n)} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="text-[var(--gold-vermeil)]">
                <Star size={28} strokeWidth={1} className={n <= (hoverStar || stars) ? 'fill-current' : ''} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block"><span className={label}>Headline</span><input name="title" required maxLength={80} className={field} placeholder="Sum it up in a line" /></label>
          <label className="block"><span className={label}>Your review</span><textarea name="body" required rows={4} maxLength={1200} className={`${field} resize-none`} placeholder="How does it look, feel and wear?" /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block"><span className={label}>Name</span><input name="name" required className={field} placeholder="First name, last initial" /></label>
            <label className="block"><span className={label}>City</span><input name="loc" className={field} placeholder="Montréal, QC" /></label>
          </div>
        </div>

        <div className="mt-6">
          <p className={label}>Photos & videos <span className="normal-case tracking-normal text-[var(--text-linen)]">— up to {MAX}</span></p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {media.map((m, k) => (
              <div key={k} className="relative aspect-square overflow-hidden bg-[var(--bg-silk)]">
                {m.type === 'image' ? <img src={m.src} alt="" className="h-full w-full object-cover" /> : <video src={m.src} muted className="h-full w-full object-cover" />}
                {m.type === 'video' && <Play size={11} className="absolute bottom-1.5 left-1.5 fill-white text-white" />}
                <button type="button" onClick={() => setMedia((x) => x.filter((_, j) => j !== k))} aria-label="Remove" className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"><X size={11} /></button>
              </div>
            ))}
            {media.length < MAX && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[var(--text-linen)] text-[var(--text-taupe)] transition-colors hover:border-[var(--text-espresso)] hover:text-[var(--text-espresso)]">
                {busy ? <span className="font-mono-spec text-[10px]">…</span> : <ImagePlus size={18} strokeWidth={1.2} />}
                <span className="text-[9px] uppercase tracking-[0.16em]">Add</span>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              </label>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--text-linen)]">Show it worn — natural light works best. Videos under 60 MB.</p>
        </div>

        {error && <p className="mt-5 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="mt-8 w-full bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] disabled:opacity-60">
          Submit review
        </button>
        <p className="mt-3 text-center text-xs text-[var(--text-linen)]">Reviews are moderated before they appear publicly.</p>
      </form>
    </div>,
    document.body,
  )
}

type Filter = 'all' | 'media' | 'five'

export default function Reviews({ product, index }: { product: Product; index: string }) {
  const { count, rating } = getRatingSummary(product.slug)
  const dist = [0.82, 0.13, 0.03, 0.01, 0.01]
  const base = useMemo(() => buildReviews(product), [product])
  const [mine, setMine] = useState<Review[]>(() => loadMine(product.slug))
  const [filter, setFilter] = useState<Filter>('all')
  const [limit, setLimit] = useState(3)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [writing, setWriting] = useState(false)
  const [thanks, setThanks] = useState(false)

  const all = [...mine, ...base]
  const flat: FlatMedia[] = all.flatMap((r) => r.media.map((m) => ({ m, r })))
  const mediaCount = flat.length
  const videoCount = flat.filter((x) => x.m.type === 'video').length
  const filtered = all.filter((r) => (filter === 'media' ? r.media.length > 0 : filter === 'five' ? r.stars === 5 : true))
  const shown = filtered.slice(0, limit)
  const openMedia = (r: Review, m: ReviewMedia) => setLightbox(flat.findIndex((x) => x.r === r && x.m === m))

  const submit = (r: Review) => {
    const next = [r, ...mine]
    setMine(next)
    saveMine(product.slug, next)
    setWriting(false)
    setThanks(true)
    setFilter('all')
  }

  const chip = (on: boolean) => `whitespace-nowrap border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`

  return (
    <section id="reviews" className="mx-auto max-w-[1600px] scroll-mt-32 px-6 py-28 lg:px-12 lg:py-36">
      <SectionHeader
        index={index}
        eyebrow="Verified clients"
        title={<>In their <em className="text-[var(--gold-vermeil)]">words</em></>}
        aside={
          <button onClick={() => setWriting(true)} className="flex items-center gap-2 border border-[var(--text-espresso)] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]">
            <Camera size={14} strokeWidth={1.3} /> Write a review
          </button>
        }
      />

      {/* Client media wall */}
      {mediaCount > 0 && (
        <div className="mb-16" data-reveal>
          <div className="mb-4 flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-[0.22em]">Client photos & videos</p>
            <p className="font-mono-spec text-[10px] uppercase tracking-[0.18em] text-[var(--text-linen)]">
              {mediaCount - videoCount} photos · {videoCount} videos
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {flat.slice(0, 8).map((x, k) => (
              <div key={k} className={`relative ${k === 0 ? 'col-span-2 row-span-2' : ''}`}>
                <Thumb m={x.m} onClick={() => setLightbox(k)} className="aspect-square w-full" />
                {k === 7 && mediaCount > 8 && (
                  <button onClick={() => setLightbox(7)} className="font-serif-editorial absolute inset-0 flex items-center justify-center bg-[var(--bg-vault)]/60 text-2xl text-white">+{mediaCount - 7}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-16 lg:grid-cols-12">
        <aside className="lg:col-span-4" data-reveal>
          <p className="font-serif-editorial text-8xl font-light leading-none">{rating}</p>
          <div className="mt-4"><Stars n={5} size={16} /></div>
          <p className="font-mono-spec mt-3 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{count + mine.length} verified reviews</p>
          <ul className="font-mono-spec mt-10 space-y-2.5 text-[11px]">
            {dist.map((d, i) => (
              <li key={i} className="flex items-center gap-4">
                <span className="w-4">{5 - i}</span>
                <span className="relative h-px flex-1 bg-[var(--border-hairline)]">
                  <span className="absolute inset-y-[-0.5px] left-0 h-[2px] bg-[var(--gold-vermeil)]" style={{ width: `${d * 100}%` }} />
                </span>
                <span className="w-8 text-right text-[var(--text-linen)]">{Math.round(d * count)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-[var(--border-hairline)] pt-8 text-sm">
            <div><dt className="font-mono-spec text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">Fit</dt><dd className="mt-1">True to size</dd></div>
            <div><dt className="font-mono-spec text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">Would gift</dt><dd className="mt-1">98%</dd></div>
          </dl>
        </aside>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter reviews">
            <button onClick={() => setFilter('all')} className={chip(filter === 'all')}>All</button>
            <button onClick={() => setFilter('media')} className={chip(filter === 'media')}>With photos & videos</button>
            <button onClick={() => setFilter('five')} className={chip(filter === 'five')}>5 stars</button>
          </div>

          {thanks && (
            <p className="mb-6 border border-[var(--gold-champagne)] bg-[var(--bg-silk)] px-5 py-4 text-sm">
              Merci — your review has been received and will appear publicly once moderated.
            </p>
          )}

          <ul className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
            {shown.map((r) => (
              <li key={r.id} className="py-10">
                <div className="flex items-center justify-between gap-6">
                  <Stars n={r.stars} />
                  <span className="font-mono-spec text-[10px] uppercase tracking-[0.18em] text-[var(--text-linen)]">
                    {r.mine ? 'Pending moderation' : `${r.days} days ago`}
                  </span>
                </div>
                <h3 className="font-serif-editorial mt-5 text-3xl">{r.t}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-[var(--text-taupe)]">{r.b}</p>
                {r.media.length > 0 && (
                  <div className="mt-5 flex gap-2">
                    {r.media.map((m, k) => <Thumb key={k} m={m} onClick={() => openMedia(r, m)} className="h-24 w-20" />)}
                  </div>
                )}
                <p className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                  {r.a} <span className="text-[var(--text-linen)]">· {r.loc}</span>
                  {r.mine ? (
                    <span className="font-mono-spec ml-1 text-[9px] text-[var(--gold-vermeil)]">You</span>
                  ) : (
                    <BadgeCheck size={14} strokeWidth={1.3} className="ml-1 text-[var(--gold-vermeil)]" aria-label="Verified purchase" />
                  )}
                </p>
              </li>
            ))}
            {shown.length === 0 && <li className="py-10 text-[var(--text-taupe)]">No reviews match this filter yet.</li>}
          </ul>
          {filtered.length > limit && (
            <button onClick={() => setLimit((l) => l + 3)} className="link-line mt-10">Show more reviews</button>
          )}
        </div>
      </div>

      {lightbox !== null && lightbox >= 0 && <MediaLightbox items={flat} start={lightbox} onClose={() => setLightbox(null)} />}
      {writing && <WriteReview product={product} onClose={() => setWriting(false)} onSubmit={submit} />}
    </section>
  )
}
