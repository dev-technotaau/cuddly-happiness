// Page transitions, shaped like Barba.js transitions ({ name, from, to, custom, leave, enter }) so the Shopify theme,
// a multi-page site, can register the same definitions with barba.init(). Here PageTransition.tsx runs them for the
// hash router: `leave` covers the old page, the new page swaps in unseen, then `enter` uncovers it.
import gsap from 'gsap'
import { CATEGORIES } from '../../data/catalog'
import type { Route } from '../../store'

/** A page's namespace, as in Barba: the route's name. In the theme it becomes the template (index, collection, product…). */
export type Namespace = Route['name']

/** The image a product link was clicked on. It flies into the product page's gallery. */
export interface Morph {
  src: string
  rect: DOMRect
  slug: string
}

/** The overlay pieces a transition animates, plus the page itself (`<main>`). */
export interface Stage {
  curtain: HTMLElement
  card: HTMLElement
  seam: HTMLElement
  veil: HTMLElement
  clone: HTMLImageElement
  page: HTMLElement
}

export interface TransitionContext {
  from: Route
  to: Route
  /** A move back through the visit (browser Back, or a link to the previous page). Curtains run the other way. */
  back: boolean
  /** The visitor is moving fast: the same transition, quicker. The destination is always named. */
  quick: boolean
  morph: Morph | null
  stage: Stage
  /** Lifts the stage cover, so the new page's entrances start. Call it as the page is uncovered. */
  clear: () => void
}

export interface Transition {
  name: string
  from?: Namespace[]
  to?: Namespace[]
  custom?: (ctx: TransitionContext) => boolean
  leave: (ctx: TransitionContext) => Promise<void>
  enter: (ctx: TransitionContext) => Promise<void>
}

const EASE = 'expo.inOut'

/** A timeline as a promise that settles when it completes or is interrupted. */
const play = (tl: gsap.core.Timeline) =>
  new Promise<void>((resolve) => {
    tl.eventCallback('onComplete', () => resolve())
    tl.eventCallback('onInterrupt', () => resolve())
  })

/** The destination card on the curtain: the mark and eyebrow fade up, the title rises out of its mask, a gold rule
 *  draws out. `k` scales its timing, so a quick transition still names where it goes. */
function showCard(card: HTMLElement, k = 1) {
  return gsap
    .timeline()
    .set(card, { autoAlpha: 1, x: 0, y: 0 })
    .fromTo(card.querySelectorAll('[data-card-fade]'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7 * k, stagger: 0.06 * k, ease: 'expo.out' }, 0)
    .fromTo(card.querySelectorAll('[data-card-line]'), { yPercent: 110 }, { yPercent: 0, duration: 0.9 * k, ease: 'expo.out' }, 0.05 * k)
    .fromTo(card.querySelectorAll('[data-card-rule]'), { scaleX: 0 }, { scaleX: 1, duration: 0.9 * k, ease: 'expo.inOut' }, 0.15 * k)
}

/** The default: a vault curtain rises with a gold seam on its edge and names the destination, then lifts away. */
const curtain: Transition = {
  name: 'curtain',
  leave: ({ stage, back, quick }) => {
    const { curtain: panel, seam, card, page } = stage
    const k = quick ? 0.6 : 1
    const vh = window.innerHeight
    const tl = gsap
      .timeline()
      .set(panel, { autoAlpha: 1, clipPath: back ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)' })
      .set(card, { autoAlpha: 0, y: 0 })
      .set(seam, { autoAlpha: 1, width: '100%', height: 1, x: 0, y: back ? 0 : vh })
      .to(panel, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75 * k, ease: EASE }, 0)
      .to(seam, { y: back ? vh : 0, duration: 0.75 * k, ease: EASE }, 0)
      .to(seam, { autoAlpha: 0, duration: 0.2 }, 0.65 * k)
      .to(page, { y: back ? 48 : -48, duration: 0.75 * k, ease: EASE }, 0)
      // The card keeps animating through the swap; the leave ends once the reader has caught the eyebrow.
      .call(() => void showCard(card, k), undefined, 0.42 * k)
      .to({}, { duration: 0.2 * k }, 0.75 * k)
    return play(tl)
  },
  enter: ({ stage, back, quick, clear }) => {
    const { curtain: panel, seam, card, page } = stage
    const k = quick ? 0.6 : 1
    const vh = window.innerHeight
    const tl = gsap
      .timeline()
      .to(card, { autoAlpha: 0, y: -24, duration: 0.45 * k, ease: 'power2.in', overwrite: 'auto' }, 0)
      .add(clear, 0.12 * k)
      .set(seam, { autoAlpha: 1, y: back ? 0 : vh }, 0.12 * k)
      .to(panel, { clipPath: back ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', duration: 0.9 * k, ease: EASE }, 0.12 * k)
      .to(seam, { y: back ? vh : 0, duration: 0.9 * k, ease: EASE }, 0.12 * k)
      .to(seam, { autoAlpha: 0, duration: 0.25 }, 0.85 * k)
      .fromTo(page, { y: back ? -56 : 56 }, { y: 0, duration: 1.1 * k, ease: 'expo.out', clearProps: 'transform' }, 0.12 * k)
      .set(panel, { autoAlpha: 0 })
    return play(tl)
  },
}

const chapterIndex = (r: Route) => (r.name === 'category' ? CATEGORIES.findIndex((c) => c.slug === r.slug) : -1)

/** Between chapters the curtain sweeps sideways like a turned page: later chapters arrive from the right, earlier from the left. */
const chapter: Transition = {
  name: 'chapter',
  from: ['category'],
  to: ['category'],
  leave: ({ stage, from, to, quick }) => {
    const { curtain: panel, seam, card, page } = stage
    const k = quick ? 0.6 : 1
    const vw = window.innerWidth
    const next = chapterIndex(to) >= chapterIndex(from)
    const tl = gsap
      .timeline()
      .set(panel, { autoAlpha: 1, clipPath: next ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' })
      .set(card, { autoAlpha: 0, y: 0 })
      .set(seam, { autoAlpha: 1, width: 1, height: '100%', y: 0, x: next ? vw : 0 })
      .to(panel, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75 * k, ease: EASE }, 0)
      .to(seam, { x: next ? 0 : vw, duration: 0.75 * k, ease: EASE }, 0)
      .to(seam, { autoAlpha: 0, duration: 0.2 }, 0.65 * k)
      .to(page, { x: next ? -64 : 64, duration: 0.75 * k, ease: EASE }, 0)
      .call(() => void showCard(card, k), undefined, 0.42 * k)
      .to({}, { duration: 0.2 * k }, 0.75 * k)
    return play(tl)
  },
  enter: ({ stage, from, to, quick, clear }) => {
    const { curtain: panel, seam, card, page } = stage
    const k = quick ? 0.6 : 1
    const vw = window.innerWidth
    const next = chapterIndex(to) >= chapterIndex(from)
    const tl = gsap
      .timeline()
      .to(card, { autoAlpha: 0, x: next ? -40 : 40, duration: 0.45 * k, ease: 'power2.in', overwrite: 'auto' }, 0)
      .add(clear, 0.12 * k)
      .set(seam, { autoAlpha: 1, x: next ? vw : 0 }, 0.12 * k)
      .to(panel, { clipPath: next ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)', duration: 0.9 * k, ease: EASE }, 0.12 * k)
      .to(seam, { x: next ? 0 : vw, duration: 0.9 * k, ease: EASE }, 0.12 * k)
      .to(seam, { autoAlpha: 0, duration: 0.25 }, 0.85 * k)
      .fromTo(page, { x: next ? 72 : -72 }, { x: 0, duration: 1.1 * k, ease: 'expo.out', clearProps: 'transform' }, 0.12 * k)
      .set(panel, { autoAlpha: 0 })
      .set(card, { x: 0 })
    return play(tl)
  },
}

/** From a product image to the product page: the photograph stays as the page dissolves around it, flies to the
 *  gallery's place, and the new page gathers around it. */
const morph: Transition = {
  name: 'morph',
  to: ['product'],
  custom: ({ morph: m }) => !!m,
  leave: ({ stage, morph: m }) => {
    const { veil, clone } = stage
    if (!m) return Promise.resolve()
    clone.src = m.src
    const r = m.rect
    const tl = gsap
      .timeline()
      .set(clone, { display: 'block', autoAlpha: 1, left: r.left, top: r.top, width: r.width, height: r.height, boxShadow: '0 0 0 0 rgba(20, 19, 17, 0)' })
      .set(veil, { autoAlpha: 0 })
      .to(veil, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0)
      .to(clone, { boxShadow: '0 40px 80px -40px rgba(20, 19, 17, 0.45)', duration: 0.45, ease: 'power2.out' }, 0)
    return play(tl)
  },
  enter: ({ stage, to, clear }) => {
    const { veil, clone } = stage
    const slug = to.name === 'product' ? to.slug : ''
    const target = document.querySelector<HTMLElement>(`[data-morph-target="${slug}"]`)
    const tl = gsap.timeline()
    if (target) {
      const r = target.getBoundingClientRect()
      tl.to(clone, { left: r.left, top: r.top, width: r.width, height: r.height, boxShadow: '0 0 0 0 rgba(20, 19, 17, 0)', duration: 1, ease: EASE }, 0)
        .add(clear, 0.45)
        .to(veil, { autoAlpha: 0, duration: 0.65, ease: 'power2.inOut' }, 0.5)
        .to(clone, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, 1)
    } else {
      tl.add(clear, 0).to([veil, clone], { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, 0)
    }
    tl.set(clone, { display: 'none' })
    return play(tl)
  },
}

/** A quiet cross-fade through travertine: for checkout, where the visitor is paying, and under reduced motion. A small
 *  card on the veil (the mark and the destination) means it is never blank. */
export const fade: Transition = {
  name: 'fade',
  leave: ({ stage, quick }) => {
    const card = stage.veil.querySelectorAll('[data-veil-card]')
    return play(
      gsap
        .timeline()
        .set(stage.veil, { autoAlpha: 0 })
        .set(card, { autoAlpha: 0, y: 8 })
        .to(stage.veil, { autoAlpha: 1, duration: quick ? 0.2 : 0.3, ease: 'power2.out' }, 0)
        .to(card, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 0.1),
    )
  },
  enter: ({ stage, clear }) => {
    const card = stage.veil.querySelectorAll('[data-veil-card]')
    return play(
      gsap
        .timeline()
        .add(clear)
        .to(card, { autoAlpha: 0, y: -6, duration: 0.25, ease: 'power2.in' }, 0)
        .to(stage.veil, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 0.05),
    )
  },
}

const checkout: Transition = { ...fade, name: 'checkout', custom: ({ from, to }) => from.name === 'checkout' || to.name === 'checkout' }

/** In priority order, as Barba resolves them: the first transition whose rules all match runs. */
export const TRANSITIONS: Transition[] = [morph, checkout, chapter, curtain]

export function pickTransition(ctx: TransitionContext): Transition {
  return TRANSITIONS.find((t) => (!t.custom || t.custom(ctx)) && (!t.from || t.from.includes(ctx.from.name)) && (!t.to || t.to.includes(ctx.to.name))) ?? curtain
}
