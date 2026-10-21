# Languages: English (Canada, US) and French (Canada)

The storefront speaks English and French. English follows the visitor's market: Canadian English with CAD, US English with USD. French is Canadian French in either market. Every string a visitor reads has both languages, declared next to the component that shows it with `bilingual()`. The catalog's French lives in `src/data/catalog.fr.ts`. A switch keeps the page where it is: a travertine veil names the new language while the copy swaps beneath it. The language is in the address (`#/fr/…`) and is remembered per device, and a one-time notice greets visitors whose browser or link chose the language for them.

Scope: `src/i18n/index.ts`, `src/i18n/us.ts`, `src/i18n/rich.tsx`, `src/i18n/catalog.ts`, `src/i18n/common.ts`, `src/data/catalog.fr.ts`, `src/components/locale/LocaleMenu.tsx`, `src/components/locale/LanguageToggle.tsx`, `src/components/locale/LanguageNotice.tsx`, `src/components/transition/LanguageVeil.tsx`, the language parts of `src/store.tsx`, `src/data/catalog.ts` (`formatPrice`, `formatDay`, `formatSlot`, `validatePersonalization`), `src/data/salon.ts`, `src/data/tax.ts` (name helpers), `src/data/costing.ts` (statement wording)

## 1. The locale model

| Language (`Lang`) | Market (`Currency`) | Locale (`localeFor`) | What changes |
|---|---|---|---|
| `en` | `CAD` | `en-CA` | The source copy, Canadian spelling (`jewellery`, `colour`, `centre`, `-ize`); hours as `18h`; delivery windows `09:00 – 11:00` |
| `en` | `USD` | `en-US` | The same copy through `americanize()` (`jewelry`, `color`, `center`); hours `6 PM`; windows `9 AM – 11 AM` |
| `fr` | `CAD` or `USD` | `fr-CA` | French copy; `1 250 $`; `mer. 21 oct.`; hours `18 h`; decimal comma (`1,82 ct`); inches as `po` |

- `src/i18n/index.ts` exports `Lang`, `Locale`, `LANGS` (`['en', 'fr']`), `LANGUAGE` (`{ en: { name: 'English', short: 'EN' }, fr: { name: 'Français', short: 'FR' } }`) and `localeFor(lang, currency)`.
- **The market decides the English.** `setCurrency` re-points the locale (en-CA ↔ en-US) before the render. French stays `fr-CA` in either currency (USD reads `1 250 $ US` via `formatPrice` with `narrowSymbol` plus the printed code).
- **Module state for non-React code.** `getLocale()`, `getLang()` and `setActiveLocale()` hold the locale on screen, so formatters, page titles and transition cards read it outside React. The store sets it in `syncLocale` before every render that changes it.

## 2. Declaring copy

```ts
const COPY = bilingual(
  { title: 'Your <em>Bag</em>', pieces: (n: number) => `${n} piece${n === 1 ? '' : 's'}` },
  { title: 'Votre <em>panier</em>', pieces: (n) => `${n} pièce${n < 2 ? '' : 's'}` },
)
const t = useCopy(COPY)        // in a component: re-renders when the language or market changes
const t = pick(COPY)           // outside React: the locale on screen (or pass one)
```

- `bilingual<T>(en: T, fr: NoInfer<T>)`: the French must have exactly the English shape. A missing or extra key fails `npx tsc`.
- Values are strings, arrays, nested objects or **functions** for counts and names, so each language words its own plurals. French plural rule used throughout: singular for 0 and 1 (`n < 2`).
- `pick(copy, locale)` returns `copy.fr`, `copy.en`, or for `en-US` a cached `americanize(copy.en)` (`copy.us`).
- **Accent words.** A string may carry one `<em>…</em>`. Render it with `rich(text, emClass)` from `src/i18n/rich.tsx`; `accentOf(text)` and `plain(text)` extract the word and the bare string (PageTransition's cards use them). French headlines stress their own word (`Votre <em>panier</em>`, `L’<em>Atelier</em>`).
- **Shared words** live in `src/i18n/common.ts` `COMMON`: `from`, `tryOn`, `viewOnYou`, wishlist labels, `addToBag`, `goToBag`, `addedToBag`, `reserve`, `commission`, `periods`, `rentalLabel`, `size(s)`, `quote(s)`, `chapter(n)`, `reviews(n)`, `pieces(n)`, `complimentary`, `perWeekend`, `clear`, `close`, `recentlyViewed`.
- **Bilingual touches stay English-only.** The English site keeps its French eyebrows and greetings (`Carte-cadeau`, `Mon compte`, `Bon retour.`, `Merci.`). The French site uses French eyebrows that don't repeat the title (`Espace client` above `Votre <em>compte</em>`, `La sélection` above `Votre <em>panier</em>`).

### US spelling (`src/i18n/us.ts`)

- `toUS(text)` replaces whole words from `WORDS` (jewellery → jewelry, jeweller(s), centre(s/d), metre(s), millimetre(s), colour(s/ed/less), favour(ite/s), honour(ed), labour, harbour, neighbourhood(s), savour, splendour, glamour, behaviour, lustre, theatre, sombre, calibre, catalogue, grey, cheque(s), cancelled/cancelling, travelling/travelled/traveller, modelled/modelling, instalment(s), enrol, fulfil, ageing, judgement, mould, programme, licence, and -ise forms). Capitalisation is kept (`Jewellery` → `Jewelry`). Proper names are never in the list.
- `americanize(value)` maps a whole copy object: strings, arrays, plain objects, and the strings that copy functions return. React elements pass through.

## 3. The catalog in each language (`src/i18n/catalog.ts`)

Products keep their English data in `src/data/catalog.ts`; the try-on, media-pool and costing heuristics read the English `name` and spec keys. Everything a visitor reads goes through `useCatalog()` (components) or `catalogFor(locale)` (other code):

| Method | Returns |
|---|---|
| `product(p)` | `{ name, tagline, description, collection, specs: [label, value][] }`, cached per locale and slug |
| `name(p)` | the display name |
| `spec(p, key)` | one spec value by its English key (`spec(p, 'Case')`) |
| `category(c)` | `{ name, accent, description, numeral }`. The `accent` is the French name in English (`Colliers`), and a short French line in French (`près du cœur`, `la lumière du fleuve`, `à superposer`, `finies à la main`, `pour la vie`, `l’heure suisse`, `le temps d’un soir`, `à offrir`, `à votre image`) |
| `metal(m)`, `badge(b)`, `gia(value)`, `carat(gia)` | `Or jaune 18 carats`, `Incontournable`, `Brillant rond`, `1,82` |
| `personalization(p)` | `{ label, hint, accent }` |
| `unit(value)` | chain lengths in French (`16 in` → `16 po`) |
| `design(id)` | gift-card design names (`Travertin`) |
| `video(v)` | a film's `{ title, caption }` |

`src/data/catalog.fr.ts` holds `CATEGORY_FR`, `METAL_FR`, `BADGE_FR`, `SPEC_LABEL_FR`, `GIA_FR`, `PRODUCT_FR` (per slug: `name`, `tagline`, `description`, optional `collection`, `specs` by English key, optional `personalization`), `DESIGN_FR` and `VIDEO_FR`. A slug missing from `PRODUCT_FR` falls back to English. In Canadian English the spec label `Color` displays as `Colour`.

## 4. Formatting

| Helper | File | Behaviour |
|---|---|---|
| `formatPrice(amount, currency, locale?)` | `src/data/catalog.ts` | `Intl.NumberFormat(locale, { style: 'currency', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })`, cached per locale and currency: `$1,250` / `1 250 $`. Callers print the ISO code (`Price` adds it) |
| `formatDay(d, opts?, locale?)` | `src/data/catalog.ts` | `toLocaleDateString(locale, opts)` |
| `formatSlot(slot, locale?)` | `src/data/catalog.ts` | `09:00 – 11:00` (en-CA, as stored), `9 AM – 11 AM`, `9 h – 11 h` |
| `formatNumber(n, opts?, locale?)` | `src/i18n/index.ts` | `Intl.NumberFormat`; also used for percentages (`9,975 %`) |
| `formatHour(h, locale?)` | `src/i18n/index.ts` | `18h` / `6 PM` / `18 h` |
| `formatList(items, locale?)` | `src/i18n/index.ts` | `a, b and c` / `a, b, and c` (en-US) / `a, b et c` |
| `salonStatus(now?, locale?)`, `salonHours()`, `salonWeek()` | `src/data/salon.ts` | the salon's live status, the one-line hours (`Tue–Sat · 10h–18h`, `Mar.–sam. · 10 h – 18 h`) and the sentence on Home (`Du mardi au samedi, de 10 h à 18 h · Le dimanche sur rendez-vous`), all from `SALON.hours` |
| `provinceName`, `taxName`, `stateName`, `taxLabel` | `src/data/tax.ts` | `Colombie-Britannique`; GST → `TPS`, QST → `TVQ`, HST → `TVH`, PST → `TVP`; `TPS 5 % + TVQ 9,975 %` |
| `sizeLabel(s)` | `src/components/pdp/RingSize.tsx` | ring sizes as the locale writes numbers (`6,5`); the stored value stays `6.5` |

`buildCostBreakdown(p, currency, metal?, personalization?, locale?)` (`src/data/costing.ts`) words the statement in the locale; `validatePersonalization` returns its message in the locale on screen.

## 5. Language in the store and the address (`src/store.tsx`)

- **State.** `lang` (persisted as `tns-lang`, raw `en`/`fr`), `setLang`, `langOrigin` (`{ source: 'url' | 'stored' | 'browser' | 'default', stored, browser, both }`), `langHintSeen` (`tns-lang-hint`) and `dismissLangHint`. `tns-currency` is now validated on read (`loadCurrency`).
- **Resolution at load** (`resolveLang`): an explicit address prefix (`#/fr/…` or `#/en/…`), then the stored choice, then `browserLang()` (the first of `navigator.languages` that is English or French; `both` when the other is listed too), then English.
- **The address.** French pages carry `#/fr`; English has no prefix (`PREFIX`). `href` entries are getters that read the current prefix, so links are always in the language on screen. `splitHash(hash)` returns `{ path, lang }`; `parseHash` ignores the prefix; `bareHash(hash)` gives the page path for comparisons.
- **Only the first load obeys the prefix.** After that the language is the visitor's choice: `syncLocale` rewrites any address in the other language (an older history entry, a link rendered before a switch) into theirs with `history.replaceState`, on every `hashchange`. A switch therefore adds no history entry and never starts a page transition.
- **`syncLocale(lang, currency)`** sets the active locale, the prefix, `<html lang>` and the address. It runs at module load, in `setCurrency`, in `setLang` (inside the veil's swap) and on `hashchange`.
- **Contexts.** `LocaleContext` (from `src/i18n/index.ts`) carries `{ lang, locale, setLang }`, memoised on `[lang, currency]`, so copy re-renders only when the language or market changes. `useStore()` also exposes `lang` and `setLang`.

## 6. Switching

| Where | Control |
|---|---|
| Header, `sm` and up | `LocaleMenu`: a trigger (`Globe` · `EN · CAD` · chevron) opening a 300 px panel: languages in their own words (`English` / `Canada · United States`, `Français` / `Canada`), markets (`Canada · CAD $`, `United States · USD $`), a live summary (`English (Canada), prices in Canadian dollars.`) and `Your bag and wishlist stay as they are.` It stays open through a switch, closes on outside pointer, Escape (focus back to the trigger) and route change |
| Mobile menu | `LanguageToggle full` (`English` · `Français`) under `Language`, above the market toggle |
| Desktop menu (`SiteMenu`) | `LanguageToggle` (`EN` · `FR`) beside the market toggle |
| Footer legal row | `LanguageToggle tone="dark" full` after `Shipping to Canada (CAD) & United States (USD)` |
| Account page | `Language` preference beside `Preferred market` |

`LanguageToggle` buttons carry `lang`, `aria-pressed`, and (short form) `aria-label` with the full name.

**The veil** (`src/components/transition/LanguageVeil.tsx`, mounted in `App`): `registerSwitcher` gives the store a choreography. A travertine veil (`z-[125]`) fades in (0.3 s) with a card: the `Ampersand`, `{language} · {region}` (`Français · Canada`, `English · United States`) and `<em>Bienvenue</em>.` / `<em>Welcome</em>.`. At 0.32 s the copy swaps synchronously (`flushSync`); `holdPlace()` measures the element at 35% of the viewport (max 360 px) before and after and scrolls by the difference, so the reader stays on the same paragraph; `ScrollTrigger.refresh()`. The card leaves at 0.85 s, the stage clears at 0.9 s and the veil fades out from 0.95 s (about 1.45 s in all). Lenis is stopped throughout; `html[data-switching]` is set while it runs. A polite live region then says `Le site est maintenant en français.` / `The site is now in English.` with its own `lang`. Under reduced motion, during a page transition, or when a switch arrives mid-veil, the swap is immediate (place still kept, still announced).

## 7. The language notice (`src/components/locale/LanguageNotice.tsx`)

A dark card, bottom-left (`sm`) or full-width (phones), `z-[45]`, `data-fab-avoid`. Decided once from `langOrigin`; shown 1.4 s after the stage clears; hides after 16 s unless pointer or focus is on it; any answer, dismissal or timeout sets `langHintSeen`.

| Case | Text (in its own language) | Buttons |
|---|---|---|
| Browser chose French | `Le site s’affiche en français, selon la langue de votre navigateur.` | `View in English` · `Continuer en français` |
| Bilingual browser, English shown | `Ce site est aussi offert en français.` | `Passer au français` · `Continue in English` |
| A link opened French for an English visitor | `This page opened in French, as its link asked.` | `View in English` · `Continuer en français` |
| A link opened English for a French visitor | `Cette page s’est ouverte en anglais, comme le demandait son lien.` | `Voir en français` · `Continue in English` |

Eyebrow `Langue · Language` (or `Language · Langue`), close button `Fermer · Close`.

## 8. Smart behaviour elsewhere

- **Search reads both languages** (the fields in `src/components/menu/search.ts`, used by `SiteMenu` and, on phones, `MobileSearch`): French and English names, accents and category names are indexed for every piece (`catalogFor` of the other locale at lower weights), so `ring` finds `Bagues` on the French site. Results show in the language on screen. Page keywords (`KEYWORDS`) are bilingual.
- **Reviews keep their original language** (`src/components/pdp/Reviews.tsx`). Québec clients wrote in French, others in English; each `POOL` review has `lang` and `text: { en, fr }`. A review in the other language shows its translation with `Translated from French` / `Traduit de l’anglais` and a `See original` / `Voir l’original` toggle (`See translation` / `Voir la traduction`). A visitor's own review is stored with its language (older `{ t, b }` reviews migrate as English) and shows `Written in French` / `Rédigé en anglais` when there is no translation. Dates use `Intl.RelativeTimeFormat` (`il y a 3 jours`).
- **Testimonials** (Home) show French translations with `Traduit de l’anglais`; piece names come from the catalog by slug.
- **Page titles and meta** (`App` `headFor`, `SITE`): per language, re-run on `[route, locale]`, plus `og:locale` (`fr_CA`).
- **Transition cards** (`PageTransition` `CARDS`): per language; categories read `Chapitre IV` / `Bagues`.
- **Splash and header sub-line**: `Montréal · Est. 1962` / `Montréal · Depuis 1962`.
- **The custom gift-card amount** puts `$` after the field in French (`flex-row-reverse`).
- **Hero headlines** were written for the display size, not translated word for word: `Sertir la / lumière, / depuis 1962.`, `Une promesse, / certifiée / au carat près.`, `Empruntez / le coffre / pour un soir.`

## 9. French conventions used

- Vouvoiement throughout, except the visitor's own drafted messages (`J’ai pensé à toi en voyant ceci.`, the gift hint).
- Québec usage: `courriel`, `magasiner` / `magasinage`, `fin de semaine`, `texto`, `téléverser`, `soumission`, `boutons d’oreilles`, `jonc`, `baguier`; taxes `TPS`, `TVQ`, `TVH`, `TVP`; trade agreement `ACEUM`.
- Typography (OQLF): a no-break space before `:` and inside `« »`; no space before `?`, `!`, `;`; `$` after the amount; `18 h`; decimal comma; sentence case in titles; typographic `’` everywhere.

## Notes & gotchas

- **Never capture `href.*` at module scope.** Module constants are evaluated once and would keep the language of the first load (Header's old `announcements`, SiteMenu's old `RAIL` and HomeHero's old `SLIDES` were moved into render for this reason).
- **Memoised copy needs the locale in its dependencies** (`useMemo` with `t`, `catalog` or `locale`), or it stays in the old language after a switch.
- **Keys must not be the copy.** Lists keyed by their text remount on a switch (HomeHero's lines are now keyed by position, keeping their settled animation state).
- **Heuristics read English.** Never pass translated names to `tryOnKind`, `mediaPoolFor`, `JewelryOverlay` or `costing.ts` parsing.
- The language prefix is read only on the first load: typing `#/fr/…` into the address bar of an open English tab is rewritten to English. This is deliberate (Back and stale links never flip the language).
- French text runs about 20–30% longer. Long chapter names step the category hero down a size (`copy.name.length > 16`); the category accent is `inline-block whitespace-nowrap`; product names use `text-balance` so compound place names (Mont-Royal) wrap whole.
- The French copy, product names and category lines are a first draft by the build session: have a native Québec copywriter review them before launch (todo).
- The bundle grew by about 96 kB (36 kB gzip) because both languages ship in the initial chunks.

## Related docs

- [../architecture.md](../architecture.md) · [../brand-voice-and-copy.md](../brand-voice-and-copy.md) · [../shopify-integration.md](../shopify-integration.md) · [../components/global-and-shared.md](../components/global-and-shared.md) · [../motion-and-interaction.md](../motion-and-interaction.md) · [../data-model.md](../data-model.md)
