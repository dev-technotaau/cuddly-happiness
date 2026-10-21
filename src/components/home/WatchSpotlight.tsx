import { IMG, getProductsByCategory, openingPrice, pic } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'

const COPY = bilingual(
  {
    limited: 'Limited · 62 pieces',
    chapter: 'Chapter VI · Horlogerie',
    title: 'Time, <em>kept</em> beautifully.',
    text: 'Swiss timepieces regulated by our in-house horologist, with complimentary case-back engraving and a five-year service plan.',
  },
  {
    limited: 'Édition limitée · 62 pièces',
    chapter: 'Chapitre VI · Horlogerie',
    title: 'Le temps, <em>gardé</em> avec art.',
    text: 'Des garde-temps suisses réglés par notre horloger maison, avec gravure du fond de boîtier offerte et un plan d’entretien de cinq ans.',
  },
)

/** The watches: the chronograph in its limited edition, the in-house horologist and the service plan, and (on Home) the
 *  three watches. On the Watches chapter (`inChapter`) it opens the page without the list, which the grid below shows. */
export default function WatchSpotlight({ index, inChapter = false }: { index: string; inChapter?: boolean }) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const watches = getProductsByCategory('watches')
  return (
    <section className={`mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36 ${inChapter ? 'border-b border-[var(--border-hairline)]' : ''}`}>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="group relative aspect-[4/5] overflow-hidden lg:col-span-5">
          <img data-parallax {...pic(IMG.chrono, '(min-width: 1024px) 40vw, 100vw')} alt="Chronographe 1962" loading="lazy" className="h-full w-full object-cover" />
          <span className="font-spec absolute bottom-5 left-5 bg-[var(--bg-travertine)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em]">{t.limited}</span>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]"><span className="mr-4 text-[var(--text-taupe)]">{index}</span>{t.chapter}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h2>
          <p data-reveal="0.1" className="mt-6 max-w-md text-[var(--text-taupe)]">
            {t.text}
          </p>
          {!inChapter && <ul className="mt-12 border-t border-[var(--border-hairline)]">
            {watches.map((w, i) => (
              <li key={w.id} data-reveal={0.1 + i * 0.05}>
                <a href={href.product(w.slug)} className="group flex items-center gap-6 border-b border-[var(--border-hairline)] py-6">
                  <span className="font-spec text-[10px] text-[var(--gold-ink)]">0{i + 1}</span>
                  <div className="h-16 w-14 shrink-0 overflow-hidden">
                    <img src={w.images[0]} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-serif-editorial text-2xl transition-colors group-hover:text-[var(--gold-vermeil)] lg:text-3xl">{catalog.name(w)}</p>
                    <p className="font-spec mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">{catalog.spec(w, 'Case')} · {catalog.spec(w, 'Movement')}</p>
                  </div>
                  <Price amount={openingPrice(w, currency)} className="hidden text-sm sm:inline" />
                </a>
              </li>
            ))}
          </ul>}
        </div>
      </div>
    </section>
  )
}
