import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Heart, MessageCircle, Search, ShoppingBag, User } from 'lucide-react'
import { CATEGORIES, IMG, PRODUCTS, SIGNATURES, cardPrice, getProduct, getProductsByCategory, signaturePieces, type Product } from '../../data/catalog'
import { HOUSE, HOUSE_IMG } from '../../data/house'
import { DENOMINATIONS } from '../../data/giftcards'
import { SALON, salonStatus } from '../../data/salon'
import { bilingual, useCopy, useLocale } from '../../i18n'
import { useCatalog, type CatalogCopy } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import GiftCardArt from '../giftcard/GiftCardArt'
import LanguageToggle from '../locale/LanguageToggle'
import Price from '../Price'
import { getLenis } from '../SmoothScroll'
import Burger from './Burger'
import Marked from './Marked'
import { RECOMMENDED, SHOP_PIECES } from '../shop/filters'
import useHouseSearch from './useHouseSearch'

export type MenuFocus = 'pointer' | 'keyboard' | 'search'

interface Props {
  open: boolean
  focus: MenuFocus
  onClose: () => void
  trigger: React.RefObject<HTMLButtonElement | null>
  /** Called with `true` while the menu's cross stands in for the menu button, so Header can hide the button. */
  onCover: (covered: boolean) => void
}

/** A destination in the extension (a chapter, the gift card, a search result): a Shopify menu link plus its collection's data. */
interface Dest {
  id: string
  title: string
  url: string
  kicker: string
  numeral?: string
  /** The italic accent beside the title: the French name in English, the chapter's own line in French. */
  accent?: string
  note?: string
  image: string
  thumb?: boolean
  art?: React.ReactNode
  meta?: React.ReactNode
  pieces?: Product[]
  cta: string
}

/** A top-level entry. One with `panel` unfolds that list to its right; the others are plain links. */
interface RailItem {
  id: string
  title: string
  accent: string
  url?: string
  panel?: string
}

const COPY = bilingual(
  {
    // The desktop bar, repeated: [title, italic accent].
    rail: { shop: ['Shop', 'La boutique'], bridal: ['Bridal', 'Mariage'], rentals: ['Rentals', 'Location'], designer: ['Design your ring', 'Sur mesure'], atelier: ['The Atelier', 'L’Atelier'] } as Record<'shop' | 'bridal' | 'rentals' | 'designer' | 'atelier', [string, string]>,
    suggestions: ['Diamond', 'Pearl', 'Emerald', 'Mont-Royal', 'Platinum'],
    from: 'From',
    pieces: (n: number) => `${n} piece${n === 1 ? '' : 's'}`,
    chapters: (n: number) => `${n} chapter${n === 1 ? '' : 's'}`,
    results: (n: number, q: string) => `${n} result${n === 1 ? '' : 's'} for “${q}”`,
    noResults: 'No results',
    chapterKicker: (numeral: string, accent: string) => `Chapter ${numeral} · ${accent}`,
    fromPrice: 'from',
    aWeekend: ' a weekend',
    shopChapter: (name: string) => `Shop ${name}`,
    viewPiece: 'View the piece',
    giftCards: ['Gift Cards', 'Carte-cadeau'] as [string, string],
    giftNote: 'Sent by email or boxed by post, and redeemable online and in our salon.',
    neverExpires: 'never expires',
    chooseGiftCard: 'Choose a gift card',
    atelier: { title: 'The Atelier', kicker: 'L’Atelier', note: 'Films from the bench, and private visits in our salon.', cta: 'Visit the atelier' },
    designer: { title: 'The ring designer', kicker: 'Sur mesure', note: 'An engagement ring designed stone by stone, seen in 3D and priced line by line as you choose.', cta: 'Design your ring' },
    wishlist: { title: 'Wishlist', kicker: 'Liste de souhaits', saved: (n: number) => `${n} piece${n === 1 ? '' : 's'} saved on this device.`, empty: 'Save any piece with its heart to find it here.', cta: 'Open your wishlist' },
    account: { title: 'Your account', kicker: 'Mon compte', note: 'Orders, rental returns and your gift-card wallet.', open: 'Open your account' },
    signIn: 'Sign in',
    cart: { title: 'Your bag', kicker: 'Votre sélection', waiting: (n: number) => `${n} piece${n === 1 ? '' : 's'} waiting for you.`, empty: 'Your bag is empty for now.', cta: 'Review your bag' },
    home: { title: 'Home', note: 'Light, set by hand, since 1962.', cta: 'Back to the beginning' },
    groups: { chapters: 'Chapters', pieces: 'Pieces', elsewhere: 'Elsewhere' },
    recent: 'Recently viewed',
    newArrivals: 'New arrivals',
    clear: 'Clear',
    close: 'Close menu',
    menu: 'Menu',
    mainMenu: 'Main menu',
    theSalon: 'The salon: ',
    search: 'Search the maison',
    searchLabel: 'Search pieces, chapters and pages',
    wishlistTile: 'Wishlist',
    signInTile: 'Sign in',
    wishlistSaved: (n: number) => `Wishlist, ${n} saved piece${n === 1 ? '' : 's'}`,
    accountOf: (name: string) => `Account, ${name}`,
    bag: 'Bag',
    openBag: 'Open bag',
    openBagWith: (n: number) => `Open bag, ${n} piece${n === 1 ? '' : 's'}`,
    appointment: 'Book a visit',
    ask: 'Ask a jeweller',
    every: ['Shop all', 'All nine chapters'] as [string, string],
    everyNote: 'Everything the house makes and curates, in one place: filters by chapter, metal, stone and price, a quick look at any piece, and edits to begin with.',
    everyCta: 'Shop all',
    signatureKicker: (numeral: string) => `Signature ${numeral}`,
    currency: 'Currency',
    nothing: (q: string) => `Nothing matches <em>“${q}”</em>.`,
    tryThese: 'Try a stone, a metal or a Montréal place:',
  },
  {
    rail: { shop: ['Boutique', 'les chapitres'], bridal: ['Mariage', 'pour la vie'], rentals: ['Location', 'le temps d’un soir'], designer: ['Créer votre bague', 'sur mesure'], atelier: ['L’Atelier', 'rue Sherbrooke'] },
    suggestions: ['Diamant', 'Perle', 'Émeraude', 'Mont-Royal', 'Platine'],
    from: 'Dès',
    pieces: (n) => `${n} pièce${n < 2 ? '' : 's'}`,
    chapters: (n) => `${n} chapitre${n < 2 ? '' : 's'}`,
    results: (n, q) => `${n} résultat${n < 2 ? '' : 's'} pour « ${q} »`,
    noResults: 'Aucun résultat',
    chapterKicker: (numeral) => `Chapitre ${numeral}`,
    fromPrice: 'dès',
    aWeekend: ' la fin de semaine',
    shopChapter: () => 'Voir le chapitre',
    viewPiece: 'Voir la pièce',
    giftCards: ['Cartes-cadeaux', 'sans expiration'],
    giftNote: 'Envoyée par courriel ou par la poste dans son écrin, et échangeable en ligne comme au salon.',
    neverExpires: 'sans expiration',
    chooseGiftCard: 'Choisir une carte-cadeau',
    atelier: { title: 'L’Atelier', kicker: 'Montréal · Depuis 1962', note: 'Des films tournés à l’établi, et des visites privées dans notre salon.', cta: 'Visiter l’atelier' },
    designer: { title: 'Créer votre bague', kicker: 'Sur mesure', note: 'Une bague de fiançailles créée pierre par pierre, vue en 3D et chiffrée ligne par ligne à chaque choix.', cta: 'Créer votre bague' },
    wishlist: { title: 'Liste de souhaits', kicker: 'Vos coups de cœur', saved: (n) => (n < 2 ? `${n} pièce enregistrée sur cet appareil.` : `${n} pièces enregistrées sur cet appareil.`), empty: 'Touchez le cœur d’une pièce pour la retrouver ici.', cta: 'Ouvrir votre liste' },
    account: { title: 'Votre compte', kicker: 'Espace client', note: 'Commandes, retours de location et portefeuille de cartes-cadeaux.', open: 'Ouvrir votre compte' },
    signIn: 'Se connecter',
    cart: { title: 'Votre panier', kicker: 'La sélection', waiting: (n) => (n < 2 ? `${n} pièce vous attend.` : `${n} pièces vous attendent.`), empty: 'Votre panier est vide pour l’instant.', cta: 'Voir votre panier' },
    home: { title: 'Accueil', note: 'La lumière, sertie à la main, depuis 1962.', cta: 'Revenir au début' },
    groups: { chapters: 'Chapitres', pieces: 'Pièces', elsewhere: 'Ailleurs' },
    recent: 'Vus récemment',
    newArrivals: 'Nouveautés',
    clear: 'Effacer',
    close: 'Fermer le menu',
    menu: 'Menu',
    mainMenu: 'Menu principal',
    theSalon: 'Le salon : ',
    search: 'Rechercher dans la maison',
    searchLabel: 'Rechercher des pièces, des chapitres et des pages, en français ou en anglais',
    wishlistTile: 'Souhaits',
    signInTile: 'Connexion',
    wishlistSaved: (n) => `Liste de souhaits, ${n} pièce${n < 2 ? '' : 's'} enregistrée${n < 2 ? '' : 's'}`,
    accountOf: (name) => `Compte, ${name}`,
    bag: 'Panier',
    openBag: 'Ouvrir le panier',
    openBagWith: (n) => `Ouvrir le panier, ${n} pièce${n < 2 ? '' : 's'}`,
    appointment: 'Prendre rendez-vous',
    ask: 'Parler à un joaillier',
    every: ['Toute la boutique', 'Les neuf chapitres'],
    everyNote: 'Tout ce que la maison fait et choisit, au même endroit : des filtres par chapitre, métal, pierre et prix, un aperçu de chaque pièce et des sélections pour commencer.',
    everyCta: 'Voir toute la boutique',
    signatureKicker: (numeral) => `Signature ${numeral}`,
    currency: 'Devise',
    nothing: (q) => `Rien ne correspond à <em>« ${q} »</em>.`,
    tryThese: 'Essayez une pierre, un métal ou un lieu de Montréal :',
  },
)

// The rail shows these until the visitor has viewed a piece.
const NEW_PIECES = PRODUCTS.filter((p) => p.badges?.includes('New')).slice(0, 3)

const ease = 'ease-[cubic-bezier(0.16,1,0.3,1)]'
const ring = 'focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-vermeil)]'
const ringDark = 'focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-champagne)]'
const eyebrow = 'font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]'
const sized = (src: string, w: number) => src.replace(/w=\d+/, `w=${w}`)

/** A piece's card price: the weekend rate for rentals, as on ProductCard. */
function PiecePrice({ product }: { product: Product }) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const shown = cardPrice(product, currency)
  return shown.rent ? <>{t.from} <Price amount={shown.amount} /></> : <Price amount={shown.amount} />
}

const pieceDest = (p: Product, catalog: CatalogCopy, cta: string): Dest => {
  const copy = catalog.product(p)
  return { id: `p:${p.slug}`, title: copy.name, url: href.product(p.slug), kicker: `${copy.collection} · ${catalog.category(p.category).name}`, note: copy.tagline, image: p.images[0], thumb: true, meta: <PiecePrice product={p} />, cta }
}

/** The extension's photograph and story for the destination under the pointer or focus. Photographs cross-fade as it changes. */
function Preview({ dest, onNavigate }: { dest: Dest | null; onNavigate: () => void }) {
  const catalog = useCatalog()
  const [layers, setLayers] = useState<string[]>([])
  const [ready, setReady] = useState<string[]>([])
  const src = dest ? sized(dest.image, 1200) : ''
  useEffect(() => {
    if (src) setLayers((l) => (l.includes(src) ? l : [...l.slice(-5), src]))
  }, [src])
  return (
    <div className="relative h-full w-[clamp(260px,32vw,620px)] overflow-hidden bg-[var(--bg-vault)]">
      {layers.map((s) => (
        <img key={s} src={s} alt="" onLoad={() => setReady((r) => (r.includes(s) ? r : [...r, s]))} className={`absolute inset-0 h-full w-full object-cover transition-[opacity,scale] duration-1000 ${ease} motion-reduce:scale-100 ${s === src && ready.includes(s) ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'}`} />
      ))}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)] via-[var(--bg-vault)]/55 to-transparent" />
      {dest?.art && (
        <div key={`art-${dest.id}`} aria-hidden="true" className="absolute inset-x-[14%] top-[15%] -rotate-6 animate-[fadeUp_0.8s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none">
          {dest.art}
        </div>
      )}
      {dest && (
        <div key={dest.id} className="absolute inset-x-0 bottom-0 animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)_both] p-[clamp(28px,3vw,48px)] text-[var(--bg-travertine)] motion-reduce:animate-none">
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{dest.kicker}</p>
          <p className="font-serif-editorial mt-3 text-[clamp(30px,3vw,46px)] font-light leading-[1.04]">{dest.title}</p>
          {dest.note && <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">{dest.note}</p>}
          {dest.meta && <p className="font-spec mt-5 text-[10px] uppercase tracking-[0.22em] text-[var(--gold-champagne)] [&_span_span]:text-white/45">{dest.meta}</p>}
          {dest.pieces && dest.pieces.length > 0 && (
            <ul className="mt-6 border-t border-white/15">
              {dest.pieces.map((p) => (
                <li key={p.slug} className="border-b border-white/15">
                  <a href={href.product(p.slug)} onClick={onNavigate} className={`group flex items-center gap-4 py-3 ${ringDark}`}>
                    <span className="h-[52px] w-[42px] shrink-0 overflow-hidden bg-white/5">
                      <img src={sized(p.images[0], 160)} alt="" className="editorial-zoom h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-serif-editorial block truncate text-[clamp(15px,1.2vw,17px)] leading-tight transition-colors group-hover:text-[var(--gold-champagne)]">{catalog.name(p)}</span>
                      <span className="font-spec mt-1 block text-[11px] text-white/70 [&_span_span]:text-white/45"><PiecePrice product={p} /></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a href={dest.url} onClick={onNavigate} className={`link-line mt-7 text-[var(--gold-champagne)] ${ringDark}`}>
            {dest.cta}
            <ArrowRight size={14} strokeWidth={1.4} />
          </a>
        </div>
      )}
    </div>
  )
}

/** Full-height desktop menu: the header's links in a left rail that unfolds sideways into panels, with search, the salon's live hours and the visitor's shortcuts. */
export default function SiteMenu({ open, focus, onClose, trigger, onCover }: Props) {
  const { route, currency, setCurrency, wishlist, user, count, setCartOpen, recent, clearRecent, openVisit, openAsk } = useStore()
  const house = useCopy(HOUSE)
  const { locale } = useLocale()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const { find } = useHouseSearch()
  const [shown, setShown] = useState(false)
  const [panel, setPanel] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [hot, setHot] = useState<string | null>(null)
  const [frame, setFrame] = useState({ strip: 32, top: 52, left: 39, aligned: true })
  const [standIn, setStandIn] = useState(false)
  const [status, setStatus] = useState(() => salonStatus())
  const [railMark, setRailMark] = useState<[number, number] | null>(null)
  const [listMark, setListMark] = useState<[number, number] | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const extRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const switchTimer = useRef<number | undefined>(undefined)
  const trail = useRef<{ x: number; t: number }[]>([])
  const pointer = useRef('mouse')
  const wasOpen = useRef(false)

  const q = query.trim()
  const mode = q ? 'search' : panel
  // The extension keeps its last content while it folds away.
  const [held, setHeld] = useState({ mode, q })
  if (mode && (mode !== held.mode || (mode === 'search' && q !== held.q))) setHeld({ mode, q })
  const live = useRef({ mode, q, panel })
  useEffect(() => {
    live.current = { mode, q, panel }
  })

  // Where the visitor is, so the menu can mark it.
  const currentCat = route.name === 'category' ? route.slug : route.name === 'product' ? getProduct(route.slug)?.category ?? null : null
  const currentRail = route.name === 'atelier' ? 'atelier' : route.name === 'designer' ? 'designer' : currentCat === 'bridal' || currentCat === 'rentals' ? currentCat : currentCat || route.name === 'giftcards' || route.name === 'shop' ? 'shop' : null
  const currentDest = route.name === 'giftcards' ? 'giftcards' : route.name === 'shop' ? 'all' : currentCat

  // The bar, repeated. New pages join it as they arrive; give an entry a `panel` to unfold a list beside the rail.
  const rail = useMemo<RailItem[]>(() => {
    const item = (id: keyof typeof t.rail, link: Partial<RailItem>): RailItem => ({ id, title: t.rail[id][0], accent: t.rail[id][1], ...link })
    return [item('shop', { panel: 'shop' }), item('bridal', { url: href.category('bridal') }), item('rentals', { url: href.category('rentals') }), item('designer', { url: href.designer() }), item('atelier', { url: href.atelier })]
  }, [t])

  const shop = useMemo<Dest[]>(() => [
    // Every piece, then the two signatures, then the chapters.
    { id: 'all', title: t.every[0], url: href.shop(), kicker: t.every[1], accent: t.every[1], note: t.everyNote, image: IMG.tray, meta: <>{t.pieces(SHOP_PIECES.length)} · {t.fromPrice} <Price amount={Math.min(...SHOP_PIECES.map((p) => cardPrice(p, currency, false).amount))} /></>, pieces: RECOMMENDED.slice(0, 3), cta: t.everyCta },
    ...SIGNATURES.map((x): Dest => {
      const sig = house.signatures[x.id]
      const pieces = signaturePieces(x.id)
      return { id: `sig:${x.id}`, title: sig.name, url: href.category(x.category, { type: x.family }), kicker: t.signatureKicker(sig.numeral), accent: t.signatureKicker(sig.numeral), note: sig.line, image: HOUSE_IMG.signatures[x.id].hero, meta: <>{t.pieces(pieces.length)} · {t.fromPrice} <Price amount={Math.min(...pieces.map((p) => cardPrice(p, currency, false).amount))} /></>, pieces: pieces.slice(0, 3), cta: sig.cta }
    }),
    ...CATEGORIES.map((c): Dest => {
      const pieces = getProductsByCategory(c.slug)
      const rental = c.slug === 'rentals'
      const from = Math.min(...pieces.map((p) => cardPrice(p, currency, rental).amount))
      const copy = catalog.category(c)
      return {
        id: c.slug,
        title: copy.name,
        url: href.category(c.slug),
        kicker: t.chapterKicker(c.eyebrow, copy.accent),
        numeral: c.eyebrow,
        accent: copy.accent,
        note: copy.description,
        image: c.hero,
        meta: pieces.length ? <>{t.pieces(pieces.length)} · {t.fromPrice} <Price amount={from} />{rental ? t.aWeekend : ''}</> : undefined,
        pieces: pieces.slice(0, 3),
        cta: t.shopChapter(copy.name),
      }
    }),
    {
      id: 'giftcards',
      title: t.giftCards[0],
      url: href.giftcards,
      kicker: t.giftCards[1],
      accent: t.giftCards[1],
      note: t.giftNote,
      image: IMG.gift1,
      art: <GiftCardArt design="vermeil" currency={currency} />,
      meta: <>{t.from} <Price amount={DENOMINATIONS[currency][0]} /> · {t.neverExpires}</>,
      cta: t.chooseGiftCard,
    },
  ], [currency, t, catalog, house])

  // Lists that unfold beside the rail, keyed by a rail item's `panel`.
  const panels: Record<string, { title: string; accent: string; aside: string; links: Dest[] }> = {
    shop: { title: t.rail.shop[0], accent: t.rail.shop[1], aside: t.chapters(CATEGORIES.length), links: shop },
  }

  const pages = useMemo<Dest[]>(() => {
    const saved = wishlist.map((slug) => getProduct(slug)).filter((p): p is Product => !!p)
    return [
      { id: 'g:designer', title: t.designer.title, url: href.designer(), kicker: t.designer.kicker, note: t.designer.note, image: IMG.sketchRings, cta: t.designer.cta },
      { id: 'g:atelier', title: t.atelier.title, url: href.atelier, kicker: t.atelier.kicker, note: t.atelier.note, image: IMG.ring2, cta: t.atelier.cta },
      { id: 'g:giftcards', title: t.giftCards[0], url: href.giftcards, kicker: t.giftCards[1], note: t.giftNote, image: IMG.gift1, cta: t.chooseGiftCard },
      { id: 'g:wishlist', title: t.wishlist.title, url: href.wishlist, kicker: t.wishlist.kicker, note: saved.length ? t.wishlist.saved(saved.length) : t.wishlist.empty, image: saved[0]?.images[0] ?? IMG.necklace2, cta: t.wishlist.cta },
      { id: 'g:account', title: user ? t.account.title : t.signIn, url: href.account, kicker: t.account.kicker, note: t.account.note, image: IMG.jewelryFlat, cta: user ? t.account.open : t.signIn },
      { id: 'g:cart', title: t.cart.title, url: href.cart, kicker: t.cart.kicker, note: count ? t.cart.waiting(count) : t.cart.empty, image: IMG.gift2, cta: t.cart.cta },
      { id: 'g:home', title: t.home.title, url: href.home, kicker: 'Teresa & Sons', note: t.home.note, image: IMG.necklace2, cta: t.home.cta },
    ]
  }, [wishlist, user, count, t])

  // Search is the header's own (useHouseSearch): both languages, prices, renting and typos. Its chapters and pages show
  // here as the menu's destinations, with their photographs; the two actions have their buttons below the rail.
  const searched = useMemo(() => (held.q ? find(held.q, currency) : null), [held.q, currency, find])
  const groups = useMemo<[string, Dest[]][]>(() => {
    if (!searched) return []
    const among = (list: Dest[], ids: string[]) => ids.map((id) => list.find((d) => d.id === id)).filter((d): d is Dest => !!d)
    return [
      [t.groups.chapters, among(shop, searched.ways.map((w) => w.id))],
      [t.groups.pieces, searched.pieces.slice(0, 6).map((p) => pieceDest(p, catalog, t.viewPiece))],
      [t.groups.elsewhere, among(pages, searched.doors.map((d) => d.id))],
    ]
  }, [searched, shop, pages, catalog, t])

  const sheet = held.mode && held.mode !== 'search' ? panels[held.mode] : undefined
  const list = held.mode === 'search' ? groups.flatMap(([, items]) => items) : sheet?.links ?? []
  const fallback = held.mode === 'search' ? list[0]?.id : list.find((d) => d.id === currentDest)?.id ?? list[0]?.id
  const activeId = active && list.some((d) => d.id === active) ? active : fallback ?? null
  const dest = list.find((d) => d.id === activeId) ?? null

  // The rail's shelf: what the visitor last looked at (minus this page), else what is new.
  const recentPieces = recent.filter((slug) => !(route.name === 'product' && route.slug === slug)).map((slug) => getProduct(slug)).filter((p): p is Product => !!p).slice(0, 3)
  const shelf = recentPieces.length ? { label: t.recent, pieces: recentPieces } : { label: t.newArrivals, pieces: NEW_PIECES }

  // Today's hours, in the language on screen.
  useEffect(() => setStatus(salonStatus()), [locale])

  // Before the first frame paints, measure the menu button so the cross can take its exact place.
  useLayoutEffect(() => {
    if (!open) return
    const r = trigger.current?.getBoundingClientRect()
    if (!r || !r.height) return
    // Past 1600 px the header's container is centred, so the button sits beyond the rail's corner.
    const aligned = r.left < 64
    setFrame({ strip: Math.max(0, Math.round(r.top + r.height / 2 - 40)), top: r.top, left: aligned ? r.left : 39, aligned })
  }, [open, trigger])

  // Header hides its menu button while the menu is open, so there is only ever one icon. Where the cross stands over
  // the button, the two swap back in a single commit once the cross has folded into lines; elsewhere the button returns at once.
  useLayoutEffect(() => {
    if (open) {
      setStandIn(true)
      onCover(true)
      return
    }
    const handBack = () => {
      setStandIn(false)
      onCover(false)
    }
    if (!frame.aligned) {
      handBack()
      return
    }
    const t = window.setTimeout(handBack, 500)
    return () => window.clearTimeout(t)
  }, [open, frame.aligned, onCover])

  // Each visit starts fresh: no panel or query, and today's hours.
  useEffect(() => {
    if (!open) {
      setShown(false)
      return
    }
    setPanel(null)
    setQuery('')
    setHeld({ mode: null, q: '' })
    setActive(null)
    setHot(null)
    setStatus(salonStatus())
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [open, trigger])

  // Overlay checklist: hold the page still, keep Tab inside, and drive the menu from the keyboard.
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const items = (scope: Element | null | undefined) => (scope ? Array.from(scope.querySelectorAll<HTMLElement>('[data-menu-item]')).filter((el) => !el.closest('[inert]')) : [])
    const extList = () => root?.querySelector('[data-menu-list="ext"]')
    const parentOf = (id: string | null) => (id ? root?.querySelector<HTMLElement>(`[data-panel="${id}"]`) : null)
    const onKey = (e: KeyboardEvent) => {
      if (!root) return
      const key = e.key ?? ''
      const target = e.target as HTMLElement
      const { mode: now, q: text } = live.current
      // Escape steps back: clear the search, then fold the panel, then close.
      if (key === 'Escape') {
        e.preventDefault()
        if (text) {
          setQuery('')
          searchRef.current?.focus()
        } else if (now) {
          setPanel(null)
          parentOf(now)?.focus()
        } else onClose()
        return
      }
      if (key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }
      if (key === 'Tab') {
        const all = Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input')).filter((el) => !el.closest('[inert]') && el.offsetParent !== null)
        if (!all.length) return
        const here = document.activeElement
        const outside = !here || !root.contains(here)
        if (e.shiftKey && (outside || here === root || here === all[0])) {
          e.preventDefault()
          all[all.length - 1].focus()
        } else if (!e.shiftKey && (outside || here === all[all.length - 1])) {
          e.preventDefault()
          all[0].focus()
        }
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (target === searchRef.current) {
        if (key === 'ArrowDown') {
          e.preventDefault()
          items(extList())[0]?.focus()
        } else if (key === 'Enter' && text) {
          e.preventDefault()
          extList()?.querySelector<HTMLElement>('a[data-menu-item]')?.click()
        }
        return
      }
      // Opened with a click, the dialog itself has focus: the arrows step into the rail.
      if (target === root && (key === 'ArrowDown' || key === 'ArrowUp')) {
        e.preventDefault()
        items(root.querySelector('[data-menu-list="rail"]'))[0]?.focus()
        return
      }
      const list = target.closest('[data-menu-list]')
      if (list && (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End')) {
        e.preventDefault()
        const all = items(list)
        const at = all.indexOf(target.closest<HTMLElement>('[data-menu-item]') as HTMLElement)
        const next = key === 'Home' ? 0 : key === 'End' ? all.length - 1 : (at + (key === 'ArrowDown' ? 1 : -1) + all.length) % all.length
        all[next]?.focus()
        return
      }
      const parent = target.closest<HTMLElement>('[data-panel]')?.dataset.panel
      if (key === 'ArrowRight' && parent) {
        e.preventDefault()
        openPanel(parent, true)
        return
      }
      if (key === 'ArrowLeft' && list?.getAttribute('data-menu-list') === 'ext') {
        e.preventDefault()
        if (now === 'search') searchRef.current?.focus()
        else {
          setPanel(null)
          parentOf(now)?.focus()
        }
        return
      }
      if (key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      // Type anywhere to search.
      if (key.length === 1 && key !== ' ') {
        e.preventDefault()
        setQuery((v) => v + key)
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(switchTimer.current)
      lenis?.start()
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Focus follows how the menu was opened: the search for shortcuts, the first link for keys, the panel itself for a click.
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      const root = rootRef.current
      if (focus === 'search') searchRef.current?.focus({ preventScroll: true })
      else if (focus === 'keyboard') root?.querySelector<HTMLElement>('[data-menu-list="rail"] [data-menu-item]')?.focus({ preventScroll: true })
      else root?.focus({ preventScroll: true })
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, focus])

  // Hand focus back to the menu button on close, unless something else (the bag) has taken it.
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      return
    }
    if (!wasOpen.current) return
    wasOpen.current = false
    const here = document.activeElement
    if (!here || here === document.body || rootRef.current?.contains(here)) trigger.current?.focus({ preventScroll: true })
  }, [open, trigger])

  // The menu button only exists on desktop; below it the mobile menu takes over.
  useEffect(() => {
    if (!open) return
    const wide = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (!wide.matches) onClose()
    }
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [open, onClose])

  // The gold hairlines glide to the item in hand: hovered or focused, else the open panel's parent or the current page.
  const railTarget = hot ?? (mode && mode !== 'search' ? rail.find((r) => r.panel === mode)?.id : null) ?? currentRail
  useEffect(() => {
    const el = railTarget ? rootRef.current?.querySelector<HTMLElement>(`[data-rail-id="${railTarget}"]`) : null
    setRailMark(el ? [el.offsetTop, el.offsetHeight] : null)
  }, [railTarget, shown])
  useEffect(() => {
    const el = activeId ? extRef.current?.querySelector<HTMLElement>(`[data-menu-list="ext"] [data-id="${activeId}"]`) : null
    setListMark(el ? [el.offsetTop, el.offsetHeight] : null)
  }, [activeId, held, shown])

  const openPanel = (id: string, focusInside = false) => {
    window.clearTimeout(switchTimer.current)
    setQuery('')
    setPanel(id)
    if (!focusInside) return
    requestAnimationFrame(() => {
      const ext = rootRef.current?.querySelector('[data-menu-list="ext"]')
      const target = ext?.querySelector<HTMLElement>('[aria-current="page"]') ?? ext?.querySelector<HTMLElement>('[data-menu-item]')
      target?.focus({ preventScroll: true })
    })
  }
  // A mouse click never folds a panel its hover just opened; keys and taps toggle it.
  const clickPanel = (e: React.MouseEvent, id: string) => {
    const unfolded = panel === id && !q
    if (e.detail === 0) {
      if (unfolded) setPanel(null)
      else openPanel(id, true)
    } else if (pointer.current === 'mouse' || !unfolded) openPanel(id)
    else setPanel(null)
  }
  const track = (e: React.PointerEvent) => {
    trail.current.push({ x: e.clientX, t: e.timeStamp })
    if (trail.current.length > 6) trail.current.shift()
  }
  // Menu aim: a pointer travelling right, towards the open panel, may cross other items without folding it.
  const headingRight = () => {
    const now = performance.now()
    const moves = trail.current.filter((p) => now - p.t < 150)
    return moves.length > 1 && moves[moves.length - 1].x - moves[0].x > 2
  }
  // Mouse only: a parent unfolds its panel after a short intent delay; a plain link folds the panel away.
  const hoverRail = (e: React.PointerEvent, item: RailItem) => {
    setHot(item.id)
    pointer.current = e.pointerType
    if (e.pointerType !== 'mouse') return
    window.clearTimeout(switchTimer.current)
    const next = item.panel ?? null
    const run = () => {
      const { panel: now, q: text } = live.current
      if (text || now === next) return
      if (now && headingRight()) {
        switchTimer.current = window.setTimeout(run, 120)
        return
      }
      setPanel(next)
    }
    switchTimer.current = window.setTimeout(run, next ? 80 : 200)
  }
  const holdPanel = () => window.clearTimeout(switchTimer.current)
  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }
  const suggest = (s: string) => {
    setQuery(s)
    searchRef.current?.focus()
  }
  const openBag = () => {
    onClose()
    setCartOpen(true)
  }
  // The Clear button disappears with the shelf it clears, so keep focus inside the dialog.
  const clearShelf = () => {
    clearRecent()
    rootRef.current?.focus({ preventScroll: true })
  }

  // The close cross. Over the menu button it takes the button's exact place, so the two lines appear to fold. Past 1600 px
  // it can't reach the button, so it sits in the rail's corner and travels with the rail.
  const cross = (
    <button type="button" onClick={onClose} aria-label={t.close} style={{ top: frame.top, left: frame.left }} className={`group absolute z-[3] flex h-10 w-10 items-center justify-center transition-colors hover:text-[var(--gold-vermeil)] ${ring}`}>
      <span className={`block ${frame.aligned && !standIn ? 'opacity-0' : ''}`}>
        <Burger open={shown} />
      </span>
    </button>
  )

  const stagger = (i: number) => ({ transitionDelay: shown ? `${140 + i * 50}ms` : '0ms' })
  const rise = `transition-[opacity,translate] duration-700 ${ease} motion-reduce:translate-y-0 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`
  const tile = `group flex flex-col items-center gap-2.5 py-4 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-[var(--bg-silk)] ${ring}`
  const badge = 'font-spec absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] tracking-normal'

  return createPortal(
    <div ref={rootRef} id="site-menu" role="dialog" aria-modal="true" aria-label={t.menu} tabIndex={-1} inert={!open} className={`fixed inset-0 z-[70] outline-none ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-[var(--bg-vault)]/45 transition-[opacity,backdrop-filter] duration-500 ${shown ? 'opacity-100 backdrop-blur-[3px]' : 'opacity-0 backdrop-blur-none'}`} />

      {frame.aligned && cross}

      {/* Rail */}
      <div className={`absolute inset-y-0 left-0 z-[2] flex w-[clamp(340px,30vw,420px)] flex-col bg-[var(--bg-travertine)] shadow-[24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-[translate,opacity,visibility] duration-700 ${ease} motion-reduce:duration-300 ${shown ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-full motion-reduce:translate-x-0 motion-reduce:opacity-0'}`}>
        {!frame.aligned && cross}
        {/* The announcement strip carries on, with the salon's hours as of now */}
        <div className="flex shrink-0 items-center bg-[var(--bg-vault)] pl-12 pr-8" style={{ height: frame.strip }}>
          <p className="font-spec flex min-w-0 items-center gap-2.5 text-[10px] uppercase tracking-[0.28em] text-[var(--gold-champagne)]">
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.open ? 'bg-[var(--gold-champagne)]' : 'bg-white/30'}`} />
            <span className="truncate"><span className="sr-only">{t.theSalon}</span>{status.label}</span>
          </p>
        </div>

        {/* Level with the header bar: the cross, then search */}
        <div className="flex h-20 shrink-0 items-center border-b border-[var(--border-hairline)] pl-12 pr-8">
          <label className="ml-14 flex min-w-0 flex-1 items-center gap-3 border-b border-[var(--border-hairline)] py-2 transition-colors focus-within:border-[var(--text-espresso)]">
            <Search size={15} strokeWidth={1.4} aria-hidden="true" className="shrink-0 text-[var(--text-taupe)]" />
            <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.searchLabel} aria-controls="menu-extension" autoComplete="off" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--text-taupe)] [&::-webkit-search-cancel-button]:hidden" />
            {query ? (
              <button type="button" onClick={clearSearch} className={`font-spec shrink-0 text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)] ${ring}`}>{t.clear}</button>
            ) : (
              <kbd aria-hidden="true" className="font-spec flex h-5 min-w-5 shrink-0 items-center justify-center border border-[var(--border-hairline)] px-1 text-[10px] text-[var(--text-taupe)]">/</kbd>
            )}
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-12 pb-10 pt-8" data-lenis-prevent>
          <nav aria-label={t.mainMenu}>
            <ul data-menu-list="rail" className="relative" onPointerMove={track} onPointerLeave={() => setHot(null)}>
              <span aria-hidden="true" className={`pointer-events-none absolute -left-6 top-0 w-px bg-[var(--gold-vermeil)] transition-[translate,height,opacity] duration-500 ${ease}`} style={{ translate: `0 ${railMark?.[0] ?? 0}px`, height: railMark?.[1] ?? 0, opacity: railMark ? 1 : 0 }} />
              {rail.map((item, i) => {
                const unfolded = !!item.panel && mode === item.panel
                const here = currentRail === item.id
                const dim = !!hot && hot !== item.id && !unfolded
                const cls = `group flex w-full items-baseline gap-4 py-3 text-left transition-colors duration-500 ${dim ? 'text-[var(--text-taupe)]' : 'text-[var(--text-espresso)]'} ${ring}`
                const label = (
                  <>
                    <span className="font-serif-editorial whitespace-nowrap text-[clamp(28px,2.4vw,38px)] font-light leading-none">{item.title}</span>
                    <span className={`font-serif-editorial min-w-0 truncate text-[14px] italic text-[var(--text-taupe)] transition-opacity duration-500 ${unfolded || here || hot === item.id ? 'opacity-100' : 'opacity-0'}`}>{item.accent}</span>
                  </>
                )
                return (
                  <li key={item.id} className={rise} style={stagger(i)}>
                    {item.panel ? (
                      <button type="button" data-menu-item data-rail-id={item.id} data-panel={item.panel} aria-expanded={unfolded} aria-controls="menu-extension" onPointerDown={(e) => (pointer.current = e.pointerType)} onPointerEnter={(e) => hoverRail(e, item)} onFocus={() => setHot(item.id)} onBlur={() => setHot(null)} onClick={(e) => clickPanel(e, item.panel!)} className={cls}>
                        {label}
                        <ArrowRight size={18} strokeWidth={1.3} aria-hidden="true" className={`ml-auto shrink-0 self-center text-[var(--gold-vermeil)] transition-transform duration-500 ${unfolded ? 'translate-x-1.5' : 'group-hover:translate-x-1'}`} />
                      </button>
                    ) : (
                      <a href={item.url} data-menu-item data-rail-id={item.id} aria-current={here ? 'page' : undefined} onPointerEnter={(e) => hoverRail(e, item)} onFocus={() => setHot(item.id)} onBlur={() => setHot(null)} onClick={onClose} className={cls}>
                        {label}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {shelf.pieces.length > 0 && (
            <section aria-label={shelf.label} className={`mt-12 ${rise}`} style={stagger(rail.length)}>
              <div className="flex items-baseline justify-between">
                <p className={eyebrow}>{shelf.label}</p>
                {recentPieces.length > 0 && <button type="button" onClick={clearShelf} className={`font-spec text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)] ${ring}`}>{t.clear}</button>}
              </div>
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {shelf.pieces.map((p) => (
                  <li key={p.slug}>
                    <a href={href.product(p.slug)} onClick={onClose} className={`group block ${ring}`}>
                      <span className="block aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
                        <img src={sized(p.images[0], 240)} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                      </span>
                      <span className="mt-2 block truncate text-[12px] text-[var(--text-taupe)] transition-colors group-hover:text-[var(--text-espresso)]">{catalog.name(p)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* The visitor's own corner, the salon, the language and the currency */}
        <div className={`shrink-0 border-t border-[var(--border-hairline)] px-12 pb-8 pt-6 ${rise}`} style={stagger(rail.length + 1)}>
          <div className="grid grid-cols-3 border border-[var(--border-hairline)]">
            <a href={href.wishlist} onClick={onClose} aria-label={wishlist.length ? t.wishlistSaved(wishlist.length) : t.wishlistTile} className={tile}>
              <span className="relative">
                <Heart size={18} strokeWidth={1.3} />
                {wishlist.length > 0 && <span className={`${badge} bg-[var(--text-espresso)] text-[var(--bg-travertine)]`}>{wishlist.length}</span>}
              </span>
              {t.wishlistTile}
            </a>
            <a href={href.account} onClick={onClose} aria-label={user ? t.accountOf(user.name) : t.signIn} className={`${tile} border-x border-[var(--border-hairline)]`}>
              <span className="relative">
                <User size={18} strokeWidth={1.3} />
                {user && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--gold-vermeil)]" />}
              </span>
              <span className="max-w-full truncate px-2">{user ? user.name.split(' ')[0] : t.signInTile}</span>
            </a>
            <button type="button" onClick={openBag} aria-label={count ? t.openBagWith(count) : t.openBag} className={tile}>
              <span className="relative">
                <ShoppingBag size={18} strokeWidth={1.3} />
                {count > 0 && <span className={`${badge} bg-[var(--gold-ink)] text-white`}>{count}</span>}
              </span>
              {t.bag}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button type="button" onClick={() => { onClose(); openVisit() }} className={`group flex items-center justify-between gap-4 whitespace-nowrap bg-[var(--text-espresso)] px-5 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] ${ring}`}>
              {t.appointment}
              <ArrowRight size={14} strokeWidth={1.4} className="shrink-0 transition-transform group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => { onClose(); openAsk() }} aria-label={t.ask} title={t.ask} className={`flex w-14 items-center justify-center border border-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)] hover:text-[var(--gold-vermeil)] ${ring}`}>
              <MessageCircle size={17} strokeWidth={1.3} />
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <LanguageToggle />
            <div className="font-spec flex border border-[var(--border-hairline)] text-[10px] tracking-[0.15em]" role="group" aria-label={t.currency}>
              {(['CAD', 'USD'] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`whitespace-nowrap px-2.5 py-1.5 transition-colors ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'} ${ring}`}>
                  {c === 'CAD' ? 'CA' : 'US'} · {c}
                </button>
              ))}
            </div>
            <a href={`tel:${SALON.phone.replace(/\s/g, '')}`} className={`font-spec whitespace-nowrap text-[11px] tracking-[0.06em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)] ${ring}`}>{SALON.phone}</a>
          </div>
        </div>

        {/* The extension: unfolds sideways from the rail, with a list and the preview photograph */}
        <div ref={extRef} id="menu-extension" inert={!mode} onPointerEnter={holdPanel} className={`absolute left-full top-0 flex h-full transition-[clip-path] duration-700 ${ease} motion-reduce:transition-none ${mode && shown ? '[clip-path:inset(0_-80px_0_0)]' : '[clip-path:inset(0_100%_0_0)]'}`}>
          <div className="flex h-full w-[clamp(300px,26vw,380px)] flex-col border-l border-[var(--border-hairline)] bg-[var(--bg-travertine)]">
            <div aria-hidden="true" className="shrink-0 bg-[var(--bg-vault)]" style={{ height: frame.strip }} />
            <div className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-hairline)] px-[clamp(24px,2.6vw,40px)]">
              {held.mode === 'search' ? (
                <p aria-live="polite" className="font-spec truncate text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{list.length ? t.results(list.length, held.q) : t.noResults}</p>
              ) : sheet ? (
                <>
                  <p className={`${eyebrow} truncate`}>{sheet.title}<span className="font-serif-editorial ml-2 text-[13px] normal-case italic tracking-normal text-[var(--text-taupe)]">{sheet.accent}</span></p>
                  <p className="font-spec shrink-0 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{sheet.aside}</p>
                </>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[clamp(24px,2.6vw,40px)] pb-8 pt-5" data-lenis-prevent>
              <div key={held.mode ?? 'none'} data-menu-list="ext" className="relative animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none">
                <span aria-hidden="true" className={`pointer-events-none absolute -left-3 top-0 w-px bg-[var(--gold-vermeil)] transition-[translate,height,opacity] duration-500 ${ease}`} style={{ translate: `0 ${listMark?.[0] ?? 0}px`, height: listMark?.[1] ?? 0, opacity: listMark ? 1 : 0 }} />

                {held.mode === 'search' ? (
                  list.length ? (
                    groups.map(([label, items]) => items.length > 0 && (
                      <section key={label} className="mb-7 last:mb-0">
                        <p className={`${eyebrow} mb-2`}>{label}</p>
                        <ul>
                          {items.map((d) => (
                            <li key={d.id}>
                              <a href={d.url} data-menu-item data-id={d.id} onPointerEnter={() => setActive(d.id)} onFocus={() => setActive(d.id)} onClick={onClose} className={`group flex items-center gap-4 py-2 ${ring}`}>
                                {d.thumb && (
                                  <span className="h-[50px] w-10 shrink-0 overflow-hidden bg-[var(--bg-silk)]">
                                    <img src={sized(d.image, 120)} alt="" loading="lazy" className="h-full w-full object-cover" />
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="font-spec block truncate text-[9px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{d.kicker}</span>
                                  <span className={`font-serif-editorial mt-1 block truncate pb-0.5 text-[18px] leading-tight transition-colors duration-300 ${d.id === activeId ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)]'}`}><Marked text={d.title} query={searched?.reading.words ?? held.q} /></span>
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))
                  ) : (
                    <div>
                      <p className="font-serif-editorial text-[22px] leading-snug">{rich(t.nothing(held.q), 'text-[var(--gold-vermeil)]')}</p>
                      <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-taupe)]">{t.tryThese}</p>
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {t.suggestions.map((s) => (
                          <li key={s}>
                            <button type="button" data-menu-item onClick={() => suggest(s)} className={`rounded-full border border-[var(--border-hairline)] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:border-[var(--text-espresso)] ${ring}`}>{s}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ) : sheet ? (
                  <ul>
                    {sheet.links.map((d) => {
                      const on = d.id === activeId
                      return (
                        <li key={d.id} className={d.numeral ? '' : 'mt-3 border-t border-[var(--border-hairline)] pt-3'}>
                          <a href={d.url} data-menu-item data-id={d.id} aria-current={d.id === currentDest ? 'page' : undefined} onPointerEnter={() => setActive(d.id)} onFocus={() => setActive(d.id)} onClick={onClose} className={`group flex items-baseline gap-3 py-[7px] ${ring}`}>
                            <span className="font-spec w-6 shrink-0 text-[10px] text-[var(--gold-ink)]">
                              {d.numeral ?? <span aria-hidden="true" className="inline-block aspect-[1.586] w-5 rounded-[2px] bg-[linear-gradient(135deg,var(--gold-champagne),var(--gold-vermeil))] align-middle" />}
                            </span>
                            <span className={`font-serif-editorial whitespace-nowrap text-[clamp(18px,1.6vw,24px)] leading-tight transition-colors duration-300 ${on ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)]'}`}>{d.title}</span>
                            {/* The accent only where it fits whole beside the title */}
                            {d.title.length + (d.accent?.length ?? 0) <= 26 && <span className={`font-serif-editorial min-w-0 truncate text-[13px] italic text-[var(--text-taupe)] transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-0'}`}>{d.accent}</span>}
                            {d.id === currentDest && <span aria-hidden="true" className="ml-auto h-1 w-1 shrink-0 self-center rounded-full bg-[var(--gold-vermeil)]" />}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
          <Preview dest={dest} onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
