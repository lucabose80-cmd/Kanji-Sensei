const zlib = require('zlib');
const fs = require('fs');

async function test() {
  console.log('Downloading datasets...');
  const [kdRes, kjRes] = await Promise.all([
    fetch('https://www.edrdg.org/kanjidic/kanjidic2.xml.gz').then(r => r.arrayBuffer()),
    fetch('https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json').then(r => r.json())
  ]);

  const xml = zlib.gunzipSync(Buffer.from(kdRes)).toString('utf-8');
  console.log('Decompressed XML length:', xml.length);

  const deMap = new Map();
  const charRegex = /<character>[\s\S]*?<literal>(.*?)<\/literal>[\s\S]*?<\/character>/g;
  let match;
  let countWithDe = 0;

  while ((match = charRegex.exec(xml)) !== null) {
    const block = match[0];
    const kanji = match[1];
    const deMeanings = [];
    const deRegex = /<meaning m_lang="de">(.*?)<\/meaning>/g;
    let deMatch;
    while ((deMatch = deRegex.exec(block)) !== null) {
      deMeanings.push(deMatch[1]);
    }
    if (deMeanings.length > 0) {
      deMap.set(kanji, deMeanings);
      countWithDe++;
    }
  }

  console.log('Kanji with German meanings in KANJIDIC2:', countWithDe);
  console.log('日 German:', deMap.get('日'));
  console.log('学 German:', deMap.get('学'));
  console.log('愛 German:', deMap.get('愛'));

  const joyo = Object.entries(kjRes).filter(([k, v]) => (v.grade >= 1 && v.grade <= 8) || (v.jlpt_new >= 1 && v.jlpt_new <= 5) || (v.freq && v.freq <= 2500));
  console.log('Total Joyo/JLPT in kanji.json:', joyo.length);
  const joyoWithDe = joyo.filter(([k]) => deMap.has(k));
  console.log('Joyo/JLPT with German:', joyoWithDe.length);
}

test().catch(console.error);
