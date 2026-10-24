// The ring's own triangles, sorted for tracing: a bounding volume hierarchy built by the surface area heuristic (binned),
// flattened depth first with a skip link at every node, so the GPU walks it without a stack: into a node's box when the
// ray meets it, past the whole subtree when it doesn't. Laid out as rows of a float texture, which every GPU can read.
// Built in a worker (bvhWorker.ts) so the page never waits on it.

/** A ring's triangles, in its own space (millimetres): three corners each, their normals, what each is made of. */
export interface Traceable {
  /** Nine floats a triangle. */
  positions: Float32Array
  /** Nine floats a triangle, the corners' normals. */
  normals: Float32Array
  /** One float a triangle (see `TRACE_MATERIAL`). */
  materials: Float32Array
}

/** The hierarchy as texture rows of `TEX_WIDTH` RGBA texels. Nodes: two texels each, [min, skip] [max, leaf], the leaf
 *  being start × 16 + count (0 for an inner node). Triangles: three texels each, [v0, material] [e1, 0] [e2, 0]; their
 *  normals likewise, [n0] [n1] [n2]. */
export interface BVH {
  nodes: Float32Array
  tris: Float32Array
  norms: Float32Array
  nodeCount: number
  triCount: number
  /** The whole ring's box: min xyz, max xyz. */
  bounds: [number, number, number, number, number, number]
}

/** What a triangle is made of: the band's metal, the head's, or a stone (by type, from 3). */
export const TRACE_MATERIAL = { band: 0, head: 1, diamond: 3, sapphire: 4, ruby: 5, emerald: 6 } as const

export const TEX_WIDTH = 2048
/** The most triangles a leaf holds (the shader's inner loop). */
export const LEAF_MAX = 8
const LEAF = 4
const BINS = 16

/** Rows needed for `texels` texels. */
export const rowsFor = (texels: number) => Math.max(1, Math.ceil(texels / TEX_WIDTH))

export function buildBVH({ positions, normals, materials }: Traceable): BVH {
  const n = materials.length
  const cen = new Float32Array(n * 3)
  const box = new Float32Array(n * 6)
  for (let i = 0; i < n; i++) {
    const o = i * 9
    for (let a = 0; a < 3; a++) {
      const p0 = positions[o + a]
      const p1 = positions[o + 3 + a]
      const p2 = positions[o + 6 + a]
      const lo = Math.min(p0, p1, p2)
      const hi = Math.max(p0, p1, p2)
      box[i * 6 + a] = lo
      box[i * 6 + 3 + a] = hi
      cen[i * 3 + a] = (lo + hi) / 2
    }
  }
  const order = new Uint32Array(n)
  for (let i = 0; i < n; i++) order[i] = i

  // The tree in the order it is made: bounds, children (inner) or a range of `order` (leaf).
  const bounds: number[] = []
  const left: number[] = []
  const right: number[] = []
  const first: number[] = []
  const count: number[] = []
  const make = () => {
    left.push(-1)
    right.push(-1)
    first.push(0)
    count.push(0)
    bounds.push(0, 0, 0, 0, 0, 0)
    return left.length - 1
  }

  const binCount = new Int32Array(BINS)
  const binBox = new Float32Array(BINS * 6)
  const area = (b: ArrayLike<number>, o: number) => {
    const dx = b[o + 3] - b[o]
    const dy = b[o + 4] - b[o + 1]
    const dz = b[o + 5] - b[o + 2]
    return dx < 0 ? 0 : dx * dy + dy * dz + dz * dx
  }
  const leftArea = new Float32Array(BINS)
  const leftCount = new Int32Array(BINS)
  const acc = new Float32Array(6)
  const reset = (b: Float32Array, o: number) => {
    b[o] = b[o + 1] = b[o + 2] = Infinity
    b[o + 3] = b[o + 4] = b[o + 5] = -Infinity
  }
  const grow = (b: Float32Array, o: number, s: Float32Array, so: number) => {
    if (s[so] < b[o]) b[o] = s[so]
    if (s[so + 1] < b[o + 1]) b[o + 1] = s[so + 1]
    if (s[so + 2] < b[o + 2]) b[o + 2] = s[so + 2]
    if (s[so + 3] > b[o + 3]) b[o + 3] = s[so + 3]
    if (s[so + 4] > b[o + 4]) b[o + 4] = s[so + 4]
    if (s[so + 5] > b[o + 5]) b[o + 5] = s[so + 5]
  }

  const root = make()
  const stack: [number, number, number][] = n ? [[root, 0, n]] : []
  const nodeBox = new Float32Array(6)
  while (stack.length) {
    const [node, start, end] = stack.pop()!
    // The node's box, and its centroids' box.
    reset(nodeBox, 0)
    let cx0 = Infinity
    let cy0 = Infinity
    let cz0 = Infinity
    let cx1 = -Infinity
    let cy1 = -Infinity
    let cz1 = -Infinity
    for (let k = start; k < end; k++) {
      const t = order[k]
      grow(nodeBox, 0, box, t * 6)
      const x = cen[t * 3]
      const y = cen[t * 3 + 1]
      const z = cen[t * 3 + 2]
      if (x < cx0) cx0 = x
      if (y < cy0) cy0 = y
      if (z < cz0) cz0 = z
      if (x > cx1) cx1 = x
      if (y > cy1) cy1 = y
      if (z > cz1) cz1 = z
    }
    for (let a = 0; a < 6; a++) bounds[node * 6 + a] = nodeBox[a]
    const size = end - start
    const leaf = () => {
      first[node] = start
      count[node] = size
    }
    if (size <= LEAF) {
      leaf()
      continue
    }
    // Split along the centroids' longest axis, where the binned surface area heuristic says.
    const ex = cx1 - cx0
    const ey = cy1 - cy0
    const ez = cz1 - cz0
    const axis = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2
    const lo = axis === 0 ? cx0 : axis === 1 ? cy0 : cz0
    const extent = axis === 0 ? ex : axis === 1 ? ey : ez
    let split = -1
    let mid = start
    if (extent > 1e-9) {
      binCount.fill(0)
      for (let b = 0; b < BINS; b++) reset(binBox, b * 6)
      const scale = BINS / extent
      for (let k = start; k < end; k++) {
        const t = order[k]
        const b = Math.min(BINS - 1, Math.floor((cen[t * 3 + axis] - lo) * scale))
        binCount[b]++
        grow(binBox, b * 6, box, t * 6)
      }
      reset(acc, 0)
      let c = 0
      for (let b = 0; b < BINS - 1; b++) {
        if (binCount[b]) grow(acc, 0, binBox, b * 6)
        c += binCount[b]
        leftArea[b] = area(acc, 0)
        leftCount[b] = c
      }
      reset(acc, 0)
      c = 0
      let best = Infinity
      for (let b = BINS - 1; b > 0; b--) {
        if (binCount[b]) grow(acc, 0, binBox, b * 6)
        c += binCount[b]
        const lc = leftCount[b - 1]
        if (!lc || !c) continue
        const cost = leftArea[b - 1] * lc + area(acc, 0) * c
        if (cost < best) {
          best = cost
          split = b
        }
      }
      // A leaf is cheaper than any split (a box test plus its triangles), and small enough for the shader.
      if (split > 0 && size <= LEAF_MAX && best + area(nodeBox, 0) >= area(nodeBox, 0) * size) split = -1
      if (split > 0) {
        let i = start
        let j = end - 1
        while (i <= j) {
          const t = order[i]
          const b = Math.min(BINS - 1, Math.floor((cen[t * 3 + axis] - lo) * scale))
          if (b < split) i++
          else {
            order[i] = order[j]
            order[j] = t
            j--
          }
        }
        mid = i
      }
    }
    if (split <= 0 || mid === start || mid === end) {
      if (size <= LEAF_MAX) {
        leaf()
        continue
      }
      // Coincident centroids: halve the range.
      mid = start + (size >> 1)
    }
    const l = make()
    const r = make()
    left[node] = l
    right[node] = r
    stack.push([r, mid, end], [l, start, mid])
  }

  // Flattened depth first: a node's left child follows it; its skip link is where the walk goes past its subtree.
  const total = left.length
  const sub = new Int32Array(total)
  // Children are always made after their parent, so sizes add up from the end.
  for (let i = total - 1; i >= 0; i--) sub[i] = 1 + (left[i] >= 0 ? sub[left[i]] + sub[right[i]] : 0)
  const nodeCount = n ? total : 0
  const nodes = new Float32Array(rowsFor(Math.max(1, nodeCount) * 2) * TEX_WIDTH * 4)
  const walk: [number, number, number][] = n ? [[root, 0, total]] : []
  const pad = 1e-4
  while (walk.length) {
    const [i, at, skip] = walk.pop()!
    const o = at * 8
    nodes[o] = bounds[i * 6] - pad
    nodes[o + 1] = bounds[i * 6 + 1] - pad
    nodes[o + 2] = bounds[i * 6 + 2] - pad
    nodes[o + 3] = skip
    nodes[o + 4] = bounds[i * 6 + 3] + pad
    nodes[o + 5] = bounds[i * 6 + 4] + pad
    nodes[o + 6] = bounds[i * 6 + 5] + pad
    nodes[o + 7] = left[i] >= 0 ? 0 : first[i] * 16 + count[i]
    if (left[i] >= 0) {
      const l = at + 1
      const r = l + sub[left[i]]
      walk.push([right[i], r, skip], [left[i], l, r])
    }
  }

  // Triangles in leaf order: a corner and two edges, and the three corners' normals.
  const texels = rowsFor(Math.max(1, n) * 3) * TEX_WIDTH * 4
  const tris = new Float32Array(texels)
  const norms = new Float32Array(texels)
  for (let k = 0; k < n; k++) {
    const t = order[k]
    const s = t * 9
    const o = k * 12
    const x0 = positions[s]
    const y0 = positions[s + 1]
    const z0 = positions[s + 2]
    tris[o] = x0
    tris[o + 1] = y0
    tris[o + 2] = z0
    tris[o + 3] = materials[t]
    tris[o + 4] = positions[s + 3] - x0
    tris[o + 5] = positions[s + 4] - y0
    tris[o + 6] = positions[s + 5] - z0
    tris[o + 8] = positions[s + 6] - x0
    tris[o + 9] = positions[s + 7] - y0
    tris[o + 10] = positions[s + 8] - z0
    for (let c = 0; c < 3; c++) {
      norms[o + c * 4] = normals[s + c * 3]
      norms[o + c * 4 + 1] = normals[s + c * 3 + 1]
      norms[o + c * 4 + 2] = normals[s + c * 3 + 2]
    }
  }
  const b = n ? bounds.slice(0, 6) : [0, 0, 0, 0, 0, 0]
  return { nodes, tris, norms, nodeCount, triCount: n, bounds: b as BVH['bounds'] }
}
