// The house's buttons, as shared class recipes, so every page speaks one visual language. "Book a visit" carries the
// same weight as "Add to bag": paired, they are the same size, one filled and one in outline.

const base = 'inline-flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors duration-500'

/** The primary action: espresso fill, vermeil on hover. */
export const btnPrimary = `${base} bg-[var(--text-espresso)] px-8 py-4 text-[var(--bg-travertine)] hover:bg-[var(--gold-vermeil)]`

/** A visit: the primary's size and weight, in outline. */
export const btnVisit = `${base} border border-[var(--text-espresso)] px-8 py-[15px] text-[var(--text-espresso)] hover:bg-[var(--text-espresso)] hover:text-[var(--bg-travertine)]`

/** A quieter action: a hairline outline. */
export const btnQuiet = 'inline-flex items-center justify-center gap-2 border border-[var(--border-hairline)] px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-[var(--text-espresso)]'

/** The primary on dark grounds: a champagne fill. */
export const btnOnDark = `${base} bg-[var(--gold-champagne)] px-8 py-4 text-[var(--bg-vault)] hover:bg-[var(--bg-travertine)]`

/** A visit on dark grounds: a white outline that turns champagne. */
export const btnVisitOnDark = `${base} border border-white/35 px-8 py-[15px] text-[var(--bg-travertine)] hover:border-[var(--gold-champagne)] hover:text-[var(--gold-champagne)]`

/** Eyebrow over a section or a card. */
export const eyebrow = 'font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-ink)]'
