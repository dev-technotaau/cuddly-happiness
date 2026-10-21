import { useState } from 'react'
import { Heart, LogOut, Package, Ruler, Sparkles } from 'lucide-react'
import { IMG } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import LanguageToggle from '../components/locale/LanguageToggle'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import BalanceChecker from '../components/giftcard/BalanceChecker'
import { loadLedger, maskCode } from '../data/giftcards'
import { formatPrice } from '../data/catalog'

const field = 'mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]'
const label = 'text-[11px] uppercase tracking-[0.22em]'

const COPY = bilingual(
  {
    welcome: 'Welcome to the <em>family</em>.',
    signIn: 'Sign in',
    create: 'Create account',
    back: 'Bon retour.',
    join: 'Join the maison.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    letter: 'Receive La Lettre and private sale invitations',
    managed: 'Accounts are managed through Shopify Customer Accounts.',
    tiles: {
      orders: ['Orders', 'No orders yet. Track deliveries and rental returns here.', 'Start shopping'],
      wishlist: ['Wishlist', '', 'View wishlist'],
      sizes: ['Ring sizes', 'Save your sizes for faster checkout and gifting.', 'Book a sizing'],
      care: ['Care & servicing', 'Complimentary cleaning and inspection, every year.', 'Book an appointment'],
    } as Record<'orders' | 'wishlist' | 'sizes' | 'care', [string, string, string]>,
    saved: (n: number) => `${n} saved piece${n === 1 ? '' : 's'}.`,
    eyebrow: 'Mon compte',
    hello: (name: string) => `Bonjour, <em>${name}</em>.`,
    signOut: 'Sign out',
    giftCards: 'Gift cards',
    left: (amount: string) => `${amount} left`,
    none: 'Gift cards you buy will appear here.',
    send: 'Send one',
    market: 'Preferred market',
    marketText: 'Sets currency, taxes and shipping options.',
    countries: { CAD: 'Canada', USD: 'United States' },
    language: 'Language',
    languageText: 'Used across the site, and for our emails and La Lettre.',
  },
  {
    welcome: 'Bienvenue dans la <em>famille</em>.',
    signIn: 'Se connecter',
    create: 'Créer un compte',
    back: 'Bon retour.',
    join: 'Rejoignez la maison.',
    name: 'Nom complet',
    email: 'Courriel',
    password: 'Mot de passe',
    letter: 'Recevoir La Lettre et les invitations aux ventes privées',
    managed: 'Les comptes sont gérés par les comptes clients Shopify.',
    tiles: {
      orders: ['Commandes', 'Aucune commande pour l’instant. Suivez ici vos livraisons et vos retours de location.', 'Commencer le magasinage'],
      wishlist: ['Liste de souhaits', '', 'Voir la liste'],
      sizes: ['Tailles de bague', 'Enregistrez vos tailles pour un paiement et des cadeaux plus rapides.', 'Prendre ma taille'],
      care: ['Entretien et service', 'Nettoyage et inspection offerts, chaque année.', 'Prendre rendez-vous'],
    },
    saved: (n) => (n < 2 ? `${n} pièce enregistrée.` : `${n} pièces enregistrées.`),
    eyebrow: 'Espace client',
    hello: (name) => `Bonjour, <em>${name}</em>.`,
    signOut: 'Se déconnecter',
    giftCards: 'Cartes-cadeaux',
    left: (amount) => `reste ${amount}`,
    none: 'Les cartes-cadeaux que vous achetez apparaîtront ici.',
    send: 'En offrir une',
    market: 'Marché préféré',
    marketText: 'Détermine la devise, les taxes et les options de livraison.',
    countries: { CAD: 'Canada', USD: 'États-Unis' },
    language: 'Langue',
    languageText: 'Utilisée sur le site, ainsi que pour nos courriels et La Lettre.',
  },
)

export default function Account() {
  const { user, signIn, signOut, wishlist, currency, setCurrency } = useStore()
  const t = useCopy(COPY)
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  if (!user) {
    return (
      <section className="grid min-h-[80vh] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[var(--bg-vault)] lg:block">
          <img src={IMG.bridal2} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)] to-transparent" />
          <p className="font-serif-editorial absolute bottom-14 left-12 right-12 text-5xl font-light leading-tight text-[var(--bg-travertine)]">
            {rich(t.welcome, 'text-[var(--gold-champagne)]')}
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
                  {m === 'signin' ? t.signIn : t.create}
                </button>
              ))}
            </div>
            <h1 className="font-serif-editorial mt-10 text-5xl font-light">{mode === 'signin' ? t.back : t.join}</h1>
            <div className="mt-10 space-y-8">
              {mode === 'register' && <label className="block"><span className={label}>{t.name}</span><input name="name" required autoComplete="name" className={field} /></label>}
              <label className="block"><span className={label}>{t.email}</span><input name="email" type="email" required autoComplete="email" className={field} /></label>
              <label className="block"><span className={label}>{t.password}</span><input name="password" type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className={field} /></label>
            </div>
            {mode === 'register' && (
              <label className="mt-6 flex items-center gap-3 text-sm text-[var(--text-taupe)]">
                <input type="checkbox" className="accent-[var(--gold-vermeil)]" /> {t.letter}
              </label>
            )}
            <button className="mt-10 w-full bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)]">
              {mode === 'signin' ? t.signIn : t.create}
            </button>
            <p className="mt-6 text-xs text-[var(--text-linen)]">{t.managed}</p>
          </form>
        </div>
      </section>
    )
  }

  const tile = (key: keyof typeof t.tiles, icon: typeof Package, link: string, body?: string) => ({ icon, title: t.tiles[key][0], body: body ?? t.tiles[key][1], link, cta: t.tiles[key][2] })
  const tiles = [
    tile('orders', Package, href.category('necklaces')),
    tile('wishlist', Heart, href.wishlist, t.saved(wishlist.length)),
    tile('sizes', Ruler, href.atelier),
    tile('care', Sparkles, href.atelier),
  ]

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-7xl">{rich(t.hello(user.name), 'text-[var(--gold-vermeil)]')}</h1>
          <p className="mt-3 text-sm text-[var(--text-taupe)]">{user.email}</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.22em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)] sm:self-auto">
          <LogOut size={14} strokeWidth={1.4} /> {t.signOut}
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
          <p className={label}>{t.giftCards}</p>
          {(() => {
            const cards = loadLedger().filter((c) => c.code !== 'TERESASONS1962MT')
            return cards.length ? (
              <ul className="mt-5 grid grid-cols-2 gap-4">
                {cards.map((c) => (
                  <li key={c.code}>
                    <GiftCardArt design={c.design} currency={c.currency} amount={c.initial} to={c.recipientName} />
                    <p className="font-spec mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--text-taupe)]">{maskCode(c.code)} · {t.left(formatPrice(c.balance, c.currency))}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-taupe)]">{t.none} <a href={href.giftcards} className="border-b border-[var(--gold-vermeil)] text-[var(--text-espresso)]">{t.send}</a></p>
            )
          })()}
        </div>
        <BalanceChecker />
      </div>

      <div className="mt-12 max-w-2xl">
        <RecentlyViewedStrip limit={5} />
      </div>

      {/* Preferences: language and market, the two halves of the visitor's locale */}
      <div className="mt-12 grid gap-px border border-[var(--border-hairline)] bg-[var(--border-hairline)] lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 bg-[var(--bg-travertine)] p-8 sm:flex-row sm:items-center">
          <div>
            <p className={label}>{t.language}</p>
            <p className="mt-1 text-sm text-[var(--text-taupe)]">{t.languageText}</p>
          </div>
          <LanguageToggle full className="shrink-0 [&_button]:px-5 [&_button]:py-3" />
        </div>
        <div className="flex flex-col justify-between gap-4 bg-[var(--bg-travertine)] p-8 sm:flex-row sm:items-center">
          <div>
            <p className={label}>{t.market}</p>
            <p className="mt-1 text-sm text-[var(--text-taupe)]">{t.marketText}</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 border border-[var(--border-hairline)]">
            {(['CAD', 'USD'] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} aria-pressed={currency === c} className={`px-6 py-3 text-[11px] uppercase tracking-[0.2em] ${currency === c ? 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : ''}`}>
                {t.countries[c]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
