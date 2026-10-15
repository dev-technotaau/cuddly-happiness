import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

export default function Accordion({ items, defaultOpen, tone = 'light' }: { items: AccordionItem[]; defaultOpen?: string; tone?: 'light' | 'dark' }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null)
  const line = tone === 'dark' ? 'border-white/15' : 'border-[var(--border-hairline)]'
  return (
    <div className={`border-t ${line}`}>
      {items.map((it) => {
        const on = open === it.id
        return (
          <div key={it.id} className={`border-b ${line}`}>
            <button onClick={() => setOpen(on ? null : it.id)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-5 text-left">
              <span className="text-[11px] font-medium uppercase tracking-[0.22em]">{it.title}</span>
              <Plus size={16} strokeWidth={1.3} className={`shrink-0 transition-transform duration-500 ${on ? 'rotate-45 text-[var(--gold-vermeil)]' : ''}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="pb-6 text-sm leading-relaxed opacity-80">{it.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
