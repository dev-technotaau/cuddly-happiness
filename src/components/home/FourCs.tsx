import { useState } from 'react'
import { IMG } from '../../data/catalog'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { href } from '../../store'

// Where the house standard sits on each scale, by position.
const OURS: [number, number][] = [[3, 4], [4, 7], [3, 7], [0, 6]]

const COPY = bilingual(
  {
    cs: [
      { key: 'Cut', title: 'Cut — the fire', body: 'Cut determines how a diamond returns light. We only set stones graded Excellent or Very Good by the GIA, then hand-check each for symmetry.', scale: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
      { key: 'Colour', title: 'Colour — the purity', body: 'Graded from D (colourless) to Z. Our bridal stones begin at G, where a diamond appears icy-white to the eye.', scale: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'] },
      { key: 'Clarity', title: 'Clarity — the character', body: 'Inclusions are nature’s fingerprints. We select VS2 or better, so nothing is visible without a 10× loupe.', scale: ['I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF'] },
      { key: 'Carat', title: 'Carat — the presence', body: 'Weight, not size. A well-cut 1.00 ct can look larger than a poorly cut 1.20 ct — which is why we prioritize cut first.', scale: ['0.30', '0.50', '0.75', '1.00', '1.50', '2.00', '3.00+'] },
    ],
    eyebrow: 'Diamond Education',
    title: 'The <em>Four Cs</em>, explained by a jeweller.',
    alt: 'Diamond under loupe',
    standard: 'Teresa & Sons standard',
    shop: 'Shop certified diamonds',
    viewing: 'Book a diamond viewing',
  },
  {
    cs: [
      { key: 'Taille', title: 'La taille — le feu', body: 'La taille détermine la façon dont un diamant renvoie la lumière. Nous ne sertissons que des pierres classées Excellente ou Très bonne par le GIA, puis nous en vérifions la symétrie à la main.', scale: ['Faible', 'Passable', 'Bonne', 'Très bonne', 'Excellente'] },
      { key: 'Couleur', title: 'La couleur — la blancheur', body: 'Elle se classe de D (incolore) à Z. Nos pierres de mariage commencent à G, là où un diamant paraît d’un blanc glacé à l’œil nu.', scale: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'] },
      { key: 'Pureté', title: 'La pureté — le caractère', body: 'Les inclusions sont les empreintes de la nature. Nous choisissons VS2 ou mieux, si bien que rien n’est visible sans une loupe 10×.', scale: ['I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF'] },
      { key: 'Carat', title: 'Le carat — la présence', body: 'Un poids, pas une taille. Un 1,00 ct bien taillé peut sembler plus grand qu’un 1,20 ct mal taillé — c’est pourquoi la taille passe en premier.', scale: ['0,30', '0,50', '0,75', '1,00', '1,50', '2,00', '3,00+'] },
    ],
    eyebrow: 'Comprendre le diamant',
    title: 'Les <em>4 C</em>, expliqués par un joaillier.',
    alt: 'Diamant sous la loupe',
    standard: 'L’exigence Teresa & Sons',
    shop: 'Magasiner les diamants certifiés',
    viewing: 'Réserver une présentation de diamants',
  },
)

export default function FourCs() {
  const t = useCopy(COPY)
  const [active, setActive] = useState(0)
  const c = { ...t.cs[active], ours: OURS[active] }

  return (
    <section className="bg-[var(--bg-vault)] text-[var(--bg-travertine)]">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-6 py-28 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-5">
          <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]"><span className="mr-4 text-white/45">04</span>{t.eyebrow}</p>
          <h2 data-reveal="0.05" className="font-serif-editorial mt-6 text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[4.75rem]">
            {rich(t.title, 'text-[var(--gold-champagne)]')}
          </h2>
          <div data-reveal="0.1" className="relative mt-12 aspect-square overflow-hidden">
            <img src={IMG.ring1} alt={t.alt} loading="lazy" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif-editorial text-[clamp(5rem,9vw,9rem)] font-light italic text-white/90 mix-blend-overlay">{c.key}</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
          <div role="tablist" className="grid grid-cols-4 border-b border-white/15">
            {t.cs.map((x, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={`-mb-px border-b py-5 text-left transition-colors ${active === i ? 'border-[var(--gold-champagne)] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
              >
                <span className="font-spec block text-[10px] text-[var(--gold-champagne)]">0{i + 1}</span>
                <span className="font-serif-editorial mt-1 block text-[clamp(20px,2.2vw,30px)]">{x.key}</span>
              </button>
            ))}
          </div>
          <div key={active} className="pt-12">
            <h3 className="font-serif-editorial text-4xl">{c.title}</h3>
            <p className="mt-5 max-w-lg leading-relaxed text-white/70">{c.body}</p>

            <div className="mt-12">
              <div className="font-spec flex justify-between text-[10px] uppercase tracking-[0.12em] text-white/50">
                {c.scale.map((s, i) => (
                  <span key={s} className={i >= c.ours[0] && i <= c.ours[1] ? 'text-[var(--gold-champagne)]' : ''}>{s}</span>
                ))}
              </div>
              <div className="relative mt-3 h-1 bg-white/10">
                <span
                  className="absolute inset-y-0 bg-[var(--gold-champagne)] transition-all duration-700"
                  style={{
                    left: `${(c.ours[0] / (c.scale.length - 1)) * 100}%`,
                    right: `${100 - (c.ours[1] / (c.scale.length - 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="font-spec mt-4 text-[10px] uppercase tracking-[0.24em] text-white/50">
                <span className="mr-2 inline-block h-2 w-2 bg-[var(--gold-champagne)]" /> {t.standard}
              </p>
            </div>

            <div className="mt-14 flex flex-wrap gap-6">
              <a href={href.category('bridal')} className="bg-[var(--gold-champagne)] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] hover:bg-white">
                {t.shop}
              </a>
              <a href={href.atelier} className="border-b border-white/40 py-4 text-[11px] uppercase tracking-[0.24em] hover:border-[var(--gold-champagne)]">
                {t.viewing}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
