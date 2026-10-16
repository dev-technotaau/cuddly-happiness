import { useState } from 'react'
import { Heart, LogOut, Package, Ruler, Sparkles } from 'lucide-react'
import { IMG } from '../data/catalog'
import { href, useStore } from '../store'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import BalanceChecker from '../components/giftcard/BalanceChecker'
import { loadLedger, maskCode } from '../data/giftcards'
import { formatPrice } from '../data/catalog'

const field = 'mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]'
const label = 'text-[11px] uppercase tracking-[0.22em]'

export default function Account() {
  const { user, signIn, signOut, wishlist, currency, setCurrency } = useStore()
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  if (!user) {
    return (
      <section className="grid min-h-[80vh] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[var(--bg-vault)] lg:block">
          <img src={IMG.bridal2} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)] to-transparent" />
          <p className="font-serif-editorial absolute bottom-14 left-12 right-12 text-5xl font-light leading-tight text-[var(--bg-travertine)]">
            Welcome to the <em className="text-[var(--gold-champagne)]">family</em>.
          </p>
        </div>
        <div className="flex items-center px-6 py-20 lg:px-20">
          <form
            className="w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const email = String(data.get('email'))
              signIn({ email, name: String(data.get('name') || email.split('@')[0]) })
            }}
          >
            <div className="flex gap-8 border-b border-[var(--border-hairline)]">
              {(['signin', 'register'] as const).map((m) => (
                <button type="button" key={m} onClick={() => setMode(m)} className={`-mb-px border-b pb-4 ${label} ${mode === m ? 'border-[var(--text-espresso)]' : 'border-transparent text-[var(--text-linen)]'}`}>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
            <h1 className="font-serif-editorial mt-10 text-5xl font-light">{mode === 'signin' ? 'Bon retour.' : 'Join the maison.'}</h1>
            <div className="mt-10 space-y-8">
              {mode === 'register' && <label className="block"><span className={label}>Full name</span><input name="name" required className={field} /></label>}
              <label className="block"><span className={label}>Email</span><input name="email" type="email" required className={field} /></label>
              <label className="block"><span className={label}>Password</span><input name="password" type="password" required minLength={8} className={field} /></label>
            </div>
            {mode === 'register' && (
              <label className="mt-6 flex items-center gap-3 text-sm text-[var(--text-taupe)]">
                <input type="checkbox" className="accent-[var(--gold-vermeil)]" /> Receive La Lettre and private sale invitations
              </label>
            )}
            <button className="mt-10 w-full bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <p className="mt-6 text-xs text-[var(--text-linen)]">Accounts are managed through Shopify Customer Accounts.</p>
          </form>
        </div>
      </section>
    )
  }

  const tiles = [
    { icon: Package, title: 'Orders', body: 'No orders yet. Track deliveries and rental returns here.', link: href.category('necklaces'), cta: 'Start shopping' },
    { icon: Heart, title: 'Wishlist', body: `${wishlist.length} saved ${wishlist.length === 1 ? 'piece' : 'pieces'}.`, link: href.wishlist, cta: 'View wishlist' },
    { icon: Ruler, title: 'Ring sizes', body: 'Save your sizes for faster checkout and gifting.', link: href.atelier, cta: 'Book a sizing' },
    { icon: Sparkles, title: 'Care & servicing', body: 'Complimentary cleaning and inspection, every year.', link: href.atelier, cta: 'Book an appointment' },
  ]

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Mon compte</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-7xl">Bonjour, <em className="text-[var(--gold-vermeil)]">{user.name}</em>.</h1>
          <p className="mt-3 text-sm text-[var(--text-taupe)]">{user.email}</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.22em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)] sm:self-auto">
          <LogOut size={14} strokeWidth={1.4} /> Sign out
        </button>
      </div>

      <div className="mt-12 grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, title, body, link, cta }) => (
          <a key={title} href={link} className="group flex flex-col bg-[var(--bg-travertine)] p-8 transition-colors hover:bg-[var(--bg-silk)]">
            <Icon size={20} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" />
            <h2 className="font-serif-editorial mt-8 text-3xl">{title}</h2>
            <p className="mt-3 flex-1 text-sm text-[var(--text-taupe)]">{body}</p>
            <span className="mt-8 text-[11px] uppercase tracking-[0.22em] group-hover:text-[var(--gold-vermeil)]">{cta} &rarr;</span>
          </a>
        ))}
      </div>

      {/* Gift card wallet */}
      <div className="mt-12 grid gap-10 border border-[var(--border-hairline)] p-8 lg:grid-cols-2">
        <div>
          <p className={label}>Gift cards</p>
          {(() => {
            const cards = loadLedger().filter((c) => c.code !== 'TERESASONS1962MT')
            return cards.length ? (
              <ul className="mt-5 grid grid-cols-2 gap-4">
                {cards.map((c) => (
                  <li key={c.code}>
                    <GiftCardArt design={c.design} currency={c.currency} amount={c.initial} to={c.recipientName} />
                    <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{maskCode(c.code)} · {formatPrice(c.balance, c.currency)} left</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">Gift cards you buy will appear here. <a href={href.giftcards} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">Send one</a></p>
            )
          })()}
        </div>
        <BalanceChecker />
      </div>

      <div className="mt-12 max-w-2xl">
        <RecentlyViewedStrip limit={5} />
      </div>

      <div className="mt-12 flex flex-col justify-between gap-4 border border-[var(--border-hairline)] p-8 sm:flex-row sm:items-center">
        <div>
          <p className={label}>Preferred market</p>
          <p className="mt-1 text-sm text-[var(--text-taupe)]">Sets currency, taxes and shipping options.</p>
        </div>
        <div className="grid grid-cols-2 border border-[var(--border-hairline)]">
          {(['CAD', 'USD'] as const).map((c) => (
            <button key={c} onClick={() => setCurrency(c)} className={`px-6 py-3 text-[11px] uppercase tracking-[0.2em] ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}>
              {c === 'CAD' ? 'Canada' : 'United States'}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
