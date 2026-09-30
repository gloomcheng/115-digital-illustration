/**
 * 飲料店經營模擬：持久化層。
 *
 * 這支程式要從 W04 連續跑 12 週，所以狀態不能只存在記憶體。
 * 老師會關掉筆電、隔週再開，學生要能回到自己上週離開的位置。
 *
 * 資料只落在本機一個 SQLite 檔（預設 shop-sim.sqlite），
 * 沒有雲端、沒有第三方服務、沒有學生資料離開教室。
 *
 * 資料分成兩種用途，不要混：
 *   - `players.state` 是唯一的事實來源，程式重啟就從這裡還原。
 *   - `decisions` 與 `monthly_results` 是「已經發生過的事」，
 *     12 週共 144 個月，是給學生看自己一路走過來的紀錄，也是老師批改的依據。
 *     這些列只寫入一次，不會因為重算而改變。
 */

import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { Decision, MonthResult, Store, StoreType } from './rules'

const DB_PATH = resolve(process.env.SHOP_DB ?? 'shop-sim.sqlite')

export interface Campaign {
  code: string
  name: string
  year: number
  month: number
  locked: boolean
  revealed: boolean
  usedCards: string[]
  pandemicUsed: boolean
  createdAt: string
}

export interface Player {
  id: number
  campaignCode: string
  name: string
  type: StoreType['key']
  submitted: boolean
  store: Store
}

export interface DecisionRecord {
  year: number
  month: number
  actions: string[]
  predicted: string
  nextVariable: string
  actual: string
  createdAt: string
}

let db: Database

function init(path: string) {
  mkdirSync(dirname(path), { recursive: true })
  const conn = new Database(path, { create: true })
  conn.exec('PRAGMA journal_mode = WAL')
  conn.exec('PRAGMA foreign_keys = ON')

  conn.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      code         TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      year         INTEGER NOT NULL,
      month        INTEGER NOT NULL,
      locked       INTEGER NOT NULL,
      revealed     INTEGER NOT NULL,
      used_cards   TEXT NOT NULL DEFAULT '[]',
      pandemic_used INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_code TEXT NOT NULL REFERENCES campaigns(code),
      name          TEXT NOT NULL,
      type          TEXT NOT NULL,
      submitted     INTEGER NOT NULL DEFAULT 0,
      state         TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      UNIQUE (campaign_code, name)
    );

    -- 一生一次的紀錄。每月寫入一列，重算不會改寫。
    CREATE TABLE IF NOT EXISTS decisions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id     INTEGER NOT NULL REFERENCES players(id),
      year          INTEGER NOT NULL,
      month         INTEGER NOT NULL,
      actions       TEXT NOT NULL,
      predicted     TEXT NOT NULL DEFAULT '',
      next_variable TEXT NOT NULL DEFAULT '',
      actual        TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL,
      UNIQUE (player_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS monthly_results (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id        INTEGER NOT NULL REFERENCES players(id),
      year             INTEGER NOT NULL,
      month            INTEGER NOT NULL,
      demand_drawn     INTEGER NOT NULL,
      effective_demand INTEGER NOT NULL,
      capacity         INTEGER NOT NULL,
      sold             INTEGER NOT NULL,
      revenue          INTEGER NOT NULL,
      material_cost    INTEGER NOT NULL,
      gross_margin     REAL NOT NULL,
      fixed_cost       INTEGER NOT NULL,
      operating_profit INTEGER NOT NULL,
      shortage_rate    REAL NOT NULL,
      turnover_days    REAL NOT NULL,
      cash             INTEGER NOT NULL,
      equity           INTEGER NOT NULL,
      note             TEXT NOT NULL,
      UNIQUE (player_id, year, month)
    );

    -- 每年一次的公開成績，之後就當成歷史檔不再變動。
    CREATE TABLE IF NOT EXISTS leaderboard (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_code TEXT NOT NULL REFERENCES campaigns(code),
      year          INTEGER NOT NULL,
      rank          INTEGER NOT NULL,
      player_id     INTEGER NOT NULL REFERENCES players(id),
      name          TEXT NOT NULL,
      delta         INTEGER NOT NULL,
      created_at    TEXT NOT NULL,
      UNIQUE (campaign_code, year, rank)
    );

    CREATE INDEX IF NOT EXISTS idx_decisions_player ON decisions(player_id, year, month);
    CREATE INDEX IF NOT EXISTS idx_results_player ON monthly_results(player_id, year, month);
    CREATE INDEX IF NOT EXISTS idx_players_campaign ON players(campaign_code);
  `)
  return conn
}

export function openDatabase(path = DB_PATH) {
  if (!db) db = init(path)
  return db
}

export function databasePath() {
  return DB_PATH
}

const now = () => new Date().toISOString()

/* ── campaign ──────────────────────────────────────────── */

type CampaignRow = {
  code: string
  name: string
  year: number
  month: number
  locked: number
  revealed: number
  used_cards: string
  pandemic_used: number
  created_at: string
}

function toCampaign(row: CampaignRow): Campaign {
  return {
    code: row.code,
    name: row.name,
    year: row.year,
    month: row.month,
    locked: row.locked === 1,
    revealed: row.revealed === 1,
    usedCards: JSON.parse(row.used_cards) as string[],
    pandemicUsed: row.pandemic_used === 1,
    createdAt: row.created_at,
  }
}

export function findCampaign(code: string): Campaign | null {
  const row = openDatabase()
    .query<CampaignRow, [string]>(`SELECT * FROM campaigns WHERE code = ?`)
    .get(code)
  return row ? toCampaign(row) : null
}

export function listCampaigns(): Campaign[] {
  return openDatabase()
    .query<CampaignRow, []>(`SELECT * FROM campaigns ORDER BY created_at DESC`)
    .all()
    .map(toCampaign)
}

/** 房號是 4 位數字，讓學生自己打得出來。取不到就隨機試。 */
export function createCampaign(name: string): Campaign {
  const conn = openDatabase()
  for (let i = 0; i < 500; i++) {
    const code = String(Math.floor(Math.random() * 9000) + 1000)
    if (findCampaign(code)) continue
    conn
      .query(
        `INSERT INTO campaigns (code, name, year, month, locked, revealed, created_at)
         VALUES (?, ?, 1, 1, 1, 0, ?)`
      )
      .run(code, name, now())
    return findCampaign(code)!
  }
  throw new Error('房號取號失敗：已經開太多堂課了')
}

export function saveCampaign(c: Campaign) {
  openDatabase()
    .query(
      `UPDATE campaigns SET year = ?, month = ?, locked = ?, revealed = ?,
       used_cards = ?, pandemic_used = ? WHERE code = ?`
    )
    .run(
      c.year,
      c.month,
      c.locked ? 1 : 0,
      c.revealed ? 1 : 0,
      JSON.stringify(c.usedCards),
      c.pandemicUsed ? 1 : 0,
      c.code
    )
}

/* ── player ────────────────────────────────────────────── */

type PlayerRow = {
  id: number
  campaign_code: string
  name: string
  type: string
  submitted: number
  state: string
  created_at: string
}

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    campaignCode: row.campaign_code,
    name: row.name,
    type: row.type as StoreType['key'],
    submitted: row.submitted === 1,
    store: JSON.parse(row.state) as Store,
  }
}

export function listPlayers(campaignCode: string): Player[] {
  return openDatabase()
    .query<PlayerRow, [string]>(`SELECT * FROM players WHERE campaign_code = ? ORDER BY id`)
    .all(campaignCode)
    .map(toPlayer)
}

export function findPlayer(campaignCode: string, name: string): Player | null {
  const row = openDatabase()
    .query<PlayerRow, [string, string]>(
      `SELECT * FROM players WHERE campaign_code = ? AND name = ?`
    )
    .get(campaignCode, name)
  return row ? toPlayer(row) : null
}

export function insertPlayer(
  campaignCode: string,
  name: string,
  type: StoreType['key'],
  store: Store
) {
  openDatabase()
    .query(
      `INSERT INTO players (campaign_code, name, type, submitted, state, created_at)
       VALUES (?, ?, ?, 0, ?, ?)`
    )
    .run(campaignCode, name, type, JSON.stringify(store), now())
}

/**
 * 存檔。`state` 是整份店舖狀態的 JSON，因為裡面有存貨批次、借款、
 * 事件、紀錄等巢狀結構；拆成資料表會讓規則與存檔走兩套邏輯而漂移。
 * 需要查詢的欄位（現金、淨值、士氣…）另外落在 monthly_results，
 * 那才是要拿來做報表與批改的來源。
 */
export function savePlayer(p: Player) {
  openDatabase()
    .query(`UPDATE players SET name = ?, type = ?, submitted = ?, state = ? WHERE id = ?`)
    .run(p.name, p.type, p.submitted ? 1 : 0, JSON.stringify(p.store), p.id)
}

export function deletePlayer(playerId: number) {
  const conn = openDatabase()
  conn.query(`DELETE FROM leaderboard WHERE player_id = ?`).run(playerId)
  conn.query(`DELETE FROM monthly_results WHERE player_id = ?`).run(playerId)
  conn.query(`DELETE FROM decisions WHERE player_id = ?`).run(playerId)
  conn.query(`DELETE FROM players WHERE id = ?`).run(playerId)
}

/* ── decisions（永久紀錄）───────────────────────────────── */

export function recordDecision(
  playerId: number,
  year: number,
  month: number,
  decisions: Decision[],
  predicted: string,
  nextVariable: string
) {
  openDatabase()
    .query(
      `INSERT INTO decisions (player_id, year, month, actions, predicted, next_variable, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (player_id, year, month)
       DO UPDATE SET actions = excluded.actions,
                     predicted = excluded.predicted,
                     next_variable = excluded.next_variable`
    )
    .run(
      playerId,
      year,
      month,
      JSON.stringify(decisions.map((d) => d.kind)),
      predicted,
      nextVariable,
      now()
    )
}

export function listDecisions(playerId: number): DecisionRecord[] {
  return openDatabase()
    .query<
      {
        year: number
        month: number
        actions: string
        predicted: string
        next_variable: string
        actual: string
        created_at: string
      },
      [number]
    >(
      `SELECT year, month, actions, predicted, next_variable, actual, created_at
       FROM decisions WHERE player_id = ? ORDER BY year, month`
    )
    .all(playerId)
    .map((r) => ({
      year: r.year,
      month: r.month,
      actions: JSON.parse(r.actions) as string[],
      predicted: r.predicted,
      nextVariable: r.next_variable,
      actual: r.actual,
      createdAt: r.created_at,
    }))
}

/** 結算時把「實際結果」補寫進當月的決策列，讓預測與結果永遠並排。 */
export function attachActual(playerId: number, year: number, month: number, actual: string) {
  openDatabase()
    .query(`UPDATE decisions SET actual = ? WHERE player_id = ? AND year = ? AND month = ?`)
    .run(actual, playerId, year, month)
}

/* ── monthly results（永久紀錄）─────────────────────────── */

export function recordResult(playerId: number, r: MonthResult) {
  openDatabase()
    .query(
      `INSERT INTO monthly_results
         (player_id, year, month, demand_drawn, effective_demand, capacity, sold,
          revenue, material_cost, gross_margin, fixed_cost, operating_profit,
          shortage_rate, turnover_days, cash, equity, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (player_id, year, month) DO UPDATE SET
         sold = excluded.sold, revenue = excluded.revenue,
         material_cost = excluded.material_cost, gross_margin = excluded.gross_margin,
         fixed_cost = excluded.fixed_cost, operating_profit = excluded.operating_profit,
         shortage_rate = excluded.shortage_rate, turnover_days = excluded.turnover_days,
         cash = excluded.cash, equity = excluded.equity, note = excluded.note`
    )
    .run(
      playerId,
      r.year,
      r.month,
      r.demandDrawn,
      r.effectiveDemand,
      r.capacity,
      r.sold,
      Math.round(r.revenue),
      Math.round(r.materialCost),
      r.grossMargin,
      Math.round(r.fixedCost),
      Math.round(r.operatingProfit),
      r.shortageRate,
      r.turnoverDays,
      Math.round(r.cash),
      Math.round(r.equity),
      r.visible.note
    )
}

export interface YearlyRow {
  year: number
  month: number
  demand: number
  sold: number
  revenue: number
  materialCost: number
  grossMargin: number
  fixedCost: number
  operatingProfit: number
  turnoverDays: number
  shortageRate: number
  cash: number
  equity: number
  note: string
}

/** 老師要看的「這一整年」：12 列，直接對應學生手上的月報。 */
export function yearOf(playerId: number, year: number): YearlyRow[] {
  return openDatabase()
    .query<
      {
        year: number
        month: number
        effective_demand: number
        sold: number
        revenue: number
        material_cost: number
        gross_margin: number
        fixed_cost: number
        operating_profit: number
        turnover_days: number
        shortage_rate: number
        cash: number
        equity: number
        note: string
      },
      [number, number]
    >(
      `SELECT year, month, effective_demand, sold, revenue, material_cost, gross_margin,
              fixed_cost, operating_profit, turnover_days, shortage_rate, cash, equity, note
       FROM monthly_results WHERE player_id = ? AND year = ? ORDER BY month`
    )
    .all(playerId, year)
    .map((r) => ({
      year: r.year,
      month: r.month,
      demand: r.effective_demand,
      sold: r.sold,
      revenue: r.revenue,
      materialCost: r.material_cost,
      grossMargin: r.gross_margin,
      fixedCost: r.fixed_cost,
      operatingProfit: r.operating_profit,
      turnoverDays: r.turnover_days,
      shortageRate: r.shortage_rate,
      cash: r.cash,
      equity: r.equity,
      note: r.note,
    }))
}

/** 學生自己回頭看 12 週的全部紀錄。 */
export function fullHistory(playerId: number) {
  const conn = openDatabase()
  const results = yearOf(playerId, 9999)
  void results
  return conn
    .query<{ year: number }, [number]>(
      `SELECT DISTINCT year FROM monthly_results WHERE player_id = ? ORDER BY year`
    )
    .all(playerId)
    .map((r) => r.year)
}

/* ── leaderboard（永久紀錄）─────────────────────────────── */

export function archiveLeaderboard(
  campaignCode: string,
  year: number,
  rows: { name: string; delta: number; playerId: number }[]
) {
  const conn = openDatabase()
  conn.transaction(() => {
    conn
      .query(`DELETE FROM leaderboard WHERE campaign_code = ? AND year = ?`)
      .run(campaignCode, year)
    rows.forEach((r, i) => {
      conn
        .query(
          `INSERT INTO leaderboard (campaign_code, year, rank, player_id, name, delta, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(campaignCode, year, i + 1, r.playerId, r.name, Math.round(r.delta), now())
    })
  })()
}

export interface ArchivedBoard {
  year: number
  rows: { rank: number; name: string; delta: number }[]
}

export function leaderboardHistory(campaignCode: string): ArchivedBoard[] {
  const conn = openDatabase()
  const years = conn
    .query<{ year: number }, [string]>(
      `SELECT DISTINCT year FROM leaderboard WHERE campaign_code = ? ORDER BY year`
    )
    .all(campaignCode)
  return years.map((y) => ({
    year: y.year,
    rows: conn
      .query<{ rank: number; name: string; delta: number }, [string, number]>(
        `SELECT rank, name, delta FROM leaderboard WHERE campaign_code = ? AND year = ? ORDER BY rank`
      )
      .all(campaignCode, y.year),
  }))
}

/* ── 匯出（老師期末要交作業）─────────────────────────────── */

export function exportCampaign(campaignCode: string) {
  const players = listPlayers(campaignCode)
  return {
    campaign: findCampaign(campaignCode),
    exportedAt: now(),
    students: players.map((p) => ({
      name: p.name,
      type: p.type,
      currentEquity: p.store.cash,
      decisions: listDecisions(p.id),
      years: fullHistory(p.id).map((y) => ({ year: y, months: yearOf(p.id, y) })),
    })),
    leaderboard: leaderboardHistory(campaignCode),
  }
}
