# Design system — tokens, typography, color, layout & component recipes

The visual language is editorial luxury. Warm paper backgrounds (travertine, silk) carry espresso ink, champagne and vermeil gold accents, and 1 px hairline rules. Display type is Baskervville, a revival of Baskerville's 1757 book face, with an italic gold accent word. Text, labels, specs and prices use Jost, a geometric sans in the Futura tradition: labels are tiny uppercase and widely tracked, and figures are lining and tabular. Corners are square, and an animated film grain sits over everything. There is no Tailwind config: tokens are plain CSS custom properties in `src/index.css`, consumed through Tailwind v4 arbitrary values such as `bg-[var(--bg-travertine)]`. Counts below are grep counts over `src/**/*.{ts,tsx}` on 2026-10-15.

Scope: `src/index.css`, all `src/**/*.tsx` (inventory), recipes copied from `src/components/Header.tsx`, `src/components/ProductCard.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/home/SectionHeader.tsx`, `src/pages/GiftCards.tsx`, `src/pages/Account.tsx`, `src/pages/Atelier.tsx`, `src/components/CartDrawer.tsx`

## 1. Color tokens (`:root` in `src/index.css`, inside `@layer base`)

| Token | Hex | Role | Uses |
|---|---|---|---|
| `--bg-travertine` | `#FBF9F5` | Page background (also `html`), light text on dark, translucent chips (`/90`, `/95`) | 81 |
| `--bg-silk` | `#F3EFE6` | Alternate section bands, image placeholders, hover fill on tiles | 39 |
| `--bg-vault` | `#121110` | Dark sections, footer, marquee, overlays (`/45` backdrop, `/95` viewer) | 43 |
| `--text-espresso` | `#141311` | Primary ink, primary button fill, active toggle fill, active borders | 122 |
| `--text-taupe` | `#6E685F` | Secondary text and body copy | 103 |
| `--text-linen` | `#A39C91` | Tertiary text: meta lines, placeholders, inactive items, the currency code in `Price` | 104 |
| `--gold-vermeil` | `#B89047` | Accent on light: italic headline words, numerals, eyebrows, hovers, badges, focus underline | 161 |
| `--gold-champagne` | `#D4B982` | Accent on dark: eyebrows, italics, solid buttons on vault | 94 |
| `--border-hairline` | `#E6E0D4` | All 1 px rules, borders, dividers, hairline-grid gaps | 140 |

**Usage pattern**: `bg-[var(--bg-silk)]`, `text-[var(--text-taupe)]`, `border-[var(--border-hairline)]`, `fill-[var(--gold-vermeil)]`, `divide-[var(--border-hairline)]`, `accent-[var(--gold-vermeil)]`, `ring-[var(--text-espresso)]`. Opacity modifiers appear on tokens (`bg-[var(--bg-travertine)]/95`).

**On dark (vault) surfaces**, use white alphas: `text-white/80` for links, `/60` for body, `/50` and `/45` for meta, `/40` for faint text; borders `border-white/10`, `/15` and `/20`; camera and player controls use `bg-black/45`.

**Off-token colours (intentional):**
- Errors: Tailwind `text-red-700` (10 uses) and `text-red-600` (2).
- Metal swatches: `METALS[*].swatch` in `src/data/catalog.ts`.
- Gift-card gradients: `DESIGNS` in `src/data/giftcards.ts`.
- Mega-menu gift-card swatch: `bg-[linear-gradient(135deg,#e8d3a3,#c9a45f_45%,#9c7a3c)]` in Header.
- Vector drawing colours in `JewelryOverlay` (13 hex values).
- Hex in Personalizer (4), Product (2), PriceBreakdown (1) and TryOnStudio (1: the radial pre-start gradient `#2a2622`→`#121110`).

**Global colour rules** in `src/index.css`:
- `::selection`: `rgba(212,185,130,.35)` background with `#141311` text.
- Scrollbar: 6 px wide, travertine track, champagne thumb that turns vermeil on hover.

## 2. Typography

The fonts are loaded by a single Google Fonts `@import` on the first line of `src/index.css` (before `@import 'tailwindcss'`).

| Family | Weights loaded | How it's applied | Uses |
|---|---|---|---|
| Baskervville | 400–700 variable, with italics | `.font-serif-editorial` (fallbacks Baskerville, Libre Baskerville, Georgia; sets `lining-nums`) | 103 |
| Jost | 300–600 variable, with italics | The `html` default for body and UI text (no class needed), and `.font-spec` (sets `lining-nums tabular-nums`) | 168 (`.font-spec`) |
| Pinyon Script | 400 | Inline `fontFamily` in the Personalizer preview and the try-on nameplate | 2 |

Inline `fontFamily` values also name Baskervville (Personalizer "Serif" preview, try-on signet and photo stamp) and Jost (Personalizer "Block" preview).

**Strategy** (2026-10-16). The owner asked for calm, premium, memorable faces that carry the house's legacy, without aggressive curves. Baskervville, Newsreader and Spectral were auditioned in the running site; Baskervville won.
- **Baskervville** (ANRT's revival of John Baskerville's 1757 type) is the voice of the house: a period book face with moderate contrast, round, unhurried curves, a smooth italic for the gold accent word, and composed capitals for the wordmark. It replaced Cormorant Garamond, whose very high contrast and sharp calligraphic details read as fussy, and thin at small sizes.
- **Jost** (an open-source geometric sans in the Futura tradition) carries body text, UI labels, prices and specs in one quiet family. It replaced both Plus Jakarta Sans and JetBrains Mono; its tabular figures keep amounts aligned without a code font.
- **Pinyon Script** stays for the engraving "Script" option only. Add no other families.

**Figures.** Baskervville's default figures are old-style, and their zero reads as an "o" in counts such as "Wishlist (0)", so `.font-serif-editorial` sets `lining-nums`. A headline may opt into old-style with `!oldstyle-nums` (the `!` beats the unlayered class); the home hero uses it for "since 1962". `.font-spec` sets `lining-nums tabular-nums`.

**Weights.** Baskervville starts at 400, so the `font-light` (300) on display headlines renders at 400. That is intended: the regular already reads light at display sizes.

**Wordmark** (Header): tracked capitals, `font-serif-editorial -mr-[0.12em] block whitespace-nowrap text-[17px] uppercase tracking-[0.12em] sm:-mr-[0.16em] sm:text-[22px] sm:tracking-[0.16em] lg:text-[25px]`, with the ampersand as `<em className="text-[var(--gold-vermeil)]">&amp;</em>`. The negative right margin equals the tracking and cancels the trailing letter-space, so the capitals centre. The gift-card art repeats the capitals (`text-[5.6cqi] uppercase tracking-[0.14em]`).

**Brand mark** (favicon, `public/favicon.svg`): the wordmark's italic ampersand alone, Baskervville italic 600 traced to a vector, in a gold gradient (`#E7CF9C` → `--gold-champagne` → `--gold-vermeil`) on a `--bg-vault` tile, which is also the `theme-color`. The ICO and the 180 px apple-touch icon are renders of the same art. The 1200×630 social card (`public/og-image.jpg`) sets the hero lockup beside a framed piece. See [platform-and-tooling.md](platform-and-tooling.md) §12.3.

**Hero lockup** (HomeHero):
- Lines 1 and 3 sit flush left. The accent line opens with a gold hairline (`w-[0.9em] sm:w-[1.5em]`, transparent to champagne) that draws in from the left edge, then the italic at `1.05em` in champagne.
- After each reveal a single glint crosses the italic. It is a text-clipped gradient (`bg-clip-text text-transparent`, `bg-[length:250%_100%]`) whose `background-position` GSAP moves from `100%` to `0%`.
- Pad any text-clipped span below (`pb-[0.3em] -mb-[0.3em]`), or its descenders vanish.

**De-facto type scale:**
- Arbitrary sizes in use:
  - Micro: `text-[10px]` (152), `text-[11px]` (91), `text-[9px]` (22), `text-[8px]` (1).
  - Display: `text-[2.75rem]` (7), `text-[3rem]`, `text-[3.25rem]`, `text-[3.5rem]`, `text-[3.75rem]`, `text-[4.25rem]`, `text-[4.75rem]` (3), `text-[5rem]`, `text-[5.25rem]`, `text-[7rem]`, `text-[7.5rem]`, `text-[9rem]`.
  - Special: `text-[17vw]` (footer wordmark), `cqi` units inside gift-card art.
- Standard sizes in use: `text-sm` (70), `text-xs` (55), `text-3xl` (31), `text-6xl` (18), `text-4xl` (15), `text-xl`, `text-2xl` (12 each), `text-5xl` (10), `text-lg` (9), `text-7xl` (7), `text-base` (5), `text-8xl` (4).
- Tracking:
  - Most used: `0.2em` (53), `0.22em` (47), `0.3em` (29), `0.24em` (29), `0.18em` (26), `0.16em` (14), `0.26em` (11), `0.28em` (10).
  - Negative, for display headlines: `-0.02em` (9), `-0.025em`, `-0.03em`.
  - Wide outliers: `0.4em` (wordmark sub-line), `0.5em`.
- Leading: `leading-relaxed` (24, body), `leading-tight` (16), `leading-none` (14), and display headlines at `leading-[0.98]` (7), `[0.95]`, `[0.92]`.
- Italics: the accent word in serif headlines is `<em className="text-[var(--gold-vermeil)]">…</em>` (champagne on dark). This is the brand's signature headline move.

**Role recipes** (copy these; source file in brackets):

| Role | Classes |
|---|---|
| Eyebrow / kicker | `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]` (champagne on dark) [GiftCards, Atelier, Account] |
| Hero display | `font-serif-editorial text-6xl font-light leading-[0.95] lg:text-[7.5rem]` [Atelier]. Alternative: `text-[3.25rem] font-light leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-[7rem]` [GiftCards] |
| Section title | `SectionHeader` h2: `font-serif-editorial max-w-3xl text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]` |
| Page title (utility pages) | `font-serif-editorial mt-4 text-6xl font-light lg:text-7xl` (Account) / `lg:text-8xl` (Wishlist) |
| Tile / card heading | `font-serif-editorial text-3xl` (tiles); `font-serif-editorial mt-1.5 text-xl leading-tight sm:text-2xl` (ProductCard) |
| Body | `leading-relaxed text-[var(--text-taupe)]`, with `text-sm` in tiles and `max-w-md`/`max-w-lg` measure |
| UI / form label | `text-[11px] uppercase tracking-[0.22em]` |
| Meta / spec line | `font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-linen)]` (ProductCard collection) |
| Step number | `font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]` → `01`, `02`… |
| Nav link | `text-[11px] font-medium uppercase tracking-[0.22em] transition-colors hover:text-[var(--gold-vermeil)]` |
| Button label | `text-[11px] font-medium uppercase tracking-[0.24em–0.28em]` |
| Price | `<Price amount={n} />`, which always renders in the spec face. Restyle the currency code with `[&_span]:…` |

## 3. Layout & spacing

- **Container:** `mx-auto max-w-[1600px] px-6 lg:px-12` (40 uses). Account uses `max-w-[1400px]`; forms use `max-w-3xl` or `max-w-md`.
- **Vertical rhythm:**
  - Heroes: `py-20 lg:py-28`.
  - Content sections: `py-28 lg:py-36`.
  - Footer: `pt-24 pb-10`.
  - `SectionHeader` adds `mb-14 lg:mb-20`.
- **Grids:**
  - Asymmetric 12-column layouts: `lg:grid-cols-12`, e.g. `lg:col-span-6` beside `lg:col-span-5 lg:col-start-8`.
  - Product grids: `grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4` or `sm:grid-cols-2 lg:grid-cols-3`.
  - **Hairline grid**: `grid gap-px bg-[var(--border-hairline)]`, where each cell has its own background (`bg-[var(--bg-silk)]` or `bg-[var(--bg-travertine)]`). Used by process steps, account tiles and "how it works".
- **Breakpoints:** mobile-first, and `lg:` is *the* desktop switch (284 uses). `sm:` is secondary (69). `md:` is nearly unused (2). There are no `xl:`/`2xl:` classes. The Header nav, mega menu, side panels and 12-column layouts all switch at `lg`.
- **Aspect ratios:**
  - `aspect-[4/5]`: product and editorial imagery.
  - `aspect-square`.
  - `aspect-[9/16]`: films.
  - `aspect-[3/4]`: try-on stage.
  - `aspect-[1.586]`: gift cards (ISO ID-1).
- **Sticky elements:** Header `sticky top-0 z-50`; side columns `lg:sticky lg:top-36`; PDP StickyBar `z-40`.
- **z-index ladder** (keep new layers inside it):

| Layer | Value | Where |
|---|---|---|
| Hero internals | `z-[4]`–`z-[7]` | HomeHero: light and grades 4–5 (inside the frame), side label 5, copy 6, featured piece 7 (above the copy column, whose full-height box would block it) |
| Local overlays | `z-10` | CategoryIndex, Gallery, TryOnStudio captured shot |
| PDP sticky bar | `z-40` | StickyBar |
| Back-to-top button | `z-[45]` | `BackToTop` (above the StickyBar; below the header, so the mobile menu inside the header's stacking context covers it) |
| Header | `z-50` | Header (sticky) |
| Film grain | `60` (CSS) | `.film-grain` |
| Mobile menu | `z-[70]` | Header |
| Cart backdrop / drawer | `z-[80]` / `z-[90]` | CartDrawer |
| Lightboxes | `z-[95]` | Gallery lightbox, RingSize guide |
| Share sheet | `z-[100]` | `ShareSheet` (portal, with the other modals and viewers) |
| Modals / viewers | `z-[100]` | Reviews modal, VideoViewer |
| Try-on studio | `z-[110]` | TryOnStudio |
| Skip link (while focused) | `z-[120]` | `App.tsx` |

## 4. Shape, borders & depth

- **Square corners everywhere:** buttons, inputs, cards, panels and images. `rounded-full` (38 uses) is reserved for round icon buttons, counters, dots, swatches, the try-on chip and WishButton. The only other radii:
  - Gift-card art `rounded-[4%/6.3%]`.
  - Design swatches `rounded-[6%/9%]`.
  - Mega-menu mini card `rounded-[2px]`.
  - VideoViewer player `sm:rounded-sm`.
  - `rounded-[50%]` (2 uses).
- **Borders:** `border border-[var(--border-hairline)]` by default. Hover and active states darken to `border-[var(--text-espresso)]`. Focused underline inputs turn `focus:border-[var(--gold-vermeil)]`.
- **Shadows:** rare and custom, never Tailwind presets. Examples:
  - Gift card: `shadow-[0_30px_60px_-30px_rgba(20,19,17,0.55)]`.
  - Drawer: `shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)]`.
  - Quote card: `shadow-[0_20px_40px_-30px_rgba(20,19,17,0.5)]`.
- **Blur:** header `backdrop-blur-md`; chips and controls `backdrop-blur`; drawer backdrop `backdrop-blur-[2px]`; video viewer `backdrop-blur-md`.

## 5. Component recipes (verbatim)

| Component | Classes / source |
|---|---|
| Primary button (dark → vermeil) | `bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]` [Account, Atelier] |
| Outline button | `flex w-full items-center justify-center gap-2.5 border border-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]` [TryOnButton outline] |
| Solid button on dark | `bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] transition-colors hover:bg-white` [TryOnButton solid] |
| Small ghost button | `flex items-center gap-2 border border-[var(--border-hairline)] px-5 py-3 text-[11px] uppercase tracking-[0.2em] hover:border-[var(--text-espresso)]` [Wishlist] |
| Editorial text link | `className="link-line"` (11 px, 500 weight, `0.26em`, uppercase, 25%-opacity underline plus a vermeil underline that sweeps in on hover over 0.7 s) |
| Inline underline link | `border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]` |
| Round overlay control | `flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70` [TryOnStudio, VideoViewer] |
| Chip | `inline-flex items-center gap-2 rounded-full bg-[var(--bg-travertine)]/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] … backdrop-blur` [TryOnButton chip] |
| Boxed input | `w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]` [GiftCards] |
| Underline input | `mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]` [Account, Atelier] |
| Choice tile | ``border px-4 py-3.5 text-left transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`` [GiftCards `choice`] |
| Segmented toggle | Wrapper `grid grid-cols-2 border border-[var(--border-hairline)]`; active segment `bg-[var(--text-espresso)] text-[var(--bg-travertine)]` [GiftCards, Account] |
| Badge (on imagery) | `font-spec bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]` [ProductCard] |
| Counter badge | `font-spec absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--text-espresso)] px-1 text-[9px] text-[var(--bg-travertine)]` [Header] |
| Section header | `<SectionHeader index="03" eyebrow="…" title={<>Word <em className="text-[var(--gold-vermeil)]">accent</em></>} aside={…} tone="light" />` |
| Tile (hairline grid cell) | `group flex flex-col bg-[var(--bg-travertine)] p-8 transition-colors hover:bg-[var(--bg-silk)]` [Account] |
| Product card | `<ProductCard product={p} index={i} />` (see the global-and-shared doc) |
| Dark section | Wrapper `bg-[var(--bg-vault)] text-[var(--bg-travertine)]`; champagne eyebrow and italics; `text-white/60` body; `SectionHeader tone="dark"` |
| Error list | `<ul className="… text-sm text-red-700" role="alert">` |
| Drawer | Panel `max-w-[460px]` sliding 700 ms `ease-[cubic-bezier(0.16,1,0.3,1)]` at `z-[90]`; backdrop `bg-[var(--bg-vault)]/45 backdrop-blur-[2px]` at `z-[80]` [CartDrawer] |

## 6. Iconography

`lucide-react` is the only icon set. Imported icons (with file counts): X(9), ShieldCheck(5), Truck, Sparkles, Plus, Heart, Gift, ChevronRight, ChevronLeft, ArrowRight (4 each), Star, ShoppingBag, Ruler, Play, Lock, Check, ArrowUpRight (3), RotateCcw, Package, MapPin, Gem, ChevronDown, Camera, CalendarHeart (2), and one each of VolumeX, Volume2, User, Share2, Send, Search, ScanFace, Receipt, Phone, Pencil, PenLine, Pause, NotebookPen, Minus, MessageCircle, Menu, Mail, LogOut, Info, ImagePlus, History, Expand, Clock, ChevronUp, CalendarDays, BadgeCheck, ArrowDown, plus the try-on set (Download, FlipHorizontal2, ImageUp, Move, RefreshCw, SwitchCamera).

Conventions:
- **Thin strokes:** `strokeWidth={1.3}` (46) or `{1.4}` (32); `1.2`, `1.5` and `1.6` occasionally.
- **Sizes:** 13–14 inline with text; 16–20 for buttons and nav (Header icons are 20); 22–40 for hero and empty states.
- **Colour:** icons inherit `currentColor` or take `text-[var(--gold-vermeil)]` as an accent.

## 7. Imagery

- **Catalog images:** `img(id, w = 1600)` → `https://images.unsplash.com/{id}?auto=format&fit=crop&w=1600&q=80` (the `IMG` map in `src/data/catalog.ts`).
- **Films and review media:** Mixkit placeholders (`src/data/media.ts`).
- **Image boxes:**
  - Images always sit in a fixed-aspect box: `overflow-hidden bg-[var(--bg-silk)]` with `h-full w-full object-cover`.
  - Hover zoom is `.editorial-zoom` (scale 1.045 over 1.1 s `cubic-bezier(0.16,1,0.3,1)`) under a `.group` ancestor.
  - Scroll effects are `data-parallax` (scrubbed parallax) and `data-reveal-img` (clip-path wipe) via `useReveal`.
- **Alt text:** the primary image gets the product name; duplicates and decorative images get `alt=""`. Cards use `loading="lazy"`.

## 8. Global CSS (`src/index.css`), rule by rule

| Rule | Purpose | Used? |
|---|---|---|
| `@import url(Google Fonts)`, `@import 'tailwindcss'` | Fonts, then Tailwind v4 | yes |
| `@source not "../.claude"` | Keeps the `.claude/` knowledge base out of Tailwind's class scan | yes |
| `@layer base { :root {tokens}; html {bg, color, font, smoothing}; ::selection }` | Tokens and base styles | yes |
| `.font-serif-editorial`, `.font-spec` | Font utilities (unlayered): Baskervville with lining figures; Jost with lining tabular figures | yes |
| `.grain-overlay` | Static radial-dot texture | **unused** |
| `::-webkit-scrollbar*` | Hairline scrollbar | yes |

| `.editorial-zoom` + `.group:hover .editorial-zoom` | Image hover zoom | yes (13) |
| `html.lenis …`, `.lenis.lenis-smooth` | Lenis recommended CSS | yes |
| `.film-grain` + `@keyframes grainShift` | Animated grain overlay | yes (App) |
| `@media (prefers-reduced-motion: reduce)` | Stops the grain (the `Marquee` component handles reduced motion itself) | yes |
| `@keyframes fadeUp` | 16 px fade-up (used through an arbitrary `animate-[…]`, e.g. UndoToast) | yes |
| `.link-line` (+ `::before` / `::after`) | Editorial underline link | yes (13) |

## 9. Cascade quirks (important)

- **Custom classes beat utilities.** `.link-line` and the font classes are *unlayered*, so they beat Tailwind v4 utilities, which live in `@layer utilities`. To override them, use `!`-prefixed utilities (`max-sm:!hidden`, `!text-[10px]`), as `CartLineItem` does. For example, `hidden sm:inline-flex` on a `.link-line` element does not hide it.
- **Spec wins over serif.** When both font classes are on the same element, `.font-spec` is declared later and wins. That is why `<Price className="font-serif-editorial">` still renders in Jost.
- **Figure utilities need `!`.** The font classes set `font-variant-numeric`, so `oldstyle-nums` and friends only apply with `!` (the home hero's `!oldstyle-nums`).
- **Hover variants need a hover-capable device.** Tailwind v4 compiles `hover:`/`group-hover:` inside `@media (hover: hover)`, so hover-only reveals never show on touch screens. ProductCard uses explicit `[@media(hover:hover)]:` variants to keep the try-on chip visible on touch.

## 10. Extending the system (derived guidance)

- **Tokens:** reuse the 9 tokens. If a new colour is truly needed, add it as a `--token` in `:root` and consume it with `[var(--token)]` rather than raw hex. Errors stay `text-red-700`.
- **Recipes:** copy recipes from §5 rather than inventing new paddings and trackings. Keep labels at 10/11 px with 0.2–0.3em tracking, and display type light serif with one italic accent word.
- **Shape and layout:** keep corners square (`rounded-full` only for round controls). Design mobile-first and switch at `lg`.
- **New overlays:** slot them into the z-index ladder and follow the overlay checklist in the UX doc.

## Notes & gotchas

- `.grain-overlay` is dead CSS (`.font-sans-luxury` was removed on 2026-10-16). `text-red-*` is the only Tailwind palette colour in regular use.
- `outline-none` appears 18 times and there are no `focus-visible:` styles anywhere. Focus is shown only through border-colour changes on some inputs.
- `text-[var(--text-linen)]` (#A39C91) on travertine has low contrast (about 2.6:1). It is used widely for meta text and placeholders; see the UX doc.

## Related docs

- [motion-and-interaction.md](motion-and-interaction.md) — animation tokens and timings
- [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md) — overlay checklist, focus and contrast
- [components/global-and-shared.md](components/global-and-shared.md) — Price, ProductCard, SectionHeader APIs
- [brand-voice-and-copy.md](brand-voice-and-copy.md) — typographic characters in copy
- [code-conventions.md](code-conventions.md) — how classes are composed in JSX
