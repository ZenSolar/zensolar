import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/hooks/useGoogleAnalytics";
import { useDeasonThreads } from "@/hooks/useDeasonThreads";
import { DeasonChat } from "./DeasonChat";
import { cn } from "@/lib/utils";


/**
 * Floating Deason bubble — visible on every authenticated page.
 *   • Inner-circle users get the strategic co-pilot persona
 *   • Demo + beta users get the warm ZenSolar concierge persona
 * Persona is decided server-side by the deason-chat edge function.
 *
 * Hidden on /deason (full page), /auth, and on the /onboarding ai-concierge
 * step. The bubble also fires a one-time "welcome pulse" on the dashboard
 * (and /demo) for first-time visitors — pulses + shows a small tooltip so
 * users discover Deason without us hijacking the screen.
 *
 * Window events handled:
 *   • `deason:open` — open the chat panel
 *   • `deason:nudge` (CustomEvent<{assistant, meta}>) — pulse + badge,
 *     seed the playbook when user taps the bubble
 */

const WELCOME_FLAG = "deason_welcomed_v1";
const WELCOME_DELAY_MS = 2000;
const WELCOME_AUTO_HIDE_MS = 12_000;

export function DeasonFloatingBubble() {
  const { user, isLoading } = useAuth();
  const { threads, loading: threadsLoading, createThread, touchThread } = useDeasonThreads();
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [preparingThread, setPreparingThread] = useState(false);
  const [threadPrepFailed, setThreadPrepFailed] = useState(false);
  const [pendingSeed, setPendingSeed] = useState<string | null>(null);
  const [pendingMeta, setPendingMeta] = useState<Record<string, unknown> | null>(null);
  const [welcoming, setWelcoming] = useState(false);
  const welcomeTimer = useRef<number | null>(null);
  const creatingThreadRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();


  // Listen for programmatic open / nudge requests from anywhere in the app.
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      setPendingSeed(null);
      setPendingMeta(null);
    };
    const nudgeHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ assistant?: string; meta?: Record<string, unknown> }>).detail;
      if (detail?.assistant) setPendingSeed(detail.assistant);
      if (detail?.meta) setPendingMeta(detail.meta);
    };
    const clearHandler = () => {
      setPendingSeed(null);
      setPendingMeta(null);
    };
    window.addEventListener("deason:open", openHandler);
    window.addEventListener("deason:nudge", nudgeHandler as EventListener);
    window.addEventListener("deason:nudge:clear", clearHandler);
    return () => {
      window.removeEventListener("deason:open", openHandler);
      window.removeEventListener("deason:nudge", nudgeHandler as EventListener);
      window.removeEventListener("deason:nudge:clear", clearHandler);
    };
  }, []);

  // When the user opens the bubble after a nudge, replay the seed so
  // DeasonChat picks it up via the `deason:seed` listener.
  useEffect(() => {
    if (open && pendingSeed && (!user || threadId)) {
      const body = pendingSeed;
      setPendingSeed(null);
      setPendingMeta(null);
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("deason:seed", { detail: { assistant: body } }),
        );
      }, 60);
    }
  }, [open, pendingSeed, threadId, user]);

  // Always open to a fresh "New conversation" — the user can switch to a
  // saved one via the History panel. We never auto-resume the last thread.
  const ensureSavedThread = async () => {
    if (!user) return null;
    if (threadId) return threadId;
    if (creatingThreadRef.current) return null;
    creatingThreadRef.current = true;
    setPreparingThread(true);
    const created = await createThread();
    setPreparingThread(false);
    creatingThreadRef.current = false;
    if (!created) {
      setThreadPrepFailed(true);
      return null;
    }
    setThreadId(created.id);
    setThreadPrepFailed(false);
    return created.id;
  };

  useEffect(() => {
    if (!open || !user || threadId || preparingThread || threadPrepFailed) return;
    void ensureSavedThread();
  }, [open, user, threadId, preparingThread, threadPrepFailed]);


  const handleNewSavedThread = async () => {
    if (!user || creatingThreadRef.current) return;
    creatingThreadRef.current = true;
    setPreparingThread(true);
    const created = await createThread();
    setPreparingThread(false);
    creatingThreadRef.current = false;
    if (created) {
      setThreadId(created.id);
      setThreadPrepFailed(false);
    } else {
      setThreadPrepFailed(true);
    }
  };

  // First-visit welcome pulse on the dashboard or /demo. Triggers once per
  // device (localStorage flag). Does NOT auto-open the chat — just pulses
  // the bubble and shows a tiny tooltip so users discover Deason.
  const isDemoRoute = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
  const isDashboard = location.pathname === '/' || location.pathname === '/index';
  const shouldConsiderWelcome = isDashboard || isDemoRoute;

  useEffect(() => {
    if (!shouldConsiderWelcome) return;
    if (open) return;
    if (typeof window === 'undefined') return;
    let seen = false;
    try {
      seen = localStorage.getItem(WELCOME_FLAG) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;

    const showTimer = window.setTimeout(() => {
      setWelcoming(true);
      trackEvent('deason_welcome_shown', {
        surface: isDemoRoute ? 'demo' : 'dashboard',
      });
      try {
        localStorage.setItem(WELCOME_FLAG, '1');
      } catch {
        /* ignore */
      }
      welcomeTimer.current = window.setTimeout(() => {
        setWelcoming(false);
      }, WELCOME_AUTO_HIDE_MS);
    }, WELCOME_DELAY_MS);

    return () => {
      window.clearTimeout(showTimer);
      if (welcomeTimer.current) window.clearTimeout(welcomeTimer.current);
    };
  }, [shouldConsiderWelcome, isDemoRoute, open]);

  // Allow on /demo even without auth (concierge persona handles unauthenticated demo visitors).
  if (isLoading) return null;
  if (!user && !isDemoRoute) return null;
  if (location.pathname.startsWith("/deason")) return null;
  if (location.pathname.startsWith("/auth")) return null;
  if (location.pathname.startsWith("/deck")) return null;
  // Hide during the full-screen AI Concierge intake (signaled by Onboarding.tsx).
  if (typeof document !== 'undefined' && document.body.dataset.hideDeasonBubble === '1') return null;

  const isNudging = !!pendingSeed && !open;
  const isPulsing = isNudging || (welcoming && !open);

  const handleBubbleTap = () => {
    if (isNudging) {
      trackEvent('deason_nudge_tapped', {
        provider: (pendingMeta?.provider as string) ?? 'unknown',
        stage: (pendingMeta?.stage as string) ?? 'unknown',
        code: (pendingMeta?.code as string) ?? 'unknown',
      });
    } else if (welcoming) {
      trackEvent('deason_welcome_tapped', {
        surface: isDemoRoute ? 'demo' : 'dashboard',
      });
      // Seed a friendly intro so the chat opens with context.
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('deason:seed', {
            detail: {
              assistant:
                `👋 Hey — I'm **Deason**, your guide here.\n\n` +
                `A couple of things I can help with:\n` +
                `• **Connect your solar, battery, or charger** in plain English — I'll walk you through it.\n` +
                `• **Answer anything** about the app, how minting works, or what you're seeing on a screen.\n\n` +
                `What's on your mind?`,
            },
          }),
        );
      }, 60);
    }
    setWelcoming(false);
    if (welcomeTimer.current) window.clearTimeout(welcomeTimer.current);
    setOpen(true);
    void ensureSavedThread();
  };

  const dismissWelcome = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('deason_welcome_dismissed', {
      surface: isDemoRoute ? 'demo' : 'dashboard',
    });
    setWelcoming(false);
    if (welcomeTimer.current) window.clearTimeout(welcomeTimer.current);
  };

  return (
    <>
      {!open && (
        <>
          <button
            onClick={handleBubbleTap}
            aria-label={
              isNudging
                ? "Deason can help with that error"
                : welcoming
                  ? "Meet Deason — tap for help"
                  : "Open Deason"
            }
            style={{ bottom: 'calc(var(--bottom-nav-total-h) + 12px)' }}
            className={cn(
              "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full",
              "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg ring-2 ring-amber-300/40",
              "transition-transform hover:scale-105 active:scale-95",
              "md:!bottom-6",
              isPulsing && "animate-pulse ring-4 ring-amber-300/70 shadow-amber-500/50",
            )}
          >
            <Sparkles className="h-6 w-6" />
            {isPulsing && (
              <>
                <span className="pointer-events-none absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                {isNudging && (
                  <span
                    aria-hidden
                    className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive ring-2 ring-background"
                  />
                )}
              </>
            )}
          </button>

          {welcoming && !isNudging && (
            <div
              role="dialog"
              aria-label="Meet Deason"
              onClick={handleBubbleTap}
              style={{ bottom: 'calc(var(--bottom-nav-total-h) + 80px)' }}
              className={cn(
                "fixed right-4 z-50 max-w-[260px] cursor-pointer rounded-2xl border border-amber-300/40",
                "bg-background/95 backdrop-blur p-3 pr-8 shadow-xl",
                "md:!bottom-24",
                "animate-in fade-in slide-in-from-bottom-2 duration-300",
              )}
            >
              <button
                onClick={dismissWelcome}
                aria-label="Dismiss"
                className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="text-sm font-medium text-foreground">
                👋 I'm Deason
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tap anytime — I'll help you connect accounts or answer anything about the app.
              </p>
            </div>
          )}
        </>
      )}

      {open && (
        <SwipeDownCard onDismiss={() => { setOpen(false); setThreadId(null); }}>
          {user && !threadId && !threadPrepFailed ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Preparing saved chat…</span>
            </div>
          ) : (
            <DeasonChat
              onClose={() => { setOpen(false); setThreadId(null); }}
              compact
              threadId={threadId}
              onNewThread={user ? () => void handleNewSavedThread() : undefined}
              onUserMessage={threadId ? () => touchThread(threadId) : undefined}
              threads={user ? threads : undefined}
              onSwitchThread={user ? (id) => {
                setThreadId(id);
                setThreadPrepFailed(false);
              } : undefined}
              onViewAllChats={user ? () => {
                setOpen(false);
                navigate(threadId ? `/deason/${threadId}` : "/deason");
              } : undefined}
            />
          )}
        </SwipeDownCard>
      )}
    </>
  );
}


/**
 * Swipe-down dismissible card wrapper for the Deason panel.
 * - Mobile: drag the top handle (or the entire header area) downward >100px to dismiss.
 * - Desktop: renders as a fixed bottom-right card; swipe gesture is also available.
 * Outline uses amber to match the floating bubble / dashboard CTA.
 */
function SwipeDownCard({
  children,
  onDismiss,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onPointerUp = () => {
    if (dragY > 110) {
      onDismiss();
    }
    setDragY(0);
    setDragging(false);
    startY.current = null;
  };

  return (
    <div
      style={{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: dragging ? "none" : "transform 200ms ease-out",
      }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background shadow-2xl",
        "h-[85svh] rounded-t-2xl border-2 border-amber-500/70 ring-1 ring-amber-400/30",
        "md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:rounded-2xl",
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex w-full cursor-grab touch-none items-center justify-center py-2 active:cursor-grabbing"
        aria-label="Swipe down to dismiss"
      >
        <span className="h-1.5 w-12 rounded-full bg-amber-500/70" />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
