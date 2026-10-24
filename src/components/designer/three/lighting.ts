// The light around the ring. Each preset is a small room of softboxes, windows or candles, rendered twice: prefiltered
// for the metal's reflections, and as a cube for the stones to trace into. Diamonds need contrast to sparkle, so the
// rooms are dark with bright panels, as in a jeweller's photo studio.
import { BackSide, BoxGeometry, Color, CubeCamera, CubeRenderTarget, DoubleSide, Group, HalfFloatType, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, Object3D, PMREMGenerator, PlaneGeometry, Scene, SphereGeometry, Vector3, type CubeTexture, type Euler, type Texture, type WebGPURenderer } from 'three/webgpu'
import { COARSE, GEM_CUBE } from './gemMaterial'

export type LightPreset = 'studio' | 'daylight' | 'salon' | 'candle' | 'gallery'
export const LIGHT_PRESETS: LightPreset[] = ['studio', 'daylight', 'salon', 'candle', 'gallery']

interface Panel {
  at: [number, number, number]
  size: [number, number]
  color: string
  power: number
  round?: boolean
}

const ROOMS: Record<LightPreset, { walls: string; floor: string; ceiling: string; panels: Panel[] }> = {
  // A light tent, as jewellers shoot: soft white all round, two strips and a box overhead, a soft fill on the camera's
  // side (a flat face turned to the lens mirrors the tent, not a void), and dark cards to the sides and behind that
  // give polished metal its dark edges and a diamond its contrast.
  studio: {
    walls: '#bab6ae',
    floor: '#9c978e',
    ceiling: '#d6d3cc',
    panels: [
      { at: [0, 40, 0], size: [60, 60], color: '#ffffff', power: 2.2 },
      { at: [-42, 12, 14], size: [14, 50], color: '#ffffff', power: 3.6 },
      { at: [42, 12, 14], size: [14, 50], color: '#ffffff', power: 3.6 },
      { at: [0, 8, -46], size: [80, 30], color: '#fbf6ee', power: 1.4 },
      { at: [8, 14, 46], size: [64, 34], color: '#fbf8f2', power: 1.1 },
      { at: [-46, 20, 30], size: [16, 40], color: '#1c1b1a', power: 1 },
      { at: [34, 4, -30], size: [22, 32], color: '#000000', power: 1 },
      { at: [-44, 26, -18], size: [4, 40], color: '#000000', power: 1 },
      { at: [-20, 32, -26], size: [8, 8], color: '#ffffff', power: 16 },
    ],
  },
  // A tall window and the sky: soft, cool, with a warm floor bounce.
  daylight: {
    walls: '#8a8a86',
    floor: '#8c7d6b',
    ceiling: '#a9b2bc',
    panels: [
      { at: [-44, 18, 6], size: [4, 60], color: '#fff8ee', power: 1 },
      { at: [-46, 16, 0], size: [30, 52], color: '#fffaf2', power: 6.5 },
      { at: [0, 46, 0], size: [70, 70], color: '#dce8f6', power: 2.4 },
      { at: [30, 8, -40], size: [30, 30], color: '#ffffff', power: 2 },
    ],
  },
  // The salon at Sherbrooke: lamps, warm wood, a window late in the day.
  salon: {
    walls: '#1d140d',
    floor: '#130d09',
    ceiling: '#22180f',
    panels: [
      { at: [-34, 22, 22], size: [16, 24], color: '#ffd8a6', power: 7.5 },
      { at: [36, 18, 10], size: [10, 30], color: '#ffe2bd', power: 6 },
      { at: [0, 40, -10], size: [36, 26], color: '#fff1dd', power: 2.6 },
      { at: [10, 6, -46], size: [40, 16], color: '#ffcf96', power: 1.6 },
      { at: [-14, 30, -34], size: [6, 6], color: '#fff3e0', power: 22, round: true },
    ],
  },
  // An evening: points of warm light, the fire the stones are cut for.
  candle: {
    walls: '#26190d',
    floor: '#170f08',
    ceiling: '#2a1c10',
    panels: [
      { at: [-26, 14, 26], size: [2.6, 2.6], color: '#ffb465', power: 60, round: true },
      { at: [22, 20, 30], size: [2.2, 2.2], color: '#ffc27a', power: 70, round: true },
      { at: [34, 10, -8], size: [2.4, 2.4], color: '#ffae5c', power: 55, round: true },
      { at: [-30, 26, -24], size: [2, 2], color: '#ffd29c', power: 70, round: true },
      { at: [4, 36, 12], size: [2.4, 2.4], color: '#ffe2bd', power: 50, round: true },
      { at: [0, 18, -40], size: [30, 10], color: '#3a2412', power: 2 },
      // The room's glow: a low warm fill, so the metal keeps its shape between the flames.
      { at: [0, 32, 34], size: [44, 22], color: '#6a4524', power: 2.6 },
    ],
  },
  // A gallery case: small hard spots on black, the most fire.
  gallery: {
    walls: '#030303',
    floor: '#020202',
    ceiling: '#040404',
    panels: [
      { at: [-20, 40, 18], size: [5, 5], color: '#ffffff', power: 70, round: true },
      { at: [22, 38, 14], size: [5, 5], color: '#ffffff', power: 70, round: true },
      { at: [0, 30, -34], size: [4, 4], color: '#f4f7ff', power: 60, round: true },
      { at: [-36, 8, -8], size: [3, 26], color: '#ffffff', power: 10 },
      { at: [36, 8, -8], size: [3, 26], color: '#ffffff', power: 10 },
    ],
  },
}

// The stones see the same room with darker walls: a diamond needs dark around it to show its pattern of light and
// dark, which a jeweller's tent gives with black cards; the metal keeps the bright room.
const GEM_WALLS: Record<LightPreset, number> = { studio: 0.22, daylight: 0.55, salon: 1, candle: 1, gallery: 1 }

/** A light of a room, for the floor's shadow to aim at: a rectangle (its centre and half extents, world), and how bright
 *  it is (luminance). */
export interface RoomLight {
  centre: Vector3
  right: Vector3
  up: Vector3
  luminance: number
}

const luminanceOf = (c: Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b

/** A preset's lights as the room turned by `rotation` (the scene's) places them, and its walls' and ceiling's mean
 *  luminance (the light from everywhere else). Dark cards give no light and are left out. */
export function roomLights(preset: LightPreset, rotation: Euler): { lights: RoomLight[]; ambient: number } {
  const r = ROOMS[preset]
  const dummy = new Object3D()
  const lights: RoomLight[] = []
  for (const p of r.panels) {
    const luminance = luminanceOf(new Color(p.color)) * p.power
    if (luminance <= 0) continue
    dummy.position.set(...p.at)
    dummy.lookAt(0, 0, 0)
    const [w, h] = p.round ? [p.size[0], p.size[0]] : p.size
    const right = new Vector3(1, 0, 0).applyQuaternion(dummy.quaternion).multiplyScalar(w / 2)
    const up = new Vector3(0, 1, 0).applyQuaternion(dummy.quaternion).multiplyScalar(h / 2)
    lights.push({ centre: dummy.position.clone().applyEuler(rotation), right: right.applyEuler(rotation), up: up.applyEuler(rotation), luminance })
  }
  const ambient = (luminanceOf(new Color(r.walls)) * 4 + luminanceOf(new Color(r.ceiling))) / 5
  return { lights, ambient }
}

/** Builds a preset's room as a scene; `walls` dims its walls, floor and ceiling. */
function room(preset: LightPreset, walls = 1): Scene {
  const r = ROOMS[preset]
  const scene = new Scene()
  const box = new Mesh(new BoxGeometry(100, 100, 100), [r.walls, r.walls, r.ceiling, r.floor, r.walls, r.walls].map((c) => new MeshBasicMaterial({ color: new Color(c).multiplyScalar(walls), side: BackSide })))
  scene.add(box)
  const lights = new Group()
  // For the stones, the camera's port in the top of the tent: the dark that a diamond's table reflects as its arrows.
  const panels = walls < 1 ? [...r.panels, { at: [0, 36, 2], size: [18, 18], color: '#000000', power: 1, round: false } as Panel] : r.panels
  for (const p of panels) {
    const mat = new MeshBasicMaterial({ color: new Color(p.color).multiplyScalar(p.power), side: DoubleSide })
    const m = p.round ? new Mesh(new SphereGeometry(p.size[0] / 2, 16, 12), mat) : new Mesh(new PlaneGeometry(p.size[0], p.size[1]), mat)
    m.position.set(...p.at)
    m.lookAt(0, 0, 0)
    lights.add(m)
  }
  scene.add(lights)
  return scene
}

function free(scene: Scene) {
  scene.traverse((o) => {
    const m = o as Mesh
    m.geometry?.dispose()
    const mat = m.material as MeshBasicMaterial | MeshBasicMaterial[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else mat?.dispose()
  })
}

/** The two renderings of the light: one for metals (scene.environment), one for stones (a cube they trace into). */
export class Lighting {
  private pmrem: PMREMGenerator
  // The stones' cube, sharp enough for a close look, with mip levels for the tracer's filtering. One texture for the
  // renderer's life: a new light redraws it in place, so the stones' materials never change.
  private cube = new CubeRenderTarget(GEM_CUBE, { type: HalfFloatType, generateMipmaps: true, minFilter: LinearMipmapLinearFilter })
  private camera = new CubeCamera(0.5, 400, this.cube)
  private cache = new Map<LightPreset, Texture>()
  private preset: LightPreset | null = null

  constructor(private renderer: WebGPURenderer) {
    this.pmrem = new PMREMGenerator(renderer)
  }

  /** The stones' cube, the same texture whatever the light. */
  get gemCube(): CubeTexture {
    return this.cube.texture
  }

  /** Lights the scene with a preset: returns the metals' environment and the stones' cube. */
  use(preset: LightPreset): { environment: Texture; cube: Texture } {
    let env = this.cache.get(preset)
    if (!env) {
      const scene = room(preset)
      // 512 a face (256 on a phone), so the polished metal's reflections stay crisp up close.
      env = this.pmrem.fromScene(scene, 0.035, 0.1, 400, { size: COARSE ? 256 : 512 }).texture
      this.cache.set(preset, env)
      free(scene)
    }
    if (this.preset !== preset) {
      const scene = room(preset, GEM_WALLS[preset])
      this.camera.update(this.renderer, scene)
      this.preset = preset
      free(scene)
    }
    return { environment: env, cube: this.cube.texture }
  }

  dispose() {
    this.cache.forEach((t) => t.dispose())
    this.cache.clear()
    this.cube.dispose()
    this.pmrem.dispose()
  }
}
