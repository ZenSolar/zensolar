import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

/**
 * V2 Dashboard — Variant B (Tesla-grade restraint)
 */
export function V2DashboardB({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-[100svh] bg-background text-foreground px-6 pt-20 pb-10">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-foreground/50 hover:text-primary transition-colors font-mono mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Onboarding
        </button>

        <div className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-mono mb-3">
          <span>HOME · LIVE</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary" />
            04.22 · 11:14
          </span>
        </div>
        <div className="h-px w-full bg-foreground/10 mb-10" />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 font-mono mb-5">
            Today
          </p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-6xl font-light tracking-tight tabular-nums">0.42</span>
            <span className="text-sm uppercase tracking-[0.25em] text-foreground/50 font-mono">ZSOL</span>
          </div>
          <p className="text-sm text-foreground/50">Earned, unminted.</p>
        </motion.div>

        <div className="space-y-px border-t border-b border-foreground/10 mb-12">
          {[
            { k: "Generated", v: "18.4", u: "kWh" },
            { k: "Stored", v: "12.1", u: "kWh" },
            { k: "Range earned", v: "142", u: "mi" },
            { k: "Grid avoided", v: "9.8", u: "kg CO₂" },
          ].map((row, i) => (
            <motion.div
              key={row.k}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
              className="flex items-baseline justify-between py-4 border-t border-foreground/5 first:border-t-0"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 font-mono">
                {row.k}
              </span>
              <span className="font-mono">
                <span className="text-2xl font-light tabular-nums">{row.v}</span>
                <span className="text-[10px] text-foreground/40 ml-1 uppercase">{row.u}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center justify-between"
        >
          <button className="group inline-flex items-center gap-2 text-base font-medium tracking-tight">
            Mint today
            <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-mono">
            preview
          </span>
        </motion.div>
      </div>
    </div>
  );
}
