# Teresa & Sons: the legacy redesign plan

*Proposal for review, 2026-10-21. Nothing is built yet.* Once you approve it, with any changes you want, I'll build it in the phases of §10 and report after each one.

---

## 0. The plan on one page

**What we found.** The style is already right: Baskervville and Jost, travertine and vault, one gold italic word, hairlines, slow motion. The site is held back by **pacing and purpose**, not by how it looks:
- Home is about 20 screens long, 27 on a phone. It has 17 sections, and they all speak at the same volume.
- The two best sellers don't lead. The catalog has no tennis necklace yet.
- "Book a visit" is a small link, and phones don't show it at all.
- Renting and buying are two separate catalogues.
- The house's real advantage is three generations, one family and one workshop. The site tells that story only in fragments.

**The idea.** Keep the look, and rebuild every page around one journey:

> **Trust** in the first five seconds → **fall for a piece** → **see it in person**, rent it or order it.

**Seven big moves**

1. **Three doors on every piece:** Own, Rent, and See it in person. All three get equal weight, and "Ask a jeweller" is always one tap away.
2. **A real "Book a visit" flow.** The visitor picks a reason, a day and a time, and the pieces we should prepare, then gets a confirmation with a calendar file. It opens from the header on every page.
3. **One piece, two ways.**
   - The product page gets an Own | Rent switch.
   - Cards show "Own · Rent from".
   - The Rentals chapter lists every piece that can be rented.
4. **The signatures lead.** Engagement rings and diamond tennis necklaces:
   - open the hero;
   - get their own act on Home;
   - get their own landing pages.

   The catalog grows from 2 engagement rings to 6, and from 0 tennis necklaces to 3.
5. **Legacy you can see.**
   - A three-generations timeline.
   - The people who make the pieces.
   - A hallmark.
   - "Designed and made in our atelier" on every product.
6. **Home re-paced.** The 17 sections become 9 acts with a clear rhythm, and the page shrinks from about 20 screens to about 12. Nothing is deleted; some sections merge or move (§6).
7. **A tighter system.**
   - One numbering.
   - One button hierarchy.
   - Three section sizes.
   - One set of photo rules.
   - A word limit.
   - Fixes for the known issues that cost trust: mismatched prices, no focus ring, low contrast.

---

## 1. Your brief, and where the plan answers it

| You asked for | How the plan answers | § |
|---|---|---|
| The legacy of three generations in the design | Timeline act, the people, a hallmark, "made here" on every piece, a legacy line on every hero slide | 4.1, 5.1, 5.2, 5.6 |
| "This is a serious, trusted jeweller" | A trust strip under the hero, facts instead of adjectives (GIA, family-run since 1962, own atelier, lifetime care), no pop-ups, no countdowns, no fake scarcity | 3.4, 5.1 |
| A "wow" on landing, and visitors who stay | One cinematic moment (the hero), the two signatures within two screens, and a reason to keep scrolling in every section | 5.1 |
| Neither bored nor overwhelmed; everything on purpose | One job, one idea and one action per section; 9 acts with a planned rhythm; Home goes from about 20 screens to about 12 | 3.4, 5.1, 6 |
| Design consistency | Written rules for section layout, numbering, buttons, spacing, photo ratios, motion and copy | 4 |
| Best sellers: engagement rings and diamond tennis necklaces | Hero order, a Signatures act, two landing pages, more pieces | 5.1, 5.3, 7 |
| Rentals at about 50/50; the same piece rented or bought | Own · Rent switch on the product page, both prices on cards, Rentals lists every rentable piece, rental credit toward buying (your decision) | 5.2, 5.5, 7, 11 |
| Own workshop and designer | A "Made here" act, a maker's note on every product page, the people behind the pieces | 5.1, 5.2, 5.6 |
| "Book a visit" as important as "Add to bag" | A full booking flow; an equal-weight button on every product page, the sticky bar, the header, the bag and the wishlist | 5.7 |
| Contact the store | An "Ask a jeweller" sheet: call, text, WhatsApp, email, call-back, with the piece already named | 5.8 |
| Order online | The drawer-first bag and checkout stay; reassurance and a "see it first" option are added | 5.9 |
| Retention and engagement | Welcome-back band, the wishlist as a shortlist for the visit, visit management, saved ring size, dates to remember, care reminders, the newsletter, one gentle nudge | 8 |
| Calm and luxurious: white space, large photos, few words | Word limit (headlines of 7 words or fewer, one sentence of body), larger photos, an on-hand photo for every piece, a shot list for the real photo shoot | 4.5, 4.6, App. B |
| Keep the current style; remove nothing | The style stays and nothing is deleted. Every merge or move is listed for your approval | 6 |

---

## 2. What the audit found (2026-10-21)

Measured in headless Chrome at 1440 × 900 and at 390 × 844, in English (Canada).

**Keep as is (it already feels premium):**
- the type pairing, the palette and the gold italic word;
- the splash and the page transitions;
- the two languages;
- the rental calendar, the itemized price and reviews with photos;
- try-on, the shoppable films and the drawer-first bag.

**What holds it back**

| Issue | Evidence |
|---|---|
| Too long, flat pacing | Home is 17,942 px (about 20 screens) on desktop and 22,619 px (about 27) on a phone, with 17 full-height sections. "Most treasured" alone is 3,932 px on a phone. |
| Two numbering systems collide | Hand-typed numbers 03–09, with gaps and sections outside the sequence, sit beside catalog chapter numbers: "03 Chapter V · Mariage", "07 Chapter VI · Horlogerie", "08 Chapter IX · Sur Mesure". |
| Best sellers don't lead | **Hero:**<br>• Slide 1 is "Collection Lumière · Automne" with a "Discover necklaces" button.<br>• That collection has no pieces.<br>• Engagement rings only come second.<br><br>**Catalog:**<br>• There is no tennis necklace. The closest are the Rivière Saint-Laurent and the Westmount bracelet.<br>• Bridal holds 3 pieces, 2 of them engagement rings. |
| Booking is an afterthought | **Hero:** "Book a private appointment" is a small text link, hidden on phones.<br><br>**Product page:** "Book a viewing" is a small outlined button under "View on you". It leads to a generic form with no date, no time and no piece.<br><br>**Phone header:** no way to book. |
| Renting and owning are separate | A piece with rental rates can only be rented (`const rental = product.rental` in `src/pages/Product.tsx`). The rental vault is a category of its own. |
| Legacy told in fragments | The quote, the making, the testimonials and the 1962 chronograph are scattered across Home. There is no timeline and no faces, and the product page never says who made the piece. |
| Photos don't match the pieces | 18 photos serve 27 products:<br>• The oval solitaire shows hands with a bracelet.<br>• The diamond collar shows a gold chain.<br>• Photos repeat side by side.<br>• No piece is shown on a hand or a neck, which is how shoppers judge size. |
| The product page is crowded at the top and long overall | It runs about 13 screens, 17 on a phone. The purchase panel stacks about 12 elements, and reviews come 5th. |
| Different words for the same action | "Book a viewing", "Book a private appointment", "Book an appointment", "Book a diamond viewing", "Book a sizing", "Speak with our concierge", "Ask a jeweller", "Ask the concierge". |
| Known issues that cost trust (from the backlog) | • Card price ≠ product page price for platinum-first pieces: Notre-Dame shows $18,900 on its card and $19,550 on its page (KI-021).<br>• Quick-add skips the ring size (KI-022).<br>• No keyboard focus ring (KI-040).<br>• Gold and linen text fails contrast (KI-045).<br>• The newsletter form does nothing (KI-065).<br>• "As seen in" lists real publications (Vogue, La Presse…) as placeholders. |

---

## 3. Strategy

### 3.1 How people buy fine jewellery (research)

- **They research online, then decide in person.** In The Knot's 2025 study, people buying an engagement ring visited about two jewellers and saw about ten rings in person, and 64% bought in a store. ([Rapaport](https://rapaport.com/news/lab-grown-taking-over-engagement-ring-spending-the-knot/), [Jeweller Magazine](https://www.jewellermagazine.com/Article/10255/Majority-of-engagement-ring-buyers-shun-online-websites-study-finds), [study summary](https://jewelrybymorgan.thejewelerblog.com/new_study__when_it_comes_to_engagement_rings___getting_it_right__matters_most.html))
- **Visits convert.** Online fine jewellery converts at roughly 1%. Vendors report:
  - 20–30% conversion for video consultations;
  - 40–60% better conversion for appointments than for walk-ins;
  - 25–35% higher spend from appointments.

  These are vendor figures, so take them as a direction, not a promise. ([Immerss](https://immerss.live/content/why-high-ticket-items-dont-sell-online-jewelry-luxury), [Clientbook](https://www.clientbook.com/blog/retail-appointment-scheduling-clienteling-strategy), [Booxi](https://www.booxi.com/blog/appointment-scheduling-for-luxury))
- **Shoppers judge size from photos.** In Baymard's testing, 42% of users tried to judge a product's scale from its photos. 28% of sites show no photo that gives a sense of scale. ([Baymard](https://baymard.com/blog/in-scale-product-images), [Baymard: jewelry and watches](https://baymard.com/research/jewelry-and-watches))
- **Try-on helps.** In a vendor case study, Jewlr reported 10.4% higher conversion with virtual try-on. ([Tangiblee](https://www.tangiblee.com/fr/case-studies/jewlr))
- **Renting can lead to owning.**
  - Verstolo credits rental fees toward buying the piece, within limits.
  - Zales and Rocksbox applied the rental fee to the purchase price.

  ([Verstolo](https://www.verstolo.com/guides/renting-fine-jewelry-vs-buying-what-high-end-clients-should-know/), [Verstolo FAQ](https://www.verstolo.com/faq/), [Rapaport: The Lend Trend](https://rapaport.com/magazine-article/the-lend-trend/))
- **Heritage persuades when it is specific and humble.**
  - "Family-run" reads warmer than "family-owned", and over-claiming backfires.
  - Independent heritage jewellers lead with people, dates and archive photos, and pair the story with "book a consultation".

  ([FamilyBusiness.org](https://www.familybusiness.org/content/family-owned-or-family-run-the-words-you-use-can-affect-consumer), [WatchPro on Oliver Smith](https://usa.watchpro.com/?p=97148), [Motek](https://mymotek.com/pages/about), [Prins & Prins](https://prinsandprins.com/why-heritage-jewellers-build-more-trust-than-online-retailers/))
- **Lab-grown diamonds are now the majority in the US.** 61% of 2025 engagement rings had a lab-grown centre stone (The Knot, via Rapaport above). Whether to offer them is an assortment question for the owner (§11).

### 3.2 The site's job

The salon closes most sales. So the site's job is to **earn the visit**, and to sell or rent directly to people who are ready to buy online. Success is three numbers:

- **visits booked**;
- **conversations started**;
- **orders and rentals placed**.

A booked visit counts as a sale won, not as a fallback.

### 3.3 Four visitors, four paths

| Visitor | Wants | The path we design |
|---|---|---|
| **The proposer** (engagement ring) | Trust, guidance, privacy, no pressure | Hero → Engagement rings → product page → wishlist → **Book a bridal visit** (the rings are waiting), or "Design your own" |
| **The occasion dresser** (gala, wedding, event) | A tennis necklace or high jewellery for a date | Signatures → Tennis necklaces → product page in **Rent** → choose dates → fitting. Or **Own** |
| **The gifter, or someone buying for themselves** | The right piece, within budget, delivered | Find your piece (by chapter or by occasion) → product page → **Add to bag** → checkout. Or **Ask a jeweller** |
| **The returning family** (word of mouth) | Recognition, service, new pieces | Welcome-back band → their visit, care and repairs, new arrivals |

### 3.4 The rules every screen follows

1. **One job per section.** One headline, at most one sentence, one main action.
2. **Three doors, always close.** Own, Rent and See it in person, plus "Ask a jeweller".
3. **Show, then tell.** Photos first. Words only where they remove a doubt.
4. **Facts over adjectives.** Numbers, names, years and hours at the bench.
5. **Quiet confidence.**
   - No pop-ups, countdowns, fake scarcity or discount banners.
   - Nudges sit inside the page, appear rarely, and can be dismissed.
6. **Rhythm.**
   - Alternate photo-led, product-led and quiet sections.
   - Never two carousels in a row.
   - Never two dark sections in a row.
7. **Nothing lost.** Every feature stays; it moves to where it helps most.

### 3.5 What drives conversion, in order

1. **Trust:** legacy, facts, people.
2. **Desire:** large photos, films, try-on.
3. **Certainty:** on-hand photos, GIA reports, itemized prices, reviews, delivery and returns.
4. **Ease:** three doors, pre-filled booking, sticky buttons.
5. **Reassurance after acting:** confirmation, calendar file, the account page.

Every change below serves one of these.

---

## 4. The design system, tightened

Everything here builds on what already exists: the tokens, `SectionHeader`, `link-line` and the GSAP reveals.

### 4.1 Legacy signatures (new, used sparingly)

- **The hallmark.** A small hairline mark, "T&S · MTL · 1962", in the spirit of a maker's punch. It appears in three places only:
  - the maker's note on product pages;
  - the "Made here" act;
  - the footer sign-off.
- **Generation numerals.** I · II · III:
  - I: Teresa, 1962.
  - II: her sons, Antonio and Marco.
  - III: her granddaughter.

  The Atelier story already says "her sons and granddaughter continue the work". The owner confirms names, years and roles (§11).
- **Archive treatment.** A warm monochrome tone for heritage photos, so the archive reads as an archive and not as stock photography.
- **A legacy line on every hero slide:** "Joailliers · Montréal · since 1962 · three generations". This extends the hero's existing side label.

### 4.2 Section layout and numbering

- **One layout for every section:** number · eyebrow · headline with one gold italic word · at most one sentence · one action. It is built on `SectionHeader`.
- **One numbering system.**
  - Home acts are numbered 01–09, counted from the sections that actually render, never typed by hand. The product page already works this way.
  - Catalog chapter numerals (I–IX) stay on category and product pages.
  - On Home, the eyebrow names the chapter without a second number ("03 · Mariage").

### 4.3 Buttons: one hierarchy, one vocabulary

| Role | Look | Label (EN / FR) |
|---|---|---|
| Primary | Espresso fill, turning gold (vermeil) on hover, as today | "Add to bag" / "Ajouter au panier", "Reserve these dates", "Discover…" |
| **Visit** | Espresso outline with a calendar icon. **The same size as the primary button when they sit together** | **"Book a visit" / "Prendre rendez-vous"** |
| Secondary | Hairline outline | "View on you", "Design your own" |
| Tertiary | `link-line` | "Our story", "View all" |
| On dark backgrounds | Champagne fill, or white outline | as above |

- "Ask a jeweller" / "Parler à un joaillier" replaces the six concierge variants.
- Context goes in a small line under the button ("We'll have this piece ready"), never in a new verb.

### 4.4 Space and layout

Three section sizes replace today's mix of paddings:

| Size | Used for | Padding |
|---|---|---|
| **Statement** | Full-bleed photo acts | `py-40 lg:py-52` |
| **Standard** | Most sections | `py-28 lg:py-36` |
| **Quiet** | Strips and bands | `py-12 lg:py-16` |

The content stays 1,600 px wide with `px-6 lg:px-12`, as today.

### 4.5 Photos

- **Ratios:**

  | Use | Ratio |
  |---|---|
  | Product | 4:5 |
  | Editorial | 3:4 |
  | Landscape | 3:2 |
  | Films | 9:16 or 16:9 |
  | Hero | 16:9 on desktop, 4:5 on phones |

- **Four photos per piece:**
  - on travertine;
  - **on the body**: on the hand or the neck, so the size is clear;
  - a close-up detail;
  - worn.

  The second photo a card shows on hover is the on-the-body one.
- **No photo twice on one screen.** Until the real shoot, I'll use a curated set of placeholders in which every photo matches its piece. The real shoot follows the shot list in Appendix B.
- **Speed.**
  - Responsive images (`srcset` and `sizes`, using Unsplash's `w=`).
  - The first hero photo loads first (`fetchpriority="high"`).
  - Everything else loads as you scroll (backlog §4.10).

### 4.6 Words: a word limit, in both languages

| Element | Rule |
|---|---|
| Eyebrow | 4 words or fewer |
| Headline | 7 words or fewer |
| Body text on Home | One sentence of 25 words or fewer |

Specifics beat adjectives. The French is written, not translated, as today.

### 4.7 Motion

- Keep GSAP and Lenis.
- One signature moment per page: the hero on Home, and the photo that flies into the product page.
- Standard reveals for everything else: fade, 16 px rise, 0.9 s, `expo.out`, 60 ms stagger.
- Parallax only on large editorial photos, at 8% or less.
- All motion off when the visitor asks for reduced motion.

### 4.8 Accessibility, as part of the polish

- A visible focus ring (a gold hairline) on every control (KI-040).
- Gold and linen text darkened slightly to pass the WCAG AA contrast standard, through two new text tokens (KI-045). The look doesn't change.
- Tap targets of at least 44 px on phones.
- `aria-pressed` and `aria-invalid` where the backlog lists them.

---

## 5. Page by page

### 5.1 Home: from 17 sections at one volume to 9 acts with a rhythm

**Targets:**
- About 12 screens on desktop (from 20) and about 16 on phones (from 27).
- The two signatures appear within the first two screens.
- A door to booking appears about every third screen.

| # | Act and its job | Built from (today) | What changes |
|---|---|---|---|
| — | Splash | Splash | Kept as built. |
| — | **Arrival.** The "wow", and trust | `HomeHero` + `PressStrip` | • Slides reordered (see below).<br>• "Book a visit" on every slide, phones included.<br>• A legacy line on every slide.<br>• Until real press mentions exist, the strip below the hero shows trust facts (§6). |
| — | **Welcome back.** Returning visitors only | `RecentlyViewed` | Moves up from near the bottom. Adds the wishlist count and any upcoming visit. |
| 01 | **Our signatures.** Say what we're known for | New `Signatures` | • Two tall photos: Engagement rings, and Diamond tennis necklaces.<br>• Each with a "from" price, "Own · Rent" and a link to book.<br>• One quiet line underneath: "Most clients see their piece in person first. We'll have your favourites ready." |
| 02 | **The selection.** For people who like to browse | `Treasured` | • Bestsellers lead with the signatures.<br>• Cards show Own and Rent prices.<br>• **A swipeable row on phones**: 3,932 px → about 750 px. |
| 03 | **Rent or own.** The second business, the same pieces | Rentals section | **Kept:** dark background, current headline.<br><br>**Added:**<br>• One piece shown both ways: "Rent from $650 / weekend · Own $X".<br>• Three steps: dates → fitting or courier → collected the next morning.<br>• "Book a fitting". |
| 04 | **The engagement.** Guide the proposer | Bridal editorial + `FourCs` | • The editorial stays.<br>• The Four Cs become a compact guide with four tabs inside this act; all four Cs and their scales stay. 1,121 px → about 500 px.<br>• Buttons: Explore engagement rings · Design your own · Book a bridal visit. |
| 05 | **Made here.** In-house, start to finish | `MakingScroll` | **Kept:** the five stages.<br><br>**Added:**<br>• "The hands": the designer, the setter, the polisher or watchmaker, labelled by role until we have names.<br>• The hallmark line.<br>• "Visit the atelier". |
| 06 | **Three generations.** Why trust us | Heritage quote + `Testimonials` + new timeline | • A timeline from 1962 to today, in the archive tone, around the existing quote.<br>• Testimonials become "Families who come back". |
| 07 | **See it on you.** Play, without pressure | `TryOnFeature` + films | Paired in one act at a shared, shorter height. |
| 08 | **Find your piece.** For those who know what they want | `CategoryIndex` + `GiftFinder` (+ `WatchSpotlight` band) | • One block with two tabs: **By chapter** (the Index) and **By occasion and budget** (the gift finder).<br>• Watches follow as a compact band. |
| 09 | **Visit us.** The close | `Services` + `VisitSalon` + `SocialGrid` | • Services become a slim "Our promise" row; all six stay.<br>• The salon gains: live open/closed status, **the next three free times** (each opens the booking at that time), directions, and "Ask a jeweller".<br>• The social grid becomes a slim strip. |

**Hero slides.** All four existing headlines stay, and one slide is added:

1. **The house, featuring an engagement ring.**
   - Headline (kept): "Light, set by hand, since 1962."
   - The featured piece becomes the Notre-Dame oval solitaire.
   - The button becomes "Discover engagement rings". Today it says "Discover necklaces" and leads to a collection with no pieces.
2. **Tennis necklaces (new).**
   - Headline: "A line of / light, / unbroken." (a working line).
   - Button: "Discover tennis necklaces".
   - The French lines are written to fit the display size, as today.
3. **Mariage.** "A promise, certified to the facet." · "Explore bridal" (both kept).
4. **Location.**
   - "Borrow the vault for a night." · "View rentals" (both kept).
   - It now shows a piece that can also be bought.

**Rhythm check, light and dark,** from top to bottom:
- Arrival (dark)
- Strip (quiet)
- 01 (light)
- 02 (light, products)
- 03 (dark)
- 04 (silk)
- 05 (light)
- 06 (travertine, archive)
- 07 (light)
- 08 (light)
- Watches band (dark)
- 09 (silk)
- Footer (dark)

The only dark neighbours are the watches band and the footer, and 09 sits between them. I'll still check the sequence in the browser.

### 5.2 Product page: ready to decide on the first screen

**The purchase panel, top to bottom**

1. Breadcrumb, collection and chapter, name, tagline: kept. The rating shows the real count (backlog §4.7).
2. **Own | Rent switch**, on rentable pieces only.
   - It swaps the price, the options, the button and the availability line.
   - It remembers the choice.
   - Links from the Rentals chapter open the page in Rent.
3. **Price.**
   - Own: "$18,900 CAD · or 4 × $4,725" (kept).
   - Rent: "from $650 / weekend · deposit hold $5,000" (kept).
4. **Options,** as today:
   - Own: metal, size, personalization, engraving.
   - Rent: period and dates.
5. **The doors:**

   ```
   ┌───────────────────────────────────────────┐
   │  ADD TO BAG — $18,900 CAD                 │   primary button
   ├─────────────────────┬─────────────────────┤
   │  [cal] BOOK A VISIT  │  VIEW ON YOU        │   the visit button is as tall as the primary
   └─────────────────────┴─────────────────────┘
      We'll have this piece ready  ·  Ask a jeweller
   ```

   - **"Book a visit"** opens the booking with the reason filled in (engagement, tennis, rental fitting…) and this piece attached, with its metal and size.
   - **Engagement rings** add: "Prefer another shape or size? We'll source it for your visit."
   - **Custom pieces:** "Begin your commission" + "Book a design consultation".
6. **Availability, made specific:**
   - "Ready to try in the salon, Tue–Sat".
   - "Made to order in our atelier, about 6 weeks".
   - "Available for your dates".
7. **Maker's note (new, one line):** the hallmark plus "Designed and made in our atelier at 1420 rue Sherbrooke Ouest · about 40 hours at the bench".
8. **The rest of the panel, kept:**
   - The trust row, with its own lines for rentals and watches (backlog §5).
   - The GIA card.
   - The Details accordion.

**Below the fold.** Reordered by how much each section helps the decision. Nothing is removed, and the numbers still count automatically.

1. The story (`CraftStory`)
2. **Reviews**, up from 5th place
3. **Choosing your diamond**: the compact Four Cs guide, on engagement rings only
4. Films
5. Complete the look
6. **The price, itemized**: opens as a summary, with the full table one tap away
7. FAQ
8. Also in this chapter
9. Recently viewed
10. **"See it in person" (new band):** salon photo, the next three free times, Book a visit, Ask a jeweller

**Sticky bar**

| Mode | What it shows |
|---|---|
| Own | Price, [Add to bag], [Book a visit] |
| Rent | [Reserve dates], [Book a fitting] |
| Phones | Two buttons of equal width |

**Gallery**
- The on-the-body photo comes second, labelled "On the hand" or "Worn at 16 in".
- Zoom and the lightbox stay.

**Target:** about 9–10 screens, down from 13.

### 5.3 Two signature landing pages

- **The pages:**
  - Engagement rings, at `#/c/bridal?type=engagement`.
  - Diamond tennis necklaces, at `#/c/necklaces?type=tennis`.
- **Built on the category page,** not as new templates. Each one has:
  - a hero photo and one line;
  - filters for shape, metal, carat, price and Own / Rent;
  - the product grid, broken by two editorial moments ("How we set a tennis line", a note from the designer);
  - a compact guide: the Four Cs for rings; length (16 in at the collarbone, up to 18 in) and carat weight for necklaces;
  - a booking band: "Book a bridal visit. We'll prepare the rings you saved."
- **In Shopify:** each is a collection filtered by product type, with its own template.
- **Linked from:**
  - the hero and the Signatures act;
  - the Bridal and Shop mega menus;
  - the desktop menu;
  - the footer.

### 5.4 Category pages (all nine chapters) and "Shop all"

- **Filters.** These are interface only, with no real search behind them:
  - metal;
  - price band;
  - **available to rent**;
  - ready to try in the salon, or made to order;
  - shape, on Bridal.

  They show as chips on desktop and in a slide-up panel on phones.
- **Filters live in the address** (`?metal=platinum`), so they survive Back and can be shared. This also fixes the current bug where an address with a `?…` part shows "not found" (KI-017).
- **Gifts** gets price-range chips (backlog §2).
- **Cards** show "Own $X · Rent from $Y" when both apply, and the on-the-body photo on hover.
- **Rhythm:**
  - One editorial moment after the sixth card: a quote from the designer, or a "See them in person" booking card.
  - A booking band at the bottom.
  - Films and recently viewed are kept.
- **"Shop all" (`#/shop`).** It's already in your backlog as "next up" and uses the same filters, so it fits this pass (§11).

### 5.5 The Rentals chapter

- It lists **every piece that can be rented**, from every chapter.
- Each card shows the rental price first, then "or own $X".
- **Kept:** the rental calendar, the deposit hold and separate rental lines in the bag.
- **Added:**
  - "How renting works" in three steps, with the insurance and deposit-hold facts;
  - "Book a fitting".
- **If you approve it:** "Rent it, love it, keep it. Your rental fee counts toward owning it." (§11)

### 5.6 The Atelier page ("Made here")

- **Kept:** the hero, the consultation section, the bench film and the booking section.
- **Added:**
  - "The hands": portraits labelled by role;
  - "From sketch to setting": the stages from `MakingScroll`;
  - the three-generations timeline, shared with Home.
- **The form becomes the booking flow,** embedded in the page.
  - All of today's fields stay: name, email, phone, interest, idea.
  - New fields: date, time, type of visit, and the pieces to prepare.

### 5.7 Book a visit (new, everywhere)

A drawer from the right on desktop, and a full-height panel on phones, in the same family as the bag drawer. It is also embedded on the Atelier page. Its code loads only the first time someone opens it.

```
1  What brings you in?   Engagement ring · Wedding bands · Tennis necklace · Rental fitting ·
                         Design with our designer · Gift advice · Watches · Care & repair · Other
2  How?                  At the salon (1420 Sherbrooke O.) · Video call · Phone call
3  When?                 [Tue 28] [Wed 29] [Thu 30] [Fri 31] [Sat 1] …    10:00 · 11:30 · 14:00 · 16:30
4  Pieces to prepare     [x] Notre-Dame Oval Solitaire · platinum · size 6    + add from your wishlist
5  About you             Name · Email · Phone · Language EN / FR · A note (optional)
✓  "We're expecting you, Camille."  Tue 28 Oct · 14:00 · Add to calendar · Directions · Change or cancel
```

- **Smart, not heavy:**
  - The reason and the pieces are filled in from wherever the visitor opened the booking.
  - Days and hours come from the salon data (`SALON`).
  - Times show in Montréal time, plus the visitor's local time when it differs (useful for US visitors).
  - Visitors shopping in USD are offered a video call first.
  - Taken times are simulated and stay the same for a given day.
  - The calendar file is created in the browser.
- **Saved** through the store (`tns-visits`). Visits show in Account and in the welcome-back band.
- **Honest UI.** The booking is simulated and nothing is sent; the code and the docs say so. The real theme would use a booking app (§12).
- **Where it opens from:**
  - the header: a button on desktop, an icon on phones;
  - the hero and the Signatures act;
  - the product page and its sticky bar;
  - the wishlist ("Book a visit to see these");
  - the bag and the cart ("Prefer to see it first?");
  - the category bands;
  - Rentals ("Book a fitting");
  - the Atelier page and Visit us;
  - the footer, the menus and Account.
- **Accessibility:**
  - Focus stays inside while it's open, and returns to the button that opened it.
  - Escape closes it.
  - Days and times are radio groups.
  - The summary is announced to screen readers as it changes.
  - Animation is off under reduced motion.

### 5.8 Ask a jeweller (new, everywhere)

- **A small panel offering:**
  - **Call** (`tel:`);
  - **Text** (`sms:`);
  - **WhatsApp** (a link, with a placeholder number);
  - **Email** (`mailto:` with "About: {piece}" as the subject);
  - **Call me back** (name, phone and best time, then a confirmation).
- It also shows whether the salon is open ("Open now · until 18 h") and how quickly we answer.
- It replaces the scattered concierge links.
- These are plain links. No service is connected.

### 5.9 The bag, the cart and checkout

- **Kept:** everything, including the drawer-first bag and the separate rental lines.
- **Added:**
  - "Prefer to see it first? Book a visit", with the bag's pieces attached;
  - a reassurance row: insured shipping, returns per your policy, lifetime care, secure checkout;
  - "Ask a jeweller".
- **Fixed:**
  - The card price will match the product page (KI-021).
  - Every quick-add path asks for required options first (KI-022).

### 5.10 The wishlist: your shortlist

- **Kept:** the page and its name.
- **Added:**
  - the subtitle "Your shortlist for a visit";
  - **"Book a visit to see these"** as the main button;
  - Own and Rent prices;
  - "Ask about these".
- **Changed:** "Add all to bag" stays, but now asks for required options first.

### 5.11 Account

- **Kept:** today's tiles.
- **Added:**
  - **Your visits:** upcoming and past; change, cancel, add to calendar.
  - **Ring sizes:** saved, and filled in automatically on ring pages.
  - **Dates to remember:** anniversaries and birthdays, with simulated reminders.
  - **Care:** the annual cleaning that the lifetime warranty includes.
  - **Rentals:** past and current rentals.

### 5.12 Header, menus and footer

**Header**
- The bar stays Shop · Bridal · Rentals · Atelier (owner decision).
- A small outlined **Book a visit** button sits before the icons on wide screens, from 1,280 px. Between 1,024 and 1,280 px it shows as an icon.
- **On phones:**
  - a calendar icon next to the bag;
  - **Book a visit** as the first item in the mobile menu.
- One of the four scrolling messages becomes "Private visits · Tue–Sat · book ahead or walk in".

**Desktop menu:** adds Book a visit and Ask a jeweller tiles, plus the two signatures.

**Footer**
- Adds "Book a visit" and the live open status.
- Hours and phone come from the salon data, not hand-typed copies (KI-070).
- The newsletter form shows a thank-you (KI-065).
- Adds the hallmark sign-off.

### 5.13 Gift cards, checkout and the remaining pages

A consistency pass only: section layout, buttons, focus and contrast. Nothing structural changes.

### 5.14 Splash, page transitions and languages

- Kept as built.
- The new pages and drawers get their transition cards, in both languages.

---

## 6. What's kept, moved or removed

**Removed: nothing.**

**Moves and changes that need your OK:**

1. The **welcome-back** band moves from near the bottom of Home to just under the hero. It shows only to returning visitors.
2. **The Four Cs** become a compact guide with four tabs inside the bridal act. All the content stays, and the guide is reused on engagement-ring pages.
3. **The Index and the gift finder** share one block with two tabs.
4. **Services** become a slim promise row; all six services stay.
5. **The press strip.** It names real publications (Vogue, La Presse…) that haven't featured the house, which can mislead. Two options:
   - **Recommended:** show trust facts in its place until real mentions exist.
   - Keep the names, as placeholders.
6. **Product page:** reviews move up, and the itemized price opens as a summary.
7. **Hero:**
   - the slide order changes;
   - slide 1's button points to engagement rings;
   - a tennis-necklace slide is added.
8. **The Atelier form becomes the booking flow.** All of its fields stay.
9. **The three rental pieces can also be bought.** Their catalog price becomes the sale price until the owner confirms.
10. **The three vault pieces join their natural chapters** and still appear in Rentals:
    - the Gala Diamond Collar goes to Necklaces;
    - the sapphire earrings go to Earrings;
    - the tiara set goes to Bridal, which also fills the backlog's "wedding-day jewellery under Bridal".

---

## 7. Data changes (mock data, shaped like Shopify's)

- **`Product.type`**, which is Shopify's product type.
  - Values: engagement, band, tennis-necklace, rivière, pendant, chain, studs, drops, huggies, tennis-bracelet, cuff, signet, cocktail, stacking, watch, set, commission, gift-card.
  - It drives the filters and the landing pages.
- **Rent or own.**
  - Any piece with rental rates can be rented, and can also be bought unless it is marked rental-only (`rentalOnly: true`).
  - The Rentals chapter lists every piece with rental rates.
  - Rental and purchase lines already stay separate in the bag: the cart line's identity (`lineKey`) includes the rental.
  - In Shopify: one product with a purchase variant, plus a booking app for rentals.
- **New pieces.**
  - Each is in both languages, with placeholder prices and specs, and is added with the `add-product` skill.
  - Names follow Montréal places (Bonsecours, Ville-Marie, Saint-Louis…), and the owner can rename them.

  **4 engagement rings:**
  - a round six-claw solitaire;
  - an elongated cushion with a hidden halo;
  - a pear-and-oval toi et moi;
  - a radiant solitaire.

  **1 full eternity band** (a backlog item).

  **3 diamond tennis necklaces:**
  - a classic four-claw;
  - a graduated line;
  - an emerald-cut line.

  **Rentable:** some of the new pieces, plus the Westmount bracelet, the Rivière Saint-Laurent and the Vieux-Port studs.

  | | Today | After the plan |
  |---|---|---|
  | Engagement rings | 2 | 6 |
  | Tennis necklaces | 0 | 3, plus the Rivière and the Gala collar as the high-jewellery versions |
  | Bridal chapter | 3 pieces | 8 pieces (9 with the tiara set) |
  | Necklaces chapter | 3 pieces | 6 pieces (7 with the Gala collar) |
- **`SIGNATURES`:** the two signatures, used by the Home act and the landing pages.
- **`src/data/house.ts`:**
  - Content: the timeline, the generations, roles, the address and bench facts.
  - Both languages.
  - Every fact is a placeholder until the owner confirms it.
- **Visits:**
  - an `Appointment` record: reason, type of visit, date, time, pieces, contact, language, note, status;
  - in the store: `visits`, `openVisit(context)`, `bookVisit` and `cancelVisit`;
  - saved under `tns-visits`.
- **Photos.** A re-curated set of placeholders, one matching set per piece, each checked by eye, plus responsive image sizes.
- **Prices.** Cards and product pages open on the same price (KI-021).

---

## 8. Retention and engagement: calm, never pushy

1. **Welcome back.** Last viewed, the wishlist, any upcoming visit.
2. **The wishlist is the shortlist for a visit.** One tap books a visit with the saved pieces.
3. **Visit confirmation.** A calendar file, and change or cancel from Account.
4. **Saved ring size,** filled in automatically.
5. **Dates to remember.** Anniversary and birthday reminders (simulated).
6. **Care reminders.** The annual cleaning that the lifetime warranty includes.
7. **The newsletter (La Lettre).** Four issues a year, and a thank-you when you subscribe.
8. **One gentle nudge.**
   - When: after three pieces viewed, or two saved.
   - What: one card inside the page, "Would you like to see them in person? We'll have them ready."
   - Limits: at most once a week, dismissible, never a pop-up, and it never covers the language notice.
9. **Rent, then own,** if you approve the rental credit.
10. **Kept wherever they help:** recently viewed, try-on, films and reviews with photos.

**Not doing:** exit pop-ups, discount bribes, countdowns, or "12 people are viewing this".

---

## 9. How we'll know it works (in the real theme)

The prototype measures nothing. It will only name the moments worth tracking, so the theme can wire analytics later.

**Moments to track:**
- visit started, and visit booked;
- contact, by channel;
- wishlist add;
- try-on opened;
- added to bag;
- rental reserved;
- how far people scroll on Home;
- product pages per visit.

**Targets to watch after launch:**
- more visits booked per 1,000 sessions;
- fewer people leaving after one page;
- more product pages per session.

---

## 10. How I'll build it, after your approval

**After each phase I:**
- typecheck (0 errors) and build;
- check it in the browser in **English (Canada), English (US) and French (Canada)**, at **1,440 px and 390 px**, with before and after screenshots;
- update the docs;
- report to you. You can stop or adjust between phases.

**Working method:** I work directly, without workflows, and add no new dependencies.

| Phase | Scope | What you'll see |
|---|---|---|
| 0 · Foundations | Button and section rules, focus ring, contrast tokens, automatic numbering, matching prices, options before quick-add, newsletter thank-you, responsive images | The same site, more consistent and more trustworthy |
| 1 · Data | Product types, rent or own, the new rings and tennis necklaces (EN / FR), house facts, visits in the store, re-curated photos | Matching photos, and the signatures exist |
| 2 · Book a visit + Ask a jeweller | Both flows, plus their entry points in the header, menus, footer and Account | Booking from anywhere |
| 3 · Product page | Own · Rent, the doors, the maker's note, the new order, the sticky bar, "See it in person" | The new purchase panel |
| 4 · Home | Hero, signatures, the 9 acts, timeline, merges, swipeable rows on phones | The new Home |
| 5 · Chapters | Filters in the address, the two landing pages, Rentals, Shop all | Browsing by type, with Own and Rent |
| 6 · The rest + retention | Atelier, wishlist, bag and cart, gift cards; welcome back, the nudge, dates to remember | The whole journey joined up |
| 7 · Final polish | Word limit (EN / FR), motion, accessibility, speed, a full screenshot review | Sign-off |

---

## 11. Decisions I need from you or the owner

**Business** (each one changes what I build):

1. **Rental credit toward buying?** For example: "Your rental fee counts toward buying the piece within 60 days."
2. **Can every rentable piece also be bought,** or are some rental-only?
3. **Lab-grown diamonds:** offered? If yes, engagement rings get a "Natural · Lab-grown" choice.
4. **Visits:**
   - How long is a visit? (45 minutes?)
   - Which days and hours? The salon data says Tue–Sat, 10–18. Sunday by appointment?
   - Video calls?
   - Same-day visits?
5. **Contact:** WhatsApp? Text messages? Call-backs? What response time can the salon promise?
6. **The family and the team.**
   - Names, years and roles for the three generations and the designer. Today's copy has Teresa (1962), "her sons and granddaughter", Antonio and Marco.
   - Archive photos and portraits.
7. **Real press mentions,** if any.
8. **The online returns and exchanges policy,** for the bag's reassurance row.

**Design** (my recommendation in brackets):

9. The hero leads with engagement rings and gains a tennis slide. [Yes]
10. The moves in §6. [Yes to all]
11. Build "Shop all" in this pass. [Yes]

---

## 12. Out of scope (the prototype rules)

- **No backend or live services:** no real booking, no email, SMS or WhatsApp sending, no payments, inventory, accounts or Shopify calls.
- **No real photography,** and no legal review of the French or the policies.
- **The real theme would add:**
  - a booking app (Booxi, Calendly or a Shopify appointments app);
  - customer accounts;
  - a reviews app;
  - a rental booking app.

---

## Appendix A: Home, before and after

| Today, in order (desktop height) | After |
|---|---|
| Hero (788 px) + press strip (about 110 px) | Arrival: hero + trust strip |
| The Index (1,687 px) | 08 Find your piece, tab 1 |
| Most treasured (1,763 px) | 02 The selection |
| Try-on (901 px) | 07 See it on you |
| Bridal editorial (1,152 px) | 04 The engagement |
| Four Cs (1,121 px) | 04 The engagement, as the tabbed guide |
| Films (904 px) | 07 See it on you |
| Gift finder (1,548 px) | 08 Find your piece, tab 2 |
| The making (about 1,680 px, with its pinned scroll) | 05 Made here |
| Watches (953 px) | The compact band after 08 |
| Rentals (951 px) | 03 Rent or own |
| Testimonials (664 px) | 06 Three generations |
| Heritage quote (845 px) | 06 Three generations |
| Recently viewed (returning visitors) | Welcome back, under the hero |
| Services (649 px) | 09 Visit us, as the promise row |
| Social grid (571 px) | 09 Visit us, as a slim strip |
| Visit the salon (683 px) | 09 Visit us |
| — | **New:** 01 Our signatures; the timeline (06); the next free times (09) |

## Appendix B: Shot list for the real photography

**Every piece (4 photos):**
1. On travertine, in soft daylight, at 4:5.
2. On the body:
   - rings on a hand;
   - necklaces on a neck at the stated length.
3. A close-up of the details: claws, setting, the hallmark.
4. Worn.

**The signatures:** two hero portraits, one at 4:5 and one at 16:9, of one engagement ring and one tennis necklace, in the same light.

**The house:**
- the salon interior and the velvet tray;
- the bench: hands, loupe, wax, casting, setting, polishing;
- portraits of the family and the team;
- archive photos: the 1962 storefront, Teresa at the bench.

**Rentals:**
- a piece worn at an evening event;
- the courier hand-off box.

**Films (9:16, 10–15 s each):**
- a ring turning in daylight;
- a tennis necklace being clasped;
- the setter at the microscope.

## Sources

Figures marked "vendor" come from companies that sell these services, so read them as a direction, not as proof.

| Source | Topic |
|---|---|
| [Rapaport](https://rapaport.com/news/lab-grown-taking-over-engagement-ring-spending-the-knot/) | The Knot 2025: engagement-ring spending and lab-grown stones |
| [Jeweller Magazine](https://www.jewellermagazine.com/Article/10255/Majority-of-engagement-ring-buyers-shun-online-websites-study-finds) | Most engagement-ring buyers buy in store |
| [Jewelry by Morgan](https://jewelrybymorgan.thejewelerblog.com/new_study__when_it_comes_to_engagement_rings___getting_it_right__matters_most.html) | Summary of The Knot study |
| [Immerss](https://immerss.live/content/why-high-ticket-items-dont-sell-online-jewelry-luxury) | Online conversion and video consultations (vendor) |
| [Clientbook](https://www.clientbook.com/blog/retail-appointment-scheduling-clienteling-strategy) | Appointments and clienteling (vendor) |
| [Booxi](https://www.booxi.com/blog/appointment-scheduling-for-luxury) | Appointment scheduling for luxury retail (vendor) |
| [Tangiblee](https://www.tangiblee.com/fr/case-studies/jewlr) | Jewlr virtual try-on case study (vendor) |
| [Baymard Institute](https://baymard.com/blog/in-scale-product-images) | In-scale product images |
| [Baymard Institute](https://baymard.com/research/jewelry-and-watches) | Jewelry and watches UX research |
| [Verstolo guide](https://www.verstolo.com/guides/renting-fine-jewelry-vs-buying-what-high-end-clients-should-know/) | Renting fine jewelry vs buying |
| [Verstolo FAQ](https://www.verstolo.com/faq/) | Rental fees credited toward buying |
| [Rapaport](https://rapaport.com/magazine-article/the-lend-trend/) | The Lend Trend: rental programs |
| [FamilyBusiness.org](https://www.familybusiness.org/content/family-owned-or-family-run-the-words-you-use-can-affect-consumer) | "Family-owned" vs "family-run" |
| [WatchPro](https://usa.watchpro.com/?p=97148) | Oliver Smith Jeweler's homepage |
| [Motek](https://mymotek.com/pages/about) | Heritage story paired with consultations |
| [Prins & Prins](https://prinsandprins.com/why-heritage-jewellers-build-more-trust-than-online-retailers/) | Why heritage jewellers earn trust |
