import { Check, Zap, Battery, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from "@/lib/tokenomics";
import { cn } from "@/lib/utils";
import { Tokenomics101Card } from "@/components/tokenomics/Tokenomics101Card";

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
      "Earn up to ~1,000 $ZSOLAR per month",
      "Cash out anytime",
      "Connect any solar, battery, or EV device",
    ],
    badge: "Starter",
  },
  regular: {
    icon: Zap,
    tagline: "The sweet spot",
    benefits: [
      "Earn unlimited $ZSOLAR every month",
      "Bigger rewards if you lock longer",
      "Helps strengthen the token price faster",
    ],
    badge: "Most popular",
    recommended: true,
  },
  power: {
    icon: Rocket,
    tagline: "For prosumers & fleets",
    benefits: [
      "Unlimited earning + priority processing",
      "First access to bonus staking rewards (up to 2× at 12-mo lock)",
      "Maximum impact on token strength",
    ],
    badge: "Power user",
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
          Half of every dollar strengthens the token
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
          Pick your $ZSOLAR plan
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
          Choose the tier that fits your system. You can upgrade anytime.
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

      <Tokenomics101Card />
    </div>
  );
}

export default TierSelectionScreen;
