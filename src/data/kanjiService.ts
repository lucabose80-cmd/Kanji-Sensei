import kanjiDataRaw from './kanjiData.json';
import type { KanjiItem, ReadingItem, ExampleCompound, JLPTLevel } from '../types/kanji';
import type { KanjiStatus } from '../types/storage';
import { getAllProgress } from '../services/storageService';

export interface KanjiExample {
  word: string;
  reading: string;
  meaning: string;
}

export interface KanjiReading {
  kana: string;
  romaji: string;
}

export interface KanjiEntry {
  id: number;
  kanji: string;
  meanings_de: string[];
  meanings_en: string[];
  on_readings: string[];
  kun_readings: string[];
  strokes: number;
  jlpt: number | null; // 1 to 5 (5 = beginner N5)
  grade: number | null; // 1 to 6 (elementary), 8 (secondary), or null
  examples: KanjiExample[];
}

export interface KanjiFilterOptions {
  /** Filter by single JLPT level (1..5) or list of levels, or null for uncategorized */
  jlpt?: number | number[] | null;
  /** Filter by single school grade (1..6, 8) or list of grades, or null */
  grade?: number | number[] | null;
  /** Minimum stroke count */
  minStrokes?: number;
  /** Maximum stroke count */
  maxStrokes?: number;
  /** Text search across character, German/English meanings, Kana readings, Romaji */
  search?: string;
  /** Learning status from storage ('unlearned' | 'learning' | 'known') */
  status?: KanjiStatus;
}

// Cached typed list of all kanji
const ALL_KANJI: KanjiEntry[] = kanjiDataRaw as unknown as KanjiEntry[];

// Fast lookup map by character
const KANJI_BY_CHAR = new Map<string, KanjiEntry>();
// Fast lookup map by ID
const KANJI_BY_ID = new Map<number, KanjiEntry>();

for (const k of ALL_KANJI) {
  KANJI_BY_CHAR.set(k.kanji, k);
  KANJI_BY_ID.set(k.id, k);
}

/**
 * Returns all ~2,500 Kanji entries in standard educational progression order.
 */
export function getAllKanji(): KanjiEntry[] {
  return ALL_KANJI;
}

/**
 * Returns total number of available Kanji entries (approx. 2,500).
 */
export function getKanjiCount(): number {
  return ALL_KANJI.length;
}

/**
 * Lookup Kanji entry by numeric ID (1..2500).
 */
export function getKanjiById(id: number): KanjiEntry | undefined {
  return KANJI_BY_ID.get(id);
}

/**
 * Lookup Kanji entry by Japanese character (e.g. '日').
 */
export function getKanjiByCharacter(char: string): KanjiEntry | undefined {
  return KANJI_BY_CHAR.get(char);
}

/**
 * Parse a formatted reading string like "ニチ (nichi)" or "ひ (hi)" into kana and romaji components.
 */
export function parseReading(readingStr: string): KanjiReading {
  if (!readingStr) return { kana: '', romaji: '' };
  const match = readingStr.match(/^([^\s(]+)(?:\s*\(([^)]+)\))?/);
  if (match) {
    return {
      kana: match[1].trim(),
      romaji: (match[2] || '').trim(),
    };
  }
  return { kana: readingStr.trim(), romaji: '' };
}

/**
 * Returns parsed On-Readings for a given entry.
 */
export function getParsedOnReadings(entry: KanjiEntry): KanjiReading[] {
  return entry.on_readings.map(parseReading);
}

/**
 * Returns parsed Kun-Readings for a given entry.
 */
export function getParsedKunReadings(entry: KanjiEntry): KanjiReading[] {
  return entry.kun_readings.map(parseReading);
}

/**
 * Filters the Kanji dataset by JLPT level (1 to 5, where 5 = beginner N5).
 */
export function getKanjiByJlpt(level: number): KanjiEntry[] {
  return ALL_KANJI.filter((k) => k.jlpt === level);
}

/**
 * Filters the Kanji dataset by school grade (1..6 for elementary, 8 for secondary).
 */
export function getKanjiByGrade(grade: number): KanjiEntry[] {
  return ALL_KANJI.filter((k) => k.grade === grade);
}

/**
 * Returns all 2,136 official Jōyō Kanji (Grades 1-6 & 8).
 */
export function getJoyoKanji(): KanjiEntry[] {
  return ALL_KANJI.filter((k) => k.grade !== null && k.grade >= 1 && k.grade <= 8);
}

/**
 * Returns non-Jōyō Kanji in dataset (Jinmeiyō and additional JLPT kanji).
 */
export function getJinmeiyoKanji(): KanjiEntry[] {
  return ALL_KANJI.filter((k) => k.grade === null || k.grade > 8);
}

/**
 * Search Kanji entries across:
 * - Japanese character (exact/partial)
 * - German meanings (meanings_de)
 * - English meanings (meanings_en)
 * - Katakana & Hiragana readings
 * - Romaji readings
 * - Example words & readings
 */
export function searchKanji(query: string, pool: KanjiEntry[] = ALL_KANJI): KanjiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;

  return pool.filter((entry) => {
    // 1. Match character itself
    if (entry.kanji.includes(q)) return true;

    // 2. Match German meanings
    for (const m of entry.meanings_de) {
      if (m.toLowerCase().includes(q)) return true;
    }

    // 3. Match English meanings
    for (const m of entry.meanings_en) {
      if (m.toLowerCase().includes(q)) return true;
    }

    // 4. Match On-Readings (Katakana or Romaji)
    for (const on of entry.on_readings) {
      if (on.toLowerCase().includes(q)) return true;
    }

    // 5. Match Kun-Readings (Hiragana or Romaji)
    for (const kun of entry.kun_readings) {
      if (kun.toLowerCase().includes(q)) return true;
    }

    // 6. Match Examples
    for (const ex of entry.examples) {
      if (
        ex.word.includes(q) ||
        ex.reading.includes(q) ||
        ex.meaning.toLowerCase().includes(q)
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * General filter function supporting JLPT, Grade, Stroke count, Search query, and Learning Status.
 */
export function filterKanji(options: KanjiFilterOptions, pool: KanjiEntry[] = ALL_KANJI): KanjiEntry[] {
  let result = pool;

  // Search filter
  if (options.search && options.search.trim()) {
    result = searchKanji(options.search, result);
  }

  // JLPT level filter
  if (options.jlpt !== undefined) {
    if (options.jlpt === null) {
      result = result.filter((k) => k.jlpt === null);
    } else if (Array.isArray(options.jlpt)) {
      const set = new Set(options.jlpt);
      result = result.filter((k) => k.jlpt !== null && set.has(k.jlpt));
    } else {
      result = result.filter((k) => k.jlpt === options.jlpt);
    }
  }

  // School grade filter
  if (options.grade !== undefined) {
    if (options.grade === null) {
      result = result.filter((k) => k.grade === null);
    } else if (Array.isArray(options.grade)) {
      const set = new Set(options.grade);
      result = result.filter((k) => k.grade !== null && set.has(k.grade));
    } else {
      result = result.filter((k) => k.grade === options.grade);
    }
  }

  // Min strokes filter
  if (typeof options.minStrokes === 'number') {
    result = result.filter((k) => k.strokes >= options.minStrokes!);
  }

  // Max strokes filter
  if (typeof options.maxStrokes === 'number') {
    result = result.filter((k) => k.strokes <= options.maxStrokes!);
  }

  // Learning status filter (integrates with user progress)
  if (options.status) {
    const progressMap = getAllProgress();
    result = result.filter((k) => {
      const p = progressMap[k.kanji];
      const currentStatus: KanjiStatus = p ? p.status : 'unlearned';
      return currentStatus === options.status;
    });
  }

  return result;
}

export interface DailyBatchOptions {
  /** Target number of Kanji to practice (default: 10, clamped to 5..25) */
  count?: number;
  /** Optional JLPT filter (1..5) */
  jlpt?: number;
  /** Optional School grade filter (1..6, 8) */
  grade?: number;
  /** Whether to include already known/mastered kanji in the practice session (default: false) */
  includeKnown?: boolean;
}

/**
 * Selects 5 to 10 Kanji entries for daily practice.
 *
 * Algorithm:
 * 1. Prioritizes Kanji in 'learning' status (Spaced Repetition Review queue).
 * 2. Next, fills remaining slots with 'unlearned' Kanji in educational progression order.
 * 3. If the user has mastered all target kanji or `includeKnown` is enabled, incorporates 'known' kanji for refreshers.
 */
export function getDailyKanjiBatch(options: DailyBatchOptions = {}): KanjiEntry[] {
  const targetCount = Math.max(5, Math.min(25, options.count ?? 10));

  // Determine eligible candidate pool based on filters
  let candidates = ALL_KANJI;
  if (options.jlpt !== undefined) {
    candidates = candidates.filter((k) => k.jlpt === options.jlpt);
  }
  if (options.grade !== undefined) {
    candidates = candidates.filter((k) => k.grade === options.grade);
  }

  if (candidates.length === 0) {
    candidates = ALL_KANJI;
  }

  // Get current user progress from storage
  let progressMap: Record<string, { status: KanjiStatus; lastReviewed?: number | null }> = {};
  try {
    progressMap = getAllProgress() as Record<string, { status: KanjiStatus; lastReviewed?: number | null }>;
  } catch {
    progressMap = {};
  }

  const learningPool: KanjiEntry[] = [];
  const unlearnedPool: KanjiEntry[] = [];
  const knownPool: KanjiEntry[] = [];

  for (const k of candidates) {
    const p = progressMap[k.kanji];
    const status: KanjiStatus = p ? p.status : 'unlearned';
    if (status === 'learning') {
      learningPool.push(k);
    } else if (status === 'known') {
      knownPool.push(k);
    } else {
      unlearnedPool.push(k);
    }
  }

  // Sort learning pool by last reviewed timestamp (oldest reviews first)
  learningPool.sort((a, b) => {
    const timeA = progressMap[a.kanji]?.lastReviewed || 0;
    const timeB = progressMap[b.kanji]?.lastReviewed || 0;
    return timeA - timeB;
  });

  const selected: KanjiEntry[] = [];

  // 1. Fill from learning pool (up to 70% of batch)
  const maxLearningToTake = Math.min(learningPool.length, Math.ceil(targetCount * 0.7));
  for (let i = 0; i < maxLearningToTake && selected.length < targetCount; i++) {
    selected.push(learningPool[i]);
  }

  // 2. Fill remaining slots from unlearned pool (in educational sequence)
  for (let i = 0; i < unlearnedPool.length && selected.length < targetCount; i++) {
    selected.push(unlearnedPool[i]);
  }

  // 3. If still not full, take remaining from learning pool
  for (let i = maxLearningToTake; i < learningPool.length && selected.length < targetCount; i++) {
    selected.push(learningPool[i]);
  }

  // 4. If still not full and includeKnown is true (or unlearned is depleted), sample from known
  if (selected.length < targetCount && (options.includeKnown || unlearnedPool.length === 0)) {
    // Random shuffle known pool for refresher variety
    const shuffledKnown = [...knownPool].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledKnown.length && selected.length < targetCount; i++) {
      selected.push(shuffledKnown[i]);
    }
  }

  // Fallback: If candidate pool had fewer than targetCount items, sample from general unlearned
  if (selected.length < targetCount) {
    for (const k of ALL_KANJI) {
      if (!selected.some((s) => s.id === k.id)) {
        selected.push(k);
        if (selected.length >= targetCount) break;
      }
    }
  }

  return selected;
}

/**
 * Returns a random batch of N Kanji, optionally filtered.
 */
export function getRandomKanjiBatch(count: number = 10, filter?: KanjiFilterOptions): KanjiEntry[] {
  const pool = filter ? filterKanji(filter) : ALL_KANJI;
  const clampedCount = Math.max(1, Math.min(pool.length, count));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, clampedCount);
}

/**
 * Adapter: Converts a dataset `KanjiEntry` into the UI `KanjiItem` structure
 * required by PracticeView, PracticeCanvas, and KanjiGridBox components.
 */
export function toKanjiItem(entry: KanjiEntry): KanjiItem {
  const jlptLevel: JLPTLevel = entry.jlpt ? (`N${entry.jlpt}` as JLPTLevel) : 'N1';

  const onyomi: ReadingItem[] = entry.on_readings.map((r) => {
    const parsed = parseReading(r);
    return { kana: parsed.kana, romaji: parsed.romaji };
  });

  const kunyomi: ReadingItem[] = entry.kun_readings.map((r) => {
    const parsed = parseReading(r);
    return { kana: parsed.kana, romaji: parsed.romaji };
  });

  const examples: ExampleCompound[] = entry.examples.map((ex) => ({
    word: ex.word,
    furigana: ex.reading,
    romaji: '',
    meaning: ex.meaning,
  }));

  const primaryMeaning = entry.meanings_de[0] || entry.meanings_en[0] || 'Kanji';

  return {
    id: `kanji-${entry.id}`,
    kanji: entry.kanji,
    meanings: entry.meanings_de.length > 0 ? entry.meanings_de : entry.meanings_en,
    primaryMeaning,
    strokeCount: entry.strokes,
    jlpt: jlptLevel,
    radical: {
      symbol: entry.kanji,
      name: entry.kanji,
      meaning: primaryMeaning,
    },
    onyomi,
    kunyomi,
    examples,
    sentences: [],
  };
}

/**
 * Convenience helper to convert multiple `KanjiEntry` items into `KanjiItem` items.
 */
export function toKanjiItemList(entries: KanjiEntry[]): KanjiItem[] {
  return entries.map(toKanjiItem);
}
