/**
 * W07、W09–W16 各週的工具教學段落，掛在原本的週次主題底下。
 *
 * 這一支只寫學生要讀、要做的內容：為什麼這週需要這個操作、照著做什麼、
 * 做完要留下什麼。上課時間怎麼分配、哪一段由誰帶，是老師的排課問題，
 * 不寫進學生頁面（配比記在 reference/source-audit-w07.md）。
 *
 * 每個新名詞在第一次出現時先解釋，不假設學生看過 notebook、執行階段或節點圖。
 *
 * 數字分三種，頁面必須標清楚：
 *   實測 = 115-1 課堂試點，免費版 T4，pilot/colab-animated-picturebook.ipynb
 *   推算 = 用實測值做的四則運算
 *   文件 = 官方條款或文件，附網址與核對日期
 *   教學建構 = 教學設計參數，非量測（如 180 分鐘分段、成本試算），頁面一律標明
 */

export interface StepShot {
  src: string
  alt: string
  caption: string
  width: number
  height: number
  /** 直幅或局部截圖用，避免被拉成整欄寬 */
  maxWidth?: number
  /** 多格並排的圖用：窄螢幕不壓縮，改成可左右捲動，否則格子小到看不出差異 */
  minWidth?: number
}

export interface ToolStep {
  n: string
  title: string
  action: string
  check: string
  /** 這一步在畫面上長什麼樣，只用真實截圖 */
  shot?: StepShot
  /** 同一步要看兩張對照時用，與 shot 依序顯示 */
  shots?: StepShot[]
}

export interface PromptField {
  /** 畫面需求單上的那一欄 */
  source: string
  /** 提示詞裡要寫成什麼 */
  prompt: string
  /** 漏寫的話，圖上會出現什麼問題 */
  missing: string
}

export interface PromptSegment {
  text: string
  field: string
}

export interface GlossaryGroup {
  field: string
  zh: string
  en: string[]
}

export interface WorkedExample {
  panel: string
  demand: string
  prompt: string
  notes: string[]
}

export interface PromptPair {
  page: string
  image: string
  alt: string
  segments: PromptSegment[]
  observed: string
  tweak: string
  expect: string
}

export interface ToolLesson {
  week: number
  title: string
  intro: string
  /** 需求單欄位 → 提示詞段落的對照，只有第一次接工具的那一週需要 */
  mapping?: PromptField[]
  /** 要不要展開「從分鏡到指令」的組句流程與詞表 */
  recipe?: boolean
  /** 要不要展開真實的指令與產出對照 */
  promptPairs?: boolean
  steps: ToolStep[]
  deliverable: string
  pitfalls?: boolean
  numbers?: boolean
  anatomy?: boolean
  /** 這一週要附條款與授權來源，即使沒有數字表 */
  sources?: boolean
  /** 步驟之後要對照的一張表，例如八頁的實測值 */
  table?: {
    title: string
    kind: string
    intro: string
    columns: string[]
    rows: string[][]
  }
}

export const toolLessons: ToolLesson[] = [
  // ============================================================
  // W07：數位繪圖：AI 生成圖像的視角應用（明天 3 小時上課主頁！）
  // ============================================================
  {
    week: 7,
    title: '用 Google Flow 做同一個角色的四種視角＋3 秒動態初體驗',
    intro:
      '同一個角色、同一套色彩、同一個用途都先鎖住，只做正面、側面、俯視和遠景四張。把四張圖排在一起，看角色的表情、動作和背景資訊怎麼跟著改變。你要指出每個角度讓人先看到什麼，也要指出哪個資訊因此消失。這一週用 Google Flow：瀏覽器開啟即用、影像生成 0 點、原生懂繁體中文提示詞，不必寫英文咒語。核心口訣：「不要寫感受，只寫攝影機拍得到的東西（誰、穿什麼、做什麼動作、站哪裡、光從哪來、用什麼媒材畫）」。',
    mapping: [
      {
        source: '角色基準圖：乾淨素底、正面、三個固定識別點',
        prompt: 'Add ingredients 掛同一張原始基準圖，永遠回頭掛這一張',
        missing: '沒有基準圖，每次生成都會換一張臉，視角切換時根本認不出是同一個人。',
      },
      {
        source: '兩段式繁體中文提示詞：鎖定段＋只改這格',
        prompt: '第一段寫死角色外觀與風格；第二段只寫「視角、動作、景別」',
        missing: '把角色描述寫在每一格，模型每次都重新解讀，五官、髮型、服裝色塊全漂移。',
      },
      {
        source: '視角與景別：遠景／中景／特寫／俯視／仰視',
        prompt: 'wide shot、medium shot、close up、high angle、low angle',
        missing: '只寫「看著角色」，模型預設給平視中景，翻頁節奏與敘事重點全亂。',
      },
      {
        source: '手繪草圖借力：上傳自己的 JPG/PNG 保留構圖',
        prompt: 'Add ingredients → Upload media 選手畫草圖，Flow 30 秒試色與打光',
        missing: '不上傳草圖，構圖全靠模型猜，角色站位、透視關係常常對不上分鏡。',
      },
      {
        source: '動態初體驗：Frames 3 秒 360p = 3 點',
        prompt: '起圖已定，只寫「這 3 秒畫面裡看得到的物理變化」',
        missing: '寫鏡頭移動或畫面外的事，Frames 會重畫整張圖，角色、風格全漂移。',
      },
    ],
    steps: [
      {
        n: '01',
        title: '打開 Google Flow，建立新專案',
        action:
          '瀏覽器開 https://flow.google.com/，用學校 Google 帳號登入。點「New project」，專案名稱寫「W07-視角測試-學號」。左側面板會出現 All media、Characters、Scenes、Library、Tools。這一週只用 All media（放基準圖與草圖）與 Tools（Add ingredients）。',
        check: '專案建立完成，左側面板可見五個分頁，右側是對話輸入區。',
        shot: {
          src: '/illustrations/tutorial-flow/01-flow-new-project.png',
          alt: 'Google Flow 首頁：左側導航欄顯示 All media、Characters、Scenes、Library、Tools，右側中央有「New project」按鈕與歡迎文字。',
          caption: 'Flow 首頁與建立專案。專案名稱建議帶上週次與學號，方便期末交接。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '上傳角色基準圖，設定繁體中文提示詞',
        action:
          '點左側 All media → 「Add ingredients to the prompt box」→「Upload media」上傳你的角色基準圖（乾淨素底、正面、三個固定識別點：輪廓、髮型、服裝色塊）。上傳後它會出現在輸入區上方的 ingredients 列。輸入區先寫第一段（鎖定段）：「暖色紙感、藍色墨線、兒童繪本插畫，一個穿黃色雨衣的小學生，兜帽、短髮、圓框眼鏡，正面站立」。這一段之後完全不動。',
        check:
          'Ingredients 列出現基準圖縮圖；輸入區第一段只寫角色外觀與風格，沒有視角、動作、景別字眼。',
        shot: {
          src: '/illustrations/tutorial-flow/02-flow-zh-sketch-setup.png',
          alt: 'Flow 提示詞設定畫面：ingredients 列掛著一張角色基準圖，輸入區寫著繁體中文鎖定段「暖色紙感、藍色墨線、兒童繪本插畫，一個穿黃色雨衣的小學生，兜帽、短髮、圓框眼鏡，正面站立」。',
          caption:
            '繁體中文提示詞設定畫面。Flow 原生懂繁中，不必翻英文。鎖定段只寫「誰、穿什麼、三個固定識別點、風格」。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '03',
        title: '生成第一張基準圖，對回需求單六欄',
        action:
          '按下生成，等待約 10–15 秒。出圖後，拿需求單六欄逐項核對：角色（五官、髮型、雨衣、眼鏡）、動作（正面站立）、場景（乾淨素底）、景別（中景）、風格（暖色紙感、藍色墨線）、限制（無文字、無浮水印）。哪一欄對不上，就在第二段（只改這格）補那一欄，第一段完全不動。',
        check: '六欄都對得上；對不上的只在第二段補，第一段鎖定段零修改。',
        shot: {
          src: '/illustrations/tutorial-flow/03-flow-zh-sketch-result.png',
          alt: 'Flow 生成結果：黃色雨衣、兜帽、短髮、圓框眼鏡的小學生正面站立，暖色紙質背景，藍色墨線風格，無文字無浮水印。',
          caption: '繁體中文繪本插畫生成結果。這張是後續所有視角的「永遠回頭掛」的原始基準圖。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '04',
        title: '只改第二段，生成遠景／中景／特寫／俯視四張',
        action:
          '保持第一段鎖定段不動。第二段依序換成：\n1. 「wide shot，校門口遠景，雨天灰藍天空」\n2. 「medium shot，校門口鐵門格柵前，仰視看著門」\n3. 「close up，雨滴掛在睫毛與眼鏡框，極特寫」\n4. 「high angle，俯視看著手心的鑰匙，背景是濕漉漉的地面」\n每換一次按生成，四張都留下。ingredients 的基準圖永遠掛著那一張原始基準圖，不換。',
        check:
          '四張並排時，角色五官、髮型、雨衣色塊、眼鏡都認得出是同一個人；只有視角、景別、背景資訊量不同。',
        shot: {
          src: '/illustrations/tutorial-flow/04-flow-consistent-setup.png',
          alt: 'Flow 同角色參考延伸設定：ingredients 仍掛著同一張原始基準圖，輸入區第一段鎖定段不動，第二段寫著「wide shot，校門口遠景，雨天灰藍天空」。',
          caption:
            '同角色參考＋繁中特寫延伸設定。Ingredients 永遠回頭掛同一張原始基準圖；兩段式提示詞：鎖定段＋只改這格。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '05',
        title: '四張視角對照表：指出每個角度先看到什麼、失去什麼',
        action:
          '把四張圖並排，做一張簡單表格：\n| 視角 | 先看到什麼 | 因此失去什麼 |\n| 遠景 | 環境關係、天氣、空間 | 臉部表情、細節動作 |\n| 中景 | 身體語言、手部動作 | 臉部微表情、環境遠景 |\n| 特寫 | 眼神、情緒、雨滴細節 | 全身動作、空間關係 |\n| 俯視 | 手心物品、地面倒影 | 臉部、身體姿態 |\n寫下你為分鏡這一格會選哪一個視角、理由是什麼。',
        check: '表格四行填滿，且有選定視角與一行理由。',
      },
      {
        n: '06',
        title: '手繪草圖借力：上傳自己的草圖 JPG/PNG，保留構圖讓 AI 試色打光',
        action:
          '在電腦教室，點「Add ingredients to the prompt box」→「Upload media」選自己手畫的草圖（手機拍照或掃描的 JPG/PNG 皆可）。草圖不用精細，只要構圖大致對：角色站哪、消失點在哪、前中後景關係。上傳後，輸入區第二段寫：「依草圖構圖，暖色下午光、藍色墨線、兒童繪本插畫」。按生成，約 30 秒得到試色打光參考圖。你不用這張圖當成品，只借色票、光影位置、構圖確認，線條與角色自己畫。',
        check:
          '得到一張保留草圖構圖、已上色打光的參考圖；紀錄上寫一行：借了色票與光影、沒借線條與角色、為什麼。',
        shot: {
          src: '/illustrations/flow-pilot/02-flow-sketch-setup.png',
          alt: 'Flow 草圖轉圖設定：ingredients 列掛著一張手繪草圖，輸入區寫著「依草圖構圖，暖色下午光、藍色墨線、兒童繪本插畫」。',
          caption:
            '手繪草圖怎麼上傳借力。點 Add ingredients → Upload media 選手畫草圖，Flow 30 秒試色與打光，構圖保留。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '07',
        title: 'Frames 3 秒動態初體驗：只寫起圖裡看得到的物理變化',
        action:
          '挑第 04 步生成的其中一張（建議用中景或特寫）當起圖。點進 Frames，上傳起圖。提示詞只寫「這 3 秒畫面裡看得到的物理變化」，例如：\n- 「雨滴從睫毛滑落，臉頰濕潤」\n- 「手心的鑰匙反光隨著手指微動而移動」\n- 「背景鐵門上的雨水順著格柵流下」\n不要寫「鏡頭推近」、「氣氛變緊張」、「淡入淡出」。長度設 3 秒、360p（3 點）。按生成，等待約 30–60 秒。',
        check: '產出 3 秒 360p 影片；角色、風格、構圖不漂移；動作只發生在起圖裡看得到的區塊。',
        shot: {
          src: '/illustrations/flow-pilot/03-flow-sketch-result.png',
          alt: 'Flow 草圖轉圖結果：手繪草圖變成上色完成的插畫，構圖保留，暖色下午光與藍色墨線風格套用完成。',
          caption:
            '草圖轉圖結果。同樣原理套用到 Frames：起圖已定，只寫畫面內的物理變化，3 秒 360p = 3 點。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '08',
        title: '課堂 3 小時（180 分鐘）分階段練習節奏表',
        action:
          '這是教學設計，非實測秒數。實際上課依現場狀況微調。\n\n| 階段 | 分鐘 | 內容 |\n| 00–45 | 45 | 破冰＋基準圖：專案建立、上傳基準圖、鎖定段撰寫、生成基準圖、六欄核對 |\n| 45–55 | 10 | 休息、換邊、喝水 |\n| 55–115 | 60 | 兩段式同角色 2 格連戲：遠景＋中景、中景＋特寫，留 1 張失敗對照（故意把鎖定段改壞） |\n| 115–125 | 10 | 休息 |\n| 125–180 | 55 | Frames 3 秒動態初體驗＋快閃講評：上傳起圖、寫物理變化、生成、全班輪播 3 秒各說一句觀察 |\n\n把自己的節奏實際花費寫在紀錄上，下次上課前先看這一行。',
        check: '紀錄上有四個階段的實際花費分鐘數，以及「下次要改哪一段」的一行。',
        shot: {
          src: '/illustrations/tutorial-flow/05-flow-consistent-result.png',
          alt: 'Flow 同角色延伸結果：四張不同視角（遠景、中景、特寫、俯視）並排，角色五官、髮型、雨衣、眼鏡完全一致，只有視角與背景資訊量不同。',
          caption:
            '四視角對照結果。角色識別點零漂移，只有視角與景別改變。失敗對照請故意改壞鎖定段自行觀察。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
    ],
    deliverable:
      '控制變因表（四視角先看到什麼、失去什麼）、四張同角色不同視角對照、一張失敗對照、一支 3 秒 360p Frames 影片、手繪草圖借力紀錄一行、課堂節奏實際花費紀錄。',
    pitfalls: true,
    sources: true,
    table: {
      title: 'W07 課堂 180 分鐘分階段節奏（教學設計，非實測）',
      kind: '教學建構',
      intro:
        '實際上課依現場狀況微調；此表供課前預習與課後複盤參考。休息時間含換邊、喝水、處理帳號登入等雜項。',
      columns: ['階段', '分鐘', '內容', '關鍵檢查點'],
      rows: [
        [
          '00–45',
          '45',
          '破冰＋基準圖：專案建立、上傳基準圖、鎖定段撰寫、生成基準圖、六欄核對',
          '六欄全對、ingredients 掛基準圖',
        ],
        ['45–55', '10', '休息、換邊、喝水', '—'],
        [
          '55–115',
          '60',
          '兩段式同角色 2 格連戲：遠景＋中景、中景＋特寫，留 1 張失敗對照',
          '四視角角色零漂移、失敗對照有圖',
        ],
        ['115–125', '10', '休息', '—'],
        [
          '125–180',
          '55',
          'Frames 3 秒動態初體驗＋快閃講評',
          '3 秒 360p 影片、角色風格不漂移、全班輪播',
        ],
      ],
    },
  },

  // ============================================================
  // W09：故事腳本分鏡（回扣需求單，第 3 層描繪，Flow 0 點快速試 1 格）
  // ============================================================
  {
    week: 9,
    title: '用 Google Flow 把分鏡第一格生成出來，對回需求單',
    intro:
      '拿到故事和分鏡後，先逐格圈出角色、動作、道具、場景和不能改的資訊。再把每一格改寫成一張畫面需求單，讓做圖的人一眼知道主體在哪裡、正在做什麼、哪個細節不能被模型改掉。這一週教「第 3 層描繪：動作與敘事（具體動詞＋方向＋視線落點）」，用 Google Flow 0 點影像快速試 1 格分鏡氣氛。Flow 原生懂繁體中文，不必寫英文咒語。核心口訣：「不要寫感受，只寫攝影機拍得到的東西（誰、穿什麼、做什麼動作、站哪裡、光從哪來、用什麼媒材畫）」。',
    mapping: [
      {
        source: '角色：是誰，哪幾個特徵不能換（輪廓、髮型、服裝色塊、配件）',
        prompt: '主體加上固定特徵：一個穿黃色雨衣的小學生，兜帽、短髮、圓框眼鏡',
        missing: '每張圖換一張臉，下一頁就認不出是同一個角色。',
      },
      {
        source: '動作：這一格發生什麼事（具體動詞＋方向＋視線落點）',
        prompt: '動詞與方向：蹲在校門口、抬頭看雨、視線落在鐵門格柵',
        missing: '圖很漂亮但沒有事件，下一格不知道要接什麼。',
      },
      {
        source: '場景與道具：人站在哪裡、旁邊有什麼、前中後景關係',
        prompt: '位置關係：前景有濕地面倒影、角色站在鐵門側、遠景是灰藍天空',
        missing: '模型自己補背景，跨頁的空間不連戲。',
      },
      {
        source: '構圖：人看到什麼、先看到誰（景別、視角、主體位置）',
        prompt: '景別、視角：medium shot、eye level、主體置中偏左、三分法',
        missing: '每格遠近不一致，翻頁的節奏亂掉。',
      },
      {
        source: '風格：線條、紙感、顏色調子（八頁共用同一組）',
        prompt: '八頁共用同一組風格詞：暖色紙感、藍色墨線、淡彩、冷色調',
        missing: '漏一頁就長出另一種畫法，翻頁時看得出不是同一本書。',
      },
      {
        source: '用途與限制：印在哪、不能出現什麼（留白、無文字）',
        prompt: '尺寸、留白：上方留白給文字、不要文字、不要浮水印、方形稿',
        missing: '印出來被裁掉，或畫面出現不該有的字。',
      },
    ],
    steps: [
      {
        n: '01',
        title: '打開 Google Flow，建立/開啟專案',
        action:
          '瀏覽器開 https://flow.google.com/，用學校 Google 帳號登入。開啟既有專案或新建「W09-分鏡需求單-學號」。左側 All media 準備放基準圖。',
        check: '專案開啟，左側面板五個分頁可見，右側對話輸入區準備好。',
        shot: {
          src: '/illustrations/flow-pilot/01-flow-home.png',
          alt: 'Flow 首頁：左側導航欄顯示 All media、Characters、Scenes、Library、Tools，右側顯示專案列表與歡迎文字。',
          caption: 'Flow 首頁與帳號。專案名稱帶上週次與學號，方便期末交接。',
          width: 2860,
          height: 1386,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '上傳角色基準圖，寫入鎖定段（第一段）',
        action:
          '點 All media → Add ingredients → Upload media 上傳角色基準圖（乾淨素底、正面、三個固定識別點）。輸入區第一段寫死：「暖色紙感、藍色墨線、兒童繪本插畫，一個穿黃色雨衣的小學生，兜帽、短髮、圓框眼鏡」。這一段之後完全不動，八頁共用。',
        check: 'Ingredients 掛基準圖；第一段只寫角色外觀與風格，無視角、動作、景別。',
      },
      {
        n: '03',
        title: '第二段寫入分鏡第一格的「動作與敘事」（第 3 層描繪）',
        action:
          '輸入區第二段只寫這一格的具體動作：「蹲在校門口、抬頭看雨、視線落在鐵門格柵、medium shot、eye level」。按生成，約 10–15 秒出圖。',
        check:
          '出圖後對回需求單六欄：角色、動作、場景、景別、風格、限制。哪一欄對不上，只在第二段補那一欄。',
        shot: {
          src: '/illustrations/flow-pilot/03-flow-sketch-result.png',
          alt: 'Flow 生成結果：黃色雨衣小學生蹲在校門口，抬頭看雨，視線落在鐵門格柵，中景、平視，暖色紙感、藍色墨線風格。',
          caption:
            '分鏡第一格生成結果。第 3 層描繪：具體動詞＋方向＋視線落點。Flow 0 點快速試氣氛。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '04',
        title: '把這一格寫成畫面需求單，存入專案備忘',
        action:
          '把六欄核對結果寫成一行需求單：「角色：小藍/黃雨衣/兜帽/短髮/圓框眼鏡｜動作：蹲/抬頭/視線落鐵門｜場景：校門口/濕地面/灰藍天｜景別：medium shot/eye level｜風格：暖紙/藍墨/淡彩/冷調｜限制：上方留白/無文字」。存在 Flow 專案的備忘或本地筆記，後續八頁都用這張單。',
        check: '需求單六欄齊全，存檔可追蹤。',
      },
    ],
    deliverable: '腳本、分鏡條件、AI 圖像需求清單（八格需求單）、第一格生成圖與核對紀錄。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W10：故事腳本分鏡的鏡頭語言（延續 Flow 同角色基準圖，只改景別與視角）
  // ============================================================
  {
    week: 10,
    title: '用 Google Flow 鎖定角色與場景，只改景別與視角對照資訊增減',
    intro:
      '把景別、角度、方向和角色關係寫進畫面說明。先做一張最接近分鏡的版本，再只改景別或視角其中一項。比較時要說清楚：故事中的動作還在不在，觀者的視線有沒有被你帶到別的地方。這一週延續 W09 的 Flow 同角色基準圖，鎖定角色與場景只改景別與視角（遠景／中景／特寫／俯仰角），對照資訊增減。',
    mapping: [
      {
        source: '景別：遠景、中景、特寫、極特寫',
        prompt: 'wide shot、medium shot、close up、extreme close up',
        missing: '只寫「看著角色」，模型預設給中景，遠景環境關係與特寫微表情全沒有。',
      },
      {
        source: '視角：平視、俯視、仰視、POV',
        prompt: 'eye level、high angle、low angle、POV',
        missing: '平視無法表現壓迫感或無力感，敘事張力遺失。',
      },
      {
        source: '角色關係：雙人同框時的大小、視線、距離',
        prompt: 'two-shot、over-the-shoulder、face-to-face、back-to-back',
        missing: '兩人關係變成並列，劇情張力消失。',
      },
    ],
    steps: [
      {
        n: '01',
        title: '開啟 W09 專案，確認基準圖與鎖定段仍在',
        action:
          '打開 https://flow.google.com/ 專案「W09-分鏡需求單-學號」。Ingredients 列應仍掛著角色基準圖，輸入區第一段鎖定段未動。',
        check: '基準圖在、鎖定段未改。',
        shot: {
          src: '/illustrations/flow-pilot/01-flow-home.png',
          alt: 'Flow 專案頁面：左側 All media 顯示專案列表，ingredients 區掛著角色基準圖。',
          caption: '延續 W09 專案，基準圖與鎖定段完整保留。',
          width: 2860,
          height: 1386,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '第二段只改景別，生成遠景／中景／特寫三張',
        action:
          '保持第一段鎖定段不動。第二段依序換成：\n1. 「wide shot，校門口全景，雨天灰藍天空，角色在畫面側小小一個」\n2. 「medium shot，校門口鐵門前，角色蹲著抬頭」\n3. 「close up，雨滴掛在睫毛與眼鏡框，極特寫」\n每換一次按生成，三張都留下。',
        check:
          '三張並排：角色零漂移，只有景別不同。做表格記錄每種景別「多了什麼資訊、少了什麼資訊」。',
        shot: {
          src: '/illustrations/tutorial-flow/04-flow-consistent-setup.png',
          alt: 'Flow 同角色延伸設定：ingredients 掛基準圖，第一段鎖定段不動，第二段寫景別變化。',
          caption: '鎖定角色與場景，只改景別。Ingredients 永遠回頭掛同一張基準圖。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '03',
        title: '第二段只改視角，生成平視／俯視／仰視三張',
        action:
          '保持第一段鎖定段、第二段景別固定（建議用 medium shot）。只在第二段加視角詞：\n1. 「eye level，平視看著角色臉」\n2. 「high angle，俯視看著手心鑰匙」\n3. 「low angle，仰視看著鐵門頂端與天空」\n每換一次按生成，三張留下。',
        check:
          '三張並排：角色零漂移，只有視角不同。記錄每種視角「觀者視線被帶到哪裡、什麼關係被強化/削弱」。',
      },
      {
        n: '04',
        title: '鏡頭註記與畫面說明對照表',
        action:
          '把六張圖（三景別＋三視角）做成對照表，每張寫：\n- 分鏡格號\n- 景別/視角詞\n- 多出的資訊\n- 遺失的資訊\n- 這一格分鏡該用哪一個、理由\n挑一組交給故事與分鏡老師，標出不能被改掉的地方。',
        check: '對照表六行填滿，有選定組合與理由。',
      },
    ],
    deliverable: '鏡頭註記與畫面說明對照表（六張圖）、選定的景別/視角組合與一行理由。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W11：專題腳本分鏡練習-1（第 4 層描繪：畫風語法，Flow Ingredients 跑 4 格連戲）
  // ============================================================
  {
    week: 11,
    title: '用 Google Flow 跑 4 格連戲候選，建立畫風語法與角色卡',
    intro:
      '教「第 4 層描繪：畫風語法（媒材紙感＋線條＋光影＋色彩基調，禁報活著的插畫家名字）」。用 Flow Ingredients 跑 4 格連戲候選，並誠實記錄哪一格漂移。Flow 影像 0 點，適合大量試錯。畫風語法要寫可觀測的屬性：線條（粗細、筆觸）、形狀（幾何感、有機感）、調色盤（主色、輔助色）、材質（紙感、水彩邊緣、墨線滲透）、空間（平面裝飾、大氣透視）、構圖（三分法、對稱、對角）、字體（如有文字）、預期用途。',
    mapping: [
      {
        source: '媒材與紙感：水彩、墨線、鉛筆、蠟筆、數位平塗',
        prompt: 'warm paper texture、medium blue ink linework、pale wash、dry brush texture',
        missing: '沒寫媒材，模型預設給寫實照片感，跟繪本風格完全脫節。',
      },
      {
        source: '線條：粗細、筆觸、邊緣處理',
        prompt: 'confident ink lines、variable line weight、soft edges、ink bleed',
        missing: '線條太整齊像向量圖、或太亂像草稿，不是手繪墨線感。',
      },
      {
        source: '光影：光源方向、陰影類型、反光',
        prompt: 'top-down lighting、soft shadows、rim light、subsurface scattering',
        missing: '無光源感、平面化，或光源亂跳導致跨頁不連戲。',
      },
      {
        source: '色彩基調：主色、輔助色、溫冷對比、飽和度',
        prompt:
          'muted palette、cool tones with warm accents、limited palette、yellow-blue contrast',
        missing: '色彩繽紛像兒童塗鴉書，不是連貫敘事的畫冊調性。',
      },
    ],
    steps: [
      {
        n: '01',
        title: '開啟既有專案，確認基準圖與鎖定段',
        action:
          '打開 Flow 專案，ingredients 掛基準圖，第一段鎖定段含角色外觀與「暖色紙感、藍色墨線、淡彩、冷色調」等畫風詞。這一週把畫風詞細化為可觀測四項：媒材紙感、線條、光影、色彩基調。',
        check: '基準圖在、鎖定段含四項畫風可觀測屬性。',
      },
      {
        n: '02',
        title: '第二段寫入四格連戲的動作序列，跑 4 張候選',
        action:
          '第二段依序寫四格動作（景別固定 medium shot）：\n1. 「蹲在校門口、抬頭看雨、視線落鐵門」\n2. 「伸手接雨滴、掌心向上、微笑」\n3. 「站起、轉身、雨傘從旁邊遞過來」\n4. 「撐傘走向校舍、背影、雨中剪影」\n每格按生成，四張都留下。Ingredients 基準圖全程掛著同一張。',
        check:
          '四張並排：角色識別點（輪廓、髮型、雨衣色塊、眼鏡）零漂移。哪一格漂移，圈出來寫在紀錄上。',
        shot: {
          src: '/illustrations/tutorial-flow/05-flow-consistent-result.png',
          alt: 'Flow 4 格連戲結果：四張不同動作但同角色、同風格、同場景並排，角色五官、髮型、雨衣、眼鏡完全一致。',
          caption: 'Flow Ingredients 跑 4 格連戲候選。角色零漂移；若有漂移請誠實圈出並記錄。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '03',
        title: '建立角色卡六項：輪廓、頭身比、色票、配件、動作記憶點、禁用條件',
        action:
          '從最穩定的那一張基準圖取色碼（滴管工具），寫成角色卡：\n- 輪廓：圓臉、短髮、兜帽輪廓\n- 頭身比：5.5 頭身\n- 色票：#FFD600（雨衣黃）、#3A5BA0（墨線藍）、#F5F0E1（紙暖白）、#4A4A4A（髮色深灰）、#E8D5B7（膚色）\n- 配件：圓框眼鏡、鑰匙鍊\n- 動作記憶點：蹲著抬頭看雨\n- 禁用條件：無文字、無浮水印、無寫實膚質、無向量平塗\n存入專案備忘。',
        check: '角色卡六項齊全，色票為實測色碼非形容詞。',
      },
      {
        n: '04',
        title: '誠實記錄：哪一格漂移、漂移了什麼',
        action:
          '四格候選中若有漂移，在紀錄上寫：第幾格、哪一項漂移（五官、髮型、色塊、眼鏡）、疑似原因（動作詞太長干擾畫風、景別隱含改變構圖）。這筆紀錄是下一週修正的線索。',
        check: '紀錄有「無漂移」或具體漂移格號與項目。',
      },
    ],
    deliverable: '角色卡（六項）、四格連戲候選圖、漂移誠實紀錄、一行「下週要修正哪一格的什麼」 。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W12：專題腳本分鏡練習-2（Comfy Cloud 1 堂精準控圖體驗課）
  // ============================================================
  {
    week: 12,
    title: 'Comfy Cloud 精準控圖體驗：對話黑箱 vs. 節點可控產線',
    intro:
      '這一週是 Comfy Cloud 1 堂精準體驗課！說明每位學生「各自用個人 Google 帳號免費註冊 cloud.comfy.org」（每人各自有 5 次免費運行配額，絕非全班共用！），點開老師的分享連結 https://cloud.comfy.org/?share=2999a427439a，只改提示詞與固定種子跑 1–2 次輕量 2D 生圖（絕不跑影片），讓學生親手體會「對話黑箱 vs. 節點可控產線」的差別。Comfy Cloud 免費層每帳號 5 次運行，課堂 30 人各自註冊各自跑，互不影響。',
    steps: [
      {
        n: '01',
        title: '各自註冊 Comfy Cloud 免費帳號，開啟分享連結',
        action:
          '瀏覽器開 https://cloud.comfy.org/，用「個人 Google 帳號」註冊/登入（不是共用帳號！）。登入後點開老師的分享連結 https://cloud.comfy.org/?share=2999a427439a，畫布會自動載入 Z-Image-Turbo 範本工作流（7 個節點：載入檢查點、CLIP 文字編碼正向/負向、空白潛在影像、KSampler、VAE 解碼、儲存圖片）。右上角會顯示「剩餘 4 / 5 次運行」或「剩餘 5 / 5 次運行」。',
        check: '分享工作流載入完成，右上角顯示免費層剩餘運行次數。',
        shot: {
          src: '/illustrations/comfy-cloud-pilot/01-comfycloud-home.png',
          alt: 'Comfy Cloud 首頁與工作流畫布：左側節點選單，中間畫布排著 7 個節點（載入檢查點、兩個 CLIP 文字編碼、空白潛在影像、KSampler、VAE 解碼、儲存圖片），右上角顯示執行按鈕與作業佇列。',
          caption:
            'Comfy Cloud 首頁與畫布。分享連結載入後即得 Z-Image-Turbo 範本，7 個節點完整可見。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '確認免費層配額，認清節點結構',
        action:
          '右上角確認「剩餘 X / 5 次運行」。認清 7 個節點：\n1. 載入檢查點：模型 Comfy-Org/z_image_turbo（已固定）\n2. CLIP 文字編碼（正向）：prompt 欄位——這是你要改的地方\n3. CLIP 文字編碼（負向）：low quality, blurry, watermark, text, signature（不動）\n4. 空白潛在影像：width 1024、height 1024、batch size 1（不動）\n5. KSampler：seed 固定、steps 8、cfg、sampler、scheduler（種子固定、其餘不動）\n6. VAE 解碼\n7. 儲存圖片：filename_prefix\n這就是「節點可控產線」：每個環節看得見、改得動、可重現。',
        check: '能指出哪個節點是 prompt、哪個是 seed、哪個是解析度。',
        shot: {
          src: '/illustrations/comfy-cloud-pilot/02-comfycloud-credits.png',
          alt: 'Comfy Cloud 免費層餘額：右上角顯示「剩餘 4 / 5 次運行」，升級按鈕旁。',
          caption: '免費帳號剩餘 4/5 次運行畫面。每位學生各自帳號各自 5 次，絕非全班共用。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '03',
        title: '只改 prompt 與固定 seed，跑 1–2 次輕量 2D 生圖',
        action:
          '點 CLIP 文字編碼（正向）節點，prompt 欄位改成：\n「warm paper texture, medium blue ink linework, pale sky, a child in a yellow raincoat, hood up, short hair, round glasses, standing at school gate, medium shot, no text」\nKSampler 節點：seed 填 889848477211015（或任一固定號碼），生成後控制設 fixed。點右上角「執行」，等待約 15–30 秒。作業佇列出現縮圖，點開看大圖。若要跑第 2 次，只改 prompt 的動作或景別詞，seed 不動，再按執行。',
        check: '跑出 1–2 張圖，角色、風格、構圖穩定；作業佇列顯示剩餘次數遞減。',
        shot: {
          src: '/illustrations/comfy-cloud-pilot/04-comfycloud-result.png',
          alt: 'Comfy Cloud 輕量 2D 生成結果：黃色雨衣小學生站在校門口，暖色紙感、藍色墨線、淡彩風格，1024x1024 解析度。',
          caption: '輕量 2D 生成結果。只改 prompt 與固定 seed，1024×1024、8 步，約 15–30 秒。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '04',
        title: '對話黑箱 vs. 節點可控產線：寫下你的觀察',
        action:
          '在紀錄上對照兩種體驗：\n| 維度 | Google Flow（對話黑箱） | Comfy Cloud（節點可控產線） |\n| 種子控制 | 看不見、改不動 | 看得見、固定 seed、可重現同一張 |\n| 參數微調 | 只能靠自然語言描述 | 每個節點參數獨立可調 |\n| 失敗排查 | 不知道哪裡錯 | 紅框標出哪個節點出錯 |\n| 分享交接 | 專案連結（需登入） | 分享連結 https://cloud.comfy.org/?share=... 任何人可開 |\n| 免費配額 | 影像 0 點 | 5 次運行/帳號/重置週期 |\n寫一行：哪種情境適合用哪一種、為什麼。',
        check: '對照表填滿，有選擇理由。',
        shot: {
          src: '/illustrations/comfy-cloud-pilot/05-comfycloud-share.png',
          alt: 'Comfy Cloud 分享工作流程視窗：顯示「建立連結」、「擁有此連結的任何人都可以檢視並使用此工作流程」，分享網址 https://cloud.comfy.org/?share=2999a427439a。',
          caption: '分享工作流程視窗。免費帳號可產生「任何人可檢視並使用」的連結，分享網址固定。',
          width: 2860,
          height: 1386,
          minWidth: 640,
        },
      },
    ],
    deliverable: '1–2 張 Comfy Cloud 生成圖、節點可控產線對照表、一行選擇理由、分享連結驗證截圖。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W13：版面編排與角色設定（第 5 層描繪：版面重心與留白區，Flow 測試構圖比例）
  // ============================================================
  {
    week: 13,
    title: '用 Google Flow 測試不同構圖比例與縮到 3 公分寬辨識度，完成視覺規則卡',
    intro:
      '教「第 5 層描繪：版面重心與留白區」。用 Flow 測試不同構圖比例（16:9、4:3、1:1、直式 3:4）與縮到 3 公分寬辨識度，完成一頁視覺規則卡。Flow 影像 0 點，適合大量試錯。視覺規則卡要含：已試過的最小尺寸、要維持的比例、角色色票、禁用條件（從分鏡來）。',
    steps: [
      {
        n: '01',
        title: '開啟既有專案，準備四種版面比例測試',
        action:
          '打開 Flow 專案，ingredients 掛基準圖，第一段鎖定段含角色外觀與完整畫風語法。第二段準備四組構圖詞：\n1. 「16:9 wide shot，角色置中偏左，上方留白 1/3」\n2. 「4:3 horizontal，角色置中，上方留白 1/4」\n3. 「1:1 square，角色置中偏下，四周等距留白」\n4. 「3:4 vertical，角色置中偏上，下方留白 1/3」\n每組按生成，四張留下。',
        check: '四張不同比例並排，角色零漂移。',
        shot: {
          src: '/illustrations/tutorial-flow/01-flow-new-project.png',
          alt: 'Flow 專案建立畫面，準備測試四種版面比例。',
          caption: 'Flow 專案準備測試四種版面比例。Ingredients 基準圖全程掛載。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '縮到 3 公分寬看：還認不認得出角色、動作',
        action:
          '用任何看圖軟體把四張縮到 3 公分寬並排（螢幕上約 85–90 px 寬），拿遠一點看：還認不認得出是同一個角色、同一格動作。認不出來的那一項（臉部特徵、雨衣色塊、眼鏡），就是下一輪要放大的特徵。在紀錄上寫下每種比例的「3 公分測試結果」。',
        check: '四種比例都有 3 公分測試紀錄，標出哪種比例最穩。',
      },
      {
        n: '03',
        title: '放進真的 A4 版面看一次',
        action:
          '開一份 A4 文件（Word、Google Docs、InDesign 皆可），把四張圖分別貼在上半頁、下半頁、滿版、欄位內各看一次；能印出來更好。寫下一個位置的差別：哪一版先看到角色、哪一版先看到背景、留白區是否足夠放標題與頁碼。',
        check: 'A4 版面實測紀錄一行。',
      },
      {
        n: '04',
        title: '寫成一頁視覺規則卡',
        action:
          '把前三步真的看到的收成一頁：\n- 已試過的最小尺寸：3 公分寬（約 85 px）\n- 要維持的比例：16:9 與 3:4 兩種最穩\n- 角色色票：#FFD600、#3A5BA0、#F5F0E1、#4A4A4A、#E8D5B7\n- 禁用條件：無文字、無浮水印、無寫實膚質、上方留白 ≥ 1/4 版面、角色眼鏡不可漂移\n沒測到的不要寫進去。拿這一頁去判 W11 的候選圖，寫下過或不過、理由。',
        check: '視覺規則卡一頁，含四項內容；能用它判斷 W11 候選圖。',
      },
    ],
    deliverable:
      '一頁視覺規則表（最小尺寸、比例、色票、禁用條件）、四種比例測試圖、3 公分測試紀錄、A4 版面實測紀錄。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W14：場景設計與消失點應用（第 6 層描繪：空間深度＋微動態，純手繪同學直進 Frames）
  // ============================================================
  {
    week: 14,
    title: '用 Google Flow 生成場景測試空間深度，手繪草圖直進 Frames 做動態繪本',
    intro:
      '教「第 6 層描繪：空間深度（前中後景＋手繪簡易透視草圖）與微動態（Frames 3 秒 360p = 3 點，只寫起圖裡看得到的物理變化）」。用 Flow 生成 2 個場景版本，標消失點、地平線、前中後景。同時寫出純手繪同學如何直接拿手繪完稿進 Frames 變動態繪本：手繪首尾兩張 → Frames 補間（3 秒 360p = 3 點） → 手動修掉 AI 補錯的地方。',
    steps: [
      {
        n: '01',
        title: 'Flow 生成兩個場景版本：有消失點 vs. 無消失點',
        action:
          '打開 Flow 專案，ingredients 掛基準圖（或場景基準圖）。第二段分別寫：\n1. 「有消失點：校門口鐵門格柵延伸至地平線、單點透視、前景地面濕漉倒影、中景角色、遠景灰藍天空、wide shot」\n2. 「無消失點：平面裝飾風、校門口平鋪、無地平線、角色貼在畫面上、wide shot」\n各生成一張，並排對照。',
        check:
          '兩張並排：有消失點版本空間關係正確（人物大小、道路收斂、物件距離隨深度變化）；無消失點版本空間扁平。',
        shot: {
          src: '/illustrations/flow-pilot/02-flow-sketch-setup.png',
          alt: 'Flow 草圖轉圖設定：ingredients 掛場景草圖，輸入區寫著單點透視構圖描述。',
          caption:
            'Flow 生成有消失點的場景。手繪簡易透視草圖上傳借力，AI 只負責補天空、材質、小物件。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '02',
        title: '把同一個角色放進兩個不同位置，觀察空間變化',
        action:
          '在有消失點的場景版本上，用 Flow 的編輯功能或重新生成，把角色放在：\n1. 前景：靠近鏡頭、佔畫面 1/3 高、腳下有倒影\n2. 遠景：靠近地平線、佔畫面 1/10 高、腳下無倒影\n觀察人物大小、道路方向、物件距離有沒有跟著空間變化。最後才讓 AI 補天空、材質和小物件，把錯的地方圈出來。',
        check: '前景版角色大、有倒影、腳下地面細節多；遠景版角色小、無倒影、簡化細節。錯誤已圈出。',
      },
      {
        n: '03',
        title: 'Frames 微動態：只寫起圖裡看得到的物理變化',
        action:
          '挑第 01 步有消失點的場景版本當起圖。進 Frames，上傳起圖。提示詞只寫物理變化，例如：\n- 「雨滴順著鐵門格柵流下、水面漣漪擴散」\n- 「角色衣服濕潤、布料貼身、髮尖滴水」\n- 「遠景天空雲層緩緩移動、光影掃過地面」\n不要寫鏡頭移動。長度 3 秒、360p（3 點）。生成後檢查：動作只發生在起圖看得到的區塊，角色、構圖、消失點不漂移。',
        check: '3 秒 360p 影片，空間深度不漂移，動作只在畫面內物理變化。',
        shot: {
          src: '/illustrations/flow-pilot/03-flow-sketch-result.png',
          alt: 'Flow 草圖轉圖結果：有消失點的校門口場景，鐵門格柵收斂至地平線，前景濕地面倒影，角色站在中景。',
          caption: '有消失點的場景生成結果。Frames 只寫畫面內物理變化，3 秒 360p = 3 點。',
          width: 2860,
          height: 1272,
          minWidth: 640,
        },
      },
      {
        n: '04',
        title: '純手繪同學：手繪首尾稿 → Frames 補間 → 手動修錯',
        action:
          '不會/不想用 AI 生成場景的同學：\n1. 手繪首張（起始構圖、消失點、前中後景、角色）\n2. 手繪尾張（結束構圖、同一消失點、角色新位置/姿態）\n3. 掃描/拍照上傳 Flow Frames，設定首尾幀\n4. 提示詞寫：「依首尾構圖補間，只動畫面內物理變化：雨滴流動、漣漪、布料晃動、雲層移動」\n5. 生成 3 秒 360p（3 點），下載影片幀\n6. 逐幀檢查：AI 補錯的地方（消失點偏移、角色變臉、多出物件）手動修掉\n7. 紀錄：借了補間幀、沒借構圖與角色、修了幾幀、花多久\n這就是「創作主權留在學生手上；AI 只提供參考與補間，不取代手繪」。',
        check: '手繪首尾稿、Frames 補間影片、修錯前後對照、借力紀錄一行。',
      },
    ],
    deliverable:
      '空間條件表（消失點、地平線、前中後景）、兩種場景版本、Frames 3 秒微動態影片、純手繪路線首尾稿與修錯紀錄。',
    pitfalls: true,
    sources: true,
  },

  // ============================================================
  // W15：期末專題設定與草圖發想討論（期末三軌自由選提案與成本估算）
  // ============================================================
  {
    week: 15,
    title: '期末三軌自由選提案：用 Flow 成本表自己算清 8 頁動態繪本要花幾點',
    intro:
      '把期末想做的 IP 放到一張桌上檢查：誰會先看到它、它會出現在什麼媒材、需要幾個角色和場景、哪些素材找得到、時間和額度夠不夠。這一週用 Flow 成本表（Nano Banana 影像 0 點；Omni 1.2 Flash 3 秒 360p = 3 點、720p = 9 點；Veo 3.1 Lite 8 秒 = 10 點）讓學生自己算清 8 頁動態繪本要花幾點。期末「三軌自由選」：路線 1 純手繪借力派 / 路線 2 敘事導演派 / 路線 3 管線玩家派。',
    mapping: [
      {
        source: '路線 1：純手繪借力派',
        prompt:
          '手繪原稿 ≥ 8 頁；AI 借力紀錄 ≥ 3 筆（借了什麼、沒借什麼、為什麼）；動態頁用 Frames 補間者附首尾手繪稿',
        missing: '沒有借力紀錄，就變成純手繪但沒證明 AI 沒介入；有 AI 卻不紀錄，權利揭露不全。',
      },
      {
        source: '路線 2：敘事導演派',
        prompt: 'Flow 生成 ≥ 8 頁；角色識別點 ≥ 3 項；鏡頭條件標註完整；至少 1 頁用 Frames 做動態',
        missing: '角色識別點不足、鏡頭條件缺漏，外包給別人就跑不出同一本書。',
      },
      {
        source: '路線 3：管線玩家派',
        prompt: 'Colab / ComfyUI 完整管線；workflow JSON 存檔；計時紀錄 ≥ 8 頁；失敗分類 ≥ 3 類',
        missing: '沒存 workflow、沒計時、沒分類失敗，別人拿到檔案根本跑不起來。',
      },
    ],
    steps: [
      {
        n: '01',
        title: '列出三軌規格，對照自己組的狀況',
        action:
          '把三軌規格寫在白板或共筆：\n| 軌道 | 核心規格 | 交付物 |\n| 純手繪借力派 | 手繪 ≥ 8 頁、AI 借力 ≥ 3 筆紀錄 | 原稿掃描、借力紀錄、來源/權利清單 |\n| 敘事導演派 | Flow ≥ 8 頁、識別點 ≥ 3、鏡頭標註完整、≥1 頁 Frames | Flow 專案連結、版本紀錄、提示詞對照表 |\n| 管線玩家派 | Colab/ComfyUI 管線、workflow JSON、計時表、失敗分類 ≥ 3 | workflow JSON、計時表、失敗分類表、來源/權利清單 |\n小組討論：我們現在有什麼、缺什麼、哪一軌最順手。',
        check: '小組共識選定一軌，寫下理由。',
      },
      {
        n: '02',
        title: '用 Flow 成本表算清楚 8 頁動態繪本點數',
        action:
          'Flow 成本表（2026-11-24 查核）：\n- Nano Banana 影像：0 點\n- Omni 1.2 Flash：3 秒 360p = 3 點、3 秒 720p = 9 點、8 秒 360p = 8 點、8 秒 720p = 24 點\n- Veo 3.1 Lite：8 秒 = 10 點\n- 影片放大：720p/1080p 1–10 秒免費\n\n試算三種方案：\nA. 全靜態：8 頁 × 0 點 = 0 點（純手繪借力派基準）\nB. 1 頁動態（3 秒 360p）+ 7 頁靜態：3 + 0 = 3 點\nC. 4 頁動態（3 秒 360p）+ 4 頁靜態：12 + 0 = 12 點\nD. 8 頁動態（3 秒 360p）：24 點\nE. 8 頁動態（8 秒 720p Omni）：192 點\nF. 1 頁 Veo 3.1 Lite 8 秒 + 7 頁靜態：10 + 0 = 10 點\n\n在提案裡寫：我們選方案 X，預計花 Y 點，帳號現有點數 Z，缺口怎麼補（免費額度、分工、減頁數、降解析度）。',
        check: '提案含方案選擇、點數試算、現有點數、缺口對策。',
      },
      {
        n: '03',
        title: '完成期末 IP 提案與製作路線單',
        action:
          '提案單含：\n1. IP 名稱、核心概念、目標受眾\n2. 選定軌道與理由\n3. 角色數、場景數、頁數、動態頁數\n4. Flow/Comfy Cloud/Colab 點數試算與缺口對策\n5. 時程：剩幾週、每週要完成什麼、Buffer 幾天\n6. 權利與來源：用過的模型、工具、授權條款、查核日期\n7. 最小可交付版本（MVP）：先做哪 3 頁、哪 1 頁動態\n最小版本畫出來，讓小組知道先完成什麼、哪些想法留到下一輪。',
        check: '提案單七項齊全，有 MVP 明確範圍。',
      },
    ],
    deliverable:
      '作品檢查表、三軌選擇理由、點數試算表、期末 IP 提案單（含 MVP）、來源/權利清單草稿。',
    pitfalls: true,
    sources: true,
    table: {
      title: 'Flow 成本試算表（2026-11-24 查核，教學建構）',
      kind: '教學建構',
      intro:
        '點數與價格以 2026-11-24 查核為準，實際使用前請再次確認官方頁面。方案為教學設計範例，非實測總成本。',
      columns: [
        '方案',
        '靜態頁 (0點)',
        '動態頁 (3秒360p=3點)',
        '動態頁 (8秒720p=24點)',
        'Veo 3.1 Lite (8秒=10點)',
        '總點數',
        '適合軌道',
      ],
      rows: [
        ['A. 全靜態', '8', '0', '0', '0', '0', '純手繪借力派'],
        ['B. 1動態+7靜態', '7', '1', '0', '0', '3', '敘事導演派(保守)'],
        ['C. 4動態+4靜態', '4', '4', '0', '0', '12', '敘事導演派(標準)'],
        ['D. 8動態(3秒360p)', '0', '8', '0', '0', '24', '敘事導演派(積極)'],
        ['E. 8動態(8秒720p)', '0', '0', '8', '0', '192', '管線玩家派(高畫質)'],
        ['F. 1 Veo + 7靜態', '7', '0', '0', '1', '10', '敘事導演派(長鏡頭)'],
      ],
    },
  },

  // ============================================================
  // W16：期末專題發表（統一交付與評分規準，不偏袒任何單一工具）
  // ============================================================
  {
    week: 16,
    title: '期末專題發表：統一交付包與五項評分規準，工具中立',
    intro:
      '發表時把最後作品、一次失敗版本和中間的比較放在一起。你要指出改了哪個變因、畫面哪裡因此改變、為什麼留下這一版，還有下一個人拿到檔案後要先知道什麼。AI 使用、參考來源和權利範圍也一起放進交接包。統一評分規準五項（識別度、一致性、敘事、可重現、權利與來源揭露），不偏袒任何單一工具。三軌同台評分。',
    steps: [
      {
        n: '01',
        title: '整理統一交接包清單',
        action:
          '不管哪一軌，交接包都要含：\n1. 最終成品（圖檔/影片/掃描檔，檔名含頁碼版本）\n2. 一次失敗版本 + 前後對照 + 改了哪個變因 + 為什麼留下這版\n3. 角色卡（六項）、視覺規則卡、空間條件表\n4. 工具與參數紀錄：\n   - 敘事導演派：Flow 專案連結、提示詞對照表、版本紀錄\n   - 管線玩家派：workflow JSON、計時表、失敗分類表、notebook 連結\n   - 純手繪借力派：借力紀錄（≥3 筆，借了什麼/沒借什麼/為什麼）\n5. 模型清單與授權：檔名、來源網址、授權名稱、不可做的事\n6. 點數/時間/配額實際花費\n7. 來源/權利清單：每一筆素材的來源、授權、用途、查核日期',
        check: '七項清單齊全，檔案命名可追蹤。',
      },
      {
        n: '02',
        title: '對照五項評分規準自我檢核',
        action:
          '統一評分規準（5 項，每項 0–5 分，滿分 25）：\n1. 識別度：角色在小尺寸/不同版面仍可辨識（3 公分寬測試）\n2. 一致性：跨頁角色、場景、風格不漂移（角色卡六項全對）\n3. 敘事：分鏡、鏡頭、動作可讀（鏡頭條件標註完整）\n4. 可重現：別人拿到檔案能重跑（workflow/專案連結/借力紀錄齊全）\n5. 權利與來源揭露：授權名稱、來源網址、查核日期齊全\n\n小組自評：每項給分、寫出證據頁碼。發表時投影自評表，老師同儕複核。',
        check: '自評表五項分數與證據頁碼齊全。',
      },
      {
        n: '03',
        title: '發表：作品、失敗、比較、決策、交接包',
        action:
          '發表順序（每組 8 分鐘 + 2 分鐘問答）：\n1. 作品播放（動態繪本或靜態翻頁）\n2. 一次失敗版本並排、改了哪個變因、為什麼留下這版\n3. 關鍵決策三件事：選哪一軌、捨棄什麼、最難的一關怎麼過\n4. 交接包亮點：別人拿到能直接重跑/續作的三個關鍵\n5. 自評分數與證據\n不偏袒任何工具：純手繪若五項都強，照樣拿高分；管線複雜但可重現差，分數照扣。',
        check: '發表完成，自評表繳交，交接包上傳雲端資料夾。',
      },
      {
        n: '04',
        title: '把回饋改寫成可執行的修正版清單',
        action:
          '發表後收到的回饋，逐條改寫：\n- 原文：「角色在第 5 頁眼鏡變圓了」→ 修正：「第 5 頁 prompt 加入 round glasses、seed 固定、重跑」\n- 原文：「第 3 頁動作看不出來」→ 修正：「第 3 頁 Frames 提示詞改成 rain drops falling from eyelashes、3秒360p 重跑」\n- 原文：「權利清單缺模型授權」→ 修正：「補上 sd_xl_base_1.0 CreativeML Open RAIL++-M、Juggernaut CreativeML OpenRAIL-M、來源網址、查核日」\n每條都要具體到「改哪一行、怎麼確認改好」。',
        check: '修正版清單每條含：原文、修正動作、驗收方式。',
      },
    ],
    deliverable: '最終作品、失敗對照、自評表、統一交接包（七項）、修正版清單。',
    pitfalls: true,
    sources: true,
  },
]

// ============================================================
// Pitfalls、Measurements、Sources、LanguageNote、Recipe、Glossary、Worked、PromptPairs、CheckedAt
// ============================================================

export interface Pitfall {
  symptom: string
  cause: string
  action: string
}

export const pitfalls: Pitfall[] = [
  // W07 專用
  {
    symptom: 'Flow 生成的角色每張都不一樣（五官、髮型、服裝色塊全變）',
    cause: '沒有用 Ingredients 掛基準圖、或鎖定段沒寫死三個固定識別點、或每格都重寫角色描述',
    action:
      'Ingredients 永遠掛同一張原始基準圖；第一段鎖定段只寫角色外觀與風格完全不動；第二段只寫視角/動作/景別。',
  },
  {
    symptom: '兩段式提示詞寫了，但角色還是漂移',
    cause: '鎖定段裡混入了視角/動作/景別詞、或第二段太長干擾了模型注意力',
    action:
      '鎖定段嚴格只寫：風格四項（媒材紙感、線條、光影、色彩基調）＋角色三個固定識別點（輪廓、髮型、服裝色塊/配件）。第二段≤30 字，只寫視角/動作/景別。',
  },
  {
    symptom: '手繪草圖上傳後，Flow 生成的構圖完全不像草圖',
    cause: '草圖太抽象（只有幾條線）、或提示詞沒寫「依草圖構圖」、或草圖解析度太低',
    action:
      '草圖至少要有：地平線、消失點、角色大致位置、前中後景區隔。提示詞第二段開頭寫「依草圖構圖」。草圖拍照/掃描建議 ≥ 1000 px 長邊。',
  },
  {
    symptom: 'Frames 生成的動態角色變臉、消失點偏移、多出畫面外的物件',
    cause:
      '提示詞寫了鏡頭移動（zoom in、pan、tilt）、或寫了畫面外的事（氣氛、淡入淡出）、或起圖本身構圖不穩',
    action:
      '提示詞只寫「起圖裡看得到的物理變化」（雨滴流動、漣漪、布料晃動、雲層移動）。起圖必須已通過空間深度檢查（消失點、地平線、前中後景正確）。',
  },
  {
    symptom: 'Comfy Cloud 右上角顯示「剩餘 0 / 5 次運行」，無法再跑',
    cause: '免費層 5 次運行已用盡，需等待重置（重置週期由平台決定，頁面未顯示）',
    action:
      '課前規劃好只跑 1–2 次；若真用盡，改用 Flow（影像 0 點）或找同組隊友借配額跑、自己記錄結果。',
  },
  {
    symptom: 'Comfy Cloud 分享連結別人打不開、或打開後無法執行',
    cause: '分享前沒先儲存工作流程、或對方未登入自已帳號、或對方免費配額已用盡',
    action:
      '分享前必須先點「儲存工作流程」再「建立連結」。對方需用自己 Google 帳號登入 Comfy Cloud 並有剩餘配額才能執行。',
  },
  // 既有 Colab/ComfyUI 卡點（保留供管線玩家派參考）
  {
    symptom: '按了執行，那一格下面的輸出沒有變，圖也沒出來',
    cause:
      '如果是下載模型那一格，它正在下載，只是這一段沒有進度條；如果是別格，先看左邊的執行編號是不是空的。',
    action:
      '等這一格印出「模型就緒」再往下一格；編號是空的，代表這格還沒跑，從第一格往下逐格補跑。',
  },
  {
    symptom: '紅字 NameError: name 某個變數 is not defined',
    cause: '上面的儲存格沒執行，或只按了中間那一格。',
    action:
      '「執行階段」→「重新啟動工作階段」，再從第一格往下逐格補跑。不要按「全部執行」，它會一路跑完八頁影片。',
  },
  {
    symptom: '跑到一半出現「執行階段已中斷連線」',
    cause: '免費版的閒置逾時與執行上限由 Colab 決定，官方不公布具體數字，也說會變動。',
    action:
      '重跑安裝與下載那幾格。機器上的檔案跟著消失，所以模型要重下載；要不要排一次跑完，第 15 週第 01 步自己選。',
  },
  {
    symptom: '卡在「正在等待 GPU」',
    cause: '當下沒有空閒的免費 GPU。資源不保證，這是 Colab FAQ 寫明的。',
    action: '隔一段時間再試，或改用付費方案（要錢，價格看 Colab 官網）。',
  },
  {
    symptom: '生成出來是黑圖或純雜訊',
    cause:
      '先查兩件事：模型檔是否完整（下載中斷會留下半個檔），以及 VAE 那一格指到的是不是課程那顆。',
    action:
      '先確認自己下載了幾個檔：三個影片檔約 17 GiB，加插畫模型才是 23.35 GiB。數字不對就刪掉重下。',
  },
  {
    symptom: '節點圖上有紅框，按執行沒反應（第 10 週起）',
    cause: '缺節點或模型路徑不對。通常是版本比教學新，或模型放錯資料夾。',
    action:
      '記下紅框節點的名稱。插畫工作流讀 models/checkpoints；影片工作流讀三顆，分放在 diffusion_models、text_encoders、vae。先確認自己跑的是哪一份。',
  },
  {
    symptom: '瀏覽器一直轉圈，介面打不開（第 10 週起）',
    cause: '後端還沒起來，通常是 server 那一格沒跑完就急著開網址。',
    action: '回 notebook 看那一格的最後一行，出現網址才開。',
  },
  {
    symptom: '用網頁介面操作一陣子，執行階段突然被終止',
    cause:
      '免費版條款把「繞過 notebook 介面、主要靠網頁介面操作」列為會被終止的用途；官方也說明這類內容生成在免費版常遇到執行階段被中止。打開介面本身沒有被禁止，但免費版沒有保證它會跑完。',
    action:
      '介面只拿來看圖與比對；整批長跑回 notebook 送，跑完先下載。第 15 週把兩種做法的時間差列出來。',
  },
]

export interface Measurement {
  label: string
  value: string
  kind: '實測' | '推算' | '設想' | '文件' | '教學建構'
  note: string
  weeks?: number[]
}

export const measurements: Measurement[] = [
  // W07 專用（教學建構為主）
  {
    label: 'Google Flow 影像生成等待時間',
    value: '約 10–15 秒',
    kind: '教學建構',
    weeks: [7, 9, 10, 11, 13, 14],
    note: '基於 2026-11-24 實測觀察，非嚴格量測；網路、伺服器負載會變動。Flow 影像（Nano Banana）0 點。',
  },
  {
    label: 'Google Flow Frames 3 秒 360p 等待時間',
    value: '約 30–60 秒',
    kind: '教學建構',
    weeks: [7, 14],
    note: '基於 2026-11-24 實測觀察，非嚴格量測；扣 3 點。未實測完整流程，標教學建構。',
  },
  {
    label: 'Google Flow 成本表（2026-11-24 查核）',
    value: '影像 0 點；Omni 1.2 Flash 3秒360p=3點/720p=9點；Veo 3.1 Lite 8秒=10點',
    kind: '文件',
    weeks: [7, 15],
    note: '來源：flow.google.com 專案內「Learn about generation costs」回覆，查核日 2026-11-24。',
  },
  {
    label: 'W07 課堂 180 分鐘分階段節奏',
    value: '00–45 基準圖、55–115 連戲、125–180 Frames',
    kind: '教學建構',
    weeks: [7],
    note: '教學設計參數，非實測。實際上課依現場狀況微調。',
  },
  // Comfy Cloud
  {
    label: 'Comfy Cloud 免費層配額',
    value: '5 次運行/帳號/重置週期',
    kind: '文件',
    weeks: [12],
    note: '來源：cloud.comfy.org 介面顯示「剩餘 X / 5 次運行」，查核日 2026-11-24。重置週期頁面未顯示，待老師實測。',
  },
  {
    label: 'Comfy Cloud Z-Image-Turbo 生成等待時間',
    value: '約 15–30 秒',
    kind: '教學建構',
    weeks: [12],
    note: '1024×1024、8 步，基於 2026-11-24 實測觀察。消耗 1 次免費運行。',
  },
  // 既有 Colab/ComfyUI 實測值（保留供管線玩家派參考）
  {
    label: '四個模型檔合計',
    value: '23.35 GiB',
    kind: '實測',
    weeks: [9, 15, 16],
    note: '影片模型 9.31、文字編碼器 6.27、VAE 1.31；只跑影片約 17 GiB，再加插畫模型 6.46 GiB 才是 23.35。',
  },
  {
    label: '下載這 23.35 GiB',
    value: '280 秒',
    kind: '實測',
    weeks: [9, 14, 15, 16],
    note: '免費版 T4，2026-10-29。宿舍網路或尖峰時段會更久。',
  },
  {
    label: '生成一張插畫',
    value: '約 27 秒',
    kind: '實測',
    weeks: [9, 14, 16],
    note: '試點設定 1280×704、30 步；課堂工作流現在是 1280×720、25 步，秒數會不同。',
  },
  {
    label: '生成一頁 2 秒動態',
    value: '582–619 秒',
    kind: '實測',
    weeks: [14, 15, 16],
    note: '49 幀、20 步。八頁逐一記錄，最慢是第 1 頁。',
  },
  {
    label: '八頁動態合計',
    value: '4721 秒（78.7 分鐘）',
    kind: '推算',
    weeks: [15, 16],
    note: '八個實測值相加：619、588、585、585、588、588、586、582 秒。',
  },
  {
    label: '第 1 頁比後面多花',
    value: '31–37 秒',
    kind: '推算',
    weeks: [14],
    note: '以第 2 頁 588 秒與最快頁 582 秒計算：619 − 588 = 31、619 − 582 = 37；後七頁平均 586，差 33。推測是第一次要把模型載進記憶體，這一條沒有單獨量。',
  },
  {
    label: '動態比插畫多花',
    value: '約 22 倍',
    kind: '推算',
    weeks: [14],
    note: '619 ÷ 27 與 588 ÷ 27。兩邊設定不同（插畫 30 步、影片 20 步），只當量級看，不當精確倍數。',
  },
  {
    label: '八頁分八次跑，每次換新機器',
    value: '約 2 小時（7192 秒）',
    kind: '設想',
    weeks: [15],
    note: '8 ×（280 秒下載＋619 秒第一頁）＝7192 秒。同一天同一台機器分開送，不會多花這些時間。',
  },
  {
    label: '一次跑完同一件事',
    value: '約 83 分鐘',
    kind: '設想',
    weeks: [15, 16],
    note: '280＋4721 秒（4721 已含第 1 頁的載入時間）＝5001 秒。差別在下載只做一次，代價是中途不能下載。',
  },
]

export interface SourceRef {
  label: string
  url: string
  supports: string
}

export const sources: SourceRef[] = [
  {
    label: 'Google Flow 官方網站',
    url: 'https://flow.google.com/',
    supports:
      '影像生成（Nano Banana）0 點；影片生成成本表；繁體中文提示詞原生支援；Ingredients 機制；Frames 影片生成；專案分享與管理。查核日 2026-11-24。',
  },
  {
    label: 'Comfy Cloud 官方網站',
    url: 'https://cloud.comfy.org/',
    supports:
      '免費層 5 次運行配額；Z-Image-Turbo 範本工作流；分享連結機制（https://cloud.comfy.org/?share=...）；節點式可控產線體驗。查核日 2026-11-24。',
  },
  {
    label: 'Google Colab 常見問題',
    url: 'https://research.google.com/colaboratory/faq.html',
    supports:
      '免費版禁止 file hosting、media serving 與「web service offerings not related to interactive compute」，也禁止「bypassing the notebook UI to interact primarily via a web UI」；FAQ 另說明免費版使用者繞過 notebook 介面、用網頁介面做內容生成時常遇到執行階段被終止；資源與 GPU 不保證、閒置會逾時，上限會變動且不公布具體數字。查核日 2026-11-03。',
  },
  {
    label: 'ComfyUI 官方 Wan2.2 教學',
    url: 'https://docs.comfy.org/tutorials/video/wan/wan2_2',
    supports:
      'Wan2.2 以 Apache 2.0 釋出並允許商用；模型分開放在 diffusion_models、text_encoders、vae 三個資料夾。查核日 2026-11-03。',
  },
  {
    label: 'Juggernaut XL v9 模型頁',
    url: 'https://huggingface.co/RunDiffusion/Juggernaut-XL-v9',
    supports:
      '單檔 Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors，授權 CreativeML OpenRAIL-M；由 SDXL 微調而來，節點與尺寸不用改。查核日 2026-11-03。',
  },
  {
    label: 'SDXL 授權條文',
    url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md',
    supports:
      '插畫模型採 CreativeML Open RAIL++-M。RAIL（Responsible AI License）是這個授權家族的名字，條文附使用限制，不是無條件可商用。查核日 2026-11-03。',
  },
  {
    label: 'ComfyUI 專案原始碼',
    url: 'https://github.com/comfyanonymous/ComfyUI',
    supports: '安裝方式與節點欄位的來源；節點名稱與下拉選項以這份原始碼為準。',
  },
]

/**
 * 為什麼指令寫英文，以及中文要怎麼用。
 *
 * 插畫模型的文字編碼器是 CLIP，訓練資料以英文圖說為主；影片模型的 umT5 是多語模型。
 * 兩者差別寫在這一段，避免學生以為「中文不行」。
 * 現在 Google Flow 原生懂繁體中文，教學主軸改為繁中描繪六欄法，不再強迫翻英文。
 */
export const languageNote = {
  why: 'Google Flow 的文字編碼器支援繁體中文，課堂主軸改為「繁中六欄描繪法」：風格四項（媒材紙感、線條、光影、色彩基調）＋角色三個固定識別點＋動作/視角/景別。不再強迫翻英文咒語。核心口訣：「不要寫感受，只寫攝影機拍得到的東西（誰、穿什麼、做什麼動作、站哪裡、光從哪來、用什麼媒材畫）」。',
  practice:
    '需求單用中文想，Flow 輸入區直接寫繁中。左邊寫中文那一句，右邊就是給 Flow 看的同一行。兩邊欄位一一對齊：風格、角色、動作、場景、景別、限制。Comfy Cloud 節點 prompt 欄位若用中文，Z-Image-Turbo 也能理解；建議仍用可觀測的英文關鍵字對照表（見 glossary）以利跨工具復用。',
  limits:
    '不需要會英文作文，只需要認得詞表裡的幾個字。不確定的字先不要寫；寫進去沒生效，比沒寫更難除錯。Flow 遇到生僻中文詞可能產生非預期結果，改用詞表對照的英文關鍵字即可。',
}

/** 從一格分鏡到一行提示詞的六個步驟（繁中六欄描繪法）。 */
export const recipe: string[] = [
  '先用中文寫一句：誰、在做什麼、在哪裡、什麼鏡頭。一句話只放一件事。',
  '拆成六欄：風格四項（媒材紙感、線條、光影、色彩基調）、角色三個固定識別點（輪廓、髮型、服裝色塊/配件）、動作（具體動詞＋方向＋視線落點）、場景（前中後景關係）、景別與視角、限制（留白、無文字、無浮水印）。同一欄不要寫兩次。',
  '查下面的詞表，把每一欄對照成可觀測的英文關鍵字（供 Comfy Cloud 跨工具復用）。查不到的字先空著，不要硬翻。',
  '照固定順序拼給 Flow 看：風格四項 → 角色三點 → 動作 → 場景 → 景別/視角 → 限制。風格放最前面，因為八頁要共用同一組字，寫在最前面最不容易漏。',
  'Flow 用兩段式：第一段（鎖定段）＝風格四項＋角色三點，永遠不動，Ingredients 掛同一張基準圖。第二段（只改這格）＝動作＋場景＋景別/視角，每格只改這一段。',
  '跑一次，把圖對回需求單六欄。缺哪一欄就補那一欄，不要整句重寫。失敗留存對照，寫下漂移項目。',
]

export const glossary: GlossaryGroup[] = [
  {
    field: '媒材與紙感',
    zh: '暖色紙感、水彩邊緣、墨線滲透、乾筆紋理、數位平塗',
    en: [
      'warm paper texture',
      'watercolor edge bleed',
      'ink bleed',
      'dry brush texture',
      'flat digital paint',
    ],
  },
  {
    field: '線條',
    zh: '自信墨線、線條粗細變化、柔和邊緣、鉛筆草稿感',
    en: ['confident ink lines', 'variable line weight', 'soft edges', 'pencil sketch lines'],
  },
  {
    field: '光影',
    zh: '頂光、柔和陰影、輪廓光、次表面散射、環境光遮蔽',
    en: [
      'top-down lighting',
      'soft shadows',
      'rim light',
      'subsurface scattering',
      'ambient occlusion',
    ],
  },
  {
    field: '色彩基調',
    zh: '低調配色、冷色調配暖色點綴、有限調色盤、黃藍對比',
    en: [
      'muted palette',
      'cool tones with warm accents',
      'limited palette',
      'yellow-blue contrast',
    ],
  },
  {
    field: '角色固定識別點',
    zh: '輪廓（圓臉/方臉）、髮型（短髮/長髮/馬尾）、服裝色塊（雨衣黃/藍外套）、配件（圓框眼鏡/鑰匙鍊）',
    en: ['round face', 'short hair', 'yellow raincoat', 'round glasses', 'keychain'],
  },
  {
    field: '動作（具體動詞＋方向＋視線落點）',
    zh: '蹲著/站著/走路、抬頭/低頭/轉身、視線落在鐵門/掌心/天空',
    en: [
      'crouching',
      'standing',
      'walking',
      'looking up',
      'looking down',
      'turning',
      'gaze at gate',
      'gaze at palm',
      'gaze at sky',
    ],
  },
  {
    field: '場景（前中後景關係）',
    zh: '前景濕地面倒影、中景角色站位、遠景灰藍天空、消失點在鐵門頂端',
    en: [
      'wet ground reflection foreground',
      'character midground',
      'gray-blue sky background',
      'vanishing point at gate top',
    ],
  },
  {
    field: '景別與視角',
    zh: '遠景、中景、特寫、極特寫、平視、俯視、仰視、POV',
    en: [
      'wide shot',
      'medium shot',
      'close up',
      'extreme close up',
      'eye level',
      'high angle',
      'low angle',
      'POV',
    ],
  },
  {
    field: '限制',
    zh: '上方留白給文字、不要文字、不要浮水印、不要寫實膚質、不要向量平塗',
    en: [
      'empty space at top',
      'no text',
      'no watermark',
      'no photorealistic skin',
      'no flat vector',
    ],
  },
]

/** 一個完整的示範：第 2 頁那格分鏡怎麼變成繁中六欄描繪給 Flow。 */
export const worked: WorkedExample = {
  panel: '第 2 頁分鏡：主角小藍沒帶傘，蹲在店門口條紋遮雨棚下抬頭看雨，視線落在雨滴上。',
  demand:
    '風格：暖色紙感、藍色墨線、柔和陰影、冷色調配暖黃點綴｜角色：圓臉、短髮、黃雨衣、圓框眼鏡｜動作：蹲著、抬頭、視線落雨滴｜場景：前景濕地面、中景遮雨棚下、遠景灰街道｜景別：medium shot、eye level｜限制：上方留白、無文字、無浮水印',
  prompt:
    '第一段（鎖定段）：暖色紙感、藍色墨線、柔和陰影、冷色調配暖黃點綴、圓臉、短髮、黃雨衣、圓框眼鏡\n第二段（只改這格）：蹲著、抬頭、視線落雨滴、濕地面前景、遮雨棚中景、灰街道遠景、medium shot、eye level、上方留白、無文字',
  notes: [
    '第一段鎖定段：風格四項＋角色三點，永遠不動，Ingredients 掛同一張基準圖。',
    '第二段只改這格：動作三要素（具體動詞＋方向＋視線落點）、場景前中後景、景別視角、限制。',
    'Flow 原生懂繁中，不必翻英文。Comfy Cloud 需要時再對照 glossary 英文關鍵字。',
    '失敗留存：若第 2 格眼鏡變方框，紀錄「眼鏡漂移，疑似第二段動作詞太長干擾」，下輪縮短第二段。',
  ],
}

/**
 * 真實的指令與產出對照（保留既有 Colab/ComfyUI 範例供管線玩家派參考）。
 *
 * 指令原文來自 pilot/storyboard.json 的 imagePrompt；圖是那一次生成後做成影片的
 * 第一幀（H.264 壓縮），所以不是原始 PNG，但內容與當時產出一致。
 * 「微調」欄寫的是預期影響，不是量測結果；要在固定種子下自己驗一次。
 */
export const promptPairs: PromptPair[] = [
  {
    page: '第 1 頁',
    image: '/illustrations/pilot/p01.webp',
    alt: '藍線稿插畫：學校鐵門在兩側，中間是一條通往校舍的路，上方堆着大片雲。',
    segments: [
      { text: 'warm paper texture, medium blue ink linework, pale sky', field: '風格' },
      { text: 'a school gate under gathering clouds', field: '主體與場景' },
      { text: 'wide shot', field: '景別' },
      { text: 'no text', field: '限制' },
    ],
    observed:
      '鐵門、雲、寬景都出來了。但「warm paper texture」在圖上讀不出來，畫面偏冷。風格詞寫了，不代表一定生效，要看圖確認。',
    tweak: '把 gathering clouds 改成 heavy rain，其他三個都不動。',
    expect:
      '天氣變成下雨，鐵門、景別不會因此改變。要驗這一條得先把起始亂數固定住（第 10 週第 06 步會教）；現在先記下這一行打算驗什麼。',
  },
  {
    page: '第 2 頁',
    image: '/illustrations/pilot/p02.webp',
    alt: '黃色雨衣的小孩蹲在藍白條紋遮雨棚下，抬頭往上看，畫面接近寫實照片。',
    segments: [
      { text: 'a child in a yellow raincoat', field: '主體' },
      { text: 'waiting', field: '動作' },
      { text: 'under a shop awning', field: '場景' },
      { text: 'blue and orange contrast, cinematic youth mood', field: '風格' },
      { text: 'medium shot', field: '景別' },
      { text: 'no text', field: '限制' },
    ],
    observed:
      '這一頁變成寫實照片感，跟第 1 頁的藍線稿不像同一本書。原因是風格段只寫了對比與氣氛，沒有把線條與紙感寫進來。',
    tweak:
      '先把風格段補成跟第 1 頁一樣的三段：warm paper texture, medium blue ink linework, pale sky。動作先不動。',
    expect:
      '風格回到線稿，動作還是 waiting。風格回來之後才做第二次：把 waiting 改成 stepping into the rain，再看動作有沒有變。一次只改一段，才看得出哪一段造成改變。',
  },
  {
    page: '第 3 頁',
    image: '/illustrations/pilot/p03.webp',
    alt: '金屬格柵的極特寫，雨水打在格柵上，藍色反光。',
    segments: [
      { text: 'rain hitting a metal grate', field: '主體' },
      { text: 'blue light reflections, detailed wet texture', field: '材質' },
      { text: 'close up … extreme close up', field: '景別（寫了兩次）' },
      { text: 'no text', field: '限制' },
    ],
    observed:
      '格柵特寫成立。但景別寫了兩次：close up 和 extreme close up，兩個都在搶同一個位置，結果是哪一個，光看文字判斷不出來。',
    tweak: '刪掉一個景別，只留 extreme close up；想讓觀眾看到環境，才改成 wide shot。',
    expect: '只有遠近會變，主體與材質不變。同一個欄位寫兩次，等於讓模型自己挑一個。',
  },
]

export const checkedAt = '2026-11-24'
