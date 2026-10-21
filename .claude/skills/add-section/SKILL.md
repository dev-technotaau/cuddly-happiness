---
name: add-section
description: Add an editorial section to the Home page, a lower section to the product page (PDP), or a category-specific band, using SectionHeader, data-reveal and the design tokens. Use when asked to add a block, section, module or band to an existing page.
argument-hint: "[home|pdp|category] [section idea]"
---

# Add a section to Home, the PDP or a category page

Background: `.claude/docs/pages/home.md` (section order), `.claude/docs/pages/product.md` (`sectionOrder` numbering) and `.claude/rules/design-system.md`.

## Home

1. Create `src/components/home/<Name>.tsx` as a default export, wrapped in `<section className="mx-auto max-w-[1600px] px-6 py-28 lg:px-12 lg:py-36">`. Dark variant: put `bg-[var(--bg-vault)] text-[var(--bg-travertine)]` on a full-width wrapper and pass `SectionHeader tone="dark"`.
2. Open with the section header:

   ```tsx
   const COPY = bilingual({ eyebrow: 'The atelier', title: 'Made <em>by hand</em>', visit: 'Visit' }, { eyebrow: 'L’atelier', title: 'Fait <em>à la main</em>', visit: 'Visiter' })
   // in the component: const t = useCopy(COPY)
   <SectionHeader index="07" eyebrow={t.eyebrow} title={rich(t.title, 'text-[var(--gold-vermeil)]')} aside={<a href={href.atelier} className="link-line">{t.visit}</a>} />
   ```

   Keep the index numbers sequential with the neighbouring sections in `src/pages/Home.tsx`.
3. Animate with attributes, not new GSAP code. `data-reveal="0.1"` sets the stagger delay in seconds, `data-reveal-img` does a clip-path wipe, and `data-parallax` goes on an image inside an `overflow-hidden` box. Home's `useReveal(root)` picks them up automatically.
4. Insert the component in `src/pages/Home.tsx` at the right position in the section stack.

## PDP lower section

1. Create `src/components/pdp/<Name>.tsx` with props `{ product: Product; index: string }`. Return `null` when there is nothing to show.
2. Use `SectionHeader index={index} eyebrow=… title=… aside=…`, which gives you `data-reveal`.
3. In `src/pages/Product.tsx`:
   - Add the section id to `sectionOrder`, under **exactly** the condition your component uses to return null. The 01/02/… numbering must not get gaps.
   - Render the component at the same position with `index={num('<id>')}`.
4. If it needs a scroll target, give it a stable DOM id and scroll with `getLenis()?.scrollTo(el, { offset: -120 })`. Never use `href="#id"`.

## Category band

Place it between the hero and the products in `src/pages/Category.tsx`, gated by `slug === '<slug>'`:
- Shell: `border-b border-[var(--border-hairline)] bg-[var(--bg-silk)]`.
- Inner: `mx-auto max-w-[1600px] px-6 py-12 lg:px-12`.

Category copy itself belongs in `CATEGORIES` (`src/data/catalog.ts`), not in the page.

## Always

- **Visual rules:** tokens only, square corners, hairline borders, lucide icons with `strokeWidth={1.3}`, and an italic gold accent word in serif headlines.
- **Links** come from `href.*`. **Money** goes through `<Price />`. **Copy** follows skill `write-brand-copy`, in both languages (`bilingual()` + `useCopy()`); catalog text through `useCatalog()`.
- **Verify:** skill `verify-changes` at 375 px and 1440 px. Optionally have the `design-reviewer` agent review the diff.
- **Docs:** skill `update-knowledge-base` (the section order in `pages/home.md` or the section table in `pages/product.md`).
