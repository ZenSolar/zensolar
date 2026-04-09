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
  /** Confirm mint: futuristic digital CHA-CHING — coin stamp + reward fanfare */
  const playConfirmSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // --- Phase 1: Heavy coin STAMP (t=0) — the press hits ---
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0.25, now);
      stampGain.gain.exponentialRampToValueAtTime(0.08, now + 0.008);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      stampGain.connect(ctx.destination);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(900, now);
      stamp.frequency.exponentialRampToValueAtTime(200, now + 0.02); // Deep stamp
      stamp.connect(stampGain);
      stamp.start(now);
      stamp.stop(now + 0.12);

      // Heavy sub-bass impact
      const impactGain = ctx.createGain();
      impactGain.gain.setValueAtTime(0.15, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      impactGain.connect(ctx.destination);

      const impact = ctx.createOscillator();
      impact.type = 'sine';
      impact.frequency.setValueAtTime(50, now);
      impact.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      impact.connect(impactGain);
      impact.start(now);
      impact.stop(now + 0.18);

      // --- Phase 2: CHA-CHING two-note (t=0.08) — digital cash register ---
      const chaTime = now + 0.08;

      // Note 1: "CHA" — mid tone
      const cha1Gain = ctx.createGain();
      cha1Gain.gain.setValueAtTime(0, chaTime);
      cha1Gain.gain.linearRampToValueAtTime(0.1, chaTime + 0.003);
      cha1Gain.gain.exponentialRampToValueAtTime(0.02, chaTime + 0.06);
      cha1Gain.gain.exponentialRampToValueAtTime(0.001, chaTime + 0.12);
      cha1Gain.connect(ctx.destination);

      const cha1 = ctx.createOscillator();
      cha1.type = 'triangle';
      cha1.frequency.setValueAtTime(523, chaTime); // C5
      cha1.connect(cha1Gain);
      cha1.start(chaTime);
      cha1.stop(chaTime + 0.15);

      // Note 2: "CHING" — higher, brighter, rings longer
      const chingTime = now + 0.15;
      const chingGain = ctx.createGain();
      chingGain.gain.setValueAtTime(0, chingTime);
      chingGain.gain.linearRampToValueAtTime(0.12, chingTime + 0.003);
      chingGain.gain.setValueAtTime(0.12, chingTime + 0.05);
      chingGain.gain.exponentialRampToValueAtTime(0.001, chingTime + 0.4);
      chingGain.connect(ctx.destination);

      const ching = ctx.createOscillator();
      ching.type = 'triangle';
      ching.frequency.setValueAtTime(784, chingTime); // G5 — ascending = "winner"
      ching.connect(chingGain);
      ching.start(chingTime);
      ching.stop(chingTime + 0.45);

      // "CHING" shimmer overtone
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, chingTime);
      shimGain.gain.linearRampToValueAtTime(0.05, chingTime + 0.005);
      shimGain.gain.exponentialRampToValueAtTime(0.001, chingTime + 0.3);
      shimGain.connect(ctx.destination);

      const shim = ctx.createOscillator();
      shim.type = 'sine';
      shim.frequency.setValueAtTime(1568, chingTime); // G6 — octave shimmer
      shim.connect(shimGain);
      shim.start(chingTime);
      shim.stop(chingTime + 0.35);

      // --- Phase 3: Digital low-freq sustain (the "futuristic" tail) ---
      const tailGain = ctx.createGain();
      tailGain.gain.setValueAtTime(0, now + 0.1);
      tailGain.gain.linearRampToValueAtTime(0.06, now + 0.18);
      tailGain.gain.setValueAtTime(0.06, now + 0.3);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      tailGain.connect(ctx.destination);

      const tail = ctx.createOscillator();
      tail.type = 'sine';
      tail.frequency.setValueAtTime(80, now + 0.1); // Low digital hum
      tail.frequency.exponentialRampToValueAtTime(55, now + 0.6);
      tail.connect(tailGain);
      tail.start(now + 0.1);
      tail.stop(now + 0.65);

      // --- Phase 4: Metallic coin scatter texture ---
      const scatterLen = 0.04;
      const scatterSize = Math.ceil(ctx.sampleRate * scatterLen);
      const scatterBuf = ctx.createBuffer(1, scatterSize, ctx.sampleRate);
      const scatterData = scatterBuf.getChannelData(0);
      for (let i = 0; i < scatterSize; i++) {
        const env = Math.exp(-i / (scatterSize * 0.2));
        scatterData[i] = Math.random() < 0.3
          ? (Math.random() * 2 - 1) * env
          : 0;
      }
      const scatterSrc = ctx.createBufferSource();
      scatterSrc.buffer = scatterBuf;

      const scatterHP = ctx.createBiquadFilter();
      scatterHP.type = 'highpass';
      scatterHP.frequency.value = 3000;
      scatterHP.Q.value = 1;

      const scatterGain = ctx.createGain();
      scatterGain.gain.setValueAtTime(0.08, now + 0.14);
      scatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14 + scatterLen);

      scatterSrc.connect(scatterHP);
      scatterHP.connect(scatterGain);
      scatterGain.connect(ctx.destination);
      scatterSrc.start(now + 0.14);
      scatterSrc.stop(now + 0.14 + scatterLen + 0.002);

      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
