import React, { useEffect, useCallback } from 'react';
import type { KanjiItem } from '../types/kanji';
import type { KanjiStatus } from '../types/storage';
import { KanjiGridBox } from './KanjiGridBox';
import radicalDecompositions from '../data/radicalDecompositions.json';
import {
  X,
  Volume2,
  CheckCircle2,
  Clock,
  Circle,
  BookOpen,
  Sparkles,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface KanjiDetailModalProps {
  kanji: KanjiItem | null;
  status: KanjiStatus;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: KanjiStatus) => void;
  onStartPractice?: (kanji: KanjiItem) => void;
}

export const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({
  kanji,
  status,
  isOpen,
  onClose,
  onStatusChange,
  onStartPractice,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !kanji) return null;

  // Speak Japanese pronunciation
  const speakJapanese = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis may be disabled or unsupported
    }
  };

  // JLPT Level colors
  const jlptColors: Record<string, string> = {
    N5: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    N4: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    N3: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300 dark:border-violet-800',
    N2: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    N1: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-kanji-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                jlptColors[kanji.jlpt] || jlptColors.N5
              }`}
            >
              JLPT {kanji.jlpt}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {kanji.grade && kanji.grade <= 6
                ? `${kanji.grade}. Klasse`
                : kanji.grade === 8
                ? 'Sekundarstufe'
                : 'Joyo Kanji'}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {kanji.strokeCount} {kanji.strokeCount === 1 ? 'Strich' : 'Striche'}
            </span>
            {kanji.frequency && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                Rang #{kanji.frequency}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {/* Main Visual: Kanji Grid Box + German Meaning & Audio */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Tianzige Stroke Grid Viewer */}
            <div className="shrink-0 flex flex-col items-center">
              <KanjiGridBox
                kanji={kanji.kanji}
                strokePaths={kanji.strokePaths}
                strokeCount={kanji.strokeCount}
                size={160}
                gridType="tianzige"
                showStepByStep={Boolean(kanji.strokePaths && kanji.strokePaths.length > 0)}
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Schreibgitter (Tianzige)
              </span>
            </div>

            {/* Kanji Info & Pronounce Button */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2
                  id="modal-kanji-title"
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  {kanji.primaryMeaning}
                </h2>
                <button
                  type="button"
                  title="Aussprache anhören"
                  onClick={() => speakJapanese(kanji.kanji)}
                  className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Meanings overview */}
              {kanji.meanings && kanji.meanings.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                  {kanji.meanings.map((m, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Radical / Busshu Info */}
              {kanji.radical && (
                <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-semibold text-slate-500">Hauptradikal:</span>
                  <span
                    lang="ja"
                    className="font-serif px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-bold"
                  >
                    {kanji.radical.symbol}
                  </span>
                  <span>{kanji.radical.meaning || kanji.radical.name}</span>
                </div>
              )}

              {/* Radical Decomposition (Bausteine) */}
              {(() => {
                const comps = (radicalDecompositions as Record<string, Array<{ symbol: string; name: string }>>)[kanji.kanji] || [];
                if (comps.length === 0) return null;
                return (
                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-500 block mb-1">🧩 Bausteine (Radikale):</span>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      {comps.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                        >
                          <span className="font-serif font-bold text-indigo-600 dark:text-indigo-400">
                            {c.symbol}
                          </span>
                          <span>{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Status Wahlschalter (Segmented Controller) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Lernstatus festlegen
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Status 1: Unlearned */}
              <button
                type="button"
                onClick={() => onStatusChange(kanji.id, 'unlearned')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  status === 'unlearned'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-400 dark:border-slate-500 ring-2 ring-slate-400/30 font-semibold'
                    : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Circle className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-xs">Noch offen</span>
                <span className="text-[10px] opacity-70">Standard</span>
              </button>

              {/* Status 2: Learning */}
              <button
                type="button"
                onClick={() => onStatusChange(kanji.id, 'learning')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  status === 'learning'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 font-semibold'
                    : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                }`}
              >
                <Clock className="w-5 h-5 mb-1 text-amber-500 fill-amber-500/20" />
                <span className="text-xs">Lerne ich</span>
                <span className="text-[10px] opacity-70">Im Tagespool</span>
              </button>

              {/* Status 3: Known */}
              <button
                type="button"
                onClick={() => onStatusChange(kanji.id, 'known')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  status === 'known'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30 font-semibold'
                    : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-500 fill-emerald-500/20" />
                <span className="text-xs">Kann ich</span>
                <span className="text-[10px] opacity-70">Gemeistert</span>
              </button>
            </div>
          </div>

          {/* Readings Section: Onyomi & Kunyomi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kunyomi (Hiragana) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Kun-Lesung (Japanisch)
              </div>
              {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                <div className="space-y-1.5">
                  {kanji.kunyomi.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                    >
                      <span lang="ja" className="font-semibold text-slate-800 dark:text-slate-100">
                        {r.kana}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {r.romaji}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Keine Kun-Lesung</span>
              )}
            </div>

            {/* Onyomi (Katakana) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                <Layers className="w-3.5 h-3.5 text-violet-500" />
                On-Lesung (Sino-Japanisch)
              </div>
              {kanji.onyomi && kanji.onyomi.length > 0 ? (
                <div className="space-y-1.5">
                  {kanji.onyomi.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                    >
                      <span lang="ja" className="font-semibold text-slate-800 dark:text-slate-100">
                        {r.kana}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {r.romaji}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Keine On-Lesung</span>
              )}
            </div>
          </div>

          {/* Examples / Compound Words */}
          {kanji.examples && kanji.examples.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Beispiel-Wörter & Zusammensetzungen
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {kanji.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span
                          lang="ja"
                          className="font-bold text-base text-slate-900 dark:text-slate-100"
                        >
                          {ex.word}
                        </span>
                        <span lang="ja" className="text-xs text-indigo-600 dark:text-indigo-400">
                          {ex.furigana}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {ex.meaning}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Aussprache anhören"
                      onClick={() => speakJapanese(ex.word)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Sentences if any */}
          {kanji.sentences && kanji.sentences.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Beispielsatz
              </span>
              {kanji.sentences.map((sent, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm"
                >
                  <p lang="ja" className="font-semibold text-slate-800 dark:text-slate-200">
                    {sent.japanese}
                  </p>
                  {sent.furigana && (
                    <p lang="ja" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sent.furigana}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                    {sent.meaning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Schließen
          </button>

          {onStartPractice && (
            <button
              type="button"
              onClick={() => {
                onStartPractice(kanji);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              <span>Dieses Zeichen üben</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
