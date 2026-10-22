import { useRef, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { IMG, pic } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import { btnPrimary } from '../ui'
import VisitButton from '../visit/VisitButton'

const COPY = bilingual(
  {
    eyebrow: 'Sur mesure',
    title: 'From the <em>sketch</em> to your hand.',
    text: 'Every commission begins in pencil at our drafting table. Draw the line across to see one become a ring.',
    steps: [['A conversation', 'In the salon or by video, about the person and the promise.'], ['The drawing', 'Pencil first, then a CAD model you can turn in your hand.'], ['The making', 'Wax, casting, setting and polish, all within these walls.']] as [string, string][],
    begin: 'Begin a commission',
    consult: 'Book a design consultation',
    design: 'Or design it yourself, in 3D',
    slider: 'From sketch to ring',
    sketch: 'The sketch',
    ring: 'The ring',
    note: '1.82 ct · oval · cathedral setting',
    width: '7.2 mm',
    alt: 'The finished oval solitaire',
  },
  {
    eyebrow: 'Sur mesure',
    title: 'Du <em>croquis</em> à votre main.',
    text: 'Chaque création commence au crayon, sur notre table à dessin. Faites glisser le trait pour voir une esquisse devenir bague.',
    steps: [['Une conversation', 'Au salon ou par vidéo, sur la personne et la promesse.'], ['Le dessin', 'Le crayon d’abord, puis un modèle 3D à tourner dans la main.'], ['La fabrication', 'Cire, fonte, sertissage et polissage, entre ces murs.']],
    begin: 'Commencer une création',
    consult: 'Réserver une consultation création',
    design: 'Ou créez-la vous-même, en 3D',
    slider: 'Du croquis à la bague',
    sketch: 'Le croquis',
    ring: 'La bague',
    note: '1,82 ct · ovale · serti cathédrale',
    width: '7,2 mm',
    alt: 'Le solitaire ovale achevé',
  },
)

/** A pencil drawing of an oval solitaire on drafting paper: construction lines, facets, claws and a note. */
function Sketch({ note, width }: { note: string; width: string }) {
  const facets = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2
    return [200 + Math.cos(a) * 54, 205 + Math.sin(a) * 74, 200 + Math.cos(a) * 26, 205 + Math.sin(a) * 38]
  })
  return (
    <svg viewBox="0 0 400 500" className="h-full w-full" aria-hidden="true">
      <rect width="400" height="500" fill="var(--bg-silk)" />
      {/* Drafting grid */}
      <g stroke="var(--border-hairline)" strokeWidth="0.5">
        {Array.from({ length: 21 }, (_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="500" />)}
        {Array.from({ length: 26 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} />)}
      </g>
      {/* Drawn where the photograph has its stone, at the ring’s angle, so the line wipes one into the other */}
      <g fill="none" stroke="var(--text-taupe)" strokeLinecap="round" strokeLinejoin="round" transform="translate(-40 67) rotate(-18 200 205)">
        {/* Construction lines */}
        <g strokeWidth="0.6" strokeDasharray="3 4" opacity="0.6">
          <line x1="200" y1="96" x2="200" y2="420" />
          <line x1="110" y1="205" x2="290" y2="205" />
          <ellipse cx="200" cy="205" rx="66" ry="88" />
        </g>
        {/* The stone: girdle, table, facets */}
        <ellipse cx="200" cy="205" rx="54" ry="74" strokeWidth="1.4" />
        <ellipse cx="200" cy="205" rx="26" ry="38" strokeWidth="1" />
        <g strokeWidth="0.7" opacity="0.8">{facets.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}</g>
        {/* Claws */}
        <g strokeWidth="1.6">
          <path d="M150 168 q-8 -6 -4 -16" />
          <path d="M250 168 q8 -6 4 -16" />
          <path d="M150 242 q-8 6 -4 16" />
          <path d="M250 242 q8 6 4 16" />
        </g>
        {/* Cathedral shoulders and the band in perspective */}
        <path d="M156 262 C 140 300, 104 318, 84 336" strokeWidth="1.3" />
        <path d="M244 262 C 260 300, 296 318, 316 336" strokeWidth="1.3" />
        <ellipse cx="200" cy="352" rx="118" ry="44" strokeWidth="1.4" />
        <ellipse cx="200" cy="350" rx="102" ry="34" strokeWidth="0.9" />
        <g strokeWidth="0.5" opacity="0.7">
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={96 + i * 9} y1={370 + i * 1.6} x2={102 + i * 9} y2={360 + i * 1.4} />)}
        </g>
        {/* Dimension line and note */}
        <g strokeWidth="0.8">
          <line x1="146" y1="120" x2="254" y2="120" />
          <path d="M146 116 v8 M254 116 v8" />
        </g>
      </g>
      <text transform="translate(-40 67) rotate(-18 200 205)" x="200" y="110" textAnchor="middle" fill="var(--text-taupe)" style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>{width}</text>
      <text x="200" y="478" textAnchor="middle" fill="var(--text-taupe)" style={{ fontFamily: "'Baskervville', serif", fontSize: '15px', fontStyle: 'italic' }}>{note}</text>
    </svg>
  )
}

/** Sur mesure: a commission from sketch to ring, as a drawing that the visitor wipes away to reveal the finished piece
 *  (drag, or the arrow keys on the handle), with the three steps and the two ways in. */
export default function SketchToRing({ index }: { index: string }) {
  const t = useCopy(COPY)
  const [at, setAt] = useState(55)
  const frame = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const follow = (x: number) => {
    const r = frame.current?.getBoundingClientRect()
    if (r) setAt(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)))
  }

  return (
    <section className="bg-[var(--bg-travertine)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-5">
          <p data-reveal className="font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-taupe)]"><span className="text-[var(--gold-ink)]">{index}</span> {t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">{rich(t.title, 'text-[var(--gold-vermeil)]')}</h2>
          <p data-reveal="0.1" className="mt-6 max-w-md leading-relaxed text-[var(--text-taupe)]">{t.text}</p>
          <ol className="mt-12 border-t border-[var(--border-hairline)]">
            {t.steps.map(([title, text], i) => (
              <li key={title} data-reveal={0.12 + i * 0.05} className="flex gap-6 border-b border-[var(--border-hairline)] py-5">
                <span className="font-spec pt-1 text-[10px] text-[var(--gold-ink)]">0{i + 1}</span>
                <span>
                  <span className="font-serif-editorial block text-2xl">{title}</span>
                  <span className="mt-1 block text-sm text-[var(--text-taupe)]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div data-reveal="0.25" className="mt-10 flex flex-wrap gap-3">
            <a href={href.product('bespoke-engagement-commission')} className={btnPrimary}>{t.begin}</a>
            <VisitButton request={{ purpose: 'design' }}>{t.consult}</VisitButton>
          </div>
          <a data-reveal="0.3" href={href.designer()} className="link-line mt-6">{t.design}</a>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div
            ref={frame}
            data-reveal-img
            className="relative aspect-[4/5] cursor-ew-resize touch-pan-y select-none overflow-hidden bg-[var(--bg-silk)]"
            onPointerDown={(e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              follow(e.clientX)
            }}
            onPointerMove={(e) => dragging.current && follow(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <img {...pic(IMG.ovalLight, '(min-width: 1024px) 45vw, 100vw')} alt={t.alt} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}>
              <Sketch note={t.note} width={t.width} />
            </div>
            <span className="font-spec pointer-events-none absolute left-5 top-5 bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">{t.sketch}</span>
            <span className="font-spec pointer-events-none absolute right-5 top-5 bg-[var(--bg-travertine)]/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">{t.ring}</span>
            {/* The line between the two, with its handle */}
            <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--bg-travertine)] shadow-[0_0_0_1px_rgba(20,19,17,0.08)]" style={{ left: `${at}%` }} />
            <button
              type="button"
              role="slider"
              aria-label={t.slider}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(at)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setAt((v) => Math.max(0, v - 5))
                else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setAt((v) => Math.min(100, v + 5))
                else if (e.key === 'Home') setAt(0)
                else if (e.key === 'End') setAt(100)
                else return
                e.preventDefault()
              }}
              className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-travertine)] text-[var(--text-espresso)] shadow-[0_10px_30px_-12px_rgba(40,30,20,0.45)]"
              style={{ left: `${at}%` }}
            >
              <MoveHorizontal size={18} strokeWidth={1.3} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
