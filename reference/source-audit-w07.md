# 第 07 週與第 09–16 週改版後工具教材：來源考證與教學判斷

查核日期：2026-11-24
查核標的：W07、W09–W16 各週頁面中的工具教學段落，資料在 `src/data/tool-track.ts`，由 `src/pages/weeks/[number].astro` 渲染。工具不另設單元：每一週只教那一週任務真的需要的一個操作。

---

## 1. 官方文件與條款（可引用）

### 1.1 Google Flow 官方服務

- 來源：`https://flow.google.com/`，核對日 2026-11-24。
- 支持：
  1. 影像生成模型 Nano Banana 2.1 / Pro / Lite：0 點（免費）。
  2. 影片生成模型 Omni 1.2 Flash：3 秒 360p = 3 點、3 秒 720p = 9 點、8 秒 360p = 8 點、8 秒 720p = 24 點。
  3. 影片生成模型 Veo 3.1：Lite 8 秒 = 10 點、Fast 8 秒 = 20 點、Quality 8 秒 = 100 點。
  4. 影片放大：720p / 1080p，1–10 秒免費，11–15 秒每多 1 秒 +1 點。
  5. 原生支援繁體中文提示詞，無需翻譯為英文。
  6. Ingredients 機制：可上傳參考圖（基準圖、草圖、風格圖），掛載在提示詞輸入區上方。
  7. Frames 功能：圖生影片，支援首尾幀補間。
  8. 專案分享與管理：專案連結可分享，需登入查看。
- 教材判斷：Flow 為主力工具，影像 0 點適合課堂大量試錯；繁中原生支援符合「不讓學生一開始就挫折」原則；Ingredients 機制對應「同一個角色永遠回頭掛同一張基準圖」的教學核心。

### 1.2 Comfy Cloud 官方服務

- 來源：`https://cloud.comfy.org/`，核對日 2026-11-24。
- 支持：
  1. 免費層：每帳號 5 次運行配額（介面顯示「剩餘 X / 5 次運行」），重置週期頁面未顯示，待老師實測。
  2. 內建 Z-Image-Turbo 範本工作流（`image_z_image_turbo`），7 個節點：載入檢查點、CLIP 文字編碼（正向/負向）、空白潛在影像、KSampler、VAE 解碼、儲存圖片。
  3. 分享連結機制：需先儲存工作流程，再建立連結，格式 `https://cloud.comfy.org/?share=...`，「擁有此連結的任何人都可以檢視並使用此工作流程」。
  4. 節點式介面：每個參數可見、可調、可重現，適合「對話黑箱 vs. 節點可控產線」教學對照。
- 教材判斷：W12 安排 1 堂精準體驗課，每位學生各自以個人 Google 帳號免費註冊，各自擁有獨立 5 次免費運行，互不影響。不跑影片，只跑 1–2 次輕量 2D 生圖（1024×1024、8 步），消耗 1–2 次配額。

### 1.3 既有 Colab / ComfyUI 條款與授權（保留供管線玩家派參考）

- Google Colab FAQ：`https://research.google.com/colaboratory/faq.html`，核對日 2026-11-03。免費版禁止「bypassing the notebook UI to interact primarily via a web UI」，長跑易被終止。
- ComfyUI Wan2.2 教學：`https://docs.comfy.org/tutorials/video/wan/wan2_2`，核對日 2026-11-03。Apache 2.0，允許商用。
- Juggernaut XL v9：`https://huggingface.co/RunDiffusion/Juggernaut-XL-v9`，核對日 2026-11-03。CreativeML OpenRAIL-M。
- SDXL 授權：`https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md`，核對日 2026-11-03。CreativeML Open RAIL++-M，附使用限制。

---

## 2. 實測與觀察值（measured / observed）

| 項目 | 數值 | 種類 | 週次 | 備註 |
|------|------|------|------|------|
| Flow 影像生成等待時間 | 約 10–15 秒 | 觀察值 | W07, W09, W10, W11, W13, W14 | 2026-11-24 實測觀察，非嚴格量測；網路、伺服器負載會變動。Nano Banana 0 點。 |
| Flow Frames 3 秒 360p 等待時間 | 約 30–60 秒 | 觀察值 | W07, W14 | 2026-11-24 實測觀察，非嚴格量測；扣 3 點。未實測完整流程，標觀察值。 |
| Flow 成本表 | 影像 0 點；Omni 1.2 Flash 3秒360p=3點/720p=9點；Veo 3.1 Lite 8秒=10點 | 文件 | W07, W15 | 來源：flow.google.com 專案內「Learn about generation costs」回覆，查核日 2026-11-24。 |
| Comfy Cloud 免費層配額 | 5 次運行/帳號/重置週期 | 文件 | W12 | 來源：cloud.comfy.org 介面顯示「剩餘 X / 5 次運行」，查核日 2026-11-24。重置週期頁面未顯示。 |
| Comfy Cloud Z-Image-Turbo 生成等待時間 | 約 15–30 秒 | 觀察值 | W12 | 1024×1024、8 步，基於 2026-11-24 實測觀察。消耗 1 次免費運行。 |
| Colab 四模型合計 | 23.35 GiB | 實測 | W09, W15, W16 | 2026-10-29 試點。影片模型 9.31、文字編碼器 6.27、VAE 1.31、插畫模型 6.46 GiB。 |
| Colab 下載 23.35 GiB | 280 秒 | 實測 | W09, W14, W15, W16 | 免費版 T4，2026-10-29。宿舍網路或尖峰時段會更久。 |
| Colab 生成一張插畫 | 約 27 秒 | 實測 | W09, W14, W16 | 試點設定 1280×704、30 步。 |
| Colab 生成一頁 2 秒動態 | 582–619 秒 | 實測 | W14, W15, W16 | 49 幀、20 步。八頁逐一記錄。 |

---

## 3. 推算值（calculated）

| 項目 | 數值 | 週次 | 備註 |
|------|------|------|------|
| 八頁動態合計 | 4721 秒（78.7 分鐘） | W15, W16 | 八個實測值相加：619、588、585、585、588、588、586、582 秒。 |
| 第 1 頁比後面多花 | 31–37 秒 | W14 | 推測為首次載入模型進記憶體。 |
| 動態比插畫倍數 | 約 22 倍 | W14 | 619÷27、588÷27。步數不同（插畫 30、影片 20），只當量級。 |
| 八頁分八次跑換機器 | 約 2 小時（7192 秒） | W15 | 8×(280+619)。同台機器分開送不會多花。 |
| 一次跑完同一件事 | 約 83 分鐘 | W15, W16 | 280+4721=5001 秒。差別在下載只做一次。 |

---

## 4. 教學建構參數（constructed）

以下不是研究結果，是教學設計，頁面一律標明「教學建構」，不得寫成實證：

- W07 課堂 180 分鐘分階段節奏：00–45 基準圖、55–115 連戲、125–180 Frames（含休息）。實際上課依現場狀況微調。
- W15 Flow 成本試算表（方案 A–F）：以 2026-11-24 成本表為基礎的教學設計範例，非實測總成本。
- 各週只加一個工具操作的順序，依「那週任務需要什麼」決定：
  - W07：同角色多視角＋動態初體驗（Flow 主力）
  - W09：分鏡第一格需求單對照（Flow 0 點快速試）
  - W10：鏡頭語言景別/視角對照（Flow 同角色基準圖）
  - W11：畫風語法＋4 格連戲候選（Flow Ingredients）
  - W12：Comfy Cloud 節點可控產線體驗（1–2 次輕量 2D）
  - W13：版面比例與 3 公分辨識度測試（Flow）
  - W14：場景空間深度＋微動態、手繪路線直進 Frames（Flow）
  - W15：三軌自由選提案與點數試算（Flow 成本表）
  - W16：統一交付包與五項評分規準（工具中立）

---

## 5. 截圖來源與檔案存在性驗證（2026-11-24 確認）

所有 `src` 路徑對應 `public/` 下真實檔案，檔案大小皆 > 10KB：

### Google Flow 教學截圖（`public/illustrations/tutorial-flow/`）

| 檔案 | 尺寸 | 大小 | 用途 |
|------|------|------|------|
| 01-flow-new-project.png | 2860×1272 | 1.6 MB | W07 Step 01：專案建立 |
| 02-flow-zh-sketch-setup.png | 2860×1272 | 236 KB | W07 Step 02：繁中鎖定段設定 |
| 03-flow-zh-sketch-result.png | 2860×1272 | 1.86 MB | W07 Step 03：基準圖生成結果 |
| 04-flow-consistent-setup.png | 2860×1272 | 1.86 MB | W07 Step 04：同角色延伸設定 |
| 05-flow-consistent-result.png | 2860×1272 | 3.09 MB | W07 Step 07/08：四視角對照結果、W11 Step 02：4 格連戲結果 |

### Google Flow 實測截圖（`public/illustrations/flow-pilot/`）

| 檔案 | 尺寸 | 大小 | 用途 |
|------|------|------|------|
| 01-flow-home.png | 2860×1386 | 126 KB | W07 Step 01、W09 Step 01、W10 Step 01：Flow 首頁/專案頁 |
| 02-flow-sketch-setup.png | 2860×1272 | 456 KB | W07 Step 06、W14 Step 01：草圖上傳設定 |
| 03-flow-sketch-result.png | 2860×1272 | 579 KB | W07 Step 07、W14 Step 03：草圖轉圖結果 |

### Comfy Cloud 實測截圖（`public/illustrations/comfy-cloud-pilot/`）

| 檔案 | 尺寸 | 大小 | 用途 |
|------|------|------|------|
| 01-comfycloud-home.png | 2860×1272 | 1.0 MB | W12 Step 01：工作流畫布 |
| 02-comfycloud-credits.png | 2860×1272 | 1.0 MB | W12 Step 02：免費層餘額 4/5 |
| 04-comfycloud-result.png | 2860×1272 | 835 KB | W12 Step 03：輕量 2D 生成結果 |
| 05-comfycloud-share.png | 2860×1386 | 226 KB | W12 Step 04：分享視窗與連結 |

---

## 6. 被排除/修正的說法與理由

| 原說法 | 修正後 | 理由 |
|--------|--------|------|
| 「Comfy Cloud 免費層 5 次運行，30 人共用會耗盡」 | 「30 人各自以個人 Google 帳號免費註冊，各自擁有獨立 5 次免費運行，互不影響」 | 免費配額是按帳號而非 IP/裝置計算。每位學生用自己帳號註冊即得 5 次。 |
| 「分鏡寫的是中文，模型讀的是英文，必須翻譯」 | 「Google Flow 原生懂繁體中文，不必寫英文咒語；教學主軸為繁中六欄描繪法」 | 2026-11-24 實測 Flow 直接接受繁中提示詞並產出正確結果。 |
| 「Colab 免費版可長時間用 ComfyUI 網頁介面」 | 「Colab 免費版條款明確禁止『bypassing the notebook UI』，長跑易被終止；保留給管線玩家派」 | FAQ 直接點名此用法在免費版常被終止。 |
| 「種子固定在第 10 週教」 | 「種子固定在第 12 週 Comfy Cloud 體驗課教」 | 主線改為 Flow，Flow 不暴露種子參數；Comfy Cloud 節點可見種子，W12 教固定 seed。 |
| 「需求單六欄含風格一項」 | 「需求單六欄：風格四項（媒材紙感、線條、光影、色彩基調）、角色三點、動作、場景、景別/視角、限制」 | 依教學拆解，風格拆為四可觀測屬性，角色三點獨立成欄。 |

---

## 7. 尚未取得/待補素材

- **Flow Frames 完整流程截圖**：含 3 秒 360p 生成過程、扣點確認、結果播放。待老師實測補擷。
- **Comfy Cloud 免費層重置週期**：介面未顯示，需老師實測記錄（如每日重置、每週重置、自然月重置）。
- **Comfy Cloud 節點圖完整截圖（03-comfycloud-workflow.png）**：前一輪 session 未擷取，本 session 未重跑，待補。
- **Flow 專案分享連結在無登入狀態下是否可開啟**：待老師實測。
- **Comfy Cloud 分享連結在無登入狀態下是否可直接開啟**：待老師實測。

---

## 8. 來源彙總

| 標籤 | 網址 | 支持內容 | 查核日 |
|------|------|----------|--------|
| Google Flow | `https://flow.google.com/` | 成本表、Ingredients、Frames、繁中支援、專案管理 | 2026-11-24 |
| Comfy Cloud | `https://cloud.comfy.org/` | 免費層 5 次、Z-Image-Turbo 範本、分享連結、節點介面 | 2026-11-24 |
| Google Colab FAQ | `https://research.google.com/colaboratory/faq.html` | 免費版禁止繞過 notebook UI、資源不保證 | 2026-11-03 |
| ComfyUI Wan2.2 | `https://docs.comfy.org/tutorials/video/wan/wan2_2` | Apache 2.0、模型資料夾結構 | 2026-11-03 |
| Juggernaut XL v9 | `https://huggingface.co/RunDiffusion/Juggernaut-XL-v9` | CreativeML OpenRAIL-M、單檔微調模型 | 2026-11-03 |
| SDXL License | `https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md` | CreativeML Open RAIL++-M、使用限制 | 2026-11-03 |
| AGENTS.md | 本 repo | 免費工具與權利邊界、教學脊柱、視覺系統 | 2026-11-24 |

---

> 量測值、觀察值、推算值、教學建構、文件值分開標示：本文件表格中已標明種類。凡標「觀察值」為 2026-11-24 實測觀察非嚴格量測；「教學建構」為教學設計參數；「文件」為官方條款回覆。未直接量測者不得寫成實測值。