import { useEffect, useState, type RefObject } from 'react'
import { CalendarHeart } from 'lucide-react'
import type { Product } from '../../data/catalog'
import type { VisitRequest } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { useStore } from '../../store'
import Price from '../Price'
import TryOnButton from '../tryon/TryOnButton'

const COPY = bilingual({ book: 'Book a visit', fitting: 'Book a fitting' }, { book: 'Prendre rendez-vous', fitting: 'Réserver un essayage' })

interface Props {
  product: Product
  amount: number
  detail?: string
  label: string
  target: RefObject<HTMLElement | null>
  onAction: () => void
  /** The visit the second door books: this piece, as configured. */
  visit: VisitRequest
  /** Renting: the second door books a fitting. */
  rent?: boolean
}

/** Slides up once the primary CTA has scrolled out of view, with the same two doors: the bag and a visit. */
export default function StickyBar({ product, amount, detail, label, target, onAction, visit, rent = false }: Props) {
  const { openVisit } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = target.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [target])

  const book = rent ? t.fitting : t.book
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)]/95 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${show ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!show}
      data-fab-avoid
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-6 py-3 sm:gap-5 lg:px-12">
        <img src={product.images[0]} alt="" className="hidden h-12 w-10 object-cover sm:block" />
        {/* Phones give the bar to the two doors; the name returns from sm up */}
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="font-serif-editorial truncate text-xl leading-tight">{catalog.name(product)}</p>
          {detail && <p className="font-spec truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">{detail}</p>}
        </div>
        <Price amount={amount} className="hidden text-sm lg:inline" />
        <TryOnButton product={product} variant="icon" />
        <button type="button" onClick={() => openVisit(visit)} tabIndex={show ? 0 : -1} aria-label={book} className="flex h-11 w-11 shrink-0 items-center justify-center gap-2.5 border border-[var(--text-espresso)] text-[11px] font-medium uppercase tracking-[0.24em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)] sm:h-auto sm:w-auto sm:px-6 sm:py-[13px]">
          <CalendarHeart size={15} strokeWidth={1.3} /> <span className="hidden md:inline">{book}</span>
        </button>
        <button onClick={onAction} tabIndex={show ? 0 : -1} className="min-w-0 flex-1 truncate bg-[var(--text-espresso)] px-5 py-3.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] sm:flex-none sm:shrink-0 sm:px-10">
          {label}
        </button>
      </div>
    </div>
  )
}
