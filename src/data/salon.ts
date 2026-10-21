import { bilingual, formatHour, getLocale, pick, type Locale } from '../i18n'

/** The salon on rue Sherbrooke Ouest: address, telephone and opening hours (placeholder data, as shown in the Footer and on Home). */
export const SALON = {
  street: '1420 rue Sherbrooke Ouest',
  city: 'Montréal, QC H3G 1K4',
  phone: '+1 514 555 0162',
  timeZone: 'America/Toronto',
  // Opening hours by weekday (0 = Sunday), on the 24-hour clock.
  hours: { 2: [10, 18], 3: [10, 18], 4: [10, 18], 5: [10, 18], 6: [10, 18] } as Partial<Record<number, [number, number]>>,
  // Days the salon receives by appointment only.
  byAppointment: [0],
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COPY = bilingual(
  {
    openUntil: (h: string) => `Open now · until ${h}`,
    closingAt: (h: string) => `Open · closing at ${h}`,
    opensAt: (h: string) => `Closed · opens at ${h}`,
    appointment: 'Today by appointment',
    opensOn: (day: string, h: string) => `Closed · opens ${day} at ${h}`,
    tomorrow: 'tomorrow',
    closed: 'Closed',
    week: (from: string, to: string, open: string, close: string) => `${from}–${to} · ${open}–${close}`,
    weekLong: (from: string, to: string, open: string, close: string, sunday: string) => `${from} – ${to}, ${open} – ${close} · ${sunday} by appointment`,
  },
  {
    openUntil: (h) => `Ouvert · jusqu’à ${h}`,
    closingAt: (h) => `Ouvert · ferme à ${h}`,
    opensAt: (h) => `Fermé · ouvre à ${h}`,
    appointment: 'Aujourd’hui sur rendez-vous',
    opensOn: (day, h) => `Fermé · ouvre ${day} à ${h}`,
    tomorrow: 'demain',
    closed: 'Fermé',
    week: (from, to, open, close) => `${from[0].toUpperCase()}${from.slice(1)}–${to} · ${open} – ${close}`,
    weekLong: (from, to, open, close, sunday) => `Du ${from} au ${to}, de ${open} à ${close} · Le ${sunday} sur rendez-vous`,
  },
)

/** A weekday's name in a locale (0 = Sunday): `long` for sentences, `short` for the hours line. */
const weekday = (day: number, style: 'long' | 'short', locale: Locale) => new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1 + day)))

export interface SalonStatus {
  open: boolean
  label: string
}

/** Whether the salon is open at `now` in Montréal time, with a short line for the UI in the visitor's language
 *  ("Open now · until 18h", "Ouvert · jusqu’à 18 h"). */
export function salonStatus(now = new Date(), locale: Locale = getLocale()): SalonStatus {
  const t = pick(COPY, locale)
  const h = (n: number) => formatHour(n, locale)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: SALON.timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const day = Math.max(0, DAYS.indexOf(part('weekday')))
  // Some engines print midnight as 24 when hour12 is off.
  const minute = (Number(part('hour')) % 24) * 60 + Number(part('minute'))
  const today = SALON.hours[day]
  if (today && minute >= today[0] * 60 && minute < today[1] * 60) {
    return { open: true, label: today[1] * 60 - minute <= 60 ? t.closingAt(h(today[1])) : t.openUntil(h(today[1])) }
  }
  if (today && minute < today[0] * 60) return { open: false, label: t.opensAt(h(today[0])) }
  if (SALON.byAppointment.includes(day)) return { open: false, label: t.appointment }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7
    const hours = SALON.hours[next]
    if (hours) return { open: false, label: t.opensOn(ahead === 1 ? t.tomorrow : weekday(next, 'long', locale), h(hours[0])) }
  }
  return { open: false, label: t.closed }
}

/** The opening hours on one line, from SALON.hours: "Tue–Sat · 10h–18h", "Mar.–sam. · 10 h – 18 h". */
export function salonHours(locale: Locale = getLocale()) {
  const days = Object.keys(SALON.hours).map(Number)
  const [open, close] = SALON.hours[days[0]] ?? [10, 18]
  return pick(COPY, locale).week(weekday(days[0], 'short', locale), weekday(days[days.length - 1], 'short', locale), formatHour(open, locale), formatHour(close, locale))
}

/** The opening hours as a sentence, with the appointment day: "Tuesday – Saturday, 10h – 18h · Sunday by appointment". */
export function salonWeek(locale: Locale = getLocale()) {
  const days = Object.keys(SALON.hours).map(Number)
  const [open, close] = SALON.hours[days[0]] ?? [10, 18]
  return pick(COPY, locale).weekLong(weekday(days[0], 'long', locale), weekday(days[days.length - 1], 'long', locale), formatHour(open, locale), formatHour(close, locale), weekday(SALON.byAppointment[0] ?? 0, 'long', locale))
}
