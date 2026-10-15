const fs = require('fs');
const path = require('path');

const krad = require('../kradfile-3.6.2.json').kanji;
const myKanji = require('../src/data/kanjiData.json');

// Meanings for all 243 radicals
const radicalNames = {
  // Radicals with manual definitions
  'ノ': 'Strich',
  '｜': 'Vertikalstrich',
  '凵': 'Behälter',
  '儿': 'Beine',
  '卜': 'Orakel',
  '囗': 'Gehege',
  'ハ': 'Acht / Trennen',
  '个': 'Einzeln / Pfeil',
  '并': 'Verbinden',
  '冖': 'Krone / Haube',
  '冂': 'Grenze',
  '亠': 'Deckel',
  '气': 'Dampf / Geist',
  '丶': 'Punkt',
  '匕': 'Löffel',
  '亅': 'Haken',
  '宀': 'Dach',
  '艾': 'Pflanze / Gras',
  '幺': 'Faden / Fein',
  '厶': 'Privat',
  '彳': 'Schritt',
  '夂': 'Nachfolgen',
  '勿': 'Nicht',
  'マ': 'Kappe',
  'ヨ': 'Kamm',
  '豕': 'Schwein',
  '攵': 'Handlung / Peitsche',
  '爿': 'Holzspalt',
  '杰': 'Feuer',
  '聿': 'Pinsel',
  '厂': 'Klippe',
  '勹': 'Einwickeln',
  '毋': 'Mutter / Verbot',
  '广': 'Halle / Dach',
  '釆': 'Unterscheiden',
  '廾': 'Hände',
  '冫': 'Eis',
  '尸': 'Körper / Flagge',
  '彡': 'Haare / Streifen',
  '頁': 'Kopf / Seite',
  '禾': 'Getreide',
  '几': 'Tischchen',
  '隹': 'Kleiner Vogel',
  '癶': 'Zelt / Schritte',
  '耒': 'Pflug',
  '疋': 'Fuß / Stoff',
  '弋': 'Pflock',
  'ユ': 'Hand / Haken',
  '扎': 'Hand',
  '匚': 'Kasten',
  '阡': 'Hügel',
  '歹': 'Tod / Verfall',
  '戈': 'Hellebarde',
  '殳': 'Waffe',
  '酉': 'Krug / Sake',
  '疔': 'Krankheit',
  '艮': 'Stillstand',
  '卩': 'Siegel',
  '廴': 'Langer Schritt',
  '隶': 'Ergreifen',
  '韋': 'Leder',
  '屮': 'Spross',
  '禹': 'Kriechtier',
  '巛': 'Fluss',
  '尤': 'Besonders',
  '尢': 'Lahmer Fuß',
  '虍': 'Tiger',
  '鬲': 'Kessel',
  '舛': 'Tanzen / Fehler',
  '彑': 'Schnauze',
  '而': 'Bart / Und',
  '豸': 'Raubtier',
  '瓜': 'Melone',
  '髟': 'Haarschopf',
  '爻': 'Kreuzen',
  '鬯': 'Opferwein',
  '黍': 'Hirse',
  '韭': 'Lauch',
  // Common variant radicals
  '亻': 'Mensch',
  '氵': 'Wasser',
  '扌': 'Hand',
  '艹': 'Gras / Pflanze',
  '辶': 'Weg / Bewegung',
  '阝': 'Hügel / Stadt',
  '犭': 'Tier / Hund',
  '灬': 'Feuer',
  '忄': 'Herz / Gefühl',
  '礻': 'Altar / Geist',
  '衤': 'Kleidung',
  '飠': 'Essen',
  '纟': 'Seide',
  '钅': 'Metall',
};

// Fill from myKanji
for (const k of myKanji) {
  if (!radicalNames[k.kanji]) {
    radicalNames[k.kanji] = k.meanings_de[0] || k.meanings_en[0];
  }
}

// Build decomposition map for all 2,500 Kanji
const decompositionMap = {};

for (const k of myKanji) {
  const char = k.kanji;
  const components = krad[char] || [];
  
  // Map components to { symbol, name }
  const breakdown = components.map(sym => {
    const name = radicalNames[sym] || sym;
    return { symbol: sym, name };
  });

  decompositionMap[char] = breakdown;
}

const outputPath = path.join(__dirname, '../src/data/radicalDecompositions.json');
fs.writeFileSync(outputPath, JSON.stringify(decompositionMap, null, 2), 'utf-8');
console.log('✓ Successfully wrote radicalDecompositions.json for', Object.keys(decompositionMap).length, 'kanji');
