/**
 * ShimmerOverlay — dual-layer shimmer: a single opening sweep followed
 * by a soft crossfade into the steady idle loop.
 *
 * The burst sweeps left→right once. As its tail exits the right edge,
 * the idle loop's first sweep is already arriving from the left —
 * creating a seamless "soft rebound" without any actual reverse motion.
 */
import { useState, useEffect } from 'react';

interface ShimmerOverlayProps {
  /** The gradient background for the shimmer beam */
  gradient: string;
  /** How long until the idle layer fades in (ms). Should match burst sweep duration. */
  burstDuration?: number;
  /** CSS animation-delay for the burst layer */
  burstDelay?: string;
  /** CSS animation-delay for the idle layer — controls when the "rebound" first sweep arrives */
  idleDelay?: string;
  /** Extra className on the wrapper */
  className?: string;
}

export function ShimmerOverlay({
  gradient,
  burstDuration = 1800,
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
      {/* Burst layer — single sweep left→right, fades itself out via keyframes */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          animation: `zenShimmerBurst 2.4s cubic-bezier(0.4, 0, 0.2, 1) ${burstDelay} both`,
          willChange: 'transform',
        }}
      />
      {/* Idle layer — loops forever, softly fades in as burst exits */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: burstDone ? 0.6 : 0,
          transition: 'opacity 1.2s ease-in-out',
          animation: `zenHeaderShimmer 3.5s ease-in-out ${idleDelay} infinite both`,
          willChange: 'transform',
        }}
      />
    </>
  );
}
