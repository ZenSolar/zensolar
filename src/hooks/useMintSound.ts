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

      // Master volume — scale entire sound package
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Tap-to-Mint Signature Sound
      //  Concept: Zen calm × Solar radiance × Coin stamp × Tech
      // ══════════════════════════════════════════════════════════

      // --- Layer 1: THE STAMP — weighted coin-press impact ---
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, now);
      stampGain.gain.linearRampToValueAtTime(0.28, now + 0.01);
      stampGain.gain.exponentialRampToValueAtTime(0.06, now + 0.06);
      stampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      stampGain.connect(master);

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
      subGain.gain.linearRampToValueAtTime(0.25, now + 0.008);
      subGain.gain.setValueAtTime(0.25, now + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      subGain.connect(master);

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
      zenGain.gain.linearRampToValueAtTime(0.15, zenTime + 0.08);
      zenGain.gain.setValueAtTime(0.15, zenTime + 0.3);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.9);
      zenGain.connect(master);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(110, zenTime); // A2 — deep om
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 1.05);

      // Bowl harmonic fifth — louder presence
      const zen2Gain = ctx.createGain();
      zen2Gain.gain.setValueAtTime(0, zenTime + 0.05);
      zen2Gain.gain.linearRampToValueAtTime(0.08, zenTime + 0.12);
      zen2Gain.gain.setValueAtTime(0.08, zenTime + 0.35);
      zen2Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.8);
      zen2Gain.connect(master);

      const zen2 = ctx.createOscillator();
      zen2.type = 'sine';
      zen2.frequency.setValueAtTime(165, zenTime + 0.06); // E3 — perfect fifth
      zen2.connect(zen2Gain);
      zen2.start(zenTime + 0.06);
      zen2.stop(zenTime + 0.95);

      // Third bowl voice — sub-octave for extra depth
      const zen3Gain = ctx.createGain();
      zen3Gain.gain.setValueAtTime(0, zenTime + 0.02);
      zen3Gain.gain.linearRampToValueAtTime(0.07, zenTime + 0.1);
      zen3Gain.gain.setValueAtTime(0.07, zenTime + 0.25);
      zen3Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.75);
      zen3Gain.connect(master);

      const zen3 = ctx.createOscillator();
      zen3.type = 'sine';
      zen3.frequency.setValueAtTime(55, zenTime + 0.02); // A1 — sub-octave om
      zen3.connect(zen3Gain);
      zen3.start(zenTime + 0.02);
      zen3.stop(zenTime + 0.9);

      // --- Layer 2b: SINGING BOWL CHIME — crystalline strike in the center ---
      const chimeTime = now + 0.15;

      // Fundamental — A3 (220Hz) singing bowl strike
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, chimeTime);
      chimeGain.gain.linearRampToValueAtTime(0.09, chimeTime + 0.005);
      chimeGain.gain.exponentialRampToValueAtTime(0.04, chimeTime + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.7);
      chimeGain.connect(master);

      const chime = ctx.createOscillator();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(220, chimeTime);
      chime.frequency.exponentialRampToValueAtTime(218, chimeTime + 0.6);
      chime.connect(chimeGain);
      chime.start(chimeTime);
      chime.stop(chimeTime + 0.75);

      // Overtone — E4 (330Hz) perfect fifth shimmer
      const chime2Gain = ctx.createGain();
      chime2Gain.gain.setValueAtTime(0, chimeTime + 0.01);
      chime2Gain.gain.linearRampToValueAtTime(0.04, chimeTime + 0.015);
      chime2Gain.gain.exponentialRampToValueAtTime(0.015, chimeTime + 0.1);
      chime2Gain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.5);
      chime2Gain.connect(master);

      const chime2 = ctx.createOscillator();
      chime2.type = 'sine';
      chime2.frequency.setValueAtTime(330, chimeTime + 0.01);
      chime2.connect(chime2Gain);
      chime2.start(chimeTime + 0.01);
      chime2.stop(chimeTime + 0.55);

      // --- Layer 3: BASS DESCENT ---
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0, now + 0.06);
      swellGain.gain.linearRampToValueAtTime(0.1, now + 0.12);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      swellGain.connect(master);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, now + 0.08);
      swell.frequency.exponentialRampToValueAtTime(28, now + 0.65);
      swell.connect(swellGain);
      swell.start(now + 0.08);
      swell.stop(now + 0.72);

      // --- Layer 3b: TRON DISSOLVE — energy being PUSHED DOWN into the grid ---
      // Feels negative: descending pressure → breaks into particles → gone

      // Pressure tone — starts present, gets crushed downward
      const derezGain = ctx.createGain();
      derezGain.gain.setValueAtTime(0, now + 0.06);
      derezGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      derezGain.gain.setValueAtTime(0.06, now + 0.18);
      derezGain.gain.linearRampToValueAtTime(0.035, now + 0.45);
      derezGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      derezGain.connect(master);

      const derez = ctx.createOscillator();
      derez.type = 'sawtooth';
      derez.frequency.setValueAtTime(140, now + 0.08);    // Much lower start
      derez.frequency.exponentialRampToValueAtTime(18, now + 0.8);

      const derezLP = ctx.createBiquadFilter();
      derezLP.type = 'lowpass';
      derezLP.frequency.setValueAtTime(120, now + 0.08);
      derezLP.frequency.exponentialRampToValueAtTime(20, now + 0.8);
      derezLP.Q.value = 0.3;

      derez.connect(derezLP);
      derezLP.connect(derezGain);
      derez.start(now + 0.08);
      derez.stop(now + 0.88);

      // Sub-pressure — a sine that drops below hearing, "pushed into the floor"
      const pressGain = ctx.createGain();
      pressGain.gain.setValueAtTime(0, now + 0.08);
      pressGain.gain.linearRampToValueAtTime(0.08, now + 0.12);
      pressGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      pressGain.connect(master);

      const press = ctx.createOscillator();
      press.type = 'sine';
      press.frequency.setValueAtTime(80, now + 0.1);
      press.frequency.exponentialRampToValueAtTime(12, now + 0.65); // Below hearing = gone
      press.connect(pressGain);
      press.start(now + 0.1);
      press.stop(now + 0.72);

      // Airy dissolve tail — smooth breath-like exhale, not granular
      const breathLen = 0.7;
      const breathSize = Math.ceil(ctx.sampleRate * breathLen);
      const breathBuf = ctx.createBuffer(1, breathSize, ctx.sampleRate);
      const breathData = breathBuf.getChannelData(0);
      for (let i = 0; i < breathSize; i++) {
        const t = i / breathSize;
        // Smooth exponential fade — like a soft exhale
        const env = Math.pow(1 - t, 3.5);
        breathData[i] = (Math.random() * 2 - 1) * env;
      }
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = breathBuf;

      const breathLP = ctx.createBiquadFilter();
      breathLP.type = 'lowpass';
      breathLP.frequency.setValueAtTime(40, now + 0.15);
      breathLP.frequency.exponentialRampToValueAtTime(12, now + 0.15 + breathLen);
      breathLP.Q.value = 0.05;

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.03, now + 0.12);
      breathGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + breathLen);

      breathSrc.connect(breathLP);
      breathLP.connect(breathGain);
      breathGain.connect(master);
      breathSrc.start(now + 0.15);
      breathSrc.stop(now + 0.15 + breathLen + 0.01);

      // --- Layer 4: ELECTRIC WARMTH — filtered sawtooth undertow ---
      const techGain = ctx.createGain();
      techGain.gain.setValueAtTime(0, now);
      techGain.gain.linearRampToValueAtTime(0.045, now + 0.03);
      techGain.gain.setValueAtTime(0.045, now + 0.12);
      techGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      techGain.connect(master);

      const tech = ctx.createOscillator();
      tech.type = 'sawtooth';
      tech.frequency.setValueAtTime(50, now);
      tech.frequency.exponentialRampToValueAtTime(38, now + 0.55);

      const techLP = ctx.createBiquadFilter();
      techLP.type = 'lowpass';
      techLP.frequency.value = 70;
      techLP.Q.value = 0.3;

      tech.connect(techLP);
      techLP.connect(techGain);
      tech.start(now);
      tech.stop(now + 0.62);

      // --- Layer 5: COIN WEIGHT — heavy gold coin settling on stone ---
      // Low-pitched filtered ring that subconsciously says "currency"
      const coinTime = now + 0.015;
      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0, coinTime);
      coinGain.gain.linearRampToValueAtTime(0.018, coinTime + 0.008);
      coinGain.gain.exponentialRampToValueAtTime(0.006, coinTime + 0.06);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.25);
      coinGain.connect(master);

      const coin = ctx.createOscillator();
      coin.type = 'sine';  // Sine instead of triangle — rounder, no harmonics
      coin.frequency.setValueAtTime(140, coinTime);  // Much lower
      coin.frequency.exponentialRampToValueAtTime(110, coinTime + 0.2);

      const coinLP = ctx.createBiquadFilter();
      coinLP.type = 'lowpass';
      coinLP.frequency.value = 180;  // Very dark
      coinLP.Q.value = 0.3;

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

      // Master volume — scale entire sound package
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

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
      stampGain.connect(master);

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
      subGain.connect(master);

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
      zenGain.connect(master);

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
      zen2Gain.connect(master);

      const zen2 = ctx.createOscillator();
      zen2.type = 'sine';
      zen2.frequency.setValueAtTime(165, zenTime + 0.08); // E3 — perfect fifth, harmonic
      zen2.connect(zen2Gain);
      zen2.start(zenTime + 0.08);
      zen2.stop(zenTime + 0.95);

      // --- Phase 2b: Extra zen sub-octave voice ---
      const zen3Gain = ctx.createGain();
      zen3Gain.gain.setValueAtTime(0, zenTime + 0.03);
      zen3Gain.gain.linearRampToValueAtTime(0.06, zenTime + 0.15);
      zen3Gain.gain.setValueAtTime(0.06, zenTime + 0.35);
      zen3Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 1.0);
      zen3Gain.connect(master);

      const zen3 = ctx.createOscillator();
      zen3.type = 'sine';
      zen3.frequency.setValueAtTime(55, zenTime + 0.03); // A1 — sub-octave depth
      zen3.connect(zen3Gain);
      zen3.start(zenTime + 0.03);
      zen3.stop(zenTime + 1.05);

      // --- Phase 2b: SINGING BOWL CHIME — crystalline strike ---
      const chimeTime = now + 0.18;

      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, chimeTime);
      chimeGain.gain.linearRampToValueAtTime(0.1, chimeTime + 0.005);
      chimeGain.gain.exponentialRampToValueAtTime(0.045, chimeTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.85);
      chimeGain.connect(master);

      const chime = ctx.createOscillator();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(220, chimeTime);
      chime.frequency.exponentialRampToValueAtTime(218, chimeTime + 0.7);
      chime.connect(chimeGain);
      chime.start(chimeTime);
      chime.stop(chimeTime + 0.9);

      const chime2Gain = ctx.createGain();
      chime2Gain.gain.setValueAtTime(0, chimeTime + 0.01);
      chime2Gain.gain.linearRampToValueAtTime(0.045, chimeTime + 0.015);
      chime2Gain.gain.exponentialRampToValueAtTime(0.018, chimeTime + 0.12);
      chime2Gain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.6);
      chime2Gain.connect(master);

      const chime2 = ctx.createOscillator();
      chime2.type = 'sine';
      chime2.frequency.setValueAtTime(330, chimeTime + 0.01);
      chime2.connect(chime2Gain);
      chime2.start(chimeTime + 0.01);
      chime2.stop(chimeTime + 0.65);

      // --- Phase 3: BASS DESCENT ---
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0, now + 0.1);
      swellGain.gain.linearRampToValueAtTime(0.12, now + 0.2);
      swellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      swellGain.connect(master);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, now + 0.1);
      swell.frequency.exponentialRampToValueAtTime(22, now + 0.9);
      swell.connect(swellGain);
      swell.start(now + 0.1);
      swell.stop(now + 1.05);

      // --- Phase 3b: TRON DISSOLVE — kWh derezzing into the blockchain ---
      // Bigger, longer version — the full "energy becomes currency" moment

      // Derez sweep — descending resonant sawtooth
      // Pressure tone — crushed downward, longer
      const derezGain = ctx.createGain();
      derezGain.gain.setValueAtTime(0, now + 0.1);
      derezGain.gain.linearRampToValueAtTime(0.06, now + 0.15);
      derezGain.gain.setValueAtTime(0.06, now + 0.25);
      derezGain.gain.linearRampToValueAtTime(0.03, now + 0.6);
      derezGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      derezGain.connect(master);

      const derez = ctx.createOscillator();
      derez.type = 'sawtooth';
      derez.frequency.setValueAtTime(160, now + 0.1);  // Much lower start
      derez.frequency.exponentialRampToValueAtTime(15, now + 1.0);

      const derezLP = ctx.createBiquadFilter();
      derezLP.type = 'lowpass';
      derezLP.frequency.setValueAtTime(130, now + 0.1);
      derezLP.frequency.exponentialRampToValueAtTime(18, now + 1.0);
      derezLP.Q.value = 0.3;

      derez.connect(derezLP);
      derezLP.connect(derezGain);
      derez.start(now + 0.1);
      derez.stop(now + 1.12);

      // Sub-pressure — pushed below hearing
      const pressGain = ctx.createGain();
      pressGain.gain.setValueAtTime(0, now + 0.12);
      pressGain.gain.linearRampToValueAtTime(0.07, now + 0.18);
      pressGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      pressGain.connect(master);

      const press = ctx.createOscillator();
      press.type = 'sine';
      press.frequency.setValueAtTime(90, now + 0.12);
      press.frequency.exponentialRampToValueAtTime(10, now + 0.85);
      press.connect(pressGain);
      press.start(now + 0.12);
      press.stop(now + 0.92);

      // Airy dissolve tail — smooth breath exhale, longer for confirm
      const breathLen = 0.9;
      const breathSize = Math.ceil(ctx.sampleRate * breathLen);
      const breathBuf = ctx.createBuffer(1, breathSize, ctx.sampleRate);
      const breathData = breathBuf.getChannelData(0);
      for (let i = 0; i < breathSize; i++) {
        const t = i / breathSize;
        const env = Math.pow(1 - t, 3.2);
        breathData[i] = (Math.random() * 2 - 1) * env;
      }
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = breathBuf;

      const breathLP = ctx.createBiquadFilter();
      breathLP.type = 'lowpass';
      breathLP.frequency.setValueAtTime(35, now + 0.2);
      breathLP.frequency.exponentialRampToValueAtTime(10, now + 0.2 + breathLen);
      breathLP.Q.value = 0.05;

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.03, now + 0.2);
      breathGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + breathLen);

      breathSrc.connect(breathLP);
      breathLP.connect(breathGain);
      breathGain.connect(master);
      breathSrc.start(now + 0.2);
      breathSrc.stop(now + 0.2 + breathLen + 0.01);


      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
