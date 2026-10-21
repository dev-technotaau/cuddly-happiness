import { pic } from '../../data/catalog'
import { HOUSE, HOUSE_IMG } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import SectionHeader from './SectionHeader'

const COPY = bilingual(
  {
    eyebrow: 'Three generations',
    title: 'Since <em>1962</em>, one family.',
    aside: 'Six dates in the life of a house that has never left Montréal, nor its bench.',
    label: 'The house, year by year',
    open: '“',
    quote: 'Teresa believed a jewel should <em>outlive</em> its maker.',
    by: 'Antonio Moretti · Second generation',
    commission: 'Commission a piece',
  },
  {
    eyebrow: 'Trois générations',
    title: 'Depuis <em>1962</em>, une famille.',
    aside: 'Six dates dans la vie d’une maison qui n’a jamais quitté Montréal, ni son établi.',
    label: 'La maison, année après année',
    open: '«',
    quote: 'Teresa croyait qu’un bijou doit <em>survivre</em> à son créateur.',
    by: 'Antonio Moretti · Deuxième génération',
    commission: 'Commander une création',
  },
)

/** Three generations: the house's years on a hairline, each with an archive-toned photograph. It scrolls sideways on
 *  every screen; the years are placeholders until the family confirms them. With `coda` (Home), Teresa's words close
 *  the years. */
export default function Generations({ index, coda = false }: { index: string; coda?: boolean }) {
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  return (
    <section className="overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 pt-28 lg:px-12 lg:pt-36">
        <SectionHeader tone="dark" index={index} eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-champagne)]')} aside={<p className="max-w-xs text-sm leading-relaxed text-white/60">{t.aside}</p>} />
      </div>
      <ol aria-label={t.label} className={`relative mx-auto flex max-w-[1600px] snap-x snap-mandatory scroll-px-6 gap-10 overflow-x-auto overscroll-x-contain px-6 lg:scroll-px-12 lg:px-12 ${coda ? 'pb-16 lg:pb-20' : 'pb-28 lg:pb-36'}`} data-lenis-prevent-horizontal>
        {house.years.map(([year, title, text], i) => (
          <li key={year} data-reveal={i * 0.06} className="relative w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[24vw]">
            {/* The hairline that joins the years */}
            <span aria-hidden className="absolute left-0 right-[-2.5rem] top-[0.62em] h-px bg-white/15 text-6xl" />
            <p className="font-serif-editorial relative text-6xl font-light !oldstyle-nums text-[var(--gold-champagne)]">
              <span className="relative bg-[var(--bg-vault)] pr-4">{year}</span>
            </p>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden">
              <img {...pic(HOUSE_IMG.years[i], '(min-width: 1024px) 24vw, 78vw')} alt="" loading="lazy" className="h-full w-full object-cover [filter:grayscale(1)_sepia(0.35)_contrast(1.05)_brightness(0.9)]" />
            </div>
            <p className="font-serif-editorial mt-6 text-2xl">{title}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">{text}</p>
          </li>
        ))}
      </ol>
      {coda && (
        <div className="mx-auto max-w-[1600px] px-6 pb-28 lg:px-12 lg:pb-36">
          <figure className="max-w-4xl border-t border-white/15 pt-14">
            <span data-reveal aria-hidden="true" className="font-serif-editorial block text-8xl leading-none text-[var(--gold-champagne)]">{t.open}</span>
            <blockquote data-reveal="0.05" className="font-serif-editorial -mt-6 text-4xl font-light leading-[1.1] lg:text-[3.5rem]">{rich(t.quote, 'text-[var(--gold-champagne)]')}</blockquote>
            <figcaption data-reveal="0.1" className="font-spec mt-8 text-[10px] uppercase tracking-[0.26em] text-white/60">{t.by}</figcaption>
          </figure>
          <a data-reveal="0.15" href={href.atelier} className="link-line mt-12 text-[var(--bg-travertine)]">{t.commission}</a>
        </div>
      )}
    </section>
  )
}
