// The ring as a scene: its parts built from the design and rebuilt only when they change, each with its own entrance.
// The band draws itself around the finger, the basket rises, every claw grows from it, the stone drops into place,
// halo and pavé stones follow in a ripple; a new metal is a colour that turns, not a rebuild. The exploded view lifts
// the parts apart and reports where each one is, for its label.
import gsap from 'gsap'
import { BufferGeometry, Color, Group, InstancedMesh, Matrix3, Matrix4, Mesh, Quaternion, Vector3, type Material, type MeshBasicNodeMaterial, type Object3D, type TextureNode } from 'three/webgpu'
import { headMetal, layoutOf, type EngravingFont, type Layout, type RingDesign, type StoneType } from '../../../data/ring'
import { TRACE_MATERIAL, type Traceable } from './bvh'
import { gemGeometry } from './gems'
import { gemMaterial, type GemUniforms } from './gemMaterial'
import { METAL_LOOK, engravingMap, engravingMaterial, metalMaterial, recut, retintMetal, type Lettering, type MetalMaterial } from './materials'
import type { RingTracer } from './raytrace'
import { bandGeometries, bandStones, basketRail, bezel, cathedral, centreFoot, claws, engravingStrip, haloGallery, haloStones, hiddenCollar, hiddenHaloStones, milgrain, peekabooCups, peekabooStones, prongGeometry, prongTrace, sideStones, splitBridge, surprisePad, surpriseStone } from './parts'

export type PartId = 'centre' | 'head' | 'band' | 'halo' | 'pave' | 'sides' | 'accents' | 'engraving'

/** The engraving's faces: the script, the house's italic serif, tracked block capitals' face. */
const LETTERING: Record<EngravingFont, Lettering> = {
  script: { style: '', family: "'Pinyon Script', cursive", size: 0.74, tracking: 0.02 },
  serif: { style: 'italic 500 ', family: "'Baskervville', serif", size: 0.6, tracking: 0.04 },
  block: { style: '500 ', family: "'Jost', sans-serif", size: 0.5, tracking: 0.18 },
}

interface Part {
  group: Group
  sig: string
  /** Its entrance, played when it is (re)built. */
  enter: (tl: gsap.core.Timeline, at: number) => void
}

const melee = gemGeometry('round', 1, 1, 2)

/** Marks a material as its part's own (a centre or side stone, the engraving), so it is freed with the part; the metals
 *  and the melee material are shared and live as long as the model. */
const owned = <T extends Material>(m: T): T => {
  m.userData.owned = true
  return m
}

/** The shapes every part shares, kept for the model's life. */
const shared = (g: BufferGeometry) => g === melee || g === beadGeometry || g === prongGeometry || g === prongTrace

/** Removes and frees an object's meshes: geometry (not the shared melee, bead and prong shapes) and its traced copy,
 *  instance buffers, and the part's own materials with their textures. */
function dispose(o: Object3D) {
  o.traverse((c) => {
    const m = c as Mesh
    if (m.geometry && !shared(m.geometry)) m.geometry.dispose()
    const trace = m.userData?.trace as BufferGeometry | undefined
    if (trace && !shared(trace)) trace.dispose()
    if ((c as InstancedMesh).isInstancedMesh) (c as InstancedMesh).dispose()
    const mat = m.material as Material | Material[] | undefined
    if (!mat || Array.isArray(mat) || !mat.userData.owned) return
    ;(mat.userData.lettering as TextureNode | undefined)?.value.dispose()
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
  readonly bandMetal: MetalMaterial
  readonly headMetal: MetalMaterial
  private meleeMat: MeshBasicNodeMaterial
  private uniforms: GemUniforms
  private tracer: RingTracer | null
  /** Counts every change of shape (a part rebuilt or moved), so a traced copy knows when it is out of date. */
  version = 0
  /** Until when (performance.now()) the parts are still moving into place. */
  busyUntil = 0
  /** Called when the model changes by itself (a typeface come in), so its renderer draws it again. */
  onRedraw: (() => void) | null = null
  private design: RingDesign | null = null
  private exploded = false
  private motion: boolean
  private held: gsap.core.Timeline | null = null

  /** `uniforms`: the light its stones read, its renderer's own; `tracer`: the ring traced against itself, when the
   *  renderer has one. */
  constructor(motion: boolean, uniforms: GemUniforms, tracer: RingTracer | null = null) {
    this.motion = motion
    this.uniforms = uniforms
    this.tracer = tracer
    this.bandMetal = metalMaterial('platinum', 'polished', tracer)
    this.headMetal = metalMaterial('platinum', 'polished', tracer)
    // Melee is traced as the larger stones are: the light leaving it meets the seat it sits in and the prongs over it,
    // so each stone shows the metal round it (a ray a pixel: the cost goes by the pixels it covers, not its count).
    this.meleeMat = gemMaterial(melee, 'diamond', uniforms, true, tracer)
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
      band: JSON.stringify([d.band.form, d.band.width, d.band.taper, d.size, d.details.surprise]),
      head: JSON.stringify([d.stone.shape, d.stone.type, d.stone.carat, d.setting, d.prongs, d.details.hiddenHalo, d.details.peekaboo, d.band.taper, seat]),
      centre: JSON.stringify([d.stone.shape, d.stone.type, d.stone.carat, seat]),
      halo: JSON.stringify([d.setting.style, d.stone.shape, d.stone.carat, d.prongs, d.details.hiddenHalo, d.details.peekaboo, seat]),
      pave: JSON.stringify([d.band, d.size, d.stone.shape, d.stone.carat, d.setting.style, d.setting.sides, d.setting.sideCarat]),
      sides: JSON.stringify([d.setting.style, d.setting.sides, d.setting.sideCarat, d.stone.shape, d.stone.carat, seat]),
      accents: JSON.stringify([d.details.surprise, d.details.milgrain, d.band, d.size, d.stone.shape, d.stone.carat]),
      engraving: JSON.stringify([d.details.engraving, d.details.font, d.size, d.band.width, d.band.form, d.details.surprise]),
    }
    const tl = gsap.timeline({ paused: !this.motion || hold })
    const order: PartId[] = ['band', 'head', 'centre', 'halo', 'sides', 'pave', 'accents', 'engraving']
    const at: Record<PartId, number> = first ? { band: 0, head: 0.75, centre: 1.25, halo: 1.6, sides: 1.45, pave: 1.0, accents: 1.9, engraving: 2.1 } : { band: 0, head: 0, centre: 0.1, halo: 0.2, sides: 0.15, pave: 0.1, accents: 0.25, engraving: 0.2 }
    let changed = false
    for (const id of order) {
      const old = this.parts.get(id)
      if (old && old.sig === sigs[id]) {
        // Unchanged, but it may sit at a new height (a new size moves everything).
        continue
      }
      changed = true
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
    const duration = this.motion ? tl.duration() : 0
    if (changed) {
      this.version++
      this.busyUntil = hold ? Infinity : performance.now() + duration * 1000
    }
    return duration
  }

  /** Plays an assembly held back (its parts wait at their start, unseen) while the shaders compiled. */
  release() {
    if (this.held) this.busyUntil = performance.now() + this.held.duration() * 1000
    this.held?.play()
    this.held = null
  }

  /** Metals tween to the new alloy and finish; the claws can differ from the band. */
  private retint(d: RingDesign, animate: boolean) {
    const band = d.metal.band
    const head = headMetal(d)
    // A hammered finish is the band's: the claws and head stay polished, as the bench leaves them.
    const to = (m: MetalMaterial, metal: typeof band) => {
      const c = new Color(METAL_LOOK[metal].color)
      retintMetal(m, metal, m === this.headMetal && d.metal.finish === 'hammered' ? 'polished' : d.metal.finish)
      if (animate && this.motion) gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.8, ease: 'power2.out' })
      else m.color.copy(c)
    }
    to(this.bandMetal, band)
    to(this.headMetal, head)
    // The engraving's metal is the band's: a satin band's grain runs on round it (a change of shader only when it starts
    // or stops).
    this.parts.get('engraving')?.group.traverse((o) => {
      const mat = (o as Mesh).material as MetalMaterial | undefined
      if (!mat?.userData?.lettering) return
      if (mat.anisotropy > 0 !== this.bandMetal.anisotropy > 0) mat.needsUpdate = true
      mat.anisotropy = this.bandMetal.anisotropy
    })
  }

  private mesh(geometry: BufferGeometry, material: Material, parent: Group) {
    const m = new Mesh(geometry, material)
    parent.add(m)
    return m
  }

  /** Small stones, one mesh each (the tracer reads each stone's own matrix), sharing the melee material. */
  private stones(mats: Matrix4[], parent: Group): Mesh[] {
    return mats.map((mx) => {
      const m = new Mesh(melee, this.meleeMat)
      m.applyMatrix4(mx)
      parent.add(m)
      return m
    })
  }

  /** The prongs that hold small stones, one instanced set in a metal, traced as their coarser copy. */
  private prongs(mats: Matrix4[], metal: Material, parent: Group): InstancedMesh {
    const m = new InstancedMesh(prongGeometry, metal, mats.length)
    mats.forEach((mx, i) => m.setMatrixAt(i, mx))
    m.instanceMatrix.needsUpdate = true
    m.userData.trace = prongTrace
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
          // A hidden halo's collar ties the claws where the rail would: the rail runs under it instead.
          parts.push(this.mesh(L.hiddenHalo ? basketRail(d, L, 0.22, 0.28) : basketRail(d, L), this.headMetal, group))
          if (L.centre.depth > 4.2 && !L.hiddenHalo) parts.push(this.mesh(basketRail(d, L, 0.2, 0.28), this.headMetal, group))
          // The claws' foot, cast into the band.
          parts.push(this.mesh(centreFoot(d, L), this.headMetal, group))
        }
        // A split shank carries the head on a bridge between its strands.
        const bridge = d.band.form === 'split' ? splitBridge(L) : null
        if (bridge) parts.push(this.mesh(bridge, this.bandMetal, group))
        if (L.halo) {
          const h = haloGallery(d, L)
          // Drawn with its seats cut fine; traced as its coarser copy.
          const frame = this.mesh(h.frame, this.headMetal, group)
          frame.userData.trace = h.trace
          parts.push(frame)
          for (const g of h.posts) parts.push(this.mesh(g, this.headMetal, group))
        }
        if (L.peekaboo) for (const g of peekabooCups(d, L)) parts.push(this.mesh(g, this.headMetal, group))
        if (L.hiddenHalo) {
          const h = hiddenCollar(d, L)
          const collar = this.mesh(h.frame, this.headMetal, group)
          collar.userData.trace = h.trace
          parts.push(collar)
        }
        if (d.setting.cathedral) for (const g of cathedral(d, L)) parts.push(this.mesh(g, this.bandMetal, group))
        if (L.sides) {
          const s = sideStones(d, L)
          for (const g of [...s.claws, ...s.feet]) parts.push(this.mesh(g, this.headMetal, group))
        }
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
        const mat = owned(gemMaterial(g, d.stone.type, this.uniforms, false, this.tracer))
        const m = this.mesh(g, mat, group)
        m.position.y = L.y.girdle
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            // The stone drops into its claws, turning as it settles.
            tl.from(m.position, { y: L.y.girdle + 11, duration: 1, ease: 'power3.out' }, at)
            tl.from(m.rotation, { y: Math.PI * 0.75, duration: 1.1, ease: 'power3.out' }, at)
            tl.from(m.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.8, ease: 'power3.out' }, at)
            tl.from(mat, { opacity: 0, duration: 0.5 }, at)
          },
        }
      }
      case 'halo': {
        if (!L.halo && !L.hiddenHalo && !L.peekaboo) return null
        const sets: (Mesh[] | InstancedMesh)[] = []
        if (L.halo) {
          const h = haloStones(d, L)
          sets.push(this.stones(h.stones, group))
          sets.push(this.prongs(h.prongs, this.headMetal, group))
        }
        if (L.hiddenHalo) {
          const h = hiddenHaloStones(d, L)
          sets.push(this.stones(h.stones, group))
          sets.push(this.prongs(h.prongs, this.headMetal, group))
        }
        if (L.peekaboo) sets.push(this.stones(peekabooStones(d, L), group))
        return { group, sig: '', enter: (tl, at) => sets.forEach((s, i) => ripple(tl, s, at + i * 0.08, 0.7)) }
      }
      case 'sides': {
        if (!L.sides) return null
        const s = sideStones(d, L)
        const shape = d.setting.sides === 'baguette' ? 'emerald' : d.setting.sides
        const geo = gemGeometry(shape, s.sizes.width, s.sizes.length / s.sizes.width)
        const mat = owned(gemMaterial(geo, 'diamond', this.uniforms, false, this.tracer))
        const meshes = s.at.map((mx) => {
          const m = this.mesh(geo, mat, group)
          m.applyMatrix4(mx)
          return m
        })
        return { group, sig: '', enter: (tl, at) => meshes.forEach((m, i) => tl.from(m.position, { y: m.position.y + 7, duration: 0.85, ease: 'power3.out' }, at + i * 0.12)) }
      }
      case 'pave': {
        if (!L.pave) return null
        const p = bandStones(d, L)
        const stones = this.stones(p.stones, group)
        const prongs = p.prongs.length ? this.prongs(p.prongs, this.bandMetal, group) : null
        for (const r of p.rails) this.mesh(r, this.bandMetal, group)
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            ripple(tl, stones, at, 1, p.order)
            if (prongs) ripple(tl, prongs, at + 0.15, 1)
          },
        }
      }
      case 'accents': {
        const sets: (Mesh[] | InstancedMesh)[] = []
        if (L.surprise) {
          sets.push(this.stones([surpriseStone(d, L)], group))
          // A split or twisted band carries it on a pad across its strands; a one-piece band has its seat cut in.
          const pad = surprisePad(d, L)
          if (pad) this.mesh(pad, this.bandMetal, group)
        }
        if (d.details.milgrain) {
          const headArc = Math.atan2(L.centre.width * 0.5 + 0.8, L.y.bandTop)
          const mats = milgrain(d, L, headArc)
          const m = new InstancedMesh(beadGeometry, this.bandMetal, mats.length)
          mats.forEach((mx, i) => m.setMatrixAt(i, mx.clone().scale(new Vector3(0.12, 0.12, 0.12))))
          // Drawn, not traced: hundreds of grains no reflection would show, which would double the hierarchy.
          m.userData.noTrace = true
          group.add(m)
          sets.push(m)
        }
        if (!sets.length) return null
        return { group, sig: '', enter: (tl, at) => sets.forEach((s) => ripple(tl, s, at, 0.8)) }
      }
      case 'engraving': {
        const text = d.details.engraving.trim()
        if (!text) return null
        const face = LETTERING[d.details.font]
        // Across the band's middle, and at most a third of the way round.
        const across = L.band.width * 0.62
        const draw = () => engravingMap(text, face, across, L.band.inner * 2.2)
        const first = draw()
        const mat = owned(engravingMaterial(this.bandMetal, first.map, this.tracer))
        // Cut into a copy of the band's own inner surface: drawn, not traced (the band is).
        const mesh = this.mesh(engravingStrip(d, L, first.length, across), mat, group)
        mesh.userData.noTrace = true
        // It lies on the band: when it goes, it fades where it is.
        group.userData.flush = true
        mat.userData.fades = true
        // The typeface may still be on its way: once it has come, the lettering is cut again in it.
        const probe = `${face.style}24px ${face.family}`
        if (document.fonts && !document.fonts.check(probe, text)) {
          document.fonts.load(probe, text).then(
            () => {
              if (this.parts.get('engraving')?.group !== group || !document.fonts.check(probe, text)) return
              const next = draw()
              recut(mat, next.map)
              mesh.geometry.dispose()
              mesh.geometry = engravingStrip(d, L, next.length, across)
              this.onRedraw?.()
            },
            () => {},
          )
        }
        return {
          group,
          sig: '',
          enter: (tl, at) => {
            tl.from(mat, { opacity: 0, duration: 1.2, ease: 'power1.inOut' }, at)
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
    // A part lying on another's surface (the engraving) stays where it is.
    const shrink = g.userData.flush ? {} : { x: 0.94, y: 0.94, z: 0.94 }
    tl.to(g.scale, { ...shrink, duration: 0.25, ease: 'power2.in', onComplete: () => dispose(g) }, 0)
    // The part's own stones (and the engraving) fade as it goes (the shared melee shrinks with its group).
    const fading = new Set<Material>()
    g.traverse((c) => {
      const mat = (c as Mesh).material as Material | Material[] | undefined
      if (mat && !Array.isArray(mat) && mat.userData.owned && ((mat as MeshBasicNodeMaterial).alphaHash || mat.userData.fades)) fading.add(mat)
    })
    fading.forEach((mat) => tl.to(mat, { opacity: 0, duration: 0.25 }, 0))
    tl.set(g, { visible: false }, 0.25)
  }

  /** Lifts the parts apart (or back together). */
  explode(on: boolean) {
    this.exploded = on
    this.version++
    this.busyUntil = performance.now() + (this.motion ? 1100 : 0)
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

  /** The ring's metal and stones as triangles in its own space, for tracing (the engraving's decal left out; a part with a
   *  coarser copy for tracing, a seated frame or the prongs, by that copy). */
  traceable(): Traceable {
    this.root.updateMatrixWorld(true)
    const toRoot = new Matrix4().copy(this.root.matrixWorld).invert()
    const rel = new Matrix4()
    const each = new Matrix4()
    const normalMatrix = new Matrix3()
    let positions = new Float32Array(9 * 4096)
    let normals = new Float32Array(9 * 4096)
    let materials = new Float32Array(4096)
    let n = 0
    const v = new Vector3()
    const add = (mesh: Mesh, matrix: Matrix4, id: number) => {
      const g = (mesh.userData.trace as BufferGeometry | undefined) ?? mesh.geometry
      const pos = g.getAttribute('position')
      const nor = g.getAttribute('normal')
      const index = g.index
      const total = index ? index.count : pos.count
      const start = Math.max(0, g.drawRange.start)
      const end = Math.min(total, start + (Number.isFinite(g.drawRange.count) ? g.drawRange.count : total))
      normalMatrix.getNormalMatrix(matrix)
      const tris = Math.floor((end - start) / 3)
      if (n + tris > materials.length) {
        const size = Math.max(materials.length * 2, n + tris)
        const grow = (a: Float32Array, k: number) => {
          const b = new Float32Array(size * k)
          b.set(a)
          return b
        }
        positions = grow(positions, 9)
        normals = grow(normals, 9)
        materials = grow(materials, 1)
      }
      for (let i = start; i + 2 < end; i += 3) {
        for (let c = 0; c < 3; c++) {
          const k = index ? index.getX(i + c) : i + c
          const o = n * 9 + c * 3
          v.fromBufferAttribute(pos, k).applyMatrix4(matrix)
          positions[o] = v.x
          positions[o + 1] = v.y
          positions[o + 2] = v.z
          v.fromBufferAttribute(nor, k).applyMatrix3(normalMatrix).normalize()
          normals[o] = v.x
          normals[o + 1] = v.y
          normals[o + 2] = v.z
        }
        materials[n++] = id
      }
    }
    this.root.traverseVisible((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh || mesh.userData.noTrace || !((mesh.userData.trace as BufferGeometry | undefined) ?? mesh.geometry).getAttribute('normal')) return
      const material = mesh.material as Material
      const stone = material.userData.stone as StoneType | undefined
      const id = material === this.bandMetal ? TRACE_MATERIAL.band : material === this.headMetal ? TRACE_MATERIAL.head : stone ? TRACE_MATERIAL[stone] : -1
      if (id < 0) return
      rel.multiplyMatrices(toRoot, mesh.matrixWorld)
      const inst = mesh as InstancedMesh
      if (inst.isInstancedMesh) {
        for (let i = 0; i < inst.count; i++) {
          inst.getMatrixAt(i, each)
          add(mesh, each.premultiply(rel), id)
        }
      } else add(mesh, rel, id)
    })
    return { positions: positions.slice(0, n * 9), normals: normals.slice(0, n * 9), materials: materials.slice(0, n) }
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

/** A set of stones (meshes) or beads (an instanced set) appears one after another (in `order`, else their index), each
 *  scaling up from nothing. */
function ripple(tl: gsap.core.Timeline, set: Mesh[] | InstancedMesh, at: number, duration: number, order?: number[]) {
  if (Array.isArray(set)) {
    rippleMeshes(tl, set, at, duration, order)
    return
  }
  const mesh = set
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

/** The ripple for stones as meshes: each scales up from nothing in its turn. */
function rippleMeshes(tl: gsap.core.Timeline, meshes: Mesh[], at: number, duration: number, order?: number[]) {
  const n = meshes.length
  const base = meshes.map((m) => m.scale.clone())
  const rank = order ? [...order.keys()].sort((a, b) => order[a] - order[b]) : [...Array(n).keys()]
  const delay = new Array<number>(n)
  rank.forEach((idx, k) => (delay[idx] = n > 1 ? k / (n - 1) : 0))
  const state = { t: 0 }
  const apply = () => {
    for (let i = 0; i < n; i++) {
      const local = Math.min(1, Math.max(0, (state.t - delay[i] * 0.6) / 0.4))
      const k = 1 - (1 - local) ** 3
      meshes[i].scale.copy(base[i]).multiplyScalar(Math.max(0.001, k))
    }
  }
  apply()
  tl.to(state, { t: 1, duration, ease: 'none', onUpdate: apply, onComplete: apply }, at)
}
