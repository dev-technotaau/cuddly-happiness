---
name: add-product
description: Add, rename, reprice or reconfigure a catalog product (jewellery piece, rental, personalized item, watch, made-to-order) in src/data/catalog.ts and wire up everything that depends on it. Use when asked to add or change a product or its options.
argument-hint: "[product name or slug]"
---

# Add or change a catalog product

Background: `.claude/docs/data-model.md` lists every product, type and helper. Grep it for `PRODUCTS` or the product's slug and read only that part. The money rules are in `.claude/rules/commerce-and-data.md`.

## Steps

1. **Identity** (in `PRODUCTS`, `src/data/catalog.ts`):
   - `id: 'tns-<code>-NNN'`: take the next free number for the code (nk necklaces, er earrings, br bracelets, rg rings, bd bridal, wt watches, rn rentals, gf gifts, cs custom).
   - `slug`: kebab-case and stable, because it becomes the Shopify handle.
   - `category`: a `CategorySlug`.
   - `collection`: by convention a Montréal place (Mont-Royal, Westmount, Outremont…).
2. **Copy** (house voice; skill `write-brand-copy`):
   - `name`.
   - `tagline`: one short declarative sentence ending in a period.
   - `description`: one or two sentences.
   - `specs`: a `Record<string, string>` using `ct`, `mm`, `in` and `g`, with `–` for ranges.
   - **French:** add the slug to `PRODUCT_FR` in `src/data/catalog.fr.ts`: `name` (French word order, place name last: `Pendentif solitaire Mont-Royal`), `tagline`, `description`, `specs` keyed by the **English** spec labels with French values (`1,1 mm`, `16 po`), optional `collection` and `personalization`. A new spec label also needs `SPEC_LABEL_FR`; a new badge `BADGE_FR`; a new metal `METAL_FR`. Canadian English is the source; US spelling is derived.
3. **Price:** `price: p(CAD)` derives USD as CAD × 0.73 rounded to the nearest $5. Use `p(CAD, USD)` to set USD explicitly. Amounts are whole units.
4. **Metals:** order matters.
   - `metals[0]` is the PDP default and the metal used by every quick-add.
   - A platinum-first list makes the PDP open +650 CAD (+475 USD) above the card price.
   - Reuse `GOLDS`/`BRIDAL_METALS` (spread them to extend).
   - An empty list is allowed only for the gift card.
5. **Images:** use `IMG.<key>`. Add new Unsplash ids to `IMG` with `img('photo-…')`.
   - `images[0]` is the card and gallery lead.
   - `images[1]` is the card hover image.
6. **Optional fields:**
   - `badges`: only the first one shows on cards. Values: `'New' | 'Bestseller' | 'Atelier Exclusive' | 'Limited' | 'Made to Order'`.
   - `gia`: a full `GiaSpec`.
   - `engravable`.
   - `leadTimeWeeks`: made to order.
   - Rentals: `category: 'rentals'` plus `rental: rental(weekend, week, month, deposit)`, all in CAD.
   - `personalization`: a `PersonalizationConfig` with `kind`, `label`, `hint`, `minLength`, `maxLength`, `allowed` (a RegExp character-class body), `fonts`, and optionally `accent`, `chainLengths`, `backEngraving`.
7. **Name-based behaviour:** check these after naming the product, because they match on the name:
   - `tryOnKind(p)`: whether it can be tried on, and how it is drawn.
   - `mediaPoolFor(p)`: which review media pool it uses.
   - `JewelryOverlay` drawing details.
   - Costing findings in `src/data/costing.ts`.
8. **Cross-links** (optional):
   - Tag the slug in `VIDEOS` (`src/data/media.ts`) so it appears in the film rails.
   - Add it to the `PAIRS` tables in `src/components/pdp/CompleteTheLook.tsx` and `src/components/cart/CartUpsell.tsx`.
9. **Configuration-requiring pieces** (ring size, personalization, rental dates, commissions): make sure the quick-add surfaces route them to the PDP. These are Wishlist "Add all", CompleteTheLook, VideoViewer, CartUpsell and TryOnStudio.
10. **New category?** Add it to the `CategorySlug` union and `CATEGORIES`, with a French name, the next roman numeral, a description, and hero/feature images, plus a `CATEGORY_FR` entry (`name`, `accent` line, `description`). Then check that the Header mega menu, Footer and home CategoryIndex still lay out in both languages.
11. **Verify:** run skill `verify-changes`. Open `#/c/<category>` and `#/p/<slug>` in CAD and USD, and in French (`#/fr/p/<slug>`), and check the card price against the PDP opening price.
12. **Docs:** run skill `update-knowledge-base`. The product table in `.claude/docs/data-model.md` must list the new row.
