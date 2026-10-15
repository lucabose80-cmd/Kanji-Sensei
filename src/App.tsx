import { useState, useMemo } from 'react';
import PracticeView from './components/PracticeView';
import { KanjiBrowser } from './components/KanjiBrowser';
import { ALL_KANJI, TOTAL_KANJI_COUNT } from './data/allKanji';
import { useStorage } from './hooks/useStorage';
import { BookMarked, Moon, Sun, RotateCcw, LayoutGrid, PenTool, Sliders, Download, Upload } from 'lucide-react';
import type { KanjiItem } from './types/kanji';
import { downloadBackupFile, uploadBackupFile } from './services/storageService';

type ActiveTab = 'browser' | 'practice';

function App() {
  const [sessionKey, setSessionKey] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('browser');
  const [customPracticePool, setCustomPracticePool] = useState<KanjiItem[] | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const { progress, settings, updateSettings } = useStorage();
  const isDark = settings.darkTheme;

  const toggleDarkMode = () => {
    updateSettings({ darkTheme: !isDark });
  };

  // Derive practice pool from all kanji based on user status and settings
  const currentLearningKanji = useMemo(() => {
    const learning = ALL_KANJI.filter((k) => progress[k.id]?.status === 'learning');
    const known = ALL_KANJI.filter((k) => progress[k.id]?.status === 'known');
    const unlearned = ALL_KANJI.filter((k) => !progress[k.id] || progress[k.id]?.status === 'unlearned');

    let pool = [...learning];

    // If includeKnownInPool is enabled, add 1-3 known kanji as refresher
    if (settings.includeKnownInPool && known.length > 0) {
      const eligibleKnown = known.filter((k) => !pool.some((p) => p.id === k.id));
      const shuffledKnown = [...eligibleKnown].sort(() => Math.random() - 0.5);
      pool = [...pool, ...shuffledKnown.slice(0, 3)];
    }

    const target = settings.dailyTarget || 10;
    const remainingSlots = target - pool.length;

    // Intelligent Filling if active pool has fewer than dailyTarget kanji:
    if (remainingSlots > 0) {
      if (settings.fillStrategy === 'known') {
        // Option B: Fill remaining slots with already learned/mastered kanji ("Kann ich")
        const eligibleKnown = known.filter((k) => !pool.some((p) => p.id === k.id));
        const shuffledKnown = [...eligibleKnown].sort(() => Math.random() - 0.5);
        pool = [...pool, ...shuffledKnown.slice(0, remainingSlots)];

        // Fallback to unlearned if known pool does not have enough kanji
        if (pool.length < target) {
          const eligibleUnlearned = unlearned.filter((k) => !pool.some((p) => p.id === k.id));
          pool = [...pool, ...eligibleUnlearned.slice(0, target - pool.length)];
        }
      } else {
        // Option A (Default): Fill remaining slots with next unlearned kanji in school grade order
        const eligibleUnlearned = unlearned.filter((k) => !pool.some((p) => p.id === k.id));
        pool = [...pool, ...eligibleUnlearned.slice(0, remainingSlots)];

        // Fallback to known if unlearned pool is completely finished
        if (pool.length < target) {
          const eligibleKnown = known.filter((k) => !pool.some((p) => p.id === k.id));
          const shuffledKnown = [...eligibleKnown].sort(() => Math.random() - 0.5);
          pool = [...pool, ...shuffledKnown.slice(0, target - pool.length)];
        }
      }
    }

    // Safety fallback
    if (pool.length === 0) {
      pool = ALL_KANJI.slice(0, target);
    }

    return pool;
  }, [progress, settings.dailyTarget, settings.includeKnownInPool, settings.fillStrategy]);

  const handleStartPracticeWithIds = (kanjiIds: string[]) => {
    const selected = ALL_KANJI.filter((k) => kanjiIds.includes(k.id));
    setCustomPracticePool(selected.length > 0 ? selected : currentLearningKanji);
    setSessionKey((k) => k + 1);
    setActiveTab('practice');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* App Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              漢
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Kanji Sensei
              </span>
              <span className="hidden md:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Lernportal
              </span>
            </div>
          </div>

          {/* Navigation Tabs: Browser vs Practice */}
          <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('browser')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'browser'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kanji-Auswahl ({TOTAL_KANJI_COUNT.toLocaleString('de-DE')})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomPracticePool(null);
                setActiveTab('practice');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'practice'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Tagesübung</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tagesziel & Einstellungen"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {activeTab === 'practice' && (
              <button
                type="button"
                onClick={() => setSessionKey((k) => k + 1)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Session neu starten"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal (Daily Target 5-10, Backup Export/Import) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              Tagesziel & Einstellungen
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="daily-target-slider" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tägliches Schreibziel:
                  </label>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    {settings.dailyTarget} Zeichen / Tag
                  </span>
                </div>
                <input
                  id="daily-target-slider"
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={settings.dailyTarget}
                  onChange={(e) => updateSettings({ dailyTarget: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5 Zeichen (Schnell)</span>
                  <span>10 (Empfohlen)</span>
                  <span>20 (Intensiv)</span>
                </div>
              </div>

              {/* Fill Strategy Selector */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Fehlende Tagesplätze auffüllen mit:
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wenn du aktuell weniger Zeichen in „Lerne ich“ hast als dein Tagesziel (z. B. 6 von 10):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => updateSettings({ fillStrategy: 'unlearned' })}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      settings.fillStrategy === 'unlearned'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <span>⚪</span> Neuen Zeichen
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          settings.fillStrategy === 'unlearned'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {settings.fillStrategy === 'unlearned' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nächste noch ungelernte Kanji nach Schulstufe (Grade 1 ➔ 2...)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettings({ fillStrategy: 'known' })}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      settings.fillStrategy === 'known'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <span>🟢</span> Bereits Gelernten
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          settings.fillStrategy === 'known'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {settings.fillStrategy === 'known' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bereits gemeisterte Kanji („Kann ich“) zur Wiederholung
                    </span>
                  </button>
                </div>
              </div>

              {/* Include Mastered / Known Kanji Refresher Toggle */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.includeKnownInPool}
                    onChange={(e) => updateSettings({ includeKnownInPool: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Gemeisterte Kanji ("Kann ich") einstreuen
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Streut gelegentlich 1–3 bereits gemeisterte Zeichen zur Auffrischung in die Tagesübung ein, damit du sie nicht vergisst.
                    </div>
                  </div>
                </label>
              </div>

              {/* Learning System Info Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📈 Wie funktioniert das Aufstiegssystem?</span>
                </div>
                <p>
                  • <strong>Aufstieg:</strong> Ein Zeichen in <em>„Lerne ich“</em> steigt automatisch zu <em>„Kann ich“</em> auf, wenn du es <strong>mindestens 3-mal</strong> geübt hast und eine Trefferquote von <strong>≥ 75%</strong> erreichst.
                </p>
                <p>
                  • <strong>Herausfallen:</strong> Klickst du bei einem gemeisterten Zeichen auf <em>„Noch nicht sicher“</em>, wird es automatisch wieder auf <em>„Lerne ich“</em> zurückgestuft.
                </p>
              </div>

              {/* Backup & Restore Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>💾 Datensicherung & Übertragung</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lade deinen Lernstand als JSON-Datei herunter (Backup) oder importiere ihn auf einem neuen Smartphone:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      downloadBackupFile();
                      setBackupNotice('✓ Backup erfolgreich heruntergeladen!');
                      setTimeout(() => setBackupNotice(null), 3000);
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    <span>Backup exportieren</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>Backup importieren</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const res = await uploadBackupFile(file);
                        if (res.success) {
                          setBackupNotice('✓ ' + res.message);
                          setSessionKey((k) => k + 1);
                        } else {
                          setBackupNotice('❌ ' + res.message);
                        }
                        setTimeout(() => setBackupNotice(null), 4000);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {backupNotice && (
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs text-center font-medium animate-fade-in">
                    {backupNotice}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full pb-10">
        {activeTab === 'browser' ? (
          <KanjiBrowser onStartPractice={handleStartPracticeWithIds} />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
            <PracticeView
              key={sessionKey}
              kanjiPool={customPracticePool || currentLearningKanji}
              sessionSize={settings.dailyTarget || 10}
              onBackToOverview={() => setActiveTab('browser')}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-center gap-1.5 mb-1 font-medium">
          <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
          <span>Tipp: Notiere dir jedes Kanji mit Strichfolge in deinem Notizheft außerhalb der App.</span>
        </div>
        <p className="opacity-80">Kanji Sensei • {TOTAL_KANJI_COUNT.toLocaleString('de-DE')} Joyo & JLPT-Kanji mit deutscher Bedeutung</p>
      </footer>
    </div>
  );
}

export default App;
