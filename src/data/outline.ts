// A cut's girdle outline, as plain numbers: the 3D stones are built on it, the designer draws its shape icons from it,
// and the ring's layout counts the small stones round it, so all three always match. No three.js here, so the page and
// the layout can use it without the 3D engine.
import type { Shape } from './ring'

export type Pt = [number, number] // x across, z along

/** A cut's girdle outline at unit width (x from −0.5 to 0.5), as a closed polygon, counter-clockwise from +Z. */
export function outlineOf(shape: Shape, ratio: number, n = 160): Pt[] {
  const a = 0.5
  const b = ratio / 2
  const pts: Pt[] = []
  const superellipse = (e: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2
      const s = Math.sin(t)
      const c = Math.cos(t)
      pts.push([a * Math.sign(s) * Math.abs(s) ** (2 / e), b * Math.sign(c) * Math.abs(c) ** (2 / e)])
    }
  }
  const octagon = (cut: number) => {
    const k = cut * Math.min(a, b)
    const corners: Pt[] = [[a - k, b], [a, b - k], [a, -b + k], [a - k, -b], [-a + k, -b], [-a, -b + k], [-a, b - k], [-a + k, b]]
    // Sampled along its sides, so the polar sampler meets straight edges.
    for (let i = 0; i < 8; i++) {
      const [x0, z0] = corners[i]
      const [x1, z1] = corners[(i + 1) % 8]
      const steps = 12
      for (let j = 0; j < steps; j++) pts.push([x0 + ((x1 - x0) * j) / steps, z0 + ((z1 - z0) * j) / steps])
    }
  }
  switch (shape) {
    case 'round':
    case 'oval':
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2
        pts.push([a * Math.sin(t), b * Math.cos(t)])
      }
      break
    case 'cushion':
      superellipse(3.4)
      break
    case 'princess':
      superellipse(16)
      break
    case 'radiant':
      octagon(0.2)
      break
    case 'emerald':
      octagon(0.26)
      break
    case 'asscher':
      octagon(0.34)
      break
    case 'marquise': {
      // A lens: two arcs meeting at points along the length.
      const R = (b * b + a * a) / (2 * a)
      const c = R - a
      const side = (sign: number) => {
        for (let i = 0; i <= n / 2; i++) {
          const z = b - (2 * b * i) / (n / 2)
          pts.push([sign * (Math.sqrt(Math.max(0, R * R - z * z)) - c), sign > 0 ? z : -z])
        }
      }
      side(1)
      side(-1)
      break
    }
    case 'pear': {
      // A round end towards −Z, a point at +Z, sides gently full.
      const cz = -b + a
      const d = b - cz
      const open = Math.acos(a / d)
      const tip: Pt = [0, b]
      const right: Pt = [a * Math.cos(Math.PI / 2 - open), cz + a * Math.sin(Math.PI / 2 - open)]
      const left: Pt = [-right[0], right[1]]
      const bulge = 0.045
      const flank = (from: Pt, to: Pt, out: number) => {
        const steps = 30
        const nx = -(to[1] - from[1])
        const nz = to[0] - from[0]
        const len = Math.hypot(nx, nz)
        for (let i = 0; i < steps; i++) {
          const s = i / steps
          const k = bulge * Math.sin(Math.PI * s) * out
          pts.push([from[0] + (to[0] - from[0]) * s + (nx / len) * k, from[1] + (to[1] - from[1]) * s + (nz / len) * k])
        }
      }
      flank(tip, right, -1)
      const from = Math.PI / 2 - open
      const to = -Math.PI * 1.5 + open
      const steps = 90
      for (let i = 0; i <= steps; i++) {
        const t = from + ((to - from) * i) / steps
        pts.push([a * Math.cos(t), cz + a * Math.sin(t)])
      }
      flank(left, tip, -1)
      break
    }
    case 'heart': {
      // The classic heart curve, its point towards +Z and its cleft towards −Z.
      const raw: Pt[] = []
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2
        raw.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))])
      }
      const xs = raw.map((p) => p[0])
      const zs = raw.map((p) => p[1])
      const w = Math.max(...xs) - Math.min(...xs)
      const l = Math.max(...zs) - Math.min(...zs)
      const mz = (Math.max(...zs) + Math.min(...zs)) / 2 + l * 0.04
      for (const [x, z] of raw) pts.push([x / w, ((z - mz) / l) * ratio])
      break
    }
  }
  // Counter-clockwise seen from above, starting nearest +Z.
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i]
    const [x1, z1] = pts[(i + 1) % pts.length]
    area += x0 * z1 - x1 * z0
  }
  return area < 0 ? pts.reverse() : pts
}

/** The outline's radius in a direction (radians from +Z towards +X): where a ray from the centre first leaves it, so a
 *  heart keeps its cleft. */
export function radiusAt(outline: Pt[], phi: number): number {
  const dx = Math.sin(phi)
  const dz = Math.cos(phi)
  let best = Infinity
  for (let i = 0; i < outline.length; i++) {
    const [x0, z0] = outline[i]
    const [x1, z1] = outline[(i + 1) % outline.length]
    const ex = x1 - x0
    const ez = z1 - z0
    const den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-12) continue
    const t = (x0 * ez - z0 * ex) / den
    const u = (x0 * dz - z0 * dx) / den
    if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.min(best, t)
  }
  return Number.isFinite(best) ? best : 0
}

/** A closed path's length. */
export function pathLength(path: Pt[]): number {
  let total = 0
  for (let i = 0; i < path.length; i++) {
    const [x0, z0] = path[i]
    const [x1, z1] = path[(i + 1) % path.length]
    total += Math.hypot(x1 - x0, z1 - z0)
  }
  return total
}

/** How far along a closed path (from its first point) it passes a direction from the centre (radians from +Z toward
 *  +X): at its point nearest that direction. */
export function arcAt(path: Pt[], phi: number): number {
  const dx = Math.sin(phi)
  const dz = Math.cos(phi)
  let best = -Infinity
  let at = 0
  let s = 0
  for (let i = 0; i < path.length; i++) {
    const [x, z] = path[i]
    const c = (x * dx + z * dz) / (Math.hypot(x, z) || 1)
    if (c > best) {
      best = c
      at = s
    }
    const [x1, z1] = path[(i + 1) % path.length]
    s += Math.hypot(x1 - x, z1 - z)
  }
  return at
}

/** A stretch of a closed path small stones keep clear of (where a claw passes between them): its middle (arc length
 *  from the path's start) and half its length. */
export interface Keep {
  at: number
  half: number
}

/** The free stretches of a closed path of length `length` between its `keep`s, in order round it from the first keep:
 *  [start, end] in arc length (an end may run past the path's length, round past its start); keeps that overlap count
 *  as one. The whole path when there are no keeps, starting at `from`; none when the keeps cover it. */
function stretches(length: number, keep: Keep[], from = 0): [number, number][] {
  if (!keep.length) return [[from, from + length]]
  const kept = keep.map((k): [number, number] => {
    const c = ((k.at % length) + length) % length
    return [c - k.half, c + k.half]
  }).sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [a, b] of kept) {
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  // The last may run round into the first.
  while (merged.length > 1 && merged[merged.length - 1][1] >= merged[0][0] + length) {
    const [a, b] = merged.pop()!
    merged[0] = [a - length, Math.max(merged[0][1], b - length)]
  }
  if (merged.length === 1 && merged[0][1] - merged[0][0] >= length) return []
  return merged.map(([, b], i) => [b, merged[(i + 1) % merged.length][0] + (i + 1 === merged.length ? length : 0)])
}

/** How many small stones each free stretch of a closed path takes (`stretches`): one at each end, against its keep (the
 *  claw passing between it and the next run's), and the rest between, `pitch` apart centre to centre at least (a
 *  twentieth less where it nearly fits); one in the middle of a stretch too short for two. The counts the price and the
 *  3D view both go by. */
export function meleeRuns(length: number, pitch: number, keep: Keep[]): number[] {
  if (!keep.length) return [Math.max(1, Math.round(length / pitch))]
  return stretches(length, keep).map(([a, b]) => (b < a ? 0 : Math.floor((b - a) / pitch + 0.05) + 1))
}

/** Where small stones sit along a closed path, `runs` of them (`meleeRuns`) each spread evenly over its stretch, its
 *  first and last at the stretch's ends: every stone's arc position, every gap's between two of them (with the spacing
 *  there), and each run's ends (`way`: the side its keep is on, -1 back along the path, 1 on). Without keeps a stone
 *  sits at `from` and the gaps fall between, all the way round. */
export function meleePlaces(length: number, runs: number[], keep: Keep[], from = 0): { stones: number[]; gaps: { at: number; spacing: number }[]; ends: { at: number; way: number }[] } {
  const stones: number[] = []
  const gaps: { at: number; spacing: number }[] = []
  const ends: { at: number; way: number }[] = []
  const wrap = (s: number) => ((s % length) + length) % length
  if (!keep.length) {
    const n = runs[0] ?? 0
    for (let j = 0; j < n; j++) {
      stones.push(wrap(from + (j * length) / n))
      gaps.push({ at: wrap(from + ((j + 0.5) * length) / n), spacing: length / n })
    }
    return { stones, gaps, ends }
  }
  stretches(length, keep).forEach(([a, b], i) => {
    const n = runs[i] ?? 0
    if (!n) return
    const spacing = n > 1 ? (b - a) / (n - 1) : 0
    const first = n > 1 ? a : (a + b) / 2
    for (let j = 0; j < n; j++) stones.push(wrap(first + j * spacing))
    for (let j = 0; j + 1 < n; j++) gaps.push({ at: wrap(first + (j + 0.5) * spacing), spacing })
    ends.push({ at: wrap(first), way: -1 }, { at: wrap(first + (n - 1) * spacing), way: 1 })
  })
  return { stones, gaps, ends }
}

/** A closed polygon with the loops it folds into cut out: where two of its edges cross, the stretch between them goes
 *  and the crossing stays (a concave notch grown outward folds over itself, a swallowtail). */
function unfold(pts: Pt[]): Pt[] {
  let out = pts
  for (let pass = 0; pass < 8; pass++) {
    const n = out.length
    let cut: [number, number, Pt] | null = null
    for (let i = 0; i < n && !cut; i++) {
      const [ax, az] = out[i]
      const [bx, bz] = out[(i + 1) % n]
      // A loop is short: look a quarter of the way round at most.
      for (let k = 2; k < Math.min(n - 1, n / 4); k++) {
        const j = (i + k) % n
        const [cx, cz] = out[j]
        const [dx, dz] = out[(j + 1) % n]
        const den = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx)
        if (Math.abs(den) < 1e-12) continue
        const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / den
        const u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / den
        if (t > 0 && t < 1 && u > 0 && u < 1) {
          cut = [i, j, [ax + (bx - ax) * t, az + (bz - az) * t]]
          break
        }
      }
    }
    if (!cut) return out
    const [i, j, x] = cut
    // Keep the point after the second edge's start round to the first edge's start, with the crossing between.
    const kept: Pt[] = [x]
    for (let k = (j + 1) % n; k !== (i + 1) % n; k = (k + 1) % n) kept.push(out[k])
    out = kept
  }
  return out
}

/** A closed polygon's convex hull (a heart's cleft bridged), running the same way round, from the point nearest its
 *  first, and as finely spaced along its edges as the polygon was (so it is grown square along them, as the outline's
 *  own edges are). */
export function hullOf(pts: Pt[]): Pt[] {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const turn = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const chain = (list: Pt[]) => {
    const out: Pt[] = []
    for (const p of list) {
      while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    return out.slice(0, -1)
  }
  const corners = [...chain(sorted), ...chain([...sorted].reverse())]
  const step = pathLength(pts) / pts.length
  let hull: Pt[] = []
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length]
    const k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
    for (let j = 0; j < k; j++) hull.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k])
  })
  const area = (q: Pt[]) => q.reduce((t, p, i) => t + p[0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * p[1], 0)
  if (area(hull) * area(pts) < 0) hull = hull.reverse()
  let k = 0
  hull.forEach((p, i) => {
    if (Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) < Math.hypot(hull[k][0] - pts[0][0], hull[k][1] - pts[0][1])) k = i
  })
  return [...hull.slice(k), ...hull.slice(0, k)]
}

/** An outline's radius (`width` mm across) toward a point, from a table of `n` directions: for many quick looks. */
export function radiusTable(outline: Pt[], width: number, n = 720): (x: number, z: number) => number {
  const table = [...Array(n).keys()].map((i) => radiusAt(outline, (i / n) * Math.PI * 2) * width)
  return (x, z) => {
    const a = (((Math.atan2(x, z) / (Math.PI * 2)) % 1) + 1) % 1 * n
    const i = Math.floor(a)
    return table[i % n] + (table[(i + 1) % n] - table[i % n]) * (a - i)
  }
}

/** The outline scaled to a stone's width and offset outward by `grow` (mm), sampled evenly by length; round its convex
 *  hull when `hull` (a heart's cleft bridged). */
export function outlinePath(shape: Shape, width: number, ratio: number, grow = 0, count = 64, hull = false): Pt[] {
  const base = hull ? hullOf(outlineOf(shape, ratio, 240)) : outlineOf(shape, ratio, 240)
  const pts = base.map(([x, z]) => [x * width, z * width] as Pt)
  // Offset along the polygon's normals; a heart's cleft, grown, folds over itself and is unfolded.
  const grown = pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length]
    const next = pts[(i + 1) % pts.length]
    const tx = next[0] - prev[0]
    const tz = next[1] - prev[1]
    const len = Math.hypot(tx, tz) || 1
    return [p[0] + (tz / len) * grow, p[1] - (tx / len) * grow] as Pt
  })
  const off = shape === 'heart' && grow > 0 && !hull ? unfold(grown) : grown
  const seg = off.map((p, i) => Math.hypot(off[(i + 1) % off.length][0] - p[0], off[(i + 1) % off.length][1] - p[1]))
  const total = seg.reduce((s, n) => s + n, 0)
  const out: Pt[] = []
  let i = 0
  let acc = 0
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total
    while (acc + seg[i] < target && i < off.length - 1) acc += seg[i++]
    const f = seg[i] ? (target - acc) / seg[i] : 0
    const a = off[i]
    const b = off[(i + 1) % off.length]
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
  }
  return out
}
