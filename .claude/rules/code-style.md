---
paths:
  - "src/**/*.{ts,tsx}"
---

# Code style for `src/` (match the existing code exactly)

Full reference: `.claude/docs/code-conventions.md`.

## Formatting

- Single quotes, no semicolons, 2-space indentation, trailing commas in multi-line literals.
- Keep JSX attributes on one line. Long `className` strings stay unwrapped.
- A string containing an apostrophe uses the typographic `’` (`'Add the recipient’s name.'`) or double quotes (`"Boucles d'oreilles"`).
- Never run oxfmt or `pnpm run format`; format by hand.

## Modules

- Components are `export default function Name(…)`, one main component per PascalCase file. Hooks are `useX.ts` default exports. Context hooks and providers are named exports.
- Use relative imports with no extensions. Do not use the `@/` alias, which is unused.
- Import order: react → third-party → `../data/*` → `../store` → components.
- Use inline type specifiers: `import { priceFor, type Product } from '../data/catalog'`.
- React types such as `React.FormEvent` and `React.ReactNode` can be referenced without importing React.
- Never turn a component file into a re-export shim. When moving a file, update every import and delete the old file.

## Components & hooks

- Use function declarations, not arrow components.
- Small components type their props inline in the parameter; larger ones declare `interface Props`. Put defaults in the destructuring (`className = ''`), and append `className` last.
- Put every hook before any early `return`.
- Return `null` for empty states (as `RecentlyViewed`, `ShoppableVideos` and `TryOnButton` do).
- App-wide state comes only from `useStore()`, and try-on only from `useTryOn()`. Everything else is local `useState`. Use lazy initialisers for persisted or expensive values and functional updates for derived ones.
- Every effect cleans up after itself: listeners, timers, observers, `gsap.context().revert()`, media tracks, Lenis `start()`.
- GSAP code belongs in `useLayoutEffect` or `useEffect` with `gsap.context(…, scopeRef)`. Bail out when `matchMedia('(prefers-reduced-motion: reduce)')` matches. Register `ScrollTrigger` at module scope when you use it.
- Repeated UI is data-driven: map arrays or `as const` tuples instead of copy-pasting JSX.
- Keep local class-recipe constants (`const label = '…'`, `const choice = (on: boolean) => …`) when a component repeats a style.

## TypeScript

- Strict mode is on. Use string-literal unions, not enums. Prefer `Record`, `Omit`, `Partial` and `as const`.
- Type guards look like `.filter((p): p is Product => !!p)`. Use non-null `!` only after a guard.
- `lib` is ES2020. Avoid `replaceAll`, `.at()`, `Object.hasOwn`, `findLast` and `toSorted`.
- Run `npx tsc --noEmit -p .` after changes; it must stay at 0 errors.

## Styling in JSX

- Write Tailwind utilities inline. Build conditional classes with template literals and ternaries (no clsx).
- Use inline `style` only for runtime values: transforms, gradients, percentages and font families.

## Comments

- Comments are sparse. Use a one-line `/** … */` on exported components and helpers.
- Use `{/* Section */}` labels in long JSX and `//` comments that explain *why*.
