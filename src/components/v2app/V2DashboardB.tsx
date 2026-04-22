import { ArrowLeft } from "lucide-react";
import { ZenSolarDashboard } from "@/components/ZenSolarDashboard";

/**
 * V2 Dashboard — Variant B (Tesla-grade restraint)
 * Renders the real /demo dashboard so every KPI tap-to-mint action works,
 * wrapped in a near-monochrome chrome that signals variant B.
 */
export function V2DashboardB({ onExit }: { onExit: () => void }) {
  return (
    <div className="v2-skin-b relative min-h-[100svh] bg-background v2-variant-b">
      {/* Variant B chrome — hairline, mono, single accent */}
      <div className="fixed top-16 left-3 right-3 z-40 flex items-center justify-between">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-none border-b border-foreground/20 bg-transparent px-1 pb-1 text-[10px] uppercase tracking-[0.25em] text-foreground/60 hover:text-primary font-mono transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Onboarding
        </button>
        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-mono">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Live
        </span>
      </div>

      <div className="relative z-10 pt-14">
        <ZenSolarDashboard isDemo />
      </div>
    </div>
  );
}
