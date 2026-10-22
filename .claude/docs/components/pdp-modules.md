# PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more

The eleven components in `src/components/pdp/` are the building blocks of the product detail page (`src/pages/Product.tsx`): the media gallery, three configurator steps (personalizer, rental calendar, ring size), the itemised price breakdown, the editorial sections (craft story, complete-the-look, reviews, FAQ), a generic accordion and a sticky purchase bar. They are client-only modules backed by pure helpers in `src/data/catalog.ts`, `src/data/costing.ts` and `src/data/tax.ts`; none of them calls a server, and only `Reviews` persists anything (customer reviews in `localStorage`). This document specifies each module's API, state, algorithms, layout, accessibility, motion and verbatim copy.

Scope: `src/components/pdp/Accordion.tsx`, `src/components/pdp/CompleteTheLook.tsx`, `src/components/pdp/CraftStory.tsx`, `src/components/pdp/Gallery.tsx`, `src/components/pdp/Personalizer.tsx`, `src/components/pdp/PriceBreakdown.tsx`, `src/components/pdp/ProductFAQ.tsx`, `src/components/pdp/RentalCalendar.tsx`, `src/components/pdp/Reviews.tsx`, `src/components/pdp/RingSize.tsx`, `src/components/pdp/StickyBar.tsx`, `src/data/catalog.ts` (personalization and rental helpers), `src/data/costing.ts`, `src/data/tax.ts`, `src/pages/Product.tsx` (call sites only).

> Values marked **computed** were produced on 2026-10-15 by running the repository's own TypeScript in memory (transpiled with the project's `typescript` package). They come from the code, not from hand calculation. Strings are quoted as written in the source; many labels are displayed upper-case only because of an `uppercase` utility on their container. Formulas use mathematical notation (×, −, Σ, `{placeholders}`) as a paraphrase; check the cited symbol for the exact code. Class strings shown with `…` are excerpts.

---

## 1. Inventory

| Module | Exports | Rendered by | Rendered when | Internal state | Persists |
|---|---|---|---|---|---|
| `Gallery` | default | `Product.tsx`, left column (`lg:sticky lg:top-32`) | always | `index`, `lightbox` | — |
| `Personalizer` | default, `FONT_STYLES`, `describePersonalization` | `Product.tsx`, inside `div#step-personal` | `product.personalization` is set | none (controlled) | — |
| `RentalCalendar` | default, `isBookingValid` | `Product.tsx`, inside `div#step-dates` | `product.rental` is set | `cursor`, `hover` | — |
| `RingSize` | default, `RING_SIZES` | `Product.tsx`, inside `div#step-size` | category is `rings` or `bridal` | `guide` | — |
| `PriceBreakdown` | default | `Product.tsx` | `hasCostBreakdown(product)` | `province`, `state`, `visible` | — |
| `CraftStory` | default | `Product.tsx` | always | none | — |
| `CompleteTheLook` | default, `getLookPieces`, type `RentalPeriod` | `Product.tsx` | always mounted; returns `null` when there are no pieces | `conflict` | — |
| `Reviews` | default, `getRatingSummary` | `Product.tsx` | always | `mine`, `filter`, `limit`, `lightbox`, `writing`, `thanks` (and sub-component state) | `localStorage` key `tns-reviews-<slug>` |
| `ProductFAQ` | default | `Product.tsx` | always | none | — |
| `Accordion` | default, interface `AccordionItem` | `Product.tsx`, `ProductFAQ`, `src/pages/GiftCards.tsx` | — | `open` | — |
| `StickyBar` | default | `Product.tsx` (last child of the page root) | always | `show` | — |

Other consumers of the named exports:
- `describePersonalization`: `src/components/lineDetails.ts` (option lines in the bag and at checkout).
- `isBookingValid`: `Product.tsx` (`handleAdd`) and `CompleteTheLook`.
- `getRatingSummary`: the PDP header stars and count in `Product.tsx`.
- `getLookPieces`: `Product.tsx` uses it to decide whether the "look" section gets a number.

---

## 2. Call sites in `src/pages/Product.tsx`

`src/App.tsx` renders `<Product key={route.slug} slug={route.slug} />`. Changing the slug therefore remounts the page and resets every module's internal state, including the `Reviews` state loaded from `localStorage`.

| Module | Props passed by the page |
|---|---|
| `Gallery` | `product` |
| `RentalCalendar` | `slug={product.slug}`, `period`, `step={stepNo('dates')}`, `value={booking}`, `error={bookingError}`, `onChange` → `setBooking(v)` then `setBookingError(false)` |
| `Personalizer` | `product`, `value={personal}`, `step={stepNo('personal')}`, `metalSwatch`, `showError={personalError}`, `onChange` → `setPersonal(v)` then `setPersonalError(false)` |
| `RingSize` | `step={stepNo('size')}`, `value={size}`, `error={sizeError}`, `onChange` → `setSize(s)` then `setSizeError(false)` |
| `Accordion` | `defaultOpen="details"` with items `details` ("Details & dimensions"), `care` ("Care & servicing"), `ship` ("Shipping & returns · Canada" or "Shipping & returns · United States") and `gift` ("Gift presentation"); `Product.tsx` owns their content |
| `PriceBreakdown` | `product`, `index={num('pricing')}`, `metal`, `personalization={pcfg ? personal : undefined}`, `period` |
| `CraftStory` | `product`, `index={num('story')}` |
| `CompleteTheLook` | `product`, `index={num('look')}`, `period`, `onPeriodChange={setPeriod}`, `booking`, `onNeedBooking={handleAdd}` |
| `Reviews` | `product`, `index={num('reviews')}` |
| `ProductFAQ` | `product`, `index={num('faq')}` |
| `StickyBar` | `product`, `amount`, `detail`, `label={inBag ? 'Go to bag' : ctaLabel}`, `target={ctaRef}`, `onAction={onCta}` |

Page-level wiring that the modules depend on (full detail in [Product detail page](../pages/product.md)):
- **Initial state.** `period` is `'weekend'` and `booking` is `{ method: 'courier' }`. `personal` is `{ text: '', font: fonts[0] ?? 'serif', chainLength: chainLengths?.[1] ?? chainLengths?.[0] }`, which means `'18 in'` wherever chain lengths exist. `metalSwatch = metal ? METALS[metal].swatch : '#D4B982'`.
- **Step numbers.** `steps = [rental && 'period', rental && 'dates', !rental && metals.length > 0 && 'metal', pcfg && 'personal', needsSize && 'size', showEngraving && 'engraving']` is filtered for truthy values. `stepNo(id)` returns the 1-based position, padded to two digits.
- **Section numbers.** `sectionOrder = [hasCostBreakdown && 'pricing', 'story', films && 'films', getLookPieces(product).length > 0 && 'look', 'reviews', 'faq', related && 'related', hadHistory && 'recent']` is filtered the same way, and `num(id)` returns `"01"`, `"02"` and so on. An id that is missing from the list yields `"00"`.
- **`handleAdd` validation.** It checks the booking (`isBookingValid`), then the personalization (`validatePersonalization(pcfg, personal.text) === null`), then the size. It sets all three error flags. On failure it scrolls to `step-dates`, `step-personal` or `step-size`, whichever fails first. Scrolling uses Lenis `scrollTo(el, { offset: -140 })`, with `scrollIntoView({ behavior: 'smooth', block: 'center' })` as the fallback.
- **Anchors.** Page buttons scroll to `#price-breakdown` ("What the fee covers" / "See full cost breakdown") and `#reviews` (the rating link) with offset `-120`. Both sections carry `scroll-mt-32`.
- **Motion scope.** `useReveal(root, [slug])` (`src/components/useReveal.ts`) animates every `[data-reveal]` and `[data-parallax]` element inside the page root. It drives the module entrances described below. Modals rendered with `createPortal` (in `Reviews`) are outside that scope.

Shared building blocks:
- `Price` (`src/components/Price.tsx`) renders `formatPrice(amount, currency)` in `font-spec`, followed by a `<span>` holding the currency code. The recurring class `[&_span]:hidden` hides that code.
- `SectionHeader` (`src/components/home/SectionHeader.tsx`) draws a numbered eyebrow on a hairline, a serif `h2` and an optional `aside`, with `data-reveal` at 0, 0.05 and 0.1.
- `WishButton` and `TryOnButton` are covered in [Global chrome & shared components](./global-and-shared.md) and [Virtual try-on](../features/virtual-try-on.md).

---

## 3. Gallery — `src/components/pdp/Gallery.tsx`

**Purpose:** the main media stage. It shows photos, an optional product film and a tighter "Detail" crop, with a hover magnifier and a full-screen lightbox.

**Props:** `{ product: Product }` (inline type).

### 3.1 View model — `buildViews(product)` (module-private)

```ts
interface View {
  src: string
  label: string
  /** Detail views reuse a photo, cropped tighter. */
  crop?: { scale: number; origin: string }
  video?: string
}
```

1. One view per `product.images[i]`, labelled `'Front'` (i = 0), `'Styled'` (i = 1) or `` `View ${i + 1}` `` (i ≥ 2).
2. Append `{ src: images[0], label: 'Detail', crop: { scale: 1.9, origin: '50% 45%' } }`.
3. If `videosForProduct(product.slug)[0]` exists (`src/data/media.ts`), insert `{ src: film.poster, label: 'Film', video: film.src }` at index 1.

**Computed:** 14 products get a Film view: `mont-royal-solitaire-pendant`, `riviere-saint-laurent`, `plateau-paperclip-chain`, `vieux-port-diamond-studs`, `outremont-pearl-drops`, `westmount-tennis-bracelet`, `atwater-cuff`, `griffintown-chain-bracelet`, `teresa-signet`, `sherbrooke-emerald-cocktail`, `laurier-stacking-band`, `notre-dame-oval-solitaire`, `basilique-emerald-cut-three-stone` and `promesse-wedding-band`. Two examples: `mont-royal-solitaire-pendant` gets Front, Film, Styled, Detail; `mile-end-huggies` gets Front, Detail. Views are rebuilt on every render; they are not memoised.

### 3.2 State, image switching and zoom

- **State.** `index` starts at 0 and `lightbox` at `false`; `view = views[index]`.
- **`go(d)`.** `setIndex((i) => (i + d + views.length) % views.length)`, so navigation wraps in both directions. It is memoised with `useCallback` on `views.length`.
- **Ways to switch.** Rail thumbnails, mobile dots, the stage arrows, the lightbox arrows, and the arrow keys inside the lightbox.
- **Switch animation.** An effect on `[index]` runs `gsap.fromTo(stage.querySelector('[data-stage-img]'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' })`. It also runs on mount and is not gated by `prefers-reduced-motion`.
- **Morph target.** The stage carries `data-morph-target={product.slug}`; the product-photo page transition flies the clicked photo onto it.
- **Keyboard.** An effect on `[lightbox, go]` adds a `window` `keydown` listener only while the lightbox is open: `Escape` closes, `ArrowRight` calls `go(1)`, `ArrowLeft` calls `go(-1)`. The inline stage has no keyboard handling.
- **Hover lens.** `onPointerMove` on the stage returns early unless `e.pointerType === 'mouse'`, the view is not a video and both refs exist. It then sets the `<img>`'s `transformOrigin` to the pointer position, in percent of the stage box. The image class `transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:group-hover:scale-[1.8]` magnifies it 1.8× around the pointer, but only on hover-capable devices.
- **Detail crop.** `cropStyle(v)` returns `{ transform: scale(1.9), transformOrigin: '50% 45%' }` for the Detail view and `undefined` otherwise. It is applied to the stage wrapper `div`, the rail thumbnail and the lightbox image, so hovering the Detail view on the stage gives 1.9 × 1.8.
- **Opening the lightbox.** Clicking anywhere on the stage opens it, including on the Film view. The wishlist, try-on and control overlays call `e.stopPropagation()`.
- **Swipe.** Not implemented. There are no touch or drag handlers; on mobile you navigate with the stage arrows or the dots.

### 3.3 Layout and key classes

- **Root:** `flex gap-4 lg:gap-5`.
- **Thumbnail rail (≥ lg only):** `hidden w-[72px] shrink-0 flex-col gap-3 lg:flex`.
  - Each thumbnail is `relative aspect-[4/5] overflow-hidden transition-opacity duration-500`, plus `opacity-100` when active or `opacity-45 hover:opacity-80` otherwise.
  - The active underline is `absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700`, switched with `scale-x-100` / `scale-x-0`.
  - Film thumbnails get a `bg-black/25` overlay with the spec-face label "Film".
- **Stage:** `group relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]`, plus `cursor-pointer` for the film or `cursor-zoom-in` otherwise. The film plays inline with `autoPlay muted loop playsInline` and the poster image.
- **Overlays on the stage:**
  - First badge (`product.badges?.[0]`) at top-left: `font-spec absolute left-5 top-5 bg-[var(--bg-travertine)]/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] backdrop-blur`.
  - `WishButton size="lg"` at top-right (`absolute right-5 top-5 z-10`).
  - `TryOnButton variant="chip"` at `absolute left-5 top-16 z-10`. Its label "View on you" is `TryOnButton`'s default, and it renders nothing for products that cannot be tried on.
  - Bottom bar (`absolute inset-x-5 bottom-5 flex items-center justify-between`) with the counter chip and three 40 px round buttons (`flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]`): Previous, Next and Full screen. Full screen is `hidden … sm:flex`, so it is hidden below 640 px.
- **Mobile dots (`lg:hidden`):** one `h-px` button per view, `w-10 bg-[var(--text-espresso)]` when active or `w-5 bg-[var(--border-hairline)]` otherwise, with `transition-all duration-500`.
- **Lightbox:** `fixed inset-0 z-[95] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)]` with `data-lenis-prevent`. It is rendered inline (no portal) and does not lock scrolling.
  - Header: the product name (`font-serif-editorial text-2xl`) and a 44 px round close button (`border border-white/20 hover:border-[var(--gold-champagne)]`).
  - Media frame: `h-full max-h-[78vh] aspect-[4/5] overflow-hidden`, inside a `px-16` row.
  - 48 px round previous/next buttons at `left-4` / `right-4` (`lg:left-10` / `lg:right-10`).
  - Footer counter: `font-spec py-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/50`.
  - In the lightbox the film plays with `autoPlay controls loop playsInline` and is not muted.

### 3.4 Accessibility

- Thumbnails and dots: `aria-label="Show {label} view"`. Stage arrows: `aria-label="Previous image"` / `"Next image"`. Full screen: `aria-label="Full screen"`.
- Lightbox: `role="dialog" aria-modal="true" aria-label="{product.name} gallery"`; close button `aria-label="Close gallery"`; lightbox arrows `Previous image` / `Next image`.
- Stage image alt: `` `${product.name} — ${view.label}` ``. Thumbnails and the lightbox image use `alt=""`.
- The stage is a click-only `div` with no role and no `tabIndex`. Keyboard users can open the lightbox only through "Full screen", which exists only at ≥ sm. There is no focus trap and no focus restore.

### 3.5 Copy deck

`Front` · `Styled` · `View {n}` · `Detail` · `Film` · counter `{NN} / {NN} · {label}`, padded to two digits (e.g. `01 / 04 · Front`) · plus the aria strings listed in 3.4.

---

## 4. Personalizer — `src/components/pdp/Personalizer.tsx`

**Purpose:** the configurator step for products with `product.personalization`: a nameplate, a single initial or a monogram. It shows a live preview tinted to the chosen metal and offers lettering, an optional chain length and a paid accent.

### 4.1 Props

```ts
interface Props {
  product: Product
  value: Personalization
  onChange: (p: Personalization) => void
  step: string
  metalSwatch: string
  showError: boolean
}
```

The component is fully controlled: every control calls `onChange({ ...value, <field> })`. It returns `null` when `product.personalization` is undefined. `metalSwatch` comes from the page's selected metal (`METALS[metal].swatch`: yellow `#D4B982`, white `#E4E2DD`, rose `#D9A68C`, platinum `#CFCFCB`, vermeil `#B89047`).

### 4.2 Data contract (`src/data/catalog.ts`)

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
export interface Personalization {
  text: string
  font: PersonalizationFont
  accent?: boolean
  chainLength?: string
}
```

`PersonalizationFont` is `'script' | 'serif' | 'block'`. Only three catalog products are configured:

| Product (slug) | kind | label | hint | min–max | `allowed` (string value) | fonts, in order (first = default) | chainLengths | accent | backEngraving |
|---|---|---|---|---|---|---|---|---|---|
| `teresa-signet` | monogram | Monogram | Up to three initials, hand-engraved on the face. | 1–3 | `A-Za-z` | serif, script, block | — | — | `true` |
| `initial-disc-pendant` | initial | Initial | One letter, hand-engraved on the front of the disc. | 1–1 | `A-Za-z` | serif, script, block | 16 in, 18 in, 20 in | — | `true` |
| `engraved-nameplate-necklace` | nameplate | Your name | Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes. | 2–10 | `A-Za-zÀ-ÿ '\-` (source literal `"A-Za-zÀ-ÿ '\\-"`) | script, serif, block | 16 in, 18 in, 20 in | Diamond accent, CAD 180 | — |

### 4.3 `FONT_STYLES` (exported)

| Key | Label | Inline style |
|---|---|---|
| `script` | Script | `fontFamily: "'Pinyon Script', cursive"`, `letterSpacing: '0'` |
| `serif` | Serif | `fontFamily: "'Baskervville', serif"`, `fontStyle: 'italic'`, `fontWeight: 500` |
| `block` | Block | `fontFamily: "'Jost', sans-serif"`, `fontWeight: 500`, `textTransform: 'uppercase'`, `letterSpacing: '0.18em'` |

Pinyon Script is loaded by the Google Fonts `@import` on the first line of `src/index.css` (`family=Pinyon+Script`). `src/components/tryon/JewelryOverlay.tsx` also uses it.

### 4.4 Live preview — `Preview` (private)

- **Box:** `relative flex h-56 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#ffffff_0%,var(--bg-silk)_75%)]`.
- **Text:** `value.text.trim()`, or the fallback when empty: `'Teresa'` (nameplate), `'T'` (initial), `'TMS'` (monogram). The font is `FONT_STYLES[value.font].style`.
- **Chain** (every kind except monogram): a full-bleed SVG with `viewBox="0 0 400 220" preserveAspectRatio="none"` and `aria-hidden`, stroked in the swatch colour (`strokeWidth="1.4"`, `strokeDasharray="3 2"`).
  - Nameplate path: `M-10 10 Q 90 120 120 112 M280 112 Q 310 120 410 10`, two arms ending at the plate.
  - Initial path: `M-10 10 Q 160 90 200 92 Q 240 90 410 10`.
- **Nameplate:** `text-6xl` text filled by `goldText(swatch)`:
  - The gradient is `linear-gradient(180deg, #fff8e6 0%, {swatch} 38%, #8a6a32 62%, {swatch} 85%)`, applied with `background-clip: text`, `color: transparent` and `filter: drop-shadow(0 1px 1px rgba(20,19,17,0.25))`.
  - The Block font is forced to `2.4rem`.
  - When `value.accent` is on, a glowing rotated white 10 px square (the diamond dot) follows the name.
- **Initial:** a 112 px disc (`h-28 w-28 rounded-full`) filled with `radial-gradient(circle at 35% 30%, #fffaf0 0%, {swatch} 45%, #8a6a32 100%)`.
  - A bail ring (`border-2`, swatch colour) sits above the disc.
  - The disc shows `text.charAt(0).toUpperCase()` in `text-6xl text-[#4a3a22]/75 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]`.
- **Monogram:** an oval `h-36 w-44 rounded-[50%]` with the same metal gradient and an inner `border-white/40` ring. The text is upper-cased in `text-5xl`, and the Block font is forced to `1.9rem`.
- **Captions** (`font-spec … text-[9px] uppercase tracking-[0.24em]`): "Live preview" at bottom-left, and "{chainLength} chain" at bottom-right whenever a chain length is set.

### 4.5 Controls, in render order

1. **Text.** A `<label htmlFor="personal-text">` showing `cfg.label`, and a counter `{value.text.length}/{cfg.maxLength}` that counts the untrimmed length.
   - **`initial` kind:** a letter grid (`grid grid-cols-9 gap-1`) of buttons A–Z, each drawn in the current font. Clicking one sets `text` to that letter. The selected letter gets `border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]`.
   - **Other kinds:** `<input id="personal-text" maxLength={cfg.maxLength} autoComplete="off">`.
     - Monogram input is upper-cased on change.
     - Placeholder: `e.g. Sofia` (nameplate) or `e.g. TMS` (monogram).
     - The input switches to the chosen font only once it has text.
     - Border: `border-red-700/50` when invalid; otherwise hairline with `focus:border-[var(--text-espresso)]`.
   - **Helper line:** the validation message if there is one, otherwise `cfg.hint`.
2. **"Lettering".** A 3-column grid of `cfg.fonts` in product order. Each button shows `Aa` in its font (`AA` at `0.95rem` for Block) plus its label, and carries `aria-pressed`. Selected: `border-[var(--text-espresso)]`; unselected: `border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-linen)]`.
3. **"Chain length"**, only if `cfg.chainLengths` is set. Equal-width `font-spec` buttons; the selected one gets the espresso fill.
4. **Paid add-on**, only if `cfg.accent` is set.
   - A bordered `<label>` holding a checkbox (`accent-[var(--text-espresso)]`), a `Sparkles` icon, `cfg.accent.label`, and `+ {Price}`.
   - The price is `personalizationPrice(product, { ...value, accent: true }, currency)`, so it shows the add-on price whether or not the box is checked.
5. **Footer note**, separated by a hairline (see 4.10).

### 4.6 Validation — `validatePersonalization(cfg, text)` (`src/data/catalog.ts`)

The function trims the text to `t` and returns the first failing message, or `null` when everything passes:

| Check | Message |
|---|---|
| `t.length < cfg.minLength` and `cfg.minLength === 1` | `Please enter a letter` |
| `t.length < cfg.minLength` (otherwise) | `Please enter at least ${cfg.minLength} characters` |
| `t.length > cfg.maxLength` | `Maximum ${cfg.maxLength} characters` |
| `t` does not match `^[<allowed>]+$` (built with `new RegExp`) | `Some characters cannot be engraved` |

**When an error shows:**
- The component computes `error = value.text ? validatePersonalization(cfg, value.text) : showError ? validatePersonalization(cfg, '') : null`.
- Errors therefore appear live as soon as anything is typed. The empty-field message appears only after the page's add attempt sets `showError`.
- The legend turns `text-red-700` only when `error && showError`. The helper text and the input border turn red whenever `error` is set.

**Computed examples:**
- Nameplate: `D'Arcy`, `Zoë`, `Jean-Luc` and `x×y` are valid (× is inside the `À-ÿ` range). `D’Arcy` (typographic apostrophe) returns "Some characters cannot be engraved". `A1` is invalid.
- Monogram: `Zoë` is invalid. `"  Al  "` is valid, because it is trimmed to `Al`.

The page re-validates in `handleAdd` and stores `personalization: { ...personal, text: personal.text.trim() }` on the cart line.

### 4.7 Pricing

`personalizationPrice(product, p, currency)` returns 0 unless both `p.accent` and the product's `accent` config exist. It then returns `accent.priceCAD` in CAD, or `toUSD(priceCAD) = Math.round((cad * 0.73) / 5) * 5` in USD. **Computed:** the Diamond accent costs CAD 180 or USD 130. The page adds it to the displayed amount, `PriceBreakdown` lists it as an "options" line, and `store.tsx` `linePrice` adds it to the cart line. See [Commerce logic](../commerce-logic.md).

### 4.8 Back engraving

Back engraving is not part of this component. `Product.tsx` renders its own 18-character engraving input when `product.engravable && !rental && (!pcfg || pcfg.backEngraving)`. For personalized products that step is titled "Reverse engraving — optional"; otherwise it is "Engraving — complimentary". As a result, `teresa-signet` and `initial-disc-pendant` get a reverse-engraving step. `engraved-nameplate-necklace` does not: it is `engravable`, but has no `backEngraving`.

### 4.9 `describePersonalization(p)`

Filters out empty parts from `` [`“${p.text.trim()}”`, FONT_STYLES[p.font].label, p.chainLength, p.accent && 'Diamond accent'] `` and joins the rest with `' · '`. Example: `“Sofia” · Script · 18 in · Diamond accent`. Consumed by `src/components/lineDetails.ts`.

### 4.10 Accessibility and copy deck

**Accessibility:**
- The root is a `<fieldset>`, and its first child is the `<legend>`.
- Font buttons carry `aria-pressed`. The letter-grid and chain-length buttons expose no pressed state; the accent uses a native checkbox.
- In `initial` mode, `<label htmlFor="personal-text">` points at an input that is not rendered.

**Copy deck:**
- Legend: `{step}` `Personalize` `— {cfg.label.toLowerCase()}`, which reads "— monogram", "— initial" or "— your name".
- Labels: `Lettering`, `Chain length`, `Live preview`, `{chainLength} chain`, `Aa` / `AA`, `Script` / `Serif` / `Block`.
- Placeholders: `e.g. Sofia`, `e.g. TMS`.
- Add-on: `{cfg.accent.label}` (currently `Diamond accent`) followed by `+ {price}`.
- Footer: `A digital proof is emailed for your approval before we cut. Personalized pieces are final sale.`
- Hints and errors: see 4.2 and 4.6.

---

## 5. RentalCalendar — `src/components/pdp/RentalCalendar.tsx`

**Purpose:** the "Dates & delivery" step for rental products. The customer picks a start date on a month grid that knows the booked days, a hand-off method and a time slot, and then sees a delivery and collection summary.

### 5.1 Props

```ts
interface Props {
  slug: string
  period: RentalPeriodId
  value: Partial<RentalBooking>
  onChange: (v: Partial<RentalBooking>) => void
  step: string
  error?: boolean
}
```

### 5.2 Constants and date helpers

| Name | Value / behaviour | Defined in |
|---|---|---|
| `RENTAL_DAYS` | `{ weekend: 3, week: 7, month: 30 }` | `catalog.ts` |
| `RENTAL_LEAD_DAYS` | `2` (days of notice) | `catalog.ts` |
| `RENTAL_SLOTS` | `'09:00 – 11:00'`, `'11:00 – 13:00'`, `'14:00 – 16:00'`, `'17:00 – 19:00'` (spaced en dash) | `catalog.ts` |
| `WEEKDAYS` | `['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']` (weeks start on Monday) | component |
| `MAX_MONTHS_AHEAD` | `6` | component |
| `isoDate(d)` | local `yyyy-mm-dd` | `catalog.ts` |
| `parseIso(s)` | `Date` at local midnight | `catalog.ts` |
| `addDays(d, n)` | new `Date` at local midnight | `catalog.ts` |
| `rentalReturnDate(start, period)` | `addDays(parseIso(start), RENTAL_DAYS[period])` | `catalog.ts` |
| `formatDay(d, opts?)` | `d.toLocaleDateString('en-CA', opts)`; defaults to `{ weekday: 'short', day: 'numeric', month: 'short' }` | `catalog.ts` |

### 5.3 Booked dates — `getBookedDates(slug)` (`catalog.ts`)

This is demo availability. It is stable for a given slug but always relative to the current date, so the windows move with the clock.
1. Hash the slug: `h = (h * 33 + charCode) >>> 0` for each character.
2. For each `k` from 0 to 3, compute `offset = 5 + ((h >> (k * 5)) % 20) + k * 24` and `len = 3 + ((h >> (k * 3)) % 5)`.
3. Add `isoDate(today + offset + i)` for every `i < len` to a `Set<string>`.

Because `>>` is a signed shift, a hash ≥ 2³¹ gives negative remainders, which means shorter, past or empty windows (see Notes).

**Computed** booked days, counted from today, and the start offsets that `isBookingValid` accepts (up to +200 checked):

| Rental piece | Booked days | Valid starts: weekend | Valid starts: week | Valid starts: month |
|---|---|---|---|---|
| `gala-diamond-collar` | +9…+15, +37…+42, +65…+71, +80…+86 | +2…+6, +16…+34, +43…+62, +72…+77, +87… | +2, +16…+30, +43…+58, +72…+73, +87… | +87… |
| `chandelier-sapphire-earrings` | −7 (in the past), +42, +43, +77 | +2…+39, +44…+74, +78… | +2…+35, +44…+70, +78… | +2…+12, +44…+47, +78… |
| `bridal-tiara-and-drops` | none | +2… | +2… | +2… |

### 5.4 Grid, availability and navigation

- **Inputs.** `today` is local midnight, memoised at mount. `minDate = addDays(today, RENTAL_LEAD_DAYS)`. `booked` is memoised per `slug`. `days = RENTAL_DAYS[period]`.
- **`canStart(d)`.** True when `d >= minDate` and none of the days `d` … `d + days − 1` is booked.
- **Month grid** (memoised on `cursor`). It starts with `(first.getDay() + 6) % 7` empty cells so weeks begin on Monday, followed by every day of the month in a 7-column grid. No trailing empty cells are added.
- **Navigation.**
  - `cursor` starts at the first day of `minDate`'s month.
  - `monthsAhead` is the month difference between `cursor` and `minDate`'s month.
  - Previous is disabled at `monthsAhead === 0` and Next at `monthsAhead === 6`, so seven months are viewable.
  - The title is `cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })`.
- **Range preview.**
  - `hover` is set on `mouseenter` of an available day and cleared on `mouseleave` of the grid wrapper.
  - `anchor = hover ?? value.start`.
  - `inRange(d)` means `anchor ≤ d < anchor + days`.
  - `isEnd` marks the last rental day, `anchor + days − 1`.

Day cells use `font-spec relative h-10 text-xs transition-colors` plus the first matching row below:

| Condition | Added classes |
|---|---|
| selected, or the anchor day while it is being previewed | `bg-[var(--text-espresso)] text-[var(--bg-travertine)]` |
| last day of the window | `bg-[var(--gold-champagne)] text-[var(--text-espresso)]` |
| inside the window | `bg-[var(--gold-champagne)]/25` |
| available | `hover:bg-[var(--bg-silk)]` |
| otherwise (disabled) | `cursor-not-allowed text-[var(--text-linen)]/60` |
| in addition, if the day itself is booked | `line-through decoration-[var(--text-linen)]/60` |

- **Today marker:** a small gold dot, `absolute bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[var(--gold-vermeil)]`.
- **Why a day is disabled** (`disabled={!available}`): it is earlier than `minDate` (less than two days' notice), or some day in the window starting there is booked.
- **Aria suffix:** ", reserved" when the day itself is booked, otherwise ", unavailable".

### 5.5 Hand-off method, time slots and summary

- **Method.** Two buttons: `courier` (Truck icon, "Insured courier" / "Delivered & collected") and `salon` (MapPin icon, "Salon fitting" / "1420 Sherbrooke O."). A button is selected when `(value.method ?? 'courier') === id`.
- **Slots.**
  - The label is "Delivery window" for courier and "Fitting time" for salon.
  - Buttons sit in `grid grid-cols-2 gap-1.5 sm:grid-cols-4` and stay `disabled` (`disabled:opacity-35`) until a start date exists.
  - The selected slot gets the espresso fill.
- **Summary** (shown only once a start date exists): a `grid-cols-[1fr_auto_1fr]` row.
  - Left: "Delivered" or "Fitting", then `formatDay(start)`, then the slot or "Select a time".
  - Middle: a gold hairline.
  - Right: "Collected", then `formatDay(end)`, then "by 12:00".
  - `end = rentalReturnDate(start, period)`, which is start + 3, 7 or 30 days: the day after the last highlighted day.
- **Conflict.** `conflict = start ? !canStart(start) : false`. This happens, for example, when the period is lengthened after a date was picked. The summary turns `bg-red-50` and shows the conflict sentence.
- **What is kept.** Picking a new date keeps `slot` and `method`. Changing `period` does not clear `start`.

### 5.6 Error display (`error` = the page's `bookingError`)

- The legend turns `text-red-700`.
- When there is no start date, the legend appends "— choose a start date".
- When the start date or the slot is missing, the calendar border becomes `border-red-700/40`.
- When a start date exists but no slot, the slot label turns red and appends " — please choose".

### 5.7 Emitted value and `isBookingValid`

`onChange` always receives the previous value spread with one changed key. The emitted `Partial<RentalBooking>` is `{ start?: 'yyyy-mm-dd', slot?: <one of RENTAL_SLOTS>, method?: 'courier' | 'salon' }`. The complete shape stored on a cart line is:

```ts
export interface RentalBooking {
  start: string // ISO date, yyyy-mm-dd
  slot: string
  method: 'courier' | 'salon'
}
```

`isBookingValid(slug, period, b): b is RentalBooking` returns `false` unless all of the following hold:
- `b.start` and `b.slot` are set.
- `parseIso(b.start)` is on or after today + 2 days, with "today" computed fresh on each call.
- None of the `RENTAL_DAYS[period]` days from `start` is in `getBookedDates(slug)`.

It does not check `method`, whether the slot is one of `RENTAL_SLOTS`, or the six-month horizon. Its callers are `Product.tsx` (`handleAdd`) and `CompleteTheLook`. Cart-line formatting of a booking (`{formatDay(start)} → {formatDay(end)}` and `{Salon fitting | Courier} · {slot}`) lives in `src/components/lineDetails.ts`; see [Cart drawer, cart page & checkout](../pages/cart-and-checkout.md).

### 5.8 Accessibility

- `<fieldset>` with the `<legend>` as its first child.
- Month buttons: `aria-label="Previous month"` / `"Next month"`.
- Day buttons are native buttons with `aria-pressed={selected}` and an `aria-label` of `formatDay(d, { weekday: 'long', day: 'numeric', month: 'long' })` plus the `, reserved` / `, unavailable` suffix.
- The day container has `role="grid"`, but there are no row or gridcell roles and no arrow-key navigation.
- Method and slot buttons expose no pressed state. The range preview works with a mouse only.

### 5.9 Copy deck

- Legend: `{step}` `Dates & delivery`, plus `— choose a start date` when there is an error and no date.
- Weekday headers: `Mo` `Tu` `We` `Th` `Fr` `Sa` `Su`.
- Key: `Start` · `Your {days} days` · a struck-through `12` followed by `Reserved` · `{RENTAL_LEAD_DAYS} days’ notice`, which renders `2 days’ notice`.
- Methods: `Insured courier` / `Delivered & collected`; `Salon fitting` / `1420 Sherbrooke O.`
- Slots label: `Delivery window` / `Fitting time`, plus ` — please choose`.
- Summary: `Delivered` / `Fitting`, `Select a time`, `Collected`, `by 12:00`.
- Conflict: `This piece is reserved during part of a {period} rental from this date. Please choose another start date.` Here `{period}` is the raw id: `weekend`, `week` or `month`.

---

## 6. PriceBreakdown — `src/components/pdp/PriceBreakdown.tsx`, and the costing model

**Purpose:** the section "The price, itemised". It is an itemised, colour-coded statement of what makes up the retail price, or what a rental fee covers, followed by taxes and a total.

**When it renders:** only if `hasCostBreakdown(product)` (`src/data/costing.ts`) is true, i.e. `p.metals.length > 0 && !/commission|redesign/i.test(p.name)`. That is false for `gift-card`, `bespoke-engagement-commission` and `heirloom-redesign`, and true for every other product, rentals included.

### 6.1 Props, state and derived data

```ts
interface Props {
  product: Product
  index: string
  metal?: Metal
  personalization?: Personalization
  period: RentalPeriodId
}
```

- **State:** `province` starts at `'QC'`, `state` at `US_STATES[0]` (`'New York'`), and `visible` at `false`.
- **Derived data**, memoised on `[product, currency, metal, personalization, period, rental]`, is `{ lines, price, metalWeight, labourHours }`:
  - Rentals: `rentalLines(...)`, with `price` = the sum of the lines and weight and hours set to 0.
  - Everything else: `buildCostBreakdown(product, currency, metal, personalization)`.

### 6.2 Costing model — `buildCostBreakdown(p, currency, metal?, personalization?)`

**Inputs:**
- `fx` is `1` in CAD and `CAD_TO_USD` (`0.73`) in USD.
- `m = metal ?? p.metals[0]`.
- `base = priceFor(p, currency, m)`: the catalog price plus the metal delta (platinum +650 CAD, vermeil −400 CAD; the USD delta is `Math.round(delta * 0.73)`).
- `accent = personalizationPrice(...)`.
- `r = Math.round`.

Lines are produced in this order:

1. **Metal** (group `materials`, id `metal`).
   - Weight: `parseNum(p.specs.Weight)` when a `Weight` spec exists, else `DEFAULT_WEIGHT[category] ?? 5`. Only `plateau-paperclip-chain` (6.8 g), `atwater-cuff` (24 g) and `teresa-signet` (9 g) have a `Weight` spec.
   - Amount: `r(weight × rate × fx + (vermeil ? 30 × fx : 0))`.
   - Label: the alloy name, or `Case & bracelet · {name}` for watches.
   - Detail: `{weight.toFixed(1)} g × {(rate × fx).toFixed(2)}/g · {purity}`, with ` + plating` appended for vermeil.
2. **Stones or movement** (`materials`).
   - `stonePool = base × (STONE_SHARE[category] ?? 0.4)`.
   - Watches: a `movement` line, "Swiss movement" (detail `specs.Movement ?? 'Swiss made'`), worth `r(stonePool × 0.75)`. If any stone is detected, the first one (`st0`) gets `r(stonePool × 0.25)`.
   - Everything else: each detected stone `st{i}` gets `r(stonePool × stone.weight / Σ weights)`. With no stones, there are no stone lines.
   - **Stone detection (`stonesFor`):**
     - A GIA spec gives `Centre diamond · {shape}`, detail `{carat.toFixed(2)} ct · {color} / {clarity} · GIA {reportNumber}`, weight `carat × 6`.
     - Spec key `pearl` gives `Pearls`, weight 3. This is checked before the `ct` test.
     - For specs whose value contains `ct`:
       - a key containing `emerald` gives `Colombian emerald` (ct × 3.5);
       - `sapphire` gives `Ceylon sapphires` (ct × 2.2);
       - `total carat` gives `Diamonds`, with ` · {Color}` and ` / {Clarity}` appended when those specs exist (ct × 2.5);
       - a key matching `diamond|halo|side|bezel` gives `Hidden halo diamonds`, `Side stones`, `Bezel diamonds` or `Accent diamonds` (ct × 1.8).
3. **Findings** (`materials`, id `findings`), chosen by product name in this order:
   - `/necklace|pendant|chain|collar|rivi/i`: `Chain & clasp` / `Solid gold spring ring`.
   - `/earring|stud|drop|huggie/i`: `Posts & backs` / `Secure screw or hinged backs`.
   - `/bracelet/i`: `Clasp & safety` / `Double box clasp`.
   - Watches: `Strap & buckle` / `specs.Strap ?? 'Leather strap'`.
   - Anything else: no line.
   - Amount: `r((watches ? 220 : 45) × fx)`.
   - Because of the order, "Griffintown Chain Bracelet" gets `Chain & clasp`. Rings and the Atwater cuff get no findings line.
4. **Making** (`making`).
   - `making = base × (MAKING_SHARE[category] ?? 0.16) × (hasStones || watches ? 1 : 2.2)`.
   - `labour = making × (hasStones ? 0.55 : 0.8)`.
   - `hours = max(2, round(labour / (95 × fx)))`.
   - `labour` line: `Regulation & assembly` (watches) or `Bench work · casting & fabrication`, detail `{hours} h × {r(95 × fx)}/h · Montréal atelier`, amount `r(labour)`.
   - `setting` line (only when stones exist): `Stone setting` / `Hand-set under microscope`, `r(making × 0.3)`.
   - `finish` line: `Polishing & hallmarking` / `12-stage finish, maker’s mark`, `r(making × (hasStones ? 0.15 : 0.2))`.
5. **Services** (`services`).
   - `gia` (GIA products only): `GIA grading report` / `№ {reportNumber}`, `r(165 × fx)`.
   - `insure`: `Insured shipping & presentation box` / `Signature courier, Canada` (CAD) or `Signature courier, duties prepaid` (USD), `r(48 × fx)`.
   - `engrave` (engravable products only): `Engraving` / `Hand or laser, up to 18 characters`, amount 0, `included: true`.
   - `care`: `Lifetime care plan` / `Annual cleaning, claw checks, polish`, amount 0, `included: true`.
6. **Margin** (`margin`).
   - `margin = base − Σ lines`.
   - If `margin < base × 0.12`, every stone line (id starting `st`, or `movement`) is multiplied by `k = max(0, (stoneTotal − (floor − margin)) / stoneTotal)` and rounded, and the margin is recomputed.
   - Line: `Design, salon & maison margin` / `Design, salon, staff, warranty reserve`.
   - **Computed:** this easing runs for `griffintown-chain-bracelet` (pre-easing margin as low as −466 CAD), `laurier-stacking-band` and `pearl-stud-gift-set`, in their gold metals and both currencies. No current product, metal or currency combination ends with a negative line.
7. **Options** (`options`): an `accent` line labelled `p.personalization?.accent?.label ?? 'Option'`, detail `Selected option`, worth the accent price.

The function returns `{ lines, price: base + accent, metalWeight: weight, labourHours: hours }`. The margin is computed as the balancing figure and the accent is added on both sides, so `Σ lines === price` exactly.

**Constant tables** (`src/data/costing.ts`):

| `METAL_RATE` key | CAD per gram | purity | name |
|---|---|---|---|
| `18k-yellow` | 82.4 | `18k · 75.0% gold` | 18k yellow gold |
| `18k-white` | 84.1 | `18k · 75.0% gold, rhodium finish` | 18k white gold |
| `18k-rose` | 81.9 | `18k · 75.0% gold` | 18k rose gold |
| `platinum` | 48.6 | `Pt950 · 95.0% platinum` | Platinum 950 |
| `vermeil` | 1.6 | `925 silver, 2.5µ 18k gold` | Gold vermeil |

| Category | `DEFAULT_WEIGHT` (g) | `STONE_SHARE` | `MAKING_SHARE` |
|---|---|---|---|
| necklaces | 6.2 | 0.5 | 0.16 (fallback) |
| earrings | 3.4 | 0.46 | 0.16 (fallback) |
| bracelets | 11.5 | 0.48 | 0.16 (fallback) |
| rings | 5.2 | 0.44 | 0.16 (fallback) |
| bridal | 4.6 | 0.56 | 0.13 |
| watches | 32 | 0.34 | 0.08 |
| gifts | 3.1 | 0.22 | 0.16 (fallback) |
| custom | 4.8 | 0.3 | 0.2 |
| rentals | 28 | 0.5 | 0.16 (fallback) |

`LABOUR_RATE_CAD` is `95` per bench hour.

**Worked example (computed):** `mont-royal-solitaire-pendant` in CAD, 18k yellow gold, price 6850.

| Group | Line | Detail | Amount |
|---|---|---|---|
| materials | 18k yellow gold | 6.2 g × 82.40/g · 18k · 75.0% gold | 511 |
| materials | Centre diamond · Round Brilliant | 0.70 ct · F / VS1 · GIA 2231874590 | 3425 |
| materials | Chain & clasp | Solid gold spring ring | 45 |
| making | Bench work · casting & fabrication | 6 h × 95/h · Montréal atelier | 603 |
| making | Stone setting | Hand-set under microscope | 329 |
| making | Polishing & hallmarking | 12-stage finish, maker’s mark | 164 |
| services | GIA grading report | № 2231874590 | 165 |
| services | Insured shipping & presentation box | Signature courier, Canada | 48 |
| services | Lifetime care plan | Annual cleaning, claw checks, polish | Included (0) |
| margin | Design, salon & maison margin | Design, salon, staff, warranty reserve | 1560 |

The lines sum to 6850, with a metal weight of 6.2 g and 6 h at the bench. One more computed case: the nameplate necklace with the accent in USD costs 1045, i.e. a base of 915 plus the 130 accent.

### 6.3 Rental fee split — `rentalLines(p, period, currency)` (private)

`fee = p.rental[period][currency]`. Three `services` lines are built first:
- `Full insurance cover` / `Loss, theft & damage for the rental period`: `round(fee × 0.22)`.
- `Cleaning & re-certification` / `Ultrasonic clean, claw check, gemmologist sign-off`: `round(fee × 0.08)`.
- `Bonded courier, both ways` / `Or in-salon fitting`: `round(fee × 0.12)`.

A `wear` line is then put first (group `materials`): `Use of the piece` = `fee − Σ`, with detail `{Weekend | One week | One month} · retail value {Math.round(p.price[currency]).toLocaleString('en-CA')}`.

**Computed example:** Gala Diamond Collar, weekend, CAD 650 splits into 377 + 143 + 52 + 78, with the detail `Weekend · retail value 92,000`. In rental mode the materials group header in the statement reads "The piece".

### 6.4 Taxes

- **CAD.** `taxes = splitTaxes(PROVINCES[province], price)`. The helper parses every `NAME n%` in the label (e.g. `GST 5% + QST 9.975%`) and rounds each line with `Math.round(price × rate)`, except the last, which takes what remains of `Math.round(price × PROVINCES[province].rate)`. The lines therefore add up to the cart's and checkout's tax.
  - Each row shows the tax name, `{rate}% of {price}` and the amount.
  - The rate text is `(rate × 100).toFixed(rate × 100 % 1 ? 3 : 0)` with trailing zeros, then any trailing dot, stripped. It renders `9.975`, `5`, `7`, `13` and so on.
  - `grand = price + Σ taxes`.
- **USD.** No tax is computed. `state` only changes the "Sales tax · {state}" label, and `grand = price`.

`PROVINCES` (`src/data/tax.ts`, commented "2024 rates"):

| Code | Name | `rate` | `label` |
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

`US_STATES`: `New York`, `California`, `Florida`, `Illinois`, `Massachusetts`, `Texas`, `Vermont`, `Washington`, `Other`. The cart and checkout use `rate` directly, not `splitTaxes`; see [Commerce logic](../commerce-logic.md).

### 6.5 Display

- **Section:** `id="price-breakdown"`, `scroll-mt-32 border-t border-[var(--border-hairline)]`, with inner `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36`.
- **Header:** `SectionHeader` with eyebrow "Transparent pricing", title "The price, *itemised*" (the `em` is gold-vermeil) and an aside paragraph that differs for rental and retail.
- **Left `aside`** (`lg:col-span-4`; inner wrapper `lg:sticky lg:top-36`):
  - "Composition".
  - The price at `text-6xl`, with the currency code at `[&_span]:text-xl`.
  - Sub-label: `{period} rental fee · before tax` or `{METALS[metal].label} · before tax`.
  - Composition bar: `mt-8 flex h-3 w-full overflow-hidden bg-[var(--bg-silk)]`, one segment per group with a non-zero total, width `amount / price`, coloured from `GROUPS`.
  - Legend rows: a swatch, the label, a percentage from `pct(n)` (one decimal below 10 %, an integer otherwise) and the amount without its currency code.
  - Retail only: a two-cell `dl` showing `{metalWeight.toFixed(1)} g` "Metal weight" and `{labourHours} h` "At the bench".
- **Right statement** (`lg:col-span-7 lg:col-start-6`, bordered):
  - One block per group, in `GROUPS` order, so Options renders before Margin. Each block has a tinted header (`bg-[var(--bg-silk)]/60`, swatch, label, subtotal) and rows of `grid grid-cols-[1fr_auto]` with the label, the amount (or a gold spec-face "Included") and a spec-face detail line.
  - Subtotal row with `border-t border-[var(--text-espresso)]`.
  - "Taxes & duties" block with a Province or State `<select>` (`font-spec cursor-pointer border-b border-[var(--border-hairline)] bg-transparent py-1 text-xs outline-none focus:border-[var(--text-espresso)]`).
  - Total bar: `bg-[var(--text-espresso)] … text-[var(--bg-travertine)]`.
  - A deposit row for rentals.
  - A footnote with an `Info` icon.

`GROUPS` (order and colours):

| id | Label | Colour |
|---|---|---|
| `materials` | Materials | `var(--text-espresso)` |
| `making` | Making charges | `var(--gold-vermeil)` |
| `services` | Certification & services | `var(--gold-champagne)` |
| `options` | Selected options | `#8a6a32` |
| `margin` | Maison margin | `var(--text-linen)` |

**Animation.** An `IntersectionObserver` with `threshold: 0.4`, set up in an effect with `[]` deps, sets `visible` the first time the bar is 40 % in view. Segment widths then transition from `0%` with `duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]` and `transitionDelay: i × 90ms`.

**Accessibility.** The bar is `role="img" aria-label="Price composition"`. Each select sits inside a `<label>` whose text is "Province" or "State".

### 6.6 Copy deck

- Eyebrow: `Transparent pricing`. Title: `The price, ` followed by *`itemised`*.
- Aside, rental: `What your rental fee covers, the refundable deposit, and tax — before you reserve.`
- Aside, retail: `Every gram, every stone and every bench hour behind this piece, with our margin shown openly.`
- Left column: `Composition`, `{period} rental fee · before tax`, `{metal label} · before tax`, `Metal weight`, `At the bench`.
- Statement: `Included`; `The piece` (rental materials header); group labels from `GROUPS`.
- Subtotal: `Rental fee` / `Price before tax`.
- Tax block: `Taxes & duties`, `Province` / `State`, rows of `{NAME}` with `{rate}% of {price}`.
- USD rows:
  - `Sales tax · {state}`, sub-line `Calculated at checkout from your ZIP code`, value `At checkout`.
  - `Import duties & customs fees`, sub-line `CUSMA-qualifying, cleared by Teresa & Sons`, value `Prepaid`.
- Total: `Total, tax included` (CAD) / `Total before sales tax` (USD).
- Deposit: `Refundable security deposit`, sub-line `Card pre-authorisation · released within 48 h of return`.
- Footnote, rental: `Tax applies to the rental fee only. The deposit is a hold, not a charge.`
- Footnote, retail: `Metal values use indicative daily rates per gram for the chosen alloy. Stone values reflect our cost for this grade. Figures are rounded and reconcile exactly to the price shown.`
- Line labels and details: see 6.2 and 6.3.

---

## 7. Reviews — `src/components/pdp/Reviews.tsx`

**Purpose:** the section "In their words". It holds the rating summary, a wall of client photos and videos, a filterable review list, a media lightbox and a write-a-review modal.

**Data source:** every seeded review is generated client-side from the slug. Customer submissions are stored per device.

**Props:** `{ product: Product; index: string }`. **Named export:** `getRatingSummary(slug)`.

### 7.1 Data source (deterministic per slug)

- **`seed(str)`:** `h = (h * 31 + charCode) >>> 0` for each character.
- **`getRatingSummary(slug)`** returns `{ seed: s, count: 18 + (s % 140), rating: (4.7 + (s % 3) / 10).toFixed(1) }`. The rating is a **string**, `"4.7"`, `"4.8"` or `"4.9"`, and the count ranges from 18 to 157. The PDP header in `Product.tsx` shows the same rating and `{count} reviews`.
- **`buildReviews(product)`** (memoised on `[product]`) builds six reviews, `r0` to `r5`:
  - Media per review: `mediaCounts = [2, 1, 0, 3, 0, 1]`, so 7 items in total.
  - Author and text: `POOL[(s + i) % 7]`, i.e. six consecutive testimonials out of seven.
  - Stars: `i === 4 && s % 2 ? 4 : 5`.
  - Age: `days = 3 + i * 9 + ((s >> i) % 7)`.
  - Media are taken consecutively, wrapping around, from `mediaPoolFor(product)`, starting at `s % pool.length`.
- **`mediaPoolFor`** (`src/data/media.ts`) picks the pool:
  - watches use `watch` (3 images);
  - gifts use `gift`;
  - names matching `earring|stud|drop|huggie` use `earrings`;
  - `bracelet|cuff` uses `bracelet`;
  - `necklace|pendant|collar|rivi|chain` uses `necklace`;
  - everything else uses `ring`.
  - Pools mix Unsplash images and Mixkit clips (`{ type: 'video', src, poster }`). See [Data layer](../data-model.md).

```ts
interface Review {
  id: string
  a: string
  loc: string
  t: string
  b: string
  stars: number
  days: number
  media: ReviewMedia[]
  mine?: boolean
}
```

Field meanings: `a` is the author, `loc` the location, `t` the headline, `b` the body, and `mine` marks the visitor's own submission. `ReviewMedia` is `{ type: 'image'; src } | { type: 'video'; src; poster }`.

`POOL` (verbatim):

| # | `a` | `loc` | `t` | `b` |
|---|---|---|---|---|
| 0 | Élodie M. | Montréal, QC | Better than the photographs | The finish is impeccable and it catches light from across the room. Packaging felt like opening a keepsake. |
| 1 | James T. | Boston, MA | Seamless cross-border order | Duties were prepaid as promised and it arrived in three days, insured and signed for. The concierge followed up personally. |
| 2 | Sophie L. | Québec, QC | An heirloom already | I wear it every day. The weight feels substantial without being heavy. My daughter has already claimed it. |
| 3 | Marcus O. | Toronto, ON | The engraving made it | Hand-engraved with our date — the lettering is beautiful. Marco even sent a photo before shipping. |
| 4 | Aisha R. | New York, NY | Worth the visit | Booked a video appointment and they showed me three stones under the loupe. Zero pressure, all expertise. |
| 5 | Claire B. | Ottawa, ON | Exquisite proportions | Delicate but not fragile. The clasp is secure and the polish is mirror-bright. Exactly as described. |
| 6 | Nathalie G. | Laval, QC | Worn on the big day | Photographed beautifully in every light. Our photographer asked where it was from before the ceremony even started. |

**Computed example:** `mont-royal-solitaire-pendant` shows rating 4.7 from 20 reviews. Its list is Sophie L., Marcus O., Aisha R., Claire B., Nathalie G. and Élodie M., all 5★, aged 1, 11, 20, 26, 33 and 48 days.

<details>
<summary>Computed rating and count per PDP-reachable product</summary>

| Slug | Rating | Count |
|---|---|---|
| mont-royal-solitaire-pendant | 4.7 | 20 |
| riviere-saint-laurent | 4.7 | 24 |
| plateau-paperclip-chain | 4.7 | 71 |
| vieux-port-diamond-studs | 4.7 | 124 |
| outremont-pearl-drops | 4.8 | 31 |
| mile-end-huggies | 4.8 | 26 |
| westmount-tennis-bracelet | 4.7 | 69 |
| atwater-cuff | 4.8 | 45 |
| griffintown-chain-bracelet | 4.7 | 90 |
| teresa-signet | 4.7 | 81 |
| sherbrooke-emerald-cocktail | 4.9 | 92 |
| laurier-stacking-band | 4.9 | 137 |
| notre-dame-oval-solitaire | 4.7 | 74 |
| basilique-emerald-cut-three-stone | 4.7 | 146 |
| promesse-wedding-band | 4.9 | 117 |
| heritage-automatic-38 | 4.7 | 91 |
| chronographe-1962 | 4.7 | 125 |
| dame-du-lac | 4.8 | 144 |
| gala-diamond-collar | 4.8 | 42 |
| chandelier-sapphire-earrings | 4.8 | 102 |
| bridal-tiara-and-drops | 4.9 | 95 |
| initial-disc-pendant | 4.7 | 147 |
| pearl-stud-gift-set | 4.8 | 141 |
| bespoke-engagement-commission | 4.7 | 115 |
| heirloom-redesign | 4.9 | 61 |
| engraved-nameplate-necklace | 4.9 | 143 |

`gift-card` is omitted: the route `#/p/gift-card` is redirected to the gift-card page by `parseHash` in `src/store.tsx`.

</details>

### 7.2 Rating summary (left `aside`, `lg:col-span-4`, `data-reveal`)

- The rating in `font-serif-editorial text-8xl font-light leading-none`.
- `<Stars n={5} size={16} />`, which always shows five filled stars.
- `{count + mine.length} verified reviews`.
- A fixed distribution, `dist = [0.82, 0.13, 0.03, 0.01, 0.01]`, for 5★ down to 1★. Each row has a 2 px gold bar at `d × 100%` and the count `Math.round(d × count)`, which ignores `mine`.
- Static facts in a `dl`: "Fit" — "True to size", and "Would gift" — "98%".

### 7.3 Media wall

- **When it shows:** whenever there is any media at all, which is always, because the seeded reviews carry 7 items.
- **Order:** `flat` holds every media item of `[...mine, ...base]`, so the visitor's own media come first.
- **Grid:** the first 8 tiles in `grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8`; tile 0 spans `col-span-2 row-span-2`.
- **Overflow:** when there are more than 8 items, tile 7 gets a `+{mediaCount − 7}` overlay that opens the lightbox at index 7.
- **Header:** "Client photos & videos" and the count `{photos} photos · {videos} videos`.
- **Tile (`Thumb`):** a `<video muted preload="metadata">` when a video has no poster; otherwise an `<img loading="lazy" class="editorial-zoom …">`. Videos get a round play badge.

### 7.4 Filters, sort, pagination and votes

- **Filters.** `type Filter = 'all' | 'media' | 'five'`: "All", "With photos & videos" (`r.media.length > 0`) and "5 stars" (`r.stars === 5`).
  - Chips: `whitespace-nowrap border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors`, plus the espresso fill when active.
  - Container: `role="group" aria-label="Filter reviews"`.
- **Sort:** none. The order is the visitor's own reviews, newest first, followed by `r0`…`r5`.
- **Pagination:** `limit` starts at 3. "Show more reviews" (`link-line`) adds 3 while `filtered.length > limit`. `limit` is never reset.
- **Helpful votes:** not implemented. There is no voting UI or state.
- **Empty state:** "No reviews match this filter yet."

**Review item** (`py-10`):
- `<Stars n={r.stars} />`, with `{r.days} days ago` on the right, or "Pending moderation" for `mine`.
- Title in `font-serif-editorial mt-5 text-3xl`; body in `max-w-2xl leading-relaxed text-[var(--text-taupe)]`.
- Media thumbnails at `h-24 w-20`; each opens the lightbox at that item's index in `flat`.
- Footer: `{a} · {loc}`, then either a `BadgeCheck` icon (`aria-label="Verified purchase"`) or a gold spec-face "You" tag for `mine`.

### 7.5 Write-a-review modal (`WriteReview`)

**Shell:**
- A portal to `document.body`.
- Overlay: `fixed inset-0 z-[100] flex items-end justify-center bg-[var(--bg-vault)]/50 sm:items-center sm:p-4`. It is a bottom sheet on mobile and centred at ≥ sm; clicking the backdrop closes it.
- The `<form>` itself is the dialog: `role="dialog" aria-modal="true" aria-label="Write a review"`, `max-h-[92vh] w-full max-w-xl overflow-y-auto bg-[var(--bg-travertine)] p-6 sm:p-10`, `data-lenis-prevent`.
- It calls `useModalLock()`. There is no Escape handler.

| Field | `name` | Rules |
|---|---|---|
| Your rating | (state `stars`) | Checked in code on submit: with no stars, it shows "Please choose a rating.". Hover previews via `hoverStar`. |
| Headline | `title` | `required`, `maxLength={80}` |
| Your review | `body` | `required`, `rows={4}`, `maxLength={1200}`, `resize-none` |
| Name | `name` | `required` |
| City | `loc` | optional; an empty value becomes `'Canada'` |
| Photos & videos | hidden file input, `accept="image/*,video/*" multiple` (`sr-only`) | at most `MAX = 6` items |

**Media handling (`addFiles`):**
- It sets `busy`, which disables submit and shows "…" in the add tile.
- It takes at most `6 − media.length` files.
- Images go through `compressImage(file, 1200)`: drawn on a canvas with the longest side capped at 1200 px and exported as an `image/jpeg` data URL at quality 0.8.
- Videos over `60 × 1024 × 1024` bytes are rejected with "Videos must be under 60 MB."; smaller ones get `URL.createObjectURL` with `poster: ''`.
- Other file types are silently ignored. The input is reset afterwards.
- Every tile has a "Remove" button.

**Submit:**
- Native `required` validation runs first, then the stars check.
- The component builds `` { id: `mine-${Date.now()}`, a, loc, t, b, stars, days: 0, media, mine: true } ``. Values are not trimmed.
- The parent's `submit` then puts the review first in `mine`, calls `saveMine`, closes the modal, shows the thank-you banner and resets the filter to `all`.

### 7.6 Persistence

- **Key:** `` `tns-reviews-${slug}` `` in `localStorage`.
- **Loading:** `loadMine` parses the key once at mount and falls back to `[]` on any error.
- **Saving:** `saveMine` writes all of the visitor's reviews for the product, with media filtered to images only; videos are object URLs that live for the session only.
- **Quota fallback:** if `setItem` throws, it retries with every review's media emptied. That retry is not wrapped in `try`.

### 7.7 Media lightbox (`MediaLightbox`)

- **Shell:** a portal with `fixed inset-0 z-[100] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)] lg:flex-row`, `role="dialog" aria-modal="true" aria-label="Client media"`, `data-lenis-prevent`. It calls `useModalLock()`.
- **Media pane:** a `<video controls autoPlay playsInline>`, or an `<img alt="Photo from {author}" class="max-h-full max-w-full object-contain">`.
  - Previous and Next buttons (`aria-label="Previous"` / `"Next"`) appear only when there is more than one item.
  - Close button: `aria-label="Close"`.
- **Side panel** (`max-h-[40vh] overflow-y-auto` on mobile, `lg:w-[380px]`):
  - Counter `{NN} / {NN} · Client {image|video}`.
  - Stars, headline and body.
  - Author and location, with a verified badge unless the review is `mine`.
  - A 5-column thumbnail strip.
- **Keys** (window listener): `Escape`, `ArrowRight`, `ArrowLeft`. Navigation wraps around.
- **`useModalLock()`:** on mount it calls `getLenis()?.stop()` and sets `document.documentElement.style.overflow = 'hidden'`; on unmount it restores both.

### 7.8 Copy deck

- Header: eyebrow `Verified clients`; title `In their ` followed by *`words`*; button `Write a review` (Camera icon).
- Wall: `Client photos & videos`, `{n} photos · {n} videos`, `+{n}`; tile aria `Play client video` / `View client photo`.
- Aside: `{n} verified reviews`, `Fit` / `True to size`, `Would gift` / `98%`.
- Filters: `All`, `With photos & videos`, `5 stars`.
- Banner: `Merci — your review has been received and will appear publicly once moderated.`
- Item: `{n} days ago`, `Pending moderation`, `You`, `Verified purchase` (aria). Empty state: `No reviews match this filter yet.` More: `Show more reviews`.
- Modal: `Votre avis`, `Review {product.name}`, `Your rating`, star aria `1 star` / `{n} stars`.
- Modal fields: `Headline` (placeholder `Sum it up in a line`), `Your review` (`How does it look, feel and wear?`), `Name` (`First name, last initial`), `City` (`Montréal, QC`).
- Modal media: `Photos & videos — up to 6`, `Add`, `Remove` (aria), `Show it worn — natural light works best. Videos under 60 MB.`
- Modal footer: `Submit review`, `Reviews are moderated before they appear publicly.`
- Modal errors: `Please choose a rating.`, `Videos must be under 60 MB.`. Busy indicator: `…`.
- Lightbox: `Client image` / `Client video`, taken from `m.type`.

---

## 8. RingSize — `src/components/pdp/RingSize.tsx`

**Purpose:** the ring-size step for categories `rings` and `bridal` (the page's `needsSize`), with a size-guide modal.

**Props (inline):** `{ value?: string; onChange: (s: string) => void; error?: boolean; step?: string }`. **State:** `guide` (whether the modal is open).

**Size system:** North American only, labelled `CA / US`. There are 11 sizes from 4 to 9 in half sizes. `RING_SIZES` is typed `[label, insideDiameterMm, circumferenceMm][]`. There is no UK, EU or Asian conversion; the guide maps a measured circumference to a size through the table below. The values are hard-coded, not computed.

| Size | Diameter (mm) | Circumference (mm) |
|---|---|---|
| 4 | 14.9 | 46.8 |
| 4.5 | 15.3 | 48.0 |
| 5 | 15.7 | 49.3 |
| 5.5 | 16.1 | 50.6 |
| 6 | 16.5 | 51.9 |
| 6.5 | 16.9 | 53.1 |
| 7 | 17.3 | 54.4 |
| 7.5 | 17.7 | 55.7 |
| 8 | 18.1 | 57.0 |
| 8.5 | 18.5 | 58.3 |
| 9 | 19.0 | 59.5 |

**Picker UI:**
- A header row with the legend and a "Size guide" button (`Ruler` icon; `text-[11px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--gold-vermeil)]`).
- Size buttons in `grid grid-cols-6 gap-1.5 sm:grid-cols-11`, each `font-spec border py-2.5 text-xs`; the selected one gets the espresso fill.
- A helper line underneath.
- The emitted value is the label string (e.g. `'6.5'`). The page stores it as `size`, puts `Size {size}` in the sticky-bar detail, and keeps it on the cart line.

**Guide modal:**
- Overlay: `fixed inset-0 z-[95] flex items-center justify-center bg-[var(--bg-vault)]/50 p-4`; clicking it closes the modal.
- Panel: `role="dialog" aria-modal="true" aria-label="Ring size guide"`, `max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[var(--bg-travertine)] p-8 lg:p-12`, `data-lenis-prevent`.
- `Escape` closes it, through a window listener that exists only while the modal is open.
- Content: three numbered steps (`sm:grid-cols-3`); a table with headers `CA / US`, `Diameter`, `Circumference` and values `toFixed(1)` + ` mm`, with the selected size's row in gold-vermeil; a closing note.
- It is rendered inline: no portal and no scroll lock.

**Accessibility:**
- `<fieldset>`, but its `<legend>` sits inside a wrapper `div`, so it is not the fieldset's first child.
- Size buttons expose no pressed state.
- The close button has `aria-label="Close"`.

**Copy deck:**
- Legend: `{step}` `Ring size`, plus `— {value}` once a size is chosen, or `— please select` on error (shown upper-case).
- Picker: `Size guide`; helper `One complimentary resize within the first year.`
- Modal headings: `Guide des tailles`, `Finding your size`.
- Steps:
  - `01` `Wrap a thin strip of paper around the base of your finger.`
  - `02` `Mark where it overlaps and measure the length in millimetres.`
  - `03` `Match the circumference below. Between sizes? Choose the larger.`
- Table headers: `CA / US`, `Diameter`, `Circumference`.
- Closing note: `Prefer certainty? We’ll mail a complimentary ring sizer anywhere in Canada or the U.S., or size you in our salon.`

---

## 9. StickyBar — `src/components/pdp/StickyBar.tsx`

**Purpose:** a compact purchase bar that slides up once the page's main CTA has scrolled out of view above the viewport.

```ts
interface Props {
  product: Product
  amount: number
  detail?: string
  label: string
  target: RefObject<HTMLElement | null>
  onAction: () => void
}
```

**Visibility trigger.** An `IntersectionObserver` with default options watches `target.current` (the page's CTA button, `ctaRef`). It sets `show = !e.isIntersecting && e.boundingClientRect.top < 0`. The bar is therefore shown only when the CTA is fully out of view **above** the viewport, never while the CTA is still below. The effect deps are `[target]`.

**Contents**, left to right (`mx-auto flex max-w-[1600px] items-center gap-5 px-6 py-3 lg:px-12`):
1. A `product.images[0]` thumbnail (`hidden h-12 w-10 object-cover sm:block`, `alt=""`).
2. The name (`font-serif-editorial truncate text-xl leading-tight`) and, when present, `detail` (`font-spec truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]`).
3. `<Price amount={amount} />` (`hidden text-sm sm:inline`).
4. `TryOnButton variant="icon"`.
5. The CTA button showing `label` (`bg-[var(--text-espresso)] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] sm:px-10`).

**Values supplied by the page:**
- `amount`: the rental rate for the selected period, or `priceFor(product, currency, metal) + personalizationPrice(...)`.
- `detail`: `[rental ? '{period} rental' : metal label, rental && booking.start && 'From {formatDay(start)}', the personalization text in “ ”, size && 'Size {size}']`, filtered and joined with `' · '`.
- `label`: `'Go to bag'` when this exact configuration is already in the bag. Otherwise `'Reserve this piece'` (rental), `'Begin commission'` (custom) or `'Add to bag'`.
- `onAction`: `onCta`, which opens the cart drawer when the configuration is in the bag and runs `handleAdd` otherwise.

**Shell and motion:** `fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`, plus `translate-y-0` when shown or `translate-y-full` when hidden.

**Accessibility:**
- The wrapper has `aria-hidden={!show}`.
- The CTA gets `tabIndex={show ? 0 : -1}`.
- The try-on icon button (`aria-label="View on you: {name}"`) stays in the tab order while the bar is hidden.

**Copy:** none of its own. Every string comes from props or from `TryOnButton`.

---

## 10. CompleteTheLook — `src/components/pdp/CompleteTheLook.tsx`

**Purpose:** "Complete the look" (or "Complete the ensemble" for rentals). It shows the current piece plus two pairings, with a set total and a single add (retail) or reserve (rental) button.

```ts
interface Props {
  product: Product
  index: string
  period: RentalPeriod
  onPeriodChange: (p: RentalPeriod) => void
  booking?: Partial<RentalBooking>
  /** Called when the ensemble cannot be reserved until dates are chosen. */
  onNeedBooking?: () => void
}
```

The file also exports `type RentalPeriod = 'weekend' | 'week' | 'month'`. **State:** `conflict: string | null`.

### 10.1 Pairing algorithm — `getLookPieces(product)`

- **Rental products:** the first two other products that have `rental`, in catalog order. Rentals therefore pair only with rentals, so the set can be reserved as one.
- **Everything else:** for each category in `PAIRS[product.category]` (or `[]`), the first product in `PRODUCTS` of that category that shares at least one metal with the current product. Categories with no match are dropped. No category pairs with itself, so the current product never appears twice.

| Main category | `PAIRS` | Computed pieces |
|---|---|---|
| necklaces | earrings, bracelets | `vieux-port-diamond-studs`, `westmount-tennis-bracelet` |
| earrings | necklaces, rings | `mont-royal-solitaire-pendant`, `teresa-signet` |
| bracelets | rings, earrings | `teresa-signet`, `vieux-port-diamond-studs` |
| rings | bracelets, earrings | `westmount-tennis-bracelet`, `vieux-port-diamond-studs` |
| bridal | earrings, necklaces | `vieux-port-diamond-studs`, `mont-royal-solitaire-pendant` |
| watches | bracelets, rings | `westmount-tennis-bracelet`, `teresa-signet` |
| gifts | earrings, necklaces | `vieux-port-diamond-studs`, `mont-royal-solitaire-pendant`; none for `gift-card`, which has no metals |
| custom | bridal, earrings | `notre-dame-oval-solitaire`, `vieux-port-diamond-studs` |
| rentals | (rental rule above) | the other two rental pieces |

When there are no pieces the component returns `null`, and the page leaves the section out of its numbering.

### 10.2 Pricing and add behaviour

- **Pricing.** `look = [product, ...pieces]`. `priceOf(p)` is `p.rental[period][currency]` for rentals and `priceFor(p, currency)` otherwise (the base price, with no metal delta). `total` is the sum of `priceOf`. `deposit` is the sum of the rental deposits (rentals only).
- **Retail `addSet`.** Calls `addToCart({ slug, metal: p.metals[0] })` once per piece. The current product is also added with its **first** metal; the page's selected metal, personalization, size and engraving are ignored. Each `addToCart` call also opens the cart drawer.
- **Rental `addSet`:**
  1. If `booking` is missing, or `isBookingValid(product.slug, period, booking)` fails, it clears `conflict` and calls `onNeedBooking()`. That is the page's `handleAdd`, which flags the dates step and scrolls to it.
  2. Otherwise it finds the first piece for which `isBookingValid(piece.slug, period, booking)` fails and sets the conflict message.
  3. If every piece is free, it adds each one as `{ slug, rental: period, booking }`, all sharing one booking.
- **Period toggle** (rentals only). It calls `onPeriodChange`, which is the page's `setPeriod`, so it also changes the period in the main configurator.

### 10.3 Layout

- **Section:** `bg-[var(--bg-silk)]`, inner `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36`, then `grid grid-cols-1 items-center gap-12 lg:grid-cols-12` (`grid-cols-1` bounds the phone column. Without it, the cards' unwrapped names stretched the track and pushed the page 388 px past the screen edge, until 2026-10-16).
- **Pieces row:** `flex items-center gap-3 lg:col-span-8`, with gold `Plus` icons between the pieces. Each piece:
  - is a link to `href.product(slug)` (`group block min-w-0 flex-1`, `data-reveal={i * 0.08}`);
  - has an `aspect-[4/5]` lazy `editorial-zoom` image;
  - shows the name (`font-serif-editorial mt-4 truncate text-lg lg:text-xl`) and the price, which gets a `/ {period label in lower case}` suffix for rentals.
- **Summary column:** `lg:col-span-3 lg:col-start-10`, with a top border on mobile and a left border on desktop, and `data-reveal="0.2"`. It contains:
  - the rental period toggle (`grid grid-cols-3 border`, `role="group" aria-label="Rental period"`; the buttons have no `aria-pressed`);
  - the set label, the total (`text-3xl`) and an explanatory line;
  - a full-width espresso button;
  - for rentals, a helper line that turns `text-red-700` when there is a conflict.

### 10.4 Copy deck

- `PERIOD_LABEL`: `Weekend`, `1 Week`, `1 Month`.
- Eyebrow: `Styled for the evening` (rental) / `Styled by the atelier`.
- Title: `Complete the ` followed by *`ensemble`* (rental) or *`look`*.
- Price suffix: `/ weekend`, `/ 1 week`, `/ 1 month`.
- Set label: `The ensemble · {PERIOD_LABEL}` / `The set · {n} pieces`.
- Explanatory line, rental: `Refundable deposit {price}. One fitting, one insured delivery, collected together.`
- Explanatory line, retail: `Matched in metal and proportion, presented together in one travertine box.`
- Button: `Reserve the ensemble` / `Add the set to bag`.
- Rental helper: `Uses the dates and delivery you selected above.` / `Choose your dates above to reserve the ensemble.`
- Conflict: `{piece name} is reserved on these dates. Try another start date, or reserve pieces individually.`

---

## 11. CraftStory — `src/components/pdp/CraftStory.tsx`

**Purpose:** a dark editorial band about how the piece is made. **Props (inline):** `{ product: Product; index: string }`. It has no state and always renders (section `story`).

**Copy selection:** `COPY[product.category] ?? COPY.default`, with keys `default`, `bridal`, `watches` and `rentals`. The title is a 3-tuple rendered as `{t0} <em>{t1}</em> {t2}`, with the middle word in italic champagne.

| Key | Title (middle word italic) | Body | Stats (value, then label) |
|---|---|---|---|
| `default` | Made slowly, *by* hand. | Each piece passes through four pairs of hands at our bench on rue Sherbrooke — from the first sketch to the final polish — and leaves only when it is worthy of the family name. | `40+` Hours at the bench; `12` Polishing stages; `100%` Recycled gold; `1962` Family atelier |
| `bridal` | A ring for *every* tomorrow. | Our bridal settings are engineered to hold a stone for generations: hand-raised claws, a reinforced gallery, and a comfort-fit shank you will forget you are wearing. | `GIA` Certified centre; `6` Hand-raised claws; `950` Platinum purity; `∞` Lifetime care |
| `watches` | Time, *regulated* in Montréal. | Every movement is opened, regulated in five positions and pressure-tested by our in-house horologist before it is released to you. | `5` Positions regulated; `42h` Power reserve; `5 yr` Service plan; `50m` Water resistance |
| `rentals` | Borrowed, *never* compromised. | Each rental piece is inspected, ultrasonically cleaned and re-certified between every wear, then delivered by bonded courier with full insurance. | `100%` Insured; `24h` Courier delivery; `3` Rental periods; `0` Hidden fees |

**Eyebrow:** `{index}` (in `mr-4 text-white/45`), then `The {product.collection} story`, e.g. "The Mont-Royal story".

**Layout:**
- Section: `relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]`, then `grid lg:grid-cols-2`.
- Image column: `relative min-h-[460px] overflow-hidden lg:min-h-[760px]`. It shows `product.images[1] ?? product.images[0]` (`absolute inset-0 h-full w-full object-cover opacity-85`, `alt=""`, `loading="lazy"`, `data-parallax`).
- Text column: `flex flex-col justify-center px-6 py-24 lg:px-20`.
  - `h2`: `font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5rem]`.
  - Body: `mt-8 max-w-md leading-relaxed text-white/65`.
  - Stats `dl`: `mt-14 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4`. Each cell is `bg-[var(--bg-vault)] py-6 pr-4`, with the `dd` (value, `font-serif-editorial text-4xl` champagne) before the `dt` (label, spec 9 px, `text-white/50`).

**Motion:**
- `data-reveal` on the eyebrow (0), `h2` (0.05), body (0.1) and stats (0.15).
- The `data-parallax` image goes from `yPercent` −8 to 8 at a constant `scale: 1.12`, scrubbed across its parent's pass through the viewport (via `useReveal`).

---

## 12. ProductFAQ — `src/components/pdp/ProductFAQ.tsx`

**Props (inline):** `{ product: Product; index: string }`.

**Items:** `[...(BY_CAT[product.category] ?? []), ...BASE]`, rendered with `<Accordion items={items} defaultOpen={items[0].id} />`. The first category-specific question opens by default; without one, `auth` opens. `BY_CAT` has entries only for `bridal`, `rentals` and `watches`.

**Layout:**
- `<section>`: `mx-auto grid max-w-[1600px] gap-12 border-t border-[var(--border-hairline)] px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36`.
- Left column (`lg:col-span-4`):
  - `SectionHeader` with eyebrow `Questions` and title `Before you ` followed by *`decide`*.
  - A note (`-mt-6 max-w-xs text-sm text-[var(--text-taupe)]`).
  - A `link-line` to `href.atelier` (`#/atelier`).
- Right column: `lg:col-span-7 lg:col-start-6 lg:pt-24`, with `data-reveal`.

**Copy:** note `Can’t find your answer? Our concierge replies within the hour, Tuesday to Saturday.`; link `Contact concierge`.

**All questions and answers (verbatim, in render order: category entries first, then `BASE`):**

| Applies to | id | Question | Answer |
|---|---|---|---|
| bridal | `conflict` | Are your diamonds conflict-free? | All diamonds are sourced in compliance with the Kimberley Process and our suppliers adhere to the System of Warranties. Canadian-mined stones are available on request. |
| bridal | `size-surprise` | Proposing as a surprise — what if the size is wrong? | Choose your best estimate. We include one complimentary resize within the first year, and can ship a discreet ring sizer in the meantime. |
| rentals | `deposit` | How does the deposit work? | A refundable deposit is pre-authorised on your card at reservation and released within 48 hours of the piece being returned and inspected. |
| rentals | `damage` | What if something happens during my rental? | Every rental is fully insured. Minor wear is expected and covered; we only ask that loss or significant damage be reported within 24 hours. |
| watches | `warranty` | What warranty comes with my watch? | Each watch carries the manufacturer’s international warranty plus our own five-year service plan, including one complimentary regulation. |
| all | `auth` | How do I know my piece is authentic? | Every piece is hallmarked with our maker’s mark and metal purity, and arrives with a Teresa & Sons certificate of authenticity. Diamonds over 0.50 ct include their original GIA report. |
| all | `ship` | Do you ship to the United States? | Yes. U.S. orders are priced in USD and shipped insured with duties and import fees prepaid — there is nothing to pay on delivery. Canadian orders ship free in CAD. |
| all | `return` | What is your return policy? | Non-personalized pieces may be returned within 30 days in original condition. Engraved, resized or made-to-order pieces are final sale, though we will always work with you to make it right. |
| all | `pay` | Can I pay in instalments? | Yes — Shop Pay Installments lets you split your purchase into four interest-free payments, or monthly plans on orders over $1,000, subject to approval. |

---

## 13. Accordion — `src/components/pdp/Accordion.tsx`

```ts
export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

export default function Accordion({ items, defaultOpen, tone = 'light' }: { items: AccordionItem[]; defaultOpen?: string; tone?: 'light' | 'dark' })
```

**Behaviour:**
- Only one item is open at a time. `open: string | null` is initialised from `defaultOpen` and read only at mount.
- Clicking a header toggles that item: `setOpen(on ? null : it.id)`.
- Content is always rendered. The panel animates `grid-template-rows` between `grid-rows-[0fr]` and `grid-rows-[1fr]` (`transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`) around an `overflow-hidden` child.
- The `Plus` icon (`size={16} strokeWidth={1.3}`) rotates 45° and turns `text-[var(--gold-vermeil)]` when its item is open (`transition-transform duration-500`).

**Classes:**
- List: `border-t {line}`. Item: `border-b {line}`. `line` is `border-white/15` for `tone="dark"` and `border-[var(--border-hairline)]` for light.
- Header button: `flex w-full items-center justify-between gap-6 py-5 text-left`.
- Title: `text-[11px] font-medium uppercase tracking-[0.22em]`.
- Body: `pb-6 text-sm leading-relaxed opacity-80`.

**Accessibility:**
- The header `<button>` has `aria-expanded`.
- There are no `aria-controls`, ids or region role, and no explicit `type`.
- Collapsed content is clipped, not `hidden` or `inert`.

**Consumers:** the PDP details accordion (`defaultOpen="details"`), `ProductFAQ`, and `src/pages/GiftCards.tsx` (`defaultOpen="where"`). Nothing uses `tone="dark"`.

---

## 14. Cross-module reference

### 14.1 Overlays and scroll handling

| Overlay | z-index | Where it mounts | Scroll lock | Escape | Focus management |
|---|---|---|---|---|---|
| Gallery lightbox | `z-[95]` | inline in `Gallery` | none (only `data-lenis-prevent`) | yes | none |
| Ring size guide | `z-[95]` | inline in `RingSize`, which sits inside the page's `[data-pdp-in]` configurator `div` | none (only `data-lenis-prevent`) | yes | none |
| Reviews media lightbox | `z-[100]` | portal to `document.body` | `useModalLock` (stops Lenis, sets `overflow: hidden`) | yes | none |
| Write-a-review | `z-[100]` | portal to `document.body` | `useModalLock` | **no** | none |
| StickyBar | `z-40` | inline, last child of the page root | n/a | n/a | the CTA's `tabIndex` follows visibility |

### 14.2 Motion summary

| Module | Mechanism | Parameters | Respects reduced motion? |
|---|---|---|---|
| Gallery stage | GSAP `fromTo` on every `index` change and on mount | opacity 0 → 1, scale 1.04 → 1, 0.9 s, `expo.out` | no |
| Gallery hover zoom | CSS transform | scale 1.8, 900 ms, `cubic-bezier(0.16,1,0.3,1)`, `(hover:hover)` devices only | no |
| Gallery rail and dots | CSS transitions | opacity 500 ms; underline `scale-x` 700 ms; dot width 500 ms | no |
| Accordion | CSS grid rows plus icon rotation | 500 ms, `cubic-bezier(0.16,1,0.3,1)` | no |
| PriceBreakdown bar | CSS `width`, triggered once at 40 % visibility | 1400 ms, 90 ms stagger | no |
| StickyBar | CSS `translate-y` | 700 ms, `cubic-bezier(0.16,1,0.3,1)` | no |
| SectionHeader, CraftStory, CompleteTheLook, Reviews, ProductFAQ | `data-reveal` via `useReveal` | y 40 → 0, opacity 0 → 1, 1.2 s `expo.out`, delay = attribute value, ScrollTrigger `top 88%`, `once` | yes (skipped entirely) |
| CraftStory image | `data-parallax` via `useReveal` | `yPercent` −8 → 8, `scale` 1.12, `ease: 'none'`, scrub from `top bottom` to `bottom top` of the parent | yes |
| CompleteTheLook and Reviews thumbnails | `.editorial-zoom` (`src/index.css`) | `scale(1.045)` on `.group:hover`, 1.1 s `cubic-bezier(0.16, 1, 0.3, 1)` | no |

None of the PDP modules use `motion-reduce:` variants. See [Motion, animation & scroll behaviour](../motion-and-interaction.md).

### 14.3 Recurring class recipes

- **Section shell:** `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36`. Two-column split: `grid … lg:grid-cols-12`, with `lg:col-span-4` on the left and `lg:col-span-7 lg:col-start-6` on the right.
- **Step legend number:** `font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]`. Legend text: `text-[11px] uppercase tracking-[0.22em]`.
- **Field label:** `text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]`.
- **Selectable chip:** `border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]` when selected; `border-[var(--border-hairline)] hover:border-[var(--text-espresso)]` otherwise.
- **Primary button:** `bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]`.
- **Dark overlay control:** `flex h-12 w-12 items-center justify-center rounded-full border border-white/20 hover:border-[var(--gold-champagne)]`.
- **Error colour:** `text-red-700` for text, `border-red-700/40` or `/50` for borders, `bg-red-50` for the rental conflict summary.

Breakpoints are Tailwind's defaults (`sm` 640 px, `lg` 1024 px). The modules use only `sm` and `lg`. Tokens are described in the [Design system](../design-system.md).

---

## Notes & gotchas

This section holds the observations, risks and recommendations. Items marked **verified** were confirmed by evaluating the code; items marked **inferred** follow from reading the code but were not checked in a browser.

### Bugs and data defects

1. **The ring-size guide probably does not cover the viewport (inferred).**
   - `Product.tsx` runs `gsap.from('[data-pdp-in]', { y: 24, … })` without `clearProps`. When a transform tween ends at zero, GSAP 3.15.0 writes `transform: translate(0, 0)` (`_renderCSSTransforms` in `node_modules/gsap/CSSPlugin.js`).
   - Any `transform` other than `none` makes that element the containing block for `position: fixed` descendants, and also creates a stacking context.
   - `RingSize`'s `fixed inset-0 z-[95]` overlay is rendered inline inside the configurator `div[data-pdp-in]`. It will therefore likely size and position itself against that `div` rather than the viewport, and its `z-[95]` only competes inside that stacking context.
   - This does not happen under `prefers-reduced-motion`, because the intro tween is skipped.
   - `Gallery`'s lightbox is not inside a `[data-pdp-in]` element, and the `Reviews` modals are portaled, so neither is affected.
2. **The booked-date generator under-books (verified).** `getBookedDates` uses the signed `>>` on an unsigned hash. For `chandelier-sapphire-earrings` (hash ≥ 2³¹) only +42, +43 and +77 are booked, plus one date in the past. `bridal-tiara-and-drops` has **no** booked dates at all. Only `gala-diamond-collar` gets the intended four windows. The same signed-shift pattern appears in `buildReviews` (`(s >> i) % 7`).
3. **Impossible review ages (verified).** Because of that signed shift, review `r0` shows `-2 days ago` on `riviere-saint-laurent`, `outremont-pearl-drops`, `atwater-cuff`, `bespoke-engagement-commission` and `engraved-nameplate-necklace`.
   - It shows `-1 days ago` on `teresa-signet`, `laurier-stacking-band`, `dame-du-lac`, `chandelier-sapphire-earrings` and `bridal-tiara-and-drops`.
   - It shows `0 days ago` on `vieux-port-diamond-studs`, `mile-end-huggies`, `promesse-wedding-band` and `heirloom-redesign`.
   - It shows `1 days ago` on `mont-royal-solitaire-pendant` and `griffintown-chain-bracelet`, because "days" is never singularised.
4. **The CompleteTheLook set total ignores the platinum surcharge (verified).**
   - `priceOf` uses `priceFor(p, currency)` with no metal, but `addSet` adds `metal: p.metals[0]`. For pieces whose first metal is platinum (all bridal products and `bespoke-engagement-commission`), the bag ends up CAD 650 / USD 475 higher per piece than the "set" total.
   - For example, on `promesse-wedding-band` the set shows 17200 CAD while the bag gets 17850; on `bespoke-engagement-commission` it shows 32800 while the bag gets 34100.
5. **"Add the set to bag" bypasses configurator validation (verified by reading).** It adds rings and bridal pieces without a size, `teresa-signet` and `initial-disc-pendant` without their required monogram or initial, and the nameplate without a name. It also ignores the page's selected metal for the current product. See [Product detail page](../pages/product.md) for the CTA path, which does validate.
6. **The PDP tax total matches cart and checkout (fixed 2026-10-22, KI-027).** `splitTaxes` used to round each component on its own, which put 82 of 660 retail product × metal × province combinations $1 over. Its last line now takes the remainder of the single rounding: Mont-Royal at 6850 in BC gives GST 343 + PST 479 = 822, as the cart does.
7. **The labour detail does not multiply out (verified).** The `labour` line prints `{hours} h × {rate}/h`, but its amount is `r(labour)`, not hours × rate. On Mont-Royal it prints "6 h × 95/h" next to an amount of 603 (6 × 95 = 570).
8. **Latent tax-rate formatting bug.** The `% of` label strips trailing zeros even from integer rates, so a 10 % or 20 % rate would display as `1%` or `2%` (verified by evaluating the expression). No current province rate triggers it.
9. **Reviews robustness.**
   - If `compressImage` rejects (an undecodable image), `addFiles` throws before `setBusy(false)`, which leaves submit disabled showing "…".
   - The quota-fallback `localStorage.setItem` in `saveMine` is unguarded.
   - Data-URL images, up to 6 per review at roughly 1200 px JPEG each, can exhaust storage quickly, and the fallback then drops the images of **all** stored reviews.
   - Object URLs for videos are never revoked.
   - Form values are not trimmed, so a whitespace-only headline passes `required`.

### Accessibility gaps

- **Accordion:** collapsed panels stay focusable and readable by screen readers (not `hidden`/`inert`); there are no `aria-controls` or ids.
- **RentalCalendar:** `role="grid"` has no row or gridcell children and no arrow-key navigation.
- **RingSize:** the `<legend>` is nested in a `div`, so it is not the fieldset's legend.
- **Personalizer:** in `initial` mode, `<label htmlFor="personal-text">` has no target.
- **StickyBar:** it is `aria-hidden` while its try-on button remains tabbable.
- **Missing pressed state:** chain-length, letter, slot, method, ring-size, ensemble-period and review-filter buttons expose no `aria-pressed`. Within these modules, only the Personalizer font buttons, the calendar days and the gallery's `WishButton` do.
- **Gallery:**
  - The stage is not keyboard-operable.
  - "Full screen" is hidden below `sm`.
  - The mobile dots are 1 px tall tap targets.
  - There is no swipe.
  - No overlay traps or restores focus.
  - `WriteReview` cannot be closed with Escape.
- **CraftStory:** the stats put `<dd>` before `<dt>`.

### Content inconsistencies

- On the same page, CraftStory says `40+` "Hours at the bench", while PriceBreakdown shows the computed hours (e.g. "6 h — At the bench").
- The `watches` story claims `42h` "Power reserve" and `50m` "Water resistance" for every watch, including the manual-wind Chronographe 1962 and the quartz Dame du Lac.
- The `bridal` story shows `GIA` "Certified centre" and `950` "Platinum purity" even for the stoneless Promesse band and for gold metals.
- Every product reuses the same seven `POOL` testimonials; "The engraving made it" and "Worn on the big day" can appear on watches. The summary always shows five filled stars whatever the rating (4.7–4.9).
- The distribution and the PDP header count ignore the visitor's own reviews, but the "verified reviews" count adds them, even though those reviews are "Pending moderation".
- Period labels differ between modules: `1 Week` / `1 Month` in CompleteTheLook against `One week` / `One month` in the page and `rentalLines`. The rental-calendar conflict sentence uses the raw id ("a week rental").
- In rental mode, PriceBreakdown labels the materials group "Materials" in the legend but "The piece" in the statement. The `retail value 92,000` detail has no currency.
- The big composition price sits in a `font-serif-editorial` paragraph but renders in Jost (the spec face), because `Price` applies `font-spec` to its own span.
- `describePersonalization` hard-codes `'Diamond accent'` instead of `cfg.accent.label`.

### Other behaviours worth knowing

- `isBookingValid` does not check the collection day (start + `RENTAL_DAYS`) or the six-month horizon that the calendar UI enforces.
- `RentalCalendar` memoises `today` at mount, whereas `isBookingValid` recomputes it on each call, so the two can disagree after midnight.
- Picking a new date keeps the previously chosen slot.
- Availability and review data are deterministic per **slug**. Renaming a slug changes its ratings, reviews, media and booked windows.
- The type `RentalPeriod` is defined three times: exported from `CompleteTheLook.tsx`, declared locally in `Product.tsx`, and as `RentalPeriodId` in `catalog.ts`.
- Nothing uses `Accordion`'s `tone="dark"`.
- `Gallery` builds its views on every render. After a hover, the inline `transformOrigin` stays on the reused `<img>` when you switch to another photo.
- The Gallery lightbox and the RingSize guide rely only on `data-lenis-prevent` and do not stop Lenis. Whether the page behind them can still scroll was not verified.

### Recommendations (opinion)

- Add `clearProps: 'transform'` to the PDP intro tween, or portal the RingSize guide to `document.body` with `useModalLock` like `Reviews` does.
- Use `>>>` in `getBookedDates` and `buildReviews`, or wrap the remainders in `Math.abs`. Expect visible demo data to change when you do.
- Make `CompleteTheLook` price pieces with the metal it adds (`priceFor(p, currency, p.metals[0])`). Either pass the page's configuration for the current product or route the set through the same validation as `handleAdd`.
- Share a single tax-rounding helper between `PriceBreakdown`, `Cart` and `Checkout`.
- Give every toggle button `aria-pressed`, and give the overlays Escape handling plus focus management consistently.

---

## Related docs

- [Product detail page (PDP) — orchestration & purchase flow](../pages/product.md)
- [Data layer — catalog, media, gift cards, costing & tax](../data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](../commerce-logic.md)
- [Cart drawer, cart page & checkout](../pages/cart-and-checkout.md)
- [Design system — tokens, typography, color, layout & component recipes](../design-system.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [UX patterns, responsive behaviour & accessibility](../ux-patterns-and-accessibility.md)
- [Brand, voice & copywriting](../brand-voice-and-copy.md)
- [Virtual try-on](../features/virtual-try-on.md)
- [Shoppable video & the Atelier page](../features/shoppable-video-and-atelier.md)
- [Gift cards — purchase builder & balance checker](../pages/gift-cards.md)
- [Global chrome & shared components](./global-and-shared.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [Architecture & runtime model](../architecture.md)
- [Code conventions](../code-conventions.md)
- [Known issues, risks & tech debt](../known-issues.md)
- [File index](../INDEX.md)
