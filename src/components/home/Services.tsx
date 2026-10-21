import { Gem, PenLine, Ruler, ShieldCheck, Truck, CalendarHeart } from 'lucide-react'
import { bilingual, useCopy } from '../../i18n'
import { href, useStore } from '../../store'

const ICONS = [Truck, ShieldCheck, PenLine, Ruler, Gem, CalendarHeart]

const COPY = bilingual(
  {
    // [title, detail]; shipping has a line per market.
    shipping: { CAD: ['Insured shipping', 'Complimentary across Canada, signature required.'], USD: ['Insured shipping', 'Complimentary to the U.S., duties prepaid.'] } as Record<'CAD' | 'USD', [string, string]>,
    others: [
      ['Lifetime warranty', 'Annual cleaning, claw checks and rhodium refresh.'],
      ['Free engraving', 'Hand or laser engraved, up to 18 characters.'],
      ['Complimentary sizing', 'One resize within the first year, on us.'],
      ['GIA certified', 'Every diamond over 0.50 ct comes with its report.'],
      ['Private appointments', 'In salon on Sherbrooke or by video, seven days.'],
    ] as [string, string][],
    questions: 'Questions?',
    concierge: 'Speak with our concierge',
  },
  {
    shipping: { CAD: ['Livraison assurée', 'Offerte partout au Canada, signature requise.'], USD: ['Livraison assurée', 'Offerte aux États-Unis, droits de douane prépayés.'] },
    others: [
      ['Garantie à vie', 'Nettoyage annuel, vérification des griffes et rhodiage.'],
      ['Gravure offerte', 'À la main ou au laser, jusqu’à 18 caractères.'],
      ['Mise à la taille offerte', 'Un ajustement de taille la première année, à nos frais.'],
      ['Certifié GIA', 'Chaque diamant de plus de 0,50 ct est accompagné de son rapport.'],
      ['Rendez-vous privés', 'Au salon de la rue Sherbrooke ou par vidéo, sept jours sur sept.'],
    ],
    questions: 'Des questions?',
    concierge: 'Parlez à notre concierge',
  },
)

export default function Services() {
  const { currency } = useStore()
  const copy = useCopy(COPY)
  const items = [copy.shipping[currency], ...copy.others].map(([t, d], i) => ({ icon: ICONS[i], t, d }))
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
        {copy.questions} <a href={href.atelier} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{copy.concierge}</a>
      </p>
    </section>
  )
}
