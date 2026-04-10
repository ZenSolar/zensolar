import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, DollarSign, Coins, Edit2, Check, Wallet, 
  ChevronDown, ChevronUp, Images, ExternalLink, ShieldCheck, 
  ArrowUpRight, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMintSound } from '@/hooks/useMintSound';

// Touch threshold constants
const TOUCH_DELTA_THRESHOLD = 15;
const TOUCH_TIME_THRESHOLD = 400;
const DOUBLE_TAP_WINDOW = 800;
const BURST_DURATION = 1200;
const DOUBLE_BURST_DURATION = 550;

// Wallet-specific color (primary/indigo theme)
const WALLET_RGBA = '139, 92, 246'; // violet-500
const WALLET_PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';
const WALLET_HAPTIC = [15, 30, 10];

interface TokenPriceCardProps {
  tokensHeld: number;
  defaultPrice?: number;
  onPriceChange?: (price: number) => void;
  nftCount?: number;
  nftLabel?: string;
  walletLink?: string;
}

export function TokenPriceCard({ 
  tokensHeld, defaultPrice = 0.10, onPriceChange, 
  nftCount, nftLabel = 'earned', walletLink 
}: TokenPriceCardProps) {
  const [tokenPrice, setTokenPrice] = useState<number>(defaultPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultPrice.toString());
  const [showPulse, setShowPulse] = useState(false);
  const [prevTokens, setPrevTokens] = useState(tokensHeld);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Burst effect state
  const [isBursting, setIsBursting] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isChargingUp, setIsChargingUp] = useState(false);
  const [showTapAgain, setShowTapAgain] = useState(false);
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { playMintSound } = useMintSound();

  const totalValueUSD = tokensHeld * tokenPrice;

  const updatePrice = (newPrice: number) => {
    setTokenPrice(newPrice);
    onPriceChange?.(newPrice);
  };

  useEffect(() => {
    if (tokensHeld !== prevTokens && tokensHeld > prevTokens) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      setPrevTokens(tokensHeld);
      return () => clearTimeout(timer);
    }
    setPrevTokens(tokensHeld);
  }, [tokensHeld, prevTokens]);

  const handlePriceSubmit = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      updatePrice(parsed);
    } else {
      setInputValue(tokenPrice.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePriceSubmit();
    else if (e.key === 'Escape') {
      setInputValue(tokenPrice.toString());
      setIsEditing(false);
    }
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const getTouchRelativePos = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0.5, y: 0.5 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const triggerBurst = useCallback((relX?: number, relY?: number) => {
    if (relX !== undefined && relY !== undefined) {
      setTouchPoint({ x: relX, y: relY });
    }
    setIsChargingUp(false);
    setIsBursting(true);
    playMintSound('gold');
    // Haptic burst
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(WALLET_HAPTIC); } catch { /* silent */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 120);
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}), 300);
    }).catch(() => {});

    setTimeout(() => {
      setIsBursting(false);
      setTouchPoint(null);
    }, BURST_DURATION);
  }, [playMintSound]);

  const triggerDoubleBurst = useCallback((relX?: number, relY?: number) => {
    if (relX !== undefined && relY !== undefined) {
      setTouchPoint({ x: relX, y: relY });
    }
    setIsChargingUp(false);
    setIsBursting(true);
    playMintSound('gold');
    // Stronger haptic
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([20, 50, 30]); } catch { /* silent */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 100);
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 250);
    }).catch(() => {});

    setTimeout(() => {
      setIsBursting(false);
      setTouchPoint(null);
    }, DOUBLE_BURST_DURATION);
  }, [playMintSound]);

  const processTap = useCallback((posX: number, posY: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      // ⚡ DOUBLE TAP — expand wallet
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;
      setShowTapAgain(false);
      triggerDoubleBurst(posX, posY);
      setTimeout(() => setIsCollapsed(false), 550);
    } else {
      // First tap — sensory experience + hint
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY);
      setShowTapAgain(true);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        setShowTapAgain(false);
      }, 2000);
    }
  }, [triggerBurst, triggerDoubleBurst]);

  const handleCollapsedClick = (e: React.MouseEvent) => {
    const pos = getTouchRelativePos(e.clientX, e.clientY);
    processTap(pos.x, pos.y);
  };

  const handleCollapsedTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setIsPressing(true);
    const pos = getTouchRelativePos(touch.clientX, touch.clientY);
    setTouchPoint(pos);

    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = setTimeout(() => {
      setIsChargingUp(true);
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }).catch(() => {});
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(8); } catch { /* silent */ }
      }
    }, 200);
  };

  const handleCollapsedTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
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

  const handleCollapsedTouchCancel = () => {
    setIsPressing(false);
    setIsChargingUp(false);
    setTouchPoint(null);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    touchStartRef.current = null;
  };

  // For expanded view simple touch handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const createTouchEndHandler = (action: () => void) => (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    if (deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD && deltaTime < TOUCH_TIME_THRESHOLD) {
      e.preventDefault();
      action();
    }
    touchStartRef.current = null;
  };

  const formattedValue = totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Dynamic shadows
  const shadowRest = '0 0 20px hsl(var(--primary) / 0.2), 0 0 8px hsl(var(--primary) / 0.15), 0 0 40px hsl(var(--primary) / 0.06)';

  const ox = touchPoint ? `${touchPoint.x * 100}%` : '50%';
  const oy = touchPoint ? `${touchPoint.y * 100}%` : '50%';

  // ── Collapsed view — Full KPI-style double-tap effect ──
  if (isCollapsed) {
    return (
      <motion.div
        ref={cardRef}
        onClick={handleCollapsedClick}
        onTouchStart={handleCollapsedTouchStart}
        onTouchEnd={handleCollapsedTouchEnd}
        onTouchCancel={handleCollapsedTouchCancel}
        initial={{ opacity: 0, y: 10 }}
        animate={isBursting ? { 
          opacity: 1,
          scale: [0.90, 1.06, 1.02, 1],
          y: [2, -3, -1, 0],
        } : isChargingUp ? {
          opacity: 1,
          scale: [1, 1.015, 1, 1.015, 1],
          y: 0,
        } : isPressing ? {
          opacity: 1,
          scale: 0.93,
          y: 2,
        } : {
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={isBursting ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : isChargingUp ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.12, ease: 'easeOut' }}
        style={{
          boxShadow: isBursting 
            ? `0 0 30px rgba(${WALLET_RGBA}, 0.5), 0 0 60px rgba(${WALLET_RGBA}, 0.25), 0 0 90px rgba(${WALLET_RGBA}, 0.1)` 
            : isChargingUp
              ? `0 0 20px rgba(${WALLET_RGBA}, 0.4), 0 0 40px rgba(${WALLET_RGBA}, 0.2)`
            : isPressing 
              ? `inset 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(${WALLET_RGBA}, 0.3)` 
              : shadowRest,
          transition: 'box-shadow 0.4s ease-out',
          borderRadius: 'var(--radius)',
        } as React.CSSProperties}
        className="cursor-pointer touch-manipulation select-none relative"
      >
        {/* Outer ambient glow */}
        <div 
          className="absolute -inset-px pointer-events-none rounded-xl z-0"
          style={{
            background: 'radial-gradient(ellipse 55% 25% at 50% 75%, hsl(160 100% 10% / 0.2), transparent 55%)',
          }}
        />
        <Card className="wallet-card-glass relative overflow-hidden border-primary/30 z-10">
          {/* Purple shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(280 68% 60% / 0.3) 30%, hsl(280 68% 70% / 0.5) 50%, hsl(280 68% 60% / 0.3) 70%, transparent 100%)',
                opacity: shimmerBurstDone ? 0.6 : 1,
                transition: 'opacity 1.2s ease-out',
                animation: shimmerBurstDone
                  ? 'zenHeaderShimmer 3.5s ease-in-out infinite both'
                  : 'zenShimmerBurst 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                willChange: 'transform',
              }}
            />
          </div>

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-r from-primary/50 to-primary/30 pointer-events-none" />

          {/* 🔵 Touch-point ripple */}
          {(isPressing || isBursting) && touchPoint && (
            <div
              className="absolute pointer-events-none rounded-full z-10"
              style={{
                left: ox, top: oy,
                width: '200%', height: '200%',
                background: `radial-gradient(circle, rgba(${WALLET_RGBA}, 0.35) 0%, transparent 70%)`,
                animation: isBursting ? 'zenTouchRipple 900ms ease-out forwards' : undefined,
                transform: isPressing && !isBursting ? 'translate(-50%, -50%) scale(0.3)' : undefined,
                opacity: isPressing && !isBursting ? 0.4 : undefined,
                transition: !isBursting ? 'transform 0.15s ease-out, opacity 0.15s ease-out' : undefined,
                willChange: 'transform, opacity',
              }}
            />
          )}

          {/* ⚡ Pressure shockwave ring */}
          {isBursting && touchPoint && (
            <div
              className="absolute pointer-events-none rounded-full z-10"
              style={{
                left: ox, top: oy,
                width: '300%', height: '300%',
                border: `3px solid rgba(${WALLET_RGBA}, 1)`,
                animation: 'zenPressureWave 800ms ease-out forwards',
                willChange: 'transform, opacity',
              }}
            />
          )}

          {/* ⚡ Flare rings + particles */}
          {isBursting && (
            <>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={`ring-${i}`}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: ox, top: oy,
                    width: 20, height: 20,
                    marginLeft: -10, marginTop: -10,
                    borderRadius: '50%',
                    border: `3px solid rgba(${WALLET_RGBA}, ${1 - i * 0.12})`,
                    animation: `zenFlareRing 900ms ${i * 120}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
              {/* Particles */}
              {Array.from({ length: 14 }).map((_, i) => {
                const angle = (i / 14) * 360 + (Math.random() * 20 - 10);
                const rad = (angle * Math.PI) / 180;
                const dist = 50 + Math.random() * 60;
                const tx = Math.cos(rad) * dist;
                const ty = Math.sin(rad) * (18 + Math.random() * 25);
                const size = 6 + Math.random() * 5;
                const rotation = Math.random() * 360;
                return (
                  <div
                    key={`p-${i}`}
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: ox, top: oy,
                      width: size, height: size,
                      background: `rgba(${WALLET_RGBA}, 1)`,
                      boxShadow: `0 0 16px rgba(${WALLET_RGBA}, 1), 0 0 32px rgba(${WALLET_RGBA}, 0.5)`,
                      clipPath: WALLET_PARTICLE_SHAPE,
                      transform: `rotate(${rotation}deg)`,
                      animation: `zenFlareParticle 900ms ${i * 30}ms ease-out forwards`,
                      willChange: 'transform, opacity',
                      '--tx': `${tx}px`,
                      '--ty': `${ty}px`,
                    } as React.CSSProperties}
                  />
                );
              })}
              {/* Energy release glow */}
              <div
                className="absolute pointer-events-none rounded-full z-10"
                style={{
                  left: ox, top: oy,
                  width: 90, height: 90,
                  marginLeft: -45, marginTop: -45,
                  background: `radial-gradient(circle, rgba(${WALLET_RGBA}, 0.9) 0%, rgba(${WALLET_RGBA}, 0.4) 40%, transparent 70%)`,
                  animation: 'zenEnergyRelease 800ms ease-out forwards',
                  willChange: 'transform, opacity',
                }}
              />
              {/* Diagonal energy sweep */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
                style={{
                  backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(${WALLET_RGBA}, 0.3) 42%, rgba(${WALLET_RGBA}, 0.5) 50%, rgba(${WALLET_RGBA}, 0.3) 58%, transparent 75%)`,
                  backgroundSize: '300% 300%',
                  animation: 'zenGridSweep 800ms ease-out forwards',
                  willChange: 'opacity, background-position',
                }}
              />
            </>
          )}

          {/* ✨ Charging-up glow */}
          {isChargingUp && (
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-10"
              style={{
                border: `2px solid rgba(${WALLET_RGBA}, 0.5)`,
                animation: 'zenChargeUpPulse 600ms ease-in-out infinite alternate',
                willChange: 'opacity, box-shadow',
                boxShadow: `inset 0 0 20px rgba(${WALLET_RGBA}, 0.1), 0 0 25px rgba(${WALLET_RGBA}, 0.3)`,
              }}
            />
          )}

          <CardContent className="relative p-3.5 z-[1]">
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Wallet icon with glow effect during burst */}
                <div className="relative" style={(isBursting || isChargingUp) ? {
                  filter: `drop-shadow(0 0 ${isBursting ? 8 : 5}px rgba(${WALLET_RGBA}, ${isBursting ? 0.8 : 0.5}))`,
                  transition: 'all 200ms ease-out',
                } : isPressing ? {
                  filter: `drop-shadow(0 0 4px rgba(${WALLET_RGBA}, 0.4))`,
                  transition: 'all 100ms ease-out',
                } : { transition: 'all 200ms ease-out' }}>
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm">
                    <Wallet className={`h-4 w-4 text-primary transition-all ${isBursting ? 'scale-125' : ''}`} />
                  </div>
                  {/* Tiny verified dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-eco border-2 border-card" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  {/* Label with tap-again hint */}
                  <div className="relative h-4 min-w-[80px] flex items-center">
                    <span 
                      className={`font-semibold text-sm text-foreground leading-tight absolute left-0 transition-all duration-300 ease-out ${showTapAgain ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}
                    >
                      My Wallet
                    </span>
                    <span 
                      className={`font-semibold text-sm text-primary leading-tight absolute left-0 transition-all duration-300 ease-out ${showTapAgain ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-[2px]'}`}
                      style={showTapAgain ? { animation: 'zenTapAgainPulse 1.2s ease-in-out infinite' } : undefined}
                    >
                      tap again
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {tokensHeld.toLocaleString()} tokens · ${tokenPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <motion.div
                  className="text-right"
                  animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span 
                    className="text-lg font-bold text-foreground tabular-nums"
                    style={isBursting ? { textShadow: `0 0 8px rgba(${WALLET_RGBA}, 0.5), 0 0 16px rgba(${WALLET_RGBA}, 0.25)`, transition: 'text-shadow 200ms ease-out' } : { transition: 'text-shadow 200ms ease-out' }}
                  >
                    ${formattedValue}
                  </span>
                </motion.div>
                {/* Chevron with stamp animation during burst */}
                <div style={isBursting ? { animation: 'zenMintStamp 400ms ease-out' } : isPressing ? { transform: 'scale(0.9)', opacity: 0.7, transition: 'all 0.1s ease-out' } : { transition: 'all 0.2s ease-out' }}>
                  <ChevronDown className={`h-4 w-4 transition-colors flex-shrink-0 ${showTapAgain ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Expanded view ──
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Outer ambient glow */}
      <div 
        className="absolute -inset-px pointer-events-none rounded-xl z-0"
        style={{
          background: 'radial-gradient(ellipse 55% 25% at 50% 75%, hsl(160 100% 10% / 0.2), transparent 55%)',
        }}
      />
      <Card className="wallet-card-glass relative overflow-hidden border-primary/30 z-10" style={{ boxShadow: '0 0 10px hsl(160 100% 10% / 0.15), 0 0 4px hsl(158 95% 8% / 0.1)' }}>
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-eco/[0.04]" />
          <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(280 68% 60% / 0.3) 30%, hsl(280 68% 70% / 0.5) 50%, hsl(280 68% 60% / 0.3) 70%, transparent 100%)',
                opacity: shimmerBurstDone ? 0.6 : 1,
                transition: 'opacity 1.2s ease-out',
                animation: shimmerBurstDone
                  ? 'zenHeaderShimmer 3.5s ease-in-out infinite both'
                  : 'zenShimmerBurst 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                willChange: 'transform',
              }}
          />
          {/* Corner accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/[0.06] blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-eco/[0.06] blur-2xl" />
        </div>

        <CardContent className="relative p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm shadow-inner shadow-primary/10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Wallet className="h-5 w-5 text-primary" />
                </motion.div>
                {/* Verified dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-eco border-2 border-card flex items-center justify-center">
                  <Check className="h-1.5 w-1.5 text-eco-foreground" />
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-foreground leading-tight block">My Wallet</span>
                <span className="text-[11px] text-muted-foreground leading-tight">$ZSOLAR Portfolio</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-eco bg-eco/10 px-2.5 py-1 rounded-full border border-eco/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-eco" />
                </span>
                <span className="font-medium">Live</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={createTouchEndHandler(() => setIsCollapsed(true))}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation"
              >
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Balance section — large & prominent */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Token Balance</p>
            <motion.div
              className="flex items-baseline gap-1"
              animate={showPulse ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{tokensHeld.toLocaleString()}</span>
              <span className="text-sm font-medium text-muted-foreground">$ZSOLAR</span>
            </motion.div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span className="tabular-nums font-medium">${formattedValue} USD</span>
              </div>
              <span className="text-muted-foreground/40">·</span>
              {/* Editable price */}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">@$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handlePriceSubmit}
                    className="h-6 w-16 text-xs font-medium p-1"
                    autoFocus
                  />
                  <button onClick={handlePriceSubmit} className="p-0.5 rounded hover:bg-muted/50">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="tabular-nums">@${tokenPrice.toFixed(2)}/token</span>
                  <Edit2 className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity italic">tap to edit</span>
                </button>
              )}
            </div>
          </div>

          {/* On-chain verified badge */}
          {tokensHeld > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-eco/[0.07] border border-eco/15">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-eco/15">
                  <ShieldCheck className="h-3.5 w-3.5 text-eco" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">On-Chain Verified</p>
                  <p className="text-[11px] text-muted-foreground">{tokensHeld.toLocaleString()} $ZSOLAR minted to your wallet</p>
                </div>
                <Check className="h-3.5 w-3.5 text-eco flex-shrink-0" />
              </div>
            </div>
          )}

          {/* NFT count row */}
          {nftCount !== undefined && (
            <div className="mb-4 flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Images className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground flex-1">
                <span className="font-semibold text-foreground tabular-nums">{nftCount}</span> NFTs {nftLabel}
              </span>
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex gap-2">
            {walletLink && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="flex-1 h-9 text-xs font-medium border-primary/20 hover:bg-primary/10 hover:border-primary/30"
              >
                <Link to={walletLink}>
                  <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  View Wallet
                </Link>
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm" 
              asChild 
              className="flex-1 h-9 text-xs font-medium"
            >
              <Link to={walletLink ? walletLink.replace('wallet', '') : '/'}>
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Mint More
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
