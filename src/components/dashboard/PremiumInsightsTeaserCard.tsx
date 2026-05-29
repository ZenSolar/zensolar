import { Link } from 'react-router-dom';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';

/**
 * Dashboard teaser card promoting Premium Energy Insights.
 * Subscribed users see a "view latest report" CTA, others see the $4.99/mo
 * unlock prompt. Cheap to render (no telemetry fetches here).
 */
export function PremiumInsightsTeaserCard() {
  const { subscription, loading } = useEnergyInsightsSubscription();
  const subscribed = !!subscription?.active;

  return (
    <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-background to-background p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/20 p-2 ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Premium Energy Insights</h3>
              {!subscribed && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  $4.99/mo
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscribed
                ? 'Your live battery + EV charger story, refreshed daily.'
                : 'AI-powered reports from your battery & EV charger telemetry — your daily energy story in plain English.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span>Tesla · Enphase · SolarEdge · Wallbox</span>
        </div>

        <Button
          asChild
          disabled={loading}
          className="group w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link to="/energy-insights">
            {subscribed ? 'Open Insights' : 'Unlock Premium Insights'}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
