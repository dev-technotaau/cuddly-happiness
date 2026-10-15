import { METALS, formatDay, parseIso, rentalReturnDate, type Product } from '../data/catalog'
import type { CartLine } from '../store'
import { describePersonalization } from './pdp/Personalizer'
import { DESIGNS } from '../data/giftcards'

const RENTAL_LABEL = { weekend: 'Weekend rental', week: 'One-week rental', month: 'One-month rental' }

/** Human-readable option lines for a cart line, shared by the bag and checkout. */
export function lineDetails(line: CartLine, product: Product): string[] {
  const out: string[] = []
  const g = line.giftCard
  if (g) {
    out.push(`${DESIGNS.find((d) => d.id === g.design)?.name ?? ''} design · ${g.delivery === 'email' ? 'Digital' : 'Physical card'}`)
    if (g.toSelf) out.push('For me')
    else out.push(`To ${g.recipientName}${g.recipientEmail ? ` · ${g.recipientEmail}` : ''}`)
    if (g.sendOn) out.push(`Sends ${formatDay(parseIso(g.sendOn))}`)
    if (g.message) out.push(`“${g.message.length > 40 ? g.message.slice(0, 40) + '…' : g.message}”`)
    return out
  }
  if (line.rental) out.push(RENTAL_LABEL[line.rental])
  else if (line.metal) out.push(METALS[line.metal].label)
  if (line.size) out.push(`Size ${line.size}`)
  if (line.booking && line.rental) {
    const start = parseIso(line.booking.start)
    const end = rentalReturnDate(line.booking.start, line.rental)
    out.push(`${formatDay(start)} → ${formatDay(end)}`)
    out.push(`${line.booking.method === 'salon' ? 'Salon fitting' : 'Courier'} · ${line.booking.slot}`)
  }
  if (line.personalization) out.push(describePersonalization(line.personalization))
  if (line.engraving) out.push(`${product.personalization ? 'Reverse' : 'Engraving'}: “${line.engraving}”`)
  if (out.length === 0) out.push(product.collection)
  return out
}
