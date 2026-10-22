# Account & wishlist pages

`#/account` (`src/pages/Account.tsx`) is a simulated sign-in/register screen that becomes a small dashboard once a user object exists; `#/wishlist` (`src/pages/Wishlist.tsx`) lists saved pieces with bulk actions. Both are device-local: the account (`tns-account`) and wishlist (`tns-wishlist`) live in localStorage via the store; there is no real authentication.

Scope: `src/pages/Account.tsx`, `src/pages/Wishlist.tsx`, `src/components/RecentlyViewed.tsx` (`RecentlyViewedStrip`), `src/components/giftcard/GiftCardArt.tsx`, `src/components/giftcard/BalanceChecker.tsx`, `src/data/giftcards.ts` (`loadLedger`, `maskCode`), `src/store.tsx`

## 1. Account — signed out

```
┌──────────────── lg: image half (hidden < lg) ────────┬──────── form half ────────┐
│ IMG.bridal2 at 70% over vault, gradient to top       │ SIGN IN | CREATE ACCOUNT  │
│ "Welcome to the family."                             │ Bon retour. / Join the maison.│
│                                                      │ [Full name] (register)    │
│                                                      │ [Email] [Password ≥8]     │
│                                                      │ ☐ Receive La Lettre…      │
│                                                      │ [SIGN IN / CREATE ACCOUNT]│
└──────────────────────────────────────────────────────┴───────────────────────────┘
```

- Section `grid min-h-[80vh] lg:grid-cols-2`. Local state `mode: 'signin' | 'register'` (tabs styled as underlined labels; inactive `text-[var(--text-linen)]`).
- Field recipe (module constant `field`): `mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]`; label recipe `text-[11px] uppercase tracking-[0.22em]`.
- Inputs: `name` (register only, required), `email` (`type="email"`, required), `password` (`type="password"`, required, `minLength={8}`); register adds an unlabelled-by-id checkbox `Receive La Lettre and private sale invitations` (`accent-[var(--gold-vermeil)]`, value unused).
- Submit (native validation only): reads `FormData`, then `signIn({ email, name: String(data.get('name') || email.split('@')[0]) })`. Password is never checked or stored. The store persists the user under `tns-account`.
- Footnote: `Accounts are managed through Shopify Customer Accounts.`

## 2. Account — signed in

Container `mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-24`.
1. Header row: eyebrow `Mon compte`; h1 `Bonjour, {user.name}.` (name italic vermeil, `text-6xl font-light lg:text-7xl`); email; **Sign out** button (`LogOut` icon) → `signOut()` (removes `tns-account`).
2. Four tiles in a hairline grid (`grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4`, each tile `bg-[var(--bg-travertine)] p-8 hover:bg-[var(--bg-silk)]`):

| Icon | Title | Body | CTA → target |
|---|---|---|---|
| Package | Orders | No orders yet. Track deliveries and rental returns here. | Start shopping → `#/c/necklaces` |
| Heart | Wishlist | `{n} saved piece(s).` (singular when 1) | View wishlist → `#/wishlist` |
| Ruler | Ring sizes | Save your sizes for faster checkout and gifting. | Book a sizing → `#/atelier` |
| Sparkles | Care & servicing | Complimentary cleaning and inspection, every year. | Book an appointment → `#/atelier` |

3. Gift-card wallet (bordered two-column box): `loadLedger()` minus the demo code `TERESASONS1962MT`; each card renders `GiftCardArt` (design, currency, initial amount, recipient) plus `{masked code} · {balance} left`. Empty: `Gift cards you buy will appear here.` + `Send one` link. Right column: `<BalanceChecker />` (light tone).
4. `RecentlyViewedStrip limit={5}` (max-w-2xl).
5. Preferred market: `Preferred market` — `Sets currency, taxes and shipping options.` with a two-button toggle **Canada** / **United States** calling `setCurrency('CAD'|'USD')`.

## 3. Wishlist (`src/pages/Wishlist.tsx`)

- Items: `wishlist.map(slug → PRODUCTS.find(...))` with unknown slugs filtered out; `useReveal(root, [items.length])`.
- Header: eyebrow `Liste de souhaits`; h1 `Your Wishlist` (*Wishlist* italic vermeil, `text-6xl font-light lg:text-8xl`).
- Actions (only when items exist):
  - **Try your wishlist on** — `TryOnButton` for the first try-on-eligible item, with `list` = all eligible items (rail in the studio).
  - **Share list:** a `ShareButton` (`variant="outline"`) whose subject lists every saved piece with its own product link and price (`features/sharing.md`). It replaced "Copy link" on 2026-10-16. That button copied `#/wishlist`, which opens the recipient's own device-local list, and gave no feedback.
  - **Add all to bag** — adds every item except rentals, personalized pieces and the gift card as `{ slug, metal: p.metals[0] }` (each call opens the drawer).
- Signed-out notice (items exist, no user): `Saved on this device. Sign in to keep your wishlist across devices.`
- Grid: `mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4` of `ProductCard` (with `index` for reveal stagger).
- Empty state: `Nothing saved yet.` / `Tap the heart on any piece to keep it here.` / `Explore Rings` (`#/c/rings`) and a `RecentlyViewedStrip title="Pieces you looked at" limit={4}`.

### Your designs (2026-10-22)

In the signed-in dashboard, after the visits, when the store keeps any designs (`designs`, `tns-designs`): a hairline box headed `Gem` + “Your designs” / “Vos créations”, a `link-line` “Design another ring” / “Créer une autre bague” to `href.designer()`, and a grid (`grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5`) of hairline-bordered cards: the kept picture in a 4:5 box, the title (`describeDesign`), the price (`<Price amount={ringPrice(d, currency)} />`), and an × (“Remove {title}” / “Retirer {title}”) that calls `forgetDesign`. Picture and title open the designer on that design. See [../features/ring-designer.md](../features/ring-designer.md).

## Notes & gotchas

- "Add all to bag" skips rentals/personalized/gift card but still adds rings and bridal pieces **without a size** and custom commissions at `metals[0]` (platinum-first pieces add +650 CAD). Mirror the PDP/try-on "needs configuration" rules if you touch it.
- Sign-in accepts any email/password ≥ 8 chars; there is no sign-in error path. Register's newsletter checkbox is not wired.
- The wallet lists every card issued on this device (whoever bought it); balances come from the local ledger.
- Currency buttons have no `aria-pressed`; the tiles' "Orders" content is static.

## Related docs

- [../architecture.md](../architecture.md) — `user`, `wishlist`, `recent` store slices and persistence keys
- [gift-cards.md](gift-cards.md) — GiftCardArt, BalanceChecker, ledger
- [../components/global-and-shared.md](../components/global-and-shared.md) — ProductCard, WishButton, RecentlyViewedStrip
- [../features/virtual-try-on.md](../features/virtual-try-on.md) — the "Try your wishlist on" flow
- [../brand-voice-and-copy.md](../brand-voice-and-copy.md) — French greetings and labels
