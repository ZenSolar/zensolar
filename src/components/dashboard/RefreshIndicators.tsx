import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react';

export type ProviderKey = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

export type ProviderRefreshState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  updatedAt?: string;
  cached?: boolean;
  stale?: boolean;
  rateLimited?: boolean;
  error?: string;
};

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProviderPill({
  label,
  state,
}: {
  label: string;
  state?: ProviderRefreshState;
}) {
  const status = state?.status ?? 'idle';

  if (status === 'idle') {
    return (
      <Badge variant="secondary" className="text-[10px] font-medium">
        <Clock className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    );
  }

  if (status === 'loading') {
    return (
      <Badge variant="secondary" className="text-[10px] font-medium">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        {label}
      </Badge>
    );
  }

  const isWarn = Boolean(state?.rateLimited || state?.stale);
  const Icon = isWarn ? AlertTriangle : CheckCircle2;
  const time = formatTime(state?.updatedAt);
  const suffixParts: string[] = [];
  if (state?.cached) suffixParts.push('cached');
  if (state?.rateLimited) suffixParts.push('rate-limited');
  if (state?.stale) suffixParts.push('stale');
  const suffix = suffixParts.length ? ` • ${suffixParts.join(' • ')}` : '';

  return (
    <Badge variant={isWarn ? 'outline' : 'secondary'} className="text-[10px] font-medium">
      <Icon className="mr-1 h-3 w-3" />
      {label}
      {time ? ` ${time}` : ''}
      {suffix}
    </Badge>
  );
}

export function RefreshIndicators({
  lastUpdatedAt,
  providers,
}: {
  lastUpdatedAt?: string | null;
  providers?: Partial<Record<ProviderKey, ProviderRefreshState>>;
}) {
  const time = formatTime(lastUpdatedAt ?? undefined);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">
        Last updated{time ? ` ${time}` : ''}
      </span>
      <ProviderPill label="Tesla" state={providers?.tesla} />
      <ProviderPill label="Enphase" state={providers?.enphase} />
      <ProviderPill label="SolarEdge" state={providers?.solaredge} />
      <ProviderPill label="Wallbox" state={providers?.wallbox} />
    </div>
  );
}
