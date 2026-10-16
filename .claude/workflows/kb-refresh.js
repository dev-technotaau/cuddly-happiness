export const meta = {
  name: 'kb-refresh',
  description: 'Bring .claude/docs back in sync with the source: detect drift, refresh + fact-check each affected doc (one agent per doc), regenerate INDEX.md and the manifest',
  whenToUse: 'Only when the user asks. After larger code changes, when the SessionStart "[kb]" line reports many changed files. Pass args "all" for a full re-audit (expensive: one agent per doc, ~22 agents). For one or two docs, prefer the update-knowledge-base skill in the main session.',
  phases: [
    { title: 'Detect', detail: 'run kb-status and map changed files to docs' },
    { title: 'Refresh', detail: 'one agent per affected doc: update from source and fact-check' },
    { title: 'Finalize', detail: 'rules/skills fixes, INDEX.md, manifest rebuild' },
  ],
}

const FULL = args === 'all' || (Array.isArray(args) && args.includes('all'))

const DOC_RULES = `Knowledge-base conventions (see "Conventions for these docs" in .claude/docs/README.md):
- Every fact comes from the current source code; never guess. State ambiguity explicitly.
- Exact identifiers, prop types, constant values, Tailwind class recipes and VERBATIM user-facing copy (character-exact, incl. ’ – — × ·).
- Reference code as repo-relative paths in inline code plus symbol names. Never cite line numbers.
- No whole-file pastes; excerpts of 15 lines max where the exact shape matters.
- Opinions, risks and recommendations only under "## Notes & gotchas" (or sections explicitly labelled as recommendations).
- Keep the doc's structure: "# Title", summary, "Scope:" line, body, "## Notes & gotchas", "## Related docs" (relative links to sibling docs only).`

const DETECT_SCHEMA = {
  type: 'object',
  properties: {
    kb_status_output: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: 'string' }, kind: { type: 'string' }, docs: { type: 'array', items: { type: 'string' } } },
        required: ['file', 'kind', 'docs'],
      },
    },
    docs_to_refresh: { type: 'array', items: { type: 'string' }, description: 'Doc paths relative to .claude/docs, e.g. pages/product.md' },
    all_docs: { type: 'array', items: { type: 'string' }, description: 'Every .md under .claude/docs except README.md, INDEX.md, design-intent.md, todo.md and history/*' },
  },
  required: ['kb_status_output', 'changes', 'docs_to_refresh', 'all_docs'],
}

const REFRESH_SCHEMA = {
  type: 'object',
  properties: {
    doc: { type: 'string' },
    corrections_and_updates: { type: 'array', items: { type: 'string' } },
    rule_changes_needed: { type: 'array', items: { type: 'string' }, description: 'Normative rules in .claude/rules/*.md or .claude/skills/*/SKILL.md that are now wrong or missing' },
    unresolved: { type: 'array', items: { type: 'string' } },
  },
  required: ['doc', 'corrections_and_updates', 'rule_changes_needed', 'unresolved'],
}

phase('Detect')
const detect = await agent(
  `Run "node .claude/scripts/kb-status.mjs" from the repository root (Bash) and capture its output verbatim.
Parse every reported change (modified / added / deleted) with the docs it maps to.
For ADDED files (no docs listed), decide which existing doc(s) under .claude/docs should describe them, using .claude/docs/README.md and .claude/docs/INDEX.md (same folder or feature area).
List every .md file under .claude/docs (Glob) except README.md, INDEX.md, design-intent.md, todo.md and anything under history/ as all_docs (paths relative to .claude/docs).
docs_to_refresh = the de-duplicated union of docs mapped to all changes (relative to .claude/docs; exclude README.md, INDEX.md, design-intent.md, todo.md and history/). Do not edit anything.`,
  { label: 'detect-drift', phase: 'Detect', schema: DETECT_SCHEMA },
)

const targets = FULL ? detect.all_docs : detect.docs_to_refresh
log(FULL ? `Full re-audit of ${targets.length} docs` : `${detect.changes.length} changed file(s) -> ${targets.length} doc(s) to refresh`)
if (!targets.length && !detect.changes.length) return { inSync: true, kbStatus: detect.kb_status_output }

const changeList = detect.changes.map((c) => `- ${c.kind} ${c.file}`).join('\n') || '- (none: full audit requested)'

phase('Refresh')
const results = await parallel(
  targets.map((doc) => () =>
    agent(
      `Refresh ONE knowledge-base document so it matches the current source code exactly, then fact-check it.

DOCUMENT: .claude/docs/${doc} (edit in place; edit nothing else)
PROJECT FILES CHANGED SINCE THE KB WAS GENERATED:
${changeList}

PROCEDURE
1. Read the document. Its "Scope:" line lists the source files it describes; read ALL of them in full, plus any changed file above that belongs to this document's area.
2. Update every statement that no longer matches the code; add coverage for new exports, props, state, behaviour, copy and styles; remove descriptions of things that no longer exist.
3. Then fact-check ${FULL ? 'EVERY claim in the document' : 'the sections you touched and anything else you notice'} against the source (identifiers, values, class strings, verbatim copy, behaviours, conditions, ordering, counts). Fix errors; delete or mark "(unverified)" anything the code does not support.

${DOC_RULES}

In rule_changes_needed, list any normative rule in .claude/rules/*.md or .claude/skills/*/SKILL.md that is now wrong or missing (quote it and say why).`,
      { label: `refresh:${doc}`, phase: 'Refresh', schema: REFRESH_SCHEMA },
    ),
  ),
)

const done = results.filter(Boolean)
const ruleNotes = done.flatMap((r) => r.rule_changes_needed ?? [])

phase('Finalize')
const finalize = await agent(
  `Finish a knowledge-base refresh for this repository.

PROJECT FILES CHANGED:
${changeList}

RULE/SKILL CHANGES REPORTED BY DOC REFRESHERS:
${ruleNotes.map((n) => `- ${n}`).join('\n') || '- (none)'}

TASKS
1. Apply each reported rule/skill change to .claude/rules/*.md or .claude/skills/*/SKILL.md after confirming it against the source. Keep rules short and imperative.
2. If files were added or removed, add/remove their entry in the PURPOSE map of .claude/scripts/kb-index.mjs, then run "node .claude/scripts/kb-index.mjs" to regenerate .claude/docs/INDEX.md.
3. If a doc was added or renamed, update the doc map in .claude/docs/README.md and any "Related docs" links pointing to it.
4. Run "node .claude/scripts/kb-status.mjs --update" then "node .claude/scripts/kb-status.mjs" and include both outputs in your answer.
Return a short plain-text report of what changed.`,
  { label: 'finalize', phase: 'Finalize' },
)

return { changes: detect.changes, refreshed: done.map((r) => ({ doc: r.doc, updates: r.corrections_and_updates, unresolved: r.unresolved })), finalize }
