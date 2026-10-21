// Private visits: the salon receives by appointment, in person, by video or by telephone. The rules here are the
// prototype's (house policy, chosen 2026-10-21): availability is simulated and nothing is sent. In the theme a booking
// app (Booxi, Calendly or a Shopify appointments app) owns the calendar; the shapes below are what it would receive.
import { bilingual, formatList, getLocale, type Lang, type Locale } from '../i18n'
import { SALON } from './salon'
import { addDays, isoDate, parseIso, typesOf, type Metal, type Product } from './catalog'

export type VisitPurpose = 'engagement' | 'bands' | 'tennis' | 'rental' | 'design' | 'gift' | 'watches' | 'care' | 'other'
export type VisitMode = 'salon' | 'video' | 'phone'

export const PURPOSES: VisitPurpose[] = ['engagement', 'bands', 'tennis', 'rental', 'design', 'gift', 'watches', 'care', 'other']
export const MODES: VisitMode[] = ['salon', 'video', 'phone']

/** A piece the salon prepares for the visit, as it was chosen (metal, size, to rent). */
export interface VisitPiece {
  slug: string
  metal?: Metal
  size?: string
  rent?: boolean
}

export interface Visit {
  id: string
  purpose: VisitPurpose
  mode: VisitMode
  /** The day and start time, in Montréal (yyyy-mm-dd, HH:MM). */
  date: string
  time: string
  pieces: VisitPiece[]
  name: string
  email: string
  phone: string
  /** The language the visit is held in. */
  lang: Lang
  note: string
  /** Coming with someone. */
  guest: boolean
  /** When it was booked (ISO). */
  booked: string
}

/** What a booking opens with: the reason, the pieces and a time chosen elsewhere, or a visit to change. */
export interface VisitRequest {
  purpose?: VisitPurpose
  pieces?: VisitPiece[]
  mode?: VisitMode
  date?: string
  time?: string
  change?: string
}

/** How long a visit lasts, in minutes: 45 in the salon, an hour for a ring or a design; video 30, a call 20. */
export function visitLength(purpose: VisitPurpose, mode: VisitMode) {
  if (mode === 'phone') return 20
  if (mode === 'video') return 30
  return purpose === 'engagement' || purpose === 'design' ? 60 : 45
}

/** How far ahead a visit can be booked, and the notice it needs. */
export const BOOK_AHEAD_DAYS = 42
export const NOTICE_HOURS = 2

// Sunday is by appointment only, for a shorter day.
const SUNDAY: [number, number] = [11, 16]

/** The hours (Montréal) the house receives on a weekday (0 = Sunday), or null when it doesn't. */
export function hoursOn(day: number): [number, number] | null {
  return SALON.hours[day] ?? (SALON.byAppointment.includes(day) ? SUNDAY : null)
}

const clock = new Intl.DateTimeFormat('en-CA', { timeZone: SALON.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })

/** The wall clock in Montréal at an instant. */
function montreal(at: Date) {
  const parts = clock.formatToParts(at)
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { y: n('year'), m: n('month'), d: n('day'), h: n('hour') % 24, mi: n('minute') }
}

/** Today's date in Montréal (yyyy-mm-dd). */
export function montrealToday(now = new Date()) {
  const t = montreal(now)
  return `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`
}

/** The instant of a Montréal wall-clock time (EST or EDT, whichever applies that day). */
export function instantOf(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  const w = montreal(new Date(guess))
  const offset = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi) - guess
  return new Date(guess - offset)
}

// Demo availability: about a third of the times are taken, stable per day and time.
function taken(key: string) {
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % 100 < 34
}

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** The free start times of a day, every half hour, leaving room for the visit and the notice it needs. */
export function slotsOn(date: string, purpose: VisitPurpose, mode: VisitMode, now = new Date()): string[] {
  const hours = hoursOn(parseIso(date).getDay())
  if (!hours) return []
  const length = visitLength(purpose, mode)
  const earliest = now.getTime() + NOTICE_HOURS * 3600_000
  const out: string[] = []
  for (let m = hours[0] * 60; m + length <= hours[1] * 60; m += 30) {
    const time = hhmm(m)
    if (instantOf(date, time).getTime() < earliest || taken(`${date}${time}${mode}`)) continue
    out.push(time)
  }
  return out
}

/** The days with at least one free time, from today (Montréal) for BOOK_AHEAD_DAYS. */
export function visitDays(purpose: VisitPurpose, mode: VisitMode, now = new Date()): string[] {
  const start = parseIso(montrealToday(now))
  const out: string[] = []
  for (let i = 0; i < BOOK_AHEAD_DAYS; i++) {
    const date = isoDate(addDays(start, i))
    if (slotsOn(date, purpose, mode, now).length) out.push(date)
  }
  return out
}

/** The next free times in the salon, for "next available" chips. */
export function nextFree(n: number, purpose: VisitPurpose = 'other', mode: VisitMode = 'salon', now = new Date()) {
  const out: { date: string; time: string }[] = []
  for (const date of visitDays(purpose, mode, now)) {
    for (const time of slotsOn(date, purpose, mode, now)) {
      out.push({ date, time })
      if (out.length >= n) return out
    }
  }
  return out
}

/** A start time as the visitor reads time: 14:00 in Canadian English, 2:00 PM in US English, 14 h 30 in French. */
export function formatTime(time: string, locale: Locale = getLocale()) {
  const [h, m] = time.split(':').map(Number)
  if (locale === 'fr-CA') return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
  if (locale === 'en-US') return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(2000, 0, 1, h, m))
  return time
}

/** The same moment in the visitor's own time zone, when it isn't Montréal's ("11:00 your time"), else null. */
export function localTime(date: string, time: string, locale: Locale = getLocale()) {
  const at = instantOf(date, time)
  const here = new Date(at)
  const same = new Intl.DateTimeFormat('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }).format(here)
  const there = new Intl.DateTimeFormat('en-CA', { timeZone: SALON.timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(at)
  if (same === there) return null
  return formatTime(same.replace(/^24/, '00'), locale)
}

/** The reason a piece suggests for a visit. */
export function purposeFor(p: Product, rent = false): VisitPurpose {
  if (rent) return 'rental'
  if (p.type === 'engagement') return 'engagement'
  if (p.type === 'band' || p.type === 'eternity') return 'bands'
  if (typesOf('tennis').includes(p.type) || p.type === 'tennis-bracelet') return 'tennis'
  if (p.category === 'custom') return 'design'
  if (p.type === 'watch') return 'watches'
  if (p.category === 'gifts') return 'gift'
  return 'other'
}

/** The visits still to come, soonest first. */
export const upcoming = (visits: Visit[], now = new Date()) =>
  visits.filter((v) => instantOf(v.date, v.time).getTime() > now.getTime()).sort((a, b) => instantOf(a.date, a.time).getTime() - instantOf(b.date, b.time).getTime())

export const VISIT_COPY = bilingual(
  {
    purposes: { engagement: 'An engagement ring', bands: 'Wedding bands', tennis: 'A tennis necklace or diamonds', rental: 'A rental fitting', design: 'A design with our designer', gift: 'Gift advice', watches: 'A watch', care: 'Care and repairs', other: 'Something else' } as Record<VisitPurpose, string>,
    modes: { salon: 'At the salon', video: 'Video call', phone: 'Phone call' } as Record<VisitMode, string>,
    modeNotes: { salon: '1420 rue Sherbrooke Ouest', video: 'From anywhere · we send the link', phone: 'We call you' } as Record<VisitMode, string>,
    minutes: (n: number) => `${n} min`,
    yourTime: (t: string) => `${t} your time`,
    montreal: 'Montréal time',
    calendarTitle: (purpose: string) => `Teresa & Sons · ${purpose}`,
    calendarText: (pieces: string[]) => (pieces.length ? `We’ll have ready: ${formatList(pieces, 'en-CA')}.` : 'A private visit at Teresa & Sons.'),
  },
  {
    purposes: { engagement: 'Une bague de fiançailles', bands: 'Des alliances', tennis: 'Un collier tennis ou des diamants', rental: 'L’essayage d’une location', design: 'Une création avec notre designer', gift: 'Un conseil cadeau', watches: 'Une montre', care: 'Entretien et réparations', other: 'Autre chose' },
    modes: { salon: 'Au salon', video: 'Appel vidéo', phone: 'Appel téléphonique' },
    modeNotes: { salon: '1420, rue Sherbrooke Ouest', video: 'D’où vous voulez · nous envoyons le lien', phone: 'Nous vous appelons' },
    minutes: (n) => `${n} min`,
    yourTime: (t) => `${t}, heure locale`,
    montreal: 'Heure de Montréal',
    calendarTitle: (purpose) => `Teresa & Sons · ${purpose}`,
    calendarText: (pieces) => (pieces.length ? `Nous aurons prêt\u00a0: ${formatList(pieces, 'fr-CA')}.` : 'Une visite privée chez Teresa & Sons.'),
  },
)

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
const stamp = (d: Date) => d.toISOString().replace(/\.\d{3}/, '').replace(/[-:]/g, '')

/** The visit as a calendar file (.ics), made in the browser: nothing is sent anywhere. */
export function icsFor(v: Visit, summary: string, description: string, location: string) {
  const start = instantOf(v.date, v.time)
  const end = new Date(start.getTime() + visitLength(v.purpose, v.mode) * 60_000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Teresa & Sons//Visits//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${v.id}@teresa-and-sons.example`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
