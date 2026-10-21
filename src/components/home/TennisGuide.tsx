import { useMemo, useState } from 'react'
import { IMG, pic, signaturePieces } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'
import { btnPrimary } from '../ui'
import VisitButton from '../visit/VisitButton'

const LENGTHS = ['16 in', '17 in', '18 in']
const WEIGHTS = ['5 ct', '10 ct', '15 ct']
// How far the line falls below the base of the neck, how many stones show (a longer line has more, at the same pitch,
// as on a real necklace) and how large each stone is drawn, per choice.
const DROP = [96, 122, 150]
const COUNT = [25, 30, 35]
const STONE = [2.4, 3.3, 4.2]

const COPY = bilingual(
  {
    eyebrow: 'The tennis line',
    title: 'Find your <em>line</em>.',
    text: 'Two choices make a tennis necklace yours: where it sits, and how much light it carries.',
    length: 'Length',
    lengths: ['At the collarbone', 'Just below it', 'A soft drop'],
    weight: 'Total weight',
    weights: ['A whisper of light', 'The classic', 'For the evening'],
    craft: 'Every stone sits in four claws and passes under the loupe; two safety catches close the clasp.',
    rent: 'Or wear one for a night, from',
    weekend: 'a weekend',
    drawing: (length: string, weight: string) => `A tennis necklace of ${weight} at ${length}, drawn on a neckline`,
    alt: 'A diamond tennis necklace, worn',
  },
  {
    eyebrow: 'La ligne tennis',
    title: 'Trouvez votre <em>ligne</em>.',
    text: 'Deux choix font un collier tennis à votre image : là où il se pose, et la lumière qu’il porte.',
    length: 'Longueur',
    lengths: ['Sur la clavicule', 'Juste en dessous', 'Une chute douce'],
    weight: 'Poids total',
    weights: ['Un murmure de lumière', 'Le classique', 'Pour le soir'],
    craft: 'Chaque pierre tient dans quatre griffes et passe sous la loupe ; deux sécurités ferment le fermoir.',
    rent: 'Ou portez-en un le temps d’un soir, dès',
    weekend: 'la fin de semaine',
    drawing: (length, weight) => `Un collier tennis de ${weight} à ${length}, dessiné sur une encolure`,
    alt: 'Un collier tennis en diamants, porté',
  },
)

// A point on the necklace's curve: a quadratic from one side of the neck to the other, through the drop. The ends sit
// on the neck's outline where it meets the shoulders, so the line seems to pass behind the neck.
const along = (t: number, drop: number) => {
  const [x0, y0, cx, cy, x1, y1] = [139, 94, 200, 94 + drop * 2 - 10, 261, 94]
  const u = 1 - t
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]
}

// The point a fraction of the way along the necklace, measured by length, so the stones sit evenly.
const evenly = (drop: number) => {
  const pts = Array.from({ length: 121 }, (_, i) => along(0.015 + (i / 120) * 0.97, drop))
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return (f: number) => {
    const want = f * acc[acc.length - 1]
    let i = 1
    while (i < acc.length - 1 && acc[i] < want) i++
    const s = (want - acc[i - 1]) / (acc[i] - acc[i - 1])
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s]
  }
}

/** "Find your line": a tennis necklace drawn on a neckline that answers to two choices, its length and its weight,
 *  beside a worn photograph, with the signature page, a visit and the rental rate. */
export default function TennisGuide({ index }: { index: string }) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const [length, setLength] = useState(0)
  const [weight, setWeight] = useState(1)
  const fromRate = useMemo(() => Math.min(...signaturePieces('tennis').filter((p) => p.rental).map((p) => p.rental!.weekend[currency])), [currency])
  // Every stone the longest line needs is always drawn; the ones a shorter line doesn't show wait, hidden, at its two
  // ends, so lengthening the line draws them out from behind the neck.
  const stones = useMemo(() => {
    const at = evenly(DROP[length])
    const shown = COUNT[length]
    const first = Math.floor((COUNT[2] - shown) / 2)
    return Array.from({ length: COUNT[2] }, (_, i) => ({ xy: at(Math.min(1, Math.max(0, (i - first) / (shown - 1)))), on: i >= first && i < first + shown }))
  }, [length])
  const choice = (on: boolean) => `flex items-baseline justify-between gap-4 border-b py-4 text-left transition-colors ${on ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`

  return (
    <section className="bg-[var(--bg-silk)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-5">
          <p data-reveal className="font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-taupe)]"><span className="text-[var(--gold-ink)]">{index}</span> {t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">{rich(t.title, 'text-[var(--gold-vermeil)]')}</h2>
          <p data-reveal="0.1" className="mt-6 max-w-md leading-relaxed text-[var(--text-taupe)]">{t.text}</p>

          <div data-reveal="0.15" className="mt-10 grid gap-10 sm:grid-cols-2">
            <div role="group" aria-label={t.length}>
              <p className="font-spec mb-1 text-[10px] uppercase tracking-[0.26em] text-[var(--text-taupe)]">{t.length}</p>
              {LENGTHS.map((l, i) => (
                <button key={l} type="button" aria-pressed={length === i} onClick={() => setLength(i)} className={`w-full ${choice(length === i)}`}>
                  <span className="font-serif-editorial text-2xl">{catalog.unit(l)}</span>
                  <span className="text-xs">{t.lengths[i]}</span>
                </button>
              ))}
            </div>
            <div role="group" aria-label={t.weight}>
              <p className="font-spec mb-1 text-[10px] uppercase tracking-[0.26em] text-[var(--text-taupe)]">{t.weight}</p>
              {WEIGHTS.map((w, i) => (
                <button key={w} type="button" aria-pressed={weight === i} onClick={() => setWeight(i)} className={`w-full ${choice(weight === i)}`}>
                  <span className="font-serif-editorial text-2xl">{w}</span>
                  <span className="text-xs">{t.weights[i]}</span>
                </button>
              ))}
            </div>
          </div>
          <p data-reveal="0.2" className="mt-8 max-w-md text-sm leading-relaxed text-[var(--text-taupe)]">{t.craft}</p>
          <div data-reveal="0.25" className="mt-10 flex flex-wrap gap-3">
            <a href={href.category('necklaces', { type: 'tennis' })} className={btnPrimary}>{house.signatures.tennis.cta}</a>
            <VisitButton request={{ purpose: 'tennis' }} />
          </div>
          {Number.isFinite(fromRate) && (
            <p data-reveal="0.3" className="mt-6 text-sm text-[var(--text-taupe)]">
              {t.rent} <Price amount={fromRate} className="text-[var(--text-espresso)] [&_span]:hidden" /> {t.weekend} · <a href={href.category('rentals')} className="underline decoration-[var(--gold-vermeil)] underline-offset-4 hover:text-[var(--text-espresso)]">{catalog.category('rentals').name}</a>
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          <figure data-reveal-img className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-travertine)]">
            {/* Framed on the neckline: the neck, the collarbones and the longest drop fill the figure */}
            <svg viewBox="90 36 220 275" role="img" aria-label={t.drawing(catalog.unit(LENGTHS[length]), WEIGHTS[weight])} className="h-full w-full">
              {/* The neckline, in one hairline: neck, shoulders, the two collarbones */}
              <g fill="none" stroke="var(--text-taupe)" strokeWidth="1" strokeLinecap="round" opacity="0.55">
                <path d="M150 0 C 152 50, 148 78, 138 96 C 112 124, 60 140, 0 152" />
                <path d="M250 0 C 248 50, 252 78, 262 96 C 288 124, 340 140, 400 152" />
                <path d="M118 150 C 150 160, 178 166, 196 172" opacity="0.6" />
                <path d="M282 150 C 250 160, 222 166, 204 172" opacity="0.6" />
              </g>
              {stones.map(({ xy: [x, y], on }, i) => (
                <circle key={i} r={STONE[weight]} cx={0} cy={0} fill="var(--bg-travertine)" stroke="var(--gold-vermeil)" strokeWidth="0.9" className="transition-[transform,r,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ transform: `translate(${x}px, ${y}px)`, opacity: on ? 1 : 0 }} />
              ))}
              <text x="200" y="300" textAnchor="middle" fill="var(--text-taupe)" style={{ fontFamily: "'Jost', sans-serif", fontSize: '8px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                {catalog.unit(LENGTHS[length])} · {WEIGHTS[weight]}
              </text>
            </svg>
          </figure>
          <div data-reveal-img className="relative aspect-[4/5] overflow-hidden sm:mt-16">
            <img data-parallax {...pic(IMG.tennisWorn, '(min-width: 1024px) 25vw, 50vw')} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
