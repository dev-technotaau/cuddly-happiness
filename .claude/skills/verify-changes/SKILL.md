---
name: verify-changes
description: Verify a change in this repo before calling it done. Runs the typecheck and production build, then checks the affected routes in the browser in both currencies at mobile and desktop widths. Use after editing code in src/ or config.
---

# Verify a change

Report honestly what you verified and what you could not. Never run `pnpm run format` or oxfmt (they corrupt the code).

## 1. Static checks (always)

1. `npx tsc --noEmit -p .`: must report **0 errors**. `vite build` does not typecheck.
2. `pnpm run build`: must succeed.
   - Compare chunk sizes with the 2026-10-15 baseline: main JS 610.47 kB (184.26 kB gzip), lazy TryOnStudio 22.40 kB, CSS 78.58 kB.
   - Flag a growth of more than about 10%.
   - `dist/` is gitignored, so it can stay.

## 2. Runtime check (UI or behaviour changes)

1. **Dev server:**
   - In Figma Make it is already running on `$PORT`.
   - Locally, start `pnpm dev` in the background and open `http://localhost:8443/#/`.
   - `strictPort` is on. If 8443 is busy, run with another `PORT` (PowerShell: `$env:PORT = '5173'; pnpm dev`).
2. **Routes:** open the affected ones directly.

   | Page | Hash |
   |---|---|
   | Home | `#/` |
   | Category | `#/c/<slug>` (necklaces, earrings, bracelets, rings, bridal, watches, rentals, gifts, custom) |
   | Product | `#/p/<slug>` |
   | Cart | `#/cart` |
   | Checkout | `#/checkout` |
   | Gift cards | `#/gift-cards` |
   | Wishlist | `#/wishlist` |
   | Account | `#/account` |
   | Atelier | `#/atelier` |

3. **What to check:**
   - Both languages and both markets, using the Header language and market menu (`EN · CAD` ▾): English (Canada), English (United States) and Français. French addresses start `#/fr/` (`#/fr/p/<slug>`). Look for overflowing French labels, untranslated strings and prices in the right format (`$1,250` / `1 250 $`).
   - Widths around 375 px (below `lg`) and 1440 px.
   - The browser console has no errors.
   - Animated changes also work with reduced motion: Lenis and the reveals switch off and the content must still be visible.
   - Commerce changes: add to bag, check the drawer, `#/cart` and `#/checkout` totals, then reload. State persists in localStorage under `tns-*`.
   - Overlay changes: Escape closes it, page scroll is locked and restored, links inside close the overlay, and the z-order is right.
4. **Clean slate:** for a clean test, clear the `tns-*` keys in DevTools → Application → Local Storage.

## 3. Report

Say which checks ran and their results (tsc error count, build pass/fail and sizes, routes and widths viewed). Name anything you could not verify, such as no browser available or camera features.
