import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerLightTap } from '@/hooks/useHaptics';
import { SecuritySheet } from './SecuritySheet';

interface SecurityBadgeProps {
  variant?: 'pill' | 'inline' | 'card';
  label?: string;
  className?: string;
}

/**
 * Reusable "Secured" badge. Tapping it opens the SecuritySheet so the
 * user can read exactly how their wallet + data are protected.
 *
 *  - `pill`   → compact rounded chip (default)
 *  - `inline` → minimal text + icon, for tight footers
 *  - `card`   → full-width row, for dashboards & settings
 */
export function SecurityBadge({
  variant = 'pill',
  label,
  className,
}: SecurityBadgeProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = async () => {
    await triggerLightTap();
    setOpen(true);
  };

  const content = (() => {
    switch (variant) {
      case 'inline':
        return (
          <button
            type="button"
            onClick={handleOpen}
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80 hover:text-foreground transition-colors',
              className,
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="underline-offset-4 hover:underline">
              {label ?? 'How we protect you'}
            </span>
          </button>
        );
      case 'card':
        return (
          <button
            type="button"
            onClick={handleOpen}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors px-3.5 py-3 text-left',
              className,
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight">
                {label ?? 'Secured by Face ID + AES-256'}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Tap to see how your wallet & data are protected
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary tracking-wider">
              VIEW
            </span>
          </button>
        );
      case 'pill':
      default:
        return (
          <button
            type="button"
            onClick={handleOpen}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 text-[10.5px] font-semibold text-primary transition-colors',
              className,
            )}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="tracking-wide uppercase">
              {label ?? 'Secured'}
            </span>
          </button>
        );
    }
  })();

  return (
    <>
      {content}
      <SecuritySheet open={open} onOpenChange={setOpen} />
    </>
  );
}
