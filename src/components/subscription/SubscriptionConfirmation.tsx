import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles, Coins, Droplets, Vault, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from "@/lib/tokenomics";
import { useEffect } from "react";
import { triggerSuccess } from "@/hooks/useHaptics";
import { useNavigate } from "react-router-dom";

interface Props {
  tier: SubscriptionTierId;
  onChange: () => void;
}

const TIER_LABELS: Record<SubscriptionTierId, string> = {
  base: "Base",
  regular: "Regular",
  power: "Power",
};

export function SubscriptionConfirmation({ tier, onChange }: Props) {
  const navigate = useNavigate();
  const t = SUBSCRIPTION_TIERS[tier];

  useEffect(() => {
    triggerSuccess().catch(() => {});
  }, []);

  return (
    <div className="container mx-auto max-w-xl px-4 py-6 sm:py-10 space-y-5">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="text-center"
      >
        <div className="relative mx-auto mb-4 h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <Badge variant="outline" className="mx-auto mb-2 text-[10px] px-2 py-0.5 border-primary/40 text-primary">
          Plan activated
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          You're on the {TIER_LABELS[tier]} plan
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
          {t.description}
        </p>
      </motion.div>

      {/* Billing summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 22 }}
      >
        <Card className="border-primary/15 shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly</p>
                <p className="text-3xl font-bold tabular-nums">${t.monthlyPrice.toFixed(2)}</p>
              </div>
              <Badge variant="secondary" className="text-[11px]">USD · billed monthly</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-secondary" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Liquidity</p>
                </div>
                <p className="text-base font-semibold tabular-nums">${t.lpPerMonth.toFixed(2)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Vault className="h-3.5 w-3.5 text-accent-warm" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Treasury</p>
                </div>
                <p className="text-base font-semibold tabular-nums">${t.treasuryPerMonth.toFixed(2)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Every dollar splits 50/50 — half deepens the LP, half funds growth.</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 220, damping: 22 }}
      >
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Next steps</p>
            {[
              { icon: Coins, title: "Connect a device", desc: "Link your solar, battery, or EV to start logging energy." },
              { icon: Sparkles, title: "Mint your first $ZSOLAR", desc: "Tap-to-Mint™ on the dashboard turns kWh into tokens." },
              { icon: CalendarClock, title: "Watch your impact grow", desc: "Track LP & treasury contributions in real time." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex items-start gap-3 p-2 rounded-lg"
              >
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="flex flex-col gap-2"
      >
        <Button size="lg" className="w-full h-12 gap-2" onClick={() => navigate('/dashboard')}>
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onChange} className="text-muted-foreground">
          Change plan
        </Button>
      </motion.div>
    </div>
  );
}

export default SubscriptionConfirmation;
