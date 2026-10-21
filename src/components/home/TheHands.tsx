import { ArrowRight } from 'lucide-react'
import { pic } from '../../data/catalog'
import { HOUSE, HOUSE_IMG } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import SectionHeader from './SectionHeader'

// The generation each pair of hands belongs to, in the order of HOUSE.hands.
const GENERATION = ['III', 'II', 'II']

const COPY = bilingual(
  { eyebrow: 'The hands', title: 'Three generations, <em>one bench</em>.', atelier: 'Visit the atelier' },
  { eyebrow: 'Les mains', title: 'Trois générations, <em>un seul établi</em>.', atelier: 'Visiter l’atelier' },
)

/** The hands behind each piece: the designer and the two masters at the bench, with a line from each. Names and roles
 *  are placeholders until the family confirms them; the photographs show hands at work, not the family. */
export default function TheHands({ index }: { index: string }) {
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const common = useCopy(COMMON)
  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
      <SectionHeader index={index} eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-vermeil)]')} aside={<a href={href.atelier} className="link-line group">{t.atelier} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></a>} />
      <div className="grid gap-x-8 gap-y-16 md:grid-cols-3">
        {house.hands.map(([name, role, quote], i) => (
          <figure key={name} data-reveal={i * 0.08} className={i === 1 ? 'md:mt-20' : ''}>
            <div className="group relative aspect-[3/4] overflow-hidden bg-[var(--bg-silk)]">
              <img {...pic(HOUSE_IMG.hands[i], '(min-width: 768px) 31vw, 100vw')} alt="" loading="lazy" className="h-full w-full object-cover grayscale-[0.35] transition-[filter,transform] duration-1000 group-hover:scale-[1.03] group-hover:grayscale-0" />
              <span aria-hidden className="font-serif-editorial absolute left-5 top-4 text-5xl font-light italic text-white/85 mix-blend-overlay">{GENERATION[i]}</span>
            </div>
            <figcaption className="mt-7">
              <p className="font-serif-editorial text-3xl">{name}</p>
              <p className="font-spec mt-1 text-[10px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{role}</p>
              <blockquote className="font-serif-editorial mt-5 max-w-sm text-xl italic leading-snug text-[var(--text-taupe)]">{common.quote(quote)}</blockquote>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
