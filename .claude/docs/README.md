# Teresa & Sons storefront — knowledge base

This is deep reference documentation for this repository, written for Claude Code sessions (and humans). It covers the Teresa & Sons luxury jewellery storefront: a Shopify theme-design prototype built as a React 19 + Vite + Tailwind v4 SPA inside Figma Make. The always-on essentials live in `.claude/rules/` and load automatically. These docs are read on demand.

Scope: everything in `.claude/docs/`

## How to use these docs (read economically)

1. Find the right doc in the map below, or look the file up in [INDEX.md](INDEX.md) ("Doc" column).
2. Several docs are long: home, data-model, brand-voice, commerce-logic, pdp-modules and cart-and-checkout each run 900–1,400 lines. **Grep for the heading or symbol you need and Read with `offset`/`limit`.** Don't load a whole doc for one fact.
3. **The source code wins.** If a doc disagrees with the code, trust the code and fix the doc (skill `update-knowledge-base`). The SessionStart `[kb]` line lists files changed since the docs were generated.

## Doc map

| Question / task | Doc |
|---|---|
| What is this product? Sitemap, features, user journeys, what's simulated | [product-overview.md](product-overview.md) |
| How does it fit together? Providers, hash router, store API, persistence keys, data flow | [architecture.md](architecture.md) |
| Figma Make, Vite plugins, scripts, tsconfig, versions, build & verify | [platform-and-tooling.md](platform-and-tooling.md) |
| Colours, type scale, spacing, z-index, component class recipes, icons, CSS quirks | [design-system.md](design-system.md) |
| Lenis, GSAP, reveal/parallax, timings, reduced motion | [motion-and-interaction.md](motion-and-interaction.md) |
| Brand facts, voice, microcopy, typographic characters, glossary | [brand-voice-and-copy.md](brand-voice-and-copy.md) |
| How to write code that blends in | [code-conventions.md](code-conventions.md) |
| Overlays, validation, feedback, responsive rules, accessibility, contrast | [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md) |
| Catalog types, every product, metals, rentals, gift-card data, costing, tax | [data-model.md](data-model.md) |
| Prices, currency conversion, cart-line identity, totals, tax, checkout math, worked examples | [commerce-logic.md](commerce-logic.md) |
| What is Shopify-shaped today, and how to port to a Liquid / OS 2.0 theme | [shopify-integration.md](shopify-integration.md) |
| Home page sections and copy | [pages/home.md](pages/home.md) |
| Category page and product card | [pages/category.md](pages/category.md) |
| PDP orchestration: configurator, add-to-bag, section order | [pages/product.md](pages/product.md) |
| PDP modules: Gallery, Personalizer, RentalCalendar, PriceBreakdown, Reviews, RingSize, StickyBar… | [components/pdp-modules.md](components/pdp-modules.md) |
| Cart drawer, cart page, checkout | [pages/cart-and-checkout.md](pages/cart-and-checkout.md) |
| Gift-card builder and balance checker | [pages/gift-cards.md](pages/gift-cards.md) |
| Account and wishlist | [pages/account-and-wishlist.md](pages/account-and-wishlist.md) |
| Header, Footer and shared components (Price, ProductCard, WishButton, SectionHeader, useReveal…) | [components/global-and-shared.md](components/global-and-shared.md) |
| Virtual try-on studio | [features/virtual-try-on.md](features/virtual-try-on.md) |
| The ring designer: the 3D engine (stage, lights, setups, the ring's parts and stones), the design model and its code, the cost-plus price, the atelier's notes, the page, and its bag, visit, try-on and share integrations | [features/ring-designer.md](features/ring-designer.md) |
| Sharing and gift hints (PDP and wishlist) | [features/sharing.md](features/sharing.md) |
| Shoppable video and the Atelier page | [features/shoppable-video-and-atelier.md](features/shoppable-video-and-atelier.md) |
| Languages: English (Canada, US) and French (Canada), `bilingual()` copy, the switch, the notice, formatting | [features/languages.md](features/languages.md) |
| The legacy redesign: private visits (booking drawer), Ask a jeweller, rent or own, the two signatures, chapter filters and Shop all, the new Home sections, house rules | [features/legacy-redesign.md](features/legacy-redesign.md) |
| What the owner asked for and why: principles, decisions, open requests, placeholders | [design-intent.md](design-intent.md) |
| The full Figma Make build history (23 prompts and responses, with status against the code) | [history/figma-make-log.md](history/figma-make-log.md) |
| Bugs, risks, tech debt (KI-xxx) | [known-issues.md](known-issues.md) |
| **The backlog:** unfinished requests, gaps, issues and placeholders, by priority and scope (PROTO vs THEME) | [todo.md](todo.md) |
| Every file: purpose, exports, imports, importers, doc | [INDEX.md](INDEX.md) |

## Provenance & trust

- **Baseline.** All docs were generated on 2026-10-15 from commit `db22872`, the single "first commit". At that point `npx tsc --noEmit -p .` reported 0 errors and `pnpm run build` passed.
- **Agent-written docs.** Thirteen docs (product-overview, architecture, platform-and-tooling, motion, brand-voice, data-model, commerce-logic, shopify-integration, home, category, product, pdp-modules, cart-and-checkout) were written by agents that read their source files in full. The planned independent fact-check pass was cancelled to save tokens. Treat exact numbers and copy as very likely right but unverified, and confirm in code before relying on a detail for a change.
- **Session-written docs.** Design-system, code-conventions, ux-patterns, known-issues, global-and-shared, gift-cards, account-and-wishlist, virtual-try-on and shoppable-video were written in the consolidating session. That session read the relevant source and ran grep inventories.
- **Generated files.** INDEX.md is generated by `.claude/scripts/kb-index.mjs`. `kb-manifest.json` is generated by `.claude/scripts/kb-status.mjs --update`.
- `design-intent.md` and `history/figma-make-log.md` come from the owner's Figma Make chat history (steps 1–23, supplied 2026-10-15). Each request's status was checked against the code. The log is append-only; the drift checker ignores it.

## Conventions for these docs

Follow these when editing any doc. The `update-knowledge-base` skill and the `kb-refresh` workflow rely on them.

- **Facts come from the current code.** State ambiguity explicitly. Never guess.
- **Be exact.** Use exact identifiers, prop types, constant values and Tailwind class recipes. Quote user-facing copy **verbatim**, character for character, including ’ – — × · é.
- **Referencing code.** Use repo-relative paths in inline code plus symbol names (`src/store.tsx` `lineKey`). **Never cite line numbers.**
- **No whole-file pastes.** Excerpts of 15 lines max, and only where the exact shape matters.
- **Separate fact from opinion.** Opinions, risks and recommendations go under `## Notes & gotchas`, or in sections explicitly labelled as recommendations.
- **Doc shape.** Every doc has `# Title`, a 2–4 sentence summary, a `Scope:` line listing source files, the body (tables for inventories), `## Notes & gotchas`, and `## Related docs` (relative links to sibling docs only).
- **Issue numbering.** New issues go into [known-issues.md](known-issues.md) as `KI-0xx`.

## Maintenance

| When | Do |
|---|---|
| Every session start | The hook runs `node .claude/scripts/kb-status.mjs`, which lists project files changed since the manifest and the docs that cover them |
| After changing behaviour | Skill `update-knowledge-base`: edit the affected docs, then `node .claude/scripts/kb-index.mjs` (if files or exports changed) and `node .claude/scripts/kb-status.mjs --update` |
| Large drift (only if the user asks) | `/kb-refresh` workflow: one agent per affected doc. `/kb-refresh all` re-audits every doc, which costs a lot of tokens |

## Notes & gotchas

- `kb-manifest.json` hashes are CRLF-normalised, so git autocrlf churn doesn't count as drift.
- The INDEX "Doc" column comes from path rules in `kb-index.mjs`. Update `DOC_RULES` there if you add a doc that should own some files.

## Related docs

- [INDEX.md](INDEX.md) · [product-overview.md](product-overview.md) · [architecture.md](architecture.md) · [known-issues.md](known-issues.md)
