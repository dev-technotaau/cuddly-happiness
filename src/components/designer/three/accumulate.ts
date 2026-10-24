// Progressive supersampling. The same view drawn again and again, the camera nudged by a fraction of a pixel each time
// (and, in the stones, a new wavelength and new chances at every facet; in the metals, a new direction across their
// gloss), averaged in high dynamic range. A still view so converges to what a camera would record: clean edges, smooth
// facets, true fire, no noise. (Averaged as is: a stone's samples are single wavelengths, saturated colours that only add
// up to white when each counts in full.) The average is kept in 32-bit floats where the GPU can draw into them: a half
// float's rounding, a fraction of its last bit at every sample, adds up over a still's hundred samples to a picture a
// percent or two darker than its samples.
import { FloatType, HalfFloatType, NearestFilter, NoBlending, NodeMaterial, NoToneMapping, QuadMesh, RenderTarget, RendererUtils, SRGBColorSpace, UnsignedByteType, type PerspectiveCamera, type Texture, type TextureDataType, type ToneMapping, type WebGPURenderer } from 'three/webgpu'
import { mix, renderOutput, texture, uniform } from 'three/tsl'

/** Halton sequence in base `b`: sub-pixel offsets in [0, 1) that cover the pixel evenly. */
export function halton(i: number, b: number): number {
  let f = 1
  let r = 0
  while (i > 0) {
    f /= b
    r += f * (i % b)
    i = Math.floor(i / b)
  }
  return r
}


/** What a running average keeps its light in: 32-bit floats wherever the GPU can draw into them (always on WebGPU; on
 *  WebGL 2 with `EXT_color_buffer_float`), half floats elsewhere. */
export function averageType(renderer: WebGPURenderer): TextureDataType {
  const backend = renderer.backend as unknown as { isWebGPUBackend?: boolean; gl?: WebGL2RenderingContext }
  if (backend.isWebGPUBackend) return FloatType
  return backend.gl?.getExtension('EXT_color_buffer_float') ? FloatType : HalfFloatType
}

/** A lens for a still: the aperture's radius and the distance in focus, both in scene units. */
export interface Lens {
  aperture: number
  focus: number
}

// The renderer's state, kept while a sample or the picture is drawn and given back after.
let state = {} as Parameters<typeof RendererUtils.resetRendererState>[1]

export class Accumulator {
  /** Where each new sample is drawn (with its own depth). */
  readonly sample: RenderTarget
  private targets: [RenderTarget, RenderTarget]
  private current = 0
  /** Samples folded in, a seed counting for its weight. */
  count = 0
  /** Samples drawn since the reset: the jitter's index, and the stones' random seed. */
  drawn = 0
  private seed: { texture: Texture; weight: number } | null = null
  private previous = texture(null as unknown as Texture)
  private weight = uniform(1)
  private quad: QuadMesh
  private material = new NodeMaterial()
  // The seed, read at any size.
  private seedTexture = texture(null as unknown as Texture)
  private seedQuad: QuadMesh
  private seedMaterial = new NodeMaterial()

  /** `type`: what the average is kept in (`averageType`). Its targets are read texel for texel, so unfiltered (a 32-bit
   *  float texture may not filter). */
  constructor(width: number, height: number, type: TextureDataType = HalfFloatType) {
    this.sample = new RenderTarget(width, height, { type: HalfFloatType })
    this.targets = [0, 1].map(() => new RenderTarget(width, height, { type, depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter })) as [RenderTarget, RenderTarget]
    this.previous.value = this.targets[0].texture
    this.material.colorNode = mix(this.previous, texture(this.sample.texture), this.weight)
    // Not blended: an opaque node material would force alpha to 1, and a transparent ground must stay transparent.
    this.material.blending = NoBlending
    this.material.name = 'Accumulator.blend'
    this.quad = new QuadMesh(this.material)
    this.seedMaterial.colorNode = this.seedTexture
    this.seedMaterial.blending = NoBlending
    this.seedMaterial.name = 'Accumulator.seed'
    this.seedQuad = new QuadMesh(this.seedMaterial)
  }

  /** The average so far. */
  get texture(): Texture {
    return this.targets[this.current].texture
  }

  get width() {
    return this.sample.width
  }

  get height() {
    return this.sample.height
  }

  setSize(width: number, height: number) {
    if (width === this.sample.width && height === this.sample.height) return
    this.sample.setSize(width, height)
    this.targets.forEach((t) => t.setSize(width, height))
    this.reset()
  }

  /** Starts again; a `seed` image (linear light, any size) stands for `weight` samples, so the average refines it. */
  reset(seed?: Texture, weight = 0) {
    this.count = 0
    this.drawn = 0
    this.seed = seed && weight > 0 ? { texture: seed, weight } : null
  }

  /** Draws one more sample with `draw` (into the target it is given) from `camera`, nudged within the pixel (and, given
   *  a `lens`, across its aperture, the plane in focus held still), and folds it into the average. */
  add(renderer: WebGPURenderer, camera: PerspectiveCamera, draw: (target: RenderTarget) => void, lens?: Lens) {
    // Saved, not reset: the sample keeps the caller's clear colour, so a transparent ground stays transparent.
    state = RendererUtils.saveRendererState(renderer, state)
    renderer.setMRT(null)
    if (this.seed) {
      this.seedTexture.value = this.seed.texture
      renderer.setRenderTarget(this.targets[this.current])
      this.seedQuad.render(renderer)
      this.count = this.seed.weight
      this.seed = null
    }
    const w = this.sample.width
    const h = this.sample.height
    this.drawn++
    let x = halton(this.drawn, 2) - 0.5
    let y = halton(this.drawn, 3) - 0.5
    const position = camera.position.clone()
    if (lens && lens.aperture > 0) {
      // A point on the aperture (a disc, evenly covered), the camera moved there, and the view turned back so the plane
      // in focus lands where it did: nearer and further things blur, as through a lens.
      const r = Math.sqrt(halton(this.drawn, 5)) * lens.aperture
      const a = halton(this.drawn, 7) * Math.PI * 2
      const dx = Math.cos(a) * r
      const dy = Math.sin(a) * r
      camera.updateMatrixWorld()
      const right = camera.matrixWorld.elements
      camera.position.set(position.x + right[0] * dx + right[4] * dy, position.y + right[1] * dx + right[5] * dy, position.z + right[2] * dx + right[6] * dy)
      camera.updateMatrixWorld()
      const pixels = h / (2 * lens.focus * Math.tan((camera.fov * Math.PI) / 360))
      x -= dx * pixels
      y += dy * pixels
    }
    camera.setViewOffset(w, h, x, y, w, h)
    draw(this.sample)
    camera.clearViewOffset()
    if (lens && lens.aperture > 0) {
      camera.position.copy(position)
      camera.updateMatrixWorld()
    }
    const next = 1 - this.current
    this.previous.value = this.targets[this.current].texture
    this.weight.value = 1 / (this.count + 1)
    renderer.setRenderTarget(this.targets[next])
    this.quad.render(renderer)
    this.current = next
    this.count++
    RendererUtils.restoreRendererState(renderer, state)
  }

  /** The average as an 8-bit picture: tone mapped and in sRGB, as the screen would show it. */
  resolve(renderer: WebGPURenderer, toneMapping: ToneMapping = renderer.toneMapping): RenderTarget {
    const out = new RenderTarget(this.width, this.height, { type: UnsignedByteType, depthBuffer: false })
    const m = new NodeMaterial()
    m.blending = NoBlending
    m.colorNode = renderOutput(texture(this.texture), toneMapping === NoToneMapping ? NoToneMapping : toneMapping, SRGBColorSpace)
    state = RendererUtils.resetRendererState(renderer, state)
    renderer.setRenderTarget(out)
    new QuadMesh(m).render(renderer)
    RendererUtils.restoreRendererState(renderer, state)
    m.dispose()
    return out
  }

  dispose() {
    this.sample.dispose()
    this.targets.forEach((t) => t.dispose())
    this.material.dispose()
    this.seedMaterial.dispose()
  }
}
