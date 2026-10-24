# Brand, voice & copywriting

Teresa & Sons is presented as a family jewellery house in Montréal, founded in 1962 by Teresa Moretti, with a salon and atelier at 1420 rue Sherbrooke Ouest that sells to Canada (CAD) and the United States (USD). Since 2026-10-21 every user-facing string exists in English (Canadian, with US spelling derived for the US market) and in French (Canada), declared next to its component with `bilingual()` (`src/i18n`); the catalog's French is in `src/data/catalog.fr.ts`. There is no CMS, and brand facts, policies and microcopy are still repeated across components. The voice is editorial, understated and expert: on the English site, English body copy with French accents; on the French site, French throughout. A "chapter" metaphor runs through the catalogue, Montreal place names name the collections, and specs and pricing are stated openly. This document records the English copy verbatim (the French and the language system are in [features/languages.md](features/languages.md)) and lists every inconsistency found.

Scope: every user-facing string in `src/**/*.{ts,tsx}`, which covers all of `src/pages/`, `src/components/` and `src/data/`, plus `src/store.tsx`. It also covers `.link-line` and the font roles in `src/index.css`, `.figma/make/site.json`, and the `figmaSiteConfiguration` plugin in `vite.config.ts` (page title and meta tags).

> **Reading conventions.** Text in `code` is verbatim and character-exact, including ’ – — · × and accents. `<em>…</em>` marks the gold italic accent inside a heading. `{…}` marks an interpolated value. "CSS-uppercased" means the source text is mixed case but a Tailwind `uppercase` class renders it in capitals.
>
> **Where bare file names live:**
> - Pages: `src/pages/`
> - `src/components/`: `Header`, `Footer`, `CartDrawer`, `HomeHero`, `Price`, `ProductCard`, `RecentlyViewed`, `WishButton`, `lineDetails`
> - `src/components/home/`: `CategoryIndex`, `FourCs`, `GiftFinder`, `MakingScroll`, `PressStrip`, `SectionHeader`, `Services`, `SocialGrid`, `Testimonials`, `Treasured`, `TryOnFeature`, `VisitSalon`, `WatchSpotlight`
> - `src/components/pdp/`: `Accordion`, `CompleteTheLook`, `CraftStory`, `Gallery`, `Personalizer`, `PriceBreakdown`, `ProductFAQ`, `RentalCalendar`, `Reviews`, `RingSize`, `StickyBar`
> - `src/components/cart/`: `CartLineItem`, `CartUpsell`, `GiftOptions`, `RewardProgress`, `UndoToast`, `useCartTotals`
> - `src/components/giftcard/`: `BalanceChecker`, `GiftCardArt`
> - `src/components/tryon/`: `TryOnButton`, `TryOnProvider`, `TryOnStudio`, `JewelryOverlay`
> - `src/components/video/`: `ShoppableVideos`, `VideoViewer`
> - `src/data/`: `catalog`, `media`, `giftcards`, `costing`, `tax`

---

## 1. Brand facts (as stated in code)

### 1.1 Identity and marks

| Element | Verbatim | Where |
|---|---|---|
| House name | `Teresa & Sons` (written `Teresa &amp; Sons` in some JSX text) | throughout |
| Wordmark | `Teresa <em>&amp;</em> Sons`: Baskervville capitals, the compact lockup (owner, 2026-10-22): `text-[17px] uppercase tracking-[0.08em]` (19 px from `sm`, 21 px from `xl`) on one line; the ampersand is the italic in `text-[var(--gold-vermeil)]` | `src/components/Header.tsx` |
| Wordmark subline | `Montréal &middot; Est. 1962` (spec face, 8 px with `tracking-[0.28em]`, 9 px with `[0.4em]` from `sm`, uppercase, taupe) | `Header.tsx` |
| Gift-card wordmark | `Teresa <em>&amp;</em> Sons` in tracked capitals (ampersand in the design's `accent` colour) over `Carte-cadeau · Montréal` | `src/components/giftcard/GiftCardArt.tsx` |
| Hero side label | `Joailliers · Montréal · Est. 1962` (vertical, `tracking-[0.5em]`) | `src/components/HomeHero.tsx` |
| Legal entity | `© {new Date().getFullYear()} Teresa &amp; Sons Joailliers Inc.` | `src/components/Footer.tsx` |
| Markets line | `Shipping to Canada (CAD) &amp; United States (USD)` | `Footer.tsx` |
| Footer watermark | `Teresa &amp; Sons` at `text-[16cqi] font-light text-white/[0.06]`, spanning the footer's column | `Footer.tsx` |
| Web domain | `teresaandsons.com` (only in the gift-card FAQ item `where`) | `src/pages/GiftCards.tsx` |
| Social handle and hashtag | `@teresaandsons`; `Follow #PorteTeresa` | `src/components/home/SocialGrid.tsx`, `src/data/media.ts` |
| Newsletter name | `La lettre` (footer eyebrow) / `La Lettre` (registration checkbox) | `Footer.tsx`, `src/pages/Account.tsx` |
| Try-on photo mark | `Teresa & Sons · Montréal`, drawn on the canvas in Baskervville | `src/components/tryon/TryOnStudio.tsx` `capture()` |
| Product reference | ids `tns-nk-001` … `tns-cs-003` are shown as `Ref. TNS-NK-001` (`product.id.toUpperCase()`) and as a `Reference` row | `src/data/catalog.ts`, `src/pages/Product.tsx` |
| Order number | `Order TS-{last 6 digits of Date.now()}` | `src/pages/Checkout.tsx` `placeOrder` |
| Demo gift card | `TERESASONS1962MT`, hinted as `Demo card: TERE SASO NS19 62MT` | `src/data/giftcards.ts` `DEMO`, `src/components/giftcard/BalanceChecker.tsx` |
| Site metadata | `.figma/make/site.json` sets the `title` and `description` (both below), `language: "en-CA"` and `robots.index: false`. `Routes` in `src/App.tsx` retitles each page as `{Page} — Teresa & Sons`: the category or piece name, `Wishlist`, `Gift Cards`, `Your Account`, `Your Bag`, `Checkout`, `The Atelier`, `Chapter not found`, `Piece not found`. | `.figma/make/site.json`, `src/App.tsx` (`headFor`) |

`site.json` `title` (the Home tab title and `og:title`):

> `Teresa & Sons — Fine Jewellery in Montréal since 1962`

`site.json` `description` (injected as `<meta name="description">` and `og:description`; category and product pages swap in their own description at runtime):

> `A family maison of fine jewellery on rue Sherbrooke Ouest since 1962: GIA-certified diamonds, bridal, gold heirlooms and rentals, set by hand in Montréal.`

### 1.2 Founder story and family

The story, verbatim:

- `src/pages/Atelier.tsx` eyebrow: `L'Atelier · Since 1962`. H1: `Made <em>for you</em>, by a family.` Body:
  > `Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls.`
- `HomeHero.tsx` slide 1 headline lines: `Light, set` / `by hand,` / `since 1962.` Body: `Three generations of Montréal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke.`
- `src/pages/Home.tsx` heritage block: eyebrow `08 Chapter IX · Sur Mesure`, then a decorative `“`, then `Teresa believed a jewel should <em>outlive</em> its maker.`, attributed `Antonio Moretti · Second generation`. CTA: `Commission a piece`.
- `catalog.ts` `teresa-signet`: tagline `Our founder’s ring, recast.`; description `An oval signet modelled on Teresa’s 1962 original — ready for a monogram or crest.`
- `catalog.ts` `chronographe-1962`: tagline `For the year we opened our doors.`; description `A limited chronograph of 62 pieces with a panda dial.`; spec `Edition: '62 pieces'`.
- `src/components/home/MakingScroll.tsx` step 01: `Every piece begins in graphite at Teresa’s original drafting table.`
- `src/components/pdp/CraftStory.tsx` default body ends with `…and leaves only when it is worthy of the family name.` One stat is `1962` / `Family atelier`.
- `Account.tsx` signed-out: `Welcome to the <em>family</em>.` Register heading: `Join the maison.`
- `src/components/home/Testimonials.tsx`: `Every visit felt like family.`

| Person | What the copy says | Source |
|---|---|---|
| Teresa Moretti | Founder. Opened "a single bench on rue Sainte-Catherine in 1962". | `Atelier.tsx` |
| "her sons" | "continue the work". The number of sons and their names are **not stated**. | `Atelier.tsx` |
| "granddaughter" | Continues the work. Unnamed. | `Atelier.tsx` |
| Antonio Moretti | `Second generation`. Quoted about Teresa. | `Home.tsx` |
| Marco | `Each claw raised and tightened under the microscope by Marco.`; a client review says `Marco even sent a photo before shipping.` His relationship to the family is not stated. | `MakingScroll.tsx`, `src/components/pdp/Reviews.tsx` `POOL` |
| Unnamed roles | `our master setter`, `Our setter`, `our in-house horologist` / `our horologist`, `gemmologist sign-off`, `the maker`, `our team` | `Home.tsx`, `HomeHero.tsx`, `media.ts`, `WatchSpotlight.tsx`, `CraftStory.tsx`, `catalog.ts`, `PriceBreakdown.tsx`, `GiftOptions.tsx` |

"Three generations" (HomeHero) is consistent with Teresa, her sons and her granddaughter, but no generation is mapped to a person except Antonio as "Second generation".

### 1.3 Places, salon and contact

| Fact | Verbatim | Where |
|---|---|---|
| Salon address (one line) | `1420 rue Sherbrooke Ouest, Montréal, QC H3G 1K4` | `src/components/home/VisitSalon.tsx` |
| Salon address (block) | `1420 rue Sherbrooke Ouest` / `Montréal, QC H3G 1K4` / `Canada` (inside `<address>`) | `Footer.tsx` |
| Short form | `1420 Sherbrooke O.` (salon hand-off option) | `src/components/pdp/RentalCalendar.tsx` |
| Other references to the salon | `our Sherbrooke Street salon` (Header announcement, GiftCards hero); `In salon on Sherbrooke` (Services); `our Montréal salon` (GiftCards FAQ); `our Montreal salon` (gift-card product description); `our bench on rue Sherbrooke` (CraftStory, Atelier step 4); `Behind the glass on rue Sherbrooke.` (video caption) | various |
| Original location | `rue Sainte-Catherine in 1962` | `Atelier.tsx` |
| Opening hours (long) | `Tuesday – Saturday, 10h – 18h · Sunday by appointment` | `VisitSalon.tsx` |
| Opening hours (short) | `Tue–Sat · 10h–18h` | `Footer.tsx` |
| Concierge responsiveness | `Can’t find your answer? Our concierge replies within the hour, Tuesday to Saturday.` | `src/components/pdp/ProductFAQ.tsx` |
| Visit availability | `Private visits`: `In the salon on Sherbrooke, by video or by phone, Tuesday to Sunday.` | `src/components/home/Services.tsx` |
| Appointment reply | `Merci. Our concierge will be in touch within one business day.` | `Atelier.tsx` (form success) |
| Phone | `+1 514 555 0162` (spec face in VisitSalon) | `VisitSalon.tsx`, `Footer.tsx` |
| Email address | **None.** No email address appears anywhere in the copy. | — |
| Directions | `Get directions` links to `https://maps.google.com/?q=Rue+Sherbrooke+Ouest+Montreal` (the query has no street number) | `VisitSalon.tsx` |
| Walk-ins | `Appointments recommended, walk-ins always welcome.` | `VisitSalon.tsx` |
| Postal-code example | Checkout placeholder `H3G 1K4`, the salon's own postal code; the US placeholder is `10001` | `Checkout.tsx` |
| Rental courier cities | `…delivered by courier in Montreal, Toronto and New York.` | `catalog.ts` `gala-diamond-collar` |
| Other Montreal places in copy | `Old Montreal` and `Mont-Royal` (video captions), `Saint-Laurent` (Earrings category), plus the collection names in §2.3 | `media.ts`, `catalog.ts` |

### 1.4 Positioning statements

| Statement | Surface | File |
|---|---|---|
| `Light, set` / `by hand,` / `since 1962.` | Hero slide 1 | `HomeHero.tsx` |
| `Three generations of Montréal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke.` | Hero slide 1 body | `HomeHero.tsx` |
| `From everyday gold to GIA-certified bridal — each piece made or curated in Montréal.` | The Index aside | `src/components/home/CategoryIndex.tsx` |
| `Made <em>for you</em>, by a family.` | Atelier H1 | `Atelier.tsx` |
| `From <em>bench</em> to heirloom` | Making section | `MakingScroll.tsx` |
| `Teresa believed a jewel should <em>outlive</em> its maker.` | Heritage quote | `Home.tsx` |
| `A promise, <em>certified</em> to the last facet.` and the hero variant `A promise,` / `certified` / `to the facet.` | Bridal | `Home.tsx`, `HomeHero.tsx` |
| `Borrow the <em>vault</em> for an evening.` and the hero variant `Borrow the` / `vault` / `for a night.` | Rentals | `Home.tsx`, `HomeHero.tsx` |
| `The <em>Four Cs</em>, explained by a jeweller.` | Diamond education | `src/components/home/FourCs.tsx` |
| `Time, <em>kept</em> beautifully.` plus `Swiss timepieces regulated by our in-house horologist, with complimentary case-back engraving and a five-year service plan.` | Watches | `src/components/home/WatchSpotlight.tsx` |
| `See it <em>on you</em>, before it’s yours.` | Try-on feature | `src/components/home/TryOnFeature.tsx` |
| `Come <em>sit</em> with us.` plus `An espresso, a velvet tray, and as much time as you need. Appointments recommended, walk-ins always welcome.` | Salon | `VisitSalon.tsx` |
| `Notes from the <em>atelier</em>, four times a year.` | Newsletter | `Footer.tsx` |
| `The price, <em>itemised</em>` plus `Every gram, every stone and every bench hour behind this piece, with our margin shown openly.` | Cost breakdown | `src/components/pdp/PriceBreakdown.tsx` |
| `Begin with something that will outlast the occasion.` | Empty bag | `src/components/CartDrawer.tsx`, `src/pages/Cart.tsx` |
| `The gift of <em>choosing</em>.` (also the gift card's tagline `The gift of choosing.`) | Gift cards | `GiftCards.tsx`, `catalog.ts` |

### 1.5 Services

| Service | Verbatim copy | Where |
|---|---|---|
| Bespoke commissions | Product `Bespoke Engagement Commission`, tagline `Designed with you, from the first sketch.`, description `Private consultation, CAD renders, wax model and hand-setting. Price shown is a starting deposit.` Specs: `Process: 'Consult → sketch → CAD → wax → set'`, `Consultation: 'In salon or virtual'`. Atelier steps (below). PDP CTA `Begin commission`. | `catalog.ts`, `Atelier.tsx`, `Product.tsx` |
| Atelier process | `Consultation`: `An unhurried conversation in our salon or by video, with sketches made in front of you.` `Stone sourcing`: `We present a curated selection of GIA-certified diamonds and coloured gems.` `CAD & wax`: `Precise 3D renders, then a wax model you can try on before we cast.` `Hand-finishing`: `Cast, set and polished at our bench on rue Sherbrooke, then hallmarked.` | `Atelier.tsx` `steps` |
| Heirloom redesign | `Heirloom Redesign`, tagline `Old stones, new stories.`, description `We reset and reimagine inherited stones and gold into a new piece.` Specs `Includes: 'Appraisal, design, recast'`, `Service: 'Gold reclaimed where possible'`. | `catalog.ts` |
| Appraisal | Appears **only** inside the Heirloom Redesign spec above. There is no standalone appraisal service. | `catalog.ts` |
| Repairs | Only the unlinked footer item `Care & Repairs` and the Atelier interest option `Watch service` | `Footer.tsx`, `Atelier.tsx` |
| Engraving and personalization | `Free engraving`: `Hand or laser engraved, up to 18 characters.` PDP label `Engraving — complimentary` (18-character limit). Personalizer footnote: `A digital proof is emailed for your approval before we cut. Personalized pieces are final sale.` | `Services.tsx`, `Product.tsx`, `src/components/pdp/Personalizer.tsx` |
| Sizing | `Complimentary sizing`: `One resize within the first year, on us.` Also `One complimentary resize within the first year.` and `Prefer certainty? We’ll mail a complimentary ring sizer anywhere in Canada or the U.S., or size you in our salon.` Account tile `Ring sizes`: `Save your sizes for faster checkout and gifting.`, CTA `Book a sizing`. | `Services.tsx`, `src/components/pdp/RingSize.tsx`, `Account.tsx` |
| Lifetime care | `Lifetime warranty`: `Annual cleaning, claw checks and rhodium refresh.` `Lifetime care`: `Free annual cleaning, inspection and claw re-tightening at the atelier.` `Lifetime cleaning & inspection on every piece`. Care accordion: `Store separately in the pouch provided. Remove before swimming or applying lotions. Bring it to our salon each year for complimentary ultrasonic cleaning, claw inspection and polishing.` Account tile `Care & servicing`: `Complimentary cleaning and inspection, every year.` | `Services.tsx`, `Cart.tsx`, `Header.tsx`, `Product.tsx`, `Account.tsx` |
| Watch service | `…regulated by our in-house horologist, with complimentary case-back engraving and a five-year service plan.` FAQ: `Each watch carries the manufacturer’s international warranty plus our own five-year service plan, including one complimentary regulation.` Category description: `…serviced by our horologist.` | `WatchSpotlight.tsx`, `ProductFAQ.tsx`, `catalog.ts` |
| Jewellery rentals | Category description `High jewelry for galas, weddings and premieres — insured, delivered, returned.` Steps: `Reserve online or in salon`, `Fitting & ID verification`, `Insured courier delivery`, `Collected the next morning`. Periods: Weekend / One week / One month. Hand-offs: `Insured courier` (`Delivered & collected`) and `Salon fitting` (`1420 Sherbrooke O.`). | `catalog.ts`, `src/pages/Category.tsx`, `Product.tsx`, `RentalCalendar.tsx` |
| Private visits | The booking drawer (`VisitFlow`): reasons, ways to meet (salon, video, phone), times, pieces to prepare; the confirmation reads `We’re expecting you, {name}.` See `features/legacy-redesign.md`. Video visits are mentioned in a review (`Booked a video appointment…`, a customer’s words). | `src/components/visit/VisitFlow.tsx`, `Reviews.tsx` |
| Gifting | `Gift wrapping`: `Travertine box, silk ribbon, handwritten card`, tag `Free`. `Gift receipt`: `Prices hidden on the packing slip`, tag `Free`. `Order note`. Gift Finder. Gift cards. Corporate gifting: `Ordering ten or more cards, or cards with your company’s design? Our concierge will prepare a bespoke quote.` | `src/components/cart/GiftOptions.tsx`, `src/components/home/GiftFinder.tsx`, `GiftCards.tsx` |
| Virtual try-on | `Essayage virtuel`: `Open your camera and place earrings, necklaces, rings, bracelets and watches on yourself — in every metal. Save a photo to share, or bring it to your appointment.` | `TryOnFeature.tsx` |
| Newsletter | `Notes from the <em>atelier</em>, four times a year.`; `Receive La Lettre and private sale invitations` | `Footer.tsx`, `Account.tsx` |
| Care-kit reward | `{amount} away from a complimentary jewellery care kit.` / `Unlocked: a complimentary jewellery care kit is included with your order.` The threshold `REWARD_THRESHOLD = { CAD: 1000, USD: 750 }` is never stated as a number in the copy. | `src/components/cart/RewardProgress.tsx`, `src/components/cart/useCartTotals.ts` |

### 1.6 Promises and policies (all verbatim variants)

| Topic | Variants, with the surface each appears on |
|---|---|
| Shipping, Canada | PDP accordion (CAD): `Complimentary insured shipping across Canada, 2–3 business days, signature required. Returns accepted within 30 days on non-personalized pieces.` Services: `Complimentary across Canada, signature required.` PDP trust row: `Free insured` / `shipping in Canada`. Drawer: `Complimentary insured shipping across Canada`. Checkout: `Orders ship insured via signature-required courier.` FAQ: `Canadian orders ship free in CAD.` |
| Shipping and duties, US | PDP accordion (USD): `Complimentary insured shipping to the United States, 3–5 business days. Duties and import fees are prepaid — nothing due on delivery. 30-day returns on non-personalized pieces.` Services: `Complimentary to the U.S., duties prepaid.` Trust row: `Duties paid` / `shipping to the U.S.` Drawer: `Complimentary insured shipping to the U.S., duties included`. PDP price line: `Duties prepaid`. Checkout: `Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required.` FAQ: `Yes. U.S. orders are priced in USD and shipped insured with duties and import fees prepaid — there is nothing to pay on delivery.` PriceBreakdown: `Import duties & customs fees`, `CUSMA-qualifying, cleared by Teresa & Sons`, `Prepaid`. |
| Shipping, both markets | Header: `Complimentary insured shipping across Canada & the United States`. Cart: `Insured, signature delivery`: `Shipped in discreet packaging and fully insured until it is in your hands.` Drawer badge: `Fully insured`. Checkout row: `Insured shipping` / `Complimentary`. PDP: `In stock · ships within 48 hours`. Cart: `Order today, arrives by {date}` (4 business days in any market; shown only when the bag has merchandise and no rental). |
| Returns and final sale | Cart: `30-day returns`: `Complimentary returns on unworn pieces. Engraved and custom work is final sale.` Drawer badge: `30-day returns`. FAQ: `Non-personalized pieces may be returned within 30 days in original condition. Engraved, resized or made-to-order pieces are final sale, though we will always work with you to make it right.` Personalizer: `Personalized pieces are final sale.` Gift-card FAQ: `Gift cards are non-refundable, except where required by law. Pieces bought with a gift card are refunded to a new gift card.` |
| Certification | Every diamond, with no threshold (owner decision, 2026-10-22). Header: `Every diamond accompanied by its GIA report`. Services: `GIA certified`: `Every diamond comes with its report.` FAQ: `…Every diamond includes its original GIA report.` Cart: `Certified & conflict-free`: `Every stone traceable, and every diamond with its GIA report.` `HOUSE.natural`: `We set natural diamonds only, each with its GIA report.` The designer's specification: `2 × {ct} ct · {shape} · GIA reports` for a three-stone ring's side diamonds. Home bridal: `Every centre stone arrives with its GIA grading report and is hand-set in platinum or 18k gold by our master setter.` |
| Grading standard | `We only set stones graded Excellent or Very Good by the GIA, then hand-check each for symmetry.` `Graded from D (colourless) to Z. Our bridal stones begin at G, where a diamond appears icy-white to the eye.` `Inclusions are nature’s fingerprints. We select VS2 or better, so nothing is visible without a 10× loupe.` `Weight, not size. A well-cut 1.00 ct can look larger than a poorly cut 1.20 ct — which is why we prioritise cut first.` Legend: `Teresa & Sons standard`. Home spec list: `Cut` `Excellent`, `Color` `D – G`, `Clarity` `IF – VS2`. |
| Sourcing and metal | Bridal FAQ: `All diamonds are sourced in compliance with the Kimberley Process and our suppliers adhere to the System of Warranties. Canadian-mined stones are available on request.` `Hand-selected GIA diamonds and ethically sourced coloured gems.` `Recycled 18k gold and platinum, alloyed and cast in Montreal.` CraftStory stat `100%` / `Recycled gold`. Video caption `Every ingot we cast is reclaimed and refined.` |
| Authenticity | `Every piece is hallmarked with our maker’s mark and metal purity, and arrives with a Teresa & Sons certificate of authenticity.` |
| Warranty and care | `Lifetime warranty` (Services). `Lifetime` / `warranty & care` (trust row on **every** PDP). `Lifetime care plan`: `Annual cleaning, claw checks, polish`, `Included` (PriceBreakdown). Watches: manufacturer warranty plus `five-year service plan`; CraftStory stat `5 yr` / `Service plan`. |
| Gift presentation | `Every piece arrives in our signature travertine box with a linen pouch, care card and an optional handwritten note. Gift receipts never show prices.` Trust row: `Signature` / `gift presentation`. `Every order arrives in our signature box. Add finishing touches below at no charge.` `Every gift arrives in our travertine box with a handwritten card.` `Thoughtful pieces, wrapped in our signature travertine box.` `Matched in metal and proportion, presented together in one travertine box.` |
| Payments | `Or 4 interest-free payments of {Price} with Shop Pay`: on the PDP only when `amount >= 400`; in the cart and drawer always. FAQ: `Yes — Shop Pay Installments lets you split your purchase into four interest-free payments, or monthly plans on orders over $1,000, subject to approval.` Checkout: `Payment is completed securely through Shopify Checkout.` |
| Taxes | `Taxes calculated at checkout` (PDP in CAD, drawer). `Est. tax` (Cart in CAD). `Tax` / `Calculated at checkout` (Cart in USD). `Sales tax` / `Calculated by Shopify` (Checkout in USD). `At checkout` / `Calculated at checkout from your ZIP code` (PriceBreakdown in USD). `Gift cards are not taxed.` `Gift cards are not taxed at purchase and cannot be paid for with another gift card.` |
| Rentals | `Refundable deposit {Price} · insurance included`. FAQ: `A refundable deposit is pre-authorised on your card at reservation and released within 48 hours of the piece being returned and inspected.` `Card pre-authorisation · released within 48 h of return`. `Every rental is fully insured. Minor wear is expected and covered; we only ask that loss or significant damage be reported within 24 hours.` `Tax applies to the rental fee only. The deposit is a hold, not a charge.` Notice: `{RENTAL_LEAD_DAYS} days’ notice`, which renders as `2 days’ notice`. Stats: `100%` `Insured`, `24h` `Courier delivery`, `3` `Rental periods`, `0` `Hidden fees`. |
| Gift cards | `No expiry, no fees`. `Never expires.` `never expires` (Header, Category banner, balance result). FAQ: `Never. There are no fees or expiry dates, in line with Québec and provincial consumer protection law.` `Cards are issued in the currency you buy them in. If redeemed in the other market, the balance converts at the rate shown at checkout.` `Yes. Add as many cards as you like at checkout; any remaining balance stays on the card for next time. Gift cards cannot be used to buy other gift cards.` `Email cards can be resent from your order confirmation. For physical cards, contact us with your order number and we will reissue the remaining balance.` |
| Privacy (try-on) | `Private — nothing leaves your device`. `{guide}. Your camera feed stays on this device.` `Processed entirely on your device. Nothing is recorded or uploaded. The rendering is an illustration — proportions are approximate.` |
| Reviews | `Reviews are moderated before they appear publicly.` |
| Accounts | `Accounts are managed through Shopify Customer Accounts.` |

### 1.7 Social proof

- **Press** (`src/components/home/PressStrip.tsx`, marquee titled `As seen in`): `Vogue`, `ELLE Québec`, `The Globe and Mail`, `Harper’s Bazaar`, `La Presse`, `Town & Country`, `Montreal Gazette`, `Brides`. The section's `aria-label` is `As seen in`, matching the visible label.
- **Aggregate claim**: `4.9 / 5 · 1,200+ reviews`, hard-coded in `Testimonials.tsx`.
- **Testimonials** rotate every 6500 ms. Attributions are `Camille R.` · `Outremont, QC` · `Heirloom Redesign`; `Daniel K.` · `Brooklyn, NY` · `Notre-Dame Oval Solitaire`; `Priya S.` · `Toronto, ON` · `Gala Diamond Collar`.
- **PDP reviews** (`Reviews.tsx`): a seven-entry `POOL`. Authors are named as first name plus last initial (`Élodie M.`), locations as `City, PROV`. The rating is seeded per slug: `getRatingSummary` returns `4.7`–`4.9` and a count of `18`–`157`. The sidebar also shows `Fit` / `True to size` and `Would gift` / `98%`.
- **Video handles** (`media.ts`): `@teresaandsons`, `@claire.weds`, `@mtl.style`, `@priya.s`, `@danielk`.

---

## 2. Naming system

### 2.1 Categories: English name, French name and roman-numeral chapter

All of this lives in `CATEGORIES` in `src/data/catalog.ts`. The `eyebrow` field holds the roman numeral.

| `eyebrow` | `name` | `french` | `slug` | `description` |
|---|---|---|---|---|
| I | Necklaces | Colliers | `necklaces` | `Pendants, rivières and chains drawn in 18k gold, worn close to the heart.` |
| II | Earrings | Boucles d'oreilles | `earrings` | `Studs, drops and huggies that catch the light of the Saint-Laurent.` |
| III | Bracelets | Bracelets | `bracelets` | `Tennis lines, cuffs and bangles, built to be stacked and inherited.` |
| IV | Rings | Bagues | `rings` | `Signets, cocktail rings and everyday bands, hand-finished in our atelier.` |
| V | Bridal Jewelry | Mariage | `bridal` | `GIA-certified engagement rings and wedding bands for a lifetime of vows.` |
| VI | Watches | Montres | `watches` | `A curated selection of Swiss timepieces, serviced by our horologist.` |
| VII | Jewelry Rentals | Location | `rentals` | `High jewelry for galas, weddings and premieres — insured, delivered, returned.` |
| VIII | Gifts | Cadeaux | `gifts` | `Thoughtful pieces, wrapped in our signature travertine box.` |
| IX | Personalized & Custom | Sur mesure | `custom` | `From sketch to setting — bespoke commissions and engraved heirlooms.` |

Where these fields render:

- Category hero: `Maison / Chapter {eyebrow}`, then H1 `{name}` followed by `<em>{french}</em>` (italic, champagne), then `{description}`.
- CategoryIndex rows: numeral, name, italic French name, and `{n} pieces`.
- Mega menu: numeral, name, and the French name on hover. The panel shows `Chapter {eyebrow}` with the description, and `Shop {name} →`.
- Mobile menu: numeral and name. Footer `Shop` column: names only.
- Desktop menu, Shop panel: numeral and name, plus the French name on the active row when it fits. The preview shows `Chapter {eyebrow} · {french}`, the description, `{n} pieces · from {price}` (rentals add ` a weekend`) and `Shop {name}`.
- PDP: eyebrow `{product.collection} · Chapter {eyebrow}`. The related-pieces section uses eyebrow `Chapter {eyebrow}` and title `Also in <em>{name}</em>`.
- Category video rail eyebrow: `{name} · in motion`.

### 2.2 Chapter references hard-coded outside `CATEGORIES`

| Text | File | Differs from the data? |
|---|---|---|
| `03 Chapter V · Mariage` | `Home.tsx` (bridal editorial) | No |
| `Chapter VII · La Location` | `Home.tsx` (rentals) | French name adds the article ("La") |
| `07 Chapter VI · Horlogerie` | `WatchSpotlight.tsx` | French word differs (data has `Montres`) |
| `08 Chapter IX · Sur Mesure` | `Home.tsx` (heritage) | Capital M (data has `Sur mesure`) |
| `Chapitre V · Mariage` | `HomeHero.tsx` slide 2 | French "Chapitre" |
| `Chapitre VII · La Location` | `HomeHero.tsx` slide 3 | "Chapitre" and "La Location" |
| `La pièce` | `HomeHero.tsx` featured-piece label | French label |
| `Partager` · `Un petit indice` | `ShareSheet.tsx` eyebrows (share and hint modes) | French labels |
| `Nine chapters` | `CategoryIndex.tsx` | The count is written as a word, not computed |
| `This chapter could not be found.` | `Category.tsx` (unknown slug) | — |

All of these eyebrows are CSS-uppercased, so the case differences cannot be seen on screen. The words themselves (Chapter/Chapitre, Montres/Horlogerie) do show.

### 2.3 Collections, places and products

`product.collection` is the small spec-face eyebrow on product cards and in the bag. It also drives the CraftStory eyebrow `The {collection} story`. The code never states that these names are places. The "Evidence in code" column lists only what the code itself says; anything in *(gloss)* is general knowledge, not code.

| Collection | Evidence in code | Product: tagline | First badge |
|---|---|---|---|
| Mont-Royal | Video caption `A campfire proposal on Mont-Royal.`; also a gift-card design name | Mont-Royal Solitaire Pendant: `A single round brilliant, suspended.` | Bestseller |
| Saint-Laurent | Earrings description `…catch the light of the Saint-Laurent.` | Rivière Saint-Laurent: `A river of graduated diamonds.` | Atelier Exclusive |
| Plateau | None | Plateau Paperclip Chain: `The everyday link.` | New |
| Vieux-Port | None *(gloss: "Old Port")* | Vieux-Port Diamond Studs: `The classic pair, matched by hand.` | Bestseller |
| Outremont | Testimonial location `Outremont, QC` | Outremont Pearl Drops: `South Sea light, softly swinging.` | New |
| Mile End | None | Mile End Huggies: `Pavé, hinged, effortless.` | — |
| Westmount | None. Used as product shorthand: `…her Westmount line…` | Westmount Tennis Bracelet: `Fifty diamonds, one unbroken line.` | Bestseller |
| Atwater | None | Atwater Cuff: `Sculpted, hammered, hand-signed.` | — |
| Griffintown | Tagline `Industrial roots, refined.` | Griffintown Chain Bracelet: `Industrial roots, refined.` | New |
| Sherbrooke | The salon's street (`rue Sherbrooke Ouest`) | Sherbrooke Emerald Cocktail Ring: `Colombian green, framed in light.` | Limited |
| Laurier | None | Laurier Stacking Band: `Thin, bright, endlessly stackable.` | — |
| Notre-Dame | Tagline `A cathedral setting for an oval.` | Notre-Dame Oval Solitaire: `A cathedral setting for an oval.` | Bestseller |
| Basilique | None *(gloss: "basilica")* | Basilique Three-Stone: `Past, present, future.` | Atelier Exclusive |
| Heritage | The founder, not a place (`Our founder’s ring…`) | The Teresa Signet: `Our founder’s ring, recast.` | Bestseller |
| Promesse | Not a place *(gloss: "promise")* | Promesse Wedding Band: `Comfort fit, forever.` | — |
| Swiss Selection | Functional | Heritage Automatic 38: `Swiss movement, Montreal-regulated.` (New); Chronographe 1962: `For the year we opened our doors.` (Limited); Dame du Lac: `Mother-of-pearl, diamond bezel.` (—) | — |
| Rental Vault | Functional ("the vault") | Gala Diamond Collar: `Red carpet, by the weekend.` (Atelier Exclusive); Chandelier Sapphire Earrings: `Ceylon blue, borrowed for the night.` (—); Bridal Tiara & Drops Set: `Something borrowed.` (Bestseller) | — |
| Gifts under $1,000 | Functional; the `$` is hard-coded | Initial Disc Pendant: `One letter, endlessly personal.` (Bestseller); Pearl Stud Gift Set: `Freshwater pearls, boxed and ribboned.` (—) | — |
| Gift Cards | Functional | Teresa & Sons Gift Card: `The gift of choosing.` | — |
| Sur Mesure | Category French name `Sur mesure` | Bespoke Engagement Commission: `Designed with you, from the first sketch.` (Made to Order); Heirloom Redesign: `Old stones, new stories.` (Made to Order) | — |
| Personalized | Functional | Engraved Nameplate Necklace: `Your name, in our script.` | Made to Order |

Each place-named collection holds exactly one product, all in the necklaces, earrings, bracelets, rings and bridal categories. Watches, rentals, gifts and custom use functional collection names.

### 2.4 Product-name conventions

- **Case and script.** Names are Title Case. Hyphenated French place names keep their hyphens and accents in the name (`Rivière Saint-Laurent`, `Vieux-Port`). Slugs are ASCII kebab-case with accents removed (`riviere-saint-laurent`).
- **Patterns:**
  - Collection + stone or style + type: `Mont-Royal Solitaire Pendant`, `Vieux-Port Diamond Studs`, `Outremont Pearl Drops`, `Westmount Tennis Bracelet`, `Griffintown Chain Bracelet`, `Sherbrooke Emerald Cocktail Ring`, `Laurier Stacking Band`, `Notre-Dame Oval Solitaire`, `Promesse Wedding Band`, `Plateau Paperclip Chain`.
  - Collection + type: `Mile End Huggies`, `Atwater Cuff`, `Basilique Three-Stone`.
  - French titles: `Rivière Saint-Laurent`, `Chronographe 1962`, `Dame du Lac`.
  - Founder piece, with an article: `The Teresa Signet`.
  - Watch with case size: `Heritage Automatic 38` (spec `Case: '38 mm'`).
  - Descriptive names for rentals, gifts and services: `Gala Diamond Collar`, `Chandelier Sapphire Earrings`, `Bridal Tiara & Drops Set`, `Initial Disc Pendant`, `Pearl Stud Gift Set`, `Teresa & Sons Gift Card`, `Bespoke Engagement Commission`, `Heirloom Redesign`, `Engraved Nameplate Necklace`.
- **Slugs that differ from the name:** `teresa-signet`, `sherbrooke-emerald-cocktail` (no "ring"), `basilique-emerald-cut-three-stone`, `bridal-tiara-and-drops` (& becomes "and", no "set").
- **Short forms used in copy:**  `a Notre-Dame oval` and `the Gala Collar` (testimonials); `her Westmount line` (video); `18k Yellow · Vieux-Port` (try-on feature tag).
- **Taglines** (`product.tagline`) are sentence case and end with a period. They run 2–7 words and are often a fragment or a three-part list.
- **Descriptions** are one or two factual sentences about setting, stones and metal.
- **Spec keys** are sentence case (`Total carat weight`, `Water resistance`, `Hidden halo`). Spec values carry units (see §6).
- **IDs** follow `tns-{code}-{nnn}`. The category codes are `nk` (necklaces), `er`, `br`, `rg`, `bd` (bridal), `wt`, `rn` (rentals), `gf`, `cs` (custom).

### 2.5 Names and copy that drive behaviour

Changing these strings changes how the app behaves, not just what it says:

- **`tryOnKind(p)`** in `src/data/catalog.ts` tests the lower-cased **name**:
  - `/gift card|redesign/` → null (no try-on)
  - `/earring|stud|drop|huggie|tiara/` → `earrings`
  - `/necklace|pendant|collar|rivi|chain(?! bracelet)/` → `necklace`
  - `/bracelet|cuff|tennis/` → `bracelet`
  - category `watches` → `watch`
  - `/ring|signet|band|solitaire|three-stone|engagement/` or category rings/bridal → `ring`

  The result decides whether every `View on you` / `Try on` button renders at all, which overlay is drawn, and the `{n} pieces, switch metals instantly` count on the home page (currently 25 of 27 products).
- **`mediaPoolFor(p)`** in `src/data/media.ts` chooses the review photo pool. It checks the category (watches, gifts), then the name against `/earring|stud|drop|huggie/`, `/bracelet|cuff/` and `/necklace|pendant|collar|rivi|chain/`. Everything else gets the ring pool.
- **`hasCostBreakdown(p)`** in `src/data/costing.ts` is `p.metals.length > 0 && !/commission|redesign/i.test(p.name)`. It controls whether `See full cost breakdown` and the PriceBreakdown section appear.
- **`CartUpsell`** excludes names matching `/commission|redesign/i` and the slug `gift-card`.
- **`buildCostBreakdown`** chooses its findings line by name:
  - `/necklace|pendant|chain|collar|rivi/i` → `Chain & clasp` / `Solid gold spring ring`
  - `/earring|stud|drop|huggie/i` → `Posts & backs` / `Secure screw or hinged backs`
  - `/bracelet/i` → `Clasp & safety` / `Double box clasp`
  - watches → `Strap & buckle`

  `stonesFor()` reads spec **keys** (`Pearl`, keys containing emerald, sapphire, total carat, diamond, halo, side or bezel) and only values that contain `ct`.
- **`JewelryOverlay`** tests name and description against `/diamond|solitaire|tennis|rivi|collar|stud|pav/i` to decide whether to draw stones. It also uses `/pearl/i`; `/emerald/i` and `/sapphire/i` (gem colour); `/collar|rivi/i`, `/disc/i`, `/drop|chandelier|tiara/i`, `/huggie/i`, `/signet/i`, `/tennis/i`, `/cuff/i`; and `/pearl|lac/i` (watch dial).
- **HomeHero slide controls** use each slide's `nav` label: `01 Lumière`, `02 Mariage`, `03 Location` (numbers only below `sm`). The featured piece is captioned `La pièce`, with the product's full catalog name.
- **`Product.tsx`** picks `ctaLabel` from the product: rental → `Reserve this piece`, category `custom` → `Begin commission`, otherwise `Add to bag`. `needsSize` is true for the rings and bridal categories.

### 2.6 Badge vocabulary

```ts
badges?: ('New' | 'Bestseller' | 'Atelier Exclusive' | 'Limited' | 'Made to Order')[]
```

- Only `badges[0]` is rendered: top-left on `ProductCard` and on the `Gallery` stage, as `font-spec … uppercase` on a translucent travertine chip.
- How the 27 products are tagged:
  - Bestseller: 7
  - New: 4
  - Atelier Exclusive: 3
  - Limited: 2
  - Made to Order: 3
  - No badge: 8
- The Treasured tabs relabel three of them: `Bestseller` → `Bestsellers`, `New` → `New arrivals`, `Atelier Exclusive` → `Atelier exclusives`.
- Other tag-like labels:
  - `Limited · 62 pieces` (WatchSpotlight image tag)
  - `From` (rental price prefix on `ProductCard` only)
  - `Free` (GiftOptions)
  - `Included`, `Prepaid` and `At checkout` (PriceBreakdown)
  - `Film` (Gallery thumbnail)
  - `Live` (TryOnFeature)
  - `You` and `Pending moderation` (Reviews)

### 2.7 Other named things

- **Metals.** `METALS` labels are `18k Yellow Gold`, `18k White Gold`, `18k Rose Gold`, `Platinum 950` and `Gold Vermeil`. The costing names in `METAL_RATE` are lower case: `18k yellow gold`, `18k white gold`, `18k rose gold`, `Platinum 950`, `Gold vermeil`. Their purities read `18k · 75.0% gold`, `18k · 75.0% gold, rhodium finish`, `Pt950 · 95.0% platinum` and `925 silver, 2.5µ 18k gold`.
- **Gift-card designs** (`DESIGNS`): `Travertine`, `Espresso`, `Vermeil`, `Mont-Royal`.
- **Lettering styles** (`FONT_STYLES`):
  - `Script`: Pinyon Script
  - `Serif`: Baskervville, italic, weight 500
  - `Block`: Jost, weight 500, uppercase, 0.18em tracking

  The sample glyphs are `Aa`, or `AA` for Block.
- **Personalization kinds:**
  - Nameplate: label `Your name`, hint `Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes.`
  - Initial: label `Initial`, hint `One letter, hand-engraved on the front of the disc.`
  - Monogram: label `Monogram`, hint `Up to three initials, hand-engraved on the face.`
  - Paid add-on: `Diamond accent` (CAD 180).
  - Preview fallbacks when no text is entered: `Teresa`, `T`, `TMS`. Placeholders: `e.g. Sofia`, `e.g. TMS`.
- **Rental periods** have the ids `weekend`, `week` and `month`, lasting 3, 7 and 30 days (`RENTAL_DAYS`). The labels for them vary; see §4.9 and Notes.
- **Gallery view labels:** `Front`, `Styled`, `View {n}`, `Detail`, `Film`.
- **Seasonal campaign:** `Collection Lumière · Automne` (HomeHero slide 1). No product carries this name.
- **Home section names:** `The Index`, `Most treasured`, `Le Trouveur de Cadeaux`, `Diamond Education`, `The making`, `Horlogerie`, `Le Salon`, `La lettre`.

### 2.8 Numbering conventions

- **Roman numerals I–IX** are used only for category chapters (`Category.eyebrow`).
- **Two-digit arabic numbers** (`01`…) appear in gold, in the spec face:
  - Home section indices, hard-coded (table below).
  - PDP lower sections, computed as `num(id)` (position in `sectionOrder`, padded to two digits) so that hidden sections leave no gaps.
  - PDP configurator steps (`stepNo`).
  - Gift-card builder legends `01`–`04` (hard-coded).
  - Process lists built with `0{i + 1}`: Category rental steps, Atelier steps, gift-card how-it-works, FourCs tabs, WatchSpotlight list. `0{i + 1}` only works for fewer than 10 items.
  - Hero `(01)` markers and counters (`01` … `03`), and media counters such as `01 / 05 · Front`.
- **An em dash `—`** is the "index" for unnumbered sections. It is the default `index` of `RecentlyViewed` and `ShoppableVideos`, the index of the GiftCards FAQ header, and the TryOnFeature eyebrow prefix.

| Index | Eyebrow | Heading | Component |
|---|---|---|---|
| 01 | `Nine chapters` | `The <em>Index</em>` | `CategoryIndex` |
| 02 | `The selection` | `Most <em>treasured</em>` | `Treasured` |
| — | `Essayage virtuel` | `See it <em>on you</em>, before it’s yours.` | `TryOnFeature` |
| 03 | `Chapter V · Mariage` | `A promise, <em>certified</em> to the last facet.` | `Home.tsx` |
| 04 | `Diamond Education` | `The <em>Four Cs</em>, explained by a jeweller.` | `FourCs` |
| — | `Watch & shop` | `Seen in <em>motion</em>` | `ShoppableVideos` |
| 05 | `Le Trouveur de Cadeaux` | `Find the <em>perfect</em> gift.` | `GiftFinder` |
| 06 | `06 · The making` | `From <em>bench</em> to heirloom` | `MakingScroll` |
| 07 | `Chapter VI · Horlogerie` | `Time, <em>kept</em> beautifully.` | `WatchSpotlight` |
| (none) | `Chapter VII · La Location` | `Borrow the <em>vault</em> for an evening.` | `Home.tsx` |
| (none) | stars + `4.9 / 5 · 1,200+ reviews` | rotating quote | `Testimonials` |
| 08 | `Chapter IX · Sur Mesure` | `Teresa believed a jewel should <em>outlive</em> its maker.` | `Home.tsx` |
| — | `Welcome back` | `Continue <em>where you left off</em>` | `RecentlyViewed` |
| (none) | — | six service tiles | `Services` |
| 09 | `@teresaandsons` | `Worn in <em>Montréal</em>` | `SocialGrid` |
| (none) | `Le Salon` | `Come <em>sit</em> with us.` | `VisitSalon` |

---

## 3. Voice and tone principles

Each principle below is inferred from the copy and backed by verbatim examples.

1. **Understated confidence, no hype.** There is no exclamation mark anywhere in the user-facing copy. There is no "sale", "deal" or urgency language. Scarcity is stated as plain fact.
   - `Limited · 62 pieces` (WatchSpotlight)
   - `Appointments recommended, walk-ins always welcome.` (VisitSalon)
   - `Time, <em>kept</em> beautifully.` (WatchSpotlight)
2. **The catalogue as a book.** Categories are chapters with roman numerals, sections are numbered, and even error states keep the metaphor.
   - `Nine chapters` / `The <em>Index</em>` (CategoryIndex)
   - `Maison / Chapter {eyebrow}` (Category hero)
   - `This chapter could not be found.` (unknown category)
3. **Family heritage, told with restraint.**
   - `Made <em>for you</em>, by a family.` (Atelier)
   - `Teresa believed a jewel should <em>outlive</em> its maker.` (Home)
   - `…and leaves only when it is worthy of the family name.` (CraftStory)
4. **Montréal bilingualism as an accent, not a translation (English site).** French appears in eyebrows, greetings, thanks and proper names; instructions, policies and errors are in English. The French site (2026-10-21) is French throughout and doesn't mirror the touches back into English. See [features/languages.md](features/languages.md) §9 for its voice.
   - `Votre sélection` above `Your <em>Bag</em>` (Cart)
   - `Bon retour.` / `Join the maison.` (Account)
   - `Merci.` (order confirmation)
5. **Compressed, sensory product lines.** Taglines are fragments or three-part lists that end in a full stop.
   - `A single round brilliant, suspended.`
   - `Sculpted, hammered, hand-signed.`
   - `Ceylon blue, borrowed for the night.`
6. **Expert precision and transparency.** Grades, carats, millimetres and even the margin are stated openly.
   - `We select VS2 or better, so nothing is visible without a 10× loupe.` (FourCs)
   - `Every gram, every stone and every bench hour behind this piece, with our margin shown openly.` (PriceBreakdown)
   - `Figures are rounded and reconcile exactly to the price shown.` (PriceBreakdown footnote)
7. **Hospitality and reassurance.** The concierge and the salon are offered generously.
   - `An espresso, a velvet tray, and as much time as you need.` (VisitSalon)
   - `…though we will always work with you to make it right.` (ProductFAQ)
   - `Our concierge can source or commission something special.` (GiftFinder)
8. **Warm, direct second person, with "we/our" for the house.**
   - `See it <em>on you</em>, before it’s yours.` (TryOnFeature)
   - `Come <em>sit</em> with us.` (VisitSalon)
   - `Begin with something that will outlast the occasion.` (empty bag)
9. **In-world wit for edge cases.**
   - `This piece has returned to the vault.` (unknown product)
   - `Nothing in this pairing — yet.` (GiftFinder with no results)
   - `Borrow the <em>vault</em> for an evening.` (rentals)
10. **Plain, specific task copy.** Helpers and errors are short imperatives that say how to fix the problem.
    - `Add the recipient’s name.` (GiftCards)
    - `Enter the 16-character code from your gift card.` (Checkout)
    - `Match the circumference below. Between sizes? Choose the larger.` (RingSize)
11. **Honest disclaimers.**
    - `The rendering is an illustration — proportions are approximate.` (TryOnStudio)
    - `Reviews are moderated before they appear publicly.` (WriteReview)
    - `Gift cards are non-refundable, except where required by law.` (GiftCards FAQ)

**Register by surface.** Editorial surfaces (Home, Atelier, category heroes, CraftStory, FourCs) use metaphor and the italic accent. Functional surfaces (bag, checkout, forms, try-on controls) drop the metaphor but keep the brand nouns (bag, piece, concierge, maison) and the French sign-offs (`Merci.`).

---

## 4. Microcopy conventions

### 4.1 Vocabulary

| Use | Instead of | Evidence |
|---|---|---|
| **bag** (`Add to bag`, `Your Bag`, `Clear bag`, `Go to bag`, aria `Shopping bag`) | cart, basket | "cart" never appears in user-facing copy, only in code (`#/cart`, `tns-cart`) |
| **piece(s)** (`{n} pieces`, `Reserve this piece`, `saved piece`) | item, product | "item" and "product" never appear in user-facing copy |
| **client(s)** (`Verified clients`, `Client photos & videos`) | customer | "Customer" appears only in the platform name `Shopify Customer Accounts` |
| **salon** (the physical store), **atelier** / **bench** (the workshop), **maison** (the house: breadcrumb root `Maison`, `Return to the maison`, `Join the maison.`, `Maison margin`) | store, shop, boutique | The cost statements say `Design, salon & maison margin` (`costing.ts`, `ringPrice.ts`; “showroom” was retired 2026-10-22) |
| **a jeweller** for human help (`Ask a jeweller`, `Our jewellers can source or commission something special.`, `A jeweller replies within the hour`) | concierge (retired 2026-10-21), support, customer service | — |
| **complimentary** (preferred) | free | "Free" still appears: `Free engraving`, `Free insured`, `Free annual cleaning…`, `Free` chips, `· free`, `ship free in CAD` |
| **reserve / reservation** for rentals | book, rent | `Reserve this piece`, `Reserve the ensemble`, `Available for reservation` |
| **commission** for bespoke work | order | `Begin commission`, `Commission a piece` |
| **View on you** / **Try on** for try-on | AR, virtual fitting | Default `TryOnButton` label is `View on you` |
| **Sign in** / **Create account** / **Sign out** | log in, register | `Account.tsx` |

### 4.2 Casing and typographic treatment

The source text is mostly sentence case. CSS (`uppercase` plus letter-spacing) produces the capitals. What you type in the source is what screen readers announce and what copy-and-paste returns.

| Role | Source casing | Rendered | Class recipe (typical) |
|---|---|---|---|
| Eyebrows / kickers | Sentence case (`The selection`, `Watch & shop`) or proper names (`Diamond Education`, `Chapter VI · Horlogerie`) | Capitals, spec face | `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]` (`--gold-champagne` on dark backgrounds) |
| CTAs: buttons and `.link-line` | Sentence case (`Add to bag`, `Book a visit`) | Capitals | `text-[11px] font-medium uppercase tracking-[0.24em]`–`[0.28em]`; `.link-line` in `src/index.css` is 11px, weight 500, `letter-spacing: 0.26em`, `text-transform: uppercase`, with an animated gold underline |
| Header nav | `Shop`, `Bridal`, `Rentals`, `Atelier` | Capitals | `text-[11px] font-medium uppercase tracking-[0.22em]` |
| Form labels and legends | Sentence case (`First name`, `Send on`) | Capitals | `text-[11px] uppercase tracking-[0.22em]` (`text-[10px]` for sub-labels) |
| Accordion titles, including FAQ questions | Sentence-case questions (`Does it expire?`) | Capitals | `Accordion`: `text-[11px] font-medium uppercase tracking-[0.22em]` |
| Display headings | Sentence case, with one `<em>` accent; Title Case in `Your Bag` / `Your Wishlist` | As written, serif light | `font-serif-editorial … font-light`; accent `<em className="text-[var(--gold-vermeil)]">` |
| Product names | Title Case | As written, serif | `font-serif-editorial` |
| Collection labels and badges | Title Case (`Atelier Exclusive`, `Made to Order`) | Capitals, spec face | `font-spec text-[10px] uppercase tracking-[0.2em]`–`[0.24em]` |
| Body and helper text | Sentence case | As written | `text-sm text-[var(--text-taupe)]`, `text-xs text-[var(--text-linen)]`; `text-white/60`–`/70` on dark |
| Footer links | Title Case (`Our Story`, `Book an Appointment`, `Gift Cards & Balance`) | As written | not uppercased |
| Mobile menu extras | Title Case (`The Atelier`, `Gift Cards`, `My Account` / `Sign In`, `Wishlist ({n})`) | As written, serif italic | `font-serif-editorial … text-3xl italic` |
| Desktop menu | Rail in Title Case (`Shop`, `Bridal`, `Rentals`, `The Atelier`) with italic French (`La boutique`, `Mariage`, `Location`, `L’Atelier`); sentence case elsewhere (`Search the maison`, `Book an appointment`, `Recently viewed`, `New arrivals`, `Nothing matches “{q}”.`, `Try a stone, a metal or a Montréal place:`) | Rail as written, serif; labels in capitals | `font-serif-editorial` rail; `uppercase` labels |
| Header search (2026-10-22) | The closed field reads `Search` / `Search the maison` (`Rechercher` / `Rechercher dans la maison`) in the serif's italic; open and empty, `Try` *tennis necklaces*… (`Cherchez` *des colliers tennis*…). Groups: `Recent searches`, `Begin with`, `Our signatures`, `Recently viewed` / `New arrivals`, `Suggestions`, `Chapters`, `Elsewhere`, `{n} pieces`, `See all {n}`; `Showing results for *tennis*`; chips `Under $1,000`, `To rent`; `Nothing matches “{q}”.`; footer `Can’t find it? The atelier can often source or make it.` + **Ask a jeweller**; keys `Move` · `Open` · `Close`. On the shop page: `Search` / `“{q}”` / `From all nine chapters, with every filter below.` |
| Splash and transition cards | Wordmark in tracked capitals. Eyebrows in capitals (`Montréal · Est. 1962`, `Chapter IV · Bagues`, `L’Atelier`, `Carte-cadeau`, `Liste de souhaits`, `Mon compte`, `Votre sélection`). Titles as written, with one gold italic word (`The *Atelier*`, `Your *Bag*`, `Teresa *&* Sons`) | As written, serif | `font-serif-editorial` titles; `font-spec uppercase` eyebrows |
| Lowercase aside inside an uppercase label | Lower case after an em dash (`— complimentary`, `— optional`, `— your name`, `— up to 6`, `— choose a start date`) | Escapes the capitals | `<span className="normal-case tracking-normal …">` |
| Prices, specs, codes, counters | — | Spec face with lining, tabular figures | `.font-spec` (Jost, `font-variant-numeric: lining-nums tabular-nums`) |

Some text is forced to upper case in code: the monogram input (`e.target.value.toUpperCase()`), the initial and monogram previews, Block lettering (`textTransform: 'uppercase'`), and the gift-code and postal-code inputs (`uppercase` class).

### 4.3 Headline grammar

- A heading has **one** gold italic accent (`<em>`). It is `--gold-vermeil` on light surfaces and `--gold-champagne` on dark ones.
- **Statement headlines end with a period.** Examples: `Find the <em>perfect</em> gift.`, `Come <em>sit</em> with us.`, `Merci.`, `Bon retour.`, `Bonjour, <em>{user.name}</em>.`, `Not sure what to choose? Give the <em>choice</em>.`, and the CraftStory titles (`Made slowly, by hand.`, `A ring for every tomorrow.`, `Time, regulated in Montréal.`, `Borrowed, never compromised.`).
- **Noun-phrase section titles have no period.** Examples: `The <em>Index</em>`, `Most <em>treasured</em>`, `In their <em>words</em>`, `Before you <em>decide</em>`, `The price, <em>itemised</em>`, `Complete the <em>look</em>`, `Complete the <em>ensemble</em>`, `Check your <em>balance</em>`, `Gift card <em>details</em>`, `Book a private <em>appointment</em>`, `View it <em>on you</em>`, `Finding your size`, `Corporate gifting`, `Summary`, `Checkout`, `Gifting & notes`.
- **Hero lines** are split into three spans. The accented line (`italic: 1`) is indented and drawn in champagne italic.

### 4.4 CTA label inventory, grouped by intent

| Intent | Labels (verbatim), with where they appear |
|---|---|
| Add or reserve | `Add to bag` (PDP default, gift-card builder, TryOnStudio, VideoViewer). `Reserve this piece` (rental PDP). `Begin commission` (PDP, category `custom`). The PDP and gift-card builder render `{label} — {Price}`, with the dash in `<span className="opacity-40">—</span>`. `Add all to bag` (Wishlist). `Add the set to bag` / `Reserve the ensemble` (CompleteTheLook). `Quick add` (CartUpsell grid; the rail variant is an icon button with aria `Add {name} to bag`). |
| Needs configuration | `Options` (CartUpsell). `Select options` (VideoViewer). `Choose dates` / `Personalize this piece` / `Choose size & options` (TryOnStudio). |
| Bag state | `Added to bag` (PDP for 2200 ms, gift-card builder for 2400 ms, TryOnStudio). `Added` (CartUpsell, VideoViewer). `Go to bag` (PDP and StickyBar once the exact configuration is in the bag; opens the drawer). |
| Bag and checkout | `Secure checkout` (lock icon plus arrow; drawer and Cart). `View full bag` (drawer). `Clear bag` (Cart; asks `Remove everything from your bag?` via `window.confirm`). `Edit`. `Save for later` (moves the line to the wishlist). `Undo`. `Apply` (gift-card code). `Place order` / `Place order — nothing due today` (a designed ring's balance still owed) / `Place order — no payment due` (Checkout). `Check` (balance). |
| Explore and navigate | `Discover necklaces`, `Explore bridal`, `View rentals` and `Book a private appointment` (hero). `Explore bridal`, `Design your own` (bridal block). `View the rental vault`. `Continue the discovery`. `All gifts`. `Shop certified diamonds`. `Shop {cat.name} →` (mega menu). `View all`. `Find your piece`. `Gift cards`. `Explore Rings`. `Continue shopping`. `Return home`. `Return to the maison`. `View in your account`. `Start shopping`. `View wishlist`. `Send a gift card`. `Send one`. `Show more reviews`. `Clear history`. `What the fee covers`. `See full cost breakdown`. `Get directions`. `Copy link`. `Follow #PorteTeresa` (a styled span, not a link). |
| Talk to a person | `Book a visit` opens the booking drawer (`openVisit`) everywhere: header, menus, footer, hero, the Home acts, the product page and its sticky bar, the bag, wishlist, account, try-on studio (`See it in person — book a visit`). Two named exceptions: `Book a fitting` on rentals, `Book a design consultation` on commissions. `Ask a jeweller` opens the contact sheet (`openAsk`); a search with no result offers `Or ask a jeweller`. `Commission a piece` (Home heritage) links to the Atelier. One verb per action since 2026-10-21. |
| Try-on | `View on you` (default label, also the CartLineItem link). `Try on` (chips on cards and in the video viewer). `Try these pieces on` (Category). `Try your wishlist on` (Wishlist). `Start virtual try-on` (TryOnFeature). `Start camera` / `Try camera again`. `Upload a photo`. `Retake`. `Save photo`. |
| Account and reviews | `Sign in`, `Create account`, `Sign out`, `Subscribe` (Footer), `Write a review`, `Submit review` |
| Choice toggles | Header `CA · CAD` / `US · USD`. Checkout `Canada · CAD` / `United States · USD`. Account `Canada` / `United States`. Recipient `For someone else` / `For me`. Delivery `By email` / `Physical card`. PDP periods `Weekend` / `One week` / `One month`; CompleteTheLook periods `Weekend` / `1 Week` / `1 Month`. Review filters `All` / `With photos & videos` / `5 stars`. Treasured tabs `Bestsellers` / `New arrivals` / `Atelier exclusives`. Sort options `Featured` / `Price, low to high` / `Price, high to low`. Gift Finder budgets `Under $1,000`, `$1,000 – $5,000`, `$5,000 – $15,000`, `$15,000 +` and occasions `Any occasion`, `Anniversary`, `For myself`, `For him`, `Milestone`. |

### 4.5 Form labels, placeholders and helper text

| Form | Labels → placeholders, constraints and helper text |
|---|---|
| Checkout (`src/pages/Checkout.tsx`) | Legend `Shopping in`. `Email` (required, email). `First name`, `Last name` (required). When shipping is needed: `Address`, `City`; `Province` (select of `PROVINCES[*].name`) or `State` (select of `US_STATES`); `Postal code` (pattern `[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d`, placeholder `H3G 1K4`) or `ZIP code` (pattern `\d{5}(-\d{4})?`, placeholder `10001`); `Phone` (tel). Otherwise: `Digital gift cards only — no shipping address needed.` Gift card: label `Gift card`, placeholder `XXXX XXXX XXXX XXXX`, `maxLength={19}`, button `Apply`. Note: `Payment is completed securely through Shopify Checkout. …` |
| Account (`src/pages/Account.tsx`) | Tabs `Sign in` / `Create account`. `Full name` (register only). `Email`. `Password` (`minLength={8}`). Checkbox `Receive La Lettre and private sale invitations`. Footnote `Accounts are managed through Shopify Customer Accounts.` |
| Atelier appointment (`src/pages/Atelier.tsx`) | `Full name`, `Email`, `Phone` (the only optional field). `Interest`: `Engagement ring`, `Heirloom redesign`, `Personalized piece`, `Jewelry rental fitting`, `Watch service`. `Tell us about your idea` (textarea). No placeholders. |
| Gift-card builder (`src/pages/GiftCards.tsx`) | Legends `01 Design`, `02 Amount ({currency})`, `03 Delivery`, `04 Recipient`. Custom amount: `$` prefix, placeholder `Custom amount, {min}–{max.toLocaleString('en-CA')}`, which renders as `Custom amount, 50–10,000` (CAD) or `Custom amount, 50–7,500` (USD). Delivery cards: `By email` (`Instantly or on a date you choose`), `Physical card` (`Mailed in our travertine box · free`). Recipient fields: placeholders `Recipient name`, `Recipient email`; `Send on` (date, today to +365 days). Message: placeholder `Add a personal message (optional)`, counter `{n}/200`. Sender: placeholder `From (your name)`. Quantity `−` / `+` (1–20). Helper for physical cards: `You’ll enter the mailing address at checkout.` Fine print: `Gift cards are not taxed at purchase and cannot be paid for with another gift card.` The form has `noValidate`. |
| Balance checker (`BalanceChecker.tsx`) | `Gift card number`, placeholder `XXXX XXXX XXXX XXXX`, button `Check`, hint `Demo card: TERE SASO NS19 62MT` |
| PDP configurator (`Product.tsx`) | Step labels: `Rental period`, `Dates & delivery`, `Metal`, `Personalize — {label in lower case}`, `Ring size` (+ `Size guide`), and `Engraving — complimentary` or `Reverse engraving — optional`. Engraving counter `{n}/18`, placeholder `Initials, a date, a word`, preview fallback `Your engraving`. |
| Personalizer (`Personalizer.tsx`) | `{cfg.label}` with counter `{n}/{maxLength}`. Placeholder `e.g. Sofia` (nameplate) or `e.g. TMS` (monogram); initials use a 26-letter grid instead. The hint shows below. Then `Lettering`, `Chain length` (`16 in` / `18 in` / `20 in`), the accent row `Diamond accent` with `+ {Price}`, and the footnote. The preview shows `Live preview` and `{chainLength} chain`. |
| Rental calendar (`RentalCalendar.tsx`) | Weekday headers `Mo Tu We Th Fr Sa Su`. Legend `Start`, `Your {days} days`, `12 Reserved` (the sample `12` is struck through), `2 days’ notice`. Hand-offs `Insured courier` / `Delivered & collected` and `Salon fitting` / `1420 Sherbrooke O.` Slot label `Delivery window` or `Fitting time`; slots `09:00 – 11:00`, `11:00 – 13:00`, `14:00 – 16:00`, `17:00 – 19:00`. Summary `Delivered` or `Fitting`, then `Select a time` until a slot is chosen; `Collected` … `by 12:00`. |
| Ring size (`RingSize.tsx`) | Sizes `4`–`9` in half sizes. Helper `One complimentary resize within the first year.` Guide modal: `Guide des tailles`, `Finding your size`, three steps, table headers `CA / US`, `Diameter`, `Circumference`, closing line about the ring sizer. |
| Gift options (`GiftOptions.tsx`) | `Gift wrapping` (`Travertine box, silk ribbon, handwritten card`, `Free`). Message placeholder `Your message, handwritten by our team`, counter `{n}/200`. `Gift receipt` (`Prices hidden on the packing slip`, `Free`). `Order note`, placeholder `Delivery instructions, a surprise to keep, anything we should know` (500 characters, no counter). |
| Write a review (`Reviews.tsx` `WriteReview`) | Eyebrow `Votre avis`, heading `Review {product.name}`. `Your rating`. `Headline`: placeholder `Sum it up in a line` (80). `Your review`: placeholder `How does it look, feel and wear?` (1200). `Name`: placeholder `First name, last initial`. `City`: placeholder `Montréal, QC` (saved as `Canada` if left empty). `Photos & videos — up to 6`, tile `Add`, helper `Show it worn — natural light works best. Videos under 60 MB.` |
| Other | Footer: placeholder `Email address`, button `Subscribe`. Category: `Sort`. Cart: `Est. tax` select (aria `Province`). PriceBreakdown: `Province` / `State` selects. TryOnStudio sliders: `Size`, `Rotation`, `Spacing` (earrings only), with readouts `{n}%` and `{n}°`. |

### 4.6 Validation and error messages

| Message (verbatim) | Trigger | Source | Presentation |
|---|---|---|---|
| `Choose an amount between {formatPrice(min)} and {formatPrice(max)}.` (for example `Choose an amount between $50 and $10,000.`) | Value outside `CUSTOM_RANGE` | `GiftCards.tsx` `submit` | `<ul role="alert">`, `text-sm text-red-700` |
| `Add the recipient’s name.` | Gift for someone else, name blank | `GiftCards.tsx` | same |
| `Add a valid recipient email.` | Email delivery and the address fails `/^\S+@\S+\.\S+$/` | `GiftCards.tsx` | same |
| `Enter the 16-character code from your gift card.` | `!isCodeFormat(code)` | `Checkout.tsx` `applyCode` | `text-xs text-red-700`, no live region |
| `This gift card could not be found.` | Code not in the ledger | `Checkout.tsx` | same |
| `This gift card has no remaining balance.` | Balance ≤ 0 | `Checkout.tsx` | same |
| `This gift card is already applied.` | Duplicate code | `Checkout.tsx` | same |
| `Your order is already fully covered.` / `Gift cards can’t be used to buy other gift cards.` | Nothing left that cards can pay for (first message if there is merchandise, second if not) | `Checkout.tsx` | same |
| `Gift card numbers have 16 letters and digits.` | Bad format | `BalanceChecker.tsx` | `text-red-600` inside an `aria-live="polite"` paragraph |
| `We couldn’t find that card. Check the number, or ask a jeweller.` | Not found | `BalanceChecker.tsx` | same |
| `Please enter a letter` · `Please enter at least {min} characters` · `Maximum {max} characters` · `Some characters cannot be engraved` (no trailing periods) | `validatePersonalization` | `catalog.ts` → `Personalizer.tsx` | Replaces the hint, `text-xs text-red-700`; the legend turns red when `showError` |
| Legend suffix `— choose a start date` | Add attempted with no start date | `RentalCalendar.tsx` | Legend `text-red-700` |
| `Delivery window — please choose` / `Fitting time — please choose` | Start chosen, no slot | `RentalCalendar.tsx` | Label `text-red-700` |
| `This piece is reserved during part of a {period} rental from this date. Please choose another start date.` (`{period}` is the raw id: `weekend`, `week` or `month`) | Chosen window is no longer free | `RentalCalendar.tsx` | `text-xs text-red-700` on a `bg-red-50` summary |
| `Ring size — please select` | Size missing when adding | `RingSize.tsx` | Legend `text-red-700` |
| `{busy.name} is reserved on these dates. Try another start date, or reserve pieces individually.` | An ensemble piece is not free | `src/components/pdp/CompleteTheLook.tsx` | `text-xs text-red-700` |
| `Videos must be under 60 MB.` · `Please choose a rating.` | Upload over 60 MB / no stars selected | `Reviews.tsx` `WriteReview` | `text-sm text-red-700` |
| `Camera access was declined. You can allow it in your browser settings, or use a photo instead.` · `Your browser does not support camera access here. Upload a photo to try the piece on.` · `Waiting for camera permission…` | Camera state | `TryOnStudio.tsx` | Body copy, `text-white/60` |
| Browser-native messages | `required`, `type="email"`, `minLength`, `pattern` | Checkout, Account, Atelier, Footer, WriteReview | Default browser wording, not branded |

When the PDP rejects an add, it scrolls to `#step-dates`, `#step-personal` or `#step-size` (Lenis offset −140). No toast is shown.

### 4.7 Empty and not-found states

| Surface | Copy | Next step offered |
|---|---|---|
| Bag drawer | `Your bag is empty.` / `Begin with something that will outlast the occasion.` | Links `necklaces`, `earrings`, `rings` (raw slugs, CSS-uppercased) and `Gift cards`, plus the recently viewed strip |
| Cart page | Same two lines | `Find your piece` (goes to Necklaces), `Gift cards`, recently viewed strip |
| Checkout | `Your bag is empty.` (italic, taupe) | `Continue shopping` (home) |
| Wishlist | `Nothing saved yet.` / `Tap the heart on any piece to keep it here.` | `Explore Rings`, plus a strip titled `Pieces you looked at` |
| Gift Finder with no match | `Nothing in this pairing — yet.` / `Our jewellers can source or commission something special.` | `Ask a jeweller` |
| Review filter with no match | `No reviews match this filter yet.` | — |
| Account, Orders tile | `No orders yet. Track deliveries and rental returns here.` | `Start shopping →` |
| Account, gift cards | `Gift cards you buy will appear here.` | `Send one` |
| Unknown product | `This piece has returned to the vault.` | Nothing |
| Unknown category | `This chapter could not be found.` | `Return home` |
| Recently viewed, video rail, upsell | Render nothing when empty | — |

### 4.8 Confirmations, toasts and transient states

| Event | Copy | Behaviour | Source |
|---|---|---|---|
| PDP add | `Added to bag`, then `Go to bag` | 2200 ms. `addToCart` also opens the drawer. | `Product.tsx`, `src/store.tsx` |
| Gift card added | `Added to bag` | 2400 ms | `GiftCards.tsx` |
| Line removed | `Removed {product name}` + `Undo` | Visible for 6000 ms, `role="status"` | `src/components/cart/UndoToast.tsx` |
| Review submitted | `Merci — your review has been received and will appear publicly once moderated.` The new row shows `Pending moderation` and `You`. | Stays on screen | `Reviews.tsx` |
| Appointment requested | `Merci. Our concierge will be in touch within one business day.` | Replaces the form | `Atelier.tsx` |
| Order placed | `Order {TS-…}` / `Merci.` / `A confirmation is on its way.`, plus ` {Price} was paid with gift cards.` when cards were used. If gift cards were bought: `Your gift cards`, then per card `Mailed in our travertine box, 2–5 business days.`, `Emailed to you now.`, `Emailed to {email} on {formatDay(sendOn)}.` or `Emailed to {email} now.` Links `Return to the maison`, `View in your account`. | Replaces the checkout | `Checkout.tsx` |
| Reward reached | `Unlocked: a complimentary jewellery care kit is included with your order.` | — | `RewardProgress.tsx` |
| Gift wrap on | ` Gift wrapped.` is appended to the drawer note; the Cart summary shows `Gift wrapping` / `Complimentary` | — | `CartDrawer.tsx`, `Cart.tsx` |
| Newsletter subscribe, Copy link, Sign in | **No confirmation copy** | — | `Footer.tsx`, `Wishlist.tsx`, `Account.tsx` |

### 4.9 Dynamic meta strings

| String | Rule | Source |
|---|---|---|
| `Available for reservation · fitted in salon` / `Made to order · approx. {n} weeks` / `In stock · ships within 48 hours` | Rental, then `leadTimeWeeks`, then everything else | `Product.tsx` `availability` |
| `{rating}` + `{count} reviews` | Seeded per slug | `Product.tsx` + `getRatingSummary` |
| `per weekend` / `per week` / `per month` | Rental price suffix | `Product.tsx` |
| `Refundable deposit {Price} · insurance included · What the fee covers` | Rental price line | `Product.tsx` |
| `Or 4 interest-free payments of {Price} with Shop Pay · ` (only if amount ≥ 400) + `Duties prepaid` (USD) or `Taxes calculated at checkout` (CAD) + ` · See full cost breakdown` (if `hasCostBreakdown`) | Non-rental price line | `Product.tsx` |
| StickyBar detail: `{period} rental` or the metal label, then `From {date}`, `“{text}”`, `Size {n}`, joined with ` · ` | `{period}` is the raw id, so it reads "weekend rental" or "week rental" | `Product.tsx` `detail` |
| `{n} pieces · Prices in {currency}` | Category toolbar | `Category.tsx` |
| `{count} piece` / `{count} pieces` | Cart header (the only singular/plural switch for pieces) | `Cart.tsx` |
| Gift-card lines: `{Design} design · Digital` or `· Physical card`; `For me` or `To {name} · {email}`; `Sends {date}`; `“{message, cut at 40 characters with …}”` | `lineDetails` | `src/components/lineDetails.ts` |
| Merchandise lines: `Weekend rental` / `One-week rental` / `One-month rental` or the metal label; `Size {n}`; `{start} → {end}`; `Salon fitting · {slot}` or `Courier · {slot}`; `describePersonalization` → `“{text}” · {Script/Serif/Block} · {chain} · Diamond accent`; `Reverse: “…”` or `Engraving: “…”`; falls back to `{collection}` | `lineDetails` | `lineDetails.ts`, `Personalizer.tsx` |
| Checkout line meta `{details joined ' · '} · ×{qty}`; CartLineItem `{Price} each` | — | `Checkout.tsx`, `CartLineItem.tsx` |
| Bag line eyebrow `Rental`, `Gift card` or `{collection}` | — | `CartLineItem.tsx` |
| `{formatPrice(balance)} {CUR} remaining on {masked}` + ` · originally {initial}` + ` · never expires` | Balance result | `BalanceChecker.tsx` |
| `{masked} · {formatPrice(balance)} left` (no currency code) | Account wallet | `Account.tsx` |
| `− {amount}` + `({left} left)` | Gift card applied at checkout | `Checkout.tsx` |
| `The set · {n} pieces` / `The ensemble · {Weekend or 1 Week or 1 Month}`; per piece `/ {label in lower case}` | Ensemble | `CompleteTheLook.tsx` |
| `{nn} / {NN} · {view label}`; `{nn} / {NN} · Shop the film`; `{nn} / {NN} · Client image` or `· Client video` | Media counters | `Gallery.tsx`, `VideoViewer.tsx`, `Reviews.tsx` |
| `{n} photos · {m} videos`; `{count + mine} verified reviews`; `{days} days ago` | Reviews | `Reviews.tsx` |
| `View on you · {kind}` (raw kind such as `necklace`, CSS-uppercased) | Try-on panel eyebrow | `TryOnStudio.tsx` |
| `{Category} · in motion`; `Wishlist ({n})`; `{n} saved piece(s).` | — | `Category.tsx`, `Header.tsx`, `Account.tsx` |

### 4.10 Accessibility copy: aria-labels and alt text

| Component | aria-label / title (verbatim) |
|---|---|
| `Header.tsx` | `Open menu`, `Close menu`, `Currency` (group), `Account, {user.name}` or `Sign in`, `Wishlist`, `Open bag` |
| `menu/SiteMenu.tsx` | `Menu` (dialog), `Close menu`, `Search pieces, chapters and pages`, `Main menu`, `Currency`, `Wishlist` / `Wishlist, {n} saved piece(s)`, `Account, {name}` / `Sign in`, `Open bag` / `Open bag, {n} piece(s)`, the shelf `Recently viewed` / `New arrivals`, and the hidden prefix `The salon: ` |
| `CartDrawer.tsx` | dialog `Shopping bag`, `Close bag` |
| `CartLineItem.tsx` | `Remove {name}`, `Decrease quantity`, `Increase quantity` |
| `CartUpsell.tsx` | `Add {name} to bag` |
| `RecentlyViewed.tsx` | `Clear recently viewed` |
| `WishButton.tsx` | `Remove from wishlist` or `Save to wishlist` (plus `aria-pressed`) |
| `HomeHero.tsx` | `0{n} {nav}, slide {n} of 3`; `Pause slideshow` / `Play slideshow`; carousel `Featured collections`; slide controls list `Slides`; piece link `La pièce: {name}, {facts}` |
| `App.tsx` | `Skip to content` (skip link) |
| `ShareSheet.tsx` | dialog named by its title; `Close`; `Link to this piece`; tabs `How to share`; live status `Link copied`, `List copied, with a link to each piece`, `Message copied, with the link`, `Text copied, with the link`, `Selected. Press Ctrl+C to copy.` |
| `Testimonials.tsx` | `Testimonial {n}` |
| `PressStrip.tsx` | section `As seen in` (matches the visible label) |
| `Product.tsx` | nav `Breadcrumb` |
| `Gallery.tsx` | `Show {label} view`, `Previous image`, `Next image`, `Full screen`, dialog `{name} gallery`, `Close gallery` |
| `RentalCalendar.tsx` | `Previous month`, `Next month`, and day buttons `{weekday, day month}` followed by `, reserved` or `, unavailable` (for example `Thursday, October 15, reserved`) |
| `RingSize.tsx` | dialog `Ring size guide`, `Close` |
| `CompleteTheLook.tsx` | group `Rental period` |
| `PriceBreakdown.tsx` | `role="img"`, `Price composition` |
| `Reviews.tsx` | `Play client video` / `View client photo`, dialog `Client media`, `Previous`, `Next`, `Close`, `Verified purchase`, dialog `Write a review`, `{n} star` / `{n} stars`, `Remove`, group `Filter reviews` |
| `TryOnButton.tsx` | Icon variant only: `{label}: {name}`, with `title={label}` |
| `TryOnStudio.tsx` | dialog `View {name} on you`, `Close try-on`, `Switch camera`, `Mirror image`, `Toggle positioning guide`, `Reset position`, `Choose another photo`, `Take photo`, metal swatches `{METALS[m].label}`, `Nudge ←` / `→` / `↑` / `↓`, `Try {name}` |
| `ShoppableVideos.tsx` / `VideoViewer.tsx` | `Scroll films left`, `Scroll films right`, dialog `{video.title}`, `Close video`, `Mute` / `Unmute`, `Play` / `Pause`, `Previous film`, `Next film` |
| `GiftCards.tsx` | `Recipient name`, `Recipient email`, `Personal message`, `Your name`, `Fewer cards`, `More cards` |
| `GiftOptions.tsx` / `Cart.tsx` / `Checkout.tsx` | `Gift message`, `Order note` / `Province` / `Remove gift card` |

Meaningful alt text exists for: product images (`{product.name}` on `ProductCard`, `CartLineItem` and `CompleteTheLook`); the gallery stage (`{name} — {view label}`); the category hero (`{category.name}`); `Notre-Dame oval solitaire`, `Signet ring` and `Stacked rings` (Home); `Diamond under loupe` (FourCs); `Virtual try-on preview`; `Teresa & Sons salon`; `Chronographe 1962`; `Hand-finished ring`; MakingScroll step titles; `Your photo` / `Your try-on`; and `Photo from {author}`. Decorative images use `alt=""`.

---

## 5. Typography in copy

| Glyph | Rule as practised | Examples | Exceptions and inconsistencies |
|---|---|---|---|
| ’ apostrophe (U+2019) | Every contraction and possessive in copy uses the curly apostrophe. It is safe inside single-quoted TS strings (the AGENTS.md apostrophe warning is about the straight `'`). | `before it’s yours`, `Can’t find your answer?`, `Harper’s Bazaar`, `2 days’ notice`, `maker’s mark`, `We’ll mail…`, `You’ll enter…` | Straight `'` in `Boucles d'oreilles` (`catalog.ts`, so the string is double-quoted) and `L'Atelier · Since 1962` (JSX text in `Atelier.tsx`). The nameplate validator accepts **only** the straight `'`. |
| “ ” double quotes | Curly quotes wrap quoted customer text and testimonials | `Engraving: “…”`, `Reverse: “…”`, `“{text}” · Script · 18 in`, the gift-message preview `“{message}”`, testimonials, the decorative `“` in the Home heritage block | No straight `"` anywhere in copy |
| — em dash (U+2014) | Spaced (` — `) for asides, in-label suffixes and the CTA–price separator. Also used for attribution (`— {sender}`) and as a placeholder for an empty value or an unnumbered section. | `Duties and import fees are prepaid — nothing due on delivery.`, `Engraving — complimentary`, `Add to bag — {Price}`, `Nothing in this pairing — yet.`, `Cut — the fire`, the GiftCardArt empty amount `—` | None found unspaced |
| – en dash (U+2013) | Ranges, never a hyphen | `16–18 in`, `2–3 business days`, `2–5 days`, `F–G`, `VS–SI1`, `11–12 mm`, `$1,000 – $5,000`, `09:00 – 11:00` | Spacing varies. Unit and grade ranges are unspaced. Currency ranges, `D – G`, `IF – VS2`, `$250 – $10,000` and the slots are spaced. `Tuesday – Saturday, 10h – 18h` (VisitSalon) vs `Tue–Sat · 10h–18h` (Footer); `D – G` (Home) vs `F–G / VS` (HomeHero). |
| - hyphen | Compounds and French place names only | `GIA-certified`, `hand-set`, `made-to-order`, `non-personalized`, `30-day`, `16-character`, `interest-free`, `Mont-Royal`, `Carte-cadeau` | Never used for ranges in copy |
| · middle dot (U+00B7) | Spaced (` · `) separator for metadata, eyebrows and joined detail lines. The wordmark subline uses `&middot;`. | `Chapter V · Mariage`, `In stock · ships within 48 hours`, `lineDetails(...).join(' · ')`, `Limited · 62 pieces` | HomeHero slide buttons parse the eyebrow on `·` (§2.5) |
| × (U+00D7) | Multiplication, dimensions, quantity | `12 × 10 mm`, `10× loupe`, `6.8 g × 82.40/g`, `8 h × 95/h`, `×{qty}` | — |
| → (U+2192) / `&rarr;` | Sequences and "go to" | `Consult → sketch → CAD → wax → set`, `{start} → {end}`, `Shop {name} →`, `{cta} →` (Account tiles) | — |
| … (U+2026) | Single-glyph ellipsis | `Waiting for camera permission…`, gift-message truncation `…`, upload busy `…` | No `...` in copy |
| − (U+2212) minus | Negative amounts and decrement | `− {Price}` (gift cards applied), quantity button `−` | — |
| № (U+2116) | Report numbers | `Report №`, `№ {reportNumber}` | — |
| ✦ (`&#10022;`) | Announcement separator | Header marquee | — |
| • (U+2022) | Masked digits | `•••• •••• •••• 62MT`, the GiftCardArt placeholder `•••• •••• •••• ••••` | — |
| & | Allowed in labels and names. In JSX text it appears both raw and as `&amp;`. | `Details & dimensions`, `Watch & shop`, `Worn &amp; filmed`, `Gift Cards &amp; Balance` | Both forms coexist (both render the same) |
| Accented French | Accents kept in display copy; slugs, ids and URLs are ASCII | `Montréal`, `Québec`, `Rivière`, `Lumière`, `rivières`, `sélection`, `Élodie`, `pavé`, `micro-pavé` | `Montreal` without the accent: `Montreal-regulated`, `in Montreal, Toronto and New York`, `our Montreal salon`, `Old Montreal`, `made or curated in Montreal`, `cast in Montreal`, `Montreal Gazette` (a proper name). Brand marks and addresses always use `Montréal`. |
| Others | `©`, `°`, `µ`, `∞`, `%`, `+` | `© {year}`, `{n}°`, `2.5µ`, `∞` / `Lifetime care`, `98%`, `40+`, `1,200+`, `3.00+` | `$15,000 +` has a space before the plus |

**Serial comma.** It is generally omitted (`Pendants, rivières and chains`, `Annual cleaning, claw checks and rhodium refresh.`). It appears only twice: `…insured, couriered, and collected the morning after.` (Home) and `What your rental fee covers, the refundable deposit, and tax — before you reserve.` (PriceBreakdown).

**Words vs numerals.** Counts that start a sentence or sit in descriptive prose are spelled out: `Fifty diamonds`, `Ninety-two graduated round diamonds`, `Twelve stages`, `Three generations`, `four pairs of hands`, `one resize`, `ten or more cards`, `four times a year`, `up to three initials`, `up to ten letters`. Specs, durations, prices and UI copy use numerals: `62 pieces`, `30 days`, `48 hours`, `up to 18 characters`, `40+ hours`. The rule is broken in places: `Or 4 interest-free payments` vs FAQ `four interest-free payments`, and spec `Letters: 'Up to 10'` vs description `up to ten letters`.

---

## 6. Number, price, date and unit formatting

### 6.1 Money

```ts
// src/data/catalog.ts (2026-10-21): locale-aware, cached per locale and currency
new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })
// src/components/Price.tsx renders:
// {formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span>
// $1,250 CAD in English, 1 250 $ CAD in French
```

- **Whole units only.** Catalog prices are integers. Examples: `formatPrice(6850,'CAD')` → `$6,850`, `formatPrice(5000,'USD')` → `$5,000`, `formatPrice(0,'CAD')` → `$0`. Both currencies show a bare `$`, so the trailing currency code from `<Price>` (`$6,850 CAD`) is what tells them apart.
- **Contexts that hide the code** with `[&_span]:hidden`:
  - Shop Pay instalment lines in the cart and drawer (the PDP instalment line keeps the code)
  - CartLineItem `each` and struck-through prices
  - RewardProgress amount
  - Every row amount in PriceBreakdown
  - Checkout gift-card usage lines
- **Contexts that format without `<Price>`:**
  - Gift-card denomination buttons (no code)
  - `GiftCardArt` (adds a small code itself)
  - `BalanceChecker` (adds the code by hand)
  - Account wallet (`… left`, no code)
  - The amount error message (no code)
- **CAD to USD.** `p(CAD)` derives USD as `Math.round((CAD * 0.73) / 5) * 5`, rounded to the nearest 5. Metal price deltas are converted with `Math.round(delta * 0.73)` and are not rounded to 5, so USD prices with platinum or vermeil can end in any digit. The diamond-accent add-on uses `toUSD(180)` = `130`. The commerce doc covers this in depth.
- **Hard-coded `$` copy that ignores the active currency:**
  - Collection `Gifts under $1,000`
  - Gift Finder budget labels (the thresholds themselves use the active currency; the label `Budget ({currency})` clarifies)
  - Spec `Diamond accent +$180` (a CAD figure)
  - Header `From $100 · never expires`
  - FAQ `orders over $1,000`
  - Gift-card spec `$250 – $10,000`
- **Thousands separators outside `formatPrice`:** `toLocaleString('en-CA')` is used for the custom-amount placeholder (`10,000`) and the rental `retail value {n}` detail, which has no currency symbol.
- **Rates without a symbol:** costing details read `{weight} g × {rate}/g` (for example `6.8 g × 82.40/g`) and `{hours} h × {rate}/h · Montréal atelier`.
- **Percentages:** tax rate is `{rate}% of {Price}`. Trailing zeros are trimmed, so `5% … 9.975%`. Composition shares get one decimal below 10% and none above.

### 6.2 Dates and times

- **`formatDay(d, opts = { weekday: 'short', day: 'numeric', month: 'short' }, locale = getLocale())`** calls `d.toLocaleDateString(locale, opts)`. In Node 24 this gives `Wed, Oct 21` (en-CA, en-US) and `mer. 21 oct.` (fr-CA). Browsers render according to their own CLDR data. It is used for:
  - the PDP StickyBar `From {date}`
  - rental ranges in `lineDetails` (`{start} → {end}`) and `Sends {date}`
  - the gift-card "Arrives" cell
  - checkout confirmation lines
  - rental-calendar summary dates
- **Calendar.** Day-button aria-labels use `{ weekday: 'long', day: 'numeric', month: 'long' }`, giving `Thursday, October 15`. The month header uses `{ month: 'long', year: 'numeric' }`, giving `October 2026`. Weekday headers run Monday first (`Mo`…`Su`).
- **Cart delivery promise.** `deliveryDate(4)` counts 4 business days, skipping Saturday and Sunday, and formats with `{ weekday: 'short', month: 'long', day: 'numeric' }`, giving `Thu, October 15`.
- **Storage format.** Dates are stored as ISO `yyyy-mm-dd` (`isoDate`). `BalanceChecker` would print a raw ISO date in `expires {expiresAt}`, but `expiresAt` is always `null`, so it shows `never expires`.
- **Clock style.** Opening hours use the French style `10h – 18h`. Rental slots use 24-hour `HH:MM – HH:MM`. The return time is `by 12:00`. Relative review dates read `{n} days ago` (the seeded values are always 3 or more).
- **Durations, with inconsistent spacing:**
  - `48 hours` vs `48 h`
  - `24 hours` vs `24h`
  - `42 h reserve` vs stat `42h`
  - `40+ hours`
  - `approx. {n} weeks`
  - `2–3 business days`
  - `within one business day`, `within the hour`
  - `five-year` vs stat `5 yr`

### 6.3 Units and measures

| Quantity | Format | Examples | Notes |
|---|---|---|---|
| Carat | `{n} ct`, with a space; specs use two decimals | `12.40 ct`, `0.22 ct`, `1.00 ct (pair)`; the GIA card uses `carat.toFixed(2)` | Prose sometimes drops decimals: `A 3.1 ct Colombian emerald`, `An 18 ct diamond collar` |
| Millimetres | `{n} mm` | `1.1 mm cable`, `12 × 10 mm`, `2 / 4 / 6 mm`; ring guide `{d.toFixed(1)} mm` | — |
| Inches | `{n} in` | `16–18 in`, `7 in`, chain options `16 in` / `18 in` / `20 in` | Prose spells it out: `adjustable at 16 and 18 inches` |
| Grams | `{n} g` | `6.8 g`, `24 g`, `9 g`, `{metalWeight.toFixed(1)} g` | — |
| Hours | `{n} h` | `42 h reserve`, `{labourHours} h`, `48 h` | Stats are unspaced: `42h`, `24h` |
| Water resistance | `50 m` | spec | The stat reads `50m` |
| File size | `60 MB` | Reviews | — |
| Purity | `18k` (lower-case k, no space), `Pt950`, `925`, `950` | — | — |
| Ring size | `4`–`9`, half sizes, labelled `CA / US` | — | — |
| Try-on readouts | `{n}°`, `{n}%` | — | — |

### 6.4 Codes, references and counters

- **Gift-card codes** are 16 characters drawn from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, which leaves out I, O, 0 and 1. `formatCode` groups them in fours separated by spaces. `maskCode` gives `•••• •••• •••• {last 4}`. Code inputs use `maxLength={19}` and the placeholder `XXXX XXXX XXXX XXXX`.
- **References:** `Ref. {ID}` and the Details row `Reference`. Orders: `Order TS-{6 digits}`. Character counters: `{n}/{max}`.
- **Singular and plural** are handled only in the Cart count (`piece`/`pieces`), the Account wishlist tile, and the review-star aria-label. They are not handled in `{n} pieces` (CategoryIndex and the Category toolbar; every category currently has 3 pieces), `{n} photos · {m} videos`, or `{count} reviews`.

---

## 7. Glossary (terms as used in the app)

Meanings come from the surrounding copy. Expansions marked *(gloss)* are general knowledge and do not appear in the code.

| Term | Meaning as used in the app | Where |
|---|---|---|
| **GIA** | The lab whose `Diamond grading report` (with `Report №`) comes with certified stones. Promised for every diamond (owner decision, 2026-10-22): `HOUSE.natural`, the announcement bar (“Every diamond accompanied by its GIA report”), Home's services, the piece page's FAQ and the bag's perks; the ring designer prices a report for every diamond. Products with a `gia` spec carry `reportNumber`, `shape`, `carat`, `color`, `clarity` and `cut`. *(gloss: Gemological Institute of America)* | `Product.tsx`, `catalog.ts`, `Services.tsx` |
| **Four Cs / 4Cs** | `Cut`, `Color`, `Clarity`, `Carat`, each with a grade scale and a highlighted `Teresa & Sons standard` | `FourCs.tsx` |
| **Cut** | `Cut determines how a diamond returns light.` Scale `Poor` → `Excellent`. The house sets Excellent or Very Good. The GIA value `Excellent (polish & symmetry)` is shown only as its first word. | `FourCs.tsx`, `catalog.ts` |
| **Color / colourless** | `Graded from D (colourless) to Z.` Bridal begins at G (`icy-white to the eye`). | `FourCs.tsx` |
| **Clarity / inclusions** | `Inclusions are nature’s fingerprints.` Scale `I1`…`IF`. House standard: VS2 or better. | `FourCs.tsx` |
| **Carat / ct** | `Weight, not size.` Spec key `Total carat weight`. | `FourCs.tsx`, specs |
| **Loupe** | A magnifier: `10× loupe`, `under the loupe` | `FourCs.tsx`, `media.ts`, `Reviews.tsx` |
| **Round Brilliant / Oval / Emerald (shape), emerald-cut** | GIA `shape` values; the PDP shows the first word only | `catalog.ts`, `Product.tsx` |
| **Solitaire** | A single stone: `A single round brilliant, suspended.` | `catalog.ts` |
| **Four-claw basket / four-prong / martini settings / screw backs** | Ways of setting and securing stones | `catalog.ts` |
| **Halo / hidden halo** | Diamonds around or under the centre stone: `rises from a hidden halo`, `within a halo of round diamonds`, spec `Hidden halo: 0.12 ct` | `catalog.ts` |
| **Cathedral setting / knife-edge band** | `A cathedral setting for an oval.`; spec `1.8 mm knife edge` | `catalog.ts` |
| **Three-stone / baguettes** | `Past, present, future.`; `An emerald-cut centre flanked by tapered baguettes.` | `catalog.ts` |
| **Pavé / micro-pavé / half-eternity** | Small diamonds lining a surface: `pavé diamond caps`, `lined with micro-pavé diamonds`, `A 1.6 mm band of half-eternity pavé.` | `catalog.ts` |
| **Collet** | An individual setting: `set in individual collets, articulated to drape like water` | `catalog.ts` |
| **Rivière** | `A river of graduated diamonds.` (a necklace). Also in the plural: `Pendants, rivières and chains` | `catalog.ts` |
| **Huggies** | `Petite hinged hoops lined with micro-pavé diamonds.` | `catalog.ts` |
| **Tennis (bracelet or line)** | `Fifty diamonds, one unbroken line.`; `Tennis lines and curb links` | `catalog.ts`, `media.ts` |
| **Bezel / bezel-set / station** | `a single bezel-set diamond station`; a watch with a `diamond-set bezel` | `catalog.ts` |
| **Paperclip / cable / curb chain; spring ring; double safety box clasp** | Chain and clasp types | `catalog.ts`, `costing.ts` |
| **Signet** | `ready for a monogram or crest` | `catalog.ts` |
| **Cocktail ring, stacking band, comfort fit** | Ring styles. `Comfort fit, forever.` | `catalog.ts` |
| **Claw / hand-raised claws / claw checks** | Prongs. Care includes `claw checks` and `claw re-tightening`. | `MakingScroll.tsx`, `CraftStory.tsx`, `Services.tsx`, `Cart.tsx` |
| **Gallery / shank** | Ring parts: `a reinforced gallery, and a comfort-fit shank` | `CraftStory.tsx` |
| **Hallmark / maker’s mark** | `hallmarked with our maker’s mark and metal purity`; `12-stage finish, maker’s mark` | `ProductFAQ.tsx`, `costing.ts` |
| **Rhodium** | White-gold finish: `rhodium finish`, `rhodium refresh` | `costing.ts`, `Services.tsx` |
| **18k / Platinum 950 (Pt950)** | `18k · 75.0% gold`; `Pt950 · 95.0% platinum`. Platinum costs CAD 650 more. | `costing.ts`, `catalog.ts` |
| **Vermeil (Gold Vermeil)** | `925 silver, 2.5µ 18k gold` plus plating. Costs CAD 400 less than 18k. | `catalog.ts`, `costing.ts` |
| **Recycled / reclaimed gold** | `100%` `Recycled gold`; `Every ingot we cast is reclaimed and refined.` | `CraftStory.tsx`, `media.ts` |
| **South Sea / Akoya / Freshwater pearls** | `11–12 mm South Sea` (golden); `7–7.5 mm Akoya`. "Freshwater" appears only in the Pearl Stud Gift Set tagline. | `catalog.ts` |
| **Colombian emerald ("minor oil"), Ceylon sapphire, mother-of-pearl, coloured gems** | Gem descriptors (`3.10 ct, Colombia, minor oil`; `8.40 ct Ceylon`) | `catalog.ts`, `Atelier.tsx` |
| **Horologist / Horlogerie** | The in-house watch specialist; `Horlogerie` is the watch-section eyebrow | `catalog.ts`, `WatchSpotlight.tsx` |
| **Regulated / regulation** | `regulated in five positions`; `one complimentary regulation` | `CraftStory.tsx`, `ProductFAQ.tsx` |
| **Automatic, manual-wind chronograph, Swiss quartz, power reserve, panda / sunburst dial, water resistance, case-back engraving** | Watch specs and services | `catalog.ts`, `WatchSpotlight.tsx`, `CraftStory.tsx` |
| **Atelier / bench / setter** | The workshop, the workbench, the stone-setter (`master setter`) | many |
| **Sur mesure / bespoke / commission** | Custom-made work. `Begin commission` | `catalog.ts`, `Atelier.tsx`, `Product.tsx` |
| **Your design / création** | A ring made in the ring designer (2026-10-22): “Designed by you” / “Créée par vous”, “Your design” / “Votre création”. French calls it a *création* everywhere, never a *dessin*. The way in is “Design your ring” / “Créer votre bague”; the tool's name is “The ring designer” | `ringCopy.ts`, `Designer.tsx`, `VisitFlow.tsx`, `AskSheet.tsx`, menus |
| **Side stones / accent diamonds** | *Side stones* (*pierres latérales*) flank the centre stone of a three-stone ring; *accent diamonds* (*diamants d’accent*) are the two small diamonds on the sides of the head (the designer's `peekaboo` detail). Never “side diamonds” for either | `ringCopy.ts`, `ringPrice.ts`, `costing.ts` |
| **Eagle claw, tab claw, V-claws, milgrain** | The designer's claw tips and edge: a description reads “Four claws · eagle tips” / “Quatre griffes · pointes d’aigle”; milgrain is *millegrain* in French | `ringCopy.ts` |
| **Deposit / acompte, balance on approval** | A designed ring's 30% paid at checkout (“Deposit” / “Acompte”, “Due today” / “À payer aujourd’hui”; the drawer, before tax: “Due today, before tax” / “À payer aujourd’hui, avant taxes”; a bag line: “{amount} due today” / “{amount} à payer aujourd’hui”) and the rest when the final design is approved (“Balance on approval” / “Solde à l’approbation”). One sentence for the designer and the try-on: “{deposit} today, a 30% deposit; {balance} when you approve the final design.” / “{deposit} aujourd’hui, un acompte de 30 %; {balance} lorsque vous approuvez la version finale de votre création.” (`RING_COPY.todayShare`, `onApproval`). French says *la version finale de votre création*, never *la création finale* (which reads as the finished ring). French says *acompte* for a payment toward the price; *dépôt* stays the rental's hold (“Dépôt remboursable”) | `house.ts` (`deposit`), `ringCopy.ts`, Cart, Checkout, Designer, TryOnStudio |
| **Live 3D / 3D en direct** | The try-on with the ring tracked on the hand: “On your ring finger” / “Sur votre annulaire”, “Fit on the finger” / “Ajustement au doigt”, “Match the room” / “Ambiante” (*pièce* means the jewel on this site), “Candlelight” / “Lueur de chandelle”, “Place it by hand” / “La placer à la main”. The status chip's messages stay short for a phone: “No hand found: place it by hand” / “Aucune main repérée : placez-la à la main”, “Tracking unavailable: place it by hand” / “Suivi indisponible : placez-la à la main”, “Still no hand? Try “Place it by hand”” / “Toujours pas de main? Essayez « La placer à la main »” | `TryOnStudio.tsx` |
| **CAD** (design) | `CAD renders`, `CAD & wax`, i.e. `Precise 3D renders`. This is **not** the currency. | `catalog.ts`, `Atelier.tsx` |
| **Wax model** | `a wax model you can try on before we cast` | `Atelier.tsx` |
| **Heirloom redesign / appraisal** | Resetting inherited stones and gold. Appraisal is included. | `catalog.ts` |
| **Made to order / lead time** | `Made to order · approx. {n} weeks` (3, 6 or 8 weeks in the data) | `Product.tsx`, `catalog.ts` |
| **Digital proof** | Emailed for approval before personalized work is cut | `Personalizer.tsx` |
| **Ultrasonic cleaning / re-certification / gemmologist sign-off** | Care services, and the checks between rentals | `Product.tsx`, `CraftStory.tsx`, `PriceBreakdown.tsx` |
| **Maison margin** | `Design, salon & maison margin`: `Design, salon, staff, warranty reserve` | `costing.ts`, `PriceBreakdown.tsx` |
| **Rental Vault / the vault** | The rentals collection and its metaphor | `catalog.ts`, `Home.tsx` |
| **Refundable security deposit / pre-authorisation** | A card hold, released within 48 h of return. `The deposit is a hold, not a charge.` | `Product.tsx`, `PriceBreakdown.tsx`, `ProductFAQ.tsx` |
| **Bonded courier / fitting / ID verification** | Rental delivery and hand-off steps | `catalog.ts`, `Category.tsx`, `PriceBreakdown.tsx` |
| **Kimberley Process / System of Warranties** | Diamond sourcing compliance | `ProductFAQ.tsx` |
| **CUSMA-qualifying** | US import duties cleared and prepaid by the house | `PriceBreakdown.tsx` |
| **Shop Pay / Shop Pay Installments** | Four interest-free payments | `Product.tsx`, `Cart.tsx`, `ProductFAQ.tsx` |
| **Gift receipt** | `Prices hidden on the packing slip` | `GiftOptions.tsx` |
| **Travertine box** | The signature presentation box (also a design token and a gift-card design name) | many |
| **Vitrine** | The display window: `Dressing the vitrine` | `media.ts` |

**French lexicon** (the English shown next to it in code, where there is one):

| French | Where | English counterpart in code |
|---|---|---|
| `Maison` | Category and PDP breadcrumb root, Footer column, `Return to the maison`, `Join the maison.` | the home link |
| `Joailliers` | Hero side label, legal entity name | — |
| `Chapitre` | HomeHero eyebrows | `Chapter` elsewhere |
| `Colliers`, `Boucles d'oreilles`, `Bracelets`, `Bagues`, `Mariage`, `Montres`, `Location`, `Cadeaux`, `Sur mesure` | `Category.french` | the category names |
| `La Location` / `Horlogerie` | Home rentals and hero / WatchSpotlight | Jewelry Rentals / Watches |
| `Collection Lumière · Automne` | Hero slide 1 | — |
| `Le Trouveur de Cadeaux` | GiftFinder eyebrow | `Find the perfect gift.` |
| `Essayage virtuel` | TryOnFeature, TryOnStudio | `View it on you` |
| `Le Salon` | VisitSalon | `Come sit with us.` |
| `La lettre` / `La Lettre` | Footer, Account | the newsletter |
| `Votre sélection` / `Liste de souhaits` / `Mon compte` | Cart / Wishlist / Account eyebrows | `Your Bag` / `Your Wishlist` / account dashboard |
| `Votre avis` / `Guide des tailles` | Review modal / size guide | `Review {name}` / `Finding your size` |
| `Carte-cadeau` / `Solde` | Gift-card pages and art / balance eyebrow | gift card / `Check your balance` |
| `Bonjour, {name}.` / `Bon retour.` / `Merci.` | Account / sign-in / confirmations | — |
| `Promesse`, `Basilique`, `Rivière`, `Dame du Lac`, `Chronographe` | Product and collection names | — |
| `rue … Ouest`, `O.`, `10h – 18h` | Address and hours | — |
| `#PorteTeresa` | Social hashtag | — (its meaning is not stated) |

---

## 8. Where the copy lives (per-page index)

The full verbatim copy for each page is in the linked docs. This table only maps each surface to its copy files.

| Surface | Route | Copy lives in | Deep doc |
|---|---|---|---|
| Global chrome (announcements, wordmark, mega menu, footer, drawer, recently viewed, wish button, `<Price>`) | all | `src/components/Header.tsx`, `Footer.tsx`, `CartDrawer.tsx`, `RecentlyViewed.tsx`, `WishButton.tsx`, `Price.tsx` | [components/global-and-shared.md](components/global-and-shared.md) |
| Home (hero, press, index, treasured, try-on, bridal, Four Cs, films, Gift Finder, making, watches, rentals, testimonials, heritage, services, social, salon) | `#/` | `src/pages/Home.tsx`, `src/components/HomeHero.tsx`, `src/components/home/*`, `src/components/video/ShoppableVideos.tsx` | [pages/home.md](pages/home.md) |
| Category and product card | `#/c/:slug` | `src/pages/Category.tsx`, `src/components/ProductCard.tsx`, `CATEGORIES` in `src/data/catalog.ts` | [pages/category.md](pages/category.md) |
| Product page | `#/p/:slug` | `src/pages/Product.tsx`, `PRODUCTS` in `catalog.ts` | [pages/product.md](pages/product.md) |
| PDP modules (gallery, personalizer, rental calendar, ring size, price breakdown, craft story, complete the look, reviews, FAQ, sticky bar) | `#/p/:slug` | `src/components/pdp/*`, `src/data/costing.ts`, `src/data/tax.ts` | [components/pdp-modules.md](components/pdp-modules.md) |
| Bag drawer, bag page, checkout | `#/cart`, `#/checkout` | `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/components/cart/*`, `src/components/lineDetails.ts` | [pages/cart-and-checkout.md](pages/cart-and-checkout.md) |
| Gift cards | `#/gift-cards` (also `#/p/gift-card`) | `src/pages/GiftCards.tsx`, `src/components/giftcard/*`, `src/data/giftcards.ts` | [pages/gift-cards.md](pages/gift-cards.md) |
| Account and wishlist | `#/account`, `#/wishlist` | `src/pages/Account.tsx`, `src/pages/Wishlist.tsx` | [pages/account-and-wishlist.md](pages/account-and-wishlist.md) |
| Atelier and shoppable video | `#/atelier`, modal | `src/pages/Atelier.tsx`, `src/components/video/*`, `src/data/media.ts` | [features/shoppable-video-and-atelier.md](features/shoppable-video-and-atelier.md) |
| Virtual try-on | modal | `src/components/tryon/*` | [features/virtual-try-on.md](features/virtual-try-on.md) |
| Catalog copy (names, taglines, descriptions, specs) | — | `src/data/catalog.ts`, `src/data/media.ts` | [data-model.md](data-model.md) |
| Site title and meta | — | `.figma/make/site.json`, `src/App.tsx` (`headFor`) | [platform-and-tooling.md](platform-and-tooling.md) |

---

## Notes & gotchas

Everything in this section is observation, risk or recommendation, not a statement of fact about intended behaviour.

**Brand metadata**

- Resolved 2026-10-16: `site.json` carries an on-voice title and description and `en-CA`, and the favicon is the house ampersand. Pages retitle only in the running app, so link previews always show the site-wide title, description and card (`known-issues.md` KI-069).
- `robots.index: false` adds `noindex, nofollow` and a `Disallow: /` robots.txt.
- No French phrase is wrapped in `lang="fr"`, so screen readers pronounce them with English rules.

**House-style drift** (pick one style and normalise)

- Spelling (2026-10-21): the English source is Canadian everywhere (`Bridal Jewellery`, `Jewellery Rentals`, `High jewellery`, `Jewellery rental fitting`, `Colour`, `itemized`, `prioritize`, `pre-authorized`). US visitors read US spelling through `src/i18n/us.ts` (`Bridal Jewelry`). Tables above that still show `Jewelry` predate this change.
- `-ize` (`Personalized`, `non-personalized`) sits alongside `-ise` (`itemised`, `prioritise`, `pre-authorised`, `pre-authorisation`). `modelled`, `centre`, `colourless`, `coloured` and `millimetres` sit alongside the GIA label `Color`.
- `Montréal` vs `Montreal` (see §5).
- Other naming pairs:
  - `Chapter` vs `Chapitre`
  - `Sur Mesure` vs `Sur mesure`
  - `La Location` vs `Location`
  - `Horlogerie` vs `Montres`
  - `La lettre` vs `La Lettre`
  - `Sign In` (mobile menu) vs `Sign in`
  - `Gift Cards` vs `Gift cards`
  - `Explore Rings` vs the sentence-case CTAs
- Range-dash spacing is inconsistent (§5).
- Other small inconsistencies:
  - `$15,000 +` (space before the plus)
  - `42 h` / `42h` and `50 m` / `50m`
  - `4` vs `four` interest-free payments
  - `3.10 ct` (spec) vs `3.1 ct` (description)
  - The serial comma is used only twice
  - `validatePersonalization` messages have no final period, unlike every other error
  - Errors use `text-red-700` everywhere except BalanceChecker, which uses `text-red-600`
  - Checkout code errors have no live region

**Contradictory claims to reconcile**

- **Certification.** Since 2026-10-22 every surface promises a GIA report for every diamond (the owner's decision; the "over 0.50 ct" and "IGI above 0.30 ct" thresholds are gone). Pavé, halo and accent stones aren't graded one by one in practice: the claim is the owner's placeholder policy (todo.md).
- **Stated standard vs data.** FourCs says `We select VS2 or better` and that bridal begins at G. The Westmount Tennis Bracelet spec lists `Color: 'G–H'` and `Clarity: 'VS–SI1'`.
- **Pearl type.** The Pearl Stud Gift Set tagline says `Freshwater pearls`, but its description and spec say Akoya.
- **Rental reach.** One product says `delivered by courier in Montreal, Toronto and New York`; the hero says `couriered across Canada and the United States`.
- **Rental timing.** Copy says `Collected the next morning` / `collected the morning after`, but the calendar shows collection on start + 3, 7 or 30 days `by 12:00`. The stat `24h` `Courier delivery` conflicts with `2 days’ notice` (`RENTAL_LEAD_DAYS = 2`).
- **Hours.** Services promises appointments `seven days`. The salon hours are `Tuesday – Saturday … Sunday by appointment` (Monday is never mentioned), and the concierge works `Tuesday to Saturday`.
- **Delivery date.** The Cart promises `arrives by {4 business days}` for every market. The PDP says `2–3 business days` for Canada and `3–5` for the US.
- **Watch warranty.** Every PDP trust row, including on watches, says `Lifetime` / `warranty & care`. The watch FAQ says manufacturer warranty plus a five-year service plan.
- **Gift-card spec.** `Denominations: '$250 – $10,000'` contradicts the presets 100–5,000 and the custom range 50–10,000 CAD / 50–7,500 USD, and the Header's `From $100`. In practice it is dead copy, because `#/p/gift-card` routes to the gift-card page.
- **Engraving and returns.** Engraving is labelled `complimentary`, but engraved pieces are final sale (FAQ, Cart). The PDP engraving field does not say so.
- **Persona overlap.** Testimonial author `Daniel K.` "proposed in Paris", while the `@danielk` video is `A campfire proposal on Mont-Royal.`
- **Labels.** The reviews lightbox says `Client image` where everything else says "photo".

**Microcopy that doesn't match behaviour**

- `Continue the discovery` (Treasured) and `Find your piece` (empty Cart) go to Shop all (`#/shop`). Shop all's own label is `Shop all` / `Toute la boutique` in every menu, the footer, the empty bag and the empty wishlist (2026-10-24; it was `Every piece`, the page's title still is). They replaced "Explore all collections" and "Shop the collections" on 2026-10-16, because "collection" now means a curated collection only.
- `Begin commission` is the CTA for **every** `custom` product, including the Engraved Nameplate Necklace.
- The CraftStory eyebrow `The {collection} story` produces `The Gifts under $1,000 story`, `The Personalized story` and `The Rental Vault story`.
- Three phrasings mean "this needs configuring": `Options`, `Select options`, `Choose size & options`.
- Rental period labels vary: `One week` (PDP), `1 Week` (CompleteTheLook), `One-week rental` (lineDetails), and raw ids in templates (`week rental`, `a month rental`, `weekend rental fee`).
- The PDP shows the Shop Pay line only when the amount is at least 400 and with the currency code. The cart and drawer always show it, without the code.
- The rental `From` qualifier appears only on `ProductCard`. The strips, video tiles and try-on show the weekend fee with no qualifier.
- Duties and tax wording varies (§1.6).
- Several affordances do nothing:
  - Footer `GIA & Certification`, `Care & Repairs` and `Shipping & Returns` are plain text
  - `Follow #PorteTeresa` is a span
  - The social tiles prevent navigation
  - `Subscribe` gives no confirmation
  - `Copy link` gives no feedback and copies a link to a device-local list
  - `Sign in to keep your wishlist across devices` promises a sync that does not exist
  - `Add all to bag` silently skips rentals, personalized pieces and the gift card
- Signing in without a name greets the user as `Bonjour, {part of the email before @}.`
- The PDP header and the review sidebar always show five filled stars, whatever the 4.7–4.9 rating. `Fit — True to size` and `Would gift — 98%` are the same for every category, including watches.
- The watch costing line reads `Case & bracelet · {metal}`, although the watch specs list straps (`Alligator`).
- `CAD` means both Canadian dollars and computer-aided design.

**Launch realism**

- The phone number uses the 555 exchange.
- `4.9 / 5 · 1,200+ reviews`, the testimonials, the review pool and the rating counts are hard-coded or seeded per slug.
- The video clips are Mixkit stock "used as placeholders for brand films" (`media.ts`), so their captions describe moments the footage may not show.
- All of these need real sources before launch.

**Engineering**

- Product names drive logic (§2.5). Renaming `Heirloom Redesign` would make it try-on-able and give it a cost breakdown and an upsell slot. Dropping "Bracelet" from `Griffintown Chain Bracelet` would make it try on as a necklace.
- Policy strings are duplicated. Before changing a policy, grep for `0.50 ct`, `30-day` / `30 days`, `18 characters`, `resize`, `insured`, `duties`, `Shop Pay` and `travertine`.
- **Recommendation:** centralise policy figures in one module so they cannot drift.
- Nameplate validation allows only the straight `'`. macOS and iOS smart punctuation types `’`, which fails with `Some characters cannot be engraved`.
- Keep the AGENTS.md rule: a straight `'` inside a single-quoted TS string breaks the build. Prefer `’` in copy.

## Related docs

- [Languages — English (Canada, US) and French (Canada)](features/languages.md)
- [Product overview, sitemap & user journeys](product-overview.md)
- [Architecture & runtime model](architecture.md)
- [Figma Make platform, toolchain & build](platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](design-system.md)
- [Motion, animation & scroll behaviour](motion-and-interaction.md)
- [Data layer — catalog, media, gift cards, costing & tax](data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](commerce-logic.md)
- [Shopify integration map & porting notes](shopify-integration.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules](components/pdp-modules.md)
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md)
- [Virtual try-on](features/virtual-try-on.md)
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Code conventions](code-conventions.md)
- [UX patterns, responsive behaviour & accessibility](ux-patterns-and-accessibility.md)
- [Known issues, risks & tech debt](known-issues.md)
- [File index](INDEX.md)
