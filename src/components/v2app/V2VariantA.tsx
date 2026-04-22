import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

/**
 * V2 FRE — Variant A — Same brand, quieter.
 * 3-act flow: Promise → Proof → Permission.
 */
export function V2VariantA() {
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col items-center justify-between px-6 pt-24 pb-10 overflow-hidden relative">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.15), transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        <span>ZenSolar</span>
        <span className="text-foreground/30">·</span>
        <span className="text-primary/70">{act} / 3</span>
      </motion.div>

      <AnimatePresence mode="wait">
        {act === 1 && <ActA1 key="a1" onNext={() => setAct(2)} />}
        {act === 2 && <ActA2 key="a2" onNext={() => setAct(3)} />}
        {act === 3 && <ActA3 key="a3" onNext={() => setAct(4)} />}
        {act === 4 && <ActADone key="a4" onRestart={() => setAct(1)} />}
      </AnimatePresence>
    </div>
  );
}

function ActA1({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="relative z-10 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-10 flex justify-center"
        >
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-5"
        >
          Your home,<br />rewarded.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Every sunbeam your roof catches. Every mile your car drives. Every cycle your battery holds. Quietly turned into something you own.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative z-10 w-full max-w-sm space-y-3"
      >
        <button
          onClick={onNext}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 px-6 font-medium text-base shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-shadow"
        >
          Show me how
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-center text-[11px] text-muted-foreground tracking-wide">
          No accounts to connect yet. Just a feel.
        </p>
      </motion.div>
    </>
  );
}

function ActA2({ onNext }: { onNext: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-md mt-6"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-6">02 · The Proof</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mb-8">
          We watch the meter.<br />You watch it grow.
        </h1>

        <div className="space-y-3 max-w-xs mx-auto text-left">
          {[
            { k: "Solar", v: "4.2 kW", sub: "right now" },
            { k: "Battery", v: "87%", sub: "stored" },
            { k: "Drive", v: "142 mi", sub: "of range earned" },
          ].map((row, i) => (
            <motion.div
              key={row.k}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/30 px-4 py-3"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{row.k}</p>
                <p className="text-xs text-muted-foreground/70">{row.sub}</p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-primary">{row.v}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        onClick={onNext}
        className="group relative z-10 w-full max-w-sm inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 px-6 font-medium text-base shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
      >
        Continue
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    </>
  );
}

function ActA3({ onNext }: { onNext: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-md mt-6"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 mb-6">03 · The Permission</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mb-5">
          One tap.<br />Then you're earning.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Connect your solar, EV, or battery. We'll handle the rest in the background.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 w-full max-w-sm space-y-3"
      >
        <button
          onClick={onNext}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 px-6 font-medium text-base shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
        >
          Connect my home
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-center text-[11px] text-muted-foreground tracking-wide">
          You can disconnect anytime.
        </p>
      </motion.div>
    </>
  );
}

function ActADone({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex flex-col items-center text-center max-w-md my-auto"
    >
      <div className="h-20 w-20 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mb-6">
        <Check className="h-9 w-9 text-primary" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">End of Variant A preview</h1>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        This is where the real dashboard would take over. Tap below to replay the flow.
      </p>
      <button
        onClick={onRestart}
        className="rounded-full border border-primary/40 text-primary py-3 px-6 text-sm font-medium hover:bg-primary/10 transition-colors"
      >
        Replay from start
      </button>
    </motion.div>
  );
}
