# Product detail page (PDP) — orchestration & purchase flow

`src/pages/Product.tsx` renders the product page for the hash route `#/p/:slug`. It looks up one catalog product and owns all configuration state (metal, rental period and booking, personalization, ring size, engraving), deriving the displayed price, the cart payload and the CTA and sticky-bar labels from it. It gates "Add to bag" with click-time validation and lays out about a dozen PDP modules in a fixed, condition-driven order. Module internals (gallery, personalizer, calendar, price breakdown, reviews…) are covered in depth in [PDP modules](../components/pdp-modules.md).

Scope: `src/pages/Product.tsx` (primary); as used by it: `src/components/pdp/*.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/RecentlyViewed.tsx`, `src/components/WishButton.tsx`, `src/store.tsx`, `src/data/catalog.ts`; context: `src/App.tsx`, `src/components/SmoothScroll.tsx`, `src/components/Price.tsx`, `src/components/ProductCard.tsx`, `src/components/useReveal.ts`, `src/components/video/ShoppableVideos.tsx`, `src/components/CartDrawer.tsx`, `src/components/lineDetails.ts`, `src/data/costing.ts`, `src/data/media.ts`, `src/lib/shopify.ts`.

---

## 1. Routing, mounting and the two non-PDP outcomes

| Hash | `parseHash()` result (`src/store.tsx`) | What renders |
|---|---|---|
| `#/p/<slug>` | `{ name: 'product', slug }` | `<Product key={route.slug} slug={route.slug} />` (`src/App.tsx` `Routes`) |
| `#/p/gift-card` | `{ name: 'giftcards' }` (special-cased **before** the generic `p` rule) | The Gift Cards page (`src/pages/GiftCards.tsx`), **never** the PDP |
| `#/p` (no slug) | falls through to `{ name: 'home' }` | Home |
| `#/p/<unknown>` | `{ name: 'product', slug }` | PDP not-found branch (below) |

- **Remount per product.** `Routes` passes `key={route.slug}`, so going from one product to another unmounts the old `Product` and mounts a fresh one. All local state resets as a result.
- **Scroll reset is not done by the PDP.** `SmoothScroll` (`src/components/SmoothScroll.tsx`) reacts to every `route` change. It calls `lenis.scrollTo(0, { immediate: true })`, or `window.scrollTo(0, 0)` when Lenis is off, then calls `ScrollTrigger.refresh()` on the next animation frame.
- **Not found.** When `getProduct(slug)` returns `undefined`, the page renders only:
  `<p className="font-serif-editorial py-40 text-center text-4xl">This piece has returned to the vault.</p>`
  Header and Footer still frame it, because they live in `App`. There is no breadcrumb, sticky bar or link back, and `recordView` is not called. Every hook still runs before this early return, and the `root` ref is never attached, so both GSAP layout effects exit early.
- **Gift card product links.** The `gift-card` product (`tns-gf-003`, category `gifts`, `metals: []`) still shows up as a `ProductCard` in the "Also in Gifts" grid on the other two gifts PDPs. Its card links to `#/p/gift-card`, which opens the Gift Cards page by design.
- **No document title.** Nothing in `src/` sets `document.title`. `index.html` contains `<title><!-- figma:title --></title>`.

---

## 2. What the page imports and why

| Import | From | Used for |
|---|---|---|
| `METALS`, `formatDay`, `getCategory`, `getProduct`, `getProductsByCategory`, `parseIso`, `personalizationPrice`, `priceFor`, `validatePersonalization`, types `Metal`, `Personalization`, `RentalBooking` | `src/data/catalog.ts` | Lookup, pricing, validation, labels |
| `href`, `lineKey`, `useStore` | `src/store.tsx` | Links, cart-line identity, global state |
| `Price` | `src/components/Price.tsx` | All money rendering |
| `ProductCard` | `src/components/ProductCard.tsx` | "Also in …" grid |
| `useReveal` | `src/components/useReveal.ts` | Scroll reveals and parallax for `[data-reveal]`, `[data-reveal-img]`, `[data-parallax]` |
| `Gallery` | `src/components/pdp/Gallery.tsx` | Left column (also hosts the badge, wishlist and try-on chip) |
| `getLenis` | `src/components/SmoothScroll.tsx` | Programmatic smooth scroll |
| `SectionHeader` | `src/components/home/SectionHeader.tsx` | "Also in …" header |
| `Accordion` | `src/components/pdp/Accordion.tsx` | Details, care, shipping and gift panels |
| `RingSize` | `src/components/pdp/RingSize.tsx` | Size step |
| `RentalCalendar`, `isBookingValid` | `src/components/pdp/RentalCalendar.tsx` | Dates step and booking gate |
| `Personalizer` | `src/components/pdp/Personalizer.tsx` | Personalization step |
| `TryOnButton` | `src/components/tryon/TryOnButton.tsx` | "View on you" under the CTA |
| `ShoppableVideos` | `src/components/video/ShoppableVideos.tsx` | Films rail |
| `PriceBreakdown` | `src/components/pdp/PriceBreakdown.tsx` | Itemised price section |
| `hasCostBreakdown` | `src/data/costing.ts` | Shows or hides the price-breakdown section and link |
| `videosForCategory`, `videosForProduct` | `src/data/media.ts` | Films list |
| `StickyBar` | `src/components/pdp/StickyBar.tsx` | Bottom purchase bar |
| `CraftStory` | `src/components/pdp/CraftStory.tsx` | Dark editorial section |
| `CompleteTheLook`, `getLookPieces` | `src/components/pdp/CompleteTheLook.tsx` | Set or ensemble upsell |
| `Reviews`, `getRatingSummary` | `src/components/pdp/Reviews.tsx` | Reviews section and header rating |
| `ProductFAQ` | `src/components/pdp/ProductFAQ.tsx` | FAQ section |
| `RecentlyViewed` | `src/components/RecentlyViewed.tsx` | History section |
| icons `ArrowRight, CalendarHeart, Check, Gift, MessageCircle, ShieldCheck, ShoppingBag, Star, Truck` | `lucide-react` | CTA, actions, trust row, rating |
| `gsap` | `gsap` | Entrance stagger |

`WishButton` (`src/components/WishButton.tsx`) is not imported by the page. It reaches the PDP through `Gallery` (stage, `size="lg"`) and through every `ProductCard` (`size` default `'sm'`).

---

## 3. Product archetypes — the flags that drive the page

The page has no "type" field. Its behaviour comes from these expressions, all in `src/pages/Product.tsx` unless another file is named:

| Flag / expression | Source | Effect on the PDP |
|---|---|---|
| `rental = product.rental` | `Product.rental?: RentalRates` | Rental mode: **Rental period** and **Dates & delivery** steps replace **Metal**; price = `rental[period][currency]` + "per …" + deposit line; CTA "Reserve this piece"; availability "Available for reservation · fitted in salon"; payload has `rental` + `booking` and no `metal` |
| `product.gia` | `Product.gia?: GiaSpec` | GIA certificate card after the trust row |
| `needsSize = product.category === 'rings' \|\| product.category === 'bridal'` | category only | **Ring size** step plus validation gate; `size` included in the payload |
| `pcfg = product.personalization` | `PersonalizationConfig` | **Personalize** step plus validation gate; accent add-on priced into `amount`; quoted text in the sticky-bar detail; `personalization` included in the payload |
| `showEngraving = !!product.engravable && !rental && (!pcfg \|\| !!pcfg.backEngraving)` | `engravable`, `personalization.backEngraving` | **Engraving** step ("Engraving — complimentary"); for personalized pieces it becomes "Reverse engraving — optional" |
| `product.leadTimeWeeks` | number | Availability "Made to order · approx. N weeks" (ignored for rentals) |
| `product.category === 'custom'` | category | CTA label "Begin commission" (unless rental) |
| `hasCostBreakdown(product)` = `p.metals.length > 0 && !/commission\|redesign/i.test(p.name)` | `src/data/costing.ts` | `PriceBreakdown` section plus "See full cost breakdown" link (non-rental) |
| `canTryOn(product)` = `tryOnKind(p) !== null` | `TryOnProvider` / `catalog.ts` | All three try-on buttons render, or none does (`TryOnButton` returns `null`) |
| `product.badges?.[0]` | `badges` | Badge chip on the gallery stage (only the first badge, only in `Gallery`) |
| `product.category` | — | `CraftStory` copy set (`bridal`, `watches`, `rentals`, else `default`) and extra `ProductFAQ` items (`bridal`, `rentals`, `watches`) — module-side |

### Archetype walkthrough

| Archetype | Example slugs | Info-column differences | Lower-section differences |
|---|---|---|---|
| **Standard gold piece** | `mile-end-huggies`, `outremont-pearl-drops`, `westmount-tennis-bracelet`, `riviere-saint-laurent`, `pearl-stud-gift-set` | Steps: `01 Metal` only. Availability "In stock · ships within 48 hours". CTA "Add to bag — {price}" | All sections; films only if the category has films (see matrix) |
| **GIA diamond** | `mont-royal-solitaire-pendant`, `vieux-port-diamond-studs`, `notre-dame-oval-solitaire`, `basilique-emerald-cut-three-stone` | Same as its base archetype, plus the GIA card (Shape · Carat · Color · Clarity · Cut, report №) | `PriceBreakdown` adds the centre-diamond and GIA-report lines (module) |
| **Ring (sizing)** | `rings`: `teresa-signet`, `sherbrooke-emerald-cocktail`, `laurier-stacking-band`; `bridal`: the three bridal pieces | Adds a `Ring size` step (11 sizes, no default) and the size gate. Bridal pieces default to **platinum** (`BRIDAL_METALS[0]`), so the default price includes +650 CAD / +475 USD | `CraftStory` uses the `bridal` copy for bridal only; `ProductFAQ` adds 2 bridal questions for bridal only |
| **Personalized** | `teresa-signet` (monogram, `backEngraving`), `initial-disc-pendant` (initial, chain lengths, `backEngraving`), `engraved-nameplate-necklace` (nameplate, chain lengths, accent add-on, **no** `backEngraving`) | Adds the `Personalize — {label}` step plus its gate; the engraving field turns into "Reverse engraving — optional" (signet, disc) or disappears (nameplate, although `engravable: true`) | `PriceBreakdown` receives `personalization` and shows the accent as an "options" line |
| **Engravable** | `plateau-paperclip-chain`, `atwater-cuff`, `griffintown-chain-bracelet`, the three bridal pieces, `heritage-automatic-38`, `bespoke-engagement-commission` (+ signet and disc as "reverse") | Adds the `Engraving — complimentary` step (18-character input with a live metal-tinted preview); no validation | — |
| **Rental** | `gala-diamond-collar`, `chandelier-sapphire-earrings`, `bridal-tiara-and-drops` | Steps `01 Rental period`, `02 Dates & delivery` (no metal picker). Price "per weekend/week/month", deposit line, "What the fee covers" link. CTA "Reserve this piece — {price}" | `PriceBreakdown` in rental mode; `CompleteTheLook` becomes "Complete the ensemble" (other rentals, shared booking and period); rental `CraftStory` and FAQ |
| **Made-to-order (lead time)** | `bespoke-engagement-commission` (8 wk), `heirloom-redesign` (6 wk), `engraved-nameplate-necklace` (3 wk) — all category `custom` | Availability "Made to order · approx. N weeks"; CTA "Begin commission — {price}"; gallery badge "Made to Order" | Commission and redesign have **no** `PriceBreakdown` (name regex); `heirloom-redesign` has **no** try-on |
| **Watch** | `heritage-automatic-38`, `chronographe-1962`, `dame-du-lac` | Metal picker lists case golds; only `heritage-automatic-38` is engravable; no size step | No films (no video tags a watch); `watches` `CraftStory`; one extra FAQ question; try-on kind `watch` |
| **`gift-card` slug** | `gift-card` | Never rendered — the router sends `#/p/gift-card` to the Gift Cards page | — |
| **Not-found slug** | anything else | Single line "This piece has returned to the vault." | none |

### Per-product matrix (computed from `src/data/catalog.ts` and the page's derivations)

The default metal is `metals[0]`, marked `*`. "Default price" is `amount` with no options chosen. "Films" is the number of tiles in the films rail. "Rating" is the header value from `getRatingSummary(slug)` (stable per slug). Every category holds exactly 3 products, so "Also in …" always shows 2 cards.

| Slug | Category | Metals | Default price CAD / USD | Configurator steps | Availability | CTA label | GIA | Cost breakdown | Films | Try-on kind | Rating |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `mont-royal-solitaire-pendant` | necklaces | 18k-yellow*, 18k-white, 18k-rose | 6,850 / 5,000 | Metal | In stock | Add to bag | 2231874590 | yes | 2 | necklace | 4.7 · 20 |
| `riviere-saint-laurent` | necklaces | 18k-white*, platinum | 38,500 / 28,105 | Metal | In stock | Add to bag | — | yes | 2 | necklace | 4.7 · 24 |
| `plateau-paperclip-chain` | necklaces | 18k-yellow*, 18k-white, 18k-rose, vermeil | 2,450 / 1,790 | Metal › Engraving | In stock | Add to bag | — | yes | 2 | necklace | 4.7 · 71 |
| `vieux-port-diamond-studs` | earrings | 18k-yellow*, 18k-white, 18k-rose, platinum | 8,900 / 6,495 | Metal | In stock | Add to bag | 6452198830 | yes | 3 | earrings | 4.7 · 124 |
| `outremont-pearl-drops` | earrings | 18k-yellow*, 18k-white | 4,200 / 3,065 | Metal | In stock | Add to bag | — | yes | 3 | earrings | 4.8 · 31 |
| `mile-end-huggies` | earrings | 18k-yellow*, 18k-white, 18k-rose, vermeil | 1,950 / 1,425 | Metal | In stock | Add to bag | — | yes | 3 | earrings | 4.8 · 26 |
| `westmount-tennis-bracelet` | bracelets | 18k-white*, 18k-yellow, platinum | 14,500 / 10,585 | Metal | In stock | Add to bag | — | yes | 3 | bracelet | 4.7 · 69 |
| `atwater-cuff` | bracelets | 18k-yellow*, 18k-white, 18k-rose | 5,600 / 4,090 | Metal › Engraving | In stock | Add to bag | — | yes | 3 | bracelet | 4.8 · 45 |
| `griffintown-chain-bracelet` | bracelets | 18k-yellow*, 18k-white, 18k-rose, vermeil | 1,650 / 1,205 | Metal › Engraving | In stock | Add to bag | — | yes | 3 | bracelet | 4.7 · 90 |
| `teresa-signet` | rings | 18k-yellow*, 18k-white, 18k-rose | 3,200 / 2,335 | Metal › Personalize (monogram) › Ring size › Reverse engraving | In stock | Add to bag | — | yes | 3 | ring | 4.7 · 81 |
| `sherbrooke-emerald-cocktail` | rings | 18k-yellow*, platinum | 21,800 / 15,915 | Metal › Ring size | In stock | Add to bag | — | yes | 3 | ring | 4.9 · 92 |
| `laurier-stacking-band` | rings | 18k-yellow*, 18k-white, 18k-rose, platinum | 1,350 / 985 | Metal › Ring size | In stock | Add to bag | — | yes | 3 | ring | 4.9 · 137 |
| `notre-dame-oval-solitaire` | bridal | platinum*, 18k-white, 18k-yellow, 18k-rose | 19,550 / 14,270 (catalog base 18,900 / 13,795) | Metal › Ring size › Engraving | In stock | Add to bag | 1449286107 | yes | 4 | ring | 4.7 · 74 |
| `basilique-emerald-cut-three-stone` | bridal | platinum*, 18k-white, 18k-yellow, 18k-rose | 27,050 / 19,745 (base 26,400 / 19,270) | Metal › Ring size › Engraving | In stock | Add to bag | 5402177764 | yes | 4 | ring | 4.7 · 146 |
| `promesse-wedding-band` | bridal | platinum*, 18k-white, 18k-yellow, 18k-rose | 2,100 / 1,535 (base 1,450 / 1,060) | Metal › Ring size › Engraving | In stock | Add to bag | — | yes | 4 | ring | 4.9 · 117 |
| `heritage-automatic-38` | watches | 18k-yellow*, 18k-white | 7,400 / 5,400 | Metal › Engraving | In stock | Add to bag | — | yes | 0 | watch | 4.7 · 91 |
| `chronographe-1962` | watches | 18k-rose*, 18k-yellow | 12,900 / 9,415 | Metal | In stock | Add to bag | — | yes | 0 | watch | 4.7 · 125 |
| `dame-du-lac` | watches | 18k-white*, 18k-rose | 9,600 / 7,010 | Metal | In stock | Add to bag | — | yes | 0 | watch | 4.8 · 144 |
| `gala-diamond-collar` | rentals | (platinum, not selectable) | 650 / 475 per weekend; deposit 5,000 / 3,650 | Rental period › Dates & delivery | Available for reservation | Reserve this piece | — | yes (rental mode) | 0 | necklace | 4.8 · 42 |
| `chandelier-sapphire-earrings` | rentals | (18k-white, not selectable) | 320 / 235 per weekend; deposit 2,500 / 1,825 | Rental period › Dates & delivery | Available for reservation | Reserve this piece | — | yes (rental mode) | 0 | earrings | 4.8 · 102 |
| `bridal-tiara-and-drops` | rentals | (platinum, not selectable) | 480 / 350 per weekend; deposit 3,500 / 2,555 | Rental period › Dates & delivery | Available for reservation | Reserve this piece | — | yes (rental mode) | 0 | earrings | 4.9 · 95 |
| `initial-disc-pendant` | gifts | 18k-yellow*, 18k-white, 18k-rose, vermeil | 680 / 495 | Metal › Personalize (initial) › Reverse engraving | In stock | Add to bag | — | yes | 0 | necklace | 4.7 · 147 |
| `pearl-stud-gift-set` | gifts | 18k-yellow*, 18k-white | 540 / 395 | Metal | In stock | Add to bag | — | yes | 0 | earrings | 4.8 · 141 |
| `gift-card` | gifts | none | — (routed to Gift Cards page) | — | — | — | — | — | — | none | — |
| `bespoke-engagement-commission` | custom | platinum*, 18k-white, 18k-yellow, 18k-rose | 5,650 / 4,125 (base 5,000 / 3,650) | Metal › Engraving | Made to order · approx. 8 weeks | Begin commission | — | **no** | 0 | ring | 4.7 · 115 |
| `heirloom-redesign` | custom | 18k-yellow*, 18k-white, 18k-rose, platinum | 1,800 / 1,315 | Metal | Made to order · approx. 6 weeks | Begin commission | — | **no** | 0 | **none** | 4.9 · 61 |
| `engraved-nameplate-necklace` | custom | 18k-yellow*, 18k-white, 18k-rose, vermeil | 1,250 / 915 (+180 / +130 with Diamond accent) | Metal › Personalize (your name) | Made to order · approx. 3 weeks | Begin commission | — | yes | 0 | necklace | 4.9 · 143 |

Rental rates for the other periods (CAD / USD): Gala — week 1,400 / 1,020, month 3,900 / 2,845. Chandelier — week 720 / 525, month 1,900 / 1,385. Tiara — week 1,100 / 805, month 2,800 / 2,045.

---

## 4. Page anatomy (top → bottom)

### 4.1 Wireframes

Desktop (`lg` ≥ 1024px; content capped at `max-w-[1600px]`):

```text
+------------------------------------------------------------------------------------+
| MAISON / NECKLACES / MONT-ROYAL SOLITAIRE PENDANT                  REF. TNS-NK-001 |  breadcrumb bar
+-----------------------------------------------------+------------------------------+
| lg:col-span-7   (inner wrapper lg:sticky lg:top-32) | lg:col-span-5  (scrolls)     |
| +------+ +----------------------------------------+ | * IN STOCK · SHIPS WITHIN 48 |
| |thumb | | [BESTSELLER]                       (<3) | | MONT-ROYAL · CHAPTER I       |
| |thumb | | [o VIEW ON YOU]                        | | Mont-Royal Solitaire Pendant |  h1
| |thumb | |                                        | | A single round brilliant,…   |  tagline
| |thumb | |              stage 4:5                 | | ***** 4.7  20 REVIEWS        |  -> #reviews
| +------+ |                                        | |------------------------------|
|  72px    | 01 / 04 · FRONT          (<) (>) (X)   | | $6,850 CAD                   |
|  rail    +----------------------------------------+ | Or 4 … with Shop Pay · Taxes |
|                                                     | calculated at checkout · See |
|                                                     | full cost breakdown          |
|                                                     |------------------------------|
|                                                     | description                  |
|                                                     | 01 METAL                     |
|                                                     | (o) 18k Yellow Gold  (o) …   |
|                                                     | [ ADD TO BAG — $6,850 CAD ]  |  <- ctaRef
|                                                     | [ o  VIEW ON YOU           ] |
|                                                     | [BOOK A VIEWING][ASK A JEWEL]|
|                                                     | TRUCK    | SHIELD   | GIFT   |  trust row
|                                                     | [ GIA ......... Report № ]   |  if product.gia
|                                                     | + DETAILS & DIMENSIONS (open)|
|                                                     | + CARE & SERVICING           |
|                                                     | + SHIPPING & RETURNS · CANADA|
|                                                     | + GIFT PRESENTATION          |
+-----------------------------------------------------+------------------------------+
| NN  PriceBreakdown  #price-breakdown          if hasCostBreakdown(product)         |
| NN  CraftStory (dark, image | text)           always                               |
| NN  ShoppableVideos "See it in motion"        if films.length > 0                  |
| NN  CompleteTheLook (bg-silk)                 if getLookPieces(product).length > 0 |
| NN  Reviews  #reviews                         always                               |
| NN  ProductFAQ                                always                               |
| NN  "Also in {Category}" 3-col ProductCards   if related.length > 0                |
| NN  RecentlyViewed 4-col                      if there is other history            |
+------------------------------------------------------------------------------------+
  StickyBar  fixed bottom-0 z-40:  [img] name / detail ...... price  [o]  [ CTA ]
  (slides up once the main CTA has scrolled above the viewport)
```

Mobile (< 1024px; single column, 24px side padding):

```text
+--------------------------------+
| MAISON / RINGS / THE TERESA S… |  "Ref." hidden < 640px
+--------------------------------+
| [BESTSELLER]              (<3) |
| [o VIEW ON YOU]                |
|           stage 4:5            |
| 01 / 04 · FRONT      (<) (>)   |  fullscreen button only >= 640px
+--------------------------------+
|        ____  __  __  __        |  dots (lg:hidden); no thumbnail rail
| * IN STOCK · SHIPS WITHIN 48 H |
| HERITAGE · CHAPTER IV          |
| The Teresa Signet      (3rem)  |
| Our founder’s ring, recast.    |
| ***** 4.7  81 REVIEWS          |
| $3,200 CAD …                   |
| description                    |
| 01 METAL                       |
| 02 PERSONALIZE — MONOGRAM      |
| 03 RING SIZE   (6-col grid)    |
| 04 REVERSE ENGRAVING — OPTIONAL|
| [ ADD TO BAG — $3,200 CAD ]    |
| [ o VIEW ON YOU ]              |
| [BOOK A VIEWING][ASK A JEWELLER]|
| trust row · accordion          |
+--------------------------------+
| lower sections, stacked        |
+--------------------------------+
| name / detail     [o] [ CTA ]  |  StickyBar: no thumbnail or price < 640px
+--------------------------------+
```

### 4.2 Block inventory (render order)

The root `<div ref={root}>` holds everything below. Blocks marked **pdp-in** carry `data-pdp-in` and join the entrance stagger (section 10).

| # | Block | Markup / component | Renders when | Notes |
|---|---|---|---|---|
| 1 | Breadcrumb bar | `div.border-b` > `div.font-spec … text-[10px] uppercase tracking-[0.24em] text-[var(--text-linen)]` | always (product found) | `<nav aria-label="Breadcrumb">`: `Maison` → `href.home` (`#/`), `/`, `{category.name}` → `href.category(category.slug)`, `/`, `{product.name}` (`truncate text-[var(--text-espresso)]`). Right side: `Ref. {product.id.toUpperCase()}` with `hidden shrink-0 sm:inline` |
| 2 | Main grid | `<section className="mx-auto grid max-w-[1600px] gap-12 px-6 py-10 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-14">` | always | Two columns from `lg` |
| 2a | Gallery column | `div.lg:col-span-7` > `div.lg:sticky.lg:top-32` > `<Gallery product={product} />` | always | Inside the stage: `badges[0]` chip (top-left), `WishButton size="lg"` (top-right), `TryOnButton variant="chip"` (left, `top-16`), counter and arrows. Details in the PDP-modules doc |
| 2b | Info column | `div.lg:col-span-5` | always | Rows 3–13 |
| 3 | Availability (pdp-in) | `div.flex.flex-wrap…` > `span` with a 1.5×1.5 gold dot + `{availability}` | always | `text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]` |
| 4 | Collection line (pdp-in) | `<p className="font-spec mt-8 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">` | always | `{product.collection} · Chapter {category.eyebrow}` |
| 5 | Title (pdp-in) | `<h1 className="font-serif-editorial mt-4 text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-[3.75rem] lg:text-[4.25rem]">` | always | `{product.name}` |
| 6 | Tagline (pdp-in) | `p.font-serif-editorial.mt-4.text-2xl.italic` taupe | always | `{product.tagline}` |
| 7 | Rating button (pdp-in) | `<button onClick={scrollToReviews}>` | always | 5 **always-filled** `Star`s (size 12, `fill-current`, gold), `{rating}` in the spec face, `{count} reviews` with a hairline underline that turns gold on hover. Values come from `getRatingSummary(product.slug)` |
| 8 | Price block (pdp-in) | `div.mt-10.border-y…py-7` | always | See section 6 |
| 9 | Description (pdp-in) | `<p className="mt-8 max-w-lg leading-[1.8] text-[var(--text-taupe)]">` | always | `{product.description}` |
| 10 | Configurator (pdp-in) | `<div className="mt-10 space-y-9">` | always (can be empty) | Steps in section 5 |
| 11 | Actions (pdp-in) | `div.mt-10` | always | CTA (`ref={ctaRef}`), `TryOnButton` (outline, `mt-3`, `null` when try-on is unavailable), 2-col grid of `<a href={href.atelier}>`: **Book a viewing** (`CalendarHeart`) and **Ask a jeweller** (`MessageCircle`) — both point to `#/atelier` |
| 12 | Trust row (pdp-in) | `<ul className="mt-10 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-center">` | always | Three cells: Truck (currency-dependent copy), ShieldCheck "Lifetime / warranty & care", Gift "Signature / gift presentation"; icon size 18, gold |
| 13a | GIA card (pdp-in) | `div.mt-10.border.p-1` > `div.border.bg-[var(--bg-silk)]/50.p-6` | `product.gia` | "GIA" (serif 3xl, `tracking-[0.12em]`), "Diamond grading report", "Report №" + number in gold. Then a 5-col `<dl>`: `Shape` = first word of `gia.shape`, `Carat` = `gia.carat.toFixed(2)`, `Color`, `Clarity`, `Cut` = first word of `gia.cut` |
| 13b | Accordion (pdp-in) | `div.mt-10` > `<Accordion defaultOpen="details" items=[…] />` | always | 4 items (section 8.5) |
| 14 | Price breakdown | `<PriceBreakdown product index={num('pricing')} metal personalization={pcfg ? personal : undefined} period />` | `hasCostBreakdown(product)` | Section `id="price-breakdown"`, `scroll-mt-32` |
| 15 | Craft story | `<CraftStory product index={num('story')} />` | always | Dark `bg-[var(--bg-vault)]`; image `data-parallax` uses `images[1] ?? images[0]` |
| 16 | Films | `<ShoppableVideos videos={films} index={num('films')} eyebrow="Watch & shop" title={<>See it in <em …>motion</em></>} />` | returns `null` when `films` is empty | `films` = videos tagging this product first, then other videos from the category |
| 17 | Complete the look / ensemble | `<CompleteTheLook product index={num('look')} period onPeriodChange={setPeriod} booking onNeedBooking={handleAdd} />` | returns `null` when `getLookPieces(product)` is empty (never, for the current catalog) | Rentals: shares `period` and `booking` with the page |
| 18 | Reviews | `<Reviews product index={num('reviews')} />` | always | Section `id="reviews"`, `scroll-mt-32` |
| 19 | FAQ | `<ProductFAQ product index={num('faq')} />` | always | Category-specific questions first, then 4 base questions |
| 20 | Also in {category} | `<section className="mx-auto max-w-[1600px] border-t border-[var(--border-hairline)] px-6 py-28 lg:px-12 lg:py-36">` + `SectionHeader` + grid `gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3` of `<ProductCard key={p.id} product={p} index={i} />` | `related.length > 0` | `related = getProductsByCategory(product.category).filter((p) => p.slug !== slug)`. Header: ``eyebrow={`Chapter ${category.eyebrow}`}``, title "Also in *{category.name}*", aside `<a className="link-line">View all</a>` → category |
| 21 | Recently viewed | `<RecentlyViewed exclude={product.slug} index={num('recent')} />` | the component returns `null` when no other viewed products exist | Defaults: eyebrow "Your journey", title "Recently *viewed*", limit 4, bordered, aside "Clear history" |
| 22 | Sticky bar | `<StickyBar product amount={amount} detail={detail} label={inBag ? 'Go to bag' : ctaLabel} target={ctaRef} onAction={onCta} />` | always mounted; visible only after the CTA leaves the viewport upward | Section 7.6 |

### 4.3 Section numbering (`sectionOrder` / `num`)

Lower sections are numbered in the order they actually render, so a hidden section never leaves a gap:

```ts
const sectionOrder = [
  hasCostBreakdown(product) && 'pricing',
  'story',
  films.length > 0 && 'films',
  getLookPieces(product).length > 0 && 'look',
  'reviews',
  'faq',
  related.length > 0 && 'related',
  hadHistory && 'recent',
].filter(Boolean) as string[]
const num = (id: string) => String(sectionOrder.indexOf(id) + 1).padStart(2, '0')
```

- `num()` for an id that is not in the list returns `'00'`. That is harmless, because every such section renders `null`.
- Each condition mirrors the matching component's own `return null` rule. `'recent'` uses the mount-time snapshot `hadHistory`, while `RecentlyViewed` checks the live `recent` list. `'recent'` is last, so any mismatch never shifts other numbers.
- Resulting numbering when other history exists (without history, `recent` drops out):

| Group | pricing | story | films | look | reviews | faq | related | recent |
|---|---|---|---|---|---|---|---|---|
| necklaces, earrings, bracelets, rings, bridal | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 |
| watches, rentals, `initial-disc-pendant`, `pearl-stud-gift-set`, `engraved-nameplate-necklace` | 01 | 02 | — | 03 | 04 | 05 | 06 | 07 |
| `bespoke-engagement-commission`, `heirloom-redesign` | — | 01 | — | 02 | 03 | 04 | 05 | 06 |

---

## 5. State, derived values and effects

### 5.1 Local state

| State | Type | Initial value | Set by | Reset by the slug effect? |
|---|---|---|---|---|
| `metal` | `Metal \| undefined` | `product?.metals[0]` | Metal buttons | yes → `product?.metals[0]` |
| `added` | `boolean` | `false` | `handleAdd` success → `true`; auto-reset after **2200 ms** | no |
| `period` | `'weekend' \| 'week' \| 'month'` (local `type RentalPeriod`) | `'weekend'` | Rental period buttons; `CompleteTheLook` `onPeriodChange` | no |
| `engraving` | `string` | `''` | Engraving input | yes → `''` |
| `size` | `string \| undefined` | `undefined` (no default size) | `RingSize` `onChange` | yes → `undefined` |
| `sizeError` | `boolean` | `false` | `handleAdd` (`!sizeOk`); cleared on size change | yes → `false` |
| `booking` | `Partial<RentalBooking>` | `{ method: 'courier' }` | `RentalCalendar` `onChange` | no |
| `bookingError` | `boolean` | `false` | `handleAdd` (`!bookingOk`); cleared on calendar change | no |
| `personal` | `Personalization` | lazy: `{ text: '', font: product?.personalization?.fonts[0] ?? 'serif', chainLength: product?.personalization?.chainLengths?.[1] ?? product?.personalization?.chainLengths?.[0] }` (the **second** chain length, i.e. `'18 in'`, when present) | `Personalizer` `onChange` | no |
| `personalError` | `boolean` | `false` | `handleAdd` (`!personalOk`); cleared on personalizer change | no |
| `hadHistory` | `boolean` (read-only) | lazy: `recent.some((s) => s !== slug)`, captured **before** `recordView` runs | never | — |
| `root` | `RefObject<HTMLDivElement>` | — | root div | — |
| `ctaRef` | `RefObject<HTMLButtonElement>` | — | main CTA button | — |

Personalization defaults per product: `teresa-signet` → `{ text: '', font: 'serif', chainLength: undefined }`. `initial-disc-pendant` → `{ text: '', font: 'serif', chainLength: '18 in' }`. `engraved-nameplate-necklace` → `{ text: '', font: 'script', chainLength: '18 in' }`. `accent` is absent until the checkbox is first toggled.

### 5.2 Derived values (computed on every render)

| Name | Definition (verbatim logic) |
|---|---|
| `category` | `getCategory(product.category)!` (non-null assertion) |
| `related` | `getProductsByCategory(product.category).filter((p) => p.slug !== slug)` |
| `rental` | `product.rental` |
| `needsSize` | `product.category === 'rings' \|\| product.category === 'bridal'` |
| `pcfg` | `product.personalization` |
| `amount` | `rental ? rental[period][currency] : priceFor(product, currency, metal) + personalizationPrice(product, pcfg ? personal : undefined, currency)` |
| `ctaLabel` | `rental ? 'Reserve this piece' : product.category === 'custom' ? 'Begin commission' : 'Add to bag'` |
| `detail` (sticky bar) | ``[rental ? `${period} rental` : metal && METALS[metal].label, rental && booking.start && `From ${formatDay(parseIso(booking.start))}`, pcfg && personal.text.trim() && `“${personal.text.trim()}”`, size && `Size ${size}`].filter(Boolean).join(' · ')`` |
| `films` | `[...videosForProduct(product.slug), ...videosForCategory(product.category).filter((v) => !v.products.includes(product.slug))]` |
| `sectionOrder`, `num` | section 4.3 |
| `configured` | the cart payload (section 7.1) |
| `inBag` | `cart.some((l) => l.key === lineKey(configured))` |
| `rating`, `count` | `getRatingSummary(product.slug)` → `rating = (4.7 + (s % 3) / 10).toFixed(1)` (string), `count = 18 + (s % 140)` |
| `availability` | ``rental ? 'Available for reservation · fitted in salon' : product.leadTimeWeeks ? `Made to order · approx. ${product.leadTimeWeeks} weeks` : 'In stock · ships within 48 hours'`` |
| `showEngraving` | `!!product.engravable && !rental && (!pcfg \|\| !!pcfg.backEngraving)` |
| `steps`, `stepNo` | section 5.5 |
| `stepLabel` | `'mb-4 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.22em]'` |
| `stepNum` | `'font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]'` |
| `metalSwatch` | `metal ? METALS[metal].swatch : '#D4B982'` (passed to `Personalizer` and used by the engraving preview band) |
| `shipCopy` | currency-dependent string (copy deck) |

Examples of `detail` (the sticky bar renders it `uppercase`): `18k Yellow Gold · “TMS” · Size 6.5` and `weekend rental · From Tue, Oct 20`. The date part comes from `toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' })`. Its exact punctuation depends on the browser's ICU data; Node 24 / ICU 78 prints `Tue, Oct 20`.

### 5.3 Effects and hooks (declaration order)

All hooks sit above the `if (!product)` early return.

| # | Hook | Dependencies | Behaviour |
|---|---|---|---|
| 1 | `useStore()` | — | Reads `currency, addToCart, recent, recordView, cart, setCartOpen` |
| 2 | `useEffect` reset | `[slug, product]` | `setMetal(product?.metals[0])`, `setEngraving('')`, `setSize(undefined)`, `setSizeError(false)`. In practice this runs once per mount, because `key={slug}` remounts the page and `product` is a stable reference from `PRODUCTS`. It does **not** reset `period`, `booking`, `personal`, the error flags for booking or personalization, or `added` |
| 3 | `useState(() => recent.some(...))` | — | `hadHistory` snapshot ("Snapshot history before recording this view so the section is stable while browsing.") |
| 4 | `useEffect` record view | `[product, recordView]` | `if (product) recordView(product.slug)`. In the store, `recordView` moves the slug to the front, de-duplicates, caps the list at **12** and persists it to `localStorage['tns-recent']`; it is a no-op when the slug is already first |
| 5 | `useReveal(root, [slug])` | `[slug]` | Layout effect: GSAP reveal for `[data-reveal]` (y 40 → 0, opacity 0 → 1, 1.2 s `expo.out`, delay = `data-reveal` value, ScrollTrigger `start: 'top 88%'`, `once`), `[data-reveal-img]` clip-path wipes, and `[data-parallax]` scrub (CraftStory image). Skipped under `prefers-reduced-motion: reduce`; reverted on cleanup |
| 6 | `useLayoutEffect` entrance | `[slug]` | `gsap.from('[data-pdp-in]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.1 })` inside `gsap.context(…, root)`; skipped when `root.current` is null or reduced motion is set; `ctx.revert()` on cleanup |
| 7 | `useEffect` added timer | `[added]` | When `added` is true, a `setTimeout` of **2200 ms** resets it; the timeout is cleared on cleanup |

The PDP does not set a document title, scroll to top, or track analytics.

### 5.4 Controls → state

| Control | Where | Handler | State touched | Downstream effect |
|---|---|---|---|---|
| Rental period buttons (`Weekend` / `One week` / `One month`) | configurator | `setPeriod(p)` | `period` | `amount`, "per …", `detail`, the `RentalCalendar` window length (an existing start can turn into a conflict), `PriceBreakdown` rental lines, `CompleteTheLook` prices and toggle |
| `RentalCalendar` day / method / slot | `#step-dates` | `onChange(v) → setBooking(v); setBookingError(false)` | `booking`, `bookingError` | `detail` "From …", `configured.booking`, `inBag` |
| Metal buttons (`aria-pressed`) | configurator | `setMetal(m)` | `metal` | `amount` (metal delta), `metalSwatch` (personalizer preview and engraving band), `detail`, `PriceBreakdown`, outline `TryOnButton` `metal` |
| `Personalizer` text / letter / font / chain / accent | `#step-personal` | `onChange(v) → setPersonal(v); setPersonalError(false)` | `personal`, `personalError` | `amount` (accent), `detail` quote, `TryOnButton` `text`, `PriceBreakdown` options line, `inBag` |
| `RingSize` buttons | `#step-size` | `onChange(s) → setSize(s); setSizeError(false)` | `size`, `sizeError` | `detail` "Size …", `configured.size`, `inBag` |
| Engraving `<input id="engraving">` | engraving step | `setEngraving(e.target.value)` | `engraving` | counter `{engraving.length}/18`, preview band, `configured.engraving`, `inBag` |
| Main CTA | actions | `onCta` | `added`, cart, `cartOpen` | section 7 |
| Sticky bar button | sticky bar | `onAction={onCta}` | same as the CTA | — |
| Rating button | header | `scrollToReviews` | — | scrolls to `#reviews` |
| "What the fee covers" / "See full cost breakdown" | price block | `scrollToId('price-breakdown')` | — | scrolls to `#price-breakdown` |
| CompleteTheLook period toggle (rental) | lower section | `onPeriodChange={setPeriod}` | `period` | two-way sync with the configurator |
| CompleteTheLook "Reserve the ensemble" without a valid booking | lower section | `onNeedBooking={handleAdd}` | `bookingError` (+ others) | `handleAdd` re-validates, fails on the booking, and scrolls to `#step-dates`; nothing is added |

Scroll helpers:

- `scrollToId(id)` and `scrollToReviews()` are identical in behaviour. With Lenis they call `lenis.scrollTo(el, { offset: -120 })`; otherwise `el.scrollIntoView({ behavior: 'smooth' })`, and the target's `scroll-mt-32` provides the offset.
- The validation scroll in `handleAdd` uses `lenis.scrollTo(el, { offset: -140 })`, falling back to `el?.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- `getLenis()` returns `null` under reduced motion, because `SmoothScroll` never creates Lenis then.

### 5.5 Configurator steps

```ts
const steps = [
  rental && 'period',
  rental && 'dates',
  !rental && product.metals.length > 0 && 'metal',
  pcfg && 'personal',
  needsSize && 'size',
  showEngraving && 'engraving',
].filter(Boolean) as string[]
const stepNo = (id: string) => String(steps.indexOf(id) + 1).padStart(2, '0')
```

| Step id | Render condition | Wrapper / anchor | Component or markup | What the page passes |
|---|---|---|---|---|
| `period` | `rental` | `<fieldset>` + `<legend className={stepLabel}>` | Inline: `grid grid-cols-3 gap-1.5` of 3 buttons, each with a label and `<Price amount={rental[p][currency]} />` | Selected: `border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]`, price `[&_span]:text-white/60`; unselected: `border-[var(--border-hairline)] hover:border-[var(--text-espresso)]`. No `aria-pressed` |
| `dates` | `rental` | `<div id="step-dates">` | `RentalCalendar` | `slug`, `period`, `step={stepNo('dates')}`, `value={booking}`, `error={bookingError}`, `onChange` |
| `metal` | `!rental && product.metals.length > 0` | `<fieldset>` + legend "Metal" | Inline `flex flex-wrap gap-2` of buttons with `aria-pressed={metal === m}`: a 20px swatch circle (`background: linear-gradient(135deg, ${swatch} 10%, #ffffffaa 45%, ${swatch} 85%)`, `shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]`) + `METALS[m].label` | Selected `border-[var(--text-espresso)]`; else `border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-linen)]`. **No price deltas are shown on the buttons** |
| `personal` | `pcfg` | `<div id="step-personal">` | `Personalizer` | `product`, `value={personal}`, `step={stepNo('personal')}`, `metalSwatch`, `showError={personalError}`, `onChange` |
| `size` | `needsSize` | `<div id="step-size">` | `RingSize` | `step={stepNo('size')}`, `value={size}`, `error={sizeError}`, `onChange` |
| `engraving` | `showEngraving` | plain `<div>` (no id; it is never a validation target) | Inline `<label htmlFor="engraving" className={stepLabel}>` + `<input id="engraving" maxLength={18} placeholder="Initials, a date, a word">` + a live preview band | Label: "Engraving — complimentary", or "Reverse engraving — optional" when `pcfg`. The counter `{engraving.length}/18` counts the **untrimmed** value |

Engraving preview band (decorative, `aria-hidden`): `mt-2 flex h-14 items-center justify-center overflow-hidden rounded-full` with `background: linear-gradient(180deg, #ffffff99 0%, ${metalSwatch} 35%, ${metalSwatch} 65%, #00000022 100%)`. The text `{engraving || 'Your engraving'}` is set in `font-serif-editorial truncate px-6 text-xl italic text-[#3b3226]/70 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]`.

Engraving input class: `w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]`.

Personalization rules (from `catalog.ts`, enforced by `validatePersonalization`):

| Product | `kind` | `label` | min–max | `allowed` | Fonts (first = default) | Chain lengths | Accent | `backEngraving` |
|---|---|---|---|---|---|---|---|---|
| `teresa-signet` | monogram (input upper-cases) | Monogram | 1–3 | `A-Za-z` | serif, script, block | — | — | yes |
| `initial-disc-pendant` | initial (A–Z letter grid) | Initial | 1–1 | `A-Za-z` | serif, script, block | 16 in, 18 in, 20 in | — | yes |
| `engraved-nameplate-necklace` | nameplate | Your name | 2–10 | `A-Za-zÀ-ÿ '\-` | script, serif, block | 16 in, 18 in, 20 in | Diamond accent, 180 CAD | no |

`validatePersonalization(cfg, text)` trims first and returns, in order: `'Please enter a letter'` (when `minLength === 1`) or `` `Please enter at least ${min} characters` ``; `` `Maximum ${max} characters` ``; `'Some characters cannot be engraved'` (regex `^[${allowed}]+$`); otherwise `null`.

---

## 6. Price display

### 6.1 Formula and formatting

- `amount` (section 5.2) is the single source for the price block, the CTA, the sticky bar and the cart. The store's `linePrice` (`src/store.tsx`) recomputes the same way: rental rate × qty, or `(priceFor + personalizationPrice) × qty`.
- `<Price amount className />` renders `<span class="font-spec …">{formatPrice(amount, currency)} <span class="text-[0.75em] text-[var(--text-linen)]">{currency}</span></span>`. `formatPrice` uses `Intl.NumberFormat` with `en-CA` (CAD) or `en-US` (USD), `style: 'currency'` and `maximumFractionDigits: 0`, giving e.g. `$6,850 CAD` or `$5,000 USD`. The `[&_span]:…` overrides used on the page restyle the trailing currency code.
- Main price: `<Price amount={amount} className="text-[1.75rem] tracking-tight" />`.

### 6.2 Metal deltas (`METALS`, `priceFor`)

| Metal id | Label | Swatch | Δ CAD | Δ USD = `Math.round(Δ × 0.73)` |
|---|---|---|---|---|
| `18k-yellow` | 18k Yellow Gold | `#D4B982` | 0 | 0 |
| `18k-white` | 18k White Gold | `#E4E2DD` | 0 | 0 |
| `18k-rose` | 18k Rose Gold | `#D9A68C` | 0 | 0 |
| `platinum` | Platinum 950 | `#CFCFCB` | +650 | +475 |
| `vermeil` | Gold Vermeil | `#B89047` | −400 | −292 |

`priceFor(product, currency, metal)` = `product.price[currency]` + the delta. The USD delta is rounded to the unit; it is not rounded to 5 the way catalog USD prices are. Pieces that default to platinum (all bridal, plus the bespoke commission) therefore open on the PDP above their catalog base price (matrix, section 3).

### 6.3 Personalization add-on

`personalizationPrice(product, p, currency)` returns 0 unless `p?.accent && product.personalization?.accent`. Otherwise it returns `accent.priceCAD` (180) in CAD, or `toUSD(180)` = `Math.round(180 × 0.73 / 5) × 5` = **130** in USD. Only `engraved-nameplate-necklace` defines an accent. Example: 18k-yellow with accent = 1,430 CAD / 1,045 USD.

### 6.4 Sub-line under the price

| Mode | Content (in order) |
|---|---|
| Rental | `Refundable deposit` `<Price amount={rental.deposit[currency]} className="text-[var(--text-espresso)]" />` ` · insurance included · ` + underline button **What the fee covers** → `scrollToId('price-breakdown')`. Next to the price: `per weekend` / `per week` / `per month` (`text-[11px] uppercase tracking-[0.2em]`) |
| Non-rental | (only when `amount >= 400`) `Or 4 interest-free payments of` `<Price amount={Math.round(amount / 4)} …/>` ` with Shop Pay · `, then `Duties prepaid` (USD) or `Taxes calculated at checkout` (CAD), then (only when `hasCostBreakdown(product)`) ` · ` + underline button **See full cost breakdown** |

The installment line therefore disappears for `pearl-stud-gift-set` in USD (395) and `initial-disc-pendant` in vermeil (280 CAD / 203 USD). Underline buttons use `border-b border-[var(--border-hairline)] text-[var(--text-espresso)] transition-colors hover:border-[var(--gold-vermeil)]`. The deposit is display-only and is not part of `amount` or the cart line.

---

## 7. Purchase flow

### 7.1 The payload (`configured`)

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
```

It is passed unchanged to `addToCart(line: Omit<CartLine, 'key' | 'qty'>)`. All seven keys are always present, some as `undefined`. `engraving` can only be non-empty when the engraving step is visible, because nothing else writes to it.

| Archetype | Example payload (shape) |
|---|---|
| Standard / GIA / watch | `{ slug: 'mont-royal-solitaire-pendant', metal: '18k-yellow' }` (+ `engraving: 'A & J'` if the piece is engravable and text was typed) |
| Ring / bridal | `{ slug: 'laurier-stacking-band', metal: '18k-yellow', size: '6.5' }`; bridal adds an optional `engraving` and defaults `metal: 'platinum'` |
| Monogram signet | `{ slug: 'teresa-signet', metal, size: '7', engraving?: 'reverse text', personalization: { text: 'TMS', font: 'serif', chainLength: undefined } }` |
| Initial disc | `{ slug: 'initial-disc-pendant', metal, engraving?: 'reverse text', personalization: { text: 'T', font: 'serif', chainLength: '18 in' } }` |
| Nameplate | `{ slug: 'engraved-nameplate-necklace', metal, personalization: { text: 'Sofia', font: 'script', chainLength: '18 in', accent?: true \| false } }` (no engraving field) |
| Rental | `{ slug: 'gala-diamond-collar', metal: undefined, rental: 'weekend' \| 'week' \| 'month', booking: { method: 'courier' \| 'salon', start: 'yyyy-mm-dd', slot: '09:00 – 11:00' \| '11:00 – 13:00' \| '14:00 – 16:00' \| '17:00 – 19:00' } }` |
| Made-to-order | the same as standard (+ `engraving` for the bespoke commission; + `personalization` for the nameplate) |

`lineKey` (`src/store.tsx`) gives each configuration its identity:
`[slug, metal, rental, engraving, size, JSON.stringify(booking ?? ''), JSON.stringify(personalization ?? ''), JSON.stringify(giftCard ?? '')].join('|')`. Examples:

```text
mont-royal-solitaire-pendant|18k-yellow||||""|""|""
teresa-signet|18k-yellow||J.M. 2026|6.5|""|{"text":"TMS","font":"serif"}|""
gala-diamond-collar||weekend|||{"method":"courier","start":"2026-10-20","slot":"09:00 – 11:00"}|""|""
```

### 7.2 Validation gates (`handleAdd`)

```ts
const bookingOk = !rental || isBookingValid(product.slug, period, booking)
const personalOk = !pcfg || validatePersonalization(pcfg, personal.text) === null
const sizeOk = !needsSize || !!size
setBookingError(!bookingOk)
setPersonalError(!personalOk)
setSizeError(!sizeOk)
if (!bookingOk || !personalOk || !sizeOk) {
  const target = !bookingOk ? 'step-dates' : !personalOk ? 'step-personal' : 'step-size'
  const el = document.getElementById(target)
  const lenis = getLenis()
  if (el && lenis) lenis.scrollTo(el, { offset: -140 })
  else el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return
}
addToCart(configured)
```

On success, `addToCart(configured)` is followed by `setAdded(true)`.

- All three flags are set together, so every failing step shows its error at once. The scroll goes to the **first** failure in the order `step-dates` → `step-personal` → `step-size`.
- `isBookingValid(slug, period, b)` (in `RentalCalendar.tsx`) requires `b.start` and `b.slot`. It also requires `start` ≥ today + `RENTAL_LEAD_DAYS` (2), and every day of the `RENTAL_DAYS[period]` window (weekend 3, week 7, month 30) to be absent from `getBookedDates(slug)`. `method` is never checked; it starts as `'courier'`.
- Nothing is validated for metal (it always has a default) or engraving (`maxLength={18}` is the only limit).
- **The CTA is never `disabled`.** Neither the main CTA nor the sticky-bar button has a `disabled` attribute; validation happens on click. The only disabled controls in the flow belong to modules: time slots stay disabled (`disabled:opacity-35`) until a start date is picked, and unavailable calendar days and month arrows at the limits are disabled.
- Error surfaces shown after a failed click (module copy, quoted for orientation):
  - Dates: legend turns `text-red-700`. With no start date it reads "Dates & delivery — choose a start date". With a start but no slot, the slot label turns red and gains " — please choose". The calendar frame gets `border-red-700/40`. Independently of the flag, a chosen start that no longer fits the period shows "This piece is reserved during part of a {period} rental from this date. Please choose another start date."
  - Personalization: the validation message replaces the hint under the field (`text-red-700`). The legend turns red while `showError` is true. Live validation also runs whenever the text is non-empty.
  - Size: legend turns red and reads "Ring size — please select".
- Each step's `onChange` clears its own error flag. The other flags stay set until the next click.

### 7.3 CTA states

```tsx
className={`group flex w-full items-center justify-center gap-3 py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors duration-500 ${added ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--text-espresso)] hover:bg-[var(--gold-vermeil)]'}`}
```

| Priority | Condition | Content | Click (`onCta`) |
|---|---|---|---|
| 1 | `added` (for 2200 ms after a successful add) | `Check` (15, stroke 1.6) + **Added to bag**, gold background | `inBag` is true by then → `setCartOpen(true)` |
| 2 | `inBag` | `ShoppingBag` (15, stroke 1.4) + **Go to bag** + `ArrowRight` (14, `group-hover:translate-x-1`) | `setCartOpen(true)` — nothing is added |
| 3 | otherwise | `{ctaLabel}` `<span className="opacity-40">—</span>` `<Price amount={amount} className="[&_span]:text-white/50" />` → e.g. **Add to bag — $6,850 CAD** | `handleAdd()` |

`onCta = () => (inBag ? setCartOpen(true) : handleAdd())`. Once an exact configuration is in the bag, the PDP cannot add a second unit of it; quantity is changed in the bag. Changing any keyed option (metal, size, engraving, personalization, period, booking) produces a new key, and the CTA goes back to add mode. Because the cart is persisted (`localStorage['tns-cart']`), a configuration already in the bag shows "Go to bag" on first render.

### 7.4 What happens after a successful add

1. `addToCart(configured)` (store) computes `lineKey`. If a line with that key exists its `qty` goes up by 1; otherwise the line is appended with `qty: 1`. The cart is persisted to `localStorage['tns-cart']`.
2. The store calls `setCartOpen(true)`. `CartDrawer` (`src/components/CartDrawer.tsx`) slides in from the right (`translate-x`, 700 ms, `cubic-bezier(0.16,1,0.3,1)`, `z-[90]` over a `z-[80]` scrim). It stops Lenis, sets `body` overflow to hidden, focuses its close button after 50 ms, and closes on Escape.
3. `setAdded(true)` turns the CTA into "Added to bag" for 2200 ms; after that it shows "Go to bag".
4. In the bag, `lineDetails` (`src/components/lineDetails.ts`) describes the line. Examples: metal label or "Weekend rental"/"One-week rental"/"One-month rental"; `Size 6.5`; `Tue, Oct 20 → Fri, Oct 23` and `Courier · 09:00 – 11:00`; `“TMS” · Serif`; `Reverse: “…”` or `Engraving: “…”`. The price is recomputed from the catalog in the current currency (`linePrice`); no price is snapshotted.
5. Shopify: `toShopifyCartItem` in `src/lib/shopify.ts` maps **only gift-card lines** and returns `null` for PDP product lines. See [Shopify integration](../shopify-integration.md).

### 7.5 Other ways into (and around) the PDP purchase flow

- Pieces that need configuration are deep-linked to the PDP by `href.product(slug)` instead of being added directly:
  - `TryOnStudio`: `needsConfig` = rental, personalization, rings, bridal or custom. Buttons read "Choose dates" / "Personalize this piece" / "Choose size & options".
  - `VideoViewer`: `configurable` = rental, personalization, rings or bridal. Button reads "Select options".
  - `CartUpsell`: `quickAddable` is false for those categories. Link reads "Options".
- `CompleteTheLook` adds pieces itself:
  - Non-rental "Add the set to bag" adds **every** piece, the current product included, as `{ slug, metal: p.metals[0] }`. That skips the PDP's chosen metal, size, engraving, personalization and gates (see Notes).
  - Rental "Reserve the ensemble" requires the PDP `booking` to be valid for the current product; otherwise it calls `onNeedBooking` = `handleAdd`. It then checks each piece with `isBookingValid` and adds them all as `{ slug, rental: period, booking }`. Each `addToCart` call also opens the drawer.

### 7.6 Sticky bar (`StickyBar`)

- **Trigger.** An `IntersectionObserver` (default threshold) watches `ctaRef`: `setShow(!e.isIntersecting && e.boundingClientRect.top < 0)`. The bar shows only after the main CTA has fully scrolled **above** the viewport, and hides again when the CTA comes back into view.
- **Container.** `fixed inset-x-0 bottom-0 z-40 border-t … bg-[var(--bg-travertine)]/95 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`, toggling `translate-y-0` and `translate-y-full`; `aria-hidden={!show}`.
- **Content.** Thumbnail `images[0]` (h-12 w-10, `hidden sm:block`); name (serif xl, truncate); `detail` (spec 10px uppercase, truncate; omitted when empty); `<Price amount={amount} className="hidden text-sm sm:inline" />`; `TryOnButton variant="icon"` with no metal, text or list; action button labelled `inBag ? 'Go to bag' : ctaLabel` (never "Added to bag", and with no price), `tabIndex={show ? 0 : -1}`, `onClick={onCta}`.

---

## 8. Other info-column blocks

### 8.1 Breadcrumbs and reference

Covered in section 4.2 row 1. The breadcrumb bar shows `product.id` upper-cased in JavaScript; the details accordion shows it upper-cased with CSS.

### 8.2 Badges

Only `Gallery` shows a badge, and only the **first** entry of `product.badges`, as a stage chip: `font-spec absolute left-5 top-5 bg-[var(--bg-travertine)]/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] backdrop-blur`. The info column has no badge. Its closest equivalent is the availability line with its gold dot.

### 8.3 Try-on buttons (`TryOnButton`)

Props: `product`, `metal?`, `text?`, `list?`, `variant?: 'outline' | 'chip' | 'icon' | 'link' | 'solid'` (default `'outline'`), `label?` (default `'View on you'`), `className?`. It returns `null` when `!canTryOn(product)`. On click it calls `preventDefault()` and `stopPropagation()`, then `openTryOn({ product, metal, text, list })`; the studio chunk is lazy-loaded by `TryOnProvider`.

| Placement | Variant | Props from the page |
|---|---|---|
| Gallery stage, `absolute left-5 top-16 z-10` | `chip` | `product` only |
| Under the CTA (`className="mt-3"`) | `outline` (full width, 1px espresso border, fills on hover) | `metal={metal}`, `text={pcfg && personal.text.trim() ? personal.text.trim() : undefined}`, `list={[product, ...related]}` (the studio drops pieces that cannot be tried on) |
| Sticky bar | `icon` (44×44, `aria-label="View on you: {name}"`, `title="View on you"`) | `product` only |

`heirloom-redesign` matches `/redesign/` and so has no try-on anywhere on its PDP; the gift card matches `/gift card/`. See [Virtual try-on](../features/virtual-try-on.md).

### 8.4 Wishlist (`WishButton`)

Rendered by `Gallery` in the stage's top-right column as `<WishButton slug={product.slug} size="lg" />`: a 48px circle with a 20px `Heart`, filled gold when wished. It sets `aria-pressed` and an `aria-label` of `Save to wishlist` or `Remove from wishlist`. On click it prevents default, stops propagation, calls `toggleWishlist(slug)` (persisted to `localStorage['tns-wishlist']`) and plays a GSAP pop (`scale 0.8 → 1`, 0.6 s, `elastic.out(1, 0.4)`). Each `ProductCard` in the related and recent grids has its own small (36px) `WishButton`.

### 8.5 Accordion (`Accordion`, `defaultOpen="details"`)

| id | Title | Content |
|---|---|---|
| `details` | Details & dimensions | `<dl className="divide-y …">`: one row per `Object.entries(product.specs)` (key → `<dt>`, value → `<dd className="font-spec text-right text-xs">`), then a fixed `Reference` row showing `product.id` with CSS `uppercase` |
| `care` | Care & servicing | fixed care copy (copy deck) |
| `ship` | Shipping & returns · Canada / Shipping & returns · United States | `shipCopy` (by currency) |
| `gift` | Gift presentation | fixed gift copy (copy deck) |

Behaviour (module): one item open at a time; clicking the open item closes it; the button carries `aria-expanded`; `Plus` rotates 45° and turns gold; the height animates via `grid-rows-[0fr]` ↔ `grid-rows-[1fr]` over 500 ms with `cubic-bezier(0.16,1,0.3,1)`. The content is `text-sm leading-relaxed opacity-80`.

### 8.6 Shipping, returns and services information

Spread across:

- the price sub-line ("Duties prepaid" / "Taxes calculated at checkout");
- the trust row (CAD: "Free insured / shipping in Canada"; USD: "Duties paid / shipping to the U.S.");
- the Shipping & returns accordion (`shipCopy`), plus the Care and Gift accordions;
- the two atelier links (Book a viewing / Ask a jeweller → `#/atelier`).

All of these switch with the header currency toggle (`setCurrency`, persisted to `localStorage['tns-currency']`). They are the same for rentals.

---

## 9. Responsive layout

Breakpoints are Tailwind v4 defaults (`sm` 640px, `lg` 1024px). `src/index.css` has no `@theme` override, and `Product.tsx` uses no `md`/`xl` variants.

| Area | < 640px | 640–1023px | ≥ 1024px |
|---|---|---|---|
| Breadcrumb | `Ref.` hidden; product name truncates | `Ref.` shown | padding `lg:px-12` |
| Main grid | 1 column, `gap-12`, `px-6 py-10` | same | `grid-cols-12`, `gap-16`, `px-12 py-14`; gallery 7 cols, info 5 cols |
| Sticky column | — | — | **Gallery** wrapper `lg:sticky lg:top-32` (8rem = 128px; the site `<header>` above it is `sticky top-0 z-50`). The **info column is not sticky**; it scrolls past the pinned gallery |
| Gallery (module) | dots, no thumbnail rail, no fullscreen button | fullscreen button appears (`sm:flex`) | 72px thumbnail rail (`lg:flex`), dots hidden |
| h1 | `text-[3rem]` | `sm:text-[3.75rem]` | `lg:text-[4.25rem]` |
| Ring sizes (module) | `grid-cols-6` | `sm:grid-cols-11` | `sm:grid-cols-11` |
| Time slots (module) | `grid-cols-2` | `sm:grid-cols-4` | same |
| Related grid | 1 col | `sm:grid-cols-2` | `lg:grid-cols-3` |
| Recently viewed | `grid-cols-2` | same | `lg:grid-cols-4` |
| Sticky bar | no thumbnail, no price, button `px-6` | thumbnail + price, button `sm:px-10` | inner `lg:px-12` |

The info column's elements stack with fixed vertical rhythm: `mt-8` collection, `mt-4` h1 and tagline, `mt-6` rating, `mt-10` price block (`py-7`, hairline top and bottom), `mt-8` description, `mt-10` configurator (`space-y-9` between steps), `mt-10` actions, `mt-10` trust row, `mt-10` GIA, `mt-10` accordion.

---

## 10. Motion on the page (summary)

- **Entrance:** the info-column blocks marked `data-pdp-in` (availability, collection, h1, tagline, rating, price, description, configurator, actions, trust row, GIA, accordion) run `gsap.from` with y 24 → 0, opacity 0 → 1, 1.1 s, stagger 0.06, `expo.out`, delay 0.1. The gallery is not part of this stagger. Its own effect fades and scales the stage image (opacity 0 → 1, scale 1.04 → 1, 0.9 s `expo.out`) on mount and on every view change.
- **Scroll reveals:** `useReveal(root, [slug])` drives every `data-reveal` inside the page (SectionHeaders, ProductCards, film tiles, CompleteTheLook items, FAQ, Reviews…) and the CraftStory parallax.
- **Micro-interactions:** CTA background `transition-colors duration-500`; the arrow nudge on "Go to bag"; sticky-bar slide (700 ms); accordion (500 ms); `WishButton` elastic pop.
- **Reduced motion:** the page's own GSAP (entrance stagger and `useReveal`) is skipped under `prefers-reduced-motion: reduce`, and Lenis is off, so the scroll helpers use native `scrollIntoView`. The gallery's stage fade and the `WishButton` pop are **not** guarded. See [Motion & interaction](../motion-and-interaction.md).

---

## 11. Copy deck — every user-visible string in `src/pages/Product.tsx`

Strings are shown exactly as written in the source. "UC" means the element applies CSS `uppercase`, so it renders in capitals. Typographic characters: `·` U+00B7, `–` U+2013, `—` U+2014, `“ ”` U+201C/U+201D, `№` U+2116.

| Context | Verbatim string | Condition / notes |
|---|---|---|
| Not found | `This piece has returned to the vault.` | `!product` |
| Breadcrumb `nav` aria-label | `Breadcrumb` | — |
| Breadcrumb (UC) | `Maison` · `/` · `{category.name}` · `/` · `{product.name}` | — |
| Breadcrumb right (UC) | `Ref. {product.id.toUpperCase()}` | ≥ 640px |
| Availability (UC) | `Available for reservation · fitted in salon` | rental |
| Availability (UC) | `` `Made to order · approx. ${product.leadTimeWeeks} weeks` `` | `leadTimeWeeks` |
| Availability (UC) | `In stock · ships within 48 hours` | otherwise |
| Collection line (UC) | `{product.collection} · Chapter {category.eyebrow}` | — |
| Rating button | `{rating}` and `{count} reviews` (UC) | — |
| Rental unit (UC) | `per {period === 'weekend' ? 'weekend' : period}` → `per weekend` / `per week` / `per month` | rental |
| Rental sub-line | `Refundable deposit ` + Price + ` · insurance included ·` + ` ` | rental |
| Rental link button | `What the fee covers` | rental |
| Installments | `Or 4 interest-free payments of ` + Price + ` with Shop Pay · ` | non-rental and `amount >= 400` |
| Tax / duties | `Duties prepaid` | non-rental, USD |
| Tax / duties | `Taxes calculated at checkout` | non-rental, CAD |
| Separator + link | `' · '` + `See full cost breakdown` | non-rental and `hasCostBreakdown` |
| Step legend (UC) | `Rental period` | rental |
| Period buttons (UC) | `Weekend` / `One week` / `One month` | rental |
| Step legend (UC) | `Metal` | non-rental with metals |
| Metal buttons | `METALS[m].label`: `18k Yellow Gold`, `18k White Gold`, `18k Rose Gold`, `Platinum 950`, `Gold Vermeil` | per `product.metals` |
| Engraving label (UC, with a normal-case span) | `Engraving` + ` ` + `— complimentary` | `showEngraving && !pcfg` |
| Engraving label | `Reverse engraving` + ` ` + `— optional` | `showEngraving && pcfg` |
| Engraving counter | `{engraving.length}/18` | — |
| Engraving placeholder | `Initials, a date, a word` | — |
| Engraving preview fallback | `Your engraving` | empty input |
| CTA (UC) | `Added to bag` | `added` |
| CTA (UC) | `Go to bag` | `inBag` |
| CTA (UC) | `{ctaLabel} — {Price}`; `ctaLabel` ∈ `Reserve this piece` / `Begin commission` / `Add to bag` | otherwise |
| Secondary links (UC) | `Book a viewing` / `Ask a jeweller` | — |
| Trust cell 1 (UC) | `Free insured` / `shipping in Canada` | CAD |
| Trust cell 1 (UC) | `Duties paid` / `shipping to the U.S.` | USD |
| Trust cell 2 (UC) | `Lifetime` / `warranty & care` | — |
| Trust cell 3 (UC) | `Signature` / `gift presentation` | — |
| GIA card | `GIA`; `Diamond grading report` (UC); `Report №` (UC) + `{product.gia.reportNumber}` | `product.gia` |
| GIA `<dt>`s (UC) | `Shape`, `Carat`, `Color`, `Clarity`, `Cut` | `product.gia` |
| Accordion title (UC via `Accordion`) | `Details & dimensions` | — |
| Accordion row | `Reference` | — |
| Accordion title | `Care & servicing` | — |
| Accordion body | `Store separately in the pouch provided. Remove before swimming or applying lotions. Bring it to our salon each year for complimentary ultrasonic cleaning, claw inspection and polishing.` | — |
| Accordion title | `Shipping & returns · Canada` | CAD |
| Accordion title | `Shipping & returns · United States` | USD |
| Accordion body (`shipCopy`) | `Complimentary insured shipping across Canada, 2–3 business days, signature required. Returns accepted within 30 days on non-personalized pieces.` | CAD |
| Accordion body (`shipCopy`) | `Complimentary insured shipping to the United States, 3–5 business days. Duties and import fees are prepaid — nothing due on delivery. 30-day returns on non-personalized pieces.` | USD |
| Accordion title | `Gift presentation` | — |
| Accordion body | `Every piece arrives in our signature travertine box with a linen pouch, care card and an optional handwritten note. Gift receipts never show prices.` | — |
| Films header props | eyebrow `Watch & shop`; title `See it in ` + `<em>motion</em>` | `films.length > 0` |
| Related header props | eyebrow `` `Chapter ${category.eyebrow}` ``; title `Also in ` + `<em>{category.name}</em>`; aside `View all` | `related.length > 0` |
| Sticky bar label | `Go to bag` or `ctaLabel` | — |
| Sticky bar detail fragments | `` `${period} rental` `` (→ `weekend rental` / `week rental` / `month rental`), `` `From ${formatDay(...)}` ``, `` `“${text}”` ``, `` `Size ${size}` ``, joined with `' · '` | UC in the bar |

Data-driven strings shown on the page are `product.name`, `tagline`, `description`, `collection`, `specs` keys and values, `category.name` and `category.eyebrow`, and the `gia` fields. They live in `src/data/catalog.ts`; see [Data model](../data-model.md). Module headings (e.g. "The price, itemised", "In their words", "Before you decide", "Complete the look", "Recently viewed") are documented in [PDP modules](../components/pdp-modules.md).

---

## Notes & gotchas

Observations, risks and recommendations (opinion is labelled as such):

1. **Bridal and commission PDP prices are higher than their cards.** `ProductCard`, `CompleteTheLook` (non-rental), `VideoViewer` and `CartUpsell` show `priceFor(p, currency)` **without** a metal. The PDP and the cart apply `metals[0]`, and for every bridal piece and `bespoke-engagement-commission` that is platinum (+650 CAD / +475 USD). Example: Notre-Dame shows 18,900 CAD on its card and 19,550 CAD on the PDP. The commission's description says "Price shown is a starting deposit", yet the PDP shows 5,650. The "Complete the look" set total uses base prices while the lines it adds carry platinum. *Recommendation:* decide whether `metals[0]` or the base price is canonical and align both.
2. **"Complete the look" skips the PDP's gates and choices.** The non-rental "Add the set to bag" adds the current product and each paired piece as `{ slug, metal: p.metals[0] }`, ignoring the metal, size, engraving and personalization chosen above. On ring and bridal PDPs this adds a ring with **no size**. `teresa-signet` is the paired ring on earrings, bracelets and watches PDPs, and is added with no monogram or size even though its PDP requires both. The Wishlist page's "add all" likewise adds rings with no size; it only filters out rentals, personalization and the gift card.
3. **Cart-line identity is JSON-order and key-presence sensitive.** `lineKey` stringifies `personalization` and `booking`. Toggling the nameplate accent on and then off leaves `accent: false`, which does not equal a key with no `accent`. The same visible configuration can then produce a second bag line, and `inBag` stays false.
4. **One unit per configuration from the PDP.** Once a configuration is in the bag, both the CTA and the sticky bar only open the drawer (an intentional comment says so); more units must be added from the bag.
5. **The header rating always shows five filled stars**, whatever `rating` is (4.7–4.9). Its `{count} reviews` excludes the user's own submissions, which the Reviews section adds (`count + mine.length`).
6. **Rental-irrelevant copy on rental PDPs.** The trust row, "Shipping & returns" accordion (30-day returns) and the care text ("claw inspection", also shown for watches) are identical for every archetype.
7. **The nameplate is `engravable: true` but shows no engraving field**, because `showEngraving` requires `pcfg.backEngraving`. `buildCostBreakdown` (`src/data/costing.ts`) still lists "Engraving — Included" for it.
8. **`needsSize` is category-based.** `bespoke-engagement-commission` (custom; try-on kind `ring`) has no size step. Other surfaces repeat their own "configurable" rules (`TryOnStudio` `needsConfig`, `VideoViewer` `configurable`, `CartUpsell` `quickAddable`, Wishlist filter), and they already differ from each other (e.g. only some include `custom`). *Recommendation:* centralise one `needsConfiguration(product)` helper in `catalog.ts`.
9. **The CTA label "Begin commission" covers every `custom` product**, including the fixed-price nameplate. It still adds to the bag directly; there is no consultation step.
10. **The reset effect is mostly redundant** because of `key={slug}` in `App.tsx`. It also only resets metal, engraving, size and `sizeError`. If the `key` were ever removed, `period`, `booking`, `personal`, the other error flags and `added` would leak between products.
11. **Duplicated scroll helpers and types.** `scrollToReviews` is the same as `scrollToId('reviews')`. `type RentalPeriod` is declared locally even though `RentalPeriodId` (catalog) and the exported `RentalPeriod` (CompleteTheLook) are the same union.
12. **Accessibility gaps (observed).** Rental period buttons lack `aria-pressed`, while metal buttons have it. The sticky bar's container gets `aria-hidden` while hidden, but only its action button gets `tabIndex={-1}`; the `TryOnButton` icon inside stays keyboard-focusable while the bar is off-screen. Validation errors are shown visually only; there is no `aria-live` or `aria-invalid` on the page.
13. **The engraving counter counts untrimmed characters**, and engraving text is never validated beyond the 18-character limit (`maxLength={18}`).
14. **The installment threshold applies to the displayed currency amount** (`amount >= 400`), so the Shop Pay line disappears for some USD prices and vermeil options (section 6.4).
15. **`hadHistory` is a mount-time snapshot.** It only controls numbering. If the history holds only slugs that no longer exist, `'recent'` is still numbered but `RecentlyViewed` renders nothing; it is the last section, so nothing visibly breaks.
16. **No per-product `document.title` or meta.** A Shopify port gets this from Liquid; the prototype does not.
17. **"What the fee covers" is a no-op when `#price-breakdown` is absent.** `scrollToId` exits early when the element is missing. All current rentals have a breakdown, but a rental whose name matched `/commission|redesign/` or with `metals: []` would break the link.
18. **Shopify mapping is missing for product lines.** `toShopifyCartItem` handles gift cards only; metal and size variants and the engraving, personalization and booking line-item properties still need a mapping (see [Shopify integration](../shopify-integration.md)).

---

## Related docs

- [Product overview, sitemap & user journeys](../product-overview.md)
- [Architecture & runtime model](../architecture.md)
- [Figma Make platform, toolchain & build](../platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](../design-system.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [Brand, voice & copywriting](../brand-voice-and-copy.md)
- [Data layer — catalog, media, gift cards, costing & tax](../data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](../commerce-logic.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [Home page](./home.md)
- [Category (collection) page & product card](./category.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](../components/pdp-modules.md)
- [Cart drawer, cart page & checkout](./cart-and-checkout.md)
- [Virtual try-on](../features/virtual-try-on.md)
- [Shoppable video & the Atelier page](../features/shoppable-video-and-atelier.md)
- [Gift cards — purchase builder & balance checker](./gift-cards.md)
- [Account & wishlist pages](./account-and-wishlist.md)
- [Global chrome & shared components](../components/global-and-shared.md)
- [Code conventions](../code-conventions.md)
- [UX patterns, responsive behaviour & accessibility](../ux-patterns-and-accessibility.md)
- [Known issues, risks & tech debt](../known-issues.md)
- [File index](../INDEX.md)
