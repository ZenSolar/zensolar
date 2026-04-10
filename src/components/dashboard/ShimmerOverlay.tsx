/**
 * ShimmerOverlay — cascading shimmer with synchronized card glow.
 *
 * The shimmer beam sweeps left→right with a brightness trail.
 * A synchronized inner glow pulses as the shimmer passes,
 * making the card feel like it's briefly charging with energy.
 */

interface ShimmerOverlayProps {
  /** Gradient for the shimmer beam */
  gradient: string;
  /** CSS animation-delay for cascade stagger */
  idleDelay?: string;
  /** Glow color (CSS color value) for the card pulse */
  glowColor?: string;
  /** Animation duration — cards further down can be slightly slower */
  duration?: string;
  /** Extra className */
  className?: string;
}

export function ShimmerOverlay({
  gradient,
  idleDelay = '0s',
  glowColor,
  duration = '5s',
  className = '',
}: ShimmerOverlayProps) {
  return (
    <>
      {/* Shimmer beam */}
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          background: gradient,
          opacity: 0.5,
          animation: `zenHeaderShimmer ${duration} ease-in-out ${idleDelay} infinite both`,
          willChange: 'transform',
        }}
      />
      {/* Synchronized card glow — pulses in time with the shimmer */}
      {glowColor && (
        <div
          className={`absolute inset-0 pointer-events-none rounded-[inherit] ${className}`}
          style={{
            '--shimmer-glow': glowColor,
            animation: `zenCardGlow ${duration} ease-in-out ${idleDelay} infinite both`,
          } as React.CSSProperties}
        />
      )}
    </>
  );
}
