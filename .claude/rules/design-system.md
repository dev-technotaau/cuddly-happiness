---
paths:
  - "src/**/*.tsx"
  - "src/index.css"
---

# Design system rules (UI work)

Full reference: `.claude/docs/design-system.md`. Motion details are in `.claude/docs/motion-and-interaction.md`.

## Colour

Use only the 10 tokens, through arbitrary values such as `bg-[var(--bg-silk)]`. Never write raw hex in components.

| Token | Hex | Use for |
|---|---|---|
| `--bg-travertine` | #FBF9F5 | Page background |
| `--bg-silk` | #F3EFE6 | Alternate bands and image placeholders |
| `--bg-vault` | #121110 | Dark sections and overlays |
| `--text-espresso` | #141311 | Ink and primary fills |
| `--text-taupe` | #6E685F | Body text |
| `--text-linen` | #A39C91 | Decorative and inactive text, dimmed hover states, text on dark grounds. Never small text on light grounds (2.6:1) |
| `--gold-vermeil` | #B89047 | Accent on light backgrounds: italic headline accents, icons, rules, dots, underlines. Never small text (2.8:1) |
| `--gold-champagne` | #D4B982 | Accent on dark backgrounds |
| `--border-hairline` | #E6E0D4 | 1 px rules |
| `--gold-ink` | #846529 | Small gold text on light grounds: eyebrows, step and section numbers, small labels, the bag badge. AA on travertine (5.2:1) and silk (4.7:1) (2026-10-21) |

- **New colour?** Add a `--token` to `:root` in `src/index.css` and consume it with `[var(--token)]`.
- **Dark sections:** `bg-[var(--bg-vault)] text-[var(--bg-travertine)]`, with champagne accents and `text-white/60` body text. Borders are `border-white/10`, `/15` or `/20`.
- **Errors:** use `text-red-700`, the only palette colour in regular use.
- **Small text** (under 24 px, or under 18.7 px bold) on light grounds is espresso, taupe or gold-ink, never linen or vermeil, so it meets WCAG AA (4.5:1). On dark grounds use travertine, `text-white/60` or more, champagne or linen. Numbers are in the UX rule, "Contrast" (swept 2026-10-21).

## Type

Two families, plus a script for engraving only (strategy: `.claude/docs/design-system.md` §2):
- **Display serif, Baskervville:** `font-serif-editorial`. Headlines, product names, the wordmark. Figures are lining; a headline can opt into old-style with `!oldstyle-nums`.
- **Text sans, Jost:** the default font for body and UI text; no class needed.
- **Spec face, Jost with lining tabular figures:** `font-spec`. Eyebrows, labels, prices, specs, counters.
- **Pinyon Script:** only the engraving "Script" option. Don't add families, and don't bring back Cormorant, Plus Jakarta Sans or a monospace.

Recipes:
- **Eyebrow:** `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]` on light grounds, `text-[var(--gold-champagne)]` on dark (`eyebrow` in `src/components/ui.ts`). A section number beside it is gold-ink too, its label taupe.
- **UI label:** `text-[11px] uppercase tracking-[0.22em]`.
- **Button label:** `text-[11px] font-medium uppercase tracking-[0.24em]`–`[0.28em]`.
- **Body:** `leading-relaxed text-[var(--text-taupe)]`.
- **Headlines:** light serif with one italic accent word, `<em className="text-[var(--gold-vermeil)]">…</em>` (champagne on dark). Section titles use `<SectionHeader index eyebrow title aside tone />`.
- **Buttons** (2026-10-21): use the recipes in `src/components/ui.ts` (`btnPrimary`, `btnVisit`, `btnQuiet`, `btnOnDark`, `btnVisitOnDark`) and `VisitButton` for every "Book a visit". A visit paired with a primary action has the primary's size.
- **Focus:** a global `:focus-visible` ring (1 px vermeil) covers links, buttons and sliders; fields that use `outline-none` show focus with their underline.
- **Money:** always `<Price amount={…} />`. It always renders in the spec face, even if you pass `font-serif-editorial`, and never wraps between the amount and its code (`whitespace-nowrap`, 2026-10-22). Restyle the currency code with `[&_span]:…`.
- **Wordmark:** lightly tracked capitals (0.08em, the compact lockup, owner 2026-10-22) with a gold italic ampersand. Copy it from `Header.tsx`; never restyle it per page.

## Layout

- **Container:** `mx-auto max-w-[1600px] px-6 lg:px-12`.
- **Section padding:** `py-28 lg:py-36`. Heroes use `py-20 lg:py-28`.
- **Breakpoints:** mobile-first. `lg:` is the desktop switch and `sm:` is secondary. `md:` is rarely used; `xl:` (1280 px) only where the desktop header returns to full size; `2xl:` never.
  - Never write an arbitrary `min-[…px]:` variant on a property that also has an `sm:`/`lg:` class on the same element: Tailwind v4 emits arbitrary breakpoints *before* the theme ones, so they silently lose (the header's 1280 px sizes did, 2026-10-21). Use a theme breakpoint, or a `max-[…px]:` range that never overlaps.
- **No sideways scroll, ever** (2026-10-21). Nothing may stick out past the page edge at any width (check 320, 390, 1024, 1280 and 1440 px, with real scrollbars, during the first load too). Decorations that bleed (a rotated card, a badge) stay inside the gutter on phones; long display words must fit 320 px (`wrap-anywhere` on tile headings guards the fallback font). Pinned sections measure their own width, never `window.innerWidth` (it counts the scrollbar).
- **Grids:** asymmetric `lg:grid-cols-12` with col-span/col-start. For hairline grids, use `grid gap-px bg-[var(--border-hairline)]` with a background on each cell.
- **Aspect boxes:** imagery `aspect-[4/5]`, films `aspect-[9/16]`, gift cards `aspect-[1.586]`. Images are `h-full w-full object-cover` on `bg-[var(--bg-silk)]`, and hover zoom is `.editorial-zoom` inside a `.group`.

## Shape & depth

- Corners are square. Use `rounded-full` only for round icon buttons, counters, dots, swatches and chips.
- Use 1 px hairline borders. Hover and active states darken to `border-[var(--text-espresso)]`.
- Shadows are rare, soft, custom `shadow-[…]` values. Never use Tailwind preset shadows.

## Icons

- Use `lucide-react` only.
- `strokeWidth={1.3}` or `{1.4}`.
- Size 14 inline with text, 16–20 for controls (Header icons are 20).

## z-index ladder

Place new layers inside this ladder:

| Layer | Value |
|---|---|
| Local overlays | `z-10` |
| StickyBar (and the ring designer's phone bar) | `z-40` |
| Back-to-top, language notice (opposite corners; the notice carries `data-fab-avoid`) | `z-[45]` |
| Header (its mega menu and the search dropdown live inside it) | `z-50` |
| Film grain | 60 |
| Mobile menu, desktop menu (never together) | `z-[70]` |
| Cart backdrop / drawer; the booking drawer and "Ask a jeweller" use the same two levels (only one is ever open) | `z-[80]` / `z-[90]` |
| Lightboxes | `z-[95]` |
| Modals and viewers | `z-[100]` |
| Try-on studio | `z-[110]` |
| Skip link (while focused) | `z-[120]` |
| Page transition (veil and curtain / seam / clone); the language veil shares `z-[125]` and never runs at the same time | `z-[125]` / `z-[126]` / `z-[127]` |
| Splash | `z-[130]` |

## Motion

- **Easing:** `expo.out` in GSAP, `ease-[cubic-bezier(0.16,1,0.3,1)]` in CSS.
- **Durations:** `duration-500` or `duration-700`.
- **Scroll entrances:** `data-reveal="<delay s>"`, `data-reveal-img` and `data-parallax` inside a root that calls `useReveal(ref)`.
- **Reduced motion:** guard every new GSAP animation with `prefers-reduced-motion`.
- **Entrances wait for the stage.** A mount-time GSAP entrance builds inside `onStageClear()` (`src/lib/stage.ts`), as `useReveal` does, so it plays as the splash or a page transition uncovers the page.

## Cascade quirks

- `.link-line` and the font classes are unlayered, so they beat Tailwind utilities. Override them with `!` utilities, e.g. `max-sm:!hidden`, and `!oldstyle-nums` for figures.
- Tailwind v4 `hover:`/`group-hover:` apply only on hover-capable devices. Never hide essential content behind hover.
