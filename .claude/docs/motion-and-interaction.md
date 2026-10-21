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
| CSS keyframes | `grainShift`, `fadeUp`, `scrollCue`; Tailwind `animate-pulse` | `src/index.css`, Tailwind theme | Header, PressStrip, App, Testimonials, Treasured, UndoToast, TryOnFeature, HomeHero |
| Web Animations API | `Element.animate()` on the track, compositor-driven, with `updatePlaybackRate` for eased stops | `src/components/Marquee.tsx` | Header, PressStrip (Home) |
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
| `gsap.context(fn, scopeRef)` inside `useLayoutEffect` | `useReveal`, `HomeHero` (intro effect), `Product` (PDP intro) | `ctx.revert()` |
| `gsap.matchMedia().add(query, fn)` inside `useLayoutEffect` | `MakingScroll` | `mm.revert()` |
| Bare tweens in `useEffect` or event handlers | `Header`, `CategoryIndex`, `Gallery`, `WishButton`, and in `HomeHero` the `quickTo` setters, the per-slide timeline and progress tween (killed, not reverted) and the `go()` timeline | none |

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
| `expo.inOut` | Clip-path wipes: the hero frame, the hero background and piece-photo wipes and the progress retract, `data-reveal-img` |
| `expo.in` | Hero headline lines leaving on a slide change |
| `power3.out` | Pointer followers (`quickTo`) in `HomeHero` and `CategoryIndex` |
| `none` | Everything scrubbed to scroll (hero scroll-out, parallax, `MakingScroll`) and the 7 s hero progress bar |
| `elastic.out(1, 0.4)` | `WishButton` heart pop |
| GSAP default (`power1.out`) | Fade-out of the outgoing hero `[data-fade]` elements in `go()` |

---

## 4. GSAP inventory

### 4.1 Home hero carousel (`src/components/HomeHero.tsx`)

Layout, copy and the full `go()` timeline are in `pages/home.md` §4.1. This section covers how the motion is wired.

**Animated hooks.**

| Attribute | Element |
|---|---|
| `data-hero-frame` | Wrapper of the background stack, key light and grades (intro clip-path) |
| `data-bg={i}` + `data-hero-bg` | One full-bleed background layer per slide (`absolute -inset-[4%]`) |
| `data-hero-light` | The key light; `--hx`/`--hy` place its radial gradient |
| `data-hero-inset` | The featured-piece block (top right, `lg`) |
| `data-inset-img={i}` | One piece photo per slide inside the frame |
| `data-hero-meta` | Side label and controls bar |
| `data-hero-copy` | The copy column (scroll-out) |
| `data-slide={i}` | A slide's copy container, and that slide's piece caption |
| `data-line` | The inner span of each headline line, moved inside its `overflow-hidden` mask |
| `data-fade` | Eyebrow, body, CTA group and the three lines of the piece caption |
| `data-eyebrow-rule`, `data-rule` | The eyebrow's rule and the hairline leading into the italic (drawn with `scaleX`) |
| `data-gleam` | The italic accent word; its `background-position` carries the glint |
| `data-progress={i}` | The gold fill inside each slide control's 1 px track |

- Each mask is `block overflow-hidden pb-[0.24em] -mb-[0.16em]`. That is deep enough for Baskervville's descenders, and the negative margin keeps the 0.88 leading.
- A text-clipped element only paints inside its own box, so `[data-gleam]` carries `pb-[0.3em] -mb-[0.3em]`. Without it, the italic's descenders disappear ("by" reads "bv").

**Ownership rule.** React sets each layer's initial `zIndex`/`clipPath`, and each fill's initial `scaleX(0)`, from the element's position as constants, never from `index`. React therefore never rewrites them on re-render, and GSAP owns them after mount. Keep it that way: deriving them from state brings back the old mid-wipe cut.

**Effects.**
- **Intro, scroll, pointer and light** (`useLayoutEffect`, `gsap.context`, skipped under reduced motion):
  - Tweens: the frame `from clipPath inset(12%)` (1.8 s `expo.inOut`); slide 0's photo `from filter brightness(0.3) saturate(0.6)` (2.6 s `power2.out`, `clearProps`); `[data-hero-meta]` `from { opacity: 0, y: 16 }` (1 s, stagger 0.08, delay 1.1); the piece `from { opacity: 0 }` (1.4 s, delay 0.9).
  - Scrubs (trigger the section, `top top` → `bottom top`): backgrounds `yPercent 18, scale 1.08`; copy `yPercent -30, opacity 0` (ends at `70% top`); piece `yPercent -30`.
  - Created outside the context: `quickTo` pointer followers for the piece `x`/`y` (1.2 s `power3.out`, ±12/±9 px) and the backgrounds `x` (1.6 s, ±9 px). For a mouse, two `quickTo`s on a `{ x, y }` proxy (1.1 s `power3.out`) write `--hx`/`--hy` on the light in their `onUpdate`.
- **Per-slide reveal** (`useLayoutEffect`, deps `[index, reduced, go, sync]`): `killTweensOf(lines)`, then a timeline:
  - lines `fromTo { yPercent: 115, rotate: 2, filter: 'blur(10px)' } → { 0, 0, 'blur(0px)' }` (1.4 s, stagger 0.1, `expo.out`, `clearProps: 'filter'`);
  - fades `fromTo { opacity: 0, y: 14 } → { 1, 0 }` (1 s, stagger 0.08) at 0.5 s;
  - rules `fromTo scaleX 0 → 1` (origin left, 1.2 s, stagger 0.2, `expo.inOut`) at 0.15 s;
  - the glint `fromTo backgroundPosition '100% 0%' → '0% 0%'` (1.8 s `power2.inOut`) at 1 s. On a 250 %-wide gradient that moves the pale band across the word from left to right.
  - Then the **progress tween**: the slide's fill goes `fromTo scaleX 0 → 1` (origin left) over 7 s linear, with `onComplete: go(index + 1)`. This tween is the autoplay timer, so pausing it pauses the slideshow.
  - Cleanup kills the timeline and the tween without reverting them.
  - Under reduced motion: `gsap.set` to end states, the rules and fill shown full, no glint and no tween.
- **Holds** (`useEffect`): `sync()` pauses the progress tween while any of these is true, and resumes it when all clear:
  - the user's pause toggle is on;
  - a mouse is over the controls or the piece;
  - keyboard focus (`:focus-visible`) is inside the section;
  - the tab is hidden (`visibilitychange`);
  - less than 20 % of the hero is on screen (`IntersectionObserver`).
- **Input:** a horizontal touch swipe (over 48 px and more than 1.4 × its height) and ←/→ on the slide controls both call `go`.

**`go(next)`.** Key points:
- It kills the progress tween first, so the outgoing fill retracts cleanly (`scaleX → 0`, origin right, 0.6 s `expo.inOut`) instead of fighting a running fill.
- It sets the z-order at t = 0 (incoming 3, outgoing 2), so both wipes always draw over the old image:
  - the background: `inset(0 0 0 100%) → 0%`, from 0.1 s, 1.4 s `expo.inOut`;
  - the photo: `inset(100% 0 0 0) → 0%` with `scale 1.12 → 1`, from 0.3 s, 1.3 s.
- The outgoing image drifts `xPercent: -4` beneath. That stays inside the layer's 4 % bleed, and the wipe always covers the gap.
- `setIndex(target)` runs at `linesOut` (0.8 s). At 1.6 s the outgoing layers are clipped, dropped to `zIndex 1` and the drift reset. `busy` clears on completion (about 2.3 s).
- The timeline is created outside any context and is not killed on unmount.
- Under reduced motion, the layers are swapped with `gsap.set` and `setIndex` runs immediately.

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
- **Hover intent.** `open()` clears the pending close timer and sets `megaOpen`. `scheduleClose()` closes the menu after 140 ms. Both are wired to `onMouseEnter` / `onMouseLeave` on the "Shop" button and on the panel. Clicking the button toggles the menu.
- **Route changes.** Any `route` change closes both the mega menu and the mobile menu.

**Desktop menu** (`src/components/menu/SiteMenu.tsx`): CSS transitions only, no GSAP.
- Two `requestAnimationFrame`s after `open` set `shown`, so the closed styles paint first.
- The rail slides in with `transition-[translate,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`; under reduced motion it fades over 300 ms instead.
- The extension unfolds by `clip-path` over 700 ms (instant under reduced motion).
- Rail rows, the shelf and the footer rise 12 px and fade in, 50 ms apart from 140 ms.
- The gold hairlines glide with `transition-[translate,height,opacity] duration-500`.
- Preview photographs cross-fade over 1 s with a 1.04 → 1 settle (no settle under reduced motion). The preview text and each list remount with `fadeUp`.
- `Burger` folds its two lines into a cross over 500 ms (`translate`, `rotate`, `width`), instantly under reduced motion.

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
| `Marquee` (Web Animations API, not a keyframe rule) | `translate3d(0, 0, 0)` → `translate3d(−{copy width}px, 0, 0)`, `duration = copy width / speed`, linear, infinite | `track.animate(…)` in `src/components/Marquee.tsx` | Header announcements (44 px/s), `PressStrip` (34 px/s) | not created, so the strip stands still |
| `grainShift` | `translate` at 0/20/40/60/80/100%: `(0, 0)`, `(-4%, 3%)`, `(3%, -5%)`, `(-6%, -2%)`, `(5%, 4%)`, `(0, 0)` | `.film-grain { … animation: grainShift 0.9s steps(6) infinite; }`. The `steps(6)` timing applies within each keyframe interval | `<div className="film-grain" aria-hidden />`, the last child of the app shell in `src/App.tsx` | disabled |
| `fadeUp` | `opacity: 0; transform: translateY(16px)` → `opacity: 1; transform: translateY(0)` | Tailwind arbitrary value `animate-[fadeUp_<dur>_cubic-bezier(0.16,1,0.3,1)]` | `UndoToast` (0.5s); `Treasured` product grid (0.9s, `key={tab}` remounts it per tab); `Testimonials` blockquote (1s, `key={i}` remounts it per quote) | **not** disabled |
| Tailwind `animate-pulse` | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` (opacity 0.5 at 50%) | class | `TryOnFeature` red "Live" dot | not disabled |
| `scrollCue` | `translateY(-100%)` → `translateY(200%)` | Tailwind arbitrary value `animate-[scrollCue_2.6s_cubic-bezier(0.65,0,0.35,1)_infinite]` | `HomeHero` "Scroll" cue: a champagne segment travelling down a 28 px hairline | `motion-reduce:animate-none` |

The reduced-motion block in `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .film-grain { animation: none; }
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
- Treasured: "Continue the discovery"
- SocialGrid: "Follow #PorteTeresa" (a `span`)
- RecentlyViewed: "Clear history"
- Category gift-card band: "Send a gift card" (a `span` inside a group link)
- Product: "View all"
- ProductFAQ and GiftCards: "Contact concierge"
- Reviews: "Show more reviews"
- Checkout: "Return to the maison", "View in your account"
- `TryOnButton` with `variant="link"`: Category "Try these pieces on" and CartLineItem "View on you"

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

### 6.6 Marquees (`src/components/Marquee.tsx`)

Both scrolling strips (the Header announcements and the home PressStrip) use one component built on the Web Animations API. It was rebuilt on 2026-10-16 because the CSS version (`.animate-marquee`, a 38 s `translateX(-50%)` loop) felt jerky:
- it froze abruptly on hover;
- it ran at different speeds per strip;
- it could open a gap on screens wider than one copy;
- it jumped when the web fonts arrived and changed the width.

What the component guarantees:
- **Compositor smoothness.** `Element.animate()` on `transform: translate3d(…)` is composited like a CSS animation, so main-thread work (Lenis, GSAP, React) cannot stall it. The track also has `will-change: transform` and `backface-visibility: hidden`, so it keeps its own layer from the start.
- **Constant speed.** `speed` is in px/s and the duration is derived from the measured copy width (header 44 px/s, press 34 px/s).
- **Exact seam.** The loop distance is the copy's fractional width (for example −2452.2 px), so the wrap is invisible.
- **Always full.** It renders `ceil(viewport / copy) + 1` copies, at least 2. A 3440 px screen gets 3 header copies.
- **No jumps.** It starts after `document.fonts.ready`. A `ResizeObserver` rebuilds the animation at the same fractional progress.
- **Eased stop.** A mouse hover eases the playback rate to 0 and back with `updatePlaybackRate`. Measured: 1 → 0.14 after 0.3 s → 0 after 1 s, then back to 1.
- **Idle when unseen.** An `IntersectionObserver` pauses it off-screen; the press strip waits paused below the fold.
- **Reduced motion and assistive tech.** No animation is created under reduced motion. Copies after the first are `aria-hidden`, so names are read once.

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
| GSAP tween `onComplete` | `HomeHero` progress tween (the autoplay timer) | 7 s of unpaused playback | `go(index + 1)` | killed on slide change and unmount; paused by the holds | not created |
| GSAP timeline callback | `HomeHero` `go()` | `linesOut` (0.8 s) into the timeline | `setIndex(target)` | none (the timeline is never killed) | runs |
| GSAP `onComplete` | `HomeHero` `go()` | about 2.3 s | `busy.current = false` | none | runs |
| `setInterval` | `Testimonials` | 6500 ms | next quote (`(x + 1) % 3`) | cleared on unmount only; dot clicks do not reset it | runs |
| `setTimeout` | `Header` `scheduleClose` | 140 ms | closes the mega menu | cleared by `open()`; no unmount cleanup | n/a |
| `setTimeout` | `SiteMenu` `hoverRail` | 80 ms to unfold a panel, 200 ms to fold it; re-checked every 120 ms while the pointer heads right | switches the extension | cleared on every hover, on entering the extension and on close | same |
| `setTimeout` | `SiteMenu` initial focus | 50 ms | focuses the search, the first rail item or the dialog | cleared on close | same |
| `setTimeout` | `SiteMenu` hand-back | 500 ms after closing, only where the cross stands over the menu button | swaps the cross for the button in one commit, once the cross has folded back | cleared if the menu reopens | same |
| `setTimeout` | `Header` pre-mount | 2.5 s after load, desktop only | mounts the closed menu so the first opening is instant | cleared on unmount | same |
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
| Desktop menu (lg) | `SiteMenu` | portal, after the first opening | `z-[70]` | `stop()` while open | `document.body.style.overflow = 'hidden'`; the previous value is restored | the rail's middle and the list column | Escape (stepped), arrows, Tab trap, `/`, ⌘K, type-to-search | CSS: rail `translate`, extension `clip-path` |
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

`PageTransition` (`src/components/transition/PageTransition.tsx`) owns scroll on navigation; `SmoothScroll` no longer has a route effect.
- **On load** a visit opens at the top (`window.scrollTo(0, 0)` on mount).
- **At the swap** (the old page covered, the new one just rendered): `window.scrollTo(0, y)`. `y` is 0 for a forward move, and the position remembered for that address when moving back. It scrolls natively on purpose. After a `lenis.scrollTo(…, { immediate: true })` that doesn't move the page, Lenis ignores the next native scroll event and keeps a stale target, so it could believe it is already at 0 *(library source)*. `lenis.start()` after the transition re-reads the real position.
- **Remembered positions** are kept in memory per address (`scrolls`), saved as each page leaves. "Back" means the address before the current one in the visit stack (`visits`), so browser Back and a link to the previous page both return to where the visitor was. A reload opens at the top.
- **ScrollTrigger** is refreshed at the swap and again once the new page has entered. Most triggers are created as the stage clears ("Splash and page transitions" below).
- **Menus and overlays.** `Header` closes its menus when `route` changes. Overlays that contain links (`CartDrawer`, `VideoViewer`, `TryOnStudio`) call their close handler in the link's `onClick`, before the hash changes.

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

`motion-reduce:` appears in `BackToTop`, on the hero scroll cue (`motion-reduce:animate-none`) and in the desktop menu (`SiteMenu`, `Burger`). No `motion-safe:` variants are used.

| Disabled under `prefers-reduced-motion: reduce` | Still animates |
|---|---|
| Lenis smooth scrolling (Lenis is never constructed; scrolling is native) | `TryOnFeature` "Live" dot (`animate-pulse`) |
| All `useReveal` effects (`data-reveal`, `data-reveal-img`, `data-parallax`) | Header mega-menu clip-path and item stagger |
| The PDP `[data-pdp-in]` intro | `CategoryIndex` cursor preview (follow, fade, scale, image cross-fade) |
| `HomeHero`: intro, scroll-out scrubs, pointer parallax, autoplay, headline reveals, slide wipes (slides swap instantly) and the scroll cue | `Gallery` stage fade/scale, `Gallery` "Film" autoplay, lightbox and viewer video autoplay |
| `MakingScroll` pin, horizontal scroll and progress line | `WishButton` elastic pop |
| Film-tile autoplay (`useInViewPlay`) | Every Tailwind/CSS transition: drawer, sticky bar, accordion, `.editorial-zoom`, `.link-line`, the PriceBreakdown and RewardProgress bars, GiftCards tilt |
| The `.film-grain` keyframes, and both marquees (`Marquee` creates no animation) | `fadeUp` (Testimonials, Treasured, UndoToast), `animate-pulse`, the Testimonials 6.5 s auto-advance |
| | Native smooth scrolling: the rail arrows (smooth `scrollBy`) and Product's `scrollIntoView({ behavior: 'smooth' })` fallback, which is exactly the path taken when Lenis is absent |

---

## 13. Performance notes

- **Continuous frame loop.** While Lenis is active, `gsap.ticker` has two listeners: GSAP's root update and Lenis's `tick`. GSAP only auto-sleeps when there are fewer than two *(library source)*, so `requestAnimationFrame` runs every frame for the whole session.
- **Always-on CSS animations.** The header marquee and the film grain run on every page. The grain is a fixed 124% × 124% layer; it was 200% × 200% (four viewports of texture) until 2026-10-16. The PressStrip marquee runs on Home and pauses off-screen. The hero scroll cue and `animate-pulse` also run continuously. The hero's progress tween runs only while the hero is visible and unpaused.
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
- **Hero images.** The three background images are not lazy-loaded (the first has `fetchPriority="high"`). The featured-piece photos are `loading="lazy"`, so phones, where the piece is hidden, never fetch them.

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

## Language switch (added 2026-10-21)

`src/components/transition/LanguageVeil.tsx` registers the switch choreography with `registerSwitcher` (`src/i18n/index.ts`). On `setLang`:
- `getLenis()?.stop()`, `coverStage()`, `html[data-switching]`; `holdPlace()` notes the element at 35% of the viewport.
- GSAP timeline: travertine veil (`z-[125]`) `autoAlpha` 0 → 1 over 0.3 s (`power2.out`); the card (`Ampersand`, `{language} · {region}`, `<em>Bienvenue</em>.` / `<em>Welcome</em>.`) from `y: 10` over 0.55 s (`expo.out`) at 0.1 s; at 0.32 s the copy swaps (`flushSync`), the page is scrolled back to the noted element and `ScrollTrigger.refresh()` runs; the card leaves (`y: -8`, 0.3 s) at 0.85 s; `clearStage()` at 0.9 s; the veil fades out over 0.5 s from 0.95 s. On complete: Lenis restarts and a live region announces the language.
- Immediate swap (place kept, still announced) under reduced motion, while a page transition runs (`html[data-transition]`), or when a second switch arrives mid-veil (the first is completed with `progress(1)`).
- The language notice (`LanguageNotice`) slides in with CSS (`transition-[opacity,translate] duration-700`, `translate-y-3` → 0) 1.4 s after the stage clears; `motion-reduce:transition-none`.

## Splash and page transitions (added 2026-10-20)

### The stage (`src/lib/stage.ts`)

A counter of what currently hides the page: `coverStage()` and `clearStage()`, plus `onStageClear(build)`. That runs `build` now, or once the count reaches zero, and returns a cleanup that cancels or undoes it. The module covers the stage at load, before any component renders, because the intro always plays.
- **Entrances wait for it.** `useReveal`, both `HomeHero` layout effects (the intro and the per-slide headline) and the `Product` `[data-pdp-in]` entrance build inside `onStageClear`. Under the splash or a transition the new page renders unseen, and its entrances start as it is uncovered. New mount-time GSAP entrances should do the same.
- **`INTRO`** (`'full' | 'short' | 'veil'`) is decided once at load. It is `veil` when `sessionStorage['tns-intro'] === '1'`, else `full` on Home and `short` on any other route. `markIntroSeen()` sets the flag.

### Splash (`src/components/splash/Splash.tsx`)

Rendered first in the app shell, `fixed inset-0 z-[130]`, `aria-hidden`. While it shows, `body` overflow is `hidden` and Lenis is stopped (on the next frame, because Lenis is created after the splash mounts).
- **Full** (the session's first visit, starting on Home): a vault case in two halves that overlap by 2 px at the centre.
  - Top half: the `Ampersand` mark draws its outline with `strokeDashoffset` (1.5 s), then fills. The wordmark "Teresa & Sons" rises letter by letter (blur and rise, 0.04 s stagger; the `&` in champagne italic), then "Montréal · Est. 1962".
  - Bottom half: a year that counts from 1962 to the current year with the progress.
  - Centre: a gold seam (`w-[min(60vw,680px)]`) fills outwards from the middle as the page loads.
- **Progress is real:** the fonts (waited for at most `FONT_WAIT`, 1.2 s) and every `main img` on the first screen (`decode()`). It is eased so it never jumps, and filled at `LIMIT` (2.6 s; 1.5 s under reduced motion) whatever is still loading. Only real progress restarts the ease, so a late image can't push the opening back.
- **Opening**, once the seam is full and `HOLD` (2.4 s) has passed since the tab was first seen:
  - a glint runs along the seam (0.75 s);
  - the mark, wordmark and year lift away;
  - the halves part (`yPercent ∓101`, 1.15 s `expo.inOut`).

  `clearStage()` fires as the halves start to part, so the hero's frame opens and its headline rises in the gap.
- **Short** (the session's first visit, starting deeper in the site): the same composition without the drawing (the mark fades in), with `HOLD` 1.1 s and `LIMIT` 2 s.
- **Veil** (later loads in the session): a travertine layer that fades out (0.5 s) once the fonts are ready, or after 600 ms. It hides the font swap.
- **Skip:** any key, pointer press or wheel fills the seam (0.35 s) and opens at 1.6× speed. A tab opened in the background starts its intro when first shown.
- **Fonts:** the letters wait (an `addPause`) for the fonts, at most `FONT_WAIT`, so they rarely appear in a fallback face.
- **First paint:** before the app loads, `site.json`'s head script adds `tns-intro` to `<html>` when the session hasn't seen the intro, and an inline style paints it vault (`#121110`). The page never flashes light before the dark splash; the splash removes the class when done.
- **Reduced motion:** a still composition (the seam still fills), then a 0.5 s fade.
- **Cleanup** reverts its tweens rather than killing them. React's development double-run then finds the letters as they were, not stuck at a from-tween's opacity 0.

### Page transitions (`src/components/transition/`)

`App`'s `Pages` renders `<PageTransition>{(shown) => <Routes route={shown} />}</PageTransition>`. `shown` trails the store's `route` during a transition, so the old page stays on screen while it leaves.

**`navigate()`**, on a `route` change unless one is already running:
1. It reads the direction from the visit stack, saves the outgoing scroll position, and takes the click that caused the move (same address, within 1.2 s), if any.
2. It picks the transition (`pickTransition`, or `fade` under reduced motion), names it in `document.documentElement.dataset.transition` while it runs, calls `coverStage()` and stops Lenis.
3. `leave(ctx)` covers the old page.
4. The page swaps with `flushSync` to the latest route (the visitor may have moved on during the leave). Scroll is set (§11.1) and `ScrollTrigger` refreshed.
5. `settle()` waits for the new page's first-screen images, up to 600 ms (250 ms when quick).
6. `enter(ctx)` uncovers the page and calls `ctx.clear()` as it does, so the stage clears and entrances start.
7. Lenis restarts and `ScrollTrigger` refreshes. Focus moves to `<main>` unless a modal dialog is open, and a polite live region reads the title when the page shown is the latest. A navigation that arrived meanwhile then runs.

**Context:** `back` (reverses the direction), `quick` (the previous transition ended under 1.5 s ago: the same transition, quicker), `morph`, and `stage` (curtain, card, seam, veil, clone, `<main>`).

**Transitions** (`transitions.ts`, Barba-shaped `{ name, from, to, custom, leave, enter }`, first match wins):

| Name | Rule | Leave | Enter |
|---|---|---|---|
| `morph` | To `product`, from a click on a loaded product photo | The photo is cloned in place (`fixed z-[127]`); a travertine veil fades over the page (0.45 s) | The clone flies to the gallery's `[data-morph-target]` (1 s `expo.inOut`), the veil lifts from 0.5 s, and the clone fades on arrival. With no target, both fade |
| `checkout` | From or to `checkout` | Travertine veil in (0.3 s) with a small card: the `Ampersand`, the eyebrow and the title (gold italic word in vermeil) | The card lifts, the veil goes out (0.45 s) |
| `chapter` | Category → category | The vault curtain sweeps in sideways (0.75 s), later chapters from the right and earlier ones from the left, with a vertical gold seam on its edge; the page drifts 64 px | The curtain carries on off the other side (0.9 s); the page settles from 72 px |
| `curtain` | Everything else | The vault curtain rises from the bottom (from the top when `back`) over 0.75 s with a gold seam on its edge; the page drifts 48 px | The card lifts away and the curtain exits upwards (downwards when `back`, 0.9 s); the page settles from 56 px |

- **Quick:** all curtain and chapter timings, the card's included, are multiplied by 0.6. The card still shows: until 2026-10-20 quick mode dropped it, which left a blank dark curtain when the visitor moved on or went back soon after arriving.
- **Destination card** (on every curtain and chapter turn): the `Ampersand`, an eyebrow, the title rising from a mask with one gold italic word, and a gold rule. Categories add their roman numeral, huge and faint, behind it. The leave lasts 0.95 s (0.57 s when quick) so the card can be read, and the card keeps animating through the swap. The fade's veil carries its own small card, so no transition is blank.
- **Labels** (`labelFor`, eyebrow / title):

  | Destination | Eyebrow | Title |
  |---|---|---|
  | Category | "Chapter {numeral} · {french}" | the category name |
  | Product | "{collection} · {category}" | the piece's name |
  | The Atelier | "L’Atelier" | "The Atelier" |
  | Gift Cards | "Carte-cadeau" | "Gift Cards" |
  | Wishlist | "Liste de souhaits" | "Your Wishlist" |
  | Account | "Mon compte" | "Your Account" |
  | Bag | "Votre sélection" | "Your Bag" |
  | Checkout | "Teresa & Sons" | "Checkout" |
  | Home | "Montréal · Est. 1962" | "Teresa & Sons" (the `&` in gold) |

  The switch is exhaustive, so a new route doesn't compile until it has a label.
- **Clicks:** a capture-phase listener on plain left clicks of `a[href^="#"]` records the address, the time and the morph source. The source is the topmost visible, loaded `img` inside the link, or inside its `[data-morph-scope]` (the home hero's piece, whose link lies over its photos).
- **Prefetch:** `pointerover` on a link preloads the image its page opens on: a product's first photo, or a category's hero.
- **Same-page links:** a link to the address already shown changes nothing, so a bubble-phase listener glides back to the top instead (`lenis.scrollTo(0)`), unless the link's own handlers cancelled the click or a transition is running.
- **Layers** are portalled to `<body>`, `aria-hidden`, and `invisible` until used: veil and curtain `z-[125]`, seam `z-[126]`, clone `z-[127]`.

## Notes & gotchas

1. **Suspected bug: the ring-size guide is trapped inside the configurator.** The guide's `fixed inset-0 z-[95]` overlay renders inline inside the PDP configurator, which is a `[data-pdp-in]` element. After the intro tween, GSAP leaves `transform: translate(0, 0)` on that element *(library source)*. A non-`none` transform makes the element the containing block and stacking context for `position: fixed` descendants. With motion enabled, the guide is therefore likely to cover only the configurator column rather than the viewport; with reduced motion it covers the viewport. Not verified in a browser. Fix by portaling the guide to `document.body`.
2. **Suspected bug: the gallery lightbox may sit under the header.** The lightbox (`z-[95]`) renders inline inside the `lg:sticky lg:top-32` gallery column. A sticky element forms its own stacking context, so at 1024 px and wider the header (`z-50`), sticky bar (`z-40`) and film grain (`z-60`) may paint over the lightbox, including its top bar with the close button. Escape still closes it. Not verified in a browser. Portaling would fix it.
3. **Lock collisions.** "Add to bag" in `VideoViewer` or `TryOnStudio` opens the cart drawer underneath. When that overlay closes it calls `lenis.start()` and clears the `<html>` lock while the drawer stays open, so Lenis can scroll the page behind the drawer; the `body` lock does not stop programmatic scrolling. Likewise, opening `TryOnStudio` from a viewer "Try on" chip and closing it removes the `<html>` lock under the still-open viewer.
4. **Unlocked overlays.** The gallery lightbox, ring-size guide and mobile menu neither stop Lenis nor lock overflow. The ring-size backdrop has no `data-lenis-prevent`, so wheeling over it smooth-scrolls the page behind. Because lenis.css's `overscroll-behavior: contain` rule is not included, scrolling inside opt-out panes can chain natively to the page.
5. **Inconsistent lock targets.** `CartDrawer` locks `body` and restores the previous inline value. The other overlays lock `<html>` and reset it to `''`. Neither approach compensates with `scrollbar-gutter`, so hiding the scrollbar can shift the layout; the custom WebKit scrollbar is 6 px wide.
6. **Hero reduced motion (fixed 2026-10-16).** Reveals, wipes, the progress tween and the scroll cue are all off, and slides swap instantly.
7. **Hero layering during `go()` (fixed 2026-10-16).** GSAP sets the incoming layers above the outgoing ones at t = 0. React's inline `zIndex`/`clipPath` are position constants that it never rewrites.
8. **Hero timing (fixed 2026-10-16).** The progress tween is the timer, so the fill runs exactly as long as the slide waits.
9. **FourCs bar never animates.** The range bar's `transition-all duration-700` has no effect: its parent `div` is keyed by `c.key`, so the bar remounts on every tab change.
10. **Testimonials interval.** It is not reset on manual dot clicks, keeps running off-screen, and ignores reduced motion. `fadeUp` is not in the reduced-motion block either.
11. **GiftCards timer.** The `added` timeout (2400 ms) is neither stored nor cleared. A second submit within 2.4 s gets reset early by the first timer.
12. **Ungated, uncleaned GSAP.** The Header mega menu, the CategoryIndex follower and fade, the Gallery stage tween and the WishButton pop have no reduced-motion gate and no cleanup. The mega-menu effect also runs on mount, tweening to the closed state.
13. **Inconsistent PDP scroll landing.** With Lenis, `scrollToId` and `scrollToReviews` land 248 px above their section; the native fallback lands 128 px above. `scrollToReviews` duplicates `scrollToId('reviews')`.
14. **Global GSAP side effects.** `gsap.ticker.lagSmoothing(0)` is global and never restored. With Lenis attached, the GSAP ticker never sleeps.
15. **Scroll memory lives only in the page.** Back returns to the remembered position (§11.1), but a reload opens at the top and positions are not kept across visits.
16. **Replayed reveals.** Re-running `useReveal` (Category sort change, removing a wishlist item) replays the reveal for every visible card.
17. **Unverified route-change ordering.** New ScrollTriggers are created before the route-change scroll reset and are refreshed one frame later. Whether `once` reveals above the old scroll offset fire prematurely (invisibly) was not verified at runtime.
18. **One-shot reduced-motion checks.** Toggling the OS setting mid-session affects only `MakingScroll`, the CSS keyframes and `HomeHero` (on its next render).
19. **Focus in the hidden sticky bar.** Only the main button gets `tabIndex={-1}` while the bar is hidden; the icon-variant `TryOnButton` inside stays focusable.
20. **Hover on touch devices.** `.editorial-zoom` and `.link-line:hover` are not wrapped in `@media (hover: hover)`, unlike Tailwind v4 hover utilities, so their hover state can stick after a tap on touch devices.
21. **Unscoped selector.** `MakingScroll`'s `'[data-making-progress]'` is resolved document-wide because `gsap.matchMedia()` was created without a scope. It works only while that attribute is unique.

---

## Related docs

- [Languages — English (Canada, US) and French (Canada)](features/languages.md)
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
