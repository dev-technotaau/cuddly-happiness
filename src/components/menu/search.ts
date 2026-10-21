// Client-side search for the menu: accent-insensitive, every word must match, titles and word starts rank first.
// In the theme this maps to Shopify predictive search (`/search/suggest`).

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
