import { Gem, PenLine, Ruler, ShieldCheck, Truck, CalendarHeart } from 'lucide-react'
import { href, useStore } from '../../store'

export default function Services() {
  const { currency } = useStore()
  const items = [
    { icon: Truck, t: 'Insured shipping', d: currency === 'CAD' ? 'Complimentary across Canada, signature required.' : 'Complimentary to the U.S., duties prepaid.' },
    { icon: ShieldCheck, t: 'Lifetime warranty', d: 'Annual cleaning, claw checks and rhodium refresh.' },
    { icon: PenLine, t: 'Free engraving', d: 'Hand or laser engraved, up to 18 characters.' },
    { icon: Ruler, t: 'Complimentary sizing', d: 'One resize within the first year, on us.' },
    { icon: Gem, t: 'GIA certified', d: 'Every diamond over 0.50 ct comes with its report.' },
    { icon: CalendarHeart, t: 'Private appointments', d: 'In salon on Sherbrooke or by video, seven days.' },
  ]
  return (
    <section className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12">
      <div className="grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, t, d }, i) => (
          <div key={t} data-reveal={(i % 3) * 0.06} className="group bg-[var(--bg-travertine)] p-10 transition-colors hover:bg-[var(--bg-silk)]">
            <Icon size={22} strokeWidth={1.2} className="text-[var(--gold-vermeil)] transition-transform duration-500 group-hover:-translate-y-1" />
            <h3 className="font-serif-editorial mt-8 text-3xl">{t}</h3>
            <p className="mt-3 text-sm text-[var(--text-taupe)]">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-[var(--text-taupe)]">
        Questions? <a href={href.atelier} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">Speak with our concierge</a>
      </p>
    </section>
  )
}
