import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type MetricTone = 'primary' | 'solar' | 'energy' | 'secondary' | 'accent' | 'eco' | 'token';

const toneStyles: Record<MetricTone, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary', icon: 'text-primary-foreground' },
  solar: { bg: 'bg-solar', icon: 'text-solar-foreground' },
  energy: { bg: 'bg-energy', icon: 'text-energy-foreground' },
  secondary: { bg: 'bg-secondary', icon: 'text-secondary-foreground' },
  accent: { bg: 'bg-accent', icon: 'text-accent-foreground' },
  eco: { bg: 'bg-eco', icon: 'text-eco-foreground' },
  token: { bg: 'bg-token', icon: 'text-token-foreground' },
};

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  tone?: MetricTone;
  className?: string;
}

export function MetricCard({ icon: Icon, label, value, unit, tone = 'primary', className }: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-card/80 p-3 border border-border/60 hover:border-border transition-colors', className)}>
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', styles.bg)}>
        <Icon className={cn('h-5 w-5', styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight tabular-nums">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
          {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
