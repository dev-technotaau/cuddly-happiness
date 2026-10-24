// The ring traced against itself. A raster draws what the eye sees first; from there, light that comes off polished
// metal or out of a stone is followed back as a ray through the ring's own triangles (bvh.ts), so the band's inside
// mirrors the band, the head darkens the metal under it, a claw is seen in the stone it holds, and the floor takes the
// ring's shadow. Rays that leave the ring take the room's light, as before. Metals are traced after the scene is drawn,
// once per pixel, in a pass of their own (`reflect`): the metals write where they face and how much of the room they
// reflect beside their colour, and the pass swaps the room for the ring wherever a reflection meets it. (Tracing inside
// the metals' own shaders made every metal pixel dearer, traced or not.) Each pixel follows the mirror direction, for
// one turn off the metal while the view moves and two once it is still. The same pass darkens what the ring rests in or
// on (the box's velvet, the porcelain hand) where the ring takes the room's light from it, ray by ray toward the room's
// lights. The hierarchy is rebuilt (off the page's thread) each time the ring settles into a new shape; while it changes,
// nothing is traced and the room alone lights it.
import { AdditiveBlending, Color, DataTexture, DepthTexture, FloatType, HalfFloatType, Matrix4, NearestFilter, NoBlending, NodeMaterial, QuadMesh, RGBAFormat, RenderTarget, RendererUtils, Vector3, Vector4, type Euler, type PerspectiveCamera, type Scene, type Texture, type WebGPURenderer } from 'three/webgpu'
import { Break, Fn, If, Loop, abs, acos, clamp, cos, cross, cubeTexture, dot, float, floor, fract, getViewPosition, hash, int, ivec2, log2, max, min, mix, mrt, normalize, output, pmremTexture, pow, pow4, reflect, screenCoordinate, select, sin, smoothstep, sqrt, texture, textureLoad, textureSize, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { LEAF_MAX, TEX_WIDTH, buildBVH, rowsFor, type BVH, type Traceable } from './bvh'
import { GEM_CUBE, GEM_LOOK, type GemUniforms } from './gemMaterial'
import type { RoomLight } from './lighting'

// TSL's typings can't follow a graph this size (see gemMaterial.ts); the shader is checked by running it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any

/** The most nodes one ray may visit before it gives up (a ray through the ring visits a few dozen). */
const MAX_STEPS = 1536
/** How far a ray starts off the surface it leaves, and the nearest hit it accepts (mm). */
const LIFT = 0.01
const T_MIN = 0.002

const W = int(TEX_WIDTH)

function floatTexture(data: Float32Array, rows: number): DataTexture {
  const t = new DataTexture(data, TEX_WIDTH, rows, RGBAFormat, FloatType)
  t.minFilter = NearestFilter
  t.magFilter = NearestFilter
  t.generateMipmaps = false
  t.needsUpdate = true
  return t
}

const empty = () => floatTexture(new Float32Array(TEX_WIDTH * 4), 1)

/** Linear RGB of an sRGB hex colour. */
function linear(hex: string): [number, number, number] {
  const c = new Color(hex)
  return [c.r, c.g, c.b]
}

let worker: Worker | null = null
let workerFailed = false
let jobs = 0
const waiting = new Map<number, (bvh: BVH) => void>()

/** Builds a hierarchy in the worker (or here, where workers can't run). */
function build(input: Traceable): Promise<BVH> {
  if (!worker && !workerFailed) {
    try {
      worker = new Worker(new URL('./bvhWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (e: MessageEvent<{ id: number; bvh: BVH }>) => {
        waiting.get(e.data.id)?.(e.data.bvh)
        waiting.delete(e.data.id)
      }
      worker.onerror = () => {
        workerFailed = true
        worker?.terminate()
        worker = null
        // Whatever was waiting is built here instead.
        const pending = [...waiting.values()]
        waiting.clear()
        pending.forEach((resolve) => resolve(buildBVH(input)))
      }
    } catch {
      workerFailed = true
    }
  }
  if (!worker) return Promise.resolve(buildBVH(input))
  const id = ++jobs
  return new Promise((resolve) => {
    waiting.set(id, resolve)
    worker!.postMessage({ id, ...input }, [input.positions.buffer, input.normals.buffer, input.materials.buffer])
  })
}

/** The most lights a room may have for the ring's shadows. */
const MAX_LIGHTS = 12

/** A low-discrepancy point (the R2 sequence) for a sample's index: the same for every texel or pixel unless turned. */
const r2 = (k: N): N => vec2(fract(k.mul(0.7548776662).add(0.5)), fract(k.mul(0.569840291).add(0.5)))

/** A ray's hit: distance (negative for a miss), triangle, and where on it (barycentric u, v). */
export interface TraceHit {
  t: N
  tri: N
  u: N
  v: N
}

export class RingTracer {
  /** How much the traced light counts: 0 while the ring changes shape, easing to 1 once its hierarchy is ready. */
  readonly on = uniform(0)
  /** Nodes in the hierarchy (0: nothing to trace). */
  readonly count = uniform(0, 'int')
  /** World to the ring's own space and back. */
  readonly toRing = uniform(new Matrix4())
  readonly fromRing = uniform(new Matrix4())
  /** The metals' colours at normal incidence (linear), and their gloss, as the materials hold them now. */
  readonly bandF0 = uniform(new Color(1, 1, 1))
  readonly headF0 = uniform(new Color(1, 1, 1))
  readonly bandRoughness = uniform(0.1)
  readonly headRoughness = uniform(0.1)
  readonly bounds = { min: new Vector3(), max: new Vector3() }
  /** The ring's bounding sphere (its own space: centre, radius): a ray that misses it needn't be traced. */
  private sphere = uniform(new Vector4(0, 0, 0, 0))
  /** The room's lights, which the ring's shadows are traced toward: a texel each a row (centre and luminance, then the
   *  half extents right and up, world), how many, and the glow of the rest of the room (luminance). */
  private lightData = new Float32Array(MAX_LIGHTS * 3 * 4)
  readonly lightTexture = new DataTexture(this.lightData, MAX_LIGHTS, 3, RGBAFormat, FloatType)
  readonly lights = { count: uniform(0, 'int'), ambient: uniform(0) }
  /** Counts the frames drawn, so each takes other samples of the room's light (`advance`). */
  private tick = uniform(0)
  private nodes = texture(empty())
  private tris = texture(empty())
  private norms = texture(empty())
  // Textures replaced by a newer hierarchy: kept until the one after, as a frame in flight may still read them.
  private retired: DataTexture[] = []
  private version = 0
  // The room the metals reflect (prefiltered), read by the pass where it swaps the room for the ring.
  private rooms: N[] = []
  private environment: Texture | null = null

  constructor(readonly u: GemUniforms) {}

  /** The room the metals are lit by now (the scene's environment). */
  setEnvironment(t: Texture) {
    this.environment = t
    for (const r of this.rooms) r.value = t
  }

  /** The room's lights, placed about the ring (`at`, world): as far from it as from the room's centre, so they lie where
   *  its reflections show them. */
  setLights(room: { lights: RoomLight[]; ambient: number }, at: Vector3) {
    const list = room.lights.slice(0, MAX_LIGHTS)
    list.forEach((l, i) => {
      this.lightData.set([l.centre.x + at.x, l.centre.y + at.y, l.centre.z + at.z, l.luminance], i * 4)
      this.lightData.set([l.right.x, l.right.y, l.right.z, 0], (MAX_LIGHTS + i) * 4)
      this.lightData.set([l.up.x, l.up.y, l.up.z, 0], (MAX_LIGHTS * 2 + i) * 4)
    })
    this.lightTexture.needsUpdate = true
    this.lights.count.value = list.length
    this.lights.ambient.value = room.ambient
  }

  /** Moves on to the next frame's samples. The count wraps, so the points it picks keep their precision however long the
   *  view stays open. */
  advance() {
    this.tick.value = (this.tick.value + 1) % 4096
  }

  /** Takes the ring's triangles (its own space) and builds their hierarchy; resolves false if a newer shape came in
   *  meanwhile, or nothing was given. */
  async load(input: Traceable): Promise<boolean> {
    const version = ++this.version
    if (!input.materials.length) {
      this.clear()
      return false
    }
    const bvh = await build(input)
    if (version !== this.version) return false
    this.retired.forEach((t) => t.dispose())
    this.retired = []
    this.swap(this.nodes, floatTexture(bvh.nodes, rowsFor(bvh.nodeCount * 2)))
    this.swap(this.tris, floatTexture(bvh.tris, rowsFor(bvh.triCount * 3)))
    this.swap(this.norms, floatTexture(bvh.norms, rowsFor(bvh.triCount * 3)))
    this.count.value = bvh.nodeCount
    this.bounds.min.set(bvh.bounds[0], bvh.bounds[1], bvh.bounds[2])
    this.bounds.max.set(bvh.bounds[3], bvh.bounds[4], bvh.bounds[5])
    const c = this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5)
    this.sphere.value.set(c.x, c.y, c.z, this.bounds.max.distanceTo(this.bounds.min) / 2)
    return true
  }

  /** Forgets the shape (it is changing): nothing is traced until the next `load`. */
  clear() {
    this.version++
    this.count.value = 0
    this.on.value = 0
  }

  private swap(node: N, next: DataTexture) {
    this.retired.push(node.value as DataTexture)
    node.value = next
  }

  /** Where the ring is in the world (its root's world matrix). */
  place(matrixWorld: Matrix4) {
    this.fromRing.value.copy(matrixWorld)
    this.toRing.value.copy(matrixWorld).invert()
  }

  dispose() {
    this.version++
    this.retired.forEach((t) => t.dispose())
    ;(this.nodes.value as DataTexture).dispose()
    ;(this.tris.value as DataTexture).dispose()
    ;(this.norms.value as DataTexture).dispose()
    this.lightTexture.dispose()
  }

  // ─── The walk ────────────────────────────────────────────────────────────────────────────────────────────────────────

  private texel(tex: N, i: N): N {
    return textureLoad(tex, ivec2(i.mod(W), i.div(W)))
  }

  /** The nearest triangle along a ray (ring space, unit direction) closer than `tMax`. */
  private closest = (o: N, d: N, tMax: N, any = false): TraceHit => {
    // Each axis kept off zero (a vector select would test all three together).
    const away = (c: N): N => select(abs(c).lessThan(1e-9), float(1e-9), c)
    const inv: N = vec3(1).div(vec3(away(d.x), away(d.y), away(d.z)))
    const best: N = float(tMax).toVar()
    const hitTri: N = int(-1).toVar()
    const hitU: N = float(0).toVar()
    const hitV: N = float(0).toVar()
    const node: N = int(0).toVar()
    Loop({ start: int(0), end: int(MAX_STEPS), type: 'int', condition: '<', name: 'step' } as N, () => {
      If(node.greaterThanEqual(this.count), () => {
        Break()
      })
      const a: N = this.texel(this.nodes, node.mul(2))
      const b: N = this.texel(this.nodes, node.mul(2).add(1))
      const t1: N = a.xyz.sub(o).mul(inv)
      const t2: N = b.xyz.sub(o).mul(inv)
      const lo: N = min(t1, t2)
      const hi: N = max(t1, t2)
      const near = max(max(lo.x, lo.y), lo.z)
      const far = min(min(hi.x, hi.y), hi.z)
      const leaf: N = int(b.w).toVar()
      If(far.greaterThanEqual(max(near, 0)).and(near.lessThan(best)), () => {
        If(leaf.greaterThan(0), () => {
          const start = leaf.div(16)
          const n = leaf.mod(16)
          Loop({ start: int(0), end: int(LEAF_MAX), type: 'int', condition: '<', name: 'j' } as N, (({ j }: { j: N }) => {
            If(j.greaterThanEqual(n), () => {
              Break()
            })
            const tri = start.add(j)
            const k = tri.mul(3)
            const v0: N = this.texel(this.tris, k)
            const e1: N = this.texel(this.tris, k.add(1)).xyz
            const e2: N = this.texel(this.tris, k.add(2)).xyz
            const p = cross(d, e2)
            const det = dot(e1, p)
            If(abs(det).greaterThan(1e-14), () => {
              const f = float(1).div(det)
              const s = o.sub(v0.xyz)
              const u = dot(s, p).mul(f)
              const q = cross(s, e1)
              const v = dot(d, q).mul(f)
              const t = dot(e2, q).mul(f)
              If(u.greaterThanEqual(0).and(v.greaterThanEqual(0)).and(u.add(v).lessThanEqual(1)).and(t.greaterThan(T_MIN)).and(t.lessThan(best)), () => {
                best.assign(t)
                hitTri.assign(tri)
                hitU.assign(u)
                hitV.assign(v)
              })
            })
            if (any) {
              If(hitTri.greaterThanEqual(0), () => {
                Break()
              })
            }
          }) as N)
          node.assign(int(a.w))
        }).Else(() => {
          node.addAssign(1)
        })
      }).Else(() => {
        node.assign(int(a.w))
      })
      if (any) {
        If(hitTri.greaterThanEqual(0), () => {
          Break()
        })
      }
    })
    return { t: select(hitTri.greaterThanEqual(0), best, float(-1)), tri: hitTri, u: hitU, v: hitV }
  }

  /** The surface normal at a hit (ring space), smooth across the triangle. */
  private normalAt(h: TraceHit): N {
    const k = h.tri.mul(3)
    const n0 = this.texel(this.norms, k).xyz
    const n1 = this.texel(this.norms, k.add(1)).xyz
    const n2 = this.texel(this.norms, k.add(2)).xyz
    return normalize(n0.mul(float(1).sub(h.u).sub(h.v)).add(n1.mul(h.u)).add(n2.mul(h.v)))
  }

  private materialAt(h: TraceHit): N {
    return this.texel(this.tris, h.tri.mul(3)).w
  }

  private toRingPoint = (p: N): N => this.toRing.mul(vec4(p, 1)).xyz
  private toRingDir = (d: N): N => normalize(this.toRing.mul(vec4(d, 0)).xyz)
  private toWorldDir = (d: N): N => normalize(this.fromRing.mul(vec4(d, 0)).xyz)

  /** A stone met by a ray, as seen from outside without following the light through it: its surface's reflection and
   *  the room behind it, through its body colour. */
  private stoneSeen(material: N, d: N, n: N): N {
    const tint = (type: keyof typeof GEM_LOOK) => vec3(...linear(GEM_LOOK[type].color))
    const body: N = select(material.lessThan(3.5), tint('diamond'), select(material.lessThan(4.5), tint('sapphire'), select(material.lessThan(5.5), tint('ruby'), tint('emerald'))))
    const cosIn = clamp(dot(d.negate(), n), 0, 1)
    const f0: N = select(material.lessThan(3.5), float(0.172), float(0.077))
    const fresnel = f0.add(float(1).sub(f0).mul(float(1).sub(cosIn).pow(5)))
    const room = (v: N): N => cubeTexture(this.u.envMap, this.toWorldDir(v), float(1)).rgb
    return room(reflect(d, n)).mul(fresnel).add(room(d).mul(body).mul(float(1).sub(fresnel)).mul(0.82))
  }

  /** The room's light along a direction (ring space) as a metal of this roughness reflects it. In the metals' pass, the
   *  room the metals are lit by, prefiltered (`metals`): metal mirroring metal sees what the metals see. Elsewhere (in a
   *  stone), the stones' cube, blurred to the gloss (its darker walls are the stones' contrast). */
  private room(d: N, rough: N, metals: boolean): N {
    if (metals) {
      const room: N = pmremTexture(this.environment!, this.toWorldDir(d), rough)
      this.rooms.push(room)
      return room.rgb
    }
    const lod = clamp(log2(max(rough.mul(rough), 1e-4).mul(GEM_CUBE / (Math.PI / 2))), 0, 9)
    return cubeTexture(this.u.envMap, this.toWorldDir(d), lod).rgb
  }

  /** The light arriving at a point from a direction (world): what of the ring the ray meets, followed for up to
   *  `bounces` mirror reflections off its metal. Returns [light, 1] when it met the ring, [0, 0] when it left without
   *  (the caller then takes the room's light its own way). The ray starts a breath off the surface, along `normal`
   *  (world), or along itself when `normal` is null. `metals`: traced for the metals' pass (see `room`). */
  radiance(origin: N, normal: N | null, dir: N, bounces: N, metals = false): N {
    const o: N = this.toRingPoint(origin).toVar()
    const d: N = this.toRingDir(dir).toVar()
    if (normal) o.addAssign(this.toRingDir(normal).mul(LIFT))
    else o.addAssign(d.mul(LIFT))
    const light: N = vec3(0).toVar()
    const through: N = vec3(1).toVar()
    const rough: N = float(0).toVar()
    const met: N = float(0).toVar()
    const open: N = float(1).toVar()
    Loop({ start: int(0), end: bounces, type: 'int', condition: '<', name: 'bounce' } as N, () => {
      const h = this.closest(o, d, float(1e5))
      If(h.t.lessThan(0), () => {
        // Out to the room, after at least one turn off the ring's metal.
        If(met.greaterThan(0.5), () => {
          light.addAssign(through.mul(this.room(d, rough, metals)))
        })
        open.assign(0)
        Break()
      })
      met.assign(1)
      const n: N = this.normalAt(h).toVar()
      If(dot(n, d).greaterThan(0), () => {
        n.assign(n.negate())
      })
      const material: N = this.materialAt(h)
      If(material.greaterThan(2.5), () => {
        light.addAssign(through.mul(this.stoneSeen(material, d, n)))
        open.assign(0)
        Break()
      })
      // Polished metal: its colour at this angle (Schlick), then on along the mirror direction.
      const band = material.lessThan(0.5)
      const f0: N = select(band, this.bandF0 as N, this.headF0 as N)
      const cosIn = clamp(dot(d.negate(), n), 0, 1)
      through.mulAssign(f0.add(vec3(1).sub(f0).mul(float(1).sub(cosIn).pow(5))))
      rough.assign(select(band, this.bandRoughness, this.headRoughness))
      o.assign(o.add(d.mul(h.t)).add(n.mul(LIFT)))
      d.assign(reflect(d, n))
    })
    // Still turning when the bounces ran out: the room along the last mirror direction.
    If(open.greaterThan(0.5).and(met.greaterThan(0.5)), () => {
      light.addAssign(through.mul(this.room(d, rough, metals)))
    })
    return vec4(light, met)
  }

  /** The scene's colour with its polished metals' reflections traced, from what the scene pass wrote: its colour, depth,
   *  and the metals' `rtNormal` (the normal their reflection turned on, world, and roughness) and `rtSpec` (how much of
   *  the room's light they pass, 1 in alpha where traced). Where a metal's mirror direction meets the ring, the room's
   *  light it took gives way to the ring's own. A surface beside the ring (2 in `rtSpec`'s alpha, its normal in
   *  `rtNormal`) is darkened by as much of the room's light as the ring takes from it: `shadow`'s share where given (the
   *  moving view's, smoothed by `soften`), else traced here (`lit`, a still's samples). `camera` drew the scene (its
   *  inverse projection and world matrix); `still` follows more turns. */
  reflect(color: N, depth: N, normal: N, spec: N, camera: { projection: N; world: N }, still: N, shadow: N | null = null): N {
    if (!this.environment) throw new Error('RingTracer: setEnvironment first')
    const env = this.environment
    return Fn(() => {
      const q = uv()
      // Everything the scene pass wrote, read here once, before any branch: a texture read with its own filtering
      // inside a branch or a loop is undefined (it lost the normal's z in the shading of what the ring rests on).
      const out: N = color.sample(q).toVar()
      const s: N = spec.sample(q).toVar()
      const nr: N = normal.sample(q).toVar()
      const z: N = depth.sample(q).r.toVar()
      const given: N | null = shadow ? shadow.sample(q).r.toVar() : null
      If(s.a.greaterThan(1.5).and(this.on.greaterThan(0)), () => {
        const view: N = getViewPosition(q, z, camera.projection)
        const p: N = camera.world.mul(vec4(view, 1)).xyz
        const shade: N = given ?? this.lit(p, normalize(nr.xyz).toVar(), still)
        out.assign(vec4(out.rgb.mul(mix(float(1), shade, this.on)), out.a))
      })
      If(s.a.greaterThan(0.5).and(s.a.lessThan(1.5)).and(this.on.greaterThan(0)), () => {
        const n: N = normalize(nr.xyz)
        const rough: N = nr.w
        const view: N = getViewPosition(q, z, camera.projection)
        const p: N = camera.world.mul(vec4(view, 1)).xyz
        const v: N = normalize(camera.world.mul(vec4(0, 0, 0, 1)).xyz.sub(p))
        // The direction the metal read the room in, as three reads it (a rough metal leans toward its normal).
        const mirror: N = normalize(mix(reflect(v.negate(), n), n, pow4(rough)))
        // Seen edge-on, a reflection hangs on how the surface's last fraction of a pixel curves: there the room's
        // prefiltered light stays, the traced one fading out.
        const square = smoothstep(0.06, 0.24, dot(n, v))
        If(square.greaterThan(0).and(dot(mirror, n).greaterThan(0.03)), () => {
          const traced: N = this.radiance(p, n, mirror, select(still, int(2), int(1)), true)
          const room: N = pmremTexture(env, mirror, rough)
          this.rooms.push(room)
          const k = traced.w.mul(this.on).mul(square)
          out.assign(vec4(out.rgb.add(s.rgb.mul(traced.rgb.sub(room.rgb)).mul(k)), out.a))
        })
      })
      return out
    })()
  }

  /** The light a rectangle gives a surface, per unit of its luminance, with nothing in the way: the cosine-weighted solid
   *  angle it fills above the surface's horizon (Lambert's formula, half the sum over its edges of the angle each spans
   *  times how the plane through it faces the normal), the rectangle first cut where it dips below the horizon.
   *  `corners`: its four corners from the point, in order round it; `n`: the surface's normal. */
  private facing(corners: N[], n: N): N {
    // Cut at the horizon (Sutherland–Hodgman against one plane): at most five corners.
    const cut: N[] = [0, 1, 2, 3, 4].map(() => vec3(0).toVar())
    const count: N = int(0).toVar()
    const keep = (v: N) => {
      cut.forEach((slot, i) => {
        If(count.equal(i), () => {
          slot.assign(v)
        })
      })
      count.addAssign(1)
    }
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % 4]
      const da: N = dot(n, a)
      const db: N = dot(n, b)
      If(da.greaterThanEqual(0), () => {
        keep(a)
      })
      If(da.mul(db).lessThan(0), () => {
        // Where the edge crosses the horizon, held in a variable of its own before it is kept.
        const crossing: N = a.add(b.sub(a).mul(da.div(da.sub(db)))).toVar()
        keep(crossing)
      })
    })
    const sum: N = float(0).toVar()
    cut.forEach((slot, i) => {
      If(int(i).lessThan(count), () => {
        const a: N = normalize(slot)
        const after: N = select(int(i + 1).lessThan(count), cut[(i + 1) % 5], cut[0])
        const b: N = normalize(after)
        const across: N = cross(a, b)
        sum.addAssign(acos(clamp(dot(a, b), -1, 1)).mul(dot(n, across.div(max(across.length(), 1e-9)))))
      })
    })
    return abs(sum).mul(0.5)
  }

  /** How much of the room's light reaches a surface beside the ring (a point `p` and its normal `n`, world) with the ring
   *  in the way, as a share of what would reach it without. What reaches it without is exact: each light's rectangle
   *  (`facing`) and the rest of the room's glow, π times its luminance. What the ring takes is traced, turned for each
   *  pixel: in a still (`still`), each light aimed at somewhere over its area and weighed by what that point gives, and
   *  the glow by a ray about the normal, every one each frame; while the view moves, one ray a frame, the light or the
   *  glow picked in proportion to what it gives (a weighted reservoir, one pass) and counted as seldom as it is picked.
   *  Either way the frames average to the share (a still's samples, the moving view's history), which is 1, without
   *  noise, wherever the ring takes nothing. A ray that would miss the ring's sphere isn't traced; nothing is beyond two
   *  and a half times the ring's size, where its shadow has faded. */
  private lit(p: N, n: N, still: N): N {
    const L = this.lights
    const o: N = this.toRingPoint(p).toVar()
    const far: N = o.sub(this.sphere.xyz).length().div(max(this.sphere.w, 1e-3))
    const share: N = float(1).toVar()
    If(far.lessThan(2.5), () => {
      // This frame's points, turned for each pixel by a hash of where it is, so neighbours take other ones.
      const px: N = screenCoordinate.xy
      const cell: N = floor(px.x).add(floor(px.y).mul(8192))
      const turn: N = vec2(hash(cell), hash(cell.add(16777213)))
      const pickSeed: N = floor(hash(floor(hash(cell.add(7)).mul(4194304)).add(this.tick.mul(13))).mul(4194304))
      // A frame from the normal for the glow's ray (Duff et al. 2017).
      const sign: N = select(n.z.greaterThanEqual(0), float(1), float(-1))
      const ka: N = float(-1).div(sign.add(n.z))
      const kb: N = n.x.mul(n.y).mul(ka)
      const t1: N = vec3(float(1).add(sign.mul(n.x).mul(n.x).mul(ka)), sign.mul(kb), sign.negate().mul(n.x))
      const t2: N = vec3(kb, sign.add(n.y.mul(n.y).mul(ka)), n.y.negate())
      const glow: N = L.ambient.mul(Math.PI)
      const light = (k: N) => {
        const at: N = min(k, int(MAX_LIGHTS - 1) as N)
        return { c: textureLoad(this.lightTexture, ivec2(at, int(0))).toVar() as N, right: textureLoad(this.lightTexture, ivec2(at, int(1))).xyz.toVar() as N, up: textureLoad(this.lightTexture, ivec2(at, int(2))).xyz.toVar() as N }
      }
      // What reaches the point without the ring, light by light and then the glow, and the moving view's pick.
      const total: N = float(0).toVar()
      const chosen: N = int(-1).toVar()
      const chosenGives: N = float(0).toVar()
      Loop({ start: int(0), end: int(MAX_LIGHTS + 1), type: 'int', condition: '<', name: 'k' } as N, (({ k }: { k: N }) => {
        If(k.greaterThan(L.count), () => {
          Break()
        })
        const gives: N = glow.toVar()
        If(k.lessThan(L.count), () => {
          const { c, right, up } = light(k)
          const corners: N[] = [c.xyz.sub(right).sub(up), c.xyz.add(right).sub(up), c.xyz.add(right).add(up), c.xyz.sub(right).add(up)].map((v) => v.sub(p).toVar())
          gives.assign(c.w.mul(this.facing(corners, n)))
        })
        total.addAssign(gives)
        // Kept in place of the one before with the chance of its share of all so far: picked in proportion in the end.
        If(gives.greaterThan(0).and(hash(pickSeed.add(float(k).mul(977))).mul(total).lessThan(gives)), () => {
          chosen.assign(k)
          chosenGives.assign(gives)
        })
      }) as N)
      // The rays: every light and the glow in a still, the pick alone while the view moves.
      const rays: N = select(still, L.count.add(1), select(chosen.greaterThanEqual(0), int(1), int(0)))
      const lost: N = float(0).toVar()
      Loop({ start: int(0), end: int(MAX_LIGHTS + 1), type: 'int', condition: '<', name: 'slot' } as N, (({ slot }: { slot: N }) => {
        If(slot.greaterThanEqual(rays), () => {
          Break()
        })
        const k: N = select(still, slot, chosen).toVar()
        const glowing: N = k.equal(L.count)
        const { c, right, up } = light(k)
        const r: N = fract(r2(this.tick.add(float(k).mul(31))).add(turn))
        const toward: N = c.xyz.add(right.mul(r.x.mul(2).sub(1))).add(up.mul(r.y.mul(2).sub(1))).sub(p)
        const d2: N = dot(toward, toward)
        const toLight: N = toward.div(sqrt(d2))
        const lightGives: N = c.w.mul(max(dot(toLight, n), 0)).mul(abs(dot(toLight, normalize(cross(right, up))))).mul(right.length().mul(up.length()).mul(4)).div(d2)
        // The glow, cosine-weighted about the normal.
        const ring: N = sqrt(r.y)
        const ang: N = r.x.mul(Math.PI * 2)
        const toGlow: N = normalize(t1.mul(ring.mul(cos(ang))).add(t2.mul(ring.mul(sin(ang)))).add(n.mul(sqrt(float(1).sub(r.y)))))
        const dir: N = select(glowing, toGlow, toLight)
        const w: N = select(glowing, glow, lightGives).toVar()
        // Picked, it stands for all it was picked from.
        const counts: N = select(still, w, w.mul(total).div(max(chosenGives, 1e-6))).toVar()
        const d: N = this.toRingDir(dir).toVar()
        const oc: N = o.sub(this.sphere.xyz)
        const along = dot(oc, d)
        const off = dot(oc, oc).sub(this.sphere.w.mul(this.sphere.w))
        If(w.greaterThan(0).and(off.lessThan(0).or(along.lessThan(0).and(along.mul(along).greaterThanEqual(off)))), () => {
          const h = this.closest(o.add(d.mul(LIFT)), d, float(1e5), true)
          If(h.t.greaterThanEqual(0), () => {
            lost.addAssign(counts)
          })
        })
      }) as N)
      const ratio: N = clamp(float(1).sub(lost.div(max(total, 1e-6))), 0, 1)
      // Fading out toward the edge of its reach, so no line shows where the tracing stops.
      share.assign(mix(ratio, float(1), smoothstep(2, 2.5, far)))
    })
    return share
  }

  /** For the moving view: the share of the room's light the ring leaves a surface beside it (`lit`, one ray a pixel), 1
   *  everywhere else; its grain is smoothed (`soften`) before it is laid on the picture. Drawn at half the picture's
   *  size: each of its pixels covers four of the scene's, read unfiltered, and shades one of them that lies beside the
   *  ring when any does (a block across the ring's edge never takes the metal's 1). */
  shade(depth: N, normal: N, spec: N, camera: { projection: N; world: N }): N {
    return Fn(() => {
      const size: N = vec2(textureSize(spec) as N).toVar()
      const base: N = floor(uv().mul(size).sub(0.5)).toVar()
      const texel = (x: number, y: number): N => clamp(base.add(vec2(x, y)), vec2(0), size.sub(1)).add(0.5).div(size)
      const blocks = [texel(0, 0), texel(1, 0), texel(0, 1), texel(1, 1)]
      const q: N = blocks[0].toVar()
      for (const b of blocks.slice(1).reverse()) q.assign(select(spec.sample(b).level(0).a.greaterThan(1.5), b, q))
      q.assign(select(spec.sample(blocks[0]).level(0).a.greaterThan(1.5), blocks[0], q))
      const s: N = spec.sample(q).level(0).toVar()
      const nr: N = normal.sample(q).level(0).toVar()
      const z: N = depth.sample(q).level(0).r.toVar()
      const share: N = float(1).toVar()
      If(s.a.greaterThan(1.5).and(this.on.greaterThan(0)), () => {
        const p: N = camera.world.mul(vec4(getViewPosition(q, z, camera.projection), 1)).xyz
        share.assign(this.lit(p, normalize(nr.xyz).toVar(), float(0)))
      })
      return vec4(share, share, share, 1)
    })()
  }

  /** The moving view's shadow (`shade`) with its grain smoothed: each pixel of a surface beside the ring averaged with
   *  its neighbours a few pixels round (a golden-angle spiral, turned for each pixel and each frame) that lie on the same
   *  surface (beside the ring too, facing the same way, in the same plane), so the average never runs over an edge, onto
   *  the ring or off the surface. The neighbours are read at their texels' centres at the full-size level, so nothing is
   *  filtered inside the loop. */
  soften(shade: N, depth: N, normal: N, spec: N, camera: { projection: N; world: N }): N {
    const TAPS = 16
    const RADIUS = 8
    return Fn(() => {
      const q = uv()
      const centre: N = shade.sample(q).r.toVar()
      const s: N = spec.sample(q).toVar()
      const nr: N = normal.sample(q).toVar()
      const z: N = depth.sample(q).r.toVar()
      const out: N = centre.toVar()
      const p: N = camera.world.mul(vec4(getViewPosition(q, z, camera.projection), 1)).xyz.toVar()
      // Only where the shadow can reach (as `lit` traces it, a little further for the neighbours).
      const near: N = this.toRingPoint(p).sub(this.sphere.xyz).length().lessThan(this.sphere.w.mul(2.6))
      If(s.a.greaterThan(1.5).and(near), () => {
        const size: N = vec2(textureSize(shade) as N).toVar()
        const px: N = floor(q.mul(size)).toVar()
        const n: N = normalize(nr.xyz).toVar()
        const spin: N = hash(px.x.add(px.y.mul(8192))).add(this.tick.mul(0.618034)).mul(Math.PI * 2).toVar()
        const sum: N = centre.toVar()
        const weight: N = float(1).toVar()
        Loop(TAPS, ({ i }: { i: N }) => {
          const a: N = float(i).mul(2.39996323).add(spin)
          const reach: N = sqrt(float(i).add(0.5).div(TAPS)).mul(RADIUS)
          const at: N = clamp(floor(px.add(vec2(cos(a), sin(a)).mul(reach))), vec2(0), size.sub(1)).add(0.5).div(size).toVar()
          const si: N = spec.sample(at).level(0).a
          If(si.greaterThan(1.5), () => {
            const zi: N = depth.sample(at).level(0).r
            const ni: N = normalize(normal.sample(at).level(0).xyz)
            const pi: N = camera.world.mul(vec4(getViewPosition(at, zi, camera.projection), 1)).xyz
            // Facing the same way, and in the plane through this pixel (within a tenth and a half of a millimetre).
            const w: N = pow(max(dot(n, ni), 0), 8).mul(max(float(0), float(1).sub(abs(dot(pi.sub(p), n)).div(0.15))))
            sum.addAssign(shade.sample(at).level(0).r.mul(w))
            weight.addAssign(w)
          })
        })
        out.assign(sum.div(weight))
      })
      return vec4(out, out, out, 1)
    })()
  }

  /** Whether anything of the ring lies along a ray from a point (world): 1 open, 0 blocked. */
  open(origin: N, dir: N): N {
    const o = this.toRingPoint(origin)
    const d = this.toRingDir(dir)
    const h = this.closest(o.add(d.mul(LIFT)), d, float(1e5), true)
    return select(h.t.lessThan(0), float(1), float(0))
  }
}

/** The floor shadow's texels a side. */
const SHADOW_SIZE = 288

/** What the scene's metals write for the tracing pass, and the zero every other surface writes. */
export const traceOutputs = () => ({ rtNormal: vec4(0), rtSpec: vec4(0) })

/** A still sample traced: the scene drawn into a frame of its own (colour, the metals' outputs, depth), then the
 *  reflections traced into the sample. The room turns as the scene's does (`rotation`, the scene's own Euler). */
export class TracedFrame {
  private target = new RenderTarget(1, 1, { type: HalfFloatType, count: 3, depthTexture: new DepthTexture(1, 1) })
  private mrt = mrt({ output, ...traceOutputs() })
  private projection = uniform(new Matrix4())
  private world = uniform(new Matrix4())
  private material = new NodeMaterial()
  private quad: QuadMesh
  private state = {} as Parameters<typeof RendererUtils.resetRendererState>[1]

  constructor(tracer: RingTracer, rotation: Euler) {
    const [colour, normal, spec] = this.target.textures
    colour.name = 'output'
    normal.name = 'rtNormal'
    spec.name = 'rtSpec'
    this.material.colorNode = tracer.reflect(texture(colour), texture(this.target.depthTexture!), texture(normal), texture(spec), { projection: this.projection, world: this.world }, tracer.u.still.greaterThan(0.5))
    this.material.blending = NoBlending
    this.material.name = 'TracedFrame.reflect'
    // A pass has no scene light of its own: the room's turn is the scene's.
    ;(this.material as unknown as { envMapRotation: Euler }).envMapRotation = rotation
    this.quad = new QuadMesh(this.material)
  }

  /** The frame the scene is drawn into, and its outputs, for compiling ahead. */
  get scenePass() {
    return { target: this.target, mrt: this.mrt }
  }

  /** Draws `scene` from `camera` into `out`, its metals' reflections traced. */
  draw(renderer: WebGPURenderer, scene: Scene, camera: PerspectiveCamera, out: RenderTarget) {
    if (this.target.width !== out.width || this.target.height !== out.height) this.target.setSize(out.width, out.height)
    this.state = RendererUtils.saveRendererState(renderer, this.state)
    renderer.setRenderTarget(this.target)
    renderer.setMRT(this.mrt)
    renderer.render(scene, camera)
    renderer.setMRT(null)
    this.projection.value.copy(camera.projectionMatrixInverse)
    this.world.value.copy(camera.matrixWorld)
    renderer.setRenderTarget(out)
    this.quad.render(renderer)
    RendererUtils.restoreRendererState(renderer, this.state)
  }

  dispose() {
    this.target.dispose()
    this.material.dispose()
  }
}

/** The ring's shadow on a floor: for each point of a square of floor around the ring, how much of the room's light
 *  still reaches it, the ring in the way or not. Each of the room's lights is aimed at directly, over its whole area
 *  (the softboxes give soft shadows, the small hot spot a crisper one), weighed by what it gives that point; the rest of
 *  the room (walls, ceiling) by rays all round. Baked over a few frames into one texture while floors read the other,
 *  then swapped, so a new shadow replaces the old one whole; held until the ring, the light or the floor changes. */
export class GroundShadow {
  /** What floors read: the last finished bake and its square (centre on the floor, half its side). */
  readonly shown: { texture: N; centre: N; half: N }
  /** How much the traced shadow counts (it fades in the first time). */
  readonly on = uniform(0)
  private targets = [0, 1].map(() => new RenderTarget(SHADOW_SIZE, SHADOW_SIZE, { type: HalfFloatType, depthBuffer: false }))
  private front = 0
  private centre = uniform(new Vector3())
  private half = uniform(30)
  private batch = uniform(0)
  private quad: QuadMesh
  private material = new NodeMaterial()
  private done = 0
  private passes = 0
  private state = {} as Parameters<typeof RendererUtils.resetRendererState>[1]

  constructor(tracer: RingTracer, samples = 4, rays = 8) {
    this.shown = { texture: texture(this.targets[0].texture), centre: uniform(new Vector3()), half: uniform(30) }
    const L = tracer.lights
    const shade: N = Fn(() => {
      const q = uv()
      const p = vec3(this.centre.x.add(q.x.mul(2).sub(1).mul(this.half)), this.centre.y.add(0.002), this.centre.z.add(q.y.mul(2).sub(1).mul(this.half)))
      const seen: N = float(0).toVar()
      const all: N = float(0).toVar()
      // The same low-discrepancy points for every texel, continued pass after pass: a shadow then grows smooth as the
      // points fill each light, rather than grainy texel by texel.
      const random = r2
      // The lights, aimed at: a point over each rectangle, its light weighed by the solid angle it fills from here.
      Loop({ start: int(0), end: int(MAX_LIGHTS), type: 'int', condition: '<', name: 'light' } as N, (({ light }: { light: N }) => {
        If(light.greaterThanEqual(L.count), () => {
          Break()
        })
        const c: N = textureLoad(tracer.lightTexture, ivec2(light, int(0)))
        const right: N = textureLoad(tracer.lightTexture, ivec2(light, int(1))).xyz
        const up: N = textureLoad(tracer.lightTexture, ivec2(light, int(2))).xyz
        const normal = normalize(cross(right, up))
        const area = right.length().mul(up.length()).mul(4)
        Loop(samples, ({ i }: { i: N }) => {
          const r: N = random(float(i).add(this.batch.mul(samples)).add(float(light).mul(31)))
          const target = c.xyz.add(right.mul(r.x.mul(2).sub(1))).add(up.mul(r.y.mul(2).sub(1)))
          const toward = target.sub(p)
          const d2 = dot(toward, toward)
          const dir = toward.div(sqrt(d2))
          const w = c.w.mul(max(dir.y, 0)).mul(abs(dot(dir, normal))).mul(area).div(d2)
          all.addAssign(w)
          seen.addAssign(w.mul(tracer.open(p, dir)))
        })
      }) as N)
      // The rest of the room, all round: a uniform glow seen through the ring's gaps (cosine-weighted rays).
      Loop(rays, ({ i }: { i: N }) => {
        const r: N = random(float(i).add(this.batch.mul(rays)).add(977))
        const phi = r.x.mul(Math.PI * 2)
        const radius = sqrt(r.y)
        const dir: N = vec3(radius.mul(cos(phi)) as N, sqrt(float(1).sub(r.y)) as N, radius.mul(sin(phi)) as N)
        const w = L.ambient.mul(Math.PI / rays)
        all.addAssign(w)
        seen.addAssign(w.mul(tracer.open(p, dir)))
      })
      return vec4(seen, all, 0, 1)
    })
    this.material.colorNode = shade()
    this.material.blending = AdditiveBlending
    this.material.depthTest = false
    this.material.depthWrite = false
    this.material.name = 'GroundShadow.bake'
    this.quad = new QuadMesh(this.material)
  }

  /** Starts a bake over a square: `centre` (world, y the floor's height), `half` its half side, lit by the room's
   *  lights as the tracer has them (`setLights`). */
  start(centre: Vector3, half: number, passes = 40) {
    this.centre.value.copy(centre)
    this.half.value = half
    this.done = 0
    this.passes = passes
  }

  /** Whether a bake is under way. */
  get pending() {
    return this.done < this.passes
  }

  /** Adds one batch of rays to the bake; returns true when this batch finished it (and floors now show it). */
  step(renderer: WebGPURenderer): boolean {
    if (!this.pending) return false
    const back = this.targets[1 - this.front]
    this.state = RendererUtils.saveRendererState(renderer, this.state)
    renderer.setMRT(null)
    renderer.setRenderTarget(back)
    if (this.done === 0) {
      renderer.setClearColor(0x000000, 0)
      renderer.clear(true, false, false)
    }
    this.batch.value = this.done
    this.quad.render(renderer)
    RendererUtils.restoreRendererState(renderer, this.state)
    this.done++
    if (this.pending) return false
    this.front = 1 - this.front
    this.shown.texture.value = back.texture
    this.shown.centre.value.copy(this.centre.value)
    this.shown.half.value = this.half.value
    return true
  }

  /** Stops a bake under way (the ring changed again). */
  cancel() {
    this.passes = this.done
  }

  dispose() {
    this.targets.forEach((t) => t.dispose())
    this.material.dispose()
  }
}

/** The floor's light under the ring: 1 in the open, less where the ring takes the room's light. */
export function groundShade(shadow: GroundShadow, position: N): N {
  const { texture: t, centre, half } = shadow.shown
  const q = vec2(position.x.sub(centre.x), position.z.sub(centre.z)).div(half.mul(2)).add(0.5)
  // Read through a soft filter (nine filtered taps a texel and a half apart, the light seen and possible averaged
  // apart): the bake's grain melts, the contact under the band, many texels wide, stays crisp.
  const step = 1.5 / SHADOW_SIZE
  let s: N = vec4(0)
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) s = s.add(texture(t, q.add(vec2(x * step, y * step))).mul((2 - Math.abs(x)) * (2 - Math.abs(y)) / 16))
  const inside = q.x.greaterThan(0).and(q.x.lessThan(1)).and(q.y.greaterThan(0)).and(q.y.lessThan(1))
  const ratio = clamp(s.r.div(max(s.g, 1e-4)), 0, 1)
  return mix(float(1), select(inside, ratio, float(1)), shadow.on)
}
