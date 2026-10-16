import { DESIGNS, formatCode } from '../../data/giftcards'
import { formatPrice, type Currency } from '../../data/catalog'

interface Props {
  design: string
  amount?: number
  currency: Currency
  to?: string
  code?: string
  className?: string
}

/** Credit-card proportioned artwork (ISO 7810 ID-1, 85.6 × 54 mm). */
export default function GiftCardArt({ design, amount, currency, to, code, className = '' }: Props) {
  const d = DESIGNS.find((x) => x.id === design) ?? DESIGNS[0]
  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-[4%/6.3%] shadow-[0_30px_60px_-30px_rgba(20,19,17,0.55)] ${className}`}
      style={{ background: d.background, color: d.ink, containerType: 'inline-size' }}
    >
      {/* Engraved guilloche lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <ellipse key={i} cx="250" cy="40" rx={30 + i * 14} ry={18 + i * 9} fill="none" stroke={d.accent} strokeWidth="0.6" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-[7cqi]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-serif-editorial text-[5.6cqi] uppercase leading-none tracking-[0.14em]">
              Teresa <em style={{ color: d.accent }}>&amp;</em> Sons
            </p>
            <p className="font-spec mt-[1.5cqi] text-[2.4cqi] uppercase tracking-[0.35em] opacity-70">Carte-cadeau · Montréal</p>
          </div>
          <span className="h-[7cqi] w-[10cqi] rounded-[1cqi] opacity-80" style={{ background: `linear-gradient(135deg, ${d.accent}, #fff6, ${d.accent})` }} aria-hidden />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {to && <p className="font-serif-editorial truncate text-[4.6cqi] italic opacity-85">For {to}</p>}
            <p className="font-spec mt-[1cqi] text-[3cqi] tracking-[0.2em] opacity-70">{code ? formatCode(code) : '•••• •••• •••• ••••'}</p>
          </div>
          <p className="font-serif-editorial shrink-0 text-[10cqi] font-light leading-none">
            {amount ? formatPrice(amount, currency) : '—'}
            <span className="font-spec ml-[1cqi] text-[2.6cqi] align-top opacity-60">{currency}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
