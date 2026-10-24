// The ring's stage: renderer, camera and controls, the light, the setup around the ring, and the camera's choreography.
// When a step opens, the camera glides to what it is about (the stone, the claws, the band, the inside for an
// engraving); the visitor can take over at any moment. While anything moves the view is anti-aliased over time (TRAA);
// once it rests, it keeps drawing the same view, nudged by a fraction of a pixel and with the stones in single
// wavelengths, and averages it into a clean, photographic still, then stops. It pauses off screen, lowers its resolution
// on a slow device, and photographs the ring the same way: a card for the bag, the ring alone from above for the
// try-on, or the view itself.
import gsap from 'gsap'
import { Group, Matrix4, Mesh, MeshBasicNodeMaterial, NearestFilter, PerspectiveCamera, PlaneGeometry, RenderPipeline, Scene, Vector2, Vector3, type Euler, type Material, type MeshBasicMaterial, type MeshPhysicalNodeMaterial, type Texture, type TextureNode, type WebGPURenderer } from 'three/webgpu'
import { float, mrt, output, pass, positionWorld, rtt, smoothstep, texture, uniform, vec3, velocity } from 'three/tsl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import { traa } from 'three/examples/jsm/tsl/display/TRAANode.js'
import type { Layout, RingDesign } from '../../../data/ring'
import type { StepId } from '../../../data/ringAdvice'
import { Accumulator, averageType, type Lens } from './accumulate'
import { makeGemUniforms, type GemUniforms } from './gemMaterial'
import { createRenderer, readCanvas, type Backend } from './gpu'
import { Lighting, roomLights, type LightPreset } from './lighting'
import { GroundShadow, RingTracer, TracedFrame, groundShade, traceOutputs } from './raytrace'
import { RingModel, type PartId } from './ringModel'
import { SETUP_LIGHT, buildSetup, type Setup, type SetupId } from './setups'

export type ViewId = 'hero' | 'front' | 'side' | 'top' | 'inside'

export interface LightState {
  preset: LightPreset
  /** Brightness, 0.5–1.6. */
  exposure: number
  /** The light's angle around the ring, radians. */
  angle: number
  /** Colour fire, 0–2. */
  fire: number
}

export interface Label {
  id: PartId
  x: number
  y: number
  visible: boolean
}

export interface StageEvents {
  onLabels?: (labels: Label[]) => void
  onBuilding?: (busy: boolean) => void
  onInteract?: () => void
  onLost?: () => void
  /** The first build is compiled and starts to play. */
  onReady?: () => void
}

/** Camera framings in the ring's own space: a direction to look from, a distance (for a 1 ct ring; larger rings are
 *  framed further away), and what to look at. */
const FRAMES: Record<StepId | ViewId, { from: [number, number, number]; distance: number; at: 'table' | 'girdle' | 'head' | 'centre' | 'inside' }> = {
  hero: { from: [0.55, 0.42, 0.72], distance: 70, at: 'head' },
  front: { from: [0.02, 0.14, 1], distance: 66, at: 'centre' },
  side: { from: [1, 0.2, 0.06], distance: 60, at: 'head' },
  top: { from: [0.08, 1, 0.22], distance: 52, at: 'girdle' },
  inside: { from: [0.02, 0.62, 1], distance: 30, at: 'inside' },
  stone: { from: [0.3, 0.86, 0.5], distance: 44, at: 'table' },
  setting: { from: [1, 0.24, 0.3], distance: 54, at: 'head' },
  prongs: { from: [0.42, 0.74, 0.6], distance: 38, at: 'girdle' },
  band: { from: [0.32, 0.02, 1], distance: 70, at: 'centre' },
  metal: { from: [0.55, 0.42, 0.72], distance: 70, at: 'head' },
  details: { from: [-0.9, 0.28, 0.42], distance: 54, at: 'head' },
  size: { from: [0.02, 0.06, 1], distance: 64, at: 'centre' },
  review: { from: [0.55, 0.42, 0.72], distance: 74, at: 'head' },
}

/** The lens: a long one, from further away, as jewellers photograph a ring (about 90 mm on a full frame). A wide lens held
 *  close swells whatever is nearest, the near side of the band against the head, and the ring stops reading true. The
 *  framings above were set for a 28° view; each distance grows by this much to frame the same at 15°. */
const FOV = 15
const FOV_NARROW = 19
const LENS = Math.tan((14 * Math.PI) / 180) / Math.tan(((FOV / 2) * Math.PI) / 180)
/** A still's depth of field: the aperture as a share of the distance in focus. Just enough that the far side of the band
 *  softens a touch behind the stone, as through a macro lens stopped down. */
const APERTURE = 0.006

/** How much larger than a 1 ct solitaire the ring stands: its height from the band's foot to the stone's table. */
const scaleOf = (L: Layout) => Math.min(1.6, Math.max(0.9, (L.band.inner + L.band.thickness + L.y.table) / 25.5))

/** Frees what a setup made: its geometry, materials and their textures. */
function release(group: Group) {
  group.traverse((o) => {
    const m = o as Mesh
    m.geometry?.dispose()
    const mats = (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as (Material & Record<string, unknown>)[]
    for (const mat of mats) {
      for (const key of ['map', 'alphaMap', 'normalMap']) (mat[key] as Texture | null | undefined)?.dispose()
      mat.dispose()
    }
  })
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

export class Stage {
  readonly renderer: WebGPURenderer
  readonly backend: Backend
  private scene = new Scene()
  private camera = new PerspectiveCamera(FOV, 1, 2, 8000)
  private controls: OrbitControls
  private lighting: Lighting
  private uniforms: GemUniforms
  // The ring traced against itself (rebuilt each time it settles into a new shape), and its shadow on the floor.
  private tracer: RingTracer
  private ground: GroundShadow
  // A still sample's frame: the scene with the metals' outputs, then their reflections traced.
  private frame: TracedFrame
  private traced = -1
  private cleared = -1
  private tracing = false
  private model: RingModel
  private holder = new Group()
  // Moving: the scene with its motion, anti-aliased over time. Still: the accumulated average.
  private moving: RenderPipeline
  private still: RenderPipeline
  private scenePass: ReturnType<typeof pass>
  private traaNode: ReturnType<typeof traa>
  private glows: ReturnType<typeof bloom>[]
  private stillTexture: TextureNode
  private accumulator: Accumulator
  private phase: 'moving' | 'still' | 'idle' = 'idle'
  private movingFrames = 0
  private maxSamples: number
  // The live loop holds still while the renderer is pointed elsewhere: compiling ahead, or drawing a picture.
  private paused = false
  /** The pictures asked for, drawn one after another (`snapshot`). */
  private shots: Promise<unknown> = Promise.resolve()
  private setup: Setup | null = null
  private setupId: SetupId = 'studio'
  private setupKey = ''
  private light: LightState = { preset: 'studio', exposure: 1, angle: 0, fire: 1 }
  private design: RingDesign | null = null
  private raf = 0
  private running = false
  private visible = true
  private exploded = false
  private spinning = false
  private observers: (IntersectionObserver | ResizeObserver)[] = []
  private busy: number | undefined
  private labelTick = 0
  // Moving lasts until nothing has changed for a moment; anything that moves pushes this back.
  private awakeUntil = 0
  private ratio: number
  private slow = 0
  private last = 0
  private preparing = false
  private queued: RingDesign | null = null
  private disposed = false

  /** A stage in `host`, its renderer started (WebGPU, else WebGL 2). */
  static async create(host: HTMLElement, motion: boolean, events: StageEvents = {}): Promise<Stage> {
    const { renderer, backend } = await createRenderer(true)
    return new Stage(host, motion, events, renderer, backend)
  }

  private constructor(private host: HTMLElement, private motion: boolean, private events: StageEvents, renderer: WebGPURenderer, backend: Backend) {
    this.renderer = renderer
    this.backend = backend
    const coarse = window.matchMedia('(pointer: coarse)').matches
    // TRAA resolves edges over time, so the view needn't draw at the screen's full density on a phone.
    this.ratio = Math.min(window.devicePixelRatio || 1, backend === 'webgpu' ? 2 : 1.5)
    this.maxSamples = backend === 'webgpu' ? (coarse ? 64 : 128) : coarse ? 32 : 64
    renderer.setPixelRatio(this.ratio)
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.outline = 'none'
    host.appendChild(canvas)
    canvas.addEventListener('webglcontextlost', this.onLost)
    renderer.onDeviceLost = () => this.onLost()

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.075
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.62
    this.controls.zoomSpeed = 0.75
    this.controls.autoRotateSpeed = 1.6
    this.controls.addEventListener('start', () => {
      gsap.killTweensOf(this.camera.position)
      gsap.killTweensOf(this.controls.target)
      this.events.onInteract?.()
      this.wake()
    })
    this.controls.addEventListener('change', () => this.wake(250))
    // The wheel zooms only with Ctrl or ⌘ held (a trackpad's pinch sends that too) or in full screen, so scrolling the
    // page over the ring still scrolls the page. Touch pinches always zoom.
    canvas.addEventListener('wheel', this.onWheel, { capture: true, passive: true })
    canvas.addEventListener('pointerdown', this.onPointer, true)

    this.lighting = new Lighting(renderer)
    this.uniforms = makeGemUniforms(this.lighting.gemCube)
    this.tracer = new RingTracer(this.uniforms)
    this.tracer.setEnvironment(this.lighting.use(this.light.preset).environment)
    this.ground = new GroundShadow(this.tracer)
    this.frame = new TracedFrame(this.tracer, this.scene.environmentRotation)

    // Moving: the scene with the metals' outputs, their reflections traced over it, then TRAA (it owns the camera's
    // jitter) and a bloom on the brightest sparks only, the stones' and the metal's glints well above white in linear
    // light, never the backdrop.
    const scenePass = pass(this.scene, this.camera)
    scenePass.setMRT(mrt({ output, velocity, ...traceOutputs() }))
    this.scenePass = scenePass
    const camera = { projection: uniform(this.camera.projectionMatrixInverse), world: uniform(this.camera.matrixWorld) }
    const depth = scenePass.getTextureNode('depth')
    const rtNormal = scenePass.getTextureNode('rtNormal')
    const rtSpec = scenePass.getTextureNode('rtSpec')
    // The ring's shadow on what it rests in or on: traced at half the size, smoothed over the surface, laid on the picture.
    const shade = rtt(this.tracer.shade(depth, rtNormal, rtSpec, camera)).setResolutionScale(0.5)
    const unfiltered = shade.renderTarget!.texture
    unfiltered.minFilter = unfiltered.magFilter = NearestFilter
    const shadow = rtt(this.tracer.soften(shade, depth, rtNormal, rtSpec, camera))
    const traced = rtt(this.tracer.reflect(scenePass.getTextureNode('output'), depth, rtNormal, rtSpec, camera, float(0), shadow))
    // The pass draws without a scene of its own: the room turns as the scene's does.
    ;(traced as unknown as { _quadMesh: { material: { envMapRotation: Euler } } })._quadMesh.material.envMapRotation = this.scene.environmentRotation
    this.traaNode = traa(traced, scenePass.getTextureNode('depth'), scenePass.getTextureNode('velocity'), this.camera)
    const glowMoving = bloom(this.traaNode, 0.15, 0.22, 2.4)
    this.moving = new RenderPipeline(renderer, this.traaNode.add(glowMoving))
    // Still: the average, with the same bloom.
    this.accumulator = new Accumulator(1, 1, averageType(renderer))
    this.stillTexture = texture(this.accumulator.texture)
    const glowStill = bloom(this.stillTexture, 0.15, 0.22, 2.4)
    this.still = new RenderPipeline(renderer, this.stillTexture.add(glowStill))
    this.glows = [glowMoving, glowStill]

    this.model = new RingModel(motion, this.uniforms, this.tracer)
    this.model.onRedraw = () => this.wake(400)
    // The traced metals read the materials' own colours, as they tween.
    this.tracer.bandF0.value = this.model.bandMetal.color
    this.tracer.headF0.value = this.model.headMetal.color
    this.holder.matrixAutoUpdate = false
    this.holder.add(this.model.root)
    this.scene.add(this.holder)

    const resize = new ResizeObserver(() => this.resize())
    resize.observe(host)
    const seen = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.wake()
      else this.stop()
    })
    seen.observe(host)
    this.observers.push(resize, seen)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.resize()
    this.setLighting(this.light)
  }

  private onLost = (e?: Event) => {
    e?.preventDefault()
    this.stop()
    this.events.onLost?.()
  }

  private onVisibility = () => (document.hidden ? this.stop() : this.wake())

  private onWheel = (e: WheelEvent) => {
    this.controls.enableZoom = e.ctrlKey || e.metaKey || !!document.fullscreenElement?.contains(this.host)
  }

  private onPointer = () => {
    this.controls.enableZoom = true
  }

  private resize() {
    const w = Math.max(1, this.host.clientWidth)
    const h = Math.max(1, this.host.clientHeight)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // A tall, narrow stage (phones) frames the ring from further away so it fits.
    this.camera.fov = w / h < 0.9 ? FOV_NARROW : FOV
    this.camera.updateProjectionMatrix()
    this.wake(300)
  }

  /** Keeps the view moving (anti-aliased over time) for at least `ms` more; then it settles into a still. */
  private wake(ms = 1500) {
    this.awakeUntil = Math.max(this.awakeUntil, performance.now() + ms)
    if (this.phase !== 'moving') this.phase = 'idle'
    if (this.running || !this.visible || document.hidden || this.paused) return
    this.running = true
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private stop() {
    cancelAnimationFrame(this.raf)
    this.running = false
  }

  /** Keeps the loop going (to bake, or to start a still again) without making the view move. */
  private kick() {
    if (this.running || !this.visible || document.hidden || this.paused) return
    this.running = true
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    if (this.paused || this.disposed) {
      this.running = false
      return
    }
    this.controls.update()
    this.syncTracer(now)
    // Each frame takes other samples of the room's lights for the ring's traced shadows.
    this.tracer.advance()
    // The floor's shadow bakes a batch a frame, out of sight: the floor shows the last one until the new one is done.
    if (this.ground.pending && this.ground.step(this.renderer)) this.groundReady()
    const moving = this.spinning || now < this.awakeUntil
    if (moving) {
      this.phase = 'moving'
      this.uniforms.still.value = 0
      this.moving.render()
      this.movingFrames++
      this.adapt(now)
    } else {
      if (this.phase !== 'still') this.settle()
      this.uniforms.still.value = 1
      this.uniforms.frame.value = this.accumulator.drawn
      this.accumulator.add(this.renderer, this.camera, (target) => this.frame.draw(this.renderer, this.scene, this.camera, target), this.lens())
      this.uniforms.still.value = 0
      this.stillTexture.value = this.accumulator.texture
      this.still.render()
    }
    if (this.exploded && this.events.onLabels && this.labelTick++ % 2 === 0) this.emitLabels()
    if (moving || this.accumulator.drawn < this.maxSamples || this.ground.pending) this.raf = requestAnimationFrame(this.tick)
    else {
      this.running = false
      this.phase = 'idle'
    }
  }

  // The tracer follows the ring: anything that changes its shape stops the tracing at once (the hierarchy no longer
  // matches); once the parts have settled, a new one is built off the page's thread and the traced light fades back in,
  // then the floor's shadow is baked again.
  private syncTracer(now: number) {
    const m = this.model
    if (m.version !== this.cleared) {
      this.cleared = m.version
      gsap.killTweensOf(this.tracer.on)
      this.tracer.clear()
      this.ground.cancel()
    }
    this.holder.updateMatrixWorld()
    this.tracer.place(m.root.matrixWorld)
    this.tracer.bandRoughness.value = m.bandMetal.roughness
    this.tracer.headRoughness.value = m.headMetal.roughness
    if (this.tracing || m.version === this.traced || now < m.busyUntil + 60) return
    const version = m.version
    this.tracing = true
    void this.tracer.load(m.traceable()).then((ok) => {
      this.tracing = false
      if (this.disposed) return
      if (ok && version === this.model.version) {
        this.traced = version
        if (this.motion) gsap.to(this.tracer.on, { value: 1, duration: 0.4, ease: 'power1.out' })
        else this.tracer.on.value = 1
        this.bakeGround()
      }
      this.wake(600)
    })
  }

  /** Bakes the ring's shadow on the studio's floor (the other setups keep their own). */
  private bakeGround() {
    // The room's lights about the ring, for its shadows on the floor and on whatever it rests in.
    const at = new Vector3().setFromMatrixPosition(this.holder.matrix)
    this.tracer.setLights(roomLights(this.light.preset, this.scene.environmentRotation), at)
    const L = this.model.layout
    if (!L || !this.setup?.ground || this.traced !== this.model.version) return
    this.ground.start(at.clone().setY(0), (L.band.inner + L.band.thickness + L.y.table) * 0.95)
    this.kick()
  }

  /** A traced shadow lies on the floor: the drawn stand-ins give way to it (the first time, fading), and a still under
   *  way starts again over the new floor. */
  private groundReady() {
    if (this.ground.on.value >= 1) {
      if (this.phase === 'still') this.phase = 'idle'
      this.kick()
      return
    }
    if (this.motion) gsap.to(this.ground.on, { value: 1, duration: 0.4, ease: 'power1.out' })
    else this.ground.on.value = 1
    for (const f of this.setup?.stand ?? []) {
      const mat = f.material as MeshBasicMaterial
      gsap.killTweensOf(mat)
      if (this.motion) gsap.to(mat, { opacity: 0, duration: 0.4, onComplete: () => (f.visible = false) })
      else f.visible = false
    }
    this.wake(500)
  }

  /** The lens for a still of the live view: in focus where the camera looks. */
  private lens(): Lens {
    const focus = this.camera.position.distanceTo(this.controls.target)
    return { focus, aperture: focus * APERTURE }
  }

  // At rest: the still starts from what TRAA last showed (worth a few samples once it has had a few frames), so it
  // refines the picture rather than starting from a single, jagged sample.
  private settle() {
    this.phase = 'still'
    const size = this.renderer.getDrawingBufferSize(new Vector2())
    this.accumulator.setSize(size.x, size.y)
    const seed = (this.traaNode as unknown as { getTextureNode(): TextureNode }).getTextureNode().value
    this.accumulator.reset(seed, this.movingFrames >= 6 ? 6 : this.movingFrames >= 2 ? 2 : 0)
    this.movingFrames = 0
  }

  // A device that can't keep up draws at a lower resolution: the stones' tracing is the costly part.
  private adapt(now: number) {
    const dt = this.last ? now - this.last : 16
    this.last = now
    if (dt > 30 && dt < 250) this.slow++
    else this.slow = Math.max(0, this.slow - 1)
    if (this.slow > 24 && this.ratio > 1) {
      this.ratio = Math.max(1, this.ratio - 0.25)
      this.renderer.setPixelRatio(this.ratio)
      this.resize()
      this.slow = 0
    }
  }

  /** Builds or updates the ring. The first call plays the whole assembly as the camera comes in. */
  setDesign(d: RingDesign) {
    // While the first build compiles, the latest design waits its turn.
    if (this.preparing) {
      this.queued = d
      return
    }
    if (!this.design) {
      void this.firstBuild(d)
      return
    }
    this.design = d
    const duration = this.model.update(d)
    // The setup follows the ring's size (the box's slit, the hand's finger, the floor's shadow).
    if (this.keyOf(d) !== this.setupKey) this.placeSetup()
    this.building(duration)
    // A new metal is a colour tween outside the timeline (0.8 s).
    this.wake(Math.max(duration, 0.9) * 1000 + 300)
  }

  // The first build compiles every shader before it plays (the stones' tracing takes the longest), so the assembly is
  // seen from its first moment rather than lost in the stall; the viewer keeps its veil up meanwhile.
  private async firstBuild(d: RingDesign) {
    this.preparing = true
    this.design = d
    const duration = this.model.update(d, true, true)
    this.placeSetup()
    // Compiled against the two targets the scene is drawn into (pipelines depend on their formats): the moving view's
    // pass, with its motion vectors, and the still's samples.
    const r = this.renderer
    const target = r.getRenderTarget()
    const mrtNode = r.getMRT()
    this.paused = true
    this.stop()
    try {
      r.setRenderTarget(this.scenePass.renderTarget)
      r.setMRT(this.scenePass.getMRT())
      await r.compileAsync(this.scene, this.camera)
      r.setRenderTarget(this.frame.scenePass.target)
      r.setMRT(this.frame.scenePass.mrt)
      await r.compileAsync(this.scene, this.camera)
    } catch {
      // Compiling ahead is an optimisation: the first frame compiles whatever is left.
    } finally {
      r.setRenderTarget(target)
      r.setMRT(mrtNode)
      this.paused = false
    }
    if (this.disposed) return
    this.preparing = false
    this.model.release()
    this.frameSetup()
    this.events.onReady?.()
    this.building(duration)
    this.wake(Math.max(duration, 2.2) * 1000 + 300)
    if (this.queued) {
      const next = this.queued
      this.queued = null
      this.setDesign(next)
    }
  }

  private building(duration: number) {
    if (duration <= 0) return
    this.events.onBuilding?.(true)
    window.clearTimeout(this.busy)
    this.busy = window.setTimeout(() => this.events.onBuilding?.(false), duration * 1000)
  }

  private keyOf = (d: RingDesign) => `${this.setupId}|${d.size}|${d.band.width}|${d.band.form}`

  /** Changes what surrounds the ring. Returns the light that setup is best seen in. */
  setSetup(id: SetupId): LightPreset {
    this.setupId = id
    this.placeSetup(true)
    return SETUP_LIGHT[id]
  }

  private placeSetup(frame = false) {
    if (!this.design || !this.model.layout) return
    const L = this.model.layout
    if (this.setup) {
      this.scene.remove(this.setup.group)
      release(this.setup.group)
      this.setup.background.dispose()
    }
    const setup = buildSetup(this.setupId, L)
    this.setup = setup
    this.setupKey = this.keyOf(this.design)
    // The studio's floor takes the traced shadow; until one is baked, its drawn stand-ins show.
    if (setup.ground) (setup.ground.material as MeshPhysicalNodeMaterial).aoNode = groundShade(this.ground, positionWorld)
    if (this.ground.on.value >= 1) for (const f of setup.stand ?? []) f.visible = false
    this.scene.add(setup.group)
    this.scene.background = setup.background
    this.holder.matrix.copy(setup.ringAt)
    this.holder.matrixWorldNeedsUpdate = true
    const k = scaleOf(L)
    this.controls.maxPolarAngle = setup.maxPolar
    this.controls.minDistance = setup.distance * k * LENS * 0.3
    this.controls.maxDistance = setup.distance * k * LENS * 2.4
    if (frame) this.frameSetup()
    this.bakeGround()
    this.wake()
  }

  /** The setup's own framing, coming in from further out. */
  private frameSetup() {
    const s = this.setup!
    const k = scaleOf(this.model.layout!)
    const to = s.target.clone().addScaledVector(s.from, s.distance * k * LENS)
    if (this.motion) {
      this.camera.position.copy(s.target.clone().addScaledVector(s.from, s.distance * k * LENS * 1.6))
      this.controls.target.copy(s.target)
      this.glide(to, s.target, 2.2)
    } else {
      this.camera.position.copy(to)
      this.controls.target.copy(s.target)
      this.controls.update()
    }
  }

  setLighting(next: Partial<LightState>) {
    this.light = { ...this.light, ...next }
    if (next.preset || !this.scene.environment) {
      this.scene.environment = this.lighting.use(this.light.preset).environment
      this.tracer.setEnvironment(this.scene.environment)
    }
    this.renderer.toneMappingExposure = this.light.exposure
    // The metals' environment and the stones' cube both turn with it (node materials read the scene's rotation).
    this.scene.environmentRotation.set(0, this.light.angle, 0)
    this.uniforms.fire.value = this.light.fire
    for (const g of this.glows) g.strength.value = 0.07 + 0.1 * this.light.fire
    // The floor's shadow follows the light.
    if (next.preset || next.angle !== undefined) this.bakeGround()
    this.wake(400)
  }

  /** Looks at a step's subject, or a named view. In the box or on the hand the camera stays near the setup's angle, so
   *  it never goes under the table or into the hand. */
  focus(on: StepId | ViewId) {
    if (!this.model.layout || !this.setup) return
    const L = this.model.layout
    const studio = this.setupId === 'studio'
    const engraved = on === 'details' && !!this.design?.details.engraving.trim()
    // The inside can only be seen when nothing fills the ring.
    const frame = (engraved || on === 'inside') && studio ? FRAMES.inside : on === 'inside' ? FRAMES.hero : FRAMES[on]
    const local = frame.at === 'table' ? new Vector3(0, L.y.table, 0) : frame.at === 'girdle' ? new Vector3(0, L.y.girdle, 0) : frame.at === 'head' ? new Vector3(0, (L.y.culet + L.y.table) / 2 - 1, 0) : frame.at === 'inside' ? new Vector3(0, -L.band.inner + 1.2, 0) : new Vector3(0, (L.y.table - L.band.inner - L.band.thickness) / 2, 0)
    const target = local.applyMatrix4(this.holder.matrix)
    const basis = new Matrix4().extractRotation(this.holder.matrix)
    let dir = new Vector3(...frame.from).normalize().applyMatrix4(basis)
    if (!studio) dir = dir.lerp(this.setup.from, 0.55).normalize()
    if (dir.y < 0.05) dir.setY(0.05).normalize()
    const k = (frame === FRAMES.inside ? 1 : scaleOf(L)) * (this.setupId === 'hand' ? 1.1 : this.setupId === 'salon' ? 1.15 : 1) * (this.exploded ? 1.3 : 1)
    this.glide(target.clone().addScaledVector(dir, frame.distance * k * LENS), target, 1.25)
  }

  private glide(position: Vector3, target: Vector3, duration: number) {
    gsap.killTweensOf(this.camera.position)
    gsap.killTweensOf(this.controls.target)
    if (!this.motion) {
      this.camera.position.copy(position)
      this.controls.target.copy(target)
      this.controls.update()
      this.wake(200)
      return
    }
    gsap.to(this.camera.position, { x: position.x, y: position.y, z: position.z, duration, ease: 'power3.inOut' })
    gsap.to(this.controls.target, { x: target.x, y: target.y, z: target.z, duration, ease: 'power3.inOut' })
    this.wake(duration * 1000 + 200)
  }

  setAutoRotate(on: boolean) {
    this.spinning = on && this.motion
    this.controls.autoRotate = this.spinning
    if (this.spinning) this.wake()
  }

  /** Turns the ring once around, slowly, from where it is. */
  turnAround() {
    if (!this.motion) return
    const t = this.controls.target.clone()
    const start = this.camera.position.clone().sub(t)
    const state = { a: 0 }
    gsap.killTweensOf(this.camera.position)
    gsap.to(state, {
      a: Math.PI * 2,
      duration: 6,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.camera.position.copy(t).add(start.clone().applyAxisAngle(new Vector3(0, 1, 0), state.a))
      },
    })
    this.wake(6200)
  }

  /** Keyboard turning: around (radians) and up or down. */
  orbit(around: number, up: number) {
    const t = this.controls.target
    const v = this.camera.position.clone().sub(t)
    v.applyAxisAngle(new Vector3(0, 1, 0), around)
    const axis = new Vector3().crossVectors(new Vector3(0, 1, 0), v).normalize()
    const tilted = v.clone().applyAxisAngle(axis, -up)
    const polar = Math.acos(Math.min(1, Math.max(-1, tilted.y / tilted.length())))
    if (polar > 0.08 && polar < this.controls.maxPolarAngle) v.copy(tilted)
    this.glide(t.clone().add(v), t.clone(), 0.45)
  }

  /** Keyboard zoom: k < 1 comes closer. */
  zoom(k: number) {
    const t = this.controls.target
    const v = this.camera.position.clone().sub(t)
    const d = Math.min(this.controls.maxDistance, Math.max(this.controls.minDistance, v.length() * k))
    this.glide(t.clone().add(v.setLength(d)), t.clone(), 0.45)
  }

  /** Lifts the parts apart and frames them all, three-quarters from the front. Brought back together, the caller
   *  returns the camera to its step. */
  explode(on: boolean) {
    this.exploded = on
    this.model.explode(on)
    this.wake(1300)
    if (!on) {
      this.events.onLabels?.([])
      return
    }
    const L = this.model.layout
    if (!L || !this.setup) return
    const outer = L.band.inner + L.band.thickness
    const top = L.y.table + 11
    const target = new Vector3(0, (top - outer) / 2, 0).applyMatrix4(this.holder.matrix)
    let dir = new Vector3(0.62, 0.3, 0.72).normalize().applyMatrix4(new Matrix4().extractRotation(this.holder.matrix))
    if (this.setupId !== 'studio') dir = dir.lerp(this.setup.from, 0.55).normalize()
    const distance = (top + outer) / 2 / 0.74 / Math.tan(((this.camera.fov / 2) * Math.PI) / 180)
    this.glide(target.clone().addScaledVector(dir, distance), target, 1.1)
  }

  private emitLabels() {
    const rect = this.host.getBoundingClientRect()
    const labels: Label[] = []
    for (const id of this.model.anchors.keys()) {
      const local = this.model.anchorOf(id)
      if (!local) continue
      const p = local.applyMatrix4(this.holder.matrix).project(this.camera)
      labels.push({ id, x: ((p.x + 1) / 2) * rect.width, y: ((1 - p.y) / 2) * rect.height, visible: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 })
    }
    this.events.onLabels?.(labels)
  }

  /** A picture of the ring, accumulated like a still: `card` on silk in the current light, `tryon` the ring alone from
   *  above (the back of the hand) on transparent ground, the finger running up the picture, or `view`, what the
   *  visitor sees. The live view pauses while it is drawn. Pictures wait their turn, and for the scene to finish
   *  compiling: one asked for while the review's card is being drawn (the try-on's, a saved design's) is drawn next,
   *  not dropped. */
  snapshot(kind: 'card' | 'tryon' | 'view', width = 600, height = 750): Promise<string> {
    const next = this.shots.then(async () => {
      while (this.paused && !this.disposed) await frame()
      return this.shoot(kind, width, height)
    })
    this.shots = next.catch(() => '')
    return next
  }

  private async shoot(kind: 'card' | 'tryon' | 'view', width: number, height: number): Promise<string> {
    if (!this.model.layout || this.disposed) return ''
    this.paused = true
    this.stop()
    const r = this.renderer
    const background = this.scene.background
    const L = this.model.layout
    const fov = kind === 'tryon' ? 18 : 14
    const camera = new PerspectiveCamera(fov, width / height, 2, 8000)
    const rotation = new Matrix4().extractRotation(this.holder.matrix)
    const outer = L.band.inner + L.band.thickness
    const fit = (half: number) => half / Math.tan(((fov / 2) * Math.PI) / 180)
    // Where the picture is in focus.
    const focusAt = this.controls.target.clone()
    if (kind === 'view') {
      camera.copy(this.camera)
      camera.aspect = width / height
    } else if (kind === 'tryon') {
      // Straight down onto the stone, a touch from the wrist: the band runs across, its width about 44% of the picture.
      const at = new Vector3(0, L.y.girdle * 0.5, 0).applyMatrix4(this.holder.matrix)
      const from = new Vector3(0, 1, -0.18).normalize().applyMatrix4(rotation)
      camera.position.copy(at).addScaledVector(from, fit(outer / 0.44))
      camera.up.copy(new Vector3(0, 0, 1).applyMatrix4(rotation))
      camera.lookAt(at)
    } else {
      // Three-quarters, the whole ring filling about three quarters of the height.
      const span = outer + L.y.table
      const at = new Vector3(0, (L.y.table - outer) / 2, 0).applyMatrix4(this.holder.matrix)
      const dir = new Vector3(0.55, 0.36, 0.76).normalize().applyMatrix4(rotation)
      camera.position.copy(at).addScaledVector(dir, fit(span / 2 / 0.74))
      camera.lookAt(at)
      // The stone in focus, as a photographer would set it.
      focusAt.set(0, L.y.girdle, 0).applyMatrix4(this.holder.matrix)
    }
    camera.updateProjectionMatrix()
    const focus = camera.position.distanceTo(focusAt)
    const lens: Lens = { focus, aperture: focus * APERTURE }
    // More samples for the picture saved at full size, fewer for the small card and the try-on's flat fallback.
    const samples = kind === 'view' ? (this.backend === 'webgpu' ? 48 : 24) : kind === 'card' ? 32 : 16
    const acc = new Accumulator(width, height, averageType(r))
    const traced = new TracedFrame(this.tracer, this.scene.environmentRotation)
    // The card keeps the ring's shadow, as the studio's floor took it: drawn alone, the floor left out.
    const catcher = kind === 'card' && this.setup?.ground && this.ground.on.value > 0 ? this.catcher() : null
    if (catcher) this.scene.add(catcher)
    const clear = r.getClearAlpha()
    try {
      for (let s = 0; s < samples; s++) {
        // The scene as the picture wants it, only while its samples are drawn: the live view may run between batches.
        if (kind !== 'view' && this.setup) this.setup.group.visible = false
        // The card is drawn on clear ground and laid on the page's silk afterwards: a background drawn in the scene
        // would pass through the tone mapping and come out a shade off the page around it.
        this.scene.background = kind === 'view' ? background : null
        r.setClearAlpha(0)
        this.uniforms.still.value = 1
        this.uniforms.frame.value = s
        this.tracer.advance()
        acc.add(r, camera, (target) => traced.draw(r, this.scene, camera, target), kind === 'tryon' ? undefined : lens)
        this.uniforms.still.value = 0
        if (this.setup) this.setup.group.visible = true
        this.scene.background = background
        r.setClearAlpha(clear)
        // A breath every few samples, so the page stays responsive on a slow device.
        if (s % 6 === 5) await frame()
        if (this.disposed) return ''
      }
      const out = acc.resolve(r)
      let canvas = await readCanvas(r, out)
      out.dispose()
      if (kind === 'card') {
        const silk = document.createElement('canvas')
        silk.width = canvas.width
        silk.height = canvas.height
        const ctx = silk.getContext('2d')!
        ctx.fillStyle = '#f3efe6'
        ctx.fillRect(0, 0, silk.width, silk.height)
        ctx.drawImage(canvas, 0, 0)
        canvas = silk
      }
      return canvas.toDataURL(kind === 'tryon' ? 'image/png' : 'image/jpeg', 0.88)
    } catch {
      return ''
    } finally {
      acc.dispose()
      traced.dispose()
      if (catcher) {
        this.scene.remove(catcher)
        catcher.geometry.dispose()
        ;(catcher.material as Material).dispose()
      }
      this.paused = false
      if (!this.disposed) this.wake(120)
    }
  }

  /** The floor's shadow without the floor: dark where the ring takes the room's light, clear everywhere else. */
  private catcher(): Mesh {
    const m = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    m.colorNode = vec3(0)
    // The contact and the shade close under the ring; the faint dimming further out, which the floor's own grain hides,
    // would only dirty plain silk.
    m.opacityNode = smoothstep(0.18, 0.75, float(1).sub(groundShade(this.ground, positionWorld))).mul(0.72)
    const side = this.ground.shown.half.value * 2
    const mesh = new Mesh(new PlaneGeometry(side, side), m)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.copy(this.ground.shown.centre.value).setY(0.01)
    return mesh
  }

  dispose() {
    this.disposed = true
    this.stop()
    window.clearTimeout(this.busy)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost)
    this.renderer.domElement.removeEventListener('wheel', this.onWheel, true)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointer, true)
    this.observers.forEach((o) => o.disconnect())
    gsap.killTweensOf(this.camera.position)
    gsap.killTweensOf(this.controls.target)
    this.controls.dispose()
    this.model.dispose()
    if (this.setup) {
      release(this.setup.group)
      this.setup.background.dispose()
    }
    this.lighting.dispose()
    this.tracer.dispose()
    this.ground.dispose()
    this.frame.dispose()
    this.moving.dispose()
    this.still.dispose()
    this.accumulator.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
