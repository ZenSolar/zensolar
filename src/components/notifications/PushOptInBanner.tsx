import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "push_optin_dismissed";

export function PushOptInBanner() {
  const { isSupported, isSubscribed, isLoading, subscribe, isIOSDevice, isPWAInstalled } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    // Show banner if not dismissed, supported, and not already subscribed
    if (!wasDismissed && isSupported && !isSubscribed && !isLoading) {
      setDismissed(false);
    }
  }, [isSupported, isSubscribed, isLoading]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setDismissed(true);
      localStorage.setItem(DISMISSED_KEY, "true");
    }
  };

  // On iOS, if not installed as PWA, don't show banner
  if (isIOSDevice && !isPWAInstalled) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-4 mt-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Enable Push Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified about energy milestones, rewards, and updates.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleEnable} disabled={isLoading} className="h-8 text-xs">
                    {isLoading ? "Enabling..." : "Enable"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs text-muted-foreground">
                    Not now
                  </Button>
                </div>
              </div>
              <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
