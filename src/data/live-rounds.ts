/**
 * Live classroom rounds for the phone-and-projector game.
 *
 * Students see the prompt and options on their own phone. The projector shows
 * only the answer ratio, so nobody can copy an answer off the wall. Reasons
 * stay anonymous; the teacher may put one on screen.
 *
 * The rounds do not teach business knowledge. They train the three things a
 * company still pays for when anyone can generate images: choosing which option
 * is right, asking what the client actually means, and finishing the work so it
 * can ship.
 */

export type LiveStage = 'audit' | 'interview' | 'handoff' | 'rights'

export interface LiveOption {
  id: string
  label: string
  detail: string
}

export interface LiveRound {
  id: string
  stage: LiveStage
  axis?: string
  prompt: string
  context: string
  options: LiveOption[]
  reveal: string
  /** What this round is actually training, for the teacher view. */
  teaches: string
  /** The data point that makes the round land, shown after the reveal. */
  evidence?: { label: string; value: string; source: string; url: string }
}

export const liveRounds: LiveRound[] = [
  {
    id: 'audit-cutdown',
    stage: 'audit',
    prompt: '15 張候選，你只能留 3 張。留下哪 3 張？',
    context: '客戶是「某兒童睡前繪本」，第一頁要放一隻貓。15 張是 AI 一次生出來的。',
    options: [
      {
        id: 'a',
        label: '留最可愛的三張',
        detail: '先按「可愛」排，砍掉難看的',
      },
      {
        id: 'b',
        label: '留最簡單的三張',
        detail: '因為書頁要能印，細節多的會糊',
      },
      {
        id: 'c',
        label: '留最好畫的三張',
        detail: '因為之後要能延伸成其他頁',
      },
    ],
    reveal:
      '三個都有道理，而且都不夠。真正該問的是：這本書是誰的？5 歲和 9 歲差很多，貓要坐著還是跳起來，睡覺的場景還是玩耍的場景。你答「最可愛」，等於沒有回答任何問題 —— 這正是 AI 給你的東西：它已經把 100 張都畫完了，但沒有一張知道客戶的貓要幹嘛。',
    teaches: '選擇的責任落在人身上。AI 負責出選項，不負責決定哪個對。',
    evidence: {
      label: '設計師怎麼用 AI（2025 → 2026）',
      value: '每週使用 AI：54% → 91%。會用工具的人變多了，工具本身就不再是門檻。',
      source: 'AI in Design 2026 Report',
      url: 'https://stateofaidesign.com/chapters/tools',
    },
  },
  {
    id: 'audit-taste',
    stage: 'audit',
    prompt: '客戶是 5 歲孩子的睡前繪本，貓要躺著。哪 3 張能留？',
    context: '條件變明確了。現在重選一次。',
    options: [
      {
        id: 'a',
        label: '輪廓最清楚的',
        detail: '因為要印在書頁上，會被縮',
      },
      {
        id: 'b',
        label: '毛色最有辨識度的',
        detail: '因為孩子會記住「那隻貓」',
      },
      {
        id: 'c',
        label: '姿態最像睡著的',
        detail: '因為要對到「躺著」這個字',
      },
    ],
    reveal:
      '這次三個選項都對，因為它們分別是排版、記憶點、敘事三種真實考量。差別在於：這三個理由，你只有問到客戶才拿得到。AI 不會替你問「那隻貓要幹嘛」，所以 15 張裡的 3 張，不是 AI 挑的，是有人問完之後挑的。',
    teaches: '把模糊需求問到具體，答案才會浮現。這是 AI 結構上做不到的事。',
  },
  {
    id: 'interview-badbrief',
    stage: 'interview',
    prompt: '需求單只有一句：「幫我畫一隻可愛的貓」',
    context: '你要在 5 分鐘內問出足以動工的資訊。你會先問什麼？',
    options: [
      {
        id: 'a',
        label: '問尺寸和格式',
        detail: '印刷、螢幕、還是影片',
      },
      {
        id: 'b',
        label: '問這隻貓要說什麼',
        detail: '它在什麼情境、旁邊有誰',
      },
      {
        id: 'c',
        label: '問「可愛」是什麼意思',
        detail: '因為「可愛」每個人想的都不一樣',
      },
    ],
    reveal:
      '三個都要問，但順序決定結果。先問「可愛是什麼意思」，你才會知道要問尺寸還是問情境 —— 因為繪本和LINE 貼圖對「可愛」的定義完全不同。如果直接跳到技術問題，你會做出一張技術正確但沒人要的圖。AI 只會照你給的字生成，它不會反問你。',
    teaches: '客戶說的和客戶要的，通常不是同一件事。反問是你的工作。',
    evidence: {
      label: 'AI 產出的是畫面，不是完稿',
      value: '尺寸、出血、刀模、字體、加工資訊這些 AI 不會處理，而這些是甲方的成本。',
      source: '設計業界公開整理',
      url: 'https://www.threads.com/@blodvison13/post/DXcEVEomeOs/',
    },
  },
  {
    id: 'handoff-print',
    stage: 'handoff',
    prompt: '這張 AI 出的圖要印成 A2 海報，還缺什麼？',
    context: '圖很漂亮。老師說可以印了。你覺得呢？',
    options: [
      {
        id: 'a',
        label: '可以直接印',
        detail: '圖片夠漂亮就沒問題',
      },
      {
        id: 'b',
        label: '缺輸出設定',
        detail: '尺寸、解析度、色彩模式',
      },
      {
        id: 'c',
        label: '缺一整段流程',
        detail: '出血、完稿檢查、交付格式、對色',
      },
    ],
    reveal:
      '正確答案是 C。B 只是其中一項。AI 給你的是「畫面」，公司要的是「完稿」：出血、尺寸、色彩模式、完稿檢查、印廠能接收的格式。這個落差就是初級職缺正在消失的原因 —— 公司現在最缺的不是會出圖的人，是會收尾的人。你在學校學的排版、出血、完稿，是別人用 AI 之後還是要付你錢買的東西。',
    teaches: '把畫面變成能用的東西，這一段 AI 接不上。',
    evidence: {
      label: '招募主管在增加哪一級的職缺',
      value: '資深 56%，初級 25%。AI 沒有消滅設計師，它把初級入口關小了一點。',
      source: 'Figma：Why Demand for Designers Is on the Rise',
      url: 'https://www.figma.com/blog/why-demand-for-designers-is-on-the-rise',
    },
  },
  {
    id: 'handoff-rights',
    stage: 'rights',
    prompt: '客戶說：「這張圖很好看，之後我們自己拿去印商品賣。」',
    context: '你要回應什麼？',
    options: [
      {
        id: 'a',
        label: '沒問題，客戶付了錢',
        detail: '產權已經是他的了',
      },
      {
        id: 'b',
        label: '要寫清楚能不能商用',
        detail: '因為你的工具可能不允許',
      },
      {
        id: 'c',
        label: '要寫清楚他可以商用哪些範圍',
        detail: '商品上架還要另外約',
      },
    ],
    reveal:
      'B 和 C 都要，而且順序是先 B 再 C。這一題連的是第一週的契約三行：工具的條款決定你能不能交付，契約決定他能不能賣。第一週寫的那三行字，到今天還是這裡唯一的防線。AI 生成的東西你不會寫提示詞的權利說明，所以這一段只有人做得了。',
    teaches: '能收尾的人，也要能把「能不能用」講清楚。這是無人能代勞的一段。',
    evidence: {
      label: 'Labubu 用來防仿冒的三個識別點',
      value: '九顆牙、桃色面部、腳底的泡泡瑪特標誌 —— 這些是法律資產，不是裝飾。',
      source: '中國保護知識產權網（商務部）',
      url: 'https://ipr.mofcom.gov.cn/article/gjxw/zfxd/mz/202511/1993778.html',
    },
  },
  {
    id: 'audit-defensible',
    stage: 'audit',
    axis: '辨識點',
    prompt: '你的角色要能做成 3 公分的鑰匙圈，縮小後哪一個特徵必須留？',
    context: '實體商品只認得出一兩個特徵。你要自己找出是哪兩個。',
    options: [
      {
        id: 'a',
        label: '臉上的表情',
        detail: '因為情緒是角色的一部分',
      },
      {
        id: 'b',
        label: '一個不變的識別物',
        detail: '因為它不會因為縮小而糊掉',
      },
      {
        id: 'c',
        label: '配色',
        detail: '因為那是最容易被記住的',
      },
    ],
    reveal:
      'Labubu 做成鑰匙圈之後，認得出來的是三件事：九顆牙、桃色臉、腳底標誌。表情在那個尺寸早就沒了。差別是：牙和臉是被「設計成縮小後最清楚」的，不是「本來就最漂亮」。所以找辨識點的方法不是挑你最喜歡的，是挑「縮到最小的時候還在的」。',
    teaches: '辨識點是設計出來的，不是挑出來的。這個能力決定你的角色能不能變成商品。',
    evidence: {
      label: '好角色不會自動變成生意',
      value: '2015 年誕生，2023 年仍只佔營收 5.8%，2024 年才爆紅。中間隔了八年。',
      source: 'BBC 中文：Labubu 走紅背後的營銷爆點、盲盒模式與穀子經濟',
      url: 'https://www.bbc.com/zhongwen/articles/c62dm0y2krjo/trad',
    },
  },
]

export const liveMechanics = [
  {
    title: '先押，投影才動',
    detail:
      '手機上看到題目和選項，投影只顯示比例。收完作答之前投影不會更新，所以你沒有辦法看別人選什麼。',
  },
  {
    title: '三個選項，不要更多',
    detail: '真實人生有十幾個選項，但每回合只有三個。選項太多會癱瘓，先學會在三個之間說清楚理由。',
  },
  {
    title: '你的理由會被投到投影上',
    detail:
      '每回合結束可以投 +1 給某句理由。票最高的那句會被老師放到螢幕上，讓全班回應。理由匿名。',
  },
  {
    title: '少數派有回報',
    detail:
      '只有兩三個人選的選項，如果你押它而理由被引用，會標記「異見成立」。這門課要的常常就是那一兩個選項。',
  },
  {
    title: '投影不排個人名次',
    detail: '你只看得到自己寫了幾句理由、投了幾個讚。全班的排名不會出現在任何地方。',
  },
] as const
