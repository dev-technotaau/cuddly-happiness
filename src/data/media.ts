// Video and review media. Clips are royalty-free stock from Mixkit, used as placeholders for brand films.

import { IMG, getProduct, type CategorySlug, type Product } from './catalog'

const clip = (id: number, q: 360 | 720 = 720) => `https://assets.mixkit.co/videos/${id}/${id}-${q}.mp4`
const poster = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`

export interface ShoppableVideo {
  id: string
  src: string
  /** Lighter rendition for small autoplaying tiles. */
  preview: string
  poster: string
  title: string
  caption: string
  handle: string
  products: string[]
}

const v = (n: number, title: string, caption: string, handle: string, products: string[]): ShoppableVideo => ({
  id: `v${n}`,
  src: clip(n, 720),
  preview: clip(n, 360),
  poster: poster(n),
  title,
  caption,
  handle,
  products,
})

export const VIDEOS: ShoppableVideo[] = [
  v(5220, 'The oval, up close', 'How a 1.82 ct oval catches morning light.', '@teresaandsons', ['notre-dame-oval-solitaire', 'promesse-wedding-band']),
  v(47476, 'Getting ready', 'A bride fastens her Westmount line before the ceremony.', '@claire.weds', ['westmount-tennis-bracelet', 'vieux-port-diamond-studs']),
  v(24656, 'The reveal', 'Every proposal deserves this moment.', '@teresaandsons', ['basilique-emerald-cut-three-stone', 'notre-dame-oval-solitaire']),
  v(34213, 'Dressing the vitrine', 'Behind the glass on rue Sherbrooke.', '@teresaandsons', ['riviere-saint-laurent', 'mont-royal-solitaire-pendant', 'plateau-paperclip-chain']),
  v(34611, 'Stacked, not stuffy', 'Tennis lines and curb links, worn together.', '@mtl.style', ['westmount-tennis-bracelet', 'griffintown-chain-bracelet']),
  v(47288, 'Forty facets later', 'Our setter checks each stone under the loupe.', '@teresaandsons', ['mont-royal-solitaire-pendant', 'vieux-port-diamond-studs']),
  v(50782, 'Evening, adorned', 'Emerald and pearl for a gala in Old Montreal.', '@priya.s', ['sherbrooke-emerald-cocktail', 'outremont-pearl-drops']),
  v(51649, 'Yes, in Montréal', 'A campfire proposal on Mont-Royal.', '@danielk', ['notre-dame-oval-solitaire']),
  v(5181, 'Promises, boxed', 'Matched bands, ready for the day.', '@teresaandsons', ['promesse-wedding-band', 'laurier-stacking-band']),
  v(2861, 'Recycled gold', 'Every ingot we cast is reclaimed and refined.', '@teresaandsons', ['teresa-signet', 'atwater-cuff']),
]

export const videoProducts = (video: ShoppableVideo): Product[] => video.products.map(getProduct).filter((p): p is Product => !!p)

export const videosForProduct = (slug: string) => VIDEOS.filter((x) => x.products.includes(slug))

export const videosForCategory = (cat: CategorySlug) =>
  VIDEOS.filter((x) => videoProducts(x).some((p) => p.category === cat))

// Review media

export type ReviewMedia = { type: 'image'; src: string } | { type: 'video'; src: string; poster: string }

const img = (src: string): ReviewMedia => ({ type: 'image', src })
const vid = (n: number): ReviewMedia => ({ type: 'video', src: clip(n, 360), poster: poster(n) })

/** Client-submitted media pools, chosen to match what each category looks like when worn. */
export const REVIEW_MEDIA: Record<string, ReviewMedia[]> = {
  ring: [img(IMG.ring1), vid(51651), img(IMG.rings), vid(5215), img(IMG.ring2), vid(20877), img(IMG.bridal2), vid(5223)],
  necklace: [img(IMG.necklace1), vid(34213), img(IMG.necklace2), img(IMG.jewelryFlat), vid(50782)],
  earrings: [img(IMG.earrings1), img(IMG.earrings3), vid(50782), img(IMG.earrings2)],
  bracelet: [img(IMG.bracelet1), vid(34611), img(IMG.bracelet2), vid(47476)],
  watch: [img(IMG.watch1), img(IMG.watch3), img(IMG.watch2)],
  gift: [img(IMG.gift1), img(IMG.gift2), vid(24656)],
}

export function mediaPoolFor(p: Product): ReviewMedia[] {
  if (p.category === 'watches') return REVIEW_MEDIA.watch
  if (p.category === 'gifts') return REVIEW_MEDIA.gift
  const n = p.name.toLowerCase()
  if (/earring|stud|drop|huggie/.test(n)) return REVIEW_MEDIA.earrings
  if (/bracelet|cuff/.test(n)) return REVIEW_MEDIA.bracelet
  if (/necklace|pendant|collar|rivi|chain/.test(n)) return REVIEW_MEDIA.necklace
  return REVIEW_MEDIA.ring
}
