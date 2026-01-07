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
    <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm border border-border">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', colorClass)}>
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
