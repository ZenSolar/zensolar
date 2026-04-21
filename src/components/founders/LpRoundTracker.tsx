import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, TrendingUp, Lock as LockIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LpRound {
  id: string;
  round_number: number;
  usdc_injected: number;
  tokens_released: number;
  spot_price_usd: number;
  notes: string | null;
  executed_at: string;
}

const fmtUsd = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtTokens = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
};

export function LpRoundTracker({
  currentPrice,
  josephAllocation,
  michaelAllocation,
}: {
  currentPrice: number;
  josephAllocation: number;
  michaelAllocation: number;
}) {
  const [rounds, setRounds] = useState<LpRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("lp_rounds")
        .select("*")
        .order("round_number", { ascending: true });
      if (!cancelled) {
        setRounds((data as LpRound[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsdc = rounds.reduce((s, r) => s + Number(r.usdc_injected), 0);
  const totalCirculating = rounds.reduce(
    (s, r) => s + Number(r.tokens_released),
    0,
  );
  const latest = rounds[rounds.length - 1];
  const totalLocked = josephAllocation + michaelAllocation;

  // Liquid value = max you could realistically pull from LP without breaking it (~the USDC side)
  const josephLiquid = Math.min(
    josephAllocation * currentPrice,
    totalUsdc * 0.75, // can't drain more than ~75% of LP without massive slippage
  );
  const michaelLiquid = Math.min(
    michaelAllocation * currentPrice,
    totalUsdc * 0.75,
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Droplets className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">LP Round Tracker</h2>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rounds…</p>
      ) : rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No LP rounds executed yet.</p>
      ) : (
        <>
          {/* Top stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Current Round"
              value={`#${latest.round_number}`}
              sub={`Spot $${Number(latest.spot_price_usd).toFixed(2)}`}
            />
            <Stat
              label="LP Depth"
              value={fmtUsd(totalUsdc)}
              sub="USDC paired"
            />
            <Stat
              label="Circulating"
              value={fmtTokens(totalCirculating)}
              sub={`${((totalCirculating / 1e12) * 100).toFixed(4)}% of 1T`}
            />
            <Stat
              label="Pact-Locked"
              value={fmtTokens(totalLocked)}
              sub="Joseph + Michael"
              icon={<LockIcon className="h-3 w-3 text-amber-400" />}
            />
          </div>

          {/* Book vs Liquid */}
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Book vs Liquid Value
            </p>
            <BookLiquidRow
              name="Joseph"
              book={josephAllocation * currentPrice}
              liquid={josephLiquid}
            />
            <BookLiquidRow
              name="Michael"
              book={michaelAllocation * currentPrice}
              liquid={michaelLiquid}
            />
            <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/30">
              Book = mark-to-market. Liquid = realistic exit at current LP depth.
            </p>
          </div>

          {/* Rounds table */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Round History
            </p>
            {rounds.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-md bg-secondary/20 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">
                    R{r.round_number}
                  </span>
                  <TrendingUp className="h-3 w-3 text-primary" />
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="text-muted-foreground">
                    +{fmtUsd(Number(r.usdc_injected))}
                  </span>
                  <span>{fmtTokens(Number(r.tokens_released))}</span>
                  <span className="text-primary font-medium">
                    ${Number(r.spot_price_usd).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function BookLiquidRow({
  name,
  book,
  liquid,
}: {
  name: string;
  book: number;
  liquid: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground w-16">{name}</span>
      <span className="tabular-nums font-semibold">{fmtUsd(book)}</span>
      <span className="text-[10px] text-muted-foreground">book</span>
      <span className="tabular-nums text-primary">{fmtUsd(liquid)}</span>
      <span className="text-[10px] text-muted-foreground">liquid</span>
    </div>
  );
}
