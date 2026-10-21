import { useState } from 'react'
import { Gift, Lock, X } from 'lucide-react'
import { formatDay, getProduct, parseIso } from '../data/catalog'
import { convert, debitCards, formatCode, isCodeFormat, issueCards, lookupCard, maskCode, type IssuedCard } from '../data/giftcards'
import { toShopifyCartItem } from '../lib/shopify'
import { lineDetails } from '../components/lineDetails'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { href, useStore, type CartLine } from '../store'
import Price from '../components/Price'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import { PROVINCES, US_STATES, provinceName, stateName, taxLabel } from '../data/tax'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'

const COPY = bilingual(
  {
    errors: {
      format: 'Enter the 16-character code from your gift card.',
      missing: 'This gift card could not be found.',
      empty: 'This gift card has no remaining balance.',
      applied: 'This gift card is already applied.',
      covered: 'Your order is already fully covered.',
      giftOnly: 'Gift cards can’t be used to buy other gift cards.',
    },
    order: (n: string) => `Order ${n}`,
    merci: 'Merci.',
    confirmation: 'A confirmation is on its way.',
    paidBefore: '',
    paidAfter: ' was paid with gift cards.',
    yourCards: 'Your gift cards',
    mailed: 'Mailed in our travertine box, 2–5 business days.',
    emailedYou: 'Emailed to you now.',
    emailedTo: (email: string, date?: string) => `Emailed to ${email}${date ? ` on ${date}` : ' now'}.`,
    maison: 'Return to the maison',
    account: 'View in your account',
    empty: 'Your bag is empty.',
    continue: 'Continue shopping',
    title: 'Checkout',
    shoppingIn: 'Shopping in',
    markets: { CAD: 'Canada · CAD', USD: 'United States · USD' },
    email: 'Email',
    first: 'First name',
    last: 'Last name',
    address: 'Address',
    city: 'City',
    province: 'Province',
    state: 'State',
    postal: 'Postal code',
    zip: 'ZIP code',
    phone: 'Phone',
    digitalOnly: 'Digital gift cards only — no shipping address needed.',
    secure: 'Payment is completed securely through Shopify Checkout.',
    shipsCA: 'Orders ship insured via signature-required courier.',
    shipsUS: 'Duties and import fees are prepaid by Teresa & Sons; orders ship insured, signature required.',
    placeFree: 'Place order — no payment due',
    place: 'Place order',
    summary: 'Order summary',
    giftCard: 'Gift card',
    apply: 'Apply',
    removeCard: 'Remove gift card',
    leftBefore: '(',
    leftAfter: ' left)',
    merchandise: 'Merchandise',
    giftCards: 'Gift cards',
    shipping: 'Insured shipping',
    complimentary: 'Complimentary',
    taxOf: (label: string) => `Tax · ${label}`,
    salesTax: 'Sales tax',
    byShopify: 'Calculated by Shopify',
    cardsApplied: 'Gift cards applied',
    due: 'Total due',
  },
  {
    errors: {
      format: 'Saisissez le code de 16 caractères de votre carte-cadeau.',
      missing: 'Cette carte-cadeau est introuvable.',
      empty: 'Le solde de cette carte-cadeau est épuisé.',
      applied: 'Cette carte-cadeau est déjà appliquée.',
      covered: 'Votre commande est déjà entièrement réglée.',
      giftOnly: 'Les cartes-cadeaux ne peuvent pas servir à acheter d’autres cartes-cadeaux.',
    },
    order: (n) => `Commande ${n}`,
    merci: 'Merci.',
    confirmation: 'Une confirmation est en route.',
    paidBefore: 'Un montant de ',
    paidAfter: ' a été réglé par carte-cadeau.',
    yourCards: 'Vos cartes-cadeaux',
    mailed: 'Postée dans notre écrin travertin, en 2 à 5 jours ouvrables.',
    emailedYou: 'Envoyée par courriel dès maintenant.',
    emailedTo: (email, date) => `Envoyée par courriel à ${email}${date ? ` le ${date}` : ' dès maintenant'}.`,
    maison: 'Retour à la maison',
    account: 'Voir dans votre compte',
    empty: 'Votre panier est vide.',
    continue: 'Poursuivre le magasinage',
    title: 'Paiement',
    shoppingIn: 'Marché',
    markets: { CAD: 'Canada · $ CA', USD: 'États-Unis · $ US' },
    email: 'Courriel',
    first: 'Prénom',
    last: 'Nom',
    address: 'Adresse',
    city: 'Ville',
    province: 'Province',
    state: 'État',
    postal: 'Code postal',
    zip: 'Code ZIP',
    phone: 'Téléphone',
    digitalOnly: 'Cartes-cadeaux numériques seulement — aucune adresse de livraison requise.',
    secure: 'Le paiement s’effectue en toute sécurité par Shopify Checkout.',
    shipsCA: 'Les commandes sont expédiées assurées, par messager avec signature.',
    shipsUS: 'Les droits et frais d’importation sont prépayés par Teresa & Sons; les commandes sont expédiées assurées, signature requise.',
    placeFree: 'Passer la commande — aucun paiement dû',
    place: 'Passer la commande',
    summary: 'Récapitulatif de commande',
    giftCard: 'Carte-cadeau',
    apply: 'Appliquer',
    removeCard: 'Retirer la carte-cadeau',
    leftBefore: '(reste ',
    leftAfter: ')',
    merchandise: 'Marchandise',
    giftCards: 'Cartes-cadeaux',
    shipping: 'Livraison assurée',
    complimentary: 'Offerte',
    taxOf: (label) => `Taxes · ${label}`,
    salesTax: 'Taxe de vente',
    byShopify: 'Calculée par Shopify',
    cardsApplied: 'Cartes-cadeaux appliquées',
    due: 'Total à payer',
  },
)

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
  const t = useCopy(COPY)
  const catalog = useCatalog()
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
    if (!isCodeFormat(code)) return setCodeError(t.errors.format)
    const card = lookupCard(code)
    if (!card) return setCodeError(t.errors.missing)
    if (card.balance <= 0) return setCodeError(t.errors.empty)
    if (applied.some((a) => a.card.code === card.code)) return setCodeError(t.errors.applied)
    if (payableByCards - cardsTotal <= 0) return setCodeError(merch ? t.errors.covered : t.errors.giftOnly)
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
        <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.order(placed.order)}</p>
        <h1 className="font-serif-editorial mt-6 text-6xl font-light">{t.merci}</h1>
        <p className="mt-6 text-[var(--text-taupe)]">
          {t.confirmation}{placed.paidWithCards > 0 && <> {t.paidBefore}<Price amount={placed.paidWithCards} />{t.paidAfter}</>}
        </p>
        {placed.issued.length > 0 && (
          <div className="mt-16 text-left">
            <p className={label}>{t.yourCards}</p>
            <ul className="mt-6 grid gap-8 sm:grid-cols-2">
              {placed.issued.map(({ card, line }) => {
                const g = line.giftCard!
                return (
                  <li key={card.code}>
                    <GiftCardArt design={card.design} currency={card.currency} amount={card.initial} to={card.recipientName} code={card.code} />
                    <p className="mt-4 text-sm text-[var(--text-taupe)]">
                      {g.delivery === 'physical' ? t.mailed : g.toSelf ? t.emailedYou : t.emailedTo(g.recipientEmail ?? '', g.sendOn ? formatDay(parseIso(g.sendOn)) : undefined)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <div className="mt-14 flex flex-wrap justify-center gap-10">
          <a href={href.home} className="link-line">{t.maison}</a>
          {placed.issued.length > 0 && <a href={href.account} className="link-line">{t.account}</a>}
        </div>
      </section>
    )
  }

  if (cart.length === 0) {
    return (
      <section className="py-40 text-center">
        <p className="font-serif-editorial text-4xl italic text-[var(--text-taupe)]">{t.empty}</p>
        <a href={href.home} className="mt-8 inline-block text-[11px] uppercase tracking-[0.24em] text-[var(--gold-vermeil)]">{t.continue}</a>
        <div className="mx-auto mt-16 max-w-md px-6">
          <RecentlyViewedStrip />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-[1400px] gap-16 px-6 py-16 lg:grid-cols-12 lg:px-12 lg:py-24">
      <form className="lg:col-span-7" onSubmit={placeOrder}>
        <h1 className="font-serif-editorial text-6xl font-light">{t.title}</h1>

        <fieldset className="mt-12">
          <legend className={label}>{t.shoppingIn}</legend>
          <div className="mt-3 grid grid-cols-2 border border-[var(--border-hairline)]">
            {(['CAD', 'USD'] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  setCurrency(c)
                  setApplied((a) => a.map((x) => ({ ...x, available: convert(x.card.balance, x.card.currency, c) })))
                }}
                aria-pressed={currency === c}
                className={`py-4 text-[11px] uppercase tracking-[0.2em] ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}
              >
                {t.markets[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={label}>{t.email}</span><input required type="email" autoComplete="email" className={field} /></label>
          <label><span className={label}>{t.first}</span><input required autoComplete="given-name" className={field} /></label>
          <label><span className={label}>{t.last}</span><input required autoComplete="family-name" className={field} /></label>
          {needsShipping ? (
            <>
              <label className="sm:col-span-2"><span className={label}>{t.address}</span><input required autoComplete="street-address" className={field} /></label>
              <label><span className={label}>{t.city}</span><input required autoComplete="address-level2" className={field} /></label>
              <label>
                <span className={label}>{isCA ? t.province : t.state}</span>
                {isCA ? (
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className={field}>
                    {Object.keys(PROVINCES).map((k) => <option key={k} value={k}>{provinceName(k)}</option>)}
                  </select>
                ) : (
                  <select className={field}>{US_STATES.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}</select>
                )}
              </label>
              <label>
                <span className={label}>{isCA ? t.postal : t.zip}</span>
                <input
                  required
                  className={`${field} font-spec uppercase`}
                  pattern={isCA ? '[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d' : '\\d{5}(-\\d{4})?'}
                  placeholder={isCA ? 'H3G 1K4' : '10001'}
                />
              </label>
              <label><span className={label}>{t.phone}</span><input required type="tel" autoComplete="tel" className={field} /></label>
            </>
          ) : (
            <p className="text-sm text-[var(--text-taupe)] sm:col-span-2">{t.digitalOnly}</p>
          )}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-[var(--text-taupe)]">
          {t.secure} {isCA ? t.shipsCA : t.shipsUS}
        </p>
        <button className="mt-8 flex w-full items-center justify-center gap-3 bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
          <Lock size={14} strokeWidth={1.6} /> {total === 0 ? t.placeFree : t.place}
        </button>
      </form>

      <aside className="lg:col-span-5">
        <div className="bg-[var(--bg-silk)] p-8 lg:sticky lg:top-36">
          <p className={label}>{t.summary}</p>
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
                    <p className="font-serif-editorial text-lg leading-tight">{catalog.name(p)}</p>
                    <p className="font-spec mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">
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
              <Gift size={13} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {t.giftCard}
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
                className="font-spec min-w-0 flex-1 bg-transparent px-3 py-3 text-xs uppercase tracking-[0.14em] outline-none placeholder:opacity-40"
              />
              <button type="button" onClick={applyCode} className="px-4 text-[10px] font-medium uppercase tracking-[0.2em] hover:text-[var(--gold-vermeil)]">{t.apply}</button>
            </div>
            {codeError && <p role="alert" className="mt-2 text-xs text-red-700">{codeError}</p>}
            {usage.length > 0 && (
              <ul className="mt-3 space-y-2">
                {usage.map((u) => (
                  <li key={u.card.code} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-spec flex items-center gap-2">
                      <button type="button" onClick={() => setApplied((a) => a.filter((x) => x.card.code !== u.card.code))} aria-label={t.removeCard} className="text-[var(--text-linen)] hover:text-[var(--text-espresso)]"><X size={12} /></button>
                      {maskCode(u.card.code)}
                    </span>
                    <span className="text-[var(--text-taupe)]">
                      − <Price amount={u.use} className="[&_span]:hidden" />
                      {u.available - u.use > 0 && <span className="ml-2 text-[var(--text-linen)]">{t.leftBefore}<Price amount={u.available - u.use} className="[&_span]:hidden" />{t.leftAfter}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t border-[var(--border-hairline)] pt-6 text-sm">
            {merch > 0 && <div className="flex justify-between"><dt>{t.merchandise}</dt><dd><Price amount={merch} /></dd></div>}
            {giftTotal > 0 && <div className="flex justify-between"><dt>{t.giftCards}</dt><dd><Price amount={giftTotal} /></dd></div>}
            {needsShipping && <div className="flex justify-between"><dt>{t.shipping}</dt><dd className="font-spec">{t.complimentary}</dd></div>}
            {merch > 0 && (
              <div className="flex justify-between gap-4">
                <dt>{isCA ? t.taxOf(taxLabel(province)) : t.salesTax}</dt>
                <dd>{isCA ? <Price amount={tax} /> : <span className="text-xs text-[var(--text-taupe)]">{t.byShopify}</span>}</dd>
              </div>
            )}
            {cardsTotal > 0 && (
              <div className="flex justify-between text-[var(--gold-vermeil)]"><dt>{t.cardsApplied}</dt><dd>− <Price amount={cardsTotal} /></dd></div>
            )}
            <div className="flex items-baseline justify-between border-t border-[var(--border-hairline)] pt-4 text-base">
              <dt className="text-[11px] uppercase tracking-[0.2em]">{t.due}</dt>
              <dd className="text-xl"><Price amount={total} /></dd>
            </div>
          </dl>
        </div>
      </aside>
    </section>
  )
}
