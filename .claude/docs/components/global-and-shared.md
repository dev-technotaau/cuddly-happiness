# Global chrome & shared components

The persistent shell around every page (Header with announcement marquee, mega menu and mobile menu; Footer; the film-grain overlay) and the small shared building blocks reused across pages (ProductCard, Price, WishButton, RecentlyViewed / RecentlyViewedStrip, SectionHeader, useReveal, SmoothScroll/getLenis, lineDetails). CartDrawer is only summarised here; its full behaviour is in the cart doc.

Scope: `src/components/Header.tsx`, `src/components/menu/SiteMenu.tsx`, `src/components/menu/Burger.tsx`, `src/components/menu/search.ts`, `src/components/Footer.tsx`, `src/components/ProductCard.tsx`, `src/components/Price.tsx`, `src/components/WishButton.tsx`, `src/components/RecentlyViewed.tsx`, `src/components/home/SectionHeader.tsx`, `src/components/SmoothScroll.tsx`, `src/components/useReveal.ts`, `src/components/lineDetails.ts`, `src/App.tsx` (film grain), `src/components/CartDrawer.tsx` (summary)

## 1. Shell layout (src/App.tsx)

```
<StoreProvider> <TryOnProvider> <SmoothScroll>
  <div class="min-h-screen bg-[var(--bg-travertine)] text-[var(--text-espresso)]">
    <Splash/>  <Header/>  <main><Pages/> = PageTransition ▸ Routes</main>  <Footer/>  <CartDrawer/>  <BackToTop/>
    <div class="film-grain" aria-hidden/>
```

- The film grain is a fixed, `pointer-events: none` SVG-noise layer (`.film-grain` in `src/index.css`: `inset:-50%`, 200% size, `z-index: 60`, `opacity: .07`, `grainShift 0.9s steps(6) infinite`, disabled under `prefers-reduced-motion`). z 60 sits above the sticky header (z-50) and the PDP StickyBar (z-40) but below every overlay (z-[70]+), so drawers and modals are grain-free.

## 2. Header (`src/components/Header.tsx`)

`<header className="sticky top-0 z-50">` with two stacked bars plus two menus.

```
┌──────────────────────────── vault marquee (gold-champagne, 10px spec) ───────────────────────────┐
│ Complimentary insured shipping … ✦   Every diamond over 0.50 ct … ✦   Private appointments … ✦  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ≡ ┊ SHOP  BRIDAL  RENTALS  ATELIER    │        Teresa & Sons         │ [CA·CAD|US·USD] 👤 ♡³ 🛍² │
│ (lg+; ☰ on mobile)                    │     MONTRÉAL · EST. 1962     │                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
  mega menu (lg+, hover/click "Shop"): [I–IX categories + Gift Cards] [Chapter text + 2 products] [hero 4/5 + feature 1/1]
  desktop menu (lg+, ≡ or "/" or ⌘K): full-height rail ▸ unfolds sideways [Shop chapters | preview photograph] (§2.1)
```

**Announcement marquee.** `bg-[var(--bg-vault)] text-[var(--gold-champagne)] py-2` around `<Marquee speed={44}>` (see the shared components table), whose viewport fades out over the outer 4 % of each edge (`[mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]`). Each of the 4 messages is `font-spec flex items-center px-10 text-[10px] uppercase tracking-[0.28em]` followed by an `aria-hidden` vermeil `✦` (`&#10022;`, `ml-20`). Verbatim:
- `Complimentary insured shipping across Canada & the United States`
- `Every diamond over 0.50 ct accompanied by a GIA report`
- `Private appointments at our Sherbrooke Street salon`
- `Lifetime cleaning & inspection on every piece`

**Main bar.** `relative border-b border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md`; inner `mx-auto grid h-20 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-12`.
- Left nav (`hidden … lg:flex`, `gap-9 text-[11px] font-medium uppercase tracking-[0.22em]`): first the **menu button** (`aria-label="Open menu"`, `aria-haspopup="dialog"`, `aria-expanded={menuOpen}`, `aria-controls="site-menu"`; `group -ml-[9px] h-10 w-10` so the `Burger` glyph sits on the container edge; vermeil on hover, where the short line stretches) and a `h-4 w-px` hairline, together in `flex items-center gap-6` (added 2026-10-20, §2.1). Then the **Shop** button (renamed from "Collections" on 2026-10-16; it sets its own `uppercase` because a `<button>` doesn't inherit the nav's text-transform; `onMouseEnter=open`, `onMouseLeave=scheduleClose`, click toggles, `aria-expanded={megaOpen}`), then links **Bridal** (`href.category('bridal')`), **Rentals** (`href.category('rentals')`), **Atelier** (`href.atelier`). Hover colour `hover:text-[var(--gold-vermeil)]`.
- **Current section (2026-10-20).** `locate(route)` gives the section (`shop`, `bridal`, `rentals`, `atelier`) and the chapter on screen. Bridal and Rentals own their categories and their pieces; every other chapter, every other piece and the gift cards sit under Shop.
  - One gold hairline (`absolute top-[calc(50%+12px)] h-px bg-[var(--gold-vermeil)]`, `translate` and `width` over 500 ms) glides under the hovered or focused link, stays under Shop while the mega menu is open, and rests under the current section; on Home it fades out. It measures each link's `[data-nav]` element and re-measures on resize and once the fonts are ready.
  - Bridal, Rentals and Atelier carry `aria-current`: `page` on the page itself, `true` on a page inside the section (a bridal piece under Bridal).
- Mobile trigger: `<button className="lg:hidden" aria-label="Open menu">` with `Menu` (20 / strokeWidth 1.4).
- Wordmark (`href.home`, centred, `text-center leading-none`), tracked Baskervville capitals: `font-serif-editorial -mr-[0.12em] block whitespace-nowrap text-[17px] uppercase tracking-[0.12em] sm:-mr-[0.16em] sm:text-[22px] sm:tracking-[0.16em] lg:text-[25px]` — "Teresa <em class='text-[var(--gold-vermeil)]'>&amp;</em> Sons" (the ampersand is the vermeil italic). Sub-line `font-spec -mr-[0.28em] mt-1.5 block whitespace-nowrap text-[8px] uppercase tracking-[0.28em] text-[var(--text-taupe)] sm:-mr-[0.4em] sm:text-[9px] sm:tracking-[0.4em]` "Montréal · Est. 1962". Each negative right margin equals that line's tracking, cancelling the trailing letter-space so the capitals centre; `whitespace-nowrap` keeps the name on one line at 390 px.
- Right cluster (`gap-4 lg:gap-7`):
  - Language and market, from `sm` up: `LocaleMenu` (`src/components/locale/LocaleMenu.tsx`, added 2026-10-21) replaces the old currency toggle. A trigger (`Globe` · `EN · CAD` · chevron, `h-8 border text-[10px] tracking-[0.15em]`) opens a 300 px panel with the languages, the markets, a live summary and "Your bag and wishlist stay as they are." On phones both live in the mobile menu. See [../features/languages.md](../features/languages.md) §6.
  - Account link (`hidden … sm:block`), `aria-label={user ? \`Account, ${user.name}\` : 'Sign in'}`, `User` icon; a 1.5 px vermeil dot when signed in.
  - Wishlist link `aria-label="Wishlist"`, `Heart`; badge when `wishlist.length > 0`: `font-spec absolute -right-2 -top-2 flex h-4 min-w-4 … rounded-full bg-[var(--text-espresso)] px-1 text-[9px] text-[var(--bg-travertine)]`.
  - Bag button `aria-label="Open bag"` → `setCartOpen(true)`, `ShoppingBag`; badge (when `count > 0`) same shape but `bg-[var(--gold-vermeil)] … text-white`. `count` = sum of line quantities (store).
- State: `megaOpen`, `mobileOpen`, `active` (hovered category index, default 0), `menuOpen`, `menuMounted` (the desktop menu mounts, closed, on intent or 2.5 s after load on desktop), `menuFocus` (`'pointer' | 'keyboard' | 'search'`), `menuCovered` (hides the menu button's glyph while the menu's cross stands in for it), `panelRef`, `closeTimer`, `menuBtn`, `menuOpenRef`. An effect on `[route]` closes all three menus on every navigation. A `window` keydown effect opens the desktop menu into its search on `/` or ⌘K / Ctrl+K (§2.1).

**Mega menu** (`absolute inset-x-0 top-full hidden … lg:block`, `pointer-events-none` while closed). GSAP animates `clipPath` between `inset(0 0 100% 0)` and `inset(0 0 0% 0)` (0.7 s, `expo.out`); on open, every `[data-mega-item]` animates from `{ y: 14, opacity: 0 }` (stagger 0.03, 0.6 s, `expo.out`, delay 0.08). Hover intent: `open()` clears the timer; `scheduleClose()` closes after **140 ms**. Grid `grid-cols-12 gap-10 px-12 py-12`:
- **Opens on the visitor's chapter (2026-10-20).** `open()` sets `active` to the current chapter (the Gifts row on the gift-card page), not always to the first. The current row carries `aria-current` and a 6 px vermeil dot after its name; the Gift Cards row does too on its page.
- `col-span-4` list: each `CATEGORIES` entry → link with roman numeral (`font-spec w-6 text-[10px] text-[var(--gold-vermeil)]`), name (`font-serif-editorial text-[26px]`), French name revealed on hover (`italic … opacity-0 group-hover:opacity-100`); hovering sets `active`. Inactive rows are `text-[var(--text-linen)]`. Last row: **Gift Cards** (`href.giftcards`) with a mini card swatch `bg-[linear-gradient(135deg,#e8d3a3,#c9a45f_45%,#9c7a3c)]` and caption `From $100 · never expires`; hovering it activates the Gifts category.
- `col-span-3`: `Chapter {cat.eyebrow}` (spec 10px, vermeil), the category description in `font-serif-editorial text-3xl`, then the first two products of the category as hairline-ruled links with `ArrowUpRight`.
- `col-span-5`: link to the category with the hero image (`aspect-[4/5]`) and feature image (`aspect-square`), both `.editorial-zoom`, and `Shop {name} →`.

**Mobile menu** (rendered only while `mobileOpen`): `fixed inset-0 z-[70] overflow-y-auto bg-[var(--bg-travertine)] px-6 py-6 lg:hidden` with `data-lenis-prevent`; close button `aria-label="Close menu"` (`X` 22). List: every category (numeral + `font-serif-editorial text-3xl` name), then italic serif links **The Atelier**, **Gift Cards**, **My Account** / **Sign In**, **Wishlist ({n})**. Below the list, on phones only (`sm:hidden`), a hairline-topped "Language" row holds `LanguageToggle full` (`English` · `Français`), then a "Shopping in" row holds the currency switch (`role="group" aria-label="Currency"`, `px-3.5 py-2` buttons with `aria-pressed`), because the bar hides the locale menu below `sm`. The menu does not stop Lenis, lock scroll or handle Escape (see known issues).
- **Current page (2026-10-20):** the current chapter, The Atelier, Gift Cards, the account and the wishlist carry `aria-current` and the same vermeil dot.

### 2.1 Desktop menu (`src/components/menu/SiteMenu.tsx`, added 2026-10-20)

An addition to the bar, not a replacement. The bar keeps its links and mega menu; the menu repeats them and has room for the pages the bar can't hold. `Header` renders `<SiteMenu open focus onClose trigger onCover />` through `lazy()` and `<Suspense fallback={null}>`, mounted closed ahead of the first click: when the pointer or focus reaches the menu button (`prepareMenu`), and 2.5 s after load on desktop. Mounting on click made the first opening lag about 400 ms, because a lazy component suspends on its first render even with its chunk cached, and React holds that first reveal back. The menu portals to `<body>`.

**Opening.**
- The button: `openMenu(e.detail === 0 ? 'keyboard' : 'pointer')`, which also closes the mega menu.
- Shortcuts (`Header`): `/`, or ⌘K / Ctrl+K, open it with `focus = 'search'`. They are ignored while the menu is open, while typing in an input, textarea, select or contenteditable, below 1024 px, and while any other visible, non-inert `[role="dialog"]` is open.
- Initial focus, 50 ms after opening: the search (`'search'`), the first rail item (`'keyboard'`), or the dialog itself, `tabIndex={-1}` (`'pointer'`).
- Every opening starts fresh: no panel or query, the salon status recomputed, the menu button re-measured.

**Layout.** `fixed inset-0 z-[70]`, `role="dialog" aria-modal="true" aria-label="Menu" id="site-menu"`, `inert` while closed.
- Backdrop: `bg-[var(--bg-vault)]/45` with `backdrop-blur-[3px]`, both fading over 500 ms. A click closes.
- **Rail**, `w-[clamp(340px,30vw,420px)]`, full height, travertine, shadow `24px 0 60px -30px`. From the top:
  - A vault strip as tall as the announcement bar (measured from the menu button) with the salon's live status: a dot (champagne when open) and `salonStatus().label`, for example `Open now · until 18h` ([data-model.md](../data-model.md) §9a).
  - An 80 px row level with the header bar, its hairline continuing the header's: room for the close cross, then the search field (`Search` icon, placeholder `Search the maison`, `aria-label="Search pieces, chapters and pages"`, a `/` keycap, or `Clear` while there is a query).
  - The nav (`aria-label="Main menu"`, `data-menu-list="rail"`): the `RAIL` entries **Shop**, **Bridal**, **Rentals**, **The Atelier** in `font-serif-editorial text-[clamp(28px,2.4vw,38px)] font-light`. Each shows its French name (`La boutique`, `Mariage`, `Location`, `L’Atelier`) in italic when hovered, focused, current or unfolded; hovering one dims the others to taupe. Shop is a button (`aria-expanded`, `aria-controls="menu-extension"`, a gold `ArrowRight`); the others are links with `aria-current="page"` when current.
  - A shelf of three 4:5 thumbnails with names: **Recently viewed** (from `recent`, minus the piece on screen, with a `Clear` button that calls `clearRecent` and keeps focus in the dialog), else **New arrivals** (the first three products badged `New`).
  - A hairline-topped footer: three tiles in a hairline grid, **Wishlist** (count badge), the account (**Sign in**, or the first name with a gold dot) and **Bag** (count badge; closes the menu, then `setCartOpen(true)`). Then the espresso button **Book an appointment** (`href.atelier`), and a wrapping row with `LanguageToggle` (`EN` · `FR`), the currency switch (`role="group" aria-label="Currency"`, `aria-pressed`) and `SALON.phone` as a `tel:` link.
  - Every label is bilingual (`COPY`); the rail's accents in French are `les chapitres`, `pour la vie`, `le temps d’un soir`, `rue Sherbrooke`. Search indexes both languages (French and English names, categories, metals, badges, bilingual `KEYWORDS`), so `ring` finds `Bagues` on the French site.
- **Close cross**: `Burger open={shown}` in a 40 px button. While the menu is open, `Header` hides its own button's glyph (`onCover(true)` sets `menuCovered`), so only one menu icon ever shows.
  - Up to 1600 px the cross sits above the rail at the menu button's measured position (`useLayoutEffect`, before the first paint), so the two lines fold into a cross in place. On close it folds back; 500 ms later the cross and the button swap in a single commit (`standIn` and `onCover(false)` together).
  - Past 1600 px the header's container is centred and the button lies beyond the rail's corner. The cross is then rendered inside the rail at its corner (`left: 39`) and travels with it, and the button returns as soon as the menu starts closing.
- **Extension** (`#menu-extension`, a child of the rail at `absolute left-full`, `inert` while folded) unfolds sideways out of the rail by `clip-path`, from `inset(0 100% 0 0)` to `inset(0 -80px 0 0)` (the negative inset keeps the shadow), over 700 ms. It keeps its last content while folding away (`held`). Two columns:
  - The list, `w-[clamp(300px,26vw,380px)]`, under its own vault strip and an 80 px heading row: `Shop` *La boutique* with `9 chapters`, or `{n} results for “{q}”` (`aria-live="polite"`). Shop lists the nine `CATEGORIES` (roman numeral, name in `text-[clamp(18px,1.6vw,24px)]`, taupe until active, the French name on the active row when title and French together are at most 26 characters, a gold dot on the current page) and, after a hairline, **Gift Cards** with a champagne-to-vermeil card swatch.
  - The preview, `w-[clamp(260px,32vw,620px)]`: a full-height photograph of the active destination (1200 px wide, cross-fading over 1 s with a 1.04 → 1 settle), a vault gradient, then the kicker, the title (`text-[clamp(30px,3vw,46px)]`), the note, a champagne meta line, up to three pieces (thumbnail, name, price) and a `link-line` call to action. A chapter shows `Chapter {numeral} · {french}`, its description, `{n} pieces · from {Price}` (rentals: the lowest weekend rate and ` a weekend`), its first three pieces and `Shop {name}`. Gift Cards shows the vermeil `GiftCardArt` tilted over `IMG.gift1`, `From {DENOMINATIONS[currency][0]} · never expires` and `Choose a gift card`.
- A gold hairline glides beside the rail (to the hovered or focused item, else the unfolded parent or the current page) and beside the list (to the active row).

**Behaviour.**
- **Hover** (mouse only): a parent unfolds its panel after 80 ms; a plain link folds it after 200 ms. Menu aim: while the pointer travels right (samples from the last 150 ms), the fold waits and re-checks every 120 ms, so a diagonal path across Bridal into the panel keeps it open. Entering the extension cancels any pending switch.
- **Clicks**: a mouse click on Shop only unfolds; keys and taps toggle.
- **Active row**: the hovered or focused one, else the current page's chapter (or Gift Cards), else the first; in search, the first result.
- **Search** (`search.ts`): case- and accent-insensitive (`fold`), and every word must match. A word scores 3 at the start of a field, 2 at the start of a word, 1 inside a word (only for words of six letters or more, so "rings" doesn't find earrings), times the field weight:
  - pieces: name 10, collection 6, category name and French 4, tagline 3, metal labels and badges 2, description and spec values 1;
  - chapters: name 10, French 6, description 2;
  - pages: title 10, `KEYWORDS` 4.

  A title that starts with the whole query gets +25. Results are grouped Chapters (3), Pieces (6) and Elsewhere (3; The Atelier, Gift Cards, Wishlist, the account, the bag, Home), with matches underlined in gold (`marks`). With no result: `Nothing matches “{q}”.`, `Try a stone, a metal or a Montréal place:` and chips **Diamond**, **Pearl**, **Emerald**, **Mont-Royal**, **Platinum**.
- **Keyboard**: Escape clears the query, then folds the panel (focus to its parent), then closes. ↑/↓/Home/End move within a list (from the dialog itself, ↑/↓ enter the rail). → on a parent unfolds it and focuses its current or first row; ← in the extension goes back to the parent (or the search). In the search, ↓ enters the results and Enter opens the first one. ⌘K / Ctrl+K and `/` focus the search, and any other printable key types into it. Tab is trapped, skipping inert parts.
- **Closing**: the cross, the backdrop, Escape, every link (`onClick={onClose}`), a route change (`Header`'s `[route]` effect), or the viewport dropping below 1024 px. Focus returns to the menu button unless something else took it (the Bag tile hands it to the drawer).
- **While open**: `getLenis()?.stop()` and `body` overflow `hidden`, both restored on close; the rail's middle and the list carry `data-lenis-prevent`.
- **Reduced motion**: the rail fades instead of sliding, the extension appears without the wipe, the glyph folds at once, items fade without rising, photographs cross-fade without the settle.
- **Adding pages**: a new top-level page joins `RAIL`; one with sub-pages gets a `panel` key and an entry in `panels` (a title, French title, aside and `Dest` links), and unfolds like Shop. Add a `pages` entry and its `KEYWORDS` so search finds it.

## 3. Footer (`src/components/Footer.tsx`)

`bg-[var(--bg-vault)] text-[var(--bg-travertine)]`, container `mx-auto max-w-[1600px] px-6 pb-10 pt-24 lg:px-12`, `grid gap-16 lg:grid-cols-12`.
- Newsletter (`lg:col-span-5`): eyebrow `La lettre`; `h3` `font-serif-editorial mt-5 text-5xl leading-[1.05]` "Notes from the *atelier*, four times a year." (italic champagne); form with `type="email" required placeholder="Email address"` and a **Subscribe** button. `onSubmit` only calls `preventDefault()` — no confirmation state.
- Link columns (`grid-cols-2 sm:grid-cols-3 lg:col-span-6 lg:col-start-7`), headings `font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]`:
  - **Shop**: every category (`text-white/80 hover:text-[var(--gold-champagne)]`).
  - **Maison**: Our Story → `href.atelier`; Book an Appointment → `href.atelier`; Gift Cards & Balance → `href.giftcards`; plain text (not links): GIA & Certification, Care & Repairs, Shipping & Returns.
  - **Salon**: `<address>` "1420 rue Sherbrooke Ouest / Montréal, QC H3G 1K4 / Canada"; `+1 514 555 0162`; `Tue–Sat · 10h–18h`.
- Oversized wordmark: `font-serif-editorial pointer-events-none mt-24 select-none whitespace-nowrap text-center text-[17vw] font-light leading-none text-white/[0.06]` "Teresa & Sons".
- Legal bar (`font-spec … text-[10px] uppercase tracking-[0.2em] text-white/50`): `© {new Date().getFullYear()} Teresa & Sons Joailliers Inc.` and `Shipping to Canada (CAD) & United States (USD)`, followed by `LanguageToggle tone="dark" full`.
- Since 2026-10-21 the address, phone and hours come from `SALON` (`salonHours()` gives `Tue–Sat · 10h–18h` / `Mar.–sam. · 10 h – 18 h`), and all copy is bilingual (French: `Des nouvelles de l’<em>atelier</em>, quatre fois l’an.`, `Adresse courriel`, `S’abonner`, `Notre histoire`, `Prendre rendez-vous`, `Cartes-cadeaux et solde`…).

## 4. Shared components & hooks

| Export | Signature | Behaviour | Used by |
|---|---|---|---|
| `Price` (default, `src/components/Price.tsx`) | `{ amount: number; className?: string }` | Renders `<span className={\`font-spec ${className}\`}>{formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span></span>`. Formats only — never converts. `formatPrice` follows the locale (`$1,250 CAD`, `1 250 $ CAD`). | 16 files (cart, checkout, PDP modules, video, try-on, gift cards…) |
| `LocaleMenu`, `LanguageToggle`, `LanguageNotice` (`src/components/locale/`) | see [../features/languages.md](../features/languages.md) | The header's language and market menu; the inline `EN · FR` / `English · Français` toggle (`tone`, `full`); the one-time language notice. | Header, SiteMenu, Footer, Account, App |
| `Marquee` (default, `src/components/Marquee.tsx`) | `{ children: ReactNode; speed?: number; className?: string }` (`speed` in px/s, default 40) | A seamless loop on the Web Animations API, which runs on the compositor like a CSS animation. It measures one copy of `children` (after `document.fonts.ready`), renders enough copies to fill the viewport plus one (at least 2; copies after the first are `aria-hidden`), and animates the track `translate3d(0) → translate3d(−copy width px)` over `width / speed` seconds, linear and infinite. `ResizeObserver` rebuilds it without losing its place. A mouse hover eases `playbackRate` to 0 and back (`updatePlaybackRate`, time constant 160 ms). An `IntersectionObserver` pauses it off-screen. Under reduced motion no animation is created. The track is `flex w-max [backface-visibility:hidden] will-change-transform`. | Header announcements (44 px/s), PressStrip (34 px/s) |
| `ProductCard` (default) | `{ product: Product; index?: number }` | Whole card is `<a href={href.product(slug)} className="group block" data-reveal={(index % 3) * 0.08}>`; `aspect-[4/5]` silk image box, primary image `.editorial-zoom` (`alt={product.name}`, lazy), optional second image fades in on `group-hover` (700 ms); `WishButton` top-right; Try-on chip bottom-left shown on hover only on hover-capable devices (`[@media(hover:hover)]:…` variants); first badge top-left (`font-spec bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]`); collection (spec 10px linen) + `h3` name (`font-serif-editorial text-xl sm:text-2xl`), stacked over the price on phones and beside it from `sm`; price = rentals (`category === 'rentals' && rental`) show `From` + weekend rate, else `priceFor(product, currency)` (base price, no metal). | Category, Product, Wishlist, home GiftFinder & Treasured, RecentlyViewed |
| `WishButton` (default) | `{ slug: string; className?: string; size?: 'sm' \| 'lg' }` | `type="button"`, `aria-pressed={on}`, `aria-label` "Remove from wishlist" / "Save to wishlist"; `preventDefault()` + `stopPropagation()` (cards are links); toggles wishlist and plays a GSAP pop (`scale 0.8→1`, 0.6 s, `elastic.out(1, 0.4)`); `h-9 w-9` (sm) / `h-12 w-12` (lg), `rounded-full bg-[var(--bg-travertine)]/90 text-[var(--text-espresso)] backdrop-blur`; heart filled vermeil when on. The button sets its own espresso ink, so the heart stays visible on dark surfaces. It inherited the text colour, and turned white in the home hero, until 2026-10-16. | ProductCard, PDP Gallery (lg), HomeHero featured piece |
| `RecentlyViewed` (default) | `{ index?='—', exclude?, limit?=4, eyebrow?='Your journey', title?=<>Recently <em>viewed</em></>, bordered?=true }` | Section `mx-auto max-w-[1600px] px-6 py-28 lg:px-12` (+ top hairline when bordered) with `SectionHeader` (aside: `Clear history` `.link-line`) and a 2/4-column grid of `ProductCard`s. Returns `null` when history is empty. | Home, Category, Product |
| `RecentlyViewedStrip` (named) | `{ exclude?, limit?=3, onNavigate?, title?='Recently viewed' }` | Compact list (History icon title, clear button `aria-label="Clear recently viewed"`), rows link to the PDP and call `onNavigate` (drawer close); price = `p.rental ? weekend rate : priceFor(p, currency)` with no "From". | CartDrawer, Cart, Checkout, Account, Wishlist |
| `SectionHeader` (default, `src/components/home/SectionHeader.tsx`) | `{ index: string; eyebrow: string; title: ReactNode; aside?: ReactNode; tone?: 'light' \| 'dark' }` | `header.mb-14 lg:mb-20`: numbered eyebrow row (`font-spec … text-[10px] uppercase tracking-[0.3em]`, index in vermeil/champagne, a `h-px flex-1` hairline, eyebrow text) with `data-reveal`; `h2` `font-serif-editorial max-w-3xl text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]` (`data-reveal="0.05"`); optional aside (`data-reveal="0.1"`). | 10 files: home sections, PDP sections, ShoppableVideos, GiftCards |
| `useReveal` (default hook, `src/components/useReveal.ts`) | `(scope: RefObject<HTMLElement \| null>, deps: unknown[] = [])` | In `useLayoutEffect` (skipped under reduced motion) inside `gsap.context(…, scope)`: `[data-reveal]` → from `{ y: 40, opacity: 0 }` 1.2 s `expo.out`, `delay = Number(data-reveal) \|\| 0`, ScrollTrigger `start: 'top 88%', once`; `[data-reveal-img]` → `clipPath inset(100% 0 0 0)→inset(0)` 1.6 s `expo.inOut`, start `top 85%`, once; `[data-parallax]` → `yPercent -8→8` at `scale 1.12`, scrubbed over the parent's viewport transit. Cleanup `ctx.revert()`. Only scans when deps change. | Home, Category, Product, GiftCards, Wishlist, Atelier |
| `SmoothScroll` (default) + `getLenis` (named) | `{ children }` / `() => Lenis \| null` | Creates the only Lenis instance (`duration: 1.25`, expo-out easing `Math.min(1, 1.001 - 2^(-10t))`) unless reduced motion; wires `lenis.on('scroll', ScrollTrigger.update)`, drives Lenis from `gsap.ticker`, sets `gsap.ticker.lagSmoothing(0)`. On every `route` change: `lenis.scrollTo(0, { immediate: true })` (or `window.scrollTo(0, 0)`) then `ScrollTrigger.refresh()` on the next frame. | App; `getLenis` in CartDrawer, Reviews, TryOnStudio, VideoViewer, Product |
| `lineDetails` (named, `src/components/lineDetails.ts`) | `(line: CartLine, product: Product) => string[]` | Human-readable option lines shared by bag and checkout. Gift card: `{Design} design · Digital/Physical card`, `For me` or `To {name}[ · email]`, `Sends {day}`, quoted message (truncated at 40 chars + `…`). Jewellery: rental label (`Weekend rental` / `One-week rental` / `One-month rental`) else metal label; `Size {n}`; booking `{start} → {return}` and `Salon fitting`/`Courier · {slot}`; `describePersonalization(...)`; engraving as `Reverse: “…”` (personalized products) or `Engraving: “…”`; falls back to the collection name. | CartLineItem, Checkout |

CartDrawer (summary): right-hand panel `z-[90]` (`max-w-[460px]`, slide 700 ms `cubic-bezier(0.16,1,0.3,1)`) over a `z-[80]` vault/45 blurred backdrop; stops Lenis, locks `body` overflow, focuses after 50 ms, closes on Escape; contents: reward progress, lines, upsell, recently viewed strip, totals and CTAs. See the cart doc.

## 5. BackToTop (`src/components/BackToTop.tsx`)

A floating back-to-top control, mounted once in `src/App.tsx` after `CartDrawer`. A fixed wrapper (`pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[45] lg:bottom-8 lg:right-8`; `z-[45]` keeps it above the StickyBar and below the header, whose stacking context holds the mobile menu) holds one round glass button (`rounded-full border backdrop-blur-md`, `h-12`).

| Behaviour | How it works |
|---|---|
| When it shows | When the scrollable range is more than 1.8 viewports and the scroll passes 1.1 vh. It hides again below 0.6 vh. It never shows while the drawer or a scroll-locking overlay is open (`cartOpen`, `lenis.isStopped`, or `overflow: hidden` on html/body); then it is also `inert`. |
| Compact vs expanded | It is a compact 48 px bezel while you read. It opens into a pill, "Back to top", in these cases: for 1.6 s after an upward scroll (smoothed velocity < −1.2 px/frame); while hovered with a mouse or keyboard-focused (`:focus-visible`); during the trip up; and in return mode. A downward scroll collapses it at once. The width animates with `grid-template-columns` 0fr → 1fr. |
| Progress ring | An SVG ring (`r = 17`) in `stroke-[var(--gold-vermeil)]` (champagne on dark) shows `y / limit`. A requestAnimationFrame loop drives it with frame-rate-independent easing (0.35 with Lenis, 0.16 native scroll) and writes straight to `style.strokeDashoffset`. React state never changes per frame. |
| Obstacle lift | An IntersectionObserver tracks elements marked `data-fab-avoid` (the PDP StickyBar and the footer legal row). When one overlaps the button's column and reaches its zone, the wrapper translates up so it sits `GAP` = 12 px above it. The lift is eased and capped at 60% of the viewport. |
| Tone | About 8 times a second while visible, `document.elementsFromPoint` at the button's centre finds the first opaque background. Colours are normalised through a 1×1 canvas, so `oklab()`/`color-mix()` values work. Dark backgrounds get `bg-[var(--bg-vault)]/60` glass with a champagne ring; light ones get `bg-[var(--bg-travertine)]/80`. |
| The trip | A click calls `lenis.scrollTo(0, { duration: 0.85 s + 0.12 s per viewport (max 2.2 s), easing: easeInOutQuart })`. The ring unwinds with the scroll. Clicks are ignored while travelling. Without Lenis, or under reduced motion, it jumps instantly. |
| Return offer | If the trip started more than 1.5 viewports down, on arrival the label becomes "Return · {nearest `main h1/h2` above the old position}" (aria-label "Return to …"; "Return to where you were" when no heading is near). The arrow flips 180° and the ring counts down 8 s. A click glides back. The offer lapses after 8 s, or when the reader scrolls past 0.25 vh. |
| Keyboard & focus | Activating it from the keyboard (`detail === 0`) moves focus to the header wordmark link after arrival. Focus shows a 1 px vermeil outline, offset 4 px. |
| Hover | Mouse only. The ring is pulled magnetically up to 5 px and the arrow lifts 0.5 (2 px). Both are disabled under reduced motion. |
| Route change | Resets the mode and the remembered heading. |


## Notes & gotchas

- `Price` always renders in the spec face (Jost, tabular figures): `.font-spec` is declared after `.font-serif-editorial` in `src/index.css`, so passing `font-serif-editorial` in `className` has no effect. Restyle the currency code with `[&_span]:…` utilities (e.g. `[&_span]:hidden`, `[&_span]:text-white/40`).
- Price rules on listing surfaces differ slightly: `ProductCard` requires `category === 'rentals' && rental` and prints "From"; `RecentlyViewedStrip`, video tiles and the try-on panel test only `p.rental` and print no "From". Cards show the base price while the PDP defaults to `metals[0]` (platinum-first bridal pieces open +650 CAD / +475 USD higher).
- Controls nested inside `ProductCard`'s `<a>` (WishButton, TryOnButton) must stay `type="button"` and stop propagation; this is invalid interactive nesting for assistive tech but intentional for the card UX.
- The mobile menu has no Escape handler, scroll lock or Lenis stop; the Footer newsletter form gives no feedback.
- Product names, category names, metals and badges display through `useCatalog()` everywhere in this doc's components (`ProductCard` `alt` and `h3` included); the English `product.name` is kept for heuristics only.
- Tailwind v4 wraps `group-hover:` in `@media (hover: hover)`, so the secondary card image never appears on touch devices.
- `useReveal` replays every reveal in scope when its deps change (e.g. Category re-sorting).

## Related docs

- [../features/languages.md](../features/languages.md) — LocaleMenu, LanguageToggle, LanguageNotice, LanguageVeil
- [../architecture.md](../architecture.md) — provider tree, store API, routing
- [../design-system.md](../design-system.md) — tokens, type recipes, z-index ladder
- [../motion-and-interaction.md](../motion-and-interaction.md) — Lenis, GSAP, reveal details
- [../pages/cart-and-checkout.md](../pages/cart-and-checkout.md) — CartDrawer in full
- [../pages/category.md](../pages/category.md) — ProductCard in context
- [../ux-patterns-and-accessibility.md](../ux-patterns-and-accessibility.md) — overlay and a11y patterns
