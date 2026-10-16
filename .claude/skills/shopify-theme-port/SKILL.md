---
name: shopify-theme-port
description: Plan or implement porting this React prototype to a Shopify Online Store 2.0 theme (Liquid templates and sections, metafields and metaobjects, Ajax cart), or wire parts of it to a live Shopify store. Invoke explicitly with /shopify-theme-port.
disable-model-invocation: true
argument-hint: "[page, feature or 'plan']"
---

# Shopify theme port / integration

> **Scope.** This repo is the theme's UI prototype. Use this skill to *plan and document* the future theme build. Write integration code (API calls, live cart wiring, real accounts) only when the owner explicitly asks for it in this repo.

Primary reference: `.claude/docs/shopify-integration.md`. It keeps **facts** (what the code already does) separate from **recommendations** (the mapping tables). Read the section you need. Supporting docs: `commerce-logic.md`, `data-model.md` and the relevant page docs.

## What exists today (facts)

- `src/lib/shopify.ts` has `toShopifyCartItem(line)`, which builds a `/cart/add.js` item for **gift-card lines only**:
  - Fixed denominations map to the placeholder variant IDs in `GIFT_CARD_VARIANTS` (`CAD-100` … `USD-5000`).
  - Custom amounts use the $1 variant `GIFT_CARD_ONE_UNIT_VARIANT` × amount, with `_amount`.
  - Recipient fields use Shopify's native gift-card properties: `__shopify_send_gift_card_to_recipient`, `Recipient email`, `Recipient name`, `Message`, `Send on`.
  - Merchant-only properties start with `_` (`_design`, `_delivery`, `_From`).
- The output is only passed to `console.info` in `Checkout.placeOrder`. Nothing is sent. `isGiftCardLine` is unused.
- `CartMeta` (gift wrap, receipt, message, note) is documented as mapping to the cart `note`/`attributes`, but no mapper exists.
- Slugs are kebab-case and stable, and are meant to become handles. Money is whole units in the app; convert to cents only at the boundary.

## Porting workflow

1. **Scope.** Pick the page or feature and find its row in the template and section mapping tables of `shopify-integration.md`. Home sections map to theme sections; the PDP maps to `product.json` plus alternate templates (rental, personalized).
2. **Data.** Map catalog fields to products, variants and options:
   - Metal and size become variant options, or line-item properties if the size is free-form.
   - Engraving, personalization and booking become line-item properties.
   - GIA specs, personalization configs, rental rates and collection stories become metafields and metaobjects (listed in the doc).
3. **Templates.**
   - Replace `href.*` hash routes with Liquid routes (`routes.*`, `product.url`, `collection.url`).
   - Replace `<Price>` with the theme money snippet, and `useStore` state with the Ajax Cart API, `customer` and `localization`.
   - Turn hard-coded arrays into section blocks and settings.
4. **Design.** Carry the tokens (`:root` variables), fonts and class recipes over 1:1. Tailwind can stay as a compiled asset, or the recipes can become CSS classes. Keep `useReveal`/`SmoothScroll` as small JS assets (GSAP + Lenis).
5. **Things Liquid can't do natively** need an app or custom solution:
   - camera try-on (keep it as a JS island)
   - rental availability calendar (needs a booking app or backend)
   - checkout customisation (Checkout Extensibility on Plus)
   - persisted reviews, wishlist and multi-device sync (apps or metafields)
6. **Before any live call:**
   - Replace every placeholder variant ID.
   - Add a merchandise mapper next to `toShopifyCartItem`.
   - Verify how Shopify issues gift cards for the $1-unit pattern and the Markets currency conversion.
   - Remove the local ledger (`issueCards`/`debitCards`) and the demo balance flow.

## Rules that still apply

- Never rename the native gift-card property keys.
- Keep identity-bearing line fields in `lineKey` (mirrors variant + properties).
- Gift cards stay untaxed and can't buy gift cards.
- Placeholder IDs never ship.

Record decisions and new mappings in `.claude/docs/shopify-integration.md` (skill `update-knowledge-base`).
