# Shop all page (`#/shop`)

Shop all is every piece the house lists, in one place: a hero on the vault's dark ground (the title, the house in figures, the edits, and the pieces drifting past), the nine chapters as picture tiles, then the pieces under a bar pinned beneath the header. The bar holds the filters (a side panel with counts, multi-select values and a price slider), a search within the shop, the sort, three densities and the worn photographs. Everything the visitor chooses lives in the address. The house's own cards sit among the pieces, any piece opens in a quick view, and a card's photograph flies into its page. The page closes on the house's promises, a band for pieces made to order, the salon and the recently viewed pieces. Built 2026-10-24 at the owner's request ("super top notch… filters and searching and sorting and ordering and view by and CTA and offer cards… that product card to pdp image transition… put shop all link to menus and megamenus and all").

Scope: `src/pages/Shop.tsx`, `src/components/shop/filters.ts`, `src/components/shop/useShopCopy.ts`, `src/components/shop/ShopHero.tsx`, `src/components/shop/ShopMosaic.tsx`, `src/components/shop/ChapterRail.tsx`, `src/components/shop/ShopToolbar.tsx`, `src/components/shop/ShopSearch.tsx`, `src/components/shop/WornSwitch.tsx`, `src/components/shop/FilterPanel.tsx`, `src/components/shop/PriceRange.tsx`, `src/components/shop/OfferCard.tsx`, `src/components/shop/QuickView.tsx`, `src/components/shop/useGridMotion.ts`, the shop's props on `src/components/ProductCard.tsx`, and the Shop all entries in `src/components/Header.tsx`, `src/components/menu/SiteMenu.tsx`, `src/components/Footer.tsx`, `src/components/CartDrawer.tsx`, `src/pages/Wishlist.tsx`, `src/pages/Category.tsx`, `src/pages/Product.tsx`, `src/App.tsx`, `src/components/transition/PageTransition.tsx` and `src/components/menu/useHouseSearch.ts`.

---

## 1. Route, address and mounting

| Item | Value |
| --- | --- |
| URL | `#/shop`, `href.shop(query)`; French `#/fr/shop`. Shopify's `/collections/all` (and `/search?q=` with a search). |
| Mount | `Routes` renders `<Shop key={queryString(route.query)} query={route.query} />`: a link to other options remounts it; the page's own changes rewrite the address with `replaceQuery` (no history entry, no remount). |
| Tab title | `Shop All — Teresa & Sons` / `Toute la boutique — Teresa & Sons`; with `?q=`, `Search: {q}` / `Recherche : {q}` (`headFor`, `src/App.tsx`). |
| Curtain card | `['Shop all', 'Every <em>piece</em>']` / `['Toute la boutique', 'Toutes les <em>pièces</em>']`; with a search `['Search', '“<em>{q}</em>”']` (`PageTransition` `CARDS.shop`). |

**The address** (`readSelection` / `writeSelection` in `filters.ts`; only what differs from the defaults is written, keys sorted by `queryString`):

| Key | Values | Notes |
| --- | --- | --- |
| `q` | text | The search (the header's "See all" lands here). |
| `chapter` `type` `metal` `stone` `shape` `how` `tag` `svc` `own` | comma lists (`metal=platinum,18k-white`) | Unknown values are dropped. `avail` (the old single "how", 2026-10-21) still reads as `how`. |
| `min` `max` `in` | whole units, `in` = `CAD` or `USD` | A range holds only in the currency it was chosen in; switching markets drops it. Either end may be open. |
| `sort` | `new`, `low`, `high`, `name` | `recommended` is the default; the old `featured` reads as it. |
| `view` | `large`, `compact` | `grid` is the default. |
| `look` | `worn` | Cards lead with their second photograph. |
| `page` | 2–40 | Sets of twelve shown ("Show more"), so Back returns to the same depth. |

## 2. The engine (`src/components/shop/filters.ts`)

Pure functions over the catalog, no React.

- **`SHOP_PIECES`**: `PRODUCTS` minus the gift card (34 pieces). **`RECOMMENDED`**: the house's order. Lanes are the chapters in the order bridal, necklaces, earrings, bracelets, rings, rentals, watches, gifts, custom (a piece's own `category`); within a lane the chapter's signature family first, then by badge (Bestseller, Atelier Exclusive, New, Limited, none, in catalog order on ties); the lanes are then taken in turn, so the first row runs Notre-Dame, Redpath, Vieux-Port studs, Westmount, the Teresa signet, the bridal tiara, the Heritage watch, the initial disc, the bespoke commission.
- **Facets** (`FACETS`, the panel's order; the price sits after the metal):

  | Facet | Values | A piece's values |
  | --- | --- | --- |
  | `chapter` | the nine `CATEGORIES` | `inChapter`: its own, `alsoIn`, and Rentals for every rentable piece (as chapter pages count) |
  | `type` | type families: the two signatures (`engagement`, `tennis`) first, then catalog order | `familyOf(p.type)` |
  | `metal` | `METALS` keys | `p.metals` |
  | `stone` | `diamond`, `pearl`, `emerald`, `sapphire`, `none` | `stonesOf`: read from the English description and specs (a `gia` means diamond; "emerald-cut" is a shape, not an emerald; "mother-of-pearl" is not a pearl; an `optional` accent and the `Option` spec don't count). Commissions and redesigns have none. |
  | `shape` | GIA shapes as ids (`round`, `oval`, `emerald`, `cushion`, `radiant`) | `shapeId(p.gia.shape)` |
  | `how` | `rent`, `ready`, `made` | `howOf`: `rent` when it has rates; `made` with `leadTimeWeeks`, else `ready` |
  | `tag` | `new`, `bestseller`, `exclusive`, `limited` | its badges (`Made to Order` is `how=made`) |
  | `svc` | `engrave`, `personalize`, `tryon` | `engravable`, `personalization`, `tryOnKind` |
  | `own` | `saved`, `viewed` | the visitor's wishlist and recently viewed |

  Values are OR'd within a facet and AND'd across facets; a search narrows to what it found.
- **`browse(pieces, selection, context)`** returns the pieces in order, each value's count (the other choices kept, so a count says what that value alone would give), the price scale and histogram, whether renting is asked (`how` is exactly `rent`, or the search asks to rent), `rentLed(p)` and `priceOf(p)`.
- **Prices.** As in the header's search, a price means the price to own: once a range is set or the sort is by price, the vault's pieces show and sort by their price to own (`rentLed` false, the card's `lead="own"`, its link `?mode=own`); renting asked means weekend rates throughout. The scale (`priceScale`) runs on round figures (1, 1.5, 2, 2.5, 3, 4, 5, 7.5 in each decade) from the one at or below the lowest price to the one at or above the highest: CAD 500 … 100,000 (19 stops), USD 300 … 75,000, renting CAD 100 … 750. Choosing or dropping "rent only" clears a range (the panel's `toggle`).
- **Sorts** (`SORTS`): `recommended` (the house's order, or the search's ranking: "Best match"), `new` (New first), `low` / `high` (the shown price), `name` (the name on screen, `localeCompare` in the locale).
- **Edits** (`EDITS`, each replaces the choices and keeps the sort and the view): `signatures` (`type=engagement,tennis`), `new`, `bestsellers`, `rent`, `gifts` (`max` CAD 2,000 / USD 1,500), `engrave`, `made`. `isEdit` tells when the selection is exactly one.
- **Offers** (`offersFor`): `designer` when the pieces include a ring or the commission; `rent` when some can be rented and renting isn't asked; `engrave` when two or more can be engraved and the filter isn't on; `gift` always. Gifts (the chapter, or a ceiling of 2,000 or less) lead with the gift card, the Rentals chapter with renting; the designer otherwise leads when it shows. **`cellsFor`** sets them at places 4, 21, 34 and 47, each only before a piece. **`PAGE`** = 12 cells per "Show more", a multiple of every row length, so each set ends on a full row.
- **`loosen`**: for an empty result, each single choice whose removal brings pieces back, most pieces first, at most three.

## 3. Page anatomy (`src/pages/Shop.tsx`)

1. **`ShopHero`** (vault). Breadcrumb `Maison / Shop all` (`Maison / Toute la boutique`); H1 `Every <em>piece</em>` (`Toutes les <em>pièces</em>`), `clamp(3.25rem,15vw,5.5rem)`, `lg:clamp(5.5rem,8.6vw,9.5rem)`; the house text; the figures from the catalog (34 Pieces · 9 Chapters · 9 To rent or own · From {lowest price to own}); "The edits" (`Les sélections`) as pills with their counts (`aria-pressed`; one with no piece is left out). Pressing an edit applies it and scrolls to the pieces. Opened on a search (`?q=` at arrival) it names it (`Maison / Search`, `“{q}”`, "From all nine chapters, with every filter below.", `{n} pieces found`) and keeps that height while the visitor searches on.
   - **`ShopMosaic`**: the first 18 pieces of `RECOMMENDED` (or what the search found, from six), each a product link with its photograph (so the photo flies into the piece's page), name and price under the mouse or focus. Three columns drift on a desktop (16, 21, 18 px/s, the middle upward), one row on phones (22 px/s); `Drift` runs on the Web Animations API, eases to a stop under the mouse and while a tile has the focus, pauses off-screen, stands still under reduced motion; its second copy is `inert`.
2. **`ChapterRail`** (silk): "Walk the chapters", a tile for every chapter and "Every chapter" (∞ on vault), each with its count with the other choices kept (a chapter with none is disabled). A press narrows the pieces in place to that chapter alone (again, or "Every chapter", to see all); a chapter chosen alone offers "Open the {name} chapter". A sideways rail on phones (`data-lenis-prevent-horizontal`).
3. **The pieces** (`<section aria-label="The pieces">`):
   - **`ShopToolbar`**, `sticky top-[111px] z-20`, travertine/95 with blur, a hairline and soft shadow once pinned (an `IntersectionObserver` sentinel). Filter (with its count), shortcuts to Chapter, Type, Metal, Price and Stone from 1440 px (each opens the panel on that section), the search (from 1024 px), the count (`aria-live`, quiet while the panel speaks), the sort, the view (desktop: large / standard / compact; phones: one or two a row; hidden under 360 px), the worn switch (from 640 px).
   - **The row under it**: the count (phones), chips for the search, every value and the price (each `Remove {label}`), "Clear all", "Prices in {currency}", the worn switch (phones) and "Copy the link" (the address of the selection from its first set, `shareUrl`; "Link copied" for 2.4 s).
   - **The grid** (`<ul role="list">`): large `grid-cols-1 sm:grid-cols-2` (gaps 10/14); standard `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; compact `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`. Each piece is a `ProductCard` with `lead`, `worn`, the density's `sizes`, `onQuickView`, `swatches`, `compact` and `reveal={false}`; offers are `OfferCard`s; after the first twelve cells (when more follow) the salon's `Interlude` spans the row. Under the grid: "{a} of {b} pieces", a hairline progress bar, "Show more pieces" and "Show all {n}" (the focus then moves to the first new piece). With twelve cells or fewer, the `Interlude` closes the grid.
   - **Empty**: "No piece matches all of these." / "Take a choice back, or ask a jeweller: what isn’t here, the atelier can often find or make.", then the `loosen` suggestions ("Without {label} · {n} pieces", "Without the search", "At any price"), "Clear all" and "Ask a jeweller".
4. **"With every piece"**: four hairline tiles: insured shipping (by market, as Home's promise), natural diamonds (`HOUSE.natural`), returns (`HOUSE.returns`), lifetime care.
5. **Made to order** (vault): "Not here? We can <em>make</em> it." / "Pas ici? Nous pouvons la <em>faire</em>.", "Design your ring" (`btnOnDark`), "Book a design consultation" (`VisitButton`, `design`), "Ask a jeweller"; the atelier's drawings.
6. `VisitBand`, `RecentlyViewed`.

## 4. The panel (`FilterPanel`, `PriceRange`)

A side drawer at the drawers' levels (`z-[80]` backdrop, `z-[90]` panel, full width on phones), portalled, mounted closed 1.2 s after the page (a lazy chunk) so its first opening slides in. On opening it unfolds the sections in use and the one asked for (scrolled into view only as far as needed), or Chapter, Metal and Price. Sections: Chapter, Type (the signatures marked ✦ Signature, a hairline after them), Metal (swatches), Price, Stone, Diamond shape, Availability, Highlights, Services, and Your pieces when the visitor has saved or viewed any. Values are `aria-pressed` rows with a square check and their count; a value that would give nothing is disabled, or left out of lists longer than nine (Type). The grid follows each choice at once; the foot holds "Clear all" and "Show {n} pieces" (closing scrolls back to the first row when the grid starts above the screen). On phones the search sits at the top. Escape closes (a search field's Escape clears first), focus returns to the opener, Lenis stops, the page is locked.

**Price**: "To own, in {currency}" (or "A weekend, in {currency}"), the range in words ("Any price", "$1,000 – $25,000", "$20,000 and over"), a histogram of the pieces (the chosen span in ink), two `role="slider"` thumbs on the round-figure stops (arrows ±1, Page Up/Down ±3, Home, End; a press on the track takes the nearer thumb; the range is written once a thumb is let go), and round-figure bands (CAD under 1,000 · 1,000–5,000 · 5,000–20,000 · 20,000 and over; USD under 750 · 750–4,000 · 4,000–15,000 · 15,000 and over), not when renting.

## 5. The quick view (`QuickView`)

A lazy, portalled modal (`z-[100]`, a sheet from the bottom on phones). The photographs (arrows, dots, swipe, arrow keys; the current one `z-[1]`), the collection and chapter, the name (a link), the tagline, the price for the chosen metal (or the weekend rate first when the card led with renting, "Or own it, …"), the metals as swatches (`aria-pressed`), "GIA report · {shape} · {carat} ct · {colour} · {clarity}", three specs, the lead time. The next step is the piece page's: "Add to bag — {price}" when `quickAddable` (it closes, then `addToCart`), "Go to bag" when that exact line is there, otherwise a link named as the page names its step ("Choose dates", "Personalize this piece", "Begin commission", "Choose size & options", "Select options"; a vault piece shown to own: "View the piece", `?mode=own`). "Book a visit" at the same size (`purposeFor`, the piece and metal), the heart, "View on you", "View the piece". The panel carries `data-morph-scope`, so any link to the piece flies the photograph on screen into its page. Closing fades out over 260 ms (at once under reduced motion); a link closes it at once.

## 6. Motion

- Hero, rail, promises and the made-to-order band reveal through `useReveal`.
- **`useGridMotion`**: the cards rise in as the stage clears (those below the fold as they scroll in, `ScrollTrigger.batch`); then `capture()` (called by every change of selection) notes each card's place and the next render glides them with GSAP Flip (`data-flip-id`: the slug, `offer:{id}`, `interlude`; 0.8 s `expo.out`), newcomers rising in. The first change ends the entrance. Flip loads after the page (`import('gsap/Flip')`); a change before it arrives doesn't glide. Nothing moves under reduced motion; the quick view fades without sliding.
- The card's photograph flies into the piece's page through the page transition's morph (any product link with its picture, from the grid, the mosaic or the quick view).

## 7. Shop all elsewhere

- **Header mega menu**: "Shop all" (`∞`, "{n} pieces · every chapter") heads the list; under the mouse or focus (and by default on the shop page) its preview shows "Everything the house makes and curates, in one place, with filters by chapter, metal, stone and price.", the edits as deep links (New arrivals, Bestsellers, To rent for an evening, Gifts under {amount}, Made to order, built with `applyEdit` + `writeSelection`), six pieces from `RECOMMENDED` and "Shop all {n} pieces →". Chapter rows also follow focus now.
- **Mobile menu**: "Shop all" with its count, after the signatures. **Desktop menu** (`SiteMenu`): the first destination, "Shop all" (`Toute la boutique`), with its note, "{n} pieces · From {price}", three pieces and "Shop all".
- **Footer** (Shop column, after the signatures), the empty bag, the empty wishlist: "Shop all" / "Toute la boutique".
- **Breadcrumbs**: chapter heroes read `Maison / Shop all / Chapter IV` (the Shop all step from 640 px); the piece page `Maison / Shop all / {chapter} / {name}` (the step from 640 px).
- **Search**: "shop all", "all jewellery", "everything", "toute la boutique", "tous les bijoux" land on the page.

## 8. Shopify mapping

| Here | Theme |
| --- | --- |
| `#/shop`, `?q=` | `/collections/all`; `/search?q=` (same template) |
| `type` | `filter.p.product_type` (the families as product types; the two signatures as a type group or a tag) |
| `metal` | `filter.v.option.metal` |
| `stone`, `shape` | product metafields (`custom.stone` list, `custom.gia_shape`) as Search & Discovery filters |
| `how` | `custom.rentable` (boolean) and `custom.lead_time_weeks` metafields |
| `tag` | product tags (`new`, `bestseller`, `atelier-exclusive`, `limited`) |
| `svc` | `custom.engravable`, `custom.personalization`, `custom.try_on` metafields |
| `min` `max` | `filter.v.price.gte` / `filter.v.price.lte` (the market's currency) |
| `sort` | `sort_by`: `manual` (the collection's order, kept to `RECOMMENDED`), `created-descending`, `price-ascending`, `price-descending`, `title-ascending` |
| `page` | the collection's `paginate` `page`, loaded in place (Section Rendering API) |
| `view`, `look` | theme-side preferences (a `localStorage` key or a URL param) |
| Counts | Search & Discovery's `filter.values[].count` |
| Offers | blocks of the collection grid section (a "promo tile" per position) |
| Quick view | `/products/{handle}?section_id=quick-view` (Section Rendering API) or an alternate product template |

## Notes & gotchas

- `stonesOf` is a heuristic on the English copy, like `tryOnKind`: re-check it when adding or rewording a piece (its regexes are in `filters.ts`). The theme should read a metafield instead.
- The hero's mode is fixed at arrival (`searching`): a search typed on the page changes the pieces, not the hero's height, so nothing jumps under the visitor.
- The toolbar is `z-20`, above the cards' own controls (`WishButton` is unlayered), below the header (`z-50`).
- The panel and the quick view each sit in their own `Suspense`; the quick view's `onClose` is stable (`useCallback`), or its focus and scroll lock would re-run on every render of the page.
- `ProductCard`'s `lead` overrides the house's lead (`rent || rentFirst`) only where a page says so; other callers are unchanged.
- The page is an eager import like the others; the panel (11 kB), the quick view (10 kB) and Flip (24 kB) are their own chunks.
- In dev mode the click that leaves the page costs ~470 ms of main thread (React's dev build); in production ~50–100 ms, then 110–270 ms at the swap, about as a chapter page.

## Related docs

- [Category page & product card](./category.md)
- [Legacy redesign: chapters, signatures and Shop all](../features/legacy-redesign.md)
- [Global chrome & shared components](../components/global-and-shared.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [UX patterns, responsive behaviour & accessibility](../ux-patterns-and-accessibility.md)
- [Languages](../features/languages.md)
