import { CATEGORIES } from '../data/catalog'
import { href } from '../store'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto max-w-[1600px] px-6 pb-10 pt-24 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">La lettre</p>
            <h3 className="font-serif-editorial mt-5 text-5xl leading-[1.05]">
              Notes from the <em className="text-[var(--gold-champagne)]">atelier</em>, four times a year.
            </h3>
            <form onSubmit={(e) => e.preventDefault()} className="mt-10 flex border-b border-white/20">
              <input type="email" required placeholder="Email address" className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-[var(--text-linen)]" />
              <button className="text-[11px] uppercase tracking-[0.24em] text-[var(--gold-champagne)]">Subscribe</button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">Shop</p>
              <ul className="space-y-2.5">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}><a href={href.category(c.slug)} className="text-white/80 hover:text-[var(--gold-champagne)]">{c.name}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">Maison</p>
              <ul className="space-y-2.5 text-white/80">
                <li><a href={href.atelier} className="hover:text-[var(--gold-champagne)]">Our Story</a></li>
                <li><a href={href.atelier} className="hover:text-[var(--gold-champagne)]">Book an Appointment</a></li>
                <li><a href={href.giftcards} className="hover:text-[var(--gold-champagne)]">Gift Cards &amp; Balance</a></li>
                <li>GIA & Certification</li>
                <li>Care & Repairs</li>
                <li>Shipping & Returns</li>
              </ul>
            </div>
            <div>
              <p className="font-spec mb-5 text-[10px] uppercase tracking-[0.28em] text-[var(--text-linen)]">Salon</p>
              <address className="not-italic leading-relaxed text-white/80">
                1420 rue Sherbrooke Ouest<br />Montréal, QC H3G 1K4<br />Canada
              </address>
              <p className="font-spec mt-4 text-xs text-white/60">+1 514 555 0162</p>
              <p className="mt-4 text-xs text-white/60">Tue–Sat · 10h–18h</p>
            </div>
          </div>
        </div>
        <p className="font-serif-editorial pointer-events-none mt-24 select-none whitespace-nowrap text-center text-[17vw] font-light leading-none text-white/[0.06]">
          Teresa &amp; Sons
        </p>
        <div data-fab-avoid className="font-spec mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Teresa &amp; Sons Joailliers Inc.</span>
          <span>Shipping to Canada (CAD) &amp; United States (USD)</span>
        </div>
      </div>
    </footer>
  )
}
