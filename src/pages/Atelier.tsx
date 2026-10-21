import { useRef } from 'react'
import { IMG, pic } from '../data/catalog'
import { HOUSE } from '../data/house'
import { bilingual, useCopy } from '../i18n'
import { rich } from '../i18n/rich'
import Hallmark from '../components/brand/Hallmark'
import useReveal from '../components/useReveal'
import Generations from '../components/home/Generations'
import MakingScroll from '../components/home/MakingScroll'
import TheHands from '../components/home/TheHands'
import ShoppableVideos from '../components/video/ShoppableVideos'
import VisitFlow from '../components/visit/VisitFlow'
import { VIDEOS } from '../data/media'

const COPY = bilingual(
  {
    steps: [
      ['Consultation', 'An unhurried conversation in our salon or by video, with sketches made in front of you.'],
      ['Stone sourcing', 'We present a curated selection of natural, GIA-certified diamonds and coloured gems.'],
      ['CAD & wax', 'Precise 3D renders, then a wax model you can try on before we cast.'],
      ['Hand-finishing', 'Cast, set and polished at our bench on rue Sherbrooke, then hallmarked.'],
    ] as [string, string][],
    eyebrow: 'L’Atelier · Since 1962',
    title: 'Made <em>for you</em>, by a family.',
    story: 'Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls.',
    alt: 'Hands setting a stone at the bench',
    filmsEyebrow: 'Inside the atelier',
    filmsTitle: 'At the <em>bench</em>',
    book: 'Book a private <em>visit</em>',
    bookText: 'In the salon, by video or by phone. Tell us what brings you in, and we’ll have everything ready.',
  },
  {
    steps: [
      ['Consultation', 'Une conversation sans hâte, au salon ou par vidéo, avec des croquis dessinés sous vos yeux.'],
      ['Choix des pierres', 'Nous vous présentons une sélection de diamants naturels certifiés GIA et de pierres de couleur.'],
      ['3D et cire', 'Des rendus 3D précis, puis un modèle en cire à essayer avant la fonte.'],
      ['Finition à la main', 'Coulée, sertie et polie à notre établi de la rue Sherbrooke, puis poinçonnée.'],
    ],
    eyebrow: 'L’Atelier · Depuis 1962',
    title: 'Fait <em>pour vous</em>, par une famille.',
    story: 'Teresa Moretti ouvre un premier établi rue Sainte-Catherine en 1962. Aujourd’hui, ses fils et sa petite-fille poursuivent son œuvre — bagues de fiançailles sur mesure, bijoux de famille réinventés et pièces personnalisées, toutes façonnées entre ces murs.',
    alt: 'Des mains sertissent une pierre à l’établi',
    filmsEyebrow: 'Dans l’atelier',
    filmsTitle: 'À l’<em>établi</em>',
    book: 'Prendre <em>rendez-vous</em>',
    bookText: 'Au salon, par vidéo ou par téléphone. Dites-nous ce qui vous amène, et tout sera prêt.',
  },
)

/** The atelier: the family's story, the four steps of a commission, the hands at the bench, the making from bench to
 *  heirloom (moved from Home on 2026-10-21), the three generations, the bench on film, and the private visit, booked on
 *  the page. */
export default function Atelier() {
  const root = useRef<HTMLDivElement>(null)
  const t = useCopy(COPY)
  const house = useCopy(HOUSE)
  useReveal(root)

  return (
    <div ref={root}>
      <section className="mx-auto grid max-w-[1600px] gap-12 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
        <div className="lg:col-span-6">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
          <h1 data-reveal="0.05" className="font-serif-editorial mt-6 text-6xl font-light leading-[0.95] lg:text-[7.5rem]">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h1>
          <p data-reveal="0.1" className="mt-10 max-w-lg leading-relaxed text-[var(--text-taupe)]">
            {t.story}
          </p>
          <p data-reveal="0.15" className="mt-10 flex max-w-lg items-center gap-4 border-t border-[var(--border-hairline)] pt-6 text-sm text-[var(--text-taupe)]">
            <Hallmark className="h-12 w-12 shrink-0 text-[var(--gold-vermeil)]" /> {house.hallmark} {house.natural}
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden lg:col-span-5 lg:col-start-8">
          <img data-parallax {...pic(IMG.handsSetting, '(min-width: 1024px) 40vw, 100vw')} alt={t.alt} className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="bg-[var(--bg-silk)]">
        <ol className="mx-auto grid max-w-[1600px] gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map(([title, d], i) => (
            <li key={i} data-reveal={i * 0.08} className="bg-[var(--bg-silk)] p-10 lg:p-12">
              <span className="font-spec text-[10px] text-[var(--gold-ink)]">0{i + 1}</span>
              <h3 className="font-serif-editorial mt-6 text-3xl">{title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-taupe)]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <TheHands index="01" />
      <MakingScroll index="02" />
      <Generations index="03" />

      <ShoppableVideos
        videos={VIDEOS.filter((v) => v.handle === '@teresaandsons')}
        tone="dark"
        index="04"
        eyebrow={t.filmsEyebrow}
        title={rich(t.filmsTitle, 'text-[var(--gold-champagne)]')}
        className="border-t border-white/10"
      />

      {/* The private visit, booked on the page with the same flow as the drawer */}
      <section className="mx-auto max-w-3xl px-6 py-28 lg:py-36">
        <h2 data-reveal className="font-serif-editorial text-center text-5xl lg:text-6xl">{rich(t.book, 'text-[var(--gold-vermeil)]')}</h2>
        <p data-reveal="0.05" className="mx-auto mt-6 max-w-lg text-center leading-relaxed text-[var(--text-taupe)]">{t.bookText}</p>
        <p data-reveal="0.08" className="mx-auto mt-3 max-w-lg text-center text-sm text-[var(--text-taupe)]">{house.visitLength}</p>
        <div data-reveal="0.1" className="mt-14">
          <VisitFlow request={{ purpose: 'design' }} embedded />
        </div>
      </section>
    </div>
  )
}
