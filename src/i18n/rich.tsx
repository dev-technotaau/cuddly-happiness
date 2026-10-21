import type { ReactNode } from 'react'

/** Copy with its gold italic accent: each `<em>…</em>` in the string renders as an <em> with `emClass` (or styled by
 *  its parent, as `[&_em]:…`). Translations keep their own accent word, so a French headline stresses its own word. */
export function rich(text: string, emClass?: string): ReactNode {
  const parts = text.split(/<em>(.*?)<\/em>/)
  if (parts.length === 1) return text
  return parts.map((part, i) => (i % 2 ? <em key={i} className={emClass}>{part}</em> : part))
}

/** The accent word of a string, without the markup (`Your <em>Bag</em>` → `Bag`). */
export const accentOf = (text: string) => text.match(/<em>(.*?)<\/em>/)?.[1] ?? ''

/** The string without its accent markup, for titles, labels and alt text. */
export const plain = (text: string) => text.replace(/<\/?em>/g, '')
