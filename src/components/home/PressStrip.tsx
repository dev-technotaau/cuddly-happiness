import Marquee from '../Marquee'

const PRESS = ['Vogue', 'ELLE Québec', 'The Globe and Mail', 'Harper’s Bazaar', 'La Presse', 'Town & Country', 'Montreal Gazette', 'Brides']

export default function PressStrip() {
  return (
    <section className="border-b border-[var(--border-hairline)] py-10" aria-label="As seen in">
      <div className="mx-auto flex max-w-[1600px] items-center gap-10 px-6 lg:px-12">
        <p className="font-spec shrink-0 text-[10px] uppercase tracking-[0.3em] text-[var(--text-linen)]">As seen in</p>
        <Marquee speed={34} className="relative min-w-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          {PRESS.map((p) => (
            <span key={p} className="font-serif-editorial whitespace-nowrap px-10 text-3xl italic text-[var(--text-taupe)]">{p}</span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
