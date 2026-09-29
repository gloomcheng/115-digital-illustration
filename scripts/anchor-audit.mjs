/**
 * Checks that in-page navigation links resolve to a real element id.
 *
 * A dead anchor silently does nothing, so it is invisible in review and only
 * shows up when a reader clicks it mid-lesson. This scans the course copy and
 * fails when a link target does not exist in the same file.
 *
 *   bun run check:anchors
 */

import fs from 'node:fs'
import path from 'node:path'

const SRC_DIRS = ['src/pages']
const EXTENSIONS = new Set(['.astro'])

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files
}

function auditFile(relativePath) {
  const source = fs.readFileSync(relativePath, 'utf8')
  const findings = []
  const ids = new Set([...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]))
  for (const match of source.matchAll(/href="#([^"]+)"/g)) {
    const target = match[1]
    if (ids.has(target)) continue
    const line = source.slice(0, match.index).split('\n').length
    findings.push({ location: `${relativePath}:${line}`, target })
  }
  return findings
}

console.log('Running in-page anchor audit on course copy...')
const root = process.cwd()
const files = SRC_DIRS.flatMap((directory) => {
  const full = path.join(root, directory)
  return fs.existsSync(full) ? walk(full) : []
})

const findings = files.flatMap((file) => auditFile(path.relative(root, file)))
console.log(`  scanned ${files.length} files`)

for (const finding of findings) {
  console.error(`  FAIL ${finding.location} — no element with id="${finding.target}"`)
}

if (findings.length) {
  console.error(`Anchor audit failed: ${findings.length} dead link(s).`)
  process.exit(1)
}
console.log('✓ Anchor audit passed: every in-page link resolves.')
