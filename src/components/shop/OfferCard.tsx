import { ArrowRight } from 'lucide-react'
import { IMG, pic } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import GiftCardArt from '../giftcard/GiftCardArt'
import type { OfferId } from './filters'

const COPY = bilingual(
  {
    designer: { eyebrow: 'Sur mesure · in 3D', title: 'Design your <em>own</em> ring.', text: 'Choose the stone, the setting and the metal, and watch it built in 3D, priced as you go.', cta: 'Design your ring' },
    rent: { eyebrow: 'Rent or own', title: 'Wear it for an <em>evening</em>.', cta: 'See the pieces to rent' },
    engrave: { eyebrow: 'Engraving', title: 'Words, <em>in gold</em>.', text: 'Engraving is complimentary on every piece that takes it: by hand or by laser, up to 18 characters.', cta: 'See the pieces to engrave' },
    gift: { eyebrow: 'Carte-cadeau', title: 'Give the <em>choice</em>.', text: 'Digital or mailed · scheduled delivery · never expires', cta: 'Send a gift card' },
  },
  {
    designer: { eyebrow: 'Sur mesure · en 3D', title: 'Créez votre <em>propre</em> bague.', text: 'Choisissez la pierre, la monture et le métal : elle se construit en 3D sous vos yeux, son prix avec elle.', cta: 'Créer votre bague' },
    rent: { eyebrow: 'Louer ou acheter', title: 'Portez-la le temps d’un <em>soir</em>.', cta: 'Voir les pièces à louer' },
    engrave: { eyebrow: 'Gravure', title: 'Des mots, <em>dans l’or</em>.', text: 'La gravure est offerte sur chaque pièce qui s’y prête : à la main ou au laser, jusqu’à 18 caractères.', cta: 'Voir les pièces à graver' },
    gift: { eyebrow: 'Carte-cadeau', title: 'Offrez le <em>choix</em>.', text: 'Numérique ou postale · envoi programmé · sans expiration', cta: 'Offrir une carte-cadeau' },
  },
)

interface Props {
  id: OfferId
  /** A dense grid: smaller type, the text left out. */
  compact?: boolean
  /** Narrows the shop to what the card speaks of (renting, engraving) in place. */
  onFilter: (id: 'rent' | 'engrave') => void
}

/** One of the house's cards set among the pieces, the size of a piece's card: the ring designer, renting (its fee
 *  counts toward owning), complimentary engraving or a gift card. Each says only what the house does; the designer
 *  and the gift card are links, renting and engraving narrow the pieces on screen. */
export default function OfferCard({ id, compact = false, onFilter }: Props) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const title = `font-serif-editorial font-light leading-[1.02] tracking-[-0.01em] ${compact ? 'mt-3 text-2xl sm:text-3xl' : 'mt-4 text-4xl lg:text-[2.6rem]'}`
  const text = `mt-4 max-w-xs text-sm leading-relaxed ${compact ? 'max-sm:hidden' : ''}`
  const cta = `mt-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] ${compact ? 'max-sm:mt-4 max-sm:text-[10px]' : ''}`

  if (id === 'designer') {
    return (
      <a href={href.designer()} className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-[var(--bg-vault)] p-6 text-[var(--bg-travertine)] sm:p-8">
        <img {...pic(IMG.claws, '(min-width: 1024px) 31vw, 100vw')} alt="" loading="lazy" className="editorial-zoom absolute inset-0 h-full w-full object-cover opacity-45" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--bg-vault)] via-[var(--bg-vault)]/50 to-transparent" />
        <span className="relative">
          <span className="font-spec block text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.designer.eyebrow}</span>
          <span className={`block ${title}`}>{rich(t.designer.title, 'text-[var(--gold-champagne)]')}</span>
          <span className={`block text-white/70 ${text}`}>{t.designer.text}</span>
          <span className={`${cta} text-[var(--gold-champagne)]`}>{t.designer.cta} <ArrowRight size={14} strokeWidth={1.4} className="transition-transform duration-500 group-hover:translate-x-1" /></span>
        </span>
      </a>
    )
  }

  if (id === 'gift') {
    return (
      <a href={href.giftcards} className="group flex aspect-[4/5] flex-col justify-between overflow-hidden bg-[var(--bg-silk)] p-6 sm:p-8">
        <span className="flex flex-1 items-center justify-center px-4 py-6">
          <span className="block w-[78%] max-w-[260px] -rotate-6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-2 group-hover:scale-[1.03]"><GiftCardArt design="travertine" currency={currency} amount={500} /></span>
        </span>
        <span>
          <span className="font-spec block text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.gift.eyebrow}</span>
          <span className={`block ${title}`}>{rich(t.gift.title, 'text-[var(--gold-vermeil)]')}</span>
          <span className={`block text-[var(--text-taupe)] ${text}`}>{t.gift.text}</span>
          <span className={cta}>{t.gift.cta} <ArrowRight size={14} strokeWidth={1.4} className="transition-transform duration-500 group-hover:translate-x-1" /></span>
        </span>
      </a>
    )
  }

  const rent = id === 'rent'
  const c = rent ? t.rent : t.engrave
  return (
    <div className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-[var(--bg-silk)]">
      <div className="absolute inset-x-0 top-0 h-[46%] overflow-hidden">
        <img {...pic(rent ? IMG.collarWorn : IMG.handsBench, '(min-width: 1024px) 31vw, 100vw')} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-silk)]" />
      </div>
      <div className="relative p-6 sm:p-8">
        <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{c.eyebrow}</p>
        <p className={title}>{rich(c.title, 'text-[var(--gold-vermeil)]')}</p>
        <p className={`text-[var(--text-taupe)] ${text}`}>{rent ? house.rentalCredit : t.engrave.text}</p>
        <button type="button" onClick={() => onFilter(id)} className={`link-line ${cta}`}>{c.cta}</button>
      </div>
    </div>
  )
}
