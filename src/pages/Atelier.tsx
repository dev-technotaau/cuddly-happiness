import { useRef, useState } from 'react'
import { IMG } from '../data/catalog'
import { bilingual, useCopy } from '../i18n'
import { rich } from '../i18n/rich'
import useReveal from '../components/useReveal'
import ShoppableVideos from '../components/video/ShoppableVideos'
import { VIDEOS } from '../data/media'

const COPY = bilingual(
  {
    steps: [
      ['Consultation', 'An unhurried conversation in our salon or by video, with sketches made in front of you.'],
      ['Stone sourcing', 'We present a curated selection of GIA-certified diamonds and coloured gems.'],
      ['CAD & wax', 'Precise 3D renders, then a wax model you can try on before we cast.'],
      ['Hand-finishing', 'Cast, set and polished at our bench on rue Sherbrooke, then hallmarked.'],
    ] as [string, string][],
    eyebrow: 'L’Atelier · Since 1962',
    title: 'Made <em>for you</em>, by a family.',
    story: 'Teresa Moretti opened a single bench on rue Sainte-Catherine in 1962. Today her sons and granddaughter continue the work — bespoke engagement rings, heirloom redesigns and personalized pieces, all made within these walls.',
    alt: 'Hand-finished ring',
    filmsEyebrow: 'Inside the atelier',
    filmsTitle: 'At the <em>bench</em>',
    book: 'Book a private <em>appointment</em>',
    sent: 'Merci. Our concierge will be in touch within one business day.',
    fields: { name: 'Full name', email: 'Email', phone: 'Phone' },
    interest: 'Interest',
    interests: ['Engagement ring', 'Heirloom redesign', 'Personalized piece', 'Jewellery rental fitting', 'Watch service'],
    idea: 'Tell us about your idea',
    request: 'Request appointment',
  },
  {
    steps: [
      ['Consultation', 'Une conversation sans hâte, au salon ou par vidéo, avec des croquis dessinés sous vos yeux.'],
      ['Choix des pierres', 'Nous vous présentons une sélection de diamants certifiés GIA et de pierres de couleur.'],
      ['3D et cire', 'Des rendus 3D précis, puis un modèle en cire à essayer avant la fonte.'],
      ['Finition à la main', 'Coulée, sertie et polie à notre établi de la rue Sherbrooke, puis poinçonnée.'],
    ],
    eyebrow: 'L’Atelier · Depuis 1962',
    title: 'Fait <em>pour vous</em>, par une famille.',
    story: 'Teresa Moretti ouvre un premier établi rue Sainte-Catherine en 1962. Aujourd’hui, ses fils et sa petite-fille poursuivent son œuvre — bagues de fiançailles sur mesure, bijoux de famille réinventés et pièces personnalisées, toutes façonnées entre ces murs.',
    alt: 'Bague finie à la main',
    filmsEyebrow: 'Dans l’atelier',
    filmsTitle: 'À l’<em>établi</em>',
    book: 'Prendre un <em>rendez-vous</em> privé',
    sent: 'Merci. Notre concierge vous joindra d’ici un jour ouvrable.',
    fields: { name: 'Nom complet', email: 'Courriel', phone: 'Téléphone' },
    interest: 'Votre projet',
    interests: ['Bague de fiançailles', 'Bijou de famille à réinventer', 'Pièce personnalisée', 'Essayage pour une location', 'Entretien de montre'],
    idea: 'Parlez-nous de votre idée',
    request: 'Demander un rendez-vous',
  },
)

export default function Atelier() {
  const root = useRef<HTMLDivElement>(null)
  const [sent, setSent] = useState(false)
  const t = useCopy(COPY)
  useReveal(root)

  return (
    <div ref={root}>
      <section className="mx-auto grid max-w-[1600px] gap-12 px-6 py-20 lg:grid-cols-12 lg:px-12 lg:py-28">
        <div className="lg:col-span-6">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.eyebrow}</p>
          <h1 data-reveal="0.05" className="font-serif-editorial mt-6 text-6xl font-light leading-[0.95] lg:text-[7.5rem]">
            {rich(t.title, 'text-[var(--gold-vermeil)]')}
          </h1>
          <p data-reveal="0.1" className="mt-10 max-w-lg leading-relaxed text-[var(--text-taupe)]">
            {t.story}
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden lg:col-span-5 lg:col-start-8">
          <img data-parallax src={IMG.ring2} alt={t.alt} className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="bg-[var(--bg-silk)]">
        <ol className="mx-auto grid max-w-[1600px] gap-px bg-[var(--border-hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map(([title, d], i) => (
            <li key={i} data-reveal={i * 0.08} className="bg-[var(--bg-silk)] p-10 lg:p-12">
              <span className="font-spec text-[10px] text-[var(--gold-vermeil)]">0{i + 1}</span>
              <h3 className="font-serif-editorial mt-6 text-3xl">{title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-taupe)]">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <ShoppableVideos
        videos={VIDEOS.filter((v) => v.handle === '@teresaandsons')}
        tone="dark"
        eyebrow={t.filmsEyebrow}
        title={rich(t.filmsTitle, 'text-[var(--gold-champagne)]')}
      />

      <section className="mx-auto max-w-3xl px-6 py-28 lg:py-36">
        <h2 data-reveal className="font-serif-editorial text-center text-5xl lg:text-6xl">{rich(t.book, 'text-[var(--gold-vermeil)]')}</h2>
        {sent ? (
          <p role="status" className="font-serif-editorial mt-14 text-center text-2xl italic text-[var(--text-taupe)]">{t.sent}</p>
        ) : (
          <form data-reveal="0.1" onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="mt-14 grid gap-8 sm:grid-cols-2">
            {(['name', 'email', 'phone'] as const).map((f) => (
              <label key={f} className="block">
                <span className="text-[11px] uppercase tracking-[0.22em]">{t.fields[f]}</span>
                <input required={f !== 'phone'} type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'} autoComplete={f === 'name' ? 'name' : f === 'email' ? 'email' : 'tel'} className="mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]" />
              </label>
            ))}
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.22em]">{t.interest}</span>
              <select className="mt-2 w-full border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none">
                {t.interests.map((o, i) => <option key={i} value={i}>{o}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] uppercase tracking-[0.22em]">{t.idea}</span>
              <textarea rows={4} className="mt-2 w-full resize-none border-b border-[var(--border-hairline)] bg-transparent py-2 outline-none focus:border-[var(--gold-vermeil)]" />
            </label>
            <button className="bg-[var(--text-espresso)] py-5 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--bg-travertine)] transition-colors hover:bg-[var(--gold-vermeil)] sm:col-span-2">
              {t.request}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
