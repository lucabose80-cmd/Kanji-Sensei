import React from 'react';
import type { KanjiItem } from '../types/kanji';
import type { KanjiStatus } from '../types/storage';
import { Check, CheckCircle2, Circle, Clock, Flame } from 'lucide-react';

export interface KanjiCardProps {
  kanji: KanjiItem;
  status: KanjiStatus;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (kanji: KanjiItem) => void;
  onStatusChange: (id: string, status: KanjiStatus) => void;
  onClick: (kanji: KanjiItem) => void;
}

export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  status,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onStatusChange,
  onClick,
}) => {
  // Cycle status: unlearned -> learning -> known -> unlearned
  const handleQuickStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus: KanjiStatus = 'learning';
    if (status === 'learning') {
      nextStatus = 'known';
    } else if (status === 'known') {
      nextStatus = 'unlearned';
    } else {
      nextStatus = 'learning';
    }
    onStatusChange(kanji.id, nextStatus);
  };

  const handleSelectToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(kanji);
    }
  };

  // Status visual attributes
  const statusConfig = {
    unlearned: {
      label: 'Offen',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      borderClass: 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
      icon: Circle,
      iconColor: 'text-slate-400 dark:text-slate-500',
      actionTitle: 'Klicken zum Lernen (im Tagespool)',
      actionNext: '🟡 Zu "Lerne ich"',
    },
    learning: {
      label: 'Lerne ich',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
      borderClass: 'border-amber-300 dark:border-amber-600/70 shadow-sm shadow-amber-500/5 hover:border-amber-400',
      icon: Clock,
      iconColor: 'text-amber-500 fill-amber-500/20',
      actionTitle: 'Klicken zum Meistern',
      actionNext: '🟢 Zu "Kann ich"',
    },
    known: {
      label: 'Kann ich',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
      borderClass: 'border-emerald-300 dark:border-emerald-600/70 shadow-sm shadow-emerald-500/5 hover:border-emerald-400',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 fill-emerald-500/20',
      actionTitle: 'Klicken zum Zurücksetzen',
      actionNext: '⚪ Zu "Offen"',
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  // JLPT level color accents
  const jlptColors: Record<string, string> = {
    N5: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    N4: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    N3: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
    N2: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    N1: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  };

  const jlptStyle = jlptColors[kanji.jlpt] || jlptColors.N5;

  // Grade formatting
  const gradeLabel =
    kanji.grade && kanji.grade <= 6
      ? `G${kanji.grade}`
      : kanji.grade === 8
      ? 'Sek.'
      : kanji.grade
      ? `G${kanji.grade}`
      : 'Joyo';

  // Primary reading
  const primaryReading =
    kanji.kunyomi && kanji.kunyomi.length > 0
      ? kanji.kunyomi[0].kana
      : kanji.onyomi && kanji.onyomi.length > 0
      ? kanji.onyomi[0].kana
      : '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(kanji)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(kanji);
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 select-none text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
        statusConfig.borderClass
      } ${
        isSelected
          ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
          : ''
      }`}
    >
      {/* Top Meta Header: JLPT, Grade & Multi-select Checkbox */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${jlptStyle}`}
            title={`JLPT ${kanji.jlpt}`}
          >
            {kanji.jlpt}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
            title={kanji.grade ? `Schulstufe: Klasse ${kanji.grade}` : 'Sekundarstufe'}
          >
            {gradeLabel}
          </span>
          {kanji.frequency && kanji.frequency <= 1000 && (
            <span
              className="text-[9px] font-semibold px-1 py-0.5 rounded text-amber-600 dark:text-amber-400 flex items-center gap-0.5"
              title={`Häufigkeit: Rang #${kanji.frequency}`}
            >
              <Flame className="w-2.5 h-2.5 fill-amber-500" />
              #{kanji.frequency}
            </span>
          )}
        </div>

        {/* Selection Checkbox */}
        {(isSelectionMode || isSelected) && (
          <button
            type="button"
            aria-label={isSelected ? 'Abwählen' : 'Auswählen'}
            onClick={handleSelectToggle}
            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        )}
      </div>

      {/* Main Center Area: Large Kanji & Stroke Count */}
      <div className="flex flex-col items-center my-1.5">
        <div className="relative">
          <span
            lang="ja"
            className="text-4xl sm:text-5xl font-serif text-slate-800 dark:text-slate-100 group-hover:scale-105 transition-transform duration-200 inline-block font-normal"
            style={{ fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif" }}
          >
            {kanji.kanji}
          </span>
          <span
            className="absolute -bottom-1 -right-2 text-[9px] font-mono px-1 py-0.2 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            title={`${kanji.strokeCount} Striche`}
          >
            {kanji.strokeCount}
          </span>
        </div>

        {/* Primary Meaning in German */}
        <p
          className="mt-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 text-center line-clamp-1 w-full px-1"
          title={kanji.primaryMeaning}
        >
          {kanji.primaryMeaning}
        </p>

        {/* Key Reading (Hiragana / Katakana) */}
        {primaryReading && (
          <p
            lang="ja"
            className="text-[11px] text-slate-500 dark:text-slate-400 text-center line-clamp-1 mt-0.5 font-medium"
          >
            {primaryReading}
          </p>
        )}
      </div>

      {/* Card Footer: 1-Click Status Switcher */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={handleQuickStatusCycle}
          title={`${statusConfig.actionTitle} (Klick schaltet um: ${statusConfig.actionNext})`}
          className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-medium transition-colors hover:brightness-95 active:scale-[0.98] ${statusConfig.badgeClass}`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusConfig.iconColor}`} />
            <span className="truncate">{statusConfig.label}</span>
          </div>
          <span className="text-[10px] opacity-70 ml-1 font-mono group-hover:inline hidden">
            ↻
          </span>
        </button>
      </div>
    </div>
  );
};
