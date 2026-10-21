import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import type { Currency } from '../../data/catalog'
import { bilingual, LANGS, LANGUAGE, useCopy, useLocale, type Lang, type Locale } from '../../i18n'
import { useStore } from '../../store'

const COPY = bilingual(
  {
    label: (now: string) => `Language and market: ${now}`,
    heading: 'Language · Langue',
    market: 'Market',
    country: { CAD: 'Canada', USD: 'United States' } as Record<Currency, string>,
    money: { CAD: 'Canadian dollars', USD: 'US dollars' } as Record<Currency, string>,
    variant: { 'en-CA': 'English (Canada)', 'en-US': 'English (United States)', 'fr-CA': 'Français (Canada)' } as Record<Locale, string>,
    summary: (variant: string, money: string) => `${variant}, prices in ${money}.`,
    keep: 'Your bag and wishlist stay as they are.',
  },
  {
    label: (now) => `Langue et marché : ${now}`,
    heading: 'Langue · Language',
    market: 'Marché',
    country: { CAD: 'Canada', USD: 'États-Unis' },
    money: { CAD: 'dollars canadiens', USD: 'dollars américains' },
    variant: { 'en-CA': 'English (Canada)', 'en-US': 'English (United States)', 'fr-CA': 'Français (Canada)' },
    summary: (variant, money) => `${variant}, prix en ${money}.`,
    keep: 'Votre panier et votre liste de souhaits restent intacts.',
  },
)

// Where each language is offered, in that language's own words.
const WHERE: Record<Lang, string> = { en: 'Canada · United States', fr: 'Canada' }

const row = (on: boolean) => `group flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[var(--gold-vermeil)] ${on ? 'bg-[var(--bg-silk)]' : 'hover:bg-[var(--bg-silk)]/60'}`

/** The header's language and market control: one compact button (EN · CAD) opening a small panel. Languages are
 *  named in their own words; markets set the currency, and the English shown with it (Canadian or US). The panel
 *  stays open through a switch, so the visitor sees it change language with the rest of the page. */
export default function LocaleMenu({ className = '' }: { className?: string }) {
  const { currency, setCurrency, route } = useStore()
  const { lang, locale, setLang } = useLocale()
  const t = useCopy(COPY)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const id = useId()

  useEffect(() => setOpen(false), [route])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={t.label(`${t.variant[locale]}, ${currency}`)}
        className={`font-spec flex h-8 items-center gap-1.5 border px-2.5 text-[10px] tracking-[0.15em] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-vermeil)] ${open ? 'border-[var(--text-espresso)] text-[var(--text-espresso)]' : 'border-[var(--border-hairline)] text-[var(--text-taupe)] hover:border-[var(--text-espresso)] hover:text-[var(--text-espresso)]'}`}
      >
        <Globe size={13} strokeWidth={1.3} aria-hidden="true" />
        <span lang={lang}>{LANGUAGE[lang].short}</span>
        <span aria-hidden="true" className="text-[var(--text-linen)]">·</span>
        <span>{currency}</span>
        <ChevronDown size={12} strokeWidth={1.4} aria-hidden="true" className={`transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        id={id}
        role="dialog"
        aria-label={t.heading}
        inert={!open}
        className={`absolute right-0 top-full mt-3 w-[300px] origin-top-right border border-[var(--border-hairline)] bg-[var(--bg-travertine)] shadow-[0_30px_60px_-32px_rgba(20,19,17,0.4)] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1.5 opacity-0'}`}
      >
        <p className="font-spec px-5 pb-2 pt-5 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.heading}</p>
        <div role="group" aria-label={t.heading}>
          {LANGS.map((l) => (
            <button key={l} type="button" lang={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={row(lang === l)}>
              <span className="flex flex-col">
                <span className="font-serif-editorial text-[19px] leading-tight">{LANGUAGE[l].name}</span>
                <span className="font-spec mt-0.5 text-[9px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{WHERE[l]}</span>
              </span>
              <Check size={14} strokeWidth={1.4} aria-hidden="true" className={`shrink-0 text-[var(--gold-vermeil)] transition-opacity ${lang === l ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        <p className="font-spec mt-2 border-t border-[var(--border-hairline)] px-5 pb-2 pt-4 text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.market}</p>
        <div role="group" aria-label={t.market}>
          {(['CAD', 'USD'] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCurrency(c)} aria-pressed={currency === c} className={row(currency === c)}>
              <span className="text-sm">{t.country[c]}</span>
              <span className="flex items-center gap-3">
                <span className="font-spec text-[10px] tracking-[0.15em] text-[var(--text-taupe)]">{c} $</span>
                <Check size={14} strokeWidth={1.4} aria-hidden="true" className={`shrink-0 text-[var(--gold-vermeil)] transition-opacity ${currency === c ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 border-t border-[var(--border-hairline)] px-5 py-4 text-xs leading-relaxed text-[var(--text-taupe)]">
          <p aria-live="polite">{t.summary(t.variant[locale], t.money[currency])}</p>
          <p className="mt-1 text-[var(--text-taupe)]">{t.keep}</p>
        </div>
      </div>
    </div>
  )
}
