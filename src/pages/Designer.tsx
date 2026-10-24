import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Camera, Check, MessageCircle, Redo2, RotateCcw, Ruler, Shuffle, Undo2, X } from 'lucide-react'
import { METALS, formatPrice, getProduct, type Currency } from '../data/catalog'
import { BAND_METALS, BAND_STONES, CLARITIES, COLOURS, COVERAGES, CUTS, DEFAULT_DESIGN, DESIGN_SLUG, ENGRAVING_MAX, FINISHES, FONTS, FORMS, GRADES, HEAD_METALS, HEIGHTS, PRESETS, SHAPES, SIDE_CARAT, SIDE_SHAPES, STONE_TYPES, STYLES, TIPS, WIDTH, decodeDesign, designCode, encodeDesign, engravable, patch, surprise, type Colour, type Clarity, type DesignPatch, type RingDesign } from '../data/ring'
import { STEPS, adviseOn, type StepId } from '../data/ringAdvice'
import { RING_COPY, describeDesign } from '../data/ringCopy'
import { DEPOSIT_SHARE, designDeposit, priceRing, ringPrice } from '../data/ringPrice'
import { visitLength } from '../data/visits'
import { bilingual, formatNumber, useCopy, useLocale } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { rich } from '../i18n/rich'
import { href, lineKey, useStore, type Query } from '../store'
import Hallmark from '../components/brand/Hallmark'
import BudgetFinder from '../components/designer/BudgetFinder'
import CaratField from '../components/designer/CaratField'
import DesignNotes from '../components/designer/DesignNotes'
import DesignSpec from '../components/designer/DesignSpec'
import Glyph, { type GlyphKind } from '../components/designer/Glyph'
import LivePrice, { signed } from '../components/designer/LivePrice'
import RingBreakdown from '../components/designer/RingBreakdown'
import RingViewer, { type ViewerApi } from '../components/designer/RingViewer'
import RingSize, { sizeLabel } from '../components/pdp/RingSize'
import Price from '../components/Price'
import ShareButton from '../components/share/ShareButton'
import { getLenis } from '../components/SmoothScroll'
import { useTryOn } from '../components/tryon/TryOnProvider'
import { btnPrimary, btnQuiet } from '../components/ui'
import useReveal from '../components/useReveal'
import VisitBand from '../components/visit/VisitBand'
import VisitButton from '../components/visit/VisitButton'

type StepCopy = [label: string, title: string, intro: string]

const COPY = bilingual(
  {
    eyebrow: 'Sur mesure · In 3D',
    title: 'Design your <em>ring</em>.',
    intro: 'Choose the stone, how it is held and the band it sits on. The ring builds itself as you go, priced line by line, and the atelier on rue Sherbrooke makes it by hand.',
    resumed: 'Welcome back. Your ring is as you left it.',
    afresh: 'Start afresh',
    undo: 'Undo',
    redo: 'Redo',
    progress: (n: number, of: number) => `${n} of ${of} chosen`,
    beforeTax: 'Before tax',
    lead: (weeks: number) => `Made to order · about ${weeks} weeks · final sale`,
    stepsLabel: 'The steps',
    steps: {
      stone: ['Stone', 'The <em>stone</em>', 'Its shape, its weight and its grades: the heart of the ring.'],
      setting: ['Setting', 'The <em>setting</em>', 'How the stone is held and raised, and what surrounds it.'],
      prongs: ['Claws', 'The <em>claws</em>', 'The few points of metal that hold it, and how they finish.'],
      band: ['Band', 'The <em>band</em>', 'Its profile, its width, and whether diamonds follow it round.'],
      metal: ['Metal', 'The <em>metal</em>', 'The alloy, the claws’ metal and the finish.'],
      details: ['Details', 'The <em>details</em>', 'What only you will know is there: hidden diamonds, a beaded edge, words inside.'],
      size: ['Size', 'The <em>size</em>', 'The last measure we need to make it.'],
      review: ['Your ring', 'Your <em>ring</em>', 'Everything you chose, priced line by line.'],
    } as Record<StepId, StepCopy>,
    stepOf: (n: number, of: number) => `Step ${n} of ${of}`,
    next: (step: string) => `Next: ${step}`,
    back: 'Back',
    begin: 'Begin from a house design',
    beginNote: 'House designs, as the designer builds them. Change anything.',
    surprise: 'Surprise me',
    sherbrooke: 'Sherbrooke Sapphire Halo',
    yourDesigns: 'Your designs',
    openDesign: (title: string) => `Open ${title}`,
    forget: (title: string) => `Remove ${title}`,
    groups: { type: 'Stone', shape: 'Shape', colour: 'Colour', clarity: 'Clarity', grade: 'Quality', style: 'Style', height: 'Height', shoulders: 'Shoulders', sides: 'Side stones', sideCarat: 'Each side stone', count: 'Claws', tip: 'Claw tips', extras: 'Refinements', form: 'Profile', stones: 'Diamonds', coverage: 'How far round', width: 'Width', bandMetal: 'Metal', head: 'Claw metal', bezelIn: 'Bezel metal', finish: 'Finish', hidden: 'Hidden touches', engraving: 'Engraving', font: 'Lettering' },
    colourNote: 'D is the rarest, without colour; from I, a faint warmth shows in white metal.',
    clarityNote: 'From VS2 up, nothing shows to the eye; the rest is for the loupe.',
    current: 'Chosen',
    same: 'Same price',
    noClaws: 'A bezel holds the stone in a rim of metal: there are no claws to choose.',
    unavailable: { channel: 'Not offered on this profile: pavé is set instead.', vTips: 'Only stones with points need them.', compass: 'For round and square stones.', halo: 'The halo already circles the stone.', bezelUnder: 'The bezel’s rim leaves no room beneath the stone.', bezelSides: 'The bezel’s rim closes round the head.' },
    mm: (n: string) => `${n} mm`,
    ct: (n: string) => `${n} ct`,
    engravingHint: (n: number) => `Inside the band, up to ${n} characters. Complimentary.`,
    engravingPlaceholder: 'A date, initials, a word',
    count: (n: number, of: number) => `${n}/${of}`,
    insideBand: 'Inside the band',
    insideLabel: (text: string) => `Inside the band: ${text}`,
    sizeIntro: 'If you’re choosing for someone else, we can size them at a visit, discreetly, or mail a ring sizer.',
    savedSize: (s: string) => `Use your saved size, ${s}`,
    sizeVisit: 'Book a visit to be sized',
    complete: 'Every choice is made. The atelier can begin from this design.',
    completeShort: 'Every choice made',
    remaining: (n: number) => (n === 1 ? 'One choice left' : `${n} choices left`),
    goTo: (step: string) => `Go to: ${step}`,
    consult: 'Book a design consultation',
    consultNote: (salon: string, video: string) => `${salon} in the salon, or ${video} by video, with this design on the bench.`,
    minutes: (n: number) => (n === 60 ? 'An hour' : `${n} minutes`),
    updateBag: 'Update the bag',
    keep: 'Keep this design',
    kept: 'Kept in your designs',
    ask: 'Ask a jeweller',
    picture: 'Save a picture',
    shareEyebrow: 'Designed with Teresa & Sons',
    priced: 'How it’s priced',
    spec: 'The specification',
    honest: 'An illustration of your design. Before anything is cast, a jeweller confirms each measure with you and shows you the stones themselves.',
    announce: (label: string, price: string) => `${label}. ${price}.`,
    file: 'teresa-and-sons-ring',
  },
  {
    eyebrow: 'Sur mesure · En 3D',
    title: 'Créez votre <em>bague</em>.',
    intro: 'Choisissez la pierre, sa monture et l’anneau qui la porte. La bague se construit à chaque choix, chiffrée ligne par ligne, et l’atelier de la rue Sherbrooke la fait à la main.',
    resumed: 'Bon retour. Votre bague est telle que vous l’avez laissée.',
    afresh: 'Recommencer',
    undo: 'Annuler',
    redo: 'Rétablir',
    progress: (n, of) => `${n} sur ${of} choisis`,
    beforeTax: 'Avant taxes',
    lead: (weeks) => `Faite sur commande · environ ${weeks} semaines · vente finale`,
    stepsLabel: 'Les étapes',
    steps: {
      stone: ['Pierre', 'La <em>pierre</em>', 'Sa forme, son poids, ses qualités : le cœur de la bague.'],
      setting: ['Monture', 'La <em>monture</em>', 'Comment la pierre est tenue et élevée, et ce qui l’entoure.'],
      prongs: ['Griffes', 'Les <em>griffes</em>', 'Les quelques pointes de métal qui la tiennent, et leur finition.'],
      band: ['Anneau', 'L’<em>anneau</em>', 'Son profil, sa largeur, et s’il porte des diamants.'],
      metal: ['Métal', 'Le <em>métal</em>', 'L’alliage, le métal des griffes et la finition.'],
      details: ['Détails', 'Les <em>détails</em>', 'Ce qui ne se voit pas : diamants cachés, bordure perlée, mots gravés.'],
      size: ['Taille', 'La <em>taille</em>', 'La dernière mesure qu’il nous faut pour la faire.'],
      review: ['Votre bague', 'Votre <em>bague</em>', 'Tout ce que vous avez choisi, chiffré ligne par ligne.'],
    },
    stepOf: (n, of) => `Étape ${n} sur ${of}`,
    next: (step) => `Suivant : ${step}`,
    back: 'Retour',
    begin: 'Partir d’une création de la maison',
    beginNote: 'Des créations de la maison, telles qu’elles se construisent ici. Changez tout.',
    surprise: 'Surprenez-moi',
    sherbrooke: 'Halo saphir Sherbrooke',
    yourDesigns: 'Vos créations',
    openDesign: (title) => `Ouvrir ${title}`,
    forget: (title) => `Retirer ${title}`,
    groups: { type: 'Pierre', shape: 'Forme', colour: 'Couleur', clarity: 'Pureté', grade: 'Qualité', style: 'Style', height: 'Hauteur', shoulders: 'Épaules', sides: 'Pierres latérales', sideCarat: 'Chaque pierre latérale', count: 'Griffes', tip: 'Pointes des griffes', extras: 'Raffinements', form: 'Profil', stones: 'Diamants', coverage: 'Jusqu’où', width: 'Largeur', bandMetal: 'Métal', head: 'Métal des griffes', bezelIn: 'Métal du serti clos', finish: 'Finition', hidden: 'Touches cachées', engraving: 'Gravure', font: 'Lettrage' },
    colourNote: 'D est la plus rare, sans couleur; dès I, une légère chaleur se voit sur un métal blanc.',
    clarityNote: 'Dès VS2, rien ne se voit à l’œil nu; le reste est affaire de loupe.',
    current: 'Choisi',
    same: 'Même prix',
    noClaws: 'Le serti clos tient la pierre dans un rebord de métal : il n’y a pas de griffes à choisir.',
    unavailable: { channel: 'Non offert sur ce profil : le pavé le remplace.', vTips: 'Seules les pierres à pointes en ont besoin.', compass: 'Pour les pierres rondes et carrées.', halo: 'Le halo entoure déjà la pierre.', bezelUnder: 'Le rebord du serti clos ne laisse pas de place sous la pierre.', bezelSides: 'Le rebord du serti clos referme la tête.' },
    mm: (n) => `${n} mm`,
    ct: (n) => `${n} ct`,
    engravingHint: (n) => `À l’intérieur de l’anneau, jusqu’à ${n} caractères. Offerte.`,
    engravingPlaceholder: 'Une date, des initiales, un mot',
    count: (n, of) => `${n}/${of}`,
    insideBand: 'À l’intérieur de l’anneau',
    insideLabel: (text) => `À l’intérieur de l’anneau : ${text}`,
    sizeIntro: 'Si vous choisissez pour quelqu’un d’autre, nous pouvons prendre sa taille lors d’une visite, discrètement, ou lui poster un baguier.',
    savedSize: (s) => `Utiliser votre taille enregistrée, ${s}`,
    sizeVisit: 'Prendre rendez-vous pour mesurer la taille',
    complete: 'Chaque choix est fait. L’atelier peut partir de cette création.',
    completeShort: 'Chaque choix est fait',
    remaining: (n) => (n < 2 ? 'Il reste un choix' : `Il reste ${n} choix`),
    goTo: (step) => `Aller à : ${step}`,
    consult: 'Réserver une consultation création',
    consultNote: (salon, video) => `${salon} au salon, ou ${video} en vidéo, avec cette création sur l’établi.`,
    minutes: (n) => (n === 60 ? 'Une heure' : `${n} minutes`),
    updateBag: 'Mettre à jour le panier',
    keep: 'Garder cette création',
    kept: 'Gardée dans vos créations',
    ask: 'Parler à un joaillier',
    picture: 'Enregistrer une image',
    shareEyebrow: 'Créée avec Teresa & Sons',
    priced: 'Comment elle est chiffrée',
    spec: 'La fiche technique',
    honest: 'Une illustration de votre création. Avant toute fonte, un joaillier confirme chaque mesure avec vous et vous montre les pierres elles-mêmes.',
    announce: (label, price) => `${label}. ${price}.`,
    file: 'teresa-and-sons-bague',
  },
)

const label = 'text-[11px] uppercase tracking-[0.22em]'
const action = 'group inline-flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]'
const underline = 'border-b border-transparent pb-0.5 transition-colors group-hover:border-[var(--gold-vermeil)]'
const sameDesign = (a: RingDesign, b: RingDesign) => JSON.stringify(a) === JSON.stringify(b)

interface ChoiceProps {
  on: boolean
  onClick: () => void
  name: string
  note?: string
  glyph?: GlyphKind
  swatch?: string
  delta: number | null
  disabled?: boolean
  why?: string
}

/** One option of a step: its drawing, its name, a line about it, and what choosing it would change in the price. */
function Choice({ on, onClick, name, note, glyph, swatch, delta, disabled = false, why }: ChoiceProps) {
  const t = useCopy(COPY)
  const { currency } = useStore()
  const line = disabled && why ? why : note
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} className={`group relative flex h-full flex-col items-start border p-3 text-left transition-colors duration-500 disabled:cursor-not-allowed ${on ? 'border-[var(--text-espresso)] bg-[var(--bg-silk)]/70' : 'border-[var(--border-hairline)] enabled:hover:border-[var(--text-taupe)]'}`}>
      {on && <Check size={12} strokeWidth={1.4} className="absolute right-2.5 top-2.5" aria-hidden />}
      {glyph && <Glyph glyph={glyph} className={`h-11 w-11 transition-colors duration-500 group-disabled:opacity-40 ${on ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)] group-hover:text-[var(--text-espresso)]'}`} />}
      {swatch && <span aria-hidden className="h-9 w-9 rounded-full ring-1 ring-[var(--border-hairline)] group-disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${swatch}, #ffffffcc 45%, ${swatch})` }} />}
      <span className="mt-2 text-[13px] leading-snug wrap-anywhere group-disabled:opacity-40">{name}</span>
      {line && <span className="mt-1 text-[11px] leading-snug text-[var(--text-taupe)]">{line}</span>}
      <span className="font-spec mt-auto pt-2 text-[10px] tracking-[0.04em] text-[var(--text-taupe)]">
        {on ? t.current : disabled ? '' : delta === null || delta === 0 ? t.same : signed(delta, currency)}
      </span>
    </button>
  )
}

/** A yes-or-no touch (cathedral shoulders, double claws, a hidden halo), with its drawing and its price. */
function Toggle({ on, onClick, name, note, glyph, delta, disabled = false, why }: Omit<ChoiceProps, 'swatch'> & { glyph: GlyphKind }) {
  const { currency } = useStore()
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} disabled={disabled} className={`group flex w-full items-center gap-4 border px-4 py-3 text-left transition-colors duration-500 disabled:cursor-not-allowed ${on ? 'border-[var(--text-espresso)] bg-[var(--bg-silk)]/70' : 'border-[var(--border-hairline)] enabled:hover:border-[var(--text-taupe)]'}`}>
      <Glyph glyph={glyph} className={`h-10 w-10 shrink-0 group-disabled:opacity-40 ${on ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)]'}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] group-disabled:opacity-40">{name}</span>
        <span className="block text-[11px] leading-snug text-[var(--text-taupe)]">{disabled && why ? why : note}</span>
      </span>
      <span className="font-spec shrink-0 text-[10px] text-[var(--text-taupe)]">{!disabled && delta ? signed(on ? -delta : delta, currency) : ''}</span>
      <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-500 group-disabled:opacity-40 ${on ? 'bg-[var(--text-espresso)]' : 'bg-[var(--border-hairline)]'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg-travertine)] transition-[left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

/** A row of short choices (heights, counts, coverage, lettering). */
function Segments<T extends string | number>({ value, options, onChange, name, legend }: { value: T; options: readonly T[]; onChange: (v: T) => void; name: (v: T) => string; legend: string }) {
  return (
    <div role="group" aria-label={legend} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={String(o)} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors duration-500 ${value === o ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
          {name(o)}
        </button>
      ))}
    </div>
  )
}

/** A step's group of options under its label. */
function Group({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  const id = useId()
  return (
    <div role={title ? 'group' : undefined} aria-labelledby={title ? id : undefined} className="mt-9 first:mt-0">
      {(title || aside) && (
        <div className="mb-3.5 flex items-baseline justify-between gap-4">
          {title && <h3 id={id} className={label}>{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </div>
  )
}

/** The ring designer: a ring built in 3D as it is designed, step by step, with its price itemised as it changes, the
 *  atelier's notes, and every way to carry it on (the bag, a consultation, the try-on, a share). Everything is kept in
 *  the address, so a design can be sent, bookmarked or reopened from the bag. */
export default function Designer({ query }: { query: Query }) {
  const { currency, cart, addToCart, updateQty, openAsk, profile, designs, saveDesign, forgetDesign, designDraft, setDesignDraft, replaceQuery } = useStore()
  const { locale } = useLocale()
  const t = useCopy(COPY)
  const r = useCopy(RING_COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const { openTryOn } = useTryOn()
  const root = useRef<HTMLDivElement>(null)
  const stepsTop = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const viewer = useRef<ViewerApi | null>(null)
  useReveal(root)

  // Where the ring starts: a code in the address, a house design, the visitor's draft, or the classic solitaire.
  const [resumed, setResumed] = useState(() => !query.r && !query.from && !!designDraft)
  const [design, setDesign] = useState<RingDesign>(() => decodeDesign(query.r) ?? PRESETS.find((p) => p.id === query.from)?.design ?? decodeDesign(designDraft) ?? DEFAULT_DESIGN)
  const [step, setStep] = useState<StepId>(() => (STEPS.includes(query.step as StepId) ? (query.step as StepId) : 'stone'))
  const [done, setDone] = useState<StepId[]>([])
  const [past, setPast] = useState<RingDesign[]>([])
  const [future, setFuture] = useState<RingDesign[]>([])
  const [caption, setCaption] = useState<{ text: string; key: number } | null>(null)
  const [announce, setAnnounce] = useState('')
  const [budget, setBudget] = useState<{ amount: number; currency: Currency } | null>(null)
  const [statementOpen, setStatementOpen] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [kept, setKept] = useState(false)
  const [card, setCard] = useState<{ code: string; image: string } | null>(null)
  const [barAway, setBarAway] = useState(false)
  const latest = useRef(design)
  latest.current = design
  const lastField = useRef<{ field: string; at: number } | null>(null)

  const statement = useMemo(() => priceRing(design, currency, locale), [design, currency, locale])
  const price = statement.price
  const layout = statement.layout
  const budgetAmount = budget?.currency === currency ? budget.amount : null
  const notes = useMemo(() => adviseOn(design, { currency, budget: budgetAmount, done }, locale), [design, currency, budgetAmount, done, locale])
  const described = useMemo(() => describeDesign(design, locale), [design, locale])
  const code = encodeDesign(design)
  const made = designCode(design)
  // Opened from the bag's Edit: the line it came from, which "Update the bag" replaces.
  const [editing, setEditing] = useState<string | null>(() => {
    const from = query.edit === '1' ? decodeDesign(query.r) : null
    return from ? designCode(from) : null
  })
  const editLine = editing ? cart.find((l) => l.design === editing) : undefined
  const commission = getProduct(DESIGN_SLUG)
  const weeks = commission?.leadTimeWeeks ?? 8
  const stones = 1 + (layout.sides ? 2 : 0) + (layout.halo?.count ?? 0) + (layout.hiddenHalo?.count ?? 0) + (layout.pave?.count ?? 0) + (layout.peekaboo?.count ?? 0) + (layout.surprise?.count ?? 0)
  const inBag = cart.some((l) => l.key === lineKey({ slug: DESIGN_SLUG, size: design.size ?? undefined, design: made }))
  const chosen = STEPS.slice(0, 7).filter((s) => (s === 'size' ? !!design.size : done.includes(s)))
  const complete = chosen.length === 7
  const index = STEPS.indexOf(step)
  const delta = (p: DesignPatch) => ringPrice(patch(design, p), currency) - price

  /** Takes a new design: recorded for undo (a dragged slider or typed text records once), named on the ring. */
  const commit = useCallback((next: RingDesign, name: string | null, field?: string) => {
    const cur = latest.current
    if (sameDesign(cur, next)) return
    const now = Date.now()
    const merge = !!field && lastField.current?.field === field && now - lastField.current.at < 900
    lastField.current = field ? { field, at: now } : null
    if (!merge) setPast((p) => [...p.slice(-49), cur])
    setFuture([])
    setDesign(next)
    setResumed(false)
    if (name) {
      setCaption({ text: name, key: now })
      setAnnounce(t.announce(name, `${formatPrice(ringPrice(next, currency), currency)} ${currency}`))
    }
  }, [currency, t])

  const change = (p: DesignPatch, name: string | null, field?: string) => commit(patch(latest.current, p), name, field)

  // The stacks as they stand, read outside the updaters: StrictMode runs an updater twice.
  const pastRef = useRef(past)
  pastRef.current = past
  const futureRef = useRef(future)
  futureRef.current = future
  const undo = useCallback(() => {
    const prev = pastRef.current[pastRef.current.length - 1]
    if (!prev) return
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [latest.current, ...futureRef.current].slice(0, 50)
    setPast(pastRef.current)
    setFuture(futureRef.current)
    latest.current = prev
    setDesign(prev)
    lastField.current = null
  }, [])
  const redo = useCallback(() => {
    const [next, ...rest] = futureRef.current
    if (!next) return
    futureRef.current = rest
    pastRef.current = [...pastRef.current, latest.current].slice(-50)
    setFuture(futureRef.current)
    setPast(pastRef.current)
    latest.current = next
    setDesign(next)
    lastField.current = null
  }, [])

  // ⌘Z / Ctrl+Z undoes, with Shift (or Ctrl+Y) it redoes; text fields keep their own.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.target as Element).closest('input, textarea, select, [contenteditable]')) return
      if (document.querySelector('[aria-modal="true"]:not([inert])')) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // A new note to protect the stone is said aloud too, after the change that brought it.
  const careIds = notes.filter((n) => n.tone === 'care').map((n) => n.id).join()
  const lastCare = useRef(careIds)
  useEffect(() => {
    const before = lastCare.current.split(',')
    lastCare.current = careIds
    const fresh = notes.filter((n) => n.tone === 'care' && !before.includes(n.id))
    if (fresh.length) setAnnounce((a) => `${a} ${fresh.map((n) => n.text).join(' ')}`)
  }, [careIds])

  // Phones: the bar steps aside as the footer comes up, so the end of the page stays clear. The observer's root
  // reaches far above the screen, so the end counts as reached however it is passed: a scroll or a jump.
  useEffect(() => {
    const el = end.current
    if (!el) return
    const io = new IntersectionObserver((entries) => setBarAway(entries[entries.length - 1].isIntersecting), { rootMargin: '100000px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The address and the draft follow the design, a moment after each change.
  useEffect(() => {
    const id = window.setTimeout(() => {
      replaceQuery({ r: code, ...(step === 'stone' ? {} : { step }), ...(editing ? { edit: '1' } : {}) })
      setDesignDraft(code)
    }, 400)
    return () => window.clearTimeout(id)
  }, [code, step, editing, replaceQuery, setDesignDraft])

  // The review's picture of the ring, for the share and the bag, taken once per design.
  useEffect(() => {
    if (step !== 'review' || card?.code === made) return
    let gone = false
    const id = window.setTimeout(async () => {
      const image = await viewer.current?.snapshot('card', 360, 450)
      if (image && !gone) setCard({ code: made, image })
    }, 1600)
    return () => {
      gone = true
      window.clearTimeout(id)
    }
  }, [step, made, card])

  // The moment the ring is complete, it turns once in the light.
  const wasComplete = useRef(complete)
  useEffect(() => {
    if (complete && !wasComplete.current) {
      viewer.current?.turnAround()
      setCaption({ text: t.completeShort, key: Date.now() })
    }
    wasComplete.current = complete
  }, [complete, t])

  // A confirmation fades on its own.
  useEffect(() => {
    if (!kept) return
    const id = window.setTimeout(() => setKept(false), 2600)
    return () => window.clearTimeout(id)
  }, [kept])
  useEffect(() => setKept(false), [made])

  const goTo = (to: StepId) => {
    setDone((d) => (d.includes(step) ? d : [...d, step]))
    setStep(to)
    // The new step's heading takes the focus: the keyboard carries on from it, and a screen reader says where it is.
    requestAnimationFrame(() => document.getElementById('designer-step')?.focus({ preventScroll: true }))
    const el = stepsTop.current
    if (!el) return
    // Back to the top of the steps: on phones, below the ring while it is pinned above them.
    const lenis = getLenis()
    const phone = window.innerWidth < 1024
    const ring = stage.current
    const pinned = phone && !!ring && getComputedStyle(ring).position === 'sticky'
    const offset = phone ? -((pinned && ring ? ring.offsetHeight : 0) + 120) : -130
    if (el.getBoundingClientRect().top < 0 || phone) {
      if (lenis) lenis.scrollTo(el, { offset })
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
    }
  }

  const rescueFocus = (near?: string) =>
    requestAnimationFrame(() => {
      if (document.activeElement !== document.body) return
      const el = (near && document.querySelector<HTMLElement>(near)) || document.getElementById('designer-step')
      el?.focus({ preventScroll: true })
    })

  // The design is kept with its picture, drawn as a still (the review's own card when it already has one).
  const keepDesign = async () => {
    const image = card?.code === made ? card.image : await viewer.current?.snapshot('card', 360, 450)
    if (image) saveDesign({ code: made, image, saved: new Date().toISOString() })
  }

  const add = () => {
    if (!design.size) {
      setSizeError(true)
      goTo('size')
      return
    }
    void keepDesign()
    const line = { slug: DESIGN_SLUG, size: design.size, design: made }
    // Editing a ring already in the bag: its line gives way to the new one, keeping its quantity.
    if (editLine && editLine.design !== made) {
      const qty = editLine.qty + (cart.find((l) => l.key === lineKey(line))?.qty ?? 0)
      updateQty(editLine.key, 0)
      addToCart(line)
      if (qty > 1) updateQty(lineKey(line), qty)
    } else addToCart(line)
    setEditing(made)
  }

  const consultRequest = { purpose: 'design' as const, pieces: [{ slug: DESIGN_SLUG, size: design.size ?? undefined, design: made }] }

  const tryOn = async () => {
    const image = await viewer.current?.snapshot('tryon', 720, 720)
    if (!commission || !image) return
    // A metal chosen on the hand comes back to the design.
    openTryOn({ product: commission, design: { image, title: described.title, price, code: made, size: design.size, onSize: () => goTo('size'), onMetal: (m) => change({ metal: { band: m } }, catalog.metal(m)) } })
  }

  const savePicture = async () => {
    const url = await viewer.current?.snapshot('view', 1600, 2000)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.file}.jpg`
    a.click()
  }

  const fromPreset = (d: RingDesign, name: string) => commit(d, name)
  const presetName = (id: string, slug?: string) => {
    const p = slug && getProduct(slug)
    return p ? catalog.name(p) : t.sherbrooke
  }
  const stepNotes = notes.filter((n) => n.step === step && n.id !== 'complete')
  const careOn = (s: StepId) => notes.some((n) => n.step === s && n.tone === 'care')
  const ct = (n: number) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const mm = (n: number) => formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const { stone, setting, prongs, band, metal, details } = design
  const bezel = setting.style === 'bezel'
  const points = CUTS[stone.shape].points > 0
  const compassOk = ['round', 'cushion', 'princess', 'asscher'].includes(stone.shape) && !(stone.shape === 'princess' && prongs.vTips)
  const share = {
    kind: 'piece' as const,
    id: 'ring-designer',
    title: described.title,
    eyebrow: t.shareEyebrow,
    image: card?.code === made ? card.image : commission?.images[0],
    route: href.designer({ r: made }),
    detail: described.lines.join(' · '),
    priceText: `${formatPrice(price, currency)} ${currency}`,
    hint: { size: design.size ? sizeLabel(design.size) : undefined },
  }

  // ─── Each step's options ────────────────────────────────────────────────────────────────────────────────────────
  const panels: Record<StepId, React.ReactNode> = {
    stone: (
      <>
        {/* House designs to begin from */}
        <Group title={t.begin}>
          <p className="-mt-1.5 mb-3 text-xs leading-relaxed text-[var(--text-taupe)]">{t.beginNote}</p>
          <div className="-mx-1 -mt-1.5 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 pt-1.5" data-lenis-prevent-horizontal>
            {PRESETS.map((p) => {
              const on = sameDesign({ ...p.design, size: design.size }, design)
              const name = presetName(p.id, p.slug)
              return (
                <button key={p.id} type="button" onClick={() => fromPreset({ ...p.design, size: design.size }, name)} aria-pressed={on} className={`flex w-36 shrink-0 flex-col items-start border px-3.5 py-3 text-left transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--bg-silk)]/70' : 'border-[var(--border-hairline)] hover:border-[var(--text-taupe)]'}`}>
                  <Glyph glyph={{ kind: 'shape', value: p.design.stone.shape }} className="h-8 w-8 text-[var(--text-taupe)]" />
                  <span className="font-serif-editorial mt-2 text-base leading-tight">{name}</span>
                  <span className="font-spec mt-0.5 text-[10px] text-[var(--text-taupe)]">{t.ct(ct(p.design.stone.carat))} · {r.shapes[p.design.stone.shape].name}</span>
                </button>
              )
            })}
            <button type="button" onClick={() => commit({ ...surprise(), size: design.size }, t.surprise)} className="flex w-36 shrink-0 flex-col items-start justify-between border border-dashed border-[var(--text-taupe)] px-3.5 py-3 text-left transition-colors hover:border-[var(--text-espresso)]">
              <Shuffle size={18} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" />
              <span className="font-serif-editorial mt-2 text-base leading-tight">{t.surprise}</span>
            </button>
          </div>
        </Group>
        <Group title={t.groups.type}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STONE_TYPES.map((v) => <Choice key={v} on={stone.type === v} onClick={() => change({ stone: { type: v } }, r.types[v].name)} name={r.types[v].name} glyph={{ kind: 'type', value: v }} delta={delta({ stone: { type: v } })} />)}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-taupe)]">{r.types[stone.type].note}</p>
        </Group>
        <Group title={t.groups.shape}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
            {SHAPES.map((v) => <Choice key={v} on={stone.shape === v} onClick={() => change({ stone: { shape: v } }, r.shapes[v].name)} name={r.shapes[v].name} glyph={{ kind: 'shape', value: v }} delta={delta({ stone: { shape: v } })} />)}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-taupe)]">{r.shapes[stone.shape].note}</p>
        </Group>
        <Group title="">
          <CaratField design={design} currency={currency} price={price} onChange={(c) => change({ stone: { carat: c } }, t.ct(ct(c)), 'carat')} />
        </Group>
        {stone.type === 'diamond' ? (
          <>
            <Group title={t.groups.colour} aside={<span className="font-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{r.colourBands.find(([a, b]) => COLOURS.indexOf(a) <= COLOURS.indexOf(stone.colour) && COLOURS.indexOf(stone.colour) <= COLOURS.indexOf(b))?.[2]}</span>}>
              <Scale options={COLOURS} value={stone.colour} onChange={(v) => change({ stone: { colour: v } }, `${t.groups.colour} ${v}`)} delta={(v) => delta({ stone: { colour: v } })} legend={t.groups.colour} tint />
              <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-taupe)]">{t.colourNote}</p>
            </Group>
            <Group title={t.groups.clarity} aside={<span className="font-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{r.clarityBands.find(([a, b]) => CLARITIES.indexOf(a) <= CLARITIES.indexOf(stone.clarity) && CLARITIES.indexOf(stone.clarity) <= CLARITIES.indexOf(b))?.[2]}</span>}>
              <Scale options={CLARITIES} value={stone.clarity} onChange={(v) => change({ stone: { clarity: v } }, `${t.groups.clarity} ${v}`)} delta={(v) => delta({ stone: { clarity: v } })} legend={t.groups.clarity} />
              <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-taupe)]">{t.clarityNote}</p>
            </Group>
          </>
        ) : (
          <Group title={t.groups.grade}>
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((v) => <Choice key={v} on={stone.grade === v} onClick={() => change({ stone: { grade: v } }, r.grades[v].name)} name={r.grades[v].name} note={r.grades[v].note} delta={delta({ stone: { grade: v } })} />)}
            </div>
          </Group>
        )}
        <div className="mt-9">
          <BudgetFinder design={design} currency={currency} budget={budgetAmount} onBudget={(amount) => setBudget(amount === null ? null : { amount, currency })} onApply={(p, name) => change(p, name)} />
        </div>
      </>
    ),
    setting: (
      <>
        <Group title={t.groups.style}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {STYLES.map((v) => <Choice key={v} on={setting.style === v} onClick={() => change({ setting: { style: v } }, r.styles[v].name)} name={r.styles[v].name} note={r.styles[v].note} glyph={{ kind: 'style', value: v }} delta={delta({ setting: { style: v } })} />)}
          </div>
        </Group>
        <Group title={t.groups.height}>
          <div className="grid grid-cols-3 gap-2">
            {HEIGHTS.map((v) => <Choice key={v} on={setting.height === v} onClick={() => change({ setting: { height: v } }, r.heights[v].name)} name={r.heights[v].name} note={r.heights[v].note} glyph={{ kind: 'height', value: v }} delta={delta({ setting: { height: v } })} />)}
          </div>
        </Group>
        <Group title={t.groups.shoulders}>
          <Toggle on={setting.cathedral} onClick={() => change({ setting: { cathedral: !setting.cathedral } }, r.cathedral.name)} name={r.cathedral.name} note={r.cathedral.note} glyph={{ kind: 'cathedral' }} delta={delta({ setting: { cathedral: true } }) - delta({ setting: { cathedral: false } })} />
        </Group>
        {setting.style === 'three-stone' && (
          <>
            <Group title={t.groups.sides}>
              <div className="grid grid-cols-3 gap-2">
                {SIDE_SHAPES.map((v) => <Choice key={v} on={setting.sides === v} onClick={() => change({ setting: { sides: v } }, r.sideStones(r.sides[v]))} name={r.sides[v]} glyph={{ kind: 'sides', value: v }} delta={delta({ setting: { sides: v } })} />)}
              </div>
            </Group>
            <Group title={t.groups.sideCarat} aside={<span className="font-spec text-sm">{t.ct(ct(setting.sideCarat))}</span>}>
              <input type="range" min={SIDE_CARAT.min} max={Math.min(SIDE_CARAT.max, Math.round(stone.carat * 60) / 100)} step={0.01} value={setting.sideCarat} onChange={(e) => change({ setting: { sideCarat: Number(e.target.value) } }, t.ct(ct(Number(e.target.value))), 'sideCarat')} aria-label={t.groups.sideCarat} aria-valuetext={t.ct(ct(setting.sideCarat))} className="w-full accent-[var(--text-espresso)]" />
            </Group>
          </>
        )}
      </>
    ),
    prongs: bezel ? (
      <p className="border border-[var(--border-hairline)] bg-[var(--bg-silk)]/50 px-5 py-4 text-sm leading-relaxed">{t.noClaws}</p>
    ) : (
      <>
        <Group title={t.groups.count}>
          <div className="grid grid-cols-2 gap-2">
            {([4, 6] as const).map((v) => <Choice key={v} on={prongs.count === v && !prongs.double} onClick={() => change({ prongs: { count: v, double: false } }, r.counts[v])} name={r.counts[v]} glyph={{ kind: 'count', value: v }} delta={delta({ prongs: { count: v, double: false } })} />)}
          </div>
        </Group>
        <Group title={t.groups.tip}>
          <div className="grid grid-cols-3 gap-2">
            {TIPS.map((v) => <Choice key={v} on={prongs.tip === v} onClick={() => change({ prongs: { tip: v } }, r.tips[v].name)} name={r.tips[v].name} note={r.tips[v].note} glyph={{ kind: 'tip', value: v }} delta={delta({ prongs: { tip: v } })} />)}
          </div>
        </Group>
        <Group title={t.groups.extras}>
          <div className="space-y-2">
            <Toggle on={prongs.double} onClick={() => change({ prongs: { double: !prongs.double, count: 4 } }, r.double.name)} name={r.double.name} note={r.double.note} glyph={{ kind: 'double' }} delta={delta({ prongs: { double: true, count: 4 } }) - delta({ prongs: { double: false } })} />
            <Toggle on={prongs.vTips} onClick={() => change({ prongs: { vTips: !prongs.vTips } }, r.vTips.name)} name={r.vTips.name} note={r.vTips.note} glyph={{ kind: 'vTips' }} delta={delta({ prongs: { vTips: true } }) - delta({ prongs: { vTips: false } })} disabled={!points} why={t.unavailable.vTips} />
            <Toggle on={prongs.compass} onClick={() => change({ prongs: { compass: !prongs.compass } }, r.compass.name)} name={r.compass.name} note={r.compass.note} glyph={{ kind: 'compass' }} delta={0} disabled={!compassOk} why={t.unavailable.compass} />
          </div>
        </Group>
      </>
    ),
    band: (
      <>
        <Group title={t.groups.form}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {FORMS.map((v) => <Choice key={v} on={band.form === v} onClick={() => change({ band: { form: v } }, r.forms[v].name)} name={r.forms[v].name} note={r.forms[v].note} glyph={{ kind: 'form', value: v }} delta={delta({ band: { form: v } })} />)}
          </div>
        </Group>
        <Group title={t.groups.stones}>
          <div className="grid grid-cols-3 gap-2">
            {BAND_STONES.map((v) => <Choice key={v} on={band.stones === v} onClick={() => change({ band: { stones: v } }, r.bandStones[v].name)} name={r.bandStones[v].name} note={r.bandStones[v].note} glyph={{ kind: 'bandStones', value: v }} delta={delta({ band: { stones: v } })} disabled={v === 'channel' && (band.form === 'twist' || band.form === 'knife')} why={t.unavailable.channel} />)}
          </div>
        </Group>
        {band.stones !== 'none' && (
          <Group title={t.groups.coverage}>
            <div className="grid grid-cols-3 gap-2">
              {COVERAGES.map((v) => <Choice key={v} on={band.coverage === v} onClick={() => change({ band: { coverage: v } }, r.coverage[v])} name={r.coverage[v]} glyph={{ kind: 'coverage', value: v }} delta={delta({ band: { coverage: v } })} />)}
            </div>
          </Group>
        )}
        <Group title={t.groups.width} aside={<span className="font-spec text-sm">{t.mm(mm(band.width))}</span>}>
          <input type="range" min={WIDTH.min} max={WIDTH.max} step={WIDTH.step} value={band.width} onChange={(e) => change({ band: { width: Number(e.target.value) } }, t.mm(mm(Number(e.target.value))), 'width')} aria-label={t.groups.width} aria-valuetext={t.mm(mm(band.width))} className="w-full accent-[var(--text-espresso)]" />
          <div aria-hidden className="font-spec mt-1 flex justify-between text-[9px] text-[var(--text-taupe)]"><span>{t.mm(mm(WIDTH.min))}</span><span>{t.mm(mm(WIDTH.max))}</span></div>
          <div className="mt-4">
            <Toggle on={band.taper} onClick={() => change({ band: { taper: !band.taper } }, r.taper.name)} name={r.taper.name} note={r.taper.note} glyph={{ kind: 'taper' }} delta={delta({ band: { taper: true } }) - delta({ band: { taper: false } })} />
          </div>
        </Group>
      </>
    ),
    metal: (
      <>
        <Group title={t.groups.bandMetal}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {BAND_METALS.map((v) => <Choice key={v} on={metal.band === v} onClick={() => change({ metal: { band: v } }, catalog.metal(v))} name={catalog.metal(v)} swatch={METALS[v].swatch} delta={delta({ metal: { band: v } })} />)}
          </div>
        </Group>
        {/* The claws' metal, or for a bezel, the bezel's: the rim around the stone can be white on a gold band too */}
        <Group title={bezel ? t.groups.bezelIn : t.groups.head}>
          <Segments value={metal.head} options={HEAD_METALS} onChange={(v) => change({ metal: { head: v } }, (bezel ? r.bezelHeads : r.heads)[v])} name={(v) => (bezel ? r.bezelHeads : r.heads)[v]} legend={bezel ? t.groups.bezelIn : t.groups.head} />
        </Group>
        <Group title={t.groups.finish}>
          <div className="grid grid-cols-3 gap-2">
            {FINISHES.map((v) => <Choice key={v} on={metal.finish === v} onClick={() => change({ metal: { finish: v } }, r.finishes[v].name)} name={r.finishes[v].name} note={r.finishes[v].note} glyph={{ kind: 'finish', value: v }} delta={delta({ metal: { finish: v } })} />)}
          </div>
        </Group>
      </>
    ),
    details: (
      <>
        <Group title={t.groups.hidden}>
          <div className="space-y-2">
            {(['hiddenHalo', 'peekaboo', 'surprise', 'milgrain'] as const).map((k) => (
              <Toggle key={k} on={details[k]} onClick={() => change({ details: { [k]: !details[k] } }, r.details[k].name)} name={r.details[k].name} note={r.details[k].note} glyph={{ kind: k }} delta={delta({ details: { [k]: true } }) - delta({ details: { [k]: false } })} disabled={(k === 'hiddenHalo' && (setting.style === 'halo' || bezel)) || (k === 'peekaboo' && bezel)} why={k === 'hiddenHalo' ? (bezel ? t.unavailable.bezelUnder : t.unavailable.halo) : t.unavailable.bezelSides} />
            ))}
          </div>
        </Group>
        <Group title={t.groups.engraving} aside={<span className="font-spec text-[10px] text-[var(--text-taupe)]">{t.count(details.engraving.length, ENGRAVING_MAX)}</span>}>
          <input value={details.engraving} onChange={(e) => change({ details: { engraving: engravable(e.target.value) } }, null, 'engraving')} onBlur={() => details.engraving.trim() && setCaption({ text: r.engraved(details.engraving.trim()), key: Date.now() })} maxLength={ENGRAVING_MAX} placeholder={t.engravingPlaceholder} aria-label={t.groups.engraving} className="w-full border-b border-[var(--border-hairline)] bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-[var(--text-taupe)] focus:border-[var(--text-espresso)]" style={{ fontFamily: details.font === 'script' ? "'Pinyon Script', cursive" : details.font === 'serif' ? "'Baskervville', serif" : undefined, fontStyle: details.font === 'serif' ? 'italic' : undefined, letterSpacing: details.font === 'block' ? '0.12em' : undefined }} />
          <p className="mt-2 text-xs text-[var(--text-taupe)]">{t.engravingHint(ENGRAVING_MAX)}</p>
          <div className="mt-4">
            <Segments value={details.font} options={FONTS} onChange={(v) => change({ details: { font: v } }, r.fonts[v])} name={(v) => r.fonts[v]} legend={t.groups.font} />
          </div>
          {details.engraving.trim() && <InsideBand text={details.engraving.trim()} font={details.font} caption={t.insideBand} spoken={t.insideLabel(details.engraving.trim())} />}
        </Group>
      </>
    ),
    size: (
      <>
        <div id="step-size">
          <RingSize value={design.size ?? undefined} onChange={(s) => { setSizeError(false); change({ size: s }, common.size(sizeLabel(s))) }} error={sizeError} />
        </div>
        {profile.ringSize && profile.ringSize !== design.size && (
          <button type="button" onClick={() => { setSizeError(false); change({ size: profile.ringSize! }, common.size(sizeLabel(profile.ringSize!))) }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors hover:border-[var(--text-espresso)]">
            <Ruler size={13} strokeWidth={1.4} /> {t.savedSize(sizeLabel(profile.ringSize))}
          </button>
        )}
        <p className="mt-6 text-sm leading-relaxed text-[var(--text-taupe)]">{t.sizeIntro}</p>
        <VisitButton variant="link" onBefore={keepDesign} request={consultRequest} className="mt-4">{t.sizeVisit}</VisitButton>
      </>
    ),
    review: (
      <>
        {/* Where the design stands */}
        <div className={`flex items-start gap-4 border px-5 py-4 ${complete ? 'border-[var(--gold-vermeil)] bg-[var(--bg-silk)]/60' : 'border-[var(--border-hairline)]'}`} role="status">
          {complete ? <Hallmark className="h-12 w-12 shrink-0 text-[var(--gold-vermeil)]" /> : <span className="font-spec flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] text-sm">{7 - chosen.length}</span>}
          <div className="min-w-0">
            <p className="text-sm leading-relaxed">{complete ? t.complete : t.remaining(7 - chosen.length)}</p>
            {!complete && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {STEPS.slice(0, 7).filter((s) => !chosen.includes(s)).map((s) => <button key={s} type="button" onClick={() => goTo(s)} className="border-b border-[var(--gold-vermeil)] pb-0.5 text-[10px] uppercase tracking-[0.18em]">{t.goTo(t.steps[s][0])}</button>)}
              </div>
            )}
          </div>
        </div>

        {/* The ring in words */}
        <div className="mt-8">
          <p className="font-serif-editorial text-3xl font-light leading-tight">{described.title}</p>
          <ul className="mt-3 space-y-1">
            {described.lines.map((l) => <li key={l} className="font-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{l}</li>)}
            {design.size && <li className="font-spec text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{common.size(sizeLabel(design.size))}</li>}
          </ul>
        </div>

        {/* Carry it on */}
        <p className="font-spec mt-8 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{t.lead(weeks)}</p>
        {/* Paid as the atelier works: the deposit at checkout, the balance once the final design is approved */}
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-taupe)]"><Price amount={designDeposit(price)} className="text-[var(--text-espresso)] [&_span]:hidden" />{r.todayShare(formatNumber(DEPOSIT_SHARE, { style: 'percent' }))}<Price amount={price - designDeposit(price)} className="text-[var(--text-espresso)] [&_span]:hidden" />{r.onApproval}</p>
        <div className="mt-3 grid gap-2">
          {inBag ? <a href={href.cart} className={btnPrimary}>{common.goToBag}</a> : <button type="button" onClick={add} className={btnPrimary}>{editLine ? t.updateBag : common.addToBag}</button>}
          <VisitButton onBefore={keepDesign} request={consultRequest}>{t.consult}</VisitButton>
        </div>
        <p className="mt-2.5 text-xs text-[var(--text-taupe)]">{t.consultNote(t.minutes(visitLength('design', 'salon')), t.minutes(visitLength('design', 'video')).toLowerCase())}</p>
        <div className="mt-4 flex flex-wrap gap-x-6">
          <button type="button" onClick={tryOn} className={action}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gold-vermeil)]" /> <span className={underline}>{common.viewOnYou}</span></button>
          <button type="button" onClick={() => { void keepDesign(); setKept(true) }} className={action}><Bookmark size={13} strokeWidth={1.4} /> <span className={underline}>{kept ? t.kept : t.keep}</span></button>
          <ShareButton subject={share} className="min-h-11" />
          <button type="button" onClick={() => openAsk([], [made])} className={action}><MessageCircle size={13} strokeWidth={1.4} /> <span className={underline}>{t.ask}</span></button>
          <button type="button" onClick={savePicture} className={action}><Camera size={13} strokeWidth={1.4} /> <span className={underline}>{t.picture}</span></button>
        </div>
        <p role="status" className="sr-only">{kept ? t.kept : ''}</p>

        <section className="mt-12">
          <h3 className={`${label} mb-4`}>{t.spec}</h3>
          <DesignSpec design={design} layout={layout} metalWeight={statement.metalWeight} stones={stones} weeks={weeks} />
        </section>
        <p className="mt-6 text-xs leading-relaxed text-[var(--text-taupe)]">{t.honest}</p>
      </>
    ),
  }

  const [stepLabel, stepTitle, stepIntro] = t.steps[step]
  const nextStep = STEPS[index + 1]

  return (
    <div ref={root}>
      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,34%)] lg:gap-0">
        {/* The ring, always in view */}
        <div ref={stage} className="sticky top-[111px] z-10 h-[38svh] min-h-[260px] max-h-[400px] max-lg:[@media(max-height:520px)]:static max-lg:[@media(max-height:520px)]:h-[78svh] max-lg:[@media(max-height:520px)]:min-h-0 lg:h-[calc(100svh-111px)] lg:max-h-none">
          <RingViewer design={design} step={step} caption={caption} api={viewer} className="h-full w-full" />
        </div>

        {/* The steps */}
        <div className="relative px-6 pb-36 pt-10 lg:border-l lg:border-[var(--border-hairline)] lg:px-10 lg:pb-24 xl:px-12">
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-4 text-5xl font-light leading-[1.02] lg:text-6xl">{rich(t.title, 'text-[var(--gold-vermeil)]')}</h1>
          <p className="mt-5 text-sm leading-relaxed text-[var(--text-taupe)]">{t.intro}</p>

          {resumed && (
            <p className="mt-6 flex items-center justify-between gap-4 bg-[var(--bg-silk)] px-4 py-3 text-xs">
              <span>{t.resumed}</span>
              <button type="button" onClick={() => { commit({ ...DEFAULT_DESIGN }, t.afresh); rescueFocus() }} className="shrink-0 border-b border-[var(--gold-vermeil)] pb-0.5 text-[10px] uppercase tracking-[0.18em]">{t.afresh}</button>
            </p>
          )}

          {/* Kept designs */}
          {designs.length > 0 && (
            <div className="mt-8">
              <p className={`${label} mb-3`}>{t.yourDesigns}</p>
              <ul data-kept className="-mx-1 -mt-1.5 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 pt-1.5" data-lenis-prevent-horizontal>
                {designs.map((s) => {
                  const d = decodeDesign(s.code)
                  if (!d) return null
                  const title = describeDesign(d, locale).title
                  return (
                    <li key={s.code} className="group relative w-20 shrink-0">
                      <button type="button" onClick={() => commit(d, title)} aria-label={t.openDesign(title)} aria-current={s.code === made ? 'true' : undefined} className={`block aspect-[4/5] w-full overflow-hidden bg-[var(--bg-silk)] ring-1 transition ${s.code === made ? 'ring-[var(--text-espresso)]' : 'ring-[var(--border-hairline)] hover:ring-[var(--text-taupe)]'}`}>
                        {s.image ? <img src={s.image} alt="" className="h-full w-full object-cover" /> : <Glyph glyph={{ kind: 'shape', value: d.stone.shape }} className="m-auto h-10 w-10 text-[var(--text-taupe)]" />}
                      </button>
                      <button type="button" onClick={() => { forgetDesign(s.code); rescueFocus('[data-kept] button') }} aria-label={t.forget(title)} className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-travertine)] text-[var(--text-taupe)] opacity-0 shadow-[0_2px_8px_rgba(20,19,17,0.15)] transition-opacity hover:text-[var(--text-espresso)] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X size={12} strokeWidth={1.4} /></button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* The live price, the progress, undo */}
          <div ref={stepsTop} className="mt-10 border-y border-[var(--border-hairline)] py-5 lg:sticky lg:top-[111px] lg:z-10 lg:bg-[var(--bg-travertine)]/95 lg:backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm">{described.title}</p>
                <LivePrice amount={price} className="mt-1 text-2xl" />
                <p className="font-spec mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.beforeTax}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={undo} disabled={!past.length} aria-label={t.undo} title={t.undo} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-silk)] disabled:opacity-30"><Undo2 size={16} strokeWidth={1.4} /></button>
                <button type="button" onClick={redo} disabled={!future.length} aria-label={t.redo} title={t.redo} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-silk)] disabled:opacity-30"><Redo2 size={16} strokeWidth={1.4} /></button>
                <button type="button" onClick={() => commit({ ...DEFAULT_DESIGN }, t.afresh)} aria-label={t.afresh} title={t.afresh} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-silk)]"><RotateCcw size={15} strokeWidth={1.4} /></button>
              </div>
            </div>
            {/* The steps, with what is chosen and where a note needs a look */}
            <nav aria-label={t.stepsLabel} className="mt-5">
              <p className="font-spec mb-2 flex justify-between text-[9px] uppercase tracking-[0.22em] text-[var(--text-taupe)]"><span>{t.progress(chosen.length, 7)}</span><span>{t.stepOf(index + 1, STEPS.length)}</span></p>
              <ol className="grid grid-cols-8 gap-1">
                {STEPS.map((s, i) => {
                  const here = s === step
                  const isDone = s === 'size' ? !!design.size : done.includes(s)
                  return (
                    <li key={s}>
                      <button type="button" onClick={() => goTo(s)} aria-current={here ? 'step' : undefined} aria-label={`${i + 1}. ${t.steps[s][0]}`} title={t.steps[s][0]} className="group block w-full pt-2 text-left">
                        <span className={`block h-0.5 transition-colors duration-500 ${here ? 'bg-[var(--text-espresso)]' : isDone ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--border-hairline)] group-hover:bg-[var(--text-taupe)]'}`} />
                        <span className={`font-spec mt-1.5 flex items-center gap-1 text-[9px] ${here ? 'text-[var(--text-espresso)]' : 'text-[var(--text-taupe)]'}`}>
                          {String(i + 1).padStart(2, '0')}
                          {careOn(s) && <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--gold-vermeil)]" />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>

          {/* The step */}
          <section key={step} aria-labelledby="designer-step" className="animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] pt-10 motion-reduce:animate-none">
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{String(index + 1).padStart(2, '0')} · {stepLabel}</p>
            <h2 id="designer-step" tabIndex={-1} className="font-serif-editorial mt-3 text-4xl font-light leading-tight outline-none">{rich(stepTitle, 'text-[var(--gold-vermeil)]')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{stepIntro}</p>
            <div className="mt-9">{panels[step]}</div>
            <DesignNotes notes={stepNotes} onFix={(p, name) => { change(p, name); rescueFocus() }} className="mt-8" />

            {/* How it is priced, in every step */}
            <section className="mt-12">
              <h3 className={`${label} mb-4`}>{t.priced}</h3>
              <RingBreakdown statement={statement} stones={stones} open={step === 'review' ? !statementOpen : statementOpen} onToggle={() => setStatementOpen((o) => !o)} />
            </section>

            {/* On to the next */}
            <div className="mt-12 flex items-center justify-between gap-4">
              {index > 0 ? <button type="button" onClick={() => goTo(STEPS[index - 1])} className={btnQuiet}><ArrowLeft size={13} strokeWidth={1.4} /> {t.back}</button> : <span />}
              {/* On phones the bar below carries the way on */}
              {nextStep && <button type="button" onClick={() => goTo(nextStep)} className={`${btnPrimary} max-lg:!hidden`}>{t.next(t.steps[nextStep][0])} <ArrowRight size={14} strokeWidth={1.4} /></button>}
            </div>
          </section>
        </div>
      </div>

      {/* Phones: the price and the way on, at hand until the footer comes up */}
      <div data-fab-avoid inert={barAway} className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:hidden ${barAway ? 'translate-y-full' : 'translate-y-0'}`}>
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[var(--gold-vermeil)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ width: `${(chosen.length / 7) * 100}%` }} />
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <LivePrice amount={price} chip={false} className="text-lg max-[360px]:text-base" />
            <p className="font-spec truncate text-[9px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{t.beforeTax} · {t.progress(chosen.length, 7)}</p>
          </div>
          {nextStep ? (
            <button type="button" onClick={() => goTo(nextStep)} aria-label={t.next(t.steps[nextStep][0])} className={`${btnPrimary} shrink-0 !px-5 max-[360px]:!gap-2 max-[360px]:!px-3.5 max-[360px]:!tracking-[0.16em]`}>
              {/* The smallest phones show the step alone, with an arrow */}
              <span className="max-[360px]:hidden">{t.next(t.steps[nextStep][0])}</span>
              <span className="hidden max-[360px]:inline">{t.steps[nextStep][0]}</span>
              <ArrowRight size={13} strokeWidth={1.4} className="hidden max-[360px]:block" />
            </button>
          ) : inBag ? (
            <a href={href.cart} className={`${btnPrimary} shrink-0 !px-5 max-[360px]:!px-3.5 max-[360px]:!tracking-[0.16em]`}>{common.goToBag}</a>
          ) : (
            <button type="button" onClick={add} className={`${btnPrimary} shrink-0 !px-5 max-[360px]:!px-3.5 max-[360px]:!tracking-[0.16em]`}>{editLine ? t.updateBag : common.addToBag}</button>
          )}
        </div>
      </div>

      <VisitBand purpose="design" pieces={consultRequest.pieces} />
      <div ref={end} aria-hidden />
      <p aria-live="polite" className="sr-only">{announce}</p>
    </div>
  )
}

/** A grade scale (colour D–J, clarity IF–SI2): one step per grade, the price of each against the current one. */
function Scale<T extends Colour | Clarity>({ options, value, onChange, delta, legend, tint = false }: { options: readonly T[]; value: T; onChange: (v: T) => void; delta: (v: T) => number; legend: string; tint?: boolean }) {
  const t = useCopy(COPY)
  const { currency } = useStore()
  return (
    <div role="group" aria-label={legend} className="grid grid-cols-7 gap-px bg-[var(--border-hairline)]">
      {options.map((o, i) => {
        const on = o === value
        const d = delta(o)
        return (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={on} aria-label={`${o}, ${on ? t.current : d === 0 ? t.same : signed(d, currency)}`} className={`flex flex-col items-center gap-1 px-0.5 py-2.5 transition-colors duration-500 ${on ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'bg-[var(--bg-travertine)] hover:bg-[var(--bg-silk)]'}`}>
            {tint && <span aria-hidden className="h-2.5 w-2.5 rounded-full ring-1 ring-[var(--border-hairline)]" style={{ background: `hsl(46 ${8 + i * 9}% ${97 - i * 2.2}%)` }} />}
            <span className="font-spec text-[13px]">{o}</span>
            <span aria-hidden className={`font-spec whitespace-nowrap text-[9px] tracking-[0.02em] ${on ? 'text-white/70' : 'text-[var(--text-taupe)]'}`}>{on ? '·' : d === 0 ? '=' : signed(d, currency).replace(/\s?\$\s?/, '')}</span>
          </button>
        )
      })}
    </div>
  )
}

/** The engraving as it will read inside the band: the lettering along the curve of the metal. */
function InsideBand({ text, font, caption, spoken }: { text: string; font: RingDesign['details']['font']; caption: string; spoken: string }) {
  const style = font === 'script' ? { fontFamily: "'Pinyon Script', cursive", fontSize: '26px' } : font === 'serif' ? { fontFamily: "'Baskervville', serif", fontStyle: 'italic', fontSize: '22px' } : { fontFamily: "'Jost', sans-serif", fontSize: '15px', letterSpacing: '0.18em' }
  return (
    <figure className="mt-6 bg-[var(--bg-silk)] px-4 pb-4 pt-2">
      <svg viewBox="0 0 320 96" className="w-full" role="img" aria-label={spoken}>
        <defs>
          <linearGradient id="inside-band" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--border-hairline)" />
            <stop offset="0.5" stopColor="var(--bg-travertine)" />
            <stop offset="1" stopColor="var(--border-hairline)" />
          </linearGradient>
          <path id="inside-arc" d="M24 70 Q160 18 296 70" />
        </defs>
        <path d="M14 76 Q160 18 306 76 L306 58 Q160 0 14 58 Z" fill="url(#inside-band)" />
        <text fill="var(--text-taupe)" style={style} textAnchor="middle">
          <textPath href="#inside-arc" startOffset="50%">{text}</textPath>
        </text>
      </svg>
      <figcaption className="font-spec text-center text-[9px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">{caption}</figcaption>
    </figure>
  )
}
