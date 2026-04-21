import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import type { FounderSnapshot } from "@/hooks/useVaultSnapshot";

const fmtUsd = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtTokens = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(0)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return n.toLocaleString();
};

export function FounderCard({
  founder,
  isViewer,
}: {
  founder: FounderSnapshot;
  isViewer: boolean;
}) {
  const isTrillionaire = founder.net_worth >= 1e12;
  const pct = founder.progress_to_trillion * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-4 overflow-hidden ${
        isViewer
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-card/40"
      }`}
    >
      {isTrillionaire && (
        <div className="absolute top-2 right-2">
          <Crown className="h-4 w-4 text-amber-400" />
        </div>
      )}

      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {founder.name.split(" ")[0]}
          {isViewer && (
            <span className="ml-1 text-[10px] uppercase tracking-wider text-primary">
              · You
            </span>
          )}
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {fmtTokens(founder.allocation)} held
        </span>
      </div>

      <motion.div
        key={founder.net_worth}
        initial={{ scale: 0.97, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-3xl font-bold tracking-tight tabular-nums"
      >
        {fmtUsd(founder.net_worth)}
      </motion.div>

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Path to $1T</span>
          <span className="tabular-nums">{pct.toFixed(2)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isTrillionaire
                ? "bg-amber-400"
                : "bg-gradient-to-r from-primary to-primary/60"
            }`}
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
          <TrendingUp className="h-3 w-3" />
          <span>Crosses $1T at ${founder.trillionaire_price.toFixed(2)}/token</span>
        </div>
      </div>
    </motion.div>
  );
}
