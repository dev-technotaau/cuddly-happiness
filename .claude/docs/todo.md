# To-do — gaps, unfinished requests, issues & backlog

This is the single backlog for the Teresa & Sons theme prototype. It consolidates:
- the owner's Figma Make requests that were not done or only partly done;
- gaps against the original brief;
- the known-issues register;
- problems noted while documenting the code;
- tooling findings and content placeholders.

Everything is tagged by **scope**:
- **PROTO** items are front-end work that belongs in this repo.
- **THEME** items need real services or Shopify. They belong to the owner's separate theme build, are **out of scope here** (see `.claude/rules/project.md`), and are listed only so nothing is lost.

Scope: compiled 2026-10-15 from `history/figma-make-log.md`, `design-intent.md`, `known-issues.md` and the "Notes & gotchas" of every doc. Items from doc notes were reported by agents that read the code; confirm in the source before fixing.

**How to use**
- Tick items (`- [x]`) when done and note the date.
- Check items against the owner's rules first: `.claude/rules/owner-decisions.md` and the prototype scope rule.
- Priorities:
  - **P1**: visibly wrong, or the owner asked for it.
  - **P2**: noticeable UX or logic problems.
  - **P3**: polish, consistency, cleanup.
- Status: `☐` not started · `◐` partly done · `✗` asked of Figma Make but not delivered.

## 0. Suggested order (quick wins first, all PROTO)

1. Unify the "needs configuration" rule across all quick-add buttons (§3.1).
2. Make card, rail and PDP opening prices agree (§3.2).
3. Give the newsletter form a thank-you state (§1.4).
4. ~~Use a fitting photo in the rentals hero slide (§1.5).~~ Done 2026-10-16.
5. Set a real page title (§6.1). This edits a platform file, which asks for confirmation.
6. Fix the "Try these pieces on" link showing on phones (§4.9).
7. Add a visible keyboard focus style (§4.1).
8. Fix the bag "+" lowering quantities above 10 (§3.4).
9. Fix the rental availability hash so every rental piece has booked dates (§3.10).
10. Add the missing brief sub-types to the catalog (§2.1).

## 1. Asked of Figma Make — not delivered or only partly delivered

- [ ] ✗ **P2 · PROTO · "Go to bag" inside the video viewer and try-on studio.** Figma Make offered "close the overlay, then show the drawer" but never built it. Today adding from these overlays opens the drawer *underneath* them (drawer `z-[90]` vs viewer `z-[100]` and studio `z-[110]`). Files: `video/VideoViewer.tsx`, `tryon/TryOnStudio.tsx`. Source: step 23, KI-068.
- [ ] ✗ **P3 · PROTO · Face/hand tracking for try-on.** Offered in step 16 and never requested. It would need a large tracking library, which goes against the minimal-dependency rule, so **ask the owner before starting**. Today placement is manual.
- [ ] ◐ **P2 · PROTO · Home chapter numbering.** Step 9 numbered the home page 01–09. Sections added later (TryOnFeature, ShoppableVideos, RecentlyViewed "—") sit outside that sequence, and the indexes are hand-typed. Renumber them, or compute them as the PDP does with `sectionOrder`. Files: `pages/Home.tsx`, `components/home/*`.
- [ ] ✗ **P1 · PROTO · Newsletter thank-you.** Step 3 said it shows a thank-you. Today `Footer.tsx` only calls `preventDefault()`. Add a sent state ("Merci…"), mirroring the Atelier form. Source: KI-065.
- [x] ✗ **P1 · PROTO · Rentals hero slide photo.** Done 2026-10-16: the hero now features catalog pieces, and slide 2 frames the Gala Diamond Collar's boxed-strand photo (`jewelryFlat`). Real photography is still a placeholder (§7).
- [ ] ◐ **P3 · PROTO · GIA details on more diamond pieces.** Step 2 claimed 8 pieces had them; only 4 do. Add sample `gia` specs to other diamond pieces (e.g. Rivière Saint-Laurent, Westmount Tennis) so the GIA card and cost breakdown appear more widely. File: `data/catalog.ts`.
- [ ] ◐ **P3 · PROTO · Rental periods.** The plan said 4-day / 8-day rates; weekend / week / month (3 / 7 / 30 days) was built. **Confirm with the owner**; there is no action unless they want different periods.
- [ ] ◐ **P3 · PROTO · Real close-ups for the gallery "Detail" view.** Step 14 noted it is only a tighter crop of the main photo. Needs content (see §7).

## 2. Gaps against the original brief (step 1)

- [ ] ✗ **P1 · PROTO · Missing catalog sub-types.** Add mock products for:
  - a religious necklace;
  - hoop earrings (beyond the huggies);
  - a bangle;
  - a pinky ring;
  - a full diamond eternity band;
  - a rental bracelet;
  - wedding-day jewellery under **Bridal** (the tiara set exists only as a rental);
  - optionally, a true tennis necklace.

  Each category has only 3 products today. Use skill `add-product`. Source: KI-067.
- [ ] ◐ **P2 · PROTO · Gifts "organized into different price ranges".** Only the home GiftFinder budgets and a "Gifts under $1,000" collection label exist. Add price-range browsing on the Gifts category page, for example the GiftFinder budget chips or a band. Files: `pages/Category.tsx`, `data/catalog.ts`.
- [ ] ◐ **P3 · PROTO · Watches "related offerings".** Servicing appears only as an Atelier form option and in home copy. Consider a watch-services block on the watches category page or PDP.
- [ ] ◐ **P3 · PROTO · Promesse Wedding Band widths.** The specs say "2 / 4 / 6 mm" but there is no width selector. Add one, or change the copy. Use skill `add-cart-option` if adding.

## 3. Logic & behaviour bugs (PROTO)

1. [ ] **P1 · Quick-add paths bypass configuration.**
   - The paths are CompleteTheLook "Add the set", Wishlist "Add all", VideoViewer, CartUpsell and TryOnStudio.
   - The result: rings and bridal pieces are added without a size, The Teresa Signet without its monogram, and CompleteTheLook ignores the chosen metal.
   - The four "needs configuration" rules disagree. Create one shared `needsConfig(p)` helper.
   - Source: KI-022.
2. [ ] **P1 · Card price ≠ PDP opening price** for platinum-first pieces.
   - Cards and rails use the base price; the PDP opens on `metals[0]`.
   - Examples: Notre-Dame 18,900 → 19,550; the commission's "starting deposit" 5,000 → 5,650.
   - Pick one canonical price, or reorder `BRIDAL_METALS`.
   - Source: KI-021.
3. [ ] **P2 · `lineKey` is order-sensitive and treats `accent: false` as different.** A toggled-then-untoggled accent won't stack, and "Go to bag" shows the wrong state. Normalise before stringifying. Source: KI-012.
4. [ ] **P2 · Bag "+" lowers quantities above 10.** It uses `Math.min(10, qty + 1)` while gift cards can be added up to 20. Clamp at add time, or fix the stepper. File: `cart/CartLineItem.tsx`. Source: KI-023.
5. [ ] **P2 · Header currency switch on checkout doesn't re-convert applied gift cards** (front-end simulation math). File: `pages/Checkout.tsx`. Source: KI-024.
6. [ ] **P2 · Overlays survive navigation.** The drawer and studio stay open on Back. Scroll always resets to the top, so Back never restores it. Close overlays on `hashchange`; consider scroll restoration. Source: KI-016.
7. [ ] **P2 · Escape closes both the try-on studio and the drawer** when try-on was opened from a bag line. Scroll locks aren't reference-counted (body vs html). Source: KI-043, KI-044.
8. [ ] **P2 · Validate `tns-currency`** on load (whitelist CAD/USD). Guard the localStorage writes. Optionally add an error boundary. Source: KI-010, KI-011.
9. [ ] **P2 · The cart promises promo codes that checkout lacks.** Either add a simulated promo-code field (UI only) or change the copy. Source: KI-029.
10. [ ] **P2 · `getBookedDates` uses a signed `>>`.** Hashes ≥ 2^31 break, so `bridal-tiara-and-drops` gets no booked dates and some dates land in the past. Use `>>>`. File: `data/catalog.ts`. Source: KI-033.
11. [ ] **P3 · Rentals can reach qty > 1** for a single unique piece, and "Reserve the ensemble" can bump an identical rental to ×2. Cap rentals at 1. Source: KI-028.
12. [ ] **P3 · Cart "Shipping · Digital delivery" shows for physical gift cards.** Checkout then asks for an address. Align with `needsShipping`.
13. [ ] **P3 · Cart region and checkout province are independent states** (both default to QC). Share them.
14. [ ] **P3 · Instalment and total inconsistencies.**
    - Instalments are pre-tax while "Estimated total" includes tax.
    - The confirmation's `paidWithCards` is formatted in the current currency without conversion.
    - The order number `TS-` + 6 digits repeats.
    - Source: KI-030.
15. [ ] **P3 · PriceBreakdown tax can differ by $1** from the cart/checkout total, and the rate formatter strips trailing zeros (a 10% rate would print "1"). Source: KI-027.
16. [ ] **P3 · Three USD rounding rules** (nearest 5 vs 1), and the vermeil USD prices fall off the $5 grid. Document or unify. Source: KI-026.
17. [ ] **P3 · Gift-card debit round-trip can over-debit $1.** Source: KI-025.
18. [ ] **P3 · Ghost cart lines.** Stale slugs are priced at 0 but still counted. Reconcile on load. Source: KI-013.
19. [ ] **P3 · Undo semantics.**
    - `updateQty(key, 0)` isn't undoable.
    - `lastRemoved` lingers and re-shows the toast on `#/cart`.
    - Source: KI-014, KI-015.
20. [ ] **P3 · `parseHash` keeps query strings.** `#/c/rings?sort=low` → not found. Strip them, and optionally make the sort URL-addressable. Source: KI-017.
21. [ ] **P3 · `needsSize` is category-based,** so the Bespoke Engagement Commission (an engagement ring) has no size step.
22. [ ] **P3 · Shop Pay line uses `>= 400` in the display currency.** It disappears for the pearl studs in USD and the vermeil initial disc.
23. [ ] **P3 · CompleteTheLook and CartUpsell `PAIRS` tables disagree** for bridal, custom and rentals.
24. [ ] **P3 · CartUpsell "Added" state never shows,** because the item leaves the picks immediately.
25. [ ] **P3 · Rental sort.** Rentals sort by purchase price, not by the weekend rates shown on the cards.

## 4. Accessibility & UX (PROTO)

1. [ ] **P1 · No visible keyboard focus.** `outline-none` appears 18 times and there are zero `focus-visible:` styles. Add a focus-ring recipe to the design system. Source: KI-040.
2. [ ] **P2 · The drawer declares `aria-modal` without a focus trap or focus restore.** Source: KI-041.
3. [ ] **P2 · Some overlays don't stop Lenis or lock scroll:** the mobile menu, Gallery lightbox and RingSize guide. The mobile menu has no Escape handler. Source: KI-042.
4. [ ] **P2 · Contrast.** Vermeil (2.8:1) and linen (2.6:1) text on travertine fail WCAG AA at the sizes used. Darken them for text, or reserve them for decoration. Source: KI-045.
5. [ ] **P2 · Missing `aria-pressed`** on the currency toggles (Header, Account, Checkout) and the rental-period buttons. There is no `aria-live`/`aria-invalid` on PDP validation errors. Source: KI-046.
6. [ ] **P3 · Buttons nested in card `<a>`s** (WishButton, the try-on chip). The chip stays invisible when it has keyboard focus. Source: KI-047.
7. [ ] **P3 · The header rating row always renders 5 filled stars,** and its count excludes the shopper's own reviews.
8. [ ] **P3 · Reduced motion is ignored** by the WishButton pop, the Gallery fade, the mega-menu tweens, the drawer slide, RewardProgress and UndoToast. Source: KI-049.
9. [ ] **P2 · "Try these pieces on" likely shows on phones.** `.link-line` is unlayered and beats `hidden`. Use `max-sm:!hidden`. File: `pages/Category.tsx`. Source: KI-048.
10. [ ] **P3 · Touch devices never see the card hover image,** and it still downloads. 1600 px images are served everywhere, with no `srcset`.
11. [ ] **P3 · Copy and empty states.**
    - "{n} pieces" has no singular.
    - A category with no products has no empty state.
    - The PDP not-found page has no way back.
    - Category h1 reads as "RingsBagues" to screen readers.
    - Source: KI-050.
12. [ ] **P3 · Checkout inputs** lack `name`/`id`/`autocomplete`, and the US State select is ignored. UI-level fix only. Source: KI-030.

## 5. Copy & consistency (PROTO)

- [ ] **P2 · Gift-card range copy disagrees.**
  - The catalog says "$250 – $10,000" with `p(250, 200)`.
  - The mega menu says "From $100".
  - The presets run 100–5,000 and the custom range is 50–10,000 / 7,500.
  - On the Gifts page in USD, the card art shows $250 while the tile shows $200.
  - Source: KI-032.
- [ ] **P3 · Nameplate copy.** The spec "Diamond accent +$180" also shows in USD, where the price is +$130. `describePersonalization` hard-codes "Diamond accent". Source: KI-034.
- [ ] **P3 · Spelling.** "Jewellery" on cart surfaces vs "Jewelry" in catalog names. Pick one per locale. Source: KI-063.
- [ ] **P3 · Trust row, shipping/returns and care copy are identical for rentals and watches.** Tailor them.
- [ ] **P3 · Labels and links.**
  - The "Begin commission" label also applies to the fixed-price nameplate.
  - "Book a viewing" and "Ask a jeweller" go to the same `#/atelier`.
- [ ] **P3 · Engraving.**
  - The nameplate is `engravable` but shows no engraving field, while the cost breakdown still lists "Engraving — Included".
  - The engraving counter shows the untrimmed length.
- [ ] **P3 · `tax.ts` says "2024 rates"** while listing the 2025 NS rate. Source: KI-064.

## 6. Tooling & platform (PROTO)

1. [ ] **P1 · Site title.** The tab and `og:title` say "Figma Make App". Set `title` (and optionally `language`) in `.figma/make/site.json`, and consider per-route `document.title`. Source: KI-002.
2. [ ] **P2 · Formatter.** `pnpm run format` (oxfmt 0.2.0) corrupts the code and is denied in settings. Add a config matching the house style (single quotes, no semicolons, wide lines) and verify it on a copy, or leave it denied. Source: KI-001.
3. [ ] **P2 · No typecheck in build or deploy.** Consider a `typecheck` script. Source: KI-004.
4. [ ] **P3 · About 630 kB of initial JS** (entry 463 kB + shared vendor 167 kB). The pages are still eager. `lazy()` the pages. Source: KI-005.
5. [ ] **P3 · Favicon** is the Figma Make default. Source: KI-003.
6. [ ] **P3 · tsconfig.** `lib: ES2020` is narrower than the runtime target, and `types: ["node"]` leaks Node globals into browser code. Source: KI-006.
7. [ ] **P3 · Platform flags.**
   - The `addBypassLinks` skip link would route to Home (KI-007).
   - `ignoreReducedMotion` is unused (KI-009).
   - The toolchain differs from the `.mise.toml` pins (KI-008).
   - `.figma/make/*` hooks could get CRLF line endings on Windows clones.
8. [ ] **P3 · Dead code.**
   - `isGiftCardLine` (unused).
   - The store's `subtotal` and `useCartTotals().threshold` (unused).
   - The `.grain-overlay` CSS (`.font-sans-luxury` was removed 2026-10-16).
   - The redundant PDP slug-reset effect.
   - The unreachable compare-at strike-through.
   - Source: KI-020, KI-035.
9. [ ] **P3 · Duplicated computation.**
   - Checkout recomputes merch and gift totals.
   - The local `RentalPeriod` types duplicate `RentalPeriodId`.

## 7. Content placeholders (stand-ins, by design in the prototype)

Replace these only when real content exists. They are listed so they never ship by mistake.

- [ ] **Brand facts.** Salon address, phone and hours. Family names (Teresa, Antonio and Marco Moretti) and the heritage quote. Note the story mentions rue Sainte-Catherine while the salon is on rue Sherbrooke.
- [ ] **Press and social proof.** "As seen in" press names (real publications could mislead). Testimonials and "4.9 / 5 · 1,200+ reviews". PDP reviews, ratings and client media.
- [ ] **Social handles.** Instagram handle `@teresaandsons`, the grid photos, and the film handles such as `@claire.weds`.
- [ ] **Imagery.** Product photography (18 Unsplash images reused across 27 products). The gallery "Detail" crop needs real close-ups.
- [ ] **Films.** Mixkit stock; they don't show the actual pieces (e.g. "The oval, up close").
- [ ] **Product data.** GIA report numbers, specs, prices, collection-story stats and FAQ answers.
- [ ] **Cost breakdown.** Gram rates, bench rate, stone values and margins. Showing these is a public claim, so use real costs before anything is shown to customers.
- [ ] **Rentals.** Booked dates are generated per piece.
- [ ] **Gift cards and payments.** The demo gift card `TERESASONS1962MT`. The display-only Shop Pay line.

## 8. Future Shopify theme build (THEME, out of scope here)

These are recorded so the owner's real build has the full list. **Do not implement them in this repo** unless the owner explicitly asks.

- [ ] Port the pages and sections to an Online Store 2.0 theme. The mapping tables are in `shopify-integration.md`; skill `shopify-theme-port` handles planning.
- [ ] Real cart: send `/cart/add.js` payloads, use real variant IDs, and map jewellery lines (metal, size, engraving, personalization, booking). Today only gift cards are mapped, to the console.
- [ ] Cart `note`/`attributes` for gift wrap, receipt, message and note. Checkout never reads them today (KI-031).
- [ ] Shopify checkout: real tax (incl. US), discounts and promo codes, payments, order numbers and confirmation emails.
- [ ] Native gift cards: issuing, balances and recipient emails. Remove the local ledger. Decide how gift cards behave across currencies under Markets. Verify the $1-unit custom-amount pattern.
- [ ] Customer accounts and order history; real sign-in.
- [ ] A reviews app with real, moderated reviews and media (KI-060, KI-062).
- [ ] A rental booking app or backend: availability, holds and deposits.
- [ ] Newsletter provider and appointment-booking backend.
- [ ] Persistent and shared wishlists (KI-061), and cross-device or cross-tab state (KI-018).
- [ ] Inventory and stock status behind "In stock · ships within 48 hours".

## 9. Knowledge-base housekeeping

- [ ] **Commit `.claude/`** so the rules, skills and docs travel with the repo.
- [ ] **Restart Claude Code** (or run `/reload-skills`) so the skills register. Check what loaded with `/context`.
- [ ] **Optional: verify the 13 agent-written docs.** Their independent fact-check pass was cancelled. Verify each one incrementally when you touch its area (skill `update-knowledge-base`). `/kb-refresh all` does them all, but is token-heavy.
- [ ] **Keep this file current.** Tick items as they're fixed, and add new findings here and in `known-issues.md`.

## 10. Done since this list was compiled

Work that was never on the list, logged so it isn't redone or undone:
- [x] **Back-to-top control** (`src/components/BackToTop.tsx`). A progress bezel that expands on intent, lifts above `data-fab-avoid` bars and offers a return trip. Docs: `components/global-and-shared.md` §5.
- [x] **Typography (2026-10-16).** Baskervville display, Jost for text and figures, caps wordmark; `font-spec` renamed `font-spec`. Docs: `design-system.md` §2.
- [x] **Phones at 390 px (2026-10-16).** The wordmark stays on one line, the currency switch moved into the mobile menu below `sm`, and product cards stack name over price (this removed a 23 px horizontal overflow).
- [x] **Hero headline (2026-10-16).** A line could stay stuck above its mask when a slide returned while its exit tween still ran; fixed with `killTweensOf` and `setIndex` at `linesOut`. The line masks no longer clip descenders.
- [x] **Hero refined (2026-10-16).** Changes, documented in `pages/home.md` §4.1:
  - a catalog-driven featured piece (photo, name, GIA facts, link);
  - per-slide progress controls with a pause button;
  - autoplay that pauses on hover, keyboard focus, hidden tabs and off-screen;
  - full reduced-motion support, and carousel semantics with `inert` slides;
  - layered wipes without the mid-transition cut;
  - height-aware sizing for short laptops, plus a phone grade and phone controls.
- [x] **Hero title and first impression (2026-10-16).** Changes, documented in `pages/home.md` §4.1:
- [x] **Smooth marquees (2026-10-16).** Both strips now use one `Marquee` component on the Web Animations API (`motion-and-interaction.md` §6.6). It gives a constant speed, an exact seam, enough copies for any width, a start after fonts load, an eased hover stop, an off-screen pause and copies hidden from screen readers. The film-grain layer shrank from 200% to 124%.
- [x] **Sharing and gift hints (2026-10-16).** "Share" and "Drop a hint" on the PDP, and "Share list" on the wishlist (`features/sharing.md`). Two fixes came with it:
- [x] **Header "Collections" → "Shop" (2026-10-16).** The category mega-menu trigger is now "Shop". It also renders in capitals like the other nav links; as a `<button>` it had kept mixed case. Five more labels that meant a category followed: "Continue the discovery" (Treasured), "Find your piece" (empty bag), "Try these pieces on" (category toolbar), the Index aside and the 4Cs colour text. "Collection" is reserved for the curated system (§11).
  - KI-061: the wishlist's "Copy link" shared nothing useful;
  - "Complete the look" pushed every product page 388 px sideways on phones (`grid-cols-1`).
  - a flush-left lockup with a gold hairline into the italic, and a single glint;
  - focus-pull line reveals, and the photo lighting up on load;
  - a cursor key light and a warm grade;
  - Try on and wishlist on the featured piece, and "Book a private appointment";
  - swipe and arrow keys, focus rings and stronger contrast;
  - a site-wide "Skip to content" link.

## 11. Planned features (owner requests, 2026-10-16)

- [ ] **P1 · PROTO · "Shop all" page: every piece in one place. Next up.**
  - **Route.** `#/shop` (`href.shop`), added in all four routing places (`Route` union, `parseHash`, `href`, `Routes`). In the theme it maps to Shopify's built-in `/collections/all`.
  - **Page.** In the Category page's style: a vault hero ("Every *piece*", with the French *Toutes les pièces*), the "N pieces · Prices in {currency}" toolbar and sort. Every piece across the nine categories, filterable by category, with try-on for the wearable pieces.
  - **Entry points.** The header "Shop" mega menu (an "All pieces" row), the mobile menu and the footer's Shop column.
  - **Re-point** two CTAs that open Necklaces for now: Treasured's "Continue the discovery" and the empty bag's "Find your piece". Their labels were already renamed with this page in mind (2026-10-16).
- [ ] **P1 · PROTO · Curated collections: system and pages.** In jewellery, a *collection* is a curated story (Mont-Royal, Lumière), not a category. The header's category menu became "Shop" so the word is free for this.
  - **Model.** Add a `Collection` entity: slug, name, optional French name, story, hero and feature images, season or year, and a curated order of pieces. Membership is many-to-many: a collection can hold a single piece or pieces from several categories, and a piece can sit in several collections.
  - **Today.** `Product.collection` is one string per piece, and each of its 21 values maps to exactly one category (for example Mont-Royal → necklaces, Notre-Dame → bridal). The hero's "Collection Lumière · Automne" has no pieces at all. Keep a primary collection for card eyebrows, and add the membership list.
  - **Pages.** A `#/collections` index and a `#/collection/:slug` page: the story, the imagery, and the collection's pieces across categories, filterable by category. Follow the four-place routing rule.
  - **Navigation.** Add a "Collections" entry beside "Shop" (in the desktop bar or as a mega-menu column), plus the mobile menu and the footer. Link the card and PDP eyebrows (`product.collection`) to their collection, and add breadcrumbs.
  - **Copy.** The category-meaning uses of "collection" were renamed on 2026-10-16:
    - "Explore all collections" → "Continue the discovery";
    - "Shop the collections" → "Find your piece";
    - "Try this collection on" → "Try these pieces on";
    - the Index aside's "each collection" → "each piece";
    - the 4Cs colour text's "bridal collection" → "bridal stones".

    Once collections exist, check the hero's `aria-label="Featured collections"`.
  - **Shopify.** Categories and curated collections are both Shopify collections. Tell them apart with a collection metafield (for example `custom.kind`: `category` or `curated`) or a handle convention, and build the menus from it. Membership comes free, because a product can belong to many Shopify collections.

## Notes & gotchas

- **Priority is not permission.** Respect the prototype scope and the owner's decisions. Several items say "confirm with the owner" or "ask before starting".
- **Some issues are only symptoms.** Fixing §3.1 (shared `needsConfig`) also fixes parts of §5 and the Wishlist, CompleteTheLook and CartUpsell behaviour.

## Related docs

- [design-intent.md](design-intent.md) — the owner's principles and decisions
- [known-issues.md](known-issues.md) — full detail for every KI-xxx referenced here
- [history/figma-make-log.md](history/figma-make-log.md) — the source of the "asked but not delivered" items
- [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md) · [commerce-logic.md](commerce-logic.md) · [shopify-integration.md](shopify-integration.md)
