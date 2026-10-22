// Where a ring sits on a hand the camera sees. From the hand's 21 landmarks: the finger's first bone, the back of the
// hand, the finger's width; then steadied over time, so the ring rests on the finger instead of trembling with the
// tracker. Picture space throughout: x right, y down (pixels), z away from the camera, in the same scale as x.

export type FingerId = 'index' | 'middle' | 'ring' | 'little'
export type V3 = [number, number, number]

/** A tracked hand: its landmarks in the picture's pixels, which hand it is, and how sure the tracker is. */
export interface Hand {
  points: V3[]
  side: 'left' | 'right'
  score: number
}

/** Where the ring goes: its centre and the finger's width (pixels), the finger's direction and the back of the hand. */
export interface FingerPose {
  x: number
  y: number
  // Unit and at right angles: toward the fingertip, and where the stone faces.
  axis: V3
  up: V3
  width: number
}

/** What the picture shows of the hand: too far, too near, the palm to the lens, the finger at the edge, or all well. */
export type Hint = 'far' | 'near' | 'palm' | 'edge' | 'ok'

export const FINGERS: FingerId[] = ['index', 'middle', 'ring', 'little']

// Each finger's base joint, middle joint, and the base joints beside it (their spacing gives its width).
const JOINTS: Record<FingerId, { base: number; mid: number; next: number[] }> = {
  index: { base: 5, mid: 6, next: [9] },
  middle: { base: 9, mid: 10, next: [5, 13] },
  ring: { base: 13, mid: 14, next: [9, 17] },
  little: { base: 17, mid: 18, next: [13] },
}

// An adult hand's proportions: a finger's width at the ring against the spacing of its knuckles, and against its first
// bone (index 18 mm wide on 22 mm knuckles and a 40 mm bone; ring 17 mm on 19 and 42; little 15 mm on 18 and 33).
const WIDTH: Record<FingerId, [spacing: number, bone: number]> = { index: [0.82, 0.45], middle: [0.88, 0.41], ring: [0.89, 0.4], little: [0.83, 0.45] }

// How far along the first bone a ring sits, from the knuckle joint (inside the hand): halfway, past the web of the
// fingers, where rings are worn.
const SEAT = 0.5

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const unit = (a: V3): V3 => scale(a, 1 / (len(a) || 1))

/** `up` made square to `axis`, and unit. */
function square(axis: V3, up: V3): V3 {
  return unit(sub(up, scale(axis, dot(up, axis))))
}

/** The ring's place on a finger of a tracked hand, in the picture's pixels. */
export function fingerPose(hand: Hand, finger: FingerId): FingerPose {
  const p = hand.points
  const j = JOINTS[finger]
  const base = p[j.base]
  const mid = p[j.mid]
  const bone = sub(mid, base)
  const axis = unit(bone)
  // The palm's normal points out of the palm for a left hand, out of the back for a right one.
  const n = unit(cross(sub(p[5], p[0]), sub(p[17], p[0])))
  const up = square(axis, hand.side === 'right' ? scale(n, -1) : n)
  const spacing = j.next.reduce((s, k) => s + len(sub(p[k], base)), 0) / j.next.length
  const [ks, kb] = WIDTH[finger]
  const width = 0.6 * ks * spacing + 0.4 * kb * len(bone)
  return { x: base[0] + bone[0] * SEAT, y: base[1] + bone[1] * SEAT, axis, up, width }
}

/** What to tell the visitor about the hand in a picture `w` × `h`. */
export function hintFor(hand: Hand, pose: FingerPose, w: number, h: number): Hint {
  const p = hand.points
  const span = Math.hypot(p[9][0] - p[0][0], p[9][1] - p[0][1])
  const short = Math.min(w, h)
  if (span < short * 0.14) return 'far'
  if (span > short * 0.62) return 'near'
  const m = short * 0.04
  if (pose.x < m || pose.y < m || pose.x > w - m || pose.y > h - m) return 'edge'
  // The back of the hand faces the lens when "up" points toward the camera (negative z).
  if (pose.up[2] > 0.35) return 'palm'
  return 'ok'
}

/** A ring placed by hand at (`x`, `y`), turned `rotate` degrees, the stone toward the lens; `width` in pixels. */
export function placedPose(x: number, y: number, rotate: number, width: number): FingerPose {
  // The finger runs up the picture, leaning a little away from the lens.
  const r = (rotate * Math.PI) / 180
  const lean = 0.34
  const axis = unit([Math.sin(r) * Math.cos(lean), -Math.cos(r) * Math.cos(lean), Math.sin(lean)])
  return { x, y, axis, up: square(axis, [0, 0, -1]), width }
}

/** The One Euro filter: smooth when still, quick when moving (Casiez, Roussel & Vogel, 2012). */
class OneEuro {
  private x: number | null = null
  private dx = 0
  private t = 0

  constructor(private minCutoff: number, private beta: number, private dCutoff = 1) {}

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  filter(v: number, t: number) {
    if (this.x === null) {
      this.x = v
      this.t = t
      return v
    }
    const dt = Math.max(1e-3, (t - this.t) / 1000)
    this.t = t
    const dv = (v - this.x) / dt
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dv - this.dx)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += OneEuro.alpha(cutoff, dt) * (v - this.x)
    return this.x
  }

  reset() {
    this.x = null
    this.dx = 0
  }
}

/** Steadies a pose over time (`t` in ms); the stone changes sides only when the tracker agrees for six frames. */
export class Steady {
  private place = [new OneEuro(1.4, 0.012), new OneEuro(1.4, 0.012)]
  private size = new OneEuro(0.7, 0.004)
  private turn = [0, 1, 2, 3, 4, 5].map(() => new OneEuro(1.6, 0.6))
  private last: FingerPose | null = null
  private flips = 0

  next(p: FingerPose, t: number): FingerPose {
    let up = p.up
    if (this.last && dot(up, this.last.up) < -0.2) {
      if (++this.flips < 6) up = scale(up, -1)
      else this.flips = 0
    } else this.flips = 0
    const x = this.place[0].filter(p.x, t)
    const y = this.place[1].filter(p.y, t)
    const width = this.size.filter(p.width, t)
    const a = unit(p.axis.map((v, i) => this.turn[i].filter(v, t)) as V3)
    const u = square(a, up.map((v, i) => this.turn[i + 3].filter(v, t)) as V3)
    this.last = { x, y, axis: a, up: u, width }
    return this.last
  }

  reset() {
    this.place.forEach((f) => f.reset())
    this.size.reset()
    this.turn.forEach((f) => f.reset())
    this.last = null
    this.flips = 0
  }
}
