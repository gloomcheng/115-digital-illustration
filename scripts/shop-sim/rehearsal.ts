/**
 * 完整跑一局：兩組學生各跑 12 個月，檢查年結算能不能走完。
 * 這是老師在 W04 會實際做的事，所以這支就是彩排。
 */

import {
  advanceMonth,
  applyDecisions,
  createStore,
  demandRange,
  effectiveCapacity,
  equity,
  SALARY,
  START_CASH,
  settleMonth,
  shelfCups,
} from './rules'

interface Group {
  name: string
  store: ReturnType<typeof createStore>
  policy: (
    store: ReturnType<typeof createStore>,
    month: number
  ) => { kind: string; amount?: number }[]
  note: string
}

/**
 * 依「需求中值」決定買幾批，不是依產能買。
 * 關鍵：買 min(需求, 產能)。買超過產能的部分會囤著，60 天後過期變成損失。
 * 這是學生第一年最該學的事：需求看得見不代表買得越多越好。
 */
function buyForDemand(store: ReturnType<typeof createStore>) {
  const { mid } = demandRange(store.year)
  const target = Math.min(mid, effectiveCapacity(store))
  const lots: { kind: string }[] = []
  let need = target
  while (need > 0) {
    lots.push({ kind: 'buy-large' })
    need -= 4_000
  }
  return lots
}

/** 學生 A：守成派。依需求買貨，其他不動 */
const steady: Group = {
  name: '守成小而穩',
  store: createStore('守成小而穩', 'small', 7),
  policy: (s, m) => buyForDemand(s),
  note: '什麼都不做，只買剛好夠的貨',
}

/** 學生 B：融資擴張派。第 6 年需求超過產能，先借錢再擴建 */
const builder: Group = {
  name: '融資擴張平衡店',
  store: createStore('融資擴張平衡店', 'mid', 13),
  policy: (s, month) => {
    const out = buyForDemand(s)
    const year = s.year
    // 第 6 年：需求中值 12,200 > 產能 11,400，先借錢
    if (year === 6 && month === 1 && s.loans.length === 0) out.push({ kind: 'loan' })
    if (year === 6 && month === 2) out.push({ kind: 'expansion' })
    // 擴建後工位變多，慢慢補人
    if (s.stations > 3 && s.staff < s.stations) out.push({ kind: 'hire' })
    return out
  },
  note: '第 6 年借款 + 擴建，之後請人跟上',
}

/** 學生 C：貪婪派。第 1 月就擴建（需求 5,500 << 產能 11,400） */
const reckless: Group = {
  name: '貪婪平衡店',
  store: createStore('貪婪平衡店', 'mid', 29),
  policy: (s, m) => {
    const out = buyForDemand(s)
    if (s.stations === 3) out.push({ kind: 'expansion' })
    return out
  },
  note: '第 1 月就擴建（需求 5,500，產能 11,400）',
}

const groups = [steady, builder, reckless]
const startValues = groups.map((g) => equity(g.store))
let failed = 0

console.log('=== 完整跑一局（第 1 年）===\n')
console.log('W04：兩位同學各自開店。跑完 12 個月。\n')

for (const g of groups) {
  console.log(`── ${g.name}（${g.note}）`)
  const startEquity = equity(g.store)
  console.log(
    `   開店：現金 ${START_CASH.toLocaleString()}　工位 ${g.store.stations}　人 ${g.store.staff}　產能 ${effectiveCapacity(g.store).toLocaleString()}`
  )

  for (let m = 1; m <= 12; m++) {
    g.store.month = m
    const decisions = g.policy(g.store, m)
    const applied = applyDecisions(g.store, decisions as never)
    if (!applied.ok) {
      console.log(`   M${m} 決策被拒：${applied.message}`)
      failed++
    }
    const r = settleMonth(g.store, SALARY)
    const flag = r.shortageRate > 0.3 ? ' ⚠缺貨' : r.operatingProfit < 0 ? ' ⚠虧損' : ''
    console.log(
      `   M${String(m).padStart(2)} 需求 ${String(r.effectiveDemand).padStart(6)}` +
        `  產能 ${String(r.capacity).padStart(6)}` +
        `  賣 ${String(r.sold).padStart(6)}` +
        `  毛利 ${(r.grossMargin * 100).toFixed(1).padStart(5)}%` +
        `  營業 ${String(Math.round(r.operatingProfit)).padStart(9)}` +
        `  現金 ${String(Math.round(r.cash)).padStart(10)}` +
        `  ${r.visible.note}${flag}`
    )
  }
  const delta = equity(g.store) - startEquity
  console.log(`   年結算：淨值變化 ${delta >= 0 ? '+' : ''}${Math.round(delta).toLocaleString()}`)
  console.log(
    `   士氣 ${g.store.morale}　聲譽 ${g.store.reputation}　工位 ${g.store.stations}　人 ${g.store.staff}\n`
  )
  advanceMonth(g.store)
}

console.log('=== 年結算排名（只看名次與淨值變化）===')
const rows = groups
  .map((g, i) => ({ name: g.name, delta: Math.round(equity(g.store) - startValues[i]) }))
  .sort((a, b) => b.delta - a.delta)
rows.forEach((r, i) => {
  console.log(
    `   ${i + 1}. ${r.name.padEnd(12)} ${r.delta >= 0 ? '+' : ''}${r.delta.toLocaleString()}`
  )
})

console.log('\n=== 檢查 ===')
const problems: string[] = []
for (const g of groups) {
  const s = g.store
  if (s.month !== 1 || s.year !== 2)
    problems.push(`${g.name} 年度計數錯誤：${s.year} 年 ${s.month} 月`)
  if (shelfCups(s) > 40_000) problems.push(`${g.name} 存貨累積過多：${shelfCups(s)}`)
  if (s.reputation < 10) problems.push(`${g.name} 聲譽崩到 ${s.reputation}（上限機制失效）`)
}
// 只有守成派與融資派不該破產。貪婪派破產是正確反饵，不算問題。
for (const g of [steady, builder]) {
  if (g.store.cash < 0) problems.push(`${g.name} 第一年就破產（策略合理時不應該）`)
}
if (rows[0].delta === rows[1].delta) problems.push('前兩名淨值變化相同，排行榜沒有排序意義')

if (problems.length) {
  for (const p of problems) console.log(`   ★ ${p}`)
  console.log(`\n=== ${problems.length} 個問題 ===`)
  process.exit(1)
}
console.log('   OK  年度計數正確')
console.log('   OK  合理策略不會破產')
console.log('   OK  聲譽沒有崩潰')
console.log('   OK  存貨沒有失控')
console.log('   OK  排行榜能排序')
console.log('\n=== 這一局可以上課 ===')
console.log('  注意：貪婪派因為在需求遠低於產能時擴建而破產。')
console.log('  這是引擎給的正確反饋，也是 W04 最值得讓學生看到的一件事。')

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
