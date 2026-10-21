import { useState } from 'react'
import { Search } from 'lucide-react'
import { formatPrice } from '../../data/catalog'
import { formatCode, isCodeFormat, lookupCard, maskCode, type IssuedCard } from '../../data/giftcards'
import { bilingual, useCopy } from '../../i18n'

const COPY = bilingual(
  {
    number: 'Gift card number',
    check: 'Check',
    invalid: 'Gift card numbers have 16 letters and digits.',
    notFound: 'We couldn’t find that card. Check the number, or ask a jeweller.',
    remaining: (card: string) => ` remaining on ${card}`,
    originally: (amount: string) => ` · originally ${amount}`,
    expires: (date: string) => `expires ${date}`,
    never: 'never expires',
    demo: 'Demo card:',
  },
  {
    number: 'Numéro de carte-cadeau',
    check: 'Vérifier',
    invalid: 'Les numéros de carte-cadeau comptent 16 lettres et chiffres.',
    notFound: 'Nous ne trouvons pas cette carte. Vérifiez le numéro ou parlez à un joaillier.',
    remaining: (card) => ` restants sur ${card}`,
    originally: (amount) => ` · montant initial ${amount}`,
    expires: (date) => `expire le ${date}`,
    never: 'sans expiration',
    demo: 'Carte de démonstration :',
  },
)

export default function BalanceChecker({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const t = useCopy(COPY)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<IssuedCard | null | 'invalid' | 'notfound'>(null)
  const dark = tone === 'dark'

  const check = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCodeFormat(code)) return setResult('invalid')
    setResult(lookupCard(code) ?? 'notfound')
  }

  return (
    <form onSubmit={check}>
      <label className={`text-[10px] uppercase tracking-[0.22em] ${dark ? 'text-white/50' : 'text-[var(--text-taupe)]'}`} htmlFor="gc-balance">
        {t.number}
      </label>
      <div className={`mt-2 flex border ${dark ? 'border-white/20' : 'border-[var(--border-hairline)]'}`}>
        <input
          id="gc-balance"
          value={formatCode(code)}
          onChange={(e) => {
            setCode(e.target.value)
            setResult(null)
          }}
          maxLength={19}
          placeholder="XXXX XXXX XXXX XXXX"
          autoComplete="off"
          spellCheck={false}
          className="font-spec min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm uppercase tracking-[0.16em] outline-none placeholder:normal-case placeholder:tracking-[0.16em] placeholder:opacity-60"
        />
        <button className={`flex items-center gap-2 px-5 text-[10px] font-medium uppercase tracking-[0.2em] ${dark ? 'bg-[var(--gold-champagne)] text-[var(--bg-vault)]' : 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]'}`}>
          <Search size={13} strokeWidth={1.5} /> {t.check}
        </button>
      </div>
      <p className={`mt-3 min-h-5 text-sm ${dark ? 'text-white/70' : 'text-[var(--text-taupe)]'}`} aria-live="polite">
        {result === 'invalid' && <span className="text-red-700">{t.invalid}</span>}
        {result === 'notfound' && <span className="text-red-700">{t.notFound}</span>}
        {result && typeof result === 'object' && (
          <>
            <span className={dark ? 'text-white' : 'text-[var(--text-espresso)]'}>{formatPrice(result.balance, result.currency)} {result.currency}</span>{t.remaining(maskCode(result.code))}
            {result.balance < result.initial && t.originally(formatPrice(result.initial, result.currency))}
            {' · '}{result.expiresAt ? t.expires(result.expiresAt) : t.never}
          </>
        )}
      </p>
      <p className={`text-xs ${dark ? 'text-white/60' : 'text-[var(--text-taupe)]'}`}>{t.demo} TERE SASO NS19 62MT</p>
    </form>
  )
}
