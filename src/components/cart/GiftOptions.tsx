import { useState } from 'react'
import { ChevronDown, Gift, NotebookPen, Receipt } from 'lucide-react'
import { useStore } from '../../store'

const MAX = 200

export default function GiftOptions({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { meta, setMeta } = useStore()
  const [noteOpen, setNoteOpen] = useState(defaultOpen || !!meta.note)

  const toggle = (on: boolean, label: string, desc: string, Icon: typeof Gift, onChange: (v: boolean) => void) => (
    <label className={`flex cursor-pointer items-start gap-4 border px-4 py-3.5 transition-colors ${on ? 'border-[var(--text-espresso)]' : 'border-[var(--border-hairline)] hover:border-[var(--text-linen)]'}`}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--text-espresso)]" />
      <Icon size={16} strokeWidth={1.3} className="mt-0.5 shrink-0 text-[var(--gold-vermeil)]" />
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.18em]">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--text-linen)]">{desc}</span>
      </span>
      <span className="font-spec ml-auto shrink-0 text-[10px] uppercase tracking-[0.16em] text-[var(--gold-vermeil)]">Free</span>
    </label>
  )

  return (
    <div className="space-y-2">
      {toggle(meta.giftWrap, 'Gift wrapping', 'Travertine box, silk ribbon, handwritten card', Gift, (v) => setMeta({ giftWrap: v }))}
      {meta.giftWrap && (
        <div className="pb-2">
          <textarea
            value={meta.giftMessage}
            onChange={(e) => setMeta({ giftMessage: e.target.value.slice(0, MAX) })}
            rows={3}
            placeholder="Your message, handwritten by our team"
            aria-label="Gift message"
            className="font-serif-editorial w-full resize-none border border-[var(--border-hairline)] bg-transparent px-4 py-3 text-lg italic outline-none placeholder:not-italic placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]"
          />
          <p className="font-spec mt-1 text-right text-[10px] text-[var(--text-linen)]">{meta.giftMessage.length}/{MAX}</p>
        </div>
      )}
      {toggle(meta.giftReceipt, 'Gift receipt', 'Prices hidden on the packing slip', Receipt, (v) => setMeta({ giftReceipt: v }))}

      <div className="pt-2">
        <button onClick={() => setNoteOpen((o) => !o)} aria-expanded={noteOpen} className="flex w-full items-center gap-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-taupe)] hover:text-[var(--text-espresso)]">
          <NotebookPen size={14} strokeWidth={1.3} className="text-[var(--gold-vermeil)]" /> Order note
          <ChevronDown size={14} strokeWidth={1.3} className={`ml-auto transition-transform ${noteOpen ? 'rotate-180' : ''}`} />
        </button>
        {noteOpen && (
          <textarea
            value={meta.note}
            onChange={(e) => setMeta({ note: e.target.value.slice(0, 500) })}
            rows={3}
            placeholder="Delivery instructions, a surprise to keep, anything we should know"
            aria-label="Order note"
            className="mt-2 w-full resize-none border border-[var(--border-hairline)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--text-linen)] focus:border-[var(--text-espresso)]"
          />
        )}
      </div>
    </div>
  )
}
