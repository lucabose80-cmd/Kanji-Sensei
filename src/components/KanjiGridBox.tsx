import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export interface KanjiGridBoxProps {
  kanji: string;
  strokePaths?: string[];
  strokeCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showStepByStep?: boolean;
  interactive?: boolean;
  gridType?: 'tianzige' | 'mizige'; // tianzige: 2x2 (+ cross), mizige: 8-section (* star/cross)
  gridColor?: 'red' | 'gray' | 'blue';
  className?: string;
  autoPlayIntervalMs?: number;
}

export const KanjiGridBox: React.FC<KanjiGridBoxProps> = ({
  kanji,
  strokePaths,
  strokeCount,
  size = 'lg',
  showStepByStep = false,
  interactive = true,
  gridType = 'tianzige',
  gridColor = 'red',
  className = '',
  autoPlayIntervalMs = 850,
}) => {
  // Determine pixel size
  const pxSize = typeof size === 'number'
    ? size
    : size === 'sm'
    ? 96
    : size === 'md'
    ? 160
    : size === 'lg'
    ? 240
    : 320; // xl

  const totalStrokes = strokePaths?.length || strokeCount || 1;
  const [currentStep, setCurrentStep] = useState<number>(totalStrokes);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  const [prevKanji, setPrevKanji] = useState<string>(kanji);
  if (kanji !== prevKanji) {
    setPrevKanji(kanji);
    setCurrentStep(totalStrokes);
    setIsPlaying(false);
  }

  // Autoplay stroke step by step
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalStrokes) {
          return 1;
        }
        return prev + 1;
      });
    }, autoPlayIntervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, totalStrokes, autoPlayIntervalMs]);

  // Grid styling colors
  const borderStyles =
    gridColor === 'red'
      ? 'border-red-300 dark:border-red-800/60'
      : gridColor === 'blue'
      ? 'border-sky-300 dark:border-sky-800/60'
      : 'border-slate-300 dark:border-slate-700';

  const lineStyles =
    gridColor === 'red'
      ? 'stroke-red-300 dark:stroke-red-800/60'
      : gridColor === 'blue'
      ? 'stroke-sky-300 dark:stroke-sky-800/60'
      : 'stroke-slate-300 dark:stroke-slate-700';

  // Helper to extract start point of an SVG path for stroke numbering
  const getPathStart = (pathStr: string) => {
    const match = pathStr.match(/^M\s*([0-9.]+)[,\s]+([0-9.]+)/i);
    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }
    return null;
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Tianzige Grid Box Container */}
      <div
        className={`relative overflow-hidden rounded-xl border-2 ${borderStyles} bg-amber-50/40 dark:bg-slate-900/80 shadow-sm transition-all`}
        style={{
          width: `${pxSize}px`,
          height: `${pxSize}px`,
        }}
      >
        {/* Japanese Practice Grid SVG (Tianzige / Mizige) */}
        <svg
          viewBox="0 0 109 109"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diagonal guidelines for Mizige */}
          {gridType === 'mizige' && (
            <>
              <line
                x1="0"
                y1="0"
                x2="109"
                y2="109"
                strokeDasharray="2,3"
                strokeWidth="0.75"
                className={`${lineStyles} opacity-50`}
              />
              <line
                x1="109"
                y1="0"
                x2="0"
                y2="109"
                strokeDasharray="2,3"
                strokeWidth="0.75"
                className={`${lineStyles} opacity-50`}
              />
            </>
          )}

          {/* Central Cross Lines (Tianzige 2x2) */}
          <line
            x1="54.5"
            y1="0"
            x2="54.5"
            y2="109"
            strokeDasharray="3,3"
            strokeWidth="0.9"
            className={lineStyles}
          />
          <line
            x1="0"
            y1="54.5"
            x2="109"
            y2="54.5"
            strokeDasharray="3,3"
            strokeWidth="0.9"
            className={lineStyles}
          />

          {/* Center reference circle */}
          <circle
            cx="54.5"
            cy="54.5"
            r="1.75"
            fill="currentColor"
            className={`${lineStyles} opacity-40`}
          />
        </svg>

        {/* Kanji Content */}
        {strokePaths && strokePaths.length > 0 ? (
          /* High-fidelity Stroke Order SVG (KanjiVG) */
          <svg
            viewBox="0 0 109 109"
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {strokePaths.map((pathD, idx) => {
              const strokeNum = idx + 1;
              const isPastStroke = strokeNum < currentStep;
              const isCurrentStroke = strokeNum === currentStep;
              const isFutureStroke = strokeNum > currentStep;

              // If stepping through, future strokes can be faint ghost strokes
              let strokeColor = 'var(--color-slate-900, #0f172a)';
              let strokeOpacity = 1;
              let strokeWidth = 3.8;

              if (isCurrentStroke && currentStep < totalStrokes) {
                strokeColor = '#e11d48'; // vibrant rose/red for active stroke
                strokeWidth = 4.4;
              } else if (isPastStroke) {
                strokeColor = '#1e293b'; // dark ink
                strokeOpacity = 0.9;
              } else if (isFutureStroke) {
                strokeColor = '#94a3b8'; // subtle ghost stroke
                strokeOpacity = 0.22;
                strokeWidth = 2.8;
              }

              const startPt = getPathStart(pathD);

              return (
                <g key={`stroke-${idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={strokeOpacity}
                    className="transition-all duration-200"
                  />

                  {/* Optional stroke number badge at stroke start */}
                  {showNumbers && startPt && (
                    <g
                      transform={`translate(${startPt.x - 3.5}, ${startPt.y - 3.5})`}
                      className="pointer-events-none"
                    >
                      <circle
                        cx="3.5"
                        cy="3.5"
                        r="3.5"
                        className={`${
                          isCurrentStroke
                            ? 'fill-rose-500'
                            : 'fill-slate-800 dark:fill-slate-200'
                        }`}
                      />
                      <text
                        x="3.5"
                        y="4.8"
                        textAnchor="middle"
                        fontSize="3.2"
                        fontWeight="bold"
                        className="fill-white dark:fill-slate-900"
                      >
                        {strokeNum}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          /* Typography-based fallback */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-serif leading-none font-medium text-slate-800 dark:text-slate-100 transition-colors"
              style={{
                fontSize: `${pxSize * 0.72}px`,
                fontFamily:
                  '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "MS Mincho", serif',
              }}
            >
              {kanji}
            </span>
          </div>
        )}

        {/* Small Tianzige indicator badge in corner */}
        <div className="absolute bottom-1 right-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none opacity-60">
          田
        </div>
      </div>

      {/* Interactive Strichfolge Controls (Step-by-step viewer) */}
      {(showStepByStep || interactive) && strokePaths && strokePaths.length > 0 && (
        <div className="mt-2.5 flex flex-col items-center gap-1.5 w-full">
          {/* Step Progress & Controls */}
          <div className="flex items-center justify-between w-full px-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1 font-medium">
              <span>Strich</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {currentStep} / {totalStrokes}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowNumbers(!showNumbers)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                showNumbers
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
              title="Strich-Nummern ein-/ausblenden"
            >
              123 Nummern
            </button>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {/* Step back */}
            <button
              type="button"
              disabled={currentStep <= 1}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.max(1, s - 1));
              }}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors"
              title="Vorheriger Strich"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 px-2 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 text-xs font-medium"
              title={isPlaying ? 'Pausieren' : 'Automatisch abspielen'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Step forward */}
            <button
              type="button"
              disabled={currentStep >= totalStrokes}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.min(totalStrokes, s + 1));
              }}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors"
              title="Nächster Strich"
            >
              <ChevronRight size={16} />
            </button>

            {/* Show all / Reset */}
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(totalStrokes);
              }}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Alle Striche anzeigen"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanjiGridBox;
