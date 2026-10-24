import { useCallback, useMemo } from 'react'
import { formatPrice, type CategorySlug, type Currency, type Metal, type ProductType } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { badgeOf, shapeName, type EditId, type FacetId, type How, type Own, type Service, type Sort, type Stone, type Tag, type View } from './filters'

// The shop's vocabulary, shared by the toolbar, the filter panel, the chips and the empty state.
const COPY = bilingual(
  {
    facets: { chapter: 'Chapter', type: 'Type', metal: 'Metal', stone: 'Stone', shape: 'Diamond shape', how: 'Availability', tag: 'Highlights', svc: 'Services', own: 'Your pieces' } as Record<FacetId, string>,
    price: 'Price',
    stones: { diamond: 'Diamonds', pearl: 'Pearls', emerald: 'Emeralds', sapphire: 'Sapphires', none: 'Without stones' } as Record<Stone, string>,
    how: { rent: 'Available to rent', ready: 'Ready to try in the salon', made: 'Made to order' } as Record<How, string>,
    svc: { engrave: 'Can be engraved', personalize: 'With your name or initials', tryon: 'Virtual try-on' } as Record<Service, string>,
    own: { saved: 'In your wishlist', viewed: 'Recently viewed' } as Record<Own, string>,
    sorts: { recommended: 'Recommended', new: 'New arrivals', low: 'Price, low to high', high: 'Price, high to low', name: 'Name, A–Z' } as Record<Sort, string>,
    bestMatch: 'Best match',
    views: { large: 'Large', grid: 'Standard', compact: 'Compact' } as Record<View, string>,
    edits: { signatures: 'The signatures', new: 'New', bestsellers: 'Bestsellers', rent: 'To rent', engrave: 'To engrave', made: 'Made to order' } as Record<Exclude<EditId, 'gifts'>, string>,
    gifts: (amount: string) => `Gifts under ${amount}`,
    under: (max: string) => `Under ${max}`,
    over: (min: string) => `${min} and over`,
    between: (min: string, max: string) => `${min} – ${max}`,
    searched: (q: string) => `“${q}”`,
    count: (n: number) => `${n} piece${n === 1 ? '' : 's'}`,
  },
  {
    facets: { chapter: 'Chapitre', type: 'Type', metal: 'Métal', stone: 'Pierre', shape: 'Forme du diamant', how: 'Disponibilité', tag: 'En vedette', svc: 'Services', own: 'Vos pièces' },
    price: 'Prix',
    stones: { diamond: 'Diamants', pearl: 'Perles', emerald: 'Émeraudes', sapphire: 'Saphirs', none: 'Sans pierres' },
    how: { rent: 'Offerte en location', ready: 'À essayer au salon', made: 'Sur commande' },
    svc: { engrave: 'Peut être gravée', personalize: 'À votre nom ou à vos initiales', tryon: 'Essayage virtuel' },
    own: { saved: 'Dans votre liste de souhaits', viewed: 'Vus récemment' },
    sorts: { recommended: 'Recommandé', new: 'Nouveautés', low: 'Prix croissant', high: 'Prix décroissant', name: 'Nom, de A à Z' },
    bestMatch: 'Pertinence',
    views: { large: 'Grand', grid: 'Standard', compact: 'Compact' },
    edits: { signatures: 'Les signatures', new: 'Nouveautés', bestsellers: 'Incontournables', rent: 'À louer', engrave: 'À graver', made: 'Sur commande' },
    gifts: (amount) => `Cadeaux de moins de ${amount}`,
    under: (max) => `Moins de ${max}`,
    over: (min) => `${min} et plus`,
    between: (min, max) => `${min} – ${max}`,
    searched: (q) => `« ${q} »`,
    count: (n) => `${n} pièce${n < 2 ? '' : 's'}`,
  },
)

/** The shop's words: facet titles, every value's label (the catalog's own names for chapters, types, metals, badges
 *  and shapes), sorts, views, edits and price ranges, in the language on screen. */
export default function useShopCopy() {
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()

  const option = useCallback((id: FacetId, value: string): string => {
    switch (id) {
      case 'chapter': return catalog.category(value as CategorySlug).name
      case 'type': return value === 'tennis' ? house.signatures.tennis.name : catalog.type(value as ProductType)
      case 'metal': return catalog.metal(value as Metal)
      case 'stone': return t.stones[value as Stone]
      case 'shape': return catalog.gia(shapeName(value))
      case 'how': return t.how[value as How]
      case 'tag': return catalog.badge(badgeOf(value as Tag))
      case 'svc': return t.svc[value as Service]
      case 'own': return t.own[value as Own]
    }
  }, [catalog, house, t])

  /** A price range as words: "Under $1,000", "$1,000 – $5,000", "$20,000 and over". */
  const range = useCallback((currency: Currency, min?: number, max?: number) => {
    const f = (n: number) => formatPrice(n, currency)
    return min === undefined ? t.under(f(max ?? 0)) : max === undefined ? t.over(f(min)) : t.between(f(min), f(max))
  }, [t])

  const edit = useCallback((id: EditId, currency: Currency, max?: number) => (id === 'gifts' ? t.gifts(formatPrice(max ?? 0, currency)) : t.edits[id]), [t])

  return useMemo(() => ({ t, option, range, edit }), [t, option, range, edit])
}
