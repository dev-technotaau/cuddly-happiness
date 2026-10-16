#!/usr/bin/env node
// Regenerates .claude/docs/INDEX.md: every project file with line count, purpose, exports,
// internal imports, importers and the doc that describes it.
//
//   node .claude/scripts/kb-index.mjs                 (from the repo root)
//   node .claude/scripts/kb-index.mjs --root <repo> --out <file>
//
// Purposes live in PURPOSE below; add a line when you add a file (unknown files are flagged).

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}
const root = resolve(arg('--root') ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..'))
const out = resolve(arg('--out') ?? join(root, '.claude', 'docs', 'INDEX.md'))
const posix = (p) => p.split(sep).join('/')

const PURPOSE = {
  '.figma/make/analyze-routes': 'Figma Make hook: runs `figma-analyze routes`',
  '.figma/make/deploy': 'Figma Make hook: `pnpm run build`, then `figma make deploy --build-dir dist`',
  '.figma/make/deploy-preview': 'Figma Make hook: development-mode build (inline sourcemaps, unminified) + deploy-preview',
  '.figma/make/dev': 'Figma Make hook: `pnpm run dev`',
  '.figma/make/dev.json': 'Figma Make watch config: reinstall + restart when package.json / pnpm-lock.yaml change',
  '.figma/make/format': 'Figma Make hook: `pnpm run format` (oxfmt — corrupts code, see known-issues KI-001)',
  '.figma/make/install': 'Figma Make hook: `pnpm install --prefer-offline --no-frozen-lockfile`',
  '.figma/make/langserver': 'Figma Make hook: vtsls TypeScript language server',
  '.figma/make/site.json': 'Site metadata (description, robots noindex, a11y flags) injected into index.html by the Vite plugin',
  '.gitattributes': 'Git LFS / binary handling rules for asset file types',
  '.gitignore': 'Ignores node_modules, dist, env files, logs and platform agent folders',
  '.mise.toml': 'Toolchain pins: Node 22, pnpm 10.34.3',
  'AGENTS.md': 'Figma Make scaffold guide: structure, Tailwind v4 setup, code-quality rules',
  'CLAUDE.md': 'Root Claude instructions: imports AGENTS.md',
  'index.html': 'Vite HTML shell with figma:* comment slots and #root',
  'package.json': 'Scripts (dev / build / preview / format) and dependencies',
  'pnpm-lock.yaml': 'pnpm lockfile (v9 format)',
  'public/favicon.svg': 'Default Figma Make favicon (not brand art)',
  'tsconfig.json': 'Strict TS, ES2020 lib, bundler resolution, @/* paths, noEmit',
  'vite.config.ts': 'Vite: React, Tailwind v4, four Figma Make plugins, @ alias, dev server on $PORT (8443)',
  'src/App.tsx': 'Root: provider tree, layout shell, hash-route switch, film grain',
  'src/main.tsx': 'Entry: mounts <App/> in StrictMode and imports index.css',
  'src/store.tsx': 'Global store (React Context): hash router + href, cart, cart meta, wishlist, recent, account, currency, persistence',
  'src/index.css': 'Fonts, design tokens (:root), global utilities, keyframes, Lenis CSS',
  'src/vite-env.d.ts': 'Vite client type reference',
  'src/lib/shopify.ts': 'Shopify Ajax-cart payload mapping for gift-card lines (placeholder variant IDs)',
  'src/lib/share.ts': 'Share helpers: tagged share URLs, channel composer URLs, clipboard with fallback, tns:share event',
  'src/components/share/ShareSheet.tsx': 'Share dialog: device share with photo, link, drop a hint, channel composers; bottom sheet on phones',
  'src/components/share/ShareButton.tsx': 'Share trigger: lazy-loads the share sheet and returns focus on close',
  'src/data/catalog.ts': 'Catalog: types, categories, metals, products, price/format helpers, personalization, rentals, try-on kinds',
  'src/data/costing.ts': 'Cost model behind the PDP price-transparency breakdown',
  'src/data/giftcards.ts': 'Gift-card designs, denominations, ranges, currency conversion, codes and the local ledger',
  'src/data/media.ts': 'Shoppable video list and review media pools (Mixkit placeholders)',
  'src/data/tax.ts': 'Canadian province/territory sales-tax rates',
  'src/pages/Home.tsx': 'Home page: hero and editorial sections',
  'src/pages/Category.tsx': 'Collection page: hero, sort, product grid, films, recently viewed',
  'src/pages/Product.tsx': 'PDP: gallery, configurator (metal / size / engraving / personalization / rental), add to bag, lower sections',
  'src/pages/Cart.tsx': 'Full bag page: lines, gift options, tax estimate, upsell',
  'src/pages/Checkout.tsx': 'Simulated checkout: contact and shipping, gift-card redemption, tax, confirmation',
  'src/pages/GiftCards.tsx': 'Gift-card builder, balance checker, FAQ',
  'src/pages/Wishlist.tsx': 'Saved pieces: try-on, copy link, add all to bag',
  'src/pages/Account.tsx': 'Simulated sign-in / register and account dashboard',
  'src/pages/Atelier.tsx': 'House story, bespoke process, atelier films, appointment form',
  'src/components/Header.tsx': 'Sticky header: announcement marquee, nav, mega menu, currency, icons, mobile menu',
  'src/components/Marquee.tsx': 'Seamless marquee on the Web Animations API: constant speed, eased hover stop, off-screen pause',
  'src/components/Footer.tsx': 'Footer: newsletter, link columns, salon details, legal line',
  'src/components/CartDrawer.tsx': 'Slide-in bag drawer',
  'src/components/BackToTop.tsx': 'Floating back-to-top: progress bezel, scroll-up expansion, obstacle lift, tone sampling, timed return trip',
  'src/components/HomeHero.tsx': 'Home hero',
  'src/components/Price.tsx': 'Formats an amount in the active currency (spec face, tabular figures)',
  'src/components/ProductCard.tsx': 'Product card link: hover image, badge, wishlist, try-on chip, price',
  'src/components/RecentlyViewed.tsx': 'Recently viewed section (default) and compact strip (RecentlyViewedStrip)',
  'src/components/SmoothScroll.tsx': 'Lenis smooth scroll on the GSAP ticker; scroll-to-top on route change; getLenis()',
  'src/components/WishButton.tsx': 'Wishlist heart toggle',
  'src/components/lineDetails.ts': 'Human-readable option lines for cart lines (bag + checkout)',
  'src/components/useReveal.ts': 'GSAP scroll reveal / clip reveal / parallax for data attributes',
  'src/components/cart/CartLineItem.tsx': 'One bag line: image, details, quantity, remove, try-on',
  'src/components/cart/CartUpsell.tsx': '"Pairs beautifully with" quick-add suggestions',
  'src/components/cart/GiftOptions.tsx': 'Gift wrap, gift message, gift receipt and order note (CartMeta)',
  'src/components/cart/RewardProgress.tsx': 'Care-kit reward threshold progress',
  'src/components/cart/UndoToast.tsx': '6-second undo toast for removed lines',
  'src/components/cart/useCartTotals.ts': 'Bag totals: merch, gift cards, subtotal, count, installment, reward',
  'src/components/giftcard/BalanceChecker.tsx': 'Gift-card balance lookup form',
  'src/components/giftcard/GiftCardArt.tsx': 'Credit-card proportioned gift-card artwork',
  'src/components/home/CategoryIndex.tsx': 'Home: numbered category index',
  'src/components/home/FourCs.tsx': 'Home: diamond 4Cs education (tabs)',
  'src/components/home/GiftFinder.tsx': 'Home: gift finder filters and results',
  'src/components/home/MakingScroll.tsx': 'Home: scroll-driven making-of sequence',
  'src/components/home/PressStrip.tsx': 'Home: press strip',
  'src/components/home/SectionHeader.tsx': 'Shared editorial section header (index, eyebrow, title, aside)',
  'src/components/home/Services.tsx': 'Home: services',
  'src/components/home/SocialGrid.tsx': 'Home: social grid',
  'src/components/home/Testimonials.tsx': 'Home: rotating testimonials',
  'src/components/home/Treasured.tsx': 'Home: tabbed product showcase',
  'src/components/home/TryOnFeature.tsx': 'Home: virtual try-on promo',
  'src/components/home/VisitSalon.tsx': 'Home: salon visit invitation',
  'src/components/home/WatchSpotlight.tsx': 'Home: watch spotlight',
  'src/components/pdp/Accordion.tsx': 'Disclosure list (PDP info, FAQs, gift-card FAQ)',
  'src/components/pdp/CompleteTheLook.tsx': 'Paired pieces and "add the set"',
  'src/components/pdp/CraftStory.tsx': 'Craft narrative section',
  'src/components/pdp/Gallery.tsx': 'PDP image gallery and lightbox',
  'src/components/pdp/Personalizer.tsx': 'Nameplate / initial / monogram personalization with live preview',
  'src/components/pdp/PriceBreakdown.tsx': 'Price-transparency breakdown and tax split',
  'src/components/pdp/ProductFAQ.tsx': 'Product FAQ section',
  'src/components/pdp/RentalCalendar.tsx': 'Rental date, time-slot and delivery picker',
  'src/components/pdp/Reviews.tsx': 'Reviews: summary, filters, media, write-a-review',
  'src/components/pdp/RingSize.tsx': 'Ring size selector and size guide',
  'src/components/pdp/StickyBar.tsx': 'Sticky purchase bar',
  'src/components/tryon/JewelryOverlay.tsx': 'SVG jewelry drawn per try-on kind and metal',
  'src/components/tryon/TryOnButton.tsx': 'Opens the try-on studio (outline / solid / chip / icon / link)',
  'src/components/tryon/TryOnProvider.tsx': 'Try-on context; lazy-loads the studio',
  'src/components/tryon/TryOnStudio.tsx': 'Camera / photo try-on studio',
  'src/components/video/ShoppableVideos.tsx': 'Autoplaying film rail',
  'src/components/video/VideoViewer.tsx': 'Full-screen shoppable video player',
  'src/components/video/useInViewPlay.ts': 'Plays a muted video while at least 60% visible',
}

const DOC_RULES = [
  [/^src\/(main|App|store)\.tsx$/, 'architecture.md'],
  [/^src\/index\.css$/, 'design-system.md'],
  [/^src\/components\/share\/|^src\/lib\/share\.ts$/, 'features/sharing.md'],
  [/^src\/lib\//, 'shopify-integration.md'],
  [/^src\/data\//, 'data-model.md'],
  [/^src\/pages\/Home\.tsx$|^src\/components\/HomeHero\.tsx$|^src\/components\/home\//, 'pages/home.md'],
  [/^src\/pages\/Category\.tsx$/, 'pages/category.md'],
  [/^src\/pages\/Product\.tsx$/, 'pages/product.md'],
  [/^src\/components\/pdp\//, 'components/pdp-modules.md'],
  [/^src\/pages\/(Cart|Checkout)\.tsx$|^src\/components\/CartDrawer\.tsx$|^src\/components\/cart\/|^src\/components\/lineDetails\.ts$/, 'pages/cart-and-checkout.md'],
  [/^src\/pages\/GiftCards\.tsx$|^src\/components\/giftcard\//, 'pages/gift-cards.md'],
  [/^src\/pages\/(Account|Wishlist)\.tsx$/, 'pages/account-and-wishlist.md'],
  [/^src\/components\/tryon\//, 'features/virtual-try-on.md'],
  [/^src\/components\/video\/|^src\/pages\/Atelier\.tsx$/, 'features/shoppable-video-and-atelier.md'],
  [/^src\/components\/(SmoothScroll\.tsx|useReveal\.ts)$/, 'motion-and-interaction.md'],
  [/^src\/components\//, 'components/global-and-shared.md'],
  [/.*/, 'platform-and-tooling.md'],
]
const docFor = (p) => DOC_RULES.find(([re]) => re.test(p))[1]

function listFiles() {
  const run = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const all = [...run(['ls-files', '-z']).split('\0'), ...run(['ls-files', '-z', '--others', '--exclude-standard']).split('\0')]
  return [...new Set(all)].filter(Boolean).filter((p) => !p.startsWith('.claude/') && existsSync(join(root, p))).sort()
}

const files = listFiles()
const isCode = (p) => /\.(tsx?|css)$/.test(p) && p.startsWith('src/')
const text = Object.fromEntries(files.map((p) => [p, readFileSync(join(root, p), 'utf8')]))
const loc = (p) => text[p].replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length

function exportsOf(p) {
  if (!/\.tsx?$/.test(p)) return []
  const src = text[p]
  const out = []
  for (const m of src.matchAll(/^export default function (\w+)/gm)) out.push(`${m[1]} (default${/^use/.test(m[1]) ? ' hook' : /^[A-Z]/.test(m[1]) ? ' component' : ' fn'})`)
  for (const m of src.matchAll(/^export default (?!function)(\w+)/gm)) out.push(`${m[1]} (default)`)
  for (const m of src.matchAll(/^export function (\w+)/gm)) out.push(`${m[1]}()`)
  for (const m of src.matchAll(/^export const (\w+)/gm)) out.push(m[1])
  for (const m of src.matchAll(/^export (?:interface|type) (\w+)/gm)) out.push(`${m[1]} (type)`)
  return out
}

function resolveImport(from, spec) {
  const base = normalize(join(dirname(from), spec))
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const cand = posix(base + ext)
    if (text[cand] !== undefined) return cand
  }
  return null
}

const imports = {}
for (const p of files.filter(isCode)) {
  const specs = [...text[p].matchAll(/(?:from |import\()\s*'(\.{1,2}\/[^']+)'/g), ...text[p].matchAll(/^import '(\.{1,2}\/[^']+)'/gm)].map((m) => m[1])
  imports[p] = [...new Set(specs.map((s) => resolveImport(p, s)).filter(Boolean))]
}
const importedBy = {}
for (const [p, deps] of Object.entries(imports)) for (const d of deps) (importedBy[d] ??= []).push(p)

const short = (p) => p.replace(/^src\//, '').replace(/\.(tsx?|css)$/, '')
const cell = (s) => String(s).replace(/\|/g, '\\|')

const groups = {}
for (const p of files) {
  const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '(repo root)'
  ;(groups[dir] ??= []).push(p)
}
const order = Object.keys(groups).sort((a, b) => (a === '(repo root)' ? -1 : b === '(repo root)' ? 1 : a.localeCompare(b)))

const missing = files.filter((p) => !PURPOSE[p])
const hubs = Object.entries(importedBy).sort((a, b) => b[1].length - a[1].length).slice(0, 12)
const totalLoc = files.filter(isCode).reduce((s, p) => s + loc(p), 0)

let md = `# File index — every file, its role, exports and dependencies

Generated by \`node .claude/scripts/kb-index.mjs\` (do not edit by hand; edit PURPOSE in the script and re-run). ${files.length} files; ${files.filter(isCode).length} source files under src/ totalling ${totalLoc.toLocaleString('en-CA')} lines. "Doc" is the knowledge doc that describes the file in depth (paths relative to \`.claude/docs/\`).

Scope: every git-tracked and untracked-but-not-ignored file outside \`.claude/\`

## Entry chain & layering

\`index.html\` → \`src/main.tsx\` → \`src/App.tsx\` → providers (\`src/store.tsx\`, \`src/components/tryon/TryOnProvider.tsx\`, \`src/components/SmoothScroll.tsx\`) → \`Header\` / page (\`src/pages/*\`) / \`Footer\` / \`CartDrawer\`.

Layers: \`src/data/*\` (no app imports) → \`src/store.tsx\` & \`src/lib/shopify.ts\` → components (\`src/components/**\`) → \`src/pages/*\` → \`src/App.tsx\`. Inside \`src/components\`, root-level shared pieces and the feature folders (\`home\`, \`pdp\`, \`cart\`, \`tryon\`, \`video\`, \`giftcard\`) import each other freely (e.g. \`ProductCard\` → \`tryon/TryOnButton\`, \`lineDetails\` → \`pdp/Personalizer\`, \`RecentlyViewed\` → \`home/SectionHeader\`, \`CartDrawer\` → \`cart/*\`); pages never import other pages.

## Hub modules (most imported)

| Module | Imported by |
|---|---|
${hubs.map(([p, by]) => `| \`${p}\` | ${by.length} files |`).join('\n')}

`
for (const dir of order) {
  md += `## ${dir}\n\n| File | Lines | Purpose | Exports | Imports | Imported by | Doc |\n|---|---|---|---|---|---|---|\n`
  for (const p of groups[dir]) {
    const exp = exportsOf(p)
    const imp = imports[p] ?? []
    const by = importedBy[p] ?? []
    md += `| \`${p.slice(p.lastIndexOf('/') + 1)}\` | ${p === 'pnpm-lock.yaml' ? '—' : loc(p)} | ${cell(PURPOSE[p] ?? '**(no purpose recorded — add it to kb-index.mjs)**')} | ${cell(exp.join(', ') || '—')} | ${cell(imp.map(short).join(', ') || '—')} | ${cell(by.map(short).join(', ') || '—')} | [${docFor(p)}](${docFor(p)}) |\n`
  }
  md += '\n'
}
md += `## Related docs
- [README.md](README.md) — the knowledge-base map (start here)
- [architecture.md](architecture.md) — how the modules fit together at runtime
- [code-conventions.md](code-conventions.md) — naming and export conventions behind this table
`

writeFileSync(out, md)
console.log(`[kb-index] Wrote ${posix(out)}: ${files.length} files.${missing.length ? ` Missing purposes: ${missing.join(', ')}` : ''}`)
