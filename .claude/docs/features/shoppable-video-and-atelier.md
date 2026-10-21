# Shoppable video & the Atelier page

Shoppable video is a horizontal rail of autoplaying vertical "films" (`ShoppableVideos`). Each film opens a full-screen, story-style `VideoViewer` with tagged products: add to bag, go to the PDP, or try on. Films are placeholder Mixkit stock clips defined in `src/data/media.ts`. The Atelier page (`#/atelier`) tells the house story, shows the four-step bespoke process and the in-house films, and ends with a (simulated) appointment request form.

Scope: `src/components/video/ShoppableVideos.tsx`, `src/components/video/VideoViewer.tsx`, `src/components/video/useInViewPlay.ts`, `src/data/media.ts`, `src/pages/Atelier.tsx`; call sites in `src/pages/Home.tsx`, `src/pages/Category.tsx`, `src/pages/Product.tsx`

## 1. Data (`src/data/media.ts`)

```ts
export interface ShoppableVideo { id: string; src: string /* 720p */; preview: string /* 360p for tiles */; poster: string; title: string; caption: string; handle: string; products: string[] /* slugs */ }
```

URLs are built by `clip(id, 360|720)` → `https://assets.mixkit.co/videos/{id}/{id}-{q}.mp4` and `poster(id)` → `…/{id}-thumb-360-0.jpg`. The ten `VIDEOS`, in order:

| id | Title | Caption | Handle | Products |
|---|---|---|---|---|
| v5220 | The oval, up close | How a 1.82 ct oval catches morning light. | @teresaandsons | notre-dame-oval-solitaire, promesse-wedding-band |
| v47476 | Getting ready | A bride fastens her Westmount line before the ceremony. | @claire.weds | westmount-tennis-bracelet, vieux-port-diamond-studs |
| v24656 | The reveal | Every proposal deserves this moment. | @teresaandsons | basilique-emerald-cut-three-stone, notre-dame-oval-solitaire |
| v34213 | Dressing the vitrine | Behind the glass on rue Sherbrooke. | @teresaandsons | riviere-saint-laurent, mont-royal-solitaire-pendant, plateau-paperclip-chain |
| v34611 | Stacked, not stuffy | Tennis lines and curb links, worn together. | @mtl.style | westmount-tennis-bracelet, griffintown-chain-bracelet |
| v47288 | Forty facets later | Our setter checks each stone under the loupe. | @teresaandsons | mont-royal-solitaire-pendant, vieux-port-diamond-studs |
| v50782 | Evening, adorned | Emerald and pearl for a gala in Old Montreal. | @priya.s | sherbrooke-emerald-cocktail, outremont-pearl-drops |
| v51649 | Yes, in Montréal | A campfire proposal on Mont-Royal. | @danielk | notre-dame-oval-solitaire |
| v5181 | Promises, boxed | Matched bands, ready for the day. | @teresaandsons | promesse-wedding-band, laurier-stacking-band |
| v2861 | Recycled gold | Every ingot we cast is reclaimed and refined. | @teresaandsons | teresa-signet, atwater-cuff |

**Helpers:**
- `videoProducts(video)` resolves the product slugs and drops unknown ones.
- `videosForProduct(slug)` returns the films that tag the product.
- `videosForCategory(cat)` returns the films with at least one product in the category.
- `media.ts` also exports `ReviewMedia`, `REVIEW_MEDIA` and `mediaPoolFor(p)`, used by Reviews (see the PDP modules doc).

**Where the films appear:**

| Page | Films | Notes |
|---|---|---|
| Home | all `VIDEOS` | eyebrow `Watch & shop`, title "Seen in *motion*" |
| Category | `videosForCategory(slug)` | eyebrow `{Category} · in motion`, title "Worn & *filmed*" |
| Product | `films` = product films first, then the rest of the category's films | `index={num('films')}`, eyebrow `Watch & shop` |
| Atelier | films with handle `@teresaandsons` | `tone="dark"`, eyebrow `Inside the atelier`, title "At the *bench*" |

## 2. ShoppableVideos (rail)

**Props:**

```ts
{ videos: ShoppableVideo[]; index?: string = '—'; eyebrow?: string = 'Watch & shop'; title?: ReactNode = <>Seen in <em>motion</em></>; tone?: 'light' | 'dark' = 'light'; className? }
```

- Returns `null` for an empty list.
- Section header: `SectionHeader` in a `max-w-[1600px] px-6 pt-28 lg:px-12 lg:pt-36` wrapper.
- Scroll buttons appear only when there are more than 3 films. They are round 44 px buttons with `aria-label` "Scroll films left" / "Scroll films right" and call `scrollBy(±0.8 × rail width, smooth)`.
- The rail is `flex snap-x snap-mandatory gap-3 overflow-x-auto … lg:-mt-20 lg:gap-4`, with the scrollbar hidden, `overscroll-x-contain` and `data-lenis-prevent-horizontal` (2026-10-21; `data-lenis-prevent-wheel` before, which made the wheel stutter over the rail). It overlaps the header on lg.

**Tile** (a `<button>` with `data-reveal={(index % 4) * 0.06}`):
- Size and layout:
  - `aspect-[9/16] w-[62vw] … sm:w-[38vw] lg:w-[19vw] lg:min-w-[240px] snap-start`.
  - Muted, looping, `playsInline`, `preload="none"` preview video with poster and `.editorial-zoom`.
  - A gradient scrim; the handle at top left; a play badge at top right.
- Text: the title (`font-serif-editorial text-xl`).
- First-product chip: thumbnail, name, and price (`rental.weekend` or the base `priceFor`), plus `+{n}` when more products are tagged.
- `useInViewPlay(ref)` plays the video while at least 60% of it is visible and pauses otherwise. It is disabled under reduced motion (the video then shows only its poster).

**Opening:** clicking a tile renders `VideoViewer` through `createPortal(…, document.body)` starting at that index.

## 3. VideoViewer (full-screen player)

**Shell:**
- Root: `fixed inset-0 z-[100] … bg-[var(--bg-vault)]/95 backdrop-blur-md`, `role="dialog" aria-modal="true" aria-label={video.title}`, `data-lenis-prevent`.
- On mount: stops Lenis and locks `document.documentElement` overflow; cleanup restores both.

**Keyboard** (`window` keydown):

| Key | Action |
|---|---|
| Escape | close |
| ArrowDown / ArrowRight | next film (wraps around) |
| ArrowUp / ArrowLeft | previous film |
| Space | play / pause |

Touch: a vertical swipe of more than 60 px goes to the next or previous film.

**State:** `i` (current film index), `muted` (initially true), `paused`, `progress` (0–1 from `onTimeUpdate`), `added` (slug).

**Player** (`aspect-[9/16] h-full`):
- `<video key={video.id} autoPlay muted loop playsInline>`; clicking the video toggles playback.
- Segmented progress bars at the top (completed / current / upcoming) and the handle under them.
- Control column: Close, Mute/Unmute, Play/Pause (round `bg-black/45` buttons); a large Play button when paused.

**Mobile overlay** (below lg): the title, caption and a horizontal list of product cards. Each card links to the PDP and closes the viewer.

**Desktop side panel** (`lg:block w-[340px]`):
- Counter `01 / 10 · Shop the film`, the title and the caption.
- One card per tagged product: image, name and price link to the PDP.
- Action row for each product:
  - **Select options** (link to the PDP) when `configurable` (rental, personalization, rings or bridal).
  - Otherwise **Add to bag** → `addToCart({ slug, metal: p.metals[0] })`, then **Added**.
  - A `TryOnButton` chip "Try on" in both cases.
- Previous / next round buttons (`ChevronUp` / `ChevronDown`).

## 4. Atelier page (`src/pages/Atelier.tsx`)

> **2026-10-21:** the page runs hero → the four-step process → `TheHands` (01) → `MakingScroll` (02, moved from Home) → `Generations` (03) → the films (04) → the visit booked on the page (`VisitFlow`). The wireframe below predates the redesign.

```
┌ Hero (12 cols) ───────────────────────────────────────────────────────────┐
│ L'ATELIER · SINCE 1962                                   [IMG.ring2 4/5   │
│ Made for you, by a family.  (text-6xl → lg:text-[7.5rem])   data-parallax]│
│ Teresa Moretti opened a single bench…                                      │
├ Process (bg-silk, hairline grid 1/2/4 cols): 01 Consultation · 02 Stone   │
│   sourcing · 03 CAD & wax · 04 Hand-finishing                              │
├ ShoppableVideos (dark): "Inside the atelier" / "At the bench"              │
└ Appointment form (max-w-3xl): Full name* Email* Phone | Interest ▾ | idea  │
```

- `useReveal(root)` with `data-reveal` staggers, plus `data-parallax` on the hero image.
- Form: underline fields (`border-b … focus:border-[var(--gold-vermeil)]`).
  - `Full name` and `Email` are required; `Phone` is optional.
  - `Interest` options: Engagement ring / Heirloom redesign / Personalized piece / Jewelry rental fitting / Watch service.
  - Textarea `Tell us about your idea`.
  - Button **Request appointment**.
- Submitting sets `sent`, which replaces the form with `Merci. Our concierge will be in touch within one business day.` Nothing is sent anywhere.

**Copy deck (verbatim):**
- Eyebrow: `L'Atelier · Since 1962`
- h1: `Made for you, by a family.`
- Body: `Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls.`
- Steps:
  - `Consultation` — `An unhurried conversation in our salon or by video, with sketches made in front of you.`
  - `Stone sourcing` — `We present a curated selection of GIA-certified diamonds and coloured gems.`
  - `CAD & wax` — `Precise 3D renders, then a wax model you can try on before we cast.`
  - `Hand-finishing` — `Cast, set and polished at our bench on rue Sherbrooke, then hallmarked.`
- Form heading: `Book a private appointment` (*appointment* italic vermeil).

## Notes & gotchas

- **Overlay stacking:** adding to bag from the viewer opens the cart drawer (z-[90]) underneath the viewer (z-[100]).
- **"Configurable" rules differ** across `VideoViewer` (no `custom`), `TryOnStudio`, `CartUpsell` and Wishlist. Here, custom commissions are quick-added at `metals[0]`.
- **Effects:** the keydown effect deliberately depends only on `[onClose]` (eslint-disable comment). `go`/`toggle` are recreated each render but read state through setters and refs.
- **Tile prices** show the base price with no "From" for rentals, which differs from ProductCard.
- **Placeholder media:** clips are Mixkit placeholders. Swapping in brand films only requires changing the ids or URLs in `media.ts`.
- **Atelier form:** fields have no `name`/`id` and their values are never read. The story mentions rue Sainte-Catherine (1962) while the salon is on rue Sherbrooke.

## Related docs

- [../pages/home.md](../pages/home.md) — where the main film rail sits on Home
- [../pages/product.md](../pages/product.md) — PDP films section and numbering
- [virtual-try-on.md](virtual-try-on.md) — the "Try on" chip
- [../data-model.md](../data-model.md) — media.ts and catalog slugs
- [../motion-and-interaction.md](../motion-and-interaction.md) — in-view autoplay, reveal and parallax
- [../brand-voice-and-copy.md](../brand-voice-and-copy.md) — heritage story copy
