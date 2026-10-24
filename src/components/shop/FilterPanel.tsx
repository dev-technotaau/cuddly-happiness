import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import { METALS, type Currency, type Metal } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { getLenis } from '../SmoothScroll'
import { btnPrimary } from '../ui'
import { FACETS, activeCount, isSignature, optionsOf, type FacetId, type Outcome, type Selection } from './filters'
import PriceRange from './PriceRange'
import useShopCopy from './useShopCopy'

const COPY = bilingual(
  {
    label: 'Filter the pieces',
    title: 'Filter',
    close: 'Close the filters',
    clear: 'Clear all',
    show: (n: number) => (n === 0 ? 'No piece matches' : `Show ${n} piece${n === 1 ? '' : 's'}`),
    toOwn: (currency: string) => `To own, in ${currency}`,
    aWeekend: (currency: string) => `A weekend, in ${currency}`,
    signature: 'Signature',
    selected: (n: number) => `${n} chosen`,
  },
  {
    label: 'Filtrer les pièces',
    title: 'Filtrer',
    close: 'Fermer les filtres',
    clear: 'Tout effacer',
    show: (n) => (n === 0 ? 'Aucune pièce ne correspond' : `Voir ${n} pièce${n < 2 ? '' : 's'}`),
    toOwn: (currency) => `À l’achat, en ${currency}`,
    aWeekend: (currency) => `La fin de semaine, en ${currency}`,
    signature: 'Signature',
    selected: (n) => `${n} choisi${n < 2 ? '' : 's'}`,
  },
)

// Round-figure bands per market, the price section's shortcuts.
const BANDS: Record<Currency, [number | undefined, number | undefined][]> = {
  CAD: [[undefined, 1000], [1000, 5000], [5000, 20000], [20000, undefined]],
  USD: [[undefined, 750], [750, 4000], [4000, 15000], [15000, undefined]],
}

type Section = FacetId | 'price'

interface Props {
  open: boolean
  onClose: () => void
  /** The section to open on (a toolbar shortcut), or null for the usual ones. */
  focus: Section | null
  selection: Selection
  outcome: Outcome
  currency: Currency
  /** Whether the visitor has pieces of their own (saved or viewed), for the "Your pieces" section. */
  hasOwn: boolean
  onChange: (next: Selection) => void
  onClear: () => void
  /** The search within the shop, shown here on phones and tablets (the toolbar holds it on a desktop). */
  search?: ReactNode
}

/** Every filter, in a side panel (full width on phones): chapters, types (the signatures first), metals with their
 *  colours, the price on a slider with its histogram and round-figure bands, stones, shapes, availability, highlights,
 *  services and the visitor's own pieces. Each value says how many pieces it gives with the other choices kept; one
 *  that would give none is disabled, or left out of the long lists. The grid follows each choice at once; the button
 *  at the foot closes the panel on the count. */
export default function FilterPanel({ open, onClose, focus, selection: s, outcome, currency, hasOwn, onChange, onClear, search }: Props) {
  const t = useCopy(COPY)
  const shop = useShopCopy()
  const closeBtn = useRef<HTMLButtonElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<Set<Section>>(new Set())
  const n = outcome.shown.length

  // Opened, the panel unfolds the sections in use (and the one asked for), or the three most used.
  useEffect(() => {
    if (!open) return
    const used = new Set<Section>([...FACETS.filter((id) => s.facets[id].length), ...(s.min !== undefined || s.max !== undefined ? ['price' as const] : [])])
    if (focus) used.add(focus)
    setExpanded(used.size ? used : new Set<Section>(['chapter', 'metal', 'price']))
    const at = focus ? window.setTimeout(() => body.current?.querySelector(`[data-section="${focus}"]`)?.scrollIntoView({ block: 'nearest' }), 80) : 0
    return () => window.clearTimeout(at)
    // Only on opening: later choices keep the sections as the visitor left them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focus])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusIn = window.setTimeout(() => closeBtn.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onClose)
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
      window.clearTimeout(focusIn)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onClose)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open, onClose])

  const toggle = (id: FacetId, value: string) => {
    const on = s.facets[id].includes(value)
    const facets = { ...s.facets, [id]: on ? s.facets[id].filter((v) => v !== value) : [...s.facets[id], value] }
    const next = { ...s, facets, page: 1 }
    // Renting changes what a price means (a weekend rate, not the price to own), so a range set before it lets go.
    const renting = (sel: Selection) => sel.facets.how.length === 1 && sel.facets.how[0] === 'rent'
    onChange(renting(next) !== renting(s) ? { ...next, min: undefined, max: undefined } : next)
  }
  const flip = (id: Section) => setExpanded((e) => {
    const next = new Set(e)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const sections: Section[] = ['chapter', 'type', 'metal', 'price', 'stone', 'shape', 'how', 'tag', 'svc', ...(hasOwn ? ['own' as const] : [])]
  const title = (id: Section) => (id === 'price' ? shop.t.price : shop.t.facets[id])
  const summary = (id: Section) => {
    if (id === 'price') return s.min !== undefined || s.max !== undefined ? shop.range(currency, s.min, s.max) : ''
    const chosen = s.facets[id]
    return chosen.length === 1 ? shop.option(id, chosen[0]) : chosen.length ? t.selected(chosen.length) : ''
  }
  const row = (on: boolean) => `group flex w-full items-center gap-3 py-2.5 text-left text-[15px] transition-colors disabled:cursor-default disabled:text-[var(--text-taupe)]/60 ${on ? 'text-[var(--text-espresso)]' : 'text-[var(--text-espresso)]/85 hover:text-[var(--text-espresso)]'}`
  const box = (on: boolean) => `flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-300 ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--text-taupe)] group-hover:border-[var(--text-espresso)] group-disabled:border-[var(--border-hairline)]'}`

  const options = (id: FacetId) => {
    const all = optionsOf(id)
    const counts = outcome.counts[id]
    // Long lists leave out what would give nothing; short ones keep it, disabled, so they never jump about.
    const list = all.length > 9 ? all.filter((v) => counts[v] > 0 || s.facets[id].includes(v)) : all
    return (
      <div role="group" aria-labelledby={`facet-${id}`} className="pb-5 pt-1">
        {list.map((v, i) => {
          const on = s.facets[id].includes(v)
          const count = counts[v] ?? 0
          const divide = id === 'type' && i > 0 && isSignature(list[i - 1]) && !isSignature(v)
          return (
            <div key={v} className={divide ? 'mt-2 border-t border-[var(--border-hairline)] pt-2' : ''}>
              <button type="button" aria-pressed={on} disabled={!count && !on} onClick={() => toggle(id, v)} className={row(on)}>
                <span aria-hidden="true" className={box(on)}>{on && <Check size={11} strokeWidth={2} />}</span>
                {id === 'metal' && <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-[var(--border-hairline)]" style={{ background: METALS[v as Metal].swatch }} />}
                <span className="min-w-0 flex-1">
                  {shop.option(id, v)}
                  {id === 'type' && isSignature(v) && <span className="font-spec ml-2 text-[9px] uppercase tracking-[0.2em] text-[var(--gold-ink)]">✦ {t.signature}</span>}
                </span>
                <span className="font-spec text-[11px] text-[var(--text-taupe)]">{count}</span>
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const price = (
    <div className="pb-6 pt-1">
      <p className="font-spec mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{outcome.renting ? t.aWeekend(currency) : t.toOwn(currency)}</p>
      <PriceRange stops={outcome.scale} histogram={outcome.histogram} min={s.min} max={s.max} currency={currency} onChange={(min, max) => onChange({ ...s, min, max, page: 1 })} />
      {!outcome.renting && (
        <div role="group" aria-label={shop.t.price} className="mt-5 flex flex-wrap gap-2">
          {BANDS[currency].filter(([a, b]) => (a === undefined || outcome.scale.includes(a)) && (b === undefined || outcome.scale.includes(b))).map(([a, b]) => {
            const on = s.min === a && s.max === b
            return <button key={`${a}-${b}`} type="button" aria-pressed={on} onClick={() => onChange({ ...s, min: on ? undefined : a, max: on ? undefined : b, page: 1 })} className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>{shop.range(currency, a, b)}</button>
          })}
        </div>
      )}
    </div>
  )

  const count = activeCount(s)
  return createPortal(
    <>
      <div onClick={onClose} aria-hidden className={`fixed inset-0 z-[80] bg-[var(--bg-vault)]/45 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label={t.label} aria-hidden={!open} inert={!open} className={`fixed right-0 top-0 z-[90] flex h-full w-full max-w-[440px] flex-col bg-[var(--bg-travertine)] shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-[transform,visibility] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'visible translate-x-0' : 'invisible translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-6 py-5 sm:px-8">
          <p className="font-serif-editorial text-3xl font-light">
            {t.title}
            {count > 0 && <span className="font-spec ml-3 align-middle text-[11px] text-[var(--text-taupe)]">({count})</span>}
          </p>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label={t.close} className="-mr-2 flex h-11 w-11 items-center justify-center transition-colors hover:text-[var(--gold-vermeil)]"><X size={20} strokeWidth={1.3} /></button>
        </div>

        <div ref={body} className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8" data-lenis-prevent>
          {search && <div className="border-b border-[var(--border-hairline)] py-5 lg:hidden">{search}</div>}
          {sections.map((id) => {
            const on = expanded.has(id)
            const sum = summary(id)
            return (
              <section key={id} data-section={id} className="scroll-mt-2 border-b border-[var(--border-hairline)]">
                <h3>
                  <button type="button" id={`facet-${id}`} aria-expanded={on} aria-controls={`panel-${id}`} onClick={() => flip(id)} className="flex w-full items-center gap-4 py-5 text-left">
                    <span className="text-[11px] font-medium uppercase tracking-[0.22em]">{title(id)}</span>
                    <span className="min-w-0 flex-1 truncate text-right text-[13px] text-[var(--text-taupe)]">{!on && sum}</span>
                    <ChevronDown size={16} strokeWidth={1.3} className={`shrink-0 transition-transform duration-500 ${on ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div id={`panel-${id}`} hidden={!on}>{id === 'price' ? price : options(id)}</div>
              </section>
            )
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--border-hairline)] px-6 py-5 sm:px-8">
          <button type="button" onClick={onClear} disabled={!count && !s.q} className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 transition-colors hover:text-[var(--text-espresso)] hover:underline disabled:opacity-40 disabled:hover:no-underline">{t.clear}</button>
          <button type="button" onClick={onClose} className={`${btnPrimary} flex-1`} aria-live="polite">{t.show(n)}</button>
        </div>
      </aside>
    </>,
    document.body,
  )
}
