/**
 * 飲料店經營模擬：遊戲規則引擎（純函數，無 IO）。
 *
 * 這裡只放「規則」。所有數字來自 `reference/financial-simulation-design.md`，
 * 老師端、學生端、投影端都呼叫同一組函式，避免三邊算法漂移。
 *
 * 遊戲裡要讓學生「看得到因果」，所以每個函式都同時回傳：
 *   - 數字（給帳本）
 *   - 看得見的現象（給場景動畫用）
 *
 * 例如 settleMonth 不只回傳賣了幾杯，也回傳誰因為沒工位而閒著、
 * 幾個客人因為缺貨而走掉——這兩個是同一件事的兩種表現。
 */

/** 單杯毛利以年度合約計：60 − 16 = 44 */
export const PRICE_BASE = 60
export const PRICE_MIN = 45
export const PRICE_MAX = 75
export const PROMO_RATIO = 0.8
export const PROMO_DEMAND = 1.4
export const PROMO_FEE = 10_000

export const LOT_SMALL = { qty: 1_000, total: 20_000, unit: 20 }
export const LOT_LARGE = { qty: 4_000, total: 64_000, unit: 16 }
export const EXPIRY_DAYS = 60

export const SALARY = 28_000
export const EMPLOYER_RATE = 0.124
export const HIRE_FEE = 20_000
export const TRAINING_MONTHS = 3
export const STATION_CAP = 3_800
export const EXTRA_OUTPUT = 0.4
export const FLOW_STEP = 1.08
export const FLOW_MAX = 1.5
export const FLOW_FEE = 40_000
export const EXPANSION_STATIONS = 3
export const EXPANSION_FEE = 900_000
export const EXPANSION_UTILITIES = 100_000

export const LOAN_AMOUNT = 1_000_000
export const LOAN_RATE = 0.012
export const LOAN_PRINCIPAL = 50_000
export const LOAN_TERMS = 20
export const START_CASH = 4_000_000

export const TYPE_SMALL = 1
export const TYPE_MID = 3
export const TYPE_BIG = 6

export interface StoreType {
  key: 'small' | 'mid' | 'big'
  label: string
  stations: number
  staff: number
  rent: number
}

export const STORE_TYPES: Record<StoreType['key'], StoreType> = {
  small: { key: 'small', label: '小而穩', stations: 1, staff: TYPE_SMALL, rent: 60_000 },
  mid: { key: 'mid', label: '平衡店', stations: 3, staff: TYPE_MID, rent: 150_000 },
  big: { key: 'big', label: '先擴張', stations: 6, staff: TYPE_BIG, rent: 260_000 },
}

export const DEMAND_PATH = [
  5_500, 6_400, 7_400, 8_800, 10_400, 12_200, 14_000, 15_200, 17_000, 19_000, 21_000, 24_000,
]

export const DEMAND_SPREAD = 0.15
export const PANDEMIC_YEAR = 8

export type ActionKind =
  | 'set-price'
  | 'promo'
  | 'buy-small'
  | 'buy-large'
  | 'hire'
  | 'fire'
  | 'flow'
  | 'expansion'
  | 'shift'
  | 'loan'

export interface Lot {
  qty: number
  /** 單杯進貨價（20 或 16）。原料成本、存貨計價都用這個。 */
  unit: number
  ageMonths: number
}

export interface Employee {
  id: number
  tenureMonths: number
}

export interface Loan {
  outstanding: number
  monthsLeft: number
}

export interface Store {
  name: string
  type: StoreType['key']
  year: number
  month: number
  cash: number
  price: number
  staff: number
  stations: number
  /** 每月固定房租。開店時等於型別的租金；擴建之後房東加收水電。 */
  rent: number
  flow: number
  morale: number
  reputation: number
  lots: Lot[]
  loans: Loan[]
  shiftFactor: number
  hireAge: number
  demandSeed: number
  events: string[]
  log: LogLine[]
  bankruptRoute: string | null
}

export interface LogLine {
  month: number
  predicted: string
  actual: string
  nextVariable: string
}

export interface Decision {
  kind: ActionKind
  amount?: number
  employeeId?: number
}

export interface Visible {
  customersEntered: number
  customersServed: number
  customersTurnedAway: number
  staffAtStation: number
  staffIdle: number
  shelfCups: number
  cashDelta: number
  /** 缺貨的原因：stock＝沒貨，capacity＝沒工位，none＝沒缺 */
  shortageCause: 'stock' | 'capacity' | 'none'
  note: string
}

export interface MonthResult {
  month: number
  year: number
  demandDrawn: number
  effectiveDemand: number
  capacity: number
  sold: number
  revenue: number
  materialCost: number
  grossMargin: number
  fixedCost: number
  operatingProfit: number
  shortageRate: number
  reputationDelta: number
  /** 缺貨是「這期賣完就沒了」還是「結構上做不來」，後者要擴充產能才會好 */
  shortageFloor: boolean
  avgInventoryCups: number
  turnoverDays: number
  cash: number
  equity: number
  visible: Visible
  log: LogLine
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** 員工一位的月成本含雇主提繳 */
export function staffCost(salary: number) {
  return salary * (1 + EMPLOYER_RATE)
}

export function fixedCost(store: Store, salary: number) {
  // **讀 store.rent，不要讀 STORE_TYPES[store.type].rent。**
  // 擴建之後房東會加收水電（EXPANSION_UTILITIES），這個加價要跟著店存著。
  // 直接讀型別表會讓擴建的長期成本憑空消失——學生擴建完就變成
  // 「只付一次性 900,000 以後每月照舊」，那擴建就不是一個兩難，
  // 而是一個免費的加值。踩過。
  return store.rent + salary * (1 + EMPLOYER_RATE) * store.staff
}

/** 供給上限：工位模型。工位配置 × 每位基礎產能 × 動線效率。 */
export function stationSlots(staff: number, stations: number) {
  return Math.min(staff, stations) + EXTRA_OUTPUT * Math.max(0, staff - stations)
}

export function baseCapacity(store: Store) {
  return Math.round(STATION_CAP * stationSlots(store.staff, store.stations) * store.flow)
}

/** 當月供給乘數：全部相乘，順序不影響結果 */
export function capacityFactor(store: Store) {
  let factor = 1
  // 聘人當月即計入磨合期，所以從 0 開始算
  if (store.hireAge >= 0 && store.hireAge < TRAINING_MONTHS) factor *= 0.85
  factor *= store.shiftFactor
  return factor
}

export function effectiveCapacity(store: Store) {
  return Math.round(baseCapacity(store) * capacityFactor(store))
}

export function reputationFactor(reputation: number) {
  return 0.6 + clamp(reputation, 0, 100) * 0.006
}

export function turnoverRate(morale: number) {
  return Math.max(0.05, 0.16 - Math.floor(morale / 8) * 0.01)
}

export function loanCapacity(startCash = START_CASH) {
  return { maxLoans: 1, maxOutstanding: startCash * 0.5 }
}

/** 新制（勞退條例第 12 條）：每滿一年半個月，未滿一年按比例，最高 6 個月 */
export function severanceMonths(tenureMonths: number) {
  return Math.min(6, (0.5 * tenureMonths) / 12)
}

export function severanceCost(tenureMonths: number, salary: number) {
  return severanceMonths(tenureMonths) * salary
}

export function demandRange(year: number) {
  const mid = DEMAND_PATH[clamp(year - 1, 0, DEMAND_PATH.length - 1)]
  return {
    mid,
    low: Math.round(mid * (1 - DEMAND_SPREAD)),
    high: Math.round(mid * (1 + DEMAND_SPREAD)),
  }
}

/**
 * 抽出當月實際需求。固定種子讓全班的橫向比較成立：
 * 不同促銷的店仍然抽到同一個 D，否則排行榜沒有意義。
 */
export function drawDemand(store: Store, year: number, month: number, offset: number) {
  const { mid } = demandRange(year)
  const seed = (store.demandSeed + year * 37 + month * 91 + offset * 17) % 997
  const unit = (Math.sin(seed * 12.9898) * 43758.5453) % 1
  const rand = Math.abs(unit)
  return Math.round(mid * (1 - DEMAND_SPREAD + rand * DEMAND_SPREAD * 2))
}

/** 事件倍率：最多兩張同時生效（疫情 + 當年度卡） */
export function eventFactor(store: Store) {
  let factor = 1
  for (const name of store.events) {
    if (name === 'pandemic') factor *= 0.4
    if (name === 'poach') factor *= 0.9
    if (name === 'viral') factor *= 1.3
    if (name === 'group-buy') factor *= 1.15
    if (name === 'competitor') factor *= 0.85
    if (name === 'rain') factor *= 0.75
    if (name === 'outage') factor *= 0.6
    if (name === 'inspection') factor *= 0.75
    if (name === 'complaint') factor *= 0.9
  }
  return factor
}

/** 疫情營收 ×0.70 套用在促銷後的售價上 */
export function pandemicMonths(store: Store, month: number) {
  return store.year === PANDEMIC_YEAR && month >= 3 && month <= 6
}

export function shelfCups(store: Store) {
  return store.lots.reduce((sum, lot) => sum + lot.qty, 0)
}

export function inventoryValue(store: Store) {
  return store.lots.reduce((sum, lot) => sum + lot.qty * lot.unit, 0)
}

export function debtOutstanding(store: Store) {
  return store.loans.reduce((s, l) => s + l.outstanding, 0)
}

export function equity(store: Store) {
  return store.cash + inventoryValue(store) - debtOutstanding(store)
}

export function createStore(name: string, type: StoreType['key'], seed = 1): Store {
  const t = STORE_TYPES[type]
  return {
    name,
    type,
    year: 1,
    month: 1,
    cash: START_CASH,
    price: PRICE_BASE,
    staff: t.staff,
    stations: t.stations,
    rent: t.rent,
    flow: 1,
    morale: 55,
    reputation: 60,
    lots: [],
    loans: [],
    shiftFactor: 1,
    // 開店的員工已經上手，不在磨合期
    hireAge: TRAINING_MONTHS,
    demandSeed: seed,
    events: [],
    log: [],
    bankruptRoute: null,
  }
}

export interface DecisionResult {
  ok: boolean
  message: string
}

/**
 * 三格限制只算「營運決策」。採購不佔格——這是為了讓工位模型成立：
 * 若採購佔格，先擴張每月要 6 批才買得夠，三格根本買不到。
 */
const DECISION_ACTIONS: ActionKind[] = [
  'set-price',
  'promo',
  'hire',
  'fire',
  'flow',
  'expansion',
  'shift',
  'loan',
]

export function applyDecisions(store: Store, decisions: Decision[]): DecisionResult {
  const { maxLoans, maxOutstanding } = loanCapacity()
  const ops = decisions.filter((d) => DECISION_ACTIONS.includes(d.kind)).length
  if (ops > 3) return { ok: false, message: '每月最多三個主要行動（採購不計入）' }

  let spent = 0
  for (const d of decisions) {
    switch (d.kind) {
      case 'set-price': {
        const next = clamp(d.amount ?? PRICE_BASE, PRICE_MIN, PRICE_MAX)
        store.price = next
        break
      }
      case 'promo': {
        if (store.price !== Math.round(PRICE_BASE * PROMO_RATIO)) {
          store.price = Math.round(PRICE_BASE * PROMO_RATIO)
        }
        spent += PROMO_FEE
        break
      }
      case 'buy-small': {
        store.lots.push({ qty: LOT_SMALL.qty, unit: LOT_SMALL.unit, ageMonths: 0 })
        spent += LOT_SMALL.total
        break
      }
      case 'buy-large': {
        store.lots.push({ qty: LOT_LARGE.qty, unit: LOT_LARGE.unit, ageMonths: 0 })
        spent += LOT_LARGE.total
        break
      }
      case 'hire': {
        if (store.hireAge < TRAINING_MONTHS) return { ok: false, message: '新人還在磨合期' }
        store.staff += 1
        store.hireAge = 0
        spent += HIRE_FEE
        break
      }
      case 'fire': {
        if (store.staff <= 0) return { ok: false, message: '沒有人可以裁' }
        if (store.cash < 0) return { ok: false, message: '負資產狀態請選求生路線' }
        store.staff -= 1
        store.morale = clamp(store.morale - 5, 0, 100)
        break
      }
      case 'flow': {
        if (store.flow * FLOW_STEP > FLOW_MAX)
          return { ok: false, message: '動線效率已到上限 ×1.5' }
        store.flow = Math.min(FLOW_MAX, store.flow * FLOW_STEP)
        spent += FLOW_FEE
        break
      }
      case 'expansion': {
        // 擴建 900,000 是 22.5% 的本金。這是刻意的：
        // 真實世界的建設要融資。文件明確寫「擴建要借錢」，
        // 學生必須先理解負債的代價，才付得起這張卡。
        store.stations += EXPANSION_STATIONS
        store.rent += EXPANSION_UTILITIES
        spent += EXPANSION_FEE
        break
      }
      case 'shift': {
        store.shiftFactor = d.amount === 1 ? 0.9 : 0.75
        if (d.amount === 2) store.morale = clamp(store.morale + 6, 0, 100)
        break
      }
      case 'loan': {
        if (store.loans.length >= maxLoans) return { ok: false, message: '同時最多一筆借款' }
        if (debtOutstanding(store) + LOAN_AMOUNT > maxOutstanding) {
          return { ok: false, message: '超過負債上限' }
        }
        if (store.cash < 0) return { ok: false, message: '負資產狀態不可借款' }
        store.cash += LOAN_AMOUNT
        store.loans.push({ outstanding: LOAN_AMOUNT, monthsLeft: LOAN_TERMS })
        break
      }
    }
  }
  // 借款不走 spent：現金增加與負債增加同時發生，淨值不變
  store.cash -= spent
  return { ok: true, message: '' }
}

/** 排班的效果在下個月結束時清除 */
export function clearShift(store: Store) {
  store.shiftFactor = 1
}

/**
 * 結算一個月。順序：需求 → 容量 → FIFO 賣出 → FIFO 過期 → 指標。
 */
export function settleMonth(store: Store, salary: number): MonthResult {
  const { month, year } = store
  for (const lot of store.lots) lot.ageMonths += 1
  clearShift(store)
  if (store.hireAge < TRAINING_MONTHS) store.hireAge += 1

  const demandDrawn = drawDemand(store, year, month, 0)
  const promoFactor = store.price <= Math.round(PRICE_BASE * PROMO_RATIO) ? PROMO_DEMAND : 1
  const effectiveDemand = Math.round(
    demandDrawn * promoFactor * reputationFactor(store.reputation) * eventFactor(store)
  )
  const capacity = effectiveCapacity(store)

  // FIFO 賣出。產能與存貨取小：賣得再多也做不出來。
  const sellable = Math.min(effectiveDemand, capacity)
  let need = sellable
  let sold = 0
  let materialCost = 0
  for (const lot of store.lots) {
    if (need <= 0) break
    if (lot.ageMonths * 30 > EXPIRY_DAYS) continue
    const take = Math.min(need, lot.qty)
    lot.qty -= take
    sold += take
    materialCost += take * lot.unit
    need -= take
  }

  // FIFO 過期
  for (const lot of store.lots) {
    if (lot.ageMonths * 30 > EXPIRY_DAYS) {
      store.cash -= lot.qty * lot.unit
      lot.qty = 0
    }
  }
  store.lots = store.lots.filter((lot) => lot.qty > 0)

  const revenue = sold * store.price
  const pandemic = pandemicMonths(store, month)
  const netRevenue = pandemic ? Math.round(revenue * 0.7) : revenue
  const fixed = fixedCost(store, salary)

  // 還本付息
  let debt = 0
  for (const loan of store.loans) {
    const interest = loan.outstanding * LOAN_RATE
    const principal = Math.min(LOAN_PRINCIPAL, loan.outstanding)
    debt += principal + interest
    loan.outstanding -= principal
    loan.monthsLeft -= 1
  }
  store.loans = store.loans.filter((l) => l.outstanding > 0)

  // 缺貨 = 想買但沒得賣。分兩種原因，學生要分得出來：
  //   存貨不足（貨架空了）→ 去補貨
  //   產能不足（客人排隊）→ 去擴充
  const demandUnmet = Math.max(0, effectiveDemand - sold)
  const stockEmpty = shelfCups(store) === 0
  const shortageRate = effectiveDemand > 0 ? demandUnmet / effectiveDemand : 0
  // 缺貨扣聲譽，但每月的扣分有兩道上限：
  //   1. 單月最多扣 2 點
  //   2. 不能扣超過當前聲譽的一半
  // 為什麼：產能不足造成的缺貨是「結構性」的。若每月扣 5 點，
  // 小而穩（產能 3,800 對需求 5,500，缺貨 31%）會在幾個月內把聲譽扣到底，
  // 然後需求更少、更做不來——惡性循環，學生做什麼都救不回來。
  // 有上限之後，會收斂到供需新平衡，而「擴充產能」變成解鎖聲譽回升的動作。
  const basePoints = shortageRate === 0 ? 0 : shortageRate <= 0.1 ? 1 : shortageRate <= 0.25 ? 3 : 5
  const shortagePoints = Math.min(basePoints, 2, Math.floor(store.reputation / 2))
  store.reputation = clamp(store.reputation - shortagePoints, 0, 100)

  const grossMargin = netRevenue > 0 ? (netRevenue - materialCost) / netRevenue : 0
  const avgInventory = shelfCups(store) + sold / 2
  const daily = sold / 30
  const turnoverDays = daily > 0 ? avgInventory / daily : 0
  const operatingProfit = netRevenue - materialCost - fixed

  store.cash += netRevenue - materialCost - fixed - debt

  const idleStaff = Math.max(0, store.staff - store.stations)
  const visible: Visible = {
    customersEntered: Math.min(effectiveDemand, 40),
    customersServed: Math.min(sold, 40),
    customersTurnedAway: Math.min(demandUnmet, 40),
    staffAtStation: Math.min(store.staff, store.stations),
    staffIdle: idleStaff,
    shelfCups: Math.min(shelfCups(store), 40),
    cashDelta: netRevenue - materialCost - fixed - debt,
    shortageCause: stockEmpty ? 'stock' : sold < capacity - 1 ? 'capacity' : 'none',
    note: stockEmpty
      ? '貨架空了，客人看著空架子走掉'
      : sold < capacity - 1
        ? '貨還有，但沒人做得出來——缺的是工位，不是人手'
        : idleStaff > 0
          ? `${idleStaff} 個人沒有工位，站在走道上`
          : '正常營業',
  }

  // 這個月學生填的預測，結算時補上實際結果
  const pending = store.log.find((l) => l.month === month && l.actual === '')
  if (pending) {
    pending.actual = `賣 ${sold} 杯，毛利率 ${(grossMargin * 100).toFixed(1)}%`
  }
  const log: LogLine = {
    month,
    predicted: pending?.predicted ?? '',
    actual: `賣 ${sold} 杯，毛利率 ${(grossMargin * 100).toFixed(1)}%`,
    nextVariable: pending?.nextVariable ?? '',
  }

  return {
    month,
    year,
    demandDrawn,
    effectiveDemand,
    capacity,
    sold,
    revenue: netRevenue,
    materialCost,
    grossMargin,
    fixedCost: fixed,
    operatingProfit,
    shortageRate,
    reputationDelta: -shortagePoints,
    shortageFloor: stockEmpty || sold < capacity - 1,
    avgInventoryCups: avgInventory,
    turnoverDays,
    cash: store.cash,
    equity: equity(store),
    visible,
    log,
  }
}

export function advanceMonth(store: Store) {
  store.month += 1
  if (store.month > 12) {
    store.month = 1
    store.year += 1
  }
}

/** 破產時的六條路線。裁員重組是唯一從根上解決的。 */
export const RESCUE_ROUTES = [
  {
    key: 'restructure',
    label: '裁員重組',
    get: '立刻降低固定成本',
    cost: '產能永久下降，之後要靠需求追回來',
  },
  {
    key: 'gig',
    label: '經營者打工',
    get: '每月 +45,000 現金',
    cost: '連續 3 個月以上供給上限 ×0.85；當月少一個主要行動',
  },
  {
    key: 'pause',
    label: '暫停營業',
    get: '暫停銷售與原料成本，員工轉無薪假',
    cost: '聲譽每月 −5；固定成本減半',
  },
  {
    key: 'defer',
    label: '協商延付',
    get: '延後當月固定成本的 50%',
    cost: '次月加付 10% 手續費，同一支出不可連續兩個月',
  },
  {
    key: 'merge',
    label: '合作併店',
    get: '與另一組共享供給和固定成本',
    cost: '兩組共同決定，淨值按約定比例分配',
  },
  {
    key: 'close',
    label: '清算',
    get: '結束店舖並保留最後帳本',
    cost: '不再參加排行榜，但完成一次破產診斷',
  },
] as const
