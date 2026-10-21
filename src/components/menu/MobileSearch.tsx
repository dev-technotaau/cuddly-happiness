import { useMemo, useRef, useState } from 'react'
import { MessageCircle, Search, X } from 'lucide-react'
import { CATEGORIES, PRODUCTS, SIGNATURES, cardPrice } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, pick, useCopy, useLocale } from '../../i18n'
import { catalogFor, useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'
import Marked from './Marked'
import { KEYWORDS, chapterFields, entry, pieceFields, rank, signatureFields, type Entry } from './search'

const COPY = bilingual(
  {
    search: 'Search the maison',
    searchLabel: 'Search pieces, chapters and pages',
    clear: 'Clear search',
    results: (n: number, q: string) => `${n} result${n === 1 ? '' : 's'} for “${q}”`,
    noResults: 'No results',
    groups: { chapters: 'Chapters', pieces: 'Pieces', elsewhere: 'Elsewhere' },
    from: 'From',
    nothing: (q: string) => `Nothing matches <em>“${q}”</em>.`,
    tryThese: 'Try a stone, a metal or a Montréal place:',
    suggestions: ['Diamond', 'Pearl', 'Emerald', 'Mont-Royal', 'Platinum'],
    ask: 'Or ask a jeweller',
    pages: { atelier: 'The Atelier', giftcards: 'Gift Cards', wishlist: 'Wishlist', account: 'Your account', signIn: 'Sign in', cart: 'Your bag', home: 'Home' },
  },
  {
    search: 'Rechercher dans la maison',
    searchLabel: 'Rechercher des pièces, des chapitres et des pages, en français ou en anglais',
    clear: 'Effacer la recherche',
    results: (n, q) => `${n} résultat${n < 2 ? '' : 's'} pour « ${q} »`,
    noResults: 'Aucun résultat',
    groups: { chapters: 'Chapitres', pieces: 'Pièces', elsewhere: 'Ailleurs' },
    from: 'Dès',
    nothing: (q) => `Rien ne correspond à <em>« ${q} »</em>.`,
    tryThese: 'Essayez une pierre, un métal ou un lieu de Montréal :',
    suggestions: ['Diamant', 'Perle', 'Émeraude', 'Mont-Royal', 'Platine'],
    ask: 'Ou parlez à un joaillier',
    pages: { atelier: 'L’Atelier', giftcards: 'Cartes-cadeaux', wishlist: 'Liste de souhaits', account: 'Votre compte', signIn: 'Se connecter', cart: 'Votre panier', home: 'Accueil' },
  },
)

// A chapter or a signature page: where a search can lead besides a piece.
interface Way {
  id: string
  mark: string
  title: string
  url: string
  signature: boolean
}

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

/** Search on phones, at the head of the mobile menu: the desktop menu's ranking over pieces, chapters and pages, in both
 *  languages, with the results standing in for the menu while the visitor types. */
export default function MobileSearch({ autoFocus = false, onClose, children }: Props) {
  const { currency, user, openAsk } = useStore()
  const { lang } = useLocale()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const [query, setQuery] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const q = query.trim()

  // As on desktop, search reads both languages ("ring" on the French site, "bague" on the English one); the language
  // on screen ranks first, and results show in it.
  const index = useMemo(() => {
    const otherLocale = lang === 'fr' ? 'en-CA' : 'fr-CA'
    const other = catalogFor(otherLocale)
    const otherHouse = pick(HOUSE, otherLocale)
    const pages = [
      { id: 'g:atelier', title: t.pages.atelier, url: href.atelier },
      { id: 'g:giftcards', title: t.pages.giftcards, url: href.giftcards },
      { id: 'g:wishlist', title: t.pages.wishlist, url: href.wishlist },
      { id: 'g:account', title: user ? t.pages.account : t.pages.signIn, url: href.account },
      { id: 'g:cart', title: t.pages.cart, url: href.cart },
      { id: 'g:home', title: t.pages.home, url: href.home },
    ]
    return {
      // The two signature pages rank with the chapters.
      chapters: [
        ...SIGNATURES.map((x): Entry<Way> => entry(`sig:${x.id}`, { id: `sig:${x.id}`, mark: '✦', title: house.signatures[x.id].name, url: href.category(x.category, { type: x.family }), signature: true }, signatureFields(house.signatures[x.id], otherHouse.signatures[x.id]))),
        ...CATEGORIES.map((c): Entry<Way> => entry(c.slug, { id: c.slug, mark: c.eyebrow, title: catalog.category(c).name, url: href.category(c.slug), signature: false }, chapterFields(c, catalog, other))),
      ],
      pieces: PRODUCTS.map((p) => entry(p.slug, p, pieceFields(p, catalog, other))),
      pages: pages.map((d) => entry(d.id, d, [[d.title, 10], [KEYWORDS[d.id] ?? '', 4]])),
    }
  }, [catalog, house, lang, t, user])

  const chapters = rank(index.chapters, q, 3).map((e) => e.item)
  const pieces = rank(index.pieces, q, 6).map((e) => e.item)
  const pages = rank(index.pages, q, 3).map((e) => e.item)
  const count = chapters.length + pieces.length + pages.length
  const suggest = (s: string) => {
    setQuery(s)
    field.current?.focus()
  }

  return (
    <>
      {/* Enter opens the first result */}
      <form role="search" onSubmit={(e) => { e.preventDefault(); results.current?.querySelector<HTMLElement>('a')?.click() }} className="mt-6">
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
      </form>

      {q ? (
        <div ref={results} className="mt-6 pb-10">
          <p role="status" className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{count ? t.results(count, q) : t.noResults}</p>

          {chapters.length > 0 && (
            <section className="mt-7">
              <p className={eyebrow}>{t.groups.chapters}</p>
              <ul className="mt-2">
                {chapters.map((w) => (
                  <li key={w.id} className="border-b border-[var(--border-hairline)]">
                    <a href={w.url} onClick={onClose} className="flex items-baseline gap-4 py-3.5">
                      <span aria-hidden={w.signature || undefined} className="font-spec w-6 shrink-0 text-[10px] text-[var(--gold-ink)]">{w.mark}</span>
                      <span className={`font-serif-editorial text-2xl leading-tight ${w.signature ? 'italic' : ''}`}><Marked text={w.title} query={q} /></span>
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
                  const shown = cardPrice(p, currency)
                  return (
                    <li key={p.slug} className="border-b border-[var(--border-hairline)]">
                      <a href={href.product(p.slug)} onClick={onClose} className="flex items-center gap-4 py-3">
                        <span className="h-[60px] w-12 shrink-0 overflow-hidden bg-[var(--bg-silk)]">
                          <img src={sized(p.images[0], 160)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-spec block truncate text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{copy.collection} · {catalog.category(p.category).name}</span>
                          <span className="font-serif-editorial mt-1 block truncate text-xl leading-tight"><Marked text={copy.name} query={q} /></span>
                          <span className="font-spec mt-1 block text-[11px] text-[var(--text-taupe)]">{shown.rent && `${t.from} `}<Price amount={shown.amount} /></span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {pages.length > 0 && (
            <section className="mt-8">
              <p className={eyebrow}>{t.groups.elsewhere}</p>
              <ul className="mt-2">
                {pages.map((d) => (
                  <li key={d.id} className="border-b border-[var(--border-hairline)]">
                    <a href={d.url} onClick={onClose} className="font-serif-editorial block py-3.5 text-2xl italic leading-tight"><Marked text={d.title} query={q} /></a>
                  </li>
                ))}
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
