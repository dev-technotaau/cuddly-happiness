import { useState } from 'react'
import { ArrowRight, CalendarDays, Gem, Lock, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { formatDay } from '../data/catalog'
import { PROVINCES, provinceName } from '../data/tax'
import { bilingual, useCopy } from '../i18n'
import { COMMON } from '../i18n/common'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
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
  return formatDay(d, { weekday: 'short', month: 'long', day: 'numeric' })
}

const COPY = bilingual(
  {
    eyebrow: 'Votre sélection',
    title: 'Your <em>Bag</em>',
    confirm: 'Remove everything from your bag?',
    clear: 'Clear bag',
    empty: 'Your bag is empty.',
    begin: 'Begin with something that will outlast the occasion.',
    find: 'Find your piece',
    giftCards: 'Gift cards',
    gifting: 'Gifting & notes',
    gifted: 'Every order arrives in our signature box. Add finishing touches below at no charge.',
    perks: [
      ['Insured, signature delivery', 'Shipped in discreet packaging and fully insured until it is in your hands.'],
      ['30-day returns', 'Complimentary returns on unworn pieces. Engraved and custom work is final sale.'],
      ['Lifetime care', 'Free annual cleaning, inspection and claw re-tightening at the atelier.'],
      ['Certified & conflict-free', 'Every stone traceable, with GIA or IGI certification above 0.30 ct.'],
    ] as [string, string][],
    summary: 'Summary',
    jewellery: 'Jewellery',
    shipping: 'Shipping',
    digital: 'Digital delivery',
    complimentary: 'Complimentary',
    wrapping: 'Gift wrapping',
    wrapFree: 'Complimentary',
    careKit: 'Jewellery care kit',
    included: 'Included',
    estTax: 'Est. tax',
    province: 'Province',
    tax: 'Tax',
    atCheckout: 'Calculated at checkout',
    untaxed: 'Gift cards are not taxed.',
    estimated: 'Estimated total',
    subtotal: 'Subtotal',
    instalments: 'Or 4 interest-free payments of',
    shopPay: 'with Shop Pay',
    arrives: 'Order today, arrives by',
    checkout: 'Secure checkout',
    codes: 'Gift cards and promo codes can be applied at checkout.',
    questions: 'Questions?',
    consult: 'Book a private consultation',
  },
  {
    eyebrow: 'La sélection',
    title: 'Votre <em>panier</em>',
    confirm: 'Retirer toutes les pièces de votre panier?',
    clear: 'Vider le panier',
    empty: 'Votre panier est vide.',
    begin: 'Commencez par une pièce qui survivra à l’occasion.',
    find: 'Trouver votre pièce',
    giftCards: 'Cartes-cadeaux',
    gifting: 'Cadeau et notes',
    gifted: 'Chaque commande arrive dans notre écrin signature. Ajoutez ci-dessous les touches finales, sans frais.',
    perks: [
      ['Livraison assurée, avec signature', 'Expédiée dans un emballage discret et entièrement assurée jusqu’à ce qu’elle soit entre vos mains.'],
      ['Retours sous 30 jours', 'Retours gratuits pour les pièces non portées. Les gravures et les créations sur mesure sont des ventes finales.'],
      ['Entretien à vie', 'Nettoyage annuel, inspection et resserrage des griffes offerts à l’atelier.'],
      ['Certifiées et exemptes de conflits', 'Chaque pierre est traçable, avec certification GIA ou IGI au-delà de 0,30 ct.'],
    ],
    summary: 'Récapitulatif',
    jewellery: 'Bijoux',
    shipping: 'Livraison',
    digital: 'Livraison numérique',
    complimentary: 'Offerte',
    wrapping: 'Emballage cadeau',
    wrapFree: 'Offert',
    careKit: 'Trousse d’entretien',
    included: 'Incluse',
    estTax: 'Taxes estimées',
    province: 'Province',
    tax: 'Taxes',
    atCheckout: 'Calculées au paiement',
    untaxed: 'Les cartes-cadeaux ne sont pas taxées.',
    estimated: 'Total estimé',
    subtotal: 'Sous-total',
    instalments: 'Ou 4 versements sans intérêt de',
    shopPay: 'avec Shop Pay',
    arrives: 'Commandez aujourd’hui, livraison d’ici le',
    checkout: 'Paiement sécurisé',
    codes: 'Les cartes-cadeaux et les codes promo s’appliquent au paiement.',
    questions: 'Des questions?',
    consult: 'Réserver une consultation privée',
  },
)

const PERK_ICONS = [Truck, RotateCcw, Gem, ShieldCheck]

export default function Cart() {
  const { cart, currency, clearCart, meta } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
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
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-8xl">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h1>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-6">
            <span className="font-spec text-xs uppercase tracking-[0.2em] text-[var(--text-taupe)]">{common.pieces(count)}</span>
            <button onClick={() => window.confirm(t.confirm) && clearCart()} className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">
              {t.clear}
            </button>
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif-editorial text-4xl">{t.empty}</p>
          <p className="mt-3 text-[var(--text-taupe)]">{t.begin}</p>
          <div className="mx-auto mt-6 max-w-md"><UndoToast /></div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href={href.category('necklaces')} className="bg-[var(--text-espresso)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]">{t.find}</a>
            <a href={href.giftcards} className="border border-[var(--border-hairline)] px-10 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--text-espresso)]">{t.giftCards}</a>
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
                  <h2 className="font-serif-editorial text-3xl">{t.gifting}</h2>
                  <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.gifted}</p>
                  <div className="mt-6"><GiftOptions /></div>
                </div>
                <ul className="space-y-6 self-start bg-[var(--bg-silk)] p-8">
                  {t.perks.map(([title, d], i) => {
                    const I = PERK_ICONS[i]
                    return (
                      <li key={i} className="flex gap-4">
                        <I size={18} strokeWidth={1.2} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em]">{title}</p>
                          <p className="mt-1 text-sm text-[var(--text-taupe)]">{d}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-[var(--border-hairline)] p-8">
                <h2 className="font-serif-editorial text-3xl">{t.summary}</h2>
                {hasMerch && <div className="mt-6"><RewardProgress /></div>}
                <div className="mt-7 space-y-3 border-t border-[var(--border-hairline)] pt-6">
                  {hasMerch && row(t.jewellery, <Price amount={merch} />)}
                  {giftCards > 0 && row(t.giftCards, <Price amount={giftCards} />)}
                  {row(t.shipping, onlyGiftCards ? t.digital : t.complimentary, true)}
                  {meta.giftWrap && row(t.wrapping, t.wrapFree, true)}
                  {rewardUnlocked && row(t.careKit, t.included, true)}
                  {hasMerch && currency === 'CAD' && (
                    <div className="flex items-baseline justify-between gap-4 text-sm text-[var(--text-taupe)]">
                      <label className="flex items-center gap-2">
                        {t.estTax}
                        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label={t.province} className="border-b border-[var(--border-hairline)] bg-transparent pb-0.5 text-xs outline-none">
                          {Object.keys(PROVINCES).map((k) => <option key={k} value={k}>{provinceName(k)}</option>)}
                        </select>
                      </label>
                      <Price amount={tax ?? 0} />
                    </div>
                  )}
                  {hasMerch && currency === 'USD' && row(t.tax, t.atCheckout, true)}
                  {giftCards > 0 && <p className="text-xs text-[var(--text-linen)]">{t.untaxed}</p>}
                </div>
                <div className="mt-6 flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-6">
                  <span className="text-[11px] uppercase tracking-[0.22em]">{tax !== null && hasMerch ? t.estimated : t.subtotal}</span>
                  <Price amount={total} className="font-serif-editorial text-3xl" />
                </div>
                <p className="mt-2 text-xs text-[var(--text-linen)]">{t.instalments} <Price amount={installment} className="[&_span]:hidden" /> {t.shopPay}</p>

                {hasMerch && !hasRental && (
                  <p className="mt-6 flex items-center gap-2.5 bg-[var(--bg-silk)] px-4 py-3 text-xs text-[var(--text-taupe)]">
                    <CalendarDays size={14} strokeWidth={1.3} className="shrink-0 text-[var(--gold-vermeil)]" />
                    {t.arrives} <span className="text-[var(--text-espresso)]">{deliveryDate(4)}</span>
                  </p>
                )}

                <a href={href.checkout} className="group mt-6 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
                  <Lock size={12} strokeWidth={1.6} /> {t.checkout}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
                <p className="mt-4 text-center text-xs text-[var(--text-linen)]">{t.codes}</p>
              </div>
              <p className="mt-6 text-center text-xs text-[var(--text-taupe)]">
                {t.questions} <a href={href.atelier} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{t.consult}</a>
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
