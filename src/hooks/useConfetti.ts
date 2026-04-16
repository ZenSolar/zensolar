import { useCallback } from 'react';
import confetti from 'canvas-confetti';

const CONFETTI_Z = 99999;

// Shared AudioContext — created on first user gesture, reused forever
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/** Warm up the AudioContext on a user gesture so celebration sound works after async delays */
export function warmAudioContext() {
  getAudioCtx();
}

/** Play a deep zen gong + coins-dropping celebration sound */
function playCelebrationGongChaChing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Master gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.6, now);
    master.connect(ctx.destination);

    // ═══════════════════════════════════════════
    //  LAYER 1: DEEP ZEN GONG (extended resonance)
    // ═══════════════════════════════════════════

    // Sub-bass foundation (30Hz) — long, slow decay
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.28, now + 0.008);
    subGain.gain.setValueAtTime(0.28, now + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.12, now + 2.0);
    subGain.gain.exponentialRampToValueAtTime(0.04, now + 4.5);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 6.0);
    subGain.connect(master);
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(30, now);
    sub.frequency.exponentialRampToValueAtTime(27, now + 5.0);
    sub.connect(subGain);
    sub.start(now);
    sub.stop(now + 6.2);

    // Fundamental — C2 (65Hz) deep singing bowl body — long sustain
    const fundGain = ctx.createGain();
    fundGain.gain.setValueAtTime(0, now);
    fundGain.gain.linearRampToValueAtTime(0.38, now + 0.005);
    fundGain.gain.setValueAtTime(0.38, now + 0.12);
    fundGain.gain.exponentialRampToValueAtTime(0.2, now + 1.5);
    fundGain.gain.exponentialRampToValueAtTime(0.1, now + 3.5);
    fundGain.gain.exponentialRampToValueAtTime(0.03, now + 5.5);
    fundGain.gain.exponentialRampToValueAtTime(0.001, now + 7.0);
    fundGain.connect(master);
    const fund = ctx.createOscillator();
    fund.type = 'sine';
    fund.frequency.setValueAtTime(65, now);
    fund.frequency.exponentialRampToValueAtTime(61, now + 6.0);
    fund.connect(fundGain);
    fund.start(now);
    fund.stop(now + 7.2);

    // Second partial — inharmonic (~155Hz) — medium sustain
    const p2Gain = ctx.createGain();
    p2Gain.gain.setValueAtTime(0, now);
    p2Gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
    p2Gain.gain.exponentialRampToValueAtTime(0.06, now + 0.4);
    p2Gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    p2Gain.connect(master);
    const p2 = ctx.createOscillator();
    p2.type = 'sine';
    p2.frequency.setValueAtTime(155, now);
    p2.frequency.exponentialRampToValueAtTime(148, now + 2.0);
    p2.connect(p2Gain);
    p2.start(now);
    p2.stop(now + 2.7);

    // Third partial — shimmer (~310Hz)
    const p3Gain = ctx.createGain();
    p3Gain.gain.setValueAtTime(0, now);
    p3Gain.gain.linearRampToValueAtTime(0.07, now + 0.003);
    p3Gain.gain.exponentialRampToValueAtTime(0.02, now + 0.3);
    p3Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    p3Gain.connect(master);
    const p3 = ctx.createOscillator();
    p3.type = 'sine';
    p3.frequency.setValueAtTime(310, now);
    p3.connect(p3Gain);
    p3.start(now);
    p3.stop(now + 1.7);

    // Fourth partial — bell-like overtone (~520Hz)
    const p4Gain = ctx.createGain();
    p4Gain.gain.setValueAtTime(0, now);
    p4Gain.gain.linearRampToValueAtTime(0.04, now + 0.002);
    p4Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    p4Gain.connect(master);
    const p4 = ctx.createOscillator();
    p4.type = 'sine';
    p4.frequency.value = 520;
    p4.connect(p4Gain);
    p4.start(now);
    p4.stop(now + 1.0);

    // Strike transient — filtered noise for the mallet "hit"
    const strikeLen = 0.05;
    const strikeBuf = ctx.createBuffer(1, ctx.sampleRate * strikeLen, ctx.sampleRate);
    const sd = strikeBuf.getChannelData(0);
    for (let i = 0; i < sd.length; i++) {
      sd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sd.length * 0.08));
    }
    const strikeSrc = ctx.createBufferSource();
    strikeSrc.buffer = strikeBuf;
    const strikeFlt = ctx.createBiquadFilter();
    strikeFlt.type = 'bandpass';
    strikeFlt.frequency.value = 2000;
    strikeFlt.Q.value = 0.6;
    const strikeG = ctx.createGain();
    strikeG.gain.setValueAtTime(0.18, now);
    strikeG.gain.exponentialRampToValueAtTime(0.001, now + strikeLen);
    strikeSrc.connect(strikeFlt).connect(strikeG).connect(master);
    strikeSrc.start(now);
    strikeSrc.stop(now + strikeLen + 0.01);

    // ═══════════════════════════════════════════
    //  LAYER 2: MARIO COIN SOUND
    //  Classic two-tone "ding-ding!" — B5→E6
    //  Starts ~300ms after gong strike
    // ═══════════════════════════════════════════
    const coinT = now + 0.5;

    // --- First tone: B5 (988Hz) — short staccato ---
    const t1Gain = ctx.createGain();
    t1Gain.gain.setValueAtTime(0, coinT);
    t1Gain.gain.linearRampToValueAtTime(0.16, coinT + 0.001);
    t1Gain.gain.setValueAtTime(0.16, coinT + 0.04);
    t1Gain.gain.exponentialRampToValueAtTime(0.001, coinT + 0.08);
    t1Gain.connect(master);

    const t1 = ctx.createOscillator();
    t1.type = 'square';
    t1.frequency.value = 988;
    t1.connect(t1Gain);
    t1.start(coinT);
    t1.stop(coinT + 0.1);

    // Harmonic overlay for first tone (adds brightness)
    const t1h = ctx.createOscillator();
    t1h.type = 'sine';
    t1h.frequency.value = 988 * 2;
    const t1hG = ctx.createGain();
    t1hG.gain.setValueAtTime(0, coinT);
    t1hG.gain.linearRampToValueAtTime(0.04, coinT + 0.001);
    t1hG.gain.exponentialRampToValueAtTime(0.001, coinT + 0.06);
    t1h.connect(t1hG);
    t1hG.connect(master);
    t1h.start(coinT);
    t1h.stop(coinT + 0.08);

    // --- Second tone: E6 (1319Hz) — longer sustain, the "payoff" ---
    const t2Start = coinT + 0.075;
    const t2Gain = ctx.createGain();
    t2Gain.gain.setValueAtTime(0, t2Start);
    t2Gain.gain.linearRampToValueAtTime(0.18, t2Start + 0.001);
    t2Gain.gain.setValueAtTime(0.18, t2Start + 0.15);
    t2Gain.gain.exponentialRampToValueAtTime(0.12, t2Start + 0.4);
    t2Gain.gain.exponentialRampToValueAtTime(0.001, t2Start + 0.8);
    t2Gain.connect(master);

    const t2 = ctx.createOscillator();
    t2.type = 'square';
    t2.frequency.value = 1319;
    t2.connect(t2Gain);
    t2.start(t2Start);
    t2.stop(t2Start + 0.85);

    // Harmonic overlay for second tone
    const t2h = ctx.createOscillator();
    t2h.type = 'sine';
    t2h.frequency.value = 1319 * 2;
    const t2hG = ctx.createGain();
    t2hG.gain.setValueAtTime(0, t2Start);
    t2hG.gain.linearRampToValueAtTime(0.1, t2Start + 0.001);
    t2hG.gain.setValueAtTime(0.1, t2Start + 0.1);
    t2hG.gain.exponentialRampToValueAtTime(0.001, t2Start + 0.5);
    t2h.connect(t2hG);
    t2hG.connect(master);
    t2h.start(t2Start);
    t2h.stop(t2Start + 0.55);

    // Third harmonic for extra sparkle
    const t2h3 = ctx.createOscillator();
    t2h3.type = 'sine';
    t2h3.frequency.value = 1319 * 3;
    const t2h3G = ctx.createGain();
    t2h3G.gain.setValueAtTime(0, t2Start);
    t2h3G.gain.linearRampToValueAtTime(0.04, t2Start + 0.001);
    t2h3G.gain.exponentialRampToValueAtTime(0.001, t2Start + 0.3);
    t2h3.connect(t2h3G);
    t2h3G.connect(master);
    t2h3.start(t2Start);
    t2h3.stop(t2Start + 0.35);
  } catch {
    // Silently fail
  }
}

/** Trigger a subtle screen shake effect */
function triggerScreenShake() {
  try {
    const el = document.documentElement;
    el.style.transition = 'none';
    const frames = [
      { t: 0, x: 0, y: 0 },
      { t: 30, x: -3, y: 2 },
      { t: 60, x: 4, y: -2 },
      { t: 90, x: -2, y: 3 },
      { t: 120, x: 3, y: -1 },
      { t: 150, x: -1, y: 1 },
      { t: 200, x: 0, y: 0 },
    ];
    frames.forEach(({ t, x, y }) => {
      setTimeout(() => {
        el.style.transform = `translate(${x}px, ${y}px)`;
      }, t);
    });
    setTimeout(() => {
      el.style.transform = '';
      el.style.transition = '';
    }, 250);
  } catch {}
}

/** Trigger haptic celebration pattern */
function triggerCelebrationHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([15, 40, 15, 40, 30, 60, 50]);
    } catch {}
  }
}

export function useConfetti() {
  const triggerConfetti = useCallback(() => {
    triggerCelebrationHaptic();
    triggerScreenShake();
    playCelebrationGongChaChing();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      zIndex: CONFETTI_Z,
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      zIndex: CONFETTI_Z,
    });
  }, []);

  const triggerCelebration = useCallback(() => {
    triggerCelebrationHaptic();
    triggerScreenShake();
    playCelebrationGongChaChing();

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: CONFETTI_Z };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const triggerStars = useCallback(() => {
    triggerCelebrationHaptic();
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      shapes: ['star'],
      colors: ['#FFD700', '#FFA500', '#FFFF00'],
      scalar: 1.2,
      zIndex: CONFETTI_Z,
    });
  }, []);

  const triggerGoldBurst = useCallback(() => {
    triggerCelebrationHaptic();
    triggerScreenShake();
    playCelebrationGongChaChing();
    confetti({
      particleCount: 150,
      spread: 180,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFC107', '#FF9800', '#FFEB3B'],
      gravity: 0.8,
      scalar: 1.5,
      zIndex: CONFETTI_Z,
    });
  }, []);

  return {
    triggerConfetti,
    triggerCelebration,
    triggerStars,
    triggerGoldBurst,
  };
}
