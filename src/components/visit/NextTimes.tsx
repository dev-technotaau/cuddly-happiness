import { useMemo } from 'react'
import { formatDay, parseIso } from '../../data/catalog'
import { formatTime, nextFree, type VisitPiece, type VisitPurpose } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { useStore } from '../../store'

const COPY = bilingual({ next: 'Next free times in the salon' }, { next: 'Prochaines disponibilités au salon' })

interface Props {
  purpose?: VisitPurpose
  pieces?: VisitPiece[]
  count?: number
  tone?: 'light' | 'dark'
  className?: string
}

/** The next free times in the salon, as chips: each opens the booking at that time, with the pieces attached. */
export default function NextTimes({ purpose, pieces, count = 3, tone = 'light', className = '' }: Props) {
  const { openVisit } = useStore()
  const t = useCopy(COPY)
  const times = useMemo(() => nextFree(count, purpose ?? 'other'), [count, purpose])
  if (!times.length) return null
  const dark = tone === 'dark'
  return (
    <div className={className}>
      <p className={`font-spec text-[10px] uppercase tracking-[0.26em] ${dark ? 'text-white/55' : 'text-[var(--text-taupe)]'}`}>{t.next}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {times.map(({ date, time }) => (
          <button key={date + time} type="button" onClick={() => openVisit({ purpose, pieces, mode: 'salon', date, time })} className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${dark ? 'border-white/20 hover:border-[var(--gold-champagne)] hover:text-[var(--gold-champagne)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
            <span className="inline-block first-letter:uppercase">{formatDay(parseIso(date), { weekday: 'short', day: 'numeric', month: 'short' })}</span> · <span className="font-spec">{formatTime(time)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
