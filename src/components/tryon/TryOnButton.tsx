import { ScanFace } from 'lucide-react'
import type { Metal, Product } from '../../data/catalog'
import { useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { useTryOn } from './TryOnProvider'

interface Props {
  product: Product
  metal?: Metal
  text?: string
  list?: Product[]
  variant?: 'outline' | 'chip' | 'icon' | 'link' | 'solid'
  label?: string
  className?: string
}

export default function TryOnButton({ product, metal, text, list, variant = 'outline', label, className = '' }: Props) {
  const { openTryOn, canTryOn } = useTryOn()
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  if (!canTryOn(product)) return null
  const text_ = label ?? common.viewOnYou

  const open = (e: React.MouseEvent) => {
    // Often rendered inside product links.
    e.preventDefault()
    e.stopPropagation()
    openTryOn({ product, metal, text, list })
  }

  const styles = {
    outline: 'flex w-full items-center justify-center gap-2.5 border border-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]',
    solid: 'inline-flex items-center gap-2.5 bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] transition-colors hover:bg-white',
    chip: 'inline-flex items-center gap-2 rounded-full bg-[var(--bg-travertine)]/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-espresso)] backdrop-blur transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]',
    icon: 'flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--border-hairline)] transition-colors hover:border-[var(--text-espresso)]',
    link: 'link-line',
  }[variant]

  return (
    <button type="button" onClick={open} aria-label={variant === 'icon' ? `${text_}: ${catalog.name(product)}` : undefined} title={variant === 'icon' ? text_ : undefined} className={`${styles} ${className}`}>
      {variant !== 'link' && <ScanFace size={variant === 'chip' ? 13 : 16} strokeWidth={1.3} />}
      {variant !== 'icon' && text_}
    </button>
  )
}
