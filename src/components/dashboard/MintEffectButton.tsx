import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { useMintSound } from '@/hooks/useMintSound';
import { cn } from '@/lib/utils';

const TOUCH_DELTA_THRESHOLD = 15;
const DOUBLE_TAP_WINDOW = 800;
const BURST_DURATION = 750;
const DOUBLE_BURST_DURATION = 550;

const RGBA = '34, 197, 94';
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';
const HAPTIC_PATTERN = [15, 30, 10];
const PARTICLE_COUNT = 10;

// Pre-compute particle layouts to avoid Math.random() during render
function generateParticleLayout() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const dist = 40 + Math.random() * 55;
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * (16 + Math.random() * 22),
      size: 5 + Math.random() * 5,
      rotation: Math.random() * 360,
      alpha: 0.85 + Math.random() * 0.15,
      delay: i * 20,
    };
  });
}

interface MintEffectButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

// Single combined state to batch updates and reduce renders
interface ButtonState {
  phase: 'idle' | 'pressing' | 'charging' | 'burst';
  touchPoint: { x: number; y: number } | null;
  showTapAgain: boolean;
  burstKey: number;
}

export function MintEffectButton({ onClick, disabled, className, children }: MintEffectButtonProps) {
  const stateRef = useRef<ButtonState>({
    phase: 'idle',
    touchPoint: null,
    showTapAgain: false,
    burstKey: 0,
  });
  // Force re-render trigger
  const [, setRenderTick] = React.useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  
  const cardRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const { playMintSound } = useMintSound();

  // Pre-computed particle positions — regenerated each burst via burstKey
  const particles = useMemo(
    () => generateParticleLayout(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateRef.current.burstKey]
  );

  // Batch state update helper — synchronous render to guarantee visuals fire with sound
  const updateState = useCallback((patch: Partial<ButtonState>) => {
    Object.assign(stateRef.current, patch);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    // Force synchronous render so burst visuals are never skipped
    forceRender();
  }, [forceRender]);

  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getTouchRelativePos = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0.5, y: 0.5 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const triggerBurst = useCallback((relX?: number, relY?: number, duration = BURST_DURATION) => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    
    updateState({
      phase: 'burst',
      burstKey: stateRef.current.burstKey + 1,
      ...(relX !== undefined && relY !== undefined ? { touchPoint: { x: relX, y: relY } } : {}),
    });
    
    playMintSound('gold');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(HAPTIC_PATTERN); } catch { /* */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 100);
    }).catch(() => {});
    
    burstTimerRef.current = setTimeout(() => {
      updateState({ phase: 'idle', touchPoint: null });
    }, duration);
  }, [playMintSound, updateState]);

  const processTap = useCallback((posX: number, posY: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;
      updateState({ showTapAgain: false });
      triggerBurst(posX, posY, DOUBLE_BURST_DURATION);
      setTimeout(() => onClick(), 550);
    } else {
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY, BURST_DURATION);
      updateState({ showTapAgain: true });
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        updateState({ showTapAgain: false });
      }, 2000);
    }
  }, [triggerBurst, onClick, updateState]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const pos = getTouchRelativePos(e.clientX, e.clientY);
    processTap(pos.x, pos.y);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    const pos = getTouchRelativePos(touch.clientX, touch.clientY);
    updateState({ phase: 'pressing', touchPoint: pos });
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = setTimeout(() => {
      updateState({ phase: 'charging' });
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }).catch(() => {});
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(8); } catch { /* */ }
      }
    }, 200);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !touchStartRef.current) {
      updateState({ phase: 'idle' });
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      return;
    }
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD) {
      e.preventDefault();
      const pos = getTouchRelativePos(touch.clientX, touch.clientY);
      processTap(pos.x, pos.y);
    } else {
      updateState({ phase: 'idle', touchPoint: null });
    }
    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    updateState({ phase: 'idle', touchPoint: null });
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    touchStartRef.current = null;
  };

  const { phase, touchPoint, showTapAgain, burstKey } = stateRef.current;
  const isBursting = phase === 'burst';
  const isPressing = phase === 'pressing';
  const isChargingUp = phase === 'charging';

  const phaseClass = isBursting
    ? 'zen-mint-burst'
    : isChargingUp
    ? 'zen-mint-charging'
    : isPressing
    ? 'zen-mint-pressing'
    : 'zen-mint-idle';

  const ox = touchPoint ? `${touchPoint.x * 100}%` : '50%';
  const oy = touchPoint ? `${touchPoint.y * 100}%` : '50%';

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden touch-manipulation select-none zen-mint-contain",
        phaseClass,
        className
      )}
    >
      {/* Effect layer — always mounted, toggled via opacity/animation to avoid DOM churn */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ opacity: (isPressing || isBursting) ? 1 : 0, transition: 'opacity 0.1s ease-out' }}
      >
        {/* Touch-point ripple */}
        {touchPoint && (
          <div
            className="absolute rounded-full"
            style={{
              left: ox,
              top: oy,
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
              animation: isBursting ? 'zenTouchRipple 650ms ease-out forwards' : undefined,
              transform: isPressing && !isBursting ? 'translate(-50%, -50%) scale(0.3)' : undefined,
              opacity: isPressing && !isBursting ? 0.4 : undefined,
              transition: !isBursting ? 'transform 0.1s ease-out, opacity 0.1s ease-out' : undefined,
              willChange: 'transform, opacity',
            }}
          />
        )}

        {/* Shockwave ring */}
        {isBursting && touchPoint && (
          <div
            key={`wave-${burstKey}`}
            className="absolute rounded-full"
            style={{
              left: ox, top: oy,
              width: '280%', height: '280%',
              border: '2px solid rgba(255,255,255,0.7)',
              animation: 'zenPressureWave 550ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
        )}

        {/* Flare rings */}
        {isBursting && [0, 1, 2].map(i => (
          <div
            key={`ring-${burstKey}-${i}`}
            className="absolute"
            style={{
              left: ox, top: oy,
              width: 18, height: 18,
              marginLeft: -9, marginTop: -9,
              borderRadius: '50%',
              border: `2px solid rgba(255,255,255, ${0.75 - i * 0.2})`,
              animation: `zenFlareRing 650ms ${i * 80}ms ease-out forwards`,
              willChange: 'transform, opacity',
            }}
          />
        ))}

        {/* Particles */}
        {isBursting && particles.map((p, i) => (
          <div
            key={`p-${burstKey}-${i}`}
            className="absolute"
            style={{
              left: ox, top: oy,
              width: p.size, height: p.size,
              background: `rgba(255,255,255, ${p.alpha})`,
              boxShadow: `0 0 8px rgba(${RGBA}, 0.6)`,
              clipPath: PARTICLE_SHAPE,
              transform: `rotate(${p.rotation}deg)`,
              animation: `zenFlareParticle 650ms ${p.delay}ms ease-out forwards`,
              willChange: 'transform, opacity',
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Energy release glow */}
        {isBursting && (
          <div
            key={`glow-${burstKey}`}
            className="absolute rounded-full"
            style={{
              left: ox, top: oy,
              width: 70, height: 70,
              marginLeft: -35, marginTop: -35,
              background: `radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(${RGBA}, 0.15) 40%, transparent 70%)`,
              animation: 'zenEnergyRelease 550ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
        )}
      </div>

      {/* Charging glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl z-10"
        style={{
          opacity: isChargingUp ? 1 : 0,
          border: '2px solid rgba(255,255,255,0.5)',
          animation: isChargingUp ? 'zenChargeUpPulse 600ms ease-in-out infinite alternate' : undefined,
          boxShadow: `inset 0 0 20px rgba(255,255,255,0.1), 0 0 25px rgba(${RGBA}, 0.3)`,
          transition: 'opacity 0.15s ease-out',
        }}
      />

      {/* "Tap twice" hint — CSS only, no framer-motion */}
      <span
        className="absolute inset-0 flex items-center justify-center z-20 text-white/90 text-xs font-bold tracking-wider pointer-events-none"
        style={{
          textShadow: '0 0 12px rgba(0,0,0,0.5)',
          opacity: showTapAgain ? 1 : 0,
          transform: showTapAgain ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
          animation: showTapAgain ? 'zenTapAgainPulse 1.2s ease-in-out infinite' : undefined,
        }}
      >
        tap again to mint
      </span>

      {/* Button content */}
      <span
        className={cn("relative z-0 flex items-center justify-center w-full")}
        style={{
          opacity: showTapAgain ? 0.3 : 1,
          transition: 'opacity 0.15s ease-out',
        }}
      >
        {children}
      </span>
    </button>
  );
}
