# Shopify integration map & porting notes

> **Scope.** This repo is a UI/design prototype and does not integrate with Shopify (see `.claude/rules/project.md`). The mapping and recipes below are reference material for the owner's separate theme build. They are not tasks for this repo.

The prototype contains exactly one Shopify-shaped contract in code: `toShopifyCartItem()` in `src/lib/shopify.ts`. It converts a gift-card `CartLine` into an Ajax Cart API `/cart/add.js` item (variant ID, quantity and line-item properties, including Shopify's native gift-card recipient keys), but its output is only logged to the console when an order is placed, it is never sent anywhere, and it returns `null` for every jewellery line. Everything else Shopify would own (cart, checkout, customer accounts, gift-card issuing and balances, currency and markets, tax) is simulated locally with React Context and `localStorage`. Part A records those facts; Part B is a separately labelled porting plan covering concept → Shopify primitive, page → Online Store 2.0 template, Home section → theme section, what needs an app, and which data belongs in metafields or metaobjects.

Scope: `src/lib/shopify.ts`, `src/store.tsx`, `src/data/giftcards.ts`, `src/data/catalog.ts`, `src/pages/GiftCards.tsx`, `src/pages/Checkout.tsx`, `src/pages/Cart.tsx`, `src/components/cart/GiftOptions.tsx`, `src/components/lineDetails.ts`, plus a sweep of every `src/**/*.{ts,tsx}` file (all pages, `src/components/**`, `src/data/costing.ts`, `src/data/media.ts`, `src/data/tax.ts`). Root `index.html`, `package.json` and `vite.config.ts` contain no Shopify references.

> **How to read this page.** **Part A** states only what the code does. **Part B** is recommendation: none of it exists in the repo. Some Part B claims about Shopify platform behaviour can't be checked from this repository. Those are marked **(verify)**.

---

## Part A — Facts from the code

### A1. Integration surface at a glance

| Symbol | File | Exported | What it is |
|---|---|---|---|
| `ShopifyCartItem` | `src/lib/shopify.ts` | yes (interface) | One Ajax Cart item: `id`, `quantity`, `properties` |
| `toShopifyCartItem(line)` | `src/lib/shopify.ts` | yes | Gift-card `CartLine` → `ShopifyCartItem`; returns `null` when `line.giftCard` is absent |
| `isGiftCardLine(line)` | `src/lib/shopify.ts` | yes | Boolean gift-card test; **never imported anywhere** |
| `GIFT_CARD_VARIANTS` | `src/lib/shopify.ts` | no | 12 placeholder variant IDs keyed `` `${currency}-${amount}` `` |
| `GIFT_CARD_ONE_UNIT_VARIANT` | `src/lib/shopify.ts` | no | `44100000099`, the "$1 variant" used for custom amounts |
| `GiftCardLine` | `src/data/giftcards.ts` | yes | Payload carried on `CartLine.giftCard`; documented as mapping "1:1 to Shopify gift card recipient properties" |
| `CartMeta` | `src/store.tsx` | yes | Order-level options documented as mapping "to Shopify cart `note` and `attributes`" |
| `IssuedCard`, `loadLedger`, `saveLedger`, `lookupCard`, `issueCards`, `debitCards` | `src/data/giftcards.ts` | yes | `localStorage` ledger "standing in for Shopify's gift card balances" |

`src/lib/shopify.ts` imports `type CartLine` from `../store`, `getProduct` from `../data/catalog` and `DESIGNS` from `../data/giftcards`. Its only importer is `src/pages/Checkout.tsx`, which imports `toShopifyCartItem` alone.

### A2. `toShopifyCartItem()`: the gift-card `/cart/add.js` item

```ts
export interface ShopifyCartItem {
  id: number
  quantity: number
  properties: Record<string, string>
}

export function toShopifyCartItem(line: CartLine): ShopifyCartItem | null
```

#### Algorithm (source order)

1. `const g = line.giftCard`. If absent, return `null`. There is no payload for jewellery lines.
2. `` const key = `${g.currency}-${g.amount}` ``, then `const fixed = GIFT_CARD_VARIANTS[key]` (a number or `undefined`).
3. `properties` starts with `_design` and `_delivery`.
4. Recipient branch (matrix below).
5. `_From` is added in every branch when `g.senderName` is truthy.
6. Return `{ id: fixed, quantity: line.qty, properties }` when `fixed` exists. Otherwise return the $1-unit form (A4).

Branch and return, verbatim:

```ts
  if (!g.toSelf && g.delivery === 'email') {
    // Native Shopify gift card recipient fields.
    properties.__shopify_send_gift_card_to_recipient = 'on'
    if (g.recipientEmail) properties['Recipient email'] = g.recipientEmail
    if (g.recipientName) properties['Recipient name'] = g.recipientName
    if (g.message) properties.Message = g.message
    if (g.sendOn) properties['Send on'] = g.sendOn
  } else if (!g.toSelf) {
    if (g.recipientName) properties['Recipient name'] = g.recipientName
    if (g.message) properties['Card message'] = g.message
  }
  if (g.senderName) properties['_From'] = g.senderName
  return fixed
    ? { id: fixed, quantity: line.qty, properties }
    : { id: GIFT_CARD_ONE_UNIT_VARIANT, quantity: g.amount * line.qty, properties: { ...properties, _amount: String(g.amount) } }
```

#### Property keys (verbatim)

| Key | Prefix | Set when | Value |
|---|---|---|---|
| `_design` | `_` | always | `DESIGNS.find((d) => d.id === g.design)?.name ?? g.design`, so `Travertine`, `Espresso`, `Vermeil` or `Mont-Royal` (the raw id if unknown) |
| `_delivery` | `_` | always | `'Physical card, mailed'` when `g.delivery === 'physical'`, else `'Digital, by email'` |
| `__shopify_send_gift_card_to_recipient` | `__shopify_` | `!g.toSelf && g.delivery === 'email'` | `'on'` |
| `Recipient email` | none | same branch, if `g.recipientEmail` | raw email |
| `Recipient name` | none | same branch, if `g.recipientName`; **also** in the physical-for-someone-else branch | raw name |
| `Message` | none | email-for-someone-else, if `g.message` | raw text |
| `Send on` | none | email-for-someone-else, if `g.sendOn` | `yyyy-mm-dd` |
| `Card message` | none | physical-for-someone-else (`!g.toSelf`, delivery not email), if `g.message` | raw text |
| `_From` | `_` | any branch, if `g.senderName` | raw name |
| `_amount` | `_` | custom amount only (no fixed variant) | `String(g.amount)`: the value of one card |

Key insertion order: `_design`, `_delivery`, then the branch keys in table order, then `_From`, then `_amount`.

#### Branch matrix

| `toSelf` | `delivery` | Recipient keys emitted | What happens to `message` |
|---|---|---|---|
| `false` | `'email'` | `__shopify_send_gift_card_to_recipient`, `Recipient email`, `Recipient name`, `Send on` (only if set) | sent as `Message` |
| `false` | `'physical'` | `Recipient name` | sent as `Card message` |
| `true` | either | none | **dropped** (not in the payload) |

#### Illustrative payloads

These were built by following the code paths; the names and emails are invented.

```jsonc
// CAD 250 · Travertine · email to someone else · scheduled · from "Marc" · qty 2
{ "id": 44100000002, "quantity": 2, "properties": {
  "_design": "Travertine", "_delivery": "Digital, by email",
  "__shopify_send_gift_card_to_recipient": "on",
  "Recipient email": "sofia@example.com", "Recipient name": "Sofia",
  "Message": "Joyeux anniversaire", "Send on": "2026-10-20", "_From": "Marc" } }

// CAD 750 (custom amount) · Mont-Royal · physical card for someone else · qty 1
{ "id": 44100000099, "quantity": 750, "properties": {
  "_design": "Mont-Royal", "_delivery": "Physical card, mailed",
  "Recipient name": "Paul", "_amount": "750" } }
```

### A3. Placeholder variant IDs (verbatim)

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

| Denomination | CAD key → ID | USD key → ID |
|---|---|---|
| 100 | `CAD-100` → `44100000001` | `USD-100` → `44100000011` |
| 250 | `CAD-250` → `44100000002` | `USD-250` → `44100000012` |
| 500 | `CAD-500` → `44100000003` | `USD-500` → `44100000013` |
| 1000 | `CAD-1000` → `44100000004` | `USD-1000` → `44100000014` |
| 2500 | `CAD-2500` → `44100000005` | `USD-2500` → `44100000015` |
| 5000 | `CAD-5000` → `44100000006` | `USD-5000` → `44100000016` |
| any other amount | → `44100000099` | → `44100000099` |

The table covers exactly the six `DENOMINATIONS` in `src/data/giftcards.ts`, which are `[100, 250, 500, 1000, 2500, 5000]` for both CAD and USD. The code doesn't say whether the 12 IDs belong to one product (for example, currency × denomination options) or to two products.

### A4. The $1-unit custom-amount pattern

- A line counts as "custom" when its key misses `GIFT_CARD_VARIANTS`, which means any `amount` outside the six denominations. The key ignores how the amount was entered. Typing `500` into the custom field produces `CAD-500` or `USD-500`, so the fixed variant is used.
- The quantity is `quantity = g.amount * line.qty`, the total currency units across every card on the line. `_amount = String(g.amount)` is the value of one card, so the number of cards is `quantity / Number(_amount)`.
- Amount bounds come from `CUSTOM_RANGE` (`CAD: [50, 10000]`, `USD: [50, 7500]`). Only `GiftCards.submit` enforces them, and it checks preset denominations too.
- The custom input keeps digits only, up to 5 characters (`e.target.value.replace(/\D/g, '').slice(0, 5)`). The stored amount is `Math.round(value)`.
- Example: two CAD 750 custom cards give `{ id: 44100000099, quantity: 1500, properties: { …, _amount: '750' } }`.

### A5. `isGiftCardLine`

```ts
export const isGiftCardLine = (line: CartLine) => !!line.giftCard || getProduct(line.slug)?.slug === 'gift-card'
```

- Returns true when the line carries a `giftCard` payload, or when its slug resolves to the catalog product `'gift-card'`. The slug is a hard-coded literal, not `GIFT_CARD_SLUG`.
- **It is never imported or called.** Other code detects gift cards inline:
  - `l.giftCard` truthiness in `Checkout` (`giftLines` / `merchLines`), `useCartTotals` (`merch` / `giftCards` / `hasMerch`), `CartLineItem` and `lineDetails`.
  - Slug checks `p.slug !== 'gift-card'` in `CartUpsell` and in Wishlist "Add all to bag".
  - `parseHash` sends `#/p/gift-card` to the `giftcards` route.
  - `tryOnKind` excludes names matching `/gift card|redesign/`.
  - `hasCostBreakdown` excludes the gift card because it has `metals: []`.

### A6. `GiftCardLine` and how the builder fills it

```ts
/** Line item payload for a gift card; maps 1:1 to Shopify gift card recipient properties. */
export interface GiftCardLine {
  amount: number
  currency: Currency
  design: string
  delivery: GiftDelivery
  toSelf: boolean
  recipientName?: string
  recipientEmail?: string
  senderName?: string
  message?: string
  sendOn?: string // yyyy-mm-dd
}
```

`GiftCards.submit` in `src/pages/GiftCards.tsx` builds it as follows:

| Builder control (verbatim UI text) | `GiftCardLine` field | When / how it is stored | Shopify key from `toShopifyCartItem` |
|---|---|---|---|
| "01 Design" swatches (`DESIGNS`) | `design` (id) | always | `_design` (display name) |
| "02 Amount" buttons, or the input with placeholder `Custom amount, {min}–{max}` | `amount` | `Math.round(custom ? Number(custom) : amount)` | variant `id`, or `_amount` plus `quantity` |
| store currency (`useStore().currency`) | `currency` | always | variant key prefix |
| "03 Delivery": "By email" / "Physical card" | `delivery` | always | `_delivery` |
| "04 Recipient": "For someone else" / "For me" | `toSelf` | always | gates the recipient keys |
| input "Recipient name" | `recipientName` | `toSelf ? undefined : recipientName.trim()` | `Recipient name` |
| input "Recipient email" | `recipientEmail` | only when `!toSelf && delivery === 'email'` | `Recipient email` |
| date "Send on" (`min` today, `max` today + 365) | `sendOn` | only when `!toSelf && delivery === 'email' && sendOn !== today` | `Send on` |
| textarea "Add a personal message (optional)", at most `MESSAGE_MAX` = 200 characters | `message` | `message.trim() \|\| undefined`, also stored when `toSelf` | `Message`, `Card message` or dropped |
| input "From (your name)" | `senderName` | `senderName.trim() \|\| undefined` | `_From` |
| quantity stepper (`−` / `+`, 1–20) | none (line `qty`) | `addToCart` is called `qty` times | `quantity` |

Validation runs before the line is built. Errors appear in a `role="alert"` list:

- Amount outside `CUSTOM_RANGE[currency]`, or not finite: `` `Choose an amount between ${formatPrice(min, currency)} and ${formatPrice(max, currency)}.` ``
- Name missing when not `toSelf`: `Add the recipient’s name.`
- Email failing `/^\S+@\S+\.\S+$/` when not `toSelf` and delivery is email: `Add a valid recipient email.`

Adding uses `for (let i = 0; i < qty; i++) addToCart({ slug: GIFT_CARD_SLUG, giftCard: line })`. `lineKey` includes `JSON.stringify(line.giftCard ?? '')`, so identical cards stack into one `CartLine` whose `qty` grows by 1 per call. Each call also opens the cart drawer.

### A7. `CartMeta` → cart `note` / `attributes`

```ts
/** Order-level options; map to Shopify cart `note` and `attributes`. */
export interface CartMeta {
  giftWrap: boolean
  giftReceipt: boolean
  giftMessage: string
  note: string
}
```

| Field | Default | Edited in `GiftOptions` (verbatim UI) | Limit | Also read by |
|---|---|---|---|---|
| `giftWrap` | `false` | checkbox "Gift wrapping", described as "Travertine box, silk ribbon, handwritten card", tagged "Free" | none | `CartDrawer` footer appends ` Gift wrapped.`; the Cart page summary shows the row "Gift wrapping" → "Complimentary" |
| `giftMessage` | `''` | textarea, shown only while `giftWrap` is on; placeholder "Your message, handwritten by our team", `aria-label="Gift message"`, counter `{n}/200` | `.slice(0, 200)` (`MAX`) | none |
| `giftReceipt` | `false` | checkbox "Gift receipt", described as "Prices hidden on the packing slip", tagged "Free" | none | none |
| `note` | `''` | collapsible "Order note" with placeholder "Delivery instructions, a surprise to keep, anything we should know" and `aria-label="Order note"` | `.slice(0, 500)` | none |

#### Lifecycle

- On load, state is `{ ...DEFAULT_META, ...load('tns-cart-meta', {}) }`.
- Every change is written to `localStorage['tns-cart-meta']`.
- `setMeta(patch)` shallow-merges the patch.
- `clearCart()` resets the state to `DEFAULT_META`. It is called by `Checkout.placeOrder` and by the Cart page's "Clear bag" after `window.confirm('Remove everything from your bag?')`.
- Unticking gift wrapping hides the message box but doesn't clear `giftMessage`.
- `GiftOptions` accepts `defaultOpen?: boolean`, which opens the note on mount; the note also opens when `meta.note` is non-empty. Both callers (`CartDrawer` and `Cart`) render `<GiftOptions />` without this prop.

**Facts by absence:** no attribute key names are defined anywhere, `Checkout.tsx` never reads `meta`, and no payload includes `CartMeta`.

### A8. Call sites: where the mapping is (and isn't) used

| Symbol | Used in | Effect |
|---|---|---|
| `toShopifyCartItem` | `src/pages/Checkout.tsx` → `placeOrder` only | `giftLines.map(toShopifyCartItem)`, then `console.info('[Shopify] gift card cart items', shopifyItems)` when the array is non-empty. Nothing is sent; no `fetch` or XHR exists anywhere in `src`. |
| `toShopifyCartItem` | **not** in `GiftCards.submit`, `CartDrawer`, `Cart` or `CartLineItem` | Adding a gift card to the bag produces no Shopify payload. |
| `isGiftCardLine` | nowhere | dead export |
| `ShopifyCartItem` | `src/lib/shopify.ts` only | none |
| `CartMeta` / `setMeta` | `src/store.tsx`, `GiftOptions`, `CartDrawer`, `Cart` | local only |

`placeOrder` runs in this order:

1. `e.preventDefault()`.
2. Build and log `shopifyItems`, preceded by the comment `// In a live theme these are the /cart/add.js payloads for gift card lines.`
3. `debitCards(...)` for applied codes with `use > 0`.
4. `issueCards(giftLines.map((l) => l.giftCard!), giftLines.map((l) => l.qty))`.
5. Pair each issued card with its line.
6. `` setPlaced({ order: `TS-${Date.now().toString().slice(-6)}`, issued, paidWithCards: cardsTotal }) ``.
7. `clearCart()`.

Because `giftLines = cart.filter((l) => l.giftCard)`, `null` never appears in `shopifyItems`.

### A9. Every Shopify-referencing code comment (verbatim)

| File | Context | Comment |
|---|---|---|
| `src/lib/shopify.ts` | file header | `// Shopify Ajax Cart API mapping. In a live theme these payloads are POSTed to /cart/add.js;` and `// here they document the exact shape so the front end can be wired to Shopify without changes.` |
| `src/lib/shopify.ts` | `GIFT_CARD_VARIANTS` | `/** Placeholder variant IDs; replace with the store's real IDs when connecting. */` |
| `src/lib/shopify.ts` | `GIFT_CARD_ONE_UNIT_VARIANT` | `/** Custom amounts use a $1 variant multiplied by quantity, a common Shopify pattern. */` |
| `src/lib/shopify.ts` | email branch of `toShopifyCartItem` | `// Native Shopify gift card recipient fields.` |
| `src/store.tsx` | `CartMeta` | ``/** Order-level options; map to Shopify cart `note` and `attributes`. */`` |
| `src/data/giftcards.ts` | file header | `// Gift cards, modelled on Shopify's native gift card product:`, `// one product with a variant per denomination, recipient details carried as line item properties,` and `// and 16-character codes redeemed at checkout.` |
| `src/data/giftcards.ts` | `GiftCardLine` | `/** Line item payload for a gift card; maps 1:1 to Shopify gift card recipient properties. */` |
| `src/data/giftcards.ts` | `ALPHABET` / `generateCode` | `// Codes: 16 characters, Shopify style, without ambiguous characters.` |
| `src/data/giftcards.ts` | `IssuedCard` | `// Local ledger standing in for Shopify's gift card balances.` |
| `src/pages/Checkout.tsx` | `placeOrder` | `// In a live theme these are the /cart/add.js payloads for gift card lines.` (the log tag is `'[Shopify] gift card cart items'`) |

Several comments describe rules that match platform behaviour without naming Shopify:

- `src/pages/Checkout.tsx`: `// Gift cards are not taxed at sale; tax applies to merchandise only.` and `// Gift cards can pay for merchandise and tax, but not for other gift cards.`
- `src/data/giftcards.ts`: `expiresAt: string | null // Québec & most provinces: no expiry` and `/** Deducts applied amounts (in checkout currency) from card balances. */`

### A10. Shopify-facing customer copy (verbatim)

| File / context | Copy |
|---|---|
| `src/pages/Account.tsx`, signed-out form | "Accounts are managed through Shopify Customer Accounts." |
| `src/pages/Checkout.tsx`, above the submit button | "Payment is completed securely through Shopify Checkout. ", then for CAD "Orders ship insured via signature-required courier." or for USD "Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required." |
| `src/pages/Checkout.tsx`, summary (USD) | "Sales tax" → "Calculated by Shopify" |
| `src/components/CartDrawer.tsx` footer; `src/pages/Cart.tsx` summary | "Or 4 interest-free payments of {Price(installment)} with Shop Pay" (`installment = Math.round(subtotal / 4)`), hidden when a designed ring leaves a balance |
| `src/pages/Product.tsx`, price block (non-rental, `amount >= 400`) | "Or 4 interest-free payments of {Price(Math.round(amount / 4))} with Shop Pay · " |
| `src/components/pdp/ProductFAQ.tsx`, item `pay` | "Can I pay in instalments?" → "Yes — Shop Pay Installments lets you split your purchase into four interest-free payments, or monthly plans on orders over $1,000, subject to approval." |
| `src/pages/Cart.tsx`, summary | "Gift cards and promo codes can be applied at checkout." |
| `src/pages/GiftCards.tsx`, "How it works" → Redeem | "Enter the 16-character code at checkout, or present it in our salon." |
| `src/pages/GiftCards.tsx`, under the CTA | "Gift cards are not taxed at purchase and cannot be paid for with another gift card." |
| `src/pages/GiftCards.tsx`, FAQ item `currency` | "Cards are issued in the currency you buy them in. If redeemed in the other market, the balance converts at the rate shown at checkout." |
| `src/pages/Checkout.tsx`, `applyCode` error | "Gift cards can’t be used to buy other gift cards." |
| `src/pages/Account.tsx`, market panel | "Preferred market" with "Sets currency, taxes and shipping options." |

### A11. State the prototype keeps in `localStorage` that Shopify would own

| Key | Written by | Shape | Notes |
|---|---|---|---|
| `tns-cart` | `StoreProvider` (`src/store.tsx`) | `CartLine[]` | written on every change; a parse error loads `[]` |
| `tns-cart-meta` | `StoreProvider` | `CartMeta` | merged over `DEFAULT_META` on load |
| `tns-currency` | `setCurrency` | raw `'CAD'` or `'USD'` string | defaults to `'CAD'` |
| `tns-account` | `StoreProvider` | `Account`: `{ name, email }` | removed on `signOut`; the password field is never read |
| `tns-wishlist` | `StoreProvider` | `string[]` of slugs | none |
| `tns-recent` | `recordView` | `string[]` of slugs, newest first, at most 12 | none |
| `tns-searches` | `rememberSearch` | `string[]` of followed searches, newest first, at most 5 | none; theme JS keeps it in `localStorage` too |
| `tns-designs` | `saveDesign` | `SavedDesign[]`: `{ code, image, saved }`, newest first, at most 12 | codes checked with `isDesignCode` on read; kept without pictures when storage is full. A customer metafield or app data would hold them across devices |
| `tns-design-draft` | `setDesignDraft` | a design code (the visitor's own, `encodeDesign`) | the ring the designer reopens; device-local in a theme too |
| `tns-giftcard-ledger` | `saveLedger` (`src/data/giftcards.ts`) | `IssuedCard[]` | `loadLedger` prepends the demo card `TERESASONS1962MT` (CAD 250) when it is missing |
| `tns-reviews-<slug>` | `saveMine` (`src/components/pdp/Reviews.tsx`) | review objects, image media only | none |

### A12. What is not shaped for Shopify (facts by absence)

- There is no network I/O in `src`. The `console.info` in A8 is the only output tagged for Shopify.
- Jewellery has no Shopify identifiers. `Product.id` is a string such as `'tns-nk-001'`, shown on the PDP as `Ref. TNS-NK-001` and as "Reference" in the specs accordion. There are no variant objects. `metal`, `size`, `rental`, `engraving`, `booking` and `personalization` are free fields on `CartLine`, priced by `linePrice` in `src/store.tsx`.
- No code maps `metal`, `size`, `engraving`, `personalization`, `rental` or `booking` to anything Shopify.
- A designed ring (2026-10-22) is a `CartLine` `{ slug: 'bespoke-engagement-commission' (DESIGN_SLUG), size, design }` whose `design` is a code (`designCode`, see [features/ring-designer.md](features/ring-designer.md) §2.3). Its price comes from `ringPrice(decodeDesign(design), currency)`, not from a variant: the commission product's own price (5,000 CAD, “a starting deposit”) is not used for it.
- The repo has no Liquid, section schemas, metafield or metaobject names, Storefront or Admin API clients, selling plans, or discount logic.
- Routing uses hash URLs from `href` (`#/c/:slug`, `#/p/:slug`, …). Product and category `slug`s are kebab-case.
- Money is in whole currency units; the catalog header reads `// Teresa & Sons — product catalog (Montreal, CA). Prices in whole currency units.` `formatPrice` uses `Intl.NumberFormat` (`en-CA` for CAD, `en-US` for USD) with `maximumFractionDigits: 0`. USD values are derived with `CAD_TO_USD = 0.73`.
- Checkout is an in-app page (`src/pages/Checkout.tsx`) with its own tax (`PROVINCES` rates, CAD only), gift-card redemption and order number. See [pages/cart-and-checkout.md](pages/cart-and-checkout.md) and [commerce-logic.md](commerce-logic.md).

---

## Part B — Recommendations (not implemented)

Everything below is a proposal for a future Online Store 2.0 theme. The section, metafield and property names are suggestions.

### B1. App concept → Shopify primitive

| App concept | Source in code | Recommended Shopify primitive | Notes |
|---|---|---|---|
| Piece of jewellery | `Product` / `PRODUCTS` | Product: handle = `slug`, title = `name`, description = `description`, SKU prefix = `id` | 27 entries. `gift-card` becomes the gift-card product. |
| Category (single-valued) | `Product.category`, `CATEGORIES` | Collection (handle = category slug) **plus** a single-valued field such as `product.type` or a `collection_reference` metafield | `category` drives behaviour: size is required for `rings`/`bridal`, `custom` gets "Begin commission", and it selects FAQ and craft copy and costing defaults. Shopify collections are many-to-many, so keep a single-valued field for the logic and build automated collections on it. |
| Product line | `Product.collection` (e.g. `Mont-Royal`, `Rental Vault`) | product metafield | Shown as the PDP eyebrow and as "The {collection} story". |
| Metal | `Product.metals`, `METALS.priceDeltaCAD` | variant option "Metal" | Variant price = base + delta: platinum +650 CAD / +475 USD, vermeil −400 CAD / −292 USD, 18k golds 0. |
| Ring size | `CartLine.size`, `RING_SIZES` (4–9 in half sizes, 11 values) | variant option "Ring size", or a line-item property if sizes aren't stocked | Required only for `rings` and `bridal`. |
| Engraving | `CartLine.engraving` (≤ 18 chars) | line-item property | Labelled "Reverse engraving" when the product also has `personalization`. |
| Personalization | `Personalization` (`text`, `font`, `accent`, `chainLength`), `PersonalizationConfig` | Properties for text and lettering. The paid "Diamond accent" (+180 CAD / +130 USD) becomes a variant option or add-on product. Chain length becomes an option or a property. | `validatePersonalization` rules move to theme JS plus metaobject config. |
| Rental | `CartLine.rental`, `RentalRates` | A rental/booking app. Native fallback: variant option "Rental period" (Weekend / One week / One month) priced per period, plus booking properties. | Selling plans only work through an app that implements deferred purchase options **(verify)**. The deposit needs an app or a separate line. |
| Rental booking | `RentalBooking` (`start`, `slot`, `method`), `rentalReturnDate` | line-item properties (B7) plus app-owned availability | |
| Gift-card purchase | `GiftCardLine`, `toShopifyCartItem` | native gift-card product with denominations as variants and recipient properties | See A2–A4 and Notes. |
| Gift-card issuing, codes and balances | `issueCards`, `generateCode`, ledger, `debitCards`, `BalanceChecker` | Shopify-issued gift cards, redemption in Shopify Checkout, `templates/gift_card.liquid` | Shopify has no native storefront balance lookup, so this needs an app **(verify)**. |
| Gift wrap, gift receipt, gift message | `CartMeta` | cart attributes (B8) | |
| Order note | `CartMeta.note` | `cart.note` | |
| Cart line identity | `lineKey` | Shopify line-item `key` (variant + properties) | Shopify merges an identical variant with identical properties into one line, which matches `lineKey` stacking. |
| Cart persistence and operations | `tns-cart`, `addToCart`, `updateQty`, `removeLine`, `undoRemove` | Ajax Cart API (`/cart/add.js`, `/cart/change.js` where `quantity: 0` removes, `/cart.js`) plus the Section Rendering API for the drawer | Undo means re-adding the removed variant and properties; the line position may change **(verify)**. |
| Customer accounts | `Account`, `signIn`, `tns-account` | Shopify customer accounts: new (Shopify-hosted) or classic `templates/customers/*` | The existing copy already says accounts are "managed through Shopify Customer Accounts". |
| Wishlist | `wishlist`, `tns-wishlist` | a wishlist app, or a customer metafield (`list.product_reference`) written by an app, with `localStorage` for guests | Matches the copy "Saved on this device. Sign in to keep your wishlist across devices." |
| Recently viewed | `recent`, `recordView` (max 12) | stays client-side: `localStorage` of handles plus the Section Rendering API or `/products/<handle>.js` | No native equivalent. |
| Currency / market | `Currency`, `setCurrency`, `tns-currency`, `CAD_TO_USD` | Shopify Markets: Canada (CAD, primary) and United States (USD). Use `{% form 'localization' %}`; Liquid money filters render the presentment currency. | The app already treats currency as the market ("Sets currency, taxes and shipping options."). Fixed USD prices are needed to reproduce the round-to-5 in `p()`. |
| Tax | `PROVINCES`, `US_STATES`, `splitTaxes` | Shopify tax calculation at checkout | Keep the tables only for PDP and cart estimates. |
| US duties prepaid | Checkout, PDP and `Services` copy | Markets duties and import taxes collected at checkout (DDP) | Depends on plan and eligibility **(verify)**. |
| Shipping | "Complimentary insured shipping…" copy | shipping profiles with free rates; signature via carrier settings | |
| Shop Pay instalments | hard-coded `/ 4` copy | `{{ form \| payment_terms }}` in the product and cart forms | Renders only when the order is eligible. |
| Care-kit reward | `REWARD_THRESHOLD` (`CAD: 1000`, `USD: 750`), `RewardProgress` | automatic free-gift discount (or a Discount Function) plus a theme progress bar | Store the threshold per market as a theme setting. |
| Upsell, complete the look, related | `CartUpsell` (`PAIRS`), `getLookPieces`, "Also in {category}" | Search & Discovery complementary products plus the Product Recommendations API (`intent=complementary` / `related`) | |
| Reviews and ratings | `Reviews`, `getRatingSummary`, `tns-reviews-<slug>` | a reviews app that writes the standard `reviews.rating` and `reviews.rating_count` metafields | Don't import the synthetic reviews (Notes). |
| GIA report | `GiaSpec` | metaobject `gia_report` plus a product reference | |
| Specs | `Product.specs` | metafields (B10) | |
| Product images | `Product.images` (Unsplash URLs from `img()`) | product media rendered with the `image_url` filter | The current images are placeholders and must be replaced. |
| Brand films | `VIDEOS` (Mixkit placeholders) | video Files plus a `shoppable_video` metaobject with product references | |
| Cost transparency | `buildCostBreakdown`, `rentalLines` | theme JS fed by product metafields and a shop-level rates metaobject | |
| Badges | `Product.badges` | tags or a list metafield | The `Treasured` tabs filter on `Bestseller`, `New` and `Atelier Exclusive`. |
| Made-to-order lead time | `Product.leadTimeWeeks` | product metafield | |
| Try-on eligibility | `tryOnKind(p)` (name regex) | product metafield | |
| Order confirmation | `Confirmation` with order number `TS-xxxxxx` | Shopify order with an order-ID prefix, plus the Thank-you and Order status pages | |
| Appointment request | `Atelier` form | `{% form 'contact' %}` or a booking app | The current inputs have no `name` attributes; they need `contact[...]` names. |
| Newsletter | `Footer` form; register checkbox "Receive La Lettre and private sale invitations" | `{% form 'customer' %}` and `customer[accepts_marketing]` | |
| Announcement marquee | `announcements` in `Header` | announcement-bar section with blocks | |

### B2. Route → Shopify URL / Liquid object

| `href` key | Hash URL | Shopify URL | Liquid |
|---|---|---|---|
| `home` | `#/` | `/` | `routes.root_url` |
| `category(slug)` | `#/c/<slug>` | `/collections/<handle>` | `collection.url` |
| `product(slug)` | `#/p/<slug>` | `/products/<handle>` | `product.url` |
| `giftcards` | `#/gift-cards` (also `#/p/gift-card`) | `/products/gift-card` | the gift-card product's `url`, via a product setting |
| `cart` | `#/cart` | `/cart` | `routes.cart_url` |
| `checkout` | `#/checkout` | Shopify Checkout, reached by submitting the cart form with `name="checkout"` or via `/checkout` | none |
| `account` | `#/account` | `/account` | `routes.account_url`, `routes.account_login_url` |
| `wishlist` | `#/wishlist` | `/pages/wishlist` | `pages['wishlist'].url` |
| `atelier` | `#/atelier` | `/pages/atelier` | `pages['atelier'].url` |

### B3. Page → Online Store 2.0 template

| App route → component | Template(s) | Sections, in the app's render order | Notes |
|---|---|---|---|
| `home` → `Home` | `templates/index.json` | see B4 | none |
| `category` → `Category` | `templates/collection.json`; alternates `collection.gifts.json` and `collection.rentals.json` | `collection-hero` (image, title, French name, "Maison / Chapter {numeral}", description) → the gifts or rentals band → `main-collection-grid` (counter "{n} pieces · Prices in {currency}", "Try these pieces on", Sort) → `shoppable-videos` ("{Category} · in motion" / "Worn & filmed") → `recently-viewed` | The app shows the bands when `slug === 'gifts'` (gift-card promo) or `slug === 'rentals'` (four steps). Sort values `featured` / `low` / `high` map to `sort_by` `manual` / `price-ascending` / `price-descending`. "This chapter could not be found." goes to `templates/404.json`. |
| `product` → `Product` | `templates/product.json` (jewellery), `product.rental.json`, `product.personalized.json`, `product.commission.json` (`custom` category), `product.gift-card.json` | `main-product` (breadcrumb with `Ref.`, gallery, availability, collection · chapter, title, tagline, rating, price, description, configurator, CTA, try-on, "Book a viewing" / "Ask a jeweller", trust row, GIA panel, accordion) → `price-breakdown` → `craft-story` → `shoppable-videos` → `complete-the-look` → `reviews` → `product-faq` → `related-products` → `recently-viewed` → `sticky-atc` | `product.rental` = period picker, calendar, deposit and "Reserve this piece". `product.personalized` = Personalizer. `product.commission` = "Begin commission", made-to-order availability and no cost breakdown (`hasCostBreakdown` excludes `/commission\|redesign/i`). "This piece has returned to the vault." goes to 404. |
| `giftcards` → `GiftCards` | `templates/product.gift-card.json` assigned to the gift-card product, plus `templates/gift_card.liquid` (must stay Liquid) | hero → builder (`main-product` form with recipient fields) → how it works → balance (app block) → FAQ and corporate panel | `gift_card.liquid` is the issued-card page Shopify links to; port `GiftCardArt` there, driven by the `_design` property (`gift_card.properties`) **(verify)**. |
| `cart` → `Cart` | `templates/cart.json` | `main-cart-items` (header, lines, undo, "Gifting & notes" with the trust list) → `main-cart-footer` (summary) → `cart-upsell` → `recently-viewed` | `CartDrawer` becomes `sections/cart-drawer.liquid` (B5). |
| `checkout` → `Checkout` | none: Shopify Checkout | none | See B9. |
| `wishlist` → `Wishlist` | `templates/page.wishlist.json` | app block or custom JS section | "Copy link" only becomes meaningful with a server-side list. |
| `account` → `Account` | New customer accounts (Shopify-hosted), or classic `templates/customers/login.json`, `register.json`, `account.json`, `order.json`, `addresses.json`, `activate_account.json`, `reset_password.json` | dashboard tiles (Orders, Wishlist, Ring sizes, Care & servicing), gift-card wallet (app), recently viewed, market selector | With new customer accounts the theme can't render the dashboard; customization goes through customer account UI extensions **(verify)**. |
| `atelier` → `Atelier` | `templates/page.atelier.json` | hero → four process steps → `shoppable-videos` (only `@teresaandsons` films, dark tone) → appointment form | The form becomes `{% form 'contact' %}`; the "Interest" select options become a `contact[Interest]` field. |

### B4. Home sections → theme sections (`templates/index.json`)

The table follows the render order in `src/pages/Home.tsx`. The bridal editorial, rentals banner and heritage sections are written inline in `Home.tsx` rather than as components.

| # | Component | Proposed section | Settings / blocks | Data source |
|---|---|---|---|---|
| 1 | `HomeHero` | `hero-slideshow` | 3 `slide` blocks, each with eyebrow, three headline lines and an accent line (the code uses `italic: 1`), body, background image, nav label, a featured product (a `product` setting, plus which of its images to show; the name and GIA facts come from the product), and CTA label and link. Autoplay setting = 7 s (`DURATION`), with pause controls. | static, edited by the merchant |
| 2 | `PressStrip` | `press-marquee` | heading "As seen in"; 8 `publication` blocks | static |
| 3 | `CategoryIndex` | `collection-index` | index "01", eyebrow "Nine chapters", title, aside text, `collection_list` setting | `collection.metafields.custom.chapter_numeral`, `custom.french_name`, `collection.products_count`, `collection.image` |
| 4 | `Treasured` | `featured-collection-tabs` | 3 `tab` blocks (label + collection): Bestsellers / New arrivals / Atelier exclusives; limit 6; link "Continue the discovery" | tag-based automated collections |
| 5 | `TryOnFeature` | `try-on-feature` | copy, image, starting product (the code uses `vieux-port-diamond-studs`) | try-on JS (B9); eligible products via metafield |
| 6 | Bridal editorial (inline) | `editorial-split` | two images, "03 · Chapter V · Mariage", heading, body, three spec blocks (Cut Excellent · Color D – G · Clarity IF – VS2), CTAs "Explore bridal" and "Design your own" | static plus a bridal collection link |
| 7 | `FourCs` | `diamond-education` | 4 `c` blocks (key, title, body, scale list, highlighted range), image, index "04", two CTAs | static |
| 8 | `ShoppableVideos` (all `VIDEOS`) | `shoppable-videos` | eyebrow "Watch & shop", title, videos as `list.metaobject_reference`, tone | `shoppable_video` metaobjects |
| 9 | `GiftFinder` | `gift-finder` | 4 `budget` blocks (label, min, max), 5 `occasion` blocks (label, rule), index "05" | JSON of eligible products rendered by Liquid with prices in the presentment currency, or links to a filtered collection |
| 10 | `MakingScroll` | `making-scroll` | 5 `step` blocks (number, title, text, image); "06 · The making"; caption "Five stages · 40+ hours" | static; the GSAP horizontal pin (only at `(min-width: 1024px) and (prefers-reduced-motion: no-preference)`) moves to theme JS |
| 11 | `WatchSpotlight` | `collection-spotlight` | collection (watches), image with badge "Limited · 62 pieces", "07 · Chapter VI · Horlogerie", heading, body | `collection.products`; case and movement from spec metafields |
| 12 | Rentals banner (inline) | `rental-banner` | background image, "Chapter VII · La Location", heading, body, period labels (Weekend / One week / One month), CTA "View the rental vault" | rentals collection link |
| 13 | `Testimonials` | `testimonials` | 3 `quote` blocks (quote, author, location, piece); rating-line text; interval 6.5 s | static, or the reviews app's aggregate |
| 14 | Heritage (inline) | `editorial-quote` | two images, "08 · Chapter IX · Sur Mesure", quote, attribution "Antonio Moretti · Second generation", CTA "Commission a piece" | static |
| 15 | `RecentlyViewed` (index "—", eyebrow "Welcome back") | `recently-viewed` | heading settings, limit 4, hidden when empty | client-side |
| 16 | `Services` | `services-grid` | 6 `service` blocks (icon, title, text); separate Canada and US shipping texts | `localization.country.iso_code` |
| 17 | `SocialGrid` | `social-grid` | index "09", eyebrow "@teresaandsons", title, aside "Follow #PorteTeresa", 6 image blocks with optional links (the code's links are inert `#/` with `preventDefault`) | static or an Instagram app |
| 18 | `VisitSalon` | `visit-salon` | image, "Le Salon", heading, body, address, hours and phone, CTAs "Book an appointment" and "Get directions" | shop metafields or theme settings |

The hard-coded section numbers ("01"–"09", "—") become text settings.

### B5. Global chrome, cart and shared components → sections and snippets

| Component | Theme home | Notes |
|---|---|---|
| `Header` announcements (4 strings) | `sections/announcement-bar.liquid` in `sections/header-group.json` | Port the `Marquee` behaviour: a Web Animations API loop at a constant px/s, an eased hover stop, an off-screen pause, and no movement under reduced motion. |
| `Header` navigation and mega menu | `sections/header.liquid` (header group) | The menu comes from a `linklist`. Mega-menu columns use the collection description, the `chapter_numeral` / `french_name` metafields, the first 2 products and collection images. Add a "Gift Cards" item with the caption "From $100 · never expires". |
| Desktop menu (`menu/SiteMenu`) | A drawer in `sections/header.liquid`, built from `linklists.main-menu` | Rail = top-level links; a link with child links unfolds its panel (Shopify menus nest three levels). Previews use `collection.featured_image`, `collection.description`, `collection.products_count` and `collection.products \| slice: 0, 3`; a "from" price needs a metafield or a sorted query. Search maps to predictive search (`/search/suggest`, `resources[type]=product,collection,page`) through the Section Rendering API. The salon's hours and telephone become theme settings or a `salon` metaobject, and the open/closed line stays client-side. Recently viewed stays in `localStorage`. |
| Header search (`menu/HeaderSearch`, 2026-10-22) | `snippets/predictive-search.liquid` + a `<predictive-search>` custom element in `sections/header.liquid`; `templates/search.json` for `See all` | Fetch `/search/suggest?q={q}&resources[type]=query,product,collection,page&resources[limit]=4&section_id=predictive-search` and render its four resources as the dropdown's Suggestions, Pieces, Chapters and Elsewhere. Synonyms (hoops → huggies…) go into the Search & Discovery app; the exact landings ("studs" → the chapter filtered) are a theme setting or a metaobject list; price and renting phrases need theme JS that turns them into the search page's `filter.v.price.lte` / availability filters. Recent searches stay in `localStorage`. |
| Currency toggle "CA · CAD" / "US · USD" | `{% form 'localization' %}` country/market selector | Switching changes currency, tax and shipping together. |
| Account, wishlist and bag icons | `customer`, `routes.account_url`, app count, `cart.item_count` | The bag icon opens the drawer. |
| `Footer` | `sections/footer.liquid` in `sections/footer-group.json` | Newsletter via `{% form 'customer' %}`; Shop menu = collections; Maison links; salon address; "© {year} Teresa & Sons Joailliers Inc."; "Shipping to Canada (CAD) & United States (USD)". |
| `CartDrawer` | `sections/cart-drawer.liquid`, re-rendered through the Section Rendering API after each Ajax call | It contains `CartLineItem` (`snippets/cart-line-item.liquid`), `RewardProgress`, `UndoToast` (JS), `CartUpsell` (recommendations) and `GiftOptions` (attributes and note). |
| `Price` | `snippets/price.liquid` | `money_without_trailing_zeros` plus a currency-code `<span>` (matches `maximumFractionDigits: 0`). |
| `ProductCard`, `SectionHeader`, `Accordion`, `WishButton` | `snippets/product-card.liquid`, `snippets/section-header.liquid`, `snippets/accordion.liquid`, app/JS snippet | Rentals show "From" with the weekend rate. |
| `div.film-grain`, `SmoothScroll`, `useReveal` | `layout/theme.liquid` plus `assets/*.js` | Lenis and GSAP become theme assets. |
| `TryOnProvider` / `TryOnStudio` | app embed or `assets/try-on.js`, lazy-loaded | See B9. |

### B6. Product → options and variants

The "Proposed options → variants" column multiplies option counts. CAD prices are verbatim from `PRODUCTS`. For USD, apply `p()` for bases and the metal deltas from B1. See [data-model.md](data-model.md) for the full price data.

| Handle (`slug`) | Ref (`id`) | Category | Base CAD | Proposed options → variants | Line-item properties | Notes |
|---|---|---|---|---|---|---|
| `mont-royal-solitaire-pendant` | `tns-nk-001` | necklaces | 6850 | Metal ×3 → 3 | none | GIA |
| `riviere-saint-laurent` | `tns-nk-002` | necklaces | 38500 | Metal ×2 → 2 | none | none |
| `plateau-paperclip-chain` | `tns-nk-003` | necklaces | 2450 | Metal ×4 → 4 | Engraving | none |
| `vieux-port-diamond-studs` | `tns-er-001` | earrings | 8900 | Metal ×4 → 4 | none | GIA |
| `outremont-pearl-drops` | `tns-er-002` | earrings | 4200 | Metal ×2 → 2 | none | none |
| `mile-end-huggies` | `tns-er-003` | earrings | 1950 | Metal ×4 → 4 | none | none |
| `westmount-tennis-bracelet` | `tns-br-001` | bracelets | 14500 | Metal ×3 → 3 | none | none |
| `atwater-cuff` | `tns-br-002` | bracelets | 5600 | Metal ×3 → 3 | Engraving | none |
| `griffintown-chain-bracelet` | `tns-br-003` | bracelets | 1650 | Metal ×4 → 4 | Engraving | none |
| `teresa-signet` | `tns-rg-001` | rings | 3200 | Metal ×3 × Ring size ×11 → 33 | Monogram, Lettering, Reverse engraving | monogram personalization |
| `sherbrooke-emerald-cocktail` | `tns-rg-002` | rings | 21800 | Metal ×2 × Size ×11 → 22 | none | none |
| `laurier-stacking-band` | `tns-rg-003` | rings | 1350 | Metal ×4 × Size ×11 → 44 | none | none |
| `notre-dame-oval-solitaire` | `tns-bd-001` | bridal | 18900 | Metal ×4 × Size ×11 → 44 | Engraving | GIA |
| `basilique-emerald-cut-three-stone` | `tns-bd-002` | bridal | 26400 | Metal ×4 × Size ×11 → 44 | Engraving | GIA |
| `promesse-wedding-band` | `tns-bd-003` | bridal | 1450 | Metal ×4 × Size ×11 → 44 (132 if Width 2/4/6 mm becomes an option) | Engraving | widths appear only in the copy |
| `heritage-automatic-38` | `tns-wt-001` | watches | 7400 | Metal ×2 → 2 | Engraving | none |
| `chronographe-1962` | `tns-wt-002` | watches | 12900 | Metal ×2 → 2 | none | "Edition: 62 pieces" → track inventory |
| `dame-du-lac` | `tns-wt-003` | watches | 9600 | Metal ×2 → 2 | none | none |
| `gala-diamond-collar` | `tns-rn-001` | rentals | 92000 (retail) | Rental period ×3: 650 / 1400 / 3900 CAD (475 / 1020 / 2845 USD) | booking | deposit 5000 CAD / 3650 USD |
| `chandelier-sapphire-earrings` | `tns-rn-002` | rentals | 34000 (retail) | Rental period ×3: 320 / 720 / 1900 (235 / 525 / 1385 USD) | booking | deposit 2500 / 1825 USD |
| `bridal-tiara-and-drops` | `tns-rn-003` | rentals | 48000 (retail) | Rental period ×3: 480 / 1100 / 2800 (350 / 805 / 2045 USD) | booking | deposit 3500 / 2555 USD |
| `initial-disc-pendant` | `tns-gf-001` | gifts | 680 | Metal ×4 → 4 (12 if Chain length is an option) | Initial, Lettering, Reverse engraving | initial personalization |
| `pearl-stud-gift-set` | `tns-gf-002` | gifts | 540 | Metal ×2 → 2 | none | none |
| `gift-card` | `tns-gf-003` | gifts | 250 (USD 200) | gift-card product: Denomination ×6 (+ the $1 variant) | recipient keys (A2) | see A3–A4 and Notes |
| `bespoke-engagement-commission` | `tns-cs-001` | custom | 5000 ("starting deposit") | Metal ×4 → 4 | Engraving | lead time 8 weeks; `product.commission` |
| `heirloom-redesign` | `tns-cs-002` | custom | 1800 | Metal ×4 → 4 | none | lead time 6 weeks |
| `engraved-nameplate-necklace` | `tns-cs-003` | custom | 1250 | Metal ×4 × Diamond accent ×2 → 8 (24 with Chain length) | Your name, Lettering | lead time 3 weeks; engraving field hidden because the personalization has no `backEngraving` |

The largest product is 132 variants, which only matters if Width is added. Check it against the current per-product variant limit **(verify)**. Rentals use a single metal and the PDP never selects one, so they need no Metal option.

### B7. Proposed line-item properties for jewellery lines

| `CartLine` field | Shopify field | Visible key | Hidden companion | Value (mirrors `lineDetails`) |
|---|---|---|---|---|
| `metal` | variant option `Metal` | none | none | `METALS[metal].label`, e.g. `18k Yellow Gold`, `Platinum 950`, `Gold Vermeil` |
| `size` | variant option `Ring size`, or a property | `Ring size` | none | a `RING_SIZES` value such as `6.5` (the bag shows `Size 6.5`) |
| `engraving` | property | `Engraving`, or `Reverse engraving` when the product has `personalization` | none | raw text, ≤ 18 characters |
| `personalization.text` | property | `PersonalizationConfig.label`: `Your name`, `Initial` or `Monogram` | none | trimmed text |
| `personalization.font` | property | `Lettering` | `_font` (id) | `FONT_STYLES[font].label`: `Script`, `Serif` or `Block` |
| `personalization.chainLength` | option or property | `Chain length` | none | `16 in`, `18 in` or `20 in` |
| `personalization.accent` | variant option or add-on | `Diamond accent` | none | priced at +180 CAD / +130 USD |
| `rental` | variant option `Rental period` | none | none | `Weekend`, `One week` or `One month` (the PDP button labels); the bag shows `RENTAL_LABEL`: `Weekend rental`, `One-week rental`, `One-month rental` |
| `booking.start` and the derived return date | property | `Dates` | `_start`, `_return` (`yyyy-mm-dd`) | the bag shows `{formatDay(start)} → {formatDay(end)}` |
| `booking.method` | property | `Hand-off` | `_method` (`courier` / `salon`) | `Courier` or `Salon fitting` |
| `booking.slot` | property | `Delivery window` (courier) or `Fitting time` (salon) | none | one of `RENTAL_SLOTS`, e.g. `09:00 – 11:00` |
| deposit | separate line, or handled by an app | none | none | `RentalRates.deposit` |
| `design` (a designed ring) | properties on the commission line | `Design` (the title, `describeDesign(d).title`, e.g. `Oval diamond, 1.82 ct`), `Details` (its lines joined with ` · `), `Engraving`, `Lettering` | `_design` (the code) | the bag shows the title, the lines and `Size 6`; `Ring size` comes from the code's own size. The code is the contract: it decodes to every choice, so the atelier (or an app) rebuilds the ring from `_design` alone |

```liquid
<input type="text" name="properties[Engraving]" maxlength="18">
<input type="hidden" name="properties[_start]" value="2026-11-06">
```

Underscore-prefixed properties are hidden from customers at checkout, and themes conventionally skip them when rendering `line_item.properties`. Keep machine-readable values hidden and human labels visible.

### B8. Proposed cart attributes for `CartMeta`

| `CartMeta` field | Shopify field | Value when on | Clear when |
|---|---|---|---|
| `giftWrap` | `attributes['Gift wrap']` | `'Yes'` | unticked: send `''` |
| `giftMessage` | `attributes['Gift message']` | text, ≤ 200 characters | `giftWrap` is false (the app keeps the text; see Notes) |
| `giftReceipt` | `attributes['Gift receipt']` | `'Yes'` | unticked: send `''` |
| `note` | `cart.note` | text, ≤ 500 characters | none |

```js
fetch('/cart/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ note: meta.note, attributes: {
    'Gift wrap': meta.giftWrap ? 'Yes' : '', 'Gift message': meta.giftWrap ? meta.giftMessage : '',
    'Gift receipt': meta.giftReceipt ? 'Yes' : '' } }) })
```

Read them back in Liquid with `cart.attributes['Gift wrap']` and `cart.note`. They carry onto the order as note attributes and the order note. Hiding prices for a gift receipt is done in the packing-slip template **(verify which variables it exposes)**. A blank value removes the attribute **(verify)**.

### B9. What a Liquid theme can't do natively, and the options

| Capability | In code | Why it isn't native | Options |
|---|---|---|---|
| Camera virtual try-on | `TryOnProvider`, `TryOnStudio` (a lazy chunk, 22.40 kB in the current build), `JewelryOverlay`, `tryOnKind` | Liquid renders on the server. Try-on needs `getUserMedia`, pointer and pinch gestures, canvas compositing and per-product SVG overlays at runtime. | (a) Ship it as a theme JS module or app embed loaded on first click, as the current `lazy(() => import('./TryOnStudio'))` does. Bundle React, or rewrite it as a web component. Pass product data in a JSON `<script>` with a `custom.try_on_kind` metafield, and make "Add to bag" call `/cart/add.js` with the selected metal's variant. (b) Use a third-party AR try-on app. |
| Rental availability calendar | `RentalCalendar`, `getBookedDates`, `isBookingValid`, `RENTAL_DAYS` / `RENTAL_SLOTS` / `RENTAL_LEAD_DAYS` | Shopify inventory is a quantity, not a date ledger. Nothing stores bookings or blocks overlaps. | (a) A rental/booking app with a theme app block. (b) A custom app that stores bookings (metaobjects or a database), exposes booked dates through an app proxy or a product metafield, records bookings on `orders/create`, and blocks overlaps with a cart/checkout validation Function (plan rules **verify**). (c) Minimal: request-only booking properties confirmed by staff. |
| Rental deposit hold | `RentalRates.deposit`; `PriceBreakdown` copy "Card pre-authorisation · released within 48 h of return" | A theme can't hold a card authorisation for up to 30 days, and Shopify has no native deposit concept. | An app; a separate refundable deposit line; or deferred-purchase selling plans through an app **(verify)**. |
| Checkout page | `src/pages/Checkout.tsx` | Checkout is hosted by Shopify; themes can't render it. | Gift-card redemption, tax, duties, Shop Pay and shipping are native. Branding is set in the checkout editor. Checkout UI extensions in the information, shipping and payment steps are Plus-only, while Thank-you and Order status extensions work on all plans **(verify)**. Use Functions for discounts, validation and delivery. |
| Custom-amount gift cards | `CUSTOM_RANGE`, `GIFT_CARD_ONE_UNIT_VARIANT` | Gift-card products only offer fixed denomination variants. | An app, or limit the builder to denominations (see Notes on the $1 pattern). |
| Physical gift cards | `delivery: 'physical'` | Native gift cards are digital **(verify)**. | A separate shippable product with manual issuance, POS physical cards, or an app. |
| Gift-card balance check and wallet | `BalanceChecker`, the gift-card panel on the Account page | No storefront API returns a balance from a code **(verify)**. | An app, or a custom app using the Admin API behind an app proxy. Recipients can see the balance on the `gift_card.liquid` page. |
| Paid personalization add-on | `personalizationPrice` (Diamond accent) | Line-item properties can't change the price. | A variant option, an add-on product, or a Cart Transform Function (price updates are Plus-only **(verify)**). |
| A designed ring priced per design, paid as a deposit | `ringPrice` (cost-plus from the code), `CartLine.design`; `DEPOSIT_SHARE` (30%) and `designDeposit` in `src/data/ringPrice.ts`; `balance`, `dueNow` and `taxAt` in `useCartTotals` | A design has millions of combinations, so no variant can carry its price, and properties can't change a price. Shopify has no deposit on an ordinary line. | The prototype takes a 30% deposit at checkout and leaves the balance for the approval of the final design (owner decision, 2026-10-22: “whichever is best and enterprise grade”). In a theme: (a) a deposit selling plan on the designed-ring product (a `SellingPlan` whose `checkoutCharge` is a 30% percentage, the remaining balance collected when the design is approved: on the vaulted card from the order, or at a set time after checkout) **(verify)**, its line priced from `_design` by a Cart Transform (price updates are Plus-only **(verify)**); (b) an app that creates a draft order per design, with the deposit due now and the balance on approval **(verify)**; (c) without either, the commission's fixed starting deposit (5,000 CAD / 3,650 USD) with the design in `_design`, and the balance invoiced after the consultation. The design travels as `_design` in every case. |
| Live 3D ring try-on | `RingTryOn`, `fingerPose`, `handTracker` (MediaPipe hand landmarker), `tryOnStage` (three.js) | Hand tracking and 3D drawing run in the browser at camera rate; Liquid can't help. | A theme JS module loaded when a ring with a 3D model is tried on, as the prototype's lazy chunk is. Host MediaPipe's WASM and the `hand_landmarker.task` model with the theme (the prototype loads them from jsDelivr and Google's model storage), version-locked; ask for the camera only on the visitor's tap; keep the privacy line (nothing the camera sees leaves the device). The house rings it can build are those with a `PRESETS[].slug`; a metafield (`custom.ring_design`, the code) would let any ring product opt in. |
| Real-time 3D ring designer | `src/components/designer/three/*` (three.js's WebGPU renderer with its WebGL 2 fallback, TSL shaders; the lazy `stage` chunk and the shared three.js chunk) | Liquid renders on the server; the designer needs WebGPU or WebGL 2 and runs entirely in the browser. | A theme JS module loaded on the designer page only (a `page.ring-designer.json` template), as the prototype's lazy chunk is. It needs nothing from Shopify but the design code it writes to `_design` and the prices it computes; keep `ringPrice`'s rates in a metaobject so the theme and the house agree. |
| Cross-device wishlist | `tns-wishlist` | Shopify has no native wishlist. | An app, or a customer metafield written by an app. |
| Reviews with media upload | `Reviews` / `WriteReview` | Shopify has no native reviews. | A reviews app using app blocks and the `reviews.*` metafields. |
| Saved ring sizes | Account tile "Ring sizes" | Liquid can't write customer metafields. | An app, or a Customer Account API extension **(verify)**. |
| SPA behaviour (hash routing, persistent drawer, Lenis/GSAP) | `parseHash`, `SmoothScroll`, `useReveal` | Themes are multi-page. | Load JS assets per page and rehydrate the drawer from `/cart.js`. |
| Tax estimate before checkout | `PROVINCES` in the Cart page and `PriceBreakdown` | The Ajax cart returns no tax estimate **(verify)**. | Keep the static estimate table in theme JS, or drop it and show "Calculated at checkout". |

### B10. Data to move to metafields and metaobjects

| Source in code | Current shape | Proposed home | Type |
|---|---|---|---|
| `Product.tagline` | string | product `custom.tagline` | `single_line_text_field` |
| `Product.collection` | string | product `custom.line_name` (or a `line` metaobject carrying its story) | `single_line_text_field` |
| `Product.gia` | `GiaSpec` | metaobject `gia_report` {report_number, shape, carat, color, clarity, cut}, referenced by `custom.gia_report` | `metaobject_reference`; carat as `number_decimal` |
| `Product.specs` | ordered `Record<string, string>` | `custom.specs`, or a list of `spec_row` {label, value} metaobjects | `json` or `list.metaobject_reference` |
| `Product.badges` | `('New' \| 'Bestseller' \| 'Atelier Exclusive' \| 'Limited' \| 'Made to Order')[]` | tags, or `custom.badges` with choices | `list.single_line_text_field` |
| `Product.engravable` | boolean | `custom.engravable` | `boolean` |
| `Product.leadTimeWeeks` | number | `custom.lead_time_weeks` | `number_integer` |
| `Product.personalization` | `PersonalizationConfig` | metaobject `personalization_config` {kind, label, hint, min_length, max_length, allowed, fonts, accent_label, accent_price, chain_lengths, back_engraving}, referenced by `custom.personalization` | `metaobject_reference` |
| `Product.rental.deposit` | `Price` (CAD/USD) | `custom.rental_deposit` (per market, or `json` holding both values) | `money` or `json` |
| `Product.price` on rentals (retail value) | `Price` | `custom.retail_value` | `money` or `json` |
| `tryOnKind(p)` (derived from the name) | derived | `custom.try_on_kind` with choices necklace / earrings / ring / bracelet / watch | `single_line_text_field` |
| Costing inputs (`specs.Weight`, `DEFAULT_WEIGHT`, stone heuristics) | derived | `custom.metal_weight_g` and optionally `custom.cost_overrides` | `number_decimal`, `json` |
| `METAL_RATE`, `STONE_SHARE`, `MAKING_SHARE`, `LABOUR_RATE_CAD` | constants in `src/data/costing.ts` | shop-level `costing_config` metaobject, or theme settings | metaobject |
| `METALS` (label, swatch, `priceDeltaCAD`) | `Record<Metal, MetalVariant>` | metaobject `metal` {label, swatch, price_delta}; variant prices stay on the variants | metaobject (`color` field for the swatch) |
| `Category.french`, `eyebrow`, `feature` | strings | collection `custom.french_name`, `custom.chapter_numeral`, `custom.feature_image` (`hero` → `collection.image`) | text, `file_reference` |
| `CraftStory` `COPY` (default / bridal / watches / rentals) | object | metaobject `craft_story` {title, body, stats}, referenced from the collection | `metaobject_reference` |
| `ProductFAQ` `BASE` and `BY_CAT` | arrays | `faq_item` metaobjects, listed from the collection and the shop | `list.metaobject_reference` |
| `PAIRS` (two tables, see Notes) | `Record` | Search & Discovery complementary products, or collection `custom.pairs_with` | `list.collection_reference` |
| `VIDEOS` (`ShoppableVideo`) | array | metaobject `shoppable_video` {title, caption, handle, video, poster, products}; product `custom.films` | `file_reference`, `list.product_reference` |
| `DESIGNS` (gift-card designs) | array | metaobject `gift_card_design` {name, background, ink, accent} | metaobject |
| `DENOMINATIONS`, `CUSTOM_RANGE` | constants | gift-card variants; custom range as product metafields or theme settings per market | `number_integer` |
| `RENTAL_DAYS`, `RENTAL_SLOTS`, `RENTAL_LEAD_DAYS`, `MAX_MONTHS_AHEAD` | constants | rental app configuration or shop metafields | `json` |
| `REWARD_THRESHOLD` | `{ CAD: 1000, USD: 750 }` | discount configuration plus a theme setting per market | setting |
| `RING_SIZES` | `[size, diameter, circumference][]` | option values plus a size-guide metaobject or page | metaobject |
| Salon address, phone and hours (in `Footer`, `VisitSalon`, and `RentalCalendar` as "1420 Sherbrooke O.") | strings | shop metafields or theme settings | text |
| Testimonials, `PRESS`, announcements, hero `SLIDES`, `MakingScroll` `STEPS`, `FourCs` `CS`, `Services` items, `GiftFinder` `BUDGETS` / `OCCASIONS` | arrays | section blocks and settings (merchant-editable content), not metafields | n/a |
| `PROVINCES`, `US_STATES` | tax tables | not needed at checkout; keep only for estimates | theme JS |

---

### B11. Page transitions and the intro with Barba.js

The prototype's transitions are shaped as Barba.js transitions (`src/components/transition/transitions.ts`), so the theme can run the same choreography with Barba on real pages.
- **Markup:** `layout/theme.liquid` wraps the page in `data-barba="wrapper"`, and each template's main content in `data-barba="container"`. Each container's `data-barba-namespace` is its template (`index`, `collection`, `product`, `cart`, `page`…). The header, footer and drawers stay outside the container.
- **Transitions:** register `morph`, `checkout`, `chapter` and `curtain` with `barba.init({ transitions })`, mapping the namespaces (`category` → `collection`; gift cards → the gift-card product template). `leave` and `enter` are the same GSAP timelines, with Barba's `data.current.container` and `data.next.container` in place of `<main>`.
- **Morph:** Barba's `data.trigger` is the clicked link, so the photo is found the same way. The product template marks its main image with `data-morph-target`.
- **Intro:** the splash becomes Barba's `once` hook (or a theme snippet that runs before Barba starts), with the same session flag.
- **Prefetch and the rest:** `@barba/prefetch` replaces the hover preloading. Scroll memory, focus and the announcement go in Barba's `after` hook. Re-initialise theme scripts (sections, reveals) in `afterEnter`.
- **Why not in this prototype:** Barba fetches the next page's server-rendered HTML, and here every page is rendered by React from a single shell.

### B12. Languages and markets (2026-10-21)

The prototype speaks English (Canada, US) and French (Canada); see [features/languages.md](features/languages.md). In the theme:
- **Markets:** Canada (CAD) with English and French published; United States (USD) with English. To keep French when a French visitor picks USD, publish French to the US market too (`/fr-us`), or the theme's switcher falls back to English there.
- **URLs:** Shopify prefixes the alternate language itself (`/fr/…` for the primary market, `/en-us/…` for a subfolder market). The prototype's `#/fr/` mirrors this. `routes.root_url` and `request.locale.iso_code` give the prefix and language in Liquid; Shopify adds the `hreflang` alternates.
- **UI strings:** each `bilingual()` object becomes keys in `locales/en.default.json` and `locales/fr.json` (`{{ 'cart.title' | t }}`). Accent words become `_html` keys (`"title_html": "Votre <em>panier</em>"`). Count functions become Shopify pluralisation keys (`one` / `other`, with `{{ count }}`); French `one` covers 0 and 1, as the prototype's `n < 2` does. Regional English spelling can be a separate `en-US` file, or a single English file if the owner prefers one spelling.
- **Catalog:** `PRODUCT_FR`, `CATEGORY_FR` and the other maps in `src/data/catalog.fr.ts` become Translate & Adapt translations of product titles, descriptions, metafields (tagline, specs) and collections. Handles stay English (Shopify can translate handles too, for French URLs).
- **Switcher:** `{% form 'localization' %}` with `language_code` and `country_code` inputs replaces `LocaleMenu`, `LanguageToggle` and the market toggles. The veil and the place-keeping are theme JS around the form's submit (the page reloads on Shopify).
- **Notice:** browser and geolocation suggestions are what Shopify's Geolocation app does; the prototype's `LanguageNotice` is its design.
- **Formatting:** Liquid's `money` filters follow the market's currency format settings (`{{ amount }} $` for French Canada); dates via `| date` with the locale's `date_formats`.
- **Accounts and email:** `customer.locale` stores the visitor's language for notifications (the Account page's "Language" preference).

## Sharing and hints

`src/lib/share.ts` and `src/components/share/` (`features/sharing.md`) are shaped for the theme:
- **URLs:** build share URLs from `{{ shop.url }}{{ product.url }}` with the same `?utm_source={channel}&utm_medium=share`, which Shopify analytics reads. The prototype uses its own origin and hash routes.
- **Device share:** keep the device's share sheet with a copy-link fallback, as in Dawn's `share-button`. Prefetch the featured image as a `File` so it can be attached.
- **Analytics:** forward the `tns:share` window event with `Shopify.analytics.publish('tns_share', detail)` to a custom pixel.
- **Link previews:** they come from the theme's Open Graph tags (the `meta-tags` snippet), which the single-page prototype lacks.
- **Hints:** they stay client-side, sent by the visitor's own apps. Emailing a hint on the visitor's behalf would need an app or backend and is out of scope.

## Notes & gotchas

1. **Nothing reaches Shopify today.**
   - `toShopifyCartItem` runs only inside `Checkout.placeOrder`, and its result is only passed to `console.info`.
   - In a live theme the call belongs at add time in `GiftCards.submit`: one `/cart/add.js` request with `quantity`, replacing the `addToCart` loop.
   - Jewellery lines have no mapping at all; the function returns `null` for them.
2. **The $1-unit pattern is risky; verify it before adopting it.**
   - Shopify issues one gift card per unit of quantity **(verify)**. `quantity = amount × qty` would then issue, for example, 750 cards of $1 instead of one card of $750, and `_amount` would only be informational.
   - With automatic Markets conversion, a CAD-priced $1 variant won't cost US$1 in the US market unless a fixed USD price is set **(verify)**.
   - Safer options: a custom-amount gift-card app, or allowing denominations only.
3. **The variant IDs are placeholders.** `44100000001`–`44100000016` and `44100000099` aren't real. Splitting the table by currency implies a Markets decision the code never makes: one product with currency options, or fixed market prices.
4. **Recipient data mismatches.**
   - A "For me" card keeps its `message`, and `lineDetails` shows it in the bag and the checkout summary, but `toShopifyCartItem` emits nothing for it.
   - `_From` is underscore-hidden, so the sender's name is invisible at checkout.
   - `Card message` is a custom key, not a native one.
5. **Physical gift cards.** They use the same variant IDs as email cards and differ only in `_delivery`. Native gift cards are digital and don't require shipping **(verify)**, whereas the app's `needsShipping` collects an address for physical gift cards. They need a separate shippable product or a manual process.
6. **"Send on" window.**
   - The builder allows dates up to 365 days ahead (`maxDate`). Shopify's scheduled-delivery window is shorter, commonly 90 days **(verify)**.
   - Shopify's reference recipient form also posts a `__shopify_offset` timezone property that the code doesn't produce **(verify)**.
7. **`isGiftCardLine` is dead code.** It also uses the literal `'gift-card'`. In a theme, use `item.gift_card` (Ajax cart JSON) or `line_item.gift_card` (Liquid).
8. **`CartMeta` gaps.**
   - No attribute names are defined, and `Checkout` ignores `meta`.
   - `giftMessage` survives unticking gift wrap, so send it blank, or ignore it, when `giftWrap` is false.
   - `clearCart` wipes `meta`. Shopify carts keep attributes until they're changed.
9. **Some add-to-bag paths produce under-configured lines.**
   - Wishlist "Add all to bag" adds rings, bridal pieces and `custom` pieces with `metal: p.metals[0]` and no `size`.
   - `CompleteTheLook` "Add the set to bag" (non-rental) adds the current product with `metals[0]`, ignoring the chosen metal, size, engraving and personalization.
   - `CartUpsell`, `VideoViewer` and `TryOnStudio` already limit quick add to non-configurable pieces.
   - In Shopify every add must resolve to one variant ID, so pick a default size or send the shopper to the PDP.
10. **The quantity caps conflict.** The builder allows 1–20 cards, but the `CartLineItem` "+" button calls `updateQty(key, Math.min(10, qty + 1))`. Pressing "+" on a gift-card line with 11–20 cards drops it to 10.
11. **The gift-card catalog entry disagrees with the builder.**
    - Catalog: `specs.Denominations: '$250 – $10,000'` and `price: p(250, 200)`; USD 200 isn't a denomination.
    - Builder: `DENOMINATIONS` run from 100 to 5000, and `CUSTOM_RANGE` is 50–10000 CAD / 50–7500 USD.
    - The mega menu says "From $100 · never expires".
    - Reconcile these before importing.
12. **Rentals.**
    - The deposit is displayed (PDP, `CompleteTheLook`, `PriceBreakdown`) but never charged; it isn't in `linePrice` or in the cart or checkout totals.
    - Availability from `getBookedDates` is a deterministic hash relative to today, not real data.
    - A rental's `price` holds the retail value, which `rentalLines` shows as "retail value", not the rental fee.
13. **Promo codes are promised but missing.** The cart says "Gift cards and promo codes can be applied at checkout.", but the mock checkout has no discount field. Shopify Checkout provides one natively.
14. **Money units and rounding.**
    - App money is in whole units; Shopify Liquid and Ajax money is in minor units (cents).
    - The app rounds USD base prices and the accent price to the nearest 5 (`Math.round(CAD × 0.73 / 5) × 5`), but metal deltas use `Math.round(delta × 0.73)`. A vermeil variant's USD price is therefore not a multiple of 5.
    - Reproduce these with fixed market prices, not automatic conversion.
15. **Name-based heuristics break silently when products are renamed in the Shopify admin.** Affected: `tryOnKind`, `mediaPoolFor`, `hasCostBreakdown` (`/commission|redesign/i`), the costing "findings", the `CartUpsell` filter and `JewelryOverlay` shape detection. Replace them with metafields.
16. **Section numbering is computed.** The PDP derives numbers from what renders (`sectionOrder`, `num`); Home hard-codes "01"–"09". In a JSON template, sections render independently and some depend on async data (recommendations, recently viewed), so number them in JS or drop the numbers.
17. **Two `PAIRS` tables disagree.**

    | Category | `CartUpsell` pairs with | `CompleteTheLook` pairs with |
    |---|---|---|
    | bridal | earrings, bracelets | earrings, necklaces |
    | custom | earrings | bridal, earrings |
    | rentals | earrings | no entry |

    Merge them into one data source.
18. **The Promesse Wedding Band has no width option.** It advertises 2, 4 and 6 mm widths (`specs.Widths: '2 / 4 / 6 mm'`, description "available in 2, 4 and 6 mm") but has no width selector.
19. **Synthetic social proof.** `Reviews` generates reviews from `POOL`, with "Verified purchase" badges and the label `{count + mine.length} verified reviews`, where `count` comes from `getRatingSummary`'s slug hash. `Testimonials` hard-codes "4.9 / 5 · 1,200+ reviews". Don't port these as real data.
20. **Device-local state.**
    - Wishlist "Copy link" copies `…#/wishlist`, which shows the recipient's own list.
    - The Account gift-card panel lists every card issued on the device, and sign-in is simulated.
    - `BalanceChecker` advertises "Demo card: TERE SASO NS19 62MT".
    - Remove the local code generation and the ledger when moving to Shopify.
21. **Theme templates the app lacks.** There are no search, list-collections, blog/article, generic page or password templates; an OS 2.0 theme expects them, so they need design work.
22. **Line keys.** `lineKey` builds keys from `JSON.stringify` of nested objects. Never send these keys to Shopify; Shopify generates its own line-item `key`.
23. **Design codes are a contract.** Once a code sits in a cart or an order, the atelier rebuilds the ring from it. `encodeDesign` only appends to its option lists, and any other change takes a new version character (`1` today); `isDesignCode` drops codes that don't round-trip. A theme that writes `_design` must use the same encoder.

See [known-issues.md](known-issues.md) for issues that aren't integration-specific.

## Related docs

- [Languages — English (Canada, US) and French (Canada)](features/languages.md)
- [Product overview, sitemap & user journeys](product-overview.md)
- [Architecture & runtime model](architecture.md)
- [Data layer — catalog, media, gift cards, costing & tax](data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](commerce-logic.md)
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Virtual try-on](features/virtual-try-on.md)
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Figma Make platform, toolchain & build](platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](design-system.md)
- [Known issues, risks & tech debt](known-issues.md)
- [File index — every file, its role, exports and dependencies](INDEX.md)
