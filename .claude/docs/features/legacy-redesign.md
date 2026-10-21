# The legacy redesign (2026-10-21)

The owner's brief: a three-generation Montréal house, known by word of mouth, that wants to win online. A visitor should feel "this is a serious, trusted jeweller", stay, look at the pieces, then book a visit, contact the salon, or order. Best sellers are engagement rings and diamond tennis necklaces; rentals run about 50/50 with sales and the same piece can be rented or bought; everything is designed and made in-house; "Book a visit" matters as much as "Add to bag". Keep the current style (calm, white space, large photos, few words) and remove nothing. The plan is in `.claude/plans/legacy-redesign.md` (approved 2026-10-21, with the owner's answers below).

Scope: the house data (`src/data/house.ts`), private visits (`src/data/visits.ts`, `src/components/visit/`), "Ask a jeweller" (`src/components/contact/AskSheet.tsx`), rent or own and the catalog rules (`src/data/catalog.ts`), the chapter grid and filters (`src/components/catalog/`), Shop all (`src/pages/Shop.tsx`), the new Home sections (`src/components/home/`), and the changes to the header, menus, footer, product page, bag, wishlist, account and atelier.

## Owner answers (2026-10-21)

- Keep the press names in the "As seen in" strip (placeholders).
- No lab-grown diamonds: the house sets natural diamonds only (copy in `HOUSE.natural`, the bridal FAQ "Natural or lab-grown?", the Four Cs).
- The salon uses WhatsApp and texts (`AskSheet`).
- Family names, years and roles: placeholders (`HOUSE.years`, `HOUSE.hands`).
- Decided by Claude Code, as asked:
  - **rental credit:** the rental fee counts toward buying the same piece within 60 days (`HOUSE.rentalCredit`, rentals FAQ "Can I rent it before I buy it?");
  - **visits:** 45 min in the salon, 60 for an engagement ring or a design, video 30, phone 20; Tuesday to Saturday 10–18, Sunday 11–16 by appointment; booked 2 hours to 6 weeks ahead (`visitLength`, `hoursOn`, `NOTICE_HOURS`, `BOOK_AHEAD_DAYS`);
  - **returns:** 30 days, complimentary, for unworn pieces; engraved, personalized and made-to-order pieces are final sale (`HOUSE.returns`, PDP shipping copy, FAQ).
- Home: nothing removed or shortened; sections may merge or move, and new sections are welcome (feedback recorded in memory and in `.claude/rules/owner-decisions.md`).

## Catalog rules (`src/data/catalog.ts`)

| Symbol | What it does |
|---|---|
| `Product.type: ProductType` | Shopify's product type (engagement, band, eternity, tennis-necklace, riviere, collar, pendant, chain, nameplate, studs, drops, huggies, chandelier, tennis-bracelet, cuff, chain-bracelet, signet, cocktail, stacking, watch, set, commission, redesign, gift-card). Labels: `TYPE_LABELS` (English), `TYPE_FR`, shown with `catalog.type(t)` |
| `Product.alsoIn?: CategorySlug[]` | Other chapters that show the piece: the Gala collar in Necklaces, the sapphire chandeliers in Earrings, the tiara set in Bridal |
| `isRentable(p)` | A piece with `rental` rates can be rented, and every piece can be bought: the same piece, two ways |
| `rentFirst(p)` | The vault's own pieces (`category === 'rentals'`) lead with renting: cards show "From … / weekend", the PDP opens on Rent |
| `getProductsByCategory(slug)` | Own pieces, `alsoIn` pieces, and for `rentals` every rentable piece; the chapter's own pieces first |
| `openingPrice(p, currency)` | The price at `metals[0]`, where the PDP opens; cards, rails and the menu use it, so they always agree with the page (fixes KI-021) |
| `cardPrice(p, currency, rent?)` | What a card shows: `{ amount, rent }`, the weekend rate when it leads with renting |
| `needsSize(p)` | Ring types need a size (engagement, band, eternity, signet, cocktail, stacking) |
| `needsConfig(p)` / `quickAddable(p)` | The one rule for adding from cards, rails and overlays (CartUpsell, VideoViewer, TryOnStudio, Wishlist "Add all", CompleteTheLook) (fixes KI-022) |
| `FAMILIES`, `typesOf(family)` | Filter families: `tennis` gathers tennis-necklace, riviere and collar |
| `SIGNATURES`, `signaturePieces(id)`, `signatureFor(category, family)` | The two signatures: `engagement` (Bridal, `?type=engagement`) and `tennis` (Necklaces, `?type=tennis`) |
| `pic(src, sizes)` | Responsive `src`, `srcSet` (480–2000 w) and `sizes` for Unsplash photos |
| `IMG` | 18 original keys plus about 100 curated placeholder photos, one matching set per piece (the piece, on the body, a detail), and the house's archive, hands, salon and tray photos |

New pieces (bilingual, placeholder prices): Bonsecours Round Solitaire, Ville-Marie Cushion, Saint-Louis Toi et Moi, Maisonneuve Radiant Solitaire, Lachine Eternity Band (Bridal); Redpath Tennis Necklace, Drummond Graduated Tennis Necklace, Peel Emerald-Cut Line Necklace (Necklaces, all rentable). The Rivière Saint-Laurent, Westmount Tennis Bracelet and Vieux-Port Diamond Studs became rentable. 35 products, 9 rentable.

## Routing and store (`src/store.tsx`, `src/App.tsx`)

- `Route` entries `category`, `product` and the new `shop` carry `query: Query`. `parseHash` splits the query (fixes KI-017); `queryString(query)` writes it in a stable order.
- `href.shop(query?)`, `href.category(slug, query?)`, `href.product(slug, rent?)` (`?mode=rent`).
- `replaceQuery(query)` rewrites the address in place (`history.replaceState`) and dispatches `tns:address`; `PageTransition` hears it and re-notes the page, so Back returns to the filtered chapter. Filter changes never start a page transition.
- `Routes` keys `Shop`, `Category` and `Product` by their options, so a link to other filters or to renting opens fresh.
- New slices (persisted, validated on read):

| Slice | Key | What |
|---|---|---|
| `visits`, `bookVisit`, `cancelVisit` | `tns-visits` | Booked visits (`Visit`) |
| `visitRequest`, `openVisit(request)`, `closeVisit` | — | The booking drawer; opening it closes the bag and the jeweller panel |
| `askAbout`, `openAsk(slugs)`, `closeAsk` | — | The "Ask a jeweller" panel |
| `profile`, `setProfile` | `tns-profile` | `ringSize` (pre-fills ring pages, saved when chosen) and `dates` to remember |
| `nudgeAt`, `dismissNudge` | `tns-nudge` | When the in-grid visit suggestion was last dismissed |

## Private visits

- **Data** (`src/data/visits.ts`): `VisitPurpose` (engagement, bands, tennis, rental, design, gift, watches, care, other), `VisitMode` (salon, video, phone), `Visit`, `VisitRequest` (`purpose`, `pieces`, `mode`, `date`, `time`, `change`). Free times are simulated: about a third are taken, stable per day and time (`taken`). Times are Montréal time; `localTime` adds the visitor's own when it differs. `icsFor` writes the calendar file in the browser.
- **Flow** (`VisitFlow`): reason, way to meet (USD visitors start on video), a day strip and its times, pieces to prepare (attached from the page, plus one-tap wishlist pieces), name, email, phone, language, note, guest. Validation scrolls to the first missing step. Confirmation: hallmark, "We’re expecting you, {name}.", when (and the visitor's time), how, length, pieces; Add to calendar, Directions, Change, Cancel the visit.
- **Shells**: `VisitDrawer` (`z-[80]`/`z-[90]`, focus, Escape, Lenis stop, closes on `hashchange`, restores focus), embedded on the Atelier page.
- **Doors** (`VisitButton`, same verb everywhere: "Book a visit" / "Prendre rendez-vous"): header (button from `lg`, words from 1280 px, calendar icon on phones), mobile menu, desktop menu, hero (every slide, phones too), Signatures, the bridal and rentals sections, Four Cs, TennisGuide, RentOrOwn, PrivateVisit, VisitSalon (next free times), the PDP (equal-weight door, sticky bar), VisitBand (PDP, chapters, Shop, wishlist), the in-grid Interlude, the bag drawer and cart page ("Prefer to see it first?"), the wishlist, the account, the try-on studio, the footer.

## Ask a jeweller (`AskSheet`)

Call (`tel:`), text (`sms:` with the message), WhatsApp (`wa.me`, placeholder number), email (`mailto:` with "About: {pieces}", `SALON.email` is a `.example` placeholder), Book a visit, and a call-back request (name, phone, morning/afternoon/early evening → "Merci, {name}. A jeweller will call you …", simulated). It names the pieces it was opened about. Opened from the PDP, the FAQ, Services, the gift finder, the gift-card page, the bag, the wishlist, the header's mobile menu, the desktop menu and the footer.

## Product page (`src/pages/Product.tsx`)

- **Own | Rent** (`mode`, rentable pieces only): swaps price, steps, CTA, availability and trust row; the address keeps the mode when it differs from the default (`?mode=rent`, `?mode=own` for vault pieces). Renting shows the rental credit line.
- **The doors**: Add to bag (or Reserve this piece), then Book a visit (or Book a fitting / Book a design consultation) at the same height beside View on you; "We’ll have it ready for you in the salon · Ask a jeweller"; engagement rings add "Prefer another shape or size? We’ll source it for your visit."
- **Maker's note**: hallmark plus `HOUSE.madeHere` and `HOUSE.hallmark` (watches: their own line).
- **Trust row** in the piece's terms: renting (courier, insurance, fitting), watches (service plan, engraving), or the default.
- **Ring size** pre-fills from `profile.ringSize` and is saved when chosen ("We’ll remember your size.").
- **Lower sections**, numbered from what renders: story, reviews, choosing your diamond (`FourCs`, engagement rings), films, complete the look (`rent`, `metal`, `onAddMain`), the itemized price (opens as a summary: `open`/`onToggle`, "See full cost breakdown" opens it), FAQ, also in, recently viewed, then `VisitBand`.

## Chapters, signatures and Shop all

- `Category` (`?type=engagement` on Bridal, `?type=tennis` on Necklaces): a signature hero (title, line, visit), otherwise the chapter hero plus a callout to the chapter's signature; the gifts and rentals bands (rentals: steps, own-it line, rental credit, Book a fitting); `PieceGrid`; the signature's guide (`FourCs` or `TennisGuide`); `VisitBand`; films; recently viewed.
- `PieceGrid`: filters offered only when they split the pieces (chapter on Shop all, type family, metal, price band per market, how: available to rent / ready in the salon / made to order, shape from GIA), active chips with remove and "Clear all", sort by the shown price (fixes rental sort), `Interlude` after the sixth piece, an empty state with "Ask a jeweller".
- `Interlude`: the salon invitation; after three pieces viewed or two saved it speaks to the visitor ("You’ve looked at {n} pieces…") with the pieces attached, at most once a week (`nudgeAt`), dismissible, never a pop-up.
- `Shop` (`#/shop`, Shopify's `/collections/all`): every piece except the gift card, chapter links, `PieceGrid` with the chapter filter. Linked from the header mega menu (first row), the desktop menu, the mobile menu, the footer, Treasured's "Continue the discovery", the empty bag and the wishlist.

## Home (`src/pages/Home.tsx`)

**Refined 2026-10-21 (owner):** Hero (four slides) → As seen in → [Welcome back, Recently viewed: returning visitors] → 01 Our signatures → the house in four numbers → 02 The Index (silk) → 03 Most treasured (with "Try any piece on you") → 04 Rent or own (on the vault's dark ground) → 05 Sur mesure → 06 Three generations (with Teresa's quote) → 07 Families who come back → 08 Our promise (six tiles, light) → 09 The private visit → 10 Worn in Montréal → Come sit with us (the salon). The rest of this paragraph is the redesign as first built. Numbered from `ACTS` (owner decision): 01 Signatures, 02 The Index, 03 Most treasured, 04 Mariage, 05 Four Cs, 06 Sur mesure (`SketchToRing`), 07 The tennis line (`TennisGuide`), 08 Rent or own (`RentOrOwn`, then the vault statement), 09 Films, 10 Try-on, 11 The making (then `TheHands`), 12 Three generations (`Generations`, then Teresa's quote), 13 Testimonials ("Families who come back"), 14 Gift finder, 15 Our promise (`Services`, with the returns policy), 16 Watches, 17 The private visit (`PrivateVisit`), 18 Worn in Montréal (`SocialGrid`). After them, the salon (`VisitSalon`, "Come sit with us.") closes the page above the footer, as before the redesign (owner, 2026-10-21). Before them: the hero, the press strip, `WelcomeBack` and Recently viewed (returning visitors), and after Signatures the house in numbers. Grounds alternate light, silk and vault.

- Hero: four slides (Maison with the Notre-Dame oval, Tennis with Redpath, Mariage with Bonsecours, Location with the Gala collar), the legacy side line "… · Three generations", "Book a visit" on every slide; signature CTAs open the signature pages.
- `SketchToRing`: a `role="slider"` handle (drag, arrows, Home/End) wipes an SVG pencil sketch into the photo.
- `TennisGuide`: an SVG neckline whose line falls with the length (16/17/18 in) and whose stones grow with the weight (5/10/15 ct). Stones sit evenly by arc length (`evenly`) at one pitch, so a longer line shows more of them (`COUNT`: 25, 30, 35); the line's ends sit on the neck's outline, and the stones a shorter line doesn't show wait hidden at its ends, so lengthening draws them out from behind the neck.

## Design system additions

- `--gold-ink` (#846529: 5.2:1 on travertine, 4.7:1 on silk) for small gold text that must be read.
- A global `:focus-visible` ring (1 px vermeil, offset 3 px) for links, buttons, fields and sliders; fields with `outline-none` keep their own underline (fixes KI-040).
- `src/components/ui.ts`: `btnPrimary`, `btnVisit` (the primary's size, in outline), `btnQuiet`, `btnOnDark`, `btnVisitOnDark`, `eyebrow`.
- `Hallmark`: the maker's mark (`brand/`).

## Consistency and search pass (2026-10-21, after the owner's review)

- **One verb per action, everywhere:** "Book a visit" (the `VisitButton` default; Signatures, Four Cs, the signature pages, the Home bridal section, Account and the try-on studio no longer say "viewing", "appointment" or "sizing") and "Ask a jeweller" ("concierge" is retired: Gift finder, gift cards, the balance checker, a review). The named exceptions are "Book a fitting" on rentals and "Book a design consultation" on commissions, both from the approved plan. The service is "Private visits" (Services, the desktop menu). `HOUSE.signatures` no longer carries a `visit` label.
- **Contrast sweep (KI-045):** every visible text on every page and overlay was measured at desktop and phone widths against what paints beneath it. Small text that must be read moved from linen to taupe and from vermeil to gold-ink (161 changes in 37 files); `--gold-ink` darkened to #846529 so it passes on silk; placeholders went to taupe, dark-ground greys to `text-white/60`, the gold badges to gold-ink. Small-text readings under 4.5:1 went from 1,572 (both widths) to 6, each checked: the wordmark (a logotype, exempt) and text clipped under the bag drawer’s footer, where it is not seen. Still open: the large vermeil accents (2.81:1, 2.57:1 on silk) need 3:1; the gold 8% darker (#A98441) would pass, the owner's call.
- **Search on phones:** `MobileSearch` heads the mobile menu, and a search button beside the menu button opens it there. Both menus share their fields (`search.ts`): the two signature pages rank with the chapters, and a piece also answers to its kind in both languages ("engagement", "fiançailles", "tennis").

## Files

| File | What it is |
|---|---|
| `src/data/house.ts` | `HOUSE_IMG` and the bilingual `HOUSE` copy: signatures, numbers, years, hands, made here, hallmark, natural diamonds, rental credit, returns, visit length |
| `src/data/visits.ts` | Visit types and rules, Montréal-time helpers, simulated free times (`slotsOn`, `visitDays`, `nextFree`), `purposeFor`, `upcoming`, `VISIT_COPY`, `icsFor` |
| `src/components/ui.ts` | Button and eyebrow class recipes |
| `src/components/brand/Hallmark.tsx` | The maker's mark: T&S in a cut-corner cartouche, "MTL · 1962" |
| `src/components/visit/VisitFlow.tsx` | The booking: steps 01–05, validation, confirmation with calendar file, change and cancel; `embedded` on the Atelier page |
| `src/components/visit/VisitDrawer.tsx` | The drawer around `VisitFlow`, opened with `openVisit(request)` |
| `src/components/visit/VisitButton.tsx` | "Book a visit" with what the page knows (reason, pieces, time); `tone`, `variant` |
| `src/components/visit/NextTimes.tsx` | The next free times as chips, each opening the booking at that time |
| `src/components/visit/VisitBand.tsx` | "See it in person": the salon, next free times, Book a visit and Ask a jeweller |
| `src/components/contact/AskSheet.tsx` | "Ask a jeweller": call, text, WhatsApp, email, a call-back request, or book a visit |
| `src/components/catalog/PieceGrid.tsx` | A chapter's grid with filters, chips, sort, the `Interlude` and the empty state |
| `src/components/catalog/Interlude.tsx` | The salon invitation among the pieces; personal after three viewed or two saved |
| `src/pages/Shop.tsx` | `#/shop`: every piece in one grid |
| `src/components/menu/MobileSearch.tsx` | Search on phones, at the head of the mobile menu |
| `src/components/menu/Marked.tsx` | The menus’ highlight of matched words |
| `src/components/home/Signatures.tsx` | Act 01: the two signatures as tall portraits |
| `src/components/home/HouseNumbers.tsx` | The house in four numbers, after Signatures |
| `src/components/home/SketchToRing.tsx` | Act 06: the pencil drawing wiped into the finished ring (`role="slider"`) |
| `src/components/home/TennisGuide.tsx` | Act 07 and the tennis signature page: "Find your line", length and weight on a neckline |
| `src/components/home/RentOrOwn.tsx` | Act 08: the Redpath necklace with an Own \| Rent switch |
| `src/components/home/TheHands.tsx` | After act 11: the designer and the two masters at the bench (placeholders) |
| `src/components/home/Generations.tsx` | Act 12: the house's years on a hairline, scrolling sideways on phones |
| `src/components/home/PrivateVisit.tsx` | Act 17: the private visit step by step |
| `src/components/home/WelcomeBack.tsx` | A returning visitor's next visit and shortlist, before the acts |

## Notes & gotchas

- **Home refine (2026-10-21).** The owner asked to remove extra sections. Home went from 25 blocks to 14 (31.5 → 17.9 desktop screens, 41 → 23.8 on phones, 1,830 → 1,147 words, 15 → 9 booking buttons). `RentOrOwn` now sits on the vault ground and took in the rental band ("View the rental vault"). `Generations` takes `coda` for Teresa's quote. `GiftFinder` (Gifts) and `WatchSpotlight` (Watches, without its list) take `inChapter`. `MakingScroll` moved to the Atelier, its photographs capped at `calc(100vh-33rem)` so the raised cards clear the title. `TryOnFeature` is no longer rendered; it is kept as a theme section. Plan: `.claude/plans/home-refine.md`.

- **No sideways scroll (fixed 2026-10-21).** The redesign's "Book a visit" made the desktop header overflow the window between 1024 and about 1150 px (a horizontal scrollbar on every page): the bar is now compact from 1024 to 1279 px (10 px nav, 16 px gaps, 22 px wordmark), keeps a 24 px gap around the wordmark, and shows the French "Prendre rendez-vous" words from 1366 px (English "Book a visit" from 1280). Home's pinned section kept the width it measured under the splash (`SmoothScroll` now re-measures when the scrollbar appears), the gift-card hero's stacked card bled 9 px past a phone's edge, and two display headings needed help at 320 px. Measured clean at 320, 390, 1024, 1280 and 1440 px, every frame of the first load and around the overlays.

- **Smooth scrolling over rails (fixed 2026-10-21).** The redesign's phone rail for Most treasured carried `data-lenis-prevent` at every width, and the timeline and Shop all's chapter strip did too (the films had `data-lenis-prevent-wheel`), so the wheel stuttered as the pointer crossed them on desktop. All page rails now use `data-lenis-prevent-horizontal` with `overscroll-x-contain` (UX rule, "Smooth scrolling").

- Everything is simulated: visits live on the device (`tns-visits`), no email, text or WhatsApp is sent, availability is generated. The theme would use a booking app (Booxi, Calendly or a Shopify appointments app) and customer accounts.
- All photographs are Unsplash placeholders chosen by eye (2026-10-21); the shot list for the real photography is in `.claude/plans/legacy-redesign.md` (Appendix B). Names, years, roles, the hours at the bench, prices, GIA numbers and the press names are placeholders.
- Initial JS rose to about 890 kB (276 kB gzip): the entry chunk (683 kB), the shared vendor chunk (150 kB) and a chunk shared with the lazy menu (59 kB).
- Several long docs (pages/home.md, pages/product.md, pages/category.md, components/global-and-shared.md, components/pdp-modules.md, pages/cart-and-checkout.md, pages/account-and-wishlist.md) predate this redesign in parts; this doc and the code win. `/kb-refresh` re-audits them.

## Related docs

- [languages.md](languages.md): every new string is bilingual.
- [../pages/home.md](../pages/home.md), [../pages/product.md](../pages/product.md), [../pages/category.md](../pages/category.md)
- [../data-model.md](../data-model.md), [../commerce-logic.md](../commerce-logic.md), [../architecture.md](../architecture.md)
- [../design-intent.md](../design-intent.md), [../todo.md](../todo.md), [../known-issues.md](../known-issues.md)
