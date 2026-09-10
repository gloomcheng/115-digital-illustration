export const animationChain = [
  {
    number: '01',
    title: '先決定要傳達什麼',
    detail:
      '動態不是把漂亮畫面晃起來。先寫出一句聊天室真的會用到的訊息，例如「收到」「等等我」或「辛苦了」。',
    evidence: '一句溝通功能＋一個可辨識的靜止姿勢',
  },
  {
    number: '02',
    title: '只設計一個動作',
    detail:
      '把情緒拆成起點、變化、回到終點。眨眼、點頭、揮手都可以；先讓人看出是哪個動作，再追求細節。',
    evidence: '首幀草圖＋動作節拍表',
  },
  {
    number: '03',
    title: '保留 PNG 畫格序列',
    detail: '每一格都是可檢查的證據。固定畫布、角色錨點與透明背景，只讓必要的部位改變。',
    evidence: 'frame-01.png … frame-05.png',
  },
  {
    number: '04',
    title: '把序列封裝成 APNG',
    detail:
      'LINE 的動態貼圖交付物是副檔名為 .png 的 APNG，不是 GIF。封裝前先保留原始序列，壞一格才修得回去。',
    evidence: 'sticker-01.png（APNG）',
  },
  {
    number: '05',
    title: '逐項驗證限制',
    detail:
      '尺寸、畫格數、播放時間、色彩、透明度與檔案大小任何一項不合格，都會讓「會動」變成「不能交付」。',
    evidence: '規格檢查表',
  },
  {
    number: '06',
    title: '先看靜態，再送審',
    detail:
      '第一格會出現在 LINE STORE 與貼圖小舖，也會在靜止時顯示。先用 LINE 預覽確認辨識度，再申請審核。',
    evidence: '預覽截圖＋送審紀錄',
  },
] as const

export const lineSpecs = [
  { label: '動態貼圖組數', value: '8、16 或 24 張', note: 'LINE 官方可選數量' },
  { label: '單張畫布上限', value: '320 × 270 px', note: '寬高不可超過此上限；至少一邊須達 270 px' },
  { label: '每張畫格', value: '5–20 格', note: '連續相同圖片可能被合併成一格' },
  { label: '播放', value: '1–4 次／總長 ≤ 4 秒', note: '每張貼圖各自符合' },
  { label: '檔案', value: '< 1 MB／張', note: '全部 ZIP 上傳時 < 60 MB' },
  { label: '色彩與背景', value: 'RGB＋透明背景', note: '畫布尺寸需在所有畫格一致' },
  { label: '交付格式', value: '.png（APNG）', note: '不要交 GIF；LINE 會讀 APNG 動畫' },
  { label: '第一格', value: '就是靜態預覽', note: '第一格先把情緒與用途說清楚' },
] as const

export const animationTools = [
  {
    name: 'Krita',
    role: '逐格繪畫',
    detail: '先用它把每一格畫出來、修好，再輸出 PNG。',
    url: 'https://docs.krita.org/en/reference_manual/render_animation.html',
  },
  {
    name: 'APNG Assembler（apngasm）',
    role: '封裝工具',
    detail: '再用它把 PNG 序列包成 LINE 要的 APNG；壞一格時也能拆回來找。',
    url: 'https://github.com/apngasm/apngasm',
  },
  {
    name: 'OpenToonz',
    role: '延伸工具',
    detail: '想摸完整 2D 時間軸再用；本單元先把 PNG 序列做穩。',
    url: 'https://opentoonz.readthedocs.io/en/latest/rendering_the_animation.html',
  },
  {
    name: 'Photopea',
    role: '清理工具',
    detail: '用來做最後小修：裁切、去背、改尺寸；不要拿它代替逐格動畫工具。',
    url: 'https://www.photopea.com/',
  },
] as const

export const animationSources = [
  {
    label: 'LINE 動態貼圖製作準則（繁中）',
    url: 'https://creator.line.me/zh-hant/guideline/animationsticker/',
  },
  {
    label: 'LINE Creators Market：送審與發佈流程',
    url: 'https://help2.line.me/creators/web/categoryId/20002313/?lang=en',
  },
  {
    label: 'Krita：輸出動畫與 PNG 序列',
    url: 'https://docs.krita.org/en/reference_manual/render_animation.html',
  },
  { label: 'APNG Assembler：開源工具', url: 'https://github.com/apngasm/apngasm' },
] as const
