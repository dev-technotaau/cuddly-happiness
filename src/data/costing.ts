// Itemised cost model for a piece. Figures are indicative and reconcile exactly to the retail price:
// materials and making charges are estimated from specs, and the remainder is shown openly as margin.

import { CAD_TO_USD, getCategory, personalizationPrice, priceFor, type Currency, type Metal, type Personalization, type Product } from './catalog'
import { bilingual, formatNumber, getLocale, pick, type Locale } from '../i18n'
import { catalogFor } from '../i18n/catalog'

export type CostGroup = 'materials' | 'making' | 'services' | 'options' | 'margin'

export interface CostLine {
  id: string
  group: CostGroup
  label: string
  detail?: string
  amount: number
  included?: boolean // shown as complimentary, amount 0
}

/** Indicative metal rates per gram, CAD. */
const METAL_RATE: Record<Metal, number> = { '18k-yellow': 82.4, '18k-white': 84.1, '18k-rose': 81.9, platinum: 48.6, vermeil: 1.6 }

// The statement's wording. Numbers inside it are formatted for the locale where the lines are built.
const COPY = bilingual(
  {
    metals: {
      '18k-yellow': ['18k yellow gold', '18k · 75.0% gold'],
      '18k-white': ['18k white gold', '18k · 75.0% gold, rhodium finish'],
      '18k-rose': ['18k rose gold', '18k · 75.0% gold'],
      platinum: ['Platinum 950', 'Pt950 · 95.0% platinum'],
      vermeil: ['Gold vermeil', '925 silver, 2.5µ 18k gold'],
    } as Record<Metal, [string, string]>,
    centre: (shape: string) => `Centre diamond · ${shape}`,
    pearls: 'Pearls',
    emerald: 'Colombian emerald',
    sapphires: 'Ceylon sapphires',
    diamonds: 'Diamonds',
    halo: 'Hidden halo diamonds',
    side: 'Side stones',
    bezel: 'Bezel diamonds',
    accents: 'Accent diamonds',
    caseOf: (metal: string) => `Case & bracelet · ${metal}`,
    plating: ' + plating',
    perGram: '/g',
    movement: 'Swiss movement',
    swissMade: 'Swiss made',
    chain: ['Chain & clasp', 'Solid gold spring ring'] as [string, string],
    posts: ['Posts & backs', 'Secure screw or hinged backs'] as [string, string],
    clasp: ['Clasp & safety', 'Double box clasp'] as [string, string],
    strap: ['Strap & buckle', 'Leather strap'] as [string, string],
    regulation: 'Regulation & assembly',
    bench: 'Bench work · casting & fabrication',
    hours: (h: number, rate: number) => `${h} h × ${rate}/h · Montréal atelier`,
    setting: ['Stone setting', 'Hand-set under microscope'] as [string, string],
    finish: ['Polishing & hallmarking', '12-stage finish, maker’s mark'] as [string, string],
    gia: 'GIA grading report',
    report: (n: string) => `№ ${n}`,
    shipping: 'Insured shipping & presentation box',
    courier: { CAD: 'Signature courier, Canada', USD: 'Signature courier, duties prepaid' } as Record<Currency, string>,
    engraving: ['Engraving', 'Hand or laser, up to 18 characters'] as [string, string],
    care: ['Lifetime care plan', 'Annual cleaning, claw checks, polish'] as [string, string],
    margin: ['Design, showroom & maison margin', 'Design, salon, staff, warranty reserve'] as [string, string],
    option: 'Option',
    selected: 'Selected option',
  },
  {
    metals: {
      '18k-yellow': ['Or jaune 18 carats', '18 carats · 75,0 % d’or'],
      '18k-white': ['Or blanc 18 carats', '18 carats · 75,0 % d’or, fini rhodié'],
      '18k-rose': ['Or rose 18 carats', '18 carats · 75,0 % d’or'],
      platinum: ['Platine 950', 'Pt950 · 95,0 % de platine'],
      vermeil: ['Vermeil', 'Argent 925, 2,5 µ d’or 18 carats'],
    },
    centre: (shape) => `Diamant central · ${shape}`,
    pearls: 'Perles',
    emerald: 'Émeraude colombienne',
    sapphires: 'Saphirs de Ceylan',
    diamonds: 'Diamants',
    halo: 'Diamants du halo caché',
    side: 'Pierres latérales',
    bezel: 'Diamants de la lunette',
    accents: 'Diamants d’accent',
    caseOf: (metal) => `Boîtier et bracelet · ${metal}`,
    plating: ' + placage',
    perGram: '/g',
    movement: 'Mouvement suisse',
    swissMade: 'Fabrication suisse',
    chain: ['Chaîne et fermoir', 'Anneau à ressort en or massif'],
    posts: ['Tiges et fermoirs', 'Fermoirs à vis ou articulés sécuritaires'],
    clasp: ['Fermoir et sécurité', 'Fermoir à boîte double'],
    strap: ['Bracelet et boucle', 'Bracelet en cuir'],
    regulation: 'Réglage et assemblage',
    bench: 'Travail à l’établi · fonte et fabrication',
    hours: (h, rate) => `${h} h × ${rate}/h · atelier de Montréal`,
    setting: ['Sertissage', 'Serti à la main sous le microscope'],
    finish: ['Polissage et poinçonnage', 'Finition en 12 étapes, poinçon de maître'],
    gia: 'Rapport de classement GIA',
    report: (n) => `n° ${n}`,
    shipping: 'Livraison assurée et écrin de présentation',
    courier: { CAD: 'Messager avec signature, Canada', USD: 'Messager avec signature, droits prépayés' },
    engraving: ['Gravure', 'À la main ou au laser, jusqu’à 18 caractères'],
    care: ['Plan d’entretien à vie', 'Nettoyage annuel, vérification des griffes, polissage'],
    margin: ['Création, salon et marge de la maison', 'Création, salon, personnel, réserve de garantie'],
    option: 'Option',
    selected: 'Option choisie',
  },
)

const DEFAULT_WEIGHT: Record<string, number> = {
  necklaces: 6.2, earrings: 3.4, bracelets: 11.5, rings: 5.2, bridal: 4.6, watches: 32, gifts: 3.1, custom: 4.8, rentals: 28,
}

const STONE_SHARE: Record<string, number> = {
  bridal: 0.56, necklaces: 0.5, earrings: 0.46, bracelets: 0.48, rings: 0.44, gifts: 0.22, custom: 0.3, watches: 0.34, rentals: 0.5,
}

const MAKING_SHARE: Record<string, number> = { bridal: 0.13, custom: 0.2, watches: 0.08 }
const LABOUR_RATE_CAD = 95 // per bench hour

/** Products priced as a service or deposit, where a material breakdown would mislead. */
export const hasCostBreakdown = (p: Product) => p.metals.length > 0 && !/commission|redesign/i.test(p.name)

const parseNum = (s: string) => Number((s.match(/[\d.]+/) ?? ['0'])[0])

interface StoneSpec {
  label: string
  detail: string
  weight: number // relative value weight
}

// Stones are read from the English specs; what the statement shows is the visitor's language.
function stonesFor(p: Product, locale: Locale): StoneSpec[] {
  const t = pick(COPY, locale)
  const catalog = catalogFor(locale)
  const out: StoneSpec[] = []
  if (p.gia) {
    out.push({
      label: t.centre(catalog.gia(p.gia.shape)),
      detail: `${catalog.carat(p.gia)} ct · ${p.gia.color} / ${p.gia.clarity} · GIA ${p.gia.reportNumber}`,
      weight: p.gia.carat * 6,
    })
  }
  for (const [k, v] of Object.entries(p.specs)) {
    const key = k.toLowerCase()
    const shown = catalog.spec(p, k) ?? v
    if (key === 'pearl') out.push({ label: t.pearls, detail: shown, weight: 3 })
    if (!/ct/.test(v)) continue
    const ct = parseNum(v)
    if (key.includes('emerald')) out.push({ label: t.emerald, detail: shown, weight: ct * 3.5 })
    else if (key.includes('sapphire')) out.push({ label: t.sapphires, detail: shown, weight: ct * 2.2 })
    else if (key.includes('total carat')) out.push({ label: t.diamonds, detail: `${shown}${p.specs.Color ? ` · ${p.specs.Color}` : ''}${p.specs.Clarity ? ` / ${p.specs.Clarity}` : ''}`, weight: ct * 2.5 })
    else if (/diamond|halo|side|bezel/.test(key)) out.push({ label: key.includes('halo') ? t.halo : key.includes('side') ? t.side : key.includes('bezel') ? t.bezel : t.accents, detail: shown, weight: ct * 1.8 })
  }
  return out
}

export interface CostBreakdown {
  lines: CostLine[]
  price: number // pre-tax total including options
  metalWeight: number
  labourHours: number
}

/** The itemised statement for a piece, worded in `locale` (the one on screen by default). */
export function buildCostBreakdown(p: Product, currency: Currency, metal?: Metal, personalization?: Personalization, locale: Locale = getLocale()): CostBreakdown {
  const t = pick(COPY, locale)
  const catalog = catalogFor(locale)
  const num = (n: number, digits: number) => formatNumber(n, { minimumFractionDigits: digits, maximumFractionDigits: digits }, locale)
  const fx = currency === 'CAD' ? 1 : CAD_TO_USD
  const m = metal ?? p.metals[0]
  const base = priceFor(p, currency, m)
  const accent = personalizationPrice(p, personalization, currency)
  const lines: CostLine[] = []
  const cat = p.category
  const r = (n: number) => Math.round(n)

  // Materials: metal
  const weight = p.specs.Weight ? parseNum(p.specs.Weight) : DEFAULT_WEIGHT[cat] ?? 5
  const rate = METAL_RATE[m]
  const [metalName, purity] = t.metals[m]
  const metalCost = r(weight * rate * fx + (m === 'vermeil' ? 30 * fx : 0))
  lines.push({
    id: 'metal',
    group: 'materials',
    label: cat === 'watches' ? t.caseOf(metalName) : metalName,
    detail: `${num(weight, 1)} g × ${num(rate * fx, 2)}${t.perGram} · ${purity}${m === 'vermeil' ? t.plating : ''}`,
    amount: metalCost,
  })

  // Materials: stones or movement
  const stones = stonesFor(p, locale)
  const stonePool = base * (STONE_SHARE[cat] ?? 0.4)
  if (cat === 'watches') {
    lines.push({ id: 'movement', group: 'materials', label: t.movement, detail: catalog.spec(p, 'Movement') ?? t.swissMade, amount: r(stonePool * 0.75) })
    if (stones.length) lines.push({ id: 'st0', group: 'materials', label: stones[0].label, detail: stones[0].detail, amount: r(stonePool * 0.25) })
  } else if (stones.length) {
    const total = stones.reduce((s, x) => s + x.weight, 0) || 1
    stones.forEach((s, i) => lines.push({ id: `st${i}`, group: 'materials', label: s.label, detail: s.detail, amount: r((stonePool * s.weight) / total) }))
  }

  // Findings
  const findings = /necklace|pendant|chain|collar|rivi/i.test(p.name) ? t.chain : /earring|stud|drop|huggie/i.test(p.name) ? t.posts : /bracelet/i.test(p.name) ? t.clasp : cat === 'watches' ? [t.strap[0], catalog.spec(p, 'Strap') ?? t.strap[1]] : null
  if (findings) lines.push({ id: 'findings', group: 'materials', label: findings[0], detail: findings[1], amount: r((cat === 'watches' ? 220 : 45) * fx) })

  // Making charges
  const hasStones = stones.length > 0
  // Plain metal pieces are labour-led: more forming, filing and polishing relative to price.
  const making = base * (MAKING_SHARE[cat] ?? 0.16) * (hasStones || cat === 'watches' ? 1 : 2.2)
  const labour = making * (hasStones ? 0.55 : 0.8)
  const hours = Math.max(2, Math.round(labour / (LABOUR_RATE_CAD * fx)))
  lines.push({ id: 'labour', group: 'making', label: cat === 'watches' ? t.regulation : t.bench, detail: t.hours(hours, r(LABOUR_RATE_CAD * fx)), amount: r(labour) })
  if (hasStones) lines.push({ id: 'setting', group: 'making', label: t.setting[0], detail: t.setting[1], amount: r(making * 0.3) })
  lines.push({ id: 'finish', group: 'making', label: t.finish[0], detail: t.finish[1], amount: r(making * (hasStones ? 0.15 : 0.2)) })

  // Services
  if (p.gia) lines.push({ id: 'gia', group: 'services', label: t.gia, detail: t.report(p.gia.reportNumber), amount: r(165 * fx) })
  lines.push({ id: 'insure', group: 'services', label: t.shipping, detail: t.courier[currency], amount: r(48 * fx) })
  if (p.engravable) lines.push({ id: 'engrave', group: 'services', label: t.engraving[0], detail: t.engraving[1], amount: 0, included: true })
  lines.push({ id: 'care', group: 'services', label: t.care[0], detail: t.care[1], amount: 0, included: true })

  // Margin = whatever remains, shown openly. Keep it ≥ 12% by easing stone estimates if needed.
  const sum = () => lines.reduce((s, l) => s + l.amount, 0)
  const floor = base * 0.12
  let margin = base - sum()
  if (margin < floor) {
    const stoneLines = lines.filter((l) => l.id.startsWith('st') || l.id === 'movement')
    const stoneTotal = stoneLines.reduce((s, l) => s + l.amount, 0)
    if (stoneTotal > 0) {
      const k = Math.max(0, (stoneTotal - (floor - margin)) / stoneTotal)
      stoneLines.forEach((l) => (l.amount = r(l.amount * k)))
    }
    margin = base - sum()
  }
  lines.push({ id: 'margin', group: 'margin', label: t.margin[0], detail: t.margin[1], amount: margin })

  // Options
  if (accent) lines.push({ id: 'accent', group: 'options', label: catalog.personalization(p).accent || t.option, detail: t.selected, amount: accent })

  return { lines, price: base + accent, metalWeight: weight, labourHours: hours }
}

/** Splits a combined label like "GST 5% + QST 9.975%" into separate tax lines. */
export function splitTaxes(label: string, amount: number): { name: string; rate: number; amount: number }[] {
  const parts = [...label.matchAll(/([A-Z]+)\s*([\d.]+)%/g)].map((x) => ({ name: x[1], rate: Number(x[2]) / 100 }))
  return parts.map((t) => ({ ...t, amount: Math.round(amount * t.rate) }))
}

/** A piece's chapter name, in the visitor's language. */
export const categoryName = (p: Product) => (getCategory(p.category) ? catalogFor().category(p.category).name : '')
