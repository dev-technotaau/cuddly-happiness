import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUpRight, Heart, Menu, ShoppingBag, User, X } from 'lucide-react'
import { CATEGORIES, getProductsByCategory } from '../data/catalog'
import { href, useStore } from '../store'

const announcements = [
  'Complimentary insured shipping across Canada & the United States',
  'Every diamond over 0.50 ct accompanied by a GIA report',
  'Private appointments at our Sherbrooke Street salon',
  'Lifetime cleaning & inspection on every piece',
]

export default function Header() {
  const { currency, setCurrency, count, setCartOpen, route, wishlist, user } = useStore()
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
  }, [route])

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

  const open = () => {
    window.clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 140)
  }

  const cat = CATEGORIES[active]
  const featured = getProductsByCategory(cat.slug).slice(0, 2)

  return (
    <header className="sticky top-0 z-50">
      <div className="overflow-hidden bg-[var(--bg-vault)] py-2 text-[var(--gold-champagne)]">
        <div className="animate-marquee">
          {[...announcements, ...announcements].map((a, i) => (
            <span key={i} className="font-spec flex items-center px-10 text-[10px] uppercase tracking-[0.28em]">
              {a}
              <span className="ml-20 text-[var(--gold-vermeil)]">&#10022;</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative border-b border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-12">
          <nav className="hidden items-center gap-9 text-[11px] font-medium uppercase tracking-[0.22em] lg:flex">
            <button onMouseEnter={open} onMouseLeave={scheduleClose} onClick={() => setMegaOpen((o) => !o)} className="py-7 transition-colors hover:text-[var(--gold-vermeil)]" aria-expanded={megaOpen}>
              Collections
            </button>
            <a href={href.category('bridal')} className="transition-colors hover:text-[var(--gold-vermeil)]">Bridal</a>
            <a href={href.category('rentals')} className="transition-colors hover:text-[var(--gold-vermeil)]">Rentals</a>
            <a href={href.atelier} className="transition-colors hover:text-[var(--gold-vermeil)]">Atelier</a>
          </nav>
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} strokeWidth={1.4} />
          </button>

          <a href={href.home} className="text-center leading-none">
            <span className="font-serif-editorial -mr-[0.12em] block whitespace-nowrap text-[17px] uppercase tracking-[0.12em] sm:-mr-[0.16em] sm:text-[22px] sm:tracking-[0.16em] lg:text-[25px]">
              Teresa <em className="text-[var(--gold-vermeil)]">&amp;</em> Sons
            </span>
            <span className="font-spec -mr-[0.28em] mt-1.5 block whitespace-nowrap text-[8px] uppercase tracking-[0.28em] text-[var(--text-taupe)] sm:-mr-[0.4em] sm:text-[9px] sm:tracking-[0.4em]">
              Montréal &middot; Est. 1962
            </span>
          </a>

          <div className="flex items-center justify-end gap-4 lg:gap-7">
            <div className="font-spec hidden border border-[var(--border-hairline)] text-[10px] tracking-[0.15em] sm:flex" role="group" aria-label="Currency">
              {(['CAD', 'USD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 py-1.5 transition-colors ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`}
                >
                  {c === 'CAD' ? 'CA' : 'US'} · {c}
                </button>
              ))}
            </div>
            <a href={href.account} className="relative hidden transition-colors hover:text-[var(--gold-vermeil)] sm:block" aria-label={user ? `Account, ${user.name}` : 'Sign in'}>
              <User size={20} strokeWidth={1.4} />
              {user && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--gold-vermeil)]" />}
            </a>
            <a href={href.wishlist} className="relative transition-colors hover:text-[var(--gold-vermeil)]" aria-label="Wishlist">
              <Heart size={20} strokeWidth={1.4} />
              {wishlist.length > 0 && (
                <span className="font-spec absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--text-espresso)] px-1 text-[9px] text-[var(--bg-travertine)]">
                  {wishlist.length}
                </span>
              )}
            </a>
            <button onClick={() => setCartOpen(true)} className="relative" aria-label="Open bag">
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
                    onMouseEnter={() => setActive(i)}
                    className={`group flex items-baseline gap-5 py-2 transition-colors ${active === i ? 'text-[var(--text-espresso)]' : 'text-[var(--text-linen)]'}`}
                  >
                    <span className="font-spec w-6 text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
                    <span className="font-serif-editorial text-[26px] leading-tight">{c.name}</span>
                    <span className="font-serif-editorial text-sm italic text-[var(--text-linen)] opacity-0 transition-opacity group-hover:opacity-100">{c.french}</span>
                  </a>
                </li>
              ))}
              <li data-mega-item className="mt-4 border-t border-[var(--border-hairline)] pt-4">
                <a href={href.giftcards} onMouseEnter={() => setActive(CATEGORIES.findIndex((c) => c.slug === 'gifts'))} className="group flex items-center gap-5 py-2">
                  <span className="w-6 shrink-0">
                    <span className="block aspect-[1.586] w-6 rounded-[2px] bg-[linear-gradient(135deg,#e8d3a3,#c9a45f_45%,#9c7a3c)]" />
                  </span>
                  <span className="font-serif-editorial text-[26px] leading-tight transition-colors group-hover:text-[var(--gold-vermeil)]">Gift Cards</span>
                  <span className="font-spec text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">From $100 · never expires</span>
                </a>
              </li>
            </ul>
            <div className="col-span-3 flex flex-col justify-between" data-mega-item>
              <div>
                <p className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-vermeil)]">Chapter {cat.eyebrow}</p>
                <p className="font-serif-editorial mt-4 text-3xl leading-snug">{cat.description}</p>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {featured.map((p) => (
                  <li key={p.slug}>
                    <a href={href.product(p.slug)} className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3 hover:text-[var(--gold-vermeil)]">
                      {p.name} <ArrowUpRight size={14} strokeWidth={1.4} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <a href={href.category(cat.slug)} className="group col-span-5 grid grid-cols-5 gap-4" data-mega-item>
              <div className="col-span-3 aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
                <img key={cat.hero} src={cat.hero} alt={cat.name} className="editorial-zoom h-full w-full object-cover" />
              </div>
              <div className="col-span-2 flex flex-col gap-4">
                <div className="aspect-square overflow-hidden bg-[var(--bg-silk)]">
                  <img key={cat.feature} src={cat.feature} alt="" className="editorial-zoom h-full w-full object-cover" />
                </div>
                <span className="mt-auto text-[11px] font-medium uppercase tracking-[0.22em]">
                  Shop {cat.name} <span className="text-[var(--gold-vermeil)]">&rarr;</span>
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
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={22} strokeWidth={1.4} /></button>
          </div>
          <ul className="mt-6">
            {CATEGORIES.map((c) => (
              <li key={c.slug} className="border-b border-[var(--border-hairline)]">
                <a href={href.category(c.slug)} className="flex items-baseline gap-4 py-4">
                  <span className="font-spec w-6 text-[10px] text-[var(--gold-vermeil)]">{c.eyebrow}</span>
                  <span className="font-serif-editorial text-3xl">{c.name}</span>
                </a>
              </li>
            ))}
            <li><a href={href.atelier} className="font-serif-editorial block py-4 text-3xl italic">The Atelier</a></li>
            <li><a href={href.giftcards} className="font-serif-editorial block py-4 text-3xl italic">Gift Cards</a></li>
            <li><a href={href.account} className="font-serif-editorial block py-4 text-3xl italic">{user ? 'My Account' : 'Sign In'}</a></li>
            <li><a href={href.wishlist} className="font-serif-editorial block py-4 text-3xl italic">Wishlist ({wishlist.length})</a></li>
          </ul>
          {/* Phones: the header has no room for the currency switch, so it lives here */}
          <div className="mt-10 flex items-center justify-between border-t border-[var(--border-hairline)] pt-6 sm:hidden">
            <span className="font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--text-taupe)]">Shopping in</span>
            <div className="font-spec flex border border-[var(--border-hairline)] text-[10px] tracking-[0.15em]" role="group" aria-label="Currency">
              {(['CAD', 'USD'] as const).map((c) => (
                <button key={c} onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`px-3.5 py-2 transition-colors ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)]'}`}>
                  {c === 'CAD' ? 'CA' : 'US'} · {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
