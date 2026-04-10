import { useCallback, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Unified mint interaction — a gentle, low-tone electric hum
 * paired with haptic vibration. Feels like energy transferring
 * through the screen into your fingertip.
 */

let sharedAudioContext: AudioContext | null = null;
let unlockListenersInstalled = false;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

/** Detect standalone PWA mode (iOS Add-to-Home-Screen) */
const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};

const createSharedAudioContext = () => {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextCtor();

    // In PWA standalone mode, iOS aggressively suspends the AudioContext.
    // Keep it alive by playing inaudible pulses every 4 seconds.
    if (isStandalonePWA() && !keepAliveInterval) {
      keepAliveInterval = setInterval(() => {
        if (sharedAudioContext && sharedAudioContext.state === 'running') {
          fireSilentUnlockPulse(sharedAudioContext);
        }
      }, 4000);
    }
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
        // In PWA standalone, resume() must be called synchronously within
        // the user gesture. We call it and also fire a silent pulse to
        // ensure the context transitions to 'running' immediately.
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
      // If context is still suspended (PWA edge case), force resume
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          // Re-trigger the sound after resume completes
          playMintSound(_color);
        }).catch(() => {});
        return;
      }
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

      // ══════════════════════════════════════════════════════════
      //  All layers fit within 1.2s to match visual BURST_DURATION
      // ══════════════════════════════════════════════════════════
      const END = 1.2;

      // ─── Sub-bass foundation (24Hz) — deep chest vibration ───
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, t0);
      subGain.gain.linearRampToValueAtTime(0.28, t0 + 0.01);
      subGain.gain.setValueAtTime(0.28, t0 + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + END);
      subGain.connect(master);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(24, t0);
      sub.frequency.exponentialRampToValueAtTime(20, t0 + END);
      sub.connect(subGain);
      sub.start(t0);
      sub.stop(t0 + END + 0.05);

      // ─── Deep fundamental (55Hz A1) — the resonant body of the gong ───
      const fundGain = ctx.createGain();
      fundGain.gain.setValueAtTime(0, t0);
      fundGain.gain.linearRampToValueAtTime(0.34, t0 + 0.004);
      fundGain.gain.setValueAtTime(0.34, t0 + 0.06);
      fundGain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.35);
      fundGain.gain.exponentialRampToValueAtTime(0.001, t0 + END);
      fundGain.connect(master);

      const fund = ctx.createOscillator();
      fund.type = 'sine';
      fund.frequency.setValueAtTime(55, t0);
      fund.frequency.exponentialRampToValueAtTime(52, t0 + END);
      fund.connect(fundGain);
      fund.start(t0);
      fund.stop(t0 + END + 0.05);

      // ─── Warm mid partial (98Hz) — singing bowl "om" ───
      const midGain = ctx.createGain();
      midGain.gain.setValueAtTime(0, t0);
      midGain.gain.linearRampToValueAtTime(0.16, t0 + 0.006);
      midGain.gain.setValueAtTime(0.16, t0 + 0.08);
      midGain.gain.exponentialRampToValueAtTime(0.04, t0 + 0.5);
      midGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
      midGain.connect(master);

      const mid = ctx.createOscillator();
      mid.type = 'sine';
      mid.frequency.setValueAtTime(98, t0);
      mid.frequency.exponentialRampToValueAtTime(95, t0 + 0.8);
      mid.connect(midGain);
      mid.start(t0);
      mid.stop(t0 + 1.05);

      // ─── Upper partial (155Hz) — inharmonic gong character ───
      const up1Gain = ctx.createGain();
      up1Gain.gain.setValueAtTime(0, t0);
      up1Gain.gain.linearRampToValueAtTime(0.10, t0 + 0.003);
      up1Gain.gain.exponentialRampToValueAtTime(0.03, t0 + 0.15);
      up1Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
      up1Gain.connect(master);

      const up1 = ctx.createOscillator();
      up1.type = 'sine';
      up1.frequency.setValueAtTime(155, t0);
      up1.frequency.exponentialRampToValueAtTime(150, t0 + 0.55);
      up1.connect(up1Gain);
      up1.start(t0);
      up1.stop(t0 + 0.75);

      // ─── Shimmer partial (275Hz) — presence, fast decay ───
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, t0);
      shimGain.gain.linearRampToValueAtTime(0.05, t0 + 0.003);
      shimGain.gain.exponentialRampToValueAtTime(0.012, t0 + 0.08);
      shimGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      shimGain.connect(master);

      const shim = ctx.createOscillator();
      shim.type = 'sine';
      shim.frequency.setValueAtTime(275, t0);
      shim.connect(shimGain);
      shim.start(t0);
      shim.stop(t0 + 0.5);

      // ─── Metallic attack — soft mallet tap, heavily filtered ───
      const atkLen = 0.04;
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
      atkBP.frequency.exponentialRampToValueAtTime(150, t0 + 0.02);
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
      sweepGain.gain.setValueAtTime(0, t0 + 0.01);
      sweepGain.gain.linearRampToValueAtTime(0.05, t0 + 0.06);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);
      sweepGain.connect(master);

      const sweep = ctx.createOscillator();
      sweep.type = 'sine';
      sweep.frequency.setValueAtTime(75, t0 + 0.01);
      sweep.frequency.exponentialRampToValueAtTime(22, t0 + 0.8);
      sweep.connect(sweepGain);
      sweep.start(t0 + 0.01);
      sweep.stop(t0 + 0.85);

      // ─── Electric warmth — deep triangle wave ───
      const techGain = ctx.createGain();
      techGain.gain.setValueAtTime(0, t0);
      techGain.gain.linearRampToValueAtTime(0.04, t0 + 0.02);
      techGain.gain.setValueAtTime(0.04, t0 + 0.1);
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
      tech.stop(t0 + 0.75);

      // ─── Electric hum buzz — intertwined with gong, same start/end ───
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0, t0);
      humGain.gain.linearRampToValueAtTime(0.02, t0 + 0.004);
      humGain.gain.linearRampToValueAtTime(0.04, t0 + 0.4);
      humGain.gain.linearRampToValueAtTime(0.04, t0 + 0.65);
      humGain.gain.exponentialRampToValueAtTime(0.001, t0 + END);
      humGain.connect(master);

      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.setValueAtTime(60, t0);

      const humLP = ctx.createBiquadFilter();
      humLP.type = 'lowpass';
      humLP.frequency.value = 120;
      humLP.Q.value = 1.5;

      const hum2Gain = ctx.createGain();
      hum2Gain.gain.setValueAtTime(0, t0);
      hum2Gain.gain.linearRampToValueAtTime(0.01, t0 + 0.004);
      hum2Gain.gain.linearRampToValueAtTime(0.018, t0 + 0.5);
      hum2Gain.gain.linearRampToValueAtTime(0.018, t0 + 0.7);
      hum2Gain.gain.exponentialRampToValueAtTime(0.001, t0 + END);
      hum2Gain.connect(master);

      const hum2 = ctx.createOscillator();
      hum2.type = 'sine';
      hum2.frequency.setValueAtTime(120, t0);

      const hum2LP = ctx.createBiquadFilter();
      hum2LP.type = 'lowpass';
      hum2LP.frequency.value = 180;
      hum2LP.Q.value = 0.8;

      hum.connect(humLP);
      humLP.connect(humGain);
      hum.start(t0);
      hum.stop(t0 + END + 0.05);

      hum2.connect(hum2LP);
      hum2LP.connect(hum2Gain);
      hum2.start(t0);
      hum2.stop(t0 + END + 0.05);

      // ─── Coin weight — low rumble ───
      const coinTime = t0 + 0.01;
      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0, coinTime);
      coinGain.gain.linearRampToValueAtTime(0.02, coinTime + 0.008);
      coinGain.gain.exponentialRampToValueAtTime(0.008, coinTime + 0.08);
      coinGain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.45);
      coinGain.connect(master);

      const coin = ctx.createOscillator();
      coin.type = 'sine';
      coin.frequency.setValueAtTime(120, coinTime);
      coin.frequency.exponentialRampToValueAtTime(90, coinTime + 0.25);

      const coinLP = ctx.createBiquadFilter();
      coinLP.type = 'lowpass';
      coinLP.frequency.value = 150;
      coinLP.Q.value = 0.3;

      coin.connect(coinLP);
      coinLP.connect(coinGain);
      coin.start(coinTime);
      coin.stop(coinTime + 0.35);

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
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => playConfirmSound()).catch(() => {});
        return;
      }
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

  /**
   * ZenSolar™ Access Denied — locked vault clang
   * Short, dissonant metallic strike that descends into silence.
   * Inspired by the mint gong but twisted: detuned, harsh, abrupt.
   */
  const playDeniedSound = useCallback(() => {
    try {
      const ctx = primeAudio();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => playDeniedSound()).catch(() => {});
        return;
      }
      const now = ctx.currentTime + 0.02;

      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);

      const END = 0.55;

      // ─── Harsh metallic clang — detuned dissonant pair ───
      const clang1Gain = ctx.createGain();
      clang1Gain.gain.setValueAtTime(0, now);
      clang1Gain.gain.linearRampToValueAtTime(0.35, now + 0.003);
      clang1Gain.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
      clang1Gain.gain.exponentialRampToValueAtTime(0.001, now + END);
      clang1Gain.connect(master);

      const clang1 = ctx.createOscillator();
      clang1.type = 'square';
      clang1.frequency.setValueAtTime(185, now);
      clang1.frequency.exponentialRampToValueAtTime(95, now + END);

      const clang1LP = ctx.createBiquadFilter();
      clang1LP.type = 'lowpass';
      clang1LP.frequency.setValueAtTime(800, now);
      clang1LP.frequency.exponentialRampToValueAtTime(120, now + END);
      clang1LP.Q.value = 3;

      clang1.connect(clang1LP);
      clang1LP.connect(clang1Gain);
      clang1.start(now);
      clang1.stop(now + END + 0.05);

      // ─── Second clang — slightly detuned for dissonance ───
      const clang2Gain = ctx.createGain();
      clang2Gain.gain.setValueAtTime(0, now);
      clang2Gain.gain.linearRampToValueAtTime(0.25, now + 0.003);
      clang2Gain.gain.exponentialRampToValueAtTime(0.05, now + 0.06);
      clang2Gain.gain.exponentialRampToValueAtTime(0.001, now + END * 0.8);
      clang2Gain.connect(master);

      const clang2 = ctx.createOscillator();
      clang2.type = 'sawtooth';
      clang2.frequency.setValueAtTime(197, now); // Detuned from clang1
      clang2.frequency.exponentialRampToValueAtTime(80, now + END);

      const clang2LP = ctx.createBiquadFilter();
      clang2LP.type = 'lowpass';
      clang2LP.frequency.setValueAtTime(600, now);
      clang2LP.frequency.exponentialRampToValueAtTime(100, now + END * 0.7);
      clang2LP.Q.value = 2;

      clang2.connect(clang2LP);
      clang2LP.connect(clang2Gain);
      clang2.start(now);
      clang2.stop(now + END + 0.05);

      // ─── Metallic noise burst — door slam transient ───
      const noiseLen = 0.06;
      const noiseSize = Math.ceil(ctx.sampleRate * noiseLen);
      const noiseBuf = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseSize; i++) {
        const t = i / noiseSize;
        const env = Math.pow(1 - t, 8);
        noiseData[i] = (Math.random() * 2 - 1) * env;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const noiseBP = ctx.createBiquadFilter();
      noiseBP.type = 'bandpass';
      noiseBP.frequency.setValueAtTime(400, now);
      noiseBP.frequency.exponentialRampToValueAtTime(100, now + noiseLen);
      noiseBP.Q.value = 1.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

      noiseSrc.connect(noiseBP);
      noiseBP.connect(noiseGain);
      noiseGain.connect(master);
      noiseSrc.start(now);
      noiseSrc.stop(now + noiseLen + 0.01);

      // ─── Sub thud — locked door impact ───
      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0, now);
      thudGain.gain.linearRampToValueAtTime(0.3, now + 0.005);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      thudGain.connect(master);

      const thud = ctx.createOscillator();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(65, now);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      thud.connect(thudGain);
      thud.start(now);
      thud.stop(now + 0.35);

      // Harsh haptic
      try {
        navigator.vibrate?.([40, 20, 40]);
      } catch {}
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});

    } catch {
      // Silent fail
    }
  }, [primeAudio]);

  // ── Welcome tap: a friendly, softer cousin of the mint gong ──
  const playWelcomeTap = useCallback(() => {
    try {
      const ctx = primeAudio();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => playWelcomeTap()).catch(() => {});
        return;
      }
      const now = ctx.currentTime + 0.02;

      const master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);

      const DUR = 0.5;

      // Warm chime — higher, lighter than the mint gong
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, now);
      chimeGain.gain.linearRampToValueAtTime(0.4, now + 0.008);
      chimeGain.gain.exponentialRampToValueAtTime(0.1, now + 0.15);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + DUR);
      chimeGain.connect(master);

      const chime = ctx.createOscillator();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(440, now); // A4
      chime.frequency.exponentialRampToValueAtTime(420, now + DUR);
      chime.connect(chimeGain);
      chime.start(now);
      chime.stop(now + DUR + 0.05);

      // Soft harmonic shimmer
      const shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0, now);
      shimGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      shimGain.gain.exponentialRampToValueAtTime(0.001, now + DUR * 0.7);
      shimGain.connect(master);

      const shim = ctx.createOscillator();
      shim.type = 'sine';
      shim.frequency.setValueAtTime(660, now); // E5 — perfect fifth
      shim.connect(shimGain);
      shim.start(now);
      shim.stop(now + DUR + 0.05);

      // Gentle sub presence
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + DUR * 0.6);
      subGain.connect(master);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(220, now); // A3
      sub.connect(subGain);
      sub.start(now);
      sub.stop(now + DUR + 0.05);

    } catch {
      // Silent fail
    }
  }, [primeAudio]);

  return { primeAudio, playMintSound, playConfirmSound, playDeniedSound, playWelcomeTap, triggerHaptic };
}
