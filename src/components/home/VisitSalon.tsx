import { Clock, MapPin, Phone } from 'lucide-react'
import { IMG } from '../../data/catalog'
import { href } from '../../store'

export default function VisitSalon() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden">
          <img data-parallax src={IMG.jewelryFlat} alt="Teresa & Sons salon" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        </div>
        <div className="px-6 py-24 lg:px-20 lg:py-32">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">Le Salon</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-5 text-5xl font-light leading-[1.02] lg:text-7xl">
            Come <em className="text-[var(--gold-champagne)]">sit</em> with us.
          </h2>
          <p data-reveal="0.1" className="mt-6 max-w-md text-white/70">An espresso, a velvet tray, and as much time as you need. Appointments recommended, walk-ins always welcome.</p>
          <ul data-reveal="0.15" className="mt-12 space-y-5 text-sm">
            <li className="flex gap-4"><MapPin size={18} strokeWidth={1.3} className="mt-0.5 text-[var(--gold-champagne)]" /> 1420 rue Sherbrooke Ouest, Montréal, QC H3G 1K4</li>
            <li className="flex gap-4"><Clock size={18} strokeWidth={1.3} className="mt-0.5 text-[var(--gold-champagne)]" /> Tuesday – Saturday, 10h – 18h · Sunday by appointment</li>
            <li className="flex gap-4"><Phone size={18} strokeWidth={1.3} className="mt-0.5 text-[var(--gold-champagne)]" /> <span className="font-spec">+1 514 555 0162</span></li>
          </ul>
          <div data-reveal="0.2" className="mt-12 flex flex-wrap gap-6">
            <a href={href.atelier} className="bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">Book an appointment</a>
            <a href="https://maps.google.com/?q=Rue+Sherbrooke+Ouest+Montreal" target="_blank" rel="noreferrer" className="border-b border-white/40 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--gold-champagne)]">Get directions</a>
          </div>
        </div>
      </div>
    </section>
  )
}
