import { Camera, ShieldCheck, Sparkles } from 'lucide-react'
import { IMG, PRODUCTS, tryOnKind } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import TryOnButton from '../tryon/TryOnButton'

const COPY = bilingual(
  {
    eyebrow: 'Essayage virtuel',
    title: 'See it <em>on you</em>, before it’s yours.',
    text: 'Open your camera and place earrings, necklaces, rings, bracelets and watches on yourself — in every metal. Save a photo to share, or bring it to your appointment.',
    camera: 'Live camera or an uploaded photo',
    pieces: (n: number) => `${n} pieces, switch metals instantly`,
    privacy: 'Private — nothing leaves your device',
    start: 'Start virtual try-on',
    alt: 'Virtual try-on preview',
    live: 'Live',
    sample: '18k Yellow · Vieux-Port',
  },
  {
    eyebrow: 'Essayage virtuel',
    title: 'Essayez-la <em>sur vous</em>, avant qu’elle ne soit à vous.',
    text: 'Ouvrez votre caméra et essayez boucles d’oreilles, colliers, bagues, bracelets et montres — dans tous les métaux. Enregistrez une photo pour la partager, ou apportez-la à votre rendez-vous.',
    camera: 'Caméra en direct ou photo téléversée',
    pieces: (n) => `${n} pièces, changez de métal en un instant`,
    privacy: 'Confidentiel — rien ne quitte votre appareil',
    start: 'Commencer l’essayage virtuel',
    alt: 'Aperçu de l’essayage virtuel',
    live: 'En direct',
    sample: 'Or jaune 18 k · Vieux-Port',
  },
)

export default function TryOnFeature() {
  const t = useCopy(COPY)
  const wearable = PRODUCTS.filter((p) => tryOnKind(p))
  const start = wearable.find((p) => p.slug === 'vieux-port-diamond-studs') ?? wearable[0]

  return (
    <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-5">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
            <span className="mr-4 text-white/45">—</span>{t.eyebrow}
          </p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5rem]">
            {rich(t.title, 'text-[var(--gold-champagne)]')}
          </h2>
          <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-white/65">
            {t.text}
          </p>
          <ul data-reveal="0.15" className="mt-10 space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3"><Camera size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> {t.camera}</li>
            <li className="flex items-center gap-3"><Sparkles size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> {t.pieces(wearable.length)}</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> {t.privacy}</li>
          </ul>
          <div data-reveal="0.2" className="mt-12">
            {start && <TryOnButton product={start} list={wearable} variant="solid" label={t.start} />}
          </div>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7">
          <div data-reveal-img className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden">
            <img data-parallax src={IMG.earrings3} alt={t.alt} loading="lazy" className="h-full w-full object-cover" />
            {/* Viewfinder framing */}
            <div className="pointer-events-none absolute inset-6">
              {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
                <span key={c} className={`absolute h-8 w-8 border-[var(--gold-champagne)] ${c}`} />
              ))}
            </div>
            <span className="font-spec absolute left-8 top-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> {t.live}
            </span>
            <span className="font-spec absolute bottom-8 right-8 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur">{t.sample}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
