---
name: write-brand-copy
description: Write or edit customer-facing copy for the Teresa & Sons storefront (headlines, product names, taglines and descriptions, CTAs, microcopy, errors, FAQ answers, emails) in the house voice and typography. Use whenever producing user-visible text for this project.
argument-hint: "[what the copy is for]"
---

# Write Teresa & Sons copy

Background: `.claude/docs/brand-voice-and-copy.md` (voice principles, CTA inventory, glossary). The rules in `.claude/rules/brand-and-copy.md` load automatically when you edit `src/`.

## Voice in one breath

Teresa & Sons is a Montréal family maison founded in 1962 by Teresa Moretti. Her sons and granddaughter now run the bench on rue Sherbrooke Ouest. The copy is **understated, editorial, sensory and quietly confident**. It talks about light, craft, heritage and inheritance. It never uses hype, exclamation marks or urgency tricks.

## Patterns

- **Headline:** a short serif line with one italic accent word.

  ```tsx
  <>The gift of <em className="text-[var(--gold-vermeil)]">choosing</em>.</>
  ```

  Other examples: "Made *for you*, by a family." · "Check your *balance*" · "Seen in *motion*".
- **Eyebrow:** 1–4 words, often French or numbered. Examples: `L'Atelier · Since 1962` · `Carte-cadeau` · `Solde` · `Chapter IV` · `Watch & shop`.
- **Product naming:** `<Montréal place> <piece>`. Examples: "Westmount Tennis Bracelet", "Outremont Pearl Drops", "Mile End Huggies".
- **Tagline:** one declarative sentence ending in a period. Examples: "Fifty diamonds, one unbroken line." · "Pavé, hinged, effortless."
- **Description:** one or two factual, sensory sentences with materials and setting. Example: "Elongated hand-polished links in solid gold, made to layer."
- **CTAs:** short verb phrases. Existing ones:

  | Group | Labels |
  |---|---|
  | Bag | Add to bag · Go to bag · Add all to bag |
  | Appointments | Book a viewing · Book an appointment · Request appointment · Contact concierge |
  | Configuration | Choose dates · Personalize this piece · Choose size & options · Select options · Begin commission |
  | Try-on | View on you · Try on |
  | Navigation | Explore Rings · Shop {Category} → · Clear history |

  Bag actions say "bag", never "cart".
- **Microcopy:** calm and helpful, with the reason when it helps:
  - "We couldn’t find that card. Check the number, or contact our concierge."
  - "Gift cards are not taxed at purchase and cannot be paid for with another gift card."
- **Empty states:** a gentle serif line plus a hint. Example: "Nothing saved yet." / "Tap the heart on any piece to keep it here."
- **Confirmations:** for example "Merci. Our concierge will be in touch within one business day."
- **French touches:** use them sparingly, in eyebrows, greetings and signatures: Bon retour. · Bonjour, {name}. · Merci. · Mon compte · Liste de souhaits · La lettre · Essayage virtuel.

## Typography checklist

| Character | Use | Example |
|---|---|---|
| `’` | Apostrophes in prose | |
| `–` | Ranges | `Tue–Sat`, `16–18 in` |
| `—` | Asides and joins | |
| `·` | Separators | |
| `×` | Dimensions | |
| `“ ”` | Quotes | |
| `…` | Ellipsis | |

- **Accents:** Montréal, rivière, pavé.
- **Units:** `ct`, `mm`, `in`, `g`.
- **Prices:** never typed into copy. Use `<Price />`. If market-specific, branch on `currency === 'CAD'`.
- **Case:** write labels in sentence or title case; CSS uppercases them.
- **Spelling:** match the surface you're on. Cart surfaces say "Jewellery"; catalog names say "Jewelry".

## Honesty

This is a prototype. Don't invent review counts, guarantees, delivery times or legal claims the app can't back. If the brief requires one, flag it to the user.

## Before finishing

Read your copy aloud against the examples above. Optionally ask the `copy-editor` agent to review it.
