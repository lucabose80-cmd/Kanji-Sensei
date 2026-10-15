import type {
  DailySession,
  KanjiProgress,
  KanjiSenseiBackup,
  KanjiStatus,
  LearningStats,
  UserSettings,
} from '../types/storage';

export type * from '../types/storage';


const STORAGE_KEYS = {
  PROGRESS: 'kanji_sensei_progress_v1',
  SETTINGS: 'kanji_sensei_settings_v1',
  SESSION: 'kanji_sensei_session_v1',
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
  dailyTarget: 10,
  includeKnownInPool: false,
  darkTheme: true,
  soundEnabled: true,
  hapticFeedback: true,
};

/**
 * Format today's date as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in days between two YYYY-MM-DD dates
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(`${dateStr1}T00:00:00`);
  const d2 = new Date(`${dateStr2}T00:00:00`);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Notify subscribers about storage updates
 */
function notifyStorageChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kanji-storage-change'));
  }
}

/**
 * Subscribe to storage updates (e.g. for React hooks or components)
 */
export function onStorageChange(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener('kanji-storage-change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('kanji-storage-change', handler);
    window.removeEventListener('storage', handler);
  };
}

/* ==========================================================================
   1. SETTINGS MANAGEMENT
   ========================================================================== */

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('[Storage] Fehler beim Laden der Einstellungen:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(partial: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated: UserSettings = { ...current, ...partial };

  // Validate daily target range (5 to 30)
  if (typeof updated.dailyTarget === 'number') {
    updated.dailyTarget = Math.max(1, Math.min(50, Math.round(updated.dailyTarget)));
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    applyTheme(updated.darkTheme);
    notifyStorageChange();
  }
  return updated;
}

/**
 * Sync dark mode class on document element
 */
export function applyTheme(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/* ==========================================================================
   2. PROGRESS / KANJI STATUS MANAGEMENT
   ========================================================================== */

export function getAllProgress(): Record<string, KanjiProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Storage] Fehler beim Laden des Lernstatus:', error);
    return {};
  }
}

export function getKanjiProgress(id: string): KanjiProgress {
  const all = getAllProgress();
  if (all[id]) {
    return all[id];
  }
  return {
    id,
    status: 'unlearned',
    lastReviewed: null,
    reviewCount: 0,
    correctCount: 0,
    history: [],
  };
}

export function saveKanjiProgress(progress: KanjiProgress): void {
  if (typeof window === 'undefined') return;
  const all = getAllProgress();
  all[progress.id] = progress;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  notifyStorageChange();
}

export function setKanjiStatus(id: string, status: KanjiStatus): KanjiProgress {
  const current = getKanjiProgress(id);
  const updated: KanjiProgress = {
    ...current,
    status,
    lastReviewed: Date.now(),
  };
  saveKanjiProgress(updated);
  return updated;
}

/**
 * Record a practice/review attempt for a Kanji
 */
export function recordKanjiReview(
  id: string,
  isCorrect: boolean,
  score?: number,
  forcedStatus?: KanjiStatus
): { progress: KanjiProgress; session: DailySession; todayFinished: boolean } {
  const current = getKanjiProgress(id);
  const reviewCount = current.reviewCount + 1;
  const correctCount = isCorrect ? current.correctCount + 1 : current.correctCount;

  // Status transition logic if not forced
  let nextStatus: KanjiStatus = current.status;
  if (forcedStatus) {
    nextStatus = forcedStatus;
  } else if (isCorrect) {
    if (current.status === 'unlearned') {
      nextStatus = 'learning';
    } else if (current.status === 'learning' && correctCount >= 3 && correctCount / reviewCount >= 0.75) {
      // Auto-promote if consistently mastered
      nextStatus = 'known';
    }
  } else {
    // If failed repeatedly, downgrade or keep learning
    if (current.status === 'known') {
      nextStatus = 'learning';
    }
  }

  const updatedHistory = [
    ...(current.history || []),
    {
      timestamp: Date.now(),
      isCorrect,
      score,
    },
  ];

  const updatedProgress: KanjiProgress = {
    id,
    status: nextStatus,
    lastReviewed: Date.now(),
    reviewCount,
    correctCount,
    history: updatedHistory,
  };

  saveKanjiProgress(updatedProgress);

  // Update Daily Session completed list
  const session = getDailySession();
  let todayFinished = false;

  if (session.queue.includes(id) && !session.completed.includes(id)) {
    session.completed.push(id);

    // Check if session reached target
    if (session.completed.length >= session.queue.length && session.queue.length > 0) {
      const today = getTodayDateString();
      if (session.lastSessionDate !== today) {
        if (session.lastSessionDate) {
          const diff = getDaysDifference(session.lastSessionDate, today);
          if (diff === 1) {
            session.currentStreak += 1;
          } else {
            session.currentStreak = 1;
          }
        } else {
          session.currentStreak = 1;
        }
        session.lastSessionDate = today;
      }
      todayFinished = true;
    }
    saveDailySession(session);
  }

  return {
    progress: updatedProgress,
    session,
    todayFinished,
  };
}

/* ==========================================================================
   3. DAILY SESSION MANAGEMENT & STREAKS
   ========================================================================== */

export function getDailySession(): DailySession {
  const today = getTodayDateString();
  const defaultSession: DailySession = {
    date: today,
    queue: [],
    completed: [],
    currentStreak: 0,
    lastSessionDate: null,
  };

  if (typeof window === 'undefined') return defaultSession;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return defaultSession;

    const parsed: DailySession = JSON.parse(raw);

    // If session is from today, return it directly
    if (parsed.date === today) {
      return parsed;
    }

    // New day encountered! Handle streak continuity
    let newStreak = parsed.currentStreak || 0;
    if (parsed.lastSessionDate) {
      const diff = getDaysDifference(parsed.lastSessionDate, today);
      // If last completed session was not yesterday (diff > 1), streak resets
      if (diff > 1) {
        newStreak = 0;
      }
    } else {
      newStreak = 0;
    }

    const newDaySession: DailySession = {
      date: today,
      queue: [],
      completed: [],
      currentStreak: newStreak,
      lastSessionDate: parsed.lastSessionDate || null,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newDaySession));
    notifyStorageChange();
    return newDaySession;
  } catch (error) {
    console.error('[Storage] Fehler beim Laden der Tages-Session:', error);
    return defaultSession;
  }
}

export function saveDailySession(session: DailySession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  notifyStorageChange();
}

/**
 * Initializes or updates today's queue from available Kanji IDs
 */
export function initializeDailyQueue(allAvailableKanjiIds: string[]): DailySession {
  const session = getDailySession();
  const settings = getSettings();
  const progress = getAllProgress();

  // If queue is already set for today and has items, keep it
  if (session.queue.length > 0) {
    return session;
  }

  // Filter and sort available kanji based on user status & settings
  const learningList: string[] = [];
  const unlearnedList: string[] = [];
  const knownList: string[] = [];

  for (const id of allAvailableKanjiIds) {
    const status = progress[id]?.status || 'unlearned';
    if (status === 'learning') {
      learningList.push(id);
    } else if (status === 'unlearned') {
      unlearnedList.push(id);
    } else if (status === 'known') {
      knownList.push(id);
    }
  }

  // Shuffle helper
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const pool: string[] = [];

  // Prioritise Kanji that are currently being learned
  pool.push(...shuffle(learningList));

  // Fill with unlearned Kanji up to target
  if (pool.length < settings.dailyTarget) {
    pool.push(...shuffle(unlearnedList));
  }

  // Optionally include known kanji if pool is still small or setting is enabled
  if (settings.includeKnownInPool || pool.length < settings.dailyTarget) {
    pool.push(...shuffle(knownList));
  }

  const selectedQueue = pool.slice(0, settings.dailyTarget);
  session.queue = selectedQueue;
  saveDailySession(session);
  return session;
}

/* ==========================================================================
   4. STATS & ANALYTICS
   ========================================================================== */

export function calculateStats(totalAvailableCount?: number): LearningStats {
  const allProgress = getAllProgress();
  const session = getDailySession();
  const settings = getSettings();

  let unlearned = 0;
  let learning = 0;
  let known = 0;
  let totalReviews = 0;
  let totalCorrect = 0;

  const entries = Object.values(allProgress);
  for (const item of entries) {
    if (item.status === 'learning') learning++;
    else if (item.status === 'known') known++;
    else unlearned++;

    totalReviews += item.reviewCount || 0;
    totalCorrect += item.correctCount || 0;
  }

  const totalTracked = totalAvailableCount ?? Math.max(entries.length, 1);
  if (totalAvailableCount && totalAvailableCount > entries.length) {
    unlearned += totalAvailableCount - entries.length;
  }

  const accuracyRate = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 100;
  const todayTarget = session.queue.length || settings.dailyTarget;
  const todayCompleted = session.completed.length;
  const isTodayFinished = todayCompleted >= todayTarget && todayTarget > 0;

  return {
    totalTracked,
    unlearned,
    learning,
    known,
    accuracyRate,
    totalReviews,
    currentStreak: session.currentStreak,
    todayCompletedCount: todayCompleted,
    todayTargetCount: todayTarget,
    isTodayFinished,
  };
}

/* ==========================================================================
   5. BACKUP EXPORT & IMPORT (JSON DOWNLOAD/UPLOAD)
   ========================================================================== */

export function exportBackup(): KanjiSenseiBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    dailySession: getDailySession(),
    progress: getAllProgress(),
  };
}

/**
 * Trigger immediate JSON file download for mobile and desktop
 */
export function downloadBackupFile(customFilename?: string): void {
  const backup = exportBackup();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = getTodayDateString();
  const filename = customFilename || `kanji-sensei-backup-${today}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and import backup JSON into localStorage
 */
export function importBackupData(backupData: unknown): { success: boolean; message: string; data?: KanjiSenseiBackup } {
  try {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, message: 'Ung\u00fcltiges Backup-Format (kein JSON-Objekt).' };
    }

    const candidate = backupData as Partial<KanjiSenseiBackup>;

    if (!candidate.progress || typeof candidate.progress !== 'object') {
      return { success: false, message: 'Backup enth\u00e4lt keine g\u00fcltigen Fortschrittsdaten.' };
    }

    if (candidate.settings && typeof candidate.settings === 'object') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...candidate.settings }));
      applyTheme(candidate.settings.darkTheme ?? true);
    }

    if (candidate.progress && typeof candidate.progress === 'object') {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(candidate.progress));
    }

    if (candidate.dailySession && typeof candidate.dailySession === 'object') {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(candidate.dailySession));
    }

    notifyStorageChange();

    return {
      success: true,
      message: 'Lernfortschritt und Einstellungen wurden erfolgreich wiederhergestellt!',
      data: candidate as KanjiSenseiBackup,
    };
  } catch (error) {
    console.error('[Storage] Fehler beim Importieren des Backups:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unbekannter Fehler beim Importieren.',
    };
  }
}

/**
 * Parse an uploaded JSON file and import it
 */
export async function uploadBackupFile(file: File): Promise<{ success: boolean; message: string; data?: KanjiSenseiBackup }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return importBackupData(parsed);
  } catch (err) {
    return {
      success: false,
      message: 'Datei konnte nicht gelesen oder geparst werden. Bitte g\u00fcltige JSON-Datei w\u00e4hlen.',
    };
  }
}

/**
 * Reset all learning progress (factory reset)
 */
export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  notifyStorageChange();
}
