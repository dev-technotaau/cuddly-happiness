// What the ring is made of, on screen. Metals are physically based, tuned to how jewellers photograph them, and see the
// ring itself in their reflections (traced after the scene is drawn, raytrace.ts); the stones are traced in their own
// facets (gemMaterial.ts). The setups' velvet, satin, leather and porcelain are here too.
import { CanvasTexture, Color, DataTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalNodeMaterial, RGBAFormat, RepeatWrapping, SRGBColorSpace, UnsignedByteType, type TextureNode } from 'three/webgpu'
import { Fn, clamp, diffuseColor, dot, exp2, float, materialEnvIntensity, materialOpacity, max, min, mrt, normalMap, normalView, normalWorld, positionViewDirection, reference, roughness, sqrt, texture, uv, vec2, vec3, vec4 } from 'three/tsl'
import type { BandMetal, Finish } from '../../../data/ring'
import type { RingTracer } from './raytrace'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any

/** Each metal's base colour (sRGB) and how it holds a polish. */
export const METAL_LOOK: Record<BandMetal, { color: string; roughness: number }> = {
  platinum: { color: '#d9d8d4', roughness: 0.1 },
  '18k-white': { color: '#ecebe7', roughness: 0.08 },
  '18k-yellow': { color: '#f1c66a', roughness: 0.09 },
  '18k-rose': { color: '#efb59a', roughness: 0.09 },
}

const FINISH_ROUGHNESS: Record<Finish, number> = { polished: 0, satin: 0.24, hammered: 0.03 }

let hammerMap: CanvasTexture | null = null

/** A hammered surface: overlapping dimples, as a normal map. Made once. */
function hammered(): CanvasTexture {
  if (hammerMap) return hammerMap
  const size = 256
  const height = new Float32Array(size * size)
  let seed = 7
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let n = 0; n < 220; n++) {
    const cx = random() * size
    const cy = random() * size
    const r = 9 + random() * 16
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y) / r
        if (d > 1) continue
        const px = (Math.round(cx + x) + size) % size
        const py = (Math.round(cy + y) + size) % size
        height[py * size + px] = Math.min(height[py * size + px], -(1 - d * d))
      }
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * 2.2
      const dy = (h(x, y + 1) - h(x, y - 1)) * 2.2
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  hammerMap = new CanvasTexture(canvas)
  hammerMap.wrapS = hammerMap.wrapT = RepeatWrapping
  hammerMap.repeat.set(1, 1)
  return hammerMap
}

/** A metal that writes, beside its colour, what the tracing pass needs (raytrace.ts, `reflect`): the normal its
 *  reflection turns on and its roughness (`rtNormal`), and how much of the room's light it passes at this angle
 *  (`rtSpec`: its colour through the split-sum's analytic fit, Karis 2014, as three weighs the room). Its own light
 *  is three's, unchanged. */
export class MetalMaterial extends MeshPhysicalNodeMaterial {
  /** Whether its reflections are traced. */
  traced = false
}

const tracedOutputs = Fn(() => {
  const nv = clamp(dot(normalView, positionViewDirection), 0, 1)
  const r = roughness.mul(vec4(-1, -0.0275, -0.572, 0.022)).add(vec4(1, 0.0425, 1.04, -0.04))
  const a004 = min(r.x.mul(r.x), exp2(nv.mul(-9.28))).mul(r.x).add(r.y)
  const ab = vec2(-1.04, 1.04).mul(a004).add(r.zw)
  const spec = diffuseColor.rgb.mul(ab.x).add(ab.y).mul(materialEnvIntensity)
  return vec4(spec, 1)
})

/** A metal with a finish, its reflections traced against the ring when given its `tracer`. Colours tween in place when the metal
 *  changes, so materials are reused. */
export function metalMaterial(metal: BandMetal, finish: Finish = 'polished', tracer: RingTracer | null = null): MetalMaterial {
  const look = METAL_LOOK[metal]
  const m = new MetalMaterial({ color: new Color(look.color), metalness: 1, roughness: look.roughness + FINISH_ROUGHNESS[finish], envMapIntensity: 1.15, specularIntensity: 1 })
  if (tracer) {
    m.traced = true
    m.mrtNode = mrt({ rtNormal: vec4(normalWorld, roughness), rtSpec: tracedOutputs() })
  }
  if (finish === 'hammered') {
    m.normalMap = hammered()
    m.normalScale.set(0.55, 0.55)
  }
  if (finish === 'satin') {
    m.anisotropy = 0.6
  }
  return m
}

/** Repaints a metal for another alloy or finish (the colour is tweened by the caller). */
export function retintMetal(m: MetalMaterial, metal: BandMetal, finish: Finish) {
  m.roughness = METAL_LOOK[metal].roughness + FINISH_ROUGHNESS[finish]
  m.normalMap = finish === 'hammered' ? hammered() : null
  m.anisotropy = finish === 'satin' ? 0.6 : 0
  m.needsUpdate = true
}

/** A box blur of a field, along x then y (`r` texels each way, held at the edges), as running sums. */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const n = r * 2 + 1
  for (let y = 0; y < h; y++) {
    const row = y * w
    let s = 0
    for (let k = -r; k <= r; k++) s += src[row + Math.min(w - 1, Math.max(0, k))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = s / n
      s += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0
    for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, k)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

/** An engraving's typeface: the CSS before the size and the family after it, its size and tracking (in ems). */
export interface Lettering {
  style: string
  family: string
  size: number
  tracking: number
}

/** How deep a graver cuts the inside of a band (mm): a fine line's depth. */
const CUT_DEPTH = 0.03
/** The map's height (texels), across the band. */
const CUT_TEXELS = 192

/** Lettering as a graver cuts it, for the band's inside, in one texture: red and green, how the cut's walls tilt (128
 *  is level; each stroke a groove sloping in from both sides, as a V-cut does, as steep as its depth makes it); alpha,
 *  how deep it is. Drawn to the scale of `across` (mm, the texture's height on the band), so the letters keep their
 *  proportions, and smaller when they would run longer than `most` (mm). Returns the map and its `length` (mm). */
export function engravingMap(text: string, face: Lettering, across: number, most: number): { map: DataTexture; length: number } {
  const H = CUT_TEXELS
  const mm = across / H
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const pad = Math.round(H * 0.15)
  const set = (px: number) => {
    ctx.font = `${face.style}${px.toFixed(1)}px ${face.family}`
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(face.tracking * px).toFixed(2)}px`
    return ctx.measureText(text)
  }
  // The face's size, unless its ink would leave the band's middle or run too far round it.
  let px = H * face.size
  let ink = set(px)
  const tall = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent
  const long = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight
  px *= Math.min(1, (H * 0.86) / Math.max(1, tall), (most / mm - pad * 2) / Math.max(1, long))
  canvas.width = Math.min(4096, Math.ceil((long * px) / (H * face.size) + pad * 2))
  canvas.height = H
  const W = canvas.width
  ink = set(px)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const left = ink.actualBoundingBoxLeft
  const width = left + ink.actualBoundingBoxRight
  ctx.fillText(text, (W - width) / 2 + left, H / 2 + (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2)
  const src = ctx.getImageData(0, 0, W, H).data
  let depth: Float32Array = new Float32Array(W * H)
  for (let i = 0; i < depth.length; i++) depth[i] = src[i * 4] / 255
  // Softened twice: each stroke's walls slope in over a few texels, as a V-cut's do, instead of dropping as a step.
  depth = boxBlur(boxBlur(depth, W, H, 2), W, H, 2)
  const at = (x: number, y: number) => depth[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))]
  // The surface sinks by CUT_DEPTH at full depth: its slope, per texel of depth's change.
  const steep = CUT_DEPTH / mm
  const data = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // The canvas runs down where the texture's v runs up: its rows are stored the other way.
      const i = ((H - 1 - y) * W + x) * 4
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1
      const d = edge ? 0 : depth[y * W + x]
      const nx = edge ? 0 : steep * ((at(x + 1, y) - at(x - 1, y)) / 2)
      const ny = edge ? 0 : -steep * ((at(x, y + 1) - at(x, y - 1)) / 2)
      const len = Math.hypot(nx, ny, 1)
      data[i] = Math.round(128 + (127 * nx) / len)
      data[i + 1] = Math.round(128 + (127 * ny) / len)
      data[i + 2] = 255
      data[i + 3] = Math.round(255 * Math.min(1, d))
    }
  }
  const map = new DataTexture(data, W, H, RGBAFormat, UnsignedByteType)
  map.magFilter = LinearFilter
  map.minFilter = LinearMipmapLinearFilter
  map.generateMipmaps = true
  map.anisotropy = 8
  map.needsUpdate = true
  return { map, length: W * mm }
}

/** Lettering cut into the band's inside, from `engravingMap`: the band's own metal, its colour and polish as they
 *  change, each stroke a groove whose walls turn the light (and its traced reflections) as a cut does, its floor shaded
 *  and a touch less bright. Only the cut is drawn, on a copy of the band's surface, so the band shows everywhere else.
 *  Its opacity sweeps it in along the lettering, as the graver goes. */
export function engravingMaterial(band: MetalMaterial, map: DataTexture, tracer: RingTracer | null): MetalMaterial {
  const m = new MetalMaterial({ metalness: 1, envMapIntensity: band.envMapIntensity, specularIntensity: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
  m.color = band.color
  m.anisotropy = band.anisotropy
  const cut = texture(map)
  const depth = cut.a
  const tilt = cut.rg.mul(255).sub(128).div(127)
  m.normalNode = normalMap(vec3(tilt, sqrt(max(float(0), float(1).sub(dot(tilt, tilt))))).mul(0.5).add(0.5))
  m.roughnessNode = min(reference('roughness', 'float', band).add(depth.mul(0.08)), 1)
  const occlusion = float(1).sub(depth.mul(0.5))
  m.aoNode = occlusion
  // Swept in along the lettering by its opacity (0 → 1), each stroke from its deepest line outward.
  m.opacityNode = depth.mul(clamp(materialOpacity.mul(1.08).sub(uv().x).div(0.08), 0, 1))
  m.alphaTest = 0.002
  if (tracer) {
    m.traced = true
    m.mrtNode = mrt({ rtNormal: vec4(normalWorld, roughness), rtSpec: tracedOutputs().mul(vec4(occlusion, occlusion, occlusion, 1)) })
  }
  m.userData.lettering = cut
  return m
}

/** Gives an engraving its lettering drawn again (its typeface has come). */
export function recut(m: MetalMaterial, map: DataTexture) {
  const cut = m.userData.lettering as TextureNode
  cut.value.dispose()
  cut.value = map
}

/** A surface the ring rests in or on, which takes its traced shadow: it writes its normal and a mark (2) for the tracing
 *  pass (raytrace.ts, `reflect`), which darkens it where the ring takes the room's light. */
const receiving = (m: MeshPhysicalNodeMaterial) => {
  m.mrtNode = mrt({ rtNormal: vec4(normalWorld, 0), rtSpec: vec4(0, 0, 0, 2) })
  return m
}

/** The display hand's glazed porcelain. */
export const porcelain = () => receiving(new MeshPhysicalNodeMaterial({ color: new Color('#f6efe6'), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: new Color('#fff4e6'), envMapIntensity: 1.25 }))

/** The ring box: velvet outside the cushion, satin in the lid, leather outside. */
export const velvet = (color: string) => receiving(new MeshPhysicalNodeMaterial({ color: new Color(color), roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new Color('#c9a77a') }))
export const satin = () => receiving(new MeshPhysicalNodeMaterial({ color: new Color('#f3ece0'), roughness: 0.32, sheen: 0.8, sheenRoughness: 0.25, sheenColor: new Color('#ffffff'), side: DoubleSide }))
export const leather = (color: string) => receiving(new MeshPhysicalNodeMaterial({ color: new Color(color), roughness: 0.58, clearcoat: 0.25, clearcoatRoughness: 0.6 }))

/** Text drawn for a texture (the lid's maker's mark, the engraving), white on black for alpha maps. */
export function textTexture(text: string, font: string, width: number, height: number, options: { color?: string; background?: string; tracking?: number } = {}): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = options.background ?? '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = options.color ?? '#fff'
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (options.tracking) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${options.tracking}px`
  ctx.fillText(text, width / 2, height / 2 + height * 0.04)
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}
