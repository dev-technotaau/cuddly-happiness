# Category (collection) page & product card

The category page (`#/c/:slug`) is the storefront's collection template. It shows a full-bleed editorial hero for one of the nine "chapters" in `CATEGORIES`, an extra band on Gifts and on Rentals, a toolbar with the piece count, a collection-wide try-on link and a sort control, and a responsive grid of `ProductCard`s. Shoppable films and the visitor's recently viewed pieces follow the grid. There is **no filtering**: the only control is a three-option price sort held in local component state. `ProductCard` (with its `WishButton` and `Price` children) is the shared product tile, and five other surfaces reuse it, so a change to the card shows up across the site.

Scope: `src/pages/Category.tsx`, `src/components/ProductCard.tsx`, `src/components/WishButton.tsx`, `src/components/Price.tsx`, `src/components/RecentlyViewed.tsx`, and the parts of `src/data/catalog.ts` and `src/store.tsx` they use. Supporting behaviour was read from `src/App.tsx`, `src/components/useReveal.ts`, `src/components/SmoothScroll.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/tryon/TryOnProvider.tsx`, `src/components/video/ShoppableVideos.tsx`, `src/data/media.ts`, `src/components/giftcard/GiftCardArt.tsx`, `src/components/home/SectionHeader.tsx` and `src/index.css`. Derived values in the tables below (USD prices, sort orders, try-on eligibility, film counts) were computed by evaluating `src/data/catalog.ts` on 2026-10-15.

---

## 1. Route, props and mounting

| Item | Value |
| --- | --- |
| URL | `#/c/<slug>`, built with `href.category(slug)`, which returns `` `#/c/${slug}` `` (`src/store.tsx`) |
| Parse rule | `parseHash()` in `src/store.tsx`: `parts[0] === 'c' && parts[1]` gives `{ name: 'category', slug: parts[1] }`. Extra segments are ignored (`#/c/rings/x` opens `rings`). `#/c` or `#/c/` with no slug falls through to `home`. |
| Mount | `Routes` in `src/App.tsx` renders `<Category key={route.slug} slug={route.slug} />`. Because the page is keyed by slug, moving between categories remounts it completely, which resets `sort`. |
| Props | `{ slug: string }`. `Category` is the default export and takes no other props. |
| Valid slugs | The nine `CategorySlug` values: `necklaces`, `earrings`, `bracelets`, `rings`, `bridal`, `watches`, `rentals`, `gifts`, `custom`. |
| Scroll on entry | `SmoothScroll` (`src/components/SmoothScroll.tsx`) runs on every `route` change. It calls `lenis.scrollTo(0, { immediate: true })`, or `window.scrollTo(0, 0)` when Lenis is off, then calls `ScrollTrigger.refresh()` on the next animation frame. |

**Hook order in `Category`.** Every hook runs before the not-found early return, so the order is stable:

1. `useRef<HTMLDivElement>(null)` creates `root`.
2. `useStore()` supplies `currency`.
3. `useState<Sort>('featured')`.
4. `getCategory(slug)` (a plain function call, not a hook).
5. `useMemo` computes `products`.
6. `useReveal(root, [slug, sort])`.

**Unknown slug.** `getCategory` is `CATEGORIES.find((c) => c.slug === slug)`, an exact and case-sensitive match, so `#/c/Rings` is not found. When it returns `undefined`, the page renders only the not-found block (§11). `products` is still computed and comes out as `[]`. `useReveal` does nothing because `root` is never attached in that branch.

---

## 2. Page anatomy

Sections from top to bottom. All of them sit inside `<div ref={root}>`, which is the scope `useReveal` animates.

| # | Section | Rendered when |
| --- | --- | --- |
| 1 | Hero | always |
| 2 | Gift-card band | `slug === 'gifts'` |
| 3 | Rental steps band | `slug === 'rentals'` |
| 3a | `GiftFinder` (`inChapter`: no "All gifts" link; moved from Home 2026-10-21) | `slug === 'gifts'` |
| 3b | `WatchSpotlight` (`inChapter`: the story without the watches list the grid shows; moved from Home 2026-10-21) | `slug === 'watches'` |
| 4 | Toolbar + product grid | always |
| 5 | `ShoppableVideos` ("Worn & filmed") | `videosForCategory(...)` returns at least one film; the component returns `null` for an empty list |
| 6 | `RecentlyViewed` | the visitor has at least one recently viewed product; the component returns `null` otherwise |

Wireframe at ≥1024 px. The global `Header` (sticky, `top-0 z-50`) sits above it and the `Footer` below; both come from `src/App.tsx`.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HERO  h-[62vh] min-h-[460px] bg-vault · img(category.hero) 60% +     │
│       parallax · gradient vault/90 (bottom) → transparent (top)      │
│                                                                      │
│   MAISON / CHAPTER IV                  spec 10px, champagne          │
│   Rings  Bagues                        serif 9rem light · em 4xl     │
│   Signets, cocktail rings and …        max-w-lg, white/75            │
├──────────────────────────────────────────────────────────────────────┤
│ [gifts only]  ┌ card art ┐ CARTE-CADEAU                              │
│               │  -3° ↺   │ Not sure what to choose? Give the choice. │
│               └──────────┘ Digital or mailed · …   SEND A GIFT CARD  │
│ [rentals only] 01 Reserve…  02 Fitting…  03 Insured…  04 Collected…  │
├──────────────────────────────────────────────────────────────────────┤
│ 3 PIECES · PRICES IN CAD   TRY THIS COLLECTION ON   SORT [Featured▾] │
│ ──────────────────────────────────────────────────────────────────── │
│ ┌────────────┐   ┌────────────┐   ┌────────────┐                     │
│ │ProductCard │   │ProductCard │   │ProductCard │   3 cols at lg      │
│ └────────────┘   └────────────┘   └────────────┘                     │
├──────────────────────────── border-t ────────────────────────────────┤
│ — ─────────────────────────────────────────── RINGS · IN MOTION      │
│ Worn & filmed                                (‹ › only if > 3 films) │
│ [9:16][9:16][9:16] → horizontal snap rail                            │
├──────────────────────────── border-t ────────────────────────────────┤
│ — ───────────────────────────────────────────────── YOUR JOURNEY     │
│ Recently viewed                                      CLEAR HISTORY   │
│ [card][card][card][card]                             4 cols at lg    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Hero

| Element | Classes and attributes | Content |
| --- | --- | --- |
| `<section>` | `relative h-[62vh] min-h-[460px] overflow-hidden bg-[var(--bg-vault)]` | |
| `<img>` | `key={category.hero}`, `data-parallax`, `src={category.hero}`, `alt={category.name}`, class `absolute inset-0 h-full w-full object-cover opacity-60`. No `loading` attribute, so it loads eagerly. | hero photo |
| Overlay `<div>` | `absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)]/90 to-transparent` | |
| Content column | `relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-14 text-[var(--bg-travertine)] lg:px-12` | Content sits at the bottom of the hero |
| Breadcrumb / eyebrow `<p>` | `font-spec text-[10px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]` | `<a href={href.home} className="hover:text-white">Maison</a> / Chapter {category.eyebrow}` |
| `<h1>` | `font-serif-editorial mt-5 text-7xl font-light leading-none lg:text-[9rem]` | `{category.name}` followed by `<em className="ml-4 align-top text-2xl text-[var(--gold-champagne)] lg:text-4xl">{category.french}</em>` |
| Description `<p>` | `mt-6 max-w-lg text-white/75` | `{category.description}` |

The `eyebrow` field holds a Roman numeral string, `I` through `IX`. `Category.feature` is **not used** on this page; only the Header mega menu uses it. The hero image comes from `IMG` in `src/data/catalog.ts`, which builds Unsplash URLs with `img(id, w = 1600)`: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`.

Per-category data, verbatim from `CATEGORIES`:

| Slug | `name` (h1) | `french` (em) | `eyebrow` | `description` | `hero` | Extra band | Films |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `necklaces` | Necklaces | Colliers | I | Pendants, rivières and chains drawn in 18k gold, worn close to the heart. | `IMG.necklace1` | none | 2 |
| `earrings` | Earrings | Boucles d'oreilles | II | Studs, drops and huggies that catch the light of the Saint-Laurent. | `IMG.earrings1` | none | 3 |
| `bracelets` | Bracelets | Bracelets | III | Tennis lines, cuffs and bangles, built to be stacked and inherited. | `IMG.bracelet1` | none | 3 |
| `rings` | Rings | Bagues | IV | Signets, cocktail rings and everyday bands, hand-finished in our atelier. | `IMG.ring1` | none | 3 |
| `bridal` | Bridal Jewelry | Mariage | V | GIA-certified engagement rings and wedding bands for a lifetime of vows. | `IMG.bridal1` | none | 4 |
| `watches` | Watches | Montres | VI | A curated selection of Swiss timepieces, serviced by our horologist. | `IMG.watch1` | none | 0 |
| `rentals` | Jewelry Rentals | Location | VII | High jewelry for galas, weddings and premieres — insured, delivered, returned. | `IMG.jewelryFlat` | rental steps | 0 |
| `gifts` | Gifts | Cadeaux | VIII | Thoughtful pieces, wrapped in our signature travertine box. | `IMG.gift1` | gift card | 0 |
| `custom` | Personalized & Custom | Sur mesure | IX | From sketch to setting — bespoke commissions and engraved heirlooms. | `IMG.ring2` | none | 0 |

`Boucles d'oreilles` uses an ASCII apostrophe in the source.

---

## 4. Category-specific bands

Both bands use the same section shell, `border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]`, and sit between the hero and the products section.

### Gifts (`slug === 'gifts'`)

- The whole band is one link: `<a href={href.giftcards}>` (`#/gift-cards`), class `group mx-auto grid max-w-[1600px] items-center gap-8 px-6 py-12 sm:grid-cols-[200px_1fr_auto] lg:px-12`.
- **Column 1: card art.** A `w-48 -rotate-3 transition-transform duration-700 group-hover:rotate-0` wrapper holds `<GiftCardArt design="travertine" currency={currency} amount={250} />`. The art shows `formatPrice(250, currency)` and the currency code, for example "$250 CAD". The amount is not converted, so in USD it reads "$250 USD".
- **Column 2: text.**
  - Eyebrow `Carte-cadeau`: `font-spec text-[10px] uppercase tracking-[0.28em] text-[var(--gold-vermeil)]`.
  - Headline `Not sure what to choose? Give the <em>choice</em>.`: `font-serif-editorial mt-2 text-4xl font-light`, with the em in `text-[var(--gold-vermeil)]`.
  - Subline `Digital or mailed · scheduled delivery · never expires`: `mt-2 text-sm text-[var(--text-taupe)]`.
- **Column 3: CTA.** `<span className="link-line">Send a gift card</span>`.

### Rentals (`slug === 'rentals'`)

- `<ol className="mx-auto grid max-w-[1600px] gap-8 px-6 py-12 sm:grid-cols-4 lg:px-12">`, built by mapping a literal array of four strings.
- Each `<li key={s} data-reveal={i * 0.06} className="flex items-baseline gap-4">` contains:
  - a number `0{i + 1}` (`01`–`04`) in `font-spec text-[10px] text-[var(--gold-vermeil)]`
  - the step text in `font-serif-editorial text-xl`.
- Steps: `Reserve online or in salon`, `Fitting & ID verification`, `Insured courier delivery`, `Collected the next morning`.

---

## 5. Toolbar: count, collection try-on and sort

The toolbar row uses `mb-12 flex items-center justify-between border-b border-[var(--border-hairline)] pb-5`. It sits inside the products `<section className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">`.

### Filters

There are **none**: no metal, price-range, badge or availability filters, and no filter state of any kind. The only control is the sort `<select>`.

### Sort

```tsx
type Sort = 'featured' | 'low' | 'high'
const [sort, setSort] = useState<Sort>('featured')
const products = useMemo(() => {
  const list = [...getProductsByCategory(slug as CategorySlug)]
  if (sort === 'low') list.sort((a, b) => priceFor(a, currency) - priceFor(b, currency))
  if (sort === 'high') list.sort((a, b) => priceFor(b, currency) - priceFor(a, currency))
  return list
}, [slug, sort, currency])
```

| `<option value>` | Label | Algorithm |
| --- | --- | --- |
| `featured` (default) | `Featured` | Catalog order. `getProductsByCategory` is `PRODUCTS.filter((pr) => pr.category === slug)`, which keeps declaration order. |
| `low` | `Price, low to high` | Ascending by `priceFor(product, currency)`, the **base** `product.price[currency]` with no metal argument and therefore no metal delta. |
| `high` | `Price, high to low` | The same comparator, descending. |

- **Control markup.** `<label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">Sort<select …/></label>`. The select is nested in the label, so its accessible name is "Sort". The select class is `cursor-pointer bg-transparent outline-none` and the native arrow is kept. `onChange` does `setSort(e.target.value as Sort)`.
- **What triggers a re-sort.** The memo depends on `currency`, so switching currency in the Header re-sorts by the new currency's prices. `Array.prototype.sort` is stable, so tied prices would keep featured order. The current data has no ties within any category.
- **Rentals.** The comparator uses the purchase price (`price`), not the weekend rate shown on rental cards. See Notes.

Current sort results. High-to-low is the exact reverse of low-to-high, and the order is the same in CAD and USD.

| Category | Low → high |
| --- | --- |
| necklaces | Plateau Paperclip Chain → Mont-Royal Solitaire Pendant → Rivière Saint-Laurent |
| earrings | Mile End Huggies → Outremont Pearl Drops → Vieux-Port Diamond Studs |
| bracelets | Griffintown Chain Bracelet → Atwater Cuff → Westmount Tennis Bracelet |
| rings | Laurier Stacking Band → The Teresa Signet → Sherbrooke Emerald Cocktail Ring |
| bridal | Promesse Wedding Band → Notre-Dame Oval Solitaire → Basilique Three-Stone |
| watches | Heritage Automatic 38 → Dame du Lac → Chronographe 1962 |
| rentals | Chandelier Sapphire Earrings → Bridal Tiara & Drops Set → Gala Diamond Collar |
| gifts | Teresa & Sons Gift Card → Pearl Stud Gift Set → Initial Disc Pendant |
| custom | Engraved Nameplate Necklace → Heirloom Redesign → Bespoke Engagement Commission |

### Result count

The left `<span>` uses `font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]` and renders `{products.length} pieces · Prices in {currency}`. Every category currently has 3 products, so it always reads "3 pieces · Prices in CAD" or "… USD". The count does not handle a singular. It also never changes with sort, because nothing filters the list.

### "Try these pieces on"

An inline IIFE computes `wearable = products.filter((p) => tryOnKind(p))` on every render, from the already sorted list. When `wearable[0]` exists it renders:

`<TryOnButton product={wearable[0]} list={wearable} variant="link" label="Try these pieces on" className="hidden sm:inline-flex" />`

- **Look.** The `link` variant renders a `<button type="button">` with class `link-line` and no icon.
- **Click.** It calls `e.preventDefault()` and `e.stopPropagation()`, then `openTryOn({ product, metal, text, list })` from `TryOnProvider`. That lazy-loads `TryOnStudio`, whose "try another" rail is this category's wearable list in the current sort order.
- **Starting piece.** It is the first try-on-eligible product in the current order, so it changes with sort. In gifts, the gift card is excluded (`tryOnKind` returns `null` for names matching `/gift card|redesign/`). In custom, Heirloom Redesign is excluded.
- **When it appears.** Every category currently has at least one wearable product, so the link always renders. The `hidden` class is meant to hide it below 640 px; see Notes for why that probably does not work.
- **Placement.** The link and the sort label sit together in `<div className="flex items-center gap-8">`.

### Persistence and reset

- `sort` is local `useState`. It is not written to the URL/hash or to `localStorage`.
- There is no reset control.
- `sort` goes back to `'featured'` whenever the page remounts: moving to another category (keyed remount) or leaving and coming back.

---

## 6. Product grid

- **Container:** `<div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">`. That gives 1 column below 640 px, 2 columns from 640 px (`sm`) and 3 from 1024 px (`lg`). Column gap is 2 rem and row gap is 4 rem. `src/index.css` has no `@theme`, so Tailwind's default breakpoints apply.
- **Items:** `{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}`. The order is the sorted `products` order. When the sort changes, React moves the existing card nodes, because cards are keyed by product id.
- **No interleaved editorial tiles.** The grid holds only product cards. The Gifts and Rentals bands sit above the products section, not inside the grid.

Card roster in featured order. These are the values each card actually renders:

| Category | Product (`collection`) | Badge shown | Hover image | "Try on" chip | Card price CAD | Card price USD |
| --- | --- | --- | --- | --- | --- | --- |
| necklaces | Mont-Royal Solitaire Pendant (Mont-Royal) | Bestseller | yes | yes | $6,850 | $5,000 |
| | Rivière Saint-Laurent (Saint-Laurent) | Atelier Exclusive | yes | yes | $38,500 | $28,105 |
| | Plateau Paperclip Chain (Plateau) | New | no | yes | $2,450 | $1,790 |
| earrings | Vieux-Port Diamond Studs (Vieux-Port) | Bestseller | yes | yes | $8,900 | $6,495 |
| | Outremont Pearl Drops (Outremont) | New | yes | yes | $4,200 | $3,065 |
| | Mile End Huggies (Mile End) | none | no | yes | $1,950 | $1,425 |
| bracelets | Westmount Tennis Bracelet (Westmount) | Bestseller | yes | yes | $14,500 | $10,585 |
| | Atwater Cuff (Atwater) | none | no | yes | $5,600 | $4,090 |
| | Griffintown Chain Bracelet (Griffintown) | New | no | yes | $1,650 | $1,205 |
| rings | The Teresa Signet (Heritage) | Bestseller | yes | yes | $3,200 | $2,335 |
| | Sherbrooke Emerald Cocktail Ring (Sherbrooke) | Limited | no | yes | $21,800 | $15,915 |
| | Laurier Stacking Band (Laurier) | none | no | yes | $1,350 | $985 |
| bridal | Notre-Dame Oval Solitaire (Notre-Dame) | Bestseller | yes | yes | $18,900 | $13,795 |
| | Basilique Three-Stone (Basilique) | Atelier Exclusive | yes | yes | $26,400 | $19,270 |
| | Promesse Wedding Band (Promesse) | none | no | yes | $1,450 | $1,060 |
| watches | Heritage Automatic 38 (Swiss Selection) | New | yes | yes | $7,400 | $5,400 |
| | Chronographe 1962 (Swiss Selection) | Limited | no | yes | $12,900 | $9,415 |
| | Dame du Lac (Swiss Selection) | none | yes | yes | $9,600 | $7,010 |
| rentals | Gala Diamond Collar (Rental Vault) | Atelier Exclusive | yes | yes | From $650 | From $475 |
| | Chandelier Sapphire Earrings (Rental Vault) | none | no | yes | From $320 | From $235 |
| | Bridal Tiara & Drops Set (Rental Vault) | Bestseller | no | yes | From $480 | From $350 |
| gifts | Initial Disc Pendant (Gifts under $1,000) | Bestseller | yes | yes | $680 | $495 |
| | Pearl Stud Gift Set (Gifts under $1,000) | none | yes | yes | $540 | $395 |
| | Teresa & Sons Gift Card (Gift Cards) | none | no | **no** | $250 | $200 |
| custom | Bespoke Engagement Commission (Sur Mesure) | Made to Order | yes | yes | $5,000 | $3,650 |
| | Heirloom Redesign (Sur Mesure) | Made to Order | no | **no** | $1,800 | $1,315 |
| | Engraved Nameplate Necklace (Personalized) | Made to Order | no | yes | $1,250 | $915 |

Each price renders through `Price`, so the currency code follows it, for example "$6,850 CAD". The Gift Card tile links to `#/p/gift-card`, and `parseHash` routes that hash to the Gift Cards page (`{ name: 'giftcards' }`), not to a PDP.

---

## 7. `ProductCard` (`src/components/ProductCard.tsx`)

### Signature

`export default function ProductCard({ product, index = 0 }: { product: Product; index?: number })`

`index` is used **only** for the reveal stagger. The component reads `currency` from `useStore()`.

### Anatomy

```text
┌──────────────────────────────┐
│ [BESTSELLER]           ( ♡ ) │  badge: left-4 top-4 · WishButton: right-3 top-3
│                              │
│          images[0]           │  aspect-[4/5], bg-silk
│   hover → images[1] fades in │
│                              │
│ (⌾ TRY ON)                   │  try-on chip: bottom-3 left-3
└──────────────────────────────┘
 MONT-ROYAL                        $6,850 CAD   (rentals: "FROM" above the price)
 Mont-Royal Solitaire Pendant
```

| Part | Markup and classes | Rule |
| --- | --- | --- |
| Root | `<a href={href.product(product.slug)} className="group block" data-reveal={(index % 3) * 0.08}>` | The whole card is one link to `#/p/<slug>`. |
| Media box | `relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]` | |
| Primary image | `src={product.images[0]}`, `alt={product.name}`, `loading="lazy"`, class `editorial-zoom h-full w-full object-cover` | Zooms to `scale(1.045)` on card hover. |
| Hover image | Rendered only if `product.images[1]` exists. `alt=""`, `loading="lazy"`, class `absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100` | Cross-fades over the primary image on hover. It has no zoom class. |
| Wish button | `<WishButton slug={product.slug} className="absolute right-3 top-3" />` | Default size `sm`; see §8. |
| Try-on chip wrapper | `absolute bottom-3 left-3 transition-all duration-500 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100` | On hover-capable devices the chip is hidden (shifted 0.5 rem down, opacity 0) until the card is hovered. On touch-only devices it is always visible. |
| Try-on chip | `<TryOnButton product={product} variant="chip" label="Try on" />` | `chip` style: `inline-flex items-center gap-2 rounded-full bg-[var(--bg-travertine)]/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-espresso)] backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]`, with a `ScanFace` icon at size 13 and stroke 1.3. `TryOnButton` returns `null` when `tryOnKind(product)` is `null`, which leaves the wrapper `div` empty. |
| Badge | Rendered only if `product.badges?.[0]` exists. `<span className="font-spec absolute left-4 top-4 bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">` | Shows **only the first badge**. Allowed values (`Product['badges']`): `New`, `Bestseller`, `Atelier Exclusive`, `Limited`, `Made to Order`. |
| Info row | `mt-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4`; the name block is `min-w-0` | Name over price on phones, so long names and prices can't overflow the two-column grid; side by side from `sm`. |
| Collection | `<p className="font-spec text-[10px] uppercase tracking-[0.24em] text-[var(--text-linen)]">{product.collection}</p>` | |
| Title | `<h3 className="font-serif-editorial mt-1.5 text-xl leading-tight sm:text-2xl">{product.name}</h3>` | |
| Price column | `<div className="shrink-0 text-sm sm:pt-5 sm:text-right">` | From `sm`, `pt-5` lines the price up with the title rather than the collection line. On phones it sits under the name, left-aligned. |

### Price display rule

```tsx
const isRental = product.category === 'rentals' && product.rental
// …
{isRental ? (
  <>
    <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">From</span>
    <Price amount={product.rental!.weekend[currency]} />
  </>
) : (
  <Price amount={priceFor(product, currency)} />
)}
```

- **Rentals.** A product counts as a rental only when it is in the `rentals` category **and** has `rental` rates. It shows `From` and the **weekend** rate in the active currency. The PDP also opens on the weekend period (`useState<RentalPeriod>('weekend')` in `src/pages/Product.tsx`).
- **Everything else.** It shows `priceFor(product, currency)`, which is the base `product.price[currency]`. No metal is passed, so `METALS[...].priceDeltaCAD` never applies, and there is no "From" label.
- **Currency source.** Both the amount and the code come from the store `currency`, which defaults to `'CAD'` and is persisted under the `localStorage` key `tns-currency`. USD base prices come from `p()` in `src/data/catalog.ts`: `Math.round((CAD * 0.73) / 5) * 5`, unless the catalog gives an explicit USD amount (the gift card uses `p(250, 200)`).

### Interactions and quick actions

| Action | Result |
| --- | --- |
| Click or tap anywhere on the card | Navigates to `#/p/<slug>`. |
| Wish button | Toggles the wishlist without navigating (§8). |
| "Try on" chip | `preventDefault` + `stopPropagation`, then `openTryOn({ product, metal: undefined, text: undefined, list: undefined })`. With no `list`, `TryOnStudio` offers every try-on-eligible product in its rail: `(request.list ?? PRODUCTS).filter((p) => tryOnKind(p) !== null)`. |
| Quick-add to bag, quick view, colour/metal swatches | None exist on the card. |

The card does **not** record a "recent view". Only the PDP calls `recordView(product.slug)`.

### Reveal stagger

`data-reveal={(index % 3) * 0.08}` gives delays of 0, 0.08 and 0.16 s by column position in a 3-column grid. Callers that omit `index` get a delay of 0 for every card.

### Consumers

Any change to the card affects all of these:

| File | Grid classes | Passes `index` |
| --- | --- | --- |
| `src/pages/Category.tsx` | `grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3` | yes |
| `src/pages/Product.tsx` (related pieces) | `grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3` | yes |
| `src/pages/Wishlist.tsx` | `mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4` | yes |
| `src/components/home/GiftFinder.tsx` | `grid grid-cols-2 gap-x-6 gap-y-12` | yes |
| `src/components/home/Treasured.tsx` | `grid animate-[fadeUp_0.9s_cubic-bezier(0.16,1,0.3,1)] gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3` | no |
| `src/components/RecentlyViewed.tsx` (`RecentlyViewed`) | `grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4` | no |

---

## 8. `WishButton` (`src/components/WishButton.tsx`)

Signature: `WishButton({ slug, className = '', size = 'sm' }: { slug: string; className?: string; size?: 'sm' | 'lg' })`. `ProductCard` uses the default `sm`. The PDP gallery (`src/components/pdp/Gallery.tsx`) uses `size="lg"`.

| Aspect | Value |
| --- | --- |
| Element | `<button type="button" ref={ref}>` |
| State | `on = isWished(slug)` from the store. `isWished` is `wishlist.includes(slug)`. |
| ARIA | `aria-pressed={on}`. `aria-label` is `'Remove from wishlist'` when on and `'Save to wishlist'` when off. |
| Size | `sm`: `h-9 w-9` (36 px) with a `Heart` at size 16. `lg`: `h-12 w-12` (48 px) with a `Heart` at size 20. The stroke width is 1.4 for both. |
| Classes | `` `${dim} flex items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 text-[var(--text-espresso)] backdrop-blur transition-colors hover:text-[var(--gold-vermeil)] ${className}` `` |
| Icon when on | `fill-[var(--gold-vermeil)] text-[var(--gold-vermeil)]` (filled vermeil heart). When off the icon has no extra classes. |

```tsx
onClick={(e) => {
  // Cards are links; keep the click from navigating.
  e.preventDefault()
  e.stopPropagation()
  toggleWishlist(slug)
  gsap.fromTo(ref.current, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
}}
```

Store side (`src/store.tsx`):

- `toggleWishlist` removes the slug if it is present, otherwise appends it to the end.
- `wishlist: string[]` loads from `localStorage['tns-wishlist']` through `load()`, which wraps the read in try/catch. An effect writes it back on every change.
- The Header heart shows a count badge when `wishlist.length > 0`.

---

## 9. `Price` (`src/components/Price.tsx`)

```tsx
export default function Price({ amount, className = '' }: { amount: number; className?: string }) {
  const { currency } = useStore()
  return (
    <span className={`font-spec ${className}`}>
      {formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-linen)]">{currency}</span>
    </span>
  )
}
```

- **No conversion.** `amount` must already be in the store's active currency. `Price` only formats it.
- **Formatting.** `formatPrice` (`src/data/catalog.ts`) is `Intl.NumberFormat(currency === 'CAD' ? 'en-CA' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 })`. It gives "$6,850" in CAD and "$5,000" in USD, so both currencies show `$`. The trailing code span (`0.75em`, linen colour) tells them apart.
- **Hiding the code.** Callers elsewhere hide the code with `className="[&_span]:hidden"`. `ProductCard` passes no `className`, so card prices inherit the `text-sm` of the price column.

---

## 10. Below the grid

### Shoppable films

```tsx
<ShoppableVideos
  videos={videosForCategory(category.slug as CategorySlug)}
  eyebrow={`${category.name} · in motion`}
  title={<>Worn &amp; <em className="text-[var(--gold-vermeil)]">filmed</em></>}
  className="border-t border-[var(--border-hairline)]"
/>
```

`videosForCategory(cat)` is defined in `src/data/media.ts` as `VIDEOS.filter((x) => videoProducts(x).some((p) => p.category === cat))`. `index` keeps its default `'—'` and `tone` keeps `'light'`.

| Category | Films (VIDEOS order) |
| --- | --- |
| necklaces | Dressing the vitrine; Forty facets later |
| earrings | Getting ready; Forty facets later; Evening, adorned |
| bracelets | Getting ready; Stacked, not stuffy; Recycled gold |
| rings | Evening, adorned; Promises, boxed; Recycled gold |
| bridal | The oval, up close; The reveal; Yes, in Montréal; Promises, boxed |
| watches, rentals, gifts, custom | none, so the section is not rendered |

The scroll arrows ("Scroll films left" / "Scroll films right") render only when there are more than 3 films, which today means only `bridal`. Tile behaviour and the viewer are covered in [shoppable-video-and-atelier](../features/shoppable-video-and-atelier.md).

### Recently viewed (`RecentlyViewed`, default export)

Category renders `<RecentlyViewed />` with every default:

| Prop | Default |
| --- | --- |
| `index` | `'—'` |
| `exclude` | `undefined` |
| `limit` | `4` |
| `eyebrow` | `'Your journey'` |
| `title` | `<>Recently <em className="text-[var(--gold-vermeil)]">viewed</em></>` |
| `bordered` | `true` |

- **Data.** The private hook `useRecentProducts(exclude?, limit = 4)` computes `recent.filter((s) => s !== exclude).map(getProduct).filter((p): p is Product => !!p).slice(0, limit)`, memoised on `[recent, exclude, limit]`. Slugs that no longer exist in `PRODUCTS` are dropped.
- **Empty.** It returns `null` when there are no items.
- **Section classes.** `mx-auto max-w-[1600px] px-6 py-28 lg:px-12`, plus `border-t border-[var(--border-hairline)]` when `bordered`.
- **Header.** `SectionHeader` with a `Clear history` button (`link-line text-[var(--text-taupe)]`, `onClick={clearRecent}`) in the aside slot.
- **Grid.** `grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4` of `ProductCard`s, without `index`.
- **Store data.** `recent` is most recent first, de-duplicated and capped at 12 by `recordView`. It is persisted under `localStorage['tns-recent']`. Only the PDP writes to it.

### `RecentlyViewedStrip` (named export, same file, not used on this page)

Signature: `{ exclude?, limit = 3, onNavigate?, title = 'Recently viewed' }`. It returns `null` when empty. It is used by `src/components/CartDrawer.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/pages/Account.tsx` (`limit={5}`) and `src/pages/Wishlist.tsx` (`title="Pieces you looked at" limit={4}`).

| Part | Markup and behaviour |
| --- | --- |
| Header | A `History` icon and the title. An `X` button (`aria-label="Clear recently viewed"`) calls `clearRecent`. |
| List | `divide-y` rows. Each row is a link to `href.product(p.slug)` that calls `onNavigate` on click. |
| Thumbnail | `h-16 w-13`, `editorial-zoom`. |
| Text | Name: `font-serif-editorial truncate text-lg`, turning vermeil on hover. Collection: spec 10 px. |
| Price | `Price amount={p.rental ? p.rental.weekend[currency] : priceFor(p, currency)}` with `shrink-0 text-xs`. There is no "From" label. |

---

## 11. Empty and error states

| State | Rendering |
| --- | --- |
| Unknown slug | `<div className="py-40 text-center">` containing `<p className="font-serif-editorial text-4xl">This chapter could not be found.</p>` and `<a href={href.home} className="mt-6 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-vermeil)]">Return home</a>`. No hero, grid, films or recently viewed. Header and Footer still render. |
| Valid category with 0 products | No dedicated empty state. The toolbar would read "0 pieces · Prices in …", the try-on link would not render, and the grid would be empty. No current category hits this. |
| No films for the category | The `ShoppableVideos` section is omitted. |
| No browsing history | The `RecentlyViewed` section is omitted. |

---

## 12. Motion

`useReveal(root, [slug, sort])` (`src/components/useReveal.ts`) is a `useLayoutEffect`. It builds a `gsap.context` scoped to `root` and reverts it on cleanup. It returns early, doing nothing, when `(prefers-reduced-motion: reduce)` matches.

| Element | Trigger | Effect and timing |
| --- | --- | --- |
| Hero `img[data-parallax]` | Scroll, scrubbed across the hero section (`trigger: el.parentElement`, `start: 'top bottom'`, `end: 'bottom top'`, `scrub: true`) | `yPercent` −8 → 8, `scale` 1.12 throughout, `ease: 'none'` |
| `[data-reveal]` elements: rental steps (`i * 0.06` → 0/0.06/0.12/0.18 s), product cards (`(index % 3) * 0.08`), SectionHeader rows (0 / 0.05 / 0.1), film tiles (`(index % 4) * 0.06`), recently-viewed cards (0) | ScrollTrigger `start: 'top 88%'`, `once: true` | `y` 40 → 0 and `opacity` 0 → 1 over 1.2 s, `expo.out`, `delay = Number(data-reveal) \|\| 0` |
| Card primary image | `.group:hover` | `.editorial-zoom` in `src/index.css`: `transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)` to `scale(1.045)` |
| Card hover image | `group-hover` | Opacity 0 → 100 over 700 ms |
| Card try-on chip | `group-hover`, hover-capable devices only | `translate-y-2` → 0 and opacity 0 → 100 over 500 ms (`transition-all`) |
| WishButton | Click | GSAP `scale` 0.8 → 1, 0.6 s, `elastic.out(1, 0.4)` |
| WishButton | Hover | Text colour changes to `--gold-vermeil` (`transition-colors`) |
| Gifts band card art | `group-hover` on the band link | `-rotate-3` → `rotate-0` over 700 ms |
| `.link-line` CTAs ("Send a gift card", "Try these pieces on", "Clear history") | `:hover` on the `.link-line` element itself | A vermeil underline scales in from the left: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)` |

- **Sort change.** `sort` is in the `useReveal` deps, so changing the sort reverts and rebuilds every tween in the page scope. Each `[data-reveal]` element (cards, section headers, film tiles, recent cards) resets to `y: 40` / `opacity: 0` and animates in again. Elements whose trigger point is already passed animate immediately.
- **Currency change.** It re-sorts and re-prices but does **not** replay the reveals, because `currency` is not in the deps.
- **Reduced motion.** It disables reveals, parallax, Lenis (`SmoothScroll`) and film-tile autoplay (`useInViewPlay` in `src/components/video/useInViewPlay.ts`). It does not disable the CSS hover transitions or the WishButton GSAP pop.

---

## 13. Responsive behaviour

Breakpoints are Tailwind v4 defaults: `sm` 640 px, `lg` 1024 px. `md` is not used on this page.

| Area | < 640 px | ≥ 640 px (`sm`) | ≥ 1024 px (`lg`) |
| --- | --- | --- | --- |
| Hero h1 / French em | `text-7xl` (4.5 rem) / `text-2xl` | same | `text-[9rem]` / `text-4xl` |
| Horizontal gutters (hero, bands, products, recent) | `px-6` | `px-6` | `px-12` |
| Gifts band | Stacked single column | `grid-cols-[200px_1fr_auto]` | same |
| Rentals band | Single column | `grid-cols-4` | same |
| Products section vertical padding | `py-16` | `py-16` | `py-24` |
| Toolbar try-on link | Meant to be hidden (`hidden`), but see Notes | `sm:inline-flex` | same |
| Product grid | 1 column | 2 columns | 3 columns |
| Film tiles | `w-[62vw]` | `sm:w-[38vw]` | `lg:w-[19vw]` plus `lg:min-w-[240px]` |
| Recently viewed grid | 2 columns | 2 columns | 4 columns |

Some behaviour depends on the pointer type rather than the width. Tailwind v4 (4.2.2 installed) wraps `hover:` and `group-hover:` in `@media (hover: hover)`. On touch-only devices that has three consequences:

- the card's second image never fades in;
- the try-on chip is always visible;
- the gift-art tilt never straightens.

The `.group:hover .editorial-zoom` rule is plain CSS with no hover media query.

---

## 14. Cross-links

**Into category pages.** All of these use `href.category(...)`:

| Source | Target |
| --- | --- |
| Header | "Shop" mega menu (all nine `CATEGORIES`), nav links "Bridal" and "Rentals", mobile menu list |
| Footer | List of every category |
| Home | `CategoryIndex`, `HomeHero` CTAs (necklaces, bridal, rentals), page CTAs to bridal and rentals, `Treasured` "Continue the discovery" (necklaces), `GiftFinder` (gifts), `FourCs` (bridal) |
| PDP | Breadcrumb category link and the related-section "View all" |
| Cart page | Empty state: necklaces |
| Cart drawer | Empty state: necklaces, earrings, rings |
| Wishlist | Empty state: rings |
| Account | Orders tile: necklaces |
| Gift Cards page | Breadcrumb: gifts |

**Out of the category page:**

| From | To |
| --- | --- |
| "Maison" breadcrumb, not-found "Return home" | `#/` |
| Product cards | `#/p/<slug>`; the gift card resolves to `#/gift-cards` |
| Gifts band | `#/gift-cards` |
| "Try these pieces on" and card chips | Try-on studio overlay |
| Film tiles | Video viewer portal |
| Recently viewed cards | PDPs |

---

## 15. Copy deck

All strings are verbatim. `·` is U+00B7 and `—` is U+2014. Where text shows in capitals on screen, the CSS `uppercase` class does it; the source is mixed case.

| Where | String | Notes |
| --- | --- | --- |
| Not-found message | `This chapter could not be found.` | |
| Not-found link | `Return home` | |
| Hero breadcrumb | `Maison / Chapter {eyebrow}` | "Maison" is the link to `#/`. Renders as "MAISON / CHAPTER IV". |
| Hero h1 | `{name}` + `{french}` | See the §3 table |
| Hero image alt | `{name}` | |
| Gifts eyebrow | `Carte-cadeau` | |
| Gifts headline | `Not sure what to choose? Give the choice.` | "choice" is in `<em>` |
| Gifts subline | `Digital or mailed · scheduled delivery · never expires` | |
| Gifts CTA | `Send a gift card` | |
| Rental steps | `01` `Reserve online or in salon` · `02` `Fitting & ID verification` · `03` `Insured courier delivery` · `04` `Collected the next morning` | |
| Toolbar count | `{n} pieces · Prices in {currency}` | |
| Category try-on | `Try these pieces on` | |
| Sort label | `Sort` | |
| Sort options | `Featured` · `Price, low to high` · `Price, high to low` | |
| Films eyebrow | `{name} · in motion` | e.g. `Bridal Jewelry · in motion` |
| Films title | `Worn & filmed` | "filmed" is in `<em>` |
| Card rental prefix | `From` | |
| Card try-on chip | `Try on` | |
| Card badges | `New` · `Bestseller` · `Atelier Exclusive` · `Limited` · `Made to Order` | Data-driven |
| Card image alts | `{product.name}` (primary), `""` (hover image) | |
| WishButton aria-label | `Save to wishlist` / `Remove from wishlist` | |
| Price output | `{formatted} {CODE}` | e.g. `$6,850 CAD`, `$5,000 USD` |
| Recently viewed | index `—`, eyebrow `Your journey`, title `Recently viewed` ("viewed" in `<em>`), button `Clear history` | |
| RecentlyViewedStrip | default title `Recently viewed`, clear button aria-label `Clear recently viewed` | |
| Shared components shown here (owned elsewhere) | GiftCardArt: `Teresa & Sons`, `Carte-cadeau · Montréal`, `•••• •••• •••• ••••`. Film arrows: `Scroll films left` / `Scroll films right` | |

---

## Notes & gotchas

Observations, risks and recommendations. These are inferences from the code; none were checked in a browser.

1. **The collection try-on link is probably visible on phones despite `hidden`.**
   - `TryOnButton variant="link"` renders `class="link-line hidden sm:inline-flex"`.
   - `.link-line` is declared **unlayered** in `src/index.css` with `display: inline-flex`.
   - Tailwind v4 puts `hidden` and `sm:inline-flex` inside `@layer utilities`. In the cascade, unlayered rules beat layered ones whatever their specificity, so `hidden` loses.
   - Supporting evidence: `src/components/cart/CartLineItem.tsx` has to override `.link-line` with `!`-prefixed utilities (`!pb-0.5 !text-[10px] !tracking-[0.18em]`).
   - Likely effect: a crowded or wrapping toolbar below 640 px (count + link + sort on one non-wrapping flex row).
   - Possible fixes: `max-sm:!hidden`, or move `.link-line` into `@layer components` and then re-check every `!` override.
2. **The card price can be lower than the price the PDP opens with.**
   - Cards show the base price. The PDP initialises `metal` to `product.metals[0]` and shows `priceFor(product, currency, metal)`.
   - For platinum-first products the PDP adds 650 CAD / 475 USD (`Math.round(650 * 0.73)`). That affects all bridal pieces and Bespoke Engagement Commission:
     - Notre-Dame: $18,900 → $19,550 CAD ($13,795 → $14,270 USD)
     - Basilique: $26,400 → $27,050 ($19,270 → $19,745)
     - Promesse: $1,450 → $2,100 ($1,060 → $1,535)
     - Bespoke: $5,000 → $5,650 ($3,650 → $4,125)
   - Non-rental cards have no "From" label to signal this.
3. **Rentals sort by purchase value, not by the rate on the card.**
   - The comparator uses `price` (34,000 / 48,000 / 92,000 CAD), while cards show weekend rates (320 / 480 / 650).
   - The two orders happen to match today. New rental data could break that.
4. **No filters, and no URL or persisted sort.**
   - Sort resets on every remount and cannot be deep-linked. `parseHash` would treat `#/c/rings?sort=low` as the slug `rings?sort=low` and show the not-found state.
   - Shopify porting (recommendation): Shopify collections use `?sort_by=manual|price-ascending|price-descending`, and the count maps to `collection.products_count`. `src/lib/shopify.ts` has no collection or sort mapping. See [shopify-integration](../shopify-integration.md).
5. **Copy edge cases.**
   - `{n} pieces` has no singular form.
   - A valid but empty category has no empty-state message (§11).
   - The tab title is "{category name} — Teresa & Sons" and the meta description is the category's `description`, both set by `Routes` in `src/App.tsx` (`headFor`). An unknown slug gives "Chapter not found — Teresa & Sons".
6. **Accessibility observations.**
   - `WishButton` and the try-on chip are `<button>`s nested inside the card `<a>`, which is invalid interactive nesting. They rely on `preventDefault`/`stopPropagation`.
   - On hover-capable devices the chip stays at opacity 0 when it receives keyboard focus, because there is no `focus-within` rule.
   - The sort `<select>` has `outline-none`, which removes its focus indicator.
   - JSX strips the newline between `{category.name}` and `<em>`, so the h1 text is "RingsBagues"; the gap is visual only (`ml-4`).
   - The card link's accessible name is built from all its content: image alt, nested button labels, badge, collection, title and price. The product name appears twice.
   - Headings jump from h1 (hero) to h3 (card titles).
   - `WishButton` changes its `aria-label` together with `aria-pressed`, a combination that screen readers may announce redundantly.
   - The `sm` wish button is a 36 px target.
   - Sort changes are not announced (no `aria-live`).
7. **Touch devices never see `images[1]`** on cards (§13).
8. **Changing the sort replays every reveal animation** in the page, including the films and recently viewed sections below the grid (§12).
9. **The stagger assumes 3 columns.**
   - The `(index % 3) * 0.08` delay matches the `lg` grid, not 1–2 column layouts.
   - It also doesn't match the 4-column Wishlist or the 2-column GiftFinder consumers.
10. **USD inconsistency on the Gifts page.** The band art shows "$250 USD" (fixed `amount={250}`), while the Gift Card tile shows "$200 USD" (catalog `p(250, 200)`). `DENOMINATIONS.USD` in `src/data/giftcards.ts` does include 250.
11. **Image weight.**
    - Cards and the hero all request `w=1600` Unsplash images, with no `srcset` or `sizes`.
    - The hover image is `loading="lazy"` but still downloads even when it is never shown, for example on touch devices.
12. **Rental detection is inconsistent across files.**
    - `ProductCard` requires `category === 'rentals' && rental`. `RecentlyViewedStrip`, the film tiles, `VideoViewer` and `TryOnStudio` check only `p.rental`. That is equivalent today, because only rentals carry `rental`.
    - `RecentlyViewedStrip` shows the rental rate without a "From" label.
13. **Only `badges[0]` renders.** No current product has more than one badge, so nothing is hidden today.
14. **Code nits.**
    - `tryOnKind` comes from a second `import … from '../data/catalog'`.
    - `category.slug as CategorySlug` is a redundant cast, since `Category.slug` is already a `CategorySlug`.
    - `key={category.hero}` on the hero image is redundant, because the whole page is keyed by slug.
    - An IIFE inside the JSX computes `wearable`.
    - `product.rental!` relies on the `isRental` guard.
    - `Category` (the page) shares its name with the `Category` interface in `src/data/catalog.ts`. That interface is not imported here.
15. **Motion is not fully gated by reduced motion.** The WishButton GSAP pop and the CSS hover transitions (zoom, image cross-fade, chip slide, card-art tilt, `.link-line` underline) ignore `prefers-reduced-motion`. On this page only `useReveal`, Lenis, film autoplay (`useInViewPlay`) and the film-grain/marquee keyframes respect it.

---

## Related docs

- [Product overview, sitemap & user journeys](../product-overview.md)
- [Architecture & runtime model](../architecture.md)
- [Design system — tokens, typography, color, layout & component recipes](../design-system.md)
- [Motion, animation & scroll behaviour](../motion-and-interaction.md)
- [Brand, voice & copywriting](../brand-voice-and-copy.md)
- [Data layer — catalog, media, gift cards, costing & tax](../data-model.md)
- [Commerce logic — pricing, currency, cart lines, totals, tax & checkout math](../commerce-logic.md)
- [Shopify integration map & porting notes](../shopify-integration.md)
- [Home page](./home.md)
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
