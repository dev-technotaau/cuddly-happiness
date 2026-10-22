# Teresa & Sons storefront — core project rules

## Most important: this is a UI prototype, not a store

This repo is the **UI / UX / visual design prototype** of a Shopify theme that the owner will build separately. It is not the real store, and it will never run as one.

- **Do: front-end work.** Pages, components, layout, styling, motion, copy, interaction flows, and demo behaviour on local mock data (`src/data`, React state, localStorage).
- **Don't: backend work.** This rules out:
  - servers, APIs, databases and serverless functions;
  - real auth, payments and order processing;
  - email or newsletter sending, file storage, and real inventory or booking systems;
  - calls to Shopify (Ajax Cart, Storefront or Admin APIs) and new data-fetching layers;
  - production hardening (security, durable persistence, cross-tab sync).
- **When a feature implies a backend** (newsletter, reviews, booking, accounts, checkout…), build the UI plus the lightest believable simulation (mock data, local state, a confirmation screen) and label it a placeholder. Never wire a real service.
- **"Shopify-compatible" means shaped, not integrated.** Use Shopify-like data shapes and names (line-item properties, cart attributes, gift-card fields) so the real theme can map them later. Never connect to a store.
- **Unsure whether something crosses into backend or integration?** Ask before building it.

This repo is a Shopify-store **theme design prototype** for Teresa & Sons, a Montréal fine-jewellery house founded in 1962. It is built as a React 19 + TypeScript SPA (Vite 8, Tailwind CSS v4, GSAP, Lenis, lucide-react; three.js and three-mesh-bvh for the ring designer and its 3D try-on, MediaPipe for the try-on's hand tracking), scaffolded and hosted by **Figma Make**.

- There is no backend. The catalog lives in `src/data/`.
- All app state lives in one React Context, `src/store.tsx`, persisted to localStorage under `tns-*` keys.
- Routing is hash-based (`#/shop`, `#/c/:slug`, `#/p/:slug`, `#/cart`, `#/checkout`, `#/gift-cards`, `#/wishlist`, `#/account`, `#/atelier`, `#/designer`); chapter, shop, piece and designer pages keep their options in a query (`?type=engagement`, `?mode=rent`, `?r=<design code>`).
- The ring designer (`#/designer`, 2026-10-22) builds a ring in real-time 3D as it is designed; see `.claude/docs/features/ring-designer.md`.
- Private visits (booking drawer, `tns-visits`) and "Ask a jeweller" are simulated; see `.claude/docs/features/legacy-redesign.md`.
- Auth, payment, availability, reviews and gift-card balances are simulated.

## Where knowledge lives

- `.claude/docs/README.md` maps each task to the right doc; `.claude/docs/INDEX.md` maps each file to its doc. Docs are long, so grep and read only the section you need.
- The owner's intent, standing decisions and open requests are in `.claude/docs/design-intent.md`. The source is the Figma Make history in `.claude/docs/history/figma-make-log.md`. `.claude/rules/owner-decisions.md` loads with any `src/` file.
- The backlog of gaps, unfinished requests and issues, by priority and scope, is `.claude/docs/todo.md`. Check it before planning work, and tick items when done.
- `.claude/rules/*.md` hold path-scoped rules. They load automatically when you touch matching files.
- Skills cover the common changes: `add-product`, `add-page`, `add-section`, `add-cart-option`, `build-ui-component`, `write-brand-copy`, `verify-changes`, `update-knowledge-base` and `shopify-theme-port`.
- Agents review work: `design-reviewer`, `commerce-auditor`, `copy-editor` and `kb-maintainer`.
- The code is the source of truth. If a doc disagrees with the code, trust the code and fix the doc. The SessionStart `[kb]` line lists files changed since the docs were written.

## Commands

| Task | Command | Notes |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | Baseline is 0 errors. `pnpm run build` does **not** typecheck. |
| Build | `pnpm run build` | Initial JS baseline: about 976 kB (305 kB gzip) across the entry chunk (714 kB) and the shared chunks it loads (icons 81 kB, gsap 70 kB, salon 89 kB, ring data 13 kB, the JSX runtime 8 kB). Both languages ship in it. Lazy chunks load on demand: the ring designer page (114 kB); three.js in a shared `ringModel` chunk (641 kB, 168 kB gzip) used by the designer's 3D engine `stage` (78 kB) and the 3D try-on `RingTryOn` (164 kB, 49 kB gzip, with MediaPipe's script; its engine and model load at runtime from jsDelivr and Google); TryOnStudio (37 kB), SiteMenu (34 kB), ShareSheet (24 kB). Measured 2026-10-22, after the try-on's reviews. |
| Dev server | `pnpm dev`, then open `http://localhost:8443/#/` | Figma Make already runs it on `$PORT` (8443). Locally you start it yourself. `strictPort` is on; set `PORT` to change the port. |

No tests and no linter exist.

## Never

- **Never run `pnpm run format`, `oxfmt` or `.figma/make/format`.** oxfmt 0.2.0 rewrites every file to double quotes and 80 columns, and it corrupts `src/store.tsx` (`TS1005`). These commands are denied in `.claude/settings.json`.
- **Never casually edit platform-managed files:** `.figma/make/*`, the `figma*` plugins in `vite.config.ts`, and the `<!-- figma:* -->` slots in `index.html`. Set the title and meta in `.figma/make/site.json`.
- **Never replace a component module with a bare re-export** (`export { default } from './X'`). This breaks HMR in Figma Make.
- **Never hard-code `#/…` strings or use `href="#id"` anchors.** Use `href.*` from `src/store.tsx`. To jump within a page, scroll programmatically with `getLenis()`.
- **Never format money by hand or convert currency ad hoc.** Use `<Price amount={…} />` or `formatPrice`, plus the catalog/giftcards helpers.
- **Never touch `tns-*` localStorage from components.** Go through `useStore()`.
- **Never write a visible string in one language only.** Declare it with `bilingual()` and read it with `useCopy()`; show catalog text through `useCatalog()` (`.claude/rules/brand-and-copy.md`, "Languages").
- **Never add dependencies without asking** (router, state lib, clsx, UI kits…). The stack is deliberately minimal.

## Always

- **House style:** single quotes, no semicolons, 2-space indentation, long single-line JSX. Components are default exports (`export default function X`). Imports are relative (the `@/` alias is unused). Tailwind utilities go inline, with tokens as `bg-[var(--token)]`.
- **Apostrophes:** a string containing an apostrophe uses typographic `’` or double quotes (AGENTS.md).
- **Hooks first:** keep every hook above early returns. Pages return a not-found state after many hooks.
- **Typecheck after code changes.** For UI changes, check the result in the browser when possible (skill `verify-changes`).
- **Update the docs** after behaviour changes (skill `update-knowledge-base`).

## Map

```
index.html → src/main.tsx → src/App.tsx   StoreProvider ▸ TryOnProvider ▸ SmoothScroll ▸ Splash / Header / <Pages/> (PageTransition ▸ Routes) / Footer / CartDrawer / BackToTop / film-grain
src/store.tsx      Route union, parseHash/splitHash/bareHash, href (language prefix), cart (lineKey, linePrice), meta, wishlist, recent, searches, designs + draft, account, currency, lang
src/i18n/          bilingual/useCopy/pick, locales and formatters · us (US spelling) · rich (<em> accents) · catalog (useCatalog) · common
src/data/          catalog (products, types, rent or own, card prices, signatures, metals, rentals, personalization, tryOnKind) · catalog.fr · house (signatures, generations, policies) · visits · giftcards · media · costing · tax · salon
                   ring (the designer's model, layout, code) · ringCopy · ringPrice (cost-plus statement) · ringAdvice (notes, budget)
src/pages/         Home · Shop · Category · Product · Cart · Checkout · GiftCards · Wishlist · Account · Atelier · Designer (lazy)
src/components/    Header Footer CartDrawer ProductCard Price WishButton RecentlyViewed SmoothScroll useReveal lineDetails
                   home/ pdp/ cart/ tryon/ video/ giftcard/ share/ menu/ splash/ transition/ (LanguageVeil) brand/ (Ampersand, Hallmark) locale/
                   visit/ (VisitDrawer, VisitFlow, VisitButton, VisitBand, NextTimes) contact/ (AskSheet) catalog/ (PieceGrid, Interlude) ui.ts (button recipes)
                   designer/ (RingViewer, Glyph, LivePrice, RingBreakdown, DesignNotes, CaratField, BudgetFinder, DesignSpec; three/: stage, tryOnStage, lighting, setups, ringModel, parts, gems, materials)
                   tryon/ (TryOnProvider, TryOnStudio, JewelryOverlay; the live 3D try-on: RingTryOn, fingerPose, handTracker)
src/lib/shopify.ts Shopify Ajax-cart payload for gift-card lines (placeholder variant IDs)
src/lib/stage.ts   stage cover that holds entrances under the splash and page transitions; intro mode
src/index.css      Google Fonts, :root tokens, global utilities, keyframes
```
