/**
 * Real market and industry data for W03.
 *
 * Every figure here comes from a public source recorded in `source`. A
 * classroom number is marked with `assumed: true` and the teacher must replace
 * it before teaching; nothing on the page may present an assumption as a fact.
 */

export interface MarketFact {
  id: string
  /** What the number is, in one sentence a student can repeat. */
  claim: string
  /** The measured value, formatted for display. */
  value: string
  /** The source, kept next to the number rather than only in a footer. */
  source: string
  url: string
  /** True when the teacher must supply this before the lesson is taught. */
  assumed?: boolean
  /** What the number does not say, so the figure is not over-read. */
  boundary?: string
}

export const marketFacts: MarketFact[] = [
  {
    id: 'ai-adoption-2025',
    claim: '每週使用 AI 的設計師比例',
    value: '2025 年 54%',
    source: 'AI in Design 2026 Report（年題名沿用 2026，比較基準為 2025）',
    url: 'https://stateofaidesign.com/chapters/tools',
    boundary: '是「用過」，不是「依賴」。同一份調查裡 91% 的人仍在找自己的工具組合。',
  },
  {
    id: 'ai-adoption-2026',
    claim: '每週使用 AI 的設計師比例',
    value: '2026 年 91%',
    source: 'AI in Design 2026 Report',
    url: 'https://stateofaidesign.com/chapters/tools',
    boundary: '一年內從 54% 變 91%。工具的學習門檻正在快速下降，這對新鮮人最不利。',
  },
  {
    id: 'ai-tools-per-designer',
    claim: '每個設計師平均同時使用的 AI 工具數',
    value: '7 個（去年 3 個）',
    source: 'AI in Design 2026 Report',
    url: 'https://stateofaidesign.com/chapters/tools',
    boundary: '工具變多不等於產出變好。調查中有近半數受訪者仍在尋找固定組合。',
  },
  {
    id: 'ai-complement',
    claim: '認為 AI 是補充而非取代的設計師',
    value: '67%',
    source: 'AI in Design 2026 Report',
    url: 'https://stateofaidesign.com/chapters/tools',
  },
  {
    id: 'ai-demand-reduced',
    claim: '認為 AI 工具減少了對設計師需求的企業',
    value: '只有 18%',
    source: 'AI in Design 2026 Report（另見 67% 設計師視 AI 為補充）',
    url: 'https://stateofaidesign.com/chapters/tools',
    boundary: '「需求沒有消失」不等於「入口還在」。看下一條。',
  },
  {
    id: 'senior-vs-junior',
    claim: '招募主管表示正在增加「資深」設計職缺的比率',
    value: '56%（初級職缺只有 25%）',
    source: 'Figma：Why Demand for Designers Is on the Rise',
    url: 'https://www.figma.com/blog/why-demand-for-designers-is-on-the-rise',
    boundary: '這是這一週最該記住的一條。AI 沒有消滅設計師，它把初級入口關小了一點。',
  },
  {
    id: 'ai-fluency-required',
    claim: '招募主管認為「AI 工具能力」是必要條件的比率',
    value: '73%',
    source: 'Figma：Why Demand for Designers Is on the Rise',
    url: 'https://figma.com/blog/why-demand-for-designers-is-on-the-rise',
  },
  {
    id: 'wef-core-skills',
    claim: '雇主列出「最重要能力」的排序（WEF Future of Jobs 2025）',
    value: '分析思考 69%、韌性與彈性 67%、領導與社會影響 61%、創意思維 57%、科技素養 51%',
    source: 'World Economic Forum, Future of Jobs Report 2025',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    boundary: '操作工具排在五項之外。工具可以教，判斷要累積。',
  },
  {
    id: 'line-revenue-share',
    claim: 'LINE 貼圖的分潤結構',
    value: '售價 NT$30 → 商店抽 30% → LINE 再抽 50% → 創作者約拿 NT$10.5（售價的 35%）',
    source: 'LINE Creators Market 官方說明（扣除應用商店 30% 後的 50% 分配給創意人）',
    url: 'https://creator.line.me/zh-hant',
    boundary: '從 LINE STORE 網頁購買、不經 App 內購時，比例會不同。',
  },
  {
    id: 'line-real-case',
    claim: '台灣創作者公開的實際收入（不是平均值，是一個真實樣本）',
    value: '14 個月賣約 4,000 組，實際入帳 NT$28,300，平均每月約 NT$2,000',
    source: '台灣創作者公開貼文（Threads，計算期間 2023-03-01 至 2024-04-30）',
    url: 'https://www.threads.com/@prodigal_purple/post/C7eA-WsvmNH',
    boundary:
      '這是「賣得動」的人，不是平台平均。整體分布更極端 —— 全球 750 萬註冊創作者，累計銷售額破 1 億日圓的只有 198 人（LINE 8 週年數據）。',
  },
  {
    id: 'line-concentration',
    claim: 'LINE Creators Market 的收入集中度',
    value: '全球 750 萬註冊創作者，台灣 100 萬，累計銷售破 1 億日圓者僅 198 人',
    source: 'LINE 10 週年與 8 週年公開數據（經創作者社群整理引用）',
    url: 'https://www.shareuhack.com/zh-TW/posts/ai-line-sticker-passive-income',
    boundary: '「8 週年」是 2022 年的數字，較舊。它說明的是分布形狀，不是當年現況。',
  },
  {
    id: 'kasing-lung-timeline',
    claim: 'Labubu 從誕生到成為現象的時間',
    value: '2015 年誕生於繪本；2019 年與泡泡瑪特簽獨家授權；2023 年仍只佔其營收 5.8%；2024 年爆紅',
    source: 'BBC 中文〈Labubu 走紅背後的營銷爆點、盲盒模式與穀子經濟〉',
    url: 'https://www.bbc.com/zhongwen/articles/c62dm0y2krjo/trad',
    boundary: '它證明「好角色不會自動變成生意」，中間隔了八年。',
  },
  {
    id: 'popmart-scarcity',
    claim: '泡泡瑪特的稀缺設計',
    value: '每組 9 款常規 + 3 款隱藏，買家無法事先知道是哪一款',
    source: '泡泡瑪特商業模式分析（多篇一致描述）',
    url: 'https://www.hkubs.hku.hk/tc/research/thought-leadership/hkej-column/the-ip-strategy-behind-pop-marts-overnight-popularity',
    boundary: '「設計稀缺」是商業操作，不是角色本身的天性。角色好不好賣和這套機制是兩件事。',
  },
  {
    id: 'labubu-defensible',
    claim: 'Labubu 被用來防仿冒的三個識別點',
    value: '九顆牙、桃色面部、腳底的泡泡瑪特標誌',
    source: '中國保護知識產權網（商務部）報導',
    url: 'https://ipr.mofcom.gov.cn/article/gjxw/zfxd/mz/202511/1993778.html',
    boundary: '這三個是法律資產，不是裝飾。這一堂課有一整個回合在練怎麼找出這三個。',
  },
  {
    id: 'ai-handoff-gap',
    claim: '「出圖」與「可交付完稿」的落差',
    value: 'AI 產出的是畫面，不是完稿',
    source: '設計業界公開討論（Threads，專業設計者整理）',
    url: 'https://www.threads.com/@blodvison13/post/DXcEVEomeOs/',
    boundary: '來源是個人貼文，不是統計。但描述的是業界普遍遇到的交接問題。',
  },
]

/**
 * Numbers the teacher must replace with a real quote before teaching.
 * They are on the page marked as 假設 so no student reads them as market data.
 */
export const assumedNumbers: MarketFact[] = [
  {
    id: 'assumed-freelance',
    claim: '學生接案：角色設定頁行情',
    value: '老師的假設，請上課前填入實價',
    source: '待老師提供業界行情',
    url: '',
    assumed: true,
    boundary: '網路上查不到可信的公開行情，多數是行銷文章。沒有實價就不要寫數字。',
  },
  {
    id: 'assumed-syllabus',
    claim: '學生接案：主視覺／單張插畫行情',
    value: '老師的假設，請上課前填入實價',
    source: '待老師提供業界行情',
    url: '',
    assumed: true,
    boundary: '同上。',
  },
  {
    id: 'assumed-parttime',
    claim: '學生接案：每小時合理報價',
    value: '老師的假設，請上課前填入實價',
    source: '待老師提供業界行情',
    url: '',
    assumed: true,
    boundary: '這一項決定了整堂課的計算結果，不能用猜的。',
  },
]

/** The judgment the course is built on, stated once so every page can point at it. */
export const hiringQuestion = {
  headline: 'AI 會出一百張。付錢的是那個決定留下哪三張的人。',
  detail:
    '企業不是買一張圖，買的是有人負責在很多個選項裡做決定、說得出理由、並承擔決定錯的後果。這三件事 AI 都不做。',
}
