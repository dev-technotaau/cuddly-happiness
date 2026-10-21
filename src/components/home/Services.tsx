import { Gem, PenLine, Ruler, ShieldCheck, Truck, CalendarHeart } from 'lucide-react'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import SectionHeader from './SectionHeader'

const ICONS = [Truck, ShieldCheck, PenLine, Ruler, Gem, CalendarHeart]

const COPY = bilingual(
  {
    eyebrow: 'Our promise',
    title: 'Cared for, <em>for life</em>.',
    // [title, detail]; shipping has a line per market.
    shipping: { CAD: ['Insured shipping', 'Complimentary across Canada, signature required.'], USD: ['Insured shipping', 'Complimentary to the U.S., duties prepaid.'] } as Record<'CAD' | 'USD', [string, string]>,
    others: [
      ['Lifetime warranty', 'Annual cleaning, claw checks and rhodium refresh.'],
      ['Free engraving', 'Hand or laser engraved, up to 18 characters.'],
      ['Complimentary sizing', 'One resize within the first year, on us.'],
      ['GIA certified', 'Every diamond over 0.50 ct comes with its report.'],
      ['Private visits', 'In the salon on Sherbrooke, by video or by phone, Tuesday to Sunday.'],
    ] as [string, string][],
    questions: 'Questions?',
    concierge: 'Ask a jeweller',
  },
  {
    eyebrow: 'Notre engagement',
    title: 'Entretenue <em>à vie</em>.',
    shipping: { CAD: ['Livraison assurée', 'Offerte partout au Canada, signature requise.'], USD: ['Livraison assurée', 'Offerte aux États-Unis, droits de douane prépayés.'] },
    others: [
      ['Garantie à vie', 'Nettoyage annuel, vérification des griffes et rhodiage.'],
      ['Gravure offerte', 'À la main ou au laser, jusqu’à 18 caractères.'],
      ['Mise à la taille offerte', 'Un ajustement de taille la première année, à nos frais.'],
      ['Certifié GIA', 'Chaque diamant de plus de 0,50 ct est accompagné de son rapport.'],
      ['Visites privées', 'Au salon de la rue Sherbrooke, par vidéo ou par téléphone, du mardi au dimanche.'],
    ],
    questions: 'Des questions?',
    concierge: 'Parler à un joaillier',
  },
)

/** Our promise: what comes with every piece (shipping by market, lifetime care, engraving, sizing, GIA, visits) and
 *  the returns policy. */
export default function Services({ index }: { index: string }) {
  const { currency, openAsk } = useStore()
  const copy = useCopy(COPY)
  const house = useCopy(HOUSE)
  const items = [copy.shipping[currency], ...copy.others].map(([t, d], i) => ({ icon: ICONS[i], t, d }))
  return (
    <section className="bg-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
        <SectionHeader index={index} eyebrow={copy.eyebrow} title={rich(copy.title, 'text-[var(--gold-vermeil)]')} aside={<p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">{house.returns}</p>} />
        <div className="grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, t, d }, i) => (
            <div key={t} data-reveal={(i % 3) * 0.06} className="group bg-[var(--bg-travertine)] p-10 transition-colors hover:bg-[var(--bg-silk)] max-[360px]:p-7">
              <Icon size={22} strokeWidth={1.2} className="text-[var(--gold-vermeil)] transition-transform duration-500 group-hover:-translate-y-1" />
              <h3 className="font-serif-editorial mt-8 text-3xl wrap-anywhere">{t}</h3>
              <p className="mt-3 text-sm text-[var(--text-taupe)]">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-[var(--text-taupe)]">
          {copy.questions} <button type="button" onClick={() => openAsk()} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{copy.concierge}</button>
        </p>
      </div>
    </section>
  )
}
