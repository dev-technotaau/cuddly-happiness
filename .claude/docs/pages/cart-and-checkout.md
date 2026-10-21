# Cart drawer, cart page & checkout

The bag is shown in three places, and all three read the same cart slice of the React context in `src/store.tsx`. The **cart drawer** (`CartDrawer`) slides in from the right and is always mounted. The **cart page** (`Cart`) lives at `#/cart`. **Checkout** (`Checkout`) is a single page at `#/checkout` that simulates placing an order on the device, including redeeming and issuing gift cards. The drawer and the cart page are built from the same blocks in `src/components/cart/`: the line item, undo toast, gift options, upsell, reward progress bar and totals hook. Checkout does its own totals math for tax and gift-card payment. There is no backend and no payment form. Placing an order logs Shopify gift-card payloads to the console, updates the local gift-card ledger, shows a "Merci." confirmation and empties the bag.

Scope: `src/components/CartDrawer.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/components/cart/CartLineItem.tsx`, `src/components/cart/CartUpsell.tsx`, `src/components/cart/GiftOptions.tsx`, `src/components/cart/RewardProgress.tsx`, `src/components/cart/UndoToast.tsx`, `src/components/cart/useCartTotals.ts`, `src/components/lineDetails.ts`, `src/components/Price.tsx`, `src/store.tsx` (cart slice). Context was also read from `src/data/tax.ts`, `src/data/giftcards.ts`, `src/data/catalog.ts`, `src/lib/shopify.ts`, `src/components/RecentlyViewed.tsx`, `src/components/SmoothScroll.tsx`, `src/components/Header.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/giftcard/GiftCardArt.tsx` and `src/index.css`.

---

## 1. Surface map

| Surface | How it is reached | Component | Mounting |
|---|---|---|---|
| Cart drawer | store `cartOpen === true` | `CartDrawer` (`src/components/CartDrawer.tsx`) | Always mounted. `App` renders `<CartDrawer />` after `<Footer />`, outside `<main>`. Open and closed are CSS states (transform, opacity, `inert`). |
| Cart page | hash `#/cart` → `route.name === 'cart'` | `Cart` (`src/pages/Cart.tsx`) | Only on that route |
| Checkout | hash `#/checkout` → `route.name === 'checkout'` | `Checkout` (`src/pages/Checkout.tsx`) | Only on that route |

- `href.cart` (`'#/cart'`) is used by exactly one element: the drawer's **View full bag** button. The header has no link to `#/cart`; its bag icon opens the drawer.
- `href.checkout` (`'#/checkout'`) is used by the **Secure checkout** CTA in the drawer footer and in the cart page summary.

Which building blocks each surface uses:

| Building block | Drawer | Cart page | Checkout |
|---|---|---|---|
| `CartLineItem` | default `variant` (`'drawer'`), `onNavigate={close}` | `variant="page"`, no `onNavigate` | not used (has its own summary list) |
| `UndoToast` | one in the empty branch and one in the non-empty branch, so exactly one is mounted at a time (see §9) | likewise, one per branch | not used |
| `CartUpsell` | default `layout` (`'rail'`) and `limit` (`3`), `onNavigate={close}` | `layout="grid" limit={4}` | not used |
| `GiftOptions` | under a "Gifting" label | under "Gifting & notes" | not used; `meta` is never read by checkout |
| `RewardProgress` | drawer header, if `hasMerch` | Summary box, if `hasMerch` | not used |
| `useCartTotals` | `subtotal, count, installment, hasMerch` | `merch, giftCards, subtotal, count, installment, hasMerch, rewardUnlocked, hasRental` | not used (computes its own totals) |
| `lineDetails` | through `CartLineItem` (one `<li>` per detail) | through `CartLineItem` | joined with `' · '` |
| `Price` | yes | yes | yes |
| `RecentlyViewedStrip` (`src/components/RecentlyViewed.tsx`) | empty state, `onNavigate={close}` | empty state, and below the upsell grid | empty state |
| `GiftCardArt` | through `CartLineItem` | through `CartLineItem` | summary thumbnails and confirmation cards |

---

## 2. Cart state contract (`src/store.tsx`)

### 2.1 `CartLine`

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

Line identity comes from `lineKey(line)`. It joins `slug`, `metal`, `rental`, `engraving`, `size`, `JSON.stringify(booking ?? '')`, `JSON.stringify(personalization ?? '')` and `JSON.stringify(giftCard ?? '')` with a pipe character. Adding a configuration that is already in the bag increments that line's `qty`; any other configuration creates a new line.

### 2.2 `CartMeta` (order-level gift options)

```ts
/** Order-level options; map to Shopify cart `note` and `attributes`. */
export interface CartMeta {
  giftWrap: boolean
  giftReceipt: boolean
  giftMessage: string
  note: string
}

const DEFAULT_META: CartMeta = { giftWrap: false, giftReceipt: false, giftMessage: '', note: '' }
```

### 2.3 Store members used by these surfaces

| Member | Signature | Behaviour |
|---|---|---|
| `cart` | `CartLine[]` | Initialised by `JSON.parse(localStorage.getItem('tns-cart') \|\| '[]')`, falling back to `[]` if parsing throws. A `useEffect` writes it back to `tns-cart` on every change. Lines are not validated on load. |
| `cartOpen`, `setCartOpen` | `boolean`, `(o: boolean) => void` | Plain `useState(false)`, not persisted. |
| `addToCart` | `(line: Omit<CartLine, 'key' \| 'qty'>) => void` | Computes `lineKey`. An existing line gets `qty + 1`; otherwise the line is appended with `qty: 1`. **Always calls `setCartOpen(true)`.** No upper bound on qty. |
| `updateQty` | `(key: string, qty: number) => void` | `qty <= 0` filters the line out **without** recording `lastRemoved`. Otherwise sets `qty` as given, with no cap. |
| `removeLine` | `(key: string) => void` | Inside the `setCart` updater it records `{ line, index }` via `setLastRemoved`, then filters the line out. |
| `undoRemove` | `() => void` | Re-inserts `lastRemoved.line` at its original `index`, unless a line with the same `key` is already in the cart. In both cases it sets `lastRemoved` to `null`. |
| `lastRemoved` | `CartLine \| null` | Exposed as `lastRemoved?.line ?? null`. In memory only, not persisted. |
| `clearCart` | `() => void` | `setCart([])`, `setMetaState(DEFAULT_META)`, `setLastRemoved(null)`. This also resets the gift options. |
| `meta`, `setMeta` | `CartMeta`, `(patch: Partial<CartMeta>) => void` | Loaded as `{ ...DEFAULT_META, ...load('tns-cart-meta', {}) }`. `setMeta` shallow-merges the patch. Written to `tns-cart-meta` on every change. |
| `linePrice` | `(line: CartLine) => number` | Gift card: `convert(giftCard.amount, giftCard.currency, currency) * qty`. Unknown product: `0`. Rental with `product.rental`: `product.rental[line.rental][currency] * qty`. Otherwise `(priceFor(product, currency, line.metal) + personalizationPrice(product, line.personalization, currency)) * qty`. Memoised on `[currency]`. |
| `subtotal`, `count` | `number` | Σ `linePrice` and Σ `qty`. The header badge uses `count`. |
| `currency`, `setCurrency` | `'CAD' \| 'USD'` | Defaults to `'CAD'`. `setCurrency` also writes `tns-currency`. |
| `toggleWishlist`, `isWished` | `(slug) => void`, `(slug) => boolean` | Used by **Save for later**. |

### 2.4 localStorage keys touched by these surfaces

| Key | Contents | Written by |
|---|---|---|
| `tns-cart` | `CartLine[]` | store effect on `cart` |
| `tns-cart-meta` | `CartMeta` | store effect on `meta` |
| `tns-currency` | `'CAD'` or `'USD'` | `setCurrency` (header toggle, checkout "Shopping in" toggle) |
| `tns-wishlist` | `string[]` of slugs | store effect on `wishlist` (Save for later) |
| `tns-giftcard-ledger` | `IssuedCard[]` | `issueCards` and `debitCards` in `src/data/giftcards.ts`, called by checkout's `placeOrder`. `lookupCard` reads it. |

---

## 3. Derived totals: `useCartTotals` (`src/components/cart/useCartTotals.ts`)

The default export is a hook that calls `useStore()` and recomputes on every render. The named export is `REWARD_THRESHOLD = { CAD: 1000, USD: 750 } as const` ("Spend at which a complimentary care kit is added, per currency").

| Field | Formula |
|---|---|
| `merch` | Σ `linePrice(l)` over lines **without** `giftCard`. Rental lines count as merch. |
| `giftCards` | Σ `linePrice(l)` over lines **with** `giftCard` |
| `subtotal` | `merch + giftCards` |
| `count` | Σ `l.qty` over all lines |
| `threshold` | `REWARD_THRESHOLD[currency]` |
| `rewardProgress` | `Math.min(1, merch / threshold)` |
| `rewardRemaining` | `Math.max(0, threshold - merch)` |
| `rewardUnlocked` | `merch >= threshold` |
| `installment` | `Math.round(subtotal / 4)` (pre-tax) |
| `hasMerch` | `cart.some((l) => !l.giftCard)` |
| `hasRental` | `cart.some((l) => l.rental)` |

All amounts are whole units of the active currency.

---

## 4. `Price` (`src/components/Price.tsx`)

```tsx
export default function Price({ amount, className = '' }: { amount: number; className?: string }) {
  const { currency } = useStore()
  return (
    <span className={`font-spec ${className}`}>
      {formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span>
    </span>
  )
}
```

- `formatPrice` (`src/data/catalog.ts`) calls `Intl.NumberFormat` with `en-CA` for CAD and `en-US` for USD, using `style: 'currency'` and `maximumFractionDigits: 0`. Both currencies render with a bare `$`, e.g. `$6,850`. The trailing inner span adds the code: `$6,850 CAD`.
- `Price` never converts. It formats `amount` in whatever the current currency is.
- The idiom `className="[&_span]:hidden"` hides the inner currency-code span. It is used for installments, per-unit prices, the strikethrough price, gift-card usage amounts and the reward "away from" amount.

---

## 5. Cart drawer (`src/components/CartDrawer.tsx`)

### 5.1 Open triggers

| Trigger | Where | Mechanism |
|---|---|---|
| Header bag icon (`aria-label="Open bag"`, `ShoppingBag` icon with a gold count badge when `count > 0`) | `src/components/Header.tsx` | `setCartOpen(true)` |
| Desktop menu Bag tile (`aria-label="Open bag"` or `Open bag, {n} pieces`) | `src/components/menu/SiteMenu.tsx` | closes the menu, then `setCartOpen(true)` |
| Any `addToCart` call | `src/store.tsx` | `addToCart` ends with `setCartOpen(true)`. Callers: PDP add (`src/pages/Product.tsx`); gift-card builder (`src/pages/GiftCards.tsx`, which calls `addToCart` once per selected quantity); wishlist "Add all to bag" (`src/pages/Wishlist.tsx`); Complete the look (`src/components/pdp/CompleteTheLook.tsx`); shoppable video viewer (`src/components/video/VideoViewer.tsx`); try-on studio (`src/components/tryon/TryOnStudio.tsx`); `CartUpsell` quick add, both in the drawer and on the cart page |
| PDP "Go to bag" | `src/pages/Product.tsx` (`onCta`, also passed to `StickyBar` as `onAction`) | When the exact configuration is already in the bag (`inBag`), the CTA calls `setCartOpen(true)` instead of adding |

### 5.2 Close triggers

| Trigger | Mechanism |
|---|---|
| Backdrop click | backdrop `onClick={close}`, where `close = () => setCartOpen(false)` |
| Close button (`X` icon, `aria-label="Close bag"`) | `onClick={close}` |
| `Escape` | `keydown` listener on `window`, registered only while open |
| Navigating from inside the drawer | `onClick={close}` on the empty-state category and gift-card links, **Secure checkout** and **View full bag**. `onNavigate={close}` is passed to `CartLineItem` (image, name and Edit links), `CartUpsell` (image, name and Options links) and `RecentlyViewedStrip` (item links). |

These actions do **not** close the drawer: Remove, quantity changes, Save for later, gift-option changes, upsell quick add, "View on you" (which opens the try-on studio above the drawer) and route changes from outside the drawer. `CartDrawer` has no effect that reacts to route changes.

### 5.3 Structure, layering & transitions

| Element | Attributes | Classes |
|---|---|---|
| Backdrop `div` | `aria-hidden`, `onClick={close}` | `fixed inset-0 z-[80] bg-[var(--bg-vault)]/45 backdrop-blur-[2px] transition-opacity duration-500`, plus `opacity-100` when open or `pointer-events-none opacity-0` when closed |
| Panel `aside` | `role="dialog"`, `aria-modal="true"`, `aria-label="Shopping bag"`, `aria-hidden={!cartOpen}`, `inert={!cartOpen}` | `fixed right-0 top-0 z-[90] flex h-full w-full max-w-[460px] flex-col bg-[var(--bg-travertine)] shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`, plus `translate-x-0` when open or `translate-x-full` when closed |
| `header` | | `border-b border-[var(--border-hairline)] px-7 pb-5 pt-6` |
| Scroll body `div` | `data-lenis-prevent` | `flex-1 overflow-y-auto px-7` |
| `footer` | rendered only when `cart.length > 0` | `border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)] px-7 pb-6 pt-5` |

- The panel takes the full viewport width on narrow screens (`w-full`) and is capped at 460 px.
- The backdrop fades over 500 ms with Tailwind's default easing. The panel slides over 700 ms with `cubic-bezier(0.16,1,0.3,1)`. No `prefers-reduced-motion` handling applies to either.
- Stacking order found in the code: header `sticky top-0 z-50` · `.film-grain` `z-index: 60` (`src/index.css`) · mobile menu `z-[70]` · **drawer backdrop `z-[80]`** · **drawer panel `z-[90]`** · PDP gallery lightbox and ring-size guide `z-[95]` · video viewer and review overlays `z-[100]` · try-on studio `z-[110]`.

### 5.4 Open-state effect (scroll lock, focus, Escape)

There is one `useEffect` with dependencies `[cartOpen, setCartOpen]`. It returns immediately when `cartOpen` is false.

| On open | Cleanup (on close or unmount) |
|---|---|
| `getLenis()?.stop()` stops the Lenis smooth scroll, if Lenis exists (it is not created under `prefers-reduced-motion: reduce`) | `lenis?.start()` |
| Saves `document.body.style.overflow`, then sets it to `'hidden'` | Restores the saved value |
| `window.setTimeout(() => closeBtn.current?.focus(), 50)` focuses the close button after 50 ms | `window.clearTimeout(t)` |
| Adds a `keydown` listener: `e.key === 'Escape' && setCartOpen(false)` | Removes the listener |

There is no focus trap, focus is not returned to the trigger on close, and the rest of the page is not made inert while the drawer is open. While closed, the panel itself is `inert`, so nothing inside it can be focused. The scroll body carries `data-lenis-prevent`, so wheel and touch scrolling inside it is not taken over by Lenis.

### 5.5 Wireframe

```text
                              +--- aside: fixed right-0, w-full max-w-[460px], z-[90] ----+
 backdrop (z-[80])            | HEADER                                                    |
 bg-vault/45 + blur 2px       |  Your Bag (3)                                       [X]   |
 click => close               |  [RewardProgress]  (only if hasMerch, mt-5)               |
                              +-----------------------------------------------------------+
                              | BODY (flex-1, overflow-y-auto, data-lenis-prevent)        |
                              |  ul.divide-y > CartLineItem (variant 'drawer') x n        |
                              |  [UndoToast]  <- div.sticky.bottom-0.pb-3                 |
                              |  ---------------------------------------- border-t py-7   |
                              |  PAIRS BEAUTIFULLY WITH  (CartUpsell rail, max 3)         |
                              |  ---------------------------------------- border-t py-7   |
                              |  GIFTING                                                  |
                              |  [GiftOptions]                                            |
                              +-----------------------------------------------------------+
                              | FOOTER (only if cart.length > 0)                          |
                              |  SUBTOTAL                                   $6,850 CAD    |
                              |  {shipping}. Taxes calculated at checkout.[ Gift wrapped.]|
                              |  Or 4 interest-free payments of $1,713 with Shop Pay      |
                              |  [ (lock) SECURE CHECKOUT (->) ]          => #/checkout   |
                              |  [ VIEW FULL BAG ]                        => #/cart       |
                              |      (shield) FULLY INSURED   (rotate) 30-DAY RETURNS     |
                              +-----------------------------------------------------------+

 Empty bag (cart.length === 0): no footer; body shows
   "Your bag is empty." / sub-line / NECKLACES  EARRINGS  RINGS  GIFT CARDS
   [RecentlyViewedStrip onNavigate=close] (mt-14) and then [UndoToast] (not sticky)
```

### 5.6 Contents in detail

#### Header

- `h2.font-serif-editorial.text-3xl` reads "Your Bag". When `count > 0` it is followed by `({count})` in `font-spec align-middle text-xs text-[var(--text-linen)]`. `count` is the total quantity across lines, not the number of lines.
- Close button: `-mr-2 p-2 transition-transform hover:rotate-90`, icon `X` with `size={20} strokeWidth={1.4}`.
- `RewardProgress` is wrapped in `div.mt-5` and shown only if `hasMerch`.

#### Body: empty (`cart.length === 0`)

- Wrapper `py-20 text-center`. "Your bag is empty." (`font-serif-editorial text-3xl`), then the sub-line (`mt-3 text-sm text-[var(--text-taupe)]`).
- Links, each `onClick={close}`: the slugs `necklaces`, `earrings` and `rings` go to `href.category(c)` (`#/c/<slug>`) and show the raw slug text, uppercased by CSS. "Gift cards" goes to `href.giftcards` (`#/gift-cards`). Classes `border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.22em]` inside `mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3`.
- `RecentlyViewedStrip onNavigate={close}` in `mt-14 text-left`. It renders nothing when there is no history (default limit 3, title "Recently viewed").
- `UndoToast` is rendered after the empty block (`{cart.length === 0 && <UndoToast />}`), so the last removal stays undoable after the bag empties.

#### Body: non-empty

1. `ul.divide-y.divide-[var(--border-hairline)]` containing `CartLineItem key={l.key} line={l} onNavigate={close}` for each line.
2. `div.sticky.bottom-0.pb-3` containing `UndoToast`. It sticks to the bottom of the scroll viewport.
3. `div.border-t.py-7` containing `CartUpsell onNavigate={close}` (rail, limit 3).
4. `div.border-t.py-7` containing the label "Gifting" (`mb-4 text-[11px] uppercase tracking-[0.22em]`) and `GiftOptions`.

#### Footer (only if `cart.length > 0`)

- Subtotal row: label `text-[11px] uppercase tracking-[0.22em]`, `<Price amount={subtotal} className="text-lg" />`.
- Shipping line (`mt-1.5 text-xs text-[var(--text-linen)]`): `{shipping}. Taxes calculated at checkout.`, with ` Gift wrapped.` appended when `meta.giftWrap`. `shipping` depends only on `currency`:
  - CAD: `Complimentary insured shipping across Canada`
  - USD: `Complimentary insured shipping to the U.S., duties included`
- Installments line (`mt-1 text-xs text-[var(--text-linen)]`): "Or 4 interest-free payments of" + `<Price amount={installment} className="[&_span]:hidden" />` + "with Shop Pay".
- Primary CTA (anchor): `group mt-5 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]`. It contains `Lock` (12/1.6), the label "Secure checkout" and `ArrowRight` (14) with `transition-transform group-hover:translate-x-1`.
- Secondary CTA (anchor): `mt-3 block w-full border border-[var(--border-hairline)] py-3.5 text-center text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-[var(--text-espresso)]`, label "View full bag".
- Trust row: `mt-4 flex justify-center gap-6 text-[10px] uppercase tracking-[0.16em] text-[var(--text-linen)]` containing `ShieldCheck` + "Fully insured" and `RotateCcw` + "30-day returns" (icons 12/1.4).

### 5.7 CTA targets

| CTA | Target | Also does |
|---|---|---|
| Secure checkout | `href.checkout`, i.e. `#/checkout` | `close()` |
| View full bag | `href.cart`, i.e. `#/cart` | `close()` |
| Empty-state category links | `#/c/necklaces`, `#/c/earrings`, `#/c/rings` | `close()` |
| Empty-state "Gift cards" | `#/gift-cards` | `close()` |
| Line image, name or Edit | `#/p/<slug>`, or `#/gift-cards` for gift-card lines | `close()` via `onNavigate` |
| Upsell image, name or Options | `#/p/<slug>` | `close()` via `onNavigate` |

---

## 6. Cart page (`src/pages/Cart.tsx`)

### 6.1 Wireframe (at `lg`, 1024 px and up)

```text
div.mx-auto.max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24
VOTRE SÉLECTION                                   (spec, 10px, gold)
Your Bag                         3 PIECES   CLEAR BAG      (row from sm:)
--------------------------------------------------------------- border-b pb-10
grid pt-6 gap-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-20
+-------------------------------------------+  +-- aside lg:sticky lg:top-28 ---+
| ul.divide-y  CartLineItem variant="page"  |  | border p-8                     |
| ...                                       |  | Summary                        |
| [UndoToast]                               |  | [RewardProgress]  (hasMerch)   |
|-------------------------------------------|  | Jewellery            $x CAD    |
| section mt-6 border-t pt-10 md:grid-cols-2|  | Gift cards           $x CAD    |
|  Gifting & notes      | bg-silk p-8       |  | Shipping      Complimentary    |
|  intro line           | Truck   ...       |  | Gift wrapping Complimentary    |
|  [GiftOptions]        | RotateCcw ...     |  | Jewellery care kit  Included   |
|                       | Gem     ...       |  | Est. tax [Québec v]  $x CAD    |
|                       | ShieldCheck ...   |  | Gift cards are not taxed.      |
+-------------------------------------------+  | ESTIMATED TOTAL      $x CAD    |
                                               | Or 4 interest-free payments... |
                                               | [cal] Order today, arrives by..|
                                               | [ (lock) SECURE CHECKOUT (->) ]|
                                               | Gift cards and promo codes ... |
                                               +--------------------------------+
                                               Questions? Book a private consultation
--------------------------------------------------------------- mt-24 border-t pt-14
Pairs beautifully with   (CartUpsell grid: 2 cols, lg:4 cols, max 4)
--------------------------------------------------------------- mt-24
(History icon) Recently viewed   (RecentlyViewedStrip, max 3)
```

### 6.2 Local state & derived values

- From the store: `cart, currency, clearCart, meta`. From `useCartTotals()`: `merch, giftCards, subtotal, count, installment, hasMerch, rewardUnlocked, hasRental`.
- `const [region, setRegion] = useState('QC')` is the province used for the estimated tax. It is local to this page, not shared with checkout and not persisted.
- `tax = currency === 'CAD' ? Math.round(merch * (PROVINCES[region]?.rate ?? 0)) : null`, so it is `null` in USD.
- `total = subtotal + (tax ?? 0)`.
- `onlyGiftCards = cart.length > 0 && !hasMerch`.
- `row(label, value, muted = false)` is a local helper that renders `div.flex.items-baseline.justify-between.gap-4.text-sm`, adding `text-[var(--text-taupe)]` when `muted`.
- `deliveryDate(days)` is a module-level function. It starts from `new Date()` and steps one day at a time, counting only Monday–Friday (`getDay() !== 0 && !== 6`). There is no holiday calendar and no cut-off time. It returns `toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric' })`. For example, called on Thu 15 Oct 2026, `deliveryDate(4)` returns `Wed, October 21`.

### 6.3 Page header

- Eyebrow "Votre sélection": `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]`.
- `h1`: `font-serif-editorial mt-4 text-6xl font-light lg:text-8xl`, rendering `Your <em className="text-[var(--gold-vermeil)]">Bag</em>`.
- Only when the cart is non-empty: a count (`font-spec text-xs uppercase tracking-[0.2em] text-[var(--text-taupe)]`) showing `{count} piece` or `{count} pieces`, and a **Clear bag** button (`text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline`). Its handler is `window.confirm('Remove everything from your bag?') && clearCart()`. `clearCart` also resets the gift options and drops any pending undo.
- Layout: `flex flex-col justify-between gap-6 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end`.

### 6.4 Empty state (`cart.length === 0`)

Wrapper `py-24 text-center`:
1. "Your bag is empty." (`font-serif-editorial text-4xl`)
2. "Begin with something that will outlast the occasion." (`mt-3 text-[var(--text-taupe)]`)
3. `UndoToast` inside `mx-auto mt-6 max-w-md`
4. Two CTAs in `mt-10 flex flex-wrap justify-center gap-4`:
   - **Find your piece** goes to `href.category('necklaces')`. It is solid: `bg-[var(--text-espresso)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]`.
   - **Gift cards** goes to `href.giftcards`. It is outlined: `border border-[var(--border-hairline)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--text-espresso)]`.
5. `RecentlyViewedStrip` (defaults) in `mt-24 text-left`.

### 6.5 Main column (non-empty)

1. `ul.divide-y` of `CartLineItem variant="page"`, with no `onNavigate`.
2. `UndoToast` directly under the list. Unlike the drawer, it is not sticky.
3. `section.mt-6.grid.gap-10.border-t.pt-10.md:grid-cols-2`:
   - Left: `h2` "Gifting & notes" (`font-serif-editorial text-3xl`), an intro paragraph (`mt-2 text-sm text-[var(--text-taupe)]`), then `GiftOptions` in `div.mt-6`.
   - Right: an assurance list, `ul.space-y-6.self-start.bg-[var(--bg-silk)].p-8`, built from a 4-tuple array `[Icon, title, description]`. Icons are `size={18} strokeWidth={1.2}` in gold. Titles use `text-[11px] uppercase tracking-[0.18em]`; descriptions use `mt-1 text-sm text-[var(--text-taupe)]`.

| Icon | Title | Description |
|---|---|---|
| `Truck` | Insured, signature delivery | Shipped in discreet packaging and fully insured until it is in your hands. |
| `RotateCcw` | 30-day returns | Complimentary returns on unworn pieces. Engraved and custom work is final sale. |
| `Gem` | Lifetime care | Free annual cleaning, inspection and claw re-tightening at the atelier. |
| `ShieldCheck` | Certified & conflict-free | Every stone traceable, with GIA or IGI certification above 0.30 ct. |

### 6.6 Summary aside

The `aside` has `lg:sticky lg:top-28 lg:self-start`. The box inside is `border border-[var(--border-hairline)] p-8`, and it starts with `h2` "Summary" (`font-serif-editorial text-3xl`), followed by `RewardProgress` in `mt-6` if `hasMerch`.

Rows sit in `mt-7 space-y-3 border-t border-[var(--border-hairline)] pt-6`, in this order:

| Row | Shown when | Value | Muted |
|---|---|---|---|
| Jewellery | `hasMerch` | `<Price amount={merch} />` | no |
| Gift cards | `giftCards > 0` | `<Price amount={giftCards} />` | no |
| Shipping | always | `Digital delivery` if `onlyGiftCards`, otherwise `Complimentary` | yes |
| Gift wrapping | `meta.giftWrap` | `Complimentary` | yes |
| Jewellery care kit | `rewardUnlocked` | `Included` | yes |
| Est. tax + province `<select>` | `hasMerch && currency === 'CAD'` | `<Price amount={tax ?? 0} />` | the row is taupe |
| Tax | `hasMerch && currency === 'USD'` | `Calculated at checkout` | yes |
| note "Gift cards are not taxed." | `giftCards > 0` | (paragraph `text-xs text-[var(--text-linen)]`) | — |

- The Est. tax row is hand-built rather than using `row()`. A `<label>` wraps the text "Est. tax" and a `<select aria-label="Province">` (`border-b border-[var(--border-hairline)] bg-transparent pb-0.5 text-xs outline-none`). Its options come from `Object.entries(PROVINCES)`, with the province code as value and `name` as text. The select is controlled by `region`.
- Total row (`mt-6 flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-6`): the label is `Estimated total` when `tax !== null && hasMerch`, otherwise `Subtotal`. The value is `<Price amount={total} className="font-serif-editorial text-3xl" />`.
- "Or 4 interest-free payments of `{installment}` with Shop Pay" (`mt-2 text-xs text-[var(--text-linen)]`). The installment is a quarter of the pre-tax `subtotal`.
- Delivery estimate, shown only if `hasMerch && !hasRental`: `p.mt-6.flex.items-center.gap-2.5.bg-[var(--bg-silk)].px-4.py-3.text-xs.text-[var(--text-taupe)]` with a `CalendarDays` icon (14/1.3, gold) and "Order today, arrives by" + `<span className="text-[var(--text-espresso)]">{deliveryDate(4)}</span>`.
- **Secure checkout** goes to `href.checkout`. It uses the same class recipe as the drawer CTA but with `mt-6`.
- "Gift cards and promo codes can be applied at checkout." (`mt-4 text-center text-xs text-[var(--text-linen)]`).
- Below the box: "Questions?" plus a link "Book a private consultation" to `href.atelier` (`#/atelier`), styled `border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]`, inside `mt-6 text-center text-xs text-[var(--text-taupe)]`.

### 6.7 Below the grid

- `section.mt-24.border-t.pt-14` containing `<CartUpsell layout="grid" limit={4} />`.
- `section.mt-24` containing `<RecentlyViewedStrip />`. The section keeps its margin even when the strip renders nothing.

### 6.8 Responsive behaviour

- Page padding is `px-6 py-16`, rising to `lg:px-12 lg:py-24`.
- The header stacks vertically below `sm` (640 px) and becomes a row at `sm:`.
- The main grid is one column below `lg`. At `lg` it becomes `minmax(0,1fr)` plus a 420 px summary column, and the summary turns sticky (`top-28`).
- The Gifting & notes section is one column below `md` and two columns at `md:`.
- The upsell grid shows 2 columns, and 4 at `lg:`.

---

## 7. `CartLineItem` (`src/components/cart/CartLineItem.tsx`)

### 7.1 Props & derived values

```ts
interface Props {
  line: CartLine
  variant?: 'drawer' | 'page'
  onNavigate?: () => void
}
```

- `p = getProduct(line.slug)`. If it is undefined, the component returns `null`. The line is still counted by the totals.
- `productHref` is `href.giftcards` for gift-card lines and `href.product(p.slug)` otherwise.
- `unit = linePrice(line) / line.qty`.
- `fullPrice` is `priceFor(p, currency, line.metal) + personalizationPrice(p, line.personalization, currency)` for non-gift, non-rental lines, and `unit` otherwise.
- `details = lineDetails(line, p)` (see §8).
- `iconBtn` is the shared class string for the action row: `flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]`.

### 7.2 Variant differences

| Aspect | `'drawer'` (default) | `'page'` |
|---|---|---|
| `li` | `flex gap-5 py-6` | `flex gap-5 py-8` |
| Gift-card art wrapper | `w-24 shrink-0 pt-1` | `w-40 shrink-0 pt-1` |
| Product image link | `h-32 w-24` | `h-44 w-36` |
| Name size | `text-xl` | `text-3xl` |
| Action row margin | `mt-3` | `mt-5` |
| Line price | `text-sm` | `text-base` |

### 7.3 Rendering per line type

| Line type (how it is detected) | Eyebrow (`font-spec text-[9px] uppercase tracking-[0.22em] text-[var(--text-linen)]`) | Media | Actions | Line price (`linePrice`) |
|---|---|---|---|---|
| Gift card (`line.giftCard` set) | `Gift card` | `GiftCardArt` with `design`, `currency` and `amount` from the line and `to={recipientName}`; no `code`. Not wrapped in a link. | **Edit** only, to `#/gift-cards` | `convert(amount, giftCard.currency, currency) × qty` |
| Rental (`line.rental` set) | `Rental` | Product image link (see below) | Edit, Save for later, View on you (if try-on capable) | `product.rental[period][currency] × qty`. The deposit is not included. |
| Merchandise (everything else) | `p.collection`, e.g. `Mont-Royal` | Product image link | Edit, Save for later, View on you (if try-on capable) | `(priceFor(metal) + personalizationPrice) × qty` |

Product image link: `a.group.block.shrink-0.overflow-hidden.bg-[var(--bg-silk)]` containing `img src={p.images[0]} alt={p.name} className="editorial-zoom h-full w-full object-cover"`. The image zooms to `scale(1.045)` on group hover (`src/index.css`).

The name is a link to `productHref` (`font-serif-editorial mt-1 block leading-tight transition-colors hover:text-[var(--gold-vermeil)]`). For gift-card lines it shows the catalog product name, `Teresa & Sons Gift Card`.

Each detail string becomes its own `<li key={d}>` in `ul.mt-2.space-y-0.5`, styled `font-spec text-[10px] uppercase tracking-[0.12em] text-[var(--text-taupe)]`. The CSS uppercases quoted personalization and engraving text on screen.

### 7.4 Actions

| Control | Shown for | Behaviour |
|---|---|---|
| Remove (`X` 16/1.3, `` aria-label={`Remove ${p.name}`} ``, `shrink-0 p-1 text-[var(--text-linen)] …`) | all lines | `removeLine(line.key)`, which sets `lastRemoved` and makes the undo toast appear |
| **Edit** (`Pencil` 11/1.4), anchor | all lines | Goes to `productHref` and calls `onNavigate`. It does not pre-load the line's configuration anywhere. |
| **Save for later** (`Heart` 11/1.4), button | non-gift lines | `if (!isWished(p.slug)) toggleWishlist(p.slug)`, then `removeLine(line.key)`. The resulting toast reads "Removed …"; Undo restores the line and the wishlist entry stays. |
| **View on you**: `TryOnButton` with `variant="link"`, `label="View on you"`, `className="!pb-0.5 !text-[10px] !tracking-[0.18em] text-[var(--text-taupe)]"` | non-gift lines, and only if `tryOnKind(p) !== null` (`TryOnButton` returns `null` otherwise) | Opens the try-on studio (`z-[110]`) with `product={p}`, `metal={line.metal}` and `text={line.personalization?.text}`. It calls `preventDefault` and `stopPropagation`. |

### 7.5 Quantity stepper

- Wrapper `flex items-center border border-[var(--border-hairline)]`. Both buttons are `flex h-9 w-9 items-center justify-center transition-colors hover:bg-[var(--bg-silk)]`, with `Minus` and `Plus` icons at size 12.
- **Decrease** (`aria-label="Decrease quantity"`): `line.qty <= 1 ? removeLine(line.key) : updateQty(line.key, line.qty - 1)`. Going below 1 removes the line, and the removal can be undone.
- Quantity readout: `span.font-spec.w-7.text-center.text-xs` with `aria-live="polite"`.
- **Increase** (`aria-label="Increase quantity"`): `updateQty(line.key, Math.min(10, line.qty + 1))`. The stepper caps at **10**. The button is never disabled. A line already above 10 (possible through `addToCart`, see §2.3) is reduced to 10 by this button.
- There is no free-text quantity input.

### 7.6 Price column

`div.text-right`:
- `<Price amount={linePrice(line)} className={page ? 'text-base' : 'text-sm'} />`
- If `line.qty > 1`: `{unit} each` (`font-spec mt-0.5 text-[10px] text-[var(--text-linen)]`, currency code hidden).
- If `fullPrice !== unit`: a strikethrough `fullPrice` (`font-spec text-[10px] text-[var(--text-linen)] line-through`, code hidden).

---

## 8. `lineDetails` (`src/components/lineDetails.ts`)

`lineDetails(line: CartLine, product: Product): string[]` is described in the source as "Human-readable option lines for a cart line, shared by the bag and checkout". It imports `METALS`, `formatDay`, `parseIso` and `rentalReturnDate` from `src/data/catalog.ts`, `describePersonalization` from `src/components/pdp/Personalizer.tsx`, and `DESIGNS` from `src/data/giftcards.ts`.

`formatDay` defaults to `toLocaleDateString('en-CA', { weekday: 'short', day: 'numeric', month: 'short' })`, which renders as `Wed, Oct 21`.

### 8.1 Gift-card branch (when `line.giftCard` is set; returns early)

| # | Condition | Output | Example |
|---|---|---|---|
| 1 | always | `` `${designName} design · ${delivery === 'email' ? 'Digital' : 'Physical card'}` ``. `designName` is `DESIGNS.find(...).name` or `''`. | `Travertine design · Digital` |
| 2 | `g.toSelf` | `For me` | |
| 2′ | otherwise | `` `To ${recipientName}` `` with `` ` · ${recipientEmail}` `` appended if an email is set | `To Marie · marie@example.com` |
| 3 | `g.sendOn` | `` `Sends ${formatDay(parseIso(sendOn))}` `` | `Sends Wed, Oct 21` |
| 4 | `g.message` | `“{message}”`, truncated to the first 40 characters plus `…` if longer | `“Joyeux anniversaire”` |

### 8.2 Merchandise and rental branch

| # | Condition | Output | Example |
|---|---|---|---|
| 1 | `line.rental` | `RENTAL_LABEL[rental]`, one of `Weekend rental`, `One-week rental`, `One-month rental` | |
| 1′ | else if `line.metal` | `METALS[metal].label`, one of `18k Yellow Gold`, `18k White Gold`, `18k Rose Gold`, `Platinum 950`, `Gold Vermeil` | |
| 2 | `line.size` | `` `Size ${size}` `` | `Size 6` |
| 3 | `line.booking && line.rental` | `` `${formatDay(start)} → ${formatDay(rentalReturnDate(start, rental))}` ``. The return date is the start plus `RENTAL_DAYS` (weekend 3, week 7, month 30). | `Wed, Oct 21 → Sat, Oct 24` |
| 4 | same condition | `` `${method === 'salon' ? 'Salon fitting' : 'Courier'} · ${slot}` `` | `Courier · 09:00 – 11:00` |
| 5 | `line.personalization` | `describePersonalization(p)`: `“{text.trim()}”`, the font label (`Script`, `Serif` or `Block`), `chainLength`, and `Diamond accent` when `accent`. Falsy parts are dropped and the rest joined with ` · `. | `“Marie” · Script · 18 in · Diamond accent` |
| 6 | `line.engraving` | `Reverse: “{engraving}”` if `product.personalization` exists, otherwise `Engraving: “{engraving}”` | `Engraving: “A & J”` |
| 7 | nothing was pushed | `product.collection` | |

Checkout renders the same array as `{details.join(' · ')} · ×{qty}`.

---

## 9. `UndoToast` (`src/components/cart/UndoToast.tsx`)

Source doc comment: `Brief "removed — undo" notice after a line is removed.`

- Reads `lastRemoved` and `undoRemove` from the store. Local state `visible` starts `false`.
- An effect on `[lastRemoved]`:
  - If `lastRemoved` is null, it sets `visible` to false.
  - Otherwise it sets `visible` to true and starts `window.setTimeout(() => setVisible(false), 6000)`. The cleanup clears the timer, so every new removal restarts the 6-second window.
- It renders nothing unless both `visible` and `lastRemoved` are truthy.
- Markup: `div role="status"` with `flex animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)] items-center justify-between gap-4 bg-[var(--text-espresso)] px-4 py-3 text-xs text-[var(--bg-travertine)]`.
  - Text: `Removed {getProduct(lastRemoved.slug)?.name}` (`truncate`).
  - Button **Undo** (`shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold-champagne)] hover:text-white`) calls `undoRemove`.
- `fadeUp` (`src/index.css`) animates from `opacity: 0; transform: translateY(16px)` to `opacity: 1; transform: translateY(0)`. There is no exit animation; the toast unmounts instantly.
- Only one level of undo exists. A second removal replaces `lastRemoved`.
- Each mounted `UndoToast` keeps its own `visible` state and timer. The drawer always has one mounted, the cart page adds another, and a newly mounted instance shows a still-pending `lastRemoved` for another 6 s (see Notes).
- What sets or clears `lastRemoved`: `removeLine` sets it, which covers Remove, decrease at qty 1 and Save for later. `undoRemove` and `clearCart` clear it. `updateQty(key, 0)` never sets it.

Placements: the drawer has one in the non-empty body (sticky) and one after the empty state. The cart page has one under the line list and one in the empty state (`mx-auto mt-6 max-w-md`).

---

## 10. `GiftOptions` (`src/components/cart/GiftOptions.tsx`)

- Props: `{ defaultOpen?: boolean }`, default `false`. No caller passes it.
- Constant `MAX = 200` caps the gift message. The order note is capped at 500 by an inline `.slice(0, 500)` and has no counter.
- Local state `noteOpen = useState(defaultOpen || !!meta.note)` controls the order-note disclosure. The drawer instance and the page instance each have their own.
- All values live in the store's `meta` (`CartMeta`) and are written with `setMeta({...})` patches. They persist in `localStorage['tns-cart-meta']` and are reset only by `clearCart()` ("Clear bag" or placing an order). Removing lines one at a time does not reset them.

Layout is `div.space-y-2`:

| Control | Element | Bound to | Limits and behaviour |
|---|---|---|---|
| Gift wrapping toggle | `<label>` card containing `input type="checkbox"`, the `Gift` icon, title, description and a "Free" tag | `meta.giftWrap` | `onChange`: `setMeta({ giftWrap: checked })` |
| Gift message | `textarea rows={3}`, `aria-label="Gift message"`, placeholder `Your message, handwritten by our team` | `meta.giftMessage` | Rendered only while `giftWrap` is true. `onChange` slices to 200. Counter `{length}/200` (`font-spec mt-1 text-right text-[10px] text-[var(--text-linen)]`). Unchecking gift wrap hides the field but keeps the text. |
| Gift receipt toggle | `<label>` card with checkbox and the `Receipt` icon | `meta.giftReceipt` | `setMeta({ giftReceipt: checked })` |
| Order note disclosure | `button` with `aria-expanded={noteOpen}`, the `NotebookPen` icon, "Order note" and a `ChevronDown` (`rotate-180` when open) | local `noteOpen` | Toggles the textarea |
| Order note | `textarea rows={3}`, `aria-label="Order note"`, placeholder `Delivery instructions, a surprise to keep, anything we should know` | `meta.note` | `onChange` slices to 500 |

Toggle-card recipe (local `toggle(on, label, desc, Icon, onChange)` helper):
- `<label>`: `flex cursor-pointer items-start gap-4 border px-4 py-3.5 transition-colors`, plus `border-[var(--text-espresso)]` when on, or `border-[var(--border-hairline)] hover:border-[var(--text-linen)]` when off.
- Checkbox: `mt-0.5 h-4 w-4 shrink-0 accent-[var(--text-espresso)]`. Icon: 16/1.3, gold.
- Title: `block text-[11px] uppercase tracking-[0.18em]`. Description: `mt-0.5 block text-xs text-[var(--text-linen)]`.
- "Free" tag: `font-spec ml-auto shrink-0 text-[10px] uppercase tracking-[0.16em] text-[var(--gold-vermeil)]`.

Gift message textarea classes: `font-serif-editorial w-full resize-none border border-[var(--border-hairline)] bg-transparent px-4 py-3 text-lg italic outline-none placeholder:not-italic placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]`.

Where `meta` shows up elsewhere:
- The drawer footer appends " Gift wrapped." when `giftWrap` is on.
- The cart Summary shows a "Gift wrapping — Complimentary" row.
- Checkout and the Shopify mapping in `src/lib/shopify.ts` never read `meta`.

---

## 11. `CartUpsell` (`src/components/cart/CartUpsell.tsx`)

Props: `{ layout?: 'rail' | 'grid'; onNavigate?: () => void; limit?: number }`, with defaults `'rail'` and `3`. It is only rendered when the cart is non-empty.

```ts
const PAIRS: Record<string, string[]> = {
  necklaces: ['earrings', 'bracelets'], earrings: ['necklaces', 'rings'], bracelets: ['rings', 'earrings'], rings: ['bracelets', 'earrings'],
  bridal: ['earrings', 'bracelets'], watches: ['bracelets', 'rings'], gifts: ['earrings', 'necklaces'], custom: ['earrings'], rentals: ['earrings'],
}

/** Pieces that can go straight into the bag without choosing size, dates or text. */
const quickAddable = (p: Product) => !p.rental && !p.personalization && p.metals.length > 0 && p.category !== 'rings' && p.category !== 'bridal' && p.category !== 'custom'
```

### 11.1 Selection (`useMemo` on `[cart, limit]`)

1. `inCart` is the set of cart slugs.
2. `cats` is the de-duplicated union of `PAIRS[category]` for each cart line's product. Gift-card lines have category `gifts`, which pairs with earrings and necklaces.
3. `pool` is every `PRODUCTS` entry that is not in the cart, is not slug `gift-card`, and whose name does not match `/commission|redesign/i`. That excludes "Bespoke Engagement Commission" and "Heirloom Redesign".
4. `paired` is the pool filtered to `cats`, in catalog order. `fallback` is the pool filtered to the `'Bestseller'` badge.
5. The result is `[...new Set([...paired, ...fallback])]`, stably sorted with quick-addable pieces first, then sliced to `limit`.
6. If nothing is left, the component returns `null`.

Worked examples, computed from the current catalog:

| Cart | Drawer (limit 3) | Page (limit 4) |
|---|---|---|
| Mont-Royal Solitaire Pendant (necklaces) | Vieux-Port Diamond Studs, Outremont Pearl Drops, Mile End Huggies | the same three plus Westmount Tennis Bracelet |
| Gift card only | Mont-Royal Solitaire Pendant, Rivière Saint-Laurent, Plateau Paperclip Chain | the same three plus Vieux-Port Diamond Studs |
| The Teresa Signet (rings) | Vieux-Port Diamond Studs, Outremont Pearl Drops, Mile End Huggies | the same three plus Westmount Tennis Bracelet |

The quick-addable products are mont-royal-solitaire-pendant, riviere-saint-laurent, plateau-paperclip-chain, vieux-port-diamond-studs, outremont-pearl-drops, mile-end-huggies, westmount-tennis-bracelet, atwater-cuff, griffintown-chain-bracelet, heritage-automatic-38, chronographe-1962, dame-du-lac and pearl-stud-gift-set.

### 11.2 Rendering

- Heading "Pairs beautifully with" (`mb-4 text-[11px] uppercase tracking-[0.22em]`).
- The list is `grid grid-cols-2 gap-6 lg:grid-cols-4` for `grid` and `space-y-3` for `rail`. Rail items are `flex items-center gap-4`.
- Image link: `group block shrink-0 overflow-hidden bg-[var(--bg-silk)]`, plus `aspect-[4/5]` (grid) or `h-16 w-13` (rail). The `img` has `alt=""`, `loading="lazy"` and `editorial-zoom`.
- Name link: `font-serif-editorial block truncate text-lg leading-tight hover:text-[var(--gold-vermeil)]`. Price: `<Price amount={priceFor(p, currency)} className="text-xs text-[var(--text-taupe)]" />`, the base price with no metal applied.
- Quick-addable pieces get a button with `` aria-label={`Add ${p.name} to bag`} ``:
  - On click: `addToCart({ slug: p.slug, metal: p.metals[0] })` and `setAdded(p.slug)`. Because `addToCart` opens the drawer, this happens on the cart page too.
  - Base classes: `flex shrink-0 items-center justify-center gap-2 border text-[10px] uppercase tracking-[0.18em] transition-colors`.
  - Grid layout adds `mt-3 w-full py-2.5` and shows text ("Quick add" or "Added"). Rail layout adds `h-9 w-9` and shows the icon only (`Plus`, or `Check` when added).
  - The added state uses `border-[var(--gold-vermeil)] bg-[var(--gold-vermeil)] text-white`; the idle state uses `border-[var(--border-hairline)] hover:border-[var(--text-espresso)]`.
- Other pieces get an **Options** link to `href.product(p.slug)` (`shrink-0 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)]`). The grid adds `mt-3 block border border-[var(--border-hairline)] py-2.5 text-center`.

---

## 12. `RewardProgress` (`src/components/cart/RewardProgress.tsx`)

- Uses `rewardProgress`, `rewardRemaining`, `rewardUnlocked` and `hasMerch` from `useCartTotals()`. It returns `null` if `!hasMerch`; both parents also check `hasMerch` first.
- The threshold is `REWARD_THRESHOLD`: **CAD 1000** or **USD 750**, measured against `merch` in the active currency. Gift cards never count; rental fees do.
- Message line (`flex items-center gap-2 text-xs text-[var(--text-taupe)]`) with a `Sparkles` icon (13/1.3, gold):
  - Unlocked (`merch >= threshold`): `Unlocked:` (in `text-[var(--text-espresso)]`) followed by ` a complimentary jewellery care kit is included with your order.`
  - Locked: `<Price amount={rewardRemaining} className="text-[var(--text-espresso)] [&_span]:hidden" />` followed by ` away from a complimentary jewellery care kit.`
- Bar: a track `mt-2.5 h-[2px] w-full overflow-hidden bg-[var(--border-hairline)]` with a fill `h-full bg-[var(--gold-vermeil)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]` and inline style `width: ${rewardProgress * 100}%`.
- The cart page shows a matching Summary row, "Jewellery care kit — Included", when unlocked.
- From the catalog data, these are the only single-unit lines priced below the threshold:
  - Initial Disc Pendant: CAD 680 / USD 495 in gold, CAD 280 / USD 203 in vermeil.
  - Pearl Stud Gift Set: CAD 540 / USD 395.
  - Engraved Nameplate Necklace in vermeil: CAD 850 / USD 623. Adding the diamond accent (+CAD 180 / +USD 130) lifts it over the threshold.
  - Rentals: Gala Diamond Collar weekend (CAD 650 / USD 475), Chandelier Sapphire Earrings weekend and week (CAD 320 and 720 / USD 235 and 525), and Bridal Tiara & Drops Set weekend (CAD 480 / USD 350).

  Every other piece unlocks the reward on its own at qty 1.

---

## 13. Checkout (`src/pages/Checkout.tsx`)

### 13.1 Render states & guards (checked in this order)

| State | Condition | Renders |
|---|---|---|
| Confirmation | `placed !== null` (local `useState<Confirmation \| null>`) | The confirmation screen (§13.12). It is checked first, so it still shows after `clearCart()` empties the bag. |
| Empty bag | `cart.length === 0` | `section.py-40.text-center` containing "Your bag is empty." (`font-serif-editorial text-4xl italic text-[var(--text-taupe)]`), a **Continue shopping** link to `href.home` (`#/`, `mt-8 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-vermeil)]`), and `RecentlyViewedStrip` in `mx-auto mt-16 max-w-md px-6` |
| Checkout form | otherwise | Form and summary (below) |

There are no other guards. There is no redirect, no minimum order and no stock check. The page is a single step with no multi-step wizard.

### 13.2 Layout

```text
section.mx-auto.grid.max-w-[1400px] gap-16 px-6 py-16 lg:grid-cols-12 lg:px-12 lg:py-24
+-- form.lg:col-span-7 (onSubmit=placeOrder) -+  +-- aside.lg:col-span-5 ------------------------+
| Checkout                                    |  | div.bg-silk.p-8.lg:sticky.lg:top-36           |
| SHOPPING IN                                 |  | ORDER SUMMARY                                 |
| [ CANADA · CAD ][ UNITED STATES · USD ]     |  | [img h-20 w-16]  Name               $x CAD    |
| EMAIL ____________________________ (2 cols) |  |                  DETAIL · DETAIL · ×1         |
| FIRST NAME _______   LAST NAME _______      |  | --------------------------------------------- |
| ADDRESS __________________________ (2 cols) |  | (gift) GIFT CARD                              |
| CITY _____________   PROVINCE|STATE [v]     |  | [ XXXX XXXX XXXX XXXX           ][ APPLY ]   |
| POSTAL CODE|ZIP ___  PHONE _______          |  | error line / applied-card rows                |
|   (or "Digital gift cards only — ...")      |  | --------------------------------------------- |
| notice paragraph (text-xs)                  |  | Merchandise                          $x CAD   |
| [ (lock) PLACE ORDER ]                      |  | Gift cards                           $x CAD   |
+---------------------------------------------+  | Insured shipping              Complimentary   |
                                                 | Tax · GST 5% + QST 9.975%            $x CAD   |
                                                 | Gift cards applied                 − $x CAD   |
                                                 | TOTAL DUE                            $x CAD   |
                                                 +-----------------------------------------------+
```

Below `lg` everything stacks in one column, with the form first. The field grid is one column below `sm` and two at `sm:`.

Shared class constants:
- `field = 'mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]'`
- `label = 'text-[11px] uppercase tracking-[0.22em]'`

The `h1` "Checkout" uses `font-serif-editorial text-6xl font-light`.

### 13.3 Local state & derived values

| Name | Kind | Initial or formula |
|---|---|---|
| `province` | state | `'QC'` |
| `placed` | state | `null`, or `{ order, issued, paidWithCards }` |
| `code` | state | `''`, the raw text typed in the gift-card field |
| `codeError` | state | `null` |
| `applied` | state | `Applied[]` = `{ card: IssuedCard; available: number }`, where `available` is in the checkout currency |
| `isCA` | derived | `currency === 'CAD'` |
| `giftLines`, `merchLines` | derived | cart split on `l.giftCard` |

```ts
const merch = merchLines.reduce((s, l) => s + linePrice(l), 0)
const giftTotal = giftLines.reduce((s, l) => s + linePrice(l), 0)
// Gift cards are not taxed at sale; tax applies to merchandise only.
const tax = isCA ? Math.round(merch * PROVINCES[province].rate) : 0
// Gift cards can pay for merchandise and tax, but not for other gift cards.
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

Applied cards are used in the order they were applied. Worked example: in CAD with Québec selected, one Mont-Royal Solitaire Pendant (6,850) and the seeded demo card `TERESASONS1962MT` (CAD 250, defined in `src/data/giftcards.ts`) applied. Tax = `Math.round(6850 × 0.14975)` = 1,026. `payableByCards` = 7,876. The card covers 250, so **Total due** is 7,626.

### 13.4 "Shopping in" currency fieldset

- `fieldset.mt-12` with `legend` "Shopping in" in the `label` style. It holds a `mt-3 grid grid-cols-2 border border-[var(--border-hairline)]` of two `button type="button"` elements labelled `Canada · CAD` and `United States · USD`.
- Button classes: `py-4 text-[11px] uppercase tracking-[0.2em]`. The active one adds `bg-[var(--text-espresso)] text-[var(--bg-travertine)]`. There is no `aria-pressed`.
- On click: `setCurrency(c)`, which changes and persists the site-wide currency, and re-converts every applied card with `available: convert(x.card.balance, x.card.currency, c)`.

### 13.5 Contact & shipping fields

None of these controls has a `name`, an `id` or an `autocomplete` token. Labels wrap their inputs, which associates them implicitly. The values are uncontrolled and never read: `placeOrder` does not collect them. Native constraint validation (`required`, `type="email"`, `pattern`) runs because the `<form>` has no `noValidate` and the submit `<button>` uses the default `type="submit"`. Pressing Enter in any of the text-type inputs (email, text, tel) triggers implicit submission.

| # | Visible label | Element / type | `required` | Extra validation | `autocomplete` | `placeholder` | Shown when | Value handling |
|---|---|---|---|---|---|---|---|---|
| 1 | Email | `input type="email"` (label `sm:col-span-2`) | yes | browser email syntax | — | — | always | uncontrolled |
| 2 | First name | `input` (text) | yes | — | — | — | always | uncontrolled |
| 3 | Last name | `input` (text) | yes | — | — | — | always | uncontrolled |
| 4 | Address | `input` (text; label `sm:col-span-2`) | yes | — | — | — | `needsShipping` | uncontrolled |
| 5 | City | `input` (text) | yes | — | — | — | `needsShipping` | uncontrolled |
| 6a | Province | `select`, 10 options from `PROVINCES` (value = code, text = `name`) | no | — | — | — | `needsShipping && isCA` | controlled by `province` (default `QC`); drives the tax rate and label |
| 6b | State | `select`, 9 options from `US_STATES` (value = text) | no | — | — | — | `needsShipping && !isCA` | uncontrolled; defaults to the first option, `New York`; never read |
| 7 | Postal code (CAD) / ZIP code (USD) | `input` (text), classes `field` + `font-spec uppercase` | yes | `pattern` CA `[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d`, US `\d{5}(-\d{4})?` | — | `H3G 1K4` / `10001` | `needsShipping` | uncontrolled. `uppercase` is visual only. The same DOM input stays mounted across a currency switch, so typed text survives while the pattern changes. |
| 8 | Phone | `input type="tel"` | yes | no pattern | — | — | `needsShipping` | uncontrolled |

When `needsShipping` is false (a bag of digital gift cards only), rows 4–8 are replaced by `p.text-sm.text-[var(--text-taupe)].sm:col-span-2` reading `Digital gift cards only — no shipping address needed.`. Only Email, First name and Last name are required in that case.

The gift-card code input lives in the summary aside, outside the `<form>`. It is documented in §13.8.

### 13.6 Shipping options

There is no shipping-method selector. Insured shipping is always shown as `Complimentary` when `needsShipping`. The notice paragraph (`mt-10 text-xs leading-relaxed text-[var(--text-taupe)]`) is `Payment is completed securely through Shopify Checkout. ` followed by one of:
- CAD: `Orders ship insured via signature-required courier.`
- USD: `Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required.`

### 13.7 Order summary list

- `p` "Order summary" in the `label` style, followed by `ul.mt-6.divide-y.divide-[var(--border-hairline)]`.
- For each line, `p = getProduct(l.slug)`. Lines with an unknown slug render nothing.
- Each row is `li.flex.gap-4.py-4`:
  - Thumbnail: gift-card lines get `div.w-16.shrink-0.pt-1` with `GiftCardArt` (`design`, `currency`, `amount`; no recipient, no code). Other lines get `img src={p.images[0]} alt="" className="h-20 w-16 object-cover"`.
  - Name: `font-serif-editorial text-lg leading-tight`.
  - Meta line: `font-spec mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]`, rendering `{lineDetails(l, p).join(' · ')} · ×{l.qty}`.
  - Price: `<Price amount={linePrice(l)} className="text-sm" />`.
- Lines cannot be edited from checkout. The header bag icon still opens the drawer, though, and the drawer can change the cart; checkout recomputes when it does.

### 13.8 Gift-card redemption

Markup, inside `div.mt-4.border-t.pt-6`:
- `label htmlFor="gc-code"` (`flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]`) containing a `Gift` icon (13/1.3, gold) and "Gift card".
- Input row `mt-2 flex border border-[var(--border-hairline)] bg-[var(--bg-travertine)]`:
  - `input id="gc-code"`, `value={formatCode(code)}`, `maxLength={19}` (16 characters plus 3 spaces), `placeholder="XXXX XXXX XXXX XXXX"`, `autoComplete="off"`, `spellCheck={false}`.
  - Classes: `font-spec min-w-0 flex-1 bg-transparent px-3 py-3 text-xs uppercase tracking-[0.14em] outline-none placeholder:opacity-40`.
  - `onChange` stores the raw value in `code` and clears `codeError`. `onKeyDown` on Enter calls `preventDefault()` and then `applyCode()`.
  - `formatCode` (`src/data/giftcards.ts`) uppercases, strips anything outside `A-Z0-9` and groups the result in fours with spaces, e.g. `TERE SASO NS19 62MT`.
- **Apply** is a `button type="button"` (`px-4 text-[10px] font-medium uppercase tracking-[0.2em] hover:text-[var(--gold-vermeil)]`).
- Errors render as `p.mt-2.text-xs.text-red-700`.

`applyCode()` clears the error, runs these checks in order and stops at the first failure:

| # | Check | Error copy |
|---|---|---|
| 1 | `!isCodeFormat(code)`, where the format is exactly 16 `[A-Z0-9]` characters after normalising | `Enter the 16-character code from your gift card.` |
| 2 | `lookupCard(code)` returns `null` (searches the `tns-giftcard-ledger` list, which always includes the demo card) | `This gift card could not be found.` |
| 3 | `card.balance <= 0` | `This gift card has no remaining balance.` |
| 4 | that code is already in `applied` | `This gift card is already applied.` |
| 5 | `payableByCards - cardsTotal <= 0` | `Your order is already fully covered.` when `merch` is non-zero; otherwise `Gift cards can’t be used to buy other gift cards.` |
| ✓ | all checks pass | appends `{ card, available: convert(card.balance, card.currency, currency) }` and clears `code` |

Applied-card rows (`ul.mt-3.space-y-2`, each `li.flex.items-center.justify-between.gap-3.text-xs`):
- Left side: a remove button (`X` size 12, `type="button"`, `aria-label="Remove gift card"`) that filters the card out of `applied`, then `maskCode(code)`, which renders `•••• •••• •••• 62MT`.
- Right side (taupe): `− ` plus the amount used (code hidden). If `available - use > 0`, it adds `(` + leftover amount + ` left)`.

### 13.9 Totals rows (`dl.mt-6.space-y-3.border-t.pt-6.text-sm`)

| `dt` | Shown when | `dd` |
|---|---|---|
| Merchandise | `merch > 0` | `<Price amount={merch} />` |
| Gift cards | `giftTotal > 0` | `<Price amount={giftTotal} />` |
| Insured shipping | `needsShipping` | `Complimentary` (`font-spec`) |
| `Tax · {PROVINCES[province].label}` (CAD) / `Sales tax` (USD) | `merch > 0` | CAD: `<Price amount={tax} />`. USD: `<span className="text-xs text-[var(--text-taupe)]">Calculated by Shopify</span>` |
| Gift cards applied (row in `text-[var(--gold-vermeil)]`) | `cardsTotal > 0` | `− <Price amount={cardsTotal} />` |
| Total due (`text-[11px] uppercase tracking-[0.2em]`, row `border-t pt-4 text-base`) | always | `<Price amount={total} />` in `dd.text-xl` |

### 13.10 Tax & duties

The province and tax data come from `src/data/tax.ts` ("Canadian sales tax by province (GST/HST + PST/QST), 2024 rates."). Tax is `Math.round(merch × rate)` on merchandise only, never on gift-card lines. The cart page uses the same formula with its own `region` select.

| Code | `name` (option text) | `rate` | `label` (checkout row) |
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

`US_STATES` lists `New York`, `California`, `Florida`, `Illinois`, `Massachusetts`, `Texas`, `Vermont`, `Washington` and `Other`. In USD, tax is `0` in the math and the row reads "Calculated by Shopify".

Duty messaging appears in two places:
- The USD checkout notice: "Duties and import fees are prepaid by Teresa & Sons; …".
- The USD drawer shipping line: "…to the U.S., duties included".

### 13.11 Payment (simulated) & place order

There is no card, wallet or address-verification UI. The only payment-related elements are:
- gift-card redemption;
- the notice "Payment is completed securely through Shopify Checkout.";
- the submit button, whose label is `Place order` normally and `Place order — no payment due` when `total === 0`.

The button classes are `mt-8 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]`, with a `Lock` icon (14/1.6). "Shop Pay" appears only in the installment copy in the drawer and on the cart page.

`placeOrder(e)` runs only after native validation passes, and does the following in order:
1. `e.preventDefault()`.
2. `const shopifyItems = giftLines.map(toShopifyCartItem)`. If there are any, it calls `console.info('[Shopify] gift card cart items', shopifyItems)`. These are the documented `/cart/add.js` payloads (see [Shopify integration](../shopify-integration.md)). Merchandise lines are not mapped.
3. `debitCards(usage.filter((u) => u.use > 0).map((u) => ({ code: u.card.code, amount: u.use, currency })))`. For each card this subtracts `convert(amount, currency, card.currency)` from its ledger balance, floored at 0.
4. `issueCards(giftLines.map((l) => l.giftCard!), giftLines.map((l) => l.qty))` creates one card per unit, each with a generated 16-character code. Cards are written to the ledger with `recipientName` left undefined for "toSelf", and `expiresAt: null`.
5. Each issued card is paired with its source line (`flatMap` over `qty`, consuming the issued array in order).
6. `` setPlaced({ order: `TS-${Date.now().toString().slice(-6)}`, issued, paidWithCards: cardsTotal }) ``.
7. `clearCart()`, which empties the cart, resets `meta` and clears `lastRemoved`.

### 13.12 Confirmation screen

`section.mx-auto.max-w-3xl.px-6.py-32.text-center`:
- Eyebrow `Order {placed.order}`, e.g. `Order TS-849280` (`font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]`).
- `h1` `Merci.` (`font-serif-editorial mt-6 text-6xl font-light`).
- `p.mt-6.text-[var(--text-taupe)]`: `A confirmation is on its way.`, followed by ` {Price} was paid with gift cards.` if `paidWithCards > 0`. That price shows its currency code.
- If gift cards were issued: the label "Your gift cards", then `ul.mt-6.grid.gap-8.sm:grid-cols-2`. Each item shows `GiftCardArt` with the full `code`, `amount={card.initial}` and `to={card.recipientName}`, plus a delivery line (`mt-4 text-sm text-[var(--text-taupe)]`):
  - physical delivery: `Mailed in our travertine box, 2–5 business days.`
  - `toSelf`: `Emailed to you now.`
  - otherwise: `Emailed to {recipientEmail} on {formatDay(sendOn)}.` or `Emailed to {recipientEmail} now.`
- Links (`mt-14 flex flex-wrap justify-center gap-10`, class `link-line`): **Return to the maison** to `#/`, and, when cards were issued, **View in your account** to `#/account`.
- `placed` is component state. Leaving `#/checkout` unmounts the page and discards the confirmation. Coming back shows the empty-bag state, or the form if items were added in the meantime.

---

## 14. Constants & change points

| What | Where | Current value |
|---|---|---|
| Reward threshold | `REWARD_THRESHOLD` in `src/components/cart/useCartTotals.ts` | `{ CAD: 1000, USD: 750 }` |
| Installment count | `useCartTotals` (`subtotal / 4`) and copy in `CartDrawer` and `Cart` | 4 |
| Undo window | `UndoToast` | 6000 ms |
| Stepper max | `CartLineItem` (`Math.min(10, …)`) | 10 |
| Gift-message limit | `MAX` in `GiftOptions` | 200 |
| Order-note limit | inline in `GiftOptions` | 500 |
| Upsell pairing and eligibility | `PAIRS`, `quickAddable` and pool filters in `CartUpsell` | see §11 |
| Upsell counts | `CartDrawer` (default 3), `Cart` (`limit={4}`) | 3 / 4 |
| Delivery estimate | `deliveryDate(4)` in `Cart` | 4 business days |
| Default province | `useState('QC')` in both `Cart` (`region`) and `Checkout` (`province`) | QC |
| Provinces and rates, US states | `src/data/tax.ts` | §13.10 |
| Drawer width and motion | `CartDrawer` classes | `max-w-[460px]`, 700 ms panel, 500 ms backdrop |
| Focus delay | `CartDrawer` effect | 50 ms |
| Order-number format | `placeOrder` | `TS-` + last 6 digits of `Date.now()` |

---

## 15. Copy deck (verbatim)

Dynamic parts appear as `{…}`. Text shown uppercase by CSS keeps its source case here. Typographic characters are exact: ’ (U+2019), – (U+2013), — (U+2014), · (U+00B7), × (U+00D7), − (U+2212), “ ” (U+201C/U+201D), … (U+2026), • (U+2022), é.

### 15.1 Drawer (`CartDrawer`)

| Where | Copy |
|---|---|
| Header bag trigger (aria-label, `Header.tsx`) | `Open bag` |
| Dialog aria-label | `Shopping bag` |
| Title | `Your Bag`, plus `({count})` when count > 0 |
| Close button aria-label | `Close bag` |
| Empty title | `Your bag is empty.` |
| Empty sub-line | `Begin with something that will outlast the occasion.` |
| Empty links | `necklaces`, `earrings`, `rings` (shown uppercase), `Gift cards` |
| Gifting section label | `Gifting` |
| Footer label | `Subtotal` |
| Shipping line, CAD | `Complimentary insured shipping across Canada. Taxes calculated at checkout.` |
| Shipping line, USD | `Complimentary insured shipping to the U.S., duties included. Taxes calculated at checkout.` |
| Gift-wrap suffix (appended with a leading space) | ` Gift wrapped.` |
| Installments | `Or 4 interest-free payments of {amount} with Shop Pay` |
| Primary CTA | `Secure checkout` |
| Secondary CTA | `View full bag` |
| Trust row | `Fully insured` · `30-day returns` |

### 15.2 Cart page (`Cart`)

| Where | Copy |
|---|---|
| Eyebrow | `Votre sélection` |
| H1 | `Your Bag` ("Bag" in gold italic `<em>`) |
| Count | `{n} piece` / `{n} pieces` |
| Clear button | `Clear bag` |
| Confirm dialog | `Remove everything from your bag?` |
| Empty title | `Your bag is empty.` |
| Empty sub-line | `Begin with something that will outlast the occasion.` |
| Empty CTAs | `Find your piece` · `Gift cards` |
| Gifting heading | `Gifting & notes` |
| Gifting intro | `Every order arrives in our signature box. Add finishing touches below at no charge.` |
| Assurances | see the table in §6.5 |
| Summary heading | `Summary` |
| Summary rows | `Jewellery` · `Gift cards` · `Shipping` (`Digital delivery` / `Complimentary`) · `Gift wrapping` (`Complimentary`) · `Jewellery care kit` (`Included`) · `Est. tax` · `Tax` (`Calculated at checkout`) |
| Province select aria-label | `Province` |
| Gift-card tax note | `Gift cards are not taxed.` |
| Total label | `Estimated total` / `Subtotal` |
| Installments | `Or 4 interest-free payments of {amount} with Shop Pay` |
| Delivery estimate | `Order today, arrives by {Wed, October 21}` |
| CTA | `Secure checkout` |
| Below CTA | `Gift cards and promo codes can be applied at checkout.` |
| Consultation | `Questions? ` + link `Book a private consultation` |

### 15.3 Shared cart components

| Component | Where | Copy |
|---|---|---|
| `CartLineItem` | eyebrow | `Rental` / `Gift card` / `{collection}` |
| | remove aria-label | `Remove {product name}` |
| | actions | `Edit` · `Save for later` · `View on you` |
| | stepper aria-labels | `Decrease quantity` · `Increase quantity` |
| | unit price | `{amount} each` |
| `CartUpsell` | heading | `Pairs beautifully with` |
| | quick-add aria-label | `Add {product name} to bag` |
| | grid button text | `Quick add` / `Added` |
| | non-quick link | `Options` |
| `GiftOptions` | gift wrap | `Gift wrapping` / `Travertine box, silk ribbon, handwritten card` / `Free` |
| | gift message placeholder / aria-label / counter | `Your message, handwritten by our team` / `Gift message` / `{n}/200` |
| | gift receipt | `Gift receipt` / `Prices hidden on the packing slip` / `Free` |
| | note toggle / placeholder / aria-label | `Order note` / `Delivery instructions, a surprise to keep, anything we should know` / `Order note` |
| `RewardProgress` | unlocked | `Unlocked:` + ` a complimentary jewellery care kit is included with your order.` |
| | locked | `{amount} away from a complimentary jewellery care kit.` |
| `UndoToast` | text / button | `Removed {product name}` / `Undo` |
| `lineDetails` | strings | see §8 (`… design · Digital`, `Physical card`, `For me`, `To …`, `Sends …`, `Weekend rental`, `One-week rental`, `One-month rental`, `Size …`, `… → …`, `Salon fitting · …`, `Courier · …`, `Reverse: “…”`, `Engraving: “…”`) |
| `RecentlyViewedStrip` (documented in [Global chrome & shared components](../components/global-and-shared.md)) | title / clear aria-label | `Recently viewed` / `Clear recently viewed` |

### 15.4 Checkout (`Checkout`)

| Where | Copy |
|---|---|
| H1 | `Checkout` |
| Currency legend / options | `Shopping in` / `Canada · CAD` / `United States · USD` |
| Field labels | `Email` · `First name` · `Last name` · `Address` · `City` · `Province` / `State` · `Postal code` / `ZIP code` · `Phone` |
| Placeholders | `H3G 1K4` (CAD postal) · `10001` (US ZIP) · `XXXX XXXX XXXX XXXX` (gift card) |
| No-shipping note | `Digital gift cards only — no shipping address needed.` |
| Notice, CAD | `Payment is completed securely through Shopify Checkout. Orders ship insured via signature-required courier.` |
| Notice, USD | `Payment is completed securely through Shopify Checkout. Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required.` |
| Submit | `Place order` / `Place order — no payment due` |
| Summary label | `Order summary` |
| Line meta | `{detail} · {detail} · ×{qty}` |
| Gift-card label / button | `Gift card` / `Apply` |
| Gift-card errors | `Enter the 16-character code from your gift card.` · `This gift card could not be found.` · `This gift card has no remaining balance.` · `This gift card is already applied.` · `Your order is already fully covered.` · `Gift cards can’t be used to buy other gift cards.` |
| Applied card | aria-label `Remove gift card`; `•••• •••• •••• {last4}`; `− {amount}`; `({amount} left)` |
| Totals | `Merchandise` · `Gift cards` · `Insured shipping` (`Complimentary`) · `Tax · {label}` / `Sales tax` (`Calculated by Shopify`) · `Gift cards applied` (`− {amount}`) · `Total due` |
| Empty state | `Your bag is empty.` / `Continue shopping` |
| Confirmation | `Order {TS-xxxxxx}` · `Merci.` · `A confirmation is on its way.` · ` {amount} was paid with gift cards.` · `Your gift cards` · `Mailed in our travertine box, 2–5 business days.` · `Emailed to you now.` · `Emailed to {email} on {Wed, Oct 21}.` · `Emailed to {email} now.` · `Return to the maison` · `View in your account` |
| Console (developer) | `[Shopify] gift card cart items` |

`GiftCardArt` adds its own copy: `Teresa & Sons`, `Carte-cadeau · Montréal`, `For {name}` and `•••• •••• •••• ••••`. See [Gift cards](gift-cards.md).

---

## Notes & gotchas

### Probable bugs

- **The header currency toggle skips the gift-card re-conversion.** Checkout's own "Shopping in" buttons re-convert `applied[].available`, but the header toggle only calls `setCurrency`, and the header stays visible on `#/checkout`. After switching through the header, a card applied in one currency keeps its `available` figure but is spent in the other. `debitCards` then converts the spend back, so the value used and the value debited no longer match. Example: CAD 250 applied, then switched to USD, uses USD 250 and debits `round(250 / 0.73)` = 342 CAD, which clamps to 0.
- **The stepper's "+" can lower a quantity.** It sets `Math.min(10, qty + 1)`, but `addToCart` is uncapped and the gift-card builder lets you add up to 20 at once. A line at 12 drops to 10 when "+" is pressed.
- **The upsell "Added" state is effectively dead.** After a quick add the product is in the cart and leaves `picks` on the next render, so "Added" and the `Check` icon are never seen. `added` is never reset, though. If the product is later removed while that `CartUpsell` is still mounted, it comes back already styled as "Added".
- **Quick add on the cart page opens the drawer** over `#/cart`, because `addToCart` always sets `cartOpen`. The same applies to adds from the video viewer (`z-[100]`) and the try-on studio (`z-[110]`): the drawer (`z-[90]`) opens underneath those overlays.
- **Escape from try-on also closes the bag.** Both `CartDrawer` and `TryOnStudio` listen for `keydown` on `window`, so Escape inside a studio opened from a bag line ("View on you") closes the studio and the drawer together. The studio's cleanup also calls `lenis?.start()` even though the drawer still holds its scroll lock.

### Data and copy inconsistencies

- **Gift options never reach checkout.** `CartMeta` (gift wrap, message, receipt, note) is documented as mapping to Shopify `note` and `attributes`, but checkout never reads `meta`, `src/lib/shopify.ts` does not map it, the confirmation does not mention it, and `placeOrder` resets it through `clearCart()`.
- **Shipping messaging disagrees for gift-card-only bags.** The cart page's Shipping row says `Digital delivery` whenever the bag has no merchandise, even for physical gift cards. Checkout's `needsShipping` does count physical cards. The drawer's shipping sentence ("Complimentary insured shipping…") shows for every bag, digital-only included.
- **Province is chosen twice.** The cart page's `region` and checkout's `province` are separate states, each defaulting to `QC`. A province picked on the cart page is not carried over.
- **USD orders can show $0 due before tax.** In USD, `tax` is `0` in the math while the row says "Calculated by Shopify". `Total due` excludes sales tax, and gift cards can bring it to 0, which produces "Place order — no payment due".
- **Promo codes are promised but missing.** The cart page says "Gift cards and promo codes can be applied at checkout.", but checkout has no promo-code field.
- **Installments use the pre-tax subtotal.** The figure is `Math.round(subtotal / 4)`, while the cart page's "Estimated total" includes estimated tax in CAD.
- **Spelling (fixed 2026-10-21).** English is Canadian on every surface ("Jewellery", "Bridal Jewellery"); US visitors get US spelling ("Jewelry") through `src/i18n/us.ts`. All cart and checkout copy is bilingual; see [../features/languages.md](../features/languages.md).

### Behaviour to know before changing anything

- **The strikethrough price never renders today.** For non-gift, non-rental lines `fullPrice` is computed exactly the way `linePrice` computes `unit`, so `fullPrice !== unit` is never true. It looks like a hook for future compare-at or discount pricing.
- **Edit only navigates.** It goes to the PDP or the gift-card builder without loading the line's configuration. Saving a changed configuration creates a new line (a different `lineKey`) rather than editing this one.
- **Undo has one level and can come back late.**
  - Removing a second line replaces the first in `lastRemoved`.
  - `lastRemoved` stays set after the 6-second toast hides, until undo, clear or the next removal.
  - Any newly mounted `UndoToast` shows it again for 6 s. Examples: opening `#/cart` later, or the drawer switching to its empty-state toast.
  - "Save for later" produces the same "Removed …" toast.
- **`updateQty(key, 0)` bypasses undo.** It deletes the line without setting `lastRemoved`. The UI avoids it by calling `removeLine` at qty 1; keep doing that.
- **Rentals can be stacked.** A rental line's stepper allows up to 10 units of a single-piece rental on the same dates. The refundable deposit (`RentalRates.deposit`) is never shown or charged in the bag or checkout. The delivery estimate is hidden whenever a rental is in the bag.
- **Stale lines stay invisible but counted.** Lines whose slug is unknown (for example, stale data in `tns-cart`) are skipped by `CartLineItem` and the checkout summary, yet still count toward `count`, `hasMerch` and, for gift-card lines, the totals.
- **The checkout form collects nothing.** No `name`, `id` or `autocomplete` tokens; uncontrolled values that are never read; an uncontrolled US State select; no phone pattern. The postal `uppercase` class does not change the submitted value, and lower-case postal codes pass the pattern.
- **Conversions are rounded both ways.** `convert` rounds when a card is applied and again when it is debited, so balances can drift by a unit across currencies (clamped at 0).
- **Order confirmation is fragile.**
  - The order number (`TS-` + last 6 digits of `Date.now()`) is not guaranteed unique.
  - The confirmation lives in component state.
  - Its `Price` amounts are reformatted in whatever currency is current, without conversion.
- **The cart page's total is not actually serif.** `<Price className="font-serif-editorial text-3xl" />` comes out in the spec face (Jost): `Price` always applies `.font-spec`, and in `src/index.css` that rule comes after `.font-serif-editorial`. Both are unlayered single-class rules, so the later one wins.
- **Accessibility gaps.**
  - The drawer has no focus trap, does not restore focus, and leaves the page behind it focusable despite `aria-modal="true"`.
  - The checkout currency buttons lack `aria-pressed`.
  - Detail lines are uppercased by CSS, so engraving and personalization text is not shown in the case the customer typed.
- **No reduced-motion handling for these animations.** The drawer slide, backdrop fade, reward bar and toast `fadeUp` all ignore `prefers-reduced-motion`; `src/index.css` only disables the film grain (the marquees stop themselves). Under reduced motion Lenis is never created, so the drawer's lock falls back to `body { overflow: hidden }` alone.
- **Scroll locks are applied to different elements.** The drawer locks `document.body`, while the try-on studio, video viewer and review overlays lock `document.documentElement`.

## Related docs

- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](../commerce-logic.md)
- [Data layer — catalog, media, gift cards, costing & tax](../data-model.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [Gift cards — purchase builder & balance checker](gift-cards.md)
- [Product detail page (PDP) — orchestration & purchase flow](product.md)
- [PDP modules](../components/pdp-modules.md)
- [Virtual try-on](../features/virtual-try-on.md)
- [Shoppable video & the Atelier page](../features/shoppable-video-and-atelier.md)
- [Account & wishlist pages](account-and-wishlist.md)
- [Global chrome & shared components](../components/global-and-shared.md)
- [Architecture & runtime model](../architecture.md)
- [Design system](../design-system.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [Brand, voice & copywriting](../brand-voice-and-copy.md)
- [UX patterns, responsive behaviour & accessibility](../ux-patterns-and-accessibility.md)
- [Known issues, risks & tech debt](../known-issues.md)
- [File index](../INDEX.md)
