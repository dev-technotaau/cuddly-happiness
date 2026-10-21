// Teresa & Sons — product catalog (Montreal, CA). Prices in whole currency units. The copy here is Canadian English;
// French lives in catalog.fr.ts, and every display goes through src/i18n/catalog.ts.
import { bilingual, formatHour, getLocale, pick, type Locale } from '../i18n'

export type Currency = 'CAD' | 'USD'

export type CategorySlug =
  | 'necklaces'
  | 'earrings'
  | 'bracelets'
  | 'rings'
  | 'bridal'
  | 'watches'
  | 'rentals'
  | 'gifts'
  | 'custom'

export type Metal = '18k-yellow' | '18k-white' | '18k-rose' | 'platinum' | 'vermeil'

export interface MetalVariant {
  id: Metal
  label: string
  swatch: string
  /** Price delta vs. base, in CAD */
  priceDeltaCAD: number
}

export interface GiaSpec {
  reportNumber: string
  shape: string
  carat: number
  color: string
  clarity: string
  cut: string
}

export interface Price {
  CAD: number
  USD: number
}

export interface RentalRates {
  /** Per-period rate, both currencies */
  weekend: Price
  week: Price
  month: Price
  /** Refundable security deposit */
  deposit: Price
}

export interface Product {
  id: string
  slug: string
  name: string
  category: CategorySlug
  collection: string
  tagline: string
  description: string
  price: Price
  metals: Metal[]
  gia?: GiaSpec
  specs: Record<string, string>
  images: string[]
  rental?: RentalRates
  badges?: ('New' | 'Bestseller' | 'Atelier Exclusive' | 'Limited' | 'Made to Order')[]
  engravable?: boolean
  leadTimeWeeks?: number
  personalization?: PersonalizationConfig
}

export type PersonalizationFont = 'script' | 'serif' | 'block'

export interface PersonalizationConfig {
  kind: 'nameplate' | 'initial' | 'monogram'
  label: string
  hint: string
  minLength: number
  maxLength: number
  /** Allowed characters, as a RegExp character class body. */
  allowed: string
  fonts: PersonalizationFont[]
  /** Optional paid add-on, priced in CAD. */
  accent?: { label: string; priceCAD: number }
  chainLengths?: string[]
  /** Keep the separate engraving field for the reverse side. */
  backEngraving?: boolean
}

export interface Personalization {
  text: string
  font: PersonalizationFont
  accent?: boolean
  chainLength?: string
}

export interface Category {
  slug: CategorySlug
  name: string
  french: string
  eyebrow: string
  description: string
  hero: string
  feature: string
}

/** CAD → USD conversion used for display rounding of derived prices. */
export const CAD_TO_USD = 0.73

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMG = {
  jewelryFlat: img('photo-1515562141207-7a88fb7ce338'),
  necklace1: img('photo-1599643478518-a784e5dc4c8f'),
  necklace2: img('photo-1602173574767-37ac01994b2a'),
  ring1: img('photo-1605100804763-247f67b3557e'),
  ring2: img('photo-1603561591411-07134e71a2a9'),
  rings: img('photo-1600721391776-b5cd0e0048f9'),
  bracelet1: img('photo-1611591437281-460bfbe1220a'),
  bracelet2: img('photo-1611652022419-a9419f74343d'),
  earrings1: img('photo-1535632066927-ab7c9ab60908'),
  earrings2: img('photo-1617038220319-276d3cfab638'),
  earrings3: img('photo-1630019852942-f89202989a59'),
  bridal1: img('photo-1596944924616-7b38e7cfac36'),
  bridal2: img('photo-1515934751635-c81c6bc9a2d8'),
  watch1: img('photo-1523170335258-f5ed11844a49'),
  watch2: img('photo-1547996160-81dfa63595aa'),
  watch3: img('photo-1522312346375-d1a52e2b99b3'),
  gift1: img('photo-1549465220-1a8b9238cd48'),
  gift2: img('photo-1513201099705-a9746e1e201f'),
} as const

export const METALS: Record<Metal, MetalVariant> = {
  '18k-yellow': { id: '18k-yellow', label: '18k Yellow Gold', swatch: '#D4B982', priceDeltaCAD: 0 },
  '18k-white': { id: '18k-white', label: '18k White Gold', swatch: '#E4E2DD', priceDeltaCAD: 0 },
  '18k-rose': { id: '18k-rose', label: '18k Rose Gold', swatch: '#D9A68C', priceDeltaCAD: 0 },
  platinum: { id: 'platinum', label: 'Platinum 950', swatch: '#CFCFCB', priceDeltaCAD: 650 },
  vermeil: { id: 'vermeil', label: 'Gold Vermeil', swatch: '#B89047', priceDeltaCAD: -400 },
}

export const CATEGORIES: Category[] = [
  { slug: 'necklaces', name: 'Necklaces', french: 'Colliers', eyebrow: 'I', description: 'Pendants, rivières and chains drawn in 18k gold, worn close to the heart.', hero: IMG.necklace1, feature: IMG.necklace2 },
  { slug: 'earrings', name: 'Earrings', french: "Boucles d'oreilles", eyebrow: 'II', description: 'Studs, drops and huggies that catch the light of the Saint-Laurent.', hero: IMG.earrings1, feature: IMG.earrings3 },
  { slug: 'bracelets', name: 'Bracelets', french: 'Bracelets', eyebrow: 'III', description: 'Tennis lines, cuffs and bangles, built to be stacked and inherited.', hero: IMG.bracelet1, feature: IMG.bracelet2 },
  { slug: 'rings', name: 'Rings', french: 'Bagues', eyebrow: 'IV', description: 'Signets, cocktail rings and everyday bands, hand-finished in our atelier.', hero: IMG.ring1, feature: IMG.rings },
  { slug: 'bridal', name: 'Bridal Jewellery', french: 'Mariage', eyebrow: 'V', description: 'GIA-certified engagement rings and wedding bands for a lifetime of vows.', hero: IMG.bridal1, feature: IMG.bridal2 },
  { slug: 'watches', name: 'Watches', french: 'Montres', eyebrow: 'VI', description: 'A curated selection of Swiss timepieces, serviced by our horologist.', hero: IMG.watch1, feature: IMG.watch2 },
  { slug: 'rentals', name: 'Jewellery Rentals', french: 'Location', eyebrow: 'VII', description: 'High jewelry for galas, weddings and premieres — insured, delivered, returned.', hero: IMG.jewelryFlat, feature: IMG.necklace2 },
  { slug: 'gifts', name: 'Gifts', french: 'Cadeaux', eyebrow: 'VIII', description: 'Thoughtful pieces, wrapped in our signature travertine box.', hero: IMG.gift1, feature: IMG.gift2 },
  { slug: 'custom', name: 'Personalized & Custom', french: 'Sur mesure', eyebrow: 'IX', description: 'From sketch to setting — bespoke commissions and engraved heirlooms.', hero: IMG.ring2, feature: IMG.rings },
]

const p = (CAD: number, USD?: number): Price => ({ CAD, USD: USD ?? Math.round((CAD * CAD_TO_USD) / 5) * 5 })

const rental = (weekend: number, week: number, month: number, deposit: number): RentalRates => ({
  weekend: p(weekend),
  week: p(week),
  month: p(month),
  deposit: p(deposit),
})

const GOLDS: Metal[] = ['18k-yellow', '18k-white', '18k-rose']
const BRIDAL_METALS: Metal[] = ['platinum', '18k-white', '18k-yellow', '18k-rose']

export const PRODUCTS: Product[] = [
  // Necklaces
  { id: 'tns-nk-001', slug: 'mont-royal-solitaire-pendant', name: 'Mont-Royal Solitaire Pendant', category: 'necklaces', collection: 'Mont-Royal', tagline: 'A single round brilliant, suspended.', description: 'A GIA-certified round brilliant floats in a four-claw basket on a fine cable chain, adjustable at 16 and 18 inches.', price: p(6850), metals: GOLDS, gia: { reportNumber: '2231874590', shape: 'Round Brilliant', carat: 0.7, color: 'F', clarity: 'VS1', cut: 'Excellent' }, specs: { Chain: '1.1 mm cable, 16–18 in', Clasp: 'Spring ring' }, images: [IMG.necklace1, IMG.necklace2], badges: ['Bestseller'] },
  { id: 'tns-nk-002', slug: 'riviere-saint-laurent', name: 'Rivière Saint-Laurent', category: 'necklaces', collection: 'Saint-Laurent', tagline: 'A river of graduated diamonds.', description: 'Ninety-two graduated round diamonds set in individual collets, articulated to drape like water.', price: p(38500), metals: ['18k-white', 'platinum'], specs: { 'Total carat weight': '12.40 ct', Color: 'F–G', Clarity: 'VS', Length: '16 in' }, images: [IMG.necklace2, IMG.jewelryFlat], badges: ['Atelier Exclusive'] },
  { id: 'tns-nk-003', slug: 'plateau-paperclip-chain', name: 'Plateau Paperclip Chain', category: 'necklaces', collection: 'Plateau', tagline: 'The everyday link.', description: 'Elongated hand-polished links in solid gold, made to layer.', price: p(2450), metals: [...GOLDS, 'vermeil'], specs: { Link: '4.2 mm', Length: '18 in', Weight: '6.8 g' }, images: [IMG.necklace1], badges: ['New'], engravable: true },

  // Earrings
  { id: 'tns-er-001', slug: 'vieux-port-diamond-studs', name: 'Vieux-Port Diamond Studs', category: 'earrings', collection: 'Vieux-Port', tagline: 'The classic pair, matched by hand.', description: 'A matched pair of GIA-certified round diamonds in four-prong martini settings with secure screw backs.', price: p(8900), metals: [...GOLDS, 'platinum'], gia: { reportNumber: '6452198830', shape: 'Round Brilliant', carat: 1.0, color: 'G', clarity: 'VS2', cut: 'Excellent' }, specs: { 'Total carat weight': '1.00 ct (pair)', Backs: 'Screw' }, images: [IMG.earrings1, IMG.earrings3], badges: ['Bestseller'] },
  { id: 'tns-er-002', slug: 'outremont-pearl-drops', name: 'Outremont Pearl Drops', category: 'earrings', collection: 'Outremont', tagline: 'South Sea light, softly swinging.', description: 'Golden South Sea pearls beneath pavé diamond caps.', price: p(4200), metals: ['18k-yellow', '18k-white'], specs: { Pearl: '11–12 mm South Sea', Diamonds: '0.22 ct' }, images: [IMG.earrings2, IMG.earrings1], badges: ['New'] },
  { id: 'tns-er-003', slug: 'mile-end-huggies', name: 'Mile End Huggies', category: 'earrings', collection: 'Mile End', tagline: 'Pavé, hinged, effortless.', description: 'Petite hinged hoops lined with micro-pavé diamonds.', price: p(1950), metals: [...GOLDS, 'vermeil'], specs: { Diameter: '12 mm', Diamonds: '0.18 ct' }, images: [IMG.earrings3] },

  // Bracelets
  { id: 'tns-br-001', slug: 'westmount-tennis-bracelet', name: 'Westmount Tennis Bracelet', category: 'bracelets', collection: 'Westmount', tagline: 'Fifty diamonds, one unbroken line.', description: 'Four-prong set round diamonds with a double safety box clasp.', price: p(14500), metals: ['18k-white', '18k-yellow', 'platinum'], specs: { 'Total carat weight': '5.00 ct', Color: 'G–H', Clarity: 'VS–SI1', Length: '7 in' }, images: [IMG.bracelet1, IMG.bracelet2], badges: ['Bestseller'] },
  { id: 'tns-br-002', slug: 'atwater-cuff', name: 'Atwater Cuff', category: 'bracelets', collection: 'Atwater', tagline: 'Sculpted, hammered, hand-signed.', description: 'A solid gold cuff, hammer-textured and signed inside by the maker.', price: p(5600), metals: GOLDS, specs: { Width: '8 mm', Weight: '24 g' }, images: [IMG.bracelet2], engravable: true },
  { id: 'tns-br-003', slug: 'griffintown-chain-bracelet', name: 'Griffintown Chain Bracelet', category: 'bracelets', collection: 'Griffintown', tagline: 'Industrial roots, refined.', description: 'Curb links with a single bezel-set diamond station.', price: p(1650), metals: [...GOLDS, 'vermeil'], specs: { Diamond: '0.10 ct', Length: '6.5–7.5 in' }, images: [IMG.bracelet1], badges: ['New'], engravable: true },

  // Rings
  { id: 'tns-rg-001', slug: 'teresa-signet', name: 'The Teresa Signet', category: 'rings', collection: 'Heritage', tagline: 'Our founder’s ring, recast.', description: 'An oval signet modelled on Teresa’s 1962 original — ready for a monogram or crest.', price: p(3200), metals: GOLDS, specs: { Face: '12 × 10 mm', Weight: '9 g' }, images: [IMG.ring2, IMG.rings], badges: ['Bestseller'], engravable: true, personalization: { kind: 'monogram', label: 'Monogram', hint: 'Up to three initials, hand-engraved on the face.', minLength: 1, maxLength: 3, allowed: 'A-Za-z', fonts: ['serif', 'script', 'block'], backEngraving: true } },
  { id: 'tns-rg-002', slug: 'sherbrooke-emerald-cocktail', name: 'Sherbrooke Emerald Cocktail Ring', category: 'rings', collection: 'Sherbrooke', tagline: 'Colombian green, framed in light.', description: 'A 3.1 ct Colombian emerald within a halo of round diamonds.', price: p(21800), metals: ['18k-yellow', 'platinum'], specs: { Emerald: '3.10 ct, Colombia, minor oil', Diamonds: '0.85 ct' }, images: [IMG.ring1], badges: ['Limited'] },
  { id: 'tns-rg-003', slug: 'laurier-stacking-band', name: 'Laurier Stacking Band', category: 'rings', collection: 'Laurier', tagline: 'Thin, bright, endlessly stackable.', description: 'A 1.6 mm band of half-eternity pavé.', price: p(1350), metals: [...GOLDS, 'platinum'], specs: { Width: '1.6 mm', Diamonds: '0.15 ct' }, images: [IMG.rings] },

  // Bridal
  { id: 'tns-bd-001', slug: 'notre-dame-oval-solitaire', name: 'Notre-Dame Oval Solitaire', category: 'bridal', collection: 'Notre-Dame', tagline: 'A cathedral setting for an oval.', description: 'A GIA-certified oval rises from a hidden halo on a knife-edge band.', price: p(18900), metals: BRIDAL_METALS, gia: { reportNumber: '1449286107', shape: 'Oval', carat: 1.82, color: 'E', clarity: 'VS1', cut: 'Excellent (polish & symmetry)' }, specs: { Band: '1.8 mm knife edge', 'Hidden halo': '0.12 ct' }, images: [IMG.bridal1, IMG.ring1], badges: ['Bestseller'], engravable: true },
  { id: 'tns-bd-002', slug: 'basilique-emerald-cut-three-stone', name: 'Basilique Three-Stone', category: 'bridal', collection: 'Basilique', tagline: 'Past, present, future.', description: 'An emerald-cut centre flanked by tapered baguettes.', price: p(26400), metals: BRIDAL_METALS, gia: { reportNumber: '5402177764', shape: 'Emerald', carat: 2.01, color: 'F', clarity: 'VVS2', cut: 'Excellent (polish & symmetry)' }, specs: { 'Side stones': '0.48 ct tapered baguettes' }, images: [IMG.bridal2, IMG.rings], badges: ['Atelier Exclusive'], engravable: true },
  { id: 'tns-bd-003', slug: 'promesse-wedding-band', name: 'Promesse Wedding Band', category: 'bridal', collection: 'Promesse', tagline: 'Comfort fit, forever.', description: 'A classic comfort-fit band available in 2, 4 and 6 mm.', price: p(1450), metals: BRIDAL_METALS, specs: { Widths: '2 / 4 / 6 mm', Profile: 'Comfort fit' }, images: [IMG.bridal2], engravable: true },

  // Watches
  { id: 'tns-wt-001', slug: 'heritage-automatic-38', name: 'Heritage Automatic 38', category: 'watches', collection: 'Swiss Selection', tagline: 'Swiss movement, Montreal-regulated.', description: 'A 38 mm automatic with sunburst dial, regulated in our atelier.', price: p(7400), metals: ['18k-yellow', '18k-white'], specs: { Case: '38 mm', Movement: 'Swiss automatic, 42 h reserve', 'Water resistance': '50 m', Strap: 'Alligator' }, images: [IMG.watch1, IMG.watch3], badges: ['New'], engravable: true },
  { id: 'tns-wt-002', slug: 'chronographe-1962', name: 'Chronographe 1962', category: 'watches', collection: 'Swiss Selection', tagline: 'For the year we opened our doors.', description: 'A limited chronograph of 62 pieces with a panda dial.', price: p(12900), metals: ['18k-rose', '18k-yellow'], specs: { Case: '40 mm', Movement: 'Manual-wind chronograph', Edition: '62 pieces' }, images: [IMG.watch2], badges: ['Limited'] },
  { id: 'tns-wt-003', slug: 'dame-du-lac', name: 'Dame du Lac', category: 'watches', collection: 'Swiss Selection', tagline: 'Mother-of-pearl, diamond bezel.', description: 'A petite quartz watch with a diamond-set bezel.', price: p(9600), metals: ['18k-white', '18k-rose'], specs: { Case: '30 mm', Movement: 'Swiss quartz', Bezel: '0.60 ct diamonds' }, images: [IMG.watch3, IMG.watch1] },

  // Rentals
  { id: 'tns-rn-001', slug: 'gala-diamond-collar', name: 'Gala Diamond Collar', category: 'rentals', collection: 'Rental Vault', tagline: 'Red carpet, by the weekend.', description: 'An 18 ct diamond collar, fully insured, delivered by courier in Montreal, Toronto and New York.', price: p(92000), metals: ['platinum'], specs: { 'Total carat weight': '18.20 ct', Insurance: 'Included', Delivery: 'Bonded courier' }, images: [IMG.necklace2, IMG.jewelryFlat], rental: rental(650, 1400, 3900, 5000), badges: ['Atelier Exclusive'] },
  { id: 'tns-rn-002', slug: 'chandelier-sapphire-earrings', name: 'Chandelier Sapphire Earrings', category: 'rentals', collection: 'Rental Vault', tagline: 'Ceylon blue, borrowed for the night.', description: 'Cascading Ceylon sapphires and diamonds.', price: p(34000), metals: ['18k-white'], specs: { Sapphires: '8.40 ct Ceylon', Diamonds: '3.10 ct' }, images: [IMG.earrings2], rental: rental(320, 720, 1900, 2500) },
  { id: 'tns-rn-003', slug: 'bridal-tiara-and-drops', name: 'Bridal Tiara & Drops Set', category: 'rentals', collection: 'Rental Vault', tagline: 'Something borrowed.', description: 'A diamond tiara with matching drop earrings, fitted at our salon.', price: p(48000), metals: ['platinum'], specs: { Includes: 'Tiara, earrings, fitting', Insurance: 'Included' }, images: [IMG.bridal1], rental: rental(480, 1100, 2800, 3500), badges: ['Bestseller'] },

  // Gifts
  { id: 'tns-gf-001', slug: 'initial-disc-pendant', name: 'Initial Disc Pendant', category: 'gifts', collection: 'Gifts under $1,000', tagline: 'One letter, endlessly personal.', description: 'A hand-engraved disc on a fine chain, presented in our travertine box.', price: p(680), metals: [...GOLDS, 'vermeil'], specs: { Disc: '12 mm', Chain: '16–18 in' }, images: [IMG.gift1, IMG.necklace1], engravable: true, badges: ['Bestseller'], personalization: { kind: 'initial', label: 'Initial', hint: 'One letter, hand-engraved on the front of the disc.', minLength: 1, maxLength: 1, allowed: 'A-Za-z', fonts: ['serif', 'script', 'block'], chainLengths: ['16 in', '18 in', '20 in'], backEngraving: true } },
  { id: 'tns-gf-002', slug: 'pearl-stud-gift-set', name: 'Pearl Stud Gift Set', category: 'gifts', collection: 'Gifts under $1,000', tagline: 'Freshwater pearls, boxed and ribboned.', description: 'Akoya pearl studs with a polishing cloth and care card.', price: p(540), metals: ['18k-yellow', '18k-white'], specs: { Pearl: '7–7.5 mm Akoya' }, images: [IMG.gift2, IMG.earrings2] },
  { id: 'tns-gf-003', slug: 'gift-card', name: 'Teresa & Sons Gift Card', category: 'gifts', collection: 'Gift Cards', tagline: 'The gift of choosing.', description: 'Redeemable in our Montreal salon and online in CAD or USD.', price: p(250, 200), metals: [], specs: { Denominations: '$250 – $10,000', Validity: 'No expiry' }, images: [IMG.gift1] },

  // Custom
  { id: 'tns-cs-001', slug: 'bespoke-engagement-commission', name: 'Bespoke Engagement Commission', category: 'custom', collection: 'Sur Mesure', tagline: 'Designed with you, from the first sketch.', description: 'Private consultation, CAD renders, wax model and hand-setting. Price shown is a starting deposit.', price: p(5000), metals: BRIDAL_METALS, specs: { Process: 'Consult → sketch → CAD → wax → set', Consultation: 'In salon or virtual' }, images: [IMG.ring2, IMG.bridal2], badges: ['Made to Order'], leadTimeWeeks: 8, engravable: true },
  { id: 'tns-cs-002', slug: 'heirloom-redesign', name: 'Heirloom Redesign', category: 'custom', collection: 'Sur Mesure', tagline: 'Old stones, new stories.', description: 'We reset and reimagine inherited stones and gold into a new piece.', price: p(1800), metals: [...GOLDS, 'platinum'], specs: { Includes: 'Appraisal, design, recast', Service: 'Gold reclaimed where possible' }, images: [IMG.rings], badges: ['Made to Order'], leadTimeWeeks: 6 },
  { id: 'tns-cs-003', slug: 'engraved-nameplate-necklace', name: 'Engraved Nameplate Necklace', category: 'custom', collection: 'Personalized', tagline: 'Your name, in our script.', description: 'A hand-sawn nameplate in up to ten letters, with optional diamond dot.', price: p(1250), metals: [...GOLDS, 'vermeil'], specs: { Letters: 'Up to 10', Option: 'Diamond accent +$180' }, images: [IMG.necklace1], badges: ['Made to Order'], leadTimeWeeks: 3, engravable: true, personalization: { kind: 'nameplate', label: 'Your name', hint: 'Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes.', minLength: 2, maxLength: 10, allowed: "A-Za-zÀ-ÿ '\\-", fonts: ['script', 'serif', 'block'], accent: { label: 'Diamond accent', priceCAD: 180 }, chainLengths: ['16 in', '18 in', '20 in'] } },
]

// Helpers

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug)
export const getProduct = (slug: string) => PRODUCTS.find((pr) => pr.slug === slug)
export const getProductsByCategory = (slug: CategorySlug) => PRODUCTS.filter((pr) => pr.category === slug)

export function priceFor(product: Product, currency: Currency, metal?: Metal): number {
  const base = product.price[currency]
  if (!metal) return base
  const delta = METALS[metal].priceDeltaCAD
  return base + (currency === 'CAD' ? delta : Math.round(delta * CAD_TO_USD))
}

const money = new Map<string, Intl.NumberFormat>()

/** An amount in the visitor's locale, with a bare $ ($1,250 in English, 1 250 $ in French); callers print the ISO code. */
export function formatPrice(amount: number, currency: Currency, locale: Locale = getLocale()): string {
  const key = `${locale}|${currency}`
  let f = money.get(key)
  if (!f) money.set(key, (f = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })))
  return f.format(amount)
}

// Personalization

export const toUSD = (cad: number) => Math.round((cad * CAD_TO_USD) / 5) * 5

export function personalizationPrice(product: Product, p: Personalization | undefined, currency: Currency): number {
  const accent = product.personalization?.accent
  if (!p?.accent || !accent) return 0
  return currency === 'CAD' ? accent.priceCAD : toUSD(accent.priceCAD)
}

const ENGRAVING = bilingual(
  { letter: 'Please enter a letter', atLeast: (n: number) => `Please enter at least ${n} characters`, atMost: (n: number) => `Maximum ${n} characters`, characters: 'Some characters cannot be engraved' },
  { letter: 'Veuillez saisir une lettre', atLeast: (n) => `Veuillez saisir au moins ${n} caractères`, atMost: (n) => `${n} caractères au maximum`, characters: 'Certains caractères ne peuvent pas être gravés' },
)

/** The engraving error for a text, in the visitor's language, or null when it can be engraved. */
export function validatePersonalization(cfg: PersonalizationConfig, text: string): string | null {
  const t = text.trim()
  const m = pick(ENGRAVING)
  if (t.length < cfg.minLength) return cfg.minLength === 1 ? m.letter : m.atLeast(cfg.minLength)
  if (t.length > cfg.maxLength) return m.atMost(cfg.maxLength)
  if (!new RegExp(`^[${cfg.allowed}]+$`).test(t)) return m.characters
  return null
}

// Rentals

export type RentalPeriodId = 'weekend' | 'week' | 'month'

export const RENTAL_DAYS: Record<RentalPeriodId, number> = { weekend: 3, week: 7, month: 30 }

export const RENTAL_SLOTS = ['09:00 – 11:00', '11:00 – 13:00', '14:00 – 16:00', '17:00 – 19:00'] as const

/** A delivery window as the visitor reads time: 09:00 – 11:00 in Canadian English, 9 AM – 11 AM, 9 h – 11 h. */
export function formatSlot(slot: string, locale: Locale = getLocale()) {
  if (locale === 'en-CA') return slot
  const [from, to] = slot.split('–').map((s) => Number(s.trim().split(':')[0]))
  return `${formatHour(from, locale)} – ${formatHour(to, locale)}`
}

/** Days of notice required before a rental can be delivered. */
export const RENTAL_LEAD_DAYS = 2

export interface RentalBooking {
  start: string // ISO date, yyyy-mm-dd
  slot: string
  method: 'courier' | 'salon'
}

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export function rentalReturnDate(start: string, period: RentalPeriodId): Date {
  return addDays(parseIso(start), RENTAL_DAYS[period])
}

/** Demo availability: a few booked windows per piece, stable per slug, relative to today. */
export function getBookedDates(slug: string): Set<string> {
  let h = 0
  for (const ch of slug) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  const today = new Date()
  const booked = new Set<string>()
  for (let k = 0; k < 4; k++) {
    const offset = 5 + ((h >> (k * 5)) % 20) + k * 24
    const len = 3 + ((h >> (k * 3)) % 5)
    for (let i = 0; i < len; i++) booked.add(isoDate(addDays(today, offset + i)))
  }
  return booked
}

/** A date in the visitor's locale (Wed, Oct 21 · mer. 21 oct.). */
export const formatDay = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }, locale: Locale = getLocale()) =>
  d.toLocaleDateString(locale, opts)

// Virtual try-on

export type TryOnKind = 'necklace' | 'earrings' | 'ring' | 'bracelet' | 'watch'

/** How a piece is drawn on the camera feed, or null when it cannot be tried on. */
export function tryOnKind(p: Product): TryOnKind | null {
  const n = p.name.toLowerCase()
  if (/gift card|redesign/.test(n)) return null
  if (/earring|stud|drop|huggie|tiara/.test(n)) return 'earrings'
  if (/necklace|pendant|collar|rivi|chain(?! bracelet)/.test(n)) return 'necklace'
  if (/bracelet|cuff|tennis/.test(n)) return 'bracelet'
  if (p.category === 'watches') return 'watch'
  if (/ring|signet|band|solitaire|three-stone|engagement/.test(n) || p.category === 'rings' || p.category === 'bridal') return 'ring'
  return null
}
