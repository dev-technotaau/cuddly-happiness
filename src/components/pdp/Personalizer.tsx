import type { CSSProperties } from 'react'
import { Sparkles } from 'lucide-react'
import {
  personalizationPrice,
  validatePersonalization,
  type Personalization,
  type PersonalizationFont,
  type Product,
} from '../../data/catalog'
import { useStore } from '../../store'
import Price from '../Price'

export const FONT_STYLES: Record<PersonalizationFont, { label: string; style: CSSProperties }> = {
  script: { label: 'Script', style: { fontFamily: "'Pinyon Script', cursive", letterSpacing: '0' } },
  serif: { label: 'Serif', style: { fontFamily: "'Baskervville', serif", fontStyle: 'italic', fontWeight: 500 } },
  block: { label: 'Block', style: { fontFamily: "'Jost', sans-serif", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em' } },
}

interface Props {
  product: Product
  value: Personalization
  onChange: (p: Personalization) => void
  step: string
  metalSwatch: string
  showError: boolean
}

function goldText(swatch: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, #fff8e6 0%, ${swatch} 38%, #8a6a32 62%, ${swatch} 85%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    filter: 'drop-shadow(0 1px 1px rgba(20,19,17,0.25))',
  }
}

function Preview({ product, value, swatch }: { product: Product; value: Personalization; swatch: string }) {
  const cfg = product.personalization!
  const fallback = cfg.kind === 'nameplate' ? 'Teresa' : cfg.kind === 'initial' ? 'T' : 'TMS'
  const text = value.text.trim() || fallback
  const font = FONT_STYLES[value.font].style
  const metal = `radial-gradient(circle at 35% 30%, #fffaf0 0%, ${swatch} 45%, #8a6a32 100%)`

  return (
    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#ffffff_0%,var(--bg-silk)_75%)]">
      {/* Chain */}
      {cfg.kind !== 'monogram' && (
        <svg className="absolute inset-x-0 top-0 h-full w-full" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden>
          <path d={cfg.kind === 'nameplate' ? 'M-10 10 Q 90 120 120 112 M280 112 Q 310 120 410 10' : 'M-10 10 Q 160 90 200 92 Q 240 90 410 10'} stroke={swatch} strokeWidth="1.4" strokeDasharray="3 2" fill="none" />
        </svg>
      )}

      {cfg.kind === 'nameplate' && (
        <div className="relative flex items-center gap-2 pt-6">
          <span className="whitespace-nowrap text-6xl leading-none" style={{ ...font, ...goldText(swatch), fontSize: value.font === 'block' ? '2.4rem' : undefined }}>
            {text}
          </span>
          {value.accent && <span className="mt-[-1.5rem] h-2.5 w-2.5 rotate-45 bg-white shadow-[0_0_10px_3px_rgba(255,255,255,0.95),0_0_0_1px_rgba(0,0,0,0.1)]" />}
        </div>
      )}

      {cfg.kind === 'initial' && (
        <div className="relative mt-12 flex h-28 w-28 items-center justify-center rounded-full shadow-[inset_0_-6px_12px_rgba(0,0,0,0.18),0_10px_24px_-8px_rgba(20,19,17,0.35)]" style={{ background: metal }}>
          <span className="absolute -top-3 h-4 w-4 rounded-full border-2" style={{ borderColor: swatch }} />
          <span className="text-6xl leading-none text-[#4a3a22]/75 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]" style={font}>
            {text.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {cfg.kind === 'monogram' && (
        <div className="relative flex h-36 w-44 items-center justify-center rounded-[50%] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),0_14px_30px_-10px_rgba(20,19,17,0.4)]" style={{ background: metal }}>
          <span className="absolute inset-3 rounded-[50%] border border-white/40" />
          <span className="text-5xl leading-none text-[#4a3a22]/75 [text-shadow:0_1px_0_rgba(255,255,255,0.6)]" style={{ ...font, fontSize: value.font === 'block' ? '1.9rem' : undefined }}>
            {text.toUpperCase()}
          </span>
        </div>
      )}

      <span className="font-spec absolute bottom-3 left-4 text-[9px] uppercase tracking-[0.24em] text-[var(--text-linen)]">Live preview</span>
      {value.chainLength && <span className="font-spec absolute bottom-3 right-4 text-[9px] uppercase tracking-[0.24em] text-[var(--text-linen)]">{value.chainLength} chain</span>}
    </div>
  )
}

export default function Personalizer({ product, value, onChange, step, metalSwatch, showError }: Props) {
  const { currency } = useStore()
  const cfg = product.personalization
  if (!cfg) return null
  const error = value.text ? validatePersonalization(cfg, value.text) : showError ? validatePersonalization(cfg, '') : null
  const label = 'text-[11px] uppercase tracking-[0.22em]'

  return (
    <fieldset>
      <legend className={`mb-4 flex w-full items-baseline justify-between gap-4 ${label} ${error && showError ? 'text-red-700' : ''}`}>
        <span>
          <span className="font-spec mr-3 text-[10px] text-[var(--gold-vermeil)]">{step}</span>
          Personalize <span className="normal-case tracking-normal text-[var(--text-linen)]">— {cfg.label.toLowerCase()}</span>
        </span>
      </legend>

      <div className="border border-[var(--border-hairline)]">
        <Preview product={product} value={value} swatch={metalSwatch} />

        <div className="space-y-6 border-t border-[var(--border-hairline)] p-5">
          {/* Text */}
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="personal-text" className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">{cfg.label}</label>
              <span className="font-spec text-[10px] text-[var(--text-linen)]">{value.text.length}/{cfg.maxLength}</span>
            </div>
            {cfg.kind === 'initial' ? (
              <div className="mt-3 grid grid-cols-9 gap-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
                  <button
                    type="button"
                    key={l}
                    onClick={() => onChange({ ...value, text: l })}
                    className={`h-9 border text-base transition-colors ${value.text === l ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
                    style={FONT_STYLES[value.font].style}
                  >
                    {l}
                  </button>
                ))}
              </div>
            ) : (
              <input
                id="personal-text"
                value={value.text}
                maxLength={cfg.maxLength}
                onChange={(e) => onChange({ ...value, text: cfg.kind === 'monogram' ? e.target.value.toUpperCase() : e.target.value })}
                placeholder={cfg.kind === 'nameplate' ? 'e.g. Sofia' : 'e.g. TMS'}
                autoComplete="off"
                className={`mt-2 w-full border bg-transparent px-4 py-3.5 text-lg outline-none transition-colors placeholder:text-[var(--text-linen)] ${error ? 'border-red-700/50' : 'border-[var(--border-hairline)] focus:border-[var(--text-espresso)]'}`}
                style={value.text ? FONT_STYLES[value.font].style : undefined}
              />
            )}
            <p className={`mt-2 text-xs ${error ? 'text-red-700' : 'text-[var(--text-linen)]'}`}>{error ?? cfg.hint}</p>
          </div>

          {/* Font */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">Lettering</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {cfg.fonts.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => onChange({ ...value, font: f })}
                  aria-pressed={value.font === f}
                  className={`border py-3 transition-colors ${value.font === f ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-linen)]'}`}
                >
                  <span className="block text-2xl leading-none" style={{ ...FONT_STYLES[f].style, fontSize: f === 'block' ? '0.95rem' : undefined }}>
                    {f === 'block' ? 'AA' : 'Aa'}
                  </span>
                  <span className="mt-1.5 block text-[9px] uppercase tracking-[0.2em]">{FONT_STYLES[f].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chain length */}
          {cfg.chainLengths && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-taupe)]">Chain length</p>
              <div className="mt-3 flex gap-1.5">
                {cfg.chainLengths.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => onChange({ ...value, chainLength: c })}
                    className={`font-spec flex-1 border py-2.5 text-xs transition-colors ${value.chainLength === c ? 'border-[var(--text-espresso)] bg-[var(--text-espresso)] text-[var(--bg-travertine)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-espresso)]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paid add-on */}
          {cfg.accent && (
            <label className="flex cursor-pointer items-center justify-between gap-4 border border-[var(--border-hairline)] px-4 py-3.5 transition-colors hover:border-[var(--text-linen)]">
              <span className="flex items-center gap-3">
                <input type="checkbox" checked={!!value.accent} onChange={(e) => onChange({ ...value, accent: e.target.checked })} className="h-4 w-4 accent-[var(--text-espresso)]" />
                <Sparkles size={15} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" />
                <span className="text-[11px] uppercase tracking-[0.18em]">{cfg.accent.label}</span>
              </span>
              <span className="text-xs">+ <Price amount={personalizationPrice(product, { ...value, accent: true }, currency)} /></span>
            </label>
          )}

          <p className="border-t border-[var(--border-hairline)] pt-4 text-xs leading-relaxed text-[var(--text-taupe)]">
            A digital proof is emailed for your approval before we cut. Personalized pieces are final sale.
          </p>
        </div>
      </div>
    </fieldset>
  )
}

export function describePersonalization(p: Personalization): string {
  return [`“${p.text.trim()}”`, FONT_STYLES[p.font].label, p.chainLength, p.accent && 'Diamond accent'].filter(Boolean).join(' · ')
}
