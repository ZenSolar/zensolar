import { useEffect, useRef } from 'react';

/**
 * A faster, brighter variant of DashboardHexBackground
 * designed for the access gate — frenetic, alive, teasing energy.
 */
export function GateHexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let lastFrameTime = 0;

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

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const TAU = Math.PI * 2;

    const animate = (now: number) => {
      if (lastFrameTime && (now - lastFrameTime) < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 2) : 1;
      lastFrameTime = now;

      // 2.5x faster time progression for frenetic energy
      time += 0.022 * dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const startRow = -1;
      const endRow = Math.ceil(h / hexHeight) + 3;
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;

      // Faster drift speeds for urgency
      const driftA = time * 520;
      const driftB = time * 400;
      const driftC = time * 300;

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      let lastAlphaStr = '';
      let lastGlow = false;

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * hexWidth * 0.75;
          const cy = row * hexHeight + (col % 2 === 1 ? hexHeight * 0.5 : 0);

          if (cy < -hexSize || cy > h + hexSize) continue;

          // Higher base alpha for brighter feel
          let alpha = 0.12;

          const dA = cx + cy * 0.55;
          const dB = cx * 0.78 + cy * 0.82;
          const dC = cx * 1.08 - cy * 0.28;

          const phA = ((dA - driftA) / 480) * TAU;
          const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 4);

          const phB = ((dB + driftB) / 600) * TAU;
          const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 5);

          const phC = ((dC - driftC) / 700) * TAU;
          const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 3);

          // Faster, more pronounced shimmer with a secondary flicker
          const shimmer = (Math.sin(dA * 0.015 - time * 5) + 1) * 0.5;
          const flicker = (Math.sin(dB * 0.02 + time * 8) + 1) * 0.5;

          // Stronger contribution from waves + shimmer + flicker
          alpha += bA * 0.22 + bB * 0.16 + bC * 0.13 + shimmer * 0.06 + flicker * 0.03;
          alpha = Math.min(alpha, 0.55);

          if (alpha < 0.06) continue;

          const roundedAlpha = ((alpha * 50 + 0.5) | 0) / 50;
          const alphaStr = roundedAlpha.toFixed(2);

          if (alphaStr !== lastAlphaStr) {
            ctx.strokeStyle = `hsla(160,84%,42%,${alphaStr})`;
            lastAlphaStr = alphaStr;
          }

          // Lower glow threshold so more hexes shimmer
          const needsGlow = alpha > 0.28;
          if (needsGlow !== lastGlow) {
            if (needsGlow) {
              ctx.lineWidth = 0.8;
              ctx.shadowColor = 'hsla(160,84%,55%,0.18)';
              ctx.shadowBlur = 8;
            } else {
              ctx.lineWidth = 0.5;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            lastGlow = needsGlow;
          }

          ctx.setTransform(dpr, 0, 0, dpr, cx * dpr, cy * dpr);
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
