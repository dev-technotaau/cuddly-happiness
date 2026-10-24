// The stones, traced. A cut stone is a convex polyhedron, so light inside it needs no search: the facet it leaves by is
// the nearest of the planes ahead, one test per facet, the same for every pixel, which suits a GPU. Light refracts in,
// turns off the pavilion, and leaves at the first facet that lets it. Moving, it follows one path and parts into three
// colours at the last facet (fast, and steady from frame to frame). Still, each sample follows a single wavelength
// through the whole stone, so the accumulated samples add up to true fire over the same pattern of light and dark the
// moving view showed. Coloured stones darken with the length of the path, as their colour does. Where the light leaving
// the stone meets the ring itself, a claw, the basket, a neighbour, it takes the ring's light (raytrace.ts), so the
// metal holding a stone is seen in it.
import { MeshBasicNodeMaterial, Vector3, Vector4, type BufferGeometry, type CubeTexture, type UniformNode } from 'three/webgpu'
import { Break, Fn, If, Loop, clamp, cameraPosition, cubeTexture, dot, exp, float, fract, fwidth, hash, int, log2, max, mix, modelWorldMatrix, modelWorldMatrixInverse, normalGeometry, normalize, positionGeometry, positionWorld, pow, reflect, refract, screenCoordinate, select, uniform, uniformArray, vec3, vec4 } from 'three/tsl'
import type { StoneType } from '../../../data/ring'
import type { RingTracer } from './raytrace'

// TSL's typings follow each node's exact class through every operation, which a graph this size can't satisfy; the
// shader is built with a looser hand here (three's own TSL is plain JavaScript), and checked by running it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any

/** Each stone's look: body colour, refractive index (sodium light), dispersion (B to G Fraunhofer lines) and how many
 *  times light may turn inside it. */
export const GEM_LOOK: Record<StoneType, { color: string; ior: number; dispersion: number; bounces: number }> = {
  diamond: { color: '#ffffff', ior: 2.418, dispersion: 0.044, bounces: 8 },
  sapphire: { color: '#2b4fd6', ior: 1.77, dispersion: 0.018, bounces: 6 },
  ruby: { color: '#d4123a', ior: 1.77, dispersion: 0.018, bounces: 6 },
  emerald: { color: '#14a46a', ior: 1.58, dispersion: 0.014, bounces: 5 },
}

/** Uniforms every stone of one renderer reads. */
export interface GemUniforms {
  /** The stones' own view of the room: a cube with its mip levels. */
  envMap: CubeTexture
  /** Colour fire, 0–2 (1 is the stone's own dispersion, a little heightened). */
  fire: UniformNode<'float', number>
  brightness: UniformNode<'float', number>
  /** 0 while anything moves; 1 while a still accumulates (one wavelength per sample). */
  still: UniformNode<'float', number>
  /** The still's sample number, which seeds its random choices. */
  frame: UniformNode<'float', number>
}

export const makeGemUniforms = (envMap: CubeTexture): GemUniforms => ({ envMap, fire: uniform(1), brightness: uniform(1), still: uniform(0), frame: uniform(0) })

/** The most facets a stone may have (a brilliant has about 120). */
const MAX_PLANES = 128
/** The longest path traced, in turns inside the stone. */
const MAX_BOUNCES = 12
/** Phones: half-size light maps, plenty for their screens, and lighter on memory when the designer and the try-on are
 *  both open. */
export const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
/** The gem cube's size, for its mip level from the ray's spread. */
export const GEM_CUBE = COARSE ? 512 : 1024

/** A convex stone's faces as planes (outward unit normal, distance from the origin) in its own space; coplanar
 *  triangles merge into one facet. */
export function facetPlanes(g: BufferGeometry): Vector4[] {
  const pos = g.getAttribute('position')
  const idx = g.index
  const count = idx ? idx.count : pos.count
  const centre = new Vector3()
  for (let i = 0; i < pos.count; i++) centre.add(new Vector3().fromBufferAttribute(pos, i))
  centre.divideScalar(pos.count)
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const n = new Vector3()
  const planes: Vector4[] = []
  let size = 0
  for (let i = 0; i < pos.count; i++) size = Math.max(size, a.fromBufferAttribute(pos, i).length())
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(pos, idx ? idx.getX(i) : i)
    b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1)
    c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2)
    n.subVectors(b, a).cross(c.clone().sub(a))
    const len = n.length()
    if (len < 1e-10) continue
    n.divideScalar(len)
    let d = n.dot(a)
    // Outward: the stone's centre lies inside every facet's half-space.
    if (n.dot(centre) > d) {
      n.negate()
      d = -d
    }
    if (planes.some((p) => p.x * n.x + p.y * n.y + p.z * n.z > 0.99995 && Math.abs(p.w - d) < size * 1e-4)) continue
    planes.push(new Vector4(n.x, n.y, n.z, d))
  }
  return planes.slice(0, MAX_PLANES)
}

// One lobe of the CIE colour-matching functions' analytic fit (Wyman, Sloan and Shirley, 2013).
const lobe = (x: number, mu: number, s1: number, s2: number) => {
  const t = (x - mu) / (x < mu ? s1 : s2)
  return Math.exp(-0.5 * t * t)
}

/** Linear sRGB for one wavelength (nm), negatives clipped: the spectrum's colours. */
function spectrum(l: number): [number, number, number] {
  const X = 1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2)
  const Y = 0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1)
  const Z = 1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8)
  return [Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z), Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z), Math.max(0, 0.0557 * X - 0.204 * Y + 1.057 * Z)]
}

const LAMBDA_MIN = 390
const LAMBDA_MAX = 720

// Each channel's average over the sampled spectrum: dividing by it makes white light, sampled one wavelength at a time,
// add up to white again.
const SPECTRUM_NORM = (() => {
  const sum = [0, 0, 0]
  const steps = 700
  for (let i = 0; i < steps; i++) {
    const s = spectrum(LAMBDA_MIN + ((i + 0.5) / steps) * (LAMBDA_MAX - LAMBDA_MIN))
    sum[0] += s[0]
    sum[1] += s[1]
    sum[2] += s[2]
  }
  return sum.map((v) => steps / v) as [number, number, number]
})()

const lobeNode = (x: N, mu: number, s1: number, s2: number): N => {
  const t = x.sub(mu).div(select(x.lessThan(mu), float(s1), float(s2)))
  return exp(t.mul(t).mul(-0.5))
}

/** The same spectrum on the GPU, normalised. */
const spectrumNode: N = Fn(([l]: [N]) => {
  const X = lobeNode(l, 599.8, 37.9, 31.0).mul(1.056).add(lobeNode(l, 442.0, 16.0, 26.7).mul(0.362)).sub(lobeNode(l, 501.1, 20.4, 26.2).mul(0.065))
  const Y = lobeNode(l, 568.8, 46.9, 40.5).mul(0.821).add(lobeNode(l, 530.9, 16.3, 31.1).mul(0.286))
  const Z = lobeNode(l, 437.0, 11.8, 36.0).mul(1.217).add(lobeNode(l, 459.0, 26.0, 13.8).mul(0.681))
  const r = X.mul(3.2406).sub(Y.mul(1.5372)).sub(Z.mul(0.4986))
  const g = X.mul(-0.9689).add(Y.mul(1.8758)).add(Z.mul(0.0415))
  const b = X.mul(0.0557).sub(Y.mul(0.204)).add(Z.mul(1.057))
  return max(vec3(r, g, b), vec3(0)).mul(vec3(...SPECTRUM_NORM))
})

/** A stone's material: its facets traced, in the light of `u` and, given its `tracer`, of the ring around it.
 *  `small` (melee) takes fewer turns. */
export function gemMaterial(geometry: BufferGeometry, type: StoneType, u: GemUniforms, small = false, tracer: RingTracer | null = null): MeshBasicNodeMaterial {
  const look = GEM_LOOK[type]
  const list = facetPlanes(geometry)
  const padded = [...list, ...Array.from({ length: MAX_PLANES - list.length }, () => new Vector4(0, 1, 0, 1e6))]
  const planes = uniformArray(padded, 'vec4')
  const count = uniform(list.length, 'int')
  const bounces = uniform(small ? 4 : look.bounces, 'int')
  const ior = float(look.ior)
  // Cauchy's B for this dispersion (B to G: 486.1 and 686.7 nm in µm⁻², 4.232 − 2.121).
  const cauchy = float(look.dispersion / (1 / 0.4861 ** 2 - 1 / 0.6867 ** 2))
  const tint = vec3(...(['r', 'g', 'b'] as const).map((k) => srgbToLinear(look.color, k)))
  // The length over which the body colour is the tint: the stone's own width.
  geometry.computeBoundingBox()
  const width = float(Math.max(0.5, geometry.boundingBox!.max.x - geometry.boundingBox!.min.x))

  /** The refractive index at a wavelength (nm), fire scaling the dispersion. */
  const etaAt = (l: N): N => ior.add(cauchy.mul(u.fire).mul(1.25).mul(float(1e6).div(l.mul(l)).sub(1 / 0.5893 ** 2)))

  const shade: N = Fn(() => {
    // In the stone's own space: where the eye ray meets the facet, and the facet.
    const camLocal = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz
    const entry = positionGeometry
    const view: N = normalize(entry.sub(camLocal)).toVar()
    const n: N = normalize(normalGeometry).toVar()
    If(dot(n, view).greaterThan(0), () => {
      n.assign(n.negate())
    })
    const still = u.still.greaterThan(0.5)

    // A wavelength per pixel and sample (stills only), spread evenly over the samples.
    const pixel = screenCoordinate.floor()
    const lambda = mix(float(LAMBDA_MIN), float(LAMBDA_MAX), fract(hash(pixel.x.add(pixel.y.mul(2003))).add(u.frame.mul(0.618034))))
    const eta: N = select(still, etaAt(lambda), etaAt(float(560))).toVar()

    // In through the facet the eye sees.
    const d: N = refract(view, n, float(1).div(eta)).toVar()
    const o: N = entry.toVar()
    const travelled: N = float(0).toVar()
    // The direction inside, and the facet it leaves by, at the moment it leaves (for the colours' parting).
    const inside: N = d.toVar()
    const exitNormal: N = vec3(0, 1, 0).toVar()
    const left: N = float(0).toVar()

    Loop({ start: int(0), end: int(MAX_BOUNCES), type: 'int', condition: '<' }, ({ i }: { i: N }) => {
      If(i.greaterThanEqual(bounces), () => {
        Break()
      })
      // The nearest facet ahead.
      const tMin: N = float(1e6).toVar()
      const facet: N = vec3(0, 1, 0).toVar()
      Loop({ start: int(0), end: int(MAX_PLANES), type: 'int', condition: '<', name: 'k' } as N, (({ k }: { k: N }) => {
        If(k.greaterThanEqual(count), () => {
          Break()
        })
        const plane: N = planes.element(k)
        const along = dot(plane.xyz, d)
        If(along.greaterThan(1e-5), () => {
          const t = plane.w.sub(dot(plane.xyz, o)).div(along)
          If(t.lessThan(tMin), () => {
            tMin.assign(t)
            facet.assign(plane.xyz)
          })
        })
      }) as N)
      o.addAssign(d.mul(tMin))
      travelled.addAssign(tMin)
      const out: N = refract(d, facet.negate(), eta)
      // Out where it can; turned back by total internal reflection where it can't.
      If(dot(out, out).greaterThan(1e-6), () => {
        inside.assign(d)
        exitNormal.assign(facet)
        d.assign(out)
        left.assign(1)
        Break()
      })
      d.assign(reflect(d, facet))
    })

    const toWorld = (v: N): N => normalize(modelWorldMatrix.mul(vec4(v, 0)).xyz)
    const dir = toWorld(d)
    // The cube's mip level from how fast the ray's direction changes across the pixel: a sharp facet stays sharp, a
    // pattern finer than a pixel blurs instead of sparkling at random. Stills are sampled sharp and averaged instead.
    const spread: N = fwidth(dir)
    const lod = select(still, float(0.35), clamp(log2(max(max(spread.x, spread.y), spread.z).mul(GEM_CUBE * 0.7)), 0, 9))
    const env = (v: N): N => cubeTexture(u.envMap, v, lod).rgb
    // Moving: the colours part at the last facet only (red and blue at their own index).
    const etaR = etaAt(float(640))
    const etaB = etaAt(float(460))
    const outR = refract(inside, exitNormal.negate(), etaR)
    const outB = refract(inside, exitNormal.negate(), etaB)
    const dirR = toWorld(select(dot(outR, outR).lessThan(1e-6), d, outR))
    const dirB = toWorld(select(dot(outB, outB).lessThan(1e-6), d, outB))
    const parted = vec3(env(dirR).r, env(dir).g, env(dirB).b)
    const live: N = select(left.greaterThan(0.5), parted, env(dir)).toVar()
    const room: N = env(dir).toVar()
    // The ring where the leaving light meets it: one colour then (the parting is too fine to matter on metal).
    if (tracer) {
      If(tracer.on.greaterThan(0).and(left.greaterThan(0.5)), () => {
        const traced: N = tracer.radiance(modelWorldMatrix.mul(vec4(o, 1)).xyz, null, dir, int(1))
        const k = traced.w.mul(tracer.on)
        room.assign(mix(room, traced.rgb, k))
        live.assign(mix(live, traced.rgb, k))
      })
    }
    const colour: N = select(still, room.mul(spectrumNode(lambda)), live).toVar()

    // The body colour, deeper along a longer path.
    colour.mulAssign(pow(tint, vec3(travelled.div(width))))
    // The surface's own reflection, stronger at a glance.
    const f0 = eta.sub(1).div(eta.add(1)).pow2()
    const cosIn = clamp(dot(view.negate(), n), 0, 1)
    const fresnel = f0.add(float(1).sub(f0).mul(pow(float(1).sub(cosIn), 5)))
    // (Not traced: the claws' reflection on the crown is faint, and a second ray a pixel would cost the stone half again.)
    const surface = cubeTexture(u.envMap, toWorld(reflect(view, n)), select(still, float(0.35), float(0))).rgb
    return mix(colour, surface, fresnel).mul(u.brightness)
  })

  const m = new MeshBasicNodeMaterial()
  m.userData.stone = type
  m.colorNode = shade()
  // Fading in and out by dithering, which the anti-aliasing and the stills resolve into a smooth fade.
  m.alphaHash = true
  m.fog = false
  return m
}

/** One channel of an sRGB colour, linear. */
function srgbToLinear(hex: string, k: 'r' | 'g' | 'b'): number {
  const v = parseInt(hex.slice(1 + ['r', 'g', 'b'].indexOf(k) * 2, 3 + ['r', 'g', 'b'].indexOf(k) * 2), 16) / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** Spectrum normalisation, exposed for tests. */
export const SPECTRUM = { min: LAMBDA_MIN, max: LAMBDA_MAX, norm: SPECTRUM_NORM, at: spectrum }
