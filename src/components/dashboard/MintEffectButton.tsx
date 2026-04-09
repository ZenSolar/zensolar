import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMintSound } from '@/hooks/useMintSound';
import { cn } from '@/lib/utils';

const TOUCH_DELTA_THRESHOLD = 15;
const DOUBLE_TAP_WINDOW = 800;
const BURST_DURATION = 800;
const DOUBLE_BURST_DURATION = 600;

const RGBA = '34, 197, 94';
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';
const HAPTIC_PATTERN = [15, 30, 10];

interface MintEffectButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function MintEffectButton({ onClick, disabled, className, children }: MintEffectButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'pressing' | 'charging' | 'burst'>('idle');
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const [showTapAgain, setShowTapAgain] = useState(false);
  const [burstKey, setBurstKey] = useState(0); // force re-mount burst elements on re-tap
  
  const cardRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { playMintSound } = useMintSound();

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
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

  const clearBurstTimer = () => {
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
      burstTimerRef.current = null;
    }
  };

  const triggerBurst = useCallback((relX?: number, relY?: number, duration = BURST_DURATION) => {
    if (relX !== undefined && relY !== undefined) setTouchPoint({ x: relX, y: relY });
    clearBurstTimer();
    setBurstKey(k => k + 1);
    setPhase('burst');
    playMintSound('gold');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(HAPTIC_PATTERN); } catch { /* */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 120);
    }).catch(() => {});
    burstTimerRef.current = setTimeout(() => {
      setPhase('idle');
      setTouchPoint(null);
    }, duration);
  }, [playMintSound]);

  const processTap = useCallback((posX: number, posY: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;
      setShowTapAgain(false);
      triggerBurst(posX, posY, DOUBLE_BURST_DURATION);
      setTimeout(() => onClick(), 600);
    } else {
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY, BURST_DURATION);
      setShowTapAgain(true);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        setShowTapAgain(false);
      }, 2000);
    }
  }, [triggerBurst, onClick]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const pos = getTouchRelativePos(e.clientX, e.clientY);
    processTap(pos.x, pos.y);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setPhase('pressing');
    const pos = getTouchRelativePos(touch.clientX, touch.clientY);
    setTouchPoint(pos);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = setTimeout(() => {
      setPhase('charging');
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
      setPhase('idle');
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
      setPhase('idle');
      setTouchPoint(null);
    }
    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    setPhase('idle');
    setTouchPoint(null);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    touchStartRef.current = null;
  };

  const isBursting = phase === 'burst';
  const isPressing = phase === 'pressing';
  const isChargingUp = phase === 'charging';

  // Use CSS classes for the stamp animation to avoid framer-motion layout recalcs
  const phaseClass = isBursting
    ? 'zen-mint-burst'
    : isChargingUp
    ? 'zen-mint-charging'
    : isPressing
    ? 'zen-mint-pressing'
    : 'zen-mint-idle';

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      disabled={disabled}
      style={{
        boxShadow: isBursting 
          ? `0 0 30px rgba(${RGBA}, 0.5), 0 0 60px rgba(${RGBA}, 0.25)` 
          : isChargingUp
            ? `0 0 20px rgba(${RGBA}, 0.4), 0 0 40px rgba(${RGBA}, 0.2)`
          : isPressing 
            ? `inset 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(${RGBA}, 0.3)` 
            : undefined,
      }}
      className={cn(
        "relative overflow-hidden touch-manipulation select-none",
        phaseClass,
        className
      )}
    >
      {/* Touch-point ripple */}
      {(isPressing || isBursting) && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full z-10"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)`,
            animation: isBursting ? 'zenTouchRipple 700ms ease-out forwards' : undefined,
            transform: isPressing && !isBursting ? 'translate(-50%, -50%) scale(0.3)' : undefined,
            opacity: isPressing && !isBursting ? 0.4 : undefined,
            transition: !isBursting ? 'transform 0.12s ease-out, opacity 0.12s ease-out' : undefined,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Pressure shockwave ring */}
      {isBursting && touchPoint && (
        <div
          key={`wave-${burstKey}`}
          className="absolute pointer-events-none rounded-full z-10"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '300%',
            height: '300%',
            border: `2px solid rgba(255,255,255,0.8)`,
            animation: 'zenPressureWave 600ms ease-out forwards',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Solar Flare Burst — rings + particles */}
      {isBursting && (
        <React.Fragment key={`burst-${burstKey}`}>
          {[0, 1, 2].map(i => (
            <div
              key={`ring-${i}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: touchPoint ? `${touchPoint.x * 100}%` : '50%',
                top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                width: 20,
                height: 20,
                marginLeft: -10,
                marginTop: -10,
                borderRadius: '50%',
                border: `2px solid rgba(255,255,255, ${0.8 - i * 0.2})`,
                animation: `zenFlareRing 700ms ${i * 100}ms ease-out forwards`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360 + (Math.random() * 20 - 10);
            const rad = (angle * Math.PI) / 180;
            const dist = 45 + Math.random() * 60;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * (18 + Math.random() * 25);
            const size = 6 + Math.random() * 5;
            const rotation = Math.random() * 360;
            return (
              <div
                key={`particle-${i}`}
                className="absolute pointer-events-none z-10"
                style={{
                  left: touchPoint ? `${touchPoint.x * 100}%` : '50%',
                  top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                  width: size,
                  height: size,
                  background: `rgba(255,255,255, ${0.85 + Math.random() * 0.15})`,
                  boxShadow: `0 0 10px rgba(${RGBA}, 0.7), 0 0 20px rgba(${RGBA}, 0.25)`,
                  clipPath: PARTICLE_SHAPE,
                  transform: `rotate(${rotation}deg)`,
                  animation: `zenFlareParticle 700ms ${i * 25}ms ease-out forwards`,
                  willChange: 'transform, opacity',
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}
          <div
            className="absolute pointer-events-none rounded-full z-10"
            style={{
              left: touchPoint ? `${touchPoint.x * 100}%` : '50%',
              top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(${RGBA}, 0.2) 40%, transparent 70%)`,
              animation: 'zenEnergyRelease 600ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
        </React.Fragment>
      )}

      {/* Charging-up pulsing glow */}
      {isChargingUp && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{
            border: `2px solid rgba(255,255,255,0.5)`,
            animation: 'zenChargeUpPulse 600ms ease-in-out infinite alternate',
            willChange: 'opacity, box-shadow',
            boxShadow: `inset 0 0 20px rgba(255,255,255,0.1), 0 0 25px rgba(${RGBA}, 0.3)`,
          }}
        />
      )}

      {/* "Tap twice" hint */}
      {showTapAgain && (
        <span
          className="absolute inset-0 flex items-center justify-center z-20 text-white/90 text-xs font-bold tracking-wider pointer-events-none animate-pulse"
          style={{ textShadow: '0 0 12px rgba(0,0,0,0.5)' }}
        >
          tap again to mint
        </span>
      )}

      {/* Actual button content */}
      <span className={cn("relative z-0 flex items-center justify-center w-full", showTapAgain && "opacity-30")}>
        {children}
      </span>
    </button>
  );
}
