// The GPU the 3D views draw with. WebGPU where the browser has it, for the headroom the stones' tracing and the
// accumulated stills want; elsewhere WebGL 2 through the same renderer, so one set of materials serves both.
import { NeutralToneMapping, SRGBColorSpace, WebGPURenderer, type RenderTarget } from 'three/webgpu'

export type Backend = 'webgpu' | 'webgl2'

export const isWebGPU = (r: WebGPURenderer) => !!(r.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend

/** A renderer ready to draw: WebGPU, or WebGL 2 where WebGPU can't start. In development `?gl=webgl` forces WebGL 2. */
export async function createRenderer(alpha: boolean): Promise<{ renderer: WebGPURenderer; backend: Backend }> {
  const forceWebGL = import.meta.env.DEV && new URLSearchParams(location.search).get('gl') === 'webgl'
  const renderer = new WebGPURenderer({ antialias: false, alpha, powerPreference: 'high-performance', forceWebGL })
  await renderer.init()
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  return { renderer, backend: isWebGPU(renderer) ? 'webgpu' : 'webgl2' }
}

/** An 8-bit render target's pixels on a canvas: rows from the top, colour unpremultiplied where partly transparent. */
export async function readCanvas(renderer: WebGPURenderer, rt: RenderTarget): Promise<HTMLCanvasElement> {
  const w = rt.width
  const h = rt.height
  const raw = (await renderer.readRenderTargetPixelsAsync(rt, 0, 0, w, h)) as Uint8Array
  const webgpu = isWebGPU(renderer)
  // WebGPU pads each row to 256 bytes and reads the top row first; WebGL packs them and reads from the bottom.
  const stride = webgpu ? Math.ceil((w * 4) / 256) * 256 : w * 4
  const img = new ImageData(w, h)
  const out = img.data
  for (let y = 0; y < h; y++) {
    const from = (webgpu ? y : h - 1 - y) * stride
    const to = y * w * 4
    for (let x = 0; x < w * 4; x += 4) {
      const a = raw[from + x + 3]
      const k = a > 0 && a < 255 ? 255 / a : 1
      out[to + x] = Math.min(255, raw[from + x] * k)
      out[to + x + 1] = Math.min(255, raw[from + x + 1] * k)
      out[to + x + 2] = Math.min(255, raw[from + x + 2] * k)
      out[to + x + 3] = a
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.putImageData(img, 0, 0)
  return canvas
}
