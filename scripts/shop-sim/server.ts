/**
 * 飲料店經營模擬：遊戲伺服器。
 *
 * 學生在自己的瀏覽器看到自己的店面、客人和員工；數字互不可見。
 * 老師推進月份、抽需求、觸發事件卡；投影頁只顯示排行榜。
 *
 * 這支程式要從 W04 連續跑 12 週，所以所有進度都寫進本機 SQLite。
 * 老師關掉筆電、隔週再開，學生輸入同一個房號和店名就回到原位。
 * 只有 WebSocket 連線本身是記憶體的（連線本來就該是暫時的）。
 *
 * 資料只落在本機一個檔案，沒有雲端、沒有第三方服務、沒有學生資料離開教室。
 *
 *   bun run shop
 */

import { join, resolve } from 'node:path'
import {
  archiveLeaderboard,
  attachActual,
  type Campaign,
  createCampaign,
  databasePath,
  exportCampaign,
  findCampaign,
  findPlayer,
  fullHistory,
  insertPlayer,
  leaderboardHistory,
  listDecisions,
  listPlayers,
  openDatabase,
  type Player,
  recordDecision,
  recordResult,
  saveCampaign,
  savePlayer,
  yearOf,
} from './db'
import {
  advanceMonth,
  applyDecisions,
  createStore,
  type Decision,
  demandRange,
  effectiveCapacity,
  equity,
  type MonthResult,
  RESCUE_ROUTES,
  SALARY,
  START_CASH,
  type StoreType,
  settleMonth,
  shelfCups,
} from './rules'
import { SCENE_CODE } from './scene'

type Role = 'student' | 'projector' | 'teacher'

/** 精靈圖放在 public/，課程網站和模擬讀同一份。 */
const PUBLIC_DIR = resolve(import.meta.dir, '..', '..', 'public')

/** 12 張事件卡。老師在課堂上按，卡會公告給全班並影響需求或成本。 */
const CARDS = [
  'viral',
  'group-buy',
  'ingredient-down',
  'new-customers',
  'free-equipment',
  'sunny',
  'poach',
  'ingredient-up',
  'competitor',
  'rain',
  'outage',
  'complaint',
  'inspection',
] as const

const peers = new Map<Channel, Peer>()
let nextClientId = 1

interface Peer {
  role: Role | null
  code: string
  clientId: number
  playerId: number | null
}

interface Channel {
  send(data: string): unknown
  close(code?: number, reason?: string): void
}

openDatabase()

/** 這個房號的剩餘卡 = 全部卡扣掉用過的。 */
function remainingCards(c: Campaign) {
  return CARDS.filter((card) => !c.usedCards.includes(card))
}

/**
 * 開一堂新課。老師選「開新的一屆」時呼叫。
 * 房號是 4 位數字，因為學生要自己手打在網址列。
 */
function newCampaign(name: string) {
  return createCampaign(name || '115 數位插畫')
}

/** 學生端只看得到自己的店。老師端看得到全部。投影端只有排行榜。 */
function studentView(player: Player) {
  const s = player.store
  const c = findCampaign(player.campaignCode)!
  const last = yearOf(player.id, s.year).slice(-1)[0] ?? null
  return {
    kind: 'state',
    role: 'student' as const,
    code: player.campaignCode,
    year: s.year,
    month: s.month,
    locked: c.locked,
    store: {
      id: player.id,
      name: s.name,
      type: s.type,
      staff: s.staff,
      stations: s.stations,
      flow: Number(s.flow.toFixed(3)),
      morale: s.morale,
      reputation: s.reputation,
      price: s.price,
      cash: s.cash,
      equity: equity(s),
      loans: s.loans.length,
      shelf: shelfCups(s),
      capacity: effectiveCapacity(s),
      idle: Math.max(0, s.staff - s.stations),
      events: s.events,
      submitted: player.submitted,
    },
    demand: demandRange(s.year),
    visible: last
      ? {
          customersEntered: Math.min(last.demand, 40),
          customersServed: Math.min(last.sold, 40),
          customersTurnedAway: Math.min(Math.max(0, last.demand - last.sold), 40),
          note: last.note,
        }
      : null,
    lastResult: last
      ? {
          month: last.month,
          sold: last.sold,
          revenue: last.revenue,
          materialCost: last.materialCost,
          grossMargin: last.grossMargin,
          fixedCost: last.fixedCost,
          operatingProfit: last.operatingProfit,
          turnoverDays: last.turnoverDays,
          shortageRate: last.shortageRate,
        }
      : null,
    log: s.log.slice(-24),
    /** 永久紀錄：這個學生走過的每一步，重開機也還在 */
    record: listDecisions(player.id).slice(-36),
    /** 已完成的年度清單，讓學生知道自己在第幾年 */
    completedYears: fullHistory(player.id),
    boards: leaderboardHistory(player.campaignCode),
  }
}

function teacherView(c: Campaign) {
  const players = listPlayers(c.code)
  return {
    kind: 'state',
    role: 'teacher' as const,
    code: c.code,
    campaignName: c.name,
    year: c.year,
    month: c.month,
    locked: c.locked,
    revealed: c.revealed,
    demand: demandRange(c.year),
    cards: remainingCards(c).map((key) => ({ key, label: CARD_LABELS[key] })),
    usedCards: c.usedCards,
    dbPath: databasePath(),
    groups: players.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.store.type,
      submitted: p.submitted,
      staff: p.store.staff,
      stations: p.store.stations,
      cash: p.store.cash,
      equity: equity(p.store),
      morale: p.store.morale,
      reputation: p.store.reputation,
      capacity: effectiveCapacity(p.store),
      shelf: shelfCups(p.store),
      idle: Math.max(0, p.store.staff - p.store.stations),
      events: p.store.events,
    })),
    rescueRoutes: RESCUE_ROUTES.map((r) => ({
      key: r.key,
      label: r.label,
      get: r.get,
      cost: r.cost,
    })),
    boards: leaderboardHistory(c.code),
  }
}

/** 投影端只有名次和淨值變化，這是設計文件明文的邊界。 */
function projectorView(c: Campaign) {
  return {
    kind: 'state',
    role: 'projector' as const,
    year: c.year,
    revealed: c.revealed,
    rows: yearBoard(c),
  }
}

/** 這一屆的即時排名。同一顆需求種子讓橫向比較有意義。 */
function yearBoard(c: Campaign) {
  return listPlayers(c.code)
    .map((p) => ({ name: p.name, delta: yearDelta(p, c.year) }))
    .sort((a, b) => b.delta - a.delta)
    .map((r, i) => ({ rank: i + 1, name: r.name, delta: r.delta }))
}

/** 今年淨值變化 = 目前淨值 − 年初淨值。年初淨值取該年 1 月結算後的淨值。 */
function yearDelta(p: Player, year: number) {
  const months = yearOf(p.id, year)
  const start = months.find((m) => m.month === 1)
  return equity(p.store) - (start ? start.equity : START_CASH)
}

const CARD_LABELS: Record<string, string> = {
  viral: 'IG 爆紅',
  'group-buy': '團購湧入',
  'ingredient-down': '原料降價',
  'new-customers': '附近開新學院',
  'free-equipment': '設備贈品',
  sunny: '連續晴天',
  poach: '被挖角',
  'ingredient-up': '原料漲價',
  competitor: '隔壁開店',
  rain: '連日大雨',
  outage: '停電',
  complaint: '客人投訴',
  inspection: '衛生稽查',
}

/**
 * 送一個訊息給某條連線。
 *
 * `T extends keyof ServerMessageMap`（**不是** `extends ServerMessageMap`）：
 * type 要的是訊息的**名稱**，所以約束必須是那張表的 key。
 * 寫成表本身時 TS 不會報錯，但 `T` 會被推成一個表物件，
 * 拼錯的訊息名稱就這樣悄悄溜過去了。
 */
function send<T extends keyof ServerMessageMap>(channel: Channel, type: T, payload: unknown = {}) {
  channel.send(JSON.stringify({ type, payload }))
}

/** 把狀態推給這個房號底下所有連線，依角色給不同視圖。 */
function pushState(code: string) {
  const c = findCampaign(code)
  if (!c) return
  for (const [channel, peer] of peers) {
    if (peer.code !== code) continue
    if (peer.role === 'teacher') send(channel, 'state', teacherView(c))
    else if (peer.role === 'projector') send(channel, 'state', projectorView(c))
    else if (peer.playerId) {
      const player = listPlayers(code).find((p) => p.id === peer.playerId)
      if (player) send(channel, 'state', studentView(player))
    }
  }
}

interface ServerMessageMap {
  hello: Record<string, unknown>
  state: unknown
  error: { message: string }
  settled: MonthResult
  export: unknown
}

const server = Bun.serve<{ peer: Peer }>({
  port: Number(process.env.PORT ?? 8788),
  fetch(req, srv) {
    const url = new URL(req.url)
    if (url.pathname === '/ws') {
      if (
        srv.upgrade(req, {
          data: { peer: { role: null, code: '', clientId: nextClientId++, playerId: null } },
        })
      )
        return
      return new Response('expected websocket', { status: 400 })
    }
    // 精靈圖。放在 public/ 讓它進版控管，也讓離線可建——
    // 課程網站和這個模擬都讀同一份檔，不會有兩套不一致的圖。
    if (url.pathname === '/shop-sprites.png' || url.pathname === '/shop-sprites.json') {
      const file = Bun.file(join(PUBLIC_DIR, url.pathname.slice(1)))
      if (file.size > 0) return new Response(file)
      return new Response(
        'sprite sheet 尚未產生：請先跑 python3 scripts/shop-sim/make-sprites.py',
        { status: 404 }
      )
    }
    // 老師開新的一屆之後，房號要能在網址列分享
    if (url.pathname === '/t' && url.searchParams.get('code') === 'new') {
      const c = newCampaign('115 數位插畫')
      return new Response(redirect(`/t?code=${c.code}`), {
        headers: { location: `/t?code=${c.code}` },
      })
    }
    const page =
      url.pathname === '/p'
        ? projectorPage
        : url.pathname === '/t'
          ? teacherPage
          : url.pathname === '/'
            ? landingPage
            : studentPage
    return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  },
  websocket: {
    open(ws) {
      peers.set(ws, ws.data.peer)
    },
    message(ws, raw) {
      handleMessage(ws, ws.data.peer, String(raw))
    },
    close(ws) {
      peers.delete(ws)
    },
  },
})

function redirect(body: string) {
  return `<!doctype html><meta charset="utf-8"><body>${body}</body>`
}

function handleMessage(ws: Channel, peer: Peer, raw: string) {
  let msg: { type: string; payload: Record<string, unknown> }
  try {
    msg = JSON.parse(raw)
  } catch {
    return send(ws, 'error', { message: 'bad json' })
  }
  const p = msg.payload ?? {}

  if (msg.type === 'identify') {
    peer.role = p.role as Role
    const code = String(p.code ?? '')
    peer.code = code

    if (peer.role === 'teacher') {
      // 老師可以帶入既有的房號，或開一堂新的
      const campaign = p.newCampaign
        ? newCampaign(String(p.campaignName ?? ''))
        : findCampaign(code)
      if (!campaign) return send(ws, 'error', { message: '房號不存在。老師請按「開新的一屆」' })
      peer.code = campaign.code
      send(ws, 'hello', { role: peer.role, campaign })
      return pushState(peer.code)
    }

    const c = findCampaign(code)
    if (!c) return send(ws, 'error', { message: '房號不存在，請確認老師螢幕上的數字' })

    if (peer.role === 'student') {
      const name = String(p.name ?? '')
        .trim()
        .slice(0, 12)
      if (!name) return send(ws, 'error', { message: '請先輸入店名' })
      // 同一個名字 = 同一組。隔週回來就回到原本的位置。
      let player = findPlayer(code, name)
      if (!player) {
        const type = (p.type as StoreType['key']) ?? 'mid'
        const count = listPlayers(code).length
        insertPlayer(code, name, type, createStore(name, type, (count + 1) * 137))
        player = findPlayer(code, name)!
        send(ws, 'hello', { role: peer.role, created: true, campaign: c })
      } else {
        send(ws, 'hello', {
          role: peer.role,
          created: false,
          campaign: c,
          resumed: { year: player.store.year, month: player.store.month },
        })
      }
      peer.playerId = player.id
      return pushState(peer.code)
    }

    // 投影端也要收到 hello，否則前端不知道連線成功了
    send(ws, 'hello', { role: peer.role, campaign: c })
    return pushState(peer.code)
  }

  if (!peer.role || !findCampaign(peer.code)) return
  const c = findCampaign(peer.code)!

  if (msg.type === 'decide' && peer.role === 'student' && peer.playerId) {
    const player = listPlayers(peer.code).find((x) => x.id === peer.playerId)
    if (!player) return
    if (c.locked) return send(ws, 'error', { message: '老師還沒開放這個月' })
    const decisions = (p.decisions ?? []) as Decision[]
    const result = applyDecisions(player.store, decisions)
    if (!result.ok) return send(ws, 'error', { message: result.message })
    player.submitted = true

    const predicted = String(p.predicted ?? '').slice(0, 120)
    const nextVariable = String(p.nextVariable ?? '').slice(0, 120)
    recordDecision(
      player.id,
      player.store.year,
      player.store.month,
      decisions,
      predicted,
      nextVariable
    )

    // 預測先寫進遊戲內的 log（給場景顯示），實際結果等結算補
    player.store.log = player.store.log.filter((l) => l.month !== player.store.month)
    player.store.log.push({ month: player.store.month, predicted, actual: '', nextVariable })
    savePlayer(player)
    return pushState(peer.code)
  }

  if (msg.type === 'open' && peer.role === 'teacher') {
    c.locked = false
    saveCampaign(c)
    return pushState(peer.code)
  }
  if (msg.type === 'lock' && peer.role === 'teacher') {
    c.locked = true
    saveCampaign(c)
    return pushState(peer.code)
  }

  if (msg.type === 'next-month' && peer.role === 'teacher') {
    // 這一步會改變所有組的進度，所以先寫檔再推播。
    // 中途失敗最壞是「這個月沒結算」，不是「資料損毀」。
    for (const player of listPlayers(c.code)) {
      const result: MonthResult = settleMonth(player.store, SALARY)
      player.submitted = false
      recordResult(player.id, result)
      attachActual(player.id, result.year, result.month, result.visible.note)
      savePlayer(player)
      send(ws, 'settled', result)
    }
    c.locked = true
    const advanced = advanceCampaign(c)
    c.year = advanced.year
    c.month = advanced.month
    saveCampaign(c)
    for (const player of listPlayers(c.code)) {
      advanceMonth(player.store)
      savePlayer(player)
    }
    return pushState(peer.code)
  }

  if (msg.type === 'announce' && peer.role === 'teacher') {
    const text = String(p.text ?? '')
    const kind = String(p.kind ?? 'info')
    for (const player of listPlayers(c.code)) {
      if (kind === 'pandemic') player.store.events = ['pandemic']
      else if (kind === 'reset') player.store.events = []
      else if (p.card) player.store.events = [...player.store.events, String(p.card)]
      player.store.log.push({
        month: player.store.month,
        predicted: '',
        actual: text,
        nextVariable: '',
      })
      savePlayer(player)
    }
    if (typeof p.card === 'string' && p.card) c.usedCards = [...new Set([...c.usedCards, p.card])]
    if (kind === 'pandemic') c.pandemicUsed = true
    saveCampaign(c)
    return pushState(peer.code)
  }

  if (msg.type === 'year-end' && peer.role === 'teacher') {
    // 公開這一年的成績，並存成永久紀錄。之後學生在歷年排行榜看得到。
    const rows = listPlayers(c.code)
      .map((p) => ({ name: p.name, playerId: p.id, delta: yearDelta(p, c.year) }))
      .sort((a, b) => b.delta - a.delta)
    archiveLeaderboard(c.code, c.year, rows)
    c.revealed = true
    saveCampaign(c)
    return pushState(peer.code)
  }
  if (msg.type === 'reset-year' && peer.role === 'teacher') {
    c.revealed = false
    saveCampaign(c)
    return pushState(peer.code)
  }

  if (msg.type === 'rescue' && peer.role === 'student' && peer.playerId) {
    const player = listPlayers(peer.code).find((x) => x.id === peer.playerId)
    if (!player) return
    if (player.store.cash >= 0) return send(ws, 'error', { message: '目前不是負資產' })
    const route = String(p.route ?? '')
    player.store.bankruptRoute = route
    if (route === 'gig') player.store.cash += 45_000
    if (route === 'restructure')
      player.store.staff = Math.max(0, Math.floor(player.store.staff / 2))
    if (route === 'close') player.store.cash = equity(player.store)
    savePlayer(player)
    return pushState(peer.code)
  }

  if (msg.type === 'reset-store' && peer.role === 'student' && peer.playerId) {
    // 開錯店型就重來。只在第 1 年、第 1 月開放，避免有人洗掉自己的紀錄。
    const player = listPlayers(peer.code).find((x) => x.id === peer.playerId)
    if (!player) return
    if (player.store.year !== 1 || player.store.month !== 1) {
      return send(ws, 'error', { message: '已經開過張了，不能重來' })
    }
    const type = (p.type as StoreType['key']) ?? 'mid'
    player.store = createStore(player.name, type, player.store.demandSeed)
    player.submitted = false
    savePlayer(player)
    return pushState(peer.code)
  }

  if (msg.type === 'export' && peer.role === 'teacher') {
    const data = exportCampaign(peer.code)
    return send(ws, 'export', data)
  }
}

function advanceCampaign(c: Campaign) {
  const month = c.month + 1
  return month > 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month }
}

const sharedStyles = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans TC','PingFang TC',system-ui,sans-serif;background:#f5efe3;color:#2b2118}
button{font:inherit;cursor:pointer;border:0;border-radius:6px;padding:.5rem .9rem;background:#3b6ea5;color:#fff}
button:disabled{opacity:.4;cursor:not-allowed}
.card{background:#fffdf7;border:2px solid #2b2118;border-radius:10px;padding:.8rem 1rem;box-shadow:3px 3px 0 #2b2118}
.mono{font-variant-numeric:tabular-nums;font-weight:700}
h1{font-size:1.1rem}
`

const studentPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>我的飲料店</title><style>${sharedStyles}
.wrap{max-width:900px;margin:0 auto;padding:.7rem}
.stage{position:relative;display:flex;justify-content:center;margin:.4rem 0}
canvas{image-rendering:pixelated;border:2px solid #2b2118;border-radius:8px;
  background:#e2d6c0;box-shadow:3px 3px 0 #2b2118;touch-action:none}
.hint{position:absolute;left:0;right:0;bottom:-1.1rem;text-align:center;font-size:.68rem;color:#7a6a55}
.hud{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:.3rem;margin:1.2rem 0 .5rem}
.stat{background:#fffdf7;border:1px solid #c9bda9;border-radius:6px;padding:.28rem .4rem;text-align:center}
.stat b{display:block;font-size:.9rem}
.stat span{font-size:.56rem;color:#7a6a55}
.card{margin:.45rem 0}
.choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:.3rem;margin:.3rem 0}
.choices button{background:#fffdf7;color:#2b2118;border:2px solid #2b2118;box-shadow:2px 2px 0 #2b2118;
  font-size:.74rem;text-align:left;padding:.32rem .45rem}
.choices button.on{background:#ffd97a}
.choices button small{display:block;font-size:.58rem;color:#7a6a55;margin-top:.1rem}
.slot-bar{font-size:.74rem;background:#fff4dc;border:1px dashed #c9a227;padding:.3rem .5rem;border-radius:5px;margin:.3rem 0}
.sub{font-size:.68rem;color:#6b5a45;line-height:1.6;margin:.25rem 0}
textarea{width:100%;font:inherit;font-size:.74rem;padding:.32rem;border:2px solid #2b2118;
  border-radius:6px;background:#fffdf7;margin:.12rem 0}
.submit-row{display:flex;gap:.4rem;align-items:center;margin-top:.3rem}
.submit-row button{flex:1}
.err{background:#f3d9d4;border:2px solid #b04a3a;padding:.4rem .6rem;border-radius:6px;font-size:.75rem;margin:.4rem 0}
.logline{font-size:.67rem;border-bottom:1px solid #e0d6c4;padding:.2rem 0;display:grid;
  grid-template-columns:56px 1fr;gap:.3rem}
.logline b{color:#6b5a45}
.yearbar{display:flex;gap:.25rem;flex-wrap:wrap;margin:.3rem 0}
.yearbar span{font-size:.66rem;background:#e8dcc6;border-radius:4px;padding:.1rem .35rem}
.yearbar b{background:#ffd97a}
.join{display:grid;gap:.4rem;max-width:340px;margin:3rem auto;text-align:left}
.join input{font:inherit;padding:.6rem;border:2px solid #2b2118;border-radius:6px;background:#fffdf7}
.join select{font:inherit;padding:.6rem;border:2px solid #2b2118;border-radius:6px;background:#fffdf7}
</style></head><body><div class="wrap">
<div id="join" class="join">
  <h1>開一間屬於你的飲料店</h1>
  <p class="sub">輸入房號和店名。同一個店名下次進來會回到你上次的進度。</p>
  <input id="jname" placeholder="店名（例如：小而穩）" maxlength="12">
  <select id="jtype">
    <option value="small">小而穩：1 個工位、1 個人、租金便宜</option>
    <option value="mid" selected>平衡店：3 個工位、3 個人</option>
    <option value="big">先擴張：6 個工位、6 個人、固定成本高</option>
  </select>
  <input id="jcode" inputmode="numeric" maxlength="4" placeholder="4 位房號">
  <button id="jgo">開門營業</button>
  <p class="sub" id="jerr" style="color:#b04a3a"></p>
</div>

<div id="play" style="display:none">
  <h1 id="h"></h1>
  <div class="stage">
    <canvas id="cv"></canvas>
    <div class="hint">方向鍵或 WASD 走動　·　走到貨架／吧檯／門口／辦公室決定要做什麼</div>
  </div>
  <div class="hud" id="hud"></div>
  <div class="card" id="picker"></div>
  <div class="card" id="last"></div>
  <div class="card" id="record"></div>
  <div class="card" id="log"></div>
</div>
</div><script>
const $=s=>document.querySelector(s);
let state=null, picked=new Map(), spot=null, ws, view=null;
let boss={x:8*16, y:10*16, facing:'down', moving:false, frame:0};

const ACT={
  'buy-small':['小批進貨 1,000 杯','20,000 元／批，單價 20 元'],
  'buy-large':['大批進貨 4,000 杯','64,000 元／批，單價 16 元'],
  'set-price':['調整售價','在 45–75 之間'],
  'promo':['做促銷','售價 ×0.80，需求 ×1.40'],
  'hire':['新聘一人','20,000 元，供給 +3,800 杯'],
  'fire':['資遣一人','依年資付資遣費'],
  'flow':['改善流程','40,000 元，動線 ×1.08'],
  'expansion':['擴建','工位 +3，900,000 元'],
  'shift':['排班','半班 ×0.9／進修假 ×0.75'],
  'loan':['借款 100 萬','每月還 5 萬加利息'],
};

/** 走到哪裡可以做什麼。半徑 30px ≈ 一格半，走到了才會出現。 */
const SPOTS=[
  {key:'shelf',  label:'配料盒', hint:'看存量、進貨',    x:6*16+8,   y:62+26,    actions:['buy-small','buy-large']},
  {key:'counter',label:'茶桶工位', hint:'價格與促銷',    x:8*16,     y:62+26,     actions:['set-price','promo']},
  {key:'door',   label:'門口',   hint:'進出的客人和外送單', x:13*16, y:9*16-34, actions:[]},
  {key:'office', label:'後場通道', hint:'人、產能與錢',  x:11*16,    y:50,        actions:['hire','fire','flow','expansion','shift','loan']},
];
function nearest(){
  let best=null, bd=30;
  for(const sp of SPOTS){
    const d=Math.hypot(boss.x-sp.x, boss.y-sp.y);
    if(d<bd){bd=d;best=sp}
  }
  return best;
}

${SCENE_CODE}

/* ── 走動 ───────────────────────────────────────────── */
const keys={};
addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.key]=false});

setInterval(()=>{
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.a) dx=-1;
  if(keys.ArrowRight||keys.d) dx=1;
  if(keys.ArrowUp||keys.w) dy=-1;
  if(keys.ArrowDown||keys.s) dy=1;
  if(!dx&&!dy){boss.moving=false;return}
  boss.moving=true;
  boss.x=Math.max(8,Math.min((MAP.COLS-1)*16,boss.x+dx*6));
  boss.y=Math.max(MAP.WALL_H+4,Math.min((MAP.ROWS-1)*16-4,boss.y+dy*6));
  if(dy) boss.facing = dy<0?'up':'down';
  else boss.facing='left';
  boss.frame=(boss.frame+1)%3;
  const n=nearest();
  if((n?n.key:null)!==spot){spot=n?n.key:null;render()}
},90);

/* ── 連線 ───────────────────────────────────────────── */
function connect(payload){
  ws=new WebSocket('ws://'+location.host+'/ws');
  ws.onopen=()=>ws.send(JSON.stringify({type:'identify',payload}));
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.type==='hello'){
      if(m.payload.resumed) location.hash='';
      $('#join').style.display='none';
      $('#play').style.display='';
      if(!view){
        view=createShopView($('#cv'));
        view.resize();
        // 精靈圖還沒載完就先不啟動動畫迴圈，載完再 start
        loadSprites(()=>view.start());
      }
    }
    if(m.type==='state'){state=m.payload;render()}
    if(m.type==='error'){
      if($('#jerr')){ $('#jerr').textContent=m.payload.message; return }
      $('#picker').insertAdjacentHTML('afterbegin','<div class="err">'+m.payload.message+'</div>');
      setTimeout(()=>{const x=document.querySelector('.err');if(x)x.remove()},2600);
    }
  };
}

$('#jgo').onclick=()=>{
  const name=$('#jname').value.trim();
  const code=$('#jcode').value.trim();
  if(!name){$('#jerr').textContent='請先想一個店名';return}
  if(code.length!==4){$('#jerr').textContent='房號是 4 位數字，看老師的螢幕';return}
  connect({role:'student',code,name,type:$('#jtype').value});
};
$('#jcode').addEventListener('keydown',e=>{if(e.key==='Enter')$('#jgo').click()});

// 直接用網址參數進來（老師投影或自己測試時）
{
  const q=new URLSearchParams(location.search);
  if(q.get('code')&&q.get('name')) connect({role:'student',code:q.get('code'),name:q.get('name'),type:q.get('type')||'mid'});
}

function choose(k){
  if(picked.has(k))picked.delete(k);
  else{ if(picked.size>=3){alert('每月最多三個營運決策');return} picked.set(k,true) }
  render();
}

function render(){
  if(!state)return;const s=state.store;
  $('#h').textContent=s.name+'　第 '+state.year+' 年 '+state.month+' 月　'
    +(state.locked?'🔒 等老師開放':s.submitted?'✓ 已送出這個月':'🔓 可以下決策');

  /* 場景狀態 → 視覺 */
  const st={
    shelf:s.shelf,
    /* 一個料桶代表多少存貨。6 個桶 × 每桶容量 = 視覺上的「滿」。
       40,000 杯視覺上是滿的，因為那是超過 4 個月的產能。 */
    shelfMax:40000,
    onStation:Math.min(s.staff, MAP.BAYS, s.stations),
    idle:Math.max(0, s.staff - Math.min(s.stations, MAP.BAYS)),
    queue:Math.min(4, state.lastResult?Math.round(state.lastResult.sold/900):0),
    turned:state.lastResult?Math.min(4,Math.round(state.lastResult.shortageRate*6)):0,
    boss, note:null, noteTone:'info',
  };
  if(s.idle>0){st.note=s.idle+' 個人沒有工位';st.noteTone='warn'}
  else if(state.lastResult && state.lastResult.shortageRate>0.5){
    st.note=s.shelf<=0?'料桶空了，客人等不到珍珠':'料還有，但沒人做得出來';
    st.noteTone='bad';
  } else if(s.shelf<=0){st.note='料桶空了';st.noteTone='bad'}

  if(view) view.draw(st);

  $('#hud').innerHTML=[
    ['現金',Math.round(s.cash).toLocaleString()],['淨值',Math.round(s.equity).toLocaleString()],
    ['產能／月',s.capacity.toLocaleString()],['工位／人',Math.min(s.stations,MAP.BAYS)+'／'+s.staff],
    ['士氣',s.morale],['聲譽',s.reputation],['存貨',s.shelf.toLocaleString()],
  ].map(([k,v])=>'<div class="stat"><b class="mono">'+v+'</b><span>'+k+'</span></div>').join('');

  /* 決策：走到哪個地點才顯示哪個 */
  const sp=spot?SPOTS.find(x=>x.key===spot):null;
  let box = '<h1>本月決策</h1>';
  if(!sp){
    box += '<div class="sub">用方向鍵走到備料檯（看料桶、進貨）、出餐檯（價格）、'
      +'後場（人與錢）決定要做什麼。走過去才會出現選項。</div>';
  } else {
    box += '<div class="slot-bar">你在 '+sp.label+'　'+sp.hint+'</div>';
    if(!sp.actions.length){
      box += '<div class="sub">飲料店是外帶店：客人站在檯前等、拿了就走。'
        +'這裡沒有可執行的行動，但你可以數一數檯前有幾個人在等。</div>';
    } else {
      box += '<div class="choices">'+sp.actions.map(k=>{
        const a=ACT[k];
        return '<button data-act="'+k+'" class="'+(picked.has(k)?'on':'')+'">'+a[0]+'<small>'+a[1]+'</small></button>';
      }).join('')+'</div>';
      if(sp.key==='shelf') box += '<div class="sub">吧檯上的配料盒就是你的存貨：'
        +'珍珠、白玉粉圓、芋圓、紅豆、椰果、布丁。'
        +'補貨不佔三個決策格，但每一批都要付錢。'
        +'買超過賣得掉的量會囤著，60 天後過期（乾粉圓的實際保存期是 4 個月以上，所以這個期限是保守的）。</div>';
      if(sp.key==='counter') box += '<div class="sub">工位就是茶桶：' + Math.min(s.stations,MAP.BAYS) + ' 個茶桶對 ' + s.staff + ' 個人。<br>促銷是把售價打八折換需求成長四成。'
        +'但被打折的時候，櫃檯後面的人不夠就會白白流失。</div>';
      if(sp.key==='office'){
        box += '<div class="sub">工位 '+Math.min(s.stations,MAP.BAYS)+' 個、人 '+s.staff+' 個。'
          +'第 4 個人開始只能多做 40% 的產能——因為沒有多餘的工位。</div>';
        box += '<div class="sub">擴建要 900,000，是你本金的 22.5%。'
          +(s.cash<900000?'現在的現金 '+Math.round(s.cash).toLocaleString()+' 元付不起——要先借錢，或先存幾個月。':'現在的現金付得起。')+'</div>';
        if(s.loans) box += '<div class="sub">目前有借款：每月要還 5 萬本金加利息。</div>';
      }
    }
  }
  if(picked.size){
    box += '<div class="slot-bar">已選 '+picked.size+'／3 個營運決策：'
      +[...picked.keys()].map(k=>ACT[k][0]).join('、')+'</div>';
  }
  if(!state.locked && !s.submitted){
    box += '<textarea id="pred" placeholder="我預期改變哪個數字…" rows="1">'
      +(document.getElementById('pred')?.value||'')+'</textarea>';
    box += '<textarea id="next" placeholder="下個月我要改的唯一變數…" rows="1">'
      +(document.getElementById('next')?.value||'')+'</textarea>';
    box += '<div class="submit-row"><button id="submit">送出本月決策</button></div>';
  } else {
    box += '<div class="slot-bar">'+(s.submitted?'這個月已經送出了。':'老師還沒開放這個月。')+'</div>';
  }
  $('#picker').innerHTML=box;
  $('#picker').querySelectorAll('[data-act]').forEach(el=>el.onclick=()=>choose(el.dataset.act));
  const sub=document.getElementById('submit');
  if(sub) sub.onclick=()=>ws.send(JSON.stringify({type:'decide',payload:{
    decisions:[...picked.keys()].map(k=>({kind:k})),
    predicted:document.getElementById('pred').value,
    nextVariable:document.getElementById('next').value}}));

  if(state.lastResult){
    const r=state.lastResult;
    $('#last').innerHTML='<h1>上個月（第 '+r.month+' 月）結算</h1><div class="hud">'
      +[['賣出',r.sold+' 杯'],['營收',r.revenue.toLocaleString()],['原料',r.materialCost.toLocaleString()],
        ['毛利率',(r.grossMargin*100).toFixed(1)+'%'],['固定成本',r.fixedCost.toLocaleString()],
        ['營業利潤',Math.round(r.operatingProfit).toLocaleString()],['周轉天數',Math.round(r.turnoverDays)+' 天'],
        ['缺貨率',(r.shortageRate*100).toFixed(0)+'%']]
      .map(([k,v])=>'<div class="stat"><b class="mono">'+v+'</b><span>'+k+'</span></div>').join('')+'</div>';
  } else $('#last').innerHTML='<h1>第一個月。開門做生意。</h1>';

  /* 永久紀錄：關掉瀏覽器再回來都還在 */
  const rec=state.record||[];
  $('#record').innerHTML='<h1>我的經營紀錄（存機裡了）</h1>'
    +'<div class="yearbar">'+state.completedYears.map(y=>'<span>第 '+y+' 年</span>').join('')+'</div>'
    +(rec.length?'<div class="logline" style="font-weight:700;border-bottom:2px solid #2b2118">'
      +'<b>年／月</b><span>我選了什麼　→　實際結果　→　下個月的唯一變數</span></div>'
      +[...rec].reverse().slice(0,14).map(l=>'<div class="logline"><b>Y'+l.year+' M'+l.month+'</b><span>'
        +((l.actions||[]).map(k=>ACT[k]?ACT[k][0]:k).join('、')||'—')
        +'　→　'+(l.actual||'—')+(l.nextVariable?'　→　'+l.nextVariable:'')+'</span></div>').join('')
      :'<div class="sub">還沒有紀錄。第一個月剛開門。</div>');

  if(state.boards && state.boards.length){
    $('#log').innerHTML='<h1>歷年排行榜</h1>'+state.boards.map(b=>
      '<div class="sub"><b>第 '+b.year+' 年</b>　'
      +b.rows.map(r=>r.rank+'. '+r.name+' '+(r.delta>=0?'+':'')+Math.round(r.delta).toLocaleString()).join('　')
      +'</div>').join('');
  } else $('#log').innerHTML='';
}
</script></body></html>`

const teacherPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<title>教師端</title><style>${sharedStyles}
.wrap{max-width:1180px;margin:0 auto;padding:1rem}
.hud{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.5rem 0}
.room{background:#2b2118;color:#ffd97a;padding:.3rem .8rem;border-radius:6px;font-size:1.2rem;font-weight:700}
.room small{display:block;font-size:.6rem;color:#c9bda9;font-weight:400}
table{width:100%;border-collapse:collapse;font-size:.72rem}
th,td{padding:.3rem .4rem;border-bottom:1px solid #e0d6c4;text-align:right}
th:first-child,td:first-child,th:nth-child(2),td:nth-child(2){text-align:left}
.cards{display:flex;gap:.3rem;flex-wrap:wrap;margin:.4rem 0}
.cards button{background:#fffdf7;color:#2b2118;border:2px solid #2b2118;font-size:.7rem;padding:.3rem .5rem}
.cards button:hover{background:#ffd97a}
.warn{background:#f3d9d4;border:2px solid #b04a3a;padding:.4rem .6rem;border-radius:6px;font-size:.75rem;margin:.4rem 0}
.warn.ok{background:#e4efdc;border-color:#4d7c3a}
.db{font-size:.62rem;color:#8a7a65;word-break:break-all;margin:.3rem 0}
.grab{background:#fff4dc;border:2px dashed #c9a227;border-radius:8px;padding:.6rem;margin:.5rem 0}
.grab label{display:block;font-size:.68rem;margin:.2rem 0}
.grab input{font:inherit;font-size:.9rem;padding:.3rem;border:1px solid #c9a227;border-radius:5px;width:9rem;letter-spacing:.3em}
.grab a{display:inline-block;background:#3b6ea5;color:#fff;text-decoration:none;padding:.3rem .6rem;border-radius:5px;font-size:.75rem}
.boards{margin:.4rem 0;font-size:.7rem}
.boards b{color:#2b2118}
</style></head><body><div class="wrap">
<h1>教師端</h1>
<div class="hud"><span class="room" id="room">連線中…</span><span id="ym"></span>
<button id="open">開放本月</button><button id="lock">鎖定</button>
<button id="next">結算並進入下個月</button>
<button id="yearend">公布排行榜</button><button id="reset">收起排行榜</button>
<a class="grab" id="purl" href="#" target="_blank" style="background:#3b6ea5;color:#fff;text-decoration:none;padding:.35rem .7rem;border-radius:5px;font-size:.85rem">開投影頁</a></div>
<div class="warn" id="warn">連線中…</div>
<div class="grab" id="grab">
  <b style="font-size:.8rem">學生怎麼進來</b>
  <label>1. 學生在瀏覽器打開這個網址（同一個 WiFi）</label>
  <a id="surl" href="#" target="_blank">學生頁</a>
  <label style="margin-top:.4rem">2. 學生自己輸入房號 <b id="codeInline">—</b> 和店名</label>
  <label>3. 投影頁只有名次和淨值變化，<b>不顯示任何一家的現金</b></label>
</div>
<div class="hud"><span>需求區間</span><span class="mono" id="dr"></span>
<span>剩餘事件卡</span><span class="mono" id="rc"></span></div>
<div class="card"><h1>本年大事紀</h1><div class="cards" id="cards"></div>
<h1>公告</h1><div class="cards">
<button data-t="pandemic" style="background:#f3d9d4">宣布疫情（第 8 年用）</button>
<button data-t="reset" style="background:#e5eef7">清除事件</button></div></div>
<div class="card"><h1>各組狀態</h1><table id="tbl"></table>
<div class="db" id="db"></div></div>
<div class="card"><h1>歷年排行榜</h1><div class="boards" id="boards">還沒有公開過</div>
<button id="export">匯出全班紀錄（JSON）</button></div>
</div><script>
const $=s=>document.querySelector(s);
let st=null;
const ws=new WebSocket('ws://'+location.host+'/ws');
const q=new URLSearchParams(location.search);
ws.onopen=()=>ws.send(JSON.stringify({type:'identify',payload:{role:'teacher',code:q.get('code')}}));
ws.onmessage=e=>{const m=JSON.parse(e.data);
  if(m.type==='error'){$('#warn').textContent='⚠ '+m.payload.message;$('#warn').classList.remove('ok')}
  if(m.type==='state'){st=m.payload;render()}};
function render(){
  if(!st||st.role!=='teacher')return;
  const host=location.host;
  $('#room').innerHTML='房號 '+st.code+'<small>'+(st.campaignName||'')+'</small>';
  $('#codeInline').textContent=st.code;
  $('#surl').href='http://'+host+'/?code='+st.code;
  $('#surl').textContent='http://'+host+'/?code='+st.code;
  $('#purl').href='http://'+host+'/p?code='+st.code;
  $('#ym').textContent='第 '+st.year+' 年 '+st.month+' 月　'+(st.locked?'🔒 已鎖定':'🔓 開放中');
  $('#dr').textContent=st.demand.low.toLocaleString()+' – '+st.demand.high.toLocaleString()+' 杯';
  $('#rc').textContent=st.cards.length;
  const notReady=st.groups.filter(g=>!g.submitted).length;
  const w=$('#warn');
  w.classList.toggle('ok',notReady===0);
  w.textContent = st.groups.length===0
    ? '還沒有人進來。把上面的網址給學生。'
    : notReady ? '⚠ '+notReady+' 組還沒送出本月決策'
    : '✓ 全組已送出，可以結算。進度已經寫進資料庫。';
  $('#next').disabled=notReady>0;
  $('#cards').innerHTML=st.cards.length
    ? st.cards.map(c=>'<button data-c="'+c.key+'">'+c.label+'</button>').join('')
    : '<span style="font-size:.7rem;color:#7a6a55">事件卡用完了</span>';
  $('#cards').onclick=e=>{const c=e.target.dataset.c;
    if(c&&confirm('宣布「'+(st.cards.find(x=>x.key===c)||{label:c}).label+'」給全班？'))
      ws.send(JSON.stringify({type:'announce',payload:{card:c,text:'事件：'+(st.cards.find(x=>x.key===c)||{label:c}).label,kind:'card'}}))};
  $('#tbl').innerHTML='<tr><th>店</th><th>型</th><th>人/位</th><th>閒置</th><th>產能</th><th>存貨</th><th>現金</th><th>淨值</th><th>士氣</th><th>聲譽</th><th>事件</th><th>本月</th></tr>'+
    (st.groups.length?st.groups.map(g=>'<tr><td>'+g.name+'</td><td>'+g.type+'</td><td>'+g.staff+'/'+g.stations+'</td>'+
    '<td class="mono">'+(g.idle||'—')+'</td><td class="mono">'+g.capacity.toLocaleString()+'</td>'+
    '<td class="mono">'+g.shelf.toLocaleString()+'</td>'+
    '<td class="mono">'+Math.round(g.cash).toLocaleString()+'</td><td class="mono">'+Math.round(g.equity).toLocaleString()+'</td>'+
    '<td class="mono">'+g.morale+'</td><td class="mono">'+g.reputation+'</td><td>'+g.events.join(',')+'</td>'+
    '<td>'+(g.submitted?'✓':'—')+'</td></tr>').join('')
    :'<tr><td colspan="12" style="color:#8a7a65">—</td></tr>');
  $('#db').textContent='存檔位置：'+st.dbPath;
  $('#boards').innerHTML = st.boards.length
    ? st.boards.map(b=>'<div style="margin:.3rem 0"><b>第 '+b.year+' 年</b>　'+
        b.rows.map(r=>r.rank+'. '+r.name+' '+(r.delta>=0?'+':'')+Math.round(r.delta).toLocaleString()).join('　')+'</div>').join('')
    : '還沒有公開過';
  $('#open').onclick=()=>ws.send(JSON.stringify({type:'open',payload:{}}));
  $('#lock').onclick=()=>ws.send(JSON.stringify({type:'lock',payload:{}}));
  $('#next').onclick=()=>{if(confirm('確定結算本月並進入下個月？所有組的進度會寫進資料庫。'))
    ws.send(JSON.stringify({type:'next-month',payload:{}}))};
  $('#yearend').onclick=()=>{if(confirm('公布第 '+st.year+' 年排行榜？公布後會永久存檔。'))
    ws.send(JSON.stringify({type:'year-end',payload:{}}))};
  $('#reset').onclick=()=>ws.send(JSON.stringify({type:'reset-year',payload:{}}));
  $('#export').onclick=()=>ws.send(JSON.stringify({type:'export',payload:{}}));
}
document.querySelectorAll('.cards button[data-t]').forEach(b=>b.onclick=()=>
  ws.send(JSON.stringify({type:'announce',payload:{text:b.textContent,kind:b.dataset.t}})));
</script></body></html>`

/** 開機頁：老師從這裡進，學生不會出現在網址列。 */
const landingPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>飲料店經營模擬</title><style>${sharedStyles}
body{background:#f5efe3}
.wrap{max-width:560px;margin:0 auto;padding:2rem 1rem}
h1{font-size:1.6rem;margin-bottom:.3rem}
p{font-size:.85rem;color:#6b5a45;line-height:1.7}
.stack{display:flex;flex-direction:column;gap:.5rem;margin:1.2rem 0}
.stack a,.stack button{display:block;width:100%;padding:.8rem;text-align:center;font-size:1rem;
  border-radius:8px;border:2px solid #2b2118;background:#fffdf7;color:#2b2118;
  box-shadow:3px 3px 0 #2b2118;text-decoration:none;font-family:inherit}
.stack a:hover,.stack button:hover{background:#ffd97a}
.primary{background:#3b6ea5!important;color:#fff!important}
.note{font-size:.72rem;color:#8a7a65;margin-top:1.2rem;border-top:1px solid #d8ccb8;padding-top:.8rem}
</style></head><body><div class="wrap">
<h1>飲料店經營模擬</h1>
<p>12 週跑 12 年。學生的選擇與進度會存在本機資料庫，關掉瀏覽器再開仍在原位。</p>
<div class="stack">
<a class="primary" href="/t?code=new">開一屆新的（上課前按一次）</a>
</div>
<p style="font-size:.8rem">已經有房號了？</p>
<div class="stack" style="flex-direction:row">
<input id="code" inputmode="numeric" maxlength="4" placeholder="4 位房號"
  style="flex:1;padding:.7rem;font-size:1.1rem;letter-spacing:.4em;border:2px solid #2b2118;border-radius:8px;background:#fffdf7">
<button style="padding:.7rem 1.2rem" onclick="go()">進入教師端</button>
</div>
<div class="note">學生端：<code>/?code=房號</code>，輸入房號和店名就能進。<br>
所有資料只留在這台電腦的一個 SQLite 檔案裡，不會上網。</div>
</div><script>
function go(){
  const v=document.getElementById('code').value.trim();
  if(v.length===4) location.href='/t?code='+v;
}
document.getElementById('code').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
</script></body></html>`

const projectorPage = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<title>排行榜</title><style>${sharedStyles}
body{background:#1c1611;color:#f5efe3;display:flex;align-items:center;justify-content:center;min-height:100vh}
.board{width:min(720px,92vw)}
h1{font-size:2.4rem;margin-bottom:.4rem;color:#ffd97a}
table{width:100%;border-collapse:collapse;font-size:1.4rem}
th,td{padding:.5rem .6rem;text-align:right}
th:first-child,td:first-child,th:nth-child(2),td:nth-child(2){text-align:left}
tr{border-bottom:1px solid #3a2f24}
.wait{text-align:center;font-size:1.2rem;color:#8a7a65}
</style></head><body><div class="board" id="b"><div class="wait">等待老師公布…</div></div>
<script>
const $=s=>document.querySelector(s);
const ws=new WebSocket('ws://'+location.host+'/ws');
ws.onopen=()=>ws.send(JSON.stringify({type:'identify',payload:{role:'projector',code:new URLSearchParams(location.search).get('code')}}));
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type!=='state')return;const s=m.payload;
  if(!s.revealed){$('#b').innerHTML='<div class="wait">第 '+s.year+' 年年結算中…</div>';return}
  $('#b').innerHTML='<h1>第 '+s.year+' 年排行榜</h1><table><tr><th>名次</th><th>店舖</th><th>淨值變化</th></tr>'+
    s.rows.map(r=>'<tr><td class="mono">'+r.rank+'</td><td>'+r.name+'</td><td class="mono">'+
      (r.delta>=0?'+':'')+Math.round(r.delta).toLocaleString()+'</td></tr>').join('')+'</table>'};
</script></body></html>`

console.log(`飲料店模擬已啟動  http://localhost:${server.port}`)
console.log(`  開機頁    /`)
console.log(`  教師端    /t?code=房號　（/t?code=new 開新的一屆）`)
console.log(`  學生端    /?code=房號　（學生自己輸入房號和店名）`)
console.log(`  投影      /p?code=房號`)
console.log(`  進度存檔  ${databasePath()}`)

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
