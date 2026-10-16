# Commerce logic — pricing, currency, cart lines, totals, tax & checkout math

All money in this prototype is computed client-side in whole CAD or USD units. The catalog in `src/data/catalog.ts` is the only price source. Cart lines store a configuration but never a price (a gift card's face value is the one exception), and `linePrice` in `src/store.tsx` reprices every line on each render in the active currency. Totals are built in four separate places: `useCartTotals` (drawer, reward bar, instalments), the Cart page summary (estimated Canadian tax), the Checkout page (tax, gift-card tender, total due) and the PDP's `PriceBreakdown` (an itemised cost model with tax split by component). There are no shipping fees, duties, discounts or real payments. Tax applies to CAD only and is rounded to whole dollars. Gift cards are not taxed, and they are redeemed against a ledger kept in localStorage.

Scope: `src/store.tsx`, `src/data/catalog.ts`, `src/data/giftcards.ts`, `src/data/tax.ts`, `src/data/costing.ts`, `src/components/cart/useCartTotals.ts`, `src/components/cart/RewardProgress.tsx`, `src/components/cart/CartUpsell.tsx`, `src/components/cart/CartLineItem.tsx`, `src/components/cart/GiftOptions.tsx`, `src/components/cart/UndoToast.tsx`, `src/components/lineDetails.ts`, `src/components/Price.tsx`, `src/components/CartDrawer.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/pages/GiftCards.tsx`, `src/pages/Product.tsx`, `src/components/pdp/PriceBreakdown.tsx`, `src/components/pdp/RentalCalendar.tsx`, `src/components/pdp/Personalizer.tsx`, `src/components/pdp/CompleteTheLook.tsx`, `src/components/pdp/StickyBar.tsx`, `src/lib/shopify.ts`. Add-to-bag call sites: `src/pages/Wishlist.tsx`, `src/components/tryon/TryOnStudio.tsx`, `src/components/video/VideoViewer.tsx`. Price displays: `src/components/ProductCard.tsx`, `src/components/RecentlyViewed.tsx`, `src/components/video/ShoppableVideos.tsx`, `src/components/home/GiftFinder.tsx`, `src/components/home/WatchSpotlight.tsx`, `src/pages/Category.tsx`, `src/components/Header.tsx`, `src/pages/Account.tsx`, `src/components/giftcard/BalanceChecker.tsx`, `src/components/giftcard/GiftCardArt.tsx`.

---

## 1. The money model at a glance

- **Units.** Every amount is a whole number of dollars. `formatPrice` prints with `maximumFractionDigits: 0`, and every derived figure is rounded with `Math.round`, which rounds .5 upwards, e.g. `Math.round(1712.5) === 1713`. Cents do not exist anywhere.
- **One global currency.** `currency: 'CAD' | 'USD'` lives in the store context, and every `<Price>` formats in it. Switching currency reprices the whole UI immediately.
- **Prices are derived, never stored.** `CartLine` has no price field. `linePrice(line)` calls `getProduct(line.slug)` each time it runs, so changes to the catalog reprice carts that are already persisted.
- **Worked numbers** in this document were computed on 2026-10-15 by re-running the exact expressions in Node 24 (IEEE-754 doubles). That includes the float quirks, e.g. `Number('9.975') / 100 === 0.09974999999999999`.

Which surface computes which figure:

| Figure | `CartDrawer` | `Cart` page | `Checkout` page | PDP (`Product` / `PriceBreakdown`) |
|---|---|---|---|---|
| Line price | `linePrice` (in `CartLineItem`) | `linePrice` | `linePrice` | `amount` (same formula, computed locally) |
| Merchandise / gift-card split | — | `merch`, `giftCards` from `useCartTotals` | own `merch`, `giftTotal` (does not use `useCartTotals`) | — |
| Tax | copy only: "Taxes calculated at checkout." | CAD: `Math.round(merch * rate[region])` | CAD: `Math.round(merch * rate[province])`; USD: 0 | CAD: sum of `splitTaxes` (each component rounded on its own) |
| Shipping | copy only | label "Complimentary" / "Digital delivery" | "Insured shipping · Complimentary" row | `insure` cost line (already inside the price) |
| Gift-card redemption | — | — | yes | — |
| Total | `subtotal` | `subtotal + (tax ?? 0)` | `merch + tax − cardsTotal + giftTotal` | `price + taxTotal` |
| Instalment | `Math.round(subtotal / 4)` | `Math.round(subtotal / 4)` | — | `Math.round(amount / 4)`, only when `amount >= 400` (not for rentals) |

---

## 2. Currency model

### 2.1 Selection and persistence

- The type is `Currency = 'CAD' | 'USD'` (`src/data/catalog.ts`).
- Initial state in `StoreProvider` is `useState<Currency>(() => (localStorage.getItem('tns-currency') as Currency) || 'CAD')`. CAD is the default. The stored value is cast without validation, and unlike the other keys this read is not wrapped in try/catch.
- `setCurrency(c)` updates state and runs `localStorage.setItem('tns-currency', c)`.
- There is no geo-detection. Gift-card lines are the only lines that carry their own currency.

| Switcher | Location | Copy | Side effects |
|---|---|---|---|
| Header toggle | `src/components/Header.tsx` (every page) | `CA · CAD` / `US · USD` inside `role="group" aria-label="Currency"` | `setCurrency` only |
| Preferred market | `src/pages/Account.tsx` (signed-in view) | "Preferred market" / "Sets currency, taxes and shipping options." / `Canada` · `United States` | `setCurrency` only |
| Shopping in | `src/pages/Checkout.tsx` | legend "Shopping in", buttons `Canada · CAD` / `United States · USD` | `setCurrency(c)` **and** re-converts the `available` amount of every applied gift card: `convert(x.card.balance, x.card.currency, c)` |

### 2.2 Every conversion path

`CAD_TO_USD = 0.73` is defined in `src/data/catalog.ts`, with the doc comment "CAD → USD conversion used for display rounding of derived prices."

| Path | Code (file · symbol) | Formula | Rounding | Used for |
|---|---|---|---|---|
| Catalog list price | `src/data/catalog.ts` · `p(CAD, USD?)` (module-private) | `{ CAD, USD: USD ?? Math.round((CAD * CAD_TO_USD) / 5) * 5 }` | nearest **$5**, computed once at module load | every `Product.price`, and every `RentalRates` field through `rental(weekend, week, month, deposit)` |
| Explicit USD | `p(250, 200)` on the `gift-card` product | USD passed in | none | the catalog gift-card product only (CAD 250 / USD 200) |
| Metal surcharge | `priceFor(product, currency, metal?)` | `base + (currency === 'CAD' ? delta : Math.round(delta * CAD_TO_USD))`, where `delta = METALS[metal].priceDeltaCAD` | nearest **$1** | PDP, cart lines, `TryOnStudio`, cost-model base |
| Personalization accent | `toUSD(cad)` through `personalizationPrice` | `Math.round((cad * CAD_TO_USD) / 5) * 5` | nearest **$5** | nameplate "Diamond accent" (CAD 180 → USD 130) |
| Gift cards | `src/data/giftcards.ts` · `convert(amount, from, to)` | same currency: `amount`; to USD: `Math.round(amount * CAD_TO_USD)`; to CAD: `Math.round(amount / CAD_TO_USD)` | nearest **$1**, both directions | gift-card `linePrice`, Checkout `Applied.available`, `debitCards` |
| Cost model | `src/data/costing.ts` · `fx = currency === 'CAD' ? 1 : CAD_TO_USD` | CAD rate constants × `fx`, then `Math.round` on each line | nearest $1 per line | `PriceBreakdown` statement lines |

Metal deltas (`METALS[*].priceDeltaCAD`): `18k-yellow`, `18k-white` and `18k-rose` are 0. `platinum` is +650 CAD, which becomes +475 USD (650 × 0.73 = 474.5 → 475). `vermeil` is −400 CAD, which becomes −292 USD.

```ts
// src/data/catalog.ts
const p = (CAD: number, USD?: number): Price => ({ CAD, USD: USD ?? Math.round((CAD * CAD_TO_USD) / 5) * 5 })
export function priceFor(product: Product, currency: Currency, metal?: Metal): number {
  const base = product.price[currency]
  if (!metal) return base
  const delta = METALS[metal].priceDeltaCAD
  return base + (currency === 'CAD' ? delta : Math.round(delta * CAD_TO_USD))
}
export const toUSD = (cad: number) => Math.round((cad * CAD_TO_USD) / 5) * 5
// src/data/giftcards.ts
export const convert = (amount: number, from: Currency, to: Currency) =>
  from === to ? amount : to === 'USD' ? Math.round(amount * CAD_TO_USD) : Math.round(amount / CAD_TO_USD)
```

### 2.3 Per-currency figures that are fixed, not converted

| Constant | Location | CAD | USD |
|---|---|---|---|
| `REWARD_THRESHOLD` | `src/components/cart/useCartTotals.ts` | 1000 | 750 |
| `DENOMINATIONS` | `src/data/giftcards.ts` | 100, 250, 500, 1000, 2500, 5000 | the same numbers |
| `CUSTOM_RANGE` | `src/data/giftcards.ts` | [50, 10000] | [50, 7500] |
| Gift-card variant IDs | `src/lib/shopify.ts` · `GIFT_CARD_VARIANTS` | `CAD-100`…`CAD-5000` → 44100000001–06 | `USD-100`…`USD-5000` → 44100000011–16 |
| PDP instalment threshold | `src/pages/Product.tsx` | `amount >= 400` | same |
| Gift-finder budgets | `src/components/home/GiftFinder.tsx` · `BUDGETS` | `n < 1000`, `1000–4999`, `5000–14999`, `>= 15000` | same numbers, applied to `priceFor(p, currency)` |

### 2.4 Where the paths disagree (computed facts)

- **CAD 250 in USD has three answers:** `convert(250,'CAD','USD')` gives **183**, `toUSD(250)` (the `p()` rule) gives **185**, and the catalog `gift-card` product says **200**.
- **`convert` round trips drift:** CAD 250 → USD 183 → CAD 251, while USD 250 → CAD 342 → USD 250.
- **Metal-variant USD prices** are `round5(CAD base × 0.73) + round1(delta × 0.73)`, not `round5((CAD base + delta) × 0.73)`. For every **platinum** variant in the current catalog the two methods happen to agree, because +475 is itself a multiple of 5. Every **vermeil** variant lands off the $5 grid. For example, Plateau Paperclip Chain in vermeil is 1,790 − 292 = **1,498 USD**, while `p(2050)` would give 1,495.
- **Listing vs PDP price.** Every listing surface calls `priceFor(p, currency)` **without a metal**, so it shows the base price. The PDP starts on `metals[0]`, which is `platinum` for `BRIDAL_METALS` products. Section 2.6 shows the affected rows.

### 2.5 Formatting

```ts
// src/data/catalog.ts
export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'CAD' ? 'en-CA' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

- Node 24 output: `formatPrice(6850,'CAD')` → `$6,850` and `formatPrice(5000,'USD')` → `$5,000`. Both currencies print a bare `$`, so the ISO code that `Price` appends is what tells them apart. A new `Intl.NumberFormat` is built on every call.
- `src/components/Price.tsx` takes `{ amount: number; className?: string }`. It has **no currency prop** and always uses the store currency.

```tsx
<span className={`font-spec ${className}`}>
  {formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span>
</span>
```

- Class recipes used with `Price`:
  - `[&_span]:hidden` hides the ISO code. It is used for "each" unit prices, the strike-through, drawer and cart instalments, the reward "remaining" figure, breakdown rows and applied gift cards.
  - `[&_span]:text-white/50` is used on dark CTAs (PDP button, gift-card button).
  - `[&_span]:text-white/60` is used on the selected rental period button.
  - `[&_span]:text-xl` is used on the breakdown composition figure.
- Components that may need a currency other than the active one bypass `Price` and call `formatPrice(x, explicitCurrency)` directly:
  - `GiftCardArt` (`{amount ? formatPrice(amount, currency) : '—'}` plus a small code span). Its `currency` prop is the card's own currency in the bag, checkout, confirmation and Account wallet, and the active currency in the gift-card builder, the hero and the Category gifts banner.
  - `BalanceChecker` (`{formatPrice(balance, currency)} {currency} remaining on {maskCode}`, then ` · originally …` and ` · never expires`)
  - the Account wallet (`{maskCode} · {formatPrice(balance, currency)} left`)
- `toLocaleString('en-CA')` formats the gift-card custom-amount placeholder (`Custom amount, 50–10,000`) and the rental breakdown's `retail value 92,000`, which has no currency symbol.

### 2.6 Computed price matrix (whole units; CAD / USD)

"PDP default" is the price the PDP shows on load (`metals[0]`). Listing surfaces show the "Base" column.

| Slug | Category | Metals (`metals[0]` first) | Base CAD / USD | Non-zero metal variants | PDP default | Flags (configuration / cost model) |
|---|---|---|---|---|---|---|
| `mont-royal-solitaire-pendant` | necklaces | GOLDS | 6,850 / 5,000 | — | = base | GIA |
| `riviere-saint-laurent` | necklaces | 18k-white, platinum | 38,500 / 28,105 | platinum 39,150 / 28,580 | = base | |
| `plateau-paperclip-chain` | necklaces | GOLDS, vermeil | 2,450 / 1,790 | vermeil 2,050 / 1,498 | = base | engravable |
| `vieux-port-diamond-studs` | earrings | GOLDS, platinum | 8,900 / 6,495 | platinum 9,550 / 6,970 | = base | GIA |
| `outremont-pearl-drops` | earrings | 18k-yellow, 18k-white | 4,200 / 3,065 | — | = base | |
| `mile-end-huggies` | earrings | GOLDS, vermeil | 1,950 / 1,425 | vermeil 1,550 / 1,133 | = base | |
| `westmount-tennis-bracelet` | bracelets | 18k-white, 18k-yellow, platinum | 14,500 / 10,585 | platinum 15,150 / 11,060 | = base | |
| `atwater-cuff` | bracelets | GOLDS | 5,600 / 4,090 | — | = base | engravable |
| `griffintown-chain-bracelet` | bracelets | GOLDS, vermeil | 1,650 / 1,205 | vermeil 1,250 / 913 | = base | engravable |
| `teresa-signet` | rings | GOLDS | 3,200 / 2,335 | — | = base | size; monogram; reverse engraving |
| `sherbrooke-emerald-cocktail` | rings | 18k-yellow, platinum | 21,800 / 15,915 | platinum 22,450 / 16,390 | = base | size |
| `laurier-stacking-band` | rings | GOLDS, platinum | 1,350 / 985 | platinum 2,000 / 1,460 | = base | size |
| `notre-dame-oval-solitaire` | bridal | BRIDAL (platinum first) | 18,900 / 13,795 | platinum 19,550 / 14,270 | **19,550 / 14,270** | size; engravable; GIA |
| `basilique-emerald-cut-three-stone` | bridal | BRIDAL | 26,400 / 19,270 | platinum 27,050 / 19,745 | **27,050 / 19,745** | size; engravable; GIA |
| `promesse-wedding-band` | bridal | BRIDAL | 1,450 / 1,060 | platinum 2,100 / 1,535 | **2,100 / 1,535** | size; engravable |
| `heritage-automatic-38` | watches | 18k-yellow, 18k-white | 7,400 / 5,400 | — | = base | engravable |
| `chronographe-1962` | watches | 18k-rose, 18k-yellow | 12,900 / 9,415 | — | = base | |
| `dame-du-lac` | watches | 18k-white, 18k-rose | 9,600 / 7,010 | — | = base | |
| `initial-disc-pendant` | gifts | GOLDS, vermeil | 680 / 495 | vermeil 280 / 203 | = base | initial; reverse engraving |
| `pearl-stud-gift-set` | gifts | 18k-yellow, 18k-white | 540 / 395 | — | = base | |
| `gift-card` | gifts | `[]` | 250 / 200 (explicit) | — | n/a (`#/p/gift-card` routes to the gift-card page) | |
| `bespoke-engagement-commission` | custom | BRIDAL | 5,000 / 3,650 | platinum 5,650 / 4,125 | **5,650 / 4,125** | engravable; "Price shown is a starting deposit." |
| `heirloom-redesign` | custom | GOLDS, platinum | 1,800 / 1,315 | platinum 2,450 / 1,790 | = base | |
| `engraved-nameplate-necklace` | custom | GOLDS, vermeil | 1,250 / 915 | vermeil 850 / 623 | = base | nameplate; accent +180 CAD / +130 USD |

Rental products. Rates come from `rental(...)`, and `price` holds the retail value, which is not sold.

| Slug | Retail `price` | Weekend | Week | Month | Deposit |
|---|---|---|---|---|---|
| `gala-diamond-collar` | 92,000 / 67,160 | 650 / 475 | 1,400 / 1,020 | 3,900 / 2,845 | 5,000 / 3,650 |
| `chandelier-sapphire-earrings` | 34,000 / 24,820 | 320 / 235 | 720 / 525 | 1,900 / 1,385 | 2,500 / 1,825 |
| `bridal-tiara-and-drops` | 48,000 / 35,040 | 480 / 350 | 1,100 / 805 | 2,800 / 2,045 | 3,500 / 2,555 |

Every price display and what it shows:

| Surface | Amount |
|---|---|
| `ProductCard` | rentals (`category === 'rentals' && product.rental`): "From" + `rental.weekend[currency]`; otherwise `priceFor(product, currency)` |
| `RecentlyViewedStrip`, `ShoppableVideos` tile, `VideoViewer` | `p.rental ? p.rental.weekend[currency] : priceFor(p, currency)` |
| `TryOnStudio` side panel | `product.rental ? weekend : priceFor(product, currency, metal)` (the metal selected in the studio) |
| `CartUpsell`, `WatchSpotlight` | `priceFor(p, currency)` |
| `CompleteTheLook` | rental ensemble: `p.rental[period][currency]`; otherwise `priceFor(p, currency)` |
| `Category` sort ("Price, low to high" / "high to low") | `priceFor(a, currency)`; rentals sort by retail `price` |
| `GiftFinder` budget filter | `priceFor(p, currency)`; rentals and custom are excluded |
| PDP and `StickyBar` | `amount` (section 10) |

---

## 3. Cart lines

### 3.1 Shape (`src/store.tsx`)

```ts
export interface CartLine {
  key: string
  slug: string
  metal?: Metal
  rental?: 'weekend' | 'week' | 'month'
  engraving?: string
  size?: string
  booking?: RentalBooking
  personalization?: Personalization
  giftCard?: GiftCardLine
  qty: number
}
```

Field types:

- `RentalBooking = { start: string /* yyyy-mm-dd */; slot: string; method: 'courier' | 'salon' }`
- `Personalization = { text: string; font: 'script' | 'serif' | 'block'; accent?: boolean; chainLength?: string }`
- `GiftCardLine = { amount; currency; design; delivery: 'email' | 'physical'; toSelf; recipientName?; recipientEmail?; senderName?; message?; sendOn? }`

All three are in `src/data/catalog.ts` and `src/data/giftcards.ts`.

### 3.2 Line taxonomy

| Line type | Fields that identify it | Created by (see 3.3) | Effect on price |
|---|---|---|---|
| Standard / metal variant | `slug`, `metal` | #1, #2, #4, #5, #7, #8 | `priceFor(product, currency, metal)` |
| Sized | adds `size`: one of `'4','4.5',…,'9'` (`RING_SIZES` in `src/components/pdp/RingSize.tsx`) | #1 only, when `needsSize` (`product.category === 'rings' \|\| product.category === 'bridal'`) | none ("One complimentary resize within the first year.") |
| Engraved | adds `engraving`: trimmed, input `maxLength={18}` | #1 only, when `showEngraving` | none (labelled "complimentary"; the cost model shows "Engraving · Included") |
| Personalized | adds `personalization`: `{ ...personal, text: personal.text.trim() }` | #1 only, when `product.personalization` exists | `+ personalizationPrice(...)`, i.e. the accent only |
| Rental | `rental` (period) + `booking`; `metal` is `undefined` | #1 and #3 | `product.rental[period][currency]`; the deposit is **not** included |
| Gift card | `slug: 'gift-card'`, `giftCard` | #6 | `convert(giftCard.amount, giftCard.currency, currency)` |

`showEngraving = !!product.engravable && !rental && (!pcfg || !!pcfg.backEngraving)`.

- With no personalization the label is "Engraving — complimentary".
- For the personalized pieces with `backEngraving` (`teresa-signet`, `initial-disc-pendant`) it becomes "Reverse engraving — optional".
- `engraved-nameplate-necklace` has no `backEngraving`, so it gets no engraving field at all.

### 3.3 Every `addToCart` call site

`addToCart(line: Omit<CartLine, 'key' | 'qty'>)` computes `lineKey(line)`. If a line with that key exists it increments `qty` by 1; otherwise it appends `{ ...line, key, qty: 1 }`. Either way it calls `setCartOpen(true)`, which opens the drawer.

| # | File · symbol | Trigger (UI copy) | Payload | Guards |
|---|---|---|---|---|
| 1 | `src/pages/Product.tsx` · `handleAdd`, through `onCta` and `StickyBar`'s `onAction` | primary CTA `Add to bag` / `Reserve this piece` (rentals) / `Begin commission` (category `custom`) | `configured` = `{ slug, metal: rental ? undefined : metal, rental: rental ? period : undefined, engraving: engraving.trim() \|\| undefined, size: needsSize ? size : undefined, booking: rental ? (booking as RentalBooking) : undefined, personalization: pcfg ? { ...personal, text: personal.text.trim() } : undefined }` | `isBookingValid(slug, period, booking)` for rentals, `validatePersonalization(pcfg, personal.text) === null`, and a size for rings/bridal. On failure it scrolls to `step-dates`, `step-personal` or `step-size` (Lenis `offset: -140`). When the config is already in the bag (`inBag`) the CTA becomes **Go to bag** and opens the drawer instead of adding. |
| 2 | `src/components/pdp/CompleteTheLook.tsx` · `addSet` (non-rental) | `Add the set to bag` | `{ slug: p.slug, metal: p.metals[0] }` for each item of `[product, ...pieces]` | none: no size, personalization or selected-metal check |
| 3 | same · `addSet` (rental product) | `Reserve the ensemble` | `{ slug: p.slug, rental: period, booking: booking as RentalBooking }` for each item of `[product, ...pieces]` | if the main booking is invalid → `onNeedBooking()` (the PDP's `handleAdd`, which scrolls to the dates). If any piece is busy → `` `${busy.name} is reserved on these dates. Try another start date, or reserve pieces individually.` `` |
| 4 | `src/components/cart/CartUpsell.tsx` (quick-add button) | `+` icon (rail) / `Quick add` → `Added` (grid) | `{ slug: p.slug, metal: p.metals[0] }` | only rendered when `quickAddable(p)` |
| 5 | `src/pages/Wishlist.tsx` | `Add all to bag` | `{ slug: p.slug, metal: p.metals[0] }` for each item | filter `p.category !== 'rentals' && !p.personalization && p.slug !== 'gift-card'`. Rings, bridal and custom pass, without a size. |
| 6 | `src/pages/GiftCards.tsx` · `submit` | `Add to bag — {Price}` → `Added to bag` (2400 ms) | `{ slug: GIFT_CARD_SLUG /* 'gift-card' */, giftCard: line }`, called **`qty` times** in a loop | amount range, recipient name and email (section 8.6) |
| 7 | `src/components/tryon/TryOnStudio.tsx` · `add` | `Add to bag` → `Added to bag` | `{ slug: product.slug, metal }` (the metal chosen in the studio) | rendered only when `!needsConfig`, where `needsConfig = rental \|\| personalization \|\| rings \|\| bridal \|\| custom` |
| 8 | `src/components/video/VideoViewer.tsx` (desktop side panel) | `Add to bag` → `Added` | `{ slug: p.slug, metal: p.metals[0] }` | rendered only when not `configurable`, where `configurable = rental \|\| personalization \|\| rings \|\| bridal` |

`quickAddable(p)` (CartUpsell) is `!p.rental && !p.personalization && p.metals.length > 0 && p.category !== 'rings' && p.category !== 'bridal' && p.category !== 'custom'`.

Personalization defaults on the PDP:

- `text: ''`
- `font: pcfg.fonts[0]`: `serif` for signet and initial disc, `script` for nameplate
- `chainLength: chainLengths?.[1] ?? chainLengths?.[0]`: `'18 in'` for disc and nameplate, `undefined` for the signet
- `accent` is absent until the checkbox is toggled

Validation messages come from `validatePersonalization`: `Please enter a letter`, `Please enter at least ${min} characters`, `Maximum ${max} characters` and `Some characters cannot be engraved`.

### 3.4 Identity: `lineKey` and stacking

```ts
export const lineKey = (line: Omit<CartLine, 'key' | 'qty'>) =>
  [line.slug, line.metal, line.rental, line.engraving, line.size, JSON.stringify(line.booking ?? ''), JSON.stringify(line.personalization ?? ''), JSON.stringify(line.giftCard ?? '')].join('|')
```

`Array.join` turns `undefined` into an empty string, and `JSON.stringify('')` gives `""`. These keys were generated by running the function:

```text
mont-royal-solitaire-pendant|18k-yellow||||""|""|""
teresa-signet|18k-yellow||J & M|7|""|{"text":"TMS","font":"serif"}|""
engraved-nameplate-necklace|18k-yellow||||""|{"text":"Sofia","font":"script","chainLength":"18 in","accent":true}|""
gala-diamond-collar||weekend|||{"method":"courier","start":"2026-10-19","slot":"09:00 – 11:00"}|""|""
gift-card|||||""|""|{"amount":250,"currency":"USD","design":"travertine","delivery":"email","toSelf":false,"recipientName":"Ana","recipientEmail":"ana@example.com"}
```

- Two adds stack (`qty + 1`) only when every component matches. Quantity and price play no part in identity.
- `JSON.stringify` drops `undefined` properties, so `chainLength: undefined` disappears. It is sensitive to key **order** and to an explicit `accent: false`: `{…,"accent":false}` does not match an otherwise identical object that never toggled the accent.
- `key` is stored on the line when it is created and is never recomputed, even after a reload from `tns-cart`.
- `Product.tsx` uses the same function for the **Go to bag** state: `inBag = cart.some((l) => l.key === lineKey(configured))`.

### 3.5 Quantity semantics

| Action | Code | Result |
|---|---|---|
| Any add | `addToCart` | +1 on a matching line, otherwise a new line with `qty: 1`. There is no upper limit. |
| Stepper − | `CartLineItem` | `line.qty <= 1 ? removeLine(key) : updateQty(key, qty - 1)`. Removal can be undone. |
| Stepper + | `CartLineItem` | `updateQty(key, Math.min(10, line.qty + 1))`. This caps at 10, and if `qty > 10` already, pressing + **lowers** it to 10. |
| `updateQty(key, qty)` | `src/store.tsx` | `qty <= 0` filters the line out (no undo record); otherwise it sets `qty`. |
| Gift-card builder | `src/pages/GiftCards.tsx` | a page-level qty of 1–20 (`Math.max(1, q - 1)` / `Math.min(20, q + 1)`); submit calls `addToCart` `qty` times on the same line, so the line ends at `qty` (plus any existing qty) |
| `count` | store and `useCartTotals` | `Σ qty` over all lines, including gift cards. Shown on the Header badge, the drawer heading `Your Bag (n)` and the Cart page as `{count} piece/pieces`. |

- **Gift-card amounts vs qty.** `giftCard.amount` is the value of **one** card, a whole number in `giftCard.currency`. `linePrice` multiplies the converted amount by `qty`.
- In the Shopify mapping (`toShopifyCartItem`), a denomination listed in `GIFT_CARD_VARIANTS` becomes `{ id, quantity: line.qty }`.
- Any other ("custom") amount becomes the $1 variant `{ id: 44100000099, quantity: g.amount * line.qty, properties: { …, _amount: String(g.amount) } }`.
- On order placement `issueCards` creates one ledger card per unit of `qty`.

### 3.6 Removal, undo, clear

- **`removeLine(key)`**: inside the `setCart` updater it records `setLastRemoved({ line, index })`, then filters the line out. Callers are the line's `X`, the stepper − at qty 1, and **Save for later**, which first adds the slug to the wishlist when it is not already wished.
- **`undoRemove()`** puts `r.line` back at `r.index` unless a line with the same key already exists, then clears `lastRemoved`. Context exposes `lastRemoved` as `CartLine | null`.
- **`UndoToast`** shows `Removed {product name}` and `Undo` for 6000 ms after `lastRemoved` changes. It is rendered in the drawer (sticky) and on the Cart page.
- **`clearCart()`** runs `setCart([])`, `setMetaState(DEFAULT_META)` and `setLastRemoved(null)`. The Cart page's **Clear bag** asks `window.confirm('Remove everything from your bag?')` first, and Checkout calls `clearCart()` after placing an order.

### 3.7 How lines are described

`lineDetails(line, product)` in `src/components/lineDetails.ts` is shared by `CartLineItem` and the Checkout summary.

- **Gift card:**
  - `` `${design name} design · ${'Digital' | 'Physical card'}` ``
  - then `For me` or `` `To ${recipientName}${email ? ` · ${email}` : ''}` ``
  - `` `Sends ${formatDay(parseIso(sendOn))}` `` when `sendOn` is set
  - `` `“${message}”` ``, cut to 40 characters plus `…`
- **Other lines:**
  - `RENTAL_LABEL[rental]` (`Weekend rental` / `One-week rental` / `One-month rental`), or else `METALS[metal].label`
  - `` `Size ${size}` ``
  - for rentals, `` `${formatDay(start)} → ${formatDay(rentalReturnDate(start, rental))}` `` and `` `${'Salon fitting' | 'Courier'} · ${slot}` ``
  - `describePersonalization(p)`, which is `` [`“${text.trim()}”`, 'Script'|'Serif'|'Block', chainLength, accent && 'Diamond accent'].filter(Boolean).join(' · ') ``
  - `` `${product.personalization ? 'Reverse' : 'Engraving'}: “${engraving}”` ``
  - and if none of the above apply, `product.collection`

The `CartLineItem` price column:

- `<Price amount={linePrice(line)}>`.
- When `qty > 1`, a `{unit} each` line where `unit = linePrice(line) / line.qty`.
- A strike-through `fullPrice` that renders only when `fullPrice !== unit`. Because `fullPrice` uses the same formula as `linePrice` (and is `unit` for gift cards and rentals), it never renders today.
- Eyebrow: `Rental` / `Gift card` / `p.collection`.
- **Edit** links to `#/gift-cards` for gift cards and to the PDP otherwise. The configuration is not restored.

In the Checkout summary each line shows `{lineDetails(l, p).join(' · ')} · ×{l.qty}` and `<Price amount={linePrice(l)} />`.

---

## 4. Line pricing — `linePrice`

```ts
// src/store.tsx
  const linePrice = useCallback(
    (line: CartLine) => {
      const product = getProduct(line.slug)
      if (line.giftCard) return convert(line.giftCard.amount, line.giftCard.currency, currency) * line.qty
      if (!product) return 0
      if (line.rental && product.rental) return product.rental[line.rental][currency] * line.qty
      return (priceFor(product, currency, line.metal) + personalizationPrice(product, line.personalization, currency)) * line.qty
    },
    [currency],
  )
```

| Line type | Unit price | Notes |
|---|---|---|
| Gift card | `convert(amount, giftCard.currency, currency)` | the face value is exact in its own currency and rounded to $1 in the other |
| Unknown slug, not a gift card | 0 | the line is not rendered by `CartLineItem` or Checkout, but its `qty` still counts |
| Rental | `product.rental[period][currency]` | **deposit excluded**; `metal` is ignored |
| Everything else | `priceFor(product, currency, metal) + personalizationPrice(product, personalization, currency)` | size and engraving are free |

**Personalization accent pricing.**

- `personalizationPrice(product, p, currency)` returns 0 unless `p?.accent` is truthy **and** `product.personalization?.accent` exists. Otherwise it returns `accent.priceCAD` in CAD or `toUSD(accent.priceCAD)` in USD.
- Only `engraved-nameplate-necklace` has an accent: `{ label: 'Diamond accent', priceCAD: 180 }`, which is 180 CAD or 130 USD.
- The Personalizer row shows `+ <Price …/>` with the ISO code visible.
- The same function feeds the PDP `amount`, `CartLineItem.fullPrice` and `buildCostBreakdown` (as an `options` line).

**Rental deposit treatment.** `RentalRates.deposit` (the doc comment says "Refundable security deposit") is never charged, never added to any total and never sent to the Shopify mapping. It is shown only in these places:

1. The PDP price block: `Refundable deposit <Price> · insurance included · What the fee covers`.
2. The `PriceBreakdown` rental row "Refundable security deposit", with the note "Card pre-authorisation · released within 48 h of return" and the footnote "Tax applies to the rental fee only. The deposit is a hold, not a charge.". The row is not added to the grand total.
3. `CompleteTheLook` for rentals: `Refundable deposit <Price amount={Σ deposits} />. One fitting, one insured delivery, collected together.`

It does not appear in the cart, the drawer, the Cart page or Checkout.

---

## 5. Totals

### 5.1 `useCartTotals` (`src/components/cart/useCartTotals.ts`)

```ts
export const REWARD_THRESHOLD = { CAD: 1000, USD: 750 } as const
// inside the hook:
const merch = cart.filter((l) => !l.giftCard).reduce((s, l) => s + linePrice(l), 0)
const giftCards = cart.filter((l) => l.giftCard).reduce((s, l) => s + linePrice(l), 0)
const subtotal = merch + giftCards
```

| Output | Formula | Consumers |
|---|---|---|
| `merch` | Σ `linePrice` of non-gift-card lines (**rentals included**) | Cart page |
| `giftCards` | Σ `linePrice` of gift-card lines | Cart page |
| `subtotal` | `merch + giftCards` (equals the store's `subtotal`, which nothing reads directly) | drawer, Cart page |
| `count` | Σ `qty` | drawer, Cart page |
| `threshold` | `REWARD_THRESHOLD[currency]` | no consumer |
| `rewardProgress` | `Math.min(1, merch / threshold)` | `RewardProgress` |
| `rewardRemaining` | `Math.max(0, threshold - merch)` | `RewardProgress` |
| `rewardUnlocked` | `merch >= threshold` | `RewardProgress`, Cart page |
| `installment` | `Math.round(subtotal / 4)` (pre-tax, gift cards included) | drawer, Cart page |
| `hasMerch` | `cart.some((l) => !l.giftCard)` | drawer, Cart page, `RewardProgress` |
| `hasRental` | `cart.some((l) => l.rental)` | Cart page |

The hook does **not** compute shipping, tax, duties, discounts, gift-card redemption or deposits. Where those live is covered in sections 6–8.

### 5.2 Totals per surface

**Drawer** (`src/components/CartDrawer.tsx`, footer only when the cart is non-empty):

- `Subtotal` + `<Price amount={subtotal} />`
- `` `${shipping}. Taxes calculated at checkout.` `` plus ` Gift wrapped.` when `meta.giftWrap`. `shipping` is `Complimentary insured shipping across Canada` (CAD) or `Complimentary insured shipping to the U.S., duties included` (USD).
- `Or 4 interest-free payments of {installment} with Shop Pay`
- `Secure checkout` → `#/checkout`, `View full bag` → `#/cart`
- `Fully insured` · `30-day returns`
- `RewardProgress` appears in the header when `hasMerch`.

**Cart page** (`src/pages/Cart.tsx`):

```ts
const [region, setRegion] = useState('QC')
const tax = currency === 'CAD' ? Math.round(merch * (PROVINCES[region]?.rate ?? 0)) : null
const total = subtotal + (tax ?? 0)
const onlyGiftCards = cart.length > 0 && !hasMerch
```

Summary rows, in render order:

1. `RewardProgress` when `hasMerch`.
2. `Jewellery` = `merch` when `hasMerch`.
3. `Gift cards` = `giftCards` when greater than 0.
4. `Shipping` = `Digital delivery` when `onlyGiftCards`, else `Complimentary`.
5. `Gift wrapping` = `Complimentary` when `meta.giftWrap`.
6. `Jewellery care kit` = `Included` when `rewardUnlocked`.
7. When `hasMerch` and CAD: `Est. tax` with a province `<select aria-label="Province">` (default `QC`) and `<Price amount={tax ?? 0} />`.
8. When `hasMerch` and USD: `Tax` = `Calculated at checkout`.
9. `Gift cards are not taxed.` when `giftCards > 0`.
10. Total label: `Estimated total` when `tax !== null && hasMerch`, else `Subtotal`, with `<Price amount={total} />`.
11. `Or 4 interest-free payments of {installment} with Shop Pay`.
12. When `hasMerch && !hasRental`: `Order today, arrives by {deliveryDate(4)}`. This is four business days skipping Saturday and Sunday, formatted `toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric' })`; on 2026-10-15 Node 24 gives `Wed, October 21`.
13. `Secure checkout` and `Gift cards and promo codes can be applied at checkout.`

**Checkout**: see section 8.2.

### 5.3 `RewardProgress` (`src/components/cart/RewardProgress.tsx`)

- Returns `null` when `!hasMerch`, so a cart holding only gift cards shows no bar. Rental fees count toward the threshold.
- Unlocked copy: `Unlocked:` (espresso) followed by ` a complimentary jewellery care kit is included with your order.`
- Locked copy: `<Price amount={rewardRemaining} className="… [&_span]:hidden" />` followed by ` away from a complimentary jewellery care kit.`
- The bar is `h-[2px]` on `bg-[var(--border-hairline)]`. Its fill is `bg-[var(--gold-vermeil)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]` with `width: rewardProgress * 100%`.
- The care kit has no cart line, SKU or price. Only the Cart page row `Jewellery care kit · Included` and this message mention it; Checkout does not.

### 5.4 Instalments ("Shop Pay")

- **Drawer / Cart page:** `Math.round(subtotal / 4)`, always shown, pre-tax, gift cards included, ISO code hidden.
- **PDP (non-rental only):** `{amount >= 400 && <>Or 4 interest-free payments of <Price amount={Math.round(amount / 4)} …/> with Shop Pay · </>}`, with the ISO code visible. In the current catalog only `pearl-stud-gift-set` in USD (395) falls below 400.

### 5.5 Upsell selection — `CartUpsell`

Rendered in the drawer as `layout="rail"` with the default `limit = 3`, and on the Cart page as `layout="grid" limit={4}`, only when the cart is non-empty. The header copy is `Pairs beautifully with`.

1. `inCart` is the set of cart slugs.
2. `cats` is the de-duplicated `PAIRS[category of each line's product]`, where `PAIRS` is:
   - `necklaces → earrings, bracelets`
   - `earrings → necklaces, rings`
   - `bracelets → rings, earrings`
   - `rings → bracelets, earrings`
   - `bridal → earrings, bracelets`
   - `watches → bracelets, rings`
   - `gifts → earrings, necklaces`
   - `custom → earrings`
   - `rentals → earrings`

   A gift-card line resolves to category `gifts`.
3. `pool` is every product not in the cart, not `gift-card`, and whose name does not match `/commission|redesign/i`.
4. `paired` is the pool filtered to `cats`, in catalog order; `fallback` is the pool filtered to `badges?.includes('Bestseller')`.
5. The candidates are `[...new Set([...paired, ...fallback])]`, sorted with `quickAddable` items first (a stable sort, so catalog order is kept within each group), then `.slice(0, limit)`.
6. Quick-addable items get a `+` / `Quick add` button that adds `{ slug, metal: metals[0] }`. Every other item gets an `Options` link to the PDP. The displayed price is `priceFor(p, currency)`.

Example: with only the Mont-Royal pendant in the cart, the rail shows Vieux-Port Diamond Studs, Outremont Pearl Drops and Mile End Huggies. The grid adds Westmount Tennis Bracelet. With only a gift card in the cart, it shows Mont-Royal, Rivière Saint-Laurent and Plateau Paperclip Chain.

---

## 6. Tax

### 6.1 `src/data/tax.ts`

The header comment reads "Canadian sales tax by province (GST/HST + PST/QST), 2024 rates."

| Key | `name` | `rate` | `label` |
|---|---|---|---|
| QC | Québec | 0.14975 | GST 5% + QST 9.975% |
| ON | Ontario | 0.13 | HST 13% |
| BC | British Columbia | 0.12 | GST 5% + PST 7% |
| AB | Alberta | 0.05 | GST 5% |
| MB | Manitoba | 0.12 | GST 5% + PST 7% |
| SK | Saskatchewan | 0.11 | GST 5% + PST 6% |
| NS | Nova Scotia | 0.14 | HST 14% |
| NB | New Brunswick | 0.15 | HST 15% |
| NL | Newfoundland & Labrador | 0.15 | HST 15% |
| PE | Prince Edward Island | 0.15 | HST 15% |

There are no territories (YT, NT, NU). `US_STATES = ['New York', 'California', 'Florida', 'Illinois', 'Massachusetts', 'Texas', 'Vermont', 'Washington', 'Other']` has no rates and is used only for display.

### 6.2 Where tax is applied

| Surface | Base | Formula | Region state | Default | USD behaviour |
|---|---|---|---|---|---|
| Cart page | `merch` (rentals in, gift cards out) | `Math.round(merch * (PROVINCES[region]?.rate ?? 0))` | local `region` (`useState('QC')`), select visible only when CAD and `hasMerch` | QC | `tax = null`; row `Tax · Calculated at checkout` |
| Checkout | `merch` | `isCA ? Math.round(merch * PROVINCES[province].rate) : 0` | local `province`, select shown only when `needsShipping && isCA` (always used in the formula) | QC | 0; row `Sales tax · Calculated by Shopify` (when `merch > 0`) |
| PDP `PriceBreakdown` | `price` (fee for rentals; base + accent otherwise) | `splitTaxes(PROVINCES[province].label, price)`, each component rounded | local `province` / `state` | QC / `New York` | rows `Sales tax · {state}` → `At checkout`, and `Import duties & customs fees` → `Prepaid` |
| Drawer / PDP price line | — | none | — | — | drawer: "Taxes calculated at checkout."; PDP: CAD `Taxes calculated at checkout`, USD `Duties prepaid` |

These three region states are independent of one another, are not persisted, and are not tied to the address.

```ts
// src/data/costing.ts
export function splitTaxes(label: string, amount: number): { name: string; rate: number; amount: number }[] {
  const parts = [...label.matchAll(/([A-Z]+)\s*([\d.]+)%/g)].map((x) => ({ name: x[1], rate: Number(x[2]) / 100 }))
  return parts.map((t) => ({ ...t, amount: Math.round(amount * t.rate) }))
}
```

`splitTaxes` parses rates out of the **label**, not out of `rate`. Rounding each component separately can differ by $1 from the single combined rounding used on the Cart page and at Checkout:

| Amount (CAD) | QC | ON | BC / MB | AB | SK | NS | NB / NL / PE |
|---|---|---|---|---|---|---|---|
| 6,850 | 1,026 | 891 | 822 (split 343 + 480 = **823**) | 343 | 754 | 959 | 1,028 |
| 1,430 | 214 (split 72 + 143 = **215**) | 186 | 172 | 72 | 157 (split 72 + 86 = **158**) | 200 | 215 |
| 650 | 97 (split 33 + 65 = **98**) | 85 | 78 (split 33 + 46 = **79**) | 33 | 72 | 91 | 98 |

In the breakdown, the rate shown in each tax row is `(t.rate * 100).toFixed(t.rate * 100 % 1 ? 3 : 0).replace(/0+$/, '').replace(/\.$/, '')`, rendered as `{rate}% of <Price amount={price} …/>`. It yields `5`, `9.975`, `13`, `7` and so on. For an integer rate ending in zero it would strip that zero; a 10% rate would print `1`.

**Tax treatment rules encoded in code:**

- Gift cards are untaxed at sale. Checkout carries the comment "Gift cards are not taxed at sale; tax applies to merchandise only."
- Tax is computed **before** gift-card tender, so gift cards can pay it.
- Rental fees are taxed; deposits are not.
- No shipping charge exists, so there is nothing else to tax.

---

## 7. Shipping, duties, discounts and deposits — what exists

| Concern | Implementation |
|---|---|
| Shipping fees / methods | **None.** Always complimentary. Copy appears in: Header announcement "Complimentary insured shipping across Canada & the United States"; drawer footer; Cart page `Shipping · Complimentary` / `Digital delivery`; Checkout `Insured shipping · Complimentary` (only when `needsShipping`); PDP trust row (`Free insured` / `shipping in Canada`, `Duties paid` / `shipping to the U.S.`); PDP "Shipping & returns" accordion (CAD "2–3 business days", USD "3–5 business days"). The cost model folds an `insure` line ("Insured shipping & presentation box", 48 CAD × fx) **into** the price. |
| Duties (USD) | **None computed.** Copy only: PDP `Duties prepaid`; drawer "duties included"; Checkout "Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required."; `PriceBreakdown` "Import duties & customs fees · CUSMA-qualifying, cleared by Teresa & Sons · Prepaid". |
| Discounts / promo codes | **None.** The Cart page says "Gift cards and promo codes can be applied at checkout.", but Checkout has only a gift-card field. The `CartLineItem` strike-through is the only compare-at hook, and it never fires. |
| Gift wrap / receipt / message / note | `CartMeta` (`giftWrap`, `giftReceipt`, `giftMessage` ≤ 200 characters, `note` ≤ 500 characters), persisted in `tns-cart-meta`. Every `GiftOptions` toggle is tagged `Free`, and none affects price. The store comment says it maps to Shopify cart `note` / `attributes`. |
| Rental deposits | Display only (section 4). |
| Delivery promises | Cart page `deliveryDate(4)`. PDP availability: `Available for reservation · fitted in salon` (rental), `` `Made to order · approx. ${leadTimeWeeks} weeks` `` or `In stock · ships within 48 hours`. Physical gift cards: `2–5 days` / `Mailed in our travertine box, 2–5 business days.` |

---

## 8. Checkout math and flow (`src/pages/Checkout.tsx`)

### 8.1 Layout ("steps")

Checkout is a **single page**. There is no step navigation, no shipping-method choice and no payment-method entry.

- **Form (`lg:col-span-7`):**
  - `Checkout` heading
  - the `Shopping in` currency toggle
  - `Email`, `First name`, `Last name` (all `required`)
  - when `needsShipping`: `Address`, `City`, `Province` (a select of `PROVINCES`) or `State` (an uncontrolled select of `US_STATES`), then `Postal code` (pattern `[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d`, placeholder `H3G 1K4`) or `ZIP code` (pattern `\d{5}(-\d{4})?`, placeholder `10001`), then `Phone`. Otherwise the line "Digital gift cards only — no shipping address needed."
  - the payment note "Payment is completed securely through Shopify Checkout. " followed by the CAD/USD shipping sentence
  - the submit button `Place order — no payment due` when `total === 0`, otherwise `Place order`
- **Aside (`lg:col-span-5`, sticky):**
  - `Order summary` lines
  - the `Gift card` code field
  - the totals `<dl>`

Browser HTML validation (`required` / `pattern`) is the only gate on submit.

### 8.2 Totals

```ts
const merch = merchLines.reduce((s, l) => s + linePrice(l), 0)
const giftTotal = giftLines.reduce((s, l) => s + linePrice(l), 0)
const tax = isCA ? Math.round(merch * PROVINCES[province].rate) : 0
const payableByCards = merch + tax
let remaining = payableByCards
const usage = applied.map((a) => {
  const use = Math.min(a.available, remaining)
  remaining -= use
  return { ...a, use }
})
const cardsTotal = usage.reduce((s, u) => s + u.use, 0)
const total = payableByCards - cardsTotal + giftTotal
const needsShipping = merchLines.length > 0 || giftLines.some((l) => l.giftCard!.delivery === 'physical')
```

The totals `<dl>` renders these rows in order:

1. `Merchandise` when `merch > 0`.
2. `Gift cards` when `giftTotal > 0`.
3. `Insured shipping` · `Complimentary` when `needsShipping`.
4. When `merch > 0`: `` `Tax · ${PROVINCES[province].label}` `` with `<Price amount={tax} />` in CAD, or `Sales tax` · `Calculated by Shopify` in USD.
5. `Gift cards applied` · `− <Price amount={cardsTotal} />` (in gold) when `cardsTotal > 0`.
6. `Total due` · `<Price amount={total} />`.

USD totals never include sales tax.

### 8.3 Gift-card redemption (`applyCode`)

The code input shows `formatCode(code)` (groups of 4), with `maxLength={19}`, placeholder `XXXX XXXX XXXX XXXX`, and **Enter** applies the code without submitting the form. The checks run in this order, each with an exact message:

1. `!isCodeFormat(code)` → `Enter the 16-character code from your gift card.`
2. `lookupCard(code)` is null → `This gift card could not be found.`
3. `card.balance <= 0` → `This gift card has no remaining balance.`
4. Already applied → `This gift card is already applied.`
5. `payableByCards - cardsTotal <= 0` → `Your order is already fully covered.` when `merch` is non-zero, otherwise `Gift cards can’t be used to buy other gift cards.`
6. Success: `setApplied([...a, { card, available: convert(card.balance, card.currency, currency) }])`, then clear the input.

- Cards are consumed in the order they were applied. Each row shows `maskCode` (`•••• •••• •••• ABCD`), `− {use}`, and `({available − use} left)` when there is remainder. The `X` button removes the card.
- `available` is a snapshot in the checkout currency. It is re-converted only by the Checkout `Shopping in` toggle.
- The demo card `TERESASONS1962MT` holds CAD 250 and is always present in the ledger (`loadLedger` prepends it). See [Gift cards](pages/gift-cards.md) for the ledger.

### 8.4 Placing the order (`placeOrder`, form `onSubmit`)

1. `e.preventDefault()`.
2. `toShopifyCartItem` runs over gift-card lines. If there are any, `console.info('[Shopify] gift card cart items', shopifyItems)` logs them. Merchandise lines are not mapped.
3. `debitCards(usage.filter((u) => u.use > 0).map((u) => ({ code, amount: u.use, currency })))` sets each card to `card.balance = Math.max(0, card.balance - convert(amount, currency, card.currency))` and saves the ledger.
4. `issueCards(giftLines.map((l) => l.giftCard!), giftLines.map((l) => l.qty))` creates one card per unit. Each gets a random 16-character code from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, `initial = balance = amount` in the line's **own** currency, `recipientName` (unless `toSelf`), `issuedAt` (UTC date), and `expiresAt: null`. The cards are appended to `tns-giftcard-ledger`.
5. `` setPlaced({ order: `TS-${Date.now().toString().slice(-6)}`, issued, paidWithCards: cardsTotal }) ``. The order number is the last six digits of the millisecond timestamp.
6. `clearCart()` empties the cart, resets `CartMeta` and clears the undo state.

No merchandise order is recorded anywhere; the Account "Orders" tile always reads "No orders yet. Track deliveries and rental returns here." The confirmation lives only in Checkout component state.

### 8.5 Confirmation contents

- Eyebrow `Order TS-xxxxxx`, then heading `Merci.`, then `A confirmation is on its way.`, with ` <Price amount={paidWithCards} /> was paid with gift cards.` appended when `paidWithCards > 0`.
- When cards were issued, a `Your gift cards` grid. Each card shows `GiftCardArt` with its code and one of: `Mailed in our travertine box, 2–5 business days.` (physical), `Emailed to you now.` (to self), or `` `Emailed to ${recipientEmail}${sendOn ? ` on ${formatDay(parseIso(sendOn))}` : ' now'}.` ``.
- Links `Return to the maison`, plus `View in your account` when cards were issued.

When the cart is empty and there is no confirmation, the page shows `Your bag is empty.` and `Continue shopping`.

### 8.6 Gift-card builder math (`src/pages/GiftCards.tsx`)

- `value = custom ? Number(custom) : amount`. The custom input strips non-digits and keeps at most 5 characters. The default `amount` is 250.
- `[min, max] = CUSTOM_RANGE[currency]` (CAD 50–10,000; USD 50–7,500). The placeholder is `` `Custom amount, ${min}–${max.toLocaleString('en-CA')}` ``.
- Validation messages:
  - `` `Choose an amount between ${formatPrice(min, currency)} and ${formatPrice(max, currency)}.` ``
  - `Add the recipient’s name.` (not for self)
  - `Add a valid recipient email.`, checked with `/^\S+@\S+\.\S+$/` (email delivery, not for self)
- The line built is:
  - `amount: Math.round(value)`, `currency` (the active currency at submit time), `design`, `delivery`, `toSelf`
  - `recipientName`: trimmed, or `undefined` when `toSelf`
  - `recipientEmail`: trimmed, or `undefined` when `toSelf` or delivery is not email
  - `senderName` and `message`: trimmed, or `undefined`
  - `sendOn`: set only when `!toSelf && delivery === 'email' && sendOn !== today`
- The button reads `Add to bag — <Price amount={Number.isFinite(value) ? Math.round(value) * qty : 0} />`.
- Copy under the button: "Gift cards are not taxed at purchase and cannot be paid for with another gift card."

---

## 9. Price transparency — `PriceBreakdown` and `src/data/costing.ts`

### 9.1 When it renders and its inputs

- `Product.tsx` renders `<PriceBreakdown product index metal personalization={pcfg ? personal : undefined} period />` only when `hasCostBreakdown(product)`, which is `p.metals.length > 0 && !/commission|redesign/i.test(p.name)`. That excludes `gift-card`, `bespoke-engagement-commission` and `heirloom-redesign`.
- `useMemo` deps are `[product, currency, metal, personalization, period, rental]`.
- Rentals use `rentalLines(product, period, currency)` and set `price = Σ lines`, `metalWeight = 0` and `labourHours = 0`.
- Everything else uses `buildCostBreakdown(product, currency, metal, personalization)`.

### 9.2 `buildCostBreakdown` algorithm

| Step | Rule |
|---|---|
| Setup | `fx = CAD ? 1 : 0.73`; `m = metal ?? p.metals[0]`; `base = priceFor(p, currency, m)`; `accent = personalizationPrice(...)`; `r = Math.round` |
| Metal (materials) | `weight = specs.Weight ? parseNum(specs.Weight) : DEFAULT_WEIGHT[category] ?? 5`; amount `r(weight * METAL_RATE[m].rate * fx + (vermeil ? 30 * fx : 0))`. Label is `mr.name` (watches: `` `Case & bracelet · ${mr.name}` ``). Detail is `` `${weight.toFixed(1)} g × ${(rate*fx).toFixed(2)}/g · ${purity}` `` plus ` + plating` for vermeil. |
| Stones (materials) | `stonePool = base * (STONE_SHARE[category] ?? 0.4)`. Watches get `Swiss movement` = `r(pool * 0.75)` plus the first stone at `r(pool * 0.25)` when present. Others split the pool by stone weight: GIA centre `carat × 6` (`` `Centre diamond · ${shape}` ``, detail `` `${carat.toFixed(2)} ct · ${color} / ${clarity} · GIA ${report}` ``), `Pearls` 3, `Colombian emerald` ct × 3.5, `Ceylon sapphires` ct × 2.2, `Diamonds` (spec "total carat") ct × 2.5, and `Hidden halo diamonds` / `Side stones` / `Bezel diamonds` / `Accent diamonds` ct × 1.8. A spec contributes only if its value matches `/ct/`, apart from `Pearl`. |
| Findings (materials) | By name: necklace / pendant / chain / collar / rivi → `Chain & clasp` (`Solid gold spring ring`); earring / stud / drop / huggie → `Posts & backs` (`Secure screw or hinged backs`); bracelet → `Clasp & safety` (`Double box clasp`); watches → `Strap & buckle` (`specs.Strap ?? 'Leather strap'`). Amount `r((watches ? 220 : 45) * fx)`. |
| Making | `making = base * (MAKING_SHARE[cat] ?? 0.16) * (hasStones \|\| watches ? 1 : 2.2)`; `labour = making * (hasStones ? 0.55 : 0.8)`; `hours = Math.max(2, Math.round(labour / (95 * fx)))`. Lines: `Bench work · casting & fabrication` (watches: `Regulation & assembly`) `r(labour)` with detail `` `${hours} h × ${r(95*fx)}/h · Montréal atelier` ``; `Stone setting` `r(making * 0.3)` when there are stones (`Hand-set under microscope`); `Polishing & hallmarking` `r(making * (hasStones ? 0.15 : 0.2))` (`12-stage finish, maker’s mark`). |
| Services | `GIA grading report` `r(165 * fx)` (`№ {report}`) when there is a GIA report; `Insured shipping & presentation box` `r(48 * fx)` (`Signature courier, Canada` / `Signature courier, duties prepaid`); `Engraving` included at 0 when engravable (`Hand or laser, up to 18 characters`); `Lifetime care plan` included at 0 (`Annual cleaning, claw checks, polish`) |
| Margin | `margin = base − Σ lines`. If below `floor = base * 0.12`, the stone and movement lines (`id` starting with `st`, or `movement`; only when their total is above 0) are scaled by `k = max(0, (stoneTotal − (floor − margin)) / stoneTotal)`, rounded again, and the margin recomputed. Label `Design, showroom & maison margin`, detail `Design, salon, staff, warranty reserve`. |
| Options | When `accent` is non-zero: an `options` line with label `p.personalization?.accent?.label ?? 'Option'`, detail `Selected option` |
| Return | `{ lines, price: base + accent, metalWeight: weight, labourHours: hours }`. The statement reconciles exactly to `price`, because the margin absorbs the rounding. |

Constants:

- `METAL_RATE` (CAD/g):
  - 18k-yellow 82.4, "18k · 75.0% gold"
  - 18k-white 84.1, "18k · 75.0% gold, rhodium finish"
  - 18k-rose 81.9
  - platinum 48.6, "Pt950 · 95.0% platinum"
  - vermeil 1.6, "925 silver, 2.5µ 18k gold"
- `DEFAULT_WEIGHT` (g): necklaces 6.2, earrings 3.4, bracelets 11.5, rings 5.2, bridal 4.6, watches 32, gifts 3.1, custom 4.8, rentals 28.
- `STONE_SHARE`: bridal 0.56, necklaces 0.5, earrings 0.46, bracelets 0.48, rings 0.44, gifts 0.22, custom 0.3, watches 0.34, rentals 0.5.
- `MAKING_SHARE`: bridal 0.13, custom 0.2, watches 0.08 (default 0.16).
- `LABOUR_RATE_CAD = 95`.

Margin-floor easing triggers, by computation, for:

- `griffintown-chain-bracelet` (gold metals): margin 198 CAD / 145 USD
- `laurier-stacking-band` (gold metals): 162 CAD / 118 USD
- `pearl-stud-gift-set` (both metals): 65 CAD (12.0%) / **47 USD (11.9%)**, just under the floor after rounding

### 9.3 Rental fee lines (`rentalLines` in `PriceBreakdown.tsx`)

| id | Group | Label | Detail | Amount |
|---|---|---|---|---|
| `wear` | materials (statement header `The piece`; the legend still says `Materials`) | Use of the piece | `` `${'Weekend' \| 'One week' \| 'One month'} · retail value ${Math.round(p.price[currency]).toLocaleString('en-CA')}` `` | `fee − Σ(services)` |
| `insure` | services | Full insurance cover | Loss, theft & damage for the rental period | `Math.round(fee * 0.22)` |
| `clean` | services | Cleaning & re-certification | Ultrasonic clean, claw check, gemmologist sign-off | `Math.round(fee * 0.08)` |
| `courier` | services | Bonded courier, both ways | Or in-salon fitting | `Math.round(fee * 0.12)` |

### 9.4 What the breakdown displays

- The section is `id="price-breakdown"`, with eyebrow `Transparent pricing` and title `The price, itemised`.
- The aside reads "What your rental fee covers, the refundable deposit, and tax — before you reserve." for rentals, or "Every gram, every stone and every bench hour behind this piece, with our margin shown openly." otherwise.
- **Composition column:**
  - big `<Price amount={price}>`
  - sub-label `` `${period} rental fee · before tax` `` or `` `${metal label} · before tax` ``
  - a stacked bar of the non-zero groups (`Materials` espresso, `Making charges` vermeil, `Certification & services` champagne, `Selected options` `#8a6a32`, `Maison margin` linen). Widths animate in when the bar is 40% visible: `duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]` with a 90 ms stagger.
  - a legend with `pct = ((n / price) * 100).toFixed(n / price < 0.1 ? 1 : 0)`
  - for non-rentals, `Metal weight` `{weight.toFixed(1)} g` and `At the bench` `{hours} h`
- **Statement column:**
  - group headers with subtotals, then rows showing either a `Price` or `Included`
  - `Price before tax` / `Rental fee`
  - `Taxes & duties` (section 6)
  - the total bar: `Total, tax included` (CAD) / `Total before sales tax` (USD) = `price + taxTotal`
  - for rentals, the deposit row
- The non-rental footnote reads "Metal values use indicative daily rates per gram for the chosen alloy. Stone values reflect our cost for this grade. Figures are rounded and reconcile exactly to the price shown."

---

## 10. PDP price display (`src/pages/Product.tsx`)

- **The amount:** `amount = rental ? rental[period][currency] : priceFor(product, currency, metal) + personalizationPrice(product, pcfg ? personal : undefined, currency)`.
- **Defaults:** `metal` starts at `product.metals[0]` and `period` at `'weekend'`. `Routes` keys `Product` by slug, so all state resets on navigation.
- **Price block for rentals:**
  - `<Price amount={amount} />`
  - `per weekend` / `per week` / `per month`
  - `Refundable deposit <Price deposit/> · insurance included · ` and the button `What the fee covers`, which scrolls to `#price-breakdown`
  - period buttons labelled `Weekend` / `One week` / `One month`, each showing its own rate
- **Price block for everything else:**
  - the instalment clause (section 5.4)
  - `Duties prepaid` (USD) or `Taxes calculated at checkout` (CAD)
  - ` · ` `See full cost breakdown` when `hasCostBreakdown`
- **CTA:** `` `${ctaLabel} — <Price amount={amount} />` ``. After an add it shows `Added to bag` for 2200 ms, and once the configuration is in the bag it shows `Go to bag`.
- **`StickyBar`:** shows the same `amount`. Its `detail` is `` [rental ? `${period} rental` : METALS[metal].label, rental && booking.start && `From ${formatDay(parseIso(booking.start))}`, pcfg && text && `“${text}”`, size && `Size ${size}`].filter(Boolean).join(' · ') ``, for example `weekend rental · From Mon, Oct 19`.
- **Rental booking validity** (`isBookingValid` in `RentalCalendar.tsx`):
  - `start` and `slot` are set
  - `start >= today + RENTAL_LEAD_DAYS (2)`
  - none of the `RENTAL_DAYS[period]` days (weekend 3, week 7, month 30) starting at `start` is in `getBookedDates(slug)`
  - slots are `09:00 – 11:00`, `11:00 – 13:00`, `14:00 – 16:00` and `17:00 – 19:00`
  - method defaults to `courier`
  - the line's end date is `rentalReturnDate(start, period) = start + RENTAL_DAYS[period]`

---

## 11. Worked examples

All amounts are whole dollars. "QC" means the default province on the Cart page, Checkout and `PriceBreakdown`.

### (a) Mont-Royal Solitaire Pendant, 18k yellow, qty 1 — CAD and USD

1. **Catalog.** `price: p(6850)` gives CAD 6,850. For USD, `Math.round(6850 × 0.73 / 5) × 5 = Math.round(1000.1) × 5 = ` **5,000**. The `18k-yellow` delta is 0, and the product has no personalization.
2. **PDP.**
   - CAD: `$6,850 CAD` and "Or 4 interest-free payments of $1,713 CAD with Shop Pay · Taxes calculated at checkout · See full cost breakdown" (`Math.round(1712.5) = 1713`).
   - USD: `$5,000 USD` and "… $1,250 USD … · Duties prepaid · …".
3. **Line.** Key `mont-royal-solitaire-pendant|18k-yellow||||""|""|""`, details `18k Yellow Gold`, and `linePrice` 6,850 CAD / 5,000 USD.
4. **`useCartTotals`.**
   - CAD: merch 6,850, giftCards 0, subtotal 6,850, threshold 1,000 → `rewardUnlocked` (bar 100%), installment 1,713.
   - USD: subtotal 5,000, threshold 750 → unlocked, installment 1,250.
5. **Cart page.**
   - CAD: `Jewellery $6,850`, `Shipping Complimentary`, `Jewellery care kit Included`, and `Est. tax` (Québec) `Math.round(6850 × 0.14975 = 1025.7875) = ` **1,026**. **Estimated total 7,876.** Other provinces: ON 891, BC/MB 822, AB 343, SK 754, NS 959, NB/NL/PE 1,028.
   - USD: `Tax · Calculated at checkout`, **Subtotal 5,000**.
6. **Checkout.**
   - CAD/QC: Merchandise 6,850; `Tax · GST 5% + QST 9.975%` 1,026; **Total due 7,876**.
     - With the demo card (CAD 250) applied, `available` is 250 and `use` is 250, so "Gift cards applied − $250" and **Total due 7,626**. On placement the ledger balance goes 250 → 0.
   - USD: Merchandise 5,000; `Sales tax · Calculated by Shopify`; **Total due 5,000**.
     - With the demo card, `available = convert(250, CAD, USD) = Math.round(182.5) = 183`, so **Total due 4,817**. The debit is `convert(183, USD, CAD) = Math.round(250.68…) = 251`, so the balance becomes `max(0, 250 − 251) = 0`.
7. **PriceBreakdown.**

   | Line | Group | CAD | USD |
   |---|---|---|---|
   | 18k yellow gold — `6.2 g × 82.40/g · 18k · 75.0% gold` (USD `× 60.15/g`) | materials | 511 | 373 |
   | Centre diamond · Round Brilliant — `0.70 ct · F / VS1 · GIA 2231874590` | materials | 3,425 | 2,500 |
   | Chain & clasp — `Solid gold spring ring` | materials | 45 | 33 |
   | Bench work · casting & fabrication — `6 h × 95/h · Montréal atelier` (USD `6 h × 69/h`) | making | 603 | 440 |
   | Stone setting | making | 329 | 240 |
   | Polishing & hallmarking | making | 164 | 120 |
   | GIA grading report — `№ 2231874590` | services | 165 | 120 |
   | Insured shipping & presentation box | services | 48 | 35 |
   | Lifetime care plan | services | Included | Included |
   | Design, showroom & maison margin | margin | 1,560 | 1,139 |
   | **Price before tax** | | **6,850** | **5,000** |

   - Composition: Materials 3,981 (58%), Making 1,096 (16%), Certification & services 213 (3.1%), Maison margin 1,560 (23%). Metal weight 6.2 g; at the bench 6 h. The USD percentages are the same.
   - CAD/QC taxes: GST `Math.round(342.5) = 343` and QST `Math.round(683.29) = 683`, together 1,026, so **Total, tax included 7,876**. That matches the cart in this case.
   - USD: `Sales tax · New York · At checkout`, `Import duties & customs fees · Prepaid`, **Total before sales tax 5,000**.

### (b) The Teresa Signet + Notre-Dame Oval Solitaire in platinum — USD

1. **Signet.** `p(3200)` gives USD `Math.round(467.2) × 5 = ` **2,335**.
   - Its metals are GOLDS, so platinum is not offered; the default is `18k-yellow` (+0). The monogram has no accent (+0).
   - The PDP requires a monogram (1–3 letters `A-Za-z`, uppercased on input; default font `serif`) and a ring size. A reverse engraving (≤ 18 characters) is optional.
   - PDP: `$2,335 USD`, with instalments of $584.
2. **Notre-Dame.** `p(18900)` gives USD `Math.round(2759.4) × 5 = 13,795`.
   - Platinum is `metals[0]`, so the PDP starts on it. The delta is `Math.round(650 × 0.73 = 474.5) = 475`, giving **14,270 USD** (CAD 19,550).
   - Size is required; engraving is complimentary.
   - PDP: `$14,270 USD`, instalments $3,568.
   - Listing surfaces (card, upsell, sort, gift finder) show the base **$13,795 USD**.
3. **Lines.** Example: monogram `TMS`, size 7, reverse engraving `J & M`, plus Notre-Dame size 6.5.
   - `teresa-signet|18k-yellow||J & M|7|""|{"text":"TMS","font":"serif"}|""` → 2,335. Details: `18k Yellow Gold` · `Size 7` · `“TMS” · Serif` · `Reverse: “J & M”`.
   - `notre-dame-oval-solitaire|platinum|||6.5|""|""|""` → 14,270. Details: `Platinum 950` · `Size 6.5`.
4. **Totals (USD).** merch = subtotal = **16,605**, count 2, threshold 750 → unlocked, installment `Math.round(4151.25) = 4,151`.
   - Cart page: `Tax · Calculated at checkout`, **Subtotal 16,605**, plus the delivery-date promise.
   - Checkout: `Sales tax · Calculated by Shopify`, **Total due 16,605**. No sales tax, shipping charge or duty is added.
   - For comparison in CAD/QC: 3,200 + 19,550 = 22,750; tax 3,407; total 26,157.
5. **Notre-Dame breakdown (USD, platinum).**
   - Lines: `Platinum 950` 163 (`4.6 g × 35.48/g · Pt950 · 95.0% platinum`); `Centre diamond · Oval` 7,836; `Hidden halo diamonds` 155; Bench work 1,020 (`15 h × 69/h`); Stone setting 557; Polishing 278; GIA 120; Insured shipping 35; Engraving Included; Care Included; margin 4,106. The total is 14,270.
   - Groups: Materials 8,154 (57%), Making 1,855 (13%), Services 155 (1.1%), Margin 4,106 (29%).

### (c) Engraved Nameplate Necklace with diamond accent — CAD and USD

1. **Base price.** `p(1250)` gives USD `Math.round(182.5) × 5 = 183 × 5 = ` **915**. The default metal is `18k-yellow` (+0).
2. **Accent.** CAD 180; USD `toUSD(180) = Math.round(26.28) × 5 = ` **130**. The Personalizer row reads `Diamond accent` and `+ $180 CAD` / `+ $130 USD`.
3. **PDP.**
   - CAD **1,430** (instalments 358); USD **1,045** (instalments `Math.round(261.25) = 261`).
   - The CTA is `Begin commission — …`, because the category is `custom`.
   - Defaults: font `script`, chain `18 in`. There is no engraving field.
4. **Line.** Key `engraved-nameplate-necklace|18k-yellow||||""|{"text":"Sofia","font":"script","chainLength":"18 in","accent":true}|""`. Details: `18k Yellow Gold` · `“Sofia” · Script · 18 in · Diamond accent`.
5. **CAD totals.** merch 1,430, which unlocks the reward (≥ 1,000).
   - Cart page and Checkout (QC): tax `Math.round(1430 × 0.14975 = 214.1425) = ` **214**, so **total 1,644**.
   - PriceBreakdown (QC):
     - Lines: metal 396 (`4.8 g × 82.40/g`), Chain & clasp 45, Bench work 440 (`5 h × 95/h`), Polishing 110, Insured shipping 48, Engraving Included, Care Included, margin 211, `Diamond accent` (Selected options) 180. Price 1,430.
     - Taxes: GST `Math.round(71.5) = 72` and QST 143, together 215, so **Total, tax included 1,645**. That is **$1 more** than the cart and checkout.
6. **USD totals.** merch 1,045 (unlocked, ≥ 750); Checkout **Total due 1,045**.
   - Breakdown: 289 / 33 / 322 (`5 h × 69/h`) / 81 / 35, margin 155, accent 130. Total 1,045.
   - The spec row `Option: Diamond accent +$180` is static text and shows in USD too.

### (d) Gala Diamond Collar, weekend rental — CAD

1. **Rates.** `rental(650, 1400, 3900, 5000)`: weekend **650**, week 1,400, month 3,900, deposit 5,000 (USD 475 / 1,020 / 2,845 / 3,650). The retail `price` of 92,000 is used only for "retail value" text and for sorting.
2. **PDP.**
   - `$650 CAD` and `per weekend`.
   - `Refundable deposit $5,000 CAD · insurance included · What the fee covers`.
   - CTA `Reserve this piece — $650 CAD`.
3. **Booking.** On 2026-10-15 the demo booked windows for this slug start 2026-10-24.
   - A start of `2026-10-19` (≥ today + 2) with slot `09:00 – 11:00` and courier is valid, because days 19–21 are free.
   - Availability is computed relative to the current date.
4. **Line.**
   - Payload: `{ slug: 'gala-diamond-collar', metal: undefined, rental: 'weekend', engraving: undefined, size: undefined, booking: { method: 'courier', start: '2026-10-19', slot: '09:00 – 11:00' }, personalization: undefined }`.
   - Key: `gala-diamond-collar||weekend|||{"method":"courier","start":"2026-10-19","slot":"09:00 – 11:00"}|""|""`.
   - `linePrice` = `rental.weekend.CAD × 1` = **650**.
   - Details: `Weekend rental` · `Mon, Oct 19 → Thu, Oct 22` (Node 24 en-CA) · `Courier · 09:00 – 11:00`. The eyebrow reads `Rental`.
5. **Totals.**
   - merch 650; rewardProgress 0.65; rewardRemaining **350**, so the bar reads "$350 away from a complimentary jewellery care kit."; installment `Math.round(162.5) = 163`; `hasRental` true, so no delivery-date promise.
   - Cart page and Checkout (QC): tax `Math.round(97.3375) = ` **97**, so **total 747**.
   - The **deposit appears nowhere** in the cart or checkout totals.
6. **PriceBreakdown.**
   - Lines: `Use of the piece` 377 (`Weekend · retail value 92,000`), `Full insurance cover` 143, `Cleaning & re-certification` 52, `Bonded courier, both ways` 78, giving a `Rental fee` of 650. Composition: Materials 377 (58%), services 273 (42%).
   - Taxes: GST `Math.round(32.5) = 33` and QST 65, together 98, so **Total, tax included 748**. That is $1 more than the cart's 747.
   - `Refundable security deposit` $5,000 is shown but not added.
7. **Ensemble.** `CompleteTheLook` pairs the collar with `chandelier-sapphire-earrings` and `bridal-tiara-and-drops`.
   - Weekend total `650 + 320 + 480 = ` **$1,450 CAD**; deposit `5,000 + 2,500 + 3,500 = ` **$11,000 CAD**.
   - Starting from an empty bag, reserving adds three rental lines that share the booking. Cart merch becomes 1,450 (reward unlocked) and the QC tax is 217, so the total is 1,667.
   - If the collar line from step 4 is already in the bag, it has the same `lineKey`, so it becomes qty 2 instead. Merch is then 2,100 and QC tax 314 (see Notes).

### (e) A USD 250 gift card viewed with CAD selected

1. **Created** on `#/gift-cards` while USD was active. The button read `Add to bag — $250 USD`.
   - Line: `giftCard = { amount: 250, currency: 'USD', design: 'travertine', delivery: 'email', toSelf: false, recipientName: 'Ana', recipientEmail: 'ana@example.com' }` (example recipient).
   - Key: `gift-card|||||""|""|{"amount":250,"currency":"USD",…}`.
2. **Switching to CAD.** `linePrice = convert(250, 'USD', 'CAD') × 1 = Math.round(342.4657…) = ` **342**.
   - `CartLineItem`: the card art still shows `$250` `USD`, and the price column shows `$342 CAD`. No strike-through.
   - Details: `Travertine design · Digital` · `To Ana · ana@example.com`.
3. **`useCartTotals` (CAD).** merch 0, giftCards 342, subtotal 342, `hasMerch` false so `RewardProgress` is hidden, installment `Math.round(85.5) = 86`. With qty 2 the figures are 684 and 171.
4. **Drawer.** `Subtotal $342 CAD`, plus "Complimentary insured shipping across Canada. Taxes calculated at checkout."
5. **Cart page.** `Gift cards $342`, `Shipping · Digital delivery` (this would show even for a physical card), no tax row, `Gift cards are not taxed.`, and the label **Subtotal** $342.
6. **Checkout (CAD).** `Gift cards $342`. Tax is 0 and no tax row is rendered because `merch === 0`.
   - With email delivery there is no shipping row, and the page shows "Digital gift cards only — no shipping address needed."
   - **Total due $342.**
   - Applying any code gives `Gift cards can’t be used to buy other gift cards.`
7. **Placing the order.**
   - Shopify payload: `{ id: 44100000012 /* 'USD-250' */, quantity: 1, properties: { _design: 'Travertine', _delivery: 'Digital, by email', __shopify_send_gift_card_to_recipient: 'on', 'Recipient email': 'ana@example.com', 'Recipient name': 'Ana' } }`, logged to the console.
   - The issued card has `initial = balance = 250` and `currency: 'USD'`, so it keeps its native currency.
8. **Comparison.** A CAD 250 card shown in USD would read 183 via `convert`. The `toUSD` rule would give 185, and the catalog `gift-card` product shows 200.

---

## Notes & gotchas

### Currency and rounding

- Four rounding policies coexist: catalog/rental/accent use nearest $5, metal deltas and gift-card conversion use nearest $1, and costing rounds each line. The result is inconsistent USD figures (section 2.4). Pick one policy before connecting real Shopify Markets pricing; Shopify computes converted prices itself.
- `convert` is not symmetric (CAD 250 → USD 183 → CAD 251). `debitCards` converts the applied USD amount back into the card's currency with the same rounding, so it can over-debit by $1. `Math.max(0, …)` hides this.
- **Bug risk:** `Applied.available` is re-converted only by Checkout's own "Shopping in" toggle. The Header toggle is also on the checkout page. Suppose a CAD 250 card is applied in CAD, and the Header then switches to USD. `available` stays 250 but is now read as USD 250. The order is credited USD 250, and the debit (`convert(250, USD, CAD) = 342`) clamps to 0. The customer gains about USD 67.
- The confirmation's `paidWithCards` is a number in the checkout currency, but it is formatted with the *current* currency. Switching currency after placing the order relabels it without converting.
- `REWARD_THRESHOLD.USD` (750) is not 1,000 × 0.73 (730). `CUSTOM_RANGE.USD` max (7,500) is not 10,000 × 0.73. The gift-finder budgets and the PDP's `>= 400` instalment threshold use the same numbers in both currencies.
- `formatPrice` builds a new `Intl.NumberFormat` on every call. `maximumFractionDigits: 0` with currency style works in current engines, but some older engines threw `RangeError` when the maximum was below the currency's default minimum (2). Verify this if legacy browsers matter (unverified here).
- The `tns-currency` read is neither validated nor wrapped in try/catch. A bad stored value such as `"foo"` would make `Intl.NumberFormat` throw, and blocked storage would throw during provider init.

### Listing vs configured prices

- Listing surfaces use `priceFor(p, currency)` without a metal. For `BRIDAL_METALS` products (Notre-Dame, Basilique, Promesse, Bespoke commission) the card shows the base price, while the PDP opens on platinum (+650 CAD / +475 USD). Category sort and the gift finder also use the base price, and rentals sort by retail value rather than by the weekend fee they display.
- The Bespoke Engagement Commission is described as "Price shown is a starting deposit.", yet its default platinum adds +650 to that deposit.
- The nameplate's static spec `Option: Diamond accent +$180` reads the same in USD, where the accent costs $130. The gift-card product's spec `Denominations: '$250 – $10,000'` and its `p(250, 200)` price do not match `DENOMINATIONS` (100–5,000) or `CUSTOM_RANGE` (min 50).
- `describePersonalization` hard-codes the text `'Diamond accent'` instead of using `cfg.accent.label`. A future accent with another label would be mis-described in the bag.

### Tax

- Tax is rounded to whole dollars, and the PDP breakdown rounds each component (GST, QST, PST) on its own. The breakdown total can therefore exceed the cart and checkout total by $1: examples (c) and (d), and BC/MB at 6,850.
- The province is chosen in three unlinked places (Cart `region`, Checkout `province`, breakdown `province`), all defaulting to QC. None follows the shipping address or is persisted.
- There are no territories (YT/NT/NU). US sales tax is never estimated, so the USD "Total due" excludes it.
- The `tax.ts` header comment says "2024 rates", but NS is listed at 14%. Nova Scotia's HST was 15% until it was reduced to 14% on 2025-04-01 (external knowledge; re-verify all rates before production).
- `splitTaxes` parses the **label**. Changing `rate` without changing `label` (or the reverse) makes the cart/checkout and the PDP breakdown disagree. The breakdown's rate formatter would print a 10% or 20% rate as `1` / `2` (it strips trailing zeros from integers).

### Cart lines and quantities

- **Bug:** the qty stepper's `+` clamps with `Math.min(10, qty + 1)`, but `addToCart` has no cap and the gift-card page adds up to 20. On a line with qty > 10, pressing `+` *reduces* it to 10.
- Configuration requirements are enforced only by the PDP's `handleAdd`:
  - `CompleteTheLook` (non-rental) adds every piece as `{ slug, metal: metals[0] }`. That includes the current product, ignoring the metal, size and personalization chosen on the PDP. A Teresa Signet can enter the bag with no size or monogram.
  - For a custom piece, the look includes Notre-Dame at platinum while the set total shown used base prices.
  - `Wishlist` "Add all to bag" adds rings and bridal pieces without sizes, and adds commission and redesign pieces.
- Rentals accept `qty > 1` for a unique piece, which multiplies the fee. "Reserve the ensemble" increments an identical rental line already in the bag to qty 2. Deposits never reach the cart, checkout or Shopify payloads.
- `lineKey` relies on `JSON.stringify` key order and presence. A personalization that toggled the accent on and off (`accent: false`) does not stack with one that never touched it.
- Lines whose slug has left the catalog become "ghosts": `linePrice` returns 0 and they are not rendered, but they still count in `count` and the badge.
- `CartLineItem`'s strike-through (`fullPrice !== unit`) is dead code until compare-at or discount pricing exists.
- In `src/store.tsx`, `removeLine` and `undoRemove` call one state setter inside another setter's updater. StrictMode (enabled in `src/main.tsx`) can run updaters twice. The `prev.some(...)` guard in `undoRemove` prevents duplicates; keep that guard if you refactor.

### Checkout and gift cards

- Placing an order records nothing for merchandise. The order number `TS-` + the last six digits of `Date.now()` repeats every 1,000,000 ms. The confirmation exists only in component state and is lost on navigation.
- Applied cards are snapshots and are not re-validated against the ledger at placement, for example if another tab spent them.
- The Cart page shows `Shipping · Digital delivery` for any cart holding only gift cards, even physical ones, while Checkout correctly requires an address. The drawer always says "Taxes calculated at checkout.", even for a cart of gift cards only.
- The Cart page promises "Gift cards and promo codes can be applied at checkout.", but no promo-code mechanism exists.
- `isGiftCardLine` in `src/lib/shopify.ts` is exported but unused, and the `threshold` output of `useCartTotals` is unused. The store's `subtotal` duplicates `useCartTotals().subtotal`, and Checkout recomputes `merch` and `giftTotal` itself, so all three must stay in sync by hand.

### Cost model and rentals

- The 12% margin floor is approximate after rounding: Pearl Stud Gift Set in USD ends at 47 (11.9%). Products that trigger the easing are listed in section 9.2.
- In the rental breakdown, the legend says "Materials" while the statement header says "The piece".
- `getBookedDates` uses a signed `>>` on a hash that can exceed 2³¹. Offsets and lengths can then go negative: on 2026-10-15 `bridal-tiara-and-drops` had **no** booked dates, and `chandelier-sapphire-earrings` had only four, one of them in the past. Ensemble conflict checks depend on this demo data.

---

## Related docs

- [Product overview, sitemap & user journeys](product-overview.md)
- [Architecture & runtime model](architecture.md) — StoreProvider, persistence keys, routing
- [Data layer — catalog, media, gift cards, costing & tax](data-model.md) — the source data behind these prices
- [Shopify integration map & porting notes](shopify-integration.md) — `toShopifyCartItem`, cart attributes, Markets/currency porting
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md) — UI and layout of the surfaces whose math is documented here
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Category (collection) page & product card](pages/category.md)
- [Virtual try-on](features/virtual-try-on.md) — `TryOnStudio` add-to-bag
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md) — `VideoViewer` add-to-bag
- [Design system](design-system.md) — `Price` typography and tokens
- [Known issues, risks & tech debt](known-issues.md)
- [File index](INDEX.md)
