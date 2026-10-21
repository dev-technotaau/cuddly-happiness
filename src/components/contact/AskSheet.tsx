import { useEffect, useRef, useState } from 'react'
import { CalendarHeart, Mail, MessageCircle, MessageSquareText, Phone, PhoneIncoming, X } from 'lucide-react'
import { getProduct, type Product } from '../../data/catalog'
import { SALON, salonDial, salonStatus } from '../../data/salon'
import { bilingual, formatList, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import { getLenis } from '../SmoothScroll'
import { btnPrimary } from '../ui'

type When = 'morning' | 'afternoon' | 'evening'

const COPY = bilingual(
  {
    label: 'Ask a jeweller',
    eyebrow: 'Ask a jeweller',
    title: 'We’re <em>here</em>.',
    answer: 'A jeweller from the family answers, usually within the hour during salon hours.',
    about: 'About',
    call: ['Call the salon', SALON.phone],
    text: ['Send a text', 'We reply from the salon'],
    whatsapp: ['WhatsApp', 'Photos and questions welcome'],
    email: ['Write to us', SALON.email],
    visit: ['Book a visit', 'In the salon, by video or by phone'],
    back: 'Or we call you',
    name: 'Your name',
    phone: 'Telephone',
    whens: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Early evening' } as Record<When, string>,
    callWhen: { morning: 'in the morning', afternoon: 'in the afternoon', evening: 'early in the evening' } as Record<When, string>,
    request: 'Call me back',
    missing: 'Please give your name and a telephone number.',
    called: (name: string, when: string) => `Merci, ${name}. A jeweller will call you ${when}.`,
    message: (pieces: string[]) => (pieces.length ? `Hello, I’d like to know more about ${formatList(pieces, 'en-CA')}.` : 'Hello, I have a question for a jeweller.'),
    subject: (pieces: string[]) => (pieces.length ? `About ${pieces.join(', ')}` : 'A question for a jeweller'),
    close: 'Close',
  },
  {
    label: 'Parler à un joaillier',
    eyebrow: 'Parler à un joaillier',
    title: 'Nous sommes <em>là</em>.',
    answer: 'Un joaillier de la famille vous répond, en général dans l’heure pendant les heures du salon.',
    about: 'À propos de',
    call: ['Appeler le salon', SALON.phone],
    text: ['Écrire un texto', 'Nous répondons depuis le salon'],
    whatsapp: ['WhatsApp', 'Photos et questions bienvenues'],
    email: ['Nous écrire', SALON.email],
    visit: ['Prendre rendez-vous', 'Au salon, par vidéo ou par téléphone'],
    back: 'Ou nous vous rappelons',
    name: 'Votre nom',
    phone: 'Téléphone',
    whens: { morning: 'Le matin', afternoon: 'L’après-midi', evening: 'En fin de journée' },
    callWhen: { morning: 'le matin', afternoon: 'l’après-midi', evening: 'en fin de journée' },
    request: 'Me rappeler',
    missing: 'Veuillez indiquer votre nom et un numéro de téléphone.',
    called: (name, when) => `Merci, ${name}. Un joaillier vous appellera ${when}.`,
    message: (pieces) => (pieces.length ? `Bonjour, j’aimerais en savoir plus sur ${formatList(pieces, 'fr-CA')}.` : 'Bonjour, j’ai une question pour un joaillier.'),
    subject: (pieces) => (pieces.length ? `À propos de ${pieces.join(', ')}` : 'Une question pour un joaillier'),
    close: 'Fermer',
  },
)

const WHENS: When[] = ['morning', 'afternoon', 'evening']

/** "Ask a jeweller": every way to reach the salon in one panel (call, text, WhatsApp, email, a call back, a visit), with
 *  the pieces the visitor was looking at written into the message. The links open the visitor's own apps; the call-back
 *  request is simulated. */
export default function AskSheet() {
  const { askAbout, closeAsk, openVisit, user } = useStore()
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const [open, setOpen] = useState(false)
  const [about, setAbout] = useState<string[]>([])
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [when, setWhen] = useState<When>('afternoon')
  const [error, setError] = useState(false)
  const [sent, setSent] = useState(false)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!askAbout) {
      setOpen(false)
      return
    }
    setAbout(askAbout)
    setSent(false)
    setError(false)
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [askAbout])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focus = window.setTimeout(() => closeBtn.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAsk()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', closeAsk)
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
      window.clearTimeout(focus)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', closeAsk)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open, closeAsk])

  const pieces = about.map(getProduct).filter((p): p is Product => !!p)
  const names = pieces.map(catalog.name)
  const message = encodeURIComponent(t.message(names))
  const status = salonStatus()

  const ways = [
    { icon: Phone, copy: t.call, href: `tel:${salonDial()}` },
    { icon: MessageSquareText, copy: t.text, href: `sms:${salonDial()}?&body=${message}` },
    { icon: MessageCircle, copy: t.whatsapp, href: `https://wa.me/${salonDial().replace('+', '')}?text=${message}`, external: true },
    { icon: Mail, copy: t.email, href: `mailto:${SALON.email}?subject=${encodeURIComponent(t.subject(names))}&body=${message}` },
  ]

  const callBack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 7) {
      setError(true)
      return
    }
    setError(false)
    setSent(true)
  }

  return (
    <>
      <div onClick={closeAsk} aria-hidden className={`fixed inset-0 z-[80] bg-[var(--bg-vault)]/45 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label={t.label} aria-hidden={!open} inert={!open} className={`fixed right-0 top-0 z-[90] flex h-full w-full max-w-[440px] flex-col bg-[var(--bg-travertine)] shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="border-b border-[var(--border-hairline)] px-7 pb-6 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
              <h2 className="font-serif-editorial mt-3 text-4xl font-light leading-none">{rich(t.title, 'text-[var(--gold-vermeil)]')}</h2>
            </div>
            <button ref={closeBtn} type="button" onClick={closeAsk} aria-label={t.close} className="-mr-2 p-2 transition-transform hover:rotate-90"><X size={20} strokeWidth={1.4} /></button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
            <span className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--text-linen)]'}`} aria-hidden /> {status.label}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{t.answer}</p>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-7" data-lenis-prevent>
          {pieces.length > 0 && (
            <div className="mb-7">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.about}</p>
              <div className="flex flex-wrap gap-2">
                {pieces.map((p) => (
                  <span key={p.slug} className="flex items-center gap-2.5 border border-[var(--border-hairline)] py-1 pl-1 pr-3 text-[13px]">
                    <img src={p.images[0]} alt="" className="h-9 w-7 object-cover" />
                    <span className="font-serif-editorial text-base">{catalog.name(p)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <ul className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
            {ways.map(({ icon: Icon, copy, href, external }) => (
              <li key={copy[0]}>
                <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="group flex items-center gap-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] text-[var(--gold-vermeil)] transition-colors group-hover:border-[var(--text-espresso)]"><Icon size={16} strokeWidth={1.3} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{copy[0]}</span>
                    <span className="block truncate text-xs text-[var(--text-taupe)]">{copy[1]}</span>
                  </span>
                </a>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => openVisit({ pieces: about.map((slug) => ({ slug })) })} className="group flex w-full items-center gap-4 py-4 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] text-[var(--gold-vermeil)] transition-colors group-hover:border-[var(--text-espresso)]"><CalendarHeart size={16} strokeWidth={1.3} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{t.visit[0]}</span>
                  <span className="block text-xs text-[var(--text-taupe)]">{t.visit[1]}</span>
                </span>
              </button>
            </li>
          </ul>

          <div className="mt-10">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em]"><PhoneIncoming size={14} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {t.back}</p>
            {sent ? (
              <p role="status" className="font-serif-editorial mt-6 text-2xl italic leading-snug text-[var(--text-taupe)]">{t.called(name.trim().split(' ')[0], t.callWhen[when])}</p>
            ) : (
              <form onSubmit={callBack} noValidate className="mt-6 space-y-5">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.2em]">{t.name}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2.5 outline-none focus:border-[var(--gold-vermeil)]" />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.2em]">{t.phone}</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="font-spec mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2.5 outline-none focus:border-[var(--gold-vermeil)]" />
                </label>
                <div role="group" aria-label={t.back} className="flex flex-wrap gap-2">
                  {WHENS.map((w) => <button key={w} type="button" aria-pressed={when === w} onClick={() => setWhen(w)} className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${when === w ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}>{t.whens[w]}</button>)}
                </div>
                {error && <p role="alert" className="text-xs text-red-700">{t.missing}</p>}
                <button type="submit" className={`${btnPrimary} w-full`}>{t.request}</button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
