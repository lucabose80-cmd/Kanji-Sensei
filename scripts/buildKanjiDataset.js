import fs from 'node:fs';
import path from 'node:path';

// Comprehensive Kana to Romaji converter
const KANA_ROMAJI_MAP = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
};

// Katakana to Hiragana converter
function katakanaToHiragana(str) {
  return str.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

// Convert Katakana string to clean Katakana
function hiraganaToKatakana(str) {
  return str.replace(/[\u3041-\u3096]/g, match => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

function kanaToRomaji(kanaStr) {
  if (!kanaStr) return '';
  const prefix = kanaStr.startsWith('-') ? '-' : '';
  const suffix = kanaStr.endsWith('-') ? '-' : '';
  const clean = katakanaToHiragana(kanaStr.replace(/^[-.!]+|[-.!]+$/g, '').replace(/[.-]/g, ''));
  let result = '';
  let i = 0;
  while (i < clean.length) {
    if (i + 1 < clean.length && KANA_ROMAJI_MAP[clean.slice(i, i + 2)]) {
      result += KANA_ROMAJI_MAP[clean.slice(i, i + 2)];
      i += 2;
    } else if (clean[i] === 'っ' || clean[i] === 'ッ') {
      const nextKana = clean[i + 1];
      if (nextKana) {
        const nextRomaji = kanaToRomaji(nextKana);
        result += nextRomaji[0] || 't';
      }
      i++;
    } else if (clean[i] === 'ー') {
      const last = result[result.length - 1];
      if (['a', 'i', 'u', 'e', 'o'].includes(last)) {
        result += last;
      }
      i++;
    } else if (KANA_ROMAJI_MAP[clean[i]]) {
      result += KANA_ROMAJI_MAP[clean[i]];
      i++;
    } else {
      result += clean[i];
      i++;
    }
  }
  return prefix + result + suffix;
}

const NOISE_FILTER = [
  'geschlechtsverkehr', 'f-rauschen', 'f-fluktuation', 'vulva', 'penis', 'vagina', 'koitus', 'onanieren', 'schamhaar',
  'passiver part', 'anus', 'anal'
];

function cleanGloss(gloss) {
  if (!gloss) return '';
  const lower = gloss.toLowerCase();
  if (NOISE_FILTER.some(bad => lower.includes(bad))) return '';
  let clean = gloss.replace(/\s*\([^)]*(?:Einwohner|Staat|Inselstaat|Präfektur|Stadt|Bezirk|Provinz|Gebiet|Dynastie|vgl\.|siehe|abgek\.|ugs\.|vertraulicher|hauptsächlich)[^)]*\)/gi, '').trim();
  if (clean.includes(';')) {
    clean = clean.split(';')[0].trim();
  }
  // Strip redundant starting labels
  clean = clean.replace(/^(?:etw\.|jmdn\.|jmdm\.|sich)\s+/i, '');
  return clean;
}

// Fallback dictionary for rare / name kanji German translations
const GERMAN_FALLBACK_MAP = {
  '況': ['Situation', 'Zustand', 'Lage'],
  '塡': ['ausfüllen', 'stopfen', 'einsetzen'],
  '浩': ['weit', 'groß', 'Überfluss'],
  '煕': ['scheinen', 'glänzen', 'hell'],
  '宏': ['weit', 'groß', 'geräumig'],
  '靖': ['friedlich', 'ruhig', 'besänftigen'],
  '也': ['sein', 'auch'],
  '磯': ['Küste', 'Meeresküste', 'Felsenstrand'],
  '孜': ['fleißig', 'emsig', 'bemüht'],
  '盧': ['Hütte', 'Reisnapf'],
  '聡': ['weise', 'klug', 'einsichtig'],
  '趙': ['flink', 'schnell'],
  '嶌': ['Insel'],
  '堺': ['Grenze', 'Sakai (Stadt)'],
  '湘': ['Xiang-Fluss', 'Küste'],
  '劉': ['töten', 'schlagen', 'Liu (Name)'],
  '諏': ['befragen', 'beraten', 'Suwa'],
  '崔': ['steil', 'hoch', 'Cui (Name)'],
  '赳': ['tapfer', 'kühn', 'mutig'],
  '鴈': ['Wildgans'],
  '尭': ['erhaben', 'weise', 'Yao (Kaiser)'],
  '彬': ['gebildet', 'fein', 'kultiviert'],
  '尹': ['Beamter', 'Lenker', 'Verwalter'],
  '旛': ['Banner', 'Fahne'],
  '蒋': ['Schilfrohr', 'Jiang (Name)'],
  '襄': ['erheben', 'helfen', 'vollenden'],
  '笘': ['Bambusstäbchen', 'Schreibtafel'],
  '宍': ['Fleisch'],
  '銕': ['Eisen (alte Form)'],
  '鄒': ['Zou (alter Staat)'],
  '蔡': ['Cai (alter Staat)', 'Schildkröte'],
  '塙': ['Hügel', 'Anhöhe'],
  '溥': ['weit reichend', 'allumfassend'],
  '厦': ['großes Gebäude', 'Halle', 'Xiamen'],
};

// Curated high quality compounds for kanji with few entries in basic dictionaries
const EXTRA_COMPOUNDS = {
  '摯': [
    { word: '真摯', reading: 'しんし', meaning: 'aufrichtig / ernsthaft' },
    { word: '摯実', reading: 'しじつ', meaning: 'Aufrichtigkeit' }
  ],
  '朕': [
    { word: '朕', reading: 'ちん', meaning: 'Wir (kaiserliches Majestätsplural)' },
    { word: '朕意', reading: 'ちんい', meaning: 'kaiserlicher Wille' }
  ],
  '堺': [
    { word: '堺市', reading: 'さかいし', meaning: 'Stadt Sakai' },
    { word: '堺', reading: 'さかい', meaning: 'Sakai / Grenze' }
  ],
  '湘': [
    { word: '湘南', reading: 'しょうなん', meaning: 'Shonan (Küstenregion)' },
    { word: '湘江', reading: 'しょうこう', meaning: 'Xiang-Fluss' }
  ],
  '肇': [
    { word: '肇国', reading: 'ちょうこく', meaning: 'Staatsgründung' },
    { word: '肇始', reading: 'ちょうし', meaning: 'Beginn / Anfang' }
  ],
  '劉': [
    { word: '劉', reading: 'りゅう', meaning: 'Liu (Familienname)' },
    { word: '劉邦', reading: 'りゅうほう', meaning: 'Liu Bang (Han-Kaiser)' }
  ],
  '諏': [
    { word: '諏訪', reading: 'すわ', meaning: 'Suwa (Region in Nagano)' },
    { word: '諏訪湖', reading: 'すわこ', meaning: 'Suwa-See' }
  ],
  '亨': [
    { word: '元亨', reading: 'げんこう', meaning: 'Genko-Ära' },
    { word: '亨通', reading: 'こうつう', meaning: 'Gelingen / reibungsloser Ablauf' }
  ],
  '喬': [
    { word: '喬木', reading: 'きょうぼく', meaning: 'hoher Baum / Hochstamm' },
    { word: '遷喬', reading: 'せんきょう', meaning: 'Beförderung / Aufstieg' }
  ],
  '槻': [
    { word: '槻', reading: 'つき', meaning: 'Zelkove (Baumart)' },
    { word: '槻木', reading: 'つきのき', meaning: 'Zelkovengehölz' }
  ],
  '箕': [
    { word: '唐箕', reading: 'とうみ', meaning: 'Worfelmaschine / Kornschwinge' },
    { word: '箕', reading: 'み', meaning: 'Getreideschwinge' }
  ],
  '巽': [
    { word: '巽', reading: 'たつみ', meaning: 'Südosten' },
    { word: '巽風', reading: 'そんぷう', meaning: 'Südostwind' }
  ],
  '禎': [
    { word: '嘉禎', reading: 'かてい', meaning: 'Katei-Ära' },
    { word: '禎祥', reading: 'ていしょう', meaning: 'Glück bringendes Vorzeichen' }
  ],
  '牟': [
    { word: '釈迦牟尼', reading: 'しゃかむに', meaning: 'Shakyamuni (Buddha)' },
    { word: '牟呼', reading: 'むこ', meaning: 'Muho' }
  ],
  '榊': [
    { word: '榊', reading: 'さかき', meaning: 'Sakaki (heiliger Shinto-Zweig)' },
    { word: '神榊', reading: 'かみさかき', meaning: 'Opferzweig vor dem Altar' }
  ],
  '赳': [
    { word: '赳々', reading: 'きゅうきゅう', meaning: 'tapfer und entschlossen' },
    { word: '赳武', reading: 'きゅうぶ', meaning: 'kriegerische Tapferkeit' }
  ],
  '尭': [
    { word: '堯舜', reading: 'ぎょうしゅん', meaning: 'Yao und Shun (weise Urkaiser)' },
    { word: '尭天', reading: 'ぎょうてん', meaning: 'friedvolle Herrschaft' }
  ],
  '彬': [
    { word: '彬々', reading: 'ひんぴん', meaning: 'gebildet und anmutig' },
    { word: '彬雅', reading: 'ひんが', meaning: 'kultiviert' }
  ],
  '匡': [
    { word: '匡体', reading: 'きょうたい', meaning: 'Gehäuse' },
    { word: '匡正', reading: 'きょうせい', meaning: 'Zurechtweisung / Korrektur' }
  ],
  '嵯': [
    { word: '嵯峨', reading: 'さが', meaning: 'Saga (Bezirk in Kyoto)' },
    { word: '嵯峨野', reading: 'さがの', meaning: 'Sagano-Ebene' }
  ],
  '珂': [
    { word: '馬珂貝', reading: 'ばかがい', meaning: 'Trogmuschel' },
    { word: '珂珮', reading: 'かはい', meaning: 'Jadegürtelschmuck' }
  ],
  '宕': [
    { word: '豪宕', reading: 'ごうとう', meaning: 'freigeistig und ungebunden' },
    { word: '愛宕', reading: 'あたご', meaning: 'Atago (Berg bei Kyoto)' }
  ],
  '脩': [
    { word: '束脩', reading: 'そくしゅう', meaning: 'Schulhonorar / Unterrichtsgeld' },
    { word: '脩身', reading: 'しゅうしん', meaning: 'Sittlichkeit / Selbstzucht' }
  ],
  '塙': [
    { word: '塙', reading: 'はなわ', meaning: 'Hanawa (Hügel / Ortsname)' },
    { word: '塙台', reading: 'はなわだい', meaning: 'Hochebene' }
  ],
  '煕': [
    { word: '康煕字典', reading: 'こうきじてん', meaning: 'Kangxi-Wörterbuch' },
    { word: '煕和', reading: 'きわ', meaning: 'Friede und Eintracht' }
  ],
  '渕': [
    { word: '渕', reading: 'ふち', meaning: 'tiefe Stelle im Fluss / Strudel' },
    { word: '淵渕', reading: 'えんえん', meaning: 'unergründliche Tiefe' }
  ],
  '趙': [
    { word: '趙', reading: 'ちょう', meaning: 'Staat Zhao (chinesische Geschichte)' },
    { word: '趙国', reading: 'ちょうこく', meaning: 'Königreich Zhao' }
  ],
  '嶌': [
    { word: '大嶌', reading: 'おおしま', meaning: 'Oshima (Familien- und Ortsname)' },
    { word: '嶌', reading: 'しま', meaning: 'Insel (alte Schreibform)' }
  ],
  '崔': [
    { word: '崔', reading: 'さい', meaning: 'Cui / Choi (Familienname)' },
    { word: '崔嵬', reading: 'さいかい', meaning: 'zerklüftete Felsenhöhe' }
  ],
  '僑': [
    { word: '華僑', reading: 'かきょう', meaning: 'Auslandschinesen' },
    { word: '僑居', reading: 'きょうきょ', meaning: 'vorübergehender Wohnsitz' }
  ],
  '鴈': [
    { word: '鴈', reading: 'がん', meaning: 'Wildgans' },
    { word: '落鴈', reading: 'らくがん', meaning: 'landende Wildgänse' }
  ],
  '尹': [
    { word: '尹', reading: 'いん', meaning: 'Verwalter / Minister' },
    { word: '府尹', reading: 'ふいん', meaning: 'Präfekturgouverneur' }
  ],
  '瀋': [
    { word: '瀋陽', reading: 'しんよう', meaning: 'Shenyang (Stadt in China)' },
    { word: '瀋液', reading: 'しんえき', meaning: 'ausgepresster Saft' }
  ],
  '橿': [
    { word: '橿原', reading: 'かしはら', meaning: 'Kashihara (Stadt in Nara)' },
    { word: '橿', reading: 'かし', meaning: 'Immergrüne Eiche' }
  ],
  '旛': [
    { word: '旗旛', reading: 'きはん', meaning: 'Fahnen und Banner' },
    { word: '旛竿', reading: 'ばんかん', meaning: 'Bannerstange' }
  ],
  '蒋': [
    { word: '蒋介石', reading: 'しょうかいせき', meaning: 'Chiang Kai-shek' },
    { word: '蒋', reading: 'まこも', meaning: 'Wasserhafer (Wildreisart)' }
  ],
  '襄': [
    { word: '襄陽', reading: 'じょうよう', meaning: 'Xiangyang (Stadt)' },
    { word: '賛襄', reading: 'さんじょう', meaning: 'Unterstützung / Beistand' }
  ],
  '笘': [
    { word: '笘', reading: 'せん', meaning: 'Schreibtafel aus Bambus' },
    { word: '笘簿', reading: 'せんぼ', meaning: 'Bambus-Register' }
  ],
  '宍': [
    { word: '宍道湖', reading: 'しんじこ', meaning: 'Shinji-See (in Shimane)' },
    { word: '宍', reading: 'しし', meaning: 'Fleisch / Wildbret' }
  ],
  '簗': [
    { word: '簗', reading: 'やな', meaning: 'Fischreuse / Wehr' },
    { word: '鮎簗', reading: 'あゆやな', meaning: 'Ayu-Fischwehr' }
  ],
  '銕': [
    { word: '銕', reading: 'てつ', meaning: 'Eisen (historische Schreibform)' },
    { word: '銕器', reading: 'てっき', meaning: 'Eisengerät' }
  ],
  '鄒': [
    { word: '鄒', reading: 'すう', meaning: 'Staat Zou (in der Zhou-Dynastie)' },
    { word: '鄒子', reading: 'すうし', meaning: 'Meister Zou' }
  ],
  '蔡': [
    { word: '蔡', reading: 'さい', meaning: 'Staat Cai / Name' },
    { word: '蔡侯', reading: 'さいこう', meaning: 'Fürst von Cai' }
  ],
  '咸': [
    { word: '咸豊', reading: 'かんぽう', meaning: 'Xianfeng-Ära' },
    { word: '咸宜', reading: 'かんぎ', meaning: 'allseitige Eignung' }
  ],
  '茗': [
    { word: '茗荷', reading: 'みょうが', meaning: 'Myoga (japanischer Blüteningwer)' },
    { word: '茗茶', reading: 'めいちゃ', meaning: 'hochwertiger Tee' }
  ],
  '溥': [
    { word: '溥儀', reading: 'ふぎ', meaning: 'Puyi (letzter Kaiser Chinas)' },
    { word: '溥博', reading: 'ふはく', meaning: 'allumfassend und weit' }
  ],
  '楠': [
    { word: '楠', reading: 'くすのき', meaning: 'Kampferbaum' },
    { word: '楠木', reading: 'くすのき', meaning: 'Kampferholz' },
    { word: '楠正成', reading: 'くすのきまさしげ', meaning: 'Kusunoki Masashige' }
  ],
  '叶': [
    { word: '叶う', reading: 'かなう', meaning: 'in Erfüllung gehen' },
    { word: '叶える', reading: 'かなえる', meaning: 'erfüllen / verwirklichen' }
  ],
  '碓': [
    { word: '碓氷峠', reading: 'うすいとうげ', meaning: 'Usui-Pass' },
    { word: '水碓', reading: 'すいかく', meaning: 'Wassermühle' }
  ],
  '嶋': [
    { word: '嶋', reading: 'しま', meaning: 'Insel (Variante)' },
    { word: '鹿嶋', reading: 'かしま', meaning: 'Kashima' }
  ],
  '盧': [
    { word: '盧', reading: 'いおり', meaning: 'Hütte' },
    { word: '盧溝橋', reading: 'ろこうきょう', meaning: 'Lugou-Brücke (Marco-Polo-Brücke)' }
  ],
  '鴎': [
    { word: '鴎', reading: 'かもめ', meaning: 'Möwe' },
    { word: '白鴎', reading: 'はくおう', meaning: 'weiße Möwe' }
  ],
  '笏': [
    { word: '笏', reading: 'しゃく', meaning: 'Zeremonienszepter (Shinto)' },
    { word: '玉笏', reading: 'ぎょくしゃく', meaning: 'Jadeszepter' }
  ],
  '厦': [
    { word: '厦門', reading: 'アモイ', meaning: 'Xiamen (Amoy)' },
    { word: '大厦', reading: 'たいか', meaning: 'prächtiges Herrenhaus' }
  ],
};

function parseCuratedJoyoWords(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const map = new Map();
  let currentKanji = null;
  let inQuotes = false;
  let currentList = [];

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!inQuotes) {
      const match = line.match(/^([^\s]+)\s+[^\s]+\s+[^\s]+\s+"(.*)$/);
      if (match) {
        currentKanji = match[1];
        currentList = [];
        inQuotes = true;
        const rest = match[2];
        if (rest) {
          const isEnd = rest.endsWith('"');
          const cleanRest = isEnd ? rest.slice(0, -1) : rest;
          const parts = cleanRest.split(' - ');
          if (parts.length >= 2) {
            currentList.push({
              word: parts[0].trim(),
              reading: parts[1].trim(),
              meaning: parts.slice(2).join(' - ').trim()
            });
          }
          if (isEnd) {
            map.set(currentKanji, currentList);
            inQuotes = false;
            currentKanji = null;
          }
        }
      }
    } else {
      const isEnd = line.endsWith('"');
      const cleanLine = isEnd ? line.slice(0, -1) : line;
      const parts = cleanLine.split(' - ');
      if (parts.length >= 2) {
        currentList.push({
          word: parts[0].trim(),
          reading: parts[1].trim(),
          meaning: parts.slice(2).join(' - ').trim()
        });
      }
      if (isEnd) {
        map.set(currentKanji, currentList);
        inQuotes = false;
        currentKanji = null;
      }
    }
  }
  return map;
}

export async function buildDataset() {
  console.log('=== Building Comprehensive Kanji Dataset ===');

  // 1. Fetch raw kanji data (strokes, grade, freq, jlpt, readings)
  console.log('1. Loading davidluzgouveia/kanji-data...');
  const kjRes = await fetch('https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json').then(r => r.json());

  // 2. Fetch RTK German keywords
  console.log('2. Loading RTK German keywords...');
  const rtkText = await fetch('https://raw.githubusercontent.com/shufps/anki2-rtk-lookup/master/rtk_4th_german.txt').then(r => r.text());
  const rtkMap = new Map();
  for (const line of rtkText.split('\n')) {
    const parts = line.split(';');
    if (parts.length >= 2) {
      const k = parts[0].trim();
      const de = parts[1].trim();
      if (k && de) {
        const formatted = de.charAt(0).toUpperCase() + de.slice(1);
        rtkMap.set(k, formatted);
      }
    }
  }
  console.log(`Loaded ${rtkMap.size} German keywords from RTK.`);

  // 3. Load JMdict German
  console.log('3. Loading JMdict German definitions...');
  const jmdictPath = path.resolve('temp/jmdict-ger/jmdict-ger-3.6.2.json');
  if (!fs.existsSync(jmdictPath)) {
    throw new Error(`JMdict German file not found at ${jmdictPath}. Make sure it was unzipped.`);
  }
  const jmdict = JSON.parse(fs.readFileSync(jmdictPath, 'utf8'));

  // Build maps from JMdict
  const singleKanjiDe = new Map();
  const wordsByKanji = new Map();
  const wordDetailsMap = new Map(); // word -> { reading, meaning, common }

  for (const w of jmdict.words) {
    const kanjiList = w.kanji || [];
    const kanaList = w.kana || [];
    const glosses = [];
    for (const s of (w.sense || [])) {
      for (const g of (s.gloss || [])) {
        if (g.text) {
          const c = cleanGloss(g.text);
          if (c && !glosses.includes(c)) glosses.push(c);
        }
      }
    }
    if (!glosses.length) continue;

    const isCommon = kanjiList.some(k => k.common) || kanaList.some(k => k.common);
    const reading = kanaList[0]?.text || '';

    for (const k of kanjiList) {
      const text = k.text;
      if (!wordDetailsMap.has(text) || (isCommon && !wordDetailsMap.get(text).common)) {
        wordDetailsMap.set(text, { reading, meaning: glosses[0], common: isCommon });
      }

      // Single kanji meanings
      if (text.length === 1) {
        if (!singleKanjiDe.has(text)) singleKanjiDe.set(text, []);
        for (const gl of glosses) {
          if (!singleKanjiDe.get(text).includes(gl)) singleKanjiDe.get(text).push(gl);
        }
      }

      // Record compound words (filter out numbers and non-Japanese)
      if (!text.match(/[0-9a-zA-Z０-９]/)) {
        for (const char of text) {
          if (!wordsByKanji.has(char)) wordsByKanji.set(char, []);
          wordsByKanji.get(char).push({
            word: text,
            reading,
            meaning: glosses[0],
            common: isCommon,
            len: text.length
          });
        }
      }
    }
  }
  console.log(`Indexed ${singleKanjiDe.size} single kanji and ${wordsByKanji.size} kanji words from JMdict.`);

  // Load curated Joyo words
  const curatedJoyoWords = parseCuratedJoyoWords(path.resolve('temp/jouyou-kanji-with-words.csv'));
  console.log(`Loaded curated vocabulary for ${curatedJoyoWords.size} Joyo Kanji.`);

  // 4. Select ~2,500 target Kanji
  // Priority: All 2,136 Joyo (grades 1-8), plus top Jinmeiyo / JLPT / high-frequency
  const joyo = [];
  const nonJoyo = [];
  for (const [k, v] of Object.entries(kjRes)) {
    if (v.grade >= 1 && v.grade <= 8) {
      joyo.push({ kanji: k, ...v });
    } else if ((v.jlpt_new >= 1 && v.jlpt_new <= 5) || (v.freq && v.freq <= 2500)) {
      nonJoyo.push({ kanji: k, ...v });
    }
  }

  // Sort non-Joyo by frequency, then strokes
  nonJoyo.sort((a, b) => {
    const fA = a.freq || 99999;
    const fB = b.freq || 99999;
    if (fA !== fB) return fA - fB;
    return (a.strokes || 1) - (b.strokes || 1);
  });

  const extraNeeded = 2500 - joyo.length; // 364
  const selectedNonJoyo = nonJoyo.slice(0, extraNeeded);
  const targetPool = joyo.concat(selectedNonJoyo);

  console.log(`Selected ${joyo.length} Joyo + ${selectedNonJoyo.length} extra = ${targetPool.length} Kanji.`);

  // Sort target pool in standard educational sequence:
  // Grade 1-6 (Elementary), then Grade 8 (Secondary), then non-Joyo by frequency
  targetPool.sort((a, b) => {
    const gA = a.grade || 99;
    const gB = b.grade || 99;
    if (gA !== gB) return gA - gB;
    const fA = a.freq || 99999;
    const fB = b.freq || 99999;
    if (fA !== fB) return fA - fB;
    return (a.strokes || 1) - (b.strokes || 1);
  });

  // 5. Build final entries
  const finalDataset = targetPool.map((raw, idx) => {
    const char = raw.kanji;
    const rtkDe = rtkMap.get(char);
    const jmDe = singleKanjiDe.get(char) || [];
    const engMeanings = raw.meanings || [];

    // Assemble German meanings
    const meaningsDe = [];
    if (rtkDe) meaningsDe.push(rtkDe);
    for (const m of jmDe) {
      const cleanM = cleanGloss(m);
      if (cleanM && !meaningsDe.some(existing => existing.toLowerCase() === cleanM.toLowerCase())) {
        meaningsDe.push(cleanM);
      }
      if (meaningsDe.length >= 5) break;
    }

    // Fallback if no German yet
    if (meaningsDe.length === 0) {
      if (GERMAN_FALLBACK_MAP[char]) {
        meaningsDe.push(...GERMAN_FALLBACK_MAP[char]);
      } else {
        const firstEn = engMeanings[0] || 'Unbekannt';
        meaningsDe.push(firstEn);
      }
    }

    // On-Readings formatted as: KATAKANA (romaji)
    const onReadings = (raw.readings_on || []).map(r => {
      const cleanKana = hiraganaToKatakana(r.replace(/[.-]/g, ''));
      const romaji = kanaToRomaji(r);
      return `${cleanKana} (${romaji})`;
    });

    // Kun-Readings formatted as: HIRAGANA (romaji)
    const kunReadings = (raw.readings_kun || []).map(r => {
      const romaji = kanaToRomaji(r);
      return `${r} (${romaji})`;
    });

    // Examples: Pick 2-3 best compound words
    const seenWords = new Set();
    const examples = [];

    // Check curated Joyo words first (most authentic pedagogical vocabulary)
    if (curatedJoyoWords.has(char)) {
      for (const cur of curatedJoyoWords.get(char)) {
        if (!seenWords.has(cur.word)) {
          seenWords.add(cur.word);
          // Look up German translation in JMdict if available
          const jmMatch = wordDetailsMap.get(cur.word);
          examples.push({
            word: cur.word,
            reading: jmMatch?.reading || cur.reading,
            meaning: jmMatch?.meaning || cur.meaning
          });
        }
        if (examples.length >= 3) break;
      }
    }

    // If still under 3 examples, pull from JMdict compound pool
    if (examples.length < 3) {
      const rawWords = (wordsByKanji.get(char) || []);
      // Prefer: common starting with char, then other common len 2, len 3
      const startsCommon = rawWords.filter(w => w.common && w.word.startsWith(char) && w.len === 2);
      const otherCommon2 = rawWords.filter(w => w.common && !w.word.startsWith(char) && w.len === 2);
      const common3 = rawWords.filter(w => w.common && w.len === 3);
      const otherWords = rawWords.filter(w => !w.common && w.len === 2);

      const candidateWords = [...startsCommon, ...otherCommon2, ...common3, ...otherWords];
      for (const cw of candidateWords) {
        if (!seenWords.has(cw.word) && cw.meaning) {
          seenWords.add(cw.word);
          examples.push({
            word: cw.word,
            reading: cw.reading,
            meaning: cw.meaning
          });
        }
        if (examples.length >= 3) break;
      }
    }

    // If still less than 2, check curated extra compounds
    if (examples.length < 2 && EXTRA_COMPOUNDS[char]) {
      for (const ec of EXTRA_COMPOUNDS[char]) {
        if (!seenWords.has(ec.word)) {
          seenWords.add(ec.word);
          examples.push(ec);
        }
        if (examples.length >= 3) break;
      }
    }

    // Fallback if still under 2: synthesize reading word from character
    if (examples.length < 2) {
      const kun = raw.readings_kun?.[0]?.replace(/[.-]/g, '') || '';
      const on = katakanaToHiragana(raw.readings_on?.[0]?.replace(/[.-]/g, '') || '');
      const m1 = meaningsDe[0] || 'Grundbedeutung';
      const m2 = meaningsDe[1] || m1;

      if (kun && !seenWords.has(`${char}-${kun}`)) {
        seenWords.add(`${char}-${kun}`);
        examples.push({
          word: char,
          reading: kun,
          meaning: m1
        });
      }
      if (examples.length < 2 && on && !seenWords.has(`${char}-${on}`)) {
        seenWords.add(`${char}-${on}`);
        examples.push({
          word: char,
          reading: on,
          meaning: m2
        });
      }
      if (examples.length < 2) {
        examples.push({
          word: char,
          reading: kun || on || 'よみ',
          meaning: m1
        });
      }
    }

    // JLPT level: 1 to 5 (or null if not categorized)
    const jlpt = raw.jlpt_new ? Number(raw.jlpt_new) : (raw.jlpt_old ? Number(5 - raw.jlpt_old + 1) : null);
    // Grade: 1..6 for elementary, 8 for secondary, or null for Jinmeiyo / extra
    const grade = (raw.grade >= 1 && raw.grade <= 6) || raw.grade === 8 ? Number(raw.grade) : null;

    return {
      id: idx + 1,
      kanji: char,
      meanings_de: meaningsDe,
      meanings_en: engMeanings,
      on_readings: onReadings,
      kun_readings: kunReadings,
      strokes: raw.strokes || 1,
      jlpt: jlpt,
      grade: grade,
      examples: examples.slice(0, 3)
    };
  });

  console.log(`Generated ${finalDataset.length} complete Kanji entries.`);

  // 6. Write to src/data/kanjiData.json
  const outPath = path.resolve('src/data/kanjiData.json');
  fs.writeFileSync(outPath, JSON.stringify(finalDataset, null, 2), 'utf8');
  const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Saved ${outPath} (${sizeMb} MB)`);

  return finalDataset;
}

// Execute when run directly
buildDataset().catch(err => {
  console.error('Build dataset error:', err);
  process.exit(1);
});
