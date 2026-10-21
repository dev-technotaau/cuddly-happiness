import { useMemo, useRef, useState } from 'react'
import { CalendarPlus, MapPin, Phone, Video, X } from 'lucide-react'
import { formatDay, getProduct, parseIso, type Product } from '../../data/catalog'
import { SALON } from '../../data/salon'
import { MODES, PURPOSES, VISIT_COPY, formatTime, icsFor, localTime, slotsOn, visitDays, visitLength, type Visit, type VisitMode, type VisitPiece, type VisitPurpose, type VisitRequest } from '../../data/visits'
import { LANGS, LANGUAGE, bilingual, useCopy, useLocale, type Lang } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import Hallmark from '../brand/Hallmark'
import { sizeLabel } from '../pdp/RingSize'
import { btnPrimary, btnQuiet } from '../ui'

const COPY = bilingual(
  {
    steps: ['What brings you in?', 'How would you like to meet?', 'When suits you?', 'Pieces we’ll prepare', 'About you'],
    times: 'Times are Montréal time',
    noDays: 'No free times in the next six weeks. Call us and we’ll make room.',
    choosePurpose: 'Choose what brings you in.',
    chooseTime: 'Choose a day and a time.',
    piecesHint: 'They’ll be waiting on a velvet tray, in your size.',
    fromWishlist: 'Add from your wishlist',
    remove: (name: string) => `Remove ${name}`,
    toRent: 'to rent',
    name: 'Full name',
    email: 'Email',
    phone: 'Telephone',
    language: 'Your visit in',
    note: 'Anything we should know?',
    optional: 'optional',
    notePlaceholder: 'A budget, a ring size, a date to keep in mind…',
    guest: 'I’m coming with someone',
    contact: 'Please give your name, email and telephone.',
    book: 'Book the visit',
    update: 'Change the visit',
    free: 'Complimentary · never an obligation',
    expecting: (name: string) => `We’re expecting you, <em>${name}</em>.`,
    confirm: 'A confirmation follows by email. Reply to it, or call us, to change anything.',
    modeLine: { salon: `${SALON.street} · ring at the door`, video: 'We’ll email you the video link the day before.', phone: 'We’ll call you on' } as Record<VisitMode, string>,
    addCalendar: 'Add to calendar',
    directions: 'Directions',
    change: 'Change',
    cancel: 'Cancel the visit',
    cancelled: 'Your visit is cancelled. We hope to see you another time.',
    again: 'Choose another time',
    close: 'Close',
    when: 'When',
    how: 'How',
    pieces: 'Prepared for you',
    length: 'Length',
  },
  {
    steps: ['Ce qui vous amène', 'Comment souhaitez-vous nous rencontrer?', 'Quand vous convient-il?', 'Les pièces que nous préparerons', 'Vos coordonnées'],
    times: 'Heures de Montréal',
    noDays: 'Aucune plage libre dans les six prochaines semaines. Appelez-nous, nous vous ferons une place.',
    choosePurpose: 'Choisissez ce qui vous amène.',
    chooseTime: 'Choisissez un jour et une heure.',
    piecesHint: 'Elles vous attendront sur un plateau de velours, à votre taille.',
    fromWishlist: 'Ajouter depuis votre liste de souhaits',
    remove: (name) => `Retirer ${name}`,
    toRent: 'en location',
    name: 'Nom complet',
    email: 'Courriel',
    phone: 'Téléphone',
    language: 'Votre visite en',
    note: 'Quelque chose à nous dire?',
    optional: 'facultatif',
    notePlaceholder: 'Un budget, une taille de bague, une date à retenir…',
    guest: 'Je viens accompagné·e',
    contact: 'Veuillez indiquer votre nom, votre courriel et votre téléphone.',
    book: 'Réserver la visite',
    update: 'Modifier la visite',
    free: 'Offerte · sans engagement',
    expecting: (name) => `Nous vous attendons, <em>${name}</em>.`,
    confirm: 'Une confirmation suit par courriel. Répondez-y, ou appelez-nous, pour changer quoi que ce soit.',
    modeLine: { salon: `${SALON.street.replace('1420 rue', '1420, rue')} · sonnez à la porte`, video: 'Nous vous enverrons le lien vidéo par courriel la veille.', phone: 'Nous vous appellerons au' },
    addCalendar: 'Ajouter au calendrier',
    directions: 'Itinéraire',
    change: 'Modifier',
    cancel: 'Annuler la visite',
    cancelled: 'Votre visite est annulée. Au plaisir de vous voir une autre fois.',
    again: 'Choisir un autre moment',
    close: 'Fermer',
    when: 'Quand',
    how: 'Comment',
    pieces: 'Préparées pour vous',
    length: 'Durée',
  },
)

const ICONS: Record<VisitMode, typeof MapPin> = { salon: MapPin, video: Video, phone: Phone }

const label = 'font-spec mb-5 flex items-baseline gap-3 text-[11px] uppercase tracking-[0.22em]'
const num = 'text-[10px] text-[var(--gold-ink)]'
const chip = (on: boolean) => `rounded-full border px-4 py-2 text-[13px] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`
const field = 'mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2.5 outline-none transition-colors focus:border-[var(--gold-vermeil)]'

interface Props {
  request: VisitRequest
  /** Closes the drawer around the flow, when there is one. */
  onClose?: () => void
  /** Shown on a page (the Atelier) rather than in the drawer. */
  embedded?: boolean
}

/** The private-visit booking: the reason, the way to meet, a day and a time, the pieces to prepare and the visitor's
 *  details, then a confirmation with a calendar file. Simulated: the visit is kept on this device and nothing is sent. */
export default function VisitFlow({ request, onClose, embedded = false }: Props) {
  const { currency, user, wishlist, visits, bookVisit, cancelVisit } = useStore()
  const { lang, locale } = useLocale()
  const t = useCopy(COPY)
  const v = useCopy(VISIT_COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  const editing = request.change ? visits.find((x) => x.id === request.change) : undefined

  const [id, setId] = useState<string | null>(editing?.id ?? null)
  const [purpose, setPurpose] = useState<VisitPurpose | null>(request.purpose ?? editing?.purpose ?? null)
  const [mode, setMode] = useState<VisitMode>(request.mode ?? editing?.mode ?? (currency === 'USD' ? 'video' : 'salon'))
  const [date, setDate] = useState<string | null>(request.date ?? editing?.date ?? null)
  const [time, setTime] = useState<string | null>(request.time ?? editing?.time ?? null)
  const [pieces, setPieces] = useState<VisitPiece[]>(request.pieces ?? editing?.pieces ?? [])
  const [name, setName] = useState(editing?.name ?? user?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? user?.email ?? '')
  const [phone, setPhone] = useState(editing?.phone ?? '')
  const [visitLang, setVisitLang] = useState<Lang>(editing?.lang ?? lang)
  const [note, setNote] = useState(editing?.note ?? '')
  const [guest, setGuest] = useState(editing?.guest ?? false)
  const [errors, setErrors] = useState({ purpose: false, time: false, contact: false })
  const [done, setDone] = useState<Visit | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const refs = { purpose: useRef<HTMLDivElement>(null), time: useRef<HTMLDivElement>(null), contact: useRef<HTMLDivElement>(null) }

  // The days and times follow the reason and the way to meet (a ring is an hour, a call 20 minutes).
  const length = visitLength(purpose ?? 'other', mode)
  const days = useMemo(() => visitDays(purpose ?? 'other', mode), [purpose, mode])
  const day = date && days.includes(date) ? date : days[0] ?? null
  const times = useMemo(() => (day ? slotsOn(day, purpose ?? 'other', mode) : []), [day, purpose, mode])
  const slot = time && times.includes(time) ? time : null
  const shown = (p: VisitPiece) => getProduct(p.slug)
  const extra = wishlist.map(getProduct).filter((p): p is Product => !!p && p.type !== 'gift-card' && !pieces.some((x) => x.slug === p.slug)).slice(0, 6)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { purpose: !purpose, time: !day || !slot, contact: !name.trim() || !/\S+@\S+\.\S+/.test(email) || phone.replace(/\D/g, '').length < 7 }
    setErrors(errs)
    const first = errs.purpose ? refs.purpose : errs.time ? refs.time : errs.contact ? refs.contact : null
    if (first) {
      first.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const visit: Visit = { id: id ?? `v${Date.now().toString(36)}`, purpose: purpose!, mode, date: day!, time: slot!, pieces, name: name.trim(), email: email.trim(), phone: phone.trim(), lang: visitLang, note: note.trim(), guest, booked: new Date().toISOString() }
    bookVisit(visit)
    setId(visit.id)
    setDone(visit)
  }

  // The calendar file is made here, in the browser.
  const toCalendar = (visit: Visit) => {
    const names = visit.pieces.map(shown).filter((p): p is Product => !!p).map(catalog.name)
    const where = visit.mode === 'salon' ? `${SALON.street}, ${SALON.city}` : v.modes[visit.mode]
    const url = URL.createObjectURL(new Blob([icsFor(visit, v.calendarTitle(v.purposes[visit.purpose]), v.calendarText(names), where)], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'teresa-and-sons-visit.ics'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  if (cancelled) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif-editorial text-3xl font-light leading-snug">{t.cancelled}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => { setCancelled(false); setDone(null); setId(null); setTime(null) }} className={btnQuiet}>{t.again}</button>
          {onClose && <button type="button" onClick={onClose} className={btnQuiet}>{t.close}</button>}
        </div>
      </div>
    )
  }

  if (done) {
    const at = parseIso(done.date)
    const yours = localTime(done.date, done.time, locale)
    const prepared = done.pieces.map(shown).filter((p): p is Product => !!p)
    const Icon = ICONS[done.mode]
    return (
      <div role="status" className={embedded ? 'mx-auto max-w-xl py-6 text-center' : 'py-10 text-center'}>
        <Hallmark className="mx-auto h-14 w-14 text-[var(--gold-vermeil)]" />
        <h3 className="font-serif-editorial mt-8 text-4xl font-light leading-tight">{rich(t.expecting(done.name.split(' ')[0]), 'text-[var(--gold-vermeil)]')}</h3>
        <dl className="mt-10 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-left text-sm">
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.when}</dt>
            <dd className="text-right">
              <span className="inline-block first-letter:uppercase">{formatDay(at, { weekday: 'long', day: 'numeric', month: 'long' })}</span> · <span className="font-spec">{formatTime(done.time)}</span>
              {yours && <span className="block text-xs text-[var(--text-taupe)]">{v.yourTime(yours)}</span>}
            </dd>
          </div>
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.how}</dt>
            <dd className="flex items-start justify-end gap-2 text-right"><Icon size={15} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" /><span>{v.modes[done.mode]}<span className="block text-xs text-[var(--text-taupe)]">{t.modeLine[done.mode]}{done.mode === 'phone' && <> <span className="font-spec">{done.phone}</span></>}</span></span></dd>
          </div>
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.length}</dt>
            <dd className="font-spec">{v.minutes(visitLength(done.purpose, done.mode))}</dd>
          </div>
          {prepared.length > 0 && (
            <div className="py-4">
              <dt className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.pieces}</dt>
              <dd className="mt-3 flex flex-wrap gap-3">
                {prepared.map((p) => (
                  <span key={p.slug} className="flex items-center gap-3 border border-[var(--border-hairline)] py-1.5 pl-1.5 pr-3">
                    <img src={p.images[0]} alt="" className="h-10 w-8 object-cover" />
                    <span className="font-serif-editorial text-base">{catalog.name(p)}</span>
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-[var(--text-taupe)]">{t.confirm}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => toCalendar(done)} className={btnQuiet}><CalendarPlus size={14} strokeWidth={1.4} /> {t.addCalendar}</button>
          {done.mode === 'salon' && <a href={SALON.maps} target="_blank" rel="noreferrer" className={btnQuiet}><MapPin size={14} strokeWidth={1.4} /> {t.directions}</a>}
          <button type="button" onClick={() => setDone(null)} className={btnQuiet}>{t.change}</button>
        </div>
        <button type="button" onClick={() => { cancelVisit(done.id); setCancelled(true) }} className="mt-6 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">{t.cancel}</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-12">
      {/* 01 · The reason */}
      <div ref={refs.purpose}>
        <p className={label}><span className={num}>01</span>{t.steps[0]}</p>
        <div role="group" aria-label={t.steps[0]} className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => <button key={p} type="button" aria-pressed={purpose === p} onClick={() => { setPurpose(p); setErrors((e) => ({ ...e, purpose: false })) }} className={chip(purpose === p)}>{v.purposes[p]}</button>)}
        </div>
        {errors.purpose && <p role="alert" className="mt-3 text-xs text-red-700">{t.choosePurpose}</p>}
      </div>

      {/* 02 · In the salon, by video or by telephone */}
      <div>
        <p className={label}><span className={num}>02</span>{t.steps[1]}</p>
        <div role="group" aria-label={t.steps[1]} className="grid gap-2">
          {MODES.map((m) => {
            const Icon = ICONS[m]
            const on = mode === m
            return (
              <button key={m} type="button" aria-pressed={on} onClick={() => setMode(m)} className={`flex items-center gap-4 border px-4 py-3.5 text-left transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--bg-silk)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
                <Icon size={17} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{v.modes[m]}</span>
                  <span className="block text-xs text-[var(--text-taupe)]">{v.modeNotes[m]}</span>
                </span>
                <span className="font-spec shrink-0 text-[11px] text-[var(--text-taupe)]">{v.minutes(visitLength(purpose ?? 'other', m))}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 03 · A day, then a time */}
      <div ref={refs.time}>
        <p className={label}><span className={num}>03</span>{t.steps[2]}</p>
        {days.length === 0 ? (
          <p className="text-sm text-[var(--text-taupe)]">{t.noDays}</p>
        ) : (
          <>
            <div role="group" aria-label={t.steps[2]} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" data-lenis-prevent>
              {days.map((d) => {
                const at = parseIso(d)
                const on = d === day
                return (
                  <button key={d} type="button" aria-pressed={on} aria-label={formatDay(at, { weekday: 'long', day: 'numeric', month: 'long' })} onClick={() => { setDate(d); setErrors((e) => ({ ...e, time: false })) }} className={`flex w-[62px] shrink-0 flex-col items-center border py-3 transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
                    <span className="font-spec text-[9px] uppercase tracking-[0.18em] opacity-70">{formatDay(at, { weekday: 'short' }).replace('.', '')}</span>
                    <span className="font-serif-editorial mt-1 text-2xl leading-none">{at.getDate()}</span>
                    <span className="font-spec mt-1 text-[9px] uppercase tracking-[0.14em] opacity-70">{formatDay(at, { month: 'short' }).replace('.', '')}</span>
                  </button>
                )
              })}
            </div>
            <div role="group" aria-label={day ? formatDay(parseIso(day), { weekday: 'long', day: 'numeric', month: 'long' }) : t.steps[2]} className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {times.map((tm) => (
                <button key={tm} type="button" aria-pressed={slot === tm} onClick={() => { setTime(tm); setErrors((e) => ({ ...e, time: false })) }} className={`font-spec border py-2.5 text-[13px] transition-colors ${slot === tm ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>
                  {formatTime(tm)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--text-taupe)]">
              {t.times}
              {day && slot && localTime(day, slot, locale) && <> · {v.yourTime(localTime(day, slot, locale)!)}</>}
            </p>
          </>
        )}
        {errors.time && <p role="alert" className="mt-3 text-xs text-red-700">{t.chooseTime}</p>}
      </div>

      {/* 04 · What the salon prepares */}
      {(pieces.length > 0 || extra.length > 0) && (
        <div>
          <p className={label}><span className={num}>04</span>{t.steps[3]}</p>
          {pieces.length > 0 && (
            <ul className="space-y-2">
              {pieces.map((p) => {
                const product = shown(p)
                if (!product) return null
                const details = [p.metal && catalog.metal(p.metal), p.size && common.size(sizeLabel(p.size)), p.rent && t.toRent].filter(Boolean).join(' · ')
                return (
                  <li key={p.slug} className="flex items-center gap-4 border border-[var(--border-hairline)] p-2 pr-3">
                    <img src={product.images[0]} alt="" className="h-14 w-11 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="font-serif-editorial block truncate text-lg leading-tight">{catalog.name(product)}</span>
                      {details && <span className="block truncate text-xs text-[var(--text-taupe)]">{details}</span>}
                    </span>
                    <button type="button" onClick={() => setPieces((ps) => ps.filter((x) => x.slug !== p.slug))} aria-label={t.remove(catalog.name(product))} className="p-2 text-[var(--text-taupe)] hover:text-[var(--text-espresso)]"><X size={15} strokeWidth={1.4} /></button>
                  </li>
                )
              })}
            </ul>
          )}
          {pieces.length > 0 && <p className="mt-3 text-xs text-[var(--text-taupe)]">{t.piecesHint}</p>}
          {extra.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.fromWishlist}</p>
              <div className="flex flex-wrap gap-2">
                {extra.map((p) => (
                  <button key={p.slug} type="button" onClick={() => setPieces((ps) => [...ps, { slug: p.slug, metal: p.metals[0] }])} className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] py-1 pl-1 pr-3.5 text-[13px] transition-colors hover:border-[var(--text-espresso)]">
                    <img src={p.images[0]} alt="" className="h-7 w-7 rounded-full object-cover" />+ {catalog.name(p)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 05 · The visitor */}
      <div ref={refs.contact}>
        <p className={label}><span className={num}>{pieces.length > 0 || extra.length > 0 ? '05' : '04'}</span>{t.steps[4]}</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.2em]">{t.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={field} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em]">{t.email}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={field} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em]">{t.phone}</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required className={`font-spec ${field}`} />
          </label>
        </div>
        {errors.contact && <p role="alert" className="mt-3 text-xs text-red-700">{t.contact}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="text-[11px] uppercase tracking-[0.2em]">{t.language}</span>
          <div role="group" aria-label={t.language} className="flex gap-2">
            {LANGS.map((l) => <button key={l} type="button" lang={l} aria-pressed={visitLang === l} onClick={() => setVisitLang(l)} className={chip(visitLang === l)}>{LANGUAGE[l].name}</button>)}
          </div>
        </div>
        <label className="mt-6 block">
          <span className="text-[11px] uppercase tracking-[0.2em]">{t.note} <span className="normal-case tracking-normal text-[var(--text-taupe)]">({t.optional})</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={3} placeholder={t.notePlaceholder} className={`resize-none ${field} placeholder:text-[var(--text-taupe)]`} />
        </label>
        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={guest} onChange={(e) => setGuest(e.target.checked)} className="h-4 w-4 accent-[var(--text-espresso)]" />
          {t.guest}
        </label>
      </div>

      <div className={embedded ? '' : 'sticky bottom-0 -mx-7 border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)] px-7 pb-6 pt-5'}>
        {purpose && day && slot && (
          <p className="mb-3 text-center text-xs text-[var(--text-taupe)]">
            {v.purposes[purpose]} · <span className="inline-block first-letter:uppercase">{formatDay(parseIso(day), { weekday: 'short', day: 'numeric', month: 'short' })}</span>, <span className="font-spec">{formatTime(slot)}</span> · {v.minutes(length)}
          </p>
        )}
        <button type="submit" className={`${btnPrimary} w-full`}>{id ? t.update : t.book}</button>
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-[var(--text-taupe)]">{t.free}</p>
      </div>
    </form>
  )
}
