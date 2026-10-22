import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES, cardPrice, familyOf, formatPrice, isRentable, rentFirst, tryOnKind, type Currency, type Metal, type Product, type ProductType } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { useStore, type Query } from '../../store'
import useHouseSearch from '../menu/useHouseSearch'
import ProductCard from '../ProductCard'
import TryOnButton from '../tryon/TryOnButton'

type Sort = 'featured' | 'low' | 'high'
type Facet = 'chapter' | 'type' | 'metal' | 'price' | 'avail' | 'shape'

// Price bands per market, in whole units.
const BANDS: Record<Currency, [number, number][]> = {
  CAD: [[0, 2000], [2000, 10000], [10000, 25000], [25000, Infinity]],
  USD: [[0, 1500], [1500, 7500], [7500, 18000], [18000, Infinity]],
}

const COPY = bilingual(
  {
    count: (n: number, currency: string) => `${n} piece${n === 1 ? '' : 's'} · Prices in ${currency}`,
    refine: 'Refine',
    facets: { chapter: 'Chapter', type: 'Type', metal: 'Metal', price: 'Price', avail: 'How', shape: 'Shape' } as Record<Facet, string>,
    avail: { rent: 'Available to rent', ready: 'Ready to try in the salon', made: 'Made to order' } as Record<string, string>,
    under: (max: string) => `Under ${max}`,
    between: (min: string, max: string) => `${min} – ${max}`,
    over: (min: string) => `${min} and over`,
    clear: 'Clear all',
    remove: (label: string) => `Remove ${label}`,
    searched: (q: string) => `“${q}”`,
    tryThese: 'Try these pieces on',
    sort: 'Sort',
    sorts: { featured: 'Featured', low: 'Price, low to high', high: 'Price, high to low' } as Record<Sort, string>,
    none: 'No piece matches all of these.',
    noneText: 'Clear a filter or two, or ask a jeweller: what isn’t here, the atelier can often source or make.',
    ask: 'Ask a jeweller',
  },
  {
    count: (n, currency) => `${n} pièce${n < 2 ? '' : 's'} · Prix en ${currency}`,
    refine: 'Affiner',
    facets: { chapter: 'Chapitre', type: 'Type', metal: 'Métal', price: 'Prix', avail: 'Comment', shape: 'Forme' },
    avail: { rent: 'Offerte en location', ready: 'À essayer au salon', made: 'Sur commande' },
    under: (max) => `Moins de ${max}`,
    between: (min, max) => `${min} – ${max}`,
    over: (min) => `${min} et plus`,
    clear: 'Tout effacer',
    remove: (label) => `Retirer ${label}`,
    searched: (q) => `« ${q} »`,
    tryThese: 'Essayer ces pièces',
    sort: 'Trier',
    sorts: { featured: 'En vedette', low: 'Prix croissant', high: 'Prix décroissant' },
    none: 'Aucune pièce ne réunit tous ces critères.',
    noneText: 'Retirez un filtre ou deux, ou parlez à un joaillier : ce qui n’est pas ici, l’atelier peut souvent le trouver ou le faire.',
    ask: 'Parler à un joaillier',
  },
)

interface Props {
  /** Every piece the page holds, before filters. */
  pieces: Product[]
  /** The options the page opened with (from its address). */
  initial: Query
  /** Writes the options back into the address. */
  onQuery: (query: Query) => void
  /** Offer the chapter filter (Shop all). */
  chapters?: boolean
  /** Cards lead with renting (the Rentals chapter). */
  rent?: boolean
  /** A full-width card set after the sixth piece. */
  interlude?: ReactNode
  /** Shown instead of an empty grid. */
  onAsk?: () => void
}

/** A page's pieces with filters that live in the address (chapter, type, metal, price, renting, shape), sorting, an
 *  editorial interlude and an empty state. A search (`q`, from the header's "See all") narrows them with the header's
 *  own reading of the query, best match first, and shows as the first chip. */
export default function PieceGrid({ pieces, initial, onQuery, chapters = false, rent = false, interlude, onAsk }: Props) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const { find } = useHouseSearch()
  const [query, setQuery] = useState<Query>(initial)
  const [open, setOpen] = useState(false)
  const sort = (['featured', 'low', 'high'] as Sort[]).includes(query.sort as Sort) ? (query.sort as Sort) : 'featured'
  const searched = useMemo(() => (query.q ? find(query.q, currency) : null), [query.q, currency, find])
  // Each match's place in the search's ranking.
  const matches = useMemo(() => (searched ? new Map(searched.pieces.map((p, i) => [p.slug, i])) : null), [searched])
  // A search for renting leads the cards with their rates, as the Rentals chapter does.
  const renting = rent || !!searched?.reading.rent
  const price = (p: Product) => cardPrice(p, currency, renting || rentFirst(p)).amount

  const bandLabel = (i: number) => {
    const [min, max] = BANDS[currency][i]
    const f = (n: number) => formatPrice(n, currency)
    return i === 0 ? t.under(f(max)) : max === Infinity ? t.over(f(min)) : t.between(f(min), f(max))
  }

  // Each facet offers only what these pieces have, and only when there is a choice to make.
  const facets = useMemo(() => {
    const out: { id: Facet; options: { value: string; label: string }[] }[] = []
    const add = (id: Facet, options: { value: string; label: string }[]) => options.length > 1 && out.push({ id, options })
    if (chapters) add('chapter', CATEGORIES.filter((c) => pieces.some((p) => p.category === c.slug)).map((c) => ({ value: c.slug, label: catalog.category(c).name })))
    const families = [...new Set(pieces.map((p) => familyOf(p.type)))]
    add('type', families.map((f) => ({ value: f, label: f === 'tennis' ? house.signatures.tennis.name : catalog.type(f as ProductType) })))
    const metals = [...new Set(pieces.flatMap((p) => p.metals))]
    add('metal', metals.map((m) => ({ value: m, label: catalog.metal(m) })))
    add('price', BANDS[currency].map((_, i) => i).filter((i) => pieces.some((p) => price(p) >= BANDS[currency][i][0] && price(p) < BANDS[currency][i][1])).map((i) => ({ value: String(i), label: bandLabel(i) })))
    add('avail', (['rent', 'ready', 'made'] as const).filter((a) => pieces.some((p) => (a === 'rent' ? isRentable(p) : a === 'made' ? !!p.leadTimeWeeks : !p.leadTimeWeeks))).map((a) => ({ value: a, label: t.avail[a] })))
    const shapes = [...new Set(pieces.map((p) => p.gia?.shape).filter((s): s is string => !!s))]
    add('shape', shapes.map((s) => ({ value: s, label: catalog.gia(s) })))
    return out
    // bandLabel and price read the currency and copy, which the dependencies cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, chapters, currency, catalog, t, house])

  const shown = useMemo(() => {
    const list = pieces.filter((p) => {
      if (matches && !matches.has(p.slug)) return false
      if (query.chapter && p.category !== query.chapter) return false
      if (query.type && familyOf(p.type) !== query.type) return false
      if (query.metal && !p.metals.includes(query.metal as Metal)) return false
      if (query.price) {
        const band = BANDS[currency][Number(query.price)]
        if (band && (price(p) < band[0] || price(p) >= band[1])) return false
      }
      if (query.avail === 'rent' && !isRentable(p)) return false
      if (query.avail === 'ready' && p.leadTimeWeeks) return false
      if (query.avail === 'made' && !p.leadTimeWeeks) return false
      if (query.shape && p.gia?.shape !== query.shape) return false
      return true
    })
    if (sort === 'featured' && matches) list.sort((a, b) => (matches.get(a.slug) ?? 0) - (matches.get(b.slug) ?? 0))
    if (sort === 'low') list.sort((a, b) => price(a) - price(b))
    if (sort === 'high') list.sort((a, b) => price(b) - price(a))
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, query, sort, currency, renting, matches])

  const set = (patch: Query) => {
    const next = { ...query, ...patch }
    Object.keys(next).forEach((k) => !next[k] && delete next[k])
    setQuery(next)
    onQuery(next)
  }
  const filters = facets.flatMap((f) => (query[f.id] ? [{ facet: f.id as string, label: f.options.find((o) => o.value === query[f.id])?.label ?? query[f.id] }] : []))
  const active = query.q ? [{ facet: 'q', label: t.searched(query.q) }, ...filters] : filters
  const clearAll = () => set(Object.fromEntries([...facets.map((f) => [f.id, '']), ['q', '']]))
  const wearable = shown.filter((p) => tryOnKind(p))

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <span className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]" aria-live="polite">{t.count(shown.length, currency)}</span>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {facets.length > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="refine" className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-[var(--gold-vermeil)]">
              <SlidersHorizontal size={14} strokeWidth={1.3} /> {t.refine}{filters.length > 0 && <span className="font-spec flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-espresso)] px-1.5 text-[10px] text-[var(--bg-travertine)]">{filters.length}</span>}
            </button>
          )}
          {wearable[0] && <TryOnButton product={wearable[0]} list={wearable} variant="link" label={t.tryThese} className="max-sm:!hidden" />}
          <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
            {t.sort}
            <select value={sort} onChange={(e) => set({ sort: e.target.value === 'featured' ? '' : e.target.value })} className="cursor-pointer bg-transparent outline-none focus-visible:underline">
              {(['featured', 'low', 'high'] as const).map((s) => <option key={s} value={s}>{t.sorts[s]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {open && (
        <div id="refine" className="mb-8 grid gap-8 border-b border-[var(--border-hairline)] pb-8 sm:grid-cols-2 lg:grid-cols-3 motion-safe:animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
          {facets.map((f) => (
            <div key={f.id} role="group" aria-label={t.facets[f.id]}>
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{t.facets[f.id]}</p>
              <div className="flex flex-wrap gap-2">
                {f.options.map((o) => {
                  const on = query[f.id] === o.value
                  return <button key={o.value} type="button" aria-pressed={on} onClick={() => set({ [f.id]: on ? '' : o.value })} className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>{o.label}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button key={a.facet} type="button" onClick={() => set({ [a.facet]: '' })} aria-label={t.remove(a.label)} className="flex items-center gap-2 rounded-full bg-[var(--bg-silk)] py-1.5 pl-3.5 pr-2.5 text-[13px] transition-colors hover:bg-[var(--border-hairline)]">
              {a.label} <X size={12} strokeWidth={1.6} />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="ml-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">{t.clear}</button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif-editorial text-4xl font-light">{t.none}</p>
          <p className="mx-auto mt-4 max-w-md text-[var(--text-taupe)]">{t.noneText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <button type="button" onClick={clearAll} className="link-line">{t.clear}</button>
            {onAsk && <button type="button" onClick={onAsk} className="link-line">{t.ask}</button>}
          </div>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <Fragment key={p.id}>
              <ProductCard product={p} index={i} rent={renting} />
              {interlude && i === 5 && shown.length > 6 && <div className="sm:col-span-2 lg:col-span-3">{interlude}</div>}
            </Fragment>
          ))}
        </div>
      )}
      {interlude && shown.length > 0 && shown.length <= 6 && <div className="mt-20">{interlude}</div>}
    </section>
  )
}
