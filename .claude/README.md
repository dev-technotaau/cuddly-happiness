# `.claude/` — Claude Code setup for the Teresa & Sons storefront

This folder gives Claude Code complete, maintainable knowledge of this repository. It contains:
- always-on project rules,
- path-scoped area rules,
- a deep knowledge base,
- task skills, review agents,
- a drift-detection hook and permission guards.

> **Scope.** This repo is the UI/design prototype of a Shopify theme, not a working store. Never build backend or live integrations here (see `rules/project.md`).

The root `CLAUDE.md` (which imports `AGENTS.md`, the Figma Make scaffold guide) is left untouched.

## Layout

```
.claude/
├── README.md                  ← this file
├── settings.json              ← permissions (allow safe checks, ask before platform edits, deny the formatter) + SessionStart hook
├── rules/                     ← loaded automatically by Claude Code
│   ├── project.md             ← EVERY session: identity, commands, never/always, map
│   ├── code-style.md          ← when touching src/**/*.{ts,tsx}
│   ├── design-system.md       ← src/**/*.tsx, src/index.css
│   ├── ux-and-accessibility.md← src/**/*.tsx
│   ├── brand-and-copy.md      ← src/**/*.tsx, src/data/**
│   ├── routing-and-state.md   ← store, App, pages, Header/Footer/CartDrawer/SmoothScroll
│   ├── commerce-and-data.md   ← data, lib, store, cart, pricing components and pages
│   ├── owner-decisions.md     ← src/**: standing product decisions from the build history
│   └── platform.md            ← vite/tsconfig/package/index.html/.figma/AGENTS/CLAUDE/public…
├── docs/                      ← deep reference, read on demand (start at docs/README.md)
│   ├── README.md · INDEX.md · kb-manifest.json · known-issues.md
│   ├── design-intent.md       ← what the owner asked for and why, decisions, open requests
│   ├── todo.md                ← backlog: gaps, unfinished requests, issues, placeholders (PROTO vs THEME)
│   ├── history/               figma-make-log.md: the 23 Figma Make prompts and responses, with status
│   ├── product-overview · architecture · platform-and-tooling · design-system · motion-and-interaction
│   ├── brand-voice-and-copy · code-conventions · ux-patterns-and-accessibility
│   ├── data-model · commerce-logic · shopify-integration
│   ├── pages/        home · category · product · cart-and-checkout · gift-cards · account-and-wishlist
│   ├── components/   global-and-shared · pdp-modules
│   └── features/     virtual-try-on · shoppable-video-and-atelier
├── skills/                    ← playbooks (auto-invoked by description, or /name)
│   ├── add-product · add-page · add-section · add-cart-option · build-ui-component
│   ├── write-brand-copy · verify-changes · update-knowledge-base
│   └── shopify-theme-port     ← manual only: /shopify-theme-port
├── agents/                    ← subagents: design-reviewer · commerce-auditor · copy-editor · kb-maintainer
├── scripts/
│   ├── kb-status.mjs          ← drift check (SessionStart hook) / --update rebuilds the manifest
│   └── kb-index.mjs           ← regenerates docs/INDEX.md
└── workflows/
    └── kb-refresh.js          ← /kb-refresh: multi-agent doc refresh (opt-in, token-heavy)
```

## What costs context, and when

| Piece | Loaded | Cost |
|---|---|---|
| `rules/project.md` | Every session | Every request (kept short) |
| Other `rules/*.md` | When Claude reads or edits a matching file | Only then |
| Skill descriptions | Session start | Small, every request (`shopify-theme-port` costs nothing until invoked) |
| Skill bodies, agents, docs | On use | Only when used |
| SessionStart hook | Session start | One `[kb] …` line |

## Everyday use

- **Normal work:** just ask. The rules load themselves, skills trigger on matching tasks, and Claude reads `docs/` when it needs depth.
- **Review a change:** ask for the `design-reviewer`, `commerce-auditor` or `copy-editor` agent.
- **Check it works:** say "verify" or run `/verify-changes`. This runs the typecheck and build, then a browser check.
- **Keep the docs true:** after changes, run `/update-knowledge-base` or ask the `kb-maintainer` agent. For large drift, run `/kb-refresh` (one agent per affected doc). `/kb-refresh all` re-audits everything and is expensive.

## Guards in `settings.json`

- **deny:** `pnpm run format`, `oxfmt` and `.figma/make/format`. oxfmt 0.2.0 rewrites every file and produces invalid TypeScript in `src/store.tsx`. Remove the rule only after adding a working formatter config.
- **ask:** edits to the platform-managed files `.figma/make/**`, `vite.config.ts`, `index.html`, `AGENTS.md` and `CLAUDE.md`.
- **allow:** typecheck, build, read-only git commands, and the two KB scripts.
- **hook:** `SessionStart` runs `node "$CLAUDE_PROJECT_DIR/.claude/scripts/kb-status.mjs"` through bash (Git Bash on Windows). It prints whether the docs are in sync and lists any changed files.

## Maintenance commands

```bash
node .claude/scripts/kb-status.mjs            # what changed since the docs were generated
node .claude/scripts/kb-index.mjs             # regenerate docs/INDEX.md after adding/removing files
node .claude/scripts/kb-status.mjs --update   # accept the current source as documented
```

## Notes

- **New folders.** Restart Claude Code (or run `/reload-skills`) after the `skills/` folder first appears. Check what loaded with `/context`.
- **Personal settings.** Put them in `.claude/settings.local.json`; keep it out of git.
- **Baseline.** The knowledge base was generated on 2026-10-15 from commit `db22872`. Its provenance and trust notes are in `docs/README.md`.
