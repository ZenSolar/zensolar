import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Layers, Cpu, ShieldCheck, Anchor, CheckCircle2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * ProtocolCinematicSequence
 *
 * Full-screen, premium, ~2.6s cinematic that plays the 5 trademarked
 * primitives of the Zen Solar protocol as the actual runtime sequence:
 *
 *   1. Tap-to-Mint™         (intent)
 *   2. Proof-of-Delta™      (Δ kWh verified)
 *   3. Proof-of-Origin™     (clean source verified)
 *   4. Mint-on-Proof™       (token issued only on proofs)
 *   5. Proof-of-Permanence™ (anchored eternally)
 *
 * Designed for "Lyndon Rive / Elon Musk" first-impression: dark stage,
 * single accent, kinetic typography, no jargon, no clutter. Each scene
 * gets a focused micro-moment with its mark, ~480ms exposure, then
 * dissolves into a final "Cleared" tableau before closing.
 *
 * Self-contained — uses a portal, traps focus, respects reduced motion,
 * and exposes onComplete + onClose for callers.
 */

const SCENE_MS = 480;           // per-primitive exposure
const FINALE_MS = 700;          // final tableau before auto-close
const FADE_MS = 220;

export type ProtocolCinematicStepKey =
  | 'tap'
  | 'delta'
  | 'origin'
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
    key: 'delta',
    mark: 'Proof-of-Delta™',
    tagline: 'Energy change verified',
    detail: 'Δ kWh is real, signed, time-bound.',
    icon: Layers,
  },
  {
    key: 'origin',
    mark: 'Proof-of-Origin™',
    tagline: 'Clean source verified',
    detail: 'Your device. Your generation.',
    icon: Cpu,
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

interface ProtocolCinematicSequenceProps {
  open: boolean;
  onComplete?: () => void;
  onClose?: () => void;
  /** Optional label displayed under finale (e.g. "47.32 $ZSOLAR minted") */
  finaleSubtitle?: string;
  /** When true, allows clicking backdrop / pressing Esc to skip. Default true. */
  dismissible?: boolean;
}

export function ProtocolCinematicSequence({
  open,
  onComplete,
  onClose,
  finaleSubtitle,
  dismissible = true,
}: ProtocolCinematicSequenceProps) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'finale' | 'done'>('playing');

  // Respect reduced motion: collapse the sequence to a quick fade
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => {
    if (!open) {
      setSceneIdx(0);
      setPhase('playing');
      return;
    }

    if (prefersReducedMotion) {
      // Fast-forward: show finale almost immediately
      const t = setTimeout(() => {
        setPhase('finale');
        const t2 = setTimeout(() => {
          setPhase('done');
          onComplete?.();
        }, 500);
        return () => clearTimeout(t2);
      }, 250);
      return () => clearTimeout(t);
    }

    // Normal playback timeline
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    SCENES.forEach((_, i) => {
      timeouts.push(
        setTimeout(() => setSceneIdx(i), i * SCENE_MS)
      );
    });
    timeouts.push(
      setTimeout(() => setPhase('finale'), SCENES.length * SCENE_MS)
    );
    timeouts.push(
      setTimeout(() => {
        setPhase('done');
        onComplete?.();
      }, SCENES.length * SCENE_MS + FINALE_MS)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [open, prefersReducedMotion, onComplete]);

  // Esc key dismiss
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  // Lock body scroll while open
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
        {/* Stage backdrop — deep, slightly warm black with radial vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--background)) 0%, hsl(var(--background) / 0.98) 50%, hsl(220 30% 3%) 100%)',
          }}
        />

        {/* Subtle scanline / grid for "system" feel */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Step rail — top */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 z-10">
          {SCENES.map((s, i) => {
            const reached = i <= sceneIdx || showFinale;
            return (
              <div key={s.key} className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  className="h-1.5 w-6 sm:w-10 rounded-full"
                  initial={{ backgroundColor: 'hsl(var(--muted-foreground) / 0.25)' }}
                  animate={{
                    backgroundColor: reached
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground) / 0.25)',
                  }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            );
          })}
        </div>

        {/* Close (only if dismissible) */}
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

        {/* Stage content */}
        <div
          className="relative z-10 w-full max-w-xl px-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            {!showFinale && (
              <motion.div
                key={`scene-${currentScene.key}`}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                <SceneIcon icon={currentScene.icon} />
                <div className="space-y-1.5">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-primary/80">
                    {`Step ${sceneIdx + 1} of ${SCENES.length}`}
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                    {currentScene.mark}
                  </h2>
                  <p className="text-sm sm:text-base text-primary/90 font-medium">
                    {currentScene.tagline}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground/90 max-w-md mx-auto leading-snug">
                    {currentScene.detail}
                  </p>
                </div>
              </motion.div>
            )}

            {showFinale && (
              <motion.div
                key="finale"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                <FinaleSeal />
                <div className="space-y-1.5">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-primary">
                    All proofs cleared
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Genesis confirmed.
                  </h2>
                  {finaleSubtitle && (
                    <p className="text-sm sm:text-base text-primary font-semibold">
                      {finaleSubtitle}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground/90 max-w-md mx-auto leading-snug">
                    Five primitives. One verifiable mint. Anchored forever.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer mark stack — fades in with finale */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showFinale ? 1 : 0, y: showFinale ? 0 : 8 }}
          transition={{ duration: 0.4, delay: showFinale ? 0.15 : 0 }}
          className="absolute bottom-8 left-0 right-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 z-10"
        >
          {SCENES.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground"
            >
              <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden />
              {s.mark}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function SceneIcon({ icon: Icon }: { icon: typeof Hand }) {
  return (
    <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
      {/* Pulse ring */}
      <motion.div
        aria-hidden
        initial={{ scale: 0.6, opacity: 0.6 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut', repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-primary/40"
      />
      {/* Inner disc */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.05) 70%)',
          boxShadow: '0 0 40px hsl(var(--primary) / 0.35), inset 0 0 24px hsl(var(--primary) / 0.15)',
          border: '1px solid hsl(var(--primary) / 0.3)',
        }}
      >
        <Icon className="h-9 w-9 sm:h-11 sm:w-11 text-primary" aria-hidden />
      </div>
    </div>
  );
}

function FinaleSeal() {
  return (
    <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
      <motion.div
        aria-hidden
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut', repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-primary/50"
      />
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.08) 70%)',
          boxShadow: '0 0 60px hsl(var(--primary) / 0.55), inset 0 0 30px hsl(var(--primary) / 0.25)',
          border: '1px solid hsl(var(--primary) / 0.5)',
        }}
      >
        <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 text-primary" aria-hidden />
      </div>
    </div>
  );
}
