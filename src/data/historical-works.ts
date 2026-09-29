export interface HistoricalWork {
  /** Local file under /illustrations. Never a remote URL: the repository must build and run offline. */
  file: string
  /** What the student should be looking at, and why it is here. Doubles as alt text. */
  description: string
  /** Who made the work, in the form the lesson uses. */
  maker: string
  /** When it was made. */
  date: string
  /** License of the photograph actually reproduced here. */
  license: string
  /** Author of the photograph or scan, as credited by the source. */
  credit: string
  /** Commons description page, where the license and provenance are recorded. */
  source: string
}

/**
 * The actual works the W02 lesson is about.
 *
 * The photograph of an artwork has its own rights holder even when the artwork
 * itself is out of copyright, so each entry records the license of the file
 * used here rather than the age of the work. Verified 2026-09-29; re-check
 * before adding further works.
 */
export const historicalWorks: Record<string, HistoricalWork> = {
  lascaux: {
    file: '/illustrations/work-lascaux-hall-of-bulls.webp',
    description:
      '拉斯科公牛大廳的局部：一頭原牛的側身佔滿畫面，赭黃的軀幹、黑色的頭與前腿都靠外線站住，旁邊還有一頭更小的黃色個體。輪廓完整，不需要解釋就看得出是什麼動物。',
    maker: '舊石器時代畫者，年代未詳',
    date: '約兩萬年前',
    license: 'CC0',
    credit: '照片 Eline13Viki，經 Wikimedia Commons 釋出為 CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Peinture_Grotte_de_Lascaux.jpg',
  },
  altamira: {
    file: '/illustrations/work-altamira-polychrome-bison.webp',
    description:
      '阿爾塔米拉彩繪廳的野牛：同一頭牛用赭紅與黑色畫出明暗，輪廓反而讓位給形體，看起來有厚度。',
    maker: '舊石器時代畫者，年代未詳',
    date: '約一萬四千五百年前',
    license: 'CC BY 4.0',
    credit: '照片 Jl FilpoC，經 Wikimedia Commons',
    source:
      'https://commons.wikimedia.org/wiki/File:Bisonte_en_el_Techo_de_Policromos,_Neocueva_de_Altamira.jpg',
  },
  papyrusOfAni: {
    file: '/illustrations/work-papyrus-of-ani-sheet.webp',
    description:
      '大英博物館阿尼 Papyrus 的一張分裱：文字與插畫並排，左側是幾個小房間裡的人物與神祇形象，右側是兩組重複的人物與象形文字欄。紙面完整，邊緣沒有缺口。',
    maker: '古埃及，第十九王朝，約西元前 1250 年',
    date: '約西元前 1250 年',
    license: '公有領域',
    credit: '大英博物館，Wikimedia Commons 檔案標示為公有領域',
    source: 'https://commons.wikimedia.org/wiki/File:Papyrus_of_Ani_BM_Sheet_12.jpg',
  },
  kells: {
    file: '/illustrations/work-book-of-kells-chi-rho.webp',
    description:
      '《凱爾經》第三十四對開頁的字首：X 與 P 兩個字母被畫成互相纏繞的裝飾，整個圖案靠彎曲的線條與密集的幾何紋填滿空間。',
    maker: '愛爾蘭修士，個人姓名無從得知',
    date: '約 800 年',
    license: '公有領域',
    credit: 'Wikimedia Commons，檔案標示為公有領域',
    source: 'https://commons.wikimedia.org/wiki/File:KellsFol034rChiRhoMonogram.jpg',
  },
  trhSeptember: {
    file: '/illustrations/work-tres-riches-heures-september.webp',
    description:
      '時禱書九月頁的插畫部分：索穆爾城堡立在藍色天空下，下方是葡萄園裡的採收與運貨，牛群走過田埂。畫面最上方是黃道十二宮的半圓帶，上弦月畫在深藍色那一格裡。',
    maker: '林堡兄弟，背景約 1438–1442，下半由 Jean Colombe 補完',
    date: '1412 動筆，1486 補完',
    license: 'CC BY-SA 4.0',
    credit: '照片 Mel22，經 Wikimedia Commons；本檔為原圖的插畫部分裁切',
    source:
      'https://commons.wikimedia.org/wiki/File:Exposition_%22Les_Tr%C3%A8s_Riches_Heures_du_duc_de_Berry%22_-_juin_2025_-_09_mois_de_septembre.jpg',
  },
  fourHorsemen: {
    file: '/illustrations/work-durer-four-horsemen.webp',
    description:
      '杜勒《啟示錄四騎士》木刻：四匹馬擠成一團往上衝，最上方的字母與數字說明這一版印在書頁最前面。',
    maker: 'Albrecht Dürer',
    date: '1498',
    license: 'CC0',
    credit: '美國國家美術館藏本，Wikimedia Commons 釋出為 CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer,_The_Four_Horsemen,_1498,_NGA_142352.jpg',
  },
  youngHare: {
    file: '/illustrations/work-durer-young-hare.webp',
    description:
      '杜勒《野兔》：一隻野兔側身蹲坐，每一根毛髮的方向和長短都畫出來，地面上的陰影只用幾筆灰階交代。畫面下方他自己寫了 1502 與一個合體的姓名縮寫記號。',
    maker: 'Albrecht Dürer',
    date: '1502',
    license: '公有領域',
    credit: '維也納奧爾貝蒂那美術館藏本，Wikimedia Commons 檔案標示為公有領域',
    source: 'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer_-_Feldhase_(1502).jpg',
  },
  selfPortraitThirteen: {
    file: '/illustrations/work-durer-self-portrait-thirteen.webp',
    description:
      '杜勒 13 歲自畫像：銀尖筆在紙上排出一層層細線，頭髮的每束走向都看得出來，右上角是他自己用當時的寫法留下的題記與年份。',
    maker: 'Albrecht Dürer',
    date: '1484',
    license: '公有領域',
    credit: '維也納奧爾貝蒂那美術館藏本，Wikimedia Commons 檔案標示為公有領域',
    source:
      'https://commons.wikimedia.org/wiki/File:Durer-self-portrait-at-the-age-of-thirteen.jpg',
  },
  rhinoceros: {
    file: '/illustrations/work-durer-rhinoceros.webp',
    description:
      '杜勒《犀牛》木刻：一頭看起來像披了盔甲的犀牛，畫面下方留白處印著年份與「Rhinocerus」這個字。',
    maker: 'Albrecht Dürer',
    date: '1515',
    license: 'CC0',
    credit: '美國國家美術館藏本，Wikimedia Commons 釋出為 CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer,_The_Rhinoceros,_1515,_NGA_47903.jpg',
  },
}
