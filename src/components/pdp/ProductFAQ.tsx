import type { Product } from '../../data/catalog'
import { href } from '../../store'
import Accordion from './Accordion'
import SectionHeader from '../home/SectionHeader'

const BASE = [
  { id: 'auth', title: 'How do I know my piece is authentic?', content: 'Every piece is hallmarked with our maker’s mark and metal purity, and arrives with a Teresa & Sons certificate of authenticity. Diamonds over 0.50 ct include their original GIA report.' },
  { id: 'ship', title: 'Do you ship to the United States?', content: 'Yes. U.S. orders are priced in USD and shipped insured with duties and import fees prepaid — there is nothing to pay on delivery. Canadian orders ship free in CAD.' },
  { id: 'return', title: 'What is your return policy?', content: 'Non-personalized pieces may be returned within 30 days in original condition. Engraved, resized or made-to-order pieces are final sale, though we will always work with you to make it right.' },
  { id: 'pay', title: 'Can I pay in instalments?', content: 'Yes — Shop Pay Installments lets you split your purchase into four interest-free payments, or monthly plans on orders over $1,000, subject to approval.' },
]

const BY_CAT: Record<string, { id: string; title: string; content: string }[]> = {
  bridal: [
    { id: 'conflict', title: 'Are your diamonds conflict-free?', content: 'All diamonds are sourced in compliance with the Kimberley Process and our suppliers adhere to the System of Warranties. Canadian-mined stones are available on request.' },
    { id: 'size-surprise', title: 'Proposing as a surprise — what if the size is wrong?', content: 'Choose your best estimate. We include one complimentary resize within the first year, and can ship a discreet ring sizer in the meantime.' },
  ],
  rentals: [
    { id: 'deposit', title: 'How does the deposit work?', content: 'A refundable deposit is pre-authorised on your card at reservation and released within 48 hours of the piece being returned and inspected.' },
    { id: 'damage', title: 'What if something happens during my rental?', content: 'Every rental is fully insured. Minor wear is expected and covered; we only ask that loss or significant damage be reported within 24 hours.' },
  ],
  watches: [
    { id: 'warranty', title: 'What warranty comes with my watch?', content: 'Each watch carries the manufacturer’s international warranty plus our own five-year service plan, including one complimentary regulation.' },
  ],
}

export default function ProductFAQ({ product, index }: { product: Product; index: string }) {
  const items = [...(BY_CAT[product.category] ?? []), ...BASE]
  return (
    <section className="mx-auto grid max-w-[1600px] gap-12 border-t border-[var(--border-hairline)] px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
      <div className="lg:col-span-4">
        <SectionHeader index={index} eyebrow="Questions" title={<>Before you <em className="text-[var(--gold-vermeil)]">decide</em></>} />
        <p className="-mt-6 max-w-xs text-sm text-[var(--text-taupe)]">Can’t find your answer? Our concierge replies within the hour, Tuesday to Saturday.</p>
        <a href={href.atelier} className="link-line mt-8">Contact concierge</a>
      </div>
      <div className="lg:col-span-7 lg:col-start-6 lg:pt-24" data-reveal>
        <Accordion items={items} defaultOpen={items[0].id} />
      </div>
    </section>
  )
}
