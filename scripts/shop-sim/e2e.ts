/**
 * 端到端測試：老師開房 → 兩組學生加入 → 決策 → 結算 → 排行榜。
 * 驗證三件事：學生看不到別人、老師看得到全部、數字對得上。
 */

const BASE = process.env.SHOP_URL ?? 'ws://localhost:8788/ws'

interface Msg {
  type: string
  payload: any
}

function open(role: string, extra: Record<string, unknown> = {}) {
  return new Promise<{ ws: WebSocket; got: Msg[]; send: (t: string, p?: unknown) => void }>(
    (resolve) => {
      const ws = new WebSocket(BASE)
      const got: Msg[] = []
      ws.onopen = () => ws.send(JSON.stringify({ type: 'identify', payload: { role, ...extra } }))
      ws.onmessage = (e) => {
        const m = JSON.parse(String(e.data)) as Msg
        got.push(m)
        if (m.type === 'hello' || m.type === 'banner') {
          resolve({
            ws,
            got,
            send: (t: string, p: unknown = {}) => ws.send(JSON.stringify({ type: t, payload: p })),
          })
        }
      }
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

console.log('=== 端到端：三角色協作 ===\n')

// 老師按「開新的一屆」。房號由伺服器發，老師端拿到。
const teacher = await open('teacher', { newCampaign: true, campaignName: 'e2e' })
await sleep(400)
const hello = teacher.got.find((m) => m.type === 'hello')?.payload
const code = hello?.campaign?.code
check('老師開一屆拿到房號', /^\d{4}$/.test(String(code)), String(code))
check('新的一屆從第 1 年第 1 月開始', hello?.campaign?.year === 1 && hello?.campaign?.month === 1)
check('預設鎖定（學生不能馬上動手）', hello?.campaign?.locked === true)

const s1 = await open('student', { code, name: '小而穩', type: 'small' })
const s2 = await open('student', { code, name: '先擴張', type: 'big' })
await sleep(500)

const v1 = last(s1.got)
check('學生端載入自己的店', v1?.store?.name === '小而穩', v1?.store?.name)
check('小而穩產能 3,800', v1?.store?.capacity === 3_800, String(v1?.store?.capacity))
check('小而穩 1 人 1 工位', v1?.store?.staff === 1 && v1?.store?.stations === 1)

const v2 = last(s2.got)
check('先擴張產能 22,800', v2?.store?.capacity === 22_800, String(v2?.store?.capacity))
check('先擴張 6 人 6 工位', v2?.store?.staff === 6 && v2?.store?.stations === 6)

check('學生 1 看不到「先擴張」', !JSON.stringify(v1).includes('先擴張'))
check('學生 2 看不到「小而穩」', !JSON.stringify(v2).includes('小而穩'))

const tv = last(teacher.got)
check('老師端看得到兩組', tv?.groups?.length === 2, String(tv?.groups?.length))
check(
  '老師端看得到產能',
  tv?.groups?.every((g: any) => g.capacity > 0)
)

check('預設鎖定', v1?.locked === true)
teacher.send('open')
await sleep(300)
check('老師開放後學生解鎖', last(s1.got)?.locked === false)

s1.send('decide', {
  decisions: [{ kind: 'buy-large' }],
  predicted: '賣 3,000 杯',
  nextVariable: '測試',
})
s2.send('decide', { decisions: [{ kind: 'buy-large' }, { kind: 'buy-large' }] })
await sleep(400)
const tv2 = last(teacher.got)
check(
  '老師端看到兩組都已提交',
  tv2?.groups?.every((g: any) => g.submitted),
  tv2?.groups?.map((g: any) => `${g.name}:${g.submitted ? '✓' : '—'}`).join(' ')
)

s1.send('decide', {
  decisions: [{ kind: 'hire' }, { kind: 'fire' }, { kind: 'flow' }, { kind: 'loan' }],
})
await sleep(300)
const err = s1.got.filter((m) => m.type === 'error').pop()
check('四個營運決策被拒', err?.payload?.message?.includes('三個'), err?.payload?.message)

teacher.send('next-month')
await sleep(600)
const a1 = last(s1.got)
check('結算後進入第 1 年 2 月', a1?.year === 1 && a1?.month === 2, `${a1?.year}-${a1?.month}`)
check('有上個月結果', a1?.lastResult?.sold > 0, `賣 ${a1?.lastResult?.sold}`)
check(
  '毛利率在合理範圍',
  a1?.lastResult?.grossMargin > 0.4 && a1?.lastResult?.grossMargin < 0.8,
  `${(a1?.lastResult?.grossMargin * 100).toFixed(1)}%`
)
check('有可見現象描述', typeof a1?.visible?.note === 'string', a1?.visible?.note)
check('預測寫進永久紀錄', a1?.record?.[0]?.predicted === '賣 3,000 杯', a1?.record?.[0]?.predicted)
check('永久紀錄已補上實際結果', (a1?.record?.[0]?.actual ?? '').length > 0, a1?.record?.[0]?.actual)
check(
  '永久紀錄記住了選了哪些行動',
  a1?.record?.[0]?.actions?.includes('buy-large') === true,
  (a1?.record?.[0]?.actions ?? []).join(',')
)
check('本回合結束後 submitted 歸零', a1?.store?.submitted === false)

const a2 = last(s2.got)
check(
  '先擴張有負營業利潤',
  a2?.lastResult?.operatingProfit < 0,
  Math.round(a2?.lastResult?.operatingProfit ?? 0).toLocaleString()
)

const proj = await open('projector', { code })
await sleep(300)
check('排行榜未公布時不顯示', last(proj.got)?.revealed === false)
teacher.send('year-end')
await sleep(300)
const pv = last(proj.got)
check('公布後顯示排行榜', pv?.revealed === true)
check('排行榜有兩列', pv?.rows?.length === 2, String(pv?.rows?.length))
check(
  '排行榜只有名次與淨值變化',
  pv?.rows?.every((r: any) => Object.keys(r).sort().join(',') === 'delta,name,rank'),
  Object.keys(pv?.rows?.[0] ?? {}).join(',')
)
check('排行榜不含現金欄位', !JSON.stringify(pv).includes('cash'))
check(
  '先擴張排名落後（淨值變化較小）',
  pv?.rows?.[1]?.name === '先擴張',
  pv?.rows?.map((r: any) => r.name).join(' > ')
)
// 排行榜公布之後學生才收得到 boards，要重新取一次狀態
await sleep(200)
check(
  '公布後存進歷年紀錄（學生也看得到）',
  last(s1.got)?.boards?.length === 1,
  `${last(s1.got)?.boards?.length} 年`
)

// 事件卡：先用中文標籤檢查「還沒被用掉時」的樣子
const cardsBefore = last(teacher.got)?.cards ?? []
check(
  '事件卡有中文標籤',
  cardsBefore.some((c: any) => c.label === '連日大雨'),
  cardsBefore
    .map((c: any) => c.label)
    .join('、')
    .slice(0, 50)
)
check('13 張卡開課時全部可用（好 7 壞 6）', cardsBefore.length === 13, `${cardsBefore.length} 張`)

teacher.send('announce', { card: 'rain', text: '事件：連日大雨', kind: 'card' })
await sleep(400)
const t3 = last(teacher.got)
check(
  '用掉的卡不再出現',
  t3?.cards?.every((c: any) => c.key !== 'rain')
)
check('剩 12 張', t3?.cards?.length === 12, `${t3?.cards?.length} 張`)
check(
  '事件進了所有組的狀態',
  last(s1.got)?.store?.events?.includes('rain') === true,
  last(s1.got)?.store?.events?.join(',')
)

// 重開瀏覽器：同一個店名要回到原位
const s1again = await open('student', { code, name: '小而穩', type: 'small' })
await sleep(500)
const helloAgain = s1again.got.find((m) => m.type === 'hello')?.payload
check(
  '同一店名 → 沿用舊店，不是開新的',
  helloAgain?.created === false,
  `created=${helloAgain?.created}`
)
check('重連後進度一致', last(s1again.got)?.store?.equity === last(s1.got)?.store?.equity)

console.log(`\n=== ${pass} 項通過，${fail} 項失敗 ===`)
process.exit(fail > 0 ? 1 : 0)

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
