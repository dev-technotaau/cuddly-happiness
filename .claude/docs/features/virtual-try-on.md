# Virtual try-on

A camera/photo "View it on you" studio, in two ways. A ring with a 3D model (a ring from the designer, or one of the house's engagement rings the designer can build) is tried on in **live 3D** (2026-10-22, owner request): the hand is tracked in the camera (or found in a photo), and the real 3D ring is drawn on the chosen finger, turned with it, hidden by the finger where a band would be, lit for the room (§3a). Every other piece overlays a vector drawing (SVG, tinted by the selected metal) that the visitor drags, pinches, rotates and scales from per-kind defaults. Both capture a branded PNG and lead to the bag or the PDP. Everything runs in the browser.

Scope: `src/components/tryon/TryOnProvider.tsx`, `src/components/tryon/TryOnButton.tsx`, `src/components/tryon/TryOnStudio.tsx`, `src/components/tryon/JewelryOverlay.tsx`, the 3D try-on (`src/components/tryon/RingTryOn.tsx`, `src/components/tryon/fingerPose.ts`, `src/components/tryon/handTracker.ts`, `src/components/designer/three/tryOnStage.ts`), `src/data/catalog.ts` (`tryOnKind`, `TryOnKind`), call sites (Product, Category, Wishlist, Gallery, StickyBar, CartLineItem, VideoViewer, home TryOnFeature, ProductCard, Designer)

## 1. Architecture

```ts
export interface TryOnDesign { image: string; title: string; price: number; code: string; size: string | null; onSize?: () => void; onMetal?: (metal: BandMetal) => void }
export interface TryOnRequest { product: Product; metal?: Metal; text?: string; list?: Product[] /* "try another" rail */; design?: TryOnDesign }
interface Ctx { openTryOn: (req: TryOnRequest) => void; canTryOn: (p: Product) => boolean }
```

- `TryOnProvider` (mounted in `src/App.tsx` inside `StoreProvider`, outside `SmoothScroll`) holds `req: TryOnRequest | null`. `canTryOn(p) = tryOnKind(p) !== null`; `openTryOn(r)` sets `req` only if the product has a kind. While `req` is set it renders `<Suspense fallback={null}><TryOnStudio request={req} onClose={() => setReq(null)} /></Suspense>`.
- `TryOnStudio` is a `lazy()` import, so it ships as a separate chunk (about 36 kB). The 3D try-on is another `lazy()` import inside it (`RingTryOn`, about 164 kB, most of it MediaPipe's JavaScript) and shares the three.js chunk with the ring designer; neither loads for a necklace or earrings.
- **A designed ring (2026-10-22).** `openTryOn` also opens for a request with `design` (from the ring designer, `product` being the commission). The studio builds the ring in 3D from its code (§3a; where 3D can't run, the design's own picture from above, `snapshot('tryon')`, takes `JewelryOverlay`'s place), names it, prices it from its code (`ringPrice`, so a change of market reprices it) with the deposit due today (`designDeposit`), lets the visitor change its metal on the hand (the price follows, and `onMetal` hands the metal back to the designer), and offers **Add to bag** (with its size, as `designCode` of the ring as tried; `add` refuses a sizeless design rather than adding the commission) or **Choose your size** (closes and calls `onSize`), and **Book a design consultation**; the "try another" rail starts with **Your design**, then the house's rings. See [ring-designer.md](ring-designer.md).
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

## 3a. The 3D try-on (rings, 2026-10-22)

**When.** `ring3d` (memoised in `TryOnStudio`): where the browser can draw in 3D (`canDraw3d`: WebGPU, or WebGL 2), the design being tried (`tried`, its metal changeable) or, for a catalog ring, the house design whose `PRESETS[].slug` it is, in the metal chosen in the studio. Otherwise the vector overlay, as before.

**Tracking** (`handTracker.ts`). Google's MediaPipe hand landmarker (`@mediapipe/tasks-vision` 1.0.1, Apache-2.0), loaded the first time a ring is tried on in 3D and kept for the visit (`loadTracker`, a module-level promise; a failed load can be retried on the next visit to the studio). Its engine (WASM) comes from jsDelivr pinned to the package's version, its model (`hand_landmarker.task`, float16, about 7.8 MB) from Google's model storage, read as it arrives so the studio shows the progress. GPU delegate, falling back to the CPU. `video(video, time)` runs on each frame (`detectForVideo`, rising timestamps); `image(img)` switches to `IMAGE` mode for a photo and back. Hands come back in the picture's pixels (`z` in the same scale as `x`), with the tracker's handedness as it gives it: checked on photographs of the back of a hand, its "Left" is a left hand in the picture as given.

**The pose** (`fingerPose.ts`). For the chosen finger (`FINGERS`: index, middle, ring, little; the ring finger by default): the ring sits halfway along the first bone from the knuckle joint (`SEAT`); the finger's direction is that bone; the back of the hand, where the stone faces, is the palm's normal (`(p5 − p0) × (p17 − p0)`), turned round for a right hand; the finger's width is 60% from the spacing of the knuckles beside it and 40% from the bone's length, with an adult hand's proportions per finger (`WIDTH`). `Steady` smooths it with One Euro filters (still: no jitter; moving: no lag) and never lets the stone flip sides on a single frame (six frames must agree). `hintFor` reads the picture and the steadied pose for guidance: too far (the hand under 14% of the short side), too near (over 62%), the finger at the edge, the palm toward the lens. `placedPose` is a ring placed by hand: the studio's placement, the finger up the picture, leaning a little away.

**Drawing** (`tryOnStage.ts`, `TryOnStage`, started with `TryOnStage.create`). A transparent canvas over the studio's picture, drawn by three.js's WebGPU renderer (WebGL 2 where WebGPU is missing). A change (a new pose, light or design) draws with TRAA, which keeps the stones steady as the hand moves; when nothing has changed for 220 ms (a photo, a hand held still) it settles into an accumulated still (seeded with TRAA's last frame; 64 samples on WebGPU, 32 on WebGL 2, the stones in single wavelengths). The photograph taken is such a still, drawn off screen at the photo's size (32 samples, 16 on WebGL 2) and read back (`capture(w, h)`, a promise; `RingTryOnApi.draw` awaits it). The rooms light a ring from above, where the designer's camera looks; on a hand the stone faces the lens, so the try-on turns its room (`scene.environmentRotation.x = π/2`) to bring the key light in front of the hand, for the metal and the stones alike (without it the stones reflected the room's dark walls and read grey). The camera is a long lens far away (4 × the stage's height), so the stage's pixels are the scene's units at the ring; the picture's `object-cover` crop and a selfie's mirroring are applied to the pose (`toStage`). The ring is the designer's own `RingModel` (parts, metals, traced stones), traced against itself as in the designer (its own `RingTracer`, the hierarchy rebuilt for each new design, `follow()` placing it each frame; the metals' reflections in an `rtt` pass between the scene and TRAA, unblended so the picture under the ring shows through; stills and the photograph through a `TracedFrame`), with its own stone uniforms (`makeGemUniforms`) and its own `Lighting`, so it never borrows the designer's renderer's light; a model that changes by itself (its engraving's typeface come in) asks for a new frame (`onRedraw`). Stills average in 32-bit floats where the GPU allows (`averageType`). It is scaled so the band's inside matches the finger's width (`fit` adjusts it, 85–115%), its Z on the finger, its Y out of the back of the hand. An unseen finger (a tapering cylinder from 14 mm toward the hand to 38 mm toward the tip, writing depth only) hides the band's far side and a stone turned away, as the real finger would; a second, a breath larger, takes the shadow the metal casts (`ShadowMaterial`, 24%) from a soft key light just above the lens.

**The room's light.** "Match the room" (default) reads a 24 × 32 copy of the picture every 700 ms (a photo once): a warm, dim picture takes the salon's lamps, a cool one daylight, anything else (a bright sunset too) the studio, which gives a stone its sparkle; the exposure follows the picture's brightness (0.72–1.3). A new kind of light must hold for three readings. The visitor can choose Studio, Daylight, Salon lamps or Candlelight instead (French: Ambiante, Studio, Lumière du jour, Lampes du salon, Lueur de chandelle).

**The loop** (`RingTryOn.tsx`). One detection per presented video frame (`requestVideoFrameCallback`, else `requestAnimationFrame`); the ring is placed and drawn in the same frame. A device slow to find the hand (over 40 ms) skips every other frame. A hand lost for more than 320 ms takes the ring off. A new hint must hold for eight frames before the status changes (`settle`), so a hand sitting at a threshold doesn't make it flicker and speak; finding a hand, or losing it, shows at once. Loading reports its progress in steps of 5%. A photo is read once. The room's light is redrawn at each reading on a photo or a ring placed by hand (a tracked hand is drawn every frame anyway). The visitor places the ring by hand when they choose ("Place it by hand"), when the tracker can't load, or on a photo without a hand; then the studio's drag, pinch, wheel, sliders and nudges move it, as in the flat try-on. Capture draws the 3D canvas over the composed picture (`RingTryOnApi.draw`). If the browser takes the 3D view back (`webglcontextlost`, reported as `{ phase: 'lost' }`), the studio sets `lost` and falls back to the flat try-on for the rest of the visit: the design's own picture (or the vector overlay) placed by hand. In development the try-on is exposed as `window.__tryon` (stage, the hand found, the latest props).

**The camera's mirror.** Rings ask for the rear camera, and the picture is mirrored unless the camera reports it faces away (`getSettings().facingMode`, falling back to what was asked): a laptop's webcam, which faces the visitor whatever was asked for, is mirrored like a selfie.

**What it says** (a `role="status"` chip over the picture, with a gold dot once the ring is on the hand; anchored left on phones, `max-w-[calc(100%-5.5rem)]`, so it stays clear of the stage's controls, centred from `sm:`): "Preparing the 3D try-on…", "Preparing hand tracking…" followed by the percentage in an `aria-hidden` span (shown, not spoken), "Show the back of your hand" (after six seconds without a hand: "Still no hand? Try “Place it by hand”"), "Bring your hand a little closer", "Hold your hand a little further from the lens", "Turn your hand: the back toward the lens", "Move your hand toward the centre", "On your ring finger" (or index, middle, little), "No hand found: place it by hand" (a photo), "Drag the ring onto your finger" (placing by choice), "Tracking unavailable: place it by hand" (the tracker couldn't load). The chip's messages are short enough for a phone; the how-to ("Drag the ring onto your finger; pinch or use the sliders to size and turn it.") is the desktop hint at the foot of the stage. French: "Aucune main repérée : placez-la à la main" and "Suivi indisponible : placez-la à la main" keep "placez-la" whole with a word joiner (`\u2060`).

**The panel** adds, for a design, its metal (one swatch row, `role="group"`, shared with a catalog piece's metals), then Finger (pills sized to their words, wrapping), the "Place it by hand" switch, "Fit on the finger" (`aria-valuetext`, hidden while placing by hand) and Light. The switch shows `aria-checked={placing}`: it is on whenever the ring is placed by hand, and locked on (`disabled`) where there is no hand to follow (the tracker couldn't load, a photo without a hand); the Finger pills are disabled while placing. Under a design's price: "{deposit} today, a 30% deposit; {balance} when you approve the final design." (`RING_COPY.todayShare` and `onApproval`, the designer's own sentence). The eyebrow ends "· Live 3D"; the privacy line becomes "Your hand is tracked on this device with Google’s MediaPipe, downloaded when you start. Neither what the camera sees nor any photo you add leaves the device. The ring is drawn in 3D from its design — an illustration, its proportions approximate."

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
| Category | `link` "Try these pieces on", first eligible product + list |
| Wishlist | "Try your wishlist on" |
| Product | Configurator; passes metal and personalization text |
| Gallery | Button on the gallery |
| StickyBar | Button on the sticky bar |
| CartLineItem | Button on bag lines |
| VideoViewer | Chip "Try on" |
| Home `TryOnFeature` | Home try-on section (see the home doc) |

## Notes & gotchas

- Rings with a 3D model are tracked (§3a); every other piece is placed by hand. Copy calls both renderings "an illustration".
- The tracker needs most of the hand in the picture: close crops of a finger (several of the catalog's own "worn" photos) find no hand, and the ring waits to be placed by hand. Tested 2026-10-22 on six catalog photos (three hands found, the back of the hand toward the lens in each) and on a canvas stream of a drifting hand standing in for the camera (the ring followed; held still, it moved 1–2 px).
- The tracker's engine and model load from jsDelivr and Google's model storage. A theme should host both itself (version-locked, and free of a content-security policy's objections).
- MediaPipe logs its own start-up lines to the console (`gl_context`, `landmark_projection_calculator`); they are harmless.
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
