import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Crown,
  Droplets,
  Gauge,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import {
  SUBSCRIPTION_TIERS,
  formatUSD,
  type SubscriptionTierId,
  MINT_RATIO_KWH_PER_TOKEN,
  MINT_RATIO_LABEL,
} from "@/lib/tokenomics";
import {
  getFlywheelContribution,
  resetFlywheelAnchor,
  readMockTier,
} from "@/lib/flywheelLedger";

const MOCK_TIER_KEY = "zensolar_mock_subscription_tier";
const MOCK_USAGE_KEY = "zensolar_mock_subscription_mint_usage";

const tierIcons: Record<SubscriptionTierId, typeof Zap> = {
  base: Zap,
  regular: Sparkles,
  power: Crown,
};

/**
 * Admin Subscription Panel (Feature #4)
 * ─────────────────────────────────────
 * Founder-only mock controls + transparency surface for the v2.1
 * subscription-fee flywheel. Lets the operator:
 *   - Override their own active mock tier (or clear it)
 *   - Reset the cumulative-ledger anchor
 *   - Edit the mock monthly mint usage (Base tier soft-cap demos)
 *   - View per-tier 50/50 splits + projected $ to LP / Treasury at user-count
 *     scenarios (1K / 10K / 100K / 1M subscribers)
 *
 * NOTE: All controls are **mock / off-chain**. When mainnet ships, the
 * LP-side 50% will auto-inject into the public LP smart contract on Base.
 */
export default function AdminSubscriptionPanel() {
  const [tier, setTier] = useState<SubscriptionTierId | null>(readMockTier());
  const [usage, setUsage] = useState<number>(() => {
    try {
      const raw = Number(localStorage.getItem(MOCK_USAGE_KEY) ?? 0);
      return Number.isFinite(raw) ? raw : 0;
    } catch {
      return 0;
    }
  });
  const [, forceTick] = useState(0);

  // Refresh ledger snapshot every 5s so the cumulative numbers tick up live.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const ledger = useMemo(() => getFlywheelContribution(), [tier, usage]);

  const setMockTier = (next: SubscriptionTierId | null) => {
    try {
      if (next) localStorage.setItem(MOCK_TIER_KEY, next);
      else localStorage.removeItem(MOCK_TIER_KEY);
      resetFlywheelAnchor();
      setTier(next);
      toast.success(
        next
          ? `Mock tier set to ${SUBSCRIPTION_TIERS[next].name}`
          : "Mock subscription cleared",
      );
    } catch {
      toast.error("Could not update local mock state");
    }
  };

  const persistUsage = (n: number) => {
    try {
      localStorage.setItem(MOCK_USAGE_KEY, String(n));
      setUsage(n);
    } catch {
      /* ignore */
    }
  };

  const handleResetAnchor = () => {
    resetFlywheelAnchor();
    forceTick((n) => n + 1);
    toast.success("Cumulative ledger reset");
  };

  // Subscriber-count projection scenarios (annualized).
  const scenarios = [1_000, 10_000, 100_000, 1_000_000];

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Subscription Admin Panel | ZenSolar"
        description="Founder controls for the subscription-fee flywheel."
      />
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/founders">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Vault
            </Link>
          </Button>
          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
            Founders only · Mock state
          </Badge>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Subscription Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground leading-snug">
            Override tier, reset cumulative ledger, simulate mint usage, and
            preview flywheel projections at scale. All values are local-mock
            until billing + LP smart contract are live on Base.
          </p>
        </header>

        {/* SSoT card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              SSoT Parameters (read-only)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <Stat label="Mint ratio" value={MINT_RATIO_LABEL} />
            <Stat label="kWh / token" value={String(MINT_RATIO_KWH_PER_TOKEN)} />
            <Stat label="LP split" value="50%" />
            <Stat label="Treasury split" value="50%" />
          </CardContent>
        </Card>

        {/* Tier override */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Mock Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTierId[]).map((id) => {
                const t = SUBSCRIPTION_TIERS[id];
                const Icon = tierIcons[id];
                const active = tier === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMockTier(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {t.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatUSD(t.monthlyPrice)}/mo
                      </p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setMockTier(null)}
                className={cn(
                  "col-span-2 rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors",
                )}
              >
                Clear mock subscription
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Live ledger */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Live Cumulative Ledger</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetAnchor}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset anchor
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tier ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <LedgerCell
                    icon={Droplets}
                    label="To Liquidity"
                    value={ledger.cumulativeLp}
                  />
                  <LedgerCell
                    icon={Building2}
                    label="To Treasury"
                    value={ledger.cumulativeTreasury}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Active for{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {ledger.monthsActive.toFixed(4)} months
                  </span>{" "}
                  · ${ledger.monthlyToLp.toFixed(2)}/mo to LP · $
                  {ledger.monthlyToTreasury.toFixed(2)}/mo to Treasury
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No mock subscription active. Choose a tier above to start the
                ledger.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mock usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mock Monthly Mint Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="usage" className="text-xs text-muted-foreground">
              $ZSOLAR minted this month (drives Base soft-cap progress bar)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="usage"
                type="number"
                min={0}
                step={50}
                value={usage}
                onChange={(e) => persistUsage(Math.max(0, Number(e.target.value) || 0))}
                className="h-9"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => persistUsage(0)}
                className="h-9"
              >
                Reset
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Base soft cap is {SUBSCRIPTION_TIERS.base.softMintCapPerMonth?.toLocaleString()} $ZSOLAR/mo.
            </p>
          </CardContent>
        </Card>

        {/* Projections */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Annualized Flywheel Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTierId[]).map((id) => {
              const t = SUBSCRIPTION_TIERS[id];
              return (
                <div key={id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      ${t.lpPerMonth.toFixed(2)} LP · $
                      {t.treasuryPerMonth.toFixed(2)} Treasury / sub / mo
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {scenarios.map((users) => {
                      const arrLp = t.lpPerMonth * users * 12;
                      const arrTr = t.treasuryPerMonth * users * 12;
                      return (
                        <div
                          key={users}
                          className="rounded-md border border-border bg-muted/30 px-1.5 py-1.5"
                        >
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                            {users.toLocaleString()} subs
                          </p>
                          <p className="text-[10px] text-primary tabular-nums">
                            {compactUsd(arrLp)}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {compactUsd(arrTr)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="opacity-50" />
                </div>
              );
            })}
            <p className="text-[11px] text-muted-foreground">
              Top number = annual $ injected into LP. Bottom = annual $ to
              Treasury. Both columns at uniform tier adoption.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}

function LedgerCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground tabular-nums">
        ${value.toFixed(4)}
      </p>
    </div>
  );
}

function compactUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
