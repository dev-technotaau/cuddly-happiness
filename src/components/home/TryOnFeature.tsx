import { Camera, ShieldCheck, Sparkles } from 'lucide-react'
import { IMG, PRODUCTS, tryOnKind } from '../../data/catalog'
import TryOnButton from '../tryon/TryOnButton'

export default function TryOnFeature() {
  const wearable = PRODUCTS.filter((p) => tryOnKind(p))
  const start = wearable.find((p) => p.slug === 'vieux-port-diamond-studs') ?? wearable[0]

  return (
    <section className="relative overflow-hidden bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-5">
          <p data-reveal className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">
            <span className="mr-4 text-white/45">—</span>Essayage virtuel
          </p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-8 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5rem]">
            See it <em className="text-[var(--gold-champagne)]">on you</em>, before it’s yours.
          </h2>
          <p data-reveal="0.1" className="mt-8 max-w-md leading-relaxed text-white/65">
            Open your camera and place earrings, necklaces, rings, bracelets and watches on yourself — in every metal. Save a photo to share, or bring it to your appointment.
          </p>
          <ul data-reveal="0.15" className="mt-10 space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3"><Camera size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> Live camera or an uploaded photo</li>
            <li className="flex items-center gap-3"><Sparkles size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> {wearable.length} pieces, switch metals instantly</li>
            <li className="flex items-center gap-3"><ShieldCheck size={16} strokeWidth={1.3} className="text-[var(--gold-champagne)]" /> Private — nothing leaves your device</li>
          </ul>
          <div data-reveal="0.2" className="mt-12">
            {start && <TryOnButton product={start} list={wearable} variant="solid" label="Start virtual try-on" />}
          </div>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7">
          <div data-reveal-img className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden">
            <img data-parallax src={IMG.earrings3} alt="Virtual try-on preview" loading="lazy" className="h-full w-full object-cover" />
            {/* Viewfinder framing */}
            <div className="pointer-events-none absolute inset-6">
              {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
                <span key={c} className={`absolute h-8 w-8 border-[var(--gold-champagne)] ${c}`} />
              ))}
            </div>
            <span className="font-mono-spec absolute left-8 top-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live
            </span>
            <span className="font-mono-spec absolute bottom-8 right-8 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] backdrop-blur">18k Yellow · Vieux-Port</span>
          </div>
        </div>
      </div>
    </section>
  )
}
