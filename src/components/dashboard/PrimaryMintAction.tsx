import { useEffect, useState } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { MintEffectButton } from './MintEffectButton';
import { MintingMomentumGauge } from './MintingMomentumGauge';

interface PrimaryMintActionProps {
  pendingZsolar: number;
  onMint: () => void;
  disabled?: boolean;
  isViewer?: boolean;
  /** Live minting rate in $ZSOLAR/minute. Gauge only renders when > 0. */
  momentumPerMinute?: number;
}

/**
 * Primary Tap-to-Mint™ hero action.
 *
 * Now the emotional & visual anchor of the dashboard — sits directly under
 * the Clean Energy Center KPI grid and turns today's pending energy into
 * $ZSOLAR with one tap. 1 kWh = 1 $ZSOLAR (UI SSOT — backend reconciles
 * on the raw 100% mint).
 */
export function PrimaryMintAction({
  pendingZsolar,
  onMint,
  disabled = false,
  isViewer = false,
}: PrimaryMintActionProps) {
  const [displayed, setDisplayed] = useState(pendingZsolar);
  useEffect(() => {
    const start = displayed;
    const end = pendingZsolar;
    if (start === end) return;
    const startTs = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingZsolar]);

  if (isViewer) return null;

  const hasPending = pendingZsolar > 0;

  return (
    <div className="relative">
      {/* Outer halo — anchors the hero block and ties it to the Clean Energy Center above */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] blur-3xl opacity-80"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, hsl(var(--primary)/0.32), transparent 70%)',
        }}
      />

      <MintEffectButton
        onClick={onMint}
        disabled={disabled || !hasPending}
        className="w-full rounded-3xl bg-gradient-to-b from-primary/95 to-primary text-primary-foreground border border-primary/50 shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.65)] hover:shadow-[0_24px_56px_-10px_hsl(var(--primary)/0.8)] transition-shadow animate-pulse-glow"
      >
        <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-bold opacity-95">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Proof-of-Genesis
            <span className="text-[9px] opacity-70">™</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-5xl sm:text-6xl font-black tabular-nums leading-none tracking-tight drop-shadow-[0_2px_8px_hsl(var(--primary-foreground)/0.25)]">
              {displayed.toLocaleString()}
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold opacity-95 -mt-0.5">
            $ZSOLAR ready to mint
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-85 mt-1">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {hasPending
              ? 'Tap to convert today\u2019s energy into currency'
              : 'No energy pending — your meter is caught up'}
          </div>
        </div>
      </MintEffectButton>
    </div>
  );
}
