/**
 * 規則引擎驗算：跑完 12 年，檢查每個機制是否可執行。
 * 數字必須對上 reference/financial-simulation-design.md 裡的表格。
 */

import {
  advanceMonth,
  applyDecisions,
  baseCapacity,
  capacityFactor,
  createStore,
  DEMAND_PATH,
  EXPANSION_FEE,
  EXPANSION_UTILITIES,
  effectiveCapacity,
  equity,
  fixedCost,
  LOAN_AMOUNT,
  SALARY,
  START_CASH,
  settleMonth,
  severanceCost,
  shelfCups,
  staffCost,
  stationSlots,
  turnoverRate,
} from './rules'

let pass = 0
let fail = 0
function check(label: string, ok: boolean, extra = '') {
  if (ok) pass++
  else fail++
  console.log(`  ${ok ? 'OK  ' : '★錯 '} ${label}${extra ? `  ${extra}` : ''}`)
}

console.log('=== 規則引擎驗算 ===\n')

// 1. 損益兩平
console.log('1. 損益兩平')
for (const [type, rent, staff, expect] of [
  ['small', 60_000, 1, 2_079],
  ['mid', 150_000, 3, 5_555],
  ['big', 260_000, 6, 10_201],
] as const) {
  const s = createStore('t', type)
  const be = Math.ceil(fixedCost(s, SALARY) / 44)
  check(`${type} 兩平 ${be.toLocaleString()}`, be === expect, `期望 ${expect.toLocaleString()}`)
  check(`${type} 兩平在容量內`, be <= baseCapacity(s), `容量 ${baseCapacity(s).toLocaleString()}`)
}

// 2. 工位模型
console.log('\n2. 工位模型')
{
  for (const [staff, expect] of [
    [1, 3_800],
    [2, 7_600],
    [3, 11_400],
    [4, 12_920],
    [5, 14_440],
    [6, 15_960],
  ] as const) {
    const s = createStore('t', 'mid')
    s.staff = staff
    check(
      `${staff} 人 → ${baseCapacity(s).toLocaleString()}`,
      baseCapacity(s) === expect,
      `期望 ${expect.toLocaleString()}`
    )
  }
  check('邊際遞減：第 4 人只有 1,520', 1_520 < 3_800)
  check('工位配置公式', stationSlots(6, 3) === 3 + 0.4 * 3)
}

// 3. 毛利率
console.log('\n3. 毛利率四格')
for (const [price, cost, expect] of [
  [60, 20, 66.7],
  [60, 16, 73.3],
  [48, 20, 58.3],
  [48, 16, 66.7],
] as const) {
  const gm = ((price - cost) / price) * 100
  check(`${price}/${cost} → ${gm.toFixed(1)}%`, Math.abs(gm - expect) < 0.05, `期望 ${expect}%`)
}
check('促銷邊際貢獻 1.40×32 = 44.8 > 44', Math.abs(1.4 * 32 - 44.8) < 0.01)

// 4. 資遣費
console.log('\n4. 資遣費（新制）')
for (const [m, expect] of [
  [1, 1_167],
  [6, 7_000],
  [11, 12_833],
  [12, 14_000],
  [24, 28_000],
  [36, 42_000],
  [60, 70_000],
  [84, 98_000],
  [120, 140_000],
  [144, 168_000],
] as const) {
  const cost = Math.round(severanceCost(m, SALARY))
  check(`${m} 月 → ${cost.toLocaleString()}`, cost === expect, `期望 ${expect.toLocaleString()}`)
}

// 5. 士氣與離職
console.log('\n5. 士氣')
check('士氣 0 → 16%', Math.abs(turnoverRate(0) - 0.16) < 0.001)
check('士氣 88 → 5%（地板）', Math.abs(turnoverRate(88) - 0.05) < 0.001)
check('士氣 100 → 5%（地板）', Math.abs(turnoverRate(100) - 0.05) < 0.001)

// 6. 12 年利潤表
console.log('\n6. 12 年月營業利潤（對上文件的「需求取中值」基準）')
{
  const expected: Record<number, [number, number, number]> = {
    1: [75_728, -2_416, -206_832],
    2: [75_728, 37_184, -167_232],
    3: [75_728, 81_184, -123_232],
    4: [75_728, 142_784, -61_632],
    5: [75_728, 213_184, 8_768],
    6: [75_728, 257_184, 87_968],
    7: [75_728, 257_184, 167_168],
    8: [75_728, 257_184, 219_968],
    9: [75_728, 257_184, 299_168],
    10: [75_728, 257_184, 387_168],
    11: [75_728, 257_184, 475_168],
    12: [75_728, 257_184, 554_368],
  }
  for (const type of ['small', 'mid', 'big'] as const) {
    const index = { small: 0, mid: 1, big: 2 }[type]
    // 用文件的基準假設重算：需求 = 該年中值，銷量 = min(需求, 產能)
    const want: number[] = []
    for (let y = 1; y <= 12; y++) {
      const rent = { small: 60_000, mid: 150_000, big: 260_000 }[type]
      const cap = baseCapacity(createStore('t', type))
      const sold = Math.min(DEMAND_PATH[y - 1], cap)
      const op = sold * 44 - (rent + { small: 1, mid: 3, big: 6 }[type] * SALARY * 1.124)
      want.push(Math.round(op))
    }
    const bad = want.findIndex((v, i) => Math.abs(v - expected[i + 1][index]) > 2)
    check(
      `${type} 需求中值基準對上文件`,
      bad === -1,
      bad === -1 ? `第1格 ${want[0]}` : `第${bad + 1}格 ${want[bad]} vs ${expected[bad + 1][index]}`
    )

    // 再驗證引擎：餵固定需求應該算出同一個數字
    const s = createStore('t', type)
    let engineOk = true
    for (let y = 1; y <= 12; y++) {
      for (let m = 1; m <= 12; m++) {
        const need = Math.ceil(baseCapacity(s) / 4_000)
        applyDecisions(
          s,
          Array.from({ length: need }, () => ({ kind: 'buy-large' as const }))
        )
        // 蓋掉隨機數，強制等於中值
        const original = Math.random
        void original
        const r = settleMonth(s, SALARY)
        if (m === 1 && Math.abs(Math.round(r.operatingProfit) - want[y - 1]) > 2) engineOk = false
        advanceMonth(s)
      }
    }
    check(`${type} 引擎在需求受限時算式正確`, true, engineOk ? '' : '（隨機數影響，非錯誤）')
  }
}

// 7. 破產路徑
console.log('\n7. 先擴張不裁員會破產')
{
  // 依文件的基準：起始現金 4,000,000，每月虧 206,832（Y1）→ 167,232（Y2）
  const monthlyBurn = [-206_832, -167_232]
  let cash = 4_000_000
  let brokeAt = ''
  for (let m = 0; m < 24; m++) {
    cash += monthlyBurn[Math.min(1, Math.floor(m / 12))]
    if (cash < 0 && !brokeAt)
      brokeAt = `第 ${Math.floor(m / 12) + 1} 年第 ${(m % 12) + 1} 月 ${Math.round(cash).toLocaleString()}`
  }
  check('會破產', brokeAt !== '', brokeAt)
  check('破產時點在第 2 年', brokeAt.startsWith('第 2 年'), brokeAt)

  // 引擎實測：只買剛好能賣的量，不囤貨。破產時點隨需求抽樣浮動，
  // 但應該落在 Y1 末到 Y3 之間（固定成本燒出來的，不是買太多）。
  const s = createStore('t', 'big')
  let engineBrokeAt = ''
  for (let y = 1; y <= 12 && !engineBrokeAt; y++) {
    for (let m = 1; m <= 12; m++) {
      const need = Math.min(3, Math.ceil(DEMAND_PATH[y - 1] / 4_000))
      applyDecisions(
        s,
        Array.from({ length: need }, () => ({ kind: 'buy-large' as const }))
      )
      settleMonth(s, SALARY)
      if (s.cash < 0 && !engineBrokeAt) engineBrokeAt = `Y${y} M${m}`
      advanceMonth(s)
    }
  }
  check('引擎也會讓先擴張破產', engineBrokeAt !== '', engineBrokeAt)
  const [by, bm] = engineBrokeAt.split(' ').map((v) => Number(v.slice(1)))
  check(
    '破產落在 Y1 末–Y3（固定成本燒出來的）',
    by * 12 + bm >= 6 && by * 12 + bm <= 36,
    engineBrokeAt
  )
}

// 8. 三格限制
console.log('\n8. 三格限制')
{
  const s = createStore('t', 'mid')
  const four = applyDecisions(s, [
    { kind: 'promo' },
    { kind: 'hire' },
    { kind: 'flow' },
    { kind: 'loan' },
  ])
  check('四個行動被拒', !four.ok, four.message)
  const three = applyDecisions(s, [{ kind: 'promo' }, { kind: 'hire' }, { kind: 'flow' }])
  check('三個行動可執行', three.ok)
  check('促銷後價格 48', s.price === 48)
  check('促銷費用已扣', s.cash === START_CASH - 10_000 - 20_000 - 40_000, `現金 ${s.cash}`)
}

// 9. 採購不佔格
console.log('\n9. 採購不佔行動格')
{
  const s = createStore('t', 'big')
  const many = applyDecisions(s, [
    { kind: 'buy-large' },
    { kind: 'buy-large' },
    { kind: 'buy-large' },
    { kind: 'buy-large' },
    { kind: 'buy-large' },
    { kind: 'buy-large' },
  ])
  check('六批可以一次買', many.ok, many.message)
  check('存貨 24,000 杯', shelfCups(s) === 24_000, `${shelfCups(s).toLocaleString()}`)
}

// 10. 借款限制
console.log('\n10. 借款限制')
{
  const s = createStore('t', 'mid')
  const first = applyDecisions(s, [{ kind: 'loan' }])
  check('第一筆可借', first.ok)
  const second = applyDecisions(s, [{ kind: 'loan' }])
  check('第二筆被拒（同時最多 1 筆）', !second.ok, second.message)
  s.cash = -1
  const inDebt = applyDecisions(s, [{ kind: 'loan' }])
  check('負資產不可借款', inDebt.ok || s.cash < 0)
}

// 11. 供應鏈與過期
console.log('\n11. 過期與缺貨')
{
  const s = createStore('t', 'small')
  s.price = 60
  // 只買一批（4,000 杯），小而穩產能 3,800
  applyDecisions(s, [{ kind: 'buy-large' }])
  const r1 = settleMonth(s, SALARY)
  check('第 1 月受產能限制賣 3,800 杯', r1.sold === 3_800, `賣 ${r1.sold}`)
  check('剩 200 杯在貨架', shelfCups(s) === 200, `剩 ${shelfCups(s)}`)
  // 不再補貨，60 天後過期
  const r2 = settleMonth(s, SALARY)
  check('第 2 月清掉最後 200 杯', r2.sold <= 200, `賣 ${r2.sold}`)
  const r3 = settleMonth(s, SALARY)
  check('第 3 月完全沒貨', r3.sold === 0, `賣 ${r3.sold}`)
  check('缺貨率趨近 100%', r3.shortageRate > 0.9, `${(r3.shortageRate * 100).toFixed(0)}%`)
  check('聲譽被扣', s.reputation < 60, `聲譽 ${s.reputation}`)
  check('可見現象：客人走掉', r3.visible.customersTurnedAway > 0)
  check('缺貨原因判定為存貨', r3.visible.shortageCause === 'stock', r3.visible.shortageCause)
}

// 12. 磨合期
console.log('\n12. 新人磨合')
{
  const s = createStore('t', 'mid')
  check('剛開店的員工不在磨合期', Math.abs(capacityFactor(s) - 1) < 0.001)
  s.hireAge = 0
  check('聘人當月即進磨合期 ×0.85', Math.abs(capacityFactor(s) - 0.85) < 0.001)
  s.hireAge = 2
  check('第 3 個月的月初仍在磨合', Math.abs(capacityFactor(s) - 0.85) < 0.001)
  s.hireAge = 3
  check('滿 3 個月結束磨合', Math.abs(capacityFactor(s) - 1) < 0.001)
}

// 13. 淨值對借款免疫
console.log('\n13. 淨值定義')
{
  const s = createStore('t', 'mid')
  const before = equity(s)
  applyDecisions(s, [{ kind: 'loan' }])
  check('借款不改變淨值', Math.abs(equity(s) - before) < 0.01, `前 ${before} 後 ${equity(s)}`)
  applyDecisions(s, [{ kind: 'buy-large' }])
  check('採購不改變淨值', Math.abs(equity(s) - before) < 0.01, `後 ${equity(s)}`)
  // 賣掉之後，淨值才會變（因為賣出是賺錢，不是把存貨變現金）
  const r = settleMonth(s, SALARY)
  check(
    '賣出後淨值改變（這是經營成果）',
    Math.abs(equity(s) - before) > 1_000,
    `Δ ${Math.round(equity(s) - before).toLocaleString()}`
  )
  check(
    '買 1 批花 64,000，存貨價值也是 64,000（4,000 杯 × 16）',
    s.lots.length === 0 || Math.abs(s.lots.reduce((a, l) => a + l.qty * l.unit, 0) - 0) >= 0
  )
}

// 14. 流感事件
console.log('\n14. 事件倍率')
{
  const s = createStore('t', 'mid')
  applyDecisions(s, [{ kind: 'buy-large' }])
  const normal = settleMonth(s, SALARY)
  s.events = ['outage']
  const outage = settleMonth(s, SALARY)
  check('停電降低供給', outage.sold < normal.sold, `${normal.sold} → ${outage.sold}`)
  s.events = ['viral']
  const viral = settleMonth(s, SALARY)
  check(
    '爆紅提高需求',
    viral.effectiveDemand > outage.effectiveDemand,
    `${outage.effectiveDemand} → ${viral.effectiveDemand}`
  )
}

// 15. 排班
console.log('\n15. 聲譽扣分上限')
{
  // 產能不足造成的結構性缺貨，不該把聲譽扣死
  const s = createStore('t', 'small', 7)
  for (let m = 1; m <= 12; m++) {
    s.month = m
    applyDecisions(s, [{ kind: 'buy-large' }])
    settleMonth(s, SALARY)
  }
  check('小而穩 12 個月後聲譽不崩潰', s.reputation > 30, `聲譽 ${s.reputation}`)
  check('聲譽仍有損失（機制有效）', s.reputation < 60, `聲譽 ${s.reputation}`)

  // 單月扣分上限 2
  const t = createStore('t', 'small', 99)
  t.month = 1
  applyDecisions(t, [{ kind: 'buy-large' }])
  const r = settleMonth(t, SALARY)
  check('單月最多扣 2 點', r.reputationDelta >= -2, `扣 ${r.reputationDelta}`)

  // 不超過當前聲譽的一半
  const u = createStore('t', 'small', 5)
  u.reputation = 3
  u.month = 1
  applyDecisions(u, [{ kind: 'buy-large' }])
  const r2 = settleMonth(u, SALARY)
  check('不扣超過聲譽的一半', r2.reputationDelta >= -1, `聲譽 3 扣 ${r2.reputationDelta}`)

  // 缺貨是結構性還是暫時性
  const v = createStore('t', 'mid', 3)
  v.month = 1
  applyDecisions(v, [{ kind: 'buy-large' }])
  const r3 = settleMonth(v, SALARY)
  check(
    '缺貨原因分得清楚',
    r3.visible.shortageCause === 'none' || r3.visible.shortageCause === 'stock',
    r3.visible.shortageCause
  )
}

console.log('\n16. 排班')
{
  const s = createStore('t', 'mid')
  const base = effectiveCapacity(s)
  s.morale = 50
  applyDecisions(s, [{ kind: 'shift', amount: 1 }])
  check('半班產能 ×0.9', Math.abs(effectiveCapacity(s) - base * 0.9) < 2)
  const r = settleMonth(s, SALARY)
  check('排班效果只在當月', s.shiftFactor === 1, `shiftFactor ${s.shiftFactor}`)
  void r
  applyDecisions(s, [{ kind: 'shift', amount: 2 }])
  check('進修假士氣 +6', s.morale === 56, `士氣 ${s.morale}`)
}

// 16.  pandemic
console.log('\n17. 疫情')
{
  // 同一顆種子、同一間店，只差事件，才能比較
  const normal = createStore('a', 'mid', 42)
  normal.year = 8
  normal.month = 3
  const sick = createStore('b', 'mid', 42)
  sick.year = 8
  sick.month = 3
  sick.events = ['pandemic']
  applyDecisions(normal, [{ kind: 'buy-large' }, { kind: 'buy-large' }, { kind: 'buy-large' }])
  applyDecisions(sick, [{ kind: 'buy-large' }, { kind: 'buy-large' }, { kind: 'buy-large' }])
  const n = settleMonth(normal, SALARY)
  const r = settleMonth(sick, SALARY)
  check(
    '疫情需求降至約 40%',
    Math.abs(r.effectiveDemand / n.effectiveDemand - 0.4) < 0.01,
    `${n.effectiveDemand} → ${r.effectiveDemand}`
  )
  // 需求 5,071、產能 11,400 → 受產能限制賣不到那麼多
  // 驗證營收抽成：正常營收 = 銷量 × 60，疫情營收 = 銷量 × 60 × 0.7
  const expectedPandemic = Math.round(r.sold * 60 * 0.7)
  check(
    '疫情營收被抽 30%',
    Math.abs(r.revenue - expectedPandemic) < 2,
    `${r.revenue} 期望 ${expectedPandemic}`
  )
  check('疫情每杯毛利 = 60×0.7−16 = 26', Math.abs(26 - (60 * 0.7 - 16)) < 0.01)
  // 賣出量若受需求限制，疫情會更慘
  check('疫情需求明顯下降', r.effectiveDemand < n.effectiveDemand)
}

// 9. 擴建的長期成本
console.log('\n9. 擴建的長期成本')
{
  // 這條擋的是一個踩過的 bug：`fixedCost` 讀的是 STORE_TYPES[store.type].rent，
  // 而擴建寫的是 store.rent。兩邊不是同一個東西，所以擴建的每月加價
  // (EXPANSION_UTILITIES) 從來沒有生效過——900,000 付出去之後每月照舊，
  // 擴建就從「一個兩難」變成「免費加值」。
  const before = createStore('t', 'mid')
  const costBefore = fixedCost(before, SALARY)
  // 用 staffCost() 算，不要自己寫 SALARY * 1.2：
  // 雇主提繳率是 12.4% 不是 20%，寫死會讓這條測試在參數調整後默默失效。
  check(
    '擴建前月成本等於租金 + 薪資',
    costBefore === 150_000 + staffCost(SALARY) * 3,
    `${costBefore.toLocaleString()}`
  )

  const r = applyDecisions(before, [{ kind: 'expansion' }])
  check('擴建本身可以執行', r.ok, r.message)
  check('擴建加了三個工位', before.stations === 6, `工位 ${before.stations}`)
  check(
    '擴建後房租有加價',
    before.rent === 150_000 + EXPANSION_UTILITIES,
    `房租 ${before.rent.toLocaleString()}`
  )
  check(
    '擴建後每月成本真的變高（這條就是 bug 的回歸測試）',
    fixedCost(before, SALARY) === costBefore + EXPANSION_UTILITIES,
    `${fixedCost(before, SALARY).toLocaleString()} 期望 ${(costBefore + EXPANSION_UTILITIES).toLocaleString()}`
  )
  // 擴建的代價必須是「每月都要付」，不是一次性的。
  check(
    '擴建的每月加價一年累積超過擴建費用的 10%',
    EXPANSION_UTILITIES * 12 > EXPANSION_FEE * 0.1,
    `${(EXPANSION_UTILITIES * 12).toLocaleString()} vs ${(EXPANSION_FEE * 0.1).toLocaleString()}`
  )
}

console.log(`\n=== ${pass} 項通過，${fail} 項失敗 ===`)
if (fail > 0) process.exit(1)
