/**
 * ShimmerOverlay — single-layer steady shimmer sweep (left→right).
 * No burst intro — just the clean idle loop from mount.
 */
import { useState, useEffect } from 'react';

interface ShimmerOverlayProps {
  /** Gradient for the shimmer beam */
  gradient: string;
  /** CSS animation-delay for stagger */
  idleDelay?: string;
  /** Extra className */
  className?: string;
}

export function ShimmerOverlay({
  gradient,
  idleDelay = '0s',
  className = '',
}: ShimmerOverlayProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: gradient,
        opacity: 0.5,
        animation: `zenHeaderShimmer 6s ease-in-out ${idleDelay} infinite both`,
        willChange: 'transform',
      }}
    />
  );
}
