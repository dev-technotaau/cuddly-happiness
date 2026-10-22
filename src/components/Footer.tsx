import { useState } from 'react'
import { CATEGORIES, SIGNATURES } from '../data/catalog'
import { HOUSE } from '../data/house'
import { SALON, salonDial, salonHours, salonStatus } from '../data/salon'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href, useStore } from '../store'
import Hallmark from './brand/Hallmark'
import LanguageToggle from './locale/LanguageToggle'

const COPY = bilingual(
  {
    letter: 'La lettre',
    title: 'Notes from the <em>atelier</em>, four times a year.',
    email: 'Email address',
    subscribe: 'Subscribe',
    thanks: 'Merci. The next letter leaves the atelier with the season.',
    invalid: 'Please enter an email address.',
    shop: 'Shop',
    every: 'Every piece',
    maison: 'Maison',
    salon: 'Salon',
    story: 'Our Story',
    designer: 'Design your ring',
    appointment: 'Book a visit',
    ask: 'Ask a jeweller',
    giftCards: 'Gift Cards & Balance',
    gia: 'GIA & Certification',
    care: 'Care & Repairs',
    shipping: 'Shipping & Returns',
    country: 'Canada',
    markets: 'Shipping to Canada (CAD) & United States (USD)',
    signoff: 'Three generations · one atelier · Montréal since 1962',
  },
  {
    letter: 'La lettre',
    title: 'Des nouvelles de l’<em>atelier</em>, quatre fois l’an.',
    email: 'Adresse courriel',
    subscribe: 'S’abonner',
    thanks: 'Merci. La prochaine lettre quittera l’atelier avec la saison.',
    invalid: 'Veuillez saisir une adresse courriel.',
    shop: 'Boutique',
    every: 'Toutes les pièces',
    maison: 'Maison',
    salon: 'Salon',
    story: 'Notre histoire',
    designer: 'Créer votre bague',
    appointment: 'Prendre rendez-vous',
    ask: 'Parler à un joaillier',
    giftCards: 'Cartes-cadeaux et solde',
    gia: 'GIA et certification',
    care: 'Entretien et réparations',
    shipping: 'Livraison et retours',
    country: 'Canada',
    markets: 'Livraison au Canada ($ CA) et aux États-Unis ($ US)',
    signoff: 'Trois générations · un atelier · Montréal depuis 1962',
  },
)

export default function Footer() {
  const { openVisit, openAsk } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  // La Lettre: the sign-up is simulated (a thank-you, nothing sent); the theme posts it to Shopify's customer form.
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const status = salonStatus()
  const link = 'text-white/80 transition-colors hover:text-[var(--gold-champagne)]'

  return (
    <footer className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 pb-10 pt-24 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.letter}</p>
            <h3 className="font-serif-editorial mt-5 text-5xl leading-[1.05]">{rich(t.title, 'text-[var(--gold-champagne)]')}</h3>
            {sent ? (
              <p role="status" className="font-serif-editorial mt-10 border-b border-white/20 pb-4 text-2xl italic text-white/80">{t.thanks}</p>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!/\S+@\S+\.\S+/.test(email)) return setInvalid(true)
                  setSent(true)
                }}
                className="mt-10"
              >
                <div className="flex border-b border-white/20 focus-within:border-[var(--gold-champagne)]">
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setInvalid(false) }} placeholder={t.email} aria-label={t.email} aria-invalid={invalid} className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-[var(--text-linen)]" />
                  <button className="text-[11px] uppercase tracking-[0.24em] text-[var(--gold-champagne)]">{t.subscribe}</button>
                </div>
                {invalid && <p role="alert" className="mt-3 text-xs text-[var(--gold-champagne)]">{t.invalid}</p>}
              </form>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" onClick={() => openVisit()} className="bg-[var(--gold-champagne)] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--bg-vault)] transition-colors hover:bg-[var(--bg-travertine)]">{t.appointment}</button>
              <button type="button" onClick={() => openAsk()} className="border border-white/30 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] transition-colors hover:border-[var(--gold-champagne)] hover:text-[var(--gold-champagne)]">{t.ask}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.shop}</p>
              <ul className="space-y-2.5">
                {SIGNATURES.map((s) => (
                  <li key={s.id}><a href={href.category(s.category, { type: s.family })} className={`font-serif-editorial text-base italic ${link}`}>{house.signatures[s.id].name}</a></li>
                ))}
                <li><a href={href.shop()} className={link}>{t.every}</a></li>
                {CATEGORIES.map((c) => (
                  <li key={c.slug}><a href={href.category(c.slug)} className={link}>{catalog.category(c).name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.maison}</p>
              <ul className="space-y-2.5 text-white/80">
                <li><a href={href.atelier} className={link}>{t.story}</a></li>
                <li><a href={href.designer()} className={link}>{t.designer}</a></li>
                <li><button type="button" onClick={() => openVisit()} className={link}>{t.appointment}</button></li>
                <li><button type="button" onClick={() => openAsk()} className={link}>{t.ask}</button></li>
                <li><a href={href.giftcards} className={link}>{t.giftCards}</a></li>
                <li>{t.gia}</li>
                <li>{t.care}</li>
                <li>{t.shipping}</li>
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.salon}</p>
              <address className="not-italic leading-relaxed text-white/80">
                <a href={SALON.maps} target="_blank" rel="noreferrer" className={link}>{SALON.street}<br />{SALON.city}</a><br />{t.country}
              </address>
              <a href={`tel:${salonDial()}`} className="font-spec mt-4 block text-xs text-white/60 hover:text-[var(--gold-champagne)]">{SALON.phone}</a>
              <p className="mt-4 text-xs text-white/60">{salonHours()}</p>
              <p className="font-spec mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--gold-champagne)]"><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-[var(--gold-champagne)]' : 'bg-white/30'}`} />{status.label}</p>
            </div>
          </div>
        </div>
        {/* The wordmark spans the column: sized to the container (the words are 6.2 em wide), never past its edge */}
        <div className="@container mt-24">
          <p className="font-serif-editorial pointer-events-none select-none whitespace-nowrap text-center text-[16cqi] font-light leading-none text-white/[0.06]">
            Teresa &amp; Sons
          </p>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-white/45">
          <Hallmark className="h-9 w-9 text-[var(--gold-champagne)]/70" />
          <p className="font-spec text-[10px] uppercase tracking-[0.3em]">{t.signoff}</p>
        </div>
        <div data-fab-avoid className="font-spec mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-white/50 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Teresa &amp; Sons Joailliers Inc.</span>
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            {t.markets}
            <LanguageToggle tone="dark" full className="self-start sm:self-auto" />
          </span>
        </div>
      </div>
    </footer>
  )
}
