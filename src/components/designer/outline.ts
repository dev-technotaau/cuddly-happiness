// A cut's girdle outline, as plain numbers: the 3D stones are built on it, and the designer draws its shape icons from
// it, so the two always match. No three.js here, so the page can use it without the 3D engine.
import { CUTS, type Shape } from '../../data/ring'

export type Pt = [number, number] // x across, z along

/** A cut's girdle outline at unit width (x from −0.5 to 0.5), as a closed polygon, counter-clockwise from +Z. */
export function outlineOf(shape: Shape, ratio = CUTS[shape].ratio, n = 160): Pt[] {
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

/** The outline scaled to a stone's width and offset outward by `grow` (mm), sampled evenly by length. */
export function outlinePath(shape: Shape, width: number, ratio: number, grow = 0, count = 64): Pt[] {
  const base = outlineOf(shape, ratio, 240)
  const pts = base.map(([x, z]) => [x * width, z * width] as Pt)
  // Offset along the polygon's normals.
  const off = pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length]
    const next = pts[(i + 1) % pts.length]
    const tx = next[0] - prev[0]
    const tz = next[1] - prev[1]
    const len = Math.hypot(tx, tz) || 1
    return [p[0] + (tz / len) * grow, p[1] - (tx / len) * grow] as Pt
  })
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
