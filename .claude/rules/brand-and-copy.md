---
paths:
  - "src/**/*.tsx"
  - "src/data/**/*.ts"
---

# Brand voice & copy rules

Full reference: `.claude/docs/brand-voice-and-copy.md` (voice, microcopy inventory, glossary). The `write-brand-copy` skill drafts new copy.

## Voice

- **Teresa & Sons** is a family maison founded in 1962 by Teresa Moretti. The atelier and salon are on rue Sherbrooke Ouest in Montréal.
- The voice is understated, editorial, sensory and quietly confident. No hype, no exclamation marks, no urgency tricks.
- Taglines are short declaratives: "A single round brilliant, suspended." "Past, present, future."
- Copy speaks of craft, light, heritage and inheritance.
- **Bilingual touches.** French appears in eyebrows and greetings: `Carte-cadeau`, `Solde`, `Mon compte`, `Liste de souhaits`, `La lettre`, `L'Atelier`, `Essayage virtuel`, `Bon retour.`, `Bonjour, {name}.`, `Merci.` Each category also has a French name in `CATEGORIES`.
- **Naming system.** Collections are named after Montréal places: Mont-Royal, Saint-Laurent, Plateau, Vieux-Port, Outremont, Mile End, Westmount, Atwater, Griffintown, Sherbrooke, Laurier, Notre-Dame, Basilique. Category chapters are numbered with roman numerals I–IX.

## Typography in strings

| Character | Use for | Example |
|---|---|---|
| `’` | apostrophes in prose | `We couldn’t find that card.` |
| `–` | ranges | `Tue–Sat`, `16–18 in`, `2–5 days` |
| `—` | asides and CTA joins | `Add to bag — $250` |
| `·` | separators | `Montréal · Est. 1962` |
| `×` | dimensions and quantity | `12 × 10 mm` |
| `“ ”` | quotations | |
| `…` | ellipsis | |

- Keep accents correct: `Montréal` in brand contexts, `rivière`, `pavé`.
- If you type a straight `'` inside a string, use double quotes for that string (AGENTS.md).

## Casing & formatting

- Write labels in normal case and let CSS (`uppercase` + tracking) style them. Never type ALL CAPS in source.
- **Units:** `ct`, `mm`, `in`, `g`.
- **Money:** through `Price`/`formatPrice` only, with no decimals.
- **Dates:** through `formatDay` (en-CA).

## Market & consistency

- Branch currency-dependent copy on `currency === 'CAD'` (shipping, duties and tax lines differ for Canada and the U.S.).
- Spelling is mixed today: "Jewellery" on cart surfaces, "Jewelry" in catalog names. Match the word already used on the surface you're editing.
- Copy lives inline in components (there is no i18n). Catalog copy (names, taglines, descriptions, specs, category text) lives in `src/data/catalog.ts`.
- This is a prototype. Don't add trust claims the app can't back (review counts, "verified" badges, delivery promises) without flagging them.
