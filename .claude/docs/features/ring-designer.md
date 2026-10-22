# Ring designer

A full-page configurator at `#/designer` where a visitor designs an engagement ring step by step. A real-time 3D view builds the ring as it is chosen; the visitor can turn it 360° at any moment and see it in a studio, in its box in the salon, or on a porcelain hand, under five lights. The price is itemised and updates with every choice. The atelier's notes and a budget finder guide the choices; the finished design goes to the bag, a design consultation, the try-on studio, a share, or the visitor's saved designs. It is a prototype: the stones and the 3D view illustrate the design, and nothing is ordered.

Scope: `src/pages/Designer.tsx`; the page's parts `src/components/designer/RingViewer.tsx`, `src/components/designer/Glyph.tsx`, `src/components/designer/LivePrice.tsx`, `src/components/designer/RingBreakdown.tsx`, `src/components/designer/DesignNotes.tsx`, `src/components/designer/CaratField.tsx`, `src/components/designer/BudgetFinder.tsx`, `src/components/designer/DesignSpec.tsx`, `src/components/designer/outline.ts`; the 3D engine `src/components/designer/three/stage.ts`, `src/components/designer/three/lighting.ts`, `src/components/designer/three/setups.ts`, `src/components/designer/three/ringModel.ts`, `src/components/designer/three/parts.ts`, `src/components/designer/three/gems.ts`, `src/components/designer/three/materials.ts`; `src/data/ring.ts`, `src/data/ringCopy.ts`, `src/data/ringPrice.ts`, `src/data/ringAdvice.ts`, the integration points in `src/store.tsx`, `src/App.tsx`, `src/components/lineDetails.ts`, `src/components/cart/CartLineItem.tsx`, `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`, `src/components/contact/AskSheet.tsx`, `src/components/visit/VisitFlow.tsx`, `src/data/visits.ts`, `src/components/tryon/*`, `src/components/share/ShareSheet.tsx`

## 1. Route and ways in

| Where | What |
|---|---|
| Route | `{ name: 'designer'; query: Query }`, `#/designer` (`parseHash`), `href.designer(query?)`. `App.tsx` loads the page with `lazy(() => import('./pages/Designer'))` in a `<Suspense fallback={<div className="min-h-screen" />}>`, keyed by `route.query.r ?? route.query.from ?? ''` so a link to another design or house design opens fresh. |
| Address | `?r=<code>` (the design, §2.3), `?step=<StepId>` (omitted for `stone`), `?from=<preset id>` (opens a house design, e.g. `?from=bonsecours`), `?edit=1` (opened from a bag line's Edit, §5). The page rewrites `r`, `step` and `edit` with `replaceQuery` 400 ms after each change. |
| Tab title | `headFor` `designer`: “Design Your Ring” / “Créer votre bague”, with its own description. |
| Page transition | `labelFor` `designer`: `['Sur mesure', 'Your <em>ring</em>']` / `['Créée avec vous', 'Votre <em>bague</em>']`. |
| Desktop menu (`SiteMenu`) | Rail item `designer` (“Design your ring” · *Sur mesure* / “Créer votre bague” · *sur mesure*) between Rentals and the Atelier; page `g:designer` (“The ring designer” / “Créer votre bague”, `IMG.sketchRings`, CTA “Design your ring”). |
| Phone menu (`Header`) | “Design your ring” / “Créer votre bague”, above the Atelier. |
| Footer | Maison column: “Design your ring” / “Créer votre bague”. |
| Search | Door `g:designer` (“The ring designer” / “Créer votre bague”), `KEYWORDS['g:designer']` and `ALIASES['g:designer']`. |
| Piece page (`Product.tsx`) | Under the actions, a link card with the eyebrow “The ring designer” / “Créer votre bague”: for the catalog rings that are presets (`PRESETS[].slug`), “Make it yours: another stone, other claws, another band, seen in 3D as you choose.” → `?from=<id>`; for `type === 'commission'`, “Or design it yourself, stone by stone, seen in 3D and priced as you choose.” |
| Chapters (`Category.tsx`) | The engagement signature's “Design your own” opens the designer. The Custom chapter's hero has “Design your ring” (`btnOnDark`) and “Book a design consultation”. |
| Home (`SketchToRing`) | A `link-line` under the buttons: “Or design it yourself, in 3D” / “Ou créez-la vous-même, en 3D”. |
| Account | “Design another ring” / “Créer une autre bague” beside the kept designs (§8). |

Where the ring starts: `decodeDesign(query.r)`, else `PRESETS.find(id === query.from)`, else the draft (`designDraft`, with the note “Welcome back. Your ring is as you left it.” and “Start afresh”), else `DEFAULT_DESIGN`.

## 2. The model (`src/data/ring.ts`)

### 2.1 A design

`RingDesign` = `stone { type, shape, carat, colour, clarity, grade }`, `setting { style, height, cathedral, sides, sideCarat }`, `prongs { count: 4 | 6, double, tip, vTips, compass }`, `band { form, stones, coverage, width, taper }`, `metal { band, head, finish }`, `details { hiddenHalo, peekaboo, surprise, milgrain, engraving, font }`, `size: string | null`.

| Choice | Values |
|---|---|
| Stone | `diamond`, `sapphire`, `ruby`, `emerald` |
| Shape | `round`, `oval`, `cushion`, `emerald`, `radiant`, `princess`, `asscher`, `pear`, `marquise`, `heart` |
| Colour / clarity (diamonds) | `D`–`J` / `IF`, `VVS1`, `VVS2`, `VS1`, `VS2`, `SI1`, `SI2` |
| Grade (coloured stones) | `fine`, `extra`, `exceptional` |
| Setting | `solitaire`, `halo`, `three-stone`, `bezel`; height `low`, `classic`, `high`; cathedral shoulders; side stones `round`, `pear`, `baguette` |
| Claws | 4 or 6, double, tip `round`, `eagle` (“eagle claw”), `tab`; V-claws at a stone's points; compass claws |
| Band | form `classic`, `knife`, `split`, `twist`; stones `none`, `pave`, `channel`; coverage `half`, `three-quarter`, `full`; width; tapered |
| Metal | band `platinum`, `18k-white`, `18k-yellow`, `18k-rose`; head (the claws, or a bezel's rim) `match`, `platinum`, `18k-white`; finish `polished`, `satin`, `hammered` |
| Details | hidden halo, accent diamonds (`peekaboo`), surprise diamond, milgrain, engraving (18 characters, `ENGRAVING_MAX`) in `script`, `serif` or `block` |
| Ranges | `CARAT` 0.3–4 (0.01), `SIDE_CARAT` 0.1–0.75, `WIDTH` 1.6–3 mm (0.1), `MAGIC_CARATS` 0.5, 0.75, 1, 1.5, 2, 2.5, 3, `RING_SIZE_VALUES` 4–9 by halves |

`DEFAULT_DESIGN`: 1 ct round diamond, G VS1, classic-height solitaire, four round claws, classic 2.0 mm plain band, platinum, polished, no size. `DESIGN_SLUG` (`'bespoke-engagement-commission'`) is the catalog piece a designed ring rides on in the bag.

### 2.2 Measured: `layoutOf`

Everything the 3D view draws and the price counts comes from `layoutOf(d)` (millimetres): the centre stone's length, width and depth (`stoneSize`, from `CUTS[shape]` and the stone's specific gravity), the heights above the finger (band top, culet, girdle, table: `HEIGHT_GAP` low 0.25, classic 0.9, high 1.8, +0.6 with cathedral), the band (inner radius from `innerDiameter(size)`, size 6.5 when unsized), the claw angles (`prongAngles`, V-claws by `vTipAngles`), every small stone (halo, hidden halo, side stones, pavé or channel, accent diamonds, surprise), carat totals, the metal volume and grams per alloy (`DENSITY`), and the rise.

`normalize` keeps a design buildable: carats and widths clamped, side stones at most 0.6 × the centre; a twist or knife band can't take a channel (becomes pavé); six claws can't be doubled; a halo clears the hidden halo; a bezel clears the hidden halo and the accent diamonds; V-claws only on shapes with points; compass claws only on round, cushion, princess and Asscher (not a princess with V-claws); the engraving keeps only what can be engraved (`engravable`: letters, figures, spaces and `. , ' ’ & - – · : / + ! ? “ ” " « » ( ) ♥`, 18 at most); a size outside `RING_SIZE_VALUES` is cleared. `patch(d, p)` merges a `DesignPatch` and normalises.

### 2.3 The code

`encodeDesign(d)` writes `1` (the version) + each enum's index in base 36, then `-` flags (base 36 bits: cathedral, six claws, double, V-claws, compass, taper, hidden halo, accent diamonds, surprise, milgrain), the carat × 100, the side carat × 100, the width × 10, the size, and the engraving (`encodeURIComponent`). `decodeDesign(code: unknown)` returns `null` for anything that isn't a version-1 code, falls back to defaults for unknown values, and drops an engraving that won't decode. Example: `10133111110103000-e8-100-25-20-6-Toujours%20%C2%B7%202026`.

Two codes per design:

| Code | Built by | Carried by |
|---|---|---|
| The visitor's own | `encodeDesign(design)` | the address (`?r=`) and the draft, so a choice set aside (claws chosen before a bezel) comes back with the setting |
| The ring as it will be made | `designCode(d)` = `encodeDesign(canonical(d))` | the bag, visits, the try-on, “Ask a jeweller”, the share and saved designs |

`canonical(d)` sets back what doesn't apply to the ring as made: claws under a bezel, side stones without three stones, how far round on a plain band, the lettering when there are no words; the engraving is trimmed. Rings made the same therefore have one code, and stack in the bag. `isDesignCode(code)` is true only for a code that decodes and encodes back to itself; the store uses it on everything it reads back (`tns-cart`, `tns-designs`, `tns-design-draft`), so a cut-off or edited code is dropped rather than priced or shown differently.

The format is a contract once codes sit in bags: the option lists only ever grow at their end, and any other change takes a new version character.

### 2.4 House designs

`PRESETS`: `bonsecours`, `notre-dame`, `ville-marie`, `basilique`, `maisonneuve` (each with the `slug` of its catalog ring) and `sherbrooke` (“Sherbrooke Sapphire Halo” / “Halo saphir Sherbrooke”: a sapphire halo in yellow gold, no catalog piece). `surprise()` picks a shape, a setting and a band that suit each other.

## 3. Price (`src/data/ringPrice.ts`)

Cost-plus: `costsOf(d)` (CAD) counts the centre stone (diamonds: `PER_CARAT` steps × `COLOUR_K` × `CLARITY_K` × `SHAPE_K`; coloured stones: `GEM_PER_CARAT` by grade, +18% per carat above 1), side stones, each set of melee (`MELEE_PER_CARAT` 2200; accent diamonds and the surprise 2400; baguettes `BAGUETTE_PER_CARAT` 2300), band and head metal by grams × `METAL_RATE` (`src/data/costing.ts`, exported with `LABOUR_RATE_CAD` 95), CAD 280, bench hours × 95, setting labour per stone, finish, the report and shipping. The reports: the centre diamond's GIA report and, on a three-stone ring, one for each side diamond (`giaReport`: 165 from 0.50 ct, 95 below; the statement line “GIA grading reports · side stones” / “Two natural diamonds, graded and inscribed”), as the house says (`HOUSE.natural`); a coloured centre stone's gemmological report is 240. Melee (pavé, halo, accents) are priced as graded parcels, without reports of their own. `ringPrice(d, currency)` = the sum × `MARKUP` 1.34, to the nearest 10 CAD; USD through `toUSD`.

A designed ring is paid as the atelier works (owner decision, 2026-10-22: "whichever is best"): `DEPOSIT_SHARE` (30%) at checkout, `designDeposit(price)` = 30% of one ring's price to the nearest ten in the market's currency (never more than the price), which reserves its stones and starts the drawings and the wax; the balance is due when the visitor approves the final design, before casting (`HOUSE.deposit`). The bag, the cart page, checkout, the designer's review and the try-on all show the same deposit (see [../commerce-logic.md](../commerce-logic.md)).

`priceRing(d, currency, locale)` returns `{ lines, price, metalWeight, labourHours, layout }`: `CostLine`s in `materials` (the centre stone; “Side stones · round” for a three-stone pair; “Halo diamonds”, “Hidden halo diamonds”, “Pavé diamonds” or “Channel diamonds”, “Accent diamonds”, “Surprise diamond”; the metal, split into band and head when they differ), `making` and `services` (lines converted with `CAD_TO_USD`), included services (engraving, one resize in the first year unless the band is set all the way round, lifetime care), and `margin` (“Design, salon & maison margin”) = the price minus the rest, so the statement reconciles exactly. The house designs price within about −9% to +1% of their catalog rings (Ville-Marie 20,230 against 22,250 CAD).

## 4. The atelier's notes (`src/data/ringAdvice.ts`)

`adviseOn(d, { currency, budget, done }, locale)` returns `Note { id, step, tone, text, fix? }`; tones are `care`, `tip`, `value`, `good`. A note with a `fix` offers it as one tap (a `DesignPatch`).

| id | Step | When | Fix |
|---|---|---|---|
| `step-clarity` | stone | step-cut diamond in SI1/SI2 | VS2 |
| `magic` / `under-magic` | stone | at or just over a half or whole carat, where the price steps up (0.5–3; with the saving) / up to 0.1 ct under one | the lower weight |
| `warm-good` / `warm-white` | stone | I or J in gold / in white metal | H |
| `faces-up` | stone | oval, pear, marquise: the round it looks like | — |
| `budget` | stone | over the budget: “This design is {over} above your budget.” | — |
| `halo`, `cathedral-low`, `snag` | setting | halo; cathedral on a low setting; high setting with pavé or a halo | classic height |
| `bezel`, `points`, `tabs`, `six`, `emerald-soft` | claws | bezel; a pointed shape without V-claws; step cut without tabs; round from 1.25 ct on four claws; an emerald stone without tabs | V-claws, tabs, six claws |
| `width`, `thin-pave`, `eternity`, `split-small` | band | from 2 ct on a band under 1.8 mm; pavé under 1.8 mm; stones all the way round; split shank under 0.75 ct | 2.0 / 1.8 mm, classic band |
| `white-claws`, `two-tone` | metal | colourless diamond in yellow or rose with matching claws; a white head on a gold band (claws or a bezel) | platinum claws |
| `milgrain-knife`, `engraving`, `size`, `complete` | details, size, review | milgrain on a knife edge; an engraving; no size; every step done with a size | remove milgrain |

`stonesWithin(d, budget, currency)` finds the largest stone each strategy allows (`balanced`, `larger`, `finer`; coloured stones trade grade for size), the rest of the design unchanged.

## 5. The page (`src/pages/Designer.tsx`)

- **Layout.** Desktop: a two-column grid (`lg:grid-cols-[minmax(0,1fr)_minmax(420px,34%)]`). The viewer is sticky under the header (`top-[111px]`, full height); the panel scrolls with the page, and its price-and-steps block is sticky (`lg:sticky lg:top-[111px] lg:z-10`). Phones: the viewer is sticky at the top (`h-[38svh] min-h-[260px] max-h-[400px]`, `z-10`), except on a screen under 520 px tall (a phone on its side), where it sits in the page (`static`, `78svh`) so the steps can be reached. A fixed bar (`z-40`, `data-fab-avoid`) holds the live price, the progress line and the way on (“Next: …”, then “Add to bag” / “Update the bag” / “Go to bag”); at 360 px and under, Next shows the step's name with an arrow (the full phrase is its `aria-label`). The bar slides away (`translate-y-full`, `inert`) once the page's end comes up the screen: an `IntersectionObserver` on a sentinel after `VisitBand`, whose root reaches 100 000 px above the screen so a jump past it counts too. `VisitBand` (`purpose="design"`, the design as its piece) closes the page.
- **Steps** (`STEPS`): stone, setting, prongs (“Claws”), band, metal, details, size, review. The step rail shows 01–08, gold when chosen, a gold dot where a `care` note waits. A step counts as chosen once left (size: once a size is set); “n of 7 chosen”. Each step has its groups of options, its notes (`DesignNotes`), the live statement (`RingBreakdown`, open on the review) and Back / Next. Changing step moves the focus to the step's heading (`#designer-step`, `tabIndex={-1}`) and scrolls to the top of the steps, below the ring while it is pinned (its measured height).
- **Options.** `Group` is a `role="group"` labelled by its heading (no heading when the content brings its own, as `CaratField`). `Choice` tiles (glyph, name, note, the price change it would make: `signed(delta)`, “Same price”, “Chosen”), `Toggle` switches (`role="switch"`), `Segments` pills, the colour and clarity `Scale`s (each grade read as “G, +$420”), `CaratField`, `BudgetFinder`. An unavailable option prints why in place of its note, at full contrast (its drawing and name are dimmed): “Not offered on this profile: pavé is set instead.” (channel on a twist or knife edge), “Only stones with points need them.”, “For round and square stones.”, “The halo already circles the stone.”, “The bezel’s rim leaves no room beneath the stone.”, “The bezel’s rim closes round the head.”. The stone step opens with the house designs and “Surprise me”.
- **Changes.** `commit(next, name, field?)` records undo history (50; a dragged slider or typed engraving records once per 900 ms), names the change on the ring (`caption`) and announces it (`aria-live`) with its price; a new `care` note is announced after it. Undo and redo read the stacks from refs (StrictMode runs an updater twice, so no updater sets other state). Undo / Redo / Start afresh buttons; ⌘Z or Ctrl+Z, with Shift or Ctrl+Y to redo, outside text fields and never while a modal overlay is open (`[aria-modal="true"]:not([inert])`). When the control in hand goes away (a note's fix applied, a kept design removed, Start afresh) the focus lands on the next kept design or the step's heading.
- **The budget** (`BudgetFinder`) is kept with its currency: in the other market the page leaves it aside and the field empties; back in its market it returns. The field takes the focus when opened; its × gives it back to “Designing to a budget?”. The field and “Find the stones” stack when the panel is under 24 rem (`@container`, `@sm:flex-row`). The placeholder is 12,000 CAD or its `toUSD` (8,760 USD).
- **Completion.** When the seventh step is chosen with a size, the ring turns once (`turnAround`) and the viewer says “Every choice made”; the review shows the hallmark and “Every choice is made. The atelier can begin from this design.”, or the steps still to choose.
- **The review.** The design in words (`describeDesign`), “Made to order · about 8 weeks · final sale” (`leadTimeWeeks` of the commission; made-to-order pieces are final sale, `HOUSE.returns`), then the payment: “$3,050 today, a 30% deposit; $7,130 when you approve the final design.” (`designDeposit`; the sentence is `RING_COPY.todayShare` and `onApproval`, shared with the try-on), “Add to bag” (without a size it goes to the size step and flags it) or “Go to bag” when that exact line is in the bag, “Book a design consultation” (`VisitButton`, `onBefore={keepDesign}`, `{ purpose: 'design', pieces: [{ slug: DESIGN_SLUG, size, design }] }`) with “An hour in the salon, or 30 minutes by video, with this design on the bench.” (the lengths from `visitLength('design', mode)`), then “View on you”, “Keep this design”, Share, “Ask a jeweller” (`openAsk([], [code])`), “Save a picture” (each 44 px tall), the specification (`DesignSpec`: every diamond lists its GIA report; a bezel's metal row is “Bezel”) and an honesty note: “An illustration of your design. Before anything is cast, a jeweller confirms each measure with you and shows you the stones themselves.” The size step's link “Book a visit to be sized” opens the same consultation.
- **Editing a ring in the bag.** A bag line's Edit opens `href.designer({ r: code, edit: '1' })`. While editing, the bag button reads “Update the bag”: the line gives way to the new design, keeping its quantity (added to any line already holding that design), and the page goes on editing the new line.
- **Saved.** “Your designs” lists the visitor's kept designs (thumbnails) to reopen or remove (“Remove {title}”, shown on touch screens, on hover or focus elsewhere).

## 6. The viewer (`RingViewer.tsx`)

Loads the engine with `import('./three/stage')` (its own chunk), checks WebGL 2 first, and builds the first ring inside `onStageClear`. The veil (“Preparing the 3D view…”) stays until the stage reports `onReady` (its shaders compiled). Without WebGL 2 it draws `Sketch` (the band and the stone's outline) with “This browser can’t show the ring in 3D. Every choice still applies, and the summary lists them all.”; a lost context offers “Show it again” (`btnQuiet`).

Controls: Studio / Salon / On the hand (`role="group"`), Light (presets with swatches, Brightness 0.5–1.6, Light angle, Fire 0–2, Reset), Views (Three-quarter, Front, Profile, From above, Inside the band), 360° (a slow turn; hidden with reduced motion), See its parts (exploded, with labels that follow the parts), Save a picture (1600 × 2000 JPEG, hidden under `sm`), Full screen. The chips stack `gap-1.5` on phones so five fit the 260 px view. A panel closed from inside it (Escape, its ×, a view chosen) hands the focus back to its button; a press elsewhere just closes it. The canvas is focusable: arrows turn it, + and − zoom. The wheel zooms only with Ctrl or ⌘ (a trackpad pinch) or in full screen, so the page still scrolls over it. The hint (“Drag to turn · Ctrl + scroll to zoom”) is espresso at 70% on the light rooms, `white/60` in the salon, and steps aside while a change's caption shows. The page's handle (`ViewerApi`): `snapshot(kind, w, h)`, `turnAround()`, `focus(on)`. Design changes reach the stage at most once a frame; a step change (or an engraving appearing) moves the camera.

## 7. The 3D engine (`src/components/designer/three/`)

| Module | What it does |
|---|---|
| `stage.ts` `Stage` | `WebGLRenderer` (sRGB, `NeutralToneMapping`, pixel ratio ≤ 1.75, lowered by 0.25 steps when frames run slow), `PerspectiveCamera` (fov 28, 34 on tall stages), `OrbitControls` (damped, no pan, distance and polar limits from the setup), `EffectComposer` on a 4× multisampled half-float target → `RenderPass` → `UnrealBloomPass` (strength 0.06 + 0.09 × fire, radius 0.22, threshold 2.4: only sparks) → `OutputPass`. Draws only while something moves (`wake`), pauses off screen and in hidden tabs. The first build is held, compiled (`compileAsync`), then played as the camera comes in. `focus` frames each step (`FRAMES`), scaled to the ring; `explode` frames all the parts; `snapshot('card' \| 'tryon' \| 'view')`. |
| `lighting.ts` | Five rooms, `studio` (a light tent with black flags), `daylight`, `salon`, `candle`, `gallery`, each rendered twice: prefiltered (PMREM) for the metals, and as a 512 half-float cube for the stones, whose walls are dimmed (`GEM_WALLS`) and, in the tent, darkened above (the lens port) so a diamond shows contrast. The light angle turns both together. |
| `setups.ts` | `studio` (travertine floor fading into the backdrop, a contact shadow along the band), `salon` (ivory leather box, velvet rolls with the ring in the slit, satin lid printed “TERESA & SONS”, walnut table), `hand` (a porcelain hand polygonised from a distance field with `MarchingCubes`, its ring finger sized to the ring, cached per size). `SETUP_LIGHT` gives each its light. |
| `ringModel.ts` `RingModel` | The ring as parts (`band`, `head`, `centre`, `halo`, `pave`, `sides`, `accents`, `engraving`), each rebuilt only when its signature changes. Entrances: the band draws itself round, the head rises, each claw grows, the stone drops in turning, small stones ripple in, the engraving fades in. A change of measure only (weight, width, size) swaps parts without entrances. Metals tween to a new alloy. Explode offsets and label anchors. |
| `parts.ts` | Swept band sections (comfort, knife, two strands for split and twist), tapered claw wires (round, eagle, tab, V-claws; flat claws keep their width along the stone's edge), basket rails, seat, bezel rim and a smooth lofted cup, halo gallery, cathedral arches, and the placements of every small stone, bead and milgrain grain. |
| `gems.ts` | Faceted stones from each cut's outline (`outline.ts`): brilliants (table, stars, kites, girdle facets, pavilion mains) and step cuts (terraces to a keel). |
| `materials.ts` | Metals (`METAL_LOOK`; finishes: polished, satin with anisotropy, hammered with a generated normal map, on the band only). Large stones are ray traced inside their own facets with a BVH (`three-mesh-bvh`): refraction, internal reflections and dispersion per channel (`GEM_LOOK`: diamond IOR 2.418…). Small stones use a single bounce along their own table direction. |

## 8. Integrations

| Where | Change |
|---|---|
| Bag | `CartLine.design?: string` (the ring as made, `designCode`). The line is `{ slug: DESIGN_SLUG, size, design }`; `lineKey` appends `line.design` only when there is one, so every other line keeps its stored key; `linePrice` prices it with `ringPrice(decodeDesign(line.design), currency)`. Lines read back from `tns-cart` are kept only if their design passes `isDesignCode`. `lineDetails` lists `describeDesign(...).lines` and the design's own size; `designedLine(line, designs)` gives the title and the kept picture. `CartLineItem` shows “Designed by you”, the design's title and picture, its deposit under the price (“$3,050 today”), Edit → `href.designer({ r: code, edit: '1' })`, no try-on and no struck-through price; “Save for later” keeps the design. The drawer, the cart page and checkout add “Due today” and “Balance on approval” (the deposit and the rest, each with its share of tax at checkout); gift cards pay only what is due today; the confirmation says the balance and that a jeweller will write to arrange the design consultation. The cart page shows “Made to order in our atelier: about {n} weeks.” (the longest `leadTimeWeeks` in the bag) instead of a delivery date. Checkout shows the title and picture. |
| Store | `designs` / `saveDesign` / `forgetDesign` (`tns-designs`, 12 kept, newest first, checked with `isDesignCode` on read; if storage is full they are kept without pictures) and `designDraft` / `setDesignDraft` (`tns-design-draft`, the visitor's own code). `profile.ringSize` is kept only if it is in `RING_SIZE_VALUES`. |
| Account | “Your designs” / “Vos créations” after the visits (signed in, when any are kept): each design's picture, title and price (`ringPrice`), opening the designer (`href.designer({ r })`), × to remove it (“Remove {title}”); “Design another ring” leads to a new one. |
| Ask a jeweller | `openAsk(slugs = [], designs = [])` (`askDesigns`): the sheet names each design (“Your design”), and a visit booked from it carries the design as a piece. |
| Visits | `VisitPiece.design?: string`; `VisitFlow` names and pictures a design (“Your design” / “Votre création”) in the pieces to prepare, the confirmation and the calendar file. |
| Try-on | `TryOnRequest.design?: TryOnDesign { image, title, price, code, size, onSize?, onMetal? }`. The studio tries the ring on in live 3D (2026-10-22): the hand tracked in the camera or found in a photo, the designer's own 3D ring on the chosen finger, hidden by the finger where the band goes behind it, lit for the room ([virtual-try-on.md](virtual-try-on.md) §3a). Where WebGL 2 is missing, the ring's top-down picture (`snapshot('tryon', 720, 720)`) is placed by hand instead. The price comes from the code (`ringPrice`, the market on screen), with the designer's payment sentence under it (the deposit today, the balance on approval); the metal can change on the hand (the price follows, and `onMetal` sends it back to the designer, which commits it). It offers “Add to bag” (with a size, as `designCode` of the ring as tried; a sizeless design never falls back to the commission) or “Choose your size”, and “Book a design consultation”; the rail starts with “Your design” and then the house's rings, which are tried on in 3D too. |
| Share | Subject `ring-designer`: the design's title, its lines, its picture once taken, `href.designer({ r })`. Pinterest is offered only for public pictures. |

## 9. Dependencies and size

`three` 0.186.1 and `three-mesh-bvh` 0.9.16 (dependencies), `@types/three` 0.186.0 (dev), added at the owner's request for the designer; `@mediapipe/tasks-vision` 1.0.1 for the 3D try-on's hand tracking (the same request: "download the required packages"). Build of 2026-10-22, with the 3D try-on: three.js and the ring model share a chunk (`ringModel`, 640.9 kB, 168.2 kB gzip) loaded by the designer's `stage` (77.7 kB) and the try-on's `RingTryOn` (163.5 kB, most of it MediaPipe); `Designer` 114.5 kB; all lazy. The first load is about 972 kB (303 kB gzip) across the entry (713.2 kB) and its shared chunks, none of them three.js or MediaPipe.

## Notes & gotchas

- Everything is illustrative: the stones are drawn from their cut and grade, prices are indicative, and the shapes are the atelier's working proportions. The review says so.
- Checkout takes a designed ring's 30% deposit; the balance waits for the approval of the final design (owner decision, 2026-10-22). In Shopify this is a deposit selling plan (`shopify-integration.md` B9).
- Every diamond comes with its GIA report (owner decision, 2026-10-22): `HOUSE.natural`, the announcement bar, Home's services, the piece page's FAQ and the bag's perks say so, and the designer prices a report for the centre diamond and a three-stone ring's side diamonds. Pavé and halo stones are not graded one by one by GIA in practice; if the house wants the claim literally true of every small stone, its wording is for the owner (todo.md).
- The bloom threshold must stay above the brightest backdrop (linear ~0.9): at 0.86 the whole studio glowed and the ring washed out.
- `three`'s `computeFrenetFrames` picks an arbitrary normal; flat claws pass `wire(…, side)` or they turn edge-on.
- Gem shaders compile slowly (seconds on some GPUs); that is why the first build is held for `compileAsync`. Later shapes reuse the program.
- An `IntersectionObserver` only reports crossings: a zero-height sentinel jumped over (an instant scroll to the top under reduced motion) is never seen. The phone bar's observer therefore extends its root far above the screen, so “the end has come up” is a state, not a crossing.
- The headless checks used Chrome with the GPU (ANGLE D3D11); SwiftShader also works, slowly. ANGLE's shader compiler logs precision warnings (`X4122`), which are harmless.
- In development the stage is exposed as `window.__ring` (DEV builds only) for the scratch tests.
- `CartUpsell` treats a designed ring as a `custom` piece (it is the commission underneath).

## Related docs

- [virtual-try-on.md](virtual-try-on.md) — the studio a design is tried on in
- [legacy-redesign.md](legacy-redesign.md) — visits, the drawer a design consultation opens, “Ask a jeweller”
- [sharing.md](sharing.md) — the share sheet
- [languages.md](languages.md) — `bilingual()` and French typography
- [../commerce-logic.md](../commerce-logic.md) — line identity and prices in the bag
- [../shopify-integration.md](../shopify-integration.md) — how a designed ring maps to Shopify
- [../architecture.md](../architecture.md) — routes, the store, lazy chunks
