import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Hand } from 'lucide-react';

const HINTS_KEY = 'zen_demo_hints_shown';
const ACCESS_KEY = 'zen_demo_access';

type HintId = 'menu' | 'kpi' | 'mint';

/**
 * Bouncing arrow hints for first-time demo visitors.
 * Resets when the 24-hour access gate resets.
 */
export function DemoOnboardingHints() {
  const [activeHints, setActiveHints] = useState<Set<HintId>>(new Set());

  // Check if hints should show (tied to access gate timestamp)
  useEffect(() => {
    try {
      const accessData = JSON.parse(localStorage.getItem(ACCESS_KEY) || '{}');
      const accessTs = accessData.ts || 0;

      const hintsData = JSON.parse(localStorage.getItem(HINTS_KEY) || '{}');
      const hintsTs = hintsData.ts || 0;

      // Show hints if access was granted more recently than hints were shown
      if (accessTs > hintsTs) {
        const timer = setTimeout(() => {
          setActiveHints(new Set(['menu', 'kpi', 'mint']));
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const dismissHint = useCallback((id: HintId) => {
    setActiveHints(prev => {
      const next = new Set(prev);
      next.delete(id);
      if (next.size === 0) {
        try {
          localStorage.setItem(HINTS_KEY, JSON.stringify({ ts: Date.now() }));
        } catch { /* noop */ }
      }
      return next;
    });
  }, []);

  // Listen for target element clicks to auto-dismiss
  useEffect(() => {
    if (activeHints.size === 0) return;

    const cleanups: Array<() => void> = [];

    if (activeHints.has('menu')) {
      const el = document.getElementById('zen-sidebar-trigger');
      if (el) {
        const handler = () => dismissHint('menu');
        el.addEventListener('pointerdown', handler, { passive: true });
        cleanups.push(() => el.removeEventListener('pointerdown', handler));
      }
    }

    if (activeHints.has('kpi')) {
      const el = document.querySelector('[data-hint-target="kpi-cards"]');
      if (el) {
        const handler = () => dismissHint('kpi');
        el.addEventListener('pointerdown', handler, { passive: true });
        cleanups.push(() => el.removeEventListener('pointerdown', handler));
      }
    }

    if (activeHints.has('mint')) {
      const el = document.getElementById('demo-mint-button') ||
                 document.querySelector('[data-hint-target="mint"]');
      if (el) {
        const handler = () => dismissHint('mint');
        el.addEventListener('pointerdown', handler, { passive: true });
        cleanups.push(() => el.removeEventListener('pointerdown', handler));
      }
    }

    return () => cleanups.forEach(fn => fn());
  }, [activeHints, dismissHint]);

  if (activeHints.size === 0) return null;

  return (
    <>
      <AnimatePresence>
        {activeHints.has('menu') && (
          <MenuHint onDismiss={() => dismissHint('menu')} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeHints.has('kpi') && (
          <FloatingHint
            targetId=""
            fallbackSelector="[data-hint-target='kpi-cards']"
            label="Tap to mint tokens"
            icon="hand"
            position="center"
            onDismiss={() => dismissHint('kpi')}
            delay={0.3}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeHints.has('mint') && (
          <FloatingHint
            targetId="demo-mint-button"
            fallbackSelector="[data-hint-target='mint']"
            label="Mint your NFTs"
            icon="down"
            position="above"
            onDismiss={() => dismissHint('mint')}
            delay={0.6}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Menu Hint ───────────────────────────────────────────────
function MenuHint({ onDismiss }: { onDismiss: () => void }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const findTrigger = () => {
      const trigger = document.getElementById('zen-sidebar-trigger');
      if (!trigger) return false;
      const rect = trigger.getBoundingClientRect();
      setPos({
        top: rect.top + rect.height / 2 - 16,
        left: rect.right + 12,
      });
      return true;
    };

    // Retry a few times in case element isn't ready
    let attempts = 0;
    const tryFind = () => {
      if (findTrigger()) return;
      if (attempts++ < 10) {
        requestAnimationFrame(tryFind);
      }
    };
    
    const raf = requestAnimationFrame(tryFind);
    window.addEventListener('resize', () => findTrigger());
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', () => findTrigger());
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3 }}
      className="fixed z-[55] pointer-events-none"
      style={pos ? { top: pos.top, left: pos.left } : { top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)', left: '3.25rem' }}
    >
      <div className="flex items-center gap-1.5 pointer-events-auto" onClick={onDismiss}>
        <ChevronLeft className="h-5 w-5 text-primary animate-[bounceX_1s_ease-in-out_infinite]" />
        <span className="text-xs font-medium text-primary bg-primary/10 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-primary/20 shadow-lg shadow-primary/10 whitespace-nowrap">
          Tap for menu
        </span>
      </div>
    </motion.div>
  );
}

// ─── Floating Hint (KPI / Mint) ──────────────────────────────
function FloatingHint({
  targetId,
  fallbackSelector,
  label,
  icon,
  position,
  onDismiss,
  delay = 0,
}: {
  targetId: string;
  fallbackSelector: string;
  label: string;
  icon: 'hand' | 'down';
  position: 'above' | 'below';
  onDismiss: () => void;
  delay?: number;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    let attempts = 0;
    let scrollHandler: (() => void) | null = null;
    let resizeHandler: (() => void) | null = null;

    const updatePosition = () => {
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      // Only show if element is in viewport
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        setCoords(null);
        return;
      }
      setCoords({
        top: position === 'above' ? rect.top - 44 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    const findAndBind = () => {
      const target = document.getElementById(targetId) ||
                     document.querySelector(fallbackSelector);
      if (!target) {
        if (attempts++ < 20) {
          setTimeout(findAndBind, 200);
        }
        return;
      }

      targetRef.current = target;
      updatePosition();

      scrollHandler = updatePosition;
      resizeHandler = updatePosition;
      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('resize', resizeHandler);
    };

    // Start looking after a short delay to let animations settle
    const timer = setTimeout(findAndBind, 800);

    return () => {
      clearTimeout(timer);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    };
  }, [targetId, fallbackSelector, position]);

  if (!coords) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      transition={{ duration: 0.3, delay }}
      className="fixed z-[55] pointer-events-none -translate-x-1/2"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="flex flex-col items-center gap-1 pointer-events-auto" onClick={onDismiss}>
        <span className="text-xs font-medium text-primary bg-primary/10 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-primary/20 shadow-lg shadow-primary/10 whitespace-nowrap">
          {label}
        </span>
        {icon === 'hand' ? (
          <Hand className="h-5 w-5 text-primary animate-bounce" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary animate-bounce" />
        )}
      </div>
    </motion.div>
  );
}
