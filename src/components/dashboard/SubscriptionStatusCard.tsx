import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Crown,
  Zap,
  Sparkles,
  ArrowRight,
  Droplets,
  Building2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SUBSCRIPTION_TIERS,
  formatUSD,
  type SubscriptionTierId,
} from '@/lib/tokenomics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * SubscriptionStatusCard — Dashboard widget (v2.1)
 *
 * Mock-data implementation per SSoT v2.1 (no real billing yet).
 * Source of truth: localStorage key `zensolar_mock_subscription_tier`.
 * When the user has no tier, shows an upsell. When they have one, shows:
 *   - Current tier + monthly price
 *   - 50/50 split (LP vs Treasury) with live $ amounts
 *   - Mint cap usage (Base only) or "Unlimited minting"
 *   - CTA to /subscribe
 */

const MOCK_TIER_KEY = 'zensolar_mock_subscription_tier';
const MOCK_USAGE_KEY = 'zensolar_mock_subscription_mint_usage';

type TierMeta = {
  icon: typeof Crown;
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
};

const tierMeta: Record<SubscriptionTierId, TierMeta> = {
  base: {
    icon: Zap,
    gradient: 'from-secondary/20 via-secondary/5 to-transparent',
    iconBg: 'bg-secondary/15',
    iconColor: 'text-secondary',
    borderColor: 'border-l-secondary',
  },
  regular: {
    icon: Sparkles,
    gradient: 'from-primary/20 via-primary/5 to-transparent',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    borderColor: 'border-l-primary',
  },
  power: {
    icon: Crown,
    gradient: 'from-solar/25 via-solar/5 to-transparent',
    iconBg: 'bg-solar/15',
    iconColor: 'text-solar',
    borderColor: 'border-l-solar',
  },
};

interface SubscriptionStatusCardProps {
  /** Optional override; if omitted reads mock from localStorage. */
  tierOverride?: SubscriptionTierId | null;
  /** Tokens minted this month (used for Base soft cap progress). */
  mintedThisMonth?: number;
}

export function SubscriptionStatusCard({
  tierOverride,
  mintedThisMonth,
}: SubscriptionStatusCardProps) {
  const [tier, setTier] = useState<SubscriptionTierId | null>(null);
  const [mockUsage, setMockUsage] = useState<number>(0);

  useEffect(() => {
    if (tierOverride !== undefined) {
      setTier(tierOverride);
      return;
    }
    try {
      const stored = localStorage.getItem(MOCK_TIER_KEY) as SubscriptionTierId | null;
      if (stored && stored in SUBSCRIPTION_TIERS) setTier(stored);
      const usage = Number(localStorage.getItem(MOCK_USAGE_KEY) ?? 0);
      if (!Number.isNaN(usage)) setMockUsage(usage);
    } catch {
      // ignore
    }
  }, [tierOverride]);

  const usage = mintedThisMonth ?? mockUsage;

  // ── Empty state: no subscription ────────────────────────────────
  if (!tier) {
    return (
      <Card className="overflow-hidden border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">
                  Unlock Mint-on-Proof
                </h3>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  Required
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                A $ZSOLAR plan is required to mint. Every dollar splits 50% to liquidity, 50% to treasury.
              </p>
              <Button asChild size="sm" className="mt-3 h-8 text-xs">
                <Link to="/subscribe">
                  Choose a plan
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Active subscription ─────────────────────────────────────────
  const tierData = SUBSCRIPTION_TIERS[tier];
  const meta = tierMeta[tier];
  const Icon = meta.icon;

  const cap = tierData.softMintCapPerMonth;
  const capPct = cap ? Math.min(100, (usage / cap) * 100) : 0;

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden border-l-4 bg-gradient-to-br',
          meta.borderColor,
          meta.gradient,
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.iconBg)}>
                <Icon className={cn('h-5 w-5', meta.iconColor)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Current Plan
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    Active
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground leading-tight">
                  {tierData.name}
                  <span className="text-muted-foreground font-normal ml-1.5 text-sm">
                    · {formatUSD(tierData.monthlyPrice)}/mo
                  </span>
                </h3>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs shrink-0"
            >
              <Link to="/subscribe">
                Manage
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* 50/50 split — Liquidity vs Treasury */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Where your subscription goes
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="Split explanation">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  Every dollar of your $ZSOLAR plan is split 50/50: half is injected
                  into the on-chain liquidity pool, half funds treasury operations.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SplitCell
                icon={Droplets}
                label="Liquidity"
                amount={tierData.lpPerMonth}
                tone="primary"
              />
              <SplitCell
                icon={Building2}
                label="Treasury"
                amount={tierData.treasuryPerMonth}
                tone="muted"
              />
            </div>
            {/* Visual 50/50 bar */}
            <div className="mt-2 h-1.5 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full bg-primary/70"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                className="h-full bg-muted-foreground/40"
              />
            </div>
          </div>

          {/* Mint cap usage (Base only) or unlimited badge */}
          {cap ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Monthly mint usage</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {usage.toLocaleString()} / {cap.toLocaleString()} $ZSOLAR
                </span>
              </div>
              <Progress value={capPct} className="h-1.5" />
              {capPct >= 80 && (
                <p className="mt-1.5 text-[11px] text-solar">
                  You're approaching your Base mint cap. Upgrade to Regular for unlimited minting.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-foreground">
                <span className="font-semibold">Unlimited minting</span>
                <span className="text-muted-foreground"> · no monthly cap</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

interface SplitCellProps {
  icon: typeof Droplets;
  label: string;
  amount: number;
  tone: 'primary' | 'muted';
}

function SplitCell({ icon: Icon, label, amount, tone }: SplitCellProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 p-2">
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          tone === 'primary' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground tabular-nums leading-tight">
          {formatUSD(amount)}
          <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
        </p>
      </div>
    </div>
  );
}
