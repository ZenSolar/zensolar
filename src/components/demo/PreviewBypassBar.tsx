import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Lock, Unlock } from "lucide-react";
import { isPreviewMode } from "@/lib/previewMode";

interface Props {
  granted: boolean;
  onBypass: () => void;
}

/**
 * Dev-only floating bar shown on preview/localhost ONLY.
 *
 * - Before unlock: shows a one-tap "Skip code (preview only)" button.
 * - After unlock: shows an "Unlocked for this preview" indicator and a deep link
 *   to /demo/dashboard so you don't have to retype the route.
 *
 * Hidden entirely on production hosts (zen.solar / beta.zen.solar / etc.) so the
 * real demo gate is never weakened.
 *
 * Honors `?previewbypass=1` in the URL to auto-call onBypass on mount.
 */
export function PreviewBypassBar({ granted, onBypass }: Props) {
  const [visible, setVisible] = useState(true);

  // Auto-bypass when the URL says so, in preview only.
  useEffect(() => {
    if (!isPreviewMode()) return;
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("previewbypass") === "1" && !granted) {
      onBypass();
    }
  }, [granted, onBypass]);

  if (!isPreviewMode()) return null;
  if (!visible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[120] pointer-events-auto"
      style={{ top: "calc(env(safe-area-inset-top) + 0.5rem)" }}
    >
      <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-background/85 backdrop-blur-md pl-3 pr-1 py-1 shadow-lg">
        <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold whitespace-nowrap">
          Preview
        </span>

        {granted ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Unlock className="h-3 w-3 text-primary" /> Unlocked for this preview
            </span>
            <Link
              to="/demo/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
            >
              Demo Dashboard <ArrowRight className="h-3 w-3" />
            </Link>
          </>
        ) : (
          <button
            onClick={onBypass}
            className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
          >
            <Lock className="h-3 w-3" /> Skip code (preview only)
          </button>
        )}

        <button
          onClick={() => setVisible(false)}
          className="ml-0.5 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
          aria-label="Hide preview bar"
          title="Hide for now"
        >
          ×
        </button>
      </div>
    </div>
  );
}
