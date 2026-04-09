import { useCallback, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Unified mint interaction — a gentle, low-tone electric hum
 * paired with haptic vibration. Feels like energy transferring
 * through the screen into your fingertip.
 */

let sharedAudioContext: AudioContext | null = null;
let unlockListenersInstalled = false;

const createSharedAudioContext = () => {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextCtor();
  }
  return sharedAudioContext;
};

const fireSilentUnlockPulse = (ctx: AudioContext) => {
  const silentGain = ctx.createGain();
  silentGain.gain.setValueAtTime(0.00001, ctx.currentTime);
  silentGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.connect(silentGain);
  osc.onended = () => {
    osc.disconnect();
    silentGain.disconnect();
  };
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
};

const installGlobalUnlockListeners = () => {
  if (unlockListenersInstalled || typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const ctx = createSharedAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      fireSilentUnlockPulse(ctx);
    } catch {
      // Silent fail
    }
  };

  const passiveCapture: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener('touchstart', unlock, passiveCapture);
  window.addEventListener('pointerdown', unlock, passiveCapture);
  window.addEventListener('mousedown', unlock, passiveCapture);
  window.addEventListener('keydown', unlock, { capture: true });
  unlockListenersInstalled = true;
};

export function useMintSound() {
  const getCtx = useCallback(() => createSharedAudioContext(), []);

  useEffect(() => {
    installGlobalUnlockListeners();
  }, []);

  /** Must be called synchronously inside a touch/click handler to unlock
   *  the AudioContext on iOS Safari. Uses native capture listeners plus a
   *  same-gesture silent pulse so the first hold-release can play reliably. */
  const primeAudio = useCallback(() => {
    installGlobalUnlockListeners();
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      fireSilentUnlockPulse(ctx);
      return ctx;
    } catch {
      return null;
    }
  }, [getCtx]);

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
      const ctx = primeAudio();
      if (!ctx) return;
      const now = ctx.currentTime + 0.035;

      // Master volume — scale entire sound package
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      // Echo bus — two taps for reverb-like spatial depth
      const echo1Delay = ctx.createDelay(1.0);
      echo1Delay.delayTime.value = 0.18;
      const echo1Gain = ctx.createGain();
      echo1Gain.gain.value = 0.15;
      const echo1LP = ctx.createBiquadFilter();
      echo1LP.type = 'lowpass';
      echo1LP.frequency.value = 200;
      echo1LP.Q.value = 0.1;
      master.connect(echo1Delay);
      echo1Delay.connect(echo1LP);
      echo1LP.connect(echo1Gain);
      echo1Gain.connect(ctx.destination);

      // Second echo — darker, further away
      const echo2Delay = ctx.createDelay(2.0);
      echo2Delay.delayTime.value = 0.38;
      const echo2Gain = ctx.createGain();
      echo2Gain.gain.value = 0.07;
      const echo2LP = ctx.createBiquadFilter();
      echo2LP.type = 'lowpass';
      echo2LP.frequency.value = 140;
      echo2LP.Q.value = 0.05;
      master.connect(echo2Delay);
      echo2Delay.connect(echo2LP);
      echo2LP.connect(echo2Gain);
      echo2Gain.connect(ctx.destination);

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Tap-to-Mint — Single Unified Gong Strike
      //  All partials hit simultaneously as one cohesive metallic tone
      // ══════════════════════════════════════════════════════════

      const t0 = now; // Everything starts together — one strike

      // ─── Sub-bass foundation (24Hz) — deep chest vibration ───
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, t0);
      subGain.gain.linearRampToValueAtTime(0.28, t0 + 0.01);
      subGain.gain.setValueAtTime(0.28, t0 + 0.15);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.4);
      subGain.connect(master);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(24, t0);
      sub.frequency.exponentialRampToValueAtTime(20, t0 + 2.0);
      sub.connect(subGain);
      sub.start(t0);
      sub.stop(t0 + 2.6);

      // ─── Deep fundamental (55Hz A1) — the resonant body of the gong ───
      const fundGain = ctx.createGain();
      fundGain.gain.setValueAtTime(0, t0);
      fundGain.gain.linearRampToValueAtTime(0.34, t0 + 0.004);
      fundGain.gain.setValueAtTime(0.34, t0 + 0.1);
      fundGain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.6);
      fundGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.4);
      fundGain.connect(master);

      const fund = ctx.createOscillator();
      fund.type = 'sine';
      fund.frequency.setValueAtTime(55, t0);
      fund.frequency.exponentialRampToValueAtTime(52, t0 + 2.0);
      fund.connect(fundGain);
      fund.start(t0);
      fund.stop(t0 + 2.6);

      // ─── Warm mid partial (98Hz) — singing bowl "om" ───
      const midGain = ctx.createGain();
      midGain.gain.setValueAtTime(0, t0);
      midGain.gain.linearRampToValueAtTime(0.16, t0 + 0.006);
      midGain.gain.setValueAtTime(0.16, t0 + 0.08);
      midGain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.5);
      midGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.6);
      midGain.connect(master);

      const mid = ctx.createOscillator();
      mid.type = 'sine';
      mid.frequency.setValueAtTime(98, t0);
      mid.frequency.exponentialRampToValueAtTime(95, t0 + 1.2);
      mid.connect(midGain);
      mid.start(t0);
      mid.stop(t0 + 1.8);

      // ─── Upper partial (155Hz) — inharmonic gong character ───
      const up1Gain = ctx.createGain();
      up1Gain.gain.setValueAtTime(0, t0);
      up1Gain.gain.linearRampToValueAtTime(0.10, t0 + 0.003);
      up1Gain.gain.exponentialRampToValueAtTime(0.03, t0 + 0.15);
      up1Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
      up1Gain.connect(master);

      const up1 = ctx.createOscillator();
      up1.type = 'sine';
      up1.frequency.setValueAtTime(155, t0);
      up1.frequency.exponentialRampToValueAtTime(150, t0 + 0.8);
      up1.connect(up1Gain);
      up1.start(t0);
      up1.stop(t0 + 1.2);

      // ─── Shimmer partial (275Hz) — presence, fast decay ───
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, t0);
      shimGain.gain.linearRampToValueAtTime(0.05, t0 + 0.003);
      shimGain.gain.exponentialRampToValueAtTime(0.012, t0 + 0.08);
      shimGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      shimGain.connect(master);

      const shim = ctx.createOscillator();
      shim.type = 'sine';
      shim.frequency.setValueAtTime(275, t0);
      shim.connect(shimGain);
      shim.start(t0);
      shim.stop(t0 + 0.6);

      // ─── Metallic attack — soft mallet tap, heavily filtered ───
      const atkLen = 0.06;
      const atkSize = Math.ceil(ctx.sampleRate * atkLen);
      const atkBuf = ctx.createBuffer(1, atkSize, ctx.sampleRate);
      const atkData = atkBuf.getChannelData(0);
      for (let i = 0; i < atkSize; i++) {
        const t = i / atkSize;
        const env = Math.pow(1 - t, 12);
        atkData[i] = (Math.random() * 2 - 1) * env;
      }
      const atkSrc = ctx.createBufferSource();
      atkSrc.buffer = atkBuf;

      const atkBP = ctx.createBiquadFilter();
      atkBP.type = 'bandpass';
      atkBP.frequency.setValueAtTime(600, t0);
      atkBP.frequency.exponentialRampToValueAtTime(150, t0 + 0.03);
      atkBP.Q.value = 2.5;

      const atkSmooth = ctx.createBiquadFilter();
      atkSmooth.type = 'lowpass';
      atkSmooth.frequency.value = 400;
      atkSmooth.Q.value = 0.5;

      const atkGain = ctx.createGain();
      atkGain.gain.setValueAtTime(0.07, t0);
      atkGain.gain.exponentialRampToValueAtTime(0.001, t0 + atkLen);

      atkSrc.connect(atkBP);
      atkBP.connect(atkSmooth);
      atkSmooth.connect(atkGain);
      atkGain.connect(master);
      atkSrc.start(t0);
      atkSrc.stop(t0 + atkLen + 0.01);

      // ─── Low resonance hum — deep sine sweep ───
      const sweepGain = ctx.createGain();
      sweepGain.gain.setValueAtTime(0, t0 + 0.02);
      sweepGain.gain.linearRampToValueAtTime(0.05, t0 + 0.08);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
      sweepGain.connect(master);

      const sweep = ctx.createOscillator();
      sweep.type = 'sine';
      sweep.frequency.setValueAtTime(75, t0 + 0.02);
      sweep.frequency.exponentialRampToValueAtTime(22, t0 + 1.0);
      sweep.connect(sweepGain);
      sweep.start(t0 + 0.02);
      sweep.stop(t0 + 1.2);

      // ─── Electric warmth — deep triangle wave ───
      const techGain = ctx.createGain();
      techGain.gain.setValueAtTime(0, t0);
      techGain.gain.linearRampToValueAtTime(0.04, t0 + 0.03);
      techGain.gain.setValueAtTime(0.04, t0 + 0.15);
      techGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
      techGain.connect(master);

      const tech = ctx.createOscillator();
      tech.type = 'triangle';
      tech.frequency.setValueAtTime(42, t0);
      tech.frequency.exponentialRampToValueAtTime(30, t0 + 0.7);

      const techLP = ctx.createBiquadFilter();
      techLP.type = 'lowpass';
      techLP.frequency.value = 50;
      techLP.Q.value = 0.2;

      tech.connect(techLP);
      techLP.connect(techGain);
      tech.start(t0);
      tech.stop(t0 + 0.8);

      // ─── Electric hum buzz — 60Hz mains hum that swells in the middle ───
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0, t0);
      humGain.gain.linearRampToValueAtTime(0.0, t0 + 0.15);
      humGain.gain.linearRampToValueAtTime(0.035, t0 + 0.5);
      humGain.gain.linearRampToValueAtTime(0.04, t0 + 0.8);
      humGain.gain.exponentialRampToValueAtTime(0.012, t0 + 1.4);
      humGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.2);
      humGain.connect(master);

      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.setValueAtTime(60, t0);

      // Heavy lowpass to keep only the buzzy fundamental, no harshness
      const humLP = ctx.createBiquadFilter();
      humLP.type = 'lowpass';
      humLP.frequency.value = 120;
      humLP.Q.value = 1.5;

      // Second harmonic for that transformer-hum character
      const hum2Gain = ctx.createGain();
      hum2Gain.gain.setValueAtTime(0, t0);
      hum2Gain.gain.linearRampToValueAtTime(0.0, t0 + 0.2);
      hum2Gain.gain.linearRampToValueAtTime(0.015, t0 + 0.6);
      hum2Gain.gain.linearRampToValueAtTime(0.018, t0 + 0.9);
      hum2Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.0);
      hum2Gain.connect(master);

      const hum2 = ctx.createOscillator();
      hum2.type = 'sine';
      hum2.frequency.setValueAtTime(120, t0); // 2nd harmonic of 60Hz

      const hum2LP = ctx.createBiquadFilter();
      hum2LP.type = 'lowpass';
      hum2LP.frequency.value = 180;
      hum2LP.Q.value = 0.8;

      hum.connect(humLP);
      humLP.connect(humGain);
      hum.start(t0);
      hum.stop(t0 + 2.4);

      hum2.connect(hum2LP);
      hum2LP.connect(hum2Gain);
      hum2.start(t0);
      hum2.stop(t0 + 2.2);

      // ─── Coin weight — low rumble ───
      const coinTime = t0 + 0.015;
      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0, coinTime);
      coinGain.gain.linearRampToValueAtTime(0.02, coinTime + 0.008);
      coinGain.gain.exponentialRampToValueAtTime(0.008, coinTime + 0.08);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.35);
      coinGain.connect(master);

      const coin = ctx.createOscillator();
      coin.type = 'sine';
      coin.frequency.setValueAtTime(120, coinTime);
      coin.frequency.exponentialRampToValueAtTime(90, coinTime + 0.3);

      const coinLP = ctx.createBiquadFilter();
      coinLP.type = 'lowpass';
      coinLP.frequency.value = 150;
      coinLP.Q.value = 0.3;

      coin.connect(coinLP);
      coinLP.connect(coinGain);
      coin.start(coinTime);
      coin.stop(coinTime + 0.5);

      triggerHaptic('light');
    } catch {
      // Silent fail
    }
  }, [primeAudio, triggerHaptic]);
  /** Confirm mint: ZenSolar™ — stamp → deep meditative bowl bloom → bass sustain */
  const playConfirmSound = useCallback(() => {
    try {
      const ctx = primeAudio();
      if (!ctx) return;
      const now = ctx.currentTime + 0.035;

      // Master volume — scale entire sound package
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      // Echo bus — two taps for reverb-like spatial depth
      const echo1Delay = ctx.createDelay(1.0);
      echo1Delay.delayTime.value = 0.22;
      const echo1Gain = ctx.createGain();
      echo1Gain.gain.value = 0.12;
      const echo1LP = ctx.createBiquadFilter();
      echo1LP.type = 'lowpass';
      echo1LP.frequency.value = 180;
      echo1LP.Q.value = 0.1;
      master.connect(echo1Delay);
      echo1Delay.connect(echo1LP);
      echo1LP.connect(echo1Gain);
      echo1Gain.connect(ctx.destination);

      // Second echo — darker, further away
      const echo2Delay = ctx.createDelay(2.0);
      echo2Delay.delayTime.value = 0.45;
      const echo2Gain = ctx.createGain();
      echo2Gain.gain.value = 0.06;
      const echo2LP = ctx.createBiquadFilter();
      echo2LP.type = 'lowpass';
      echo2LP.frequency.value = 120;
      echo2LP.Q.value = 0.05;
      master.connect(echo2Delay);
      echo2Delay.connect(echo2LP);
      echo2LP.connect(echo2Gain);
      echo2Gain.connect(ctx.destination);

      // ══════════════════════════════════════════════════════════
      //  ZenSolar™ Confirm Sound — Gong strike → Meditative Bass
      // ══════════════════════════════════════════════════════════

      // ─── Layer 0: ZEN GONG STRIKE (confirm version — deeper, longer) ───
      const gongTime = now;

      // Gong fundamental — C2 (65Hz)
      const gongFundGain = ctx.createGain();
      gongFundGain.gain.setValueAtTime(0, gongTime);
      gongFundGain.gain.linearRampToValueAtTime(0.35, gongTime + 0.004);
      gongFundGain.gain.setValueAtTime(0.35, gongTime + 0.1);
      gongFundGain.gain.exponentialRampToValueAtTime(0.15, gongTime + 0.5);
      gongFundGain.gain.exponentialRampToValueAtTime(0.001, gongTime + 2.2);
      gongFundGain.connect(master);

      const gongFund = ctx.createOscillator();
      gongFund.type = 'sine';
      gongFund.frequency.setValueAtTime(65, gongTime);
      gongFund.frequency.exponentialRampToValueAtTime(62, gongTime + 1.8);
      gongFund.connect(gongFundGain);
      gongFund.start(gongTime);
      gongFund.stop(gongTime + 2.4);

      // Gong second partial
      const gong2Gain = ctx.createGain();
      gong2Gain.gain.setValueAtTime(0, gongTime);
      gong2Gain.gain.linearRampToValueAtTime(0.15, gongTime + 0.003);
      gong2Gain.gain.exponentialRampToValueAtTime(0.05, gongTime + 0.2);
      gong2Gain.gain.exponentialRampToValueAtTime(0.001, gongTime + 1.2);
      gong2Gain.connect(master);

      const gong2 = ctx.createOscillator();
      gong2.type = 'sine';
      gong2.frequency.setValueAtTime(179, gongTime);
      gong2.frequency.exponentialRampToValueAtTime(174, gongTime + 1.0);
      gong2.connect(gong2Gain);
      gong2.start(gongTime);
      gong2.stop(gongTime + 1.4);

      // Gong metallic attack noise
      const gongNoiseLen = 0.15;
      const gongNoiseSize = Math.ceil(ctx.sampleRate * gongNoiseLen);
      const gongNoiseBuf = ctx.createBuffer(1, gongNoiseSize, ctx.sampleRate);
      const gongNoiseData = gongNoiseBuf.getChannelData(0);
      for (let i = 0; i < gongNoiseSize; i++) {
        const t = i / gongNoiseSize;
        gongNoiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 6);
      }
      const gongNoiseSrc = ctx.createBufferSource();
      gongNoiseSrc.buffer = gongNoiseBuf;

      const gongNoiseBP = ctx.createBiquadFilter();
      gongNoiseBP.type = 'bandpass';
      gongNoiseBP.frequency.setValueAtTime(2000, gongTime);
      gongNoiseBP.frequency.exponentialRampToValueAtTime(350, gongTime + 0.1);
      gongNoiseBP.Q.value = 1.5;

      const gongNoiseGain = ctx.createGain();
      gongNoiseGain.gain.setValueAtTime(0.2, gongTime);
      gongNoiseGain.gain.exponentialRampToValueAtTime(0.001, gongTime + gongNoiseLen);

      gongNoiseSrc.connect(gongNoiseBP);
      gongNoiseBP.connect(gongNoiseGain);
      gongNoiseGain.connect(master);
      gongNoiseSrc.start(gongTime);
      gongNoiseSrc.stop(gongTime + gongNoiseLen + 0.01);

      // Gong sub-bass bloom
      const gongSubGain = ctx.createGain();
      gongSubGain.gain.setValueAtTime(0, gongTime);
      gongSubGain.gain.linearRampToValueAtTime(0.18, gongTime + 0.01);
      gongSubGain.gain.setValueAtTime(0.18, gongTime + 0.12);
      gongSubGain.gain.exponentialRampToValueAtTime(0.001, gongTime + 1.6);
      gongSubGain.connect(master);

      const gongSub = ctx.createOscillator();
      gongSub.type = 'sine';
      gongSub.frequency.setValueAtTime(32, gongTime);
      gongSub.frequency.exponentialRampToValueAtTime(26, gongTime + 1.4);
      gongSub.connect(gongSubGain);
      gongSub.start(gongTime);
      gongSub.stop(gongTime + 1.8);

      // ─── Existing confirm layers shifted 120ms after gong attack ───
      const mintStart = now + 0.12;

      // --- Phase 1: STAMP (the seal) ---
      const stampGain = ctx.createGain();
      stampGain.gain.setValueAtTime(0, mintStart);
      stampGain.gain.linearRampToValueAtTime(0.26, mintStart + 0.012);
      stampGain.gain.exponentialRampToValueAtTime(0.05, mintStart + 0.06);
      stampGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 0.22);
      stampGain.connect(master);

      const stamp = ctx.createOscillator();
      stamp.type = 'sine';
      stamp.frequency.setValueAtTime(70, mintStart);
      stamp.frequency.exponentialRampToValueAtTime(22, mintStart + 0.1);
      stamp.connect(stampGain);
      stamp.start(mintStart);
      stamp.stop(mintStart + 0.25);

      // Sub-bass weight
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.2, mintStart);
      subGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 0.25);
      subGain.connect(master);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(36, mintStart);
      sub.frequency.exponentialRampToValueAtTime(16, mintStart + 0.18);
      sub.connect(subGain);
      sub.start(mintStart);
      sub.stop(mintStart + 0.27);

      // --- Phase 2: DEEP ZEN BOWL ---
      const zenTime = mintStart + 0.05;
      const zenGain = ctx.createGain();
      zenGain.gain.setValueAtTime(0, zenTime);
      zenGain.gain.linearRampToValueAtTime(0.1, zenTime + 0.1);
      zenGain.gain.setValueAtTime(0.1, zenTime + 0.3);
      zenGain.gain.exponentialRampToValueAtTime(0.001, zenTime + 1.0);
      zenGain.connect(master);

      const zen = ctx.createOscillator();
      zen.type = 'sine';
      zen.frequency.setValueAtTime(110, zenTime);
      zen.connect(zenGain);
      zen.start(zenTime);
      zen.stop(zenTime + 1.05);

      const zen2Gain = ctx.createGain();
      zen2Gain.gain.setValueAtTime(0, zenTime + 0.08);
      zen2Gain.gain.linearRampToValueAtTime(0.06, zenTime + 0.2);
      zen2Gain.gain.setValueAtTime(0.06, zenTime + 0.4);
      zen2Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 0.9);
      zen2Gain.connect(master);

      const zen2 = ctx.createOscillator();
      zen2.type = 'sine';
      zen2.frequency.setValueAtTime(165, zenTime + 0.08);
      zen2.connect(zen2Gain);
      zen2.start(zenTime + 0.08);
      zen2.stop(zenTime + 0.95);

      const zen3Gain = ctx.createGain();
      zen3Gain.gain.setValueAtTime(0, zenTime + 0.03);
      zen3Gain.gain.linearRampToValueAtTime(0.06, zenTime + 0.15);
      zen3Gain.gain.setValueAtTime(0.06, zenTime + 0.35);
      zen3Gain.gain.exponentialRampToValueAtTime(0.001, zenTime + 1.0);
      zen3Gain.connect(master);

      const zen3 = ctx.createOscillator();
      zen3.type = 'sine';
      zen3.frequency.setValueAtTime(55, zenTime + 0.03);
      zen3.connect(zen3Gain);
      zen3.start(zenTime + 0.03);
      zen3.stop(zenTime + 1.05);

      // --- SINGING BOWL CHIME ---
      const chimeTime = mintStart + 0.18;

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
      swellGain.gain.setValueAtTime(0, mintStart + 0.1);
      swellGain.gain.linearRampToValueAtTime(0.12, mintStart + 0.2);
      swellGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 1.0);
      swellGain.connect(master);

      const swell = ctx.createOscillator();
      swell.type = 'sine';
      swell.frequency.setValueAtTime(55, mintStart + 0.1);
      swell.frequency.exponentialRampToValueAtTime(22, mintStart + 0.9);
      swell.connect(swellGain);
      swell.start(mintStart + 0.1);
      swell.stop(mintStart + 1.05);

      // --- Phase 3b: TRON DISSOLVE ---
      const derezGain = ctx.createGain();
      derezGain.gain.setValueAtTime(0, mintStart + 0.1);
      derezGain.gain.linearRampToValueAtTime(0.06, mintStart + 0.15);
      derezGain.gain.setValueAtTime(0.06, mintStart + 0.25);
      derezGain.gain.linearRampToValueAtTime(0.03, mintStart + 0.6);
      derezGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 1.1);
      derezGain.connect(master);

      const derez = ctx.createOscillator();
      derez.type = 'sawtooth';
      derez.frequency.setValueAtTime(160, mintStart + 0.1);
      derez.frequency.exponentialRampToValueAtTime(15, mintStart + 1.0);

      const derezLP = ctx.createBiquadFilter();
      derezLP.type = 'lowpass';
      derezLP.frequency.setValueAtTime(130, mintStart + 0.1);
      derezLP.frequency.exponentialRampToValueAtTime(18, mintStart + 1.0);
      derezLP.Q.value = 0.3;

      derez.connect(derezLP);
      derezLP.connect(derezGain);
      derez.start(mintStart + 0.1);
      derez.stop(mintStart + 1.12);

      // Sub-pressure
      const pressGain = ctx.createGain();
      pressGain.gain.setValueAtTime(0, mintStart + 0.12);
      pressGain.gain.linearRampToValueAtTime(0.07, mintStart + 0.18);
      pressGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 0.9);
      pressGain.connect(master);

      const press = ctx.createOscillator();
      press.type = 'sine';
      press.frequency.setValueAtTime(90, mintStart + 0.12);
      press.frequency.exponentialRampToValueAtTime(10, mintStart + 0.85);
      press.connect(pressGain);
      press.start(mintStart + 0.12);
      press.stop(mintStart + 0.92);

      // Airy dissolve tail
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
      breathLP.frequency.setValueAtTime(35, mintStart + 0.2);
      breathLP.frequency.exponentialRampToValueAtTime(10, mintStart + 0.2 + breathLen);
      breathLP.Q.value = 0.05;

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.03, mintStart + 0.2);
      breathGain.gain.exponentialRampToValueAtTime(0.001, mintStart + 0.2 + breathLen);

      breathSrc.connect(breathLP);
      breathLP.connect(breathGain);
      breathGain.connect(master);
      breathSrc.start(mintStart + 0.2);
      breathSrc.stop(mintStart + 0.2 + breathLen + 0.01);


      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [primeAudio, triggerHaptic]);

  return { primeAudio, playMintSound, playConfirmSound, triggerHaptic };
}
