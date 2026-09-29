export type ToolStatus = 'free' | 'free-quota' | 'one-time' | 'optional-gpu'

/**
 * Style axes carry two readings for every option: what it looks like, and what
 * it earns. The commercial column is the criterion in AGENTS.md — can this
 * choice be sold a second time? Options whose commercial answer is a yes are
 * repeatable; the rest are one-off.
 */
export interface StyleOption {
  visual: string
  commercial: string
  repeatable: boolean
}

export interface StyleAxis {
  key: string
  title: string
  question: string
  options: StyleOption[]
}

export const styleAxes: StyleAxis[] = [
  {
    key: '線條',
    title: '線條',
    question: '輪廓是穩定、顫抖、粗細分明，還是幾乎沒有線？',
    options: [
      {
        visual: '粗黑封閉輪廓',
        commercial: '印刷和雷射切割都吃得住，同一個角色能上實體周邊',
        repeatable: true,
      },
      {
        visual: '開放式細線、斷續筆觸',
        commercial: '質感好但印小會糊，交付範圍被鎖在螢幕',
        repeatable: false,
      },
      {
        visual: '幾乎沒有描邊',
        commercial: '改一次顏色要整張重畫，客戶每改一次你就少賺一次',
        repeatable: false,
      },
    ],
  },
  {
    key: '形狀',
    title: '形狀',
    question: '角色由哪些幾何形狀組成？哪個形狀不能改？',
    options: [
      {
        visual: '簡化剪影，只靠外輪廓認人',
        commercial: '能在 128px 貼圖和大型看板都成立，一套圖能切多種商品',
        repeatable: true,
      },
      {
        visual: '圓潤體塊、細節多',
        commercial: '單張很好看，縮到貼圖尺寸就認不出，只能當主視覺',
        repeatable: false,
      },
      {
        visual: '尖銳切面、造型強烈',
        commercial: '辨識度高但限制延伸，換姿勢容易崩',
        repeatable: false,
      },
    ],
  },
  {
    key: '色彩',
    title: '色彩',
    question: '顏色有幾種？哪一種顏色負責記憶點？',
    options: [
      {
        visual: '限制色盤加單一強調色',
        commercial: '換成聖誕版只改一個變數，授權給不同通路時成本低',
        repeatable: true,
      },
      {
        visual: '滿版高彩度',
        commercial: '每張都搶焦點，系列商品放一起沒有共同識別',
        repeatable: false,
      },
      {
        visual: '低彩度單色',
        commercial: '容易讀但沒有記憶點，別人記不住是哪個角色',
        repeatable: false,
      },
    ],
  },
  {
    key: '材質',
    title: '材質',
    question: '畫面看起來像紙、木刻、水彩，還是數位平塗？',
    options: [
      {
        visual: '乾淨的數位平塗',
        commercial: '輸出和授權都單純，印刷不挑紙，交付最快',
        repeatable: true,
      },
      {
        visual: '紙纖維、顆粒紋理',
        commercial: '放大漂亮，縮到商品尺寸變髒，縮小版要重做一份',
        repeatable: false,
      },
      {
        visual: '厚塗、有筆觸',
        commercial: '單張價值高，但幾乎不能複製品，只能當主視覺',
        repeatable: false,
      },
    ],
  },
  {
    key: '空間',
    title: '空間',
    question: '畫面是平面、分層、等距，還是有明確消失點？',
    options: [
      {
        visual: '前中後景分層，物件可獨立取出',
        commercial: '能拆成貼圖、桌商品、動畫元件，一份工作分幾種收入',
        repeatable: true,
      },
      {
        visual: '單一扁平平面',
        commercial: '一張圖就是一張圖，交付即結束',
        repeatable: false,
      },
      {
        visual: '強烈單點透視',
        commercial: '視覺漂亮但綁死一個角度，換用途要重畫',
        repeatable: false,
      },
    ],
  },
  {
    key: '用途',
    title: '用途',
    question: '這個風格要放在繪本、貼圖、海報、展演還是角色周邊？',
    options: [
      {
        visual: '角色設定頁與素材包',
        commercial: '賣的是這個角色本身，客戶付一次你持續有權利',
        repeatable: true,
      },
      {
        visual: '單張海報',
        commercial: '綁死一次展覽，展完就結束，只能收一次費用',
        repeatable: false,
      },
      {
        visual: '一次性委託插畫',
        commercial: '交付即終結，沒有後續收入',
        repeatable: false,
      },
    ],
  },
]

export const promptParts = [
  { title: '主體', detail: '主體是誰；先限制數量、身分與識別點。' },
  { title: '動作', detail: '把主體正在做的事情寫出來，讓畫面有可以被檢查的變化。' },
  { title: '構圖', detail: '主體放在哪裡，前景、背景與留白怎麼分配。' },
  { title: '風格語法', detail: '用線條、形狀、色彩、材質與空間描述風格。' },
  { title: '使用情境', detail: '說明要做成繪本頁、貼圖、封面或提案圖。' },
  { title: '限制條件', detail: '列出一定要保留，以及不要出現的元素。' },
]

export const tools = [
  {
    name: 'ChatGPT Free',
    status: 'free-quota' as ToolStatus,
    role: '整理想法、改提示詞、比較幾個版本；圖片生成有自己的使用上限。',
    fallback: 'Google AI Studio',
    source: 'https://help.openai.com/en/articles/9275245-using-chatgpt-s-free-plan',
  },
  {
    name: 'Google AI Studio',
    status: 'free-quota' as ToolStatus,
    role: '拿另一個模型來比較文字和圖片；免費使用量有上限。',
    fallback: 'ChatGPT Free',
    source: 'https://ai.google.dev/gemini-api/docs/rate-limits',
  },
  {
    name: 'Microsoft Designer',
    status: 'free-quota' as ToolStatus,
    role: '在瀏覽器裡快速試做圖像和版面；適合先看方向。',
    fallback: 'Canva Free + Photopea',
    source:
      'https://support.microsoft.com/en-US/designer/frequently-asked-questions-about-microsoft-designer',
  },
  {
    name: 'Adobe Firefly',
    status: 'free-quota' as ToolStatus,
    role: '試做生成和填補；免費使用有每日上限。',
    fallback: 'Microsoft Designer',
    source: 'https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html',
  },
  {
    name: 'Ideogram',
    status: 'free-quota' as ToolStatus,
    role: '試試文字進入圖像、海報和字體排版後會發生什麼。',
    fallback: 'Microsoft Designer',
    source: 'https://docs.ideogram.ai/plans-and-pricing/available-plans',
  },
  {
    name: 'Leonardo',
    status: 'free-quota' as ToolStatus,
    role: '反覆試做角色和視覺資產；免費帳號有每日 token。',
    fallback: 'Ideogram',
    source:
      'https://intercom.help/leonardo-ai/en/articles/9044700-tokens-frequently-asked-questions',
  },
  {
    name: 'Runway',
    status: 'one-time' as ToolStatus,
    role: '先試短影片和動態概念；免費方案的 credits 用完就沒有了。',
    fallback: 'Hugging Face demo',
    source: 'https://runway.com/pricing',
  },
  {
    name: 'Photopea',
    status: 'free' as ToolStatus,
    role: '在瀏覽器裡裁切、改尺寸、整理圖層和簡單合成；檔案可以留在本機。',
    fallback: 'GIMP',
    source: 'https://www.photopea.com/',
  },
  {
    name: 'Google Colab',
    status: 'optional-gpu' as ToolStatus,
    role: '想摸摸開源模型和 GPU 時再試；可用資源不保證。',
    fallback: 'Kaggle notebook',
    source: 'https://research.google.com/colaboratory/intl/en-GB/faq.html',
  },
  {
    name: 'Kaggle',
    status: 'optional-gpu' as ToolStatus,
    role: '在 notebook 裡試 GPU；每週可用量會變。',
    fallback: 'Google Colab',
    source: 'https://www.kaggle.com/docs/efficient-gpu-usage',
  },
]

export const experiments = [
  {
    number: 1,
    title: '先生成，再承認自己不知道',
    action: '同一主體，不先套風格名稱，保存所有結果。',
    output: '盲生成牆',
    question: 'AI 自己補了哪些我沒說的細節？',
  },
  {
    number: 2,
    title: '把漂亮拆成變數',
    action: '從六張結果標記線條、形狀、色彩、材質與空間。',
    output: '風格觀察卡',
    question: '我現在知道自己不懂的是哪個變數嗎？',
  },
  {
    number: 3,
    title: '一次只改一件事',
    action: '固定主體與構圖，只改一個風格語法。',
    output: 'A/B/C 對照表',
    question: '哪一個改動真的造成差異？',
  },
  {
    number: 4,
    title: '用用途選方向',
    action: '同一風格測試繪本頁、貼圖與提案封面。',
    output: '風格取向矩陣',
    question: '縮小之後還認得出來嗎？放到貼圖、繪本或商品上，哪個地方會先失效？',
  },
]

export const brokerChecklist = [
  { title: '一句話說明', detail: '你要怎麼用一句話，讓別人知道這個作品在做什麼？' },
  { title: '想給誰看', detail: '誰會看、使用，或願意把它帶回家？' },
  { title: '角色記憶點', detail: '哪三個特徵每次都要留下？' },
  { title: '畫面規則', detail: '線條、色票、比例和材質，哪些可以改，哪些不能改？' },
  { title: '下一個用途', detail: '它除了這一張圖，還能變成繪本、貼圖或其他東西嗎？' },
  { title: '來源與使用範圍', detail: '素材從哪裡來？工具和圖片可以怎麼使用？' },
  { title: '下一輪要試什麼', detail: '還有哪一個問題，你現在其實不知道答案？' },
]
