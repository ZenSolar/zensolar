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
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, now);
      stampGain.gain.linearRampToValueAtTime(0.22, now + 0.012);
      stampGain.gain.exponentialRampToValueAtTime(0.05, now + 0.07);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      stampGain.connect(ctx.destination);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(70, now);
      stamp.frequency.exponentialRampToValueAtTime(24, now + 0.1);
      stamp.connect(stampGain);
      stamp.start(now);
      stamp.stop(now + 0.28);

      // Sub-bass weight
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      subGain.gain.setValueAtTime(0.2, now + 0.06);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      subGain.connect(ctx.destination);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(36, now);
      sub.frequency.exponentialRampToValueAtTime(18, now + 0.22);
      sub.connect(subGain);
      sub.start(now);
      sub.stop(now + 0.32);

      // --- Layer 2: DEEP ZEN BOWL — louder, longer, more meditative ---
      const zenTime = now + 0.04;
      const zenGain = ctx.createGain();
      zenGain.gain.setValueAtTime(0, zenTime);
      zenGain.gain.linearRampToValueAtTime(0.12, zenTime + 0.1);
      zenGain.gain.setValueAtTime(0.12, zenTime + 0.35);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 1.0);
      zenGain.connect(ctx.destination);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(110, zenTime); // A2 — deep om
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 1.05);

      // Bowl harmonic fifth — louder presence
      const zen2Gain = ctx.createGain();
      zen2Gain.gain.setValueAtTime(0, zenTime + 0.06);
      zen2Gain.gain.linearRampToValueAtTime(0.06, zenTime + 0.15);
      zen2Gain.gain.setValueAtTime(0.06, zenTime + 0.4);
      zen2Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.9);
      zen2Gain.connect(ctx.destination);

      const zen2 = ctx.createOscillator();
      zen2.type = 'sine';
      zen2.frequency.setValueAtTime(165, zenTime + 0.06); // E3 — perfect fifth
      zen2.connect(zen2Gain);
      zen2.start(zenTime + 0.06);
      zen2.stop(zenTime + 0.95);

      // Third bowl voice — sub-octave for extra depth
      const zen3Gain = ctx.createGain();
      zen3Gain.gain.setValueAtTime(0, zenTime + 0.02);
      zen3Gain.gain.linearRampToValueAtTime(0.05, zenTime + 0.12);
      zen3Gain.gain.setValueAtTime(0.05, zenTime + 0.3);
      zen3Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.85);
      zen3Gain.connect(ctx.destination);

      const zen3 = ctx.createOscillator();
      zen3.type = 'sine';
      zen3.frequency.setValueAtTime(55, zenTime + 0.02); // A1 — sub-octave om
      zen3.connect(zen3Gain);
      zen3.start(zenTime + 0.02);
      zen3.stop(zenTime + 0.9);

      // --- Layer 3: BASS DESCENT ---
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0, now + 0.08);
      swellGain.gain.linearRampToValueAtTime(0.08, now + 0.15);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      swellGain.connect(ctx.destination);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, now + 0.08);
      swell.frequency.exponentialRampToValueAtTime(28, now + 0.65);
      swell.connect(swellGain);
      swell.start(now + 0.08);
      swell.stop(now + 0.72);

      // --- Layer 3b: TRON DISSOLVE — kWh derezzing into the grid ---
      // A descending digital tone that fragments into granular noise
      // Like energy literally pixelating and dissolving on-chain

      // Derez tone — descending sawtooth that "breaks apart"
      const derezGain = ctx.createGain();
      derezGain.gain.setValueAtTime(0, now + 0.1);
      derezGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      derezGain.gain.setValueAtTime(0.12, now + 0.25);
      derezGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      derezGain.connect(ctx.destination);

      const derez = ctx.createOscillator();
      derez.type = 'sawtooth';
      derez.frequency.setValueAtTime(200, now + 0.1);
      derez.frequency.exponentialRampToValueAtTime(30, now + 0.75); // Sweeps way down

      const derezLP = ctx.createBiquadFilter();
      derezLP.type = 'lowpass';
      derezLP.frequency.setValueAtTime(500, now + 0.1);
      derezLP.frequency.exponentialRampToValueAtTime(60, now + 0.75); // Filter closes = dissolving
      derezLP.Q.value = 2; // Resonant peak = that Tron "digital" character

      derez.connect(derezLP);
      derezLP.connect(derezGain);
      derez.start(now + 0.1);
      derez.stop(now + 0.82);

      // Digital grain — sparse noise particles, like data fragments scattering
      const grainLen = 0.6;
      const grainSize = Math.ceil(ctx.sampleRate * grainLen);
      const grainBuf = ctx.createBuffer(1, grainSize, ctx.sampleRate);
      const grainData = grainBuf.getChannelData(0);
      for (let i = 0; i < grainSize; i++) {
        const t = i / grainSize;
        const env = Math.pow(1 - t, 1.8);
        // Sparse digital particles — only ~15% of samples have signal
        const isParticle = Math.random() < (0.15 * (1 - t * 0.7));
        grainData[i] = isParticle ? (Math.random() * 2 - 1) * env : 0;
      }
      const grainSrc = ctx.createBufferSource();
      grainSrc.buffer = grainBuf;

      const grainBP = ctx.createBiquadFilter();
      grainBP.type = 'bandpass';
      grainBP.frequency.setValueAtTime(400, now + 0.15);
      grainBP.frequency.exponentialRampToValueAtTime(80, now + 0.15 + grainLen);
      grainBP.Q.value = 1.5;

      const grainGain = ctx.createGain();
      grainGain.gain.setValueAtTime(0.18, now + 0.15);
      grainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + grainLen);

      grainSrc.connect(grainBP);
      grainBP.connect(grainGain);
      grainGain.connect(ctx.destination);
      grainSrc.start(now + 0.15);
      grainSrc.stop(now + 0.15 + grainLen + 0.01);

      // --- Layer 4: ELECTRIC WARMTH — filtered sawtooth undertow ---
      const techGain = ctx.createGain();
      techGain.gain.setValueAtTime(0, now);
      techGain.gain.linearRampToValueAtTime(0.035, now + 0.04);
      techGain.gain.setValueAtTime(0.035, now + 0.15);
      techGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      techGain.connect(ctx.destination);

      const tech = ctx.createOscillator();
      tech.type = 'sawtooth';
      tech.frequency.setValueAtTime(50, now);
      tech.frequency.exponentialRampToValueAtTime(38, now + 0.55);

      const techLP = ctx.createBiquadFilter();
      techLP.type = 'lowpass';
      techLP.frequency.value = 110;
      techLP.Q.value = 0.6;

      tech.connect(techLP);
      techLP.connect(techGain);
      tech.start(now);
      tech.stop(now + 0.62);

      // --- Layer 5: COIN WEIGHT — heavy gold coin settling on stone ---
      // Low-pitched filtered ring that subconsciously says "currency"
      const coinTime = now + 0.015;
      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0, coinTime);
      coinGain.gain.linearRampToValueAtTime(0.025, coinTime + 0.008);
      coinGain.gain.exponentialRampToValueAtTime(0.01, coinTime + 0.06);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.3);
      coinGain.connect(ctx.destination);

      const coin = ctx.createOscillator();
      coin.type = 'triangle';
      coin.frequency.setValueAtTime(220, coinTime);
      coin.frequency.exponentialRampToValueAtTime(185, coinTime + 0.3);

      const coinLP = ctx.createBiquadFilter();
      coinLP.type = 'lowpass';
      coinLP.frequency.value = 300;
      coinLP.Q.value = 0.7;

      coin.connect(coinLP);
      coinLP.connect(coinGain);
      coin.start(coinTime);
      coin.stop(coinTime + 0.45);

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

      // --- Phase 3: BASS DESCENT — only descends, then dissipates ---
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0, now + 0.1);
      swellGain.gain.linearRampToValueAtTime(0.12, now + 0.2);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      swellGain.connect(ctx.destination);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, now + 0.1);
      swell.frequency.exponentialRampToValueAtTime(22, now + 0.9); // Only descends
      swell.connect(swellGain);
      swell.start(now + 0.1);
      swell.stop(now + 1.05);

      // --- Phase 3b: DISSIPATION — energy transforming into on-chain currency ---
      const dissLen = 0.6;
      const dissSize = Math.ceil(ctx.sampleRate * dissLen);
      const dissBuf = ctx.createBuffer(1, dissSize, ctx.sampleRate);
      const dissData = dissBuf.getChannelData(0);
      for (let i = 0; i < dissSize; i++) {
        const t = i / dissSize;
        const env = Math.pow(1 - t, 2.2);
        dissData[i] = (Math.random() * 2 - 1) * env;
      }
      const dissSrc = ctx.createBufferSource();
      dissSrc.buffer = dissBuf;

      const dissLP = ctx.createBiquadFilter();
      dissLP.type = 'lowpass';
      dissLP.frequency.setValueAtTime(400, now + 0.25);
      dissLP.frequency.exponentialRampToValueAtTime(30, now + 0.25 + dissLen);

      const dissGain = ctx.createGain();
      dissGain.gain.setValueAtTime(0.14, now + 0.25);
      dissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + dissLen);

      dissSrc.connect(dissLP);
      dissLP.connect(dissGain);
      dissGain.connect(ctx.destination);
      dissSrc.start(now + 0.25);
      dissSrc.stop(now + 0.25 + dissLen + 0.01);

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
      tailLP.frequency.value = 100;
      tailLP.Q.value = 0.5;

      tail.connect(tailLP);
      tailLP.connect(tailGain);
      tail.start(now + 0.15);
      tail.stop(now + 1.05);

      // --- Phase 5: COIN RESONANCE — ascending double-coin = "value earned" ---
      // Coin 1: the mint lands
      const coin1Time = now + 0.02;
      const coin1Gain = ctx.createGain();
      coin1Gain.gain.setValueAtTime(0, coin1Time);
      coin1Gain.gain.linearRampToValueAtTime(0.022, coin1Time + 0.008);
      coin1Gain.gain.exponentialRampToValueAtTime(0.008, coin1Time + 0.08);
      coin1Gain.gain.exponentialRampToValueAtTime(0.001, coin1Time + 0.25);
      coin1Gain.connect(ctx.destination);

      const coin1 = ctx.createOscillator();
      coin1.type = 'triangle';
      coin1.frequency.setValueAtTime(196, coin1Time);
      coin1.frequency.exponentialRampToValueAtTime(170, coin1Time + 0.25);

      const coin1LP = ctx.createBiquadFilter();
      coin1LP.type = 'lowpass';
      coin1LP.frequency.value = 280;
      coin1LP.Q.value = 0.7;

      coin1.connect(coin1LP);
      coin1LP.connect(coin1Gain);
      coin1.start(coin1Time);
      coin1.stop(coin1Time + 0.3);

      // Coin 2: the value registers — slightly higher = ascending = "reward"
      const coin2Time = now + 0.2;
      const coin2Gain = ctx.createGain();
      coin2Gain.gain.setValueAtTime(0, coin2Time);
      coin2Gain.gain.linearRampToValueAtTime(0.028, coin2Time + 0.008);
      coin2Gain.gain.exponentialRampToValueAtTime(0.01, coin2Time + 0.1);
      coin2Gain.gain.exponentialRampToValueAtTime(0.001, coin2Time + 0.35);
      coin2Gain.connect(ctx.destination);

      const coin2 = ctx.createOscillator();
      coin2.type = 'triangle';
      coin2.frequency.setValueAtTime(262, coin2Time);
      coin2.frequency.exponentialRampToValueAtTime(230, coin2Time + 0.35);

      const coin2LP = ctx.createBiquadFilter();
      coin2LP.type = 'lowpass';
      coin2LP.frequency.value = 320;
      coin2LP.Q.value = 0.8;

      coin2.connect(coin2LP);
      coin2LP.connect(coin2Gain);
      coin2.start(coin2Time);
      coin2.stop(coin2Time + 0.55);

      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
