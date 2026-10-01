/**
 * 場景驗算：確認瀏覽器端那支真的畫得出東西。
 *
 * 這支不測「好不好看」——那要眼睛。它測的是「會不會整片空白」：
 *   - 精靈圖座標有沒有對上（名字拼錯、座標超界 = 整張圖不畫）
 *   - canvas API 有沒有被正確呼叫
 *   - 老闆走動會不會跑出地圖
 *   - 每個場景元件的座標有沒有落在畫布內
 *
 * 用一個假的 canvas 記錄呼叫，不依賴瀏覽器。
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 算 `scene.ts` 裡那些算式常數（例如 `COUNTER_X: TILE * 2 + 6`）。
 *
 * 這裡原本用 `eval`，靠正則擋掉非算式字元。正則擋得住「明顯不是算式」，
 * 但擋不住 `eval` 本身帶來的問題：每個字元都被當成程式碼解析一次、
 * 出錯時錯誤訊息指向 eval 而不是指出哪一行算式有問題。
 * 改成自己算：token 先切好，再用兩個堆疊做雙遍運算（shunting-yard）。
 * 支援的運算子只有 `+ - * / ( )` 和數字——這正是 `MAP` 裡會出現的。
 *
 * 寫這個函式的理由是「錯誤要能指到人」：算式寫錯時，
 * 丟出來的是 `COUNTER_X: 算式有問題` 而不是 `SyntaxError: Unexpected token`。
 */
function arith(expr: string, name: string): number {
  const fail = (why: string): never => {
    throw new Error(`${name} 的算式有問題（${why}）：${expr}`)
  }
  const matched: string[] = expr.match(/\d+\.?\d*|[()+\-*/]/g) ?? []
  if (matched.length === 0) fail('裡面沒有任何數字或運算子')
  // 去掉空白後重新比對，確認沒有被切掉的可疑字元
  const leftover = expr.replace(/\s/g, '').replace(/\d+\.?\d*|[()+\-*/]/g, '')
  if (leftover) fail(`出現不認得的字元「${leftover[0]}」`)
  const tokens = matched

  // 第一遍：值堆疊。第二遍：運算子堆疊。
  const values: number[] = []
  const ops: string[] = []
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
  const apply = (): void => {
    const op = ops.pop()
    const b = values.pop()
    const a = values.pop()
    if (op === undefined || a === undefined || b === undefined) fail('運算子的運算元不夠')
    // fail() 是 never，但 TS 不會從 if 裡縮窄變數，所以自己收斂一次型別。
    const [x, y] = [a as number, b as number]
    values.push(op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y)
  }

  for (const t of tokens) {
    if (/^\d/.test(t)) {
      values.push(Number(t))
      continue
    }
    if (t === '(') {
      ops.push(t)
      continue
    }
    if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') apply()
      if (ops.pop() !== '(') fail('括號沒有對應的左括號')
      continue
    }
    while (
      ops.length &&
      ops[ops.length - 1] !== '(' &&
      precedence[ops[ops.length - 1]] >= precedence[t]
    ) {
      apply()
    }
    ops.push(t)
  }
  while (ops.length) {
    if (ops[ops.length - 1] === '(') fail('括號沒有對應的右括號')
    apply()
  }
  if (values.length !== 1) fail('算式不只一個結果')
  return values[0] as number
}

/** 精靈圖的實際像素尺寸。寫死會在重新產生後失效——踩過。 */
function sheetSize(): { w: number; h: number } {
  const buf = readFileSync(resolve(import.meta.dir, '..', '..', 'public', 'shop-sprites.png'))
  // PNG：8 bytes 簽名 + IHDR(length 4, type 4, width 4, height 4)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

const META = JSON.parse(
  readFileSync(resolve(import.meta.dir, '..', '..', 'public', 'shop-sprites.json'), 'utf8')
)

let pass = 0
let fail = 0
function check(label: string, ok: boolean, extra = '') {
  if (ok) pass++
  else fail++
  console.log(`  ${ok ? 'OK  ' : '★錯 '} ${label}${extra ? `  ${extra}` : ''}`)
}

console.log('=== 場景驗算 ===\n')

console.log('1. 精靈圖中繼資料')
{
  const sheet = META.sprites
  const names = Object.keys(sheet)
  check('有影格資料', names.length > 0, `${names.length} 個`)
  const { w: sheetW, h: sheetH } = sheetSize()
  const oob = names.filter((n) => {
    const s = sheet[n]
    return s.x < 0 || s.y < 0 || s.x + s.w > sheetW || s.y + s.h > sheetH
  })
  check('沒有影格超出精靈圖範圍', oob.length === 0, oob.join(',') || `範圍 ${sheetW}×${sheetH}`)
  const zero = names.filter((n) => sheet[n].w === 0 || sheet[n].h === 0)
  check('沒有零尺寸影格', zero.length === 0, zero.join(','))
  const dup = names.filter((n, i) => names.indexOf(n) !== i)
  check('影格名稱不重複', dup.length === 0, dup.join(','))
  // 重疊檢查：兩個影格在同一位置會互相蓋掉
  const seen = new Map<string, string>()
  const overlap: string[] = []
  for (const n of names) {
    const s = sheet[n]
    const key = `${s.x},${s.y}`
    if (seen.has(key)) overlap.push(`${seen.get(key)} ↔ ${n}`)
    else seen.set(key, n)
  }
  check('影格位置不重疊', overlap.length === 0, overlap.join('; '))
}

console.log('\n2. 遊戲會用到的影格都存在')
{
  const need = [
    'wall',
    'store',
    'cabinets',
    'ice',
    'menu',
    'plant',
    'shadow',
    'cup0',
    'cup1',
    'cup2',
    'counter_0',
    'counter_1',
    'counter_2',
    'counter_3',
    'counter_4',
    'idle_0_down',
    'idle_1_down',
    'idle_2_down',
    'idle_3_down',
    'staff_0_0_down',
    'staff_0_1_down',
    'staff_0_2_down',
    'staff_1_0_down',
    'staff_2_0_down',
    'staff_3_0_down',
    'cust_0_0_left',
    'cust_1_0_left',
    'cust_2_0_left',
    'cust_3_0_left',
    'cust_4_0_left',
    'cust_5_0_left',
    'left_0',
    'left_1',
    'left_2',
    'boss_0_down',
    'boss_1_down',
    'boss_2_down',
    'boss_0_left',
    'boss_1_left',
    'boss_0_up',
  ]
  const missing = need.filter((n) => !(n in META.sprites))
  check('全部存在', missing.length === 0, missing.join(',') || `${need.length} 個齊全`)
  // 每個 staff 變體的 3 個影格都要有
  const staffMissing: string[] = []
  for (let v = 0; v < 4; v++)
    for (let f = 0; f < 3; f++) {
      if (!(`staff_${v}_${f}_down` in META.sprites)) staffMissing.push(`staff_${v}_${f}`)
    }
  check('員工 4 種外觀 × 3 影格齊全', staffMissing.length === 0, staffMissing.join(','))
  const custMissing: string[] = []
  for (let v = 0; v < 6; v++)
    for (let f = 0; f < 3; f++) {
      if (!(`cust_${v}_${f}_left` in META.sprites)) custMissing.push(`cust_${v}_${f}`)
    }
  check('客人 6 種外觀 × 3 影格齊全', custMissing.length === 0, custMissing.join(','))
}

console.log('\n3. 地圖佈局（所有東西都要畫在畫布內）')
{
  const TILE = 16
  const W = 14 * TILE,
    H = 9 * TILE // 由吧檯反推的窄店面
  const inCanvas = (name: string, x: number, y: number) => {
    const s = META.sprites[name]
    if (!s) return false
    return x >= 0 && y >= 0 && x + s.w <= W && y + s.h <= H
  }
  check('後牆貼滿寬度不超出', 14 * TILE === W)
  check('吧檯在畫布內（200px 窄吧檯）', inCanvas('counter_4', 12, 62), `12..212 / ${W}`)
  check('吊櫃在牆面上', inCanvas('cabinets', 2 * TILE, 8))
  check('燈箱在牆面上', inCanvas('menu', 7 * TILE, 18))
  check('製冰機在畫布內', inCanvas('ice', 12, 46))
  check('店面在畫布內', inCanvas('store', 0, 9 * TILE - 26), `${9 * TILE - 26}..${H}`)
  check('配料盒在畫布內', inCanvas('bin0_full', 131, 53), `131..199 / ${W}`)
  // 畫布是由吧檯反推的：兩側不該留太多空地
  const margin = (W - 200) / 2
  check('吧檯兩側留白 < 20px（不然又變成有座位的房間）', margin < 20, `每側 ${margin}px`)
  check('店面高度夠畫出玻璃和人行道', 9 * TILE - 26 + 26 === H, `${H}`)
  const qy = 62 + 21 + 4
  check(
    '客人在檯前等（腳底貼著檯下緣）',
    qy > 62 + 21 && qy - 18 < 62 + 21 + 8,
    `${qy - 18}..${qy} / 檯 ${62 + 21}`
  )
  check('隊伍沒超出畫布右緣', 67 + 4 * 16 <= W, `${67 + 4 * 16} <= ${W}`)

  // ── 逐一驗證場景程式裡**每一個** spr() 呼叫 ──
  // 上面那幾條是手寫的清單：每加一個場景元素就要記得補一條，忘了就沒有人擋。
  // 這一段改成直接從 scene.ts 原始碼把 spr(ctx, 'name', 運算式, 運算式) 抓出來，
  // 算出實際座標後驗證有沒有畫在畫布內。
  // 踩過：`plant` 畫在 `22 * TILE - 16`（=336），但畫布只有 224 寬，
  // 所以那盆盆栽從來沒有出現在畫面上，而手寫清單裡沒有它，所以測試是綠的。
  const src = readFileSync(resolve(import.meta.dir, 'scene.ts'), 'utf8')
  const sprCalls = [...src.matchAll(/spr\(ctx,\s*'([^']+)'\s*,\s*([^,]+),\s*([^,)]+)/g)]
  check('場景程式有抓得到 spr() 呼叫', sprCalls.length >= 8, `${sprCalls.length} 個`)

  // TILE 是場景程式裡的全域常數（16），不是 MAP 的一項，先放進去。
  const consts = new Map<string, number>([['TILE', TILE]])
  // MAP 的常數之間會互相引用（PLANT_X 用到 14 * 16），所以要多跑幾輪，
  // 到沒有新的算出來為止。跑一輪的話後面引用前面常數的會全部算不出來。
  for (let round = 0; round < 4; round++) {
    let learned = 0
    for (const m of src.matchAll(/\b([A-Z_][A-Z0-9_]*)\s*:\s*([^,\n]+),/g)) {
      const name = m[1]
      if (consts.has(name)) continue
      const expr = m[2].trim()
      if (!/^[\d\s*+\-()A-Z_]+$/.test(expr)) continue
      // 依賴還沒算出來的常數時跳過，留給下一輪。
      const deps = [...expr.matchAll(/\b([A-Z_][A-Z0-9_]*)\b/g)].map((d) => d[1])
      if (deps.some((d) => !consts.has(d))) continue
      try {
        consts.set(
          name,
          arith(
            expr.replace(/\b([A-Z_][A-Z0-9_]*)\b/g, (hit) => `${consts.get(hit)}`),
            name
          )
        )
        learned++
      } catch {
        /* 抓不到就略過，不要因為解析不了常數而讓整段檢查爆掉 */
      }
    }
    if (learned === 0) break
  }
  const resolveExpr = (expr: string): number =>
    arith(
      expr
        .trim()
        .replace(/\bM\.([A-Z_][A-Z0-9_]*)\b/g, (_, k) => {
          if (!consts.has(k)) throw new Error(`${k} 算不出來`)
          return `${consts.get(k)}`
        })
        .replace(/\b([A-Z_][A-Z0-9_]*)\b/g, (hit) => {
          if (!consts.has(hit)) throw new Error(`${hit} 算不出來`)
          return `${consts.get(hit)}`
        }),
      expr.trim()
    )

  const seen = new Set<string>()
  const outside: string[] = []
  for (const m of sprCalls) {
    const [, name, ex, ey] = m
    // 同一個 sprite 在迴圈裡多次呼叫是正常的，只驗一次座標。
    if (seen.has(name)) continue
    seen.add(name)
    // 迴圈裡的座標（`c * TILE`、`x`）是變數，這裡算不出來。
    // 那些位置由上面那幾條手寫檢查負責（後牆、隊伍、老闆走動範圍）。
    // 這裡只負責抓「寫死卻畫出畫布外」的座標——那種錯誤不會被手寫清單蓋到。
    if (/\b[a-z]\b/.test(ex) || /\b[a-z]\b/.test(ey)) continue
    let x: number, y: number
    try {
      x = resolveExpr(ex)
      y = resolveExpr(ey)
    } catch {
      outside.push(`${name}（座標算不出來：${ex}, ${ey}）`)
      continue
    }
    const s = META.sprites[name]
    if (!s) {
      outside.push(`${name}（精靈圖裡沒這個名字）`)
      continue
    }
    if (x < 0 || y < 0 || x + s.w > W || y + s.h > H) {
      outside.push(`${name} 在 ${x},${y}，右緣 ${x + s.w} 下緣 ${y + s.h}（畫布 ${W}×${H}）`)
    }
  }
  check(
    '每個場景元素都畫在畫布內（自動掃過所有 spr() 呼叫）',
    outside.length === 0,
    outside.length ? outside.join('；') : `${seen.size} 個 sprite 全部在範圍內`
  )

  // ── 預覽工具不能和遊戲漂移 ──
  // preview-client.py 是手抄一份 scene.ts 的繪製順序。抄漏的時候沒有人會知道：
  // 盆栽的座標在預覽裡還是舊的（畫到畫布外），scene.ts 早就改好了，
  // 所以「遊戲是對的、預覽是舊的」——這比兩邊都錯更糟，因為預覽是用來
  // 判斷對錯的工具。這裡比對兩邊出現的 sprite 名稱，順序不同就報。
  const py = readFileSync(resolve(import.meta.dir, 'preview-client.py'), 'utf8')
  // 只取「整個 sprite 名稱都是寫死的」那些呼叫。
  // 名稱裡帶 ${...}（f-string）或 '+'（字串拼接）的，名字取決於執行時的
  // 變數——例如 `counter_` + st.onStation、`bin${i}_${lv}`——這種比不了，
  // 而且它們一定在迴圈裡、不影響「有沒有漏抄一個新場景元素」這個判斷。
  // 只排除「用 + 拼接」的那種（`'counter_' + st.onStation`），
  // 因為那種名字執行時才知道。f-string（`bin${i}_${lv}`）要保留，
  // 它會被下面的 literal() 正則濾掉變數部分，留下可比較的字面名稱。
  // scene.ts 用單引號、preview-client.py 用雙引號，所以兩種都要認。
  const fixedNames = (text: string) =>
    [...text.matchAll(/spr\(\s*(?:ctx|img),\s*f?["']([^"']+)["']/g)]
      .map((m) => m[1])
      .filter((n) => !n.includes('+'))
  const sceneNames = fixedNames(src)
  const pyNames = fixedNames(py)
  // 名稱裡帶 ${...} 或 {…} 的地方，執行時才會是完整名稱，比不了完整字串。
  // 但**寫死的那一段前綴**必須一樣（`counter_`、`bin`、`idle_`…），
  // 否則就是兩邊用不同 sprite。所以把變數部分截掉再比。
  //
  // 尾端的序號與朝向（`_0_down`、`_1_left`…）也拿掉：
  // 遊戲端是 `spr(ctx, 'boss_' + f + '_' + key, …)` 動態組出來的，
  // 預覽端只畫一個固定姿勢寫成 `boss_0_down`。這兩種寫法指的是同一個 sprite，
  // 拿掉尾綴才比得出來——這裡要擋的是「用錯 sprite」，不是「寫法不同」。
  const stem = (n: string) =>
    n
      .split(/[${}]/)[0]
      .replace(/f$/, '')
      .replace(/_\d+(_(down|left|right|up))?$/, '')
      .replace(/_(down|left|right|up)$/, '')
      .replace(/_$/, '')
  const literal = (names: string[]) => names.map(stem).filter(Boolean)
  const a = [...new Set(literal(sceneNames))]
  const b = [...new Set(literal(pyNames))]
  const missingInPy = a.filter((n) => !b.includes(n))
  const extraInPy = b.filter((n) => !a.includes(n))
  check(
    '預覽工具和遊戲畫同一批 sprite（寫死的名稱要一致）',
    missingInPy.length === 0 && extraInPy.length === 0,
    [
      missingInPy.length ? `預覽少了：${missingInPy.join(', ')}` : '',
      extraInPy.length ? `預覽多���：${extraInPy.join(', ')}` : '',
      !missingInPy.length && !extraInPy.length ? `各 ${a.length} 個` : '',
    ]
      .filter(Boolean)
      .join('；')
  )
  // 順序也要一致：同樣的東西畫在不同順序，遮擋關係就會不同。
  // 這裡用「首次出現的順序」，因為同一個 sprite 可能在迴圈裡出現多次。
  //
  // menu 是刻意的例外：scene.ts 在燈箱後面先畫一份 globalAlpha 0.45 的
  // 當底光，預覽沒有這一層（預覽只印得出來的第一份）。那是同一個 sprite
  // 畫兩次，不是順序不一致，所以比對前先去掉重複。
  const firstSeen = (names: string[]) => [...new Set(literal(names))]
  const fa = firstSeen(sceneNames)
  const fb = firstSeen(pyNames)
  const sameOrder = fa.length === fb.length && fa.every((n, i) => n === fb[i])
  check(
    '預覽工具的繪製順序和遊戲一致（遮擋關係才會一樣）',
    sameOrder,
    sameOrder ? `各 ${fa.length} 個` : `遊戲：${fa.join(' → ')}　預覽：${fb.join(' → ')}`
  )
}

console.log('\n4. 老闆走動範圍')
{
  const TILE = 16,
    COLS = 14,
    ROWS = 9,
    WALL_H = 44
  const minX = 8
  const maxX = (COLS - 1) * TILE
  const minY = WALL_H + 4
  const maxY = 9 * TILE - 26 - 4
  const bossW = META.sprites.boss_0_down.w
  const bossH = META.sprites.boss_0_down.h
  check('x 範圍留得下人物寬度', maxX + bossW <= COLS * TILE, `${maxX + bossW} <= ${COLS * TILE}`)
  check('y 範圍留得下人物高度', maxY + bossH <= ROWS * TILE, `${maxY + bossH} <= ${ROWS * TILE}`)
  check('出生點在牆腳下方', 7 * TILE > minY, `${7 * TILE} > ${minY}`)
  // 四個決策地點都要走得到（不能被牆或畫布邊界隔開）
  const SPOTS = [
    ['配料盒', 6 * 16 + 8, 62 + 26], // 吧檯上，緊接茶桶
    ['茶桶工位', 8 * 16, 62 + 26],
    ['門口', 13 * 16, 9 * 16 - 34], // 店面內側、門的旁邊（人走得到的那一側）
    ['後場', 11 * 16, 50],
  ] as const
  const unreachable = SPOTS.filter(([, x, y]) => x < minX || x > maxX || y < minY || y > maxY)
  check(
    '四個決策地點都走得到',
    unreachable.length === 0,
    unreachable.map(([n]) => n).join(',') || SPOTS.map(([n]) => n).join(' ')
  )
  // 地點之間的距離：太遠會讓 90ms 一格的移動感覺很煩
  const d = (a: readonly [string, number, number], b: readonly [string, number, number]) =>
    Math.round(Math.hypot(a[1] - b[1], a[2] - b[2]))
  check(
    '工位到配料盒 < 6 格（移動不會太久）',
    d(SPOTS[1], SPOTS[0]) < 6 * 16,
    `${d(SPOTS[1], SPOTS[0])}px`
  )
  check('工位到後場 < 6 格', d(SPOTS[1], SPOTS[3]) < 6 * 16, `${d(SPOTS[1], SPOTS[3])}px`)
  check(
    '地點偵測半徑 30px 合理（不會重疊觸發）',
    d(SPOTS[1], SPOTS[3]) > 30,
    `工位↔後場 ${d(SPOTS[1], SPOTS[3])}px`
  )
}

console.log('\n5. 視覺對應關係（教學訊號要看得見）')
{
  // 有工位 vs 沒工位，吧檯圖必須不同
  const diff = ['counter_4', 'counter_3', 'counter_2', 'counter_1', 'counter_0'].map(
    (n) => META.sprites[n].x
  )
  check('吧檯每種狀態是不同的影格', new Set(diff).size === diff.length)
  // 員工在工位 vs 閒置，造型必須不同
  check(
    '運作中員工與閒置員工是不同影格',
    META.sprites.staff_0_0_down.x !== META.sprites.idle_0_down.x
  )
  // 買到 vs 沒買到
  check('買到與空手離開是不同影格', META.sprites.left_0.x !== META.sprites.cust_0_0_left.x)
  // 影子是所有人物都要疊的
  check('有落地陰影', 'shadow' in META.sprites)
  const sh = META.sprites.shadow
  check(
    '陰影寬度接近人物寬度',
    Math.abs(sh.w - META.sprites.boss_0_down.w) <= 4,
    `${sh.w} vs ${META.sprites.boss_0_down.w}`
  )
}

console.log('\n6. 客戶端程式碼完整性')
{
  const code = readFileSync(resolve(import.meta.dir, 'scene.ts'), 'utf8')
  for (const fn of ['loadSprites', 'drawShop', 'createShopView', 'imageSmoothingEnabled']) {
    check(`包含 ${fn}`, code.includes(fn))
  }
  check('關閉了插值（pixel-perfect）', code.includes('imageSmoothingEnabled = false'))
  check('精靈圖路徑正確', code.includes("'/shop-sprites.json'"))
  check('地圖常數與預覽一致（BINS: 4）', code.includes('BINS: 4'))
  check('沒有殘留的 CSS 色塊場景', !code.includes('class="cust"') && !code.includes('class="cup"'))
}

console.log('\n7. 堆疊幾何（東西不能浮在空中）')
{
  // 這一節擋的是「只靠 y 座標排東西」的錯。踩過兩次：
  // 一次是料桶排在比備料檯還寬的位置（三個桶懸在空中），
  // 一次是配料盒浮在檯頂面後緣之上（看起來像擱在架子上）。
  // 規則：疊在某個表面上的東西，下緣必須落在那個表面**裡面**。
  const sceneSrc = readFileSync(resolve(import.meta.dir, 'scene.ts'), 'utf8')
  const g = (name: string) => {
    const m = sceneSrc.match(new RegExp(`${name}:\\s*([^,\\n]+),`))
    if (!m) throw new Error(`scene.ts 找不到 ${name}`)
    return arith(m[1].trim(), name)
  }

  const COUNTER_TOP = 8,
    COUNTER_FRONT = 13,
    COUNTER_W = 200
  const BOX_H = 14,
    BIN_W = 16
  const counterX = g('COUNTER_X'),
    counterY = g('COUNTER_Y')
  const topBack = counterY,
    topFront = counterY + COUNTER_TOP
  const boxY = g('BOX_Y'),
    boxX0 = g('BOX_X0')
  const bins = g('BINS'),
    step = g('BOX_STEP')

  check(
    '配料盒下緣落在檯頂面「裡面」（不是浮在後緣之上）',
    boxY + BOX_H > topBack && boxY + BOX_H <= topFront,
    `盒底 ${boxY + BOX_H}，檯頂面 ${topBack}..${topFront}`
  )

  const boxesW = (bins - 1) * step + BIN_W
  const bayEnd = g('BAY0') + 4 * 16
  check(
    '配料盒排在吧檯寬度內（不會懸空）',
    boxX0 + boxesW <= counterX + COUNTER_W,
    `盒 ${boxX0}..${boxX0 + boxesW}，檯 ${counterX}..${counterX + COUNTER_W}`
  )
  check(
    '配料盒緊接在最後一個工位右邊（出杯動線：加茶→加料）',
    boxX0 === bayEnd,
    `盒起點 ${boxX0}，工位結束 ${bayEnd}`
  )

  // 員工：腳底落在檯面裡面、頭露在檯面上方
  const feet = g('STAFF_FEET'),
    staffY = g('STAFF_Y'),
    SH = 20
  check(
    '員工腳底落在檯面裡面',
    feet > topBack && feet < topFront,
    `腳底 ${feet}，檯頂面 ${topBack}..${topFront}`
  )
  check('員工頭部露出在檯之上', staffY < topBack, `頭 ${staffY} < 檯 ${topBack}`)
  check(
    '員工不是只露出頭頂（露出 50% 以上）',
    (topBack - staffY) / SH > 0.5,
    `露出 ${(((topBack - staffY) / SH) * 100).toFixed(0)}%`
  )

  // 同一層不得重疊；跨層重疊是刻意的
  type Box = { n: string; x: number; y: number; w: number; h: number }
  const layers: Record<string, Box[]> = {
    '後場（製冰機）': [{ n: '製冰機', x: g('ICE_X'), y: g('ICE_Y'), w: 16, h: 20 }],
    站在通道的人: [
      { n: '工位員工', x: g('BAY0'), y: staffY, w: 4 * 16, h: SH },
      { n: '閒置員工', x: g('IDLE_X0'), y: staffY, w: g('IDLE_N') * 16, h: SH },
    ],
    客區的人: [
      { n: '排隊客人', x: g('QUEUE_X0'), y: g('QUEUE_Y') - SH, w: g('QUEUE_N') * 16, h: SH },
      { n: '走掉的人', x: g('DOOR_X') - 8 - 2 * 18, y: g('QUEUE_Y') - 20, w: 3 * 18, h: 20 },
    ],
  }
  const hits: string[] = []
  for (const [layer, boxes] of Object.entries(layers)) {
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j]
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
          hits.push(`${layer}: ${a.n} ↔ ${b.n}`)
        }
      }
  }
  check(
    '同一層的物件沒有互相重疊',
    hits.length === 0,
    hits.join('; ') || `分層檢查 ${Object.keys(layers).length} 層`
  )

  // 飲料店沒有內用座位：客人只能站著，且店面邊界必須畫出來
  const storeY = g('STORE_Y')
  check(
    '客人站在吧檯前，不是坐在哪裡',
    g('QUEUE_Y') > counterY + COUNTER_FRONT + COUNTER_TOP - 1,
    `腳底 ${g('QUEUE_Y')} > 檯下緣 ${counterY + COUNTER_FRONT + COUNTER_TOP - 1}`
  )
  check(
    '客人沒有落進店面或人行道',
    g('QUEUE_Y') + 2 < storeY,
    `${g('QUEUE_Y') + 2} < 店面 ${storeY}`
  )
  check(
    '店面（玻璃+人行道）佔畫面最下方 26px',
    storeY + 26 === 9 * 16,
    `${storeY + 26} == ${9 * 16}`
  )
  check(
    '吧檯佔畫面寬度 89%（兩側留白 < 20px）',
    COUNTER_W / (14 * 16) > 0.85,
    `${((COUNTER_W / (14 * 16)) * 100).toFixed(0)}%`
  )

  // 存貨的視覺化必須是配料盒，不是貨架
  const py = readFileSync(resolve(import.meta.dir, 'make-sprites.py'), 'utf8')
  check('make-sprites.py 沒有貨架（那是設計錯，已移除）', !/def shelf_unit|"shelf"/.test(py))
  check('配料盒在吧檯上而不是獨立備料檯', /topping_box/.test(py) && !/def prep_counter/.test(py))
  check('配料盒有滿／半／空三種狀態', /for lvl, fill in/.test(py))
  check(
    '吧檯設備照出杯流程排（杯架→製冰→茶桶→封膜→出杯）',
    /① 收銀/.test(py) &&
      /② 杯架/.test(py) &&
      /③ 製冰機/.test(py) &&
      /④ 茶桶/.test(py) &&
      /⑤ 封膜機/.test(py) &&
      /⑥ 出杯平台/.test(py)
  )
}

console.log('\n8. 學生頁能不能真的跑起來（語法與 sprite 名稱）')
{
  // 這一項是為了擋「伺服器跑得好好的、遊戲頁一片空白」。
  // 場景程式是塞進 <script> 的字串，TypeScript 抓不到它的語法錯，
  // 而且它只有在瀏覽器裡才會執行。所以這裡把字串取出來真的編譯一次，
  // 再把裡面用到的 sprite 名稱全部對回精靈圖。
  const sceneSrc = readFileSync(resolve(import.meta.dir, 'scene.ts'), 'utf8')
  const serverSrc = readFileSync(resolve(import.meta.dir, 'server.ts'), 'utf8')

  // 取出 scene.ts 裡 String.raw`...` 的內容
  const m = sceneSrc.match(/String\.raw`([\s\S]*?)`\s*\n\nexport default/)
  check('可以抽出 SCENE_CODE', m !== null)
  const sceneCode = m![1]

  // SCENE_CODE 必須是**完整的程式**，而且 scene.ts 本身必須讀得進來。
  //
  // 踩過：在 SCENE_CODE 裡面寫了一段註解，註解裡用反引號引用舊程式碼
  // （寫成 `22 * TILE - 16`）。反引號會把 String.raw 的樣板字串**提前結束**，
  // 檔案從此語法錯誤、整個 import 不進去。
  // 症狀很難懂：型別檢查用的是 .d.ts 所以照過、單看檢查結果是「語法正確」
  // （因為那條驗的是拼出來的頁面，不是 scene.ts），但伺服器起不來，
  // shop:persist 會在第一段就安靜地卡住，沒有錯誤訊息。
  //
  // 抓法有兩個，缺一不可：
  //   1. 直接 import scene.ts —— 這是唯一能抓到「檔案本身壞掉」的方法。
  //   2. 確認 SCENE_CODE 裡有 start()/stop()/resize()——
  //      這三個是 createLoop() 回傳物件的介面，少了就是被截斷了。
  let importErr = ''
  let realCode = ''
  try {
    const mod = await import(resolve(import.meta.dir, 'scene.ts'))
    realCode = mod.SCENE_CODE as string
  } catch (e) {
    importErr = String(e).slice(0, 200)
  }
  check('scene.ts 讀得進來（SCENE_CODE 裡不能有未跳脫的反引號）', importErr === '', importErr)
  check(
    'SCENE_CODE 是完整的（createLoop 回傳 start/stop/resize/draw）',
    ['start(', 'stop(', 'resize', 'draw('].every((k) => realCode.includes(k)),
    realCode ? `SCENE_CODE 只有 ${realCode.length} 字元` : 'scene.ts 沒讀進來'
  )

  // 抽出 studentPage 裡 ${SCENE_CODE} 之後的學生端邏輯。
  //
  // 這裡必須自己還原 template literal 的跳脫：原始碼裡寫的是 `\$`
  // （為了不讓 shell/編輯器吃掉），真正送進瀏覽器的是 `$`。
  // 忘了還原會得到 `const \$ = ...`，編譯報「Invalid escape in identifier」，
  // 那是我們的檢查壞掉，不是頁面壞掉——但兩者都必須修。
  function pageScript(from: string, to: string) {
    const a = serverSrc.indexOf(from)
    const b = to ? serverSrc.indexOf(to, a) : serverSrc.length
    if (a < 0 || b < a) return null
    const seg = serverSrc.slice(a, b)
    const s1 = seg.indexOf('<script>')
    const s2 = seg.lastIndexOf('</script>')
    if (s1 < 0 || s2 < s1) return null
    return seg
      .slice(s1 + '<script>'.length, s2)
      .replace(/\\\$/g, '$') // 還原 \$ → $
      .replace(/\\`/g, '`') // 還原 \` → `
      .replace(/\$\{SCENE_CODE\}/g, sceneCode)
      .replace(/\$\{sharedStyles\}/g, '')
  }

  const studentJs = pageScript('const studentPage =', 'const teacherPage =')
  check('找得到 studentPage 區段', studentJs !== null)
  check('學生端 JS 抽出來有實質內容', (studentJs ?? '').length > 3000, `${studentJs?.length} 字元`)

  // 真的編譯一次。語法錯在這裡會被抓到。
  let compiled = true
  let errMsg = ''
  try {
    new Function(studentJs!)
  } catch (e) {
    compiled = false
    errMsg = String(e).slice(0, 160)
  }
  check('學生端 JS 語法正確（new Function 編譯通過）', compiled, errMsg)

  // 場景程式引用的 sprite 名稱全部要存在。
  // 只抓完整字串名稱；動態組出來的（'cup' + i）另外推導。
  const used = new Set<string>()
  for (const mm of sceneCode.matchAll(
    /'\s*(wall|wall_side|door|shelf|menu|plant|lamp|register|shadow|mat_wide|mat_narrow|register)\s'/g
  )) {
    used.add(mm[1])
  }
  for (let v = 0; v < 4; v++) {
    for (let f = 0; f < 3; f++) {
      used.add(`staff_${v}_${f}_down`)
      used.add(`boss_${f}_down`)
      used.add(`boss_${f}_left`)
    }
    used.add(`idle_${v}_down`)
  }
  for (let v = 0; v < 6; v++) for (let f = 0; f < 3; f++) used.add(`cust_${v}_${f}_left`)
  for (let a = 0; a <= 4; a++) used.add(`counter_${a}`)
  for (let i = 0; i < 4; i++) for (const lv of ['full', 'half', 'empty']) used.add(`bin${i}_${lv}`)
  for (let i = 0; i < 3; i++) used.add(`cup${i}`)
  for (let i = 0; i < 4; i++) for (const lv of ['full', 'half', 'empty']) used.add(`bin${i}_${lv}`)
  for (let i = 0; i < 3; i++) used.add(`left_${i}`)

  const missing = [...used].filter((n) => !(n in META.sprites))
  check(
    '場景用到的 sprite 全部存在',
    missing.length === 0,
    missing.length ? `缺 ${missing.join(', ')}` : `${used.size} 個名稱`
  )

  // 教師端與投影端也要能編譯（它們比學生端簡單，但一樣會靜默壞掉）。
  // 邊界必須用「相鄰」兩個常數：server.ts 裡 landingPage 夾在
  // teacherPage 和 projectorPage 之間，用錯邊界會把別頁的 HTML
  // 一起抽出來，報出「Unexpected token '<'」這種假錯誤。
  for (const [name, from, to] of [
    ['教師端', 'const teacherPage =', 'const landingPage ='],
    ['開機頁', 'const landingPage =', 'const projectorPage ='],
    ['投影端', 'const projectorPage =', ''],
  ] as const) {
    const js = pageScript(from, to)
    let ok = false
    let msg = js === null ? '找不到區段' : ''
    try {
      if (js !== null) {
        new Function(js)
        ok = true
      }
    } catch (e) {
      msg = String(e).slice(0, 120)
    }
    check(`${name} JS 語法正確`, ok, msg)
  }
}

console.log(`\n=== ${pass} 項通過，${fail} 項失敗 ===`)
if (fail > 0) process.exit(1)

// 這個檔案沒有匯出任何值，但**必須是一個 module**：TypeScript 看到沒有
// import/export 的檔案會把它當成全域腳本，於是頂層 await 不合法，
// 而且不同檔案的宣告會互相撞名（ts1375 / ts2451）。
// export {} 正是「宣告這是 module、但沒有匯出」的標準寫法；
// biome 會報 noUselessEmptyExport，那是它不知道 tsconfig 的情況。
export {}
