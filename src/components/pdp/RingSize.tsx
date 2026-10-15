import { useEffect, useState } from 'react'
import { Ruler, X } from 'lucide-react'

// North American ring sizes with inside diameter / circumference in mm.
export const RING_SIZES: [string, number, number][] = [
  ['4', 14.9, 46.8], ['4.5', 15.3, 48.0], ['5', 15.7, 49.3], ['5.5', 16.1, 50.6], ['6', 16.5, 51.9],
  ['6.5', 16.9, 53.1], ['7', 17.3, 54.4], ['7.5', 17.7, 55.7], ['8', 18.1, 57.0], ['8.5', 18.5, 58.3], ['9', 19.0, 59.5],
]

export default function RingSize({ value, onChange, error, step }: { value?: string; onChange: (s: string) => void; error?: boolean; step?: string }) {
  const [guide, setGuide] = useState(false)

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
          {step && <span className="font-mono-spec mr-3 text-[10px] text-[var(--gold-vermeil)]">{step}</span>}
          Ring size {value ? <span className="normal-case tracking-normal text-[var(--text-taupe)]">— {value}</span> : error && '— please select'}
        </legend>
        <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--gold-vermeil)]">
          <Ruler size={14} strokeWidth={1.3} /> Size guide
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {RING_SIZES.map(([s]) => (
          <button
            type="button"
            key={s}
            onClick={() => onChange(s)}
            className={`font-mono-spec border py-2.5 text-xs transition-colors ${value === s ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-linen)]">One complimentary resize within the first year.</p>

      {guide && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[var(--bg-vault)]/50 p-4" onClick={() => setGuide(false)}>
          <div role="dialog" aria-modal="true" aria-label="Ring size guide" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-[var(--bg-travertine)] p-8 lg:p-12" data-lenis-prevent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Guide des tailles</p>
                <h3 className="font-serif-editorial mt-3 text-4xl font-light">Finding your size</h3>
              </div>
              <button onClick={() => setGuide(false)} aria-label="Close"><X size={20} strokeWidth={1.3} /></button>
            </div>
            <ol className="mt-8 grid gap-6 text-sm text-[var(--text-taupe)] sm:grid-cols-3">
              <li><span className="font-mono-spec text-[var(--gold-vermeil)]">01</span><br />Wrap a thin strip of paper around the base of your finger.</li>
              <li><span className="font-mono-spec text-[var(--gold-vermeil)]">02</span><br />Mark where it overlaps and measure the length in millimetres.</li>
              <li><span className="font-mono-spec text-[var(--gold-vermeil)]">03</span><br />Match the circumference below. Between sizes? Choose the larger.</li>
            </ol>
            <table className="font-mono-spec mt-10 w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-linen)]">
                <tr className="border-b border-[var(--border-hairline)]"><th className="py-3">CA / US</th><th>Diameter</th><th>Circumference</th></tr>
              </thead>
              <tbody>
                {RING_SIZES.map(([s, d, c]) => (
                  <tr key={s} className={`border-b border-[var(--border-hairline)] ${value === s ? 'text-[var(--gold-vermeil)]' : ''}`}>
                    <td className="py-2.5">{s}</td><td>{d.toFixed(1)} mm</td><td>{c.toFixed(1)} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-8 text-sm text-[var(--text-taupe)]">Prefer certainty? We’ll mail a complimentary ring sizer anywhere in Canada or the U.S., or size you in our salon.</p>
          </div>
        </div>
      )}
    </fieldset>
  )
}
