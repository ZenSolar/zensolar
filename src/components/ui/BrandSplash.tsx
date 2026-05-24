import { cn } from "@/lib/utils";

interface BrandSplashProps {
  /** Optional caption shown beneath the loader (e.g. "Connecting your account..."). */
  label?: string;
  /** Render without the full-viewport min-height (use inside an already-sized container). */
  inline?: boolean;
  className?: string;
}

/**
 * Unified full-screen loading splash used across the app.
 *
 * Matches the inline pre-React splash in `index.html` (same logo, same emerald
 * progress accent, same dark canvas) so the transition from cold-boot splash →
 * React-rendered loader → first paint feels like one continuous moment.
 *
 * Dark-only by design (Tesla-style) — the dashboard removed light mode entirely.
 */
export function BrandSplash({ label, inline = false, className }: BrandSplashProps) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading ZenSolar"}
      className={cn(
        "w-full flex flex-col items-center justify-center gap-6 bg-background",
        // Account for iOS safe areas so the logo lands optically centered on PWA cold-boot.
        "px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        !inline && "min-h-screen min-h-[100dvh]",
        className,
      )}
    >
      <img
        src="/logos/zen-logo-horizontal-new.png"
        alt="ZenSolar"
        width={160}
        height={40}
        className="h-auto w-40 select-none"
        draggable={false}
      />

      {/* Slim emerald progress bar — mirrors the inline splash for visual continuity. */}
      <div
        className="h-[3px] w-32 overflow-hidden rounded-full bg-foreground/10"
        aria-hidden="true"
      >
        <div className="h-full w-1/3 rounded-full bg-primary animate-[brand-splash-slide_1.4s_ease-in-out_infinite]" />
      </div>

      {label && (
        <p className="text-xs font-medium tracking-wide text-muted-foreground animate-pulse">
          {label}
        </p>
      )}

      <style>{`
        @keyframes brand-splash-slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
