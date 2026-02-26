import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Grid3X3 } from 'lucide-react';

interface PitchDeckShellProps {
  slides: ReactNode[];
  slideLabels: string[];
}

export function PitchDeckShell({ slides, slideLabels }: PitchDeckShellProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const total = slides.length;

  const goTo = useCallback((i: number) => {
    setCurrent(Math.max(0, Math.min(total - 1, i)));
    setShowGrid(false);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') { 
        if (showGrid) setShowGrid(false);
        else if (document.fullscreenElement) document.exitFullscreen();
      }
      if (e.key === 'f' || e.key === 'F5') { e.preventDefault(); toggleFullscreen(); }
      if (e.key === 'g') { e.preventDefault(); setShowGrid(g => !g); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, showGrid]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) { setShowControls(true); return; }
    const handleMove = () => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 2500);
    };
    window.addEventListener('mousemove', handleMove);
    handleMove();
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(hideTimer.current);
    };
  }, [isFullscreen]);

  // Scale calculation
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const observe = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setScale(Math.min(width / 1920, height / 1080));
    };
    observe();
    const ro = new ResizeObserver(observe);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (showGrid) {
    return (
      <div ref={containerRef} className="w-full h-screen bg-[hsl(220,20%,6%)] overflow-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white/70 text-lg font-medium">All Slides ({total})</h2>
          <button onClick={() => setShowGrid(false)} className="text-white/50 hover:text-white text-sm">
            ✕ Close Grid
          </button>
        </div>
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-[hsl(207,90%,54%)] shadow-lg shadow-[hsl(207,90%,54%)]/20' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="w-full aspect-video overflow-hidden">
                <div style={{ transform: `scale(${0.17})`, transformOrigin: 'top left', width: 1920, height: 1080 }}>
                  {slide}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-1.5 text-left">
                <span className="text-[11px] text-white/50 font-mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[11px] text-white/70 ml-2">{slideLabels[i]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[hsl(220,20%,6%)] relative overflow-hidden select-none"
      onClick={(e) => {
        // Click left/right halves to navigate
        const rect = (e.target as HTMLElement).closest('[data-slide-container]')?.getBoundingClientRect();
        if (!rect) return;
        if (e.clientX < rect.left + rect.width / 3) prev();
        else if (e.clientX > rect.left + (rect.width * 2) / 3) next();
      }}
    >
      {/* Scaled slide */}
      <div data-slide-container className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              width: 1920,
              height: 1080,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Bottom bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={current === 0}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 backdrop-blur-sm transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                {slides.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6 bg-[hsl(207,90%,54%)]' : 'bg-white/30 hover:bg-white/50'}`} />
                ))}
              </div>

              <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={current === total - 1}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 backdrop-blur-sm transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Top-right controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
              <span className="text-[13px] text-white/40 font-mono mr-2">
                {current + 1} / {total}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setShowGrid(true); }}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 backdrop-blur-sm">
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 backdrop-blur-sm">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
