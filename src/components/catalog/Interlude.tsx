import { X } from 'lucide-react'
import { IMG, pic } from '../../data/catalog'
import type { VisitPurpose } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import VisitButton from '../visit/VisitButton'

const WEEK = 7 * 24 * 3600_000

const COPY = bilingual(
  {
    eyebrow: 'Le Salon',
    title: 'Most clients see their piece <em>in person</em> first.',
    text: 'Tell us what you love: it will be waiting on a velvet tray, in your size.',
    nudgeTitle: (n: number) => `You’ve looked at ${n} pieces. Would you like to see them <em>in person</em>?`,
    nudgeText: 'We’ll have them ready for you, with an espresso and no hurry.',
    dismiss: 'Not now',
    alt: 'A velvet tray of pieces, ready for a visit',
  },
  {
    eyebrow: 'Le Salon',
    title: 'La plupart de nos clients voient leur pièce <em>en personne</em> d’abord.',
    text: 'Dites-nous ce que vous aimez : tout vous attendra sur un plateau de velours, à votre taille.',
    nudgeTitle: (n) => `Vous avez regardé ${n} pièces. Aimeriez-vous les voir <em>en personne</em>?`,
    nudgeText: 'Nous les préparerons pour vous, avec un espresso et tout votre temps.',
    dismiss: 'Pas maintenant',
    alt: 'Un plateau de velours, prêt pour une visite',
  },
)

/** The card a chapter sets among its pieces: an invitation to see them in the salon. For a visitor who has been
 *  looking for a while (three pieces viewed or two saved) it speaks to them, once a week at most, and steps back to the
 *  plain invitation when dismissed. Never a pop-up. */
export default function Interlude({ purpose }: { purpose?: VisitPurpose }) {
  const { recent, wishlist, nudgeAt, dismissNudge } = useStore()
  const t = useCopy(COPY)
  const looked = [...new Set([...recent, ...wishlist])]
  const nudge = (recent.length >= 3 || wishlist.length >= 2) && Date.now() - nudgeAt > WEEK
  const pieces = looked.slice(0, 6).map((slug) => ({ slug }))
  return (
    <aside className="relative grid items-center gap-8 bg-[var(--bg-silk)] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div data-reveal-img className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:h-full">
        <img {...pic(IMG.tray, '(min-width: 640px) 40vw, 100vw')} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="px-6 pb-10 sm:py-12 sm:pr-12 lg:py-16">
        <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
        <p className="font-serif-editorial mt-4 max-w-xl text-3xl font-light leading-tight lg:text-[2.6rem]">{rich(nudge ? t.nudgeTitle(looked.length) : t.title, 'text-[var(--gold-vermeil)]')}</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-taupe)]">{nudge ? t.nudgeText : t.text}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <VisitButton request={{ purpose, pieces: nudge ? pieces : [] }} />
          {nudge && <button type="button" onClick={dismissNudge} className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">{t.dismiss}</button>}
        </div>
      </div>
      {nudge && <button type="button" onClick={dismissNudge} aria-label={t.dismiss} className="absolute right-3 top-3 p-2 text-[var(--text-taupe)] hover:text-[var(--text-espresso)]"><X size={16} strokeWidth={1.4} /></button>}
    </aside>
  )
}
