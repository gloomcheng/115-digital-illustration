export interface DesignEducationLesson {
  concept: string
  eli5: string
  visual: string
  visualAlt: string
}

export const designEducation: Record<number, DesignEducationLesson> = {
  1: {
    concept: '先看清楚，再決定怎麼做。',
    eli5: '把同一張椅子拿來觀察：先看輪廓、比例、材料和坐的位置，才知道哪裡是設計，哪裡只是裝飾。',
    visual: '/illustrations/trial-loop.svg',
    visualAlt: '一個循環圖：問題、試做、比較、記錄，再回到下一輪。',
  },
  2: {
    concept: '先看現場，才知道要問工具什麼。',
    eli5: '你說水壺漏水，修理的人還是要先看哪裡漏；不然拿膠帶到處貼，可能只把問題蓋住。',
    visual: '/illustrations/prompt-window.svg',
    visualAlt: '一張畫面說明卡，將主體、動作、用途與限制交給右側候選圖。',
  },
  3: {
    concept: '風格不是一個名字，是線條、形狀和色彩一起造成的結果。',
    eli5: '同一道菜只換盤子，味道不會變；換了食材、火候和調味，吃的人才會覺得是另一道菜。',
    visual: '/illustrations/style-atlas.svg',
    visualAlt: '風格拆解表，把線條、形狀、色彩、材質、空間與用途分開觀察。',
  },
  4: {
    concept: '同一個畫面換了用途，就要重新安排。',
    eli5: '雨鞋、球鞋和皮鞋都能穿，但走的路不一樣；畫面要做的事變了，安排也會變。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '同一個主體透過不同視窗觀看，提示看的人、媒材與用途會改變畫面。',
  },
  5: {
    concept: '先決定要做什麼，再選工具。',
    eli5: '你要煮湯、切菜、烤麵包，拿的工具不會一樣；先看工作是哪一段，再決定手上拿什麼。',
    visual: '/illustrations/tool-orbit.svg',
    visualAlt: '工具圍繞著實驗卡，分成生成、編修、組裝、記錄與交付。',
  },
  6: {
    concept: '提示詞不是咒語，是一張畫面說明單。',
    eli5: '你請店家做便當，沒說不要香菜，盒子裡出現香菜就不奇怪；畫面說明也是一樣。',
    visual: '/illustrations/prompt-window.svg',
    visualAlt: '畫面說明卡把主體、動作、構圖、風格、用途與限制分欄整理。',
  },
  7: {
    concept: '你站在哪裡，角色就會變成另一個樣子。',
    eli5: '站在門口看房間和站到桌子旁邊，看到的東西不一樣；角色沒換，畫面中的關係已經換了。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '視窗改變觀看距離與位置，呈現同一主體在不同視角下的關係。',
  },
  8: {
    concept: '期中要交的不是一張圖，是下一輪還能接著做的規則。',
    eli5: '只交一張考卷，別人不知道你怎麼算；把步驟留下來，下一題才接得上。',
    visual: '/illustrations/broker-kit.svg',
    visualAlt: '作品交接包包含角色、用途、看的人、權利與下一步。',
  },
  9: {
    concept: '一格畫面先讓人知道一件事。',
    eli5: '一句話先說誰做了什麼；一格畫面也先讓人找到角色和動作。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '繪本頁面與畫格被拆成連續的畫面任務。',
  },
  10: {
    concept: '鏡頭不是特效，先決定人離角色多近。',
    eli5: '手機貼近臉時看得到表情，退兩步才看得到人站在哪裡；鏡頭距離會改變你先讀到的資訊。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '不同的觀看窗格呈現景別、方向與主體關係如何改變畫面語氣。',
  },
  11: {
    concept: '角色要有幾個不能被換掉的記憶點。',
    eli5: '同學換外套你還認得出來，是因為臉型、身形和走路方式沒有一起換掉。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '同一角色在多個繪本頁面中維持輪廓、色塊與動作記憶點。',
  },
  12: {
    concept: '講評要指出哪裡出問題，下一輪才有地方下手。',
    eli5: '水管漏水時一次關一個閥，才知道是哪一段出問題；一次改太多，最後只剩猜。',
    visual: '/illustrations/trial-loop.svg',
    visualAlt: '實驗循環把假設、生成、比較與單一變因修正連成一圈。',
  },
  13: {
    concept: '版面先安排誰被看見。',
    eli5: '走進超商先看到的東西，通常就在眼睛和手最容易到的位置；版面也要先安排順序。',
    visual: '/illustrations/style-atlas.svg',
    visualAlt: '視覺規則表將比例、色彩、字體、留白與用途整理成可交接的版面。',
  },
  14: {
    concept: '遠近不是細節，是尺寸和位置先對。',
    eli5: '同樣大的箱子放遠一點，看起來就小一點；空間關係先對，畫面才站得住。',
    visual: '/illustrations/sky-window.svg',
    visualAlt: '前景、中景與遠景透過觀看窗格排列，呈現地平線與空間關係。',
  },
  15: {
    concept: '提案先說清楚誰看、放哪裡、要做多少。',
    eli5: '出門前要知道去哪裡、幾個人去、帶多少行李；作品提案也要先把這些條件放上桌。',
    visual: '/illustrations/broker-kit.svg',
    visualAlt: '作品提案包把角色、看的人、用途、權利與製作條件放在同一張圖上。',
  },
  16: {
    concept: '交付要讓下一個人打得開、看得懂、接得下去。',
    eli5: '把房間鑰匙交出去時，要說哪扇門能開、東西放在哪裡；檔案交出去也要讓人接得上。',
    visual: '/illustrations/rights-map.svg',
    visualAlt: '作品交接路線圖從角色與素材連到看的人、用途與權利。',
  },
  17: {
    concept: '作品放進展場，人的走路就會成為作品的一部分。',
    eli5: '同一首歌在耳機和教室播放，聽起來不會一樣；作品換了空間，人的走路、光線和聲音也會加入其中。',
    visual: '/illustrations/storybook-stack.svg',
    visualAlt: '作品從單張畫面延伸到空間、頁面與人的走法。',
  },
  18: {
    concept: '參考資料要找得到來源，也要說得清楚為什麼用。',
    eli5: '買菜要知道產地和保存方式；拿圖片當參考，也要知道來源和可以怎麼用。',
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
