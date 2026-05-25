import { useState, useEffect } from 'react';
import { Coins, Loader2, AlertCircle, Sun, Car, BatteryFull, Zap, ChevronDown, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DailyBreakdown } from '@/lib/dailyMintBreakdown';

export type MintTokenCategory = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'home_charging' | 'supercharging' | 'all';

export interface MintTokenPendingRewards {
  solar: number;
  evMiles: number;
  battery: number;
  charging: number;
  superchargerKwh?: number;
  homeChargerKwh?: number;
}

interface MintTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  isMinting: boolean;
  /** Currently-minting category (for per-row spinner). */
  mintingCategory?: MintTokenCategory | null;
  pendingRewards: MintTokenPendingRewards;
  totalPendingTokens: number;
  onRequestMint: (cat: MintTokenCategory) => void;
  /** Optional — called when user taps "View receipt history" inside an expanded row. */
  onNavigateHistory?: () => void;
  /** Optional per-category daily breakdown of how the pending amount was earned. */
  dailyBreakdown?: Partial<Record<MintTokenCategory, DailyBreakdown>>;
}

/**
 * Shared Mint $ZSOLAR dialog used by both the live PWA (RewardActions)
 * and /demo-leonardo (DemoRewardActions).
 *
 * SOP: Any visual change here ships to both contexts simultaneously.
 * See mem://preferences/demo-mirror-sop.
 */
export function MintTokenDialog({
  open,
  onOpenChange,
  isLoading,
  isMinting,
  mintingCategory = null,
  pendingRewards,
  totalPendingTokens,
  onRequestMint,
  onNavigateHistory,
  dailyBreakdown,
}: MintTokenDialogProps) {
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => Date.now());
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [expandedCategory, setExpandedCategory] = useState<MintTokenCategory | null>('supercharging');

  // Update lastSyncedAt whenever a refresh completes while the dialog is open
  useEffect(() => {
    if (!isLoading && open) setLastSyncedAt(Date.now());
  }, [isLoading, open]);

  // Tick the "synced Xs ago" label while the dialog is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const syncedAgoLabel = (() => {
    const sec = Math.max(0, Math.floor((nowTick - lastSyncedAt) / 1000));
    if (sec < 5) return 'Synced just now';
    if (sec < 60) return `Synced ${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `Synced ${min}m ago`;
    const hr = Math.floor(min / 60);
    return `Synced ${hr}h ago`;
  })();

  const sources: string[] = [];
  if (pendingRewards.solar > 0) sources.push('solar');
  if (pendingRewards.battery > 0) sources.push('battery');
  if (pendingRewards.evMiles > 0) sources.push('EV miles');
  if ((pendingRewards.superchargerKwh ?? 0) > 0) sources.push('supercharging');
  if ((pendingRewards.homeChargerKwh ?? 0) > 0) sources.push('home charging');
  const whySentence =
    sources.length === 0
      ? 'From your clean-energy activity since your last mint.'
      : sources.length === 1
        ? `From your ${sources[0]} activity since your last mint.`
        : `From your ${sources.slice(0, -1).join(', ')} and ${sources.slice(-1)} since your last mint.`;

  const categories: Array<{
    key: MintTokenCategory;
    label: string;
    amount: number;
    icon: typeof Sun;
    colorClass: string;
    iconBg: string;
    hasInvoiceLag?: boolean;
    lagLabel?: string;
  }> = [
    { key: 'solar' as MintTokenCategory, label: 'Solar Energy', amount: pendingRewards.solar, icon: Sun, colorClass: 'text-solar', iconBg: 'from-solar/20 to-solar/10' },
    { key: 'battery' as MintTokenCategory, label: 'Battery Storage', amount: pendingRewards.battery, icon: BatteryFull, colorClass: 'text-secondary', iconBg: 'from-secondary/20 to-secondary/10' },
    { key: 'ev_miles' as MintTokenCategory, label: 'EV Miles', amount: pendingRewards.evMiles, icon: Car, colorClass: 'text-energy', iconBg: 'from-energy/20 to-energy/10' },
    {
      key: 'supercharging' as MintTokenCategory,
      label: 'Tesla Supercharging',
      amount: pendingRewards.superchargerKwh ?? 0,
      icon: Zap,
      colorClass: 'text-destructive',
      iconBg: 'from-destructive/20 to-destructive/10',
      hasInvoiceLag: true,
      lagLabel: 'Pending Tesla invoice — usually posts within 24–48h',
    },
    { key: 'home_charging' as MintTokenCategory, label: 'Home Charging', amount: pendingRewards.homeChargerKwh ?? 0, icon: Zap, colorClass: 'text-accent', iconBg: 'from-accent/20 to-accent/10' },
    { key: 'charging' as MintTokenCategory, label: 'EV Charging', amount: pendingRewards.charging, icon: Zap, colorClass: 'text-accent', iconBg: 'from-accent/20 to-accent/10' },
  ].filter((c) => c.amount > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
        {isLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 opacity-70" aria-label="Refreshing">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}

        <DialogHeader className="px-5 pt-6 pb-4 flex-row items-start justify-between space-y-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 ring-1 ring-primary/20 flex-shrink-0">
              <Coins className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">Mint $ZSOLAR</DialogTitle>
              <DialogDescription className="sr-only">
                Review your pending rewards and mint them to your wallet.
              </DialogDescription>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-full border border-border/60 flex-shrink-0"
            aria-live="polite"
            aria-label={syncedAgoLabel}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground tabular-nums">
              {syncedAgoLabel}
            </span>
          </div>
        </DialogHeader>

        {!(isLoading && totalPendingTokens === 0) && totalPendingTokens > 0 && (
          <div className="px-6 pb-5 text-center">
            <div className="inline-flex items-baseline gap-1.5">
              <span className="text-5xl font-bold text-foreground tabular-nums tracking-tight">
                {totalPendingTokens.toLocaleString()}
              </span>
              <span className="text-primary font-semibold text-lg">$ZSOLAR</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              {whySentence}
            </p>
          </div>
        )}

        <div className="px-4 pb-2 space-y-3 max-h-[50vh] overflow-y-auto">
          {isLoading && totalPendingTokens === 0 ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading mint categories">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/40 bg-muted/20 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/60" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-muted/60" />
                      <div className="h-2.5 w-32 rounded bg-muted/40" />
                    </div>
                  </div>
                  <div className="h-9 w-16 rounded-lg bg-muted/60" />
                </div>
              ))}
            </div>
          ) : totalPendingTokens === 0 ? (
            <div className="bg-gradient-to-br from-accent-warm/15 via-accent-warm/10 to-accent-warm/5 border border-accent-warm/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent-warm/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-accent-warm" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">No tokens available to mint</p>
                  <p className="text-xs text-muted-foreground">
                    Connect devices and generate energy to earn tokens. Pull down to refresh.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            categories.map((cat) => {
              const Icon = cat.icon;
              const expanded = expandedCategory === cat.key;
              const isCurrentlyMinting = mintingCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  className={`rounded-2xl border bg-muted/20 overflow-hidden transition-all ${
                    isCurrentlyMinting ? 'border-primary/60 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]' : 'border-border/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(expanded ? null : cat.key)}
                    className="w-full flex items-center justify-between p-3.5 text-left touch-manipulation active:bg-muted/40 transition-colors"
                    aria-expanded={expanded}
                    aria-controls={`mint-cat-${cat.key}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.iconBg} shadow-sm flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${cat.colorClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{cat.label}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {cat.amount.toLocaleString()} $ZSOLAR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestMint(cat.key);
                        }}
                        disabled={cat.amount === 0 || isMinting}
                        aria-busy={isCurrentlyMinting}
                        aria-label={`Mint ${cat.amount.toLocaleString()} ${cat.label} tokens`}
                        className="rounded-lg h-9 min-w-[64px] px-3 active:scale-95 transition-transform touch-manipulation"
                      >
                        {isCurrentlyMinting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mint'}
                      </Button>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div
                      id={`mint-cat-${cat.key}`}
                      className="px-4 pb-4 pt-1 space-y-2 border-t border-border/40 bg-muted/10"
                    >
                      {cat.hasInvoiceLag && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                          <Clock className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                          <span className="text-[11px] text-muted-foreground leading-tight">{cat.lagLabel}</span>
                        </div>
                      )}
                      {dailyBreakdown?.[cat.key] && (
                        <DailyBreakdownPanel
                          breakdown={dailyBreakdown[cat.key]!}
                          accentClass={cat.colorClass}
                          label={cat.label}
                        />
                      )}
                      {onNavigateHistory && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChange(false);
                            onNavigateHistory();
                          }}
                          className="w-full flex items-center justify-between px-2 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                        >
                          <span>View receipt history</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPendingTokens > 0 && (
          <div className="px-5 pt-3 pb-5 space-y-2 border-t border-border/40 bg-background">
            <Button
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.99] transition-all touch-manipulation font-semibold"
              onClick={() => onRequestMint('all')}
              disabled={isMinting}
              aria-busy={mintingCategory === 'all'}
            >
              {mintingCategory === 'all' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting…
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Mint All {totalPendingTokens.toLocaleString()} Tokens
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        )}

        {totalPendingTokens === 0 && (
          <DialogFooter className="px-5 pb-5">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11 rounded-xl border-border/60 hover:bg-muted/60"
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
