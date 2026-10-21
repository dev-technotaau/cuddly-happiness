import { useRef } from 'react'
import { bilingual, useCopy } from '../i18n'
import { rich } from '../i18n/rich'
import useReveal from '../components/useReveal'
import HomeHero from '../components/HomeHero'
import PressStrip from '../components/home/PressStrip'
import WelcomeBack from '../components/home/WelcomeBack'
import Signatures from '../components/home/Signatures'
import HouseNumbers from '../components/home/HouseNumbers'
import CategoryIndex from '../components/home/CategoryIndex'
import Treasured from '../components/home/Treasured'
import RentOrOwn from '../components/home/RentOrOwn'
import SketchToRing from '../components/home/SketchToRing'
import Generations from '../components/home/Generations'
import Testimonials from '../components/home/Testimonials'
import Services from '../components/home/Services'
import PrivateVisit from '../components/home/PrivateVisit'
import SocialGrid from '../components/home/SocialGrid'
import VisitSalon from '../components/home/VisitSalon'
import RecentlyViewed from '../components/RecentlyViewed'

const COPY = bilingual(
  {
    welcomeBack: 'Welcome back',
    continueTitle: 'Continue <em>where you left off</em>',
  },
  {
    welcomeBack: 'Bon retour',
    continueTitle: 'Reprenez <em>là où vous en étiez</em>',
  },
)

// The acts of Home, in the order they render: each is numbered from this list (owner decision), never by hand. The
// welcome-back sections, the house in numbers and the salon that closes the page carry no number. Refined to ten acts
// on 2026-10-21 (owner): what left Home lives on its own page (.claude/plans/home-refine.md).
const ACTS = ['signatures', 'index', 'treasured', 'rent', 'sketch', 'generations', 'testimonials', 'promise', 'visit', 'social'] as const
const num = (id: (typeof ACTS)[number]) => String(ACTS.indexOf(id) + 1).padStart(2, '0')

/** Home: the arrival, the two signatures, the house in numbers, the chapters and the selection, rent or own, a
 *  commission from the sketch, three generations, the families, the promise, the private visit and the salon, in an
 *  alternating rhythm of light and dark grounds. */
export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const t = useCopy(COPY)
  useReveal(root)

  return (
    <div ref={root}>
      <HomeHero />
      <PressStrip />

      {/* For returning visitors only: their visit, their shortlist, what they were looking at */}
      <WelcomeBack />
      <RecentlyViewed index="—" eyebrow={t.welcomeBack} title={rich(t.continueTitle, 'text-[var(--gold-vermeil)]')} />

      {/* What the house is known for, then the proof of its years */}
      <Signatures index={num('signatures')} />
      <HouseNumbers />

      {/* The pieces: every chapter, then the selection */}
      <CategoryIndex index={num('index')} />
      <Treasured index={num('treasured')} />

      {/* The same pieces, two ways; then a piece drawn from the first line */}
      <RentOrOwn index={num('rent')} />
      <SketchToRing index={num('sketch')} />

      {/* The family's years and Teresa's words, the families who come back, and what the house promises them */}
      <Generations index={num('generations')} coda />
      <Testimonials index={num('testimonials')} />
      <Services index={num('promise')} />

      {/* The private visit, step by step, and the pieces as they are worn; the salon's door closes the page, above the footer */}
      <PrivateVisit index={num('visit')} />
      <SocialGrid index={num('social')} />
      <VisitSalon />
    </div>
  )
}
