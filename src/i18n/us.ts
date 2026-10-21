// US English is derived from the Canadian English the copy is written in: the same words, spelled the American way.
// Only whole words from this list change, so proper names (Montréal, rue Sherbrooke Ouest) are never touched.

const WORDS: Record<string, string> = {
  jewellery: 'jewelry',
  jeweller: 'jeweler',
  jewellers: 'jewelers',
  jewelled: 'jeweled',
  centre: 'center',
  centres: 'centers',
  centred: 'centered',
  metre: 'meter',
  metres: 'meters',
  millimetre: 'millimeter',
  millimetres: 'millimeters',
  centimetre: 'centimeter',
  centimetres: 'centimeters',
  colour: 'color',
  colours: 'colors',
  coloured: 'colored',
  colourless: 'colorless',
  favour: 'favor',
  favourite: 'favorite',
  favourites: 'favorites',
  honour: 'honor',
  honoured: 'honored',
  labour: 'labor',
  harbour: 'harbor',
  neighbourhood: 'neighborhood',
  neighbourhoods: 'neighborhoods',
  savour: 'savor',
  splendour: 'splendor',
  glamour: 'glamor',
  behaviour: 'behavior',
  lustre: 'luster',
  theatre: 'theater',
  sombre: 'somber',
  calibre: 'caliber',
  catalogue: 'catalog',
  grey: 'gray',
  cheque: 'check',
  cheques: 'checks',
  cancelled: 'canceled',
  cancelling: 'canceling',
  travelling: 'traveling',
  travelled: 'traveled',
  traveller: 'traveler',
  modelled: 'modeled',
  modelling: 'modeling',
  instalment: 'installment',
  instalments: 'installments',
  enrol: 'enroll',
  fulfil: 'fulfill',
  ageing: 'aging',
  judgement: 'judgment',
  mould: 'mold',
  programme: 'program',
  licence: 'license',
  itemised: 'itemized',
  personalise: 'personalize',
  personalised: 'personalized',
  prioritise: 'prioritize',
  authorised: 'authorized',
  authorisation: 'authorization',
  organise: 'organize',
  recognise: 'recognize',
  realise: 'realize',
  customise: 'customize',
  apologise: 'apologize',
}

const PATTERN = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi')

/** One string in US spelling, keeping each word's capitalisation (Jewellery → Jewelry). */
export function toUS(text: string): string {
  return text.replace(PATTERN, (word) => {
    const us = WORDS[word.toLowerCase()]
    if (word === word.toUpperCase() && word.length > 1) return us.toUpperCase()
    return word[0] === word[0].toUpperCase() ? us[0].toUpperCase() + us.slice(1) : us
  })
}

/** A whole copy object in US spelling: strings, arrays, nested objects, and the strings that copy functions return. */
export function americanize<T>(value: T): T {
  if (typeof value === 'string') return toUS(value) as T
  if (typeof value === 'function') {
    const fn = value as unknown as (...args: unknown[]) => unknown
    return ((...args: unknown[]) => americanize(fn(...args))) as T
  }
  if (Array.isArray(value)) return value.map((v) => americanize(v)) as T
  // React elements and other non-plain objects pass through untouched.
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = americanize(v)
    return out as T
  }
  return value
}
