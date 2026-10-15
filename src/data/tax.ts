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
