# Gift cards — purchase builder & balance checker

`#/gift-cards` (alias `#/p/gift-card`) renders `src/pages/GiftCards.tsx`: a four-step builder (design → amount → delivery → recipient) with a live, tilting card preview, followed by "how it works", a dark balance-checker band and an FAQ. Cards are modelled on Shopify's native gift-card product; purchase, issuing and redemption are simulated with a localStorage ledger (`tns-giftcard-ledger`).

Scope: `src/pages/GiftCards.tsx`, `src/components/giftcard/GiftCardArt.tsx`, `src/components/giftcard/BalanceChecker.tsx`, `src/data/giftcards.ts`, `src/lib/shopify.ts`, `src/components/lineDetails.ts`, `src/store.tsx`

## 1. Layout

```
┌ Hero (bg-silk) ─────────────────────────────────────────────────────────────┐
│ GIFTS / CARTE-CADEAU                         ╱espresso card (rotate-6, 60%)╲  │
│ The gift of choosing.                         travertine card "For you" -3°  │
│ Redeemable online and in…  ✓No expiry ✓Schedule ✓Online & in salon          │
├ Builder (12 cols) ──────────────────────────────────────────────────────────┤
│ [sticky preview card, tilts with mouse]    │ 01 DESIGN   [4 swatches]        │
│ ["message" quote card if message]          │ 02 AMOUNT (CAD) [6 presets][$ custom]│
│ DESIGN | DELIVERY | ARRIVES               │ 03 DELIVERY [By email][Physical]│
│                                            │ 04 RECIPIENT [someone else|me] … │
│                                            │ [− 1 +] [ADD TO BAG — $250 CAD]  │
├ How it works (3 cells, hairline grid) ─────────────────────────────────────┤
├ Balance (bg-vault): "Check your balance" + BalanceChecker(dark) ────────────┤
└ FAQ: SectionHeader "Gift card details" + Corporate gifting box | Accordion ─┘
```

All sections use `max-w-[1600px] px-6 lg:px-12`; the page root is wrapped in `useReveal(root)`.

## 2. Builder state (component-local)

| State | Initial | Notes |
|---|---|---|
| `design` | `DESIGNS[0].id` (`'travertine'`) | 4 designs: Travertine, Espresso, Vermeil, Mont-Royal (gradient `background`, `ink`, `accent` in `src/data/giftcards.ts`) |
| `amount` | `250` | Preset choice; `DENOMINATIONS[currency]` = 100, 250, 500, 1000, 2500, 5000 (same numbers in both currencies) |
| `custom` | `''` | Digits only, max 5 chars (`replace(/\D/g, '').slice(0, 5)`); when non-empty it overrides `amount` (`value = custom ? Number(custom) : amount`) |
| `delivery` | `'email'` | `'email' \| 'physical'` |
| `toSelf` | `false` | "For someone else" / "For me" segmented toggle |
| `recipientName`, `recipientEmail`, `senderName`, `message` | `''` | message capped at `MESSAGE_MAX = 200` with a `{n}/200` counter |
| `sendOn` | today (`isoDate(new Date())`) | `<input type="date" min={today} max={today + 365 days}>`; clearing resets to today |
| `qty` | `1` | Stepper clamps 1–20 |
| `errors` | `[]` | Rendered as `<ul role="alert" class="… text-red-700">` |
| `added` | `false` | Shows "Added to bag" for 2400 ms (timeout not cleared on unmount) |

Derived: `[min, max] = CUSTOM_RANGE[currency]` (CAD 50–10 000, USD 50–7 500); `today`, `maxDate`; `recipientShown` (trimmed name when not for self).

## 3. Validation & add to bag (`submit`)

On submit (`noValidate` form), errors are collected in order:
1. `!Number.isFinite(value) || value < min || value > max` → `Choose an amount between {min} and {max}.` (formatted with `formatPrice`; presets are validated too).
2. Not for self and empty name → `Add the recipient’s name.`
3. Not for self, email delivery, and email fails `/^\S+@\S+\.\S+$/` → `Add a valid recipient email.`

If valid, it builds one `GiftCardLine`:

```ts
{ amount: Math.round(value), currency, design, delivery, toSelf,
  recipientName: toSelf ? undefined : recipientName.trim(),
  recipientEmail: toSelf || delivery !== 'email' ? undefined : recipientEmail.trim(),
  senderName: senderName.trim() || undefined,
  message: message.trim() || undefined,
  sendOn: !toSelf && delivery === 'email' && sendOn !== today ? sendOn : undefined }
```

and calls `addToCart({ slug: GIFT_CARD_SLUG, giftCard: line })` **once per unit** (`qty` times). Identical lines stack via `lineKey` (which JSON-stringifies `giftCard`), so the bag shows one line with `qty`. `addToCart` opens the drawer. In the bag, `linePrice` converts the card's native currency to the display currency with `convert()` (nearest $1).

The CTA (`py-5 text-[11px] font-medium uppercase tracking-[0.26em]`, espresso → vermeil on hover/added) reads `Add to bag — {Price(value × qty)}` or `✓ Added to bag`. Below it: "Gift cards are not taxed at purchase and cannot be paid for with another gift card."

## 4. Live preview

- `GiftCardArt` (`src/components/giftcard/GiftCardArt.tsx`): ISO ID-1 proportions `aspect-[1.586]`, `rounded-[4%/6.3%]`, `shadow-[0_30px_60px_-30px_rgba(20,19,17,0.55)]`, `containerType: 'inline-size'` so all text is sized in `cqi`. Shows a 14-ellipse guilloche SVG (`opacity-[0.12]`, accent stroke), wordmark "Teresa & Sons" (ampersand in accent), `Carte-cadeau · Montréal`, a chip swatch, optional `For {to}`, the code (`formatCode(code)` or `•••• •••• •••• ••••`) and the amount (`formatPrice(amount, currency)` + currency, or `—`). Props: `{ design: string; amount?: number; currency: Currency; to?: string; code?: string; className?: string }`; unknown design ids fall back to `DESIGNS[0]`.
- The builder preview tilts with the mouse only (`pointerType === 'mouse'`): `perspective(1200px) rotateY(x·12deg) rotateX(−y·10deg)`, reset on leave; wrapper `transition-transform duration-500 ease-out [transform-style:preserve-3d]`, sticky at `lg:top-36`.
- A quote card (`“{message}”` + `— {sender}`) appears when a message is typed; a 3-cell spec strip shows Design / Delivery (`Email` / `Mailed`) / Arrives (`2–5 days` for physical, `Instantly` for self or today, else the formatted send date).

## 5. Balance checker (`src/components/giftcard/BalanceChecker.tsx`)

Props `{ tone?: 'light' | 'dark' }` (dark on this page, light on Account). Input `id="gc-balance"` shows `formatCode(code)` (groups of 4), `maxLength={19}`, placeholder `XXXX XXXX XXXX XXXX`, `autoComplete="off"`. Submit: `isCodeFormat` (16 chars A–Z/0–9 after `normalizeCode`) else `invalid`; then `lookupCard(code)` in the local ledger else `notfound`. Result line is `aria-live="polite"`:
- invalid → `Gift card numbers have 16 letters and digits.`
- not found → `We couldn’t find that card. Check the number, or contact our concierge.`
- found → `{balance} {CUR} remaining on •••• •••• •••• XXXX` [`· originally {initial}`] `· never expires` (or `expires {date}`).
- Footnote: `Demo card: TERE SASO NS19 62MT` (the always-present `DEMO` ledger entry `TERESASONS1962MT`, CAD 250).

## 6. Ledger & Shopify mapping (summary)

`src/data/giftcards.ts` keeps issued cards in `tns-giftcard-ledger` (`loadLedger` always prepends the demo card). Checkout's `placeOrder` calls `issueCards(lines, qtys)` (random 16-char codes from an unambiguous alphabet) and `debitCards(applied)`; Account shows issued cards (excluding the demo). `toShopifyCartItem` in `src/lib/shopify.ts` maps a gift-card line to `/cart/add.js` shape (fixed-denomination variant IDs or a $1 variant × amount, recipient properties) — it is only logged, never sent. Details: data-model and shopify-integration docs.

## 7. Copy deck (verbatim)

- Hero: `Gifts` / `Carte-cadeau` breadcrumb; h1 `The gift of choosing.` (*choosing* italic vermeil); body `Redeemable online and in our Sherbrooke Street salon, in Canada and the United States. Sent instantly by email or mailed in our travertine box. Never expires.`; checks `No expiry, no fees` · `Schedule delivery` · `Online & in salon`.
- Steps: `01 Design`, `02 Amount ({currency})`, placeholder `Custom amount, {min}–{max}`, `03 Delivery` (`By email` — `Instantly or on a date you choose`; `Physical card` — `Mailed in our travertine box · free`), `04 Recipient` (`For someone else` / `For me`; placeholders `Recipient name`, `Recipient email`; `Send on`; `You’ll enter the mailing address at checkout.`; `Add a personal message (optional)`; `From (your name)`). Stepper labels `Fewer cards` / `More cards`.
- How it works: `Choose` — `Pick a design and amount, or set your own.`; `Send` — `Emailed now or on the date you choose, or mailed in our travertine box.`; `Redeem` — `Enter the 16-character code at checkout, or present it in our salon.`
- Balance band: eyebrow `Solde`; h2 `Check your balance`; `Balances update after every purchase. Cards can be combined, and any remainder stays on the card.`
- FAQ header: index `—`, eyebrow `Questions`, title `Gift card details`. Corporate box: `Corporate gifting` — `Ordering ten or more cards, or cards with your company’s design? Our concierge will prepare a bespoke quote.` → `Contact concierge` (`href.atelier`).
- Accordion (`defaultOpen="where"`): **Where can I use it?** Online at teresaandsons.com in Canada and the United States, and in our Montréal salon. Cards can be used on any piece, including rentals and bespoke commissions. · **Does it expire?** Never. There are no fees or expiry dates, in line with Québec and provincial consumer protection law. · **Canadian or U.S. dollars?** Cards are issued in the currency you buy them in. If redeemed in the other market, the balance converts at the rate shown at checkout. · **Can I combine several cards?** Yes. Add as many cards as you like at checkout; any remaining balance stays on the card for next time. Gift cards cannot be used to buy other gift cards. · **What if the card is lost?** Email cards can be resent from your order confirmation. For physical cards, contact us with your order number and we will reissue the remaining balance. · **Can I return a gift card?** Gift cards are non-refundable, except where required by law. Pieces bought with a gift card are refunded to a new gift card.

## Notes & gotchas

- Range copy disagrees across the app: the catalog's gift-card product says `$250 – $10,000` (`price: p(250, 200)`), the Header mega menu says `From $100`, presets run 100–5 000 and `CUSTOM_RANGE` allows 50–10 000 CAD / 50–7 500 USD.
- Adding qty 11–20 is possible here, but the bag's `+` button clamps to `Math.min(10, qty + 1)` and can lower such a line to 10.
- A message on a "For me" card is kept and shown in the bag but dropped by `toShopifyCartItem`.
- Physical cards reuse the email variant IDs in the Shopify mapping and differ only by the `_delivery` property; checkout collects a shipping address for them.
- The 2400 ms `setAdded(false)` timeout is not cleared on unmount (harmless state update warning territory).
- Denominations added to `DENOMINATIONS` must also get `CAD-x`/`USD-x` IDs in `GIFT_CARD_VARIANTS`, or they fall back to the $1 custom-amount variant.

## Related docs

- [../data-model.md](../data-model.md) — `giftcards.ts` constants, ledger, `convert`
- [../shopify-integration.md](../shopify-integration.md) — `toShopifyCartItem`, variant IDs
- [../commerce-logic.md](../commerce-logic.md) — gift cards in totals, tax and checkout redemption
- [cart-and-checkout.md](cart-and-checkout.md) — how gift-card lines render and are paid/redeemed
- [account-and-wishlist.md](account-and-wishlist.md) — the gift-card wallet
- [../design-system.md](../design-system.md) — input/choice recipes used by the builder
