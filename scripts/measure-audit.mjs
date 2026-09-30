/**
 * Checks that lesson content sits inside one consistent container width.
 *
 * A section that silently uses a narrower wrapper than its neighbours moves
 * the left edge, so the page reads as misaligned. The week navigation is
 * deliberately narrow and is exempt.
 *
 *   bun run check:measure
 */

import fs from 'node:fs'
import path from 'node:path'

const SRC_DIRS = ['src/pages/weeks']
const EXPECTED_WIDTH = 'max-w-6xl'
const EXEMPT_TAG = 'nav'
// The hero is intentionally wider than the reading column: it spans to the
// viewport edge so the image reads as full-bleed.
const EXEMPT_WIDTHS = ['max-w-7xl']

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (entry.name.endsWith('.astro')) {
      files.push(full)
    }
  }
  return files
}

function auditFile(relativePath) {
  const source = fs.readFileSync(relativePath, 'utf8')
  const findings = []

  // Only the wrapper directly inside a <section> positions the text column.
  const sectionPattern = /<section\b[^>]*>([\s\S]*?)<\/section>/g
  for (const found of source.matchAll(sectionPattern)) {
    const openTag = source.slice(0, found.index).match(/<section\b[^>]*$/)?.[0] ?? ''
    if (openTag.includes(EXEMPT_TAG)) continue

    // The hero section is full-bleed by design.
    if (openTag.includes('relative isolate')) continue

    const wrapper = found[1].match(/<div class="([^"]*max-w-[0-9]xl[^"]*)"/)
    if (!wrapper) continue
    if (wrapper[1].includes(EXPECTED_WIDTH)) continue
    if (EXEMPT_WIDTHS.some((width) => wrapper[1].includes(width))) continue

    const line = source.slice(0, found.index).split('\n').length
    findings.push({ location: `${relativePath}:${line}`, found: wrapper[1] })
  }
  return findings
}

console.log(`Running container-width audit on lesson pages (expecting ${EXPECTED_WIDTH})...`)
const root = process.cwd()
const files = SRC_DIRS.flatMap((directory) => {
  const full = path.join(root, directory)
  return fs.existsSync(full) ? walk(full) : []
})

const findings = files.flatMap((file) => auditFile(path.relative(root, file)))
console.log(`  scanned ${files.length} pages`)

for (const finding of findings) {
  console.error(
    `  FAIL ${finding.location} — "${finding.found}" is narrower than ${EXPECTED_WIDTH}`
  )
}

if (findings.length) {
  console.error(`Container-width audit failed: ${findings.length} section(s) off the grid.`)
  process.exit(1)
}
console.log('✓ Container-width audit passed: every lesson section shares one left edge.')
