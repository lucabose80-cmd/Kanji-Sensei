/**
 * Unit & Verification Tests for Kanji Data and KanjiService
 */

// Mock browser localStorage and window before importing services
const storageStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageStore.get(key) || null,
  setItem: (key: string, value: string) => storageStore.set(key, value),
  removeItem: (key: string) => storageStore.delete(key),
  clear: () => storageStore.clear(),
};

(globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
(globalThis as unknown as { window: { dispatchEvent: () => boolean; addEventListener: () => void; removeEventListener: () => void } }).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import {
  getAllKanji,
  getKanjiCount,
  getKanjiById,
  getKanjiByCharacter,
  getJoyoKanji,
  getJinmeiyoKanji,
  getKanjiByJlpt,
  getKanjiByGrade,
  searchKanji,
  filterKanji,
  getDailyKanjiBatch,
  getRandomKanjiBatch,
  toKanjiItem,
  toKanjiItemList,
  parseReading,
} from '../src/data/kanjiService';
import { setKanjiStatus } from '../src/services/storageService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${msg}`);
  }
  console.log(`✓ ${msg}`);
}

async function runTests() {
  console.log('=== RUNNING KANJI DATA & SERVICE TESTS ===\n');

  // Test 1: Dataset Volume & IDs
  const allKanji = getAllKanji();
  const count = getKanjiCount();
  assert(count === 2500, `Total Kanji count is exactly 2,500 (actual: ${count})`);
  assert(allKanji.length === 2500, `getAllKanji returns 2,500 entries`);

  const idSet = new Set<number>();
  const charSet = new Set<string>();

  for (let i = 0; i < allKanji.length; i++) {
    const k = allKanji[i];
    assert(k.id === i + 1, `Entry index ${i} has consecutive id ${i + 1} (actual: ${k.id})`);
    idSet.add(k.id);
    charSet.add(k.kanji);
  }
  assert(idSet.size === 2500, 'All 2,500 IDs are unique');
  assert(charSet.size === 2500, 'All 2,500 Kanji characters are unique');

  // Test 2: Field Integrity of all 2,500 entries
  let invalidEntries = 0;
  let missingDe = 0;
  let missingEn = 0;
  let invalidExamples = 0;

  for (const k of allKanji) {
    if (!k.kanji || k.kanji.length !== 1) invalidEntries++;
    if (!Array.isArray(k.meanings_de) || k.meanings_de.length === 0) missingDe++;
    if (!Array.isArray(k.meanings_en) || k.meanings_en.length === 0) missingEn++;
    if (!Array.isArray(k.on_readings)) invalidEntries++;
    if (!Array.isArray(k.kun_readings)) invalidEntries++;
    if (typeof k.strokes !== 'number' || k.strokes < 1) invalidEntries++;
    if (k.jlpt !== null && (k.jlpt < 1 || k.jlpt > 5)) invalidEntries++;
    if (k.grade !== null && (k.grade < 1 || (k.grade > 6 && k.grade !== 8))) invalidEntries++;

    // Examples must be between 2 and 3 items
    if (!Array.isArray(k.examples) || k.examples.length < 2 || k.examples.length > 3) {
      invalidExamples++;
    } else {
      for (const ex of k.examples) {
        if (!ex.word || !ex.meaning) invalidExamples++;
      }
    }
  }

  assert(invalidEntries === 0, 'No invalid or malformed fields found across all 2,500 entries');
  assert(missingDe === 0, 'All 2,500 Kanji have German meanings (meanings_de)');
  assert(missingEn === 0, 'All 2,500 Kanji have English reference meanings (meanings_en)');
  assert(invalidExamples === 0, 'All 2,500 Kanji have 2 to 3 valid example compounds');

  // Test 3: Educational Categories (Jōyō & Jinmeiyō)
  const joyo = getJoyoKanji();
  assert(joyo.length === 2136, `Exactly 2,136 Jōyō Kanji present (actual: ${joyo.length})`);

  const jinmeiyo = getJinmeiyoKanji();
  assert(jinmeiyo.length === 364, `Exactly 364 Jinmeiyō / Extra Kanji present (actual: ${jinmeiyo.length})`);
  assert(joyo.length + jinmeiyo.length === 2500, 'Joyo + Jinmeiyo sums up to 2,500');

  // Grade 1 has 80 Kanji in the official curriculum
  const g1 = getKanjiByGrade(1);
  assert(g1.length === 80, `Grade 1 contains exactly 80 Kanji (actual: ${g1.length})`);

  // JLPT N5 kanji count
  const n5 = getKanjiByJlpt(5);
  assert(n5.length >= 80, `JLPT N5 contains ${n5.length} basic Kanji`);

  // Test 4: Lookups
  const nichi = getKanjiByCharacter('日');
  assert(nichi !== undefined, 'Found 日 by character lookup');
  assert(nichi!.kanji === '日', 'Character is 日');
  assert(nichi!.meanings_de.some(m => m.toLowerCase().includes('tag') || m.toLowerCase().includes('sonne')), '日 has German meaning Tag or Sonne');
  assert(nichi!.strokes === 4, '日 has 4 strokes');
  assert(nichi!.grade === 1, '日 is Grade 1');
  assert(nichi!.jlpt === 5, '日 is JLPT 5');

  const byId1 = getKanjiById(1);
  assert(byId1 !== undefined && byId1.id === 1, 'Lookup by numeric ID 1 succeeds');

  // Test 5: Search Functionality
  // Search German
  const searchSonne = searchKanji('Sonne');
  assert(searchSonne.some(k => k.kanji === '日'), 'Search for "Sonne" finds 日');

  // Search English
  const searchMoon = searchKanji('Moon');
  assert(searchMoon.some(k => k.kanji === '月'), 'Search for "Moon" finds 月');

  // Search Romaji
  const searchNichi = searchKanji('nichi');
  assert(searchNichi.some(k => k.kanji === '日'), 'Search for "nichi" (Romaji) finds 日');

  // Search Kana
  const searchMizu = searchKanji('みず');
  assert(searchMizu.some(k => k.kanji === '水'), 'Search for "みず" (Kana) finds 水');

  // Search Example word
  const searchNihon = searchKanji('日本');
  assert(searchNihon.some(k => k.kanji === '日'), 'Search for example compound "日本" finds 日');

  // Test 6: Combined Filtering
  const filtered = filterKanji({ jlpt: 5, grade: 1, maxStrokes: 4 });
  assert(filtered.length > 0, `Filter for JLPT 5 + Grade 1 + strokes <= 4 returned ${filtered.length} entries`);
  assert(filtered.every(k => k.jlpt === 5 && k.grade === 1 && k.strokes <= 4), 'All filtered entries match criteria');

  // Test 7: Reading Parser Helper
  const parsedOn = parseReading('ニチ (nichi)');
  assert(parsedOn.kana === 'ニチ', 'parseReading extracted kana ニチ');
  assert(parsedOn.romaji === 'nichi', 'parseReading extracted romaji nichi');

  const parsedKun = parseReading('ひ (hi)');
  assert(parsedKun.kana === 'ひ', 'parseReading extracted kana ひ');
  assert(parsedKun.romaji === 'hi', 'parseReading extracted romaji hi');

  // Test 8: Daily Batch Selection (5 to 10 Kanji)
  const defaultBatch = getDailyKanjiBatch();
  assert(defaultBatch.length === 10, 'Default daily batch size is 10');

  const batch5 = getDailyKanjiBatch({ count: 5 });
  assert(batch5.length === 5, 'Daily batch with count 5 returns exactly 5 Kanji');

  // Test learning status prioritization in daily batch
  setKanjiStatus('日', 'learning');
  setKanjiStatus('月', 'learning');
  setKanjiStatus('木', 'learning');

  const priorityBatch = getDailyKanjiBatch({ count: 5 });
  const selectedChars = priorityBatch.map(k => k.kanji);
  assert(selectedChars.includes('日'), 'Daily batch prioritizes learning status kanji 日');
  assert(selectedChars.includes('月'), 'Daily batch prioritizes learning status kanji 月');
  assert(selectedChars.includes('木'), 'Daily batch prioritizes learning status kanji 木');

  // Random batch test
  const randomBatch = getRandomKanjiBatch(8, { jlpt: 5 });
  assert(randomBatch.length === 8, 'getRandomKanjiBatch returns 8 items');
  assert(randomBatch.every(k => k.jlpt === 5), 'All random items match JLPT filter');

  // Test 9: UI Adapter Conversion (toKanjiItem)
  const kanjiItem = toKanjiItem(nichi!);
  assert(kanjiItem.id === `kanji-${nichi!.id}`, 'toKanjiItem sets id format');
  assert(kanjiItem.kanji === '日', 'toKanjiItem preserves kanji');
  assert(kanjiItem.jlpt === 'N5', 'toKanjiItem converts jlpt number to string N5');
  assert(kanjiItem.onyomi.length > 0, 'toKanjiItem formats onyomi array');
  assert(kanjiItem.onyomi[0].kana === 'ニチ', 'toKanjiItem onyomi kana is Katakana');
  assert(kanjiItem.onyomi[0].romaji === 'nichi', 'toKanjiItem onyomi romaji is nichi');
  assert(kanjiItem.kunyomi[0].kana === 'ひ', 'toKanjiItem kunyomi kana is Hiragana');
  assert(kanjiItem.examples.length >= 2, 'toKanjiItem preserves examples');
  assert(kanjiItem.examples[0].furigana !== undefined, 'toKanjiItem provides furigana');

  const listItems = toKanjiItemList(batch5);
  assert(listItems.length === 5, 'toKanjiItemList successfully converts batch');

  console.log('\n=== ALL KANJI TESTS PASSED PERFECTLY! ===');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
