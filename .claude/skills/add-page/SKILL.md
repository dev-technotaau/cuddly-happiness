---
name: add-page
description: Add a new top-level page or route to the hash router (e.g. #/journal, #/stores, #/care) with navigation links, following the store and App patterns. Use when asked to create a new page, route or URL.
argument-hint: "[route-name]"
---

# Add a page / route

Background: `.claude/docs/architecture.md` (routing section) and `.claude/rules/routing-and-state.md`.

## 1. Router: five places, change them together

In `src/store.tsx`:
1. **Route union:** add `| { name: 'journal' }`, or `| { name: 'journal'; slug: string }` for a parameterised route.
2. **`parseHash`:** add `if (parts[0] === 'journal') return { name: 'journal' }` *before* the final `return { name: 'home' }`. Keep the `#/p/gift-card` alias above the generic `p/<slug>` rule.
3. **`href`:** add `journal: '#/journal'`, or `journal: (slug: string) => \`#/journal/${slug}\``.

In `src/App.tsx`:

4. **`Routes`:** import the page and add `case 'journal': return <Journal />`. Slug routes need `return <Journal key={route.slug} slug={route.slug} />` so state resets per slug.
5. **`headFor`:** add `case 'journal': return named('Journal')`, which gives the tab title "Journal — Teresa & Sons" and the site description. For a slug route, look the item up and pass its name and description, with a "… not found" fallback, as the `category` and `product` cases do.

## 2. The page component

Create `src/pages/Journal.tsx` with a default export and the house layout:

```tsx
import { useRef } from 'react'
import { href } from '../store'
import useReveal from '../components/useReveal'

export default function Journal() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  return (
    <div ref={root}>
      <section className="mx-auto max-w-[1600px] px-6 py-20 lg:px-12 lg:py-28">
        <p data-reveal className="font-spec text-[10px] uppercase tracking-[0.3em] text-[var(--gold-vermeil)]">Le journal</p>
        <h1 data-reveal="0.05" className="font-serif-editorial mt-6 text-6xl font-light leading-[0.95] lg:text-[7.5rem]">
          Notes from the <em className="text-[var(--gold-vermeil)]">bench</em>
        </h1>
        <p data-reveal="0.1" className="mt-10 max-w-lg leading-relaxed text-[var(--text-taupe)]">…</p>
        <a href={href.atelier} className="link-line mt-10">Book an appointment</a>
      </section>
    </div>
  )
}
```

- Use exactly one `h1` per page. Use `SectionHeader` for the sections below it.
- Keep hooks above any early return, such as a not-found state for unknown slugs.
- The scroll-to-top on navigation is automatic (`SmoothScroll`).

## 3. Links

- **Header** (`src/components/Header.tsx`): add the page to the desktop nav (`text-[11px] font-medium uppercase tracking-[0.22em]` links) and to the mobile menu list (italic serif `text-3xl` rows).
- **Footer** (`src/components/Footer.tsx`): add it to the right column (Shop, Maison or Salon).
- Always link with `href.journal`. Never write a literal `'#/journal'`.

## 4. Verify and document

1. Run `npx tsc --noEmit -p .`. `noFallthroughCasesInSwitch` is on.
2. Run skill `verify-changes`. Open `#/journal` directly (deep link), from the nav, and with an unknown sub-slug if the route takes one.
3. Run skill `update-knowledge-base`:
   - Add the route to the sitemap in `.claude/docs/product-overview.md` and to the routing table in `architecture.md`.
   - Add a PURPOSE line to `.claude/scripts/kb-index.mjs`, plus a `DOC_RULES` entry if it gets its own doc.
