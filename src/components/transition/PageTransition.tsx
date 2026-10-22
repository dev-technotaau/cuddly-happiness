import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getCategory, getProduct, signatureFor } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, pick } from '../../i18n'
import { catalogFor } from '../../i18n/catalog'
import { accentOf, plain } from '../../i18n/rich'
import { clearStage, coverStage } from '../../lib/stage'
import { bareHash, parseHash, useStore, type Route } from '../../store'
import Ampersand from '../brand/Ampersand'
import { getLenis } from '../SmoothScroll'
import { fade, pickTransition, type Morph, type TransitionContext } from './transitions'

/** What the curtain says about the destination. `accent` is the word set in gold italic. */
interface Label {
  eyebrow: string
  title: string
  accent: string
  numeral?: string
}

// The cards, in both languages: [eyebrow, title], the title's gold word as <em>. English keeps its French eyebrows.
type Pair = [eyebrow: string, title: string]

const CARDS = bilingual(
  {
    chapter: (numeral: string, accent: string) => `Chapter ${numeral} · ${accent}`,
    chapters: 'The <em>Chapters</em>',
    vault: 'The <em>Vault</em>',
    atelier: ['L’Atelier', 'The <em>Atelier</em>'] as Pair,
    designer: ['Sur mesure', 'Your <em>ring</em>'] as Pair,
    giftcards: ['Carte-cadeau', 'Gift <em>Cards</em>'] as Pair,
    wishlist: ['Liste de souhaits', 'Your <em>Wishlist</em>'] as Pair,
    account: ['Mon compte', 'Your <em>Account</em>'] as Pair,
    cart: ['Votre sélection', 'Your <em>Bag</em>'] as Pair,
    checkout: ['Teresa & Sons', '<em>Checkout</em>'] as Pair,
    home: ['Montréal · Est. 1962', 'Teresa <em>&</em> Sons'] as Pair,
    shop: ['Nine chapters', 'Every <em>piece</em>'] as Pair,
    search: (q: string): Pair => ['Search', `“<em>${q}</em>”`],
    signature: (numeral: string) => `Signature ${numeral}`,
  },
  {
    chapter: (numeral) => `Chapitre ${numeral}`,
    chapters: 'Les <em>chapitres</em>',
    vault: 'Le <em>coffre</em>',
    atelier: ['Montréal · Depuis 1962', 'L’<em>Atelier</em>'],
    designer: ['Créée avec vous', 'Votre <em>bague</em>'],
    giftcards: ['Le plaisir de choisir', 'Cartes-<em>cadeaux</em>'],
    wishlist: ['Vos coups de cœur', 'Liste de <em>souhaits</em>'],
    account: ['Espace client', 'Votre <em>compte</em>'],
    cart: ['La sélection', 'Votre <em>panier</em>'],
    checkout: ['Teresa & Sons', '<em>Paiement</em>'],
    home: ['Montréal · Depuis 1962', 'Teresa <em>&</em> Sons'],
    shop: ['Neuf chapitres', 'Toutes les <em>pièces</em>'],
    search: (q) => ['Recherche', `« <em>${q}</em> »`],
    signature: (numeral) => `Signature ${numeral}`,
  },
)

const last = (title: string) => title.split(' ').pop() ?? title
const card = (eyebrow: string, title: string, numeral?: string): Label => ({ eyebrow, title: plain(title), accent: accentOf(title), numeral })

/** The card for a route, in the language on screen. */
function labelFor(route: Route): Label {
  const t = pick(CARDS)
  const catalog = catalogFor()
  switch (route.name) {
    case 'category': {
      const c = getCategory(route.slug)
      if (!c) return card('Teresa & Sons', t.chapters)
      // A signature's own page (engagement rings, tennis necklaces) is named for it, not for its chapter.
      const s = signatureFor(c.slug, route.query.type)
      if (s) {
        const sig = pick(HOUSE).signatures[s.id]
        return card(t.signature(sig.numeral), sig.title, sig.numeral)
      }
      const copy = catalog.category(c)
      return { eyebrow: t.chapter(c.eyebrow, copy.accent), title: copy.name, accent: last(copy.name), numeral: c.eyebrow }
    }
    // A search names the search (the header's "See all").
    case 'shop': return card(...(route.query.q ? t.search(plain(route.query.q)) : t.shop))
    case 'product': {
      const p = getProduct(route.slug)
      if (!p) return card('Teresa & Sons', t.vault)
      const copy = catalog.product(p)
      return { eyebrow: `${copy.collection} · ${catalog.category(p.category).name}`, title: copy.name, accent: last(copy.name) }
    }
    case 'atelier': return card(...t.atelier)
    case 'designer': return card(...t.designer)
    case 'giftcards': return card(...t.giftcards)
    case 'wishlist': return card(...t.wishlist)
    case 'account': return card(...t.account)
    case 'cart': return card(...t.cart)
    case 'checkout': return card(...t.checkout)
    case 'home': return card(...t.home)
    default: {
      // A new route needs its own card: this stops compiling until it has one.
      const unlabelled: never = route
      return unlabelled
    }
  }
}

// Addresses are compared without their language prefix, so a switch of language never reads as a move.
const here = () => bareHash()
const normal = (href: string) => bareHash(href)

// The link that set off the next navigation, when it was a click (keys and history moves have none).
let sent: { hash: string; at: number; morph: Morph | null } | null = null
const prefetched = new Set<string>()

/** The image the visitor sees inside a product link: the topmost one shown, so a card's hover photo counts. */
function morphFrom(a: HTMLAnchorElement): Morph | null {
  const to = parseHash(a.getAttribute('href') ?? '')
  if (to.name !== 'product') return null
  // A link laid over its picture (the home hero's piece) names a wider scope with data-morph-scope.
  const scope = a.querySelector('img') ? a : a.closest('[data-morph-scope]')
  if (!scope) return null
  let best: HTMLImageElement | null = null
  let top = -Infinity
  scope.querySelectorAll('img').forEach((img) => {
    const s = getComputedStyle(img)
    const r = img.getBoundingClientRect()
    if (Number(s.opacity) < 0.5 || s.visibility === 'hidden' || s.clipPath.startsWith('inset(100%')) return
    if (r.width < 24 || r.height < 24 || r.bottom < 0 || r.top > window.innerHeight) return
    const z = Number.parseInt(s.zIndex, 10) || 0
    if (z >= top) {
      top = z
      best = img
    }
  })
  const img = best as HTMLImageElement | null
  // Only a photograph the visitor can see is worth flying; an unloaded one falls back to the curtain.
  if (!img || !img.complete || !img.naturalWidth) return null
  return { src: img.currentSrc || img.src, rect: img.getBoundingClientRect(), slug: to.slug }
}

/** While the pointer rests on a link, fetch the photograph its page opens on. */
function prefetch(href: string) {
  const to = parseHash(href)
  const src = to.name === 'product' ? getProduct(to.slug)?.images[0] : to.name === 'category' ? getCategory(to.slug)?.hero : undefined
  if (!src || prefetched.has(src)) return
  prefetched.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

/** Waits for the new page's first-screen images, up to `cap` ms, so the reveal never shows a blank. */
function settle(cap: number) {
  const pending = Array.from(document.querySelectorAll<HTMLImageElement>('main img')).filter((img) => {
    const r = img.getBoundingClientRect()
    return !img.complete && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
  })
  if (!pending.length) return Promise.resolve()
  return Promise.race([Promise.all(pending.map((img) => img.decode().catch(() => undefined))), new Promise((r) => window.setTimeout(r, cap))])
}

/** Barba-style page transitions for the hash router. The old page leaves under cover (a curtain, a chapter turn, an
 *  image morph or a fade, chosen by the rules in transitions.ts), the new page swaps in unseen, then enters. Moves
 *  back run the other way and return to where the visitor was; fast browsing gets shorter transitions; prefetching on
 *  hover and a brief wait for images mean the reveal is never blank. */
export default function PageTransition({ children }: { children: (route: Route) => ReactNode }) {
  const { route } = useStore()
  const [shown, setShown] = useState(route)
  const [label, setLabel] = useState<Label | null>(null)
  const latest = useRef(route)
  const current = useRef({ route, hash: here() })
  const busy = useRef(false)
  const visits = useRef([here()])
  const scrolls = useRef(new Map<string, number>())
  const lastEnd = useRef(0)
  const curtain = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const seam = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const clone = useRef<HTMLImageElement>(null)
  const live = useRef<HTMLParagraphElement>(null)

  const navigate = async () => {
    const page = document.querySelector<HTMLElement>('main')
    const els = { curtain: curtain.current, card: card.current, seam: seam.current, veil: veil.current, clone: clone.current }
    if (!page || !els.curtain || !els.card || !els.seam || !els.veil || !els.clone) {
      setShown(latest.current)
      return
    }
    busy.current = true
    const from = current.current
    const to = latest.current
    const hash = here()
    // Back: the address is the one before this page in the visit.
    const stack = visits.current
    const back = stack.length > 1 && stack[stack.length - 2] === hash
    if (back) stack.pop()
    else stack.push(hash)
    scrolls.current.set(from.hash, window.scrollY)
    const click = sent && sent.hash === hash && performance.now() - sent.at < 1200 ? sent : null
    sent = null
    let cleared = false
    const ctx: TransitionContext = {
      from: from.route,
      to,
      back,
      quick: performance.now() - lastEnd.current < 1500,
      morph: click?.morph ?? null,
      stage: { curtain: els.curtain, card: els.card, seam: els.seam, veil: els.veil, clone: els.clone, page },
      clear: () => {
        if (cleared) return
        cleared = true
        clearStage()
      },
    }
    const transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? fade : pickTransition(ctx)
    // A hook for styles and tests: which transition is running, if any.
    document.documentElement.dataset.transition = transition.name
    coverStage()
    getLenis()?.stop()
    // Leave the effect before rendering synchronously.
    await Promise.resolve()
    flushSync(() => setLabel(labelFor(to)))
    await transition.leave(ctx)

    // Swap to wherever the visitor is now: they may have moved on again during the leave.
    const next = latest.current
    flushSync(() => setShown(next))
    current.current = { route: next, hash: here() }
    // Native scroll, not Lenis: after a no-op scrollTo Lenis skips the next native scroll event and keeps a stale
    // position, so it could think it is already there. lenis.start() below re-reads the real position.
    window.scrollTo(0, back ? scrolls.current.get(here()) ?? 0 : 0)
    ScrollTrigger.refresh()
    await settle(ctx.quick ? 250 : 600)
    await transition.enter(ctx)
    ctx.clear()
    getLenis()?.start()
    ScrollTrigger.refresh()
    lastEnd.current = performance.now()

    // Orientation for keyboard and screen-reader visitors: focus the new page and say where they are. The title follows
    // the address, so announce it only when the page shown is the latest one (a queued move announces itself).
    if (!document.querySelector('[aria-modal="true"]:not([inert])')) page.focus({ preventScroll: true })
    if (live.current && latest.current === current.current.route) live.current.textContent = document.title
    delete document.documentElement.dataset.transition
    busy.current = false
    if (latest.current !== current.current.route) void navigate()
  }

  useEffect(() => {
    latest.current = route
    if (busy.current || route === current.current.route) return
    void navigate()
    // navigate reads everything it needs from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  // A visit opens at the top. Clicks are noted (for the morph and the back-link check); hovers prefetch.
  useEffect(() => {
    window.scrollTo(0, 0)
    const linkOf = (e: Event) => (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]') ?? null
    const onClick = (e: MouseEvent) => {
      const a = linkOf(e)
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      sent = { hash: normal(a.getAttribute('href') ?? ''), at: performance.now(), morph: morphFrom(a) }
    }
    const onOver = (e: PointerEvent) => {
      const a = linkOf(e)
      if (a) prefetch(a.getAttribute('href') ?? '')
    }
    // A link to the page already on screen changes nothing, so it glides back to the top instead (once the link's own
    // handlers have run and not cancelled it).
    const onSame = (e: MouseEvent) => {
      const a = linkOf(e)
      if (!a || e.defaultPrevented || busy.current || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (normal(a.getAttribute('href') ?? '') !== here()) return
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(0)
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('click', onSame)
    document.addEventListener('pointerover', onOver, { passive: true })
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('click', onSame)
      document.removeEventListener('pointerover', onOver)
    }
  }, [])

  // A page rewrote its options in the address (the store's replaceQuery): this is still the same page, now at the new
  // address, so Back returns here with those options and its scroll position.
  useEffect(() => {
    const onAddress = () => {
      const stack = visits.current
      if (stack[stack.length - 1] === current.current.hash) stack[stack.length - 1] = here()
      current.current = { ...current.current, hash: here() }
    }
    window.addEventListener('tns:address', onAddress)
    return () => window.removeEventListener('tns:address', onAddress)
  }, [])

  const at = label ? label.title.lastIndexOf(label.accent) : -1
  // The title with its one gold italic word; each card colours the word for its own ground.
  const title = label && at >= 0 ? (
    <>
      {label.title.slice(0, at)}
      <em>{label.accent}</em>
      {label.title.slice(at + label.accent.length)}
    </>
  ) : (
    label?.title
  )
  return (
    <>
      {children(shown)}
      {createPortal(
        <div aria-hidden="true">
          <div ref={veil} className="invisible fixed inset-0 z-[125] flex items-center justify-center bg-[var(--bg-travertine)] px-6 text-center">
            {/* The quiet transitions (checkout, reduced motion) still say where they go */}
            <div data-veil-card className="invisible flex flex-col items-center">
              <Ampersand className="h-6 w-auto" />
              <p className="font-spec mt-5 text-[10px] uppercase tracking-[0.34em] text-[var(--text-taupe)]">{label?.eyebrow}</p>
              <p className="font-serif-editorial mt-3 text-[clamp(28px,3vw,40px)] font-light leading-tight text-[var(--text-espresso)] [&_em]:text-[var(--gold-vermeil)]">{title}</p>
            </div>
          </div>
          <div ref={curtain} className="invisible fixed inset-0 z-[125] flex items-center justify-center overflow-hidden bg-[var(--bg-vault)] px-6 text-center text-[var(--bg-travertine)]">
            <div ref={card} className="invisible relative flex flex-col items-center">
              {label?.numeral && <span className="font-serif-editorial pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(200px,30vw,420px)] font-light italic leading-none text-white/[0.045]">{label.numeral}</span>}
              <span data-card-fade className="relative block">
                <Ampersand className="h-7 w-auto" />
              </span>
              <p data-card-fade className="font-spec relative mt-6 text-[10px] uppercase tracking-[0.34em] text-[var(--gold-champagne)]">{label?.eyebrow}</p>
              <p className="font-serif-editorial relative -mb-[0.12em] mt-5 max-w-[min(90vw,1100px)] overflow-hidden pb-[0.12em] text-[clamp(44px,6.5vw,104px)] font-light leading-[1.04] tracking-[-0.015em] [&_em]:text-[var(--gold-champagne)]">
                <span data-card-line className="block">
                  {title}
                </span>
              </p>
              <span data-card-rule className="relative mt-9 block h-px w-24 origin-center bg-[var(--gold-champagne)]/60" />
            </div>
          </div>
          <div ref={seam} className="invisible fixed left-0 top-0 z-[126] bg-[var(--gold-champagne)]" />
          <img ref={clone} alt="" className="pointer-events-none fixed z-[127] hidden object-cover" />
        </div>,
        document.body,
      )}
      <p ref={live} aria-live="polite" className="sr-only" />
    </>
  )
}
