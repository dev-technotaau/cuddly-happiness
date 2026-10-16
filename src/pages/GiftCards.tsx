import { useRef, useState } from 'react'
import { Check, Gift, Mail, Package, Send } from 'lucide-react'
import { formatDay, formatPrice, isoDate, addDays } from '../data/catalog'
import { CUSTOM_RANGE, DENOMINATIONS, DESIGNS, GIFT_CARD_SLUG, type GiftCardLine, type GiftDelivery } from '../data/giftcards'
import { href, useStore } from '../store'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import BalanceChecker from '../components/giftcard/BalanceChecker'
import Accordion from '../components/pdp/Accordion'
import SectionHeader from '../components/home/SectionHeader'
import useReveal from '../components/useReveal'
import Price from '../components/Price'

const MESSAGE_MAX = 200

export default function GiftCards() {
  const root = useRef<HTMLDivElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const { currency, addToCart } = useStore()
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
    if (!Number.isFinite(value) || value < min || value > max) errs.push(`Choose an amount between ${formatPrice(min, currency)} and ${formatPrice(max, currency)}.`)
    if (!toSelf && !recipientName.trim()) errs.push('Add the recipient’s name.')
    if (!toSelf && delivery === 'email' && !/^\S+@\S+\.\S+$/.test(recipientEmail)) errs.push('Add a valid recipient email.')
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
              <a href={href.category('gifts')} className="hover:text-[var(--text-espresso)]">Gifts</a> / Carte-cadeau
            </p>
            <h1 className="font-serif-editorial mt-6 text-[3.25rem] font-light leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-[7rem]">
              The gift of <em className="text-[var(--gold-vermeil)]">choosing</em>.
            </h1>
            <p className="mt-8 max-w-md leading-relaxed text-[var(--text-taupe)]">
              Redeemable online and in our Sherbrooke Street salon, in Canada and the United States. Sent instantly by email or mailed in our travertine box. Never expires.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--text-taupe)]">
              {['No expiry, no fees', 'Schedule delivery', 'Online & in salon'].map((t) => (
                <span key={t} className="flex items-center gap-2"><Check size={14} strokeWidth={1.5} className="text-[var(--gold-vermeil)]" /> {t}</span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -right-6 -top-6 w-[85%] rotate-6 opacity-60"><GiftCardArt design="espresso" currency={currency} amount={500} /></div>
              <div className="relative -rotate-3"><GiftCardArt design="travertine" currency={currency} amount={250} to="you" /></div>
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
                <p className="font-serif-editorial text-xl italic leading-relaxed">“{message.trim()}”</p>
                {senderName.trim() && <p className="font-spec mt-4 text-[10px] uppercase tracking-[0.24em] text-[var(--text-taupe)]">— {senderName.trim()}</p>}
              </div>
            )}
            <dl className="font-spec mt-8 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)] text-center text-[10px] uppercase tracking-[0.18em]">
              <div className="py-4"><dt className="text-[var(--text-linen)]">Design</dt><dd className="mt-1">{DESIGNS.find((d) => d.id === design)?.name}</dd></div>
              <div className="py-4"><dt className="text-[var(--text-linen)]">Delivery</dt><dd className="mt-1">{delivery === 'email' ? 'Email' : 'Mailed'}</dd></div>
              <div className="py-4">
                <dt className="text-[var(--text-linen)]">Arrives</dt>
                <dd className="mt-1">{delivery === 'physical' ? '2–5 days' : toSelf || sendOn === today ? 'Instantly' : formatDay(new Date(sendOn + 'T00:00'))}</dd>
              </div>
            </dl>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-12 lg:col-span-5 lg:col-start-8" noValidate>
          {/* 01 Design */}
          <fieldset>
            <legend className={label}><span className={num}>01</span>Design</legend>
            <div className="grid grid-cols-4 gap-3">
              {DESIGNS.map((d) => (
                <button type="button" key={d.id} onClick={() => setDesign(d.id)} aria-pressed={design === d.id} className="group text-left">
                  <span className={`block aspect-[1.586] rounded-[6%/9%] ring-1 ring-offset-2 ring-offset-[var(--bg-travertine)] transition ${design === d.id ? 'ring-[var(--text-espresso)]' : 'ring-transparent group-hover:ring-[var(--border-hairline)]'}`} style={{ background: d.background }} />
                  <span className={`mt-2 block text-[10px] uppercase tracking-[0.16em] ${design === d.id ? '' : 'text-[var(--text-taupe)]'}`}>{d.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 02 Amount */}
          <fieldset>
            <legend className={label}><span className={num}>02</span>Amount <span className="font-spec normal-case tracking-normal text-[var(--text-linen)]">({currency})</span></legend>
            <div className="grid grid-cols-3 gap-2">
              {DENOMINATIONS[currency].map((d) => (
                <button type="button" key={d} onClick={() => { setAmount(d); setCustom('') }} className={`${choice(!custom && amount === d)} font-spec text-center text-sm`}>
                  {formatPrice(d, currency)}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center border border-[var(--border-hairline)] focus-within:border-[var(--text-espresso)]">
              <span className="font-spec pl-4 text-sm text-[var(--text-taupe)]">$</span>
              <input
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder={`Custom amount, ${min}–${max.toLocaleString('en-CA')}`}
                className="font-spec min-w-0 flex-1 bg-transparent px-2 py-3.5 text-sm outline-none placeholder:text-[var(--text-linen)]"
              />
            </label>
          </fieldset>

          {/* 03 Delivery */}
          <fieldset>
            <legend className={label}><span className={num}>03</span>Delivery</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['email', Mail, 'By email', 'Instantly or on a date you choose'],
                ['physical', Package, 'Physical card', 'Mailed in our travertine box · free'],
              ] as const).map(([id, Icon, t, d]) => (
                <button type="button" key={id} onClick={() => setDelivery(id)} className={choice(delivery === id)}>
                  <Icon size={16} strokeWidth={1.3} className={delivery === id ? 'text-[var(--gold-champagne)]' : 'text-[var(--gold-vermeil)]'} />
                  <span className="mt-3 block text-[11px] uppercase tracking-[0.18em]">{t}</span>
                  <span className={`mt-1 block text-xs ${delivery === id ? 'text-white/60' : 'text-[var(--text-linen)]'}`}>{d}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 04 Recipient */}
          <fieldset>
            <legend className={label}><span className={num}>04</span>Recipient</legend>
            <div className="grid grid-cols-2 border border-[var(--border-hairline)]">
              {[false, true].map((self) => (
                <button type="button" key={String(self)} onClick={() => setToSelf(self)} className={`py-3 text-[11px] uppercase tracking-[0.18em] transition-colors ${toSelf === self ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}>
                  {self ? 'For me' : 'For someone else'}
                </button>
              ))}
            </div>
            {!toSelf && (
              <div className="mt-4 space-y-3">
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name" aria-label="Recipient name" className={input} />
                {delivery === 'email' && (
                  <>
                    <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Recipient email" aria-label="Recipient email" className={input} />
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">Send on</span>
                      <input type="date" value={sendOn} min={today} max={maxDate} onChange={(e) => setSendOn(e.target.value || today)} className={`${input} font-spec mt-2`} />
                    </label>
                  </>
                )}
                {delivery === 'physical' && <p className="text-xs text-[var(--text-linen)]">You’ll enter the mailing address at checkout.</p>}
              </div>
            )}
            <div className="mt-3 space-y-3">
              <div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))} rows={3} placeholder="Add a personal message (optional)" aria-label="Personal message" className={`${input} resize-none`} />
                <p className="font-spec mt-1 text-right text-[10px] text-[var(--text-linen)]">{message.length}/{MESSAGE_MAX}</p>
              </div>
              <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="From (your name)" aria-label="Your name" className={input} />
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
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer cards" className="px-4 py-4">−</button>
                <span className="font-spec w-6 text-center text-sm">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More cards" className="px-4 py-4">+</button>
              </div>
              <button className={`flex flex-1 items-center justify-center gap-3 py-5 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 ${added ? 'bg-[var(--gold-vermeil)]' : 'bg-[var(--text-espresso)] hover:bg-[var(--gold-vermeil)]'}`}>
                {added ? <><Check size={15} strokeWidth={1.6} /> Added to bag</> : <>Add to bag <span className="opacity-40">—</span> <Price amount={Number.isFinite(value) ? Math.round(value) * qty : 0} className="[&_span]:text-white/50" /></>}
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--text-linen)]">Gift cards are not taxed at purchase and cannot be paid for with another gift card.</p>
          </div>
        </form>
      </section>

      {/* How it works */}
      <section className="border-y border-[var(--border-hairline)] bg-[var(--bg-silk)]">
        <ol className="mx-auto grid max-w-[1600px] gap-px bg-[var(--border-hairline)] sm:grid-cols-3">
          {[
            [Gift, 'Choose', 'Pick a design and amount, or set your own.'],
            [Send, 'Send', 'Emailed now or on the date you choose, or mailed in our travertine box.'],
            [Check, 'Redeem', 'Enter the 16-character code at checkout, or present it in our salon.'],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Gift
            return (
              <li key={t as string} data-reveal={i * 0.08} className="bg-[var(--bg-silk)] p-10 lg:p-14">
                <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
                <I size={22} strokeWidth={1.2} className="mt-6 text-[var(--gold-vermeil)]" />
                <h3 className="font-serif-editorial mt-6 text-3xl">{t as string}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-taupe)]">{d as string}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Balance */}
      <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
          <div className="lg:col-span-5">
            <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">Solde</p>
            <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-5xl font-light leading-[1] lg:text-7xl">
              Check your <em className="text-[var(--gold-champagne)]">balance</em>
            </h2>
            <p data-reveal="0.1" className="mt-6 max-w-sm text-white/60">Balances update after every purchase. Cards can be combined, and any remainder stays on the card.</p>
          </div>
          <div data-reveal="0.1" className="lg:col-span-6 lg:col-start-7"><BalanceChecker tone="dark" /></div>
        </div>
      </section>

      {/* FAQ + corporate */}
      <section className="mx-auto grid max-w-[1600px] gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-4">
          <SectionHeader index="—" eyebrow="Questions" title={<>Gift card <em className="text-[var(--gold-vermeil)]">details</em></>} />
          <div className="-mt-4 border border-[var(--border-hairline)] p-8">
            <p className="font-serif-editorial text-3xl">Corporate gifting</p>
            <p className="mt-3 text-sm text-[var(--text-taupe)]">Ordering ten or more cards, or cards with your company’s design? Our concierge will prepare a bespoke quote.</p>
            <a href={href.atelier} className="link-line mt-6">Contact concierge</a>
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6 lg:pt-24">
          <Accordion
            defaultOpen="where"
            items={[
              { id: 'where', title: 'Where can I use it?', content: 'Online at teresaandsons.com in Canada and the United States, and in our Montréal salon. Cards can be used on any piece, including rentals and bespoke commissions.' },
              { id: 'expiry', title: 'Does it expire?', content: 'Never. There are no fees or expiry dates, in line with Québec and provincial consumer protection law.' },
              { id: 'currency', title: 'Canadian or U.S. dollars?', content: 'Cards are issued in the currency you buy them in. If redeemed in the other market, the balance converts at the rate shown at checkout.' },
              { id: 'combine', title: 'Can I combine several cards?', content: 'Yes. Add as many cards as you like at checkout; any remaining balance stays on the card for next time. Gift cards cannot be used to buy other gift cards.' },
              { id: 'lost', title: 'What if the card is lost?', content: 'Email cards can be resent from your order confirmation. For physical cards, contact us with your order number and we will reissue the remaining balance.' },
              { id: 'return', title: 'Can I return a gift card?', content: 'Gift cards are non-refundable, except where required by law. Pieces bought with a gift card are refunded to a new gift card.' },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
