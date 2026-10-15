import { useStore } from '../../store'

/** Spend at which a complimentary care kit is added, per currency. */
export const REWARD_THRESHOLD = { CAD: 1000, USD: 750 } as const

export default function useCartTotals() {
  const { cart, linePrice, currency } = useStore()
  const merch = cart.filter((l) => !l.giftCard).reduce((s, l) => s + linePrice(l), 0)
  const giftCards = cart.filter((l) => l.giftCard).reduce((s, l) => s + linePrice(l), 0)
  const subtotal = merch + giftCards
  const count = cart.reduce((s, l) => s + l.qty, 0)
  const threshold = REWARD_THRESHOLD[currency]
  const hasMerch = cart.some((l) => !l.giftCard)
  return {
    merch,
    giftCards,
    subtotal,
    count,
    threshold,
    rewardProgress: Math.min(1, merch / threshold),
    rewardRemaining: Math.max(0, threshold - merch),
    rewardUnlocked: merch >= threshold,
    installment: Math.round(subtotal / 4),
    hasMerch,
    hasRental: cart.some((l) => l.rental),
  }
}
