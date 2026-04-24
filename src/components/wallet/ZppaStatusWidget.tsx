import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Lock, Clock, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useZppaEligibility } from '@/hooks/useZppaEligibility';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * ZPPA Status Widget — Wallet placement.
 *
 * Surfaces the user's Zen Power Purchase Agreement eligibility:
 *  - 30-day verified kWh
 *  - kWh remaining to unlock (or "ZPPA Active")
 *  - Producer-window purchase ceiling
 *  - The rules in plain English (popover)
 *
 * See mem://features/zppa for naming/placement doctrine.
 */
export function ZppaStatusWidget() {
  const {
    isLoading,
    kwh30d,
    threshold,
    remainingKwhToUnlock,
    isEligible,
    progressPct,
    ceilingUsdc,
    producerWindowHours,
    lookbackDays,
  } = useZppaEligibility();

  const headlineColor = isEligible ? 'text-eco' : 'text-foreground';
  const ringColor = isEligible
    ? 'border-eco/30 bg-eco/[0.05]'
    : 'border-primary/20 bg-primary/[0.04]';
  const iconBg = isEligible ? 'bg-eco/15 text-eco' : 'bg-primary/15 text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className={`relative overflow-hidden rounded-2xl border ${ringColor} p-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${iconBg}`}>
              {isEligible ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-foreground">ZPPA</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="p-0.5 rounded-md hover:bg-muted/50 transition-colors"
                      aria-label="What is ZPPA?"
                    >
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-72 text-xs leading-relaxed">
                    <p className="font-semibold text-foreground mb-1.5">
                      Zen Power Purchase Agreement
                    </p>
                    <p className="text-muted-foreground mb-2">
                      Producers buy first. Each $ZSOLAR LP round opens with a{' '}
                      <span className="font-medium text-foreground">
                        {producerWindowHours}-hour producer-only window
                      </span>{' '}
                      gated to wallets that minted ≥ {threshold} verified kWh in the prior {lookbackDays} days. Whatever's
                      left opens to the public.
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Threshold: {threshold} kWh / {lookbackDays}d</li>
                      <li>• Ceiling: min($500, your kWh × $0.50)</li>
                      <li>• Public window: leftovers only, hard cap $500</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Producer Priority Access
              </p>
            </div>
          </div>

          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isEligible
                ? 'bg-eco/15 text-eco border border-eco/30'
                : 'bg-muted/50 text-muted-foreground border border-border/50'
            }`}
          >
            {isLoading ? '…' : isEligible ? 'Active' : 'Locked'}
          </div>
        </div>

        {/* Headline number */}
        {isLoading ? (
          <Skeleton className="h-8 w-40 mb-3" />
        ) : (
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums tracking-tight ${headlineColor}`}>
                {kwh30d.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                / {threshold} kWh ({lookbackDays}d)
              </span>
            </div>
            {!isEligible ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Mint{' '}
                <span className="font-semibold text-foreground tabular-nums">
                  {remainingKwhToUnlock.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
                </span>{' '}
                more to unlock the next producer window.
              </p>
            ) : (
              <p className="text-xs text-eco/90 mt-0.5">
                You qualify for the next ZPPA window — first 24h, before the public.
              </p>
            )}
          </div>
        )}

        {/* Progress bar */}
        {!isLoading && (
          <div className="mb-4">
            <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isEligible
                    ? 'bg-gradient-to-r from-eco to-eco/70'
                    : 'bg-gradient-to-r from-primary to-primary/60'
                }`}
              />
            </div>
          </div>
        )}

        {/* What applies to you */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Your window
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">
              {isEligible ? `First ${producerWindowHours}h` : 'Public only'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isEligible ? 'Producer priority' : 'After producers buy'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Your ceiling
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground tabular-nums">
              ${isEligible ? Math.floor(ceilingUsdc).toLocaleString() : '500'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isEligible ? 'min($500, kWh × $0.50)' : 'Hard cap, public window'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
