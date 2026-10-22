// What a designed ring costs, line by line, and its price: the same statement as a piece's page (materials, making,
// services, the maison's margin), built up from the design instead of reconciled down from a price. The rates are
// indicative and agree with the catalog's: a design like the Bonsecours prices within a few percent of it.
import { CAD_TO_USD, toUSD, type Currency } from './catalog'
import { LABOUR_RATE_CAD, METAL_RATE, type CostLine } from './costing'
import { bilingual, formatNumber, getLocale, pick, type Locale } from '../i18n'
import { catalogFor } from '../i18n/catalog'
import { DENSITY, headMetal, layoutOf, type BandMetal, type Clarity, type Colour, type GemGrade, type Layout, type RingDesign, type Shape, type StoneType } from './ring'
import { RING_COPY } from './ringCopy'

// Our cost per carat for a round G VS2, by weight: the steps at the whole and half carats are where value hides.
const PER_CARAT: [number, number][] = [[0, 1700], [0.3, 1900], [0.5, 2600], [0.7, 3200], [0.9, 3700], [1, 4500], [1.5, 5400], [2, 6800], [2.5, 7600], [3, 9800], [4, 12000]]
const COLOUR_K: Record<Colour, number> = { D: 1.38, E: 1.26, F: 1.15, G: 1, H: 0.9, I: 0.8, J: 0.7 }
const CLARITY_K: Record<Clarity, number> = { IF: 1.38, VVS1: 1.26, VVS2: 1.17, VS1: 1.08, VS2: 1, SI1: 0.88, SI2: 0.76 }
const SHAPE_K: Record<Shape, number> = { round: 1, oval: 0.9, cushion: 0.88, emerald: 0.88, radiant: 0.9, princess: 0.85, asscher: 0.86, pear: 0.88, marquise: 0.86, heart: 0.88 }
// Coloured stones per carat by quality, a little dearer as they grow.
const GEM_PER_CARAT: Record<Exclude<StoneType, 'diamond'>, Record<GemGrade, number>> = {
  sapphire: { fine: 1400, extra: 2300, exceptional: 3600 },
  ruby: { fine: 2200, extra: 3600, exceptional: 5800 },
  emerald: { fine: 1700, extra: 2900, exceptional: 4600 },
}
const MELEE_PER_CARAT = 2200
/** A diamond's GIA report: less for a stone under half a carat. */
const giaReport = (carat: number) => (carat >= 0.5 ? 165 : 95)
const BAGUETTE_PER_CARAT = 2300
/** Price over cost: the maison's margin is what remains, shown openly. */
const MARKUP = 1.34

/** Our cost, per carat, of a diamond of this weight and grade. */
export function diamondPerCarat(carat: number, colour: Colour, clarity: Clarity, shape: Shape) {
  const step = [...PER_CARAT].reverse().find(([min]) => carat >= min - 1e-9)?.[1] ?? PER_CARAT[0][1]
  return step * COLOUR_K[colour] * CLARITY_K[clarity] * SHAPE_K[shape]
}

/** What the atelier pays for a design's parts and hours, in CAD. */
export interface RingCosts {
  centre: number
  sides: number
  halo: number
  hidden: number
  pave: number
  peek: number
  surprise: number
  bandMetal: number
  headMetal: number
  bandGrams: number
  headGrams: number
  cad: number
  hours: number
  bench: number
  setting: number
  stonesSet: number
  finish: number
  report: number
  sideReports: number
  shipping: number
}

export function costsOf(d: RingDesign, layout: Layout = layoutOf(d)): RingCosts {
  const { stone } = d
  const centre = stone.type === 'diamond' ? diamondPerCarat(stone.carat, stone.colour, stone.clarity, stone.shape) * stone.carat : GEM_PER_CARAT[stone.type][stone.grade] * (1 + 0.18 * Math.max(0, stone.carat - 1)) * stone.carat
  const sides = layout.sides ? (d.setting.sides === 'baguette' ? BAGUETTE_PER_CARAT : diamondPerCarat(layout.sides.carat, 'G', 'VS2', layout.sides.shape === 'pear' ? 'pear' : 'round')) * layout.carats.sides : 0
  const melee = (m: { carat: number } | null, rate = MELEE_PER_CARAT) => (m ? m.carat * rate : 0)

  // Metal: the band in its metal; the head in its own when the claws differ.
  const head = headMetal(d)
  const headVolume = layout.metal.volume * layout.metal.headShare
  const bandVolume = layout.metal.volume - headVolume
  const bandGrams = (bandVolume * DENSITY[d.metal.band]) / 1000
  const headGrams = (headVolume * DENSITY[head]) / 1000

  // Bench hours grow with every part to make and fit.
  const hours = 4.5 + (d.setting.style === 'halo' ? 1.5 : 0) + (d.setting.style === 'three-stone' ? 1.5 : 0) + (d.setting.style === 'bezel' ? 1 : 0) + (d.band.stones !== 'none' ? 1.5 : 0) + (d.band.form === 'split' || d.band.form === 'twist' ? 1 : 0) + (d.setting.cathedral ? 0.75 : 0) + (d.details.milgrain ? 0.75 : 0) + (head !== d.metal.band ? 0.75 : 0) + (layout.hiddenHalo ? 0.75 : 0)
  const meleeCount = (layout.halo?.count ?? 0) + (layout.hiddenHalo?.count ?? 0) + (layout.pave?.count ?? 0) + (layout.peekaboo?.count ?? 0) + (layout.surprise?.count ?? 0)
  const setting = (d.setting.style === 'bezel' ? 260 : 140 + 22 * layout.prongs.positions.length + 30 * layout.prongs.vTips.length) + (layout.sides ? 240 : 0) + (layout.halo?.count ?? 0) * 22 + (layout.hiddenHalo?.count ?? 0) * 20 + (layout.pave?.count ?? 0) * (layout.pave?.channel ? 26 : 22) + (layout.peekaboo ? 60 : 0) + (layout.surprise ? 45 : 0)
  return {
    centre,
    sides,
    halo: melee(layout.halo),
    hidden: melee(layout.hiddenHalo),
    pave: melee(layout.pave),
    peek: melee(layout.peekaboo, 2400),
    surprise: melee(layout.surprise, 2400),
    bandMetal: bandGrams * METAL_RATE[d.metal.band],
    headMetal: headGrams * METAL_RATE[head],
    bandGrams,
    headGrams,
    cad: 280,
    hours,
    bench: hours * LABOUR_RATE_CAD,
    setting,
    stonesSet: 1 + (layout.sides ? 2 : 0) + meleeCount,
    finish: 120 + (d.metal.finish === 'hammered' ? 90 : d.metal.finish === 'satin' ? 40 : 0),
    // Every diamond the house sets has its GIA report (HOUSE.natural), the side stones' too; a coloured centre stone has
    // a gemmological report instead.
    report: stone.type === 'diamond' ? giaReport(stone.carat) : 240,
    sideReports: layout.sides ? 2 * giaReport(layout.sides.carat) : 0,
    shipping: 48,
  }
}

const COST_KEYS = ['centre', 'sides', 'halo', 'hidden', 'pave', 'peek', 'surprise', 'bandMetal', 'headMetal', 'cad', 'bench', 'setting', 'finish', 'report', 'sideReports', 'shipping'] as const

/** The price in CAD: cost and margin, to the nearest ten dollars. */
const retailCAD = (c: RingCosts) => Math.round((COST_KEYS.reduce((s, k) => s + c[k], 0) * MARKUP) / 10) * 10

/** A design's price in a market, without its statement: for deltas, budgets and the bag. */
export function ringPrice(d: RingDesign, currency: Currency): number {
  const cad = retailCAD(costsOf(d))
  return currency === 'CAD' ? cad : toUSD(cad)
}

/** A designed ring is paid as the atelier works (owner decision, 2026-10-22): this share at checkout reserves the
 *  stones and starts the drawings and the wax; the balance is due once the visitor approves the final design. */
export const DEPOSIT_SHARE = 0.3

/** The deposit on one designed ring, to the nearest ten in the price's own currency. */
export const designDeposit = (price: number) => Math.min(price, Math.round((price * DEPOSIT_SHARE) / 10) * 10)

const COPY = bilingual(
  {
    centre: { diamond: 'Centre diamond', sapphire: 'Centre sapphire', ruby: 'Centre ruby', emerald: 'Centre emerald' } as Record<StoneType, string>,
    stoneDetail: (ct: string, shape: string, grading: string, size: string) => `${ct} ct · ${shape} · ${grading} · ${size} mm`,
    sides: (shape: string) => `Side stones · ${shape.toLowerCase()}`,
    pair: (ct: string) => `2 × ${ct} ct · G / VS2`,
    melee: { halo: 'Halo diamonds', hidden: 'Hidden halo diamonds', pave: 'Pavé diamonds', channel: 'Channel diamonds', peek: 'Accent diamonds', surprise: 'Surprise diamond' },
    meleeDetail: (n: number, ct: string) => `${n} stone${n === 1 ? '' : 's'} · ${ct} ct · G–H / VS`,
    band: (metal: string) => `${metal} · band`,
    head: (metal: string) => `${metal} · head & claws`,
    grams: (g: string, rate: string) => `${g} g × ${rate}/g`,
    cad: ['3D design & wax model', 'Drawn with you, proofed before casting'] as [string, string],
    bench: 'Bench work · casting & fabrication',
    hours: (h: string, rate: number) => `${h} h × ${rate}/h · Montréal atelier`,
    setting: 'Stone setting',
    set: (n: number) => (n === 1 ? 'One stone, hand-set under the microscope' : `${n} stones, hand-set under the microscope`),
    finish: ['Polishing & hallmarking', '12-stage finish, maker’s mark'] as [string, string],
    gia: ['GIA grading report', 'Natural diamond, graded and inscribed'] as [string, string],
    gem: ['Gemmological report', 'Origin and treatment, independent laboratory'] as [string, string],
    sideReports: ['GIA grading reports · side stones', 'Two natural diamonds, graded and inscribed'] as [string, string],
    shipping: 'Insured shipping & presentation box',
    courier: { CAD: 'Signature courier, Canada', USD: 'Signature courier, duties prepaid' } as Record<Currency, string>,
    engraving: (text: string) => ['Engraving', `“${text}”, inside the band`] as [string, string],
    care: ['Lifetime care plan', 'Annual cleaning, claw checks, polish'] as [string, string],
    resize: ['One resize in the first year', 'Complimentary'] as [string, string],
    margin: ['Design, salon & maison margin', 'Design, salon, staff, warranty reserve'] as [string, string],
  },
  {
    centre: { diamond: 'Diamant central', sapphire: 'Saphir central', ruby: 'Rubis central', emerald: 'Émeraude centrale' },
    stoneDetail: (ct, shape, grading, size) => `${ct} ct · ${shape} · ${grading} · ${size} mm`,
    sides: (shape) => `Pierres latérales · ${shape.toLowerCase()}`,
    pair: (ct) => `2 × ${ct} ct · G / VS2`,
    melee: { halo: 'Diamants du halo', hidden: 'Diamants du halo caché', pave: 'Diamants pavés', channel: 'Diamants en rail', peek: 'Diamants d’accent', surprise: 'Diamant secret' },
    meleeDetail: (n, ct) => `${n} pierre${n < 2 ? '' : 's'} · ${ct} ct · G–H / VS`,
    band: (metal) => `${metal} · anneau`,
    head: (metal) => `${metal} · tête et griffes`,
    grams: (g, rate) => `${g} g × ${rate}/g`,
    cad: ['Modélisation 3D et maquette en cire', 'Dessinée avec vous, validée avant la fonte'],
    bench: 'Travail à l’établi · fonte et fabrication',
    hours: (h, rate) => `${h} h × ${rate}/h · atelier de Montréal`,
    setting: 'Sertissage',
    set: (n) => (n < 2 ? 'Une pierre, sertie à la main sous le microscope' : `${n} pierres, serties à la main sous le microscope`),
    finish: ['Polissage et poinçonnage', 'Finition en 12 étapes, poinçon de maître'],
    gia: ['Rapport de classement GIA', 'Diamant naturel, classé et inscrit'],
    gem: ['Rapport gemmologique', 'Origine et traitements, laboratoire indépendant'],
    sideReports: ['Rapports de classement GIA · pierres latérales', 'Deux diamants naturels, classés et inscrits'],
    shipping: 'Livraison assurée et écrin de présentation',
    courier: { CAD: 'Messager avec signature, Canada', USD: 'Messager avec signature, droits prépayés' },
    engraving: (text) => ['Gravure', `« ${text} », à l’intérieur de l’anneau`],
    care: ['Plan d’entretien à vie', 'Nettoyage annuel, vérification des griffes, polissage'],
    resize: ['Un ajustement de taille la première année', 'Offert'],
    margin: ['Création, salon et marge de la maison', 'Création, salon, personnel, réserve de garantie'],
  },
)

export interface RingStatement {
  lines: CostLine[]
  /** Before tax, in the market's currency. */
  price: number
  metalWeight: number
  labourHours: number
  layout: Layout
}

/** The itemised statement for a design, worded in `locale` (the one on screen by default). Lines reconcile exactly
 *  to the price; the margin is the remainder. */
export function priceRing(d: RingDesign, currency: Currency, locale: Locale = getLocale()): RingStatement {
  const t = pick(COPY, locale)
  const r = pick(RING_COPY, locale)
  const catalog = catalogFor(locale)
  const layout = layoutOf(d)
  const c = costsOf(d, layout)
  const fx = currency === 'CAD' ? 1 : CAD_TO_USD
  const num = (n: number, digits: number) => formatNumber(n, { minimumFractionDigits: digits, maximumFractionDigits: digits }, locale)
  const amount = (cad: number) => Math.round(cad * fx)
  const lines: CostLine[] = []

  // Materials: the stones, then the metal.
  const s = layout.centre
  const grading = d.stone.type === 'diamond' ? `${d.stone.colour} / ${d.stone.clarity}` : r.grades[d.stone.grade].name
  lines.push({ id: 'centre', group: 'materials', label: t.centre[d.stone.type], detail: t.stoneDetail(num(d.stone.carat, 2), r.shapes[d.stone.shape].name, grading, `${num(s.length, 1)} × ${num(s.width, 1)}`), amount: amount(c.centre) })
  if (layout.sides) lines.push({ id: 'sides', group: 'materials', label: t.sides(r.sides[d.setting.sides]), detail: t.pair(num(layout.sides.carat, 2)), amount: amount(c.sides) })
  const melee = ([['halo', layout.halo, c.halo], ['hidden', layout.hiddenHalo, c.hidden], [layout.pave?.channel ? 'channel' : 'pave', layout.pave, c.pave], ['peek', layout.peekaboo, c.peek], ['surprise', layout.surprise, c.surprise]] as const)
  for (const [id, m, cost] of melee) if (m) lines.push({ id, group: 'materials', label: t.melee[id], detail: t.meleeDetail(m.count, num(m.carat, 2)), amount: amount(cost) })
  const head = headMetal(d)
  const rate = (m: BandMetal) => num(METAL_RATE[m] * fx, 2)
  if (head === d.metal.band) {
    lines.push({ id: 'metal', group: 'materials', label: catalog.metal(d.metal.band), detail: t.grams(num(c.bandGrams + c.headGrams, 1), rate(d.metal.band)), amount: amount(c.bandMetal + c.headMetal) })
  } else {
    lines.push({ id: 'metal', group: 'materials', label: t.band(catalog.metal(d.metal.band)), detail: t.grams(num(c.bandGrams, 1), rate(d.metal.band)), amount: amount(c.bandMetal) })
    lines.push({ id: 'head', group: 'materials', label: t.head(catalog.metal(head)), detail: t.grams(num(c.headGrams, 1), rate(head)), amount: amount(c.headMetal) })
  }

  // Making: the design, the bench, the setting, the finish.
  lines.push({ id: 'cad', group: 'making', label: t.cad[0], detail: t.cad[1], amount: amount(c.cad) })
  lines.push({ id: 'labour', group: 'making', label: t.bench, detail: t.hours(num(c.hours, c.hours % 1 ? 1 : 0), Math.round(LABOUR_RATE_CAD * fx)), amount: amount(c.bench) })
  lines.push({ id: 'setting', group: 'making', label: t.setting, detail: t.set(c.stonesSet), amount: amount(c.setting) })
  lines.push({ id: 'finish', group: 'making', label: t.finish[0], detail: d.metal.finish === 'polished' ? t.finish[1] : `${t.finish[1]} · ${r.finishes[d.metal.finish].name.toLowerCase()}`, amount: amount(c.finish) })

  // Services, some of them included.
  if (c.report) {
    const [label, detail] = d.stone.type === 'diamond' ? t.gia : t.gem
    lines.push({ id: 'report', group: 'services', label, detail, amount: amount(c.report) })
  }
  if (c.sideReports) lines.push({ id: 'side-reports', group: 'services', label: t.sideReports[0], detail: t.sideReports[1], amount: amount(c.sideReports) })
  lines.push({ id: 'insure', group: 'services', label: t.shipping, detail: t.courier[currency], amount: amount(c.shipping) })
  const text = d.details.engraving.trim()
  if (text) {
    const [label, detail] = t.engraving(text)
    lines.push({ id: 'engrave', group: 'services', label, detail, amount: 0, included: true })
  }
  if (!(d.band.stones !== 'none' && d.band.coverage === 'full')) lines.push({ id: 'resize', group: 'services', label: t.resize[0], detail: t.resize[1], amount: 0, included: true })
  lines.push({ id: 'care', group: 'services', label: t.care[0], detail: t.care[1], amount: 0, included: true })

  // The margin is whatever remains of the price.
  const price = ringPrice(d, currency)
  const sum = lines.reduce((n, l) => n + l.amount, 0)
  lines.push({ id: 'margin', group: 'margin', label: t.margin[0], detail: t.margin[1], amount: price - sum })

  return { lines, price, metalWeight: c.bandGrams + c.headGrams, labourHours: c.hours, layout }
}

