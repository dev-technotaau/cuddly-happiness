# Motion, animation & scroll behaviour

The storefront's motion comes from four layers: Lenis smooth scrolling (driven by the GSAP ticker), GSAP 3 with ScrollTrigger (entrances, parallax, the home-hero carousel and one pinned horizontal section), Tailwind v4 transitions for UI state, and three CSS keyframes in `src/index.css`. Elements opt in to scroll reveals with `data-reveal`, `data-reveal-img` or `data-parallax`, and the page-level `useReveal` hook animates them. `prefers-reduced-motion` turns off Lenis, the reveal system, the product-page intro, the pinned section and most of the hero, but many GSAP micro-interactions, CSS transitions and keyframes still run. Each overlay stops the shared Lenis instance and locks `overflow` itself; no shared lock manager exists.

Scope: `src/components/SmoothScroll.tsx`, `src/components/useReveal.ts`, `src/components/HomeHero.tsx`, `src/components/home/MakingScroll.tsx`, `src/components/video/useInViewPlay.ts`, `src/index.css`, and every motion, timer, observer and scroll call site found by sweeping `src/**/*.{ts,tsx}`.

> **Versions.** `package.json` declares `gsap ^3.15.0`, `lenis ^1.3.26` and `tailwindcss ^4.0.0`. The installed builds are GSAP 3.15.0, Lenis 1.3.26 and Tailwind CSS 4.2.2. Statements tagged *(library source)* were checked against those files in `node_modules`, not only against app code.
>
> **House curve.** In this document, "house curve" means `cubic-bezier(0.16, 1, 0.3, 1)`, written in classes as `ease-[cubic-bezier(0.16,1,0.3,1)]`. `.editorial-zoom`, `.link-line`, every `fadeUp` usage and most 500–1400 ms UI transitions use it.

---

## 1. Motion stack at a glance

| Layer | Mechanism | Defined in | Used by |
|---|---|---|---|
| Smooth scroll | A single Lenis instance, advanced by `gsap.ticker` | `src/components/SmoothScroll.tsx` | The whole app. Overlays and the product page (PDP) reach it through `getLenis()` |
| Scroll-linked tweens | GSAP ScrollTrigger, the only registered plugin | `src/components/useReveal.ts`, `src/components/HomeHero.tsx`, `src/components/home/MakingScroll.tsx` | Home, Category, Product, Atelier, Wishlist, Gift cards |
| Time-based tweens | `gsap.from` / `to` / `fromTo`, `gsap.timeline`, `gsap.quickTo` | `HomeHero`, `Header`, `Product`, `Gallery`, `CategoryIndex`, `WishButton` | — |
| CSS transitions | Tailwind v4 `transition-*` / `duration-*` / `ease-*`, plus the `.editorial-zoom` and `.link-line` classes | component `className`s, `src/index.css` | Everywhere |
| CSS keyframes | `marqueeScroll`, `grainShift`, `fadeUp`; Tailwind `animate-pulse` and `animate-bounce` | `src/index.css`, Tailwind theme | Header, PressStrip, App, Testimonials, Treasured, UndoToast, TryOnFeature, HomeHero |
| Timers and observers | 7 timer sites (6 `setTimeout`, 1 `setInterval`), 3 `IntersectionObserver`s, 1 `requestAnimationFrame` | see §8 and §9 | — |

---

## 2. Smooth scrolling (Lenis)

### 2.1 Placement and lifecycle

`src/App.tsx` nests the providers as `StoreProvider > TryOnProvider > SmoothScroll > div.min-h-screen`. The inner div contains `Header`, `<main>` (routes), `Footer`, `CartDrawer` and the film-grain div. `TryOnStudio` is rendered by `TryOnProvider`, which puts it outside `SmoothScroll`. `SmoothScroll` renders only `<>{children}</>` and owns two effects. It reads `route` from `useStore()`, so it re-renders on every store change, but its effects depend only on `route`.

**Creation effect** (`useEffect`, deps `[]`):

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
lenisInstance = lenis
lenis.on('scroll', ScrollTrigger.update)
const tick = (time: number) => lenis.raf(time * 1000)
gsap.ticker.add(tick)
gsap.ticker.lagSmoothing(0)
```

- With reduced motion the effect returns before doing anything: no Lenis, no ticker callback, and `lagSmoothing` is left alone.
- `lenis.on('scroll', ScrollTrigger.update)` keeps ScrollTrigger in step with every Lenis frame.
- `tick` converts the GSAP ticker time from seconds to milliseconds for `lenis.raf`. Lenis's `autoRaf` stays at its default `false`, so the GSAP ticker is the only thing that advances Lenis.
- `gsap.ticker.lagSmoothing(0)` turns off GSAP lag smoothing for the whole app; internally the threshold becomes `Infinity` *(library source)*. The cleanup does not restore it.
- Cleanup calls `gsap.ticker.remove(tick)` and `lenis.destroy()`, which removes Lenis's listeners and its `lenis*` classes from `<html>`. It then sets `lenisInstance = null`.
- `src/main.tsx` renders `<App />` inside `React.StrictMode`, so in development this effect runs mount, cleanup, mount. Lenis is constructed twice and the first instance is destroyed.

**Route effect** (`useEffect`, deps `[route]`): see §11.1.

### 2.2 Options

| Option | Value in this app | Origin |
|---|---|---|
| `duration` | `1.25` (seconds) | explicit |
| `easing` | `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`, identical to Lenis's built-in `defaultEasing` *(library source)* | explicit |
| `lerp` | `0.1`. Not used for wheel or programmatic scrolls: Lenis's `Animate.advance` takes the duration/easing path whenever both are set *(library source)* | default |
| `wrapper` / `content` | `window` / `document.documentElement` | default |
| `smoothWheel` | `true` | default |
| `syncTouch` | `false`, so touch scrolling stays native | default |
| `autoRaf` | `false`; `gsap.ticker` drives Lenis | default |
| `anchors` | `false`; Lenis does not intercept `#` links | default |
| `autoToggle`, `allowNestedScroll`, `infinite`, `stopInertiaOnNavigate` | `false` | default |
| `overscroll` | `true` | default |
| `orientation` / `gestureOrientation` | `'vertical'` / `'vertical'` | default |
| `wheelMultiplier` / `touchMultiplier` | `1` / `1` | default |
| `respectReducedMotion` | `true` (see §12) | default in Lenis 1.3.26 |

### 2.3 Exposure: `getLenis()`

The instance is a module-level singleton, `let lenisInstance: Lenis | null`, read through `export const getLenis = () => lenisInstance`. There is no React context or hook. Every consumer null-checks the result because `getLenis()` returns `null` in two cases: under reduced motion, and on first mount before `SmoothScroll`'s effect has run (React runs child effects before parent effects).

| Consumer | What it does with Lenis |
|---|---|
| `src/components/CartDrawer.tsx` | `stop()` while `cartOpen` is true, `start()` in the cleanup |
| `src/components/pdp/Reviews.tsx`, local hook `useModalLock` | `stop()` / `start()` for `MediaLightbox` and `WriteReview` |
| `src/components/video/VideoViewer.tsx` | `stop()` / `start()` |
| `src/components/tryon/TryOnStudio.tsx` | `stop()` / `start()` |
| `src/pages/Product.tsx` | `scrollTo(el, { offset })` in `handleAdd`, `scrollToId` and `scrollToReviews` |

### 2.4 Lenis behaviours the app depends on *(library source)*

- **Native scroll target.** Lenis moves the real window with `window.scrollTo({ top, behavior: 'instant' })`; it does not transform a wrapper. As a result, `position: sticky` columns, IntersectionObservers and ScrollTrigger all work without a `scrollerProxy`.
- **Wheel only.** Lenis smooths wheel input. Touch input stays native because `syncTouch` is `false`.
- **Stopped state.** After `stop()`, Lenis calls `preventDefault()` on wheel and touch events (its listeners are registered with `passive: false`), unless the event path contains an opt-out attribute (next bullet). `scrollTo()` returns without scrolling unless it is called with `force: true`.
- **Opt-out attributes.** Lenis ignores an event, leaving it to the browser and never preventing it, when any element on the event's composed path up to `<html>` has:
  - `data-lenis-prevent` (any event),
  - `data-lenis-prevent-wheel` (wheel events),
  - `data-lenis-prevent-touch` (touch events),
  - `data-lenis-prevent-vertical` or `data-lenis-prevent-horizontal` (by gesture direction).

  This app uses `data-lenis-prevent` on overlays and their scroll panes (§10) and `data-lenis-prevent-wheel` on the shoppable-video rail (§7.2).
- **Programmatic `scrollTo(target, opts)`** uses the instance's `duration` (1.25 s) and `easing` unless overridden; `immediate: true` jumps without animating. For an element target, Lenis subtracts the element's computed `scroll-margin-top` (and the root's `scroll-padding-top`) and then adds `offset`.
- **State classes on `<html>`.** `lenis` is always present. `lenis-stopped`, `lenis-locked`, `lenis-scrolling` and `lenis-smooth` are added while those states are active.

### 2.5 Lenis CSS

`src/index.css` includes only part of Lenis's recommended stylesheet:

```css
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
```

The installed `lenis/dist/lenis.css` also contains the following rules, which this project leaves out:
- `.lenis:not(.lenis-autoToggle).lenis-stopped { overflow: clip; }`
- `overscroll-behavior: contain` on `[data-lenis-prevent]`, `-wheel`, `-touch`, `-vertical` and `-horizontal` descendants of `.lenis`
- `.lenis.lenis-smooth iframe { pointer-events: none; }`
- the `.lenis.lenis-autoToggle` transition rule

Instead, each overlay locks overflow by hand (§10).

---

## 3. GSAP setup and conventions

- **Imports and plugins.** Files import `import gsap from 'gsap'` and `import { ScrollTrigger } from 'gsap/ScrollTrigger'`. `gsap.registerPlugin(ScrollTrigger)` runs at module scope in `SmoothScroll.tsx`, `useReveal.ts`, `HomeHero.tsx` and `MakingScroll.tsx`; registering more than once is harmless. No other plugin is registered.
- **Defaults.** `gsap.defaults()` is never called, so an unspecified ease falls back to GSAP's `power1.out` and an unspecified duration to 0.5 s.
- **Lifecycle patterns in use:**

| Pattern | Where | Cleanup |
|---|---|---|
| `gsap.context(fn, scopeRef)` inside `useLayoutEffect` | `useReveal`, `HomeHero` (two effects), `Product` (PDP intro) | `ctx.revert()` |
| `gsap.matchMedia().add(query, fn)` inside `useLayoutEffect` | `MakingScroll` | `mm.revert()` |
| Bare tweens in `useEffect` or event handlers | `Header`, `CategoryIndex`, `Gallery`, `WishButton`, and in `HomeHero` the `quickTo` setters and the `go()` timeline | none |

- **Scoping.** Inside a context that has a scope, selector strings only match descendants of the scope element. This includes `gsap.utils.toArray('[data-reveal]')` *(library source)*. `HomeHero`'s `go()` uses `gsap.utils.selector(root)` to get the same scoping. `MakingScroll`'s `gsap.matchMedia()` has no scope, so its `'[data-making-progress]'` selector searches the whole document.
- **Inline style residue** *(library source)*. GSAP animates through inline styles:
  - A transform tween that ends at identity leaves `transform: translate(0, 0)` on the element, because GSAP 3.15's `_renderCSSTransforms` falls back to that string.
  - While a from-state is applied, the element carries a non-identity transform.
  - The first time GSAP touches an element, it folds Tailwind v4's individual `translate` / `rotate` / `scale` properties into its own `transform` and sets those properties to `none` inline. Examples: the `-translate-y-1/2 -rotate-90` side label in `HomeHero`, and the `scale-x-0` progress line in `MakingScroll`.
  - `ctx.revert()` and `mm.revert()` remove the inline styles GSAP recorded.

**Ease vocabulary**

| Ease | Used for |
|---|---|
| `expo.out` | Entrances: reveals, the PDP intro, hero headline lines and fades, mega-menu items, the `CategoryIndex` preview, the `Gallery` stage, and the hero background image settling after a slide change |
| `expo.inOut` | Clip-path wipes: the hero frame, the hero background and inset slide wipes, `data-reveal-img` |
| `expo.in` | Hero headline lines leaving on a slide change |
| `power3.out` | Pointer followers (`quickTo`) in `HomeHero` and `CategoryIndex` |
| `none` | Everything scrubbed to scroll (hero scroll-out, parallax, `MakingScroll`) and the 7 s hero progress bar |
| `elastic.out(1, 0.4)` | `WishButton` heart pop |
| GSAP default (`power1.out`) | Fade-out of the outgoing hero `[data-fade]` elements in `go()` |

---

## 4. GSAP inventory

### 4.1 Home hero carousel (`src/components/HomeHero.tsx`)

The hero has three slides (`SLIDES`) and `DURATION = 7` (seconds). Data attributes are the animation hooks:

| Attribute | Element |
|---|---|
| `data-hero-frame` | Wrapper of the background stack (`absolute inset-0`) |
| `data-bg={i}` and `data-hero-bg` | One background layer per slide (`absolute -inset-[4%] overflow-hidden`). React controls its inline `zIndex` (`2` active, `1` otherwise) and `clipPath` (`inset(0 0 0 0%)` active, `inset(0 0 0 100%)` otherwise) |
| `data-hero-inset` | The framed inset `figure` (`hidden … lg:block`) |
| `data-inset-img={i}` | Inset image per slide, with inline `zIndex` 2/1 and `clipPath` `inset(0% 0 0 0)` / `inset(100% 0 0 0)` |
| `data-hero-meta` | The vertical side label ("Joailliers · Montréal · Est. 1962") and the controls row |
| `data-hero-copy` | The copy column |
| `data-slide={i}` | Per-slide copy block. Inactive blocks get `pointer-events-none absolute inset-x-0 bottom-0 opacity-0` and `aria-hidden` |
| `data-line` | Inner span of each headline line (3 per slide) |
| `data-fade` | Eyebrow `p`, body `p`, CTA `a` and spec `dl` (4 per slide) |
| `data-progress` | Gold fill inside the `h-px w-28` progress track (`origin-left`) |

Each headline line is clipped by its own outer span, and GSAP moves the inner `data-line` span:

```tsx
<span className={`block overflow-hidden pb-[0.24em] -mb-[0.16em] ${/* per-line indent classes */ ''}`}>
  <span data-line className="relative inline-flex items-start">…</span>
</span>
```

**Effect A: intro, scroll-out and pointer parallax.** It runs in `useLayoutEffect` with deps `[reduced]` and is skipped when `reduced` is true. Its context is scoped to the hero `<section>`.

| Call | Target | Values | Timing | ScrollTrigger |
|---|---|---|---|---|
| `gsap.from` | `[data-hero-frame]` | `clipPath: 'inset(12% 12% 12% 12%)'` to the natural state | 1.8 s, `expo.inOut` | — |
| `gsap.from` | `[data-hero-meta]` (2 elements) | `opacity: 0, y: 16` to the natural state | 1 s, `expo.out`, `stagger: 0.08`, `delay: 1.1` | — |
| `gsap.to` | `[data-hero-bg]` (3 elements) | `yPercent: 18, scale: 1.08` | `ease: 'none'` | `trigger: section, start: 'top top', end: 'bottom top', scrub: true` |
| `gsap.to` | `[data-hero-copy]` | `yPercent: -30, opacity: 0` | `ease: 'none'` | same, but `end: '70% top'` |
| `gsap.to` | `[data-hero-inset]` | `yPercent: -40` | `ease: 'none'` | same as `[data-hero-bg]` |

The effect also creates three `gsap.quickTo` setters after the context, so `ctx.revert()` does not cover them. A `pointermove` listener on the section feeds them with `nx = clientX / innerWidth - 0.5` and `ny = clientY / innerHeight - 0.5`:

| Setter | Target and property | Value | Duration and ease |
|---|---|---|---|
| `qx` | `[data-hero-inset]`, `x` | `nx * -40` px | 1.2 s `power3.out` |
| `qy` | `[data-hero-inset]`, `y` | `ny * -30` px | 1.2 s `power3.out` |
| `bx` | all `[data-hero-bg]`, `x` | `nx * 18` px | 1.6 s `power3.out` |

The cleanup removes the listener and calls `ctx.revert()`.

**Effect B: headline reveal per slide.** It runs in `useLayoutEffect` with deps `[index]` and is **not** gated by reduced motion. Its context is scoped to the section.

| Call | Target | From → to | Timing |
|---|---|---|---|
| `gsap.killTweensOf` | the same `[data-line]` elements | stops an exit tween from the slide's previous `go()` that may still hold them | — |
| `tl.fromTo` | `[data-slide="{index}"] [data-line]` | `yPercent: 115, rotate: 2` → `0, 0` | 1.4 s, `expo.out`, `stagger: 0.1` |
| `tl.fromTo` | `[data-slide="{index}"] [data-fade]` | `opacity: 0, y: 14` → `1, 0` | 1 s, `expo.out`, `stagger: 0.08`, position `'-=1'` |
| `gsap.fromTo` | `[data-progress]` | `scaleX: 0` → `1` | `DURATION` (7 s), `ease: 'none'` |

The cleanup calls `ctx.revert()`, so the progress bar restarts from 0 on every slide change.

**Slide change: `go(next)`** (`useCallback`, deps `[index]`).

`go()` does nothing if `busy.current` is true, if `next === index`, or if there is no root element. Otherwise it:
1. sets `busy.current = true`,
2. computes `target = (next + SLIDES.length) % SLIDES.length`,
3. builds an unscoped timeline (lookups go through `gsap.utils.selector(root)`) whose `onComplete` clears `busy`.

The timeline runs these steps:

| Position | Target | Tween | Duration and ease |
|---|---|---|---|
| 0 | outgoing `[data-line]` | `to yPercent: -115`, `stagger: 0.05` | 0.7 s `expo.in` |
| 0 | outgoing `[data-fade]` | `to opacity: 0` | 0.4 s, default ease |
| 0.1 | `[data-bg="{target}"]` | `clipPath inset(0 0 0 100%)` → `inset(0 0 0 0%)` | 1.4 s `expo.inOut` |
| 0.1 | `[data-bg="{target}"] img` | `scale 1.25` → `1` | 2.2 s `expo.out` |
| 0.3 | `[data-inset-img="{target}"]` | `clipPath inset(100% 0 0 0)` → `inset(0% 0 0 0)` | 1.2 s `expo.inOut` |
| `linesOut` (0.8 with 3 lines) | — | `setIndex(target)` callback, once the last outgoing line is out (0.7 s + 0.05 s per extra line) | — |

The longest tween (the image scale) ends at 2.3 s, so further slide clicks are ignored for about 2.3 s. The timeline is not inside a context and is not killed on unmount.

**Autoplay** (`useEffect`, deps `[index, go, reduced]`). Unless `reduced` is true, it calls `window.setTimeout(() => go(index + 1), DURATION * 1000)` (7000 ms) and clears the timer on re-run or unmount. `setIndex` fires 0.8 s into `go()`, so slides change about every 7.8 s, while the progress bar fills in 7 s.

**Controls and other hero details**
- **Slide buttons.** Three buttons, labelled with the eyebrow text after the `·`: "Automne", "Mariage" and "La Location". The full eyebrows are 'Collection Lumière · Automne', 'Chapitre V · Mariage' and 'Chapitre VII · La Location'. Their `aria-label`s are `Show slide 1` to `Show slide 3`. They use `transition-colors`, with `text-white` when active and `text-white/35 hover:text-white/70` otherwise.
- **Scroll hint.** A "Scroll" label (`hidden … sm:flex`) shows an `ArrowDown` icon with Tailwind `animate-bounce`.
- **CTA hover.** The CTA circle fills from the bottom: `absolute inset-0 origin-bottom scale-y-0 bg-[var(--gold-champagne)] transition-transform duration-500 ease-out group-hover:scale-y-100`.
- **`reduced`** is recomputed on every render: `typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- **Section size:** `relative h-[calc(100svh-7rem)] min-h-[680px] overflow-hidden`. The first background image has `fetchPriority="high"`.

### 4.2 "The making": pinned horizontal scroll (`src/components/home/MakingScroll.tsx`)

A `useLayoutEffect` (deps `[]`) creates `gsap.matchMedia()` and registers a single condition, `'(min-width: 1024px) and (prefers-reduced-motion: no-preference)'`. The cleanup calls `mm.revert()`. GSAP re-evaluates the condition live (for example on resize) and reverts or re-creates the tweens to match.

| Call | Target | Values | ScrollTrigger |
|---|---|---|---|
| `gsap.to` | horizontal track (`track` ref) | `x: () => -distance()`, `ease: 'none'` | `trigger: section, start: 'top 112px', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true` |
| `gsap.to` | `'[data-making-progress]'` (searched document-wide) | `scaleX: 1`, `ease: 'none'` | `trigger: section, start: 'top 112px', end: () => '+=' + distance(), scrub: true`. The trigger config is passed only if `tween.scrollTrigger` exists |

- **Distance.** `distance = () => track.scrollWidth - window.innerWidth`, so the vertical scroll distance equals the horizontal travel.
- **The 112 px start** equals the `7rem` the layout subtracts for the sticky header: `lg:h-[calc(100vh-7rem)]` on this section and `h-[calc(100svh-7rem)]` on the hero.
- **Section:** `relative overflow-hidden bg-[var(--bg-silk)] lg:h-[calc(100vh-7rem)]`.
- **Track:** `flex gap-8 overflow-x-auto px-6 py-16 lg:h-full lg:items-end lg:overflow-visible lg:px-12 lg:pb-16 lg:pt-44`.
- **Cards:** five cards, `w-[78vw] sm:w-[46vw] lg:w-[30vw]`; odd-indexed cards get `lg:mb-16`. Card images use `.editorial-zoom`. A `hidden w-[10vw] shrink-0 lg:block` spacer ends the track.
- **Header copy:** "06 · The making", the heading "From *bench* to heirloom", and the caption "Five stages · 40+ hours" under the progress line.

Below 1024 px, or with reduced motion, the track is an ordinary native horizontal scroller. The `data-making-progress` line (`h-px origin-left scale-x-0`, inside a `hidden w-48 lg:block` box) then stays at zero width.

### 4.3 PDP intro (`src/pages/Product.tsx`)

A `useLayoutEffect` with deps `[slug]`, skipped under reduced motion, runs one tween in a context scoped to the page root and reverts it with `ctx.revert()`:

```ts
gsap.from('[data-pdp-in]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.1 })
```

The `[data-pdp-in]` elements, in order:
1. availability row
2. collection/chapter eyebrow
3. `h1` product name
4. tagline
5. rating/reviews button
6. price block
7. description
8. configurator (`mt-10 space-y-9`, which contains `RentalCalendar`, `Personalizer`, `RingSize` and the engraving field)
9. actions (CTA, try-on, viewing links)
10. trust row
11. GIA block (only when `product.gia` is set)
12. accordion wrapper

That is 11 or 12 elements, so the last one starts 0.7–0.76 s after the first.

### 4.4 Header mega menu (`src/components/Header.tsx`)

A `useEffect` with deps `[megaOpen]` runs these tweens. It has no context, no cleanup and no reduced-motion check.

| Call | Target | Values |
|---|---|---|
| `gsap.to` | panel (`panelRef`) | `clipPath: megaOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)'`, 0.7 s, `expo.out` |
| `gsap.fromTo` (on open only) | the panel's `[data-mega-item]` elements: 9 category `li`s, the Gift Cards `li`, the description column and the image link (12 in total) | `{ y: 14, opacity: 0 }` → `{ y: 0, opacity: 1, stagger: 0.03, duration: 0.6, ease: 'expo.out', delay: 0.08 }` |

- **Closed state.** The panel starts with inline `clipPath: 'inset(0 0 100% 0)'` and has the class `pointer-events-none` while closed. It is `hidden … lg:block`.
- **Hover intent.** `open()` clears the pending close timer and sets `megaOpen`. `scheduleClose()` closes the menu after 140 ms. Both are wired to `onMouseEnter` / `onMouseLeave` on the "Collections" button and on the panel. Clicking the button toggles the menu.
- **Route changes.** Any `route` change closes both the mega menu and the mobile menu.

### 4.5 Category index cursor preview (`src/components/home/CategoryIndex.tsx`)

This is the desktop list only (`hidden lg:block`).

- A `useEffect` (deps `[]`) creates `xTo = gsap.quickTo(preview, 'x', { duration: 0.8, ease: 'power3.out' })` and the same for `y`. A `pointermove` listener on the `ul` feeds them `clientX - ul.left` and `clientY - ul.top`. The cleanup removes the listener only.
- A second `useEffect` (deps `[hover]`) runs `gsap.to(preview, { autoAlpha: hover === null ? 0 : 1, scale: hover === null ? 0.85 : 1, duration: 0.6, ease: 'expo.out' })`.
- The preview box (`pointer-events-none absolute left-0 top-0 z-10 -ml-[150px] -mt-[190px] h-[380px] w-[300px] overflow-hidden opacity-0`) is centred on the pointer by its negative margins.
- Inside the box every category hero image is stacked and cross-faded with `transition-opacity duration-500` (`opacity: hover === i ? 1 : 0`).
- `onMouseLeave` on the `ul` sets `hover` to `null`.

### 4.6 Gallery stage (`src/components/pdp/Gallery.tsx`)

A `useEffect` with deps `[index]` (it also runs on mount) calls:

```ts
gsap.fromTo(stage.querySelector('[data-stage-img]'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' })
```

It has no cleanup and no reduced-motion check. The `[data-stage-img]` wrapper stays mounted across views; only its content changes.

### 4.7 Wishlist heart (`src/components/WishButton.tsx`)

On click, after `preventDefault()`, `stopPropagation()` and `toggleWishlist`, the button runs:

```ts
gsap.fromTo(button, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
```

The pop plays both when adding and when removing.

The scroll-reveal recipes are covered in §5.

---

## 5. Reveal-on-scroll: `useReveal` (`src/components/useReveal.ts`)

### 5.1 API

```ts
/** Fades/slides in every [data-reveal] element and parallaxes every [data-parallax] image inside the scope. */
export default function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = [])
```

- The hook returns nothing. Its only option is `deps`, which becomes the `useLayoutEffect` dependency array; an `eslint-disable-next-line react-hooks/exhaustive-deps` comment sits above that array.
- It returns early, creating no tweens and no inline styles, if `scope.current` is null or if `prefers-reduced-motion: reduce` matches when the effect runs.
- All work happens inside `gsap.context(…, scope)`. The cleanup, `ctx.revert()`, kills the tweens and ScrollTriggers and removes the inline styles GSAP added.
- Because the hook uses `useLayoutEffect` and `fromTo` renders its from-state immediately, hidden from-states are applied before the browser paints.

### 5.2 The three recipes

| Attribute | Put it on | Tween | ScrollTrigger |
|---|---|---|---|
| `data-reveal` (value = delay in seconds) | any element | `fromTo({ y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: Number(el.dataset.reveal) \|\| 0 })` | `trigger: el, start: 'top 88%', once: true` |
| `data-reveal-img` | an `overflow-hidden` image frame | `fromTo({ clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })`. The frame is uncovered from its bottom edge upward | `trigger: el, start: 'top 85%', once: true` |
| `data-parallax` | an image that fills an `overflow-hidden` parent | `fromTo({ yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: 'none' })` | `trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true` |

- **Delay parsing.** The delay is `Number(el.dataset.reveal) || 0`. A bare JSX `data-reveal` renders as `data-reveal="true"`, which parses to `NaN` and so becomes 0. Numeric JSX values render as strings: `data-reveal={0.08}` becomes `"0.08"`.
- **`once: true`.** The tween plays when the trigger's start line is crossed (default `toggleActions` is `"play none none none"`) and never reverses. The ScrollTrigger kills itself once its end position (default `'bottom top'`) has been passed *(library source)*.
- **Immediate firing.** A trigger whose start is already above the viewport when it is created or refreshed fires straight away. Re-running the hook therefore replays the animation for everything on screen or above it.
- **Parallax scale.** Parallax keeps `scale: 1.12` constant, so the ±8% vertical travel never exposes the frame's edges.

### 5.3 Call sites

| Page (`root` ref on the page wrapper) | Call | Re-runs when | Notes |
|---|---|---|---|
| `src/pages/Home.tsx` | `useReveal(root)` | never after mount | `HomeHero` sits inside this scope but uses its own attributes and hooks |
| `src/pages/Category.tsx` | `useReveal(root, [slug, sort])` | `sort` changes. A `slug` change remounts the page, because `Routes` in `src/App.tsx` keys `Category` by slug | A re-run replays the reveals of visible cards |
| `src/pages/Product.tsx` | `useReveal(root, [slug])` | effectively never (the page is keyed by slug) | Runs alongside the PDP intro (§4.3) |
| `src/pages/Atelier.tsx` | `useReveal(root)` | never | |
| `src/pages/Wishlist.tsx` | `useReveal(root, [items.length])` | the wishlist count changes | A re-run replays the reveals of visible cards |
| `src/pages/GiftCards.tsx` | `useReveal(root)` | never | |

`Cart`, `Checkout` and `Account` do not call the hook and contain no reveal attributes.

Some elements mount after the hook's last run: the Treasured tab switch, GiftFinder results, a newly appearing RecentlyViewed section, and the Reviews media wall after a submission. They carry `data-reveal` but receive no tween, so they simply render visible.

### 5.4 Where the attributes are used

**`data-reveal`**

| File | Element(s) | `data-reveal` value(s) |
|---|---|---|
| `src/components/home/SectionHeader.tsx` | eyebrow rule row / `h2` / aside slot | bare / `"0.05"` / `"0.1"` |
| `src/components/ProductCard.tsx` | card `<a>` | `(index % 3) * 0.08`; `index` defaults to 0 (Treasured and RecentlyViewed pass none) |
| `src/components/home/CategoryIndex.tsx` | desktop `li` rows / mobile cards | `i * 0.03` / `(i % 3) * 0.06` |
| `src/components/home/Services.tsx` | service tiles | `(i % 3) * 0.06` |
| `src/components/home/SocialGrid.tsx` | image tiles | `i * 0.04` |
| `src/components/home/WatchSpotlight.tsx` | eyebrow, `h2`, `p`, watch rows | bare, `0.05`, `0.1`, `0.1 + i * 0.05` |
| `src/components/video/ShoppableVideos.tsx` | film tiles | `(index % 4) * 0.06` |
| `src/pages/Home.tsx` | bridal copy stack; rentals band stack; heritage stack | bridal and rentals: bare, `0.05`, `0.1`, `0.15`, `0.2`. Heritage: bare, `0.05`, `0.08`, `0.1`, `0.15` |
| `src/components/home/TryOnFeature.tsx` | copy stack | bare, `0.05`, `0.1`, `0.15`, `0.2` |
| `src/components/home/VisitSalon.tsx` | copy stack | bare, `0.05`, `0.1`, `0.15`, `0.2` |
| `src/components/home/FourCs.tsx` | eyebrow, `h2`, image block | bare, `0.05`, `0.1` |
| `src/components/home/GiftFinder.tsx` | left column | bare |
| `src/components/home/Testimonials.tsx` | star row | bare |
| `src/components/pdp/CraftStory.tsx` | eyebrow, `h2`, `p`, stats `dl` | bare, `0.05`, `0.1`, `0.15` |
| `src/components/pdp/CompleteTheLook.tsx` | look pieces / summary column | `i * 0.08` / `"0.2"` |
| `src/components/pdp/Reviews.tsx` | client media wall / rating aside | bare / bare |
| `src/components/pdp/ProductFAQ.tsx` | accordion column | bare |
| `src/pages/Category.tsx` | rentals process steps | `i * 0.06` |
| `src/pages/Atelier.tsx` | eyebrow, `h1`, intro `p`, process steps, booking `h2`, form | bare, `0.05`, `0.1`, `i * 0.08`, bare, `"0.1"` |
| `src/pages/GiftCards.tsx` | how-it-works steps; balance eyebrow, `h2`, `p`, checker | `i * 0.08`; bare, `0.05`, `0.1`, `0.1` |

**`data-reveal-img`:**
- `Home` bridal editorial: the main frame and the inset frame (the inset is `hidden … lg:block`)
- `Home` heritage: two frames
- `TryOnFeature`: one frame

**`data-parallax`:**
- `Home`: bridal `IMG.bridal1`, rentals background `IMG.jewelryFlat`, heritage `IMG.ring2` and `IMG.rings`
- `TryOnFeature`: `IMG.earrings3`
- `WatchSpotlight`: `IMG.watch2`
- `VisitSalon`: `IMG.jewelryFlat`
- `Category` hero: `category.hero`, keyed by the image
- `CraftStory`: `product.images[1] ?? product.images[0]`
- `Atelier` hero: `IMG.ring2`

### 5.5 Ordering with other ScrollTriggers

React runs child layout effects before the parent's. On Home, the `HomeHero` and `MakingScroll` triggers (child components) therefore exist before the page-level `useReveal` creates its triggers, so reveal triggers below the pinned section are measured with the pin spacer already in place. A pinning ScrollTrigger also queues a global refresh, and ScrollTriggers attached to plain tweens refresh themselves as soon as they are created *(library source)*.

---

## 6. CSS motion

### 6.1 Keyframes and animation utilities

| Animation | Definition (`src/index.css` unless noted) | Applied as | Where | Reduced motion |
|---|---|---|---|---|
| `marqueeScroll` | `translateX(0%)` → `translateX(-50%)` | `.animate-marquee { display: flex; width: max-content; animation: marqueeScroll 38s linear infinite; }` and `.animate-marquee:hover { animation-play-state: paused; }` | `Header` announcement bar and `PressStrip`. Both render their list twice (`[...items, ...items]`) so the −50% loop is seamless | disabled |
| `grainShift` | `translate` at 0/20/40/60/80/100%: `(0, 0)`, `(-4%, 3%)`, `(3%, -5%)`, `(-6%, -2%)`, `(5%, 4%)`, `(0, 0)` | `.film-grain { … animation: grainShift 0.9s steps(6) infinite; }`. The `steps(6)` timing applies within each keyframe interval | `<div className="film-grain" aria-hidden />`, the last child of the app shell in `src/App.tsx` | disabled |
| `fadeUp` | `opacity: 0; transform: translateY(16px)` → `opacity: 1; transform: translateY(0)` | Tailwind arbitrary value `animate-[fadeUp_<dur>_cubic-bezier(0.16,1,0.3,1)]` | `UndoToast` (0.5s); `Treasured` product grid (0.9s, `key={tab}` remounts it per tab); `Testimonials` blockquote (1s, `key={i}` remounts it per quote) | **not** disabled |
| Tailwind `animate-pulse` | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` (opacity 0.5 at 50%) | class | `TryOnFeature` red "Live" dot | not disabled |
| Tailwind `animate-bounce` | `bounce 1s infinite` | class | `HomeHero` "Scroll" arrow | not disabled |

The reduced-motion block in `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .film-grain, .animate-marquee { animation: none; }
}
```

**Film-grain overlay.** `.film-grain` sets `position: fixed; inset: -50%; width: 200%; height: 200%; pointer-events: none; z-index: 60; opacity: 0.07;`. Its background is an inline SVG `feTurbulence` (`fractalNoise`, `baseFrequency='0.85'`, `numOctaves='3'`, 220×220 tile). At z-index 60 it sits above the header (`z-50`) and the PDP sticky bar (`z-40`), and below the cart backdrop and drawer (`z-[80]` / `z-[90]`) and the portaled overlays (`z-[100]` / `z-[110]`).

### 6.2 `.editorial-zoom`

```css
.editorial-zoom {
  transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}

.group:hover .editorial-zoom {
  transform: scale(1.045);
}
```

Put it on an `h-full w-full object-cover` image or video inside an `overflow-hidden` frame that has a `.group` ancestor. It is used in:
- `Header` (mega-menu images)
- `ProductCard`
- `CategoryIndex` (mobile cards)
- `MakingScroll` cards
- `WatchSpotlight` thumbnails
- `SocialGrid` tiles
- `ShoppableVideos` tile `<video>`
- `CompleteTheLook`
- the `Thumb` component in `Reviews`
- `CartLineItem`
- `CartUpsell`
- `RecentlyViewedStrip`

The rule is plain CSS, so it applies on every device. Tailwind v4 `hover:` and `group-hover:` utilities, by contrast, are wrapped by Tailwind 4.2 in `@media (hover: hover)` *(library source)*.

### 6.3 `.link-line`

`.link-line` is an inline-flex uppercase link: `font-size: 11px; font-weight: 500; letter-spacing: 0.26em; gap: 0.75rem; padding-bottom: 0.35rem`. It has two 1 px pseudo-element lines:
- `::before` is a static `currentColor` line at `opacity: 0.25`;
- `::after` is a gold line that draws in from the left on hover and retracts to the right when the hover ends.

```css
.link-line::after {
  opacity: 1;
  background: var(--gold-vermeil);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.link-line:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

Used by:
- Home: "Design your own", "Commission a piece"
- Treasured: "Explore all collections"
- SocialGrid: "Follow #PorteTeresa" (a `span`)
- RecentlyViewed: "Clear history"
- Category gift-card band: "Send a gift card" (a `span` inside a group link)
- Product: "View all"
- ProductFAQ and GiftCards: "Contact concierge"
- Reviews: "Show more reviews"
- Checkout: "Return to the maison", "View in your account"
- `TryOnButton` with `variant="link"`: Category "Try this collection on" and CartLineItem "View on you"

### 6.4 Transition inventory (Tailwind)

Tailwind 4.2 defaults *(library source)*:
- duration 150 ms;
- timing `cubic-bezier(0.4, 0, 0.2, 1)`;
- `ease-out` is `cubic-bezier(0, 0, 0.2, 1)`;
- `transition-transform` covers `transform, translate, scale, rotate`.

| Duration | Easing | Property set | Where |
|---|---|---|---|
| 150 ms (default) | default | colours (`transition-colors`) | Most hover colour changes: nav links, currency toggle, choice chips (GiftFinder, Reviews filters, Personalizer, RingSize, RentalCalendar, GiftCards, CompleteTheLook periods, Product period/metal), dark primary buttons (`hover:bg-[var(--gold-vermeil)]`), `TryOnButton` variants, `CartLineItem` actions |
| 150 ms | default | transform | `CartDrawer` close `hover:rotate-90`; arrow nudge `group-hover:translate-x-1` (CartDrawer and Cart "Secure checkout", Product "Go to bag"); `GiftOptions` chevron `rotate-180`; `TryOnStudio` shutter `active:scale-95` |
| 150 ms | default | opacity | Mega-menu French category name (`opacity-0 group-hover:opacity-100`) |
| 150 ms | default | `transition` (colours, opacity, shadow, transforms…) | `GiftCards` design swatches (ring colour); `TryOnStudio` metal swatches and "Try another" thumbnails (`opacity-60 hover:opacity-100`) |
| 500 ms | default | opacity | `CartDrawer` backdrop; `CategoryIndex` preview cross-fade; `Gallery` thumbnails (`opacity-45 hover:opacity-80`, active `opacity-100`) |
| 500 ms | default | colours | Home "Explore bridal" and "View the rental vault" CTAs; Product main CTA; GiftCards "Add to bag"; `CategoryIndex` rows (rows other than the hovered one dim to `--text-linen`) |
| 500 ms | `ease-out` | transform | `HomeHero` CTA circle fill (`scale-y-0` → `group-hover:scale-y-100`, `origin-bottom`); `GiftCards` preview tilt wrapper |
| 500 ms | default | transform | `CategoryIndex` arrow (`group-hover:-translate-y-1 group-hover:translate-x-1`); `Services` icon (`group-hover:-translate-y-1`); `Accordion` plus icon (`rotate-45`) |
| 500 ms | default | all | `ProductCard` try-on chip; `SocialGrid` hover overlay; `Gallery` mobile dots (width); `Testimonials` dots (width) |
| 500 ms | house curve | `grid-template-rows` | `Accordion` panels |
| 700 ms | house curve | transform | `CartDrawer` panel; `StickyBar`; `CategoryIndex` name (`group-hover:translate-x-4`); `Treasured` tab underline (`scale-x-0` → `scale-x-100`) |
| 700 ms | house curve | width | `RewardProgress` bar |
| 700 ms | default | transform | `Gallery` thumbnail underline (`scale-x-0` / `scale-x-100`, `origin-left`); Category gift-card art (`-rotate-3` → `group-hover:rotate-0`) |
| 700 ms | default | opacity | `ProductCard` secondary image (`opacity-0` → `group-hover:opacity-100`) |
| 700 ms | default | all | `FourCs` range bar (`left` / `right`) |
| 0.7 s | house curve | transform | `.link-line::after` |
| 900 ms | house curve | transform | `Gallery` hover lens (`[@media(hover:hover)]:group-hover:scale-[1.8]`); the origin follows the mouse |
| 1.1 s | house curve | transform | `.editorial-zoom` (`scale(1.045)`) |
| 1400 ms, plus `i × 90` ms delay per segment | house curve | width | `PriceBreakdown` composition segments |

Many hover states change instantly because they have no `transition-*` class. Examples: the `FourCs` and `VisitSalon` CTAs (`hover:bg-white`), Footer links, and the lightbox and viewer controls.

**Signature hover recipes (verbatim class strings)**
- **ProductCard try-on chip.** Appears on hover only on hover-capable devices: `absolute bottom-3 left-3 transition-all duration-500 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100`.
- **ProductCard secondary image:** `absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100`.
- **Gallery hover lens:** `h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:group-hover:scale-[1.8]`. Its `onMove` handler writes `style.transformOrigin` from the pointer position, but only for `pointerType === 'mouse'` and non-video views.
- **GiftCards tilt.** `onTilt` writes `perspective(1200px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg)` to `style.transform` (mouse only). `resetTilt` clears it. The wrapper carries `transition-transform duration-500 ease-out [transform-style:preserve-3d]`, so the tilt trails the pointer by the transition.

### 6.5 Enter and exit behaviour of drawers, bars and overlays

- **Cart drawer.** Always mounted. The panel slides between `translate-x-full` and `translate-x-0` (700 ms, house curve). The backdrop fades between `opacity-0` with `pointer-events-none` and `opacity-100` (500 ms). The closed panel is `inert` and `aria-hidden`.
- **PDP sticky bar.** Slides between `translate-y-full` and `translate-y-0` (700 ms, house curve), driven by an IntersectionObserver (§9).
- **Mega menu.** GSAP clip-path (§4.4).
- **Accordion.** `grid-template-rows` toggles between `0fr` and `1fr` (500 ms, house curve) around an `overflow-hidden` child, and the plus icon rotates 45° (500 ms). Only one item is open at a time.
- **Undo toast.** Plays `fadeUp` on mount. It has no exit animation; it simply unmounts.
- **Everything else** mounts and unmounts with no transition: the mobile menu, gallery lightbox, ring-size guide, client-media lightbox, write-a-review dialog, video viewer, try-on studio, the `GiftOptions` order note, and the `Treasured` / `FourCs` tab-content swaps.

---

## 7. Video motion

### 7.1 `useInViewPlay` (`src/components/video/useInViewPlay.ts`)

```ts
/** Plays a muted video while it is mostly on screen; pauses otherwise. Disabled for reduced motion. */
export default function useInViewPlay(ref: RefObject<HTMLVideoElement | null>, enabled = true)
```

- It is a `useEffect` with deps `[ref, enabled]`.
- It returns early when there is no element, when `enabled` is false, or when reduced motion matches.
- Otherwise it creates an `IntersectionObserver` with `threshold: [0, 0.6, 1]`. When `intersectionRatio >= 0.6` it calls `el.play().catch(() => undefined)`; otherwise it calls `el.pause()`.
- The cleanup calls `io.disconnect()`.
- The only caller is `Tile` in `src/components/video/ShoppableVideos.tsx`, as `useInViewPlay(ref)`, so `enabled` is always true.
- The observer's root is the viewport. Tiles scrolled out of the rail's visible area are clipped out, count as not visible, and pause.

### 7.2 Shoppable video rail (`src/components/video/ShoppableVideos.tsx`)

- **Tile video:** `<video src={video.preview} poster={video.poster} muted loop playsInline preload="none" className="editorial-zoom …">`. `preview` is the 360p rendition, and nothing downloads until the tile plays. Under reduced motion tiles never autoplay and show their poster.
- **Tile button:** `data-reveal={(index % 4) * 0.06}`, `snap-start`, and a play badge with `transition-colors group-hover:bg-white …`.
- **Rail:** `flex snap-x snap-mandatory gap-3 overflow-x-auto … [scrollbar-width:none] … [&::-webkit-scrollbar]:hidden`, with `data-lenis-prevent-wheel`. Lenis ignores wheel input over the rail, so the browser handles it natively (§2.4).
- **Arrow buttons** (shown only when `videos.length > 3`) call `rail.scrollBy({ left: d * rail.clientWidth * 0.8, behavior: 'smooth' })`.
- **Opening a tile** renders `VideoViewer` through `createPortal(…, document.body)`.

### 7.3 Viewer (`src/components/video/VideoViewer.tsx`)

- **Player.** Full-screen. Plays the 720p `video.src` with `autoPlay`, `muted` (React state, default `true`), `playsInline` and `loop`, and `key={video.id}` remounts the element for each film. An extra `useEffect` (deps `[i]`) calls `play()` when the film changes.
- **Progress segments.** One `h-0.5` bar per film. Widths are inline: `100%` for earlier films, `${progress * 100}%` for the current one, `0%` for later ones. There is no CSS transition. `progress` is updated from `onTimeUpdate` (`currentTime / (duration || 1)`), so the bar advances at the browser's `timeupdate` cadence.
- **Navigation.** `go(d)` wraps around and resets `progress` and `paused`.
  - Keys: Escape closes; ArrowDown or ArrowRight goes to the next film; ArrowUp or ArrowLeft goes back; Space toggles play (with `preventDefault`).
  - Touch: a vertical swipe of more than 60 px between `touchstart` and `touchend` moves (up = next, down = previous).
  - Tapping the video toggles play, and a centred play button appears while paused.
- There is no enter or exit animation.

### 7.4 Other video surfaces

- **Gallery.** When the product has a film, `Gallery` inserts a "Film" view in second position:
  - stage: `<video key=… autoPlay muted loop playsInline>`, gated by neither visibility nor reduced motion;
  - lightbox: `<video … autoPlay controls loop playsInline>`, which is not muted.
- **Reviews.** `MediaLightbox` uses `<video … controls autoPlay playsInline>`. Review thumbnails without a poster use `<video muted preload="metadata">` as stills.

---

## 8. Timers

| Timer | File and symbol | Delay | Effect | Cleanup | Under reduced motion |
|---|---|---|---|---|---|
| `setTimeout` | `HomeHero` autoplay effect | 7000 ms (`DURATION * 1000`) | `go(index + 1)` | cleared on re-run and unmount | skipped |
| GSAP timeline callback | `HomeHero` `go()` | `linesOut` (0.8 s) into the timeline | `setIndex(target)` | none (the timeline is never killed) | runs |
| GSAP `onComplete` | `HomeHero` `go()` | about 2.3 s | `busy.current = false` | none | runs |
| `setInterval` | `Testimonials` | 6500 ms | next quote (`(x + 1) % 3`) | cleared on unmount only; dot clicks do not reset it | runs |
| `setTimeout` | `Header` `scheduleClose` | 140 ms | closes the mega menu | cleared by `open()`; no unmount cleanup | n/a |
| `setTimeout` | `CartDrawer` open effect | 50 ms | focuses the "Close bag" button | cleared in the cleanup | n/a |
| `setTimeout` | `UndoToast` | 6000 ms | hides the "Removed {name}" / "Undo" toast; the store keeps `lastRemoved` | cleared when `lastRemoved` changes and on unmount | n/a |
| `setTimeout` | `Product` (`added` effect) | 2200 ms | reverts the CTA from "Added to bag" | cleared | n/a |
| `setTimeout` | `GiftCards` `submit` | 2400 ms | reverts the button from "Added to bag" | none | n/a |

Some "Added" states persist with no timer: `VideoViewer` ("Added"), `CartUpsell` ("Added"), and `TryOnStudio` ("Added to bag", reset when another piece is chosen).

---

## 9. Observers and animation frames

| API | File | Target | Options | Behaviour | Cleanup |
|---|---|---|---|---|---|
| IntersectionObserver | `src/components/video/useInViewPlay.ts` | each film tile `<video>` | `threshold: [0, 0.6, 1]` | plays at 60% visible or more, otherwise pauses | `disconnect()` |
| IntersectionObserver | `src/components/pdp/StickyBar.tsx` | the PDP main CTA (`target` is Product's `ctaRef`) | none (threshold 0, viewport root) | `setShow(!e.isIntersecting && e.boundingClientRect.top < 0)`: the bar shows only after the CTA has left through the top of the viewport | `disconnect()` |
| IntersectionObserver | `src/components/pdp/PriceBreakdown.tsx` | composition bar | `threshold: 0.4` | the first intersection sets `visible`, which is never reset; segment widths then animate from 0% (§6.4) | `disconnect()` |
| `requestAnimationFrame` | `src/components/SmoothScroll.tsx` route effect | — | — | `ScrollTrigger.refresh()` one frame after a route change | `cancelAnimationFrame` |
| `gsap.ticker` | `src/components/SmoothScroll.tsx` | — | — | calls `lenis.raf` every frame | `gsap.ticker.remove` |

When the sticky bar is hidden, its main button gets `tabIndex={show ? 0 : -1}` and the bar gets `aria-hidden={!show}`.

---

## 10. Overlays: scroll locking and Lenis

| Overlay | Component | Rendered | z-index | Lenis | Overflow lock | `data-lenis-prevent` on | Keys | Enter / exit |
|---|---|---|---|---|---|---|---|---|
| Cart drawer | `CartDrawer` | always, in the app shell | backdrop `z-[80]`, panel `z-[90]` | `stop()` while open | `document.body.style.overflow = 'hidden'`; the previous inline value is restored | the line-item scroller (`flex-1 overflow-y-auto px-7`) | Escape | slide and fade (§6.5) |
| Mobile menu | `Header` | inside `<header>` (`sticky top-0 z-50`), while `mobileOpen` | `z-[70]` | — | — | root | none (closes on route change) | none |
| Mega menu (lg) | `Header` | always (absolute, under the nav) | — | — | — | — | — | GSAP clip-path |
| Gallery lightbox | `Gallery` | inline, inside the PDP gallery column (`lg:sticky lg:top-32`) | `z-[95]` | — | — | root | Escape, ←, → | none |
| Ring-size guide | `RingSize` | inline, inside the PDP configurator (`[data-pdp-in]`) | `z-[95]` | — | — | dialog panel only, not the backdrop | Escape; backdrop click | none |
| Client media | `MediaLightbox` in `Reviews` | `createPortal` to `body` | `z-[100]` | via `useModalLock` | `documentElement.style.overflow = 'hidden'`, reset to `''` | root | Escape, ←, → | none |
| Write a review | `WriteReview` in `Reviews` | `createPortal` to `body` | `z-[100]` | via `useModalLock` | `<html>`, as above | form panel only | none (backdrop click or close button) | none |
| Video viewer | `VideoViewer` | `createPortal` to `body` (from `ShoppableVideos`) | `z-[100]` | stop/start in its effect | `<html>` | root | Escape, arrows, Space | none |
| Try-on studio | `TryOnStudio` | by `TryOnProvider`, as a lazy chunk inside `<Suspense fallback={null}>` | `z-[110]` | stop/start in its effect | `<html>` | root and side panel | Escape | none |

`useModalLock` in `src/components/pdp/Reviews.tsx`:

```ts
function useModalLock() {
  useEffect(() => {
    const lenis = getLenis()
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
    }
  }, [])
}
```

- **No reference counting.** On close, each overlay calls `start()` and clears its overflow lock, whatever other overlays are still open.
- **Opening the drawer from overlays.** `addToCart` in `src/store.tsx` sets `cartOpen = true`, so "Add to bag" inside `VideoViewer` or `TryOnStudio` opens the cart drawer underneath that overlay.
- **Effect deps.** The lock effects in `VideoViewer` and `TryOnStudio` depend on `[onClose]`. `ShoppableVideos` passes an inline arrow function, so the viewer's lock and key listener are torn down and re-applied every time `ShoppableVideos` re-renders.

---

## 11. Scroll position management

### 11.1 Route changes

The `SmoothScroll` route effect runs on mount and on every `route` change. `src/store.tsx` creates a new route object on each `hashchange`.

```ts
useEffect(() => {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
  const id = requestAnimationFrame(() => ScrollTrigger.refresh())
  return () => cancelAnimationFrame(id)
}, [route])
```

- **Always to the top.** Every navigation, including back/forward and reload, lands at the top of the page. `history.scrollRestoration` is never set, and positions are not remembered per route.
- **Menus and overlays.** `Header` closes its menus when `route` changes. Overlays that contain links (`CartDrawer`, `VideoViewer`, `TryOnStudio`) call their close handler in the link's `onClick`, before the hash changes.
- **Ordering.** The new page's `useLayoutEffect`s (reveal, hero and pin triggers) run before `SmoothScroll`'s `useEffect`, so they are created while the previous page's scroll offset still applies. The `ScrollTrigger.refresh()` scheduled for the next frame then re-measures everything.
- **While Lenis is stopped** (for example, an overlay still holds it), `scrollTo(0, { immediate: true })` does nothing *(library source)*.

### 11.2 Programmatic in-page scrolling (Product page)

| Trigger | Target id | With Lenis | Fallback without Lenis | Where Lenis lands |
|---|---|---|---|---|
| The CTA's `handleAdd` with an invalid booking, personalization or size. `StickyBar` and CompleteTheLook's `onNeedBooking` also reach `handleAdd` | `step-dates`, else `step-personal`, else `step-size` | `lenis.scrollTo(el, { offset: -140 })` | `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` | 140 px above the step |
| "What the fee covers" or "See full cost breakdown" (`scrollToId('price-breakdown')`) | `price-breakdown` (the section has `scroll-mt-32`) | `lenis.scrollTo(el, { offset: -120 })` | `el.scrollIntoView({ behavior: 'smooth' })` | 248 px above (128 px scroll margin plus the 120 px offset) |
| Rating button (`scrollToReviews`) | `reviews` (`scroll-mt-32`) | same as the row above | same as the row above | 248 px above |

Lenis animates these scrolls over 1.25 s with the expo-out easing. For the last two rows, the native fallback stops at the scroll margin only (128 px above).

### 11.3 Other scroll behaviour

- **Shoppable video rail:** native horizontal scroll with snapping; the arrow buttons use smooth `scrollBy` (§7.2).
- **MakingScroll** below 1024 px, or with reduced motion, is a native horizontal scroller.
- **Sticky elements.** These rely on native window scrolling:
  - Product gallery column: `lg:sticky lg:top-32`
  - PriceBreakdown composition: `lg:sticky lg:top-36`
  - GiftCards preview: `lg:sticky lg:top-36`
  - Cart summary: `lg:sticky lg:top-28 lg:self-start`
  - Checkout summary: `lg:sticky lg:top-36`
  - Header: `sticky top-0`
- **Checkout confirmation.** The order confirmation replaces the form in place, on the same route and without scrolling.

---

## 12. Reduced motion

**Where it is detected**
- Checked once per effect run with `matchMedia(...).matches`: `SmoothScroll`, `useReveal`, the Product PDP intro, `useInViewPlay`.
- Recomputed on every render: `HomeHero` (`reduced`).
- Evaluated live: `MakingScroll` (through `gsap.matchMedia`) and the `src/index.css` media query.
- Lenis's own `respectReducedMotion` reads a live media query. It only matters if the preference changes after Lenis was created; programmatic scrolls then become immediate and wheel scrolls use `lerp: 1` *(library source)*.

No Tailwind `motion-safe:` or `motion-reduce:` variants are used.

| Disabled under `prefers-reduced-motion: reduce` | Still animates |
|---|---|
| Lenis smooth scrolling (Lenis is never constructed; scrolling is native) | `HomeHero` per-slide headline/fade timeline, the 7 s progress bar, manual slide transitions (`go()`), the bouncing "Scroll" arrow |
| All `useReveal` effects (`data-reveal`, `data-reveal-img`, `data-parallax`) | Header mega-menu clip-path and item stagger |
| The PDP `[data-pdp-in]` intro | `CategoryIndex` cursor preview (follow, fade, scale, image cross-fade) |
| `HomeHero` intro, scroll-out scrubs, pointer parallax and autoplay | `Gallery` stage fade/scale, `Gallery` "Film" autoplay, lightbox and viewer video autoplay |
| `MakingScroll` pin, horizontal scroll and progress line | `WishButton` elastic pop |
| Film-tile autoplay (`useInViewPlay`) | Every Tailwind/CSS transition: drawer, sticky bar, accordion, `.editorial-zoom`, `.link-line`, the PriceBreakdown and RewardProgress bars, GiftCards tilt |
| The `.film-grain` and `.animate-marquee` keyframes | `fadeUp` (Testimonials, Treasured, UndoToast), `animate-pulse`, the Testimonials 6.5 s auto-advance |
| | Native smooth scrolling: the rail arrows (smooth `scrollBy`) and Product's `scrollIntoView({ behavior: 'smooth' })` fallback, which is exactly the path taken when Lenis is absent |

---

## 13. Performance notes

- **Continuous frame loop.** While Lenis is active, `gsap.ticker` has two listeners: GSAP's root update and Lenis's `tick`. GSAP only auto-sleeps when there are fewer than two *(library source)*, so `requestAnimationFrame` runs every frame for the whole session.
- **Always-on CSS animations.** The header marquee and the film grain (a fixed 200% × 200% layer) run on every page. The PressStrip marquee runs on Home. The hero progress bar, `animate-pulse` and `animate-bounce` also run continuously.
- **Animated properties.** GSAP and CSS mostly animate transform, opacity and clip-path.
  - Layout-affecting exceptions: `width` (PriceBreakdown segments, RewardProgress, and the Gallery mobile dots and Testimonials dots via `transition-all`), `grid-template-rows` (Accordion), and `left` / `right` (the FourCs bar via `transition-all`).
  - Clip-path tweens: the hero frame and slide wipes, `data-reveal-img`, the mega menu.
- **No `will-change`** appears anywhere. GSAP's default `force3D: 'auto'` uses `translate3d` while a tween runs and a 2D transform at rest *(library source)*.
- **Pointer-driven motion.** These bypass React state:
  - HomeHero and CategoryIndex (`quickTo`);
  - the Gallery lens (direct `style.transformOrigin` writes);
  - the GiftCards tilt (direct `style.transform` writes).

  `TryOnStudio` instead calls `setPlace` (React state) on every `pointermove` and `wheel` event.
- **ScrollTrigger count.** There is one trigger per `[data-reveal]`, `[data-reveal-img]` and `[data-parallax]` element in scope (dozens on Home), plus three hero scrubs and two MakingScroll triggers. `once` triggers destroy themselves after their end is passed.
- **Video.** Tiles use the 360p rendition with `preload="none"` and play only while at least 60% visible. The viewer streams the 720p rendition.
- **Hero images.** Hero images are not lazy-loaded; the first slide's image has `fetchPriority="high"`.

---

## 14. Guidance for adding motion (derived from existing code, not enforced)

**Scroll reveals**
- Render the element inside a page whose root `ref` is passed to `useReveal`, and add `data-reveal` with a delay in seconds.
- Match the existing cadence:
  - stacked editorial copy uses bare, `0.05`, `0.1`, `0.15`, `0.2` (eyebrow, heading, body, detail, CTA);
  - grids use `(i % 3) * 0.06`–`0.08`, and four-up rails use `(i % 4) * 0.06`;
  - lists use `i * 0.03`–`0.08`.
- If the set of revealed elements changes after mount and the new ones should animate, add the changing value to the hook's `deps`, as Category (`[slug, sort]`) and Wishlist (`[items.length]`) do. A re-run replays reveals that are already visible.

**Images**
- Wrap the image in `<div data-reveal-img className="relative … overflow-hidden">`.
- For parallax, add `data-parallax` to an `<img className="h-full w-full object-cover">` whose **direct parent** is the `overflow-hidden` frame; the trigger is `el.parentElement`.

**Custom GSAP**
- Use `useLayoutEffect` with `gsap.context(() => { … }, ref)` and `return () => ctx.revert()`.
- Return early when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, or, for breakpoint-dependent scroll scenes, use `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)` as `MakingScroll` does.
- Create `quickTo` setters and timelines inside the context so they are reverted too.

**Eases and durations**
- Entrances: `expo.out`, 0.6–1.4 s.
- Clip-path wipes: `expo.inOut`, 1.2–1.8 s.
- Exits: `expo.in`, about 0.7 s.
- Scroll-scrubbed motion: `ease: 'none'`.
- Pointer followers: `gsap.quickTo`, 0.8–1.6 s, `power3.out`, attached with `addEventListener` in the effect and removed in the cleanup. Do not route them through React state.

**CSS transitions**
- Panels, bars and underlines: 700 ms with the house curve.
- Fades and small hover transforms: 500 ms.
- Colour hovers: Tailwind's default 150 ms.
- For image zoom and text links, reuse `.editorial-zoom` (needs an `overflow-hidden` frame with a `.group` ancestor) and `.link-line`.

**Keyframes**
- Define new keyframes in `src/index.css`.
- Use `animate-[name_dur_cubic-bezier(0.16,1,0.3,1)]` together with a changing `key` to replay the animation on a content change, as Treasured and Testimonials do.
- Add any decorative or infinite animation to the `@media (prefers-reduced-motion: reduce)` block.

**Overlays**
- Render through `createPortal(…, document.body)` (or at app level, like `TryOnProvider`).
- Reuse the `useModalLock` pattern: stop Lenis, lock `overflow`, and restore both in the cleanup.
- Put `data-lenis-prevent` on every scrollable pane, and add an Escape handler.

**Programmatic scroll**
- Use `getLenis()?.scrollTo(el, { offset })`, with `el.scrollIntoView({ behavior: 'smooth' })` as the fallback.
- Remember that Lenis also subtracts the target's `scroll-margin-top`.

**Avoid**
- CSS `scroll-behavior: smooth`, a second Lenis instance, transformed scroll containers, and untracked timers. Store every timer id and clear it in the effect cleanup.

---

## BackToTop motion (added 2026-10-15)

- **Animation loop:** `src/components/BackToTop.tsx` runs its own requestAnimationFrame loop, separate from the GSAP ticker. Each frame it reads first (Lenis `scroll`/`limit`, obstacle rects), then writes three inline styles only when they change: the ring `strokeDashoffset`, the wrapper `translate3d` lift, and the ring/arrow magnetic offset.
- **Easing:** values follow their targets with frame-rate-independent easing, `1 − (1 − k)^(dt/16.67)`.
- **Programmatic scroll:** `lenis.scrollTo(target, { duration, easing: easeInOutQuart, onComplete })`. The duration scales with distance (0.85–2.2 s). User input can interrupt it, and a `travelUntil` timeout clears the travelling flag if `onComplete` never fires.
- **CSS transitions:** show/hide uses opacity + `translate` + `scale` (700 ms, house easing); the pill width uses `grid-template-columns`; the arrow flip uses `rotate`. Under reduced motion only opacity transitions, the trip is instant and the magnet is off.

## Notes & gotchas

1. **Suspected bug: the ring-size guide is trapped inside the configurator.** The guide's `fixed inset-0 z-[95]` overlay renders inline inside the PDP configurator, which is a `[data-pdp-in]` element. After the intro tween, GSAP leaves `transform: translate(0, 0)` on that element *(library source)*. A non-`none` transform makes the element the containing block and stacking context for `position: fixed` descendants. With motion enabled, the guide is therefore likely to cover only the configurator column rather than the viewport; with reduced motion it covers the viewport. Not verified in a browser. Fix by portaling the guide to `document.body`.
2. **Suspected bug: the gallery lightbox may sit under the header.** The lightbox (`z-[95]`) renders inline inside the `lg:sticky lg:top-32` gallery column. A sticky element forms its own stacking context, so at 1024 px and wider the header (`z-50`), sticky bar (`z-40`) and film grain (`z-60`) may paint over the lightbox, including its top bar with the close button. Escape still closes it. Not verified in a browser. Portaling would fix it.
3. **Lock collisions.** "Add to bag" in `VideoViewer` or `TryOnStudio` opens the cart drawer underneath. When that overlay closes it calls `lenis.start()` and clears the `<html>` lock while the drawer stays open, so Lenis can scroll the page behind the drawer; the `body` lock does not stop programmatic scrolling. Likewise, opening `TryOnStudio` from a viewer "Try on" chip and closing it removes the `<html>` lock under the still-open viewer.
4. **Unlocked overlays.** The gallery lightbox, ring-size guide and mobile menu neither stop Lenis nor lock overflow. The ring-size backdrop has no `data-lenis-prevent`, so wheeling over it smooth-scrolls the page behind. Because lenis.css's `overscroll-behavior: contain` rule is not included, scrolling inside opt-out panes can chain natively to the page.
5. **Inconsistent lock targets.** `CartDrawer` locks `body` and restores the previous inline value. The other overlays lock `<html>` and reset it to `''`. Neither approach compensates with `scrollbar-gutter`, so hiding the scrollbar can shift the layout; the custom WebKit scrollbar is 6 px wide.
6. **Partial reduced-motion support in the hero.** The per-slide headline timeline, the 7 s progress tween, manual `go()` transitions and `animate-bounce` still run.
7. **Hero layering during `go()`.** The incoming background and inset layers keep `zIndex` 1, under the outgoing layer, until `setIndex` fires at 0.8 s, although their wipes start at 0.1 s and 0.3 s. At that moment React also rewrites both layers' inline `clipPath` while the GSAP tweens are still running, which may cause a visible jump (not verified). The `go()` timeline and the `quickTo` setters are created outside any context, so they are never killed.
8. **Hero timing mismatch.** The progress bar fills in 7 s, but slides advance about every 7.8 s (a 7000 ms timeout plus 0.8 s into `go()`).
9. **FourCs bar never animates.** The range bar's `transition-all duration-700` has no effect: its parent `div` is keyed by `c.key`, so the bar remounts on every tab change.
10. **Testimonials interval.** It is not reset on manual dot clicks, keeps running off-screen, and ignores reduced motion. `fadeUp` is not in the reduced-motion block either.
11. **GiftCards timer.** The `added` timeout (2400 ms) is neither stored nor cleared. A second submit within 2.4 s gets reset early by the first timer.
12. **Ungated, uncleaned GSAP.** The Header mega menu, the CategoryIndex follower and fade, the Gallery stage tween and the WishButton pop have no reduced-motion gate and no cleanup. The mega-menu effect also runs on mount, tweening to the closed state.
13. **Inconsistent PDP scroll landing.** With Lenis, `scrollToId` and `scrollToReviews` land 248 px above their section; the native fallback lands 128 px above. `scrollToReviews` duplicates `scrollToId('reviews')`.
14. **Global GSAP side effects.** `gsap.ticker.lagSmoothing(0)` is global and never restored. With Lenis attached, the GSAP ticker never sleeps.
15. **No scroll restoration.** Back/forward always lands at the top of the page.
16. **Replayed reveals.** Re-running `useReveal` (Category sort change, removing a wishlist item) replays the reveal for every visible card.
17. **Unverified route-change ordering.** New ScrollTriggers are created before the route-change scroll reset and are refreshed one frame later. Whether `once` reveals above the old scroll offset fire prematurely (invisibly) was not verified at runtime.
18. **One-shot reduced-motion checks.** Toggling the OS setting mid-session affects only `MakingScroll`, the CSS keyframes and `HomeHero` (on its next render).
19. **Focus in the hidden sticky bar.** Only the main button gets `tabIndex={-1}` while the bar is hidden; the icon-variant `TryOnButton` inside stays focusable.
20. **Hover on touch devices.** `.editorial-zoom` and `.link-line:hover` are not wrapped in `@media (hover: hover)`, unlike Tailwind v4 hover utilities, so their hover state can stick after a tap on touch devices.
21. **Unscoped selector.** `MakingScroll`'s `'[data-making-progress]'` is resolved document-wide because `gsap.matchMedia()` was created without a scope. It works only while that attribute is unique.

---

## Related docs

- [Architecture & runtime model](architecture.md)
- [Design system — tokens, typography, color, layout & component recipes](design-system.md)
- [UX patterns, responsive behaviour & accessibility](ux-patterns-and-accessibility.md)
- [Home page](pages/home.md)
- [Category (collection) page & product card](pages/category.md)
- [Product detail page (PDP) — orchestration & purchase flow](pages/product.md)
- [PDP modules — gallery, personalizer, rentals, price breakdown, reviews & more](components/pdp-modules.md)
- [Cart drawer, cart page & checkout](pages/cart-and-checkout.md)
- [Gift cards — purchase builder & balance checker](pages/gift-cards.md)
- [Account & wishlist pages](pages/account-and-wishlist.md)
- [Shoppable video & the Atelier page](features/shoppable-video-and-atelier.md)
- [Virtual try-on](features/virtual-try-on.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Code conventions](code-conventions.md)
- [Known issues, risks & tech debt](known-issues.md)
- [Figma Make platform, toolchain & build](platform-and-tooling.md)
- [File index](INDEX.md)
