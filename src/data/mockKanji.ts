import type { KanjiItem } from '../types/kanji';

export const INITIAL_LEARNING_POOL: KanjiItem[] = [
  {
    id: 'kanji-n5-1',
    kanji: '日',
    primaryMeaning: 'Sonne, Tag',
    meanings: ['Sonne', 'Tag', 'Sonntag', 'Japan'],
    strokeCount: 4,
    jlpt: 'N5',
    radical: {
      symbol: '日',
      name: 'ひ (hi)',
      meaning: 'Sonne / Tag',
    },
    onyomi: [
      { kana: 'ニチ', romaji: 'nichi' },
      { kana: 'ジツ', romaji: 'jitsu' },
    ],
    kunyomi: [
      { kana: 'ひ', romaji: 'hi' },
      { kana: '-び', romaji: '-bi' },
      { kana: '-か', romaji: '-ka' },
    ],
    strokePaths: [
      'M28.25,16.5c0.5,0.75,1.01,1.64,1.01,2.65c0,1.01-0.34,69.6-0.34,70.1',
      'M30.27,18.75c3.23-0.25,40.73-3.75,43.67-4c2.45-0.21,4.06,1.45,4.06,3.25c0,4.25-0.75,47.5-0.75,70.75',
      'M30.25,50.75c8.75-0.5,37.25-2.75,46.5-2.75',
      'M29.5,86.5c9.25,0,36.5-2.25,47-2.25',
    ],
    examples: [
      { word: '日本', furigana: 'にほん', romaji: 'nihon', meaning: 'Japan' },
      { word: '今日', furigana: 'きょう', romaji: 'kyou', meaning: 'Heute' },
      { word: '日曜日', furigana: 'にちようび', romaji: 'nichiyoubi', meaning: 'Sonntag' },
    ],
    sentences: [
      {
        japanese: '今日はいい天気ですね。',
        furigana: 'きょうは いいてんき ですね。',
        meaning: 'Heute ist schönes Wetter, nicht wahr?',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-2',
    kanji: '月',
    primaryMeaning: 'Mond, Monat',
    meanings: ['Mond', 'Monat', 'Montag'],
    strokeCount: 4,
    jlpt: 'N5',
    radical: {
      symbol: '月',
      name: 'つき (tsuki)',
      meaning: 'Mond',
    },
    onyomi: [
      { kana: 'ゲツ', romaji: 'getsu' },
      { kana: 'ガツ', romaji: 'gatsu' },
    ],
    kunyomi: [
      { kana: 'つき', romaji: 'tsuki' },
    ],
    strokePaths: [
      'M32.22,17c0.88,0.88,1.3,2.15,1.31,3.41C33.75,54.75,30,80,16.25,93.5',
      'M34.25,18.75c2.61-0.21,32.75-3.5,35.34-3.75c2.66-0.25,4.24,1.52,4.24,3.5c0,6.62-0.08,49.25-0.08,68c0,11.75-5.75,3.75-7.5,2',
      'M34.75,40.25c8.25-0.75,25.5-2,33.5-2.25',
      'M33.75,61.25c7.75-0.5,26.5-1.75,34.5-2',
    ],
    examples: [
      { word: '月曜日', furigana: 'げつようび', romaji: 'getsuyoubi', meaning: 'Montag' },
      { word: '今月', furigana: 'こんげつ', romaji: 'kongetsu', meaning: 'Diesen Monat' },
      { word: '一月', furigana: 'いちがつ', romaji: 'ichigatsu', meaning: 'Januar' },
    ],
    sentences: [
      {
        japanese: '今夜は月がとてもきれいです。',
        furigana: 'こんやは つきが とても きれいです。',
        meaning: 'Heute Abend ist der Mond wunderschön.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-3',
    kanji: '木',
    primaryMeaning: 'Baum, Holz',
    meanings: ['Baum', 'Holz', 'Donnerstag'],
    strokeCount: 4,
    jlpt: 'N5',
    radical: {
      symbol: '木',
      name: 'き (ki)',
      meaning: 'Baum',
    },
    onyomi: [
      { kana: 'ボク', romaji: 'boku' },
      { kana: 'モク', romaji: 'moku' },
    ],
    kunyomi: [
      { kana: 'き', romaji: 'ki' },
      { kana: 'こ-', romaji: 'ko-' },
    ],
    strokePaths: [
      'M13.75,40.22c2.25,0.53,5.17,0.47,7.27,0.22c15.73-1.89,45.86-5.06,63.1-6.19c2.32-0.15,4.63-0.25,6.88,0.31',
      'M52.5,12.5c1.25,1.25,1.75,3.25,1.75,5.25c0,4.75-0.25,67.75-0.25,72.5c0,11.5-5.25,3-7,1.25',
      'M52.5,40.25C44.38,53.25,29.75,69.62,15.75,76.5',
      'M55.25,42.5c6.25,5.75,23.5,21.5,32.25,28.25c2.1,1.62,4.25,2.75,6.5,3.25',
    ],
    examples: [
      { word: '木曜日', furigana: 'もくようび', romaji: 'mokuyoubi', meaning: 'Donnerstag' },
      { word: '大木', furigana: 'たいぼく', romaji: 'taiboku', meaning: 'Großer Baum' },
      { word: '木造', furigana: 'もくぞう', romaji: 'mokuzou', meaning: 'Holzbau / hölzern' },
    ],
    sentences: [
      {
        japanese: '庭に大きな木があります。',
        furigana: 'にわに おおきな きが あります。',
        meaning: 'Im Garten steht ein großer Baum.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-4',
    kanji: '山',
    primaryMeaning: 'Berg',
    meanings: ['Berg', 'Gebirge'],
    strokeCount: 3,
    jlpt: 'N5',
    radical: {
      symbol: '山',
      name: 'やま (yama)',
      meaning: 'Berg',
    },
    onyomi: [
      { kana: 'サン', romaji: 'san' },
      { kana: 'ザン', romaji: 'zan' },
    ],
    kunyomi: [
      { kana: 'やま', romaji: 'yama' },
    ],
    strokePaths: [
      'M52.75,13.75c1.25,1.25,2,2.75,2,4.5c0,9.75-0.25,48.25-0.25,56.75',
      'M23.75,41.25c0.75,0.75,1.25,2,1.25,3.25c0,6.5-0.5,24.25-1,31c-0.25,3.5,1,4.5,4,4.25c16.25-1.5,43.25-3.5,53.25-3.75',
      'M81.25,38.25c1,1,1.5,2.25,1.5,3.75c0,6.25-0.25,25.25-0.25,33.75',
    ],
    examples: [
      { word: '富士山', furigana: 'ふじさん', romaji: 'fujisan', meaning: 'Berg Fuji' },
      { word: '山道', furigana: 'やまみち', romaji: 'yamamichi', meaning: 'Bergpfad' },
      { word: '火山', furigana: 'かざん', romaji: 'kazan', meaning: 'Vulkan' },
    ],
    sentences: [
      {
        japanese: '週末に山へ登りました。',
        furigana: 'しゅうまつに やまへ のぼりました。',
        meaning: 'Am Wochenende bin ich auf einen Berg gestiegen.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-5',
    kanji: '川',
    primaryMeaning: 'Fluss, Strom',
    meanings: ['Fluss', 'Strom', 'Bach'],
    strokeCount: 3,
    jlpt: 'N5',
    radical: {
      symbol: '川',
      name: 'かわ (kawa)',
      meaning: 'Fluss',
    },
    onyomi: [
      { kana: 'セン', romaji: 'sen' },
    ],
    kunyomi: [
      { kana: 'かわ', romaji: 'kawa' },
    ],
    strokePaths: [
      'M27.75,21.25c0.75,0.75,1.25,2.25,1.25,3.5c0,15.25-1.75,44.75-12.75,59.25',
      'M50.75,29.75c0.88,0.88,1.25,2.25,1.25,3.75c0,9.25-0.25,27.5-0.25,38.75',
      'M78.25,15.75c1.25,1.25,1.5,2.75,1.5,4.75c0,13.75-0.25,60.25-0.25,67.75',
    ],
    examples: [
      { word: '川岸', furigana: 'かわぎし', romaji: 'kawagishi', meaning: 'Flussufer' },
      { word: '小川', furigana: 'おがわ', romaji: 'ogawa', meaning: 'Bächlein' },
      { word: '河川', furigana: 'かせん', romaji: 'kasen', meaning: 'Flüsse und Gewässer' },
    ],
    sentences: [
      {
        japanese: '川で魚が泳いでいます。',
        furigana: 'かわで さかなが およいでいます。',
        meaning: 'Im Fluss schwimmen Fische.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-6',
    kanji: '火',
    primaryMeaning: 'Feuer, Flamme',
    meanings: ['Feuer', 'Flamme', 'Dienstag'],
    strokeCount: 4,
    jlpt: 'N5',
    radical: {
      symbol: '火',
      name: 'ひ (hi)',
      meaning: 'Feuer',
    },
    onyomi: [
      { kana: 'カ', romaji: 'ka' },
    ],
    kunyomi: [
      { kana: 'ひ', romaji: 'hi' },
      { kana: '-び', romaji: '-bi' },
      { kana: 'ほ-', romaji: 'ho-' },
    ],
    strokePaths: [
      'M30.25,37.25c2.25,3.75,5.5,14.5,5.75,18.25',
      'M74.25,30.5c0.12,0.88,0,2.12-0.62,3.12c-2.38,3.75-7.75,10.62-12.38,14.38',
      'M52.5,14.25c1.25,1.25,1.75,3.25,1.75,5.25C54.25,48.5,46.75,76,21.5,88.75',
      'M53.25,50.25c8.75,10.75,22.25,25.5,30.75,32.25c2.5,2,5.25,3.5,8.25,4.5',
    ],
    examples: [
      { word: '火曜日', furigana: 'かようび', romaji: 'kayoubi', meaning: 'Dienstag' },
      { word: '花火', furigana: 'はなび', romaji: 'hanabi', meaning: 'Feuerwerk' },
      { word: '火事', furigana: 'かじ', romaji: 'kaji', meaning: 'Großbrand / Feuersbrunst' },
    ],
    sentences: [
      {
        japanese: '夏休みに花火を見ました。',
        furigana: 'なつやすみに はなびを みました。',
        meaning: 'In den Sommerferien habe ich mir ein Feuerwerk angesehen.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-7',
    kanji: '水',
    primaryMeaning: 'Wasser, Flüssigkeit',
    meanings: ['Wasser', 'Flüssigkeit', 'Mittwoch'],
    strokeCount: 4,
    jlpt: 'N5',
    radical: {
      symbol: '水',
      name: 'みず (mizu)',
      meaning: 'Wasser',
    },
    onyomi: [
      { kana: 'スイ', romaji: 'sui' },
    ],
    kunyomi: [
      { kana: 'みず', romaji: 'mizu' },
    ],
    strokePaths: [
      'M52.75,13.75c1.25,1.25,2,2.75,2,4.75c0,16.5-0.25,62.75-0.25,68.25c0,11.5-6.5,2.25-8.25,0.75',
      'M21.25,39.75c1.5,0.75,3.25,0.75,4.75,0.25c4.75-1.75,10.5-3.75,14.75-5.25c2.25-0.75,3.75,0.5,3,3c-3.5,11.25-10.75,29.5-22.5,38.75',
      'M77.75,25.25c0.12,0.88-0.12,2-0.88,3.12c-4.25,6.5-11.75,15.75-20.12,20.88',
      'M55.25,42.5c5.75,7.75,19.25,25.25,27.75,33.5c2.62,2.5,5.5,4.75,8.75,6.25',
    ],
    examples: [
      { word: '水曜日', furigana: 'すいようび', romaji: 'suiyoubi', meaning: 'Mittwoch' },
      { word: '水着', furigana: 'みずぎ', romaji: 'mizugi', meaning: 'Badekleidung' },
      { word: '水泳', furigana: 'すいえい', romaji: 'suiei', meaning: 'Schwimmen' },
    ],
    sentences: [
      {
        japanese: '冷たい水を一杯ください。',
        furigana: 'つめたい みずを いっぱいください。',
        meaning: 'Bitte ein Glas kaltes Wasser.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-8',
    kanji: '人',
    primaryMeaning: 'Mensch, Person',
    meanings: ['Mensch', 'Person', 'Leute'],
    strokeCount: 2,
    jlpt: 'N5',
    radical: {
      symbol: '人',
      name: 'ひと (hito)',
      meaning: 'Mensch',
    },
    onyomi: [
      { kana: 'ジン', romaji: 'jin' },
      { kana: 'ニン', romaji: 'nin' },
    ],
    kunyomi: [
      { kana: 'ひと', romaji: 'hito' },
    ],
    strokePaths: [
      'M53.25,16.5c0.88,1.62,1.25,3.25,1.25,5.25c0,20.5-6.25,54.75-29.25,68.25',
      'M51.5,45.25c8.25,11.5,21.25,27.75,30.75,35.5c2.75,2.25,5.75,4.25,9,5.75',
    ],
    examples: [
      { word: '日本人', furigana: 'にほんじん', romaji: 'nihonjin', meaning: 'Japaner(in)' },
      { word: '大人', furigana: 'おとな', romaji: 'otona', meaning: 'Erwachsener' },
      { word: '一人', furigana: 'ひとり', romaji: 'hitori', meaning: 'Eine Person / allein' },
    ],
    sentences: [
      {
        japanese: 'あの人はとても親切です。',
        furigana: 'あのひとは とても しんせつです。',
        meaning: 'Diese Person ist sehr freundlich.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-9',
    kanji: '金',
    primaryMeaning: 'Gold, Metall, Geld',
    meanings: ['Gold', 'Metall', 'Geld', 'Freitag'],
    strokeCount: 8,
    jlpt: 'N5',
    radical: {
      symbol: '金',
      name: 'かね (kane)',
      meaning: 'Metall / Gold',
    },
    onyomi: [
      { kana: 'キン', romaji: 'kin' },
      { kana: 'コン', romaji: 'kon' },
    ],
    kunyomi: [
      { kana: 'かね', romaji: 'kane' },
      { kana: 'かな-', romaji: 'kana-' },
    ],
    strokePaths: [
      'M50.75,12.75c0.12,0.88-0.12,2.25-0.88,3.38C44.75,23.5,31.25,38.5,17.25,47.75',
      'M52.5,18.75c6.25,5.5,23.25,21.5,31.75,27.5c2.5,1.75,5.25,3.25,8.25,4.25',
      'M35.25,40.75c1.5,0.5,3.5,0.25,5,0.25c7.25-0.25,17.75-1.75,25.75-2.25c1.75-0.12,3.5-0.25,5.25,0.12',
      'M26.75,54.75c1.75,0.75,4.25,0.5,6,0.25c11.5-1.5,27.25-3.25,41-4.25c2-0.15,4-0.12,6,0.38',
      'M51.75,42.25c1.12,1.12,1.5,2.62,1.5,4.25c0,16.5-0.25,36-0.25,41.25',
      'M36.25,64.25c3.25,4.25,5.25,9.25,6,12',
      'M68.75,59.75c0.25,0.88,0.12,2.12-0.5,3c-2.25,3.25-5.5,7.5-8.75,10.75',
      'M21.25,89.25c2.5,0.88,6,0.75,8.5,0.5c16.25-1.5,36.5-2.75,53.25-3.25c2.75-0.12,5.75,0.12,8.25,0.88',
    ],
    examples: [
      { word: '金曜日', furigana: 'きんようび', romaji: 'kinyoubi', meaning: 'Freitag' },
      { word: 'お金', furigana: 'おかね', romaji: 'okane', meaning: 'Geld' },
      { word: '料金', furigana: 'りょうきん', romaji: 'ryoukin', meaning: 'Gebühr / Preis' },
    ],
    sentences: [
      {
        japanese: '金曜日の夜に友達と会います。',
        furigana: 'きんようびの よるに ともだちと あいます。',
        meaning: 'Freitagabend treffe ich mich mit Freunden.',
      },
    ],
    status: 'learning',
  },
  {
    id: 'kanji-n5-10',
    kanji: '土',
    primaryMeaning: 'Erde, Boden',
    meanings: ['Erde', 'Boden', 'Samstag'],
    strokeCount: 3,
    jlpt: 'N5',
    radical: {
      symbol: '土',
      name: 'つち (tsuchi)',
      meaning: 'Erde',
    },
    onyomi: [
      { kana: 'ド', romaji: 'do' },
      { kana: 'ト', romaji: 'to' },
    ],
    kunyomi: [
      { kana: 'つち', romaji: 'tsuchi' },
    ],
    strokePaths: [
      'M27.75,44.25c2.25,0.75,4.75,0.5,7,0.25c11.25-1.25,26.5-2.75,37.25-3.5c2.25-0.15,4.5-0.12,6.75,0.38',
      'M50.75,17.25c1.25,1.25,1.75,2.88,1.75,4.88c0,18.5-0.25,52.25-0.25,57.25',
      'M18.25,81.75c3.25,0.88,7.25,0.62,10.5,0.38c20.25-1.5,39.5-2.75,57.75-3.25c3.25-0.12,6.75,0.25,9.75,1.12',
    ],
    examples: [
      { word: '土曜日', furigana: 'どようび', romaji: 'doyoubi', meaning: 'Samstag' },
      { word: '土地', furigana: 'とち', romaji: 'tochi', meaning: 'Grundstück / Land' },
      { word: 'お土産', furigana: 'おみやげ', romaji: 'omiyage', meaning: 'Mitbringsel / Souvenir' },
    ],
    sentences: [
      {
        japanese: '土曜日は休みです。',
        furigana: 'どようびは やすみです。',
        meaning: 'Samstag habe ich frei.',
      },
    ],
    status: 'learning',
  },
];
