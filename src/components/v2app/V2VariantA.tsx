import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * V2 FRE — Act 1: "The Promise"
 * Variant A — Same brand, quieter.
 * Keeps emerald primary + dark theme, but strips ornament,
 * adds whitespace, and sharpens typography.
 */
export function V2VariantA() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col items-center justify-between px-6 pt-24 pb-10 overflow-hidden relative">
      {/* Soft ambient glow — single, calm */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.15), transparent 60%)",
        }}
      />

      {/* Mark */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        ZenSolar
      </motion.div>

      {/* Hero */}
      <div className="relative z-10 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-10 flex justify-center"
        >
          {/* Single, beautiful symbol — orbiting glow */}
          <div className="relative h-32 w-32">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 65%)",
                filter: "blur(8px)",
              }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-primary/30"
            />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.6)]" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-5"
        >
          Your home,<br />rewarded.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Every sunbeam your roof catches. Every mile your car drives. Every cycle your battery holds. Quietly turned into something you own.
        </motion.p>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative z-10 w-full max-w-sm space-y-3"
      >
        <button className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 px-6 font-medium text-base shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-shadow">
          Show me how
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-center text-[11px] text-muted-foreground tracking-wide">
          No accounts to connect yet. Just a feel.
        </p>
      </motion.div>
    </div>
  );
}
