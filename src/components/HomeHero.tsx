import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react'
import { getProduct, IMG, type Product } from '../data/catalog'
import { href, useStore } from '../store'
import Price from './Price'
import WishButton from './WishButton'
import TryOnButton from './tryon/TryOnButton'

gsap.registerPlugin(ScrollTrigger)

const SLIDES = [
  {
    nav: 'Lumière',
    eyebrow: 'Collection Lumière · Automne',
    lines: ['Light, set', 'by hand,', 'since 1962.'],
    italic: 1,
    body: 'Three generations of Montréal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke.',
    image: IMG.necklace2,
    piece: 'mont-royal-solitaire-pendant',
    pieceImage: 0,
    cta: { label: 'Discover necklaces', to: href.category('necklaces') },
  },
  {
    nav: 'Mariage',
    eyebrow: 'Chapitre V · Mariage',
    lines: ['A promise,', 'certified', 'to the facet.'],
    italic: 1,
    body: 'Engagement rings with GIA-graded centre stones, hand-set in platinum by our master setter.',
    image: IMG.ring1,
    piece: 'notre-dame-oval-solitaire',
    pieceImage: 0,
    cta: { label: 'Explore bridal', to: href.category('bridal') },
  },
  {
    nav: 'Location',
    eyebrow: 'Chapitre VII · La Location',
    lines: ['Borrow the', 'vault', 'for a night.'],
    italic: 1,
    body: 'High jewelry for galas and premieres, insured and couriered across Canada and the United States.',
    image: IMG.earrings2,
    // The collar's boxed-strand photo; its first image is a chain that reads nothing like a collar.
    piece: 'gala-diamond-collar',
    pieceImage: 1,
    cta: { label: 'View rentals', to: href.category('rentals') },
  },
]

const PIECES = SLIDES.map((s) => getProduct(s.piece))
const DURATION = 7

/** Carat, colour and clarity from the GIA report, or the total weight for pieces without one. */
const facts = (p: Product) => (p.gia ? [`${p.gia.carat.toFixed(2)} ct`, p.gia.color, p.gia.clarity] : [p.specs['Total carat weight']].filter(Boolean))
/** Catalog photos are 1600 px wide; the framed piece never shows more than 250 px of one. */
const thumb = (url: string) => url.replace('w=1600', 'w=640')

const ring = 'focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-champagne)]'

export default function HomeHero() {
  const { currency } = useStore()
  const root = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const busy = useRef(false)
  const progress = useRef<gsap.core.Tween | null>(null)
  const pausedRef = useRef(false)
  // Autoplay also waits while the controls or the piece are hovered, while keyboard focus is inside, and while the hero is hidden or off-screen.
  const holds = useRef({ hover: false, focus: false, hidden: false, offscreen: false })
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const sync = useCallback(() => {
    const t = progress.current
    if (!t) return
    const h = holds.current
    if (pausedRef.current || h.hover || h.focus || h.hidden || h.offscreen) t.pause()
    else t.resume()
  }, [])

  // Intro, scroll-out, pointer parallax and the cursor light
  useLayoutEffect(() => {
    if (!root.current || reduced) return
    const el = root.current
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-frame]', { clipPath: 'inset(12% 12% 12% 12%)', duration: 1.8, ease: 'expo.inOut' })
      // The scene lights up as the frame opens.
      gsap.from('[data-bg="0"] img', { filter: 'brightness(0.3) saturate(0.6)', duration: 2.6, ease: 'power2.out', clearProps: 'filter' })
      gsap.from('[data-hero-meta]', { opacity: 0, y: 16, duration: 1, stagger: 0.08, delay: 1.1, ease: 'expo.out' })
      gsap.from('[data-hero-inset]', { opacity: 0, duration: 1.4, delay: 0.9, ease: 'expo.out' })

      const st = { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('[data-hero-bg]', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: st })
      gsap.to('[data-hero-copy]', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '70% top' } })
      gsap.to('[data-hero-inset]', { yPercent: -30, ease: 'none', scrollTrigger: st })
    }, root)

    const qx = gsap.quickTo(el.querySelector('[data-hero-inset]'), 'x', { duration: 1.2, ease: 'power3.out' })
    const qy = gsap.quickTo(el.querySelector('[data-hero-inset]'), 'y', { duration: 1.2, ease: 'power3.out' })
    const bx = gsap.quickTo(el.querySelectorAll('[data-hero-bg]'), 'x', { duration: 1.6, ease: 'power3.out' })
    // A soft key light trails the cursor across the jewellery.
    const spot = el.querySelector<HTMLElement>('[data-hero-light]')
    const light = { x: 68, y: 42 }
    const paint = () => {
      spot?.style.setProperty('--hx', `${light.x}%`)
      spot?.style.setProperty('--hy', `${light.y}%`)
    }
    const lx = gsap.quickTo(light, 'x', { duration: 1.1, ease: 'power3.out', onUpdate: paint })
    const ly = gsap.quickTo(light, 'y', { duration: 1.1, ease: 'power3.out', onUpdate: paint })
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      // Gentle on the piece: it's a link, so it shouldn't run from the cursor.
      qx(nx * -24)
      qy(ny * -18)
      bx(nx * 18)
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      lx(((e.clientX - r.left) / r.width) * 100)
      ly(((e.clientY - r.top) / r.height) * 100)
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      ctx.revert()
    }
  }, [reduced])

  const go = useCallback(
    (next: number) => {
      const target = (next + SLIDES.length) % SLIDES.length
      if (busy.current || target === index || !root.current) return
      progress.current?.kill()
      progress.current = null
      const q = gsap.utils.selector(root)
      const inBg = q(`[data-bg="${target}"]`)
      const outBg = q(`[data-bg="${index}"]`)
      const inInset = q(`[data-inset-img="${target}"]`)
      const outInset = q(`[data-inset-img="${index}"]`)
      // The incoming layers sit above the outgoing ones from the first frame, so the wipe always reveals over the old image.
      gsap.set([outBg, outInset], { zIndex: 2 })
      gsap.set([inBg, inInset], { zIndex: 3 })
      if (reduced) {
        gsap.set(inBg, { clipPath: 'inset(0 0 0 0%)' })
        gsap.set(inInset, { clipPath: 'inset(0% 0 0 0)' })
        gsap.set(outBg, { clipPath: 'inset(0 0 0 100%)', zIndex: 1 })
        gsap.set(outInset, { clipPath: 'inset(100% 0 0 0)', zIndex: 1 })
        setIndex(target)
        return
      }
      busy.current = true
      // Swap slides only after every line of the old headline has lifted out (0.7 s + 0.05 s stagger per extra line).
      const linesOut = 0.7 + 0.05 * (SLIDES[index].lines.length - 1)
      gsap
        .timeline({ onComplete: () => { busy.current = false } })
        .to(q(`[data-slide="${index}"] [data-line]`), { yPercent: -115, duration: 0.7, stagger: 0.05, ease: 'expo.in' })
        .to(q(`[data-slide="${index}"] [data-fade]`), { opacity: 0, duration: 0.4 }, 0)
        .to(q(`[data-progress="${index}"]`), { scaleX: 0, transformOrigin: 'right center', duration: 0.6, ease: 'expo.inOut' }, 0)
        .fromTo(inBg, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
        .fromTo(q(`[data-bg="${target}"] img`), { scale: 1.2, xPercent: 0 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.1)
        // The old image drifts left as the new one draws across it.
        .to(q(`[data-bg="${index}"] img`), { xPercent: -4, duration: 1.4, ease: 'expo.inOut' }, 0.1)
        .fromTo(inInset, { clipPath: 'inset(100% 0 0 0)', scale: 1.12 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.3, ease: 'expo.inOut' }, 0.3)
        .add(() => setIndex(target), linesOut)
        .set(outBg, { clipPath: 'inset(0 0 0 100%)', zIndex: 1 }, 1.6)
        .set(q(`[data-bg="${index}"] img`), { xPercent: 0 }, 1.6)
        .set(outInset, { clipPath: 'inset(100% 0 0 0)', zIndex: 1 }, 1.6)
    },
    [index, reduced],
  )

  // Headline reveal per slide; the progress line doubles as the autoplay timer, so pausing it pauses the slideshow.
  useLayoutEffect(() => {
    if (!root.current) return
    const el = root.current
    const scope = `[data-slide="${index}"]`
    const lines = el.querySelectorAll(`${scope} [data-line]`)
    const fades = el.querySelectorAll(`${scope} [data-fade]`)
    const rules = [el.querySelector(`${scope} [data-eyebrow-rule]`), el.querySelector(`${scope} [data-rule]`)].filter((n): n is Element => !!n)
    const gleam = el.querySelector(`${scope} [data-gleam]`)
    const bar = el.querySelector(`[data-progress="${index}"]`)
    // A tween from this slide's previous exit may still hold its lines; take them over cleanly.
    gsap.killTweensOf(lines)
    let tl: gsap.core.Timeline | null = null
    if (reduced) {
      gsap.set(lines, { yPercent: 0, rotate: 0 })
      gsap.set(fades, { opacity: 1, y: 0 })
      gsap.set(rules, { scaleX: 1 })
      gsap.set(bar, { scaleX: 1, transformOrigin: 'left center' })
    } else {
      // Lines rise into focus, the gold hairlines draw in, then one glint of light crosses the gold word.
      tl = gsap
        .timeline()
        .fromTo(lines, { yPercent: 115, rotate: 2, filter: 'blur(10px)' }, { yPercent: 0, rotate: 0, filter: 'blur(0px)', duration: 1.4, stagger: 0.1, ease: 'expo.out', clearProps: 'filter' })
        .fromTo(fades, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.5)
        .fromTo(rules, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.2, stagger: 0.2, ease: 'expo.inOut' }, 0.15)
      if (gleam) tl.fromTo(gleam, { backgroundPosition: '100% 0%' }, { backgroundPosition: '0% 0%', duration: 1.8, ease: 'power2.inOut' }, 1)
      progress.current = gsap.fromTo(bar, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => go(index + 1) })
      sync()
    }
    return () => {
      tl?.kill()
      progress.current?.kill()
      progress.current = null
      if (reduced) gsap.set(bar, { scaleX: 0 })
    }
  }, [index, reduced, go, sync])

  useEffect(() => {
    pausedRef.current = paused
    sync()
  }, [paused, sync])

  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const onVisibility = () => {
      holds.current.hidden = document.hidden
      sync()
    }
    const io = new IntersectionObserver(([entry]) => {
      holds.current.offscreen = !entry.isIntersecting
      sync()
    }, { threshold: 0.2 })
    io.observe(el)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced, sync])

  const hold = (on: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    holds.current.hover = on
    sync()
  }

  // Arrow keys move between slides while a slide control has focus.
  const onKeys = (e: React.KeyboardEvent<HTMLOListElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    if (busy.current) return
    const t = (index + (e.key === 'ArrowRight' ? 1 : -1) + SLIDES.length) % SLIDES.length
    go(t)
    e.currentTarget.querySelectorAll('button')[t]?.focus()
  }

  // Touch: a clear horizontal swipe changes slide; vertical drags stay with the page (touch-pan-y).
  const onSwipeEnd = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1))
  }

  const slide = SLIDES[index]
  const piece = PIECES[index]

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onFocus={(e) => { holds.current.focus = e.target.matches(':focus-visible'); sync() }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { holds.current.focus = false; sync() } }}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY } }}
      onPointerUp={onSwipeEnd}
      onPointerCancel={() => { swipe.current = null }}
      className="relative h-[calc(100svh-7rem)] min-h-[540px] touch-pan-y overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]"
    >
      {/* Background stack. Initial layering is fixed by slide position; after that GSAP owns zIndex and clipPath. */}
      <div data-hero-frame className="absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={s.image}
            data-bg={i}
            data-hero-bg
            className="absolute -inset-[4%] overflow-hidden"
            style={{ zIndex: i === 0 ? 2 : 1, clipPath: i === 0 ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)' }}
          >
            <img src={s.image} alt="" className="h-full w-full object-cover" fetchPriority={i === 0 ? 'high' : 'auto'} />
          </div>
        ))}
        {/* Key light (follows the cursor), then a warm grade so the three photographs read as one set */}
        <div
          data-hero-light
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen"
          style={{ background: 'radial-gradient(circle 34vw at var(--hx, 68%) var(--hy, 42%), rgba(255,233,196,0.16), rgba(255,233,196,0) 70%)' }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4] bg-[var(--gold-champagne)]/10 mix-blend-soft-light" />
        {/* Grade: ink from the left for the headline, a floor for the controls, a soft lid under the header.
            Phones stack the copy over the whole image, so their grade rises from the bottom instead. */}
        <div
          className="absolute inset-0 z-[5] lg:hidden"
          style={{ background: 'linear-gradient(0deg, #121110 0%, rgba(18,17,16,0.86) 30%, rgba(18,17,16,0.5) 58%, rgba(18,17,16,0.28) 100%)' }}
        />
        <div
          className="absolute inset-0 z-[5] hidden lg:block"
          style={{ background: 'linear-gradient(90deg, rgba(18,17,16,0.8) 0%, rgba(18,17,16,0.42) 46%, rgba(18,17,16,0.16) 100%), linear-gradient(0deg, #121110 0%, rgba(18,17,16,0.6) 24%, rgba(18,17,16,0) 56%), linear-gradient(180deg, rgba(18,17,16,0.5) 0%, rgba(18,17,16,0) 22%)' }}
        />
      </div>

      {/* The featured piece: framed photo, name and stones. One link covers it; save and try-on sit above that link.
          Width also tracks height so short laptops keep it clear of the controls. It sits above the copy column (z-[6]),
          whose full-height box would otherwise swallow every click and hover meant for the piece. */}
      {piece && (
        <div
          data-hero-inset
          onPointerEnter={hold(true)}
          onPointerLeave={hold(false)}
          className="group absolute right-[6%] top-[11%] z-[7] hidden w-[min(17vw,250px,calc((100svh_-_26rem)*0.72))] lg:block"
        >
          <div className="relative isolate aspect-[3/4] overflow-hidden outline outline-offset-8 outline-[var(--gold-champagne)]/35 transition-[outline-color] duration-700 group-hover:outline-[var(--gold-champagne)]/80">
            {SLIDES.map((s, i) => {
              const p = PIECES[i]
              return p ? (
                <img
                  key={s.piece}
                  data-inset-img={i}
                  src={thumb(p.images[s.pieceImage] ?? p.images[0])}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ zIndex: i === 0 ? 2 : 1, clipPath: i === 0 ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
                />
              ) : null
            })}
          </div>
          <div className="relative mt-7" aria-hidden="true">
            {SLIDES.map((s, i) => {
              const p = PIECES[i]
              if (!p) return null
              return (
                <div key={s.piece} data-slide={i} className={i === index ? 'relative' : 'pointer-events-none absolute inset-x-0 top-0 opacity-0'}>
                  <p data-fade className="font-spec flex items-center justify-between text-[9px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]">
                    La pièce
                    <ArrowUpRight size={14} strokeWidth={1.4} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                  <p data-fade className="font-serif-editorial mt-2.5 text-[1.375rem] leading-tight">{p.name}</p>
                  <p data-fade className="font-spec mt-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
                    {facts(p).join(' · ')}
                    {p.rental && <> · Weekend <Price amount={p.rental.weekend[currency]} className="[&_span]:text-white/45" /></>}
                  </p>
                </div>
              )
            })}
          </div>
          <a href={href.product(piece.slug)} aria-label={`La pièce: ${piece.name}, ${facts(piece).join(', ')}`} className={`absolute -inset-2 z-[1] ${ring}`} />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] aspect-[3/4] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
            <WishButton slug={piece.slug} className="pointer-events-auto absolute right-3 top-3" />
            <span className="pointer-events-auto absolute bottom-3 left-3">
              <TryOnButton product={piece} variant="chip" label="Try on" />
            </span>
          </div>
        </div>
      )}

      {/* Vertical side label, set in a vertical writing mode so it centres on the hero at any height */}
      <p data-hero-meta aria-hidden="true" className="font-spec absolute left-6 top-1/2 z-[5] hidden -translate-y-1/2 rotate-180 whitespace-nowrap text-[9px] uppercase tracking-[0.5em] text-white/40 [writing-mode:vertical-rl] lg:block lg:left-7">
        Joailliers · Montréal · Est. 1962
      </p>

      {/* Copy */}
      <div data-hero-copy className="relative z-[6] mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-[clamp(1.25rem,3.5vh,2.5rem)] lg:px-16">
        <div className="relative">
          {SLIDES.map((s, i) => (
            <div
              key={s.nav}
              data-slide={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${s.nav}`}
              aria-hidden={i !== index}
              inert={i !== index}
              className={i === index ? 'relative' : 'pointer-events-none absolute inset-x-0 bottom-0 opacity-0'}
            >
              <p data-fade className="font-spec mb-[clamp(1rem,3vh,1.5rem)] flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-[var(--gold-champagne)] sm:tracking-[0.34em]">
                <span data-eyebrow-rule className="h-px w-10 bg-[var(--gold-champagne)]" />
                {s.eyebrow}
              </p>
              {/* One strong left edge; the accent line's indent is carried by a gold hairline that leads into the italic.
                  The italic's glint is a text-clipped gradient, padded below so descenders stay inside the painted box.
                  Size tracks both viewport width and height so three lines never crowd the controls. */}
              <h1
                className="font-serif-editorial font-light leading-[0.88] tracking-[-0.03em] !oldstyle-nums [text-rendering:optimizeLegibility] lg:max-w-[72%]"
                style={{ fontSize: 'clamp(3.25rem, min(9.2vw, 14vh), 8.75rem)' }}
              >
                {s.lines.map((l, li) => {
                  const accent = li === s.italic
                  return (
                    <span key={l} className="block overflow-hidden pb-[0.24em] -mb-[0.16em]">
                      <span data-line className="relative inline-flex items-start">
                        {accent && <span data-rule aria-hidden="true" className="mr-[0.3em] mt-[0.56em] h-px w-[0.9em] shrink-0 bg-[linear-gradient(90deg,rgba(212,185,130,0)_0%,rgba(212,185,130,0.55)_45%,var(--gold-champagne)_100%)] sm:w-[1.5em]" />}
                        <span
                          data-gleam={accent || undefined}
                          className={accent ? '-mb-[0.3em] -mr-[0.08em] pb-[0.3em] bg-[linear-gradient(100deg,var(--gold-champagne)_0%,var(--gold-champagne)_42%,#fff4d8_50%,var(--gold-champagne)_58%,var(--gold-champagne)_100%)] bg-[length:250%_100%] bg-[position:100%_0%] bg-clip-text pr-[0.08em] text-[1.05em] font-normal italic text-transparent' : ''}
                        >
                          {l}
                        </span>
                      </span>
                    </span>
                  )
                })}
              </h1>
              <div className="mt-[clamp(1.5rem,4vh,2.5rem)] flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-12">
                <p data-fade className="max-w-sm text-pretty text-sm leading-relaxed text-white/75">{s.body}</p>
                <div data-fade className="flex flex-wrap items-center gap-x-10 gap-y-4">
                  <a href={s.cta.to} className={`group inline-flex shrink-0 items-center gap-5 rounded-full text-[11px] font-medium uppercase tracking-[0.26em] ${ring}`}>
                    <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[var(--gold-champagne)]/70">
                      <span className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--gold-champagne)] transition-transform duration-500 ease-out group-hover:scale-y-100" />
                      {/* The arrow passes through: one leaves to the right as its twin arrives from the left. Both wait fully outside the
                          28 px ring (16 px icon, 260% = 42 px) and transparent, so no sliver shows at rest or mid-hover. */}
                      <ArrowRight size={16} strokeWidth={1.4} className="relative transition-[translate,color,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[260%] group-hover:text-[var(--bg-vault)] group-hover:opacity-0" />
                      <ArrowRight size={16} strokeWidth={1.4} aria-hidden="true" className="absolute -translate-x-[260%] text-[var(--bg-vault)] opacity-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                    {s.cta.label}
                  </a>
                  <a href={href.atelier} className={`font-spec hidden border-b border-[var(--gold-champagne)]/40 pb-1 text-[10px] uppercase tracking-[0.24em] text-white/75 transition-colors hover:border-[var(--gold-champagne)] hover:text-white sm:inline-block ${ring}`}>
                    Book a private appointment
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls: one line per slide fills as it plays */}
        <div data-hero-meta className="mt-[clamp(1.75rem,5vh,3rem)] flex items-end gap-5 border-t border-white/15 pt-5 sm:gap-10">
          <ol aria-label="Slides" className="flex min-w-0 flex-1 gap-4 sm:flex-none sm:gap-8" onKeyDown={onKeys} onPointerEnter={hold(true)} onPointerLeave={hold(false)}>
            {SLIDES.map((s, i) => (
              <li key={s.nav} className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`0${i + 1} ${s.nav}, slide ${i + 1} of ${SLIDES.length}`}
                  aria-current={i === index ? 'true' : undefined}
                  className={`group block w-full py-1 text-left ${ring}`}
                >
                  <span className={`font-spec flex items-baseline gap-2.5 text-[10px] uppercase tracking-[0.24em] transition-colors duration-500 ${i === index ? 'text-white' : 'text-white/55 group-hover:text-white/85'}`}>
                    <span className={i === index ? 'text-[var(--gold-champagne)]' : ''}>0{i + 1}</span>
                    <span className="hidden truncate sm:inline">{s.nav}</span>
                  </span>
                  <span className="relative mt-3 block h-px w-full overflow-hidden bg-white/15">
                    <span data-progress={i} className="absolute inset-0 bg-[var(--gold-champagne)]" style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/75 transition-colors sm:h-8 sm:w-8 hover:border-[var(--gold-champagne)] hover:text-[var(--gold-champagne)] ${ring}`}
            >
              {paused ? <Play size={11} strokeWidth={1.6} className="translate-x-px" /> : <Pause size={11} strokeWidth={1.6} />}
            </button>
          )}
          <span aria-hidden="true" className="font-spec ml-auto hidden items-center gap-4 text-[9px] uppercase tracking-[0.3em] text-white/55 sm:flex">
            Scroll
            <span className="relative h-7 w-px overflow-hidden bg-white/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollCue_2.6s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-[var(--gold-champagne)] motion-reduce:animate-none" />
            </span>
          </span>
        </div>
      </div>
      {/* Screen readers hear the current slide, but only when it changes */}
      <p className="sr-only" aria-live={paused || reduced ? 'polite' : 'off'}>{`Slide ${index + 1} of ${SLIDES.length}: ${slide.lines.join(' ')}`}</p>
    </section>
  )
}
