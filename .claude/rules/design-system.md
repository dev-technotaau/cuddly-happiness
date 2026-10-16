---
paths:
  - "src/**/*.tsx"
  - "src/index.css"
---

# Design system rules (UI work)

Full reference: `.claude/docs/design-system.md`. Motion details are in `.claude/docs/motion-and-interaction.md`.

## Colour

Use only the 9 tokens, through arbitrary values such as `bg-[var(--bg-silk)]`. Never write raw hex in components.

| Token | Hex | Use for |
|---|---|---|
| `--bg-travertine` | #FBF9F5 | Page background |
| `--bg-silk` | #F3EFE6 | Alternate bands and image placeholders |
| `--bg-vault` | #121110 | Dark sections and overlays |
| `--text-espresso` | #141311 | Ink and primary fills |
| `--text-taupe` | #6E685F | Body text |
| `--text-linen` | #A39C91 | Meta text and placeholders |
| `--gold-vermeil` | #B89047 | Accent on light backgrounds |
| `--gold-champagne` | #D4B982 | Accent on dark backgrounds |
| `--border-hairline` | #E6E0D4 | 1 px rules |

- **New colour?** Add a `--token` to `:root` in `src/index.css` and consume it with `[var(--token)]`.
- **Dark sections:** `bg-[var(--bg-vault)] text-[var(--bg-travertine)]`, with champagne accents and `text-white/60` body text. Borders are `border-white/10`, `/15` or `/20`.
- **Errors:** use `text-red-700`, the only palette colour in regular use.

## Type

Two families, plus a script for engraving only (strategy: `.claude/docs/design-system.md` §2):
- **Display serif, Baskervville:** `font-serif-editorial`. Headlines, product names, the wordmark. Figures are lining; a headline can opt into old-style with `!oldstyle-nums`.
- **Text sans, Jost:** the default font for body and UI text; no class needed.
- **Spec face, Jost with lining tabular figures:** `font-spec`. Eyebrows, labels, prices, specs, counters.
- **Pinyon Script:** only the engraving "Script" option. Don't add families, and don't bring back Cormorant, Plus Jakarta Sans or a monospace.

Recipes:
- **Eyebrow:** `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]`.
- **UI label:** `text-[11px] uppercase tracking-[0.22em]`.
- **Button label:** `text-[11px] font-medium uppercase tracking-[0.24em]`–`[0.28em]`.
- **Body:** `leading-relaxed text-[var(--text-taupe)]`.
- **Headlines:** light serif with one italic accent word, `<em className="text-[var(--gold-vermeil)]">…</em>` (champagne on dark). Section titles use `<SectionHeader index eyebrow title aside tone />`.
- **Money:** always `<Price amount={…} />`. It always renders in the spec face, even if you pass `font-serif-editorial`. Restyle the currency code with `[&_span]:…`.
- **Wordmark:** tracked capitals with a gold italic ampersand. Copy it from `Header.tsx`; never restyle it per page.

## Layout

- **Container:** `mx-auto max-w-[1600px] px-6 lg:px-12`.
- **Section padding:** `py-28 lg:py-36`. Heroes use `py-20 lg:py-28`.
- **Breakpoints:** mobile-first. `lg:` is the desktop switch and `sm:` is secondary. `md:` is rarely used and `xl:`/`2xl:` never.
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
| StickyBar | `z-40` |
| Back-to-top | `z-[45]` |
| Header | `z-50` |
| Film grain | 60 |
| Mobile menu | `z-[70]` |
| Cart backdrop / drawer | `z-[80]` / `z-[90]` |
| Lightboxes | `z-[95]` |
| Modals and viewers | `z-[100]` |
| Try-on studio | `z-[110]` |

## Motion

- **Easing:** `expo.out` in GSAP, `ease-[cubic-bezier(0.16,1,0.3,1)]` in CSS.
- **Durations:** `duration-500` or `duration-700`.
- **Scroll entrances:** `data-reveal="<delay s>"`, `data-reveal-img` and `data-parallax` inside a root that calls `useReveal(ref)`.
- **Reduced motion:** guard every new GSAP animation with `prefers-reduced-motion`.

## Cascade quirks

- `.link-line` and the font classes are unlayered, so they beat Tailwind utilities. Override them with `!` utilities, e.g. `max-sm:!hidden`, and `!oldstyle-nums` for figures.
- Tailwind v4 `hover:`/`group-hover:` apply only on hover-capable devices. Never hide essential content behind hover.
