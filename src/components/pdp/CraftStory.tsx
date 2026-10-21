import type { Product } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'

type Story = { title: [string, string, string]; body: string; stats: [string, string][] }

const COPY = bilingual(
  {
    story: (collection: string) => `The ${collection} story`,
    stories: {
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
    } as Record<string, Story>,
  },
  {
    story: (collection) => `L’histoire · ${collection}`,
    stories: {
      default: {
        title: ['Façonné', 'lentement,', 'à la main.'],
        body: 'Chaque pièce passe entre quatre paires de mains à notre établi de la rue Sherbrooke — du premier croquis au dernier polissage — et ne part que lorsqu’elle est digne du nom de la famille.',
        stats: [['40+', 'Heures à l’établi'], ['12', 'Étapes de polissage'], ['100 %', 'Or recyclé'], ['1962', 'Atelier familial']],
      },
      bridal: {
        title: ['Une bague pour', 'chaque', 'lendemain.'],
        body: 'Nos montures de mariage sont conçues pour tenir une pierre pendant des générations : griffes relevées à la main, galerie renforcée et anneau au profil confort que vous oublierez porter.',
        stats: [['GIA', 'Pierre certifiée'], ['6', 'Griffes relevées à la main'], ['950', 'Titre du platine'], ['∞', 'Entretien à vie']],
      },
      watches: {
        title: ['Le temps,', 'réglé', 'à Montréal.'],
        body: 'Chaque mouvement est ouvert, réglé dans cinq positions et soumis à un test de pression par notre horloger maison avant de vous être remis.',
        stats: [['5', 'Positions réglées'], ['42 h', 'Réserve de marche'], ['5 ans', 'Plan d’entretien'], ['50 m', 'Étanchéité']],
      },
      rentals: {
        title: ['Empruntée,', 'jamais', 'compromise.'],
        body: 'Chaque pièce en location est inspectée, nettoyée aux ultrasons et recertifiée entre deux sorties, puis livrée par messager cautionné, entièrement assurée.',
        stats: [['100 %', 'Assurée'], ['24 h', 'Livraison par messager'], ['3', 'Périodes de location'], ['0', 'Frais cachés']],
      },
    },
  },
)

export default function CraftStory({ product, index }: { product: Product; index: string }) {
  const t = useCopy(COPY)
  const catalog = useCatalog()
  const c = t.stories[product.category] ?? t.stories.default
  return (
    <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[460px] overflow-hidden lg:min-h-[760px]">
          <img data-parallax src={product.images[1] ?? product.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-85" />
        </div>
        <div className="flex flex-col justify-center px-6 py-24 lg:px-20">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
            <span className="mr-4 text-white/45">{index}</span>{t.story(catalog.product(product).collection)}
          </p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5rem]">
            {c.title[0]} <em className="text-[var(--gold-champagne)]">{c.title[1]}</em> {c.title[2]}
          </h2>
          <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-white/65">{c.body}</p>
          <dl data-reveal="0.15" className="mt-14 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {c.stats.map(([v, k]) => (
              <div key={k} className="bg-[var(--bg-vault)] py-6 pr-4">
                <dd className="font-serif-editorial text-4xl text-[var(--gold-champagne)]">{v}</dd>
                <dt className="font-spec mt-2 text-[9px] uppercase tracking-[0.2em] text-white/50">{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
