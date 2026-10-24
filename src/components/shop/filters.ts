// Shop all's filters, sorting, edits and price scale: what every piece can be narrowed by, read from the address and
// written back to it, and how many pieces each choice would leave. Shaped like Shopify's Search & Discovery filters
// (the product type, the metal option, availability, price, and product metafields for the stones, the highlights and
// the services), so the theme maps them one to one; see .claude/docs/pages/shop.md.
import { CATEGORIES, METALS, PRODUCTS, SIGNATURES, cardPrice, familyOf, isRentable, needsSize, rentFirst, tryOnKind, type CategorySlug, type Currency, type Metal, type Product } from '../../data/catalog'
import type { Query } from '../../store'

/** Every piece the shop lists: all but the gift card, which has a page of its own. */
export const SHOP_PIECES = PRODUCTS.filter((p) => p.type !== 'gift-card')

export type FacetId = 'chapter' | 'type' | 'metal' | 'stone' | 'shape' | 'how' | 'tag' | 'svc' | 'own'
/** The facets in the order the filter panel lists them (the price comes after the metal). */
export const FACETS: FacetId[] = ['chapter', 'type', 'metal', 'stone', 'shape', 'how', 'tag', 'svc', 'own']

export type Stone = 'diamond' | 'pearl' | 'emerald' | 'sapphire' | 'none'
export type How = 'rent' | 'ready' | 'made'
export type Service = 'engrave' | 'personalize' | 'tryon'
export type Own = 'saved' | 'viewed'

const BADGES = { new: 'New', bestseller: 'Bestseller', exclusive: 'Atelier Exclusive', limited: 'Limited' } as const
export type Tag = keyof typeof BADGES
export const badgeOf = (t: Tag) => BADGES[t]

/** Whether a chapter shows a piece: its own, the ones it also hangs (`alsoIn`), and for Rentals every piece to rent. */
export const inChapter = (p: Product, c: CategorySlug) => p.category === c || !!p.alsoIn?.includes(c) || (c === 'rentals' && isRentable(p))

/** A GIA shape as an address value (`Round Brilliant` → `round`). */
export const shapeId = (shape: string) => shape.toLowerCase().split(' ')[0]

/** The stones a piece is set with, read from its English description and specs (an optional accent doesn't count).
 *  Commissions and redesigns have none of their own. In the theme this is a product metafield. */
export function stonesOf(p: Product): Stone[] {
  if (p.type === 'commission' || p.type === 'redesign') return []
  const text = [p.description, ...Object.entries(p.specs).filter(([k]) => k !== 'Option').flat()].join(' ').replace(/\boptional\b[^.,;]*/gi, '')
  const out: Stone[] = []
  if (p.gia || /\bdiamonds?\b|\bbrilliants?\b|\bpav[ée]|\bbaguettes?\b/i.test(text)) out.push('diamond')
  if (/(?<!mother-of-)\bpearls?\b/i.test(text)) out.push('pearl')
  // An emerald cut is a diamond's shape, not an emerald.
  if (/\bemeralds?\b(?![- ]cut)/i.test(text)) out.push('emerald')
  if (/\bsapphires?\b/i.test(text)) out.push('sapphire')
  return out.length ? out : ['none']
}

/** How a piece can be had: rented (when it has rates), and either ready in the salon or made to order. */
export const howOf = (p: Product): How[] => [...(isRentable(p) ? ['rent' as const] : []), p.leadTimeWeeks ? 'made' : 'ready']

export const servicesOf = (p: Product): Service[] => [p.engravable && 'engrave', p.personalization && 'personalize', tryOnKind(p) && 'tryon'].filter((s): s is Service => !!s)

export const tagsOf = (p: Product): Tag[] => (Object.keys(BADGES) as Tag[]).filter((t) => !!p.badges?.includes(BADGES[t]))

// The families of piece in the order the panel lists them: the two signatures, then the catalog's order.
const SIGNATURE_FAMILIES: string[] = SIGNATURES.map((s) => s.family)
const FAMILY_ORDER = [...new Set([...SIGNATURE_FAMILIES, ...SHOP_PIECES.map((p) => familyOf(p.type))])]
const SHAPE_ORDER = [...new Set(SHOP_PIECES.flatMap((p) => (p.gia ? [shapeId(p.gia.shape)] : [])))]

/** The GIA shape a value stands for (`round` → `Round Brilliant`), for its label. */
export const shapeName = (id: string) => SHOP_PIECES.find((p) => p.gia && shapeId(p.gia.shape) === id)?.gia?.shape ?? id

/** Whether a type family is one of the house's two signatures. */
export const isSignature = (family: string) => SIGNATURE_FAMILIES.includes(family)

/** Every value a facet can take, in the order it is listed. */
export function optionsOf(id: FacetId): string[] {
  switch (id) {
    case 'chapter': return CATEGORIES.map((c) => c.slug)
    case 'type': return FAMILY_ORDER
    case 'metal': return Object.keys(METALS)
    case 'stone': return ['diamond', 'pearl', 'emerald', 'sapphire', 'none']
    case 'shape': return SHAPE_ORDER
    case 'how': return ['rent', 'ready', 'made']
    case 'tag': return Object.keys(BADGES)
    case 'svc': return ['engrave', 'personalize', 'tryon']
    case 'own': return ['saved', 'viewed']
  }
}

/** The values a piece has for a facet. `own` reads the visitor's wishlist and history. */
export function valuesOf(p: Product, id: FacetId, own: { saved: Set<string>; viewed: Set<string> }): string[] {
  switch (id) {
    case 'chapter': return CATEGORIES.filter((c) => inChapter(p, c.slug)).map((c) => c.slug)
    case 'type': return [familyOf(p.type)]
    case 'metal': return p.metals
    case 'stone': return stonesOf(p)
    case 'shape': return p.gia ? [shapeId(p.gia.shape)] : []
    case 'how': return howOf(p)
    case 'tag': return tagsOf(p)
    case 'svc': return servicesOf(p)
    case 'own': return [own.saved.has(p.slug) && 'saved', own.viewed.has(p.slug) && 'viewed'].filter((v): v is Own => !!v)
  }
}

// Recommended: the house's own order. Each chapter's best first (its signature, then bestsellers, exclusives, new,
// limited), and the chapters taken in turn, so the first rows show the whole house rather than one chapter.
const LANES: CategorySlug[] = ['bridal', 'necklaces', 'earrings', 'bracelets', 'rings', 'rentals', 'watches', 'gifts', 'custom']
const BADGE_RANK: Record<string, number> = { Bestseller: 0, 'Atelier Exclusive': 1, New: 2, Limited: 3 }
const rankOf = (p: Product) => Math.min(4, ...(p.badges ?? []).map((b) => BADGE_RANK[b] ?? 4))

/** Every piece in the house's recommended order. */
export const RECOMMENDED: Product[] = (() => {
  const lanes = LANES.map((c) => {
    const family = SIGNATURES.find((s) => s.category === c)?.family
    const sig = (p: Product) => Number(familyOf(p.type) === family)
    return SHOP_PIECES.filter((p) => p.category === c).sort((a, b) => sig(b) - sig(a) || rankOf(a) - rankOf(b))
  })
  const out: Product[] = []
  for (let i = 0; lanes.some((l) => i < l.length); i++) for (const l of lanes) if (l[i]) out.push(l[i])
  return out
})()
const RANK = new Map(RECOMMENDED.map((p, i) => [p.slug, i]))

export type Sort = 'recommended' | 'new' | 'low' | 'high' | 'name'
export const SORTS: Sort[] = ['recommended', 'new', 'low', 'high', 'name']

/** How many pieces a row holds: large (two on a desktop), the grid (three) or compact (four, and two on a phone). */
export type View = 'large' | 'grid' | 'compact'
export const VIEWS: View[] = ['large', 'grid', 'compact']

/** What the visitor has chosen, as the page reads it from its address. */
export interface Selection {
  q: string
  facets: Record<FacetId, string[]>
  /** A price range in whole units of the currency on screen; either end may be open. */
  min?: number
  max?: number
  sort: Sort
  view: View
  /** The pieces shown as worn (their second photograph) rather than on their own. */
  worn: boolean
  /** How many sets of twelve are shown (Shopify's `page`, as "Show more" loads them). */
  page: number
}

export const noFacets = (): Record<FacetId, string[]> => Object.fromEntries(FACETS.map((f) => [f, []])) as unknown as Record<FacetId, string[]>

const whole = (s?: string) => (s && /^\d{1,7}$/.test(s) ? Number(s) : undefined)

/** The selection in an address. Values are lists (`metal=platinum,18k-white`); anything unknown is dropped. A price
 *  range holds only in the currency it was chosen in (`in`); `avail`, the old single "how", still reads. */
export function readSelection(query: Query, currency: Currency): Selection {
  const facets = noFacets()
  for (const id of FACETS) {
    const valid = new Set(optionsOf(id))
    const raw = query[id] ?? (id === 'how' ? query.avail : undefined) ?? ''
    facets[id] = [...new Set(raw.split(',').filter((v) => valid.has(v)))]
  }
  const priced = !query.in || query.in === currency
  const sort = query.sort === 'featured' ? 'recommended' : query.sort
  return {
    q: (query.q ?? '').trim(),
    facets,
    min: priced ? whole(query.min) : undefined,
    max: priced ? whole(query.max) : undefined,
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : 'recommended',
    view: query.view === 'large' || query.view === 'compact' ? query.view : 'grid',
    worn: query.look === 'worn',
    page: Math.min(40, Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1)),
  }
}

/** The address for a selection: only what differs from the defaults, the price with its currency. */
export function writeSelection(s: Selection, currency: Currency): Query {
  const q: Query = {}
  if (s.q) q.q = s.q
  for (const id of FACETS) if (s.facets[id].length) q[id] = s.facets[id].join(',')
  if (s.min !== undefined) q.min = String(s.min)
  if (s.max !== undefined) q.max = String(s.max)
  if (s.min !== undefined || s.max !== undefined) q.in = currency
  if (s.sort !== 'recommended') q.sort = s.sort
  if (s.view !== 'grid') q.view = s.view
  if (s.worn) q.look = 'worn'
  if (s.page > 1) q.page = String(s.page)
  return q
}

/** How many choices narrow the pieces (the filter button's count): every facet value, and a price range as one. */
export const activeCount = (s: Selection) => FACETS.reduce((n, id) => n + s.facets[id].length, 0) + (s.min !== undefined || s.max !== undefined ? 1 : 0)

/** Renting is asked for when it is the only "how": prices are then weekend rates. */
export const asksToRent = (s: Selection) => s.facets.how.length === 1 && s.facets.how[0] === 'rent'

// The price scale: round figures (1, 1.5, 2, 2.5, 3, 4, 5, 7.5 in each decade), from the one at or below the lowest
// price to the one at or above the highest, so the slider moves in steps a jeweller would quote.
const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5]
const LADDER = [2, 3, 4, 5, 6].flatMap((e) => NICE.map((n) => n * 10 ** e))

/** The slider's stops for a set of prices. */
export function priceScale(prices: number[]): number[] {
  if (!prices.length) return [LADDER[0], LADDER[1]]
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  const a = Math.max(0, LADDER.findIndex((s) => s > lo) - 1)
  const b = LADDER.findIndex((s) => s >= hi)
  return LADDER.slice(a, Math.max(a + 1, b < 0 ? LADDER.length - 1 : b) + 1)
}

/** The edits: ready-made selections a visitor can take in one press. */
export type EditId = 'new' | 'bestsellers' | 'signatures' | 'rent' | 'gifts' | 'engrave' | 'made'
export interface Edit {
  id: EditId
  facets: Partial<Record<FacetId, string[]>>
  /** A price ceiling per market. */
  max?: Record<Currency, number>
}
export const EDITS: Edit[] = [
  { id: 'signatures', facets: { type: SIGNATURE_FAMILIES } },
  { id: 'new', facets: { tag: ['new'] } },
  { id: 'bestsellers', facets: { tag: ['bestseller'] } },
  { id: 'rent', facets: { how: ['rent'] } },
  { id: 'gifts', facets: {}, max: { CAD: 2000, USD: 1500 } },
  { id: 'engrave', facets: { svc: ['engrave'] } },
  { id: 'made', facets: { how: ['made'] } },
]

/** A selection with an edit applied: its filters alone, keeping the sort and the view. */
export const applyEdit = (s: Selection, e: Edit, currency: Currency): Selection => ({ ...s, q: '', facets: { ...noFacets(), ...e.facets }, min: undefined, max: e.max?.[currency], page: 1 })

/** Whether the selection is exactly an edit. */
export function isEdit(s: Selection, e: Edit, currency: Currency) {
  if (s.q || s.min !== undefined || s.max !== e.max?.[currency]) return false
  return FACETS.every((id) => {
    const want = e.facets[id] ?? []
    return want.length === s.facets[id].length && want.every((v) => s.facets[id].includes(v))
  })
}

/** What the page knows besides the selection. */
export interface Context {
  currency: Currency
  saved: string[]
  viewed: string[]
  /** The pieces a search found, best first, or null without one. */
  found: Product[] | null
  /** The search asks to rent ("rent a tennis necklace"). */
  searchRents: boolean
  /** A piece's name on screen, for sorting by name. */
  name: (p: Product) => string
  locale: string
}

export interface Outcome {
  /** The pieces that match, in the chosen order. */
  shown: Product[]
  /** For each facet value, how many pieces it would give with the other choices kept. */
  counts: Record<FacetId, Record<string, number>>
  /** The price slider's stops, and how many of the pieces (other choices kept) fall between each pair. */
  scale: number[]
  histogram: number[]
  renting: boolean
  /** Whether a card leads with its weekend rate. */
  rentLed: (p: Product) => boolean
  /** The price a piece is filtered by: its price to own, or its weekend rate when renting. */
  priceOf: (p: Product) => number
}

/** The pieces for a selection, with the counts and the price scale the panel shows. */
export function browse(pieces: Product[], s: Selection, ctx: Context): Outcome {
  const own = { saved: new Set(ctx.saved), viewed: new Set(ctx.viewed) }
  const renting = asksToRent(s) || ctx.searchRents
  const priced = s.min !== undefined || s.max !== undefined
  // A price (asked or sorted by) means the price to own, as in the header's search; renting means the weekend rate.
  const byPrice = priced || s.sort === 'low' || s.sort === 'high'
  const rentLed = (p: Product) => (renting || (!byPrice && rentFirst(p))) && isRentable(p)
  const priceOf = (p: Product) => cardPrice(p, ctx.currency, renting && isRentable(p)).amount
  const order = ctx.found ? new Map(ctx.found.map((p, i) => [p.slug, i])) : null
  const pool = order ? pieces.filter((p) => order.has(p.slug)) : pieces

  const values = new Map(pool.map((p) => [p.slug, Object.fromEntries(FACETS.map((id) => [id, valuesOf(p, id, own)])) as Record<FacetId, string[]>]))
  const inRange = (p: Product) => {
    const n = priceOf(p)
    return n >= (s.min ?? 0) && n <= (s.max ?? Infinity)
  }
  const passes = (p: Product, except?: FacetId | 'price') => {
    const v = values.get(p.slug)!
    return FACETS.every((id) => id === except || !s.facets[id].length || s.facets[id].some((x) => v[id].includes(x))) && (except === 'price' || inRange(p))
  }

  const counts = {} as Record<FacetId, Record<string, number>>
  for (const id of FACETS) {
    const base = pool.filter((p) => passes(p, id))
    counts[id] = Object.fromEntries(optionsOf(id).map((x) => [x, base.filter((p) => values.get(p.slug)![id].includes(x)).length]))
  }

  const scale = priceScale(pieces.filter((p) => !renting || isRentable(p)).map(priceOf))
  const histogram = scale.slice(1).map(() => 0)
  for (const p of pool.filter((x) => passes(x, 'price') && (!renting || isRentable(x)))) {
    const n = priceOf(p)
    const i = scale.findIndex((stop, k) => k > 0 && n < stop)
    histogram[i < 0 ? histogram.length - 1 : i - 1] += 1
  }

  const rec = (a: Product, b: Product) => (order ? order.get(a.slug)! - order.get(b.slug)! : (RANK.get(a.slug) ?? 999) - (RANK.get(b.slug) ?? 999))
  const shownPrice = (p: Product) => cardPrice(p, ctx.currency, rentLed(p)).amount
  const fresh = (p: Product) => Number(!!p.badges?.includes('New'))
  const shown = pool.filter((p) => passes(p))
  if (s.sort === 'recommended') shown.sort(rec)
  else if (s.sort === 'new') shown.sort((a, b) => fresh(b) - fresh(a) || rec(a, b))
  else if (s.sort === 'low') shown.sort((a, b) => shownPrice(a) - shownPrice(b) || rec(a, b))
  else if (s.sort === 'high') shown.sort((a, b) => shownPrice(b) - shownPrice(a) || rec(a, b))
  else shown.sort((a, b) => ctx.name(a).localeCompare(ctx.name(b), ctx.locale) || rec(a, b))

  return { shown, counts, scale, histogram, renting, rentLed, priceOf }
}

/** One choice taken back, and how many pieces that would give: what an empty result suggests. */
export interface Loosen {
  facet: FacetId | 'price' | 'q'
  value?: string
  count: number
}

/** The single choices whose removal would bring pieces back, most pieces first. */
export function loosen(pieces: Product[], s: Selection, ctx: Context): Loosen[] {
  const out: Loosen[] = []
  for (const id of FACETS) for (const value of s.facets[id]) out.push({ facet: id, value, count: browse(pieces, { ...s, facets: { ...s.facets, [id]: s.facets[id].filter((v) => v !== value) } }, ctx).shown.length })
  if (s.min !== undefined || s.max !== undefined) out.push({ facet: 'price', count: browse(pieces, { ...s, min: undefined, max: undefined }, ctx).shown.length })
  if (s.q) out.push({ facet: 'q', count: browse(pieces, { ...s, q: '' }, { ...ctx, found: null, searchRents: false }).shown.length })
  return out.filter((l) => l.count > 0).sort((a, b) => b.count - a.count).slice(0, 3)
}

/** The house's cards set among the pieces: each one only where it helps the pieces on screen. */
export type OfferId = 'designer' | 'rent' | 'engrave' | 'gift'

/** The offers for what is shown, the most fitting first. */
export function offersFor(s: Selection, shown: Product[], renting: boolean): OfferId[] {
  const out: OfferId[] = []
  if (shown.some((p) => needsSize(p) || p.type === 'commission')) out.push('designer')
  if (!renting && shown.some(isRentable)) out.push('rent')
  if (!s.facets.svc.includes('engrave') && shown.filter((p) => p.engravable).length > 1) out.push('engrave')
  out.push('gift')
  // Rings open on the designer (it leads whenever it shows); the vault on renting; gifts and small budgets on the card.
  const gifting = s.facets.chapter.includes('gifts') || (s.max !== undefined && s.max <= 2000)
  const lead: OfferId | null = gifting ? 'gift' : s.facets.chapter.includes('rentals') ? 'rent' : null
  return lead && out.includes(lead) ? [lead, ...out.filter((o) => o !== lead)] : out
}

/** A place in the grid: a piece, or one of the house's cards. */
export type Cell = { kind: 'piece'; product: Product } | { kind: 'offer'; id: OfferId }

/** Cells per "Show more", a multiple of every row length (1–4), so each set ends on a full row. */
export const PAGE = 12

// Where the offers sit, by place in the grid: one in each of the first sets, in a different column each time.
const SLOTS = [4, 21, 34, 47]

/** The pieces with the offers set among them; an offer only ever sits before a piece. */
export function cellsFor(shown: Product[], offers: OfferId[]): Cell[] {
  const cells: Cell[] = []
  let o = 0
  for (const product of shown) {
    if (o < offers.length && o < SLOTS.length && cells.length === SLOTS[o]) cells.push({ kind: 'offer', id: offers[o++] })
    cells.push({ kind: 'piece', product })
  }
  return cells
}

/** A metal's swatch colour, for the dots on a card and in the panel. */
export const swatchOf = (m: Metal) => METALS[m].swatch
