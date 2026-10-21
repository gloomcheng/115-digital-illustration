# 第 06 週文獻考證與商業教學查核報告：AI 影像生成原理、Anthropic 4D 設計框架與角色一致性實務

查核日期：2026-10-21  
查核標的：第 06 週課程內容（AI 影像生成底層機制：高斯擴散 vs. 自迴歸視覺 Token；Anthropic 2026 官方 Claude Academy 4D 設計思維；Prompt 規格書與 XML 關注點分離；業界真實角色一致性工業流水線：--cref / LoRA / Inpainting）。

---

## 1. 影像生成技術底層原理（視覺化教學素材）

### 1.1 高斯噪點擴散模型（Diffusion Model）
- **代表系統**：Midjourney、Stable Diffusion (SDXL/Flux)、OpenAI DALL·E 3。
- **運作機制**：
  - **正向破壞（Forward Process）**：透過馬可夫鏈將清晰圖片逐步注入高斯白噪點（Gaussian Noise），直至全圖轉化為無結構的靜態雪花雜訊。
  - **反向去噪（Reverse Denoising Process）**：以神經網路（U-Net 或 Diffusion Transformer, DiT）預測每一步被加入的噪點並予以扣除。提示詞經由文本編碼器（CLIP 或 T5）轉化為高維潛空間（Latent Space）向量，作為去噪過程的導引指南針（Guidance Vector）。
- **角色飄移的數學成因**：
  - 擴散模型高度仰賴起始隨機種子（Seed）。不同 Seed 意味著去噪起點在潛空間完全不同；即使 Prompt 完全相同，全圖並行重繪必然導致臉部骨架、五官細節與毛髮重新生長。
- **教學影片出處**：
  - 影片：*But how do AI images and videos actually work?* (3Blue1Brown x Welch Labs, YouTube)
  - 網址：`https://www.youtube.com/watch?v=iv-5mZ_9CPY`
  - 推薦時間段：0:00–3:30（正向加噪與反向雕刻）、11:00–13:40（文字指南針導引）。

### 1.2 自迴歸視覺生成模型（Autoregressive Visual Token Generation）
- **代表系統**：Google Parti、LlamaGen、原生多模態架構。
- **運作機制**：
  - 透過離散量化編碼器（VQ-VAE / VQ-GAN）將二維連續圖像離散化為網格狀的視覺詞元（Visual Tokens，如 16×16 = 256 個 Token）。
  - 模型採用 Decoder-only Transformer，依光柵順序（Raster-scan，從左上至右下）逐一預測下一個 Token。
- **視覺一致性特性**：
  - 生成時具備自注意力上下文視窗（Context Window），生成右側肢體時能「回看」左側已生成的頭部 Token。但隨長度增加易有累積誤差（Drift），且極度消耗推論顯存。

---

## 2. 前沿模型商對「設計（Design）」的定義與框架

### 2.1 Anthropic 2026 官方「AI Fluency 4D 設計思維」
- **資料出處**：Anthropic 官方教育平台 Claude Academy (`academy.claude.com`)，由 Ringling College of Art and Design 教授 Rick Dakan 與愛爾蘭科克大學 Joseph Feller 共同制定。
- **核心架構：雙層嵌套循環（The Two Nested Loops）**：
  1. **外層循環（專案責任與界線）**：
     - **Delegation（任務委派）**：基於問題意識（Goals）與平台極限（Capabilities），明確切分「何者交給 AI 輔助發想」、「何者由人類嚴格掌控」。在繪本中，背景發想可委派，角色靈魂與文化隱喻由人類掌控。
     - **Diligence（嚴謹責任）**：署名創作者承擔最終法律、版權與美學責任。AI 產出絕非直接商用完稿，必須經過人工校驗與後製。
  2. **內層循環（即時創作迭代）**：
     - **Description（規格描述）**：揚棄抒情形容詞，改以嚴格的「產品規格書」下達指令（鏡頭、景別、光線、角色不可變特徵）。
     - **Discernment（批判審查）**：建立挑剔的藝術總監視角，檢查一致性、閱讀動線與畫面畸形，拒絕無效重抽。

### 2.2 Anthropic 官方 Claude Design 與設計系統化
- **發布文獻**：*Introducing Claude Design by Anthropic Labs*（2026 年發布，`anthropic.com/news/claude-design-anthropic-labs`）。
- **設計哲學轉變**：
  - 反對「單張圖片抽卡」的封閉黑盒子。
  - 主張「設計系統優先（Design System Ingestion）」：動工前先吃入色票、字型、組件與角色設定（Character Bible）。
  - 雙欄即時協作（Workspace / Canvas）：左側為規格指令，右側為動態畫布，支援拉桿微調與代碼級資產交付。

---

## 3. 2026 年角色一致性工業實務流水線（Character Consistency Pipeline）

### 3.1 文字層 vs. 像素層的工具職責分界
- **文字規劃層（Claude / GPT）**：使用語意化 XML 標籤（如 `<character_bible>`、`<scene>`、`<camera>`）約束 LLM，防止多輪對話中故事邏輯與角色特徵錯亂。
- **像素繪製層（Midjourney / Flux / DALL·E）**：文字無法 100% 鎖死像素，必須搭配影像參考技術：
  1. **`--cref` (Character Reference)**：以正面基準圖（Master Image）提取特徵向量，搭配 `--cw`（Character Weight）控制臉部與服裝權重。
  2. **`--sref` (Style Reference)**：鎖死全書水彩或線條質感，避免風格跨頁跳tone。
  3. **局部重繪（Inpainting / Selection Tool）**：OpenAI 官方與現代繪圖工具唯一推薦的微調方式；保留主體構圖，僅塗抹瑕疵區域進行增量替換（Delta Prompting），嚴禁全圖重抽。
  4. **專屬 LoRA 微調**：專業商業工作室標準工作流，以 15–20 張多角度角色圖訓練輕量權重檔，達成 95% 以上跨頁一致性。
