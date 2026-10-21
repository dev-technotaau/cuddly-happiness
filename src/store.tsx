import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { convert, type GiftCardLine } from './data/giftcards'
import { getProduct, personalizationPrice, priceFor, type Currency, type Metal, type Personalization, type RentalBooking } from './data/catalog'
import { browserLang, localeFor, LocaleContext, runSwitch, setActiveLocale, type Lang, type LocaleValue } from './i18n'

export type Route =
  | { name: 'home' }
  | { name: 'category'; slug: string }
  | { name: 'product'; slug: string }
  | { name: 'atelier' }
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

/** The route for a hash: the address bar's by default, or a link's `href` (page transitions read where a link leads). */
export function parseHash(hash = window.location.hash): Route {
  const parts = splitHash(hash).path.split('/').filter(Boolean)
  if (parts[0] === 'c' && parts[1]) return { name: 'category', slug: parts[1] }
  if (parts[0] === 'gift-cards' || (parts[0] === 'p' && parts[1] === 'gift-card')) return { name: 'giftcards' }
  if (parts[0] === 'p' && parts[1]) return { name: 'product', slug: parts[1] }
  if (parts[0] === 'atelier') return { name: 'atelier' }
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
  category: (slug: string) => at(`/c/${slug}`),
  product: (slug: string) => at(`/p/${slug}`),
  get atelier() { return at('/atelier') },
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

/** Identity of a configured piece; identical configurations stack in one line. */
export const lineKey = (line: Omit<CartLine, 'key' | 'qty'>) =>
  [line.slug, line.metal, line.rental, line.engraving, line.size, JSON.stringify(line.booking ?? ''), JSON.stringify(line.personalization ?? ''), JSON.stringify(line.giftCard ?? '')].join('|')

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
  signIn: (user: Account) => void
  signOut: () => void
  linePrice: (line: CartLine) => number
  subtotal: number
  count: number
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
      return JSON.parse(localStorage.getItem('tns-cart') || '[]')
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
      if (!product) return 0
      if (line.rental && product.rental) return product.rental[line.rental][currency] * line.qty
      return (priceFor(product, currency, line.metal) + personalizationPrice(product, line.personalization, currency)) * line.qty
    },
    [currency],
  )

  const value = useMemo<StoreValue>(() => {
    const subtotal = cart.reduce((s, l) => s + linePrice(l), 0)
    const count = cart.reduce((s, l) => s + l.qty, 0)
    return { route, currency, setCurrency, lang, setLang, langOrigin: START.origin, langHintSeen, dismissLangHint, cart, cartOpen, setCartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved: lastRemoved?.line ?? null, meta, setMeta, linePrice, subtotal, count, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent }
  }, [route, currency, setCurrency, lang, setLang, langHintSeen, dismissLangHint, cart, cartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved, meta, setMeta, linePrice, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent])

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
