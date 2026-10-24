import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Columns2, Columns3, Columns4, RectangleVertical, SlidersHorizontal } from 'lucide-react'
import { bilingual, useCopy } from '../../i18n'
import { SORTS, type FacetId, type Sort, type View } from './filters'
import useShopCopy from './useShopCopy'
import WornSwitch from './WornSwitch'

const COPY = bilingual(
  {
    filter: 'Filter',
    filterCount: (n: number) => `Filter, ${n} chosen`,
    shortcuts: 'Filter by',
    sort: 'Sort',
    sortBy: 'Sort by',
    view: 'View',
    one: 'One piece a row',
  },
  {
    filter: 'Filtrer',
    filterCount: (n) => `Filtrer, ${n} choisi${n < 2 ? '' : 's'}`,
    shortcuts: 'Filtrer par',
    sort: 'Trier',
    sortBy: 'Trier par',
    view: 'Affichage',
    one: 'Une pièce par rangée',
  },
)

type Section = FacetId | 'price'

/** The sort, as a button and its list: arrows move, Enter or Space chooses, Escape or Tab closes. */
function SortMenu({ sort, searching, onSort }: { sort: Sort; searching: boolean; onSort: (s: Sort) => void }) {
  const t = useCopy(COPY)
  const shop = useShopCopy()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const label = (s: Sort) => (s === 'recommended' && searching ? shop.t.bestMatch : shop.t.sorts[s])

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, SORTS.indexOf(sort)))
    const raf = requestAnimationFrame(() => list.current?.focus())
    const away = (e: PointerEvent) => {
      if (!list.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerdown', away)
    }
  }, [open, sort])

  const choose = (s: Sort) => {
    setOpen(false)
    button.current?.focus()
    if (s !== sort) onSort(s)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + SORTS.length) % SORTS.length)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : SORTS.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(SORTS[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      button.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div className="relative min-w-0">
      <button ref={button} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} onClick={() => setOpen((o) => !o)} onKeyDown={(e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp') && (e.preventDefault(), setOpen(true))} className="flex h-11 max-w-full items-center gap-2 text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-[var(--gold-vermeil)]">
        <span className="shrink-0 text-[var(--text-taupe)] max-sm:hidden">{t.sort}</span>
        <span className="min-w-0 truncate">{label(sort)}</span>
        <ChevronDown size={14} strokeWidth={1.4} className={`shrink-0 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={t.sortBy}
          aria-activedescendant={`${id}-${SORTS[active]}`}
          onKeyDown={onKey}
          className="absolute right-0 top-full z-10 mt-1 w-64 border border-[var(--border-hairline)] bg-[var(--bg-travertine)] py-2 shadow-[0_24px_48px_-24px_rgba(40,30,20,0.3)] outline-none motion-safe:animate-[fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)] max-sm:-right-2"
        >
          {SORTS.map((s, i) => (
            <li key={s} id={`${id}-${s}`} role="option" aria-selected={s === sort} onClick={() => choose(s)} onPointerEnter={() => setActive(i)} className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-2.5 text-sm transition-colors ${i === active ? 'bg-[var(--bg-silk)]' : ''}`}>
              {label(s)}
              {s === sort && <Check size={14} strokeWidth={1.6} className="text-[var(--gold-vermeil)]" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Props {
  view: View
  sort: Sort
  worn: boolean
  count: number
  /** How many choices narrow the pieces, and how many per section (for the shortcuts). */
  filters: number
  chosen: Partial<Record<Section, number>>
  searching: boolean
  /** The panel is open: its own count speaks, so this one stays quiet. */
  panelOpen: boolean
  onOpen: (focus: Section | null) => void
  onSort: (s: Sort) => void
  onView: (v: View) => void
  onWorn: (on: boolean) => void
  /** The search field (shown here from 1024 px). */
  search: ReactNode
}

/** The shop's bar, pinned under the header: the filters (with shortcuts to the most used from 1440 px), the
 *  search, the count, the sort, how many pieces a row and the worn photographs. It takes a soft edge once pinned. */
export default function ShopToolbar({ view, sort, worn, count, filters, chosen, searching, panelOpen, onOpen, onSort, onView, onWorn, search }: Props) {
  const t = useCopy(COPY)
  const shop = useShopCopy()
  const sentinel = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 120), { rootMargin: '-112px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const views: [View, typeof Columns2, string][] = [['large', Columns2, 'max-lg:hidden'], ['grid', Columns3, 'max-lg:hidden'], ['compact', Columns4, 'max-lg:hidden']]
  const seg = (on: boolean) => `flex h-9 w-9 items-center justify-center transition-colors duration-300 ${on ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`
  // Phones and tablets choose between one piece a row and two (compact); "large" reads as one there.
  const phoneOne = view !== 'compact'

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div className={`sticky top-[111px] z-20 border-b bg-[var(--bg-travertine)]/95 backdrop-blur-md transition-[border-color,box-shadow] duration-500 ${stuck ? 'border-[var(--border-hairline)] shadow-[0_18px_36px_-30px_rgba(40,30,20,0.45)]' : 'border-transparent'}`}>
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-6 py-2 sm:gap-4 lg:gap-5 lg:px-12">
          <button type="button" onClick={() => onOpen(null)} aria-haspopup="dialog" aria-label={filters ? t.filterCount(filters) : undefined} className="flex h-11 shrink-0 items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors hover:text-[var(--gold-vermeil)]">
            <SlidersHorizontal size={15} strokeWidth={1.3} /> {t.filter}
            {filters > 0 && <span className="font-spec flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-espresso)] px-1.5 text-[10px] text-[var(--bg-travertine)]">{filters}</span>}
          </button>

          <div role="group" aria-label={t.shortcuts} className="hidden items-center gap-1 border-l border-[var(--border-hairline)] pl-4 min-[1440px]:flex">
            {(['chapter', 'type', 'metal', 'price', 'stone'] as Section[]).map((id) => (
              <button key={id} type="button" aria-haspopup="dialog" onClick={() => onOpen(id)} className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors duration-300 ${chosen[id] ? 'bg-[var(--bg-silk)] text-[var(--text-espresso)]' : 'text-[var(--text-taupe)] hover:bg-[var(--bg-silk)] hover:text-[var(--text-espresso)]'}`}>
                {id === 'price' ? shop.t.price : shop.t.facets[id]}
                {!!chosen[id] && <span className="font-spec text-[10px] text-[var(--gold-ink)]">{chosen[id]}</span>}
                <ChevronDown size={13} strokeWidth={1.4} />
              </button>
            ))}
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="hidden w-52 lg:block">{search}</div>
            <span className="font-spec hidden whitespace-nowrap text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)] sm:inline" aria-live={panelOpen ? 'off' : 'polite'}>{shop.t.count(count)}</span>
            <SortMenu sort={sort} searching={searching} onSort={onSort} />
            <div role="group" aria-label={t.view} className="flex shrink-0 items-center border border-[var(--border-hairline)] max-[359px]:hidden">
              <button type="button" aria-pressed={phoneOne} aria-label={t.one} onClick={() => onView('grid')} className={`${seg(phoneOne)} lg:hidden`}><RectangleVertical size={15} strokeWidth={1.3} /></button>
              <button type="button" aria-pressed={!phoneOne} aria-label={shop.t.views.compact} onClick={() => onView('compact')} className={`${seg(!phoneOne)} lg:hidden`}><Columns2 size={15} strokeWidth={1.3} /></button>
              {views.map(([v, Icon, only]) => (
                <button key={v} type="button" aria-pressed={view === v} aria-label={shop.t.views[v]} title={shop.t.views[v]} onClick={() => onView(v)} className={`${seg(view === v)} ${only}`}><Icon size={15} strokeWidth={1.3} /></button>
              ))}
            </div>
            {/* Phones find the switch in the row below, with its word */}
            <WornSwitch on={worn} onChange={onWorn} className="max-sm:hidden" />
          </div>
        </div>
      </div>
    </>
  )
}
