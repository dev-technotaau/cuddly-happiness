import { CalendarHeart, Heart } from 'lucide-react'
import { formatDay, getProduct, parseIso, type Product } from '../../data/catalog'
import { VISIT_COPY, formatTime, upcoming } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'

const COPY = bilingual(
  {
    eyebrow: 'Welcome back',
    greeting: (name: string) => `Good to see you again, <em>${name}</em>.`,
    greetingNone: 'Good to see you <em>again</em>.',
    visit: 'Your visit',
    change: 'Change',
    shortlist: (n: number) => `Your shortlist · ${n} piece${n === 1 ? '' : 's'}`,
    see: 'Book a visit to see them',
    open: 'Open your wishlist',
  },
  {
    eyebrow: 'Bon retour',
    greeting: (name) => `Heureux de vous revoir, <em>${name}</em>.`,
    greetingNone: 'Heureux de vous <em>revoir</em>.',
    visit: 'Votre visite',
    change: 'Modifier',
    shortlist: (n) => `Votre sélection · ${n} pièce${n < 2 ? '' : 's'}`,
    see: 'Prendre rendez-vous pour les voir',
    open: 'Ouvrir votre liste de souhaits',
  },
)

/** For a returning visitor: their next visit and their shortlist (the wishlist), each one tap from booking or changing.
 *  Renders nothing for a first visit; "Recently viewed" follows it on Home. */
export default function WelcomeBack() {
  const { user, visits, wishlist, openVisit } = useStore()
  const t = useCopy(COPY)
  const v = useCopy(VISIT_COPY)
  const catalog = useCatalog()
  const next = upcoming(visits)[0]
  const saved = wishlist.map(getProduct).filter((p): p is Product => !!p)
  if (!next && saved.length === 0) return null
  const first = user?.name.split(' ')[0]

  return (
    <section className="border-b border-[var(--border-hairline)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 lg:grid-cols-12 lg:px-12">
        <div className="lg:col-span-4">
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
          <p className="font-serif-editorial mt-3 text-4xl font-light leading-tight">{rich(first ? t.greeting(first) : t.greetingNone, 'text-[var(--gold-vermeil)]')}</p>
        </div>
        {next && (
          <div className="flex items-center gap-5 border border-[var(--border-hairline)] p-5 lg:col-span-4">
            <CalendarHeart size={22} strokeWidth={1.2} className="shrink-0 text-[var(--gold-vermeil)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.visit} · {v.modes[next.mode]}</p>
              <p className="mt-1"><span className="inline-block first-letter:uppercase">{formatDay(parseIso(next.date), { weekday: 'long', day: 'numeric', month: 'long' })}</span> · <span className="font-spec">{formatTime(next.time)}</span></p>
            </div>
            <button type="button" onClick={() => openVisit({ change: next.id })} className="link-line shrink-0">{t.change}</button>
          </div>
        )}
        {saved.length > 0 && (
          <div className={`flex items-center gap-5 ${next ? 'lg:col-span-4' : 'lg:col-span-8'}`}>
            <a href={href.wishlist} aria-label={t.open} className="flex shrink-0 -space-x-3">
              {saved.slice(0, 3).map((p) => <img key={p.slug} src={p.images[0]} alt="" className="h-14 w-11 border-2 border-[var(--bg-travertine)] object-cover" />)}
            </a>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]"><Heart size={12} strokeWidth={1.4} /> {t.shortlist(saved.length)}</p>
              <p className="mt-1 truncate font-serif-editorial text-lg">{saved.slice(0, 3).map(catalog.name).join(' · ')}</p>
              <button type="button" onClick={() => openVisit({ pieces: saved.slice(0, 6).map((p) => ({ slug: p.slug, metal: p.metals[0] })) })} className="mt-2 text-[11px] uppercase tracking-[0.2em] underline decoration-[var(--gold-vermeil)] underline-offset-4">{t.see}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
