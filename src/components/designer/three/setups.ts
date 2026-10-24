// Where the ring is shown. The studio: a seamless travertine floor, the ring standing on its band as jewellers
// photograph it, its shadow traced on the floor (raytrace.ts; drawn stand-ins until it is baked). The salon: an open box on lacquered walnut, the ring held in a velvet slit under a
// satin lid with the maison's name. The hand: a porcelain display hand, made here from a smooth distance field, its
// ring finger sized to the ring.
import { CanvasTexture, CircleGeometry, Color, CylinderGeometry, Group, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, NoColorSpace, PlaneGeometry, SRGBColorSpace, Vector3, BufferGeometry, Float32BufferAttribute, type Texture } from 'three'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Layout } from '../../../data/ring'
import type { LightPreset } from './lighting'
import { leather, porcelain, satin, textTexture, velvet } from './materials'

export type SetupId = 'studio' | 'salon' | 'hand'
export const SETUPS: SetupId[] = ['studio', 'salon', 'hand']
/** The light each setup is best seen in. */
export const SETUP_LIGHT: Record<SetupId, LightPreset> = { studio: 'studio', salon: 'salon', hand: 'daylight' }

export interface Setup {
  group: Group
  /** Where the ring sits in the setup. */
  ringAt: Matrix4
  /** What the camera looks at and from how far by default. */
  target: Vector3
  distance: number
  /** The direction the camera starts from. */
  from: Vector3
  background: Texture
  light: LightPreset
  /** Lowest the camera may look from (radians from straight down). */
  maxPolar: number
  /** The floor under the ring, which takes its traced shadow. */
  ground?: Mesh
  /** Drawn shadows standing in until the traced one is baked. */
  stand?: Mesh[]
}

// Colour textures are sRGB; masks (alpha maps) are linear, so their gradients fall off as drawn.
const canvasTexture = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512, mask = false) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!, w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = mask ? NoColorSpace : SRGBColorSpace
  return t
}

/** A round mask: opaque in the middle, fading out from `from` (a share of the radius) to the rim. */
const radialMask = (from: number, size = 256) =>
  canvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(from, '#ffffff')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }, size, size, true)

const backdrop = (top: string, bottom: string, glow?: string) =>
  canvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, top)
    g.addColorStop(1, bottom)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    if (glow) {
      const r = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, w * 0.6)
      r.addColorStop(0, glow)
      r.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = r
      ctx.fillRect(0, 0, w, h)
    }
  })

/** A soft round shadow, dark at the centre. */
const shadow = (opacity: number) =>
  new MeshBasicMaterial({
    color: new Color('#000000'),
    transparent: true,
    depthWrite: false,
    opacity,
    alphaMap: canvasTexture((ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.3, '#8c8c8c')
      g.addColorStop(0.65, '#262626')
      g.addColorStop(1, '#000000')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }, 128, 128, true),
  })

/** The ring's outer radius, which is how far it stands above whatever it rests on. */
const outer = (L: Layout) => L.band.inner + L.band.thickness

function studio(L: Layout): Setup {
  const group = new Group()
  const floor = new Mesh(new CircleGeometry(160, 64), new MeshPhysicalNodeMaterial({ color: new Color('#ece6db'), roughness: 0.9, transparent: true, alphaMap: radialMask(0.55), depthWrite: false }))
  floor.rotation.x = -Math.PI / 2
  // Drawn first, so the shadows (transparent too) always lie on it.
  floor.renderOrder = -1
  group.add(floor)
  // The shadows lie along the band where it meets the floor: a dark touch, and a soft pool under the whole ring.
  const turn = -0.42
  const shadows = new Group()
  shadows.rotation.y = turn
  const contact = new Mesh(new PlaneGeometry(1, 1), shadow(0.6))
  contact.rotation.x = -Math.PI / 2
  contact.position.y = 0.04
  contact.scale.set(outer(L) * 1.1, L.band.width * 2.4, 1)
  const pool = new Mesh(new PlaneGeometry(1, 1), shadow(0.16))
  pool.rotation.x = -Math.PI / 2
  pool.position.y = 0.03
  pool.scale.set(outer(L) * 2.6, outer(L) * 1.3, 1)
  shadows.add(contact, pool)
  group.add(shadows)
  const ringAt = new Matrix4().makeRotationY(turn).setPosition(0, outer(L), 0)
  return { group, ringAt, target: new Vector3(0, outer(L) + 3, 0), distance: 74, from: new Vector3(0.55, 0.36, 0.76).normalize(), background: backdrop('#f6f2ea', '#e5ddd0'), light: 'studio', maxPolar: Math.PI / 2 - 0.04, ground: floor, stand: [contact, pool] }
}

function salon(L: Layout): Setup {
  const group = new Group()
  // A lacquered walnut table, fading into the room's dusk at its edge.
  const table = new Mesh(new CircleGeometry(220, 64), new MeshPhysicalMaterial({ color: new Color('#33200f'), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.32, transparent: true, alphaMap: radialMask(0.35), depthWrite: false }))
  table.rotation.x = -Math.PI / 2
  table.renderOrder = -1
  group.add(table)
  const under = new Mesh(new PlaneGeometry(1, 1), shadow(0.55))
  under.rotation.x = -Math.PI / 2
  under.position.y = 0.05
  under.scale.set(78, 66, 1)
  group.add(under)
  // The box: ivory leather outside, black velvet rolls, a satin lid with the maison's name.
  const W = 50
  const H = 20
  const D = 42
  const base = new Mesh(new RoundedBoxGeometry(W, H, D, 5, 3), leather('#ece4d6'))
  base.position.y = H / 2
  group.add(base)
  const well = new Mesh(new RoundedBoxGeometry(W - 5, 3, D - 5, 3, 1.4), velvet('#141110'))
  well.position.y = H - 0.4
  group.add(well)
  const slit = Math.max(1.3, L.band.width / 2 + 0.25)
  const rollR = 9.5
  for (const s of [1, -1]) {
    const roll = new Mesh(new CylinderGeometry(rollR, rollR, W - 7, 40, 1), velvet('#151210'))
    roll.rotation.z = Math.PI / 2
    roll.position.set(0, H - 2.2 + rollR * 0.45, s * (rollR + slit))
    group.add(roll)
  }
  const lid = new Group()
  lid.position.set(0, H, -D / 2)
  lid.rotation.x = -1.92
  const lidBox = new Mesh(new RoundedBoxGeometry(W, 6, D, 5, 3), leather('#ece4d6'))
  lidBox.position.set(0, 3, D / 2)
  lid.add(lidBox)
  const lining = new Mesh(new PlaneGeometry(W - 5, D - 5), satin())
  ;(lining.material as MeshPhysicalNodeMaterial).map = textTexture('TERESA & SONS', "500 74px 'Baskervville', serif", 1024, 820, { color: '#a8875a', background: '#f3ece0', tracking: 22 })
  lining.rotation.x = Math.PI / 2
  lining.position.set(0, -0.05, D / 2)
  lid.add(lining)
  group.add(lid)
  const cushionTop = H - 2.2 + rollR * 1.45
  const ringAt = new Matrix4().setPosition(0, cushionTop + outer(L) * 0.5, 0)
  return { group, ringAt, target: new Vector3(0, cushionTop + outer(L) * 0.75, 0), distance: 128, from: new Vector3(0.18, 0.42, 0.89).normalize(), background: backdrop('#1d1612', '#0b0807', 'rgba(120,84,48,0.35)'), light: 'salon', maxPolar: Math.PI / 2 - 0.08 }
}

// ─── The display hand ───────────────────────────────────────────────────────────────────────────────────────────────

type V3 = [number, number, number]
interface Finger {
  base: V3
  length: number
  radius: [number, number]
  splay: number
  curl: number
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = (a: V3) => Math.sqrt(dot(a, a))

/** A tapered capsule's distance (good enough to polygonise). */
function cone(p: V3, a: V3, b: V3, ra: number, rb: number) {
  const pa = sub(p, a)
  const ba = sub(b, a)
  const t = Math.min(1, Math.max(0, dot(pa, ba) / dot(ba, ba)))
  return len([pa[0] - ba[0] * t, pa[1] - ba[1] * t, pa[2] - ba[2] * t]) - (ra + (rb - ra) * t)
}

function roundBox(p: V3, c: V3, h: V3, r: number) {
  const q: V3 = [Math.abs(p[0] - c[0]) - h[0] + r, Math.abs(p[1] - c[1]) - h[1] + r, Math.abs(p[2] - c[2]) - h[2] + r]
  return len([Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)]) + Math.min(Math.max(q[0], q[1], q[2]), 0) - r
}

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

/** A finger's joints, from the knuckle up, each segment bending a little towards the palm. */
function joints(f: Finger): V3[] {
  const parts = [0.46, 0.3, 0.24]
  const pts: V3[] = [f.base]
  let dir: V3 = [Math.sin(f.splay), Math.cos(f.splay), 0]
  let p = f.base
  parts.forEach((k, i) => {
    const a = f.curl * (i + 1)
    dir = [Math.sin(f.splay) * Math.cos(a), Math.cos(f.splay) * Math.cos(a), -Math.sin(a)]
    p = [p[0] + dir[0] * f.length * k, p[1] + dir[1] * f.length * k, p[2] + dir[2] * f.length * k]
    pts.push(p)
  })
  return pts
}

/** The hand's fingers: index, middle, ring (sized to the ring), little. Seen from the back, the thumb is on the right. */
function fingersFor(ringRadius: number): Finger[] {
  return [
    { base: [24.5, -1, 0], length: 72, radius: [8.3, 6.8], splay: -0.13, curl: 0.1 },
    { base: [7, 1.5, 0.5], length: 79, radius: [8.6, 7], splay: -0.035, curl: 0.09 },
    { base: [-10.5, 0, 0.5], length: 74, radius: [ringRadius, ringRadius * 0.84], splay: 0.065, curl: 0.1 },
    { base: [-27, -5, 0], length: 58, radius: [7.2, 5.9], splay: 0.2, curl: 0.12 },
  ]
}

function handDistance(p: V3, fingers: Finger[], bones: V3[][]): number {
  // The wrist, a little wider than deep, cut flat at the base, flowing into the palm.
  const wp: V3 = [(p[0] + 3) / 1.22, p[1], p[2] / 0.92]
  const palm = smin(roundBox(p, [-2.5, -40, -1.5], [32, 42, 11.5], 10), cone(wp, [0, -70, -1], [0, -130, -1], 19, 20), 12)
  // Each finger flows into the palm, but not into its neighbours: they stay fingers, not a mitten.
  let d = palm
  for (let n = 0; n < fingers.length; n++) {
    const f = fingers[n]
    const j = bones[n]
    const [r0, r1] = f.radius
    let fd = Infinity
    for (let i = 0; i < 3; i++) {
      const a = r0 + ((r1 - r0) * i) / 3
      const b = r0 + ((r1 - r0) * (i + 1)) / 3
      fd = smin(fd, cone(p, j[i], j[i + 1], a, b), 2.2)
    }
    // A knuckle on the back.
    fd = smin(fd, len(sub(p, [f.base[0], f.base[1] - 2, f.base[2] + 2.5])) - r0 * 1.02, 3)
    d = Math.min(d, smin(palm, fd, 6))
  }
  // The thumb, reaching up and forward from the base of the palm.
  const thumb: V3[] = [[30, -60, -4], [45, -36, 2], [55, -14, 7], [59, 7, 9]]
  const tr = [11.5, 10, 8.8, 7.6]
  let td = Infinity
  for (let i = 0; i < 3; i++) td = smin(td, cone(p, thumb[i], thumb[i + 1], tr[i], tr[i + 1]), 2.5)
  d = Math.min(d, smin(palm, td, 9))
  return Math.max(d, -(p[1] + 124))
}

const handCache = new Map<string, BufferGeometry>()

/** The porcelain hand for a ring radius: a distance field polygonised once per size. */
function handGeometry(ringRadius: number): BufferGeometry {
  const key = ringRadius.toFixed(2)
  const hit = handCache.get(key)
  if (hit) return hit
  const fingers = fingersFor(ringRadius)
  const bones = fingers.map(joints)
  const res = 112
  const half = 108
  const centre: V3 = [10, -18, -1]
  const mc = new MarchingCubes(res, new MeshBasicMaterial(), false, false, 160000)
  mc.isolation = 0
  const field = mc.field as Float32Array
  field.fill(-10)
  const toWorld = (i: number) => (i / res) * 2 * half - half
  for (let z = 0; z < res; z++) {
    const wz = toWorld(z) + centre[2]
    if (wz < -28 || wz > 26) continue
    for (let y = 0; y < res; y++) {
      const wy = toWorld(y) + centre[1]
      if (wy < -126 || wy > 92) continue
      for (let x = 0; x < res; x++) {
        const wx = toWorld(x) + centre[0]
        if (wx < -56 || wx > 76) continue
        field[z * res * res + y * res + x] = -handDistance([wx, wy, wz], fingers, bones)
      }
    }
  }
  mc.update()
  const src = mc.geometry
  const count = (mc as unknown as { count: number }).count
  const pos = src.getAttribute('position').array as Float32Array
  const nor = src.getAttribute('normal').array as Float32Array
  const out = new Float32Array(count * 3)
  const norm = new Float32Array(count * 3)
  // MarchingCubes works in a unit cube; place it back in millimetres.
  for (let i = 0; i < count * 3; i += 3) {
    out[i] = pos[i] * half + centre[0]
    out[i + 1] = pos[i + 1] * half + centre[1]
    out[i + 2] = pos[i + 2] * half + centre[2]
    norm[i] = nor[i]
    norm[i + 1] = nor[i + 1]
    norm[i + 2] = nor[i + 2]
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(out, 3))
  g.setAttribute('normal', new Float32BufferAttribute(norm, 3))
  src.dispose()
  handCache.set(key, g)
  return g
}

function hand(L: Layout): Setup {
  const group = new Group()
  const ringRadius = L.band.inner - 0.3
  const fingers = fingersFor(ringRadius)
  const mesh = new Mesh(handGeometry(ringRadius), porcelain())
  // The hand stands on a travertine plinth.
  const plinth = new Mesh(new CylinderGeometry(34, 36, 12, 64), new MeshPhysicalMaterial({ color: new Color('#e9e2d6'), roughness: 0.55, clearcoat: 0.2 }))
  plinth.position.set(-2, -130, -1)
  const lift = new Group()
  lift.add(mesh, plinth)
  lift.position.y = 136
  group.add(lift)
  const under = new Mesh(new PlaneGeometry(1, 1), shadow(0.3))
  under.rotation.x = -Math.PI / 2
  under.position.y = 0.05
  under.scale.set(110, 110, 1)
  group.add(under)
  // The ring sits on the ring finger, a little above the knuckle, its stone towards the back of the hand.
  const j = joints(fingers[2])
  const a = new Vector3(...j[0])
  const b = new Vector3(...j[1])
  const along = b.clone().sub(a).normalize()
  const at = a.clone().lerp(b, 0.44).add(new Vector3(0, 136, 0))
  const back = new Vector3(0, 0, 1)
  const up = back.clone().sub(along.clone().multiplyScalar(back.dot(along))).normalize()
  const side = new Vector3().crossVectors(up, along)
  const ringAt = new Matrix4().makeBasis(side, up, along).setPosition(at)
  return { group, ringAt, target: at.clone().add(new Vector3(0, 6, 0)), distance: 126, from: new Vector3(0.22, 0.2, 0.95).normalize(), background: backdrop('#ece6dc', '#d6cdc0'), light: 'daylight', maxPolar: Math.PI * 0.62 }
}

/** Builds a setup around a ring of this layout. */
export function buildSetup(id: SetupId, L: Layout): Setup {
  return id === 'salon' ? salon(L) : id === 'hand' ? hand(L) : studio(L)
}
