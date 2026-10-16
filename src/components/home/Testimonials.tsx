import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

const QUOTES = [
  { q: 'They found my grandmother’s sapphire a new home in a ring I’ll pass on to my daughter. Every visit felt like family.', a: 'Camille R.', loc: 'Outremont, QC', piece: 'Heirloom Redesign' },
  { q: 'I proposed in Paris with a Notre-Dame oval. The GIA report, the fitting, the courier to New York — flawless.', a: 'Daniel K.', loc: 'Brooklyn, NY', piece: 'Notre-Dame Oval Solitaire' },
  { q: 'Rented the Gala Collar for the Met fundraiser. Delivered to my hotel, collected the next morning. Unforgettable.', a: 'Priya S.', loc: 'Toronto, ON', piece: 'Gala Diamond Collar' },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % QUOTES.length), 6500)
    return () => window.clearInterval(id)
  }, [])
  const q = QUOTES[i]

  return (
    <section className="border-y border-[var(--border-hairline)] bg-[var(--bg-travertine)]">
      <div className="mx-auto max-w-5xl px-6 py-28 text-center lg:py-36">
        <div data-reveal className="flex items-center justify-center gap-1 text-[var(--gold-vermeil)]">
          {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} strokeWidth={1.2} className="fill-current" />)}
          <span className="font-spec ml-3 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">4.9 / 5 · 1,200+ reviews</span>
        </div>
        <blockquote key={i} className="font-serif-editorial mt-10 animate-[fadeUp_1s_cubic-bezier(0.16,1,0.3,1)] text-3xl font-light leading-snug sm:text-4xl lg:text-5xl">
          “{q.q}”
        </blockquote>
        <p className="mt-10 text-[11px] uppercase tracking-[0.24em]">{q.a} <span className="text-[var(--text-linen)]">· {q.loc}</span></p>
        <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--gold-vermeil)]">{q.piece}</p>
        <div className="mt-10 flex justify-center gap-3">
          {QUOTES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Testimonial ${k + 1}`} className={`h-px transition-all duration-500 ${k === i ? 'w-12 bg-[var(--text-espresso)]' : 'w-6 bg-[var(--border-hairline)]'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
