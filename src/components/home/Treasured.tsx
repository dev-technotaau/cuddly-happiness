import { useState } from 'react'
import { PRODUCTS, tryOnKind, type ProductType } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'
import ProductCard from '../ProductCard'
import TryOnButton from '../tryon/TryOnButton'
import SectionHeader from './SectionHeader'

const TABS = ['Bestseller', 'New', 'Atelier Exclusive'] as const

const COPY = bilingual(
  {
    tabs: { Bestseller: 'Bestsellers', New: 'New arrivals', 'Atelier Exclusive': 'Atelier exclusives' } as Record<(typeof TABS)[number], string>,
    eyebrow: 'The selection',
    title: 'Most <em>treasured</em>',
    more: 'Continue the discovery',
    tryOn: 'Try any piece on you',
  },
  {
    tabs: { Bestseller: 'Incontournables', New: 'Nouveautés', 'Atelier Exclusive': 'Exclusivités atelier' },
    eyebrow: 'La sélection',
    title: 'Les plus <em>convoitées</em>',
    more: 'Poursuivre la découverte',
    tryOn: 'Essayez une pièce sur vous',
  },
)

// The two signatures lead every tab.
const SIGNED: ProductType[] = ['engagement', 'tennis-necklace', 'riviere', 'collar']

/** The selection: bestsellers, new arrivals and atelier exclusives, the signatures first. A swipeable row on phones. */
export default function Treasured({ index }: { index: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Bestseller')
  const t = useCopy(COPY)
  // The try-on opens on the studs, with every piece it can draw
  const wearable = PRODUCTS.filter((p) => tryOnKind(p))
  const tryOnStart = wearable.find((p) => p.slug === 'vieux-port-diamond-studs') ?? wearable[0]
  const items = PRODUCTS.filter((p) => p.badges?.includes(tab)).sort((a, b) => Number(!SIGNED.includes(a.type)) - Number(!SIGNED.includes(b.type))).slice(0, 6)

  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-32 pt-28 lg:px-12 lg:pb-44 lg:pt-36">
      <SectionHeader
        index={index}
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
                className={`relative pb-2 text-[11px] uppercase tracking-[0.22em] transition-colors ${tab === id ? '' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)]'}`}
              >
                {t.tabs[id]}
                <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold-vermeil)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} />
              </button>
            ))}
          </div>
        }
      />
      {/* Phones swipe through the selection; from sm up it is a grid */}
      <div key={tab} className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain px-6 pb-4 motion-safe:animate-[fadeUp_0.9s_cubic-bezier(0.16,1,0.3,1)] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3" data-lenis-prevent-horizontal>
        {items.map((p) => <div key={p.id} className="w-[78vw] shrink-0 snap-start sm:w-auto"><ProductCard product={p} /></div>)}
      </div>
      <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        <a href={href.shop()} className="link-line">{t.more}</a>
        {/* The virtual try-on, one tap from the selection (Home's try-on section left on 2026-10-21) */}
        {tryOnStart && <TryOnButton product={tryOnStart} list={wearable} variant="link" label={t.tryOn} />}
      </div>
    </section>
  )
}
