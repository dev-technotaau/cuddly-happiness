# Figma Make platform, toolchain & build

This repository is a Figma Make "figma-make-app" scaffold: a React 19 + TypeScript single-page app built by Vite 8 (Rolldown) with Tailwind CSS v4. Figma Make drives its lifecycle (install, dev server, formatting, deploy) through bash hooks in `.figma/make/`, and custom plugins in `vite.config.ts` turn `.figma/make/site.json` into the HTML `<head>` and a `robots.txt`. There is no test runner, linter or typecheck script; verification is `npx tsc --noEmit -p .` plus `pnpm run build`. This document lists every script, plugin, config option and pinned/resolved tool version, and marks which files the platform owns versus the app.

Scope: `vite.config.ts`, `.figma/make/analyze-routes`, `.figma/make/deploy`, `.figma/make/deploy-preview`, `.figma/make/dev`, `.figma/make/dev.json`, `.figma/make/format`, `.figma/make/install`, `.figma/make/langserver`, `.figma/make/site.json`, `AGENTS.md`, `CLAUDE.md`, `index.html`, `package.json`, `pnpm-lock.yaml` (direct-dependency resolutions only), `.mise.toml`, `.gitignore`, `.gitattributes`, `tsconfig.json`, `public/favicon.svg`, `src/vite-env.d.ts`, `src/main.tsx`

---

## 1. Figma Make in this repository

Figma Make is Figma's AI-assisted environment for building and hosting code-backed apps ("Makes"). A Make's code lives in a repository like this one, which the platform installs, runs in a preview panel and publishes (`figma make deploy`). Evidence in the repo:

- **Scaffold identity.** `package.json` has `"name": "figma-make-app"`, `"private": true`, `"version": "1.0.0"` and `"type": "module"`. `AGENTS.md` opens with `# figma-make-app` and "React + Vite + Tailwind CSS project running inside Figma Make."
- **Hosted dev server.** `AGENTS.md`: "A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually." Also: "Preview URL: The user can access the running app through the preview panel" and "Hot reload: Changes to source files are reflected immediately".
- **Lifecycle hooks.** `.figma/make/` holds seven bash hooks (`install`, `dev`, `format`, `deploy`, `deploy-preview`, `langserver`, `analyze-routes`), the platform watcher config `dev.json` and the site settings file `site.json`.
- **Platform plugins and environment.** `vite.config.ts` defines four platform plugins (`figmaSiteConfiguration`, `figmaErrorOverlayReplay`, `figmaReactRefreshBoundaryFallback`, `figmaMakeKitPlugin`). It reads the environment variables `FIGMA_PUBLIC_URL`, `FIGMA_DEV_SERVER_HOST` and `PORT`.
- **Ignored platform state.** `.gitignore` ignores `/.figma/design-context/` and the "Platform-managed agentplat state" directories `/.plugins/` and `/.opencode-skills/`.
- **Agent instructions.** `CLAUDE.md` is the single line `@AGENTS.md`, so Claude Code loads `AGENTS.md` as its project instructions.

### 1.1 Ownership map

| Path | Owner | Role | Load-bearing couplings (facts) |
|---|---|---|---|
| `.figma/make/install`, `dev`, `format`, `deploy`, `deploy-preview`, `langserver`, `analyze-routes` | Platform | Lifecycle hooks | Call `pnpm run dev` / `pnpm run build` / `pnpm run format`; the deploy hooks pass `--build-dir dist` |
| `.figma/make/dev.json` | Platform | Watcher config for install/restart | Lists `package.json`, `pnpm-lock.yaml` |
| `.figma/make/site.json` | Platform settings file (values are app-specific) | Title/SEO/robots/analytics/a11y settings | Imported by `vite.config.ts` as `siteConfiguration` |
| `vite.config.ts`: the four `figma*` plugin functions, `base`, `server`, `preview`, the `build.sourcemap`/`build.minify` switch | Platform | Make integration | `deploy-preview` relies on `mode === 'development'`; env vars above |
| `vite.config.ts`: `react()`, `tailwindcss()`, `resolve.alias` | Scaffold | Standard Vite setup | `@` alias mirrors `tsconfig.json` `paths` |
| `index.html` | Scaffold shell with platform slots | `figma:*` comment slots, `#root`, entry script | Slots are filled by `figmaSiteConfiguration`; `src/main.tsx` mounts into `#root` |
| `AGENTS.md`, `CLAUDE.md` | Platform / scaffold | Agent instructions | `CLAUDE.md` imports `AGENTS.md` |
| `.mise.toml` | Platform | Toolchain pins | "always watched" (per the `dev.json` comment) |
| `.gitignore` (final block), `.gitattributes` | Platform / scaffold | VCS rules | — |
| `public/favicon.svg` | Scaffold default | Favicon | The default `icons.icon` value is `/favicon.svg` |
| `src/**`, `package.json` `dependencies`/`devDependencies` | App | The Teresa & Sons storefront | The script *names* `dev`, `build`, `format` are called by the hooks |

Whether Figma Make regenerates or overwrites any platform file (for example, writing `site.json` from a settings UI) cannot be determined from the repo.

---

## 2. Scripts

### 2.1 `package.json` scripts

| Script | Command | Called by |
|---|---|---|
| `dev` | `vite` | `.figma/make/dev`; locally `pnpm dev` |
| `build` | `vite build` | `.figma/make/deploy` (`pnpm run build`) and `.figma/make/deploy-preview` (`pnpm run build --mode development`) |
| `preview` | `vite preview` | No hook; local use only |
| `format` | `oxfmt` | `.figma/make/format` (`pnpm run format -- "$@"`) |

There is no `test`, `lint`, `typecheck` or `check` script. No test runner, linter configuration (ESLint/oxlint) or Storybook is present; `node_modules/.bin` contains only `oxfmt`, `tsc`, `tsserver` and `vite`. `build` does not run `tsc`, and Vite only transpiles TypeScript, so **type errors fail neither a build nor a deploy**.

### 2.2 `.figma/make/*` hooks

Every hook starts with `#!/usr/bin/env bash` and `set -euo pipefail`. Each one aborts on the first failing command, unset variable or failing pipe stage, so a failed build stops `deploy` before anything is published. All hooks are committed with git mode `100644` (not executable); the local clone has `core.fileMode=false`.

| Hook | Exact command(s) | Behaviour |
|---|---|---|
| `install` | `pnpm install --prefer-offline --no-frozen-lockfile` | `--prefer-offline` uses cached data where available and skips staleness checks. `--no-frozen-lockfile` lets pnpm rewrite `pnpm-lock.yaml` when it no longer matches `package.json`, instead of failing. |
| `dev` | `pnpm run dev` | Starts the Vite dev server (`vite`). |
| `format` | `pnpm run format -- "$@"` | Runs `oxfmt` and forwards any arguments, such as paths or `--check`. |
| `deploy` | `pnpm run build`<br>`figma make deploy --build-dir dist` | Production build (minified, no sourcemaps), then hands `dist/` to the `figma` CLI. |
| `deploy-preview` | `pnpm run build --mode development`<br>`figma make deploy-preview --build-dir dist` | The script's comment: "# Build in development mode to emit sourcemaps." The matching comment in `vite.config.ts`: "`.figma/make/deploy-preview` passes `--mode development` for cached-preview builds." |
| `langserver` | `exec pnpm dlx --package=@vtsls/language-server@^0.3.0 vtsls --stdio` | Fetches and runs the `vtsls` TypeScript language server over stdio. It is not a project dependency, and `exec` replaces the shell process. |
| `analyze-routes` | `exec figma-analyze routes "$@"` | Runs the platform's `figma-analyze` tool with the `routes` subcommand and forwards arguments. Its behaviour and output are not described anywhere in the repo. |

The `figma` and `figma-analyze` binaries are not npm dependencies and are absent from `node_modules/.bin`. They are also not on PATH on the local Windows machine. So `deploy`, `deploy-preview` and `analyze-routes` can only complete inside the Figma Make environment.

### 2.3 `.figma/make/dev.json` — platform watcher

The file is JSONC: it contains `//` comments. The current values are:

```jsonc
  "installOn": [
    "package.json",
    "pnpm-lock.yaml"
  ],
  // Files whose changes trigger only a dev server restart (no install).
  "restartOn": []
```

What the file's own comments say:

- `installOn` lists "Files whose changes trigger the install script + dev server restart."
- `restartOn` lists files whose changes only restart the dev server.
- Globs use "doublestar (supports **, *, ?, [abc], {a,b})". Paths are "repo-relative and case-sensitive".
- Each key accepts an array shorthand or an object `{ "includes": [...], "excludes": [...] }`.
- "`.mise.toml` and the scripts under `.figma/make/` are always watched regardless of these lists."
- List only files that affect the *toolchain or dependency tree*, not application source. Vite already watches `src/**/*` and `vite.config.ts` through its own HMR pipeline, so listing them "would cause a redundant full restart".

### 2.4 Build modes (`deploy` vs `deploy-preview`)

```ts
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
```

| | `deploy` | `deploy-preview` |
|---|---|---|
| Build command | `pnpm run build` → `vite build` | `pnpm run build --mode development` → `vite build --mode development` |
| Vite `mode` | `production` (the build default) | `development` |
| `build.sourcemap` | `false` | `'inline'` (maps embedded in the emitted files) |
| `build.minify` | `true` | `false` |
| `process.env.NODE_ENV` while building | `production` | Still `production`. Vite 8.0.5 `resolveConfig` defaults NODE_ENV to `production` for `build` unless the environment or a `.env` file sets `NODE_ENV=development`, and no `.env` files exist. |
| Large-chunk warning | Enabled (the reporter's `warnLargeChunks` requires `build.minify`) | Disabled |
| Publish step | `figma make deploy --build-dir dist` | `figma make deploy-preview --build-dir dist` |
| Output directory | `dist/` (Vite default; `build.outDir` is not overridden) | `dist/` |

---

## 3. Dev server, preview server & environment

| Setting | Code | Effective value |
|---|---|---|
| `server.host` | `process.env.FIGMA_DEV_SERVER_HOST \|\| '0.0.0.0'` | `0.0.0.0` (all interfaces) |
| `server.port` | `parseInt(process.env.PORT \|\| '8443')` | `8443` |
| `server.strictPort` | `true` | If the port is busy, Vite exits instead of trying the next port |
| `server.watch.ignored` | `['**/.figma/**']` | Vite never reacts to changes under `.figma/` |
| `server.https` | not set | Plain HTTP; 8443 is just the port number |
| `preview.host` / `preview.port` | Same expressions as `server` | `0.0.0.0` / `8443` |
| `preview.strictPort` | not set | Inherits `server.strictPort` (`true`), per Vite 8.0.5 `resolvePreviewOptions` |
| `base` | `` process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/' `` | `/` locally |

| Environment variable | Read by | When unset |
|---|---|---|
| `FIGMA_PUBLIC_URL` | `base` (a `/` is always appended) | `base` is `/` |
| `FIGMA_DEV_SERVER_HOST` | `server.host`, `preview.host` | `0.0.0.0` |
| `PORT` | `server.port`, `preview.port` | `8443` |

- **In Figma Make**, the dev server is already running (`AGENTS.md`). Because `strictPort` is set, a second `vite` on the same port fails instead of moving to another port.
- **Locally**, run `pnpm dev` and open `http://localhost:8443/`. Routes are hash-based, e.g. `http://localhost:8443/#/cart`; the parser is `parseHash` in `src/store.tsx`. To use another port, run `$env:PORT = '5173'; pnpm dev` in PowerShell or `PORT=5173 pnpm dev` in bash.
- **`pnpm preview`** serves the last `dist/` build on the same host and port. It cannot run alongside `pnpm dev` on 8443.
- **Environment files.** No `.env*` files exist (the pattern is gitignored), and no file under `src/` reads `import.meta.env`.
- **`__dirname` in the config.** `vite.config.ts` uses `__dirname` even though the package is ESM (`"type": "module"`). This works because Vite 8 bundles the config with Rolldown (`bundleConfigFile`), which defines `__dirname` as an injected value.

---

## 4. Vite configuration and plugins

`vite.config.ts` has three parts:

- the default export `defineConfig(({ mode }) => ({ … }))`;
- the `FigmaSiteConfiguration` type;
- four plugin factory functions.

Several build settings are not overridden, so the Vite 8.0.5 defaults apply:

- `build.outDir` is `dist`.
- `build.target` is `'baseline-widely-available'`, which resolves to `chrome111`, `edge111`, `firefox114`, `safari16.4` and `ios16.4`.
- `build.chunkSizeWarningLimit` is `500` (kB).

`resolve.alias` maps `'@'` to `path.resolve(__dirname, './src')`, matching `tsconfig.json` `paths`. Nothing in `src/` imports via `@/` today; every import is relative.

| # | Plugin call | Plugin `name` | `apply` | Ordering | Purpose |
|---|---|---|---|---|---|
| 1 | `react()` | from `@vitejs/plugin-react` 6.0.1 | serve + build | — | JSX and React Fast Refresh |
| 2 | `tailwindcss()` | from `@tailwindcss/vite` 4.2.2 | serve + build | — | Tailwind CSS v4 compilation |
| 3 | `figmaSiteConfiguration(siteConfiguration)` | `figma-site-configuration` | serve + build (no `apply`) | `transformIndexHtml.order: 'pre'` | Applies `site.json` to the HTML; serves and emits `robots.txt` |
| 4 | `figmaErrorOverlayReplay()` | `figma-error-overlay-replay` | `serve` | — | Replays the last build error to sockets that connect later |
| 5 | `figmaReactRefreshBoundaryFallback()` | `figma-react-refresh-boundary-fallback` | `serve` | `enforce: 'post'` | Forces a full reload when a module loses its React Refresh boundary |
| 6 | `figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' })` | `figma-make-kit` | `serve` | — | Dev-only kit page and stories registry |

### 4.1 `react()` — `@vitejs/plugin-react` 6.0.1

`react()` is called with no options. It provides the JSX transform (automatic runtime) and, in dev, Fast Refresh:

- In 6.0.1 the refresh wrapping is delegated to `reactRefreshWrapperPlugin`, imported from `vite/internal`.
- The refresh runtime is served at `/@react-refresh` from the package's `dist/refresh-runtime.js`, which defines `registerExportsForReactRefresh`. Plugin 5 looks for that identifier.

### 4.2 `tailwindcss()` — `@tailwindcss/vite` 4.2.2 with `tailwindcss` 4.2.2

There is no `tailwind.config.*` or `postcss.config.*`. `AGENTS.md`: "This scaffold does not need a Tailwind config file or PostCSS config."

Tailwind is entered through `src/index.css`, whose first two lines are:

1. the Google Fonts import `@import url('https://fonts.googleapis.com/css2?family=Baskervville:ital,wght@0,400..700;1,400..700&family=Jost:ital,wght@0,300..600;1,300..600&family=Pinyon+Script&display=swap');`
2. `@import 'tailwindcss';`

This follows the `AGENTS.md` rule "Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there." The tokens and theme are documented in [design-system.md](design-system.md).

### 4.3 `figmaSiteConfiguration(config: FigmaSiteConfiguration)`

Doc comment: "Applies /.figma/make/site.json to the generated document shell." The supported fields, the constants derived from them and their effects:

| Field (`FigmaSiteConfiguration`) | Type | Derived constant / default | Effect |
|---|---|---|---|
| `title` | `string?` | `title = config.title ?? "Figma Make App"` | `<title>` slot (escaped via `escapeHtmlText`) and the `og:title` meta |
| `description` | `string?` | `description = config.description ?? ''` | `meta[name=description]` and `og:description`, only when non-empty |
| `language` | `string?` | `language = sanitizeHtmlValue(config.language) \|\| 'en'` | `figma:lang` slot (`<html lang>`) |
| `robots.index` | `boolean?` | `robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''` | Only an explicit `false` adds `meta[name=robots]` = `noindex, nofollow` and creates `robots.txt` |
| `icons.icon` | `string?` | `favicon = config.icons?.icon ?? '/favicon.svg'` | `<link rel="icon">`; only an empty string suppresses it |
| `openGraph.image` | `string?` | `socialImage = config.openGraph?.image ?? ''` | `og:image`, `twitter:card` and `twitter:image` |
| `analytics.googleAnalyticsId` | `string?` | `googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)` | Google tag (gtag.js) scripts |
| `customScripts.headStart` / `headEnd` / `bodyStart` / `bodyEnd` | `string?` | each `?? ''` | Raw, unsanitised HTML placed into the matching slot |
| `accessibility.addBypassLinks` | `boolean?` | — | "Skip to content" link and its `<style>` |

Helpers:

- `sanitizeHtmlValue` deletes every character outside `[a-zA-Z0-9_-]` and returns `''` for `undefined`.
- `escapeHtmlText` escapes `&`, `<` and `>`. It is used only for the `<title>` slot.
- `replaceHtmlCommentSlot(html, slotName, content)` is `` html.replace(`<!-- ${slotName} -->`, content) ``. Because the pattern is a string, only the first occurrence is replaced.

Hooks:

1. **`configureServer`** (dev) adds a middleware. When `robotsTxt` is non-empty and `req.url` without its query is `/robots.txt`, it responds with `Content-Type: text/plain; charset=utf-8` and the robots text. Otherwise it calls `next()`.
2. **`generateBundle`** (build): when `robotsTxt` is non-empty, it calls `this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt })`, which produces `dist/robots.txt`.
3. **`transformIndexHtml`** (`order: 'pre'`) replaces the slots in this order: `figma:lang`, `figma:title`, `figma:head-start`, `figma:head-end`, `figma:body-start`, `figma:body-end`. It then returns `{ html, tags }` with these tags, in push order:

| # | Condition | Tag | `injectTo` |
|---|---|---|---|
| 1 | `description` | `meta name="description" content=<description>` | `head` |
| 2 | `config.robots?.index === false` | `meta name="robots" content="noindex, nofollow"` | `head` |
| 3 | `favicon` | `link rel="icon" href=<favicon>` | `head` |
| 4 | `title` (truthy unless set to `''`) | `meta property="og:title" content=<title>` | `head` |
| 5 | `description` | `meta property="og:description" content=<description>` | `head` |
| 6–8 | `socialImage` | `meta property="og:image"`, `meta name="twitter:card" content="summary_large_image"`, `meta name="twitter:image"` | `head` |
| 9 | `googleAnalyticsId` | `script async src="https://www.googletagmanager.com/gtag/js?id=<id>"` | `head` |
| 10 | `googleAnalyticsId` | Inline script: `window.dataLayer = window.dataLayer \|\| []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', "<id>");` | `head` |
| 11 | `addBypassLinks` | `<style>` for `.figma-bypass-link` | `head` |
| 12 | `addBypassLinks` | `a class="figma-bypass-link" href="#root"` with text `Skip to content` | `body-prepend` |

The `.figma-bypass-link` style is:

- `position: fixed; top: 8px; left: 8px; z-index: 2147483647;`
- `transform: translateY(-150%)`, which becomes `translateY(0)` on `:focus`
- `border-radius: 6px; background: #111827; color: #fff; padding: 8px 12px;`
- `font: 600 14px/1.2 system-ui, sans-serif; text-decoration: none`

How Vite 8.0.5 places and serialises these tags:

- **`'head'` tags** are inserted just before `</head>` by `injectToHead`. That puts them after `<title>` and after any `headEnd` content.
- **`'body-prepend'` tags** go immediately after `<body>`, before any `bodyStart` content.
- **Serialisation.** `serializeAttrs` HTML-escapes attribute values with `escape-html`. `meta` and `link` are written without a self-closing slash. `children` text is inserted verbatim.
- **Build-time URL rewriting.** `vite:build-html` runs the pre-order hooks first (`applyHtmlTransforms(html, preHooks, …)`) and only then walks the HTML to rewrite asset URLs. Public-directory URLs such as `/favicon.svg` therefore go through `toOutputPublicFilePath`, which applies `base`.

### 4.4 `figmaErrorOverlayReplay()` — serve only

**Problem it solves** (from its doc comment): Vite buffers an error payload only while no clients are connected. If the preview iframe reloads after the error was already delivered to a live socket, the new socket never receives it. The overlay then stays hidden even though the build is still broken.

**Mechanism:**

1. It wraps `server.ws.send`. For an object payload (not an array):
   - `type === 'error'` stores the payload in `lastError`;
   - `type === 'update'` or `'full-reload'` resets `lastError` to `null`.

   Every call is still forwarded to the original `send`.
2. On every `server.ws.on('connection', socket => …)`, if `lastError !== null`, it calls `socket.send(JSON.stringify(lastError))`.

As a result, the error overlay survives iframe reloads until a successful update or a full reload clears it.

### 4.5 `figmaReactRefreshBoundaryFallback()` — serve only, `enforce: 'post'`

**Problem it solves** (from its doc comment): an agent moves a component into a new file and replaces the old module with a re-export such as `export { default } from './app/App'`. Vite then accepts the update using the previous module's HMR boundary. But the re-export-only module no longer registers a replacement, so React "reports a successful refresh while leaving the old tree mounted until the page is reloaded".

**State** (kept in the plugin closure):

- `hadRefreshBoundary: Map<string, boolean>`
- `lostRefreshBoundaries: Set<string>`
- `sendFullReload`, set in `configureServer` to `server.ws.send({ type: 'full-reload', path: '*' })`

**`transform(code, id)`** handles ids matching `/\.[jt]sx?(?:\?|$)/` that do not contain `/node_modules/`:

1. Because the plugin runs `post`, it sees the code after the refresh wrapper. A module "has a boundary" when `code.includes('registerExportsForReactRefresh')`.
2. If the module has a boundary, it is removed from `lostRefreshBoundaries`.
3. If it had a boundary on its previous transform but not now, it is added to `lostRefreshBoundaries` and `queueMicrotask(() => sendFullReload?.())` runs.
4. It always returns `null`, so the code is never modified.

**`handleHotUpdate({ modules, server, timestamp })`**:

1. It is a no-op while `lostRefreshBoundaries` is empty.
2. Otherwise it walks from the updated modules up through their `importers` (an iterative DFS with a `visited` set).
3. If any visited module id (query stripped) is in the lost set, it:
   - invalidates every updated module with `server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)`;
   - sends a full reload;
   - returns `[]`, which suppresses Vite's normal HMR for that update.

**Practical rule: never turn a component module into a bare re-export.** When moving a component, update its import sites and delete the old file. A module marked "lost" keeps forcing full reloads for every hot update whose importer chain reaches it. This lasts until the module regains a boundary or the dev server restarts, because the state is in memory only.

### 4.6 `figmaMakeKitPlugin({ storiesGlob })` — serve only

**Constants:**

- `ROUTE = '/.figma/make/kit.html'`
- `VIRTUAL_ID = 'virtual:figma-stories'`
- `RESOLVED_ID = '\0' + VIRTUAL_ID`
- `storiesGlob` is normalised to an array

**Hooks:**

- `resolveId` and `load` serve the virtual module `export const stories = import.meta.glob(["/src/**/*.stories.{ts,tsx,js,jsx}"])`. The glob is lazy, so each entry is a dynamic importer.
- A `configureServer` middleware answers `/.figma/make/kit.html` (query ignored) with `Content-Type: text/html`.
  - The body is `HTML_BOOTSTRAP` passed through `server.transformIndexHtml`, so it also receives the `site.json` tags and Vite's dev client.
  - The page contains `<div id="figma-make-kit-root"></div>` and a module script. The script imports `stories` from `'virtual:figma-stories'`, sets `window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })` and dispatches `new CustomEvent('figma.ready')`.
  - Errors go to `next(err)`.

According to the doc comment, the "Figma preview script" and "design surface" use this page to "dynamically import + mount each entry into its own grid view".

**No `*.stories.*` files exist under `src/`**, so `stories` is `{}`. The plugin is skipped by `vite build` (`apply: 'serve'`), so the route never ships.

---

## 5. `site.json` — current values and resulting document

| Key | Current value | Effect |
|---|---|---|
| `description` | "Premium e-commerce platform offering luxury diamond and gold jewelry, bridal pieces, and rental options with a modern, user-friendly shopping experience." | `meta name="description"` and `meta property="og:description"` |
| `robots.index` | `false` | `meta name="robots" content="noindex, nofollow"`, plus a `robots.txt` with `User-agent: *` / `Disallow: /`. The dev middleware serves it and the build emits it to `dist/robots.txt`. |
| `accessibility.addBypassLinks` | `false` | No skip link or style is injected |
| `accessibility.ignoreReducedMotion` | `false` | Not part of `FigmaSiteConfiguration` and read nowhere in the repo; any effect is platform-side and unknown. Passing the imported JSON object is not an excess-property error because it is not an object literal. |
| `title` | **not set** | Falls back to **`"Figma Make App"`**, giving `<title>Figma Make App</title>` and `og:title` = `Figma Make App`. No file under `src/` sets `document.title`, so **every route shows "Figma Make App" as the browser-tab title**. |
| `language` | not set | `<html lang="en">` |
| `icons.icon` | not set | `<link rel="icon" href="/favicon.svg">` |
| `openGraph.image` | not set | No `og:image` or `twitter:*` tags |
| `analytics.googleAnalyticsId` | not set | No analytics scripts |
| `customScripts.*` | not set | All four slots are replaced with `''` |

The document shell in dev, as derived from the code (not captured from a build). It omits the blank lines left by emptied slots and Vite's own dev-client and refresh-preamble injections:

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Figma Make App</title>
    <meta name="description" content="Premium e-commerce platform offering luxury diamond and gold jewelry, bridal pieces, and rental options with a modern, user-friendly shopping experience.">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" href="/favicon.svg">
    <meta property="og:title" content="Figma Make App">
    <meta property="og:description" content="Premium e-commerce platform offering luxury diamond and gold jewelry, bridal pieces, and rental options with a modern, user-friendly shopping experience.">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
```

In a build, Vite replaces the `/src/main.tsx` entry script with the hashed bundle and stylesheet, and prefixes public URLs such as `/favicon.svg` with `base`.

---

## 6. `index.html` shell

| Slot comment | Position | Filled with (by `figmaSiteConfiguration`) |
|---|---|---|
| `<!-- figma:lang -->` | Inside `<html lang="…">` | `language` (currently `en`) |
| `<!-- figma:head-start -->` | First in `<head>`, before `<meta charset="UTF-8" />` | `customScripts.headStart` (raw) |
| `<!-- figma:title -->` | Inside `<title></title>` | `escapeHtmlText(title)` (currently `Figma Make App`) |
| `<!-- figma:head-end -->` | Last in `<head>` | `customScripts.headEnd` (raw); the injected `'head'` tags follow it |
| `<!-- figma:body-start -->` | First in `<body>` | `customScripts.bodyStart` (raw), after any `body-prepend` tag |
| `<!-- figma:body-end -->` | After the entry script, last in `<body>` | `customScripts.bodyEnd` (raw) |

The static content is:

- `<!doctype html>`
- `<meta charset="UTF-8" />`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
- `<div id="root"></div>`
- `<script type="module" src="/src/main.tsx"></script>`

There are no font `preconnect`/`preload` links, no `theme-color`, no web manifest and no `<noscript>`. Fonts arrive through the CSS `@import url(...)` at the top of `src/index.css`.

---

## 7. Entry point and ambient types

`src/main.tsx` imports, in order: `React` from `'react'`, `ReactDOM` from `'react-dom/client'`, `App` from `'./App'`, then `'./index.css'`. It renders:

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- Because of the `!` non-null assertion, startup throws if `#root` is missing from `index.html`.
- The whole app runs under `React.StrictMode`.

`src/vite-env.d.ts` is the single line `/// <reference types="vite/client" />`. It supplies Vite's client typings: `import.meta.env`, `import.meta.glob`, `import.meta.hot` and declarations for asset/CSS imports.

---

## 8. TypeScript configuration (`tsconfig.json`)

| Option | Value | Practical implication |
|---|---|---|
| `target` | `"ES2020"` | Affects type-checking only (`noEmit`). Vite's output target is its own default (see §4). |
| `useDefineForClassFields` | `true` | Standard `[[Define]]` class-field semantics |
| `lib` | `["ES2020", "DOM", "DOM.Iterable"]` | ES2021+ built-ins fail `tsc` even though they run in Vite's target browsers. Examples: `String.prototype.replaceAll`, `Array.prototype.at`, `Object.hasOwn`, `findLast`, `toSorted`. |
| `module` | `"ESNext"` | ESM syntax is preserved; the bundler resolves it |
| `skipLibCheck` | `true` | `.d.ts` files (dependencies) are not checked |
| `moduleResolution` | `"bundler"` | Resolution mirrors Vite: package `exports` are honoured and extensionless relative imports are allowed |
| `baseUrl` | `"."` | Base for `paths` |
| `paths` | `{ "@/*": ["./src/*"] }` | Matches the Vite `@` alias; unused in `src/` today |
| `allowImportingTsExtensions` | `true` | `import x from './x.tsx'` is permitted (legal only because `noEmit` is set); no file uses it |
| `resolveJsonModule` | `true` | JSON imports are typed; `vite.config.ts` relies on this to import `./.figma/make/site.json` |
| `isolatedModules` | `true` | Each file must transpile alone, matching Vite's per-file transpilation; type-only re-exports need `export type` / `import type` |
| `noEmit` | `true` | `tsc` is purely a checker and never writes JS |
| `jsx` | `"react-jsx"` | Automatic JSX runtime, so JSX needs no `import React` (`src/main.tsx` imports it only for `React.StrictMode`) |
| `types` | `["node"]` | Only `@types/node` ambient globals are auto-included. `vite.config.ts` needs them (`process.env`, `__dirname`, `node:path`), but they are also visible to browser code in `src/`. Vite client types come from `src/vite-env.d.ts`. |
| `strict` | `true` | The full strict family (`strictNullChecks`, `noImplicitAny`, …) |
| `noFallthroughCasesInSwitch` | `true` | A non-empty `case` must `break`, `return` or `throw` |
| `include` | `["src", "vite.config.ts"]` | Type-check scope; `site.json` is pulled in through the config's import |
| *(absent)* | `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` | Unused code and unchecked index access are **not** flagged |

Typecheck with `npx tsc --noEmit -p .` (`--noEmit` duplicates the config and is harmless). It reported 0 errors on 2026-10-15.

---

## 9. Toolchain and versions

| Tool | Declared | Local machine (observed 2026-10-15, Windows 11) |
|---|---|---|
| Node.js | `.mise.toml` `node = "22"` | `v24.21.0` |
| pnpm | `.mise.toml` `"npm:pnpm" = "10.34.3"` (installed through mise's npm backend) | `12.9.1`. `node_modules/.modules.yaml` records `"packageManager": "pnpm@12.9.1"` and `"layoutVersion": 5`. |
| mise | — | Not on PATH (Git Bash) |
| git-lfs | — | `3.7.1` |

`pnpm-lock.yaml` is `lockfileVersion: '9.0'`, with `settings: autoInstallPeers: true, excludeLinksFromLockfile: false` and a single importer `.`. The local pnpm 12.9.1 install wrote `node_modules/.pnpm/lock.yaml` with `lockfileVersion: '9.0'` and left the committed `pnpm-lock.yaml` unchanged (the working tree is clean).

| Package | Kind | Range (`package.json`) | Resolved (`pnpm-lock.yaml`) |
|---|---|---|---|
| `react` | dependency | `^19.0.0` | `19.2.4` |
| `react-dom` | dependency | `^19.0.0` | `19.2.4` (peer `react@19.2.4`) |
| `gsap` | dependency | `^3.15.0` | `3.15.0` |
| `lenis` | dependency | `^1.3.26` | `1.3.26` (peer `react@19.2.4`) |
| `lucide-react` | dependency | `^1.57.0` | `1.57.0` (peers `@types/react@19.2.14`, `react@19.2.4`) |
| `vite` | devDependency | `^8.0.5` | `8.0.5` (peers `@types/node@22.19.17`, `jiti@2.6.1`); bundles with `rolldown@1.0.0-rc.12`, hoisted per `.modules.yaml` |
| `@vitejs/plugin-react` | devDependency | `^6.0.0` | `6.0.1` |
| `tailwindcss` | devDependency | `^4.0.0` | `4.2.2` |
| `@tailwindcss/vite` | devDependency | `^4.0.0` | `4.2.2` |
| `typescript` | devDependency | `^5.7.0` | `5.9.3` |
| `@types/node` | devDependency | `^22.0.0` | `22.19.17` |
| `@types/react` | devDependency | `^19.0.0` | `19.2.14` |
| `@types/react-dom` | devDependency | `^19.0.0` | `19.2.3` |
| `oxfmt` | devDependency | `^0.2.0` | `0.2.0` |

Some tools are not dependencies at all:

- `@vtsls/language-server@^0.3.0` is fetched on demand by the `langserver` hook through `pnpm dlx`.
- The `figma` and `figma-analyze` CLIs come from the Figma Make environment.

`AGENTS.md` describes the stack as "Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`"; 5.7 is the range floor, and 5.9.3 is installed.

---

## 10. Build output and verification baseline

Results of the 2026-10-15 verification run:

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | 0 errors |
| `pnpm run build` | Succeeds |
| Main JS chunk | 610.47 kB (184.26 kB gzip) |
| Lazy `TryOnStudio` chunk | 22.40 kB. It is the only dynamic import in `src/`: `lazy(() => import('./TryOnStudio'))` in `src/components/tryon/TryOnProvider.tsx` (see [features/virtual-try-on.md](features/virtual-try-on.md)) |
| CSS | 78.58 kB (13.90 kB gzip) |
| `robots.txt` | Emitted, because `robots.index` is `false` |

The main chunk exceeds the default `chunkSizeWarningLimit` of 500 kB. Vite's reporter is configured with `chunkLimit: 500` and `warnLargeChunks: build.minify && !lib && consumer === 'client'`, so production builds flag it. The exact warning text lives in the native reporter and was not inspected.

Things that do not exist:

- `*.stories.*` files
- a test runner, linter or typecheck script
- `.oxfmtrc*`, `.prettierrc*` or `.editorconfig`

The repo has 90 tracked files: 58 `.tsx`, 12 `.ts`, 4 `.json`, 2 `.md`, one each of `.yaml`, `.toml`, `.svg`, `.html`, `.css`, `.gitignore` and `.gitattributes`, plus the 7 extensionless hooks.

---

## 11. Formatting (`oxfmt` 0.2.0)

**CLI.** `pnpm run format` runs `oxfmt` with no arguments. Its help text is `Usage: [--check | --list-different] [PATH]...`, and for PATH: "If not provided, current working directory is used". The default mode rewrites files in place. The non-writing modes are `--check` ("check if files are formatted") and `--list-different` ("list files that would be changed"). The other options are `--threads=INT` and `--no-error-on-unmatched-pattern`.

**Configuration.** There is no formatter config file, so the built-in defaults apply.

**Observed defaults.** On 2026-10-15, `oxfmt` was run on scratch copies of `src/main.tsx` and `vite.config.ts`; the repo was untouched. It:

- converted every single-quoted string to double quotes;
- wrapped lines longer than about 80 columns (the `base:` ternary became three lines);
- re-indented `react(),` and collapsed `ignored: ['**/.figma/**']` onto one line;
- added no semicolons.

**Current code style.** 65 of the 69 `.ts`/`.tsx` files under `src/` have single-quoted `import … from '…'` lines, and none use double quotes. Only one line in those files ends with `;`. As a result, `pnpm run format` over the repo would rewrite almost every file.

---

## 12. Git configuration

### 12.1 `.gitignore`

| Pattern | Meaning |
|---|---|
| `node_modules/` | Installed packages |
| `dist/` | Vite build output; the deploy hooks publish it via `--build-dir dist` |
| `build/`, `.cache/` | Generic build/cache folders; this config does not use them |
| `.env*` | Environment files (none exist) |
| `.vite/` | Vite cache directory, if one is created at the root |
| `vite.config.*.timestamp-*` | Temporary bundled-config files Vite writes while loading `vite.config.ts` |
| `*.tsbuildinfo` | TypeScript incremental build info |
| `*-debug.log*`, `logs/`, `*.log` | Logs |
| `.claude-replay.*`, `.tmp-*` | Agent replay and temp artifacts (purpose not documented in the repo) |
| `/.figma/design-context/` | Platform design-context folder at the repo root (absent locally) |
| `/.plugins/`, `/.opencode-skills/` | Comment: "Platform-managed agentplat state, not project source. In the client-initiated single-repo workspace layout (make's `Path: "."` spec) the repo root IS the workspace root, so these land inside this repo rather than beside it." |

`.claude/` is **not** ignored, so a knowledge base under `.claude/docs/` gets committed.

### 12.2 `.gitattributes`

The header comments read "Git LFS Tracking Rules" and "Generated for binary, large, and non-diffable file types". There are 100 extension patterns, each set to `filter=lfs diff=lfs merge=lfs -text`:

| Category (as commented) | Extensions |
|---|---|
| Images & Graphics | png, jpg, jpeg, gif, bmp, tiff, tif, ico, webp, psd, ai, sketch |
| Video | mp4, mov, avi, mkv, wmv, flv, webm, m4v, mpg, mpeg |
| Audio | mp3, wav, flac, aac, ogg, m4a, wma, aiff |
| 3D & Game Assets | fbx, obj, blend, dae, 3ds, max, unity, unitypackage, uasset, umap |
| Archives & Compressed Files | zip, tar, gz, bz2, 7z, rar, tgz |
| Documents & Fonts | pdf, docx, xlsx, pptx, ttf, otf, woff, woff2, eot |
| Data & Machine Learning | parquet, hdf5, h5, pkl, pickle, npy, npz, bin, pt, pth, onnx, pb, safetensors, gguf |
| Databases | db, sqlite, sqlite3, mdb, accdb |
| Executables & Libraries | exe, dll, so, dylib, a, lib, wasm |
| Build Artifacts & Packages | jar, war, ear, apk, ipa, deb, rpm, dmg, iso, img |
| CAD & Scientific | dwg, dxf, step, stp, iges, stl, nc, mat |

Other facts:

- `svg`, `css`, `json` and source files are not LFS-tracked.
- There are no line-ending (`text`/`eol`) rules. The local git config has `core.autocrlf=true`.
- `git lfs ls-files` is empty: no binary assets are committed.

### 12.3 Favicon (`public/favicon.svg`)

- It is a 16×16 SVG: a rounded square filled `#2C2C2C` with a white four-armed glyph.
- It is the only file in `public/`.
- A comment in `vite.config.ts` says: "Imported HTML keeps its own favicon; new Makes default to the Make product icon". So this is Figma Make's default icon, not a Teresa & Sons mark.
- It is referenced only through the default `icons.icon` value (`/favicon.svg`).

---

## 13. Recommended verification workflow (recommendation)

1. **Typecheck:** `npx tsc --noEmit -p .`. Expect 0 errors, the 2026-10-15 baseline.
2. **Build:** `pnpm run build`. Expect success, chunk sizes near the §10 baseline, the large-chunk warning, and `dist/robots.txt` while `robots.index` is `false`.
3. **Preview:** `pnpm preview`, then open `http://localhost:8443/`.
   - Stop `pnpm dev` first or set `PORT`, because both servers are strict on 8443.
   - Click through `#/`, `#/c/<slug>`, `#/p/<slug>`, `#/cart`, `#/checkout`, `#/gift-cards`, `#/wishlist`, `#/account` and `#/atelier`.
4. **After editing `vite.config.ts` or `.figma/make/site.json`:** restart the dev server, then view the page source to confirm the `<head>` tags.
5. **Optional:** `pnpm run build --mode development` reproduces the `deploy-preview` artifact (unminified, inline sourcemaps).
6. **Before committing:** check `git status`. `pnpm-lock.yaml` should change only when dependencies changed, and no files should have been reformatted wholesale.

---

## Tailwind source exclusion (added 2026-10-15)

Tailwind v4 auto-detects class candidates in every non-gitignored file. Once `.claude/` existed, its docs (full of class recipes) added about 3 kB of unused CSS to the build; `max-sm:!hidden`, used nowhere in `src/`, appeared in the bundle. `src/index.css` now has `@source not "../.claude";` right after `@import 'tailwindcss';`. With it, CSS went from 85.2 kB back to 82.2 kB; the remainder is the BackToTop utilities. Keep the line.

## Notes & gotchas

- **The brand is missing from the tab title and link previews.** Every title and `og:title` reads "Figma Make App", because `site.json` has no `title` and no code sets `document.title`. Setting `"title"` in `site.json` is enough: `&` is escaped correctly in `<title>` (by `escapeHtmlText`) and in the meta attribute (by Vite's `escape-html`).
- **Default favicon.** `public/favicon.svg` is the Make product icon. Replace the file or set `icons.icon`.
- **`robots.index: false` blocks indexing.** It produces `noindex, nofollow` and `Disallow: /`. That is right for a prototype; change it deliberately if this ever becomes a public site.
- **`addBypassLinks` conflicts with hash routing.** The injected link's `href="#root"` would fire `hashchange`. `parseHash` in `src/store.tsx` maps unknown hashes such as `root` to `{ name: 'home' }`, so "Skip to content" would navigate to Home. Change the target or use an in-app skip link before enabling it. See [ux-patterns-and-accessibility.md](ux-patterns-and-accessibility.md).
- **`ignoreReducedMotion` is a no-op in the repo.** The app's own reduced-motion handling is in [motion-and-interaction.md](motion-and-interaction.md).
- **`site.json` edits probably need a manual restart (inference).** `vite.config.ts` imports `site.json`, but Vite's watcher ignores `**/.figma/**`, so a local dev server will probably not notice the edit; restart it. It is unclear whether the Figma Make watcher counts `site.json` among "the scripts under `.figma/make/`".
- **The local dev server is exposed on the LAN.** `host` defaults to `0.0.0.0`. Set `FIGMA_DEV_SERVER_HOST=127.0.0.1` to keep it local.
- **`strictPort` applies to both dev and preview.** Both use 8443, so a busy port is an error. Use `PORT` to change it.
- **`FIGMA_PUBLIC_URL` must not end with `/`.** A trailing slash would give a `//` base, because `/` is appended unconditionally. Its real format (path or absolute URL) is unknown.
- **No typecheck gate.** `build` and `deploy` succeed with type errors, so run `tsc` yourself.
- **`lib: ES2020` is narrower than the runtime target.** Newer built-ins compile in Vite but fail `tsc`. Either widen `lib` or avoid them.
- **Node globals type-check in browser code.** Because of `types: ["node"]`, `process` and `Buffer` type-check inside `src/` but do not exist at runtime.
- **Formatter defaults clash with the codebase.** Avoid `pnpm run format` (or `.figma/make/format` without paths) unless you intend a repo-wide quote-style change in its own commit. Hand-write single quotes without semicolons. It is unknown whether Figma Make ever runs the format hook on edited files; the current style suggests it has not.
- **Apostrophes in strings.** `AGENTS.md` warns that an unescaped apostrophe in a single-quoted string breaks the build. Use double quotes for such strings (e.g. `"We're here to help"`). See [code-conventions.md](code-conventions.md).
- **HMR boundary rule.** Never leave a re-export shim (`export { default } from './New'`) in place of a component module. Keep exporting components as default exports (`AGENTS.md`).
- **Toolchain drift.** The local machine runs Node 24 and pnpm 12.9.1, while the pins are Node 22 and pnpm 10.34.3, and mise is not on PATH. The lockfile stayed at `'9.0'`, but a different pnpm major could rewrite it. Prefer the pinned versions when changing dependencies. Commit `package.json` and `pnpm-lock.yaml` together: `installOn` watches both, and `--no-frozen-lockfile` lets the platform rewrite the lockfile.
- **Hooks are non-executable and bash-only.** They are committed as `100644`, so on POSIX run them as `bash .figma/make/<hook>`; on Windows use Git Bash. With `core.autocrlf=true` and no `eol` attributes, a fresh Windows clone could check them out with CRLF endings, which bash rejects. Today both the index and the working tree are LF.
- **Slot replacement quirks.** `replaceHtmlCommentSlot` calls `String.prototype.replace` with a string pattern. Only the first occurrence of each slot is replaced. Any `$&`, `` $` ``, `$'` or `$$` inside a `customScripts` value is interpreted as a replacement pattern. `customScripts` are injected unsanitised.
- **Bundle size.** The main chunk is 622 kB (2026-10-16) and only `TryOnStudio` is code-split. Heavy new features should follow the `lazy(() => import(...))` pattern in `src/components/tryon/TryOnProvider.tsx`.
- **`deploy-preview` is not a development React build.** It is unminified with inline sourcemaps, but NODE_ENV stays `production`. Expect production React behaviour in preview deploys, including no StrictMode double-invocation.
- **Cosmetic indentation in `vite.config.ts`.** Two lines are unindented: `react(),` and the closing `],` of `watch.ignored`. This is harmless; do not "fix" it as part of unrelated work.
- **Porting to Shopify.** None of this toolchain is part of a Shopify theme: not the Vite build, not the `site.json` head generation, not `robots.txt`, not hash routing. See [shopify-integration.md](shopify-integration.md).

## Related docs

- [Architecture & runtime model](architecture.md)
- [Product overview, sitemap & user journeys](product-overview.md)
- [Design system](design-system.md) — `src/index.css`, fonts, Tailwind v4 theme
- [Motion, animation & scroll behaviour](motion-and-interaction.md) — gsap/lenis usage, reduced motion
- [UX patterns, responsive behaviour & accessibility](ux-patterns-and-accessibility.md)
- [Code conventions](code-conventions.md)
- [Virtual try-on](features/virtual-try-on.md) — the lazily loaded `TryOnStudio` chunk
- [Shopify integration map & porting notes](shopify-integration.md)
- [Global chrome & shared components](components/global-and-shared.md)
- [Known issues, risks & tech debt](known-issues.md)
- [File index](INDEX.md)
