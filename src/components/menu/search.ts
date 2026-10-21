// Client-side search for the menus (the desktop menu and, on phones, the mobile menu): accent-insensitive, every word
// must match, titles and word starts rank first. In the theme this maps to Shopify predictive search (`/search/suggest`).
import type { Category, Product } from '../../data/catalog'
import type { CatalogCopy } from '../../i18n/catalog'

// What each page answers to in search, beyond its own title: both languages, so a search works in either.
export const KEYWORDS: Record<string, string> = {
  'g:atelier': 'atelier workshop bench films video appointment book booking salon visit consultation établi vidéo rendez-vous visite',
  'g:giftcards': 'gift card cards voucher present balance carte cadeau cartes-cadeaux solde bon',
  'g:wishlist': 'wishlist favourites favorites saved hearts liste de souhaits favoris coups de cœur',
  'g:account': 'account sign in log in login orders profile wallet mon compte connexion commandes profil portefeuille',
  'g:cart': 'bag cart basket checkout panier paiement caisse',
  'g:home': 'home accueil',
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

/** Lower-cases and strips accents one character at a time, so positions in the folded text match the original. */
export const fold = (s: string) => s.split('').map((ch) => (ch.normalize('NFD')[0] ?? ch).toLowerCase()[0] ?? ch).join('')

/** A searchable item with weighted, pre-folded fields; the first field is its title. */
export interface Entry<T> {
  id: string
  item: T
  fields: [string, number][]
}

export const entry = <T>(id: string, item: T, fields: [string, number][]): Entry<T> => ({ id, item, fields: fields.map(([text, weight]) => [fold(text), weight]) })

const words = (query: string) => fold(query).split(/\s+/).filter(Boolean)
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

/** Entries that match every word of the query, best first. */
export function rank<T>(entries: Entry<T>[], query: string, limit: number): Entry<T>[] {
  const terms = words(query)
  if (!terms.length) return []
  const whole = fold(query.trim())
  const scored: [Entry<T>, number][] = []
  for (const e of entries) {
    let score = 0
    for (const term of terms) {
      const best = Math.max(...e.fields.map(([text, weight]) => strength(text, term) * weight))
      if (!best) {
        score = 0
        break
      }
      score += best
    }
    if (!score) continue
    if (e.fields[0][0].startsWith(whole)) score += 25
    scored.push([e, score])
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, limit).map(([e]) => e)
}

/** The character ranges of `text` that match the query's words, merged, for highlighting. */
export function marks(text: string, query: string): [number, number][] {
  const folded = fold(text)
  const found: [number, number][] = []
  for (const term of words(query)) {
    let at = -1
    for (let i = folded.indexOf(term); i >= 0; i = folded.indexOf(term, i + 1)) {
      if (i === 0 || !isWordChar(folded[i - 1])) {
        at = i
        break
      }
      if (at < 0 && term.length >= MID_WORD) at = i
    }
    if (at >= 0) found.push([at, at + term.length])
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
