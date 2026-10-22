// Client-side search for the header, the menus and the shop page: accent-insensitive, every word must match, titles and
// word starts rank first. It forgives plurals and a typo, knows a few words the catalog doesn't use ("hoops"), and reads
// a price ("under $2,000") and renting out of a query. In the theme this maps to Shopify predictive search
// (`/search/suggest`), with the synonyms in Search & Discovery.
import type { Category, Product } from '../../data/catalog'
import type { CatalogCopy } from '../../i18n/catalog'

// What each page answers to in search, beyond its own title: both languages, so a search works in either. The `a:`
// entries are actions (the visit drawer, "Ask a jeweller") rather than pages.
export const KEYWORDS: Record<string, string> = {
  'g:atelier': 'atelier workshop bench films video appointment book booking salon visit consultation établi vidéo rendez-vous visite',
  'g:designer': 'design designer configurator custom bespoke build create make your own engagement ring 3d sur mesure créer création concevoir dessiner configurateur bague fiançailles personnalisée',
  'g:giftcards': 'gift card cards voucher present balance carte cadeau cartes-cadeaux solde bon',
  'g:wishlist': 'wishlist favourites favorites saved hearts liste de souhaits favoris coups de cœur',
  'g:account': 'account sign in log in login orders profile wallet mon compte connexion commandes profil portefeuille',
  'g:cart': 'bag cart basket checkout panier paiement caisse',
  'g:home': 'home accueil',
  'a:visit': 'book booking appointment visit visits salon fitting viewing private consultation rendez-vous visite visites privée essayage',
  'a:ask': 'ask contact help question call phone text whatsapp email message jeweller jeweler parler joaillier aide appeler téléphone texto courriel',
}

/** What a signature page answers to: its name in the language on screen, then in the other, then its line. */
export const signatureFields = (mine: { name: string; line: string }, other: { name: string }): [string, number][] => [[mine.name, 10], [other.name, 7], [mine.line, 2]]

/** What a chapter answers to: its name and accent in the language on screen, then in the other, then its description. */
export const chapterFields = (c: Category, mine: CatalogCopy, other: CatalogCopy): [string, number][] => {
  const a = mine.category(c)
  const b = other.category(c)
  return [[a.name, 10], [a.accent, 6], [b.name, 7], [b.accent, 3], [a.description, 2]]
}

/** What a piece answers to: its name in both languages, its collection, its kind ("engagement ring") and chapter, tagline,
 *  metals and badges, then its words. */
export const pieceFields = (p: Product, mine: CatalogCopy, other: CatalogCopy): [string, number][] => {
  const a = mine.product(p)
  const b = other.product(p)
  const c = mine.category(p.category)
  const oc = other.category(p.category)
  const kind = `${mine.type(p.type)} ${other.type(p.type)}`
  const terms = [...p.metals.flatMap((m) => [mine.metal(m), other.metal(m)]), ...(p.badges ?? []).flatMap((x) => [mine.badge(x), other.badge(x)])].join(' ')
  return [[a.name, 10], [b.name, 7], [a.collection, 6], [kind, 5], [`${c.name} ${c.accent} ${oc.name}`, 4], [a.tagline, 3], [terms, 2], [`${a.description} ${a.specs.map((s) => s[1]).join(' ')} ${b.tagline}`, 1]]
}

/** Lower-cases and strips accents one character at a time, so positions in the folded text match the original. The
 *  typographic apostrophe folds to the plain one, so "d'oreilles" finds "d’oreilles". */
export const fold = (s: string) => s.split('').map((ch) => (ch === '’' ? "'" : (ch.normalize('NFD')[0] ?? ch).toLowerCase()[0] ?? ch)).join('')

/** A searchable item with weighted, pre-folded fields; the first field is its title. */
export interface Entry<T> {
  id: string
  item: T
  fields: [string, number][]
}

export const entry = <T>(id: string, item: T, fields: [string, number][]): Entry<T> => ({ id, item, fields: fields.map(([text, weight]) => [fold(text), weight]) })

// Words that carry nothing in a query, in both languages ("a ring for her", "une bague pour elle"). "or" stays: in
// French it is gold.
const FILLER = new Set(['a', 'an', 'the', 'for', 'her', 'him', 'my', 'of', 'in', 'with', 'and', 'to', 'some', 'pour', 'elle', 'lui', 'ma', 'mon', 'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'avec', 'et', 'au', 'aux'])

// Words a visitor may use that the catalog doesn't, and what they mean there.
const SYNONYMS: Record<string, string[]> = {
  hoop: ['huggies'],
  creole: ['huggies', 'anneaux'],
  bangle: ['cuff', 'manchette'],
  choker: ['collar'],
  proposal: ['engagement'],
  propose: ['engagement'],
  demande: ['fiancailles'],
  anniversary: ['eternity'],
  anniversaire: ['eternite'],
  jewelry: ['jewellery'],
  jeweler: ['jeweller'],
  present: ['gift'],
  charm: ['pendant'],
  locket: ['pendant'],
  medaillon: ['pendentif'],
  pink: ['rose'],
  timepiece: ['watch'],
}

/** A word and its singular forms (rings → ring, watches → watch, bijoux → bijou). */
function forms(term: string): string[] {
  const out = [term]
  if (term.length > 3) {
    if (term.endsWith('ies')) out.push(`${term.slice(0, -3)}y`)
    if (term.endsWith('es')) out.push(term.slice(0, -2))
    if (term.endsWith('s') && !term.endsWith('ss')) out.push(term.slice(0, -1))
    if (term.endsWith('x')) out.push(term.slice(0, -1))
  }
  return out
}

/** The forms a word may take in the catalog: itself, its singular, and what it means there ("hoops" → "huggies"). */
function alternates(term: string): string[] {
  const out = forms(term)
  for (const form of [...out]) for (const s of SYNONYMS[form] ?? []) if (!out.includes(s)) out.push(s)
  return out
}

/** The query's words: folded, split at spaces and apostrophes, without stray punctuation, filler or single letters
 *  (unless that is all there is, as while the first letters are typed). */
function terms(query: string): string[] {
  const all = fold(query).split(/[\s'"“”«»,;:!?()]+/).map((w) => w.replace(/^[.-]+|[.-]+$/g, '')).filter(Boolean)
  const kept = all.filter((w) => !FILLER.has(w) && (w.length > 1 || /\d/.test(w)))
  return kept.length ? kept : all
}

const isWordChar = (ch: string) => /[a-z0-9]/.test(ch)

// Inside a word only counts for longer terms, so "rings" does not find earrings.
const MID_WORD = 6

// 3 = starts the text, 2 = starts a word, 1 = inside a word.
function strength(text: string, word: string): number {
  let best = 0
  for (let at = text.indexOf(word); at >= 0 && best < 3; at = text.indexOf(word, at + 1)) {
    best = Math.max(best, at === 0 ? 3 : !isWordChar(text[at - 1]) ? 2 : word.length >= MID_WORD ? 1 : 0)
  }
  return best
}

/** Entries that match every word of the query, best first. A word's other forms count a little less than itself. */
export function rank<T>(entries: Entry<T>[], query: string, limit: number): Entry<T>[] {
  const words = terms(query).map(alternates)
  if (!words.length) return []
  const whole = [fold(query.trim()), words.map((w) => w[0]).join(' ')]
  const scored: [Entry<T>, number][] = []
  for (const e of entries) {
    let score = 0
    for (const forms of words) {
      let best = 0
      forms.forEach((form, i) => {
        for (const [text, weight] of e.fields) best = Math.max(best, strength(text, form) * weight * (i ? 0.8 : 1))
      })
      if (!best) {
        score = 0
        break
      }
      score += best
    }
    if (!score) continue
    if (whole.some((w) => e.fields[0][0].startsWith(w))) score += 25
    scored.push([e, score])
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, limit).map(([e]) => e)
}

/** The character ranges of `text` that match the query's words (or their other forms), merged, for highlighting. */
export function marks(text: string, query: string): [number, number][] {
  const folded = fold(text)
  const found: [number, number][] = []
  for (const term of terms(query)) {
    let hit: [number, number] | null = null
    for (const form of alternates(term)) {
      for (let i = folded.indexOf(form); i >= 0; i = folded.indexOf(form, i + 1)) {
        const start = i === 0 || !isWordChar(folded[i - 1])
        if (start || (!hit && form.length >= MID_WORD)) hit = [i, i + form.length]
        if (start) break
      }
      if (hit) break
    }
    if (hit) found.push(hit)
  }
  found.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [a, b] of found) {
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  return merged
}

/** Every word the catalog and pages use (three letters or more), with the weight of the strongest field it appears in:
 *  what a typo is corrected towards. */
export type Vocabulary = Map<string, number>

export function vocabulary(groups: Entry<unknown>[][]): Vocabulary {
  const words: Vocabulary = new Map()
  for (const entries of groups) {
    for (const e of entries) {
      for (const [text, weight] of e.fields) {
        for (const w of text.split(/[^a-z0-9]+/)) if (w.length > 2 && (words.get(w) ?? 0) < weight) words.set(w, weight)
      }
    }
  }
  return words
}

/** Edits between two words, a swap of neighbours counting as one ("neckalce" → "necklace"). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const known = (term: string, vocab: Vocabulary) => {
  const forms = alternates(term)
  for (const w of vocab.keys()) if (forms.some((f) => w.startsWith(f) || (f.length >= MID_WORD && w.includes(f)))) return true
  return false
}

/** The word a typo most likely meant: one edit away for words of four to six letters, two from seven. Names and kinds
 *  win over words from descriptions. */
function correct(term: string, vocab: Vocabulary): string | null {
  if (term.length < 4 || /\d/.test(term) || known(term, vocab)) return null
  const allowed = term.length >= 7 ? 2 : 1
  let best: { word: string; d: number; whole: number; weight: number } | null = null
  for (const [word, weight] of vocab) {
    if (Math.abs(word.length - term.length) > allowed + 2) continue
    // A word still being typed is compared with the start of the longer word ("emrald" with "emerald"); at equal
    // distance the whole word that is closest wins ("neckalce" is "necklace" before "necklaces").
    const whole = distance(term, word)
    const d = Math.min(whole, word.length > term.length ? distance(term, word.slice(0, term.length)) : Infinity)
    if (d > allowed) continue
    if (!best || d < best.d || (d === best.d && (whole < best.whole || (whole === best.whole && weight > best.weight)))) best = { word, d, whole, weight }
  }
  return best?.word ?? null
}

/** What a query asks for, read out of its words: the words to match, a price range and renting. */
export interface Reading {
  /** The words to match against pieces: no filler, price or renting words, typos corrected. */
  text: string
  /** The same with the renting words kept, for chapters and pages ("rentals" still finds the Rentals chapter). */
  words: string
  /** Typos corrected, as [what was typed, what it became]. */
  fixes: [string, string][]
  /** A price range, in the market's currency. */
  min?: number
  max?: number
  /** The query asked to rent. */
  rent: boolean
  /** The price phrase and the renting words as they were read (folded), so either can be taken out again. */
  priceText: string
  rentText: string
}

// Renting, in both languages. "location" is the French word only: in English it would be the salon's address.
const RENT = ['rent', 'rental', 'rentals', 'renting', 'rented', 'hire', 'borrow', 'borrowed', 'louer', 'loue', 'louee', 'emprunter', 'emprunt']
const RENT_FR = ['location', 'locations']

// An amount: 1000, 1,000, 1 000, 2.5k, $1,000, 1 000 $, 1000 CAD.
const NUM = String.raw`(\d{1,3}(?:[ ,.]\d{3})+|\d+(?:[.,]\d+)?)\s*(k\b)?`
const MONEY = String.raw`(?:\$\s*)?${NUM}\s*(?:\$|cad\b|usd\b|dollars?\b)?`
// Each phrase starts at a word: the query is padded with spaces, and `\s` stands in for a word boundary before it.
const MAX = String.raw`\s(?:under|below|less\s+than|up\s+to|max(?:imum)?|within|cheaper\s+than|<=?|moins\s+de|moins\s+que|sous|jusqu'?\s?a|au\s+plus)`
const MIN = String.raw`\s(?:over|above|more\s+than|at\s+least|min(?:imum)?|>=?|plus\s+de|au\s+moins|a\s+partir\s+de|des)`

const amount = (digits: string, k?: string) => {
  const n = /^\d{1,3}(?:[ ,.]\d{3})+$/.test(digits) ? Number(digits.replace(/[ ,.]/g, '')) : Number(digits.replace(',', '.'))
  return Math.round(k ? n * 1000 : n)
}

/** Reads a query: its price ("under $2,000", "between 1 000 et 5 000 $", "$500"), renting ("to rent", "à louer"), its
 *  filler, and typos, corrected towards the catalog's own words. A bare number stays a word ("Automatic 38", "18k"). */
export function read(query: string, vocab: Vocabulary, lang: 'en' | 'fr'): Reading {
  let s = ` ${fold(query).replace(/[   ]/g, ' ').replace(/[–—]/g, '-')} `
  let min: number | undefined
  let max: number | undefined
  const said: string[] = []
  const take = (re: RegExp, apply: (m: RegExpMatchArray) => boolean) => {
    const m = s.match(re)
    if (!m || !apply(m)) return
    said.push(m[0].trim())
    s = s.replace(m[0], ' ')
  }
  take(new RegExp(String.raw`\s(?:between|entre|from|de)\s+${MONEY}\s+(?:and|et|to|a|-)\s+${MONEY}`), (m) => ((min = amount(m[1], m[2])), (max = amount(m[3], m[4])), true))
  if (min === undefined) {
    // A bare range counts as a price only when it looks like one (a currency, a "k", or hundreds).
    take(new RegExp(String.raw`\s${MONEY}\s*(?:-|to|a)\s*${MONEY}`), (m) => {
      const a = amount(m[1], m[2])
      const b = amount(m[3], m[4])
      if (!/[$k]|cad|usd|dollar/.test(m[0]) && Math.min(a, b) < 100) return false
      min = Math.min(a, b)
      max = Math.max(a, b)
      return true
    })
  }
  if (max === undefined) take(new RegExp(String.raw`${MAX}\s*${MONEY}`), (m) => ((max = amount(m[1], m[2])), true))
  if (min === undefined) take(new RegExp(String.raw`${MIN}\s*${MONEY}`), (m) => ((min = amount(m[1], m[2])), true))
  if (min === undefined && max === undefined) {
    take(new RegExp(String.raw`(?:\$\s*${NUM}|\s${NUM}\s*(?:\$|cad\b|usd\b|dollars?\b))`), (m) => {
      max = amount(m[1] ?? m[3], m[2] ?? m[4])
      return true
    })
  }
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]

  const renting = lang === 'fr' ? [...RENT, ...RENT_FR] : RENT
  const all = terms(s)
  const rentWords = all.filter((w) => renting.includes(w))
  const fixes: [string, string][] = []
  const fixed = (list: string[]) => list.map((w) => {
    const to = renting.includes(w) ? null : correct(w, vocab)
    if (to && !fixes.some((f) => f[0] === w)) fixes.push([w, to])
    return to ?? w
  })
  const words = fixed(all)
  const text = fixed(all.filter((w) => !renting.includes(w)))
  return { text: text.join(' '), words: words.join(' '), fixes, min, max, rent: rentWords.length > 0, priceText: said.join(' '), rentText: rentWords.join(' ') }
}

/** Phrases that complete what is being typed: each of the query's words starts a word of the phrase. Those that begin
 *  with the whole query come first, then the shorter. */
export function complete(query: string, phrases: string[], limit: number): string[] {
  const words = terms(query)
  if (!words.length) return []
  const whole = fold(query.trim())
  const hits: [string, number][] = []
  for (const phrase of phrases) {
    const folded = fold(phrase)
    if (folded === whole) continue
    const starts = folded.split(/[^a-z0-9]+/)
    if (!words.every((w) => starts.some((s) => s.startsWith(w)))) continue
    hits.push([phrase, (folded.startsWith(whole) ? 0 : 100) + phrase.length])
  }
  return hits.sort((a, b) => a[1] - b[1]).slice(0, limit).map(([p]) => p)
}

/** A word in the singular, by the plural it most likely has: watches, bagues, huggies, bijoux. */
const singular = (w: string) => (w.length < 4 ? w : w.endsWith('ies') ? `${w.slice(0, -3)}y` : /(ch|sh|ss|x|z)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) ? w.slice(0, -1) : w.endsWith('x') ? w.slice(0, -1) : w)

/** A query reduced to its words in the singular, for comparing it with a title ("Engagement ring" is "engagement rings"). */
export const keyOf = (s: string) => terms(s).map(singular).join(' ')
