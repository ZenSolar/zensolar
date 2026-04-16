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

      time += 0.009 * dt;
      currentScrollY = window.scrollY;

      // Re-check theme every frame for live switching
      const isDark = document.documentElement.classList.contains('dark');
      const alphaMultiplier = isDark ? 1 : 2.2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Warm gradient overlay in light mode
      if (!isDark) {
        const grad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, w * 0.8);
        grad.addColorStop(0, 'hsla(40, 80%, 70%, 0.06)');
        grad.addColorStop(0.5, 'hsla(35, 70%, 60%, 0.03)');
        grad.addColorStop(1, 'hsla(30, 60%, 50%, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      const startRow = Math.floor(currentScrollY / hexHeight) - 1;
      const endRow = startRow + Math.ceil(h / hexHeight) + 3;
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;

      const driftA = time * 360;
      const driftB = time * 270;
      const driftC = time * 200;

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

          let alpha = 0.09;

          const dA = cx + cyPage * 0.55;
          const dB = cx * 0.78 + cyPage * 0.82;
          const dC = cx * 1.08 - cyPage * 0.28;

          const phA = ((dA - driftA) / 580) * TAU;
          const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 5);

          const phB = ((dB + driftB) / 720) * TAU;
          const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 6);

          const phC = ((dC - driftC) / 860) * TAU;
          const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 4);

          const shimmer = (Math.sin(dA * 0.012 - time * 3) + 1) * 0.5;

          alpha += bA * 0.17 + bB * 0.13 + bC * 0.1 + shimmer * 0.03;
          alpha = Math.min(alpha * alphaMultiplier, isDark ? 0.42 : 0.82);

          if (alpha < 0.05) continue;

          const roundedAlpha = ((alpha * 50 + 0.5) | 0) / 50;
          const alphaStr = roundedAlpha.toFixed(2);

          if (alphaStr !== lastAlphaStr) {
            ctx.strokeStyle = isDark ? `hsla(160,84%,39%,${alphaStr})` : `hsla(45,100%,50%,${alphaStr})`;
            lastAlphaStr = alphaStr;
          }

          const needsGlow = alpha > (isDark ? 0.32 : 0.28);
          if (needsGlow !== lastGlow) {
            if (needsGlow) {
              ctx.lineWidth = isDark ? 0.7 : 1.0;
              ctx.shadowColor = isDark ? 'hsla(160,84%,50%,0.12)' : 'hsla(43,92%,58%,0.35)';
              ctx.shadowBlur = isDark ? 6 : 10;
            } else {
              ctx.lineWidth = isDark ? 0.5 : 0.7;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            lastGlow = needsGlow;
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
