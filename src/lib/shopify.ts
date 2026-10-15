// Shopify Ajax Cart API mapping. In a live theme these payloads are POSTed to /cart/add.js;
// here they document the exact shape so the front end can be wired to Shopify without changes.

import type { CartLine } from '../store'
import { getProduct } from '../data/catalog'
import { DESIGNS } from '../data/giftcards'

/** Placeholder variant IDs; replace with the store's real IDs when connecting. */
const GIFT_CARD_VARIANTS: Record<string, number> = {
  'CAD-100': 44100000001, 'CAD-250': 44100000002, 'CAD-500': 44100000003,
  'CAD-1000': 44100000004, 'CAD-2500': 44100000005, 'CAD-5000': 44100000006,
  'USD-100': 44100000011, 'USD-250': 44100000012, 'USD-500': 44100000013,
  'USD-1000': 44100000014, 'USD-2500': 44100000015, 'USD-5000': 44100000016,
}
/** Custom amounts use a $1 variant multiplied by quantity, a common Shopify pattern. */
const GIFT_CARD_ONE_UNIT_VARIANT = 44100000099

export interface ShopifyCartItem {
  id: number
  quantity: number
  properties: Record<string, string>
}

export function toShopifyCartItem(line: CartLine): ShopifyCartItem | null {
  const g = line.giftCard
  if (!g) return null
  const key = `${g.currency}-${g.amount}`
  const fixed = GIFT_CARD_VARIANTS[key]
  const properties: Record<string, string> = {
    _design: DESIGNS.find((d) => d.id === g.design)?.name ?? g.design,
    _delivery: g.delivery === 'physical' ? 'Physical card, mailed' : 'Digital, by email',
  }
  if (!g.toSelf && g.delivery === 'email') {
    // Native Shopify gift card recipient fields.
    properties.__shopify_send_gift_card_to_recipient = 'on'
    if (g.recipientEmail) properties['Recipient email'] = g.recipientEmail
    if (g.recipientName) properties['Recipient name'] = g.recipientName
    if (g.message) properties.Message = g.message
    if (g.sendOn) properties['Send on'] = g.sendOn
  } else if (!g.toSelf) {
    if (g.recipientName) properties['Recipient name'] = g.recipientName
    if (g.message) properties['Card message'] = g.message
  }
  if (g.senderName) properties['_From'] = g.senderName
  return fixed
    ? { id: fixed, quantity: line.qty, properties }
    : { id: GIFT_CARD_ONE_UNIT_VARIANT, quantity: g.amount * line.qty, properties: { ...properties, _amount: String(g.amount) } }
}

export const isGiftCardLine = (line: CartLine) => !!line.giftCard || getProduct(line.slug)?.slug === 'gift-card'
