---
paths:
  - "src/**/*"
---

# Owner decisions (from the Figma Make build history)

These are standing product decisions the owner made or accepted. Don't reverse them without asking. Background: `.claude/docs/design-intent.md`; source: `.claude/docs/history/figma-make-log.md`.

- **Prototype scope (most important).** This is the theme's design prototype. Build UI and simulated demo behaviour only, never backend or live integrations. See "Most important" in `.claude/rules/project.md`.
- **Quality bar.** Editorial luxury at senior-agency level, never generic template e-commerce. New surfaces get both a features pass and a refine/polish pass; don't stop at a bare first version.
- **Honest UI.**
  - Never show a total, label or button that does something other than what it says. Adapt the section, or hide it, instead. The precedent is the rental "Complete the look".
  - Call out invented data as placeholders: reviews, press, costs, dates, IDs. Never present it as real.
- **Rentals stay separate from purchases.**
  - Pair rentals only with rentals and total them by period rate.
  - Show the deposit as a hold, not a charge.
  - Add them to the bag as `rental` + `booking` lines.
- **Bag behaviour.**
  - Adding to the bag opens the drawer; this happens inside `addToCart`.
  - The PDP CTA and the StickyBar switch to "Go to bag" when that exact configuration is already in the bag.
- **Configuration first.** Never quick-add a piece that has required options (ring size, rental dates, personalization, commissions). Route to the PDP instead, with "Choose dates" / "Personalize this piece" / "Choose size & options" / "Select options".
- **Header.** The desktop bar is Collections · Bridal · Rentals · Atelier. Gift Cards lives in the mega menu (plus the mobile menu and footer), not in the bar.
- **Cross-cutting features go "where they suit".** Recently viewed, try-on CTAs and shoppable films appear wherever they help, and render nothing when empty. Consider them whenever you add a surface.
- **Automatic section numbering.** Number conditional sections from the list that actually renders (`sectionOrder` / `num()`), never by hand.
- **Shopify compatibility.**
  - Model commerce features on Shopify primitives: variants and options, line-item properties, cart note and attributes, native gift cards, customer accounts.
  - Compatibility means *shaped*, not integrated. Never call Shopify or build integration in this prototype. The existing `src/lib/shopify.ts` documents the payload shape only.
- **Canada + US parity.** Every price, tax, duty and shipping message must work in both currencies and markets.
- **Typography (2026-10-16).** The owner asked for calm, premium, memorable faces that carry the house's legacy, without aggressive curves.
  - Display is Baskervville (`font-serif-editorial`). Text, labels, prices and specs are Jost (`font-spec` for labels and figures). Pinyon Script is only for engraving.
  - The wordmark is tracked capitals with a gold italic ampersand.
  - Don't reintroduce Cormorant Garamond, Plus Jakarta Sans or a monospace face, and don't add families without asking.
  - Re-checked the same day against seven alternatives in blind renders. Ibarra Real Nova came closest: a more graceful italic and an "Et" ampersand, but slightly lighter, and no old-style figures through Google Fonts. The owner chose to keep Baskervville for now. If they revisit the choice, Ibarra is the first alternative to show them.
