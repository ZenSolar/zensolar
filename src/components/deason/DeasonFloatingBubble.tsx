import { useState } from "react";
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
 * Hidden on /deason (full page), /auth, and on unauthenticated marketing routes.
 */
export function DeasonFloatingBubble() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (isLoading || !user) return null;
  if (location.pathname.startsWith("/deason")) return null;
  if (location.pathname.startsWith("/auth")) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Deason"
          className={cn(
            "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg ring-2 ring-amber-300/40",
            "transition-transform hover:scale-105 active:scale-95",
            "md:bottom-6",
          )}
        >
          <Sparkles className="h-6 w-6" />
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
