import { useRef } from 'react'
import { IMG } from '../data/catalog'
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

const SPECS = [
  ['Cut', 'Excellent'],
  ['Color', 'D – G'],
  ['Clarity', 'IF – VS2'],
]

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
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
              <img data-parallax src={IMG.bridal1} alt="Notre-Dame oval solitaire" loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div data-reveal-img className="absolute -bottom-10 -right-6 hidden aspect-square w-[38%] overflow-hidden border-[10px] border-[var(--bg-silk)] lg:block">
              <img src={IMG.bridal2} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p data-reveal className="font-mono-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">
              <span className="text-[var(--gold-vermeil)]">03</span> Chapter V · Mariage
            </p>
            <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]">
              A promise, <em className="text-[var(--gold-vermeil)]">certified</em> to the last facet.
            </h2>
            <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-[var(--text-taupe)]">
              Every centre stone arrives with its GIA grading report and is hand-set in platinum or 18k gold by our master setter.
            </p>
            <dl data-reveal="0.15" className="font-mono-spec mt-12 grid grid-cols-3 divide-x divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
              {SPECS.map(([k, v]) => (
                <div key={k} className="py-6 text-center">
                  <dt className="text-[9px] uppercase tracking-[0.26em] text-[var(--text-linen)]">{k}</dt>
                  <dd className="mt-2 text-sm">{v}</dd>
                </div>
              ))}
            </dl>
            <div data-reveal="0.2" className="mt-12 flex flex-wrap items-center gap-10">
              <a href={href.category('bridal')} className="bg-[var(--text-espresso)] px-9 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-travertine)] transition-colors duration-500 hover:bg-[var(--gold-vermeil)]">
                Explore bridal
              </a>
              <a href={href.atelier} className="link-line">Design your own</a>
            </div>
          </div>
        </div>
      </section>

      <FourCs />
      <ShoppableVideos videos={VIDEOS} eyebrow="Watch & shop" title={<>Seen in <em className="text-[var(--gold-vermeil)]">motion</em></>} />
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
          <p data-reveal className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">Chapter VII · La Location</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mx-auto mt-8 max-w-5xl text-[3rem] font-light leading-[0.95] tracking-[-0.025em] sm:text-7xl lg:text-[7.5rem]">
            Borrow the <em className="text-[var(--gold-champagne)]">vault</em> for an evening.
          </h2>
          <p data-reveal="0.1" className="mx-auto mt-10 max-w-lg leading-relaxed text-white/65">
            High jewelry for galas, premieres and weddings — insured, couriered, and collected the morning after.
          </p>
          <div data-reveal="0.15" className="font-mono-spec mx-auto mt-12 flex max-w-md justify-center divide-x divide-white/15 text-[10px] uppercase tracking-[0.22em] text-white/60">
            <span className="px-6">Weekend</span><span className="px-6">One week</span><span className="px-6">One month</span>
          </div>
          <a data-reveal="0.2" href={href.category('rentals')} className="mt-14 inline-block bg-[var(--gold-champagne)] px-10 py-4 text-[11px] font-medium uppercase tracking-[0.26em] text-[var(--bg-vault)] transition-colors duration-500 hover:bg-[var(--bg-travertine)]">
            View the rental vault
          </a>
        </div>
      </section>

      <Testimonials />

      {/* Heritage */}
      <section className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-32 lg:grid-cols-12 lg:px-12 lg:py-44">
        <div className="grid grid-cols-2 gap-5 lg:order-2 lg:col-span-6 lg:col-start-7">
          <div data-reveal-img className="relative mt-20 aspect-[3/4] overflow-hidden"><img data-parallax src={IMG.ring2} alt="Signet ring" loading="lazy" className="h-full w-full object-cover" /></div>
          <div data-reveal-img className="relative aspect-[3/4] overflow-hidden"><img data-parallax src={IMG.rings} alt="Stacked rings" loading="lazy" className="h-full w-full object-cover" /></div>
        </div>
        <div className="lg:order-1 lg:col-span-5">
          <p data-reveal className="font-mono-spec flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">
            <span className="text-[var(--gold-vermeil)]">08</span> Chapter IX · Sur Mesure
          </p>
          <span data-reveal="0.05" className="font-serif-editorial mt-6 block text-8xl leading-none text-[var(--gold-champagne)]">“</span>
          <blockquote data-reveal="0.08" className="font-serif-editorial -mt-6 text-4xl font-light leading-[1.1] lg:text-[3.5rem]">
            Teresa believed a jewel should <em className="text-[var(--gold-vermeil)]">outlive</em> its maker.
          </blockquote>
          <p data-reveal="0.1" className="font-mono-spec mt-8 text-[10px] uppercase tracking-[0.26em] text-[var(--text-taupe)]">Antonio Moretti · Second generation</p>
          <div data-reveal="0.15" className="mt-12">
            <a href={href.atelier} className="link-line">Commission a piece</a>
          </div>
        </div>
      </section>

      <RecentlyViewed index="—" eyebrow="Welcome back" title={<>Continue <em className="text-[var(--gold-vermeil)]">where you left off</em></>} />
      <Services />
      <SocialGrid />
      <VisitSalon />
    </div>
  )
}
