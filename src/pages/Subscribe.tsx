import { useState } from "react";
import { TierSelectionScreen } from "@/components/subscription/TierSelectionScreen";
import { SubscriptionConfirmation } from "@/components/subscription/SubscriptionConfirmation";
import { SEO } from "@/components/SEO";
import type { SubscriptionTierId } from "@/lib/tokenomics";
import { toast } from "@/hooks/use-toast";
import { resetFlywheelAnchor } from "@/lib/flywheelLedger";
import { AnimatePresence, motion } from "framer-motion";

export default function Subscribe() {
  const [tier, setTier] = useState<SubscriptionTierId>();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <SEO
        title="Choose your $ZSOLAR plan — Base, Regular, Power"
        description="Pick a $ZSOLAR subscription tier. Every dollar splits 50% to liquidity and 50% to treasury."
        url="https://beta.zen.solar/subscribe"
      />
      <AnimatePresence mode="wait">
        {confirmed && tier ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <SubscriptionConfirmation tier={tier} onChange={() => setConfirmed(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TierSelectionScreen
              selectedTier={tier}
              onSelect={(t) => {
                setTier(t);
                try {
                  const prev = localStorage.getItem('zensolar_mock_subscription_tier');
                  localStorage.setItem('zensolar_mock_subscription_tier', t);
                  if (prev !== t) resetFlywheelAnchor();
                } catch {
                  // ignore storage failures
                }
                toast({
                  title: `${t.charAt(0).toUpperCase() + t.slice(1)} plan selected`,
                  description: "Activated locally — billing wiring coming soon.",
                });
                setConfirmed(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
