import { formatNumber, getLang } from '../i18n'

// Canadian sales tax by province (GST/HST + PST/QST), 2024 rates.
export const PROVINCES: Record<string, { name: string; rate: number; label: string }> = {
  QC: { name: 'Québec', rate: 0.14975, label: 'GST 5% + QST 9.975%' },
  ON: { name: 'Ontario', rate: 0.13, label: 'HST 13%' },
  BC: { name: 'British Columbia', rate: 0.12, label: 'GST 5% + PST 7%' },
  AB: { name: 'Alberta', rate: 0.05, label: 'GST 5%' },
  MB: { name: 'Manitoba', rate: 0.12, label: 'GST 5% + PST 7%' },
  SK: { name: 'Saskatchewan', rate: 0.11, label: 'GST 5% + PST 6%' },
  NS: { name: 'Nova Scotia', rate: 0.14, label: 'HST 14%' },
  NB: { name: 'New Brunswick', rate: 0.15, label: 'HST 15%' },
  NL: { name: 'Newfoundland & Labrador', rate: 0.15, label: 'HST 15%' },
  PE: { name: 'Prince Edward Island', rate: 0.15, label: 'HST 15%' },
}

export const US_STATES = ['New York', 'California', 'Florida', 'Illinois', 'Massachusetts', 'Texas', 'Vermont', 'Washington', 'Other']

// Names as the visitor reads them. Shopify's checkout names these itself; the theme only labels its own estimates.
const PROVINCE_FR: Record<string, string> = { QC: 'Québec', ON: 'Ontario', BC: 'Colombie-Britannique', AB: 'Alberta', MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nouvelle-Écosse', NB: 'Nouveau-Brunswick', NL: 'Terre-Neuve-et-Labrador', PE: 'Île-du-Prince-Édouard' }
const TAX_FR: Record<string, string> = { GST: 'TPS', QST: 'TVQ', HST: 'TVH', PST: 'TVP' }
const STATE_FR: Record<string, string> = { California: 'Californie', Florida: 'Floride', Other: 'Autre' }

/** A province's name in the visitor's language. */
export const provinceName = (code: string) => (getLang() === 'fr' ? PROVINCE_FR[code] : undefined) ?? PROVINCES[code]?.name ?? code
/** A tax's short name in the visitor's language (GST → TPS, QST → TVQ, HST → TVH, PST → TVP). */
export const taxName = (name: string) => (getLang() === 'fr' ? TAX_FR[name] : undefined) ?? name
/** A state's name in the visitor's language. */
export const stateName = (state: string) => (getLang() === 'fr' ? STATE_FR[state] : undefined) ?? state
/** A province's tax line as the visitor reads it: "GST 5% + QST 9.975%", "TPS 5 % + TVQ 9,975 %". */
export const taxLabel = (code: string) =>
  (PROVINCES[code]?.label ?? '').replace(/([A-Z]+)\s*([\d.]+)%/g, (_, name: string, rate: string) => `${taxName(name)} ${formatNumber(Number(rate) / 100, { style: 'percent', maximumFractionDigits: 3 })}`)
