# Figma Make build history

This is a chronological record of the prompts the project owner gave Figma Make while building this storefront, and of what Figma Make reported doing in response. The code shows the final state. This log explains the **intent**: why things exist, what was asked for, how it evolved, and what was requested but may not be in the code.

Scope: Figma Make chat history supplied by the project owner, pasted into Claude Code and recorded from 2026-10-15 onward.

How each step is recorded:

- **Prompt:** the owner's words, verbatim.
- **Intent & requirements:** the asks, extracted as a checklist.
- **Response (summary):** what Figma Make said it built or changed, condensed. Decisions, numbers and copy are kept verbatim.
- **Status in current code:** whether each ask is visible in today's source, checked against the knowledge base and targeted greps.
  - ✓ present
  - ~ changed later
  - ✗ not found

## Steps

<!-- Entries are appended below, oldest first. -->

### Step 1 — The original brief

**Prompt (verbatim)**

> Please design me a shopify store theme for "Teresa & Sons".
> Teresa & Sons is a family-owned fine jewelry brand based in Montreal, Canada, specializing in luxury diamond jewelry, gold pieces, engagement rings, and custom-designed jewelry. It also offers jewelry rentals for special occasions.
>
> ### Main product categories ->
> - Necklaces: Diamond necklaces, pendants, tennis necklaces, personalized and religious necklaces.
> - Earrings: Studs, hoops, huggies, drop earrings, and diamond earrings.
> - Bracelets: Tennis bracelets, chain bracelets, bangles, and cuffs.
> - Rings: Stackable rings, pinky rings, statement rings, and diamond eternity bands.
> - Bridal jewelry: Engagement rings, wedding bands, and wedding-day jewelry.
> - Watches: Watch products and related offerings.
> - Jewelry rentals: Necklaces, bracelets, and earrings available to rent.
> - Gifts: Gift cards and jewelry organized into different price ranges.
> - Personalized and custom jewelry: Bespoke pieces and personalized designs.
>
> In short: It is a premium jewelry e-commerce store focused on diamond and gold jewelry, everyday luxury accessories, bridal pieces, and occasion-based rentals. The website supports shopping in Canada and the United States.
>
> The UI should be modern and luxurious and editorial style and premium. and it shouldn't look like another ai made mediocre website design. it should be made with deep thinking and following all the UI/UX laws and like senior UI/UX designer at very high level design agency. use gsap and lenis and others modern web tech as well. I want mega menu in header as well with visuals. its a multi page store.

**Intent & requirements**

- A Shopify store theme for Teresa & Sons: a family-owned fine-jewellery brand in Montréal. Its specialities are diamonds, gold, engagement rings, custom design and occasion rentals.
- Nine categories, each with the sub-types listed in the prompt.
- Shopping in Canada and the United States.
- Look: modern, luxurious, editorial and premium. It must not look like a mediocre AI-made site; work at the level of a senior designer at a top agency, following UI/UX laws.
- Tech: GSAP, Lenis and other modern web tech.
- A mega menu in the header, with visuals.
- A multi-page store.

**Response (summary)**

This was a plan only, with no code. It announced `src/data/catalog.ts` with:
- every category and sub-category, with "authentic Montreal provenance";
- GIA specifications;
- metals: 18k yellow, white and rose gold, plus platinum;
- CAD and USD prices;
- "macro studio shot + on-body editorial hover shot" imagery;
- "rental eligibility & 4-day / 8-day rental rates";
- mega-menu visual cards.

**Status in current code**

| Ask | Status | Where / note |
|---|---|---|
| Shopify theme | ~ | Built as a React SPA prototype in Figma Make, not a Liquid theme. Shopify-shaped only in `src/lib/shopify.ts` (gift cards). See `shopify-integration.md` |
| Brand, Montréal, family, specialities | ✓ | Copy throughout; `CATEGORIES`/`PRODUCTS` |
| Canada + US shopping | ✓ | CAD/USD currency in the store, Header toggle, tax/shipping copy |
| Editorial luxury UI, GSAP + Lenis | ✓ | `design-system.md`, `motion-and-interaction.md` |
| Mega menu with visuals | ✓ | `src/components/Header.tsx` |
| Multi-page | ✓ | Hash router: 9 pages |
| Necklaces: diamond, pendant, personalized | ✓ | Rivière Saint-Laurent, Mont-Royal Solitaire Pendant, nameplate (custom) and Initial Disc Pendant (gifts) |
| Necklaces: tennis | ~ | Only the graduated Rivière comes close |
| Necklaces: religious | ✗ | No religious piece in the catalog |
| Earrings: studs, huggies, drops | ✓ | Vieux-Port Studs, Mile End Huggies, Outremont Pearl Drops |
| Earrings: hoops | ✗ | Only the huggies (described as "petite hinged hoops") |
| Bracelets: tennis, chain, cuff | ✓ | Westmount Tennis, Griffintown Chain, Atwater Cuff |
| Bracelets: bangles | ✗ | Mentioned only in the category description |
| Rings: stackable, statement | ✓ | Laurier Stacking Band, Sherbrooke Emerald Cocktail |
| Rings: pinky | ✗ | The Teresa Signet is the nearest piece; nothing is labelled pinky |
| Rings: eternity | ~ | Laurier is a *half*-eternity band; no full eternity band |
| Bridal: engagement, wedding bands | ✓ | Notre-Dame, Basilique, Promesse |
| Bridal: wedding-day jewelry | ~ | The tiara and drops set exists only as a rental |
| Watches + related offerings | ✓ / ~ | 3 watches; servicing appears only as an Atelier form option and in home copy |
| Rentals: necklaces, earrings | ✓ | Gala Diamond Collar, Chandelier Sapphire Earrings (+ tiara set) |
| Rentals: bracelets | ✗ | No rental bracelet |
| Gifts: gift cards | ✓ | `#/gift-cards` builder |
| Gifts: price ranges | ~ | Collection "Gifts under $1,000" and the home GiftFinder budgets. The gifts category page has no price-range filter |
| Personalized & custom | ✓ | Bespoke Engagement Commission, Heirloom Redesign, nameplate, Personalizer |
| Plan: 4-day / 8-day rental rates | ~ | Implemented as weekend / week / month (3 / 7 / 30 days, `RENTAL_DAYS`) |
| Plan: platinum among the metals | ✓ | Plus a fifth metal, gold vermeil |

### Step 2 — Catalog data model

**Prompt (verbatim)**

> continue

**Response (summary)** — created `src/data/catalog.ts`

- **Not checked by Figma Make:** it said "npx isn't available in this environment", so the file was not type-checked. One syntax error was fixed by reading through the file.
- **Types:** currency (CAD/USD), category, metal, GIA report, price, rental rates and product.
- **Categories:** 9. Each has an English name, French name, roman numeral, description, main image and a second image for the mega menu.
- **Products:** 27, three per category, named after Montréal places.
- **GIA:** "Eight diamond pieces have GIA details" (report number, shape, carat, colour, clarity, cut).
- **Prices:** every product has CAD and USD.
- **Rentals:** three pieces, with weekend / week / month rates and a refundable deposit in both currencies.
- **Flags:** badges ("New", "Limited"…), an engravable flag, and lead times for custom work.
- **Metals:** five (18k yellow, white and rose gold, platinum, gold vermeil), each with a swatch and a price adjustment.
- **Helpers:** look up a category or product, list a category's products, price for a currency and metal, format per country.

Stated assumptions, kept verbatim:
- "USD prices are worked out from CAD at a fixed rate of 0.73, rounded to the nearest $5. The gift card is the only product with its own USD price."
- "Platinum adds $650 CAD to the base price and vermeil takes $400 CAD off. Gold options don't change the price."
- "The GIA report numbers, specs and prices are made-up sample data, so they'll need replacing with real inventory."
- The Unsplash links were "picked from memory rather than searched". They were verified in step 4.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Types, 9 categories, 27 products, Montréal names | ✓ | `src/data/catalog.ts` |
| GIA on 8 pieces | ~ | Only **4** products carry `gia` today: Mont-Royal pendant, Vieux-Port studs, Notre-Dame, Basilique |
| CAD/USD, `CAD_TO_USD = 0.73`, nearest $5 | ✓ | `p()` helper. The gift card is `p(250, 200)` |
| Rentals: weekend / week / month + deposit | ✓ | `rental()` helper |
| Metals and deltas: +650 platinum, −400 vermeil | ✓ | `METALS` |
| Sample-data warning | ✓ still true | GIA numbers, specs and prices are placeholders |

### Step 3 — Theme shell, home, category, product, atelier, bag

**Prompt (verbatim)**

> continue

**Response (summary)**

Built the header with mega menu, footer, cart and four page types, all wired into `src/App.tsx`. The TypeScript check passed; nothing was checked visually.

- **Header:**
  - a black scrolling announcement strip;
  - the logo, a CA·CAD / US·USD switch, and a bag icon with a count;
  - "Collections" hover opens the mega menu, with the 9 categories on the left and, on the right, a description, two featured products and two images that follow the hovered category;
  - a full-screen menu on phones.
- **Home:**
  - a full-height opening image, with the headline revealed line by line;
  - the nine-category index;
  - a bridal section with GIA highlights;
  - a bestsellers grid;
  - a dark rentals section;
  - a family-heritage section with a quote.
- **Category:** a large heading image with the English and French names; sorting by price in the selected currency; on rentals, a four-step "how renting works" strip.
- **Product:**
  - a gallery with hover zoom;
  - metal swatches, with the price updating for the selected metal and currency;
  - rental options (weekend / week / month) and the deposit;
  - optional free engraving of up to 18 characters;
  - a GIA report card, the spec table, and Canada/US shipping notes;
  - related pieces from the same category.
- **Atelier:** the family story, the four commission steps and an appointment form.
- **Bag:** a slide-in drawer with quantities and a subtotal in the chosen currency. The contents and the currency persist across reloads.
- **Effects:** Lenis smooth scrolling, moving film grain, parallax image drift and fade-in reveals. Grain, scroll animations and the strip turn off under reduced motion.

Stated placeholders:
- `#/` links stand in for a router package.
- The checkout button did nothing.
- The newsletter and appointment forms "only show a thank-you".
- The address, phone, hours, family names ("Teresa Moretti, Antonio, Marco") and the quote are placeholder text.
- The images came from an unchecked link list.

Files: `src/store.tsx`, `src/components/`, `src/pages/`, and film-grain CSS appended to `src/index.css`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Header strip, switch, bag count, mega menu, mobile menu | ✓ | Later gained account and wishlist icons (step 5) |
| Home: opening image + line reveal | ~ | Replaced by the 3-slide hero (steps 6–7) |
| Home: category index | ✓ | `CategoryIndex` |
| Home: bridal + GIA highlights | ✓ | Inline section in `Home.tsx` ("Every centre stone arrives with its GIA grading report…") |
| Home: bestsellers grid | ~ | Now `Treasured`, with tabs Bestsellers / New arrivals / Atelier exclusives |
| Home: dark rentals section | ✓ | Inline, eyebrow "Chapter VII · La Location", CTA "View the rental vault" |
| Home: heritage + quote | ✓ | Inline, attributed "Antonio Moretti · Second generation" |
| Category hero (EN + FR), price sort | ✓ | `Category.tsx` |
| Rentals "how renting works" strip | ✓ | 4 steps: "Reserve online or in salon" · "Fitting & ID verification" · "Insured courier delivery" · "Collected the next morning" |
| PDP: gallery zoom, metal swatches, rental options + deposit, engraving 18 chars, GIA card, specs, shipping notes, related pieces | ✓ | `Product.tsx` (`related` = same category); `pdp/Gallery.tsx` zoom |
| Atelier: story, 4 steps, form | ✓ | Its form shows "Merci. Our concierge will be in touch within one business day." |
| Bag drawer, persistence | ✓ | `CartDrawer`; `tns-cart`, `tns-currency` |
| Effects + reduced-motion handling | ✓ | See `motion-and-interaction.md` |
| Newsletter "thank-you" | ✗ | Today the Footer form only calls `preventDefault()`. There is no thank-you state |
| Placeholder names | ✓ still placeholder | Teresa Moretti (Atelier, Home), Antonio Moretti (Home quote), Marco (MakingScroll, Reviews) |

### Step 4 — Checkout page and image check

**Prompt (verbatim)**

> continue

**Response (summary)**

- **Images:** all 18 Unsplash links in the catalog now load.
- **Checkout** (`#/checkout`, `src/pages/Checkout.tsx`):
  - a Canada / United States toggle that changes the currency site-wide, and swaps province + postal code (`H3G 1K4`) for state + ZIP (`10001`);
  - an order summary showing metal or rental period and quantity, then subtotal, free insured shipping, tax and total;
  - Canadian tax by province, e.g. Québec GST + QST 14.975%, Ontario HST 13%, hard-coded;
  - US tax shown as "Calculated by Shopify" and left out of the total, with "duties prepaid";
  - **Place order** shows a "Merci" page with an order number and empties the bag. No payment is taken;
  - an empty bag shows a message and a link back to shopping.
- **Wiring:** a checkout link and `clearCart` were added to the store, the bag's checkout button became a link, and the route was added to `App.tsx`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| 18 images | ✓ | `IMG` has 18 entries |
| Checkout route, country toggle, postal/ZIP formats | ✓ | `Checkout.tsx` |
| Tax by province (QC 14.975%, ON 13%), US "Calculated by Shopify" | ✓ | `src/data/tax.ts`. Later also feeds the cart estimate and PriceBreakdown |
| Merci page + order number + clear bag | ✓ | Order number is `TS-` + the last 6 digits of `Date.now()` |
| Empty-bag guard | ✓ | |
| Later additions not in this step | — | Gift-card redemption at checkout, gift cards in the summary |

### Step 5 — Account and wishlist

**Prompt (verbatim)**

> there is no account icon and wishlist icon/page/system

**Intent & requirements**

- An account icon, an account page and an account system.
- A wishlist icon, a wishlist page and a wishlist system.

**Response (summary)**

- **Wishlist:**
  - a heart on every product card and product page, with a bounce on toggle and a gold fill when saved; on cards it doesn't navigate;
  - a header count, plus an entry in the mobile menu;
  - `#/wishlist`: a grid; "Add all to bag" using each piece's first metal and skipping rentals; "Copy link" (no shared lists, so it opens the viewer's own list); a sign-in note; an empty state that points to Rings;
  - stored in the browser.
- **Account:**
  - a person icon in the header, with a gold dot when signed in; hidden on the smallest screens but present in the mobile menu;
  - signed out: an image plus a form with "Sign in" / "Create account" tabs; create asks for name, email, password and a newsletter opt-in;
  - signed in: a "Bonjour" greeting, four boxes (orders, wishlist count, ring sizes, care & servicing), a Canada/US market choice, and sign out;
  - sign-in is not real: any credentials work and the account is browser-only.
- **Files:** `WishButton.tsx`, `Wishlist.tsx`, `Account.tsx`, plus edits to the store, Header, ProductCard, Product and App.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Hearts on cards and PDP, bounce, gold fill, no navigation | ✓ | `WishButton` (GSAP `elastic.out`); on the PDP it lives in `pdp/Gallery` |
| Header icons, counts, gold dot, mobile menu entries | ✓ | `Header.tsx` |
| Wishlist page features | ✓ / ~ | "Add all" now also skips personalized pieces and the gift card, but still adds rings without a size (KI-022). The page also has "Try your wishlist on" (added later) |
| Account signed-out / signed-in | ✓ / ~ | Later also has a gift-card wallet, a balance checker and a recently-viewed strip |
| Simulated auth, browser storage | ✓ still simulated | `tns-account`, `tns-wishlist` |

### Step 6 — Hero rebuilt as a slideshow

**Prompt (verbatim)**

> the hero section can be much better

**Intent**

A significantly better home hero.

**Response (summary)** — three-slide slideshow in `src/components/HomeHero.tsx`

- **Slides:**
  - "Collection Lumière": "Light, set by hand, since 1962." → Necklaces;
  - "Bridal": "A promise, certified to the facet." → Bridal;
  - "Rentals": "Borrow the vault for a night." → Rentals.
- **Navigation:** auto-advance every **7 s**, a gold progress line, and labels to jump between slides.
- **Headline:** much larger, with the middle line in gold italics and set in slightly. Lines slide up on entry.
- **Supporting elements:**
  - a three-column product-detail panel (piece, carat, grade or rental note);
  - a framed photo at top-right in a thin gold frame, with the piece name and slide number;
  - a sideways "Joailliers · Montréal · Est. 1962" label on the left edge;
  - a "Scroll" cue on the right.
- **Transitions:** the old headline lifts out, the new background wipes in from the right and settles from a slight zoom, and the framed photo wipes up.
- **Motion:**
  - on first load the image expands from a smaller frame;
  - mouse movement adds parallax;
  - scrolling drifts the background, fades the text up and lifts the frame.
- **Phones and tablets:** the framed photo, side label and product details are hidden.
- **Reduced motion:** no auto-advance and no movement effects.
- **Flagged:** the rentals slide's framed photo is the stock Mont-Royal pendant image, captioned "Gala Diamond Collar". Swap it for a real photo.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| 3 slides with this copy and these CTAs | ✓ | `SLIDES` in `HomeHero.tsx`. Eyebrows: `Collection Lumière · Automne`, `Chapitre V · Mariage`, `Chapitre VII · La Location`. CTAs: "Discover necklaces" / "Explore bridal" / "View rentals". Spec triplets: Rivière Saint-Laurent 12.40 ct F–G / VS · Notre-Dame Oval 1.82 ct E / VS1 · Gala Collar 18.20 ct From weekend |
| 7 s auto-advance, no advance under reduced motion | ✓ | `const DURATION = 7`, timeout skipped when `reduced` |
| Side label, "Scroll" cue | ✓ | `Joailliers · Montréal · Est. 1962`; `Scroll` + bouncing `ArrowDown` |
| Rentals inset uses the pendant photo | ✓ still unfixed | `inset: IMG.necklace1`, `insetLabel: 'Gala Diamond Collar'` |
| Hero height | — | `h-[calc(100svh-7rem)] min-h-[680px]` |

### Step 7 — Hero headline size and layout

**Prompt (verbatim)**

> the title in the hero section could be better layout and size

**Response (summary)**

- **Size:**
  - The headline now scales with viewport height as well as width, from about 3.4rem on phones to 10rem on large screens. It was previously a fixed 9.5rem.
  - It shrinks on short laptop screens.
  - Leading and tracking are tighter.
- **Layout:**
  - An editorial cascade: line 1 starts at the left edge, the gold italic middle line is indented most, and line 3 is indented slightly.
  - The middle line has a short gold rule in front of it and a slightly heavier weight.
  - A small gold "(01)" label sits beside line 1, matching the slide number.
  - The headline is limited to about 72% of the width on large screens, so it stays clear of the framed photo.
  - The gap above the description is tighter on phones.
- **Phones:** the rule and "(01)" are hidden, and the indents are smaller.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Height-aware size | ✓ / ~ | Now `clamp(3.4rem, min(10.5vw, 15.5vh), …)`; the upper bound is not re-checked against "10rem" |
| 72% max width | ✓ | `max-w-[72%]` |
| "(0n)" label | ✓ | `(0{i + 1})` |
| Cascade indents, gold rule, mobile simplifications | ✓ (not individually re-checked) | `HomeHero.tsx` |

### Step 8 — Nine new home sections

**Prompt (verbatim)**

> there can be more amazing and useful sections added in the homepage extending the homepage

**Intent**

Extend the home page with more compelling and useful sections.

**Response (summary)**

Nine new sections were added, each in `src/components/home/`:

1. **As seen in** (`PressStrip`): a slowly scrolling row of magazine and newspaper names under the hero.
2. **Gift finder** (`GiftFinder`):
   - budget runs from under $1,000 to $15,000+;
   - occasion is one of anniversary, for myself, for him, milestone;
   - shows up to 4 matches in the shopper's currency;
   - rentals and custom pieces are excluded;
   - when nothing matches, it points to the concierge.
3. **The Four Cs** (`FourCs`):
   - dark, with tabs for Cut, Color, Clarity and Carat;
   - each tab has an explanation and a grading scale, with the range the store sells highlighted in gold;
   - links to bridal and to booking a viewing.
4. **From bench to heirloom** (`MakingScroll`):
   - five steps: sketch, stone, casting, setting, polish;
   - on desktop it is pinned, and vertical scrolling moves it sideways with a gold progress line;
   - on phones and tablets it is a swipe row.
5. **Watches** (`WatchSpotlight`): a large Chronographe 1962 photo plus a numbered list of the 3 watches (thumbnail, case, movement, price).
6. **Reviews** (`Testimonials`):
   - a star rating;
   - quotes from Montréal, New York and Toronto that rotate every 6.5 s, with selector lines.
7. **Services** (`Services`):
   - six boxes: insured shipping, lifetime warranty, free engraving, free sizing, GIA certification, private appointments;
   - the shipping text differs for CA and the US.
8. **Worn in Montréal** (`SocialGrid`): a six-photo Instagram-style grid.
9. **Visit the salon** (`VisitSalon`): a photo plus address, hours and phone, with buttons for booking and Google Maps directions.

Page order at the time:
1. hero
2. as seen in
3. category index
4. gift finder
5. bridal
6. Four Cs
7. most treasured
8. bench to heirloom
9. rentals
10. watches
11. reviews
12. family quote
13. services
14. Instagram grid
15. visit the salon
16. footer

Placeholders flagged:
- The magazine names, the review quotes and "4.9 / 5 · 1,200+ reviews" are invented. Naming real publications when the store hasn't been featured could mislead.
- The @teresaandsons handle is invented, the photos are stock, and clicking a photo does nothing.
- The address, phone and hours are still placeholders.

A fade-in keyframe for the review quotes was added to `src/index.css`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| All 9 components exist and are mounted | ✓ | `src/pages/Home.tsx` |
| Gift finder options | ✓ | Budgets: `Under $1,000` · `$1,000 – $5,000` · `$5,000 – $15,000` · `$15,000 +`. Occasions: `Any occasion` · `Anniversary` · `For myself` · `For him` · `Milestone` |
| Testimonials: 6.5 s rotation, QC / NY / ON quotes | ✓ | `setInterval` 6500 ms |
| "4.9 / 5 · 1,200+ reviews", press names, quotes | ✓ still placeholder | Known issue KI-060 |
| SocialGrid @teresaandsons | ✓ | One link (the handle); the tiles themselves don't link |
| VisitSalon maps button | ✓ | `https://maps.google.com/?q=Rue+Sherbrooke+Ouest+Montreal` |
| Review-quote fade-in | ✓ | `@keyframes fadeUp` (also reused by UndoToast) |
| Page order | ~ | Re-ordered in step 9 and extended later; see the current order under step 9 |

### Step 9 — Home refinement pass

**Prompt (verbatim)**

> can homepage be more refined and polished

**Intent**

Polish and unify the home page.

**Response (summary)**

- **One heading system.** `SectionHeader`: chapter number, hairline, short label, then a large light serif title, with an optional right-hand link. All big titles share the same size, spacing and weight.
- **Numbered chapters.** The page reads as one sequence, **01–09**, from the category index to the Instagram grid.
- **Links.** A thin underline that sweeps in gold on hover, used everywhere (`.link-line`).
- **Spacing.** More even and slightly more generous.
- **Order:**
  - shopping comes earlier, with the category index and featured products right after "As seen in";
  - light and dark sections alternate;
  - a thin line separates the dark Visit-the-salon section from the dark footer.
- **Category index** (desktop):
  - a large list of names with French names, piece counts and an arrow;
  - hovering a row slides it, dims the others, and shows a category photo that follows the mouse;
  - phones and tablets keep the photo grid.
- **Most treasured:** tabs Bestsellers / New arrivals / Atelier exclusives with a sliding gold underline, plus "Explore all collections".
- **Bridal:** a second smaller framed photo overlapping the main one, a three-column GIA row, and buttons "Explore bridal" + "Design your own".
- **Rentals:** a bigger headline, a soft dark vignette around the photo, and a "Weekend · One week · One month" line.
- **Family quote:** a pull quote with a large gold quotation mark, with the photos on the right.
- **Image reveals:** the bridal and quote photos wipe upward as they scroll in (`data-reveal-img`) and then drift.

Files: `SectionHeader.tsx`, `CategoryIndex.tsx`, `Treasured.tsx`. The image reveal went into `useReveal.ts` and the underline style into `src/index.css`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| SectionHeader system, `.link-line`, `data-reveal-img` | ✓ | Shared well beyond home (PDP, gift cards, video) |
| Category index list with piece counts + mobile grid | ✓ | `CategoryIndex` (`index="01"`). Cursor-follow image not re-checked |
| Treasured tabs + "Explore all collections" | ✓ | `index="02"` |
| Bridal buttons | ✓ | "Explore bridal", "Design your own" |
| Rentals "Weekend · One week · One month" | ✓ | Inline section in `Home.tsx` |
| Divider between salon and footer | ✓ | `border-b border-white/10` in `VisitSalon` |
| Chapters 01–09 | ~ | `CategoryIndex` 01, `Treasured` 02 and `SocialGrid` 09 are still hard-coded. Sections added later (TryOnFeature, Shoppable videos, RecentlyViewed "—") sit outside or between that sequence |
| Current home order | — | Hero → PressStrip → CategoryIndex → Treasured → **TryOnFeature** → Bridal (inline) → FourCs → **ShoppableVideos** → GiftFinder → MakingScroll → WatchSpotlight → Rentals (inline) → Testimonials → Heritage quote (inline) → **RecentlyViewed** → Services → SocialGrid → VisitSalon. Bold = added after this step |

### Step 10 — PDP extended

**Prompt (verbatim)**

> there can be more amazing and useful sections added in the pdp extending the pdp

**Intent**

Extend the product page with more sections and buying aids.

**Response (summary)**

Main product area:
- **Ring size picker** (rings and bridal only): sizes 4–9 in half sizes, and required. Adding without a size turns the label red and scrolls back to the picker.
- **Size guide pop-up:** three measuring steps and a chart of diameter and circumference, plus mentions of the free ring sizer and in-salon sizing. The chosen size is saved on the bag line and shown in the bag.
- **Pay over time:** "or 4 interest-free payments of … with Shop Pay" for pieces over 400. Display only.
- **Extra buttons:** "Book a viewing" and "Ask a jeweller", both linking to the appointment page.
- **Fold-out panels** replace the plain spec list:
  - Details & dimensions, with a reference number;
  - Care & servicing;
  - Shipping & returns, worded differently for CA and the US;
  - Gift presentation.
- **Sticky bar:** slides up once the main CTA scrolls away. It shows the image, name, options, price and the CTA.

New sections below, in order:
1. **The collection story** (`CraftStory`): dark, with a photo, a story and four stats. Variants for bridal, watches and rentals, plus a general one.
2. **Complete the look:** the piece plus up to 2 matching pieces in a compatible metal, a set total, and "Add the set to bag". Hidden on rentals.
3. **Reviews:**
   - an overall rating, a star breakdown, fit and "would gift" notes;
   - verified reviews with "Show more reviews".
4. **Questions** (`ProductFAQ`): general questions plus extras for bridal, rentals and watches, with a concierge link.
5. **Also in this category:** with a "View all" link.
6. **Recently viewed:** the last 4 pieces viewed.

Placeholders flagged:
- The reviews are fake: a fixed set from a pool of 6, with generated counts. "Write a review" did nothing.
- Shop Pay is display only.
- The story stats and the FAQ answers are sample text.
- On rentals the section numbers skipped from 02 to 04.

Wiring: ring size support in `store.tsx` and `CartDrawer.tsx`; everything else in `src/pages/Product.tsx`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Ring sizes 4–9 by half sizes, with diameter and circumference | ✓ | `RING_SIZES` in `pdp/RingSize.tsx` (e.g. `['7', 17.3, 54.4]`). Gating via `needsSize` (rings and bridal) and `step-size` |
| Shop Pay line, `>= 400` | ✓ | Uses the display currency. Disappears for some USD/vermeil prices (see the product doc's gotchas) |
| Book a viewing / Ask a jeweller | ✓ | Both go to `#/atelier` |
| Panels | ✓ | 'Details & dimensions' · 'Care & servicing' · shipping (title and copy by currency) · 'Gift presentation' |
| Sticky bar | ✓ | `pdp/StickyBar` (`z-40`) |
| CraftStory variants | ✓ | `default`, `bridal`, `watches`, `rentals` |
| Complete the look hidden on rentals | ~ | It now **shows** on rentals, with "Reserve the ensemble". Its non-rental "Add the set to bag" skips configuration (KI-022) |
| Reviews | ~ | Now has a working write-a-review form persisted per product (`tns-reviews-<slug>`). Reviews are still synthetic, with "Verified purchase" badges (KI-060) |
| FAQ, Also in this category, Recently viewed | ✓ | `ProductFAQ`, `related`, `RecentlyViewed` |
| Section numbering gap on rentals | ✓ fixed later | `sectionOrder` + `num(id)` number only the rendered sections |
| Size on bag lines | ✓ | `CartLine.size`; "Size {n}" via `lineDetails` |

### Step 11 — Why "Complete the look" was hidden on rentals

**Prompt (verbatim)**

> why its hidden "Small inconsistency: on rental pages the complete-the-look section is hidden, so the section numbers skip from 02 to 04."

**Response (summary)** — an explanation; no code changed

Hiding it was deliberate. As built, the section would have misled on rental pages:

1. **It mixed renting and buying.** It would pair a $650 weekend rental with an $8,900 pair of earrings to *buy*. That isn't a look you can rent for an evening.
2. **The total would be wrong.** It summed purchase prices, and a rental's purchase price is its full retail value (the Gala Diamond Collar is $92,000). The total would show "$100,000+" instead of the rental cost.
3. **"Add the set to bag" would *buy* the rental piece,** because it added everything as a purchase with no rental period.

The skipped number was a side effect of section numbers being typed in by hand.

Figma Make offered two fixes and recommended both:
- (a) number the sections automatically;
- (b) build a rental version that pairs rental pieces, totals by period with one combined deposit, and adds a "Reserve the set" action.

**Design principle captured:** never show a total or an action that does something different from what it says. A wrong total or a mis-typed purchase is worse than hiding the section.

### Step 12 — Rental ensemble + automatic section numbering

**Prompt (verbatim)**

> do both

**Response (summary)**

**Rental version, "Complete the ensemble":**
- **Pairing:** a rental piece is paired with up to 2 *other rental* pieces, never with items for sale. Example: Gala Diamond Collar + Chandelier Sapphire Earrings + Bridal Tiara & Drops Set.
- **Prices:** each piece shows its rental price for the chosen period ("/ weekend"). The total sums rental prices, not retail values.
- **Deposit:** one combined deposit for the set, with the line "One fitting, one insured delivery, collected together."
- **Period switch:** the section has its own Weekend / 1 Week / 1 Month switch, synced both ways with the switch at the top of the page and with the sticky bar.
- **"Reserve the ensemble":** adds every piece as a rental for the same period. Purchase pages keep "Complete the look" / "Add the set to bag".

**Automatic numbering:** the PDP works out which lower sections will render and numbers them in order. Section components now receive their number as a prop. Recently viewed is always last, so its absence leaves no gap.

Files: `src/components/pdp/CompleteTheLook.tsx`, `src/pages/Product.tsx`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Rental ensemble, per-period totals, shared deposit line | ✓ | `CompleteTheLook` (`isRental` branch). Strings "One fitting, one insured delivery, collected together.", "Reserve the ensemble", "Weekend / 1 Week / 1 Month" |
| Synced period switch | ✓ | Shared `period` state from `Product.tsx` |
| Automatic numbering | ✓ | `sectionOrder` + `num(id)` |
| Current `sectionOrder` | — | `pricing`¹ → `story` → `films`¹ → `look` → `reviews` → `faq` → `related` → `recent` (¹ added in later steps) |
| Non-rental "Add the set to bag" | ~ | Still adds `{ slug, metal: metals[0] }` for each piece, with no size or personalization check (KI-022) |

### Step 13 — Recently viewed, store-wide

**Prompt (verbatim)**

> add recently viewed items system where suits

**Intent**

A recently-viewed system wherever it makes sense.

**Response (summary)**

- **Model:** one shared history in the store. Opening a PDP moves the piece to the front of the list.
  - The list keeps the **12** most recent pieces and survives reloads (device-local).
  - Old history stays compatible.
- **Clearing:** a "Clear history" link on full sections, an ✕ on compact lists.
- **Empty history:** the section renders nothing.
- **Placements:**

| Place | Form | Why |
|---|---|---|
| Home, before Services | "Continue where you left off", up to 4 cards | Returning visitors resume |
| PDP | Last section, excluding the current piece | Comparison |
| Category pages | After the grid | Cross-category recall |
| Empty wishlist | Short list "Pieces you looked at" | Something to save |
| Empty bag | Short list; clicking a piece closes the drawer | No dead end |
| Empty checkout | Short list | Same reason |
| Account | Last 5 pieces | Overview |

- **Compact lists** show an image, name, collection and price in the current currency. Rentals show their weekend price.
- **PDP detail:** the PDP checks *once, on open,* whether there was other history. The section therefore doesn't pop in while the shopper reads, and its number stays right.
- **Files:** `src/components/RecentlyViewed.tsx` (shared) and `src/store.tsx` (history). The old `src/components/pdp/RecentlyViewed.tsx` was removed.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| 12-item history, most recent first | ✓ | `recordView` in `src/store.tsx`; `tns-recent` |
| Full section + compact strip | ✓ | `RecentlyViewed` (default) and `RecentlyViewedStrip` (named) |
| Placements | ✓ | Home (`index="—"`, "Welcome back" / "Continue where you left off"), Product, Category, Wishlist, CartDrawer, Checkout, Account (limit 5). The full **Cart page** (added later) also uses the strip |
| "Check once on open" | ✓ | `const [hadHistory] = useState(() => recent.some((s) => s !== slug))` |
| Old pdp/RecentlyViewed.tsx removed | ✓ | Not in the tree |

### Step 14 — PDP refinement (top of page)

**Prompt (verbatim)**

> can pdp be more refined and polished

**Intent**

Polish the purchase area of the product page.

**Response (summary)**

**Gallery** (`pdp/Gallery.tsx`):
- **Thumbnails:** a column on the left on desktop, with a gold underline on the active one; dash indicators on phones.
- **Zoom:** hovering with a mouse zooms about **1.8×** around the pointer. There is no tap zoom on touch screens.
- **"Detail" view:** a tighter crop of the main photo. It is not a new photo; real close-up shots will look better here.
- **Controls:** a counter ("01 / 03 · Front"), previous and next arrows, and a full-screen button. In full screen, the arrow keys and Escape work. The image fades when you switch views.
- **On the image:** the wishlist heart, plus the product label (e.g. "Bestseller") at top left.
- **Sticky:** on desktop the gallery stays in view while you scroll.

**Info panel:**
- **Breadcrumb:** a bar reading "Maison / Category / Product", with the reference number on the right.
- **Availability** (gold dot): "In stock · ships within 48 hours", "Made to order · approx. 8 weeks" or "Available for reservation".
- **Title area:** collection and chapter in small capitals, a larger and lighter title, and the tagline.
- **Rating:** stars with a review count that smooth-scrolls to the reviews. It uses the same made-up rating as the reviews section.
- **Price block:** set between hairlines, with one supporting line:
  - purchases: Shop Pay instalments, then "Duties prepaid" (US) or "Taxes calculated at checkout" (CA);
  - rentals: "per weekend / week / month", the deposit, and "insurance included".
- **Description:** more line spacing.

**Options:**
- **Numbered steps** (01, 02, 03) for only the steps that apply. Rings: Metal → Ring size → Engraving.
- **Rental periods** are cards, each showing its own price.
- **Metal buttons** show a swatch plus the full metal name.
- **Engraving:** a 0/18 counter and a live preview on a band coloured like the chosen metal.

**Buttons & trust:**
- **CTA:** includes the price, e.g. "Add to bag — $3,200 CAD". After a click it turns gold and reads "Added to bag" for about 2 s.
- **Trust row:** three columns: shipping (CA/US wording), lifetime warranty, gift presentation.
- **GIA card:** restyled as a certificate, with a framed border, a large "GIA", the report number and the five grades side by side.
- **Entrance:** the panel contents fade in one after another.

Files: `Gallery.tsx`, a rewrite of the top of `Product.tsx`, step numbers in `RingSize.tsx`, and `Reviews.tsx` now shares its rating figures.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Gallery: 1.8× zoom, Front/Detail views, arrows, full screen | ✓ | `pdp/Gallery.tsx` (lightbox at `z-[95]`, Escape and arrow keys) |
| Breadcrumb "Maison", availability lines | ✓ | Strings in `Product.tsx`, incl. `Made to order · approx. ${product.leadTimeWeeks} weeks` |
| Price sub-lines | ✓ | "Duties prepaid" / "Taxes calculated at checkout" / "insurance included" |
| Header rating | ~ | The star row always renders 5 filled stars whatever the rating; the count excludes the shopper's own reviews (product doc gotchas) |
| "Added to bag" ~2 s | ✓ | 2200 ms timer |
| Entrance stagger | ✓ | `data-pdp-in` (13 elements), respects reduced motion |
| Book a viewing / Ask a jeweller | ✓ | Both → `#/atelier` |

### Step 15 — Rental date-time booking + personalization

**Prompt (verbatim)**

> on the rental pdp there could be custom date-time selector as well for date choosing for rental and this system. and on the personified items pdp there could be personification section/system like name on jewelry things like that

**Intent & requirements**

- Rentals: a custom date and time picker and a booking system.
- Personalizable items: a personalization system, e.g. a name on jewelry.

**Response (summary)**

**Rental booking** (`pdp/RentalCalendar.tsx`):
- **Calendar:** a month grid, Monday first, up to **6 months** ahead. Today has a gold dot.
- **Booking rules:**
  - **2 days'** notice.
  - Reserved dates are crossed out.
  - A start date is selectable only if *every* day of the rental is free.
- **Range preview:** hovering shows 3 / 7 / 30 days with the first and last days marked, and it follows period changes immediately.
- **Delivery method:** insured courier delivery and collection, or a fitting at the Sherbrooke salon.
- **Time slot:** 4 windows between 09:00 and 19:00 (one in the evening for galas), labelled "Delivery window" or "Fitting time".
- **Summary:** the delivery date and time, a gold line, then the collection date "by 12:00". It turns red with an explanation if a period change makes the dates clash.
- **Gating:** "Reserve" needs a date and a slot. The missing step turns red and the page scrolls to it.
- **Ensemble:** uses the same dates and checks that each piece is free. It names an unavailable piece and suggests another date.

**Personalization** (`pdp/Personalizer.tsx`), on 3 products:

| Product | Choice | Preview |
|---|---|---|
| Engraved Nameplate Necklace | Name, 2–10 letters, accents allowed (Sofia, Zoé, O'Neil); optional diamond accent +$180 CAD (USD converted); chain length | Gold lettering on a chain, with a sparkle when the accent is on |
| Initial Disc Pendant | One letter from an A–Z grid; chain length | Gold disc with the engraved letter |
| The Teresa Signet | Up to 3 initials, set in capitals | Oval signet face with the monogram |

- **Lettering:** Script, Serif or Block. Script uses **Pinyon Script**, a new Google font added to `src/index.css`. The preview follows the metal colour.
- **Checks:** a character counter and a red message for characters that can't be engraved.
- **Price:** the accent is included in the CTA, the sticky bar and the bag.
- **Proof note:** a digital proof is emailed before cutting, and personalized pieces are final sale. This is a note only; no proof is sent.
- **Reverse engraving:** the disc and the signet keep the normal field as "Reverse engraving"; the nameplate drops it.
- **Wishlist:** "Add all to bag" now skips personalized pieces.
- **Bag and checkout** list every option, e.g. "Weekend rental · Fri, Mar 14 → Mon, Mar 17 · Courier · 17:00 – 19:00" and "“Sofia” · Script · 18 in · Diamond accent".
- **Placeholder flagged:** the reserved dates are made-up fixed blocks counted from today. Before launch they need a real booking calendar or Shopify rental app.
- **Files:** `RentalCalendar.tsx`, `Personalizer.tsx`, `src/components/lineDetails.ts`. Data and rules live in `src/data/catalog.ts`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Calendar 6 months, Monday first, 2-day lead | ✓ | `MONTHS_AHEAD = 6`, `RENTAL_LEAD_DAYS = 2` |
| Booked dates | ✓ placeholder | `getBookedDates(slug)` hash blocks; the signed `>>` bug leaves some pieces with none (KI-033) |
| Slots | ✓ | `RENTAL_SLOTS`: `09:00 – 11:00` · `11:00 – 13:00` · `14:00 – 16:00` · `17:00 – 19:00` |
| Labels "Delivery window" / "Fitting time", "by 12:00" | ✓ | `RentalCalendar.tsx` |
| Booking validation gate | ✓ | `isBookingValid`, the `step-dates` scroll target |
| Personalization configs | ✓ | `personalization` on `engraved-nameplate-necklace`, `initial-disc-pendant`, `teresa-signet` in `src/data/catalog.ts` |
| Fonts Script / Serif / Block + Pinyon Script | ✓ | `PersonalizationFont`; Google Fonts import |
| Proof note (verbatim) | ✓ | "A digital proof is emailed for your approval before we cut. Personalized pieces are final sale." |
| Accent pricing in USD | ✓ / ~ | `toUSD(180)` = 130, but the catalog spec still reads "Diamond accent +$180" in USD (KI-034) |
| Option lines in bag and checkout | ✓ | `lineDetails()`; checkout joins with " · " |
| Ensemble per-piece availability message | ✓ (wording not re-checked) | `CompleteTheLook` |

### Step 16 — "View on you" virtual try-on

**Prompt (verbatim)**

> there could be "view on you" system in pdp and more places of its cta to try items live on camera

**Intent & requirements**

- A live-camera try-on on the PDP.
- Try-on CTAs in more places across the store.

**Response (summary)**

A try-on studio that opens from **8 places**. It was not tested with a real camera.

**How it works, and its main limit:**
- **No tracking.** Shoppers place the piece by hand: drag to move, pinch or scroll to resize, two-finger twist to rotate, plus sliders and arrow buttons. A dashed head-and-shoulders or hand outline helps line it up. Automatic tracking would need a large face/hand-tracking library; Figma Make offered it as a next step.
- **Drawings, not photos.** Pieces are vector illustrations in the chosen metal colour, not cut-outs of product photos, which have backgrounds. Stone colours follow the piece (emerald, sapphire, pearl).
- **Five shapes:** necklace, earrings, ring, bracelet and watch, each with per-piece details: collar, drop/hoop, signet, tennis, cuff.
- **Personalized text:** a nameplate or monogram shows the shopper's own text.
- **Coverage:** **25 of 27** products can be tried on. The gift card and the heirloom redesign service can't.

**Studio:**
- **Camera:** the front camera starts for earrings and necklaces, the back camera for rings, bracelets and watches. Shoppers can switch cameras and mirror the image.
- **No camera:** if access is declined or unsupported, a photo upload replaces it, with a message explaining why.
- **Earrings** get an extra spacing slider.
- **Live metal switching**, plus a grid of other pieces alongside.
- **Shutter:** saves a PNG with a "Teresa & Sons · Montréal" mark, with retake or save.
- **Buying:** simple pieces get "Add to bag". Rentals, personalized pieces and rings link to their PDP as "Choose dates" / "Personalize this piece" / "Choose size & options". A "book a viewing" link is always there.
- **Privacy and closing:** a note says nothing is uploaded. Closing the studio stops the camera, and page scroll is paused while it's open.

**Entry points:**

| Place | Form |
|---|---|
| Home | New dark "See it on you" section after "Most treasured", with a "Start virtual try-on" button |
| Every product card | "Try on" pill on the image (on hover with a mouse; always visible on touch) |
| PDP gallery | "View on you" pill |
| PDP details | Full-width "View on you" button under add-to-bag, using the chosen metal and personalized text |
| Sticky bar | Camera icon |
| Category | "Try this collection on", next to the sort |
| Wishlist | "Try your wishlist on", limited to saved pieces |
| Bag | "View on you" link on each item |

**Testing notes:**
- Browsers allow the camera only on https, and the preview panel may block permission, so use upload or the published site.
- Proportions are approximate, and the studio says so on screen.
- Nameplate lettering in saved photos may fall back to another font.

**Files:** `src/components/tryon/` (lazy-loaded) and `src/components/home/TryOnFeature.tsx`. Eligibility comes from `tryOnKind` in `src/data/catalog.ts`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Studio, manual placement, drawings, 5 kinds | ✓ | `TryOnStudio`, `JewelryOverlay`. See `features/virtual-try-on.md` |
| 25/27 eligible | ✓ | `tryOnKind` returns `null` for /gift card\|redesign/ |
| Camera facing, upload fallback, spacing slider, PNG mark, privacy note | ✓ | — |
| Config routing | ✓ / ~ | `needsConfig` also includes **custom** pieces, which is stricter than described |
| Entry points | ✓ | `TryOnFeature` (`solid`, "Start virtual try-on"), `ProductCard` (`chip` "Try on"), `pdp/Gallery` (`chip`), `pdp/StickyBar` (`icon`), `Category` (`link` "Try this collection on"), `Wishlist` ("Try your wishlist on"), `CartLineItem` (`link`), PDP configurator. Later also `VideoViewer` (`chip` "Try on") |
| Lazy chunk | ✓ | `lazy(() => import('./TryOnStudio'))`, about 22 kB |
| Face/hand tracking | ✗ (not requested later) | Still manual placement |

### Step 17 — Review photos & videos + shoppable films

**Prompt (verbatim)**

> there could be images and videos be added on pdp review section. and then there can be added shopable video section in the homepage and can be in more places if suits

**Intent & requirements**

- Customer photos and videos in PDP reviews.
- A shoppable video section on Home, and in more places where it fits.

**Response (summary)**

**Reviews with media** (`pdp/Reviews.tsx`, rewritten):
- **Media wall:** "Client photos & videos" with counts. The first tile is larger, and the last tile shows "+N".
- **Per review:** photo and video thumbnails, with a play icon on videos.
- **Filters:** All / With photos & videos / 5 stars. "Show more" reveals 3 more at a time.
- **Full-screen viewer:** the media with the review alongside (stars, title, text, name, verified badge), a strip of all client media, and arrow keys.
- **Write a review form:** a star rating, headline, review, name and city, plus up to **6** photos or videos (videos under **60 MB**). Each preview can be removed.
- **Submitted reviews:** shown at the top as "You" and "Pending moderation". Photos are shrunk and saved in the browser. Videos last only for the session, because storage is too small.

**Shoppable films:**
- **Links:** each film is tagged with 1–3 products.
- **Tile row:** sideways-scrolling tall tiles. Each film plays muted while mostly visible, and not at all under reduced motion. A tile shows the handle, title and a product card with its price, plus "+1" when more pieces are tagged.
- **Player:** full screen, with swipe or arrows to move between films, progress bars, mute and play/pause.
- **Tagged pieces:**
  - Desktop: a side panel with "Add to bag" and "Try on". Configurable pieces get "Select options", which goes to the PDP.
  - Phones: a row of cards over the video.

**Where the films appear:**

| Place | What |
|---|---|
| Home | "Seen in motion", all 10 films, after the Four Cs |
| PDP gallery | A "Film" view after the main photo, when a film features the piece |
| PDP sections | "See it in motion": this piece's films first, then the category's. Auto-numbered; omitted when empty |
| Category | "Worn & filmed" |
| Atelier | "At the bench", a dark row of the brand's own films |

**Footage:** all free Mixkit stock (engagement rings, a ring box, bracelets, polishing, a vitrine, gold ingots). Every video and poster was checked to load, but none shows the actual products. For example, the "Notre-Dame Oval" film shows a generic ring. Replace them before launch.

**Placeholders flagged:**
- The reviews and client media are samples: reused catalogue images and stock clips.
- Submitted reviews are browser-only, so a real reviews service is needed.
- Film handles such as "@claire.weds" are invented.

**Files:** `src/data/media.ts`, `src/components/video/`, `src/components/pdp/Reviews.tsx`.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Media wall, filters, show more, viewer, write-a-review (6 files, 60 MB), "You" / "Pending moderation" | ✓ | `Reviews.tsx`. Persistence key `tns-reviews-<slug>`, which grows unbounded with data-URL images (KI-062) |
| 10 films + tile/player behaviour | ✓ | `VIDEOS`, `ShoppableVideos`, `VideoViewer`, `useInViewPlay` |
| Home "Seen in motion" after Four Cs | ✓ | — |
| PDP gallery "Film" view | ✓ | `'Film'` view in `pdp/Gallery.tsx` (`videosForProduct`) |
| PDP "See it in motion" section | ✓ | `films` entry in `sectionOrder` |
| Category "Worn & filmed", Atelier "At the bench" | ✓ | — |
| Stock footage, invented handles | ✓ still placeholder | — |

### Step 18 — "Pricing breakdown" (first, misread attempt)

**Prompt (verbatim)**

> there can be a pricing breakdown system/section in pdp

**Response (summary)** — work in progress, then redirected

"Taxes are shared now. Next, the breakdown section." The planned section was a *payment and price* breakdown: a composition bar, line items, a tax estimate by province, a payment-plan calculator, and a separate rental version. The tax rates had already been moved to a shared module.

**Note:** this was a misunderstanding. Step 19 clarifies that the owner wanted a *cost* breakdown of the jewellery itself. The lasting outcome of this step is the shared tax module, `src/data/tax.ts`.

### Step 19 — Jewellery cost breakdown ("The price, itemised")

**Prompt (verbatim)**

> pricing breaddown system/section means a jewelry's cost breakdown so customer can see what each component in that jewelry are and what are their prices and what are making charges and texes so customer can see complete cost breakdown of any jewelry

**Intent & requirements**

Full price transparency. Each component of the piece, with its price, plus the making charges and the taxes.

**Response (summary)**

A new section, **"The price, itemised"**: a full cost breakdown covering components, making charges, margin and taxes. The maths was checked for all **21** for-sale pieces, and each one adds up exactly to its price.

**Invented figures, flagged:**
- Gram rates of about $82/g (18k gold) and $48.60/g (platinum).
- The hourly bench rate, stone values, weights and percentages.

Showing costs and margin is a public claim, so it must be built from real costs before launch.

**Groups** (example: Notre-Dame Oval Solitaire):

| Group | Lines |
|---|---|
| Materials | Platinum 950 · 4.6 g × 48.60/g · Pt950 · 95.0% platinum. Centre diamond · Oval · 1.82 ct · E / VS1 · GIA №1449286107. Hidden halo diamonds · 0.12 ct |
| Making charges | Bench work · 14 h × 95/h · Montréal atelier. Stone setting (hand-set under microscope). Polishing & hallmarking |
| Certification & services | GIA grading report. Insured shipping & presentation box. Engraving (Included). Lifetime care plan (Included) |
| Selected options | Diamond accent, when chosen on the nameplate |
| Maison margin | Shown openly as its own line |
| Taxes & duties | CA: a province picker with each tax on its own line (QC: GST 5% + QST 9.975%). US: a state picker, sales tax "at checkout", import duties "Prepaid" |
| Total | Tax included for CA; before sales tax for the US |

**Method:**
- **Metal:** weight from the specs (e.g. 9 g for the signet) or a category default, × the per-gram rate of the chosen alloy. Switching metal updates it live.
- **Stones:** from the GIA report and specs. Value is split by carats, with the centre diamond weighted highest.
- **Watches:** show the movement, case and strap instead of stones.
- **Labour:** bench hours × the hourly rate, plus setting and polishing. Plain-metal pieces get more labour.
- **Margin:** the remainder, with a **12% floor**; stone estimates are scaled down if needed. It runs 12–44% across the catalogue, except the plain platinum wedding band at 58%.

**Section UI:**
- **Composition:** a total plus a coloured bar that fills as you scroll to it, with each group's % share and amount. It also shows metal weight and bench hours.
- **Itemised list:** grouped, with subtotals and a detail line under each item.
- **Live updates:** reacts to the chosen metal, the personalization add-on and the currency.
- **Rental version:**
  - lists what the fee pays for (the piece, insurance, cleaning and re-certification, courier both ways);
  - adds tax on the fee;
  - shows the deposit as a card *hold*, not a charge.
- **Price-block link:** "See full cost breakdown", or "What the fee covers" on rentals.
- **Excluded:** the bespoke commission, the heirloom redesign and the gift card, whose prices are deposits or services.

**Files:** `src/data/costing.ts`, `src/components/pdp/PriceBreakdown.tsx`. Tax rates moved to `src/data/tax.ts`, shared with checkout.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Section and title | ✓ | `title={<>The price, <em>itemised</em></>}`; `pricing` is first in `sectionOrder` |
| Rates | ✓ | `METAL_RATE`: 18k yellow **82.4**, white **84.1**, rose **81.9**, platinum **48.6**, vermeil **1.6** ($/g, CAD); `LABOUR_RATE_CAD = 95` |
| Margin floor 12% | ✓ / ~ | `floor = base * 0.12`. Rounding can leave it just under 12% (e.g. Pearl Stud Gift Set USD 11.9%) |
| Eligibility | ✓ | `hasCostBreakdown = p.metals.length > 0 && !/commission\|redesign/i.test(p.name)` |
| Groups, Prepaid / at checkout, deposit "hold, not a charge" | ✓ | `PriceBreakdown.tsx` |
| Price-block links | ✓ | "See full cost breakdown" / "What the fee covers" |
| Shared tax module | ✓ | `src/data/tax.ts` (`PROVINCES`). Split taxes can differ by $1 from the cart's combined rounding (KI-027) |
| Invented cost data | ✓ still placeholder | Must be replaced with real costs before going public |

### Step 20 — Gift card system (Shopify-compatible)

**Prompt (verbatim)**

> they also sells their gift cards as well so build that system as well (compatible to shopify)

**Intent & requirements**

A complete gift-card system, compatible with Shopify.

**Response (summary)**

Built the full flow: buy, send, check balance, redeem at checkout. It is modelled on Shopify's native gift cards.

**Simulation boundary.** On Shopify, codes, balances and recipient emails would all come from Shopify. Here they're simulated per browser, and no emails are sent. A demo card is included: **TERE SASO NS19 62MT** ($250 CAD).

**Page** (`#/gift-cards`; the old gift-card product link now opens it). A 4-step builder with a tilting live preview:
- **Design:** Travertine, Espresso, Vermeil, Mont-Royal.
- **Amount:** $100 / 250 / 500 / 1,000 / 2,500 / 5,000, or a custom amount ($50–$10,000 CAD, $50–$7,500 USD).
- **Delivery:** email, or a physical card mailed free in the travertine box.
- **Recipient:** for me or for someone else. Fields: name, email, an optional "Send on" date up to a year ahead, a 200-character message and a "from" name.
- **Quantity:** up to 20.
- **Below the builder:** "How it works", a balance checker, a corporate-gifting panel and an FAQ.

**Checkout:**
- Enter 16-character codes. Several cards can be combined, and each shows what it covers and what remains.
- Rules, matching Shopify:
  - gift cards being bought aren't taxed (only jewellery is);
  - a card can pay for jewellery and tax, but not for other gift cards;
  - digital-only orders skip the shipping address;
  - when cards cover the whole order, the button reads "Place order — no payment due".
- On confirmation, used cards are debited and new cards are issued. Each new card is shown with its code and delivery.

**Elsewhere in the store:**
- Bag and order-summary lines show the design, delivery, recipient and send date.
- Account has a gift-card wallet with balances, plus the balance checker.
- The Gifts category has a gift-card banner.
- "Gift Cards" appears in the header, the mobile menu and the footer.
- Wishlist "Add all" skips gift cards.

**Shopify wiring:**
- `src/lib/shopify.ts` maps each gift-card line to the cart-add request, using Shopify's native recipient properties.
- The variant IDs are placeholders.
- Custom amounts use the $1-card × amount workaround.
- Nothing is sent: the payload is only printed to the console when an order is placed.

**Assumption to confirm.** A card bought in one currency converts at the fixed rate when spent in the other. Shopify issues single-currency cards, so check the store's Markets setup.

**Files:** `src/data/giftcards.ts`, `src/pages/GiftCards.tsx`, `src/components/giftcard/`. `src/pages/Checkout.tsx` was rewritten.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Page, builder, designs, amounts, ranges, delivery, recipient, send-on ≤ 365 days, 200-char message, qty ≤ 20 | ✓ | `GiftCards.tsx`, `DENOMINATIONS`, `CUSTOM_RANGE`, `DESIGNS`. See `pages/gift-cards.md` |
| Demo card | ✓ | `TERESASONS1962MT` is always prepended to the ledger, and also gets persisted after any checkout |
| Checkout: codes, combine, rules, "Place order — no payment due", issue/debit | ✓ | `Checkout.tsx` (`needsShipping`, `issueCards`, `debitCards`) |
| Header currency toggle during checkout | ~ | Doesn't re-convert applied cards; only the in-page toggle does (KI-024) |
| Wallet, balance checker, gifts banner, wishlist skip | ✓ | Account, `BalanceChecker`, Category (`slug === 'gifts'`), Wishlist |
| Shopify payload | ✓ console only | `toShopifyCartItem` → `console.info` in `placeOrder`. Placeholder IDs `44100000001`–`16` and `…099` |
| Header "Gift Cards" link | ~ | Moved into the mega menu in step 21 |

### Step 21 — Gift Cards moved into the mega menu

**Prompt (verbatim)**

> gift cards button in the header can be shifed into collections mega menu

**Intent**

Take Gift Cards out of the header bar and put it in the Collections mega menu.

**Response (summary)**

- **New position:** Gift Cards is now the last item in the mega menu, under a thin divider. It has a small gold card icon, the same large serif lettering as the categories, and the note "From $100 · never expires".
- **Hover:** shows the Gifts description, featured gifts and images.
- **Header bar:** now shows Collections · Bridal · Rentals · Atelier.
- **Unchanged:** the mobile menu and footer links stay.
- **File:** `src/components/Header.tsx`.

**Status in current code**

✓ All present:
- the mega-menu entry with the gradient mini card;
- the "From $100 · never expires" caption;
- `setActive(gifts)` on hover;
- exactly 4 desktop nav items.

The "From $100" copy conflicts with the custom minimum of $50 and with the catalog's "$250 – $10,000" (KI-032).

### Step 22 — Cart drawer fixed and rebuilt; full cart page

**Prompt (verbatim)**

> clicking on cart icon in the header doing nothing isn't cart side-drawer and cart page are built if not implement them top notch if already built then refine and polish them more and add more things in them

**Intent & requirements**

- Fix the bag icon.
- Make a "top notch" cart drawer and full cart page, with more features.

**Response (summary)**

**Root cause of the dead icon.** The drawer *was* opening but stayed off-screen. Its inline slide-out position was read by the animation library as a fixed pixel distance, while only a percentage offset was animated. The fix replaced that animation with plain CSS transitions.

**Drawer** (`src/components/CartDrawer.tsx`, rewritten):
- **Behaviour:** slides in, locks page scroll, focuses the close button and closes on Escape. It is announced as a dialog and can't be focused when closed.
- **Header:** item count and a progress bar toward a **free care kit** (spend $1,000 CAD / $750 USD).
- **Lines:** picture (or gift-card art), details, quantity control, **Edit**, **Save for later** (moves the item to the wishlist), "View on you" and **Remove**. An **Undo** notice appears after removal.
- **"Pairs beautifully with":** quick-add for pieces that need no options. Rings, bridal, custom and personalised pieces link to their PDP instead.
- **Gifting:** free gift wrap with a handwritten message (≤ 200 characters), a gift receipt that hides prices, and an order note.
- **Footer:** subtotal, shipping and tax notes, a Shop Pay "4 payments" line, **Secure checkout**, **View full bag**, and insured-shipping and 30-day-returns badges.
- **Empty state:** category and gift-card links, plus recently viewed.

**Cart page** (`src/pages/Cart.tsx`, `#/cart`):
- Larger rows, **Clear bag** and the same gifting options.
- A promises panel: insured delivery, returns, lifetime care, certification.
- A sticky summary that splits jewellery from gift cards, with a CAD tax estimate by province (gift cards untaxed), an estimated delivery date and the checkout button.
- A 4-up recommendations grid and recently viewed underneath.

**Shared:**
- Reusable parts live in `src/components/cart/`.
- The store gained remove-with-undo and persisted gift options and order note (`CartMeta`). Clearing after an order also resets them.

**Not connected.** Checkout doesn't read the gift wrap, receipt, message or note. They're shaped for Shopify's cart note and attributes, but nothing sends them.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| Drawer: CSS transitions, focus, Escape, dialog, inert | ✓ | `duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`, `aria-modal`, `aria-hidden`/`inert`. No focus trap or restore (KI-041) |
| Reward progress | ✓ | `REWARD_THRESHOLD = { CAD: 1000, USD: 750 }` in `useCartTotals.ts` |
| Line actions: Edit, Save for later, View on you, Remove + Undo | ✓ | `CartLineItem`, `UndoToast` (6 s). The `+` button clamps qty to 10 (KI-023) |
| Upsell "Pairs beautifully with" | ✓ | `CartUpsell`: a rail in the drawer, `layout="grid" limit={4}` on the page |
| Gifting options | ✓ | `GiftOptions` → `CartMeta`. Not read by checkout (KI-031) |
| Footer: Secure checkout, View full bag, Shop Pay, 30-day returns | ✓ | `CartDrawer.tsx` |
| Cart page: Clear bag, promises, "Jewellery" vs gift cards, Est. tax, grid | ✓ | `Cart.tsx`. Estimated-delivery wording not re-checked. Copy promises "promo codes at checkout", which don't exist (KI-029) |

### Step 23 — Auto-open drawer and "Go to bag"

**Prompt (verbatim)**

> the cart drawer should auto opens when someone click add to bag and when the item is in the bag then add to bag button should be converted to go to bag clicking on which should open cart drawer

**Intent & requirements**

- Adding to the bag auto-opens the drawer.
- When the item is already in the bag, the CTA becomes **"Go to bag"**, which opens the drawer.

**Response (summary)**

- **PDP CTA:** "Add to bag" adds the item and slides the drawer open.
- **"Go to bag" switch:**
  - Once *that exact configuration* is in the bag, the CTA becomes "Go to bag" (bag icon + arrow) and opens the drawer.
  - The match covers metal, size, engraving, personalization text, and rental period and dates.
  - Changing any choice reverts the CTA to "Add to bag".
- **Sticky bar:** follows the same logic.
- **Feedback:** "Added to bag" shows briefly, then the CTA becomes "Go to bag".
- **Store helper:** a small helper in `src/store.tsx` identifies lines the same way the cart does.
- **Other add buttons:** they already open the drawer through the store. Only the PDP button switches to "Go to bag".
- **Overlays:** the video viewer and try-on studio still show "Added" briefly. A "Go to bag" there would have to close the overlay first. Figma Make offered to do that; it is still an open item.

**Status in current code**

| Item | Status | Note |
|---|---|---|
| `addToCart` opens the drawer | ✓ | `setCartOpen(true)` inside `addToCart`. Never add a second `setCartOpen` |
| "Go to bag" on PDP + sticky bar | ✓ | `inBag` is computed from `configured` via the exported `lineKey`; StickyBar uses `label={inBag ? 'Go to bag' : ctaLabel}` |
| Exact-configuration matching | ✓ / ~ | Works, but `lineKey` is order-sensitive and treats `accent: false` differently from an absent accent (KI-012) |
| Overlay "Go to bag" (video viewer, try-on) | ✗ open | Adds from these overlays still open the drawer *underneath* them (`z-[90]` vs `z-[100]`/`z-[110]`) |

## End of supplied history

The owner supplied steps 1–23 on 2026-10-15. [../design-intent.md](../design-intent.md) distils them into the owner's intent.

## Related docs

- [../design-intent.md](../design-intent.md) — what the owner wants and why, distilled from this log
- [../product-overview.md](../product-overview.md) — the features as they exist now
- [../known-issues.md](../known-issues.md) — defects referenced above (KI-xxx)
- [../README.md](../README.md) — knowledge-base map
