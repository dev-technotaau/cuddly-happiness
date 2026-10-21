import { useState } from 'react'
import { getProduct, openingPrice, pic, type RentalPeriodId } from '../../data/catalog'
import { HOUSE } from '../../data/house'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { rich } from '../../i18n/rich'
import { href, useStore } from '../../store'
import Price from '../Price'
import { btnOnDark } from '../ui'
import VisitButton from '../visit/VisitButton'

const PIECE = 'redpath-tennis-necklace'
const PERIODS: RentalPeriodId[] = ['weekend', 'week', 'month']

const COPY = bilingual(
  {
    eyebrow: 'Rent or own',
    title: 'One piece, <em>two ways</em>.',
    text: 'Wear it for an evening, or keep it for a lifetime. The pieces you can rent are the very ones you can own.',
    how: 'Own or rent',
    own: 'Own it',
    rent: 'Rent it',
    keep: 'Yours to keep, with lifetime care and complimentary resizing.',
    discover: 'Discover the piece',
    reserve: 'Choose your dates',
    steps: ['Choose your dates', 'Fitted in the salon, or couriered to you', 'Collected the next morning'],
    deposit: 'Deposit, held and released on return',
    fitting: 'Book a fitting',
    vault: 'View the rental vault',
    alt: 'The Redpath tennis necklace',
  },
  {
    eyebrow: 'Louer ou acheter',
    title: 'Une pièce, <em>deux façons</em>.',
    text: 'Portez-la le temps d’un soir, ou gardez-la toute une vie. Les pièces offertes en location sont celles que vous pouvez acheter.',
    how: 'Acheter ou louer',
    own: 'L’acheter',
    rent: 'La louer',
    keep: 'À vous pour toujours, avec l’entretien à vie et l’ajustement offert.',
    discover: 'Découvrir la pièce',
    reserve: 'Choisir vos dates',
    steps: ['Choisissez vos dates', 'Ajustée au salon, ou livrée par messager', 'Reprise le lendemain matin'],
    deposit: 'Dépôt, retenu puis libéré au retour',
    fitting: 'Réserver un essayage',
    vault: 'Voir le coffre de location',
    alt: 'Le collier tennis Redpath',
  },
)

/** One piece, two ways, on the vault's dark ground (it took in Home's rental band on 2026-10-21): the Redpath tennis
 *  necklace with an Own | Rent switch. Owning shows its price; renting, its rates by period, the deposit hold, three
 *  steps and the rental credit toward buying; and the way into the vault. */
export default function RentOrOwn({ index }: { index: string }) {
  const { currency } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const house = useCopy(HOUSE)
  const catalog = useCatalog()
  const [mode, setMode] = useState<'own' | 'rent'>('rent')
  const [period, setPeriod] = useState<RentalPeriodId>('weekend')
  const piece = getProduct(PIECE)
  if (!piece?.rental) return null
  const rates = piece.rental

  return (
    <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-6">
          <a href={href.product(piece.slug, mode === 'rent')} data-reveal-img className="group relative block aspect-[4/5] overflow-hidden bg-white/5">
            <img data-parallax {...pic(piece.images[0], '(min-width: 1024px) 50vw, 100vw')} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute bottom-6 left-6 bg-[var(--bg-travertine)]/90 px-4 py-3 text-[var(--text-espresso)]">
              <span className="font-spec block text-[10px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{catalog.product(piece).collection}</span>
              <span className="font-serif-editorial block text-xl">{catalog.name(piece)}</span>
            </span>
          </a>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p data-reveal className="font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/60"><span className="text-[var(--gold-champagne)]">{index}</span> {t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">{rich(t.title, 'text-[var(--gold-champagne)]')}</h2>
          <p data-reveal="0.1" className="mt-6 max-w-md leading-relaxed text-white/65">{t.text}</p>

          <div data-reveal="0.15" role="radiogroup" aria-label={t.how} className="mt-10 grid grid-cols-2 border border-white/15 p-1">
            {(['own', 'rent'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`py-3.5 text-[11px] uppercase tracking-[0.22em] transition-colors ${mode === m ? 'bg-[var(--bg-travertine)] text-[var(--text-espresso)]' : 'text-white/60 hover:text-white'}`}>
                {m === 'own' ? t.own : t.rent}
              </button>
            ))}
          </div>

          <div key={mode} className="mt-8 motion-safe:animate-[fadeUp_0.7s_cubic-bezier(0.16,1,0.3,1)]">
            {mode === 'own' ? (
              <>
                <Price amount={openingPrice(piece, currency)} className="text-3xl [&_span]:text-white/60" />
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">{t.keep}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={href.product(piece.slug)} className={btnOnDark}>{t.discover}</a>
                  <VisitButton tone="dark" request={{ purpose: 'tennis', pieces: [{ slug: piece.slug }] }} />
                </div>
              </>
            ) : (
              <>
                <div role="group" aria-label={t.rent} className="grid grid-cols-3 gap-1.5">
                  {PERIODS.map((p) => (
                    <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className={`border px-3 py-3 text-left transition-colors ${period === p ? 'border-[var(--bg-travertine)] bg-[var(--bg-travertine)] text-[var(--text-espresso)]' : 'border-white/15 hover:border-white/50'}`}>
                      <span className="block text-[10px] uppercase tracking-[0.2em]">{common.periods[p]}</span>
                      <Price amount={rates[p][currency]} className={`mt-1 block text-sm ${period === p ? '' : '[&_span]:text-white/60'}`} />
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-white/60">{t.deposit} <Price amount={rates.deposit[currency]} className="text-[var(--bg-travertine)] [&_span]:text-white/60" /></p>
                <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                  {t.steps.map((s, i) => (
                    <li key={s} className="border-t border-white/15 pt-4">
                      <span className="font-spec block text-[10px] text-[var(--gold-champagne)]">0{i + 1}</span>
                      <span className="font-serif-editorial mt-2 block text-lg leading-snug">{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-white/80">{house.rentalCredit}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={href.product(piece.slug, true)} className={btnOnDark}>{t.reserve}</a>
                  <VisitButton tone="dark" request={{ purpose: 'rental', pieces: [{ slug: piece.slug, rent: true }] }}>{t.fitting}</VisitButton>
                </div>
              </>
            )}
          </div>
          <a data-reveal="0.2" href={href.category('rentals')} className="link-line mt-10 text-[var(--bg-travertine)]">{t.vault}</a>
        </div>
      </div>
    </section>
  )
}
