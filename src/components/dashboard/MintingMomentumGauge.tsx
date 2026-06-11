import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface MintingMomentumGaugeProps {
  /** Tokens minting per minute (live). When <= 0 the gauge stays hidden. */
  perMinute: number;
  /** Used to scale the dial fill (0..1). Defaults to 2 $ZSOLAR/min = full. */
  max?: number;
  className?: string;
}

/**
 * Compact "Minting Momentum" dial — a pulsing ring that fills relative to the
 * user's live mint rate. Visible only when energy is actively being earned.
 */
export function MintingMomentumGauge({
  perMinute,
  max = 2,
  className = '',
}: MintingMomentumGaugeProps) {
  const [displayed, setDisplayed] = useState(perMinute);
  useEffect(() => {
    const start = displayed;
    const end = perMinute;
    if (Math.abs(start - end) < 0.001) return;
    const startTs = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perMinute]);

  if (perMinute <= 0) return null;

  const pct = Math.max(0.06, Math.min(1, displayed / max));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Minting momentum ${displayed.toFixed(2)} ZSOLAR per minute`}
      className={`inline-flex items-center gap-2.5 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-2.5 py-1.5 backdrop-blur-sm ${className}`}
    >
      <div className="relative h-9 w-9 shrink-0">
        {/* Pulsing halo */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-ping opacity-50"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary-foreground)/0.45), transparent 70%)' }}
        />
        <svg viewBox="0 0 56 56" className="relative h-9 w-9 -rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary-foreground) / 0.2)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)',
              filter: 'drop-shadow(0 0 4px hsl(var(--primary-foreground)/0.5))',
            }}
          />
        </svg>
        <Sparkles
          aria-hidden="true"
          className="absolute inset-0 m-auto h-3.5 w-3.5 text-primary-foreground"
        />
      </div>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">
          Minting Momentum
        </span>
        <span className="text-[13px] font-bold tabular-nums">
          +{displayed.toFixed(2)} <span className="opacity-80 font-semibold">$ZSOLAR/min</span>
        </span>
      </div>
    </div>
  );
}
