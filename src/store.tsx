import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { convert, type GiftCardLine } from './data/giftcards'
import { getProduct, personalizationPrice, priceFor, type Currency, type Metal, type Personalization, type RentalBooking } from './data/catalog'

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

function parseHash(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
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

export const href = {
  home: '#/',
  category: (slug: string) => `#/c/${slug}`,
  product: (slug: string) => `#/p/${slug}`,
  atelier: '#/atelier',
  checkout: '#/checkout',
  cart: '#/cart',
  wishlist: '#/wishlist',
  account: '#/account',
  giftcards: '#/gift-cards',
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
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('tns-currency') as Currency) || 'CAD',
  )
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
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => localStorage.setItem('tns-cart', JSON.stringify(cart)), [cart])

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('tns-currency', c)
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
    return { route, currency, setCurrency, cart, cartOpen, setCartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved: lastRemoved?.line ?? null, meta, setMeta, linePrice, subtotal, count, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent }
  }, [route, currency, setCurrency, cart, cartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved, meta, setMeta, linePrice, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
