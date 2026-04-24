import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Cpu, Layers, ShieldCheck, Anchor, CheckCircle2 } from 'lucide-react';
import { useMintSound } from '@/hooks/useMintSound';

/**
 * MicroProtocolBadge — the "middle option" cinematic.
 *
 * A premium ~5.5s inline animation designed to live INSIDE the existing
 * fast mint-confirmation dialog. It celebrates Proof-of-Genesis without
 * hijacking the screen the way the full ProtocolCinematicSequence does —
 * but is rich enough to feel exciting on EVERY mint, not just the first.
 *
 * Visual language stays in lock-step with MintEffectButton + the full
 * cinematic — same emerald orb, same 5 primitives, same gold seal.
 *
 * Sequence (~5.65s):
 *   Each primitive holds for 850ms with full mark + tagline fading
 *   in/out, then the gold "Proof of Genesis ✓" seal scales in for
 *   a 1.4s victory hold.
 */

const PRIMITIVES = [
  { key: 'tap',        label: 'Tap',        mark: 'Tap-to-Mint™',          tagline: 'Intent received',          icon: Hand },
  { key: 'origin',     label: 'Origin',     mark: 'Proof-of-Origin™',      tagline: 'Clean source verified',    icon: Cpu },
  { key: 'delta',      label: 'Delta',      mark: 'Proof-of-Delta™',       tagline: 'Δ kWh signed & time-bound', icon: Layers },
  { key: 'mint',       label: 'Mint',       mark: 'Mint-on-Proof™',        tagline: 'Token issued',             icon: ShieldCheck },
  { key: 'permanence', label: 'Permanence', mark: 'Proof-of-Permanence™',  tagline: 'Anchored to the ledger',   icon: Anchor },
] as const;

const STEP_INTERVAL_MS = 850;
const SEAL_DELAY_MS = STEP_INTERVAL_MS * PRIMITIVES.length; // 4250
const SEAL_HOLD_MS = 1400;
const TOTAL_MS = SEAL_DELAY_MS + SEAL_HOLD_MS; // ~5.65s


interface MicroProtocolBadgeProps {
  /** Start the animation. Setting to false resets it. */
  active: boolean;
  /** Called once the badge has fully resolved (post-seal hold). */
  onComplete?: () => void;
  /** When true, audio cues fire alongside each primitive + the finale. */
  withSound?: boolean;
  /** Compact / inline variant — smaller dots, single line. */
  compact?: boolean;
}

export function MicroProtocolBadge({
  active,
  onComplete,
  withSound = true,
  compact = false,
}: MicroProtocolBadgeProps) {
  const [litCount, setLitCount] = useState(0);
  const [sealed, setSealed] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  const { playMintSound, playConfirmSound, primeAudio } = useMintSound();

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => {
    // reset
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    completedRef.current = false;

    if (!active) {
      setLitCount(0);
      setSealed(false);
      return;
    }

    if (withSound) primeAudio();

    // Schedule each primitive
    PRIMITIVES.forEach((_, idx) => {
      const t = setTimeout(() => {
        setLitCount(idx + 1);
        if (withSound && !prefersReducedMotion) {
          // soft tick for each primitive
          try { playConfirmSound?.(); } catch {}
        }
      }, idx * STEP_INTERVAL_MS);
      timersRef.current.push(t);
    });

    // Seal
    const sealT = setTimeout(() => {
      setSealed(true);
      if (withSound) {
        try { playMintSound?.(); } catch {}
      }
    }, SEAL_DELAY_MS);
    timersRef.current.push(sealT);

    // Complete
    const completeT = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, TOTAL_MS);
    timersRef.current.push(completeT);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [active, withSound, prefersReducedMotion, playMintSound, playConfirmSound, primeAudio, onComplete]);

  const dotSize = compact ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Emerald orb backdrop + step rail */}
      <div className="relative w-full flex items-center justify-center">
        {/* Ambient orb glow */}
        <AnimatePresence>
          {active && (
            <motion.div
              key="orb"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: sealed ? 0.9 : 0.45, scale: sealed ? 1.15 : 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-x-0 mx-auto h-24 w-24 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, hsl(var(--primary) / 0.45) 0%, hsl(var(--primary) / 0.15) 40%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Step dots rail */}
        <div className="relative flex items-center gap-2 z-10">
          {PRIMITIVES.map((p, idx) => {
            const Icon = p.icon;
            const isLit = idx < litCount;
            return (
              <div key={p.key} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={
                    isLit
                      ? {
                          scale: [1, 1.25, 1],
                          boxShadow: [
                            '0 0 0 0 hsl(var(--primary) / 0)',
                            '0 0 16px 2px hsl(var(--primary) / 0.7)',
                            '0 0 8px 1px hsl(var(--primary) / 0.4)',
                          ],
                        }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className={[
                    dotSize,
                    'rounded-full flex items-center justify-center border transition-colors',
                    isLit
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted/30 border-border text-muted-foreground/50',
                  ].join(' ')}
                  aria-label={`${p.label} ${isLit ? 'verified' : 'pending'}`}
                >
                  <Icon className={iconSize} aria-hidden />
                </motion.div>
                {idx < PRIMITIVES.length - 1 && (
                  <div
                    className={[
                      'h-px w-3 transition-colors duration-300',
                      idx < litCount - 1 ? 'bg-primary/60' : 'bg-border',
                    ].join(' ')}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-step caption — fades through each primitive's mark + tagline */}
      <div className="h-12 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {active && !sealed && litCount > 0 && (
            <motion.div
              key={PRIMITIVES[litCount - 1].key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="text-sm font-bold text-primary tracking-tight leading-tight">
                {PRIMITIVES[litCount - 1].mark}
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                {PRIMITIVES[litCount - 1].tagline}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seal */}
      <AnimatePresence>
        {sealed && (
          <motion.div
            key="seal"
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.92 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 shadow-[0_0_22px_hsl(var(--primary)/0.35)]"
          >
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-primary tracking-wide">
              Proof of Genesis ✓
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const MICRO_PROTOCOL_BADGE_TOTAL_MS = TOTAL_MS;
