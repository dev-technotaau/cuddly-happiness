// Faceted gem geometry, computed rather than modelled: each cut's girdle outline, then a brilliant's facets (table,
// stars, kites, upper and lower girdle facets, pavilion mains) or a step cut's terraces laid over it. Flat-shaded, so
// every facet catches light on its own. Millimetres; the table faces +Y, the length runs along +Z.
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { CUTS, type Shape } from '../../../data/ring'
import { outlineOf, radiusAt, type Pt } from '../outline'

interface Proportions {
  /** Table width ÷ girdle width, crown and pavilion heights and the girdle's thickness, all ÷ the stone's width. */
  table: number
  crown: number
  pavilion: number
  girdle: number
}

const BRILLIANT: Proportions = { table: 0.56, crown: 0.15, pavilion: 0.43, girdle: 0.03 }
const STEP: Proportions = { table: 0.62, crown: 0.11, pavilion: 0.52, girdle: 0.03 }

class Faces {
  readonly v: number[] = []
  constructor(private readonly centreY: number) {}
  // Each triangle faces away from the stone's axis.
  tri(a: Vector3, b: Vector3, c: Vector3) {
    const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a))
    const mid = new Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3)
    const out = new Vector3(mid.x, mid.y - this.centreY, mid.z)
    if (n.dot(out) < 0) [b, c] = [c, b]
    this.v.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
  }
  quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
    this.tri(a, b, c)
    this.tri(a, c, d)
  }
  geometry() {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.v, 3))
    g.setIndex([...Array(this.v.length / 3).keys()])
    g.computeVertexNormals()
    return g
  }
}

/** A brilliant-cut stone of this outline: 8 mains, `sub` girdle points per main. The girdle sits at y = 0. */
function brilliant(shape: Shape, width: number, ratio: number, depth: number, sub: number): BufferGeometry {
  const outline = outlineOf(shape, ratio)
  const M = 8
  const G = M * sub
  const p: Proportions = { ...BRILLIANT, pavilion: Math.max(0.3, depth - BRILLIANT.crown - BRILLIANT.girdle) }
  const gh = (p.girdle * width) / 2
  const crownH = p.crown * width
  const pavH = p.pavilion * width
  // A point at relative radius ρ on the crown or pavilion slope, in direction φ.
  const at = (phi: number, rho: number, crown: boolean) => {
    const r = radiusAt(outline, phi) * width * rho
    const y = crown ? gh + crownH * Math.min(1, (1 - rho) / (1 - p.table)) : -gh - pavH * (1 - rho)
    return new Vector3(r * Math.sin(phi), y, r * Math.cos(phi))
  }
  const faces = new Faces(0)
  const gt = [...Array(G).keys()].map((j) => at((j / G) * Math.PI * 2, 1, true).setY(gh))
  const gb = [...Array(G).keys()].map((j) => at((j / G) * Math.PI * 2, 1, false).setY(-gh))
  const table = [...Array(M).keys()].map((k) => at((k / M) * Math.PI * 2, p.table, true))
  const star = [...Array(M).keys()].map((k) => at(((k + 0.5) / M) * Math.PI * 2, (p.table + 1) / 2, true))
  const lower = [...Array(M).keys()].map((k) => at(((k + 0.5) / M) * Math.PI * 2, 0.24, false))
  const culet = new Vector3(0, -gh - pavH, 0)
  const top = new Vector3(0, gh + crownH, 0)
  for (let k = 0; k < M; k++) {
    const k1 = (k + 1) % M
    const k0 = (k - 1 + M) % M
    faces.tri(top, table[k], table[k1])
    faces.tri(table[k], table[k1], star[k])
    faces.quad(table[k], star[k0], gt[k * sub], star[k])
    for (let i = 0; i < sub; i++) faces.tri(star[k], gt[(k * sub + i) % G], gt[(k * sub + i + 1) % G])
    faces.quad(culet, lower[k0], gb[k * sub], lower[k])
    for (let i = 0; i < sub; i++) faces.tri(lower[k], gb[(k * sub + i) % G], gb[(k * sub + i + 1) % G])
  }
  for (let j = 0; j < G; j++) faces.quad(gt[j], gt[(j + 1) % G], gb[(j + 1) % G], gb[j])
  return faces.geometry()
}

/** A step-cut stone (emerald, Asscher, baguette): terraces on the crown, more below, down to a keel. */
function stepCut(shape: Shape, width: number, ratio: number, depth: number): BufferGeometry {
  const k = (shape === 'asscher' ? 0.34 : 0.26) * Math.min(0.5, ratio / 2)
  const a = 0.5
  const b = ratio / 2
  const corners: Pt[] = [[a - k, b], [a, b - k], [a, -b + k], [a - k, -b], [-a + k, -b], [-a, -b + k], [-a, b - k], [-a + k, b]].map(([x, z]) => [x * width, z * width] as Pt)
  const p: Proportions = { ...STEP, pavilion: Math.max(0.36, depth - STEP.crown - STEP.girdle) }
  const gh = (p.girdle * width) / 2
  const crownH = p.crown * width
  const pavH = p.pavilion * width
  const keel = shape === 'asscher' ? 0 : ((ratio - 1) / 2) * width
  const faces = new Faces(0)
  // Crown terraces from the girdle in to the table.
  const crownSteps = [1, 0.87, 0.74, p.table]
  const crown = crownSteps.map((s, i) => corners.map(([x, z]) => new Vector3(x * s, gh + (crownH * i) / (crownSteps.length - 1), z * s)))
  // Pavilion terraces down to the keel: across shrinks to nothing, along to the keel's length.
  const pavSteps = [0, 0.28, 0.56, 0.8, 1]
  const pav = pavSteps.map((t) => corners.map(([x, z]) => new Vector3(x * (1 - t), -gh - pavH * t, z * (1 - t) + Math.sign(z) * Math.min(Math.abs(z), keel) * t)))
  const ring = (r: Vector3[], s: Vector3[]) => {
    for (let i = 0; i < 8; i++) faces.quad(r[i], r[(i + 1) % 8], s[(i + 1) % 8], s[i])
  }
  for (let i = 0; i < crown.length - 1; i++) ring(crown[i], crown[i + 1])
  const tableCentre = new Vector3(0, gh + crownH, 0)
  const last = crown[crown.length - 1]
  for (let i = 0; i < 8; i++) faces.tri(tableCentre, last[i], last[(i + 1) % 8])
  const gb = corners.map(([x, z]) => new Vector3(x, -gh, z))
  ring(crown[0].map((v) => v.clone().setY(gh)), gb)
  for (let i = 0; i < pav.length - 1; i++) ring(pav[i], pav[i + 1])
  return faces.geometry()
}

/** A stone's geometry for a shape and size (mm), girdle at y = 0. `sub` refines a brilliant's girdle. */
export function gemGeometry(shape: Shape, width: number, ratio = CUTS[shape].ratio, sub = 4): BufferGeometry {
  const depth = CUTS[shape].depth
  return CUTS[shape].step ? stepCut(shape, width, ratio, depth) : brilliant(shape, width, ratio, depth, sub)
}

/** Heights of a stone of this width: crown above the girdle, pavilion below. */
export function gemHeights(shape: Shape, width: number) {
  const step = CUTS[shape].step
  const p = step ? STEP : BRILLIANT
  const pavilion = Math.max(step ? 0.36 : 0.3, CUTS[shape].depth - p.crown - p.girdle) * width
  return { crown: p.crown * width, pavilion, girdle: p.girdle * width }
}
