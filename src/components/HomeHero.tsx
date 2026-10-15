import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { IMG } from '../data/catalog'
import { href } from '../store'

gsap.registerPlugin(ScrollTrigger)

const SLIDES = [
  {
    eyebrow: 'Collection Lumière · Automne',
    lines: ['Light, set', 'by hand,', 'since 1962.'],
    italic: 1,
    body: 'Three generations of Montreal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke.',
    image: IMG.necklace2,
    inset: IMG.earrings1,
    insetLabel: 'Vieux-Port Studs',
    cta: { label: 'Discover necklaces', to: href.category('necklaces') },
    spec: ['Rivière Saint-Laurent', '12.40 ct', 'F–G / VS'],
  },
  {
    eyebrow: 'Chapitre V · Mariage',
    lines: ['A promise,', 'certified', 'to the facet.'],
    italic: 1,
    body: 'Engagement rings with GIA-graded centre stones, hand-set in platinum by our master setter.',
    image: IMG.bridal1,
    inset: IMG.bridal2,
    insetLabel: 'Basilique Three-Stone',
    cta: { label: 'Explore bridal', to: href.category('bridal') },
    spec: ['Notre-Dame Oval', '1.82 ct', 'E / VS1'],
  },
  {
    eyebrow: 'Chapitre VII · La Location',
    lines: ['Borrow the', 'vault', 'for a night.'],
    italic: 1,
    body: 'High jewelry for galas and premieres, insured and couriered across Canada and the United States.',
    image: IMG.jewelryFlat,
    inset: IMG.necklace1,
    insetLabel: 'Gala Diamond Collar',
    cta: { label: 'View rentals', to: href.category('rentals') },
    spec: ['Gala Collar', '18.20 ct', 'From weekend'],
  },
]

const DURATION = 7

export default function HomeHero() {
  const root = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const busy = useRef(false)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Intro + scroll-out + pointer parallax
  useLayoutEffect(() => {
    if (!root.current || reduced) return
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-frame]', { clipPath: 'inset(12% 12% 12% 12%)', duration: 1.8, ease: 'expo.inOut' })
      gsap.from('[data-hero-meta]', { opacity: 0, y: 16, duration: 1, stagger: 0.08, delay: 1.1, ease: 'expo.out' })

      const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('[data-hero-bg]', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: st })
      gsap.to('[data-hero-copy]', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '70% top' } })
      gsap.to('[data-hero-inset]', { yPercent: -40, ease: 'none', scrollTrigger: st })
    }, root)

    const el = root.current
    const qx = gsap.quickTo(el.querySelector('[data-hero-inset]'), 'x', { duration: 1.2, ease: 'power3.out' })
    const qy = gsap.quickTo(el.querySelector('[data-hero-inset]'), 'y', { duration: 1.2, ease: 'power3.out' })
    const bx = gsap.quickTo(el.querySelectorAll('[data-hero-bg]'), 'x', { duration: 1.6, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      qx(nx * -40)
      qy(ny * -30)
      bx(nx * 18)
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      ctx.revert()
    }
  }, [reduced])

  // Headline reveal per slide
  useLayoutEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo(`[data-slide="${index}"] [data-line]`, { yPercent: 115, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.1, ease: 'expo.out' })
        .fromTo(`[data-slide="${index}"] [data-fade]`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, '-=1')
      gsap.fromTo('[data-progress]', { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: 'none' })
    }, root)
    return () => ctx.revert()
  }, [index])

  const go = useCallback(
    (next: number) => {
      if (busy.current || next === index || !root.current) return
      busy.current = true
      const target = (next + SLIDES.length) % SLIDES.length
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ onComplete: () => { busy.current = false } })
        .to(q(`[data-slide="${index}"] [data-line]`), { yPercent: -115, duration: 0.7, stagger: 0.05, ease: 'expo.in' })
        .to(q(`[data-slide="${index}"] [data-fade]`), { opacity: 0, duration: 0.4 }, 0)
        .fromTo(q(`[data-bg="${target}"]`), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
        .fromTo(q(`[data-bg="${target}"] img`), { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.1)
        .fromTo(q(`[data-inset-img="${target}"]`), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.3)
        .add(() => setIndex(target), 0.75)
    },
    [index],
  )

  useEffect(() => {
    if (reduced) return
    const id = window.setTimeout(() => go(index + 1), DURATION * 1000)
    return () => window.clearTimeout(id)
  }, [index, go, reduced])

  const slide = SLIDES[index]

  return (
    <section ref={root} className="relative h-[calc(100svh-7rem)] min-h-[680px] overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      {/* Background stack */}
      <div data-hero-frame className="absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={s.image}
            data-bg={i}
            data-hero-bg
            className="absolute -inset-[4%] overflow-hidden"
            style={{ zIndex: i === index ? 2 : 1, clipPath: i === index ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)' }}
          >
            <img src={s.image} alt="" className="h-full w-full object-cover" fetchPriority={i === 0 ? 'high' : 'auto'} />
          </div>
        ))}
        <div className="absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,rgba(18,17,16,0.55)_70%)]" />
        <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[var(--bg-vault)] via-[var(--bg-vault)]/20 to-[var(--bg-vault)]/40" />
      </div>

      {/* Inset framed image */}
      <figure data-hero-inset className="absolute right-[6%] top-[12%] z-[5] hidden w-[17vw] max-w-[260px] lg:block">
        <div className="relative aspect-[3/4] overflow-hidden outline outline-1 outline-offset-8 outline-[var(--gold-champagne)]/40">
          {SLIDES.map((s, i) => (
            <img
              key={s.inset}
              data-inset-img={i}
              src={s.inset}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ zIndex: i === index ? 2 : 1, clipPath: i === index ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
            />
          ))}
        </div>
        <figcaption className="font-mono-spec mt-5 flex justify-between text-[9px] uppercase tracking-[0.24em] text-white/60">
          <span>{slide.insetLabel}</span>
          <span className="text-[var(--gold-champagne)]">0{index + 1}</span>
        </figcaption>
      </figure>

      {/* Vertical side label */}
      <p data-hero-meta className="font-mono-spec absolute left-6 top-1/2 z-[5] hidden origin-left -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-[0.5em] text-white/40 lg:block lg:left-10">
        Joailliers · Montréal · Est. 1962
      </p>

      {/* Copy */}
      <div data-hero-copy className="relative z-[6] mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-10 lg:px-16 lg:pb-12">
        <div className="relative">
          {SLIDES.map((s, i) => (
            <div key={s.eyebrow} data-slide={i} className={i === index ? 'relative' : 'pointer-events-none absolute inset-x-0 bottom-0 opacity-0'} aria-hidden={i !== index}>
              <p data-fade className="font-mono-spec mb-7 flex items-center gap-4 text-[10px] uppercase tracking-[0.34em] text-[var(--gold-champagne)]">
                <span className="h-px w-10 bg-[var(--gold-champagne)]" />
                {s.eyebrow}
              </p>
              {/* Size tracks both viewport width and height so three lines never crowd the controls. */}
              <h1
                className="font-serif-editorial font-light leading-[0.84] tracking-[-0.035em] lg:max-w-[72%]"
                style={{ fontSize: 'clamp(3.4rem, min(10.5vw, 15.5vh), 10rem)' }}
              >
                {s.lines.map((l, li) => {
                  const accent = li === s.italic
                  return (
                    <span
                      key={l}
                      className={`block overflow-hidden pb-[0.08em] ${accent ? 'pl-[0.9em] sm:pl-[1.6em]' : li === 2 ? 'pl-[0.35em] sm:pl-[0.55em]' : ''}`}
                    >
                      <span data-line className="relative inline-flex items-start">
                        {li === 0 && (
                          <span className="font-mono-spec mr-4 mt-[0.22em] hidden text-[10px] font-normal not-italic tracking-[0.2em] text-[var(--gold-champagne)] sm:inline">
                            (0{i + 1})
                          </span>
                        )}
                        {accent && <span className="mr-[0.25em] mt-[0.5em] hidden h-px w-[0.9em] bg-[var(--gold-champagne)]/70 sm:block" />}
                        <span className={accent ? 'font-normal italic text-[var(--gold-champagne)]' : ''}>{l}</span>
                      </span>
                    </span>
                  )
                })}
              </h1>
              <div className="mt-8 grid items-end gap-8 lg:mt-10 lg:grid-cols-12">
                <p data-fade className="max-w-sm text-sm leading-relaxed text-white/70 lg:col-span-4">{s.body}</p>
                <a data-fade href={s.cta.to} className="group inline-flex items-center gap-5 justify-self-start text-[11px] font-medium uppercase tracking-[0.26em] lg:col-span-4">
                  <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[var(--gold-champagne)]">
                    <span className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--gold-champagne)] transition-transform duration-500 ease-out group-hover:scale-y-100" />
                    <ArrowRight size={16} strokeWidth={1.4} className="relative transition-colors group-hover:text-[var(--bg-vault)]" />
                  </span>
                  {s.cta.label}
                </a>
                <dl data-fade className="font-mono-spec hidden grid-cols-3 gap-6 border-l border-white/15 pl-6 text-[10px] uppercase tracking-[0.18em] lg:col-span-4 lg:grid">
                  {['Piece', 'Weight', 'Grade'].map((k, ki) => (
                    <div key={k}>
                      <dt className="text-white/40">{k}</dt>
                      <dd className="mt-1.5 text-white/85">{s.spec[ki]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div data-hero-meta className="mt-12 flex items-center gap-8 border-t border-white/15 pt-6">
          <div className="font-mono-spec flex items-center gap-3 text-[11px] tracking-[0.2em]">
            <span className="text-[var(--gold-champagne)]">0{index + 1}</span>
            <span className="relative h-px w-28 overflow-hidden bg-white/20">
              <span data-progress className="absolute inset-0 origin-left bg-[var(--gold-champagne)]" />
            </span>
            <span className="text-white/40">0{SLIDES.length}</span>
          </div>
          <div className="flex gap-1">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`font-mono-spec px-2 py-1 text-[9px] uppercase tracking-[0.22em] transition-colors ${i === index ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
              >
                {s.eyebrow.split('·')[1]?.trim() ?? s.eyebrow}
              </button>
            ))}
          </div>
          <span className="font-mono-spec ml-auto hidden items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-white/50 sm:flex">
            Scroll <ArrowDown size={12} strokeWidth={1.4} className="animate-bounce" />
          </span>
        </div>
      </div>
    </section>
  )
}
