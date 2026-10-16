# Home page

The Home page is the editorial landing route of the Teresa & Sons theme prototype, rendered by `Home` in `src/pages/Home.tsx` for any hash that does not match another route (for example `#/`). It stacks 18 top-level sections: 15 imported components plus 3 sections written inline in `Home.tsx`. The page opens with a three-slide GSAP hero carousel and alternates light (travertine/silk) and dark (vault) surfaces. All content is hard-coded copy or local catalog/media data; the only live inputs are the store's `currency`, `recent` (recently viewed) and wishlist state, plus the try-on context. One `useReveal(root)` call on the page wrapper drives scroll reveals and image parallax for the whole page.

Scope: `src/pages/Home.tsx`, `src/components/HomeHero.tsx`, `src/components/home/CategoryIndex.tsx`, `src/components/home/FourCs.tsx`, `src/components/home/GiftFinder.tsx`, `src/components/home/MakingScroll.tsx`, `src/components/home/PressStrip.tsx`, `src/components/home/SectionHeader.tsx`, `src/components/home/Services.tsx`, `src/components/home/SocialGrid.tsx`, `src/components/home/Testimonials.tsx`, `src/components/home/Treasured.tsx`, `src/components/home/TryOnFeature.tsx`, `src/components/home/VisitSalon.tsx`, `src/components/home/WatchSpotlight.tsx`, `src/components/video/ShoppableVideos.tsx`, `src/components/RecentlyViewed.tsx`, `src/components/ProductCard.tsx`, `src/data/media.ts`, `src/data/catalog.ts`. Supporting behaviour was checked in `src/components/useReveal.ts`, `src/index.css`, `src/store.tsx`, `src/App.tsx`, `src/components/SmoothScroll.tsx`, `src/components/Header.tsx`, `src/components/Price.tsx`, `src/components/WishButton.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/tryon/TryOnProvider.tsx`, `src/components/video/useInViewPlay.ts` and `src/components/video/VideoViewer.tsx`.

All derived values below (product lists, counts, prices, GiftFinder results) were computed from `src/data/catalog.ts` / `src/data/media.ts` at commit `db22872`. Recompute them if the catalog changes.

---

## 1. Page wireframe (desktop, ≥ 1024 px)

The copy in this diagram is schematic. Section 8 (Copy deck) has the verbatim strings.

```
  [Header: App-level, sticky (~7rem). Not part of Home]
 +---------------------------------------------------------------------------+
 | 1  HomeHero           vault | h = calc(100svh - 7rem), min-h 680px        |
 |  :  3 stacked full-bleed bg images (wipe in from the right on change)     |
 |  :                                                          +---------+   |
 |  :   ---- EYEBROW                                           | inset   |   |
 |  :   (0n) Line one                                          | 3:4     |   |
 |  :          - line two (italic, champagne)                  +---------+   |
 |  :      Line three                                          LABEL     0n  |
 |  :   [body 4/12]    (O->) CTA 4/12       PIECE | WEIGHT | GRADE  4/12     |
 |  :   0n ===------ 03    TAB   TAB   TAB                       SCROLL v    |
 |  :.. vertical side label (rotated -90deg)                                 |
 +---------------------------------------------------------------------------+
 | 2  PressStrip    AS SEEN IN | name   name   name   name ...  (marquee <<<) |
 +---------------------------------------------------------------------------+
 | 3  CategoryIndex   01 ---------------------------------------- EYEBROW    |
 |    Title                                              [aside paragraph]   |
 |    I     Necklaces         Colliers              3 PIECES            ->   |
 |    II    Earrings          ...                                       ->   |
 |    ...   9 rows; a 300x380 image preview follows the cursor on hover      |
 +---------------------------------------------------------------------------+
 | 4  Treasured   02 -------------------------------------------- EYEBROW    |
 |    Title                                      [TAB]  [TAB]  [TAB]         |
 |    [card 4:5]   [card 4:5]   [card 4:5]                                   |
 |    [card 4:5]   [card 4:5]   [card 4:5]                                   |
 |                       EXPLORE ALL COLLECTIONS                             |
 +---------------------------------------------------------------------------+
 | 5  TryOnFeature  vault  [copy 5/12 + gold button]    [3:4 viewfinder 6/12]|
 +---------------------------------------------------------------------------+
 | 6  Bridal (inline)  silk  [4:5 image 6/12 + square overlap]  [copy 5/12]  |
 |                                   [Cut | Color | Clarity row] [2 CTAs]    |
 +---------------------------------------------------------------------------+
 | 7  FourCs  vault  [title + square image with huge key 5/12] [4 tabs 6/12] |
 |                                         [panel, scale bar, 2 CTAs]        |
 +---------------------------------------------------------------------------+
 | 8  ShoppableVideos   - ------------------------------------- EYEBROW      |
 |    Title                                                   (<)  (>)       |
 |    [9:16] [9:16] [9:16] [9:16] [9:16] ...   horizontal snap rail          |
 +---------------------------------------------------------------------------+
 | 9  GiftFinder  [eyebrow, title, budget chips, occasion chips 4/12]        |
 |                [up to 4 product cards, 2 per row, 8/12 | or empty panel]  |
 +---------------------------------------------------------------------------+
 | 10 MakingScroll  silk | pinned at 112px | h = calc(100vh - 7rem)          |
 |    06 . THE MAKING / Title                     [progress line] caption    |
 |    [01]  [02]  [03]  [04]  [05]  [spacer]   -> slides left while pinned   |
 +---------------------------------------------------------------------------+
 | 11 WatchSpotlight  [4:5 image 5/12]     [copy + 3 watch rows 6/12]        |
 +---------------------------------------------------------------------------+
 | 12 Rentals (inline)  vault | bg image at 35% + vignette | centred copy    |
 +---------------------------------------------------------------------------+
 | 13 Testimonials   stars + rating | rotating quote (6.5 s) | 3 dash buttons|
 +---------------------------------------------------------------------------+
 | 14 Heritage (inline)    [quote 5/12]               [2 portrait imgs 6/12] |
 +---------------------------------------------------------------------------+
 | 15 RecentlyViewed (only when history exists)  [card] [card] [card] [card] |
 +---------------------------------------------------------------------------+
 | 16 Services     3 x 2 hairline grid of icon cards + "Questions?" line     |
 +---------------------------------------------------------------------------+
 | 17 SocialGrid   09 . @handle / Title     [sq] [sq] [sq] [sq] [sq] [sq]    |
 +---------------------------------------------------------------------------+
 | 18 VisitSalon  vault   [image 1/2]     [copy, address, hours, 2 CTAs 1/2] |
 +---------------------------------------------------------------------------+
  [Footer: App-level. Not part of Home]
```

---

## 2. Section inventory (render order)

| # | Section | Source (symbol) | Index · eyebrow shown | Surface | Data | Interaction |
|---|---|---|---|---|---|---|
| 1 | Hero carousel | `src/components/HomeHero.tsx` (`HomeHero`) | slide eyebrows, no index | `--bg-vault`, light text | `SLIDES`, `IMG`, `href` | 7 s autoplay, 3 slide buttons, pointer parallax, scroll-out |
| 2 | Press strip | `src/components/home/PressStrip.tsx` (`PressStrip`) | "As seen in" | inherited travertine, bottom hairline | `PRESS` | CSS marquee (pauses on hover) |
| 3 | Category index | `src/components/home/CategoryIndex.tsx` (`CategoryIndex`) | 01 · Nine chapters | travertine | `CATEGORIES`, `getProductsByCategory` | cursor-following preview (lg) |
| 4 | Most treasured | `src/components/home/Treasured.tsx` (`Treasured`) | 02 · The selection | travertine | `PRODUCTS` filtered by badge | 3 tabs |
| 5 | Virtual try-on promo | `src/components/home/TryOnFeature.tsx` (`TryOnFeature`) | — Essayage virtuel | `--bg-vault` | `PRODUCTS` + `tryOnKind` | opens the try-on studio |
| 6 | Bridal editorial | inline in `src/pages/Home.tsx` | 03 Chapter V · Mariage | `--bg-silk` | `SPECS`, `IMG` | links |
| 7 | Four Cs | `src/components/home/FourCs.tsx` (`FourCs`) | 04 Diamond Education | `--bg-vault` | `CS` | 4 tabs |
| 8 | Shoppable films | `src/components/video/ShoppableVideos.tsx` (`ShoppableVideos`) | — · Watch & shop | travertine (`tone` light) | `VIDEOS` (10) | rail arrows; tiles open `VideoViewer` |
| 9 | Gift finder | `src/components/home/GiftFinder.tsx` (`GiftFinder`) | 05 Le Trouveur de Cadeaux | travertine | `BUDGETS`, `OCCASIONS`, `PRODUCTS`, `priceFor` | budget + occasion chips |
| 10 | The making | `src/components/home/MakingScroll.tsx` (`MakingScroll`) | 06 · The making | `--bg-silk` | `STEPS` | pinned horizontal scrub (lg) or native horizontal scroll |
| 11 | Watch spotlight | `src/components/home/WatchSpotlight.tsx` (`WatchSpotlight`) | 07 Chapter VI · Horlogerie | travertine | `getProductsByCategory('watches')` | product links |
| 12 | Rentals banner | inline in `src/pages/Home.tsx` | Chapter VII · La Location, no index | `--bg-vault` | static | link |
| 13 | Testimonials | `src/components/home/Testimonials.tsx` (`Testimonials`) | none | travertine (explicit), hairline top and bottom | `QUOTES` | 6.5 s auto-rotate + 3 buttons |
| 14 | Heritage quote | inline in `src/pages/Home.tsx` | 08 Chapter IX · Sur Mesure | travertine | static | link |
| 15 | Recently viewed | `src/components/RecentlyViewed.tsx` (default export `RecentlyViewed`) | — · Welcome back | travertine, top hairline | store `recent` | "Clear history"; renders `null` when empty |
| 16 | Services | `src/components/home/Services.tsx` (`Services`) | none | travertine | inline `items` (currency-aware) | link |
| 17 | Social grid | `src/components/home/SocialGrid.tsx` (`SocialGrid`) | 09 · @teresaandsons | travertine | `TILES` | inert tiles |
| 18 | Visit the salon | `src/components/home/VisitSalon.tsx` (`VisitSalon`) | Le Salon | `--bg-vault`, bottom `border-white/10` | static | links |

Surface rhythm: dark, light, light, light, dark, silk, dark, light, light, silk, light, dark, light, light, (light, conditional), light, light, dark. "travertine" means the section sets no background and inherits `bg-[var(--bg-travertine)]` from the App wrapper in `src/App.tsx`. The only exception is `Testimonials`, which sets the same colour explicitly.

---

## 3. Page-level mechanics

### 3.1 The `Home` component (`src/pages/Home.tsx`)

- `Home()` takes no props and holds no state. It creates `root = useRef<HTMLDivElement>(null)`, calls `useReveal(root)` and returns `<div ref={root}>` with no classes. Every section is a child of that div, so all `data-reveal*`/`data-parallax` attributes on the page fall inside the hook's scope.
- Imports: `IMG` (`src/data/catalog.ts`), `href` (`src/store.tsx`), `VIDEOS` (`src/data/media.ts`), `useReveal` (`src/components/useReveal.ts`), and the 15 section components.
- Module constant `SPECS` (used by the inline Bridal section): `[['Cut', 'Excellent'], ['Color', 'D – G'], ['Clarity', 'IF – VS2']]`.
- Routing: `parseHash` in `src/store.tsx` returns `{ name: 'home' }` for any hash it does not recognise. `Routes` in `src/App.tsx` renders `<Home />` in its `default` branch. On every `route` change `SmoothScroll` (`src/components/SmoothScroll.tsx`) jumps to the top (`lenis.scrollTo(0, { immediate: true })`, or `window.scrollTo(0, 0)` without Lenis) and schedules `ScrollTrigger.refresh()` on the next animation frame.

### 3.2 Reveal, image-reveal and parallax attributes (`useReveal`)

`useReveal(scope, deps = [])` is a `useLayoutEffect`. It returns early when `prefers-reduced-motion: reduce` matches, so nothing is hidden and nothing animates. It builds every tween inside `gsap.context(…, scope)`: in the installed gsap 3.15.0, `gsap.utils.toArray(selector)` inside a context queries only the scope. The context is reverted on unmount. Home calls it with no `deps`, so it runs **once per mount of `Home`**.

| Attribute | Animation | ScrollTrigger | Home elements carrying it |
|---|---|---|---|
| `data-reveal` (the value is a delay in seconds, `Number(el.dataset.reveal) \|\| 0`) | `fromTo` `{ y: 40, opacity: 0 }` → `{ y: 0, opacity: 1 }`, 1.2 s, `expo.out` | element `start: 'top 88%'`, `once: true` | SectionHeader eyebrow row / h2 / aside; text blocks in TryOnFeature, Bridal, FourCs (including its image box), WatchSpotlight, Rentals, Heritage, VisitSalon; the GiftFinder left column; the Testimonials stars row; every ProductCard; CategoryIndex rows and cards; ShoppableVideos tiles; Services cells; SocialGrid tiles |
| `data-reveal-img` | clip-path `inset(100% 0% 0% 0%)` → `inset(0% 0% 0% 0%)` (reveals upward from the bottom edge), 1.6 s, `expo.inOut` | element `start: 'top 85%'`, `once: true` | Bridal main and overlap image boxes, TryOnFeature image box, two Heritage image boxes (5 in total) |
| `data-parallax` (on an `<img>`) | `fromTo` `{ yPercent: -8, scale: 1.12 }` → `{ yPercent: 8, scale: 1.12 }`, `ease: 'none'` | **`el.parentElement`**, `'top bottom'` → `'bottom top'`, `scrub: true` | Bridal `IMG.bridal1`, TryOnFeature `IMG.earrings3`, WatchSpotlight `IMG.watch2`, Rentals background `IMG.jewelryFlat`, Heritage `IMG.ring2` and `IMG.rings`, VisitSalon `IMG.jewelryFlat` (7 in total). Every parent is `overflow-hidden`. |

`HomeHero`, `PressStrip` and `MakingScroll` carry no `data-reveal*`/`data-parallax` attributes; they animate themselves or not at all.

Because the hook runs only once, elements that mount after the first render are never registered and render immediately with no GSAP reveal. This covers the Treasured grid after a tab change and GiftFinder cards for a new filter. Treasured re-plays a CSS `fadeUp` animation instead.

### 3.3 Surfaces, breakpoints and recurring recipes

Tokens (`:root` in `src/index.css`): `--bg-travertine #FBF9F5`, `--bg-silk #F3EFE6`, `--bg-vault #121110`, `--text-espresso #141311`, `--text-taupe #6E685F`, `--text-linen #A39C91`, `--gold-vermeil #B89047`, `--gold-champagne #D4B982`, `--border-hairline #E6E0D4`. Fonts: `.font-serif-editorial` (Baskervville, lining figures), `.font-spec` (Jost with lining tabular figures), and the body face (Jost, set on `html`).

Breakpoints are Tailwind v4 defaults; `src/index.css` defines no `@theme`. Home code uses `sm:` (640 px), `md:` (768 px, only the CategoryIndex mobile grid) and `lg:` (1024 px). It never uses `xl:` or `2xl:`. `ProductCard` also uses the arbitrary variant `[@media(hover:hover)]:`.

| Recipe | Classes (verbatim) | Used by |
|---|---|---|
| Page container | `mx-auto max-w-[1600px] px-6 lg:px-12` | nearly every section. `HomeHero` copy uses `lg:px-16`, `Testimonials` uses `mx-auto max-w-5xl px-6`, `VisitSalon` is full-bleed. |
| Vertical rhythm A | `py-28 lg:py-36` | TryOnFeature, FourCs, GiftFinder, WatchSpotlight, Testimonials; ShoppableVideos (`pt-28 lg:pt-36` / `pb-28 lg:pb-36`); RecentlyViewed uses `py-28` with no `lg` step; SocialGrid uses only `pb-28 lg:pb-36` |
| Vertical rhythm B | `py-32 lg:py-44` | CategoryIndex, Bridal, Heritage; Treasured uses only `pb-32 lg:pb-44` |
| Display H2 | `font-serif-editorial text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[…]` | `lg` size 5.25rem in SectionHeader and Bridal, 5rem in TryOnFeature, 4.75rem in FourCs, GiftFinder and WatchSpotlight |
| Eyebrow | `font-spec text-[10px] uppercase tracking-[0.3em]` + coloured index span | all numbered sections |
| Accent word | `<em className="text-[var(--gold-vermeil)]">` on light, `<em className="text-[var(--gold-champagne)]">` on dark | every headline |
| Dark solid CTA (light bg) | `bg-[var(--text-espresso)] px-9 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 hover:bg-[var(--gold-vermeil)]` | Bridal "Explore bridal" |
| Gold solid CTA (dark bg) | `bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white` | FourCs, VisitSalon. TryOnButton `solid` is the same plus `inline-flex items-center gap-2.5 transition-colors`. The Rentals variant uses `px-10`, `tracking-[0.26em]` and `transition-colors duration-500 hover:bg-[var(--bg-travertine)]`. |
| Underline CTA (dark bg) | `border-b border-white/40 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--gold-champagne)]` | FourCs, VisitSalon |
| Editorial link | `link-line` (CSS class in `src/index.css`: 11px/500/uppercase/0.26em, 25% hairline with a vermeil underline sweeping in on hover) | Bridal, Heritage, Treasured, SocialGrid aside, RecentlyViewed aside |
| Image hover zoom | `editorial-zoom` inside a `group` (`.group:hover .editorial-zoom { transform: scale(1.045) }`, 1.1 s `cubic-bezier(0.16,1,0.3,1)`) | ProductCard, CategoryIndex mobile cards, MakingScroll, WatchSpotlight thumbs, video tiles, SocialGrid |

On dark sections the text is `text-[var(--bg-travertine)]`, accents are `--gold-champagne`, muted text is `text-white/40`–`text-white/75` and rules are `white/15`. On light sections accents are `--gold-vermeil`, muted text is `--text-linen` or `--text-taupe` and rules are `--border-hairline`.

### 3.4 Store and context dependencies

| Dependency | Consumers on Home |
|---|---|
| `useStore().currency` (`'CAD' \| 'USD'`) | GiftFinder (budget filtering and the "(CAD)" label), WatchSpotlight prices, Services shipping copy, every `ProductCard`/`Price`, ShoppableVideos tile prices |
| `useStore().recent`, `clearRecent` | RecentlyViewed. `recent` holds slugs, most recent first, capped at 12, persisted in `localStorage['tns-recent']`, and written by `recordView` in `src/pages/Product.tsx`. |
| `useStore().isWished` / `toggleWishlist` | `WishButton` inside every ProductCard |
| `useTryOn()` (`src/components/tryon/TryOnProvider.tsx`) | `TryOnButton` in TryOnFeature and in ProductCards. It renders `null` when `tryOnKind(product)` is `null`. |
| `href` helpers (`src/store.tsx`) | every internal link: `href.category(slug)` = `#/c/{slug}`, `href.product(slug)` = `#/p/{slug}`, `href.atelier` = `#/atelier` |

---

## 4. Sections in detail

### 4.1 HomeHero (`src/components/HomeHero.tsx`)

**Purpose.** A full-viewport, three-slide editorial carousel. Each slide has a background image, a framed inset image, a three-line serif headline, body copy, a CTA and a three-cell spec readout. It is the only `<h1>` source on the page.

**Module constants.** `SLIDES` is an array of three object literals with no declared type. `DURATION = 7` is the seconds each slide is shown and also the length of the progress bar. The module also calls `gsap.registerPlugin(ScrollTrigger)`.

```ts
{
  eyebrow: 'Collection Lumière · Automne',
  lines: ['Light, set', 'by hand,', 'since 1962.'],
  italic: 1,
  body: 'Three generations of Montreal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke.',
  image: IMG.necklace2,
  inset: IMG.earrings1,
  insetLabel: 'Vieux-Port Studs',
  cta: { label: 'Discover necklaces', to: href.category('necklaces') },
  spec: ['Rivière Saint-Laurent', '12.40 ct', 'F–G / VS'],
},
```

| Field | Slide 0 | Slide 1 | Slide 2 |
|---|---|---|---|
| `eyebrow` | Collection Lumière · Automne | Chapitre V · Mariage | Chapitre VII · La Location |
| `lines[0]` | Light, set | A promise, | Borrow the |
| `lines[1]` (accent; `italic: 1` on every slide) | by hand, | certified | vault |
| `lines[2]` | since 1962. | to the facet. | for a night. |
| `body` | Three generations of Montreal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke. | Engagement rings with GIA-graded centre stones, hand-set in platinum by our master setter. | High jewelry for galas and premieres, insured and couriered across Canada and the United States. |
| `image` (background) | `IMG.necklace2` | `IMG.bridal1` | `IMG.jewelryFlat` |
| `inset` | `IMG.earrings1` | `IMG.bridal2` | `IMG.necklace1` |
| `insetLabel` | Vieux-Port Studs | Basilique Three-Stone | Gala Diamond Collar |
| `cta.label` → `cta.to` | Discover necklaces → `#/c/necklaces` | Explore bridal → `#/c/bridal` | View rentals → `#/c/rentals` |
| `spec[0]` (Piece) | Rivière Saint-Laurent | Notre-Dame Oval | Gala Collar |
| `spec[1]` (Weight) | 12.40 ct | 1.82 ct | 18.20 ct |
| `spec[2]` (Grade) | F–G / VS | E / VS1 | From weekend |
| Slide-button label (`eyebrow.split('·')[1]?.trim() ?? eyebrow`) | Automne | Mariage | La Location |

The `spec` values are literals. They match the catalog today (Rivière Saint-Laurent specs, Notre-Dame Oval Solitaire GIA spec, Gala Diamond Collar total carat weight) but are not derived from it.

**State and refs.** `root` (section ref), `index` (`useState(0)`), `busy` (a ref used as a transition lock), and `reduced`. `reduced` is computed during every render as `typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

**Structure and layering** (bottom to top):

1. `<section ref={root}>`: `relative h-[calc(100svh-7rem)] min-h-[680px] overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]`. 7rem is 112 px. From the Header classes this works out to the sticky header's height: a 31 px announcement bar, the 80 px `h-20` bar and a 1 px border. That figure is computed from classes, not measured.
2. `<div data-hero-frame className="absolute inset-0">` holds one background layer per slide: `<div data-bg={i} data-hero-bg className="absolute -inset-[4%] overflow-hidden">` (4 % overscan so the scale and parallax never expose edges). Each layer has inline `zIndex: i === index ? 2 : 1` and `clipPath: i === index ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)'`, and wraps `<img alt="" className="h-full w-full object-cover" fetchPriority={i === 0 ? 'high' : 'auto'}>`. There is no `loading` attribute, so all three load eagerly. Two `z-[3]` overlays sit on top: `bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,rgba(18,17,16,0.55)_70%)]` and `bg-gradient-to-t from-[var(--bg-vault)] via-[var(--bg-vault)]/20 to-[var(--bg-vault)]/40`.
3. `<figure data-hero-inset>`: `absolute right-[6%] top-[12%] z-[5] hidden w-[17vw] max-w-[260px] lg:block`. Its frame is `relative aspect-[3/4] overflow-hidden outline outline-1 outline-offset-8 outline-[var(--gold-champagne)]/40` and stacks three `<img data-inset-img={i} alt="">` with inline `zIndex` 2/1 and `clipPath` `inset(0% 0 0 0)` / `inset(100% 0 0 0)`. The `<figcaption>` (`font-spec mt-5 flex justify-between text-[9px] uppercase tracking-[0.24em] text-white/60`) shows `slide.insetLabel` and `0{index + 1}` in champagne.
4. A vertical side label `<p data-hero-meta>`: `font-spec absolute left-6 top-1/2 z-[5] hidden origin-left -translate-y-1/2 -rotate-90 text-[9px] uppercase tracking-[0.5em] text-white/40 lg:block lg:left-10`.
5. Copy `<div data-hero-copy>`: `relative z-[6] mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-10 lg:px-16 lg:pb-12`, anchored to the bottom. It holds a `relative` wrapper containing **all three slide blocks**, followed by the controls row. The active slide block has class `relative`. Inactive blocks have `pointer-events-none absolute inset-x-0 bottom-0 opacity-0` and `aria-hidden={i !== index}`.

**Slide block.**

- Eyebrow `<p data-fade>`: `font-spec mb-7 flex items-center gap-4 text-[10px] uppercase tracking-[0.34em] text-[var(--gold-champagne)]`, preceded by a `h-px w-10` champagne rule.
- `<h1>`: `font-serif-editorial font-light leading-[0.84] tracking-[-0.035em] !oldstyle-nums lg:max-w-[72%]` (old-style figures, so "1962" sits in the line like lowercase) with inline `fontSize: 'clamp(3.4rem, min(10.5vw, 15.5vh), 10rem)'`. The source comment says the size tracks both viewport width and height "so three lines never crowd the controls".
- Each line has an outer mask span `block overflow-hidden pb-[0.24em] -mb-[0.16em]` (room for Baskervville's descenders; the negative margin keeps the 0.84 leading) plus an indent: the accent line gets `pl-[0.9em] sm:pl-[1.6em]`, the third line `pl-[0.35em] sm:pl-[0.55em]`, the first none. Inside is `<span data-line className="relative inline-flex items-start">`, the element that slides.
  - Line 0 is prefixed with `(0{i + 1})` (`font-spec mr-4 mt-[0.22em] hidden text-[10px] font-normal not-italic tracking-[0.2em] text-[var(--gold-champagne)] sm:inline`).
  - The accent line (`li === s.italic`) is prefixed with a short rule (`mr-[0.25em] mt-[0.5em] hidden h-px w-[0.9em] bg-[var(--gold-champagne)]/70 sm:block`), and its text span gets `font-normal italic text-[var(--gold-champagne)]`.
- Lower grid `mt-8 grid items-end gap-8 lg:mt-10 lg:grid-cols-12`:
  - Body `<p data-fade>`: `max-w-sm text-sm leading-relaxed text-white/70 lg:col-span-4`.
  - CTA `<a data-fade href={s.cta.to}>`: `group inline-flex items-center gap-5 justify-self-start text-[11px] font-medium uppercase tracking-[0.26em] lg:col-span-4`. It contains a 56 px circle (`h-14 w-14 rounded-full border border-[var(--gold-champagne)]`) whose champagne fill grows from the bottom on hover (`absolute inset-0 origin-bottom scale-y-0 … transition-transform duration-500 ease-out group-hover:scale-y-100`). `ArrowRight` (size 16, stroke 1.4) turns `--bg-vault` on hover, and the label follows.
  - Spec `<dl data-fade>`: `font-spec hidden grid-cols-3 gap-6 border-l border-white/15 pl-6 text-[10px] uppercase tracking-[0.18em] lg:col-span-4 lg:grid`. The `dt`s "Piece"/"Weight"/"Grade" are `text-white/40`; the `dd`s come from `spec` (`mt-1.5 text-white/85`).

**Controls row** (`<div data-hero-meta className="mt-12 flex items-center gap-8 border-t border-white/15 pt-6">`):

- Counter (`font-spec flex items-center gap-3 text-[11px] tracking-[0.2em]`): `0{index + 1}` in champagne, then a progress track `relative h-px w-28 overflow-hidden bg-white/20` containing `<span data-progress className="absolute inset-0 origin-left bg-[var(--gold-champagne)]">`, then `0{SLIDES.length}` ("03") in `text-white/40`.
- One `<button>` per slide: `onClick={() => go(i)}` and `aria-label={`Show slide ${i + 1}`}`. Classes: `font-spec px-2 py-1 text-[9px] uppercase tracking-[0.22em] transition-colors`, plus `text-white` when active or `text-white/35 hover:text-white/70` otherwise.
- A non-interactive "Scroll" hint: `font-spec ml-auto hidden items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-white/50 sm:flex`, with `ArrowDown` (size 12) using Tailwind `animate-bounce`.

**Effect 1: intro, scroll-out and pointer parallax.** A `useLayoutEffect` with deps `[reduced]`, skipped entirely when `reduced` is true. Its tweens live in a `gsap.context` scoped to the section.

| Target | Tween | Timing / trigger |
|---|---|---|
| `[data-hero-frame]` | `gsap.from({ clipPath: 'inset(12% 12% 12% 12%)' })`, an iris opening to the full frame | 1.8 s, `expo.inOut`, on mount |
| `[data-hero-meta]` (side label and controls row) | `gsap.from({ opacity: 0, y: 16 })` | 1 s, `stagger: 0.08`, `delay: 1.1`, `expo.out` |
| `[data-hero-bg]` (all 3 layers) | `gsap.to({ yPercent: 18, scale: 1.08, ease: 'none' })` | `scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true }` |
| `[data-hero-copy]` | `gsap.to({ yPercent: -30, opacity: 0, ease: 'none' })` | same trigger, but `end: '70% top'` |
| `[data-hero-inset]` | `gsap.to({ yPercent: -40, ease: 'none' })` | same trigger as the backgrounds |

Pointer parallax uses `gsap.quickTo`, created outside the context. The inset gets `x` and `y` (1.2 s, `power3.out`); all `[data-hero-bg]` layers get `x` (1.6 s, `power3.out`). A `pointermove` listener on the section computes `nx = clientX / innerWidth − 0.5` and `ny = clientY / innerHeight − 0.5`, then sets inset `x = nx × −40`, inset `y = ny × −30` and background `x = nx × 18` (pixels). Cleanup removes the listener and reverts the context.

**Effect 2: per-slide headline reveal.** A `useLayoutEffect` with deps `[index]`. It is **not** gated by reduced motion. Inside a context scoped to the section:

- It first calls `gsap.killTweensOf(lines)`. The exit tween from this slide's previous `go()` can still hold its lines; without this, a line could stay stuck above its mask (fixed 2026-10-16).
- A timeline animates `[data-slide="{index}"] [data-line]` from `{ yPercent: 115, rotate: 2 }` to `{ yPercent: 0, rotate: 0 }` (1.4 s, `stagger: 0.1`, `expo.out`; with 3 lines it spans 1.6 s). It then animates `[data-slide="{index}"] [data-fade]` (eyebrow, body, CTA, spec: 4 elements) from `{ opacity: 0, y: 14 }` to `{ opacity: 1, y: 0 }` (1 s, `stagger: 0.08`, `expo.out`). The fade is positioned `'-=1'`, so it starts at 0.6 s.
- `[data-progress]` runs `fromTo` `scaleX` 0 → 1 over `DURATION` (7 s) with `ease: 'none'`.
- Cleanup calls `ctx.revert()`.

**Slide change: `go(next)`** (`useCallback`, deps `[index]`).

- Returns immediately if `busy.current` is set, if `next === index`, or if there is no root. Otherwise it sets `busy.current = true`, computes `target = (next + SLIDES.length) % SLIDES.length` (so `index + 1` wraps from the last slide to 0), creates `q = gsap.utils.selector(root)` and sets `linesOut = 0.7 + 0.05 * (lines − 1)`, the moment the last outgoing line has lifted out (0.8 s for the current 3-line headlines).

```ts
gsap
  .timeline({ onComplete: () => { busy.current = false } })
  .to(q(`[data-slide="${index}"] [data-line]`), { yPercent: -115, duration: 0.7, stagger: 0.05, ease: 'expo.in' })
  .to(q(`[data-slide="${index}"] [data-fade]`), { opacity: 0, duration: 0.4 }, 0)
  .fromTo(q(`[data-bg="${target}"]`), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
  .fromTo(q(`[data-bg="${target}"] img`), { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.1)
  .fromTo(q(`[data-inset-img="${target}"]`), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.3)
  .add(() => setIndex(target), linesOut)
```

| Time (s) | What happens |
|---|---|
| 0 | Outgoing headline lines exit upward (−115 %, 0.7 s, stagger 0.05, `expo.in`). Outgoing `data-fade` elements fade to 0 (0.4 s). |
| 0.1 | The incoming background wipes in from the right edge (left inset 100 % → 0 %, 1.4 s, `expo.inOut`). Its image settles from scale 1.25 to 1 (2.2 s, `expo.out`). |
| 0.3 | The incoming inset image reveals upward (top inset 100 % → 0 %, 1.2 s, `expo.inOut`). |
| 0.8 (`linesOut`) | `setIndex(target)`, once every outgoing line is out. React re-renders: inline `zIndex`/`clipPath`, the slide classes and `aria-hidden` flip, Effect 2 replays the headline reveal and restarts the progress bar, and Effect 3 starts a new timer. |
| 2.3 | The timeline completes and `busy` is released. Clicks on slide buttons between 0 and 2.3 s are ignored. |

Until 0.8 s, React's inline z-index (1 vs 2) keeps the incoming layer underneath the outgoing one. Notes & gotchas covers the visual consequence.

**Effect 3: autoplay** (`useEffect`, deps `[index, go, reduced]`). When `reduced` is false it calls `window.setTimeout(() => go(index + 1), DURATION * 1000)` and clears the timer on cleanup. Both the timer and the progress bar restart whenever `index` changes, which is `linesOut` (0.8 s) into a transition. Nothing pauses autoplay: not hovering, not focus, not the hero leaving the viewport, not a hidden tab.

**Reduced motion summary.** There is no intro, no scroll or pointer parallax and no autoplay. The headline reveal and the 7 s progress fill still run on mount and on every change. A manual `go()` still plays the full wipe timeline.

**Responsive behaviour.**

| Element | < 640 px | ≥ 640 px (`sm`) | ≥ 1024 px (`lg`) |
|---|---|---|---|
| Section height | `calc(100svh − 7rem)`, min 680 px | same | same |
| H1 size | `clamp(3.4rem, min(10.5vw, 15.5vh), 10rem)` | same | same, plus `max-w-[72%]` |
| `(0n)` prefix and accent rule | hidden | shown | shown |
| Line indents | accent 0.9em, line 3 0.35em | accent 1.6em, line 3 0.55em | as `sm` |
| Body / CTA / spec | single column; spec `dl` hidden | same | 12-column grid, 4 + 4 + 4; spec shown |
| Inset figure, vertical side label | hidden | hidden | shown |
| Copy padding | `px-6 pb-10` | same | `px-16 pb-12`; lower grid `mt-10` |
| "Scroll" hint | hidden | shown | shown |

**Accessibility attributes.** Three `<h1>` elements are in the DOM, one per slide; inactive slides get `aria-hidden="true"` and the active one `aria-hidden="false"`. All background and inset images have `alt=""`. Slide buttons have `aria-label="Show slide N"`; there is no `aria-pressed`/`aria-current`, no carousel role or label, and no pause control.

### 4.2 PressStrip (`src/components/home/PressStrip.tsx`)

- **Purpose:** an "as seen in" trust strip of publication names.
- **Markup:** `<section className="border-b border-[var(--border-hairline)] py-10" aria-label="As featured in">`. Inside is the container `mx-auto flex max-w-[1600px] items-center gap-10 px-6 lg:px-12` holding:
  - the label `<p>` "As seen in": `font-spec shrink-0 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]`;
  - a marquee viewport `relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]` (both edges fade out);
  - inside the viewport, `<div className="animate-marquee">` with `[...PRESS, ...PRESS]`: 16 `<span>`s keyed by array index, each `font-serif-editorial whitespace-nowrap px-10 text-3xl italic text-[var(--text-taupe)]`.
- **Data:** `PRESS` = Vogue, ELLE Québec, The Globe and Mail, Harper’s Bazaar, La Presse, Town & Country, Montreal Gazette, Brides.
- **Animation:** `.animate-marquee` in `src/index.css` is `display: flex; width: max-content; animation: marqueeScroll 38s linear infinite`. The keyframe runs `translateX(0%)` → `translateX(-50%)`, which is seamless because the list is doubled. Hover sets `animation-play-state: paused`, and `animation: none` applies under `prefers-reduced-motion: reduce`. The Header announcement bar uses the same class. No reveal attributes.
- **Breakpoints:** identical layout everywhere; only the side padding changes (`px-6` → `lg:px-12`).
- **A11y:** the `aria-label` makes the section a region landmark. Names are plain text with no links.

### 4.3 CategoryIndex (`src/components/home/CategoryIndex.tsx`)

- **Purpose:** an index of all nine catalog categories ("chapters"). Desktop shows a typographic list; smaller screens show image cards.
- **Header:** `SectionHeader` with `index="01"`, `eyebrow="Nine chapters"`, title `The <em vermeil>Index</em>`, and as `aside` a `<p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">` paragraph.
- **Section:** `mx-auto max-w-[1600px] px-6 py-32 lg:px-12 lg:py-44`.
- **Data:** `CATEGORIES` (9, in array order). The row count is `getProductsByCategory(c.slug).length`, currently 3 for every category, so every row reads "3 pieces".

| `eyebrow` | `slug` → link | `name` | `french` | `hero` image |
|---|---|---|---|---|
| I | necklaces → `#/c/necklaces` | Necklaces | Colliers | `IMG.necklace1` |
| II | earrings | Earrings | Boucles d'oreilles | `IMG.earrings1` |
| III | bracelets | Bracelets | Bracelets | `IMG.bracelet1` |
| IV | rings | Rings | Bagues | `IMG.ring1` |
| V | bridal | Bridal Jewelry | Mariage | `IMG.bridal1` |
| VI | watches | Watches | Montres | `IMG.watch1` |
| VII | rentals | Jewelry Rentals | Location | `IMG.jewelryFlat` |
| VIII | gifts | Gifts | Cadeaux | `IMG.gift1` |
| IX | custom | Personalized & Custom | Sur mesure | `IMG.ring2` |

- **Desktop (`lg+`):** `<ul ref={list} className="relative hidden border-t border-[var(--border-hairline)] lg:block" onMouseLeave={() => setHover(null)}>`.
  - Its first child is a preview `<div ref={preview}>`: `pointer-events-none absolute left-0 top-0 z-10 -ml-[150px] -mt-[190px] h-[380px] w-[300px] overflow-hidden opacity-0`. The negative margins centre the 300 × 380 box on the pointer. It stacks all 9 `c.hero` images (`alt=""`, no `loading` attribute, `transition-opacity duration-500`), each with inline `opacity: hover === i ? 1 : 0`.
  - Each row is `<li data-reveal={i * 0.03}>` (0 to 0.24 s) wrapping `<a href={href.category(c.slug)} onMouseEnter={() => setHover(i)}>`. The anchor is `group grid grid-cols-12 items-baseline border-b border-[var(--border-hairline)] py-7 transition-colors duration-500`. While another row is hovered it adds `text-[var(--text-linen)]`, dimming every non-hovered row.
  - Row columns:
    - 1 col: the numeral, `font-spec text-[10px] text-[var(--gold-vermeil)]`.
    - 5 cols: the name, `font-serif-editorial text-6xl font-light leading-none tracking-[-0.02em] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4`.
    - 3 cols: the French name, `font-serif-editorial text-xl italic text-[var(--text-linen)]`.
    - 2 cols: "{n} pieces", `font-spec text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]`.
    - 1 col: `ArrowUpRight` (size 20, stroke 1.2), which on hover moves up and right and turns vermeil.
- **State and effects:** `hover: number | null`. A mount-only `useEffect` creates `gsap.quickTo(preview, 'x' | 'y', { duration: 0.8, ease: 'power3.out' })` and a `pointermove` listener on the `<ul>` that feeds `clientX − rect.left` and `clientY − rect.top`; cleanup removes the listener. A second `useEffect` with deps `[hover]` runs `gsap.to(preview, { autoAlpha: hover === null ? 0 : 1, scale: hover === null ? 0.85 : 1, duration: 0.6, ease: 'expo.out' })`.
- **Mobile and tablet (`< lg`):** `grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:hidden`. Each card is `<a href=… className="group block" data-reveal={(i % 3) * 0.06}>` with an `aspect-[3/4] overflow-hidden bg-[var(--bg-silk)]` box holding `c.hero` (`alt={c.name}`, `loading="lazy"`, `editorial-zoom`). The caption is the numeral (`font-spec text-[10px] text-[var(--gold-vermeil)]`) plus the name (`font-serif-editorial text-2xl`), with no French name and no count.
- **A11y:** hover state is pointer-only (no focus handlers). Both layouts are always in the DOM and toggled with CSS `hidden`.

### 4.4 Treasured (`src/components/home/Treasured.tsx`)

- **Purpose:** a tabbed merchandising grid of badge-tagged products.
- **Data:** `TABS = [{ id: 'Bestseller', label: 'Bestsellers' }, { id: 'New', label: 'New arrivals' }, { id: 'Atelier Exclusive', label: 'Atelier exclusives' }] as const`. State is `tab: (typeof TABS)[number]['id']`, default `'Bestseller'`. `items = PRODUCTS.filter((p) => p.badges?.includes(tab)).slice(0, 6)` is computed on each render, not memoised, and keeps catalog order.

| Tab | Matches | Rendered (max 6) — name · collection · price CAD / USD |
|---|---|---|
| Bestsellers | 7 | Mont-Royal Solitaire Pendant · Mont-Royal · $6,850 / $5,000; Vieux-Port Diamond Studs · Vieux-Port · $8,900 / $6,495; Westmount Tennis Bracelet · Westmount · $14,500 / $10,585; The Teresa Signet · Heritage · $3,200 / $2,335; Notre-Dame Oval Solitaire · Notre-Dame · $18,900 / $13,795; Bridal Tiara & Drops Set · Rental Vault · From $480 / $350 (rental weekend rate). Initial Disc Pendant is the 7th match and is cut off. |
| New arrivals | 4 | Plateau Paperclip Chain · Plateau · $2,450 / $1,790; Outremont Pearl Drops · Outremont · $4,200 / $3,065; Griffintown Chain Bracelet · Griffintown · $1,650 / $1,205; Heritage Automatic 38 · Swiss Selection · $7,400 / $5,400 |
| Atelier exclusives | 3 | Rivière Saint-Laurent · Saint-Laurent · $38,500 / $28,105; Basilique Three-Stone · Basilique · $26,400 / $19,270; Gala Diamond Collar · Rental Vault · From $650 / $475 |

- **Header:** `SectionHeader` with `index="02"`, `eyebrow="The selection"` and title `Most <em vermeil>treasured</em>`. The `aside` is `<div role="tablist" className="flex gap-8">` holding three `<button role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>`.
  - Button classes: `relative pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors`, plus `text-[var(--text-linen)] hover:text-[var(--text-espresso)]` when inactive.
  - Underline: `<span className="absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] scale-x-100|scale-x-0">`.
- **Grid:** `<div key={tab} className="grid animate-[fadeUp_0.9s_cubic-bezier(0.16,1,0.3,1)] gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">`. It has 1, 2 or 3 columns, and `key={tab}` remounts it so the CSS `fadeUp` keyframe (`src/index.css`: opacity 0 → 1, translateY 16 px → 0) replays on every tab change. Cards are `<ProductCard key={p.id} product={p} />` with no `index`, so each has `data-reveal="0"`.
- **Footer link:** `<a href={href.category('necklaces')} className="link-line">Explore all collections</a>`, centred with `mt-20`. It targets `#/c/necklaces`.
- **Section:** `mx-auto max-w-[1600px] px-6 pb-32 lg:px-12 lg:pb-44`, with no top padding (CategoryIndex's bottom padding provides the gap).
- **A11y:** `role="tablist"`/`role="tab"`/`aria-selected` only. There is no `tabpanel` role, no `aria-controls` and no arrow-key handling.

#### ProductCard as used on Home (`src/components/ProductCard.tsx`)

Treasured, GiftFinder and RecentlyViewed all use it. Its full behaviour is documented in [category.md](./category.md). The parts that matter on Home:

- **Signature and root:** `ProductCard({ product, index = 0 }: { product: Product; index?: number })`. The root is `<a href={href.product(product.slug)} className="group block" data-reveal={(index % 3) * 0.08}>`.
- **Image box:** `relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]`.
  - The primary image is `images[0]` with `alt={product.name}`, `loading="lazy"` and `editorial-zoom`. If `images[1]` exists it cross-fades in on hover (`opacity-0 transition-opacity duration-700 group-hover:opacity-100`, `alt=""`).
  - `WishButton` sits at `absolute right-3 top-3`. It is 36 px and round, has `aria-pressed`, and its `aria-label` switches between "Save to wishlist" and "Remove from wishlist". On click it calls `preventDefault` and `stopPropagation`, then plays a gsap `elastic.out(1, 0.4)` pop.
  - `TryOnButton variant="chip" label="Try on"` sits at `absolute bottom-3 left-3`. On hover-capable devices it is hidden until hover (`[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 …group-hover:…`); on touch devices it is always visible. It renders nothing for products `tryOnKind` rejects (gift card, Heirloom Redesign).
  - A badge (`product.badges[0]`) sits at `absolute left-4 top-4` with `bg-[var(--bg-travertine)]/90`, spec face, 10 px, uppercase.
- **Meta row** (stacked on phones, side by side from `sm`): `collection` (spec face, 10 px, uppercase, `tracking-[0.24em]`, linen), name `<h3 className="font-serif-editorial mt-1.5 text-xl leading-tight sm:text-2xl">`, and the price (`shrink-0 text-sm sm:pt-5 sm:text-right`). Rentals (`category === 'rentals' && product.rental`) show "From" plus `rental.weekend[currency]`; everything else shows `priceFor(product, currency)`.
- **Price formatting:** `<Price>` (`src/components/Price.tsx`) renders `formatPrice(amount, currency)` (`Intl.NumberFormat`, `en-CA` for CAD or `en-US` for USD, 0 decimals) followed by the currency code in `text-[0.75em] text-[var(--text-linen)]`, for example "$6,850 CAD".

### 4.5 TryOnFeature (`src/components/home/TryOnFeature.tsx`)

- **Purpose:** promote the in-browser virtual try-on and launch it with a curated list.
- **Data:** `wearable = PRODUCTS.filter((p) => tryOnKind(p))` gives 25 products; only "Teresa & Sons Gift Card" and "Heirloom Redesign" are excluded. `start = wearable.find((p) => p.slug === 'vieux-port-diamond-studs') ?? wearable[0]`, which is Vieux-Port Diamond Studs today. Both are recomputed on every render.
- **Layout:** `<section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">` with an inner `mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36`. Below `lg` the copy stacks above the image. At `lg` the copy is `lg:col-span-5` and the image column is `lg:col-span-6 lg:col-start-7`.
- **Copy column** (reveal delays 0 / 0.05 / 0.1 / 0.15 / 0.2):
  - Eyebrow `font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]` with a `—` index span (`mr-4 text-white/45`).
  - H2 using the display recipe with `lg:text-[5rem]`.
  - Body `mt-8 max-w-md leading-relaxed text-white/65`.
  - `<ul className="mt-10 space-y-3 text-sm text-white/75">` with three items, each led by a lucide icon (`Camera`, `Sparkles`, `ShieldCheck`; size 16, stroke 1.3, champagne). The middle item interpolates `{wearable.length}`, rendering "25 pieces, switch metals instantly".
  - CTA: `{start && <TryOnButton product={start} list={wearable} variant="solid" label="Start virtual try-on" />}`. This is a `<button type="button">` with a `ScanFace` icon. Clicking calls `openTryOn({ product: start, list: wearable })`; `TryOnProvider` then lazy-loads `TryOnStudio` (a separate chunk) inside `Suspense` with a `null` fallback. See [virtual-try-on.md](../features/virtual-try-on.md).
- **Image column:** `<div data-reveal-img className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden">` containing `<img data-parallax src={IMG.earrings3} alt="Virtual try-on preview" loading="lazy">`. Decorative overlays:
  - a viewfinder of four 32 px corner brackets (`h-8 w-8 border-[var(--gold-champagne)]` with two borders each) inside `pointer-events-none absolute inset-6`;
  - a "Live" badge at `absolute left-8 top-8` with a pulsing red dot (`h-1.5 w-1.5 animate-pulse rounded-full bg-red-500`);
  - a chip at `absolute bottom-8 right-8 bg-black/40 px-3 py-1.5 … backdrop-blur` reading "18k Yellow · Vieux-Port".

### 4.6 Bridal editorial (inline in `src/pages/Home.tsx`)

- **Purpose:** the bridal chapter feature, presenting GIA certification and links to bridal and to custom design.
- **Layout:** `<section className="bg-[var(--bg-silk)]">` with an inner `mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-32 lg:grid-cols-12 lg:px-12 lg:py-44`.
- **Image column (`relative lg:col-span-6`):**
  - Main: `<div data-reveal-img className="relative aspect-[4/5] overflow-hidden">` containing `<img data-parallax src={IMG.bridal1} alt="Notre-Dame oval solitaire" loading="lazy">`.
  - Overlap (lg only): `<div data-reveal-img className="absolute -bottom-10 -right-6 hidden aspect-square w-[38%] overflow-hidden border-[10px] border-[var(--bg-silk)] lg:block">` containing `IMG.bridal2` (`alt=""`, no parallax). It overlaps the main image's bottom-right corner with a 10 px border in the section's own silk colour.
- **Copy column (`lg:col-span-5 lg:col-start-8`)**, with reveals 0 / 0.05 / 0.1 / 0.15 / 0.2:
  - Eyebrow `font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]` with a vermeil "03".
  - H2 using the display recipe at `lg:text-[5.25rem]`.
  - Body `mt-8 max-w-md leading-relaxed text-[var(--text-taupe)]`.
  - Spec list `<dl className="font-spec mt-12 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">` built from `SPECS`. Each cell is `py-6 text-center`, with `dt` `text-[9px] uppercase tracking-[0.26em] text-[var(--text-linen)]` and `dd` `mt-2 text-sm`.
  - CTA row `mt-12 flex flex-wrap items-center gap-10`: the dark solid button "Explore bridal" (`#/c/bridal`) and a `link-line` "Design your own" (`#/atelier`).
- **Responsive:** single column below `lg`, images first. The overlap image appears only at `lg`.

### 4.7 FourCs (`src/components/home/FourCs.tsx`)

- **Purpose:** an interactive explainer of the 4 Cs with the house standard highlighted on each grading scale.
- **Data:** `CS`, an array of 4 entries of the form `{ key, title, body, scale: string[], ours: [from, to] }`. The highlighted span is the scale indices `ours[0]`..`ours[1]` inclusive.

| Tab | `title` | `scale` (low → high, left → right) | `ours` | Highlighted | Bar `left` / `right` |
|---|---|---|---|---|---|
| 01 Cut | Cut — the fire | Poor, Fair, Good, Very Good, Excellent | [3, 4] | Very Good – Excellent | 75% / 0% |
| 02 Color | Color — the purity | K, J, I, H, G, F, E, D | [4, 7] | G – D | 57.14% / 0% |
| 03 Clarity | Clarity — the character | I1, SI2, SI1, VS2, VS1, VVS2, VVS1, IF | [3, 7] | VS2 – IF | 42.86% / 0% |
| 04 Carat | Carat — the presence | 0.30, 0.50, 0.75, 1.00, 1.50, 2.00, 3.00+ | [0, 6] | entire scale | 0% / 0% |

The bar positions are computed as `left = ours[0] / (scale.length − 1) × 100%` and `right = 100 − ours[1] / (scale.length − 1) × 100%`. The tab bodies are listed verbatim in the Copy deck.

- **State:** `active` (default 0). `c = CS[active]`.
- **Layout:** `<section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">` with an inner `mx-auto grid max-w-[1600px] gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36`.
  - **Left (`lg:col-span-5`):** an eyebrow ("04" in `text-white/45` plus "Diamond Education" in champagne); an H2 at `lg:text-[4.75rem]`; then a `data-reveal="0.1"` (fade-up, not image-wipe) `relative mt-12 aspect-square overflow-hidden` box. The box holds `IMG.ring1` (`alt="Diamond under loupe"`, `opacity-80`) overlaid with the active key in `font-serif-editorial text-[9rem] font-light italic text-white/90 mix-blend-overlay`, centred.
  - **Right (`lg:col-span-6 lg:col-start-7 lg:pt-24`):**
    - `<div role="tablist" className="grid grid-cols-4 border-b border-white/15">` holding 4 `<button role="tab" aria-selected={active === i} onClick={() => setActive(i)}>`. Button classes: `-mb-px border-b py-5 text-left transition-colors`; active adds `border-[var(--gold-champagne)] text-white`, inactive adds `border-transparent text-white/40 hover:text-white/70`. Each button shows `0{i+1}` (spec face, 10 px, champagne) over the key (`font-serif-editorial mt-1 block text-2xl lg:text-3xl`).
    - The panel `<div key={c.key} className="pt-12">` remounts on each tab change and has no animation class. It contains `<h3 className="font-serif-editorial text-4xl">`, a body `mt-5 max-w-lg leading-relaxed text-white/70`, then the scale:
      - labels `font-spec flex justify-between text-[10px] uppercase tracking-[0.12em] text-white/50`, with in-range labels in champagne;
      - a track `relative mt-3 h-1 bg-white/10` holding `<span className="absolute inset-y-0 bg-[var(--gold-champagne)] transition-all duration-700">` with inline `left`/`right`;
      - a legend: an 8 px champagne square and "Teresa & Sons standard".
    - CTA row `mt-14 flex flex-wrap gap-6`: the gold solid "Shop certified diamonds" (`#/c/bridal`) and the underline "Book a diamond viewing" (`#/atelier`).
- **A11y:** tab roles and `aria-selected` only. There is no `tabpanel`, no `aria-controls` and no arrow keys.

### 4.8 ShoppableVideos (`src/components/video/ShoppableVideos.tsx`)

- **Home call:** `<ShoppableVideos videos={VIDEOS} eyebrow="Watch & shop" title={<>Seen in <em className="text-[var(--gold-vermeil)]">motion</em></>} />`. The passed `eyebrow` and `title` equal the component defaults. `index` defaults to `'—'`, `tone` to `'light'` and `className` to `''`.
- **Props:**

```ts
interface Props {
  videos: ShoppableVideo[]
  index?: string
  eyebrow?: string
  title?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}
```

- **Behaviour:**
  - Returns `null` when `videos.length === 0`.
  - State `open: number | null`; ref `rail`. `scroll(d)` calls `rail.scrollBy({ left: d * rail.clientWidth * 0.8, behavior: 'smooth' })`.
  - With `tone` light the section gets no background class. The header container is `mx-auto max-w-[1600px] px-6 pt-28 lg:px-12 lg:pt-36` with a `SectionHeader`.
  - The `aside` renders only when `videos.length > 3`, which is true on Home (10 videos). It holds two round 44 px buttons (`h-11 w-11 rounded-full border`, light-tone border `border-[var(--border-hairline)] hover:border-[var(--text-espresso)]`) with `aria-label="Scroll films left"` / `"Scroll films right"` and `ChevronLeft`/`ChevronRight` icons.
- **Rail:** `flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-28 [scrollbar-width:none] lg:-mt-20 lg:gap-4 lg:px-12 lg:pb-36 [&::-webkit-scrollbar]:hidden` plus the attribute `data-lenis-prevent-wheel`, so Lenis smooth scrolling does not hijack wheel input inside the rail. `lg:-mt-20` offsets SectionHeader's `lg:mb-20`.
- **Tile (`Tile`):** `<button onClick={onOpen} data-reveal={(index % 4) * 0.06} className="group relative aspect-[9/16] w-[62vw] shrink-0 snap-start overflow-hidden bg-[var(--bg-vault)] text-left sm:w-[38vw] lg:w-[19vw] lg:min-w-[240px]">`. Inside:
  - `<video src={video.preview} poster={video.poster} muted loop playsInline preload="none" className="editorial-zoom …">`. `useInViewPlay` plays it while ≥ 60 % visible and pauses it otherwise (IntersectionObserver thresholds `[0, 0.6, 1]`). This is disabled under reduced motion.
  - A gradient `bg-gradient-to-t from-black/75 via-transparent to-black/25`.
  - The handle at top-left (spec face, 10 px, uppercase).
  - A round 32 px play badge at top-right that turns white on hover.
  - The title (`font-serif-editorial text-xl leading-tight text-white`).
  - A first-product chip (`bg-[var(--bg-travertine)]/95 …`) with a thumbnail (`alt=""`), the truncated name, a `<Price>` (rental weekend rate when `first.rental`, otherwise `priceFor`), and `+{rest.length}` when there are more products.
- **Viewer:** clicking a tile sets `open = k` and portals `<VideoViewer videos={videos} start={open} onClose={() => setOpen(null)} />` into `document.body`. The viewer is a full-screen `role="dialog" aria-modal="true"` player. Esc closes it, the arrow keys move between films, Space toggles play, and a vertical swipe over 60 px also moves. It stops Lenis and locks `html` overflow. See [shoppable-video-and-atelier.md](../features/shoppable-video-and-atelier.md).
- **Data:** `VIDEOS` in `src/data/media.ts`, built with `v(n, title, caption, handle, products)`:
  - `id = 'v{n}'`
  - `src = https://assets.mixkit.co/videos/{n}/{n}-720.mp4`
  - `preview = …-360.mp4`
  - `poster = https://assets.mixkit.co/videos/{n}/{n}-thumb-360-0.jpg`

  The clips are Mixkit stock placeholders. All 14 referenced slugs resolve.

| `id` | `title` (on tile) | `caption` (viewer only) | `handle` | `products` | Tile chip: first product · CAD / USD · extra |
|---|---|---|---|---|---|
| v5220 | The oval, up close | How a 1.82 ct oval catches morning light. | @teresaandsons | notre-dame-oval-solitaire, promesse-wedding-band | Notre-Dame Oval Solitaire · $18,900 / $13,795 · +1 |
| v47476 | Getting ready | A bride fastens her Westmount line before the ceremony. | @claire.weds | westmount-tennis-bracelet, vieux-port-diamond-studs | Westmount Tennis Bracelet · $14,500 / $10,585 · +1 |
| v24656 | The reveal | Every proposal deserves this moment. | @teresaandsons | basilique-emerald-cut-three-stone, notre-dame-oval-solitaire | Basilique Three-Stone · $26,400 / $19,270 · +1 |
| v34213 | Dressing the vitrine | Behind the glass on rue Sherbrooke. | @teresaandsons | riviere-saint-laurent, mont-royal-solitaire-pendant, plateau-paperclip-chain | Rivière Saint-Laurent · $38,500 / $28,105 · +2 |
| v34611 | Stacked, not stuffy | Tennis lines and curb links, worn together. | @mtl.style | westmount-tennis-bracelet, griffintown-chain-bracelet | Westmount Tennis Bracelet · $14,500 / $10,585 · +1 |
| v47288 | Forty facets later | Our setter checks each stone under the loupe. | @teresaandsons | mont-royal-solitaire-pendant, vieux-port-diamond-studs | Mont-Royal Solitaire Pendant · $6,850 / $5,000 · +1 |
| v50782 | Evening, adorned | Emerald and pearl for a gala in Old Montreal. | @priya.s | sherbrooke-emerald-cocktail, outremont-pearl-drops | Sherbrooke Emerald Cocktail Ring · $21,800 / $15,915 · +1 |
| v51649 | Yes, in Montréal | A campfire proposal on Mont-Royal. | @danielk | notre-dame-oval-solitaire | Notre-Dame Oval Solitaire · $18,900 / $13,795 · none |
| v5181 | Promises, boxed | Matched bands, ready for the day. | @teresaandsons | promesse-wedding-band, laurier-stacking-band | Promesse Wedding Band · $1,450 / $1,060 · +1 |
| v2861 | Recycled gold | Every ingot we cast is reclaimed and refined. | @teresaandsons | teresa-signet, atwater-cuff | The Teresa Signet · $3,200 / $2,335 · +1 |

### 4.9 GiftFinder (`src/components/home/GiftFinder.tsx`)

- **Purpose:** a two-question gift selector (budget × occasion) with live product results.
- **Inputs:**

```ts
const BUDGETS = [
  { id: 'u1', label: 'Under $1,000', test: (n: number) => n < 1000 },
  { id: '1-5', label: '$1,000 – $5,000', test: (n: number) => n >= 1000 && n < 5000 },
  { id: '5-15', label: '$5,000 – $15,000', test: (n: number) => n >= 5000 && n < 15000 },
  { id: '15', label: '$15,000 +', test: (n: number) => n >= 15000 },
]
const OCCASIONS: { id: string; label: string; match: (p: Product) => boolean }[] = [
  { id: 'all', label: 'Any occasion', match: () => true },
  { id: 'love', label: 'Anniversary', match: (p) => ['bridal', 'necklaces', 'earrings'].includes(p.category) },
  { id: 'self', label: 'For myself', match: (p) => ['rings', 'bracelets', 'earrings'].includes(p.category) },
  { id: 'him', label: 'For him', match: (p) => ['watches', 'rings'].includes(p.category) || p.engravable === true },
  { id: 'milestone', label: 'Milestone', match: (p) => p.engravable === true },
]
```

- **State:** `budget` (default `BUDGETS[1].id` = `'1-5'`) and `occasion` (default `'all'`). `currency` comes from the store.
- **Filter rule** (`useMemo`, deps `[budget, occasion, currency]`): `PRODUCTS.filter((p) => p.category !== 'rentals' && p.category !== 'custom' && o.match(p) && b.test(priceFor(p, currency))).slice(0, 4)`.
  - The pool is the 21 non-rental, non-custom products, including all three `gifts` items (the gift card is CAD 250 / USD 200).
  - `priceFor` is called without a metal, so the base price in the active currency is used. The budget thresholds are the same numbers in both currencies.
  - Results keep catalog order; at most 4 are shown.
- **Results matrix:**

| Occasion | Budget | CAD: matches → shown | USD: matches → shown |
|---|---|---|---|
| Any occasion | Under $1,000 | 3 → Initial Disc Pendant; Pearl Stud Gift Set; Teresa & Sons Gift Card | 4 → Laurier Stacking Band; Initial Disc Pendant; Pearl Stud Gift Set; Teresa & Sons Gift Card |
| Any occasion | $1,000 – $5,000 (default) | 7 → Plateau Paperclip Chain; Outremont Pearl Drops; Mile End Huggies; Griffintown Chain Bracelet | 7 → Plateau Paperclip Chain; Outremont Pearl Drops; Mile End Huggies; Atwater Cuff |
| Any occasion | $5,000 – $15,000 | 7 → Mont-Royal Solitaire Pendant; Vieux-Port Diamond Studs; Westmount Tennis Bracelet; Atwater Cuff | 7 → Mont-Royal Solitaire Pendant; Vieux-Port Diamond Studs; Westmount Tennis Bracelet; Notre-Dame Oval Solitaire |
| Any occasion | $15,000 + | 4 → Rivière Saint-Laurent; Sherbrooke Emerald Cocktail Ring; Notre-Dame Oval Solitaire; Basilique Three-Stone | 3 → Rivière Saint-Laurent; Sherbrooke Emerald Cocktail Ring; Basilique Three-Stone |
| Anniversary | Under $1,000 | **0 → empty state** | **0 → empty state** |
| Anniversary | $1,000 – $5,000 | 4 → Plateau Paperclip Chain; Outremont Pearl Drops; Mile End Huggies; Promesse Wedding Band | 4 → same as CAD |
| Anniversary | $5,000 – $15,000 | 2 → Mont-Royal Solitaire Pendant; Vieux-Port Diamond Studs | 3 → Mont-Royal Solitaire Pendant; Vieux-Port Diamond Studs; Notre-Dame Oval Solitaire |
| Anniversary | $15,000 + | 3 → Rivière Saint-Laurent; Notre-Dame Oval Solitaire; Basilique Three-Stone | 2 → Rivière Saint-Laurent; Basilique Three-Stone |
| For myself | Under $1,000 | **0 → empty state** | 1 → Laurier Stacking Band |
| For myself | $1,000 – $5,000 | 5 → Outremont Pearl Drops; Mile End Huggies; Griffintown Chain Bracelet; The Teresa Signet | 5 → Outremont Pearl Drops; Mile End Huggies; Atwater Cuff; Griffintown Chain Bracelet |
| For myself | $5,000 – $15,000 | 3 → Vieux-Port Diamond Studs; Westmount Tennis Bracelet; Atwater Cuff | 2 → Vieux-Port Diamond Studs; Westmount Tennis Bracelet |
| For myself | $15,000 + | 1 → Sherbrooke Emerald Cocktail Ring | 1 → same |
| For him | Under $1,000 | 1 → Initial Disc Pendant | 2 → Laurier Stacking Band; Initial Disc Pendant |
| For him | $1,000 – $5,000 | 5 → Plateau Paperclip Chain; Griffintown Chain Bracelet; The Teresa Signet; Laurier Stacking Band | 5 → Plateau Paperclip Chain; Atwater Cuff; Griffintown Chain Bracelet; The Teresa Signet |
| For him | $5,000 – $15,000 | 4 → Atwater Cuff; Heritage Automatic 38; Chronographe 1962; Dame du Lac | 4 → Notre-Dame Oval Solitaire; Heritage Automatic 38; Chronographe 1962; Dame du Lac |
| For him | $15,000 + | 3 → Sherbrooke Emerald Cocktail Ring; Notre-Dame Oval Solitaire; Basilique Three-Stone | 2 → Sherbrooke Emerald Cocktail Ring; Basilique Three-Stone |
| Milestone | Under $1,000 | 1 → Initial Disc Pendant | 1 → same |
| Milestone | $1,000 – $5,000 | 4 → Plateau Paperclip Chain; Griffintown Chain Bracelet; The Teresa Signet; Promesse Wedding Band | 5 → Plateau Paperclip Chain; Atwater Cuff; Griffintown Chain Bracelet; The Teresa Signet |
| Milestone | $5,000 – $15,000 | 2 → Atwater Cuff; Heritage Automatic 38 | 2 → Notre-Dame Oval Solitaire; Heritage Automatic 38 |
| Milestone | $15,000 + | 2 → Notre-Dame Oval Solitaire; Basilique Three-Stone | 1 → Basilique Three-Stone |

Several products change bucket with currency: Laurier Stacking Band (CAD 1,350 / USD 985), Atwater Cuff (CAD 5,600 / USD 4,090), Notre-Dame Oval Solitaire (CAD 18,900 / USD 13,795).

- **Layout:** section `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36`, grid `grid gap-12 lg:grid-cols-12`.
  - **Left column (`lg:col-span-4`):** carries a single `data-reveal` for the whole column. Contents in order:
    - eyebrow: a linen "05" plus vermeil "Le Trouveur de Cadeaux";
    - H2 at `lg:text-[4.75rem]`;
    - intro `mt-6 max-w-sm text-[var(--text-taupe)]`;
    - "Budget" label (`mt-10 text-[11px] uppercase tracking-[0.22em]`) with `({currency})` in the spec face, linen;
    - budget chips (`mt-3 flex flex-wrap gap-2`);
    - "Occasion" label;
    - occasion chips;
    - an "All gifts" link (`mt-10 inline-block border-b border-[var(--text-espresso)] pb-1 text-[11px] font-medium uppercase tracking-[0.26em] hover:text-[var(--gold-vermeil)]`) to `#/c/gifts`.
  - **Chip recipe** (`chip(on)`): `whitespace-nowrap border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors` plus either `border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]` (on) or `border-[var(--border-hairline)] hover:border-[var(--text-espresso)]` (off). Chips are plain `<button>`s with `onClick` setters and no `aria-pressed`.
  - **Right column (`lg:col-span-8`):** when there are results, `grid grid-cols-2 gap-x-6 gap-y-12` (two columns at every width) of `<ProductCard key={p.id} product={p} index={i} />`, giving reveal delays 0, 0.08, 0.16, 0. When empty, `flex h-full min-h-[400px] flex-col items-center justify-center bg-[var(--bg-silk)] p-10 text-center` containing:
    - "Nothing in this pairing — yet." (`font-serif-editorial text-3xl italic text-[var(--text-taupe)]`);
    - "Our concierge can source or commission something special." (`mt-3 text-sm text-[var(--text-linen)]`);
    - "Ask the concierge" (`#/atelier`, `border-b border-[var(--gold-vermeil)]`).
- **Gift card:** the gift card's ProductCard links to `#/p/gift-card`. `parseHash` maps that path to the `giftcards` route.

### 4.10 MakingScroll (`src/components/home/MakingScroll.tsx`)

- **Purpose:** a five-step "bench to heirloom" process story as a horizontal film strip.
- **Data:** `STEPS` (5 × `{ n, t, d, img }`).

| `n` | `t` (also the img `alt`) | `d` | `img` |
|---|---|---|---|
| 01 | The sketch | Every piece begins in graphite at Teresa’s original drafting table. | `IMG.ring2` |
| 02 | The stone | Hand-selected GIA diamonds and ethically sourced coloured gems. | `IMG.ring1` |
| 03 | The casting | Recycled 18k gold and platinum, alloyed and cast in Montreal. | `IMG.rings` |
| 04 | The setting | Each claw raised and tightened under the microscope by Marco. | `IMG.bridal1` |
| 05 | The polish | Twelve stages of hand-finishing, then hallmarked and boxed. | `IMG.necklace1` |

- **Pin mechanics** (`useLayoutEffect`, deps `[]`):

```ts
const mm = gsap.matchMedia()
mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
  const t = track.current!
  const distance = () => t.scrollWidth - window.innerWidth
  const tween = gsap.to(t, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: { trigger: root.current, start: 'top 112px', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
  })
  gsap.to('[data-making-progress]', { scaleX: 1, ease: 'none', scrollTrigger: tween.scrollTrigger ? { trigger: root.current, start: 'top 112px', end: () => `+=${distance()}`, scrub: true } : undefined })
})
return () => mm.revert()
```

  At ≥ 1024 px with motion allowed, the section pins when its top reaches 112 px (just under the sticky header). The track then translates left by `track.scrollWidth − window.innerWidth` while the user scrolls the same distance vertically, with `scrub: 1` (1 s smoothing). A second scrubbed tween fills the 192 px (`w-48`) progress line from `scale-x-0` to 1 over the same range. The `[data-making-progress]` selector is not scoped (`gsap.matchMedia()` has no scope argument). Otherwise (narrow screens or reduced motion) there is no pin.
- **Layout:**
  - **Section:** `relative overflow-hidden bg-[var(--bg-silk)] lg:h-[calc(100vh-7rem)]`.
  - **Header:** `mx-auto max-w-[1600px] px-6 pt-24 lg:absolute lg:inset-x-0 lg:top-0 lg:px-12 lg:pt-16`. Inside is `flex items-end justify-between gap-8` holding the H2 (`font-serif-editorial text-5xl font-light leading-none tracking-[-0.02em] lg:text-7xl`). The eyebrow `<span>` "06 · The making" (`font-spec mb-5 block text-[10px] font-normal uppercase tracking-[0.3em] text-[var(--gold-vermeil)]`) sits **inside** the H2. To its right (lg only) is the progress block: a hairline track holding `data-making-progress`, plus the caption "Five stages · 40+ hours".
  - **Track:** `flex gap-8 overflow-x-auto px-6 py-16 lg:h-full lg:items-end lg:overflow-visible lg:px-12 lg:pb-16 lg:pt-44`.
  - **Cards:** `<article className="group w-[78vw] shrink-0 sm:w-[46vw] lg:w-[30vw]">`; odd indices add `lg:mb-16`, staggering cards 02 and 04 upward. Each image box is `aspect-[4/5] overflow-hidden bg-[var(--bg-travertine)] lg:aspect-[5/6] lg:max-h-[48vh] lg:w-full` with a lazy `editorial-zoom` image. The caption row `mt-5 flex gap-5` holds the number (spec face, vermeil), an `<h3 className="font-serif-editorial text-3xl">` and `<p className="mt-2 max-w-xs text-sm text-[var(--text-taupe)]">`.
  - A trailing `hidden w-[10vw] shrink-0 lg:block` spacer ends the strip.
- **Responsive:** below `lg` the strip is a natively scrollable horizontal track (cards 78vw, or 46vw at `sm`). At `lg` it is the pinned scrub (cards 30vw).
- **No reveal attributes** are used in this component.

### 4.11 WatchSpotlight (`src/components/home/WatchSpotlight.tsx`)

- **Purpose:** the watches chapter, with a hero image and a list of every watch.
- **Data:** `watches = getProductsByCategory('watches')` in catalog order. Prices are `priceFor(w, currency)`.

| Row | Name → link | Spec line (`{specs.Case} · {specs.Movement}`) | Thumb (`images[0]`) | Price CAD / USD |
|---|---|---|---|---|
| 01 | Heritage Automatic 38 → `#/p/heritage-automatic-38` | 38 mm · Swiss automatic, 42 h reserve | `IMG.watch1` | $7,400 / $5,400 |
| 02 | Chronographe 1962 → `#/p/chronographe-1962` | 40 mm · Manual-wind chronograph | `IMG.watch2` | $12,900 / $9,415 |
| 03 | Dame du Lac → `#/p/dame-du-lac` | 30 mm · Swiss quartz | `IMG.watch3` | $9,600 / $7,010 |

- **Layout:** section `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36`, grid `grid gap-12 lg:grid-cols-12 lg:items-center`.
  - **Image (`group relative aspect-[4/5] overflow-hidden lg:col-span-5`):** `<img data-parallax src={IMG.watch2} alt="Chronographe 1962" loading="lazy">` with a hard-coded badge "Limited · 62 pieces" (`absolute bottom-5 left-5 bg-[var(--bg-travertine)] px-3 py-1.5`, spec face, 10 px, uppercase). It is not a link and has no `data-reveal-img`.
  - **Copy (`lg:col-span-6 lg:col-start-7`):** eyebrow (linen "07" plus vermeil "Chapter VI · Horlogerie"), H2 at `lg:text-[4.75rem]`, body `mt-6 max-w-md text-[var(--text-taupe)]`, then `<ul className="mt-12 border-t border-[var(--border-hairline)]">`.
  - **Rows:** `<li data-reveal={0.1 + i * 0.05}>` wrapping `<a className="group flex items-center gap-6 border-b border-[var(--border-hairline)] py-6">`. Each row has the index (spec face, vermeil), a `h-16 w-14` zoom thumbnail (`alt=""`), the name (`font-serif-editorial text-2xl … group-hover:text-[var(--gold-vermeil)] lg:text-3xl`), the spec line (spec face, 10 px, uppercase, taupe) and `<Price className="hidden text-sm sm:inline">`, which hides the price below 640 px.
- **Responsive:** the image stacks above the copy below `lg`.

### 4.12 Rentals banner (inline in `src/pages/Home.tsx`)

- **Purpose:** promote the rental vault.
- **Layout:** `<section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">`.
  - Background: `<div className="absolute inset-0 overflow-hidden opacity-35">` containing `<img data-parallax src={IMG.jewelryFlat} alt="" loading="lazy">`. Above it, a vignette `absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg-vault)_75%)]`.
  - Content: `relative mx-auto max-w-[1600px] px-6 py-40 text-center lg:px-12 lg:py-52`, with reveals 0 / 0.05 / 0.1 / 0.15 / 0.2:
    - champagne eyebrow "Chapter VII · La Location" (no numeric index);
    - H2 `font-serif-editorial mx-auto mt-8 max-w-5xl text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-7xl lg:text-[7.5rem]`;
    - body `mx-auto mt-10 max-w-lg leading-relaxed text-white/65`;
    - a period list `font-spec mx-auto mt-12 flex max-w-md justify-center divide-x divide-white/15 text-[10px] uppercase tracking-[0.22em] text-white/60` with three `px-6` spans;
    - the CTA `<a data-reveal="0.2" href={href.category('rentals')} className="mt-14 inline-block bg-[var(--gold-champagne)] px-10 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-vault)] transition-colors duration-500 hover:bg-[var(--bg-travertine)]">`.
- **Responsive:** one centred column; the type steps from 3rem to `sm` 7xl to `lg` 7.5rem.

### 4.13 Testimonials (`src/components/home/Testimonials.tsx`)

- **Data:** `QUOTES` (3 × `{ q, a, loc, piece }`). The full text is in the Copy deck.

| # | `a` | `loc` | `piece` |
|---|---|---|---|
| 1 | Camille R. | Outremont, QC | Heirloom Redesign |
| 2 | Daniel K. | Brooklyn, NY | Notre-Dame Oval Solitaire |
| 3 | Priya S. | Toronto, ON | Gala Diamond Collar |

- **State and rotation:** `i` (default 0). A mount-only `useEffect` sets `window.setInterval(() => setI((x) => (x + 1) % QUOTES.length), 6500)` and clears it on unmount. Clicking a dot calls `setI(k)` and does **not** reset the interval. Rotation is not paused on hover or focus and ignores reduced motion.
- **Layout:**
  - Section `border-y border-[var(--border-hairline)] bg-[var(--bg-travertine)]`; inner `mx-auto max-w-5xl px-6 py-28 text-center lg:py-36`.
  - Stars row (`data-reveal`, vermeil): five lucide `Star`s (size 14, stroke 1.2, `fill-current`) plus "4.9 / 5 · 1,200+ reviews" (spec face, 10 px, uppercase, taupe).
  - `<blockquote key={i} className="font-serif-editorial mt-10 animate-[fadeUp_1s_cubic-bezier(0.16,1,0.3,1)] text-3xl font-light leading-snug sm:text-4xl lg:text-5xl">` renders `“{q.q}”`. The key change remounts it and replays `fadeUp`.
  - Attribution `<p className="mt-10 text-[11px] uppercase tracking-[0.24em]">{q.a} <span className="text-[var(--text-linen)]">· {q.loc}</span></p>`.
  - Piece line (spec face, 10 px, uppercase, vermeil).
  - Dots: three `<button aria-label="Testimonial N">`, 1 px tall (`h-px`). Active is `w-12 bg-[var(--text-espresso)]`; inactive is `w-6 bg-[var(--border-hairline)]`; `transition-all duration-500`.
- **No links.**

### 4.14 Heritage quote (inline in `src/pages/Home.tsx`)

- **Purpose:** the founder story and a bespoke-commission prompt.
- **Layout:** the `<section>` itself is the grid: `mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-32 lg:grid-cols-12 lg:px-12 lg:py-44`.
  - **Images block** (first in DOM; at lg `lg:order-2 lg:col-span-6 lg:col-start-7`): `grid grid-cols-2 gap-5` with two `data-reveal-img` boxes `relative aspect-[3/4] overflow-hidden`. The first adds `mt-20` for a staggered offset. Images: `IMG.ring2` (`alt="Signet ring"`) and `IMG.rings` (`alt="Stacked rings"`), both `data-parallax`, `loading="lazy"`.
  - **Text block** (`lg:order-1 lg:col-span-5`), with reveals 0 / 0.05 / 0.08 / 0.1 / 0.15:
    - eyebrow (vermeil "08" plus linen "Chapter IX · Sur Mesure");
    - a decorative opening quote glyph `“` (`font-serif-editorial mt-6 block text-8xl leading-none text-[var(--gold-champagne)]`);
    - `<blockquote className="font-serif-editorial -mt-6 text-4xl font-light leading-[1.1] lg:text-[3.5rem]">`;
    - the attribution "Antonio Moretti · Second generation" (spec face, 10 px, uppercase, taupe);
    - a `link-line` "Commission a piece" to `#/atelier`.
- **Responsive:** images stack above the quote below `lg`. At `lg` the text sits left and the images right.

### 4.15 RecentlyViewed (`src/components/RecentlyViewed.tsx`)

- **Home call:** `<RecentlyViewed index="—" eyebrow="Welcome back" title={<>Continue <em className="text-[var(--gold-vermeil)]">where you left off</em></>} />`.
- **Defaults:** `exclude` undefined, `limit = 4`, `bordered = true`. The defaults that Home overrides are `eyebrow = 'Your journey'` and `title = Recently <em>viewed</em>`.
- **Selection:** `useRecentProducts(exclude, limit)` (memoised on `[recent, exclude, limit]`) runs `recent.filter((s) => s !== exclude).map(getProduct).filter((p): p is Product => !!p).slice(0, limit)` with `limit` 4, giving the most recently viewed first. Unknown slugs are dropped. The component **returns `null` when the list is empty**, which is what first-time visitors see.
- **Layout:** `mx-auto max-w-[1600px] px-6 py-28 lg:px-12 border-t border-[var(--border-hairline)]`. The `SectionHeader` aside is `<button onClick={clearRecent} className="link-line text-[var(--text-taupe)]">Clear history</button>`. Below it, `grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4` holds ProductCards with no `index`.
- **Same file:** also exports `RecentlyViewedStrip`, which is not used on Home.

### 4.16 Services (`src/components/home/Services.tsx`)

- **Data:** `items` is built on each render (6 × `{ icon, t, d }`). Only the first description depends on `currency`.

| Icon (lucide) | `t` | `d` |
|---|---|---|
| `Truck` | Insured shipping | CAD: "Complimentary across Canada, signature required." / USD: "Complimentary to the U.S., duties prepaid." |
| `ShieldCheck` | Lifetime warranty | Annual cleaning, claw checks and rhodium refresh. |
| `PenLine` | Free engraving | Hand or laser engraved, up to 18 characters. (The PDP engraving input in `src/pages/Product.tsx` uses `maxLength={18}`.) |
| `Ruler` | Complimentary sizing | One resize within the first year, on us. |
| `Gem` | GIA certified | Every diamond over 0.50 ct comes with its report. |
| `CalendarHeart` | Private appointments | In salon on Sherbrooke or by video, seven days. |

- **Layout:**
  - Section `mx-auto max-w-[1600px] px-6 py-24 lg:px-12`, with **no heading or eyebrow**.
  - Grid `grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-3`. The 1 px gaps let the hairline background show through as grid rules.
  - Cells: `group bg-[var(--bg-travertine)] p-10 transition-colors hover:bg-[var(--bg-silk)]` with `data-reveal={(i % 3) * 0.06}`. Each holds an icon (size 22, stroke 1.2, vermeil, lifting 4 px on hover), `<h3 className="font-serif-editorial mt-8 text-3xl">` and `<p className="mt-3 text-sm text-[var(--text-taupe)]">`.
  - A centred closing line `mt-8 text-center text-sm text-[var(--text-taupe)]`: "Questions? " followed by the link "Speak with our concierge" (`#/atelier`, `border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]`).
- **Columns:** 1 below 640 px, 2 at `sm`, 3 at `lg`.

### 4.17 SocialGrid (`src/components/home/SocialGrid.tsx`)

- **Data:** `TILES = [IMG.earrings3, IMG.bracelet2, IMG.rings, IMG.necklace1, IMG.bridal2, IMG.watch3]`.
- **Layout:** section `mx-auto max-w-[1600px] px-6 pb-28 lg:px-12 lg:pb-36` (no top padding).
  - `SectionHeader`: `index="09"`, `eyebrow="@teresaandsons"`, title `Worn in <em vermeil>Montréal</em>`, and an `aside` of `<span className="link-line">Follow #PorteTeresa</span>`, which is a span and not a link.
  - Grid `grid grid-cols-3 gap-2 lg:grid-cols-6`.
  - Each tile is `<a key={src} href="#/" onClick={(e) => e.preventDefault()} data-reveal={i * 0.04} className="group relative aspect-square overflow-hidden">`. It holds a lazy `editorial-zoom` image (`alt=""`) and a hover overlay (`bg-[var(--bg-vault)]/0` → `/40`, opacity 0 → 1, 500 ms) with `ArrowUpRight` (size 20).
- **Behaviour:** the tiles go nowhere because navigation is prevented.

### 4.18 VisitSalon (`src/components/home/VisitSalon.tsx`)

- **Purpose:** the closing salon invitation with contact details.
- **Layout:** `<section className="relative overflow-hidden border-b border-white/10 bg-[var(--bg-vault)] text-[var(--bg-travertine)]">` with `grid lg:grid-cols-2`.
  - **Image cell:** `relative min-h-[420px] overflow-hidden` containing `<img data-parallax src={IMG.jewelryFlat} alt="Teresa & Sons salon" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80">`.
  - **Text cell:** `px-6 py-24 lg:px-20 lg:py-32`, with reveals 0 / 0.05 / 0.1 / 0.15 / 0.2:
    - champagne eyebrow "Le Salon";
    - H2 `font-serif-editorial mt-5 text-5xl font-light leading-[1.02] lg:text-7xl`;
    - body `mt-6 max-w-md text-white/70`;
    - a details list `mt-12 space-y-5 text-sm` with `MapPin`, `Clock` and `Phone` icons (size 18, stroke 1.3, champagne). The phone number is wrapped in `font-spec`.
  - **CTAs:**
    - "Book an appointment" uses the gold solid recipe and links to `#/atelier`.
    - "Get directions" uses the underline recipe and links to `https://maps.google.com/?q=Rue+Sherbrooke+Ouest+Montreal` with `target="_blank" rel="noreferrer"`.
- **Responsive:** the image (min 420 px tall) stacks above the text below `lg`. At `lg` the two halves are equal.

---

## 5. `SectionHeader` (`src/components/home/SectionHeader.tsx`)

The shared editorial header: a numbered eyebrow on a hairline rule, a large serif title, and an optional right-hand slot.

```ts
interface Props {
  index: string
  eyebrow: string
  title: ReactNode
  aside?: ReactNode
  tone?: 'light' | 'dark'
}
```

- **Markup:** `<header className="mb-14 lg:mb-20">`, containing:
  - a row `<div data-reveal className="font-spec flex items-center gap-5 text-[10px] uppercase tracking-[0.3em] {muted}">` with `<span className={accent}>{index}</span>`, a flexible rule `<span className="h-px flex-1 {rule}">` and `<span>{eyebrow}</span>`;
  - `<div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">` with `<h2 data-reveal="0.05" className="font-serif-editorial max-w-3xl text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]">{title}</h2>` and, when `aside` is truthy, `<div data-reveal="0.1" className="shrink-0">{aside}</div>`. The aside sits below the title on small screens and bottom-aligned to the right at `lg`.
- **Tone mapping (default `'light'`):**

| Token | `light` | `dark` |
|---|---|---|
| `rule` | `bg-[var(--border-hairline)]` | `bg-white/15` |
| `accent` (index) | `text-[var(--gold-vermeil)]` | `text-[var(--gold-champagne)]` |
| `muted` (row text) | `text-[var(--text-linen)]` | `text-white/45` |

- `title` must supply its own `<em>` accent colour; `tone` does not change it.
- The `data-reveal*` attributes only animate inside a `useReveal` scope.

**Every usage in the codebase:**

| Call site | `index` | `eyebrow` | `title` | `aside` | `tone` |
|---|---|---|---|---|---|
| `src/components/home/CategoryIndex.tsx` (Home) | `"01"` | Nine chapters | The *Index* | taupe paragraph | light |
| `src/components/home/Treasured.tsx` (Home) | `"02"` | The selection | Most *treasured* | tablist | light |
| `src/components/video/ShoppableVideos.tsx`, Home instance | `"—"` (default) | Watch & shop | Seen in *motion* | scroll arrows (only if > 3 videos) | light (forwarded) |
| `src/components/RecentlyViewed.tsx`, Home instance | `"—"` | Welcome back | Continue *where you left off* | "Clear history" button | light |
| `src/components/home/SocialGrid.tsx` (Home) | `"09"` | @teresaandsons | Worn in *Montréal* | "Follow #PorteTeresa" span | light |
| `src/pages/Product.tsx` (related products) | `num('related')` | `` `Chapter ${category.eyebrow}` `` | Also in *{category.name}* | "View all" `link-line` | light |
| `src/pages/Product.tsx` → `ShoppableVideos` | `num('films')` | Watch & shop | See it in *motion* | arrows if > 3 | light |
| `src/pages/Product.tsx` → `RecentlyViewed` | `num('recent')` | default "Your journey" | default Recently *viewed* | "Clear history" | light |
| `src/pages/Category.tsx` → `ShoppableVideos` | default `"—"` | `` `${category.name} · in motion` `` | Worn & *filmed* | arrows if > 3 | light (`className="border-t …"`) |
| `src/pages/Category.tsx` → `RecentlyViewed` | default `"—"` | default "Your journey" | default | "Clear history" | light |
| `src/pages/Atelier.tsx` → `ShoppableVideos` | default `"—"` | Inside the atelier | At the *bench* (champagne em) | arrows if > 3 | **dark**, the only dark usage |
| `src/pages/GiftCards.tsx` | `"—"` | Questions | Gift card *details* | — | light |
| `src/components/pdp/CompleteTheLook.tsx` | `index` prop | Styled for the evening (rental) / Styled by the atelier | Complete the *ensemble* / Complete the *look* | — | light |
| `src/components/pdp/PriceBreakdown.tsx` | `index` prop | Transparent pricing | The price, *itemised* | taupe paragraph (rental vs purchase copy) | light |
| `src/components/pdp/Reviews.tsx` | `index` prop | Verified clients | In their *words* | "Write a review" button | light |
| `src/components/pdp/ProductFAQ.tsx` | `index` prop | Questions | Before you *decide* | — | light |

---

## 6. Links and routes leaving the Home page

| Section | Element | Target |
|---|---|---|
| HomeHero | slide CTAs | `#/c/necklaces`, `#/c/bridal`, `#/c/rentals` |
| CategoryIndex | rows and cards | `#/c/{slug}` for all 9 categories |
| Treasured, GiftFinder, RecentlyViewed | ProductCards | `#/p/{slug}` (`#/p/gift-card` resolves to the gift-cards route) |
| Treasured | "Explore all collections" | `#/c/necklaces` |
| TryOnFeature | "Start virtual try-on" | no navigation; opens the `TryOnStudio` overlay |
| Bridal | "Explore bridal" / "Design your own" | `#/c/bridal` / `#/atelier` |
| FourCs | "Shop certified diamonds" / "Book a diamond viewing" | `#/c/bridal` / `#/atelier` |
| ShoppableVideos | tiles | no navigation; open `VideoViewer` (its product links go to `#/p/{slug}`) |
| GiftFinder | "All gifts" / empty-state "Ask the concierge" | `#/c/gifts` / `#/atelier` |
| WatchSpotlight | 3 rows | `#/p/heritage-automatic-38`, `#/p/chronographe-1962`, `#/p/dame-du-lac` |
| Rentals | "View the rental vault" | `#/c/rentals` |
| Heritage | "Commission a piece" | `#/atelier` |
| Services | "Speak with our concierge" | `#/atelier` |
| SocialGrid | 6 tiles | `href="#/"` with `preventDefault` (inert) |
| VisitSalon | "Book an appointment" / "Get directions" | `#/atelier` / `https://maps.google.com/?q=Rue+Sherbrooke+Ouest+Montreal` (new tab) |

---

## 7. Imagery map (`IMG` keys rendered by Home sections)

All `IMG` entries are Unsplash URLs built as `https://images.unsplash.com/{id}?auto=format&fit=crop&w=1600&q=80`. Section code references most keys directly. CategoryIndex images come from `CATEGORIES[].hero` and WatchSpotlight thumbnails from each watch's `images[0]`. Product cards add each product's `images[]`, and video tiles use Mixkit posters.

| `IMG` key | Where it appears on Home |
|---|---|
| `necklace2` | Hero slide 0 background |
| `earrings1` | Hero slide 0 inset; CategoryIndex "Earrings" |
| `bridal1` | Hero slide 1 background; CategoryIndex "Bridal Jewelry"; Bridal main image; MakingScroll step 04 |
| `bridal2` | Hero slide 1 inset; Bridal overlap image; SocialGrid tile 5 |
| `jewelryFlat` | Hero slide 2 background; CategoryIndex "Jewelry Rentals"; Rentals background; VisitSalon |
| `necklace1` | Hero slide 2 inset; CategoryIndex "Necklaces"; MakingScroll step 05; SocialGrid tile 4 |
| `earrings3` | TryOnFeature; SocialGrid tile 1 |
| `ring1` | FourCs; CategoryIndex "Rings"; MakingScroll step 02 |
| `ring2` | Heritage (Signet ring); CategoryIndex "Personalized & Custom"; MakingScroll step 01 |
| `rings` | Heritage (Stacked rings); MakingScroll step 03; SocialGrid tile 3 |
| `watch1` | CategoryIndex "Watches"; WatchSpotlight row 01 thumb |
| `watch2` | WatchSpotlight hero image; WatchSpotlight row 02 thumb |
| `watch3` | SocialGrid tile 6; WatchSpotlight row 03 thumb |
| `bracelet1` | CategoryIndex "Bracelets" |
| `bracelet2` | SocialGrid tile 2 |
| `gift1` | CategoryIndex "Gifts" |

`gift2` and `earrings2` are not referenced by Home section code. They can still appear through product images: `IMG.earrings2` is Outremont Pearl Drops' first image (Treasured "New arrivals" and GiftFinder results), and `IMG.gift2` is Pearl Stud Gift Set's (GiftFinder results).

---

## 8. Copy deck

Strings are listed verbatim from source in render order. A ✓ in **UC** means CSS `uppercase` is applied, so the rendered text is all-caps while the source is not. `*italic*` marks text inside `<em>` (accent-coloured italic) or, in the hero, the italic accent span. Every string is static unless marked *(data)*.

### 8.1 HomeHero (all three slides are in the DOM; only the active one is visible)

| Element | Text | UC |
|---|---|---|
| Vertical side label (lg) | Joailliers · Montréal · Est. 1962 | ✓ |
| Slide 0 eyebrow | Collection Lumière · Automne | ✓ |
| Slide 0 line-0 prefix (sm+) | (01) | |
| Slide 0 H1 line 1 | Light, set | |
| Slide 0 H1 line 2 | *by hand,* | |
| Slide 0 H1 line 3 | since 1962. | |
| Slide 0 body | Three generations of Montreal jewellers crafting GIA-certified diamonds and solid gold heirlooms on rue Sherbrooke. | |
| Slide 0 CTA | Discover necklaces | ✓ |
| Slide 0 spec | Piece · Weight · Grade → Rivière Saint-Laurent · 12.40 ct · F–G / VS (the `·` and `→` here are only list separators in this doc) | ✓ |
| Slide 0 inset caption | Vieux-Port Studs | ✓ |
| Slide 1 eyebrow | Chapitre V · Mariage | ✓ |
| Slide 1 prefix (sm+) | (02) | |
| Slide 1 H1 lines | A promise, / *certified* / to the facet. (the `/` separates the three line spans) | |
| Slide 1 body | Engagement rings with GIA-graded centre stones, hand-set in platinum by our master setter. | |
| Slide 1 CTA | Explore bridal | ✓ |
| Slide 1 spec values | Notre-Dame Oval / 1.82 ct / E / VS1 (Grade is "E / VS1") | ✓ |
| Slide 1 inset caption | Basilique Three-Stone | ✓ |
| Slide 2 eyebrow | Chapitre VII · La Location | ✓ |
| Slide 2 prefix (sm+) | (03) | |
| Slide 2 H1 lines | Borrow the / *vault* / for a night. | |
| Slide 2 body | High jewelry for galas and premieres, insured and couriered across Canada and the United States. | |
| Slide 2 CTA | View rentals | ✓ |
| Slide 2 spec values | Gala Collar / 18.20 ct / From weekend | ✓ |
| Slide 2 inset caption | Gala Diamond Collar | ✓ |
| Spec labels (`dt`) | Piece; Weight; Grade | ✓ |
| Inset counter, controls counter | 01 / 02 / 03 (current); 03 (total) | |
| Slide buttons | Automne; Mariage; La Location | ✓ |
| Slide button aria-labels | Show slide 1; Show slide 2; Show slide 3 | |
| Scroll hint (sm+) | Scroll | ✓ |
| Image alts | all `""` | |

### 8.2 PressStrip

| Element | Text | UC |
|---|---|---|
| Section aria-label | As featured in | |
| Label | As seen in | ✓ |
| Names (rendered twice for the loop) | Vogue; ELLE Québec; The Globe and Mail; Harper’s Bazaar; La Presse; Town & Country; Montreal Gazette; Brides | |

### 8.3 CategoryIndex

| Element | Text | UC |
|---|---|---|
| Index · eyebrow | 01 · Nine chapters | ✓ |
| H2 | The *Index* | |
| Aside | From everyday gold to GIA-certified bridal — each collection made or curated in Montreal. | |
| Rows (lg): numeral, name, French, count *(data)* | I Necklaces Colliers 3 pieces; II Earrings Boucles d'oreilles 3 pieces; III Bracelets Bracelets 3 pieces; IV Rings Bagues 3 pieces; V Bridal Jewelry Mariage 3 pieces; VI Watches Montres 3 pieces; VII Jewelry Rentals Location 3 pieces; VIII Gifts Cadeaux 3 pieces; IX Personalized & Custom Sur mesure 3 pieces | count ✓ |
| Mobile cards: numeral + name *(data)*; image alt = name | e.g. "I Necklaces", alt "Necklaces" | |
| Desktop preview image alts | all `""` | |

### 8.4 Treasured

| Element | Text | UC |
|---|---|---|
| Index · eyebrow | 02 · The selection | ✓ |
| H2 | Most *treasured* | |
| Tabs | Bestsellers; New arrivals; Atelier exclusives | ✓ |
| Cards *(data)* | badge (e.g. Bestseller), collection, name, price "$6,850 CAD"; rentals show "From" + weekend price; chip "Try on"; wish aria-label "Save to wishlist" / "Remove from wishlist"; image alt = product name. See 4.4 for the lists. | badge, collection, From, Try on ✓ |
| Link | Explore all collections | ✓ |

### 8.5 TryOnFeature

| Element | Text | UC |
|---|---|---|
| Eyebrow | — Essayage virtuel (index span "—") | ✓ |
| H2 | See it *on you*, before it’s yours. | |
| Body | Open your camera and place earrings, necklaces, rings, bracelets and watches on yourself — in every metal. Save a photo to share, or bring it to your appointment. | |
| List 1 | Live camera or an uploaded photo | |
| List 2 *(data)* | 25 pieces, switch metals instantly | |
| List 3 | Private — nothing leaves your device | |
| Button | Start virtual try-on | ✓ |
| Image alt | Virtual try-on preview | |
| Overlay badge | Live | ✓ |
| Overlay chip | 18k Yellow · Vieux-Port | ✓ |

### 8.6 Bridal editorial

| Element | Text | UC |
|---|---|---|
| Eyebrow | 03 Chapter V · Mariage | ✓ |
| H2 | A promise, *certified* to the last facet. | |
| Body | Every centre stone arrives with its GIA grading report and is hand-set in platinum or 18k gold by our master setter. | |
| Spec `dt` → `dd` | Cut → Excellent; Color → D – G; Clarity → IF – VS2 | `dt` ✓ |
| CTA 1 | Explore bridal | ✓ |
| CTA 2 | Design your own | ✓ (`link-line`) |
| Main image alt | Notre-Dame oval solitaire | |
| Overlap image alt | `""` | |

### 8.7 FourCs

| Element | Text | UC |
|---|---|---|
| Eyebrow | 04 Diamond Education | ✓ |
| H2 | The *Four Cs*, explained by a jeweller. | |
| Image alt | Diamond under loupe | |
| Image overlay | active key: Cut / Color / Clarity / Carat | |
| Tabs | 01 Cut; 02 Color; 03 Clarity; 04 Carat | |
| Cut title / body | Cut — the fire / Cut determines how a diamond returns light. We only set stones graded Excellent or Very Good by the GIA, then hand-check each for symmetry. | |
| Color title / body | Color — the purity / Graded from D (colourless) to Z. Our bridal collection begins at G, where a diamond appears icy-white to the eye. | |
| Clarity title / body | Clarity — the character / Inclusions are nature’s fingerprints. We select VS2 or better, so nothing is visible without a 10× loupe. | |
| Carat title / body | Carat — the presence / Weight, not size. A well-cut 1.00 ct can look larger than a poorly cut 1.20 ct — which is why we prioritise cut first. | |
| Scale labels | see the table in 4.7 | ✓ |
| Legend | Teresa & Sons standard | ✓ |
| CTA 1 | Shop certified diamonds | ✓ |
| CTA 2 | Book a diamond viewing | ✓ |

### 8.8 ShoppableVideos

| Element | Text | UC |
|---|---|---|
| Index · eyebrow | — · Watch & shop | ✓ |
| H2 | Seen in *motion* | |
| Arrow aria-labels | Scroll films left; Scroll films right | |
| Tile handle / title / chip *(data)* | see the table in 4.8 (e.g. "@teresaandsons", "The oval, up close", "Notre-Dame Oval Solitaire", "$18,900 CAD", "+1") | handle ✓ |

### 8.9 GiftFinder

| Element | Text | UC |
|---|---|---|
| Eyebrow | 05 Le Trouveur de Cadeaux | ✓ |
| H2 | Find the *perfect* gift. | |
| Intro | Choose a budget and an occasion. Every gift arrives in our travertine box with a handwritten card. | |
| Budget label | Budget (CAD) — or (USD) *(data)* | ✓ |
| Budget chips | Under $1,000; $1,000 – $5,000; $5,000 – $15,000; $15,000 + | ✓ |
| Occasion label | Occasion | ✓ |
| Occasion chips | Any occasion; Anniversary; For myself; For him; Milestone | ✓ |
| Link | All gifts | ✓ |
| Empty state | Nothing in this pairing — yet. / Our concierge can source or commission something special. / Ask the concierge | last ✓ |
| Result cards *(data)* | ProductCard strings (see 4.9) | |

### 8.10 MakingScroll

| Element | Text | UC |
|---|---|---|
| Eyebrow (inside the H2) | 06 · The making | ✓ |
| H2 | From *bench* to heirloom | |
| Progress caption (lg) | Five stages · 40+ hours | ✓ |
| Steps (number, H3, body; the image alt equals the H3) | 01 The sketch: Every piece begins in graphite at Teresa’s original drafting table. / 02 The stone: Hand-selected GIA diamonds and ethically sourced coloured gems. / 03 The casting: Recycled 18k gold and platinum, alloyed and cast in Montreal. / 04 The setting: Each claw raised and tightened under the microscope by Marco. / 05 The polish: Twelve stages of hand-finishing, then hallmarked and boxed. | |

### 8.11 WatchSpotlight

| Element | Text | UC |
|---|---|---|
| Image alt | Chronographe 1962 | |
| Image badge | Limited · 62 pieces | ✓ |
| Eyebrow | 07 Chapter VI · Horlogerie | ✓ |
| H2 | Time, *kept* beautifully. | |
| Body | Swiss timepieces regulated by our in-house horologist, with complimentary case-back engraving and a five-year service plan. | |
| Rows *(data)* | 01 Heritage Automatic 38: 38 mm · Swiss automatic, 42 h reserve; 02 Chronographe 1962: 40 mm · Manual-wind chronograph; 03 Dame du Lac: 30 mm · Swiss quartz; plus prices (sm+) | spec line ✓ |

### 8.12 Rentals banner

| Element | Text | UC |
|---|---|---|
| Eyebrow | Chapter VII · La Location | ✓ |
| H2 | Borrow the *vault* for an evening. | |
| Body | High jewelry for galas, premieres and weddings — insured, couriered, and collected the morning after. | |
| Periods | Weekend; One week; One month | ✓ |
| CTA | View the rental vault | ✓ |
| Background alt | `""` | |

### 8.13 Testimonials

| Element | Text | UC |
|---|---|---|
| Rating | 4.9 / 5 · 1,200+ reviews | ✓ |
| Quote 1 | “They found my grandmother’s sapphire a new home in a ring I’ll pass on to my daughter. Every visit felt like family.” | |
| Attribution 1 / piece | Camille R. · Outremont, QC / Heirloom Redesign | ✓ |
| Quote 2 | “I proposed in Paris with a Notre-Dame oval. The GIA report, the fitting, the courier to New York — flawless.” | |
| Attribution 2 / piece | Daniel K. · Brooklyn, NY / Notre-Dame Oval Solitaire | ✓ |
| Quote 3 | “Rented the Gala Collar for the Met fundraiser. Delivered to my hotel, collected the next morning. Unforgettable.” | |
| Attribution 3 / piece | Priya S. · Toronto, ON / Gala Diamond Collar | ✓ |
| Dot aria-labels | Testimonial 1; Testimonial 2; Testimonial 3 | |

### 8.14 Heritage quote

| Element | Text | UC |
|---|---|---|
| Eyebrow | 08 Chapter IX · Sur Mesure | ✓ |
| Quote glyph | “ | |
| Blockquote | Teresa believed a jewel should *outlive* its maker. | |
| Attribution | Antonio Moretti · Second generation | ✓ |
| Link | Commission a piece | ✓ |
| Image alts | Signet ring; Stacked rings | |

### 8.15 RecentlyViewed (only when history exists)

| Element | Text | UC |
|---|---|---|
| Index · eyebrow | — · Welcome back | ✓ |
| H2 | Continue *where you left off* | |
| Aside button | Clear history | ✓ |
| Cards *(data)* | ProductCard strings | |

### 8.16 Services

| Element | Text | UC |
|---|---|---|
| Card titles and bodies | see the table in 4.16 (the shipping body switches with currency) | |
| Closing line | Questions? Speak with our concierge (the latter is the link) | |

### 8.17 SocialGrid

| Element | Text | UC |
|---|---|---|
| Index · eyebrow | 09 · @teresaandsons | ✓ |
| H2 | Worn in *Montréal* | |
| Aside | Follow #PorteTeresa | ✓ |
| Tile image alts | all `""` (tiles have no text) | |

### 8.18 VisitSalon

| Element | Text | UC |
|---|---|---|
| Image alt | Teresa & Sons salon | |
| Eyebrow | Le Salon | ✓ |
| H2 | Come *sit* with us. | |
| Body | An espresso, a velvet tray, and as much time as you need. Appointments recommended, walk-ins always welcome. | |
| Address | 1420 rue Sherbrooke Ouest, Montréal, QC H3G 1K4 | |
| Hours | Tuesday – Saturday, 10h – 18h · Sunday by appointment | |
| Phone | +1 514 555 0162 | |
| CTA 1 | Book an appointment | ✓ |
| CTA 2 | Get directions | ✓ |

Typographic characters in this copy: the apostrophe is ’ (U+2019) in "it’s", "Teresa’s", "Harper’s", "nature’s", "grandmother’s" and "I’ll", but the data string "Boucles d'oreilles" uses a straight '. Quotes are “ ” (U+201C/U+201D). The em dash — (U+2014) appears in "— yet.", "Cut — the fire", the "—" index labels and similar. The en dash – (U+2013) appears in "D – G", "IF – VS2", the budget ranges, "Tuesday – Saturday, 10h – 18h" and "F–G / VS". Also used: × (U+00D7) in "10×", the middle dot · (U+00B7), and é/è.

---

## Notes & gotchas

**Behaviour and motion**

- **Suspected hero transition glitch (inferred from code, not observed).** In `HomeHero`, inline `zIndex`/`clipPath` come from React state (`index`), which only flips at `linesOut` (0.8 s) inside `go()`. Until then the incoming background and inset animate *underneath* the outgoing ones (z-index 1 vs 2), so the first 0.7 s of the wipe is invisible. At the flip, React rewrites both layers' `clip-path`: the outgoing layer becomes fully clipped while GSAP is still mid-tween on the incoming one (about 50 % of the background wipe, about 16 % of the inset reveal). Expect a cut to a partly revealed image over the vault colour, possibly with a one-frame flash. Check this in a browser before restyling. Driving `zIndex` from GSAP at t = 0 would avoid it.
- **Reduced motion is only partly honoured.**
  - HomeHero Effect 2 (headline reveal plus the 7 s progress fill) and manual `go()` wipes ignore `prefers-reduced-motion`. With autoplay off, the progress bar still fills and then sits full.
  - `Testimonials` auto-rotates every 6.5 s regardless of the preference.
  - Tailwind `animate-bounce` (hero Scroll arrow), `animate-pulse` (TryOnFeature "Live" dot) and the arbitrary `animate-[fadeUp_…]` (Treasured grid, Testimonials quote) are not covered: `src/index.css` disables only `.film-grain` and `.animate-marquee`.
- **MakingScroll with reduced motion on desktop.** At ≥ 1024 px with `prefers-reduced-motion: reduce`, the `gsap.matchMedia` branch does not run, but the track keeps `lg:overflow-visible` inside an `overflow-hidden` section. Cards beyond the viewport width (roughly from the third or fourth card on) are clipped and cannot be reached.
- **`useReveal` runs once.** Home passes no `deps`. Content mounted later (the Treasured grid after a tab switch, GiftFinder cards for a new filter) gets no GSAP reveal. Any `data-reveal` added to dynamic content does nothing.
- **Autoplay never pauses.** The hero timer (7 s) and the testimonial interval (6.5 s) keep running off-screen and in hidden tabs, with no pause control (WCAG 2.2.2 concern). A testimonial dot click does not reset the interval, so the next auto-advance can come almost immediately.
- **FourCs bar transition never runs.** The scale bar's `transition-all duration-700` has no effect because the panel `<div key={c.key}>` remounts on every tab change. The bar jumps.

**Header-height coupling**

- 7rem / 112 px appears in three places: `HomeHero` `h-[calc(100svh-7rem)]`, `MakingScroll` `lg:h-[calc(100vh-7rem)]`, and both MakingScroll ScrollTriggers `start: 'top 112px'`. All three must change together with the Header height. Note the hero uses `svh` while MakingScroll uses `vh`.

**Accessibility**

- **Hero:**
  - The DOM holds three `<h1>`s. The inactive slides are `aria-hidden` but their CTA links stay keyboard-focusable (`pointer-events-none` and `opacity-0` do not remove them from the tab order).
  - Slide buttons expose "Show slide N" instead of their visible labels ("Automne"…), a WCAG 2.5.3 label-in-name mismatch, and have no selected state.
  - The `(0n)` prefix is read as part of the H1 at `sm+`.
- **Tabs:** Treasured and FourCs tablists have no `tabpanel`, no `aria-controls` and no arrow-key support. GiftFinder chips have no `aria-pressed`.
- **SocialGrid:** tiles are `<a href="#/">` with `preventDefault` and no accessible name (`alt=""` plus an icon), so screen readers announce unnamed dead links. "Follow #PorteTeresa" looks like a link but is a span.
- **PressStrip:** the visible label is "As seen in" but the landmark label is "As featured in". The doubled list is not `aria-hidden`, so every name is read twice.
- **Testimonials:** the dots are 1 px tall hit targets and the rotating quote has no `aria-live`.
- **Headings:** `MakingScroll` puts its eyebrow inside the `<h2>`, so the heading name starts "06 · The making". `Services` has `<h3>`s but no section heading.
- **CategoryIndex:**
  - The preview `<div>` is a direct child of `<ul>`, which is invalid HTML.
  - The hover preview is pointer-only.
- **ProductCard / video tiles:**
  - ProductCard nests `<button>`s (wishlist, try-on) inside an `<a>`, which is invalid interactive nesting. It is handled with `preventDefault`/`stopPropagation`.
  - Video tiles are `<button>`s containing `<div>`s and a `<video>`, with no explicit `aria-label`.
- **VisitSalon:** the phone number is not a `tel:` link.

**Content and data consistency**

- Treasured's "Explore all collections" goes to `#/c/necklaces` only.
- The hero mixes French "Chapitre V · Mariage" / "Chapitre VII · La Location" with the inline sections' English "Chapter V · Mariage" / "Chapter VII · La Location". Section index numbers ("01"–"09") and "Chapter" numerals are hard-coded per component.
- Hero slide 2's inset (`IMG.necklace1`) is labelled "Gala Diamond Collar", but that product's images are `IMG.necklace2`/`IMG.jewelryFlat`; `necklace1` is the Mont-Royal pendant's primary image.
- Hero `spec` values, the WatchSpotlight "Limited · 62 pieces" badge and the "Nine chapters" eyebrow are literals duplicating catalog facts.
- The Bridal `SPECS` lists Cut "Excellent", while FourCs says stones are "Excellent or Very Good" and highlights Very Good–Excellent.
- **GiftFinder:**
  - Budget thresholds are the same raw numbers in both currencies, so results change with currency (see the 4.9 matrix).
  - "For him" matches *any* engravable product (for example Initial Disc Pendant and Notre-Dame Oval Solitaire).
  - The empty state appears for Anniversary + Under $1,000 (both currencies) and For myself + Under $1,000 (CAD).
  - The gift card can appear as a result.
- **Treasured:** "Bestsellers" has 7 matches but shows 6, dropping Initial Disc Pendant, and includes a rental (Bridal Tiara & Drops Set, "From $480 CAD").
- **Reused imagery:** `IMG.jewelryFlat` is the hero slide 2 background, the CategoryIndex rentals image, the Rentals background and the VisitSalon "salon" photo.
- **VisitSalon:** the Google Maps query omits the street number "1420".
- **Home ShoppableVideos call:** it passes `eyebrow` and `title` identical to the component defaults.

**Performance**

- All `IMG` URLs request `w=1600`, including the 56 × 64 px WatchSpotlight thumbnails and small tiles.
- The 3 hero backgrounds, 3 hero insets (even below `lg`, where the figure is hidden) and the 9 CategoryIndex preview images have no `loading="lazy"`.
- The hero keeps animating and swapping slides while off-screen.

**Implementation details worth knowing**

- HomeHero's pointer `quickTo` setters are created outside its `gsap.context`, so `ctx.revert()` does not revert them; only the listener is removed.
- `reduced` in HomeHero is read during render and is not subscribed to `matchMedia` changes.
- MakingScroll's `[data-making-progress]` selector is document-global, so a second instance would be driven by the first.

---

## Related docs

- [Product overview, sitemap & user journeys](../product-overview.md)
- [Architecture & runtime model](../architecture.md)
- [Figma Make platform, toolchain & build](../platform-and-tooling.md)
- [Design system — tokens, typography, color, layout & component recipes](../design-system.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [Brand, voice & copywriting](../brand-voice-and-copy.md)
- [Data layer — catalog, media, gift cards, costing & tax](../data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](../commerce-logic.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [Category (collection) page & product card](./category.md)
- [Product detail page (PDP) — orchestration & purchase flow](./product.md)
- [PDP modules](../components/pdp-modules.md)
- [Cart drawer, cart page & checkout](./cart-and-checkout.md)
- [Virtual try-on](../features/virtual-try-on.md)
- [Shoppable video & the Atelier page](../features/shoppable-video-and-atelier.md)
- [Gift cards — purchase builder & balance checker](./gift-cards.md)
- [Account & wishlist pages](./account-and-wishlist.md)
- [Global chrome & shared components](../components/global-and-shared.md)
- [Code conventions](../code-conventions.md)
- [UX patterns, responsive behaviour & accessibility](../ux-patterns-and-accessibility.md)
- [Known issues, risks & tech debt](../known-issues.md)
- [File index](../INDEX.md)
