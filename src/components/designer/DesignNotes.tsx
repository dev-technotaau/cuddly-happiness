import { ArrowRight, Check, Coins, Lightbulb, ShieldCheck } from 'lucide-react'
import type { DesignPatch } from '../../data/ring'
import type { Note, NoteTone } from '../../data/ringAdvice'
import { bilingual, useCopy } from '../../i18n'

const ICONS: Record<NoteTone, typeof Check> = { care: ShieldCheck, tip: Lightbulb, value: Coins, good: Check }

const COPY = bilingual(
  {
    tones: { care: 'To protect it', tip: 'A suggestion', value: 'Where value hides', good: 'Well chosen' } as Record<NoteTone, string>,
  },
  {
    tones: { care: 'Pour la protéger', tip: 'Une suggestion', value: 'Là où se cache la valeur', good: 'Bien choisi' },
  },
)

interface Props {
  notes: Note[]
  onFix: (patch: DesignPatch, label: string) => void
  className?: string
}

/** The atelier's notes on the choices of a step: what protects the stone, a better option, where value hides, a choice
 *  well made. A note with a remedy offers it in one tap. Nothing renders when there is nothing to say. */
export default function DesignNotes({ notes, onFix, className = '' }: Props) {
  const t = useCopy(COPY)
  if (notes.length === 0) return null
  return (
    <ul className={`space-y-2 ${className}`}>
      {notes.map((n) => {
        const Icon = ICONS[n.tone]
        return (
          <li key={n.id} className={`flex gap-4 border-l px-4 py-3.5 ${n.tone === 'care' ? 'border-[var(--gold-vermeil)] bg-[var(--bg-silk)]' : 'border-[var(--border-hairline)] bg-[var(--bg-silk)]/50'}`}>
            <Icon size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" aria-hidden />
            <div className="min-w-0">
              <p className="font-spec text-[9px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{t.tones[n.tone]}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-espresso)]">{n.text}</p>
              {n.fix && (
                <button type="button" onClick={() => onFix(n.fix!.patch, n.fix!.label)} className="group mt-2.5 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-espresso)]">
                  <span className="border-b border-[var(--gold-vermeil)] pb-0.5">{n.fix.label}</span>
                  <ArrowRight size={12} strokeWidth={1.4} className="transition-transform duration-500 group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
