import { outlineOf, radiusAt } from '../../data/outline'
import { CUTS, type BandForm, type BandStones, type Coverage, type Finish, type ProngTip, type SettingHeight, type SettingStyle, type Shape, type SideShape, type StoneType } from '../../data/ring'

// The stones' own colours, as in the 3D view.
const GEM_TINT: Record<StoneType, string> = { diamond: '#f4f8fb', sapphire: '#2b4fd6', ruby: '#c8123a', emerald: '#14a46a' }

export type GlyphKind =
  | { kind: 'type'; value: StoneType }
  | { kind: 'shape'; value: Shape }
  | { kind: 'style'; value: SettingStyle }
  | { kind: 'height'; value: SettingHeight }
  | { kind: 'cathedral' }
  | { kind: 'sides'; value: SideShape }
  | { kind: 'tip'; value: ProngTip }
  | { kind: 'count'; value: 4 | 6 }
  | { kind: 'double' }
  | { kind: 'vTips' }
  | { kind: 'compass' }
  | { kind: 'form'; value: BandForm }
  | { kind: 'bandStones'; value: BandStones }
  | { kind: 'coverage'; value: Coverage }
  | { kind: 'taper' }
  | { kind: 'finish'; value: Finish }
  | { kind: 'hiddenHalo' }
  | { kind: 'peekaboo' }
  | { kind: 'surprise' }
  | { kind: 'milgrain' }

/** A stone seen from above at (cx, cy), `size` across its longer side: its girdle, its table and the star facets. */
function TopView({ shape, cx = 24, cy = 24, size = 30, fill = 'none', ratio = CUTS[shape].ratio }: { shape: Shape; cx?: number; cy?: number; size?: number; fill?: string; ratio?: number }) {
  const outline = outlineOf(shape, ratio, 96)
  const s = size / Math.max(1, ratio)
  const pt = (x: number, z: number, k = 1) => `${(cx + x * s * k).toFixed(2)},${(cy - z * s * k).toFixed(2)}`
  const girdle = outline.map(([x, z]) => pt(x, z)).join(' ')
  const step = CUTS[shape].step
  const inner = (k: number) => outline.map(([x, z]) => pt(x, z, k)).join(' ')
  // The star facets: from the table's eight points out to the girdle between them.
  const stars = step ? [] : [...Array(8).keys()].map((i) => {
    const a = (i / 8) * Math.PI * 2
    const b = a + Math.PI / 8
    const ra = radiusAt(outline, a) * 0.52
    const rb = radiusAt(outline, b)
    return `M${pt(Math.sin(a) * ra, Math.cos(a) * ra)} L${pt(Math.sin(b) * rb, Math.cos(b) * rb)}`
  })
  return (
    <g>
      <polygon points={girdle} fill={fill} />
      {step ? (
        <>
          <polygon points={inner(0.74)} strokeOpacity="0.55" />
          <polygon points={inner(0.5)} strokeOpacity="0.55" />
        </>
      ) : (
        <>
          <polygon points={inner(0.52)} strokeOpacity="0.6" />
          <path d={stars.join(' ')} strokeOpacity="0.45" />
        </>
      )}
    </g>
  )
}

/** A brilliant in profile, its girdle at (cx, cy), `w` wide: crown above, pavilion to the culet. */
const profile = (cx: number, cy: number, w: number) => {
  const h = w / 2
  return `M${cx - h * 0.56},${cy - w * 0.17} L${cx + h * 0.56},${cy - w * 0.17} L${cx + h},${cy} L${cx},${cy + w * 0.43} L${cx - h},${cy} Z`
}

/** A head on a band, from the side: the stone, two claws, the band below. `rise` lifts the stone. */
function Head({ rise = 0, w = 18, claws = true }: { rise?: number; w?: number; claws?: boolean }) {
  const gy = 22 - rise
  return (
    <g>
      <path d="M6 40 Q24 34 42 40" strokeWidth="2.2" />
      <path d={profile(24, gy, w)} />
      {claws && <path d={`M${24 - w * 0.3},37 L${24 - w * 0.5},${gy - 2} M${24 + w * 0.3},37 L${24 + w * 0.5},${gy - 2}`} />}
    </g>
  )
}

/** A ring from the front: the band a circle, the stone on top. */
/** One strand of a twisted band, seen from the front: a circle that weaves in and out nine times. */
function strand(side: number) {
  return [...Array(97).keys()]
    .map((i) => {
      const a = (i / 96) * Math.PI * 2
      const r = 14 + side * 1.6 * Math.sin(a * 9)
      return `${i ? 'L' : 'M'}${(24 + Math.sin(a) * r).toFixed(2)},${(27 - Math.cos(a) * r).toFixed(2)}`
    })
    .join(' ')
}

function Front({ children, stone = true, width = 3 }: { children?: React.ReactNode; stone?: boolean; width?: number }) {
  return (
    <g>
      <circle cx="24" cy="27" r="14" strokeWidth={width} />
      {stone && <path d={profile(24, 10.5, 11)} fill="var(--bg-travertine)" />}
      {children}
    </g>
  )
}

/** Line drawings for the designer's choices, drawn in the current text colour: a stone's outline, a setting, a claw, a
 *  band's profile, a finish. Decorative: the option's name is always written beside it. */
export default function Glyph({ glyph, className = '' }: { glyph: GlyphKind; className?: string }) {
  let body: React.ReactNode = null
  switch (glyph.kind) {
    case 'type':
      body = <TopView shape="round" size={28} fill={GEM_TINT[glyph.value]} />
      break
    case 'shape':
      body = <TopView shape={glyph.value} size={glyph.value === 'marquise' ? 36 : glyph.value === 'pear' || glyph.value === 'oval' || glyph.value === 'emerald' ? 34 : 28} />
      break
    case 'style':
      body =
        glyph.value === 'halo' ? (
          <g>
            <Head w={15} />
            {[-1, 1].map((s) => [0, 1, 2].map((i) => <circle key={`${s}${i}`} cx={24 + s * (10 + i * 2.6)} cy={21 + i * 1.6} r="1.3" />))}
          </g>
        ) : glyph.value === 'three-stone' ? (
          <g>
            <Head w={15} />
            {[-1, 1].map((s) => <path key={s} d={profile(24 + s * 13.5, 25, 8)} />)}
          </g>
        ) : glyph.value === 'bezel' ? (
          <g>
            <Head claws={false} w={16} />
            <path d="M14.5 19 L16.5 31 L31.5 31 L33.5 19" strokeWidth="1.8" />
          </g>
        ) : (
          <Head />
        )
      break
    case 'height':
      body = <Head rise={glyph.value === 'low' ? -3 : glyph.value === 'high' ? 5 : 1} w={16} />
      break
    case 'cathedral':
      body = (
        <g>
          <Head w={16} />
          <path d="M8 39 Q12 27 17 26 M40 39 Q36 27 31 26" />
        </g>
      )
      break
    case 'sides':
      body = (
        <g>
          <circle cx="24" cy="24" r="8.5" />
          {[-1, 1].map((s) =>
            glyph.value === 'round' ? (
              <circle key={s} cx={24 + s * 15} cy="24" r="4.5" />
            ) : glyph.value === 'pear' ? (
              <path key={s} d={`M${24 + s * 10.5},24 Q${24 + s * 13},19.5 ${24 + s * 16},19.5 A4.5 4.5 0 0 ${s > 0 ? 1 : 0} ${24 + s * 16},28.5 Q${24 + s * 13},28.5 ${24 + s * 10.5},24 Z`} />
            ) : (
              <rect key={s} x={24 + s * 14.5 - 2.6} y="16.5" width="5.2" height="15" />
            ),
          )}
        </g>
      )
      break
    case 'tip':
      body = (
        <g>
          <path d="M8 31 L18 22 L40 22" strokeOpacity="0.5" />
          <path d="M20 42 L20 24" strokeWidth="2.6" />
          {glyph.value === 'round' && <circle cx="20.6" cy="21" r="3.6" fill="currentColor" />}
          {glyph.value === 'eagle' && <path d="M18.6 25 Q19 17 26 18.5 Q22 19.5 21.4 25 Z" fill="currentColor" />}
          {glyph.value === 'tab' && <path d="M18.4 25 L18.4 18 L27 18 L27 21 L21.6 21 L21.6 25 Z" fill="currentColor" />}
        </g>
      )
      break
    case 'count':
    case 'double':
    case 'compass': {
      const angles = glyph.kind === 'count' ? (glyph.value === 6 ? [30, 90, 150, 210, 270, 330] : [45, 135, 225, 315]) : glyph.kind === 'compass' ? [0, 90, 180, 270] : [37, 53, 127, 143, 217, 233, 307, 323]
      body = (
        <g>
          <TopView shape="round" size={24} />
          {angles.map((a) => <circle key={a} cx={24 + Math.sin((a * Math.PI) / 180) * 13} cy={24 - Math.cos((a * Math.PI) / 180) * 13} r={glyph.kind === 'double' ? 1.7 : 2.3} fill="currentColor" />)}
        </g>
      )
      break
    }
    case 'vTips':
      body = (
        <g>
          <TopView shape="pear" size={32} />
          <path d="M20.5 7.5 L24 3.6 L27.5 7.5" strokeWidth="2.4" />
        </g>
      )
      break
    case 'form':
      body =
        glyph.value === 'knife' ? (
          <Front>
            {/* The ridge: a fine light line along the middle of the band */}
            <circle cx="24" cy="27" r="14" strokeWidth="0.6" stroke="var(--bg-travertine)" />
          </Front>
        ) : glyph.value === 'split' ? (
          <g>
            <path d="M12.5 19.5 A14 14 0 1 0 35.5 19.5" strokeWidth="2.6" />
            <path d="M12.5 19.5 Q15 12 19.5 13 M35.5 19.5 Q33 12 28.5 13 M12.5 19.5 Q18 17 20 15.5 M35.5 19.5 Q30 17 28 15.5" />
            <path d={profile(24, 10.5, 10)} fill="var(--bg-travertine)" />
          </g>
        ) : glyph.value === 'twist' ? (
          <g>
            {[1, -1].map((s) => (
              <path key={s} strokeWidth="1.3" d={strand(s)} />
            ))}
            <path d={profile(24, 10.5, 11)} fill="var(--bg-travertine)" />
          </g>
        ) : (
          <Front />
        )
      break
    case 'bandStones':
      body = (
        <g>
          <path d="M4 19 L44 19 M4 29 L44 29" />
          {glyph.value === 'pave' && [8, 16, 24, 32, 40].map((x) => <g key={x}><circle cx={x} cy="24" r="2.8" /><circle cx={x + 4} cy="21.2" r="0.7" fill="currentColor" /><circle cx={x + 4} cy="26.8" r="0.7" fill="currentColor" /></g>)}
          {glyph.value === 'channel' && <>
            <path d="M4 21 L44 21 M4 27 L44 27" strokeOpacity="0.6" />
            {[6, 13, 20, 27, 34, 41].map((x) => <rect key={x} x={x - 2.6} y="21.6" width="5.2" height="4.8" />)}
          </>}
          {glyph.value === 'none' && <path d="M4 22 Q24 21 44 22" strokeOpacity="0.35" />}
        </g>
      )
      break
    case 'coverage': {
      const reach = glyph.value === 'half' ? Math.PI / 2 : glyph.value === 'three-quarter' ? (Math.PI * 3) / 4 : Math.PI
      const dots = [...Array(15).keys()].map((i) => -reach + ((i + 0.5) / 15) * reach * 2).filter((a) => Math.abs(a) > 0.42)
      body = (
        <Front width={2.2}>
          {dots.map((a) => <circle key={a} cx={24 + Math.sin(a) * 14} cy={27 - Math.cos(a) * 14} r="1.5" fill="var(--bg-travertine)" />)}
        </Front>
      )
      break
    }
    case 'taper':
      body = <path d="M4 17 Q24 21 44 17 M4 31 Q24 27 44 31" strokeWidth="1.4" />
      break
    case 'finish':
      body = (
        <g>
          <rect x="8" y="8" width="32" height="32" />
          {glyph.value === 'polished' && <path d="M13 34 L34 13 M19 36 L36 19" strokeOpacity="0.55" />}
          {glyph.value === 'satin' && [12, 15, 18, 21, 24, 27, 30, 33, 36].map((y) => <path key={y} d={`M10 ${y} L38 ${y}`} strokeWidth="0.5" strokeOpacity="0.65" />)}
          {glyph.value === 'hammered' && [[15, 15, 4], [26, 13, 5], [34, 20, 4], [18, 26, 5], [30, 30, 4.5], [14, 35, 3.5], [24, 35, 3]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} strokeWidth="0.7" strokeOpacity="0.7" />)}
        </g>
      )
      break
    case 'hiddenHalo':
      body = (
        <g>
          <Head w={18} />
          {[-1, 1].map((s) => [0, 1].map((i) => <circle key={`${s}${i}`} cx={24 + s * (3.5 + i * 3.2)} cy={27.5 - i * 1.2} r="1.3" fill="currentColor" />))}
        </g>
      )
      break
    case 'peekaboo':
      body = (
        <Front>
          {[-1, 1].map((s) => <circle key={s} cx={24 + s * 6.6} cy="15.6" r="1.8" fill="currentColor" />)}
        </Front>
      )
      break
    case 'surprise':
      body = (
        <Front>
          <circle cx="24" cy="39" r="1.9" fill="currentColor" />
        </Front>
      )
      break
    case 'milgrain':
      body = (
        <g>
          <path d="M4 20 L44 20 M4 28 L44 28" />
          {[...Array(14).keys()].map((i) => <g key={i}><circle cx={5.5 + i * 2.85} cy="18.4" r="0.8" fill="currentColor" /><circle cx={5.5 + i * 2.85} cy="29.6" r="0.8" fill="currentColor" /></g>)}
        </g>
      )
      break
  }
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
      {body}
    </svg>
  )
}
