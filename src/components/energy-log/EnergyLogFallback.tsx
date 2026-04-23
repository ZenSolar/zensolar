import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export type ProviderStatus = {
  provider: 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
  label: string;
  /** ISO string of last successful sync, or null if never. */
  lastUpdatedAt: string | null;
  /** True if the most recent sync failed. */
  hasError: boolean;
  errorMessage?: string;
};

interface EnergyLogFallbackProps {
  statuses: ProviderStatus[];
  onRetry: (provider: ProviderStatus['provider']) => Promise<void> | void;
  /** True if no provider has ever returned data. */
  isEmpty?: boolean;
  className?: string;
}

const PROVIDER_COLORS: Record<ProviderStatus['provider'], string> = {
  tesla: 'border-l-red-500',
  enphase: 'border-l-orange-500',
  solaredge: 'border-l-yellow-500',
  wallbox: 'border-l-blue-500',
};

/**
 * Per-provider fallback panel for the Energy Log page.
 * - Surfaces last-updated timestamp for every connected provider
 * - Shows a retry button when any provider is failing
 * - Renders an empty-state hint when no data has ever synced
 */
export function EnergyLogFallback({ statuses, onRetry, isEmpty, className }: EnergyLogFallbackProps) {
  const [retryingProvider, setRetryingProvider] = useState<string | null>(null);

  if (statuses.length === 0) return null;

  const handleRetry = async (provider: ProviderStatus['provider']) => {
    setRetryingProvider(provider);
    try {
      await onRetry(provider);
    } finally {
      setRetryingProvider(null);
    }
  };

  const anyError = statuses.some((s) => s.hasError);

  return (
    <Card
      className={cn(
        'border-l-2',
        anyError ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-card',
        className,
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {anyError ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {isEmpty
              ? 'Waiting for first sync'
              : anyError
              ? 'Some sources need attention'
              : 'All sources up to date'}
          </h3>
        </div>

        {isEmpty && (
          <p className="text-xs text-muted-foreground">
            We capture your energy data every day. Once your first sync completes it will appear here automatically.
          </p>
        )}

        <ul className="space-y-2">
          {statuses.map((s) => {
            const lastLabel = s.lastUpdatedAt
              ? `Updated ${formatDistanceToNow(new Date(s.lastUpdatedAt), { addSuffix: true })}`
              : 'No data yet';
            const isRetrying = retryingProvider === s.provider;
            return (
              <li
                key={s.provider}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border-l-2 bg-card/60 px-3 py-2',
                  PROVIDER_COLORS[s.provider],
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lastLabel}
                  </p>
                  {s.hasError && s.errorMessage && (
                    <p className="text-[11px] text-destructive mt-0.5 line-clamp-2">{s.errorMessage}</p>
                  )}
                </div>
                <Button
                  variant={s.hasError ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleRetry(s.provider)}
                  disabled={isRetrying}
                  className="shrink-0 h-8"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1.5', isRetrying && 'animate-spin')} />
                  {isRetrying ? 'Syncing…' : 'Retry'}
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
