import { useState } from 'react'
import { Gift, Lock, X } from 'lucide-react'
import { formatDay, getProduct, parseIso } from '../data/catalog'
import { convert, debitCards, formatCode, isCodeFormat, issueCards, lookupCard, maskCode, type IssuedCard } from '../data/giftcards'
import { toShopifyCartItem } from '../lib/shopify'
import { lineDetails } from '../components/lineDetails'
import { href, useStore, type CartLine } from '../store'
import Price from '../components/Price'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import { PROVINCES, US_STATES } from '../data/tax'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'

const field = 'mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]'
const label = 'text-[11px] uppercase tracking-[0.22em]'

interface Applied {
  card: IssuedCard
  /** Available balance in checkout currency. */
  available: number
}

interface Confirmation {
  order: string
  issued: { card: IssuedCard; line: CartLine }[]
  paidWithCards: number
}

export default function Checkout() {
  const { cart, currency, setCurrency, linePrice, clearCart } = useStore()
  const [province, setProvince] = useState('QC')
  const [placed, setPlaced] = useState<Confirmation | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [applied, setApplied] = useState<Applied[]>([])
  const isCA = currency === 'CAD'

  const giftLines = cart.filter((l) => l.giftCard)
  const merchLines = cart.filter((l) => !l.giftCard)
  const merch = merchLines.reduce((s, l) => s + linePrice(l), 0)
  const giftTotal = giftLines.reduce((s, l) => s + linePrice(l), 0)
  // Gift cards are not taxed at sale; tax applies to merchandise only.
  const tax = isCA ? Math.round(merch * PROVINCES[province].rate) : 0
  // Gift cards can pay for merchandise and tax, but not for other gift cards.
  const payableByCards = merch + tax
  let remaining = payableByCards
  const usage = applied.map((a) => {
    const use = Math.min(a.available, remaining)
    remaining -= use
    return { ...a, use }
  })
  const cardsTotal = usage.reduce((s, u) => s + u.use, 0)
  const total = payableByCards - cardsTotal + giftTotal
  const needsShipping = merchLines.length > 0 || giftLines.some((l) => l.giftCard!.delivery === 'physical')

  const applyCode = () => {
    setCodeError(null)
    if (!isCodeFormat(code)) return setCodeError('Enter the 16-character code from your gift card.')
    const card = lookupCard(code)
    if (!card) return setCodeError('This gift card could not be found.')
    if (card.balance <= 0) return setCodeError('This gift card has no remaining balance.')
    if (applied.some((a) => a.card.code === card.code)) return setCodeError('This gift card is already applied.')
    if (payableByCards - cardsTotal <= 0) return setCodeError(merch ? 'Your order is already fully covered.' : 'Gift cards can’t be used to buy other gift cards.')
    setApplied((a) => [...a, { card, available: convert(card.balance, card.currency, currency) }])
    setCode('')
  }

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault()
    // In a live theme these are the /cart/add.js payloads for gift card lines.
    const shopifyItems = giftLines.map(toShopifyCartItem)
    if (shopifyItems.length) console.info('[Shopify] gift card cart items', shopifyItems)
    debitCards(usage.filter((u) => u.use > 0).map((u) => ({ code: u.card.code, amount: u.use, currency })))
    const issuedCards = issueCards(giftLines.map((l) => l.giftCard!), giftLines.map((l) => l.qty))
    let k = 0
    const issued = giftLines.flatMap((line) => Array.from({ length: line.qty }, () => ({ card: issuedCards[k++], line })))
    setPlaced({ order: `TS-${Date.now().toString().slice(-6)}`, issued, paidWithCards: cardsTotal })
    clearCart()
  }

  if (placed) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Order {placed.order}</p>
        <h1 className="font-serif-editorial mt-6 text-6xl font-light">Merci.</h1>
        <p className="mt-6 text-[var(--text-taupe)]">
          A confirmation is on its way.{placed.paidWithCards > 0 && <> <Price amount={placed.paidWithCards} /> was paid with gift cards.</>}
        </p>
        {placed.issued.length > 0 && (
          <div className="mt-16 text-left">
            <p className={label}>Your gift cards</p>
            <ul className="mt-6 grid gap-8 sm:grid-cols-2">
              {placed.issued.map(({ card, line }) => {
                const g = line.giftCard!
                return (
                  <li key={card.code}>
                    <GiftCardArt design={card.design} currency={card.currency} amount={card.initial} to={card.recipientName} code={card.code} />
                    <p className="mt-4 text-sm text-[var(--text-taupe)]">
                      {g.delivery === 'physical'
                        ? 'Mailed in our travertine box, 2–5 business days.'
                        : g.toSelf
                          ? 'Emailed to you now.'
                          : `Emailed to ${g.recipientEmail}${g.sendOn ? ` on ${formatDay(parseIso(g.sendOn))}` : ' now'}.`}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <div className="mt-14 flex flex-wrap justify-center gap-10">
          <a href={href.home} className="link-line">Return to the maison</a>
          {placed.issued.length > 0 && <a href={href.account} className="link-line">View in your account</a>}
        </div>
      </section>
    )
  }

  if (cart.length === 0) {
    return (
      <section className="py-40 text-center">
        <p className="font-serif-editorial text-4xl italic text-[var(--text-taupe)]">Your bag is empty.</p>
        <a href={href.home} className="mt-8 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-vermeil)]">Continue shopping</a>
        <div className="mx-auto mt-16 max-w-md px-6">
          <RecentlyViewedStrip />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-[1400px] gap-16 px-6 py-16 lg:grid-cols-12 lg:px-12 lg:py-24">
      <form className="lg:col-span-7" onSubmit={placeOrder}>
        <h1 className="font-serif-editorial text-6xl font-light">Checkout</h1>

        <fieldset className="mt-12">
          <legend className={label}>Shopping in</legend>
          <div className="mt-3 grid grid-cols-2 border border-[var(--border-hairline)]">
            {(['CAD', 'USD'] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  setCurrency(c)
                  setApplied((a) => a.map((x) => ({ ...x, available: convert(x.card.balance, x.card.currency, c) })))
                }}
                className={`py-4 text-[11px] uppercase tracking-[0.2em] ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}
              >
                {c === 'CAD' ? 'Canada · CAD' : 'United States · USD'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={label}>Email</span><input required type="email" className={field} /></label>
          <label><span className={label}>First name</span><input required className={field} /></label>
          <label><span className={label}>Last name</span><input required className={field} /></label>
          {needsShipping ? (
            <>
              <label className="sm:col-span-2"><span className={label}>Address</span><input required className={field} /></label>
              <label><span className={label}>City</span><input required className={field} /></label>
              <label>
                <span className={label}>{isCA ? 'Province' : 'State'}</span>
                {isCA ? (
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className={field}>
                    {Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                ) : (
                  <select className={field}>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
                )}
              </label>
              <label>
                <span className={label}>{isCA ? 'Postal code' : 'ZIP code'}</span>
                <input
                  required
                  className={`${field} font-mono-spec uppercase`}
                  pattern={isCA ? '[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d' : '\\d{5}(-\\d{4})?'}
                  placeholder={isCA ? 'H3G 1K4' : '10001'}
                />
              </label>
              <label><span className={label}>Phone</span><input required type="tel" className={field} /></label>
            </>
          ) : (
            <p className="text-sm text-[var(--text-taupe)] sm:col-span-2">Digital gift cards only — no shipping address needed.</p>
          )}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-[var(--text-taupe)]">
          Payment is completed securely through Shopify Checkout. {isCA ? 'Orders ship insured via signature-required courier.' : 'Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required.'}
        </p>
        <button className="mt-8 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
          <Lock size={14} strokeWidth={1.6} /> {total === 0 ? 'Place order — no payment due' : 'Place order'}
        </button>
      </form>

      <aside className="lg:col-span-5">
        <div className="bg-[var(--bg-silk)] p-8 lg:sticky lg:top-36">
          <p className={label}>Order summary</p>
          <ul className="mt-6 divide-y divide-[var(--border-hairline)]">
            {cart.map((l) => {
              const p = getProduct(l.slug)
              if (!p) return null
              return (
                <li key={l.key} className="flex gap-4 py-4">
                  {l.giftCard ? (
                    <div className="w-16 shrink-0 pt-1"><GiftCardArt design={l.giftCard.design} currency={l.giftCard.currency} amount={l.giftCard.amount} /></div>
                  ) : (
                    <img src={p.images[0]} alt="" className="h-20 w-16 object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-serif-editorial text-lg leading-tight">{p.name}</p>
                    <p className="font-mono-spec mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">
                      {lineDetails(l, p).join(' · ')} · ×{l.qty}
                    </p>
                  </div>
                  <Price amount={linePrice(l)} className="text-sm" />
                </li>
              )
            })}
          </ul>

          {/* Gift card redemption */}
          <div className="mt-4 border-t border-[var(--border-hairline)] pt-6">
            <label htmlFor="gc-code" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">
              <Gift size={13} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> Gift card
            </label>
            <div className="mt-2 flex border border-[var(--border-hairline)] bg-[var(--bg-travertine)]">
              <input
                id="gc-code"
                value={formatCode(code)}
                onChange={(e) => {
                  setCode(e.target.value)
                  setCodeError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyCode()
                  }
                }}
                maxLength={19}
                placeholder="XXXX XXXX XXXX XXXX"
                autoComplete="off"
                spellCheck={false}
                className="font-mono-spec min-w-0 flex-1 bg-transparent px-3 py-3 text-xs uppercase tracking-[0.14em] outline-none placeholder:opacity-40"
              />
              <button type="button" onClick={applyCode} className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] hover:text-[var(--gold-vermeil)]">Apply</button>
            </div>
            {codeError && <p className="mt-2 text-xs text-red-700">{codeError}</p>}
            {usage.length > 0 && (
              <ul className="mt-3 space-y-2">
                {usage.map((u) => (
                  <li key={u.card.code} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono-spec flex items-center gap-2">
                      <button type="button" onClick={() => setApplied((a) => a.filter((x) => x.card.code !== u.card.code))} aria-label="Remove gift card" className="text-[var(--text-linen)] hover:text-[var(--text-espresso)]"><X size={12} /></button>
                      {maskCode(u.card.code)}
                    </span>
                    <span className="text-[var(--text-taupe)]">
                      − <Price amount={u.use} className="[&_span]:hidden" />
                      {u.available - u.use > 0 && <span className="ml-2 text-[var(--text-linen)]">(<Price amount={u.available - u.use} className="[&_span]:hidden" /> left)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t border-[var(--border-hairline)] pt-6 text-sm">
            {merch > 0 && <div className="flex justify-between"><dt>Merchandise</dt><dd><Price amount={merch} /></dd></div>}
            {giftTotal > 0 && <div className="flex justify-between"><dt>Gift cards</dt><dd><Price amount={giftTotal} /></dd></div>}
            {needsShipping && <div className="flex justify-between"><dt>Insured shipping</dt><dd className="font-mono-spec">Complimentary</dd></div>}
            {merch > 0 && (
              <div className="flex justify-between">
                <dt>{isCA ? `Tax · ${PROVINCES[province].label}` : 'Sales tax'}</dt>
                <dd>{isCA ? <Price amount={tax} /> : <span className="text-xs text-[var(--text-taupe)]">Calculated by Shopify</span>}</dd>
              </div>
            )}
            {cardsTotal > 0 && (
              <div className="flex justify-between text-[var(--gold-vermeil)]"><dt>Gift cards applied</dt><dd>− <Price amount={cardsTotal} /></dd></div>
            )}
            <div className="flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-4 text-base">
              <dt className="text-[11px] uppercase tracking-[0.2em]">Total due</dt>
              <dd className="text-xl"><Price amount={total} /></dd>
            </div>
          </dl>
        </div>
      </aside>
    </section>
  )
}
