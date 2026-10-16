import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { CATEGORIES, getProductsByCategory } from '../../data/catalog'
import { href } from '../../store'
import SectionHeader from './SectionHeader'

export default function CategoryIndex() {
  const list = useRef<HTMLUListElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = list.current
    const pv = preview.current
    if (!el || !pv) return
    const xTo = gsap.quickTo(pv, 'x', { duration: 0.8, ease: 'power3.out' })
    const yTo = gsap.quickTo(pv, 'y', { duration: 0.8, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo(e.clientX - r.left)
      yTo(e.clientY - r.top)
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    gsap.to(preview.current, { autoAlpha: hover === null ? 0 : 1, scale: hover === null ? 0.85 : 1, duration: 0.6, ease: 'expo.out' })
  }, [hover])

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-32 lg:px-12 lg:py-44">
      <SectionHeader
        index="01"
        eyebrow="Nine chapters"
        title={<>The <em className="text-[var(--gold-vermeil)]">Index</em></>}
        aside={<p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">From everyday gold to GIA-certified bridal — each collection made or curated in Montreal.</p>}
      />

      {/* Desktop: typographic list with a cursor-following preview */}
      <ul ref={list} className="relative hidden border-t border-[var(--border-hairline)] lg:block" onMouseLeave={() => setHover(null)}>
        <div ref={preview} className="pointer-events-none absolute left-0 top-0 z-10 -ml-[150px] -mt-[190px] h-[380px] w-[300px] overflow-hidden opacity-0">
          {CATEGORIES.map((c, i) => (
            <img key={c.slug} src={c.hero} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500" style={{ opacity: hover === i ? 1 : 0 }} />
          ))}
        </div>
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} data-reveal={i * 0.03}>
            <a
              href={href.category(c.slug)}
              onMouseEnter={() => setHover(i)}
              className={`group grid grid-cols-12 items-baseline border-b border-[var(--border-hairline)] py-7 transition-colors duration-500 ${hover !== null && hover !== i ? 'text-[var(--text-linen)]' : ''}`}
            >
              <span className="font-spec col-span-1 text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
              <span className="font-serif-editorial col-span-5 text-6xl font-light leading-none tracking-[-0.02em] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4">
                {c.name}
              </span>
              <span className="font-serif-editorial col-span-3 text-xl italic text-[var(--text-linen)]">{c.french}</span>
              <span className="font-spec col-span-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">
                {getProductsByCategory(c.slug).length} pieces
              </span>
              <span className="col-span-1 flex justify-end">
                <ArrowUpRight size={20} strokeWidth={1.2} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[var(--gold-vermeil)]" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile / tablet: compact cards */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:hidden">
        {CATEGORIES.map((c, i) => (
          <a key={c.slug} href={href.category(c.slug)} className="group block" data-reveal={(i % 3) * 0.06}>
            <div className="aspect-[3/4] overflow-hidden bg-[var(--bg-silk)]">
              <img src={c.hero} alt={c.name} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
              <span className="font-serif-editorial text-2xl">{c.name}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
