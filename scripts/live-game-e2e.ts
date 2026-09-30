/**
 * End-to-end check of the classroom game over a real WebSocket connection.
 *
 *   bun run check:live                    # against localhost:8787
 *   bun run check:live https://xxx.ngrok-free.app
 *
 * The unit check in live-game-check.ts reads the state machine directly. This
 * one drives the socket protocol the way a phone does, because the failures
 * that hurt in class live between the messages: a projector payload that leaks
 * the question, an answer that arrives before the round opens, a peer reason
 * that reaches a student who has not committed yet.
 */

const BASE = process.argv[2] ?? 'http://localhost:8787'
const WS = BASE.replace(/^http/, 'ws') + '/ws'

interface Client {
  label: string
  ready: Promise<void>
  send(type: string, payload?: Record<string, string>): void
  expect(type: string, ms?: number): Promise<any>
  expectWhere(type: string, predicate: (payload: any) => boolean, ms?: number): Promise<any>
  /** Every message of a type seen so far, without consuming anything. */
  every(type: string): any[]
  close(): void
}

function connect(label: string): Client {
  const socket = new WebSocket(WS)
  const inbox: { type: string; payload: any }[] = []
  const waiters: {
    type: string
    /** 回傳 true 表示這則訊息就是呼叫者要等的答案。 */
    predicate: (payload: any) => boolean
    resolve: (payload: any) => void
    /** setTimeout 在 Bun 的型別是 Timeout，在 DOM 的是 number。這裡兩邊都用得到。 */
    timer: ReturnType<typeof setTimeout>
  }[] = []
  let cursor = 0

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    inbox.push(message)
    // A message that does not satisfy the predicate is not an answer: keep
    // listening for the next one instead of failing on the first mismatch.
    for (let index = waiters.length - 1; index >= 0; index -= 1) {
      const waiter = waiters[index]
      if (waiter.type !== message.type || !waiter.predicate(message.payload)) continue
      clearTimeout(waiter.timer)
      waiters.splice(index, 1)
      waiter.resolve(message.payload)
    }
  })

  const client: Client = {
    label,
    ready: new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', () => reject(new Error(`${label}: 連線失敗`)), {
        once: true,
      })
    }),
    send(type, payload = {}) {
      socket.send(JSON.stringify({ type, payload }))
    },
    expect(type, ms = 8000) {
      return client.expectWhere(type, () => true, ms)
    },
    /**
     * Matching on the type alone is not enough. The server broadcasts a state
     * on every message, so the state from before an action is still buffered
     * when the state from after it arrives. Callers must say what they expect.
     */
    expectWhere(type, predicate, ms = 8000) {
      const buffered = inbox.slice(cursor).find((m) => m.type === type && predicate(m.payload))
      cursor = inbox.length
      if (buffered) return Promise.resolve(buffered.payload)
      return new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => {
          const seen = inbox.map((m) => m.type).join(', ') || '(沒有任何訊息)'
          reject(new Error(`${label}: 等不到符合條件的 ${type}；收到 ${seen}`))
        }, ms)
        waiters.push({ type, predicate, resolve, timer })
      })
    },
    every(type) {
      return inbox.filter((m) => m.type === type).map((m) => m.payload)
    },
    close() {
      socket.close()
    },
  }
  return client
}

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  if (!ok) failures += 1
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

console.log(`課堂遊戲端對端檢查（${BASE}）`)

const teacher = connect('老師端')
await teacher.ready
teacher.send('hello', { role: 'teacher' })
const { code } = await teacher.expect('teacher:code')
check('老師端拿到房號', /^\d{4}$/.test(code), code)

const projector = connect('投影端')
await projector.ready
projector.send('hello', { role: 'projector' })

const names = ['學生甲', '學生乙', '學生丙']
const students: Client[] = []
for (const name of names) {
  const student = connect(name)
  await student.ready
  student.send('hello', { role: 'student', code, name })
  await student.expect('student:joined')
  students.push(student)
}
check(`${names.length} 個學生進房`, true, names.join(' / '))

teacher.send('teacher:unlock')
// Wait until the students really see the round open. Unlock travels on the
// teacher's socket while answers travel on the students' ones, so sending
// straight away races and the server drops the answer without a word. In class
// this cannot happen: the option buttons only enable once the student sees
// locked=false.
const opened = await students[0].expectWhere('student:state', (state) => state.locked === false)
const options: { id: string }[] = opened.round?.options ?? []
check('學生端拿到選項', options.length >= 2, `${options.length} 個選項`)

// The wall is watched by the whole room, so the question must never cross the
// wire to it. Read the payload rather than the markup: hiding a field in CSS
// would still leave the copy in the network tab.
const wallStates = projector.every('projector:state')
check(
  '投影端拿不到題目、選項或理由',
  wallStates.length > 0 &&
    wallStates.every(
      (state) =>
        !('prompt' in state) &&
        !('context' in state) &&
        !('options' in state) &&
        !('reasons' in state)
    ),
  `欄位：${Object.keys(wallStates.at(-1) ?? {}).join(', ')}`
)

// Answers go in one at a time so the leak check can catch each moment the
// server is willing to speak. All three at once would only prove the state
// from before the first answer was recorded.
students[0].send('answer', { optionId: options[0].id, reason: '甲的理由：因為要留住注意力' })

// The student who just committed must still not be able to read reasons.
const afterOwnAnswer = await students[0].expectWhere(
  'student:state',
  (state) => state.locked === false && state.myReasons.length === 1
)
check(
  '自己送完作答，仍然看不到理由',
  afterOwnAnswer.reasons.length === 0,
  `reasons=${JSON.stringify(afterOwnAnswer.reasons)}`
)

students[1].send('answer', { optionId: options[1].id, reason: '乙的理由：因為比較好畫' })

// And the student who has not committed yet must not read anyone else's.
const whileWaiting = await students[2].expectWhere(
  'student:state',
  (state) => state.locked === false && state.myReasons.length === 0
)
check(
  '還沒作答的人看不到別人的理由',
  whileWaiting.reasons.length === 0,
  `reasons=${JSON.stringify(whileWaiting.reasons)}`
)

students[2].send('answer', { optionId: options[2].id, reason: '丙的理由：因為成本最低' })

// All three have committed and the round is still open. Every peer reason now
// exists on the server, so anything readable here is a leak.
const everyoneCommitted = await students[2].expectWhere(
  'student:state',
  (state) => state.locked === false && state.myReasons.length === 1
)
check(
  '三個人都作答、題目還開著，仍然讀不到任何理由',
  everyoneCommitted.reasons.length === 0,
  `reasons=${JSON.stringify(everyoneCommitted.reasons)}`
)

await Bun.sleep(300)
teacher.send('teacher:reveal')
// `results != null` alone is too loose: the room starts locked, so a tally of
// zero is already on the wire before anyone answers. Require the real count.
const revealed = await students[0].expectWhere(
  'student:state',
  (state) => state.results != null && state.results.total === names.length
)
check(
  '公布後學生端看到比例',
  revealed.results.bars.every((bar: any) => bar.count > 0),
  revealed.results.bars.map((bar: any) => `${bar.label}:${bar.count}`).join(' ')
)

const reason = revealed.reasons?.[0]?.reason
check('理由有送進匿名統計', Boolean(reason), reason ?? '(沒有理由)')

if (reason) {
  students[1].send('vote', { reason })
  const voted = await students[0].expectWhere('student:state', (state) =>
    state.reasons?.some((row: any) => row.reason === reason && row.votes >= 2)
  )
  const row = voted.reasons.find((item: any) => item.reason === reason)
  check('匿名理由可以被投票', (row?.votes ?? 0) >= 2, `${reason} 得到 ${row?.votes} 票`)

  teacher.send('teacher:spotlight', { reason })
  const lit = await projector.expectWhere('projector:state', (state) => state.spotlight != null)
  check('投影端可以單獨顯示一句理由', lit.spotlight?.reason === reason, reason)
}

const previousRound = revealed.round?.id
teacher.send('teacher:next')
const advanced = await students[0].expectWhere(
  'student:state',
  (state) => state.round?.id !== previousRound
)
check(
  '可以進入下一題',
  advanced.round?.id !== previousRound,
  `${previousRound} -> ${advanced.round?.id}`
)

teacher.send('teacher:export')
const exported = await teacher.expect('teacher:export')
check(
  '可以匯出學生作答',
  Array.isArray(exported.submissions) && exported.submissions.length === names.length,
  `${exported.submissions?.length} 筆 / ${exported.rounds?.length} 題`
)

for (const socket of [teacher, projector, ...students]) socket.close()

console.log(failures ? `\n端對端檢查失敗：${failures} 項` : '\n端對端檢查通過')
process.exit(failures ? 1 : 0)

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
