import { Sparkles } from 'lucide-react'
import { bilingual, useCopy } from '../../i18n'
import Price from '../Price'
import useCartTotals from './useCartTotals'

const COPY = bilingual(
  { unlocked: 'Unlocked:', kit: 'a complimentary jewellery care kit is included with your order.', before: '', after: ' away from a complimentary jewellery care kit.' },
  { unlocked: 'Débloqué :', kit: 'une trousse d’entretien pour bijoux est offerte avec votre commande.', before: 'Plus que ', after: ' pour recevoir une trousse d’entretien offerte.' },
)

export default function RewardProgress() {
  const { rewardProgress, rewardRemaining, rewardUnlocked, hasMerch } = useCartTotals()
  const t = useCopy(COPY)
  if (!hasMerch) return null
  return (
    <div>
      <p className="flex items-center gap-2 text-xs text-[var(--text-taupe)]">
        <Sparkles size={13} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
        {rewardUnlocked ? (
          <span><span className="text-[var(--text-espresso)]">{t.unlocked}</span> {t.kit}</span>
        ) : (
          <span>{t.before}<Price amount={rewardRemaining} className="text-[var(--text-espresso)] [&_span]:hidden" />{t.after}</span>
        )}
      </p>
      <div className="mt-2.5 h-[2px] w-full overflow-hidden bg-[var(--border-hairline)]">
        <div className="h-full bg-[var(--gold-vermeil)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${rewardProgress * 100}%` }} />
      </div>
    </div>
  )
}
