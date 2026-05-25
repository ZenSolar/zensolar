import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DeasonChat } from "./DeasonChat";
import { cn } from "@/lib/utils";

/**
 * Floating Deason bubble — visible on every authenticated page.
 *   • Inner-circle users get the strategic co-pilot persona
 *   • Demo + beta users get the warm ZenSolar concierge persona
 * Persona is decided server-side by the deason-chat edge function.
 *
 * Hidden on /deason (full page), /auth, and on the /onboarding ai-concierge
 * step (would be redundant with the full-screen intake). Other onboarding
 * steps (energy-connect, home-charging-setup) DO show the bubble so users can
 * ask quick questions ("which SolarEdge model do I have?") without leaving
 * the flow — it minimizes back to a bubble and reopens on tap.
 *
 * External code can:
 *   • dispatch `deason:open` to open the bubble
 *   • dispatch `deason:nudge` (with a {assistant, meta} detail payload) to
 *     pulse the bubble + show a badge. Tapping the bubble opens it and
 *     replays the queued seed message.
 */
export function DeasonFloatingBubble() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingSeed, setPendingSeed] = useState<string | null>(null);
  const location = useLocation();

  // Listen for programmatic open requests from anywhere in the app.
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      setPendingSeed(null);
    };
    const nudgeHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ assistant?: string }>).detail;
      if (detail?.assistant) setPendingSeed(detail.assistant);
    };
    const clearHandler = () => setPendingSeed(null);
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
    if (open && pendingSeed) {
      const body = pendingSeed;
      setPendingSeed(null);
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("deason:seed", { detail: { assistant: body } }),
        );
      }, 60);
    }
  }, [open, pendingSeed]);

  // Allow on /demo even without auth (concierge persona handles unauthenticated demo visitors).
  const isDemoRoute = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
  if (isLoading) return null;
  if (!user && !isDemoRoute) return null;
  if (location.pathname.startsWith("/deason")) return null;
  if (location.pathname.startsWith("/auth")) return null;
  // Hide during the full-screen AI Concierge intake (signaled by Onboarding.tsx).
  if (typeof document !== 'undefined' && document.body.dataset.hideDeasonBubble === '1') return null;

  const isNudging = !!pendingSeed && !open;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={isNudging ? "Deason can help with that error" : "Open Deason"}
          style={{ bottom: 'calc(var(--bottom-nav-total-h) + 12px)' }}
          className={cn(
            "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg ring-2 ring-amber-300/40",
            "transition-transform hover:scale-105 active:scale-95",
            "md:!bottom-6",
            isNudging && "animate-pulse ring-4 ring-amber-300/70 shadow-amber-500/50",
          )}
        >
          <Sparkles className="h-6 w-6" />
          {isNudging && (
            <>
              {/* Ping ring for attention */}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
              {/* Red dot badge */}
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive ring-2 ring-background"
              />
            </>
          )}
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-border bg-background shadow-2xl",
            "h-[85svh] md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:rounded-2xl md:border",
          )}
        >
          <DeasonChat onClose={() => setOpen(false)} compact />
        </div>
      )}
    </>
  );
}
