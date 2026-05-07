import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useBasePath } from '@/hooks/useBasePath';

interface HowItWorksCTAProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Custom label (defaults to "Learn how ZenSolar works") */
  label?: ReactNode;
  /** Layout: 'between' for full-width arrow on right, 'inline' for tight pill */
  layout?: 'between' | 'inline';
  /** Optional extra path suffix (e.g. '#tiers'). */
  hash?: string;
}

/**
 * Single source of truth for any "Learn how ZenSolar works → /how-it-works" CTA.
 *
 * - Resolves the correct path (`/demo/how-it-works` vs `/how-it-works`)
 *   via useBasePath() so it works in both regular and demo contexts.
 * - Shows a brief inline spinner during navigation so the user gets
 *   immediate feedback while the lazy-loaded HowItWorks chunk resolves.
 */
export function HowItWorksCTA({
  label = 'Learn how ZenSolar works',
  layout = 'between',
  hash,
  className = '',
  variant = 'outline',
  ...buttonProps
}: HowItWorksCTAProps) {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const [navigating, setNavigating] = useState(false);

  const handleClick = () => {
    if (navigating) return;
    setNavigating(true);
    // Defer slightly so the spinner has time to paint, then navigate.
    requestAnimationFrame(() => {
      navigate(`${basePath}/how-it-works${hash ?? ''}`);
    });
  };

  const TrailingIcon = navigating ? Loader2 : ArrowRight;

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={navigating}
      aria-busy={navigating}
      aria-label={typeof label === 'string' ? label : 'Learn how ZenSolar works'}
      className={`group ${layout === 'between' ? 'w-full justify-between' : ''} ${className}`}
      {...buttonProps}
    >
      <span>{navigating ? 'Loading…' : label}</span>
      <TrailingIcon
        className={`h-4 w-4 ${
          navigating
            ? 'animate-spin'
            : 'group-hover:translate-x-0.5 transition-transform'
        }`}
        aria-hidden
      />
    </Button>
  );
}

export default HowItWorksCTA;
