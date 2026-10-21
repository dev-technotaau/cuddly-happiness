import { isRentable, type Product } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import Accordion from './Accordion'
import SectionHeader from '../home/SectionHeader'

type Faq = { id: string; title: string; content: string }

const COPY = bilingual(
  {
    base: [
      { id: 'auth', title: 'How do I know my piece is authentic?', content: 'Every piece is hallmarked with our maker’s mark and metal purity, and arrives with a Teresa & Sons certificate of authenticity. Diamonds over 0.50 ct include their original GIA report.' },
      { id: 'ship', title: 'Do you ship to the United States?', content: 'Yes. U.S. orders are priced in USD and shipped insured with duties and import fees prepaid — there is nothing to pay on delivery. Canadian orders ship free in CAD.' },
      { id: 'return', title: 'What is your return policy?', content: 'Unworn pieces may be returned within 30 days, and the return is on us. Engraved, personalized and made-to-order pieces are final sale, though we will always work with you to make it right.' },
      { id: 'pay', title: 'Can I pay in instalments?', content: 'Yes — Shop Pay Installments lets you split your purchase into four interest-free payments, or monthly plans on orders over $1,000, subject to approval.' },
    ] as Faq[],
    byCategory: {
      bridal: [
        { id: 'conflict', title: 'Are your diamonds conflict-free?', content: 'All diamonds are sourced in compliance with the Kimberley Process and our suppliers adhere to the System of Warranties. Canadian-mined stones are available on request.' },
        { id: 'size-surprise', title: 'Proposing as a surprise — what if the size is wrong?', content: 'Choose your best estimate. We include one complimentary resize within the first year, and can ship a discreet ring sizer in the meantime.' },
        { id: 'natural', title: 'Natural or lab-grown?', content: 'We set natural diamonds only, each with its GIA report. If you have a stone in mind, a shape or a size, we source it for your visit.' },
      ],
      rentals: [
        { id: 'deposit', title: 'How does the deposit work?', content: 'A refundable deposit is pre-authorized on your card at reservation and released within 48 hours of the piece being returned and inspected.' },
        { id: 'damage', title: 'What if something happens during my rental?', content: 'Every rental is fully insured. Minor wear is expected and covered; we only ask that loss or significant damage be reported within 24 hours.' },
      ],
      watches: [
        { id: 'warranty', title: 'What warranty comes with my watch?', content: 'Each watch carries the manufacturer’s international warranty plus our own five-year service plan, including one complimentary regulation.' },
      ],
    } as Record<string, Faq[]>,
    eyebrow: 'Questions',
    title: 'Before you <em>decide</em>',
    concierge: 'Can’t find your answer? A jeweller replies within the hour, Tuesday to Saturday.',
    contact: 'Ask a jeweller',
    credit: { id: 'credit', title: 'Can I rent it before I buy it?', content: 'Yes. Rent it for an evening, a week or a month; if you decide to keep it within 60 days, your rental fee counts toward the price.' },
  },
  {
    base: [
      { id: 'auth', title: 'Comment savoir si ma pièce est authentique?', content: 'Chaque pièce porte notre poinçon de maître et le titre de son métal, et arrive avec un certificat d’authenticité Teresa & Sons. Les diamants de plus de 0,50 ct sont accompagnés de leur rapport GIA original.' },
      { id: 'ship', title: 'Livrez-vous aux États-Unis?', content: 'Oui. Les commandes américaines sont facturées en dollars américains et expédiées assurées, droits et frais d’importation prépayés — rien à payer à la livraison. Les commandes canadiennes sont livrées gratuitement, en dollars canadiens.' },
      { id: 'return', title: 'Quelle est votre politique de retour?', content: 'Les pièces non portées peuvent être retournées dans les 30 jours, sans frais. Les pièces gravées, personnalisées ou faites sur commande sont des ventes finales, mais nous trouverons toujours une solution avec vous.' },
      { id: 'pay', title: 'Puis-je payer en plusieurs versements?', content: 'Oui — Shop Pay en versements vous permet de répartir votre achat en quatre paiements sans intérêt, ou en mensualités pour les commandes de plus de 1 000 $, sous réserve d’approbation.' },
    ],
    byCategory: {
      bridal: [
        { id: 'conflict', title: 'Vos diamants sont-ils exempts de conflits?', content: 'Tous nos diamants sont achetés conformément au Processus de Kimberley, et nos fournisseurs adhèrent au Système de garanties. Des pierres extraites au Canada sont offertes sur demande.' },
        { id: 'size-surprise', title: 'Une demande surprise — et si la taille n’est pas la bonne?', content: 'Choisissez votre meilleure estimation. Un ajustement de taille est offert la première année, et nous pouvons vous envoyer un baguier discret d’ici là.' },
        { id: 'natural', title: 'Diamant naturel ou de laboratoire?', content: 'Nous ne sertissons que des diamants naturels, chacun avec son rapport GIA. Vous avez une pierre en tête, une forme, une taille ? Nous la trouvons pour votre visite.' },
      ],
      rentals: [
        { id: 'deposit', title: 'Comment fonctionne le dépôt?', content: 'Un dépôt remboursable est préautorisé sur votre carte au moment de la réservation, puis libéré dans les 48 heures suivant le retour et l’inspection de la pièce.' },
        { id: 'damage', title: 'Et s’il arrive quelque chose pendant ma location?', content: 'Chaque location est entièrement assurée. L’usure légère est normale et couverte; nous vous demandons seulement de signaler toute perte ou tout dommage important dans les 24 heures.' },
      ],
      watches: [
        { id: 'warranty', title: 'Quelle garantie accompagne ma montre?', content: 'Chaque montre bénéficie de la garantie internationale du fabricant et de notre propre plan d’entretien de cinq ans, avec un réglage offert.' },
      ],
    },
    eyebrow: 'Questions',
    title: 'Avant de <em>décider</em>',
    concierge: 'Vous ne trouvez pas votre réponse? Un joaillier vous répond en moins d’une heure, du mardi au samedi.',
    contact: 'Parler à un joaillier',
    credit: { id: 'credit', title: 'Puis-je la louer avant de l’acheter?', content: 'Oui. Louez-la le temps d’un soir, d’une semaine ou d’un mois ; si vous décidez de la garder dans les 60 jours, vos frais de location sont déduits du prix.' },
  },
)

export default function ProductFAQ({ product, index }: { product: Product; index: string }) {
  const { openAsk } = useStore()
  const t = useCopy(COPY)
  // A rentable piece answers the rental questions too, wherever its chapter: renting first, then the deposit and cover.
  const chapter = t.byCategory[product.category] ?? []
  const items = [...(isRentable(product) ? [t.credit, ...(product.category === 'rentals' ? [] : t.byCategory.rentals)] : []), ...chapter, ...t.base]
  return (
    <section className="mx-auto grid max-w-[1600px] gap-12 border-t border-[var(--border-hairline)] px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
      <div className="lg:col-span-4">
        <SectionHeader index={index} eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-vermeil)]')} />
        <p className="-mt-6 max-w-xs text-sm text-[var(--text-taupe)]">{t.concierge}</p>
        <button type="button" onClick={() => openAsk([product.slug])} className="link-line mt-8">{t.contact}</button>
      </div>
      <div className="lg:col-span-7 lg:col-start-6 lg:pt-24" data-reveal>
        <Accordion items={items} defaultOpen={items[0].id} />
      </div>
    </section>
  )
}
