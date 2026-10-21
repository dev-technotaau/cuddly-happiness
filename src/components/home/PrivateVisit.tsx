import { IMG, pic } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import NextTimes from '../visit/NextTimes'
import VisitButton from '../visit/VisitButton'
import SectionHeader from './SectionHeader'

const COPY = bilingual(
  {
    eyebrow: 'The private visit',
    title: 'An hour that is <em>yours</em>.',
    steps: [
      ['Choose a time', 'In the salon, by video or by phone, Tuesday to Sunday.'],
      ['We prepare your pieces', 'Tell us what you love: it waits on a velvet tray, in your size.'],
      ['Take your time', 'An espresso, the loupe, and no hurry: 45 minutes, an hour for a ring.'],
      ['Decide when you’re ready', 'Take it home, reserve it, or think it over. Never an obligation.'],
    ] as [string, string][],
    alt: 'A velvet tray of pieces, prepared for a visit',
  },
  {
    eyebrow: 'La visite privée',
    title: 'Une heure rien qu’à <em>vous</em>.',
    steps: [
      ['Choisissez un moment', 'Au salon, par vidéo ou par téléphone, du mardi au dimanche.'],
      ['Nous préparons vos pièces', 'Dites-nous ce que vous aimez : tout vous attend sur un plateau de velours, à votre taille.'],
      ['Prenez votre temps', 'Un espresso, la loupe, et aucune hâte : 45 minutes, une heure pour une bague.'],
      ['Décidez quand vous voulez', 'Repartez avec, réservez-la, ou prenez le temps d’y penser. Jamais d’engagement.'],
    ],
    alt: 'Un plateau de velours, préparé pour une visite',
  },
)

/** The private visit, step by step: what happens between booking and deciding, so the salon feels close before the
 *  door is opened. */
export default function PrivateVisit({ index }: { index: string }) {
  const t = useCopy(COPY)
  return (
    <section className="bg-[var(--bg-silk)]">
      <div className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
        <SectionHeader index={index} eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-vermeil)]')} />
        <div className="grid items-start gap-16 lg:grid-cols-12">
          <div data-reveal-img className="relative aspect-[4/5] overflow-hidden lg:col-span-5">
            <img data-parallax {...pic(IMG.tray, '(min-width: 1024px) 40vw, 100vw')} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ol className="border-t border-[var(--border-hairline)]">
              {t.steps.map(([title, text], i) => (
                <li key={title} data-reveal={i * 0.06} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--border-hairline)] py-7">
                  <span className="font-serif-editorial text-4xl font-light italic leading-none text-[var(--gold-vermeil)]">{i + 1}</span>
                  <span>
                    <span className="font-serif-editorial block text-3xl leading-tight">{title}</span>
                    <span className="mt-2 block max-w-md text-[var(--text-taupe)]">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div data-reveal="0.2" className="mt-12"><NextTimes /></div>
            <div data-reveal="0.25" className="mt-10"><VisitButton /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
