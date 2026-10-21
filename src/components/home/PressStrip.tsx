import { bilingual, useCopy } from '../../i18n'
import Marquee from '../Marquee'

const PRESS = ['Vogue', 'ELLE Québec', 'The Globe and Mail', 'Harper’s Bazaar', 'La Presse', 'Town & Country', 'Montreal Gazette', 'Brides']

const COPY = bilingual({ seen: 'As seen in' }, { seen: 'Vu dans' })

export default function PressStrip() {
  const t = useCopy(COPY)
  return (
    <section className="border-b border-[var(--border-hairline)] py-10" aria-label={t.seen}>
      <div className="mx-auto flex max-w-[1600px] items-center gap-10 px-6 lg:px-12">
        <p className="font-spec shrink-0 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">{t.seen}</p>
        <Marquee speed={34} className="relative min-w-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          {PRESS.map((p) => (
            <span key={p} className="font-serif-editorial whitespace-nowrap px-10 text-3xl italic text-[var(--text-taupe)]">{p}</span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
