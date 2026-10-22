// The ring's metalwork, generated from its layout: a band swept around the finger, claws drawn as tapered wires over
// the stone, rails, rims, galleries and arches, and the placements of every small stone and bead. Millimetres; the
// finger runs along Z, the band lies in the XY plane, the head sits at +Y.
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from 'three'
import type { Layout, RingDesign } from '../../../data/ring'
import { outlineOf, outlinePath, radiusAt, type Pt } from '../outline'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ─── Band ───────────────────────────────────────────────────────────────────────────────────────────────────────────

type Section = Pt[] // [u (outward from the inner surface), v (along the finger)]

/** A comfort-fit section: flat sides, a domed outside, a gently domed inside. */
function comfort(w: number, t: number, p = 28): Section {
  const out: Section = []
  for (let i = 0; i < p; i++) {
    const s = (i / p) * Math.PI * 2
    const c = Math.cos(s)
    const sn = Math.sin(s)
    const v = (w / 2) * Math.sign(c) * Math.abs(c) ** (2 / 6)
    const u = t / 2 + (t / 2) * Math.sign(sn) * Math.abs(sn) ** (2 / (sn >= 0 ? 2.4 : 4.2))
    out.push([u, v])
  }
  return out
}

/** A knife-edge section: the outside rises to a fine ridge. */
function knife(w: number, t: number, p = 28): Section {
  const out: Section = []
  for (let i = 0; i < p; i++) {
    const s = (i / p) * Math.PI * 2
    const c = Math.cos(s)
    const sn = Math.sin(s)
    const v = (w / 2) * Math.sign(c) * Math.abs(c) ** (2 / 6)
    const u = sn >= 0 ? t * 0.42 + t * 0.58 * (1 - Math.abs(c)) ** 0.9 * Math.min(1, sn * 4) : t / 2 + (t / 2) * Math.sign(sn) * Math.abs(sn) ** (2 / 4.2) * 0.84
    out.push([u, v])
  }
  return out
}

/** A round strand's section (twist, split shanks near the head). */
function strand(r: number, p = 16): Section {
  const out: Section = []
  for (let i = 0; i < p; i++) {
    const s = (i / p) * Math.PI * 2
    out.push([r + r * Math.sin(s), r * Math.cos(s)])
  }
  return out
}

interface Sweep {
  inner: number
  segments: number
  /** The section at an angle, the same number of points each time. */
  section: (theta: number) => Section
  /** Moves the section: [outward, along the finger]. */
  offset?: (theta: number) => [number, number]
  from?: number
  to?: number
}

/** Sweeps a section around the finger. A full turn closes on itself, so its normals stay smooth across the seam. */
export function sweep({ inner, segments, section, offset, from = 0, to = Math.PI * 2 }: Sweep): BufferGeometry {
  const closed = Math.abs(to - from - Math.PI * 2) < 1e-6
  const rows = closed ? segments : segments + 1
  const first = section(from)
  const p = first.length
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i < rows; i++) {
    const theta = from + ((to - from) * i) / segments
    const sec = i === 0 ? first : section(theta)
    const [du, dv] = offset ? offset(theta) : [0, 0]
    const nx = Math.sin(theta)
    const ny = Math.cos(theta)
    for (let j = 0; j < p; j++) {
      const [u, v] = sec[j]
      const r = inner + u + du
      pos.push(nx * r, ny * r, v + dv)
      // About a centimetre per texture tile each way: seven round the finger, one across the band.
      uv.push((theta / (Math.PI * 2)) * 7, j / p)
    }
  }
  const index: number[] = []
  const cols = closed ? rows : rows - 1
  for (let i = 0; i < cols; i++) {
    const i1 = (i + 1) % rows
    for (let j = 0; j < p; j++) {
      const j1 = (j + 1) % p
      const a = i * p + j
      const b = i1 * p + j
      const c = i1 * p + j1
      const d = i * p + j1
      index.push(a, d, b, b, d, c)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** The band's geometries for a design: one piece, or two strands for a split shank or a twist. */
export function bandGeometries(d: RingDesign, L: Layout): BufferGeometry[] {
  const { inner, width, thickness, topWidth } = L.band
  const taper = (theta: number) => {
    const a = Math.abs(((theta + Math.PI) % (Math.PI * 2)) - Math.PI)
    return width + (topWidth - width) * smooth(1.35, 0.15, a)
  }
  const near = (theta: number) => Math.abs(((theta + Math.PI) % (Math.PI * 2)) - Math.PI)
  const segments = 220
  if (d.band.form === 'twist') {
    const r = width * 0.3
    const turns = 9
    return [1, -1].map((s) => sweep({ inner, segments: 320, section: () => strand(r), offset: (th) => [thickness / 2 - r + s * (width * 0.2) * Math.sin(turns * th), s * (width * 0.24) * Math.cos(turns * th)] }))
  }
  if (d.band.form === 'split') {
    // Two halves that meet below and part around the head.
    const spread = Math.max(0, L.centre.length * 0.42 - width / 4)
    return [1, -1].map((s) => sweep({ inner, segments, section: (th) => comfort(taper(th) * 0.56, thickness), offset: (th) => [0, s * (taper(th) * 0.24 + spread * smooth(1.25, 0.1, near(th)))] }))
  }
  const profile = d.band.form === 'knife' ? knife : comfort
  return [sweep({ inner, segments, section: (th) => profile(taper(th), thickness) })]
}

/** The band's outer surface height (from the inner surface) along a section line, for seating stones and beads. */
export const bandTopU = (L: Layout) => L.band.thickness * 0.98

// ─── Wires ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A wire along points, its section an ellipse that can change along it: [across, through]. `side` fixes which way is
 *  across (a flat claw lies along the stone's edge); without it the frame follows the curve. */
export function wire(points: Vector3[], radius: (t: number) => [number, number], segments = 28, radial = 12, closed = false, side?: Vector3): BufferGeometry {
  const curve = new CatmullRomCurve3(points, closed, 'centripetal')
  const frames = curve.computeFrenetFrames(segments, closed)
  const pos: number[] = []
  const rows = closed ? segments : segments + 1
  for (let i = 0; i < rows; i++) {
    const t = i / segments
    const c = curve.getPointAt(t)
    const [rx, ry] = radius(t)
    const b = side ? side : frames.binormals[i]
    const n = side ? new Vector3().crossVectors(curve.getTangentAt(t), side).normalize() : frames.normals[i]
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2
      const x = Math.cos(a) * rx
      const y = Math.sin(a) * ry
      pos.push(c.x + b.x * x + n.x * y, c.y + b.y * x + n.y * y, c.z + b.z * x + n.z * y)
    }
  }
  const index: number[] = []
  const cols = closed ? rows : rows - 1
  for (let i = 0; i < cols; i++) {
    const i1 = (i + 1) % rows
    for (let j = 0; j < radial; j++) {
      const j1 = (j + 1) % radial
      index.push(i * radial + j, i1 * radial + j, i * radial + j1, i * radial + j1, i1 * radial + j, i1 * radial + j1)
    }
  }
  // Close the ends of an open wire.
  if (!closed) {
    for (const [row, flip] of [[0, true], [rows - 1, false]] as const) {
      const centre = curve.getPointAt(row === 0 ? 0 : 1)
      const ci = pos.length / 3
      pos.push(centre.x, centre.y, centre.z)
      for (let j = 0; j < radial; j++) {
        const j1 = (j + 1) % radial
        if (flip) index.push(ci, row * radial + j1, row * radial + j)
        else index.push(ci, row * radial + j, row * radial + j1)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** A sphere-ish bead to cap a round claw. */
export function bead(at: Vector3, r: number): BufferGeometry {
  return wire([at.clone().add(new Vector3(0, -r * 0.9, 0)), at.clone().add(new Vector3(0, r * 0.9, 0))], (t) => {
    const k = Math.sin(Math.PI * t) ** 0.5
    return [r * k + 1e-4, r * k + 1e-4]
  }, 10, 12)
}

/** The stone's outline in the ring, scaled and grown, at a height. */
export function ringOutline(d: RingDesign, L: Layout, grow: number, count: number): Pt[] {
  return outlinePath(d.stone.shape, L.centre.width, L.centre.length / L.centre.width, grow, count)
}

/** Where the girdle is in a direction (degrees from +Z): its radius in mm. */
export function girdleRadius(d: RingDesign, L: Layout, deg: number) {
  return radiusAt(outlineOf(d.stone.shape, L.centre.length / L.centre.width, 200), (deg * Math.PI) / 180) * L.centre.width
}

export interface Claw {
  geometry: BufferGeometry
  cap: BufferGeometry | null
  /** Where it grows from, for the build animation. */
  base: Vector3
}

/** The claws around the centre stone, each a tapered wire from the basket, up the pavilion, over the crown. */
export function claws(d: RingDesign, L: Layout): Claw[] {
  const out: Claw[] = []
  const w = L.prongs.wire
  const gY = L.y.girdle
  const crown = L.centre.crown
  const make = (deg: number, tipTo?: Vector3) => {
    const phi = (deg * Math.PI) / 180
    const dir = new Vector3(Math.sin(phi), 0, Math.cos(phi))
    const r = girdleRadius(d, L, deg)
    const contact = dir.clone().multiplyScalar(r + w * 0.55).setY(gY)
    const base = dir.clone().multiplyScalar(Math.max(0.6, Math.min(r * 0.42, 2.4))).setY(L.y.bandTop - 0.15)
    const mid = dir.clone().multiplyScalar(r * 0.72 + w * 0.5).setY(L.y.culet + (gY - L.y.culet) * 0.55)
    const eagle = d.prongs.tip === 'eagle'
    const tab = d.prongs.tip === 'tab'
    const reach = eagle ? w * 2.2 : tab ? w * 1.6 : w * 1.15
    const tip = tipTo ?? contact.clone().addScaledVector(dir, -reach).setY(gY + crown * (eagle ? 0.42 : 0.36))
    const over = contact.clone().addScaledVector(dir, -reach * 0.35).setY(gY + crown * 0.22)
    const radius = (t: number): [number, number] => {
      const end = smooth(0.62, 1, t)
      if (eagle) return [w * (1 - end * 0.86), w * (1 - end * 0.82)]
      if (tab) return [w * (1 + end * 0.65), w * (1 - end * 0.45)]
      return [w * (1 - end * 0.08), w * (1 - end * 0.08)]
    }
    const geometry = wire([base, mid, contact, over, tip], radius, 30, 12, false, new Vector3(Math.cos(phi), 0, -Math.sin(phi)))
    const cap = eagle || tab ? null : bead(tip, w * 0.92)
    out.push({ geometry, cap, base })
  }
  for (const deg of L.prongs.positions) make(deg)
  // V-claws: two wires that meet at the stone's point.
  for (const deg of L.prongs.vTips) {
    const phi = (deg * Math.PI) / 180
    const r = girdleRadius(d, L, deg)
    const point = new Vector3(Math.sin(phi), 0, Math.cos(phi)).multiplyScalar(r + w * 0.4).setY(gY + crown * 0.3)
    make(deg - 9, point)
    make(deg + 9, point)
  }
  return out
}

/** The basket's rail: a ring under the girdle tying the claws together. */
export function basketRail(d: RingDesign, L: Layout, at = 0.55, scale = 0.74, r = 0.32): BufferGeometry {
  const y = L.y.culet + (L.y.girdle - L.y.culet) * at
  const path = ringOutline(d, L, 0, 48).map(([x, z]) => new Vector3(x * scale, y, z * scale))
  return wire(path, () => [r, r], 96, 8, true)
}

/** A seat where the head meets the band. */
export function seat(L: Layout): BufferGeometry {
  const y = L.y.bandTop - 0.2
  const r = Math.min(2.2, L.centre.width * 0.3)
  const path = [...Array(24).keys()].map((i) => {
    const a = (i / 24) * Math.PI * 2
    return new Vector3(Math.sin(a) * r, y, Math.cos(a) * r * 0.8)
  })
  return wire(path, () => [0.38, 0.38], 48, 8, true)
}

/** A rim along a closed path at a height: [outward, up] section points, swept around. */
export function rim(path: Pt[], y: number, section: Pt[]): BufferGeometry {
  const n = path.length
  const p = section.length
  const pos: number[] = []
  for (let i = 0; i < n; i++) {
    const [x, z] = path[i]
    const prev = path[(i - 1 + n) % n]
    const next = path[(i + 1) % n]
    const tx = next[0] - prev[0]
    const tz = next[1] - prev[1]
    const len = Math.hypot(tx, tz) || 1
    const ox = tz / len
    const oz = -tx / len
    for (let j = 0; j < p; j++) {
      const [o, up] = section[j]
      pos.push(x + ox * o, y + up, z + oz * o)
    }
  }
  const index: number[] = []
  for (let i = 0; i < n; i++) {
    const i1 = (i + 1) % n
    for (let j = 0; j < p; j++) {
      const j1 = (j + 1) % p
      index.push(i * p + j, i * p + j1, i1 * p + j, i1 * p + j, i * p + j1, i1 * p + j1)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** A rounded rectangle section [outward, up], centred. */
export function roundedRect(w: number, h: number, p = 20): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < p; i++) {
    const s = (i / p) * Math.PI * 2
    const c = Math.cos(s)
    const sn = Math.sin(s)
    out.push([(w / 2) * Math.sign(c) * Math.abs(c) ** (2 / 5), (h / 2) * Math.sign(sn) * Math.abs(sn) ** (2 / 5)])
  }
  return out
}

/** A smooth wall through scaled copies of an outline (`rings`: [scale, height], top first), facing outwards; `inside`
 *  faces it inwards, for the wall's inner face. */
function loft(path: Pt[], rings: [number, number][], inside = false): BufferGeometry {
  const n = path.length
  const pos: number[] = []
  for (const [k, y] of rings) for (const [x, z] of path) pos.push(x * k, y, z * k)
  // Which winding faces outwards depends on the outline's direction: test the first face against its position.
  const a = new Vector3(pos[0], pos[1], pos[2])
  const e1 = new Vector3(pos[n * 3], pos[n * 3 + 1], pos[n * 3 + 2]).sub(a)
  const e2 = new Vector3(pos[3], pos[4], pos[5]).sub(a)
  const outward = new Vector3().crossVectors(e1, e2).dot(new Vector3(a.x, 0, a.z)) > 0
  const flip = outward === inside
  const index: number[] = []
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const j1 = (j + 1) % n
      const p = i * n + j
      const q = (i + 1) * n + j
      const r = (i + 1) * n + j1
      const s = i * n + j1
      if (flip) index.push(p, s, q, s, r, q)
      else index.push(p, q, s, s, q, r)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** A bezel: a rim of metal around the girdle, and a smooth cup beneath it, narrowing to the band. */
export function bezel(d: RingDesign, L: Layout): BufferGeometry[] {
  const g = L.y.girdle
  const path = ringOutline(d, L, 0.32, 96)
  const top = g - 0.8
  const bottom = L.y.bandTop + 0.05
  const rings: [number, number][] = [...Array(11).keys()].map((i) => {
    const t = i / 10
    return [1 - 0.58 * t ** 1.25, top + (bottom - top) * t]
  })
  return [rim(path, g - 0.2, roundedRect(0.62, 1.5)), loft(path, rings), loft(path, rings.map(([k, y]) => [k * 0.93, y] as [number, number]), true)]
}

/** The halo's gallery: a plate under its stones, following the centre stone's outline. */
export function haloGallery(d: RingDesign, L: Layout): BufferGeometry {
  const mm = L.halo!.mm
  const path = ringOutline(d, L, 0.25 + mm / 2, 128)
  return rim(path, L.y.girdle - 0.42 - mm * 0.25, roundedRect(mm + 0.42, 0.85))
}

/** Arches rising from the band's shoulders to the basket, on both faces of the ring. */
export function cathedral(d: RingDesign, L: Layout): BufferGeometry[] {
  const out: BufferGeometry[] = []
  const R = L.band.inner + L.band.thickness * 0.85
  const z = L.band.topWidth * 0.32
  for (const side of [1, -1]) {
    for (const face of [1, -1]) {
      const th = 0.62 * side
      const start = new Vector3(Math.sin(th) * R, Math.cos(th) * R, face * z)
      const rail = L.y.culet + (L.y.girdle - L.y.culet) * 0.5
      const end = new Vector3(side * Math.max(0.9, girdleRadius(d, L, 90) * 0.66), rail, face * Math.max(z, girdleRadius(d, L, 0) * 0.42))
      const mid = new Vector3((start.x + end.x) / 2 + side * 0.4, (start.y + end.y) / 2 + 0.9, face * (z + (end.z * face - z) * 0.4))
      out.push(wire([start, mid, end], (t) => {
        const k = 0.62 - 0.18 * t
        return [k, k]
      }, 24, 10))
    }
  }
  return out
}

// ─── Placements ─────────────────────────────────────────────────────────────────────────────────────────────────────

const Y = new Vector3(0, 1, 0)

/** A transform that stands a stone (table up its local Y) at a point, facing a direction. */
export function standing(at: Vector3, facing: Vector3, spin = 0, scale = 1): Matrix4 {
  const q = new Quaternion().setFromUnitVectors(Y, facing.clone().normalize())
  if (spin) q.multiply(new Quaternion().setFromAxisAngle(Y, spin))
  return new Matrix4().compose(at, q, new Vector3(scale, scale, scale))
}

/** Stones along the band (pavé or channel): placements and the beads between them. */
export function bandStones(d: RingDesign, L: Layout): { stones: Matrix4[]; beads: Matrix4[]; rails: BufferGeometry[]; order: number[] } {
  const p = L.pave!
  const stones: Matrix4[] = []
  const beads: Matrix4[] = []
  const order: number[] = []
  const { inner, thickness } = L.band
  const per = p.count / (2 * p.rows)
  const [a0, a1] = p.arc
  const splitSpread = (th: number) => (d.band.form === 'split' ? Math.max(0, L.centre.length * 0.42 - L.band.width / 4) * smooth(1.25, 0.1, Math.abs(th)) : 0)
  const strandOffset = (th: number, row: number) => (p.rows === 2 ? (row ? -1 : 1) * (L.band.width * 0.24 + splitSpread(th)) : 0)
  const seatU = thickness - (p.channel ? 0.22 : 0.06)
  for (const side of [1, -1]) {
    for (let row = 0; row < p.rows; row++) {
      for (let i = 0; i < per; i++) {
        const th = side * (a0 + ((a1 - a0) * (i + 0.5)) / per)
        const n = new Vector3(Math.sin(th), Math.cos(th), 0)
        const v = strandOffset(th, row)
        const at = n.clone().multiplyScalar(inner + seatU).setZ(v)
        stones.push(standing(at, n, 0, p.mm))
        order.push(Math.abs(th))
        if (!p.channel) {
          // Two beads in each gap, on both edges of the stone.
          const gap = side * (a0 + ((a1 - a0) * (i + 1)) / per)
          if (i < per - 1) {
            const gn = new Vector3(Math.sin(gap), Math.cos(gap), 0)
            for (const e of [1, -1]) beads.push(new Matrix4().makeTranslation(gn.x * (inner + thickness + 0.02), gn.y * (inner + thickness + 0.02), v + e * p.mm * 0.42))
          }
        }
      }
    }
  }
  const rails: BufferGeometry[] = []
  if (p.channel) {
    for (const side of [1, -1]) {
      for (const e of [1, -1]) {
        const pts = [...Array(14).keys()].map((i) => {
          const th = side * (a0 - 0.04 + ((a1 - a0 + 0.08) * i) / 13)
          const r = inner + thickness + 0.04
          return new Vector3(Math.sin(th) * r, Math.cos(th) * r, e * (p.mm / 2 + 0.1))
        })
        rails.push(wire(pts, () => [0.15, 0.15], 40, 8))
      }
    }
  }
  return { stones, beads, rails, order }
}

/** The halo's stones around the girdle, and beads on both rims between them. */
export function haloStones(d: RingDesign, L: Layout): { stones: Matrix4[]; beads: Matrix4[] } {
  const h = L.halo!
  const path = ringOutline(d, L, 0.25 + h.mm / 2, h.count)
  const y = L.y.girdle - 0.05
  const stones = path.map(([x, z]) => standing(new Vector3(x, y, z), Y, 0, h.mm))
  const beads: Matrix4[] = []
  for (let i = 0; i < path.length; i++) {
    const [x0, z0] = path[i]
    const [x1, z1] = path[(i + 1) % path.length]
    const mx = (x0 + x1) / 2
    const mz = (z0 + z1) / 2
    const len = Math.hypot(mx, mz) || 1
    for (const e of [1, -1]) beads.push(new Matrix4().makeTranslation(mx + (mx / len) * e * h.mm * 0.42, y + 0.18, mz + (mz / len) * e * h.mm * 0.42))
  }
  return { stones, beads }
}

/** The hidden halo: smaller stones under the girdle, tilted outward. */
export function hiddenHaloStones(d: RingDesign, L: Layout): Matrix4[] {
  const h = L.hiddenHalo!
  const path = ringOutline(d, L, -h.mm * 0.15, h.count).map(([x, z]) => [x * 0.84, z * 0.84] as Pt)
  const y = L.y.girdle - L.centre.pavilion * 0.3
  return path.map(([x, z]) => {
    const out = new Vector3(x, 0, z).normalize()
    return standing(new Vector3(x, y, z), out.multiplyScalar(0.86).add(new Vector3(0, 0.5, 0)), 0, h.mm)
  })
}

/** The gallery's side diamonds: one each side of the head, facing out. */
export function peekabooStones(d: RingDesign, L: Layout): Matrix4[] {
  const m = L.peekaboo!
  const y = L.y.culet + (L.y.girdle - L.y.culet) * 0.42
  const x = girdleRadius(d, L, 90) * 0.66 + m.mm * 0.2
  return [1, -1].map((s) => standing(new Vector3(s * x, y, 0), new Vector3(s, 0.25, 0), 0, m.mm))
}

/** The surprise: one diamond inside the band at the bottom, facing the finger. */
export function surpriseStone(L: Layout): Matrix4 {
  return standing(new Vector3(0, -L.band.inner - 0.32, 0), Y, 0, L.surprise!.mm)
}

/** Milgrain: tiny beads along both edges of the band's outer surface, away from the head. */
export function milgrain(L: Layout, headArc: number): Matrix4[] {
  const out: Matrix4[] = []
  const r = L.band.inner + L.band.thickness * 0.86
  const count = Math.floor((Math.PI * 2 * r) / 0.3)
  for (let i = 0; i < count; i++) {
    const th = (i / count) * Math.PI * 2
    const a = Math.abs(((th + Math.PI) % (Math.PI * 2)) - Math.PI)
    if (a < headArc) continue
    const w = L.band.width + (L.band.topWidth - L.band.width) * smooth(1.35, 0.15, a)
    for (const e of [1, -1]) out.push(new Matrix4().makeTranslation(Math.sin(th) * r, Math.cos(th) * r, e * (w / 2 - 0.05)))
  }
  return out
}

/** The three-stone sides: placements (tilted slightly outward) and their claws. */
export function sideStones(d: RingDesign, L: Layout): { at: Matrix4[]; claws: BufferGeometry[]; sizes: { width: number; length: number } } {
  const s = L.sides!
  const y = L.y.girdle - 0.55
  const at: Matrix4[] = []
  const wires: BufferGeometry[] = []
  for (const side of [1, -1]) {
    const centre = new Vector3(side * s.offset, y, 0)
    const tilt = new Vector3(side * 0.22, 1, 0).normalize()
    // A pear points its tip at the centre stone.
    const spin = s.shape === 'pear' ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : 0
    at.push(standing(centre, tilt, spin, 1))
    const half = [s.width / 2, s.length / 2]
    const corners = s.shape === 'round' ? [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]] : [[1, 1], [-1, 1], [1, -1], [-1, -1]]
    for (const [cx, cz] of corners) {
      const px = centre.x + cx * half[0] * (s.shape === 'pear' ? 0.8 : 1)
      const pz = cz * half[1] * (s.shape === 'pear' ? 0.75 : 1)
      const top = new Vector3(px - cx * 0.25, y + 0.35, pz - cz * 0.25)
      const rim2 = new Vector3(px + cx * 0.15, y - 0.1, pz + cz * 0.15)
      const base = new Vector3(centre.x * 0.92, L.y.bandTop - 0.1, pz * 0.4)
      wires.push(wire([base, rim2, top], (t) => {
        const k = 0.34 * (1 - smooth(0.7, 1, t) * 0.3)
        return [k, k]
      }, 16, 8))
    }
  }
  return { at, claws: wires, sizes: { width: s.width, length: s.length } }
}

/** A thin strip on the band's inner surface, at the bottom, for the engraving: [radius, arc, width]. */
export function engravingStrip(L: Layout, length: number): BufferGeometry {
  const r = L.band.inner - 0.015
  const arc = Math.min(Math.PI * 0.9, length / r)
  const w = L.band.width * 0.62
  const segs = 48
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i <= segs; i++) {
    const th = Math.PI - arc / 2 + (arc * i) / segs
    for (const e of [0, 1]) {
      pos.push(Math.sin(th) * r, Math.cos(th) * r, (e - 0.5) * w)
      uv.push(1 - i / segs, e)
    }
  }
  const index: number[] = []
  for (let i = 0; i < segs; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}
