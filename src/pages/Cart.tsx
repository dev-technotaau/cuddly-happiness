import { useState } from 'react'
import { ArrowRight, CalendarDays, Gem, Lock, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { href, useStore } from '../store'
import { PROVINCES } from '../data/tax'
import Price from '../components/Price'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import CartLineItem from '../components/cart/CartLineItem'
import CartUpsell from '../components/cart/CartUpsell'
import GiftOptions from '../components/cart/GiftOptions'
import RewardProgress from '../components/cart/RewardProgress'
import UndoToast from '../components/cart/UndoToast'
import useCartTotals from '../components/cart/useCartTotals'

/** Business days from today, skipping weekends. */
function deliveryDate(days: number) {
  const d = new Date()
  while (days > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) days--
  }
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric' })
}

export default function Cart() {
  const { cart, currency, clearCart, meta } = useStore()
  const { merch, giftCards, subtotal, count, installment, hasMerch, rewardUnlocked, hasRental } = useCartTotals()
  const [region, setRegion] = useState('QC')
  const tax = currency === 'CAD' ? Math.round(merch * (PROVINCES[region]?.rate ?? 0)) : null
  const total = subtotal + (tax ?? 0)
  const onlyGiftCards = cart.length > 0 && !hasMerch

  const row = (label: React.ReactNode, value: React.ReactNode, muted = false) => (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${muted ? 'text-[var(--text-taupe)]' : ''}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Votre sélection</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-8xl">
            Your <em className="text-[var(--gold-vermeil)]">Bag</em>
          </h1>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-6">
            <span className="font-spec text-xs uppercase tracking-[0.2em] text-[var(--text-taupe)]">{count} {count === 1 ? 'piece' : 'pieces'}</span>
            <button onClick={() => window.confirm('Remove everything from your bag?') && clearCart()} className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">
              Clear bag
            </button>
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif-editorial text-4xl">Your bag is empty.</p>
          <p className="mt-3 text-[var(--text-taupe)]">Begin with something that will outlast the occasion.</p>
          <div className="mx-auto mt-6 max-w-md"><UndoToast /></div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href={href.category('necklaces')} className="bg-[var(--text-espresso)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]">Shop the collections</a>
            <a href={href.giftcards} className="border border-[var(--border-hairline)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--text-espresso)]">Gift cards</a>
          </div>
          <div className="mt-24 text-left"><RecentlyViewedStrip /></div>
        </div>
      ) : (
        <>
          <div className="grid gap-14 pt-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-20">
            <div>
              <ul className="divide-y divide-[var(--border-hairline)]">
                {cart.map((l) => <CartLineItem key={l.key} line={l} variant="page" />)}
              </ul>
              <UndoToast />
              <section className="mt-6 grid gap-10 border-t border-[var(--border-hairline)] pt-10 md:grid-cols-2">
                <div>
                  <h2 className="font-serif-editorial text-3xl">Gifting & notes</h2>
                  <p className="mt-2 text-sm text-[var(--text-taupe)]">Every order arrives in our signature box. Add finishing touches below at no charge.</p>
                  <div className="mt-6"><GiftOptions /></div>
                </div>
                <ul className="space-y-6 self-start bg-[var(--bg-silk)] p-8">
                  {[
                    [Truck, 'Insured, signature delivery', 'Shipped in discreet packaging and fully insured until it is in your hands.'],
                    [RotateCcw, '30-day returns', 'Complimentary returns on unworn pieces. Engraved and custom work is final sale.'],
                    [Gem, 'Lifetime care', 'Free annual cleaning, inspection and claw re-tightening at the atelier.'],
                    [ShieldCheck, 'Certified & conflict-free', 'Every stone traceable, with GIA or IGI certification above 0.30 ct.'],
                  ].map(([Icon, t, d]) => {
                    const I = Icon as typeof Truck
                    return (
                      <li key={t as string} className="flex gap-4">
                        <I size={18} strokeWidth={1.2} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em]">{t as string}</p>
                          <p className="mt-1 text-sm text-[var(--text-taupe)]">{d as string}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-[var(--border-hairline)] p-8">
                <h2 className="font-serif-editorial text-3xl">Summary</h2>
                {hasMerch && <div className="mt-6"><RewardProgress /></div>}
                <div className="mt-7 space-y-3 border-t border-[var(--border-hairline)] pt-6">
                  {hasMerch && row('Jewellery', <Price amount={merch} />)}
                  {giftCards > 0 && row('Gift cards', <Price amount={giftCards} />)}
                  {row('Shipping', onlyGiftCards ? 'Digital delivery' : 'Complimentary', true)}
                  {meta.giftWrap && row('Gift wrapping', 'Complimentary', true)}
                  {rewardUnlocked && row('Jewellery care kit', 'Included', true)}
                  {hasMerch && currency === 'CAD' && (
                    <div className="flex items-baseline justify-between gap-4 text-sm text-[var(--text-taupe)]">
                      <label className="flex items-center gap-2">
                        Est. tax
                        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Province" className="border-b border-[var(--border-hairline)] bg-transparent pb-0.5 text-xs outline-none">
                          {Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                        </select>
                      </label>
                      <Price amount={tax ?? 0} />
                    </div>
                  )}
                  {hasMerch && currency === 'USD' && row('Tax', 'Calculated at checkout', true)}
                  {giftCards > 0 && <p className="text-xs text-[var(--text-linen)]">Gift cards are not taxed.</p>}
                </div>
                <div className="mt-6 flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-6">
                  <span className="text-[11px] uppercase tracking-[0.22em]">{tax !== null && hasMerch ? 'Estimated total' : 'Subtotal'}</span>
                  <Price amount={total} className="font-serif-editorial text-3xl" />
                </div>
                <p className="mt-2 text-xs text-[var(--text-linen)]">Or 4 interest-free payments of <Price amount={installment} className="[&_span]:hidden" /> with Shop Pay</p>

                {hasMerch && !hasRental && (
                  <p className="mt-6 flex items-center gap-2.5 bg-[var(--bg-silk)] px-4 py-3 text-xs text-[var(--text-taupe)]">
                    <CalendarDays size={14} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
                    Order today, arrives by <span className="text-[var(--text-espresso)]">{deliveryDate(4)}</span>
                  </p>
                )}

                <a href={href.checkout} className="group mt-6 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
                  <Lock size={12} strokeWidth={1.6} /> Secure checkout
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
                <p className="mt-4 text-center text-xs text-[var(--text-linen)]">Gift cards and promo codes can be applied at checkout.</p>
              </div>
              <p className="mt-6 text-center text-xs text-[var(--text-taupe)]">
                Questions? <a href={href.atelier} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">Book a private consultation</a>
              </p>
            </aside>
          </div>

          <section className="mt-24 border-t border-[var(--border-hairline)] pt-14"><CartUpsell layout="grid" limit={4} /></section>
          <section className="mt-24"><RecentlyViewedStrip /></section>
        </>
      )}
    </div>
  )
}
