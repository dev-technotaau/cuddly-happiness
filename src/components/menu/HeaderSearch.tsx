import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, CalendarHeart, CornerDownLeft, History, MessageCircle, Search, X } from 'lucide-react'
import { PRODUCTS, SIGNATURES, cardPrice, formatPrice, getProduct, rentFirst, signaturePieces, type Product } from '../../data/catalog'
import { HOUSE, HOUSE_IMG } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, parseHash, useStore } from '../../store'
import Price from '../Price'
import { getLenis } from '../SmoothScroll'
import { eyebrow } from '../ui'
import Marked from './Marked'
import useHouseSearch from './useHouseSearch'

const COPY = bilingual(
  {
    search: 'Search',
    searchLong: 'Search the maison',
    label: 'Search pieces, chapters and pages',
    try: 'Try',
    hints: (price: string) => ['tennis necklaces', 'an oval solitaire', `a gift under ${price}`, 'Mont-Royal', 'pearls', 'a platinum band'],
    clear: 'Clear search',
    groups: { recent: 'Recent searches', begin: 'Begin with', signatures: 'Our signatures', viewed: 'Recently viewed', fresh: 'New arrivals', suggestions: 'Suggestions', chapters: 'Chapters', elsewhere: 'Elsewhere' },
    clearRecent: 'Clear',
    clearRecentLabel: 'Clear recent searches',
    begin: (price: string) => ['Engagement rings', 'Tennis necklaces', 'Wedding bands', `Gifts under ${price}`, 'To rent', 'Pearls'],
    signature: (numeral: string) => `Signature ${numeral}`,
    piecesFrom: (n: number) => `${n} piece${n === 1 ? '' : 's'} · from`,
    count: (n: number) => `${n} piece${n === 1 ? '' : 's'}`,
    seeAll: (n: number) => `See all ${n}`,
    from: 'From',
    aWeekend: 'a weekend',
    orRent: 'Or rent from',
    under: (p: string) => `Under ${p}`,
    over: (p: string) => `${p} and over`,
    between: (a: string, b: string) => `${a} – ${b}`,
    toRent: 'To rent',
    remove: (label: string) => `Remove “${label}”`,
    fixed: (text: string) => `Showing results for <em>${text}</em>`,
    nothing: (q: string) => `Nothing matches <em>“${q}”</em>.`,
    tryThese: 'Try a stone, a metal or a Montréal place:',
    chips: ['Diamond', 'Pearl', 'Emerald', 'Mont-Royal', 'Platinum'],
    cantFind: 'Can’t find it? The atelier can often source or make it.',
    ask: 'Ask a jeweller',
    keys: { move: 'Move', open: 'Open', close: 'Close', esc: 'Esc' },
    results: (n: number) => `${n} result${n === 1 ? '' : 's'}`,
    noResults: 'No results',
  },
  {
    search: 'Rechercher',
    searchLong: 'Rechercher dans la maison',
    label: 'Rechercher des pièces, des chapitres et des pages, en français ou en anglais',
    try: 'Cherchez',
    hints: (price) => ['des colliers tennis', 'un solitaire ovale', `un cadeau sous ${price}`, 'Mont-Royal', 'des perles', 'une alliance en platine'],
    clear: 'Effacer la recherche',
    groups: { recent: 'Recherches récentes', begin: 'Pour commencer', signatures: 'Nos signatures', viewed: 'Vus récemment', fresh: 'Nouveautés', suggestions: 'Suggestions', chapters: 'Chapitres', elsewhere: 'Ailleurs' },
    clearRecent: 'Effacer',
    clearRecentLabel: 'Effacer les recherches récentes',
    begin: (price) => ['Bagues de fiançailles', 'Colliers tennis', 'Alliances', `Cadeaux de moins de ${price}`, 'À louer', 'Perles'],
    signature: (numeral) => `Signature ${numeral}`,
    piecesFrom: (n) => `${n} pièce${n < 2 ? '' : 's'} · dès`,
    count: (n) => `${n} pièce${n < 2 ? '' : 's'}`,
    seeAll: (n) => `Voir les ${n}`,
    from: 'Dès',
    aWeekend: 'la fin de semaine',
    orRent: 'Ou en location dès',
    under: (p) => `Moins de ${p}`,
    over: (p) => `${p} et plus`,
    between: (a, b) => `${a} – ${b}`,
    toRent: 'À louer',
    remove: (label) => `Retirer « ${label} »`,
    fixed: (text) => `Résultats pour <em>${text}</em>`,
    nothing: (q) => `Rien ne correspond à <em>« ${q} »</em>.`,
    tryThese: 'Essayez une pierre, un métal ou un lieu de Montréal :',
    chips: ['Diamant', 'Perle', 'Émeraude', 'Mont-Royal', 'Platine'],
    cantFind: 'Vous ne la trouvez pas? L’atelier peut souvent la trouver ou la faire.',
    ask: 'Parler à un joaillier',
    keys: { move: 'Naviguer', open: 'Ouvrir', close: 'Fermer', esc: 'Échap' },
    results: (n) => `${n} résultat${n < 2 ? '' : 's'}`,
    noResults: 'Aucun résultat',
  },
)

const sized = (src: string, w: number) => src.replace(/w=\d+/, `w=${w}`)
const ease = 'ease-[cubic-bezier(0.16,1,0.3,1)]'
// A row of the lists. The active one (under the pointer or the arrow keys) sits on silk.
const row = 'group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 px-3 py-2 text-left transition-colors duration-300 aria-selected:bg-[var(--bg-silk)]'
const chip = 'flex items-center gap-2 rounded-full bg-[var(--bg-silk)] py-1.5 pl-3.5 pr-2.5 text-[13px] transition-colors hover:bg-[var(--border-hairline)]'
const zoom = 'editorial-zoom h-full w-full object-cover group-aria-selected:[transform:scale(1.045)]'
// The shelf shows these until the visitor has viewed a piece, as the desktop menu does.
const NEW_PIECES = PRODUCTS.filter((p) => p.badges?.includes('New')).slice(0, 3)

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="font-spec inline-flex h-5 min-w-5 items-center justify-center border border-[var(--border-hairline)] px-1 text-[10px] font-normal normal-case tracking-normal text-[var(--text-taupe)]">{children}</kbd>
}

interface Props {
  /** Whether the dropdown is open. Header folds its links away meanwhile, so the field has the bar. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The field, which Header's shortcuts ("/", ⌘K / Ctrl+K) focus. */
  field: React.RefObject<HTMLInputElement | null>
}

/** Search in the desktop bar: a field in place of a link that opens a full-width dropdown, Shopify's predictive search
 *  in the house's hand. Empty, it offers recent searches, ways to begin, the two signatures and the pieces last viewed;
 *  typing, it completes the words and finds chapters, pages and pieces in both languages, reading prices, renting and
 *  typos. Arrows move through every result, Enter opens one (or the query's best landing), Escape clears, then closes. */
export default function HeaderSearch({ open, onOpenChange, field }: Props) {
  const { currency, route, recent, searches, rememberSearch, forgetSearches, openVisit, openAsk } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const { find } = useHouseSearch()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [hint, setHint] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const go = useRef<HTMLAnchorElement>(null)
  // A search that was followed (or a new page) goes stale: the dropdown keeps it while it folds away, and the next
  // visit to the field starts afresh.
  const stale = useRef(false)
  const q = query.trim()
  const found = useMemo(() => (q ? find(q, currency) : null), [q, currency, find])
  const hints = t.hints(formatPrice(1000, currency))

  useEffect(() => {
    const mark = () => {
      stale.current = true
    }
    mark()
    window.addEventListener('tns:address', mark)
    return () => window.removeEventListener('tns:address', mark)
  }, [route])

  // While open the page holds still: Lenis swallows the wheel. The scrollbar stays, so the bar never shifts sideways.
  useEffect(() => {
    if (!open) {
      setActive(null)
      return
    }
    const lenis = getLenis()
    lenis?.stop()
    return () => lenis?.start()
  }, [open])

  // An empty field offers one idea at a time.
  useEffect(() => {
    if (!open || query || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setHint((h) => (h + 1) % hints.length), 3200)
    return () => window.clearInterval(id)
  }, [open, query, hints.length])

  const close = () => {
    onOpenChange(false)
    field.current?.blur()
  }
  // A suggestion fills the field, which keeps the focus.
  const choose = (text: string) => {
    setQuery(text)
    setActive(null)
    field.current?.focus()
  }
  // Following a result: the search is remembered, and the dropdown folds away as the page changes.
  const follow = () => {
    if (q) rememberSearch(q)
    stale.current = true
    close()
  }
  // A fresh visit to the field starts empty, except on the search's own page, where it picks the search up to refine it.
  const onFocus = () => {
    if (stale.current) {
      stale.current = false
      const here = parseHash()
      setQuery(here.name === 'shop' ? here.query.q ?? '' : '')
      setActive(null)
    }
    onOpenChange(true)
  }
  const act = (action: 'visit' | 'ask') => {
    follow()
    if (action === 'visit') openVisit()
    else openAsk()
  }
  // Enter with nothing chosen: the query's landing (an exact chapter, kind or page, the one piece, else every match).
  const submit = () => {
    const landing = found?.landing
    if (!landing) return
    if ('action' in landing) act(landing.action)
    else go.current?.click()
  }

  // The options on screen, in order (a card the width hides is skipped).
  const options = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).filter((el) => el.getClientRects().length > 0)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return onOpenChange(true)
      const all = options()
      if (!all.length) return
      // The arrows pass back through the field after the last option, as they do before the first.
      const at = all.findIndex((el) => el.id === `hs-${active}`)
      const next = e.key === 'ArrowDown' ? (at + 1 >= all.length ? -1 : at + 1) : at < 0 ? all.length - 1 : at - 1
      setActive(next < 0 ? null : all[next].id.slice(3))
      all[next]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const chosen = active ? options().find((el) => el.id === `hs-${active}`) : null
      if (chosen) chosen.click()
      else if (q) submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (query) choose('')
      else if (open) onOpenChange(false)
      else field.current?.blur()
    } else if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      field.current?.select()
    }
  }
  // Leaving the field and the dropdown closes it (a press on the dimmed page does that too).
  const onBlur = (e: React.FocusEvent) => {
    if (!wrap.current?.contains(e.relatedTarget as Node | null)) onOpenChange(false)
  }
  // Presses inside keep the field focused, so typing carries on after a click.
  const hold = (e: React.MouseEvent) => {
    if (e.target !== field.current) e.preventDefault()
  }
  const option = (id: string) => ({ id: `hs-${id}`, role: 'option' as const, 'aria-selected': active === id, tabIndex: -1, onPointerMove: () => active !== id && setActive(id) })

  const r = found?.reading
  const priced = !!r && (r.min !== undefined || r.max !== undefined)
  const priceLabel = !r || !priced ? null : r.min !== undefined && r.max !== undefined ? t.between(formatPrice(r.min, currency), formatPrice(r.max, currency)) : r.max !== undefined ? t.under(formatPrice(r.max, currency)) : t.over(formatPrice(r.min ?? 0, currency))
  const hasList = !!found && found.suggestions.length + found.ways.length + found.doors.length > 0
  const mode = !found ? 'empty' : found.pieces.length || hasList ? 'results' : 'none'
  const count = found ? found.pieces.length + found.ways.length + found.doors.length : 0
  const landing = found?.landing && 'url' in found.landing ? found.landing.url : href.shop()
  const viewed = recent.filter((slug) => !(route.name === 'product' && route.slug === slug)).map((slug) => getProduct(slug)).filter((p): p is Product => !!p).slice(0, 3)
  const shelf = viewed.length ? { label: t.groups.viewed, pieces: viewed } : { label: t.groups.fresh, pieces: NEW_PIECES }
  const begin = t.begin(formatPrice(1000, currency)).slice(0, searches.length ? 4 : 6)

  const group = (id: string, label: string, aside: React.ReactNode, children: React.ReactNode) => (
    <div role="group" aria-labelledby={`hs-g-${id}`} className="mb-7 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p id={`hs-g-${id}`} role="presentation" className={eyebrow}>{label}</p>
        {aside}
      </div>
      {children}
    </div>
  )

  // A card price: the weekend rate when renting leads, else the price, with the rate after it when the piece rents too.
  const priceLine = (p: Product, rent: boolean, full = true) => {
    const shown = cardPrice(p, currency, rent)
    return (
      <>
        <span className="font-spec mt-1 block text-[11px] text-[var(--text-taupe)]">{shown.rent ? <>{t.from} <Price amount={shown.amount} /> {t.aWeekend}</> : <Price amount={shown.amount} />}</span>
        {full && p.rental && !shown.rent && <span className="font-spec mt-0.5 block text-[11px] text-[var(--text-taupe)]">{t.orRent} <Price amount={p.rental.weekend[currency]} className="[&_span]:hidden" /> {t.aWeekend}</span>}
      </>
    )
  }

  const signatureCard = (x: (typeof SIGNATURES)[number]) => {
    const sig = house.signatures[x.id]
    const pieces = signaturePieces(x.id)
    const from = Math.min(...pieces.map((p) => cardPrice(p, currency, false).amount))
    return (
      <a key={x.id} {...option(`s-${x.id}`)} href={href.category(x.category, { type: x.family })} onClick={follow} className="group block">
        <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--bg-silk)]">
          <img src={sized(HOUSE_IMG.signatures[x.id].hero, 900)} alt="" className={zoom} />
          <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--gold-vermeil)] transition-transform duration-700 ${ease} motion-reduce:transition-none group-aria-selected:scale-x-100`} />
        </span>
        <span className={`${eyebrow} mt-4 block`}>{t.signature(sig.numeral)}</span>
        <span className="font-serif-editorial mt-2 block text-[26px] leading-tight">{sig.name}</span>
        <span className="font-spec mt-1.5 block text-[11px] text-[var(--text-taupe)]">{t.piecesFrom(pieces.length)} <Price amount={from} /></span>
      </a>
    )
  }

  const pieceCard = (p: Product, hide: string) => {
    const copy = catalog.product(p)
    const rent = found?.rentLed(p) ?? false
    return (
      <a key={p.slug} {...option(`p-${p.slug}`)} href={href.product(p.slug, rent)} onClick={follow} className={`group block ${hide}`}>
        <span className="relative block aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
          <img src={sized(p.images[0], 480)} alt="" className={zoom} />
          {/* The second photograph, on the body, as on the cards */}
          {p.images[1] && <img src={sized(p.images[1], 480)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 motion-reduce:transition-none group-aria-selected:opacity-100" />}
          <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--gold-vermeil)] transition-transform duration-700 ${ease} motion-reduce:transition-none group-aria-selected:scale-x-100`} />
        </span>
        <span className="font-spec mt-3 block truncate text-[9px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{copy.collection} · {catalog.category(p.category).name}</span>
        <span className="font-serif-editorial mt-1.5 line-clamp-2 text-[18px] leading-tight"><Marked text={copy.name} query={r?.text ?? ''} /></span>
        {priceLine(p, rent)}
      </a>
    )
  }

  const signatures = (
    <div className="grid grid-cols-2 gap-6">{SIGNATURES.map(signatureCard)}</div>
  )

  return (
    <div ref={wrap} role="search" onBlur={onBlur} onKeyDown={(e) => { if (e.key === 'Escape' && e.target !== field.current) { e.preventDefault(); field.current?.focus() } }} className="flex min-w-0 flex-1 items-center">
      {/* The field. Its words follow the room it has: the icon alone at the narrowest, then "Search", then the "/" key. */}
      <div onMouseDown={(e) => { hold(e); if (document.activeElement !== field.current) field.current?.focus() }} className={`@container group/field relative flex h-10 w-full min-w-11 max-w-[26rem] cursor-text items-center gap-2.5 border-b transition-colors duration-500 focus-within:border-[var(--text-espresso)] ${open ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-taupe)]'}`}>
        <Search size={15} strokeWidth={1.4} aria-hidden="true" className={`shrink-0 transition-colors duration-300 ${open ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)] group-hover/field:text-[var(--gold-vermeil)]'}`} />
        <input ref={field} type="search" role="combobox" value={query} onChange={(e) => { setQuery(e.target.value); setActive(null); if (!open) onOpenChange(true) }} onFocus={onFocus} onClick={() => !open && onFocus()} onKeyDown={onKeyDown} aria-label={t.label} aria-expanded={open} aria-controls="header-search-list" aria-autocomplete="list" aria-activedescendant={open && active ? `hs-${active}` : undefined} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search" className={`font-serif-editorial h-full min-w-0 flex-1 bg-transparent text-[18px] font-normal normal-case tracking-normal caret-[var(--text-espresso)] outline-none [&::-webkit-search-cancel-button]:hidden ${open ? 'text-[var(--text-espresso)]' : 'text-transparent'}`} />
        {/* The field's own words, in the serif's italic: "Search", or "Search the maison" where it fits (French needs
            more room for each), then an idea to try once it opens. Closed, the bar never shows an old query. */}
        {(!query || !open) && (
          <span aria-hidden="true" className={`font-serif-editorial pointer-events-none absolute inset-y-0 left-[25px] right-2 flex items-center overflow-hidden whitespace-nowrap font-normal normal-case tracking-normal text-[var(--text-taupe)] ${open ? '@min-[18rem]:right-9' : '@min-[10rem]:right-9'}`}>
            {open ? (
              <span className="flex min-w-0 text-[18px]">
                <span className="shrink-0 whitespace-pre">{t.try} </span>
                <em key={hint} className="min-w-0 truncate animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none">{hints[hint]}</em>
              </span>
            ) : (
              <span className="text-[15px] italic transition-colors duration-300 group-hover/field:text-[var(--text-espresso)]">
                <span className={`hidden ${t.searchLong.length > 20 ? '@min-[6.25rem]:inline @min-[16rem]:hidden' : '@min-[4.5rem]:inline @min-[12.5rem]:hidden'}`}>{t.search}</span>
                <span className={`hidden ${t.searchLong.length > 20 ? '@min-[16rem]:inline' : '@min-[12.5rem]:inline'}`}>{t.searchLong}</span>
              </span>
            )}
          </span>
        )}
        {/* Clear while there is a query; else the "/" key, or Esc once open (it gives way to the idea where the field is narrow) */}
        {query && open ? (
          <button type="button" onClick={() => choose('')} aria-label={t.clear} className="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]">
            <X size={15} strokeWidth={1.4} />
          </button>
        ) : (
          <span className={`ml-auto hidden ${open ? '@min-[18rem]:flex' : '@min-[10rem]:flex'}`} aria-hidden="true"><Key>{open ? t.keys.esc : '/'}</Key></span>
        )}
        {/* A gold line draws across the field as it opens */}
        <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ${ease} motion-reduce:transition-none ${open ? 'scale-x-100' : 'scale-x-0'}`} />
      </div>

      {/* Enter's landing, followed like any link so the page transition plays */}
      <a ref={go} href={landing} onClick={follow} hidden tabIndex={-1} aria-hidden="true" />

      {/* The page dims beneath. A press there takes the focus off the field, which closes the search. */}
      <div aria-hidden="true" className={`absolute inset-x-0 top-full h-[100dvh] bg-[var(--bg-vault)]/30 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      {/* The dropdown: the width of the bar, under it, unveiled from the top as the mega menu is */}
      <div ref={panel} id="header-search" inert={!open} onMouseDown={hold} className={`absolute inset-x-0 top-full border-b border-[var(--border-hairline)] bg-[var(--bg-travertine)] text-sm font-normal normal-case tracking-normal shadow-[0_40px_80px_-50px_rgba(40,30,20,0.45)] transition-[clip-path] duration-700 ${ease} motion-reduce:transition-none ${open ? '[clip-path:inset(0_0_-120px_0)]' : '[clip-path:inset(0_0_100%_0)]'}`}>
        <div className="mx-auto max-h-[calc(100dvh-8.5rem)] max-w-[1600px] overflow-y-auto overscroll-contain px-12" data-lenis-prevent>
          {/* What the query was read as: a corrected word, a price, renting. Each can be taken out again. */}
          {r && (r.fixes.length > 0 || priceLabel || r.rent) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-7">
              {r.fixes.length > 0 && <p className="font-serif-editorial text-[17px] text-[var(--text-taupe)]">{rich(t.fixed(r.text), 'text-[var(--text-espresso)]')}</p>}
              {priceLabel && (
                <button type="button" onClick={() => choose(r.words)} aria-label={t.remove(priceLabel)} className={chip}>
                  {priceLabel} <X size={12} strokeWidth={1.6} />
                </button>
              )}
              {r.rent && (
                <button type="button" onClick={() => choose([r.text, r.priceText].filter(Boolean).join(' '))} aria-label={t.remove(t.toRent)} className={chip}>
                  {t.toRent} <X size={12} strokeWidth={1.6} />
                </button>
              )}
            </div>
          )}

          <div key={mode} id="header-search-list" role="listbox" aria-label={t.label} className={`grid grid-cols-12 gap-x-8 pb-2 animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none xl:gap-x-12 ${r && (r.fixes.length > 0 || priceLabel || r.rent) ? 'pt-6' : 'pt-9'}`}>
            {mode === 'empty' && (
              <>
                <div className="col-span-3">
                  {searches.length > 0 && group('recent', t.groups.recent, (
                    <button {...option('clear')} type="button" onClick={forgetSearches} aria-label={t.clearRecentLabel} className="font-spec -my-2 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)] aria-selected:text-[var(--text-espresso)]">{t.clearRecent}</button>
                  ), searches.slice(0, 4).map((s, i) => (
                    <button key={s} {...option(`r${i}`)} type="button" onClick={() => choose(s)} className={row}>
                      <History size={13} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--text-taupe)]" />
                      <span className="line-clamp-2 min-w-0 flex-1 text-[14px] leading-snug">{s}</span>
                    </button>
                  )))}
                  {group('begin', t.groups.begin, null, begin.map((s, i) => (
                    <button key={s} {...option(`b${i}`)} type="button" onClick={() => choose(s)} className={row}>
                      <ArrowUpRight size={13} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" />
                      <span className="line-clamp-2 min-w-0 flex-1 text-[14px] leading-snug">{s}</span>
                    </button>
                  )))}
                </div>
                <div className="col-span-6">{group('signatures', t.groups.signatures, null, signatures)}</div>
                <div className="col-span-3">
                  {group('shelf', shelf.label, null, shelf.pieces.map((p) => (
                    <a key={p.slug} {...option(`v-${p.slug}`)} href={href.product(p.slug, rentFirst(p))} onClick={follow} className={row}>
                      <span className="h-14 w-11 shrink-0 overflow-hidden bg-[var(--bg-silk)]">
                        <img src={sized(p.images[0], 160)} alt="" className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-serif-editorial line-clamp-2 text-[17px] leading-tight">{catalog.name(p)}</span>
                        {priceLine(p, rentFirst(p), false)}
                      </span>
                    </a>
                  )))}
                </div>
              </>
            )}

            {mode === 'results' && found && r && (
              <>
                {hasList && (
                  <div className="col-span-3">
                    {found.suggestions.length > 0 && group('suggestions', t.groups.suggestions, null, found.suggestions.map((s, i) => (
                      <button key={s.text} {...option(`q${i}`)} type="button" onClick={() => choose(s.text)} className={row}>
                        <Search size={13} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--text-taupe)]" />
                        <span className="min-w-0 flex-1 truncate text-[14px]"><Marked text={s.text} query={r.text} /></span>
                        <span className="font-spec shrink-0 text-[10px] text-[var(--text-taupe)]">{s.count}</span>
                      </button>
                    )))}
                    {found.ways.length > 0 && group('chapters', t.groups.chapters, null, found.ways.map((w) => (
                      <a key={w.id} {...option(`w-${w.id}`)} href={w.url} onClick={follow} className={`${row} items-baseline gap-4`}>
                        <span aria-hidden={w.signature || undefined} className="font-spec w-6 shrink-0 text-[10px] text-[var(--gold-ink)]">{w.mark}</span>
                        <span className={`font-serif-editorial line-clamp-2 min-w-0 text-[20px] leading-tight ${w.signature ? 'italic' : ''}`}><Marked text={w.title} query={r.words} /></span>
                      </a>
                    )))}
                    {found.doors.length > 0 && group('elsewhere', t.groups.elsewhere, null, found.doors.map((d) => {
                      const label = <span className="font-serif-editorial line-clamp-2 min-w-0 text-[20px] italic leading-tight"><Marked text={d.title} query={r.words} /></span>
                      const action = d.action
                      return action ? (
                        <button key={d.id} {...option(`d-${d.id}`)} type="button" onClick={() => act(action)} className={row}>
                          {action === 'visit' ? <CalendarHeart size={14} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" /> : <MessageCircle size={14} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" />}
                          {label}
                        </button>
                      ) : (
                        <a key={d.id} {...option(`d-${d.id}`)} href={d.url} onClick={follow} className={row}>
                          <ArrowUpRight size={14} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--gold-vermeil)]" />
                          {label}
                        </a>
                      )
                    }))}
                  </div>
                )}
                <div className={hasList ? 'col-span-9' : 'col-span-12'}>
                  {found.pieces.length > 0 ? (
                    <div role="group" aria-labelledby="hs-g-pieces">
                      <div className="mb-4 flex items-baseline justify-between gap-6">
                        <p id="hs-g-pieces" role="presentation" className={eyebrow}>{t.count(found.pieces.length)}</p>
                        {/* Every match on the shop page, with its filters (Shopify's /search), when some are left out here */}
                        {found.pieces.length > (hasList ? 3 : 4) && (
                          <a {...option('all')} href={href.shop({ q })} onClick={follow} className={`link-line shrink-0 aria-selected:after:![transform:scaleX(1)] ${found.pieces.length <= (hasList ? 4 : 6) ? 'xl:!hidden' : ''}`}>
                            {t.seeAll(found.pieces.length)} <ArrowRight size={14} strokeWidth={1.4} />
                          </a>
                        )}
                      </div>
                      <div className={`grid gap-x-6 gap-y-8 ${hasList ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-4 xl:grid-cols-6'}`}>
                        {found.pieces.slice(0, hasList ? 4 : 6).map((p, i) => pieceCard(p, (hasList ? i === 3 : i >= 4) ? 'max-xl:hidden' : ''))}
                      </div>
                    </div>
                  ) : (
                    group('signatures', t.groups.signatures, null, signatures)
                  )}
                </div>
              </>
            )}

            {mode === 'none' && (
              <>
                <div className="col-span-5 pr-6">
                  <p className="font-serif-editorial text-[28px] leading-snug">{rich(t.nothing(q), 'text-[var(--gold-vermeil)]')}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-taupe)]">{t.tryThese}</p>
                  <div role="group" aria-label={t.tryThese} className="mt-5 flex flex-wrap gap-2">
                    {t.chips.map((s, i) => (
                      <button key={s} {...option(`c${i}`)} type="button" onClick={() => choose(s)} className="rounded-full border border-[var(--border-hairline)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-[var(--text-espresso)] aria-selected:border-[var(--text-espresso)]">{s}</button>
                    ))}
                  </div>
                </div>
                <div className="col-span-7">{group('signatures', t.groups.signatures, null, signatures)}</div>
              </>
            )}
          </div>

          {/* How to move, and a person to ask */}
          <div className="mt-7 flex items-center justify-between gap-8 border-t border-[var(--border-hairline)] py-4">
            <p aria-hidden="true" className="font-spec flex shrink-0 items-center gap-5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">
              <span className="flex items-center gap-1.5"><Key><ArrowUp size={10} strokeWidth={1.6} /></Key><Key><ArrowDown size={10} strokeWidth={1.6} /></Key>{t.keys.move}</span>
              <span className="flex items-center gap-1.5"><Key><CornerDownLeft size={10} strokeWidth={1.6} /></Key>{t.keys.open}</span>
              <span className="flex items-center gap-1.5"><Key>{t.keys.esc}</Key>{t.keys.close}</span>
            </p>
            <p className="flex min-w-0 items-center gap-5">
              <span className="hidden truncate text-[13px] text-[var(--text-taupe)] xl:inline">{t.cantFind}</span>
              <button type="button" onClick={() => act('ask')} className="link-line shrink-0">
                <MessageCircle size={14} strokeWidth={1.4} /> {t.ask}
              </button>
            </p>
          </div>
        </div>
        <p role="status" className="sr-only">{found ? (count ? t.results(count) : t.noResults) : ''}</p>
      </div>
    </div>
  )
}
