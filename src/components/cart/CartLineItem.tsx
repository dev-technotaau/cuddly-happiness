import { Heart, Minus, Pencil, Plus, X } from 'lucide-react'
import { getProduct, personalizationPrice, priceFor } from '../../data/catalog'
import { RING_COPY } from '../../data/ringCopy'
import { designDeposit } from '../../data/ringPrice'
import { bilingual, useCopy } from '../../i18n'
import { useCatalog } from '../../i18n/catalog'
import { COMMON } from '../../i18n/common'
import { href, useStore, type CartLine } from '../../store'
import { designedLine, lineDetails } from '../lineDetails'
import GiftCardArt from '../giftcard/GiftCardArt'
import Price from '../Price'
import TryOnButton from '../tryon/TryOnButton'

interface Props {
  line: CartLine
  variant?: 'drawer' | 'page'
  onNavigate?: () => void
}

const COPY = bilingual(
  {
    rental: 'Rental',
    giftCard: 'Gift card',
    remove: (name: string) => `Remove ${name}`,
    edit: 'Edit',
    later: 'Save for later',
    less: 'Decrease quantity',
    more: 'Increase quantity',
    each: 'each',
  },
  {
    rental: 'Location',
    giftCard: 'Carte-cadeau',
    remove: (name) => `Retirer ${name}`,
    edit: 'Modifier',
    later: 'Garder pour plus tard',
    less: 'Diminuer la quantité',
    more: 'Augmenter la quantité',
    each: 'l’unité',
  },
)

export default function CartLineItem({ line, variant = 'drawer', onNavigate }: Props) {
  const { updateQty, removeLine, linePrice, toggleWishlist, isWished, currency, designs, saveDesign } = useStore()
  const t = useCopy(COPY)
  const common = useCopy(COMMON)
  const ring = useCopy(RING_COPY)
  const catalog = useCatalog()
  const p = getProduct(line.slug)
  if (!p) return null
  // A ring from the designer shows as designed, and edits back in the designer.
  const designed = designedLine(line, designs)
  const name = designed ? designed.title : catalog.name(p)
  const page = variant === 'page'
  // A design opens in the designer to change, and "Update the bag" replaces this line.
  const productHref = line.giftCard ? href.giftcards : line.design ? href.designer({ r: line.design, edit: '1' }) : href.product(p.slug)
  const unit = linePrice(line) / line.qty
  const fullPrice = !line.giftCard && !line.rental && !line.design ? priceFor(p, currency, line.metal) + personalizationPrice(p, line.personalization, currency) : unit
  const details = lineDetails(line, p)
  const iconBtn = 'flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-taupe)] transition-colors hover:text-[var(--text-espresso)]'

  const media = line.giftCard ? (
    <div className={`${page ? 'w-40' : 'w-24'} shrink-0 pt-1`}>
      <GiftCardArt design={line.giftCard.design} currency={line.giftCard.currency} amount={line.giftCard.amount} to={line.giftCard.recipientName} />
    </div>
  ) : (
    <a href={productHref} onClick={onNavigate} className={`group block shrink-0 overflow-hidden bg-[var(--bg-silk)] ${page ? 'h-44 w-36' : 'h-32 w-24'}`}>
      <img src={designed?.image || p.images[0]} alt={name} className="editorial-zoom h-full w-full object-cover" />
    </a>
  )

  return (
    <li className={`flex gap-5 ${page ? 'py-8' : 'py-6'}`}>
      {media}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-spec text-[9px] uppercase tracking-[0.22em] text-[var(--text-taupe)]">{line.rental ? t.rental : line.giftCard ? t.giftCard : designed ? ring.designed : catalog.product(p).collection}</p>
            <a href={productHref} onClick={onNavigate} className={`font-serif-editorial mt-1 block leading-tight transition-colors hover:text-[var(--gold-vermeil)] ${page ? 'text-3xl' : 'text-xl'}`}>
              {name}
            </a>
          </div>
          <button onClick={() => removeLine(line.key)} aria-label={t.remove(name)} className="shrink-0 p-1 text-[var(--text-linen)] transition-colors hover:text-[var(--text-espresso)]">
            <X size={16} strokeWidth={1.3} />
          </button>
        </div>

        <ul className="mt-2 space-y-0.5">
          {details.map((d) => (
            <li key={d} className="font-spec text-[10px] uppercase tracking-[0.12em] text-[var(--text-taupe)]">{d}</li>
          ))}
        </ul>

        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${page ? 'mt-5' : 'mt-3'}`}>
          <a href={productHref} onClick={onNavigate} className={iconBtn}><Pencil size={11} strokeWidth={1.4} /> {t.edit}</a>
          {!line.giftCard && (
            <button
              onClick={() => {
                // A design is kept with the visitor's designs; a piece goes to the wishlist.
                if (designed) {
                  if (!designs.some((s) => s.code === line.design)) saveDesign({ code: line.design!, image: '', saved: new Date().toISOString() })
                } else if (!isWished(p.slug)) toggleWishlist(p.slug)
                removeLine(line.key)
              }}
              className={iconBtn}
            >
              <Heart size={11} strokeWidth={1.4} /> {t.later}
            </button>
          )}
          {!line.giftCard && !designed && <TryOnButton product={p} metal={line.metal} text={line.personalization?.text} variant="link" label={common.viewOnYou} className="!pb-0.5 !text-[10px] !tracking-[0.18em] text-[var(--text-taupe)]" />}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="flex items-center border border-[var(--border-hairline)]">
            <button
              onClick={() => (line.qty <= 1 ? removeLine(line.key) : updateQty(line.key, line.qty - 1))}
              aria-label={t.less}
              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[var(--bg-silk)]"
            >
              <Minus size={12} />
            </button>
            <span className="font-spec w-7 text-center text-xs" aria-live="polite">{line.qty}</span>
            <button onClick={() => updateQty(line.key, Math.min(10, line.qty + 1))} aria-label={t.more} className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-[var(--bg-silk)]">
              <Plus size={12} />
            </button>
          </div>
          <div className="text-right">
            <Price amount={linePrice(line)} className={page ? 'text-base' : 'text-sm'} />
            {line.qty > 1 && <p className="font-spec mt-0.5 text-[10px] text-[var(--text-taupe)]"><Price amount={unit} className="[&_span]:hidden" /> {t.each}</p>}
            {fullPrice !== unit && <p className="font-spec text-[10px] text-[var(--text-taupe)] line-through"><Price amount={fullPrice} className="[&_span]:hidden" /></p>}
            {/* A designed ring: its deposit today, the balance on approval of its design */}
            {line.design && <p className="font-spec mt-0.5 text-[10px] text-[var(--text-taupe)]"><Price amount={designDeposit(unit) * line.qty} className="[&_span]:hidden" /> {ring.today}</p>}
          </div>
        </div>
      </div>
    </li>
  )
}
