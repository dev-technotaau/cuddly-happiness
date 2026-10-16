import { getProductsByCategory, priceFor, IMG } from '../../data/catalog'
import { href, useStore } from '../../store'
import Price from '../Price'

export default function WatchSpotlight() {
  const { currency } = useStore()
  const watches = getProductsByCategory('watches')
  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="group relative aspect-[4/5] overflow-hidden lg:col-span-5">
          <img data-parallax src={IMG.watch2} alt="Chronographe 1962" loading="lazy" className="h-full w-full object-cover" />
          <span className="font-spec absolute bottom-5 left-5 bg-[var(--bg-travertine)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em]">Limited · 62 pieces</span>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]"><span className="mr-4 text-[var(--text-linen)]">07</span>Chapter VI · Horlogerie</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">
            Time, <em className="text-[var(--gold-vermeil)]">kept</em> beautifully.
          </h2>
          <p data-reveal="0.1" className="mt-6 max-w-md text-[var(--text-taupe)]">
            Swiss timepieces regulated by our in-house horologist, with complimentary case-back engraving and a five-year service plan.
          </p>
          <ul className="mt-12 border-t border-[var(--border-hairline)]">
            {watches.map((w, i) => (
              <li key={w.id} data-reveal={0.1 + i * 0.05}>
                <a href={href.product(w.slug)} className="group flex items-center gap-6 border-b border-[var(--border-hairline)] py-6">
                  <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
                  <div className="h-16 w-14 shrink-0 overflow-hidden">
                    <img src={w.images[0]} alt="" loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-serif-editorial text-2xl transition-colors group-hover:text-[var(--gold-vermeil)] lg:text-3xl">{w.name}</p>
                    <p className="font-spec mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-taupe)]">{w.specs.Case} · {w.specs.Movement}</p>
                  </div>
                  <Price amount={priceFor(w, currency)} className="hidden text-sm sm:inline" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
