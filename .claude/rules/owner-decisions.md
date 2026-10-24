---
paths:
  - "src/**/*"
---

# Owner decisions (from the Figma Make build history)

These are standing product decisions the owner made or accepted. Don't reverse them without asking. Background: `.claude/docs/design-intent.md`; source: `.claude/docs/history/figma-make-log.md`.

- **Prototype scope (most important).** This is the theme's design prototype. Build UI and simulated demo behaviour only, never backend or live integrations. See "Most important" in `.claude/rules/project.md`.
- **Quality bar.** Editorial luxury at senior-agency level, never generic template e-commerce. New surfaces get both a features pass and a refine/polish pass; don't stop at a bare first version.
- **Honest UI.**
  - Never show a total, label or button that does something other than what it says. Adapt the section, or hide it, instead. The precedent is the rental "Complete the look".
  - Call out invented data as placeholders: reviews, press, costs, dates, IDs. Never present it as real.
- **Rentals stay separate from purchases.**
  - Pair rentals only with rentals and total them by period rate.
  - Show the deposit as a hold, not a charge.
  - Add them to the bag as `rental` + `booking` lines.
- **Bag behaviour.**
  - Adding to the bag opens the drawer; this happens inside `addToCart`.
  - The PDP CTA and the StickyBar switch to "Go to bag" when that exact configuration is already in the bag.
- **Designed rings, paid and tried on (owner, 2026-10-22).** A designed ring is paid as the atelier works: a 30% deposit at checkout (`DEPOSIT_SHARE`), the balance when the final design is approved, before casting ("whichever is best and enterprise grade"). Every diamond comes with its GIA report, wherever the house says so. Rings with a 3D model (a design, a house ring with a `PRESETS[].slug`) are tried on in live 3D with hand tracking ("realistic 3D, not 2D"; MediaPipe added at the owner's request); other pieces keep the flat try-on. Records: `.claude/docs/features/virtual-try-on.md` §3a, `.claude/docs/commerce-logic.md`.
- **Ring designer (owner, 2026-10-22).** The owner asked for a full custom ring designer: the stone, its shape and carat, the setting, the claws (normal or eagle claw), the band (plain or diamond), the metal and the size, and more; a real, working 3D view that builds the ring as it is chosen and can be turned 360° at any time; studio, salon and on-the-hand setups with light controls; a live, itemised price like the piece page's; notes, suggestions and a completion moment; then try it on, buy it, or book a consultation with the design. Built 2026-10-22 at `#/designer` (three.js added at the owner's request; the 3D assets are generated in code). Rendering (owner, 2026-10-23: "noisy and not too clear… top notch… use WASM and WebGPU"): three.js's WebGPU renderer with its WebGL 2 fallback; every stone traced in its facets with spectral fire; TRAA while moving and an accumulated, supersampled still at rest; pictures drawn as stills; the same in the try-on. Realism (owner, the same day: "absolute accurate alignment and joining and lighting and shadow and perspective… no compromise"): every part faced outward (the band had been drawn inside-out, the cause of the near/far "illusion"); the ring traced against itself (its reflections, the claws seen in the stone, its shadow on the floor and on the bag's card); a long lens and a still's depth of field; the head cast into the band (claws rising out of a foot, a halo carried on posts, a split shank's bridge, stones seated flush, beads and milgrain sunk); then (the owner's three follow-ups) the engraving carved into the band in its own typeface, V-claws shaped as chevrons seated on the point, and the ring's traced shadow on the salon's velvet and the porcelain hand. Record: `.claude/docs/features/ring-designer.md`.
- **Configuration first.** Never quick-add a piece that has required options (ring size, rental dates, personalization, commissions). Route to the PDP instead, with "Choose dates" / "Personalize this piece" / "Choose size & options" / "Select options".
- **Header.** The desktop bar is Shop · Bridal · Rentals, then the search field (owner, 2026-10-22: Atelier left the bar for the desktop menu, the mobile menu and the footer, and a luxury search with a full dropdown took its place; `/` and ⌘K focus it; the shop page with `?q=` is its results page; record in `.claude/docs/components/global-and-shared.md` §2.2). "Shop" opens the category mega menu. Gift Cards lives in the mega menu (plus the mobile menu and footer), not in the bar. "Book a visit" sits on the utility side (2026-10-21), not in the bar; "Every piece" heads the mega menu.
  - A menu button (two hairlines) before Shop opens the full-height desktop menu (2026-10-20). It is an addition, not a replacement: it repeats the bar (Shop unfolds sideways into the chapters and a preview), and it is where new pages go once the bar is full. Keep the bar and the mobile menu as they are.
- **Splash and page transitions (2026-10-20).** Every visit opens with the splash: in full once per session, shorter on a deep link, a brief veil afterwards. Pages change through Barba-style transitions:
  - a curtain naming the destination;
  - a chapter turn between categories;
  - a product photo flying into its page;
  - a quiet fade for checkout.

  Barba.js itself can't drive this React app, because it fetches server-rendered pages. The transitions are shaped for it, so the Shopify theme can use it.
- **Two languages (2026-10-21).** The owner asked for English (US and Canada) and French (Canada), with a polished, smart switch. English follows the market (Canadian with CAD, US with USD); French is Canadian French. Every visible string, the catalog included, exists in both. The switch keeps the visitor's place behind a veil, the language sits in the address (`#/fr/`), and a one-time notice greets visitors whose browser or link chose it. See `.claude/docs/features/languages.md`.
- **Legacy redesign (2026-10-21).** Full record: `.claude/docs/features/legacy-redesign.md`.
  - **The two signatures lead:** engagement rings and diamond tennis necklaces (`SIGNATURES`; their pages are `#/c/bridal?type=engagement` and `#/c/necklaces?type=tennis`).
  - **A visit weighs as much as the bag.** "Book a visit" sits beside "Add to bag" at the same size on every piece and in the sticky bar, and on every page's header. One verb everywhere: "Book a visit" / "Prendre rendez-vous"; contact is "Ask a jeweller" / "Parler à un joaillier". Never send visitors to a form on another page to book: open the drawer (`openVisit`).
  - **The same piece, two ways.** A piece with rental rates can be rented or bought (Own | Rent on its page); rental lines stay separate in the bag as before. The vault's own pieces lead with renting.
  - **House rules (chosen 2026-10-21):** rental fee credited toward buying within 60 days; natural diamonds only; returns within 30 days for unworn pieces (engraved, personalized and made-to-order are final sale); visits of 45 min (60 for a ring or a design), video 30, phone 20, Tuesday–Saturday 10–18 and Sunday 11–16 by appointment, 2 hours to 6 weeks ahead. Copy in `src/data/house.ts`, rules in `src/data/visits.ts`.
  - **Placeholders by the owner's choice:** the "As seen in" press names stay; the family's names, years and roles; the WhatsApp/text number; every photograph.
  - **Home's ending (owner, 2026-10-21):** 09 The private visit, then 10 Worn in Montréal, then the salon ("Come sit with us.", `VisitSalon`) closes the page above the footer. Keep the salon last.
- **Home refined (owner, 2026-10-21, later the same day).** The owner reversed "add, never remove" for Home, which had grown to 25 blocks: Hero (four slides) → As seen in → [Welcome back, Recently viewed: returning visitors] → 01 Our signatures → the house in four numbers → 02 The Index (silk) → 03 Most treasured (with "Try any piece on you") → 04 Rent or own (on the vault's dark ground) → 05 Sur mesure → 06 Three generations (with Teresa's quote) → 07 Families who come back → 08 Our promise (six tiles, light) → 09 The private visit → 10 Worn in Montréal → Come sit with us (the salon). What left Home lives on its own page: the Four Cs and the tennis guide on the signature pages, the films and the hands on the Atelier, the making (`MakingScroll`) on the Atelier, the gift finder on the Gifts chapter, the watches' story on the Watches chapter; the bridal editorial and the try-on promo were dropped (the try-on stays on every card and piece). Plan and answers: `.claude/plans/home-refine.md`. Elsewhere, don't cut features without asking.
- **"Collection" means a curated collection, never a category (2026-10-16).**
  - Categories are the shop's chapters (Necklaces, Rings…). A collection is a curated story that can hold one piece or pieces from several categories.
  - Don't label category navigation "Collections". The curated-collections system is planned (`.claude/docs/todo.md` §11).
- **Cross-cutting features go "where they suit".** Recently viewed, try-on CTAs and shoppable films appear wherever they help, and render nothing when empty. Consider them whenever you add a surface.
- **Automatic section numbering.** Number conditional sections from the list that actually renders (`sectionOrder` / `num()`), never by hand.
- **Shopify compatibility.**
  - Model commerce features on Shopify primitives: variants and options, line-item properties, cart note and attributes, native gift cards, customer accounts.
  - Compatibility means *shaped*, not integrated. Never call Shopify or build integration in this prototype. The existing `src/lib/shopify.ts` documents the payload shape only.
- **Canada + US parity.** Every price, tax, duty and shipping message must work in both currencies and markets.
- **Typography (2026-10-16).** The owner asked for calm, premium, memorable faces that carry the house's legacy, without aggressive curves.
  - Display is Baskervville (`font-serif-editorial`). Text, labels, prices and specs are Jost (`font-spec` for labels and figures). Pinyon Script is only for engraving.
  - The wordmark is tracked capitals with a gold italic ampersand. The header carries its compact lockup (owner, 2026-10-22: "too wide"): lightly tracked (0.08em), 21 px on desktop, about 190 px wide instead of 254.
  - Don't reintroduce Cormorant Garamond, Plus Jakarta Sans or a monospace face, and don't add families without asking.
  - Re-checked the same day against seven alternatives in blind renders. Ibarra Real Nova came closest: a more graceful italic and an "Et" ampersand, but slightly lighter, and no old-style figures through Google Fonts. The owner chose to keep Baskervville for now. If they revisit the choice, Ibarra is the first alternative to show them.
