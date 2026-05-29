import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';

/**
 * Inline Premium Energy Insights upsell strip.
 * Designed to sit *inside* the ZenEnergy Monitoring card as a footer row,
 * so users discover the $4.99/mo AI layer in the same place they read
 * their live device numbers. No standalone dashboard card anymore.
 */
export function PremiumInsightsTeaserCard() {
  const { subscription, loading } = useEnergyInsightsSubscription();
  const subscribed = !!subscription?.active;

  return (
    <div className="flex flex-col gap-3 border-t border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/20 p-1.5 ring-1 ring-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Premium Energy Insights</span>
            {!subscribed && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                $4.99/mo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subscribed
              ? 'Your daily AI story from this live data.'
              : 'Turn these live numbers into a daily AI story — battery + EV charger optimized.'}
          </p>
        </div>
      </div>
      <Button
        asChild
        disabled={loading}
        size="sm"
        variant={subscribed ? 'outline' : 'default'}
        className={subscribed ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
      >
        <Link to="/energy-insights">
          {subscribed ? 'Open Insights' : 'Unlock'}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
