import fs from 'node:fs'
import path from 'node:path'

/**
 * Audits the explicitly marked reading paragraphs in W01.
 *
 * The source page contains cards, labels, captions, and navigation as well as
 * the main reading path. `data-reading` makes that path explicit so the audit
 * can isolate exactly two adjacent prose paragraphs and ignore layout context.
 * This deterministic check is a local guard; the editorial skill still
 * requires independent human or model forward and backward questions.
 */

const PAGE_PATH = path.resolve('src/pages/weeks/1.astro')
const DATA_PATH = path.resolve('src/data/design-education.ts')
const STOP_WORDS = new Set(['這個', '這一', '一個', '可以', '不是', '也會', '以及', '下一'])
const CONNECTIVE_PATTERNS = [
  /^(答案|這門課|這張|這個|接下來|下次|下週|你會|先用|先把|拿)/,
  /(接著|回到|因此|所以|同一張|同一個|這週|這種觀察)/,
]

function stripMarkup(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dynamicReadingValues() {
  if (!fs.existsSync(DATA_PATH)) return {}
  const source = fs.readFileSync(DATA_PATH, 'utf8')
  const lessonOne = source.match(/1:\s*\{([\s\S]*?)\n\s*\},\n\s*2:/)?.[1]
  const eli5 = lessonOne?.match(/eli5:\s*'([^']+)'/)?.[1]
  return eli5 ? { 'designLesson.eli5': eli5 } : {}
}

function collectParagraphs(source) {
  const paragraphs = []
  const dynamicValues = dynamicReadingValues()
  const paragraphPattern = /<p\b([^>]*)>([\s\S]*?)<\/p>/g
  for (const match of source.matchAll(paragraphPattern)) {
    const attributes = match[1]
    if (!/\bdata-reading(?:\s|=|$)/.test(attributes)) continue
    const sourceName = attributes.match(/data-reading-source="([^"]+)"/)?.[1]
    const rawText = sourceName ? dynamicValues[sourceName] : match[2]
    const text = stripMarkup(rawText ?? match[2])
    if (!text || text.length < 12) continue
    const before = source.slice(0, match.index)
    paragraphs.push({
      text,
      line: before.split('\n').length,
    })
  }
  return paragraphs
}

function tokens(value) {
  const result = new Set(value.toLowerCase().match(/[a-z][a-z0-9/-]{1,}/g) ?? [])
  for (const match of value.matchAll(/[\u3400-\u9fff]+/g)) {
    for (let index = 0; index < match[0].length - 1; index += 1) {
      const bigram = match[0].slice(index, index + 2)
      if (!STOP_WORDS.has(bigram)) result.add(bigram)
    }
  }
  return result
}

function sharedTerms(first, second) {
  const firstTerms = tokens(first)
  return [...tokens(second)].filter((term) => firstTerms.has(term))
}

function hasExplicitBridge(text) {
  return CONNECTIVE_PATTERNS.some((pattern) => pattern.test(text))
}

function auditWindows(paragraphs) {
  const findings = []
  for (let index = 1; index < paragraphs.length; index += 1) {
    const upper = paragraphs[index - 1]
    const lower = paragraphs[index]
    if (sharedTerms(upper.text, lower.text).length > 0 || hasExplicitBridge(lower.text)) continue
    const location = `${upper.line} -> ${lower.line}`
    findings.push(
      {
        location,
        pair_location: location,
        direction: 'forward',
        expected_continuation_or_missing_premise:
          'The lower paragraph should answer a question, perform an operation, or state a consequence created by the upper paragraph.',
        reader_consequence: 'The reader cannot tell why the next visual decision follows.',
        repair:
          'Add the missing object, changed variable, output, or selection reason before moving on.',
        source_boundary:
          'Verify any new visual claim against the course source or label it as illustrative.',
      },
      {
        location,
        pair_location: location,
        direction: 'backward',
        expected_continuation_or_missing_premise:
          'The upper paragraph should supply every object, term, output, and causal link required by the lower paragraph.',
        reader_consequence:
          'The lower paragraph needs a heading, card, or unstated intention to make sense.',
        repair:
          'Define the missing premise in the upper paragraph or move the lower paragraph after that premise.',
        source_boundary:
          'Verify any new visual claim against the course source or label it as illustrative.',
      }
    )
  }
  return findings
}

function run() {
  console.log('Running two-paragraph reading-window audit for digital illustration W01...')
  if (!fs.existsSync(PAGE_PATH)) {
    console.error(`Missing ${PAGE_PATH}.`)
    process.exit(1)
  }

  const source = fs.readFileSync(PAGE_PATH, 'utf8')
  const paragraphs = collectParagraphs(source)
  const findings = []
  if (/\bELI5\b/.test(source)) {
    findings.push({
      location: 'W01 page',
      pair_location: 'W01 page',
      direction: 'backward',
      expected_continuation_or_missing_premise:
        'The explanation should be readable without a visible ELI5 badge.',
      reader_consequence:
        'The method is presented as a label instead of being carried by the prose.',
      repair: 'Remove the badge and write the concrete explanation directly.',
      source_boundary: 'Not applicable; this is an editorial style rule.',
    })
  }
  if (paragraphs.length < 2) {
    findings.push({
      location: 'W01 page',
      pair_location: 'W01 page:not-enough-paragraphs',
      direction: 'forward',
      expected_continuation_or_missing_premise:
        'The page should expose at least two marked learner-facing prose paragraphs.',
      reader_consequence: 'The continuity gate cannot inspect the reading path.',
      repair: "Mark the page's actual prose path with data-reading.",
      source_boundary: 'Not applicable; this is an audit coverage failure.',
    })
  }
  findings.push(...auditWindows(paragraphs))

  console.log(
    `  ${path.relative(process.cwd(), PAGE_PATH)}: ${paragraphs.length} marked paragraphs, ${Math.max(0, paragraphs.length - 1)} windows`
  )
  for (const finding of findings) {
    console.error(`  ✗ ${finding.location} [${finding.direction}]`)
    console.error(`    pair_location: ${finding.pair_location}`)
    console.error(
      `    expected_continuation_or_missing_premise: ${finding.expected_continuation_or_missing_premise}`
    )
    console.error(`    reader_consequence: ${finding.reader_consequence}`)
    console.error(`    repair: ${finding.repair}`)
    console.error(`    source_boundary: ${finding.source_boundary}`)
  }
  if (findings.length > 0) {
    console.error(`Reading-window audit failed: ${findings.length} finding(s).`)
    process.exit(1)
  }
  console.log(
    `✓ Reading-window audit passed: ${Math.max(0, paragraphs.length - 1)} windows are connected without a visible ELI5 label.`
  )
}

run()
