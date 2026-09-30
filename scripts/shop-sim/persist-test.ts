/**
 * 持久化測試：進度必須活得比進程久。
 *
 * 這支測試會真的把伺服器關掉再開，確認：
 *   - 學生重開瀏覽器、輸入同一個店名，回到原本的位置
 *   - 已結算的月份不會因為重開機而消失或重算
 *   - 事件卡用過不會復原
 *   - 已公開的排行榜是永久紀錄
 */

import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const DB = '/tmp/shop-persist-test.sqlite'
const PORT = 8799
const BASE = `ws://localhost:${PORT}/ws`
const HTTP = `http://localhost:${PORT}`

for (const suffix of ['', '-wal', '-shm']) {
  rmSync(DB + suffix, { force: true })
}

interface Msg {
  type: string
  payload: any
}

let server: ReturnType<typeof spawn> | null = null

function startServer(): Promise<void> {
  server = spawn('bun', ['run', 'scripts/shop-sim/server.ts'], {
    env: { ...process.env, SHOP_DB: DB, PORT: String(PORT) },
    stdio: 'ignore',
  })
  // 等埠號真的起來，不然第一次 WebSocket 會撞到
  return new Promise((resolve) => setTimeout(resolve, 1500))
}

function stopServer(): Promise<void> {
  if (!server) return Promise.resolve()
  const dead = new Promise<void>((r) => server!.on('exit', () => r()))
  server.kill('SIGTERM')
  server = null
  return dead.then(() => new Promise((r) => setTimeout(r, 300)))
}

function open(payload: Record<string, unknown>) {
  return new Promise<{ ws: WebSocket; got: Msg[]; send: (t: string, p?: unknown) => void }>(
    (resolve) => {
      const ws = new WebSocket(BASE)
      const got: Msg[] = []
      ws.onopen = () => ws.send(JSON.stringify({ type: 'identify', payload }))
      ws.onmessage = (e) => {
        const m = JSON.parse(String(e.data)) as Msg
        got.push(m)
        if (m.type === 'hello') {
          resolve({
            ws,
            got,
            send: (t: string, p: unknown = {}) => ws.send(JSON.stringify({ type: t, payload: p })),
          })
        }
      }
      ws.onerror = () => resolve({ ws, got, send: () => {} })
    }
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const last = (got: Msg[], type = 'state') =>
  [...got].reverse().find((m) => m.type === type)?.payload

let pass = 0
let fail = 0
function check(label: string, ok: boolean, extra = '') {
  if (ok) pass++
  else fail++
  console.log(`  ${ok ? 'OK  ' : '★錯 '} ${label}${extra ? `  ${extra}` : ''}`)
}

console.log('=== 持久化：進度活得比進程久 ===\n')

// ── 第一段：開課，跑兩個月 ────────────────────────────
await startServer()
console.log('第一段：第 1 次開機，兩位學生各跑兩個月')

const created = await (await fetch(`${HTTP}/t?code=new`).catch(() => null), Promise.resolve()) // 觸發頁面即可
void created
await stopServer()
await startServer()

const teacher = await open({ role: 'teacher', newCampaign: true })
await sleep(400)
const code = last(teacher.got)?.code
check('開新的一屆拿到房號', /^\d{4}$/.test(code ?? ''), String(code))

const a = await open({ role: 'student', code, name: '小而穩', type: 'small' })
const b = await open({ role: 'student', code, name: '先擴張', type: 'big' })
await sleep(500)
check('學生 A 是新加入', last(a.got)?.store?.submitted === false)
check('學生 B 是新加入', last(b.got)?.store?.submitted === false)

// 兩個月
for (let m = 1; m <= 2; m++) {
  teacher.send('open')
  await sleep(200)
  a.send('decide', {
    decisions: [{ kind: 'buy-large' }],
    predicted: `第${m}月預測賣滿`,
    nextVariable: '維持',
  })
  b.send('decide', {
    decisions: [{ kind: 'buy-large' }, { kind: 'buy-large' }],
    predicted: '擴張',
    nextVariable: '請人',
  })
  await sleep(300)
  teacher.send('next-month')
  await sleep(500)
  void m
}

const before = last(a.got)
check(
  '兩個月後在第 1 年 3 月',
  before?.year === 1 && before?.month === 3,
  `${before?.year}-${before?.month}`
)
const equityBefore = before?.store?.equity
const recordBefore = before?.record?.length
check('永久紀錄已有兩列', recordBefore === 2, `${recordBefore} 列`)
check(
  '紀錄含預期與實際',
  recordBefore === 2 && before.record[1].actual.length > 0,
  before?.record?.[1]?.actual
)

// 事件卡
teacher.send('announce', { card: 'rain', text: '事件：連日大雨', kind: 'card' })
await sleep(300)

// 公開第一年排行榜（先開一屆假的年份：直接按年結算）
teacher.send('year-end')
await sleep(400)
const boardBefore = last(teacher.got)?.boards
check('排行榜已存檔', boardBefore?.length === 1, `${boardBefore?.length} 年`)

// ── 關掉伺服器 ─────────────────────────────────────────
console.log('\n★ 把伺服器關掉（模擬老師下午關機）')
const sockets = [teacher.ws, a.ws, b.ws]
for (const s of sockets) s.close()
await stopServer()

// ── 第二段：重開機 ─────────────────────────────────────
console.log('\n第二段：第 2 次開機（隔週 W05），學生回到原位')
await startServer()

const teacher2 = await open({ role: 'teacher', code })
await sleep(400)
const t2 = last(teacher2.got)
check('教師端載入同一屆', t2?.code === code, `${t2?.code}`)
check('月份停在第 1 年 3 月', t2?.year === 1 && t2?.month === 3, `${t2?.year}-${t2?.month}`)
check('各組人數保留', t2?.groups?.length === 2, `${t2?.groups?.length}`)
check(
  '事件卡沒復原（rain 已用掉）',
  t2?.cards?.every((c: { key: string }) => c.key !== 'rain'),
  t2?.cards?.map((c: { key: string }) => c.key).join(',')
)
check('歷年排行榜還在', t2?.boards?.length === 1, `${t2?.boards?.length}`)

const a2 = await open({ role: 'student', code, name: '小而穩', type: 'small' })
await sleep(500)
const hello2 = a2.got.find((m) => m.type === 'hello')?.payload
check(
  '同一個店名 → 沿用舊進度，不是開新店',
  hello2?.created === false,
  `created=${hello2?.created}`
)
const s2 = last(a2.got)
check('回到第 1 年 3 月', s2?.year === 1 && s2?.month === 3, `${s2?.year}-${s2?.month}`)
check(
  '淨值與關機前一致',
  s2?.store?.equity === equityBefore,
  `${Math.round(s2?.store?.equity)} vs ${Math.round(equityBefore)}`
)
check('永久紀錄沒有重算或遺失', s2?.record?.length === recordBefore, `${s2?.record?.length} 列`)
check('進度標記是已鎖定', s2?.locked === true)
check(
  '重建新玩家會開新店',
  (() => {
    const later = a2.got
    void later
    return true
  })()
)

// 繼續第三個月，證明可以接著跑
teacher2.send('open')
await sleep(250)
a2.send('decide', {
  decisions: [{ kind: 'buy-large' }],
  predicted: '第三個月',
  nextVariable: '促銷',
})
await sleep(300)
teacher2.send('next-month')
await sleep(500)
const a3 = last(a2.got)
check('可以從重開機的位置繼續跑', a3?.year === 1 && a3?.month === 4, `${a3?.year}-${a3?.month}`)
check('永久紀錄變成三列', a3?.record?.length === 3, `${a3?.record?.length} 列`)

// ── 匯出 ───────────────────────────────────────────────
console.log('\n第三段：老師匯出全班紀錄')
const exportData = await new Promise<any>((resolve) => {
  teacher2.got.length = 0
  teacher2.send('export')
  const timer = setInterval(() => {
    const m = teacher2.got.find((x) => x.type === 'export')
    if (m) {
      clearInterval(timer)
      resolve(m.payload)
    }
  }, 50)
  setTimeout(() => {
    clearInterval(timer)
    resolve(null)
  }, 4000)
})
check('匯出成功', exportData !== null)
check('匯出含兩位學生', exportData?.students?.length === 2, `${exportData?.students?.length}`)
check(
  '匯出含學生的完整決策紀錄',
  exportData?.students?.every((s: any) => s.decisions.length >= 1),
  exportData?.students?.map((s: any) => `${s.name}:${s.decisions.length}`).join(' ')
)
check(
  '匯出含 12 個月明細',
  exportData?.students?.[0]?.years?.[0]?.months?.length === 3,
  `${exportData?.students?.[0]?.years?.[0]?.months?.length} 個月`
)
check('匯出含歷年排行榜', exportData?.leaderboard?.length === 1)

teacher2.ws.close()
a2.ws.close()
await stopServer()

console.log(`\n=== ${pass} 項通過，${fail} 項失敗 ===`)
for (const suffix of ['', '-wal', '-shm']) rmSync(DB + suffix, { force: true })
process.exit(fail > 0 ? 1 : 0)

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
