import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Sparkles, ShieldCheck, Sun, Zap, Battery, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { GateHexBackground } from '@/components/demo/GateHexBackground';
import { useMintSound } from '@/hooks/useMintSound';

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
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const dist = 50 + Math.random() * 60;
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * 360,
      alpha: 0.85 + Math.random() * 0.15,
      delay: i * 25,
    };
  });
}

// ─── Timing constants ────
const DOUBLE_TAP_WINDOW = 500;
const FIRST_TAP_BURST_MS = 700;    // Snappy first-tap visual
const GHOST_CLICK_SUPPRESSION = 400;

interface DemoAccessGateProps {
  children: React.ReactNode;
}

// ─── Interaction state managed via ref to avoid re-render storms ────
interface GateState {
  phase: 'idle' | 'verifying' | 'burst' | 'denied';
  showTapAgain: boolean;
  firstTapBurst: boolean;
  burstKey: number;
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
  const [showHint, setShowHint] = useState(false);

  // ── stateRef pattern: single ref holds all interaction state ──
  const stateRef = useRef<GateState>({
    phase: 'idle',
    showTapAgain: false,
    firstTapBurst: false,
    burstKey: 0,
  });
  const [, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  const updateState = useCallback((patch: Partial<GateState>) => {
    Object.assign(stateRef.current, patch);
    forceRender();
  }, [forceRender]);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignorePointerUntilRef = useRef<number>(0);

  const { primeAudio, playDeniedSound, playMintSound, playWelcomeTap } = useMintSound();

  // Stable particles — only regenerate on burstKey change
  const particles = useMemo(
    () => generateParticles(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateRef.current.burstKey]
  );

  // Focus input on mount
  useEffect(() => {
    if (!granted) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [granted]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  // ── Core submit logic ──
  const submitCode = useCallback(async () => {
    const trimmed = code.trim();
    const s = stateRef.current;
    if (!trimmed || s.phase === 'verifying' || s.phase === 'burst') return;

    updateState({ phase: 'verifying', showTapAgain: false });
    setShowHint(false);

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

  // ── Pointer handler: fires on pointerdown for zero-latency response ──
  const handleLockPointerDown = useCallback((e: React.PointerEvent) => {
    // Suppress ghost clicks
    if (Date.now() < ignorePointerUntilRef.current) return;
    e.preventDefault();

    primeAudio();
    const s = stateRef.current;
    if (s.phase === 'verifying' || s.phase === 'burst') return;

    const now = Date.now();
    const isDoubleTap = lastTapTimeRef.current > 0 && now - lastTapTimeRef.current < DOUBLE_TAP_WINDOW;

    if (isDoubleTap) {
      // ⚡ DOUBLE TAP — submit only if code entered, otherwise just burst
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;

      triggerBurst();
      playMintSound();

      if ('vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 10]); } catch {}
      }

      ignorePointerUntilRef.current = now + GHOST_CLICK_SUPPRESSION;
      if (code.trim()) {
        submitCode();
      }
    } else {
      // ── FIRST TAP ── welcome chime + visual burst + hint
      lastTapTimeRef.current = now;

      triggerBurst();
      updateState({ showTapAgain: true });
      playWelcomeTap();

      if ('vibrate' in navigator) {
        try { navigator.vibrate([10]); } catch {}
      }

      // Clear tap window
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        updateState({ showTapAgain: false });
      }, DOUBLE_TAP_WINDOW);
    }
  }, [code, primeAudio, submitCode, triggerBurst, playWelcomeTap, playMintSound, updateState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      primeAudio();
      submitCode();
    }
  };

  // Show hint after typing starts
  useEffect(() => {
    if (code.length > 0 && stateRef.current.phase === 'idle' && !stateRef.current.showTapAgain) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [code]);

  if (granted) return <>{children}</>;

  const { phase, firstTapBurst, showTapAgain, burstKey } = stateRef.current;
  const isBursting = phase === 'burst';
  const isDenied = phase === 'denied';
  const isVerifying = phase === 'verifying';

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden">
      {/* Frenetic hex background */}
      <div className="absolute inset-0 opacity-[0.55]">
        <GateHexBackground />
      </div>

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)]" />

      {/* Ghost dashboard teaser */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
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
      <div className="relative flex flex-col items-center gap-8 px-6 max-w-sm w-full">
        {/* Logo */}
        <img
          src={zenLogo}
          alt="ZenSolar"
          className="h-8 w-auto object-contain dark:brightness-150 drop-shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
        />

        {/* Lock icon with burst effect */}
        <div className="relative" style={{ touchAction: 'manipulation' }}>
          <button
            onPointerDown={handleLockPointerDown}
            onClick={(e) => e.preventDefault()}
            disabled={!code.trim() || isVerifying || isBursting}
            className={cn(
              'relative w-20 h-20 rounded-full flex items-center justify-center touch-manipulation select-none overflow-visible',
              'transition-[background-color,box-shadow] duration-150',
              isBursting
                ? 'bg-primary/30 scale-110'
                : isDenied
                  ? 'bg-destructive/20 animate-shake'
                  : isVerifying
                    ? 'bg-primary/20 animate-pulse'
                    : firstTapBurst
                      ? 'bg-primary/25 scale-[1.08] shadow-[0_0_40px_hsl(var(--primary)/0.5)]'
                      : code.trim()
                        ? 'bg-primary/20 hover:bg-primary/30 hover:scale-105 cursor-pointer shadow-[0_0_30px_hsl(var(--primary)/0.3)]'
                        : 'bg-muted/50'
            )}
            style={{
              transition: firstTapBurst
                ? 'transform 80ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 80ms, box-shadow 80ms'
                : 'transform 200ms, background-color 200ms, box-shadow 200ms',
            }}
          >
            {isBursting ? (
              <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <Lock className={cn(
                'h-8 w-8 transition-colors duration-100',
                code.trim() ? 'text-primary' : 'text-muted-foreground'
              )} />
            )}

            {/* First-tap burst particles (KPI-style impact) */}
            {firstTapBurst && !isBursting && particles.map((p, i) => (
              <div
                key={`fp-${burstKey}-${i}`}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  width: p.size * 0.7,
                  height: p.size * 0.7,
                  background: `rgba(255,255,255, ${p.alpha * 0.6})`,
                  boxShadow: `0 0 6px rgba(${RGBA}, 0.4)`,
                  clipPath: PARTICLE_SHAPE,
                  transform: `rotate(${p.rotation}deg)`,
                  animation: `zenFlareParticle 500ms ${p.delay}ms ease-out forwards`,
                  willChange: 'transform, opacity',
                  '--tx': `${p.tx * 0.5}px`,
                  '--ty': `${p.ty * 0.5}px`,
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
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  animation: 'zenTouchRipple 500ms ease-out forwards',
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

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold text-foreground">Private Demo</h1>
          <p className="text-sm text-muted-foreground">Enter your access code to continue</p>
        </div>

        {/* Code input */}
        <div className="w-full space-y-3">
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Access code"
            disabled={isVerifying || isBursting}
            className={cn(
              'text-center font-mono text-sm tracking-wider h-12 transition-all',
              isBursting && 'border-primary bg-primary/5',
              isDenied && 'border-destructive bg-destructive/5 animate-shake'
            )}
            autoComplete="off"
            autoCapitalize="off"
          />

          {/* Tap hint — always visible */}
          <div className="flex justify-center h-6">
            <span className="text-xs text-primary/80 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              double tap to unlock
            </span>
          </div>
        </div>

        {/* Fine print */}
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Request access at{' '}
          <a href="mailto:joe@zen.solar" className="underline hover:text-muted-foreground">
            joe@zen.solar
          </a>
        </p>
      </div>
    </div>
  );
}
