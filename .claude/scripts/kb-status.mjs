#!/usr/bin/env node
// Knowledge-base freshness check for .claude/docs.
//
//   node .claude/scripts/kb-status.mjs           -> report drift (used by the SessionStart hook)
//   node .claude/scripts/kb-status.mjs --update  -> rebuild .claude/docs/kb-manifest.json after the docs are updated
//
// The manifest stores a content hash (CRLF-normalised) of every tracked project file and the docs that
// mention it, so drift is detected whether or not changes are committed.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const docsDir = join(root, '.claude', 'docs')
const manifestPath = join(docsDir, 'kb-manifest.json')
const toPosix = (p) => p.split(sep).join('/')

/** Project files the knowledge base describes. The .claude folder itself and lockfile noise are excluded. */
const isTracked = (p) =>
  !p.startsWith('.claude/') && !p.startsWith('node_modules/') && !p.startsWith('dist/') && p !== 'pnpm-lock.yaml' && p !== '.gitattributes'

function listFiles() {
  try {
    const run = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const tracked = run(['ls-files', '-z']).split('\0')
    const untracked = run(['ls-files', '-z', '--others', '--exclude-standard']).split('\0')
    return [...new Set([...tracked, ...untracked])].filter(Boolean).filter((p) => existsSync(join(root, p))).filter(isTracked).sort()
  } catch {
    // No git: fall back to walking src/ plus the root config files.
    const out = []
    const walk = (dir) => {
      for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
        const rel = dir ? `${dir}/${entry.name}` : entry.name
        if (entry.isDirectory()) walk(rel)
        else out.push(rel)
      }
    }
    if (existsSync(join(root, 'src'))) walk('src')
    for (const f of ['index.html', 'package.json', 'tsconfig.json', 'vite.config.ts', 'AGENTS.md', 'CLAUDE.md']) if (existsSync(join(root, f))) out.push(f)
    return out.filter(isTracked).sort()
  }
}

const hashFile = (p) => createHash('sha1').update(readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 12)

function listDocs(dir = docsDir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listDocs(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  )
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'unknown'
  }
}

function update() {
  const docs = listDocs().map((d) => ({ name: toPosix(relative(docsDir, d)), text: readFileSync(d, 'utf8') }))
  const files = {}
  for (const p of listFiles()) {
    // INDEX.md lists every file and history/ is an append-only log; map only the docs that describe a file in depth.
    const covering = docs.filter((d) => d.name !== 'INDEX.md' && d.name !== 'todo.md' && !d.name.startsWith('history/') && d.text.includes(p)).map((d) => d.name)
    files[p] = { hash: hashFile(p), docs: covering }
  }
  const manifest = { version: 1, generatedAt: new Date().toISOString().slice(0, 10), gitHead: gitHead(), files }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const uncovered = Object.entries(files).filter(([, f]) => f.docs.length === 0).map(([p]) => p)
  console.log(`[kb] Manifest rebuilt: ${Object.keys(files).length} files, ${docs.length} docs, git ${manifest.gitHead}.`)
  if (uncovered.length) console.log(`[kb] Files not described by any doc (INDEX.md aside): ${uncovered.join(', ')}`)
}

function check() {
  if (!existsSync(manifestPath)) {
    console.log('[kb] No .claude/docs/kb-manifest.json found. Run: node .claude/scripts/kb-status.mjs --update')
    return
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const known = manifest.files ?? {}
  const current = listFiles()
  const changed = []
  for (const p of current) {
    if (!known[p]) changed.push({ p, kind: 'added', docs: [] })
    else if (known[p].hash !== hashFile(p)) changed.push({ p, kind: 'modified', docs: known[p].docs })
  }
  for (const p of Object.keys(known)) if (!current.includes(p)) changed.push({ p, kind: 'deleted', docs: known[p].docs })

  const stamp = `generated ${manifest.generatedAt} at ${manifest.gitHead}`
  if (changed.length === 0) {
    console.log(`[kb] .claude/docs is in sync with the source (${stamp}; ${current.length} files tracked). Start from .claude/docs/README.md.`)
    return
  }
  const MAX = 25
  console.log(`[kb] ${changed.length} project file(s) changed since the knowledge base was ${stamp}. Docs covering them may be stale; trust the source over the docs for these:`)
  for (const c of changed.slice(0, MAX)) console.log(`  ${c.kind.padEnd(8)} ${c.p}${c.docs.length ? ` -> ${c.docs.join(', ')}` : ''}`)
  if (changed.length > MAX) console.log(`  ...and ${changed.length - MAX} more`)
  console.log('[kb] After changing behaviour, follow the update-knowledge-base skill to refresh the affected docs and rebuild the manifest.')
}

process.argv.includes('--update') ? update() : check()
