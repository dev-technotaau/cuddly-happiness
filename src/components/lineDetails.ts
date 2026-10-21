import { formatDay, formatSlot, parseIso, rentalReturnDate, type Product } from '../data/catalog'
import { bilingual, pick } from '../i18n'
import { catalogFor } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import type { CartLine } from '../store'
import { describePersonalization } from './pdp/Personalizer'
import { sizeLabel } from './pdp/RingSize'

const COPY = bilingual(
  {
    design: (name: string, digital: boolean) => `${name} design · ${digital ? 'Digital' : 'Physical card'}`,
    forMe: 'For me',
    to: (name: string, email?: string) => `To ${name}${email ? ` · ${email}` : ''}`,
    sends: (date: string) => `Sends ${date}`,
    salon: 'Salon fitting',
    courier: 'Courier',
    reverse: 'Reverse',
    engraving: 'Engraving',
  },
  {
    design: (name, digital) => `Motif ${name} · ${digital ? 'Numérique' : 'Carte physique'}`,
    forMe: 'Pour moi',
    to: (name, email) => `Pour ${name}${email ? ` · ${email}` : ''}`,
    sends: (date) => `Envoi le ${date}`,
    salon: 'Essayage au salon',
    courier: 'Messager',
    reverse: 'Verso',
    engraving: 'Gravure',
  },
)

/** Human-readable option lines for a cart line, shared by the bag and checkout, in the visitor's language. */
export function lineDetails(line: CartLine, product: Product): string[] {
  const t = pick(COPY)
  const common = pick(COMMON)
  const catalog = catalogFor()
  const out: string[] = []
  const g = line.giftCard
  if (g) {
    out.push(t.design(catalog.design(g.design), g.delivery === 'email'))
    if (g.toSelf) out.push(t.forMe)
    else out.push(t.to(g.recipientName ?? '', g.recipientEmail))
    if (g.sendOn) out.push(t.sends(formatDay(parseIso(g.sendOn))))
    if (g.message) out.push(common.quote(g.message.length > 40 ? g.message.slice(0, 40) + '…' : g.message))
    return out
  }
  if (line.rental) out.push(common.rentalLabel[line.rental])
  else if (line.metal) out.push(catalog.metal(line.metal))
  if (line.size) out.push(common.size(sizeLabel(line.size)))
  if (line.booking && line.rental) {
    const start = parseIso(line.booking.start)
    const end = rentalReturnDate(line.booking.start, line.rental)
    out.push(`${formatDay(start)} → ${formatDay(end)}`)
    out.push(`${line.booking.method === 'salon' ? t.salon : t.courier} · ${formatSlot(line.booking.slot)}`)
  }
  if (line.personalization) out.push(describePersonalization(line.personalization))
  if (line.engraving) out.push(`${product.personalization ? t.reverse : t.engraving} · ${common.quote(line.engraving)}`)
  if (out.length === 0) out.push(catalog.product(product).collection)
  return out
}
