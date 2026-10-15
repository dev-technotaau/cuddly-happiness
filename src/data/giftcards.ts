// Gift cards, modelled on Shopify's native gift card product:
// one product with a variant per denomination, recipient details carried as line item properties,
// and 16-character codes redeemed at checkout.

import { CAD_TO_USD, type Currency } from './catalog'

export const GIFT_CARD_SLUG = 'gift-card'

export const DENOMINATIONS: Record<Currency, number[]> = {
  CAD: [100, 250, 500, 1000, 2500, 5000],
  USD: [100, 250, 500, 1000, 2500, 5000],
}

export const CUSTOM_RANGE: Record<Currency, [number, number]> = { CAD: [50, 10000], USD: [50, 7500] }

export interface GiftCardDesign {
  id: string
  name: string
  background: string
  ink: string
  accent: string
}

export const DESIGNS: GiftCardDesign[] = [
  { id: 'travertine', name: 'Travertine', background: 'linear-gradient(135deg,#FBF9F5 0%,#EDE6D8 55%,#E2D7C2 100%)', ink: '#141311', accent: '#B89047' },
  { id: 'espresso', name: 'Espresso', background: 'linear-gradient(135deg,#1e1b18 0%,#121110 60%,#2a2520 100%)', ink: '#FBF9F5', accent: '#D4B982' },
  { id: 'vermeil', name: 'Vermeil', background: 'linear-gradient(135deg,#e8d3a3 0%,#c9a45f 40%,#9c7a3c 75%,#d4b982 100%)', ink: '#141311', accent: '#FBF9F5' },
  { id: 'mont-royal', name: 'Mont-Royal', background: 'linear-gradient(160deg,#2f3a33 0%,#1d2420 60%,#3b463d 100%)', ink: '#F3EFE6', accent: '#D4B982' },
]

export type GiftDelivery = 'email' | 'physical'

/** Line item payload for a gift card; maps 1:1 to Shopify gift card recipient properties. */
export interface GiftCardLine {
  amount: number
  currency: Currency
  design: string
  delivery: GiftDelivery
  toSelf: boolean
  recipientName?: string
  recipientEmail?: string
  senderName?: string
  message?: string
  sendOn?: string // yyyy-mm-dd
}

export const convert = (amount: number, from: Currency, to: Currency) =>
  from === to ? amount : to === 'USD' ? Math.round(amount * CAD_TO_USD) : Math.round(amount / CAD_TO_USD)

// Codes: 16 characters, Shopify style, without ambiguous characters.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const formatCode = (s: string) => normalizeCode(s).replace(/(.{4})(?=.)/g, '$1 ')
export const maskCode = (s: string) => `•••• •••• •••• ${normalizeCode(s).slice(-4)}`
export const isCodeFormat = (s: string) => /^[A-Z0-9]{16}$/.test(normalizeCode(s))

// Local ledger standing in for Shopify's gift card balances.
export interface IssuedCard {
  code: string
  initial: number
  balance: number
  currency: Currency
  design: string
  recipientName?: string
  issuedAt: string
  expiresAt: string | null // Québec & most provinces: no expiry
}

const LEDGER_KEY = 'tns-giftcard-ledger'

const DEMO: IssuedCard = {
  code: 'TERESASONS1962MT',
  initial: 250,
  balance: 250,
  currency: 'CAD',
  design: 'travertine',
  recipientName: 'Demo card',
  issuedAt: '2024-01-01',
  expiresAt: null,
}

export function loadLedger(): IssuedCard[] {
  try {
    const list = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]') as IssuedCard[]
    return list.some((c) => c.code === DEMO.code) ? list : [DEMO, ...list]
  } catch {
    return [DEMO]
  }
}

export function saveLedger(list: IssuedCard[]) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(list))
}

export function lookupCard(code: string): IssuedCard | null {
  const c = normalizeCode(code)
  return loadLedger().find((x) => x.code === c) ?? null
}

export function issueCards(lines: GiftCardLine[], qtys: number[]): IssuedCard[] {
  const ledger = loadLedger()
  const issued: IssuedCard[] = []
  lines.forEach((l, i) => {
    for (let n = 0; n < qtys[i]; n++) {
      issued.push({
        code: generateCode(),
        initial: l.amount,
        balance: l.amount,
        currency: l.currency,
        design: l.design,
        recipientName: l.toSelf ? undefined : l.recipientName,
        issuedAt: new Date().toISOString().slice(0, 10),
        expiresAt: null,
      })
    }
  })
  saveLedger([...ledger, ...issued])
  return issued
}

/** Deducts applied amounts (in checkout currency) from card balances. */
export function debitCards(applied: { code: string; amount: number; currency: Currency }[]) {
  const ledger = loadLedger()
  for (const a of applied) {
    const card = ledger.find((c) => c.code === a.code)
    if (card) card.balance = Math.max(0, card.balance - convert(a.amount, a.currency, card.currency))
  }
  saveLedger(ledger)
}
