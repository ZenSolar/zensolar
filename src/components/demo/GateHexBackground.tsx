import { useEffect, useRef } from 'react';

/**
 * A faster, brighter variant of DashboardHexBackground
 * designed for the access gate — frenetic, alive, teasing energy.
 */
interface GateHexBackgroundProps {
  activated?: boolean;
}

export function GateHexBackground({ activated = false }: GateHexBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activationStartRef = useRef<number | null>(activated ? performance.now() : null);
  const activatedRef = useRef(activated);

  useEffect(() => {
    if (activated && !activatedRef.current) activationStartRef.current = performance.now();
    if (!activated) activationStartRef.current = null;
    activatedRef.current = activated;
  }, [activated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let lastFrameTime = 0;
    let resizeObserver: ResizeObserver | null = null;

    const hexSize = 30;
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;

    const hexPath = new Path2D();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = hexSize * Math.cos(angle);
      const y = hexSize * Math.sin(angle);
      if (i === 0) hexPath.moveTo(x, y);
      else hexPath.lineTo(x, y);
    }
    hexPath.closePath();

    let dpr = 1;
    let w = 0;
    let h = 0;

    const isMobile = window.innerWidth < 768;
    const TARGET_FPS = isMobile ? 28 : 45;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    const viewport = window.visualViewport;

    const resize = () => {
      const bounds = (canvas.parentElement ?? canvas).getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.ceil(bounds.width || viewport?.width || window.innerWidth));
      h = Math.max(1, Math.ceil(bounds.height || viewport?.height || window.innerHeight));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas.parentElement ?? canvas);
    }

    const TAU = Math.PI * 2;

    const animate = (now: number) => {
      if (lastFrameTime && (now - lastFrameTime) < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 2) : 1;
      lastFrameTime = now;

      time += 0.018 * dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const startRow = -1;
      const endRow = Math.ceil(h / hexHeight) + 3;
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;

      const driftA = time * 520;
      const driftB = time * 400;
      const driftC = time * 300;

      const actStart = activationStartRef.current;
      const actElapsed = activatedRef.current && actStart !== null ? Math.max(0, (now - actStart) / 1000) : null;
      const CURTAIN_DURATION = 8.0;
      const CURTAIN_SWEEP = 6.5;
      const curtainActive = actElapsed !== null && actElapsed < CURTAIN_DURATION;
      const curtainFade = curtainActive
        ? (actElapsed! < 6.0 ? 1 : Math.max(0, 1 - (actElapsed! - 6.0) / 2.0))
        : 0;

      // Disable shadow globally — use alpha-based brightness instead (much cheaper)
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Batch hex draws: collect orange & green hexes, draw in two passes to minimise state changes
      const orangeHexes: { cx: number; cy: number; alpha: number }[] = [];
      const greenHexes: { cx: number; cy: number; alpha: number }[] = [];

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * hexWidth * 0.75;
          const cy = row * hexHeight + (col % 2 === 1 ? hexHeight * 0.5 : 0);

          if (cy < -hexSize || cy > h + hexSize) continue;

          let edgeAlpha = 0;
          let greenAlpha = 0;

          if (curtainActive && actElapsed !== null) {
            const curtainY = -hexHeight * 2 + (Math.min(actElapsed / CURTAIN_SWEEP, 1)) * (h + hexHeight * 4);
            const distBehind = curtainY - cy;

            const edgeWidth = hexHeight * 5;
            const edgeDist = Math.abs(cy - curtainY);
            if (edgeDist < edgeWidth) {
              edgeAlpha = Math.pow(1 - edgeDist / edgeWidth, 1.2) * 1.0 * curtainFade;
            }

            if (distBehind > 0) {
              const dA = cx + cy * 0.55;
              const dB = cx * 0.78 + cy * 0.82;
              const dC = cx * 1.08 - cy * 0.28;

              const phA = ((dA - driftA) / 480) * TAU;
              const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 4);
              const phB = ((dB + driftB) / 600) * TAU;
              const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 5);
              const phC = ((dC - driftC) / 700) * TAU;
              const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 3);
              const shimmer = (Math.sin(dA * 0.015 - time * 5) + 1) * 0.5;
              const flicker = (Math.sin(dB * 0.02 + time * 8) + 1) * 0.5;

              let alpha = 0.12 + bA * 0.22 + bB * 0.16 + bC * 0.13 + shimmer * 0.06 + flicker * 0.03;

              const greenWaveLength = h * 0.5;
              if (distBehind < greenWaveLength) {
                const t = 1 - distBehind / greenWaveLength;
                alpha += Math.pow(t, 1.5) * 0.45 * curtainFade;
              }

              const revealRamp = Math.min(distBehind / (hexHeight * 4), 1);
              alpha *= revealRamp;

              greenAlpha = Math.min(alpha, curtainActive ? 0.85 : 0.55);
            }
          } else if (actElapsed !== null && actElapsed >= CURTAIN_DURATION) {
            const dA = cx + cy * 0.55;
            const dB = cx * 0.78 + cy * 0.82;
            const dC = cx * 1.08 - cy * 0.28;

            const phA = ((dA - driftA) / 480) * TAU;
            const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 4);
            const phB = ((dB + driftB) / 600) * TAU;
            const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 5);
            const phC = ((dC - driftC) / 700) * TAU;
            const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 3);
            const shimmer = (Math.sin(dA * 0.015 - time * 5) + 1) * 0.5;
            const flicker = (Math.sin(dB * 0.02 + time * 8) + 1) * 0.5;

            greenAlpha = Math.min(0.12 + bA * 0.22 + bB * 0.16 + bC * 0.13 + shimmer * 0.06 + flicker * 0.03, 0.55);
          }

          if (edgeAlpha > 0.05) {
            orangeHexes.push({ cx, cy, alpha: Math.min(edgeAlpha, 1.0) });
          } else if (greenAlpha > 0.06) {
            greenHexes.push({ cx, cy, alpha: greenAlpha });
          }
        }
      }

      // Draw orange hexes in one batch
      if (orangeHexes.length > 0) {
        ctx.lineWidth = 1.0;
        let lastAlpha = -1;
        for (const hex of orangeHexes) {
          const roundedAlpha = ((hex.alpha * 50 + 0.5) | 0) / 50;
          if (roundedAlpha !== lastAlpha) {
            ctx.strokeStyle = `hsla(36,92%,55%,${roundedAlpha.toFixed(2)})`;
            lastAlpha = roundedAlpha;
          }
          ctx.setTransform(dpr, 0, 0, dpr, hex.cx * dpr, hex.cy * dpr);
          ctx.stroke(hexPath);
        }
      }

      // Draw green hexes in one batch
      if (greenHexes.length > 0) {
        ctx.lineWidth = 0.6;
        let lastAlpha = -1;
        for (const hex of greenHexes) {
          const roundedAlpha = ((hex.alpha * 50 + 0.5) | 0) / 50;
          if (roundedAlpha !== lastAlpha) {
            ctx.strokeStyle = `hsla(160,84%,42%,${roundedAlpha.toFixed(2)})`;
            lastAlpha = roundedAlpha;
          }
          ctx.setTransform(dpr, 0, 0, dpr, hex.cx * dpr, hex.cy * dpr);
          ctx.stroke(hexPath);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
