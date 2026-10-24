// Builds a ring's hierarchy off the page's thread and hands the buffers back without copying them.
import { buildBVH, type Traceable } from './bvh'

const scope = self as unknown as { onmessage: ((e: MessageEvent<Traceable & { id: number }>) => void) | null; postMessage: (message: unknown, transfer: Transferable[]) => void }

scope.onmessage = (e) => {
  const { id, ...input } = e.data
  const bvh = buildBVH(input)
  scope.postMessage({ id, bvh }, [bvh.nodes.buffer, bvh.tris.buffer, bvh.norms.buffer])
}
