// The atelier's notes on a design as it takes shape: what protects a stone, what keeps proportions right, where value
// hides, and when the ring is complete. Each note belongs to a step and may carry a one-tap fix. A budget can be given
// too, and the best stones within it are found by pricing the alternatives.
import { formatNumber, getLocale, pick, bilingual, type Locale } from '../i18n'
import { formatPrice, type Currency } from './catalog'
import { CARAT, CUTS, MAGIC_CARATS, facesUpLike, headMetal, patch, type Clarity, type Colour, type DesignPatch, type GemGrade, type RingDesign } from './ring'
import { RING_COPY } from './ringCopy'
import { ringPrice } from './ringPrice'

export type StepId = 'stone' | 'setting' | 'prongs' | 'band' | 'metal' | 'details' | 'size' | 'review'
export const STEPS: StepId[] = ['stone', 'setting', 'prongs', 'band', 'metal', 'details', 'size', 'review']

/** care: protects the ring; tip: a better choice; value: the same look for less; good: a choice well made. */
export type NoteTone = 'care' | 'tip' | 'value' | 'good'

export interface Note {
  id: string
  step: StepId
  tone: NoteTone
  text: string
  fix?: { label: string; patch: DesignPatch }
}

const COPY = bilingual(
  {
    points: (shape: string, n: number) => `A ${shape.toLowerCase()} has ${n === 1 ? 'a point' : n === 2 ? 'two points' : 'four corners'}, where a stone can chip. A V-claw guards ${n === 1 ? 'it' : 'each'}.`,
    addV: 'Add V-claws',
    tabs: 'Step cuts sit best under tab claws, which hold their corners flat.',
    useTabs: 'Use tab claws',
    six: 'From 1.25 ct, six claws hold a round more securely and keep it looking round.',
    useSix: 'Use six claws',
    width: 'A stone this size calls for a band of 1.8 mm or more, or it can look top-heavy and wear thin.',
    widen: 'Widen to 2.0 mm',
    eternity: 'All the way round, a band can’t be resized later: we’ll confirm your exact size with you before it is made.',
    whiteClaws: 'In yellow or rose gold, white claws keep a colourless diamond icy.',
    useWhite: 'Use platinum claws',
    warmGood: 'Gold warms the stone anyway: an I or J costs less and looks right in it.',
    warmWhite: 'In white metal a faint warmth shows; G or H looks whiter for a little more.',
    useH: 'Choose H',
    stepClarity: 'Step cuts show inclusions like a window: VS2 or better suits this shape.',
    useVS2: 'Choose VS2',
    magic: (lower: string, save: string) => `At ${lower} ct it would look the same and cost about ${save} less.`,
    useLower: (lower: string) => `Use ${lower} ct`,
    underMagic: 'Just under a half or whole carat: the same look, the lower price band.',
    halo: 'A halo makes the stone face up about half a size larger.',
    emeraldSoft: 'Emeralds are softer than sapphires and diamonds: tab claws or a bezel protect their edges.',
    cathedralLow: 'Cathedral shoulders rise to meet the stone: they look best on a classic or high setting.',
    useClassic: 'Use the classic height',
    snag: 'A high setting with pavé or a halo catches on knitwear; the classic height is gentler for everyday wear.',
    milgrainKnife: 'Milgrain suits rounded profiles; a knife edge reads cleaner without it.',
    noMilgrain: 'Remove milgrain',
    facesUp: (ct: string) => `Long shapes lengthen the finger and look larger for their weight: this one faces up like a ${ct} ct round.`,
    budgetOver: (over: string) => `This design is ${over} above your budget.`,
    sizeMissing: 'Your size completes the ring. Unsure? The size guide shows how to measure.',
    engraving: 'Engraving is complimentary, inside the band.',
    thinPave: 'On a band under 1.8 mm, pavé holds smaller stones: finer, but less robust.',
    widen18: 'Widen to 1.8 mm',
    twoTone: (head: string) => `${head} on a gold band: the two-tone of mid-century rings, and the whitest look for the stone.`,
    splitSmall: 'A split shank frames a larger stone; under 0.75 ct, a classic band keeps the proportions.',
    useClassicBand: 'Use a classic band',
    complete: 'Every choice made. The atelier can start from this design.',
    bezelTips: 'A bezel holds the stone in a rim of metal: there are no claws to choose.',
  },
  {
    points: (shape, n) => `${shape === 'Cœur' ? 'Un' : 'Une'} ${shape.toLowerCase()} a ${n === 1 ? 'une pointe' : n === 2 ? 'deux pointes' : 'quatre coins'}, là où une pierre peut s’ébrécher. Une griffe en V ${n === 1 ? 'la protège' : n === 2 ? 'protège chacune' : 'protège chacun'}.`,
    addV: 'Ajouter des griffes en V',
    tabs: 'Les tailles à degrés reposent mieux sous des griffes plates, qui tiennent leurs coins à plat.',
    useTabs: 'Griffes plates',
    six: 'Dès 1,25 ct, six griffes tiennent mieux un rond et lui gardent sa rondeur.',
    useSix: 'Six griffes',
    width: 'Une pierre de cette taille demande un anneau de 1,8 mm ou plus, sinon elle paraît lourde et l’anneau s’use.',
    widen: 'Élargir à 2,0 mm',
    eternity: 'Serti tout le tour, l’anneau ne pourra plus être ajusté : nous confirmerons votre taille exacte avec vous avant la fabrication.',
    whiteClaws: 'Sur l’or jaune ou rose, des griffes blanches gardent à un diamant incolore son blanc glacé.',
    useWhite: 'Griffes en platine',
    warmGood: 'L’or réchauffe la pierre de toute façon : un I ou un J coûte moins et lui va bien.',
    warmWhite: 'Sur un métal blanc, une légère chaleur se voit; G ou H paraît plus blanc pour un peu plus.',
    useH: 'Choisir H',
    stepClarity: 'Les tailles à degrés montrent les inclusions comme une fenêtre : VS2 ou mieux convient à cette forme.',
    useVS2: 'Choisir VS2',
    magic: (lower, save) => `À ${lower} ct, elle paraîtrait identique et coûterait environ ${save} de moins.`,
    useLower: (lower) => `Passer à ${lower} ct`,
    underMagic: 'Juste sous le demi-carat ou le carat entier : le même effet, dans la tranche de prix inférieure.',
    halo: 'Un halo fait paraître la pierre environ une demi-taille plus grande.',
    emeraldSoft: 'L’émeraude est plus tendre que le saphir et le diamant : des griffes plates ou un serti clos protègent ses bords.',
    cathedralLow: 'Les épaules cathédrale s’élèvent jusqu’à la pierre : elles vont mieux avec une hauteur classique ou haute.',
    useClassic: 'Hauteur classique',
    snag: 'Une monture haute avec pavé ou halo s’accroche aux tricots; la hauteur classique est plus douce au quotidien.',
    milgrainKnife: 'Le millegrain va aux profils arrondis; une lame de couteau est plus nette sans lui.',
    noMilgrain: 'Retirer le millegrain',
    facesUp: (ct) => `Les formes longues allongent le doigt et paraissent plus grandes pour leur poids : celle-ci rappelle un rond de ${ct} ct.`,
    budgetOver: (over) => `Cette bague dépasse votre budget de ${over}.`,
    sizeMissing: 'Votre taille complète la bague. Vous hésitez? Le guide des tailles explique comment mesurer.',
    engraving: 'La gravure est offerte, à l’intérieur de l’anneau.',
    thinPave: 'Sur un anneau de moins de 1,8 mm, le pavé tient de plus petites pierres : plus fin, mais moins robuste.',
    widen18: 'Élargir à 1,8 mm',
    twoTone: (head) => `${head} sur un anneau d’or : le bicolore des bagues des années 1950, qui donne à la pierre son blanc le plus pur.`,
    splitSmall: 'L’anneau fendu encadre une plus grande pierre; sous 0,75 ct, un anneau classique garde les proportions.',
    useClassicBand: 'Anneau classique',
    complete: 'Chaque choix est fait. L’atelier peut partir de cette création.',
    bezelTips: 'Le serti clos tient la pierre dans un rebord de métal : il n’y a pas de griffes à choisir.',
  },
)

const fmtCt = (n: number, locale: Locale) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, locale)

/** The notes for a design, in the visitor's language. `done` lists the steps the visitor has confirmed. */
export function adviseOn(d: RingDesign, ctx: { currency: Currency; budget?: number | null; done?: StepId[] }, locale: Locale = getLocale()): Note[] {
  const t = pick(COPY, locale)
  const r = pick(RING_COPY, locale)
  const { stone, setting, prongs, band, metal, details } = d
  const cut = CUTS[stone.shape]
  const bezel = setting.style === 'bezel'
  const notes: Note[] = []
  const add = (n: Note) => notes.push(n)

  // Stone
  if (stone.type === 'diamond' && cut.step && (stone.clarity === 'SI1' || stone.clarity === 'SI2')) add({ id: 'step-clarity', step: 'stone', tone: 'care', text: t.stepClarity, fix: { label: t.useVS2, patch: { stone: { clarity: 'VS2' } } } })
  // Prices step up at the half and whole carats: at one, the weight just under it looks the same for less.
  const steps = MAGIC_CARATS.filter((m) => Number.isInteger(m * 2))
  const magic = steps.find((m) => stone.carat >= m && stone.carat < m + 0.05)
  if (magic) {
    const lower = Math.round((magic - 0.05) * 100) / 100
    const save = ringPrice(d, ctx.currency) - ringPrice(patch(d, { stone: { carat: lower } }), ctx.currency)
    if (save > 0) add({ id: 'magic', step: 'stone', tone: 'value', text: t.magic(fmtCt(lower, locale), formatPrice(save, ctx.currency, locale)), fix: { label: t.useLower(fmtCt(lower, locale)), patch: { stone: { carat: lower } } } })
  } else if (steps.some((m) => stone.carat >= m - 0.1 && stone.carat < m)) add({ id: 'under-magic', step: 'stone', tone: 'good', text: t.underMagic })
  if (stone.type === 'diamond' && (stone.colour === 'I' || stone.colour === 'J')) {
    if (metal.band === '18k-yellow' || metal.band === '18k-rose') add({ id: 'warm-good', step: 'stone', tone: 'good', text: t.warmGood })
    else add({ id: 'warm-white', step: 'stone', tone: 'tip', text: t.warmWhite, fix: { label: t.useH, patch: { stone: { colour: 'H' } } } })
  }
  if (stone.shape === 'oval' || stone.shape === 'pear' || stone.shape === 'marquise') add({ id: 'faces-up', step: 'stone', tone: 'good', text: t.facesUp(fmtCt(facesUpLike(stone.type, stone.shape, stone.carat), locale)) })
  if (stone.type === 'emerald' && !bezel && prongs.tip !== 'tab') add({ id: 'emerald-soft', step: 'prongs', tone: 'care', text: t.emeraldSoft, fix: { label: t.useTabs, patch: { prongs: { tip: 'tab' } } } })

  // Setting
  if (setting.style === 'halo') add({ id: 'halo', step: 'setting', tone: 'good', text: t.halo })
  if (setting.cathedral && setting.height === 'low') add({ id: 'cathedral-low', step: 'setting', tone: 'tip', text: t.cathedralLow, fix: { label: t.useClassic, patch: { setting: { height: 'classic' } } } })
  if (setting.height === 'high' && (band.stones !== 'none' || setting.style === 'halo')) add({ id: 'snag', step: 'setting', tone: 'care', text: t.snag, fix: { label: t.useClassic, patch: { setting: { height: 'classic' } } } })

  // Claws
  if (bezel) add({ id: 'bezel', step: 'prongs', tone: 'good', text: t.bezelTips })
  else {
    if (cut.points && !prongs.vTips) add({ id: 'points', step: 'prongs', tone: 'care', text: t.points(r.shapes[stone.shape].name, cut.points), fix: { label: t.addV, patch: { prongs: { vTips: true } } } })
    if (cut.step && prongs.tip !== 'tab' && stone.type !== 'emerald') add({ id: 'tabs', step: 'prongs', tone: 'tip', text: t.tabs, fix: { label: t.useTabs, patch: { prongs: { tip: 'tab' } } } })
    if (stone.shape === 'round' && stone.carat >= 1.25 && prongs.count === 4 && !prongs.double) add({ id: 'six', step: 'prongs', tone: 'tip', text: t.six, fix: { label: t.useSix, patch: { prongs: { count: 6 } } } })
  }

  // Band
  if (stone.carat >= 2 && band.width < 1.8) add({ id: 'width', step: 'band', tone: 'care', text: t.width, fix: { label: t.widen, patch: { band: { width: 2 } } } })
  if (band.stones !== 'none' && band.width < 1.8) add({ id: 'thin-pave', step: 'band', tone: 'care', text: t.thinPave, fix: { label: t.widen18, patch: { band: { width: 1.8 } } } })
  if (band.stones !== 'none' && band.coverage === 'full') add({ id: 'eternity', step: 'band', tone: 'care', text: t.eternity })
  if (band.form === 'split' && stone.carat < 0.75) add({ id: 'split-small', step: 'band', tone: 'tip', text: t.splitSmall, fix: { label: t.useClassicBand, patch: { band: { form: 'classic' } } } })

  // Metal
  const head = headMetal(d)
  if ((metal.band === '18k-yellow' || metal.band === '18k-rose') && stone.type === 'diamond' && ['D', 'E', 'F', 'G'].includes(stone.colour) && head === metal.band && !bezel) add({ id: 'white-claws', step: 'metal', tone: 'tip', text: t.whiteClaws, fix: { label: t.useWhite, patch: { metal: { head: 'platinum' } } } })
  if (head !== metal.band && (metal.band === '18k-yellow' || metal.band === '18k-rose')) add({ id: 'two-tone', step: 'metal', tone: 'good', text: t.twoTone((bezel ? r.bezelHeads : r.heads)[metal.head]) })

  // Details and size
  if (details.milgrain && band.form === 'knife') add({ id: 'milgrain-knife', step: 'details', tone: 'tip', text: t.milgrainKnife, fix: { label: t.noMilgrain, patch: { details: { milgrain: false } } } })
  if (details.engraving.trim()) add({ id: 'engraving', step: 'details', tone: 'good', text: t.engraving })
  if (!d.size) add({ id: 'size', step: 'size', tone: 'tip', text: t.sizeMissing })

  // Budget and completion
  if (ctx.budget) {
    const over = ringPrice(d, ctx.currency) - ctx.budget
    if (over > 0) add({ id: 'budget', step: 'stone', tone: 'care', text: t.budgetOver(formatPrice(over, ctx.currency, locale)) })
  }
  const done = ctx.done ?? []
  if (STEPS.slice(0, 7).every((s) => done.includes(s)) && d.size) add({ id: 'complete', step: 'review', tone: 'good', text: t.complete })
  return notes
}

export type Strategy = 'balanced' | 'larger' | 'finer'

/** The largest stone each way of spending a budget allows, keeping the rest of the design: balanced grades, a larger
 *  stone with modest grades, or finer grades. Coloured stones trade size against quality instead. */
export function stonesWithin(d: RingDesign, budget: number, currency: Currency): { strategy: Strategy; patch: DesignPatch; price: number; carat: number }[] {
  const weights: number[] = []
  for (let c = CARAT.max; c >= CARAT.min - 1e-9; c -= 0.05) weights.push(Math.round(c * 100) / 100)
  // Just under each whole weight too: the value sizes.
  for (const m of MAGIC_CARATS) if (m - 0.04 >= CARAT.min) weights.push(Math.round((m - 0.04) * 100) / 100)
  weights.sort((a, b) => b - a)
  const plans: [Strategy, [Colour, Clarity][] | GemGrade[]][] = d.stone.type === 'diamond'
    ? [
        ['balanced', [['F', 'VS1'], ['G', 'VS1'], ['G', 'VS2'], ['H', 'VS2']]],
        ['larger', [['H', 'VS2'], ['H', 'SI1'], ['I', 'SI1']]],
        ['finer', [['D', 'VVS1'], ['E', 'VVS1'], ['E', 'VVS2'], ['F', 'VVS2']]],
      ]
    : [['balanced', ['extra']], ['larger', ['fine']], ['finer', ['exceptional']]]
  const out: { strategy: Strategy; patch: DesignPatch; price: number; carat: number }[] = []
  for (const [strategy, grades] of plans) {
    let best: { strategy: Strategy; patch: DesignPatch; price: number; carat: number } | null = null
    for (const carat of weights) {
      for (const g of grades as (GemGrade | [Colour, Clarity])[]) {
        const p: DesignPatch = { stone: typeof g === 'string' ? { carat, grade: g } : { carat, colour: g[0], clarity: g[1] } }
        const price = ringPrice(patch(d, p), currency)
        if (price <= budget) {
          best = { strategy, patch: p, price, carat }
          break
        }
      }
      if (best) break
    }
    if (best && !out.some((o) => JSON.stringify(o.patch) === JSON.stringify(best!.patch))) out.push(best)
  }
  return out
}

