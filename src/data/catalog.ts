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

/** What a piece is, as Shopify's product type: it drives the chapter filters and the two signature pages. */
export type ProductType =
  | 'engagement'
  | 'band'
  | 'eternity'
  | 'tennis-necklace'
  | 'riviere'
  | 'collar'
  | 'pendant'
  | 'chain'
  | 'nameplate'
  | 'studs'
  | 'drops'
  | 'huggies'
  | 'chandelier'
  | 'tennis-bracelet'
  | 'cuff'
  | 'chain-bracelet'
  | 'signet'
  | 'cocktail'
  | 'stacking'
  | 'watch'
  | 'set'
  | 'commission'
  | 'redesign'
  | 'gift-card'

export interface Product {
  id: string
  slug: string
  name: string
  category: CategorySlug
  /** Other chapters that show the piece beside its own (the vault's collar also hangs in Necklaces). */
  alsoIn?: CategorySlug[]
  type: ProductType
  collection: string
  tagline: string
  description: string
  price: Price
  metals: Metal[]
  gia?: GiaSpec
  specs: Record<string, string>
  /** Photos in order: the piece, then on the body (in scale), then details. */
  images: string[]
  /** Rental rates. A piece with rates can be rented or bought: the same piece, two ways. */
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
  // Each piece's own photos (placeholders, matched by eye 2026-10-21): the piece, on the body, then a detail.
  pendant: img('photo-1762505464446-c0760d740aee'),
  pendantWorn: img('photo-1616294099799-dab525ec05c1'),
  pendantNeck: img('photo-1616294208582-c2a6d73b467b'),
  riviere: img('photo-1724937721130-c9a9a4ee477e'),
  riviereWorn: img('photo-1673178875233-a1f2e0124b7e'),
  tennisMacro: img('photo-1570891836868-673ee4818f81'),
  paperclip: img('photo-1659708701940-e60893ef03d0'),
  paperclipWorn: img('photo-1633555234296-657a18d8b81a'),
  paperclipLayered: img('photo-1633810542706-90e5ff7557be'),
  studs: img('photo-1588444650733-d0767b753fc8'),
  studsWorn: img('photo-1612225865069-66aff23a15ad'),
  pearlDrops: img('photo-1682822749969-61a63203c501'),
  pearlDropsWorn: img('photo-1590166223826-12dee1677420'),
  pearlDropsDetail: img('photo-1622584940190-0cedd29ebaa8'),
  huggies: img('photo-1729101913526-e97b1462c3ea'),
  huggiesWorn: img('photo-1671644730555-916aa8d8157f'),
  huggiesGold: img('photo-1632525230528-ec17c49bc168'),
  tennisBracelet: img('photo-1619119069152-a2b331eb392a'),
  tennisBraceletWorn: img('photo-1763029513623-37d488cb97b1'),
  tennisBraceletDetail: img('photo-1581522722022-802dd1ba55ed'),
  cuff: img('photo-1786052352130-7d89588d9bcf'),
  cuffOpen: img('photo-1786052348449-1dfe87c31b37'),
  cuffWorn: img('photo-1785088602245-6fa5177aa7e2'),
  curb: img('photo-1602173574767-37ac01994b2a'),
  curbWorn: img('photo-1633810543462-77c4a3b13f07'),
  curbFine: img('photo-1775212429587-82779c6f8775'),
  signet: img('photo-1636834669718-ef9228592ac7'),
  signetWorn: img('photo-1612285127323-1837364f9da0'),
  emerald: img('photo-1685970730959-eb22c7b2bcd9'),
  emeraldWorn: img('photo-1764315974938-0b6807e9510f'),
  emeraldDetail: img('photo-1685970732254-d2d1f43ddc7c'),
  stacking: img('photo-1591209695498-d4c00abe85f5'),
  stackingTrio: img('photo-1717605877844-b506a1f5b914'),
  oval: img('photo-1786817001490-d3d12f0f88cc'),
  ovalWorn: img('photo-1780624195552-7dd4c2bd12d1'),
  ovalBox: img('photo-1727726225026-7730bbcd5062'),
  threeStone: img('photo-1694617230665-68d66db2ac98'),
  emeraldCutWorn: img('photo-1762505464779-17f78cbfa8b4'),
  emeraldCut: img('photo-1714188662030-7f79c65af034'),
  bands: img('photo-1622398925373-3f91b1e275f5'),
  bandsWorn: img('photo-1769038931402-5c6b387cb8d6'),
  bandsPlatinum: img('photo-1562249004-1f7289c19c49'),
  watchGold: img('photo-1541778480-fc1752bbc2a9'),
  watchWorn: img('photo-1618215649872-6e3143a716ec'),
  chrono: img('photo-1613704193420-a53cab02d194'),
  chronoGold: img('photo-1670177257750-9b47927f68eb'),
  ladyWatch: img('photo-1751437774882-deeea4352018'),
  ladyWatchWorn: img('photo-1653651460770-73513a4b25a5'),
  collar: img('photo-1719862056514-0cdacd9142b5'),
  collarWorn: img('photo-1743264385411-57c883bdc0ea'),
  sapphire: img('photo-1770722272510-ef28c6f57541'),
  sapphireDrops: img('photo-1535632066927-ab7c9ab60908'),
  tiara: img('photo-1693833968509-78c08545a714'),
  tiaraBox: img('photo-1607007790046-4a558c42850a'),
  tiaraDetail: img('photo-1710549085652-777ea1687f91'),
  disc: img('photo-1635767798638-3e25273a8236'),
  box: img('photo-1686575131650-e02f84970212'),
  pearlSet: img('photo-1623303179820-de8ec58b03dc'),
  pearlSetDetail: img('photo-1704957205218-d436eac4c607'),
  sketchRings: img('photo-1780241623929-a695fdac13cc'),
  ringBoxHand: img('photo-1559006864-38a01f201f95'),
  heirloom: img('photo-1578469488462-96f9af23e4b8'),
  drawings: img('photo-1725918319084-fa1729714ed1'),
  nameplate: img('photo-1773929269191-813b7eca6954'),
  nameplateBar: img('photo-1771515411694-57fb626159d1'),
  roundWorn: img('photo-1661748068553-3c8fa3a729c5'),
  roundBox: img('photo-1677045419454-e8b201856472'),
  claws: img('photo-1514612497953-05d1e5e171fa'),
  cushion: img('photo-1747116404311-55f8d8944e83'),
  cushionWorn: img('photo-1559006045-d34d415b2cff'),
  haloRound: img('photo-1598560915470-3a84f9d1b0fc'),
  toiEtMoi: img('photo-1591209662757-ab76fb411c70'),
  radiant: img('photo-1598560917807-1bae44bd2be8'),
  radiantWorn: img('photo-1695585717983-53e9d69f2ab8'),
  radiantBox: img('photo-1714188662195-0a30f5497639'),
  eternity: img('photo-1673385890456-c50405156d19'),
  eternityEmerald: img('photo-1770372053533-d4a439ecc6b4'),
  eternityDetail: img('photo-1786835567200-15cffe50660d'),
  tennisBust: img('photo-1790270951146-f59d639d5fa7'),
  tennisWorn: img('photo-1761569105762-c54a69466d06'),
  tennisPurple: img('photo-1721103428824-fc962ac61b63'),
  tennisLayered: img('photo-1749125380446-60fd7c5ba4cb'),
  tennisGold: img('photo-1721807550913-d3a5249458ec'),
  lineWorn: img('photo-1643236049958-8c5a4b1b5f71'),
  archive1962: img('photo-1725918319084-fa1729714ed1'),
  archive1979: img('photo-1773134290548-e86562f13a7f'),
  archive1988: img('photo-1689560025810-4599bc195814'),
  archive1996: img('photo-1624588057318-5f1b2eb81012'),
  archive2012: img('photo-1763575648373-f59cd73a4ece'),
  archive2025: img('photo-1744822220368-c380740bfc7f'),
  handsDesign: img('photo-1790950812645-08421e1c41d8'),
  handsSetting: img('photo-1628058494685-6c2f796ac24a'),
  handsBench: img('photo-1628058405911-c11ef68d9516'),
  salon: img('photo-1782834294783-dff56aa2a540'),
  tray: img('photo-1708221269975-cc31682c7fc4'),
  ovalLight: img('photo-1726256677740-dfd61fa1af26'),
  tennisWork: img('photo-1599071338288-49173359e0fd'),
  casting: img('photo-1609619742069-f5e18afeef17'),
  loupe: img('photo-1660860548716-a750ac5b2bbc'),
  stones: img('photo-1750767323886-164156e82e62'),
  vitrine: img('photo-1786468539073-73d78d616b35'),
  bonsecours: img('photo-1786503335960-09c0c71cdc1f'),
  gifting: img('photo-1609421140100-839985651c84'),
  proposal: img('photo-1529519195486-16945f0fb37f'),
  bride: img('photo-1481980235850-66e47651e431'),
  roundWornWarm: img('photo-1631897817977-a1005c199b36'),
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
  { id: 'tns-nk-001', slug: 'mont-royal-solitaire-pendant', name: 'Mont-Royal Solitaire Pendant', category: 'necklaces', type: 'pendant', collection: 'Mont-Royal', tagline: 'A single round brilliant, suspended.', description: 'A GIA-certified round brilliant floats in a four-claw basket on a fine cable chain, adjustable at 16 and 18 inches.', price: p(6850), metals: GOLDS, gia: { reportNumber: '2231874590', shape: 'Round Brilliant', carat: 0.7, color: 'F', clarity: 'VS1', cut: 'Excellent' }, specs: { Chain: '1.1 mm cable, 16–18 in', Clasp: 'Spring ring' }, images: [IMG.pendant, IMG.pendantWorn, IMG.pendantNeck], badges: ['Bestseller'] },
  { id: 'tns-nk-002', slug: 'riviere-saint-laurent', name: 'Rivière Saint-Laurent', category: 'necklaces', type: 'riviere', collection: 'Saint-Laurent', tagline: 'A river of graduated diamonds.', description: 'Ninety-two graduated round diamonds set in individual collets, articulated to drape like water.', price: p(38500), metals: ['18k-white', 'platinum'], specs: { 'Total carat weight': '12.40 ct', Color: 'F–G', Clarity: 'VS', Length: '16 in' }, images: [IMG.riviere, IMG.riviereWorn, IMG.tennisMacro], rental: rental(560, 1250, 3400, 5000), badges: ['Atelier Exclusive'] },
  { id: 'tns-nk-003', slug: 'plateau-paperclip-chain', name: 'Plateau Paperclip Chain', category: 'necklaces', type: 'chain', collection: 'Plateau', tagline: 'The everyday link.', description: 'Elongated hand-polished links in solid gold, made to layer.', price: p(2450), metals: [...GOLDS, 'vermeil'], specs: { Link: '4.2 mm', Length: '18 in', Weight: '6.8 g' }, images: [IMG.paperclip, IMG.paperclipWorn, IMG.paperclipLayered], badges: ['New'], engravable: true },
  { id: 'tns-nk-004', slug: 'redpath-tennis-necklace', name: 'Redpath Tennis Necklace', category: 'necklaces', type: 'tennis-necklace', collection: 'Redpath', tagline: 'One hundred and twelve diamonds, one line.', description: 'Round brilliants of one size, each in four claws, linked by hand so the line lies flat at the collarbone. A double safety clasp closes it.', price: p(24500), metals: ['18k-white', 'platinum', '18k-yellow'], specs: { 'Total carat weight': '10.00 ct', Color: 'F–G', Clarity: 'VS', Length: '16 in' }, images: [IMG.tennisBust, IMG.tennisWorn, IMG.tennisMacro], rental: rental(380, 850, 2200, 3000), badges: ['Bestseller'] },
  { id: 'tns-nk-005', slug: 'drummond-graduated-tennis', name: 'Drummond Graduated Tennis Necklace', category: 'necklaces', type: 'tennis-necklace', collection: 'Drummond', tagline: 'Fuller at the centre, lighter at the clasp.', description: 'Round brilliants graduated from 0.30 ct at the centre to 0.05 ct at the clasp, so the line falls like a pendant.', price: p(18900), metals: ['18k-white', '18k-yellow', 'platinum'], specs: { 'Total carat weight': '7.50 ct', Color: 'G', Clarity: 'VS–SI1', Length: '17 in' }, images: [IMG.tennisPurple, IMG.tennisLayered], rental: rental(300, 680, 1800, 2500), badges: ['New'] },
  { id: 'tns-nk-006', slug: 'peel-emerald-cut-line', name: 'Peel Emerald-Cut Line Necklace', category: 'necklaces', type: 'tennis-necklace', collection: 'Peel', tagline: 'Step cuts, end to end.', description: 'Emerald-cut diamonds set east–west in slim collets: a quieter light than brilliants, like a row of windows at dusk.', price: p(32800), metals: ['18k-yellow', '18k-white', 'platinum'], specs: { 'Total carat weight': '12.80 ct', Color: 'E–F', Clarity: 'VVS–VS', Length: '16 in' }, images: [IMG.tennisGold, IMG.lineWorn], rental: rental(450, 1000, 2600, 4000), badges: ['Atelier Exclusive'] },

  // Earrings
  { id: 'tns-er-001', slug: 'vieux-port-diamond-studs', name: 'Vieux-Port Diamond Studs', category: 'earrings', type: 'studs', collection: 'Vieux-Port', tagline: 'The classic pair, matched by hand.', description: 'A matched pair of GIA-certified round diamonds in four-prong martini settings with secure screw backs.', price: p(8900), metals: [...GOLDS, 'platinum'], gia: { reportNumber: '6452198830', shape: 'Round Brilliant', carat: 1.0, color: 'G', clarity: 'VS2', cut: 'Excellent' }, specs: { 'Total carat weight': '1.00 ct (pair)', Backs: 'Screw' }, images: [IMG.studs, IMG.studsWorn], rental: rental(120, 280, 720, 1000), badges: ['Bestseller'] },
  { id: 'tns-er-002', slug: 'outremont-pearl-drops', name: 'Outremont Pearl Drops', category: 'earrings', type: 'drops', collection: 'Outremont', tagline: 'South Sea light, softly swinging.', description: 'Golden South Sea pearls beneath pavé diamond caps.', price: p(4200), metals: ['18k-yellow', '18k-white'], specs: { Pearl: '11–12 mm South Sea', Diamonds: '0.22 ct' }, images: [IMG.pearlDrops, IMG.pearlDropsWorn, IMG.pearlDropsDetail], badges: ['New'] },
  { id: 'tns-er-003', slug: 'mile-end-huggies', name: 'Mile End Huggies', category: 'earrings', type: 'huggies', collection: 'Mile End', tagline: 'Pavé, hinged, effortless.', description: 'Petite hinged hoops lined with micro-pavé diamonds.', price: p(1950), metals: [...GOLDS, 'vermeil'], specs: { Diameter: '12 mm', Diamonds: '0.18 ct' }, images: [IMG.huggies, IMG.huggiesWorn, IMG.huggiesGold] },

  // Bracelets
  { id: 'tns-br-001', slug: 'westmount-tennis-bracelet', name: 'Westmount Tennis Bracelet', category: 'bracelets', type: 'tennis-bracelet', collection: 'Westmount', tagline: 'Fifty diamonds, one unbroken line.', description: 'Four-prong set round diamonds with a double safety box clasp.', price: p(14500), metals: ['18k-white', '18k-yellow', 'platinum'], specs: { 'Total carat weight': '5.00 ct', Color: 'G–H', Clarity: 'VS–SI1', Length: '7 in' }, images: [IMG.tennisBracelet, IMG.tennisBraceletWorn, IMG.tennisBraceletDetail], rental: rental(180, 420, 1100, 1500), badges: ['Bestseller'] },
  { id: 'tns-br-002', slug: 'atwater-cuff', name: 'Atwater Cuff', category: 'bracelets', type: 'cuff', collection: 'Atwater', tagline: 'Sculpted, hammered, hand-signed.', description: 'A solid gold cuff, hammer-textured and signed inside by the maker.', price: p(5600), metals: GOLDS, specs: { Width: '8 mm', Weight: '24 g' }, images: [IMG.cuff, IMG.cuffWorn, IMG.cuffOpen], engravable: true },
  { id: 'tns-br-003', slug: 'griffintown-chain-bracelet', name: 'Griffintown Chain Bracelet', category: 'bracelets', type: 'chain-bracelet', collection: 'Griffintown', tagline: 'Industrial roots, refined.', description: 'Curb links with a single bezel-set diamond station.', price: p(1650), metals: [...GOLDS, 'vermeil'], specs: { Diamond: '0.10 ct', Length: '6.5–7.5 in' }, images: [IMG.curb, IMG.curbWorn, IMG.curbFine], badges: ['New'], engravable: true },

  // Rings
  { id: 'tns-rg-001', slug: 'teresa-signet', name: 'The Teresa Signet', category: 'rings', type: 'signet', collection: 'Heritage', tagline: 'Our founder’s ring, recast.', description: 'An oval signet modelled on Teresa’s 1962 original — ready for a monogram or crest.', price: p(3200), metals: GOLDS, specs: { Face: '12 × 10 mm', Weight: '9 g' }, images: [IMG.signet, IMG.signetWorn], badges: ['Bestseller'], engravable: true, personalization: { kind: 'monogram', label: 'Monogram', hint: 'Up to three initials, hand-engraved on the face.', minLength: 1, maxLength: 3, allowed: 'A-Za-z', fonts: ['serif', 'script', 'block'], backEngraving: true } },
  { id: 'tns-rg-002', slug: 'sherbrooke-emerald-cocktail', name: 'Sherbrooke Emerald Cocktail Ring', category: 'rings', type: 'cocktail', collection: 'Sherbrooke', tagline: 'Colombian green, framed in light.', description: 'A 3.1 ct Colombian emerald within a halo of round diamonds.', price: p(21800), metals: ['18k-yellow', 'platinum'], specs: { Emerald: '3.10 ct, Colombia, minor oil', Diamonds: '0.85 ct' }, images: [IMG.emerald, IMG.emeraldWorn, IMG.emeraldDetail], badges: ['Limited'] },
  { id: 'tns-rg-003', slug: 'laurier-stacking-band', name: 'Laurier Stacking Band', category: 'rings', type: 'stacking', collection: 'Laurier', tagline: 'Thin, bright, endlessly stackable.', description: 'A 1.6 mm band of half-eternity pavé.', price: p(1350), metals: [...GOLDS, 'platinum'], specs: { Width: '1.6 mm', Diamonds: '0.15 ct' }, images: [IMG.stacking, IMG.stackingTrio] },

  // Bridal
  { id: 'tns-bd-001', slug: 'notre-dame-oval-solitaire', name: 'Notre-Dame Oval Solitaire', category: 'bridal', type: 'engagement', collection: 'Notre-Dame', tagline: 'A cathedral setting for an oval.', description: 'A GIA-certified oval rises from a hidden halo on a knife-edge band.', price: p(18900), metals: BRIDAL_METALS, gia: { reportNumber: '1449286107', shape: 'Oval', carat: 1.82, color: 'E', clarity: 'VS1', cut: 'Excellent (polish & symmetry)' }, specs: { Band: '1.8 mm knife edge', 'Hidden halo': '0.12 ct' }, images: [IMG.oval, IMG.ovalWorn, IMG.ovalBox], badges: ['Bestseller'], engravable: true },
  { id: 'tns-bd-002', slug: 'basilique-emerald-cut-three-stone', name: 'Basilique Three-Stone', category: 'bridal', type: 'engagement', collection: 'Basilique', tagline: 'Past, present, future.', description: 'An emerald-cut centre flanked by tapered baguettes.', price: p(26400), metals: BRIDAL_METALS, gia: { reportNumber: '5402177764', shape: 'Emerald', carat: 2.01, color: 'F', clarity: 'VVS2', cut: 'Excellent (polish & symmetry)' }, specs: { 'Side stones': '0.48 ct tapered baguettes' }, images: [IMG.emeraldCut, IMG.emeraldCutWorn, IMG.threeStone], badges: ['Atelier Exclusive'], engravable: true },
  { id: 'tns-bd-003', slug: 'promesse-wedding-band', name: 'Promesse Wedding Band', category: 'bridal', type: 'band', collection: 'Promesse', tagline: 'Comfort fit, forever.', description: 'A classic comfort-fit band available in 2, 4 and 6 mm.', price: p(1450), metals: BRIDAL_METALS, specs: { Widths: '2 / 4 / 6 mm', Profile: 'Comfort fit' }, images: [IMG.bands, IMG.bandsWorn, IMG.bandsPlatinum], engravable: true },
  { id: 'tns-bd-004', slug: 'bonsecours-round-solitaire', name: 'Bonsecours Round Solitaire', category: 'bridal', type: 'engagement', collection: 'Bonsecours', tagline: 'Six claws, one round brilliant.', description: 'A GIA-certified round brilliant held in six slender claws above a tapered band: the ring most proposals begin with.', price: p(14800), metals: BRIDAL_METALS, gia: { reportNumber: '2468013579', shape: 'Round Brilliant', carat: 1.51, color: 'F', clarity: 'VS1', cut: 'Excellent' }, specs: { Band: '2.0 mm tapered', Setting: 'Six-claw' }, images: [IMG.roundBox, IMG.roundWorn, IMG.claws], badges: ['Bestseller'], engravable: true },
  { id: 'tns-bd-005', slug: 'ville-marie-cushion', name: 'Ville-Marie Cushion', category: 'bridal', type: 'engagement', collection: 'Ville-Marie', tagline: 'A soft square, quietly haloed.', description: 'A GIA-certified elongated cushion over a hidden halo of micro-pavé, on a pavé band that catches the light from the side.', price: p(21600), metals: BRIDAL_METALS, gia: { reportNumber: '7351902468', shape: 'Cushion', carat: 2.03, color: 'G', clarity: 'VS2', cut: 'Excellent (polish & symmetry)' }, specs: { Band: '1.9 mm pavé', 'Hidden halo': '0.18 ct' }, images: [IMG.cushion, IMG.cushionWorn, IMG.haloRound], engravable: true },
  { id: 'tns-bd-006', slug: 'saint-louis-toi-et-moi', name: 'Saint-Louis Toi et Moi', category: 'bridal', type: 'engagement', collection: 'Saint-Louis', tagline: 'Two stones, one story.', description: 'Two GIA-certified round brilliants set side by side on a split pavé band: one for each of you.', price: p(17900), metals: BRIDAL_METALS, gia: { reportNumber: '3184620957', shape: 'Round Brilliant', carat: 1.01, color: 'F', clarity: 'VS1', cut: 'Excellent' }, specs: { 'Second stone': '1.00 ct round, GIA', Band: 'Split pavé, 0.32 ct' }, images: [IMG.toiEtMoi, IMG.roundWornWarm, IMG.stones], badges: ['New'], engravable: true },
  { id: 'tns-bd-007', slug: 'maisonneuve-radiant-solitaire', name: 'Maisonneuve Radiant Solitaire', category: 'bridal', type: 'engagement', collection: 'Maisonneuve', tagline: 'Brilliance, squared.', description: 'A GIA-certified radiant cut in a four-claw basket, with a line of micro-pavé down the band.', price: p(19400), metals: ['18k-yellow', 'platinum', '18k-white', '18k-rose'], gia: { reportNumber: '9027415836', shape: 'Radiant', carat: 1.7, color: 'E', clarity: 'VS2', cut: 'Excellent (polish & symmetry)' }, specs: { Band: '1.8 mm pavé', Setting: 'Four-claw' }, images: [IMG.radiant, IMG.radiantWorn, IMG.radiantBox], engravable: true },
  { id: 'tns-bd-008', slug: 'lachine-eternity-band', name: 'Lachine Eternity Band', category: 'bridal', type: 'eternity', collection: 'Lachine', tagline: 'Diamonds all the way round.', description: 'A full circle of round brilliants, shared-claw set by hand so the band never stops catching the light.', price: p(6900), metals: BRIDAL_METALS, specs: { 'Total carat weight': '2.20 ct', Width: '2.4 mm', Setting: 'Shared claw' }, images: [IMG.eternity, IMG.eternityEmerald, IMG.eternityDetail], badges: ['New'], engravable: true },

  // Watches
  { id: 'tns-wt-001', slug: 'heritage-automatic-38', name: 'Heritage Automatic 38', category: 'watches', type: 'watch', collection: 'Swiss Selection', tagline: 'Swiss movement, Montreal-regulated.', description: 'A 38 mm automatic with sunburst dial, regulated in our atelier.', price: p(7400), metals: ['18k-yellow', '18k-white'], specs: { Case: '38 mm', Movement: 'Swiss automatic, 42 h reserve', 'Water resistance': '50 m', Strap: 'Alligator' }, images: [IMG.watchGold, IMG.watchWorn], badges: ['New'], engravable: true },
  { id: 'tns-wt-002', slug: 'chronographe-1962', name: 'Chronographe 1962', category: 'watches', type: 'watch', collection: 'Swiss Selection', tagline: 'For the year we opened our doors.', description: 'A limited chronograph of 62 pieces with a panda dial.', price: p(12900), metals: ['18k-rose', '18k-yellow'], specs: { Case: '40 mm', Movement: 'Manual-wind chronograph', Edition: '62 pieces' }, images: [IMG.chrono, IMG.chronoGold], badges: ['Limited'] },
  { id: 'tns-wt-003', slug: 'dame-du-lac', name: 'Dame du Lac', category: 'watches', type: 'watch', collection: 'Swiss Selection', tagline: 'Mother-of-pearl, diamond bezel.', description: 'A petite quartz watch with a diamond-set bezel.', price: p(9600), metals: ['18k-white', '18k-rose'], specs: { Case: '30 mm', Movement: 'Swiss quartz', Bezel: '0.60 ct diamonds' }, images: [IMG.ladyWatch, IMG.ladyWatchWorn] },

  // Rentals
  { id: 'tns-rn-001', slug: 'gala-diamond-collar', name: 'Gala Diamond Collar', category: 'rentals', alsoIn: ['necklaces'], type: 'collar', collection: 'Rental Vault', tagline: 'Red carpet, by the weekend.', description: 'An 18 ct diamond collar, fully insured, delivered by courier in Montreal, Toronto and New York.', price: p(92000), metals: ['platinum'], specs: { 'Total carat weight': '18.20 ct', Insurance: 'Included', Delivery: 'Bonded courier' }, images: [IMG.collar, IMG.collarWorn], rental: rental(650, 1400, 3900, 5000), badges: ['Atelier Exclusive'] },
  { id: 'tns-rn-002', slug: 'chandelier-sapphire-earrings', name: 'Chandelier Sapphire Earrings', category: 'rentals', alsoIn: ['earrings'], type: 'chandelier', collection: 'Rental Vault', tagline: 'Ceylon blue, borrowed for the night.', description: 'Cascading Ceylon sapphires and diamonds.', price: p(34000), metals: ['18k-white'], specs: { Sapphires: '8.40 ct Ceylon', Diamonds: '3.10 ct' }, images: [IMG.sapphire, IMG.sapphireDrops], rental: rental(320, 720, 1900, 2500) },
  { id: 'tns-rn-003', slug: 'bridal-tiara-and-drops', name: 'Bridal Tiara & Drops Set', category: 'rentals', alsoIn: ['bridal'], type: 'set', collection: 'Rental Vault', tagline: 'Something borrowed.', description: 'A diamond tiara with matching drop earrings, fitted at our salon.', price: p(48000), metals: ['platinum'], specs: { Includes: 'Tiara, earrings, fitting', Insurance: 'Included' }, images: [IMG.tiara, IMG.tiaraBox, IMG.tiaraDetail], rental: rental(480, 1100, 2800, 3500), badges: ['Bestseller'] },

  // Gifts
  { id: 'tns-gf-001', slug: 'initial-disc-pendant', name: 'Initial Disc Pendant', category: 'gifts', type: 'pendant', collection: 'Gifts under $1,000', tagline: 'One letter, endlessly personal.', description: 'A hand-engraved disc on a fine chain, presented in our travertine box.', price: p(680), metals: [...GOLDS, 'vermeil'], specs: { Disc: '12 mm', Chain: '16–18 in' }, images: [IMG.disc, IMG.box], engravable: true, badges: ['Bestseller'], personalization: { kind: 'initial', label: 'Initial', hint: 'One letter, hand-engraved on the front of the disc.', minLength: 1, maxLength: 1, allowed: 'A-Za-z', fonts: ['serif', 'script', 'block'], chainLengths: ['16 in', '18 in', '20 in'], backEngraving: true } },
  { id: 'tns-gf-002', slug: 'pearl-stud-gift-set', name: 'Pearl Stud Gift Set', category: 'gifts', type: 'studs', collection: 'Gifts under $1,000', tagline: 'Freshwater pearls, boxed and ribboned.', description: 'Akoya pearl studs with a polishing cloth and care card.', price: p(540), metals: ['18k-yellow', '18k-white'], specs: { Pearl: '7–7.5 mm Akoya' }, images: [IMG.pearlSet, IMG.pearlSetDetail] },
  { id: 'tns-gf-003', slug: 'gift-card', name: 'Teresa & Sons Gift Card', category: 'gifts', type: 'gift-card', collection: 'Gift Cards', tagline: 'The gift of choosing.', description: 'Redeemable in our Montreal salon and online in CAD or USD.', price: p(250, 200), metals: [], specs: { Denominations: '$250 – $10,000', Validity: 'No expiry' }, images: [IMG.gift1] },

  // Custom
  { id: 'tns-cs-001', slug: 'bespoke-engagement-commission', name: 'Bespoke Engagement Commission', category: 'custom', type: 'commission', collection: 'Sur Mesure', tagline: 'Designed with you, from the first sketch.', description: 'Private consultation, CAD renders, wax model and hand-setting. Price shown is a starting deposit.', price: p(5000), metals: BRIDAL_METALS, specs: { Process: 'Consult → sketch → CAD → wax → set', Consultation: 'In salon or virtual' }, images: [IMG.sketchRings, IMG.ringBoxHand, IMG.claws], badges: ['Made to Order'], leadTimeWeeks: 8, engravable: true },
  { id: 'tns-cs-002', slug: 'heirloom-redesign', name: 'Heirloom Redesign', category: 'custom', type: 'redesign', collection: 'Sur Mesure', tagline: 'Old stones, new stories.', description: 'We reset and reimagine inherited stones and gold into a new piece.', price: p(1800), metals: [...GOLDS, 'platinum'], specs: { Includes: 'Appraisal, design, recast', Service: 'Gold reclaimed where possible' }, images: [IMG.heirloom, IMG.drawings], badges: ['Made to Order'], leadTimeWeeks: 6 },
  { id: 'tns-cs-003', slug: 'engraved-nameplate-necklace', name: 'Engraved Nameplate Necklace', category: 'custom', type: 'nameplate', collection: 'Personalized', tagline: 'Your name, in our script.', description: 'A hand-sawn nameplate in up to ten letters, with optional diamond dot.', price: p(1250), metals: [...GOLDS, 'vermeil'], specs: { Letters: 'Up to 10', Option: 'Diamond accent +$180' }, images: [IMG.nameplate, IMG.nameplateBar], badges: ['Made to Order'], leadTimeWeeks: 3, engravable: true, personalization: { kind: 'nameplate', label: 'Your name', hint: 'Hand-sawn from solid gold. Letters, spaces, hyphens and apostrophes.', minLength: 2, maxLength: 10, allowed: "A-Za-zÀ-ÿ '\\-", fonts: ['script', 'serif', 'block'], accent: { label: 'Diamond accent', priceCAD: 180 }, chainLengths: ['16 in', '18 in', '20 in'] } },
]

// Helpers

export const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug)
export const getProduct = (slug: string) => PRODUCTS.find((pr) => pr.slug === slug)

/** Whether a piece can be rented. Every piece can be bought; one with rental rates can also be rented. */
export const isRentable = (p: Product) => !!p.rental

/** The vault's own pieces lead with their rental rate; every other piece leads with its price. */
export const rentFirst = (p: Product) => p.category === 'rentals' && !!p.rental

/** A chapter's pieces: its own, the ones shown there too (`alsoIn`), and for Rentals every piece that can be rented. */
export const getProductsByCategory = (slug: CategorySlug) =>
  PRODUCTS.filter((pr) => pr.category === slug || !!pr.alsoIn?.includes(slug) || (slug === 'rentals' && isRentable(pr)))
    // The chapter's own pieces lead; the ones it also shows follow.
    .sort((a, b) => Number(b.category === slug) - Number(a.category === slug))

export function priceFor(product: Product, currency: Currency, metal?: Metal): number {
  const base = product.price[currency]
  if (!metal) return base
  const delta = METALS[metal].priceDeltaCAD
  return base + (currency === 'CAD' ? delta : Math.round(delta * CAD_TO_USD))
}

/** The price a piece opens at on its page (its first metal), so cards, rails and the page always agree. */
export const openingPrice = (p: Product, currency: Currency) => priceFor(p, currency, p.metals[0])

/** What a card or rail shows: the opening price, or the weekend rate when it leads with renting. */
export function cardPrice(p: Product, currency: Currency, rent = rentFirst(p)): { amount: number; rent: boolean } {
  return rent && p.rental ? { amount: p.rental.weekend[currency], rent: true } : { amount: openingPrice(p, currency), rent: false }
}

const RING_TYPES: ProductType[] = ['engagement', 'band', 'eternity', 'signet', 'cocktail', 'stacking']

/** Whether a piece needs a ring size before it can be bought. */
export const needsSize = (p: Product) => RING_TYPES.includes(p.type)

/** Whether buying a piece takes choices first (a ring size, a personalization, a commission brief). Such pieces are
 *  never added from a card, rail or overlay: those link to the product page instead. */
export const needsConfig = (p: Product) => needsSize(p) || !!p.personalization || p.category === 'custom'

/** Whether a piece can go straight into the bag, as a purchase in its first metal. The vault's pieces lead with
 *  renting, which needs dates, so they open their page instead. */
export const quickAddable = (p: Product) => !needsConfig(p) && !rentFirst(p) && p.metals.length > 0 && p.type !== 'gift-card'

/** The name of each type, plural, as the chapter filters show it (French in TYPE_FR). */
export const TYPE_LABELS: Record<ProductType, string> = {
  engagement: 'Engagement rings',
  band: 'Wedding bands',
  eternity: 'Eternity bands',
  'tennis-necklace': 'Tennis necklaces',
  riviere: 'Rivières',
  collar: 'Collars',
  pendant: 'Pendants',
  chain: 'Chains',
  nameplate: 'Nameplates',
  studs: 'Studs',
  drops: 'Drops',
  huggies: 'Huggies',
  chandelier: 'Chandeliers',
  'tennis-bracelet': 'Tennis bracelets',
  cuff: 'Cuffs',
  'chain-bracelet': 'Chain bracelets',
  signet: 'Signets',
  cocktail: 'Cocktail rings',
  stacking: 'Stacking bands',
  watch: 'Watches',
  set: 'Sets',
  commission: 'Commissions',
  redesign: 'Redesigns',
  'gift-card': 'Gift cards',
}

/** Families a chapter can be narrowed to (`?type=`): a product type, or a signature that gathers several. */
export const FAMILIES: Record<string, ProductType[]> = {
  tennis: ['tennis-necklace', 'riviere', 'collar'],
}
export const typesOf = (family: string): ProductType[] => FAMILIES[family] ?? [family as ProductType]

/** The family a type belongs to in the filters (a tennis necklace, a rivière and a collar are all "tennis"). */
export const familyOf = (type: ProductType) => Object.keys(FAMILIES).find((f) => FAMILIES[f].includes(type)) ?? type

/** The house's two signatures, the pieces most clients come for: each has its own page within its chapter. */
export const SIGNATURES = [
  { id: 'engagement', category: 'bridal', family: 'engagement' },
  { id: 'tennis', category: 'necklaces', family: 'tennis' },
] as const satisfies readonly { id: string; category: CategorySlug; family: string }[]

export type SignatureId = (typeof SIGNATURES)[number]['id']

/** The pieces of a signature, in catalog order. */
export const signaturePieces = (id: SignatureId) => {
  const s = SIGNATURES.find((x) => x.id === id)!
  const types = typesOf(s.family)
  return getProductsByCategory(s.category).filter((p) => types.includes(p.type))
}

/** The signature a chapter page shows, when its filter is one. */
export const signatureFor = (category: string, family?: string) => SIGNATURES.find((s) => s.category === category && s.family === family)

const WIDTHS = [480, 800, 1200, 1600, 2000]

/** Responsive `src`, `srcSet` and `sizes` for a catalog photo, so a phone never downloads the 1600 px original. */
export function pic(src: string, sizes = '100vw') {
  if (!src.includes('images.unsplash.com')) return { src }
  return { src, srcSet: WIDTHS.map((w) => `${src.replace(/w=\d+/, `w=${w}`)} ${w}w`).join(', '), sizes }
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
