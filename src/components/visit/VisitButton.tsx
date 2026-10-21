import type { ReactNode } from 'react'
import { CalendarHeart } from 'lucide-react'
import type { VisitRequest } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { useStore } from '../../store'
import { btnVisit, btnVisitOnDark } from '../ui'

const COPY = bilingual({ book: 'Book a visit' }, { book: 'Prendre rendez-vous' })

interface Props {
  request?: VisitRequest
  /** The words on the button; "Book a visit" by default, the same verb everywhere. */
  children?: ReactNode
  tone?: 'light' | 'dark'
  /** `button` is the outlined pair of a primary action; `link` is a quiet underlined line. */
  variant?: 'button' | 'link'
  /** Runs before the drawer opens (an overlay closing first, for one). */
  onBefore?: () => void
  className?: string
}

/** "Book a visit": opens the booking drawer with what it knows (the reason, the pieces, a time). */
export default function VisitButton({ request, children, tone = 'light', variant = 'button', onBefore, className = '' }: Props) {
  const { openVisit } = useStore()
  const t = useCopy(COPY)
  const open = () => {
    onBefore?.()
    openVisit(request)
  }
  if (variant === 'link') {
    return (
      <button type="button" onClick={open} className={`link-line ${tone === 'dark' ? 'text-[var(--bg-travertine)]' : ''} ${className}`}>
        {children ?? t.book}
      </button>
    )
  }
  return (
    <button type="button" onClick={open} className={`${tone === 'dark' ? btnVisitOnDark : btnVisit} ${className}`}>
      <CalendarHeart size={15} strokeWidth={1.3} /> {children ?? t.book}
    </button>
  )
}
