# Virtual try-on

A camera/photo "View it on you" studio. It overlays a vector drawing of the piece (SVG, tinted by the selected metal) on a live camera feed or an uploaded photo. The user can drag, pinch, rotate and scale it, capture a branded PNG, and add to bag or deep-link to the PDP. Everything runs client-side. There is no face or hand tracking: placement is manual, starting from per-kind defaults.

Scope: `src/components/tryon/TryOnProvider.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/tryon/TryOnStudio.tsx`, `src/components/tryon/JewelryOverlay.tsx`, `src/data/catalog.ts` (`tryOnKind`, `TryOnKind`), call sites (Product, Category, Wishlist, Gallery, StickyBar, CartLineItem, VideoViewer, home TryOnFeature, ProductCard)

## 1. Architecture

```ts
export interface TryOnRequest { product: Product; metal?: Metal; text?: string; list?: Product[] /* "try another" rail */ }
interface Ctx { openTryOn: (req: TryOnRequest) => void; canTryOn: (p: Product) => boolean }
```

- `TryOnProvider` (mounted in `src/App.tsx` inside `StoreProvider`, outside `SmoothScroll`) holds `req: TryOnRequest | null`. `canTryOn(p) = tryOnKind(p) !== null`; `openTryOn(r)` sets `req` only if the product has a kind. While `req` is set it renders `<Suspense fallback={null}><TryOnStudio request={req} onClose={() => setReq(null)} /></Suspense>`.
- `TryOnStudio` is the app's only `lazy()` import, so it ships as a separate chunk (about 22 kB).
- `useTryOn()` throws outside the provider.
- `tryOnKind(p)` (`src/data/catalog.ts`) classifies by **product name regex**, in this order:
  1. gift card / redesign → `null`
  2. earring/stud/drop/huggie/tiara → `earrings`
  3. necklace/pendant/collar/rivi/chain (not "chain bracelet") → `necklace`
  4. bracelet/cuff/tennis → `bracelet`
  5. watches category → `watch`
  6. ring/signet/band/solitaire/three-stone/engagement, or the rings/bridal categories → `ring`
  7. otherwise `null`

## 2. TryOnButton

Props `{ product; metal?; text?; list?; variant?: 'outline' | 'chip' | 'icon' | 'link' | 'solid' = 'outline'; label?: string = 'View on you'; className? }`. Returns `null` when `!canTryOn(product)`. The click calls `preventDefault()` + `stopPropagation()`, because it often sits inside product-card links. Variant classes (verbatim):
- `outline`: `flex w-full items-center justify-center gap-2.5 border border-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]`
- `solid`: `inline-flex items-center gap-2.5 bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] transition-colors hover:bg-white`
- `chip`: `inline-flex items-center gap-2 rounded-full bg-[var(--bg-travertine)]/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-espresso)] backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]`
- `icon`: `flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--border-hairline)] transition-colors hover:border-[var(--text-espresso)]`, with `aria-label="{label}: {product.name}"` and `title={label}`.
- `link`: `.link-line` (text only, no icon).

All variants except `link` show the `ScanFace` icon (13 px for chip, 16 px otherwise); all except `icon` show the label.

## 3. Studio flow (`TryOnStudio`)

Root: `fixed inset-0 z-[110] flex flex-col bg-[var(--bg-vault)] text-[var(--bg-travertine)] lg:flex-row`, `role="dialog" aria-modal="true" aria-label="View {name} on you"`, `data-lenis-prevent`. The mount effect stops Lenis, sets `document.documentElement.style.overflow = 'hidden'` and closes on Escape. Cleanup reverses all three.

**State:**
- `product` (switchable from the rail); `kind = tryOnKind(product)`.
- `metal`: `request.metal ?? product.metals[0]`.
- `place`: `{ x, y (% of stage), scale, rotate (deg), spread (earrings) }`.
- `source`: `'idle' | 'requesting' | 'camera' | 'photo' | 'denied' | 'unsupported'`.
- `facing`: `environment` for ring/bracelet/watch, else `user`.
- `mirror`, `guide`, `photo` (object URL), `shot` (PNG data URL), `added`.

**Defaults per kind** (`DEFAULTS`): `width` is a fraction of the stage width.

| Kind | Placement | Guide | Tip |
|---|---|---|---|
| necklace | x50 y70, width .62 | Frame your face and shoulders | Drag the chain to your collarbone. |
| earrings | x50 y46, spread .55, width .62 | Face the camera, hair tucked back | Align each stone with your earlobes using Spacing. |
| ring | x50 y52, width .42 | Hold your hand flat, back to the lens | Drag the band onto your ring finger and rotate to match. |
| bracelet | x50 y55, width .55 | Show your wrist to the camera | Drag onto your wrist and rotate to follow your arm. |
| watch | x50 y52, rotate 90, width .4 | Show the top of your wrist | Rotate so the strap runs along your arm. |

**Steps:**
1. **Pre-start screen** (when the source is neither camera nor photo): radial vault gradient, `ScanFace`, eyebrow `Essayage virtuel`, h2 `View it on you`. The message depends on `source`:
   - `denied`: `Camera access was declined. You can allow it in your browser settings, or use a photo instead.`
   - `unsupported`: `Your browser does not support camera access here. Upload a photo to try the piece on.`
   - `requesting`: `Waiting for camera permission…`
   - otherwise: `{guide}. Your camera feed stays on this device.`
   
   Buttons: **Start camera** / **Try camera again** (hidden when unsupported; disabled while requesting) and **Upload a photo** (an `sr-only` file input with `accept="image/*"`).
2. **Camera:** `getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1600 } }, audio: false })`. Mirroring is on for the front camera. Tracks are stopped on restart, on upload and on unmount.
3. **Photo:** `URL.createObjectURL(file)`, unmirrored. The object URL is never revoked.
4. **Positioning:**
   - Stage `aspect-[3/4] … touch-none select-none`.
   - One pointer drags (x/y clamped 0–100%). Two pointers pinch-scale (clamped 0.3–3) and rotate.
   - The mouse wheel scales by `1 - deltaY * 0.0012`.
   - Side-panel range inputs: Size (0.3–3), Rotation (−180–180), and Spacing (earrings, 0–1). Four nudge buttons (← → ↑ ↓) move ±1%.
   - Stage controls (round `bg-black/45` 44 px buttons): Close; Switch camera / Mirror (`aria-pressed`) in camera mode; Toggle positioning guide (`aria-pressed`, dashed head or hand outline SVG) and Reset position when live.
5. **Capture:**
   - Draws the frame into a canvas at up to 2× DPR, replicating the `object-cover` crop and the mirroring.
   - Serialises the overlay SVG to an image and draws it at the placement transform.
   - Stamps `Teresa & Sons · Montréal` (Baskervville, 14 px × dpr, `rgba(251,249,245,0.85)`).
   - Shows the shot full-stage with **Retake** and **Save photo** (`download="{slug}-try-on.png"`).
6. **Side panel** (`lg:w-[400px]`, `max-h-[46vh]` on mobile, `data-lenis-prevent`):
   - Eyebrow `View on you · {kind}`, product name, and price (`rental.weekend` or `priceFor(product, currency, metal)`).
   - Metal swatches (gradient circles, `aria-pressed`), shown when more than one metal and not a rental.
   - The controls above.
   - CTA:
     - When `needsConfig` (rental, personalization, or category rings/bridal/custom): a link to the PDP labelled **Choose dates** / **Personalize this piece** / **Choose size & options**. It calls `onClose`.
     - Otherwise: **Add to bag** → `addToCart({ slug, metal })` → **Added to bag**.
   - Always: **See it in person — book a viewing** → `#/atelier`.
   - A "Try another" rail of up to 12 eligible products (`request.list ?? PRODUCTS`). Switching kind resets the placement; the metal is kept if the new piece offers it.
   - Privacy footnote: `Processed entirely on your device. Nothing is recorded or uploaded. The rendering is an illustration — proportions are approximate.`

## 4. JewelryOverlay (vector rendering)

`forwardRef<SVGSVGElement, { kind; swatch; product; text?; spread? = 0.5 }>`, `viewBox="0 0 200 200"`. Gradient and filter ids are made unique with `useId()`.

Shared defs:
- A metal `linearGradient`: `#fffaf0` → swatch → `#8a6a32` → swatch.
- A stone `radialGradient`: white, or pearl `#f4ead8`/`#c9b48e`, or gem emerald `#2f8f6a` / sapphire `#2c4f9e`.
- A drop-shadow filter.

`sparkle(x, y, r)` draws a stone with a white diamond glint (no glint on pearls).

Per kind:
- **necklace:**
  - Chain curve `M10 20 Q 100 150 190 20`.
  - Collar/rivière: 23 graduated stones along the curve.
  - Nameplate text in `'Pinyon Script'` (font size `max(18, 40 − 2·len)`).
  - Disc pendant for "disc" names; otherwise a single solitaire drop.
- **earrings:** a pair separated by `40 + spread·110`. Huggies are ellipse hoops. "drop/chandelier/tiara" add a hanging stone.
- **ring:**
  - Band arc.
  - Signet: oval face, with monogram text in italic Baskervville.
  - Stones (GIA, or name/description matching diamond/solitaire/tennis/rivi/collar/stud/pav, or a gem): prongs plus a stone.
- **bracelet:**
  - Ellipse band, 12 px stroke for cuffs.
  - Tennis: 15 stones along the front arc.
  - Otherwise a single station stone.
- **watch:** strap rect, metal case, dial (`#f3efe8` for pearl/"lac" names), 12 indices, two hands, and a crown.

The swatch comes from `METALS[metal].swatch` (default `#D4B982`). Personalized text is passed only for the originally requested product.

## 5. Entry points

`TryOnButton` usages:

| Location | How it's used |
|---|---|
| `ProductCard` | Hover chip "Try on" |
| Category | `link` "Try this collection on", first eligible product + list |
| Wishlist | "Try your wishlist on" |
| Product | Configurator; passes metal and personalization text |
| Gallery | Button on the gallery |
| StickyBar | Button on the sticky bar |
| CartLineItem | Button on bag lines |
| VideoViewer | Chip "Try on" |
| Home `TryOnFeature` | Home try-on section (see the home doc) |

## Notes & gotchas

- Placement is manual: there is no landmark detection. Copy calls the rendering "an illustration".
- `needsConfig` here includes `custom`. VideoViewer's `configurable`, CartUpsell's `quickAddable` and the Wishlist add-all filter use different rules.
- Adds from the studio (z-[110]) open the cart drawer (z-[90]) *underneath* the studio. Escape closes both when the studio was opened from a bag line. The studio's cleanup restarts Lenis even if the drawer's lock is still active (scroll locks are not reference-counted).
- `kind` is asserted with `as TryOnKind`. Only open the studio through `openTryOn`, which guards against `null`.
- Name-regex heuristics (`tryOnKind`, overlay details) silently change behaviour if products are renamed.
- Uploaded-photo object URLs are not revoked; the capture `img.decode()` requires a CORS-clean SVG (it is inline, so this is fine).

## Related docs

- [../data-model.md](../data-model.md) — `tryOnKind` results for every product
- [../pages/product.md](../pages/product.md) — PDP try-on placement
- [../pages/home.md](../pages/home.md) — the TryOnFeature home section
- [../ux-patterns-and-accessibility.md](../ux-patterns-and-accessibility.md) — overlay conventions and z-index ladder
- [shoppable-video-and-atelier.md](shoppable-video-and-atelier.md) — try-on from the video viewer
