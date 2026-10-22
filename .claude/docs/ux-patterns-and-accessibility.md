# UX patterns, responsive behaviour & accessibility

This doc catalogues the interaction patterns the storefront reuses and how each is built: overlays, selection controls, validation, feedback and responsive switches. It also gives a factual accessibility inventory with clearly labelled concerns, including computed contrast ratios for the token pairs. Use it as the checklist when adding UI.

Scope: all `src/**/*.tsx` (inventory), in particular `src/components/CartDrawer.tsx`, `src/components/Header.tsx`, `src/components/pdp/*`, `src/components/video/VideoViewer.tsx`, `src/components/tryon/TryOnStudio.tsx`, `src/components/cart/*`, `src/pages/GiftCards.tsx`, `src/pages/Product.tsx`, `src/pages/Checkout.tsx`

## 1. Overlay inventory

| Overlay | File | z | Rendered | Stops Lenis | Locks scroll | Escape | ARIA | Notes |
|---|---|---|---|---|---|---|---|---|
| Mobile menu | Header | `z-[70]` | inline when `mobileOpen` | — | — | — | — | `data-lenis-prevent`; closes on route change |
| Desktop menu | menu/SiteMenu ([global-and-shared.md](components/global-and-shared.md) §2.1) | `z-[70]` | portal, lazy, mounted after the first opening, then toggled | yes | `body` (restores the previous value) | yes, stepped: clear the search, fold the panel, close | dialog, `aria-modal`, `aria-label="Menu"`, `inert` while closed; Tab trapped; focus returns to the menu button | `lg` only (closes below 1024 px); arrow keys, type-to-search, `/` and ⌘K |
| Header search | menu/HeaderSearch ([global-and-shared.md](components/global-and-shared.md) §2.2) | inside the header (`z-50`) | always mounted; clipped and `inert` while closed | yes | — (Lenis only: the scrollbar stays, so the bar doesn't shift) | yes, stepped: clear, close, leave the field | combobox + listbox of groups; options by `aria-activedescendant`, `tabIndex={-1}` | a dropdown, not a dialog; the page dims; presses inside keep the focus in the field (2026-10-22) |
| Splash | splash/Splash | `z-[130]` | first in the shell, unmounts when done | yes (next frame) | `body` (restores the previous value) | any key, press or wheel skips | `aria-hidden` (decorative) | in full once per session; a veil on later loads |
| Page transition | transition/PageTransition | `z-[125]`–`z-[127]` | portal, always mounted, `invisible` until used | yes, while it runs | — (Lenis only) | — | `aria-hidden`; afterwards focus moves to `<main>` and a polite live region reads the title | blocks clicks while it covers |
| Cart drawer | CartDrawer | `z-[80]` backdrop / `z-[90]` panel | always mounted, toggled | yes | `body` (restores the previous value) | yes | dialog, `aria-modal`, `aria-hidden` + `inert` while closed | Focuses after 50 ms; no trap or restore |
| Share sheet | ShareSheet (`features/sharing.md`) | `z-[100]` | portal, mounted while open | yes | `body` (restores the previous value) | yes | dialog, `aria-modal`, `aria-labelledby` its title; Tab trapped; focus returns to the trigger | bottom sheet below `md`; `data-lenis-prevent`; `[data-share-sheet]` marker |
| Gallery lightbox | pdp/Gallery | `z-[95]` | inline | — | — | yes | dialog | relies on `data-lenis-prevent` |
| Ring-size guide | pdp/RingSize | `z-[95]` | inline | — | — | yes | dialog | relies on `data-lenis-prevent` |
| Reviews modal | pdp/Reviews | `z-[100]` | `createPortal(…, document.body)` | yes | `html` (reset to `''`) | yes | dialog | — |
| Video viewer | video/VideoViewer | `z-[100]` | portal (from ShoppableVideos) | yes | `html` | yes, plus arrows/Space | dialog `aria-label={title}` | Swipe ±60 px |
| Try-on studio | tryon/TryOnStudio | `z-[110]` | provider + `Suspense` (lazy chunk) | yes | `html` | yes | dialog `aria-label="View … on you"` | Camera tracks stopped on close |

**Overlay checklist** (the established pattern; follow it for new overlays):
1. Pick a z-index from the ladder in the design-system doc.
2. On mount, call `getLenis()?.stop()`, set the overflow lock, and add a `window` `keydown` listener for Escape. Undo all three in the cleanup.
3. Add `role="dialog" aria-modal="true" aria-label=…`.
4. Put `data-lenis-prevent` on every scrollable inner region.
5. Overlays whose open state outlives a route change (the drawer from the store, the studio from its provider) must call their close handler from every link inside them, because navigation does not reset them.
6. Remember that `addToCart` opens the drawer (z-[90]). Adding from a higher overlay opens the drawer *underneath* it.

## 2. Selection & input patterns

- **Segmented toggles:** active segment `bg-[var(--text-espresso)] text-[var(--bg-travertine)]`. Used for currency (Header, Account, Checkout), gift-card recipient, and the sign-in/register tabs.
- **Swatches / pills:**
  - Metal swatches: round gradient buttons with `aria-pressed`, in the PDP and try-on.
  - Gift-card design swatches: `aria-pressed` plus a ring.
  - Size pills and rental-period buttons: on the PDP; rental periods lack `aria-pressed`.
- **Choice tiles:** the `choice(on)` recipe in GiftCards.
- **Quantity steppers:**
  - Gift-card builder: 1–20, `aria-label` "Fewer cards" / "More cards".
  - Bag line: `+` uses `Math.min(10, qty + 1)`. `−` at 1 calls `removeLine`, which is undoable.
- **Date picking:**
  - `RentalCalendar` (`role="grid"`) applies lead days, booked dates, slots and delivery method.
  - The gift-card "Send on" field is a native `<input type="date" min max>`.
- **Range sliders:** try-on Size, Rotation and Spacing (`accent-[var(--gold-champagne)]`).
- **Tabs:** `role="tablist"`/`role="tab"`/`aria-selected` in home `FourCs` and `Treasured`.
- **Accordions:** `pdp/Accordion`, with `aria-expanded`. Used by PDP info, ProductFAQ and the GiftCards FAQ. `GiftOptions` also uses `aria-expanded`.
- **Text limits:**
  - Enforced by slicing in `onChange`: gift message 200 with a `{n}/200` counter; gift-wrap message 200; order note 500.
  - Engraving uses `maxLength` 18.
  - Custom gift amount: digits only, 5 characters.

## 3. Validation & feedback

- **PDP:** click-time validation, never a disabled CTA. `handleAdd` sets every error flag, scrolls to the first failing step (`step-dates` → `step-personal` → `step-size`, offset −140) and clears each flag in that step's `onChange`.
- **Gift-card builder:** collects error strings into `<ul role="alert" class="text-sm text-red-700">`.
- **Balance checker:** reports its result in an `aria-live="polite"` paragraph. `CartLineItem` also has an `aria-live` region.
- **Native validation:** Account and Atelier forms rely on `required`, `type="email"` and `minLength`. The footer newsletter does nothing on submit.
- **Confirmations:**

| Where | Feedback |
|---|---|
| PDP CTA | "added" state for 2200 ms |
| Gift-card CTA | "Added to bag" for 2400 ms |
| Try-on / video | Inline "Added" |
| Atelier | "Merci…" message replaces the form |
| Checkout | Confirmation screen |

- **Undo:** removing a bag line shows `UndoToast` (`role="status"`) for 6000 ms with **Undo**, which restores the line at its original index (`undoRemove`).

**Timing constants:**

| Constant | Value |
|---|---|
| Header mega-menu close delay | 140 ms |
| Drawer focus delay | 50 ms |
| Undo toast | 6000 ms |
| Testimonials rotation | `setInterval` 6500 ms |
| PDP added state | 2200 ms |
| Gift-card added state | 2400 ms |

## 4. Navigation UX

- **Page changes (2026-10-20).** After each transition, focus moves to `<main>` unless a modal dialog is open, and a polite live region reads the new title. Back returns to the remembered scroll position. Under reduced motion the curtains become a short fade.
- **Where you are (2026-10-20).** The header bar's gold hairline rests under the current section (`aria-current` on Bridal, Rentals and Atelier), the mega menu opens on the current chapter, and the mega, mobile and desktop menus mark the current page. A link to the page already shown glides back to the top instead of doing nothing.

- **Routing:** all links are hash links built from the `href` helpers. In-page anchors are scripted (`getLenis()?.scrollTo(el, { offset })` with a `scrollIntoView` fallback). Never use `href="#id"`, because it is parsed as a route and lands on Home.
- **Scroll on route change:** every route change scrolls to the top immediately (`SmoothScroll`), so Back and Forward never restore the scroll position.
- **Page remounts:** Category and Product remount per slug (`key={route.slug}`).
- **Menus:** the Header closes the mega menu and the mobile menu on route change. The cart drawer and try-on studio do *not* close on route change.
- **Not-found:** PDP and Category show a not-found message for unknown slugs. The PDP's offers no way back.

## 5. Responsive strategy

The layout is mobile-first, with **`lg` (1024 px) as the main switch**: 284 `lg:` classes, 69 `sm:`, 2 `md:`, no `xl:`.

| Surface | Below lg | lg and up |
|---|---|---|
| Header | ☰ menu → full-screen menu; account icon hidden below `sm` | Inline nav + hover mega menu |
| Section layouts | Single column stacks | 12-column asymmetric grids, sticky side columns (`lg:sticky lg:top-36`) |
| PDP | Gallery above info; StickyBar on scroll | Gallery and info columns side by side |
| Video viewer | Product chips over the video | Desktop side panel |
| Try-on studio | Stage above a `max-h-[46vh]` panel | Stage beside a 400 px panel |
| Product grids | 2 columns | 3–4 columns |

**Touch:**
- ProductCard's secondary image and `group-hover` reveals never appear on touch devices, because Tailwind v4 wraps `hover` in `@media (hover: hover)`. The try-on chip stays visible on touch thanks to explicit `[@media(hover:hover)]:` variants.
- Film rails use `snap-x snap-mandatory` horizontal scrolling.
- Try-on supports drag, pinch and rotate.

## 6. Accessibility inventory (facts)

- **Landmarks:** `<header>`, `<main>`, `<footer>`, `<nav>` (desktop), `<address>` (footer), `<aside>` (side panels).
- **Skip link:** `App.tsx` renders a "Skip to content" button as the first focusable element on every page. It is `sr-only` until focused, then fixed at the top left (`z-[120]`). It focuses `<main tabIndex={-1}>` in code, because a `#main` link would be read as a route.
- **Home hero carousel** (`pages/home.md` §4.1):
  - a pause button, and autoplay that holds on hover, keyboard focus, a hidden tab or off-screen;
  - arrow keys on the slide controls and swipe on touch;
  - `inert` hidden slides, and a polite live region while paused;
  - `ring` focus styles on every control.
- **Headings:** one `h1` per page (HomeHero, Category, Product, Cart, Checkout, GiftCards, Wishlist, Account, Atelier). Sections use `h2` through `SectionHeader`, and cards use `h3`.
- **ARIA attributes:**

| Attribute | Count |
|---|---|
| `aria-label` | 76 |
| `aria-hidden` | 10 |
| `aria-pressed` | 8 |
| `aria-modal` | 7 |
| `aria-expanded` | 3 (Header Shop, Accordion, GiftOptions) |
| `aria-selected` | 2 (tabs) |
| `aria-live` | 2 (BalanceChecker, CartLineItem) |

- **Roles:**

| Role | Where |
|---|---|
| `dialog` | 7 overlays |
| `group` | Header currency, CompleteTheLook, Reviews |
| `tablist` / `tab` | FourCs, Treasured |
| `grid` | RentalCalendar |
| `img` | PriceBreakdown chart |
| `status` | UndoToast |
| `alert` | GiftCards errors |

- **Focus:** `outline-none` appears 18 times and no `focus-visible:` styles exist anywhere. Some inputs show focus through `focus:border-…`. Only CartDrawer moves focus programmatically, and it is the only element using `inert`.
- **Reduced motion is respected by:** `SmoothScroll` (no Lenis), `useReveal`, `HomeHero`, `MakingScroll`, `Product`'s entrance stagger, `useInViewPlay` (no autoplay), the CSS for the grain, and the `Marquee` component (no animation, copies hidden from assistive tech).
- **Reduced motion is not respected by:** the WishButton pop, the Gallery stage fade/scale, the Header mega-menu tweens, the drawer slide and backdrop, the RewardProgress bar, the UndoToast `fadeUp`, and CSS hover transitions.
- **Images:** the primary product image's alt text is the product name. Decorative and duplicate images use `alt=""`. Decorative SVGs use `aria-hidden`.
- **Film grain:** the overlay is `pointer-events: none` with `aria-hidden`.

## 7. Contrast (computed WCAG 2.x ratios, token pairs)

| Foreground | Background | Ratio | AA normal text (4.5) |
|---|---|---|---|
| espresso `#141311` | travertine `#FBF9F5` | ≈ 17.6 : 1 | pass |
| taupe `#6E685F` | travertine | ≈ 5.2 : 1 | pass |
| vermeil `#B89047` | travertine | ≈ 2.8 : 1 | **fail** (used for 10 px eyebrows and numerals) |
| linen `#A39C91` | travertine | ≈ 2.6 : 1 | **fail** (meta text, placeholders, currency codes) |
| linen | silk `#F3EFE6` | ≈ 2.4 : 1 | **fail** |
| champagne `#D4B982` | vault `#121110` | ≈ 9.9 : 1 | pass |
| white/60 (≈ `#A0A0A0`) | vault | ≈ 7.2 : 1 | pass |

## Languages (added 2026-10-21)

- Languages are named in their own words with their own `lang` (`LanguageToggle`, `LocaleMenu`); no flags. Text in the other language (review originals, the notice's buttons) carries `lang`.
- `<html lang>` follows the locale (`en-CA`, `en-US`, `fr-CA`), so screen readers, hyphenation and spell-check switch with it.
- A switch keeps focus, scroll position (the element being read), open overlays, the bag and form contents, and is announced in the new language by `LanguageVeil`'s live region. Under reduced motion it is immediate.
- The language notice is non-modal (`aside`, `aria-label="Langue · Language"`), its text in a polite live region, close `aria-label="Fermer · Close"`; it pauses its 16 s timer under pointer or focus.
- See [features/languages.md](features/languages.md).

## Floating back-to-top (added 2026-10-15)

`BackToTop` is the only floating control. It stays out of the way in these ways:
- It appears only deep into long pages.
- It stays compact while you read, and expands on upward intent, hover or keyboard focus.
- It hides itself, and becomes `inert`, while the drawer or any scroll-locking overlay is open.
- It lifts above `data-fab-avoid` elements.
- It adapts its tone to the surface behind it.

After a trip up it offers a timed "Return · {section}" trip back. Full spec: `components/global-and-shared.md` §5.

## Notes & gotchas (concerns, not facts about intent)

- **Drawer focus:** `aria-modal="true"` is declared, but there is no focus trap or focus restore. The page behind is not made inert while the drawer is open.
- **Missing overlay behaviour:** the mobile menu, Gallery lightbox and RingSize guide neither stop Lenis nor lock scroll.
- **Inconsistent scroll locks:** CartDrawer locks `body` while the other overlays lock `html`, and the locks are not reference-counted. Closing a nested overlay can restart Lenis while the drawer is still open.
- **Escape closes both overlays:** Escape is a `window` listener in each overlay, so it closes *both* the studio and the drawer when the studio was opened from a bag line.
- **Card nesting:** WishButton and TryOnButton are buttons nested inside `<a>` cards, which is invalid interactive nesting. The Try-on chip stays `opacity-0` when keyboard-focused on hover-capable devices.
- **Missing ARIA:** currency toggles (Header, Account, Checkout) and rental-period buttons lack `aria-pressed`. Validation errors on the PDP lack `aria-live`/`aria-invalid`. Checkout inputs have no `name`/`id`/`autocomplete`.
- **Contrast:** gold vermeil and linen text fail AA at the sizes used. Consider them decorative, or darken them for text.

## Related docs

- [design-system.md](design-system.md) — z-index ladder, recipes
- [motion-and-interaction.md](motion-and-interaction.md) — Lenis/GSAP details and reduced-motion handling
- [components/global-and-shared.md](components/global-and-shared.md) — Header, WishButton, ProductCard
- [components/pdp-modules.md](components/pdp-modules.md) — Gallery, RingSize, Reviews, RentalCalendar
- [pages/cart-and-checkout.md](pages/cart-and-checkout.md) — drawer, undo, checkout forms
- [known-issues.md](known-issues.md) — the a11y items as tracked issues
