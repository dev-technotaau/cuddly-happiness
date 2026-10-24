import type { Product } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import Price from '../Price'
import ShopMosaic from './ShopMosaic'

const COPY = bilingual(
  {
    maison: 'Maison',
    crumb: 'Shop all',
    title: 'Every <em>piece</em>',
    text: 'Everything the house makes and curates, in one place: designed and finished in our atelier on rue Sherbrooke.',
    stats: { pieces: 'Pieces', chapters: 'Chapters', rent: 'To rent or own', from: 'From' },
    edits: 'The edits',
    search: 'Search',
    searchTitle: (q: string) => `“<em>${q}</em>”`,
    searchText: 'From all nine chapters, with every filter below.',
    found: (n: number) => (n === 0 ? 'Nothing found yet' : `${n} piece${n === 1 ? '' : 's'} found`),
  },
  {
    maison: 'Maison',
    crumb: 'Toute la boutique',
    title: 'Toutes les <em>pièces</em>',
    text: 'Tout ce que la maison fait et choisit, au même endroit : dessiné et fini dans notre atelier, rue Sherbrooke.',
    stats: { pieces: 'Pièces', chapters: 'Chapitres', rent: 'À louer ou à acheter', from: 'Dès' },
    edits: 'Les sélections',
    search: 'Recherche',
    searchTitle: (q) => `« <em>${q}</em> »`,
    searchText: 'Dans les neuf chapitres, avec tous les filtres ci-dessous.',
    found: (n) => (n === 0 ? 'Aucune pièce pour l’instant' : `${n} pièce${n < 2 ? '' : 's'} trouvée${n < 2 ? '' : 's'}`),
  },
)

export interface HeroEdit {
  id: string
  label: string
  count: number
  on: boolean
}

interface Props {
  /** The search on screen, when the page opened on one (the header's "See all"). */
  q: string
  searching: boolean
  found: number
  stats: { pieces: number; chapters: number; rent: number; from: number }
  edits: HeroEdit[]
  onEdit: (id: string) => void
  mosaic: Product[]
}

/** Shop all's hero on the vault's dark ground: the title, the house in figures and the edits on the left, and the
 *  pieces drifting past on the right (a row on phones), each one a way into its page. Opened on a search, it names
 *  the search instead and the mosaic shows what it found. */
export default function ShopHero({ q, searching, found, stats, edits, onEdit, mosaic }: Props) {
  const t = useCopy(COPY)
  const shows = mosaic.length >= 6
  return (
    <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--gold-champagne)]/[0.09] via-transparent to-transparent" />
      <div className={`relative mx-auto grid max-w-[1600px] grid-cols-1 px-6 lg:grid-cols-12 lg:gap-12 lg:px-12 ${searching ? 'lg:min-h-[520px]' : 'lg:min-h-[min(860px,calc(100svh-111px))]'}`}>
        <div className={`relative z-10 flex flex-col justify-end pb-12 pt-16 lg:pb-20 lg:pt-24 ${shows ? 'lg:col-span-6' : 'lg:col-span-10'}`}>
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.32em] text-[var(--gold-champagne)]">
            <a href={href.home} className="hover:text-white">{t.maison}</a> / {searching ? t.search : t.crumb}
          </p>
          <h1 data-reveal="0.05" className={`font-serif-editorial mt-6 font-light leading-[0.92] tracking-[-0.02em] ${searching ? 'text-5xl wrap-anywhere lg:text-7xl' : 'text-[clamp(3.25rem,15vw,5.5rem)] lg:text-[clamp(5.5rem,8.6vw,9.5rem)]'}`}>
            {rich(searching ? (q ? t.searchTitle(q) : t.title) : t.title, 'text-[var(--gold-champagne)]')}
          </h1>
          <p data-reveal="0.1" className="mt-7 max-w-md leading-relaxed text-white/70">{searching ? t.searchText : t.text}</p>

          {searching ? (
            <p data-reveal="0.15" className="font-spec mt-8 text-[11px] uppercase tracking-[0.26em] text-[var(--gold-champagne)]" aria-live="polite">{t.found(found)}</p>
          ) : (
            <dl data-reveal="0.15" className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4">
              {([['pieces', stats.pieces], ['chapters', stats.chapters], ['rent', stats.rent]] as const).map(([k, n]) => (
                <div key={k} className="flex flex-col-reverse justify-end gap-2">
                  <dt className="font-spec text-[10px] uppercase tracking-[0.24em] text-white/60">{t.stats[k]}</dt>
                  <dd className="font-serif-editorial text-4xl font-light leading-none">{n}</dd>
                </div>
              ))}
              <div className="flex flex-col-reverse justify-end gap-2">
                <dt className="font-spec text-[10px] uppercase tracking-[0.24em] text-white/60">{t.stats.from}</dt>
                <dd className="text-2xl leading-none text-[var(--gold-champagne)] sm:pt-2"><Price amount={stats.from} className="[&_span]:text-white/60" /></dd>
              </div>
            </dl>
          )}

          {edits.length > 0 && (
            <div data-reveal="0.2" className="mt-10">
              <p id="shop-edits" className="font-spec text-[10px] uppercase tracking-[0.28em] text-white/60">{t.edits}</p>
              <div role="group" aria-labelledby="shop-edits" className="mt-4 flex flex-wrap gap-2">
                {edits.map((e) => (
                  <button key={e.id} type="button" aria-pressed={e.on} onClick={() => onEdit(e.id)} className={`group flex items-center gap-2.5 rounded-full border px-4 py-2 text-[13px] transition-colors duration-500 ${e.on ? 'border-[var(--gold-champagne)] bg-[var(--gold-champagne)] text-[var(--bg-vault)]' : 'border-white/20 text-white/85 hover:border-[var(--gold-champagne)] hover:text-white'}`}>
                    {e.label}
                    <span className={`font-spec text-[10px] ${e.on ? 'text-[var(--bg-vault)]/70' : 'text-white/60 group-hover:text-[var(--gold-champagne)]'}`}>{e.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {shows && <ShopMosaic pieces={mosaic} className="relative -mx-6 pb-12 lg:col-span-6 lg:mx-0 lg:pb-0" />}
      </div>
    </section>
  )
}
