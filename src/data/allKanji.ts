import rawKanjiData from './kanjiData.json';
import type { KanjiItem, JLPTLevel, ReadingItem, ExampleCompound } from '../types/kanji';

interface RawKanjiEntry {
  id: number;
  kanji: string;
  meanings_de: string[];
  meanings_en: string[];
  on_readings: string[];
  kun_readings: string[];
  strokes: number;
  jlpt: number;
  grade: number;
  examples: Array<{ word: string; reading: string; meaning: string }>;
}

function parseReadingString(str: string): ReadingItem {
  // e.g. "ニチ (nichi)" or "ひ (hi)"
  const match = str.match(/^(.*?)(?:\s*\((.*?)\))?$/);
  if (match) {
    return {
      kana: match[1]?.trim() || str,
      romaji: match[2]?.trim() || '',
    };
  }
  return { kana: str, romaji: '' };
}

export const ALL_KANJI: KanjiItem[] = (rawKanjiData as unknown as RawKanjiEntry[]).map((raw) => {
  const deMeanings = raw.meanings_de || [];
  const enMeanings = raw.meanings_en || [];
  const primary = deMeanings[0] || enMeanings[0] || 'Unbekannt';

  const onyomi: ReadingItem[] = (raw.on_readings || []).map(parseReadingString);
  const kunyomi: ReadingItem[] = (raw.kun_readings || []).map(parseReadingString);

  const jlptLevel: JLPTLevel =
    raw.jlpt === 5
      ? 'N5'
      : raw.jlpt === 4
      ? 'N4'
      : raw.jlpt === 3
      ? 'N3'
      : raw.jlpt === 2
      ? 'N2'
      : raw.jlpt === 1
      ? 'N1'
      : 'N5';

  const examples: ExampleCompound[] = (raw.examples || []).map((ex) => ({
    word: ex.word,
    furigana: ex.reading,
    romaji: '',
    meaning: ex.meaning,
  }));

  return {
    id: `kanji-${raw.id}`,
    kanji: raw.kanji,
    primaryMeaning: primary,
    meanings: [...deMeanings, ...enMeanings],
    strokeCount: raw.strokes || 1,
    jlpt: jlptLevel,
    grade: raw.grade,
    frequency: raw.id,
    radical: {
      symbol: raw.kanji,
      name: raw.kanji,
      meaning: primary,
    },
    onyomi,
    kunyomi,
    examples,
  };
});

export const TOTAL_KANJI_COUNT = ALL_KANJI.length;
