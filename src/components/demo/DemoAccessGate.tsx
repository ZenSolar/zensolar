import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Sparkles, ShieldCheck, Sun, Zap, Battery, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { GateHexBackground } from '@/components/demo/GateHexBackground';

const LS_KEY = 'zen_demo_access';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

// ─── Burst particles (reused from MintEffectButton aesthetic) ────
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

interface DemoAccessGateProps {
  children: React.ReactNode;
}

export function DemoAccessGate({ children }: DemoAccessGateProps) {
  // ?reset query param clears the stored access for easy testing
  const [granted, setGranted] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      localStorage.removeItem(LS_KEY);
      // Clean the URL without reload
      window.history.replaceState({}, '', window.location.pathname);
      return false;
    }
    return isAccessGranted();
  });
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'idle' | 'verifying' | 'burst' | 'denied'>('idle');
  const [burstKey, setBurstKey] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const particles = generateParticles();

  // Focus input on mount
  useEffect(() => {
    if (!granted) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [granted]);

  const handleSubmit = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed || phase === 'verifying' || phase === 'burst') return;

    setPhase('verifying');
    setShowHint(false);

    try {
      const { data, error } = await supabase.rpc('verify_demo_code', { _code: trimmed });

      if (error) throw error;

      if (data === true) {
        // Success burst!
        setPhase('burst');
        setBurstKey(k => k + 1);

        if ('vibrate' in navigator) {
          try { navigator.vibrate([15, 30, 10]); } catch {}
        }

        setTimeout(() => {
          grantAccess();
          setGranted(true);
        }, 1000);
      } else {
        setPhase('denied');
        toast.error('Invalid access code', { description: 'Please check your code and try again.' });

        if ('vibrate' in navigator) {
          try { navigator.vibrate([50, 30, 50]); } catch {}
        }

        setTimeout(() => {
          setPhase('idle');
          setCode('');
          inputRef.current?.focus();
        }, 600);
      }
    } catch {
      setPhase('idle');
      toast.error('Connection error', { description: 'Please try again.' });
    }
  }, [code, phase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // Show hint after typing starts
  useEffect(() => {
    if (code.length > 0 && phase === 'idle') {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [code, phase]);

  if (granted) return <>{children}</>;

  const isBursting = phase === 'burst';
  const isDenied = phase === 'denied';
  const isVerifying = phase === 'verifying';

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden">
      {/* Frenetic hex background — alive, urgent, teasing energy */}
      <div className="absolute inset-0 opacity-[0.55]">
        <GateHexBackground />
      </div>

      {/* Radial vignette to focus attention on center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)]" />

      {/* Ghost dashboard teaser — blurred silhouette visible behind the gate */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="w-full max-w-md px-6 opacity-[0.04] blur-[2px] flex flex-col gap-4 mt-40">
          {/* Fake KPI cards */}
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
          {/* Fake chart area */}
          <div className="rounded-xl border border-foreground/20 h-24 flex items-end px-3 pb-2 gap-1">
            {[40, 65, 55, 80, 70, 90, 60, 75, 85, 50, 95, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-foreground/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          {/* Fake token balance */}
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
        <div className="relative">
          <button
            onClick={handleSubmit}
            disabled={!code.trim() || isVerifying || isBursting}
            className={cn(
              'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 touch-manipulation select-none overflow-visible',
              isBursting
                ? 'bg-primary/30 scale-110'
                : isDenied
                  ? 'bg-destructive/20 animate-shake'
                  : isVerifying
                    ? 'bg-primary/20 animate-pulse'
                    : code.trim()
                      ? 'bg-primary/20 hover:bg-primary/30 hover:scale-105 cursor-pointer shadow-[0_0_30px_hsl(var(--primary)/0.3)]'
                      : 'bg-muted/50'
            )}
          >
            {isBursting ? (
              <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
            ) : (
              <Lock className={cn(
                'h-8 w-8 transition-colors',
                code.trim() ? 'text-primary' : 'text-muted-foreground'
              )} />
            )}

            {/* Burst particles */}
            {isBursting && particles.map((p, i) => (
              <div
                key={`p-${burstKey}-${i}`}
                className="absolute"
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
                className="absolute rounded-full"
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
                className="absolute rounded-full"
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

          {/* Tap hint */}
          <div className="flex justify-center h-6">
            <span
              className={cn(
                'text-xs text-primary/80 flex items-center gap-1.5 transition-all duration-300',
                showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              )}
            >
              <Sparkles className="h-3 w-3" />
              tap the lock to enter
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
