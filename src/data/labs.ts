export type ToolStatus = 'free' | 'free-quota' | 'one-time' | 'optional-gpu'

export const styleAxes = [
  {
    key: '線條',
    title: '線條',
    question: '輪廓是穩定、顫抖、粗細分明，還是幾乎沒有線？',
    example: '粗黑輪廓、單色鋼筆線、開放式輪廓',
  },
  {
    key: '形狀',
    title: '形狀',
    question: '角色由哪些幾何形狀組成？哪個形狀不能改？',
    example: '圓潤體塊、簡化剪影、尖銳切面',
  },
  {
    key: '色彩',
    title: '色彩',
    question: '顏色有幾種？哪一種顏色負責記憶點？',
    example: '限制色盤、藍橘對比、單一強調色',
  },
  {
    key: '材質',
    title: '材質',
    question: '畫面看起來像紙、木刻、水彩、蠟筆，還是數位平塗？',
    example: '紙纖維、孔版印刷顆粒、粉蠟筆痕',
  },
  {
    key: '空間',
    title: '空間',
    question: '畫面是平面、分層、等距，還是有明確消失點？',
    example: '扁平透視、紙層、微縮場景',
  },
  {
    key: '用途',
    title: '用途',
    question: '這個風格要放在繪本、貼圖、海報、展演還是角色周邊？',
    example: '小尺寸辨識、連續頁面、可授權延伸',
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
