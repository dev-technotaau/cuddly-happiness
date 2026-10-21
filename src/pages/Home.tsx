import { useRef } from 'react'
import { IMG } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { rich } from '../i18n/rich'
import { href } from '../store'
import useReveal from '../components/useReveal'
import HomeHero from '../components/HomeHero'
import PressStrip from '../components/home/PressStrip'
import CategoryIndex from '../components/home/CategoryIndex'
import Treasured from '../components/home/Treasured'
import GiftFinder from '../components/home/GiftFinder'
import FourCs from '../components/home/FourCs'
import MakingScroll from '../components/home/MakingScroll'
import WatchSpotlight from '../components/home/WatchSpotlight'
import Testimonials from '../components/home/Testimonials'
import Services from '../components/home/Services'
import SocialGrid from '../components/home/SocialGrid'
import VisitSalon from '../components/home/VisitSalon'
import RecentlyViewed from '../components/RecentlyViewed'
import TryOnFeature from '../components/home/TryOnFeature'
import ShoppableVideos from '../components/video/ShoppableVideos'
import { VIDEOS } from '../data/media'

const COPY = bilingual(
  {
    specs: [['Cut', 'Excellent'], ['Colour', 'D – G'], ['Clarity', 'IF – VS2']],
    bridalAlt: 'Notre-Dame oval solitaire',
    bridalChapter: 'Chapter V · Mariage',
    bridalTitle: 'A promise, <em>certified</em> to the last facet.',
    bridalText: 'Every centre stone arrives with its GIA grading report and is hand-set in platinum or 18k gold by our master setter.',
    bridalCta: 'Explore bridal',
    designOwn: 'Design your own',
    filmsEyebrow: 'Watch & shop',
    filmsTitle: 'Seen in <em>motion</em>',
    rentalChapter: 'Chapter VII · La Location',
    rentalTitle: 'Borrow the <em>vault</em> for an evening.',
    rentalText: 'High jewellery for galas, premieres and weddings — insured, couriered, and collected the morning after.',
    periods: ['Weekend', 'One week', 'One month'],
    rentalCta: 'View the rental vault',
    signetAlt: 'Signet ring',
    stackAlt: 'Stacked rings',
    heritageChapter: 'Chapter IX · Sur Mesure',
    openQuote: '“',
    heritageQuote: 'Teresa believed a jewel should <em>outlive</em> its maker.',
    heritageBy: 'Antonio Moretti · Second generation',
    commission: 'Commission a piece',
    welcomeBack: 'Welcome back',
    continueTitle: 'Continue <em>where you left off</em>',
  },
  {
    specs: [['Taille', 'Excellente'], ['Couleur', 'D – G'], ['Pureté', 'IF – VS2']],
    bridalAlt: 'Solitaire ovale Notre-Dame',
    bridalChapter: 'Chapitre V · Mariage',
    bridalTitle: 'Une promesse <em>certifiée</em>, jusqu’à la dernière facette.',
    bridalText: 'Chaque pierre centrale arrive avec son rapport de classement GIA et est sertie à la main dans le platine ou l’or 18 carats par notre maître sertisseur.',
    bridalCta: 'Découvrir le mariage',
    designOwn: 'Créer la vôtre',
    filmsEyebrow: 'Voir et magasiner',
    filmsTitle: 'En <em>mouvement</em>',
    rentalChapter: 'Chapitre VII · La Location',
    rentalTitle: 'Empruntez le <em>coffre</em> le temps d’une soirée.',
    rentalText: 'De la haute joaillerie pour les galas, les premières et les mariages — assurée, livrée par messager et reprise le lendemain matin.',
    periods: ['Fin de semaine', 'Une semaine', 'Un mois'],
    rentalCta: 'Voir le coffre de location',
    signetAlt: 'Chevalière',
    stackAlt: 'Bagues superposées',
    heritageChapter: 'Chapitre IX · Sur mesure',
    openQuote: '«',
    heritageQuote: 'Teresa croyait qu’un bijou doit <em>survivre</em> à son créateur.',
    heritageBy: 'Antonio Moretti · Deuxième génération',
    commission: 'Commander une création',
    welcomeBack: 'Bon retour',
    continueTitle: 'Reprenez <em>là où vous en étiez</em>',
  },
)

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const t = useCopy(COPY)
  useReveal(root)

  return (
    <div ref={root}>
      <HomeHero />
      <PressStrip />
      <CategoryIndex />
      <Treasured />
      <TryOnFeature />

      {/* Bridal editorial */}
      <section className="bg-[var(--bg-silk)]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-32 lg:grid-cols-12 lg:px-12 lg:py-44">
          <div className="relative lg:col-span-6">
            <div data-reveal-img className="relative aspect-[4/5] overflow-hidden">
              <img data-parallax src={IMG.bridal1} alt={t.bridalAlt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div data-reveal-img className="absolute -bottom-10 -right-6 hidden aspect-square w-[38%] overflow-hidden border-[10px] border-[var(--bg-silk)] lg:block">
              <img src={IMG.bridal2} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p data-reveal className="font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">
              <span className="text-[var(--gold-vermeil)]">03</span> {t.bridalChapter}
            </p>
            <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]">
              {rich(t.bridalTitle, 'text-[var(--gold-vermeil)]')}
            </h2>
            <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-[var(--text-taupe)]">
              {t.bridalText}
            </p>
            <dl data-reveal="0.15" className="font-spec mt-12 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
              {t.specs.map(([k, v]) => (
                <div key={k} className="py-6 text-center">
                  <dt className="text-[9px] uppercase tracking-[0.26em] text-[var(--text-linen)]">{k}</dt>
                  <dd className="mt-2 text-sm">{v}</dd>
                </div>
              ))}
            </dl>
            <div data-reveal="0.2" className="mt-12 flex flex-wrap items-center gap-10">
              <a href={href.category('bridal')} className="bg-[var(--text-espresso)] px-9 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 hover:bg-[var(--gold-vermeil)]">
                {t.bridalCta}
              </a>
              <a href={href.atelier} className="link-line">{t.designOwn}</a>
            </div>
          </div>
        </div>
      </section>

      <FourCs />
      <ShoppableVideos videos={VIDEOS} eyebrow={t.filmsEyebrow} title={rich(t.filmsTitle, 'text-[var(--gold-vermeil)]')} />
      <GiftFinder />
      <MakingScroll />
      <WatchSpotlight />

      {/* Rentals */}
      <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
        <div className="absolute inset-0 overflow-hidden opacity-35">
          <img data-parallax src={IMG.jewelryFlat} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg-vault)_75%)]" />
        <div className="relative mx-auto max-w-[1600px] px-6 py-40 text-center lg:px-12 lg:py-52">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{t.rentalChapter}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mx-auto mt-8 max-w-5xl text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-7xl lg:text-[7.5rem]">
            {rich(t.rentalTitle, 'text-[var(--gold-champagne)]')}
          </h2>
          <p data-reveal="0.1" className="mx-auto mt-10 max-w-lg leading-relaxed text-white/65">
            {t.rentalText}
          </p>
          <div data-reveal="0.15" className="font-spec mx-auto mt-12 flex max-w-md justify-center divide-x divide-white/15 text-[10px] uppercase tracking-[0.22em] text-white/60">
            {t.periods.map((p) => <span key={p} className="px-6">{p}</span>)}
          </div>
          <a data-reveal="0.2" href={href.category('rentals')} className="mt-14 inline-block bg-[var(--gold-champagne)] px-10 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-vault)] transition-colors duration-500 hover:bg-[var(--bg-travertine)]">
            {t.rentalCta}
          </a>
        </div>
      </section>

      <Testimonials />

      {/* Heritage */}
      <section className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-32 lg:grid-cols-12 lg:px-12 lg:py-44">
        <div className="grid grid-cols-2 gap-5 lg:order-2 lg:col-span-6 lg:col-start-7">
          <div data-reveal-img className="relative mt-20 aspect-[3/4] overflow-hidden"><img data-parallax src={IMG.ring2} alt={t.signetAlt} loading="lazy" className="h-full w-full object-cover" /></div>
          <div data-reveal-img className="relative aspect-[3/4] overflow-hidden"><img data-parallax src={IMG.rings} alt={t.stackAlt} loading="lazy" className="h-full w-full object-cover" /></div>
        </div>
        <div className="lg:order-1 lg:col-span-5">
          <p data-reveal className="font-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">
            <span className="text-[var(--gold-vermeil)]">08</span> {t.heritageChapter}
          </p>
          <span data-reveal="0.05" aria-hidden="true" className="font-serif-editorial mt-6 block text-8xl leading-none text-[var(--gold-champagne)]">{t.openQuote}</span>
          <blockquote data-reveal="0.08" className="font-serif-editorial -mt-6 text-4xl font-light leading-[1.1] lg:text-[3.5rem]">
            {rich(t.heritageQuote, 'text-[var(--gold-vermeil)]')}
          </blockquote>
          <p data-reveal="0.1" className="font-spec mt-8 text-[10px] uppercase tracking-[0.26em] text-[var(--text-taupe)]">{t.heritageBy}</p>
          <div data-reveal="0.15" className="mt-12">
            <a href={href.atelier} className="link-line">{t.commission}</a>
          </div>
        </div>
      </section>

      <RecentlyViewed index="—" eyebrow={t.welcomeBack} title={rich(t.continueTitle, 'text-[var(--gold-vermeil)]')} />
      <Services />
      <SocialGrid />
      <VisitSalon />
    </div>
  )
}
