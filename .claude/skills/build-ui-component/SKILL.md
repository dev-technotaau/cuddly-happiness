---
name: build-ui-component
description: Build or restyle a UI component, modal, drawer, form or visual treatment in the Teresa & Sons house style (tokens, type recipes, square corners, hairlines, lucide icons, GSAP reveal, accessible overlays). Use for any new component or visual change in src/.
argument-hint: "[component description]"
---

# Build a UI component in house style

Background: `.claude/docs/design-system.md` §5 has the verbatim class recipes. `.claude/rules/design-system.md`, `ux-and-accessibility.md` and `code-style.md` load automatically when you touch `src/**/*.tsx`.

## 1. Place and shape the file

- **Location:**
  - `src/components/<surface>/<Name>.tsx` for feature pieces (`home`, `pdp`, `cart`, `tryon`, `video`, `giftcard`).
  - `src/components/<Name>.tsx` for pieces shared across pages.
- **Shape:** default-export function component. Small components type their props inline; larger ones declare `interface Props`. Accept `className = ''` and append it last.
- **State:** read app state through `useStore()` (currency, `addToCart`, wishlist…). Never touch localStorage.

## 2. Compose from existing recipes

Don't invent new values. Take them from the recipe table.

- **Type:**
  - Eyebrow: `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]`.
  - Label: `text-[11px] uppercase tracking-[0.22em]`.
  - Serif title: `font-serif-editorial … font-light`, with an `<em className="text-[var(--gold-vermeil)]">` accent word.
  - Body: `leading-relaxed text-[var(--text-taupe)]`.
- **Buttons:**
  - Primary: `bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]`.
  - Outline: TryOnButton `outline`.
  - On dark backgrounds: champagne solid.
  - Text link: `link-line`.
- **Inputs:**
  - Boxed (GiftCards `input`) or underline (Account `field`).
  - Selection tiles use the `choice(on)` recipe; segmented toggles use the espresso active fill.
- **Words:** declare every visible string, aria-label and alt text in a module-level `const COPY = bilingual({ …en }, { …fr })` and read it with `useCopy(COPY)`. Name languages in their own words with a `lang` attribute. Product names, metals and badges come from `useCatalog()`.
- **Money and pictures:**
  - Money goes through `<Price amount={…} />`.
  - Images sit in an `overflow-hidden bg-[var(--bg-silk)]` aspect box, `h-full w-full object-cover`, with `.editorial-zoom` inside a `group`.
- **Shape and icons:** square corners and 1 px `border-[var(--border-hairline)]`. Lucide icons at `strokeWidth={1.3}`, size 14–20.
- **Motion:**
  - Reveal with `data-reveal="<delay>"` inside a `useReveal` root.
  - Custom GSAP goes in `useLayoutEffect` with `gsap.context`, `expo.out`, and a reduced-motion bail-out.
  - CSS transitions use `duration-500`/`duration-700` with `ease-[cubic-bezier(0.16,1,0.3,1)]`.

## 3. Overlays (modal, drawer, lightbox, viewer)

Follow the checklist in `.claude/rules/ux-and-accessibility.md`:
1. Take a z-index from the ladder.
2. Call `getLenis()?.stop()` and lock overflow.
3. Close on Escape, and undo all of the above on cleanup.
4. Add `role="dialog" aria-modal="true" aria-label`.
5. Put `data-lenis-prevent` on the overlay's scrollable regions. A horizontal rail on a page takes `data-lenis-prevent-horizontal` and `overscroll-x-contain` instead (UX rule, "Smooth scrolling").
6. Close on any inner link.
7. Use `createPortal` when the overlay is rendered deep in the tree.

## 4. Accessibility minimums

- Icon buttons have an `aria-label`. Toggles have `aria-pressed`. Disclosures have `aria-expanded`.
- Errors render in `role="alert"` with `text-red-700`.
- Anything you mark `outline-none` gets a visible focus state.
- Buttons inside card links use `type="button"` plus `preventDefault()`/`stopPropagation()`.
- Nothing essential is hover-only.

## 5. Check it

1. Run `npx tsc --noEmit -p .`.
2. Run skill `verify-changes` at 375 px and 1440 px, in both currencies, in French (longer strings must not overflow), and with reduced motion if you added animation.
3. Ask the `design-reviewer` agent to review the diff for token, recipe and a11y drift.
4. If the component introduces a reusable recipe, add it to `.claude/docs/design-system.md` §5 (skill `update-knowledge-base`).
