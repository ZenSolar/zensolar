import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Vault,
  ChevronRight,
  Check,
  X,
  Clock,
  Sparkles,
  ListTree,
  Banknote,
  Presentation,
  ShieldCheck,
  Atom,
  Coins,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import {
  getLastFounderRoute,
  rememberFounderRoute,
  isFounderRoute,
} from "@/lib/founderLastVisit";


export type FounderDestination = {
  to: string;
  label: string;
  blurb: string;
  Icon: LucideIcon;
};

// Only LIVE destinations — archived brainstorm pages removed June 2026.
export const FOUNDER_DESTINATIONS: FounderDestination[] = [
  {
    to: "/founders",
    label: "Founders Hub",
    blurb: "Vault overview and pinned cards.",
    Icon: Vault,
  },
  {
    to: "/admin/ssot",
    label: "SSOT",
    blurb: "Single source of truth — canonical decisions.",
    Icon: ListTree,
  },
  {
    to: "/admin/todo",
    label: "Todo Board",
    blurb: "Live work queue.",
    Icon: ListTree,
  },
  {
    to: "/investor/pitch",
    label: "Investor Pitch",
    blurb: "Canonical deck — Three Revenue Engines.",
    Icon: Presentation,
  },
  {
    to: "/investor/one-pager",
    label: "Investor One-Pager",
    blurb: "NDA-shareable single-page brief.",
    Icon: Banknote,
  },
  {
    to: "/admin/fundraising",
    label: "Fundraising",
    blurb: "Live round tracker.",
    Icon: Banknote,
  },
  {
    to: "/admin/final-tokenomics",
    label: "Final Tokenomics",
    blurb: "Mint Split v3.1 — locked model.",
    Icon: Coins,
  },
  {
    to: "/founders/competitive-landscape",
    label: "Competitive Landscape",
    blurb: "Per-competitor wedge and moat.",
    Icon: ShieldCheck,
  },
  {
    to: "/proof-of-genesis",
    label: "Proof of Genesis™",
    blurb: "The cryptographic primitive.",
    Icon: Atom,
  },
  {
    to: "/transparency",
    label: "Transparency",
    blurb: "Live network stats and LP reserves.",
    Icon: Activity,
  },
  {
    to: "/deason",
    label: "Deason (AI)",
    blurb: "Founders-only AI agent.",
    Icon: Sparkles,
  },
];


interface Props {
  userId: string;
  /** When true, render as a celebratory full-screen unlock screen.
   *  When false, render as a dismissible bottom sheet overlay. */
  variant?: "unlock" | "overlay";
  onClose: () => void;
  /** Title override. */
  title?: string;
  /** Subtitle override. */
  subtitle?: string;
  /** Hint text shown at the bottom. */
  footnote?: string;
}

export function FounderDestinationChooser({
  userId,
  variant = "overlay",
  onClose,
  title,
  subtitle,
  footnote,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();
  const lastRoute = getLastFounderRoute(userId);

  // Esc key to close (overlay variant only)
  useEffect(() => {
    if (variant !== "overlay") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, onClose]);

  const choose = (target?: string) => {
    void lightTap();
    if (target && target !== location.pathname) {
      rememberFounderRoute(userId, target);
      navigate(target);
    } else if (isFounderRoute(location.pathname)) {
      rememberFounderRoute(userId, location.pathname);
    }
    onClose();
  };

  const isUnlock = variant === "unlock";

  const body = (
    <div className={`flex flex-col ${isUnlock ? "flex-1 justify-center" : ""} max-w-md mx-auto w-full min-h-0`}>
      {isUnlock ? (
        <div className="text-center mb-6 animate-fade-in shrink-0">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
            <Check className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            {title ?? "Vault unlocked"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle ?? "Jump straight to a chapter, or continue here."}
          </p>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 mb-4 animate-fade-in shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary">
              Founders Navigation
            </p>
            <h2 className="text-lg font-semibold tracking-tight mt-1">
              {title ?? "Where to next?"}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              void lightTap();
              onClose();
            }}
            className="h-9 w-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0 -mx-1 px-1 pb-2">
        {FOUNDER_DESTINATIONS.map(({ to, label, blurb, Icon }, i) => {
          const isCurrent = to === location.pathname;
          const isLast = !isCurrent && to === lastRoute;
          return (
            <button
              key={to}
              type="button"
              onClick={() => choose(to)}
              className="group w-full text-left rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 active:scale-[0.99] transition-all p-4 flex items-center gap-3 animate-fade-in"
              style={{
                animationDelay: `${i * 30}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  {label}
                  {isCurrent && (
                    <span className="text-[9px] uppercase tracking-widest text-primary/80 border border-primary/30 rounded-full px-1.5 py-0.5">
                      You're here
                    </span>
                  )}
                  {isLast && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground border border-border/60 rounded-full px-1.5 py-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      Last viewed
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground leading-snug truncate">
                  {blurb}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="mt-5 text-muted-foreground hover:text-foreground"
        onClick={() => choose()}
      >
        {isUnlock ? "Continue on this page" : "Stay here"}
      </Button>

      <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center pt-4">
        {footnote ??
          (isUnlock
            ? "Tip: Tap the compass anytime to reopen this menu."
            : "Press Esc or tap outside to close · ⌘K to reopen")}
      </p>
    </div>
  );

  if (isUnlock) {
    return (
      <div
        className="min-h-[100svh] flex flex-col bg-background relative overflow-hidden"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
          paddingLeft: "calc(env(safe-area-inset-left) + 1rem)",
          paddingRight: "calc(env(safe-area-inset-right) + 1rem)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-primary/5 blur-3xl" />
        </div>
        {body}
      </div>
    );
  }

  // Overlay (sheet) variant
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => {
          void lightTap();
          onClose();
        }}
        className="absolute inset-0 bg-background/70 backdrop-blur-md animate-fade-in"
      />
      {/* Sheet */}
      <div
        className="relative mt-auto w-full bg-background border-t border-border/60 rounded-t-3xl shadow-[0_-12px_40px_-12px_hsl(var(--primary)/0.25)] animate-fade-in flex flex-col min-h-0"
        style={{
          maxHeight: "85svh",
          paddingTop: "0.75rem",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
          paddingLeft: "calc(env(safe-area-inset-left) + 1rem)",
          paddingRight: "calc(env(safe-area-inset-right) + 1rem)",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border/80 shrink-0" />
        {body}
      </div>
    </div>
  );
}
