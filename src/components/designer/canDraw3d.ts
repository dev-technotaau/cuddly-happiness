/** Whether this browser can draw the ring in 3D: WebGPU, or WebGL 2 for the renderer's fallback. Free of three.js, so
 *  pages can ask before the engine loads. */
export default function canDraw3d(): boolean {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return true
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}
