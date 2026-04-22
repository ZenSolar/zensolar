import { useMemo } from 'react';
import { Sparkles, Zap, Leaf, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateUsdValue } from '@/hooks/useTokenPrice';
import {
  EPA_CO2_LBS_PER_KWH,
  CO2_LBS_PER_GAS_MILE,
  EV_KWH_PER_MILE,
} from '@/types/dashboard';

interface TapToMintCardProps {
  /** Pending units since last mint */
  pending: {
    solarKwh: number;
    evMiles: number;
    batteryKwh: number;
    chargingKwh: number;
  };
  /** Live $ZSOLAR price for USD conversion */
  tokenPrice: number;
  /** Wallet connected? Disables CTA + shows hint when false */
  hasWallet: boolean;
  /** Opens the existing Mint Rewards (token mint) flow */
  onTapToMint: () => void;
  /** Loading state from dashboard */
  disabled?: boolean;
}

/**
 * Demo-only Tap-to-Mint™ card.
 * Shows a live preview of expected $ZSOLAR + CO₂ avoided, then opens the
 * existing Mint Rewards flow when tapped.
 */
export function TapToMintCard({
  pending,
  tokenPrice,
  hasWallet,
  onTapToMint,
  disabled = false,
}: TapToMintCardProps) {
  const { totalUnits, expectedTokens, usdValue, co2Lbs, breakdown } = useMemo(() => {
    const totalUnits =
      pending.solarKwh + pending.evMiles + pending.batteryKwh + pending.chargingKwh;

    // Mint split: 75% to user (20% burn, 3% LP, 2% treasury) — matches RewardActions.
    const expectedTokens = Math.floor(totalUnits * 0.75);

    // CO₂ avoided preview (lbs):
    // - solar kWh × grid factor
    // - battery kWh × grid factor
    // - EV miles: gas baseline minus electricity used (charging kWh, else estimate)
    const evKwhUsed =
      pending.chargingKwh > 0 ? pending.chargingKwh : pending.evMiles * EV_KWH_PER_MILE;
    const evNet = Math.max(
      0,
      pending.evMiles * CO2_LBS_PER_GAS_MILE - evKwhUsed * EPA_CO2_LBS_PER_KWH,
    );
    const co2Lbs = Math.round(
      pending.solarKwh * EPA_CO2_LBS_PER_KWH +
        pending.batteryKwh * EPA_CO2_LBS_PER_KWH +
        evNet,
    );

    return {
      totalUnits,
      expectedTokens,
      usdValue: calculateUsdValue(expectedTokens, tokenPrice),
      co2Lbs,
      breakdown: [
        { label: 'Solar', value: pending.solarKwh, unit: 'kWh' },
        { label: 'EV', value: pending.evMiles, unit: 'mi' },
        { label: 'Battery', value: pending.batteryKwh, unit: 'kWh' },
        { label: 'Charging', value: pending.chargingKwh, unit: 'kWh' },
      ].filter((b) => b.value > 0),
    };
  }, [pending, tokenPrice]);

  const hasPending = totalUnits > 0;
  const ctaDisabled = disabled || !hasPending || !hasWallet;

  return (
    <Card
      className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5"
      data-testid="tap-to-mint-card"
    >
      {/* Subtle animated glow ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -20%, hsl(var(--primary) / 0.18), transparent 60%)',
        }}
      />

      <div className="relative p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Tap-to-Mint™
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              Convert energy into $ZSOLAR
            </h3>
            <p className="text-xs text-muted-foreground">
              Live preview · 75% to you · 20% burn · 3% LP · 2% treasury
            </p>
          </div>
          {hasPending && (
            <Badge
              variant="outline"
              className="shrink-0 border-primary/40 bg-primary/10 text-primary text-[10px] tracking-wider uppercase"
            >
              Ready
            </Badge>
          )}
        </div>

        {/* Live preview: $ZSOLAR + CO₂ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              Expected
            </div>
            <div className="mt-1.5 text-2xl sm:text-[28px] font-black text-primary tabular-nums leading-none">
              {expectedTokens.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
              $ZSOLAR · {usdValue}
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Leaf className="h-3 w-3 text-primary" />
              CO₂ avoided
            </div>
            <div className="mt-1.5 text-2xl sm:text-[28px] font-black text-foreground tabular-nums leading-none">
              {co2Lbs.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">lbs (this mint)</div>
          </div>
        </div>

        {/* Source breakdown chips */}
        {hasPending && (
          <div className="flex flex-wrap gap-1.5">
            {breakdown.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums"
              >
                <span className="text-foreground">{b.value.toLocaleString()}</span>
                <span>{b.unit}</span>
                <span className="text-muted-foreground/60">· {b.label}</span>
              </span>
            ))}
          </div>
        )}

        {!hasPending && (
          <p className="text-xs text-muted-foreground">
            No pending energy yet. Sync a device or wait for your next interval to see a
            live preview here.
          </p>
        )}

        {/* CTA */}
        <Button
          onClick={onTapToMint}
          disabled={ctaDisabled}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold animate-pulse-glow shadow-lg shadow-primary/20"
        >
          Tap to Mint
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>

        {!hasWallet && (
          <p className="text-center text-[11px] text-muted-foreground">
            Connect a wallet to mint — preview stays live in the meantime.
          </p>
        )}
      </div>
    </Card>
  );
}
