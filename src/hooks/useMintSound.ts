import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Unified mint interaction — a gentle, low-tone electric hum
 * paired with haptic vibration. Feels like energy transferring
 * through the screen into your fingertip.
 */

export function useMintSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  /** Trigger haptic feedback — falls back silently on web */
  const triggerHaptic = useCallback(async (style: 'light' | 'confirm' = 'light') => {
    try {
      if (style === 'confirm') {
        // Double-tap pattern for confirmation
        await Haptics.impact({ style: ImpactStyle.Medium });
        setTimeout(() => {
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        }, 80);
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Web fallback — navigator.vibrate if available
      try {
        if (style === 'confirm') {
          navigator.vibrate?.([15, 60, 25]);
        } else {
          navigator.vibrate?.(10);
        }
      } catch { /* no vibration support */ }
    }
  }, []);

  const playMintSound = useCallback((_color?: string) => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Tap-to-Mint Signature Sound
      //  Concept: Zen calm × Solar radiance × Coin stamp × Tech
      // ══════════════════════════════════════════════════════════

      // --- Layer 1: THE STAMP — weighted coin-press impact ---
      // Dull, bassy, decisive. The physical "mint" moment.
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, now);
      stampGain.gain.linearRampToValueAtTime(0.24, now + 0.012);
      stampGain.gain.exponentialRampToValueAtTime(0.06, now + 0.07);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      stampGain.connect(ctx.destination);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(70, now);
      stamp.frequency.exponentialRampToValueAtTime(28, now + 0.08);
      stamp.connect(stampGain);
      stamp.start(now);
      stamp.stop(now + 0.25);

      // Sub-bass foundation — felt more than heard
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      subGain.gain.setValueAtTime(0.2, now + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      subGain.connect(ctx.destination);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(36, now);
      sub.frequency.exponentialRampToValueAtTime(20, now + 0.2);
      sub.connect(subGain);
      sub.start(now);
      sub.stop(now + 0.3);

      // --- Layer 2: ZEN BOWL — pure resonant harmonic that blooms after the press ---
      // Like a singing bowl struck once — calm, clean, purposeful
      const zenTime = now + 0.04; // Blooms just after stamp contact
      const zenGain = ctx.createGain();
      zenGain.gain.setValueAtTime(0, zenTime);
      zenGain.gain.linearRampToValueAtTime(0.07, zenTime + 0.06);
      zenGain.gain.setValueAtTime(0.07, zenTime + 0.15);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.55);
      zenGain.connect(ctx.destination);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(174, zenTime); // F3 — warm, grounding "om" frequency
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 0.6);

      // Zen overtone — octave shimmer for that bell-like purity
      const zenOvertoneGain = ctx.createGain();
      zenOvertoneGain.gain.setValueAtTime(0, zenTime);
      zenOvertoneGain.gain.linearRampToValueAtTime(0.025, zenTime + 0.08);
      zenOvertoneGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.45);
      zenOvertoneGain.connect(ctx.destination);

      const zenOvertone = ctx.createOscillator();
      zenOvertone.type = 'sine';
      zenOvertone.frequency.setValueAtTime(348, zenTime); // F4 — one octave up
      zenOvertone.connect(zenOvertoneGain);
      zenOvertone.start(zenTime);
      zenOvertone.stop(zenTime + 0.5);

      // --- Layer 3: SOLAR WARMTH — gentle radiant energy that swells ---
      // Warm filtered texture, like sunlight converting to energy
      const solarTime = now + 0.02;
      const solarLen = 0.15;
      const solarSize = Math.ceil(ctx.sampleRate * solarLen);
      const solarBuf = ctx.createBuffer(1, solarSize, ctx.sampleRate);
      const solarData = solarBuf.getChannelData(0);
      for (let i = 0; i < solarSize; i++) {
        const t = i / solarSize;
        // Smooth swell envelope — rises then fades like a solar flare
        const env = Math.sin(t * Math.PI) * 0.6;
        solarData[i] = (Math.random() * 2 - 1) * env;
      }
      const solarSrc = ctx.createBufferSource();
      solarSrc.buffer = solarBuf;

      const solarLP = ctx.createBiquadFilter();
      solarLP.type = 'lowpass';
      solarLP.frequency.value = 250; // Very warm, no harshness
      solarLP.Q.value = 1.2;

      const solarGain = ctx.createGain();
      solarGain.gain.setValueAtTime(0.1, solarTime);

      solarSrc.connect(solarLP);
      solarLP.connect(solarGain);
      solarGain.connect(ctx.destination);
      solarSrc.start(solarTime);
      solarSrc.stop(solarTime + solarLen + 0.01);

      // --- Layer 4: TECH UNDERCURRENT — electric DNA, deeply filtered ---
      // The cutting-edge tech signature — felt as texture, not heard as tone
      const techGain = ctx.createGain();
      techGain.gain.setValueAtTime(0, now);
      techGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      techGain.gain.setValueAtTime(0.04, now + 0.12);
      techGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      techGain.connect(ctx.destination);

      const tech = ctx.createOscillator();
      tech.type = 'sawtooth';
      tech.frequency.setValueAtTime(55, now); // Mains hum frequency
      tech.frequency.exponentialRampToValueAtTime(42, now + 0.35);

      const techLP = ctx.createBiquadFilter();
      techLP.type = 'lowpass';
      techLP.frequency.value = 130; // Buried deep — subliminal electric presence
      techLP.Q.value = 0.8;

      tech.connect(techLP);
      techLP.connect(techGain);
      tech.start(now);
      tech.stop(now + 0.42);

      triggerHaptic('light');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);
  /** Confirm mint: ZenSolar™ branded confirmation — stamp → zen bowl bloom → reward chime */
  const playConfirmSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Confirm Sound
      //  Story: Stamp lands → zen bowl blooms → solar reward chime
      // ══════════════════════════════════════════════════════════

      // --- Phase 1: STAMP (t=0) — the mint is sealed ---
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, now);
      stampGain.gain.linearRampToValueAtTime(0.26, now + 0.01);
      stampGain.gain.exponentialRampToValueAtTime(0.05, now + 0.06);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      stampGain.connect(ctx.destination);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(75, now);
      stamp.frequency.exponentialRampToValueAtTime(25, now + 0.08);
      stamp.connect(stampGain);
      stamp.start(now);
      stamp.stop(now + 0.22);

      // Sub-bass weight
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.18, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      subGain.connect(ctx.destination);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(40, now);
      sub.frequency.exponentialRampToValueAtTime(18, now + 0.15);
      sub.connect(subGain);
      sub.start(now);
      sub.stop(now + 0.22);

      // --- Phase 2: ZEN BOWL BLOOM (t=0.06) — resonance opens up ---
      const zenTime = now + 0.06;
      const zenGain = ctx.createGain();
      zenGain.gain.setValueAtTime(0, zenTime);
      zenGain.gain.linearRampToValueAtTime(0.08, zenTime + 0.08);
      zenGain.gain.setValueAtTime(0.08, zenTime + 0.2);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.7);
      zenGain.connect(ctx.destination);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(174, zenTime); // F3 — same zen tone as tap
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 0.75);

      // Zen overtone — rings longer for confirmation weight
      const zenOvGain = ctx.createGain();
      zenOvGain.gain.setValueAtTime(0, zenTime);
      zenOvGain.gain.linearRampToValueAtTime(0.035, zenTime + 0.1);
      zenOvGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.6);
      zenOvGain.connect(ctx.destination);

      const zenOv = ctx.createOscillator();
      zenOv.type = 'sine';
      zenOv.frequency.setValueAtTime(348, zenTime); // F4
      zenOv.connect(zenOvGain);
      zenOv.start(zenTime);
      zenOv.stop(zenTime + 0.65);

      // --- Phase 3: REWARD CHIME (t=0.18) — ascending two-note "success" ---
      // Warm triangle tones, not sharp — zen-filtered reward
      const chime1Time = now + 0.18;
      const chime1Gain = ctx.createGain();
      chime1Gain.gain.setValueAtTime(0, chime1Time);
      chime1Gain.gain.linearRampToValueAtTime(0.07, chime1Time + 0.02);
      chime1Gain.gain.exponentialRampToValueAtTime(0.015, chime1Time + 0.12);
      chime1Gain.gain.exponentialRampToValueAtTime(0.001, chime1Time + 0.25);
      chime1Gain.connect(ctx.destination);

      const chime1 = ctx.createOscillator();
      chime1.type = 'triangle';
      chime1.frequency.setValueAtTime(262, chime1Time); // C4 — warm, grounded
      chime1.connect(chime1Gain);
      chime1.start(chime1Time);
      chime1.stop(chime1Time + 0.28);

      const chime2Time = now + 0.3;
      const chime2Gain = ctx.createGain();
      chime2Gain.gain.setValueAtTime(0, chime2Time);
      chime2Gain.gain.linearRampToValueAtTime(0.09, chime2Time + 0.02);
      chime2Gain.gain.setValueAtTime(0.09, chime2Time + 0.08);
      chime2Gain.gain.exponentialRampToValueAtTime(0.001, chime2Time + 0.5);
      chime2Gain.connect(ctx.destination);

      const chime2 = ctx.createOscillator();
      chime2.type = 'triangle';
      chime2.frequency.setValueAtTime(392, chime2Time); // G4 — ascending = "earned it"
      chime2.connect(chime2Gain);
      chime2.start(chime2Time);
      chime2.stop(chime2Time + 0.55);

      // Chime 2 shimmer overtone — subtle brightness
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, chime2Time);
      shimGain.gain.linearRampToValueAtTime(0.025, chime2Time + 0.03);
      shimGain.gain.exponentialRampToValueAtTime(0.001, chime2Time + 0.35);
      shimGain.connect(ctx.destination);

      const shim = ctx.createOscillator();
      shim.type = 'sine';
      shim.frequency.setValueAtTime(784, chime2Time); // G5 — octave shimmer
      shim.connect(shimGain);
      shim.start(chime2Time);
      shim.stop(chime2Time + 0.4);

      // --- Phase 4: SOLAR SUSTAIN — warm electric tail ---
      const tailGain = ctx.createGain();
      tailGain.gain.setValueAtTime(0, now + 0.15);
      tailGain.gain.linearRampToValueAtTime(0.045, now + 0.25);
      tailGain.gain.setValueAtTime(0.045, now + 0.4);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      tailGain.connect(ctx.destination);

      const tail = ctx.createOscillator();
      tail.type = 'sawtooth';
      tail.frequency.setValueAtTime(55, now + 0.15);
      tail.frequency.exponentialRampToValueAtTime(38, now + 0.8);

      const tailLP = ctx.createBiquadFilter();
      tailLP.type = 'lowpass';
      tailLP.frequency.value = 120; // Deeply buried — warm electric presence
      tailLP.Q.value = 0.7;

      tail.connect(tailLP);
      tailLP.connect(tailGain);
      tail.start(now + 0.15);
      tail.stop(now + 0.85);

      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
