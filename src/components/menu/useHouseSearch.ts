import { useCallback, useMemo } from 'react'
import { CATEGORIES, PRODUCTS, SIGNATURES, cardPrice, familyOf, isRentable, rentFirst, type CategorySlug, type Currency, type Product, type ProductType } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, pick, useCopy, useLocale } from '../../i18n'
import { catalogFor, useCatalog } from '../../i18n/catalog'
import { href, useStore } from '../../store'
import { KEYWORDS, chapterFields, complete, entry, keyOf, pieceFields, rank, read, signatureFields, vocabulary, type Entry, type Reading } from './search'

const COPY = bilingual(
  {
    pages: { designer: 'The ring designer', atelier: 'The Atelier', giftcards: 'Gift Cards', wishlist: 'Wishlist', account: 'Your account', signIn: 'Sign in', cart: 'Your bag', home: 'Home' },
    visit: 'Book a visit',
    ask: 'Ask a jeweller',
    // Phrases a query can complete into, besides the kinds of piece and the collections.
    metals: ['Yellow gold', 'White gold', 'Rose gold', 'Platinum', 'Gold vermeil'],
    stones: ['Diamonds', 'Pearls', 'Emeralds', 'Sapphires'],
  },
  {
    pages: { designer: 'Créer votre bague', atelier: 'L’Atelier', giftcards: 'Cartes-cadeaux', wishlist: 'Liste de souhaits', account: 'Votre compte', signIn: 'Se connecter', cart: 'Votre panier', home: 'Accueil' },
    visit: 'Prendre rendez-vous',
    ask: 'Parler à un joaillier',
    metals: ['Or jaune', 'Or blanc', 'Or rose', 'Platine', 'Vermeil'],
    stones: ['Diamants', 'Perles', 'Émeraudes', 'Saphirs'],
  },
)

// What a whole query can mean exactly, beyond the titles themselves, so Enter goes straight there ("rent" → the vault).
const ALIASES: Record<string, string[]> = {
  shop: ['every piece', 'all pieces', 'shop', 'shop all', 'all jewellery', 'all jewelry', 'everything', 'toutes les pièces', 'boutique', 'toute la boutique', 'tous les bijoux'],
  rentals: ['rent', 'rentals', 'vault', 'louer', 'location', 'coffre'],
  bridal: ['bridal', 'wedding', 'mariage'],
  custom: ['custom', 'bespoke', 'sur mesure', 'personalized', 'personnalisé'],
  gifts: ['gift', 'gifts', 'cadeau', 'cadeaux'],
  'a:visit': ['visit', 'appointment', 'book', 'booking', 'rendez-vous', 'visite'],
  'a:ask': ['contact', 'help', 'aide', 'whatsapp', 'jeweller'],
  'g:giftcards': ['gift card', 'carte cadeau', 'carte-cadeau'],
  'g:cart': ['bag', 'cart', 'panier'],
  'g:wishlist': ['favourites', 'favorites', 'favoris'],
  'g:account': ['account', 'my account', 'mon compte', 'compte', 'sign in', 'login', 'connexion'],
  'g:atelier': ['workshop', 'our story', 'notre histoire'],
  'g:designer': ['design', 'designer', 'configurator', 'build a ring', 'create', 'créer', 'concevoir', 'dessiner'],
}

/** A chapter or a signature page. */
export interface Way {
  id: string
  mark: string
  title: string
  url: string
  signature: boolean
}

/** A page, or an action that opens a panel (the visit drawer, "Ask a jeweller"). */
export interface Door {
  id: string
  title: string
  url?: string
  action?: 'visit' | 'ask'
}

/** Where Enter takes a query: a page, or an action. */
export type Landing = { url: string } | { action: 'visit' | 'ask' }

/** What a query found, in the shape of Shopify's predictive search resources (queries, products, collections, pages). */
export interface Found {
  reading: Reading
  /** Every piece that matches, best first, within the price and the renting asked for. */
  pieces: Product[]
  ways: Way[]
  doors: Door[]
  /** Phrases that complete the query, with how many pieces each finds. */
  suggestions: { text: string; count: number }[]
  landing: Landing | null
  /** Whether a piece shows (and is priced at) its weekend rate: when the query asks to rent, or for the vault's own
   *  pieces unless a price was asked (a price means the price to own). */
  rentLed: (p: Product) => boolean
}

/** The house's search: the signature pages and chapters, every piece, the pages and the two actions, indexed in both
 *  languages (the one on screen ranks first), and `find(query, currency)`, which reads the query and answers it. */
export default function useHouseSearch() {
  const { user } = useStore()
  const { lang } = useLocale()
  const catalog = useCatalog()
  const house = useCopy(HOUSE)
  const t = useCopy(COPY)

  const index = useMemo(() => {
    const otherLocale = lang === 'fr' ? 'en-CA' : 'fr-CA'
    const other = catalogFor(otherLocale)
    const otherHouse = pick(HOUSE, otherLocale)
    const o = pick(COPY, otherLocale)
    const ways = [
      ...SIGNATURES.map((x): Entry<Way> => entry(`sig:${x.id}`, { id: `sig:${x.id}`, mark: '✦', title: house.signatures[x.id].name, url: href.category(x.category, { type: x.family }), signature: true }, signatureFields(house.signatures[x.id], otherHouse.signatures[x.id]))),
      ...CATEGORIES.map((c): Entry<Way> => entry(c.slug, { id: c.slug, mark: c.eyebrow, title: catalog.category(c).name, url: href.category(c.slug), signature: false }, chapterFields(c, catalog, other))),
    ]
    const doorList: [Door, string][] = [
      [{ id: 'a:visit', title: t.visit, action: 'visit' }, o.visit],
      [{ id: 'a:ask', title: t.ask, action: 'ask' }, o.ask],
      [{ id: 'g:designer', title: t.pages.designer, url: href.designer() }, o.pages.designer],
      [{ id: 'g:atelier', title: t.pages.atelier, url: href.atelier }, o.pages.atelier],
      [{ id: 'g:giftcards', title: t.pages.giftcards, url: href.giftcards }, o.pages.giftcards],
      [{ id: 'g:wishlist', title: t.pages.wishlist, url: href.wishlist }, o.pages.wishlist],
      [{ id: 'g:account', title: user ? t.pages.account : t.pages.signIn, url: href.account }, user ? o.pages.account : o.pages.signIn],
      [{ id: 'g:cart', title: t.pages.cart, url: href.cart }, o.pages.cart],
      [{ id: 'g:home', title: t.pages.home, url: href.home }, o.pages.home],
    ]
    const doors = doorList.map(([d, otherTitle]) => entry(d.id, d, [[d.title, 10], [otherTitle, 7], [KEYWORDS[d.id] ?? '', 4]]))
    // The gift card is a page of its own, so it is found as one.
    const pieces = PRODUCTS.filter((p) => p.type !== 'gift-card').map((p) => entry(p.slug, p, pieceFields(p, catalog, other)))

    // Completions: the kinds of piece, the collections, metals and stones, in the language on screen.
    const types = [...new Set(pieces.map((e) => e.item.type))]
    const phrases = [...new Map([...types.map((x) => catalog.type(x)), ...pieces.map((e) => catalog.product(e.item).collection), ...t.metals, ...t.stones].map((s) => [keyOf(s), s])).values()]

    // Exact meanings for Enter: chapters and signatures first, then kinds of piece (to their chapter, filtered), pages
    // and actions, then each piece by its name in either language.
    const exact = new Map<string, Landing>()
    const add = (text: string, landing: Landing) => {
      const k = keyOf(text)
      if (k && !exact.has(k)) exact.set(k, landing)
    }
    for (const x of SIGNATURES) for (const name of [house.signatures[x.id].name, otherHouse.signatures[x.id].name]) add(name, { url: href.category(x.category, { type: x.family }) })
    for (const c of CATEGORIES) for (const name of [catalog.category(c).name, other.category(c).name, ...(ALIASES[c.slug] ?? [])]) add(name, { url: href.category(c.slug) })
    for (const name of ALIASES.shop) add(name, { url: href.shop() })
    const home = (type: ProductType): CategorySlug => {
      const count = new Map<CategorySlug, number>()
      for (const p of PRODUCTS) if (p.type === type) count.set(p.category, (count.get(p.category) ?? 0) + 1)
      return [...count].sort((a, b) => b[1] - a[1])[0][0]
    }
    for (const x of types) for (const name of [catalog.type(x), other.type(x)]) add(name, { url: href.category(home(x), { type: familyOf(x) }) })
    for (const [d, otherTitle] of doorList) {
      const landing: Landing = d.action ? { action: d.action } : { url: d.url ?? href.home }
      for (const name of [d.title, otherTitle, ...(ALIASES[d.id] ?? [])]) add(name, landing)
    }
    for (const e of pieces) for (const name of [catalog.name(e.item), other.name(e.item)]) add(name, { url: href.product(e.item.slug, rentFirst(e.item)) })

    const all = [ways, pieces, doors] as Entry<unknown>[][]
    return { ways, doors, pieces, rentals: ways.find((e) => e.id === 'rentals')?.item, vocab: vocabulary(all), phrases, exact }
  }, [catalog, house, lang, t, user])

  const find = useCallback((query: string, currency: Currency): Found => {
    const reading = read(query, index.vocab, lang)
    const priced = reading.min !== undefined || reading.max !== undefined
    const ways = rank(index.ways, reading.words, 3).map((e) => e.item)
    // Renting always finds the vault's chapter.
    if (reading.rent && index.rentals && !ways.some((w) => w.id === 'rentals')) ways.unshift(index.rentals)
    const doors = rank(index.doors, reading.words, 2).map((e) => e.item)

    const rentLed = (p: Product) => (reading.rent || (!priced && rentFirst(p))) && isRentable(p)
    const priceOf = (p: Product) => cardPrice(p, currency, rentLed(p)).amount
    let pieces = reading.text ? rank(index.pieces, reading.text, Infinity).map((e) => e.item) : reading.rent || priced ? index.pieces.map((e) => e.item) : []
    if (reading.rent) pieces = pieces.filter(isRentable)
    if (priced) pieces = pieces.filter((p) => priceOf(p) >= (reading.min ?? 0) && priceOf(p) <= (reading.max ?? Infinity))
    // Only a price or renting: the dearest first (renting alone, the vault's own pieces lead).
    if (!reading.text) pieces.sort((a, b) => (priced ? 0 : Number(rentFirst(b)) - Number(rentFirst(a))) || priceOf(b) - priceOf(a))

    // Completions only for words alone; a phrase already listed as a chapter isn't repeated.
    const listed = new Set([...ways.map((w) => keyOf(w.title)), keyOf(reading.text)])
    const suggestions = reading.text && !priced && !reading.rent
      ? complete(reading.text, index.phrases, 8).filter((p) => !listed.has(keyOf(p))).map((text) => ({ text, count: rank(index.pieces, text, Infinity).length })).filter((s) => s.count > 0).slice(0, 4)
      : []

    let landing: Landing | null = index.exact.get(keyOf(query)) ?? (reading.fixes.length ? index.exact.get(keyOf(reading.words)) : undefined) ?? null
    if (!landing) {
      if (pieces.length === 1 && !ways.length && !doors.length) landing = { url: href.product(pieces[0].slug, rentLed(pieces[0])) }
      else if (pieces.length) landing = { url: href.shop({ q: query.trim() }) }
      else if (ways[0]) landing = { url: ways[0].url }
      else if (doors[0]) landing = doors[0].action ? { action: doors[0].action } : { url: doors[0].url ?? href.home }
    }
    return { reading, pieces, ways: ways.slice(0, 3), doors, suggestions, landing, rentLed }
  }, [index, lang])

  return { find }
}
