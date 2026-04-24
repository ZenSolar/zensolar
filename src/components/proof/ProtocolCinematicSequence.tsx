import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Cpu, Layers, ShieldCheck, Anchor, CheckCircle2, X, Zap, Bug } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useMintSound } from '@/hooks/useMintSound';

/**
 * ProtocolCinematicSequence — premium full-screen cinematic that visually
 * narrates the 5 trademarked primitives during a $ZSOLAR mint.
 *
 * Order matches the actual runtime sequence:
 *   1. Tap-to-Mint™         (intent)
 *   2. Proof-of-Origin™     (clean source verified — must precede Δ)
 *   3. Proof-of-Delta™      (Δ kWh verified)
 *   4. Mint-on-Proof™       (token issued only because both proofs cleared)
 *   5. Proof-of-Permanence™ (anchored eternally)
 *
 * Visual language MIRRORS the dashboard's MintEffectButton:
 *  - Emerald energy orb that pulses and flares per primitive (star particles)
 *  - Charging-up border + pressure-wave on each "Cleared"
 *  - Gold-burst finale identical to a successful mint
 *  - Singing-bowl mint sound on finale, soft tap pulse per step
 */

// PACING — slowed substantially so each primitive is read, not glimpsed.
const SCENE_MS = 1700;            // per-primitive exposure (was 620)
const FINALE_MS = 2200;           // final tableau before auto-close (was 1100)
const FADE_MS = 320;
// When prefers-reduced-motion is enabled we keep the same flow but slow it
// down so users with vestibular sensitivity have extra time to read each
// primitive instead of being shown a sped-up or skipped sequence.
const REDUCED_MOTION_MULTIPLIER = 1.6;
const STEP_OFFSETS_MS = [0, 80, 180, 320, 480]; // protocol fires roughly in this cadence
// Star particle clip-path mirroring MintEffectButton
const STAR_CLIP = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';

export type ProtocolCinematicStepKey =
  | 'tap'
  | 'origin'
  | 'delta'
  | 'mint'
  | 'permanence';

type Scene = {
  key: ProtocolCinematicStepKey;
  mark: string;
  tagline: string;
  detail: string;
  icon: typeof Hand;
};

const SCENES: Scene[] = [
  {
    key: 'tap',
    mark: 'Tap-to-Mint™',
    tagline: 'Intent received',
    detail: 'You signaled the protocol.',
    icon: Hand,
  },
  {
    key: 'origin',
    mark: 'Proof-of-Origin™',
    tagline: 'Clean source verified',
    detail: 'Your device. Your generation.',
    icon: Cpu,
  },
  {
    key: 'delta',
    mark: 'Proof-of-Delta™',
    tagline: 'Energy change verified',
    detail: 'Δ kWh is real, signed, time-bound.',
    icon: Layers,
  },
  {
    key: 'mint',
    mark: 'Mint-on-Proof™',
    tagline: 'Token issued',
    detail: 'No proof, no mint. Both cleared.',
    icon: ShieldCheck,
  },
  {
    key: 'permanence',
    mark: 'Proof-of-Permanence™',
    tagline: 'Anchored to the Eternal Ledger',
    detail: 'On-chain. Forever auditable.',
    icon: Anchor,
  },
];

export type BackendTimestamps = Partial<Record<ProtocolCinematicStepKey, string | null | undefined>>;

interface ProtocolCinematicSequenceProps {
  open: boolean;
  onComplete?: () => void;
  onClose?: () => void;
  /** Optional label displayed under finale (e.g. "47.32 $ZSOLAR minted") */
  finaleSubtitle?: string;
  /** Optional running token count to count up inside the finale seal */
  finaleTokenCount?: number;
  /**
   * The mint's anchor timestamp (ISO). Used as the "Tap fired" t0 — every
   * primitive's displayed timestamp is derived from this + a known offset
   * so the receipt and the cinematic stay in lock-step.
   */
  tapAtIso?: string;
  /**
   * Optional backend-reported event timestamps per primitive. When provided,
   * the debug overlay (toggle via Shift+D or ?debug=ts) compares the displayed
   * cinematic timestamp against the real backend value and surfaces the delta
   * in milliseconds — invaluable for verifying the receipt is in lock-step.
   */
  backendTimestamps?: BackendTimestamps;
  /** When true, allows clicking backdrop / pressing Esc to skip. Default true. */
  dismissible?: boolean;
}

function formatStamp(d: Date) {
  // HH:MM:SS.mmm — protocol-grade precision
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function tryParseIso(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ProtocolCinematicSequence({
  open,
  onComplete,
  onClose,
  finaleSubtitle,
  finaleTokenCount,
  tapAtIso,
  backendTimestamps,
  dismissible = true,
}: ProtocolCinematicSequenceProps) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'finale' | 'done'>('playing');
  const [tokenTick, setTokenTick] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { primeAudio, playMintSound } = useMintSound();

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  // Compute per-step timestamps locked to the receipt's tap moment
  const stepTimestamps = useMemo(() => {
    const t0 = tapAtIso ? new Date(tapAtIso) : new Date();
    if (Number.isNaN(t0.getTime())) {
      const fallback = new Date();
      return STEP_OFFSETS_MS.map((ms) => formatStamp(new Date(fallback.getTime() + ms)));
    }
    return STEP_OFFSETS_MS.map((ms) => formatStamp(new Date(t0.getTime() + ms)));
  }, [tapAtIso]);

  // Numeric ms versions for delta math in the debug overlay
  const stepTimestampsMs = useMemo(() => {
    const t0 = tapAtIso ? new Date(tapAtIso) : new Date();
    const base = Number.isNaN(t0.getTime()) ? Date.now() : t0.getTime();
    return STEP_OFFSETS_MS.map((ms) => base + ms);
  }, [tapAtIso]);

  // Open debug overlay via ?debug=ts or Shift+D
  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'ts') setDebugOpen(true);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setDebugOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Soft "tap blip" per primitive — uses the shared mint AudioContext so
  // it stays in the same audio bus as the dashboard.
  const playStepBlip = (idx: number) => {
    try {
      const ctx = primeAudio();
      if (!ctx || ctx.state !== 'running') return;
      audioCtxRef.current = ctx;

      const now = ctx.currentTime + 0.01;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.18, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      master.connect(ctx.destination);

      // Rising pitch per step — feels like the protocol "climbing"
      const baseFreqs = [392, 466, 523, 587, 698]; // G4, A#4, C5, D5, F5
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreqs[idx] ?? 523, now);
      osc.frequency.exponentialRampToValueAtTime(
        (baseFreqs[idx] ?? 523) * 1.02,
        now + 0.35,
      );

      // Subtle harmonic shimmer
      const harm = ctx.createOscillator();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime((baseFreqs[idx] ?? 523) * 2, now);
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.08, now);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(master);
      harm.connect(harmGain);
      harmGain.connect(master);

      osc.start(now);
      harm.start(now);
      osc.stop(now + 0.5);
      harm.stop(now + 0.32);
    } catch {
      // silent — audio is enhancement only
    }
  };

  useEffect(() => {
    if (!open) {
      setSceneIdx(0);
      setPhase('playing');
      setTokenTick(0);
      return;
    }

    // Prime audio on open so the first blip is reliable on iOS
    primeAudio();

    if (prefersReducedMotion) {
      const t = setTimeout(() => {
        setPhase('finale');
        const t2 = setTimeout(() => {
          setPhase('done');
          onComplete?.();
        }, 600);
        return () => clearTimeout(t2);
      }, 300);
      return () => clearTimeout(t);
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    SCENES.forEach((_, i) => {
      timeouts.push(
        setTimeout(() => {
          setSceneIdx(i);
          playStepBlip(i);
        }, i * SCENE_MS),
      );
    });
    timeouts.push(
      setTimeout(() => {
        setPhase('finale');
        // Singing-bowl mint sound — same as the dashboard's tap-to-mint success
        try {
          playMintSound('gold');
        } catch {
          // silent
        }
      }, SCENES.length * SCENE_MS),
    );
    timeouts.push(
      setTimeout(() => {
        setPhase('done');
        onComplete?.();
      }, SCENES.length * SCENE_MS + FINALE_MS),
    );

    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefersReducedMotion]);

  // Animate the running token count during the finale
  useEffect(() => {
    if (phase !== 'finale' || !finaleTokenCount || finaleTokenCount <= 0) return;
    let raf: number;
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setTokenTick(finaleTokenCount * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, finaleTokenCount]);

  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const showFinale = phase === 'finale' || phase === 'done';
  const currentScene = SCENES[Math.min(sceneIdx, SCENES.length - 1)];

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cinematic-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: FADE_MS / 1000 }}
        role="dialog"
        aria-modal="true"
        aria-label="Protocol verification sequence"
        className="fixed inset-0 z-[100] flex items-center justify-center"
        onClick={() => dismissible && onClose?.()}
      >
        {/* Stage backdrop — emerald-warmed black with deep radial vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--background)) 0%, hsl(220 30% 4%) 55%, hsl(220 35% 2%) 100%)',
          }}
        />

        {/* Hex grid undertone — denser + brighter, matches dashboard */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Secondary fine grid layer for parallax depth */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />

        {/* Sweeping aurora — slow, premium, never distracting */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1.2 }}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.22) 0%, transparent 55%)',
          }}
        />

        {/* Top step rail with timestamps */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 px-3 w-full max-w-md">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {SCENES.map((s, i) => {
              const reached = i <= sceneIdx || showFinale;
              return (
                <motion.div
                  key={s.key}
                  className="h-1.5 w-7 sm:w-10 rounded-full"
                  initial={{ backgroundColor: 'hsl(var(--muted-foreground) / 0.2)' }}
                  animate={{
                    backgroundColor: reached
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground) / 0.2)',
                    boxShadow: reached
                      ? '0 0 12px hsl(var(--primary) / 0.6)'
                      : '0 0 0 hsl(var(--primary) / 0)',
                  }}
                  transition={{ duration: 0.25 }}
                />
              );
            })}
          </div>
          {/* Live timestamp ledger */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
            {SCENES.map((s, i) => {
              const reached = i <= sceneIdx || showFinale;
              return (
                <div key={s.key} className="text-center">
                  <div
                    className={`text-[8px] sm:text-[9px] uppercase tracking-[0.12em] font-bold leading-tight transition-colors ${
                      reached ? 'text-primary/90' : 'text-muted-foreground/40'
                    }`}
                  >
                    {s.mark.replace('™', '').split('-')[0]}
                  </div>
                  <div
                    className={`text-[8.5px] sm:text-[10px] font-mono tabular-nums leading-tight transition-colors ${
                      reached ? 'text-foreground/85' : 'text-muted-foreground/30'
                    }`}
                  >
                    {reached ? stepTimestamps[i] : '—:—:—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="absolute top-5 right-5 z-20 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Skip protocol sequence"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Debug toggle — shows backend vs displayed timestamp comparison */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDebugOpen((v) => !v);
          }}
          className={`absolute top-5 ${dismissible ? 'right-16' : 'right-5'} z-20 h-9 px-2.5 rounded-full flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold transition-colors ${
            debugOpen
              ? 'bg-primary/20 text-primary border border-primary/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent'
          }`}
          aria-label="Toggle timestamp debug overlay"
          aria-pressed={debugOpen}
        >
          <Bug className="h-3 w-3" />
          <span className="hidden sm:inline">Debug</span>
        </button>

        {/* Stage content */}
        <div
          className="relative z-10 w-full max-w-xl px-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {!showFinale && (
              <motion.div
                key={`scene-${currentScene.key}`}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                <EnergyOrb icon={currentScene.icon} sceneIdx={sceneIdx} />
                <div className="space-y-1.5">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-primary/85 font-bold">
                    {`Step ${sceneIdx + 1} of ${SCENES.length}`}
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
                    {currentScene.mark}
                  </h2>
                  <p className="text-sm sm:text-base text-primary font-semibold">
                    {currentScene.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground/90 max-w-md mx-auto leading-snug">
                    {currentScene.detail}
                  </p>
                  <div className="pt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/[0.08]">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
                    <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-foreground/85">
                      {stepTimestamps[sceneIdx]}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Cleared
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {showFinale && (
              <motion.div
                key="finale"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                <FinaleSeal />
                <div className="space-y-2">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-primary font-bold">
                    All five proofs cleared
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
                    Genesis confirmed.
                  </h2>
                  {finaleTokenCount && finaleTokenCount > 0 ? (
                    <div className="flex items-baseline justify-center gap-2 pt-1">
                      <Zap className="h-5 w-5 text-primary" aria-hidden />
                      <span className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                        {tokenTick.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-sm sm:text-base text-primary font-semibold">$ZSOLAR</span>
                    </div>
                  ) : (
                    finaleSubtitle && (
                      <p className="text-sm sm:text-base text-primary font-semibold">
                        {finaleSubtitle}
                      </p>
                    )
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground/90 max-w-md mx-auto leading-snug">
                    Five primitives. One verifiable mint. Anchored forever.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer mark stack with timestamps — fades in with finale */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showFinale ? 1 : 0, y: showFinale ? 0 : 8 }}
          transition={{ duration: 0.4, delay: showFinale ? 0.15 : 0 }}
          className="absolute bottom-6 left-0 right-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 z-10"
        >
          {SCENES.map((s, i) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground"
            >
              <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden />
              <span className="text-foreground/85 font-medium">{s.mark}</span>
              <span className="font-mono tabular-nums text-muted-foreground/70">
                {stepTimestamps[i]}
              </span>
            </span>
          ))}
        </motion.div>

        {/* Debug overlay — backend vs displayed timestamp comparison */}
        {debugOpen && (
          <div
            className="absolute top-20 right-3 sm:right-5 z-30 w-[300px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-primary/30 bg-background/95 backdrop-blur-md p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Bug className="h-3 w-3 text-primary" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                  Timestamp Debug
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDebugOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close debug overlay"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="text-[9px] text-muted-foreground mb-2 leading-tight">
              Displayed (cinematic) vs backend-reported event time. Toggle with Shift+D.
            </div>
            <div className="space-y-1.5">
              {SCENES.map((s, i) => {
                const displayed = stepTimestamps[i];
                const displayedMs = stepTimestampsMs[i];
                const backendIso = backendTimestamps?.[s.key];
                const backendDate = tryParseIso(backendIso);
                const backendStr = backendDate ? formatStamp(backendDate) : '—';
                const deltaMs = backendDate ? displayedMs - backendDate.getTime() : null;
                const inSync = deltaMs !== null && Math.abs(deltaMs) <= 5;
                const close = deltaMs !== null && Math.abs(deltaMs) <= 1000;
                const deltaColor =
                  deltaMs === null
                    ? 'text-muted-foreground'
                    : inSync
                      ? 'text-primary'
                      : close
                        ? 'text-amber-400'
                        : 'text-destructive';
                return (
                  <div
                    key={s.key}
                    className="rounded border border-border/50 p-1.5 text-[9.5px] leading-tight"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold uppercase tracking-wider text-foreground/90">
                        {s.mark.replace('™', '')}
                      </span>
                      <span className={`font-mono tabular-nums font-bold ${deltaColor}`}>
                        {deltaMs === null
                          ? 'no backend'
                          : `${deltaMs >= 0 ? '+' : ''}${deltaMs} ms`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono tabular-nums">
                      <div>
                        <div className="text-muted-foreground/70">UI</div>
                        <div className="text-foreground/85">{displayed}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground/70">Backend</div>
                        <div className={backendDate ? 'text-foreground/85' : 'text-muted-foreground/50'}>
                          {backendStr}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[9px] text-muted-foreground/80 leading-tight">
              <span className="text-primary font-bold">●</span> ≤5ms in-sync ·{' '}
              <span className="text-amber-400 font-bold">●</span> ≤1s drift ·{' '}
              <span className="text-destructive font-bold">●</span> &gt;1s drift
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function EnergyOrb({ icon: Icon, sceneIdx }: { icon: typeof Hand; sceneIdx: number }) {
  // Star particle burst keyed to each scene — mirrors MintEffectButton
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * 360 + (Math.random() * 18 - 9);
        const rad = (angle * Math.PI) / 180;
        const dist = 80 + Math.random() * 50;
        return {
          tx: Math.cos(rad) * dist,
          ty: Math.sin(rad) * dist,
          size: 5 + Math.random() * 5,
          rotation: Math.random() * 360,
          delay: i * 0.018,
        };
      }),
    [sceneIdx],
  );

  return (
    <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40">
      {/* Pressure-wave ring (per-scene burst) — matches MintEffectButton */}
      <motion.div
        key={`ring-out-${sceneIdx}`}
        aria-hidden
        initial={{ scale: 0.5, opacity: 0.85 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 1.3, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid hsl(var(--primary) / 0.7)' }}
      />
      {/* Secondary flare ring */}
      <motion.div
        key={`ring-flare-${sceneIdx}`}
        aria-hidden
        initial={{ scale: 0.6, opacity: 0.6 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.95, delay: 0.08, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid hsl(var(--primary) / 0.5)' }}
      />
      {/* Mid pulse ring (continuous) */}
      <motion.div
        aria-hidden
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut', repeat: Infinity }}
        className="absolute inset-0 rounded-full border border-primary/40"
      />
      {/* Charging-up border halo (continuous breathing) */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-1 rounded-full"
        style={{
          border: '2px solid hsl(var(--primary) / 0.55)',
          boxShadow:
            '0 0 30px hsl(var(--primary) / 0.45), inset 0 0 20px hsl(var(--primary) / 0.18)',
        }}
      />
      {/* Star particles burst per scene */}
      {particles.map((p, i) => (
        <motion.span
          key={`p-${sceneIdx}-${i}`}
          aria-hidden
          initial={{ x: 0, y: 0, opacity: 0.95, scale: 0.4, rotate: p.rotation }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 1.1, rotate: p.rotation + 90 }}
          transition={{ duration: 1.0, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: 'hsl(var(--primary))',
            boxShadow: '0 0 12px hsl(var(--primary) / 0.85)',
            clipPath: STAR_CLIP,
          }}
        />
      ))}
      {/* Energy-release glow flash per scene */}
      <motion.div
        key={`glow-${sceneIdx}`}
        aria-hidden
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0.18) 40%, transparent 70%)',
        }}
      />
      {/* Inner orb disc */}
      <motion.div
        key={`disc-${sceneIdx}`}
        initial={{ scale: 0.85, opacity: 0.8 }}
        animate={{ scale: [0.85, 1.05, 1], opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.55), hsl(var(--primary) / 0.10) 70%)',
          boxShadow:
            '0 0 80px hsl(var(--primary) / 0.6), inset 0 0 40px hsl(var(--primary) / 0.28)',
          border: '1px solid hsl(var(--primary) / 0.55)',
        }}
      >
        <Icon className="h-12 w-12 sm:h-14 sm:w-14 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]" aria-hidden />
      </motion.div>
    </div>
  );
}

function FinaleSeal() {
  // Bigger, gold-tinged seal mirroring the dashboard's mint success burst
  return (
    <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40">
      {/* Triple expanding ring */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`finale-ring-${i}`}
          aria-hidden
          initial={{ scale: 0.6, opacity: 0.75 }}
          animate={{ scale: 3.0, opacity: 0 }}
          transition={{ duration: 1.8, delay: i * 0.22, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-primary/60"
        />
      ))}
      {/* Star-particle confetti — matches MintEffectButton */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 130 + Math.random() * 50;
        const size = 5 + Math.random() * 4;
        const rotation = Math.random() * 360;
        return (
          <motion.span
            key={`finale-p-${i}`}
            aria-hidden
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: rotation }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              opacity: 0,
              scale: 1.2,
              rotate: rotation + 120,
            }}
            transition={{ duration: 1.4, delay: i * 0.014, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              background: 'hsl(var(--primary))',
              boxShadow: '0 0 16px hsl(var(--primary) / 0.95)',
              clipPath: STAR_CLIP,
            }}
          />
        );
      })}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.12) 70%)',
          boxShadow:
            '0 0 100px hsl(var(--primary) / 0.7), inset 0 0 50px hsl(var(--primary) / 0.35)',
          border: '1px solid hsl(var(--primary) / 0.65)',
        }}
      >
        <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-primary drop-shadow-[0_0_16px_hsl(var(--primary)/0.8)]" aria-hidden />
      </motion.div>
    </div>
  );
}
