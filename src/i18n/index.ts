// Languages. The maison speaks English and French. English follows the visitor's market: Canadian English with CAD,
// US English with USD (spelling, dates, times). French is Canadian French in either market. UI copy lives next to the
// component that shows it, in both languages (`bilingual`); catalog copy lives in src/data/catalog.fr.ts.
import { createContext, useContext } from 'react'
import type { Currency } from '../data/catalog'
import { americanize } from './us'

export type Lang = 'en' | 'fr'
export type Locale = 'en-CA' | 'en-US' | 'fr-CA'

export const LANGS: Lang[] = ['en', 'fr']

/** How each language names itself. Switchers always show a language in its own words, with its own `lang`. */
export const LANGUAGE: Record<Lang, { name: string; short: string }> = {
  en: { name: 'English', short: 'EN' },
  fr: { name: 'Français', short: 'FR' },
}

/** The locale a language reads in for a market. */
export const localeFor = (lang: Lang, currency: Currency): Locale => (lang === 'fr' ? 'fr-CA' : currency === 'USD' ? 'en-US' : 'en-CA')

// The locale on screen, for code that runs outside React (formatters, page titles, transition cards). The store sets
// it before every render that changes it.
let active: Locale = 'en-CA'
export const getLocale = () => active
export const getLang = (): Lang => (active === 'fr-CA' ? 'fr' : 'en')
export function setActiveLocale(locale: Locale) {
  active = locale
}

/** Copy in both languages, as one object per language. US English is derived from the English on first use. */
export interface Copy<T> {
  readonly en: T
  readonly fr: T
  us?: T
}

/** Declares a component's copy. French must have exactly the shape of the English (every string, nothing extra), or
 *  the typecheck fails. Strings may carry one `<em>…</em>` accent (render them with `rich`); counts and names are
 *  functions, so each language words its own plurals. */
export function bilingual<T>(en: T, fr: NoInfer<T>): Copy<T> {
  return { en, fr }
}

/** The copy for a locale: the one on screen unless another is named. */
export function pick<T>(copy: Copy<T>, locale: Locale = active): T {
  if (locale === 'fr-CA') return copy.fr
  if (locale === 'en-US') return (copy.us ??= americanize(copy.en))
  return copy.en
}

export interface LocaleValue {
  lang: Lang
  locale: Locale
  /** Changes the language. The page stays where it is: a veil names the new language while the copy swaps under it. */
  setLang: (lang: Lang) => void
}

export const LocaleContext = createContext<LocaleValue | null>(null)

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside StoreProvider')
  return ctx
}

/** A component's copy in the visitor's language. The component re-renders when the language changes. */
export function useCopy<T>(copy: Copy<T>): T {
  return pick(copy, useLocale().locale)
}

// The language switch. LanguageVeil registers how a switch plays (a veil over the swap); until it has mounted, or
// under reduced motion, the copy swaps at once.
type Switcher = (to: Lang, apply: () => void) => void
let switcher: Switcher | null = null
export function registerSwitcher(s: Switcher | null) {
  switcher = s
}
export function runSwitch(to: Lang, apply: () => void) {
  if (switcher) switcher(to, apply)
  else apply()
}

/** The browser's preferred language of the two, and whether it lists the other one too (a bilingual visitor). */
export function browserLang(): { lang: Lang; both: boolean } | null {
  const list = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((l) => l.toLowerCase().split('-')[0])
  const first = list.find((l): l is Lang => l === 'en' || l === 'fr')
  if (!first) return null
  return { lang: first, both: list.includes(first === 'en' ? 'fr' : 'en') }
}

/** A number in the visitor's locale (1.82 → 1,82 in French). */
export const formatNumber = (n: number, opts?: Intl.NumberFormatOptions, locale: Locale = active) => new Intl.NumberFormat(locale, opts).format(n)

/** An hour of the salon day: 18h in Canadian English (as Montréal writes it), 6 PM in US English, 18 h in French. */
export function formatHour(hour: number, locale: Locale = active) {
  if (locale === 'en-US') return new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(new Date(2000, 0, 1, hour))
  return locale === 'fr-CA' ? `${hour} h` : `${hour}h`
}

/** "a, b and c" in the visitor's language (Intl.ListFormat is newer than this project's ES2020 target). */
export function formatList(items: string[], locale: Locale = active) {
  if (items.length < 2) return items.join('')
  const and = locale === 'fr-CA' ? ' et ' : locale === 'en-US' && items.length > 2 ? ', and ' : ' and '
  return `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`
}
