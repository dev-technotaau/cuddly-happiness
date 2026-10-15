import { useEffect, useRef } from 'react'
import { ArrowRight, Lock, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { href, useStore } from '../store'
import Price from './Price'
import { RecentlyViewedStrip } from './RecentlyViewed'
import { getLenis } from './SmoothScroll'
import CartLineItem from './cart/CartLineItem'
import CartUpsell from './cart/CartUpsell'
import GiftOptions from './cart/GiftOptions'
import RewardProgress from './cart/RewardProgress'
import UndoToast from './cart/UndoToast'
import useCartTotals from './cart/useCartTotals'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, currency, meta } = useStore()
  const { subtotal, count, installment, hasMerch } = useCartTotals()
  const closeBtn = useRef<HTMLButtonElement>(null)
  const close = () => setCartOpen(false)

  // Lock page scroll, focus the panel and close on Escape while open.
  useEffect(() => {
    if (!cartOpen) return
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => closeBtn.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [cartOpen, setCartOpen])

  const shipping = currency === 'CAD' ? 'Complimentary insured shipping across Canada' : 'Complimentary insured shipping to the U.S., duties included'

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-[80] bg-[var(--bg-vault)]/45 backdrop-blur-[2px] transition-opacity duration-500 ${cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        aria-hidden={!cartOpen}
        inert={!cartOpen}
        className={`fixed right-0 top-0 z-[90] flex h-full w-full max-w-[460px] flex-col bg-[var(--bg-travertine)] shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="border-b border-[var(--border-hairline)] px-7 pb-5 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-editorial text-3xl">
              Your Bag {count > 0 && <span className="font-mono-spec align-middle text-xs text-[var(--text-linen)]">({count})</span>}
            </h2>
            <button ref={closeBtn} onClick={close} aria-label="Close bag" className="-mr-2 p-2 transition-transform hover:rotate-90">
              <X size={20} strokeWidth={1.4} />
            </button>
          </div>
          {hasMerch && <div className="mt-5"><RewardProgress /></div>}
        </header>

        <div className="flex-1 overflow-y-auto px-7" data-lenis-prevent>
          {cart.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif-editorial text-3xl">Your bag is empty.</p>
              <p className="mt-3 text-sm text-[var(--text-taupe)]">Begin with something that will outlast the occasion.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
                {(['necklaces', 'earrings', 'rings'] as const).map((c) => (
                  <a key={c} href={href.category(c)} onClick={close} className="border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.22em]">{c}</a>
                ))}
                <a href={href.giftcards} onClick={close} className="border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.22em]">Gift cards</a>
              </div>
              <div className="mt-14 text-left"><RecentlyViewedStrip onNavigate={close} /></div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[var(--border-hairline)]">
                {cart.map((l) => <CartLineItem key={l.key} line={l} onNavigate={close} />)}
              </ul>
              <div className="sticky bottom-0 pb-3"><UndoToast /></div>
              <div className="border-t border-[var(--border-hairline)] py-7"><CartUpsell onNavigate={close} /></div>
              <div className="border-t border-[var(--border-hairline)] py-7">
                <p className="mb-4 text-[11px] uppercase tracking-[0.22em]">Gifting</p>
                <GiftOptions />
              </div>
            </>
          )}
          {cart.length === 0 && <UndoToast />}
        </div>

        {cart.length > 0 && (
          <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-travertine)] px-7 pb-6 pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.22em]">Subtotal</span>
              <Price amount={subtotal} className="text-lg" />
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-linen)]">
              {shipping}. Taxes calculated at checkout.{meta.giftWrap && ' Gift wrapped.'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-linen)]">
              Or 4 interest-free payments of <Price amount={installment} className="[&_span]:hidden" /> with Shop Pay
            </p>
            <a href={href.checkout} onClick={close} className="group mt-5 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
              <Lock size={12} strokeWidth={1.6} /> Secure checkout
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a href={href.cart} onClick={close} className="mt-3 block w-full border border-[var(--border-hairline)] py-3.5 text-center text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-[var(--text-espresso)]">
              View full bag
            </a>
            <div className="mt-4 flex justify-center gap-6 text-[10px] uppercase tracking-[0.16em] text-[var(--text-linen)]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} strokeWidth={1.4} /> Fully insured</span>
              <span className="flex items-center gap-1.5"><RotateCcw size={12} strokeWidth={1.4} /> 30-day returns</span>
            </div>
          </footer>
        )}
      </aside>
    </>
  )
}
