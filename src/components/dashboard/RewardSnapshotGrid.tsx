import { Coins, Wallet, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCo2TierProgress } from '@/lib/co2Tier';
import { cn } from '@/lib/utils';

interface RewardSnapshotGridProps {
  todayMinted: number;        // $ZSOLAR earned today
  walletBalance: number;      // lifetime $ZSOLAR in wallet
  lifetimeCo2Lbs: number;     // lifetime CO₂ offset in pounds
}

/**
 * 3-up reward snapshot grid that sits below the Tap-to-Mint hero.
 *
 * Reads in one glance: what you earned today · what you hold · the real-world
 * climate impact behind it (with a status tier badge).
 *
 * The CO₂ tier is a *narrative status badge* — pure gamification. It does NOT
 * change the locked v3.1 mint split or the 1 kWh = 1 $ZSOLAR UX rule.
 */
export function RewardSnapshotGrid({
  todayMinted,
  walletBalance,
  lifetimeCo2Lbs,
}: RewardSnapshotGridProps) {
  const { tier, progressPct, toNextLbs } = getCo2TierProgress(lifetimeCo2Lbs);

  const tierTone: Record<string, string> = {
    seedling: 'bg-muted/40 text-muted-foreground border-muted-foreground/30',
    bronze:   'bg-amber-900/30 text-amber-300 border-amber-500/40',
    silver:   'bg-slate-700/30 text-slate-200 border-slate-300/40',
    gold:     'bg-yellow-900/30 text-yellow-300 border-yellow-400/50',
    platinum: 'bg-cyan-900/30 text-cyan-200 border-cyan-300/50',
  };

  return (
    <div
      role="group"
      aria-label="Reward snapshot"
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      <Tile
        icon={<Coins className="h-4 w-4 text-primary" />}
        label="Today"
        value={todayMinted.toLocaleString()}
        unit="$ZSOLAR"
      />
      <Tile
        icon={<Wallet className="h-4 w-4 text-primary" />}
        label="Balance"
        value={walletBalance.toLocaleString()}
        unit="$ZSOLAR"
      />
      <Tile
        icon={<Leaf className="h-4 w-4 text-emerald-400" />}
        label="CO₂ offset"
        value={Math.round(lifetimeCo2Lbs).toLocaleString()}
        unit="lbs"
        footer={
          <div className="mt-1.5 space-y-1">
            <Badge
              variant="outline"
              className={cn('px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider', tierTone[tier.id])}
            >
              {tier.label}
            </Badge>
            <div
              className="h-1 w-full rounded-full bg-muted/40 overflow-hidden"
              aria-label={
                toNextLbs == null
                  ? 'Top climate tier reached'
                  : `${Math.round(toNextLbs)} lbs to next tier`
              }
            >
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  unit,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-3 py-3 sm:py-3.5 flex flex-col">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1 min-w-0">
        <span className="text-lg sm:text-xl font-bold tabular-nums text-foreground truncate">
          {value}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>
      </div>
      {footer}
    </div>
  );
}
