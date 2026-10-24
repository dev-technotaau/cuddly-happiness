---
paths:
  - "src/store.tsx"
  - "src/App.tsx"
  - "src/main.tsx"
  - "src/pages/**/*.tsx"
  - "src/components/Header.tsx"
  - "src/components/Footer.tsx"
  - "src/components/CartDrawer.tsx"
  - "src/components/SmoothScroll.tsx"
---

# Routing & global state rules

Full reference: `.claude/docs/architecture.md`.

## Routing (hash router in `src/store.tsx`)

**Adding a route** means changing six places together:
1. The `Route` union.
2. A `parseHash` rule placed before the final `return { name: 'home' }`. Keep the `#/p/gift-card` alias ahead of the generic `#/p/:slug` rule.
3. An `href` entry: a getter (`get atelier() { return at('/atelier') }`) or a function, so the link carries the language prefix of the moment.
4. A `case` in `Routes` in `src/App.tsx`.
5. A `case` in `headFor` in `src/App.tsx` for the tab title and meta description, with both languages in `SITE`. Without one, the page keeps the site-wide Home title.
6. A `case` in `labelFor` in `src/components/transition/PageTransition.tsx`, with an `[eyebrow, title]` pair per language in `CARDS`. The switch is exhaustive, so a route without one doesn't compile.

Then link the new route from the Header (desktop nav and mobile menu), the desktop menu (`RAIL` in `src/components/menu/SiteMenu.tsx`, plus a `pages` entry), the search (a `doorList` entry in `src/components/menu/useHouseSearch.ts`, one engine for the bar, the desktop menu and phones, and its bilingual `KEYWORDS` line in `src/components/menu/search.ts`) and/or the Footer.

- **Slug pages** must keep their key. Category and Product rely on remounting to reset their state and reveal tweens; since 2026-10-21 the key also includes their options (`route.slug + queryString(route.query)`, `route.slug + mode`).
- **Options in the address** (2026-10-21). `shop`, `category` and `product` routes carry `query`. Link with `href.shop(query)`, `href.category(slug, query)` and `href.product(slug, rent, own)` (`?mode=rent`; `own` opens a vault piece on owning, `?mode=own`, where a page shows it priced to own). A page that changes its own options (filters, Own or Rent) writes them with the store's `replaceQuery(query)`: no history entry, no page transition, and `PageTransition` re-notes the page (`tns:address`) so Back returns to it.
- **Links** are `<a href={href.…}>`. Never assign `location.hash`, call `history.*`, or hard-code `'#/…'` strings.
- **Language prefix.** French addresses carry `#/fr`; English has none. Read `href.*` at render time, never in a module-level constant (it would keep the first load's language). Compare addresses with `bareHash()`, split them with `splitHash()`. Only the first load obeys a prefix; `syncLocale` then keeps the address in the visitor's language with `history.replaceState`.
- **In-page anchors** do not exist as `href="#id"`, because they would be parsed as routes and land on Home. Scroll with `getLenis()?.scrollTo(el, { offset: -120 })`, falling back to `el.scrollIntoView(...)`.
- **Scroll on navigation:** `PageTransition` scrolls to the top at the swap, or back to the remembered position when moving back. Overlays held in the store or a provider (the cart drawer, the try-on studio) do **not** close on navigation, so every link inside them must call their close handler.

## Store (`useStore()`)

- **Access:** read and mutate app state only through `useStore()`. Never touch the `tns-*` localStorage keys from components.
- **`addToCart(line)`** stacks identical configurations via `lineKey` and **always opens the drawer**. It never validates, so validate before calling: ring size, rental booking (`isBookingValid`), personalization (`validatePersonalization`). Don't add a `setCartOpen(true)` of your own.
- **User removals** use `removeLine(key)`, which records the undo. `updateQty(key, 0)` deletes without undo.
- **New persisted slice:**
  - Key `tns-<name>`, initialised with `useState(() => load('tns-<name>', fallback))`.
  - Persisted by `useEffect(() => localStorage.setItem(…), [value])`.
  - Callbacks wrapped in `useCallback(…, [])` with functional setState.
  - Add the value and callbacks to **both** the `useMemo` value object and its dependency array.
- **New `CartMeta` field:** add it to both the interface and `DEFAULT_META`. `clearCart()` resets meta to the defaults.
- **Validate persisted values when reading them**, as `loadCurrency` (`tns-currency`) and `resolveLang` (`tns-lang`) do.
- **Language:** `lang`/`setLang` come from `useStore()` or `useLocale()` (`{ lang, locale, setLang }`, which re-renders only on a language or market change). Copy goes through `useCopy`; never read `tns-lang` directly.
- **Searches** (2026-10-22): `searches`, `rememberSearch(query)`, `forgetSearches()` (`tns-searches`, five, most recent first). Search itself is `useHouseSearch()` (`src/components/menu/useHouseSearch.ts`): `find(query, currency)` reads the query and returns chapters, pieces, pages, completions and where Enter lands. The shop page takes `?q=` as its search.
- **Designs** (2026-10-22): `designs`, `saveDesign(design)`, `forgetDesign(code)` (`tns-designs`: `{ code, image, saved }`, 12 kept, newest first, checked with `decodeDesign` on read; kept without pictures if storage is full) and `designDraft` / `setDesignDraft` (`tns-design-draft`, the code the designer reopens). The designer writes `?r=<code>&step=<step>` with `replaceQuery`; `?from=<preset>` opens a house design. See `.claude/docs/features/ring-designer.md`.
- **Visits and contact** (2026-10-21): `openVisit(request)` / `closeVisit` / `visitRequest` drive the booking drawer; `visits`, `bookVisit`, `cancelVisit` (`tns-visits`); `openAsk(slugs)` / `closeAsk` / `askAbout` drive "Ask a jeweller". Opening one closes the bag and the other. `profile` / `setProfile` (`tns-profile`: ring size, dates to remember) and `nudgeAt` / `dismissNudge` (`tns-nudge`). See `.claude/docs/features/legacy-redesign.md`.

## Providers

- **Nesting:** keep `StoreProvider ▸ TryOnProvider ▸ SmoothScroll`. `useStore()` and `useTryOn()` throw outside their providers.
- **Lenis:** `SmoothScroll` creates the only Lenis instance. Elsewhere use `getLenis()`, which returns `null` under reduced motion.
- **Heavy overlays:** load them lazily with `lazy()` + `<Suspense fallback={null}>`, as `TryOnProvider` does. Pages are eager imports, except the ring designer (`lazy` in `App.tsx`, keyed by `route.query.r` or `from`), whose 3D engine loads separately again from `RingViewer` (`import('./three/stage')`). Keep three.js out of every other chunk: a page asks `canDraw3d` (`src/components/designer/canDraw3d.ts`, free of three.js) before loading it.
