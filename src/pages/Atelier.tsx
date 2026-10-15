import { useRef, useState } from 'react'
import { IMG } from '../data/catalog'
import useReveal from '../components/useReveal'
import ShoppableVideos from '../components/video/ShoppableVideos'
import { VIDEOS } from '../data/media'

const steps = [
  ['Consultation', 'An unhurried conversation in our salon or by video, with sketches made in front of you.'],
  ['Stone sourcing', 'We present a curated selection of GIA-certified diamonds and coloured gems.'],
  ['CAD & wax', 'Precise 3D renders, then a wax model you can try on before we cast.'],
  ['Hand-finishing', 'Cast, set and polished at our bench on rue Sherbrooke, then hallmarked.'],
]

export default function Atelier() {
  const root = useRef<HTMLDivElement>(null)
  const [sent, setSent] = useState(false)
  useReveal(root)

  return (
    <div ref={root}>
      <section className="mx-auto grid max-w-[1600px] gap-12 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
        <div className="lg:col-span-6">
          <p data-reveal className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">L'Atelier · Since 1962</p>
          <h1 data-reveal="0.05" className="font-serif-editorial mt-6 text-6xl font-light leading-[0.95] lg:text-[7.5rem]">
            Made <em className="text-[var(--gold-vermeil)]">for you</em>, by a family.
          </h1>
          <p data-reveal="0.1" className="mt-10 max-w-lg leading-relaxed text-[var(--text-taupe)]">
            Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden lg:col-span-5 lg:col-start-8">
          <img data-parallax src={IMG.ring2} alt="Hand-finished ring" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="bg-[var(--bg-silk)]">
        <ol className="mx-auto grid max-w-[1600px] gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} data-reveal={i * 0.08} className="bg-[var(--bg-silk)] p-10 lg:p-12">
              <span className="font-mono-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
              <h3 className="font-serif-editorial mt-6 text-3xl">{t}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-taupe)]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <ShoppableVideos
        videos={VIDEOS.filter((v) => v.handle === '@teresaandsons')}
        tone="dark"
        eyebrow="Inside the atelier"
        title={<>At the <em className="text-[var(--gold-champagne)]">bench</em></>}
      />

      <section className="mx-auto max-w-3xl px-6 py-28 lg:py-36">
        <h2 data-reveal className="font-serif-editorial text-center text-5xl lg:text-6xl">Book a private <em className="text-[var(--gold-vermeil)]">appointment</em></h2>
        {sent ? (
          <p className="font-serif-editorial mt-14 text-center text-2xl italic text-[var(--text-taupe)]">Merci. Our concierge will be in touch within one business day.</p>
        ) : (
          <form data-reveal="0.1" onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="mt-14 grid gap-8 sm:grid-cols-2">
            {['Full name', 'Email', 'Phone'].map((f) => (
              <label key={f} className="block">
                <span className="text-[11px] uppercase tracking-[0.22em]">{f}</span>
                <input required={f !== 'Phone'} type={f === 'Email' ? 'email' : 'text'} className="mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]" />
              </label>
            ))}
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.22em]">Interest</span>
              <select className="mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none">
                <option>Engagement ring</option>
                <option>Heirloom redesign</option>
                <option>Personalized piece</option>
                <option>Jewelry rental fitting</option>
                <option>Watch service</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em]">Tell us about your idea</span>
              <textarea rows={4} className="mt-2 w-full resize-none border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]" />
            </label>
            <button className="bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] sm:col-span-2">
              Request appointment
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
