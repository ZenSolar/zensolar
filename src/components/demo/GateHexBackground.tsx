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
  const activationStartRef = useRef<number | null>(null);
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

      // Keep the gate alive, but slightly slower so the intro cascade reads clearly.
      time += 0.018 * dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const startRow = -1;
      const endRow = Math.ceil(h / hexHeight) + 3;
      const cols = Math.ceil(w / (hexWidth * 0.75)) + 2;

      // Faster drift speeds for urgency
      const driftA = time * 520;
      const driftB = time * 400;
      const driftC = time * 300;

      // Curtain drop — bright leading edge sweeps top-to-bottom with a glowing trail
      const actStart = activationStartRef.current;
      const actElapsed = activatedRef.current && actStart !== null ? Math.max(0, (now - actStart) / 1000) : null;
      const CURTAIN_DURATION = 8.0;
      const CURTAIN_SWEEP = 6.5;      // seconds for the leading edge to cross the screen (slower)
      const curtainActive = actElapsed !== null && actElapsed < CURTAIN_DURATION;
      // Global fade-out in the last 2 seconds
      const curtainFade = curtainActive
        ? (actElapsed! < 6.0 ? 1 : Math.max(0, 1 - (actElapsed! - 6.0) / 2.0))
        : 0;

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      let lastColor = '';
      let lastGlow = false;

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * hexWidth * 0.75;
          const cy = row * hexHeight + (col % 2 === 1 ? hexHeight * 0.5 : 0);

          if (cy < -hexSize || cy > h + hexSize) continue;

          // ── Curtain position ──
          // During the curtain sweep, green hexes are ONLY visible behind
          // (below) the orange leading edge. Before the curtain reaches a
          // hex's row, that hex is invisible — pure navy.
          const actStart = activationStartRef.current;
          const actElapsed = activatedRef.current && actStart !== null ? Math.max(0, (now - actStart) / 1000) : null;

          let edgeAlpha = 0;
          let greenAlpha = 0;

          if (actElapsed !== null) {
            const curtainY = -hexHeight * 2 + (Math.min(actElapsed / CURTAIN_SWEEP, 1)) * (h + hexHeight * 4);
            const distBehind = curtainY - cy; // positive = curtain has passed this row

            // ORANGE LEADING EDGE
            const edgeWidth = hexHeight * 5;
            const edgeDist = Math.abs(cy - curtainY);
            if (edgeDist < edgeWidth) {
              edgeAlpha = Math.pow(1 - edgeDist / edgeWidth, 1.2) * 1.0 * curtainFade;
            }

            // GREEN: only appears once the curtain has swept past this row
            if (distBehind > 0) {
              // Base green shimmer — fades in as the curtain recedes
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

              // Bright green wake right behind the orange edge
              const greenWaveLength = h * 0.5;
              if (distBehind < greenWaveLength) {
                const t = 1 - distBehind / greenWaveLength;
                alpha += Math.pow(t, 1.5) * 0.45 * curtainFade;
              }

              // Fade-in ramp: green starts dim right at the curtain edge,
              // reaches full strength a few hex-heights behind it
              const revealRamp = Math.min(distBehind / (hexHeight * 4), 1);
              alpha *= revealRamp;

              greenAlpha = Math.min(alpha, curtainActive ? 0.85 : 0.55);
            }
          } else {
            // Curtain complete — show steady green grid
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

          const isCurtainHex = edgeAlpha > 0.05;
          
          if (isCurtainHex) {
            const finalAlpha = Math.min(edgeAlpha, 1.0);
            if (finalAlpha < 0.06) continue;

            const roundedAlpha = ((finalAlpha * 50 + 0.5) | 0) / 50;
            const colorStr = `hsla(36,92%,55%,${roundedAlpha.toFixed(2)})`;

            if (colorStr !== lastColor) {
              ctx.strokeStyle = colorStr;
              lastColor = colorStr;
            }
            ctx.lineWidth = 1.0;
            ctx.shadowColor = `hsla(36,92%,55%,0.3)`;
            ctx.shadowBlur = 10;
            lastGlow = true;
          } else if (greenAlpha > 0.06) {
            const roundedAlpha = ((greenAlpha * 50 + 0.5) | 0) / 50;
            const colorStr = `hsla(160,84%,42%,${roundedAlpha.toFixed(2)})`;

            if (colorStr !== lastColor) {
              ctx.strokeStyle = colorStr;
              lastColor = colorStr;
            }

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
