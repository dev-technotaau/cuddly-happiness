import { forwardRef, useId } from 'react'
import type { Product, TryOnKind } from '../../data/catalog'

interface Props {
  kind: TryOnKind
  swatch: string
  product: Product
  /** Personalized text, e.g. a nameplate. */
  text?: string
  /** Earrings only: distance between the pair, 0–1. */
  spread?: number
}

/** Vector jewelry drawn in the selected metal, so it composites cleanly over a live camera feed. */
const JewelryOverlay = forwardRef<SVGSVGElement, Props>(function JewelryOverlay({ kind, swatch, product, text, spread = 0.5 }, ref) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const metal = `m${id}`
  const stone = `s${id}`
  const glow = `g${id}`
  const hasStone = !!product.gia || /diamond|solitaire|tennis|rivi|collar|stud|pav/i.test(product.name + product.description)
  const pearl = /pearl/i.test(product.name)
  const gem = /emerald/i.test(product.name) ? '#2f8f6a' : /sapphire/i.test(product.name) ? '#2c4f9e' : null

  const defs = (
    <defs>
      <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fffaf0" />
        <stop offset="35%" stopColor={swatch} />
        <stop offset="65%" stopColor="#8a6a32" stopOpacity="0.9" />
        <stop offset="100%" stopColor={swatch} />
      </linearGradient>
      <radialGradient id={stone} cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor={pearl ? '#f4ead8' : gem ?? '#e9f1f7'} />
        <stop offset="100%" stopColor={pearl ? '#c9b48e' : gem ? '#0f2a24' : '#9fb3c4'} />
      </radialGradient>
      <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
  )

  const sparkle = (x: number, y: number, r: number) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${stone})`} stroke={`url(#${metal})`} strokeWidth={r * 0.25} />
      {!pearl && <path d={`M${x - r * 0.55} ${y} L${x} ${y - r * 0.55} L${x + r * 0.55} ${y} L${x} ${y + r * 0.55} Z`} fill="#fff" opacity="0.55" />}
    </g>
  )

  let body: React.ReactNode = null
  if (kind === 'necklace') {
    const collar = /collar|rivi/i.test(product.name)
    body = (
      <g filter={`url(#${glow})`}>
        <path d="M10 20 Q 100 150 190 20" fill="none" stroke={`url(#${metal})`} strokeWidth={collar ? 0 : 1.6} />
        {collar &&
          Array.from({ length: 23 }).map((_, i) => {
            const t = i / 22
            const x = 10 + 180 * t
            const y = 20 + 2 * 65 * t * (1 - t) * 2
            const r = 3 + 3.5 * Math.sin(Math.PI * t)
            return <g key={i}>{sparkle(x, y, r)}</g>
          })}
        {!collar && text && (
          <text x="100" y="94" textAnchor="middle" fontFamily="'Pinyon Script', 'Baskervville', serif" fontSize={Math.max(18, 40 - text.length * 2)} fill={`url(#${metal})`} stroke="#6b5226" strokeWidth="0.3">
            {text}
          </text>
        )}
        {!collar && !text && /disc/i.test(product.name) && (
          <g>
            <circle cx="100" cy="88" r="3" fill="none" stroke={`url(#${metal})`} strokeWidth="1.4" />
            <circle cx="100" cy="104" r="13" fill={`url(#${metal})`} />
          </g>
        )}
        {!collar && !text && !/disc/i.test(product.name) && (
          <g>
            <path d="M100 84 L 100 90" stroke={`url(#${metal})`} strokeWidth="1.4" />
            {sparkle(100, 97, 7)}
          </g>
        )}
      </g>
    )
  }

  if (kind === 'earrings') {
    const gap = 40 + spread * 110
    const drop = /drop|chandelier|tiara/i.test(product.name)
    const hoop = /huggie/i.test(product.name)
    const one = (cx: number) => (
      <g key={cx}>
        {hoop ? (
          <ellipse cx={cx} cy="104" rx="7" ry="9" fill="none" stroke={`url(#${metal})`} strokeWidth="3" />
        ) : (
          sparkle(cx, 100, 5.5)
        )}
        {drop && (
          <g>
            <line x1={cx} y1="106" x2={cx} y2="124" stroke={`url(#${metal})`} strokeWidth="1.2" />
            <ellipse cx={cx} cy="134" rx="6.5" ry="9.5" fill={`url(#${stone})`} stroke={`url(#${metal})`} strokeWidth="1" />
          </g>
        )}
      </g>
    )
    body = <g filter={`url(#${glow})`}>{one(100 - gap / 2)}{one(100 + gap / 2)}</g>
  }

  if (kind === 'ring') {
    const signet = /signet/i.test(product.name)
    body = (
      <g filter={`url(#${glow})`}>
        <path d="M58 100 Q 100 128 142 100" fill="none" stroke={`url(#${metal})`} strokeWidth="9" strokeLinecap="round" />
        {signet ? (
          <g>
            <ellipse cx="100" cy="96" rx="20" ry="15" fill={`url(#${metal})`} />
            {text && <text x="100" y="101" textAnchor="middle" fontFamily="'Baskervville', serif" fontStyle="italic" fontSize="14" fill="#4a3a22" opacity="0.7">{text}</text>}
          </g>
        ) : hasStone || gem ? (
          <g>
            <path d="M92 104 L 96 92 M108 104 L 104 92" stroke={`url(#${metal})`} strokeWidth="2" />
            {sparkle(100, 88, gem ? 11 : 9)}
          </g>
        ) : null}
      </g>
    )
  }

  if (kind === 'bracelet') {
    const tennis = /tennis/i.test(product.name)
    const cuff = /cuff/i.test(product.name)
    body = (
      <g filter={`url(#${glow})`}>
        <ellipse cx="100" cy="100" rx="70" ry="22" fill="none" stroke={`url(#${metal})`} strokeWidth={cuff ? 12 : 3} />
        {tennis &&
          Array.from({ length: 15 }).map((_, i) => {
            const a = Math.PI * (i / 14)
            return <g key={i}>{sparkle(100 - 70 * Math.cos(a), 100 + 22 * Math.sin(a), 4)}</g>
          })}
        {!tennis && !cuff && sparkle(100, 122, 4)}
      </g>
    )
  }

  if (kind === 'watch') {
    body = (
      <g filter={`url(#${glow})`}>
        <rect x="80" y="40" width="40" height="120" rx="8" fill="#2a2420" opacity="0.85" />
        <circle cx="100" cy="100" r="30" fill={`url(#${metal})`} />
        <circle cx="100" cy="100" r="24" fill={/pearl|lac/i.test(product.name) ? '#f3efe8' : '#e9e4da'} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <line key={i} x1={100 + 20 * Math.sin(a)} y1={100 - 20 * Math.cos(a)} x2={100 + 22.5 * Math.sin(a)} y2={100 - 22.5 * Math.cos(a)} stroke="#3a3128" strokeWidth="1" />
        })}
        <line x1="100" y1="100" x2="100" y2="84" stroke="#141311" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="100" y1="100" x2="112" y2="106" stroke="#141311" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="128" y="96" width="5" height="8" rx="1.5" fill={`url(#${metal})`} />
      </g>
    )
  }

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="h-full w-full overflow-visible">
      {defs}
      {body}
    </svg>
  )
})

export default JewelryOverlay
