import { useState } from 'react'
import { PRODUCTS } from '../../data/catalog'
import { href } from '../../store'
import ProductCard from '../ProductCard'
import SectionHeader from './SectionHeader'

const TABS = [
  { id: 'Bestseller', label: 'Bestsellers' },
  { id: 'New', label: 'New arrivals' },
  { id: 'Atelier Exclusive', label: 'Atelier exclusives' },
] as const

export default function Treasured() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('Bestseller')
  const items = PRODUCTS.filter((p) => p.badges?.includes(tab)).slice(0, 6)

  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-32 lg:px-12 lg:pb-44">
      <SectionHeader
        index="02"
        eyebrow="The selection"
        title={<>Most <em className="text-[var(--gold-vermeil)]">treasured</em></>}
        aside={
          <div role="tablist" className="flex gap-8">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors ${tab === t.id ? '' : 'text-[var(--text-linen)] hover:text-[var(--text-espresso)]'}`}
              >
                {t.label}
                <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${tab === t.id ? 'scale-x-100' : 'scale-x-0'}`} />
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
        <a href={href.category('necklaces')} className="link-line">Continue the discovery</a>
      </div>
    </section>
  )
}
