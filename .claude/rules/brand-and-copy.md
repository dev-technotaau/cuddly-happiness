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
- **Bilingual touches (English site).** French appears in eyebrows and greetings: `Carte-cadeau`, `Solde`, `Mon compte`, `Liste de souhaits`, `La lettre`, `L’Atelier`, `Essayage virtuel`, `Bon retour.`, `Bonjour, {name}.`, `Merci.` Each category also has a French name in `CATEGORIES`. The French site is French throughout; its eyebrows never repeat the title.
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
- **Dates:** through `formatDay` (the visitor's locale). Hours through `formatHour`, delivery windows through `formatSlot`, other numbers through `formatNumber`.

## Market & consistency

- Branch currency-dependent copy on `currency === 'CAD'` (shipping, duties and tax lines differ for Canada and the U.S.).
- This is a prototype. Don't add trust claims the app can't back (review counts, "verified" badges, delivery promises) without flagging them.

## Languages (full reference: `.claude/docs/features/languages.md`)

- **Every visible string is bilingual.** Declare a component's copy at module scope as `const COPY = bilingual({ …English }, { …French })` and read it with `useCopy(COPY)` (or `pick(COPY)` outside React). French must mirror the English keys exactly; `npx tsc` fails otherwise. Counts and names are functions; French is singular for 0 and 1.
- **English is Canadian** (`jewellery`, `colour`, `centre`, `-ize`). US English is derived automatically (`src/i18n/us.ts`); never write a US variant by hand. Add a word to `WORDS` there if it differs.
- **Accent words** are `<em>…</em>` inside the string, rendered with `rich(text, emClass)`. Each language stresses its own word.
- **Catalog copy:** English in `src/data/catalog.ts`, French in `src/data/catalog.fr.ts`; display through `useCatalog()` (`name(p)`, `product(p)`, `category(c)`, `metal(m)`, `badge(b)`…). Never display `p.name` or `c.name` directly.
- **French voice:** vouvoiement; Québec usage (`courriel`, `magasiner`, `fin de semaine`, `texto`, `boutons d’oreilles`, `jonc`); sentence case; no-break space (written `\u00a0` in code) before `:` and inside `« »`, none before `? ! ;`; `1 250 $`, `18 h`, `1,82 ct`, `16 po`.
