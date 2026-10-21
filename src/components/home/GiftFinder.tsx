import { useMemo, useState } from 'react'
import { PRODUCTS, formatPrice, priceFor, type Product } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import ProductCard from '../ProductCard'

// Budget bounds are the same figures in either currency; labels are formatted in the visitor's.
const BUDGETS = [
  { id: 'u1', range: [0, 1000], test: (n: number) => n < 1000 },
  { id: '1-5', range: [1000, 5000], test: (n: number) => n >= 1000 && n < 5000 },
  { id: '5-15', range: [5000, 15000], test: (n: number) => n >= 5000 && n < 15000 },
  { id: '15', range: [15000, 0], test: (n: number) => n >= 15000 },
] as const

const OCCASIONS: { id: string; match: (p: Product) => boolean }[] = [
  { id: 'all', match: () => true },
  { id: 'love', match: (p) => ['bridal', 'necklaces', 'earrings'].includes(p.category) },
  { id: 'self', match: (p) => ['rings', 'bracelets', 'earrings'].includes(p.category) },
  { id: 'him', match: (p) => ['watches', 'rings'].includes(p.category) || p.engravable === true },
  { id: 'milestone', match: (p) => p.engravable === true },
]

const COPY = bilingual(
  {
    under: (max: string) => `Under ${max}`,
    between: (min: string, max: string) => `${min} – ${max}`,
    over: (min: string) => `${min} +`,
    occasions: { all: 'Any occasion', love: 'Anniversary', self: 'For myself', him: 'For him', milestone: 'Milestone' } as Record<string, string>,
    eyebrow: 'Le Trouveur de Cadeaux',
    title: 'Find the <em>perfect</em> gift.',
    text: 'Choose a budget and an occasion. Every gift arrives in our travertine box with a handwritten card.',
    budget: 'Budget',
    occasion: 'Occasion',
    all: 'All gifts',
    none: 'Nothing in this pairing — yet.',
    source: 'Our concierge can source or commission something special.',
    ask: 'Ask the concierge',
  },
  {
    under: (max) => `Moins de ${max}`,
    between: (min, max) => `${min} à ${max}`,
    over: (min) => `${min} et plus`,
    occasions: { all: 'Toutes les occasions', love: 'Anniversaire', self: 'Pour moi', him: 'Pour lui', milestone: 'Grand moment' },
    eyebrow: 'Le guide des cadeaux',
    title: 'Trouvez le cadeau <em>parfait</em>.',
    text: 'Choisissez un budget et une occasion. Chaque cadeau arrive dans notre écrin travertin, avec une carte écrite à la main.',
    budget: 'Budget',
    occasion: 'Occasion',
    all: 'Tous les cadeaux',
    none: 'Rien pour ce duo — pour l’instant.',
    source: 'Notre concierge peut trouver ou faire créer une pièce d’exception.',
    ask: 'Demander au concierge',
  },
)

export default function GiftFinder() {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const money = (n: number) => formatPrice(n, currency)
  const label = ({ range: [min, max] }: (typeof BUDGETS)[number]) => (!min ? t.under(money(max)) : !max ? t.over(money(min)) : t.between(money(min), money(max)))
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]['id']>(BUDGETS[1].id)
  const [occasion, setOccasion] = useState('all')

  const results = useMemo(() => {
    const b = BUDGETS.find((x) => x.id === budget)!
    const o = OCCASIONS.find((x) => x.id === occasion)!
    return PRODUCTS.filter((p) => p.category !== 'rentals' && p.category !== 'custom' && o.match(p) && b.test(priceFor(p, currency))).slice(0, 4)
  }, [budget, occasion, currency])

  const chip = (on: boolean) =>
    `whitespace-nowrap border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${on ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4" data-reveal>
          <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]"><span className="mr-4 text-[var(--text-linen)]">05</span>{t.eyebrow}</p>
          <h2 className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h2>
          <p className="mt-6 max-w-sm text-[var(--text-taupe)]">{t.text}</p>

          <p className="mt-10 text-[11px] uppercase tracking-[0.22em]">{t.budget} <span className="font-spec text-[var(--text-linen)]">({currency})</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUDGETS.map((b) => <button key={b.id} onClick={() => setBudget(b.id)} aria-pressed={budget === b.id} className={chip(budget === b.id)}>{label(b)}</button>)}
          </div>
          <p className="mt-8 text-[11px] uppercase tracking-[0.22em]">{t.occasion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => <button key={o.id} onClick={() => setOccasion(o.id)} aria-pressed={occasion === o.id} className={chip(occasion === o.id)}>{t.occasions[o.id]}</button>)}
          </div>
          <a href={href.category('gifts')} className="mt-10 inline-block border-b border-[var(--text-espresso)] pb-1 text-[11px] font-medium uppercase tracking-[0.26em] hover:text-[var(--gold-vermeil)]">
            {t.all}
          </a>
        </div>
        <div className="lg:col-span-8">
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12">
              {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center bg-[var(--bg-silk)] p-10 text-center">
              <p className="font-serif-editorial text-3xl italic text-[var(--text-taupe)]">{t.none}</p>
              <p className="mt-3 text-sm text-[var(--text-linen)]">{t.source}</p>
              <a href={href.atelier} className="mt-8 border-b border-[var(--gold-vermeil)] pb-1 text-[11px] uppercase tracking-[0.24em]">{t.ask}</a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
