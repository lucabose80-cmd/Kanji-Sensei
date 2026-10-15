import { useState, useMemo } from 'react';
import PracticeView from './components/PracticeView';
import { KanjiBrowser } from './components/KanjiBrowser';
import { ALL_KANJI, TOTAL_KANJI_COUNT } from './data/allKanji';
import { useStorage } from './hooks/useStorage';
import { BookMarked, Moon, Sun, RotateCcw, LayoutGrid, PenTool, Sliders } from 'lucide-react';
import type { KanjiItem } from './types/kanji';

type ActiveTab = 'browser' | 'practice';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('browser');
  const [customPracticePool, setCustomPracticePool] = useState<KanjiItem[] | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { progress, settings, updateSettings } = useStorage();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Derive learning pool from all kanji based on user status
  const currentLearningKanji = useMemo(() => {
    const list = ALL_KANJI.filter((k) => progress[k.id]?.status === 'learning');
    return list.length > 0 ? list : ALL_KANJI.slice(0, settings.dailyTarget || 10);
  }, [progress, settings.dailyTarget]);

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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
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
