import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLocale, type Lang } from '../../i18n'
import { onStageClear } from '../../lib/stage'
import { useStore, type LangOrigin } from '../../store'

interface Note {
  /** The language the note is written in: the one it offers, or the visitor's own. */
  lang: Lang
  text: string
  /** The suggested language, and the way to keep the one on screen. Each is labelled in the language it leads to. */
  go: { label: string; lang: Lang }
  stay: { label: string; lang: Lang }
}

const KEEP: Record<Lang, string> = { en: 'Continue in English', fr: 'Continuer en français' }

/** What to say, if anything, about the language the visit opened in. */
function noteFor(lang: Lang, origin: LangOrigin): Note | null {
  // The browser asked for French, so the site opened in French: say so, and offer English.
  if (origin.source === 'browser' && lang === 'fr') {
    return { lang: 'fr', text: 'Le site s’affiche en français, selon la langue de votre navigateur.', go: { label: 'View in English', lang: 'en' }, stay: { label: KEEP.fr, lang: 'fr' } }
  }
  // A bilingual browser that prefers English: offer French, in French.
  if ((origin.source === 'browser' || origin.source === 'default') && lang === 'en' && origin.both) {
    return { lang: 'fr', text: 'Ce site est aussi offert en français.', go: { label: 'Passer au français', lang: 'fr' }, stay: { label: KEEP.en, lang: 'en' } }
  }
  // A link opened the site in the visitor's other language: offer theirs, in theirs.
  const own = origin.stored ?? origin.browser
  if (origin.source === 'url' && own && own !== lang) {
    return own === 'en'
      ? { lang: 'en', text: 'This page opened in French, as its link asked.', go: { label: 'View in English', lang: 'en' }, stay: { label: KEEP.fr, lang: 'fr' } }
      : { lang: 'fr', text: 'Cette page s’est ouverte en anglais, comme le demandait son lien.', go: { label: 'Voir en français', lang: 'fr' }, stay: { label: KEEP.en, lang: 'en' } }
  }
  return null
}

const SHOW_AFTER = 1400
const HIDE_AFTER = 16000

/** A one-time word about the language, the way a Canadian site greets a bilingual visitor: when the browser chose
 *  French, when a bilingual browser might prefer French, or when a link opened the other language. It waits for the
 *  splash and the hero, speaks in the language it offers, and goes for good once answered, dismissed or ignored. */
export default function LanguageNotice() {
  const { langOrigin, langHintSeen, dismissLangHint } = useStore()
  const { lang, setLang } = useLocale()
  // Decided once, from how the visit opened: a later switch answers it rather than changing it.
  const [note] = useState(() => (langHintSeen ? null : noteFor(lang, langOrigin)))
  const [shown, setShown] = useState(false)
  const held = useRef(false)

  useEffect(() => {
    if (!note) return
    let t = 0
    const cancel = onStageClear(() => {
      t = window.setTimeout(() => setShown(true), SHOW_AFTER)
    })
    return () => {
      cancel()
      window.clearTimeout(t)
    }
  }, [note])

  // It leaves on its own after a while, unless the pointer or focus is on it.
  useEffect(() => {
    if (!shown || langHintSeen) return
    let t = 0
    const arm = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => (held.current ? arm() : dismissLangHint()), HIDE_AFTER)
    }
    arm()
    return () => window.clearTimeout(t)
  }, [shown, langHintSeen, dismissLangHint])

  if (!note) return null
  const visible = shown && !langHintSeen

  return (
    <aside
      lang={note.lang}
      aria-label="Langue · Language"
      data-fab-avoid
      inert={!visible}
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onFocus={() => (held.current = true)}
      onBlur={() => (held.current = false)}
      className={`fixed inset-x-4 bottom-4 z-[45] border border-white/10 bg-[var(--bg-vault)] p-5 pr-12 text-[var(--bg-travertine)] shadow-[0_30px_60px_-30px_rgba(20,19,17,0.55)] transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-[400px] ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-champagne)]">{note.lang === 'fr' ? 'Langue · Language' : 'Language · Langue'}</p>
      <p aria-live="polite" className="font-serif-editorial mt-3 text-[19px] font-light leading-snug">{visible ? note.text : ''}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" lang={note.go.lang} onClick={() => setLang(note.go.lang)} className="bg-[var(--gold-champagne)] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--bg-vault)] transition-colors hover:bg-[var(--bg-travertine)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-champagne)]">
          {note.go.label}
        </button>
        <button type="button" lang={note.stay.lang} onClick={dismissLangHint} className="text-[11px] uppercase tracking-[0.22em] text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-champagne)]">
          {note.stay.label}
        </button>
      </div>
      <button type="button" onClick={dismissLangHint} aria-label="Fermer · Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--gold-champagne)]">
        <X size={16} strokeWidth={1.4} />
      </button>
    </aside>
  )
}
