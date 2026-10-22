# Architecture & runtime model

Teresa & Sons is a client-only React 19 + TypeScript single-page app (Vite 8, Tailwind CSS v4, hosted by Figma Make) whose `index.html` boots `src/main.tsx`, which mounts `src/App.tsx`: a fixed provider stack (`StoreProvider` ▸ `TryOnProvider` ▸ `SmoothScroll`) wrapped around a persistent shell of header, routed `<main>`, footer, cart drawer and film-grain layer. Route, currency, cart, order options, wishlist, demo account and recently viewed all live in one React Context in `src/store.tsx`, which also implements the hash router and mirrors that state to `localStorage`; only the try-on request (`TryOnProvider`), the gift-card ledger and customer reviews live elsewhere. Catalog data is static TypeScript in `src/data`, there is no backend and no `fetch`/XHR anywhere in `src`, and the only code-split module is the virtual try-on studio.

Scope: `src/main.tsx`, `src/App.tsx`, `src/store.tsx`, `src/lib/shopify.ts`, `src/components/tryon/TryOnProvider.tsx`, `src/components/SmoothScroll.tsx`, `index.html`, `tsconfig.json`, `package.json`, `vite.config.ts`, `.figma/make/site.json`, plus a sweep of every `src/**/*.{ts,tsx}` file (69 files) for store usage, navigation, storage, contexts, lazy loading, listeners and GSAP/Lenis wiring. Facts are as of commit `db22872`.

Path shorthand: `pages/X` means `src/pages/X.tsx`; `home/X`, `pdp/X`, `cart/X`, `tryon/X`, `video/X` and `giftcard/X` mean `src/components/<folder>/X.tsx` (or `.ts` for hooks); bare component names such as `Header`, `CartDrawer` or `Price` mean `src/components/<Name>.tsx`.

---

## 1. Big picture

### 1.1 Layers

Imports point downward: a layer may import any lower layer. §1.4 lists the edges that don't follow this.

| # | Layer | Location | Responsibility |
|---|---|---|---|
| 1 | Data & lib | `src/data/catalog.ts`, `giftcards.ts`, `media.ts`, `costing.ts`, `tax.ts`; `src/lib/shopify.ts` | Static constants (`PRODUCTS`, `CATEGORIES`, `METALS`, `IMG`, `VIDEOS`, `DESIGNS`, `PROVINCES`, …) and pure helpers (`priceFor`, `formatPrice`, `convert`, `tryOnKind`, `buildCostBreakdown`, …). No React. `src/data/giftcards.ts` is the only data module with side effects: its gift-card ledger lives in `localStorage` and its codes come from `crypto.getRandomValues`. `src/lib/shopify.ts` maps cart lines to Shopify Ajax Cart payloads. |
| 2 | State & routing | `src/store.tsx` | One context (`StoreProvider` / `useStore`), the hash router (`parseHash`, `href`), cart-line identity (`lineKey`), line pricing (`linePrice`) and persistence. |
| 2b | Runtime providers | `src/components/tryon/TryOnProvider.tsx`, `src/components/SmoothScroll.tsx` | Try-on context plus the lazily loaded studio overlay. Lenis smooth scroll, ScrollTrigger sync, scroll reset on every route change, and the `getLenis()` singleton accessor. |
| 3 | Shared components & hooks | `src/components/Price.tsx`, `ProductCard.tsx`, `WishButton.tsx`, `RecentlyViewed.tsx`, `useReveal.ts`, `lineDetails.ts`; shared in practice although they live in feature folders: `home/SectionHeader.tsx`, `pdp/Accordion.tsx`, `tryon/TryOnButton.tsx`, `giftcard/GiftCardArt.tsx` | Building blocks used by several pages and features. |
| 4 | Feature components & chrome | `src/components/{home,pdp,cart,tryon,video,giftcard}/*`; `src/components/Header.tsx`, `Footer.tsx`, `CartDrawer.tsx`, `HomeHero.tsx` | Domain sections, overlays and the global chrome. |
| 5 | Pages | `src/pages/*.tsx` (9 files) | Route targets. They compose features and own page-local UI state such as forms, selections and confirmations. |
| 6 | App | `src/main.tsx`, `src/App.tsx` | Composition root: providers, shell, the `Routes` switch and per-route document titles (`headFor`). |

### 1.2 Directory map

| Path | Responsibility | Contents |
|---|---|---|
| `/` (repo root) | Project shell | `index.html`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `.mise.toml` (`node = "22"`, `"npm:pnpm" = "10.34.3"`), `AGENTS.md`, `CLAUDE.md` (contains `@AGENTS.md`), `.gitignore`, `.gitattributes` |
| `.figma/make/` | Figma Make platform hooks | Shell scripts `analyze-routes`, `deploy` (`pnpm run build` then `figma make deploy --build-dir dist`), `deploy-preview` (`pnpm run build --mode development`), `dev`, `format`, `install`, `langserver`; `dev.json` (reinstall on `package.json` / `pnpm-lock.yaml` changes); `site.json` (site metadata read by `vite.config.ts`) |
| `public/` | Static files served from the base URL | `favicon.svg` (the house ampersand), `favicon.ico` (32 px fallback), `apple-touch-icon.png` (180 px), `og-image.jpg` (1200×630 social card) |
| `src/` | Entry and app-wide modules | `main.tsx`, `App.tsx`, `store.tsx`, `index.css`, `vite-env.d.ts` (`/// <reference types="vite/client" />`) |
| `src/data/` | Data layer | `catalog.ts`, `giftcards.ts`, `media.ts`, `costing.ts`, `tax.ts` |
| `src/lib/` | Integration mapping | `shopify.ts` |
| `src/pages/` | Route targets | `Home`, `Category`, `Product`, `Atelier`, `Checkout`, `Wishlist`, `Account`, `GiftCards`, `Cart` |
| `src/components/` (root) | Global chrome, shared UI, hooks | `Header`, `Footer`, `CartDrawer`, `SmoothScroll`, `HomeHero` (used only by `pages/Home`), `Price`, `ProductCard`, `RecentlyViewed` (default export plus named `RecentlyViewedStrip`), `WishButton`, `lineDetails.ts`, `useReveal.ts` |
| `src/components/home/` | Home page sections and the shared editorial header | `CategoryIndex`, `FourCs`, `GiftFinder`, `MakingScroll`, `PressStrip`, `SectionHeader`, `Services`, `SocialGrid`, `Testimonials`, `Treasured`, `TryOnFeature`, `VisitSalon`, `WatchSpotlight` |
| `src/components/pdp/` | Product-page modules | `Accordion`, `CompleteTheLook`, `CraftStory`, `Gallery`, `Personalizer`, `PriceBreakdown`, `ProductFAQ`, `RentalCalendar`, `Reviews`, `RingSize`, `StickyBar` |
| `src/components/cart/` | Bag modules shared by `CartDrawer` and `pages/Cart` | `CartLineItem`, `CartUpsell`, `GiftOptions`, `RewardProgress`, `UndoToast`, `useCartTotals.ts` |
| `src/components/tryon/` | Virtual try-on | `TryOnProvider`, `TryOnStudio` (lazy), `TryOnButton`, `JewelryOverlay`; the live 3D ring try-on `RingTryOn` (lazy again, with `fingerPose` and `handTracker`) |
| `src/components/menu/` | Desktop menu | `SiteMenu` (lazy, from `Header`), `Burger`, `search.ts` |
| `src/components/splash/` | The intro | `Splash` |
| `src/components/transition/` | Page transitions | `PageTransition`, `transitions.ts` |
| `src/components/brand/` | Brand mark | `Ampersand` |
| `src/lib/stage.ts` | Stage cover and intro mode | `coverStage`, `clearStage`, `onStageClear`, `INTRO`, `markIntroSeen` |
| `src/components/video/` | Shoppable video | `ShoppableVideos`, `VideoViewer`, `useInViewPlay.ts` |
| `src/components/giftcard/` | Gift-card visuals and balance lookup | `GiftCardArt`, `BalanceChecker` |

Generated or ignored folders (`.gitignore`): `node_modules/`, `dist/`, `build/`, `.vite/`, and others.

### 1.3 Module dependency diagram

An arrow means "imports".

```text
index.html  (<script type="module" src="/src/main.tsx">)
  └─► src/main.tsx ──► src/index.css   (Google Fonts @import · Tailwind v4 · :root tokens · utilities)
        └─► src/App.tsx   (provider tree + Routes switch; all 9 pages imported statically)
              ├─► src/store.tsx ──────────────────────────────► data/catalog.ts, data/giftcards.ts
              ├─► components/tryon/TryOnProvider.tsx ─lazy()─► tryon/TryOnStudio.tsx ─► tryon/JewelryOverlay.tsx
              │                                                     └─lazy()─► tryon/RingTryOn.tsx ─► designer/three/tryOnStage.ts (three.js) · tryon/handTracker.ts (MediaPipe)
              ├─► components/SmoothScroll.tsx ──► lenis · gsap + gsap/ScrollTrigger · store
              ├─► components/{Header,Footer,CartDrawer}.tsx ──► cart/* · shared · store · data
              └─► pages/*.tsx
                    ├─► components/{home,pdp,cart,tryon,video,giftcard}/*
                    ├─► shared: Price · ProductCard · WishButton · RecentlyViewed · HomeHero
                    │           useReveal · lineDetails · SmoothScroll.getLenis · home/SectionHeader
                    ├─► src/store.tsx  (useStore · href · lineKey · types)
                    ├─► src/data/*.ts
                    └─► src/lib/shopify.ts   (pages/Checkout only) ─► data/catalog, data/giftcards
                                             (+ type-only CartLine from store)

data layer: giftcards.ts, media.ts, costing.ts ─► catalog.ts ;  catalog.ts and tax.ts import nothing
```

### 1.4 Edges that cross the nominal layering

- `src/components/lineDetails.ts` (shared) imports `describePersonalization` from `src/components/pdp/Personalizer.tsx`.
- `src/components/home/SectionHeader.tsx` is imported by `RecentlyViewed.tsx`, `pdp/CompleteTheLook.tsx`, `pdp/PriceBreakdown.tsx`, `pdp/ProductFAQ.tsx`, `pdp/Reviews.tsx`, `video/ShoppableVideos.tsx`, `pages/Product.tsx` and `pages/GiftCards.tsx`, as well as by the home sections `CategoryIndex`, `Treasured` and `SocialGrid`.
- `src/components/pdp/Accordion.tsx` is used by `pages/Product.tsx`, `pages/GiftCards.tsx` and `pdp/ProductFAQ.tsx`.
- `src/components/pdp/RentalCalendar.tsx` exports `isBookingValid`, which `pages/Product.tsx` and `pdp/CompleteTheLook.tsx` use.
- `src/components/tryon/TryOnButton.tsx` is used by `ProductCard`, `pdp/Gallery`, `pdp/StickyBar`, `cart/CartLineItem`, `video/VideoViewer`, `home/TryOnFeature`, `pages/Category`, `pages/Wishlist` and `pages/Product`.
- `src/components/giftcard/GiftCardArt.tsx` is used by `cart/CartLineItem` and by `pages/{Category,Checkout,Account,GiftCards}`. `BalanceChecker` is used by `pages/{Account,GiftCards}`.
- `getLenis()` from `src/components/SmoothScroll.tsx` is imported by `CartDrawer`, `pages/Product`, `tryon/TryOnStudio`, `pdp/Reviews` and `video/VideoViewer`.
- `localStorage` is touched outside the store by `src/data/giftcards.ts` (ledger) and `src/components/pdp/Reviews.tsx` (customer reviews).
- There are no runtime import cycles. `src/lib/shopify.ts` imports only a type from `src/store.tsx`, and `TryOnStudio.tsx` imports only the `TryOnRequest` type from `TryOnProvider.tsx`.

---

## 2. Boot sequence

### 2.1 From HTML to the first render

1. **`index.html`** holds Figma Make comment slots around the mount point:
   - `<html lang="<!-- figma:lang -->">` and `<title><!-- figma:title --></title>`
   - `<!-- figma:head-start -->`, `<!-- figma:head-end -->`, `<!-- figma:body-start -->`, `<!-- figma:body-end -->`
   - `<div id="root"></div>` and `<script type="module" src="/src/main.tsx"></script>`
2. **The `figmaSiteConfiguration` Vite plugin** (`vite.config.ts`, `transformIndexHtml` with `order: 'pre'`, active in both dev and build) fills the slots from `.figma/make/site.json`:
   - `lang` becomes `en-CA` (`language`).
   - The title becomes the HTML-escaped `Teresa &amp; Sons — Fine Jewellery in Montréal since 1962` (`title`).
   - The `head-end` slot receives `customScripts.headEnd`: the `favicon.ico` (`sizes="32x32"`) and `apple-touch-icon.png` links, `theme-color` `#121110`, and `og:site_name` / `og:type` / `og:locale`. The other custom-script slots become empty.
   - It injects `<meta name="description">` with the site.json description, `<meta name="robots" content="noindex, nofollow">` (because `robots.index` is `false`), `<link rel="icon" href="/favicon.svg">`, `og:title` / `og:description`, and `og:image` / `twitter:card` / `twitter:image` for `/og-image.jpg`.
   - It adds no analytics and no skip link, because `accessibility.addBypassLinks` is `false`. The app renders its own "Skip to content" button instead.
   - `robots.txt` (`User-agent: *` / `Disallow: /`) is served by dev middleware and emitted as a build asset.
   - These are the site-wide values. After the first render, `Routes` replaces `document.title` and the meta description per route (§3.7). The `og:*` tags never change.
3. **`src/main.tsx`** imports `React`, `ReactDOM` (`react-dom/client`), `App` and then `./index.css`. It calls `ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)`. There is no other bootstrap code: no service worker, analytics or polyfills.
4. **`src/index.css`** loads Google Fonts with `@import url(…)` (Baskervville, Jost, Pinyon Script), then `@import 'tailwindcss'`. It also defines the colour tokens on `:root`, the `html` base styles, the utilities (`.font-serif-editorial`, `.font-spec`, `.link-line`, `.editorial-zoom`, `.film-grain`, …) and the Lenis CSS. See [design-system.md](design-system.md).
5. **First render.** `StoreProvider`'s lazy `useState` initialisers read `window.location.hash` and `localStorage` synchronously. The first paint therefore already shows the deep-linked page, the persisted currency, cart count, wishlist and account.
6. **After the first commit:**
   - The store's persistence effects write the cart, meta, wishlist, recent and account slices back to `localStorage`. Currency is written only by `setCurrency`.
   - The `hashchange` listener is attached.
   - `SmoothScroll` creates Lenis (unless `prefers-reduced-motion: reduce` matches), resets scroll to 0 and schedules `ScrollTrigger.refresh()`.
   - In development, `React.StrictMode` runs every effect twice (mount, cleanup, mount), so Lenis is created, destroyed and created again.

### 2.2 Provider tree (exact nesting)

```text
<React.StrictMode>                                        src/main.tsx
  <App>                                                   src/App.tsx — no state, no hooks
    <StoreProvider>                                       src/store.tsx → StoreContext
      <TryOnProvider>                                     src/components/tryon/TryOnProvider.tsx → TryOnContext
        <SmoothScroll>                                    src/components/SmoothScroll.tsx → returns <>{children}</>
          <div className="min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]">
            <button onClick={skipToContent}>              "Skip to content": sr-only until focused; focuses <main>
            <Header />
            <main tabIndex={-1}><Routes /></main>         Routes: switch (route.name), defined in App.tsx, not exported
            <Footer />
            <CartDrawer />                                always mounted; slides in when cartOpen
            <div className="film-grain" aria-hidden />
          </div>
        </SmoothScroll>
        {req && <Suspense fallback={null}><TryOnStudio request={req} onClose={…} /></Suspense>}
      </TryOnProvider>
    </StoreProvider>
  </App>
</React.StrictMode>
```

| Layer | Provides | Requires |
|---|---|---|
| `React.StrictMode` | Development-only double render and effect checks | — |
| `App` | Composition only | — |
| `StoreProvider` | The `StoreContext` value (§4) | `window.location`, `localStorage` |
| `TryOnProvider` | `TryOnContext` `{ openTryOn, canTryOn }`; renders the lazy `TryOnStudio` overlay after its children while a request is set | Must be inside `StoreProvider`, because `TryOnStudio` calls `useStore()` |
| `SmoothScroll` | No context. Side effects only: the Lenis singleton (`getLenis()`), ScrollTrigger sync and scroll-to-top on route change | Must be inside `StoreProvider`, because it reads `route` |
| Shell `div` | Page background and text colour tokens | — |
| `Header`, `Footer`, `CartDrawer` | Global chrome that persists across routes | `Header` and `CartDrawer` call `useStore()`. `CartDrawer` renders `TryOnButton` through `CartLineItem`, so it needs `TryOnProvider`. |
| `Routes` | Page selection, plus the per-route tab title and meta description (`headFor`) | `useStore()` |

### 2.3 Why the order matters

- `useStore()` throws `'useStore must be used inside StoreProvider'` and `useTryOn()` throws `'useTryOn must be used inside TryOnProvider'`, so the nesting is load-bearing.
- `TryOnStudio` is rendered by `TryOnProvider` and reads `currency` and `addToCart` from the store. That is why `TryOnProvider` sits inside `StoreProvider`.
- `SmoothScroll` needs `route`, so it also sits inside `StoreProvider`.
- `TryOnButton`s appear in pages and in the drawer, so the whole shell sits inside `TryOnProvider`.
- `TryOnStudio` renders after `{children}`: it comes after the shell `div` in the DOM and outside `SmoothScroll`'s subtree. It reaches Lenis through the module singleton `getLenis()`, not through React.
- Only `Routes` sits inside `<main>`. The header, footer, cart drawer, film grain and try-on studio live outside it, so they survive hash changes.
- `App` has no state, so after mount only context consumers re-render when the store changes. A component that never calls `useStore()`, such as `Footer`, is not re-rendered by store updates.

### 2.4 Overlay stack, portals and scroll locks

| Overlay | Rendered by / where | Stacking | Scroll lock | Keyboard | Across route changes |
|---|---|---|---|---|---|
| `Header` | Shell | `sticky top-0 z-50` | — | — | Persists |
| Header mobile menu | Inline in `Header` | `fixed inset-0 z-[70]` | None (`data-lenis-prevent` only) | — | Closed by `Header`'s `useEffect(…, [route])` |
| PDP `StickyBar` | Inline in `pages/Product` | `fixed inset-x-0 bottom-0 z-40` | — | — | Unmounts with the page |
| Film grain | Shell (`.film-grain`) | CSS `z-index: 60`, `pointer-events: none` | — | — | Persists |
| `CartDrawer` backdrop / panel | Shell (in-tree, not portaled) | `z-[80]` / `z-[90]` | While `cartOpen`: `getLenis()?.stop()` and `document.body.style.overflow = 'hidden'`; the previous value is restored on close | `Escape` closes (listener only while open); close button focused after 50 ms | Persists (`cartOpen` is store state); drawer links call `close` |
| Gallery lightbox | Inline in `pdp/Gallery` | `fixed inset-0 z-[95]` | None (`data-lenis-prevent` only) | `Escape`, `ArrowLeft` / `ArrowRight` | Unmounts with the page |
| Ring-size guide | Inline in `pdp/RingSize` | `fixed inset-0 z-[95]` | None (`data-lenis-prevent` only) | `Escape` | Unmounts with the page |
| `VideoViewer` | `createPortal(…, document.body)` from `video/ShoppableVideos` | `fixed inset-0 z-[100]` | `getLenis()?.stop()`; `document.documentElement.style.overflow = 'hidden'`, reset to `''` | `Escape`, arrow keys, space | Unmounts with its page |
| Reviews `MediaLightbox` / `WriteReview` | `createPortal(…, document.body)` from `pdp/Reviews` | `z-[100]` | `useModalLock()`: same as `VideoViewer` | Lightbox: `Escape` and arrows. Write form: no key handler (backdrop or X closes it). | Unmount with the page |
| `TryOnStudio` | `TryOnProvider`, after the shell | `fixed inset-0 z-[110]` | `getLenis()?.stop()`; `document.documentElement.style.overflow = 'hidden'`, reset to `''` | `Escape` | Persists (state lives in `TryOnProvider`); studio links call `onClose` |

Scrollable areas that must bypass Lenis carry `data-lenis-prevent`: the drawer body, mobile menu, Gallery lightbox, ring-size dialog, VideoViewer root, Reviews lightbox and form, and the TryOnStudio root and side panel. The ShoppableVideos rail uses `data-lenis-prevent-wheel`.

---

## 3. Routing (hash router in `src/store.tsx`)

### 3.1 The `Route` union

```ts
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
```

### 3.2 `parseHash()` rules, in evaluation order

`parseHash` first computes `parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)` and then checks the rules in this order.

| # | Condition | Example hashes | Route object | Rendered by `Routes` in `src/App.tsx` |
|---|---|---|---|---|
| 1 | `parts[0] === 'shop'` | `#/shop`, `#/shop?q=pearl` | `{ name: 'shop', query }` | `<Shop key={queryString(route.query)} query={route.query} />` |
| 2 | `parts[0] === 'c' && parts[1]` | `#/c/rings`, `#/c/bridal?type=engagement` | `{ name: 'category', slug, query }` | `<Category key={route.slug + queryString(route.query)} … />` |
| 3 | `parts[0] === 'gift-cards' \|\| (parts[0] === 'p' && parts[1] === 'gift-card')` | `#/gift-cards`, `#/p/gift-card` | `{ name: 'giftcards' }` | `<GiftCards />` |
| 4 | `parts[0] === 'p' && parts[1]` | `#/p/teresa-signet`, `?mode=rent` | `{ name: 'product', slug, query }` | `<Product key={route.slug + (route.query.mode ?? '')} … />` |
| 5 | `parts[0] === 'atelier'` | `#/atelier` | `{ name: 'atelier' }` | `<Atelier />` |
| 6 | `parts[0] === 'designer'` | `#/designer`, `#/designer?r=<code>&step=band`, `?from=bonsecours` | `{ name: 'designer', query }` | `<Suspense …><Designer key={route.query.r ?? route.query.from ?? ''} query={route.query} /></Suspense>` (lazy, 2026-10-22; see [features/ring-designer.md](features/ring-designer.md)) |
| 7 | `parts[0] === 'checkout'` | `#/checkout` | `{ name: 'checkout' }` | `<Checkout />` |
| 8 | `parts[0] === 'cart'` | `#/cart` | `{ name: 'cart' }` | `<Cart />` |
| 9 | `parts[0] === 'wishlist'` | `#/wishlist` | `{ name: 'wishlist' }` | `<Wishlist />` |
| 10 | `parts[0] === 'account'` | `#/account` | `{ name: 'account' }` | `<Account />` |
| 11 | Anything else | empty hash, `#`, `#/`, `#/c`, `#/p`, `#/shop`, `#reviews` | `{ name: 'home' }` | `<Home />`, through the `default:` branch (there is no explicit `case 'home'`) |

Rule 2 runs before rule 3 so that the catalog's `gift-card` product (`tns-gf-003`) opens the gift-card builder instead of a product page. `ProductCard` links to it as `#/p/gift-card`, both in the `gifts` category grid and in `GiftFinder` results.

### 3.3 Normalisation details

- Only the leading `#` and at most one `/` are stripped, and empty segments are dropped. So `#c/rings`, `#/c/rings/` and `#//c//rings` all resolve to category `rings`.
- Segments after the second are ignored: `#/p/teresa-signet/extra` is product `teresa-signet`, and `#/gift-cards/anything` is the gift-card page.
- Matching is case-sensitive. There is no `decodeURIComponent` and no query-string handling, so `#/p/teresa-signet?x=1` yields the slug `teresa-signet?x=1`.
- The router does not validate slugs. Pages handle unknown slugs (§3.8).

### 3.4 The `href` helper (verbatim)

```ts
const at = (path: string) => `#${prefix}${path}`

/** Links, in the language on screen. */
export const href = {
  get home() { return at('/') },
  category: (slug: string) => at(`/c/${slug}`),
  product: (slug: string) => at(`/p/${slug}`),
  get atelier() { return at('/atelier') },
  // …checkout, cart, wishlist, account, giftcards: getters in the same shape
}
```

Since 2026-10-21 the address carries the language: `prefix` is `''` in English and `/fr` in French, so links read `#/c/rings` or `#/fr/c/rings`. `splitHash(hash)` returns `{ path, lang }`, `parseHash` ignores the prefix, and `bareHash(hash)` gives the page part for comparisons (PageTransition's visits and scroll memory use it). `syncLocale` keeps the address in the visitor's language on every `hashchange` (`history.replaceState`). Full description: [features/languages.md](features/languages.md) §5.

### 3.5 How navigation is performed

- **Every in-app navigation is declarative.** Each link is an `<a href={href.…}>`. The browser changes the hash and fires `hashchange`, and `StoreProvider`'s listener calls `setRoute(parseHash())`.
- **Nothing navigates programmatically.** A grep of `src` finds no writes to `location.hash`, no `history.pushState`/`replaceState`, no `popstate` listener and no router library. `window.location.hash` is only read, and only inside `parseHash`.
- **Opening the bag is not a navigation.** It is `setCartOpen(true)`, called by the Header bag button (`aria-label="Open bag"`), the PDP "Go to bag" state and every `addToCart`.
- **Persistent overlays close themselves on navigation.**
  - `CartDrawer` links use `onClick={close}`, and the drawer passes `onNavigate={close}` to `CartLineItem`, `CartUpsell` and `RecentlyViewedStrip`.
  - `TryOnStudio` and `VideoViewer` links use `onClick={onClose}`.
- **In-page jumps are programmatic, never `#id` links.** `Product.tsx` uses `document.getElementById(...)` with `getLenis().scrollTo(el, { offset })` and falls back to `scrollIntoView` (§8.1).
- **Some anchors are not route links:**
  - `SocialGrid` tiles use `href="#/"` with `onClick={(e) => e.preventDefault()}`, so they don't navigate.
  - `VisitSalon` "Get directions" is an external Google Maps link (`target="_blank" rel="noreferrer"`).
  - `TryOnStudio` "Save photo" is `<a href={shot} download={`${product.slug}-try-on.png`}>`, a PNG data URL.
  - `Wishlist` "Copy link" writes `${location.origin}${location.pathname}#/wishlist` to the clipboard.

Every use of the `href` map, by file:

| File | Targets (`href.*`) and link text | Notes |
|---|---|---|
| `src/components/Header.tsx` | Desktop nav: `category('bridal')` "Bridal", `category('rentals')` "Rentals", `atelier` "Atelier". Logo: `home`. Icons: `account` (aria-label `Account, {name}` or `Sign in`), `wishlist`. Mega menu: `category(c.slug)` for all 9 categories, `giftcards` "Gift Cards", `product(p.slug)` for the first 2 products of the hovered category, `category(cat.slug)` image block "Shop {name} →". Mobile menu: `category(c.slug)` ×9, `atelier` "The Atelier", `giftcards` "Gift Cards", `account` ("My Account" / "Sign In"), `wishlist` "Wishlist ({n})" | "Shop" is a `<button>` that toggles the mega menu, not a link |
| `src/components/Footer.tsx` | `category(c.slug)` ×9; `atelier` "Our Story" and "Book an Appointment"; `giftcards` "Gift Cards & Balance" | "GIA & Certification", "Care & Repairs" and "Shipping & Returns" are plain `<li>` text, not links |
| `src/components/CartDrawer.tsx` | Empty state: `category('necklaces')`, `category('earrings')`, `category('rings')`, `giftcards` "Gift cards". Footer: `checkout` "Secure checkout", `cart` "View full bag" | All use `onClick={close}`; this is the only use of `href.cart` |
| `src/components/cart/CartLineItem.tsx` | `productHref` is `href.giftcards` for gift-card lines and `href.product(p.slug)` otherwise; used on the image, the name and "Edit" | `onClick={onNavigate}` |
| `src/components/cart/CartUpsell.tsx` | `product(p.slug)` on the image, the name and "Options" | `onClick={onNavigate}` |
| `src/components/RecentlyViewed.tsx` | `RecentlyViewedStrip` rows: `product(p.slug)` | `onClick={onNavigate}` |
| `src/components/ProductCard.tsx` | The whole card: `product(product.slug)` | Inner `WishButton` and `TryOnButton` call `preventDefault()` and `stopPropagation()` |
| `src/components/HomeHero.tsx` | Slide CTAs: `category('necklaces')` "Discover necklaces", `category('bridal')` "Explore bridal", `category('rentals')` "View rentals" | Defined in the module-level `SLIDES` |
| `src/components/home/*` | `CategoryIndex`: `category(c.slug)`. `FourCs`: `category('bridal')` "Shop certified diamonds", `atelier` "Book a diamond viewing". `GiftFinder`: `category('gifts')` "All gifts", `atelier` "Ask the concierge". `Services`: `atelier` "Speak with our concierge". `Treasured`: `category('necklaces')` "Continue the discovery". `VisitSalon`: `atelier` "Book an appointment". `WatchSpotlight`: `product(w.slug)` | — |
| `src/components/pdp/*` | `CompleteTheLook`: `product(p.slug)`. `ProductFAQ`: `atelier` "Contact concierge" | — |
| `src/components/tryon/TryOnStudio.tsx` | `product(product.slug)` with label "Choose dates", "Personalize this piece" or "Choose size & options"; `atelier` "See it in person — book a viewing" | `onClick={onClose}` |
| `src/components/video/VideoViewer.tsx` | `product(p.slug)` on the mobile product chips, the desktop product rows and "Select options" | `onClick={onClose}` |
| `src/pages/Home.tsx` | `category('bridal')` "Explore bridal", `atelier` "Design your own" and "Commission a piece", `category('rentals')` "View the rental vault" | — |
| `src/pages/Category.tsx` | `home` "Return home" (not-found state) and the "Maison" breadcrumb; `giftcards` (gifts-category banner, "Send a gift card") | — |
| `src/pages/Product.tsx` | `home` (breadcrumb "Maison"), `category(category.slug)` (breadcrumb and "View all"), `atelier` "Book a viewing" and "Ask a jeweller" | — |
| `src/pages/Cart.tsx` | `category('necklaces')` "Find your piece", `giftcards` "Gift cards", `checkout` "Secure checkout", `atelier` "Book a private consultation" | — |
| `src/pages/Checkout.tsx` | `home` "Return to the maison" and "Continue shopping", `account` "View in your account" | — |
| `src/pages/GiftCards.tsx` | `category('gifts')` (breadcrumb "Gifts"), `atelier` "Contact concierge" | — |
| `src/pages/Wishlist.tsx` | `account` "Sign in", `category('rings')` "Explore Rings" | — |
| `src/pages/Account.tsx` | Tiles: `category('necklaces')` "Start shopping", `wishlist` "View wishlist", `atelier` "Book a sizing" and "Book an appointment"; `giftcards` "Send one" | — |

### 3.6 Remounting with `key={route.slug}`

`Category` and `Product` receive `key={route.slug}`. Moving between two categories, or between two products, unmounts and remounts the page:

- All local state starts fresh: sort order on `Category`; on `Product`, the metal, rental period, booking, engraving, size, personalization, error flags and the `added` state.
- The `useReveal` and GSAP contexts are rebuilt.
- `Product`'s `hadHistory` snapshot and its `recordView` effect run again.

`Product` also resets `metal`, `engraving`, `size` and `sizeError` in an effect on `[slug, product]`. Other pages have no slug and remount only when `route.name` changes.

### 3.7 What happens on every route change

`route` is a new object on every `hashchange`, even when it parses to the same page, so the following run every time:

1. `Pages` (in `App.tsx`) runs its effect on `[route]`: `document.title` and `<meta name="description">` follow `headFor(route)` at once.
   - Category: "{name} — Teresa & Sons" and the category's `description`. Product: "{name} — Teresa & Sons" and "{tagline} {description}". Unknown slugs: "Chapter not found" or "Piece not found", with the site description.
   - Wishlist, Gift Cards, Your Account, Your Bag, Checkout and The Atelier: "{label} — Teresa & Sons" with the site description.
   - Home restores the site-wide title and description. `App.tsx` reads them once at load from the `og:title` / `og:description` tags that `site.json` fills, because nothing changes those.
2. `PageTransition` takes the visitor across. The old page leaves under cover, then `Routes` swaps to the new route out of sight (remount rules above). Scroll goes to the top, or back to the remembered position when moving back, and the new page enters. See [motion-and-interaction.md](motion-and-interaction.md) "Splash and page transitions" and §11.1.
3. `Header` runs its effect on `[route]`: `setMegaOpen(false)` and `setMobileOpen(false)`.
4. Nothing resets `cartOpen` or the try-on request. An open drawer or studio stays open over the new page, for example after the browser Back button.
5. Clicking a link whose `href` equals the current hash does not fire `hashchange`, so none of the above runs.

### 3.8 Unknown routes and unknown slugs

- An unknown hash falls through to `{ name: 'home' }` and renders `<Home />`. The URL stays as typed.
- `#/c/<unknown>` renders `Category`'s fallback: "This chapter could not be found." with a "Return home" link to `href.home`.
- `#/p/<unknown>` renders `Product`'s fallback: "This piece has returned to the vault."
- Valid category slugs are the nine `CATEGORIES` slugs: `necklaces`, `earrings`, `bracelets`, `rings`, `bridal`, `watches`, `rentals`, `gifts`, `custom`.

---

## 4. Store API (`src/store.tsx`)

### 4.1 Exports

| Export | Kind | Notes |
|---|---|---|
| `Route` | type | The union in §3.1 |
| `CartLine` | interface | §4.2 |
| `href` | const | §3.4 |
| `Account` | interface | `{ name: string; email: string }` |
| `CartMeta` | interface | `{ giftWrap: boolean; giftReceipt: boolean; giftMessage: string; note: string }`. Doc comment: "Order-level options; map to Shopify cart `note` and `attributes`." |
| `lineKey` | const function | §4.4 |
| `StoreProvider` | component | `({ children }: { children: ReactNode })` |
| `useStore` | hook | Returns `StoreValue`; throws outside the provider |

Module-private, not exported: `parseHash`, `load<T>(key, fallback)` (`JSON.parse` of `localStorage.getItem` in try/catch, returning `fallback` when missing or on error), `DEFAULT_META` (`{ giftWrap: false, giftReceipt: false, giftMessage: '', note: '' }`), the `StoreValue` interface and `StoreContext` (`createContext<StoreValue | null>(null)`). The file has no default export.

### 4.2 `CartLine` (verbatim)

```ts
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
```

The referenced types come from the data layer:

- `Metal`: `'18k-yellow' | '18k-white' | '18k-rose' | 'platinum' | 'vermeil'`
- `RentalBooking`: `{ start: string; slot: string; method: 'courier' | 'salon' }`, where `start` is `yyyy-mm-dd`
- `Personalization`: `{ text; font: 'script' | 'serif' | 'block'; accent?; chainLength? }`
- `GiftCardLine`: `{ amount; currency; design; delivery: 'email' | 'physical'; toSelf; recipientName?; recipientEmail?; senderName?; message?; sendOn? }`

See [data-model.md](data-model.md).

### 4.3 `StoreValue` reference

| Member | Type | Implementation | Semantics and edge cases |
|---|---|---|---|
| `route` | `Route` | `useState<Route>(parseHash)`; a `hashchange` listener (effect, `[]` deps) calls `setRoute(parseHash())` | Current page. A new object on every `hashchange`. |
| `currency` | `Currency` (`'CAD' \| 'USD'`) | `useState<Currency>(START_CURRENCY)` | Pricing and display currency, and the market: it also chooses Canadian or US English. Defaults to `'CAD'`; the stored value is validated (`loadCurrency`). |
| `setCurrency` | `(c: Currency) => void` | `useCallback(…, [])` | Re-points the locale (`syncLocale`) before the render, then `setCurrencyState(c)` plus a synchronous `localStorage.setItem('tns-currency', c)`. |
| `lang` / `setLang` | `Lang` (`'en' \| 'fr'`) / `(lang: Lang) => void` | `useState<Lang>(START.lang)` / `useCallback(…, [])` | The language. `setLang` stores `tns-lang`, answers the notice, and runs the swap through `runSwitch` (LanguageVeil) with `flushSync`. Also exposed with the locale through `LocaleContext` (`useLocale()`). |
| `langOrigin` | `LangOrigin` | module constant `START.origin` | How the visit's language was decided (`source`, `stored`, `browser`, `both`), for `LanguageNotice`. |
| `langHintSeen` / `dismissLangHint` | `boolean` / `() => void` | `useState(() => load('tns-lang-hint', false))` | Whether the language notice is done. |
| `cart` | `CartLine[]` | Lazy `JSON.parse(localStorage.getItem('tns-cart') \|\| '[]')` inside try/catch, falling back to `[]` | Lines in insertion order. Persisted by an effect on `[cart]`. Not checked against the catalog. |
| `cartOpen` | `boolean` | `useState(false)` | Drawer visibility. In memory only; navigation does not reset it. |
| `setCartOpen` | `(o: boolean) => void` | The raw `useState` setter (stable) | Opens or closes the drawer. |
| `addToCart` | `(line: Omit<CartLine, 'key' \| 'qty'>) => void` | `useCallback(…, [])` | Adds 1 to an existing line with the same `lineKey`, or appends the line with `qty: 1`; then always calls `setCartOpen(true)`. Never validates. See §4.5. |
| `updateQty` | `(key: string, qty: number) => void` | `useCallback(…, [])` | `qty <= 0` filters the line out and records nothing for undo. Any other value is set as given, with no clamp. |
| `removeLine` | `(key: string) => void` | `useCallback(…, [])` | Removes the line and remembers `{ line, index }` for undo, if the line was found. |
| `undoRemove` | `() => void` | `useCallback(…, [])` | Re-inserts the remembered line at its old index unless a line with the same key already exists; always clears the memory. |
| `lastRemoved` | `CartLine \| null` | Derived: `lastRemoved?.line ?? null` | The last removed line; the index stays internal. Single level, in memory only. |
| `clearCart` | `() => void` | `useCallback(…, [])` | Sets `cart` to `[]`, `meta` to `DEFAULT_META` and `lastRemoved` to `null`. |
| `meta` | `CartMeta` | Lazy `({ ...DEFAULT_META, ...load<Partial<CartMeta>>('tns-cart-meta', {}) })` | Order-level gift wrap, gift receipt, gift message and note. Persisted on change. |
| `setMeta` | `(patch: Partial<CartMeta>) => void` | `useCallback(…, [])` | Shallow merge: `{ ...m, ...patch }`. |
| `wishlist` | `string[]` | Lazy `load('tns-wishlist', [])` | Product slugs, oldest first (toggling on appends). Persisted. |
| `toggleWishlist` | `(slug: string) => void` | `useCallback(…, [])` | Removes the slug if present, otherwise appends it. |
| `isWished` | `(slug: string) => boolean` | `useCallback(…, [wishlist])` | `wishlist.includes(slug)`. Its identity changes whenever `wishlist` changes. |
| `user` | `Account \| null` | Lazy `load('tns-account', null)` | Demo account. Persisted; the key is removed when `user` is `null`. |
| `signIn` | `(user: Account) => void` | `useCallback(…, [])` | `setUser(user)`. No authentication or validation. |
| `signOut` | `() => void` | `useCallback(…, [])` | `setUser(null)`. |
| `recent` | `string[]` | Lazy `load('tns-recent', [])` | Viewed product slugs, most recent first, at most 12 ("Most recent first, capped at 12, persisted per device."). |
| `recordView` | `(slug: string) => void` | `useCallback(…, [])` | Returns the same array when `slug` is already first (no re-render, no write). Otherwise produces `[slug, ...r.filter((s) => s !== slug)].slice(0, 12)`. |
| `clearRecent` | `() => void` | `useCallback(…, [])` | `setRecent([])`. |
| `searches` | `string[]` | Lazy `load('tns-searches', [])`, kept only if an array of non-empty strings, at most 5 | What the visitor searched for and followed (2026-10-22), most recent first; the header search lists four. |
| `rememberSearch` | `(query: string) => void` | `useCallback(…, [])` | Trims, collapses spaces, cuts at 80 characters, ignores under 2; moves it to the front without a case-insensitive repeat, keeps 5. |
| `forgetSearches` | `() => void` | `useCallback(…, [])` | `setSearches([])` (the dropdown's `Clear`). |
| `designs` | `SavedDesign[]` (`{ code, image, saved }`) | Lazy `load('tns-designs', [])`, kept only when each code decodes, at most 12 | Rings designed and kept on this device, newest first (2026-10-22). |
| `saveDesign` / `forgetDesign` | `(design: SavedDesign) => void` / `(code: string) => void` | `useCallback(…, [])` | Puts a design first (replacing the same code) / removes it. |
| `designDraft` / `setDesignDraft` | `string \| null` / `(code: string \| null) => void` | Lazy `load('tns-design-draft', null)`, kept only when it decodes | The ring being designed, so the designer reopens it. |
| `linePrice` | `(line: CartLine) => number` | `useCallback(…, [currency])` | Line total (unit price × `qty`) in the current currency. See §4.6. |
| `subtotal` | `number` | Computed inside the value `useMemo` | `cart.reduce((s, l) => s + linePrice(l), 0)`. **No consumer reads it.** |
| `count` | `number` | Computed inside the value `useMemo` | `cart.reduce((s, l) => s + l.qty, 0)`. Shown as the header bag badge. |

### 4.4 Cart-line identity: `lineKey`

```ts
/** Identity of a configured piece; identical configurations stack in one line. A design joins the key only when there
 *  is one, so every other line keeps the key it was stored with. */
export const lineKey = (line: Omit<CartLine, 'key' | 'qty'>) =>
  [line.slug, line.metal, line.rental, line.engraving, line.size, JSON.stringify(line.booking ?? ''), JSON.stringify(line.personalization ?? ''), JSON.stringify(line.giftCard ?? ''), ...(line.design ? [line.design] : [])].join('|')
```

- `Array.prototype.join` turns `undefined` fields into empty strings. Objects are compared through `JSON.stringify`, which is sensitive to property insertion order and omits `undefined` properties.
- A designed ring's `design` is its `designCode` (the ring as made), so two rings made the same stack.
- `pages/Product.tsx` uses the same function to compute `inBag`, which switches the CTA to "Go to bag".

### 4.5 Cart mutation semantics

- **`addToCart(line)`**
  - Computes `key = lineKey(line)` once.
  - The `setCart` updater either maps the matching line to `{ ...l, qty: l.qty + 1 }` or appends `{ ...line, key, qty: 1 }`.
  - Then it calls `setCartOpen(true)` unconditionally.
  - Because it uses the updater form, repeated calls in one event accumulate correctly. `pages/GiftCards.tsx` relies on this when it calls `addToCart` `qty` times in a loop.
  - It has no quantity cap. Only `CartLineItem`'s "+" control clamps, via `Math.min(10, line.qty + 1)`.
- **Callers of `addToCart`:**

  | Caller | Payload |
  |---|---|
  | `pages/Product.tsx` (`handleAdd`) | The full `configured` object (§8.1) |
  | `pdp/CompleteTheLook.tsx` (`addSet`) | Non-rental: `{ slug, metal: p.metals[0] }` for each look piece. Rental: `{ slug, rental: period, booking }` for each piece, after `isBookingValid` passes for all of them. |
  | `cart/CartUpsell.tsx` | `{ slug: p.slug, metal: p.metals[0] }`, only for `quickAddable` products |
  | `video/VideoViewer.tsx` | `{ slug: p.slug, metal: p.metals[0] }`, only for non-`configurable` products |
  | `tryon/TryOnStudio.tsx` (`add`) | `{ slug: product.slug, metal }`, only when `!needsConfig` |
  | `pages/Wishlist.tsx` ("Add all to bag") | `{ slug: p.slug, metal: p.metals[0] }` for items that are not rentals, not personalized and not `gift-card` |
  | `pages/GiftCards.tsx` (`submit`) | `{ slug: GIFT_CARD_SLUG, giftCard: line }`, called `qty` times |
  | `pages/Designer.tsx` (`add`) | `{ slug: 'bespoke-engagement-commission', size, design: code }`, only with a size (otherwise it opens the size step) |
  | `tryon/TryOnStudio.tsx` (a design) | The same, when the design has a size |

- **`updateQty(key, qty)`** is called only by `CartLineItem`: "−" when `qty > 1`, "+" capped at 10.
- **`removeLine(key)`**
  - Inside the `setCart` updater it finds the index, calls `setLastRemoved({ line: prev[index], index })` when found, and returns the filtered array.
  - Callers in `CartLineItem`: the X button (`aria-label` `Remove {name}`), "−" at `qty <= 1`, and "Save for later" (which also adds the slug to the wishlist when it is not already there).
- **`undoRemove()`**
  - Inside the `setLastRemoved` updater it calls `setCart((prev) => prev.some((l) => l.key === r.line.key) ? prev : [...prev.slice(0, r.index), r.line, ...prev.slice(r.index)])`, then returns `null`.
  - Its only caller is `UndoToast`'s "Undo" button, which shows "Removed {name}" for 6000 ms after each change of `lastRemoved`.
- **`clearCart()`** callers:
  - `pages/Cart.tsx` "Clear bag", guarded by `window.confirm('Remove everything from your bag?')`.
  - `pages/Checkout.tsx` `placeOrder`, after it has debited and issued gift cards.

### 4.6 Pricing: `linePrice`, `subtotal`, `count`

```ts
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
```

- Gift-card lines are checked before the product lookup. They keep their own currency and are converted for display: `convert` multiplies or divides by `CAD_TO_USD = 0.73` and rounds.
- Merchandise lines store no currency. They are repriced from the catalog's `price.CAD` / `price.USD` whenever `currency` changes.
- Engraving and size never affect price. Rental lines do not include the deposit.
- A designed ring is priced from its design (`ringPrice`, `src/data/ringPrice.ts`), not from the commission piece it rides on; a code that won't decode prices at 0.
- `subtotal` and `count` are computed inside the context `useMemo`. Cart UIs use the `useCartTotals()` hook instead (§4.9). See [commerce-logic.md](commerce-logic.md) for the formulas behind `priceFor`, `personalizationPrice` and `convert`.

### 4.7 Memoisation and re-render model

- The context value is `useMemo<StoreValue>(…)` with these dependencies: `[route, currency, setCurrency, cart, cartOpen, addToCart, updateQty, clearCart, removeLine, undoRemove, lastRemoved, meta, setMeta, linePrice, wishlist, toggleWishlist, isWished, user, signIn, signOut, recent, recordView, clearRecent]`. `setCartOpen` is a stable setter and is not listed.
- Stable identities:
  - `[]`-dependency callbacks: `setCurrency`, `addToCart`, `updateQty`, `clearCart`, `removeLine`, `undoRemove`, `setMeta`, `toggleWishlist`, `signIn`, `signOut`, `recordView`, `clearRecent`.
  - `setCartOpen`, as a React setter.
- Identities that change: `isWished` (with `wishlist`) and `linePrice` (with `currency`).
- There is one context and no selectors. Any state change, including a route change or a `cartOpen` toggle, creates a new value and re-renders all **31 `useStore()` call sites in 29 files**, including every `Price` on screen.
- Consumer effects that depend on store callbacks don't re-fire, because those callbacks are stable. Examples are `Product`'s `[product, recordView]` and `CartDrawer`'s `[cartOpen, setCartOpen]`.
- The `TryOnContext` value is `useMemo(() => ({ openTryOn, canTryOn }), [openTryOn, canTryOn])`. Both callbacks have `[]` dependencies, so the value never changes.

### 4.8 Who reads what (`useStore()` consumers)

| File | Members used |
|---|---|
| `src/App.tsx` (`Routes`) | `route` |
| `src/components/SmoothScroll.tsx` | `route` |
| `src/components/Header.tsx` | `currency`, `setCurrency`, `count`, `setCartOpen`, `route`, `wishlist`, `user` |
| `src/components/CartDrawer.tsx` | `cart`, `cartOpen`, `setCartOpen`, `currency`, `meta` |
| `src/components/Price.tsx`, `ProductCard.tsx` | `currency` |
| `src/components/WishButton.tsx` | `isWished`, `toggleWishlist` |
| `src/components/RecentlyViewed.tsx` | `recent` (in `useRecentProducts`), `clearRecent` (in `RecentlyViewed`), `currency` and `clearRecent` (in `RecentlyViewedStrip`) |
| `src/components/cart/CartLineItem.tsx` | `updateQty`, `removeLine`, `linePrice`, `toggleWishlist`, `isWished`, `currency` |
| `src/components/cart/CartUpsell.tsx` | `cart`, `currency`, `addToCart` |
| `src/components/cart/GiftOptions.tsx` | `meta`, `setMeta` |
| `src/components/cart/UndoToast.tsx` | `lastRemoved`, `undoRemove` |
| `src/components/cart/useCartTotals.ts` | `cart`, `linePrice`, `currency` |
| `src/components/home/GiftFinder.tsx`, `Services.tsx`, `WatchSpotlight.tsx` | `currency` |
| `src/components/pdp/CompleteTheLook.tsx` | `currency`, `addToCart` |
| `src/components/pdp/Personalizer.tsx`, `PriceBreakdown.tsx` | `currency` |
| `src/components/video/ShoppableVideos.tsx` (`Tile`) | `currency` |
| `src/components/video/VideoViewer.tsx`, `tryon/TryOnStudio.tsx` | `currency`, `addToCart` |
| `src/pages/Account.tsx` | `user`, `signIn`, `signOut`, `wishlist`, `currency`, `setCurrency` |
| `src/pages/Cart.tsx` | `cart`, `currency`, `clearCart`, `meta` |
| `src/pages/Category.tsx` | `currency` |
| `src/pages/Checkout.tsx` | `cart`, `currency`, `setCurrency`, `linePrice`, `clearCart` |
| `src/pages/GiftCards.tsx` | `currency`, `addToCart` |
| `src/pages/Product.tsx` | `currency`, `addToCart`, `recent`, `recordView`, `cart`, `setCartOpen` |
| `src/pages/Wishlist.tsx` | `wishlist`, `user`, `addToCart` |

### 4.9 Store-derived selector outside the store

`src/components/cart/useCartTotals.ts` (default-exported hook) derives the following from `cart`, `linePrice` and `currency`:

- `merch`, `giftCards`, `subtotal`, `count`
- `threshold`, from `REWARD_THRESHOLD = { CAD: 1000, USD: 750 }`
- `rewardProgress`, `rewardRemaining`, `rewardUnlocked`
- `installment` (`Math.round(subtotal / 4)`; the drawer and Cart page hide it beside a designed ring's balance)
- `hasMerch`, `hasRental`

`CartDrawer`, `pages/Cart` and `cart/RewardProgress` use it. `pages/Checkout` computes its own totals.

---

## 5. Persistence

### 5.1 Every storage key in `src`

A grep for `localStorage|sessionStorage|indexedDB|document.cookie` finds only `localStorage`. There is no `sessionStorage`, IndexedDB or cookie use.

| Key | Value shape | Owner | Read | Written | Failure handling |
|---|---|---|---|---|---|
| `tns-currency` | Raw string `CAD` or `USD` (not JSON) | `src/store.tsx` | Once, at module load (`loadCurrency`, `START_CURRENCY`) | Synchronously inside `setCurrency` | The read is in try/catch and validated: anything but `USD` is `'CAD'`. The write is unguarded. |
| `tns-lang` | Raw string `en` or `fr` | `src/store.tsx` | Once, at module load (`resolveLang`) | Synchronously inside `setLang` (explicit switches only) | Read in try/catch and validated. The address prefix and the browser are consulted first or after it (see [features/languages.md](features/languages.md) §5). |
| `tns-lang-hint` | JSON boolean | `src/store.tsx` | Once, via `load` | Effect on `[langHintSeen]` | `true` once the language notice has been answered, dismissed or has timed out. |
| `tns-cart` | JSON `CartLine[]` | `src/store.tsx` | Once, in the lazy initialiser | Effect on `[cart]`, including the first mount | Read is in try/catch (falls back to `[]`). Write is unguarded. No schema check. |
| `tns-cart-meta` | JSON `CartMeta`, merged over `DEFAULT_META` on read | `src/store.tsx` | Once, via `load` | Effect on `[meta]` | `load` catches errors (falls back to `{}`). Write is unguarded. |
| `tns-wishlist` | JSON `string[]` (slugs) | `src/store.tsx` | Once, via `load` | Effect on `[wishlist]` | Same as above. |
| `tns-recent` | JSON `string[]` (at most 12, most recent first) | `src/store.tsx` | Once, via `load` | Effect on `[recent]` | Same as above. |
| `tns-searches` | JSON `string[]` (at most 5, most recent first) | `src/store.tsx` | Once, via `load`, validated | Effect on `[searches]` | Same as above (2026-10-22). |
| `tns-designs` | JSON `SavedDesign[]` (at most 12, newest first; `image` a JPEG data URL) | `src/store.tsx` | Once, via `load`, validated (each code must decode) | Effect on `[designs]` | If `setItem` throws (storage full), it stores the list again without pictures (2026-10-22). |
| `tns-design-draft` | JSON string (a design code) or `null` | `src/store.tsx` | Once, via `load`, validated | Effect on `[designDraft]` | Same as `tns-wishlist` (2026-10-22). |
| `tns-account` | JSON `Account` `{ name, email }` | `src/store.tsx` | Once, via `load` (falls back to `null`) | Effect on `[user]`: `setItem` while signed in, `removeItem('tns-account')` when `null` | Same as above. |
| `tns-giftcard-ledger` | JSON `IssuedCard[]`: `{ code, initial, balance, currency, design, recipientName?, issuedAt, expiresAt }` | `src/data/giftcards.ts` (`LEDGER_KEY`) | On every `loadLedger()`: `lookupCard` (Checkout "Apply", `BalanceChecker`), `issueCards` / `debitCards` (Checkout `placeOrder`) and every render of the signed-in `pages/Account` | `saveLedger()`, called by `issueCards` and `debitCards` | Read is in try/catch (falls back to `[DEMO]`). The demo card `TERESASONS1962MT` is prepended in memory when absent and gets persisted by the next save. Write is unguarded. |
| `tns-reviews-<slug>` | JSON `Review[]`: `{ id: 'mine-<timestamp>', a, loc, t, b, stars, days: 0, media, mine: true }` | `src/components/pdp/Reviews.tsx` (`storeKey`) | Once per `Reviews` mount (`loadMine`) | `saveMine` on review submit | Read is in try/catch (falls back to `[]`). On write, video media are dropped because object URLs only live for the session; images are stored as JPEG data URLs (≤1200 px, quality 0.8). If `setItem` throws, it retries with `media: []`, and that retry is unguarded. |

### 5.2 Lifecycle facts

- Store keys are read exactly once, when `StoreProvider` mounts. Nothing listens for the `storage` event, so tabs do not sync and the last tab to write wins.
- Store writes run in passive effects after commit, except `tns-currency`, which `setCurrency` writes inside the event handler.
- On first mount every effect writes its slice back, so a fresh profile gets `tns-cart` (`[]`), `tns-wishlist`, `tns-recent`, `tns-searches` and `tns-cart-meta` immediately, and `tns-account` is removed.
- `src/data/giftcards.ts` reads the ledger fresh on every call. It never caches.

### 5.3 In-memory only (lost on reload)

- `cartOpen` and `lastRemoved`.
- The try-on request in `TryOnProvider`.
- All page-local state, for example:
  - `Checkout`: applied gift cards, chosen province and the order confirmation, which exists only in component state after `clearCart()`.
  - `Cart`: the province.
  - `PriceBreakdown`: province and US state.
  - The `GiftCards` builder fields.
  - `Account`: sign-in versus register mode.
  - `Atelier`: the `sent` flag.

---

## 6. Other providers, singletons and side-effect hubs

### 6.1 Try-on context (`src/components/tryon/TryOnProvider.tsx`)

```ts
export interface TryOnRequest {
  product: Product
  metal?: Metal
  text?: string
  /** Pieces offered in the "try another" rail. */
  list?: Product[]
}

interface Ctx {
  openTryOn: (req: TryOnRequest) => void
  canTryOn: (p: Product) => boolean
}
```

- **`canTryOn(p)`** returns `tryOnKind(p) !== null`. **`openTryOn(r)`** stores `r` only when `tryOnKind(r.product)` is truthy and ignores the request otherwise.
- **The studio is lazy.** `const TryOnStudio = lazy(() => import('./TryOnStudio'))`. While `req` is set, the provider renders `<Suspense fallback={null}><TryOnStudio request={req} onClose={() => setReq(null)} /></Suspense>` after its children. Nothing is shown while the chunk loads, and nothing preloads it.
- **`useTryOn()` has exactly one caller: `TryOnButton`.** The button returns `null` when `!canTryOn(product)`. Its click handler calls `e.preventDefault()` and `e.stopPropagation()` (the source comment reads "Often rendered inside product links."), then `openTryOn({ product, metal, text, list })`.
- **`TryOnButton` call sites:**

  | Call site | Variant and label |
  |---|---|
  | `ProductCard` | `chip`, "Try on" |
  | `pdp/Gallery` | `chip`, default "View on you" |
  | `pages/Product` | `outline`, with `metal`, personalised `text` and `list={[product, ...related]}` |
  | `pdp/StickyBar` | `icon` |
  | `pages/Category` | `link`, "Try these pieces on" |
  | `pages/Wishlist` | default variant, "Try your wishlist on" |
  | `cart/CartLineItem` | `link`, "View on you" |
  | `video/VideoViewer` | `chip`, "Try on" |
  | `home/TryOnFeature` | `solid`, "Start virtual try-on" |

Studio internals are covered in [features/virtual-try-on.md](features/virtual-try-on.md).

### 6.2 `SmoothScroll` and the Lenis singleton (`src/components/SmoothScroll.tsx`)

- **Module state.** `let lenisInstance: Lenis | null = null` with the accessor `export const getLenis = () => lenisInstance`. `gsap.registerPlugin(ScrollTrigger)` runs at module scope.
- **Mount effect** (`[]` dependencies):
  - Returns early when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. Lenis is then never created, and `getLenis()` stays `null`.
  - Otherwise it runs `new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })`.
  - `lenis.on('scroll', ScrollTrigger.update)` keeps ScrollTrigger in sync.
  - `gsap.ticker.add(tick)` drives `lenis.raf(time * 1000)`, and `gsap.ticker.lagSmoothing(0)` is set.
  - Cleanup removes the tick, calls `lenis.destroy()` and resets `lenisInstance` to `null`. `lagSmoothing` is not restored.
- **Route effect** (`[route]`): the scroll reset plus the rAF `ScrollTrigger.refresh()` described in §3.7.
- **Render:** `<>{children}</>`. It provides no context.
- **`getLenis()` consumers:**
  - `CartDrawer`, `TryOnStudio`, `VideoViewer` and `Reviews` (`useModalLock`) call `stop()` and `start()`.
  - `pages/Product` calls `scrollTo(el, { offset: -140 })` for validation errors and `scrollTo(el, { offset: -120 })` for the `price-breakdown` and `reviews` jumps.
  - When `getLenis()` returns `null`, callers fall back to `scrollIntoView` or `window.scrollTo(0, 0)`, and the overflow locks still apply.

### 6.3 GSAP plugin registration

- `ScrollTrigger` is the only GSAP plugin used. `gsap.registerPlugin(ScrollTrigger)` runs at module scope in four modules: `src/components/SmoothScroll.tsx`, `src/components/useReveal.ts`, `src/components/HomeHero.tsx` and `src/components/home/MakingScroll.tsx`. Registration is idempotent.
- Other modules import only the core `gsap`: `Header.tsx`, `WishButton.tsx`, `home/CategoryIndex.tsx`, `pdp/Gallery.tsx` and `pages/Product.tsx`.
- Animation details are in [motion-and-interaction.md](motion-and-interaction.md).

### 6.4 Global listeners, observers and timers

| Module | Mechanism | Active while |
|---|---|---|
| `src/store.tsx` | `window` `hashchange` handler calling `setRoute(parseHash())` | `StoreProvider` is mounted |
| `src/components/SmoothScroll.tsx` | `gsap.ticker` tick, Lenis `scroll` → `ScrollTrigger.update`, a one-frame rAF per route | Lenis exists, or per route change |
| `src/components/CartDrawer.tsx` | `keydown` (`Escape`); 50 ms focus timeout | `cartOpen` |
| `src/components/tryon/TryOnStudio.tsx` | `keydown` (`Escape`); camera `MediaStream`, stopped on unmount | Studio open |
| `src/components/video/VideoViewer.tsx` | `keydown` (`Escape`, arrows, space) | Viewer open |
| `src/components/pdp/Gallery.tsx` | `keydown` (`Escape`, `ArrowLeft`, `ArrowRight`) | Lightbox open |
| `src/components/pdp/Reviews.tsx` | `keydown` (`Escape`, arrows) | Media lightbox open |
| `src/components/pdp/RingSize.tsx` | `keydown` (`Escape`) | Guide open |
| `src/components/HomeHero.tsx` | `pointermove` on the hero section; `visibilitychange`; an `IntersectionObserver` on the hero; the 7 s progress tween that drives autoplay | `Home` mounted, without reduced motion |
| `src/components/home/CategoryIndex.tsx` | `pointermove` on the desktop list | `Home` mounted |
| `src/components/home/Testimonials.tsx` | `setInterval` every 6500 ms | `Home` mounted |
| `src/components/Header.tsx` | 140 ms mega-menu close timeout | After the pointer leaves the trigger or panel |
| `src/components/pdp/StickyBar.tsx`, `pdp/PriceBreakdown.tsx`, `video/useInViewPlay.ts` | `IntersectionObserver` | The component is mounted |

---

## 7. Code splitting and build facts

### Code splitting

- `lazy(() => import('./TryOnStudio'))` in `TryOnProvider.tsx` is the only dynamic import in `src`. `JewelryOverlay.tsx` is imported only by `TryOnStudio.tsx`.
- `src/App.tsx` imports all nine pages statically, and every other component sits in the main bundle.

### Build

- **Scripts in `package.json`:** `dev` (`vite`), `build` (`vite build`), `preview` (`vite preview`), `format` (`oxfmt`). There is no typecheck, lint or test script, and `build` does not run `tsc`.
- **Verified 2026-10-15** (KB preparation run; not re-run for this document):
  - `npx tsc --noEmit -p .` reports 0 errors.
  - `pnpm run build` succeeds: main JS chunk 610.47 kB (184.26 kB gzip), lazy TryOnStudio chunk 22.40 kB, CSS 78.58 kB (13.90 kB gzip), and `robots.txt` emitted.
  - There are no `*.stories.*` files and no oxfmt config file.
- **`vite.config.ts` essentials** (details in [platform-and-tooling.md](platform-and-tooling.md)):
  - `base` is `${FIGMA_PUBLIC_URL}/` when that variable is set, and `/` otherwise.
  - `mode === 'development'` (used by `deploy-preview`) emits inline sourcemaps and disables minification.
  - Plugins: `react()`, `tailwindcss()`, `figmaSiteConfiguration(siteConfiguration)`, and three serve-only plugins: `figmaErrorOverlayReplay()`, `figmaReactRefreshBoundaryFallback()` and `figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' })`.
  - Alias: `'@'` → `./src`.
  - `server` and `preview` use `host: FIGMA_DEV_SERVER_HOST || '0.0.0.0'` and `port: PORT || 8443`; `server` adds `strictPort: true` and ignores `**/.figma/**` when watching.

---

## 8. Data-flow walkthroughs

### 8.1 Add to cart from the PDP (`src/pages/Product.tsx`)

1. **Local state.** On mount, `Product` initialises:
   - `metal = product?.metals[0]`, `period = 'weekend'`, `engraving = ''`, `size = undefined`
   - `booking = { method: 'courier' }`
   - `personal = { text: '', font: fonts[0] ?? 'serif', chainLength: chainLengths?.[1] ?? chainLengths?.[0] }`
   - the error flags `bookingError`, `personalError` and `sizeError`, and `added = false`
2. **Derived values on every render:**
   - `rental = product.rental`
   - `needsSize`: true when the category is `rings` or `bridal`
   - `pcfg = product.personalization`
   - `amount`: `rental[period][currency]` for rentals, otherwise `priceFor(product, currency, metal) + personalizationPrice(product, pcfg ? personal : undefined, currency)`
   - `ctaLabel`: `'Reserve this piece'` for rentals, `'Begin commission'` for the `custom` category, `'Add to bag'` otherwise
   - the `configured` line and `inBag`:

   ```ts
   const configured = {
     slug: product.slug,
     metal: rental ? undefined : metal,
     rental: rental ? period : undefined,
     engraving: engraving.trim() || undefined,
     size: needsSize ? size : undefined,
     booking: rental ? (booking as RentalBooking) : undefined,
     personalization: pcfg ? { ...personal, text: personal.text.trim() } : undefined,
   }
   const inBag = cart.some((l) => l.key === lineKey(configured))
   ```

3. **Triggers.** The main CTA (`ref={ctaRef}`) and `StickyBar` (`onAction={onCta}`, `label={inBag ? 'Go to bag' : ctaLabel}`) both call `onCta = () => (inBag ? setCartOpen(true) : handleAdd())`. `CompleteTheLook` calls `handleAdd` through `onNeedBooking` when a rental ensemble lacks a valid booking.
4. **Validation in `handleAdd`:**
   - `bookingOk = !rental || isBookingValid(product.slug, period, booking)`
   - `personalOk = !pcfg || validatePersonalization(pcfg, personal.text) === null`
   - `sizeOk = !needsSize || !!size`
   - All three error flags are set. On failure it scrolls to the first failing step, checked in the order `step-dates`, `step-personal`, `step-size`, using `getLenis().scrollTo(el, { offset: -140 })` or `el?.scrollIntoView({ behavior: 'smooth', block: 'center' })`, and returns.
5. **Commit.** It calls `addToCart(configured)` and then `setAdded(true)`.
6. **Store.** `lineKey` either adds 1 to the matching line or appends a new one with `qty: 1`. Then `setCartOpen(true)` runs, a new `cart` produces a new context value, and the effect writes `tns-cart`.
7. **Re-renders:**
   - The Header badge shows the new `count`.
   - `CartDrawer` slides in. Its effect stops Lenis, sets `body` overflow to hidden, focuses the close button after 50 ms and listens for `Escape`.
   - `inBag` becomes true on the PDP.
8. **CTA feedback.** While `added` is true, the button uses `bg-[var(--gold-vermeil)]` and reads "Added to bag" with a check icon. An effect resets `added` after 2200 ms. The label then becomes "Go to bag" with bag and arrow icons, because `inBag` is true. Before any add, it reads `{ctaLabel} — {Price}`.

### 8.2 Currency change propagation

1. **Triggers that call `setCurrency(c)`:**
   - The Header toggle (`role="group" aria-label="Currency"`, buttons "CA · CAD" / "US · USD").
   - The signed-in Account page's "Preferred market" ("Canada" / "United States").
   - Checkout's "Shopping in" control ("Canada · CAD" / "United States · USD"). Checkout converts each applied gift card's balance with `convert(card.balance, card.currency, currency)` on every render, so any of these switchers re-prices it.
2. **Store.** `setCurrencyState(c)` runs and `tns-currency` is written synchronously. `linePrice` gets a new identity (`[currency]` dependency), and the memoised value recomputes `subtotal`.
3. **Consumers re-render.**
   - Callers recompute amounts for the new currency from catalog values: `priceFor`, `rental[period][currency]`, `rental.deposit[currency]`, `personalizationPrice`, `CUSTOM_RANGE[currency]`, `DENOMINATIONS[currency]`, `REWARD_THRESHOLD[currency]`.
   - `Price` formats each amount with `formatPrice(amount, currency)`. That function uses `Intl.NumberFormat` with `'en-CA'` for CAD and `'en-US'` for USD, `maximumFractionDigits: 0`, followed by a `<span>` with the currency code.
   - Merchandise cart lines are repriced. Gift-card lines are converted from their own currency through `linePrice`.
4. **Currency-dependent copy and logic also switch:**
   - PDP: shipping copy, trust row, and "Duties prepaid" versus "Taxes calculated at checkout".
   - The drawer's shipping line and the `Services` shipping tile.
   - Tax handling: estimated tax with a province select on Cart (CAD only); Checkout province versus state, and postal-code versus ZIP pattern; taxes versus duties in `PriceBreakdown`.
   - Sort order on `Category` and the `GiftFinder` budget filters, which apply the same numeric thresholds to whichever currency is active.

### 8.3 Wishlist heart toggle

1. **The button.** `WishButton` (`{ slug, className?, size?: 'sm' | 'lg' }`) appears in `ProductCard` (top-right, `sm`) and in `pdp/Gallery` (`size="lg"`). It reads `isWished(slug)` and shows `aria-pressed` with the labels "Remove from wishlist" / "Save to wishlist".
2. **Click.**
   - `e.preventDefault()` and `e.stopPropagation()` run first, because cards are links (the comment reads "Cards are links; keep the click from navigating.").
   - It then calls `toggleWishlist(slug)` and animates `gsap.fromTo(ref.current, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })`.
3. **Store.** The slug is appended or removed, the effect writes `tns-wishlist`, and `isWished` gets a new identity.
4. **Re-renders:**
   - Heart fill: `fill-[var(--gold-vermeil)] text-[var(--gold-vermeil)]` when on.
   - Header heart badge (`wishlist.length`) and mobile menu "Wishlist ({n})".
   - The Account "Wishlist" tile count and the `Wishlist` page grid. `useReveal(root, [items.length])` re-runs there.
5. **Other writers.** `CartLineItem` "Save for later" calls `toggleWishlist` only if the slug is not already wished, then `removeLine` (undoable). Undoing the removal does not remove the slug from the wishlist again.

### 8.4 `recordView` and recently viewed

1. **Snapshot before recording.** `Product` first freezes `const [hadHistory] = useState(() => recent.some((s) => s !== slug))`. The source comment explains why: "Snapshot history before recording this view so the section is stable while browsing."
2. **Record.** `useEffect(() => { if (product) recordView(product.slug) }, [product, recordView])` runs once per mount, because of the remount on slug change.
3. **Store.** If the slug is already first, nothing changes. Otherwise it moves to the front, the list is capped at 12, and the effect writes `tns-recent`.
4. **Consumers.** `useRecentProducts(exclude, limit)` filters out `exclude`, maps through `getProduct`, drops unknown slugs and slices to `limit`. Both renderers return `null` when the result is empty.

   | Component | Call sites |
   |---|---|
   | `RecentlyViewed` (full section, "Clear history" link) | `Home`: `index="—"`, `eyebrow="Welcome back"`, title "Continue where you left off". `Category`: defaults ("Your journey" / "Recently viewed"). `Product`: `exclude={product.slug}`, numbered via `hadHistory`. |
   | `RecentlyViewedStrip` (X button `aria-label="Clear recently viewed"`) | Drawer empty state, Cart (empty and filled), Checkout empty state, Account (`limit={5}`), Wishlist empty state (`title="Pieces you looked at" limit={4}`) |

---

## 9. Shopify payload mapping (`src/lib/shopify.ts`)

- **Scope.** The file maps cart lines to Shopify Ajax Cart `/cart/add.js` items, but only for gift cards. `toShopifyCartItem(line: CartLine): ShopifyCartItem | null` returns `null` when the line has no `giftCard`. `ShopifyCartItem` is `{ id: number; quantity: number; properties: Record<string, string> }`.
- **Variant choice.** Fixed denominations look up `GIFT_CARD_VARIANTS[`${currency}-${amount}`]`, a table of placeholder IDs for amounts 100–5000: CAD `44100000001`–`44100000006` and USD `44100000011`–`44100000016`. Custom amounts use `GIFT_CARD_ONE_UNIT_VARIANT = 44100000099` with `quantity: amount * qty` and an `_amount` property.
- **Properties:**
  - Always: `_design` (the design name) and `_delivery` (`'Physical card, mailed'` or `'Digital, by email'`).
  - Email to someone else: `__shopify_send_gift_card_to_recipient: 'on'`, plus `Recipient email`, `Recipient name`, `Message` and `Send on` when present.
  - Physical card to someone else: `Recipient name` and `Card message`.
  - `_From` when a sender name is given.
- **Single runtime caller.** `pages/Checkout.tsx` `placeOrder` runs `giftLines.map(toShopifyCartItem)` and logs `console.info('[Shopify] gift card cart items', shopifyItems)`. The exported `isGiftCardLine` has no callers.

Porting notes are in [shopify-integration.md](shopify-integration.md).

---

## 10. The `@/` alias and import style

- **The alias is configured twice.** In `vite.config.ts` as `resolve.alias: { '@': path.resolve(__dirname, './src') }`, and in `tsconfig.json` as `"baseUrl": "."` with `"paths": { "@/*": ["./src/*"] }`.
- **No module uses it.** A grep for `from '@/` / `from "@/` across `src` returns nothing.
- **Prevailing import style:**
  - Relative paths (`./`, `../`, `../../`), single quotes, no file extensions. `allowImportingTsExtensions` is enabled but unused.
  - Types are imported inline (`import { getProduct, type Currency } from …`) or with `import type`.
  - Components are default exports. Helpers and hooks are mostly named exports (`useStore`, `href`, `lineKey`, `getLenis`, `RecentlyViewedStrip`, `isBookingValid`, `getLookPieces`, `getRatingSummary`, `describePersonalization`). Exceptions: `useReveal`, `useCartTotals` and `useInViewPlay` are default-exported hooks, while `TryOnProvider.tsx` and `store.tsx` have no default export.
- **The `React` namespace.** Several files use `React.FormEvent`, `React.ReactNode`, `React.PointerEvent` and similar in type positions without importing `React`; they resolve through the global namespace from `@types/react`. `tsconfig.json` sets `"jsx": "react-jsx"`, `"strict": true`, `"noFallthroughCasesInSwitch": true`, `"types": ["node"]` and `"include": ["src", "vite.config.ts"]`.
- Conventions are covered in more depth in [code-conventions.md](code-conventions.md).

---

## 11. External runtime dependencies

| Package | `package.json` spec → resolved (pnpm-lock) | Used for | Imported in |
|---|---|---|---|
| `react` | `^19.0.0` → `19.2.4` | Components and hooks (`useState`, `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`, `useRef`, `useContext`, `createContext`, `lazy`, `Suspense`, `forwardRef`, `useId`), plus `React.StrictMode` | Every component. `forwardRef` and `useId` appear only in `tryon/JewelryOverlay.tsx`. |
| `react-dom` | `^19.0.0` → `19.2.4` | `createRoot` from `react-dom/client`; `createPortal` to `document.body` | `src/main.tsx`; `video/ShoppableVideos.tsx` (`VideoViewer`); `pdp/Reviews.tsx` (`MediaLightbox`, `WriteReview`) |
| `gsap` | `^3.15.0` → `3.15.0` | Animation. **Only plugin: `ScrollTrigger` (`gsap/ScrollTrigger`).** APIs used: `to`, `from`, `fromTo`, `timeline`, `context`, `matchMedia`, `quickTo`, `utils.toArray`, `utils.selector`, `ticker` | `SmoothScroll.tsx`, `useReveal.ts`, `HomeHero.tsx`, `home/MakingScroll.tsx` (each imports and registers `ScrollTrigger`); `Header.tsx`, `WishButton.tsx`, `home/CategoryIndex.tsx`, `pdp/Gallery.tsx`, `pages/Product.tsx` (core only) |
| `lenis` | `^1.3.26` → `1.3.26` | Smooth scrolling. The CSS lives in `src/index.css` under "Lenis recommended styles". | Only `src/components/SmoothScroll.tsx`; every other module goes through `getLenis()` |
| `lucide-react` | `^1.57.0` → `1.57.0` | Icons | 34 files. Pages: `Account`, `Cart`, `Checkout`, `GiftCards`, `Product`, `Wishlist`. Components: `CartDrawer`, `Header`, `HomeHero`, `RecentlyViewed`, `WishButton`, `cart/{CartLineItem,CartUpsell,GiftOptions,RewardProgress}`, `giftcard/BalanceChecker`, `home/{CategoryIndex,Services,SocialGrid,Testimonials,TryOnFeature,VisitSalon}`, `pdp/{Accordion,CompleteTheLook,Gallery,Personalizer,PriceBreakdown,RentalCalendar,Reviews,RingSize}`, `tryon/{TryOnButton,TryOnStudio}`, `video/{ShoppableVideos,VideoViewer}` |

The dev toolchain (Vite 8.0.5, TypeScript 5.9.3, Tailwind CSS 4.2.2, `@vitejs/plugin-react` 6.0.1, oxfmt 0.2.0) is covered in [platform-and-tooling.md](platform-and-tooling.md).

**External URLs, all static assets:**

- Google Fonts CSS (`src/index.css`)
- Unsplash images (`IMG` in `src/data/catalog.ts`)
- Mixkit MP4s and posters (`src/data/media.ts`)
- A Google Maps link (`home/VisitSalon.tsx`)

---

## Addendum: BackToTop (2026-10-15)

`src/App.tsx` now renders `<BackToTop />` after `<CartDrawer />`, inside the providers. It reads `cartOpen` and `route` from `useStore()` and the Lenis instance from `getLenis()`. It writes no store state and no localStorage.

## Notes & gotchas

*Observations, risks and recommendations. Everything above this section is fact.*

- **In-page anchors collide with the router.** Any `href="#something"` is parsed as a route and falls through to Home, with a scroll reset. Keep in-page jumps programmatic, as `Product.tsx` does. The Figma skip link (`href: '#root'`) is currently disabled by `addBypassLinks: false`; if it is enabled, it would navigate to Home.
- **One monolithic context.**
  - Every state change re-renders all 31 `useStore()` call sites, including every `Price`. That includes `cartOpen` toggles, route changes and wishlist toggles.
  - If performance matters, split the context (for example route, currency and cart) or add selector subscriptions.
- **Unguarded storage, and no error boundary anywhere in `src`.** None of the following has a try/catch: the `tns-currency` read, every store `setItem`/`removeItem` effect, `setCurrency`, `saveLedger`, and the fallback write in `saveMine`. If storage is blocked or full, the exception surfaces as an uncaught error. A failure during render or in an effect can take down the whole tree.
- **Persisted data is trusted.**
  - `tns-currency` is cast without validation, so a stray value would make `product.price[currency]` `undefined`.
  - `tns-cart` lines are not reconciled with the catalog. A line whose slug no longer exists renders nothing (`CartLineItem` and Checkout `return null`), is priced at 0, and still counts in the Header badge.
- **No multi-tab sync.** There is no `storage` listener; each tab reads at mount and overwrites on change.
- **`lineKey` is insertion-order and `undefined`-sensitive.** Example: ticking and then unticking the nameplate "Diamond accent" leaves `accent: false`. That line no longer stacks with, and makes `inBag` false against, a line added without touching the checkbox, although both cost the same.
- **`addToCart` trusts its callers, and the "needs configuration" gates differ:**
  - `TryOnStudio.needsConfig`: rental, personalization, `rings`, `bridal` or `custom`.
  - `VideoViewer.configurable`: the same list without `custom`.
  - `CartUpsell.quickAddable`: also requires `metals.length > 0`.
  - `Wishlist` "Add all": excludes only rentals, personalized pieces and `gift-card`.
  - `CompleteTheLook`: no gate for non-rental sets.

  Example: "Add the set to bag" on an earrings PDP adds The Teresa Signet (the first `rings` product sharing a metal) with no size and no monogram, which the PDP itself would refuse. A shared `requiresConfiguration(product)` helper would stop this drift.
- **`addToCart` always opens the drawer**, including for bulk adds and adds from inside `TryOnStudio` (`z-[110]`) or `VideoViewer` (`z-[100]`). In those cases the drawer (`z-[90]`) opens underneath the overlay.
- **Scroll locks are not reference-counted, and two styles coexist.** The drawer locks `body` and restores the previous value; other overlays lock `html` and reset it to `''`. Each overlay calls `lenis.start()` on close regardless of what is still open. Opening try-on from a drawer line ("View on you") and closing it restarts Lenis while the drawer is still open. The Gallery lightbox, ring-size guide and mobile menu do not lock scrolling at all.
- **Overlays outlive navigation, and scroll never restores.** `cartOpen` and the try-on request are not reset on route change. `SmoothScroll` forces the page to the top on every hash change, including Back and Forward.
- **Undo is single-level and asymmetric.**
  - `updateQty(key, 0)` removes a line without recording it for undo; prefer `removeLine` for user-initiated removals.
  - `lastRemoved` stays set until the next removal, undo or clear. Every newly mounted `UndoToast` therefore shows "Removed …" again for 6 s: the drawer list, the drawer empty state and the Cart page each have one.
- **Impure updaters.** `removeLine` calls `setLastRemoved` inside a `setCart` updater, and `undoRemove` calls `setCart` inside a `setLastRemoved` updater. StrictMode double-invokes updaters in development. The `prev.some(…)` guard keeps undo idempotent, but the pattern is fragile.
- **Dead surface.**
  - Unused: `StoreValue.subtotal`, `isGiftCardLine` and the `@/` alias.
  - Redundant: `Product`'s `[slug, product]` reset effect, given `key={route.slug}`.
  - Imprecise typing: `setCartOpen` is typed `(o: boolean) => void` but is the raw state setter.
- **Global GSAP side effect.** `gsap.ticker.lagSmoothing(0)` is set when Lenis is created (only without reduced motion) and is never restored.
- **Bundle and type safety.**
  - Every page is eagerly imported. The 610.47 kB main chunk exceeds Vite's default 500 kB `build.chunkSizeWarningLimit`; route-level `lazy()`, as already done for `TryOnStudio`, is the natural lever.
  - `pnpm run build` does not type-check; run `npx tsc --noEmit -p .` separately.
- **Document metadata.** `site.json` sets the title, description, `en-CA`, the icons and the social card; `Routes` retitles each page in the running app. Link unfurlers don't run JavaScript, and hash routes share one document, so every shared link previews with the site-wide title and card. `og:image` is the relative `/og-image.jpg` (KI-069). `accessibility.ignoreReducedMotion` in `site.json` is not read by `vite.config.ts`.
- **Device-local features that look shareable.** Wishlist "Copy link" shares `…#/wishlist`, but the list lives in the sharer's `localStorage`. Customer reviews (`tns-reviews-<slug>`) accumulate per product with data-URL images and no pruning.
- **The demo gift card leaks into storage.** After any checkout, `tns-giftcard-ledger` holds the demo card `TERESASONS1962MT`, because `issueCards` and `debitCards` save the in-memory list that includes it. `Account` hides it by comparing codes.
- **Minor timer leak.** `pages/GiftCards.tsx` calls `window.setTimeout(() => setAdded(false), 2400)` with no cleanup. This is harmless in React 19.

## Related docs

- [Languages — English (Canada, US) and French (Canada)](features/languages.md)
- [Product overview, sitemap & user journeys](product-overview.md)
- [Figma Make platform, toolchain & build](platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](design-system.md)
- [Motion, animation & scroll behaviour](motion-and-interaction.md)
- [Brand, voice & copywriting](brand-voice-and-copy.md)
- [Data layer — catalog, media, gift cards, costing & tax](data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](commerce-logic.md)
- [Shopify integration map & porting notes](shopify-integration.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md)
- [Virtual try-on](features/virtual-try-on.md)
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Code conventions (as practiced in this codebase)](code-conventions.md)
- [UX patterns, responsive behaviour & accessibility](ux-patterns-and-accessibility.md)
- [Known issues, risks & tech debt](known-issues.md)
- [File index — every file, its role, exports and dependencies](INDEX.md)
