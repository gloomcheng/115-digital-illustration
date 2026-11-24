# Google Flow 與 Comfy Cloud 實測驗證紀錄

查核日期：2026-11-24
查核者：AI 工具線（本機 Brave + Agent360 Browser MCP）
來源任務檔：`pilot/freebuff-task-prompt.txt`

## 1. 實測範圍與前提

- 只使用老師已登入的 Brave 分頁，未輸入密碼、付款資料，未點 Subscribe / Upgrade / Purchase / Billing。
- 未呼叫 `browser_solve_captcha`，未繞過任何驗證。
- 未在 Comfy Cloud 跑影片。
- 點數預算：Flow ≤ 約 50 點；Comfy Cloud ≤ 約 40–60 點（僅 1–2 次輕量 2D 圖）。
- 未關閉老師任何 Brave 分頁；Comfy Cloud 以另開新分頁方式操作。
- 本輪（第二輪 session）在既有紀錄上追加：繁體中文提示詞實測、一致風格延伸實測、草圖拖曳上傳測試、Comfy Cloud 中文提示詞實測與計時。學生版圖文步驟見 `reference/tutorial-flow-comfycloud-step-by-step.md`。

## 2. 實際網址

| 工具 | 實測網址 | 備註 |
| --- | --- | --- |
| Google Flow | `https://flow.google.com/`，專案頁 `https://flow.google.com/project/66d7c4cb-f73d-4b4d-b422-a9c1bd84a7ea` | 帳號顯示 PRO 徽章 |
| Comfy Cloud | `https://cloud.comfy.org/` | 帳號顯示名稱 Fuyuan，Cloud 版本 V0.46.2 |
| 草圖來源 | `pilot/sketch-test/raincoat-sketch.png`（本機，314,263 bytes） | 僅用於合成測試，未含個資 |

## 3. 點數前後數字

### Google Flow

- 帳號方案：PRO（頁面徽章顯示，來源：`flow.google.com`，查核日 2026-11-24）。
- 影像生成：Nano Banana 2.1 / Pro / Lite 為 0 點（免費）；2K 解析度放大為 0 點（免費）。
- 影片生成（Omni 1.2 Flash）成本表（頁面「Flow Generation Cost Overview」，查核日 2026-11-24）：

  | 時長 | 360p | 720p |
  | --- | --- | --- |
  | 3 秒 | 3 點 | 9 點 |
  | 4 秒 | 4 點 | 12 點 |
  | 5 秒 | 5 點 | 15 點 |
  | 6 秒 | 6 點 | 18 點 |
  | 8 秒 | 8 點 | 24 點 |
  | 10 秒 | 10 點 | 30 點 |
  | 15 秒 | 20 點 | 60 點 |

- Veo 3.1（8 秒影片）：Lite 10 點、Fast 20 點、Quality 100 點。
- 影片放大：720p / 1080p，1–10 秒免費，11–15 秒每多 1 秒 +1 點。
- 本次實測前後點數餘額：[待老師實測]（本 session 的 Flow 頁面未顯示餘額數字，僅顯示 PRO（付費方案）徽章；01-flow-home.png 由前一輪 session 擷取，請老師對照）。

### Comfy Cloud

- 帳號：Fuyuan（免費層）。查核日 2026-11-24 開啟分享工作流時顯示「剩餘 4 / 5 次運行」。
- 本次執行 1 次輕量 2D 圖（Z-Image-Turbo，1024×1024、8 步、seed 20251124、繁體中文提示詞），執行後剩餘 3 / 5 次運行。消耗 1 次。
- 免費層每次執行上限與重置週期：[待老師實測]（頁面未顯示）。
- 配額歸屬：**每人各自以個人 Google 帳號免費註冊，各自擁有獨立的 5 次免費運行。** 30 人班級會有 30 份互不影響的 5 次，不是全班共用 5 次。單一學生自己只有 5 次，這是個人預算問題，不是班級預算問題。

## 4. 等待秒數

- Flow 繁體中文生圖（Nano Banana 2.1，提示詞「暖色紙感、藍色墨線的兒童繪本水彩插畫：穿黃色雨衣的小學生站在校門口等媽媽，天空有層層雲朵，遠景。」）：送出後 159 秒仍在生成，4 分鐘內完成 2 張。精確完成秒數未記錄。扣 0 點。
- Flow 一致風格延伸（同一張圖加入參考，繁體中文「延續同一位穿黃色雨衣的小學生與相同水彩墨線畫風，改成近景特寫，他抬頭看天空落下第一滴雨。」）：模型回覆「我將使用上一張圖片作為角色與風格參考（:reference）」，一次出 2 張，扣 0 點。等待時間與前一次同級（2–4 分鐘）。
- Comfy Cloud 輕量 2D 生成（Z-Image-Turbo，1024×1024、8 步、seed 20251124、繁體中文提示詞）：63 秒內完成（送出後第一次查看時已完成）。消耗 1 次運行，剩餘 4 / 5 → 3 / 5。
- Flow Frames 最短動態：未執行，見第 6 節。

## 5. 介面文字（擷取）

### Google Flow

- 首頁：「Hi Fuyuan / What would you like to create?」、左側「All media / Characters / Scenes / Library / Tools」。
- 工具列按鈕：「Add ingredients to the prompt box」（上傳媒體入口）。
- 成本說明入口：「Learn about generation costs」（點擊後在對話區回傳成本表）。
- 模型：Nano Banana 2.1 / Pro / Lite（影像，0 點）、Omni 1.2 Flash（影片）、Veo 3.1 Lite / Fast / Quality（影片）。

### Comfy Cloud

- 首頁標題：「Comfy Cloud: Run ComfyUI online | Zero Setup, Powerful GPUs, Create anywhere」。
- 工作流名稱：`image_z_image_turbo`（未儲存狀態顯示「Unsaved Workflow」）；本輪從分享連結開啟後建立副本 `image_z_image_turbo (2)`。
- 節點欄位：prompt（129 個字元 → 本輪改為繁體中文 44 個字元）、width 1024、height 1024、seed 889848477211015 → 本輪改為 20251124、steps 8、unet `Comfy-Org/z_image_turbo - z_image_turbo_bf16`、clip `Comfy-Org/z_image_turbo - qwen_3_4b`、vae `Comfy-Org/HiDream-I1_ComfyUI - ae`。
- 執行狀態：「0 個進行中」、作業佇列可展開。
- 免費層提示：「剩餘 4 / 5 次運行」、「升級」按鈕（本輪執行後變「剩餘 3 / 5 次運行」）。
- 存圖選單（在 `儲存圖片` 節點按右鍵）：「開啟圖片」、「在遮罩編輯器中開啟」、「複製圖片」、「儲存圖片」、「顯示完整解析度」、「重新命名」。
- 分享對話框文字：「你必須先儲存工作流程才能分享。請先儲存以繼續。」、「建立連結」、「匯出工作流程」、「請輸入檔案名稱：」、「確認」。
- 分享完成後文字：「複製」、「發佈於 2026年11月24日」、「擁有此連結的任何人都可以檢視並使用此工作流程。如果你對此工作流程做出更改，可以重新發佈以更新分享版本。」
- 分享網址：`https://cloud.comfy.org/?share=2999a427439a`（查核日 2026-11-24）。

## 6. 卡關與跳過紀錄

### Google Flow Frames（圖生影片）— 跳過

- 原因 1：本 session 的 Flow 頁面未顯示點數餘額，無法確認剩餘點數是否足夠一次最短 Frames（至少 3 點，3 秒 360p）。
- 原因 2：媒體上傳路徑卡關。透過「Add ingredients to the prompt box」→「Upload media」觸發原生檔案選擇器，已嘗試 `browser_handle_dialog` 帶檔路徑接受，但上傳後媒體庫仍顯示「No assets found.」，無法把 `raincoat-sketch.png` 送入生成流程。
- 原因 3（本輪新增）：進入「Scenes」後把繪本圖加入參考，並輸入繁體中文動態指令。模型的設定面板點開後，只列出 `Nano Banana Pro`、`Nano Banana 2 Lite`、`Nano Banana 2.1` 三個**影像**模型。選單裡沒有 Omni 1.2 Flash 或 Veo 系列，因此無法選擇 3 秒 360p 影片設定。依「每個操作最多試 2 次」規範，第 2 次仍只看到影像模型，即停手。
- 結論：依任務檔「若點數不足或卡關就如實記錄跳過」，本次 Frames 測試跳過，不消耗點數。截圖 `06-flow-frames-setup.png` 已存（證明卡在模型選單），`07-flow-frames-result.png` 未產生且未被任何文件引用。
- 待老師本人複驗：登入後確認點數餘額、確認模型選單是否出現 Omni 1.2 Flash、手動上傳草圖、跑一次 3 秒 360p 最短 Frames，記錄等待秒數與扣點。

### Google Flow 草圖拖曳上傳 — 失敗，改走純文字提示詞

- 第 1 次：`browser_drop_file` 拖曳 `raincoat-sketch.png` 到頁面，回報 `no-file-input-found`（目標元素沒有檔案欄位，點擊也未開啟選檔視窗）。
- 第 2 次：`browser_upload_file` 直接找 `input[type="file"]`，回報 `File input not found`。Flow 的檔案欄位要按下「新增素材 → 上傳媒體」才會動態產生。
- 依「最多試 2 次、絕不開啟 macOS 原生 Finder」的規範停手，改用純文字繁體中文提示詞完成後續實測。
- 給學生的做法：真人在電腦教室按「＋」→「上傳媒體」→ 選自己的 JPEG 或 PNG 即可，此路徑不需任何技巧。

### Comfy Cloud 分享視窗 — 完成

- 已擷取 `05-comfycloud-share.png`。
- 免費帳號可以產生分享連結：測試結果為「擁有此連結的任何人都可以檢視並使用此工作流程」，分享網址 `https://cloud.comfy.org/?share=2999a427439a`。
- 免費限制觀察：免費層剩餘運行次數 4 / 5；分享本身不另扣點，但使用連結的人在自己的帳號下執行仍受其自身配額限制。分享連結需先儲存工作流程才能建立。
- 未測項目：連結在無登入狀態下是否可直接開啟、是否含浮水印或下載限制、版本更新後重新發佈的流程 — [待老師實測]。

## 7. 截圖清單

### Google Flow（本輪：`public/illustrations/tutorial-flow/`）

| 檔名 | 說明 | 狀態 |
| --- | --- | --- |
| `01-flow-new-project.png` | Flow 專案畫面，左側導覽與專案名稱 | 已存 |
| `02-flow-zh-sketch-setup.png` | 繁體中文提示詞設定畫面（純文字，草圖未上傳成功） | 已存（本輪） |
| `03-flow-zh-sketch-result.png` | 繁體中文生成結果，畫布 2 張圖 + 對話區回覆 | 已存（本輪） |
| `04-flow-consistent-setup.png` | 一致風格延伸設定：參考縮圖 + 繁體中文提示詞 | 已存（本輪） |
| `05-flow-consistent-result.png` | 一致風格延伸結果，近景特寫同角色 | 已存（本輪） |
| `06-flow-frames-setup.png` | Scenes 動態設定，證明模型選單無影片模型 | 已存（本輪） |
| `07-flow-frames-result.png` | Frames 影片結果 | 未產生（跳過，見第 6 節；本文件不引用） |

前一輪 session 另存有 `public/illustrations/flow-pilot/01-flow-home.png`、`02-flow-sketch-setup.png`、`03-flow-sketch-result.png`，仍可作為補充。

### Comfy Cloud（本輪：`public/illustrations/tutorial-comfycloud/`）

| 檔名 | 說明 | 狀態 |
| --- | --- | --- |
| `01-comfycloud-open-share.png` | 點開老師分享連結後的畫布，含「剩餘 4 / 5 次運行」 | 已存（本輪） |
| `02-comfycloud-edit-prompt-seed.png` | 只改 2 格：prompt 換繁體中文、seed 改 20251124 | 已存（本輪） |
| `03-comfycloud-generated-result.png` | 生成結果 1024×1024，剩餘次數變 3 / 5 | 已存（本輪） |
| `04-comfycloud-download-and-share.png` | 右鍵選單：開啟圖片 / 儲存圖片 / 顯示完整解析度 | 已存（本輪） |

前一輪 session 另存有 `public/illustrations/comfy-cloud-pilot/01-comfycloud-home.png`、`02-comfycloud-credits.png`、`04-comfycloud-result.png`、`05-comfycloud-share.png`。

## 8. 順暢處

- Comfy Cloud 免費帳號可直接開啟 Z-Image-Turbo 範本、上傳提示詞、執行 2D 生成，無需安裝。
- Comfy Cloud 分享連結建立流程順暢，免費帳號可產生「任何人可檢視並使用」的連結。
- Flow 影像生成為 0 點，適合課堂大量試錯。
- Flow 成本表透明，最低影片成本 3 點（3 秒 360p），可讓學生自行換算頁數與時間。
- Flow 繁體中文提示詞可直接使用，不必先翻成英文；一致風格延伸用「加入參考圖 + 寫明延續」即可鎖住角色。
- Comfy Cloud 的 Z-Image-Turbo 實測接受繁體中文提示詞，主體與畫風都對上（文字編碼器為 `qwen_3_4b`，此為推論線索，非頁面明示）。

## 9. 卡關處

- Flow 媒體上傳在本輪仍未成功（拖曳與直接找檔案欄位各 1 次皆失敗），草圖入圖路徑未取得自動化證據；真人操作不受影響。
- Flow 模型選單無影片模型，Frames 動態測試無法完成。
- Flow 頁面未顯示點數餘額數字，僅顯示 PRO 徽章，餘額需老師登入後確認。
- **配額更正：Comfy Cloud 的 5 次免費運行是「每人各自 5 次」，不是全班共用 5 次。** 每位學生用個人 Google 帳號免費註冊，各自擁有獨立額度，30 人就是 30 份互不影響的 5 次。真正的限制在個人：單一學生只有 5 次，而 W11–W13 的原始設計剛好用到 5 次，等於沒有重試空間，需在課程設計上保留緩衝。
- Comfy Cloud 免費層的重置週期頁面未顯示，[待老師實測]；因此無法回答「下週上課前額度會不會回來」。
- Comfy Cloud 節點圖截圖 `03-comfycloud-workflow.png` 未擷取，待補。

## 10. 來源與查核日期

- Google Flow 成本表：`https://flow.google.com/` 專案內「Learn about generation costs」回覆，查核日 2026-11-24。
- Comfy Cloud 介面與分享：`https://cloud.comfy.org/`，查核日 2026-11-24。
- 課程既有 Colab / ComfyUI 數字：`reference/source-audit-w09.md`、`src/data/tool-track.ts`，查核日 2026-11-03。
- 免費工具與權利邊界：`AGENTS.md`（本 repo）。

> 量測值與推估值分開標示：本文件第 3、4 節的點數與秒數，凡標 [待老師實測] 皆為未直接量測，不得寫成實測值。
