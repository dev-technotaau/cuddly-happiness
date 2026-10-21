import { LANGS, LANGUAGE, useLocale } from '../../i18n'

interface Props {
  /** `dark` for the footer and other vault surfaces. */
  tone?: 'light' | 'dark'
  /** Full names (English · Français) instead of EN · FR. */
  full?: boolean
  className?: string
}

/** The two languages side by side, each named in its own words and tagged with its own `lang`, so a visitor who
 *  can't read the page can still find theirs. One press switches (see LanguageVeil). */
export default function LanguageToggle({ tone = 'light', full = false, className = '' }: Props) {
  const { lang, setLang } = useLocale()
  const dark = tone === 'dark'
  return (
    <div role="group" aria-label={lang === 'fr' ? 'Langue' : 'Language'} className={`font-spec flex border text-[10px] tracking-[0.15em] ${dark ? 'border-white/20' : 'border-[var(--border-hairline)]'} ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={full ? undefined : LANGUAGE[l].name}
          className={`whitespace-nowrap px-2.5 py-1.5 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 ${full ? 'normal-case tracking-[0.06em] text-[11px]' : ''} ${
            lang === l
              ? dark ? 'bg-[var(--gold-champagne)] text-[var(--bg-vault)] focus-visible:outline-[var(--bg-vault)]' : 'bg-[var(--text-espresso)] text-[var(--bg-travertine)] focus-visible:outline-[var(--gold-champagne)]'
              : dark ? 'text-white/60 hover:text-white focus-visible:outline-[var(--gold-champagne)]' : 'text-[var(--text-taupe)] hover:text-[var(--text-espresso)] focus-visible:outline-[var(--gold-vermeil)]'
          }`}
        >
          {full ? LANGUAGE[l].name : LANGUAGE[l].short}
        </button>
      ))}
    </div>
  )
}
