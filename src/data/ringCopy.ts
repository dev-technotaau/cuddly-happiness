// The ring designer's vocabulary, in both languages: every option's name and one line about it, and a design's
// description for the bag, a visit, a share. One source, so the steps, the price and the summary say the same thing.
import { bilingual, formatNumber, getLocale, pick, type Locale } from '../i18n'
import { catalogFor } from '../i18n/catalog'
import type { Clarity, Colour, Coverage, BandForm, BandStones, EngravingFont, Finish, GemGrade, HeadMetal, ProngTip, RingDesign, SettingHeight, SettingStyle, Shape, SideShape, StoneType } from './ring'
import { headMetal, layoutOf } from './ring'

type Named = { name: string; note: string }

export const RING_COPY = bilingual(
  {
    types: {
      diamond: { name: 'Diamond', note: 'Natural and GIA-certified, the only kind the house sets.' },
      sapphire: { name: 'Sapphire', note: 'Cornflower to midnight blue, harder than any stone but diamond.' },
      ruby: { name: 'Ruby', note: 'The red twin of the sapphire: the same mineral, rare in large, clean sizes.' },
      emerald: { name: 'Emerald', note: 'Colombian green, and softer than the rest: we set it to guard its edges.' },
    } as Record<StoneType, Named>,
    shapes: {
      round: { name: 'Round', note: 'The most brilliant cut: 57 facets returning the most light.' },
      oval: { name: 'Oval', note: 'A round’s fire, drawn long: it lengthens the finger.' },
      cushion: { name: 'Cushion', note: 'A soft square with broad facets, like the old mine cuts.' },
      emerald: { name: 'Emerald', note: 'Step facets like a row of windows: calm light, clear depth.' },
      radiant: { name: 'Radiant', note: 'A rectangle with a brilliant’s sparkle and cropped corners.' },
      princess: { name: 'Princess', note: 'A crisp square brilliant whose corners need protecting.' },
      asscher: { name: 'Asscher', note: 'A square step cut with clipped corners, a favourite of the Art Deco years.' },
      pear: { name: 'Pear', note: 'A teardrop: round at one end, a point at the other.' },
      marquise: { name: 'Marquise', note: 'Long and pointed at both ends: the largest look per carat.' },
      heart: { name: 'Heart', note: 'A romantic outline that asks for a skilled cutter.' },
    } as Record<Shape, Named>,
    // The shape as it qualifies a stone: "Oval diamond", "Emerald-cut sapphire".
    shapeOf: { round: 'Round', oval: 'Oval', cushion: 'Cushion', emerald: 'Emerald-cut', radiant: 'Radiant', princess: 'Princess', asscher: 'Asscher', pear: 'Pear', marquise: 'Marquise', heart: 'Heart' } as Record<Shape, string>,
    stoneTitle: (shape: string, type: string) => `${shape} ${type.toLowerCase()}`,
    colourBands: [['D', 'F', 'Colourless'], ['G', 'H', 'Near colourless'], ['I', 'J', 'A faint warmth']] as [Colour, Colour, string][],
    clarityBands: [['IF', 'IF', 'Internally flawless'], ['VVS1', 'VVS2', 'Very, very slight'], ['VS1', 'VS2', 'Very slight, eye-clean'], ['SI1', 'SI2', 'Slight inclusions']] as [Clarity, Clarity, string][],
    grades: { fine: { name: 'Fine', note: 'Lively colour, a few natural traces.' }, extra: { name: 'Extra fine', note: 'Saturated colour, clean to the eye.' }, exceptional: { name: 'Exceptional', note: 'The colour that gem dealers keep for themselves.' } } as Record<GemGrade, Named>,
    styles: {
      solitaire: { name: 'Solitaire', note: 'The stone alone, on its claws.' },
      halo: { name: 'Halo', note: 'A ring of diamonds around it: more light, a larger face.' },
      'three-stone': { name: 'Three-stone', note: 'Past, present, future: a stone on each side.' },
      bezel: { name: 'Bezel', note: 'A rim of metal all around: modern, and the most protective setting.' },
    } as Record<SettingStyle, Named>,
    heights: { low: { name: 'Low', note: 'Close to the finger, for everyday wear.' }, classic: { name: 'Classic', note: 'The traditional lift.' }, high: { name: 'High', note: 'Raised into the light.' } } as Record<SettingHeight, Named>,
    cathedral: { name: 'Cathedral shoulders', note: 'The band rises in arches to meet the stone.' },
    sides: { round: 'Round', pear: 'Pear', baguette: 'Baguette' } as Record<SideShape, string>,
    sideStones: (shape: string) => `${shape} side stones`,
    counts: { 4: 'Four claws', 6: 'Six claws' } as Record<4 | 6, string>,
    double: { name: 'Double claws', note: 'Two fine claws at each point: a firmer hold.' },
    tips: {
      round: { name: 'Round claw', note: 'Smooth and classic.' },
      eagle: { name: 'Eagle claw', note: 'A fine point that shows more of the stone.' },
      tab: { name: 'Tab claw', note: 'Flat, for the corners of a step cut.' },
    } as Record<ProngTip, Named>,
    // The tips as they finish a description: "Four claws · eagle tips".
    tipOf: { round: 'round tips', eagle: 'eagle tips', tab: 'tab tips' } as Record<ProngTip, string>,
    vTips: { name: 'V-claws at the points', note: 'A chevron guards each point, where a stone can chip.' },
    compass: { name: 'Compass claws', note: 'North, south, east and west instead of the corners.' },
    forms: {
      classic: { name: 'Classic', note: 'Rounded, with a comfort fit inside.' },
      knife: { name: 'Knife edge', note: 'A fine ridge that catches the light.' },
      split: { name: 'Split shank', note: 'It opens in two to cradle the stone.' },
      twist: { name: 'Twist', note: 'Two strands, entwined.' },
    } as Record<BandForm, Named>,
    bandStones: { none: { name: 'Plain metal', note: 'Polished gold or platinum, nothing more.' }, pave: { name: 'Pavé', note: 'Small diamonds held by tiny beads of metal.' }, channel: { name: 'Channel', note: 'Diamonds set flush between two walls: smooth to the touch.' } } as Record<BandStones, Named>,
    coverage: { half: 'Halfway round', 'three-quarter': 'Three-quarters round', full: 'All the way round' } as Record<Coverage, string>,
    taper: { name: 'Tapered', note: 'The band narrows toward the stone.' },
    heads: { match: 'Same as the band', platinum: 'Platinum claws', '18k-white': 'White gold claws' } as Record<HeadMetal, string>,
    bezelHeads: { match: 'Same as the band', platinum: 'Platinum bezel', '18k-white': 'White gold bezel' } as Record<HeadMetal, string>,
    finishes: { polished: { name: 'High polish', note: 'A mirror finish.' }, satin: { name: 'Satin', note: 'Brushed, softly matte.' }, hammered: { name: 'Hammered', note: 'Faceted by hand, catching light everywhere.' } } as Record<Finish, Named>,
    details: {
      hiddenHalo: { name: 'Hidden halo', note: 'Diamonds under the stone, seen from the side.' },
      peekaboo: { name: 'Accent diamonds', note: 'A diamond on each side of the head.' },
      surprise: { name: 'Surprise diamond', note: 'A single diamond inside the band, against the skin.' },
      milgrain: { name: 'Milgrain', note: 'A beaded edge, as on heirloom rings.' },
    },
    fonts: { script: 'Script', serif: 'Serif', block: 'Block' } as Record<EngravingFont, string>,
    // The description a design carries into the bag, a visit and a share.
    title: (stone: string, carat: string) => `${stone}, ${carat} ct`,
    grading: (colour: string, clarity: string) => `${colour} colour · ${clarity}`,
    withSides: (text: string) => `with ${text.toLowerCase()}`,
    band: (form: string, stones: string, width: string) => `${form} band, ${width} mm${stones ? ` · ${stones.toLowerCase()}` : ''}`,
    claws: (count: string, tip: string) => `${count} · ${tip}`,
    bezelHeld: 'Held in a bezel',
    twoTone: (band: string, head: string) => `${band} band, ${head.toLowerCase()}`,
    engraved: (text: string) => `Engraved “${text}”`,
    total: (ct: string) => `${ct} ct total`,
    designed: 'Designed by you',
    // Paid in two parts: the deposit at checkout, the balance on approval of the final design.
    deposit: 'Deposit',
    dueToday: 'Due today',
    dueTodayPreTax: 'Due today, before tax',
    balance: 'Balance on approval',
    today: 'due today',
    // "$3,050 today, a 30% deposit; $7,130 when you approve the final design."
    todayShare: (share: string) => ` today, a ${share} deposit; `,
    onApproval: ' when you approve the final design.',
    orderTotal: 'Order total',
  },
  {
    types: {
      diamond: { name: 'Diamant', note: 'Naturel et certifié GIA, le seul que la maison sertit.' },
      sapphire: { name: 'Saphir', note: 'Du bleuet au bleu nuit, plus dur que toute pierre hormis le diamant.' },
      ruby: { name: 'Rubis', note: 'Le jumeau rouge du saphir : le même minéral, rare en grandes tailles nettes.' },
      emerald: { name: 'Émeraude', note: 'Un vert colombien, plus tendre que les autres : nous sertissons l’émeraude en protégeant ses bords.' },
    },
    shapes: {
      round: { name: 'Rond', note: 'La taille la plus brillante : 57 facettes qui renvoient le plus de lumière.' },
      oval: { name: 'Ovale', note: 'Le feu du rond, en plus long : il allonge le doigt.' },
      cushion: { name: 'Coussin', note: 'Un carré adouci aux larges facettes, comme les tailles anciennes.' },
      emerald: { name: 'Émeraude', note: 'Des facettes à degrés comme une rangée de fenêtres : lumière calme, profondeur limpide.' },
      radiant: { name: 'Radiant', note: 'Un rectangle au scintillement de brillant, aux coins coupés.' },
      princess: { name: 'Princesse', note: 'Un brillant carré et net, dont les coins demandent protection.' },
      asscher: { name: 'Asscher', note: 'Une taille à degrés carrée aux coins coupés, chère à l’époque Art déco.' },
      pear: { name: 'Poire', note: 'Une larme : ronde d’un côté, pointue de l’autre.' },
      marquise: { name: 'Marquise', note: 'Longue et pointue aux deux bouts : le plus grand effet par carat.' },
      heart: { name: 'Cœur', note: 'Une silhouette romantique qui exige un tailleur habile.' },
    },
    shapeOf: { round: 'rond', oval: 'ovale', cushion: 'coussin', emerald: 'taille émeraude', radiant: 'radiant', princess: 'princesse', asscher: 'Asscher', pear: 'poire', marquise: 'marquise', heart: 'cœur' },
    // French puts the shape after the stone, and an emerald is feminine: "Diamant rond", "Émeraude ronde".
    stoneTitle: (shape, type) => `${type} ${type === 'Émeraude' && shape === 'rond' ? 'ronde' : shape}`,
    colourBands: [['D', 'F', 'Incolore'], ['G', 'H', 'Presque incolore'], ['I', 'J', 'Une légère chaleur']],
    clarityBands: [['IF', 'IF', 'Pur à l’intérieur'], ['VVS1', 'VVS2', 'Inclusions infimes'], ['VS1', 'VS2', 'Très légères, nettes à l’œil'], ['SI1', 'SI2', 'Légères inclusions']],
    grades: { fine: { name: 'Fine', note: 'Une couleur vive, quelques traces naturelles.' }, extra: { name: 'Extra-fine', note: 'Une couleur saturée, nette à l’œil.' }, exceptional: { name: 'Exceptionnelle', note: 'La couleur que les négociants en pierres gardent pour eux.' } },
    styles: {
      solitaire: { name: 'Solitaire', note: 'La pierre seule, sur ses griffes.' },
      halo: { name: 'Halo', note: 'Un cercle de diamants autour : plus de lumière, une pierre qui paraît plus grande.' },
      'three-stone': { name: 'Trilogie', note: 'Passé, présent, avenir : une pierre de chaque côté.' },
      bezel: { name: 'Serti clos', note: 'Un rebord de métal tout autour : moderne, et le plus protecteur.' },
    },
    heights: { low: { name: 'Bas', note: 'Près du doigt, pour tous les jours.' }, classic: { name: 'Classique', note: 'L’élévation traditionnelle.' }, high: { name: 'Haut', note: 'Élevé vers la lumière.' } },
    cathedral: { name: 'Épaules cathédrale', note: 'L’anneau s’élève en arches jusqu’à la pierre.' },
    sides: { round: 'Rondes', pear: 'Poires', baguette: 'Baguettes' },
    sideStones: (shape) => `Pierres latérales ${shape.toLowerCase()}`,
    counts: { 4: 'Quatre griffes', 6: 'Six griffes' },
    double: { name: 'Griffes doubles', note: 'Deux fines griffes à chaque point : une tenue plus ferme.' },
    tips: {
      round: { name: 'Griffe ronde', note: 'Douce et classique.' },
      eagle: { name: 'Griffe d’aigle', note: 'Une pointe fine qui dévoile plus de la pierre.' },
      tab: { name: 'Griffe plate', note: 'Plate, pour les coins d’une taille à degrés.' },
    },
    tipOf: { round: 'pointes rondes', eagle: 'pointes d’aigle', tab: 'pointes plates' },
    vTips: { name: 'Griffes en V aux pointes', note: 'Un chevron protège chaque pointe, là où une pierre peut s’ébrécher.' },
    compass: { name: 'Griffes cardinales', note: 'Au nord, au sud, à l’est et à l’ouest plutôt qu’aux coins.' },
    forms: {
      classic: { name: 'Classique', note: 'Arrondi, avec un intérieur confort.' },
      knife: { name: 'Lame de couteau', note: 'Une fine arête qui attrape la lumière.' },
      split: { name: 'Fendu', note: 'Il s’ouvre en deux pour bercer la pierre.' },
      twist: { name: 'Torsade', note: 'Deux brins entrelacés.' },
    },
    bandStones: { none: { name: 'Métal uni', note: 'De l’or ou du platine poli, rien de plus.' }, pave: { name: 'Pavé', note: 'De petits diamants tenus par de minuscules grains de métal.' }, channel: { name: 'Rail', note: 'Des diamants sertis à fleur entre deux parois : doux au toucher.' } },
    coverage: { half: 'À mi-tour', 'three-quarter': 'Aux trois quarts', full: 'Tout le tour' },
    taper: { name: 'Effilé', note: 'L’anneau s’amincit vers la pierre.' },
    heads: { match: 'Comme l’anneau', platinum: 'Griffes en platine', '18k-white': 'Griffes en or blanc' },
    bezelHeads: { match: 'Comme l’anneau', platinum: 'Serti clos en platine', '18k-white': 'Serti clos en or blanc' },
    finishes: { polished: { name: 'Poli miroir', note: 'Un fini miroir.' }, satin: { name: 'Satiné', note: 'Brossé, doucement mat.' }, hammered: { name: 'Martelé', note: 'Facetté à la main, la lumière partout.' } },
    details: {
      hiddenHalo: { name: 'Halo caché', note: 'Des diamants sous la pierre, visibles de profil.' },
      peekaboo: { name: 'Diamants d’accent', note: 'Un diamant de chaque côté de la tête.' },
      surprise: { name: 'Diamant secret', note: 'Un seul diamant à l’intérieur de l’anneau, contre la peau.' },
      milgrain: { name: 'Millegrain', note: 'Une bordure perlée, comme sur les bagues de famille.' },
    },
    fonts: { script: 'Cursive', serif: 'Romaine', block: 'Bâton' },
    title: (stone, carat) => `${stone}, ${carat} ct`,
    grading: (colour, clarity) => `Couleur ${colour} · ${clarity}`,
    withSides: (text) => `avec des ${text.toLowerCase()}`,
    band: (form, stones, width) => `Anneau ${form.toLowerCase()}, ${width} mm${stones ? ` · ${stones.toLowerCase()}` : ''}`,
    claws: (count, tip) => `${count} · ${tip}`,
    bezelHeld: 'Tenue en serti clos',
    twoTone: (band, head) => `Anneau en ${band.toLowerCase()}, ${head.toLowerCase()}`,
    engraved: (text) => `Gravée « ${text} »`,
    total: (ct) => `${ct} ct au total`,
    designed: 'Créée par vous',
    deposit: 'Acompte',
    dueToday: 'À payer aujourd’hui',
    dueTodayPreTax: 'À payer aujourd’hui, avant taxes',
    balance: 'Solde à l’approbation',
    today: 'à payer aujourd’hui',
    todayShare: (share) => ` aujourd’hui, un acompte de ${share}; `,
    onApproval: ' lorsque vous approuvez la version finale de votre création.',
    orderTotal: 'Total de la commande',
  },
)

const ct = (n: number, locale: Locale) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, locale)
const mm = (n: number, locale: Locale) => formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, locale)

/** The stone's name, as a title: "Oval diamond" / "Diamant ovale". */
export function stoneName(d: RingDesign, locale: Locale = getLocale()) {
  const t = pick(RING_COPY, locale)
  return t.stoneTitle(t.shapeOf[d.stone.shape], t.types[d.stone.type].name)
}

/** A design in words: its title ("Oval diamond, 1.82 ct") and the lines a bag, a visit or a share shows under it. */
export function describeDesign(d: RingDesign, locale: Locale = getLocale()): { title: string; lines: string[] } {
  const t = pick(RING_COPY, locale)
  const catalog = catalogFor(locale)
  const layout = layoutOf(d)
  const lines: string[] = []
  lines.push(d.stone.type === 'diamond' ? t.grading(d.stone.colour, d.stone.clarity) : t.grades[d.stone.grade].name)
  const setting = [t.styles[d.setting.style].name, d.setting.style === 'three-stone' ? t.withSides(t.sideStones(t.sides[d.setting.sides])) : '', d.details.hiddenHalo ? t.details.hiddenHalo.name.toLowerCase() : ''].filter(Boolean).join(' · ')
  lines.push(setting)
  lines.push(d.setting.style === 'bezel' ? t.bezelHeld : t.claws(d.prongs.double ? t.double.name : t.counts[d.prongs.count], t.tipOf[d.prongs.tip]))
  lines.push(t.band(t.forms[d.band.form].name, d.band.stones === 'none' ? '' : `${t.bandStones[d.band.stones].name} ${t.coverage[d.band.coverage].toLowerCase()}`, mm(d.band.width, locale)))
  const head = headMetal(d)
  lines.push(head === d.metal.band ? catalog.metal(d.metal.band) : t.twoTone(catalog.metal(d.metal.band), (d.setting.style === 'bezel' ? t.bezelHeads : t.heads)[d.metal.head]))
  if (layout.carats.total > d.stone.carat + 0.005) lines.push(t.total(ct(layout.carats.total, locale)))
  if (d.details.engraving.trim()) lines.push(t.engraved(d.details.engraving.trim()))
  return { title: t.title(stoneName(d, locale), ct(d.stone.carat, locale)), lines }
}
