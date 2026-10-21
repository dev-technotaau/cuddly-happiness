import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import Hallmark from '../brand/Hallmark'

const COPY = bilingual({ eyebrow: 'The house in four numbers' }, { eyebrow: 'La maison en quatre chiffres' })

/** The house in four numbers: its year, its generations, the hours in a ring and its one atelier, set large on the
 *  vault ground. Facts, not adjectives. */
export default function HouseNumbers() {
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  return (
    <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-32">
        <div data-reveal className="flex items-center gap-5">
          <Hallmark className="h-10 w-10 text-[var(--gold-champagne)]" />
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-white/55">{t.eyebrow}</p>
          <span className="h-px flex-1 bg-white/15" />
        </div>
        <dl className="mt-16 grid gap-y-14 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {house.numbers.map(([n, label], i) => (
            <div key={label} data-reveal={i * 0.08} className="lg:px-10 lg:first:pl-0">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className={`font-serif-editorial block text-[5.5rem] font-light leading-none text-[var(--gold-champagne)] lg:text-[7.5rem] ${n === '1962' ? '!oldstyle-nums' : ''}`}>{n}</span>
                <span aria-hidden className="font-spec mt-5 block max-w-[16rem] text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/60">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
