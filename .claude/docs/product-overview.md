# Product overview, sitemap & user journeys

Teresa & Sons is depicted as a Montréal jewellery house, established 1962, that sells GIA-certified diamonds, gold jewellery, bridal rings and Swiss watches, rents high jewellery, takes personalized and bespoke commissions, and sells gift cards to shoppers in Canada (CAD) and the United States (USD). This repository is a Shopify-theme design prototype built as a client-only React 19 + TypeScript single-page app, scaffolded and hosted by Figma Make: there is no backend, the catalog is static data in `src/data`, all app state lives in one React context (`src/store.tsx`) persisted to `localStorage`, and routing is hash-based. This document is the product-level map: every route and how it is reached, every user-facing capability, the eight primary journeys step by step, exactly what is simulated, and the catalog taxonomy.

Scope: `src/App.tsx`, `src/store.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/pages/Home.tsx`, `src/pages/Category.tsx`, `src/pages/Product.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/pages/GiftCards.tsx`, `src/pages/Wishlist.tsx`, `src/pages/Account.tsx`, `src/pages/Atelier.tsx`, `src/data/catalog.ts`, `.figma/make/site.json`; supporting reads of every file under `src/components/**`, plus `src/data/giftcards.ts`, `src/data/media.ts`, `src/data/costing.ts`, `src/data/tax.ts`, `src/lib/shopify.ts`, `src/index.css`, `src/main.tsx`, `index.html`, `package.json`.

---

## 1. What this project is

### 1.1 The business, as the code presents it

| Aspect | What the code says (verbatim where quoted) | Where |
|---|---|---|
| Brand | "Teresa & Sons" wordmark (the `&` is a gold italic `<em>`); legal line "© {current year} Teresa & Sons Joailliers Inc." | `Header`, `Footer`, `GiftCardArt` |
| Origin | "Montréal · Est. 1962" under the header wordmark; hero side label "Joailliers · Montréal · Est. 1962" | `Header`, `HomeHero` |
| Founding story | "Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls." | `src/pages/Atelier.tsx` |
| People | Teresa (founder; The Teresa Signet's tagline is "Our founder’s ring, recast."); "Antonio Moretti · Second generation" (Home heritage quote); Marco, the setter ("Each claw raised and tightened under the microscope by Marco.") | `Home`, `catalog.ts`, `MakingScroll` |
| Salon | "1420 rue Sherbrooke Ouest", "Montréal, QC H3G 1K4", "Canada"; phone "+1 514 555 0162" | `Footer`, `VisitSalon` |
| Hours | Footer "Tue–Sat · 10h–18h"; Visit-salon block "Tuesday – Saturday, 10h – 18h · Sunday by appointment" | `Footer`, `VisitSalon` |
| Markets | "Shipping to Canada (CAD) & United States (USD)"; a CAD/USD toggle in the header of every page | `Footer`, `Header` |
| Offer | Nine "chapters" (`CATEGORIES`, eyebrows I–IX) plus gift cards; 27 catalog entries, 3 per category | `src/data/catalog.ts` |
| Service promises (header marquee) | "Complimentary insured shipping across Canada & the United States" · "Every diamond over 0.50 ct accompanied by a GIA report" · "Private appointments at our Sherbrooke Street salon" · "Lifetime cleaning & inspection on every piece" | `Header` (`announcements`) |

Positioning signals present in the code: an editorial "maison" voice with French eyebrows ("Chapitre V · Mariage", "Carte-cadeau", "Votre sélection", "Liste de souhaits", "Mon compte"), French micro-headlines ("Bon retour.", "Merci."), Roman-numeral chapters, GIA reports, insured signature delivery, duties prepaid to the U.S., lifetime care, a rental "vault", and private salon appointments. Tone rules live in [Brand, voice & copywriting](brand-voice-and-copy.md).

`.figma/make/site.json` title and description, verbatim:

> Teresa & Sons — Fine Jewellery in Montréal since 1962
>
> A family maison of fine jewellery on rue Sherbrooke Ouest since 1962: GIA-certified diamonds, bridal, gold heirlooms and rentals, set by hand in Montréal.

The same file sets `"language": "en-CA"`, `"robots": { "index": false }`, the favicon and social card (`icons`, `openGraph`, `customScripts.headEnd`) and `"accessibility": { "addBypassLinks": false, "ignoreReducedMotion": false }` (see [Figma Make platform, toolchain & build](platform-and-tooling.md)).

### 1.2 What the codebase is

- **A Shopify theme design prototype implemented as a React SPA.** Shopify is the intended runtime: `CartMeta` is documented as "Order-level options; map to Shopify cart `note` and `attributes`." (`src/store.tsx`); gift cards are "modelled on Shopify's native gift card product" (`src/data/giftcards.ts`); `src/lib/shopify.ts` builds `/cart/add.js` payloads for gift-card lines; UI copy cites "Shopify Checkout", "Shopify Customer Accounts" and "Shop Pay". Porting notes: [Shopify integration map & porting notes](shopify-integration.md).
- **Stack:** React 19 + TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), `gsap` (+ `ScrollTrigger`), `lenis`, `lucide-react` (`package.json`). `src/main.tsx` renders `<App />` inside `React.StrictMode`; `index.html` carries Figma Make placeholders such as `<!-- figma:title -->`.
- **No backend and no network calls.** There is no `fetch`/XHR anywhere in `src`. External resources are only Unsplash image URLs (`IMG` in `src/data/catalog.ts`), Mixkit stock clips (`src/data/media.ts`, commented "Clips are royalty-free stock from Mixkit, used as placeholders for brand films."), Google Fonts (`src/index.css`), and one outbound Google Maps link ("Get directions" in `VisitSalon`).
- **State:** one context, `StoreProvider` (`src/store.tsx`: route, currency, cart, drawer, gift/notes meta, wishlist, account, recently viewed), plus `TryOnProvider` (`src/components/tryon/TryOnProvider.tsx`), which opens the lazily loaded try-on studio. Runtime model: [Architecture & runtime model](architecture.md).

### 1.3 Global chrome (rendered on every route)

```text
StoreProvider                     src/store.tsx
└─ TryOnProvider                  renders <TryOnStudio> (React.lazy) when a request is open
   └─ SmoothScroll                Lenis + scroll-to-top on every route change
      └─ div.min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]
         ├─ Header                sticky top-0 z-50
         ├─ main > Routes         switch on route.name
         ├─ Footer
         ├─ CartDrawer            always mounted; slides in when cartOpen
         └─ div.film-grain        aria-hidden, fixed, pointer-events none
```

- **Header** (`src/components/Header.tsx`): announcement marquee; desktop nav (≥ `lg`): a menu button (two hairlines) that opens the full-height desktop menu, then "Shop" (mega-menu trigger), "Bridal", "Rentals", "Atelier"; mobile "Open menu" button (< `lg`); centred wordmark linking home; currency toggle "CA · CAD" / "US · USD"; account icon (≥ `sm`; gold dot when signed in); wishlist heart with count; bag button with count that opens the drawer. Mega menu and mobile menu are described in §2.3. Deep detail, including the desktop menu (search, live salon hours, recently viewed): [Global chrome & shared components](components/global-and-shared.md).
- **Footer** (`src/components/Footer.tsx`): "La lettre" newsletter ("Notes from the atelier, four times a year.", field "Email address", button "Subscribe"); columns "Shop" (all 9 categories), "Maison" ("Our Story", "Book an Appointment", "Gift Cards & Balance", plus plain-text items "GIA & Certification", "Care & Repairs", "Shipping & Returns"), "Salon" (address, phone, hours); a giant "Teresa & Sons" wordmark; bottom bar with the legal line and "Shipping to Canada (CAD) & United States (USD)".
- **CartDrawer**, **try-on studio**, smooth scrolling and the film-grain layer are global; see §2.3 and [Motion, animation & scroll behaviour](motion-and-interaction.md).

---

## 2. Sitemap

### 2.1 Route table

| Hash URL | `Route.name` | Component | Purpose | How users reach it |
|---|---|---|---|---|
| `#/` (also `#`, an empty hash, and **any unmatched hash**) | `home` | `src/pages/Home.tsx` (the `default` branch of `Routes`) | Editorial homepage: hero carousel, chapters index, bestsellers, try-on promo, education, gift finder, films, rentals, salon | Header wordmark; "Maison" breadcrumb on Category and PDP; Category not-found "Return home"; Checkout "Continue shopping" (empty bag) and "Return to the maison" (confirmation). The six `SocialGrid` tiles use `href="#/"` but call `preventDefault()`, so they do not navigate. |
| `#/c/:slug` | `category` (`slug`) | `src/pages/Category.tsx`, rendered as `<Category key={route.slug} …>` | Category page for one of 9 `CategorySlug`s; an unknown slug renders "This chapter could not be found." + "Return home" | Mega-menu chapter list and its image block ("Shop {name} →"); header "Bridal" and "Rentals"; mobile menu (9 chapters); footer "Shop" column; Home hero CTAs ("Discover necklaces", "Explore bridal", "View rentals"), "The Index" (all 9), "Continue the discovery" (necklaces), "Explore bridal", "Shop certified diamonds" (bridal), Gift Finder "All gifts" (gifts), "View the rental vault" (rentals); PDP breadcrumb and "View all"; Gift-cards breadcrumb "Gifts"; drawer empty state (necklaces, earrings, rings); cart empty state "Find your piece" (necklaces); wishlist empty state "Explore Rings"; account "Start shopping" (necklaces) |
| `#/p/:slug` | `product` (`slug`) | `src/pages/Product.tsx`, rendered as `<Product key={route.slug} …>` | Product detail page (PDP); an unknown slug renders "This piece has returned to the vault." | `ProductCard` everywhere it is used (category grids, "Most treasured", Gift Finder, Wishlist, "Recently viewed", "Also in …"); mega-menu featured links (first two products of the hovered chapter); `WatchSpotlight` rows; `RecentlyViewedStrip` rows; cart-line image, name and "Edit"; `CartUpsell` tiles and "Options"; Complete-the-look tiles; video-viewer product links and "Select options"; try-on studio "Choose dates" / "Personalize this piece" / "Choose size & options" |
| `#/gift-cards` | `giftcards` | `src/pages/GiftCards.tsx` | Gift card builder, how-it-works, balance checker, FAQ and corporate gifting | Mega-menu "Gift Cards" ("From $100 · never expires"); mobile menu "Gift Cards"; footer "Gift Cards & Balance"; Gifts category banner "Send a gift card"; drawer and cart-page empty states "Gift cards"; Account wallet "Send one"; gift-card cart lines (name and "Edit" both use `href.giftcards`) |
| `#/p/gift-card` (alias) | `giftcards` | `src/pages/GiftCards.tsx` | Lets the catalog's `gift-card` product, which generic `ProductCard`s link to as `#/p/gift-card`, land on the builder instead of a PDP | The gift-card product card in the Gifts grid, in Gift Finder results ("Under $1,000"), in "Also in Gifts" on the two other gift PDPs, and in the Wishlist grid if hearted |
| `#/cart` | `cart` | `src/pages/Cart.tsx` | Full bag: line editing, gifting & notes, summary with tax estimate, upsell grid | **Only** the drawer's "View full bag" button (the header bag icon opens the drawer, not this page) |
| `#/checkout` | `checkout` | `src/pages/Checkout.tsx` | Contact/shipping form, gift-card redemption, totals, simulated order placement and confirmation | "Secure checkout" in the drawer footer and in the cart-page summary |
| `#/wishlist` | `wishlist` | `src/pages/Wishlist.tsx` | Saved pieces, bulk add, share link, try the wishlist on | Header heart; mobile menu "Wishlist ({n})"; Account tile "View wishlist" |
| `#/account` | `account` | `src/pages/Account.tsx` | Simulated sign-in / create account; dashboard tiles, gift-card wallet, balance checker, preferred market | Header person icon (hidden below `sm`); mobile menu "My Account" / "Sign In"; Wishlist "Sign in" link; checkout confirmation "View in your account" (shown only when gift cards were issued) |
| `#/atelier` | `atelier` | `src/pages/Atelier.tsx` | Bespoke story and 4-step process, house films, private-appointment request form | Header "Atelier"; mobile "The Atelier"; footer "Our Story" and "Book an Appointment"; Home "Design your own", "Commission a piece", "Book a diamond viewing", Gift Finder empty state "Ask the concierge", Services "Speak with our concierge", Visit-salon "Book an appointment"; PDP "Book a viewing" and "Ask a jeweller"; PDP FAQ "Contact concierge"; Gift cards "Contact concierge"; cart page "Book a private consultation"; Account "Book a sizing" and "Book an appointment"; try-on studio "See it in person — book a viewing" |

### 2.2 Routing mechanics

`parseHash` in `src/store.tsx` is the whole router:

```ts
function parseHash(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'c' && parts[1]) return { name: 'category', slug: parts[1] }
  if (parts[0] === 'gift-cards' || (parts[0] === 'p' && parts[1] === 'gift-card')) return { name: 'giftcards' }
  if (parts[0] === 'p' && parts[1]) return { name: 'product', slug: parts[1] }
  if (parts[0] === 'atelier') return { name: 'atelier' }
  if (parts[0] === 'checkout') return { name: 'checkout' }
  if (parts[0] === 'cart') return { name: 'cart' }
  if (parts[0] === 'wishlist') return { name: 'wishlist' }
  if (parts[0] === 'account') return { name: 'account' }
  return { name: 'home' }
}
```

- **Order matters:** the gift-card alias is tested before the generic `p/:slug` branch, so `#/p/gift-card` never reaches `Product`.
- Matching is case-sensitive, reads only the first one or two segments (extra segments are ignored, e.g. `#/cart/x` is the cart), and `#/c` or `#/p` without a slug fall through to home. The leading slash is optional (`#c/rings` also works).
- **Links** are plain anchors built from the exported `href` helpers: `home '#/'`, `category(slug) '#/c/{slug}'`, `product(slug) '#/p/{slug}'`, `atelier '#/atelier'`, `checkout '#/checkout'`, `cart '#/cart'`, `wishlist '#/wishlist'`, `account '#/account'`, `giftcards '#/gift-cards'`. Nothing assigns `location.hash` programmatically; overlays close themselves through `onClick` on their links.
- `StoreProvider` listens to `hashchange` and calls `setRoute(parseHash())` (a new object each time). Browser back/forward work through the hash history; there is no `pushState`.
- On every `route` change: `SmoothScroll` jumps to the top (`lenis.scrollTo(0, { immediate: true })`, or `window.scrollTo(0, 0)` when Lenis is off) and schedules `ScrollTrigger.refresh()`; `Header` closes the mega menu and the mobile menu.
- `Category` and `Product` are keyed by slug, so all their local state (sort, selected metal, size, booking, personalization, CTA state) resets when moving between slugs.
- There is no HTTP-level 404: unknown top-level hashes render Home; unknown category/product slugs render the in-page messages quoted in §2.1.

### 2.3 Overlays and route-less surfaces

| Surface | Component | Opened by | Closed by | Stacking |
|---|---|---|---|---|
| Cart drawer | `src/components/CartDrawer.tsx` (`aside role="dialog"`, `aria-modal`, `inert` when closed) | Header bag button; **every** `addToCart` call (PDP, upsell, look/ensemble, video viewer, try-on studio, wishlist "Add all to bag", gift-card builder); PDP/sticky-bar "Go to bag" | "Close bag" (X, focused 50 ms after opening), backdrop click, Escape, any link inside (each has `onClick={close}`) | backdrop `z-[80]`, panel `z-[90]` |
| Mega menu (≥ `lg`) | `Header` | Hover or click "Shop" | Pointer leaves for 140 ms (`scheduleClose`), click toggle, route change | absolute below the sticky header (`z-50`) |
| Mobile menu (< `lg`) | `Header` | "Open menu" | "Close menu" (X), route change | `fixed inset-0 z-[70]` |
| Try-on studio | `src/components/tryon/TryOnStudio.tsx` (lazy chunk) | Any `TryOnButton` (see §5, J5) | "Close try-on" (X), Escape, its own links | `z-[110]` |
| Shoppable video viewer | `src/components/video/VideoViewer.tsx` (portal to `body`) | Clicking a film tile | "Close video", Escape, product links | `z-[100]` |
| PDP gallery lightbox | `src/components/pdp/Gallery.tsx` | Click on the stage image, or "Full screen" button (≥ `sm`) | "Close gallery", Escape (ArrowLeft/ArrowRight navigate) | `z-[95]` |
| Ring size guide | `src/components/pdp/RingSize.tsx` | "Size guide" | "Close", Escape, backdrop click | `z-[95]` |
| Review media lightbox | `Reviews` → `MediaLightbox` (portal) | Client photo/video thumbnails | "Close", Escape (arrows navigate) | `z-[100]` |
| Write-a-review modal | `Reviews` → `WriteReview` (portal) | "Write a review" | "Close" (X), backdrop click (no Escape handler) | `z-[100]` |
| PDP sticky bar | `src/components/pdp/StickyBar.tsx` | Main CTA scrolled above the viewport (`IntersectionObserver`) | CTA back in view | `fixed bottom-0 z-40` |
| Undo toast | `src/components/cart/UndoToast.tsx` | `removeLine` | Auto-hides after 6,000 ms, or "Undo" | inline in drawer / cart page |
| Native confirm | `Cart` "Clear bag" | Click | Browser dialog: "Remove everything from your bag?" | browser |

### 2.4 Page anatomy (section order per route)

Deep dives: [Home page](pages/home.md), [Category page & product card](pages/category.md), [PDP orchestration](pages/product.md), [PDP modules](components/pdp-modules.md), [Cart drawer, cart page & checkout](pages/cart-and-checkout.md), [Gift cards](pages/gift-cards.md), [Account & wishlist](pages/account-and-wishlist.md), [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md).

**Home (`#/`)**, top to bottom (section index → heading → primary links):

1. `HomeHero` — 3 slides, auto-advancing after 7 s of visible playback (`DURATION = 7`; it pauses on hover, keyboard focus, hidden tabs and off-screen, has a pause button, and does not autoplay under `prefers-reduced-motion`): "Collection Lumière · Automne" ("Light, set / by hand, / since 1962." → "Discover necklaces"), "Chapitre V · Mariage" ("A promise, / certified / to the facet." → "Explore bridal"), "Chapitre VII · La Location" ("Borrow the / vault / for a night." → "View rentals"). Slide controls read "01 Lumière", "02 Mariage" and "03 Location". On `lg` each slide features a catalog piece: Mont-Royal Solitaire Pendant, Notre-Dame Oval Solitaire, Gala Diamond Collar.
2. `PressStrip` — "As seen in": Vogue, ELLE Québec, The Globe and Mail, Harper’s Bazaar, La Presse, Town & Country, Montreal Gazette, Brides (marquee, text only).
3. `CategoryIndex` — "01 · Nine chapters · The Index"; desktop typographic list with a cursor-following hero preview and "{n} pieces" per chapter; mobile/tablet image cards.
4. `Treasured` — "02 · The selection · Most treasured"; tabs "Bestsellers" / "New arrivals" / "Atelier exclusives" (up to 6 cards); "Continue the discovery" → `#/c/necklaces`.
5. `TryOnFeature` — "— Essayage virtuel"; "See it on you, before it’s yours."; bullets "Live camera or an uploaded photo", "25 pieces, switch metals instantly" (count = wearable products), "Private — nothing leaves your device"; "Start virtual try-on" (opens on Vieux-Port Diamond Studs with all 25 wearable pieces as the list; the studio's "Try another" rail shows the first 12).
6. Bridal editorial (inline) — "03 Chapter V · Mariage"; "A promise, certified to the last facet."; spec strip Cut "Excellent", Color "D – G", Clarity "IF – VS2"; "Explore bridal", "Design your own" (→ Atelier).
7. `FourCs` — "04 Diamond Education"; "The Four Cs, explained by a jeweller."; tabs Cut / Color / Clarity / Carat with a "Teresa & Sons standard" range bar; "Shop certified diamonds" (→ bridal), "Book a diamond viewing" (→ Atelier).
8. `ShoppableVideos` — "Watch & shop" / "Seen in motion", all 10 films.
9. `GiftFinder` — "05 Le Trouveur de Cadeaux"; "Find the perfect gift." (§5, J8).
10. `MakingScroll` — "06 · The making"; "From bench to heirloom"; five steps (The sketch, The stone, The casting, The setting, The polish); "Five stages · 40+ hours". On `lg` with motion allowed the section pins and the track scrolls horizontally with the page (`gsap.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')`); below `lg` the track is a native `overflow-x-auto` scroller.
11. `WatchSpotlight` — "07 Chapter VI · Horlogerie"; "Time, kept beautifully."; the 3 watches as rows linking to their PDPs; image badge "Limited · 62 pieces".
12. Rentals editorial (inline) — "Chapter VII · La Location"; "Borrow the vault for an evening."; "Weekend · One week · One month"; "View the rental vault".
13. `Testimonials` — "4.9 / 5 · 1,200+ reviews"; 3 quotes rotating every 6,500 ms with dot buttons.
14. Heritage (inline) — "08 Chapter IX · Sur Mesure"; "Teresa believed a jewel should outlive its maker."; "Antonio Moretti · Second generation"; "Commission a piece" (→ Atelier).
15. `RecentlyViewed` — "Welcome back" / "Continue where you left off" (renders only when history exists).
16. `Services` — six tiles (Insured shipping, Lifetime warranty, Free engraving, Complimentary sizing, GIA certified, Private appointments) + "Questions? Speak with our concierge".
17. `SocialGrid` — "09 · @teresaandsons · Worn in Montréal"; "Follow #PorteTeresa" (a `span`, not a link); six inert tiles.
18. `VisitSalon` — "Le Salon"; "Come sit with us."; address, hours, phone; "Book an appointment" (→ Atelier), "Get directions" (Google Maps, new tab).

**Category (`#/c/:slug`)**: hero (category hero image, breadcrumb "Maison / Chapter {eyebrow}", name + italic French name, description) → Gifts-only banner to gift cards ("Carte-cadeau", "Not sure what to choose? Give the choice.", "Digital or mailed · scheduled delivery · never expires", "Send a gift card") or Rentals-only process strip ("Reserve online or in salon", "Fitting & ID verification", "Insured courier delivery", "Collected the next morning") → toolbar ("{n} pieces · Prices in {currency}", "Try these pieces on", "Sort": "Featured" / "Price, low to high" / "Price, high to low") → product grid (1 / 2 / 3 columns) → category films ("{Category name} · in motion" / "Worn & filmed"; hidden when the category has no films) → `RecentlyViewed`.

**PDP (`#/p/:slug`)**: breadcrumb bar ("Maison / {category} / {product}", "Ref. {ID}") → two-column hero: sticky `Gallery` (left, 7/12) and buy box (right, 5/12): availability line, "{collection} · Chapter {eyebrow}", name, tagline, rating button, price box, description, configurator steps, primary CTA, "View on you", "Book a viewing" / "Ask a jeweller", trust row, GIA card (if any), accordion ("Details & dimensions" open by default, "Care & servicing", "Shipping & returns · Canada" or "Shipping & returns · United States", "Gift presentation"). Then numbered lower sections, numbered only among those that render (`sectionOrder` / `num` in `Product.tsx`): price breakdown → craft story → films → complete the look → reviews → FAQ → "Also in {category}" → recently viewed; plus the sticky bar.

**Cart (`#/cart`)**: "Votre sélection" / "Your Bag" header with "{n} piece(s)" and "Clear bag" → empty state (or) line list + undo toast → "Gifting & notes" + trust list → sticky "Summary" aside → "Pairs beautifully with" grid (4) → recently viewed strip.

**Checkout (`#/checkout`)**: empty state (bag empty) **or** confirmation (after placing) **or** form ("Checkout", "Shopping in" market toggle, contact and shipping fields, "Place order") + sticky "Order summary" aside with gift-card redemption and totals.

**Gift cards (`#/gift-cards`)**: hero ("Gifts / Carte-cadeau", "The gift of choosing.") → builder (live card preview left, form "01 Design" … "04 Recipient" right) → "How it works" (Choose / Send / Redeem) → dark balance section ("Solde", "Check your balance") → "Questions · Gift card details" FAQ + "Corporate gifting".

**Wishlist (`#/wishlist`)**: "Liste de souhaits" / "Your Wishlist" + actions → device note when signed out → grid (2 / 4 columns) or empty state.

**Account (`#/account`)**: signed out → split screen with sign-in / create-account form; signed in → greeting + "Sign out", four tiles, gift-card wallet + balance checker, recently viewed strip, "Preferred market".

**Atelier (`#/atelier`)**: hero ("L'Atelier · Since 1962", "Made for you, by a family.") → 4-step process (Consultation, Stone sourcing, CAD & wax, Hand-finishing) → dark film rail "Inside the atelier" / "At the bench" (the 6 `@teresaandsons` films) → "Book a private appointment" form.

---

## 3. Feature inventory

Routes: **All** = global chrome; Home, Category, PDP, Cart, Checkout, Gift cards, Wishlist, Account, Atelier = the pages in §2.1. Persistence names are `localStorage` keys (§4); "none" means component state that is lost on unmount or reload.

### 3.1 Global & navigation

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Two languages (2026-10-21) | English (Canada, US by market) and French (Canada) everywhere, catalog included. Switch from the header's language and market menu, the mobile and desktop menus, the footer or the account page; a veil keeps the reader's place; the address carries `#/fr/`; a one-time notice for browser- or link-chosen languages; bilingual search; reviews with "See original" | `src/i18n/`, `src/components/locale/`, `src/components/transition/LanguageVeil.tsx`, `src/data/catalog.fr.ts`, `src/store.tsx` | All | `tns-lang`, `tns-lang-hint` |
| Announcement marquee | Four service messages in a seamless `Marquee` loop at 44 px/s, separated by ✦; eases to a stop on hover; static under reduced motion | `src/components/Header.tsx`, `src/components/Marquee.tsx` | All | none |
| Mega menu | "Shop" opens a clip-path panel: 9 chapters (eyebrow numeral, name, French name on hover) + "Gift Cards — From $100 · never expires"; middle column "Chapter {eyebrow}" + description + 2 featured products; right column hero/feature images + "Shop {name} →". Hovering a chapter sets the active one; hovering Gift Cards activates Gifts | `Header.tsx` | All (≥ `lg`) | none |
| Mobile menu | Full-screen list: 9 chapters, "The Atelier", "Gift Cards", "My Account"/"Sign In", "Wishlist ({n})" | `Header.tsx` | All (< `lg`) | none |
| CAD / USD currency switch | Header toggle "CA · CAD" / "US · USD"; also "Shopping in" on checkout (which also re-converts applied gift-card balances) and "Preferred market" on Account. Every `Price` re-renders; product USD prices are precomputed, deltas/accents/gift cards convert at `CAD_TO_USD = 0.73`; shipping, tax and trust copy switch per market | `src/store.tsx` (`setCurrency`), `Header.tsx`, `Checkout.tsx`, `Account.tsx`, `src/data/catalog.ts`, `src/data/giftcards.ts` (`convert`) | All | `tns-currency` |
| Price display | `formatPrice` (`Intl.NumberFormat` `en-CA`/`en-US`, currency style, 0 decimals) plus a smaller currency-code suffix, e.g. "$1,250 CAD" | `src/components/Price.tsx`, `catalog.ts` | All | n/a |
| Header badges | Wishlist count (espresso pill), bag count = sum of quantities (gold pill), gold dot on the account icon when signed in | `Header.tsx` | All | derived |
| Newsletter signup | Email field + "Subscribe"; `onSubmit` only calls `preventDefault()` (no feedback) | `src/components/Footer.tsx` | All | none |
| Smooth scrolling & scroll-to-top | Lenis (duration 1.25) synced to GSAP; off under reduced motion; jumps to top on each route change | `src/components/SmoothScroll.tsx` | All | none |
| Reveal / parallax / film grain | `[data-reveal]`, `[data-reveal-img]`, `[data-parallax]` scroll animations; animated grain overlay | `src/components/useReveal.ts`, `src/index.css` | All | none |

### 3.2 Discovery & editorial

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Hero carousel | 3 slides with layered clip-path wipes, per-slide progress controls with a pause button, and pointer parallax; on `lg`, a featured catalog piece (photo, name, GIA facts, link) | `src/components/HomeHero.tsx` | Home | none |
| Press strip | "As seen in" marquee of 8 publication names | `src/components/home/PressStrip.tsx` | Home | none |
| Chapters index | 9 categories with product counts; cursor-following image preview on desktop | `src/components/home/CategoryIndex.tsx` | Home | none |
| Most treasured | Tabs by badge: "Bestsellers" (`Bestseller`), "New arrivals" (`New`), "Atelier exclusives" (`Atelier Exclusive`); first 6 matches | `src/components/home/Treasured.tsx` | Home | none |
| 4Cs education | Tabbed Cut / Color / Clarity / Carat explainer with scale and the house range highlighted | `src/components/home/FourCs.tsx` | Home | none |
| Gift finder | Budget × occasion chips filter the catalog to ≤ 4 cards | `src/components/home/GiftFinder.tsx` | Home | none |
| Making-of scroll | Five-step horizontal story, pinned on desktop | `src/components/home/MakingScroll.tsx` | Home | none |
| Watch spotlight | The three watches as rows ("{Case} · {Movement}", price on ≥ `sm`) | `src/components/home/WatchSpotlight.tsx` | Home | none |
| Bridal / Rentals / Heritage editorials | Inline Home sections with CTAs to bridal, rentals and the Atelier | `src/pages/Home.tsx` | Home | none |
| Testimonials | 3 rotating client quotes with name, city and piece; static "4.9 / 5 · 1,200+ reviews" | `src/components/home/Testimonials.tsx` | Home | none |
| Services grid | Six service promises; shipping copy switches with currency | `src/components/home/Services.tsx` | Home | none |
| Social grid | Six image tiles under "@teresaandsons"; tiles do not navigate | `src/components/home/SocialGrid.tsx` | Home | none |
| Visit salon | Address, hours, phone, appointment CTA, Google Maps link | `src/components/home/VisitSalon.tsx` | Home | none |
| Category hero & breadcrumb | Category image, name, French name, description | `src/pages/Category.tsx` | Category | none |
| Category sort | "Featured" (catalog order), "Price, low to high", "Price, high to low" by base `priceFor(p, currency)` | `Category.tsx` | Category | none (resets per slug) |
| Category banners | Gifts → gift-card banner; Rentals → 4-step rental process | `Category.tsx` | Category (gifts, rentals) | none |
| Product card | 4:5 image with hover cross-fade to the second image, first badge, heart, "Try on" chip (revealed on hover on hover-capable devices), collection + name, price ("From {weekend rate}" for rentals, else base price) | `src/components/ProductCard.tsx` | Home, Category, PDP, Wishlist | n/a |

### 3.3 Product detail page

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Gallery | Views = each image ("Front", "Styled", "View n") + a "Film" view (inserted second when the product appears in a film) + a 1.9× "Detail" crop; thumbnail rail (≥ `lg`), mobile dots, prev/next, 1.8× hover lens, full-screen lightbox with keyboard; hosts the large heart and "View on you" chip | `src/components/pdp/Gallery.tsx` | PDP | none |
| Availability / lead time | "Available for reservation · fitted in salon" (rentals), "Made to order · approx. {n} weeks" (`leadTimeWeeks`), else "In stock · ships within 48 hours" | `src/pages/Product.tsx` | PDP | none |
| Rating summary | Five stars + seeded rating + "{count} reviews"; scrolls to `#reviews` | `Product.tsx`, `src/components/pdp/Reviews.tsx` (`getRatingSummary`) | PDP | none |
| Metal selection | Swatch buttons (`aria-pressed`) from `product.metals`; first metal preselected; price adds `METALS[m].priceDeltaCAD` (Platinum 950 +650 CAD / +475 USD; Gold Vermeil −400 CAD / −292 USD; golds 0) | `Product.tsx`, `catalog.ts` (`METALS`, `priceFor`) | PDP | none |
| Ring sizing | Required for `rings` and `bridal`; 11 North-American sizes 4–9 in half sizes; "Size guide" modal with diameter/circumference table; "One complimentary resize within the first year." | `src/components/pdp/RingSize.tsx` | PDP | none |
| Engraving | Free text ≤ 18 chars, "Engraving — complimentary" (or "Reverse engraving — optional" on personalized pieces), live preview on a band tinted with the metal swatch | `Product.tsx` | PDP | none |
| Personalization | Nameplate / initial / monogram with live preview, lettering (Script / Serif / Block), chain length, paid "Diamond accent"; validation | `src/components/pdp/Personalizer.tsx`, `catalog.ts` (`validatePersonalization`, `personalizationPrice`) | PDP | none |
| Rental booking | Period (Weekend / One week / One month) + calendar with seeded availability, courier vs salon hand-off, 4 time slots, return-date summary; validated before reserving | `Product.tsx`, `src/components/pdp/RentalCalendar.tsx`, `catalog.ts` | PDP | none |
| CTA states & sticky bar | CTA label "{Add to bag / Reserve this piece / Begin commission} — {price}" → "Added to bag" (2,200 ms) → "Go to bag" while that exact configuration is in the bag; sticky bottom bar (thumbnail, name, detail line, price, try-on icon, same action) once the CTA scrolls away | `Product.tsx`, `src/components/pdp/StickyBar.tsx` | PDP | none |
| Instalment & tax notes | "Or 4 interest-free payments of {`Math.round(amount / 4)`} with Shop Pay · " when amount ≥ 400 (non-rentals only); "Duties prepaid" (USD) or "Taxes calculated at checkout" (CAD); "See full cost breakdown" link | `Product.tsx` | PDP | none |
| Trust row | "Free insured / shipping in Canada" (CAD) or "Duties paid / shipping to the U.S." (USD); "Lifetime / warranty & care"; "Signature / gift presentation" | `Product.tsx` | PDP | none |
| GIA specs card | "GIA" / "Diamond grading report", "Report №" number, Shape, Carat (2 dp), Color, Clarity, Cut | `Product.tsx` | PDP (4 products) | none |
| Details accordion | Specs + "Reference", care copy, market-specific shipping & returns, gift presentation | `Product.tsx`, `src/components/pdp/Accordion.tsx` | PDP | none |
| Viewing / jeweller CTAs | "Book a viewing", "Ask a jeweller" → Atelier | `Product.tsx` | PDP | none |
| Price-transparency breakdown | "Transparent pricing · The price, itemised": composition bar, groups (Materials, Making charges, Certification & services, Selected options, Maison margin), metal weight and bench hours, taxes by province (CAD) or state + prepaid duties (USD), rental fee split and deposit | `src/components/pdp/PriceBreakdown.tsx`, `src/data/costing.ts`, `src/data/tax.ts` | PDP (24 products) | none |
| Craft story | Dark split section "The {collection} story" with category-specific headline, body and four stats (bridal, watches, rentals, default) | `src/components/pdp/CraftStory.tsx` | PDP | none |
| Complete the look / ensemble | Product + two paired pieces, set total, one-click add; for rentals, the other two rentals reserved together on the same booking | `src/components/pdp/CompleteTheLook.tsx` | PDP | none |
| Reviews | Seeded rating, count and 6 reviews; client media wall + lightbox; filters; "Show more reviews"; "Write a review" with photo/video upload | `src/components/pdp/Reviews.tsx`, `src/data/media.ts` | PDP | `tns-reviews-<slug>` (own reviews only) |
| Product FAQ | Category-specific questions (bridal, rentals, watches) followed by 4 general ones; "Contact concierge" | `src/components/pdp/ProductFAQ.tsx` | PDP | none |
| Related products | "Also in {category}" grid (the other two pieces) + "View all" | `Product.tsx` | PDP | none |

### 3.4 Cart & checkout

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Cart drawer | Right-hand panel (max 460 px): header with count and reward bar, lines, undo toast, upsell rail, gifting options; footer with subtotal, shipping copy, Shop Pay line, "Secure checkout", "View full bag", "Fully insured" / "30-day returns"; empty state with category links and recently viewed | `src/components/CartDrawer.tsx` | All | `tns-cart`, `tns-cart-meta` |
| Full cart page | Line list, "Gifting & notes", trust list, summary with tax estimate, delivery estimate, upsell grid, recently viewed | `src/pages/Cart.tsx` | Cart | `tns-cart`, `tns-cart-meta` |
| Line items | GiftCardArt or product image; eyebrow "Rental" / "Gift card" / collection; option lines; remove (X); "Edit" (navigates to the PDP or gift-card builder; the line is not edited in place); "Save for later"; "View on you"; qty stepper (minus at 1 removes; plus capped at 10); line total and "{unit} each" | `src/components/cart/CartLineItem.tsx`, `src/components/lineDetails.ts` | All (drawer), Cart | `tns-cart` |
| Configuration stacking | `lineKey` joins slug, metal, rental, engraving, size, booking, personalization and gift-card payload; identical configurations increment `qty` | `src/store.tsx` (`lineKey`, `addToCart`) | All | `tns-cart` |
| Undo remove | "Removed {name}" + "Undo" for 6 s; restores the line at its original index | `src/components/cart/UndoToast.tsx`, `store.tsx` (`removeLine`, `undoRemove`, `lastRemoved`) | All (drawer), Cart | none (`lastRemoved` is memory only) |
| Save for later | Adds the slug to the wishlist (if absent) and removes the line (undo-able) | `CartLineItem.tsx` | All (drawer), Cart | `tns-wishlist`, `tns-cart` |
| Gift options | Checkbox cards "Gift wrapping" — "Travertine box, silk ribbon, handwritten card" (when on, a message textarea ≤ 200 chars, "Your message, handwritten by our team") and "Gift receipt" — "Prices hidden on the packing slip", both tagged "Free"; collapsible "Order note" (≤ 500 chars) | `src/components/cart/GiftOptions.tsx` | All (drawer), Cart | `tns-cart-meta` |
| Reward progress | Bar towards a complimentary jewellery care kit at 1,000 CAD / 750 USD of merchandise (gift cards excluded) | `src/components/cart/RewardProgress.tsx`, `src/components/cart/useCartTotals.ts` (`REWARD_THRESHOLD`) | All (drawer), Cart | derived |
| Upsell | "Pairs beautifully with": pieces from paired categories, then bestsellers (excluding in-bag slugs, the gift card and commission/redesign pieces), quick-addable first; quick add (`addToCart({ slug, metal: metals[0] })`; icon-only "+" in the drawer rail, "Quick add" → "Added" in the cart-page grid) or an "Options" link to the PDP | `src/components/cart/CartUpsell.tsx` | All (drawer, 3), Cart (4) | none |
| Shop Pay instalments | "Or 4 interest-free payments of {installment} with Shop Pay", where `installment = Math.round(subtotal / 4)` from `useCartTotals` (pre-tax, gift cards included; hidden beside a designed ring's deposit); the PDP variant is described under "Instalment & tax notes" | `CartDrawer.tsx`, `Cart.tsx`, `useCartTotals.ts` | All (drawer), Cart | none |
| Tax estimate | Cart summary "Est. tax" with a province select (default Québec) when CAD; "Tax — Calculated at checkout" when USD; "Gift cards are not taxed." | `Cart.tsx`, `src/data/tax.ts` | Cart | none |
| Delivery estimate | "Order today, arrives by {date}" = 4 business days ahead skipping weekends; shown only with merchandise and no rental | `Cart.tsx` (`deliveryDate`) | Cart | none |
| Clear bag | Native confirm, then `clearCart()` | `Cart.tsx` | Cart | `tns-cart`, `tns-cart-meta` |
| Checkout form & summary | Market toggle, contact and (when needed) shipping fields with CA/US postal patterns, order summary, totals ("Merchandise", "Gift cards", "Insured shipping", tax, "Gift cards applied", "Total due") | `src/pages/Checkout.tsx` | Checkout | none |
| Gift-card redemption | Enter a 16-character code; validated and applied against merchandise + tax only; multiple cards; remove applied cards | `Checkout.tsx`, `src/data/giftcards.ts` | Checkout | reads `tns-giftcard-ledger` |
| Order placement & confirmation | Logs Shopify payloads for gift-card lines, debits applied cards, issues purchased cards, shows "Merci." with order number and issued cards, clears the cart | `Checkout.tsx`, `src/lib/shopify.ts`, `giftcards.ts` | Checkout | writes `tns-giftcard-ledger`; clears `tns-cart`, `tns-cart-meta` |

### 3.5 Gift cards

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Gift card builder | 4 designs; 6 presets (100–5,000) or a custom amount (CAD 50–10,000, USD 50–7,500); email or physical delivery; for someone else / for me; recipient name/email; scheduled send date (today … +365 days); message ≤ 200; sender name; quantity 1–20 | `src/pages/GiftCards.tsx`, `src/data/giftcards.ts` | Gift cards | `tns-cart` (on add) |
| Live card preview | `GiftCardArt` (ID-1 proportions, guilloche, amount, "For {name}") with pointer tilt on mouse; message card; Design / Delivery / Arrives strip | `GiftCards.tsx`, `src/components/giftcard/GiftCardArt.tsx` | Gift cards (also cart, checkout, account, gifts category) | none |
| Balance checker | Code field auto-formatted in groups of four; results or errors; "Demo card: TERE SASO NS19 62MT" | `src/components/giftcard/BalanceChecker.tsx` | Gift cards (dark), Account (light) | reads `tns-giftcard-ledger` |
| Gift-card wallet | Every card in the local ledger except the demo card, with masked code and "{balance} left"; empty state "Gift cards you buy will appear here. Send one" | `src/pages/Account.tsx` | Account (signed in) | reads `tns-giftcard-ledger` |
| Ledger | `issueCards` (on order), `debitCards` (on redemption), `lookupCard`; demo card auto-injected | `src/data/giftcards.ts` | Checkout, Gift cards, Account | `tns-giftcard-ledger` |
| FAQ & corporate gifting | Six questions; "Corporate gifting" card → "Contact concierge" | `GiftCards.tsx` | Gift cards | none |

### 3.6 Wishlist, account & history

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Wishlist toggle | Heart button (`aria-pressed`, "Save to wishlist" / "Remove from wishlist"), elastic GSAP pop; stops the parent card link from navigating | `src/components/WishButton.tsx`, `store.tsx` (`toggleWishlist`, `isWished`) | Home, Category, PDP, Wishlist | `tns-wishlist` |
| Wishlist page | Grid of saved pieces; "Try your wishlist on"; "Copy link"; "Add all to bag"; device note when signed out; empty state | `src/pages/Wishlist.tsx` | Wishlist | `tns-wishlist` |
| Sign in / create account | Tabs "Sign in" / "Create account"; any email + password ≥ 8 chars signs in | `src/pages/Account.tsx`, `store.tsx` (`signIn`, `signOut`) | Account | `tns-account` |
| Account dashboard | "Bonjour, {name}."; tiles Orders, Wishlist, Ring sizes, Care & servicing; wallet + balance checker; recently viewed; "Preferred market" | `Account.tsx` | Account | `tns-account`, `tns-currency` |
| Recently viewed | Each PDP mount records the slug (most recent first, max 12); shown as a card section or a compact strip; "Clear history" / X | `src/components/RecentlyViewed.tsx`, `store.tsx` (`recordView`, `clearRecent`) | Home, Category, PDP, Cart, Checkout (empty), Wishlist (empty), Account, drawer (empty) | `tns-recent` |

### 3.7 Media, try-on & atelier

| Feature | What it does | Files | Routes | Persistence |
|---|---|---|---|---|
| Virtual try-on | Full-screen studio: live camera or uploaded photo, SVG jewellery overlay in the chosen metal, drag / pinch / wheel / sliders / nudges, guide overlay, mirror and camera switch, capture to PNG with download, metal switch, "Try another" rail, add to bag or go configure | `src/components/tryon/TryOnProvider.tsx`, `TryOnStudio.tsx`, `JewelryOverlay.tsx`, `TryOnButton.tsx`, `catalog.ts` (`tryOnKind`) | All (opened from Home, Category, PDP, Cart, Wishlist, drawer, video viewer) | none (nothing stored or uploaded) |
| Category / wishlist try-on | "Try these pieces on" (category toolbar; list = wearable pieces in the category) and "Try your wishlist on" | `Category.tsx`, `Wishlist.tsx` | Category, Wishlist | none |
| Shoppable videos | Horizontal rail of autoplaying muted vertical films (play when ≥ 60 % visible); full-screen viewer with progress segments, mute, pause, swipe/keys, tagged products with add/select/try-on | `src/components/video/ShoppableVideos.tsx`, `VideoViewer.tsx`, `useInViewPlay.ts`, `src/data/media.ts` | Home, Category, PDP, Atelier | none |
| Atelier & appointment request | Story, 4-step bespoke process, house films, form (Full name, Email, Phone, Interest, idea) → thank-you message | `src/pages/Atelier.tsx` | Atelier | none |

---

## 4. State & persistence reference

All persistence is `localStorage` on the current device; there is no server state. Detailed shapes: [Data layer](data-model.md) and [Architecture](architecture.md).

| Key | Holds | Written by | Cleared / reset by |
|---|---|---|---|
| `tns-currency` | `'CAD'` or `'USD'` (default `'CAD'`) | `setCurrency` | never |
| `tns-cart` | `CartLine[]` | effect on every `cart` change | `clearCart()` (order placed, "Clear bag") |
| `tns-cart-meta` | `CartMeta { giftWrap, giftReceipt, giftMessage, note }` | effect on every `meta` change | `clearCart()` resets to `DEFAULT_META` |
| `tns-wishlist` | product slugs, insertion order | effect on `wishlist` change | only by un-hearting |
| `tns-account` | `Account { name, email }` | effect on `user` change | removed on `signOut()` |
| `tns-recent` | slugs, most recent first, max 12 | effect on `recent` change | "Clear history" / strip X |
| `tns-giftcard-ledger` | `IssuedCard[]` (demo card prepended on read if absent) | `issueCards`, `debitCards` (`saveLedger`) | never |
| `tns-reviews-<slug>` | the shopper's own reviews for that product (images as JPEG data URLs; videos dropped) | `saveMine` in `Reviews.tsx` | never |

Session-only state: `route` (derived from the URL hash), `cartOpen`, `lastRemoved`, and every page-local state (PDP configuration, checkout applied cards and confirmation, gift-card builder fields, Atelier `sent`, review filters).

`CartLine` (the unit every purchase flow produces), from `src/store.tsx`:

```ts
export interface CartLine {
  key: string
  slug: string
  metal?: Metal
  rental?: 'weekend' | 'week' | 'month'
  engraving?: string
  size?: string
  booking?: RentalBooking
  personalization?: Personalization
  giftCard?: GiftCardLine
  qty: number
}
```

Pricing of a line (`linePrice`): gift card → `convert(amount, giftCard.currency, currency) × qty`; rental → `product.rental[period][currency] × qty`; otherwise `(priceFor(product, currency, metal) + personalizationPrice(…)) × qty`. Totals, tax and checkout math: [Commerce logic](commerce-logic.md).

---

## 5. Primary user journeys

Example values are computed from `src/data/catalog.ts` (USD = `Math.round(CAD × 0.73 / 5) × 5` unless set explicitly).

### J1 — Browse a collection → PDP → metal & size → add → drawer → cart → checkout → confirmation

Example piece: Notre-Dame Oval Solitaire (bridal, GIA, platinum-first, size required, engravable).

1. **Open a category.** Desktop: hover "Shop" and click "Bridal Jewelry" in the mega menu, or click "Bridal" in the header nav. Mobile: "Open menu" → "Bridal Jewelry". The hash becomes `#/c/bridal`; `hashchange` → `route = { name: 'category', slug: 'bridal' }`; `<Category key="bridal">` mounts; the page jumps to the top; menus close.
2. **Scan the grid.** Hero "Bridal Jewelry" + italic "Mariage", breadcrumb "Maison / Chapter V". Toolbar "3 pieces · Prices in CAD", "Try these pieces on", "Sort". Cards show the first badge, the base price without any metal delta ("$18,900 CAD"), a heart and a "Try on" chip.
3. **Open the PDP.** Clicking the card goes to `#/p/notre-dame-oval-solitaire`. On mount `recordView('notre-dame-oval-solitaire')` moves the slug to the front of `recent` (→ `tns-recent`). The buy box shows "In stock · ships within 48 hours", "Notre-Dame · Chapter V", the name, "A cathedral setting for an oval.", the rating button and the price. Because `metal` starts at `product.metals[0]` = `platinum`, the PDP price is 18,900 + 650 = **$19,550 CAD** (USD 13,795 + 475 = **$14,270**).
4. **Configure.** Steps number themselves in render order: "01 Metal" (Platinum 950, 18k White Gold, 18k Yellow Gold, 18k Rose Gold; picking a gold drops the price to $18,900 CAD); "02 Ring size" (4 … 9, "Size guide"); "03 Engraving — complimentary" (≤ 18 chars, live band preview). The GIA card reads "Report № 1449286107", Shape "Oval", Carat "1.82", Color "E", Clarity "VS1", Cut "Excellent".
5. **Add to bag.** Click "Add to bag — $19,550 CAD". `handleAdd` checks size: if missing, `sizeError` turns the legend red ("— please select") and scrolls to `#step-size` (`lenis.scrollTo(el, { offset: -140 })`, or `scrollIntoView` without Lenis). When valid it calls `addToCart({ slug, metal, engraving: trimmed || undefined, size })` (`rental`, `booking`, `personalization` undefined). The store computes `lineKey`; an identical configuration increments `qty`, otherwise `{ …line, key, qty: 1 }` is appended; `cartOpen = true`; `tns-cart` is rewritten. The CTA turns gold with "Added to bag" for 2,200 ms, then shows "Go to bag →" while this exact configuration is in the bag (changing metal, size or engraving brings "Add to bag" back).
6. **Drawer.** It slides in from the right (700 ms), page scroll is locked (Lenis stopped, `body` overflow hidden), focus moves to "Close bag" after 50 ms, and Escape or a backdrop click closes it. It shows "Your Bag (1)", the reward bar ("Unlocked: a complimentary jewellery care kit is included with your order." at ≥ 1,000 CAD / 750 USD of merchandise), the line (eyebrow "Notre-Dame"; options "Platinum 950", "Size {n}", `Engraving: “…”`), stepper, "Edit", "Save for later", "View on you", "Pairs beautifully with", "Gifting" options, and the footer (Subtotal; "Complimentary insured shipping across Canada. Taxes calculated at checkout."; Shop Pay line; "Secure checkout"; "View full bag").
7. **Cart page.** "View full bag" → `#/cart` (the drawer closes). Summary: "Jewellery", "Shipping — Complimentary", "Est. tax" with a province select (default Québec, 14.975 %), "Estimated total", the Shop Pay line, "Order today, arrives by {date}", "Secure checkout", "Gift cards and promo codes can be applied at checkout."; below the lines: "Gifting & notes" and the trust list; then a 4-item upsell grid and the recently viewed strip.
8. **Checkout.** "Secure checkout" → `#/checkout`. Choose "Canada · CAD" or "United States · USD" (this changes the global currency). Fill Email, First name, Last name, Address, City, Province (or State), Postal code (pattern `[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d`, placeholder "H3G 1K4"; ZIP pattern `\d{5}(-\d{4})?`, placeholder "10001"), Phone. The summary lists the line ("{options} · ×1"), "Merchandise", "Insured shipping — Complimentary", "Tax · GST 5% + QST 9.975%" (CAD; follows the province select) or "Sales tax — Calculated by Shopify" (USD), and "Total due". The note reads "Payment is completed securely through Shopify Checkout." plus market-specific shipping copy.
9. **Place the order.** "Place order" submits the form (native HTML validation gates it). `placeOrder` logs nothing (no gift-card lines), runs `debitCards([])` and `issueCards([], [])` (both still re-save the ledger), sets `placed = { order: 'TS-' + last 6 digits of Date.now(), issued: [], paidWithCards: 0 }`, and calls `clearCart()` (empties `cart`, resets `meta`, clears `lastRemoved`).
10. **Confirmation.** "Order TS-######", "Merci.", "A confirmation is on its way.", "Return to the maison". The confirmation exists only in component state: reloading or returning to `#/checkout` later shows "Your bag is empty." with "Continue shopping".

### J2 — Rental booking

Example piece: Gala Diamond Collar (weekend $650 / week $1,400 / month $3,900 CAD; deposit $5,000 CAD).

1. **Find the vault.** Header "Rentals", hero slide "View rentals", Home "View the rental vault", mega menu "Jewelry Rentals" or footer → `#/c/rentals`. A strip explains "01 Reserve online or in salon · 02 Fitting & ID verification · 03 Insured courier delivery · 04 Collected the next morning". Cards show "From $650 CAD" (the weekend rate).
2. **PDP basics.** `#/p/gala-diamond-collar` shows "Available for reservation · fitted in salon", the price for the selected period with "per weekend" / "per week" / "per month", and "Refundable deposit $5,000 CAD · insurance included · What the fee covers" (the button scrolls to `#price-breakdown`). There is no Shop Pay line and no metal step.
3. **"01 Rental period".** Buttons "Weekend", "One week", "One month", each with its price → `period` (default `'weekend'`). The same state drives the price breakdown and the Complete-the-ensemble prices.
4. **"02 Dates & delivery"** (`RentalCalendar`). A month grid opens on the month containing today + 2 days (`RENTAL_LEAD_DAYS = 2`) and can move up to 6 months ahead. A start day is disabled if it is earlier than the lead time or if any day of its window (`RENTAL_DAYS`: weekend 3, week 7, month 30) is reserved; reserved days are struck through; hovering previews the window; legend "Start · Your {n} days · Reserved · 2 days’ notice". Clicking sets `booking.start` (ISO `yyyy-mm-dd`). Hand-off: "Insured courier — Delivered & collected" (default) or "Salon fitting — 1420 Sherbrooke O." → `booking.method`. Time ("Delivery window" or "Fitting time", enabled once a date is set): "09:00 – 11:00", "11:00 – 13:00", "14:00 – 16:00", "17:00 – 19:00" → `booking.slot`. A summary shows "Delivered"/"Fitting" {date} {slot} → "Collected" {start + n days} "by 12:00". If a period change makes the chosen window overlap a reservation, the summary turns red: "This piece is reserved during part of a {period} rental from this date. Please choose another start date."
5. **Reserve.** "Reserve this piece — $650 CAD" runs `isBookingValid` (start and slot set, start ≥ today + 2, window free). On failure: `bookingError` (red legend "— choose a start date", red border, " — please choose" on the slot label) and a scroll to `#step-dates`. On success: `addToCart({ slug, rental: period, booking })`, drawer opens.
6. **In the bag.** Eyebrow "Rental"; options "Weekend rental" / "One-week rental" / "One-month rental", "{start} → {return}", "Courier · {slot}" or "Salon fitting · {slot}". Price = rate × qty. Rentals count as merchandise for the reward bar and tax.
7. **Optional: reserve the ensemble.** "Complete the ensemble" ("Styled for the evening") shows the other two rentals with a "Weekend / 1 Week / 1 Month" toggle (writes the shared `period`), "The ensemble · Weekend" (or "· 1 Week", "· 1 Month") total and the combined deposit ("One fitting, one insured delivery, collected together."). "Reserve the ensemble": if the booking above is not valid it runs the main CTA's validation (error + scroll to dates); if any piece is reserved in that window it shows "{name} is reserved on these dates. Try another start date, or reserve pieces individually."; otherwise it adds one rental line per piece with the same booking.
8. **Price breakdown (rental variant).** "Use of the piece" plus "Full insurance cover" (22 % of the fee), "Cleaning & re-certification" (8 %), "Bonded courier, both ways" (12 %); tax by province; "Refundable security deposit" with "Card pre-authorisation · released within 48 h of return".
9. **Cart & checkout.** The cart page hides the "arrives by" estimate whenever a rental is present (`hasRental`). Checkout charges fee + tax; the deposit is never added.

### J3 — Personalized nameplate

Example piece: Engraved Nameplate Necklace (`custom`, $1,250 CAD / $915 USD, 3-week lead time).

1. **Find it.** Mega menu, footer or "The Index" → "Personalized & Custom" (`#/c/custom`) → card with badge "Made to Order".
2. **PDP.** "Made to order · approx. 3 weeks"; eyebrow "Personalized · Chapter IX".
3. **"01 Metal".** 18k Yellow, White or Rose Gold ($1,250 CAD) or Gold Vermeil ($850 CAD; USD $623).
4. **"02 Personalize — your name".** Live preview (fallback text "Teresa"; gold-gradient lettering tinted by the metal swatch; dashed chain; captions "Live preview" and "{length} chain"; a white diamond dot when the accent is on). Text field: placeholder "e.g. Sofia", max 10 characters, counter "{n}/10", hint "Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes.". Lettering "Script" (default, `fonts[0]`), "Serif", "Block". Chain length "16 in" / "18 in" (default, `chainLengths[1]`) / "20 in". "Diamond accent" checkbox "+ $180 CAD" ("+ $130 USD"). Footnote: "A digital proof is emailed for your approval before we cut. Personalized pieces are final sale."
5. **No other steps.** No ring size (category `custom`) and no engraving field (the config has no `backEngraving`).
6. **Commit.** The CTA reads "Begin commission — {price}" (every `custom` product uses this label). Invalid text sets `personalError` (red legend, message shown even for empty text) and scrolls to `#step-personal`. Messages from `validatePersonalization`: "Please enter at least 2 characters", "Maximum 10 characters", "Some characters cannot be engraved" (allowed class `A-Za-zÀ-ÿ '\-`).
7. **Line.** `personalization: { text: trimmed, font, chainLength, accent }`; options read e.g. `“Sofia” · Script · 18 in · Diamond accent`; a different name or font makes a separate line. Price = metal price + accent.
8. **Preview on you.** "View on you" passes the typed name; the necklace overlay draws it in script. The sticky bar detail reads e.g. "18k Yellow Gold · “Sofia”".

Other personalized pieces: **The Teresa Signet** (monogram, 1–3 letters `A-Za-z`, auto-uppercased, oval face preview; also "Ring size" and "Reverse engraving — optional"; CTA "Add to bag") and **Initial Disc Pendant** (26 letter buttons, chain lengths, "Reverse engraving — optional"; CTA "Add to bag").

### J4 — Gift card purchase (email vs physical, scheduled) → issue → wallet / balance

1. **Open the builder.** Mega menu "Gift Cards", mobile menu, footer "Gift Cards & Balance", Gifts banner "Send a gift card", or the gift-card product card (`#/p/gift-card` alias) → `#/gift-cards`.
2. **Defaults.** Design Travertine, amount 250, delivery email, "For someone else", send date today, quantity 1.
3. **"01 Design".** Travertine, Espresso, Vermeil, Mont-Royal (`aria-pressed`); the preview restyles.
4. **"02 Amount ({currency})".** Presets $100, $250, $500, $1,000, $2,500, $5,000 (same numbers in both currencies) or "Custom amount, 50–10,000" (CAD) / "Custom amount, 50–7,500" (USD); the custom field keeps digits only (≤ 5) and overrides the preset.
5. **"03 Delivery".** "By email — Instantly or on a date you choose" or "Physical card — Mailed in our travertine box · free".
6. **"04 Recipient".** "For someone else" shows "Recipient name" and, for email delivery, "Recipient email" and "Send on" (date input, today to today + 365; clearing it resets to today); physical delivery shows "You’ll enter the mailing address at checkout.". "For me" hides recipient fields. Optional message (≤ 200, counter) and "From (your name)". The preview strip shows "Arrives": "2–5 days" (physical), "Instantly" (for me or today), or the scheduled date.
7. **Add.** Quantity stepper ("Fewer cards"/"More cards", 1–20) and "Add to bag — {amount × qty}". Errors (listed in a `role="alert"` block): "Choose an amount between {min} and {max}.", "Add the recipient’s name.", "Add a valid recipient email.". On success a `GiftCardLine` is built (`sendOn` kept only when delivered by email to someone else on a future date) and `addToCart({ slug: 'gift-card', giftCard })` runs once per card, stacking into one line with that quantity; the drawer opens and the button shows "Added to bag" for 2,400 ms.
8. **In the bag.** GiftCardArt thumbnail; eyebrow "Gift card"; options "{Design} design · Digital" (or "· Physical card"), "For me" or "To {name} · {email}", "Sends {date}", the message in quotes (cut at 40 chars). No "Save for later" or "View on you"; "Edit" opens the builder fresh. Cart summary: "Gift cards" row, "Gift cards are not taxed.", and "Shipping — Digital delivery" when the bag holds only gift cards; the reward bar is hidden without merchandise.
9. **Checkout.** Digital-only bags skip the address: "Digital gift cards only — no shipping address needed."; any physical card or merchandise requires shipping fields. A gift card cannot pay for gift cards ("Gift cards can’t be used to buy other gift cards.").
10. **Issue.** "Place order" logs the `/cart/add.js` payloads (`console.info('[Shopify] gift card cart items', …)`), calls `issueCards` (one random 16-character code per unit, saved to `tns-giftcard-ledger`), and the confirmation lists each card (art with code) with "Mailed in our travertine box, 2–5 business days.", "Emailed to you now." or "Emailed to {email} on {date}." / "Emailed to {email} now.", plus "View in your account".
11. **Wallet and balance.** Signed in, Account lists issued cards with masked code and "{balance} left". The balance checker (Gift cards page and Account) accepts any issued code or the demo card "TERE SASO NS19 62MT" (CAD 250) and reports "{balance} {CUR} remaining on •••• •••• •••• {last4}", "originally …" when partly used, and "never expires".

### J5 — Virtual try-on

1. **Entry points** (all `TryOnButton`, which renders nothing for pieces that cannot be tried on: the gift card and Heirloom Redesign): product-card chip "Try on"; PDP gallery chip "View on you"; PDP outline button "View on you" (passes the selected metal, personalized text and `[product, …related]`); sticky-bar icon; category "Try these pieces on"; wishlist "Try your wishlist on"; cart-line link "View on you" (passes the line's metal and text); Home "Start virtual try-on"; video-viewer "Try on" chips.
2. **Open.** `openTryOn({ product, metal?, text?, list? })` stores the request; `TryOnStudio` loads lazily (Suspense fallback is nothing) as a full-screen dialog (`z-[110]`); page scroll locks; Escape closes.
3. **Choose a source.** Idle screen: "Essayage virtuel", "View it on you", "{guide}. Your camera feed stays on this device.", buttons "Start camera" and "Upload a photo". The camera uses the front camera for necklaces and earrings and the rear camera for rings, bracelets and watches (mirrored only for the front camera). Other states: "Waiting for camera permission…", "Camera access was declined. You can allow it in your browser settings, or use a photo instead." (+ "Try camera again"), "Your browser does not support camera access here. Upload a photo to try the piece on."
4. **Place the piece.** A dashed head-and-shoulders or hand outline with the guide text (e.g. "Face the camera, hair tucked back"); the SVG piece appears at a preset position. Drag with one pointer, pinch/rotate with two, wheel to scale (0.3–3); sliders "Size", "Rotation" and, for earrings, "Spacing"; nudge buttons ← → ↑ ↓; controls "Switch camera", "Mirror image", "Toggle positioning guide", "Reset position"; tip line at the bottom (e.g. "Align each stone with your earlobes using Spacing.").
5. **Switch metal / piece.** Metal swatches (when the piece has more than one metal and is not a rental) recolour the overlay and update the price; "Try another" (up to 12 pieces from the list) switches product, resetting placement when the jewellery kind changes.
6. **Capture.** The shutter composites the frame, the overlay and the mark "Teresa & Sons · Montréal" into a PNG; "Retake" or "Save photo" (downloads `{slug}-try-on.png`).
7. **Buy.** Pieces needing configuration (rental, personalized, rings, bridal, custom) show a link to the PDP: "Choose dates", "Personalize this piece" or "Choose size & options" (closes the studio). Others show "Add to bag" → `addToCart({ slug, metal })` and "Added to bag"; the drawer opens beneath the studio. "See it in person — book a viewing" → Atelier.
8. **Close.** X or Escape; camera tracks stop on unmount. Footnote: "Processed entirely on your device. Nothing is recorded or uploaded. The rendering is an illustration — proportions are approximate." Deep dive: [Virtual try-on](features/virtual-try-on.md).

### J6 — Shoppable video purchase

1. **Find films.** Home "Watch & shop / Seen in motion" (all 10), category "{Category} · in motion / Worn & filmed" (necklaces 2, earrings 3, bracelets 3, rings 3, bridal 4; none for watches, rentals, gifts, custom), PDP "Watch & shop / See it in motion" (films featuring the piece first, then others from its category), Atelier "Inside the atelier / At the bench" (6 house films). Tiles autoplay muted when at least 60 % visible (not under reduced motion) and show the handle, title, and the first tagged product with price and "+{n}". Arrow buttons appear when there are more than 3 films.
2. **Open the viewer.** Clicking a tile opens `VideoViewer` (portal, `z-[100]`) at that film; page scroll locks.
3. **Watch.** Progress segments per film; starts muted ("Unmute"/"Mute"); click the video, press Space or use the button to pause/play; next/previous via ArrowDown/ArrowRight and ArrowUp/ArrowLeft, a vertical swipe over 60 px, or the desktop chevrons; Escape or X closes.
4. **Shop (desktop panel).** "{nn} / {nn} · Shop the film", title, caption, and each tagged product: name/price link to its PDP; "Add to bag" for pieces that are not rentals, personalized, rings or bridal (`addToCart({ slug, metal: metals[0] })`, button becomes "Added"; the drawer opens beneath the viewer) or "Select options" (→ PDP, closes the viewer); "Try on" opens the try-on studio above the viewer.
5. **Shop (mobile overlay).** Title, caption and horizontally scrolling product chips linking to the PDPs (closing the viewer).

### J7 — Wishlist + account sign-in

1. **Heart a piece.** The heart on a product card (`preventDefault` + `stopPropagation`, so the card link does not fire) or on the PDP gallery toggles the slug in `wishlist` (→ `tns-wishlist`), pops with an elastic animation and fills gold; the header heart shows the count. "Save for later" on a cart line also adds to the wishlist.
2. **Open the wishlist.** Header heart or mobile "Wishlist ({n})" → `#/wishlist`: "Liste de souhaits" / "Your Wishlist", grid of saved pieces, "Try your wishlist on", "Copy link" (writes `{origin}{pathname}#/wishlist` to the clipboard), "Add all to bag" (adds every saved piece except rentals, personalized pieces and the gift card, each with its first metal). Signed out, it notes: "Saved on this device. Sign in to keep your wishlist across devices.". Empty: "Nothing saved yet.", "Tap the heart on any piece to keep it here.", "Explore Rings", and a "Pieces you looked at" strip.
3. **Sign in.** "Sign in" → `#/account`: image panel "Welcome to the family." (≥ `lg`) and a form with tabs "Sign in" / "Create account", headings "Bon retour." / "Join the maison.", fields "Full name" (create only), "Email", "Password" (`minLength` 8), a create-only checkbox "Receive La Lettre and private sale invitations", and the note "Accounts are managed through Shopify Customer Accounts.". Submitting calls `signIn({ email, name: name || email local part })` → `tns-account`; the password is discarded.
4. **Signed-in state.** Header icon gains a gold dot (`aria-label` "Account, {name}"); mobile menu reads "My Account"; the wishlist's device note disappears. Dashboard: "Mon compte", "Bonjour, {name}.", email, "Sign out"; tiles "Orders" ("No orders yet. Track deliveries and rental returns here." → "Start shopping"), "Wishlist" ("{n} saved piece(s)." → "View wishlist"), "Ring sizes" ("Save your sizes for faster checkout and gifting." → "Book a sizing"), "Care & servicing" ("Complimentary cleaning and inspection, every year." → "Book an appointment"); gift-card wallet + balance checker; recently viewed (5); "Preferred market — Sets currency, taxes and shipping options." with "Canada" / "United States".
5. **Sign out.** `signOut()` removes `tns-account`; the wishlist, cart and gift-card ledger stay on the device.

### J8 — Gift finder from Home

1. **Reach it.** Scroll Home to "05 Le Trouveur de Cadeaux — Find the perfect gift." ("Choose a budget and an occasion. Every gift arrives in our travertine box with a handwritten card.").
2. **Budget** (label "Budget ({currency})"): "Under $1,000", "$1,000 – $5,000" (default), "$5,000 – $15,000", "$15,000 +". The thresholds compare against the base price in the active currency.
3. **Occasion:** "Any occasion" (default, everything), "Anniversary" (bridal, necklaces, earrings), "For myself" (rings, bracelets, earrings), "For him" (watches, rings, or any engravable piece), "Milestone" (engravable pieces).
4. **Results.** Up to 4 `ProductCard`s, excluding rentals and custom pieces, recomputed on every chip or currency change. Defaults: CAD → Plateau Paperclip Chain, Outremont Pearl Drops, Mile End Huggies, Griffintown Chain Bracelet; USD → Plateau Paperclip Chain, Outremont Pearl Drops, Mile End Huggies, Atwater Cuff. "Under $1,000" + "Any occasion" in CAD returns Initial Disc Pendant, Pearl Stud Gift Set and the gift-card product (its card links to the gift-card builder).
5. **Empty state.** "Nothing in this pairing — yet." / "Our concierge can source or commission something special." / "Ask the concierge" (→ Atelier). This happens for CAD "Under $1,000" + "Anniversary", CAD "Under $1,000" + "For myself", and USD "Under $1,000" + "Anniversary".
6. **Continue.** Cards lead to PDPs (heart and try-on chips work in place); "All gifts" → `#/c/gifts`.

---

## 6. Demo / simulation boundaries

| Area | What the UI implies | What actually happens |
|---|---|---|
| Back end / store platform | A Shopify store | Static SPA; catalog in `src/data`; no network requests (media URLs only) |
| Inventory | "In stock · ships within 48 hours" | Static string for every non-rental, non-made-to-order product; no stock tracking |
| Prices & FX | CAD and USD prices | USD precomputed per product at module load via `p()`; metal deltas, the diamond accent and gift cards convert at the fixed `CAD_TO_USD = 0.73` |
| Authentication | "Sign in" / "Create account"; "Accounts are managed through Shopify Customer Accounts." | Any submit passing HTML validation (email + password ≥ 8 chars) calls `signIn({ name, email })`; the password is discarded; stored in `tns-account` |
| Wishlist sync & sharing | "Sign in to keep your wishlist across devices."; "Copy link" | Wishlist is device-local and unaffected by sign-in; the copied link is `{origin}{pathname}#/wishlist` with no item data and no confirmation |
| Cart | Shopify cart | React state + `tns-cart`; Shopify `/cart/add.js` payloads are built only for gift-card lines and only logged at order time |
| Payment | "Payment is completed securely through Shopify Checkout." | No payment step; "Place order" completes immediately |
| Order | Order number; "A confirmation is on its way." | `TS-` + last 6 digits of `Date.now()`; no email; no order history (Account "Orders" always says "No orders yet. …") |
| Taxes | Provincial estimate; USD "Calculated by Shopify" | `PROVINCES` rates ("2024 rates" per file comment) × merchandise, rounded; USD sales tax never computed or added |
| Duties | "Duties prepaid", "CUSMA-qualifying, cleared by Teresa & Sons" | Copy only |
| Shipping | "Complimentary insured shipping …" | Always free; no rate logic |
| Delivery estimate | "Order today, arrives by {date}" | Today + 4 business days, skipping Saturdays and Sundays only |
| Shop Pay | "Or 4 interest-free payments of …" | `Math.round(amount / 4)` display only |
| Gift-card issuing | Codes emailed now or on a date, or mailed | Codes generated in the browser (`crypto.getRandomValues`, alphabet without 0/O/1/I) and saved to `tns-giftcard-ledger`; nothing is sent; the send date is a label |
| Gift-card balances | "Balances update after every purchase." | Lookups and debits against the local ledger; demo card `TERESASONS1962MT` (CAD 250, "Demo card") always present |
| Rental availability | Calendar with reserved dates | `getBookedDates(slug)`: four windows per piece derived from a hash of the slug, relative to today; reserving does not block dates for anyone |
| Rental deposit | "A refundable deposit is pre-authorised on your card at reservation …" (rental FAQ); "Card pre-authorisation · released within 48 h of return" (price breakdown) | Displayed only; never charged or added at checkout |
| Reviews | "{n} verified reviews", "Verified purchase" badges | 6 reviews generated from a 7-entry pool seeded by slug; count `18 + seed % 140`; rating 4.7–4.9; fixed star distribution; the shopper's own reviews stay on the device as "Pending moderation" forever (videos are not persisted) |
| Social proof | "4.9 / 5 · 1,200+ reviews", "As seen in", "@teresaandsons", testimonials | Static arrays; social tiles do not navigate |
| Newsletter | "Subscribe" | `preventDefault()` only |
| Appointment request | "Request appointment" | Sets local `sent`; shows "Merci. Our concierge will be in touch within one business day."; nothing is sent; lost on navigation |
| Price breakdown | "Every gram, every stone and every bench hour behind this piece, with our margin shown openly." | Heuristic model in `src/data/costing.ts` (indicative metal rates, category stone/making shares, margin = remainder) that reconciles to the retail price |
| Try-on | Camera try-on | Manually positioned SVG drawings over the camera/photo; no tracking; nothing uploaded |
| Films | Brand films | Mixkit stock clips |
| Personalization proof, ring sizer | "A digital proof is emailed …"; "We’ll mail a complimentary ring sizer …" | Copy only |
| Promo codes | "Gift cards and promo codes can be applied at checkout." | No promo-code field exists |
| Gift wrap / receipt / note | Order options | Stored in `tns-cart-meta` and echoed in the cart summary ("Gift wrapping — Complimentary") and drawer (" Gift wrapped."); not used by checkout; reset on order |

---

## 7. Catalog taxonomy

Source: `src/data/catalog.ts`. Data-model detail: [Data layer](data-model.md).

### 7.1 Categories (`CATEGORIES`, in display order)

| Eyebrow | `slug` | Name | French | Products | Description |
|---|---|---|---|---|---|
| I | `necklaces` | Necklaces | Colliers | 3 | Pendants, rivières and chains drawn in 18k gold, worn close to the heart. |
| II | `earrings` | Earrings | Boucles d'oreilles | 3 | Studs, drops and huggies that catch the light of the Saint-Laurent. |
| III | `bracelets` | Bracelets | Bracelets | 3 | Tennis lines, cuffs and bangles, built to be stacked and inherited. |
| IV | `rings` | Rings | Bagues | 3 | Signets, cocktail rings and everyday bands, hand-finished in our atelier. |
| V | `bridal` | Bridal Jewelry | Mariage | 3 | GIA-certified engagement rings and wedding bands for a lifetime of vows. |
| VI | `watches` | Watches | Montres | 3 | A curated selection of Swiss timepieces, serviced by our horologist. |
| VII | `rentals` | Jewelry Rentals | Location | 3 | High jewelry for galas, weddings and premieres — insured, delivered, returned. |
| VIII | `gifts` | Gifts | Cadeaux | 3 | Thoughtful pieces, wrapped in our signature travertine box. |
| IX | `custom` | Personalized & Custom | Sur mesure | 3 | From sketch to setting — bespoke commissions and engraved heirlooms. |

The array order drives the mega menu, mobile menu, footer "Shop" column and "The Index".

### 7.2 Products

Metals: Y = 18k Yellow Gold, W = 18k White Gold, R = 18k Rose Gold, Pt = Platinum 950, V = Gold Vermeil; the first metal listed is preselected on the PDP and used by every quick-add. Badge = `badges[0]` (the only badge shown; no product has more than one). Flags: **GIA** = `gia` report; **rental**; **monogram / initial / nameplate** = personalization kind; **engrave** = engraving field shown; **engrave\*** = `engravable: true` but no field (no `backEngraving`); **size** = ring size required; **MTO n wk** = `leadTimeWeeks`; **quick** = `quickAddable` in `CartUpsell`; **no-cost** = no price breakdown (`hasCostBreakdown` false).

| Slug · id | Name | Category | CAD / USD | Metals | Badge | Flags | Try-on kind |
|---|---|---|---|---|---|---|---|
| `mont-royal-solitaire-pendant` · tns-nk-001 | Mont-Royal Solitaire Pendant | necklaces | 6,850 / 5,000 | Y W R | Bestseller | GIA 0.70 ct F VS1; quick | necklace |
| `riviere-saint-laurent` · tns-nk-002 | Rivière Saint-Laurent | necklaces | 38,500 / 28,105 | W Pt | Atelier Exclusive | quick | necklace |
| `plateau-paperclip-chain` · tns-nk-003 | Plateau Paperclip Chain | necklaces | 2,450 / 1,790 | Y W R V | New | engrave; quick | necklace |
| `vieux-port-diamond-studs` · tns-er-001 | Vieux-Port Diamond Studs | earrings | 8,900 / 6,495 | Y W R Pt | Bestseller | GIA 1.00 ct G VS2; quick | earrings |
| `outremont-pearl-drops` · tns-er-002 | Outremont Pearl Drops | earrings | 4,200 / 3,065 | Y W | New | quick | earrings |
| `mile-end-huggies` · tns-er-003 | Mile End Huggies | earrings | 1,950 / 1,425 | Y W R V | — | quick | earrings |
| `westmount-tennis-bracelet` · tns-br-001 | Westmount Tennis Bracelet | bracelets | 14,500 / 10,585 | W Y Pt | Bestseller | quick | bracelet |
| `atwater-cuff` · tns-br-002 | Atwater Cuff | bracelets | 5,600 / 4,090 | Y W R | — | engrave; quick | bracelet |
| `griffintown-chain-bracelet` · tns-br-003 | Griffintown Chain Bracelet | bracelets | 1,650 / 1,205 | Y W R V | New | engrave; quick | bracelet |
| `teresa-signet` · tns-rg-001 | The Teresa Signet | rings | 3,200 / 2,335 | Y W R | Bestseller | monogram; size; engrave (reverse) | ring |
| `sherbrooke-emerald-cocktail` · tns-rg-002 | Sherbrooke Emerald Cocktail Ring | rings | 21,800 / 15,915 | Y Pt | Limited | size | ring |
| `laurier-stacking-band` · tns-rg-003 | Laurier Stacking Band | rings | 1,350 / 985 | Y W R Pt | — | size | ring |
| `notre-dame-oval-solitaire` · tns-bd-001 | Notre-Dame Oval Solitaire | bridal | 18,900 / 13,795 | Pt W Y R | Bestseller | GIA 1.82 ct E VS1 (oval); size; engrave | ring |
| `basilique-emerald-cut-three-stone` · tns-bd-002 | Basilique Three-Stone | bridal | 26,400 / 19,270 | Pt W Y R | Atelier Exclusive | GIA 2.01 ct F VVS2 (emerald); size; engrave | ring |
| `promesse-wedding-band` · tns-bd-003 | Promesse Wedding Band | bridal | 1,450 / 1,060 | Pt W Y R | — | size; engrave | ring |
| `heritage-automatic-38` · tns-wt-001 | Heritage Automatic 38 | watches | 7,400 / 5,400 | Y W | New | engrave; quick | watch |
| `chronographe-1962` · tns-wt-002 | Chronographe 1962 | watches | 12,900 / 9,415 | R Y | Limited | quick | watch |
| `dame-du-lac` · tns-wt-003 | Dame du Lac | watches | 9,600 / 7,010 | W R | — | quick | watch |
| `gala-diamond-collar` · tns-rn-001 | Gala Diamond Collar | rentals | retail 92,000 / 67,160 | Pt | Atelier Exclusive | rental: 650 / 1,400 / 3,900, deposit 5,000 CAD (USD 475 / 1,020 / 2,845, 3,650) | necklace |
| `chandelier-sapphire-earrings` · tns-rn-002 | Chandelier Sapphire Earrings | rentals | retail 34,000 / 24,820 | W | — | rental: 320 / 720 / 1,900, deposit 2,500 CAD (USD 235 / 525 / 1,385, 1,825) | earrings |
| `bridal-tiara-and-drops` · tns-rn-003 | Bridal Tiara & Drops Set | rentals | retail 48,000 / 35,040 | Pt | Bestseller | rental: 480 / 1,100 / 2,800, deposit 3,500 CAD (USD 350 / 805 / 2,045, 2,555) | earrings |
| `initial-disc-pendant` · tns-gf-001 | Initial Disc Pendant | gifts | 680 / 495 | Y W R V | Bestseller | initial; engrave (reverse) | necklace |
| `pearl-stud-gift-set` · tns-gf-002 | Pearl Stud Gift Set | gifts | 540 / 395 | Y W | — | quick | earrings |
| `gift-card` · tns-gf-003 | Teresa & Sons Gift Card | gifts | 250 / 200 (explicit; nominal) | none | — | gift card | none |
| `bespoke-engagement-commission` · tns-cs-001 | Bespoke Engagement Commission | custom | 5,000 / 3,650 ("Price shown is a starting deposit.") | Pt W Y R | Made to Order | MTO 8 wk; engrave; no-cost | ring |
| `heirloom-redesign` · tns-cs-002 | Heirloom Redesign | custom | 1,800 / 1,315 | Y W R Pt | Made to Order | MTO 6 wk; no-cost | none |
| `engraved-nameplate-necklace` · tns-cs-003 | Engraved Nameplate Necklace | custom | 1,250 / 915 | Y W R V | Made to Order | nameplate (+ Diamond accent 180 CAD / 130 USD); MTO 3 wk; engrave\* | necklace |

Rental rates are weekend / week / month. Periods last 3, 7 and 30 days (`RENTAL_DAYS`).

### 7.3 Archetypes and membership

| Archetype | Rule in code | Members |
|---|---|---|
| Standard (quick-addable) | `quickAddable`: no rental, no personalization, has metals, category not rings/bridal/custom | Mont-Royal Solitaire Pendant, Rivière Saint-Laurent, Plateau Paperclip Chain, Vieux-Port Diamond Studs, Outremont Pearl Drops, Mile End Huggies, Westmount Tennis Bracelet, Atwater Cuff, Griffintown Chain Bracelet, Heritage Automatic 38, Chronographe 1962, Dame du Lac, Pearl Stud Gift Set (13) |
| GIA-certified | `gia` set | Mont-Royal Solitaire Pendant (report 2231874590), Vieux-Port Diamond Studs (6452198830), Notre-Dame Oval Solitaire (1449286107), Basilique Three-Stone (5402177764) (4) |
| Rental | `rental` set (category `rentals`) | Gala Diamond Collar, Chandelier Sapphire Earrings, Bridal Tiara & Drops Set (3) |
| Personalized | `personalization` set | The Teresa Signet (`monogram`, 1–3 letters, fonts serif/script/block, `backEngraving`), Initial Disc Pendant (`initial`, 1 letter, chains 16/18/20 in, `backEngraving`), Engraved Nameplate Necklace (`nameplate`, 2–10 chars, fonts script/serif/block, accent, chains 16/18/20 in) (3) |
| Engravable | `engravable: true` | 11 flagged: Plateau Paperclip Chain, Atwater Cuff, Griffintown Chain Bracelet, The Teresa Signet, Notre-Dame Oval Solitaire, Basilique Three-Stone, Promesse Wedding Band, Heritage Automatic 38, Initial Disc Pendant, Bespoke Engagement Commission, Engraved Nameplate Necklace. The field shows on 10 (not on the nameplate necklace) |
| Ring size required | `category === 'rings' \|\| category === 'bridal'` | The Teresa Signet, Sherbrooke Emerald Cocktail Ring, Laurier Stacking Band, Notre-Dame Oval Solitaire, Basilique Three-Stone, Promesse Wedding Band (6) |
| Made to order | `leadTimeWeeks` set (all badged "Made to Order") | Bespoke Engagement Commission (8 wk), Heirloom Redesign (6 wk), Engraved Nameplate Necklace (3 wk) (3) |
| Watch | category `watches` | Heritage Automatic 38, Chronographe 1962 ("Edition: 62 pieces"), Dame du Lac (3) |
| Gift card | slug `gift-card` (`GIFT_CARD_SLUG`), `metals: []` | Teresa & Sons Gift Card (1): no PDP (route alias), never in upsell or looks, excluded from "Add all to bag", priced by its `giftCard` payload when in the bag |
| Service / deposit (no price breakdown) | `hasCostBreakdown` false: no metals, or name matches `/commission\|redesign/i` | Gift card, Bespoke Engagement Commission, Heirloom Redesign (3); the other 24 show "The price, itemised" |
| Not try-on-able | `tryOnKind` returns `null` (name matches "gift card" or "redesign") | Gift card, Heirloom Redesign (2); the other 25 can be tried on |

### 7.4 PDP behaviour by archetype

| Archetype | Availability line | CTA label | Configurator steps (numbered in render order) | Cart-line fields |
|---|---|---|---|---|
| Standard | "In stock · ships within 48 hours" | "Add to bag" | Metal (+ Engraving when engravable) | `metal`, `engraving?` |
| Rings & bridal | "In stock · ships within 48 hours" | "Add to bag" | Metal, (Personalize for the signet), Ring size, (Engraving / Reverse engraving) | + `size` (required) |
| Personalized | Signet and disc: in stock; nameplate: "Made to order · approx. 3 weeks" | Signet, disc: "Add to bag"; nameplate: "Begin commission" | Metal, Personalize, (Ring size), (Reverse engraving — optional) | + `personalization` (validated) |
| Rental | "Available for reservation · fitted in salon" | "Reserve this piece" | Rental period, Dates & delivery | `rental`, `booking` (no `metal`) |
| Made to order (custom) | "Made to order · approx. {n} weeks" | "Begin commission" | Metal (+ Engraving on the commission; + Personalize on the nameplate) | `metal`, `engraving?`, `personalization?` |
| Watch | "In stock · ships within 48 hours" | "Add to bag" | Metal (+ Engraving on Heritage Automatic 38) | `metal`, `engraving?` |
| Gift card | n/a (builder page) | "Add to bag — {amount × qty}" | Builder "01 Design" … "04 Recipient" | `slug: 'gift-card'`, `giftCard` |

Category-specific PDP content: `CraftStory` copy for bridal ("A ring for every tomorrow."), watches ("Time, regulated in Montréal."), rentals ("Borrowed, never compromised."), and a default ("Made slowly, by hand."); `ProductFAQ` adds bridal (conflict-free, surprise-proposal sizing), rentals (deposit, damage) and watches (warranty) questions ahead of four general ones.

---

## Notes & gotchas

Observations and risks from reading the code; nothing here has been verified in a running browser unless stated.

1. **Card price ≠ PDP opening price for platinum-first pieces.** Cards, Gift Finder budgets, category sort, the upsell rail, video tiles and recently viewed use the base `price` (no metal). The PDP preselects `metals[0]`, which is Platinum 950 (+650 CAD / +475 USD) for the three bridal pieces and the Bespoke Engagement Commission, so the PDP opens higher than the card (e.g. $18,900 → $19,550 CAD). Every quick-add path also uses `metals[0]`.
2. **Several add paths skip required configuration.** CompleteTheLook "Add the set to bag" adds each piece as `{ slug, metal: p.metals[0] }`. Earrings, bracelet and watch looks include The Teresa Signet without a monogram or size; ring and bridal PDPs add the ring itself without a size; the nameplate PDP adds the nameplate without text. It also ignores the metal the shopper picked for the current product. Wishlist "Add all to bag" skips rentals, personalized pieces and the gift card, but still adds rings, bridal and custom pieces without a size. Four separate "needs configuration" predicates disagree: `quickAddable` (`CartUpsell`), `needsConfig` (`TryOnStudio`, includes `custom`), `configurable` (`VideoViewer`, excludes `custom`), and the wishlist filter. A single shared helper would remove the drift.
3. **Quantity cap mismatch.** The cart-line "+" uses `Math.min(10, qty + 1)`, but `addToCart` has no cap and the gift-card builder allows 20. Pressing "+" on a line above 10 *reduces* it to 10.
4. **Dead compare-at price.** `CartLineItem` shows a struck-through `fullPrice` when it differs from the unit price, but both come from the same formula, so it never renders.
5. **Overlay stacking and scroll locks.** `addToCart` always opens the drawer (`z-[90]`). When called from the try-on studio (`z-[110]`) or the video viewer (`z-[100]`), the drawer opens underneath and is only seen after closing that overlay. Scroll locks are not reference-counted: each overlay stops/starts Lenis and resets `documentElement.style.overflow = ''` on close (the drawer uses `body.style.overflow`). Closing an upper overlay, such as try-on opened from the video viewer, can unlock page scroll while the lower overlay is still open.
6. **Same-hash links do nothing.** Following a link to the current hash fires no `hashchange`, so there is no scroll-to-top and the menus stay as they are. For example, tapping the current category in the mobile menu leaves the menu open.
7. **Storage robustness.** The currency initializer reads `localStorage.getItem('tns-currency')` outside `try/catch`, and the persistence effects call `setItem` unguarded; where storage throws, the provider would fail on mount. There is no schema versioning. A persisted line whose slug no longer exists renders nothing (`CartLineItem` returns `null`) and prices at 0, but its `qty` still counts in the header badge.
8. **Promised features with no implementation:** promo codes ("Gift cards and promo codes can be applied at checkout."); rental deposit collection; `CartMeta` (gift wrap, receipt, message, note) reaching checkout or Shopify, although its doc comment says it maps to cart `note`/`attributes`; order history; cross-device wishlist; a shareable wishlist link; editing a cart line in place ("Edit" re-opens a fresh PDP or builder); Atelier CTAs that deep-link to the form or preselect "Interest".
9. **Copy inconsistencies.**
   - Certification threshold: "over 0.50 ct" (marquee, Services, FAQ) vs "GIA or IGI certification above 0.30 ct" (cart trust list).
   - Gift-card ranges: mega menu "From $100 · never expires"; catalog spec "Denominations: '$250 – $10,000'"; builder presets 100–5,000 with custom 50–10,000 CAD / 50–7,500 USD; the gift-card product card shows $250 CAD / $200 USD.
   - Availability: Services' "Private appointments" tile says "In salon on Sherbrooke or by video, seven days." while the Footer says "Tue–Sat · 10h–18h" and the Visit-salon block says "Sunday by appointment".
   - CTA: the fixed-price nameplate necklace's CTA reads "Begin commission" because the label is keyed on category `custom`.
   - Lead time: personalized signet and disc show "In stock · ships within 48 hours" despite hand engraving and a digital proof.
   - Footer: "GIA & Certification", "Care & Repairs" and "Shipping & Returns" are plain text, not links.
10. **"Try these pieces on" may show on mobile.** The category link combines `hidden sm:inline-flex` with `.link-line`. The unlayered `.link-line { display: inline-flex }` in `src/index.css` likely beats Tailwind v4's layered `hidden`. This comes from reading the cascade and is not verified.
11. **Making-of steps may be clipped with reduced motion on desktop.** At ≥ `lg` the track is `lg:overflow-visible` inside an `overflow-hidden` section, and the horizontal tween only runs when motion is allowed. Under `prefers-reduced-motion` on a wide screen, the later steps are likely cut off with no way to scroll to them (unverified).
12. **Independent tax selectors.** The cart page `region`, the checkout `province`, and `PriceBreakdown`'s province/state are separate states (all default to QC / first US state) and do not sync.
13. **Wallet is per device, not per user.** The Account wallet lists every card in the local ledger (minus the demo card) regardless of who is signed in, and sign-out does not clear it.
14. **Rating display.** The PDP header always renders five filled stars, whatever the seeded 4.7–4.9 rating. "Show more reviews" stops at the 6 generated reviews even though the count says 18–157.
15. **Two pairing maps.** `CartUpsell.PAIRS` and `CompleteTheLook.PAIRS` differ: bridal → bracelets vs necklaces; custom → earrings vs bridal + earrings; rentals exist only in the upsell map.
16. **Rental sort.** Category sort ranks rentals by retail value, not the displayed weekend fee. The two orders currently coincide.
17. **Fragile alias.** `#/p/gift-card` relies on `parseHash` testing the alias before `p/:slug`. If the order changes, a gift-card PDP with `metals: []` would render.
18. **Placeholders.** Phone in the 555 exchange; Unsplash photography; Mixkit clips; Shopify variant IDs `44100000001…` and `GIFT_CARD_ONE_UNIT_VARIANT = 44100000099` marked "Placeholder … replace with the store's real IDs".

Full risk register: [Known issues, risks & tech debt](known-issues.md).

## Related docs

- [Architecture & runtime model](architecture.md)
- [Figma Make platform, toolchain & build](platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](design-system.md)
- [Motion, animation & scroll behaviour](motion-and-interaction.md)
- [Brand, voice & copywriting](brand-voice-and-copy.md)
- [Data layer — catalog, media, gift cards, costing & tax](data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](commerce-logic.md)
- [Shopify integration map & porting notes](shopify-integration.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
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
