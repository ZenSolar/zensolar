import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMintSound } from '@/hooks/useMintSound';
import { cn } from '@/lib/utils';

const TOUCH_DELTA_THRESHOLD = 15;
const DOUBLE_TAP_WINDOW = 800;

// Primary brand color for the button burst
const RGBA = '34, 197, 94'; // green-500 — primary energy color
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';
const HAPTIC_PATTERN = [15, 30, 10];

interface MintEffectButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function MintEffectButton({ onClick, disabled, className, children }: MintEffectButtonProps) {
  const [isBursting, setIsBursting] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isChargingUp, setIsChargingUp] = useState(false);
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const [showTapAgain, setShowTapAgain] = useState(false);
  
  const cardRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { playMintSound } = useMintSound();

  const getTouchRelativePos = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0.5, y: 0.5 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const triggerBurst = useCallback((relX?: number, relY?: number) => {
    if (relX !== undefined && relY !== undefined) setTouchPoint({ x: relX, y: relY });
    setIsChargingUp(false);
    setIsBursting(true);
    playMintSound('gold');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(HAPTIC_PATTERN); } catch { /* */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 120);
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}), 300);
    }).catch(() => {});
    setTimeout(() => { setIsBursting(false); setTouchPoint(null); }, 1400);
  }, [playMintSound]);

  const triggerDoubleBurst = useCallback((relX?: number, relY?: number) => {
    if (relX !== undefined && relY !== undefined) setTouchPoint({ x: relX, y: relY });
    setIsChargingUp(false);
    setIsBursting(true);
    playMintSound('gold');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([20, 50, 30]); } catch { /* */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 100);
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 250);
    }).catch(() => {});
    setTimeout(() => { setIsBursting(false); setTouchPoint(null); }, 700);
  }, [playMintSound]);

  const processTap = useCallback((posX: number, posY: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;
      setShowTapAgain(false);
      triggerDoubleBurst(posX, posY);
      setTimeout(() => onClick(), 750);
    } else {
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY);
      setShowTapAgain(true);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        setShowTapAgain(false);
      }, 2000);
    }
  }, [triggerBurst, triggerDoubleBurst, onClick]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const pos = getTouchRelativePos(e.clientX, e.clientY);
    processTap(pos.x, pos.y);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsPressing(true);
    const pos = getTouchRelativePos(touch.clientX, touch.clientY);
    setTouchPoint(pos);
    chargeTimerRef.current = setTimeout(() => {
      setIsChargingUp(true);
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
      setIsPressing(false);
      setIsChargingUp(false);
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      return;
    }
    setIsPressing(false);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD) {
      e.preventDefault();
      const pos = getTouchRelativePos(touch.clientX, touch.clientY);
      processTap(pos.x, pos.y);
    } else {
      setIsChargingUp(false);
      setTouchPoint(null);
    }
    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    setIsPressing(false);
    setIsChargingUp(false);
    setTouchPoint(null);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    touchStartRef.current = null;
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      disabled={disabled}
      animate={isBursting ? { 
        scale: [0.90, 1.06, 1.02, 1],
        y: [2, -3, -1, 0],
      } : isChargingUp ? {
        scale: [1, 1.015, 1, 1.015, 1],
        y: 0,
      } : isPressing ? {
        scale: 0.93,
        y: 2,
      } : {
        scale: 1,
        y: 0,
      }}
      transition={isBursting ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : isChargingUp ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.12, ease: 'easeOut' }}
      style={{
        boxShadow: isBursting 
          ? `0 0 30px rgba(${RGBA}, 0.5), 0 0 60px rgba(${RGBA}, 0.25), 0 0 90px rgba(${RGBA}, 0.1)` 
          : isChargingUp
            ? `0 0 20px rgba(${RGBA}, 0.4), 0 0 40px rgba(${RGBA}, 0.2)`
          : isPressing 
            ? `inset 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(${RGBA}, 0.3)` 
            : undefined,
        transition: 'box-shadow 0.4s ease-out',
      }}
      className={cn(
        "relative overflow-hidden touch-manipulation",
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
            animation: isBursting ? 'zenTouchRipple 900ms ease-out forwards' : undefined,
            transform: isPressing && !isBursting ? 'translate(-50%, -50%) scale(0.3)' : undefined,
            opacity: isPressing && !isBursting ? 0.4 : undefined,
            transition: !isBursting ? 'transform 0.15s ease-out, opacity 0.15s ease-out' : undefined,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Pressure shockwave ring */}
      {isBursting && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full z-10"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '300%',
            height: '300%',
            border: `2px solid rgba(255,255,255,0.8)`,
            animation: 'zenPressureWave 800ms ease-out forwards',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Solar Flare Burst — rings + particles */}
      {isBursting && (
        <>
          {[0, 1, 2, 3].map(i => (
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
                border: `2px solid rgba(255,255,255, ${0.8 - i * 0.15})`,
                animation: `zenFlareRing 900ms ${i * 120}ms ease-out forwards`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * 360 + (Math.random() * 20 - 10);
            const rad = (angle * Math.PI) / 180;
            const dist = 50 + Math.random() * 70;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * (20 + Math.random() * 30);
            const size = 7 + Math.random() * 6;
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
                  boxShadow: `0 0 12px rgba(${RGBA}, 0.8), 0 0 24px rgba(${RGBA}, 0.3)`,
                  clipPath: PARTICLE_SHAPE,
                  transform: `rotate(${rotation}deg)`,
                  animation: `zenFlareParticle 900ms ${i * 30}ms ease-out forwards`,
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
              animation: 'zenEnergyRelease 800ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
        </>
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
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: [1, 1.05, 1] }}
          transition={{ duration: 0.4, scale: { repeat: Infinity, duration: 0.8 } }}
          className="absolute inset-0 flex items-center justify-center z-20 text-white/90 text-xs font-bold tracking-wider pointer-events-none"
          style={{ textShadow: '0 0 12px rgba(0,0,0,0.5)' }}
        >
          tap again to mint
        </motion.span>
      )}

      {/* Actual button content */}
      <span className={cn("relative z-0 flex items-center justify-center w-full", showTapAgain && "opacity-30")}>
        {children}
      </span>
    </motion.button>
  );
}
