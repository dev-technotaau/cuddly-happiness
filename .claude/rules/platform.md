---
paths:
  - "vite.config.ts"
  - "index.html"
  - "package.json"
  - "pnpm-lock.yaml"
  - "tsconfig.json"
  - ".figma/**"
  - "AGENTS.md"
  - "CLAUDE.md"
  - ".mise.toml"
  - ".gitignore"
  - ".gitattributes"
  - "public/**"
---

# Figma Make platform & tooling rules

Full reference: `.claude/docs/platform-and-tooling.md`.

## Platform-managed files

- **`.figma/make/*` hooks:** don't edit them (install, dev, format, deploy, deploy-preview, langserver, analyze-routes). Figma Make runs them, and they call the `pnpm` scripts by name.
- **`package.json` scripts:** keep `dev`, `build` and `format` with their current commands.
- **`vite.config.ts`:**
  - Keep `react()`, `tailwindcss()` and all four `figma*` plugins, in order. Append new plugins after them.
  - Keep `base` (from `FIGMA_PUBLIC_URL`), `server`/`preview` host/port/`strictPort` (from `PORT`, default 8443), and the `emitSourcemaps = mode === 'development'` switch.
  - Don't set `build.outDir`, because the deploy hooks expect `dist/`.
- **`index.html`:** keep the six `<!-- figma:* -->` slots, `<div id="root">` and the `/src/main.tsx` module script.
- **Head metadata** (title, description, language, robots, icons, OG image, analytics, custom scripts) is set in `.figma/make/site.json`, never hard-coded in `index.html`. Extra head tags (the ICO and apple-touch icons, `theme-color`, `og:site_name`/`og:type`/`og:locale`) go in `customScripts.headEnd`. Per-route titles and descriptions come from `headFor()` in `src/App.tsx`, which reads the site-wide ones back from the `og:*` tags. Vite doesn't watch `.figma/`, so restart the dev server after editing `site.json` (touching `vite.config.ts` also restarts it).
- **Skip links:** don't enable `accessibility.addBypassLinks` without retargeting it. Its `href="#root"` is parsed by the hash router and lands on Home.
- **AGENTS.md and the root CLAUDE.md** (`@AGENTS.md`) are part of the scaffold. Put project knowledge in `.claude/` instead.

## Tooling

- **Formatting:** never run `pnpm run format`/oxfmt. It rewrites the whole codebase and breaks `src/store.tsx`.
- **Typecheck:** run `npx tsc --noEmit -p .`. Neither `build` nor deploy typechecks.
- **`lib` is ES2020.** Widening it is a deliberate tsconfig change. If you change the `@` alias, keep the Vite `resolve.alias` and tsconfig `paths` in sync.
- **Dependencies:** change them with pnpm (pinned: Node 22, pnpm 10.34.3 in `.mise.toml`). Commit `package.json` and `pnpm-lock.yaml` together. Ask before adding any dependency.
- **CSS:** global CSS, `@font-face` and Tailwind v4 theme customisation go in `src/index.css`, with the `@import` lines first. There is no `tailwind.config.*` or `postcss.config.*`, and don't add one.
- **Tailwind source scan:** keep `@source not "../.claude";` after the imports in `src/index.css`. Without it, Tailwind v4 scans the `.claude/` docs and ships their example classes (about 3 kB of extra CSS).
- **Moving components:** create the new file, update every import, then delete the old file. Never leave a re-export shim, because `figmaReactRefreshBoundaryFallback` forces full reloads.
- **Git:** binary assets (png/jpg/webp/mp4/woff2/…) go through Git LFS per `.gitattributes`. Never commit `dist/`, `.env*` or the platform folders `/.plugins/`, `/.opencode-skills/` or `/.figma/design-context/`.
