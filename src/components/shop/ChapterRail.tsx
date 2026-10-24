import { ArrowRight } from 'lucide-react'
import { CATEGORIES, pic, type CategorySlug } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { href } from '../../store'

const COPY = bilingual(
  { label: 'Walk the chapters', all: 'Every chapter', open: (name: string) => `Open the ${name} chapter` },
  { label: 'Parcourez les chapitres', all: 'Tous les chapitres', open: (name) => `Ouvrir le chapitre ${name}` },
)

interface Props {
  /** The chapters chosen in the filters. */
  selected: string[]
  /** How many pieces each chapter holds with the other choices kept, and all of them together. */
  counts: Record<string, number>
  total: number
  /** One chapter, or every chapter (null). */
  onPick: (slug: CategorySlug | null) => void
}

/** The nine chapters as picture tiles under the hero: each one narrows the pieces below to itself, in place (press it
 *  again, or "Every chapter", to see them all), with how many pieces it holds. A chapter chosen alone offers its own
 *  page. A row that scrolls sideways on phones. */
export default function ChapterRail({ selected, counts, total, onPick }: Props) {
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const only = selected.length === 1 ? CATEGORIES.find((c) => c.slug === selected[0]) : undefined
  const tile = 'group w-[112px] shrink-0 text-left transition-opacity duration-500 disabled:cursor-default disabled:opacity-40 lg:w-auto lg:min-w-0 lg:flex-1'
  const frame = (on: boolean) => `relative block aspect-[4/5] overflow-hidden outline outline-1 outline-offset-[3px] transition-[outline-color] duration-500 ${on ? 'outline-[var(--text-espresso)]' : 'outline-transparent group-hover:outline-[var(--border-hairline)]'}`
  const name = (on: boolean) => `font-serif-editorial mt-3 block min-h-[2.5em] text-balance text-[15px] leading-tight transition-colors lg:text-base ${on ? 'text-[var(--text-espresso)]' : 'text-[var(--text-espresso)]/80 group-hover:text-[var(--text-espresso)]'}`
  const count = 'font-spec mt-1 block text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]'

  return (
    <nav aria-labelledby="shop-chapters" className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
      <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-9 lg:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p id="shop-chapters" data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.label}</p>
          {only && (
            <a href={href.category(only.slug)} className="link-line text-[11px]">{t.open(catalog.category(only).name)} <ArrowRight size={13} strokeWidth={1.4} /></a>
          )}
        </div>
        <div data-reveal="0.05" className="-mx-6 mt-5 overflow-x-auto overscroll-x-contain px-6 pb-2 lg:mx-0 lg:overflow-visible lg:px-0" data-lenis-prevent-horizontal>
          <div role="group" aria-labelledby="shop-chapters" className="flex w-max gap-4 pt-1 lg:w-auto">
            <button type="button" aria-pressed={selected.length === 0} onClick={() => onPick(null)} className={tile}>
              <span className={`${frame(selected.length === 0)} flex items-center justify-center bg-[var(--bg-vault)]`}>
                <span aria-hidden="true" className="font-serif-editorial text-5xl font-light text-[var(--gold-champagne)] transition-transform duration-700 group-hover:scale-110">∞</span>
              </span>
              <span className={name(selected.length === 0)}>{t.all}</span>
              <span className={count}>{common.pieces(total)}</span>
            </button>
            {CATEGORIES.map((c) => {
              const on = selected.includes(c.slug)
              const n = counts[c.slug] ?? 0
              return (
                <button key={c.slug} type="button" aria-pressed={on} disabled={!n && !on} onClick={() => onPick(on && selected.length === 1 ? null : c.slug)} className={tile}>
                  <span className={`${frame(on)} bg-[var(--bg-travertine)]`}>
                    <img {...pic(c.hero, '140px')} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                    <span className="font-spec absolute left-2 top-2 bg-[var(--bg-travertine)]/90 px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-[var(--gold-ink)]">{c.eyebrow}</span>
                  </span>
                  <span className={name(on)}>{catalog.category(c).name}</span>
                  <span className={count}>{common.pieces(n)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
