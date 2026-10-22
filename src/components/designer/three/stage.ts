// The ring's stage: renderer, camera and controls, the light, the setup around the ring, and the camera's choreography.
// When a step opens, the camera glides to what it is about (the stone, the claws, the band, the inside for an
// engraving); the visitor can take over at any moment. It draws only while something moves, pauses off screen, lowers
// its resolution on a slow device, and it can photograph the ring: a card for the bag, or the ring alone, from above,
// for the try-on.
import gsap from 'gsap'
import { Color, Group, HalfFloatType, Matrix4, NeutralToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget, type Material, type Mesh, type Texture } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Layout, RingDesign } from '../../../data/ring'
import type { StepId } from '../../../data/ringAdvice'
import { Lighting, type LightPreset } from './lighting'
import { gemUniforms } from './materials'
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

export class Stage {
  readonly renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(28, 1, 0.5, 4000)
  private controls: OrbitControls
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private lighting: Lighting
  private model: RingModel
  private holder = new Group()
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
  // Drawing stops once nothing has moved for a moment; anything that moves pushes this back.
  private awakeUntil = 0
  private ratio: number
  private slow = 0
  private last = 0
  private preparing = false
  private queued: RingDesign | null = null
  private disposed = false

  constructor(private host: HTMLElement, private motion: boolean, private events: StageEvents = {}) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.ratio = Math.min(window.devicePixelRatio || 1, 1.75)
    this.renderer.setPixelRatio(this.ratio)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = NeutralToneMapping
    const canvas = this.renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.outline = 'none'
    host.appendChild(canvas)
    canvas.addEventListener('webglcontextlost', this.onLost)

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
    this.controls.addEventListener('change', () => this.wake(900))
    // The wheel zooms only with Ctrl or ⌘ held (a trackpad's pinch sends that too) or in full screen, so scrolling the
    // page over the ring still scrolls the page. Touch pinches always zoom.
    canvas.addEventListener('wheel', this.onWheel, { capture: true, passive: true })
    canvas.addEventListener('pointerdown', this.onPointer, true)

    // Post-processing draws into a multisampled target, so edges stay smooth through the bloom.
    this.composer = new EffectComposer(this.renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 }))
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    // Only the brightest sparks bloom (well above white in linear light): the stones' sparks and the metal's glints, never the backdrop.
    this.bloom = new UnrealBloomPass(new Vector2(256, 256), 0.14, 0.22, 2.4)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())

    this.lighting = new Lighting(this.renderer)
    this.model = new RingModel(motion)
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

  private onLost = (e: Event) => {
    e.preventDefault()
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
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(w, h)
    this.camera.aspect = w / h
    // A tall, narrow stage (phones) frames the ring from further away so it fits.
    this.camera.fov = w / h < 0.9 ? 34 : 28
    this.camera.updateProjectionMatrix()
    this.wake(300)
  }

  /** Keeps drawing for at least `ms` more. */
  private wake(ms = 1500) {
    this.awakeUntil = Math.max(this.awakeUntil, performance.now() + ms)
    if (this.running || !this.visible || document.hidden) return
    this.running = true
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private stop() {
    cancelAnimationFrame(this.raf)
    this.running = false
  }

  private tick = (now: number) => {
    this.controls.update()
    this.composer.render()
    if (this.exploded && this.events.onLabels && this.labelTick++ % 2 === 0) this.emitLabels()
    this.adapt(now)
    if (this.spinning || now < this.awakeUntil) this.raf = requestAnimationFrame(this.tick)
    else this.running = false
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
    this.wake(Math.max(duration, 0.9) * 1000 + 600)
  }

  // The first build compiles every shader before it plays (the stones' tracing takes the longest), so the assembly is
  // seen from its first moment rather than lost in the stall; the viewer keeps its veil up meanwhile.
  private async firstBuild(d: RingDesign) {
    this.preparing = true
    this.design = d
    const duration = this.model.update(d, true, true)
    this.placeSetup()
    try {
      await this.renderer.compileAsync(this.scene, this.camera)
    } catch {
      // Compiling ahead is an optimisation: the first frame compiles whatever is left.
    }
    if (this.disposed) return
    this.preparing = false
    this.model.release()
    this.frameSetup()
    this.events.onReady?.()
    this.building(duration)
    this.wake(Math.max(duration, 2.2) * 1000 + 600)
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
    this.scene.add(setup.group)
    this.scene.background = setup.background
    this.holder.matrix.copy(setup.ringAt)
    this.holder.matrixWorldNeedsUpdate = true
    const k = scaleOf(L)
    this.controls.maxPolarAngle = setup.maxPolar
    this.controls.minDistance = setup.distance * k * 0.3
    this.controls.maxDistance = setup.distance * k * 2.4
    if (frame) this.frameSetup()
    this.wake()
  }

  /** The setup's own framing, coming in from further out. */
  private frameSetup() {
    const s = this.setup!
    const k = scaleOf(this.model.layout!)
    const to = s.target.clone().addScaledVector(s.from, s.distance * k)
    if (this.motion) {
      this.camera.position.copy(s.target.clone().addScaledVector(s.from, s.distance * k * 1.6))
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
    if (next.preset || !gemUniforms.envMap.value) {
      const { environment, cube } = this.lighting.use(this.light.preset)
      this.scene.environment = environment
      gemUniforms.envMap.value = cube
    }
    this.renderer.toneMappingExposure = this.light.exposure
    this.scene.environmentRotation.set(0, this.light.angle, 0)
    // three samples a rotated environment with the inverse rotation; the stones do the same, so both turn together.
    gemUniforms.envRotation.value.setFromMatrix4(new Matrix4().makeRotationY(-this.light.angle))
    gemUniforms.fire.value = this.light.fire
    this.bloom.strength = 0.06 + 0.09 * this.light.fire
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
    this.glide(target.clone().addScaledVector(dir, frame.distance * k), target, 1.25)
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
    this.wake(duration * 1000 + 400)
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
    this.wake(6400)
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
    this.wake(1600)
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

  /** A picture of the ring: `card` on silk in the current light, `tryon` the ring alone from above (the back of the
   *  hand) on transparent ground, the finger running up the picture, or `view`, what the visitor sees. */
  snapshot(kind: 'card' | 'tryon' | 'view', width = 600, height = 750): string {
    if (!this.model.layout) return ''
    const r = this.renderer
    const size = r.getSize(new Vector2())
    const ratio = r.getPixelRatio()
    const background = this.scene.background
    const L = this.model.layout
    const fov = kind === 'tryon' ? 18 : 26
    const camera = new PerspectiveCamera(fov, width / height, 0.5, 4000)
    const rotation = new Matrix4().extractRotation(this.holder.matrix)
    const outer = L.band.inner + L.band.thickness
    const fit = (half: number) => half / Math.tan(((fov / 2) * Math.PI) / 180)
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
    }
    camera.updateProjectionMatrix()
    if (kind !== 'view' && this.setup) this.setup.group.visible = false
    this.scene.background = kind === 'tryon' ? null : kind === 'card' ? new Color('#f3efe6') : background
    r.setPixelRatio(1)
    r.setSize(width, height, false)
    r.setClearColor(0x000000, 0)
    r.render(this.scene, camera)
    const url = r.domElement.toDataURL(kind === 'tryon' ? 'image/png' : 'image/jpeg', 0.84)
    if (this.setup) this.setup.group.visible = true
    this.scene.background = background
    r.setPixelRatio(ratio)
    r.setSize(size.x, size.y, false)
    this.composer.setSize(size.x, size.y)
    this.composer.render()
    return url
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
    this.composer.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
