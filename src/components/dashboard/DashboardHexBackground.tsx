import { useEffect, useRef } from 'react';

export function DashboardHexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let currentScrollY = window.scrollY;
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
    const TARGET_FPS = isMobile ? 24 : 40;
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
      // Throttle framerate for battery savings
      if (lastFrameTime && (now - lastFrameTime) < FRAME_INTERVAL) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 2) : 1;
      lastFrameTime = now;

      time += 0.005 * dt;
      currentScrollY = window.scrollY;

      // Re-check theme every frame for live switching
      const isDark = document.documentElement.classList.contains('dark');
      const alphaMultiplier = isDark ? 1 : 0.7;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Soft radial wash in light mode — very subtle depth cue
      if (!isDark) {
        const grad = ctx.createRadialGradient(w * 0.3, h * 0.12, 0, w * 0.5, h * 0.4, w * 0.8);
        grad.addColorStop(0, 'hsla(165, 50%, 55%, 0.025)');
        grad.addColorStop(0.4, 'hsla(200, 40%, 58%, 0.015)');
        grad.addColorStop(0.7, 'hsla(220, 35%, 55%, 0.008)');
        grad.addColorStop(1, 'hsla(220, 30%, 50%, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      const startRow = Math.floor(currentScrollY / hexHeight) - 1;
      const endRow = startRow + Math.ceil(h / hexHeight) + 3;
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;

      const driftA = time * 200;
      const driftB = time * 150;
      const driftC = time * 110;

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      let lastAlphaStr = '';
      let lastGlow = false;

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * hexWidth * 0.75;
          const cyPage = row * hexHeight + (col % 2 === 1 ? hexHeight * 0.5 : 0);
          const cyScreen = cyPage - currentScrollY;

          if (cyScreen < -hexSize || cyScreen > h + hexSize) continue;

          let alpha = isDark ? 0.06 : 0.04;

          const dA = cx + cyPage * 0.55;
          const dB = cx * 0.78 + cyPage * 0.82;
          const dC = cx * 1.08 - cyPage * 0.28;

          const phA = ((dA - driftA) / 580) * TAU;
          const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 5);

          const phB = ((dB + driftB) / 720) * TAU;
          const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 6);

          const phC = ((dC - driftC) / 860) * TAU;
          const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 4);

          const shimmer = (Math.sin(dA * 0.01 - time * 2.5) + 1) * 0.5;
          const shimmer2 = (Math.sin(dB * 0.014 + time * 3.2) + 1) * 0.5;
          const shimmer3 = (Math.sin(dC * 0.008 - time * 2.0) + 1) * 0.5;
          const sparkle = Math.pow((Math.sin(dA * 0.02 + dB * 0.012 - time * 4) + 1) * 0.5, 8);
          const sparkle2 = Math.pow((Math.sin(dB * 0.016 - dC * 0.01 + time * 5) + 1) * 0.5, 9);

          if (isDark) {
            alpha += bA * 0.12 + bB * 0.1 + bC * 0.08 + shimmer * 0.05 + shimmer2 * 0.045 + shimmer3 * 0.03 + sparkle * 0.28 + sparkle2 * 0.22;
          } else {
            // Light mode: gentler wave amplitudes for a refined, airy feel
            alpha += bA * 0.08 + bB * 0.06 + bC * 0.05 + shimmer * 0.03 + shimmer2 * 0.025 + shimmer3 * 0.02 + sparkle * 0.14 + sparkle2 * 0.10;
          }
          alpha = Math.min(alpha * alphaMultiplier, isDark ? 0.42 : 0.32);

          if (alpha < 0.04) continue;

          const roundedAlpha = ((alpha * 50 + 0.5) | 0) / 50;
          const alphaStr = roundedAlpha.toFixed(2);

          if (!isDark) {
            const colorMix = (shimmer * 0.4 + shimmer2 * 0.35 + sparkle * 0.25);
            // Soft teal → slate blue with occasional emerald highlights
            const hue = 200 - colorMix * 40;          // 200 (sky blue) → 160 (teal)
            const sat = 35 + colorMix * 30;            // 35–65% — muted not neon
            const lgt = 55 + colorMix * 8;             // 55–63% — lighter strokes
            const h = hue | 0;
            const s = sat | 0;
            const l = lgt | 0;
            ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${alphaStr})`;
          } else if (alphaStr !== lastAlphaStr) {
            ctx.strokeStyle = `hsla(160,84%,39%,${alphaStr})`;
          }
          lastAlphaStr = alphaStr;

          const needsGlow = alpha > (isDark ? 0.32 : 0.22);
          const needsGreenGlow = !isDark && colorMix > 0.7;
          const glowKey = needsGreenGlow ? 2 : needsGlow ? 1 : 0;
          // Scope colorMix for glow check
          const colorMixForGlow = !isDark ? (shimmer * 0.4 + shimmer2 * 0.35 + sparkle * 0.25) : 0;
          const glowKeyFinal = (!isDark && colorMixForGlow > 0.7) ? 2 : needsGlow ? 1 : 0;
          if (glowKeyFinal !== (lastGlow ? (lastGlow === true ? 1 : lastGlow) : 0)) {
            if (glowKeyFinal === 2) {
              ctx.lineWidth = 0.8;
              ctx.shadowColor = 'hsla(170,60%,50%,0.2)';
              ctx.shadowBlur = 8;
            } else if (glowKeyFinal === 1) {
              ctx.lineWidth = isDark ? 0.7 : 0.6;
              ctx.shadowColor = isDark ? 'hsla(160,84%,50%,0.12)' : 'hsla(200,50%,55%,0.15)';
              ctx.shadowBlur = isDark ? 6 : 6;
            } else {
              ctx.lineWidth = 0.5;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            lastGlow = glowKeyFinal as any;
          }

          ctx.setTransform(dpr, 0, 0, dpr, cx * dpr, cyScreen * dpr);
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
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.92 }}
      aria-hidden="true"
    />
  );
}
