import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IMG } from '../../data/catalog'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  { n: '01', t: 'The sketch', d: 'Every piece begins in graphite at Teresa’s original drafting table.', img: IMG.ring2 },
  { n: '02', t: 'The stone', d: 'Hand-selected GIA diamonds and ethically sourced coloured gems.', img: IMG.ring1 },
  { n: '03', t: 'The casting', d: 'Recycled 18k gold and platinum, alloyed and cast in Montreal.', img: IMG.rings },
  { n: '04', t: 'The setting', d: 'Each claw raised and tightened under the microscope by Marco.', img: IMG.bridal1 },
  { n: '05', t: 'The polish', d: 'Twelve stages of hand-finishing, then hallmarked and boxed.', img: IMG.necklace1 },
]

export default function MakingScroll() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!root.current || !track.current) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const t = track.current!
      const distance = () => t.scrollWidth - window.innerWidth
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 112px',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      gsap.to('[data-making-progress]', { scaleX: 1, ease: 'none', scrollTrigger: tween.scrollTrigger ? { trigger: root.current, start: 'top 112px', end: () => `+=${distance()}`, scrub: true } : undefined })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="relative overflow-hidden bg-[var(--bg-silk)] lg:h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-[1600px] px-6 pt-24 lg:absolute lg:inset-x-0 lg:top-0 lg:px-12 lg:pt-16">
        <div className="flex items-end justify-between gap-8">
          <h2 className="font-serif-editorial text-5xl font-light leading-none tracking-[-0.02em] lg:text-7xl">
            <span className="font-spec mb-5 block text-[10px] font-normal uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">06 · The making</span>
            From <em className="text-[var(--gold-vermeil)]">bench</em> to heirloom
          </h2>
          <div className="hidden w-48 lg:block">
            <div className="h-px bg-[var(--border-hairline)]">
              <div data-making-progress className="h-px origin-left scale-x-0 bg-[var(--gold-vermeil)]" />
            </div>
            <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">Five stages · 40+ hours</p>
          </div>
        </div>
      </div>
      <div ref={track} className="flex gap-8 overflow-x-auto px-6 py-16 lg:h-full lg:items-end lg:overflow-visible lg:px-12 lg:pb-16 lg:pt-44">
        {STEPS.map((s, i) => (
          <article key={s.n} className={`group w-[78vw] shrink-0 sm:w-[46vw] lg:w-[30vw] ${i % 2 ? 'lg:mb-16' : ''}`}>
            <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-travertine)] lg:aspect-[5/6] lg:max-h-[48vh] lg:w-full">
              <img src={s.img} alt={s.t} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
            </div>
            <div className="mt-5 flex gap-5">
              <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">{s.n}</span>
              <div>
                <h3 className="font-serif-editorial text-3xl">{s.t}</h3>
                <p className="mt-2 max-w-xs text-sm text-[var(--text-taupe)]">{s.d}</p>
              </div>
            </div>
          </article>
        ))}
        <div className="hidden w-[10vw] shrink-0 lg:block" />
      </div>
    </section>
  )
}
