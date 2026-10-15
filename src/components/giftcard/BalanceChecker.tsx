import { useState } from 'react'
import { Search } from 'lucide-react'
import { formatPrice } from '../../data/catalog'
import { formatCode, isCodeFormat, lookupCard, maskCode, type IssuedCard } from '../../data/giftcards'

export default function BalanceChecker({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
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
        Gift card number
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
          className="font-mono-spec min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm uppercase tracking-[0.16em] outline-none placeholder:normal-case placeholder:tracking-[0.16em] placeholder:opacity-40"
        />
        <button className={`flex items-center gap-2 px-5 text-[10px] font-medium uppercase tracking-[0.2em] ${dark ? 'bg-[var(--gold-champagne)] text-[var(--bg-vault)]' : 'bg-[var(--text-espresso)] text-[var(--bg-travertine)]'}`}>
          <Search size={13} strokeWidth={1.5} /> Check
        </button>
      </div>
      <p className={`mt-3 min-h-5 text-sm ${dark ? 'text-white/70' : 'text-[var(--text-taupe)]'}`} aria-live="polite">
        {result === 'invalid' && <span className="text-red-600">Gift card numbers have 16 letters and digits.</span>}
        {result === 'notfound' && <span className="text-red-600">We couldn’t find that card. Check the number, or contact our concierge.</span>}
        {result && typeof result === 'object' && (
          <>
            <span className={dark ? 'text-white' : 'text-[var(--text-espresso)]'}>{formatPrice(result.balance, result.currency)} {result.currency}</span> remaining on {maskCode(result.code)}
            {result.balance < result.initial && <> · originally {formatPrice(result.initial, result.currency)}</>}
            {' · '}{result.expiresAt ? `expires ${result.expiresAt}` : 'never expires'}
          </>
        )}
      </p>
      <p className={`text-xs ${dark ? 'text-white/40' : 'text-[var(--text-linen)]'}`}>Demo card: TERE SASO NS19 62MT</p>
    </form>
  )
}
