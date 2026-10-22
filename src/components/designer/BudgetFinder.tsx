import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, Coins, X } from 'lucide-react'
import { formatPrice, toUSD, type Currency } from '../../data/catalog'
import { patch, type DesignPatch, type RingDesign } from '../../data/ring'
import { stonesWithin, type Strategy } from '../../data/ringAdvice'
import { RING_COPY } from '../../data/ringCopy'
import { ringPrice } from '../../data/ringPrice'
import { bilingual, formatNumber, useCopy } from '../../i18n'

const COPY = bilingual(
  {
    open: 'Designing to a budget?',
    label: 'Your budget, before tax',
    find: 'Find the stones',
    clear: 'Clear the budget',
    strategies: { balanced: 'Balanced', larger: 'The larger stone', finer: 'The finer grades' } as Record<Strategy, string>,
    notes: { balanced: 'Bright, clean grades at a good size.', larger: 'The most weight, still eye-clean.', finer: 'Rarer colour and clarity, a little smaller.' } as Record<Strategy, string>,
    use: 'Use this stone',
    none: (price: string) => `With these choices, a ring starts at ${price}. A plainer band or another metal leaves more for the stone.`,
  },
  {
    open: 'Vous avez un budget en tête?',
    label: 'Votre budget, avant taxes',
    find: 'Trouver les pierres',
    clear: 'Effacer le budget',
    strategies: { balanced: 'L’équilibre', larger: 'La plus grande pierre', finer: 'Les plus belles qualités' },
    notes: { balanced: 'Des qualités vives et nettes, à bonne taille.', larger: 'Le plus de poids, toujours net à l’œil.', finer: 'Une couleur et une pureté plus rares, un peu plus petite.' },
    use: 'Choisir cette pierre',
    none: (price) => `Avec ces choix, une bague commence à ${price}. Un anneau plus simple ou un autre métal laisse plus pour la pierre.`,
  },
)

interface Props {
  design: RingDesign
  currency: Currency
  budget: number | null
  onBudget: (budget: number | null) => void
  onApply: (patch: DesignPatch, label: string) => void
}

/** A budget, and the best stone it buys three ways, with the rest of the ring kept as designed. */
export default function BudgetFinder({ design, currency, budget, onBudget, onApply }: Props) {
  const t = useCopy(COPY)
  const r = useCopy(RING_COPY)
  const id = useId()
  const opener = useRef<HTMLButtonElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const moved = useRef(false)
  const [open, setOpen] = useState(budget !== null)
  const [draft, setDraft] = useState(budget ? formatNumber(budget) : '')
  // A budget belongs to its market: in another currency the page leaves it aside, and the field follows.
  useEffect(() => {
    setDraft(budget ? formatNumber(budget) : '')
  }, [budget])
  // Opened or closed by hand, the focus follows: to the field, or back to the button.
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    if (open) field.current?.focus()
    else opener.current?.focus()
  }, [open])
  const rest = JSON.stringify({ ...design, stone: { ...design.stone, carat: 0, colour: 'D', clarity: 'IF', grade: 'fine' } })
  const options = useMemo(() => (budget ? stonesWithin(design, budget, currency) : []), [budget, rest, currency])
  const floor = useMemo(() => ringPrice(patch(design, { stone: { carat: 0.3, colour: 'J', clarity: 'SI2', grade: 'fine' } }), currency), [rest, currency])

  if (!open) {
    return (
      <button ref={opener} type="button" onClick={() => { moved.current = true; setOpen(true) }} className="group flex w-full items-center justify-between gap-4 border border-[var(--border-hairline)] px-5 py-4 text-left transition-colors hover:border-[var(--text-espresso)]">
        <span className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]"><Coins size={15} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {t.open}</span>
        <ArrowRight size={14} strokeWidth={1.4} className="transition-transform duration-500 group-hover:translate-x-1" />
      </button>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(draft.replace(/\D/g, ''))
    onBudget(n > 0 ? n : null)
  }
  const grading = (p: DesignPatch) => (design.stone.type === 'diamond' ? `${p.stone?.colour} / ${p.stone?.clarity}` : r.grades[p.stone!.grade!].name)

  return (
    <div className="@container border border-[var(--border-hairline)] p-5">
      <form onSubmit={submit}>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-[11px] uppercase tracking-[0.22em]">{t.label}</label>
          <button type="button" onClick={() => { onBudget(null); setDraft(''); moved.current = true; setOpen(false) }} aria-label={t.clear} className="-mr-2 p-2 text-[var(--text-taupe)] hover:text-[var(--text-espresso)]"><X size={14} strokeWidth={1.4} /></button>
        </div>
        <div className="mt-3 flex flex-col border border-[var(--border-hairline)] focus-within:border-[var(--text-espresso)] @sm:flex-row">
          <div className="flex min-w-0 flex-1">
            <input ref={field} id={id} inputMode="numeric" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value.replace(/[^\d\s,.]/g, '').slice(0, 9))} placeholder={formatNumber(currency === 'CAD' ? 12000 : toUSD(12000))} className="font-spec min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-[var(--text-taupe)]" />
            <span className="font-spec flex items-center px-3 text-xs text-[var(--text-taupe)]">{currency}</span>
          </div>
          <button type="submit" className="bg-[var(--text-espresso)] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">{t.find}</button>
        </div>
      </form>

      {budget !== null && (
        <div aria-live="polite">
          {options.length > 0 ? (
            <ul className="mt-5 grid gap-2">
              {options.map((o) => (
                <li key={o.strategy} className="flex items-center justify-between gap-4 bg-[var(--bg-silk)]/60 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-spec text-[9px] uppercase tracking-[0.24em] text-[var(--gold-ink)]">{t.strategies[o.strategy]}</p>
                    <p className="mt-1 text-sm"><span className="font-spec">{formatNumber(o.carat, { minimumFractionDigits: 2 })} ct</span> · {grading(o.patch)} · <span className="font-spec">{formatPrice(o.price, currency)}</span></p>
                    <p className="text-xs text-[var(--text-taupe)]">{t.notes[o.strategy]}</p>
                  </div>
                  <button type="button" onClick={() => onApply(o.patch, t.strategies[o.strategy])} className="shrink-0 border-b border-[var(--gold-vermeil)] pb-0.5 text-[10px] font-medium uppercase tracking-[0.18em]">{t.use}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-taupe)]">{t.none(formatPrice(floor, currency))}</p>
          )}
        </div>
      )}
    </div>
  )
}
