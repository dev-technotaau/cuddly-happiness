import { ArrowRight } from 'lucide-react'
import { SIGNATURES, isRentable, openingPrice, pic, signaturePieces } from '../../data/catalog'
import { HOUSE, HOUSE_IMG } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'
import VisitButton from '../visit/VisitButton'
import SectionHeader from './SectionHeader'

const COPY = bilingual(
  {
    eyebrow: 'The house signatures',
    title: 'Our <em>signatures</em>.',
    aside: 'The two pieces families come to us for, made in our atelier since 1962.',
    count: (n: number) => `${n} pieces`,
    rent: 'Own or rent',
    closing: 'Most clients see their piece in person first. We’ll have your favourites ready.',
  },
  {
    eyebrow: 'Les signatures de la maison',
    title: 'Nos <em>signatures</em>.',
    aside: 'Les deux pièces pour lesquelles les familles viennent à nous, faites dans notre atelier depuis 1962.',
    count: (n) => `${n} pièces`,
    rent: 'À acheter ou à louer',
    closing: 'La plupart de nos clients voient leur pièce en personne d’abord. Nous préparerons vos coups de cœur.',
  },
)

/** The two signatures, engagement rings and diamond tennis necklaces, as two tall portraits: what the house is known
 *  for, in the first screens of Home. Each opens its own page; a visit is one tap away. */
export default function Signatures({ index }: { index: string }) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const house = useCopy(HOUSE)
  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">
      <SectionHeader index={index} eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-vermeil)]')} aside={<p className="max-w-xs text-sm leading-relaxed text-[var(--text-taupe)]">{t.aside}</p>} />
      <div className="grid gap-x-8 gap-y-20 lg:grid-cols-2">
        {SIGNATURES.map((s, i) => {
          const copy = house.signatures[s.id]
          const img = HOUSE_IMG.signatures[s.id]
          const pieces = signaturePieces(s.id)
          const from = Math.min(...pieces.map((p) => openingPrice(p, currency)))
          return (
            <article key={s.id} data-reveal={i * 0.1} className={i === 1 ? 'lg:mt-28' : ''}>
              <a href={href.category(s.category, { type: s.family })} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-silk)]">
                  <img {...pic(img.card, '(min-width: 1024px) 46vw, 100vw')} alt={copy.name} loading="lazy" className="editorial-zoom h-full w-full object-cover" />
                  <img {...pic(img.worn, '(min-width: 1024px) 46vw, 100vw')} alt="" loading="lazy" className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-1000 group-hover:opacity-100 [@media(hover:hover)]:block" />
                  <span aria-hidden className="font-serif-editorial pointer-events-none absolute bottom-4 right-6 text-[9rem] font-light italic leading-none text-white/80 mix-blend-overlay">{copy.numeral}</span>
                </div>
                <p className="font-spec mt-8 text-[10px] uppercase tracking-[0.28em] text-[var(--gold-ink)]">{house.signature} {copy.numeral} · {t.count(pieces.length)}{pieces.some(isRentable) && <> · {t.rent}</>}</p>
                <h3 className="font-serif-editorial mt-4 text-5xl font-light leading-[1] tracking-[-0.02em] max-[360px]:text-[2.5rem] lg:text-6xl">{rich(copy.title, 'text-[var(--gold-vermeil)]')}</h3>
                <p className="mt-4 max-w-md leading-relaxed text-[var(--text-taupe)]">{copy.line}</p>
                <p className="mt-5 text-sm">{common.from} <Price amount={from} /></p>
              </a>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={href.category(s.category, { type: s.family })} className="link-line group">{copy.cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></a>
              </div>
            </article>
          )
        })}
      </div>
      <div data-reveal className="mt-24 flex flex-col items-center gap-8 border-t border-[var(--border-hairline)] pt-14 text-center">
        <p className="font-serif-editorial max-w-2xl text-3xl font-light leading-snug lg:text-4xl">{t.closing}</p>
        <VisitButton />
      </div>
    </section>
  )
}
