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
        canonical="https://beta.zen.solar/subscribe"
      />
      <TierSelectionScreen
        selectedTier={tier}
        onSelect={(t) => {
          setTier(t);
          toast({
            title: `${t.charAt(0).toUpperCase() + t.slice(1)} plan selected`,
            description: "Checkout coming soon — billing is being wired up.",
          });
        }}
      />
    </>
  );
}
