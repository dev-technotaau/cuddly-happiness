---
paths:
  - "src/**/*.tsx"
---

# UX & accessibility rules

Full reference: `.claude/docs/ux-patterns-and-accessibility.md`.

## Overlays

Drawers, modals, lightboxes and viewers follow the established checklist:

1. Pick a level from the z-index ladder (see the design-system rule).
2. On mount: `getLenis()?.stop()`, lock overflow, and add a `window` keydown handler so Escape closes. Undo all three on cleanup.
3. Give the overlay `role="dialog" aria-modal="true"` and an `aria-label`.
4. Put `data-lenis-prevent` on every scrollable inner region of the overlay.
5. If the open state lives in the store or a provider, every link inside must call close. Route changes don't close overlays.
6. Remember that `addToCart` opens the cart drawer (`z-[90]`). From a higher overlay it opens *underneath*.

Render with `createPortal(…, document.body)` when the overlay lives deep in the tree (VideoViewer, Reviews).

The mobile menu (`Header`) is a dialog too (2026-10-21): `role="dialog"`, focus moves in as it opens (its search field when opened from the search button), Escape first clears the search, then closes, and closing by hand returns focus to the button that opened it.

## Smooth scrolling (Lenis)

- **Horizontal rails on a page** take `data-lenis-prevent-horizontal` and `overscroll-x-contain`: Lenis keeps the vertical wheel smooth over them, and a sideways swipe scrolls the rail natively (without carrying over into the page, which on a Mac can swipe back a page). Never `data-lenis-prevent` or `data-lenis-prevent-wheel` on a page section: they hand every wheel turn over it to the browser, so smooth scrolling turns stepped and fights Lenis as the pointer crosses it (the glitch fixed 2026-10-21 on the phone rail of Most treasured, the films, the Three generations timeline, the making strip on phones and the Shop all chapter strip).
- **Scroll the page with Lenis** (`getLenis()?.scrollTo(…)`, falling back to `window.scrollTo` only without it). A native `window.scrollTo` while Lenis is animating is overridden on the next frame.
- **Pinned sections and scrollbars:** a scrollbar that appears without a resize (the splash or an overlay releasing the page) makes the page narrower; `SmoothScroll` watches a zero-height line across the page and calls `ScrollTrigger.refresh()` before the next paint, so a pin never ends up wider than the page (the first-load horizontal scrollbar on Home, fixed 2026-10-21). Overlays keep locking scroll with `overflow: hidden` as before.

## Controls

- **Icon-only buttons** need an `aria-label`.
- **Toggles and selected swatches/pills** need `aria-pressed`. Tabs use `role="tablist"`, `role="tab"` and `aria-selected`. Disclosures use `aria-expanded`.
- **Buttons inside a product-card `<a>`** must be `type="button"` and call `e.preventDefault()` and `e.stopPropagation()`, as `WishButton` and `TryOnButton` do.
- **Touch targets:** primary round controls are `h-11 w-11` (44 px). Don't make essential content hover-only, because Tailwind v4 hover never fires on touch devices.
- **Focus:** a global `:focus-visible` ring covers controls (2026-10-21). If you write `outline-none`, add a visible focus state (`focus:border-[var(--text-espresso)]`, the gold underline, or a `focus-visible:` ring). Don't remove focus without a replacement.
- **Choice chips** (filters, visit reasons, times) are buttons with `aria-pressed` inside `role="group"` with a label; Own | Rent is a `radiogroup`; a drag handle is `role="slider"` with arrow, Home and End keys (`SketchToRing`).
- **Skip link:** `App.tsx`'s "Skip to content" button must stay the first focusable element on every page. It focuses `<main>` in code; never turn it into a `#main` link (the hash router would treat it as a route).
- **Page changes:** `PageTransition` moves focus to `<main>` and announces the title after each navigation. Pages shouldn't move focus on mount themselves.

## Languages

- Name each language in its own words and tag it with `lang` (`<button lang="fr">Français</button>`), as `LanguageToggle` and `LocaleMenu` do. Never use flags.
- Text in the other language (a review's original, a bilingual notice) carries its own `lang`.
- A language switch keeps focus, scroll position and every open overlay, and is announced in the new language (`LanguageVeil`). Don't reset state or move focus when the language changes.

## Fixed UI at the bottom edge

- `BackToTop` (`src/components/BackToTop.tsx`, `z-[45]`: above the StickyBar, below the header and its mobile menu) floats bottom-right on every page.
- Any fixed or sticky element at the bottom of the viewport (bars, toasts, docks) must carry `data-fab-avoid`. The button then lifts smoothly above it. The PDP StickyBar and the footer legal row already do.
- Don't put another floating control in the bottom-right corner without checking it against the back-to-top button.

## Validation & feedback

- **PDP pattern:**
  - Never disable the CTA. On click, set every error flag and scroll to the first failing step (`step-dates` → `step-personal` → `step-size`, offset -140).
  - Clear each flag in its step's `onChange`.
  - Keep these DOM ids stable: `step-dates`, `step-personal`, `step-size`, `price-breakdown`, `reviews`.
- **Form errors** are announced: render them in `role="alert"`, and put async results in `aria-live="polite"`. Errors use `text-red-700`.
- **Text limits** are enforced by slicing in `onChange`, with a visible `{n}/{max}` counter.
- **Confirmations** ("Added to bag", "Merci…") use short timers. Clear those timers on unmount.
- **Undo:** user removals go through `removeLine` so `UndoToast` (6 s) can undo them.

## Motion & media

- **Reduced motion:** guard every GSAP animation with `matchMedia('(prefers-reduced-motion: reduce)')`. For new CSS animations, add `motion-reduce:` variants.
- **Video:** autoplay only muted, with `playsInline`. Use `useInViewPlay` for tiles, since it pauses off-screen and is disabled under reduced motion.
- **Images:** the primary product image gets `alt={product.name}`. Decorative and duplicate images get `alt=""`, and decorative SVG gets `aria-hidden`.

## Contrast

- Small text (under 24 px, or under 18.7 px bold) needs 4.5:1; large text 3:1. On travertine / silk: espresso 17.7 / 16.2, taupe 5.2 / 4.8 and gold-ink 5.2 / 4.7 pass; linen 2.6 / 2.4 and vermeil 2.8 / 2.6 fail, so they never carry small text. On vault: champagne 9.9, linen 6.9 and `text-white/60` 7.2 pass; `text-white/45` (4.6) is the floor and `/40` fails.
- Placeholders follow the same rule: taupe on light grounds, `placeholder:opacity-60` where one field serves both grounds.
- Swept 2026-10-21 by measuring every visible text on every page and overlay at desktop and phone widths: no small text fails. Still open (KI-045): the large italic accents in vermeil measure 2.81:1 on travertine and 2.57:1 on silk, under 3:1; the brand gold 8% darker (#A98441) would pass. That is the owner's decision; the wordmark is a logotype and exempt.
