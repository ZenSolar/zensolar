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
  const accessTsRef = useRef<number>(0);

  // Check if hints should show (tied to access gate timestamp)
  useEffect(() => {
    try {
      const accessData = JSON.parse(localStorage.getItem(ACCESS_KEY) || '{}');
      const accessTs = accessData.ts || 0;
      accessTsRef.current = accessTs;

      const hintsData = JSON.parse(localStorage.getItem(HINTS_KEY) || '{}');
      const hintsTs = hintsData.ts || 0;

      // Show hints if access was granted more recently than hints were shown
      // (i.e. new session or after 24hr reset)
      if (accessTs > hintsTs) {
        // Stagger the appearance
        const timer = setTimeout(() => {
          setActiveHints(new Set(['menu', 'kpi', 'mint']));
        }, 1200);
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
      // If all dismissed, mark hints as shown
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

    const handlers: Array<[string, () => void]> = [];

    // Menu button
    if (activeHints.has('menu')) {
      const menuTrigger = document.getElementById('zen-sidebar-trigger');
      if (menuTrigger) {
        const handler = () => dismissHint('menu');
        menuTrigger.addEventListener('pointerdown', handler, { passive: true });
        handlers.push(['zen-sidebar-trigger', handler]);
      }
    }

    // KPI cards - dismiss on any click within the activity metrics
    if (activeHints.has('kpi')) {
      const kpiSection = document.getElementById('demo-activity-metrics') || 
                         document.querySelector('[data-hint-target="kpi"]');
      if (kpiSection) {
        const handler = () => dismissHint('kpi');
        kpiSection.addEventListener('pointerdown', handler, { passive: true });
        handlers.push(['kpi-section', handler]);
      }
    }

    // Mint button
    if (activeHints.has('mint')) {
      const mintBtn = document.getElementById('demo-mint-button') ||
                      document.querySelector('[data-hint-target="mint"]');
      if (mintBtn) {
        const handler = () => dismissHint('mint');
        mintBtn.addEventListener('pointerdown', handler, { passive: true });
        handlers.push(['mint-btn', handler]);
      }
    }

    return () => {
      handlers.forEach(([id, handler]) => {
        if (id === 'zen-sidebar-trigger') {
          document.getElementById(id)?.removeEventListener('pointerdown', handler);
        } else if (id === 'kpi-section') {
          const el = document.getElementById('demo-activity-metrics') || 
                     document.querySelector('[data-hint-target="kpi"]');
          el?.removeEventListener('pointerdown', handler);
        } else if (id === 'mint-btn') {
          const el = document.getElementById('demo-mint-button') ||
                     document.querySelector('[data-hint-target="mint"]');
          el?.removeEventListener('pointerdown', handler);
        }
      });
    };
  }, [activeHints, dismissHint]);

  if (activeHints.size === 0) return null;

  return (
    <>
      {/* Menu hint — fixed, points left toward menu icon */}
      <AnimatePresence>
        {activeHints.has('menu') && (
          <MenuHint onDismiss={() => dismissHint('menu')} />
        )}
      </AnimatePresence>

      {/* KPI hint — positioned relative to the KPI section */}
      <AnimatePresence>
        {activeHints.has('kpi') && (
          <FloatingHint
            targetSelector="#demo-activity-metrics, [data-hint-target='kpi']"
            label="Tap to mint tokens"
            icon="hand"
            position="above"
            onDismiss={() => dismissHint('kpi')}
            delay={0.3}
          />
        )}
      </AnimatePresence>

      {/* Mint button hint */}
      <AnimatePresence>
        {activeHints.has('mint') && (
          <FloatingHint
            targetSelector="#demo-mint-button, [data-hint-target='mint']"
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
    const update = () => {
      const trigger = document.getElementById('zen-sidebar-trigger');
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setPos({
        top: rect.top + rect.height / 2 - 16,
        left: rect.right + 12,
      });
    };

    // Wait for layout
    const raf = requestAnimationFrame(() => requestAnimationFrame(update));
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
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
      <div className="flex items-center gap-1.5 pointer-events-auto">
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
  targetSelector,
  label,
  icon,
  position,
  onDismiss,
  delay = 0,
}: {
  targetSelector: string;
  label: string;
  icon: 'hand' | 'down';
  position: 'above' | 'below';
  onDismiss: () => void;
  delay?: number;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const findAndPosition = () => {
      const target = document.querySelector(targetSelector);
      if (!target) return;

      // Observe visibility
      observerRef.current = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { threshold: 0.3 }
      );
      observerRef.current.observe(target);

      const update = () => {
        const rect = target.getBoundingClientRect();
        setCoords({
          top: position === 'above' ? rect.top - 44 : rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        observerRef.current?.disconnect();
      };
    };

    // Delay to let content render
    const timer = setTimeout(findAndPosition, 500);
    return () => clearTimeout(timer);
  }, [targetSelector, position]);

  if (!coords || !inView) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      transition={{ duration: 0.3, delay }}
      className="fixed z-[55] pointer-events-none -translate-x-1/2"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="flex flex-col items-center gap-1 pointer-events-auto">
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
