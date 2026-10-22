// What the ring is made of, on screen. Metals are physically based, tuned to how jewellers photograph them. Large stones
// are ray traced inside their own facets (a bounding-volume tree in the shader): light refracts in, reflects off the
// pavilion as in a real diamond, and leaves split into colour, its fire. Melee uses a single bounce: at that size the
// eye can't tell, and sixty of them stay fast.
import { CanvasTexture, Color, DoubleSide, Matrix3, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, ShaderMaterial, SRGBColorSpace, type BufferGeometry, type Texture } from 'three'
import { BVHShaderGLSL, MeshBVH, MeshBVHUniformStruct } from 'three-mesh-bvh'
import type { BandMetal, Finish, StoneType } from '../../../data/ring'

/** Each metal's base colour (sRGB) and how it holds a polish. */
export const METAL_LOOK: Record<BandMetal, { color: string; roughness: number }> = {
  platinum: { color: '#d9d8d4', roughness: 0.1 },
  '18k-white': { color: '#ecebe7', roughness: 0.08 },
  '18k-yellow': { color: '#f1c66a', roughness: 0.09 },
  '18k-rose': { color: '#efb59a', roughness: 0.09 },
}

const FINISH_ROUGHNESS: Record<Finish, number> = { polished: 0, satin: 0.24, hammered: 0.03 }

let hammerMap: CanvasTexture | null = null

/** A hammered surface: overlapping dimples, as a normal map. Made once. */
function hammered(): CanvasTexture {
  if (hammerMap) return hammerMap
  const size = 256
  const height = new Float32Array(size * size)
  let seed = 7
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let n = 0; n < 220; n++) {
    const cx = random() * size
    const cy = random() * size
    const r = 9 + random() * 16
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y) / r
        if (d > 1) continue
        const px = (Math.round(cx + x) + size) % size
        const py = (Math.round(cy + y) + size) % size
        height[py * size + px] = Math.min(height[py * size + px], -(1 - d * d))
      }
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * 2.2
      const dy = (h(x, y + 1) - h(x, y - 1)) * 2.2
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  hammerMap = new CanvasTexture(canvas)
  hammerMap.wrapS = hammerMap.wrapT = RepeatWrapping
  hammerMap.repeat.set(1, 1)
  return hammerMap
}

/** A metal with a finish. Colours tween in place when the metal changes, so materials are reused. */
export function metalMaterial(metal: BandMetal, finish: Finish = 'polished'): MeshPhysicalMaterial {
  const look = METAL_LOOK[metal]
  const m = new MeshPhysicalMaterial({ color: new Color(look.color), metalness: 1, roughness: look.roughness + FINISH_ROUGHNESS[finish], envMapIntensity: 1.15, specularIntensity: 1 })
  if (finish === 'hammered') {
    m.normalMap = hammered()
    m.normalScale.set(0.55, 0.55)
  }
  if (finish === 'satin') {
    m.anisotropy = 0.6
  }
  return m
}

/** Repaints a metal for another alloy or finish (the colour is tweened by the caller). */
export function retintMetal(m: MeshPhysicalMaterial, metal: BandMetal, finish: Finish) {
  m.roughness = METAL_LOOK[metal].roughness + FINISH_ROUGHNESS[finish]
  m.normalMap = finish === 'hammered' ? hammered() : null
  m.anisotropy = finish === 'satin' ? 0.6 : 0
  m.needsUpdate = true
}

/** Each stone's look: its body colour, refractive index and how much colour fire it throws. */
export const GEM_LOOK: Record<StoneType, { color: string; ior: number; dispersion: number; bounces: number }> = {
  diamond: { color: '#ffffff', ior: 2.418, dispersion: 0.018, bounces: 5 },
  sapphire: { color: '#2b4fd6', ior: 1.77, dispersion: 0.006, bounces: 4 },
  ruby: { color: '#d4123a', ior: 1.77, dispersion: 0.006, bounces: 4 },
  emerald: { color: '#14a46a', ior: 1.58, dispersion: 0.004, bounces: 3 },
}

const vertex = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vUp;
void main() {
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 world = m * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(m) * normal);
  // The stone's own table direction: a pavé stone on the band's side faces outwards, not up.
  vUp = normalize(mat3(m) * vec3(0.0, 1.0, 0.0));
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const traced = /* glsl */ `
#define RAY_OFFSET 0.002
#define BVH_STACK_DEPTH 24
precision highp isampler2D;
precision highp usampler2D;
${BVHShaderGLSL.common_functions}
${BVHShaderGLSL.bvh_struct_definitions}
${BVHShaderGLSL.bvh_ray_functions}
varying vec3 vWorld;
varying vec3 vNormal;
uniform samplerCube envMap;
uniform BVH bvh;
uniform float bounces;
uniform float ior;
uniform vec3 tint;
uniform float dispersion;
uniform float fire;
uniform float brightness;
uniform float opacity;
uniform mat4 modelMatrixInverse;
uniform mat4 modelMatrix;
uniform mat3 envRotation;

vec3 sky(vec3 dir) { return textureCube(envMap, envRotation * dir).rgb; }

// Follows light into the stone, around its facets, and back out; returns the direction it leaves in (world space).
vec3 throughStone(vec3 dir, vec3 normal, float eta) {
  vec3 rd = refract(dir, normal, 1.0 / eta);
  vec3 ro = (modelMatrixInverse * vec4(vWorld + rd * RAY_OFFSET, 1.0)).xyz;
  rd = normalize((modelMatrixInverse * vec4(rd, 0.0)).xyz);
  for (int i = 0; i < 8; i++) {
    if (float(i) >= bounces) break;
    uvec4 faceIndices = uvec4(0u);
    vec3 faceNormal = vec3(0.0, 0.0, 1.0);
    vec3 barycoord = vec3(0.0);
    float side = 1.0;
    float dist = 0.0;
    if (!bvhIntersectFirstHit(bvh, ro, rd, faceIndices, faceNormal, barycoord, side, dist)) break;
    vec3 hit = ro + rd * max(dist - RAY_OFFSET, 0.0);
    vec3 out_ = refract(rd, faceNormal, eta);
    if (length(out_) > 0.0) { rd = out_; break; }
    rd = reflect(rd, faceNormal);
    ro = hit + rd * RAY_OFFSET;
  }
  return normalize((modelMatrix * vec4(rd, 0.0)).xyz);
}

void main() {
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 n = normalize(vNormal);
  if (dot(n, view) > 0.0) n = -n;
  float spread = dispersion * fire;
  vec3 colour;
  colour.r = sky(throughStone(view, n, ior * (1.0 - spread))).r;
  colour.g = sky(throughStone(view, n, ior)).g;
  colour.b = sky(throughStone(view, n, ior * (1.0 + spread))).b;
  colour *= tint;
  // The surface itself reflects too, more at grazing angles.
  float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-view, n), 0.0, 1.0), 5.0);
  colour = mix(colour, sky(reflect(view, n)), fresnel);
  gl_FragColor = vec4(colour * brightness, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const single = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vUp;
uniform samplerCube envMap;
uniform float ior;
uniform vec3 tint;
uniform float dispersion;
uniform float fire;
uniform float brightness;
uniform float opacity;
uniform mat3 envRotation;
vec3 sky(vec3 dir) { return textureCube(envMap, envRotation * dir).rgb; }
void main() {
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 n = normalize(vNormal);
  if (dot(n, view) > 0.0) n = -n;
  float spread = dispersion * fire * 2.0;
  // One refraction, mirrored back up as a pavilion would, then out.
  vec3 r = refract(view, n, 1.0 / (ior * (1.0 - spread)));
  vec3 g = refract(view, n, 1.0 / ior);
  vec3 b = refract(view, n, 1.0 / (ior * (1.0 + spread)));
  vec3 up = normalize(vUp);
  vec3 colour = vec3(sky(reflect(r, up)).r, sky(reflect(g, up)).g, sky(reflect(b, up)).b) * tint * 1.08;
  float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-view, n), 0.0, 1.0), 5.0);
  colour = mix(colour, sky(reflect(view, n)), fresnel);
  gl_FragColor = vec4(colour * brightness, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** Shared uniforms every stone reads: the environment, its rotation, the fire control and the overall brightness. */
export const gemUniforms = {
  envMap: { value: null as Texture | null },
  envRotation: { value: new Matrix3() },
  fire: { value: 1 },
  brightness: { value: 1 },
}

export type GemUniforms = typeof gemUniforms

/** The same uniforms for another renderer (the try-on): a light rendered by one renderer can't be read by another, so
 *  each keeps its own. */
export const makeGemUniforms = (): GemUniforms => ({ envMap: { value: null }, envRotation: { value: new Matrix3() }, fire: { value: 1 }, brightness: { value: 1 } })

/** A large stone: ray traced inside its own geometry. */
export function tracedGem(geometry: BufferGeometry, type: StoneType, u: GemUniforms = gemUniforms): ShaderMaterial {
  const look = GEM_LOOK[type]
  const bvh = new MeshBVH(geometry, { targetLeafSize: 3 })
  const struct = new MeshBVHUniformStruct()
  struct.updateFrom(bvh)
  const tint = new Color(look.color)
  const m = new ShaderMaterial({
    uniforms: {
      envMap: u.envMap,
      envRotation: u.envRotation,
      fire: u.fire,
      brightness: u.brightness,
      bvh: { value: struct },
      bounces: { value: look.bounces },
      ior: { value: look.ior },
      tint: { value: tint },
      dispersion: { value: look.dispersion },
      opacity: { value: 1 },
      modelMatrixInverse: { value: new Matrix4() },
    },
    vertexShader: vertex,
    fragmentShader: traced,
    transparent: true,
  })
  return m
}

/** Small stones: one bounce, instanced. */
export function meleeGem(type: StoneType = 'diamond', u: GemUniforms = gemUniforms): ShaderMaterial {
  const look = GEM_LOOK[type]
  return new ShaderMaterial({
    uniforms: {
      envMap: u.envMap,
      envRotation: u.envRotation,
      fire: u.fire,
      brightness: u.brightness,
      ior: { value: look.ior },
      tint: { value: new Color(look.color) },
      dispersion: { value: look.dispersion },
      opacity: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: single,
    transparent: true,
  })
}

/** Lettering inside the band: a darker, softer metal where the graver cut, shown through the text's alpha. */
export function engravingMaterial(color: Color, alpha: Texture): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: color.clone().multiplyScalar(0.42), metalness: 0.9, roughness: 0.55, alphaMap: alpha, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
}

/** The display hand's glazed porcelain. */
export const porcelain = () => new MeshPhysicalMaterial({ color: new Color('#f6efe6'), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: new Color('#fff4e6'), envMapIntensity: 1.25 })

/** The ring box: velvet outside the cushion, satin in the lid, leather outside. */
export const velvet = (color: string) => new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new Color('#c9a77a') })
export const satin = () => new MeshPhysicalMaterial({ color: new Color('#f3ece0'), roughness: 0.32, sheen: 0.8, sheenRoughness: 0.25, sheenColor: new Color('#ffffff'), side: DoubleSide })
export const leather = (color: string) => new MeshPhysicalMaterial({ color: new Color(color), roughness: 0.58, clearcoat: 0.25, clearcoatRoughness: 0.6 })

/** Text drawn for a texture (the lid's maker's mark, the engraving), white on black for alpha maps. */
export function textTexture(text: string, font: string, width: number, height: number, options: { color?: string; background?: string; tracking?: number } = {}): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = options.background ?? '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = options.color ?? '#fff'
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (options.tracking) (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${options.tracking}px`
  ctx.fillText(text, width / 2, height / 2 + height * 0.04)
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}
