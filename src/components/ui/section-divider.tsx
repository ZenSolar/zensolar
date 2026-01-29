import { cn } from '@/lib/utils';

interface SectionDividerProps {
  variant?: 'chevron' | 'angle' | 'wave' | 'diamond';
  flip?: boolean;
  className?: string;
}

export function SectionDivider({ 
  variant = 'chevron', 
  flip = false,
  className 
}: SectionDividerProps) {
  const baseClasses = cn(
    'relative w-full overflow-hidden pointer-events-none select-none',
    flip && 'rotate-180',
    className
  );

  if (variant === 'chevron') {
    return (
      <div className={baseClasses}>
        <svg
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          className="w-full h-8 md:h-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sharp chevron pointing down */}
          <path
            d="M0 0 L600 40 L1200 0 L1200 0 L0 0 Z"
            className="fill-border/30 dark:fill-primary/10"
          />
          <path
            d="M0 0 L600 35 L1200 0"
            className="stroke-border/50 dark:stroke-primary/20"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'angle') {
    return (
      <div className={baseClasses}>
        <svg
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          className="w-full h-6 md:h-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sharp diagonal slice */}
          <path
            d="M0 24 L1200 0 L1200 24 L0 24 Z"
            className="fill-muted/30 dark:fill-primary/5"
          />
          <path
            d="M0 24 L1200 0"
            className="stroke-border/40 dark:stroke-primary/15"
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={baseClasses}>
        <svg
          viewBox="0 0 1200 32"
          preserveAspectRatio="none"
          className="w-full h-6 md:h-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle angular wave */}
          <path
            d="M0 16 L200 8 L400 20 L600 4 L800 24 L1000 10 L1200 16 L1200 32 L0 32 Z"
            className="fill-muted/20 dark:fill-primary/5"
          />
          <path
            d="M0 16 L200 8 L400 20 L600 4 L800 24 L1000 10 L1200 16"
            className="stroke-border/30 dark:stroke-primary/15"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'diamond') {
    return (
      <div className={cn(baseClasses, 'flex items-center justify-center py-6 md:py-8')}>
        <div className="flex items-center gap-4 w-full max-w-4xl mx-auto px-8">
          {/* Left line */}
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-border/60 dark:via-primary/15 dark:to-primary/25" />
          
          {/* Center diamond */}
          <div className="relative">
            <div className="w-3 h-3 rotate-45 border border-border/60 dark:border-primary/30 bg-background" />
            <div className="absolute inset-0 w-3 h-3 rotate-45 bg-gradient-to-br from-primary/10 to-transparent" />
          </div>
          
          {/* Right line */}
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/50 to-border/60 dark:via-primary/15 dark:to-primary/25" />
        </div>
      </div>
    );
  }

  return null;
}
