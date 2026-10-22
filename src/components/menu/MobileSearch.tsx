import { useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarHeart, MessageCircle, Search, X } from 'lucide-react'
import { cardPrice } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'
import Marked from './Marked'
import useHouseSearch from './useHouseSearch'

const COPY = bilingual(
  {
    search: 'Search the maison',
    searchLabel: 'Search pieces, chapters and pages',
    clear: 'Clear search',
    results: (n: number, q: string) => `${n} result${n === 1 ? '' : 's'} for “${q}”`,
    noResults: 'No results',
    groups: { chapters: 'Chapters', pieces: 'Pieces', elsewhere: 'Elsewhere' },
    from: 'From',
    fixed: (text: string) => `Showing results for <em>${text}</em>`,
    seeAll: (n: number) => `See all ${n} pieces`,
    nothing: (q: string) => `Nothing matches <em>“${q}”</em>.`,
    tryThese: 'Try a stone, a metal or a Montréal place:',
    suggestions: ['Diamond', 'Pearl', 'Emerald', 'Mont-Royal', 'Platinum'],
    ask: 'Or ask a jeweller',
  },
  {
    search: 'Rechercher dans la maison',
    searchLabel: 'Rechercher des pièces, des chapitres et des pages, en français ou en anglais',
    clear: 'Effacer la recherche',
    results: (n, q) => `${n} résultat${n < 2 ? '' : 's'} pour « ${q} »`,
    noResults: 'Aucun résultat',
    groups: { chapters: 'Chapitres', pieces: 'Pièces', elsewhere: 'Ailleurs' },
    from: 'Dès',
    fixed: (text) => `Résultats pour <em>${text}</em>`,
    seeAll: (n) => `Voir les ${n} pièces`,
    nothing: (q) => `Rien ne correspond à <em>« ${q} »</em>.`,
    tryThese: 'Essayez une pierre, un métal ou un lieu de Montréal :',
    suggestions: ['Diamant', 'Perle', 'Émeraude', 'Mont-Royal', 'Platine'],
    ask: 'Ou parlez à un joaillier',
  },
)

const eyebrow = 'font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]'
const sized = (src: string, w: number) => src.replace(/w=\d+/, `w=${w}`)

interface Props {
  /** Focus the field as the menu opens: the header's search button. */
  autoFocus?: boolean
  /** Close the menu: a result was chosen, or the visitor went to ask a jeweller. */
  onClose: () => void
  /** The menu itself, shown while nothing is typed. */
  children: React.ReactNode
}

/** Search on phones, at the head of the mobile menu: the header search's own reading of a query (both languages, prices,
 *  renting, typos) over chapters, pieces and pages, with the results standing in for the menu while the visitor types. */
export default function MobileSearch({ autoFocus = false, onClose, children }: Props) {
  const { currency, openAsk, openVisit, rememberSearch } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const { find } = useHouseSearch()
  const [query, setQuery] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const go = useRef<HTMLAnchorElement>(null)
  const q = query.trim()
  const found = useMemo(() => (q ? find(q, currency) : null), [q, currency, find])
  const r = found?.reading
  const pieces = found ? found.pieces.slice(0, 6) : []
  const count = found ? found.ways.length + found.pieces.length + found.doors.length : 0
  const suggest = (s: string) => {
    setQuery(s)
    field.current?.focus()
  }
  // A result chosen: the search is remembered and the menu closes.
  const follow = () => {
    rememberSearch(q)
    onClose()
  }
  const act = (action: 'visit' | 'ask') => {
    follow()
    if (action === 'visit') openVisit()
    else openAsk()
  }
  // Enter goes where the query lands: an exact chapter, kind or page, the one piece, else every match.
  const submit = () => {
    const landing = found?.landing
    if (!landing) return
    if ('action' in landing) act(landing.action)
    else go.current?.click()
  }

  return (
    <>
      <form role="search" onSubmit={(e) => { e.preventDefault(); submit() }} className="mt-6">
        <label className="flex items-center gap-3 border-b border-[var(--border-hairline)] transition-colors focus-within:border-[var(--text-espresso)]">
          <Search size={16} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--text-taupe)]" />
          {/* 16 px, so phones don't zoom into the field */}
          <input ref={field} type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); e.stopPropagation(); setQuery('') } }} autoFocus={autoFocus} enterKeyHint="search" placeholder={t.search} aria-label={t.searchLabel} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} className="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none placeholder:text-[var(--text-taupe)] [&::-webkit-search-cancel-button]:hidden" />
          {query && (
            <button type="button" onClick={() => { setQuery(''); field.current?.focus() }} aria-label={t.clear} className="-mr-3 flex h-11 w-11 shrink-0 items-center justify-center text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]">
              <X size={16} strokeWidth={1.4} />
            </button>
          )}
        </label>
        <a ref={go} href={found?.landing && 'url' in found.landing ? found.landing.url : href.shop()} onClick={follow} hidden tabIndex={-1} aria-hidden="true" />
      </form>

      {found && r ? (
        <div className="mt-6 pb-10">
          <p role="status" className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{count ? t.results(count, q) : t.noResults}</p>
          {r.fixes.length > 0 && <p className="font-serif-editorial mt-3 text-lg text-[var(--text-taupe)]">{rich(t.fixed(r.text), 'text-[var(--text-espresso)]')}</p>}

          {found.ways.length > 0 && (
            <section className="mt-7">
              <p className={eyebrow}>{t.groups.chapters}</p>
              <ul className="mt-2">
                {found.ways.map((w) => (
                  <li key={w.id} className="border-b border-[var(--border-hairline)]">
                    <a href={w.url} onClick={follow} className="flex items-baseline gap-4 py-3.5">
                      <span aria-hidden={w.signature || undefined} className="font-spec w-6 shrink-0 text-[10px] text-[var(--gold-ink)]">{w.mark}</span>
                      <span className={`font-serif-editorial text-2xl leading-tight ${w.signature ? 'italic' : ''}`}><Marked text={w.title} query={r.words} /></span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pieces.length > 0 && (
            <section className="mt-8">
              <p className={eyebrow}>{t.groups.pieces}</p>
              <ul className="mt-2">
                {pieces.map((p) => {
                  const copy = catalog.product(p)
                  const rent = found.rentLed(p)
                  const shown = cardPrice(p, currency, rent)
                  return (
                    <li key={p.slug} className="border-b border-[var(--border-hairline)]">
                      <a href={href.product(p.slug, rent)} onClick={follow} className="flex items-center gap-4 py-3">
                        <span className="h-[60px] w-12 shrink-0 overflow-hidden bg-[var(--bg-silk)]">
                          <img src={sized(p.images[0], 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-spec block truncate text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{copy.collection} · {catalog.category(p.category).name}</span>
                          <span className="font-serif-editorial mt-1 block truncate text-xl leading-tight"><Marked text={copy.name} query={r.text} /></span>
                          <span className="font-spec mt-1 block text-[11px] text-[var(--text-taupe)]">{shown.rent && `${t.from} `}<Price amount={shown.amount} /></span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
              {found.pieces.length > pieces.length && (
                <a href={href.shop({ q })} onClick={follow} className="link-line mt-6">
                  {t.seeAll(found.pieces.length)} <ArrowRight size={14} strokeWidth={1.4} />
                </a>
              )}
            </section>
          )}

          {found.doors.length > 0 && (
            <section className="mt-8">
              <p className={eyebrow}>{t.groups.elsewhere}</p>
              <ul className="mt-2">
                {found.doors.map((d) => {
                  const action = d.action
                  return (
                    <li key={d.id} className="border-b border-[var(--border-hairline)]">
                      {action ? (
                        <button type="button" onClick={() => act(action)} className="font-serif-editorial flex w-full items-center gap-3 py-3.5 text-left text-2xl italic leading-tight">
                          {action === 'visit' ? <CalendarHeart size={16} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" /> : <MessageCircle size={16} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" />}
                          <Marked text={d.title} query={r.words} />
                        </button>
                      ) : (
                        <a href={d.url} onClick={follow} className="font-serif-editorial block py-3.5 text-2xl italic leading-tight"><Marked text={d.title} query={r.words} /></a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Nothing found: a few ways in, and a person to ask */}
          {!count && (
            <div className="mt-4">
              <p className="font-serif-editorial text-[1.75rem] leading-snug">{rich(t.nothing(q), 'text-[var(--gold-vermeil)]')}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{t.tryThese}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {t.suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => suggest(s)} className="rounded-full border border-[var(--border-hairline)] px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-[var(--text-espresso)]">{s}</button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => { onClose(); openAsk() }} className="mt-10 flex items-center gap-2.5 border-b border-[var(--gold-vermeil)] pb-1 text-[11px] font-medium uppercase tracking-[0.24em]">
                <MessageCircle size={14} strokeWidth={1.4} /> {t.ask}
              </button>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </>
  )
}
