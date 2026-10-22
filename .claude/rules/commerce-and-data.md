---
paths:
  - "src/data/**/*.ts"
  - "src/lib/**/*.ts"
  - "src/store.tsx"
  - "src/components/cart/**/*.{ts,tsx}"
  - "src/components/lineDetails.ts"
  - "src/components/Price.tsx"
  - "src/components/pdp/{PriceBreakdown,RentalCalendar,Personalizer,CompleteTheLook}.tsx"
  - "src/pages/{Product,Cart,Checkout,GiftCards,Designer}.tsx"
  - "src/components/designer/**/*.tsx"
---

# Commerce & data rules (money, cart lines, catalog)

Full references: `.claude/docs/commerce-logic.md` (formulas and worked examples), `.claude/docs/data-model.md` (every product and constant), and `.claude/docs/shopify-integration.md`.

## Money

- All amounts are **integer whole units** in the active currency. Round only where the code already rounds, and never introduce cents.
- **CAD → USD conversion** (`CAD_TO_USD = 0.73`) must go through the existing helpers, each with its own rounding:

  | Helper | Used for | Rounds to |
  |---|---|---|
  | `p()` / `toUSD` | List prices, rental rates, personalization accents | Nearest $5 |
  | `priceFor` | Metal deltas | Nearest $1 |
  | `convert` | Gift cards | Nearest $1 |

  Do not add a fourth rule.
- **Display:** in the active currency, display with `<Price amount />`. For an amount in another currency (gift-card balances), use `formatPrice(amount, explicitCurrency)` and print the ISO code. `formatPrice` formats for the visitor's locale (`$1,250`, `1 250 $`) with a bare `$`.
- **Line prices:** price cart lines only with the store's `linePrice(line)`. Derive bag totals only from `useCartTotals()`.

## Cart-line identity

When you add a field to `CartLine` that makes two configurations different, change **all** of the following together. Missed spots merge different configurations or break `inBag`.

1. `CartLine` and `lineKey` in `src/store.tsx`. `lineKey` JSON-stringifies nested objects, so keep the property order stable and avoid storing `false`/`undefined` variants.
2. The `configured` object in `src/pages/Product.tsx`. It is used for both `addToCart` and `inBag`.
3. `lineDetails()` in `src/components/lineDetails.ts`. Both the bag and checkout render through it.
4. If it affects price: `linePrice` (store), `fullPrice` in `CartLineItem`, `amount` in `Product.tsx`, and `buildCostBreakdown` in `src/data/costing.ts`.
5. Shopify: shape only. Record how the field would map (variant option or line-item property) in `.claude/docs/shopify-integration.md`. Don't write integration code; this repo is a UI prototype.

## Totals, tax, gift cards

- **Tax** applies to **merchandise only**: `Math.round(merch * PROVINCES[code].rate)` in CAD. In USD the tax row reads "Calculated by Shopify".
- **Gift cards** are never taxed and can never pay for other gift cards, nor for a designed ring's balance (`payableByCards = merch − balance + taxAt(rate).now`).
- **Tax data** (`src/data/tax.ts`): change `rate` and `label` together. `splitTaxes(PROVINCES[code], amount)` names its lines from the label (`'GST 5% + PST 7%'`) and totals them from `rate`: the last line takes the remainder, so a breakdown always equals the bag's `Math.round(merch * rate)` (2026-10-22).
- **Rental deposits** (`RentalRates.deposit`) are a hold, never a charge. Keep them out of `linePrice` and all totals.
- **Reward threshold:** `REWARD_THRESHOLD` in `useCartTotals.ts` (CAD 1000 / USD 750) is the single source. Gift-card lines don't count toward it.
- **Currency switch at checkout:** Checkout keeps the applied cards themselves and converts each balance with `convert(card.balance, card.currency, currency)` on every render, so every switcher (header, desktop menu, "Shopping in") re-prices them (KI-024, fixed 2026-10-22). Never store a converted amount. An amount shown after the order (the confirmation) keeps the order's currency: `formatPrice(amount, placed.currency)` plus the ISO code.
- **New gift-card denominations** go into `DENOMINATIONS` (both currencies), get `CAD-x` **and** `USD-x` IDs in `GIFT_CARD_VARIANTS`, and must stay within `CUSTOM_RANGE`.
- **Shopify property keys:** never rename the native keys (`__shopify_send_gift_card_to_recipient`, `Recipient email`, `Recipient name`, `Message`, `Send on`). Prefix merchant-only properties with `_`. All property values are strings. Placeholder variant IDs (`441000000xx`) must never ship.
- **Text limits:**

  | Field | Limit | Constant |
  |---|---|---|
  | Gift-card message | 200 | `MESSAGE_MAX` |
  | Gift-wrap message | 200 | `MAX` |
  | Order note | 500 | — |
  | Engraving | 18 | — |

  Enforce them in `onChange` and keep the visible counters in sync.

## Quick-add paths

CompleteTheLook, Wishlist "Add all", VideoViewer, CartUpsell and TryOnStudio must **not** add pieces that need configuration: rental dates, personalization text, ring size, or custom commissions. Since 2026-10-21 one rule decides it, in `src/data/catalog.ts`: `needsSize(p)` (ring types), `needsConfig(p)` and `quickAddable(p)` (also false for the vault's rent-first pieces). Use them; never write a local variant. CompleteTheLook adds the page's own piece through the PDP's validation (`onAddMain`).

## Designed rings (2026-10-22)

- A ring from the designer is a line `{ slug: DESIGN_SLUG ('bespoke-engagement-commission'), size, design: designCode(design) }`. The code is the ring as made (`canonical`: choices that don't apply are reset), so identical rings stack; never put the visitor's own `encodeDesign` code (the address's) in a line, a visit or a saved design.
- `CartLine.design` ends `lineKey` only when present, so other lines keep their stored keys. `linePrice` prices it with `ringPrice(decodeDesign(design), currency)` (`src/data/ringPrice.ts`, cost-plus × 1.34 to the nearest 10 CAD, USD by `toUSD`), and so do the try-on and Account. Never price a design any other way: the designer's statement (`priceRing`) reconciles to the same number, its margin being the remainder.
- Stored codes are checked with `isDesignCode` when the store reads them back (`tns-cart`, `tns-designs`, `tns-design-draft`): a line or design that fails is dropped, never priced at 0. The code format is a contract: lists only grow at their end; anything else takes a new version character.
- A designed ring is paid in two parts (owner, 2026-10-22): `designDeposit(price)` (30%, `DEPOSIT_SHARE`, to the nearest ten) at checkout, the rest on approval of the final design. `useCartTotals()` gives `balance` (what designs leave for later, before tax), `dueNow` and `taxAt(rate)` (`{ total, now, later }`, adding up to the bag's one rounding). Gift cards pay only what is due today. Show a deposit only through `designDeposit`; never compute a share by hand. Beside a balance, the bag hides its Shop Pay instalments line (`installment` is a quarter of the whole `subtotal`); the drawer's figure is "Due today, before tax".
- A designed ring needs a size before it goes in the bag: the designer sends a sizeless "Add to bag" to its size step, and the try-on offers "Choose your size" instead (its `add` refuses a sizeless design).
- Show a design line through `lineDetails` (the size from the code) and `designedLine(line, designs)` (`src/components/lineDetails.ts`): its title and picture as designed, no struck-through `fullPrice`, Edit → `href.designer({ r: code, edit: '1' })`, where "Update the bag" replaces the line and keeps its quantity.

## Rent or own and card prices (2026-10-21)

- A piece with `rental` rates can be rented **and** bought (`isRentable`); the vault's own pieces lead with renting (`rentFirst`). Rental and purchase lines stay separate in the bag (`lineKey` includes `rental`).
- Cards, rails, the menu and search show `cardPrice(p, currency)` (the opening price at `metals[0]`, or the weekend rate for rent-first pieces); never `priceFor(p, currency)` without a metal, which disagrees with the PDP (KI-021).
- `getProductsByCategory(slug)` includes `alsoIn` pieces and, for `rentals`, every rentable piece.

## Catalog data (`src/data/catalog.ts`)

- **Ids:** `tns-<code>-NNN`, with codes nk, er, br, rg, bd, wt, rn, gf, cs.
- **Slugs:** kebab-case and stable, since they become Shopify handles.
- **Prices:** `price: p(CAD)`, or `p(CAD, USD)` to override USD.
- **Images:** from the `IMG` map, in order: the piece, on the body (in scale), a detail. Each piece has its own matching photos; don't reuse another piece's first photo.
- **`type`** (required, Shopify's product type) drives filters, signatures and `needsSize`; **`alsoIn`** lists other chapters that show the piece.
- **`metals[0]`** is the PDP default, the quick-add metal and the card price (`openingPrice`).
- **Category copy and imagery** live only in `CATEGORIES` (English) and `CATEGORY_FR` (French). Never special-case them in pages.
- **French catalog copy** for each product goes in `PRODUCT_FR` in `src/data/catalog.fr.ts` (name, tagline, description, specs by English key, personalization labels). Display through `useCatalog()`; tax names through `provinceName`, `taxName`, `stateName` and `taxLabel` in `src/data/tax.ts`.
- **Name-based heuristics:** `tryOnKind`, `mediaPoolFor`, overlay drawing and costing findings all key off product **English names** via regex. Re-check them when you rename or add products, and never feed them translated names.
- **Undo guard:** keep the `prev.some(...)` duplicate guard in `undoRemove`, because StrictMode double-invokes updaters.
