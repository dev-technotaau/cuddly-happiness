// The ring on the hand: a transparent picture laid over the camera's, the ring drawn where the finger is and turned
// with it, the finger itself (unseen) hiding the back of the band, the ring's shadow on the skin, and a light chosen for
// the room the picture shows. The same ring as the designer's: its parts, metals and traced stones, traced against
// itself too (raytrace.ts), with its own light.
// Following a live hand, each frame is anti-aliased over time (TRAA); on a photo, which holds still, it keeps drawing
// and averages a clean, photographic still, as the designer does. The photograph taken is drawn the same way.
import { CylinderGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, NoBlending, PCFShadowMap, PerspectiveCamera, RenderPipeline, Scene, ShadowMaterial, Vector2, Vector3, type Euler, type Material, type MeshPhysicalMaterial, type TextureNode, type WebGPURenderer } from 'three/webgpu'
import { float, mrt, output, pass, rtt, texture, uniform, velocity } from 'three/tsl'
import { traa } from 'three/examples/jsm/tsl/display/TRAANode.js'
import type { RingDesign } from '../../../data/ring'
import type { FingerPose } from '../../tryon/fingerPose'
import { Accumulator, averageType } from './accumulate'
import { makeGemUniforms, type GemUniforms } from './gemMaterial'
import { createRenderer, readCanvas, type Backend } from './gpu'
import { Lighting, type LightPreset } from './lighting'
import { RingTracer, TracedFrame, traceOutputs } from './raytrace'
import { RingModel } from './ringModel'

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

export class TryOnStage {
  readonly canvas: HTMLCanvasElement
  readonly backend: Backend
  private renderer: WebGPURenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(14, 1, 1, 10)
  private lighting: Lighting
  private uniforms: GemUniforms
  private tracer: RingTracer
  private frame: TracedFrame
  private model: RingModel
  // The ring's place on the finger (position, turn, scale), and the finger itself in the ring's own space.
  private holder = new Group()
  private finger = new Group()
  private fingerRadius = 0
  private sun = new DirectionalLight('#fff6ea', 0.55)
  private preset: LightPreset | null = null
  private observer: ResizeObserver
  private moving: RenderPipeline
  private still: RenderPipeline
  private traaNode: ReturnType<typeof traa>
  private stillTexture: TextureNode
  private accumulator: Accumulator
  private changed = true
  private movingFrames = 0
  private settling = false
  private raf = 0
  private idle = 0
  private capturing = false
  private disposed = false
  w = 1
  h = 1

  /** A stage over `host`, its renderer started (WebGPU, else WebGL 2). */
  static async create(host: HTMLElement, onLost?: () => void): Promise<TryOnStage> {
    const { renderer, backend } = await createRenderer(true)
    return new TryOnStage(host, renderer, backend, onLost)
  }

  private constructor(private host: HTMLElement, renderer: WebGPURenderer, backend: Backend, private onLost?: () => void) {
    this.renderer = renderer
    this.backend = backend
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFShadowMap
    this.canvas = renderer.domElement
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' })
    host.appendChild(this.canvas)
    this.canvas.addEventListener('webglcontextlost', this.lost)
    renderer.onDeviceLost = () => this.lost()

    this.lighting = new Lighting(renderer)
    this.uniforms = makeGemUniforms(this.lighting.gemCube)
    this.tracer = new RingTracer(this.uniforms)
    this.tracer.setEnvironment(this.lighting.use('studio').environment)
    // The rooms light a ring from above, where the designer's camera looks down on it; on a hand the stone faces the
    // lens, so the room is turned to bring its key light in front of the hand, as a photographer would light it. The
    // metals and the stones read the same turn.
    this.scene.environmentRotation.set(Math.PI / 2, 0, 0)
    this.frame = new TracedFrame(this.tracer, this.scene.environmentRotation)

    // Moving: the scene with the metals' outputs, their reflections traced over it, then TRAA, which keeps the stones'
    // sparkle steady as the hand moves. Still: the accumulated average.
    const scenePass = pass(this.scene, this.camera)
    scenePass.setMRT(mrt({ output, velocity, ...traceOutputs() }))
    const camera = { projection: uniform(this.camera.projectionMatrixInverse), world: uniform(this.camera.matrixWorld) }
    const traced = rtt(this.tracer.reflect(scenePass.getTextureNode('output'), scenePass.getTextureNode('depth'), scenePass.getTextureNode('rtNormal'), scenePass.getTextureNode('rtSpec'), camera, float(0)))
    // The pass draws without a scene of its own: the room turns as the scene's does, and its alpha (the picture under
    // the ring) passes through unblended.
    const quad = (traced as unknown as { _quadMesh: { material: { envMapRotation: Euler; blending: number } } })._quadMesh.material
    quad.envMapRotation = this.scene.environmentRotation
    quad.blending = NoBlending
    this.traaNode = traa(traced, scenePass.getTextureNode('depth'), scenePass.getTextureNode('velocity'), this.camera)
    // TRAA resolves with an opaque material, which forces alpha to 1 and would hide the picture under the ring; unblended,
    // its alpha flows through (three is pinned to 0.186.1, where the material is `_resolveMaterial`).
    const resolve = (this.traaNode as unknown as { _resolveMaterial?: { blending: number } })._resolveMaterial
    if (resolve) resolve.blending = NoBlending
    this.moving = new RenderPipeline(renderer, this.traaNode)
    this.accumulator = new Accumulator(1, 1, averageType(renderer))
    this.stillTexture = texture(this.accumulator.texture)
    this.still = new RenderPipeline(renderer, this.stillTexture)

    this.model = new RingModel(false, this.uniforms, this.tracer)
    this.model.onRedraw = () => {
      this.changed = true
      this.render()
    }
    this.tracer.bandF0.value = this.model.bandMetal.color
    this.tracer.headF0.value = this.model.headMetal.color
    this.holder.matrixAutoUpdate = false
    this.holder.visible = false
    this.holder.add(this.model.root, this.finger)
    this.scene.add(this.holder)

    // A soft key light above the lens: a glint on the metal, and the ring's shadow on the finger.
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.bias = -0.0005
    this.sun.shadow.normalBias = 0.02
    this.sun.shadow.radius = 5
    this.scene.add(this.sun, this.sun.target)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(host)
    this.resize()
    this.setLight('studio', 1)
  }

  private lost = (e?: Event) => {
    e?.preventDefault()
    this.onLost?.()
  }

  /** Matches the picture laid over: a long lens far away, so the stage's pixels are the scene's units at the ring. */
  resize() {
    const w = Math.max(1, this.host.clientWidth)
    const h = Math.max(1, this.host.clientHeight)
    this.w = w
    this.h = h
    this.renderer.setSize(w, h, false)
    const d = h * 4
    this.camera.fov = (2 * Math.atan(h / 2 / d) * 180) / Math.PI
    this.camera.aspect = w / h
    this.camera.near = d * 0.5
    this.camera.far = d * 1.5
    this.camera.position.set(w / 2, -h / 2, d)
    this.camera.lookAt(w / 2, -h / 2, 0)
    this.camera.updateProjectionMatrix()
    this.changed = true
  }

  /** Builds the ring, and a finger to wear it the size of the band's inside. */
  setDesign(d: RingDesign) {
    this.model.update(d)
    void this.retrace()
    const L = this.model.layout!
    this.fit(L.band.inner)
    // The metal casts the shadow; the stones let the light through.
    this.model.root.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) m.castShadow = !!(m.material as MeshPhysicalMaterial).isMeshPhysicalMaterial
    })
    this.changed = true
  }

  // The ring's own reflections: its hierarchy built afresh for each new shape (nothing is traced meanwhile).
  private async retrace() {
    const version = this.model.version
    this.tracer.clear()
    const ok = await this.tracer.load(this.model.traceable())
    if (this.disposed || !ok || version !== this.model.version) return
    this.tracer.on.value = 1
    this.changed = true
    this.render()
  }

  // Where the ring is now, for the rays.
  private follow() {
    this.holder.updateMatrixWorld()
    this.tracer.place(this.model.root.matrixWorld)
    this.tracer.bandRoughness.value = this.model.bandMetal.roughness
    this.tracer.headRoughness.value = this.model.headMetal.roughness
  }

  // The finger, along the ring's Z: 14 mm toward the hand, 38 toward the tip, narrowing a little. One copy writes only
  // depth, so the band's far side and a stone turned away are hidden as the real finger would; the other, a breath
  // larger, shows nothing but the shadow the ring casts on the skin.
  private fit(r: number) {
    if (r === this.fingerRadius) return
    this.fingerRadius = r
    this.clearFinger()
    const shape = (k: number) => new CylinderGeometry(r * k * 0.9, r * k, 52, 48).rotateX(Math.PI / 2).translate(0, 0, 12)
    const hide = new Mesh(shape(0.985), new MeshBasicMaterial({ colorWrite: false }))
    hide.renderOrder = -1
    const skin = new Mesh(shape(0.995), new ShadowMaterial({ opacity: 0.24, depthWrite: false }))
    skin.receiveShadow = true
    skin.renderOrder = 1
    this.finger.add(hide, skin)
  }

  private clearFinger() {
    for (const c of [...this.finger.children]) {
      const m = c as Mesh
      m.geometry.dispose()
      ;(m.material as Material).dispose()
      this.finger.remove(m)
    }
  }

  /** The room's light: one of the designer's, and how bright the picture is around the hand. */
  setLight(preset: LightPreset, exposure: number) {
    if (preset !== this.preset) {
      this.scene.environment = this.lighting.use(preset).environment
      this.tracer.setEnvironment(this.scene.environment)
      this.preset = preset
      this.changed = true
    }
    if (this.renderer.toneMappingExposure !== exposure) this.changed = true
    this.renderer.toneMappingExposure = exposure
  }

  /** Puts the ring on the finger (in the stage's own pixels: x right, y down, z away), or takes it off (`null`). */
  setPose(p: FingerPose | null) {
    this.changed = true
    this.holder.visible = !!p
    const L = this.model.layout
    if (!p || !L) return
    // The finger's width is the band's inside: that many stage pixels to the millimetre.
    const k = p.width / (2 * L.band.inner)
    // From the picture (y down, z away) to the scene (y up, z toward the lens): the finger is the ring's Z, the back of
    // the hand its Y, where the stone sits.
    const z = new Vector3(p.axis[0], -p.axis[1], -p.axis[2])
    const y = new Vector3(p.up[0], -p.up[1], -p.up[2])
    const x = new Vector3().crossVectors(y, z)
    const at = new Vector3(p.x, -p.y, 0)
    this.holder.matrix.makeBasis(x, y, z).scale(new Vector3(k, k, k)).setPosition(at)
    this.holder.matrixWorldNeedsUpdate = true
    // The key light comes from just above the lens, so the shadow stays close under the metal, where it touches the
    // skin; its shadow's box follows the ring.
    const reach = (L.band.inner + L.band.thickness + L.y.table) * k * 1.4
    this.sun.position.copy(at).addScaledVector(new Vector3(-0.18, 0.32, 0.93).normalize(), reach * 3)
    this.sun.target.position.copy(at)
    this.sun.target.updateMatrixWorld()
    const cam = this.sun.shadow.camera
    cam.left = -reach
    cam.right = reach
    cam.top = reach
    cam.bottom = -reach
    cam.near = reach * 0.5
    cam.far = reach * 6
    cam.updateProjectionMatrix()
  }

  /** Draws the ring as it is now, with TRAA. When nothing changes for a moment (a photo, a hand held still), the view
   *  settles: it keeps drawing by itself and accumulates a still until it is clean. */
  render() {
    if (this.disposed || this.capturing || !this.changed) return
    this.changed = false
    this.settling = false
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.idle)
    this.uniforms.still.value = 0
    this.follow()
    this.moving.render()
    this.movingFrames++
    // A live hand redraws about every 33 ms; settle only once the picture has held still a little longer.
    this.idle = window.setTimeout(() => (this.raf = requestAnimationFrame(this.settle)), 220)
  }

  private settle = () => {
    if (this.disposed || this.capturing || this.changed) return
    if (!this.settling) {
      this.settling = true
      const size = this.renderer.getDrawingBufferSize(new Vector2())
      this.accumulator.setSize(size.x, size.y)
      this.accumulator.reset((this.traaNode as unknown as { getTextureNode(): TextureNode }).getTextureNode().value, this.movingFrames >= 6 ? 6 : this.movingFrames >= 2 ? 2 : 0)
      this.movingFrames = 0
    }
    if (this.accumulator.drawn >= (this.backend === 'webgpu' ? 64 : 32)) return
    this.follow()
    this.uniforms.still.value = 1
    this.uniforms.frame.value = this.accumulator.drawn
    this.accumulator.add(this.renderer, this.camera, (target) => this.frame.draw(this.renderer, this.scene, this.camera, target))
    this.uniforms.still.value = 0
    this.stillTexture.value = this.accumulator.texture
    this.still.render()
    this.raf = requestAnimationFrame(this.settle)
  }

  /** The ring as placed now, drawn as a still of `width` × `height` (the stage, scaled) on transparent ground, for a
   *  photograph being composed. */
  async capture(width: number, height: number): Promise<HTMLCanvasElement | null> {
    if (this.disposed) return null
    this.capturing = true
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.idle)
    const acc = new Accumulator(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)), averageType(this.renderer))
    this.follow()
    try {
      const samples = this.backend === 'webgpu' ? 32 : 16
      for (let s = 0; s < samples; s++) {
        this.uniforms.still.value = 1
        this.uniforms.frame.value = s
        acc.add(this.renderer, this.camera, (target) => this.frame.draw(this.renderer, this.scene, this.camera, target))
        this.uniforms.still.value = 0
        if (s % 6 === 5) await frame()
        if (this.disposed) return null
      }
      const out = acc.resolve(this.renderer)
      const canvas = await readCanvas(this.renderer, out)
      out.dispose()
      return canvas
    } catch {
      return null
    } finally {
      acc.dispose()
      this.capturing = false
      this.changed = true
      if (!this.disposed) this.render()
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.clearTimeout(this.idle)
    this.observer.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.lost)
    this.model.dispose()
    this.tracer.dispose()
    this.frame.dispose()
    this.clearFinger()
    this.sun.dispose()
    this.lighting.dispose()
    this.moving.dispose()
    this.still.dispose()
    this.accumulator.dispose()
    this.renderer.dispose()
    this.canvas.remove()
  }
}
