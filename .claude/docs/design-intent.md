# Design intent — what the owner asked for, and why

This doc distils the owner's 23 Figma Make prompts, and the decisions taken in response, into intent you can design against. The code shows *what exists*. This doc shows *what was wanted*: the principles behind it, the standing decisions, and what is still open. Where the two disagree, the code is the current state and this doc explains the goal.

Scope: [history/figma-make-log.md](history/figma-make-log.md) (steps 1–23, supplied 2026-10-15), cross-checked against the source the same day.

## 0. Scope: a design prototype

This repo is the **UI / UX / visual design prototype** of the Shopify theme the owner will build separately. It is not the store. Simulated behaviour (mock data, localStorage, confirmation screens) is intended. Backend work and live Shopify integration are out of scope here; the owner confirmed this on 2026-10-15. The Shopify wiring and the placeholders in §4–5 are inputs for that later build, not tasks for this repo.

## 1. The brief

**Teresa & Sons** is a family-owned fine-jewellery house in Montréal: diamonds, gold, engagement rings, custom design and occasion rentals. The owner asked for a premium Shopify store, shopping in **Canada and the United States**, across nine categories:

| Category | Sub-types asked for |
|---|---|
| Necklaces | diamond, pendants, tennis, personalized, religious |
| Earrings | studs, hoops, huggies, drops, diamond |
| Bracelets | tennis, chain, bangles, cuffs |
| Rings | stackable, pinky, statement, diamond eternity |
| Bridal | engagement, wedding bands, wedding-day jewellery |
| Watches | watches and related offerings |
| Rentals | necklaces, bracelets, earrings |
| Gifts | gift cards, jewellery by price range |
| Personalized & custom | bespoke, personalized |

The look was spelled out in the owner's words:
- "modern and luxurious and editorial style and premium";
- explicitly *not* "another ai made mediocre website design";
- made "like senior UI/UX designer at very high level design agency", "following all the UI/UX laws";
- using "gsap and lenis and others modern web tech";
- with a "mega menu in header … with visuals";
- a "multi page store".

## 2. Standing principles

| # | Principle | Where it comes from | How it shows in the code |
|---|---|---|---|
| 1 | **Editorial luxury, never template e-commerce** | Step 1, and every polish request | Token palette, light serif display with an italic gold word, hairlines, chapter numbering, film grain, GSAP/Lenis motion |
| 2 | **Extend, then refine** | Home 8 → 9, PDP 10 → 14, cart 22 ("top notch") | Each surface got a features pass, then a polish pass |
| 3 | **Put useful features "where suits"** | Steps 13, 16, 17 | Recently viewed in 7 places, try-on from 9 entry points, films in 5 places, each rendering nothing when empty |
| 4 | **Honest UI** | Step 11, and the placeholder flags in every response | No misleading totals or actions; placeholders called out; cost transparency (step 19) with a warning that cost and margin figures are a public claim |
| 5 | **Rentals are their own world** | Steps 11, 12, 15 | Never mixed with purchases; period pricing; deposit as a hold; date and slot booking |
| 6 | **Configuration integrity** | Steps 10, 15, 23 | Required options gate add-to-bag; exact-configuration identity drives "Go to bag"; quick-add only for option-free pieces |
| 7 | **Drawer-first bag** | Steps 22, 23 | Adding opens the drawer; the CTA becomes "Go to bag" |
| 8 | **Shopify compatibility** | Steps 1, 20, 22 | Gift cards on Shopify's native model, cart meta shaped for note/attributes, payloads in `src/lib/shopify.ts` |
| 9 | **Canada + US parity** | Steps 1, 4, 10, 14 | CAD/USD prices, provincial tax vs "Calculated by Shopify", duties-prepaid copy, market-specific shipping wording |
| 10 | **Signature experiences** | Steps 15, 16, 17, 19 | Personalization preview, rental calendar, virtual try-on, shoppable films, cost breakdown |

## 3. Decisions log

| Decision | Step | Notes |
|---|---|---|
| Hash routing (`#/…`) instead of a router package | 3 | Prototype in Figma Make; not wired to Shopify |
| USD = CAD × 0.73, rounded to $5; gift card has its own USD price | 2 | Placeholder pricing |
| Platinum +650 CAD, vermeil −400 CAD, golds ±0 | 2 | `METALS` |
| Rental periods: weekend / week / month | 1–2 | Planned as 4-day / 8-day rates; implemented as 3 / 7 / 30 days |
| Hero: 3-slide slideshow, 7 s, height-aware headline in an editorial cascade | 6–7 | `HomeHero.tsx` |
| Home "chapters" with a shared `SectionHeader` | 9 | — |
| Rental "Complete the ensemble" instead of hiding; automatic section numbering | 11–12 | `CompleteTheLook`, `sectionOrder` |
| Recently viewed store-wide: 12 items, 7 placements, "check once on open" on the PDP | 13 | — |
| Gallery: 1.8× hover zoom, "Detail" crop, "Film" view | 14, 17 | — |
| Try-on: manual placement plus vector drawings; face/hand tracking deferred | 16 | Tracking was offered, never requested |
| Cost breakdown: invented rates, 12% margin floor, rental version | 19 | Must use real costs before launch |
| Shared tax module | 18–19 | `src/data/tax.ts` |
| Gift cards modelled on Shopify; demo card `TERESASONS1962MT` | 20 | — |
| Gift Cards moved from the header bar into the mega menu | 21 | The bar is Collections · Bridal · Rentals · Atelier |
| Cart drawer animation moved from GSAP to CSS transitions | 22 | Fixed the drawer that never appeared |
| Adding opens the drawer; PDP and sticky bar show "Go to bag" | 23 | — |
| Back-to-top control: a progress bezel that expands on intent, lifts above `data-fab-avoid` bars and offers a return trip | After 23 (Claude Code) | `BackToTop.tsx`. Asked for a premium, smart button that never overlaps anything, with a smooth, never stepped, progress indicator |
| Typography: Baskervville display; Jost for text, labels and figures (`font-spec`); Pinyon Script only for engraving; caps wordmark with a gold italic ampersand | After 23 (Claude Code, 2026-10-16) | Replaced Cormorant Garamond, Plus Jakarta Sans and JetBrains Mono, which the owner found irritating. Asked for calm, premium, memorable faces that carry the legacy, without aggressive curves |

## 4. Open items from the history

| Item | Step | Status (2026-10-15) |
|---|---|---|
| Brief sub-types missing from the catalog: religious necklace, hoops, bangles, pinky ring, full eternity band, rental bracelet, wedding-day jewellery under Bridal | 1 | ✗ Only 3 products per category (KI-067) |
| Gifts "organized into different price ranges" | 1 | ~ Only the home GiftFinder budgets and a "Gifts under $1,000" collection label. No price-range browsing on the Gifts page |
| Face/hand tracking for try-on | 16 | Offered, not built |
| "Go to bag" from the video viewer and try-on (close the overlay first) | 23 | Offered, not built. The drawer still opens underneath the overlay (KI-068) |
| Newsletter thank-you | 3 | ✗ The form does nothing on submit (KI-065) |
| Real photo for the rentals hero slide | 6 | ✗ Still the pendant photo (KI-066) |
| GIA details on 8 pieces | 2 | ~ 4 pieces today |
| Shopify wiring | 3, 5, 10, 15, 17, 20, 22 | Simulated by design. Out of scope for this prototype; belongs to the future theme build |

What the Shopify wiring will need in the real theme build (not in this repo):
- send the cart payloads;
- real variant IDs;
- map `CartMeta` to cart attributes;
- customer accounts;
- a reviews app;
- a rental booking app;
- decide how gift cards behave across currencies under Markets.

## 5. Placeholders to replace before launch

All of these were flagged by Figma Make. They matter for the real theme build; in this prototype they are intentional stand-ins.
- **Contact and people:** the salon address, phone and hours; the family names (Teresa, Antonio and Marco Moretti) and the heritage quote.
- **Social proof:** the "As seen in" press names; the testimonials and "4.9 / 5 · 1,200+ reviews"; the PDP reviews and client media; the Instagram handle, photos and film handles.
- **Media:** product photography (Unsplash) and films (Mixkit stock, which don't show the actual pieces).
- **Product data:** GIA report numbers, specs and prices; collection-story stats and FAQ answers.
- **Cost breakdown:** gram rates, bench rate, stone values and margins. Showing these is a public claim.
- **Rentals:** booked dates, generated per piece.
- **Commerce:** Shopify variant IDs; the demo gift card; the display-only Shop Pay line.

## 6. Working with the owner

- **Prompts are short and outcome-focused.** Examples: "can homepage be more refined and polished", "add recently viewed items system where suits". Read them generously, at senior-agency quality, across every surface where the feature fits.
- **The owner asks *why* when something looks off** (step 11). Explain the reasoning plainly, then offer concrete options. Offered two good options, the owner chose "do both".
- **Report the way the build history did:** what changed, where (files), what was *not* verified, and which placeholders remain.
- **Token cost matters** (stated 2026-10-15). Work inline and avoid large multi-agent runs unless asked.

## Notes & gotchas

- **Later steps win.** Examples: the Gift Cards link moved from the header bar to the mega menu (21); Complete the look became a rental ensemble instead of being hidden (12); review submission went from a dead button to a real form (17).
- **Figma Make's reports were sometimes inaccurate** compared with the final code (8 GIA pieces, a newsletter thank-you). The status columns in the log record what was true on 2026-10-15.

## Related docs

- [history/figma-make-log.md](history/figma-make-log.md) — the full prompt and response history with status
- [product-overview.md](product-overview.md) — sitemap, features and journeys as built
- [known-issues.md](known-issues.md) — tracked defects, including KI-065 to KI-068 from the history
- [shopify-integration.md](shopify-integration.md) — what is Shopify-shaped and what is still to wire
- [brand-voice-and-copy.md](brand-voice-and-copy.md) — the brand as expressed in copy
