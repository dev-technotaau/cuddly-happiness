# Known issues, risks & tech debt

A register of problems found while documenting the codebase on 2026-10-15. Each entry names the file and symbol, a concrete failure scenario and a suggested fix.

**Provenance.** KI-001 was reproduced directly: the formatter output was run through `tsc`. The other entries were reported by the agents that wrote the docs, after reading the full source. They were then cross-checked against the code during consolidation where it was cheap to do so. They were **not** independently re-verified one by one, so confirm in the source before fixing. Deeper context for most items sits in the "Notes & gotchas" of the linked docs.

**Scope.** This repo is a UI prototype (see `.claude/rules/project.md`). Fix UI, UX, design and front-end-logic issues here. Entries that need real services are notes for the future theme build, not tasks for this repo:
- KI-018 (cross-tab sync)
- KI-031 (cart meta to Shopify)
- KI-036 (Shopify mapping)
- KI-060 and KI-062 (real reviews)
- KI-061 (shared wishlists)
- the Shopify and back-office parts of KI-024, KI-029 and KI-030

Severity: **H** = breaks something real; **M** = wrong behaviour or significant UX/a11y gap; **L** = minor; **N** = nit or cleanup.

## Tooling & platform

| ID | Sev | Issue | Where | Failure scenario → fix |
|---|---|---|---|---|
| KI-001 | **H** | `pnpm run format` breaks the code | `package.json` `format` → `oxfmt` 0.2.0, no config | Running it rewrites every file to double quotes and 80-column wraps, and emits `{ name: "category" slug: string }` in `src/store.tsx` → `TS1005 ';' expected`. **Never run it.** Fix: add an oxfmt config matching the house style, or pin or replace the formatter. The deny rule lives in `.claude/settings.json`. |
| KI-002 | M | Document title is "Figma Make App" on every route | `.figma/make/site.json` has no `title`; no `document.title` anywhere | Tab title and `og:title` show the platform default. Fix: set `title` in site.json, and optionally per-route titles. |
| KI-003 | L | Favicon is Figma Make's default icon | `public/favicon.svg` | Fix: replace it with a brand mark, or set `icons.icon`. |
| KI-004 | M | No typecheck in build or deploy | `build` = `vite build` | Type errors ship silently. Fix: run `npx tsc --noEmit -p .` before deploys, or add a script. |
| KI-005 | L | Main JS chunk 618 kB (> 500 kB warning) | `src/App.tsx` eager page imports | Only TryOnStudio is lazy. Fix: `lazy()` the pages behind `Suspense`. |
| KI-006 | L | `tsconfig` `lib: ES2020` is narrower than the runtime target; `types: ["node"]` leaks Node globals | `tsconfig.json` | Valid modern built-ins fail `tsc`. Fix: widen `lib` if needed. |
| KI-007 | L | `addBypassLinks` would route to Home | `vite.config.ts` skip link `href="#root"` + `parseHash` | Enabling it makes "Skip to content" navigate home. Fix: retarget it before enabling. |
| KI-008 | L | Toolchain drift | `.mise.toml` (Node 22 / pnpm 10.34.3) vs local Node 24.21 / pnpm 12.9.1; AGENTS.md says TS 5.7 but the lockfile has 5.9.3 | Fix: use the pinned versions for installs. |
| KI-009 | N | site.json `accessibility.ignoreReducedMotion` is read nowhere | `vite.config.ts` type | No effect locally. |

## State, routing & persistence

| ID | Sev | Issue | Where | Failure scenario → fix |
|---|---|---|---|---|
| KI-010 | M | `tns-currency` is trusted without validation | `src/store.tsx` `useState(() => localStorage.getItem('tns-currency') as Currency …)` | A stale or invalid value makes `product.price[currency]` undefined or makes `Intl.NumberFormat` throw. Fix: whitelist `'CAD' \| 'USD'`. |
| KI-011 | M | Unguarded `localStorage` writes, no error boundary | Store persistence effects, `setCurrency`, `saveLedger` | Quota or privacy-mode exceptions can crash the app. Fix: try/catch the writes and add an error boundary. |
| KI-012 | M | `lineKey` depends on JSON key order and on `false` fields | `src/store.tsx` `lineKey` | Toggling the nameplate accent on then off leaves `accent: false`. That no longer stacks with an untouched identical config, so `inBag` is false. Fix: normalise before stringifying. |
| KI-013 | L | Ghost lines from stale `tns-cart` | CartLineItem / Checkout | A slug no longer in the catalog renders nothing and is priced at 0, but still counts in the badge. Fix: reconcile on load. |
| KI-014 | L | `updateQty(key, 0)` removes a line without undo | `src/store.tsx` | Only `removeLine` records `lastRemoved`. Fix: use `removeLine` for user removals (the existing rule). |
| KI-015 | L | `lastRemoved` persists after the toast | Store + `UndoToast` | Revisiting `#/cart` re-shows a stale "Removed …" toast for 6 s. Fix: clear it when the toast hides. |
| KI-016 | M | Drawer and studio survive route changes; Back never restores scroll | `cartOpen`, try-on `req`, `SmoothScroll` | Browser Back keeps overlays open, and scroll always resets to the top. Fix: close overlays on `hashchange`; consider scroll restoration. |
| KI-017 | L | `parseHash` keeps query strings and does not decode | `src/store.tsx` | `#/c/rings?sort=low` → slug `rings?sort=low` → not-found. Fix: strip and parse the query. |
| KI-018 | L | No cross-tab sync | Store | Two tabs overwrite each other's `tns-*` keys. |
| KI-019 | L | One monolithic context re-renders all 31 `useStore()` sites on any change | `src/store.tsx` | Performance only. Fix: split contexts if it becomes a problem. |
| KI-020 | N | Dead or duplicated code | `isGiftCardLine` (unused), store `subtotal` (unused), `useCartTotals().threshold` (unused), `.grain-overlay` CSS (unused; `.font-sans-luxury` was removed 2026-10-16), `@/` alias (unused), the redundant Product slug-reset effect | Cleanup. |

## Pricing & commerce

| ID | Sev | Issue | Where | Failure scenario → fix |
|---|---|---|---|---|
| KI-021 | M | Listing prices ≠ PDP opening price for platinum-first pieces | `priceFor(p, currency)` on cards and rails vs `metals[0]` on the PDP | Notre-Dame shows 18,900 on the card but 19,550 on the PDP; the commission's "starting deposit" shows 5,000 vs 5,650. Fix: use one canonical price, or reorder `BRIDAL_METALS`. |
| KI-022 | **H** | Quick-add paths bypass configuration | CompleteTheLook "Add the set", Wishlist "Add all", VideoViewer, CartUpsell, TryOnStudio | Rings and bridal pieces are added without a size; The Teresa Signet is added without its monogram; CompleteTheLook ignores the chosen metal. The "needs configuration" rules differ per surface. Fix: one shared `needsConfig(p)` helper. |
| KI-023 | M | Bag `+` lowers qty above 10 | `CartLineItem` `Math.min(10, qty + 1)` | A gift-card line with qty 11–20 drops to 10. Fix: clamp at add time, or use `Math.max`. |
| KI-024 | M | Header currency switch on Checkout doesn't re-convert applied gift cards | `Checkout` `Applied.available` | Applying a CAD 250 card and then switching via the Header credits USD 250. Fix: derive `available` from the card balance on render. |
| KI-025 | L | `debitCards` round-trip can over-debit by $1 | `src/data/giftcards.ts` `convert` | USD 183 → CAD 251 against a CAD 250 balance, masked by `Math.max(0, …)`. |
| KI-026 | L | Three USD rounding rules | `p()`/`toUSD` nearest 5, `priceFor` delta nearest 1, `convert` nearest 1 | Vermeil USD prices are off the $5 grid. Fix: document or unify. |
| KI-027 | L | PriceBreakdown tax can differ by $1 from Cart/Checkout | `splitTaxes` (per component) vs `Math.round(merch * rate)` | e.g. nameplate 1,430 CAD → 1,645 vs 1,644. |
| KI-028 | L | Rental deposit is never charged or shown in totals; rentals can reach qty > 1 | `linePrice`, CartLineItem | A unique piece is rented ×2 for the same dates. Fix: cap rental qty at 1. |
| KI-029 | M | Checkout promises promo codes that don't exist; USD tax shows "Calculated by Shopify" and is excluded from the total | `src/pages/Cart.tsx` copy, `Checkout` | Misleading in a demo. Fix: add the field or change the copy. |
| KI-030 | L | Checkout inputs are uncontrolled and unnamed; the US State select is ignored; the order number repeats every 1,000,000 ms | `src/pages/Checkout.tsx` | Demo-only, but misleading. |
| KI-031 | L | CartMeta (gift wrap/message/receipt/note) never reaches checkout or Shopify | `src/store.tsx` comment vs `Checkout` | `clearCart()` wipes it. Fix: map it to cart attributes in `src/lib/shopify.ts`. |
| KI-032 | L | Gift-card range copy is inconsistent | catalog `$250 – $10,000`, Header "From $100", `DENOMINATIONS` 100–5000, `CUSTOM_RANGE` 50–10000/7500 | Fix: one source of truth. |
| KI-033 | L | `getBookedDates` uses signed `>>` | `src/data/catalog.ts` | Hashes ≥ 2^31 give negative offsets, so `bridal-tiara-and-drops` has no booked dates. Fix: use `>>>`. |
| KI-034 | N | `describePersonalization` hard-codes "Diamond accent"; the nameplate spec says "+$180" even in USD (actual +$130) | Personalizer, catalog | Copy drift. |
| KI-035 | N | CartLineItem strike-through compare price can never render | `fullPrice !== unit` | Dead code until discounts exist. |
| KI-036 | L | Shopify mapping covers gift cards only | `toShopifyCartItem` returns null for jewellery lines and is only `console.info`'d | Fix: add a merchandise mapper before going live. Placeholder variant IDs must never ship. |

## Accessibility & UX

| ID | Sev | Issue | Where | Failure scenario → fix |
|---|---|---|---|---|
| KI-040 | M | No visible keyboard focus | 18 × `outline-none`, 0 × `focus-visible:` | Keyboard users lose their place. Fix: add a `focus-visible` ring recipe. |
| KI-041 | M | Drawer declares `aria-modal` but has no focus trap or restore | CartDrawer | Fix: trap focus and return it to the trigger. |
| KI-042 | M | Mobile menu, Gallery lightbox and RingSize guide don't stop Lenis or lock scroll; the mobile menu has no Escape | Header, Gallery, RingSize | Fix: apply the overlay checklist. |
| KI-043 | L | Scroll locks aren't reference-counted; body vs html lock styles are mixed | CartDrawer vs others | Closing the studio over an open drawer restarts Lenis. |
| KI-044 | L | Escape closes both the studio and the drawer | `window` keydown in both | Fix: stop propagation in the top-most overlay. |
| KI-045 | M | Vermeil (2.8:1) and linen (2.6:1) text fail WCAG AA | Tokens on travertine | Fix: darken them for text, or keep them for decoration only. |
| KI-046 | L | Missing `aria-pressed` (currency toggles, rental periods); missing `aria-live`/`aria-invalid` on PDP validation | Header, Account, Checkout, Product | |
| KI-047 | L | Buttons nested in card `<a>`; the try-on chip is invisible on keyboard focus | ProductCard | |
| KI-048 | L | `.link-line` (unlayered) overrides `hidden` | Category "Try this collection on" uses `hidden sm:inline-flex` | It likely shows on phones. Fix: `max-sm:!hidden`. |
| KI-049 | L | Several animations ignore reduced motion | WishButton pop, Gallery stage, mega menu, drawer, RewardProgress, UndoToast | |
| KI-050 | N | `{n} pieces` has no singular; Category has no empty state for 0 products; the PDP not-found state has no way back | Category, Product | |

## Content & demo honesty

| ID | Sev | Issue | Where | Notes |
|---|---|---|---|---|
| KI-060 | L | Synthetic reviews carry "Verified purchase" badges; Testimonials hard-codes "4.9 / 5 · 1,200+ reviews" | Reviews, Testimonials | Replace with real data before launch. |
| KI-061 | L | Wishlist "Copy link" shares `#/wishlist`, which shows the recipient's own list | Wishlist | |
| KI-062 | L | Review storage `tns-reviews-<slug>` grows without bound and holds data-URL images | Reviews | |
| KI-063 | N | Spelling varies: "Jewellery" on cart surfaces vs "Jewelry" in the catalog | Cart surfaces, catalog | Pick one per locale. |
| KI-064 | N | tax.ts comment says "2024 rates" while listing NS at 14% (the 2025 rate) | `src/data/tax.ts` | Update the comment. |

## From the build history

| ID | Sev | Issue | Where | Failure scenario → fix |
|---|---|---|---|---|
| KI-065 | L | Newsletter form gives no feedback | `src/components/Footer.tsx` | Submit only calls `preventDefault()`, although step 3 of the history described a thank-you. Fix: add a sent state ("Merci…"), as the Atelier form has. |
| KI-066 | L | Rentals hero slide shows the wrong piece | `src/components/HomeHero.tsx` `SLIDES[2]` | `inset: IMG.necklace1` (the Mont-Royal pendant photo) is captioned "Gala Diamond Collar" (flagged in step 6). Fix: a real collar photo. |
| KI-067 | M | Catalog doesn't cover the brief's sub-types | `src/data/catalog.ts` | Missing from the brief (step 1): religious necklace, hoops, bangles, pinky ring, full eternity band, rental bracelet, wedding-day jewellery under Bridal. Fix: add products (skill `add-product`). |
| KI-068 | L | Adding from the video viewer or try-on opens the drawer underneath | `addToCart` + z-index ladder | The drawer is `z-[90]`, below the viewer `z-[100]` and the studio `z-[110]`. In step 23 Figma Make offered "close the overlay, then Go to bag". |

## Not issues (by design)

- **Simulated services.** There is no backend: auth, payments, availability, reviews and gift-card balances are simulated. This is a theme-design prototype.
- **Unused alias.** The `@/` alias exists because the Figma Make scaffold provides it.
- **Grain above the header.** The film grain sits above the header on purpose (z 60, `pointer-events: none`).
- **Click-time validation.** The PDP CTA is never disabled; validation runs at click time and scrolls to the failing step.
- **Gift cards outside tax.** Gift cards are untaxed and cannot pay for other gift cards, which matches the copy.

## Related docs

- [platform-and-tooling.md](platform-and-tooling.md) · [architecture.md](architecture.md) · [commerce-logic.md](commerce-logic.md) · [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md) · [shopify-integration.md](shopify-integration.md) · [pages/product.md](pages/product.md) · [pages/cart-and-checkout.md](pages/cart-and-checkout.md)
