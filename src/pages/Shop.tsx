import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Gem, Link2, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react'
import { CATEGORIES, IMG, isRentable, openingPrice, pic, type CategorySlug, type Product } from '../data/catalog'
import { HOUSE } from '../data/house'
import { bilingual, useCopy, useLocale } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { rich } from '../i18n/rich'
import { copyText, shareUrl } from '../lib/share'
import { href, useStore, type Query } from '../store'
import useReveal from '../components/useReveal'
import ProductCard from '../components/ProductCard'
import RecentlyViewed from '../components/RecentlyViewed'
import { getLenis } from '../components/SmoothScroll'
import Interlude from '../components/catalog/Interlude'
import useHouseSearch from '../components/menu/useHouseSearch'
import ChapterRail from '../components/shop/ChapterRail'
import OfferCard from '../components/shop/OfferCard'
import ShopHero from '../components/shop/ShopHero'
import ShopSearch from '../components/shop/ShopSearch'
import ShopToolbar from '../components/shop/ShopToolbar'
import useGridMotion from '../components/shop/useGridMotion'
import useShopCopy from '../components/shop/useShopCopy'
import WornSwitch from '../components/shop/WornSwitch'
import { EDITS, FACETS, PAGE, RECOMMENDED, SHOP_PIECES, activeCount, applyEdit, browse, cellsFor, isEdit, loosen, noFacets, offersFor, readSelection, writeSelection, type Context, type FacetId, type Selection } from '../components/shop/filters'
import VisitBand from '../components/visit/VisitBand'
import VisitButton from '../components/visit/VisitButton'
import { btnOnDark, btnVisit } from '../components/ui'

// The panel and the quick view load apart from the page; the panel is fetched once the page has settled.
const FilterPanel = lazy(() => import('../components/shop/FilterPanel'))
const QuickView = lazy(() => import('../components/shop/QuickView'))

const COPY = bilingual(
  {
    pieces: 'The pieces',
    remove: (label: string) => `Remove ${label}`,
    clear: 'Clear all',
    prices: (currency: string) => `Prices in ${currency}`,
    copy: 'Copy the link',
    copied: 'Link copied',
    none: 'No piece matches all of these.',
    noneText: 'Take a choice back, or ask a jeweller: what isn’t here, the atelier can often find or make.',
    without: (label: string) => `Without ${label}`,
    withoutSearch: 'Without the search',
    withoutPrice: 'At any price',
    ask: 'Ask a jeweller',
    shown: (a: number, b: number) => `${a} of ${b} pieces`,
    more: 'Show more pieces',
    all: (n: number) => `Show all ${n}`,
    promise: 'With every piece',
    promises: {
      shipping: { CAD: ['Insured shipping', 'Complimentary across Canada, signature required.'], USD: ['Insured shipping', 'Complimentary to the U.S., duties prepaid.'] } as Record<'CAD' | 'USD', [string, string]>,
      natural: 'Natural diamonds',
      returns: 'Returns in 30 days',
      care: ['Lifetime care', 'Annual cleaning, claw checks and rhodium refresh.'] as [string, string],
    },
    madeEyebrow: 'Sur mesure',
    madeTitle: 'Not here? We can <em>make</em> it.',
    madeText: 'The atelier also makes to order: from a stone you inherited, a drawing, or a date to remember.',
    designRing: 'Design your ring',
    consult: 'Book a design consultation',
    madeAlt: 'Drawings for a ring on the atelier’s bench',
  },
  {
    pieces: 'Les pièces',
    remove: (label) => `Retirer ${label}`,
    clear: 'Tout effacer',
    prices: (currency) => `Prix en ${currency}`,
    copy: 'Copier le lien',
    copied: 'Lien copié',
    none: 'Aucune pièce ne réunit tous ces critères.',
    noneText: 'Retirez un critère, ou parlez à un joaillier : ce qui n’est pas ici, l’atelier peut souvent le trouver ou le faire.',
    without: (label) => `Sans « ${label} »`,
    withoutSearch: 'Sans la recherche',
    withoutPrice: 'À tous les prix',
    ask: 'Parler à un joaillier',
    shown: (a, b) => `${a} pièce${a < 2 ? '' : 's'} sur ${b}`,
    more: 'Voir plus de pièces',
    all: (n) => `Tout voir (${n})`,
    promise: 'Avec chaque pièce',
    promises: {
      shipping: { CAD: ['Livraison assurée', 'Offerte partout au Canada, signature requise.'], USD: ['Livraison assurée', 'Offerte aux États-Unis, droits de douane prépayés.'] },
      natural: 'Diamants naturels',
      returns: 'Retours sous 30 jours',
      care: ['Entretien à vie', 'Nettoyage annuel, vérification des griffes et rhodiage.'],
    },
    madeEyebrow: 'L’atelier',
    madeTitle: 'Pas ici? Nous pouvons la <em>faire</em>.',
    madeText: 'L’atelier crée aussi sur commande : à partir d’une pierre héritée, d’un dessin ou d’une date à retenir.',
    designRing: 'Créer votre bague',
    consult: 'Réserver une consultation création',
    madeAlt: 'Les dessins d’une bague sur l’établi de l’atelier',
  },
)

type Section = FacetId | 'price'

// What the hero says of the house, from the catalog itself.
const STATS = {
  pieces: SHOP_PIECES.length,
  chapters: CATEGORIES.length,
  rent: SHOP_PIECES.filter(isRentable).length,
}

/** Shop all (`#/shop`, Shopify's /collections/all): every piece in one place. The hero (the house in figures, the
 *  edits, the pieces drifting past), the chapters as tiles, then the pieces under a pinned bar: filters in a panel
 *  with counts (multi-select, a price slider), a search within, the sort, three densities and the worn photographs,
 *  all kept in the address. The house's cards sit among the pieces, a quick view opens any of them, and a card's
 *  photograph flies into its page. With a search (`?q=`, the header's "See all", Shopify's /search) the hero names it. */
export default function Shop({ query }: { query: Query }) {
  const root = useRef<HTMLDivElement>(null)
  const results = useRef<HTMLElement>(null)
  const grid = useRef<HTMLUListElement>(null)
  const { currency, replaceQuery, openAsk, wishlist, recent } = useStore()
  const { locale } = useLocale()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const shop = useShopCopy()
  const { find } = useHouseSearch()
  const [sel, setSel] = useState<Selection>(() => readSelection(query, currency))
  // The hero names a search when the page opened on one; later searches here change the pieces, not the hero's size.
  const [searching] = useState(() => !!query.q?.trim())
  const [panel, setPanel] = useState<{ open: boolean; focus: Section | null }>({ open: false, focus: null })
  const [quick, setQuick] = useState<Product | null>(null)
  const [copied, setCopied] = useState(false)
  const [panelReady, setPanelReady] = useState(false)
  const focusFrom = useRef<number | null>(null)
  const closeQuick = useCallback(() => setQuick(null), [])
  const motion = useGridMotion(grid)
  useReveal(root, [])

  const found = useMemo(() => (sel.q ? find(sel.q, currency) : null), [sel.q, currency, find])
  const ctx = useMemo<Context>(() => ({ currency, saved: wishlist, viewed: recent, found: found?.pieces ?? null, searchRents: !!found?.reading.rent, name: catalog.name, locale }), [currency, wishlist, recent, found, catalog, locale])
  const outcome = useMemo(() => browse(SHOP_PIECES, sel, ctx), [sel, ctx])
  const cells = useMemo(() => cellsFor(outcome.shown, offersFor(sel, outcome.shown, outcome.renting)), [sel, outcome])
  const visible = cells.slice(0, PAGE * sel.page)
  const shownPieces = visible.filter((c) => c.kind === 'piece').length

  // The panel mounts (closed) once the page has settled, so its first opening slides in like the others.
  useEffect(() => {
    const id = window.setTimeout(() => setPanelReady(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  const update = useCallback((next: Selection) => {
    motion.capture()
    setSel(next)
    replaceQuery(writeSelection(next, currency))
  }, [motion, replaceQuery, currency])

  // A price range belongs to its currency: switching markets lets it go.
  const market = useRef(currency)
  useEffect(() => {
    if (market.current === currency) return
    market.current = currency
    if (sel.min !== undefined || sel.max !== undefined) update({ ...sel, min: undefined, max: undefined, page: 1 })
  }, [currency, sel, update])

  // The pieces from their first row: the bar pinned under the header (only when the grid starts above the screen).
  const toResults = (always = false) => {
    const el = results.current
    if (!el || (!always && el.getBoundingClientRect().top >= 0)) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -111 })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 111, behavior: 'smooth' })
  }

  // After "Show more", the focus goes to the first new piece.
  useLayoutEffect(() => {
    if (focusFrom.current === null) return
    const at = focusFrom.current
    focusFrom.current = null
    grid.current?.querySelectorAll<HTMLElement>(':scope > li')[at]?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true })
  })

  // Each edit with how many pieces it holds (whatever else is chosen, as it replaces the choices).
  const edits = useMemo(() => EDITS.map((e) => {
    const next = applyEdit(sel, e, currency)
    return { id: e.id, label: shop.edit(e.id, currency, e.max?.[currency]), count: browse(SHOP_PIECES, next, { ...ctx, found: null, searchRents: false }).shown.length, on: isEdit(sel, e, currency) }
  }).filter((e) => e.count > 0), [sel, ctx, currency, shop])
  const everyChapter = useMemo(() => browse(SHOP_PIECES, { ...sel, facets: { ...sel.facets, chapter: [] } }, ctx).shown.length, [sel, ctx])
  const from = useMemo(() => Math.min(...SHOP_PIECES.map((p) => openingPrice(p, currency))), [currency])
  const onEdit = (id: string) => {
    const e = EDITS.find((x) => x.id === id)!
    update(isEdit(sel, e, currency) ? { ...sel, facets: noFacets(), min: undefined, max: undefined, page: 1 } : applyEdit(sel, e, currency))
    toResults(true)
  }

  // The chips: the search, each value chosen, the price.
  const chips = [
    ...(sel.q ? [{ key: 'q', label: shop.t.searched(sel.q), drop: () => update({ ...sel, q: '', page: 1 }) }] : []),
    ...FACETS.flatMap((id) => sel.facets[id].map((v) => ({ key: `${id}:${v}`, label: shop.option(id, v), drop: () => update({ ...sel, facets: { ...sel.facets, [id]: sel.facets[id].filter((x) => x !== v) }, page: 1 }) }))),
    ...(sel.min !== undefined || sel.max !== undefined ? [{ key: 'price', label: shop.range(currency, sel.min, sel.max), drop: () => update({ ...sel, min: undefined, max: undefined, page: 1 }) }] : []),
  ]
  const clearAll = () => update({ ...sel, q: '', facets: noFacets(), min: undefined, max: undefined, page: 1 })
  const chosen = Object.fromEntries([...FACETS.map((id) => [id, sel.facets[id].length]), ['price', sel.min !== undefined || sel.max !== undefined ? 1 : 0]]) as Partial<Record<Section, number>>

  const closePanel = useCallback(() => {
    setPanel((p) => ({ ...p, open: false }))
    toResults()
    // toResults reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyLink = async () => {
    if (await copyText(shareUrl(href.shop(writeSelection({ ...sel, page: 1 }, currency))))) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    }
  }

  const suggestions = outcome.shown.length ? [] : loosen(SHOP_PIECES, sel, ctx)
  // The hero's pieces: the house's order, or what a search found (when there are enough to drift).
  const mosaic = useMemo(() => (!searching ? RECOMMENDED.slice(0, 18) : found && found.pieces.length >= 6 ? found.pieces.slice(0, 18) : []), [searching, found])
  const searchField = <ShopSearch value={sel.q} onCommit={(q) => update({ ...sel, q, page: 1 })} />
  const compact = sel.view === 'compact'
  const cols = sel.view === 'large' ? 'grid-cols-1 gap-x-10 gap-y-20 sm:grid-cols-2 lg:gap-x-14' : compact ? 'grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8' : 'grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3'
  const sizes = sel.view === 'large' ? '(min-width: 640px) 48vw, 100vw' : compact ? '(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw' : undefined
  const promises: [typeof Truck, string, string][] = [
    [Truck, ...t.promises.shipping[currency]],
    [Gem, t.promises.natural, house.natural],
    [RotateCcw, t.promises.returns, house.returns],
    [ShieldCheck, ...t.promises.care],
  ]

  return (
    <div ref={root}>
      <ShopHero q={sel.q} searching={searching} found={outcome.shown.length} stats={{ ...STATS, from }} edits={edits} onEdit={onEdit} mosaic={mosaic} />

      <ChapterRail selected={sel.facets.chapter} counts={outcome.counts.chapter} total={everyChapter} onPick={(slug: CategorySlug | null) => update({ ...sel, facets: { ...sel.facets, chapter: slug ? [slug] : [] }, page: 1 })} />

      <section ref={results} aria-label={t.pieces} className="relative">
        <ShopToolbar
          view={sel.view}
          sort={sel.sort}
          worn={sel.worn}
          count={outcome.shown.length}
          filters={activeCount(sel)}
          chosen={chosen}
          searching={!!sel.q}
          panelOpen={panel.open}
          onOpen={(focus) => {
            setPanelReady(true)
            setPanel({ open: true, focus })
          }}
          onSort={(sort) => {
            update({ ...sel, sort, page: 1 })
            toResults()
          }}
          onView={(view) => update({ ...sel, view })}
          onWorn={(worn) => update({ ...sel, worn })}
          search={searchField}
        />

        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-2 pt-6">
            <span className="font-spec text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] sm:hidden">{shop.t.count(outcome.shown.length)}</span>
            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <button key={c.key} type="button" onClick={c.drop} aria-label={t.remove(c.label)} className="flex items-center gap-2 rounded-full bg-[var(--bg-silk)] py-1.5 pl-3.5 pr-2.5 text-[13px] transition-colors hover:bg-[var(--border-hairline)] motion-safe:animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
                    {c.label} <X size={12} strokeWidth={1.6} />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="ml-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">{t.clear}</button>
              </div>
            )}
            <div className="ml-auto flex items-center gap-5 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">
              <WornSwitch on={sel.worn} onChange={(worn) => update({ ...sel, worn })} className="text-[var(--text-espresso)] sm:hidden" />
              <span className="font-spec max-sm:hidden">{t.prices(currency)}</span>
              <button type="button" onClick={copyLink} className="flex items-center gap-2 uppercase tracking-[0.22em] transition-colors hover:text-[var(--text-espresso)]">
                {copied ? <Check size={13} strokeWidth={1.8} className="text-[var(--gold-vermeil)]" /> : <Link2 size={13} strokeWidth={1.4} />}
                <span aria-live="polite" className={copied ? '' : 'max-sm:sr-only'}>{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          </div>

          {outcome.shown.length === 0 ? (
            <div className="py-24 text-center lg:py-32">
              <p className="font-serif-editorial text-4xl font-light lg:text-5xl">{t.none}</p>
              <p className="mx-auto mt-5 max-w-md leading-relaxed text-[var(--text-taupe)]">{t.noneText}</p>
              {suggestions.length > 0 && (
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {suggestions.map((l) => {
                    const label = l.facet === 'q' ? t.withoutSearch : l.facet === 'price' ? t.withoutPrice : t.without(shop.option(l.facet, l.value!))
                    const drop = () => (l.facet === 'q' ? update({ ...sel, q: '', page: 1 }) : l.facet === 'price' ? update({ ...sel, min: undefined, max: undefined, page: 1 }) : update({ ...sel, facets: { ...sel.facets, [l.facet]: sel.facets[l.facet].filter((v) => v !== l.value) }, page: 1 }))
                    return (
                      <button key={`${l.facet}:${l.value ?? ''}`} type="button" onClick={drop} className="flex items-center gap-3 border border-[var(--border-hairline)] px-5 py-3 text-sm transition-colors hover:border-[var(--text-espresso)]">
                        {label} <span className="font-spec text-[11px] text-[var(--text-taupe)]">{common.pieces(l.count)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="mt-10 flex flex-wrap justify-center gap-8">
                <button type="button" onClick={clearAll} className="link-line">{t.clear}</button>
                <button type="button" onClick={() => openAsk()} className="link-line">{t.ask}</button>
              </div>
            </div>
          ) : (
            <>
              <ul ref={grid} role="list" className={`grid pb-4 pt-6 ${cols}`}>
                {visible.map((c, i) => (
                  <li key={c.kind === 'piece' ? c.product.slug : `offer:${c.id}`} data-flip-id={c.kind === 'piece' ? c.product.slug : `offer:${c.id}`}>
                    {c.kind === 'piece' ? (
                      <ProductCard product={c.product} index={i} lead={outcome.rentLed(c.product) ? 'rent' : 'own'} worn={sel.worn} sizes={sizes} onQuickView={setQuick} swatches compact={compact} reveal={false} />
                    ) : (
                      <OfferCard id={c.id} compact={compact} onFilter={(id) => {
                        update(id === 'rent' ? { ...sel, facets: { ...sel.facets, how: ['rent'] }, min: undefined, max: undefined, page: 1 } : { ...sel, facets: { ...sel.facets, svc: [...new Set([...sel.facets.svc, 'engrave'])] }, page: 1 })
                        toResults()
                      }} />
                    )}
                  </li>
                )).flatMap((li, i) => (i === PAGE - 1 && visible.length > PAGE ? [li, <li key="interlude" data-flip-id="interlude" className="col-span-full py-4"><Interlude /></li>] : [li]))}
              </ul>

              {shownPieces < outcome.shown.length ? (
                <div className="flex flex-col items-center gap-6 pb-24 pt-16">
                  <p className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{t.shown(shownPieces, outcome.shown.length)}</p>
                  <span aria-hidden="true" className="relative h-px w-56 bg-[var(--border-hairline)]"><span className="absolute inset-y-0 left-0 bg-[var(--text-espresso)] transition-[width] duration-700" style={{ width: `${(shownPieces / outcome.shown.length) * 100}%` }} /></span>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <button type="button" onClick={() => { focusFrom.current = visible.length + (visible.length >= PAGE ? 1 : 0); update({ ...sel, page: sel.page + 1 }) }} className={btnVisit}>{t.more}</button>
                    <button type="button" onClick={() => { focusFrom.current = visible.length + (visible.length >= PAGE ? 1 : 0); update({ ...sel, page: Math.ceil(cells.length / PAGE) }) }} className="link-line">{t.all(outcome.shown.length)}</button>
                  </div>
                </div>
              ) : (
                <div className={visible.length <= PAGE ? 'pb-24 pt-16' : 'pb-24'}>{visible.length <= PAGE && <Interlude />}</div>
              )}
            </>
          )}
        </div>
      </section>

      {/* What comes with every piece: the house's own words */}
      <section aria-labelledby="shop-promise" className="border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)]">
        <div className="mx-auto max-w-[1600px] px-6 py-20 lg:px-12 lg:py-24">
          <p id="shop-promise" data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.promise}</p>
          <ul className="mt-8 grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(([Icon, title, text], i) => (
              <li key={title} data-reveal={(i % 4) * 0.06} className="group bg-[var(--bg-travertine)] p-8 transition-colors duration-500 hover:bg-[var(--bg-silk)] lg:p-10">
                <Icon size={20} strokeWidth={1.2} className="text-[var(--gold-vermeil)] transition-transform duration-500 group-hover:-translate-y-1" />
                <p className="font-serif-editorial mt-6 text-2xl">{title}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Not here? The atelier makes to order */}
      <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
          <div className="lg:col-span-6">
            <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.madeEyebrow}</p>
            <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-5xl font-light leading-[1] tracking-[-0.02em] lg:text-7xl">{rich(t.madeTitle, 'text-[var(--gold-champagne)]')}</h2>
            <p data-reveal="0.1" className="mt-6 max-w-md leading-relaxed text-white/70">{t.madeText}</p>
            <div data-reveal="0.15" className="mt-10 flex flex-wrap items-center gap-3">
              <a href={href.designer()} className={btnOnDark}>{t.designRing}</a>
              <VisitButton tone="dark" request={{ purpose: 'design' }}>{t.consult}</VisitButton>
            </div>
            <button type="button" data-reveal="0.2" onClick={() => openAsk()} className="link-line mt-8 text-[var(--bg-travertine)]">{t.ask} <ArrowRight size={14} strokeWidth={1.4} /></button>
          </div>
          <div data-reveal-img className="relative aspect-[4/3] overflow-hidden lg:col-span-5 lg:col-start-8">
            <img data-parallax {...pic(IMG.drawings, '(min-width: 1024px) 40vw, 100vw')} alt={t.madeAlt} loading="lazy" className="h-full w-full object-cover opacity-90" />
          </div>
        </div>
      </section>

      <VisitBand />
      <RecentlyViewed />

      <Suspense fallback={null}>
        {panelReady && <FilterPanel open={panel.open} onClose={closePanel} focus={panel.focus} selection={sel} outcome={outcome} currency={currency} hasOwn={wishlist.length + recent.length > 0} onChange={update} onClear={clearAll} search={searchField} />}
      </Suspense>
      <Suspense fallback={null}>
        {quick && <QuickView product={quick} rent={outcome.rentLed(quick)} onClose={closeQuick} />}
      </Suspense>
    </div>
  )
}
