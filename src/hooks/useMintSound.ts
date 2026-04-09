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
  /** Confirm mint: ZenSolar™ — stamp → deep meditative bowl bloom → bass sustain */
  const playConfirmSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Confirm Sound — Meditative Bass
      //  No metallic chimes. Deep bowls + bass only.
      // ══════════════════════════════════════════════════════════

      // --- Phase 1: STAMP (t=0) — the seal ---
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, now);
      stampGain.gain.linearRampToValueAtTime(0.26, now + 0.012);
      stampGain.gain.exponentialRampToValueAtTime(0.05, now + 0.06);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      stampGain.connect(ctx.destination);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(70, now);
      stamp.frequency.exponentialRampToValueAtTime(22, now + 0.1);
      stamp.connect(stampGain);
      stamp.start(now);
      stamp.stop(now + 0.25);

      // Sub-bass weight
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      subGain.connect(ctx.destination);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(36, now);
      sub.frequency.exponentialRampToValueAtTime(16, now + 0.18);
      sub.connect(subGain);
      sub.start(now);
      sub.stop(now + 0.27);

      // --- Phase 2: DEEP ZEN BOWL (t=0.05) — low meditative resonance ---
      // Much lower than before — feels like a Tibetan bowl, not a bell
      const zenTime = now + 0.05;
      const zenGain = ctx.createGain();
      zenGain.gain.setValueAtTime(0, zenTime);
      zenGain.gain.linearRampToValueAtTime(0.1, zenTime + 0.1);
      zenGain.gain.setValueAtTime(0.1, zenTime + 0.3);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 1.0);
      zenGain.connect(ctx.destination);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(110, zenTime); // A2 — deep, grounding om
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 1.05);

      // Second bowl harmonic — a fifth above, still low
      const zen2Gain = ctx.createGain();
      zen2Gain.gain.setValueAtTime(0, zenTime + 0.08);
      zen2Gain.gain.linearRampToValueAtTime(0.06, zenTime + 0.2);
      zen2Gain.gain.setValueAtTime(0.06, zenTime + 0.4);
      zen2Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.9);
      zen2Gain.connect(ctx.destination);

      const zen2 = ctx.createOscillator();
      zen2.type = 'sine';
      zen2.frequency.setValueAtTime(165, zenTime + 0.08); // E3 — perfect fifth, harmonic
      zen2.connect(zen2Gain);
      zen2.start(zenTime + 0.08);
      zen2.stop(zenTime + 0.95);

      // --- Phase 3: BASS SWELL — deep confirmation that rises gently ---
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0, now + 0.1);
      swellGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      swellGain.gain.setValueAtTime(0.12, now + 0.5);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      swellGain.connect(ctx.destination);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, now + 0.1); // A1 — deep bass foundation
      swell.frequency.linearRampToValueAtTime(65, now + 0.5); // Gently rises
      swell.frequency.exponentialRampToValueAtTime(45, now + 1.0); // Settles back
      swell.connect(swellGain);
      swell.start(now + 0.1);
      swell.stop(now + 1.15);

      // --- Phase 4: ELECTRIC WARMTH — filtered sawtooth undertow ---
      const tailGain = ctx.createGain();
      tailGain.gain.setValueAtTime(0, now + 0.15);
      tailGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      tailGain.gain.setValueAtTime(0.04, now + 0.5);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      tailGain.connect(ctx.destination);

      const tail = ctx.createOscillator();
      tail.type = 'sawtooth';
      tail.frequency.setValueAtTime(50, now + 0.15);
      tail.frequency.exponentialRampToValueAtTime(35, now + 1.0);

      const tailLP = ctx.createBiquadFilter();
      tailLP.type = 'lowpass';
      tailLP.frequency.value = 100; // Very muffled — pure warmth
      tailLP.Q.value = 0.5;

      tail.connect(tailLP);
      tailLP.connect(tailGain);
      tail.start(now + 0.15);
      tail.stop(now + 1.05);

      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
