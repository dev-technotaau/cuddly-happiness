---
name: add-cart-option
description: Add or change a configurable option that travels with a cart line (e.g. chain length, band width, gift box, a new personalization add-on) or an order-level option (gift wrap-style toggles), keeping lineKey, pricing, bag/checkout display and the Shopify mapping in sync. Use for any change to what a cart line or the cart carries.
argument-hint: "[option name]"
---

# Add a cart-line or order-level option

Background: `.claude/docs/commerce-logic.md` (formulas) and `.claude/rules/commerce-and-data.md` (the identity checklist). If you miss a step, different configurations merge into one bag line, `inBag` lies, or prices diverge between the PDP, bag and checkout.

## A. Per-line option (configured on the PDP)

1. **Data**:
   - If the option is product-specific, add it to `Product` or `PersonalizationConfig` in `src/data/catalog.ts` and set it on the relevant products.
   - If it is priced, give its price in CAD and convert with `toUSD` (nearest $5).
2. **PDP state** (`src/pages/Product.tsx`):
   - Add `useState` *above* the not-found early return, initialised from `product`. The page remounts per slug.
   - Add a step id to `steps` in render order, and render a fieldset whose legend uses `stepLabel`/`stepNum` and `stepNo(id)`.
   - If the step is required, wrap it in `<div id="step-…">`, add an error flag, gate it in `handleAdd`, add its id to the scroll-target chain, and clear the flag in the step's `onChange`. Never disable the CTA.
3. **Identity**:
   - Add the field to `CartLine` **and** to the `lineKey` join in `src/store.tsx`.
   - Keep property order stable. Store `undefined` rather than `false` or empty values, so identical configurations still stack.
4. **Payload**: add the field to `configured` in `Product.tsx`. It feeds both `addToCart` and `inBag`. Trim user text (`value.trim() || undefined`).
5. **Price** (if it changes the price), update all four together:
   - `linePrice` (store)
   - `fullPrice` in `src/components/cart/CartLineItem.tsx`
   - `amount` in `Product.tsx`
   - `buildCostBreakdown` in `src/data/costing.ts`
6. **Display**: add a human-readable string in `lineDetails()` (`src/components/lineDetails.ts`). The bag lists one string per `<li>`; checkout joins them with ` · `. If the StickyBar should show it, append it to the StickyBar `detail`.
7. **Quick-add paths**: if the option is *required*, make Wishlist "Add all", CompleteTheLook, VideoViewer, CartUpsell and TryOnStudio route such products to the PDP instead of adding them.
8. **Shopify**:
   - Decide whether the option is a variant option or a line-item property.
   - Line-item properties are strings. Prefix merchant-only ones with `_`.
   - Record the decision in `.claude/docs/shopify-integration.md`. Don't write integration code: this repo is a UI prototype (see `.claude/rules/project.md`).

## B. Order-level option (whole cart)

1. Add the field to `CartMeta` **and** `DEFAULT_META` in `src/store.tsx`. Stored meta is merged over the defaults, and `clearCart()` resets it.
2. Render it in `src/components/cart/GiftOptions.tsx` with the local `toggle(on, label, desc, Icon, onChange)` helper calling `setMeta({ field: v })`. Text fields are limited by slicing, with a visible counter.
3. Show it in the Cart summary (`src/pages/Cart.tsx`, via the `row(...)` helper) and, if needed, in the drawer footer.
4. Shopify, shape only: note which cart `note`/`attributes` key it would map to in `.claude/docs/shopify-integration.md`. Don't build the integration.

## Verify

1. Run `npx tsc --noEmit -p .`.
2. In the browser, add the same configuration twice: it must stack. Add a different one: it must create a new line. Toggle the option on and then off: it must still stack with an untouched configuration. Check the price on the PDP, in the drawer, on the cart page and at checkout, in both currencies.
3. Optionally have the `commerce-auditor` agent review the diff.
4. Run skill `update-knowledge-base` (`commerce-logic.md`, `pages/product.md`, `pages/cart-and-checkout.md`).
