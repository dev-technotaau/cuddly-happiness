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
4. Put `data-lenis-prevent` on every scrollable inner region.
5. If the open state lives in the store or a provider, every link inside must call close. Route changes don't close overlays.
6. Remember that `addToCart` opens the cart drawer (`z-[90]`). From a higher overlay it opens *underneath*.

Render with `createPortal(…, document.body)` when the overlay lives deep in the tree (VideoViewer, Reviews).

## Controls

- **Icon-only buttons** need an `aria-label`.
- **Toggles and selected swatches/pills** need `aria-pressed`. Tabs use `role="tablist"`, `role="tab"` and `aria-selected`. Disclosures use `aria-expanded`.
- **Buttons inside a product-card `<a>`** must be `type="button"` and call `e.preventDefault()` and `e.stopPropagation()`, as `WishButton` and `TryOnButton` do.
- **Touch targets:** primary round controls are `h-11 w-11` (44 px). Don't make essential content hover-only, because Tailwind v4 hover never fires on touch devices.
- **Focus:** if you write `outline-none`, add a visible focus state (`focus:border-[var(--text-espresso)]`, the gold underline, or a `focus-visible:` ring). Don't remove focus without a replacement.

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

`--gold-vermeil` (2.8:1) and `--text-linen` (2.6:1) on travertine fail WCAG AA for body text. Use them for accents, meta text and large display type, not for essential small text.
