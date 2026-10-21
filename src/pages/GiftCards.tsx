import { useRef, useState } from 'react'
import { Check, Gift, Mail, Package, Send } from 'lucide-react'
import { formatDay, formatPrice, isoDate, addDays } from '../data/catalog'
import { CUSTOM_RANGE, DENOMINATIONS, DESIGNS, GIFT_CARD_SLUG, type GiftCardLine, type GiftDelivery } from '../data/giftcards'
import { bilingual, formatNumber, useCopy, useLocale } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { COMMON } from '../i18n/common'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import BalanceChecker from '../components/giftcard/BalanceChecker'
import Accordion from '../components/pdp/Accordion'
import SectionHeader from '../components/home/SectionHeader'
import useReveal from '../components/useReveal'
import Price from '../components/Price'

const MESSAGE_MAX = 200

const HOW_ICONS = [Gift, Send, Check]

const COPY = bilingual(
  {
    between: (min: string, max: string) => `Choose an amount between ${min} and ${max}.`,
    needName: 'Add the recipient’s name.',
    needEmail: 'Add a valid recipient email.',
    gifts: 'Gifts',
    title: 'The gift of <em>choosing</em>.',
    intro: 'Redeemable online and in our Sherbrooke Street salon, in Canada and the United States. Sent instantly by email or mailed in our travertine box. Never expires.',
    perks: ['No expiry, no fees', 'Schedule delivery', 'Online & in salon'],
    you: 'you',
    design: 'Design',
    delivery: 'Delivery',
    email: 'Email',
    mailed: 'Mailed',
    arrives: 'Arrives',
    days: '2–5 days',
    instantly: 'Instantly',
    amount: 'Amount',
    custom: (min: number, max: string) => `Custom amount, ${min}–${max}`,
    options: { email: ['By email', 'Instantly or on a date you choose'], physical: ['Physical card', 'Mailed in our travertine box · free'] } as Record<GiftDelivery, [string, string]>,
    recipient: 'Recipient',
    forMe: 'For me',
    forOther: 'For someone else',
    recipientName: 'Recipient name',
    recipientEmail: 'Recipient email',
    sendOn: 'Send on',
    address: 'You’ll enter the mailing address at checkout.',
    messageHint: 'Add a personal message (optional)',
    message: 'Personal message',
    fromHint: 'From (your name)',
    from: 'Your name',
    fewer: 'Fewer cards',
    more: 'More cards',
    untaxed: 'Gift cards are not taxed at purchase and cannot be paid for with another gift card.',
    how: [
      ['Choose', 'Pick a design and amount, or set your own.'],
      ['Send', 'Emailed now or on the date you choose, or mailed in our travertine box.'],
      ['Redeem', 'Enter the 16-character code at checkout, or present it in our salon.'],
    ] as [string, string][],
    balanceEyebrow: 'Solde',
    balanceTitle: 'Check your <em>balance</em>',
    balanceText: 'Balances update after every purchase. Cards can be combined, and any remainder stays on the card.',
    questions: 'Questions',
    detailsTitle: 'Gift card <em>details</em>',
    corporate: 'Corporate gifting',
    corporateText: 'Ordering ten or more cards, or cards with your company’s design? Our concierge will prepare a bespoke quote.',
    contact: 'Contact concierge',
    faq: [
      { id: 'where', title: 'Where can I use it?', content: 'Online at teresaandsons.com in Canada and the United States, and in our Montréal salon. Cards can be used on any piece, including rentals and bespoke commissions.' },
      { id: 'expiry', title: 'Does it expire?', content: 'Never. There are no fees or expiry dates, in line with Québec and provincial consumer protection law.' },
      { id: 'currency', title: 'Canadian or U.S. dollars?', content: 'Cards are issued in the currency you buy them in. If redeemed in the other market, the balance converts at the rate shown at checkout.' },
      { id: 'combine', title: 'Can I combine several cards?', content: 'Yes. Add as many cards as you like at checkout; any remaining balance stays on the card for next time. Gift cards cannot be used to buy other gift cards.' },
      { id: 'lost', title: 'What if the card is lost?', content: 'Email cards can be resent from your order confirmation. For physical cards, contact us with your order number and we will reissue the remaining balance.' },
      { id: 'return', title: 'Can I return a gift card?', content: 'Gift cards are non-refundable, except where required by law. Pieces bought with a gift card are refunded to a new gift card.' },
    ],
  },
  {
    between: (min, max) => `Choisissez un montant entre ${min} et ${max}.`,
    needName: 'Ajoutez le nom du destinataire.',
    needEmail: 'Ajoutez un courriel valide pour le destinataire.',
    gifts: 'Cadeaux',
    title: 'Le plaisir de <em>choisir</em>.',
    intro: 'Échangeable en ligne et dans notre salon de la rue Sherbrooke, au Canada comme aux États-Unis. Envoyée instantanément par courriel ou postée dans notre écrin travertin. Sans date d’expiration.',
    perks: ['Sans expiration ni frais', 'Envoi programmé', 'En ligne et au salon'],
    you: 'vous',
    design: 'Motif',
    delivery: 'Livraison',
    email: 'Courriel',
    mailed: 'Postée',
    arrives: 'Arrivée',
    days: '2 à 5 jours',
    instantly: 'Instantanément',
    amount: 'Montant',
    custom: (min, max) => `Montant personnalisé, de ${min} à ${max}`,
    options: { email: ['Par courriel', 'Instantanément ou à la date de votre choix'], physical: ['Carte physique', 'Postée dans notre écrin travertin · offerte'] },
    recipient: 'Destinataire',
    forMe: 'Pour moi',
    forOther: 'Pour quelqu’un d’autre',
    recipientName: 'Nom du destinataire',
    recipientEmail: 'Courriel du destinataire',
    sendOn: 'Date d’envoi',
    address: 'Vous saisirez l’adresse postale au paiement.',
    messageHint: 'Ajoutez un mot personnel (facultatif)',
    message: 'Mot personnel',
    fromHint: 'De la part de (votre nom)',
    from: 'Votre nom',
    fewer: 'Moins de cartes',
    more: 'Plus de cartes',
    untaxed: 'Les cartes-cadeaux ne sont pas taxées à l’achat et ne peuvent pas être payées avec une autre carte-cadeau.',
    how: [
      ['Choisir', 'Choisissez un motif et un montant, ou fixez le vôtre.'],
      ['Envoyer', 'Par courriel, maintenant ou à la date choisie, ou par la poste dans notre écrin travertin.'],
      ['Échanger', 'Saisissez le code de 16 caractères au paiement, ou présentez-le à notre salon.'],
    ],
    balanceEyebrow: 'Solde',
    balanceTitle: 'Vérifiez votre <em>solde</em>',
    balanceText: 'Le solde est mis à jour après chaque achat. Les cartes se combinent, et tout reste demeure sur la carte.',
    questions: 'Questions',
    detailsTitle: 'Tout sur la <em>carte-cadeau</em>',
    corporate: 'Cadeaux d’entreprise',
    corporateText: 'Vous commandez dix cartes ou plus, ou des cartes à l’image de votre entreprise? Notre concierge préparera une soumission sur mesure.',
    contact: 'Écrire au concierge',
    faq: [
      { id: 'where', title: 'Où puis-je l’utiliser?', content: 'En ligne sur teresaandsons.com, au Canada et aux États-Unis, ainsi qu’à notre salon de Montréal. Les cartes s’utilisent sur toutes les pièces, y compris les locations et les créations sur mesure.' },
      { id: 'expiry', title: 'Expire-t-elle?', content: 'Jamais. Aucuns frais ni date d’expiration, conformément à la Loi sur la protection du consommateur du Québec et aux lois des autres provinces.' },
      { id: 'currency', title: 'Dollars canadiens ou américains?', content: 'Les cartes sont émises dans la devise de l’achat. Si elles sont utilisées dans l’autre marché, le solde est converti au taux indiqué au paiement.' },
      { id: 'combine', title: 'Puis-je combiner plusieurs cartes?', content: 'Oui. Ajoutez autant de cartes que vous le souhaitez au paiement; le solde restant demeure sur la carte pour la prochaine fois. Les cartes-cadeaux ne peuvent pas servir à acheter d’autres cartes-cadeaux.' },
      { id: 'lost', title: 'Et si la carte est perdue?', content: 'Les cartes envoyées par courriel peuvent être renvoyées depuis votre confirmation de commande. Pour une carte physique, écrivez-nous avec votre numéro de commande et nous réémettrons le solde restant.' },
      { id: 'return', title: 'Puis-je retourner une carte-cadeau?', content: 'Les cartes-cadeaux ne sont pas remboursables, sauf lorsque la loi l’exige. Les pièces achetées avec une carte-cadeau sont remboursées sur une nouvelle carte-cadeau.' },
    ],
  },
)

export default function GiftCards() {
  const root = useRef<HTMLDivElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const { currency, addToCart } = useStore()
  const { lang } = useLocale()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const catalog = useCatalog()
  useReveal(root)

  const [design, setDesign] = useState(DESIGNS[0].id)
  const [amount, setAmount] = useState<number>(250)
  const [custom, setCustom] = useState('')
  const [delivery, setDelivery] = useState<GiftDelivery>('email')
  const [toSelf, setToSelf] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [sendOn, setSendOn] = useState(isoDate(new Date()))
  const [qty, setQty] = useState(1)
  const [errors, setErrors] = useState<string[]>([])
  const [added, setAdded] = useState(false)

  const [min, max] = CUSTOM_RANGE[currency]
  const customNum = Number(custom)
  const value = custom ? customNum : amount
  const today = isoDate(new Date())
  const maxDate = isoDate(addDays(new Date(), 365))

  // Subtle 3D tilt following the pointer.
  const onTilt = (e: React.PointerEvent) => {
    const el = preview.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1200px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`
  }
  const resetTilt = () => preview.current && (preview.current.style.transform = '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!Number.isFinite(value) || value < min || value > max) errs.push(t.between(formatPrice(min, currency), formatPrice(max, currency)))
    if (!toSelf && !recipientName.trim()) errs.push(t.needName)
    if (!toSelf && delivery === 'email' && !/^\S+@\S+\.\S+$/.test(recipientEmail)) errs.push(t.needEmail)
    setErrors(errs)
    if (errs.length) return
    const line: GiftCardLine = {
      amount: Math.round(value),
      currency,
      design,
      delivery,
      toSelf,
      recipientName: toSelf ? undefined : recipientName.trim(),
      recipientEmail: toSelf || delivery !== 'email' ? undefined : recipientEmail.trim(),
      senderName: senderName.trim() || undefined,
      message: message.trim() || undefined,
      sendOn: !toSelf && delivery === 'email' && sendOn !== today ? sendOn : undefined,
    }
    for (let i = 0; i < qty; i++) addToCart({ slug: GIFT_CARD_SLUG, giftCard: line })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2400)
  }

  const label = 'mb-4 block text-[11px] uppercase tracking-[0.22em]'
  const num = 'font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]'
  const input = 'w-full border border-[var(--border-hairline)] bg-transparent px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]'
  const choice = (on: boolean) => `border px-4 py-3.5 text-left transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`
  const recipientShown = !toSelf ? recipientName.trim() || undefined : undefined

  return (
    <div ref={root}>
      {/* Hero */}
      <section className="border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
          <div className="lg:col-span-6">
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">
              <a href={href.category('gifts')} className="hover:text-[var(--text-espresso)]">{t.gifts}</a> / Carte-cadeau
            </p>
            <h1 className="font-serif-editorial mt-6 text-[3.25rem] font-light leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-[7rem]">
              {rich(t.title, 'text-[var(--gold-vermeil)]')}
            </h1>
            <p className="mt-8 max-w-md leading-relaxed text-[var(--text-taupe)]">
              {t.intro}
            </p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--text-taupe)]">
              {t.perks.map((p) => (
                <span key={p} className="flex items-center gap-2"><Check size={14} strokeWidth={1.5} className="text-[var(--gold-vermeil)]" /> {p}</span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -right-6 -top-6 w-[85%] rotate-6 opacity-60"><GiftCardArt design="espresso" currency={currency} amount={500} /></div>
              <div className="relative -rotate-3"><GiftCardArt design="travertine" currency={currency} amount={250} to={t.you} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Builder */}
      <section className="mx-auto grid max-w-[1600px] gap-16 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-36">
            <div ref={preview} onPointerMove={onTilt} onPointerLeave={resetTilt} className="transition-transform duration-500 ease-out [transform-style:preserve-3d]">
              <GiftCardArt design={design} currency={currency} amount={Number.isFinite(value) && value > 0 ? Math.round(value) : undefined} to={recipientShown} />
            </div>
            {message.trim() && (
              <div className="mx-auto mt-6 max-w-md border border-[var(--border-hairline)] bg-[var(--bg-travertine)] p-6 text-center shadow-[0_20px_40px_-30px_rgba(20,19,17,0.5)]">
                <p className="font-serif-editorial text-xl italic leading-relaxed">{common.quote(message.trim())}</p>
                {senderName.trim() && <p className="font-spec mt-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">— {senderName.trim()}</p>}
              </div>
            )}
            <dl className="font-spec mt-8 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-center text-[10px] uppercase tracking-[0.18em]">
              <div className="py-4"><dt className="text-[var(--text-linen)]">{t.design}</dt><dd className="mt-1">{catalog.design(design)}</dd></div>
              <div className="py-4"><dt className="text-[var(--text-linen)]">{t.delivery}</dt><dd className="mt-1">{delivery === 'email' ? t.email : t.mailed}</dd></div>
              <div className="py-4">
                <dt className="text-[var(--text-linen)]">{t.arrives}</dt>
                <dd className="mt-1">{delivery === 'physical' ? t.days : toSelf || sendOn === today ? t.instantly : formatDay(new Date(sendOn + 'T00:00'))}</dd>
              </div>
            </dl>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-12 lg:col-span-5 lg:col-start-8" noValidate>
          {/* 01 Design */}
          <fieldset>
            <legend className={label}><span className={num}>01</span>{t.design}</legend>
            <div className="grid grid-cols-4 gap-3">
              {DESIGNS.map((d) => (
                <button type="button" key={d.id} onClick={() => setDesign(d.id)} aria-pressed={design === d.id} className="group text-left">
                  <span className={`block aspect-[1.586] rounded-[6%/9%] ring-1 ring-offset-2 ring-offset-[var(--bg-travertine)] transition ${design === d.id ? 'ring-[var(--text-espresso)]' : 'ring-transparent group-hover:ring-[var(--border-hairline)]'}`} style={{ background: d.background }} />
                  <span className={`mt-2 block text-[10px] uppercase tracking-[0.16em] ${design === d.id ? '' : 'text-[var(--text-taupe)]'}`}>{catalog.design(d.id)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 02 Amount */}
          <fieldset>
            <legend className={label}><span className={num}>02</span>{t.amount} <span className="font-spec normal-case tracking-normal text-[var(--text-linen)]">({currency})</span></legend>
            <div className="grid grid-cols-3 gap-2">
              {DENOMINATIONS[currency].map((d) => (
                <button type="button" key={d} onClick={() => { setAmount(d); setCustom('') }} aria-pressed={!custom && amount === d} className={`${choice(!custom && amount === d)} font-spec text-center text-sm`}>
                  {formatPrice(d, currency)}
                </button>
              ))}
            </div>
            {/* The dollar sign sits where the language writes it: before the amount in English, after it in French */}
            <label className={`mt-3 flex items-center border border-[var(--border-hairline)] focus-within:border-[var(--text-espresso)] ${lang === 'fr' ? 'flex-row-reverse' : ''}`}>
              <span className={`font-spec text-sm text-[var(--text-taupe)] ${lang === 'fr' ? 'pr-4' : 'pl-4'}`}>$</span>
              <input
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder={t.custom(min, formatNumber(max))}
                aria-label={t.amount}
                className={`font-spec min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-[var(--text-linen)] ${lang === 'fr' ? 'pl-4 pr-2' : 'px-2'}`}
              />
            </label>
          </fieldset>

          {/* 03 Delivery */}
          <fieldset>
            <legend className={label}><span className={num}>03</span>{t.delivery}</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['email', Mail, ...t.options.email],
                ['physical', Package, ...t.options.physical],
              ] as const).map(([id, Icon, title, d]) => (
                <button type="button" key={id} onClick={() => setDelivery(id)} aria-pressed={delivery === id} className={choice(delivery === id)}>
                  <Icon size={16} strokeWidth={1.3} className={delivery === id ? 'text-[var(--gold-champagne)]' : 'text-[var(--gold-vermeil)]'} />
                  <span className="mt-3 block text-[11px] uppercase tracking-[0.18em]">{title}</span>
                  <span className={`mt-1 block text-xs ${delivery === id ? 'text-white/60' : 'text-[var(--text-linen)]'}`}>{d}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 04 Recipient */}
          <fieldset>
            <legend className={label}><span className={num}>04</span>{t.recipient}</legend>
            <div className="grid grid-cols-2 border border-[var(--border-hairline)]">
              {[false, true].map((self) => (
                <button type="button" key={String(self)} onClick={() => setToSelf(self)} aria-pressed={toSelf === self} className={`py-3 text-[11px] uppercase tracking-[0.18em] transition-colors ${toSelf === self ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}>
                  {self ? t.forMe : t.forOther}
                </button>
              ))}
            </div>
            {!toSelf && (
              <div className="mt-4 space-y-3">
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={t.recipientName} aria-label={t.recipientName} className={input} />
                {delivery === 'email' && (
                  <>
                    <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder={t.recipientEmail} aria-label={t.recipientEmail} className={input} />
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.sendOn}</span>
                      <input type="date" lang={lang} value={sendOn} min={today} max={maxDate} onChange={(e) => setSendOn(e.target.value || today)} className={`${input} font-spec mt-2`} />
                    </label>
                  </>
                )}
                {delivery === 'physical' && <p className="text-xs text-[var(--text-linen)]">{t.address}</p>}
              </div>
            )}
            <div className="mt-3 space-y-3">
              <div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))} rows={3} placeholder={t.messageHint} aria-label={t.message} className={`${input} resize-none`} />
                <p className="font-spec mt-1 text-right text-[10px] text-[var(--text-linen)]">{message.length}/{MESSAGE_MAX}</p>
              </div>
              <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder={t.fromHint} aria-label={t.from} className={input} />
            </div>
          </fieldset>

          {/* Add */}
          <div>
            {errors.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-red-700" role="alert">
                {errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
            <div className="flex gap-3">
              <div className="flex items-center border border-[var(--border-hairline)]">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t.fewer} className="px-4 py-4">−</button>
                <span className="font-spec w-6 text-center text-sm">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label={t.more} className="px-4 py-4">+</button>
              </div>
              <button className={`flex flex-1 items-center justify-center gap-3 py-5 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 ${added ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--text-espresso)] hover:bg-[var(--gold-vermeil)]'}`}>
                {added ? <><Check size={15} strokeWidth={1.6} /> {common.addedToBag}</> : <>{common.addToBag} <span className="opacity-40">—</span> <Price amount={Number.isFinite(value) ? Math.round(value) * qty : 0} className="[&_span]:text-white/50" /></>}
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--text-linen)]">{t.untaxed}</p>
          </div>
        </form>
      </section>

      {/* How it works */}
      <section className="border-y border-[var(--border-hairline)] bg-[var(--bg-silk)]">
        <ol className="mx-auto grid max-w-[1600px] gap-px bg-[var(--border-hairline)] sm:grid-cols-3">
          {t.how.map(([title, d], i) => {
            const I = HOW_ICONS[i]
            return (
              <li key={i} data-reveal={i * 0.08} className="bg-[var(--bg-silk)] p-10 lg:p-14">
                <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
                <I size={22} strokeWidth={1.2} className="mt-6 text-[var(--gold-vermeil)]" />
                <h3 className="font-serif-editorial mt-6 text-3xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{d}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Balance */}
      <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
          <div className="lg:col-span-5">
            <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.balanceEyebrow}</p>
            <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-5xl font-light leading-[1] lg:text-7xl">
              {rich(t.balanceTitle, 'text-[var(--gold-champagne)]')}
            </h2>
            <p data-reveal="0.1" className="mt-6 max-w-sm text-white/60">{t.balanceText}</p>
          </div>
          <div data-reveal="0.1" className="lg:col-span-6 lg:col-start-7"><BalanceChecker tone="dark" /></div>
        </div>
      </section>

      {/* FAQ + corporate */}
      <section className="mx-auto grid max-w-[1600px] gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-4">
          <SectionHeader index="—" eyebrow={t.questions} title={rich(t.detailsTitle, 'text-[var(--gold-vermeil)]')} />
          <div className="-mt-4 border border-[var(--border-hairline)] p-8">
            <p className="font-serif-editorial text-3xl">{t.corporate}</p>
            <p className="mt-3 text-sm text-[var(--text-taupe)]">{t.corporateText}</p>
            <a href={href.atelier} className="link-line mt-6">{t.contact}</a>
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6 lg:pt-24">
          <Accordion defaultOpen="where" items={t.faq} />
        </div>
      </section>
    </div>
  )
}
