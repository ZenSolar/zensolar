/**
 * ShimmerOverlay — meditative dual-layer shimmer.
 *
 * Layer 1 (burst): A dark, subtle shadow wash RIGHT→LEFT. Very slow.
 * Layer 2 (idle):  A softer shimmer LEFT→RIGHT on a steady loop.
 *
 * The burst dies at the left edge. The idle fades in as a handoff —
 * its first sweep arrives from the left immediately after.
 */
import { useState, useEffect } from 'react';

interface ShimmerOverlayProps {
  /** Gradient for the steady idle sweep (left→right) */
  gradient: string;
  /** Darker gradient for the opening shadow wash (right→left) */
  burstGradient?: string;
  /** When the idle layer fades in (ms) */
  burstDuration?: number;
  /** CSS animation-delay for the burst */
  burstDelay?: string;
  /** CSS animation-delay for the idle loop */
  idleDelay?: string;
  /** Extra className */
  className?: string;
}

export function ShimmerOverlay({
  gradient,
  burstGradient,
  burstDuration = 4500,
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
      {/* Shadow wash — dark, RIGHT→LEFT, plays once */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: burstGradient || gradient,
          animation: `zenShimmerBurst 4.5s cubic-bezier(0.25, 0.1, 0.25, 1) ${burstDelay} both`,
          willChange: 'transform',
        }}
      />
      {/* Idle shimmer — LEFT→RIGHT loop, fades in as handoff */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: burstDone ? 0.5 : 0,
          transition: 'opacity 2s ease-in-out',
          animation: `zenHeaderShimmer 6s ease-in-out ${idleDelay} infinite both`,
          willChange: 'transform',
        }}
      />
    </>
  );
}
