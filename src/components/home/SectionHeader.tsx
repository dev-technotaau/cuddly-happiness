import type { ReactNode } from 'react'

interface Props {
  index: string
  eyebrow: string
  title: ReactNode
  aside?: ReactNode
  tone?: 'light' | 'dark'
}

/** Shared editorial header: numbered eyebrow on a hairline rule, large serif title, optional right-hand slot. */
export default function SectionHeader({ index, eyebrow, title, aside, tone = 'light' }: Props) {
  const rule = tone === 'dark' ? 'bg-white/15' : 'bg-[var(--border-hairline)]'
  const accent = tone === 'dark' ? 'text-[var(--gold-champagne)]' : 'text-[var(--gold-ink)]'
  const muted = tone === 'dark' ? 'text-white/45' : 'text-[var(--text-taupe)]'
  return (
    <header className="mb-14 lg:mb-20">
      <div data-reveal className={`font-spec flex items-center gap-5 text-[10px] uppercase tracking-[0.3em] ${muted}`}>
        <span className={accent}>{index}</span>
        <span className={`h-px flex-1 ${rule}`} />
        <span>{eyebrow}</span>
      </div>
      <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <h2 data-reveal="0.05" className="font-serif-editorial max-w-3xl text-[2.75rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]">
          {title}
        </h2>
        {aside && <div data-reveal="0.1" className="shrink-0">{aside}</div>}
      </div>
    </header>
  )
}
