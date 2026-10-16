---
name: update-knowledge-base
description: Keep .claude/docs, .claude/rules and the skills in sync with the code after changes. Finds the affected docs, updates them with exact facts, regenerates INDEX.md and rebuilds the drift manifest. Use after changing behaviour, data, copy, styling or file structure, or when the SessionStart "[kb]" line reports changed files.
---

# Update the knowledge base

The docs follow the conventions in `.claude/docs/README.md` ("Conventions for these docs"):
- Facts come from the code.
- Copy is quoted verbatim.
- Code is referenced by repo-relative path and symbol, never by line number.
- Opinions go only under `## Notes & gotchas`.

## Steps

1. **Find the drift.** Run `node .claude/scripts/kb-status.mjs`. It lists each changed, added or deleted file and the docs that mention it. You can also look up any file in `.claude/docs/INDEX.md` (the "Doc" column).
2. **Update each affected doc.** Use targeted edits; don't re-read whole long docs.
   - Grep the doc for the changed symbols, props, copy strings or class names.
   - Read the changed source and fix every statement that no longer matches. Add new exports, props, state, behaviour and copy. Remove things that no longer exist.
   - Keep the doc's structure: summary, `Scope:` line, body, `## Notes & gotchas`, `## Related docs`.
3. **Update the normative layer** if a rule changed, for example:
   - a new token or z-index level → `.claude/rules/design-system.md`
   - a new route step or store API → `routing-and-state.md`
   - a new pricing or `lineKey` field → `commerce-and-data.md`
   - Also update any skill that encodes the old steps (`.claude/skills/*/SKILL.md`).
   - Keep `.claude/rules/project.md` short, because it loads in every session.
4. **Files added, removed or renamed:**
   - Edit `PURPOSE` in `.claude/scripts/kb-index.mjs`. If the file belongs to a new area or doc, also edit `DOC_RULES`.
   - Run `node .claude/scripts/kb-index.mjs` to regenerate `.claude/docs/INDEX.md`. Never hand-edit INDEX.md.
   - For a new doc, add it to the map in `.claude/docs/README.md` and to the "Related docs" of its siblings.
5. **Issues.** Record bugs you found but did not fix in `.claude/docs/known-issues.md` as the next `KI-0xx`. Remove the ones you fixed, and tick or update the matching item in `.claude/docs/todo.md`.
6. **Seal it.** Run `node .claude/scripts/kb-status.mjs --update` to rebuild the manifest. Then run `node .claude/scripts/kb-status.mjs`; it should report "in sync".

## Scale

- **One to a few docs:** do it inline, as above.
- **Many docs drifted:** suggest `/kb-refresh` to the user. Don't start it yourself. It runs one agent per affected doc, so it costs tokens; `/kb-refresh all` re-audits all 22 docs.
