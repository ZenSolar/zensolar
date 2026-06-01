import { ArrowDownRight, ArrowUpRight, Coins, DollarSign, Zap } from "lucide-react";

interface Tile {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null; // % change vs previous month
  icon: "dollar" | "coin" | "zap";
}

interface Props {
  dollarsSaved: number;
  bonusTokens: number;
  prevDollarsSaved: number | null;
  prevBonusTokens: number | null;
}

function pctDelta(curr: number, prev: number | null): number | null {
  if (prev == null || prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

function fmtDelta(delta: number | null): { text: string; positive: boolean } | null {
  if (delta == null || !isFinite(delta)) return null;
  const rounded = Math.round(delta);
  if (Math.abs(rounded) < 1) return { text: "flat vs last mo.", positive: true };
  return { text: `${Math.abs(rounded)}% vs last mo.`, positive: rounded >= 0 };
}

const Icon = ({ kind }: { kind: Tile["icon"] }) => {
  const cls = "h-3.5 w-3.5";
  if (kind === "dollar") return <DollarSign className={cls} />;
  if (kind === "coin") return <Coins className={cls} />;
  return <Zap className={cls} />;
};

/**
 * Three insight tiles: bill savings, $ZSOLAR minted (1:1), and clean kWh.
 * Each tile shows MoM delta when prior data exists.
 */
export function InsightTiles({ dollarsSaved, bonusTokens, prevDollarsSaved, prevBonusTokens }: Props) {
  const tiles: Tile[] = [
    {
      label: "Bill savings",
      value: `$${Math.round(dollarsSaved).toLocaleString()}`,
      icon: "dollar",
      delta: pctDelta(dollarsSaved, prevDollarsSaved),
    },
    {
      label: "$ZSOLAR minted",
      value: `+${Math.round(bonusTokens).toLocaleString()}`,
      sub: "1 kWh = 1 $ZSOLAR",
      icon: "coin",
      delta: pctDelta(bonusTokens, prevBonusTokens),
    },
    {
      label: "Clean kWh",
      value: `${Math.round(bonusTokens).toLocaleString()}`,
      sub: "this month",
      icon: "zap",
      delta: pctDelta(bonusTokens, prevBonusTokens),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t) => {
        const d = fmtDelta(t.delta ?? null);
        return (
          <div
            key={t.label}
            className="rounded-lg border border-border/60 bg-card/60 p-2.5"
          >
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Icon kind={t.icon} />
              <span className="truncate">{t.label}</span>
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{t.value}</div>
            {t.sub && (
              <div className="text-[10px] text-muted-foreground">{t.sub}</div>
            )}
            {d && (
              <div
                className={`mt-1 inline-flex items-center gap-0.5 text-[10px] ${
                  d.positive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {d.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{d.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
