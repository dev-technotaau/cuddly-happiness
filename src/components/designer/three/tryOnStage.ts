// The ring on the hand: a transparent picture laid over the camera's, the ring drawn where the finger is and turned
// with it, the finger itself (unseen) hiding the back of the band, the ring's shadow on the skin, and a light chosen for
// the room the picture shows. The same ring as the designer's: its parts, metals and traced stones, with its own light.
import { CylinderGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, NeutralToneMapping, PCFShadowMap, PerspectiveCamera, Scene, ShadowMaterial, SRGBColorSpace, Vector3, WebGLRenderer, type Material, type MeshPhysicalMaterial } from 'three'
import type { RingDesign } from '../../../data/ring'
import type { FingerPose } from '../../tryon/fingerPose'
import { Lighting, type LightPreset } from './lighting'
import { makeGemUniforms } from './materials'
import { RingModel } from './ringModel'

export class TryOnStage {
  readonly canvas: HTMLCanvasElement
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(14, 1, 1, 10)
  private lighting: Lighting
  private uniforms = makeGemUniforms()
  private model: RingModel
  // The ring's place on the finger (position, turn, scale), and the finger itself in the ring's own space.
  private holder = new Group()
  private finger = new Group()
  private fingerRadius = 0
  private sun = new DirectionalLight('#fff6ea', 0.55)
  private preset: LightPreset | null = null
  private observer: ResizeObserver
  private disposed = false
  w = 1
  h = 1

  constructor(private host: HTMLElement, private onLost?: () => void) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = NeutralToneMapping
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFShadowMap
    this.canvas = this.renderer.domElement
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' })
    host.appendChild(this.canvas)
    this.canvas.addEventListener('webglcontextlost', this.lost)

    this.lighting = new Lighting(this.renderer)
    this.model = new RingModel(false, this.uniforms)
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

  private lost = (e: Event) => {
    e.preventDefault()
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
  }

  /** Builds the ring, and a finger to wear it the size of the band's inside. */
  setDesign(d: RingDesign) {
    this.model.update(d)
    const L = this.model.layout!
    this.fit(L.band.inner)
    // The metal casts the shadow; the stones let the light through.
    this.model.root.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) m.castShadow = !!(m.material as MeshPhysicalMaterial).isMeshPhysicalMaterial
    })
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
      const { environment, cube } = this.lighting.use(preset)
      this.scene.environment = environment
      this.uniforms.envMap.value = cube
      this.preset = preset
    }
    this.renderer.toneMappingExposure = exposure
  }

  /** Puts the ring on the finger (in the stage's own pixels: x right, y down, z away), or takes it off (`null`). */
  setPose(p: FingerPose | null) {
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

  render() {
    if (!this.disposed) this.renderer.render(this.scene, this.camera)
  }

  /** The ring as placed now, rendered at once so the canvas still holds it, for a photograph being composed. */
  capture(): HTMLCanvasElement {
    this.render()
    return this.canvas
  }

  dispose() {
    this.disposed = true
    this.observer.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.lost)
    this.model.dispose()
    this.clearFinger()
    this.sun.dispose()
    this.lighting.dispose()
    this.renderer.dispose()
    this.canvas.remove()
  }
}
