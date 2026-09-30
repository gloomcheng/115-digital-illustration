/**
 * Measures the rendered left edge of every lesson section.
 *
 * Source-level container classes can agree while the rendered result still
 * drifts, so this reads the computed geometry from a real browser and fails
 * when the text column does not line up.
 *
 * Needs a running dev server, because the build emits absolute asset paths that
 * a file:// page cannot load:
 *
 *   bun run dev            # terminal one
 *   bun run check:grid     # terminal two
 *
 * Set GRID_BASE when the dev server is not on its default origin:
 *
 *   GRID_BASE=http://localhost:4321/115-digital-illustration bun run check:grid
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9222
const VIEWPORT = { width: 1440, height: 900 }
const TOLERANCE = 2

const pages = process.argv.slice(2)
if (pages.length === 0) {
  console.error('usage: bun run check:grid <built page> [more pages]')
  process.exit(2)
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-'))
const chrome = Bun.spawn(
  [
    CHROME,
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdout: 'ignore', stderr: 'ignore' }
)

async function waitForDevtools() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (response.ok) return
    } catch {
      // Chrome is still starting.
    }
    await Bun.sleep(250)
  }
  throw new Error('Chrome DevTools did not start')
}

interface PendingCall {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
}

class Devtools {
  #socket!: WebSocket
  #id = 0
  #pending = new Map<number, PendingCall>()

  static async open() {
    const version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
    const socket = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
    const instance = new Devtools()
    instance.#socket = socket
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      const pending = instance.#pending.get(message.id)
      if (!pending) return
      instance.#pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
    return instance
  }

  send<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string
  ): Promise<T> {
    this.#id += 1
    const id = this.#id
    const payload: Record<string, unknown> = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    this.#socket.send(JSON.stringify(payload))
    return new Promise<T>((resolve, reject) =>
      this.#pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
    )
  }

  close() {
    this.#socket.close()
  }
}

const MEASURE = `(() => {
  const rows = [];
  for (const section of document.querySelectorAll('main > section')) {
    const sectionBox = section.getBoundingClientRect();
    if (sectionBox.width >= window.innerWidth - 1) continue;
    // The content column is the outermost wrapper that has a max-width. Reading
    // the heading instead would only see the section padding, which is the same
    // everywhere and hides a wrapper that is narrower than its neighbours.
    const wrapper = [...section.querySelectorAll('div')].find((el) => {
      const style = getComputedStyle(el);
      return style.maxWidth !== 'none' && el.querySelector('h1,h2,h3,p');
    });
    if (!wrapper) continue;
    // The hero is deliberately wider: its photograph is full-bleed.
    if (wrapper.querySelector('h1')) continue;
    const heading = wrapper.querySelector('h2,h3');
    const box = wrapper.getBoundingClientRect();
    rows.push({
      label: (heading ? heading.textContent : '').trim().slice(0, 20),
      left: Math.round(box.left),
      width: Math.round(box.width),
    });
  }
  return rows;
})()`

let exitCode = 0

try {
  await waitForDevtools()
  const devtools = await Devtools.open()

  console.log(`Measuring rendered left edges at ${VIEWPORT.width}px...`)

  for (const page of pages) {
    // Measure over http, not file://. The build emits absolute asset paths
    // under BASE_URL, so a file:// page silently loses its stylesheet and every
    // container measures as full width.
    const url = page.startsWith('http')
      ? page
      : process.env.GRID_BASE
        ? `${process.env.GRID_BASE.replace(/\/$/, '')}/${page.replace(/^dist\//, '').replace(/index\.html$/, '')}`
        : `file://${path.resolve(page)}`
    const { targetId } = await devtools.send<{ targetId: string }>('Target.createTarget', { url })
    const { sessionId } = await devtools.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId,
      flatten: true,
    })

    await devtools.send(
      'Emulation.setDeviceMetricsOverride',
      {
        width: VIEWPORT.width,
        height: VIEWPORT.height,
        deviceScaleFactor: 1,
        mobile: false,
      },
      sessionId
    )
    await Bun.sleep(400)

    const result = await devtools.send<{ result: { value?: unknown } }>(
      'Runtime.evaluate',
      { expression: MEASURE, returnByValue: true },
      sessionId
    )
    const measured = result.result?.value
    const rows: { label: string; left: number; width: number }[] = Array.isArray(measured)
      ? measured
      : []

    const lefts = [...new Set(rows.map((row) => row.left))].sort((a, b) => a - b)
    const reference = lefts[0]

    console.log(`  ${page}`)
    for (const row of rows) {
      const drift = row.left - reference
      const kind =
        Math.abs(drift) <= TOLERANCE ? 'aligned' : `OFF by ${drift > 0 ? '+' : ''}${drift}px`
      console.log(
        `    ${row.label.padEnd(24)} left=${String(row.left).padStart(4)} width=${String(row.width).padStart(4)}  ${kind}`
      )
    }

    if (lefts.some((left) => Math.abs(left - reference) > TOLERANCE)) {
      console.error(`  FAIL ${page} — content columns start at ${lefts.join(', ')}`)
      exitCode = 1
    }

    await devtools.send('Target.closeTarget', { targetId })
  }

  devtools.close()
} catch (error) {
  console.error(`grid check failed: ${error instanceof Error ? error.message : String(error)}`)
  exitCode = 1
} finally {
  chrome.kill()
  fs.rmSync(profile, { recursive: true, force: true })
}

if (exitCode === 0) console.log('✓ Grid check passed: every reading section shares one left edge.')
process.exit(exitCode)
