import { useState } from "react";
import { TierSelectionScreen } from "@/components/subscription/TierSelectionScreen";
import { SEO } from "@/components/SEO";
import type { SubscriptionTierId } from "@/lib/tokenomics";
import { toast } from "@/hooks/use-toast";

export default function Subscribe() {
  const [tier, setTier] = useState<SubscriptionTierId>();

  return (
    <>
      <SEO
        title="Choose your $ZSOLAR plan — Base, Regular, Power"
        description="Pick a $ZSOLAR subscription tier. Every dollar splits 50% to liquidity and 50% to treasury."
        url="https://beta.zen.solar/subscribe"
      />
      <TierSelectionScreen
        selectedTier={tier}
        onSelect={(t) => {
          setTier(t);
          try {
            localStorage.setItem('zensolar_mock_subscription_tier', t);
          } catch {
            // ignore storage failures
          }
          toast({
            title: `${t.charAt(0).toUpperCase() + t.slice(1)} plan selected`,
            description: "Activated locally — billing wiring coming soon.",
          });
        }}
      />
    </>
  );
}
