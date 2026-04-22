import { motion } from "framer-motion";
import { ArrowLeft, Sun, BatteryCharging, Car, Sparkles } from "lucide-react";

/**
 * V2 Dashboard — Variant A (emerald, quieter)
 * First real screen after onboarding.
 */
export function V2DashboardA({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-[100svh] bg-background text-foreground px-5 pt-20 pb-10 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 55%)",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to onboarding
        </button>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Today
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.05] mb-3">
            You earned <span className="text-primary">0.42 ZSOL</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Quiet day. Your roof did most of the work.
          </p>
        </motion.div>

        <div className="space-y-3 mb-10">
          <Tile icon={Sun} label="Solar generated" value="18.4 kWh" delta="+12% vs yesterday" delay={0.1} />
          <Tile icon={BatteryCharging} label="Battery stored" value="12.1 kWh" delta="87% full" delay={0.18} />
          <Tile icon={Car} label="Vehicle range earned" value="142 mi" delta="from solar only" delay={0.26} />
        </div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 px-6 font-medium text-base shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
        >
          <Sparkles className="h-4 w-4" />
          Mint today's earnings
        </motion.button>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Preview only · no on-chain action
        </p>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  delta,
  delay,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  delta: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm px-4 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/70">{delta}</p>
        </div>
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </motion.div>
  );
}
