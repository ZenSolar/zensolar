/**
 * ShimmerOverlay — dual-layer shimmer that crossfades from burst → idle.
 * Two independent divs run their own animation from mount. The burst layer
 * fades out while the idle layer fades in, so no CSS `animation` property
 * is ever swapped — eliminating the re-render "false start" glitch.
 */
import { useState, useEffect } from 'react';

interface ShimmerOverlayProps {
  /** The gradient background for the shimmer beam */
  gradient: string;
  /** How long the burst plays before crossfading to idle (ms) */
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
  burstDuration = 2000,
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
      {/* Burst layer — sweeps right then rebounds left, then fades out */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: burstDone ? 0 : 1,
          transition: 'opacity 0.8s ease-out',
          animation: `zenShimmerBurst 2.8s cubic-bezier(0.4, 0, 0.2, 1) ${burstDelay} both`,
          willChange: 'transform',
        }}
      />
      {/* Idle layer — loops forever, fades in after burst */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: burstDone ? 0.6 : 0,
          transition: `opacity ${burstDuration}ms ease-in`,
          animation: `zenHeaderShimmer 3.5s ease-in-out ${idleDelay} infinite both`,
          willChange: 'transform',
        }}
      />
    </>
  );
}
