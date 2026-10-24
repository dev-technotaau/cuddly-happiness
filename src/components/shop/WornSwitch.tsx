import { bilingual, useCopy } from '../../i18n'

const COPY = bilingual(
  { worn: 'Worn', label: 'Show each piece as worn' },
  { worn: 'Portées', label: 'Voir chaque pièce portée' },
)

/** The switch between the pieces on their own and as worn (each one's second photograph), with its word beside it. */
export default function WornSwitch({ on, onChange, className = '' }: { on: boolean; onChange: (on: boolean) => void; className?: string }) {
  const t = useCopy(COPY)
  return (
    <button type="button" aria-pressed={on} aria-label={t.label} onClick={() => onChange(!on)} className={`group flex h-11 shrink-0 items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] ${className}`}>
      <span aria-hidden="true" className={`relative h-[18px] w-8 rounded-full border transition-colors duration-500 ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)]' : 'border-[var(--text-taupe)] group-hover:border-[var(--text-espresso)]'}`}>
        <span className={`absolute left-[2px] top-[2px] h-3 w-3 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? 'translate-x-[14px] bg-[var(--bg-travertine)]' : 'bg-[var(--text-taupe)] group-hover:bg-[var(--text-espresso)]'}`} />
      </span>
      <span aria-hidden="true">{t.worn}</span>
    </button>
  )
}
