import { useState } from 'react'
import { CalendarHeart, Gem, Heart, LogOut, Package, Ruler, Sparkles, X } from 'lucide-react'
import { IMG, formatDay, getProduct, parseIso, type Product } from '../data/catalog'
import { decodeDesign } from '../data/ring'
import { describeDesign } from '../data/ringCopy'
import { ringPrice } from '../data/ringPrice'
import { VISIT_COPY, formatTime, instantOf, upcoming } from '../data/visits'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import LanguageToggle from '../components/locale/LanguageToggle'
import { RecentlyViewedStrip } from '../components/RecentlyViewed'
import GiftCardArt from '../components/giftcard/GiftCardArt'
import BalanceChecker from '../components/giftcard/BalanceChecker'
import { loadLedger, maskCode } from '../data/giftcards'
import { formatPrice } from '../data/catalog'
import { RING_SIZES, sizeLabel } from '../components/pdp/RingSize'
import VisitButton from '../components/visit/VisitButton'
import Price from '../components/Price'

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
      sizes: ['Ring sizes', 'Save your sizes for faster checkout and gifting.', 'Book a visit'],
      care: ['Care & servicing', 'Complimentary cleaning and inspection, every year.', 'Book a visit'],
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
    visits: 'Your visits',
    noVisits: 'No visit booked yet. The salon receives Tuesday to Sunday, in person, by video or by phone.',
    change: 'Change',
    cancel: 'Cancel',
    past: 'Past visits',
    prepared: (n: number) => `${n} piece${n === 1 ? '' : 's'} prepared`,
    ringSize: 'Your ring size',
    ringSizeText: 'Ring pages open on it. Unsure? We size you at your visit.',
    choose: 'Choose a size',
    dates: 'Dates to remember',
    datesText: 'An anniversary, a birthday: we write two weeks before, with an idea or two.',
    dateLabel: 'What it is',
    datePlaceholder: 'Our anniversary',
    dateWhen: 'The date',
    add: 'Add',
    remove: (label: string) => `Remove ${label}`,
    care: 'Care',
    careText: 'Your annual cleaning and claw check are complimentary, for every piece, whatever its age.',
    careCta: 'Book a visit',
    designs: 'Your designs',
    designAnother: 'Design another ring',
    forgetDesign: (title: string) => `Remove ${title}`,
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
      sizes: ['Tailles de bague', 'Enregistrez vos tailles pour un paiement et des cadeaux plus rapides.', 'Prendre rendez-vous'],
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
    visits: 'Vos visites',
    noVisits: 'Aucune visite prévue. Le salon vous reçoit du mardi au dimanche, en personne, par vidéo ou par téléphone.',
    change: 'Modifier',
    cancel: 'Annuler',
    past: 'Visites passées',
    prepared: (n) => `${n} pièce${n < 2 ? '' : 's'} préparée${n < 2 ? '' : 's'}`,
    ringSize: 'Votre taille de bague',
    ringSizeText: 'Les pages des bagues s’ouvrent sur elle. Un doute ? Nous prenons votre taille lors de votre visite.',
    choose: 'Choisir une taille',
    dates: 'Dates à retenir',
    datesText: 'Un anniversaire, une fête : nous vous écrivons deux semaines avant, avec une idée ou deux.',
    dateLabel: 'De quoi s’agit-il',
    datePlaceholder: 'Notre anniversaire',
    dateWhen: 'La date',
    add: 'Ajouter',
    remove: (label) => `Retirer ${label}`,
    care: 'Entretien',
    careText: 'Le nettoyage annuel et la vérification des griffes sont offerts, pour chaque pièce, quel que soit son âge.',
    careCta: 'Prendre rendez-vous',
    designs: 'Vos créations',
    designAnother: 'Créer une autre bague',
    forgetDesign: (title) => `Retirer ${title}`,
  },
)

export default function Account() {
  const { user, signIn, signOut, wishlist, currency, setCurrency, visits, cancelVisit, openVisit, profile, setProfile, designs, forgetDesign } = useStore()
  const catalog = useCatalog()
  const v = useCopy(VISIT_COPY)
  const [dateLabel, setDateLabel] = useState('')
  const [dateWhen, setDateWhen] = useState('')
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
                <button type="button" key={m} onClick={() => setMode(m)} className={`-mb-px border-b pb-4 ${label} ${mode === m ? 'border-[var(--text-espresso)]' : 'border-transparent text-[var(--text-taupe)]'}`}>
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
            <p className="mt-6 text-xs text-[var(--text-taupe)]">{t.managed}</p>
          </form>
        </div>
      </section>
    )
  }

  // A tile is a link, or (for a visit) a button that opens the booking.
  const tile = (key: keyof typeof t.tiles, icon: typeof Package, link: string | (() => void), body?: string) => ({ icon, title: t.tiles[key][0], body: body ?? t.tiles[key][1], link, cta: t.tiles[key][2] })
  const tiles = [
    tile('orders', Package, href.shop()),
    tile('wishlist', Heart, href.wishlist, t.saved(wishlist.length)),
    tile('sizes', Ruler, () => openVisit({ purpose: 'other' })),
    tile('care', Sparkles, () => openVisit({ purpose: 'care' })),
  ]
  const ahead = upcoming(visits)
  const past = visits.filter((x) => !ahead.includes(x)).sort((a, b) => instantOf(b.date, b.time).getTime() - instantOf(a.date, a.time).getTime()).slice(0, 4)
  const tileClass = 'group flex flex-col bg-[var(--bg-travertine)] p-8 text-left transition-colors hover:bg-[var(--bg-silk)]'

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-col justify-between gap-6 border-b border-[var(--border-hairline)] pb-10 sm:flex-row sm:items-end">
        <div>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
          <h1 className="font-serif-editorial mt-4 text-6xl font-light lg:text-7xl">{rich(t.hello(user.name), 'text-[var(--gold-vermeil)]')}</h1>
          <p className="mt-3 text-sm text-[var(--text-taupe)]">{user.email}</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.22em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)] sm:self-auto">
          <LogOut size={14} strokeWidth={1.4} /> {t.signOut}
        </button>
      </div>

      <div className="mt-12 grid gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, title, body, link, cta }) => {
          const inner = (
            <>
              <Icon size={20} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" />
              <h2 className="font-serif-editorial mt-8 text-3xl">{title}</h2>
              <p className="mt-3 flex-1 text-sm text-[var(--text-taupe)]">{body}</p>
              <span className="mt-8 text-[11px] uppercase tracking-[0.22em] group-hover:text-[var(--gold-vermeil)]">{cta} &rarr;</span>
            </>
          )
          return typeof link === 'string' ? <a key={title} href={link} className={tileClass}>{inner}</a> : <button key={title} type="button" onClick={link} className={tileClass}>{inner}</button>
        })}
      </div>

      {/* Visits: the next ones to change or cancel, the last few kept */}
      <div className="mt-12 border border-[var(--border-hairline)] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em]"><CalendarHeart size={16} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {t.visits}</p>
          <VisitButton />
        </div>
        {ahead.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--text-taupe)]">{t.noVisits}</p>
        ) : (
          <ul className="mt-6 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
            {ahead.map((x) => {
              const pieces = x.pieces.map((p) => getProduct(p.slug)).filter((p): p is Product => !!p)
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
                  <span className="min-w-0 flex-1">
                    <span className="font-serif-editorial block text-2xl"><span className="inline-block first-letter:uppercase">{formatDay(parseIso(x.date), { weekday: 'long', day: 'numeric', month: 'long' })}</span> · <span className="font-spec text-lg">{formatTime(x.time)}</span></span>
                    <span className="mt-1 block text-sm text-[var(--text-taupe)]">{v.purposes[x.purpose]} · {v.modes[x.mode]}{pieces.length > 0 && <> · {t.prepared(pieces.length)}: {pieces.map(catalog.name).join(', ')}</>}</span>
                  </span>
                  <button type="button" onClick={() => openVisit({ change: x.id })} className="link-line">{t.change}</button>
                  <button type="button" onClick={() => cancelVisit(x.id)} className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)] underline-offset-4 hover:text-[var(--text-espresso)] hover:underline">{t.cancel}</button>
                </li>
              )
            })}
          </ul>
        )}
        {past.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.past}</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-taupe)]">
              {past.map((x) => <li key={x.id}>{formatDay(parseIso(x.date), { day: 'numeric', month: 'long', year: 'numeric' })} · {v.purposes[x.purpose]}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Rings designed here and kept: reopen one in the designer, or forget it */}
      {designs.length > 0 && (
        <div className="mt-12 border border-[var(--border-hairline)] p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em]"><Gem size={16} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> {t.designs}</p>
            <a href={href.designer()} className="link-line">{t.designAnother}</a>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {designs.map((s) => {
              const d = decodeDesign(s.code)
              if (!d) return null
              const { title } = describeDesign(d)
              return (
                <li key={s.code} className="flex flex-col border border-[var(--border-hairline)]">
                  <a href={href.designer({ r: s.code })} className="group block aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
                    {s.image && <img src={s.image} alt="" className="editorial-zoom h-full w-full object-cover" />}
                  </a>
                  <div className="flex items-start justify-between gap-3 p-4">
                    <span className="min-w-0">
                      <a href={href.designer({ r: s.code })} className="font-serif-editorial block text-lg leading-tight transition-colors hover:text-[var(--gold-vermeil)]">{title}</a>
                      <Price amount={ringPrice(d, currency)} className="mt-1 block text-xs" />
                    </span>
                    <button type="button" onClick={() => forgetDesign(s.code)} aria-label={t.forgetDesign(title)} className="-mr-1 shrink-0 p-1 text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]"><X size={14} strokeWidth={1.4} /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* What the house remembers: a ring size, the dates that matter, the yearly care */}
      <div className="mt-12 grid gap-px border border-[var(--border-hairline)] bg-[var(--border-hairline)] lg:grid-cols-3">
        <div className="bg-[var(--bg-travertine)] p-8">
          <p className={label}>{t.ringSize}</p>
          <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.ringSizeText}</p>
          <label className="mt-6 block">
            <span className="sr-only">{t.ringSize}</span>
            <select value={profile.ringSize ?? ''} onChange={(e) => setProfile({ ringSize: e.target.value || undefined })} className="font-spec w-full cursor-pointer border-b border-[var(--border-hairline)] bg-transparent py-2.5 text-lg outline-none focus:border-[var(--gold-vermeil)]">
              <option value="">{t.choose}</option>
              {RING_SIZES.map(([size]) => <option key={size} value={size}>{sizeLabel(size)}</option>)}
            </select>
          </label>
        </div>
        <div className="bg-[var(--bg-travertine)] p-8">
          <p className={label}>{t.dates}</p>
          <p className="mt-2 text-sm text-[var(--text-taupe)]">{t.datesText}</p>
          {profile.dates.length > 0 && (
            <ul className="mt-5 space-y-2">
              {profile.dates.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-2 text-sm">
                  <span>{d.label} · <span className="font-spec">{formatDay(new Date(2000, Number(d.date.slice(0, 2)) - 1, Number(d.date.slice(3))), { day: 'numeric', month: 'long' })}</span></span>
                  <button type="button" onClick={() => setProfile({ dates: profile.dates.filter((x) => x.id !== d.id) })} aria-label={t.remove(d.label)} className="p-1 text-[var(--text-taupe)] hover:text-[var(--text-espresso)]"><X size={14} strokeWidth={1.4} /></button>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!dateLabel.trim() || !dateWhen) return
              setProfile({ dates: [...profile.dates, { id: `d${Date.now().toString(36)}`, label: dateLabel.trim(), date: dateWhen.slice(5) }] })
              setDateLabel('')
              setDateWhen('')
            }}
            className="mt-5 grid grid-cols-[1fr_auto] items-end gap-3"
          >
            <label className="col-span-2 block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.dateLabel}</span>
              <input value={dateLabel} onChange={(e) => setDateLabel(e.target.value.slice(0, 40))} placeholder={t.datePlaceholder} className={`${field} placeholder:text-[var(--text-taupe)]`} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{t.dateWhen}</span>
              <input type="date" value={dateWhen} onChange={(e) => setDateWhen(e.target.value)} className={`font-spec ${field}`} />
            </label>
            <button type="submit" className="border border-[var(--text-espresso)] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]">{t.add}</button>
          </form>
        </div>
        <div className="flex flex-col bg-[var(--bg-travertine)] p-8">
          <p className={label}>{t.care}</p>
          <p className="mt-2 flex-1 text-sm text-[var(--text-taupe)]">{t.careText}</p>
          <VisitButton request={{ purpose: 'care' }} className="mt-6 self-start">{t.careCta}</VisitButton>
        </div>
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
