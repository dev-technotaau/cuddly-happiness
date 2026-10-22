import { formatPrice } from '../data/catalog'
import { useStore } from '../store'

export default function Price({ amount, className = '' }: { amount: number; className?: string }) {
  const { currency } = useStore()
  return (
    <span className={`font-spec whitespace-nowrap ${className}`}>
      {formatPrice(amount, currency)} <span className="text-[0.75em] text-[var(--text-taupe)]">{currency}</span>
    </span>
  )
}
