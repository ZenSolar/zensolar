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
    master.gain.setValueAtTime(0.55, now);
    master.connect(ctx.destination);

    // ═══════════════════════════════════════════
    //  LAYER 1: DEEP ZEN GONG (extended resonance)
    // ═══════════════════════════════════════════

    // Sub-bass foundation (30Hz) — long, slow decay
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.22, now + 0.008);
    subGain.gain.setValueAtTime(0.22, now + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.08, now + 1.5);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
    subGain.connect(master);
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(30, now);
    sub.frequency.exponentialRampToValueAtTime(27, now + 3.5);
    sub.connect(subGain);
    sub.start(now);
    sub.stop(now + 4.2);

    // Fundamental — C2 (65Hz) deep singing bowl body — long sustain
    const fundGain = ctx.createGain();
    fundGain.gain.setValueAtTime(0, now);
    fundGain.gain.linearRampToValueAtTime(0.32, now + 0.005);
    fundGain.gain.setValueAtTime(0.32, now + 0.12);
    fundGain.gain.exponentialRampToValueAtTime(0.15, now + 1.0);
    fundGain.gain.exponentialRampToValueAtTime(0.06, now + 2.5);
    fundGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
    fundGain.connect(master);
    const fund = ctx.createOscillator();
    fund.type = 'sine';
    fund.frequency.setValueAtTime(65, now);
    fund.frequency.exponentialRampToValueAtTime(61, now + 4.0);
    fund.connect(fundGain);
    fund.start(now);
    fund.stop(now + 4.7);

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
    //  LAYER 2: COINS DROPPING (metallic clinks)
    //  Multiple coin impacts at slightly different times
    //  like coins tumbling onto a counter
    // ═══════════════════════════════════════════

    // Generate 8 coin impacts spread over ~600ms starting 200ms after gong
    const coinStart = now + 0.2;
    const coinTimings = [0, 0.06, 0.14, 0.2, 0.28, 0.38, 0.46, 0.55];
    const coinFreqs = [6200, 5400, 7100, 4800, 6800, 5900, 7500, 5100];
    
    for (let c = 0; c < coinTimings.length; c++) {
      const t = coinStart + coinTimings[c];
      const freq = coinFreqs[c];
      const vol = 0.08 + Math.random() * 0.06;
      
      // Each coin = sharp metallic ping with fast decay
      const coinG = ctx.createGain();
      coinG.gain.setValueAtTime(0, t);
      coinG.gain.linearRampToValueAtTime(vol, t + 0.001);
      coinG.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.02);
      coinG.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + Math.random() * 0.08);
      coinG.connect(master);
      
      // Primary ping
      const coinOsc = ctx.createOscillator();
      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(freq, t);
      coinOsc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.05);
      coinOsc.connect(coinG);
      coinOsc.start(t);
      coinOsc.stop(t + 0.25);
      
      // Coin harmonic (slight inharmonicity for realism)
      const coinH = ctx.createOscillator();
      coinH.type = 'sine';
      coinH.frequency.value = freq * 2.76; // Non-integer ratio = metallic
      const coinHG = ctx.createGain();
      coinHG.gain.setValueAtTime(0, t);
      coinHG.gain.linearRampToValueAtTime(vol * 0.3, t + 0.001);
      coinHG.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      coinH.connect(coinHG);
      coinHG.connect(master);
      coinH.start(t);
      coinH.stop(t + 0.1);

      // Tiny noise click for each coin impact
      const clickLen = 0.008;
      const clickBuf = ctx.createBuffer(1, ctx.sampleRate * clickLen, ctx.sampleRate);
      const cd = clickBuf.getChannelData(0);
      for (let i = 0; i < cd.length; i++) {
        cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cd.length * 0.05));
      }
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const clickFlt = ctx.createBiquadFilter();
      clickFlt.type = 'highpass';
      clickFlt.frequency.value = 3000 + Math.random() * 2000;
      const clickG = ctx.createGain();
      clickG.gain.setValueAtTime(vol * 0.5, t);
      clickG.gain.exponentialRampToValueAtTime(0.001, t + clickLen);
      clickSrc.connect(clickFlt).connect(clickG).connect(master);
      clickSrc.start(t);
      clickSrc.stop(t + clickLen + 0.005);
    }

    // Final "settling" — a couple of quiet, soft pings as coins settle
    for (let s = 0; s < 3; s++) {
      const t = coinStart + 0.7 + s * 0.12;
      const sG = ctx.createGain();
      sG.gain.setValueAtTime(0, t);
      sG.gain.linearRampToValueAtTime(0.03 - s * 0.008, t + 0.001);
      sG.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      sG.connect(master);
      const sO = ctx.createOscillator();
      sO.type = 'sine';
      sO.frequency.value = 5500 + Math.random() * 2000;
      sO.connect(sG);
      sO.start(t);
      sO.stop(t + 0.1);
    }
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
