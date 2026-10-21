import { MessageCircle } from 'lucide-react'
import { IMG, pic } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import type { VisitPiece, VisitPurpose } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import { btnQuiet } from '../ui'
import NextTimes from './NextTimes'
import VisitButton from './VisitButton'

const COPY = bilingual(
  {
    eyebrow: 'Le Salon · rue Sherbrooke',
    one: 'See it <em>in person</em>.',
    many: 'See them <em>in person</em>.',
    text: 'We’ll have it waiting on a velvet tray, in your size, with an espresso and no hurry.',
    textMany: 'We’ll have them waiting on a velvet tray, in your size, with an espresso and no hurry.',
    ask: 'Ask a jeweller',
    alt: 'The salon on rue Sherbrooke Ouest',
  },
  {
    eyebrow: 'Le Salon · rue Sherbrooke',
    one: 'Venez la <em>voir</em>.',
    many: 'Venez les <em>voir</em>.',
    text: 'Elle vous attendra sur un plateau de velours, à votre taille, avec un espresso et tout votre temps.',
    textMany: 'Elles vous attendront sur un plateau de velours, à votre taille, avec un espresso et tout votre temps.',
    ask: 'Parler à un joaillier',
    alt: 'Le salon, rue Sherbrooke Ouest',
  },
)

interface Props {
  pieces?: VisitPiece[]
  purpose?: VisitPurpose
  className?: string
}

/** "See it in person": the salon, the next free times and the two ways in (book a visit, ask a jeweller), with the
 *  pieces on screen attached to the booking. Closes product pages, chapters and the wishlist. */
export default function VisitBand({ pieces = [], purpose, className = '' }: Props) {
  const { openAsk } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const many = pieces.length > 1
  return (
    <section className={`bg-[var(--bg-silk)] ${className}`}>
      <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
        <div data-reveal-img className="relative aspect-[4/3] overflow-hidden lg:col-span-6">
          <img data-parallax {...pic(IMG.salon, '(min-width: 1024px) 50vw, 100vw')} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-5xl font-light leading-[1] tracking-[-0.02em] lg:text-7xl">{rich(many ? t.many : t.one, 'text-[var(--gold-vermeil)]')}</h2>
          <p data-reveal="0.1" className="mt-6 max-w-md leading-relaxed text-[var(--text-taupe)]">{many ? t.textMany : t.text}</p>
          <p data-reveal="0.12" className="mt-3 max-w-md text-sm text-[var(--text-taupe)]">{house.visitLength}</p>
          <div data-reveal="0.15"><NextTimes purpose={purpose} pieces={pieces} className="mt-10" /></div>
          <div data-reveal="0.2" className="mt-10 flex flex-wrap gap-3">
            <VisitButton request={{ purpose, pieces }} />
            <button type="button" onClick={() => openAsk(pieces.map((p) => p.slug))} className={btnQuiet}><MessageCircle size={14} strokeWidth={1.3} /> {t.ask}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
