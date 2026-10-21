import { CATEGORIES } from '../data/catalog'
import { SALON, salonHours } from '../data/salon'
import { bilingual, useCopy } from '../i18n'
import { useCatalog } from '../i18n/catalog'
import { rich } from '../i18n/rich'
import { href } from '../store'
import LanguageToggle from './locale/LanguageToggle'

const COPY = bilingual(
  {
    letter: 'La lettre',
    title: 'Notes from the <em>atelier</em>, four times a year.',
    email: 'Email address',
    subscribe: 'Subscribe',
    shop: 'Shop',
    maison: 'Maison',
    salon: 'Salon',
    story: 'Our Story',
    appointment: 'Book an Appointment',
    giftCards: 'Gift Cards & Balance',
    gia: 'GIA & Certification',
    care: 'Care & Repairs',
    shipping: 'Shipping & Returns',
    country: 'Canada',
    markets: 'Shipping to Canada (CAD) & United States (USD)',
  },
  {
    letter: 'La lettre',
    title: 'Des nouvelles de l’<em>atelier</em>, quatre fois l’an.',
    email: 'Adresse courriel',
    subscribe: 'S’abonner',
    shop: 'Boutique',
    maison: 'Maison',
    salon: 'Salon',
    story: 'Notre histoire',
    appointment: 'Prendre rendez-vous',
    giftCards: 'Cartes-cadeaux et solde',
    gia: 'GIA et certification',
    care: 'Entretien et réparations',
    shipping: 'Livraison et retours',
    country: 'Canada',
    markets: 'Livraison au Canada ($ CA) et aux États-Unis ($ US)',
  },
)

export default function Footer() {
  const t = useCopy(COPY)
  const catalog = useCatalog()
  return (
    <footer className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 pb-10 pt-24 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.letter}</p>
            <h3 className="font-serif-editorial mt-5 text-5xl leading-[1.05]">{rich(t.title, 'text-[var(--gold-champagne)]')}</h3>
            <form onSubmit={(e) => e.preventDefault()} className="mt-10 flex border-b border-white/20">
              <input type="email" required placeholder={t.email} aria-label={t.email} className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-[var(--text-linen)]" />
              <button className="text-[11px] uppercase tracking-[0.24em] text-[var(--gold-champagne)]">{t.subscribe}</button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.shop}</p>
              <ul className="space-y-2.5">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}><a href={href.category(c.slug)} className="text-white/80 hover:text-[var(--gold-champagne)]">{catalog.category(c).name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.maison}</p>
              <ul className="space-y-2.5 text-white/80">
                <li><a href={href.atelier} className="hover:text-[var(--gold-champagne)]">{t.story}</a></li>
                <li><a href={href.atelier} className="hover:text-[var(--gold-champagne)]">{t.appointment}</a></li>
                <li><a href={href.giftcards} className="hover:text-[var(--gold-champagne)]">{t.giftCards}</a></li>
                <li>{t.gia}</li>
                <li>{t.care}</li>
                <li>{t.shipping}</li>
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">{t.salon}</p>
              <address className="not-italic leading-relaxed text-white/80">
                {SALON.street}<br />{SALON.city}<br />{t.country}
              </address>
              <p className="font-spec mt-4 text-xs text-white/60">{SALON.phone}</p>
              <p className="mt-4 text-xs text-white/60">{salonHours()}</p>
            </div>
          </div>
        </div>
        <p className="font-serif-editorial pointer-events-none mt-24 select-none whitespace-nowrap text-center text-[17vw] font-light leading-none text-white/[0.06]">
          Teresa &amp; Sons
        </p>
        <div data-fab-avoid className="font-spec mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-white/50 sm:flex-row sm:items-center">
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
