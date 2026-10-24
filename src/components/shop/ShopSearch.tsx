import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { bilingual, useCopy } from '../../i18n'
import { useStore } from '../../store'

const COPY = bilingual(
  { label: 'Search the pieces', clear: 'Clear the search' },
  { label: 'Chercher parmi les pièces', clear: 'Effacer la recherche' },
)

/** The search within Shop all: the header's own reading of a query (typos, both languages, "under 2000", "to rent"),
 *  narrowing the pieces as the visitor types, a moment after they pause. Enter searches at once and keeps the query
 *  among the recent searches; Escape clears it. */
export default function ShopSearch({ value, onCommit, className = '' }: { value: string; onCommit: (q: string) => void; className?: string }) {
  const { rememberSearch } = useStore()
  const t = useCopy(COPY)
  const [draft, setDraft] = useState(value)
  const sent = useRef(value)
  const timer = useRef(0)

  // A search changed elsewhere (a chip taken out, "Clear all") shows here.
  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value
      setDraft(value)
    }
  }, [value])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const send = (q: string) => {
    window.clearTimeout(timer.current)
    if (q === sent.current) return
    sent.current = q
    onCommit(q)
  }

  return (
    <label className={`group flex items-center gap-3 border-b border-[var(--border-hairline)] transition-colors focus-within:border-[var(--text-espresso)] ${className}`}>
      <Search size={15} strokeWidth={1.4} className="shrink-0 text-[var(--text-taupe)] transition-colors group-focus-within:text-[var(--text-espresso)]" />
      <input
        type="search"
        value={draft}
        onChange={(e) => {
          const q = e.target.value.slice(0, 80)
          setDraft(q)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => send(q.trim()), 280)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            send(draft.trim())
            if (draft.trim()) rememberSearch(draft.trim())
          }
          if (e.key === 'Escape' && draft) {
            e.stopPropagation()
            setDraft('')
            send('')
          }
        }}
        placeholder={t.label}
        aria-label={t.label}
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-[var(--text-taupe)] [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button type="button" onClick={() => { setDraft(''); send('') }} aria-label={t.clear} className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]">
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
    </label>
  )
}
