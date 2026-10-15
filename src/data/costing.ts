// Itemised cost model for a piece. Figures are indicative and reconcile exactly to the retail price:
// materials and making charges are estimated from specs, and the remainder is shown openly as margin.

import { CAD_TO_USD, getCategory, personalizationPrice, priceFor, type Currency, type Metal, type Personalization, type Product } from './catalog'

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
const METAL_RATE: Record<Metal, { rate: number; purity: string; name: string }> = {
  '18k-yellow': { rate: 82.4, purity: '18k · 75.0% gold', name: '18k yellow gold' },
  '18k-white': { rate: 84.1, purity: '18k · 75.0% gold, rhodium finish', name: '18k white gold' },
  '18k-rose': { rate: 81.9, purity: '18k · 75.0% gold', name: '18k rose gold' },
  platinum: { rate: 48.6, purity: 'Pt950 · 95.0% platinum', name: 'Platinum 950' },
  vermeil: { rate: 1.6, purity: '925 silver, 2.5µ 18k gold', name: 'Gold vermeil' },
}

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

function stonesFor(p: Product): StoneSpec[] {
  const out: StoneSpec[] = []
  if (p.gia) {
    out.push({
      label: `Centre diamond · ${p.gia.shape}`,
      detail: `${p.gia.carat.toFixed(2)} ct · ${p.gia.color} / ${p.gia.clarity} · GIA ${p.gia.reportNumber}`,
      weight: p.gia.carat * 6,
    })
  }
  for (const [k, v] of Object.entries(p.specs)) {
    const key = k.toLowerCase()
    if (key === 'pearl') out.push({ label: 'Pearls', detail: v, weight: 3 })
    if (!/ct/.test(v)) continue
    const ct = parseNum(v)
    if (key.includes('emerald')) out.push({ label: 'Colombian emerald', detail: v, weight: ct * 3.5 })
    else if (key.includes('sapphire')) out.push({ label: 'Ceylon sapphires', detail: v, weight: ct * 2.2 })
    else if (key.includes('total carat')) out.push({ label: 'Diamonds', detail: `${v}${p.specs.Color ? ` · ${p.specs.Color}` : ''}${p.specs.Clarity ? ` / ${p.specs.Clarity}` : ''}`, weight: ct * 2.5 })
    else if (/diamond|halo|side|bezel/.test(key)) out.push({ label: key.includes('halo') ? 'Hidden halo diamonds' : key.includes('side') ? 'Side stones' : key.includes('bezel') ? 'Bezel diamonds' : 'Accent diamonds', detail: v, weight: ct * 1.8 })
  }
  return out
}

export interface CostBreakdown {
  lines: CostLine[]
  price: number // pre-tax total including options
  metalWeight: number
  labourHours: number
}

export function buildCostBreakdown(p: Product, currency: Currency, metal?: Metal, personalization?: Personalization): CostBreakdown {
  const fx = currency === 'CAD' ? 1 : CAD_TO_USD
  const m = metal ?? p.metals[0]
  const base = priceFor(p, currency, m)
  const accent = personalizationPrice(p, personalization, currency)
  const lines: CostLine[] = []
  const cat = p.category
  const r = (n: number) => Math.round(n)

  // Materials: metal
  const weight = p.specs.Weight ? parseNum(p.specs.Weight) : DEFAULT_WEIGHT[cat] ?? 5
  const mr = METAL_RATE[m]
  const metalCost = r(weight * mr.rate * fx + (m === 'vermeil' ? 30 * fx : 0))
  lines.push({
    id: 'metal',
    group: 'materials',
    label: cat === 'watches' ? `Case & bracelet · ${mr.name}` : mr.name,
    detail: `${weight.toFixed(1)} g × ${(mr.rate * fx).toFixed(2)}/g · ${mr.purity}${m === 'vermeil' ? ' + plating' : ''}`,
    amount: metalCost,
  })

  // Materials: stones or movement
  const stones = stonesFor(p)
  const stonePool = base * (STONE_SHARE[cat] ?? 0.4)
  if (cat === 'watches') {
    lines.push({ id: 'movement', group: 'materials', label: 'Swiss movement', detail: p.specs.Movement ?? 'Swiss made', amount: r(stonePool * 0.75) })
    if (stones.length) lines.push({ id: 'st0', group: 'materials', label: stones[0].label, detail: stones[0].detail, amount: r(stonePool * 0.25) })
  } else if (stones.length) {
    const total = stones.reduce((s, x) => s + x.weight, 0) || 1
    stones.forEach((s, i) => lines.push({ id: `st${i}`, group: 'materials', label: s.label, detail: s.detail, amount: r((stonePool * s.weight) / total) }))
  }

  // Findings
  const findings = /necklace|pendant|chain|collar|rivi/i.test(p.name) ? ['Chain & clasp', 'Solid gold spring ring'] : /earring|stud|drop|huggie/i.test(p.name) ? ['Posts & backs', 'Secure screw or hinged backs'] : /bracelet/i.test(p.name) ? ['Clasp & safety', 'Double box clasp'] : cat === 'watches' ? ['Strap & buckle', p.specs.Strap ?? 'Leather strap'] : null
  if (findings) lines.push({ id: 'findings', group: 'materials', label: findings[0], detail: findings[1], amount: r((cat === 'watches' ? 220 : 45) * fx) })

  // Making charges
  const hasStones = stones.length > 0
  // Plain metal pieces are labour-led: more forming, filing and polishing relative to price.
  const making = base * (MAKING_SHARE[cat] ?? 0.16) * (hasStones || cat === 'watches' ? 1 : 2.2)
  const labour = making * (hasStones ? 0.55 : 0.8)
  const hours = Math.max(2, Math.round(labour / (LABOUR_RATE_CAD * fx)))
  lines.push({ id: 'labour', group: 'making', label: cat === 'watches' ? 'Regulation & assembly' : 'Bench work · casting & fabrication', detail: `${hours} h × ${r(LABOUR_RATE_CAD * fx)}/h · Montréal atelier`, amount: r(labour) })
  if (hasStones) lines.push({ id: 'setting', group: 'making', label: 'Stone setting', detail: 'Hand-set under microscope', amount: r(making * 0.3) })
  lines.push({ id: 'finish', group: 'making', label: 'Polishing & hallmarking', detail: '12-stage finish, maker’s mark', amount: r(making * (hasStones ? 0.15 : 0.2)) })

  // Services
  if (p.gia) lines.push({ id: 'gia', group: 'services', label: 'GIA grading report', detail: `№ ${p.gia.reportNumber}`, amount: r(165 * fx) })
  lines.push({ id: 'insure', group: 'services', label: 'Insured shipping & presentation box', detail: currency === 'CAD' ? 'Signature courier, Canada' : 'Signature courier, duties prepaid', amount: r(48 * fx) })
  if (p.engravable) lines.push({ id: 'engrave', group: 'services', label: 'Engraving', detail: 'Hand or laser, up to 18 characters', amount: 0, included: true })
  lines.push({ id: 'care', group: 'services', label: 'Lifetime care plan', detail: 'Annual cleaning, claw checks, polish', amount: 0, included: true })

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
  lines.push({ id: 'margin', group: 'margin', label: 'Design, showroom & maison margin', detail: 'Design, salon, staff, warranty reserve', amount: margin })

  // Options
  if (accent) lines.push({ id: 'accent', group: 'options', label: p.personalization?.accent?.label ?? 'Option', detail: 'Selected option', amount: accent })

  return { lines, price: base + accent, metalWeight: weight, labourHours: hours }
}

/** Splits a combined label like "GST 5% + QST 9.975%" into separate tax lines. */
export function splitTaxes(label: string, amount: number): { name: string; rate: number; amount: number }[] {
  const parts = [...label.matchAll(/([A-Z]+)\s*([\d.]+)%/g)].map((x) => ({ name: x[1], rate: Number(x[2]) / 100 }))
  return parts.map((t) => ({ ...t, amount: Math.round(amount * t.rate) }))
}

export const categoryName = (p: Product) => getCategory(p.category)?.name ?? ''
