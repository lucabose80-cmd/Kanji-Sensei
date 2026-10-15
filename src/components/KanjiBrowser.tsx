import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { KanjiItem, JLPTLevel } from '../types/kanji';
import type { KanjiStatus } from '../types/storage';
import { ALL_KANJI, TOTAL_KANJI_COUNT } from '../data/allKanji';
import { useStorage } from '../hooks/useStorage';
import { KanjiCard } from './KanjiCard';
import { KanjiDetailModal } from './KanjiDetailModal';
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  Circle,
  Play,
  RotateCcw,
  CheckSquare,
  Sparkles,
  ChevronDown,
  Filter,
} from 'lucide-react';

export type StatusFilterOption = 'all' | 'learning' | 'known' | 'unlearned';
export type JLPTFilterOption = 'all' | JLPTLevel;
export type GradeFilterOption = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | 'secondary';
export type SortOption =
  | 'frequency-asc'
  | 'stroke-asc'
  | 'stroke-desc'
  | 'grade-asc'
  | 'alpha-asc'
  | 'jlpt-desc';

export interface KanjiBrowserProps {
  kanjiList?: KanjiItem[];
  onStartPractice?: (kanjiIds: string[]) => void;
  className?: string;
}

const ITEMS_PER_PAGE = 72;

export const KanjiBrowser: React.FC<KanjiBrowserProps> = ({
  kanjiList = ALL_KANJI,
  onStartPractice,
  className = '',
}) => {
  const {
    progress,
    stats,
    markKanjiStatus,
    markMultipleKanjiStatus,
    initQueue,
    session,
  } = useStorage(kanjiList.length || TOTAL_KANJI_COUNT);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [jlptFilter, setJlptFilter] = useState<JLPTFilterOption>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('frequency-asc');

  // Pagination / Infinite loading
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  // Detail Modal State
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Multi-Selection / Batch Actions State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search input focus ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset pagination when search or filters change (React standard render-phase reset)
  const filterKey = `${searchQuery}|${statusFilter}|${jlptFilter}|${gradeFilter}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(ITEMS_PER_PAGE);
  }

  // Show auto-dismissing toast notifications
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Helper to get status of a single kanji
  const getStatus = useCallback(
    (id: string): KanjiStatus => {
      return progress[id]?.status || 'unlearned';
    },
    [progress]
  );

  // Quick live counts from full dataset
  const dynamicCounts = useMemo(() => {
    let learning = 0;
    let known = 0;
    let unlearned = 0;

    for (const item of kanjiList) {
      const st = progress[item.id]?.status || 'unlearned';
      if (st === 'learning') learning++;
      else if (st === 'known') known++;
      else unlearned++;
    }

    return {
      total: kanjiList.length,
      learning,
      known,
      unlearned,
    };
  }, [kanjiList, progress]);

  // Comprehensive Filter & Search Logic
  const filteredKanji = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return kanjiList.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const itemStatus = getStatus(item.id);
        if (statusFilter !== itemStatus) return false;
      }

      // 2. JLPT Filter
      if (jlptFilter !== 'all' && item.jlpt !== jlptFilter) {
        return false;
      }

      // 3. Grade Filter
      if (gradeFilter !== 'all') {
        if (gradeFilter === 'secondary') {
          if (item.grade !== 8 && item.grade !== 9 && (item.grade ?? 0) <= 6) return false;
        } else {
          const targetGrade = parseInt(gradeFilter, 10);
          if (item.grade !== targetGrade) return false;
        }
      }

      // 4. Search Query matching: Kanji, German meanings, English meanings, Romaji, Hiragana, Katakana
      if (query) {
        // Direct character match
        if (item.kanji === query) return true;

        // Primary & other meanings match
        if (item.primaryMeaning.toLowerCase().includes(query)) return true;
        if (item.meanings.some((m) => m.toLowerCase().includes(query))) return true;

        // Readings Kana & Romaji match
        if (
          item.kunyomi.some(
            (r) => r.kana.includes(query) || r.romaji.toLowerCase().includes(query)
          )
        )
          return true;
        if (
          item.onyomi.some(
            (r) => r.kana.includes(query) || r.romaji.toLowerCase().includes(query)
          )
        )
          return true;

        // Radical name or symbol match
        if (
          item.radical?.symbol === query ||
          item.radical?.name?.toLowerCase().includes(query) ||
          item.radical?.meaning?.toLowerCase().includes(query)
        )
          return true;

        return false;
      }

      return true;
    });
  }, [kanjiList, searchQuery, statusFilter, jlptFilter, gradeFilter, getStatus]);

  // Sorting
  const sortedKanji = useMemo(() => {
    const list = [...filteredKanji];

    switch (sortBy) {
      case 'frequency-asc':
        return list.sort((a, b) => (a.frequency ?? 9999) - (b.frequency ?? 9999));
      case 'stroke-asc':
        return list.sort((a, b) => a.strokeCount - b.strokeCount);
      case 'stroke-desc':
        return list.sort((a, b) => b.strokeCount - a.strokeCount);
      case 'grade-asc':
        return list.sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99));
      case 'alpha-asc':
        return list.sort((a, b) => a.primaryMeaning.localeCompare(b.primaryMeaning, 'de'));
      case 'jlpt-desc': {
        const jlptWeights: Record<JLPTLevel, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
        return list.sort((a, b) => jlptWeights[a.jlpt] - jlptWeights[b.jlpt]);
      }
      default:
        return list;
    }
  }, [filteredKanji, sortBy]);

  // Paginated slice for buttery-smooth rendering
  const paginatedKanji = useMemo(() => {
    return sortedKanji.slice(0, visibleCount);
  }, [sortedKanji, visibleCount]);

  // Card click: open modal
  const handleCardClick = (kanji: KanjiItem) => {
    setActiveKanji(kanji);
    setIsDetailOpen(true);
  };

  // Status Change handler
  const handleStatusChange = (id: string, status: KanjiStatus) => {
    markKanjiStatus(id, status);
  };

  // Toggle selection of single card
  const handleToggleSelect = (kanji: KanjiItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(kanji.id)) {
        next.delete(kanji.id);
      } else {
        next.add(kanji.id);
      }
      return next;
    });
  };

  // Select all visible/filtered
  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    sortedKanji.forEach((k) => newSelected.add(k.id));
    setSelectedIds(newSelected);
    setIsSelectionMode(true);
    showToast(`${sortedKanji.length} Kanji ausgewählt`);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  // Apply batch status to selected
  const handleApplyBatchStatus = (newStatus: KanjiStatus) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    markMultipleKanjiStatus(ids, newStatus);
    const statusLabel =
      newStatus === 'learning' ? 'Lerne ich' : newStatus === 'known' ? 'Kann ich' : 'Offen';
    showToast(`${ids.length} Kanji auf "${statusLabel}" gesetzt!`);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  // Batch Preset 1: Add all JLPT N5 to 'learning'
  const handleAddAllN5ToLearning = () => {
    const n5List = kanjiList.filter((k) => k.jlpt === 'N5');
    const ids = n5List.map((k) => k.id);
    markMultipleKanjiStatus(ids, 'learning');
    showToast(`Alle ${ids.length} JLPT N5-Kanji zu "Lerne ich" hinzugefügt!`);
  };

  // Batch Preset 2: Add all Grade 1 to 'learning'
  const handleAddAllGrade1ToLearning = () => {
    const g1List = kanjiList.filter((k) => k.grade === 1);
    const ids = g1List.map((k) => k.id);
    markMultipleKanjiStatus(ids, 'learning');
    showToast(`Alle ${ids.length} Grundschul-Kanji (Klasse 1) zu "Lerne ich" hinzugefügt!`);
  };

  // Quick Action: Tägliche Übung starten
  const handleStartDailyPractice = () => {
    // Collect active learning Kanji or init queue
    const learningKanjiIds = kanjiList
      .filter((k) => getStatus(k.id) === 'learning')
      .map((k) => k.id);

    let queue = session.queue;
    if (queue.length === 0) {
      const allIds = learningKanjiIds.length > 0 ? learningKanjiIds : kanjiList.slice(0, 50).map((k) => k.id);
      const newSession = initQueue(allIds);
      queue = newSession.queue;
    }

    if (onStartPractice) {
      onStartPractice(queue);
    } else {
      showToast(`Tagesübung mit ${queue.length} Kanji initialisiert!`);
    }
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setJlptFilter('all');
    setGradeFilter('all');
    setSortBy('frequency-asc');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    jlptFilter !== 'all' ||
    gradeFilter !== 'all' ||
    sortBy !== 'frequency-asc';

  return (
    <div className={`w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-200 text-sm font-medium animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. STATISTIK-HEADER / DASHBOARD
          ========================================================================= */}
      <section className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-5 sm:p-7 rounded-3xl border border-indigo-100/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Decorative background kanji watermark */}
        <div
          className="absolute -right-6 -bottom-10 text-9xl font-serif text-indigo-500/5 dark:text-indigo-400/5 select-none pointer-events-none"
          aria-hidden="true"
        >
          漢
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Title & App Intro */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Kanji Sensei
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {dynamicCounts.total.toLocaleString('de-DE')} Zeichen verfügbar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kanji-Verwaltung & Auswahl
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Wähle deine persönlichen Lernziele aus, organisiere deinen täglichen Übungspool und
              verfolge deinen Fortschritt vom Anfänger bis zum N1-Meister.
            </p>
          </div>

          {/* Quick Practice Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleStartDailyPractice}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Tägliche Übung starten</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500 text-white font-mono">
                {session.queue.length || stats.todayTargetCount || 10}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Lerne ich, Kann ich, Offen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
          {/* Card 1: Lerne ich (Yellow/Amber) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'learning' ? 'all' : 'learning')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
              statusFilter === 'learning'
                ? 'bg-amber-100/70 border-amber-400 dark:bg-amber-950/80 dark:border-amber-600 ring-2 ring-amber-400/40'
                : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800/60">
                <Clock className="w-5 h-5 fill-amber-500/20" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  Lerne ich (Tagespool)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {dynamicCounts.learning.toLocaleString('de-DE')}
                </span>
              </div>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              {Math.round((dynamicCounts.learning / (dynamicCounts.total || 1)) * 100)}%
            </span>
          </button>

          {/* Card 2: Kann ich (Green/Emerald) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'known' ? 'all' : 'known')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
              statusFilter === 'known'
                ? 'bg-emerald-100/70 border-emerald-400 dark:bg-emerald-950/80 dark:border-emerald-600 ring-2 ring-emerald-400/40'
                : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  Kann ich (Gemeistert)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {dynamicCounts.known.toLocaleString('de-DE')}
                </span>
              </div>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {Math.round((dynamicCounts.known / (dynamicCounts.total || 1)) * 100)}%
            </span>
          </button>

          {/* Card 3: Offen (Neutral/Slate) */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'unlearned' ? 'all' : 'unlearned')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
              statusFilter === 'unlearned'
                ? 'bg-slate-200/80 border-slate-400 dark:bg-slate-800 dark:border-slate-600 ring-2 ring-slate-400/40'
                : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700">
                <Circle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                  Noch offen
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                  {dynamicCounts.unlearned.toLocaleString('de-DE')}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {Math.round((dynamicCounts.unlearned / (dynamicCounts.total || 1)) * 100)}%
            </span>
          </button>
        </div>

        {/* Master Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${(dynamicCounts.known / (dynamicCounts.total || 1)) * 100}%`,
              }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Kann ich: ${dynamicCounts.known}`}
            />
            <div
              style={{
                width: `${(dynamicCounts.learning / (dynamicCounts.total || 1)) * 100}%`,
              }}
              className="bg-amber-400 transition-all duration-500"
              title={`Lerne ich: ${dynamicCounts.learning}`}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SCHNELLAKTIONEN / BATCH PRESETS
          ========================================================================= */}
      <section className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Schnellauswahl:
        </span>

        <button
          type="button"
          onClick={handleAddAllN5ToLearning}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
        >
          Alle JLPT N5 zu &quot;Lerne ich&quot;
        </button>

        <button
          type="button"
          onClick={handleAddAllGrade1ToLearning}
          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
        >
          Alle Grundschul-Kanji Klasse 1
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (isSelectionMode) setSelectedIds(new Set());
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors shadow-2xs ml-auto flex items-center gap-1.5 ${
            isSelectionMode
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{isSelectionMode ? 'Auswahlmodus aktiv' : 'Mehrfachauswahl'}</span>
        </button>
      </section>

      {/* Multi-Selection Action Bar (visible when items are selected) */}
      {(isSelectionMode || selectedIds.size > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              {selectedIds.size} ausgewählt
            </span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Alle {sortedKanji.length} filtern & markieren
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-slate-500 hover:underline"
            >
              Auswahl aufheben
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">Markierte setzen auf:</span>
              <button
                type="button"
                onClick={() => handleApplyBatchStatus('learning')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:brightness-95"
              >
                🟡 Lerne ich
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchStatus('known')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:brightness-95"
              >
                🟢 Kann ich
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchStatus('unlearned')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
              >
                ⚪ Offen
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          3. SUCH- UND FILTER-TOOLBAR
          ========================================================================= */}
      <section className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Bar Row */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Echtzeit-Suche: Deutsche Bedeutung, Romaji, Hiragana, Katakana oder Kanji... (Drücke '/' zum Suchen)"
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row: Status, JLPT, Grade, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8 cursor-pointer"
              >
                <option value="all">Alle Status ({dynamicCounts.total})</option>
                <option value="learning">🟡 Lerne ich ({dynamicCounts.learning})</option>
                <option value="known">🟢 Kann ich ({dynamicCounts.known})</option>
                <option value="unlearned">⚪ Offen ({dynamicCounts.unlearned})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* JLPT Level Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              JLPT-Level
            </label>
            <div className="relative">
              <select
                value={jlptFilter}
                onChange={(e) => setJlptFilter(e.target.value as JLPTFilterOption)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8 cursor-pointer"
              >
                <option value="all">Alle JLPT (N5 - N1)</option>
                <option value="N5">JLPT N5 (Anfänger)</option>
                <option value="N4">JLPT N4 (Grundstufe)</option>
                <option value="N3">JLPT N3 (Mittelstufe)</option>
                <option value="N2">JLPT N2 (Fortgeschritten)</option>
                <option value="N1">JLPT N1 (Experte)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* School Grade Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Schulklasse
            </label>
            <div className="relative">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as GradeFilterOption)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8 cursor-pointer"
              >
                <option value="all">Alle Schulstufen</option>
                <option value="1">1. Klasse (80 Kanji)</option>
                <option value="2">2. Klasse (160 Kanji)</option>
                <option value="3">3. Klasse (200 Kanji)</option>
                <option value="4">4. Klasse (200 Kanji)</option>
                <option value="5">5. Klasse (185 Kanji)</option>
                <option value="6">6. Klasse (181 Kanji)</option>
                <option value="secondary">Sekundarstufe (1.110 Kanji)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sort Option */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sortierung
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8 cursor-pointer"
              >
                <option value="frequency-asc">Häufigkeit / Popularität</option>
                <option value="stroke-asc">Strichanzahl (wenige zuerst)</option>
                <option value="stroke-desc">Strichanzahl (viele zuerst)</option>
                <option value="grade-asc">Schulklasse (1 bis Sek.)</option>
                <option value="alpha-asc">Alphabetisch (A - Z)</option>
                <option value="jlpt-desc">JLPT-Level (N5 bis N1)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>
            Zeige <strong className="text-slate-800 dark:text-slate-200">{sortedKanji.length.toLocaleString('de-DE')}</strong> von {dynamicCounts.total.toLocaleString('de-DE')} Kanji
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filter zurücksetzen</span>
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
          4. KANJI-KACHEL GRID
          ========================================================================= */}
      {sortedKanji.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Filter className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Keine Kanji gefunden
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Für deine aktuelle Such- und Filterkombination wurden keine Treffer gefunden.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-3.5">
            {paginatedKanji.map((item) => (
              <KanjiCard
                key={item.id}
                kanji={item}
                status={getStatus(item.id)}
                isSelected={selectedIds.has(item.id)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={handleToggleSelect}
                onStatusChange={handleStatusChange}
                onClick={handleCardClick}
              />
            ))}
          </div>

          {/* Load More Button / Indicator */}
          {visibleCount < sortedKanji.length && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-6 py-2.5 text-xs font-semibold rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
              >
                Weitere {Math.min(ITEMS_PER_PAGE, sortedKanji.length - visibleCount)} von{' '}
                {sortedKanji.length - visibleCount} Kanji laden...
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. KANJI DETAIL-MODAL
          ========================================================================= */}
      <KanjiDetailModal
        kanji={activeKanji}
        status={activeKanji ? getStatus(activeKanji.id) : 'unlearned'}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
        onStartPractice={(kanji) => {
          if (onStartPractice) {
            onStartPractice([kanji.id]);
          } else {
            showToast(`Übung für "${kanji.kanji}" gestartet!`);
          }
        }}
      />
    </div>
  );
};
