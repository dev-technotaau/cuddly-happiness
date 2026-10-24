// The ring's metalwork, generated from its layout: a band swept around the finger, claws drawn as tapered wires that
// rise out of a foot cast into the band, up the pavilion, round the girdle and over the crown, rails, rims, galleries
// and arches, and the placements of every small stone and bead, each seated in the metal rather than resting on it.
// Millimetres; the finger runs along Z, the band lies in the XY plane, the head sits at +Y.
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, LatheGeometry, Matrix4, Quaternion, Vector2, Vector3 } from 'three'
import { arcAt, meleePlaces, outlineOf, outlinePath, radiusAt, type Pt } from '../../../data/outline'
import { CUTS, HALO_GAP, HIDDEN_TILT, clawClearance, clawWire, vClawWall, type Layout, type RingDesign } from '../../../data/ring'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Faces a closed shape outward. Whether a sweep's faces come out wound in or out depends on which way its section and
 *  its path run; wound in, the GPU would draw a part's far inside walls in place of its near outside (a ring seen
 *  hollow, its near and far sides confused) and light every surface from the wrong side. A closed shape's signed
 *  volume is positive when its faces point out: when it isn't, the winding is turned and the normals follow. */
export function outward(g: BufferGeometry): BufferGeometry {
  const p = g.getAttribute('position')
  const index = g.index
  if (!index) return g
  let volume = 0
  for (let i = 0; i + 2 < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    const ax = p.getX(a)
    const ay = p.getY(a)
    const az = p.getZ(a)
    const bx = p.getX(b)
    const by = p.getY(b)
    const bz = p.getZ(b)
    const cx = p.getX(c)
    const cy = p.getY(c)
    const cz = p.getZ(c)
    volume += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)
  }
  if (volume >= 0) return g
  for (let i = 0; i + 2 < index.count; i += 3) {
    const b = index.getX(i + 1)
    index.setX(i + 1, index.getX(i + 2))
    index.setX(i + 2, b)
  }
  index.needsUpdate = true
  g.computeVertexNormals()
  return g
}

// ─── Band ───────────────────────────────────────────────────────────────────────────────────────────────────────────

type Section = Pt[] // [u (outward from the inner surface), v (along the finger)]

/** A comfort-fit section: flat sides, a domed outside, a gently domed inside. `flat`: the outside flattened, so a row
 *  of stones can sit flush in it. */
function comfort(w: number, t: number, p = 48, flat = false): Section {
  const out: Section = []
  for (let i = 0; i < p; i++) {
    const s = (i / p) * Math.PI * 2
    const c = Math.cos(s)
    const sn = Math.sin(s)
    const v = (w / 2) * Math.sign(c) * Math.abs(c) ** (2 / 6)
    const u = t / 2 + (t / 2) * Math.sign(sn) * Math.abs(sn) ** (2 / (sn >= 0 ? (flat ? 7 : 2.4) : 4.2))
    out.push([u, v])
  }
  return out
}

/** A knife-edge section: the outside rises to a fine ridge. */
function knife(w: number, t: number, p = 48): Section {
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
  return closed ? outward(g) : g
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
  const flat = d.band.stones !== 'none'
  const section = (th: number) => (d.band.form === 'knife' ? knife(taper(th), thickness) : comfort(taper(th), thickness, 48, flat))
  const band = sweep({ inner, segments, section })
  return L.surprise ? surpriseCut(d, L, band, section(Math.PI), segments) : [band]
}

/** The surprise diamond's measures, and where its seat's surface is: the band's inside at the bottom (its middle, nearest
 *  the finger), or on a split or twisted band the top of the pad that bridges its strands, a little proud of them. */
function surpriseSeat(d: RingDesign, L: Layout) {
  const mm = L.surprise!.mm
  const r = mm / 2
  const { inner, width, thickness } = L.band
  const pad = d.band.form === 'split' || d.band.form === 'twist'
  const mid = pad ? 0 : Math.min(...(d.band.form === 'knife' ? knife(width, thickness, 96) : comfort(width, thickness, 96)).map(([u]) => u))
  return { mm, r, g: mm * 0.015, crown: mm * 0.15, pav: mm * 0.435, rb: r + 0.15, pad, y: pad ? -inner + (d.band.form === 'split' ? 0.12 : 0.1) : -(inner + mid) }
}

/** The surprise diamond's seat from its bevel's top inward, as [radius, height over the seat's surface]: a bright-cut
 *  bevel down to a burnished edge lying on the crown (the table a breath under the surface, so nothing catches), the
 *  edge's underside on the crown, the girdle's wall, and the pocket under the pavilion a breath off it, closing under
 *  the culet. */
function surpriseProfile(s: ReturnType<typeof surpriseSeat>): Pt[] {
  const top = -0.02 - s.crown
  const crownSlope = Math.tan((34.5 * Math.PI) / 180)
  const low = top - 2 * s.g
  return [
    [s.r - 0.06, top + 0.06 * crownSlope + 0.003],
    [s.r - 0.03, top + 0.03 * crownSlope],
    [s.r + 0.01, top],
    [s.r + 0.01, low],
    [s.r * 0.5, low - (s.r * 0.5 + 0.01) * 0.869],
    [0, low - s.pav - 0.012],
  ]
}

/** Cuts the surprise diamond's seat into a one-piece band's inside at the bottom: a block of the band's grid there comes
 *  out, and an insert takes its place, its edge the block's own edge, with the band's normals and texture coordinates
 *  there, so the two meet without a seam. The insert: the inside's own surface, then the seat (`surpriseProfile`). */
function surpriseCut(d: RingDesign, L: Layout, band: BufferGeometry, sec: Section, segments: number): BufferGeometry[] {
  const s = surpriseSeat(d, L)
  const { inner } = L.band
  const p = sec.length
  const P = band.getAttribute('position')
  const N = band.getAttribute('normal')
  // The bottom station, and the section's point nearest the finger.
  const ic = segments / 2
  let jc = 0
  sec.forEach(([u], j) => {
    if (u < sec[jc][0]) jc = j
  })
  // Across the inside, from the section's points about the middle: how far out the surface is and which point it is at.
  const face = [...Array(Math.floor(p / 2)).keys()].map((k) => jc - Math.floor(p / 4) + 1 + k).map((j) => ({ j, v: sec[(j + p) % p][1], u: sec[(j + p) % p][0] })).sort((a, b) => a.v - b.v)
  const across = (z: number, key: 'u' | 'j') => {
    let k = 0
    while (k < face.length - 2 && face[k + 1].v < z) k++
    const a = face[k]
    const b = face[k + 1]
    return a[key] + (b[key] - a[key]) * Math.min(1, Math.max(0, (z - a.v) / (b.v - a.v || 1)))
  }
  const surface = (x: number, z: number) => -Math.sqrt((inner + across(z, 'u')) ** 2 - x * x)
  const station = (2 * Math.PI * -s.y) / segments
  // The block: wide enough to clear the bevel's top by a quarter of a millimetre along the band, a fifth across it.
  const ni = Math.ceil((s.rb + 0.25) / station)
  let nj = 1
  while (nj < p / 4 - 2 && Math.min(Math.abs(sec[jc + nj][1]), Math.abs(sec[jc - nj][1])) < s.rb + 0.2) nj++
  const i0 = ic - ni
  const i1 = ic + ni
  const j0 = jc - nj
  const j1 = jc + nj
  // The band without the block's faces (each quad six indices, in order).
  const old = band.index!.array
  const kept: number[] = []
  for (let q = 0; q < old.length / 6; q++) {
    const i = Math.floor(q / p)
    const j = q % p
    if (i >= i0 && i < i1 && j >= j0 && j < j1) continue
    for (let k = 0; k < 6; k++) kept.push(old[q * 6 + k])
  }
  band.setIndex(kept)
  // The block's edge, round it.
  const edge: number[] = []
  for (let j = j0; j < j1; j++) edge.push(i0 * p + j)
  for (let i = i0; i < i1; i++) edge.push(i * p + j1)
  for (let j = j1; j > j0; j--) edge.push(i1 * p + j)
  for (let i = i1; i > i0; i--) edge.push(i * p + j0)
  const angle = (k: number) => Math.atan2(P.getZ(k), P.getX(k))
  // Running the way the angles rise, from the lowest.
  let turn = 0
  edge.forEach((k, n) => {
    let dA = angle(edge[(n + 1) % edge.length]) - angle(k)
    if (dA > Math.PI) dA -= Math.PI * 2
    if (dA < -Math.PI) dA += Math.PI * 2
    turn += dA
  })
  if (turn < 0) edge.reverse()
  let lowest = 0
  edge.forEach((k, n) => {
    if (angle(k) < angle(edge[lowest])) lowest = n
  })
  const loop = [...edge.slice(lowest), ...edge.slice(0, lowest)]
  // The insert's points: the edge, a ring on the surface inside the block, the bevel's top, the seat's rings, the axis.
  const M = 96
  const halfAcross = Math.min(Math.abs(sec[j0][1]), Math.abs(sec[j1][1]))
  const ringR = Math.max(s.rb + 0.03, Math.min(ni * station, halfAcross) - 0.06)
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const put = (x: number, y: number, z: number) => {
    pos.push(x, y, z)
    const th = Math.atan2(x, y)
    uv.push(((th < 0 ? th + Math.PI * 2 : th) / (Math.PI * 2)) * 7, across(z, 'j') / p)
  }
  for (const k of loop) {
    put(P.getX(k), P.getY(k), P.getZ(k))
    nor.push(N.getX(k), N.getY(k), N.getZ(k))
  }
  const ringAt = (rr: number, y: number | null) => {
    for (let m = 0; m < M; m++) {
      const a = -Math.PI + (m / M) * Math.PI * 2
      const x = rr * Math.cos(a)
      const z = rr * Math.sin(a)
      put(x, y ?? surface(x, z), z)
    }
  }
  ringAt(ringR, null)
  ringAt(s.rb, null)
  const profile = surpriseProfile(s)
  for (const [rr, h] of profile.slice(0, -1)) ringAt(rr, s.y + h)
  const axis = pos.length / 3
  put(0, s.y + profile[profile.length - 1][1], 0)
  const K = loop.length
  const index: number[] = []
  // From the block's edge to the first ring: advance round whichever is behind.
  const ea = loop.map((k) => angle(k))
  const ra = (m: number) => -Math.PI + (m / M) * Math.PI * 2
  let e = 0
  let m = 0
  while (e < K || m < M) {
    const nextE = e < K ? ea[(e + 1) % K] + (e + 1 >= K ? Math.PI * 2 : 0) : Infinity
    const nextR = m < M ? ra(m + 1) : Infinity
    if (nextE <= nextR) {
      index.push(e % K, (e + 1) % K, K + (m % M))
      e++
    } else {
      index.push(e % K, K + ((m + 1) % M), K + (m % M))
      m++
    }
  }
  // Ring to ring, then a fan to the axis.
  const rings = 2 + profile.length - 1
  for (let k = 0; k + 1 < rings; k++) {
    const a = K + k * M
    const b = a + M
    for (let q = 0; q < M; q++) {
      const q1 = (q + 1) % M
      index.push(a + q, a + q1, b + q, b + q, a + q1, b + q1)
    }
  }
  const last = K + (rings - 1) * M
  for (let q = 0; q < M; q++) index.push(last + q, last + ((q + 1) % M), axis)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  // Facing the finger (its surface's normals toward the axis of the ring, +Y here): turned if wound the other way.
  g.computeVertexNormals()
  const n = g.getAttribute('normal')
  if (n.getY(K + Math.floor(M / 4)) < 0) {
    for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]]
    g.setIndex(index)
    g.computeVertexNormals()
  }
  // The edge takes the band's own normals, so the light runs on across it.
  const out = g.getAttribute('normal')
  for (let k = 0; k < K; k++) out.setXYZ(k, nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2])
  g.userData.seat = true
  return [band, g]
}

/** On a split or twisted band, the surprise diamond's pad: a round plate bridging the strands at the bottom of the
 *  inside, its top a little proud of them, its seat cut as the one-piece band's is. None on a one-piece band. */
export function surprisePad(d: RingDesign, L: Layout): BufferGeometry | null {
  if (!L.surprise) return null
  const s = surpriseSeat(d, L)
  if (!s.pad) return null
  const R = s.rb + 0.18
  const profile = [[0, -0.6], [R - 0.05, -0.6], [R, -0.55], [R, -0.06], [R - 0.06, 0], [s.rb, 0], ...surpriseProfile(s)].map(([x, y]) => new Vector2(x, y))
  return outward(new LatheGeometry(profile, 64)).translate(0, s.y, 0)
}

/** Where the band's outer surface turns down into its side, at an angle round the finger: the point on each edge (the
 *  section's corner) and its outward normal, as [u (out from the inner surface), v (along the finger)]. */
function bandEdges(d: RingDesign, L: Layout, theta: number): { at: Pt; normal: Pt }[] {
  const { width, thickness, topWidth } = L.band
  const a = Math.abs(((theta + Math.PI) % (Math.PI * 2)) - Math.PI)
  const w = width + (topWidth - width) * smooth(1.35, 0.15, a)
  const sec = d.band.form === 'knife' ? knife(w, thickness, 96) : comfort(w, thickness, 96, d.band.stones !== 'none')
  return [1, -1].map((e) => {
    let best = 0
    let score = -Infinity
    sec.forEach(([u, v], i) => {
      const k = u / thickness + (e * v) / (w / 2)
      if (k > score) {
        score = k
        best = i
      }
    })
    const [u0, v0] = sec[(best - 1 + sec.length) % sec.length]
    const [u1, v1] = sec[(best + 1) % sec.length]
    let nu = v1 - v0
    let nv = -(u1 - u0)
    const len = Math.hypot(nu, nv) || 1
    nu /= len
    nv /= len
    // Outward: away from the section's middle.
    if (nu * (sec[best][0] - thickness / 2) + nv * sec[best][1] < 0) {
      nu = -nu
      nv = -nv
    }
    return { at: sec[best], normal: [nu, nv] as Pt }
  })
}

/** The band's outer surface height (from the inner surface) along a section line, for seating stones and beads. */
export const bandTopU = (L: Layout) => L.band.thickness * 0.98

// ─── Wires ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A wire along points, its section an ellipse that can change along it: [across, through]. `side` fixes which way is
 *  across (a flat claw lies along the stone's edge); without it the frame follows the curve. `round` domes its far
 *  end, as a claw's tip is filed. */
export function wire(points: Vector3[], radius: (t: number) => [number, number], segments = 28, radial = 12, closed = false, side?: Vector3, round = false): BufferGeometry {
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
  // A dome over the far end: rings shrinking as a quarter circle, to a point.
  let last = rows - 1
  if (!closed && round) {
    const end = curve.getPointAt(1)
    const along = curve.getTangentAt(1)
    const [rx, ry] = radius(1)
    const b = side ? side : frames.binormals[rows - 1]
    const n = side ? new Vector3().crossVectors(along, side).normalize() : frames.normals[rows - 1]
    const K = 6
    for (let k = 1; k < K; k++) {
      const th = (k / K) * (Math.PI / 2)
      const c = end.clone().addScaledVector(along, Math.sin(th) * ((rx + ry) / 2))
      const ring = pos.length / 3
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2
        const x = Math.cos(a) * rx * Math.cos(th)
        const y = Math.sin(a) * ry * Math.cos(th)
        pos.push(c.x + b.x * x + n.x * y, c.y + b.y * x + n.y * y, c.z + b.z * x + n.z * y)
      }
      const prev = k === 1 ? (rows - 1) * radial : ring - radial
      for (let j = 0; j < radial; j++) {
        const j1 = (j + 1) % radial
        index.push(prev + j, ring + j, prev + j1, prev + j1, ring + j, ring + j1)
      }
      last = ring / radial
    }
    const apex = end.clone().addScaledVector(along, (rx + ry) / 2)
    const ci = pos.length / 3
    pos.push(apex.x, apex.y, apex.z)
    for (let j = 0; j < radial; j++) index.push(ci, last * radial + j, last * radial + ((j + 1) % radial))
  }
  // Close the ends of an open wire (flat where the dome isn't).
  if (!closed) {
    for (const [row, flip] of (round ? [[0, true]] : [[0, true], [rows - 1, false]]) as [number, boolean][]) {
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
  return outward(g)
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

/** The stone's girdle underside, its pavilion's radius at a height (a cone down to the culet), and the crown's height
 *  over the girdle's centre at a distance from the axis (a cone up to the table), in a direction of girdle radius `r`. */
function stoneShape(d: RingDesign, L: Layout) {
  const low = L.y.girdle - L.centre.girdle / 2
  const table = CUTS[d.stone.shape].step ? 0.62 : 0.56
  return {
    low,
    pavilion: (r: number, y: number) => r * Math.min(1, Math.max(0, (y - L.y.culet) / (low - L.y.culet))),
    crown: (r: number, radial: number) => L.centre.girdle / 2 + L.centre.crown * Math.min(1, Math.max(0, (1 - radial / r) / (1 - table))),
  }
}

/** The claws around the centre stone. Each rises out of the head's foot, where all the claws meet inside the metal,
 *  hugs the pavilion up to the girdle (its seat cut into the claw: the claw's centre stands just outside the girdle, so
 *  its inner side holds the stone's edge), and bends over the crown to rest on it, its tip domed, pointed (eagle) or
 *  flattened (tab). */
export function claws(d: RingDesign, L: Layout): Claw[] {
  const out: Claw[] = []
  const w = clawWire(d, L)
  const gY = L.y.girdle
  const { low, pavilion, crown } = stoneShape(d, L)
  const culet = L.y.culet
  const make = (deg: number, tipTo?: Vector3) => {
    const phi = (deg * Math.PI) / 180
    const dir = new Vector3(Math.sin(phi), 0, Math.cos(phi))
    const at = (radial: number, y: number) => dir.clone().multiplyScalar(radial).setY(y)
    const r = girdleRadius(d, L, deg)
    const eagle = d.prongs.tip === 'eagle'
    const tab = d.prongs.tip === 'tab'
    const reach = eagle ? w * 2.2 : tab ? w * 1.6 : w * 1.15
    const end = eagle ? 0.16 : tab ? 0.55 : 0.9
    const touch = r + w * 0.55
    // The claw rests on the crown: its centre a little less than its radius above the crown's surface.
    const over = (radial: number, k: number) => at(radial, gY + crown(r, radial) + w * k * 0.8)
    const yA = culet + (low - culet) * 0.35
    const yB = culet + (low - culet) * 0.75
    const meet = at(w * 0.5, culet - 0.12)
    const points = [at(w * 0.25, L.y.bandTop - 0.65), meet, at(pavilion(r, yA) + w * 0.92, yA), at(pavilion(r, yB) + w * 0.92, yB), at(touch, gY), over(touch - reach * 0.45, 0.96), tipTo ?? over(touch - reach, end)]
    const radius = (t: number): [number, number] => {
      // A little heavier at its root, where it carries the stone.
      const root = 1 + 0.14 * (1 - smooth(0, 0.3, t))
      const tip = smooth(0.66, 1, t)
      if (eagle) return [w * root * (1 - tip * 0.84), w * root * (1 - tip * 0.8)]
      if (tab) return [w * root * (1 + tip * 0.65), w * root * (1 - tip * 0.45)]
      return [w * root * (1 - tip * 0.1), w * root * (1 - tip * 0.1)]
    }
    const geometry = wire(points, radius, 44, 14, false, new Vector3(Math.cos(phi), 0, -Math.sin(phi)), !eagle && !tab)
    out.push({ geometry, cap: null, base: meet })
  }
  for (const deg of L.prongs.positions) make(deg)
  for (const deg of L.prongs.vTips) out.push(vClaw(d, L, deg, w))
  return out
}

/** Rounds a closed section's corners by cutting them, `times` over, each cut taking `cut` of an edge from both ends
 *  (Chaikin's scheme cuts a quarter): small cuts keep the faces flat and the edges tight, as on a polished part. */
function rounded(points: Pt[], cut: number, times: number): Pt[] {
  let p = points
  for (let k = 0; k < times; k++) {
    const next: Pt[] = []
    for (let i = 0; i < p.length; i++) {
      const [x0, y0] = p[i]
      const [x1, y1] = p[(i + 1) % p.length]
      next.push([x0 + (x1 - x0) * cut, y0 + (y1 - y0) * cut], [x1 + (x0 - x1) * cut, y1 + (y0 - y1) * cut])
    }
    p = next
  }
  return p
}

/** A V-claw: a chevron wrapping a pointed stone's tip (a pear's or a heart's point, a marquise's two, a princess's
 *  corners). Its inside is seated on the girdle and leans over the crown's edge as a lip, following the stone's own
 *  slopes; its outside meets in a V, its point filed round; its arms run a little way along the girdle each side,
 *  thinning and lowering to small domed ends. A stem rises out of the foot and up the pavilion into it, under the point. */
function vClaw(d: RingDesign, L: Layout, deg: number, w: number): Claw {
  const gY = L.y.girdle
  const gt = L.centre.girdle / 2
  const culet = L.y.culet
  const { low, pavilion } = stoneShape(d, L)
  const { tip, along, outwardOf, nL, nR, H, T, arm, form, R, G } = vFrame(d, L, deg, w)
  const seat = 0.06
  // Stations along the claw: where it is on the girdle, which way is out, how far a corner's offset reaches (`g`), how
  // far from the point (`a`), and how much of the section is left in an end's dome (`f`).
  interface Station {
    p: Pt
    n: Pt
    g: number
    a: number
    f: number
  }
  const DOME = 6
  const side = (sign: number): Station[] => {
    const at = along(sign)
    const dist: number[] = []
    for (let a = 0.05; a < arm - 1e-6; a += 0.05) dist.push(a)
    for (let k = 0; k < DOME; k++) dist.push(arm + R * Math.sin((k / DOME) * (Math.PI / 2)))
    return dist.map((a) => {
      const p = at(a)
      // Which way is out, over a few of the girdle's edges (on this arm's side of the point), so the faces run smooth.
      const n = outwardOf(at(Math.max(0, a - 0.12)), at(a + 0.12))
      return { p, n, g: 1, a, f: a <= arm ? 1 : Math.sqrt(Math.max(0, 1 - ((a - arm) / R) ** 2)) }
    })
  }
  // At the point the outside turns from one arm's face to the other's: on both faces' lines (a mitre) until it would
  // run further than `G` times its offset, then round (a point a bench files).
  const aL = Math.atan2(nL[1], nL[0])
  let turn = Math.atan2(nR[1], nR[0]) - aL
  while (turn > Math.PI) turn -= Math.PI * 2
  while (turn < -Math.PI) turn += Math.PI * 2
  const FAN = 15
  const fan: Station[] = []
  for (let j = 0; j < FAN; j++) {
    const t = j / (FAN - 1)
    const ang = aL + turn * t
    const off = Math.min(t, 1 - t) * Math.abs(turn)
    fan.push({ p: tip, n: [Math.cos(ang), Math.sin(ang)], g: Math.min(1 / Math.cos(off), G), a: 0, f: 1 })
  }
  const stations = [...side(-1).reverse(), ...fan, ...side(1)]
  // The section at a station, as [outward of the girdle (in: toward the axis), up from the girdle's middle]: the outside
  // and its chamfered top, the lip resting on the crown, the seat holding the girdle's edge, the inside down the pavilion.
  const section = (st: Station): Pt[] => {
    const { t, l, crownAt, top, bottom } = form(st.a)
    const yIn = bottom + t * 0.2
    const k = Math.min(1, Math.max(0, (gY + yIn - culet) / (low - culet)))
    return rounded([[t * 0.45, bottom], [t, bottom + t * 0.35], [t * 0.97, gt + crownAt * 0.5], [t * 0.5, top], [-l * 0.3, top - t * 0.04], [-l, gt + crownAt + 0.04], [-seat, gt], [-seat, -gt], [-(seat + (1 - k) * H), yIn]], 0.18, 3)
  }
  const place = (st: Station, [s, y]: Pt): Vector3 => (s >= 0 ? new Vector3(st.p[0] + st.n[0] * s * st.g, gY + y, st.p[1] + st.n[1] * s * st.g) : new Vector3(st.p[0] * (1 + s / H), gY + y, st.p[1] * (1 + s / H)))
  // Where an end's dome closes: the middle of its section.
  const middle = (st: Station) => {
    const { t, top, bottom } = form(st.a)
    return place(st, [t * 0.3, (top + bottom) / 2])
  }
  const pos: number[] = []
  const index: number[] = []
  let M = 0
  for (const st of stations) {
    const sec = section(st)
    M = sec.length
    const c = middle(st)
    for (const q of sec) {
      const v = place(st, q)
      if (st.f < 1) v.lerp(c, 1 - st.f)
      pos.push(v.x, v.y, v.z)
    }
  }
  for (let i = 0; i + 1 < stations.length; i++) {
    for (let j = 0; j < M; j++) {
      const j1 = (j + 1) % M
      index.push(i * M + j, (i + 1) * M + j, i * M + j1, i * M + j1, (i + 1) * M + j, (i + 1) * M + j1)
    }
  }
  // Each end closes on its dome's apex, a little further along the girdle.
  for (const [ring, sign] of [[0, -1], [stations.length - 1, 1]] as [number, number][]) {
    const at = along(sign)
    const p = at(arm + R)
    const apex = middle({ p, n: outwardOf(at(arm + R - 0.12), at(arm + R + 0.12)), g: 1, a: arm + R, f: 1 })
    const ci = pos.length / 3
    pos.push(apex.x, apex.y, apex.z)
    for (let j = 0; j < M; j++) index.push(ci, ring * M + j, ring * M + ((j + 1) % M))
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  const wall = outward(g)
  // The stem, from the foot (as heavy there as the other claws) up the pavilion under the point, finer as it rises, and
  // into the wall's foot.
  const dir = new Vector3(tip[0], 0, tip[1]).normalize()
  const r = Math.hypot(tip[0], tip[1])
  const atR = (radial: number, y: number) => dir.clone().multiplyScalar(radial).setY(y)
  const yA = culet + (low - culet) * 0.35
  const yB = culet + (low - culet) * 0.75
  const meet = atR(w * 0.5, culet - 0.12)
  const into = atR(r + T * 0.2, gY + form(0).bottom + T * 0.55)
  const fine = Math.min(w, T * 0.5)
  const thick = (t: number) => w * 1.12 + (fine - w * 1.12) * smooth(0, 0.5, t)
  const stem = wire([atR(w * 0.25, L.y.bandTop - 0.65), meet, atR(pavilion(r, yA) + w * 0.92, yA), atR(pavilion(r, yB) + fine * 1.2, yB), into], (t) => [thick(t), thick(t)], 36, 14, false, new Vector3(dir.z, 0, -dir.x))
  return { geometry: stem, cap: wall, base: meet }
}

/** Where a V-claw lies and its measures: the girdle's point near `deg` (its furthest corner there) and the girdle each
 *  way from it, the arms' outward normals at the point and the girdle's distance from the axis there (`H`); the wall's
 *  thickness, the arms' length, the lip, the section's measures along an arm (`form`), the ends' domes (`R`) and how far
 *  the point's outside may reach (`G` times the wall). */
function vFrame(d: RingDesign, L: Layout, deg: number, w: number) {
  const gt = L.centre.girdle / 2
  const table = CUTS[d.stone.shape].step ? 0.62 : 0.56
  const T = vClawWall(w)
  const arm = Math.min(1.4, Math.max(0.7, L.centre.width * 0.17))
  const lip = Math.min(0.3, T * 0.42)
  // The girdle as the stone has it (a polygon about the stone's axis), and its point: the furthest corner near `deg`.
  const outline = outlineOf(d.stone.shape, L.centre.length / L.centre.width, 480).map(([x, z]): Pt => [x * L.centre.width, z * L.centre.width])
  const phi = (deg * Math.PI) / 180
  let k0 = 0
  let far = -Infinity
  outline.forEach(([x, z], i) => {
    const r = Math.hypot(x, z)
    if ((x * Math.sin(phi) + z * Math.cos(phi)) / r > Math.cos(0.25) && r > far) {
      far = r
      k0 = i
    }
  })
  const tip = outline[k0]
  // The girdle from the point each way, to place a point any distance along it.
  const along = (sign: number) => {
    const pts: Pt[] = [tip]
    const len = [0]
    for (let i = 1; i < outline.length / 2 && len[len.length - 1] < arm + 3; i++) {
      const q = outline[(k0 + sign * i + outline.length) % outline.length]
      const p = pts[pts.length - 1]
      len.push(len[len.length - 1] + Math.hypot(q[0] - p[0], q[1] - p[1]))
      pts.push(q)
    }
    return (a: number): Pt => {
      let i = 1
      while (i < len.length - 1 && len[i] < a) i++
      const t = Math.min(1, Math.max(0, (a - len[i - 1]) / (len[i] - len[i - 1] || 1)))
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]
    }
  }
  const outwardOf = (p: Pt, q: Pt): Pt => {
    const tx = q[0] - p[0]
    const tz = q[1] - p[1]
    const l = Math.hypot(tx, tz) || 1
    const n: Pt = [tz / l, -tx / l]
    return n[0] * p[0] + n[1] * p[1] < 0 ? [-n[0], -n[1]] : n
  }
  const nL = outwardOf(tip, along(-1)(0.12))
  const nR = outwardOf(tip, along(1)(0.12))
  const m: Pt = [nL[0] + nR[0], nL[1] + nR[1]]
  const ml = Math.hypot(m[0], m[1]) || 1
  // Inside the girdle the claw follows the stone, whose crown and pavilion are its girdle scaled toward the axis: the
  // seat, the lip and the inside lie on the girdle scaled as at the point (`H`, its distance from the axis there), so
  // the lip rests along one of the crown's contours.
  const H = (m[0] * tip[0] + m[1] * tip[1]) / ml
  // The section's measures a distance `a` along an arm from the point: its thickness, its lip, the crown's height under
  // the lip, its top and its foot (from the girdle's middle); thinner, lower and with less lip toward the arm's end.
  const form = (a: number) => {
    const e = smooth(0.4, 1, a / arm)
    const t = T * (1 - 0.45 * e)
    const l = lip * (1 - 0.55 * e)
    const crownAt = L.centre.crown * Math.min(1, l / ((1 - table) * H))
    return { t, l, crownAt, top: gt + crownAt + t * 0.42, bottom: -(gt + t * 0.75) }
  }
  const R = form(arm).t * 0.6
  const G = 1.6
  /** How far the claw's outside stands off the girdle a distance `a` along an arm from the point (0 past its end). */
  const reach = (a: number) => (a <= 0.05 ? T * G : a <= arm ? form(a).t : a <= arm + R ? form(arm).t * Math.sqrt(1 - ((a - arm) / R) ** 2) : 0)
  return { tip, along, outwardOf, nL, nR, H, T, arm, lip, form, R, G, reach }
}

/** The basket's rail: a ring round the pavilion tying the claws together, through their inner halves. `at` is its
 *  height between the culet (0) and the girdle (1). */
export function basketRail(d: RingDesign, L: Layout, at = 0.55, r = 0.32): BufferGeometry {
  const { low, pavilion } = stoneShape(d, L)
  const y = L.y.culet + (low - L.y.culet) * at
  const w = clawWire(d, L)
  const path = ringOutline(d, L, 0, 64).map(([x, z]) => {
    const rr = Math.hypot(x, z) || 1
    const k = (pavilion(rr, y) + w * 0.92 - r * 0.35) / rr
    return new Vector3(x * k, y, z * k)
  })
  return wire(path, () => [r, r], 128, 10, true)
}

/** A foot: a short stem from inside the band up to what it carries, flaring as it enters the band, like metal cast in
 *  one piece, so a head grows out of the band instead of standing on it. From `from` (inside the band) to `to`; `core`
 *  its radius where it meets the claws, `flare` how far it widens at the band [round the finger, across it]. */
export function foot(from: Vector3, to: Vector3, core: number, flare: [number, number]): BufferGeometry {
  const axis = to.clone().sub(from).normalize()
  // Round the finger: the band's tangent here, square to the foot.
  const around = new Vector3(-from.y, from.x, 0).normalize()
  const a = around.clone().addScaledVector(axis, -around.dot(axis)).normalize()
  const b = new Vector3().crossVectors(axis, a)
  const K = 16
  const P = 48
  const pos: number[] = []
  for (let k = 0; k <= K; k++) {
    const t = k / K
    const c = from.clone().lerp(to, t)
    const f = (1 - t) ** 2.6
    const rx = core + flare[0] * f
    const ry = core + flare[1] * f
    for (let j = 0; j < P; j++) {
      const ang = (j / P) * Math.PI * 2
      const x = Math.cos(ang) * rx
      const y = Math.sin(ang) * ry
      pos.push(c.x + a.x * x + b.x * y, c.y + a.y * x + b.y * y, c.z + a.z * x + b.z * y)
    }
  }
  const index: number[] = []
  for (let k = 0; k < K; k++) {
    for (let j = 0; j < P; j++) {
      const j1 = (j + 1) % P
      index.push(k * P + j, (k + 1) * P + j, k * P + j1, k * P + j1, (k + 1) * P + j, (k + 1) * P + j1)
    }
  }
  for (const [k, c] of [[0, from], [K, to]] as const) {
    const ci = pos.length / 3
    pos.push(c.x, c.y, c.z)
    for (let j = 0; j < P; j++) index.push(ci, k * P + j, k * P + ((j + 1) % P))
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return outward(g)
}

/** A split shank's bridge: where its two strands part around the head, a bar between them under the head's foot, so
 *  the head is carried by both. None when the strands stay together. */
export function splitBridge(L: Layout): BufferGeometry | null {
  const { inner, thickness, topWidth, width } = L.band
  const spread = Math.max(0, L.centre.length * 0.42 - width / 4)
  const z = topWidth * 0.24 + spread
  if (spread < 0.3) return null
  const low = inner + thickness * 0.5
  const top = L.y.bandTop - 0.3
  const r = thickness * 0.36
  return wire([new Vector3(0, low, -z), new Vector3(0, (low + top) / 2 + 0.15, -z * 0.5), new Vector3(0, top, 0), new Vector3(0, (low + top) / 2 + 0.15, z * 0.5), new Vector3(0, low, z)], () => [r, r], 48, 16)
}

/** The centre stone's foot, under its claws. */
export function centreFoot(d: RingDesign, L: Layout): BufferGeometry {
  const w = clawWire(d, L)
  const core = w * 1.15
  const across = Math.max(0, Math.min(0.55, L.band.topWidth / 2 - core - 0.08))
  return foot(new Vector3(0, L.y.bandTop - 0.7, 0), new Vector3(0, L.y.culet - 0.05, 0), core, [1.15, across])
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
  return outward(g)
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

/** A bezel: a rim of metal around the girdle, and a smooth cup beneath it, narrowing to the band and flaring into it. */
export function bezel(d: RingDesign, L: Layout): BufferGeometry[] {
  const g = L.y.girdle
  const path = ringOutline(d, L, 0.32, 96)
  const top = g - 0.8
  // Into the band, flaring where it enters, as if cast with it.
  const bottom = L.y.bandTop - 0.55
  const rings: [number, number][] = [...Array(17).keys()].map((i) => {
    const t = i / 16
    return [1 - 0.6 * t ** 1.25 + 0.12 * smooth(0.75, 1, t), top + (bottom - top) * t]
  })
  return [rim(path, g - 0.2, roundedRect(0.62, 1.5)), loft(path, rings), loft(path, rings.map(([k, y]) => [k * 0.93, y] as [number, number]), true)]
}

/** Where a point a distance `s` along a closed path is: the point, the way the path runs and the way out of it, away
 *  from its inside whichever way it runs (both taken over a tenth of a millimetre each way, so they turn smoothly). */
function along(path: Pt[]) {
  const n = path.length
  const len = [0]
  let area = 0
  for (let i = 0; i < n; i++) {
    const [x0, z0] = path[i]
    const [x1, z1] = path[(i + 1) % n]
    len.push(len[i] + Math.hypot(x1 - x0, z1 - z0))
    area += x0 * z1 - x1 * z0
  }
  // (tz, -tx) points out of a path that runs counter-clockwise (x right, z up), into one that runs the other way.
  const side = area >= 0 ? 1 : -1
  const total = len[n]
  const point = (s: number): Pt => {
    const t = ((s % total) + total) % total
    let lo = 0
    let hi = n
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (len[mid] <= t) lo = mid
      else hi = mid
    }
    const f = (t - len[lo]) / (len[lo + 1] - len[lo] || 1)
    const a = path[lo]
    const b = path[(lo + 1) % n]
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
  }
  return {
    total,
    at: (s: number) => {
      const a = point(s - 0.1)
      const b = point(s + 0.1)
      const tx = b[0] - a[0]
      const tz = b[1] - a[1]
      const l = Math.hypot(tx, tz) || 1
      return { p: point(s), t: [tx / l, tz / l] as Pt, n: [(side * tz) / l, (-side * tx) / l] as Pt }
    },
  }
}

/** A shared prong's stem, as a share of its head's radius. */
const PRONG_STEM = 0.5
/** A prong's head as the setter leaves it, as shares of its radius: pushed along the row over the stones each side of
 *  it (x), a little flattened (y), narrower across (z). */
const PRONG_SPREAD = new Vector3(1.25, 0.85, 0.9)
/** How far a prong's stem reaches toward a stone it holds (a little off the row's line), as a share of its head's radius;
 *  its head reaches twice as far. */
const STEM_REACH = PRONG_STEM * 1.2

/** A prong's size for small stones `mm` across: its head's radius. */
const prongSize = (mm: number) => Math.min(0.21, Math.max(0.12, mm * 0.14))

/** A shared prong: the small claw between two small stones that holds them both, a stem rising out of the metal into a
 *  head that spreads over their girdles, domed as a setter finishes it. Its head is a unit in radius, its underside at
 *  0, up +Y: scaled and stood where it goes, every prong of the ring one shape. `dome`, `round`: its steps over the
 *  dome and round its axis. */
function prongShape(dome: number, round: number): BufferGeometry {
  const profile = [new Vector2(0, -2.2), new Vector2(PRONG_STEM, -2.2), new Vector2(PRONG_STEM, -0.5), new Vector2(0.68, -0.2), new Vector2(0.86, 0), new Vector2(1, 0.18)]
  for (let k = 1; k <= dome; k++) {
    const a = (k / dome) * (Math.PI / 2)
    profile.push(new Vector2(k === dome ? 0 : Math.cos(a), 0.18 + Math.sin(a) * 0.62))
  }
  return outward(new LatheGeometry(profile, round))
}
export const prongGeometry = prongShape(6, 16)
/** The prong as traced: a few of its faces. */
export const prongTrace = prongShape(2, 6)

/** A stone's seat: its girdle's centre, the way its table faces, its radius (a breath over the stone's) and half its
 *  girdle's height. */
interface Seat {
  c: Vector3
  axis: Vector3
  r: number
  g: number
}

/** A station of a frame swept along a path: a point on its top's centreline, the way across it (out from the path)
 *  and the way its top faces. */
interface Station {
  p: Vector3
  a: Vector3
  u: Vector3
}

/** How deep the seats cut a frame's top, `o` across a station's centreline, as a setter cuts them with a bur: a
 *  bright-cut bevel `bevel` wide from the top down to the girdle, the girdle's own wall, then the hole the pavilion sits
 *  in, at its 41°. `erode` widens every cut by as much: the traced copy, coarser, so it never stands proud of the
 *  drawn frame (a reflection leaving the drawn surface would start inside it). */
function seatCut(seats: Seat[], bevel: number, erode = 0) {
  const v = new Vector3()
  return (st: Station, o: number) => {
    let deepest = 0
    for (const seat of seats) {
      v.copy(st.p).addScaledVector(st.a, o).sub(seat.c)
      const lift = v.dot(seat.axis)
      if (lift < -0.5 || lift > 1) continue
      const rho = Math.max(0, Math.sqrt(Math.max(0, v.lengthSq() - lift * lift)) - erode)
      if (rho >= seat.r + bevel) continue
      const floor = rho >= seat.r ? seat.g + (lift - seat.g) * ((rho - seat.r) / bevel) : -seat.g - (seat.r - rho) * 0.87
      deepest = Math.max(deepest, lift - floor)
    }
    return deepest
  }
}

/** A quarter (or so) of a circle's points, from one angle to another, the first left out. */
const arcPts = (cx: number, cy: number, r: number, from: number, to: number, k: number): Pt[] => [...Array(k).keys()].map((i) => {
  const a = from + ((to - from) * (i + 1)) / k
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
})

/** A frame swept along a closed path, one section a station ([across, up], round it), closed both ways. */
function sweptFrame(stations: Station[], section: (st: Station) => Pt[]): BufferGeometry {
  const v = new Vector3()
  const pos: number[] = []
  let cols = 0
  for (const st of stations) {
    const sec = section(st)
    cols = sec.length
    for (const [o, h] of sec) {
      v.copy(st.p).addScaledVector(st.a, o).addScaledVector(st.u, h)
      pos.push(v.x, v.y, v.z)
    }
  }
  const rows = stations.length
  const index: number[] = []
  for (let i = 0; i < rows; i++) {
    const i1 = (i + 1) % rows
    for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % cols
      index.push(i * cols + j, i * cols + j1, i1 * cols + j, i1 * cols + j, i * cols + j1, i1 * cols + j1)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return outward(g)
}

/** A rounded frame's section at a station, [across, up] from its top's centreline: its top `2W` wide, cut by the seats
 *  (`top` samples of it, no deeper than leaves its floor 0.12 thick), its edges rounded (`k` steps a corner), `height`
 *  deep. */
function roundedFrame(st: Station, cut: (st: Station, o: number) => number, W: number, height: number, top: number, k: number): Pt[] {
  const re = Math.min(0.09, W * 0.15)
  const rb = Math.min(0.2, height * 0.25)
  const out: Pt[] = []
  for (let i = 0; i <= top; i++) {
    const o = W - re - (2 * (W - re) * i) / top
    out.push([o, -Math.min(cut(st, o), height - 0.12)])
  }
  out.push(...arcPts(-(W - re), -re, re, Math.PI / 2, Math.PI, k))
  out.push([-W, -height + rb])
  out.push(...arcPts(-(W - rb), -height + rb, rb, Math.PI, Math.PI * 1.5, k))
  out.push([W - rb, -height])
  out.push(...arcPts(W - rb, -height + rb, rb, Math.PI * 1.5, Math.PI * 2, k))
  out.push([W, -re])
  out.push(...arcPts(W - re, -re, re, 0, Math.PI / 2, k).slice(0, -1))
  return out
}

/** How far across a ring of stones' centreline a pair of prongs stands, and how far from the centre of each stone it
 *  holds (`reach`): their stems just clear of the girdles, each head over them by the rest of its radius; no nearer the
 *  centreline than a third of a stone's radius, no further out than leaves metal round the stem (`room`). */
function prongPlace(r: number, prong: number, spacing: number, room: number) {
  const reach = r + prong * STEM_REACH + 0.012
  return { reach, across: Math.min(room - prong * 0.8, Math.max(r * 0.3, Math.sqrt(Math.max(0, reach ** 2 - (spacing / 2) ** 2)))) }
}

/** A small stone's turn on its table's axis, by its place in a row: each a little different, as set by hand. */
const spinOf = (i: number) => (i * 2.3999632) % (Math.PI / 4)

/** The halo as it is set: one path for its frame, its stones and its prongs (the centre stone's outline grown by the
 *  layout's offset, stepped round any V-claws), its stones in the layout's runs between the claws (each claw passing
 *  between the two stones beside it, as close as it clears them), and the frame's measures: its top two fifths of the
 *  way up the stones' crowns, so each sits down in its seat. */
function haloPlan(d: RingDesign, L: Layout) {
  const h = L.halo!
  const path = clearOfVClaws(d, L, ringOutline(d, L, h.offset, 720), HALO_GAP)
  const { total, at } = along(path)
  const claw = clawWire(d, L)
  const keep = L.prongs.positions.map((deg) => ({ at: arcAt(path, (deg * Math.PI) / 180), half: clawClearance(claw, h.mm, h.offset - claw * 0.55) }))
  const places = meleePlaces(total, h.runs, keep, arcAt(path, 0))
  const y = L.y.girdle - h.drop
  const g = h.mm * 0.015
  const crown = h.mm * 0.15
  return { path, total, at, ...places, y, r: h.mm / 2, g, crown, top: y + g + crown * 0.4, width: h.mm + 0.5, height: Math.max(1.05, h.mm * 0.9) + 0.1, prong: prongSize(h.mm) }
}

/** Where the V-claws stand, for what is set round the centre stone: for a point beside the girdle, how far along the
 *  girdle it is from the nearest V-claw's point (`a`; Infinity when none is near) and how far that claw's outside
 *  stands off the girdle there (`reach`, mm; 0 past its end). */
function vClaws(d: RingDesign, L: Layout): (x: number, z: number) => { a: number; reach: number } {
  const w = clawWire(d, L)
  const guards = L.prongs.vTips.map((deg) => {
    const f = vFrame(d, L, deg, w)
    const pts: { p: Pt; a: number }[] = []
    for (const sign of [-1, 1]) for (let a = 0; a <= f.arm + f.R + 2; a += 0.05) pts.push({ p: f.along(sign)(a), a })
    return { f, pts }
  })
  return (x, z) => {
    let a = Infinity
    let reach = 0
    for (const { f, pts } of guards) {
      let best = Infinity
      let at = 0
      for (const q of pts) {
        const dd = Math.hypot(x - q.p[0], z - q.p[1])
        if (dd < best) {
          best = dd
          at = q.a
        }
      }
      // Beyond the girdle the claw stood on, or past where it was looked for, it isn't near.
      if (at >= f.arm + f.R + 1.95) continue
      if (at < a) a = at
      reach = Math.max(reach, f.reach(at))
    }
    return { a, reach }
  }
}

/** A closed path round the centre stone, evenly spaced, whose inside stands `inner` mm off the girdle: stepped out where
 *  V-claws stand, so it clears their outsides by a breath, easing back over a millimetre or so each side, and spaced
 *  evenly again. Unchanged without V-claws. */
function clearOfVClaws(d: RingDesign, L: Layout, path: Pt[], inner: number): Pt[] {
  if (!L.prongs.vTips.length) return path
  const near = vClaws(d, L)
  const n = path.length
  const seg = path.map((q, i) => Math.hypot(path[(i + 1) % n][0] - q[0], path[(i + 1) % n][1] - q[1]))
  const step = seg.reduce((t, v) => t + v, 0) / n
  const need = path.map(([x, z]) => {
    const { reach } = near(x, z)
    return reach > 0 ? Math.max(0, reach + 0.1 - inner) : 0
  })
  // Each step held over half a millimetre each way, then eased twice over as much, so the path curves round a claw
  // without a crease and still clears it.
  const span = Math.max(1, Math.round(0.5 / step))
  const around = (v: number[], f: (k: number[]) => number) => v.map((_, i) => f(Array.from({ length: span * 2 + 1 }, (_, k) => v[(i + k - span + n) % n])))
  const mean = (k: number[]) => k.reduce((t, x) => t + x, 0) / k.length
  const push = around(around(around(need, (k) => Math.max(...k)), mean), mean)
  if (!push.some((v) => v > 0)) return path
  const moved = path.map((q, i): Pt => {
    const prev = path[(i - 1 + n) % n]
    const next = path[(i + 1) % n]
    const tx = next[0] - prev[0]
    const tz = next[1] - prev[1]
    const l = Math.hypot(tx, tz) || 1
    let nx = tz / l
    let nz = -tx / l
    if (nx * q[0] + nz * q[1] < 0) {
      nx = -nx
      nz = -nz
    }
    return [q[0] + nx * push[i], q[1] + nz * push[i]]
  })
  // Evenly spaced again along the stepped path.
  const len = moved.map((q, i) => Math.hypot(moved[(i + 1) % n][0] - q[0], moved[(i + 1) % n][1] - q[1]))
  const total = len.reduce((t, v) => t + v, 0)
  const out: Pt[] = []
  let i = 0
  let acc = 0
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total
    while (acc + len[i] < target && i < n - 1) acc += len[i++]
    const f = len[i] ? (target - acc) / len[i] : 0
    const a = moved[i]
    const b = moved[(i + 1) % n]
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
  }
  return out
}

/** The halo's frame: a wall of metal round the centre stone with a seat cut for each of its stones, swept a station
 *  every 0.04 mm; traced as a coarser copy (`trace`, a fifth of the faces, its seats cut wider: `seatCut`); and posts
 *  from its underside down to the head's foot, so it is carried, not floating. */
export function haloGallery(d: RingDesign, L: Layout): { frame: BufferGeometry; trace: BufferGeometry; posts: BufferGeometry[] } {
  const plan = haloPlan(d, L)
  const seats = plan.stones.map((s): Seat => {
    const { p } = plan.at(s)
    return { c: new Vector3(p[0], plan.y, p[1]), axis: Y, r: plan.r + 0.01, g: plan.g }
  })
  const bevel = Math.max(0.08, plan.r * 0.18)
  const W = plan.width / 2
  const build = (step: number, top: number, k: number, erode: number) => {
    const n = Math.ceil(plan.total / step)
    const cut = seatCut(seats, bevel, erode)
    const stations = [...Array(n).keys()].map((i): Station => {
      const { p, n: out } = plan.at((i / n) * plan.total)
      return { p: new Vector3(p[0], plan.top, p[1]), a: new Vector3(out[0], 0, out[1]), u: Y }
    })
    return sweptFrame(stations, (st) => roundedFrame(st, cut, W, plan.height, top, k))
  }
  const frame = build(0.04, 40, 4, 0)
  // Widened by half the coarse cell's diagonal: more than its faces ever rise over the seats they cut.
  const trace = build(0.1, 16, 2, Math.hypot(0.1, (2 * W) / 16) / 2)
  const w = L.prongs.wire
  const posts = [45, 135, 225, 315].map((deg) => {
    const phi = (deg * Math.PI) / 180
    const dir = new Vector3(Math.sin(phi), 0, Math.cos(phi))
    // Under the frame where it runs in this direction (further out where it steps round a V-claw).
    const under = plan.at(arcAt(plan.path, phi)).p
    const rr = Math.hypot(under[0], under[1])
    const from = dir.clone().multiplyScalar(rr - plan.r * 0.24).setY(plan.top - plan.height + 0.2)
    const mid = dir.clone().multiplyScalar(rr * 0.55).setY((plan.top - plan.height + L.y.culet) / 2)
    const to = dir.clone().multiplyScalar(w * 1.4).setY(L.y.bandTop + 0.05)
    return wire([from, mid, to], (t) => [0.36 - 0.08 * t, 0.36 - 0.08 * t], 28, 12)
  })
  return { frame, trace, posts }
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

/** Stones along the band (pavé or channel): placements, the prongs that hold pavé (a pair at every gap and at each
 *  row's ends, so each stone is held at four points) and a channel's rails. */
export function bandStones(d: RingDesign, L: Layout): { stones: Matrix4[]; prongs: Matrix4[]; rails: BufferGeometry[]; order: number[] } {
  const p = L.pave!
  const stones: Matrix4[] = []
  const prongs: Matrix4[] = []
  const order: number[] = []
  const { inner, thickness } = L.band
  const per = p.count / (2 * p.rows)
  const [a0, a1] = p.arc
  const splitSpread = (th: number) => (d.band.form === 'split' ? Math.max(0, L.centre.length * 0.42 - L.band.width / 4) * smooth(1.25, 0.1, Math.abs(th)) : 0)
  const strandOffset = (th: number, row: number) => (p.rows === 2 ? (row ? -1 : 1) * (L.band.width * 0.24 + splitSpread(th)) : 0)
  // The girdle just under the flat top, the crown above it: set into the metal, not on it. A channel sinks them a
  // little deeper, between its walls.
  const girdle = p.mm * 0.03
  const seatU = thickness - girdle / 2 - (p.channel ? 0.16 : 0.03)
  // Prongs either side of a gap, kept on the strand when the strand is barely wider than the stone.
  const strandHalf = (d.band.form === 'split' ? L.band.width * 0.56 : L.band.width) / 2
  const prong = prongSize(p.mm)
  const crown = p.mm * 0.15
  // Each head spread along the band (the prong's own x, once stood on the band's normal), over the stones each side.
  const size = PRONG_SPREAD.clone().multiplyScalar(prong)
  for (const side of [1, -1]) {
    for (let row = 0; row < p.rows; row++) {
      for (let i = 0; i < per; i++) {
        const th = side * (a0 + ((a1 - a0) * (i + 0.5)) / per)
        const n = new Vector3(Math.sin(th), Math.cos(th), 0)
        const v = strandOffset(th, row)
        const at = n.clone().multiplyScalar(inner + seatU).setZ(v)
        stones.push(standing(at, n, spinOf(i + row * 7), p.mm))
        order.push(Math.abs(th))
      }
      if (p.channel) continue
      // A pair at every gap and as far beyond each end, the heads' undersides an eighth of the way up the crowns.
      const spacing = ((a1 - a0) / per) * (inner + seatU)
      const { across } = prongPlace(p.mm / 2, prong, spacing, strandHalf)
      const foot = inner + seatU + girdle / 2 + crown * 0.12
      for (let i = 0; i <= per; i++) {
        const gap = side * (a0 + ((a1 - a0) * i) / per)
        const gn = new Vector3(Math.sin(gap), Math.cos(gap), 0)
        const gv = strandOffset(gap, row)
        const turn = new Quaternion().setFromUnitVectors(Y, gn)
        for (const e of [1, -1]) prongs.push(new Matrix4().compose(gn.clone().multiplyScalar(foot).setZ(gv + e * across), turn, size))
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
  return { stones, prongs, rails, order }
}

/** The halo's stones, each in its seat (its girdle at the plan's height, turned a little its own way), and the prongs
 *  that hold them: a pair at every gap between two stones, their heads over both girdles, and one on the outer side of
 *  each stone beside a claw, the claw holding its inner side; so every stone is held at four points. */
export function haloStones(d: RingDesign, L: Layout): { stones: Matrix4[]; prongs: Matrix4[] } {
  const plan = haloPlan(d, L)
  const stones = plan.stones.map((s, i) => {
    const { p } = plan.at(s)
    return standing(new Vector3(p[0], plan.y, p[1]), Y, spinOf(i), L.halo!.mm)
  })
  const prongs: Matrix4[] = []
  const size = PRONG_SPREAD.clone().multiplyScalar(plan.prong)
  // Each head's underside an eighth of the way up the crowns, where it rests on them.
  const foot = plan.y + plan.g + plan.crown * 0.12
  // A prong `across` the path and `ahead` along it from a point, its head spread along `[dx, dz]` (in the path's own
  // terms: along it, out of it).
  const put = (s: number, across: number, ahead: number, dx: number, dz: number) => {
    const { p, t, n } = plan.at(s)
    const x = t[0] * dx + n[0] * dz
    const z = t[1] * dx + n[1] * dz
    prongs.push(new Matrix4().compose(new Vector3(p[0] + n[0] * across + t[0] * ahead, foot, p[1] + n[1] * across + t[1] * ahead), new Quaternion().setFromAxisAngle(Y, Math.atan2(-z, x)), size))
  }
  const room = plan.width / 2
  for (const gap of plan.gaps) {
    const { across } = prongPlace(plan.r, plan.prong, gap.spacing, room)
    put(gap.at, across, 0, 1, 0)
    put(gap.at, -across, 0, 1, 0)
  }
  // Beside a claw (it stands inside the stones' centreline), as far across as the prongs between the stones stand, its
  // head spread toward the one stone it holds.
  const { reach, across } = prongPlace(plan.r, plan.prong, L.halo!.mm + 0.06, room)
  const ahead = Math.sqrt(Math.max(0, reach ** 2 - across ** 2))
  for (const end of plan.ends) put(end.at, across, end.way * ahead, -end.way * ahead, -across)
  return { stones, prongs }
}

/** The hidden halo as it is set: its stones round the pavilion under the girdle, on the layout's path (the pavilion's
 *  outline where the stones' tops are, or its hull, grown by its offset) at its height, in its runs between the stretches
 *  the layout keeps clear (each claw, and each V-claw's stem, passing between the two stones beside it), each leaning
 *  back HIDDEN_TILT; and its collar's measures: its top square to the stones, two fifths of the way up their crowns, its
 *  outer edge past their seats' bevels by a rim, deep enough to take their pavilions. */
function hiddenPlan(d: RingDesign, L: Layout) {
  const h = L.hiddenHalo!
  const path = outlinePath(d.stone.shape, L.centre.width * h.scale, L.centre.length / L.centre.width, h.offset, 720, h.hull)
  const { total, at } = along(path)
  const r = h.mm / 2
  const lean = Math.sin(HIDDEN_TILT)
  const upright = Math.cos(HIDDEN_TILT)
  const places = meleePlaces(total, h.runs, h.keep, arcAt(path, 0))
  const g = h.mm * 0.015
  const crown = h.mm * 0.15
  const bevel = Math.max(0.08, r * 0.18)
  return { path, total, at, ...places, offset: h.offset, y: L.y.girdle - h.drop, r, g, crown, lean, upright, lift: g + crown * 0.4, bevel, rim: r + 0.13 + bevel, depth: g * 2 + crown * 0.4 + h.mm * 0.435 + 0.15, prong: prongSize(h.mm) }
}

/** Where the hidden halo is, a distance along its path: a stone's centre there, the way its table faces (out, and up by
 *  HIDDEN_TILT), the way across its collar (down and out) and the way along. */
function hiddenAt(plan: ReturnType<typeof hiddenPlan>, s: number) {
  const { p, t, n } = plan.at(s)
  const out = new Vector3(n[0], 0, n[1])
  return {
    centre: new Vector3(p[0], plan.y, p[1]),
    face: out.clone().multiplyScalar(plan.upright).setY(plan.lean),
    across: out.clone().multiplyScalar(plan.lean).setY(-plan.upright),
    along: new Vector3(t[0], 0, t[1]),
    out,
  }
}

/** The hidden halo's collar: a ring of metal round the pavilion, its top square to the stones with a seat cut for each,
 *  its inner face a breath off the pavilion (the claws pass through it, so it is carried by them), swept a station every
 *  0.04 mm; traced as a coarser copy, its seats cut wider (`seatCut`). */
export function hiddenCollar(d: RingDesign, L: Layout): { frame: BufferGeometry; trace: BufferGeometry } {
  const plan = hiddenPlan(d, L)
  const seats = plan.stones.map((s): Seat => {
    const f = hiddenAt(plan, s)
    return { c: f.centre, axis: f.face, r: plan.r + 0.01, g: plan.g }
  })
  const apex = new Vector3(0, L.y.culet, 0)
  // The stones' tops, where the path is the pavilion's outline grown by the offset.
  const yTop = plan.y + plan.r * plan.upright
  const H = plan.depth
  const R = plan.rim
  const re = 0.07
  const rb = Math.min(0.16, H * 0.25)
  const q = new Vector3()
  const np = new Vector3()
  const build = (step: number, top: number, k: number, erode: number) => {
    const n = Math.ceil(plan.total / step)
    const cutAt = seatCut(seats, plan.bevel, erode)
    const stations = [...Array(n).keys()].map((i) => {
      const f = hiddenAt(plan, (i / n) * plan.total)
      return { p: f.centre.clone().addScaledVector(f.face, plan.lift), a: f.across, u: f.face, f }
    })
    return sweptFrame(stations, (st) => {
      const { f } = st as (typeof stations)[number]
      // The pavilion beside the station (a cone from the girdle down to the culet: the line from the culet through the
      // pavilion's outline at the stones' tops, and the way along), and the face a breath off it, in the section's terms:
      // metal where ca·o + cu·h ≥ c0.
      q.copy(f.centre).addScaledVector(f.out, -plan.offset).setY(yTop)
      np.copy(q).sub(apex).normalize().cross(f.along).normalize()
      if (np.dot(f.out) < 0) np.negate()
      const ca = np.dot(f.across)
      const cu = np.dot(f.face)
      const c0 = 0.015 - np.dot(q.sub(st.p).negate())
      const inner = c0 / ca
      // How far down the metal goes at a point of the top: to the bottom, or to the inner face.
      const room = (o: number) => (cu > 1e-3 ? Math.min(H, (ca * o - c0) / cu) : H)
      const out: Pt[] = []
      for (let i = 0; i <= top; i++) {
        const o = R - re - ((R - re - inner) * i) / top
        out.push([o, -Math.min(cutAt(st, o), Math.max(0, room(o) - 0.05))])
      }
      // Down the inner face to the bottom, along it, and up the outside, its corners rounded.
      out.push([(c0 + cu * H) / ca, -H])
      out.push([R - rb, -H])
      out.push(...arcPts(R - rb, -H + rb, rb, Math.PI * 1.5, Math.PI * 2, k))
      out.push([R, -re])
      out.push(...arcPts(R - re, -re, re, 0, Math.PI / 2, k).slice(0, -1))
      return out
    })
  }
  const frame = build(0.04, 32, 4, 0)
  const trace = build(0.1, 12, 2, Math.hypot(0.1, (R + plan.r) / 12) / 2)
  return { frame, trace }
}

/** The hidden halo's stones, each in its seat in the collar, and their prongs: a pair at every gap between two stones,
 *  their heads over both, and one on the outer side of each stone beside a claw (the claw holds its inner side). */
export function hiddenHaloStones(d: RingDesign, L: Layout): { stones: Matrix4[]; prongs: Matrix4[] } {
  const plan = hiddenPlan(d, L)
  const stones = plan.stones.map((s, i) => {
    const f = hiddenAt(plan, s)
    return standing(f.centre, f.face, spinOf(i), L.hiddenHalo!.mm)
  })
  const prongs: Matrix4[] = []
  const size = PRONG_SPREAD.clone().multiplyScalar(plan.prong)
  // A prong `across` the collar and `ahead` along it from a point, its head spread along `dx` (along) and `dz` (across),
  // its underside an eighth of the way up the crowns.
  const put = (s: number, across: number, ahead: number, dx: number, dz: number) => {
    const f = hiddenAt(plan, s)
    const x = f.along.clone().multiplyScalar(dx).addScaledVector(f.across, dz).normalize()
    const z = new Vector3().crossVectors(x, f.face)
    const at = f.centre.clone().addScaledVector(f.face, plan.g + plan.crown * 0.12).addScaledVector(f.across, across).addScaledVector(f.along, ahead)
    prongs.push(new Matrix4().makeBasis(x, f.face, z).scale(size).setPosition(at))
  }
  // Toward the pavilion the collar ends a breath past the stones.
  const room = plan.r + 0.03
  for (const gap of plan.gaps) {
    const { across } = prongPlace(plan.r, plan.prong, gap.spacing, room)
    put(gap.at, across, 0, 1, 0)
    put(gap.at, -across, 0, 1, 0)
  }
  const { reach, across } = prongPlace(plan.r, plan.prong, L.hiddenHalo!.mm + 0.08, room)
  const ahead = Math.sqrt(Math.max(0, reach ** 2 - across ** 2))
  for (const end of plan.ends) put(end.at, across, end.way * ahead, -end.way * ahead, -across)
  return { stones, prongs }
}

/** How far the gallery's side diamonds lean back: facing out, and this much up. */
const PEEK_TILT = Math.atan2(0.25, 1)

/** The gallery's side diamonds, one each side of the head facing out (into the nearest gap between the claws when a
 *  claw stands at the side, mirrored on the other), each with its culet on the claws' line round the pavilion, two
 *  fifths of the way up it, or low enough to clear a hidden halo's collar: where each stands and the way it faces. */
function peekPlaces(d: RingDesign, L: Layout): { at: Vector3; face: Vector3 }[] {
  const m = L.peekaboo!
  const r = m.mm / 2
  const { low, pavilion } = stoneShape(d, L)
  const w = clawWire(d, L)
  // How far its cup rises above its centre.
  const cupTop = (r + 0.17) * Math.cos(PEEK_TILT) + (m.mm * 0.015 + 0.11) * Math.sin(PEEK_TILT)
  let y = L.y.culet + (low - L.y.culet) * 0.42
  if (L.hiddenHalo) {
    const h = hiddenPlan(d, L)
    // The collar's lowest edge, outside and under its stones.
    const bottom = h.y + h.lean * h.lift - h.upright * h.rim - h.lean * h.depth
    y = Math.min(y, bottom - 0.06 - cupTop)
  }
  y = Math.max(y, L.y.bandTop + cupTop)
  const claws = [...L.prongs.positions, ...L.prongs.vTips].map((a) => ((a % 360) + 360) % 360).sort((a, b) => a - b)
  const gap = (a: number, b: number) => ((b - a + 360) % 360) || 360
  // At the side, unless a claw stands within 22° of it: then the middle of the nearest gap (on the fingertip's side when
  // two are as near).
  let side = 90
  if (claws.some((a) => Math.abs(((a - 90 + 540) % 360) - 180) < 22)) {
    let best = Infinity
    claws.forEach((a, i) => {
      const b = claws[(i + 1) % claws.length]
      const mid = (a + gap(a, b) / 2) % 360
      const off = Math.abs(((mid - 90 + 540) % 360) - 180) + (mid > 90 ? 1e-6 : 0)
      if (off < best) {
        best = off
        side = mid
      }
    })
  }
  return [side, 360 - side].map((deg) => {
    const phi = (deg * Math.PI) / 180
    const dir = new Vector3(Math.sin(phi), 0, Math.cos(phi))
    const x = pavilion(girdleRadius(d, L, deg), y) + w * 0.92 + m.mm * 0.45 * Math.cos(PEEK_TILT)
    return { at: dir.clone().multiplyScalar(x).setY(y), face: dir.clone().multiplyScalar(Math.cos(PEEK_TILT)).setY(Math.sin(PEEK_TILT)) }
  })
}

/** The gallery's side diamonds. */
export function peekabooStones(d: RingDesign, L: Layout): Matrix4[] {
  return peekPlaces(d, L).map(({ at, face }) => standing(at, face, 0, L.peekaboo!.mm))
}

/** Each side diamond's bezel cup: a burnished lip lying on the crown's edge, a short wall round the girdle, then a cone
 *  under the pavilion, shallower than it, closed under the culet; its top meets the basket's rail, so it hangs in the
 *  gallery rather than floating beside it. */
export function peekabooCups(d: RingDesign, L: Layout): BufferGeometry[] {
  const mm = L.peekaboo!.mm
  const r = mm / 2
  const g = mm * 0.015
  const pav = mm * 0.435
  const R = r + 0.17
  // [radius, up its axis from the girdle's middle], from under the culet up the outside, over the lip, down the inside.
  const profile = [
    [0, -g - pav - 0.14],
    [0.28, -g - pav + 0.11],
    [R, -g - pav * 0.35],
    [R, g + 0.06],
    [R - 0.05, g + 0.11],
    [r + 0.05, g + 0.08],
    [r - 0.05, g + 0.036],
    [r - 0.04, g + 0.025],
    [r + 0.01, g],
    [r + 0.01, -g],
    [0.01, -g - pav - 0.001],
    [0, -g - pav - 0.01],
  ].map(([x, y]) => new Vector2(x, y))
  return peekPlaces(d, L).map(({ at, face }) => outward(new LatheGeometry(profile, 32)).applyMatrix4(standing(at, face, 0, 1)))
}

/** The surprise: one diamond in the inside of the band at the bottom, facing the finger, set flush: its table a breath
 *  under the surface. */
export function surpriseStone(d: RingDesign, L: Layout): Matrix4 {
  const s = surpriseSeat(d, L)
  return standing(new Vector3(0, s.y - 0.02 - s.crown - s.g, 0), Y, 0, s.mm)
}

/** Milgrain: tiny beads along both edges of the band's outer surface, away from the head, each half sunk in the edge
 *  where the outer surface turns into the side. */
export function milgrain(d: RingDesign, L: Layout, headArc: number): Matrix4[] {
  const out: Matrix4[] = []
  const { inner, thickness } = L.band
  const count = Math.floor((Math.PI * 2 * (inner + thickness)) / 0.3)
  for (let i = 0; i < count; i++) {
    const th = (i / count) * Math.PI * 2
    const a = Math.abs(((th + Math.PI) % (Math.PI * 2)) - Math.PI)
    if (a < headArc) continue
    const n = new Vector3(Math.sin(th), Math.cos(th), 0)
    for (const { at, normal } of bandEdges(d, L, th)) {
      const u = at[0] + normal[0] * 0.04
      const v = at[1] + normal[1] * 0.04
      out.push(new Matrix4().makeTranslation(n.x * (inner + u), n.y * (inner + u), v))
    }
  }
  return out
}

/** The three-stone sides: placements (tilted slightly outward) and their claws. */
export function sideStones(d: RingDesign, L: Layout): { at: Matrix4[]; claws: BufferGeometry[]; feet: BufferGeometry[]; sizes: { width: number; length: number } } {
  const s = L.sides!
  const y = L.y.girdle - 0.55
  const at: Matrix4[] = []
  const wires: BufferGeometry[] = []
  const feet: BufferGeometry[] = []
  const R = L.band.inner + L.band.thickness
  // A point inside the band, `depth` under its outer surface, at a distance x from the head and z along the finger.
  const inBand = (x: number, z: number, depth: number) => {
    const th = Math.asin(Math.max(-1, Math.min(1, x / R)))
    return new Vector3(Math.sin(th) * (R - depth), Math.cos(th) * (R - depth), z)
  }
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
      const base = inBand(centre.x * 0.92, pz * 0.4, 0.4)
      wires.push(wire([base, rim2, top], (t) => {
        const k = 0.34 * (1 - smooth(0.7, 1, t) * 0.3)
        return [k, k]
      }, 16, 8))
    }
  }
  for (const side of [1, -1]) {
    const x = side * s.offset * 0.95
    feet.push(foot(inBand(x, 0, 0.7), new Vector3(side * s.offset, y - s.depth * 0.5, 0), 0.42, [0.75, Math.max(0, Math.min(0.4, L.band.topWidth / 2 - 0.5))]))
  }
  return { at, claws: wires, feet, sizes: { width: s.width, length: s.length } }
}

/** How far in front of the band's surface the engraving lies (mm): clear of its depth, too little to see. */
const CUT_LIFT = 0.008

/** Where the engraving is cut: the band's own inner faces at the bottom, copied (so the lettering lies on its very
 *  surface, with its normals, whatever its section), a breath in front of it, and mapped to the lettering: u along the
 *  arc (`length` mm round the inside, the way it reads), v across its middle (`across` mm); tangents along the arc. */
export function engravingStrip(d: RingDesign, L: Layout, length: number, across: number): BufferGeometry {
  const arc = length / L.band.inner
  // With a surprise diamond at the bottom, the lettering runs on from just after it.
  const from = L.surprise ? -(surpriseSeat(d, L).rb + 0.45) / L.band.inner - arc / 2 : 0
  const pos: number[] = []
  const nor: number[] = []
  const tan: number[] = []
  const uv: number[] = []
  const p = new Vector3()
  const n = new Vector3()
  for (const g of bandGeometries(d, L)) {
    // Not the surprise diamond's seat: the lettering runs on beside it.
    if (g.userData.seat) {
      g.dispose()
      continue
    }
    const P = g.getAttribute('position')
    const N = g.getAttribute('normal')
    const index = g.index!
    for (let i = 0; i + 2 < index.count; i += 3) {
      // A face turned to the finger, within the lettering's reach (angles from the bottom).
      let inside = true
      let near = false
      for (let c = 0; c < 3; c++) {
        const k = index.getX(i + c)
        p.fromBufferAttribute(P, k)
        n.fromBufferAttribute(N, k)
        if ((n.x * p.x + n.y * p.y) / Math.hypot(p.x, p.y) > -0.5) inside = false
        if (Math.abs(Math.atan2(-p.x, -p.y) - from) < arc / 2 + 0.04 && Math.abs(p.z) < across / 2 + 0.15) near = true
      }
      if (!inside || !near) continue
      for (let c = 0; c < 3; c++) {
        const k = index.getX(i + c)
        p.fromBufferAttribute(P, k)
        n.fromBufferAttribute(N, k)
        const phi = Math.atan2(-p.x, -p.y)
        pos.push(p.x + n.x * CUT_LIFT, p.y + n.y * CUT_LIFT, p.z + n.z * CUT_LIFT)
        nor.push(n.x, n.y, n.z)
        // Read from the front, looking in: u rises as the angle falls (toward +x at the bottom), v toward the back (-z),
        // where the letters' tops point; the bitangent (normal × tangent × w) runs along v.
        tan.push(Math.cos(phi), -Math.sin(phi), 0, 1)
        uv.push(0.5 - (phi - from) / arc, 0.5 - p.z / across)
      }
    }
    g.dispose()
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setAttribute('tangent', new Float32BufferAttribute(tan, 4))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  return g
}
