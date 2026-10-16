import { lazy, Suspense, useRef, useState, type ComponentType } from 'react'
import { Share } from 'lucide-react'
import type { ShareSubject } from './ShareSheet'

const ShareSheet = lazy(() => import('./ShareSheet'))

interface Props {
  subject: ShareSubject
  /** Open straight into "Drop a hint" (falls back to sharing when the subject has no hint). */
  mode?: 'share' | 'hint'
  label?: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  variant?: 'link' | 'outline'
  className?: string
}

/** Opens the share sheet, loading it on first use, and hands focus back here when it closes. */
export default function ShareButton({ subject, mode = 'share', label = 'Share', icon: Icon = Share, variant = 'link', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const styles =
    variant === 'outline'
      ? 'flex items-center gap-2 border border-[var(--border-hairline)] px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-[var(--text-espresso)]'
      : 'group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]'

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`${styles} focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[var(--text-espresso)] ${className}`}
      >
        <Icon size={14} strokeWidth={1.4} />
        <span className={variant === 'link' ? 'border-b border-transparent pb-0.5 transition-colors group-hover:border-[var(--gold-vermeil)]' : ''}>{label}</span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <ShareSheet
            subject={subject}
            initialMode={mode}
            onClose={() => {
              setOpen(false)
              trigger.current?.focus()
            }}
          />
        </Suspense>
      )}
    </>
  )
}
