export const course = {
  title: '數位插畫與動態繪本創作',
  academicYear: 115,
  semester: '115-1',
  format: '合授課程',
  credits: 3,
  promise: '你會把一個視覺想法做出幾個版本，看看哪裡失控，再把能說清楚、能繼續做的版本留下來。',
  responsibilities: [
    {
      title: 'AI 工具這一段',
      description:
        '你會學怎麼挑工具、怎麼把想法說清楚、怎麼記錄每次試做，最後把作品整理成可以提案的樣子。',
      color: 'blue',
    },
    {
      title: '故事與分鏡這一段',
      description: '另一位老師帶故事、分鏡與鏡頭語言；你會把那些條件轉成 AI 能試做的畫面。',
      color: 'coral',
    },
  ],
  principles: [
    '先問一個能觀察的問題，不先追求漂亮成品。',
    '一次只改一個變數，才知道結果為什麼變。',
    '留下失敗輸出；失敗是下一輪的資料。',
    '一張好看的圖不是 IP，能辨識、能重複、能延伸才是作品基礎。',
  ],
} as const

export const careerDirections = [
  {
    title: '數位媒體設計',
    detail:
      '把文字、圖片、聲音、影像整合成動畫、互動或遊戲。AI 讓第一輪試做變快，但你還是要知道畫面怎麼動、資產怎麼接、作品怎麼測。',
    roles: '多媒體／動畫設計、網頁視覺、遊戲美術、互動內容',
    source: 'https://collego.edu.tw/Highschool/MajorIntro?collegeFrom=1&current_major_id=4',
  },
  {
    title: '資訊傳播',
    detail:
      '把資訊做成別人看得懂、用得上的數位內容。除了畫面，還要想資料、介面、互動、網路和使用者怎麼一起工作。',
    roles: '網頁設計、使用者介面與體驗、資訊設計、數位產品企劃',
    source: 'https://collego.edu.tw/Highschool/MajorIntro?current_college_id=10&current_major_id=3',
  },
  {
    title: '大眾傳播',
    detail:
      '先問誰要收到訊息、會在哪裡看到，再用文字、聲音或影像把訊息說出去。AI 可以幫你改稿和試做，但不能替你承擔內容是否誤導。',
    roles: '內容企劃、影音製作、廣告／公關企劃、編輯與後製',
    source: 'https://collego.edu.tw/Highschool/MajorIntro?current_major_id=84',
  },
  {
    title: '視覺與商業設計',
    detail:
      '把生活中的觀察變成能溝通的視覺方案。這不只是把圖畫漂亮，還要找到問題、接受限制、和團隊合作，最後把作品交給別人。',
    roles: '視覺設計、插畫設計、品牌設計、展示與互動介面',
    source: 'https://collego.edu.tw/Highschool/MajorIntro?current_major_id=68',
  },
] as const
