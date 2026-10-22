# Sharing and gift hints

The storefront's share system covers one configured piece on the PDP and lists such as the wishlist. It offers the device's own share sheet (with the photograph attached where supported), a copyable link, a "Drop a hint" composer, and the main messaging and social composers, each tagged for attribution. Nothing is sent from the site: every option hands off to the visitor's own apps, so there is no backend. Built on 2026-10-16.

Scope: `src/lib/share.ts`, `src/components/share/ShareButton.tsx`, `src/components/share/ShareSheet.tsx`, and the call sites in `src/pages/Product.tsx` and `src/pages/Wishlist.tsx`.

## 1. Where it appears

| Surface | Triggers | Subject |
|---|---|---|
| PDP header row (right of the availability line) | "Drop a hint" (`Gift`; not for rentals) and "Share" (`Share`), both `ShareButton variant="link"` | `kind: 'piece'`: name, collection · chapter, first image, `href.product(slug)`, the live `detail` line (metal or rental period, rental start, personalization text, size), `formatPrice(amount, currency) + currency`, tagline, and `hint: { metal, size }` unless it's a rental |
| Wishlist header | "Share list" (`variant="outline"`) | `kind: 'list'`: one item per saved piece with name, product route, image and price text ("from $650 CAD a weekend" for rentals) |

It replaced the wishlist's old "Copy link", which copied `#/wishlist`. That link opens the *recipient's* own device-local list, so it shared nothing, and it gave no feedback.

## 2. Components and API

**`ShareButton`** (`{ subject, mode?: 'share' | 'hint', label?, icon?, variant?: 'link' | 'outline', className? }`):
- It renders the trigger (`aria-haspopup="dialog"`, focus ring) and lazy-loads `ShareSheet` on first open (`lazy()` + `Suspense`). The sheet ships as its own chunk, about 20 kB.
- It returns focus to itself after the sheet closes.
- `mode="hint"` opens straight into "Drop a hint". It falls back to sharing when the subject has no `hint`.

**`ShareSubject`** (exported from `ShareSheet.tsx`):
- Common fields: `kind`, `id`, `title`, `eyebrow`, `image`, `route`, `detail`, `priceText`, `tagline`.
- `hint?: { metal?, size? }` enables the hint tab.
- `items?: { name, route, image, priceText }[]` is for lists.
- Prices arrive already formatted, so the sheet never formats money.

**`ShareSheet`** is a portal dialog (`[data-share-sheet]`, `role="dialog" aria-modal`, `aria-labelledby` the title):
- **Layout:** a bottom sheet below `md` (with a grip and a one-line preview of the piece), and a centred two-column panel from `md` (`grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`, `max-w-[58rem]`).
- **"What they'll see" (left):** the message as it will read (a gold-ruled bubble), above the card the link unfurls into, showing image, eyebrow, name, configuration and price, and the link. For lists it shows a 2 × 2 collage and "N pieces, each with its own link".
- **Right:**
  - eyebrow "Partager" or "Un petit indice";
  - title "Share this *piece*", "Share your *wishlist*" or "Drop a *hint*";
  - a close button;
  - the Share / Drop a hint tabs (`tablist`);
  - the mode content.
- **Motion:** it enters on the second frame after mount (backdrop fade, sheet glide, 500 ms `cubic-bezier(0.16,1,0.3,1)`) and leaves the same way (380 ms) before unmounting. Under reduced motion it appears and goes at once.

**`src/lib/share.ts`:**
- `shareUrl(route, channel?)` builds origin + path + `?utm_source={channel}&utm_medium=share` + hash route.
- `displayUrl(route)` is the same without the protocol or tags.
- `intentUrl(channel, { text, url, subject, image })` builds each channel's composer URL.
- `copyText()` uses the async clipboard, falling back to a hidden textarea with `execCommand`.
- `lastChannel()` and `noteShare(channel, detail)` remember the channel used this session and dispatch `window` `CustomEvent('tns:share', { detail: { channel, kind, id, mode } })`.

## 3. What makes it smart

- **The configured piece, not just a link.** Messages and the preview carry the live configuration and price in the visitor's currency, for example "Notre-Dame Oval Solitaire by Teresa & Sons — 18k Rose Gold · Size 6 · $18,900 CAD."
- **Drop a hint.** A suggested message is composed from the recipient's name, the piece and metal, and optionally the ring size and price. For example: "Hi Marc, I've fallen for a piece at Teresa & Sons: the Notre-Dame Oval Solitaire, in 18k Rose Gold. For the record, my ring size is 6. It's $18,900 CAD. In case you're ever looking for ideas."
  - It is fully editable (400 characters). Editing hides the toggles and shows "Restore the suggested wording".
  - The link is always appended.
  - Email goes out with the subject "A small hint".
- **The device's share sheet with the photograph.** When `navigator.share` exists, "Share from this device" leads the sheet. The photograph (`w=1200`) is fetched as a `File` when the sheet opens, because a share sheet must open inside the click with the file already in hand. It is attached when `navigator.canShare({ files })` allows it, with an "Attach the photograph" toggle.
- **Wording per channel.** WhatsApp, Messages and Email get the full line. X gets "{name} by Teresa & Sons, Montréal". Pinterest gets "{name}. {tagline} Teresa & Sons, Montréal." with the photograph as `media`. An optional note (140 characters) leads every message.
- **Attribution.** Every link carries `utm_source={channel}&utm_medium=share`, and list links are tagged per piece. Shares raise `tns:share`.
- **Channels that suit the device.** Messages (`sms:`) appears only on touch screens (`pointer: coarse`). Pinterest appears only for pieces with a public photograph (an `http(s)` image: a ring from the designer, pictured in the browser, has none). The channel used last in the session moves to the front ("Used last time").
- **Copy that never dead-ends.**
  - "Copy link" turns vermeil with "Copied", announces it, and resets after 2.4 s.
  - If the browser withholds the clipboard, the link field (a read-only input) is selected and the sheet says "press Ctrl+C" (⌘C on Apple devices).
  - A "Copy text" tile copies the whole message with the link, for Instagram and anywhere without a share link.
  - Hint mode copies the message.
- **Tile grids never leave a gap.** `gridFor(n)` and `spanFor(n, i)` choose the columns and stretch the last tile, so 5, 6 or 7 tiles always fill their rows.

## 4. Channels

| Channel | Shown | Composer |
|---|---|---|
| Device share | `navigator.share` exists | `navigator.share({ title, text, url, files? })` |
| Copy link / list / text / message | always | async clipboard, then textarea fallback, then select-and-prompt |
| WhatsApp | always | `https://wa.me/?text=` text + link |
| Messages | touch screens | `sms:?&body=` text + link |
| Email | always | `mailto:?subject=…&body=` text + link |
| Pinterest | pieces with an image | `pinterest.com/pin/create/button/?url&media&description` |
| Facebook | pieces | `facebook.com/sharer/sharer.php?u=` |
| X | pieces | `x.com/intent/post?text&url` |

Web composers open in a new tab (`target="_blank" rel="noopener noreferrer"`). `mailto:` and `sms:` open the device's app.

## 5. Accessibility

- Overlay checklist: it calls `getLenis()?.stop()`, sets `body` overflow hidden (restoring the previous value), closes on Escape, sits at `z-[100]`, and puts `data-lenis-prevent` on the scrollable panel.
- On open, focus moves to the dialog, so its title is announced. Tab and Shift+Tab cycle inside it, and focus returns to the trigger on close.
- The modes use `tablist`, `tab` and `aria-selected` with a `tabpanel`. Counters show `{n}/{max}`, and limits are enforced by slicing in `onChange`.
- An `aria-live="polite"` line announces copies and shares.
- Every control has a visible focus ring. Tiles are real links or buttons.

## 6. Prototype boundaries and the Shopify port

- Links point at the prototype's own origin and hash routes. The theme builds them from `{{ shop.url }}{{ product.url }}` with the same `utm_*` tags. Dawn's share-button pattern (device share plus copy fallback) maps directly.
- Link unfurls (image, title and price in chats) need Open Graph tags. Shopify's `meta-tags` snippet supplies them on real product pages; this single-page prototype has none.
- `tns:share` is a hook for analytics. The theme can forward it with `Shopify.analytics.publish('tns_share', detail)` to a custom pixel.
- Hints are sent by the visitor's own apps. A "send the hint for me" email would need a backend and is out of scope for the prototype.

## Notes & gotchas

- The cart drawer is always mounted with `role="dialog"`. Target the share sheet with `[data-share-sheet]`.
- The panel needs `grid-cols-1` below `md`. An implicit `auto` grid track stretches to the read-only link's unwrapped text and pushes the sheet off-screen (fixed 2026-10-16). `CompleteTheLook` had the same bug.
- Rentals get no hint tab, and their price text is the period rate.
- A list has no single URL, because the wishlist lives on the device. List shares are text with a link to each piece.
- Headless Chrome withholds the clipboard even with permission granted, so tests exercise the select-and-prompt fallback. The success state was verified by stubbing `navigator.clipboard`.
