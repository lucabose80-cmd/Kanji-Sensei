import { useEffect, useState, useCallback } from 'react';
import {
  calculateStats,
  downloadBackupFile,
  getAllProgress,
  getDailySession,
  getKanjiProgress,
  getSettings,
  initializeDailyQueue,
  onStorageChange,
  recordKanjiReview,
  saveDailySession,
  saveSettings,
  setKanjiStatus,
  uploadBackupFile,
} from '../services/storageService';
import type {
  DailySession,
  KanjiProgress,
  KanjiStatus,
  LearningStats,
  UserSettings,
} from '../services/storageService';

import {
  isStandalone as checkIsStandalone,
  onInstallAvailabilityChange,
  promptInstallApp,
} from '../registerSW';

export function useStorage(totalKanjiCount?: number) {
  const [settings, setSettingsState] = useState<UserSettings>(() => getSettings());
  const [session, setSessionState] = useState<DailySession>(() => getDailySession());
  const [progress, setProgressState] = useState<Record<string, KanjiProgress>>(() => getAllProgress());
  const [stats, setStatsState] = useState<LearningStats>(() => calculateStats(totalKanjiCount));
  const [canInstall, setCanInstall] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // Sync state whenever storage changes (e.g. from any tab or service call)
  const refresh = useCallback(() => {
    setSettingsState(getSettings());
    setSessionState(getDailySession());
    setProgressState(getAllProgress());
    setStatsState(calculateStats(totalKanjiCount));
  }, [totalKanjiCount]);

  useEffect(() => {
    const unsubscribeStorage = onStorageChange(refresh);
    const unsubscribeInstall = onInstallAvailabilityChange(setCanInstall);
    setIsPWA(checkIsStandalone());

    return () => {
      unsubscribeStorage();
      unsubscribeInstall();
    };
  }, [refresh]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    const updated = saveSettings(partial);
    setSettingsState(updated);
  }, []);

  const markKanjiStatus = useCallback((id: string, status: KanjiStatus) => {
    const updated = setKanjiStatus(id, status);
    refresh();
    return updated;
  }, [refresh]);

  const recordReview = useCallback(
    (id: string, isCorrect: boolean, score?: number, forcedStatus?: KanjiStatus) => {
      const res = recordKanjiReview(id, isCorrect, score, forcedStatus);
      refresh();
      return res;
    },
    [refresh]
  );

  const initQueue = useCallback(
    (availableIds: string[]) => {
      const updatedSession = initializeDailyQueue(availableIds);
      setSessionState(updatedSession);
      return updatedSession;
    },
    []
  );

  const installPWA = useCallback(async () => {
    return await promptInstallApp();
  }, []);

  return {
    settings,
    updateSettings,
    session,
    setSession: saveDailySession,
    progress,
    stats,
    getKanji: getKanjiProgress,
    markKanjiStatus,
    recordReview,
    initQueue,
    refresh,
    downloadBackup: downloadBackupFile,
    importBackupFile: uploadBackupFile,
    canInstall,
    installPWA,
    isPWA,
  };
}
