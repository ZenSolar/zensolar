import { ArrowLeft } from "lucide-react";
import { ZenSolarDashboard } from "@/components/ZenSolarDashboard";

/**
 * V2 Dashboard — Variant A (Quiet Emerald)
 * Renders the real /demo dashboard so all KPI tap-to-mint flows work,
 * wrapped in a soft emerald ambient glow that conveys variant A.
 */
export function V2DashboardA({ onExit }: { onExit: () => void }) {
  return (
    <div className="v2-skin-a relative min-h-[100svh] bg-background">
      {/* Soft emerald ambient glow — Variant A signature */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.18), transparent 70%)",
        }}
      />

      {/* Variant A chrome */}
      <div className="fixed top-16 left-3 z-40">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors shadow-sm"
        >
          <ArrowLeft className="h-3 w-3" /> Onboarding
        </button>
      </div>

      <div className="relative z-10 pt-12">
        <ZenSolarDashboard isDemo />
      </div>
    </div>
  );
}
