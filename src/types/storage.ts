export type KanjiStatus = 'unlearned' | 'learning' | 'known';

export interface KanjiReviewRecord {
  timestamp: number;
  isCorrect: boolean;
  score?: number; // e.g. drawing similarity percentage 0-100
}

export interface KanjiProgress {
  id: string; // Character e.g. "日" or ID
  status: KanjiStatus;
  lastReviewed: number | null; // Timestamp in ms
  reviewCount: number; // Wie oft geübt
  correctCount: number; // Wie oft richtig
  history?: KanjiReviewRecord[];
}

export type FillStrategy = 'unlearned' | 'known';

export interface UserSettings {
  dailyTarget: number; // Standard 10, einstellbar z. B. 5-20
  includeKnownInPool: boolean; // Gemeisterte Kanji in den Tagespool aufnehmen
  fillStrategy: FillStrategy; // 'unlearned' (mit nächsten neuen Zeichen auffüllen) | 'known' (mit bereits gelernten/gemeisterten Zeichen auffüllen)
  darkTheme: boolean; // Dunkler Modus
  soundEnabled?: boolean;
  hapticFeedback?: boolean;
}

export interface DailySession {
  date: string; // 'YYYY-MM-DD'
  queue: string[]; // IDs der Kanji für die heutige Session
  completed: string[]; // IDs der heute bereits geschriebenen Kanji
  currentStreak: number; // Aktueller Tages-Streak (Tage in Folge geübt)
  lastSessionDate: string | null; // Datum der letzten erfolgreich beendeten Session
}

export interface KanjiSenseiBackup {
  version: number;
  exportedAt: string;
  settings: UserSettings;
  dailySession: DailySession;
  progress: Record<string, KanjiProgress>;
}

export interface LearningStats {
  totalTracked: number;
  unlearned: number;
  learning: number;
  known: number;
  accuracyRate: number; // 0 - 100%
  totalReviews: number;
  currentStreak: number;
  todayCompletedCount: number;
  todayTargetCount: number;
  isTodayFinished: boolean;
}
