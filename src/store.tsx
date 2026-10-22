import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { convert, type GiftCardLine } from './data/giftcards'
import { getProduct, personalizationPrice, priceFor, type Currency, type Metal, type Personalization, type RentalBooking } from './data/catalog'
import { RING_SIZE_VALUES, decodeDesign, isDesignCode } from './data/ring'
import { ringPrice } from './data/ringPrice'
import type { Visit, VisitRequest } from './data/visits'
import { browserLang, localeFor, LocaleContext, runSwitch, setActiveLocale, type Lang, type LocaleValue } from './i18n'

/** A page's options in its address (`#/c/bridal?type=engagement`): filters on chapter pages, Own or Rent on a piece. */
export type Query = Record<string, string>

export type Route =
  | { name: 'home' }
  | { name: 'shop'; query: Query }
  | { name: 'category'; slug: string; query: Query }
  | { name: 'product'; slug: string; query: Query }
  | { name: 'atelier' }
  | { name: 'designer'; query: Query }
  | { name: 'checkout' }
  | { name: 'wishlist' }
  | { name: 'account' }
  | { name: 'giftcards' }
  | { name: 'cart' }

export interface CartLine {
  key: string
  slug: string
  metal?: Metal
  rental?: 'weekend' | 'week' | 'month'
  engraving?: string
  size?: string
  booking?: RentalBooking
  personalization?: Personalization
  giftCard?: GiftCardLine
  /** A ring designed in the designer: its code (see `encodeDesign`). It rides on the commission piece and is priced from the design. */
  design?: string
  qty: number
}

// The language is in the address, as a Shopify market's alternate language is: French pages sit under #/fr/, English
// ones have no prefix. Links carry the prefix of the language on screen. Only the first load obeys it, though: after
// that the language is the visitor's choice, and an address in the other language (an older history entry, a link
// made before a switch) is rewritten into theirs.
const PREFIX: Record<Lang, string> = { en: '', fr: '/fr' }
let prefix = ''

/** A hash split into its page path and the language it names, if any (`#/fr/c/rings` → `/c/rings`, `fr`). */
export function splitHash(hash = window.location.hash): { path: string; lang: Lang | null } {
  const raw = hash.replace(/^#/, '')
  const m = raw.match(/^\/(en|fr)(?=\/|$)/)
  const path = m ? raw.slice(m[0].length) : raw
  return { path: path.startsWith('/') ? path : `/${path}`, lang: m ? (m[1] as Lang) : null }
}

/** The page part of a hash, whatever its language (`#/fr/c/rings` → `#/c/rings`). */
export const bareHash = (hash = window.location.hash) => `#${splitHash(hash).path}`

/** A query string from options, in a stable order, without empty values (`?metal=platinum&type=engagement`). */
export function queryString(query: Query = {}) {
  const keys = Object.keys(query).filter((k) => query[k]).sort()
  return keys.length ? `?${keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&')}` : ''
}

/** The route for a hash: the address bar's by default, or a link's `href` (page transitions read where a link leads). */
export function parseHash(hash = window.location.hash): Route {
  const [path, search = ''] = splitHash(hash).path.split('?')
  const parts = path.split('/').filter(Boolean)
  const query: Query = {}
  new URLSearchParams(search).forEach((v, k) => (query[k] = v))
  if (parts[0] === 'shop') return { name: 'shop', query }
  if (parts[0] === 'c' && parts[1]) return { name: 'category', slug: parts[1], query }
  if (parts[0] === 'gift-cards' || (parts[0] === 'p' && parts[1] === 'gift-card')) return { name: 'giftcards' }
  if (parts[0] === 'p' && parts[1]) return { name: 'product', slug: parts[1], query }
  if (parts[0] === 'atelier') return { name: 'atelier' }
  if (parts[0] === 'designer') return { name: 'designer', query }
  if (parts[0] === 'checkout') return { name: 'checkout' }
  if (parts[0] === 'cart') return { name: 'cart' }
  if (parts[0] === 'wishlist') return { name: 'wishlist' }
  if (parts[0] === 'account') return { name: 'account' }
  return { name: 'home' }
}

const at = (path: string) => `#${prefix}${path}`

/** Links, in the language on screen. */
export const href = {
  get home() { return at('/') },
  shop: (query?: Query) => at(`/shop${queryString(query)}`),
  category: (slug: string, query?: Query) => at(`/c/${slug}${queryString(query)}`),
  /** A piece's page; `rent` opens it on renting. */
  product: (slug: string, rent = false) => at(`/p/${slug}${rent ? '?mode=rent' : ''}`),
  get atelier() { return at('/atelier') },
  /** The ring designer; `r` opens a design (its code), `step` a step. */
  designer: (query?: Query) => at(`/designer${queryString(query)}`),
  get checkout() { return at('/checkout') },
  get cart() { return at('/cart') },
  get wishlist() { return at('/wishlist') },
  get account() { return at('/account') },
  get giftcards() { return at('/gift-cards') },
}

export interface Account {
  name: string
  email: string
}

/** A date the client wants remembered (an anniversary, a birthday): the salon writes ahead of it. */
export interface SavedDate {
  id: string
  label: string
  /** Month and day, mm-dd. */
  date: string
}

/** What the house remembers for the client on this device: their ring size and the dates that matter to them. */
export interface Profile {
  ringSize?: string
  dates: SavedDate[]
}

const NO_PROFILE: Profile = { dates: [] }

/** A ring designed and kept on this device: its code, a small picture of it, and when it was kept. */
export interface SavedDesign {
  code: string
  /** A JPEG data URL, about 360 × 450. */
  image: string
  saved: string
}

const DESIGNS_KEPT = 12

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// The market (currency) a visit starts in. A stored value is checked, not trusted.
function loadCurrency(): Currency {
  try {
    return localStorage.getItem('tns-currency') === 'USD' ? 'USD' : 'CAD'
  } catch {
    return 'CAD'
  }
}

/** How the visit's language was decided: by its address, the visitor's earlier choice, their browser, or by default. */
export type LangSource = 'url' | 'stored' | 'browser' | 'default'

/** Why the language on screen is the one it is, for LanguageNotice: where it came from, the visitor's stored choice,
 *  the browser's preference, and whether the browser lists both languages. */
export interface LangOrigin {
  source: LangSource
  stored: Lang | null
  browser: Lang | null
  both: boolean
}

function resolveLang(): { lang: Lang; origin: LangOrigin } {
  let stored: Lang | null = null
  try {
    const l = localStorage.getItem('tns-lang')
    stored = l === 'fr' || l === 'en' ? l : null
  } catch {
    // Storage blocked: decide from the address and the browser.
  }
  const fromBrowser = browserLang()
  const named = splitHash().lang
  const facts = { stored, browser: fromBrowser?.lang ?? null, both: fromBrowser?.both ?? false }
  if (named) return { lang: named, origin: { ...facts, source: 'url' } }
  if (stored) return { lang: stored, origin: { ...facts, source: 'stored' } }
  if (fromBrowser) return { lang: fromBrowser.lang, origin: { ...facts, source: 'browser' } }
  return { lang: 'en', origin: { ...facts, source: 'default' } }
}

/** Points everything locale-dependent at a language and market: formatters, link prefixes, `<html lang>` and the
 *  address bar (rewritten in place, so a switch adds no history entry and starts no page transition). */
function syncLocale(lang: Lang, currency: Currency) {
  const locale = localeFor(lang, currency)
  setActiveLocale(locale)
  prefix = PREFIX[lang]
  document.documentElement.lang = locale
  const canonical = `#${prefix}${splitHash().path}`
  if ((window.location.hash || '#/') !== canonical) history.replaceState(history.state, '', canonical)
}

const START = resolveLang()
const START_CURRENCY = loadCurrency()
syncLocale(START.lang, START_CURRENCY)

/** Order-level options; map to Shopify cart `note` and `attributes`. */
export interface CartMeta {
  giftWrap: boolean
  giftReceipt: boolean
  giftMessage: string
  note: string
}

const DEFAULT_META: CartMeta = { giftWrap: false, giftReceipt: false, giftMessage: '', note: '' }

/** Identity of a configured piece; identical configurations stack in one line. A design joins the key only when there
 *  is one, so every other line keeps the key it was stored with. */
export const lineKey = (line: Omit<CartLine, 'key' | 'qty'>) =>
  [line.slug, line.metal, line.rental, line.engraving, line.size, JSON.stringify(line.booking ?? ''), JSON.stringify(line.personalization ?? ''), JSON.stringify(line.giftCard ?? ''), ...(line.design ? [line.design] : [])].join('|')

interface StoreValue {
  route: Route
  currency: Currency
  setCurrency: (c: Currency) => void
  lang: Lang
  setLang: (lang: Lang) => void
  /** How the visit's language was decided (see LanguageNotice). */
  langOrigin: LangOrigin
  /** The language suggestion has been answered or dismissed; it does not come back. */
  langHintSeen: boolean
  dismissLangHint: () => void
  cart: CartLine[]
  cartOpen: boolean
  setCartOpen: (o: boolean) => void
  addToCart: (line: Omit<CartLine, 'key' | 'qty'>) => void
  updateQty: (key: string, qty: number) => void
  clearCart: () => void
  removeLine: (key: string) => void
  undoRemove: () => void
  lastRemoved: CartLine | null
  meta: CartMeta
  setMeta: (patch: Partial<CartMeta>) => void
  wishlist: string[]
  toggleWishlist: (slug: string) => void
  isWished: (slug: string) => boolean
  user: Account | null
  recent: string[]
  recordView: (slug: string) => void
  clearRecent: () => void
  /** What the visitor searched for on this device, most recent first (the header search lists them). */
  searches: string[]
  rememberSearch: (query: string) => void
  forgetSearches: () => void
  signIn: (user: Account) => void
  signOut: () => void
  linePrice: (line: CartLine) => number
  subtotal: number
  count: number
  /** Rewrites the current page's options in the address (filters, Own or Rent) without a history entry or a page
   *  transition, so Back, reload and shared links keep them. The route object keeps the options it opened with. */
  replaceQuery: (query: Query) => void
  visits: Visit[]
  /** Books a visit, or replaces the one with the same id (a change of time). */
  bookVisit: (visit: Visit) => void
  cancelVisit: (id: string) => void
  /** The booking panel's request while it is open, else null. */
  visitRequest: VisitRequest | null
  openVisit: (request?: VisitRequest) => void
  closeVisit: () => void
  /** The "Ask a jeweller" panel: the pieces it is about while it is open, else null. */
  askAbout: string[] | null
  /** The rings from the designer it is about (their codes), with the pieces. */
  askDesigns: string[]
  openAsk: (slugs?: string[], designs?: string[]) => void
  closeAsk: () => void
  profile: Profile
  setProfile: (patch: Partial<Profile>) => void
  /** When the visit suggestion was last shown or dismissed (ms since 1970), so it returns at most once a week. */
  nudgeAt: number
  dismissNudge: () => void
  /** Rings designed and kept on this device, newest first. */
  designs: SavedDesign[]
  saveDesign: (design: SavedDesign) => void
  forgetDesign: (code: string) => void
  /** The ring being designed, so the designer opens where it was left. */
  designDraft: string | null
  setDesignDraft: (code: string | null) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(parseHash)
  const [currency, setCurrencyState] = useState<Currency>(START_CURRENCY)
  const [lang, setLangState] = useState<Lang>(START.lang)
  const [langHintSeen, setLangHintSeen] = useState(() => load('tns-lang-hint', false))
  // The latest language and market, for callbacks that keep their identity.
  const live = useRef({ lang: START.lang, currency: START_CURRENCY })
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const v: unknown = JSON.parse(localStorage.getItem('tns-cart') || '[]')
      return Array.isArray(v) ? v.filter((l): l is CartLine => !!l && typeof l.key === 'string' && typeof l.slug === 'string' && (l.design === undefined || isDesignCode(l.design))) : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>(() => load('tns-wishlist', []))
  const [user, setUser] = useState<Account | null>(() => load('tns-account', null))

  useEffect(() => localStorage.setItem('tns-wishlist', JSON.stringify(wishlist)), [wishlist])

  // Most recent first, capped at 12, persisted per device.
  const [recent, setRecent] = useState<string[]>(() => load('tns-recent', []))
  useEffect(() => localStorage.setItem('tns-recent', JSON.stringify(recent)), [recent])
  const recordView = useCallback((slug: string) => setRecent((r) => (r[0] === slug ? r : [slug, ...r.filter((s) => s !== slug)].slice(0, 12))), [])
  const clearRecent = useCallback(() => setRecent([]), [])
  // Searches the visitor carried through (a result opened, or Enter), most recent first, five kept, no repeats.
  const [searches, setSearches] = useState<string[]>(() => {
    const v = load<unknown>('tns-searches', [])
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && !!s.trim()).slice(0, 5) : []
  })
  useEffect(() => localStorage.setItem('tns-searches', JSON.stringify(searches)), [searches])
  const rememberSearch = useCallback((query: string) => {
    const q = query.trim().replace(/\s+/g, ' ').slice(0, 80)
    if (q.length < 2) return
    setSearches((list) => [q, ...list.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 5))
  }, [])
  const forgetSearches = useCallback(() => setSearches([]), [])
  useEffect(() => {
    if (user) localStorage.setItem('tns-account', JSON.stringify(user))
    else localStorage.removeItem('tns-account')
  }, [user])

  const toggleWishlist = useCallback(
    (slug: string) => setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug])),
    [],
  )
  const isWished = useCallback((slug: string) => wishlist.includes(slug), [wishlist])
  const signIn = useCallback((u: Account) => setUser(u), [])
  const signOut = useCallback(() => setUser(null), [])

  useEffect(() => {
    const onHash = () => {
      // Keep the address in the visitor's language (see PREFIX), then follow it.
      syncLocale(live.current.lang, live.current.currency)
      setRoute(parseHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => localStorage.setItem('tns-cart', JSON.stringify(cart)), [cart])

  // The market also decides which English is shown (Canadian or US), so the locale moves with it, ahead of the render.
  const setCurrency = useCallback((c: Currency) => {
    live.current.currency = c
    syncLocale(live.current.lang, c)
    setCurrencyState(c)
    localStorage.setItem('tns-currency', c)
  }, [])

  const dismissLangHint = useCallback(() => setLangHintSeen(true), [])
  useEffect(() => localStorage.setItem('tns-lang-hint', JSON.stringify(langHintSeen)), [langHintSeen])

  // A switch is a choice: it is remembered for the next visit and answers any suggestion. The swap runs under
  // LanguageVeil's cover and renders synchronously, so the page can be put back exactly where the visitor was reading.
  const setLang = useCallback((next: Lang) => {
    if (next === live.current.lang) return
    localStorage.setItem('tns-lang', next)
    setLangHintSeen(true)
    runSwitch(next, () => {
      live.current.lang = next
      syncLocale(next, live.current.currency)
      flushSync(() => setLangState(next))
    })
  }, [])

  const addToCart = useCallback((line: Omit<CartLine, 'key' | 'qty'>) => {
    const key = lineKey(line)
    setCart((prev) => {
      const found = prev.find((l) => l.key === key)
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { ...line, key, qty: 1 }]
    })
    setCartOpen(true)
  }, [])

  const updateQty = useCallback((key: string, qty: number) => {
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))))
  }, [])

  const [lastRemoved, setLastRemoved] = useState<{ line: CartLine; index: number } | null>(null)
  const [meta, setMetaState] = useState<CartMeta>(() => ({ ...DEFAULT_META, ...load<Partial<CartMeta>>('tns-cart-meta', {}) }))
  useEffect(() => localStorage.setItem('tns-cart-meta', JSON.stringify(meta)), [meta])
  const setMeta = useCallback((patch: Partial<CartMeta>) => setMetaState((m) => ({ ...m, ...patch })), [])

  const clearCart = useCallback(() => {
    setCart([])
    setMetaState(DEFAULT_META)
    setLastRemoved(null)
  }, [])

  const removeLine = useCallback((key: string) => {
    setCart((prev) => {
      const index = prev.findIndex((l) => l.key === key)
      if (index >= 0) setLastRemoved({ line: prev[index], index })
      return prev.filter((l) => l.key !== key)
    })
  }, [])

  const undoRemove = useCallback(() => {
    setLastRemoved((r) => {
      if (r) setCart((prev) => (prev.some((l) => l.key === r.line.key) ? prev : [...prev.slice(0, r.index), r.line, ...prev.slice(r.index)]))
      return null
    })
  }, [])

  const linePrice = useCallback(
    (line: CartLine) => {
      const product = getProduct(line.slug)
      if (line.giftCard) return convert(line.giftCard.amount, line.giftCard.currency, currency) * line.qty
      if (line.design) {
        const design = decodeDesign(line.design)
        return design ? ringPrice(design, currency) * line.qty : 0
      }
      if (!product) return 0
      if (line.rental && product.rental) return product.rental[line.rental][currency] * line.qty
      return (priceFor(product, currency, line.metal) + personalizationPrice(product, line.personalization, currency)) * line.qty
    },
    [currency],
  )

  // The address follows a page's options in place. PageTransition hears 'tns:address' and re-notes where it is, so
  // Back still returns here (with these options) instead of reading the rewritten address as a new page.
  const replaceQuery = useCallback((query: Query) => {
    const [path] = splitHash().path.split('?')
    history.replaceState(history.state, '', `#${prefix}${path}${queryString(query)}`)
    window.dispatchEvent(new Event('tns:address'))
  }, [])

  // Visits, newest booking kept per id. A stored list is checked, not trusted.
  const [visits, setVisits] = useState<Visit[]>(() => {
    const v = load<unknown>('tns-visits', [])
    return Array.isArray(v) ? v.filter((x): x is Visit => !!x && typeof x.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && /^\d{2}:\d{2}$/.test(x.time)) : []
  })
  useEffect(() => localStorage.setItem('tns-visits', JSON.stringify(visits)), [visits])
  const bookVisit = useCallback((visit: Visit) => setVisits((vs) => [...vs.filter((v) => v.id !== visit.id), visit]), [])
  const cancelVisit = useCallback((id: string) => setVisits((vs) => vs.filter((v) => v.id !== id)), [])
  // The booking and "Ask a jeweller" panels take turns, and either one replaces the bag drawer.
  const [visitRequest, setVisitRequest] = useState<VisitRequest | null>(null)
  const [askAbout, setAskAbout] = useState<string[] | null>(null)
  const [askDesigns, setAskDesigns] = useState<string[]>([])
  const openVisit = useCallback((request: VisitRequest = {}) => {
    setCartOpen(false)
    setAskAbout(null)
    setVisitRequest(request)
  }, [])
  const closeVisit = useCallback(() => setVisitRequest(null), [])
  const openAsk = useCallback((slugs: string[] = [], designs: string[] = []) => {
    setCartOpen(false)
    setVisitRequest(null)
    setAskDesigns(designs)
    setAskAbout(slugs)
  }, [])
  const closeAsk = useCallback(() => setAskAbout(null), [])

  const [profile, setProfileState] = useState<Profile>(() => {
    const p = load<Partial<Profile>>('tns-profile', NO_PROFILE)
    return { ringSize: typeof p.ringSize === 'string' && RING_SIZE_VALUES.includes(p.ringSize) ? p.ringSize : undefined, dates: Array.isArray(p.dates) ? p.dates : [] }
  })
  useEffect(() => localStorage.setItem('tns-profile', JSON.stringify(profile)), [profile])
  const setProfile = useCallback((patch: Partial<Profile>) => setProfileState((p) => ({ ...p, ...patch })), [])

  const [nudgeAt, setNudgeAt] = useState<number>(() => {
    const n = load<unknown>('tns-nudge', 0)
    return typeof n === 'number' ? n : 0
  })
  useEffect(() => localStorage.setItem('tns-nudge', JSON.stringify(nudgeAt)), [nudgeAt])
  const dismissNudge = useCallback(() => setNudgeAt(Date.now()), [])

  // Designed rings, checked as they are read. Their pictures are the heaviest thing kept, so if storage is full the
  // list is kept without them rather than lost.
  const [designs, setDesigns] = useState<SavedDesign[]>(() => {
    const v = load<unknown>('tns-designs', [])
    return Array.isArray(v) ? v.filter((x): x is SavedDesign => !!x && isDesignCode(x.code) && typeof x.image === 'string' && typeof x.saved === 'string').slice(0, DESIGNS_KEPT) : []
  })
  useEffect(() => {
    try {
      localStorage.setItem('tns-designs', JSON.stringify(designs))
    } catch {
      try {
        localStorage.setItem('tns-designs', JSON.stringify(designs.map((x) => ({ ...x, image: '' }))))
      } catch {
        // Storage is full or blocked: the designs stay for this visit only.
      }
    }
  }, [designs])
  const saveDesign = useCallback((design: SavedDesign) => setDesigns((list) => [design, ...list.filter((x) => x.code !== design.code)].slice(0, DESIGNS_KEPT)), [])
  const forgetDesign = useCallback((code: string) => setDesigns((list) => list.filter((x) => x.code !== code)), [])
  const [designDraft, setDraft] = useState<string | null>(() => {
    const v = load<unknown>('tns-design-draft', null)
    return isDesignCode(v) ? v : null
  })
  useEffect(() => localStorage.setItem('tns-design-draft', JSON.stringify(designDraft)), [designDraft])
  const setDesignDraft = useCallback((code: string | null) => setDraft(code), [])

  const value = useMemo<StoreValue>(() => {
    const subtotal = cart.reduce((s, l) => s + linePrice(l), 0)
    const count = cart.reduce((s, l) => s + l.qty, 0)
    return { route, currency, setCurrency, lang, setLang, langOrigin: START.origin, langHintSeen, dismissLangHint, cart, cartOpen, setCartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved: lastRemoved?.line ?? null, meta, setMeta, linePrice, subtotal, count, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent, searches, rememberSearch, forgetSearches, replaceQuery, visits, bookVisit, cancelVisit, visitRequest, openVisit, closeVisit, askAbout, askDesigns, openAsk, closeAsk, profile, setProfile, nudgeAt, dismissNudge, designs, saveDesign, forgetDesign, designDraft, setDesignDraft }
  }, [route, currency, setCurrency, lang, setLang, langHintSeen, dismissLangHint, cart, cartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved, meta, setMeta, linePrice, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent, searches, rememberSearch, forgetSearches, replaceQuery, visits, bookVisit, cancelVisit, visitRequest, openVisit, closeVisit, askAbout, askDesigns, openAsk, closeAsk, profile, setProfile, nudgeAt, dismissNudge, designs, saveDesign, forgetDesign, designDraft, setDesignDraft])

  // Copy re-renders only when the language or the market changes, not with every cart or route change.
  const locale = useMemo<LocaleValue>(() => ({ lang, locale: localeFor(lang, currency), setLang }), [lang, currency, setLang])

  return (
    <StoreContext.Provider value={value}>
      <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
