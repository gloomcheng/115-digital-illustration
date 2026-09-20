import fs from 'node:fs'
import path from 'node:path'

/**
 * Blocks AI-style prose from course copy.
 *
 * Scans learner-facing source (pages, layouts, components, data modules) for
 * banned phrasing and heading defects. Any finding fails the commit and the
 * quality gate; fix the copy, do not weaken the list.
 *
 * Deterministic check only: forced triplets, synonym cycling, and invented
 * chronology still need human review under the illustration-editorial skill.
 */

const SRC_DIRS = ['src/pages', 'src/layouts', 'src/components', 'src/data']
const EXTENSIONS = new Set(['.astro', '.ts'])

// [banned phrase, why it fails]
const BANNED_PHRASES = [
  ['出發前', 'travel metaphor for starting work; name the action instead'],
  ['讀者很自然', 'invents the reader thoughts'],
  ['你可能會好奇', 'invents the reader thoughts'],
  ['我們不禁要問', 'invents the reader thoughts'],
  ['你還分不清', 'diagnoses the reader instead of teaching'],
  ['你還不知道', 'diagnoses the reader instead of teaching'],
  ['第一部分', 'exposed scaffolding; name the decision instead'],
  ['第二部分', 'exposed scaffolding; name the decision instead'],
  ['查閱', 'audit-trail jargon in learner copy; attach the source link instead'],
]

const ELI5_PATTERN = /\bELI5\b/
const HEADING_PATTERN = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g
const DATA_FIELD_PATTERN = /\b(title|name|value): '([^']*)'/g

function walkFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, files)
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

function stripMarkup(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function auditFile(relativePath) {
  const findings = []
  const source = fs.readFileSync(relativePath, 'utf8')
  for (const [phrase, reason] of BANNED_PHRASES) {
    let fromIndex = 0
    for (;;) {
      const found = source.indexOf(phrase, fromIndex)
      if (found === -1) break
      findings.push({
        location: `${relativePath}:${lineOf(source, found)}`,
        match: phrase,
        repair: reason,
      })
      fromIndex = found + phrase.length
    }
  }
  const eli5 = source.match(ELI5_PATTERN)
  if (eli5 && eli5.index !== undefined) {
    findings.push({
      location: `${relativePath}:${lineOf(source, eli5.index)}`,
      match: 'ELI5',
      repair: 'method badge in learner copy; explain directly instead',
    })
  }
  for (const match of source.matchAll(HEADING_PATTERN)) {
    const text = stripMarkup(match[2])
    if (text.endsWith('。')) {
      findings.push({
        location: `${relativePath}:${lineOf(source, match.index)}`,
        match: text.slice(-12),
        repair: 'heading ends with 。; remove the terminal period',
      })
    }
  }
  for (const match of source.matchAll(DATA_FIELD_PATTERN)) {
    if (match[2].endsWith('。')) {
      findings.push({
        location: `${relativePath}:${lineOf(source, match.index)}`,
        match: `${match[1]}: ${match[2].slice(-12)}`,
        repair: 'heading-bound data field ends with 。; remove the terminal period',
      })
    }
  }
  return findings
}

function run() {
  console.log('Running AI-prose guard on course copy...')
  const root = process.cwd()
  const files = SRC_DIRS.flatMap((directory) => {
    const fullPath = path.join(root, directory)
    return fs.existsSync(fullPath) ? walkFiles(fullPath) : []
  })
  const findings = files.flatMap((file) => auditFile(path.relative(root, file)))
  console.log(`  scanned ${files.length} files`)
  for (const finding of findings) {
    console.error(`  ✗ ${finding.location} [${finding.match}]`)
    console.error(`    repair: ${finding.repair}`)
  }
  if (findings.length > 0) {
    console.error(`AI-prose guard failed: ${findings.length} finding(s).`)
    process.exit(1)
  }
  console.log('✓ AI-prose guard passed: no banned phrasing or heading defects.')
}

run()
