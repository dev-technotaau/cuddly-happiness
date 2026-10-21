import { marks } from './search'

/** `text` with the query's words underlined in gold, as the menus' search results show it. */
export default function Marked({ text, query }: { text: string; query: string }) {
  const parts: React.ReactNode[] = []
  let from = 0
  for (const [a, b] of marks(text, query)) {
    if (a > from) parts.push(text.slice(from, a))
    parts.push(<mark key={a} className="bg-transparent text-inherit underline decoration-[var(--gold-vermeil)] decoration-1 underline-offset-[3px]">{text.slice(a, b)}</mark>)
    from = b
  }
  parts.push(text.slice(from))
  return <>{parts}</>
}
