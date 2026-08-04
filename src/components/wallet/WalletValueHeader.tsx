import { Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletValueHeaderProps {
  formattedBalance: string;
  usdValue: number;
  lifetimeKwh: number;
  isLoading: boolean;
  hidden: boolean;
  onToggleHidden: () => void;
  onRefresh: () => void;
  network: string;
}

/**
 * Tier 1 — Value header.
 * Big $ZSOLAR number, USD equivalent with an explicit pre-liquidity caveat,
 * lifetime kWh underneath. The emerald→cyan signature gradient is reserved
 * for the balance number only.
 */
export function WalletValueHeader({
  formattedBalance,
  usdValue,
  lifetimeKwh,
  isLoading,
  hidden,
  onToggleHidden,
  onRefresh,
  network,
}: WalletValueHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
      <div className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-primary/[0.07] blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full border border-eco/20 bg-eco/10 px-2 py-0.5 text-[11px] text-eco">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-eco opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-eco" />
            </span>
            <span className="font-medium">{network}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleHidden}
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
              className="rounded-lg p-1.5 transition-colors hover:bg-muted/50"
            >
              {hidden ? (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh balances"
              className="rounded-lg p-1.5 transition-colors hover:bg-muted/50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-11 w-52" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span
                className="bg-gradient-to-r from-[hsl(var(--eco))] to-primary bg-clip-text text-4xl font-bold tabular-nums tracking-tight text-transparent"
              >
                {hidden ? '••••••' : formattedBalance}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">$ZSOLAR</span>
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              {hidden
                ? '••••'
                : `≈ $${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}{' '}
              <span className="text-muted-foreground/70">
                · indicative only, no liquid market yet
              </span>
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-eco" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">
                  {lifetimeKwh.toLocaleString()} kWh
                </span>{' '}
                verified and credited to this wallet
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
