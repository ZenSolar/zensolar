import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * V2 FRE — Act 1: "The Promise"
 * Variant B — Tesla-grade restraint.
 * Near-monochrome. Hairline dividers. Monospace numerals.
 * Single accent used sparingly. Dramatic whitespace.
 */
export function V2VariantB() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col px-6 pt-24 pb-10 relative">
      {/* Top hairline status row — Tesla-style telemetry */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-mono"
      >
        <span>ZENSOLAR</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-primary" />
          LIVE
        </span>
      </motion.div>

      <div className="h-px w-full bg-foreground/10 mt-3" />

      {/* Massive whitespace — content sits low and confident */}
      <div className="flex-1 flex flex-col justify-end max-w-lg">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-6 font-mono"
        >
          01 — The Promise
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-5xl sm:text-6xl font-light tracking-tight leading-[0.95] mb-8"
        >
          Your home<br />
          <span className="text-foreground/40">already does</span><br />
          the work.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-base text-foreground/60 leading-relaxed max-w-sm mb-12"
        >
          We're just the part that notices.
        </motion.p>

        {/* Subtle data row — earns trust without explanation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          <DataPill label="Sun" value="4.2" unit="kW" />
          <DataPill label="Battery" value="87" unit="%" />
          <DataPill label="Drive" value="142" unit="mi" />
        </motion.div>
      </div>

      <div className="h-px w-full bg-foreground/10 mb-6" />

      {/* CTA — minimal, no shadow, no glow */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="flex items-center justify-between"
      >
        <button className="group inline-flex items-center gap-2 text-base font-medium tracking-tight">
          Begin
          <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-mono">
          90 sec
        </span>
      </motion.div>
    </div>
  );
}

function DataPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-mono mb-1.5">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-light tabular-nums tracking-tight">
          {value}
        </span>
        <span className="text-[10px] text-foreground/50 font-mono uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
}
