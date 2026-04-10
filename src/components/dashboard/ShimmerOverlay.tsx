/**
 * ShimmerOverlay — meditative dual-layer shimmer with complementary colors.
 *
 * Burst: warm tone sweeps RIGHT→LEFT (inhale)
 * Idle:  cool tone sweeps LEFT→RIGHT in a steady loop (exhale)
 *
 * The two layers create a breathing rhythm with complementary color harmony.
 */
import { useState, useEffect } from 'react';

interface ShimmerOverlayProps {
  /** Cool-tone gradient for the steady idle sweep (left→right) */
  gradient: string;
  /** Warm-tone gradient for the opening burst sweep (right→left). Falls back to `gradient` */
  burstGradient?: string;
  /** How long until the idle layer fades in (ms) */
  burstDuration?: number;
  /** CSS animation-delay for the burst layer */
  burstDelay?: string;
  /** CSS animation-delay for the idle layer */
  idleDelay?: string;
  /** Extra className on the wrapper */
  className?: string;
}

export function ShimmerOverlay({
  gradient,
  burstGradient,
  burstDuration = 3200,
  burstDelay = '0s',
  idleDelay = '0s',
  className = '',
}: ShimmerOverlayProps) {
  const [burstDone, setBurstDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBurstDone(true), burstDuration);
    return () => clearTimeout(t);
  }, [burstDuration]);

  return (
    <>
      {/* Burst layer — warm tone, RIGHT→LEFT sweep (inhale) */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: burstGradient || gradient,
          animation: `zenShimmerBurst 3.2s cubic-bezier(0.25, 0.1, 0.25, 1) ${burstDelay} both`,
          willChange: 'transform',
        }}
      />
      {/* Idle layer — cool tone, LEFT→RIGHT loop (exhale), softly fades in */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: burstDone ? 0.6 : 0,
          transition: 'opacity 1.8s ease-in-out',
          animation: `zenHeaderShimmer 4.5s ease-in-out ${idleDelay} infinite both`,
          willChange: 'transform',
        }}
      />
    </>
  );
}
