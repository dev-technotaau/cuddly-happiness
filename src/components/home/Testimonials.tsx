import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { getProduct } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'

// Placeholder testimonials. Clients wrote in English; the French site shows a translation and says so.
const QUOTES = [
  { a: 'Camille R.', loc: 'Outremont, QC', piece: 'heirloom-redesign' },
  { a: 'Daniel K.', loc: 'Brooklyn, NY', piece: 'notre-dame-oval-solitaire' },
  { a: 'Priya S.', loc: 'Toronto, ON', piece: 'gala-diamond-collar' },
]

const COPY = bilingual(
  {
    quotes: [
      'They found my grandmother’s sapphire a new home in a ring I’ll pass on to my daughter. Every visit felt like family.',
      'I proposed in Paris with a Notre-Dame oval. The GIA report, the fitting, the courier to New York — flawless.',
      'Rented the Gala Collar for the Met fundraiser. Delivered to my hotel, collected the next morning. Unforgettable.',
    ],
    eyebrow: 'Families who come back',
    quote: (s: string) => `“${s}”`,
    rating: '4.9 / 5 · 1,200+ reviews',
    translated: '',
    show: (n: number) => `Testimonial ${n}`,
  },
  {
    quotes: [
      'Ils ont trouvé au saphir de ma grand-mère une nouvelle demeure, dans une bague que je transmettrai à ma fille. Chaque visite avait un air de famille.',
      'J’ai fait ma demande à Paris avec un ovale Notre-Dame. Le rapport GIA, l’ajustement, la livraison par messager jusqu’à New York — un sans-faute.',
      'J’ai loué le collier Gala pour la soirée-bénéfice du Met. Livré à mon hôtel, repris le lendemain matin. Inoubliable.',
    ],
    eyebrow: 'Des familles qui reviennent',
    quote: (s) => `« ${s} »`,
    rating: '4,9 / 5 · plus de 1 200 avis',
    translated: 'Traduit de l’anglais',
    show: (n) => `Témoignage ${n}`,
  },
)

/** Families who come back: client words, one at a time, with the piece each one wears. */
export default function Testimonials({ index }: { index: string }) {
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % QUOTES.length), 6500)
    return () => window.clearInterval(id)
  }, [])
  const q = QUOTES[i]
  const piece = getProduct(q.piece)

  return (
    <section className="bg-[var(--bg-silk)]">
      <div className="mx-auto max-w-5xl px-6 py-28 text-center lg:py-36">
        <p data-reveal className="font-spec mb-10 text-[10px] uppercase tracking-[0.3em] text-[var(--text-taupe)]"><span className="mr-4 text-[var(--gold-ink)]">{index}</span>{t.eyebrow}</p>
        <div data-reveal className="flex items-center justify-center gap-1 text-[var(--gold-vermeil)]">
          {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} strokeWidth={1.2} className="fill-current" />)}
          <span className="font-spec ml-3 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{t.rating}</span>
        </div>
        <blockquote key={i} className="font-serif-editorial mt-10 animate-[fadeUp_1s_cubic-bezier(0.16,1,0.3,1)] text-3xl font-light leading-snug sm:text-4xl lg:text-5xl">
          {t.quote(t.quotes[i])}
        </blockquote>
        <p className="mt-10 text-[11px] uppercase tracking-[0.24em]">{q.a} <span className="text-[var(--text-taupe)]">· {q.loc}</span></p>
        <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--gold-ink)]">{piece ? catalog.name(piece) : ''}</p>
        {t.translated && <p className="mt-3 text-[11px] italic text-[var(--text-taupe)]">{t.translated}</p>}
        <div className="mt-10 flex justify-center gap-3">
          {QUOTES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={t.show(k + 1)} className={`h-px transition-all duration-500 ${k === i ? 'w-12 bg-[var(--text-espresso)]' : 'w-6 bg-[var(--border-hairline)]'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
