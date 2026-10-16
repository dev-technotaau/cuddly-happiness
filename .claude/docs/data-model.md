# Data layer — catalog, media, gift cards, costing & tax

All product, category, media, gift-card, cost-model and tax data is static TypeScript in `src/data/`. There is no API or CMS behind it. Pages import these modules directly, and the only mutable store in this layer is the gift-card ledger in `localStorage`. CAD is the source currency, USD values are derived from a fixed rate of `0.73`, and every amount is a whole number of currency units (dollars, not cents). Two small adapters sit beside the data: `src/components/lineDetails.ts` turns cart lines into option strings, and `src/lib/shopify.ts` maps gift-card cart lines to Shopify Ajax Cart payloads.

Scope: `src/data/catalog.ts`, `src/data/media.ts`, `src/data/giftcards.ts`, `src/data/costing.ts`, `src/data/tax.ts`, `src/components/lineDetails.ts`, `src/lib/shopify.ts`, plus every importer under `src/`, found by grep.

> Every computed value in this document was produced by running the real module code (Node 24, type-stripped copies, 2026-10-15). That covers USD prices, metal-variant prices, booked-date windows, cost lines, conversions and validation results. None was worked out by hand.

---

## 1. Module map

| File | Role | Imports | Value exports | Type exports | Module-private |
|---|---|---|---|---|---|
| `src/data/catalog.ts` | Catalog, prices, personalization, rentals, date helpers, try-on classification | none | `CAD_TO_USD`, `IMG`, `METALS`, `CATEGORIES`, `PRODUCTS`, `getCategory`, `getProduct`, `getProductsByCategory`, `priceFor`, `formatPrice`, `toUSD`, `personalizationPrice`, `validatePersonalization`, `RENTAL_DAYS`, `RENTAL_SLOTS`, `RENTAL_LEAD_DAYS`, `isoDate`, `parseIso`, `addDays`, `rentalReturnDate`, `getBookedDates`, `formatDay`, `tryOnKind` | `Currency`, `CategorySlug`, `Metal`, `MetalVariant`, `GiaSpec`, `Price`, `RentalRates`, `Product`, `PersonalizationFont`, `PersonalizationConfig`, `Personalization`, `Category`, `RentalPeriodId`, `RentalBooking`, `TryOnKind` | `img`, `p`, `rental`, `GOLDS`, `BRIDAL_METALS` |
| `src/data/media.ts` | Shoppable videos and review-media pools | `IMG`, `getProduct`, `CategorySlug`, `Product` (catalog) | `VIDEOS`, `videoProducts`, `videosForProduct`, `videosForCategory`, `REVIEW_MEDIA`, `mediaPoolFor` | `ShoppableVideo`, `ReviewMedia` | `clip`, `poster`, `v`, `img`, `vid` |
| `src/data/giftcards.ts` | Gift-card catalog, codes, local balance ledger | `CAD_TO_USD`, `Currency` (catalog) | `GIFT_CARD_SLUG`, `DENOMINATIONS`, `CUSTOM_RANGE`, `DESIGNS`, `convert`, `generateCode`, `normalizeCode`, `formatCode`, `maskCode`, `isCodeFormat`, `loadLedger`, `saveLedger`, `lookupCard`, `issueCards`, `debitCards` | `GiftCardDesign`, `GiftDelivery`, `GiftCardLine`, `IssuedCard` | `ALPHABET`, `LEDGER_KEY`, `DEMO` |
| `src/data/costing.ts` | Itemised cost model; tax-label splitter | `CAD_TO_USD`, `getCategory`, `personalizationPrice`, `priceFor`, `Currency`, `Metal`, `Personalization`, `Product` (catalog) | `hasCostBreakdown`, `buildCostBreakdown`, `splitTaxes`, `categoryName` | `CostGroup`, `CostLine`, `CostBreakdown` | `METAL_RATE`, `DEFAULT_WEIGHT`, `STONE_SHARE`, `MAKING_SHARE`, `LABOUR_RATE_CAD`, `parseNum`, `StoneSpec`, `stonesFor` |
| `src/data/tax.ts` | Canadian provincial sales tax; US state list | none | `PROVINCES`, `US_STATES` | — | — |
| `src/components/lineDetails.ts` | Cart line → human-readable option strings | `METALS`, `formatDay`, `parseIso`, `rentalReturnDate`, `Product` (catalog); `CartLine` type (`src/store.tsx`); `describePersonalization` (`src/components/pdp/Personalizer.tsx`); `DESIGNS` (giftcards) | `lineDetails` | — | `RENTAL_LABEL` |
| `src/lib/shopify.ts` | Gift-card cart line → Shopify `/cart/add.js` item | `CartLine` type (store); `getProduct` (catalog); `DESIGNS` (giftcards) | `toShopifyCartItem`, `isGiftCardLine` | `ShopifyCartItem` | `GIFT_CARD_VARIANTS`, `GIFT_CARD_ONE_UNIT_VARIANT` |

Dependency direction:

```
catalog.ts  <── media.ts
            <── giftcards.ts
            <── costing.ts
tax.ts         (standalone)
lineDetails.ts ──> catalog, giftcards, store (type only), pdp/Personalizer
lib/shopify.ts ──> catalog, giftcards, store (type only)
```

No file in `src/data/` imports React or `src/store.tsx`. `giftcards.ts` uses the browser globals `localStorage` and `crypto` only when its functions run, never at import time.

---

## 2. Conventions & units

- **Money.** Amounts are whole currency units. The file header says so: `// Teresa & Sons — product catalog (Montreal, CA). Prices in whole currency units.` Every derived amount is an integer (`Math.round`). `formatPrice` prints with `maximumFractionDigits: 0`, and every `CostLine.amount` is an integer.
- **Currency.** `Currency = 'CAD' | 'USD'`. CAD is authoritative for product prices, metal deltas (`priceDeltaCAD`), the personalization add-on (`priceCAD`) and every costing rate and fee. USD is derived through `CAD_TO_USD = 0.73`, using three different rounding rules (see §5.2).
- **Product ids** follow `tns-<code>-NNN` and are numbered `001`–`003` inside each category:

  | Code | Category | Ids |
  |---|---|---|
  | `nk` | `necklaces` | `tns-nk-001` – `tns-nk-003` |
  | `er` | `earrings` | `tns-er-001` – `tns-er-003` |
  | `br` | `bracelets` | `tns-br-001` – `tns-br-003` |
  | `rg` | `rings` | `tns-rg-001` – `tns-rg-003` |
  | `bd` | `bridal` | `tns-bd-001` – `tns-bd-003` |
  | `wt` | `watches` | `tns-wt-001` – `tns-wt-003` |
  | `rn` | `rentals` | `tns-rn-001` – `tns-rn-003` |
  | `gf` | `gifts` | `tns-gf-001` – `tns-gf-003` |
  | `cs` | `custom` | `tns-cs-001` – `tns-cs-003` |

  Ids serve as React `key`s and are displayed on the PDP (`src/pages/Product.tsx`) in two places: as `Ref. {product.id.toUpperCase()}` in the breadcrumb bar (hidden below `sm`), and in a `Reference` row (CSS `uppercase`) at the end of the "Details & dimensions" accordion. No code looks a product up by id.
- **Slugs** are lower-case ASCII kebab-case with accents stripped (`riviere-saint-laurent`). They are not always the full name: `teresa-signet` is "The Teresa Signet", `basilique-emerald-cut-three-stone` is "Basilique Three-Stone", and `bridal-tiara-and-drops` is "Bridal Tiara & Drops Set". **The slug is the real primary key.** It is used by routes (`#/p/:slug`), `getProduct`, `CartLine.slug` (persisted under `tns-cart`), wishlist and recently-viewed arrays, `VIDEOS[].products`, the review storage key `` `tns-reviews-${slug}` `` in `src/components/pdp/Reviews.tsx`, and the `getBookedDates` hash.
- **Array order is meaningful.**
  - `PRODUCTS` order is the "featured" order on category pages. It also decides "first N" selections: the Header mega-menu shows 2 per category, Treasured 6 per badge, GiftFinder 4, CompleteTheLook the first match per paired category, plus the CartUpsell pool order and the TryOnStudio thumbnail order.
  - `metals[0]` is the default metal everywhere.
  - `badges[0]` is the only badge ever displayed.
  - `CATEGORIES` order is the menu, footer and index order, and the Roman-numeral `eyebrow` follows it.
- **Images.** Every catalog image is an `IMG` entry built by `img(id, w = 1600)` → `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`. No call overrides `w`, so every image requests width 1600.
  - `images[0]` is the primary image: cards, cart, checkout, sticky bar, try-on thumbnails and video product chips.
  - `images[1]`, when present, is the ProductCard hover swap and the CraftStory background (which falls back to `images[0]`).
  - The PDP `Gallery` labels views `Front`, `Styled`, `View n`, then appends a `Detail` view: `images[0]` cropped with `{ scale: 1.9, origin: '50% 45%' }`.
- **Dates** are `yyyy-mm-dd` strings in **local** time (`isoDate`/`parseIso`, §5.7). The one exception is `IssuedCard.issuedAt`, which is a UTC date (`new Date().toISOString().slice(0, 10)`).

---

## 3. Types

### 3.1 Unions (`src/data/catalog.ts`)

```ts
export type Currency = 'CAD' | 'USD'
export type CategorySlug = 'necklaces' | 'earrings' | 'bracelets' | 'rings' | 'bridal' | 'watches' | 'rentals' | 'gifts' | 'custom' // one member per line in source
export type Metal = '18k-yellow' | '18k-white' | '18k-rose' | 'platinum' | 'vermeil'
export type PersonalizationFont = 'script' | 'serif' | 'block'
export type RentalPeriodId = 'weekend' | 'week' | 'month'
export type TryOnKind = 'necklace' | 'earrings' | 'ring' | 'bracelet' | 'watch'
```

The badge union is declared inline on `Product.badges`: `('New' | 'Bestseller' | 'Atelier Exclusive' | 'Limited' | 'Made to Order')[]`.

### 3.2 `Product`

| Field | Type | Required | Semantics and consumers |
|---|---|---|---|
| `id` | `string` | yes | `tns-<code>-NNN`. Used only for display and React keys (§2). |
| `slug` | `string` | yes | Primary key (§2). |
| `name` | `string` | yes | Display name. It also **drives regex classification**: `tryOnKind` (§5.9), `mediaPoolFor` (§6), `hasCostBreakdown` and costing "findings" (§8), the CartUpsell exclusion `/commission\|redesign/i`, and `JewelryOverlay`'s `hasStone` test, which runs on name + description. |
| `category` | `CategorySlug` | yes | Listing membership and behaviour switches: `rings`/`bridal` require a ring size (`needsSize` in `src/pages/Product.tsx`); `custom` changes the CTA to `Begin commission`; `rentals` together with `rental` makes ProductCard show `From` and the weekend rate; `watches` takes the watch branch in try-on, media and costing; `gifts` uses the `gift` review-media pool. |
| `collection` | `string` | yes | Eyebrow on ProductCard, RecentlyViewed and CartLineItem (for lines that are not rentals or gift cards); PDP eyebrow `{collection} · Chapter {eyebrow}`; CraftStory heading `The {collection} story`; last-resort fallback in `lineDetails`. |
| `tagline` | `string` | yes | Italic PDP subtitle. |
| `description` | `string` | yes | PDP body copy. Also scanned by `JewelryOverlay`'s regex. |
| `price` | `Price` | yes | Base price in both currencies, before any metal delta. For rentals this is the retail value: it appears as "retail value" in the rental price breakdown and is what category sorting uses. Rental fees themselves come from `rental`. |
| `metals` | `Metal[]` | yes (may be `[]`) | Selectable metals, with `[0]` as the default. `[]` (gift card only) removes the metal step and makes `hasCostBreakdown` false. |
| `gia?` | `GiaSpec` | no | Drives the PDP GIA card. It shows `Shape` (first word of `shape`), `Carat` (`carat.toFixed(2)`), `Color`, `Clarity` and `Cut` (first word of `cut`). In costing it adds a centre-stone line and a `GIA grading report` line. |
| `specs` | `Record<string, string>` | yes | PDP "Details & dimensions" rows in insertion order, then a `Reference` row. Parsed by the cost model (§8.3). WatchSpotlight shows `{specs.Case} · {specs.Movement}`. |
| `images` | `string[]` | yes (at least 1 assumed) | See §2. `images[0]` is read without a guard. |
| `rental?` | `RentalRates` | no | Turns on rental mode on the PDP (period, dates, `Reserve this piece`). Sets the cart line price to `rental[period][currency]` and supplies the deposit. |
| `badges?` | badge union[] | no | `badges[0]` is shown on ProductCard and Gallery. Treasured tabs filter by `Bestseller`, `New` and `Atelier Exclusive`. CartUpsell's fallback pool is the `Bestseller` items. No product has more than one badge. |
| `engravable?` | `boolean` | no | Shows the PDP engraving field, but only when `!rental && (!personalization \|\| personalization.backEngraving)`. Adds an `Engraving` line (marked included) to costing. Matches GiftFinder's `For him` and `Milestone` occasions. |
| `leadTimeWeeks?` | `number` | no | PDP availability reads `` `Made to order · approx. ${n} weeks` ``. Without it: `In stock · ships within 48 hours`. Rentals: `Available for reservation · fitted in salon`. |
| `personalization?` | `PersonalizationConfig` | no | Adds the Personalizer step, validation and the accent add-on. Also excludes the product from quick-add flows (CartUpsell `quickAddable`, Wishlist "add all", VideoViewer `configurable`, TryOnStudio `needsConfig`). |

### 3.3 Supporting interfaces

`MetalVariant`: `{ id: Metal; label: string; swatch: string; priceDeltaCAD: number }`. The doc comment on `priceDeltaCAD` reads `Price delta vs. base, in CAD`.
`GiaSpec`: `{ reportNumber: string; shape: string; carat: number; color: string; clarity: string; cut: string }`.
`Price`: `{ CAD: number; USD: number }`.
`RentalRates`: `{ weekend: Price; week: Price; month: Price; deposit: Price }`. The doc comments read "Per-period rate, both currencies" and "Refundable security deposit".

```ts
export interface PersonalizationConfig {
  kind: 'nameplate' | 'initial' | 'monogram'
  label: string
  hint: string
  minLength: number
  maxLength: number
  /** Allowed characters, as a RegExp character class body. */
  allowed: string
  fonts: PersonalizationFont[]
  /** Optional paid add-on, priced in CAD. */
  accent?: { label: string; priceCAD: number }
  chainLengths?: string[]
  /** Keep the separate engraving field for the reverse side. */
  backEngraving?: boolean
}
```

```ts
// Personalization and Category are condensed onto one line each; the source has one field per line.
export interface Personalization { text: string; font: PersonalizationFont; accent?: boolean; chainLength?: string }
export interface Category { slug: CategorySlug; name: string; french: string; eyebrow: string; description: string; hero: string; feature: string }
export interface RentalBooking {
  start: string // ISO date, yyyy-mm-dd
  slot: string
  method: 'courier' | 'salon'
}
```

`RentalBooking.slot` is typed `string`. In practice it holds one of the `RENTAL_SLOTS` strings. The PDP starts the booking as `{ method: 'courier' }`, and `RentalCalendar` treats an undefined `method` as `'courier'`.

### 3.4 `CartLine` (owned by `src/store.tsx`; consumed by `lineDetails` and `lib/shopify.ts`)

| Field | Type |
|---|---|
| `key` | `string` (`lineKey(...)` = slug, metal, rental, engraving, size, plus JSON of booking, personalization and giftCard, joined by `\|`) |
| `slug` | `string` |
| `metal?` | `Metal` |
| `rental?` | `'weekend' \| 'week' \| 'month'` |
| `engraving?` / `size?` | `string` |
| `booking?` | `RentalBooking` |
| `personalization?` | `Personalization` |
| `giftCard?` | `GiftCardLine` |
| `qty` | `number` |

Carts persist in `localStorage['tns-cart']` and embed `Personalization`, `RentalBooking` and `GiftCardLine` objects. No migration runs, so shape changes reach carts that are already stored. Pricing and line identity are covered in [commerce-logic.md](commerce-logic.md).

---

## 4. Catalog constants (`src/data/catalog.ts`)

### 4.1 `CAD_TO_USD`

`export const CAD_TO_USD = 0.73`, with the doc comment `/** CAD → USD conversion used for display rounding of derived prices. */`. Readers: `p()`, `priceFor` and `toUSD` in catalog; `buildCostBreakdown` (`fx`); `convert` in giftcards. Grep finds no other `0.73` anywhere in `src/`.

### 4.2 `IMG` (`as const`)

All URLs have the form `https://images.unsplash.com/<photo id>?auto=format&fit=crop&w=1600&q=80`.

| Key | Unsplash photo id | Used in `src/data` | Used outside `src/data` |
|---|---|---|---|
| `jewelryFlat` | `photo-1515562141207-7a88fb7ce338` | `rentals.hero`; `tns-nk-002`[1], `tns-rn-001`[1]; `REVIEW_MEDIA.necklace` | `HomeHero`, `Home`, `VisitSalon` |
| `necklace1` | `photo-1599643478518-a784e5dc4c8f` | `necklaces.hero`; `tns-nk-001`[0], `tns-nk-003`[0], `tns-gf-001`[1], `tns-cs-003`[0]; `REVIEW_MEDIA.necklace` | `HomeHero`, `MakingScroll`, `SocialGrid` |
| `necklace2` | `photo-1602173574767-37ac01994b2a` | `necklaces.feature`, `rentals.feature`; `tns-nk-001`[1], `tns-nk-002`[0], `tns-rn-001`[0]; `REVIEW_MEDIA.necklace` | `HomeHero` |
| `ring1` | `photo-1605100804763-247f67b3557e` | `rings.hero`; `tns-rg-002`[0], `tns-bd-001`[1]; `REVIEW_MEDIA.ring` | `HomeHero`, `FourCs`, `MakingScroll` |
| `ring2` | `photo-1603561591411-07134e71a2a9` | `custom.hero`; `tns-rg-001`[0], `tns-cs-001`[0]; `REVIEW_MEDIA.ring` | `Atelier`, `Home`, `MakingScroll` |
| `rings` | `photo-1600721391776-b5cd0e0048f9` | `rings.feature`, `custom.feature`; `tns-rg-001`[1], `tns-rg-003`[0], `tns-bd-002`[1], `tns-cs-002`[0]; `REVIEW_MEDIA.ring` | `Home`, `MakingScroll`, `SocialGrid` |
| `bracelet1` | `photo-1611591437281-460bfbe1220a` | `bracelets.hero`; `tns-br-001`[0], `tns-br-003`[0]; `REVIEW_MEDIA.bracelet` | — |
| `bracelet2` | `photo-1611652022419-a9419f74343d` | `bracelets.feature`; `tns-br-001`[1], `tns-br-002`[0]; `REVIEW_MEDIA.bracelet` | `SocialGrid` |
| `earrings1` | `photo-1535632066927-ab7c9ab60908` | `earrings.hero`; `tns-er-001`[0], `tns-er-002`[1]; `REVIEW_MEDIA.earrings` | — |
| `earrings2` | `photo-1617038220319-276d3cfab638` | `tns-er-002`[0], `tns-rn-002`[0], `tns-gf-002`[1]; `REVIEW_MEDIA.earrings` | `HomeHero` |
| `earrings3` | `photo-1630019852942-f89202989a59` | `earrings.feature`; `tns-er-001`[1], `tns-er-003`[0]; `REVIEW_MEDIA.earrings` | `SocialGrid`, `TryOnFeature` |
| `bridal1` | `photo-1596944924616-7b38e7cfac36` | `bridal.hero`; `tns-bd-001`[0], `tns-rn-003`[0] | `HomeHero`, `Home`, `MakingScroll` |
| `bridal2` | `photo-1515934751635-c81c6bc9a2d8` | `bridal.feature`; `tns-bd-002`[0], `tns-bd-003`[0], `tns-cs-001`[1]; `REVIEW_MEDIA.ring` | `HomeHero`, `Account`, `Home`, `SocialGrid` |
| `watch1` | `photo-1523170335258-f5ed11844a49` | `watches.hero`; `tns-wt-001`[0], `tns-wt-003`[1]; `REVIEW_MEDIA.watch` | — |
| `watch2` | `photo-1547996160-81dfa63595aa` | `watches.feature`; `tns-wt-002`[0]; `REVIEW_MEDIA.watch` | `WatchSpotlight` |
| `watch3` | `photo-1522312346375-d1a52e2b99b3` | `tns-wt-001`[1], `tns-wt-003`[0]; `REVIEW_MEDIA.watch` | `SocialGrid` |
| `gift1` | `photo-1549465220-1a8b9238cd48` | `gifts.hero`; `tns-gf-001`[0], `tns-gf-003`[0]; `REVIEW_MEDIA.gift` | — |
| `gift2` | `photo-1513201099705-a9746e1e201f` | `gifts.feature`; `tns-gf-002`[0]; `REVIEW_MEDIA.gift` | — |

### 4.3 `METALS: Record<Metal, MetalVariant>`

| Key / `id` | `label` | `swatch` | `priceDeltaCAD` | USD delta applied by `priceFor` |
|---|---|---|---|---|
| `18k-yellow` | `18k Yellow Gold` | `#D4B982` | `0` | `0` |
| `18k-white` | `18k White Gold` | `#E4E2DD` | `0` | `0` |
| `18k-rose` | `18k Rose Gold` | `#D9A68C` | `0` | `0` |
| `platinum` | `Platinum 950` | `#CFCFCB` | `650` | `+475` (`Math.round(474.5)`) |
| `vermeil` | `Gold Vermeil` | `#B89047` | `-400` | `-292` |

Where these are read:
- **`label`**: the PDP metal step and detail string, `lineDetails`, the `PriceBreakdown` subtitle (`` `${label} · before tax` ``) and `TryOnStudio`.
- **`swatch`**: the PDP metal chip (`` `linear-gradient(135deg, ${swatch} 10%, #ffffffaa 45%, ${swatch} 85%)` ``), the Personalizer preview tint and the TryOnStudio chips. Product.tsx and TryOnStudio fall back to `'#D4B982'` when no metal is selected.

### 4.4 `GOLDS` / `BRIDAL_METALS` (not exported)

```ts
const GOLDS: Metal[] = ['18k-yellow', '18k-white', '18k-rose']
const BRIDAL_METALS: Metal[] = ['platinum', '18k-white', '18k-yellow', '18k-rose']
```

`tns-nk-001`, `tns-br-002` and `tns-rg-001` use `metals: GOLDS`. All three bridal products and `tns-cs-001` use `metals: BRIDAL_METALS`. These products **share the same array instance**. Other products spread a copy (`[...GOLDS, 'vermeil']`, `[...GOLDS, 'platinum']`) or use a literal array.

### 4.5 `CATEGORIES: Category[]` (complete, in order)

| # | `slug` | `name` | `french` | `eyebrow` | `description` | `hero` | `feature` |
|---|---|---|---|---|---|---|---|
| 1 | `necklaces` | Necklaces | Colliers | I | Pendants, rivières and chains drawn in 18k gold, worn close to the heart. | `IMG.necklace1` | `IMG.necklace2` |
| 2 | `earrings` | Earrings | Boucles d'oreilles | II | Studs, drops and huggies that catch the light of the Saint-Laurent. | `IMG.earrings1` | `IMG.earrings3` |
| 3 | `bracelets` | Bracelets | Bracelets | III | Tennis lines, cuffs and bangles, built to be stacked and inherited. | `IMG.bracelet1` | `IMG.bracelet2` |
| 4 | `rings` | Rings | Bagues | IV | Signets, cocktail rings and everyday bands, hand-finished in our atelier. | `IMG.ring1` | `IMG.rings` |
| 5 | `bridal` | Bridal Jewelry | Mariage | V | GIA-certified engagement rings and wedding bands for a lifetime of vows. | `IMG.bridal1` | `IMG.bridal2` |
| 6 | `watches` | Watches | Montres | VI | A curated selection of Swiss timepieces, serviced by our horologist. | `IMG.watch1` | `IMG.watch2` |
| 7 | `rentals` | Jewelry Rentals | Location | VII | High jewelry for galas, weddings and premieres — insured, delivered, returned. | `IMG.jewelryFlat` | `IMG.necklace2` |
| 8 | `gifts` | Gifts | Cadeaux | VIII | Thoughtful pieces, wrapped in our signature travertine box. | `IMG.gift1` | `IMG.gift2` |
| 9 | `custom` | Personalized & Custom | Sur mesure | IX | From sketch to setting — bespoke commissions and engraved heirlooms. | `IMG.ring2` | `IMG.rings` |

The apostrophe in `Boucles d'oreilles` is ASCII (U+0027). Each category holds exactly 3 products, so `CategoryIndex` always renders "3 pieces".

Field consumers:
- **`eyebrow`** appears as a bare numeral in the Header category lists and CategoryIndex. It appears as `Chapter {eyebrow}` in the Header mega-menu panel, the category breadcrumb (`Maison / Chapter {eyebrow}`), the PDP eyebrow and the PDP "related" section header.
- **`french`** is the italic accent in the Header (on hover), the category `h1`, and CategoryIndex.
- **`description`** appears in the Header mega-menu and the category hero.
- **`hero`** is used by the Header mega-menu, the category hero (`data-parallax`) and CategoryIndex.
- **`feature`** is used only by the Header mega-menu.

### 4.6 `PRODUCTS: Product[]`: complete inventory

#### A. Identity, price and images

The `USD` column is computed by `p()` (nearest 5), except `tns-gf-003`, whose USD price is explicit (`p(250, 200)`).

| # | `id` | `slug` | `name` | `category` | `collection` | CAD | USD | Images (`IMG` keys) |
|---|---|---|---|---|---|---|---|---|
| 1 | `tns-nk-001` | `mont-royal-solitaire-pendant` | Mont-Royal Solitaire Pendant | necklaces | Mont-Royal | 6850 | 5000 | 2: necklace1, necklace2 |
| 2 | `tns-nk-002` | `riviere-saint-laurent` | Rivière Saint-Laurent | necklaces | Saint-Laurent | 38500 | 28105 | 2: necklace2, jewelryFlat |
| 3 | `tns-nk-003` | `plateau-paperclip-chain` | Plateau Paperclip Chain | necklaces | Plateau | 2450 | 1790 | 1: necklace1 |
| 4 | `tns-er-001` | `vieux-port-diamond-studs` | Vieux-Port Diamond Studs | earrings | Vieux-Port | 8900 | 6495 | 2: earrings1, earrings3 |
| 5 | `tns-er-002` | `outremont-pearl-drops` | Outremont Pearl Drops | earrings | Outremont | 4200 | 3065 | 2: earrings2, earrings1 |
| 6 | `tns-er-003` | `mile-end-huggies` | Mile End Huggies | earrings | Mile End | 1950 | 1425 | 1: earrings3 |
| 7 | `tns-br-001` | `westmount-tennis-bracelet` | Westmount Tennis Bracelet | bracelets | Westmount | 14500 | 10585 | 2: bracelet1, bracelet2 |
| 8 | `tns-br-002` | `atwater-cuff` | Atwater Cuff | bracelets | Atwater | 5600 | 4090 | 1: bracelet2 |
| 9 | `tns-br-003` | `griffintown-chain-bracelet` | Griffintown Chain Bracelet | bracelets | Griffintown | 1650 | 1205 | 1: bracelet1 |
| 10 | `tns-rg-001` | `teresa-signet` | The Teresa Signet | rings | Heritage | 3200 | 2335 | 2: ring2, rings |
| 11 | `tns-rg-002` | `sherbrooke-emerald-cocktail` | Sherbrooke Emerald Cocktail Ring | rings | Sherbrooke | 21800 | 15915 | 1: ring1 |
| 12 | `tns-rg-003` | `laurier-stacking-band` | Laurier Stacking Band | rings | Laurier | 1350 | 985 | 1: rings |
| 13 | `tns-bd-001` | `notre-dame-oval-solitaire` | Notre-Dame Oval Solitaire | bridal | Notre-Dame | 18900 | 13795 | 2: bridal1, ring1 |
| 14 | `tns-bd-002` | `basilique-emerald-cut-three-stone` | Basilique Three-Stone | bridal | Basilique | 26400 | 19270 | 2: bridal2, rings |
| 15 | `tns-bd-003` | `promesse-wedding-band` | Promesse Wedding Band | bridal | Promesse | 1450 | 1060 | 1: bridal2 |
| 16 | `tns-wt-001` | `heritage-automatic-38` | Heritage Automatic 38 | watches | Swiss Selection | 7400 | 5400 | 2: watch1, watch3 |
| 17 | `tns-wt-002` | `chronographe-1962` | Chronographe 1962 | watches | Swiss Selection | 12900 | 9415 | 1: watch2 |
| 18 | `tns-wt-003` | `dame-du-lac` | Dame du Lac | watches | Swiss Selection | 9600 | 7010 | 2: watch3, watch1 |
| 19 | `tns-rn-001` | `gala-diamond-collar` | Gala Diamond Collar | rentals | Rental Vault | 92000 | 67160 | 2: necklace2, jewelryFlat |
| 20 | `tns-rn-002` | `chandelier-sapphire-earrings` | Chandelier Sapphire Earrings | rentals | Rental Vault | 34000 | 24820 | 1: earrings2 |
| 21 | `tns-rn-003` | `bridal-tiara-and-drops` | Bridal Tiara & Drops Set | rentals | Rental Vault | 48000 | 35040 | 1: bridal1 |
| 22 | `tns-gf-001` | `initial-disc-pendant` | Initial Disc Pendant | gifts | Gifts under $1,000 | 680 | 495 | 2: gift1, necklace1 |
| 23 | `tns-gf-002` | `pearl-stud-gift-set` | Pearl Stud Gift Set | gifts | Gifts under $1,000 | 540 | 395 | 2: gift2, earrings2 |
| 24 | `tns-gf-003` | `gift-card` | Teresa & Sons Gift Card | gifts | Gift Cards | 250 | 200 (explicit) | 1: gift1 |
| 25 | `tns-cs-001` | `bespoke-engagement-commission` | Bespoke Engagement Commission | custom | Sur Mesure | 5000 | 3650 | 2: ring2, bridal2 |
| 26 | `tns-cs-002` | `heirloom-redesign` | Heirloom Redesign | custom | Sur Mesure | 1800 | 1315 | 1: rings |
| 27 | `tns-cs-003` | `engraved-nameplate-necklace` | Engraved Nameplate Necklace | custom | Personalized | 1250 | 915 | 1: necklace1 |

Totals: 27 products. 14 have two images and 13 have one.

#### B. Variants, flags and derived classification

`tryOnKind` shows the first regex token that matched (§5.9). The "Own videos" column is `videosForProduct(slug)` (§6).

| `id` | `metals` (default first) | `badges` | `gia` | `rental` | `personalization` | `engravable` | `leadTimeWeeks` | `tryOnKind` | `mediaPoolFor` | `hasCostBreakdown` | Own videos |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `tns-nk-001` | `GOLDS` | Bestseller | yes | — | — | — | — | necklace ("pendant") | necklace | yes | v34213, v47288 |
| `tns-nk-002` | 18k-white, platinum | Atelier Exclusive | — | — | — | — | — | necklace ("rivi") | necklace | yes | v34213 |
| `tns-nk-003` | `[...GOLDS, 'vermeil']` | New | — | — | — | yes | — | necklace ("chain") | necklace | yes | v34213 |
| `tns-er-001` | `[...GOLDS, 'platinum']` | Bestseller | yes | — | — | — | — | earrings ("stud") | earrings | yes | v47476, v47288 |
| `tns-er-002` | 18k-yellow, 18k-white | New | — | — | — | — | — | earrings ("drop") | earrings | yes | v50782 |
| `tns-er-003` | `[...GOLDS, 'vermeil']` | — | — | — | — | — | — | earrings ("huggie") | earrings | yes | — |
| `tns-br-001` | 18k-white, 18k-yellow, platinum | Bestseller | — | — | — | — | — | bracelet ("tennis") | bracelet | yes | v47476, v34611 |
| `tns-br-002` | `GOLDS` | — | — | — | — | yes | — | bracelet ("cuff") | bracelet | yes | v2861 |
| `tns-br-003` | `[...GOLDS, 'vermeil']` | New | — | — | — | yes | — | bracelet ("bracelet"; `chain(?! bracelet)` stops the necklace match) | bracelet | yes | v34611 |
| `tns-rg-001` | `GOLDS` | Bestseller | — | — | monogram | yes | — | ring ("signet") | ring (fallback) | yes | v2861 |
| `tns-rg-002` | 18k-yellow, platinum | Limited | — | — | — | — | — | ring ("ring") | ring (fallback) | yes | v50782 |
| `tns-rg-003` | `[...GOLDS, 'platinum']` | — | — | — | — | — | — | ring ("band") | ring (fallback) | yes | v5181 |
| `tns-bd-001` | `BRIDAL_METALS` (platinum first) | Bestseller | yes | — | — | yes | — | ring ("solitaire") | ring (fallback) | yes | v5220, v24656, v51649 |
| `tns-bd-002` | `BRIDAL_METALS` | Atelier Exclusive | yes | — | — | yes | — | ring ("three-stone") | ring (fallback) | yes | v24656 |
| `tns-bd-003` | `BRIDAL_METALS` | — | — | — | — | yes | — | ring ("band") | ring (fallback) | yes | v5220, v5181 |
| `tns-wt-001` | 18k-yellow, 18k-white | New | — | — | — | yes | — | watch (category) | watch | yes | — |
| `tns-wt-002` | 18k-rose, 18k-yellow | Limited | — | — | — | — | — | watch (category) | watch | yes | — |
| `tns-wt-003` | 18k-white, 18k-rose | — | — | — | — | — | — | watch (category) | watch | yes | — |
| `tns-rn-001` | platinum | Atelier Exclusive | — | yes | — | — | — | necklace ("collar") | necklace | yes* | — |
| `tns-rn-002` | 18k-white | — | — | yes | — | — | — | earrings ("earring") | earrings | yes* | — |
| `tns-rn-003` | platinum | Bestseller | — | yes | — | — | — | earrings ("tiara") | earrings ("drop") | yes* | — |
| `tns-gf-001` | `[...GOLDS, 'vermeil']` | Bestseller | — | — | initial | yes | — | necklace ("pendant") | gift (category) | yes | — |
| `tns-gf-002` | 18k-yellow, 18k-white | — | — | — | — | — | — | earrings ("stud") | gift (category) | yes | — |
| `tns-gf-003` | `[]` | — | — | — | — | — | — | **null** ("gift card") | gift (category) | **no** (no metals) | — |
| `tns-cs-001` | `BRIDAL_METALS` | Made to Order | — | — | — | yes | 8 | ring ("engagement") | ring (fallback) | **no** ("commission") | — |
| `tns-cs-002` | `[...GOLDS, 'platinum']` | Made to Order | — | — | — | — | 6 | **null** ("redesign") | ring (fallback) | **no** ("redesign") | — |
| `tns-cs-003` | `[...GOLDS, 'vermeil']` | Made to Order | — | — | nameplate | yes | 3 | necklace ("necklace") | necklace | yes | — |

\* For rental products `hasCostBreakdown` is true, but `src/components/pdp/PriceBreakdown.tsx` renders its own rental-fee lines (`rentalLines`) instead of `buildCostBreakdown`.

Badge counts:
- `Bestseller`: 7 (Treasured's `.slice(0, 6)` leaves out `tns-gf-001`, the 7th in array order)
- `New`: 4
- `Atelier Exclusive`: 3
- `Limited`: 2
- `Made to Order`: 3

`tryOnKind` totals: necklace 6, earrings 6, ring 7, bracelet 3, watch 3, null 2 (`gift-card`, `heirloom-redesign`). That makes 25 of 27 products wearable.

#### C. Copy (verbatim)

| `id` | `tagline` | `description` |
|---|---|---|
| `tns-nk-001` | A single round brilliant, suspended. | A GIA-certified round brilliant floats in a four-claw basket on a fine cable chain, adjustable at 16 and 18 inches. |
| `tns-nk-002` | A river of graduated diamonds. | Ninety-two graduated round diamonds set in individual collets, articulated to drape like water. |
| `tns-nk-003` | The everyday link. | Elongated hand-polished links in solid gold, made to layer. |
| `tns-er-001` | The classic pair, matched by hand. | A matched pair of GIA-certified round diamonds in four-prong martini settings with secure screw backs. |
| `tns-er-002` | South Sea light, softly swinging. | Golden South Sea pearls beneath pavé diamond caps. |
| `tns-er-003` | Pavé, hinged, effortless. | Petite hinged hoops lined with micro-pavé diamonds. |
| `tns-br-001` | Fifty diamonds, one unbroken line. | Four-prong set round diamonds with a double safety box clasp. |
| `tns-br-002` | Sculpted, hammered, hand-signed. | A solid gold cuff, hammer-textured and signed inside by the maker. |
| `tns-br-003` | Industrial roots, refined. | Curb links with a single bezel-set diamond station. |
| `tns-rg-001` | Our founder’s ring, recast. | An oval signet modelled on Teresa’s 1962 original — ready for a monogram or crest. |
| `tns-rg-002` | Colombian green, framed in light. | A 3.1 ct Colombian emerald within a halo of round diamonds. |
| `tns-rg-003` | Thin, bright, endlessly stackable. | A 1.6 mm band of half-eternity pavé. |
| `tns-bd-001` | A cathedral setting for an oval. | A GIA-certified oval rises from a hidden halo on a knife-edge band. |
| `tns-bd-002` | Past, present, future. | An emerald-cut centre flanked by tapered baguettes. |
| `tns-bd-003` | Comfort fit, forever. | A classic comfort-fit band available in 2, 4 and 6 mm. |
| `tns-wt-001` | Swiss movement, Montreal-regulated. | A 38 mm automatic with sunburst dial, regulated in our atelier. |
| `tns-wt-002` | For the year we opened our doors. | A limited chronograph of 62 pieces with a panda dial. |
| `tns-wt-003` | Mother-of-pearl, diamond bezel. | A petite quartz watch with a diamond-set bezel. |
| `tns-rn-001` | Red carpet, by the weekend. | An 18 ct diamond collar, fully insured, delivered by courier in Montreal, Toronto and New York. |
| `tns-rn-002` | Ceylon blue, borrowed for the night. | Cascading Ceylon sapphires and diamonds. |
| `tns-rn-003` | Something borrowed. | A diamond tiara with matching drop earrings, fitted at our salon. |
| `tns-gf-001` | One letter, endlessly personal. | A hand-engraved disc on a fine chain, presented in our travertine box. |
| `tns-gf-002` | Freshwater pearls, boxed and ribboned. | Akoya pearl studs with a polishing cloth and care card. |
| `tns-gf-003` | The gift of choosing. | Redeemable in our Montreal salon and online in CAD or USD. |
| `tns-cs-001` | Designed with you, from the first sketch. | Private consultation, CAD renders, wax model and hand-setting. Price shown is a starting deposit. |
| `tns-cs-002` | Old stones, new stories. | We reset and reimagine inherited stones and gold into a new piece. |
| `tns-cs-003` | Your name, in our script. | A hand-sawn nameplate in up to ten letters, with optional diamond dot. |

The two `’` in the `tns-rg-001` copy are U+2019, and the dash is an em dash (U+2014).

#### D. `specs` records (verbatim, in insertion order, which is also display order)

| `id` | `specs` |
|---|---|
| `tns-nk-001` | Chain: `1.1 mm cable, 16–18 in` · Clasp: `Spring ring` |
| `tns-nk-002` | Total carat weight: `12.40 ct` · Color: `F–G` · Clarity: `VS` · Length: `16 in` |
| `tns-nk-003` | Link: `4.2 mm` · Length: `18 in` · Weight: `6.8 g` |
| `tns-er-001` | Total carat weight: `1.00 ct (pair)` · Backs: `Screw` |
| `tns-er-002` | Pearl: `11–12 mm South Sea` · Diamonds: `0.22 ct` |
| `tns-er-003` | Diameter: `12 mm` · Diamonds: `0.18 ct` |
| `tns-br-001` | Total carat weight: `5.00 ct` · Color: `G–H` · Clarity: `VS–SI1` · Length: `7 in` |
| `tns-br-002` | Width: `8 mm` · Weight: `24 g` |
| `tns-br-003` | Diamond: `0.10 ct` · Length: `6.5–7.5 in` |
| `tns-rg-001` | Face: `12 × 10 mm` · Weight: `9 g` |
| `tns-rg-002` | Emerald: `3.10 ct, Colombia, minor oil` · Diamonds: `0.85 ct` |
| `tns-rg-003` | Width: `1.6 mm` · Diamonds: `0.15 ct` |
| `tns-bd-001` | Band: `1.8 mm knife edge` · Hidden halo: `0.12 ct` |
| `tns-bd-002` | Side stones: `0.48 ct tapered baguettes` |
| `tns-bd-003` | Widths: `2 / 4 / 6 mm` · Profile: `Comfort fit` |
| `tns-wt-001` | Case: `38 mm` · Movement: `Swiss automatic, 42 h reserve` · Water resistance: `50 m` · Strap: `Alligator` |
| `tns-wt-002` | Case: `40 mm` · Movement: `Manual-wind chronograph` · Edition: `62 pieces` |
| `tns-wt-003` | Case: `30 mm` · Movement: `Swiss quartz` · Bezel: `0.60 ct diamonds` |
| `tns-rn-001` | Total carat weight: `18.20 ct` · Insurance: `Included` · Delivery: `Bonded courier` |
| `tns-rn-002` | Sapphires: `8.40 ct Ceylon` · Diamonds: `3.10 ct` |
| `tns-rn-003` | Includes: `Tiara, earrings, fitting` · Insurance: `Included` |
| `tns-gf-001` | Disc: `12 mm` · Chain: `16–18 in` |
| `tns-gf-002` | Pearl: `7–7.5 mm Akoya` |
| `tns-gf-003` | Denominations: `$250 – $10,000` · Validity: `No expiry` |
| `tns-cs-001` | Process: `Consult → sketch → CAD → wax → set` · Consultation: `In salon or virtual` |
| `tns-cs-002` | Includes: `Appraisal, design, recast` · Service: `Gold reclaimed where possible` |
| `tns-cs-003` | Letters: `Up to 10` · Option: `Diamond accent +$180` |

(The "·" separators belong to this table and are not part of the data.) Every range dash in the values is an en dash (U+2013). `×` is U+00D7 and `→` is U+2192.

#### E. GIA specs (`gia`)

| Product | `reportNumber` | `shape` | `carat` | `color` | `clarity` | `cut` | PDP shows Shape / Carat / Cut |
|---|---|---|---|---|---|---|---|
| `mont-royal-solitaire-pendant` | `2231874590` | Round Brilliant | `0.7` | F | VS1 | Excellent | Round / 0.70 / Excellent |
| `vieux-port-diamond-studs` | `6452198830` | Round Brilliant | `1.0` | G | VS2 | Excellent | Round / 1.00 / Excellent |
| `notre-dame-oval-solitaire` | `1449286107` | Oval | `1.82` | E | VS1 | Excellent (polish & symmetry) | Oval / 1.82 / Excellent |
| `basilique-emerald-cut-three-stone` | `5402177764` | Emerald | `2.01` | F | VVS2 | Excellent (polish & symmetry) | Emerald / 2.01 / Excellent |

#### F. Rental rates (`rental(weekend, week, month, deposit)` in CAD; USD by `p()`)

| Product | Weekend CAD / USD | Week CAD / USD | Month CAD / USD | Deposit CAD / USD |
|---|---|---|---|---|
| `gala-diamond-collar` | 650 / 475 | 1400 / 1020 | 3900 / 2845 | 5000 / 3650 |
| `chandelier-sapphire-earrings` | 320 / 235 | 720 / 525 | 1900 / 1385 | 2500 / 1825 |
| `bridal-tiara-and-drops` | 480 / 350 | 1100 / 805 | 2800 / 2045 | 3500 / 2555 |

All three rental products have `category: 'rentals'`, `collection: 'Rental Vault'`, and a single metal. No rental product is `engravable`, personalised or `gia`.

#### G. Personalization configs

| Field | `teresa-signet` | `initial-disc-pendant` | `engraved-nameplate-necklace` |
|---|---|---|---|
| `kind` | `monogram` | `initial` | `nameplate` |
| `label` | Monogram | Initial | Your name |
| `hint` | Up to three initials, hand-engraved on the face. | One letter, hand-engraved on the front of the disc. | Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes. |
| `minLength` / `maxLength` | 1 / 3 | 1 / 1 | 2 / 10 |
| `allowed` (TS source literal) | `'A-Za-z'` | `'A-Za-z'` | `"A-Za-zÀ-ÿ '\\-"` |
| Runtime RegExp | `/^[A-Za-z]+$/` | `/^[A-Za-z]+$/` | `/^[A-Za-zÀ-ÿ '\-]+$/` |
| `fonts` (default = `[0]`) | serif, script, block | serif, script, block | script, serif, block |
| `accent` | — | — | `{ label: 'Diamond accent', priceCAD: 180 }` → USD 130 |
| `chainLengths` | — | 16 in, 18 in, 20 in | 16 in, 18 in, 20 in |
| Default chain (`chainLengths[1] ?? chainLengths[0]`, Product.tsx) | — | `18 in` | `18 in` |
| `backEngraving` | `true` | `true` | — (undefined) |
| Separate engraving field shown on PDP? | yes, labelled "Reverse" in `lineDetails` | yes, labelled "Reverse" | **no** (no `backEngraving`) |
| Personalizer preview fallback text | `TMS` | `T` | `Teresa` |

### 4.7 Rental constants

| Constant | Value | Notes |
|---|---|---|
| `RENTAL_DAYS: Record<RentalPeriodId, number>` | `{ weekend: 3, week: 7, month: 30 }` | Length of the booked window and the offset of the return date. |
| `RENTAL_SLOTS` (`as const`) | `'09:00 – 11:00'`, `'11:00 – 13:00'`, `'14:00 – 16:00'`, `'17:00 – 19:00'` | En dash with spaces. Stored verbatim in `RentalBooking.slot` and shown verbatim. |
| `RENTAL_LEAD_DAYS` | `2` | Doc comment: "Days of notice required before a rental can be delivered." The earliest start is today + 2. RentalCalendar's legend shows `{RENTAL_LEAD_DAYS} days’ notice`. |

---

## 5. Catalog helpers (`src/data/catalog.ts`)

### 5.1 Private builders: `p()` and `rental()`

```ts
const p = (CAD: number, USD?: number): Price => ({ CAD, USD: USD ?? Math.round((CAD * CAD_TO_USD) / 5) * 5 })
const rental = (weekend: number, week: number, month: number, deposit: number): RentalRates => ({
  weekend: p(weekend),
  week: p(week),
  month: p(month),
  deposit: p(deposit),
})
```

`p()` converts CAD to USD and rounds to the **nearest 5**. A tie rounds up, because `Math.round(x.5)` rounds toward +∞. For example, `6850 × 0.73 = 5000.5`, divided by 5 is `1000.1`, which gives `5000`; `2450 → 1788.5 → 1790`. Passing a second argument pins the USD price; only the gift card does this (`p(250, 200)`).

### 5.2 USD derivation: the rounding rules in use

| Path | Formula | Example |
|---|---|---|
| `p(CAD)`: product prices and rental rates | `Math.round(CAD × 0.73 / 5) × 5` (nearest 5) | 38500 → 28105; 650 → 475 |
| `toUSD(cad)`: personalization add-on | same as `p()` | 180 → 131.4 → **130** |
| `priceFor` metal delta | `Math.round(delta × 0.73)` (nearest 1) | +650 → +475; −400 → **−292** |
| `convert`: gift cards | `Math.round(amount × 0.73)` and `Math.round(amount / 0.73)` | 250 CAD → 183 USD; 100 USD → 137 CAD |
| costing `fx` | multiply each component by 0.73, then round each line | GIA fee 165 → 120; labour rate 95 → 69 |

### 5.3 Lookups

| Function | Signature | Behaviour | Callers |
|---|---|---|---|
| `getCategory` | `(slug: string) => Category \| undefined` | `CATEGORIES.find` by slug | `src/pages/Category.tsx` (renders "This chapter could not be found." when undefined); `src/pages/Product.tsx` (`getCategory(product.category)!`, a non-null assertion); `categoryName` in costing |
| `getProduct` | `(slug: string) => Product \| undefined` | `PRODUCTS.find` (first match wins) | `src/store.tsx` `linePrice` (unknown product prices at `0`); `src/lib/shopify.ts` `isGiftCardLine`; `src/components/cart/UndoToast.tsx`; `src/components/cart/CartLineItem.tsx` (returns `null` when unknown); `src/pages/Product.tsx` ("This piece has returned to the vault."); `src/pages/Checkout.tsx` (skips unknown); `src/components/RecentlyViewed.tsx` (`.map(getProduct)` then filters); `videoProducts` in media |
| `getProductsByCategory` | `(slug: CategorySlug) => Product[]` | `PRODUCTS.filter` (keeps array order) | `src/components/Header.tsx` (mega-menu `.slice(0, 2)`); `src/pages/Category.tsx` (copies, then sorts); `src/pages/Product.tsx` (related, minus self); `src/components/home/CategoryIndex.tsx` (count); `src/components/home/WatchSpotlight.tsx` (`'watches'`) |

### 5.4 `priceFor`

```ts
export function priceFor(product: Product, currency: Currency, metal?: Metal): number {
  const base = product.price[currency]
  if (!metal) return base
  const delta = METALS[metal].priceDeltaCAD
  return base + (currency === 'CAD' ? delta : Math.round(delta * CAD_TO_USD))
}
```

- Without `metal` it returns the base price. That base is the **gold** price even for products whose default metal is platinum (see Notes).
- It does not check that `metal` is in `product.metals`.
- It ignores `rental`. Callers branch on `product.rental` themselves.
- Callers:
  - `src/store.tsx` `linePrice`
  - `src/data/costing.ts`
  - `src/pages/Product.tsx`, `src/pages/Category.tsx` (sorting)
  - `src/components/ProductCard.tsx`, `src/components/RecentlyViewed.tsx`
  - `src/components/cart/CartLineItem.tsx`, `src/components/cart/CartUpsell.tsx`
  - `src/components/pdp/CompleteTheLook.tsx`
  - `src/components/home/GiftFinder.tsx`, `src/components/home/WatchSpotlight.tsx`
  - `src/components/video/ShoppableVideos.tsx`, `src/components/video/VideoViewer.tsx`
  - `src/components/tryon/TryOnStudio.tsx`

Metal-variant prices that differ from base (CAD / USD):

| Product | Variant | Price CAD / USD |
|---|---|---|
| `riviere-saint-laurent` | platinum | 39150 / 28580 |
| `plateau-paperclip-chain` | vermeil | 2050 / 1498 |
| `vieux-port-diamond-studs` | platinum | 9550 / 6970 |
| `mile-end-huggies` | vermeil | 1550 / 1133 |
| `westmount-tennis-bracelet` | platinum | 15150 / 11060 |
| `griffintown-chain-bracelet` | vermeil | 1250 / 913 |
| `sherbrooke-emerald-cocktail` | platinum | 22450 / 16390 |
| `laurier-stacking-band` | platinum | 2000 / 1460 |
| `notre-dame-oval-solitaire` | platinum (**default**) | 19550 / 14270 |
| `basilique-emerald-cut-three-stone` | platinum (**default**) | 27050 / 19745 |
| `promesse-wedding-band` | platinum (**default**) | 2100 / 1535 |
| `gala-diamond-collar` | platinum (only metal; rental) | 92650 / 67635 |
| `bridal-tiara-and-drops` | platinum (only metal; rental) | 48650 / 35515 |
| `initial-disc-pendant` | vermeil | 280 / 203 |
| `bespoke-engagement-commission` | platinum (**default**) | 5650 / 4125 |
| `heirloom-redesign` | platinum | 2450 / 1790 |
| `engraved-nameplate-necklace` | vermeil | 850 / 623 |

### 5.5 `formatPrice`

```ts
export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'CAD' ? 'en-CA' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

Output under Node 24 ICU: `formatPrice(6850, 'CAD')` → `$6,850`; `formatPrice(5000, 'USD')` → `$5,000`; `formatPrice(-400, 'CAD')` → `-$400`; `formatPrice(1234.5, 'USD')` → `$1,235`.

- Both currencies print a bare `$`.
- `src/components/Price.tsx` appends the ISO code itself: `{formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span>`. It always uses the **store** currency, so the amount passed in must already be in that currency.
- Four places call `formatPrice` directly, so no ISO-code span is added:
  - `src/pages/Account.tsx`, `src/components/giftcard/BalanceChecker.tsx` and `src/components/giftcard/GiftCardArt.tsx` format in the **card's** currency. BalanceChecker appends the code as plain text.
  - `src/pages/GiftCards.tsx` uses it for the denomination buttons and the range validation message.
- A new `Intl.NumberFormat` is built on every call.

### 5.6 Personalization helpers

```ts
export const toUSD = (cad: number) => Math.round((cad * CAD_TO_USD) / 5) * 5

export function personalizationPrice(product: Product, p: Personalization | undefined, currency: Currency): number {
  const accent = product.personalization?.accent
  if (!p?.accent || !accent) return 0
  return currency === 'CAD' ? accent.priceCAD : toUSD(accent.priceCAD)
}
```

- `toUSD` is exported, but its only caller is `personalizationPrice`.
- `personalizationPrice` returns `0` unless the selection has `accent: true` **and** the product config defines an `accent`. Only `engraved-nameplate-necklace` does, so the result is 180 CAD or 130 USD.
- Callers of `personalizationPrice`:
  - `src/store.tsx` `linePrice`
  - `buildCostBreakdown`
  - `src/pages/Product.tsx`, which passes `pcfg ? personal : undefined`
  - `src/components/cart/CartLineItem.tsx`
  - `src/components/pdp/Personalizer.tsx`, which calls it with `{ ...value, accent: true }` to label the checkbox `+ <Price>`

```ts
export function validatePersonalization(cfg: PersonalizationConfig, text: string): string | null {
  const t = text.trim()
  if (t.length < cfg.minLength) return cfg.minLength === 1 ? 'Please enter a letter' : `Please enter at least ${cfg.minLength} characters`
  if (t.length > cfg.maxLength) return `Maximum ${cfg.maxLength} characters`
  if (!new RegExp(`^[${cfg.allowed}]+$`).test(t)) return 'Some characters cannot be engraved'
  return null
}
```

- **Order of checks:** trim, then minimum length, then maximum length, then the character class. Lengths count UTF-16 code units of the trimmed text.
- **RegExp construction:** `cfg.allowed` is spliced raw into `^[…]+$` with **no flags**, so it is case-sensitive and not in `u` mode. The nameplate's TS literal `"A-Za-zÀ-ÿ '\\-"` becomes the runtime string `A-Za-zÀ-ÿ '\-`. That class allows:
  - A–Z and a–z
  - U+00C0–U+00FF, which **includes `×` (U+00D7) and `÷` (U+00F7)**
  - space
  - ASCII apostrophe (U+0027)
  - an escaped hyphen
- **Callers:** `src/pages/Product.tsx` `handleAdd` (`personalOk = !pcfg || validatePersonalization(pcfg, personal.text) === null`) and `src/components/pdp/Personalizer.tsx`. The Personalizer shows the min-length error for empty text only after a failed add: `value.text ? validate(cfg, value.text) : showError ? validate(cfg, '') : null`.

Results from running the function:

| Config | Input | Result |
|---|---|---|
| nameplate | `""`, `"A"` | `Please enter at least 2 characters` |
| nameplate | `"Sofia"`, `"D'Arcy-Lee"`, `"Ana  Maria"`, `"Zoë"`, `"José"`, `"Naïma"`, `" ab "` | `null` |
| nameplate | `"O’Neil"` (U+2019 typographic apostrophe) | `Some characters cannot be engraved` |
| nameplate | `"Łukasz"` (outside Latin-1) | `Some characters cannot be engraved` |
| nameplate | `"Ab×"`, `"Ab÷"` | `null` |
| nameplate | `"-- "` (trims to `--`) | `null` (no letter is required) |
| nameplate | `"Abcdefghijk"` (11 chars) | `Maximum 10 characters` |
| nameplate | `"Sofia1"` | `Some characters cannot be engraved` |
| monogram | `""` | `Please enter a letter` |
| monogram | `"tms"` | `null` (lowercase passes; the Personalizer upper-cases monogram input) |
| monogram | `"TMSX"` | `Maximum 3 characters` |
| monogram | `"T.S"`, `"é"` | `Some characters cannot be engraved` |
| initial | `"TS"` | `Maximum 1 characters` |
| initial | `"1"` | `Some characters cannot be engraved` |

### 5.7 Date helpers (local-time semantics)

```ts
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export function rentalReturnDate(start: string, period: RentalPeriodId): Date {
  return addDays(parseIso(start), RENTAL_DAYS[period])
}
export const formatDay = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  d.toLocaleDateString('en-CA', opts)
```

- **`isoDate`** formats the **local** calendar date. `toISOString` would give the UTC date instead.
- **`parseIso`** returns **local midnight**. By contrast, `new Date('2026-10-15')` would mean UTC midnight. Malformed input such as `'2026-10'` or `'nope'` returns `Invalid Date`; nothing validates the input.
- **`addDays`** rebuilds the date from calendar parts. It drops the time of day, overflows months correctly (`2026-10-30` + 3 → `2026-11-02`) and is unaffected by DST, because it never adds 24-hour blocks of milliseconds.
- **`rentalReturnDate`** returns start + `RENTAL_DAYS` days. From `2026-10-15` that is weekend → `2026-10-18`, week → `2026-10-22`, month → `2026-11-14`. The booked or highlighted window covers days `start … start + N − 1`. The return ("Collected … by 12:00" in RentalCalendar) falls on the **day after** that window and is not checked against bookings.
- **`formatDay`** always uses the `en-CA` locale, whichever currency is active. Node 24 prints `Thu, Oct 15`, and with `{ weekday: 'long', day: 'numeric', month: 'long' }` (used in RentalCalendar's aria-labels) `Thursday, October 15`. Exact punctuation depends on the browser's ICU.

Callers:

| Helper | Callers |
|---|---|
| `isoDate` | `src/components/pdp/RentalCalendar.tsx`; `src/pages/GiftCards.tsx` (today; max = today + 365); `getBookedDates` |
| `parseIso` | `src/components/lineDetails.ts`; `src/components/pdp/RentalCalendar.tsx`; `src/pages/Product.tsx`; `src/pages/Checkout.tsx`; `rentalReturnDate` |
| `addDays` | `src/components/pdp/RentalCalendar.tsx`; `src/pages/GiftCards.tsx`; `getBookedDates`, `rentalReturnDate` |
| `rentalReturnDate` | `src/components/lineDetails.ts`; `src/components/pdp/RentalCalendar.tsx` |
| `formatDay` | `src/components/lineDetails.ts`; `src/components/pdp/RentalCalendar.tsx`; `src/pages/Product.tsx` (`From {day}`); `src/pages/Checkout.tsx`; `src/pages/GiftCards.tsx` (which parses with `new Date(sendOn + 'T00:00')`, also local time) |

### 5.8 `getBookedDates`: demo availability

Doc comment: `/** Demo availability: a few booked windows per piece, stable per slug, relative to today. */`

```ts
export function getBookedDates(slug: string): Set<string> {
  let h = 0
  for (const ch of slug) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  const today = new Date()
  const booked = new Set<string>()
  for (let k = 0; k < 4; k++) {
    const offset = 5 + ((h >> (k * 5)) % 20) + k * 24
    const len = 3 + ((h >> (k * 3)) % 5)
    for (let i = 0; i < len; i++) booked.add(isoDate(addDays(today, offset + i)))
  }
  return booked
}
```

- **Hash.** It is a djb2-style multiply-by-33 hash with seed 0, kept as an unsigned 32-bit value by `>>> 0`. It is deterministic per slug.
- **Windows.** Four windows, `k = 0…3`, each starting `offset` days from **today** and running `len` days. The function reads `new Date()` on every call, so the windows slide forward one day per calendar day. Each window is a fixed distance from today, not a fixed calendar date.
- **Intended ranges.** `offset ∈ [5 + 24k, 24 + 24k]` and `len ∈ [3, 7]`.
- **Actual behaviour.** The function uses the **signed** shift `>>`. When `h ≥ 2³¹`, every shifted value is negative, so the remainders are ≤ 0. Offsets can then fall as low as `−14 + 24k`, which books past dates, and `len` can be −1…3, which gives empty windows.
- **Callers.** Only rental slugs are passed in practice:
  - the `RentalCalendar` component (`useMemo` per slug)
  - `isBookingValid` in `src/components/pdp/RentalCalendar.tsx`, which is called from `src/pages/Product.tsx` `handleAdd` and from `src/components/pdp/CompleteTheLook.tsx` (once per piece in a rental set)

Windows produced by running the function:

| Slug | `h` (uint32) | `h ≥ 2³¹` | k=0 (offset, len) | k=1 | k=2 | k=3 | Booked days relative to today |
|---|---|---|---|---|---|---|---|
| `gala-diamond-collar` | 1013301384 | no | (9, 7) | (37, 6) | (65, 7) | (80, 7) | +9…+15, +37…+42, +65…+71, +80…+86 (27 days) |
| `chandelier-sapphire-earrings` | 4264850464 | yes | (−7, 1) | (18, −1) | (42, 2) | (77, 1) | −7, +42, +43, +77 (4 days, one in the past) |
| `bridal-tiara-and-drops` | 2941381153 | yes | (2, 0) | (22, 0) | (51, −1) | (68, 0) | **none** |

Of the 27 slugs, 18 hash to `h ≥ 2³¹`.

### 5.9 `tryOnKind`

Doc comment: `/** How a piece is drawn on the camera feed, or null when it cannot be tried on. */`

```ts
export function tryOnKind(p: Product): TryOnKind | null {
  const n = p.name.toLowerCase()
  if (/gift card|redesign/.test(n)) return null
  if (/earring|stud|drop|huggie|tiara/.test(n)) return 'earrings'
  if (/necklace|pendant|collar|rivi|chain(?! bracelet)/.test(n)) return 'necklace'
  if (/bracelet|cuff|tennis/.test(n)) return 'bracelet'
  if (p.category === 'watches') return 'watch'
  if (/ring|signet|band|solitaire|three-stone|engagement/.test(n) || p.category === 'rings' || p.category === 'bridal') return 'ring'
  return null
}
```

- The patterns match substrings of the lower-cased **name**, and the first matching branch wins.
- `chain(?! bracelet)` stops "Griffintown Chain Bracelet" from being classified as a necklace.
- "Bridal Tiara & Drops Set" maps to `earrings`, because `tiara` sits in the earrings branch.
- The per-product results are in table B (§4.6).
- Callers:
  - `src/components/tryon/TryOnProvider.tsx`: `canTryOn` and the open guard
  - `src/components/tryon/TryOnStudio.tsx`: the active kind, the list filter and product switching
  - `src/pages/Category.tsx` and `src/pages/Wishlist.tsx`: the "wearable" subsets
  - `src/components/home/TryOnFeature.tsx`: the wearable list, starting from `'vieux-port-diamond-studs'`
- Rendering per kind is covered in [features/virtual-try-on.md](features/virtual-try-on.md).

---

## 6. Media (`src/data/media.ts`)

File comment: `// Video and review media. Clips are royalty-free stock from Mixkit, used as placeholders for brand films.`

```ts
const clip = (id: number, q: 360 | 720 = 720) => `https://assets.mixkit.co/videos/${id}/${id}-${q}.mp4`
const poster = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`
```

`ShoppableVideo` is `{ id: string; src: string; preview: string; poster: string; title: string; caption: string; handle: string; products: string[] }`. The doc comment on `preview` reads "Lighter rendition for small autoplaying tiles." The builder `v(n, title, caption, handle, products)` returns:
- `id: \`v${n}\``
- `src: clip(n, 720)`
- `preview: clip(n, 360)`
- `poster: poster(n)`

### 6.1 `VIDEOS` (in order)

| `id` | Mixkit clip | `title` | `caption` | `handle` | `products` (slugs) |
|---|---|---|---|---|---|
| `v5220` | 5220 | The oval, up close | How a 1.82 ct oval catches morning light. | @teresaandsons | notre-dame-oval-solitaire, promesse-wedding-band |
| `v47476` | 47476 | Getting ready | A bride fastens her Westmount line before the ceremony. | @claire.weds | westmount-tennis-bracelet, vieux-port-diamond-studs |
| `v24656` | 24656 | The reveal | Every proposal deserves this moment. | @teresaandsons | basilique-emerald-cut-three-stone, notre-dame-oval-solitaire |
| `v34213` | 34213 | Dressing the vitrine | Behind the glass on rue Sherbrooke. | @teresaandsons | riviere-saint-laurent, mont-royal-solitaire-pendant, plateau-paperclip-chain |
| `v34611` | 34611 | Stacked, not stuffy | Tennis lines and curb links, worn together. | @mtl.style | westmount-tennis-bracelet, griffintown-chain-bracelet |
| `v47288` | 47288 | Forty facets later | Our setter checks each stone under the loupe. | @teresaandsons | mont-royal-solitaire-pendant, vieux-port-diamond-studs |
| `v50782` | 50782 | Evening, adorned | Emerald and pearl for a gala in Old Montreal. | @priya.s | sherbrooke-emerald-cocktail, outremont-pearl-drops |
| `v51649` | 51649 | Yes, in Montréal | A campfire proposal on Mont-Royal. | @danielk | notre-dame-oval-solitaire |
| `v5181` | 5181 | Promises, boxed | Matched bands, ready for the day. | @teresaandsons | promesse-wedding-band, laurier-stacking-band |
| `v2861` | 2861 | Recycled gold | Every ingot we cast is reclaimed and refined. | @teresaandsons | teresa-signet, atwater-cuff |

Six videos use `@teresaandsons`: v5220, v24656, v34213, v47288, v5181 and v2861. `src/pages/Atelier.tsx` shows exactly those, via `VIDEOS.filter((v) => v.handle === '@teresaandsons')`. `src/pages/Home.tsx` shows all ten.

### 6.2 Selectors

| Function | Definition | Callers |
|---|---|---|
| `videoProducts(video)` | `video.products.map(getProduct).filter((p): p is Product => !!p)`. Unknown slugs are **silently dropped**. | `src/components/video/ShoppableVideos.tsx` (first product chip); `src/components/video/VideoViewer.tsx` |
| `videosForProduct(slug)` | `VIDEOS.filter((x) => x.products.includes(slug))` | `src/pages/Product.tsx` (films first); `src/components/pdp/Gallery.tsx` (`[0]` becomes the gallery film) |
| `videosForCategory(cat)` | `VIDEOS.filter((x) => videoProducts(x).some((p) => p.category === cat))` | `src/pages/Category.tsx`; `src/pages/Product.tsx` (appended, excluding the product's own films) |

`videosForCategory` results:

| Category | Videos |
|---|---|
| necklaces | v34213, v47288 |
| earrings | v47476, v47288, v50782 |
| bracelets | v47476, v34611, v2861 |
| rings | v50782, v5181, v2861 |
| bridal | v5220, v24656, v51649, v5181 |
| watches, rentals, gifts, custom | none |

No watch, rental, gift or custom product appears in any video.

### 6.3 Review media

```ts
export type ReviewMedia = { type: 'image'; src: string } | { type: 'video'; src: string; poster: string }
```

The private builders are `img(src)` → `{ type: 'image', src }` and `vid(n)` → `{ type: 'video', src: clip(n, 360), poster: poster(n) }`, so review videos always use the 360 rendition. The doc comment on `REVIEW_MEDIA` reads "Client-submitted media pools, chosen to match what each category looks like when worn."

| `REVIEW_MEDIA` key | Pool (in order) |
|---|---|
| `ring` | img ring1, vid 51651, img rings, vid 5215, img ring2, vid 20877, img bridal2, vid 5223 |
| `necklace` | img necklace1, vid 34213, img necklace2, img jewelryFlat, vid 50782 |
| `earrings` | img earrings1, img earrings3, vid 50782, img earrings2 |
| `bracelet` | img bracelet1, vid 34611, img bracelet2, vid 47476 |
| `watch` | img watch1, img watch3, img watch2 |
| `gift` | img gift1, img gift2, vid 24656 |

```ts
export function mediaPoolFor(p: Product): ReviewMedia[] {
  if (p.category === 'watches') return REVIEW_MEDIA.watch
  if (p.category === 'gifts') return REVIEW_MEDIA.gift
  const n = p.name.toLowerCase()
  if (/earring|stud|drop|huggie/.test(n)) return REVIEW_MEDIA.earrings
  if (/bracelet|cuff/.test(n)) return REVIEW_MEDIA.bracelet
  if (/necklace|pendant|collar|rivi|chain/.test(n)) return REVIEW_MEDIA.necklace
  return REVIEW_MEDIA.ring
}
```

`mediaPoolFor` differs from `tryOnKind` in three ways:
- The category is checked first, so every product in `gifts` gets the gift pool.
- The bracelet branch comes before the necklace branch, so "Chain Bracelet" resolves to bracelet.
- `ring` is the fallback, used by rings, bridal and custom (except the nameplate necklace).

The only caller is `src/components/pdp/Reviews.tsx`. It starts at a slug-seeded index (`s % pool.length`) and cycles through the pool. `REVIEW_MEDIA` is exported, but nothing outside `media.ts` reads it.

---

## 7. Gift cards (`src/data/giftcards.ts`)

The header comment says the module is modelled on Shopify's native gift card: one product with a variant per denomination, recipient details carried as line-item properties, and 16-character codes redeemed at checkout.

### 7.1 Catalog constants

| Constant | Value | Consumers |
|---|---|---|
| `GIFT_CARD_SLUG` | `'gift-card'` (equals the slug of `PRODUCTS` `tns-gf-003`) | `src/pages/GiftCards.tsx`, which calls `addToCart({ slug: GIFT_CARD_SLUG, giftCard: line })` `qty` times. Identical lines stack into one `CartLine` with `qty` N. |
| `DENOMINATIONS: Record<Currency, number[]>` | `CAD: [100, 250, 500, 1000, 2500, 5000]`, `USD: [100, 250, 500, 1000, 2500, 5000]` | GiftCards preset grid (`formatPrice(d, currency)`) |
| `CUSTOM_RANGE: Record<Currency, [number, number]>` | `{ CAD: [50, 10000], USD: [50, 7500] }` | GiftCards custom amount. Validation message: `` `Choose an amount between ${formatPrice(min, currency)} and ${formatPrice(max, currency)}.` `` The input keeps digits only, at most 5 (`replace(/\D/g, '').slice(0, 5)`). |

`DESIGNS: GiftCardDesign[]`, where `GiftCardDesign` is `{ id: string; name: string; background: string; ink: string; accent: string }`:

| `id` | `name` | `background` | `ink` | `accent` |
|---|---|---|---|---|
| `travertine` | Travertine | `linear-gradient(135deg,#FBF9F5 0%,#EDE6D8 55%,#E2D7C2 100%)` | `#141311` | `#B89047` |
| `espresso` | Espresso | `linear-gradient(135deg,#1e1b18 0%,#121110 60%,#2a2520 100%)` | `#FBF9F5` | `#D4B982` |
| `vermeil` | Vermeil | `linear-gradient(135deg,#e8d3a3 0%,#c9a45f 40%,#9c7a3c 75%,#d4b982 100%)` | `#141311` | `#FBF9F5` |
| `mont-royal` | Mont-Royal | `linear-gradient(160deg,#2f3a33 0%,#1d2420 60%,#3b463d 100%)` | `#F3EFE6` | `#D4B982` |

Where `DESIGNS` is used:
- **`src/pages/GiftCards.tsx`:** the 4-column design picker; the default design is `DESIGNS[0].id` = `travertine`.
- **`src/components/giftcard/GiftCardArt.tsx`:** looks up `DESIGNS.find(...) ?? DESIGNS[0]`; `background` and `ink` style the card, `accent` the guilloche, the `&` and the chip.
- **`src/components/lineDetails.ts`** and **`src/lib/shopify.ts`:** resolve a design id to its name.

### 7.2 `GiftCardLine`

```ts
/** Line item payload for a gift card; maps 1:1 to Shopify gift card recipient properties. */
export interface GiftCardLine {
  amount: number
  currency: Currency
  design: string
  delivery: GiftDelivery // 'email' | 'physical'
  toSelf: boolean
  recipientName?: string
  recipientEmail?: string
  senderName?: string
  message?: string
  sendOn?: string // yyyy-mm-dd
}
```

(The `GiftDelivery` comment is added here for clarity; the source declares `export type GiftDelivery = 'email' | 'physical'` separately.)

How `src/pages/GiftCards.tsx` fills each field:

| Field | Value |
|---|---|
| `amount` | `Math.round(value)`, from a preset or the custom input (default preset 250) |
| `currency` | the store currency at the moment of adding |
| `design` | the selected design id |
| `delivery` | `'email'` (default) or `'physical'` |
| `toSelf` | default `false` |
| `recipientName` | `undefined` if `toSelf`; otherwise the trimmed value, which is required (`Add the recipient’s name.`) |
| `recipientEmail` | set only when `!toSelf` and delivery is `email`; trimmed and validated with `/^\S+@\S+\.\S+$/` |
| `senderName` / `message` | trimmed, or `undefined` if empty; the message is limited to 200 chars (`MESSAGE_MAX`) |
| `sendOn` | set only when `!toSelf`, delivery is `email`, and the date is not today. Local `yyyy-mm-dd`, from today to today + 365. |

### 7.3 Conversion

```ts
export const convert = (amount: number, from: Currency, to: Currency) =>
  from === to ? amount : to === 'USD' ? Math.round(amount * CAD_TO_USD) : Math.round(amount / CAD_TO_USD)
```

| Amount | CAD → USD | USD → CAD |
|---|---|---|
| 100 | 73 | 137 |
| 250 | 183 | 342 |
| 500 | 365 | 685 |
| 1000 | 730 | 1370 |
| 2500 | 1825 | 3425 |
| 5000 | 3650 | 6849 |
| range ends | 10000 CAD → 7300 USD | 7500 USD → 10274 CAD |

Callers:
- `src/store.tsx` `linePrice`: a gift-card line is priced as `convert(amount, giftCard.currency, storeCurrency) × qty`.
- `src/pages/Checkout.tsx`: available balance = `convert(card.balance, card.currency, currency)`, recomputed on a currency switch.
- `debitCards`: converts back to the card's currency.

### 7.4 Codes

```ts
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const formatCode = (s: string) => normalizeCode(s).replace(/(.{4})(?=.)/g, '$1 ')
export const maskCode = (s: string) => `•••• •••• •••• ${normalizeCode(s).slice(-4)}`
export const isCodeFormat = (s: string) => /^[A-Z0-9]{16}$/.test(normalizeCode(s))
```

- **`ALPHABET`** has 32 characters and leaves out `I`, `O`, `0` and `1`. Because `256 % 32 === 0`, `b % 32` is uniform, so there is no modulo bias.
- **`generateCode`** produces 16 characters and does no collision check. Its only caller is `issueCards`.
- **`normalizeCode`** upper-cases, then strips everything outside `[A-Z0-9]`, accented letters included (`'ée-12 ab'` → `'E12AB'`). It is used inside the module only.
- **`formatCode`** inserts a space after every 4 characters, with no trailing space and no length cap. Examples: `'TERESASONS1962MT'` → `TERE SASO NS19 62MT`; `'abcde'` → `ABCD E`. The two code inputs, in Checkout and BalanceChecker, render `value={formatCode(code)}` with `maxLength={19}`.
- **`maskCode`** prints `•••• •••• •••• ` (U+2022 bullets) followed by the last 4 characters, e.g. `•••• •••• •••• 62MT`.
- **`isCodeFormat`** checks for exactly 16 alphanumerics after normalization, so lowercase input and separators are accepted.

| Function | Callers |
|---|---|
| `formatCode` | Checkout, BalanceChecker, `GiftCardArt` (which shows `•••• •••• •••• ••••` when no code is passed) |
| `maskCode` | Account, Checkout, BalanceChecker |
| `isCodeFormat` | Checkout `applyCode`, BalanceChecker `check` |

### 7.5 Ledger: the local stand-in for Shopify gift-card balances

```ts
export interface IssuedCard {
  code: string
  initial: number
  balance: number
  currency: Currency
  design: string
  recipientName?: string
  issuedAt: string
  expiresAt: string | null // Québec & most provinces: no expiry
}
```

- **Storage key:** `const LEDGER_KEY = 'tns-giftcard-ledger'`.
- **Demo card:** `DEMO` is `{ code: 'TERESASONS1962MT', initial: 250, balance: 250, currency: 'CAD', design: 'travertine', recipientName: 'Demo card', issuedAt: '2024-01-01', expiresAt: null }`.

| Function | Behaviour | Callers |
|---|---|---|
| `loadLedger(): IssuedCard[]` | Parses `localStorage[LEDGER_KEY] \|\| '[]'`. If the list already contains the demo code it is returned as is; otherwise the result is `[DEMO, ...list]`. Any exception (bad JSON, storage blocked, `null`) returns `[DEMO]`. The `DEMO` in these results is the **module constant object** itself, not a copy. | `src/pages/Account.tsx` (wallet; filters out `'TERESASONS1962MT'`); `lookupCard`, `issueCards`, `debitCards` |
| `saveLedger(list)` | `localStorage.setItem(LEDGER_KEY, JSON.stringify(list))`. **Not** wrapped in try/catch. | `issueCards`, `debitCards` |
| `lookupCard(code): IssuedCard \| null` | Normalizes the code, then searches `loadLedger()` for an exact match. | Checkout `applyCode`, BalanceChecker |
| `issueCards(lines: GiftCardLine[], qtys: number[]): IssuedCard[]` | For each line `i`, issues `qtys[i]` cards: `code: generateCode()`, `initial = balance = l.amount`, `currency: l.currency`, `design: l.design`, `recipientName: l.toSelf ? undefined : l.recipientName`, `issuedAt: new Date().toISOString().slice(0, 10)` (UTC date), `expiresAt: null`. Saves `[...ledger, ...issued]` (which persists `DEMO` the first time) and returns the issued cards in input order. | `src/pages/Checkout.tsx` `placeOrder` |
| `debitCards(applied: { code; amount; currency }[])` | Doc comment: "Deducts applied amounts (in checkout currency) from card balances." Each matching card (exact code) gets `balance = Math.max(0, balance - convert(amount, currency, card.currency))`, then the ledger is saved. Unknown codes are ignored. | `src/pages/Checkout.tsx` `placeOrder`, which runs **before** `issueCards` |

The demo code is also hardcoded in two other places: as a string in `src/pages/Account.tsx` and as the hint `Demo card: TERE SASO NS19 62MT` in `src/components/giftcard/BalanceChecker.tsx`.

---

## 8. Cost model (`src/data/costing.ts`)

The header comment reads: "Itemised cost model for a piece. Figures are indicative and reconcile exactly to the retail price: materials and making charges are estimated from specs, and the remainder is shown openly as margin."

### 8.1 Types

```ts
export type CostGroup = 'materials' | 'making' | 'services' | 'options' | 'margin'
export interface CostLine {
  id: string
  group: CostGroup
  label: string
  detail?: string
  amount: number
  included?: boolean // shown as complimentary, amount 0
}
export interface CostBreakdown { lines: CostLine[]; price: number /* pre-tax total including options */; metalWeight: number; labourHours: number }
// CostBreakdown is condensed onto one line here; the source has one field per line, with a `//` comment on `price`.
```

### 8.2 Constants (module-private)

`METAL_RATE: Record<Metal, { rate; purity; name }>`. Its doc comment reads "Indicative metal rates per gram, CAD."

| Metal | `rate` (CAD/g) | `purity` | `name` |
|---|---|---|---|
| `18k-yellow` | 82.4 | `18k · 75.0% gold` | `18k yellow gold` |
| `18k-white` | 84.1 | `18k · 75.0% gold, rhodium finish` | `18k white gold` |
| `18k-rose` | 81.9 | `18k · 75.0% gold` | `18k rose gold` |
| `platinum` | 48.6 | `Pt950 · 95.0% platinum` | `Platinum 950` |
| `vermeil` | 1.6 | `925 silver, 2.5µ 18k gold` | `Gold vermeil` |

| Category | `DEFAULT_WEIGHT` (g) | `STONE_SHARE` | `MAKING_SHARE` |
|---|---|---|---|
| necklaces | 6.2 | 0.5 | (0.16) |
| earrings | 3.4 | 0.46 | (0.16) |
| bracelets | 11.5 | 0.48 | (0.16) |
| rings | 5.2 | 0.44 | (0.16) |
| bridal | 4.6 | 0.56 | 0.13 |
| watches | 32 | 0.34 | 0.08 |
| rentals | 28 | 0.5 | (0.16) |
| gifts | 3.1 | 0.22 | (0.16) |
| custom | 4.8 | 0.3 | 0.2 |
| fallback (`??`) | 5 | 0.4 | 0.16 |

`LABOUR_RATE_CAD = 95` (per bench hour). All three category maps are `Record<string, number>`, so a missing category is not a type error.

### 8.3 Input parsing

- `hasCostBreakdown = (p) => p.metals.length > 0 && !/commission|redesign/i.test(p.name)`. Its doc comment reads "Products priced as a service or deposit, where a material breakdown would mislead." It is false for `gift-card`, `bespoke-engagement-commission` and `heirloom-redesign`. **`buildCostBreakdown` must not be called when it is false**: with `metals: []`, `METAL_RATE[undefined].rate` throws. The only guard is in `src/pages/Product.tsx`, which uses `hasCostBreakdown` in three places:
  - the lower-section numbering (`'pricing'`)
  - the `See full cost breakdown` link next to the price (non-rental branch only)
  - the `PriceBreakdown` section itself
- `parseNum = (s) => Number((s.match(/[\d.]+/) ?? ['0'])[0])` reads the first number in a string.
- `stonesFor(p)` returns `{ label, detail, weight }[]`, where `weight` is a relative value weight:

| Source | Condition | `label` | `detail` | `weight` |
|---|---|---|---|---|
| `p.gia` | present | `` `Centre diamond · ${shape}` `` | `` `${carat.toFixed(2)} ct · ${color} / ${clarity} · GIA ${reportNumber}` `` | `carat × 6` |
| spec key exactly `pearl` (case-insensitive) | always, checked before the `ct` test | `Pearls` | spec value | `3` |
| any other spec | the value must contain `ct`, otherwise it is skipped; `ct = parseNum(value)` | — | — | — |
| key includes `emerald` | | `Colombian emerald` | value | `ct × 3.5` |
| key includes `sapphire` | | `Ceylon sapphires` | value | `ct × 2.2` |
| key includes `total carat` | | `Diamonds` | value + `` ` · ${specs.Color}` `` + `` ` / ${specs.Clarity}` `` (each only if present) | `ct × 2.5` |
| key matches `/diamond\|halo\|side\|bezel/` | | `Hidden halo diamonds` (halo) / `Side stones` (side) / `Bezel diamonds` (bezel) / `Accent diamonds` (otherwise) | value | `ct × 1.8` |

### 8.4 `buildCostBreakdown(p, currency, metal?, personalization?)`: algorithm

1. **Setup:**
   - `fx = currency === 'CAD' ? 1 : 0.73`
   - `m = metal ?? p.metals[0]`
   - `base = priceFor(p, currency, m)`
   - `accent = personalizationPrice(p, personalization, currency)`
   - `r = Math.round`
2. **Metal:**
   - `weight = specs.Weight ? parseNum(specs.Weight) : DEFAULT_WEIGHT[cat] ?? 5`
   - amount `r(weight × rate × fx + (vermeil ? 30 × fx : 0))`
3. **Stones or movement.** `stonePool = base × (STONE_SHARE[cat] ?? 0.4)`.
   - Watches: `movement = r(stonePool × 0.75)`. If there are stones, also `st0 = r(stonePool × 0.25)`, using the first stone only.
   - Everything else: `st{i} = r(stonePool × weightᵢ / Σweights)`.
4. **Findings.** Regex on `p.name`, case-insensitive, in this order:
   - `/necklace|pendant|chain|collar|rivi/` → `Chain & clasp` / `Solid gold spring ring`
   - `/earring|stud|drop|huggie/` → `Posts & backs` / `Secure screw or hinged backs`
   - `/bracelet/` → `Clasp & safety` / `Double box clasp`
   - category `watches` → `Strap & buckle` / `specs.Strap ?? 'Leather strap'`
   - otherwise none (all rings, bridal and the cuff)

   The amount is `r((watches ? 220 : 45) × fx)`. "Griffintown Chain Bracelet" matches `chain` first, so it gets `Chain & clasp`.
5. **Making:**
   - `hasStones = stones.length > 0`
   - `making = base × (MAKING_SHARE[cat] ?? 0.16) × (hasStones || watches ? 1 : 2.2)`. The source comment reads "Plain metal pieces are labour-led: more forming, filing and polishing relative to price."
   - `labour = making × (hasStones ? 0.55 : 0.8)`
   - `hours = max(2, round(labour / (95 × fx)))`
   - Lines: `labour` = `r(labour)`; `setting` (stones only) = `r(making × 0.3)`; `finish` = `r(making × (hasStones ? 0.15 : 0.2))`
6. **Services:**
   - `gia` (when `p.gia`) = `r(165 × fx)`
   - `insure` = `r(48 × fx)`
   - `engrave` (when `p.engravable`) and `care` are amount 0 with `included: true`
7. **Margin:**
   - `floor = base × 0.12`, `margin = base − Σlines`
   - If `margin < floor` and some stone or movement lines exist, scale them by `k = max(0, (stoneTotal − (floor − margin)) / stoneTotal)`, re-round, and recompute the margin.
   - Push `margin`.
8. **Options.** If `accent > 0`, push `accent`.
9. **Return** `{ lines, price: base + accent, metalWeight: weight, labourHours: hours }`.

**Invariant:** the line amounts always sum to `base + accent` exactly, because every amount is an integer and `margin` is the remainder. This was verified for 160 combinations: all 138 product × metal × currency cases, plus 22 more with the accent toggled on for the three personalized products.

Line catalogue, in push order:

| `id` | group | `label` | `detail` | Condition |
|---|---|---|---|---|
| `metal` | materials | watches: `` `Case & bracelet · ${name}` ``; otherwise `name` | `` `${weight.toFixed(1)} g × ${(rate × fx).toFixed(2)}/g · ${purity}` `` + `' + plating'` for vermeil | always |
| `movement` | materials | `Swiss movement` | `specs.Movement ?? 'Swiss made'` | watches |
| `st0`…`stN` | materials | stone label | stone detail | stones |
| `findings` | materials | see step 4 | see step 4 | name or category match |
| `labour` | making | watches: `Regulation & assembly`; otherwise `Bench work · casting & fabrication` | `` `${hours} h × ${r(95 × fx)}/h · Montréal atelier` `` | always |
| `setting` | making | `Stone setting` | `Hand-set under microscope` | `hasStones` |
| `finish` | making | `Polishing & hallmarking` | `12-stage finish, maker’s mark` | always |
| `gia` | services | `GIA grading report` | `` `№ ${reportNumber}` `` | `p.gia` |
| `insure` | services | `Insured shipping & presentation box` | CAD: `Signature courier, Canada`; USD: `Signature courier, duties prepaid` | always |
| `engrave` | services | `Engraving` | `Hand or laser, up to 18 characters` (0, included) | `p.engravable` |
| `care` | services | `Lifetime care plan` | `Annual cleaning, claw checks, polish` (0, included) | always |
| `margin` | margin | `Design, showroom & maison margin` | `Design, salon, staff, warranty reserve` | always |
| `accent` | options | `p.personalization?.accent?.label ?? 'Option'` | `Selected option` | accent > 0 |

**Worked example:** `notre-dame-oval-solitaire`, platinum, CAD. The price is 19550 and `labourHours` is 15.

| id | label | detail | amount |
|---|---|---|---|
| metal | Platinum 950 | 4.6 g × 48.60/g · Pt950 · 95.0% platinum | 224 |
| st0 | Centre diamond · Oval | 1.82 ct · E / VS1 · GIA 1449286107 | 10736 |
| st1 | Hidden halo diamonds | 0.12 ct | 212 |
| labour | Bench work · casting & fabrication | 15 h × 95/h · Montréal atelier | 1398 |
| setting | Stone setting | Hand-set under microscope | 762 |
| finish | Polishing & hallmarking | 12-stage finish, maker’s mark | 381 |
| gia | GIA grading report | № 1449286107 | 165 |
| insure | Insured shipping & presentation box | Signature courier, Canada | 48 |
| engrave | Engraving | Hand or laser, up to 18 characters | 0 (included) |
| care | Lifetime care plan | Annual cleaning, claw checks, polish | 0 (included) |
| margin | Design, showroom & maison margin | Design, salon, staff, warranty reserve | 5624 |

Reference results with the default metal in CAD, useful for regression checks after changing constants:

| Product (default metal) | Weight g (source) | Stone / movement lines | Findings | Hours | Margin | % | Eased? |
|---|---|---|---|---|---|---|---|
| mont-royal-solitaire-pendant (18k-yellow) | 6.2 (default) | Centre diamond · Round Brilliant 3425 | Chain & clasp 45 | 6 | 1560 | 22.8 | no |
| riviere-saint-laurent (18k-white) | 6.2 | Diamonds 19250 | Chain & clasp 45 | 36 | 12476 | 32.4 | no |
| plateau-paperclip-chain (18k-yellow) | 6.8 (specs) | — | Chain & clasp 45 | 7 | 935 | 38.2 | no |
| vieux-port-diamond-studs (18k-yellow) | 3.4 | Centre diamond 2890; Diamonds 1204 | Posts & backs 45 | 8 | 2844 | 32.0 | no |
| outremont-pearl-drops (18k-yellow) | 3.4 | Pearls 1707; Accent diamonds 225 | Posts & backs 45 | 4 | 1222 | 29.1 | no |
| mile-end-huggies (18k-yellow) | 3.4 | Accent diamonds 897 | Posts & backs 45 | 2 | 367 | 18.8 | no |
| westmount-tennis-bracelet (18k-white) | 11.5 | Diamonds 6960 | Clasp & safety 45 | 13 | 4160 | 28.7 | no |
| atwater-cuff (18k-yellow) | 24 (specs) | — | — | 17 | 1603 | 28.6 | no |
| griffintown-chain-bracelet (18k-yellow) | 11.5 | Accent diamonds 147 (was 792) | Chain & clasp 45 | 2 | 198 | 12.0 | **yes** (pre-easing margin −447) |
| teresa-signet (18k-yellow) | 9 (specs) | — | — | 9 | 1284 | 40.1 | no |
| sherbrooke-emerald-cocktail (18k-yellow) | 5.2 | Colombian emerald 8407; Accent diamonds 1185 | — | 20 | 8245 | 37.8 | no |
| laurier-stacking-band (18k-yellow) | 5.2 | Accent diamonds 496 (was 594) | — | 2 | 162 | 12.0 | **yes** (pre-easing margin 64) |
| notre-dame-oval-solitaire (platinum) | 4.6 | see the worked example | — | 15 | 5624 | 28.8 | no |
| basilique-emerald-cut-three-stone (platinum) | 4.6 | Centre diamond · Emerald 14135; Side stones 1013 | — | 20 | 7949 | 29.4 | no |
| promesse-wedding-band (platinum) | 4.6 | — | — | 5 | 1228 | 58.5 | no |
| heritage-automatic-38 (18k-yellow) | 32 | Swiss movement 1887 | Strap & buckle (Alligator) 220 | 5 | 2016 | 27.2 | no |
| chronographe-1962 (18k-rose) | 32 | Swiss movement 3290 | Strap & buckle (Leather strap) 220 | 9 | 5689 | 44.1 | no |
| dame-du-lac (18k-white) | 32 | Swiss movement 2448; Bezel diamonds 816 | Strap & buckle (Leather strap) 220 | 4 | 2610 | 27.2 | no |
| initial-disc-pendant (18k-yellow) | 3.1 | — | Chain & clasp 45 | 2 | 93 | 13.7 | no |
| pearl-stud-gift-set (18k-yellow) | 3.1 | Pearls 40 (was 119) | Posts & backs 45 | 2 | 65 | 12.0 | **yes** (pre-easing margin −14) |
| engraved-nameplate-necklace (18k-yellow) | 4.8 | — | Chain & clasp 45 | 5 | 211 | 16.9 | no |

Easing also runs for every gold variant, in both currencies, of `griffintown-chain-bracelet` and `laurier-stacking-band`, and for both metals of `pearl-stud-gift-set`. Across all combinations, the lowest final margin is 11.9% (`pearl-stud-gift-set`, USD). No final margin is negative.

**Rentals.** The single consumer, `src/components/pdp/PriceBreakdown.tsx`, does not use `buildCostBreakdown` for rentals. Its local `rentalLines` splits the rental fee as follows; see [components/pdp-modules.md](components/pdp-modules.md):
- `Full insurance cover`: 22%
- `Cleaning & re-certification`: 8%
- `Bonded courier, both ways`: 12%
- `Use of the piece`: the remainder

`PriceBreakdown` memoizes `buildCostBreakdown(product, currency, metal, personalization)`.

### 8.5 `splitTaxes` and `categoryName`

```ts
export function splitTaxes(label: string, amount: number): { name: string; rate: number; amount: number }[] {
  const parts = [...label.matchAll(/([A-Z]+)\s*([\d.]+)%/g)].map((x) => ({ name: x[1], rate: Number(x[2]) / 100 }))
  return parts.map((t) => ({ ...t, amount: Math.round(amount * t.rate) }))
}
```

`splitTaxes` parses a `PROVINCES[x].label` such as `GST 5% + QST 9.975%` into components and **rounds each component separately**. Applied to 10000, `QC` gives GST 500 + QST 997; `ON` gives HST 1300. Its only caller is `PriceBreakdown`, which uses the selected province (default `'QC'`). Cart and Checkout instead compute `Math.round(merch × rate)` on the combined rate (see Notes).

`categoryName = (p) => getCategory(p.category)?.name ?? ''` is exported, but nothing calls it.

---

## 9. Tax (`src/data/tax.ts`)

File comment: `// Canadian sales tax by province (GST/HST + PST/QST), 2024 rates.`

| Code | `name` | `rate` | `label` |
|---|---|---|---|
| `QC` | Québec | 0.14975 | GST 5% + QST 9.975% |
| `ON` | Ontario | 0.13 | HST 13% |
| `BC` | British Columbia | 0.12 | GST 5% + PST 7% |
| `AB` | Alberta | 0.05 | GST 5% |
| `MB` | Manitoba | 0.12 | GST 5% + PST 7% |
| `SK` | Saskatchewan | 0.11 | GST 5% + PST 6% |
| `NS` | Nova Scotia | 0.14 | HST 14% |
| `NB` | New Brunswick | 0.15 | HST 15% |
| `NL` | Newfoundland & Labrador | 0.15 | HST 15% |
| `PE` | Prince Edward Island | 0.15 | HST 15% |

`PROVINCES` is a `Record<string, { name: string; rate: number; label: string }>` with 10 entries and no territories. Every `rate` equals the sum of the percentages in its `label`, and `splitTaxes` depends on that.

`US_STATES = ['New York', 'California', 'Florida', 'Illinois', 'Massachusetts', 'Texas', 'Vermont', 'Washington', 'Other']` is a display-only list with no rates. No USD flow computes tax:
- Checkout shows "Calculated by Shopify".
- `PriceBreakdown` shows "At checkout".
- Cart sets `tax` to `null`.

| Export | Callers |
|---|---|
| `PROVINCES` | `src/pages/Cart.tsx` (default `'QC'`; `PROVINCES[region]?.rate ?? 0`, CAD only); `src/pages/Checkout.tsx` (default `'QC'`; `PROVINCES[province].rate`; summary label ``Tax · ${label}``); `src/components/pdp/PriceBreakdown.tsx` (`splitTaxes(label, price)`) |
| `US_STATES` | `src/pages/Checkout.tsx` (uncontrolled `<select>`); `src/components/pdp/PriceBreakdown.tsx` (controlled; default `US_STATES[0]`) |

---

## 10. `lineDetails` (`src/components/lineDetails.ts`)

`lineDetails(line: CartLine, product: Product): string[]`. Its doc comment reads "Human-readable option lines for a cart line, shared by the bag and checkout." It uses the private map `RENTAL_LABEL = { weekend: 'Weekend rental', week: 'One-week rental', month: 'One-month rental' }`.

**Gift-card line** (`line.giftCard` set). The function returns early with:
1. `` `${designName ?? ''} design · ${delivery === 'email' ? 'Digital' : 'Physical card'}` ``, e.g. `Travertine design · Digital`
2. `For me` if `toSelf`; otherwise `` `To ${recipientName}${recipientEmail ? ` · ${recipientEmail}` : ''}` ``
3. If `sendOn` is set: `` `Sends ${formatDay(parseIso(sendOn))}` ``, e.g. `Sends Thu, Oct 22`
4. If `message` is set: `“…”` in curly quotes (U+201C/U+201D). Messages over 40 characters are cut to `message.slice(0, 40) + '…'` (U+2026).

**Every other line**, in order:
1. `RENTAL_LABEL[line.rental]` if it is a rental; otherwise `METALS[line.metal].label` if a metal is set
2. `` `Size ${size}` `` if `size` is set
3. If the line has both `booking` and `rental`: `` `${formatDay(start)} → ${formatDay(rentalReturnDate(start, rental))}` `` (U+2192), then `` `${method === 'salon' ? 'Salon fitting' : 'Courier'} · ${slot}` ``
4. `describePersonalization(personalization)` from `src/components/pdp/Personalizer.tsx`, which is `[“text”, font label (Script/Serif/Block), chainLength, 'Diamond accent' if accent].filter(Boolean).join(' · ')`, e.g. `“Sofia” · Script · 18 in · Diamond accent`
5. If `engraving` is set: `` `${product.personalization ? 'Reverse' : 'Engraving'}: “${engraving}”` ``
6. If nothing above was added: `[product.collection]`

Examples (illustrative inputs):
- Rental line → `['Weekend rental', 'Sat, Oct 17 → Tue, Oct 20', 'Courier · 09:00 – 11:00']`
- Ring line → `['Platinum 950', 'Size 6', 'Engraving: “Forever”']`

Callers:
- `src/components/cart/CartLineItem.tsx`: one `<li key={d}>` per string
- `src/pages/Checkout.tsx`: `lineDetails(l, p).join(' · ')` followed by `` ` · ×${qty}` ``

---

## 11. Shopify mapping (`src/lib/shopify.ts`)

The header comment says that in a live theme these payloads are POSTed to `/cart/add.js`.

```ts
/** Placeholder variant IDs; replace with the store's real IDs when connecting. */
const GIFT_CARD_VARIANTS: Record<string, number> = {
  'CAD-100': 44100000001, 'CAD-250': 44100000002, 'CAD-500': 44100000003,
  'CAD-1000': 44100000004, 'CAD-2500': 44100000005, 'CAD-5000': 44100000006,
  'USD-100': 44100000011, 'USD-250': 44100000012, 'USD-500': 44100000013,
  'USD-1000': 44100000014, 'USD-2500': 44100000015, 'USD-5000': 44100000016,
}
/** Custom amounts use a $1 variant multiplied by quantity, a common Shopify pattern. */
const GIFT_CARD_ONE_UNIT_VARIANT = 44100000099
```

`ShopifyCartItem` is `{ id: number; quantity: number; properties: Record<string, string> }`.

`toShopifyCartItem(line)` returns `null` for lines that are not gift cards. For gift-card lines it builds properties as follows:

| Condition | Properties |
|---|---|
| always | `_design`: the design name (or the raw id if unknown); `_delivery`: `Physical card, mailed` or `Digital, by email` |
| `!toSelf` and delivery `email` | `__shopify_send_gift_card_to_recipient: 'on'`, plus `Recipient email`, `Recipient name`, `Message`, `Send on` (each only if set) |
| `!toSelf` and delivery `physical` | `Recipient name`, `Card message` (each only if set) |
| `senderName` set | `_From` |

The returned item depends on the amount:
- If the key `` `${currency}-${amount}` `` matches a fixed variant (exactly the `DENOMINATIONS` amounts): `{ id: fixed, quantity: line.qty, properties }`.
- Otherwise: `{ id: 44100000099, quantity: amount × qty, properties: { ...properties, _amount: String(amount) } }`.

The only caller is `src/pages/Checkout.tsx` `placeOrder`, which runs `giftLines.map(toShopifyCartItem)` and then `console.info('[Shopify] gift card cart items', shopifyItems)`. `isGiftCardLine(line)` (`!!line.giftCard || getProduct(line.slug)?.slug === 'gift-card'`) is exported, but nothing calls it. Porting notes are in [shopify-integration.md](shopify-integration.md).

---

## 12. Importer matrix (outside the defining file)

| Export | Imported by |
|---|---|
| `Product` (type) | media, costing, lineDetails, ProductCard, RecentlyViewed, GiftFinder, CompleteTheLook, CraftStory, CartUpsell, Gallery, JewelryOverlay, TryOnButton, TryOnProvider, TryOnStudio, ProductFAQ, PriceBreakdown, Reviews, StickyBar, Personalizer |
| `Currency` | store, giftcards, costing, GiftCardArt |
| `Metal` | store, costing, Product, TryOnButton, TryOnProvider, TryOnStudio, PriceBreakdown |
| `Personalization` / `PersonalizationFont` | store, costing, Product, Personalizer, PriceBreakdown / Personalizer |
| `RentalBooking` / `RentalPeriodId` | store, Product, CompleteTheLook, RentalCalendar / RentalCalendar, PriceBreakdown |
| `CategorySlug`, `TryOnKind` | media, Category / JewelryOverlay, TryOnStudio |
| `MetalVariant`, `GiaSpec`, `Price`, `RentalRates`, `PersonalizationConfig`, `Category` (types) | nothing outside `catalog.ts` |
| `IMG` | media, HomeHero, Home, Atelier, Account, FourCs, MakingScroll, SocialGrid, VisitSalon, WatchSpotlight, TryOnFeature |
| `CATEGORIES` | Header, Footer, CategoryIndex |
| `PRODUCTS` | Wishlist, CartUpsell, GiftFinder, CompleteTheLook, Treasured, TryOnFeature, TryOnStudio |
| `METALS` | lineDetails, Product, PriceBreakdown, TryOnStudio |
| `RENTAL_DAYS`, `RENTAL_SLOTS`, `RENTAL_LEAD_DAYS` | RentalCalendar |
| `ShoppableVideo`, `ReviewMedia` | ShoppableVideos, VideoViewer / Reviews |
| `VIDEOS` | Home, Atelier |
| `GiftCardLine` / `GiftDelivery` / `IssuedCard` | store, GiftCards / GiftCards / Checkout, BalanceChecker |
| `DESIGNS` | GiftCards, GiftCardArt, lineDetails, shopify |
| `GIFT_CARD_SLUG`, `DENOMINATIONS`, `CUSTOM_RANGE` | GiftCards |
| `convert` | store, Checkout |
| `loadLedger` | Account |
| `lookupCard`, `issueCards`, `debitCards` | Checkout (also BalanceChecker for `lookupCard`) |
| `CostGroup`, `CostLine`, `buildCostBreakdown`, `splitTaxes` | PriceBreakdown |
| `hasCostBreakdown` | Product |
| `PROVINCES` / `US_STATES` | Cart, Checkout, PriceBreakdown / Checkout, PriceBreakdown |
| `lineDetails` | CartLineItem, Checkout |
| `toShopifyCartItem` | Checkout |
| **Never called anywhere** | `categoryName`, `isGiftCardLine` |
| **Types never imported elsewhere** (used only as annotations in their own module) | `CostBreakdown`, `GiftCardDesign`, `ShopifyCartItem` (plus the catalog types in the row above) |
| **Values used only inside their own module** | `toUSD`, `REVIEW_MEDIA`, `generateCode`, `normalizeCode`, `saveLedger` |

Function callers are listed in §5–§11.

---

## 13. Invariants

These follow from the code: breaking one causes a crash or wrong behaviour.

1. **Slugs are unique and stable.** `getProduct` returns the first match. Unknown slugs are dropped silently: priced at 0, not rendered, filtered out.
2. **`category` is in `CATEGORIES`.** `src/pages/Product.tsx` does `getCategory(product.category)!`.
3. **`images.length ≥ 1`.** `images[0]` is read without a guard in 13 files: ProductCard, CartLineItem, CartUpsell, Checkout, RecentlyViewed, CompleteTheLook, CraftStory, Gallery, StickyBar, WatchSpotlight, ShoppableVideos, VideoViewer and TryOnStudio.
4. **`metals[0]` is the intended default** for the PDP, quick-add flows (CompleteTheLook, CartUpsell, Wishlist, VideoViewer), TryOnStudio and costing.
5. **A product with `metals: []` must fail `hasCostBreakdown`.** Otherwise `buildCostBreakdown` throws.
6. **Rental products** have `category: 'rentals'` and a `rental`. ProductCard checks both; PriceBreakdown, RentalCalendar and CartLine pricing key off `rental`.
7. **`PersonalizationConfig.fonts` is non-empty.** The PDP default font is `fonts[0] ?? 'serif'`. `allowed` must be a valid RegExp character-class body: escape `-`, `\` and `]`.
8. **`GIFT_CARD_SLUG === 'gift-card'`** matches the `PRODUCTS` entry. The literal `'gift-card'` is also hardcoded in:
   - `src/store.tsx` `parseHash`, where `#/p/gift-card` routes to the gift-card page, so the gift-card product never renders a PDP
   - `src/components/cart/CartUpsell.tsx`
   - `src/pages/Wishlist.tsx`
   - `src/lib/shopify.ts`
9. **Every `VIDEOS[].products` slug exists.** Unknown slugs are filtered out without warning.
10. **`PROVINCES[x].rate` equals the sum of the percentages in its `label`.**
11. **Every `DENOMINATIONS` amount has a matching `GIFT_CARD_VARIANTS` key** `` `${currency}-${amount}` ``.
12. **Line amounts sum to the price.** `Σ CostLine.amount === base + accent` for every breakdown.
13. **Names (and, for try-on, descriptions) are behaviour.** Renaming a product can change:
    - its try-on kind
    - its review-media pool
    - costing findings and `hasCostBreakdown`
    - CartUpsell eligibility
    - JewelryOverlay stone rendering

---

## 14. Change checklists (guidance)

**Add a product**
1. Append it to `PRODUCTS` in `src/data/catalog.ts`, inside its category block. Array position is the featured order.
2. Choose an id `tns-<code>-NNN` with the next number, and a new unique ASCII kebab-case slug. Treat the slug as permanent.
3. Set `price: p(CAD)`. Use `p(CAD, USD)` only to pin USD.
4. Set `metals`, default first. Reuse `GOLDS` or `BRIDAL_METALS`, or spread them.
5. Use `images` from `IMG`; add an `IMG` key if needed.
6. Write `specs` in display order. To feed the cost model:
   - add `Weight: 'N g'`
   - put `ct` in stone values, under a recognized key (§8.3)
   - for watches, add `Movement`, and optionally `Strap` and `Case` (WatchSpotlight shows `Case`)
7. Add optional fields as needed: `gia`, a single `badges` entry, `engravable`, `leadTimeWeeks`, `personalization`, `rental: rental(weekend, week, month, deposit)` (CAD, together with category `rentals`).
8. Check what the name triggers in `tryOnKind`, `mediaPoolFor`, the costing findings and `hasCostBreakdown`. Watch for substrings such as "drop", "stud", "chain", "ring" and "band".
9. Optionally add the slug to a `VIDEOS[].products` entry in `src/data/media.ts`.
10. Check the cost breakdown for every metal in both currencies. Cheap items with heavy default weights can go negative before easing, and items without stones cannot be eased at all.
11. Run `npx tsc --noEmit -p .`.

**Add a category**
1. Add the slug to `CategorySlug`.
2. Add a `CATEGORIES` entry. Its position sets menu, footer and index order. The next `eyebrow` is `X`. Set `hero` and `feature` from `IMG`.
3. Pick a new 2-letter id code and add products.
4. Update the maps keyed by `string`, which fall back silently instead of failing type-checks:
   - `DEFAULT_WEIGHT`, `STONE_SHARE`, optionally `MAKING_SHARE` (`src/data/costing.ts`)
   - `PAIRS` in `src/components/pdp/CompleteTheLook.tsx` and in `src/components/cart/CartUpsell.tsx`
   - `OCCASIONS` in `src/components/home/GiftFinder.tsx`
5. Review the behaviours that depend on category:
   - `needsSize` and the CTA in `src/pages/Product.tsx`
   - `quickAddable` in CartUpsell, `needsConfig` in TryOnStudio and `configurable` in VideoViewer
   - the category branches in `tryOnKind` and `mediaPoolFor`
   - the Category page's special sections for `gifts` and `rentals`

**Add a metal**
1. Add it to the `Metal` union.
2. Add a `METALS` entry and a `METAL_RATE` entry in `src/data/costing.ts`. TypeScript enforces both, through `Record<Metal, …>`.
3. Add it to the relevant `metals` arrays.
4. Remember that the USD delta is `Math.round(delta × 0.73)`, not rounded to 5.
5. The `'vermeil'` literal in costing (+30 plating, `+ plating`) does not apply to new metals.

**Add a gift-card denomination or design**
- **Denomination:** add the amount to `DENOMINATIONS[currency]` and `` `${currency}-${amount}` `` to `GIFT_CARD_VARIANTS` in `src/lib/shopify.ts`. Without the variant it falls back to the $1-unit variant.
- **Design:** add `{ id, name, background, ink, accent }` to `DESIGNS`. The picker is a `grid-cols-4`.

**Add a province or change a tax rate**: keep `label` in the format `NAME N%` joined by ` + `, with `rate` equal to the sum.

**Change `CAD_TO_USD`**: every derived USD value moves, including product and rental prices, add-on prices, gift-card conversions and costing `fx`. Prices pinned with `p(CAD, USD)` (the gift card's 200) do not move.

---

## Notes & gotchas

Observations and risks. These are not prescriptive, apart from the recommendations noted inline.

1. **`getBookedDates` signed-shift bug.** `h >> (k * 5)` and `h >> (k * 3)` treat the unsigned hash as signed. 18 of 27 slugs (2 of 3 rentals) hash to `h ≥ 2³¹`, which produces negative offsets (bookings in the past) and zero or negative lengths (empty windows). `bridal-tiara-and-drops` has **no** booked dates. `chandelier-sapphire-earrings` has only 3 future booked days. Using `>>>` would restore the intended ranges, but it would also change every slug's demo calendar.
2. **Bookings slide with today**, and a booking stored in the cart is never re-validated. A date that was free when added can show as reserved on a later day.
3. **Three different USD rounding rules** (§5.2). With a metal delta, USD prices are not multiples of 5 (vermeil Plateau USD 1498, Mile End 1133, Griffintown 913, Initial Disc 203, Nameplate 623), while `toUSD(-400)` would give −290. Gift-card conversions use nearest-1 (250 CAD → 183 USD).
4. **The base price differs from the default-metal price for platinum-first products.** For `notre-dame-oval-solitaire`, `basilique-emerald-cut-three-stone`, `promesse-wedding-band` and `bespoke-engagement-commission`, every list surface calls `priceFor(p, currency)` with no metal and shows the gold base: ProductCard, category sorting, RecentlyViewed, CartUpsell, GiftFinder, video chips, CompleteTheLook totals. The PDP, TryOnStudio, CompleteTheLook's "add set" and Wishlist's "add all" use `metals[0]` = platinum instead, which costs +650 CAD / +475 USD. For example, Notre-Dame is listed at 18900 CAD but the PDP opens at 19550, and a CompleteTheLook set shows the base price but adds platinum lines.
5. **PDP tax can be $1 off cart and checkout tax.** `PriceBreakdown` rounds each component (`splitTaxes`), while Cart and Checkout round the combined rate. 82 product, metal and province combinations differ by $1, e.g. Mont-Royal 6850 CAD in BC: 823 vs 822; Mile End Huggies 1950 in QC: 293 vs 292.
6. **The tax data may be stale.** It is hardcoded under a "2024 rates" comment. Verify every rate before production. For example, NS appears at 14%, but to the best of my knowledge NS HST was 15% throughout 2024, so the comment and the data may not describe the same year. There are no territories (YT, NT, NU), and Manitoba's tax is labelled `PST`.
7. **Nameplate validation is loose and strict at once.**
   - `À-ÿ` admits `×` and `÷`.
   - A name made only of `-`, `'` or spaces passes, e.g. `--`.
   - The typographic apostrophe `’`, which iOS keyboards insert by default, is rejected even though the hint says apostrophes are allowed.
   - Characters outside Latin-1 (`Ł`) are rejected.
   - `Maximum 1 characters` is ungrammatical. The initial picker UI makes it unreachable.
8. **Copy and data contradictions.**
   - The gift-card product spec reads `Denominations: $250 – $10,000`, but `DENOMINATIONS` runs 100–5000 and `CUSTOM_RANGE` 50–10000 CAD / 50–7500 USD. The product's own price is `p(250, 200)`, not the conversion rule.
   - `Pearl Stud Gift Set`'s tagline says "Freshwater pearls", while its description and spec say Akoya.
   - The nameplate spec `Option: Diamond accent +$180` is CAD text shown in both currencies; the USD add-on is 130.
   - `describePersonalization` hardcodes `Diamond accent` instead of using `accent.label`.
   - Rental period labels exist in three variants: `lineDetails` (`Weekend rental` / `One-week rental` / `One-month rental`), CompleteTheLook (`Weekend` / `1 Week` / `1 Month`) and PriceBreakdown (`Weekend` / `One week` / `One month`).
   - The `'weekend' | 'week' | 'month'` union is declared four times: `RentalPeriodId`, `CartLine.rental`, the local `RentalPeriod` in Product.tsx, and `RentalPeriod` in CompleteTheLook.
9. **Cost-model quirks.**
   - Easing hides negative raw margins. Griffintown's diamond is cut from 792 to 147 CAD, and Pearl Stud's pearls from 119 to 40.
   - The "≥ 12%" floor can finish slightly under after rounding, e.g. pearl-stud USD 47 against a floor of 47.4.
   - `Vieux-Port` counts its diamonds twice: once as the GIA centre stone (1.0 ct) and again as `Total carat weight 1.00 ct (pair)`.
   - Platinum adds +650 CAD to the price, but its metal cost is lower than gold (48.6 vs ~82 CAD/g), so upgrading to platinum raises the displayed margin.
   - In the labour detail, `hours × rate` does not equal the labour amount, because hours are rounded and have a minimum of 2.
   - Rental breakdowns from `buildCostBreakdown` are computed but never shown.
10. **Ledger fragility.**
    - Until the demo card has been persisted, `loadLedger` returns the module-level `DEMO` object by reference. Debiting it then **mutates the constant**, and the reduced balance stays in memory for the session. It resurfaces if storage later reads empty or throws.
    - `saveLedger` has no try/catch; a storage quota or private-mode error would throw inside `placeOrder`.
    - `issuedAt` is a UTC date while every other date is local.
    - The demo code is duplicated in three places, and its `O` and `1` are characters `generateCode` can never produce.
    - The ledger lives in one browser only.
11. **Asymmetric custom range.** USD 7500 converts to 10274 CAD, above the CAD maximum of 10000.
12. **Rentals sort by retail price.** Category "price" sorting uses `priceFor` (the retail value) while rental cards show the weekend rate. The two orders currently agree.
13. **Name-substring classification is brittle.** Any name containing "ring" (e.g. "Spring", "String"), "drop", "stud" or "band" is reclassified. Keep table B in mind when naming products.
14. **Dead exports:** `categoryName` and `isGiftCardLine`. Exported but used only inside their module: `toUSD`, `REVIEW_MEDIA`, `generateCode`, `normalizeCode`, `saveLedger`.
15. **Shared array instances.** `GOLDS` and `BRIDAL_METALS` are shared by every product that references them without spreading. Mutating one product's `metals` would change the others.
16. **Image width.** Every Unsplash image requests `w=1600`, even for 40-pixel thumbnails. Every review and video asset is a hot-linked Mixkit placeholder.

---

## Related docs

- [Product overview, sitemap & user journeys](product-overview.md)
- [Architecture & runtime model](architecture.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](commerce-logic.md)
- [Shopify integration map & porting notes](shopify-integration.md)
- [Brand, voice & copywriting](brand-voice-and-copy.md)
- [Design system](design-system.md)
- [Code conventions](code-conventions.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Product detail page (PDP)](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Virtual try-on](features/virtual-try-on.md)
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Known issues, risks & tech debt](known-issues.md)
- [File index](INDEX.md)
