// The stage is "covered" while the splash or a page transition hides the page. Entrances (the home hero, the PDP
// intro, scroll reveals) wait for it to clear, so they play as the page is uncovered instead of unseen beneath it.
import { parseHash } from '../store'

let covered = 0
let waiting: (() => void)[] = []

/** Something now hides the page. */
export function coverStage() {
  covered++
}

/** One cover lifts; once none is left, the waiting entrances run. */
export function clearStage() {
  covered = Math.max(0, covered - 1)
  if (covered) return
  const run = waiting
  waiting = []
  run.forEach((f) => f())
}

/** Runs `build` now, or once the stage clears. Returns a cleanup that cancels a pending run or undoes the build. */
export function onStageClear(build: () => void | (() => void)): () => void {
  let undo: void | (() => void)
  let cancelled = false
  const run = () => {
    if (!cancelled) undo = build()
  }
  if (covered) waiting.push(run)
  else run()
  return () => {
    cancelled = true
    if (typeof undo === 'function') undo()
  }
}

// The intro (src/components/splash/Splash.tsx) plays in full once per session when the visit starts on Home, shorter
// when it starts deeper in the site, and later loads get only a brief veil. The inline script in .figma/make/site.json
// makes the same check before first paint, to paint the page dark while the intro is coming.
const INTRO_KEY = 'tns-intro'
export type IntroMode = 'full' | 'short' | 'veil'

export const INTRO: IntroMode = (() => {
  let seen = false
  try {
    seen = sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    // Storage blocked: play it, it's only once per load.
  }
  if (seen) return 'veil'
  return parseHash().name === 'home' ? 'full' : 'short'
})()

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Storage blocked: the intro simply plays again next time.
  }
}

// The intro covers the stage from the very first render, before any entrance can start.
coverStage()
