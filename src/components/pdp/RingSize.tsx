import { useEffect, useState } from 'react'
import { Ruler, X } from 'lucide-react'
import { bilingual, formatNumber, useCopy } from '../../i18n'

// North American ring sizes with inside diameter / circumference in mm.
export const RING_SIZES: [string, number, number][] = [
  ['4', 14.9, 46.8], ['4.5', 15.3, 48.0], ['5', 15.7, 49.3], ['5.5', 16.1, 50.6], ['6', 16.5, 51.9],
  ['6.5', 16.9, 53.1], ['7', 17.3, 54.4], ['7.5', 17.7, 55.7], ['8', 18.1, 57.0], ['8.5', 18.5, 58.3], ['9', 19.0, 59.5],
]

const COPY = bilingual(
  {
    ringSize: 'Ring size',
    pleaseSelect: '— please select',
    guide: 'Size guide',
    resize: 'One complimentary resize within the first year.',
    dialog: 'Ring size guide',
    eyebrow: 'Guide des tailles',
    title: 'Finding your size',
    close: 'Close',
    steps: ['Wrap a thin strip of paper around the base of your finger.', 'Mark where it overlaps and measure the length in millimetres.', 'Match the circumference below. Between sizes? Choose the larger.'],
    head: ['CA / US', 'Diameter', 'Circumference'],
    sizer: 'Prefer certainty? We’ll mail a complimentary ring sizer anywhere in Canada or the U.S., or size you in our salon.',
  },
  {
    ringSize: 'Taille de bague',
    pleaseSelect: '— veuillez choisir',
    guide: 'Guide des tailles',
    resize: 'Un ajustement de taille offert la première année.',
    dialog: 'Guide des tailles de bague',
    eyebrow: 'Guide des tailles',
    title: 'Trouver votre taille',
    close: 'Fermer',
    steps: ['Enroulez une fine bande de papier autour de la base de votre doigt.', 'Marquez l’endroit où elle se chevauche et mesurez la longueur en millimètres.', 'Trouvez la circonférence correspondante ci-dessous. Entre deux tailles? Choisissez la plus grande.'],
    head: ['CA / É.-U.', 'Diamètre', 'Circonférence'],
    sizer: 'Vous préférez être certain? Nous vous postons gratuitement un baguier partout au Canada ou aux États-Unis, ou prenons votre taille au salon.',
  },
)

/** A ring size as the visitor writes numbers (6.5 → 6,5 in French); the stored value stays as the catalog writes it. */
export const sizeLabel = (s: string) => formatNumber(Number(s), { maximumFractionDigits: 1 })

export default function RingSize({ value, onChange, error, step }: { value?: string; onChange: (s: string) => void; error?: boolean; step?: string }) {
  const t = useCopy(COPY)
  const [guide, setGuide] = useState(false)
  const mm = (n: number) => `${formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm`

  useEffect(() => {
    if (!guide) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setGuide(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guide])

  return (
    <fieldset>
      <div className="mb-4 flex items-center justify-between">
        <legend className={`text-[11px] uppercase tracking-[0.22em] ${error ? 'text-red-700' : ''}`}>
          {step && <span className="font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]">{step}</span>}
          {t.ringSize} {value ? <span className="normal-case tracking-normal text-[var(--text-taupe)]">— {sizeLabel(value)}</span> : error && t.pleaseSelect}
        </legend>
        <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--gold-vermeil)]">
          <Ruler size={14} strokeWidth={1.3} /> {t.guide}
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {RING_SIZES.map(([s]) => (
          <button
            type="button"
            key={s}
            onClick={() => onChange(s)}
            aria-pressed={value === s}
            className={`font-spec border py-2.5 text-xs transition-colors ${value === s ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
          >
            {sizeLabel(s)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-linen)]">{t.resize}</p>

      {guide && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--bg-vault)]/50 p-4" onClick={() => setGuide(false)}>
          <div role="dialog" aria-modal="true" aria-label={t.dialog} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[var(--bg-travertine)] p-8 lg:p-12" data-lenis-prevent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">{t.eyebrow}</p>
                <h3 className="font-serif-editorial mt-3 text-4xl font-light">{t.title}</h3>
              </div>
              <button onClick={() => setGuide(false)} aria-label={t.close}><X size={20} strokeWidth={1.3} /></button>
            </div>
            <ol className="mt-8 grid gap-6 text-sm text-[var(--text-taupe)] sm:grid-cols-3">
              {t.steps.map((s, i) => (
                <li key={i}><span className="font-spec text-[var(--gold-vermeil)]">0{i + 1}</span><br />{s}</li>
              ))}
            </ol>
            <table className="font-spec mt-10 w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">
                <tr className="border-b border-[var(--border-hairline)]"><th className="py-3">{t.head[0]}</th><th>{t.head[1]}</th><th>{t.head[2]}</th></tr>
              </thead>
              <tbody>
                {RING_SIZES.map(([s, d, c]) => (
                  <tr key={s} className={`border-b border-[var(--border-hairline)] ${value === s ? 'text-[var(--gold-vermeil)]' : ''}`}>
                    <td className="py-2.5">{sizeLabel(s)}</td><td>{mm(d)}</td><td>{mm(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-8 text-sm text-[var(--text-taupe)]">{t.sizer}</p>
          </div>
        </div>
      )}
    </fieldset>
  )
}
