import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Hand } from 'lucide-react';

type HintId = 'menu' | 'kpi' | 'wallet';

/**
 * Bouncing arrow hints for first-time demo visitors.
 * - menu: points to hamburger menu button
 * - kpi: hovers over KPI device cards in Clean Energy Center
 * - wallet: appears over wallet card AFTER a successful test mint
 * Resets when the 24-hour access gate resets.
 */
export function DemoOnboardingHints() {
  const [activeHints, setActiveHints] = useState<Set<HintId>>(new Set());

  // Always show menu + kpi hints on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveHints(new Set(['menu', 'kpi']));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for mint success to show wallet hint
  useEffect(() => {
    const handler = () => {
      setActiveHints(prev => {
        const next = new Set(prev);
        next.add('wallet');
        return next;
      });
    };

    window.addEventListener('demo-mint-success', handler);
    return () => window.removeEventListener('demo-mint-success', handler);
  }, []);

  const dismissHint = useCallback((id: HintId) => {
    setActiveHints(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Auto-dismiss on target element clicks
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

    if (activeHints.has('wallet')) {
      const el = document.getElementById('demo-wallet-card');
      if (el) {
        const handler = () => dismissHint('wallet');
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
        {activeHints.has('wallet') && (
          <FloatingHint
            targetId="demo-wallet-card"
            fallbackSelector="#demo-wallet-card"
            label="Check your wallet"
            icon="down"
            position="above"
            onDismiss={() => dismissHint('wallet')}
            delay={0.2}
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
    let attempts = 0;
    let resizeCleanup: (() => void) | null = null;

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

    const tryFind = () => {
      if (findTrigger()) {
        const handler = () => findTrigger();
        window.addEventListener('resize', handler);
        resizeCleanup = () => window.removeEventListener('resize', handler);
        return;
      }
      if (attempts++ < 20) {
        setTimeout(tryFind, 200);
      }
    };

    const timer = setTimeout(tryFind, 800);

    return () => {
      clearTimeout(timer);
      resizeCleanup?.();
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

// ─── Floating Hint (KPI / Wallet) ────────────────────────────
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
  position: 'above' | 'below' | 'center';
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
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        setCoords(null);
        return;
      }
      setCoords({
        top: position === 'above' ? rect.top - 44 : position === 'center' ? rect.top + rect.height / 2 - 22 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    const findAndBind = () => {
      const target = (targetId ? document.getElementById(targetId) : null) ||
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
