import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  colorClass?: string;
}

export function MetricCard({ icon: Icon, label, value, unit, colorClass = 'bg-primary' }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/80 p-3 border border-border/60 hover:border-border transition-colors">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', colorClass)}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
          {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
