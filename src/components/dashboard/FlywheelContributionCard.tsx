import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Building2, Zap, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFlywheelContribution } from '@/hooks/useFlywheelContribution';
import { formatUSD } from '@/lib/tokenomics';

/**
 * FlywheelContributionCard
 * ────────────────────────
 * Personal, live view of the user's subscription-fee flywheel.
 *
 * - Pulls from the same source of truth as SubscriptionStatusCard
 *   (mock tier in localStorage) via useFlywheelContribution().
 * - Shows cumulative $ routed to LP vs Treasury since the user activated.
 * - Displays an explicit "Auto-injects to LP smart contract on mainnet"
 *   annotation per the founder directive.
 * - Renders nothing if the user has no active subscription (the
 *   SubscriptionStatusCard already handles the upsell).
 */
export function FlywheelContributionCard() {
  const fly = useFlywheelContribution();

  if (!fly.tier) return null;

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Your Flywheel Contribution
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex"
                        aria-label="Flywheel explanation"
                      >
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      Live tally of your subscription dollars flowing into the
                      ZenSolar economy. Updates continuously while your plan is
                      active.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {formatUSD(fly.monthlyPrice)}/mo · {fly.monthsActive.toFixed(2)} mo active
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] border-primary/40 text-primary shrink-0"
            >
              Live
            </Badge>
          </div>

          {/* Cumulative split */}
          <div className="grid grid-cols-2 gap-2">
            <CumulativeCell
              icon={Droplets}
              label="To Liquidity"
              amount={fly.cumulativeLp}
              ratePerMonth={fly.monthlyToLp}
              tone="primary"
            />
            <CumulativeCell
              icon={Building2}
              label="To Treasury"
              amount={fly.cumulativeTreasury}
              ratePerMonth={fly.monthlyToTreasury}
              tone="muted"
            />
          </div>

          {/* Mainnet annotation */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2"
          >
            <span className="relative mt-0.5 flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <p className="text-[11px] leading-snug text-foreground">
              <span className="font-semibold">Auto-injects to LP smart contract on mainnet.</span>
              <span className="text-muted-foreground">
                {' '}Once live on Base, the liquidity-side 50% routes on-chain
                automatically — verifiable on Basescan.
              </span>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

interface CumulativeCellProps {
  icon: typeof Droplets;
  label: string;
  amount: number;
  ratePerMonth: number;
  tone: 'primary' | 'muted';
}

function CumulativeCell({
  icon: Icon,
  label,
  amount,
  ratePerMonth,
  tone,
}: CumulativeCellProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/60 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className={
            tone === 'primary'
              ? 'flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary'
              : 'flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground'
          }
        >
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-base font-bold text-foreground tabular-nums leading-tight">
        {formatUSD(amount)}
      </p>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        +{formatUSD(ratePerMonth)}/mo
      </p>
    </div>
  );
}
