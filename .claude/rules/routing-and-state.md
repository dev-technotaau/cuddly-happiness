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

**Adding a route** means changing five places together:
1. The `Route` union.
2. A `parseHash` rule placed before the final `return { name: 'home' }`. Keep the `#/p/gift-card` alias ahead of the generic `#/p/:slug` rule.
3. An `href` entry.
4. A `case` in `Routes` in `src/App.tsx`.
5. A `case` in `headFor` in `src/App.tsx` for the tab title and meta description. Without one, the page keeps the site-wide Home title.

Then link the new route from the Header (desktop nav and mobile menu) and/or the Footer.

- **Slug pages** must keep `key={route.slug}`. Category and Product rely on remounting to reset their state and reveal tweens.
- **Links** are `<a href={href.…}>`. Never assign `location.hash`, call `history.*`, or hard-code `'#/…'` strings.
- **In-page anchors** do not exist as `href="#id"`, because they would be parsed as routes and land on Home. Scroll with `getLenis()?.scrollTo(el, { offset: -120 })`, falling back to `el.scrollIntoView(...)`.
- **Scroll on navigation:** every route change scrolls to the top (`SmoothScroll`). Overlays held in the store or a provider (the cart drawer, the try-on studio) do **not** close on navigation, so every link inside them must call their close handler.

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
- **Validate persisted values when reading them.** `tns-currency` is currently trusted without validation (known issue KI-010).

## Providers

- **Nesting:** keep `StoreProvider ▸ TryOnProvider ▸ SmoothScroll`. `useStore()` and `useTryOn()` throw outside their providers.
- **Lenis:** `SmoothScroll` creates the only Lenis instance. Elsewhere use `getLenis()`, which returns `null` under reduced motion.
- **Heavy overlays:** load them lazily with `lazy()` + `<Suspense fallback={null}>`, as `TryOnProvider` does. Today all pages are eager imports.
