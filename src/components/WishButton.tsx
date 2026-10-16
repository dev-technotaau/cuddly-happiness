import { useRef } from 'react'
import gsap from 'gsap'
import { Heart } from 'lucide-react'
import { useStore } from '../store'

export default function WishButton({ slug, className = '', size = 'sm' }: { slug: string; className?: string; size?: 'sm' | 'lg' }) {
  const { isWished, toggleWishlist } = useStore()
  const ref = useRef<HTMLButtonElement>(null)
  const on = isWished(slug)
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={(e) => {
        // Cards are links; keep the click from navigating.
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(slug)
        gsap.fromTo(ref.current, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      }}
      // Ink is set here rather than inherited: the chip is always travertine, even on dark surfaces like the home hero.
      className={`${dim} flex items-center justify-center rounded-full bg-[var(--bg-travertine)]/90 text-[var(--text-espresso)] backdrop-blur transition-colors hover:text-[var(--gold-vermeil)] ${className}`}
    >
      <Heart
        size={size === 'lg' ? 20 : 16}
        strokeWidth={1.4}
        className={on ? 'fill-[var(--gold-vermeil)] text-[var(--gold-vermeil)]' : ''}
      />
    </button>
  )
}
