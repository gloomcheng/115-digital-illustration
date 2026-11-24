# Flow + Comfy Cloud 路線重設計草稿（學生版步驟）

查核日期：2026-11-24
依據：`reference/pilot-flow-comfycloud-verification.md`、`src/data/weeks.ts`、`src/data/tool-track.ts`、`AGENTS.md`。
本檔為草稿，尚未修改 `src/`。所有數字依驗證紀錄；未量測值標 [待老師實測]。

## 1. 痛點對照表：現行 Colab 路線 vs. Flow + Comfy Cloud 路線

| 項目 | 現行 Colab 路線（`tool-track.ts` W09–W16） | 實測後 Flow + Comfy Cloud 路線 |
| --- | --- | --- |
| 啟動成本 | 下載 4 個模型共 23.35 GiB，實測 280 秒；需切換 T4 GPU | 瀏覽器開啟即用，0 安裝、0 下載 |
| 條款風險 | 免費版明確不接受「主要靠網頁介面操作」；長時間跑 ComfyUI 網頁介面可能被終止 | Flow 與 Comfy Cloud 為官方託管服務，無此條款風險 |
| 影像生成 | 約 27 秒 / 張（Colab T4） | Nano Banana 2.1 / Pro / Lite 為 0 點（免費） |
| 動態生成 | 8 頁 × 約 582–619 秒 = 4721 秒（78.7 分鐘） | 最短 3 秒 360p = 3 點；8 秒 720p = 24 點 |
| 錯誤排查 | 節點紅框 + 紅字卡 + notebook 輸出三處對照 | 平台代管，錯誤訊息由服務回傳，學生只看結果 |
| 分享 / 交接 | 匯出 workflow JSON、手動傳檔 | Comfy Cloud 免費帳號可產生「任何人可檢視並使用」的分享連結 |
| 免費配額 | Colab 免費版額度不公布，會逾時 | Flow 影像 0 點；Comfy Cloud 每人各自 5 次運行（實測帳號開啟時剩餘 4 / 5，執行 1 次後 3 / 5） |
| 依賴 | 需 Google 帳號、穩定網路、T4 可用性 | 需 Google 帳號與 Comfy Cloud 帳號、穩定網路 |
| 成本可預測性 | 推算值，非量測 | 平台公布固定成本表，可直接換算 |

結論：Colab 路線保留給「管線玩家派」（見第 5 節）作為進階選項；主線改為 Flow（影像與短動態）+ Comfy Cloud（節點模板與分享）。

## 2. W05–W16 調整後節奏總表

完全保留 `src/data/weeks.ts` 的 18 週標題與合授主責；本表只調整 W05–W16 的前 15 分鐘破冰、工具與產出，不改標題與主責。W01–W04、W17–W18 維持原設計。

| 週次 | 原標題（保留） | 主責（保留） | 前 15 分鐘破冰設計 | 工具 | 產出 |
| --- | --- | --- | --- | --- | --- |
| W05 | 人工智慧數位繪圖工具 | AI 工具 | 播放一段 3 秒 Flow 生成影片，問「這 3 秒花了幾點？」 | Flow（Nano Banana 影像 0 點） | 八格縮圖分鏡 + 主角三面圖 |
| W06 | 數位繪圖應用：與 ChatGPT 對話 | AI 工具 | 用 Flow 生成同一提示詞的 2 個版本，比對差異 | Flow（0 點）+ ChatGPT | 結構化角色規格書 + 增量對照圖 |
| W07 | 數位繪圖：AI 生成圖像的視角應用 | AI 工具 | 固定角色，Flow 生成俯視 / 仰視 / 特寫 3 張 | Flow（0 點） | 控制變因表 + 4 張對照輸出 |
| W08 | 期中專題 | 合授 | 小組互看 Flow 專案連結，確認角色可辨識 | Flow 專案連結 | 第一版 IP 作品包 |
| W09 | 故事腳本分鏡 | 故事與分鏡 | 用 Flow 把分鏡第一格生成出來，對回需求單 | Flow（0 點） | 腳本、分鏡條件、AI 圖像需求清單 |
| W10 | 故事腳本分鏡的鏡頭語言 | 故事與分鏡 | Flow 生成同一鏡頭條件的 2 個景別版本 | Flow（0 點） | 鏡頭註記與畫面說明對照 |
| W11 | 數位繪圖實務_專題腳本分鏡練習-1 | AI 工具 | Comfy Cloud 開啟 Z-Image-Turbo 範本，跑 1 次生成 | Comfy Cloud（1 次運行） | 角色卡（六項）+ 候選圖 |
| W12 | 數位繪圖實務_專題腳本分鏡練習-2 | AI 工具 | Comfy Cloud 載入 W12 模板（固定種子），改 1 個欄位重跑 | Comfy Cloud（1 次運行） | 失敗分類表 + 前後對照 + 一行推論 |
| W13 | 版面編排與角色設定 | AI 工具 | Comfy Cloud 載入 W13 模板（改寬高），2 種尺寸並排 | Comfy Cloud（2 次運行） | 一頁視覺規則表 |
| W14 | 場景設計與消失點應用 | AI 工具 | Flow 生成 2 個場景版本，標消失點 | Flow（0 點） | 空間條件表 + 兩種場景版本 |
| W15 | 期末專題設定與草圖發想討論 | 合授 | 用 Flow 成本表換算「期末做幾頁」 | Flow 成本表 | 作品檢查表 + 最小可交付版本 |
| W16 | 期末專題發表 | 合授 | 展示 Comfy Cloud 分享連結，確認可開啟 | Comfy Cloud 分享連結 | 作品、提案、版本與權利交接包 |

> **配額更正（2026-11-24）**：Comfy Cloud 的 5 次免費運行是「**每人各自 5 次**」，由每位學生用自己的 Google 帳號免費註冊取得，**不是全班 30 人共用 5 次**。30 人就有 30 份互不影響的獨立額度。
>
> 真正的風險在個人額度，不在班級額度：W11 用 1 次、W12 用 1 次、W13 用 3 次，合計剛好 5 次，等於一位學生把額度用到 0 且沒有任何重試空間。免費層的重置週期頁面未顯示（[待老師實測]），所以「下週額度會不會回來」目前無法回答。
>
> 因此 W11–W13 的設計調整為：W11 用 1 次、W12 用 1 次、W13 只做 2 種尺寸（2 次），合計 4 次，每位學生保留 1 次緩衝。需要第 5 次時，才由老師明確允許。

## 2-1. Flow 繁體中文與一致風格實測（2026-11-24）

W05–W10 的破冰全部靠 Flow 生圖，所以這一節的數字直接決定破冰時間怎麼配。

- 繁體中文可直接下指令，不必先翻成英文。實測提示詞：「暖色紙感、藍色墨線的兒童繪本水彩插畫：穿黃色雨衣的小學生站在校門口等媽媽，天空有層層雲朵，遠景。」
- 一次產出 2 張，模型為預設的 Nano Banana 2.1，頁面顯示「Generating will use 0 credits」，扣 0 點。
- 等待時間：送出後 159 秒仍在生成，4 分鐘內完成。**破冰不能只留 1 分鐘。**
- 一致風格延伸可運作：把生好的圖用「＋ → Add to prompt」加入參考，再用繁體中文寫「延續同一位……相同水彩墨線畫風，改成近景特寫……」。模型回覆會明確說明「使用上一張圖片作為角色與風格參考（:reference）」。角色與畫風成功延續。
- 草圖拖曳上傳在本輪仍未成功：拖曳到頁面回報 `no-file-input-found`，直接找檔案欄位回報 `File input not found`（Flow 的檔案欄位要按「新增素材 → 上傳媒體」才動態產生）。真人操作不受影響，但課堂需預留「上傳失敗就改用純文字提示詞」的備案。
- Frames 動態仍受阻：模型選單只列 Nano Banana Pro / 2 Lite / 2.1 三個影像模型，沒有 Omni 1.2 Flash 或 Veo，無法選 3 秒 360p。

## 3. 兩支 Comfy Cloud 教學模板的最小節點設計

兩支模板共用同一個骨架，來源為實測的 `image_z_image_turbo` 工作流（`https://cloud.comfy.org/?share=2999a427439a`，查核日 2026-11-24）。

骨架節點（7 個）：
1. 載入檢查點（`Comfy-Org/z_image_turbo - z_image_turbo_bf16`）
2. CLIP 文字編碼（正向）— prompt
3. CLIP 文字編碼（負向）— `low quality, blurry, watermark, text, signature`
4. 空白潛在影像 — width / height / batch size
5. KSampler — seed / steps 8 / cfg / sampler / scheduler
6. VAE 解碼
7. 儲存圖片 — filename_prefix

### W12 模板：手繪線稿鎖結構 + 固定種子

- 目的：讓手繪同學把線稿結構鎖住，只換描述與種子，觀察結構是否維持。
- 鎖定欄位：model、steps 8、sampler、scheduler、width 1024、height 1024、neg prompt。
- 學生只需要改 2 個欄位：
  1. **prompt**（正向提示詞的主體與動作描述，例如「暖色紙感、藍色墨線、兒童繪本插畫，一個穿黃色雨衣的小學生站在校門口等媽媽，wide shot」）。
  2. **seed**（種子號碼，改完按執行，看結構是否跟著變）。
- 截圖參考：`public/illustrations/comfy-cloud-pilot/04-comfycloud-result.png`（生成結果）、`public/illustrations/comfy-cloud-pilot/02-comfycloud-credits.png`（免費層餘額）。

### W13 模板：同架構的比例與尺寸對照

- 目的：驗證「尺寸一改，模型是重新安排主體，還是換一張同主題的圖」。
- 鎖定欄位：model、prompt、seed、steps、sampler、scheduler、neg prompt。
- 學生只需要改 2 個欄位：
  1. **width**（空白潛在影像的寬度，例如 1280 → 640）。
  2. **height**（空白潛在影像的高度，例如 720 → 360）。
- 只做 2 種尺寸：原尺寸 + 1 個對照尺寸。做 3 種會把個人額度用完，沒有重試空間。
- 截圖參考：`public/illustrations/tutorial-comfycloud/02-comfycloud-edit-prompt-seed.png`（只改 2 格的畫面）、`public/illustrations/tutorial-comfycloud/03-comfycloud-generated-result.png`（結果與剩餘次數）、`public/illustrations/tutorial-comfycloud/04-comfycloud-download-and-share.png`（存圖選單）。

### 中文提示詞實測（2026-11-24）

- Z-Image-Turbo 實測**接受繁體中文**。實測提示詞：「暖色紙感、藍色墨線的兒童繪本水彩插畫：穿黃色雨衣的小學生站在校門口等媽媽，天空有層層雲朵」。生成結果的主體（黃雨衣小孩）、畫風（水彩墨線）、場景（雲層）都對上。
- 推論線索：文字編碼器是 `Comfy-Org/z_image_turbo - qwen_3_4b`，Qwen 系列對中文較友善（推論，非頁面明示）。
- 教學建議：中文一句到底即可；要更穩可用「中文 + 英文關鍵詞」對照寫法。
- 實測：1024×1024、steps 8、seed 20251124，63 秒內完成，消耗 1 次運行（4 / 5 → 3 / 5）。

> 兩個欄位之外的設定一律不動；每次只改一個欄位，前後兩張並排比對。

## 4. 純手繪同學的三種借力方式

創作主權留在學生手上；AI 只提供參考與補間，不取代手繪。

1. 試色打光：用 Flow 生成 3–5 張不同配色與光影的版本，手繪時只借色票與光影位置，線條與構圖自己畫。
2. 透視參考：用 Flow 生成場景透視參考圖，手繪時照消失點與前中後景關係，角色與物件自己畫。
3. 用 Frames 首尾補間做動態繪本：手繪首張與尾張，用 Flow Frames（最低 3 秒 360p = 3 點）生成中間過渡幀，最後手動修掉 AI 補錯的地方。
   - 開課前檢查：2026-11-24 實測時，Flow 模型選單只有 Nano Banana 系列（影像），沒有 Omni 1.2 Flash，因此 Frames 無法設定。若開課當天模型選單仍未出現影片模型，這條接法改用「兩張靜態圖 + 口白」替代。

> 每次借力都要在紀錄上寫一行：借了什麼、沒借什麼、為什麼。

## 5. 期末三軌自由選的作業規格與統一評分規準

### 軌道 A：純手繪借力派

- 規格：手繪原稿 ≥ 8 頁；AI 借力紀錄 ≥ 3 筆（每筆含借了什麼、沒借什麼）；動態頁用 Frames 補間者需附首尾手繪稿。
- 交付：原稿掃描 + 借力紀錄 + 來源 / 權利清單。

### 軌道 B：敘事導演派

- 規格：Flow 生成 ≥ 8 頁；角色識別點 ≥ 3 項；鏡頭條件標註完整；至少 1 頁用 Frames 做動態。
- 交付：Flow 專案連結 + 版本紀錄 + 提示詞對照表。

### 軌道 C：管線玩家派

- 規格：Colab / ComfyUI 完整管線；workflow JSON 存檔；計時紀錄 ≥ 8 頁；失敗分類 ≥ 3 類。
- 交付：workflow JSON + 計時表 + 失敗分類表 + 來源 / 權利清單。

### 統一評分規準（5 項，每項 0–5 分，滿分 25）

1. 識別度：角色在小尺寸 / 不同版面仍可辨識。
2. 一致性：跨頁角色、場景、風格不漂移。
3. 敘事：分鏡、鏡頭、動作可讀。
4. 可重現：別人拿到檔案能重跑。
5. 權利與來源揭露：授權名稱、來源網址、查核日期齊全。

## 6. 老師回來後的 5 分鐘複驗清單

只留需要老師本人判斷的項目：

1. [ ] 確認 Flow 帳號點數餘額與每月重置日（頁面未顯示，需登入查看）。
2. [ ] 手動上傳 `raincoat-sketch.png` 到 Flow 媒體庫，跑一次 3 秒 360p Frames，記錄等待秒數與扣點。本輪模型選單只出現 Nano Banana 系列（影像），需確認老師帳號是否也看不到 Omni 1.2 Flash。
3. [ ] 確認 Comfy Cloud 分享連結 `https://cloud.comfy.org/?share=2999a427439a` 在無登入狀態下可開啟。
4. [ ] 確認每位學生 4 次的設計（W11 1 + W12 1 + W13 2）是否足夠，並查清免費層重置週期。**不是「全班 5 次夠不夠」的問題**：每人各自註冊、各自獨立額度，班級人數不影響任何一位學生的額度。
5. [ ] 確認每週破冰 15 分鐘是否超時（需實測）。Flow 繁體中文生圖一次要等 2–4 分鐘，破冰若含生圖需重新配時。
6. [ ] 確認 `03-comfycloud-workflow.png` 補擷，或決定不補。

## 7. 參考截圖路徑

Flow（本輪 `public/illustrations/tutorial-flow/`）：

- `01-flow-new-project.png` — Flow 專案畫面
- `02-flow-zh-sketch-setup.png` — 繁體中文提示詞設定（草圖未上傳成功）
- `03-flow-zh-sketch-result.png` — 繁體中文生成結果
- `04-flow-consistent-setup.png` — 一致風格延伸設定
- `05-flow-consistent-result.png` — 一致風格延伸結果
- `06-flow-frames-setup.png` — Scenes 動態設定，證明模型選單無影片模型

Comfy Cloud（本輪 `public/illustrations/tutorial-comfycloud/`）：

- `01-comfycloud-open-share.png` — 點開分享連結後的畫布與剩餘次數
- `02-comfycloud-edit-prompt-seed.png` — 只改 2 格：prompt 與 seed
- `03-comfycloud-generated-result.png` — 生成結果與剩餘 3 / 5
- `04-comfycloud-download-and-share.png` — 右鍵存圖選單

前一輪 session 另存：`public/illustrations/flow-pilot/01-flow-home.png`、`02-flow-sketch-setup.png`、`03-flow-sketch-result.png`；`public/illustrations/comfy-cloud-pilot/01-comfycloud-home.png`、`02-comfycloud-credits.png`、`04-comfycloud-result.png`、`05-comfycloud-share.png`。

## 8. 來源

- `reference/pilot-flow-comfycloud-verification.md`（本 session 實測）
- `src/data/weeks.ts`、`src/data/tool-track.ts`、`src/data/course.ts`
- `reference/source-audit-w09.md`
- `AGENTS.md`（本 repo）
