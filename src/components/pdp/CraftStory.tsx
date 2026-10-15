import type { Product } from '../../data/catalog'

const COPY: Record<string, { title: [string, string, string]; body: string; stats: [string, string][] }> = {
  default: {
    title: ['Made slowly,', 'by', 'hand.'],
    body: 'Each piece passes through four pairs of hands at our bench on rue Sherbrooke — from the first sketch to the final polish — and leaves only when it is worthy of the family name.',
    stats: [['40+', 'Hours at the bench'], ['12', 'Polishing stages'], ['100%', 'Recycled gold'], ['1962', 'Family atelier']],
  },
  bridal: {
    title: ['A ring for', 'every', 'tomorrow.'],
    body: 'Our bridal settings are engineered to hold a stone for generations: hand-raised claws, a reinforced gallery, and a comfort-fit shank you will forget you are wearing.',
    stats: [['GIA', 'Certified centre'], ['6', 'Hand-raised claws'], ['950', 'Platinum purity'], ['∞', 'Lifetime care']],
  },
  watches: {
    title: ['Time,', 'regulated', 'in Montréal.'],
    body: 'Every movement is opened, regulated in five positions and pressure-tested by our in-house horologist before it is released to you.',
    stats: [['5', 'Positions regulated'], ['42h', 'Power reserve'], ['5 yr', 'Service plan'], ['50m', 'Water resistance']],
  },
  rentals: {
    title: ['Borrowed,', 'never', 'compromised.'],
    body: 'Each rental piece is inspected, ultrasonically cleaned and re-certified between every wear, then delivered by bonded courier with full insurance.',
    stats: [['100%', 'Insured'], ['24h', 'Courier delivery'], ['3', 'Rental periods'], ['0', 'Hidden fees']],
  },
}

export default function CraftStory({ product, index }: { product: Product; index: string }) {
  const c = COPY[product.category] ?? COPY.default
  return (
    <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[460px] overflow-hidden lg:min-h-[760px]">
          <img data-parallax src={product.images[1] ?? product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-85" />
        </div>
        <div className="flex flex-col justify-center px-6 py-24 lg:px-20">
          <p data-reveal className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
            <span className="mr-4 text-white/45">{index}</span>The {product.collection} story
          </p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5rem]">
            {c.title[0]} <em className="text-[var(--gold-champagne)]">{c.title[1]}</em> {c.title[2]}
          </h2>
          <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-white/65">{c.body}</p>
          <dl data-reveal="0.15" className="mt-14 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {c.stats.map(([v, k]) => (
              <div key={k} className="bg-[var(--bg-vault)] py-6 pr-4">
                <dd className="font-serif-editorial text-4xl text-[var(--gold-champagne)]">{v}</dd>
                <dt className="font-mono-spec mt-2 text-[9px] uppercase tracking-[0.2em] text-white/50">{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
