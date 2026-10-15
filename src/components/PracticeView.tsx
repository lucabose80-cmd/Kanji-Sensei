import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  PenTool,
  ArrowRight,
  Trophy,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import type { KanjiItem, SessionResultItem, PracticeSessionStats } from '../types/kanji';
import { INITIAL_LEARNING_POOL } from '../data/mockKanji';
import { KanjiGridBox } from './KanjiGridBox';
import { PracticeCanvas } from './PracticeCanvas';
import { recordKanjiReview, getKanjiProgress, getDailySession } from '../services/storageService';
import radicalDecompositions from '../data/radicalDecompositions.json';

export interface PracticeViewProps {
  kanjiPool?: KanjiItem[];
  sessionSize?: number;
  onFinishSession?: (stats: PracticeSessionStats) => void;
  onBackToOverview?: () => void;
  initialStreak?: number;
}

interface QueueItem {
  kanji: KanjiItem;
  attempts: number;
  isRepeat: boolean;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  kanjiPool = INITIAL_LEARNING_POOL,
  sessionSize = 5,
  onFinishSession,
  onBackToOverview,
  initialStreak = 0,
}) => {
  // 1. Initialise practice session queue
  const initialBatch = useMemo(() => {
    // Take first N items from pool (or all if smaller)
    const available = kanjiPool.length > 0 ? kanjiPool : INITIAL_LEARNING_POOL;
    return available.slice(0, Math.min(sessionSize, available.length));
  }, [kanjiPool, sessionSize]);

  const [queue, setQueue] = useState<QueueItem[]>(() =>
    initialBatch.map((k) => ({
      kanji: k,
      attempts: 0,
      isRepeat: false,
    }))
  );

  const [initialCount] = useState<number>(initialBatch.length);
  const [completedItems, setCompletedItems] = useState<SessionResultItem[]>([]);
  const [totalRepeatsNeeded, setTotalRepeatsNeeded] = useState<number>(0);

  // Current Card State
  const [phase, setPhase] = useState<'prompt' | 'revealed' | 'completed'>('prompt');
  const [showHints, setShowHints] = useState<boolean>(false);
  const [showCanvas, setShowCanvas] = useState<boolean>(false);
  const [userDrawing, setUserDrawing] = useState<string>('');
  const [canvasStrokeCount, setCanvasStrokeCount] = useState<number>(0);
  const [repeatNotice, setRepeatNotice] = useState<string | null>(null);
  const [promotionNotice, setPromotionNotice] = useState<string | null>(null);

  // Streak state (loaded from getDailySession or localStorage)
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const session = getDailySession();
      if (typeof session.currentStreak === 'number') {
        return session.currentStreak;
      }
    } catch {}
    const saved = localStorage.getItem('kanji_practice_streak');
    return saved ? parseInt(saved, 10) : initialStreak;
  });

  const currentItem = queue[0] || null;
  const currentKanjiChar = currentItem?.kanji.kanji || '';
  const decompositions: Array<{ symbol: string; name: string }> = useMemo(() => {
    if (!currentKanjiChar) return [];
    return (radicalDecompositions as Record<string, Array<{ symbol: string; name: string }>>)[currentKanjiChar] || [];
  }, [currentKanjiChar]);

  // Trigger celebration on session finish
  const hasTriggeredConfetti = useRef<boolean>(false);
  useEffect(() => {
    if (phase === 'completed' && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;

      // Increment / save streak
      const newStreak = streakDays + 1;
      setStreakDays(newStreak);
      localStorage.setItem('kanji_practice_streak', newStreak.toString());
      localStorage.setItem('kanji_last_practice_date', new Date().toISOString());

      // Trigger multi-stage confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);

      if (onFinishSession) {
        const firstTryCount = completedItems.filter((i) => i.masteredFirstTry).length;
        const total = completedItems.length;
        onFinishSession({
          totalPracticed: total,
          firstTrySuccessCount: firstTryCount,
          totalRepeats: totalRepeatsNeeded,
          accuracy: total > 0 ? Math.round((firstTryCount / total) * 100) : 100,
          streakDays: newStreak,
        });
      }
    }
  }, [phase, completedItems, totalRepeatsNeeded, onFinishSession, streakDays]);

  // Handle Reveal Action
  const handleReveal = () => {
    setPhase('revealed');
  };

  // Handle Rating: Wrong / Repeat
  const handleMarkWrong = () => {
    if (!currentItem) return;

    // Record review in storage service (counts as incorrect attempt)
    const prevProgress = getKanjiProgress(currentItem.kanji.id);
    const reviewResult = recordKanjiReview(currentItem.kanji.id, false);

    // If it was previously known, notify user that it fell back to learning
    if (prevProgress.status === 'known' && reviewResult.progress.status === 'learning') {
      setRepeatNotice(`"${currentItem.kanji.primaryMeaning}" war unsicher ➔ Zurück in "Lerne ich" eingestuft.`);
    } else {
      setRepeatNotice(`"${currentItem.kanji.primaryMeaning}" wird am Ende der Session noch einmal geübt!`);
    }

    setTimeout(() => {
      setRepeatNotice(null);
    }, 3200);

    setTotalRepeatsNeeded((prev) => prev + 1);

    // Re-queue item to the end of the queue
    setQueue((prevQueue) => {
      const [failed, ...rest] = prevQueue;
      const reQueued: QueueItem = {
        ...failed,
        attempts: failed.attempts + 1,
        isRepeat: true,
      };
      return [...rest, reQueued];
    });

    // Reset card state for next item
    resetCardState();
  };

  // Handle Rating: Correct / Mastered for today
  const handleMarkCorrect = () => {
    if (!currentItem) return;

    const isFirstTry = currentItem.attempts === 0;
    const prevProgress = getKanjiProgress(currentItem.kanji.id);
    const reviewResult = recordKanjiReview(currentItem.kanji.id, isFirstTry);

    // Check if auto-promoted from 'learning' to 'known'
    if (prevProgress.status === 'learning' && reviewResult.progress.status === 'known') {
      setPromotionNotice(`🎉 "${currentItem.kanji.primaryMeaning}" gemeistert! Aufgestiegen zu "Kann ich" 🟢`);
      setTimeout(() => setPromotionNotice(null), 3800);
    }

    const result: SessionResultItem = {
      kanji: currentItem.kanji,
      attempts: currentItem.attempts + 1,
      masteredFirstTry: isFirstTry,
      userDrawingDataUrl: userDrawing || undefined,
    };

    setCompletedItems((prev) => [...prev, result]);

    setQueue((prevQueue) => {
      const [, ...rest] = prevQueue;
      if (rest.length === 0) {
        setPhase('completed');
      }
      return rest;
    });

    if (queue.length > 1) {
      resetCardState();
    }
  };

  const resetCardState = () => {
    setPhase('prompt');
    setShowHints(false);
    setUserDrawing('');
    setCanvasStrokeCount(0);
  };

  // Handle starting another 5 kanji
  const handleAddMoreKanji = () => {
    hasTriggeredConfetti.current = false;
    const startIndex = completedItems.length;
    const additional = kanjiPool.slice(startIndex, startIndex + 5);

    if (additional.length === 0) {
      // Loop or restart with pool
      const freshBatch = kanjiPool.slice(0, 5);
      setQueue(freshBatch.map((k) => ({ kanji: k, attempts: 0, isRepeat: false })));
    } else {
      setQueue(additional.map((k) => ({ kanji: k, attempts: 0, isRepeat: false })));
    }

    setCompletedItems([]);
    setTotalRepeatsNeeded(0);
    resetCardState();
  };

  // Restart current session
  const handleRestartSession = () => {
    hasTriggeredConfetti.current = false;
    setQueue(initialBatch.map((k) => ({ kanji: k, attempts: 0, isRepeat: false })));
    setCompletedItems([]);
    setTotalRepeatsNeeded(0);
    resetCardState();
  };

  // Calculate Progress Stats
  const completedCount = completedItems.length;
  const progressPercent = Math.min(100, Math.round((completedCount / initialCount) * 100));
  const remainingInQueue = queue.length;
  const isCurrentlyRepeat = currentItem?.isRepeat || false;

  // -------------------------------------------------------------
  // RENDER: Session Completed Screen
  // -------------------------------------------------------------
  if (phase === 'completed') {
    const firstTryCount = completedItems.filter((i) => i.masteredFirstTry).length;
    const accuracy = completedItems.length > 0 ? Math.round((firstTryCount / completedItems.length) * 100) : 100;

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in text-slate-800 dark:text-slate-100">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 mb-4 shadow-sm border border-amber-200 dark:border-amber-800 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Tagesziel erreicht! 🎉
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Du hast heute alle Kanji erfolgreich in dein Notizheft geschrieben.
          </p>

          {/* Daily Streak Badge */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
            <span className="text-sm sm:text-base">🔥 {streakDays} Tage in Folge geübt!</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {completedItems.length}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Geübte Kanji
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Direkt im 1. Versuch
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {totalRepeatsNeeded}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Wiederholungen
            </div>
          </div>
        </div>

        {/* List of today's practiced Kanji */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Heute im Notizheft verewigt:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {completedItems.map((item, idx) => (
              <div
                key={`completed-${idx}`}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                {/* Mini Tianzige grid */}
                <KanjiGridBox
                  kanji={item.kanji.kanji}
                  strokePaths={item.kanji.strokePaths}
                  size="sm"
                  interactive={false}
                  className="shrink-0 scale-90"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {item.kanji.primaryMeaning}
                    </span>
                    {item.masteredFirstTry ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3" /> 1. Versuch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                        <RotateCcw className="w-3 h-3" /> Wiederholt
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    On: {item.kanji.onyomi.map((o) => o.kana).join(', ') || '–'} | Kun:{' '}
                    {item.kanji.kunyomi.map((k) => k.kana).join(', ') || '–'}
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {item.kanji.strokeCount} Striche • Radikal: {item.kanji.radical.symbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleAddMoreKanji}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
          >
            <RefreshCw className="w-4 h-4" />
            Noch 5 weitere üben
          </button>

          {onBackToOverview ? (
            <button
              type="button"
              onClick={onBackToOverview}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700"
            >
              <BookOpen className="w-4 h-4" />
              Zur Übersicht
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestartSession}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              Session wiederholen
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Keine Kanji in der Übungsschlange.</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Active Practice Session (Prompt & Reveal Views)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6">
      {/* Top Header & Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
              Kanji {completedCount + 1} von {initialCount}
            </span>

            {isCurrentlyRepeat && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800 text-xs animate-pulse">
                <RotateCcw className="w-3 h-3" /> Wiederholung ({currentItem.attempts})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {remainingInQueue > 1 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Noch {remainingInQueue} in Warteschlange
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 font-bold text-orange-500"
              title={`${streakDays} ${streakDays === 1 ? 'Tag' : 'Tage'} in Folge geübt`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{streakDays} {streakDays === 1 ? 'Tag' : 'Tage'}</span>
            </span>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Floating repeat notification */}
        {repeatNotice && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-bounce">
            <Info className="w-4 h-4 shrink-0" />
            <span>{repeatNotice}</span>
          </div>
        )}

        {/* Promotion to 'known' celebration notice */}
        {promotionNotice && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{promotionNotice}</span>
          </div>
        )}
      </div>

      {/* Main Study Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 shadow-md p-5 sm:p-7 transition-all">
        {/* =======================================================
            PHASE 1: PROMPT VIEW (Notizheft Schreibaufforderung)
            ======================================================= */}
        {phase === 'prompt' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            {/* Visual Callout Box for Notebook Writing */}
            <div className="w-full p-4 mb-6 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Schreibe dieses Zeichen jetzt in dein Notizheft!
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Zeichne das Kanji aus dem Gedächtnis mit der korrekten Strichfolge auf Papier.
                </div>
              </div>
            </div>

            {/* Prominent German Meaning Display */}
            <div className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Bedeutung
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-1 mb-2">
                {currentItem.kanji.primaryMeaning}
              </h1>

              {currentItem.kanji.meanings.length > 1 && (
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  Auch: {currentItem.kanji.meanings.slice(1).join(', ')}
                </p>
              )}
            </div>

            {/* Optional Collapsible Hints */}
            <div className="w-full mb-6">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>{showHints ? 'Hinweise verbergen' : '💡 Hinweise aufklappen'}</span>
                {showHints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHints && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs animate-fade-in">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Striche
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {currentItem.kanji.strokeCount} Striche
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Level
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {currentItem.kanji.jlpt}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Radikal
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {currentItem.kanji.radical.symbol} ({currentItem.kanji.radical.meaning})
                    </span>
                  </div>

                  {decompositions && decompositions.length > 0 && (
                    <div className="col-span-3 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-left">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                        🧩 Bausteine (Radikale):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {decompositions.map((comp, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                          >
                            <span className="font-serif font-bold text-indigo-600 dark:text-indigo-400">
                              {comp.symbol}
                            </span>
                            <span>{comp.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Digital Canvas (for on-the-go without paper) */}
            <div className="w-full flex flex-col items-center mb-6">
              <button
                type="button"
                onClick={() => setShowCanvas(!showCanvas)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors mb-3"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>
                  {showCanvas
                    ? 'Digitales Zeichenpad einklappen'
                    : '✍️ Kein Papier zur Hand? Hier digital vorzeichnen'}
                </span>
              </button>

              {showCanvas && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center animate-fade-in">
                  <PracticeCanvas
                    width={260}
                    height={260}
                    onExportDrawing={(dataUrl) => setUserDrawing(dataUrl)}
                    onStrokeCountChange={(count) => setCanvasStrokeCount(count)}
                    placeholderText="Zeichen hier mit Finger/Stylus malen"
                  />
                  {canvasStrokeCount > 0 && (
                    <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Zeichnung erfasst ({canvasStrokeCount} Striche)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Big Prominent Reveal Button */}
            <button
              type="button"
              onClick={handleReveal}
              className="w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-xl font-extrabold text-base sm:text-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              <Eye className="w-5 h-5" />
              <span>Aufdecken / Fertig gemalt</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}

        {/* =======================================================
            PHASE 2: REVEAL & COMPARISON VIEW (Aufdeck-Ansicht)
            ======================================================= */}
        {phase === 'revealed' && (
          <div className="flex flex-col items-center animate-fade-in">
            {/* Header prompt reminder */}
            <div className="text-center mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Vergleiche mit deinem Notizheft
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {currentItem.kanji.primaryMeaning}
              </h2>
            </div>

            {/* Side-by-side or Centered Tianzige Practice Grid */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6 w-full">
              {/* User Drawing (if digital canvas was used) */}
              {userDrawing && (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <PenTool className="w-3 h-3" /> Deine Zeichnung
                  </span>
                  <div className="relative overflow-hidden rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-amber-50/20 dark:bg-slate-900/90 w-[200px] h-[200px] flex items-center justify-center shadow-inner">
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="3,3" strokeWidth="0.8" className="stroke-red-300 dark:stroke-red-800/60" />
                      <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="3,3" strokeWidth="0.8" className="stroke-red-300 dark:stroke-red-800/60" />
                    </svg>
                    <img
                      src={userDrawing}
                      alt="Benutzer-Zeichnung"
                      className="relative z-10 w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Master Kanji in Tianzige 2x2 Grid with Step-by-Step Viewer */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Original Kanji (Tianzige 2x2 Raster)
                </span>
                <KanjiGridBox
                  kanji={currentItem.kanji.kanji}
                  strokePaths={currentItem.kanji.strokePaths}
                  strokeCount={currentItem.kanji.strokeCount}
                  size={userDrawing ? 'md' : 'lg'}
                  interactive={true}
                  showStepByStep={true}
                />
              </div>
            </div>

            {/* Kanji Details Card: Readings, Radicals, JLPT */}
            <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 mb-6">
              {/* Readings: On-Yomi & Kun-Yomi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                {/* On-Yomi */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    On-Yomi (音読み - Katakana)
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {currentItem.kanji.onyomi.length > 0
                      ? currentItem.kanji.onyomi
                          .map((o) => `${o.kana} (${o.romaji})`)
                          .join(', ')
                      : '–'}
                  </div>
                </div>

                {/* Kun-Yomi */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Kun-Yomi (訓読み - Hiragana)
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {currentItem.kanji.kunyomi.length > 0
                      ? currentItem.kanji.kunyomi
                          .map((k) => `${k.kana} (${k.romaji})`)
                          .join(', ')
                      : '–'}
                  </div>
                </div>
              </div>

              {/* Stroke Count & Radical Breakdown */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold">
                    {currentItem.kanji.jlpt}
                  </span>
                  <span>{currentItem.kanji.strokeCount} Striche</span>
                </div>

                <div className="font-medium">
                  <span className="text-slate-400">Hauptradikal:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {currentItem.kanji.radical.symbol}
                  </span>{' '}
                  ({currentItem.kanji.radical.meaning})
                </div>
              </div>

              {/* Radical Decomposition (Bausteine / Zerlegung) */}
              {decompositions && decompositions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span>🧩 Bausteine / Radikale:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {decompositions.map((comp, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
                      >
                        <span className="font-serif font-bold text-base text-indigo-600 dark:text-indigo-400">
                          {comp.symbol}
                        </span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {comp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Example Compounds (Jukugo) & Sentences with Furigana */}
            {currentItem.kanji.examples.length > 0 && (
              <div className="w-full mb-6 text-left">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Häufige Wörter & Beispielsätze (Jukugo)
                </h4>

                <div className="space-y-2">
                  {currentItem.kanji.examples.map((ex, exIdx) => (
                    <div
                      key={`ex-${exIdx}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {/* Word with Furigana */}
                        <ruby className="text-base font-bold text-slate-900 dark:text-white">
                          {ex.word}
                          <rt className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {ex.furigana}
                          </rt>
                        </ruby>
                        <span className="text-xs text-slate-400 font-mono">({ex.romaji})</span>
                      </div>

                      <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                        {ex.meaning}
                      </div>
                    </div>
                  ))}

                  {/* Sample Sentence if available */}
                  {currentItem.kanji.sentences && currentItem.kanji.sentences.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-slate-900/40 border border-amber-200/60 dark:border-slate-700/60 text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {currentItem.kanji.sentences[0].japanese}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentItem.kanji.sentences[0].meaning}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evaluation Decision Buttons */}
            <div className="w-full pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
              {/* Mark wrong / repeat button */}
              <button
                type="button"
                onClick={handleMarkWrong}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border-2 border-rose-200 dark:border-rose-900 transition-all hover:scale-[1.01]"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>❌ Noch nicht sicher / Nochmal üben</span>
              </button>

              {/* Mark correct / learned button */}
              <button
                type="button"
                onClick={handleMarkCorrect}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>✅ Richtig gemalt!</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeView;
