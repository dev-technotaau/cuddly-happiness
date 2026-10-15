import { useEffect, useState } from 'react'
import { getProduct } from '../../data/catalog'
import { useStore } from '../../store'

/** Brief "removed — undo" notice after a line is removed. */
export default function UndoToast() {
  const { lastRemoved, undoRemove } = useStore()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!lastRemoved) return setVisible(false)
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), 6000)
    return () => window.clearTimeout(id)
  }, [lastRemoved])
  if (!visible || !lastRemoved) return null
  return (
    <div role="status" className="flex animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)] items-center justify-between gap-4 bg-[var(--text-espresso)] px-4 py-3 text-xs text-[var(--bg-travertine)]">
      <span className="truncate">Removed {getProduct(lastRemoved.slug)?.name}</span>
      <button onClick={undoRemove} className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold-champagne)] hover:text-white">Undo</button>
    </div>
  )
}
