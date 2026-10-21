// The catalog in the visitor's language. Products keep their English data in catalog.ts (the try-on, media and costing
// heuristics read the English names); everything a visitor reads comes through here instead.
import { CATEGORIES, METALS, TYPE_LABELS, getCategory, type Category, type CategorySlug, type GiaSpec, type Metal, type Product, type ProductType } from '../data/catalog'
import { BADGE_FR, CATEGORY_FR, DESIGN_FR, GIA_FR, METAL_FR, PRODUCT_FR, SPEC_LABEL_FR, TYPE_FR, VIDEO_FR } from '../data/catalog.fr'
import { DESIGNS } from '../data/giftcards'
import type { ShoppableVideo } from '../data/media'
import { getLocale, useLocale, type Locale } from './index'
import { toUS } from './us'

export type Badge = NonNullable<Product['badges']>[number]

export interface ProductCopy {
  name: string
  tagline: string
  description: string
  collection: string
  /** Spec rows as [label, value], in the catalog's order. */
  specs: [string, string][]
}

export interface CategoryCopy {
  name: string
  /** The italic accent beside the name: the French name in English, the chapter's own line in French. */
  accent: string
  description: string
  /** The roman numeral of the chapter. */
  numeral: string
}

/** Inches as French writes them (16 in → 16 po). */
const inches = (s: string) => s.replace(/(\d)\s?in\b/g, '$1 po')

export interface CatalogCopy {
  product: (p: Product) => ProductCopy
  /** The display name of a piece; shorthand for `product(p).name`. */
  name: (p: Product) => string
  /** One spec value, by its English label in catalog.ts (`spec(p, 'Case')`). */
  spec: (p: Product, key: string) => string | undefined
  category: (c: Category | CategorySlug) => CategoryCopy
  metal: (m: Metal) => string
  /** A piece type, plural (`Engagement rings`), for filters. */
  type: (t: ProductType) => string
  badge: (b: Badge) => string
  /** A GIA report value (shape or cut grade). */
  gia: (value: string) => string
  /** A carat weight, with the locale's decimal mark (1.82 → 1,82). */
  carat: (gia: GiaSpec) => string
  /** The personalization labels for a piece, in this language. */
  personalization: (p: Product) => { label: string; hint: string; accent: string }
  /** A length or size picked from a list (`16 in`). */
  unit: (value: string) => string
  /** A gift-card design name. */
  design: (id: string) => string
  /** A film's title and caption. */
  video: (v: ShoppableVideo) => { title: string; caption: string }
}

function build(locale: Locale): CatalogCopy {
  const fr = locale === 'fr-CA'
  const us = locale === 'en-US'
  const en = (s: string) => (us ? toUS(s) : s)
  const products = new Map<string, ProductCopy>()

  const product = (p: Product): ProductCopy => {
    const hit = products.get(p.slug)
    if (hit) return hit
    const t = fr ? PRODUCT_FR[p.slug] : undefined
    const copy: ProductCopy = t
      ? { name: t.name, tagline: t.tagline, description: t.description, collection: t.collection ?? p.collection, specs: Object.entries(p.specs).map(([k, v]) => [SPEC_LABEL_FR[k] ?? k, t.specs[k] ?? v]) }
      : { name: en(p.name), tagline: en(p.tagline), description: en(p.description), collection: en(p.collection), specs: Object.entries(p.specs).map(([k, v]) => [en(k === 'Color' ? 'Colour' : k), en(v)]) }
    products.set(p.slug, copy)
    return copy
  }

  return {
    product,
    name: (p) => product(p).name,
    spec: (p, key) => {
      const at = Object.keys(p.specs).indexOf(key)
      return at < 0 ? undefined : product(p).specs[at][1]
    },
    category: (c) => {
      const cat = typeof c === 'string' ? getCategory(c) ?? CATEGORIES[0] : c
      if (fr) return { ...CATEGORY_FR[cat.slug], numeral: cat.eyebrow }
      return { name: en(cat.name), accent: cat.french, description: en(cat.description), numeral: cat.eyebrow }
    },
    metal: (m) => (fr ? METAL_FR[m] : METALS[m].label),
    type: (t) => (fr ? TYPE_FR[t] : en(TYPE_LABELS[t])),
    badge: (b) => (fr ? BADGE_FR[b] : b),
    gia: (value) => (fr ? GIA_FR[value] ?? value : value),
    carat: (gia) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(gia.carat),
    personalization: (p) => {
      const cfg = p.personalization
      const t = fr ? PRODUCT_FR[p.slug]?.personalization : undefined
      return { label: t?.label ?? en(cfg?.label ?? ''), hint: t?.hint ?? en(cfg?.hint ?? ''), accent: t?.accent ?? en(cfg?.accent?.label ?? '') }
    },
    unit: (value) => (fr ? inches(value) : value),
    design: (id) => (fr ? DESIGN_FR[id] : undefined) ?? DESIGNS.find((d) => d.id === id)?.name ?? id,
    video: (v) => (fr ? VIDEO_FR[v.id] : undefined) ?? { title: en(v.title), caption: en(v.caption) },
  }
}

const built = new Map<Locale, CatalogCopy>()

/** The catalog copy for a locale (the one on screen by default). */
export function catalogFor(locale: Locale = getLocale()): CatalogCopy {
  let c = built.get(locale)
  if (!c) built.set(locale, (c = build(locale)))
  return c
}

/** The catalog copy in the visitor's language; the component re-renders when it changes. */
export function useCatalog() {
  return catalogFor(useLocale().locale)
}
