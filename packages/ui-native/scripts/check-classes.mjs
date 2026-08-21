/**
 * Verify that every Tailwind class written in source actually STYLES something
 * in the compiled bundle.
 *
 * WHY THIS EXISTS
 * ---------------
 * Uniwind resolves classes at build time and fails silently in two different
 * ways. Neither produces a warning, a type error, or a build failure. Both were
 * real bugs in this repo, and neither was visible any other route:
 *
 *   PURGED — the class never reaches the bundle at all. Tailwind auto-detects
 *   sources only from the CSS file's own directory, so `apps/mobile/app/` was
 *   invisible and every class used only in a route file was dropped.
 *
 *   INERT — the class reaches the bundle but resolves to
 *   `colorMix("unset", …)`. Uniwind declares theme colours as `unset` at build
 *   time and resolves them per-theme at runtime, so any `/alpha` modifier on a
 *   theme colour (`bg-primary/90`, `dark:bg-input/30`) mixes from nothing.
 *   Use an explicit ramp step instead (`active:bg-terracotta-600`).
 *
 * Checking only for PURGED would miss the entire second class of bug — the
 * broken alpha utilities are present in the table, just dead.
 *
 * USAGE
 * -----
 *   cd apps/mobile
 *   npx expo export -p android --no-bytecode --no-minify --output-dir /tmp/wassiya-export
 *   node ../../packages/ui-native/scripts/check-classes.mjs /tmp/wassiya-export
 *
 * `--no-bytecode` matters: the default `.hbc` output is Hermes bytecode and
 * cannot be read. Extra source roots may be passed after the export dir.
 *
 * Exits 1 if any class is purged or inert.
 */
import fs from 'fs'
import path from 'path'

const [, , exportDir, ...extraRoots] = process.argv

if (!exportDir) {
  console.error('usage: node check-classes.mjs <expo-export-dir> [extra source roots…]')
  process.exit(2)
}

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

const ROOTS = [
  ...['packages/ui-native/src', 'apps/mobile/app', 'apps/mobile/src'].map((p) =>
    path.join(REPO_ROOT, p)
  ),
  ...extraRoots.map((p) => path.resolve(p)),
].filter((p) => fs.existsSync(p))

/**
 * Variants that only exist on web. A class is web-only if ANY variant in its
 * chain is one of these — `dark:aria-invalid:ring-destructive/40` is web-only
 * because of `aria-invalid`, even though `dark:` compiles natively.
 */
const WEB_ONLY_VARIANTS = new Set([
  'web',
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'group-hover',
  'placeholder',
  'selection',
  'has',
  'aria-invalid',
  'first',
  'last',
])

/** Bare classes that only appear inside `Platform.select({ web: … })`. */
const EXPECTED_MISSING = new Set(['w-fit'])

/**
 * Known-inert baseline.
 *
 * These live in upstream React Native Reusables files that we keep verbatim so
 * they stay diffable against the registry (see the README's "Upstream ui/ files
 * that were changed" table). Each is a pressed/disabled tint that silently does
 * nothing — visually inert rather than broken, so they are not worth forking
 * upstream over. Anything NOT in this list is a new bug.
 *
 * If you touch one of these files anyway, replace the class with a ramp step
 * and delete the entry.
 */
const KNOWN_INERT = new Set([
  'active:bg-destructive/10', // ui/dropdown-menu.tsx
  'dark:active:bg-destructive/20', // ui/dropdown-menu.tsx
  'dark:active:bg-input/50', // ui/select.tsx
  'dark:bg-input/30', // ui/checkbox.tsx
  'dark:bg-input/80', // ui/switch.tsx
  'dark:border-foreground/10', // ui/tabs.tsx
  'bg-primary/20', // ui/progress.tsx
])

/** A token is only a utility if it has a `-`, `:` or `[` — drops English words. */
const LOOKS_LIKE_UTILITY = /[-:[]/

const UTILITY_PREFIX =
  /^(bg|text|border|rounded|p|px|py|ps|pe|pt|pb|m|mx|my|ms|me|mt|mb|gap|gap-x|gap-y|w|h|size|min-w|max-w|min-h|flex|items|justify|self|shrink|grow|opacity|shadow|font|tracking|leading|absolute|relative|inset|top|bottom|start|end|z|overflow|active|hover|web|native|dark)([-:]|$)/

const isWebOnly = (token) =>
  token
    .split(':')
    .slice(0, -1)
    .some((variant) => WEB_ONLY_VARIANTS.has(variant))

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

/**
 * Strip comments before scanning.
 *
 * Tailwind's own scanner does NOT do this, so a class name written in a
 * doc comment is compiled into the bundle for real. We must not treat those as
 * intentional usage — otherwise documenting `bg-primary/90` as a thing to avoid
 * would both compile it and exempt it from the inert check.
 */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')

// Collect candidates the way Tailwind does — any quoted run of class-like
// tokens — but from comment-free source.
const found = new Map()
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = stripComments(fs.readFileSync(file, 'utf8'))
    for (const match of src.matchAll(/['"`]([^'"`\n]{2,300})['"`]/g)) {
      for (const token of match[1].split(/\s+/)) {
        if (!token || !UTILITY_PREFIX.test(token)) continue
        if (!LOOKS_LIKE_UTILITY.test(token)) continue
        if (!/^[a-z0-9[\]().%/_:\-.]+$/i.test(token)) continue
        if (!found.has(token)) found.set(token, path.relative(REPO_ROOT, file))
      }
    }
  }
}

const bundleDir = path.join(exportDir, '_expo/static/js/android')
if (!fs.existsSync(bundleDir)) {
  console.error(`No android bundle under ${bundleDir}. Did the export run?`)
  process.exit(2)
}
const bundleFile = fs.readdirSync(bundleDir).find((f) => f.endsWith('.js'))
if (!bundleFile) {
  console.error(`Only bytecode found in ${bundleDir}. Re-export with --no-bytecode.`)
  process.exit(2)
}
const bundle = fs.readFileSync(path.join(bundleDir, bundleFile), 'utf8')

// Index every utility entry by its position, so a `colorMix("unset")` hit can
// be attributed to the class whose body it sits in.
const entries = []
for (const match of bundle.matchAll(/"([^"\\]{1,120})": \[\{/g)) {
  entries.push({ at: match.index, name: match[1] })
}
const emitted = new Set(entries.map((e) => e.name))

function classAt(position) {
  let lo = 0
  let hi = entries.length - 1
  let best = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (entries[mid].at <= position) {
      best = entries[mid].name
      lo = mid + 1
    } else hi = mid - 1
  }
  return best
}

const inertClasses = new Set()
for (const match of bundle.matchAll(/colorMix\("unset"/g)) {
  const owner = classAt(match.index)
  if (owner) inertClasses.add(owner)
}

const purged = []
const inert = []
let skipped = 0
for (const [token, file] of found) {
  if (isWebOnly(token) || EXPECTED_MISSING.has(token)) {
    skipped++
    continue
  }
  if (!emitted.has(token)) purged.push([token, file])
  else if (inertClasses.has(token) && !KNOWN_INERT.has(token)) inert.push([token, file])
}

console.log(
  `source candidates: ${found.size}   emitted utilities: ${emitted.size}   web-only skipped: ${skipped}`
)

if (!purged.length && !inert.length) {
  console.log('OK — every utility written in source compiled and resolves to a real value')
  process.exit(0)
}

if (purged.length) {
  console.error(`\n${purged.length} class(es) PURGED — never reached the bundle:\n`)
  for (const [token, file] of purged.sort()) console.error(`  ${token.padEnd(30)} ${file}`)
  console.error('\n  → a source directory is missing from @source in apps/mobile/src/global.css')
}

if (inert.length) {
  console.error(`\n${inert.length} class(es) INERT — compiled to colorMix("unset", …):\n`)
  for (const [token, file] of inert.sort()) console.error(`  ${token.padEnd(30)} ${file}`)
  console.error('\n  → an /alpha modifier on a theme colour. Use an explicit ramp step instead.')
}

process.exit(1)
