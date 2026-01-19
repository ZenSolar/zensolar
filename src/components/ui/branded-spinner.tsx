import { cn } from '@/lib/utils';

interface BrandedSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function BrandedSpinner({ size = 'md', className, label }: BrandedSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={cn(
            'rounded-full border-primary/20 animate-spin',
            sizeClasses[size],
            borderSizes[size],
            'border-t-primary'
          )}
          style={{ animationDuration: '1s' }}
        />
        {/* Inner pulsing dot */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center'
          )}
        >
          <div
            className={cn(
              'rounded-full bg-primary animate-pulse',
              size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
            )}
          />
        </div>
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}
