export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type StudyStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface ReadingItem {
  kana: string;
  romaji: string;
}

export interface RadicalInfo {
  symbol: string;
  name: string;
  meaning: string;
}

export interface ExampleCompound {
  word: string;
  furigana: string;
  romaji: string;
  meaning: string;
}

export interface ExampleSentence {
  japanese: string;
  furigana?: string;
  meaning: string;
}

export interface KanjiItem {
  id: string;
  kanji: string;
  meanings: string[];
  primaryMeaning: string;
  strokeCount: number;
  jlpt: JLPTLevel;
  radical: RadicalInfo;
  onyomi: ReadingItem[];
  kunyomi: ReadingItem[];
  strokePaths?: string[]; // SVG paths (KanjiVG) for animated / step-by-step rendering
  examples: ExampleCompound[];
  sentences?: ExampleSentence[];
  status?: StudyStatus;
}

export interface SessionResultItem {
  kanji: KanjiItem;
  attempts: number;
  masteredFirstTry: boolean;
  userDrawingDataUrl?: string;
}

export interface PracticeSessionStats {
  totalPracticed: number;
  firstTrySuccessCount: number;
  totalRepeats: number;
  accuracy: number;
  streakDays: number;
}
