import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { VisitRequest } from '../../data/visits'
import { bilingual, useCopy } from '../../i18n'
import { rich } from '../../i18n/rich'
import { useStore } from '../../store'
import { getLenis } from '../SmoothScroll'
import VisitFlow from './VisitFlow'

const COPY = bilingual(
  { label: 'Book a private visit', eyebrow: 'Private visit · Montréal', title: 'Book a <em>visit</em>', intro: 'A velvet tray, an espresso, and as much time as you need. We’ll have your pieces ready.', close: 'Close' },
  { label: 'Prendre rendez-vous pour une visite privée', eyebrow: 'Visite privée · Montréal', title: 'Prendre <em>rendez-vous</em>', intro: 'Un plateau de velours, un espresso et tout le temps qu’il vous faut. Vos pièces vous attendront.', close: 'Fermer' },
)

/** The booking drawer, opened from anywhere with the store's `openVisit(request)`: the header's "Book a visit", a piece's
 *  page, the bag, the wishlist… Each opening starts a fresh flow with what it was opened with. */
export default function VisitDrawer() {
  const { visitRequest, closeVisit } = useStore()
  const t = useCopy(COPY)
  const [open, setOpen] = useState(false)
  // The request on screen: it stays while the drawer slides away, so the panel never empties mid-exit.
  const [shown, setShown] = useState<VisitRequest | null>(null)
  const [round, setRound] = useState(0)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)

  // Slide in a frame after mounting the request, so the first opening animates too; each request is a new round.
  useEffect(() => {
    if (!visitRequest) {
      setOpen(false)
      return
    }
    opener.current = document.activeElement
    setShown(visitRequest)
    setRound((r) => r + 1)
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [visitRequest])

  // Lock the page, focus the panel, close on Escape or when the visitor moves to another page.
  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focus = window.setTimeout(() => closeBtn.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeVisit()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', closeVisit)
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
      window.clearTimeout(focus)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', closeVisit)
      if (opener.current instanceof HTMLElement && document.contains(opener.current)) opener.current.focus({ preventScroll: true })
    }
  }, [open, closeVisit])

  return (
    <>
      <div onClick={closeVisit} aria-hidden className={`fixed inset-0 z-[80] bg-[var(--bg-vault)]/45 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label={t.label} aria-hidden={!open} inert={!open} className={`fixed right-0 top-0 z-[90] flex h-full w-full max-w-[540px] flex-col bg-[var(--bg-travertine)] shadow-[-24px_0_60px_-30px_rgba(40,30,20,0.35)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="border-b border-[var(--border-hairline)] px-7 pb-6 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]">{t.eyebrow}</p>
              <h2 className="font-serif-editorial mt-3 text-[2.15rem] font-light leading-none sm:text-4xl">{rich(t.title, 'whitespace-nowrap text-[var(--gold-vermeil)]')}</h2>
            </div>
            <button ref={closeBtn} type="button" onClick={closeVisit} aria-label={t.close} className="-mr-2 p-2 transition-transform hover:rotate-90"><X size={20} strokeWidth={1.4} /></button>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-taupe)]">{t.intro}</p>
        </header>
        <div className="flex-1 overflow-y-auto px-7 pt-8" data-lenis-prevent>
          {shown && <VisitFlow key={round} request={shown} onClose={closeVisit} />}
        </div>
      </aside>
    </>
  )
}
