import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, Hand } from 'lucide-react';

type HintId = 'menu' | 'kpi' | 'wallet';
type HintPosition = 'above' | 'below' | 'center';
type Coordinates = { top: number; left: number };

const KPI_HINT_DELAY_MS = 5000;
const MENU_FALLBACK_COORDS: Coordinates = { top: 16, left: 52 };

function getTargetElement(targetId?: string, fallbackSelector?: string) {
  return (targetId ? document.getElementById(targetId) : null) ??
    (fallbackSelector ? document.querySelector(fallbackSelector) : null);
}

function getFloatingCoords(rect: DOMRect, position: HintPosition): Coordinates {
  return {
    top:
      position === 'above'
        ? rect.top - 44
        : position === 'center'
          ? rect.top + rect.height / 2 - 22
          : rect.bottom + 8,
    left: rect.left + rect.width / 2,
  };
}

function useHintPosition({
  targetId,
  fallbackSelector,
  fallbackCoords,
  position,
  hideWhenOffscreen = false,
}: {
  targetId?: string;
  fallbackSelector?: string;
  fallbackCoords?: Coordinates;
  position?: HintPosition;
  hideWhenOffscreen?: boolean;
}) {
  const [coords, setCoords] = useState<Coordinates | null>(fallbackCoords ?? null);

  useEffect(() => {
    let attempts = 0;
    let rafId = 0;
    let retryTimer: number | null = null;

    const updatePosition = () => {
      const target = getTargetElement(targetId, fallbackSelector);

      if (!target) {
        if (fallbackCoords) {
          setCoords(fallbackCoords);
        }
        if (attempts++ < 30) {
          retryTimer = window.setTimeout(scheduleUpdate, 150);
        }
        return;
      }

      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        if (attempts++ < 30) {
          retryTimer = window.setTimeout(scheduleUpdate, 150);
        }
        return;
      }

      if (hideWhenOffscreen && (rect.top > window.innerHeight || rect.bottom < 0)) {
        setCoords(null);
        return;
      }

      attempts = 0;
      setCoords(
        position
          ? getFloatingCoords(rect, position)
          : {
              top: rect.top + rect.height / 2 - 16,
              left: rect.right + 12,
            }
      );
    };

    const scheduleUpdate = () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updatePosition);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });

    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, [targetId, fallbackSelector, fallbackCoords, position, hideWhenOffscreen]);

  return coords;
}

export function DemoOnboardingHints() {
  const [activeHints, setActiveHints] = useState<Set<HintId>>(() => new Set(['menu']));
  const [menuHintDismissed, setMenuHintDismissed] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // On mint success: remove menu + kpi hints, show wallet for 5s
  useEffect(() => {
    const handler = () => {
      setMenuHintDismissed(true);
      setActiveHints(new Set(['wallet']));

      const walletTimer = window.setTimeout(() => {
        setActiveHints((prev) => {
          const next = new Set(prev);
          next.delete('wallet');
          return next;
        });
      }, 5000);

      return () => window.clearTimeout(walletTimer);
    };

    window.addEventListener('demo-mint-success', handler);
    return () => window.removeEventListener('demo-mint-success', handler);
  }, []);

  // Auto-dismiss menu hint after 5s, then show KPI hint
  useEffect(() => {
    if (menuHintDismissed) return;

    const timer = window.setTimeout(() => {
      setMenuHintDismissed(true);
      setActiveHints((prev) => {
        const next = new Set(prev);
        next.delete('menu');
        next.add('kpi');
        return next;
      });
    }, KPI_HINT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [menuHintDismissed]);

  const dismissHint = useCallback((id: HintId) => {
    setActiveHints((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const dismissMenuHint = useCallback(() => {
    setMenuHintDismissed(true);
    dismissHint('menu');
  }, [dismissHint]);

  useEffect(() => {
    if (activeHints.size === 0) return;

    const cleanups: Array<() => void> = [];

    if (activeHints.has('menu')) {
      const el = document.getElementById('zen-sidebar-trigger');
      if (el) {
        const handler = () => dismissMenuHint();
        el.addEventListener('pointerdown', handler, { passive: true });
        cleanups.push(() => el.removeEventListener('pointerdown', handler));
      }
    }

    // KPI hint is NOT dismissed by tap — only by mint success

    if (activeHints.has('wallet')) {
      const el = document.getElementById('demo-wallet-card');
      if (el) {
        const handler = () => dismissHint('wallet');
        el.addEventListener('pointerdown', handler, { passive: true });
        cleanups.push(() => el.removeEventListener('pointerdown', handler));
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, [activeHints, dismissHint, dismissMenuHint]);

  if (!portalReady) return null;

  return createPortal(
    <AnimatePresence>
      {activeHints.has('menu') && <MenuHint key="menu" onDismiss={dismissMenuHint} />}

      {activeHints.has('kpi') && (
        <KpiStickyHint key="kpi" />
      )}

      {activeHints.has('wallet') && (
        <FloatingHint
          key="wallet"
          targetId="demo-wallet-card"
          fallbackSelector="#demo-wallet-card"
          label="Check your wallet"
          icon="down"
          position="above"
          onDismiss={() => dismissHint('wallet')}
          delay={0.25}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}

function MenuHint({ onDismiss }: { onDismiss: () => void }) {
  const pos = useHintPosition({
    targetId: 'zen-sidebar-trigger',
    fallbackCoords: MENU_FALLBACK_COORDS,
  });

  if (!pos) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.4 }}
      className="fixed z-[120] pointer-events-none"
      style={{ top: pos.top, left: pos.left }}
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

function FloatingHint({
  targetId,
  fallbackSelector,
  label,
  icon,
  position,
  onDismiss,
  delay = 0,
}: {
  targetId?: string;
  fallbackSelector: string;
  label: string;
  icon: 'hand' | 'down';
  position: HintPosition;
  onDismiss: () => void;
  delay?: number;
}) {
  const coords = useHintPosition({
    targetId,
    fallbackSelector,
    position,
    hideWhenOffscreen: true,
  });

  if (!coords) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'above' ? 8 : -8 }}
      transition={{ duration: 0.4, delay }}
      className="fixed z-[120] pointer-events-none -translate-x-1/2"
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

function KpiStickyHint() {
  const coords = useHintPosition({
    targetId: 'cec-header',
    fallbackSelector: '#cec-header',
    position: 'below',
    hideWhenOffscreen: false,
  });

  if (!coords) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: [
          '0 0 8px 2px hsl(var(--primary) / 0.15)',
          '0 0 18px 6px hsl(var(--primary) / 0.35)',
          '0 0 8px 2px hsl(var(--primary) / 0.15)',
        ],
      }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.4,
        delay: 0.15,
        boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="fixed z-[120] pointer-events-none -translate-x-1/2 rounded-full"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary/15 backdrop-blur-md border border-primary/30">
        <Hand className="h-4 w-4 text-primary animate-bounce flex-shrink-0" />
        <span className="text-xs font-semibold text-primary whitespace-nowrap">
          Tap-to-Mint™
        </span>
      </div>
    </motion.div>
  );
}
