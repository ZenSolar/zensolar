import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * V2 FRE — Variant B — Tesla-grade restraint.
 * 3-act flow: Promise → Proof → Permission. Final tap calls onComplete.
 */
export function V2VariantB({ onComplete }: { onComplete?: () => void }) {
  const [act, setAct] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-[100svh] bg-background text-foreground flex flex-col px-6 pt-24 pb-10 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-foreground/50 font-mono"
      >
        <span>ZENSOLAR</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-primary" />
          {`0${act} / 03`}
        </span>
      </motion.div>

      <div className="h-px w-full bg-foreground/10 mt-3" />

      <AnimatePresence mode="wait">
        {act === 1 && <ActB1 key="b1" onNext={() => setAct(2)} />}
        {act === 2 && <ActB2 key="b2" onNext={() => setAct(3)} />}
        {act === 3 && <ActB3 key="b3" onNext={() => onComplete?.()} />}
      </AnimatePresence>
    </div>
  );
}

function ActB1({ onNext }: { onNext: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-end max-w-lg"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-6 font-mono">
          01 — The Promise
        </p>
        <h1 className="text-5xl sm:text-6xl font-light tracking-tight leading-[0.95] mb-8">
          Your home<br />
          <span className="text-foreground/40">already does</span><br />
          the work.
        </h1>
        <p className="text-base text-foreground/60 leading-relaxed max-w-sm mb-12">
          We're just the part that notices.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <DataPill label="Sun" value="4.2" unit="kW" />
          <DataPill label="Battery" value="87" unit="%" />
          <DataPill label="Drive" value="142" unit="mi" />
        </div>
      </motion.div>

      <div className="h-px w-full bg-foreground/10 mb-6" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 text-base font-medium tracking-tight"
        >
          Begin
          <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-mono">
          90 sec
        </span>
      </motion.div>
    </>
  );
}

function ActB2({ onNext }: { onNext: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-end max-w-lg"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-6 font-mono">
          02 — The Proof
        </p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-[1.0] mb-10">
          Numbers don't<br />exaggerate.
        </h1>

        <div className="space-y-px border-t border-b border-foreground/10">
          {[
            { k: "Generated today", v: "18.4", u: "kWh" },
            { k: "Stored", v: "12.1", u: "kWh" },
            { k: "Earned", v: "0.42", u: "ZSOL" },
          ].map((row) => (
            <div
              key={row.k}
              className="flex items-baseline justify-between py-4 border-t border-foreground/5 first:border-t-0"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 font-mono">
                {row.k}
              </span>
              <span className="font-mono">
                <span className="text-2xl font-light tabular-nums">{row.v}</span>
                <span className="text-[10px] text-foreground/40 ml-1 uppercase">{row.u}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="h-px w-full bg-foreground/10 mb-6 mt-10" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 text-base font-medium tracking-tight"
        >
          Continue
          <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </motion.div>
    </>
  );
}

function ActB3({ onNext }: { onNext: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col justify-end max-w-lg"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/50 mb-6 font-mono">
          03 — The Permission
        </p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight leading-[1.0] mb-8">
          One handshake.<br />
          <span className="text-foreground/40">Then we vanish.</span>
        </h1>
        <p className="text-base text-foreground/60 leading-relaxed max-w-sm mb-10">
          Link a single account. Everything else runs quietly.
        </p>
      </motion.div>

      <div className="h-px w-full bg-foreground/10 mb-6" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-2 text-base font-medium tracking-tight"
        >
          Connect
          <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-mono">
          encrypted
        </span>
      </motion.div>
    </>
  );
}

function DataPill({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-mono mb-1.5">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-light tabular-nums tracking-tight">{value}</span>
        <span className="text-[10px] text-foreground/50 font-mono uppercase">{unit}</span>
      </div>
    </div>
  );
}
