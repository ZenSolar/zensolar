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
      const alphaMultiplier = isDark ? 1 : 1.4;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Warm gradient overlay in light mode
      if (!isDark) {
        const grad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, w * 0.8);
        grad.addColorStop(0, 'hsla(220, 60%, 55%, 0.04)');
        grad.addColorStop(0.5, 'hsla(225, 50%, 45%, 0.02)');
        grad.addColorStop(1, 'hsla(230, 40%, 35%, 0)');
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

          let alpha = 0.06;

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

          alpha += bA * 0.1 + bB * 0.08 + bC * 0.06 + shimmer * 0.04 + shimmer2 * 0.035 + shimmer3 * 0.025 + sparkle * 0.22 + sparkle2 * 0.18;
          alpha = Math.min(alpha * alphaMultiplier, isDark ? 0.42 : 0.55);

          if (alpha < 0.05) continue;

          const roundedAlpha = ((alpha * 50 + 0.5) | 0) / 50;
          const alphaStr = roundedAlpha.toFixed(2);

          if (!isDark) {
            const colorMix = (shimmer * 0.4 + shimmer2 * 0.35 + sparkle * 0.25);
            // Two-tone: blue base transitioning to vivid emerald green on shimmer peaks
            const hue = 215 - colorMix * 60;        // 215 (soft blue) → 155 (vivid emerald)
            const sat = 65 + colorMix * 30;          // 65–95%
            const lgt = 58 + colorMix * 4;           // 58–62% (keep green rich, not washed out)
            const h = hue | 0;
            const s = sat | 0;
            const l = lgt | 0;
            ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${alphaStr})`;
          } else if (alphaStr !== lastAlphaStr) {
            ctx.strokeStyle = `hsla(160,84%,39%,${alphaStr})`;
          }
          lastAlphaStr = alphaStr;

          const needsGlow = alpha > (isDark ? 0.32 : 0.28);
          const needsGreenGlow = !isDark && (shimmer * 0.4 + shimmer2 * 0.35 + sparkle * 0.25) > 0.65;
          const glowKey = needsGreenGlow ? 2 : needsGlow ? 1 : 0;
          if (glowKey !== (lastGlow ? (lastGlow === true ? 1 : lastGlow) : 0)) {
            if (needsGreenGlow) {
              ctx.lineWidth = 1.1;
              ctx.shadowColor = 'hsla(155,90%,45%,0.4)';
              ctx.shadowBlur = 14;
            } else if (needsGlow) {
              ctx.lineWidth = isDark ? 0.7 : 1.0;
              ctx.shadowColor = isDark ? 'hsla(160,84%,50%,0.12)' : 'hsla(215,85%,55%,0.35)';
              ctx.shadowBlur = isDark ? 6 : 12;
            } else {
              ctx.lineWidth = isDark ? 0.5 : 0.5;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            lastGlow = glowKey as any;
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
