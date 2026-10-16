# Code conventions (as practiced in this codebase)

This doc records how the code is actually written, so new code blends in. The style is compact and pragmatic React. It uses single quotes, no semicolons and long single-line JSX. Components are function default exports with Tailwind class strings inline. There are no helper libraries for routing, state or class names. Counts are grep counts over `src/` on 2026-10-15 (69 TS/TSX files, 7,550 lines, plus `index.css`).

Scope: all of `src/`, `package.json`, `tsconfig.json`, `AGENTS.md`

## 1. Formatting

- **Quotes and semicolons.** Single quotes are used everywhere: there are 0 double-quoted imports. No statements end with a semicolon. The only leading `;` guards an expression statement (`;(e.target as Element).setPointerCapture?.(…)` in TryOnStudio).
- **Indentation and commas.** Indentation is 2 spaces. Multi-line literals and argument lists keep trailing commas.
- **Line length.** Lines run long: 812 lines exceed 120 characters, 392 exceed 160, and the longest is 797. JSX elements usually keep all their attributes on one line, and `className` strings are not wrapped.
- **Formatter.** The configured formatter is `oxfmt` 0.2.0, run as `pnpm run format`, with no config file. **Do not run it.** Its defaults (double quotes, 80-column wrapping) would rewrite every file. It also produces invalid TypeScript for `src/store.tsx`: it drops the `;` separators in the `Route` union's object types, which causes `TS1005`. This was verified on a scratch copy on 2026-10-15. Format by hand in the house style.

## 2. Files, folders, naming

- **Components** live in PascalCase `.tsx` files, one main component per file, named after the file (`ProductCard.tsx` → `ProductCard`).
- **Hooks** live in `useX.ts` files and are default exports: `useReveal`, `useInViewPlay`, `useCartTotals`. The context hooks `useStore` and `useTryOn` are named exports that live next to their providers.
- **Data and utilities** are lowercase modules: `src/data/catalog.ts`, `giftcards.ts`, `media.ts`, `costing.ts`, `tax.ts`, `src/lib/shopify.ts`, `src/components/lineDetails.ts`.
- **Folders** group components by surface: `components/home`, `pdp`, `cart`, `tryon`, `video`, `giftcard`. Cross-page pieces sit at the root of `src/components/`. Note that `SectionHeader` lives in `home/` but is shared across pages.
- **Constants and tables** use UPPER_SNAKE: `PRODUCTS`, `CATEGORIES`, `METALS`, `IMG`, `DESIGNS`, `DENOMINATIONS`, `CUSTOM_RANGE`, `RENTAL_DAYS`, `GIFT_CARD_SLUG`, `MESSAGE_MAX`, `DEFAULTS`, `PROVINCES`, `REWARD_THRESHOLD`.
- **Local class-recipe constants** are short lowercase names: `label`, `field`, `input`, `num`, `ctrl`, `choice(on)`.
- **Handlers and state** use short verbs: `open`, `scheduleClose`, `submit`, `check`, `add`, `toggle`, `go`, `nudge`, `choose`. Booleans read as states: `added`, `sent`, `mirror`, `guide`, `paused`, `muted`, `megaOpen`, `mobileOpen`.
- **localStorage keys** are prefixed `tns-` (Teresa & Sons). **Product ids** follow `tns-<code>-NNN`. **Slugs** are kebab-case.

## 3. Modules, exports, imports

- **Default exports.** Components are default exports, as AGENTS.md requires: 57 `export default function …`, plus 1 `export default JewelryOverlay` (a `forwardRef` const).
- **Named exports** are used for providers and context hooks (`StoreProvider`, `useStore`, `TryOnProvider`, `useTryOn`), secondary components (`RecentlyViewedStrip`), helpers (27 `export function`), constants (41 `export const`) and types (32 `export interface|type`).
- **Imports** are relative only (252 imports) and carry no file extensions. The `@/` alias is configured in Vite and tsconfig but unused (0 imports). The usual order is:
  1. React
  2. third-party (`gsap`, `gsap/ScrollTrigger`, `lenis`, `lucide-react`, `react-dom`)
  3. data modules
  4. store
  5. sibling components
- **Type imports.** Inline type specifiers are common (34, e.g. `import { priceFor, type Product } from '../data/catalog'`). `import type` appears 12 times.
- **React namespace types** are used without importing React: `React.PointerEvent` (5), `React.ReactNode` (4), `React.FormEvent` (4), `React.WheelEvent`. This works through the `@types/react` UMD namespace in type positions.

## 4. Component style

```tsx
export default function WishButton({ slug, className = '', size = 'sm' }: { slug: string; className?: string; size?: 'sm' | 'lg' }) {
  const { isWished, toggleWishlist } = useStore()
  const ref = useRef<HTMLButtonElement>(null)
  const on = isWished(slug)
  ...
}
```
- **Declarations.** Components are function declarations, never arrow-function components.
- **Props.** Small components type their props inline in the parameter. Larger ones declare `interface Props` above the component. Defaults are set in the destructuring.
- **Local helpers and sub-components.** These stay in the same file: `Tile` in ShoppableVideos, `useRecentProducts` in RecentlyViewed, `toggle()` row helpers in GiftOptions.
- **Repeated UI is data-driven.** Tuples are mapped with `as const`, e.g. `([['email', Mail, 'By email', '…'], …] as const).map(([id, Icon, t, d]) => …)`. Arrays of `{ icon, title, body, link, cta }` work the same way.
- **Conditional rendering** uses `&&` and ternaries. A few IIFEs appear inside JSX: the Account wallet and the Wishlist try-on button. Components return `null` early when empty (`RecentlyViewed`, `ShoppableVideos`, `TryOnButton`).
- **Hooks come before every early return.** Pages compute many hooks and then `return` a not-found state.
- **JSX comments** label sections: `{/* Hero */}`, `{/* Builder */}`, `{/* Mega menu */}`, `{/* Desktop side panel */}`.

## 5. Hooks & state

- **Hook counts:** `useState` 128, `useRef` 51, `useEffect` 48, `useCallback` 25, `useMemo` 20, `useLayoutEffect` 9 (GSAP setup), `useId` 2, `forwardRef` 2.
- **App-wide state** comes only through `useStore()`; try-on uses `useTryOn()`. Everything else is local `useState`, with lazy initialisers for expensive or persisted values (`useState(() => load('tns-…', []))`).
- **Setters** use functional updates (`setQty((q) => Math.min(20, q + 1))`). Store mutators are wrapped in `useCallback(…, [])`, and the store value object is memoised.
- **Effects** return cleanups (listeners, `IntersectionObserver.disconnect`, `gsap.context().revert()`, media tracks, Lenis start). Timers use `window.setTimeout` with ids kept in refs where they need clearing (Header).
- **GSAP code** runs in `useLayoutEffect`/`useEffect` with `gsap.context(…, scope)`. It bails out under `(prefers-reduced-motion: reduce)` where it matters (useReveal, HomeHero, MakingScroll, Product).
- **ESLint comments.** `// eslint-disable-next-line react-hooks/exhaustive-deps` appears 3 times, even though no ESLint is installed. It marks intentional dependency lists.

## 6. Styling in JSX

- **Tailwind utilities go inline.** Design tokens are applied through arbitrary values (`text-[var(--text-taupe)]`), and sizes and tracking through arbitrary px/em values (`text-[11px] tracking-[0.22em]`).
- **Conditional classes** use template literals and ternaries. There is no `clsx`/`classnames`:
  ``className={`px-2.5 py-1.5 transition-colors ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`}``
- **Passing classes in.** Components accept `className = ''` and append it last. Callers override with `!`-important utilities when needed (`!w-auto`, `!py-3`).
- **Inline `style`** is used only for runtime values: transforms, gradients, widths, `clipPath`, font families, `containerType`. It appears in 8 files.
- **Shared global classes** come from `src/index.css`: `font-serif-editorial`, `font-spec`, `link-line`, `editorial-zoom`, `animate-marquee`, `film-grain`.
- **Animation hooks** use data attributes: `data-reveal` (66), `data-pdp-in` (13), `data-parallax` (12), `data-lenis-prevent` (9), `data-reveal-img` (6), `data-mega-item` (5), `data-lenis-prevent-wheel` (1).

## 7. TypeScript idioms

- **Strict mode** is on, and `tsc --noEmit` passes with 0 errors. `lib` is ES2020, so avoid ES2021+ built-ins (`replaceAll`, `.at()`, `Object.hasOwn`, `toSorted`).
- **Types.** String-literal unions are used instead of enums (0 enums). Discriminated unions appear too (`Route`, `ReviewMedia`). `Record<K, V>` maps (`Record<Metal, MetalVariant>`), `as const` arrays and tuples, `Omit<CartLine, 'key' | 'qty'>` and `Partial<CartMeta>` are common. Type guards look like `.filter((p): p is Product => !!p)`.
- **Assertions.** Non-null assertions are used sparingly where a guard exists (`document.getElementById('root')!`, `product.rental!`). Casts like `tryOnKind(p) as TryOnKind` appear after guards. `satisfies` is not used.
- **No network code.** There are no `fetch` calls (0) and no async data layer. Everything is synchronous local data.

## 8. Comments

- **Density is sparse.** Exported functions and components get one-line `/** … */` docs, e.g. `/** Shared editorial header: numbered eyebrow on a hairline rule, large serif title, optional right-hand slot. */`.
- **Data modules** open with a `//` file header, e.g. `// Teresa & Sons — product catalog (Montreal, CA). Prices in whole currency units.`. Inside, `//` section dividers (`// Helpers`, `// Rentals`, `// Virtual try-on`) separate groups.
- **Inline comments explain why, not what:** `// Cards are links; keep the click from navigating.`, `// Lock page scroll while open.`

## 9. Robustness & accessibility idioms

- **Defensive calls.** localStorage reads go through `try { JSON.parse(...) } catch { fallback }` (`load()` in the store, `loadLedger`). `video.play().catch(() => undefined)` is used throughout. `getUserMedia` failures become UI state.
- **Accessibility.** Icon-only buttons carry `aria-label` (76 uses). Toggles use `aria-pressed` (8). Decorative SVG uses `aria-hidden` (10). Overlays use `role="dialog"` with `aria-modal="true"` (7). Hidden file inputs use `sr-only`. Error lists use `role="alert"`, and async results use `aria-live="polite"`.

## 10. Not present (on purpose)

There is no router library (hash routing lives in the store), no state library, no `clsx`, no test runner, and no ESLint or Prettier config. There is also no i18n library: French is inline copy. The `@/` alias is not used. Dependencies are only `react`, `react-dom`, `gsap`, `lenis` and `lucide-react`.

## 11. AGENTS.md rules and compliance

- **Apostrophes.** Strings that contain an apostrophe use the typographic `’` inside single quotes (`'Add the recipient’s name.'`) or switch to double quotes (`"Boucles d'oreilles"`, `"A-Za-zÀ-ÿ '\\-"`). Never leave a bare `'` inside a single-quoted string.
- **Closed tags and balanced braces.** These matter because the code has deeply nested JSX on long lines.
- **Default exports** for components.

## 12. Template for a new component (derived guidance)

```tsx
import { useState } from 'react'
import { Check } from 'lucide-react'
import { type Product } from '../../data/catalog'
import { href, useStore } from '../../store'
import Price from '../Price'

/** One-line description of what this renders. */
export default function NewThing({ product, className = '' }: { product: Product; className?: string }) {
  const { currency } = useStore()
  const [open, setOpen] = useState(false)
  if (!product.images.length) return null

  const label = 'text-[11px] uppercase tracking-[0.22em]'

  return (
    <section className={`mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36 ${className}`}>
      <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Eyebrow</p>
      <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-5xl font-light">Title <em className="text-[var(--gold-vermeil)]">accent</em></h2>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-pressed={open} className={`${label} mt-8 border border-[var(--border-hairline)] px-5 py-3 hover:border-[var(--text-espresso)]`}>
        <Check size={14} strokeWidth={1.3} /> Toggle
      </button>
      <a href={href.product(product.slug)} className="link-line mt-8">View the piece</a>
      <Price amount={product.price[currency]} />
    </section>
  )
}
```

## Notes & gotchas

- `tsconfig` includes `types: ["node"]`, so Node globals type-check inside browser code. Don't rely on that.
- `vite build` does not type-check. Always run `npx tsc --noEmit -p .`.
- Moving a component? Update every import and delete the old file. A re-export shim breaks HMR (see the platform doc).

## Related docs

- [design-system.md](design-system.md) — the class recipes referenced above
- [architecture.md](architecture.md) — store and provider patterns
- [platform-and-tooling.md](platform-and-tooling.md) — tsconfig, oxfmt, build
- [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md) — a11y idioms in depth
- [INDEX.md](INDEX.md) — every file with its exports
