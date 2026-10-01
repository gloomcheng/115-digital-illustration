/**
 * 飲料店經營模擬：瀏覽器端的場景繪製。
 *
 * 這支是「規則」的反面：rules.ts 決定數字，這裡決定那些數字
 * 長什麼樣。兩邊唯一的契約是回傳的 Visible 與店舖狀態——
 * 任何「這件事看起來應該怎樣」的判斷都在這裡。
 *
 * 為什麼是 canvas 而不是 DOM 或 CSS：
 *   - 深度排序要靠繪製順序，DOM 做不到（z-index 在大數量元素下會打架）
 *   - 像素圖要 nearest-neighbor 縮放，CSS 的 image-rendering 對
 *     旋轉/遮罩支援不完整
 *   - 同一張精靈圖切不同影格，用 drawImage 一次到位
 *
 * 精靈圖由 scripts/shop-sim/make-sprites.py 產生，
 * 是真的 PNG，不是字元點陣。座標與那支產生器必須一致。
 */

/** 客戶端程式碼字串。server.ts 直接塞進 <script>。 */
export const SCENE_CODE = String.raw`
const META_URL = '/shop-sprites.json';
const SCALE = 3;
const TILE = 16;

/* ── 場景地圖（遊戲單位 = 格）────────────────────────────
   和 scripts/shop-sim/preview-scene.py 的常數一致。
   兩邊不一致的話預覽會騙人，所以預覽那支是唯一的事實來源。 */
const MAP = {
  COLS: 14, ROWS: 9,
  /* ── 佈局照真實手搖飲店，不是憑感覺排的 ────────────────────
     真實的飲料店是**一條窄吧檯 + 落地店面**，不是一個有座位的房間。
     這兩點踩過兩次：
       1. 畫面下方留一整塊地板 → 人眼讀成「可以坐」
       2. 畫布比吧檯寬很多 → 兩側一大片空地，更像餐廳

     所以畫布尺寸是**由吧檯反推**的：吧檯 200px，兩側各留 12px，
     整個面寬 224px（≈3 公尺的店面，落在手搖飲常見的 3–5 公尺區間）。

     由上而下：後牆 → 員工通道 → 吧檯 → 客人在檯前等 → 落地玻璃與人行道。

     尺寸換算（人物 20px ≈ 165cm，1px ≈ 8.25cm）：
       前吧檯面客側 100–110cm → 13px（作用是遮擋後場雜亂）
       檯面深度 65–75cm       →  8px
       員工通道 ≥120cm        → 15px */
  WALL_H: 44,
  CAB_X: 2 * 16, CAB_Y: 8,            // 吊櫃與層架：後牆上
  MENU_X: 7 * 16, MENU_Y: 18,         // 菜單燈箱
  CLOCK_X: 13 * 16, CLOCK_Y: 10,      // 時鐘：後牆右側原本是空的
  /* 吊燈：吊在吧檯上方，y 從天花板下緣（26）到燈罩底（36）。
     位置對齊工位（茶桶），讓視線落在玩家真正操作的那一排。 */
  LAMP_X0: 12 + 52,
  LAMP_STEP: 32,
  LAMP_N: 4,
  ICE_X: 12, ICE_Y: 46,               // 製冰機：通道左角
  COUNTER_X: 12,
  COUNTER_Y: 62,
  BAY0: 12 + 55,                      // 第 1 個工位（茶桶）
  BOX_Y: 62 + 5 - 14,                 // 配料盒下緣落在檯頂面「裡面」(62..70)，不是浮在後緣之上
  BOX_X0: 12 + 55 + 4 * 16,           // 緊接在第 4 個工位右邊（加料的動線位置）
  BINS: 4,
  BOX_STEP: 17,
  STAFF_FEET: 62 + 6,
  STAFF_Y: 62 + 6 - 20,
  /* 閒置的人站在通道裡「沒有茶桶的那一段」——吧檯右側是封膜與出杯台，
     本來就不配茶桶，所以那裡是唯一還能站人的位置。這和規則一致：
     他不是沒有工位，是沒有屬於他的那一格。 */
  IDLE_X0: 12 + 135,
  IDLE_N: 3,
  QUEUE_Y: 62 + 21 + 4,
  QUEUE_X0: 12 + 55,                  // 隊伍排在工位正前方
  QUEUE_N: 4,
  /* 盆栽：門口左邊的地面。14×18 sprite，右緣剛好不超過畫布。 */
  PLANT_X: 14 * 16 - 14 - 8,
  PLANT_Y: 9 * 16 - 26 - 18 - 6,
  STORE_Y: 9 * 16 - 26,
  DOOR_X: 14 * 16 - 34,
  DOOR_Y: 9 * 16 - 26,
  BAYS: 4,
};


/* ── 載入精靈圖 ─────────────────────────────────────── */
let SPR = null, META = null;

function loadSprites(cb){
  if (SPR) return cb();
  fetch(META_URL).then(r => r.json()).then(m => {
    META = m;
    const img = new Image();
    img.onload = () => { SPR = img; cb(); };
    img.src = m.sheet;
  });
}

/** 從精靈圖切一個影格。座標在 shop-sprites.json 裡。 */
function spr(ctx, name, dx, dy, dw, dh){
  const s = META.sprites[name];
  if (!s) return;
  ctx.drawImage(SPR, s.x, s.y, s.w, s.h, dx, dy, dw || s.w, dh || s.h);
}
function sprW(name){ return META.sprites[name] ? META.sprites[name].w : 0; }
function sprH(name){ return META.sprites[name] ? META.sprites[name].h : 0; }

/* ── 繪製 ───────────────────────────────────────────── */

/**
 * 這支函式是整個遊戲的視覺核心。每一段都對應一個教學重點：
 *
 *   1. 櫃檯上的 4 格工位  ← 供給上限 = min(人, 工位) + 0.4 × 超額
 *      有工位 → 亮色茶槽 + 綠燈；沒有 → 檯面打叉、沒有燈
 *   2. 站在吧檯後面但沒有工位的人（灰衣、叉腰、低頭）
 *      ← 這就是帳本上那個 0.4 變成看得見的樣子
 *   3. 貨架上的杯子數量    ← 存貨 / 周轉天數
 *   4. 門口的排隊與走掉的人 ← 需求 vs 產能，兩種不同的缺法
 */
function drawShop(ctx, st, t){
  const M = MAP;
  const W = M.COLS * TILE, H = M.ROWS * TILE;
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  /* 1. 地板：單一純色（格線會被讀成條紋） */
  ctx.fillStyle = '#e2d6c0';
  ctx.fillRect(0, 0, W, H);

  /* 2. 後牆 */
  for (let c = 0; c < M.COLS; c++) spr(ctx, 'wall', c * TILE, 0);
  /* 左右側牆 */
  ctx.fillStyle = '#d6c6ac';
  for (let y = 0; y < H; y += TILE) {
    ctx.fillRect(0, y, 4, TILE);
    ctx.fillStyle = '#baa88c';
    ctx.fillRect(4, y, 1, TILE);
    ctx.fillStyle = '#c8b79c';
    ctx.fillRect(W - 5, y, 5, TILE);
  }
  /* 房間外的暗色 */
  ctx.fillStyle = '#141210';
  ctx.fillRect(0, H - 2, W, 2);

  /* 3. 後牆：吊櫃層架 + 菜單燈箱
     吊櫃放不常用的杯款與備用封膜——真實飲料店後場的牆上都有，
     作用是把檯面清空。沒有它的話後牆是一片空白，店就沒有深度。
     菜單燈箱是背光發光的，是店裡最亮的東西（也是最該被看到的）。 */
  spr(ctx, 'cabinets', M.CAB_X, M.CAB_Y);
  ctx.save();
  ctx.globalAlpha = 0.45;
  spr(ctx, 'menu', M.MENU_X, M.MENU_Y - 3);
  ctx.restore();
  spr(ctx, 'menu', M.MENU_X, M.MENU_Y);
  /* 時鐘：後牆右側（x168–224）本來是空的，視線會在那裡斷掉。
     時鐘是最不囉嗦的填法，而且它是「時間」的符號——
     這個遊戲的核心就是十二年的光陰。 */
  spr(ctx, 'clock', M.CLOCK_X, M.CLOCK_Y);
  /* 盆栽放在門口旁邊的地面上。
     這裡曾經寫成 22 * TILE - 16（=336），但畫布只有 224 寬——
     所以那盆盆栽從來沒有出現在畫面上。為什麼會這樣：寫的時候是照
     一個更寬的店面草稿算的，後來畫布收窄成 14 格寬，這個座標沒跟著改。
     現在 scene-check 會自動掃過所有 spr() 呼叫並驗證有沒有畫出畫布，
     所以這種錯不會再靠人記得。

     注意：這整段字串在 SCENE_CODE 的 String.raw 樣板裡面，
     裡面不能出現反引號。任何一個反引號都會把樣板字串提前結束，
     檔案變成語法錯誤、整個 import 不進去，伺服器就起不來。
     （寫這段說明的時候自己又踩了一次，所以改成純文字。）
     scene-check 會真的 import scene.ts 一次，這種錯才抓得到。 */
  spr(ctx, 'plant', M.PLANT_X, M.PLANT_Y);
  spr(ctx, 'ice', M.ICE_X, M.ICE_Y);

  /* 4. 吊燈
     畫在吧檯**之前**（所以檯面會蓋住燈的下緣）——吊燈在天花板和檯面之間，
     如果壓在檯面之上，看起來會像浮在檯上的裝飾品而不是吊在頭頂的燈。
     位置對齊工位（茶桶），讓視線落在玩家真正操作的那一排。 */
  for (let i = 0; i < M.LAMP_N; i++) {
    spr(ctx, 'lamp', M.LAMP_X0 + i * M.LAMP_STEP, 26);
  }

  /* 5. 吧檯 + 配料盒
     工位就是茶桶。設計文件裡的
     「供給上限 = min(人, 工位) + 0.4 × 超額」在畫面上就是
     「幾個茶桶有人照顧、幾個空著」。

     配料盒（珍珠、粉圓、芋圓、紅豆）站在吧檯上、緊接在茶桶右邊——
     因為出杯流程是「加茶 → 加配料」，那正是它該在的位置。
     盒子的填充高度 = 存量。 */
  spr(ctx, 'counter_' + st.onStation, M.COUNTER_X, M.COUNTER_Y);
  const full = Math.round((M.BINS * st.shelf) / Math.max(1, st.shelfMax));
  for (let i = 0; i < M.BINS; i++){
    const lv = i < full ? 'full' : (i === full ? 'half' : 'empty');
    spr(ctx, 'bin' + i + '_' + lv, M.BOX_X0 + i * M.BOX_STEP, M.BOX_Y);
  }

  /* 6. 閒置員工：先畫，所以會被吧檯蓋住下半身 */
  for (let i = 0; i < st.idle; i++){
    const x = M.IDLE_X0 + i * TILE;
    spr(ctx, 'shadow', x, M.STAFF_FEET - 4);
    spr(ctx, 'idle_' + (i % 4) + '_down', x, M.STAFF_Y);
  }

  /* 7. 有工位的員工：站在吧檯後面，腳被檯面蓋住 */
  for (let i = 0; i < st.onStation; i++){
    const x = M.BAY0 + i * TILE;
    const f = (t * 0.5 + i) % 3;
    spr(ctx, 'shadow', x, M.STAFF_FEET - 4);
    spr(ctx, 'staff_' + (i % 4) + '_' + f + '_down', x, M.STAFF_Y);
  }

  /* 8. 店面：玻璃 + 門 + 人行道
     飲料店是外帶店，客人拿了就走。畫出這條邊界，
     畫面才不會被讀成「有座位的店」——這是踩過一次的錯。 */
  spr(ctx, 'store', 0, M.STORE_Y);

  /* 9. 客人在吧檯前等（外帶動線）
     飲料店沒有座位，所以隊伍是「站在檯前」，不是坐在哪裡。
     走的時候往右、往門出去。 */
  const walking = Math.floor(t * 1.2) % 3;
  const n = Math.min(st.queue, M.QUEUE_N);
  for (let i = 0; i < n; i++){
    const x = M.QUEUE_X0 + i * TILE;
    spr(ctx, 'shadow', x, M.QUEUE_Y);
    spr(ctx, 'cust_' + (i % 6) + '_' + (i === 0 ? walking : 0) + '_left', x, M.QUEUE_Y - 18);
  }

  /* 10. 買不到、轉身走掉的人：往門的方向走，最後消失在人行道 */
  for (let i = 0; i < st.turned; i++){
    const x = M.DOOR_X - 8 - i * 18;
    ctx.globalAlpha = 0.75;
    spr(ctx, 'left_' + (i % 3), x, M.QUEUE_Y - 4);
    ctx.globalAlpha = 1;
  }

  /* 11. 買到、往外走的人：手上拿著杯子 */
  for (let i = 0; i < Math.min(2, st.served ?? 0); i++){
    const x = M.DOOR_X + 4 + i * 16;
    spr(ctx, 'served_' + (i % 6), x, M.STORE_Y - 6);
  }

  /* 12. 老闆（玩家）只能在客區和通道走 */
  if (st.boss){
    const f = st.bossMoving ? st.bossFrame : 0;
    const key = st.bossFacing === 'up' ? 'up' : st.bossFacing === 'down' ? 'down' : 'left';
    spr(ctx, 'shadow', st.boss.x, st.boss.y + 16);
    spr(ctx, 'boss_' + f + '_' + key, st.boss.x, st.boss.y - 2);
  }

  /* 13. 狀態提示：老闆頭上的小氣泡
     刻意做小。上一版讓它撐滿寬度，結果紅色橫幅蓋掉半個店，
     而且玩家根本不會站在螢幕正中央，氣泡會被畫到畫布外面。
     所以寬度上限 150px，超過就換行；位置夾在畫布內。 */
  if (st.note){
    const maxW = 150, pad = 6, lineH = 13, fs = 11;
    ctx.font = fs + 'px "Noto Sans TC", "PingFang TC", sans-serif';
    const lines = [];
    let cur = '';
    for (const ch of st.note){
      if (ctx.measureText(cur + ch).width > maxW - pad * 2){ lines.push(cur); cur = ch }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2);
    const h = lines.length * lineH + 6;
    /* 放在老闆「旁邊」，不是頭上。
       頭上那版會剛好蓋住吧檯——而吧檯上的叉（空工位）
       正是學生最需要看到的東西。不能自己把重點遮掉。 */
    const anchorX = st.boss ? st.boss.x + 22 : W / 2;
    const bx = Math.max(2, Math.min(W - w - 2, anchorX));
    const by = Math.max(2, Math.min(H - h - 2, st.boss ? st.boss.y - h - 2 : 4));

    ctx.fillStyle = st.noteTone === 'bad' ? 'rgba(232,122,96,.96)'
                  : st.noteTone === 'warn' ? 'rgba(255,232,176,.96)' : 'rgba(247,242,228,.96)';
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + .5, by + .5, w - 1, h - 1);
    // 小尾巴指向老闆（在氣泡左側）
    if (st.boss){
      const ty = Math.max(by + 2, Math.min(by + h - 6, st.boss.y + 6));
      ctx.beginPath();
      ctx.moveTo(bx, ty);
      ctx.lineTo(bx - 5, ty + 3);
      ctx.lineTo(bx, ty + 6);
      ctx.fill();
    }
    ctx.fillStyle = '#2b2118';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 3 + i * lineH));
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

/* ── 一個會動的場景元件 ─────────────────────────────── */
function createShopView(canvas){
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;      // pixel-perfect：放大不能插值
  let t = 0, raf = null;
  let live = null;                        // 目前要畫的狀態

  function resize(){
    const W = MAP.COLS * TILE, H = MAP.ROWS * TILE;
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    canvas.style.width = W * SCALE + 'px';
    canvas.style.height = H * SCALE + 'px';
  }

  function frame(){
    t += 1 / 30;
    // 走動是靠 interval 更新 boss 座標，這裡只負責重畫動畫影格
    if (SPR && live) drawShop(ctx, live, t);
    raf = requestAnimationFrame(frame);
  }

  return {
    start(){ if (!raf) frame() },
    stop(){ if (raf) cancelAnimationFrame(raf); raf = null },
    resize,
    draw(st){ live = st },
  };
}
`

export default SCENE_CODE
