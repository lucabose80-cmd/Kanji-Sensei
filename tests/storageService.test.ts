/**
 * Storage Service Unit & Verification Test
 */

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
(globalThis as unknown as { document: { documentElement: { classList: { add: () => void; remove: () => void } } } }).document = {
  documentElement: {
    classList: {
      add: () => {},
      remove: () => {},
    },
  },
};

import {
  calculateStats,
  exportBackup,
  getAllProgress,
  getKanjiProgress,
  getSettings,
  importBackupData,
  initializeDailyQueue,
  recordKanjiReview,
  saveSettings,
  setKanjiStatus,
} from '../src/services/storageService.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${msg}`);
  }
  console.log(`✓ ${msg}`);
}

async function runTests() {
  console.log('=== RUNNING STORAGE SERVICE TESTS ===\n');

  // Test 1: Default Settings
  const initialSettings = getSettings();
  assert(initialSettings.dailyTarget === 10, 'Default dailyTarget is 10');
  assert(initialSettings.includeKnownInPool === false, 'Default includeKnownInPool is false');
  assert(initialSettings.fillStrategy === 'unlearned', 'Default fillStrategy is unlearned');
  assert(initialSettings.darkTheme === true, 'Default darkTheme is true');

  // Test 2: Save Settings with validation
  saveSettings({ dailyTarget: 15, includeKnownInPool: true, fillStrategy: 'known' });
  const updatedSettings = getSettings();
  assert(updatedSettings.dailyTarget === 15, 'Updated dailyTarget to 15');
  assert(updatedSettings.includeKnownInPool === true, 'Updated includeKnownInPool to true');
  assert(updatedSettings.fillStrategy === 'known', 'Updated fillStrategy to known');

  saveSettings({ dailyTarget: 999 }); // Should clamp to max 50
  assert(getSettings().dailyTarget === 50, 'Clamped invalid dailyTarget to 50');

  // Test 3: Kanji Progress defaults & setKanjiStatus
  const progressInitial = getKanjiProgress('日');
  assert(progressInitial.status === 'unlearned', 'Initial status of 日 is unlearned');
  assert(progressInitial.reviewCount === 0, 'Initial reviewCount is 0');

  setKanjiStatus('日', 'learning');
  assert(getKanjiProgress('日').status === 'learning', 'Status updated to learning');

  // Test 4: Daily Session & Queue Generation
  const candidateIds = ['日', '月', '木', '山', '川', '火', '水', '人', '金', '土', '年', '時'];
  const session = initializeDailyQueue(candidateIds);
  assert(session.queue.length === candidateIds.length, 'Queue populated with available kanji');
  assert(session.completed.length === 0, 'Session completed list is empty initially');
  assert(session.currentStreak === 0, 'Current streak starts at 0');

  // Test 5: Review recording and automatic session queue completion
  const testId = session.queue[0];
  const reviewRes = recordKanjiReview(testId, true, 95);
  assert(reviewRes.progress.reviewCount === 1, 'Review count incremented to 1');
  assert(reviewRes.progress.correctCount === 1, 'Correct count incremented to 1');
  assert(reviewRes.session.completed.includes(testId), 'Completed list includes practiced Kanji');

  // Test 6: Calculate stats
  const stats = calculateStats(candidateIds.length);
  assert(stats.todayCompletedCount === 1, 'Stats reflect 1 completed Kanji today');
  assert(stats.accuracyRate === 100, 'Accuracy rate is 100%');

  // Test 7: Export & Import roundtrip
  const backup = exportBackup();
  assert(backup.version === 1, 'Backup version is 1');
  assert(backup.progress['日'] !== undefined, 'Backup contains progress data for 日');

  // Clear storage and test import
  mockLocalStorage.clear();
  assert(Object.keys(getAllProgress()).length === 0, 'Storage cleared');

  const importRes = importBackupData(backup);
  assert(importRes.success === true, 'Import succeeded');
  assert(getKanjiProgress('日').status === 'learning', 'Restored status for 日 after import');
  assert(getSettings().dailyTarget === 50, 'Restored settings after import');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
