import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  label: string;
}

export function AnimatedCounter({ end, suffix = '', prefix = '', decimals = 0, duration = 2000, label }: AnimatedCounterProps) {
  const { ref, value } = useCountUp({ end, duration, decimals });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="flex flex-col items-center gap-1">
      <span className="text-2xl md:text-3xl font-black text-primary tabular-nums">
        {prefix}{Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
