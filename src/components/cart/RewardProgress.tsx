import { Sparkles } from 'lucide-react'
import Price from '../Price'
import useCartTotals from './useCartTotals'

export default function RewardProgress() {
  const { rewardProgress, rewardRemaining, rewardUnlocked, hasMerch } = useCartTotals()
  if (!hasMerch) return null
  return (
    <div>
      <p className="flex items-center gap-2 text-xs text-[var(--text-taupe)]">
        <Sparkles size={13} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
        {rewardUnlocked ? (
          <span><span className="text-[var(--text-espresso)]">Unlocked:</span> a complimentary jewellery care kit is included with your order.</span>
        ) : (
          <span><Price amount={rewardRemaining} className="text-[var(--text-espresso)] [&_span]:hidden" /> away from a complimentary jewellery care kit.</span>
        )}
      </p>
      <div className="mt-2.5 h-[2px] w-full overflow-hidden bg-[var(--border-hairline)]">
        <div className="h-full bg-[var(--gold-vermeil)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${rewardProgress * 100}%` }} />
      </div>
    </div>
  )
}
