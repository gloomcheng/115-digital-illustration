/**
 * End-to-end check for the live game server.
 *
 * Drives a real teacher socket, a projector socket, and two student sockets
 * through a full round, then asserts the state each role should receive.
 * Start the server first: bun run live
 *
 *   bun run check:live
 */

import { liveRounds } from '../src/data/live-rounds'
// Type-only import, erased at compile time: this does not start the server.
import type { ExportPayload, ProjectorState, StudentState, TeacherState } from './live-game'

const BASE = Bun.env.LIVE_BASE ?? 'ws://localhost:8787'
const failures: string[] = []

type Role = 'student' | 'projector' | 'teacher'

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`)
    return
  }
  failures.push(name)
  console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`)
}

interface Peer {
  ready: Promise<void>
  send: (type: string, payload?: Record<string, string>) => void
  /** Waits for the next frame of `type` and narrows its payload to T. */
  waitFor: <T>(type: string, timeoutMs?: number) => Promise<T>
  /**
   * The server pushes a fresh state on every change, so a bare waitFor can
   * return a stale snapshot. Waits for the first frame of `type` that matches.
   */
  waitUntil: <T>(type: string, predicate: (payload: T) => boolean, timeoutMs?: number) => Promise<T>
  close: () => void
}

interface Waiter {
  type: string
  predicate: (payload: unknown) => boolean
  resolve: (payload: unknown) => void
}

interface Socket {
  ready: Promise<void>
  inbox: ServerEnvelope[]
  waiters: Waiter[]
  pump: () => void
}

/** One frame off the wire, narrowed by the caller that knows which type it wants. */
interface ServerEnvelope {
  type: string
  payload: unknown
}

function connect(role: Role): Peer {
  const ws = new WebSocket(`${BASE}/ws`)
  const socket: Socket = { ready: Promise.resolve(), inbox: [], waiters: [], pump: () => {} }
  socket.ready = new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) return resolve()
    ws.addEventListener('open', () => resolve(), { once: true })
    ws.addEventListener('error', () => reject(new Error(`cannot reach ${BASE}`)), { once: true })
  })

  socket.pump = () => {
    // Scan repeatedly: fulfilling one waiter can unblock nothing, but a message
    // may satisfy more than one waiter in the same drain.
    for (let guard = 0; guard < 32 && socket.waiters.length; guard += 1) {
      const waiterIndex = socket.waiters.findIndex((waiter) =>
        socket.inbox.some(
          (message) => message.type === waiter.type && waiter.predicate(message.payload)
        )
      )
      if (waiterIndex < 0) break
      const waiter = socket.waiters.splice(waiterIndex, 1)[0]
      const match = socket.inbox.findIndex(
        (message) => message.type === waiter.type && waiter.predicate(message.payload)
      )
      waiter.resolve(socket.inbox.splice(match, 1)[0].payload)
    }
  }

  ws.addEventListener('message', (event) => {
    socket.inbox.push(JSON.parse(String(event.data)) as ServerEnvelope)
    socket.pump()
  })

  const waitUntil = <T>(
    type: string,
    predicate: (payload: T) => boolean,
    timeoutMs = 3000
  ): Promise<T> => {
    const scan = (): T | null => {
      for (let index = 0; index < socket.inbox.length; index += 1) {
        if (socket.inbox[index].type !== type) continue
        if (!predicate(socket.inbox[index].payload as T)) continue
        return socket.inbox.splice(index, 1)[0].payload as T
      }
      return null
    }
    const immediate = scan()
    if (immediate !== null) return Promise.resolve(immediate)
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timeout waiting for ${type} matching predicate`)),
        timeoutMs
      )
      socket.waiters.push({
        type,
        predicate: predicate as (payload: unknown) => boolean,
        resolve: (payload) => {
          clearTimeout(timer)
          resolve(payload as T)
        },
      })
      socket.pump()
    })
  }

  return {
    ready: socket.ready,
    send: (type, payload = {}) => {
      if (ws.readyState !== WebSocket.OPEN) throw new Error(`socket for ${role} is not open`)
      ws.send(JSON.stringify({ type, payload }))
    },
    waitFor: <T>(type: string, timeoutMs = 3000) => waitUntil<T>(type, () => true, timeoutMs),
    waitUntil,
    close: () => ws.close(),
  }
}

async function open(peer: Peer, role: Role, extra: { code?: string; name?: string } = {}) {
  // The socket must finish its handshake before the first send, because the
  // server waits for `hello` before it assigns the peer a role and a room.
  await peer.ready
  peer.send('hello', { role, ...extra })
  return peer
}

const teacher = await open(connect('teacher'), 'teacher')
const { code } = await teacher.waitFor<{ code: string }>('teacher:code')
console.log(`\nLive game check against ${BASE}, room ${code}\n`)

check('teacher receives a four-digit room code', /^\d{4}$/.test(code), code)

const projector = await open(connect('projector'), 'projector')
await projector.waitFor('projector:state')
const alice = await open(connect('student'), 'student', { code, name: 'alice' })
const bob = await open(connect('student'), 'student', { code, name: 'bob' })

const aliceJoined = await alice.waitFor<{ clientId: number }>('student:joined')
const bobJoined = await bob.waitFor<{ clientId: number }>('student:joined')
check('each student gets a distinct id', aliceJoined.clientId !== bobJoined.clientId)

const joined = await teacher.waitUntil<TeacherState>('teacher:state', (state) => state.joined === 2)
check('teacher sees two joined students', joined.joined === 2, `got ${joined.joined}`)

const projectorState = await projector.waitFor<ProjectorState>('projector:state')
check(
  'projector never receives the prompt text',
  !('prompt' in projectorState) && !('round' in projectorState),
  Object.keys(projectorState).join(',')
)
check(
  'projector receives the axis label',
  projectorState.axis === joined.round?.axis,
  projectorState.axis
)

teacher.send('teacher:goto', { index: '0' })
teacher.send('teacher:unlock')
const unlocked = await alice.waitUntil<StudentState>(
  'student:state',
  (state) => state.locked === false
)
check('unlock reaches the student', unlocked.locked === false, `locked=${unlocked.locked}`)
check(
  'student sees prompt and options',
  Boolean(unlocked.round?.prompt) && (unlocked.round?.options.length ?? 0) >= 3
)
check('student cannot see results while open', unlocked.results === null)

alice.send('answer', { optionId: 'a', reason: '因為半秒認出來最省事' })
bob.send('answer', { optionId: 'a', reason: '因為半秒認出來最省事' })
bob.send('answer', { optionId: 'b', reason: '三秒才能看見表情' })

const bobState = await bob.waitUntil<StudentState>(
  'student:state',
  (state) => state.myAnswer === 'b'
)
check(
  'a later answer replaces the earlier one',
  bobState.myAnswer === 'b',
  `got ${bobState.myAnswer}`
)
check(
  'only one reason is kept per student',
  bobState.myReasons.length === 1,
  `${bobState.myReasons.length}`
)

teacher.send('teacher:reveal')
const locked = await alice.waitUntil<StudentState>(
  'student:state',
  (state) => state.locked === true && state.results?.total === 2
)
check('reveal locks the round', locked.locked === true)
check(
  'reveal shows the tally of the round just answered',
  locked.results !== null && locked.results.total === 2,
  `total=${locked.results?.total}`
)

const share = locked.results?.bars.find((bar) => bar.id === 'a')
check(
  'tally counts both answers for option a',
  share?.count === 1 && share.share === 50,
  JSON.stringify(share)
)

alice.send('vote', { reason: '因為半秒認出來最省事' })
teacher.send('teacher:spotlight', { reason: '因為半秒認出來最省事' })
const projected = await projector.waitUntil<ProjectorState>(
  'projector:state',
  (state) => state.spotlight?.reason === '因為半秒認出來最省事'
)
check(
  'spotlight sentence reaches the projector',
  projected.spotlight?.reason === '因為半秒認出來最省事'
)

const aliceVoted = await alice.waitUntil<StudentState>('student:state', (state) =>
  state.myVotes.includes('因為半秒認出來最省事')
)
check(
  'student sees their own vote',
  aliceVoted.myVotes.includes('因為半秒認出來最省事'),
  aliceVoted.myVotes.join('|')
)

const votedReasons = aliceVoted.reasons.find((reason) => reason.reason === '因為半秒認出來最省事')
check(
  'vote count is reflected in the reason list',
  votedReasons?.votes === 2,
  `${votedReasons?.votes}`
)

teacher.send('teacher:export')
const exported = await teacher.waitFor<ExportPayload>('teacher:export')
check(
  'export covers every round',
  exported.rounds.length === liveRounds.length,
  `${exported.rounds.length} of ${liveRounds.length}`
)
check(
  'export carries the submissions',
  exported.submissions.length === 2,
  `${exported.submissions.length}`
)
check(
  'exported first round sums to two answers',
  exported.rounds[0].results.total === 2,
  `${exported.rounds[0].results.total}`
)

const before = await teacher.waitFor<TeacherState>('teacher:state')
const from = before.roundIndex
teacher.send('teacher:next')
const advanced = await teacher.waitUntil<TeacherState>(
  'teacher:state',
  (state) => state.roundIndex === from + 1
)
check(
  'next advances one round',
  advanced.roundIndex === from + 1,
  `${from} -> ${advanced.roundIndex}`
)
check(
  'the new round starts with an empty tally',
  advanced.results?.total === 0,
  `total=${advanced.results?.total}`
)

teacher.send('teacher:next')
const after = await teacher.waitUntil<TeacherState>(
  'teacher:state',
  (state) => state.roundIndex === from + 2
)
check('next advances twice', after.roundIndex === from + 2, `${from} -> ${after.roundIndex}`)

// A rejected goto produces no state change, so the newest frame the teacher has
// is the one that already arrived. Give the message a turn to land, then read
// the tail of what arrived.
teacher.send('teacher:goto', { index: '99' })
const ignored = await teacher.waitUntil<TeacherState>(
  'teacher:state',
  (state) => state.roundIndex === from + 2 && state.locked === true
)
check(
  'out-of-range goto leaves the round alone',
  ignored.roundIndex === from + 2,
  `${ignored.roundIndex}`
)

teacher.send('teacher:goto', { index: '0' })
const reopened = await teacher.waitUntil<TeacherState>(
  'teacher:state',
  (state) => state.roundIndex === 0 && state.locked === false
)
check('goto reopens the round', reopened.locked === false, `locked=${reopened.locked}`)

const badRoom = await open(connect('student'), 'student', { code: '0000', name: 'x' })
const rejection = await badRoom.waitFor<{ text: string }>('error:message', 2000).catch(() => null)
check('unknown room code is rejected', rejection !== null)

teacher.send('teacher:goto', { index: '0' })
await teacher.waitUntil<TeacherState>('teacher:state', (state) => state.roundIndex === 0)
teacher.send('teacher:show-evidence', { on: 'true' })
const paid = await teacher.waitUntil<TeacherState>(
  'teacher:state',
  (state) => state.showEvidence === true
)
check('teacher can reveal the supporting data point', paid.showEvidence === true)
check(
  'the round carries a real source for the teacher',
  typeof paid.teaches === 'string' && paid.teaches.length > 0
)

for (const peer of [teacher, projector, alice, bob, badRoom]) peer.close()

console.log('')
if (failures.length) {
  console.error(`live game check failed: ${failures.length} finding(s)`)
  process.exit(1)
}
console.log('live game check passed: teacher, projector, and two students completed a round.')
