import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Undo2, Trash2, PenTool } from 'lucide-react';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface PracticeCanvasProps {
  width?: number;
  height?: number;
  onStrokeCountChange?: (count: number) => void;
  onExportDrawing?: (dataUrl: string) => void;
  className?: string;
  gridType?: 'tianzige' | 'mizige';
  strokeColor?: string;
  lineWidth?: number;
  placeholderText?: string;
}

export const PracticeCanvas: React.FC<PracticeCanvasProps> = ({
  width = 280,
  height = 280,
  onStrokeCountChange,
  onExportDrawing,
  className = '',
  gridType = 'tianzige',
  strokeColor,
  lineWidth = 6,
  placeholderText = 'Hier mit Finger oder Stift zeichnen...',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [activePenSize, setActivePenSize] = useState<number>(lineWidth);

  // Auto-detect ink color depending on dark mode if not provided
  const inkColor = strokeColor || '#0f172a'; // Deep sumi ink

  // Redraw all strokes on canvas
  const renderStrokes = useCallback(
    (strokesToRender: Stroke[], current?: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const all = current ? [...strokesToRender, current] : strokesToRender;

      all.forEach((stroke) => {
        if (stroke.points.length === 0) return;

        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.points.length === 1) {
          // Single point / dot
          const pt = stroke.points[0];
          ctx.beginPath();
          ctx.arc(pt.x * dpr, pt.y * dpr, (stroke.width * dpr) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Smooth curve through points
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);

          for (let i = 1; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x * dpr, p1.y * dpr, midX * dpr, midY * dpr);
          }

          const lastPt = stroke.points[stroke.points.length - 1];
          ctx.lineTo(lastPt.x * dpr, lastPt.y * dpr);
          ctx.stroke();
        }

        ctx.restore();
      });
    },
    []
  );

  // Setup canvas size with DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    renderStrokes(strokes, currentStroke);
  }, [width, height, renderStrokes, strokes, currentStroke]);

  // Export drawing whenever strokes change
  useEffect(() => {
    if (onStrokeCountChange) {
      onStrokeCountChange(strokes.length);
    }
    if (onExportDrawing && canvasRef.current) {
      onExportDrawing(canvasRef.current.toDataURL('image/png'));
    }
  }, [strokes, onStrokeCountChange, onExportDrawing]);

  // Pointer event helpers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only left click / touch / stylus
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pt = getCanvasCoords(e);
    const newStroke: Stroke = {
      points: [pt],
      color: inkColor,
      width: activePenSize,
    };

    setIsDrawing(true);
    setCurrentStroke(newStroke);
    renderStrokes(strokes, newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();

    const pt = getCanvasCoords(e);
    const updated = {
      ...currentStroke,
      points: [...currentStroke.points, pt],
    };

    setCurrentStroke(updated);
    renderStrokes(strokes, updated);
  };

  const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    if (currentStroke && currentStroke.points.length > 0) {
      const nextStrokes = [...strokes, currentStroke];
      setStrokes(nextStrokes);
      renderStrokes(nextStrokes, null);
    }

    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    renderStrokes(nextStrokes, null);
  };

  const handleClear = () => {
    setStrokes([]);
    renderStrokes([], null);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Canvas container with Tianzige Grid backdrop */}
      <div
        className="relative overflow-hidden rounded-xl border-2 border-red-300 dark:border-red-900/60 bg-amber-50/20 dark:bg-slate-900/90 shadow-inner"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Japanese Practice Grid (Tianzige / Mizige lines) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {gridType === 'mizige' && (
            <>
              <line
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                strokeDasharray="2,3"
                strokeWidth="0.6"
                className="stroke-red-300 dark:stroke-red-800/40 opacity-50"
              />
              <line
                x1="100"
                y1="0"
                x2="0"
                y2="100"
                strokeDasharray="2,3"
                strokeWidth="0.6"
                className="stroke-red-300 dark:stroke-red-800/40 opacity-50"
              />
            </>
          )}

          {/* Cross lines (2x2) */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            strokeDasharray="3,3"
            strokeWidth="0.8"
            className="stroke-red-300 dark:stroke-red-800/60"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            strokeDasharray="3,3"
            strokeWidth="0.8"
            className="stroke-red-300 dark:stroke-red-800/60"
          />

          {/* Center reference dot */}
          <circle
            cx="50"
            cy="50"
            r="1.5"
            className="fill-red-400 dark:fill-red-800/70 opacity-40"
          />
        </svg>

        {/* Empty state hint */}
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
            <PenTool className="w-6 h-6 text-slate-400/60 dark:text-slate-600/60 mb-1" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {placeholderText}
            </span>
          </div>
        )}

        {/* The interactive Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {/* Live stroke count badge in corner */}
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/60 text-white text-[10px] font-medium backdrop-blur-xs pointer-events-none">
          Striche: {strokes.length}
        </div>
      </div>

      {/* Canvas Toolbar Controls */}
      <div className="mt-2 flex items-center justify-between w-full max-w-[280px] px-1">
        {/* Stroke Width options */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActivePenSize(4)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              activePenSize === 4
                ? 'bg-white dark:bg-slate-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dünner Strich"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
          </button>
          <button
            type="button"
            onClick={() => setActivePenSize(6)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              activePenSize === 6
                ? 'bg-white dark:bg-slate-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Mittlerer Strich"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-current" />
          </button>
          <button
            type="button"
            onClick={() => setActivePenSize(9)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              activePenSize === 9
                ? 'bg-white dark:bg-slate-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dicker Pinselstrich"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-current" />
          </button>
        </div>

        {/* Action buttons: Undo & Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleUndo}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
            title="Letzten Strich rückgängig machen"
          >
            <Undo2 size={13} />
            <span>Rückgängig</span>
          </button>

          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleClear}
            className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
            title="Zeichenfläche leeren"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeCanvas;
