import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Truck } from 'lucide-react'
import {
  RENTAL_DAYS,
  RENTAL_LEAD_DAYS,
  RENTAL_SLOTS,
  addDays,
  formatDay,
  getBookedDates,
  isoDate,
  parseIso,
  rentalReturnDate,
  type RentalBooking,
  type RentalPeriodId,
} from '../../data/catalog'

interface Props {
  slug: string
  period: RentalPeriodId
  value: Partial<RentalBooking>
  onChange: (v: Partial<RentalBooking>) => void
  step: string
  error?: boolean
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MAX_MONTHS_AHEAD = 6

export default function RentalCalendar({ slug, period, value, onChange, step, error }: Props) {
  const today = useMemo(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), t.getDate())
  }, [])
  const minDate = addDays(today, RENTAL_LEAD_DAYS)
  const booked = useMemo(() => getBookedDates(slug), [slug])
  const [cursor, setCursor] = useState(() => new Date(minDate.getFullYear(), minDate.getMonth(), 1))
  const [hover, setHover] = useState<string | null>(null)
  const days = RENTAL_DAYS[period]

  // A start date is available when every day of the rental window is free.
  const canStart = (d: Date) => {
    if (d < minDate) return false
    for (let i = 0; i < days; i++) if (booked.has(isoDate(addDays(d, i)))) return false
    return true
  }

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))] as (Date | null)[]
  }, [cursor])

  const anchor = hover ?? value.start ?? null
  const inRange = (d: Date) => {
    if (!anchor) return false
    const a = parseIso(anchor)
    return d >= a && d < addDays(a, days)
  }

  const monthsAhead = (cursor.getFullYear() - minDate.getFullYear()) * 12 + cursor.getMonth() - minDate.getMonth()
  const canPrev = monthsAhead > 0
  const canNext = monthsAhead < MAX_MONTHS_AHEAD

  const start = value.start ? parseIso(value.start) : null
  const end = value.start ? rentalReturnDate(value.start, period) : null
  // If the period changes and the chosen window is no longer free, flag it.
  const conflict = start ? !canStart(start) : false

  const label = 'mb-4 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.22em]'

  return (
    <fieldset>
      <legend className={`${label} ${error ? 'text-red-700' : ''}`}>
        <span>
          <span className="font-mono-spec mr-3 text-[10px] text-[var(--gold-vermeil)]">{step}</span>
          Dates & delivery {error && !value.start && <span className="normal-case tracking-normal">— choose a start date</span>}
        </span>
      </legend>

      <div className={`border ${error && (!value.start || !value.slot) ? 'border-red-700/40' : 'border-[var(--border-hairline)]'}`}>
        {/* Month header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-3">
          <button type="button" disabled={!canPrev} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-silk)] disabled:opacity-25">
            <ChevronLeft size={16} strokeWidth={1.3} />
          </button>
          <p className="font-serif-editorial text-xl">{cursor.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}</p>
          <button type="button" disabled={!canNext} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-silk)] disabled:opacity-25">
            <ChevronRight size={16} strokeWidth={1.3} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="px-3 pb-3 pt-2" onMouseLeave={() => setHover(null)}>
          <div className="font-mono-spec grid grid-cols-7 py-2 text-center text-[9px] uppercase tracking-[0.16em] text-[var(--text-linen)]">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1" role="grid">
            {grid.map((d, i) => {
              if (!d) return <span key={`e${i}`} />
              const iso = isoDate(d)
              const isBooked = booked.has(iso)
              const available = canStart(d)
              const selected = value.start === iso
              const ranged = inRange(d)
              const isEnd = anchor && isoDate(addDays(parseIso(anchor), days - 1)) === iso
              return (
                <button
                  type="button"
                  key={iso}
                  disabled={!available}
                  onMouseEnter={() => available && setHover(iso)}
                  onClick={() => onChange({ ...value, start: iso })}
                  aria-pressed={selected}
                  aria-label={`${formatDay(d, { weekday: 'long', day: 'numeric', month: 'long' })}${isBooked ? ', reserved' : available ? '' : ', unavailable'}`}
                  className={`font-mono-spec relative h-10 text-xs transition-colors ${
                    selected || (ranged && iso === anchor)
                      ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]'
                      : isEnd
                        ? 'bg-[var(--gold-champagne)] text-[var(--text-espresso)]'
                        : ranged
                          ? 'bg-[var(--gold-champagne)]/25'
                          : available
                            ? 'hover:bg-[var(--bg-silk)]'
                            : 'cursor-not-allowed text-[var(--text-linen)]/60'
                  } ${isBooked ? 'line-through decoration-[var(--text-linen)]/60' : ''}`}
                >
                  {d.getDate()}
                  {iso === isoDate(today) && <span className="absolute bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[var(--gold-vermeil)]" />}
                </button>
              )
            })}
          </div>
          <div className="font-mono-spec mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--border-hairline)] pt-3 text-[9px] uppercase tracking-[0.16em] text-[var(--text-linen)]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[var(--text-espresso)]" /> Start</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[var(--gold-champagne)]/40" /> Your {days} days</span>
            <span className="flex items-center gap-1.5"><span className="line-through">12</span> Reserved</span>
            <span>{RENTAL_LEAD_DAYS} days’ notice</span>
          </div>
        </div>
      </div>

      {/* Hand-off method */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {([
          ['courier', Truck, 'Insured courier', 'Delivered & collected'],
          ['salon', MapPin, 'Salon fitting', '1420 Sherbrooke O.'],
        ] as const).map(([id, Icon, t, d]) => (
          <button
            type="button"
            key={id}
            onClick={() => onChange({ ...value, method: id })}
            className={`flex items-center gap-3 border px-4 py-3 text-left transition-colors ${(value.method ?? 'courier') === id ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-linen)]'}`}
          >
            <Icon size={16} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
            <span>
              <span className="block text-[10px] uppercase tracking-[0.18em]">{t}</span>
              <span className="block text-xs text-[var(--text-linen)]">{d}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Time slot */}
      <p className={`mt-5 text-[10px] uppercase tracking-[0.2em] ${error && value.start && !value.slot ? 'text-red-700' : 'text-[var(--text-taupe)]'}`}>
        {(value.method ?? 'courier') === 'courier' ? 'Delivery window' : 'Fitting time'}
        {error && value.start && !value.slot && ' — please choose'}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {RENTAL_SLOTS.map((s) => (
          <button
            type="button"
            key={s}
            disabled={!value.start}
            onClick={() => onChange({ ...value, slot: s })}
            className={`font-mono-spec border py-2.5 text-[11px] transition-colors disabled:opacity-35 ${value.slot === s ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] enabled:hover:border-[var(--text-espresso)]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Summary */}
      {start && end && (
        <div className={`mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-4 ${conflict ? 'bg-red-50' : 'bg-[var(--bg-silk)]'}`}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-linen)]">{(value.method ?? 'courier') === 'courier' ? 'Delivered' : 'Fitting'}</p>
            <p className="font-serif-editorial mt-1 text-lg leading-tight">{formatDay(start)}</p>
            <p className="font-mono-spec text-[10px] text-[var(--text-taupe)]">{value.slot ?? 'Select a time'}</p>
          </div>
          <span className="h-px w-8 bg-[var(--gold-vermeil)]" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-linen)]">Collected</p>
            <p className="font-serif-editorial mt-1 text-lg leading-tight">{formatDay(end)}</p>
            <p className="font-mono-spec text-[10px] text-[var(--text-taupe)]">by 12:00</p>
          </div>
          {conflict && <p className="col-span-3 text-xs text-red-700">This piece is reserved during part of a {period} rental from this date. Please choose another start date.</p>}
        </div>
      )}
    </fieldset>
  )
}

export function isBookingValid(slug: string, period: RentalPeriodId, b: Partial<RentalBooking>): b is RentalBooking {
  if (!b.start || !b.slot) return false
  const start = parseIso(b.start)
  const t = new Date()
  const min = addDays(new Date(t.getFullYear(), t.getMonth(), t.getDate()), RENTAL_LEAD_DAYS)
  if (start < min) return false
  const booked = getBookedDates(slug)
  for (let i = 0; i < RENTAL_DAYS[period]; i++) if (booked.has(isoDate(addDays(start, i)))) return false
  return true
}
