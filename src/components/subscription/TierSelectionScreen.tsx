import { Check, Zap, Battery, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from "@/lib/tokenomics";
import { cn } from "@/lib/utils";

interface TierSelectionScreenProps {
  selectedTier?: SubscriptionTierId;
  onSelect?: (tier: SubscriptionTierId) => void;
  ctaLabel?: string;
}

const TIER_META: Record<SubscriptionTierId, {
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  benefits: string[];
  badge?: string;
  recommended?: boolean;
}> = {
  base: {
    icon: Battery,
    tagline: "Just getting started",
    benefits: [
      "Mint up to ~1,000 $ZSOLAR / month",
      "Cash out anytime",
      "Access to all energy device connections",
      "$5/mo flows to liquidity, $5/mo to treasury",
    ],
    badge: "Soft cap on minting",
  },
  regular: {
    icon: Zap,
    tagline: "The sweet spot",
    benefits: [
      "Uncapped monthly minting",
      "Lower long-term sell pressure → stronger floor",
      "Future: 6-month lock = 1.5× mint multiplier",
      "$10/mo flows to liquidity, $10/mo to treasury",
    ],
    badge: "Most popular",
    recommended: true,
  },
  power: {
    icon: Rocket,
    tagline: "For prosumers & fleets",
    benefits: [
      "Uncapped + priority verification",
      "First access to staking multipliers (up to 2× at 12-mo lock)",
      "Net-positive flywheel from day one",
      "$25/mo flows to liquidity, $25/mo to treasury",
    ],
    badge: "Power-user economics",
  },
};

const TIER_ORDER: SubscriptionTierId[] = ["base", "regular", "power"];

export function TierSelectionScreen({
  selectedTier,
  onSelect,
  ctaLabel = "Choose plan",
}: TierSelectionScreenProps) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="outline" className="mx-auto text-[10px] sm:text-xs px-2 py-1">
          50% to liquidity · 50% to treasury
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
          Pick your $ZSOLAR plan
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
          Each tier subsidizes the protocol. Higher tiers strengthen the floor faster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {TIER_ORDER.map((tierId) => {
          const tier = SUBSCRIPTION_TIERS[tierId];
          const meta = TIER_META[tierId];
          const Icon = meta.icon;
          const isSelected = selectedTier === tierId;

          return (
            <motion.div
              key={tierId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                className={cn(
                  "relative h-full transition-all",
                  meta.recommended && "border-primary/60 shadow-md md:scale-[1.02]",
                  isSelected && "ring-2 ring-primary",
                )}
              >
                {meta.badge && (
                  <Badge
                    className={cn(
                      "absolute -top-2 right-4 text-[10px]",
                      meta.recommended ? "bg-primary text-primary-foreground" : "",
                    )}
                    variant={meta.recommended ? "default" : "secondary"}
                  >
                    {meta.badge}
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">{tier.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">{meta.tagline}</CardDescription>
                  <div className="pt-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight">${tier.monthlyPrice}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  <ul className="space-y-2">
                    {meta.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] sm:text-sm leading-snug">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full min-h-[44px] text-sm font-semibold"
                    variant={meta.recommended ? "default" : "outline"}
                    onClick={() => onSelect?.(tierId)}
                  >
                    {isSelected ? "Selected" : ctaLabel}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[11px] sm:text-xs text-center text-muted-foreground max-w-2xl mx-auto px-2 leading-relaxed">
        $ZSOLAR is minted 1:1 from verified energy production. Mint rate halves at the
        Genesis Halving (250,000 paying subscribers) — pre-announced 3–6 months in advance.
      </p>
    </div>
  );
}

export default TierSelectionScreen;
