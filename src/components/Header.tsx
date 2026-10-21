import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight, Heart, Menu, ShoppingBag, User, X } from 'lucide-react'
import { CATEGORIES, formatPrice, getProduct, getProductsByCategory } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { href, useStore, type Route } from '../store'
import Marquee from './Marquee'
import LanguageToggle from './locale/LanguageToggle'
import LocaleMenu from './locale/LocaleMenu'
import Burger from './menu/Burger'
import type { MenuFocus } from './menu/SiteMenu'

// The desktop menu is a separate chunk. Header mounts it, closed, ahead of the first click (see prepareMenu).
const SiteMenu = lazy(() => import('./menu/SiteMenu'))

const COPY = bilingual(
  {
    announcements: [
      'Complimentary insured shipping across Canada & the United States',
      'Every diamond over 0.50 ct accompanied by a GIA report',
      'Private appointments at our Sherbrooke Street salon',
      'Lifetime cleaning & inspection on every piece',
    ],
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    shop: 'Shop',
    bridal: 'Bridal',
    rentals: 'Rentals',
    atelier: 'Atelier',
    since: 'Montréal · Est. 1962',
    account: (name: string) => `Account, ${name}`,
    signIn: 'Sign in',
    wishlist: 'Wishlist',
    openBag: 'Open bag',
    giftCards: 'Gift Cards',
    giftCardsFrom: (amount: string) => `From ${amount} · never expires`,
    chapter: (n: string) => `Chapter ${n}`,
    shopChapter: (name: string) => `Shop ${name}`,
    theAtelier: 'The Atelier',
    myAccount: 'My Account',
    signInTitle: 'Sign In',
    wishlistCount: (n: number) => `Wishlist (${n})`,
    language: 'Language',
    shoppingIn: 'Shopping in',
    currency: 'Currency',
  },
  {
    announcements: [
      'Livraison assurée offerte partout au Canada et aux États-Unis',
      'Chaque diamant de plus de 0,50 ct est accompagné d’un rapport GIA',
      'Rendez-vous privés à notre salon de la rue Sherbrooke',
      'Nettoyage et inspection à vie pour chaque pièce',
    ],
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    shop: 'Boutique',
    bridal: 'Mariage',
    rentals: 'Location',
    atelier: 'Atelier',
    since: 'Montréal · Depuis 1962',
    account: (name) => `Compte, ${name}`,
    signIn: 'Se connecter',
    wishlist: 'Liste de souhaits',
    openBag: 'Ouvrir le panier',
    giftCards: 'Cartes-cadeaux',
    giftCardsFrom: (amount) => `Dès ${amount} · sans expiration`,
    chapter: (n) => `Chapitre ${n}`,
    shopChapter: () => 'Voir le chapitre',
    theAtelier: 'L’Atelier',
    myAccount: 'Mon compte',
    signInTitle: 'Se connecter',
    wishlistCount: (n) => `Liste de souhaits (${n})`,
    language: 'Langue',
    shoppingIn: 'Marché',
    currency: 'Devise',
  },
)

type Section = 'shop' | 'bridal' | 'rentals' | 'atelier'

/** Where a route sits in the bar. Bridal and Rentals have their own links; every other chapter, piece and the gift
 *  cards sit under Shop. `chapter` is the category on screen, which the menus mark too. */
function locate(route: Route): { section: Section | null; chapter: string | null } {
  const chapter = route.name === 'category' ? route.slug : route.name === 'product' ? getProduct(route.slug)?.category ?? null : null
  if (route.name === 'atelier') return { section: 'atelier', chapter }
  if (chapter === 'bridal' || chapter === 'rentals') return { section: chapter, chapter }
  return { section: chapter || route.name === 'giftcards' ? 'shop' : null, chapter }
}

// The menus' "you are here" dot.
const dot = 'h-1.5 w-1.5 shrink-0 self-center rounded-full bg-[var(--gold-vermeil)]'

export default function Header() {
  const { currency, setCurrency, count, setCartOpen, route, wishlist, user } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const [menuFocus, setMenuFocus] = useState<MenuFocus>('pointer')
  const [menuCovered, setMenuCovered] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const menuOpenRef = useRef(false)

  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
    setMenuOpen(false)
  }, [route])

  useEffect(() => {
    menuOpenRef.current = menuOpen
  }, [menuOpen])

  const openMenu = (focus: MenuFocus) => {
    setMegaOpen(false)
    setMenuFocus(focus)
    setMenuMounted(true)
    setMenuOpen(true)
  }
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  // A lazy component holds back its first reveal, so mount the menu closed ahead of time: when the pointer or focus
  // reaches its button, and on desktop once the page has settled. The first opening is then instant.
  const prepareMenu = () => setMenuMounted(true)
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    const t = window.setTimeout(() => setMenuMounted(true), 2500)
    return () => window.clearTimeout(t)
  }, [])

  // "/" or ⌘K / Ctrl+K opens the menu straight into its search, on desktop, unless the visitor is typing or another dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key ?? ''
      if (menuOpenRef.current) return
      const slash = key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey
      const palette = key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey
      if (!slash && !palette) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (!window.matchMedia('(min-width: 1024px)').matches) return
      // Another overlay (bag, share sheet, viewer…) is open: leave its keys alone.
      if ([...document.querySelectorAll('[role="dialog"]')].some((d) => d.id !== 'site-menu' && !d.closest('[inert]') && d.getClientRects().length > 0)) return
      e.preventDefault()
      openMenu('search')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    gsap.to(el, {
      clipPath: megaOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
      duration: 0.7,
      ease: 'expo.out',
    })
    if (megaOpen) {
      gsap.fromTo(el.querySelectorAll('[data-mega-item]'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.6, ease: 'expo.out', delay: 0.08 })
    }
  }, [megaOpen])

  const { section, chapter } = locate(route)
  // aria-current: "page" on the page itself, "true" on the section a page belongs to (a bridal piece under Bridal).
  const current = (slug: string) => (chapter === slug ? (route.name === 'category' ? 'page' : 'true') : undefined)

  // One gold hairline glides under the hovered or focused link, stays under Shop while its mega menu is open, and
  // rests under the visitor's section.
  const navRef = useRef<HTMLElement>(null)
  const [hover, setHover] = useState<Section | null>(null)
  const [line, setLine] = useState({ x: 0, w: 0, on: false })
  const lineAt = hover ?? (megaOpen ? 'shop' : section)
  useLayoutEffect(() => {
    const measure = () => {
      const el = lineAt ? navRef.current?.querySelector<HTMLElement>(`[data-nav="${lineAt}"]`) : null
      if (el && el.offsetWidth) setLine({ x: el.offsetLeft, w: el.offsetWidth, on: true })
      else setLine((l) => ({ ...l, on: false }))
    }
    measure()
    // Positions shift when the fonts arrive and when the bar reflows.
    void document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lineAt])
  const point = (s: Section) => ({ onPointerEnter: () => setHover(s), onFocus: () => setHover(s), onBlur: () => setHover(null) })
  // The mega menu opens on the visitor's own chapter (or the gift cards), not always on the first.
  const home = Math.max(0, CATEGORIES.findIndex((c) => c.slug === (route.name === 'giftcards' ? 'gifts' : chapter)))
  const open = () => {
    window.clearTimeout(closeTimer.current)
    if (!megaOpen) setActive(home)
    setMegaOpen(true)
  }
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 140)
  }

  const cat = CATEGORIES[active]
  const featured = getProductsByCategory(cat.slug).slice(0, 2)

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[var(--bg-vault)] py-2 text-[var(--gold-champagne)]">
        <Marquee speed={44} className="[mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
          {t.announcements.map((a) => (
            <span key={a} className="font-spec flex items-center px-10 text-[10px] uppercase tracking-[0.28em]">
              {a}
              <span aria-hidden="true" className="ml-20 text-[var(--gold-vermeil)]">&#10022;</span>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="relative border-b border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-12">
          <nav ref={navRef} onPointerLeave={() => setHover(null)} className="relative hidden items-center gap-9 text-[11px] font-medium uppercase tracking-[0.22em] lg:flex">
            <span aria-hidden="true" className={`pointer-events-none absolute left-0 top-[calc(50%+12px)] h-px bg-[var(--gold-vermeil)] transition-[translate,width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${line.on ? 'opacity-100' : 'opacity-0'}`} style={{ translate: `${line.x}px 0`, width: line.w }} />
            {/* The full menu: everything in this bar and, as pages arrive, what no longer fits in it */}
            <div className="flex items-center gap-6">
              <button ref={menuBtn} type="button" onClick={(e) => openMenu(e.detail === 0 ? 'keyboard' : 'pointer')} onPointerEnter={prepareMenu} onFocus={prepareMenu} aria-label={t.openMenu} aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="site-menu" className="group -ml-[9px] flex h-10 w-10 items-center justify-center transition-colors hover:text-[var(--gold-vermeil)] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-vermeil)]">
                {/* Hidden while the menu is open (its cross stands in for it); SiteMenu says when to bring it back */}
                <span className={`block ${menuCovered ? 'opacity-0' : ''}`}>
                  <Burger />
                </span>
              </button>
              <span aria-hidden="true" className="h-4 w-px bg-[var(--border-hairline)]" />
            </div>
            <button onMouseEnter={open} onMouseLeave={scheduleClose} {...point('shop')} onClick={() => (megaOpen ? setMegaOpen(false) : open())} className="py-7 uppercase transition-colors hover:text-[var(--gold-vermeil)]" aria-expanded={megaOpen}>
              {/* "Shop", not "Collections": in jewellery a collection is a curated story that can span categories (planned, see todo). */}
              <span data-nav="shop">{t.shop}</span>
            </button>
            <a href={href.category('bridal')} data-nav="bridal" {...point('bridal')} aria-current={current('bridal')} className="transition-colors hover:text-[var(--gold-vermeil)]">{t.bridal}</a>
            <a href={href.category('rentals')} data-nav="rentals" {...point('rentals')} aria-current={current('rentals')} className="transition-colors hover:text-[var(--gold-vermeil)]">{t.rentals}</a>
            <a href={href.atelier} data-nav="atelier" {...point('atelier')} aria-current={route.name === 'atelier' ? 'page' : undefined} className="transition-colors hover:text-[var(--gold-vermeil)]">{t.atelier}</a>
          </nav>
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t.openMenu}>
            <Menu size={20} strokeWidth={1.4} />
          </button>

          <a href={href.home} className="text-center leading-none">
            <span className="font-serif-editorial -mr-[0.12em] block whitespace-nowrap text-[17px] uppercase tracking-[0.12em] sm:-mr-[0.16em] sm:text-[22px] sm:tracking-[0.16em] lg:text-[25px]">
              Teresa <em className="text-[var(--gold-vermeil)]">&amp;</em> Sons
            </span>
            <span className="font-spec -mr-[0.28em] mt-1.5 block whitespace-nowrap text-[8px] uppercase tracking-[0.28em] text-[var(--text-taupe)] sm:-mr-[0.4em] sm:text-[9px] sm:tracking-[0.4em]">
              {t.since}
            </span>
          </a>

          <div className="flex items-center justify-end gap-4 lg:gap-7">
            {/* Language and market in one control; on phones they live in the menu */}
            <LocaleMenu className="hidden sm:block" />
            <a href={href.account} className="relative hidden transition-colors hover:text-[var(--gold-vermeil)] sm:block" aria-label={user ? t.account(user.name) : t.signIn}>
              <User size={20} strokeWidth={1.4} />
              {user && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--gold-vermeil)]" />}
            </a>
            <a href={href.wishlist} className="relative transition-colors hover:text-[var(--gold-vermeil)]" aria-label={t.wishlist}>
              <Heart size={20} strokeWidth={1.4} />
              {wishlist.length > 0 && (
                <span className="font-spec absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--text-espresso)] px-1 text-[9px] text-[var(--bg-travertine)]">
                  {wishlist.length}
                </span>
              )}
            </a>
            <button onClick={() => setCartOpen(true)} className="relative" aria-label={t.openBag}>
              <ShoppingBag size={20} strokeWidth={1.4} />
              {count > 0 && (
                <span className="font-spec absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold-vermeil)] px-1 text-[9px] text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        <div
          ref={panelRef}
          onMouseEnter={open}
          onMouseLeave={scheduleClose}
          style={{ clipPath: 'inset(0 0 100% 0)' }}
          className={`absolute inset-x-0 top-full hidden border-b border-[var(--border-hairline)] bg-[var(--bg-travertine)] lg:block ${megaOpen ? '' : 'pointer-events-none'}`}
        >
          <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-10 px-12 py-12">
            <ul className="col-span-4 border-r border-[var(--border-hairline)] pr-10">
              {CATEGORIES.map((c, i) => (
                <li key={c.slug} data-mega-item>
                  <a
                    href={href.category(c.slug)}
                    aria-current={current(c.slug)}
                    onMouseEnter={() => setActive(i)}
                    className={`group flex items-baseline gap-5 py-2 transition-colors ${active === i ? 'text-[var(--text-espresso)]' : 'text-[var(--text-linen)]'}`}
                  >
                    <span className="font-spec w-6 text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
                    <span className="font-serif-editorial text-[26px] leading-tight">{catalog.category(c).name}</span>
                    {c.slug === chapter && <span aria-hidden="true" className={dot} />}
                    <span className="font-serif-editorial text-sm italic text-[var(--text-linen)] opacity-0 transition-opacity group-hover:opacity-100">{catalog.category(c).accent}</span>
                  </a>
                </li>
              ))}
              <li data-mega-item className="mt-4 border-t border-[var(--border-hairline)] pt-4">
                <a href={href.giftcards} aria-current={route.name === 'giftcards' ? 'page' : undefined} onMouseEnter={() => setActive(CATEGORIES.findIndex((c) => c.slug === 'gifts'))} className="group flex items-center gap-5 py-2">
                  <span className="w-6 shrink-0">
                    <span className="block aspect-[1.586] w-6 rounded-[2px] bg-[linear-gradient(135deg,#e8d3a3,#c9a45f_45%,#9c7a3c)]" />
                  </span>
                  <span className="font-serif-editorial text-[26px] leading-tight transition-colors group-hover:text-[var(--gold-vermeil)]">{t.giftCards}</span>
                  {route.name === 'giftcards' && <span aria-hidden="true" className={dot} />}
                  <span className="font-spec text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">{t.giftCardsFrom(formatPrice(100, currency))}</span>
                </a>
              </li>
            </ul>
            <div className="col-span-3 flex flex-col justify-between" data-mega-item>
              <div>
                <p className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-vermeil)]">{t.chapter(cat.eyebrow)}</p>
                <p className="font-serif-editorial mt-4 text-3xl leading-snug">{catalog.category(cat).description}</p>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {featured.map((p) => (
                  <li key={p.slug}>
                    <a href={href.product(p.slug)} className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 hover:text-[var(--gold-vermeil)]">
                      {catalog.name(p)} <ArrowUpRight size={14} strokeWidth={1.4} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <a href={href.category(cat.slug)} className="group col-span-5 grid grid-cols-5 gap-4" data-mega-item>
              <div className="col-span-3 aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
                <img key={cat.hero} src={cat.hero} alt={catalog.category(cat).name} className="editorial-zoom h-full w-full object-cover" />
              </div>
              <div className="col-span-2 flex flex-col gap-4">
                <div className="aspect-square overflow-hidden bg-[var(--bg-silk)]">
                  <img key={cat.feature} src={cat.feature} alt="" className="editorial-zoom h-full w-full object-cover" />
                </div>
                <span className="mt-auto text-[11px] font-medium uppercase tracking-[0.22em]">
                  {t.shopChapter(catalog.category(cat).name)} <span className="text-[var(--gold-vermeil)]">&rarr;</span>
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[var(--bg-travertine)] px-6 py-6 lg:hidden" data-lenis-prevent>
          <div className="flex justify-end">
            <button onClick={() => setMobileOpen(false)} aria-label={t.closeMenu}><X size={22} strokeWidth={1.4} /></button>
          </div>
          <ul className="mt-6">
            {CATEGORIES.map((c) => (
              <li key={c.slug} className="border-b border-[var(--border-hairline)]">
                <a href={href.category(c.slug)} aria-current={current(c.slug)} className="flex items-baseline gap-4 py-4">
                  <span className="font-spec w-6 text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
                  <span className="font-serif-editorial text-3xl">{catalog.category(c).name}</span>
                  {c.slug === chapter && <span aria-hidden="true" className={dot} />}
                </a>
              </li>
            ))}
            {[
              { to: href.atelier, on: route.name === 'atelier', label: t.theAtelier },
              { to: href.giftcards, on: route.name === 'giftcards', label: t.giftCards },
              { to: href.account, on: route.name === 'account', label: user ? t.myAccount : t.signInTitle },
              { to: href.wishlist, on: route.name === 'wishlist', label: t.wishlistCount(wishlist.length) },
            ].map((l) => (
              <li key={l.to}>
                <a href={l.to} aria-current={l.on ? 'page' : undefined} className="font-serif-editorial flex items-center gap-4 py-4 text-3xl italic">
                  {l.label}
                  {l.on && <span aria-hidden="true" className={dot} />}
                </a>
              </li>
            ))}
          </ul>
          {/* Phones: the header has no room for the language and market control, so they live here */}
          <div className="mt-10 flex items-center justify-between border-t border-[var(--border-hairline)] pt-6 sm:hidden">
            <span className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--text-taupe)]">{t.language}</span>
            <LanguageToggle full className="[&_button]:px-3.5 [&_button]:py-2" />
          </div>
          <div className="mt-4 flex items-center justify-between sm:hidden">
            <span className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--text-taupe)]">{t.shoppingIn}</span>
            <div className="font-spec flex border border-[var(--border-hairline)] text-[10px] tracking-[0.15em]" role="group" aria-label={t.currency}>
              {(['CAD', 'USD'] as const).map((c) => (
                <button key={c} onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`px-3.5 py-2 transition-colors ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)]'}`}>
                  {c === 'CAD' ? 'CA' : 'US'} · {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop menu (portalled to <body>) */}
      {menuMounted && (
        <Suspense fallback={null}>
          <SiteMenu open={menuOpen} focus={menuFocus} onClose={closeMenu} trigger={menuBtn} onCover={setMenuCovered} />
        </Suspense>
      )}
    </header>
  )
}
