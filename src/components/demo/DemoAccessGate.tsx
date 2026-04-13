import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Sparkles, ShieldCheck, Sun, Zap, Battery, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logAudioDebug } from '@/lib/audioDebug';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { AudioDebugOverlay } from '@/components/demo/AudioDebugOverlay';
import { GateHexBackground } from '@/components/demo/GateHexBackground';
import { getSafeAudioStartTime, getSharedAudioContext, useMintSound } from '@/hooks/useMintSound';
import { useShimmerSound } from '@/hooks/useShimmerSound';



const LS_KEY = 'zen_demo_access';
const TTL_MS = 24 * 60 * 60 * 1000;

function isAccessGranted(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < TTL_MS;
  } catch {
    return false;
  }
}

function grantAccess() {
  localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now() }));
}

// ─── Burst particles ────
const PARTICLE_COUNT = 12;
const RGBA = '34, 197, 94';
const RGBA_GOLD = '255, 180, 60';
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const dist = 40 + Math.random() * 50;
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      size: 4 + Math.random() * 5,
      rotation: Math.random() * 360,
      alpha: 0.7 + Math.random() * 0.2,
      delay: i * 22,
      isGold: i % 4 === 0,
    };
  });
}

// ─── Timing constants ────
const DOUBLE_TAP_WINDOW = 500;
const FIRST_TAP_BURST_MS = 700;
const GHOST_CLICK_SUPPRESSION = 400;
const LOCK_FLASH_MS = 600;
const HOLD_THRESHOLD_MS = 800;     // How long user must hold before release triggers reveal
const HAPTIC_PULSE_INTERVALS = [0, 200, 400, 550, 700]; // Progressive haptic pulses during hold
interface DemoAccessGateProps {
  children: React.ReactNode;
}

// ─── Interaction state managed via ref to avoid re-render storms ────
interface GateState {
  phase: 'idle' | 'verifying' | 'burst' | 'denied';
  showTapAgain: boolean;
  firstTapBurst: boolean;
  burstKey: number;
  revealed: boolean;
  hexAwake: boolean;
  holding: boolean;       // true while finger is down & charging
  holdReady: boolean;     // true once hold threshold met (ring filled)
  holdHint: boolean;      // "hold longer" nudge after premature release
}

export function DemoAccessGate({ children }: DemoAccessGateProps) {
  const [granted, setGranted] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      localStorage.removeItem(LS_KEY);
      window.history.replaceState({}, '', window.location.pathname);
      return false;
    }
    return isAccessGranted();
  });
  const [code, setCode] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const showAudioDebug = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('audio-debug');
  }, []);
  

  // ── stateRef pattern: single ref holds all interaction state ──
  const stateRef = useRef<GateState>({
    phase: 'idle',
    showTapAgain: false,
    firstTapBurst: false,
    burstKey: 0,
    revealed: false,
    hexAwake: false,
    holding: false,
    holdReady: false,
    holdHint: false,
  });
  const [, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  const updateState = useCallback((patch: Partial<GateState>) => {
    Object.assign(stateRef.current, patch);
    forceRender();
  }, [forceRender]);

  const inputRef = useRef<HTMLInputElement>(null);
  const lockButtonRef = useRef<HTMLButtonElement>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignorePointerUntilRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = useRef<number>(0);
  const nativeGestureReadyRef = useRef(false);
  const fallbackGestureTimeRef = useRef(0);

  const { primeAudio, playDeniedSound, playMintSound, playWelcomeTap, playSingingBowl } = useMintSound();
  const startShimmerSound = useShimmerSound({ cycleDuration: 5, volume: 0.06, enabled: stateRef.current.hexAwake, prewarm: false });

  useEffect(() => {
    if (!showAudioDebug) return;
    logAudioDebug('access-gate-debug-enabled', { path: window.location.pathname });
  }, [showAudioDebug]);

  const logGestureDebug = useCallback((eventName: string, details?: Record<string, unknown>) => {
    const ctx = getSharedAudioContext();
    logAudioDebug(eventName, {
      ctx: ctx?.state ?? 'null',
      ...details,
    });
  }, []);

  // Stable particles — only regenerate on burstKey change
  const particles = useMemo(
    () => generateParticles(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateRef.current.burstKey]
  );

  // No auto-focus — let user take in the full page experience first

  // Track the visual viewport so mobile browser chrome never exposes a dead strip
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (!containerRef.current) return;
      const visibleHeight = Math.ceil(viewport?.height ?? window.innerHeight);
      const visibleOffsetTop = Math.max(Math.ceil(viewport?.offsetTop ?? 0), 0);
      const coverageHeight = Math.max(
        visibleHeight,
        window.innerHeight,
        document.documentElement.clientHeight,
        window.screen?.height ?? 0
      );

      containerRef.current.style.setProperty('--gate-visible-height', `${visibleHeight}px`);
      containerRef.current.style.setProperty('--gate-visible-offset-top', `${visibleOffsetTop}px`);
      containerRef.current.style.height = `${coverageHeight}px`;
      containerRef.current.style.minHeight = `${coverageHeight}px`;
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      if (lockFlashTimerRef.current) clearTimeout(lockFlashTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  // ── Core submit logic ──
  const submitCode = useCallback(async () => {
    const trimmed = code.trim();
    const s = stateRef.current;
    if (!trimmed || s.phase === 'verifying' || s.phase === 'burst') return;

    updateState({ phase: 'verifying', showTapAgain: false });
    

    try {
      const { data, error } = await supabase.rpc('verify_demo_code', { _code: trimmed });
      if (error) throw error;

      if (data === true) {
        updateState({ phase: 'burst', burstKey: s.burstKey + 1 });
        playMintSound();

        if ('vibrate' in navigator) {
          try { navigator.vibrate([15, 30, 10]); } catch {}
        }

        setTimeout(() => {
          // Blur input to dismiss keyboard & reset iOS viewport zoom before revealing app
          inputRef.current?.blur();
          // Force viewport zoom reset on iOS
          const vp = document.querySelector('meta[name="viewport"]');
          if (vp) {
            const original = vp.getAttribute('content') || '';
            vp.setAttribute('content', original.replace(/maximum-scale=[^,]*/,'maximum-scale=1.0'));
            requestAnimationFrame(() => {
              vp.setAttribute('content', original);
            });
          }
          grantAccess();
          setGranted(true);
        }, 1000);
      } else {
        updateState({ phase: 'denied' });
        playDeniedSound();
        toast.error('Invalid access code', { description: 'Please check your code and try again.' });

        setTimeout(() => {
          updateState({ phase: 'idle' });
          setCode('');
          lastTapTimeRef.current = 0;
          inputRef.current?.focus();
        }, 600);
      }
    } catch {
      updateState({ phase: 'idle' });
      toast.error('Connection error', { description: 'Please try again.' });
    }
  }, [code, playMintSound, playDeniedSound, updateState]);

  // ── Trigger first-tap burst (shared between single & double) ──
  const triggerBurst = useCallback(() => {
    const s = stateRef.current;
    updateState({ firstTapBurst: true, burstKey: s.burstKey + 1 });

    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => {
      updateState({ firstTapBurst: false });
    }, FIRST_TAP_BURST_MS);
  }, [updateState]);

  // ── Hold-to-unlock gesture ──
  // On press: prime audio synchronously (iOS gesture context), start charging ring.
  // On release after HOLD_THRESHOLD_MS: fire cinematic gong + curtain.
  // On release too early: show "hold longer" hint.

  const handleHoldStart = useCallback((source = 'pointerdown') => {
    if (Date.now() < ignorePointerUntilRef.current) {
      logGestureDebug(`${source}-ignored-ghost-click`);
      return;
    }

    const ctx = primeAudio();
    if (!ctx) {
      logGestureDebug(`${source}-prime-audio-missed`);
    }

    const s = stateRef.current;
    if (s.phase === 'verifying' || s.phase === 'burst') return;

    holdStartRef.current = Date.now();
    updateState({ holding: true, holdReady: false, holdHint: false });
    logGestureDebug(`${source}-hold-start`);

    if ('vibrate' in navigator) {
      try { navigator.vibrate([10]); } catch {}
    }

    // After threshold, mark as ready (ring fills)
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      updateState({ holdReady: true });
      if ('vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 15]); } catch {}
      }
      logGestureDebug(`${source}-hold-ready`);
    }, HOLD_THRESHOLD_MS);
  }, [logGestureDebug, primeAudio, updateState]);

  const handleHoldEnd = useCallback((source = 'pointerup') => {
    const s = stateRef.current;
    if (!s.holding) return;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;

    const held = Date.now() - holdStartRef.current;
    updateState({ holding: false });
    logGestureDebug(`${source}-hold-end`, { held });

    if (held < HOLD_THRESHOLD_MS) {
      // Released too early — nudge
      updateState({ holdHint: true });
      if (lockFlashTimerRef.current) clearTimeout(lockFlashTimerRef.current);
      lockFlashTimerRef.current = setTimeout(() => {
        updateState({ holdHint: false });
      }, 2000);
      return;
    }

    // Held long enough — fire cinematic reveal!
    const ctx = getSharedAudioContext();
    const gestureStartTime = ctx
      ? getSafeAudioStartTime(ctx, undefined, 0)
      : undefined;

    if (!s.hexAwake) {
      playSingingBowl(gestureStartTime);
      startShimmerSound(gestureStartTime);
      logGestureDebug(`${source}-cinematic-reveal`, { start: gestureStartTime });
    } else {
      // Already awake — play welcome tap for subsequent holds
      playWelcomeTap(gestureStartTime);
      logGestureDebug(`${source}-welcome-tap`, { start: gestureStartTime });
    }

    triggerBurst();
    updateState({ showTapAgain: true, revealed: true, hexAwake: true, holdReady: false });
    ignorePointerUntilRef.current = Date.now() + GHOST_CLICK_SUPPRESSION;

    if (lockFlashTimerRef.current) clearTimeout(lockFlashTimerRef.current);
    lockFlashTimerRef.current = setTimeout(() => {
      updateState({ revealed: false });
    }, LOCK_FLASH_MS);
  }, [logGestureDebug, triggerBurst, playSingingBowl, startShimmerSound, playWelcomeTap, updateState]);

  // ── Double-tap to unlock (submit code) — still works after reveal ──
  const handleLockPointerDown = useCallback((source = 'pointerdown') => {
    if (Date.now() < ignorePointerUntilRef.current) return;

    const s = stateRef.current;
    if (s.phase === 'verifying' || s.phase === 'burst') return;

    const now = Date.now();
    const isDoubleTap = lastTapTimeRef.current > 0 && now - lastTapTimeRef.current < DOUBLE_TAP_WINDOW;

    if (isDoubleTap && s.hexAwake) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;
      triggerBurst();
      playMintSound();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 10]); } catch {}
      }
      ignorePointerUntilRef.current = now + GHOST_CLICK_SUPPRESSION;
      if (code.trim()) submitCode();
    } else {
      lastTapTimeRef.current = now;
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        updateState({ showTapAgain: false });
      }, DOUBLE_TAP_WINDOW);
    }
  }, [code, triggerBurst, playMintSound, submitCode, updateState]);

  const handlePreboundGestureFallback = useCallback(() => {
    if (nativeGestureReadyRef.current) return;
    const now = performance.now();
    if (now - fallbackGestureTimeRef.current < 80) return;
    fallbackGestureTimeRef.current = now;
    handleHoldStart('react-fallback');
  }, [handleHoldStart]);

  // Native event listeners for iOS gesture-chain audio unlock
  useLayoutEffect(() => {
    const btn = lockButtonRef.current;
    if (!btn) return;
    nativeGestureReadyRef.current = true;
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleHoldStart('touchstart');
      handleLockPointerDown('touchstart');
      logGestureDebug('touchstart');
    };
    const onTouchEnd = () => {
      handleHoldEnd('touchend');
      logGestureDebug('touchend');
    };
    const onTouchCancel = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      updateState({ holding: false, holdReady: false });
      logGestureDebug('touchcancel');
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      handleHoldStart(`pointerdown-${e.pointerType}`);
      handleLockPointerDown(`pointerdown-${e.pointerType}`);
      logGestureDebug('pointerdown', { pointerType: e.pointerType });
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      handleHoldEnd(`pointerup-${e.pointerType}`);
    };
    const onClick = () => {
      logGestureDebug('click');
    };
    btn.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
    btn.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    btn.addEventListener('touchcancel', onTouchCancel, { capture: true, passive: true });
    btn.addEventListener('pointerdown', onPointer, true);
    btn.addEventListener('pointerup', onPointerUp, true);
    btn.addEventListener('click', onClick, true);
    return () => {
      nativeGestureReadyRef.current = false;
      btn.removeEventListener('touchstart', onTouchStart, true);
      btn.removeEventListener('touchend', onTouchEnd, true);
      btn.removeEventListener('touchcancel', onTouchCancel, true);
      btn.removeEventListener('pointerdown', onPointer, true);
      btn.removeEventListener('pointerup', onPointerUp, true);
      btn.removeEventListener('click', onClick, true);
    };
  }, [handleHoldStart, handleHoldEnd, handleLockPointerDown, logGestureDebug, updateState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      primeAudio();
      submitCode();
    }
  };

  // Show unlock hint when input is focused or has text
  const showUnlockHint = inputFocused || code.trim().length > 0;

  if (granted) return <>{children}</>;

  const { phase, firstTapBurst, showTapAgain, burstKey, revealed, hexAwake, holding, holdReady, holdHint } = stateRef.current;
  const isBursting = phase === 'burst';
  const isDenied = phase === 'denied';
  const isVerifying = phase === 'verifying';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden touch-none"
      style={{
        backgroundColor: hexAwake ? 'hsl(var(--background))' : 'hsl(var(--gate-splash-background))',
        overscrollBehavior: 'none',
        minHeight: '100dvh',
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      {showAudioDebug && <AudioDebugOverlay />}

      <div
        className="absolute inset-0"
        style={{
          touchAction: 'none',
          width: '100%',
          height: '100%',
          opacity: hexAwake ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
        }}
      >
        <GateHexBackground activated={hexAwake} />
      </div>

      {/* Radial vignette */}
      <div className={cn("absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)] pointer-events-none transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')} />

      {/* Ghost dashboard teaser */}
      <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
        <div className="w-full max-w-md px-6 opacity-[0.04] blur-[2px] flex flex-col gap-4 mt-40">
          <div className="flex gap-3">
            {[
              { icon: Sun, label: '12.4 kWh' },
              { icon: Battery, label: '8.2 kWh' },
              { icon: Car, label: '34 mi' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex-1 rounded-xl border border-foreground/20 p-3 flex flex-col items-center gap-1">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-mono">{label}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-foreground/20 h-24 flex items-end px-3 pb-2 gap-1">
            {[40, 65, 55, 80, 70, 90, 60, 75, 85, 50, 95, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-foreground/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="rounded-xl border border-foreground/20 p-3 flex items-center gap-3">
            <Zap className="h-5 w-5" />
            <div className="flex-1">
              <div className="h-2 w-20 bg-foreground/20 rounded" />
              <div className="h-3 w-32 bg-foreground/20 rounded mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Central content */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: 'var(--gate-visible-offset-top, 0px)',
          height: 'var(--gate-visible-height, 100dvh)',
        }}
      >
        <div className={cn("relative mx-auto flex h-full max-w-sm w-full flex-col items-center justify-center px-6 pointer-events-none", hexAwake ? 'gap-8' : 'gap-4')}>
          {/* Logo */}
          <img
            src={zenLogo}
            alt="ZenSolar"
            className={cn("h-8 w-auto object-contain transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}
            style={{ filter: 'drop-shadow(0 0 12px hsl(142 76% 36% / 0.45)) brightness(1.8)' }}
          />

          {/* $Z / Lock icon with burst effect */}
          <div className="relative pointer-events-auto" style={{ touchAction: 'manipulation', contain: 'layout style' }}>
            {/* Beckoning glow ring — GPU-composited opacity+transform only */}
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                boxShadow: '0 0 0 3px hsl(var(--primary) / 0.3), 0 0 24px 6px hsl(var(--primary) / 0.15), 0 0 50px 12px hsl(var(--primary) / 0.06)',
                animation: 'zenLockBeckon 3.5s ease-in-out infinite',
              }}
            />

            {/* Orbiting Tap-to-Mint™️ badge */}
            {!isBursting && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  animation: 'zenOrbit 8s linear infinite',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                }}
              >
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-bold tracking-wider bg-primary/15 border border-primary/30 rounded-full px-2 py-0.5 backdrop-blur-sm"
                  style={{
                    textShadow: '0 0 10px hsl(var(--primary) / 0.55)',
                  }}
                >
                  <span className="text-primary">Tap-to-Mint</span>
                  <span className="text-solar">™</span>
                </span>
              </div>
            )}

            <button
              ref={lockButtonRef}
              disabled={isVerifying || isBursting}
              className={cn(
                'relative w-20 h-20 rounded-full flex items-center justify-center touch-manipulation select-none overflow-visible cursor-pointer',
                holding && 'scale-[0.92]',
                isBursting
                  ? 'bg-primary/30 scale-[0.92]'
                  : isDenied
                    ? 'bg-destructive/30 animate-shake'
                    : isVerifying
                      ? 'bg-primary/20 animate-pulse'
                      : firstTapBurst
                        ? 'bg-primary/30 scale-[0.92]'
                        : 'bg-primary/20 hover:bg-primary/30 hover:scale-105',
              )}
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                boxShadow: isBursting || firstTapBurst
                  ? '0 0 40px hsl(var(--primary) / 0.5)'
                  : isDenied
                    ? '0 0 40px hsl(var(--destructive) / 0.5)'
                    : '0 0 24px hsl(var(--primary) / 0.3)',
                transform: 'scale(1)',
                transition: firstTapBurst
                  ? 'background-color 60ms, box-shadow 60ms'
                  : 'background-color 200ms, box-shadow 200ms',
                animation: (!firstTapBurst && !isBursting && !isDenied && !isVerifying)
                  ? 'zenCircleBreathe 2.8s ease-in-out infinite'
                  : 'none',
              }}
              onTouchStartCapture={(e) => {
                if (nativeGestureReadyRef.current) return;
                e.preventDefault();
                handlePreboundGestureFallback();
              }}
              onPointerDownCapture={() => {
                handlePreboundGestureFallback();
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLockPointerDown('keyboard'); } }}
            >
              {isBursting ? (
                <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
              ) : revealed ? (
                <Lock
                  className="h-8 w-8 text-primary"
                  style={{ animation: 'zenSymbolFadeIn 200ms ease-out both' }}
                />
              ) : (
                <span
                  className="select-none font-black"
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: 'hsl(142, 76%, 42%, 0.9)',
                    textShadow: '0 0 16px hsl(142 76% 42% / 0.55), 0 0 32px hsl(142 76% 42% / 0.25)',
                    willChange: 'transform, opacity',
                    animation: firstTapBurst
                      ? 'zenSymbolFadeOut 200ms ease-out both'
                      : 'none',
                  }}
                >
                  $Z
                </span>
              )}

              {/* First-tap burst particles (KPI-style impact) */}
              {firstTapBurst && !isBursting && particles.map((p, i) => (
                <div
                  key={`fp-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: p.size,
                    height: p.size,
                    background: `rgba(${p.isGold ? RGBA_GOLD : '255,255,255'}, ${p.alpha * 0.85})`,
                    boxShadow: `0 0 ${p.isGold ? 12 : 8}px rgba(${p.isGold ? RGBA_GOLD : RGBA}, 0.6)`,
                    clipPath: PARTICLE_SHAPE,
                    transform: `rotate(${p.rotation}deg)`,
                    animation: `zenFlareParticle 650ms ${p.delay}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}

              {/* First-tap ripple */}
              {firstTapBurst && !isBursting && (
                <div
                  key={`fr-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '280%',
                    height: '280%',
                    background: 'radial-gradient(circle, rgba(255,200,60,0.18) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
                    animation: 'zenTouchRipple 650ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {/* Success burst particles */}
              {isBursting && particles.map((p, i) => (
                <div
                  key={`p-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: p.size,
                    height: p.size,
                    background: `rgba(255,255,255, ${p.alpha})`,
                    boxShadow: `0 0 8px rgba(${RGBA}, 0.6)`,
                    clipPath: PARTICLE_SHAPE,
                    transform: `rotate(${p.rotation}deg)`,
                    animation: `zenFlareParticle 800ms ${p.delay}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Burst ripple */}
              {isBursting && (
                <div
                  key={`ripple-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '300%',
                    height: '300%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    animation: 'zenTouchRipple 800ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {/* Burst glow */}
              {isBursting && (
                <div
                  key={`glow-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 100,
                    height: 100,
                    marginLeft: -50,
                    marginTop: -50,
                    background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(${RGBA}, 0.2) 40%, transparent 70%)`,
                    animation: 'zenEnergyRelease 700ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}
            </button>
          </div>

          {/* Hold progress ring — visible while holding */}
          {holding && (
            <div className="pointer-events-none" style={{ animation: 'zenSymbolFadeIn 100ms ease-out both' }}>
              <svg width="96" height="96" viewBox="0 0 96 96" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ marginTop: '-48px', marginLeft: '-48px' }}>
                <circle
                  cx="48" cy="48" r="44"
                  fill="none"
                  stroke={holdReady ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    animation: `zenHoldRingFill ${HOLD_THRESHOLD_MS}ms linear forwards`,
                    transformOrigin: 'center',
                    transform: 'rotate(-90deg)',
                  }}
                />
              </svg>
            </div>
          )}

          {/* Hold hint — shown after premature release */}
          {holdHint && !hexAwake && (
            <div
              className="text-center pointer-events-none"
              style={{ animation: 'zenSymbolFadeIn 300ms ease-out both' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide rounded-full px-3 py-1"
                style={{
                  color: 'hsl(var(--primary))',
                  background: 'hsl(var(--primary) / 0.1)',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                  textShadow: '0 0 8px hsl(var(--primary) / 0.4)',
                }}
              >
                hold a bit longer ✨
              </span>
            </div>
          )}

          {/* Title */}
          <div className={cn("text-center space-y-1 transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
            <h1 className="text-lg font-semibold text-foreground drop-shadow-[0_0_6px_hsl(var(--primary)/0.2)]">Private Demo</h1>
            <p className="text-sm text-foreground/70">Enter your access code to continue</p>
          </div>

          {/* Code input — hidden until first tap */}
          <div className={cn("w-full px-4 space-y-3 pointer-events-auto transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Access code"
              disabled={isVerifying || isBursting}
              className={cn(
                'text-center font-mono tracking-wider h-12 transition-all text-[16px]',
                isBursting && 'border-primary bg-primary/5',
                isDenied && 'border-destructive bg-destructive/5 animate-shake'
              )}
              autoComplete="off"
              autoCapitalize="off"
            />

            {/* Unlock hint — only shown after awake */}
            <div className="flex justify-center h-8">
              {showUnlockHint ? (
                <span
                  className="text-xs font-semibold text-primary flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30"
                  style={{ animation: 'zenSymbolFadeIn 300ms ease-out both' }}
                >
                  <Lock className="h-3 w-3" />
                  double tap $Z to unlock
                </span>
              ) : (
                <span className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {revealed ? 'double tap to unlock' : 'press & hold $Z'}
                </span>
              )}
            </div>
          </div>

          {/* Pre-tap hint — visible only before first tap, hidden after */}
          {!hexAwake && !holdHint && (
            <div className="flex justify-center">
              <span className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                press &amp; hold the $Z
              </span>
            </div>
          )}

          {/* Fine print */}
          <p className={cn("text-[10px] text-muted-foreground/70 text-center pointer-events-auto transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
            Request access at{' '}
            <a href="mailto:joe@zen.solar" className="underline hover:text-muted-foreground">
              joe@zen.solar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
