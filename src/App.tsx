import { useState } from 'react';
import PracticeView from './components/PracticeView';
import { BookMarked, Moon, Sun, RotateCcw } from 'lucide-react';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* App Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              漢
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                Kanji Sensei
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Notizheft-Modus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSessionKey((k) => k + 1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Session neu starten"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Practice Flow */}
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <PracticeView key={sessionKey} sessionSize={5} />
      </main>

      {/* Footer Info */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-1.5 mb-1 font-medium">
          <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
          <span>Tipp: Notiere dir jedes Kanji mit Strichfolge in einem echten Genkouyoushi- oder Tianzige-Heft.</span>
        </div>
        <p className="opacity-80">Kanji Sensei • Tägliches Notizheft-Schreibtraining</p>
      </footer>
    </div>
  );
}

export default App;
