import { useEffect, useRef } from 'react';

type QualityTier = 0 | 1 | 2; // 0 = low, 1 = medium, 2 = high

interface QualityProfile {
  targetFps: number;
  dprCap: number;
  hexSize: number;
  glow: boolean;
  sparkle: boolean;
}

const QUALITY: Record<QualityTier, QualityProfile> = {
  0: { targetFps: 24, dprCap: 1, hexSize: 38, glow: false, sparkle: true },
  1: { targetFps: 30, dprCap: 1.5, hexSize: 34, glow: false, sparkle: true },
  2: { targetFps: 48, dprCap: 2, hexSize: 30, glow: true, sparkle: true },
};

/** Best-effort initial guess so weak devices never render a heavy first frame. */
function detectInitialTier(): QualityTier {
  if (typeof window === 'undefined') return 1;
  const isMobile = window.innerWidth < 768;
  const cores = (navigator as any).hardwareConcurrency ?? (isMobile ? 4 : 8);
  const memory = (navigator as any).deviceMemory ?? (isMobile ? 4 : 8);
  const pixels = window.innerWidth * window.innerHeight * Math.min(window.devicePixelRatio || 1, 3);

  if (cores <= 4 || memory <= 2 || pixels > 4_500_000) return 0;
  if (isMobile || cores <= 6 || memory <= 4) return 1;
  return 2;
}

export function DashboardHexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let animationId: number;
    let time = 0;
    let currentScrollY = window.scrollY;
    let lastFrameTime = 0;

    // ---- Adaptive quality state -------------------------------------------
    let tier: QualityTier = reduceMotion ? 0 : detectInitialTier();
    const maxTier: QualityTier = reduceMotion ? 0 : detectInitialTier();
    let profile = QUALITY[tier];
    let frameInterval = 1000 / profile.targetFps;
    let emaFrameMs = frameInterval;
    let slowStreak = 0;
    let fastStreak = 0;
    let coolDownUntil = 0;

    let hexSize = profile.hexSize;
    let hexWidth = hexSize * 2;
    let hexHeight = Math.sqrt(3) * hexSize;
    let hexPath = new Path2D();

    const buildHexPath = () => {
      hexWidth = hexSize * 2;
      hexHeight = Math.sqrt(3) * hexSize;
      const p = new Path2D();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = hexSize * Math.cos(angle);
        const y = hexSize * Math.sin(angle);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.closePath();
      hexPath = p;
    };

    let dpr = 1;
    let w = 0;
    let h = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const applyTier = (next: QualityTier) => {
      if (next === tier) return;
      tier = next;
      profile = QUALITY[tier];
      frameInterval = 1000 / profile.targetFps;
      emaFrameMs = frameInterval;
      slowStreak = 0;
      fastStreak = 0;
      coolDownUntil = performance.now() + 2500;
      hexSize = profile.hexSize;
      buildHexPath();
      resize();
    };

    buildHexPath();
    resize();
    window.addEventListener('resize', resize);

    const TAU = Math.PI * 2;

    // ---- Falling "snowflake" shimmer ---------------------------------------
    interface Flake {
      x: number;
      fx: number;      // swayed + parallaxed x used for rendering
      y: number;
      fy: number;      // parallaxed y used for rendering
      vy: number;      // px per 60fps-frame
      swayAmp: number;
      swayFreq: number;
      swayPhase: number;
      radius: number;  // influence radius in px
      strength: number;
      depth: number;   // 0 = far (barely moves), 1 = near (full parallax)
    }
    let flakes: Flake[] = [];

    const flakeCount = () => (tier === 0 ? 14 : tier === 1 ? 24 : 38);

    const makeFlake = (seedTop: boolean): Flake => {
      const depth = 0.25 + Math.random() * 0.75;
      return {
        x: Math.random() * (w || window.innerWidth),
        fx: 0,
        y: seedTop ? -Math.random() * 200 : Math.random() * (h || window.innerHeight),
        fy: 0,
        vy: (0.85 + Math.random() * 1.25) * (0.7 + depth * 0.6),
        swayAmp: 18 + Math.random() * 42,
        swayFreq: 0.004 + Math.random() * 0.008,
        swayPhase: Math.random() * TAU,
        radius: 70 + Math.random() * 110,
        strength: 0.55 + Math.random() * 0.45,
        depth,
      };
    };

    const seedFlakes = () => {
      flakes = Array.from({ length: flakeCount() }, () => makeFlake(false));
    };
    seedFlakes();

    // ---- Parallax inputs: device tilt + scroll -----------------------------
    // Targets are raw inputs; the rendered values ease toward them so motion
    // stays physical and never jitters.
    let tiltTarget = 0;      // px of horizontal push at depth 1
    let tiltCurrent = 0;
    let scrollTarget = 0;    // px of vertical push at depth 1
    let scrollCurrent = 0;
    let lastScrollY = window.scrollY;

    const MAX_TILT_PX = 26;
    const MAX_SCROLL_PX = 60;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (reduceMotion || e.gamma == null) return;
      // gamma: -90..90 (left/right tilt). Clamp to a gentle +-35deg range.
      const g = Math.max(-35, Math.min(35, e.gamma));
      tiltTarget = (g / 35) * MAX_TILT_PX;
    };

    const onScroll = () => {
      if (reduceMotion) return;
      const y = window.scrollY;
      const delta = y - lastScrollY;
      lastScrollY = y;
      scrollTarget = Math.max(-MAX_SCROLL_PX, Math.min(MAX_SCROLL_PX, scrollTarget + delta * 0.55));
    };

    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('scroll', onScroll, { passive: true });




    const animate = (now: number) => {
      // Throttle framerate for battery savings
      if (lastFrameTime && (now - lastFrameTime) < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      const rawDelta = lastFrameTime ? now - lastFrameTime : frameInterval;
      const dt = lastFrameTime ? Math.min(rawDelta / 16.667, 2) : 1;
      lastFrameTime = now;

      // ---- Adaptive quality governor --------------------------------------
      if (!reduceMotion && rawDelta < 1000) {
        emaFrameMs += (rawDelta - emaFrameMs) * 0.1;
        if (now > coolDownUntil) {
          if (emaFrameMs > frameInterval * 1.45) {
            slowStreak++;
            fastStreak = 0;
            if (slowStreak > 40 && tier > 0) applyTier((tier - 1) as QualityTier);
          } else if (emaFrameMs < frameInterval * 1.08) {
            fastStreak++;
            slowStreak = 0;
            if (fastStreak > 300 && tier < maxTier) applyTier((tier + 1) as QualityTier);
          } else {
            slowStreak = 0;
            fastStreak = 0;
          }
        }
      }

      // Slow, liquid time step for the wave shimmer
      time += 0.0014 * dt;
      currentScrollY = window.scrollY;

      // Re-check theme every frame for live switching
      const isDark = document.documentElement.classList.contains('dark');
      const alphaMultiplier = isDark ? 1 : 1.55;

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

      // ---- Parallax easing (critically damped feel, frame-rate aware) ----
      const ease = 1 - Math.pow(0.86, dt);
      tiltCurrent += (tiltTarget - tiltCurrent) * ease;
      scrollCurrent += (scrollTarget - scrollCurrent) * ease;
      // Scroll impulse decays back to rest so the field settles when idle
      scrollTarget *= Math.pow(0.90, dt);

      // ---- Advance the falling flakes ----
      if (flakes.length !== flakeCount()) seedFlakes();
      for (let f = 0; f < flakes.length; f++) {
        const fl = flakes[f];
        fl.y += fl.vy * dt;
        fl.swayPhase += fl.swayFreq * dt * 16.667;
        fl.fx = fl.x + Math.sin(fl.swayPhase) * fl.swayAmp + tiltCurrent * fl.depth;
        fl.fy = fl.y + scrollCurrent * fl.depth;
        if (fl.y - fl.radius > h + MAX_SCROLL_PX) {
          const fresh = makeFlake(true);
          fresh.y = -fresh.radius;
          fresh.fx = fresh.x + tiltCurrent * fresh.depth;
          fresh.fy = fresh.y;
          flakes[f] = fresh;
        }
      }


      const driftA = time * 95;
      const driftB = time * 65;
      const driftC = time * 45;


      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      let lastAlphaStr = '';
      let lastGlow = 0;

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * hexWidth * 0.75;
          const cyPage = row * hexHeight + (col % 2 === 1 ? hexHeight * 0.5 : 0);
          const cyScreen = cyPage - currentScrollY;

          if (cyScreen < -hexSize || cyScreen > h + hexSize) continue;

          let alpha = isDark ? 0.03 : 0.038;

          const dA = cx + cyPage * 0.55;
          const dB = cx * 0.78 + cyPage * 0.82;
          const dC = cx * 1.08 - cyPage * 0.28;

          // Soft ambient undulation (large, slow waves)
          const phA = ((dA - driftA) / 900) * TAU;
          const bA = Math.pow((Math.cos(phA) + 1) * 0.5, 3);

          const phB = ((dB + driftB) / 1200) * TAU;
          const bB = Math.pow((Math.cos(phB) + 1) * 0.5, 4);

          const phC = ((dC - driftC) / 1500) * TAU;
          const bC = Math.pow((Math.cos(phC) + 1) * 0.5, 3);

          // ---- Falling snowflake shimmer ----
          // Each drifting flake lights the hexes it passes over with a soft
          // radial falloff, so brightness trickles downward across the field.
          let waveShimmer = 0;
          for (let f = 0; f < flakes.length; f++) {
            const fl = flakes[f];
            const dx = cx - fl.fx;
            if (dx > fl.radius || dx < -fl.radius) continue;
            const dy = cyScreen - fl.fy;
            if (dy > fl.radius || dy < -fl.radius) continue;
            const d2 = dx * dx + dy * dy;
            const r2 = fl.radius * fl.radius;
            if (d2 > r2) continue;
            const falloff = 1 - d2 / r2;
            waveShimmer += falloff * falloff * fl.strength;
          }
          if (waveShimmer > 1) waveShimmer = 1;


          if (isDark) {
            alpha += bA * 0.04 + bB * 0.03 + bC * 0.025 + waveShimmer * 0.08;
          } else {
            alpha += bA * 0.05 + bB * 0.038 + bC * 0.032 + waveShimmer * 0.095;
          }
          alpha = Math.min(alpha * alphaMultiplier, isDark ? 0.18 : 0.28);

          if (alpha < 0.02) continue;

          // Finer alpha granularity removes visible stepping during slow fades
          const roundedAlpha = ((alpha * 100 + 0.5) | 0) / 100;
          const alphaStr = roundedAlpha.toFixed(2);

          if (!isDark) {
            // Color warms slightly inside the wave crest
            const colorMix = waveShimmer;
            const hue = 210 - colorMix * 35;   // 210 (blue) → 175 (teal)
            const sat = 42 + colorMix * 20;    // 42–62%
            const lgt = 52 + colorMix * 6;     // 52–58%
            ctx.strokeStyle = `hsla(${hue | 0},${sat | 0}%,${lgt | 0}%,${alphaStr})`;
          } else if (alphaStr !== lastAlphaStr) {
            ctx.strokeStyle = `hsla(160,84%,39%,${alphaStr})`;
          }
          lastAlphaStr = alphaStr;

          // Glow follows the wave crest softly
          let glowKeyFinal = 0;
          if (profile.glow) {
            const needsGlow = alpha > (isDark ? 0.14 : 0.13);
            glowKeyFinal = needsGlow ? 1 : 0;
          }
          if (glowKeyFinal !== lastGlow) {
            if (glowKeyFinal === 1) {
              ctx.lineWidth = isDark ? 0.65 : 0.55;
              ctx.shadowColor = isDark ? 'hsla(160,84%,45%,0.10)' : 'hsla(195,50%,55%,0.12)';
              ctx.shadowBlur = 5;
            } else {
              ctx.lineWidth = 0.5;
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
            }
            lastGlow = glowKeyFinal;
          }

          ctx.setTransform(dpr, 0, 0, dpr, cx * dpr, cyScreen * dpr);
          ctx.stroke(hexPath);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      animationId = requestAnimationFrame(animate);
    };

    // Pause entirely when the tab is hidden — no wasted frames, no catch-up jump
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        lastFrameTime = 0;
        emaFrameMs = frameInterval;
        coolDownUntil = performance.now() + 1500;
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('scroll', onScroll);

      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
      aria-hidden="true"
    />
  );
}
