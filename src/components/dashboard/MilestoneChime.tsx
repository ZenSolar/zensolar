/**
 * MilestoneChime — L3 delight. Audio + haptic only. No text, no banner,
 * no toast, no DOM output. Fires once per (user, milestoneKey), gated
 * through useUxFirstSeen.
 *
 * True milestones: first-ever account mint, 1,000 kWh solar lifetime,
 * first battery export ≥ 5 kWh, first 1,000 miles, first 10 FSD hours.
 */
import { useEffect, useRef } from 'react';
import { useUxFirstSeen } from '@/hooks/useUxFirstSeen';
import { useHaptics } from '@/hooks/useHaptics';

interface Props {
  /** Stable key per milestone, e.g. "milestone:solar:1000kwh". */
  milestoneKey: string;
  /** True when the milestone condition is currently met. */
  reached: boolean;
}

let sharedCtx: AudioContext | null = null;
function softChime() {
  try {
    if (typeof window === 'undefined') return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    if (!sharedCtx) sharedCtx = new Ctor();
    const ctx = sharedCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    // Two soft sine partials, gentle attack/decay. ~0.7s total.
    const tones = [880, 1318.5]; // A5 + E6, quiet major-third interval
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.75);
    });
  } catch {
    /* silent */
  }
}

export function MilestoneChime({ milestoneKey, reached }: Props) {
  const { seen, markSeen } = useUxFirstSeen(milestoneKey);
  const { lightTap } = useHaptics();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (seen !== false) return;
    if (!reached) return;
    firedRef.current = true;
    softChime();
    void lightTap();
    void markSeen();
  }, [seen, reached, markSeen, lightTap]);

  return null;
}
