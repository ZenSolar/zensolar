import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { MintEffectButton } from './MintEffectButton';

interface PrimaryMintActionProps {
  pendingZsolar: number;
  onMint: () => void;
  disabled?: boolean;
  isViewer?: boolean;
}

/**
 * Primary Tap-to-Mint™ hero action.
 *
 * Sits directly under the Zen Monitoring flow diagram and gives the user the
 * single most important affordance on the dashboard: convert today's pending
 * energy into $ZSOLAR. Uses MintEffectButton for haptics + burst FX.
 *
 * 1:1 UX is preserved — we present `pendingZsolar` as the user's share
 * (1 kWh = 1 $ZSOLAR). Backend reconciles on the raw 100% mint.
 */
export function PrimaryMintAction({
  pendingZsolar,
  onMint,
  disabled = false,
  isViewer = false,
}: PrimaryMintActionProps) {
  // Animated count-up for the pending number — feels alive without being noisy.
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
      {/* Soft halo to anchor the eye coming off the live-flow hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl blur-2xl opacity-60"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, hsl(var(--primary)/0.25), transparent 70%)',
        }}
      />

      <MintEffectButton
        onClick={onMint}
        disabled={disabled || !hasPending}
        className="w-full rounded-3xl bg-gradient-to-b from-primary/95 to-primary text-primary-foreground border border-primary/40 shadow-[0_18px_44px_-12px_hsl(var(--primary)/0.55)] hover:shadow-[0_22px_48px_-10px_hsl(var(--primary)/0.7)] transition-shadow"
      >
        <div className="flex flex-col items-center justify-center gap-1 py-5 px-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold opacity-90">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Tap-to-Mint
            <span className="text-[10px] opacity-70">™</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold tabular-nums leading-none">
              {displayed.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-semibold opacity-85">
              $ZSOLAR pending
            </span>
          </div>
          <div className="text-[11px] opacity-80 mt-0.5">
            {hasPending
              ? 'Tap to convert today\u2019s energy into currency'
              : 'No energy pending — your meter is caught up'}
          </div>
        </div>
      </MintEffectButton>
    </div>
  );
}
