import { Clock, MapPin, Phone } from 'lucide-react'
import { IMG, pic } from '../../data/catalog'
import { SALON, salonDial, salonStatus, salonWeek } from '../../data/salon'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import NextTimes from '../visit/NextTimes'
import VisitButton from '../visit/VisitButton'

const COPY = bilingual(
  {
    alt: 'Teresa & Sons salon',
    eyebrow: 'Le Salon',
    title: 'Come <em>sit</em> with us.',
    text: 'An espresso, a velvet tray, and as much time as you need. Appointments recommended, walk-ins always welcome.',
    book: 'Book a visit',
    directions: 'Get directions',
  },
  {
    alt: 'Le salon Teresa & Sons',
    eyebrow: 'Le salon',
    title: 'Venez vous <em>asseoir</em> avec nous.',
    text: 'Un espresso, un plateau de velours et tout le temps qu’il vous faut. Le rendez-vous est recommandé, mais notre porte est toujours ouverte.',
    book: 'Prendre rendez-vous',
    directions: 'Obtenir l’itinéraire',
  },
)

/** The salon on rue Sherbrooke: the address, the hours with today's status, the telephone, the next free times and
 *  the way in. */
export default function VisitSalon() {
  const t = useCopy(COPY)
  const status = salonStatus()
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden">
          <img data-parallax {...pic(IMG.salon, '(min-width: 1024px) 50vw, 100vw')} alt={t.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        </div>
        <div className="px-6 py-24 lg:px-20 lg:py-32">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-5 text-5xl font-light leading-[1.02] lg:text-7xl">
            {rich(t.title, 'text-[var(--gold-champagne)]')}
          </h2>
          <p data-reveal="0.1" className="mt-6 max-w-md text-white/70">{t.text}</p>
          <ul data-reveal="0.15" className="mt-12 space-y-5 text-sm">
            <li className="flex gap-4"><MapPin size={18} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-champagne)]" /> {SALON.street}, {SALON.city}</li>
            <li className="flex gap-4"><Clock size={18} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-champagne)]" /> <span>{salonWeek()}<span className="font-spec mt-1 block text-[10px] uppercase tracking-[0.2em] text-[var(--gold-champagne)]">{status.label}</span></span></li>
            <li className="flex gap-4"><Phone size={18} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-champagne)]" /> <a href={`tel:${salonDial()}`} className="font-spec hover:text-[var(--gold-champagne)]">{SALON.phone}</a></li>
          </ul>
          <div data-reveal="0.18"><NextTimes tone="dark" className="mt-12" /></div>
          <div data-reveal="0.2" className="mt-10 flex flex-wrap items-center gap-6">
            <VisitButton tone="dark">{t.book}</VisitButton>
            <a href={SALON.maps} target="_blank" rel="noreferrer" className="border-b border-white/40 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--gold-champagne)]">{t.directions}</a>
          </div>
        </div>
      </div>
    </section>
  )
}
