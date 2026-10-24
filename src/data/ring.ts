// The ring designer's model: a ring as the visitor composes it (stone, setting, claws, band, metal, details, size), its
// measurements, and its address form. Everything the 3D view draws and the price counts comes from `layoutOf`, so the
// two always agree. The proportions are the atelier's working ones; the stones are placeholders, as the catalog's are.
import type { Metal } from './catalog'
import { arcAt, hullOf, meleeRuns, outlineOf, outlinePath, pathLength, radiusAt, radiusTable, type Keep, type Pt } from './outline'

export type StoneType = 'diamond' | 'sapphire' | 'ruby' | 'emerald'
export type Shape = 'round' | 'oval' | 'cushion' | 'emerald' | 'radiant' | 'princess' | 'asscher' | 'pear' | 'marquise' | 'heart'
export type Colour = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
export type Clarity = 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2'
export type GemGrade = 'fine' | 'extra' | 'exceptional'
export type SettingStyle = 'solitaire' | 'halo' | 'three-stone' | 'bezel'
export type SettingHeight = 'low' | 'classic' | 'high'
export type SideShape = 'round' | 'pear' | 'baguette'
export type ProngTip = 'round' | 'eagle' | 'tab'
export type BandForm = 'classic' | 'knife' | 'split' | 'twist'
export type BandStones = 'none' | 'pave' | 'channel'
export type Coverage = 'half' | 'three-quarter' | 'full'
export type BandMetal = Exclude<Metal, 'vermeil'>
export type HeadMetal = 'match' | 'platinum' | '18k-white'
export type Finish = 'polished' | 'satin' | 'hammered'
export type EngravingFont = 'script' | 'serif' | 'block'

/** The catalog piece a designed ring rides on in the bag and at a visit: the commission (the design is its line's own). */
export const DESIGN_SLUG = 'bespoke-engagement-commission'

/** A ring as designed. `size` stays empty until the visitor gives it: it is only needed to buy. */
export interface RingDesign {
  stone: { type: StoneType; shape: Shape; carat: number; colour: Colour; clarity: Clarity; grade: GemGrade }
  setting: { style: SettingStyle; height: SettingHeight; cathedral: boolean; sides: SideShape; sideCarat: number }
  prongs: { count: 4 | 6; double: boolean; tip: ProngTip; vTips: boolean; compass: boolean }
  band: { form: BandForm; stones: BandStones; coverage: Coverage; width: number; taper: boolean }
  metal: { band: BandMetal; head: HeadMetal; finish: Finish }
  details: { hiddenHalo: boolean; peekaboo: boolean; surprise: boolean; milgrain: boolean; engraving: string; font: EngravingFont }
  size: string | null
}

export const STONE_TYPES: StoneType[] = ['diamond', 'sapphire', 'ruby', 'emerald']
export const SHAPES: Shape[] = ['round', 'oval', 'cushion', 'emerald', 'radiant', 'princess', 'asscher', 'pear', 'marquise', 'heart']
export const COLOURS: Colour[] = ['D', 'E', 'F', 'G', 'H', 'I', 'J']
export const CLARITIES: Clarity[] = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']
export const GRADES: GemGrade[] = ['fine', 'extra', 'exceptional']
export const STYLES: SettingStyle[] = ['solitaire', 'halo', 'three-stone', 'bezel']
export const HEIGHTS: SettingHeight[] = ['low', 'classic', 'high']
export const SIDE_SHAPES: SideShape[] = ['round', 'pear', 'baguette']
export const TIPS: ProngTip[] = ['round', 'eagle', 'tab']
export const FORMS: BandForm[] = ['classic', 'knife', 'split', 'twist']
export const BAND_STONES: BandStones[] = ['none', 'pave', 'channel']
export const COVERAGES: Coverage[] = ['half', 'three-quarter', 'full']
export const BAND_METALS: BandMetal[] = ['platinum', '18k-white', '18k-yellow', '18k-rose']
export const HEAD_METALS: HeadMetal[] = ['match', 'platinum', '18k-white']
export const FINISHES: Finish[] = ['polished', 'satin', 'hammered']
export const FONTS: EngravingFont[] = ['script', 'serif', 'block']

export const CARAT = { min: 0.3, max: 4, step: 0.01 }
export const SIDE_CARAT = { min: 0.1, max: 0.75, step: 0.01 }
export const WIDTH = { min: 1.6, max: 3, step: 0.1 }
export const ENGRAVING_MAX = 18
/** The weights a carat slider marks: just under them is where value hides. */
export const MAGIC_CARATS = [0.5, 0.75, 1, 1.5, 2, 2.5, 3]

/** Each cut's outline proportions: length ÷ width, depth ÷ width, the factor that turns millimetres into carats for a
 *  diamond (ct = L × W × D × k), whether it is step cut, and its points (where a V-claw protects it). */
export const CUTS: Record<Shape, { ratio: number; depth: number; k: number; step: boolean; points: number }> = {
  round: { ratio: 1, depth: 0.615, k: 0.0061, step: false, points: 0 },
  oval: { ratio: 1.4, depth: 0.62, k: 0.0062, step: false, points: 0 },
  cushion: { ratio: 1.08, depth: 0.65, k: 0.008, step: false, points: 0 },
  emerald: { ratio: 1.4, depth: 0.66, k: 0.008, step: true, points: 0 },
  radiant: { ratio: 1.25, depth: 0.66, k: 0.0081, step: false, points: 0 },
  princess: { ratio: 1, depth: 0.72, k: 0.0083, step: false, points: 4 },
  asscher: { ratio: 1, depth: 0.66, k: 0.008, step: true, points: 0 },
  pear: { ratio: 1.55, depth: 0.62, k: 0.0059, step: false, points: 1 },
  marquise: { ratio: 2, depth: 0.6, k: 0.0058, step: false, points: 2 },
  heart: { ratio: 1, depth: 0.6, k: 0.0059, step: false, points: 1 },
}

// Specific gravity: a carat of sapphire or ruby is smaller than one of diamond, a carat of emerald larger.
const SG: Record<StoneType, number> = { diamond: 3.52, sapphire: 4, ruby: 4, emerald: 2.72 }

/** Metal densities in g/cm³ (mg/mm³). */
export const DENSITY: Record<BandMetal, number> = { platinum: 20.1, '18k-white': 15.8, '18k-yellow': 15.5, '18k-rose': 15.1 }

/** A stone's length, width and depth in millimetres. */
export function stoneSize(type: StoneType, shape: Shape, carat: number) {
  const c = CUTS[shape]
  const width = Math.cbrt(carat / (c.ratio * c.depth * c.k)) * Math.cbrt(SG.diamond / SG[type])
  return { length: width * c.ratio, width, depth: width * c.depth }
}

/** The diameter a round brilliant of this weight would have, so a fancy shape can say how large it looks. */
export const roundDiameter = (carat: number) => Math.cbrt(carat / (CUTS.round.depth * CUTS.round.k))

/** The weight of a round brilliant of this diameter (melee). */
export const meleeCarat = (mm: number) => mm * mm * mm * CUTS.round.depth * CUTS.round.k

/** The carat weight of a round brilliant that faces up like this stone (its top area), for "looks like" notes. */
export function facesUpLike(type: StoneType, shape: Shape, carat: number) {
  const s = stoneSize(type, shape, carat)
  const area = (Math.PI / 4) * s.length * s.width * (CUTS[shape].step ? 1.12 : shape === 'pear' || shape === 'heart' ? 0.92 : shape === 'marquise' ? 0.8 : shape === 'princess' || shape === 'cushion' || shape === 'radiant' ? 1.18 : 1)
  const d = Math.sqrt(area / (Math.PI / 4))
  return meleeCarat(d)
}

/** A V-claw's wall thickness (mm) for claws of wire radius `wire` (the claw's arms and the stem under its point follow it). */
export const vClawWall = (wire: number) => Math.min(0.8, Math.max(0.45, wire * 1.2))

/** Inside diameter (mm) of a North American ring size. */
export const innerDiameter = (size: string | null) => 11.63 + 0.8128 * Number(size ?? 6.5)

const HEIGHT_GAP: Record<SettingHeight, number> = { low: 0.25, classic: 0.9, high: 1.8 }

export interface Melee {
  count: number
  /** Stone diameter, mm. */
  mm: number
  carat: number
}

/** A ring of small stones round the centre stone (a halo, a hidden halo): its path is the centre stone's outline (its
 *  convex hull when `hull`) scaled by `scale` and grown outward by `offset` (mm), `drop` (mm) under the girdle; its
 *  stones run between the stretches it keeps clear (`keep`, arc positions on that path: where the claws pass, and where
 *  a stone wouldn't fit), `runs` of them in each free stretch in order round the path (`meleeRuns`). */
export interface MeleeRing extends Melee {
  scale: number
  offset: number
  drop: number
  runs: number[]
  keep: Keep[]
  hull: boolean
}

/** How far a halo's stones stand off the centre stone's girdle (mm). */
export const HALO_GAP = 0.25

/** How far a hidden halo's stones lean back from upright (their tables face out and this much up). */
export const HIDDEN_TILT = (25 * Math.PI) / 180

/** A claw's wire radius as drawn (mm): finer when there are six, or two at each place (a pair reads as one claw), and
 *  inside a halo, which guards the stone, as a bench makes them; the layout's own measure (for the metal's weight)
 *  stays as it is. */
export const clawWire = (d: RingDesign, L: Pick<Layout, 'prongs'>) => L.prongs.wire * (d.prongs.double ? 0.7 : L.prongs.positions.length >= 6 ? 0.9 : 1) * (d.setting.style === 'halo' ? 0.82 : 1)

/** How far along a ring of small stones `mm` across the centres of the two stones beside a claw keep from it (half the
 *  stretch kept clear): the claw, of wire radius `wire`, stands `apart` (mm) further out or in than the ring's
 *  centreline, and passes between them clear by a breath. */
export const clawClearance = (wire: number, mm: number, apart: number) => Math.sqrt(Math.max(0, (wire + mm / 2 + 0.03) ** 2 - apart ** 2))

/** The ring measured: what the 3D view builds and the price counts. Millimetres throughout. */
export interface Layout {
  centre: { length: number; width: number; depth: number; crown: number; pavilion: number; girdle: number }
  /** Heights above the finger's axis: the band's outer top, the culet, the girdle and the table. */
  y: { bandTop: number; culet: number; girdle: number; table: number }
  band: { inner: number; width: number; thickness: number; topWidth: number }
  prongs: { positions: number[]; wire: number; vTips: number[] }
  halo: MeleeRing | null
  hiddenHalo: MeleeRing | null
  sides: { shape: SideShape; carat: number; length: number; width: number; depth: number; offset: number } | null
  pave: (Melee & { arc: [number, number]; rows: number; channel: boolean }) | null
  peekaboo: Melee | null
  surprise: Melee | null
  carats: { centre: number; sides: number; melee: number; total: number }
  metal: { volume: number; grams: Record<BandMetal, number>; headShare: number }
  /** Setting height: from the finger to the top of the stone. */
  rise: number
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const round2 = (n: number) => Math.round(n * 100) / 100

/** The claws' angles around the stone (degrees, 0 = towards the fingertip), before V-claws at its points. */
function prongAngles(d: RingDesign, ratio: number): number[] {
  const { shape } = d.stone
  const { count, compass } = d.prongs
  // The corners of an elongated outline sit off the diagonal.
  const corner = (Math.atan2(0.5, 0.5 * ratio) * 180) / Math.PI
  const corners = [corner, 180 - corner, 180 + corner, 360 - corner]
  let base: number[]
  if (shape === 'round' || shape === 'heart') base = count === 6 ? [30, 90, 150, 210, 270, 330] : compass ? [0, 90, 180, 270] : [45, 135, 225, 315]
  else if (count === 6) base = [0, ...corners.slice(0, 2), 180, ...corners.slice(2)].sort((a, b) => a - b)
  else base = compass && (shape === 'cushion' || shape === 'princess' || shape === 'asscher') ? [0, 90, 180, 270] : corners
  // A V-claw at each point replaces the claws nearest it.
  const points = vTipAngles(d)
  base = base.filter((a) => points.every((p) => Math.abs(((a - p + 540) % 360) - 180) > 34))
  return d.prongs.double ? base.flatMap((a) => [a - 8, a + 8]) : base
}

/** Where V-claws guard the points: a pear's or heart's tip, a marquise's two, a princess's four corners. */
function vTipAngles(d: RingDesign): number[] {
  if (!d.prongs.vTips || d.setting.style === 'bezel') return []
  const { shape } = d.stone
  return shape === 'marquise' ? [0, 180] : shape === 'princess' ? [45, 135, 225, 315] : CUTS[shape].points ? [0] : []
}

/** Lays the ring out from its design. */
export function layoutOf(d: RingDesign): Layout {
  const cut = CUTS[d.stone.shape]
  const s = stoneSize(d.stone.type, d.stone.shape, d.stone.carat)
  const crown = s.width * (cut.step ? 0.11 : 0.15)
  const girdle = s.width * 0.03
  const pavilion = s.depth - crown - girdle
  const inner = innerDiameter(d.size) / 2
  const width = clamp(d.band.width, WIDTH.min, WIDTH.max)
  const thickness = d.band.form === 'twist' ? width * 0.62 : 1.55 + width * 0.12
  const topWidth = d.band.taper ? width * 0.72 : width
  const bandTop = inner + thickness
  const bezel = d.setting.style === 'bezel'
  const culet = bandTop + HEIGHT_GAP[d.setting.height] + (d.setting.cathedral ? 0.6 : 0)
  const gY = culet + pavilion + girdle / 2
  const table = gY + girdle / 2 + crown

  const positions = bezel ? [] : prongAngles(d, cut.ratio)
  const vTips = vTipAngles(d)
  const wire = clamp(s.width * 0.08, 0.42, 0.75)
  const claw = clawWire(d, { prongs: { positions, wire, vTips } })

  // Halo: one ring of melee round the girdle; a hidden halo: smaller stones on a collar under it, round the pavilion.
  // Each counted along its true path, a stretch between each two claws (the claws pass between their stones).
  const perimeter = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
  const ratio = s.length / s.width
  // A ring of stones `mm` across, packed `pitch` apart at least; `apart`: how far a claw (at an angle, degrees) stands
  // off its centreline, toward the centre; `extra`: more stretches to keep clear (`at` an angle, radians), and
  // `blocked` those found on the path itself.
  const ring = (mm: number, scale: number, offset: number, drop: number, pitch: number, apart: (deg: number) => number, extra: Keep[] = [], hull = false, blocked: (path: Pt[]) => Keep[] = () => []): MeleeRing => {
    const path = outlinePath(d.stone.shape, s.width * scale, ratio, offset, 720, hull)
    const keep = [...positions.map((deg) => ({ at: arcAt(path, (deg * Math.PI) / 180), half: clawClearance(claw, mm, apart(deg)) })), ...extra.map((k) => ({ at: arcAt(path, k.at), half: k.half })), ...blocked(path)]
    const runs = meleeRuns(pathLength(path), pitch, keep)
    const count = runs.reduce((t, n) => t + n, 0)
    return { count, mm, carat: count * meleeCarat(mm), scale, offset, drop, runs, keep, hull }
  }
  const haloMm = clamp(s.width * 0.17, 1.05, 1.6)
  // Its claws stand at the girdle, their centres 0.55 of a wire out from it.
  const halo: MeleeRing | null = d.setting.style === 'halo' ? ring(haloMm, 1, HALO_GAP + haloMm / 2, 0.05, haloMm + 0.06, () => HALO_GAP + haloMm / 2 - claw * 0.55) : null
  const hiddenMm = clamp(s.width * 0.13, 0.9, 1.25)
  const hiddenHalo: MeleeRing | null = d.details.hiddenHalo && !bezel && d.setting.style !== 'halo' ? (() => {
    // Round the pavilion under the girdle, each stone leaning back HIDDEN_TILT in a collar whose top is square to it,
    // two fifths of the way up its crown: the top of its girdle a breath off the pavilion, `below` the girdle's
    // underside, where the pavilion is the girdle's outline scaled by `scale` (round its convex hull for a heart, its
    // cleft bridged: `hull`). Low enough that the collar's outer edge (its seat, bright-cut bevel and rim past the stone, `rim` from
    // the stone's axis; `out` from the path seen from above) stays inside the girdle's outline: hidden from above,
    // except over a cleft.
    const rho = hiddenMm / 2
    const lean = Math.sin(HIDDEN_TILT)
    const upright = Math.cos(HIDDEN_TILT)
    const lift = hiddenMm * 0.075
    const rim = rho + 0.13 + Math.max(0.08, rho * 0.18)
    const offset = rho * lean + 0.03
    const out = upright * lift + lean * rim
    const unit = outlineOf(d.stone.shape, ratio)
    const girdleR = radiusTable(unit, s.width)
    const hullR = radiusTable(hullOf(unit), s.width)
    const low = gY - girdle / 2
    // A path's outward normal at a point (it runs as the outline does), over a tenth of a millimetre each way, as the 3D
    // view takes it.
    const normal = (path: Pt[], i: number): Pt => {
      const k = Math.max(1, Math.round((0.1 * path.length) / pathLength(path)))
      const a = path[(i - k + path.length) % path.length]
      const b = path[(i + k) % path.length]
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]
    }
    const hull = d.stone.shape === 'heart'
    const pathAt = (below: number) => outlinePath(d.stone.shape, s.width * (1 - below / pavilion), ratio, offset, 720, hull)
    // Deep enough where the girdle is narrowest; then deeper wherever the rim would still show (round a sharp point).
    let below = ((offset - 0.03 + out + 0.08) * pavilion) / (s.width / 2)
    for (let pass = 0; pass < 4; pass++) {
      const path = pathAt(below)
      let more = 0
      path.forEach((p, i) => {
        const [nx, nz] = normal(path, i)
        const x = p[0] + nx * out
        const z = p[1] + nz * out
        const R = girdleR(x, z)
        if (hull && hullR(x, z) - R > 0.02) return
        const over = Math.hypot(x, z) + 0.05 - R
        if (over > 0) more = Math.max(more, (over * pavilion) / R)
      })
      if (more < 1e-3) break
      below += more
    }
    const scale = 1 - below / pavilion
    const drop = girdle / 2 + below + rho * upright
    // Where a stone can't sit (beside a heart's cleft, round a sharp point): its girdle or its culet would come within a
    // breath of the pavilion (a cone from the girdle's underside down to the culet), its top above the girdle's, or its
    // girdle show past the girdle's outline seen from above (but over a cleft).
    const fits = (p: Pt, [nx, nz]: Pt): boolean => {
      const tx = -nz
      const tz = nx
      const y = gY - drop
      const pts: [number, number, number][] = [[p[0] - nx * upright * 0.45 * hiddenMm, y - lean * 0.45 * hiddenMm, p[1] - nz * upright * 0.45 * hiddenMm]]
      // Round the girdle's top and bottom edges.
      const g = hiddenMm * 0.015
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * Math.PI * 2
        const c = Math.cos(a) * rho
        const u = Math.sin(a) * rho
        for (const e of [g, -g]) pts.push([p[0] + tx * c - nx * lean * u + nx * upright * e, y + upright * u + lean * e, p[1] + tz * c - nz * lean * u + nz * upright * e])
      }
      return pts.every(([x, yy, z]) => {
        const rr = Math.hypot(x, z)
        const R = girdleR(x, z)
        return yy < low - 0.02 && rr - R * Math.max(0, (yy - culet) / (low - culet)) > 0.015 && (rr < R - 0.03 || (hull && hullR(x, z) - R > 0.02))
      })
    }
    const blocked = (path: Pt[]): Keep[] => {
      const n = path.length
      const step = pathLength(path) / n
      const bad = path.map((p, i) => !fits(p, normal(path, i)))
      const keeps: Keep[] = []
      bad.forEach((b, i) => {
        if (!b || bad[(i - 1 + n) % n]) return
        let j = i
        while (bad[(j + 1) % n] && j - i < n) j++
        // One step either way, so a stone at a stretch's end stands where it fits; and half a pitch at least, so the stones
        // either side stay a pitch apart.
        keeps.push({ at: ((i + j) / 2) * step, half: Math.max((hiddenMm + 0.08) / 2, ((j - i) / 2 + 1) * step) })
      })
      return keeps
    }
    // The claws hug the pavilion, their centres 0.92 of a wire out from it (a V-claw's stem, under its point, 1.2 of its
    // own), a little further in at the stones' middle than at their tops, as much as the pavilion slopes there.
    const slope = (deg: number) => (radiusAt(outlineOf(d.stone.shape, ratio), (deg * Math.PI) / 180) * s.width) / pavilion
    const stem = Math.min(claw, vClawWall(claw) / 2)
    const tips = vTips.map((deg) => ({ at: (deg * Math.PI) / 180, half: clawClearance(stem, hiddenMm, slope(deg) * rho * upright + offset - stem * 1.2) }))
    return ring(hiddenMm, scale, offset, drop, hiddenMm + 0.08, (deg) => slope(deg) * rho * upright + offset - claw * 0.92, tips, hull, blocked)
  })() : null

  // Three stones: the sides take their shape's proportions, a small gap from the centre.
  const sides = d.setting.style === 'three-stone' ? (() => {
    const shape: Shape = d.setting.sides === 'baguette' ? 'emerald' : d.setting.sides
    const sc = clamp(d.setting.sideCarat, SIDE_CARAT.min, SIDE_CARAT.max)
    const ss = stoneSize('diamond', shape, sc)
    // Baguettes are long and slim; they lie across the band.
    const length = d.setting.sides === 'baguette' ? ss.length * 1.15 : ss.length
    const w = d.setting.sides === 'baguette' ? ss.width * 0.8 : ss.width
    return { shape: d.setting.sides, carat: sc, length, width: w, depth: ss.depth, offset: s.width / 2 + w / 2 + 0.35 }
  })() : null

  // Pavé or channel along the band, away from the head.
  const headArc = Math.atan2((sides ? sides.offset + sides.width / 2 : s.width / 2) + 0.6, bandTop)
  const pave = d.band.stones !== 'none' ? (() => {
    const channel = d.band.stones === 'channel'
    const mm = clamp((d.band.taper ? topWidth : width) * (channel ? 0.62 : 0.52), 0.9, 1.7)
    const half = d.band.coverage === 'half' ? Math.PI / 2 : d.band.coverage === 'three-quarter' ? (Math.PI * 3) / 4 : Math.PI
    const rows = d.band.form === 'split' ? 2 : 1
    const arc: [number, number] = [headArc, half]
    const len = (half - headArc) * (bandTop + 0.1)
    const each = Math.max(2, Math.floor(len / (mm * (channel ? 1.0 : 1.12))))
    const count = each * 2 * rows
    return { count, mm, carat: count * meleeCarat(mm), arc, rows, channel }
  })() : null

  const peekMm = clamp(s.width * 0.2, 1.2, 1.8)
  const peekaboo: Melee | null = d.details.peekaboo && !bezel ? { count: 2, mm: peekMm, carat: 2 * meleeCarat(peekMm) } : null
  // Chosen to the band: its seat, with the bevel round it, stays on the flat of the inside.
  const surpriseMm = clamp(width * 0.55, 1, 1.6)
  const surprise: Melee | null = d.details.surprise ? { count: 1, mm: surpriseMm, carat: meleeCarat(surpriseMm) } : null

  // Metal: the band's section times its circumference, then the head's wires, rails and frames.
  const fill = d.band.form === 'twist' ? 0.7 : d.band.form === 'knife' ? 0.68 : d.band.form === 'split' ? 0.86 : 0.82
  const mid = inner + thickness / 2
  const avgWidth = d.band.taper ? (width + topWidth) / 2 : width
  let volume = avgWidth * thickness * fill * 2 * Math.PI * mid
  if (pave) volume *= 0.94
  const prongLen = pavilion + girdle + crown * 0.6 + HEIGHT_GAP[d.setting.height] + 1
  let head = positions.length * Math.PI * wire * wire * prongLen * 1.1 + Math.PI * 0.35 * 0.35 * perimeter(s.length * 0.3, s.width * 0.3)
  if (bezel) head += perimeter(s.length / 2 + 0.3, s.width / 2 + 0.3) * 1.3 * 0.45 + 6
  if (halo) head += pathLength(outlinePath(d.stone.shape, s.width, ratio, halo.offset, 360)) * (haloMm + 0.5) * 0.55
  if (hiddenHalo) head += pathLength(outlinePath(d.stone.shape, s.width * hiddenHalo.scale, ratio, hiddenHalo.offset, 360, hiddenHalo.hull)) * (hiddenMm * 0.5 + 0.2) * (hiddenMm + 0.3) * 0.9
  if (sides) head += 2 * (4 * Math.PI * 0.4 * 0.4 * (sides.depth + 1.5) + 2)
  if (d.setting.cathedral) head += 4 * Math.PI * 0.55 * 0.55 * 7
  volume += head
  const grams = Object.fromEntries(BAND_METALS.map((m) => [m, round2((volume * DENSITY[m]) / 1000)])) as Record<BandMetal, number>

  const melee = (halo?.carat ?? 0) + (hiddenHalo?.carat ?? 0) + (pave?.carat ?? 0) + (peekaboo?.carat ?? 0) + (surprise?.carat ?? 0)
  const sideCarats = sides ? sides.carat * 2 : 0
  return {
    centre: { length: s.length, width: s.width, depth: s.depth, crown, pavilion, girdle },
    y: { bandTop, culet, girdle: gY, table },
    band: { inner, width, thickness, topWidth },
    prongs: { positions, wire, vTips },
    halo,
    hiddenHalo,
    sides,
    pave,
    peekaboo,
    surprise,
    carats: { centre: d.stone.carat, sides: sideCarats, melee, total: d.stone.carat + sideCarats + melee },
    metal: { volume, grams, headShare: head / volume },
    rise: table - inner,
  }
}

export const DEFAULT_DESIGN: RingDesign = {
  stone: { type: 'diamond', shape: 'round', carat: 1, colour: 'G', clarity: 'VS1', grade: 'extra' },
  setting: { style: 'solitaire', height: 'classic', cathedral: false, sides: 'pear', sideCarat: 0.25 },
  prongs: { count: 4, double: false, tip: 'round', vTips: false, compass: false },
  band: { form: 'classic', stones: 'none', coverage: 'half', width: 2, taper: false },
  metal: { band: 'platinum', head: 'match', finish: 'polished' },
  details: { hiddenHalo: false, peekaboo: false, surprise: false, milgrain: false, engraving: '', font: 'script' },
  size: null,
}

/** A partial design merged into a whole one, section by section. */
export interface DesignPatch {
  stone?: Partial<RingDesign['stone']>
  setting?: Partial<RingDesign['setting']>
  prongs?: Partial<RingDesign['prongs']>
  band?: Partial<RingDesign['band']>
  metal?: Partial<RingDesign['metal']>
  details?: Partial<RingDesign['details']>
  size?: string | null
}

export function patch(d: RingDesign, p: DesignPatch): RingDesign {
  return normalize({
    stone: { ...d.stone, ...p.stone },
    setting: { ...d.setting, ...p.setting },
    prongs: { ...d.prongs, ...p.prongs },
    band: { ...d.band, ...p.band },
    metal: { ...d.metal, ...p.metal },
    details: { ...d.details, ...p.details },
    size: p.size === undefined ? d.size : p.size,
  })
}

/** North American ring sizes, 4 to 9 by halves: the sizes a design can carry. */
export const RING_SIZE_VALUES = Array.from({ length: 11 }, (_, i) => String(4 + i / 2))

/** What the graver can cut: letters (accented too), figures, spaces and a little punctuation. Anything else, an emoji
 *  or half of one included, is left out. */
export const engravable = (text: string) => Array.from(text.replace(/[^\p{L}\p{N} .,'’&\-–·:/+!?“”"«»()♥]/gu, '')).slice(0, ENGRAVING_MAX).join('')

/** Keeps a design buildable: what can't go together is quietly made to (a twist band has no channel, a bezel no claws
 *  nor diamonds under or beside the stone). */
export function normalize(d: RingDesign): RingDesign {
  const out: RingDesign = JSON.parse(JSON.stringify(d))
  out.stone.carat = round2(clamp(out.stone.carat, CARAT.min, CARAT.max))
  out.setting.sideCarat = round2(clamp(out.setting.sideCarat, SIDE_CARAT.min, Math.min(SIDE_CARAT.max, out.stone.carat * 0.6)))
  out.band.width = Math.round(clamp(out.band.width, WIDTH.min, WIDTH.max) * 10) / 10
  if (out.band.form === 'twist' && out.band.stones === 'channel') out.band.stones = 'pave'
  if (out.band.form === 'knife' && out.band.stones === 'channel') out.band.stones = 'pave'
  if (out.prongs.count === 6 && out.prongs.double) out.prongs.double = false
  if (out.setting.style === 'halo') out.details.hiddenHalo = false
  if (out.setting.style === 'bezel') {
    out.details.hiddenHalo = false
    out.details.peekaboo = false
  }
  if (!CUTS[out.stone.shape].points) out.prongs.vTips = false
  if (!['round', 'cushion', 'princess', 'asscher'].includes(out.stone.shape) || (out.stone.shape === 'princess' && out.prongs.vTips)) out.prongs.compass = false
  out.details.engraving = engravable(out.details.engraving)
  if (out.size !== null && !RING_SIZE_VALUES.includes(out.size)) out.size = null
  return out
}

/** The design as it will be made: the choices that don't apply to it (claws under a bezel, side stones without three
 *  stones, how far round on a plain band, lettering without words) set back to their defaults, so rings that are the
 *  same have the same code. The address keeps the visitor's own choices; the bag, visits, the try-on and saved designs
 *  use this. */
export function canonical(d: RingDesign): RingDesign {
  const out = normalize(d)
  const D = DEFAULT_DESIGN
  if (out.setting.style === 'bezel') out.prongs = { ...D.prongs }
  if (out.setting.style !== 'three-stone') {
    out.setting.sides = D.setting.sides
    out.setting.sideCarat = D.setting.sideCarat
  }
  if (out.band.stones === 'none') out.band.coverage = D.band.coverage
  out.details.engraving = out.details.engraving.trim()
  if (!out.details.engraving) out.details.font = D.details.font
  // Normalised once more: a default put back (the side stones' weight, for a small centre stone) must still fit the
  // ring, or the code would not read back as itself and the bag would drop it.
  return normalize(out)
}

// The address form: one compact code, the enums by position, then carats, width, size and the engraving. Once codes sit
// in bags and orders the form is a contract: the lists below only ever grow at their end, and any other change takes a
// new first character (the version, `1` today).
const PICKS = [
  [STONE_TYPES, (d: RingDesign) => d.stone.type],
  [SHAPES, (d: RingDesign) => d.stone.shape],
  [COLOURS, (d: RingDesign) => d.stone.colour],
  [CLARITIES, (d: RingDesign) => d.stone.clarity],
  [GRADES, (d: RingDesign) => d.stone.grade],
  [STYLES, (d: RingDesign) => d.setting.style],
  [HEIGHTS, (d: RingDesign) => d.setting.height],
  [SIDE_SHAPES, (d: RingDesign) => d.setting.sides],
  [TIPS, (d: RingDesign) => d.prongs.tip],
  [FORMS, (d: RingDesign) => d.band.form],
  [BAND_STONES, (d: RingDesign) => d.band.stones],
  [COVERAGES, (d: RingDesign) => d.band.coverage],
  [BAND_METALS, (d: RingDesign) => d.metal.band],
  [HEAD_METALS, (d: RingDesign) => d.metal.head],
  [FINISHES, (d: RingDesign) => d.metal.finish],
  [FONTS, (d: RingDesign) => d.details.font],
] as const
const FLAGS = [
  (d: RingDesign) => d.setting.cathedral,
  (d: RingDesign) => d.prongs.count === 6,
  (d: RingDesign) => d.prongs.double,
  (d: RingDesign) => d.prongs.vTips,
  (d: RingDesign) => d.prongs.compass,
  (d: RingDesign) => d.band.taper,
  (d: RingDesign) => d.details.hiddenHalo,
  (d: RingDesign) => d.details.peekaboo,
  (d: RingDesign) => d.details.surprise,
  (d: RingDesign) => d.details.milgrain,
]

/** A design as a short code for the address and the bag (`1` + enums + flags, then numbers and text). */
export function encodeDesign(d: RingDesign): string {
  const enums = PICKS.map(([list, get]) => (list as readonly string[]).indexOf(get(d)).toString(36)).join('')
  const flags = FLAGS.reduce((n, get, i) => n | (get(d) ? 1 << i : 0), 0).toString(36)
  return ['1' + enums, flags, Math.round(d.stone.carat * 100), Math.round(d.setting.sideCarat * 100), Math.round(d.band.width * 10), d.size ?? '', encodeURIComponent(d.details.engraving)].join('-')
}

// A mistyped or cut-off code must not break the page: text that won't decode is dropped.
const decodeText = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return ''
  }
}

/** The design a code describes, or null when it isn't one; unknown values fall back to the defaults. */
export function decodeDesign(code: unknown): RingDesign | null {
  if (typeof code !== 'string' || code[0] !== '1') return null
  const [head, flagsRaw, carat, side, width, size, ...rest] = code.split('-')
  if (head.length !== PICKS.length + 1) return null
  const at = <T,>(list: readonly T[], i: number, fallback: T) => list[parseInt(head[i + 1], 36)] ?? fallback
  const flags = parseInt(flagsRaw, 36) || 0
  const flag = (i: number) => (flags & (1 << i)) !== 0
  const D = DEFAULT_DESIGN
  return normalize({
    stone: { type: at(STONE_TYPES, 0, D.stone.type), shape: at(SHAPES, 1, D.stone.shape), carat: Number(carat) / 100 || D.stone.carat, colour: at(COLOURS, 2, D.stone.colour), clarity: at(CLARITIES, 3, D.stone.clarity), grade: at(GRADES, 4, D.stone.grade) },
    setting: { style: at(STYLES, 5, D.setting.style), height: at(HEIGHTS, 6, D.setting.height), cathedral: flag(0), sides: at(SIDE_SHAPES, 7, D.setting.sides), sideCarat: Number(side) / 100 || D.setting.sideCarat },
    prongs: { count: flag(1) ? 6 : 4, double: flag(2), tip: at(TIPS, 8, D.prongs.tip), vTips: flag(3), compass: flag(4) },
    band: { form: at(FORMS, 9, D.band.form), stones: at(BAND_STONES, 10, D.band.stones), coverage: at(COVERAGES, 11, D.band.coverage), width: Number(width) / 10 || D.band.width, taper: flag(5) },
    metal: { band: at(BAND_METALS, 12, D.metal.band), head: at(HEAD_METALS, 13, D.metal.head), finish: at(FINISHES, 14, D.metal.finish) },
    details: { hiddenHalo: flag(6), peekaboo: flag(7), surprise: flag(8), milgrain: flag(9), engraving: decodeText(rest.join('-')), font: at(FONTS, 15, D.details.font) },
    size: RING_SIZE_VALUES.includes(size) ? size : null,
  })
}

/** The code of a design as it will be made (`canonical`): what the bag, visits, the try-on and saved designs carry. */
export const designCode = (d: RingDesign) => encodeDesign(canonical(d))

/** Whether a stored value is a whole design code: it decodes, and encodes back to itself. A cut-off, edited or
 *  older-format code is not, so a bag or a saved list never holds a ring that would price or read differently. */
export function isDesignCode(code: unknown): code is string {
  const d = decodeDesign(code)
  return !!d && encodeDesign(d) === code
}

/** The metal the claws and head are made of. */
export const headMetal = (d: RingDesign): BandMetal => (d.metal.head === 'match' ? d.metal.band : d.metal.head)

/** House designs to begin from: the catalog's engagement rings, as the designer would build them. */
export const PRESETS: { id: string; slug?: string; design: RingDesign }[] = [
  { id: 'bonsecours', slug: 'bonsecours-round-solitaire', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'diamond', shape: 'round', carat: 1.51, colour: 'F', clarity: 'VS1', grade: 'extra' }, prongs: { count: 6, double: false, tip: 'round', vTips: false, compass: false }, band: { form: 'classic', stones: 'none', coverage: 'half', width: 2, taper: true } }) },
  { id: 'notre-dame', slug: 'notre-dame-oval-solitaire', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'diamond', shape: 'oval', carat: 1.82, colour: 'E', clarity: 'VS1', grade: 'extra' }, setting: { style: 'solitaire', height: 'classic', cathedral: true, sides: 'pear', sideCarat: 0.25 }, prongs: { count: 4, double: false, tip: 'eagle', vTips: false, compass: false }, band: { form: 'knife', stones: 'none', coverage: 'half', width: 1.8, taper: false }, details: { ...DEFAULT_DESIGN.details, hiddenHalo: true } }) },
  { id: 'ville-marie', slug: 'ville-marie-cushion', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'diamond', shape: 'cushion', carat: 2.03, colour: 'G', clarity: 'VS2', grade: 'extra' }, prongs: { count: 4, double: true, tip: 'round', vTips: false, compass: false }, band: { form: 'classic', stones: 'pave', coverage: 'half', width: 1.9, taper: false }, details: { ...DEFAULT_DESIGN.details, hiddenHalo: true } }) },
  { id: 'basilique', slug: 'basilique-emerald-cut-three-stone', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'diamond', shape: 'emerald', carat: 2.01, colour: 'F', clarity: 'VVS2', grade: 'extra' }, setting: { style: 'three-stone', height: 'classic', cathedral: false, sides: 'baguette', sideCarat: 0.24 }, prongs: { count: 4, double: false, tip: 'tab', vTips: false, compass: false }, band: { form: 'classic', stones: 'none', coverage: 'half', width: 2.2, taper: false } }) },
  { id: 'maisonneuve', slug: 'maisonneuve-radiant-solitaire', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'diamond', shape: 'radiant', carat: 1.7, colour: 'E', clarity: 'VS2', grade: 'extra' }, band: { form: 'classic', stones: 'pave', coverage: 'three-quarter', width: 1.8, taper: false }, metal: { band: '18k-yellow', head: 'platinum', finish: 'polished' } }) },
  { id: 'sherbrooke', design: normalize({ ...DEFAULT_DESIGN, stone: { type: 'sapphire', shape: 'oval', carat: 1.6, colour: 'G', clarity: 'VS1', grade: 'exceptional' }, setting: { style: 'halo', height: 'classic', cathedral: false, sides: 'pear', sideCarat: 0.25 }, band: { form: 'split', stones: 'pave', coverage: 'half', width: 2, taper: false }, metal: { band: '18k-yellow', head: 'match', finish: 'polished' }, details: { ...DEFAULT_DESIGN.details, milgrain: true } }) },
]

/** A tasteful design picked at random: a shape, a setting and a band that suit each other. */
export function surprise(random: () => number = Math.random): RingDesign {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]
  const shape = pick(SHAPES)
  const style = pick(['solitaire', 'solitaire', 'halo', 'three-stone', 'bezel'] as const)
  const step = CUTS[shape].step
  return normalize({
    stone: { type: random() < 0.82 ? 'diamond' : pick(['sapphire', 'ruby', 'emerald'] as const), shape, carat: pick([0.9, 1, 1.2, 1.5, 1.7, 2]), colour: pick(['D', 'E', 'F', 'G', 'H'] as const), clarity: step ? pick(['VVS1', 'VVS2', 'VS1'] as const) : pick(['VVS2', 'VS1', 'VS2'] as const), grade: 'extra' },
    setting: { style, height: 'classic', cathedral: random() < 0.3, sides: step ? 'baguette' : pick(['round', 'pear'] as const), sideCarat: pick([0.2, 0.3, 0.4]) },
    prongs: { count: shape === 'round' && random() < 0.5 ? 6 : 4, double: random() < 0.2, tip: step ? 'tab' : pick(['round', 'eagle'] as const), vTips: CUTS[shape].points > 0, compass: false },
    band: { form: pick(['classic', 'classic', 'knife', 'split', 'twist'] as const), stones: pick(['none', 'pave', 'pave', 'channel'] as const), coverage: pick(['half', 'three-quarter'] as const), width: pick([1.8, 2, 2.2]), taper: random() < 0.4 },
    metal: { band: pick(BAND_METALS), head: 'match', finish: 'polished' },
    details: { hiddenHalo: style !== 'halo' && random() < 0.4, peekaboo: random() < 0.25, surprise: random() < 0.2, milgrain: random() < 0.2, engraving: '', font: 'script' },
    size: null,
  })
}
