import { designDeposit } from '../../data/ringPrice'
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
  // A designed ring is paid in two parts: its deposit at checkout, the balance once its final design is approved.
  const balance = cart.filter((l) => l.design).reduce((s, l) => s + linePrice(l) - designDeposit(linePrice(l) / l.qty) * l.qty, 0)
  const dueNow = subtotal - balance
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
    /** Before tax: what the designed rings leave to pay on approval, and what is paid at checkout. */
    balance,
    dueNow,
    /** Tax at a rate, as the bag rounds it once, split into what is paid now and with the balance. */
    taxAt: (rate: number) => {
      const total = Math.round(merch * rate)
      const now = Math.round((merch - balance) * rate)
      return { total, now, later: total - now }
    },
  }
}
