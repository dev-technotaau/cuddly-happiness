import { useState } from 'react'
import { PRODUCTS } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import ProductCard from '../ProductCard'
import SectionHeader from './SectionHeader'

const TABS = ['Bestseller', 'New', 'Atelier Exclusive'] as const

const COPY = bilingual(
  {
    tabs: { Bestseller: 'Bestsellers', New: 'New arrivals', 'Atelier Exclusive': 'Atelier exclusives' } as Record<(typeof TABS)[number], string>,
    eyebrow: 'The selection',
    title: 'Most <em>treasured</em>',
    more: 'Continue the discovery',
  },
  {
    tabs: { Bestseller: 'Incontournables', New: 'Nouveautés', 'Atelier Exclusive': 'Exclusivités atelier' },
    eyebrow: 'La sélection',
    title: 'Les plus <em>convoitées</em>',
    more: 'Poursuivre la découverte',
  },
)

export default function Treasured() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Bestseller')
  const t = useCopy(COPY)
  const items = PRODUCTS.filter((p) => p.badges?.includes(tab)).slice(0, 6)

  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-32 lg:px-12 lg:pb-44">
      <SectionHeader
        index="02"
        eyebrow={t.eyebrow}
        title={rich(t.title, 'text-[var(--gold-vermeil)]')}
        aside={
          <div role="tablist" className="flex flex-wrap gap-x-8 gap-y-3">
            {TABS.map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`relative pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors ${tab === id ? '' : 'text-[var(--text-linen)] hover:text-[var(--text-espresso)]'}`}
              >
                {t.tabs[id]}
                <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} />
              </button>
            ))}
          </div>
        }
      />
      <div key={tab} className="grid animate-[fadeUp_0.9s_cubic-bezier(0.16,1,0.3,1)] gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="mt-20 flex justify-center">
        {/* Opens Necklaces until the "Shop all" page exists (.claude/docs/todo.md §11). */}
        <a href={href.category('necklaces')} className="link-line">{t.more}</a>
      </div>
    </section>
  )
}
