import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Cpu, Layers, ShieldCheck, Anchor, CheckCircle2 } from 'lucide-react';
import { useMintSound } from '@/hooks/useMintSound';

/**
 * MicroProtocolBadge — the "middle option" cinematic.
 *
 * A compact (~2.8s) inline animation designed to live INSIDE the existing
 * fast mint-confirmation dialog. It celebrates Proof-of-Genesis without
 * hijacking the screen the way the full ProtocolCinematicSequence does.
 *
 * Visual language stays in lock-step with MintEffectButton + the full
 * cinematic — same emerald orb, same 5 primitives, same gold seal —
 * just smaller, faster, and embeddable.
 *
 * Sequence:
 *   t=0     -> Tap dot ignites
 *   t=320   -> Origin dot
 *   t=640   -> Delta dot
 *   t=960   -> Mint dot
 *   t=1280  -> Permanence dot
 *   t=1600  -> Orb flares + "Proof of Genesis ✅" seal scales in
 *   t=2800  -> onComplete()
 */

const PRIMITIVES = [
  { key: 'tap',         label: 'Tap',         icon: Hand },
  { key: 'origin',      label: 'Origin',      icon: Cpu },
  { key: 'delta',       label: 'Delta',       icon: Layers },
  { key: 'mint',        label: 'Mint',        icon: ShieldCheck },
  { key: 'permanence',  label: 'Permanence',  icon: Anchor },
] as const;

const STEP_INTERVAL_MS = 320;
const SEAL_DELAY_MS = STEP_INTERVAL_MS * PRIMITIVES.length; // 1600
const SEAL_HOLD_MS = 1200;
const TOTAL_MS = SEAL_DELAY_MS + SEAL_HOLD_MS; // ~2.8s

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

      {/* Seal */}
      <AnimatePresence>
        {sealed && (
          <motion.div
            key="seal"
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.92 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 shadow-[0_0_18px_hsl(var(--primary)/0.25)]"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-xs font-semibold text-primary tracking-wide">
              Proof of Genesis ✓
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const MICRO_PROTOCOL_BADGE_TOTAL_MS = TOTAL_MS;
