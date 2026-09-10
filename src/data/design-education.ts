export interface DesignEducationLesson {
  concept: string
  eli5: string
  visual: string
  visualAlt: string
}

export const designEducation: Record<number, DesignEducationLesson> = {
  1: {
    concept: '先決定這張圖要讓人做什麼。',
    eli5: 'ELI5：你不先說清楚要煮給誰吃、要幾人份，廚房只能自己猜。',
    visual: '/illustrations/trial-loop.svg',
    visualAlt: '一個循環圖：問題、試做、比較、記錄，再回到下一輪。',
  },
  2: {
    concept: '先看現場，才知道要問工具什麼。',
    eli5: 'ELI5：先找到漏水的位置，再拿水桶接；不然只是提著水桶到處跑。',
    visual: '/illustrations/prompt-window.svg',
    visualAlt: '一張畫面說明卡，將主體、動作、用途與限制交給右側候選圖。',
  },
  3: {
    concept: '風格不是一個名字，是線條、形狀和色彩一起造成的結果。',
    eli5: 'ELI5：風格像食譜，不是貼紙；線條、色彩、形狀一起變，才會得到同一種味道。',
    visual: '/illustrations/style-atlas.svg',
    visualAlt: '風格拆解表，把線條、形狀、色彩、材質、空間與用途分開觀察。',
  },
  4: {
    concept: '同一個畫面換了用途，就要重新安排。',
    eli5: 'ELI5：同一雙鞋去跑步、上課、走紅毯，設計不會完全一樣；要做的事變了，外觀也要跟著變。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '同一個主體透過不同視窗觀看，提示看的人、媒材與用途會改變畫面。',
  },
  5: {
    concept: '先決定要做什麼，再選工具。',
    eli5: 'ELI5：工具像廚房裡的刀、鍋和烤箱；先知道要煮什麼，才知道拿哪一個。',
    visual: '/illustrations/tool-orbit.svg',
    visualAlt: '工具圍繞著實驗卡，分成生成、編修、組裝、記錄與交付。',
  },
  6: {
    concept: '提示詞不是咒語，是一張畫面說明單。',
    eli5: 'ELI5：提示詞像把訂單寫給廚房；不寫份量、材料和不能放什麼，廚師只能自己猜。',
    visual: '/illustrations/prompt-window.svg',
    visualAlt: '畫面說明卡把主體、動作、構圖、風格、用途與限制分欄整理。',
  },
  7: {
    concept: '你站在哪裡，角色就會變成另一個樣子。',
    eli5: 'ELI5：你站在角色前面、旁邊或上面，畫面就會讓人看到不同的事情。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '視窗改變觀看距離與位置，呈現同一主體在不同視角下的關係。',
  },
  8: {
    concept: '期中要交的不是一張圖，是下一輪還能接著做的規則。',
    eli5: 'ELI5：一張圖只證明這張圖；一組規則才讓下一張圖做得出來。',
    visual: '/illustrations/broker-kit.svg',
    visualAlt: '作品交接包包含角色、用途、看的人、權利與下一步。',
  },
  9: {
    concept: '一格畫面先讓人知道一件事。',
    eli5: 'ELI5：每格畫面像一句話，先說清楚主詞和動作，不要一格塞十個重點。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '繪本頁面與畫格被拆成連續的畫面任務。',
  },
  10: {
    concept: '鏡頭不是特效，先決定人離角色多近。',
    eli5: 'ELI5：靠近一點，看得到表情；退遠一點，才看得到角色和場景的關係。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '不同的觀看窗格呈現景別、方向與主體關係如何改變畫面語氣。',
  },
  11: {
    concept: '角色要有幾個不能被換掉的記憶點。',
    eli5: 'ELI5：角色要像同一個人，不能只記得衣服，還要記得臉型、輪廓和走路的樣子。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '同一角色在多個繪本頁面中維持輪廓、色塊與動作記憶點。',
  },
  12: {
    concept: '講評要指出哪裡出問題，下一輪才有地方下手。',
    eli5: 'ELI5：修圖像找漏水處，一次只關一個水閥，才知道是哪裡漏。',
    visual: '/illustrations/trial-loop.svg',
    visualAlt: '實驗循環把假設、生成、比較與單一變因修正連成一圈。',
  },
  13: {
    concept: '版面先安排誰被看見。',
    eli5: 'ELI5：版面像超商貨架，重要的東西要站在看得到、拿得到的位置。',
    visual: '/illustrations/style-atlas.svg',
    visualAlt: '視覺規則表將比例、色彩、字體、留白與用途整理成可交接的版面。',
  },
  14: {
    concept: '遠近不是細節，是尺寸和位置先對。',
    eli5: 'ELI5：把不同大小的盒子放在同一張桌上，遠的看起來小，不是因為它真的變小。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '前景、中景與遠景透過觀看窗格排列，呈現地平線與空間關係。',
  },
  15: {
    concept: '提案先說清楚誰看、放哪裡、要做多少。',
    eli5: 'ELI5：提案像安排旅行，要先知道誰去、去哪裡、花多少、行李能不能帶上車。',
    visual: '/illustrations/broker-kit.svg',
    visualAlt: '作品提案包把角色、看的人、用途、權利與製作條件放在同一張圖上。',
  },
  16: {
    concept: '交付要讓下一個人打得開、看得懂、接得下去。',
    eli5: 'ELI5：交付像把房間鑰匙交給下一個人，不能只說「很好看」，要告訴他門在哪裡、東西怎麼用。',
    visual: '/illustrations/rights-map.svg',
    visualAlt: '作品交接路線圖從角色與素材連到看的人、用途與權利。',
  },
  17: {
    concept: '作品放進展場，人的走路就會成為作品的一部分。',
    eli5: 'ELI5：作品放到展場就像魚離開魚缸，人的走路、光線和聲音會改變它。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '作品從單張畫面延伸到空間、頁面與人的走法。',
  },
  18: {
    concept: '參考資料要找得到來源，也要說得清楚為什麼用。',
    eli5: 'ELI5：參考資料像食材來源標籤，不能只說好吃，要知道從哪裡來、能不能使用。',
    visual: '/illustrations/rights-map.svg',
    visualAlt: '來源與權利地圖把參考資料、工具條款、用途與作品交付連起來。',
  },
}

export const designEducationSources = [
  {
    label: '教育部美感與設計課程創新計畫：18 堂基本設計',
    url: 'https://aade.project.edu.tw/life/18',
  },
  {
    label: '教育部美感教育：基本設計課程案例',
    url: 'https://aade.project.edu.tw/example/273',
  },
  {
    label: '中國科技大學視覺傳達設計課程簡介',
    url: 'https://web.cute.edu.tw/dvcd/course.html',
  },
  {
    label: '中國文化大學視覺傳達設計課程進度',
    url: 'https://icas.pccu.edu.tw/cfp/fullcontent.aspx?course=392208',
  },
] as const
