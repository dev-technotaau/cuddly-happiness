// The ring as a scene: its parts built from the design and rebuilt only when they change, each with its own entrance.
// The band draws itself around the finger, the basket rises, every claw grows from it, the stone drops into place,
// halo and pavé stones follow in a ripple; a new metal is a colour that turns, not a rebuild. The exploded view lifts
// the parts apart and reports where each one is, for its label.
import gsap from 'gsap'
import { BufferGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3, type Material, type MeshPhysicalMaterial, type Object3D, type ShaderMaterial, type Texture } from 'three'
import type { MeshBVHUniformStruct } from 'three-mesh-bvh'
import { headMetal, layoutOf, type Layout, type RingDesign } from '../../../data/ring'
import { gemGeometry } from './gems'
import { METAL_LOOK, engravingMaterial, gemUniforms, meleeGem, metalMaterial, retintMetal, textTexture, tracedGem, type GemUniforms } from './materials'
import { bandGeometries, bandStones, basketRail, bezel, cathedral, claws, engravingStrip, haloGallery, haloStones, hiddenHaloStones, milgrain, peekabooStones, seat, sideStones, surpriseStone } from './parts'

export type PartId = 'centre' | 'head' | 'band' | 'halo' | 'pave' | 'sides' | 'accents' | 'engraving'

const FONT_CSS = { script: "'Pinyon Script', cursive", serif: "italic 500 'Baskervville', serif", block: "500 'Jost', sans-serif" } as const

interface Part {
  group: Group
  sig: string
  /** Its entrance, played when it is (re)built. */
  enter: (tl: gsap.core.Timeline, at: number) => void
}

const melee = gemGeometry('round', 1, 1, 2)

/** Marks a material as its part's own (a traced stone, the engraving), so it is freed with the part; the metals and
 *  the melee material are shared and live as long as the model. */
const owned = <T extends Material>(m: T): T => {
  m.userData.owned = true
  return m
}

/** Removes and frees an object's meshes: geometry (not the shared melee and bead shapes), instance buffers, and the
 *  part's own materials with their textures and stone BVHs. */
function dispose(o: Object3D) {
  o.traverse((c) => {
    const m = c as Mesh
    if (m.geometry && m.geometry !== melee && m.geometry !== beadGeometry) m.geometry.dispose()
    if ((c as InstancedMesh).isInstancedMesh) (c as InstancedMesh).dispose()
    const mat = m.material as (Material & { alphaMap?: Texture | null }) | Material[] | undefined
    if (!mat || Array.isArray(mat) || !mat.userData.owned) return
    ;((mat as ShaderMaterial).uniforms?.bvh?.value as MeshBVHUniformStruct | undefined)?.dispose()
    mat.alphaMap?.dispose()
    mat.dispose()
  })
  o.removeFromParent()
}

export class RingModel {
  readonly root = new Group()
  /** Where each part's label points, in the ring's space. */
  readonly anchors = new Map<PartId, Vector3>()
  layout: Layout | null = null
  private parts = new Map<PartId, Part>()
  private bandMetal: MeshPhysicalMaterial
  private headMetal: MeshPhysicalMaterial
  private meleeMat: ShaderMaterial
  private uniforms: GemUniforms
  private design: RingDesign | null = null
  private exploded = false
  private motion: boolean
  private held: gsap.core.Timeline | null = null

  /** `uniforms`: the light its stones read; the designer's own by default, another renderer brings its own. */
  constructor(motion: boolean, uniforms: GemUniforms = gemUniforms) {
    this.motion = motion
    this.uniforms = uniforms
    this.bandMetal = metalMaterial('platinum')
    this.headMetal = metalMaterial('platinum')
    this.meleeMat = meleeGem('diamond', uniforms)
  }

  /** Builds what changed; `first` plays the whole assembly. A change of measure only (a weight, a width, a size, as a
   *  slider is dragged) swaps the parts at once, without entrances, so the ring follows the hand. Returns how long the
   *  animation runs (s). */
  update(d: RingDesign, first = false, hold = false): number {
    const prev = this.design
    this.design = d
    const L = layoutOf(d)
    this.layout = L
    this.retint(d, !first && !!prev)
    const quick = !first && !!prev && measureOnly(prev, d)
    // Each part's signature: everything that changes its shape or where it sits (the band's height moves the head).
    const seat = [d.size, d.band.form, d.band.width, d.setting.height, d.setting.cathedral]
    const sigs: Record<PartId, string> = {
      band: JSON.stringify([d.band.form, d.band.width, d.band.taper, d.size]),
      head: JSON.stringify([d.stone.shape, d.stone.type, d.stone.carat, d.setting, d.prongs, d.details.hiddenHalo, d.details.peekaboo, d.band.taper, seat]),
      centre: JSON.stringify([d.stone.shape, d.stone.type, d.stone.carat, seat]),
      halo: JSON.stringify([d.setting.style, d.stone.shape, d.stone.carat, d.details.hiddenHalo, d.details.peekaboo, seat]),
      pave: JSON.stringify([d.band, d.size, d.stone.shape, d.stone.carat, d.setting.style, d.setting.sides, d.setting.sideCarat]),
      sides: JSON.stringify([d.setting.style, d.setting.sides, d.setting.sideCarat, d.stone.shape, d.stone.carat, seat]),
      accents: JSON.stringify([d.details.surprise, d.details.milgrain, d.band, d.size, d.stone.shape, d.stone.carat]),
      engraving: JSON.stringify([d.details.engraving, d.details.font, d.size, d.band.width]),
    }
    const tl = gsap.timeline({ paused: !this.motion || hold })
    const order: PartId[] = ['band', 'head', 'centre', 'halo', 'sides', 'pave', 'accents', 'engraving']
    const at: Record<PartId, number> = first ? { band: 0, head: 0.75, centre: 1.25, halo: 1.6, sides: 1.45, pave: 1.0, accents: 1.9, engraving: 2.1 } : { band: 0, head: 0, centre: 0.1, halo: 0.2, sides: 0.15, pave: 0.1, accents: 0.25, engraving: 0.2 }
    for (const id of order) {
      const old = this.parts.get(id)
      if (old && old.sig === sigs[id]) {
        // Unchanged, but it may sit at a new height (a new size moves everything).
        continue
      }
      const part = this.build(id, d, L)
      if (old) {
        if (quick) dispose(old.group)
        else this.leave(old, tl)
      }
      if (part) {
        part.sig = sigs[id]
        this.root.add(part.group)
        this.parts.set(id, part)
        if (this.exploded) part.group.position.copy(this.offset(id))
        if (!quick) part.enter(tl, at[id])
      } else this.parts.delete(id)
    }
    this.setAnchors(L)
    if (!this.motion) tl.progress(1)
    else if (hold) this.held = tl
    else tl.play()
    return this.motion ? tl.duration() : 0
  }

  /** Plays an assembly held back (its parts wait at their start, unseen) while the shaders compiled. */
  release() {
    this.held?.play()
    this.held = null
  }

  /** Metals tween to the new alloy and finish; the claws can differ from the band. */
  private retint(d: RingDesign, animate: boolean) {
    const band = d.metal.band
    const head = headMetal(d)
    // A hammered finish is the band's: the claws and head stay polished, as the bench leaves them.
    const to = (m: MeshPhysicalMaterial, metal: typeof band) => {
      const c = new Color(METAL_LOOK[metal].color)
      retintMetal(m, metal, m === this.headMetal && d.metal.finish === 'hammered' ? 'polished' : d.metal.finish)
      if (animate && this.motion) gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.8, ease: 'power2.out' })
      else m.color.copy(c)
    }
    to(this.bandMetal, band)
    to(this.headMetal, head)
  }

  private mesh(geometry: BufferGeometry, material: Material, parent: Group) {
    const m = new Mesh(geometry, material)
    parent.add(m)
    return m
  }

  private build(id: PartId, d: RingDesign, L: Layout): Part | null {
    const group = new Group()
    group.name = id
    const motion = this.motion
    switch (id) {
      case 'band': {
        const geos = bandGeometries(d, L)
        const meshes = geos.map((g) => this.mesh(g, this.bandMetal, group))
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            // The band draws itself around the finger.
            for (const m of meshes) {
              const total = m.geometry.index!.count
              const state = { p: 0 }
              m.geometry.setDrawRange(0, 0)
              tl.to(state, { p: 1, duration: motion ? 1.1 : 0, ease: 'power3.inOut', onUpdate: () => m.geometry.setDrawRange(0, Math.ceil((state.p * total) / 6) * 6) }, at)
            }
          },
        }
      }
      case 'head': {
        const parts: Mesh[] = []
        if (d.setting.style === 'bezel') for (const g of bezel(d, L)) parts.push(this.mesh(g, this.headMetal, group))
        else {
          parts.push(this.mesh(basketRail(d, L), this.headMetal, group))
          if (L.centre.depth > 4.2) parts.push(this.mesh(basketRail(d, L, 0.18, 0.42, 0.28), this.headMetal, group))
        }
        parts.push(this.mesh(seat(L), this.headMetal, group))
        if (L.halo) parts.push(this.mesh(haloGallery(d, L), this.headMetal, group))
        if (d.setting.cathedral) for (const g of cathedral(d, L)) parts.push(this.mesh(g, this.bandMetal, group))
        if (L.sides) for (const g of sideStones(d, L).claws) parts.push(this.mesh(g, this.headMetal, group))
        // Each claw in its own group at its base, so it can grow from there.
        const growers: Group[] = []
        for (const c of claws(d, L)) {
          const g = new Group()
          g.position.copy(c.base)
          c.geometry.translate(-c.base.x, -c.base.y, -c.base.z)
          g.add(new Mesh(c.geometry, this.headMetal))
          if (c.cap) {
            c.cap.translate(-c.base.x, -c.base.y, -c.base.z)
            g.add(new Mesh(c.cap, this.headMetal))
          }
          group.add(g)
          growers.push(g)
        }
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            tl.from(group.position, { y: -2.5, duration: 0.7, ease: 'power3.out' }, at)
            tl.from(parts.map((p) => p.scale), { x: 0.6, y: 0.6, z: 0.6, duration: 0.6, ease: 'power3.out' }, at)
            if (growers.length) tl.from(growers.map((g) => g.scale), { y: 0.001, duration: 0.55, ease: 'power3.out', stagger: 0.06 }, at + 0.2)
          },
        }
      }
      case 'centre': {
        const g = gemGeometry(d.stone.shape, L.centre.width, L.centre.length / L.centre.width)
        const mat = owned(tracedGem(g, d.stone.type, this.uniforms))
        const m = this.mesh(g, mat, group)
        m.onBeforeRender = () => (mat.uniforms.modelMatrixInverse.value as Matrix4).copy(m.matrixWorld).invert()
        m.position.y = L.y.girdle
        m.renderOrder = 2
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            // The stone drops into its claws, turning as it settles.
            tl.from(m.position, { y: L.y.girdle + 11, duration: 1, ease: 'power3.out' }, at)
            tl.from(m.rotation, { y: Math.PI * 0.75, duration: 1.1, ease: 'power3.out' }, at)
            tl.from(m.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.8, ease: 'power3.out' }, at)
            tl.from(mat.uniforms.opacity, { value: 0, duration: 0.5 }, at)
          },
        }
      }
      case 'halo': {
        if (!L.halo && !L.hiddenHalo && !L.peekaboo) return null
        const sets: InstancedMesh[] = []
        const add = (mats: Matrix4[], geometry: BufferGeometry, material: Material, scale = 1) => {
          const inst = new InstancedMesh(geometry, material, mats.length)
          mats.forEach((mx, i) => inst.setMatrixAt(i, scale === 1 ? mx : mx.clone().scale(new Vector3(scale, scale, scale))))
          inst.instanceMatrix.needsUpdate = true
          group.add(inst)
          sets.push(inst)
        }
        if (L.halo) {
          const h = haloStones(d, L)
          add(h.stones, melee, this.meleeMat)
          add(h.beads, beadGeometry, this.headMetal, 0.17)
        }
        if (L.hiddenHalo) add(hiddenHaloStones(d, L), melee, this.meleeMat)
        if (L.peekaboo) add(peekabooStones(d, L), melee, this.meleeMat)
        return { group, sig: '', enter: (tl, at) => sets.forEach((s, i) => ripple(tl, s, at + i * 0.08, 0.7)) }
      }
      case 'sides': {
        if (!L.sides) return null
        const s = sideStones(d, L)
        const shape = d.setting.sides === 'baguette' ? 'emerald' : d.setting.sides
        const geo = gemGeometry(shape, s.sizes.width, s.sizes.length / s.sizes.width)
        const meshes = s.at.map((mx) => {
          const mat = owned(tracedGem(geo, 'diamond', this.uniforms))
          const m = this.mesh(geo, mat, group)
          m.applyMatrix4(mx)
          m.onBeforeRender = () => (mat.uniforms.modelMatrixInverse.value as Matrix4).copy(m.matrixWorld).invert()
          m.renderOrder = 2
          return m
        })
        return { group, sig: '', enter: (tl, at) => meshes.forEach((m, i) => tl.from(m.position, { y: m.position.y + 7, duration: 0.85, ease: 'power3.out' }, at + i * 0.12)) }
      }
      case 'pave': {
        if (!L.pave) return null
        const p = bandStones(d, L)
        const stones = new InstancedMesh(melee, this.meleeMat, p.stones.length)
        p.stones.forEach((mx, i) => stones.setMatrixAt(i, mx))
        group.add(stones)
        let beads: InstancedMesh | null = null
        if (p.beads.length) {
          beads = new InstancedMesh(beadGeometry, this.bandMetal, p.beads.length)
          p.beads.forEach((mx, i) => beads!.setMatrixAt(i, mx.clone().scale(new Vector3(0.17, 0.17, 0.17))))
          group.add(beads)
        }
        for (const r of p.rails) this.mesh(r, this.bandMetal, group)
        return { group, sig: '', enter: (tl, at) => ripple(tl, stones, at, 1, p.order) }
      }
      case 'accents': {
        const sets: InstancedMesh[] = []
        if (L.surprise) {
          const s = new InstancedMesh(melee, this.meleeMat, 1)
          s.setMatrixAt(0, surpriseStone(L))
          group.add(s)
          sets.push(s)
        }
        if (d.details.milgrain) {
          const headArc = Math.atan2(L.centre.width * 0.5 + 0.8, L.y.bandTop)
          const mats = milgrain(L, headArc)
          const m = new InstancedMesh(beadGeometry, this.bandMetal, mats.length)
          mats.forEach((mx, i) => m.setMatrixAt(i, mx.clone().scale(new Vector3(0.12, 0.12, 0.12))))
          group.add(m)
          sets.push(m)
        }
        if (!sets.length) return null
        return { group, sig: '', enter: (tl, at) => sets.forEach((s) => ripple(tl, s, at, 0.8)) }
      }
      case 'engraving': {
        const text = d.details.engraving.trim()
        if (!text) return null
        const length = Math.min(L.band.inner * 2.2, 2.2 + text.length * 1.05)
        const tex = textTexture(text, `${d.details.font === 'block' ? 74 : 92}px ${FONT_CSS[d.details.font]}`, 1024, 128, { tracking: d.details.font === 'block' ? 14 : 2 })
        const mat = owned(engravingMaterial(this.bandMetal.color, tex))
        this.mesh(engravingStrip(L, length), mat, group)
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            tl.from(mat, { opacity: 0, duration: 0.9 }, at)
          },
        }
      }
    }
    return null
  }

  /** An old part shrinks away and is freed. */
  private leave(part: Part, tl: gsap.core.Timeline) {
    const g = part.group
    if (!this.motion) {
      dispose(g)
      return
    }
    tl.to(g.scale, { x: 0.94, y: 0.94, z: 0.94, duration: 0.25, ease: 'power2.in', onComplete: () => dispose(g) }, 0)
    g.traverse((c) => {
      const mat = (c as Mesh).material as ShaderMaterial | undefined
      if (mat?.uniforms?.opacity) tl.to(mat.uniforms.opacity, { value: 0, duration: 0.25 }, 0)
    })
    tl.set(g, { visible: false }, 0.25)
  }

  /** Lifts the parts apart (or back together). */
  explode(on: boolean) {
    this.exploded = on
    for (const [id, part] of this.parts) {
      const to = on ? this.offset(id) : new Vector3()
      if (this.motion) gsap.to(part.group.position, { x: to.x, y: to.y, z: to.z, duration: 1.1, ease: 'power3.inOut' })
      else part.group.position.copy(to)
    }
  }

  private offset(id: PartId): Vector3 {
    const lift: Partial<Record<PartId, [number, number, number]>> = { centre: [0, 11, 0], head: [0, 5.5, 0], halo: [0, 8, 0], sides: [0, 7.5, 0], engraving: [0, -4, 0], accents: [0, 0, 0], pave: [0, 0, 0], band: [0, 0, 0] }
    const [x, y, z] = lift[id] ?? [0, 0, 0]
    return new Vector3(x, y, z)
  }

  /** Where each part's label points: the stone's table, the claws, the band's side, the inside. */
  private setAnchors(L: Layout) {
    this.anchors.clear()
    this.anchors.set('centre', new Vector3(0, L.y.table, 0))
    this.anchors.set('head', new Vector3(L.centre.width * 0.55, (L.y.culet + L.y.girdle) / 2, 0))
    this.anchors.set('band', new Vector3(L.band.inner + L.band.thickness, -2, 0).applyAxisAngle(new Vector3(0, 0, 1), -1.1))
    if (L.halo || L.hiddenHalo) this.anchors.set('halo', new Vector3(-L.centre.width * 0.62, L.y.girdle, 0))
    if (L.sides) this.anchors.set('sides', new Vector3(-L.sides.offset, L.y.girdle, 0))
    if (L.pave) this.anchors.set('pave', new Vector3(-(L.band.inner + L.band.thickness) * Math.sin(1.0), (L.band.inner + L.band.thickness) * Math.cos(1.0), 0))
    if (this.design?.details.engraving.trim()) this.anchors.set('engraving', new Vector3(0, -L.band.inner, 0))
  }

  /** The current position of a part's anchor, exploded or not, in the ring's space. */
  anchorOf(id: PartId): Vector3 | null {
    const a = this.anchors.get(id)
    const part = this.parts.get(id)
    if (!a) return null
    return part ? a.clone().add(part.group.position) : a.clone()
  }

  dispose() {
    for (const p of this.parts.values()) dispose(p.group)
    this.parts.clear()
    this.bandMetal.dispose()
    this.headMetal.dispose()
    this.meleeMat.dispose()
  }
}

/** Whether two designs differ only in their measures: the stone's or side stones' weight, the band's width, the size. */
function measureOnly(a: RingDesign, b: RingDesign) {
  const plain = (d: RingDesign) => JSON.stringify({ ...d, stone: { ...d.stone, carat: 0 }, setting: { ...d.setting, sideCarat: 0 }, band: { ...d.band, width: 0 }, size: null })
  return plain(a) === plain(b)
}

/** A round bead (metal grains, claws on pavé), unit radius. */
const beadGeometry = (() => {
  const g = gemGeometry('round', 2, 1, 2)
  // Rounded: push every vertex onto the sphere.
  const p = g.getAttribute('position')
  const v = new Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize()
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
})()

/** Stones of an instanced set appear one after another (in `order`, else their index), each scaling up from nothing. */
function ripple(tl: gsap.core.Timeline, mesh: InstancedMesh, at: number, duration: number, order?: number[]) {
  const n = mesh.count
  const base = [...Array(n).keys()].map((i) => {
    const m = new Matrix4()
    mesh.getMatrixAt(i, m)
    return m
  })
  const rank = order ? [...order.keys()].sort((a, b) => order[a] - order[b]) : [...Array(n).keys()]
  const delay = new Array<number>(n)
  rank.forEach((idx, k) => (delay[idx] = n > 1 ? k / (n - 1) : 0))
  const state = { t: 0 }
  const m = new Matrix4()
  const pos = new Vector3()
  const scale = new Vector3()
  const quat = new Quaternion()
  const apply = () => {
    for (let i = 0; i < n; i++) {
      const local = Math.min(1, Math.max(0, (state.t - delay[i] * 0.6) / 0.4))
      const k = 1 - (1 - local) ** 3
      m.copy(base[i])
      if (k < 1) {
        base[i].decompose(pos, quat, scale)
        m.compose(pos, quat, scale.multiplyScalar(Math.max(0.001, k)))
      }
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  apply()
  tl.to(state, { t: 1, duration, ease: 'none', onUpdate: apply, onComplete: apply }, at)
}

