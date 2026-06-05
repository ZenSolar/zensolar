import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Grid3X3, ArrowLeft } from 'lucide-react';

interface PitchDeckShellProps {
  slides: ReactNode[];
  slideLabels: string[];
}

export function PitchDeckShell({ slides, slideLabels }: PitchDeckShellProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  // Multi-touch tracking: the sitewide viewport meta normally disables pinch-zoom
  // so we relax it on /deck (see effect below). Once pinch-zoom is allowed, we
  // must also stop our own swipe/tap-zone handlers from misreading the second
  // finger as a swipe and the lift-off as a tap that changes slides.
  const wasMultiTouch = useRef(false);
  const multiTouchClearTimer = useRef<ReturnType<typeof setTimeout>>();

  const total = slides.length;

  // Pinch-zoom enablement: index.html ships
  //   user-scalable=no, maximum-scale=1.0
  // for the PWA shell. That's right for the app, wrong for a deck where
  // investors want to inspect numbers. Swap the viewport meta to a
  // zoom-friendly value while this component is mounted, and restore the
  // original on unmount, popstate (back button), or hard refresh teardown.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    const original = meta.getAttribute('content');
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover',
    );
    const restore = () => {
      if (original != null) meta.setAttribute('content', original);
    };
    window.addEventListener('popstate', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      restore();
    };
  }, []);

  // Coarse-pointer detection for the persistent fullscreen-exit chip.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsCoarsePointer(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

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

  // Fullscreen — uses native Fullscreen API where available, falls back to
  // a CSS "fauxscreen" on iOS Safari (which doesn't expose requestFullscreen
  // on non-video elements).
  const [fauxFullscreen, setFauxFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const supportsNative = typeof el.requestFullscreen === 'function';
    if (!supportsNative) {
      setFauxFullscreen((v) => !v);
      return;
    }
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => setFauxFullscreen(true));
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement || fauxFullscreen);
    document.addEventListener('fullscreenchange', handler);
    handler();
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [fauxFullscreen]);

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

  // Scale to fit. No auto-rotation — users rotate their phone naturally and
  // the slide re-fits to whatever orientation they're in.
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    const observe = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      // 0.98 safety margin so slide never bleeds to viewport edge
      setScale(Math.min(width / 1920, height / 1080) * 0.98);
    };
    // iOS Safari finishes its rotation/chrome animation ~300-500ms after
    // the orientationchange event fires. Re-measure repeatedly so the
    // slide always settles into the final visible viewport.
    const observeBurst = () => {
      observe();
      [60, 180, 360, 600, 900].forEach((ms) => setTimeout(observe, ms));
    };
    observeBurst();
    const ro = new ResizeObserver(observe);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('orientationchange', observeBurst);
    window.addEventListener('resize', observe);
    window.visualViewport?.addEventListener('resize', observe);
    window.visualViewport?.addEventListener('scroll', observe);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', observeBurst);
      window.removeEventListener('resize', observe);
      window.visualViewport?.removeEventListener('resize', observe);
      window.visualViewport?.removeEventListener('scroll', observe);
    };
  }, []);

  // Touch swipe nav
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

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

  // When fauxscreen turns on (iOS Safari), lock body scroll and nudge the
  // URL bar away by scrolling. iOS still keeps a thin bar visible in a
  // standard tab — to fully hide it the user must "Add to Home Screen".
  useEffect(() => {
    if (!fauxFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevHeight = document.body.style.height;
    const prevHtmlHeight = document.documentElement.style.height;
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    const nudge = () => {
      window.scrollTo(0, 1);
      // Re-assert after iOS finishes its rotation animation
      setTimeout(() => window.scrollTo(0, 1), 350);
    };
    nudge();
    window.addEventListener('orientationchange', nudge);
    window.addEventListener('resize', nudge);
    return () => {
      window.removeEventListener('orientationchange', nudge);
      window.removeEventListener('resize', nudge);
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = '';
      document.body.style.height = prevHeight;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, [fauxFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`bg-[hsl(220,20%,6%)] relative overflow-hidden select-none ${
        fauxFullscreen
          ? 'fixed inset-0 z-[9999] w-screen'
          : 'w-screen'
      }`}
      style={{
        // 100dvh tracks iOS Safari's visible area as the URL bar collapses,
        // and stays correct across orientation changes.
        height: '100dvh',
        width: '100vw',
        touchAction: 'pan-y',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (e.clientX < rect.left + rect.width / 3) prev();
        else if (e.clientX > rect.left + (rect.width * 2) / 3) next();
      }}
    >
      {/* Scaled slide — single transform from center, flex-centered in viewport. */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{
              width: 1920,
              height: 1080,
              flexShrink: 0,
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
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 pointer-events-auto max-w-[95vw]">
              <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={current === 0}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 backdrop-blur-sm transition-all shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Progress: dots on desktop, page counter on mobile */}
              <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                {slides.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6 bg-[hsl(207,90%,54%)]' : 'bg-white/30 hover:bg-white/50'}`} />
                ))}
              </div>
              <div className="sm:hidden px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-[13px] font-mono text-white/70">
                {current + 1} / {total}
              </div>

              <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={current === total - 1}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 backdrop-blur-sm transition-all shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Top-left back to investor */}
            <div className="absolute top-4 left-4 pointer-events-auto">
              <Link
                to="/investor"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[12px] backdrop-blur-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Investor
              </Link>
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
