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

/** Play a gong strike + cha-ching celebration sound */
function playCelebrationGongChaChing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Master gain for the whole celebration
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, now);
    master.connect(ctx.destination);

    // ═══════════════════════════════════════════
    //  LAYER 1: ZEN GONG STRIKE (singing bowl)
    // ═══════════════════════════════════════════

    // Fundamental — C2 (65Hz) deep resonance
    const gongFundGain = ctx.createGain();
    gongFundGain.gain.setValueAtTime(0, now);
    gongFundGain.gain.linearRampToValueAtTime(0.3, now + 0.004);
    gongFundGain.gain.setValueAtTime(0.3, now + 0.08);
    gongFundGain.gain.exponentialRampToValueAtTime(0.12, now + 0.5);
    gongFundGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    gongFundGain.connect(master);
    const gongFund = ctx.createOscillator();
    gongFund.type = 'sine';
    gongFund.frequency.setValueAtTime(65, now);
    gongFund.frequency.exponentialRampToValueAtTime(62, now + 1.5);
    gongFund.connect(gongFundGain);
    gongFund.start(now);
    gongFund.stop(now + 2.2);

    // Second partial — inharmonic gong character (~155Hz)
    const gong2Gain = ctx.createGain();
    gong2Gain.gain.setValueAtTime(0, now);
    gong2Gain.gain.linearRampToValueAtTime(0.12, now + 0.003);
    gong2Gain.gain.exponentialRampToValueAtTime(0.04, now + 0.2);
    gong2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    gong2Gain.connect(master);
    const gong2 = ctx.createOscillator();
    gong2.type = 'sine';
    gong2.frequency.setValueAtTime(155, now);
    gong2.connect(gong2Gain);
    gong2.start(now);
    gong2.stop(now + 1.2);

    // Third partial — shimmer (~310Hz)
    const gong3Gain = ctx.createGain();
    gong3Gain.gain.setValueAtTime(0, now);
    gong3Gain.gain.linearRampToValueAtTime(0.06, now + 0.002);
    gong3Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    gong3Gain.connect(master);
    const gong3 = ctx.createOscillator();
    gong3.type = 'sine';
    gong3.frequency.setValueAtTime(310, now);
    gong3.connect(gong3Gain);
    gong3.start(now);
    gong3.stop(now + 0.8);

    // Strike transient — filtered noise burst for the "hit"
    const strikeLen = 0.04;
    const strikeBuf = ctx.createBuffer(1, ctx.sampleRate * strikeLen, ctx.sampleRate);
    const strikeData = strikeBuf.getChannelData(0);
    for (let i = 0; i < strikeData.length; i++) {
      strikeData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (strikeData.length * 0.1));
    }
    const strikeSrc = ctx.createBufferSource();
    strikeSrc.buffer = strikeBuf;
    const strikeFilter = ctx.createBiquadFilter();
    strikeFilter.type = 'bandpass';
    strikeFilter.frequency.value = 2500;
    strikeFilter.Q.value = 0.8;
    const strikeGain = ctx.createGain();
    strikeGain.gain.setValueAtTime(0.2, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + strikeLen);
    strikeSrc.connect(strikeFilter).connect(strikeGain).connect(master);
    strikeSrc.start(now);
    strikeSrc.stop(now + strikeLen + 0.01);

    // ═══════════════════════════════════════════
    //  LAYER 2: CHA-CHING (cash register bell)
    //  Starts ~150ms after gong for layered impact
    // ═══════════════════════════════════════════
    const chaStart = now + 0.15;

    // "Cha" — first bell hit (high metallic ping ~3200Hz)
    const cha1Gain = ctx.createGain();
    cha1Gain.gain.setValueAtTime(0, chaStart);
    cha1Gain.gain.linearRampToValueAtTime(0.18, chaStart + 0.002);
    cha1Gain.gain.exponentialRampToValueAtTime(0.06, chaStart + 0.08);
    cha1Gain.gain.exponentialRampToValueAtTime(0.001, chaStart + 0.3);
    cha1Gain.connect(master);
    const cha1 = ctx.createOscillator();
    cha1.type = 'sine';
    cha1.frequency.setValueAtTime(3200, chaStart);
    cha1.frequency.exponentialRampToValueAtTime(2800, chaStart + 0.15);
    cha1.connect(cha1Gain);
    cha1.start(chaStart);
    cha1.stop(chaStart + 0.35);

    // Harmonic overlay for cha (~4800Hz)
    const cha1hGain = ctx.createGain();
    cha1hGain.gain.setValueAtTime(0, chaStart);
    cha1hGain.gain.linearRampToValueAtTime(0.08, chaStart + 0.002);
    cha1hGain.gain.exponentialRampToValueAtTime(0.001, chaStart + 0.15);
    cha1hGain.connect(master);
    const cha1h = ctx.createOscillator();
    cha1h.type = 'sine';
    cha1h.frequency.value = 4800;
    cha1h.connect(cha1hGain);
    cha1h.start(chaStart);
    cha1h.stop(chaStart + 0.2);

    // "Ching" — second bell hit (~3800Hz, slightly delayed)
    const chingStart = chaStart + 0.12;
    const chingGain = ctx.createGain();
    chingGain.gain.setValueAtTime(0, chingStart);
    chingGain.gain.linearRampToValueAtTime(0.22, chingStart + 0.002);
    chingGain.gain.exponentialRampToValueAtTime(0.08, chingStart + 0.1);
    chingGain.gain.exponentialRampToValueAtTime(0.001, chingStart + 0.5);
    chingGain.connect(master);
    const ching = ctx.createOscillator();
    ching.type = 'sine';
    ching.frequency.setValueAtTime(3800, chingStart);
    ching.frequency.exponentialRampToValueAtTime(3400, chingStart + 0.2);
    ching.connect(chingGain);
    ching.start(chingStart);
    ching.stop(chingStart + 0.55);

    // Ching harmonic (~5700Hz)
    const chinghGain = ctx.createGain();
    chinghGain.gain.setValueAtTime(0, chingStart);
    chinghGain.gain.linearRampToValueAtTime(0.1, chingStart + 0.002);
    chinghGain.gain.exponentialRampToValueAtTime(0.001, chingStart + 0.2);
    chinghGain.connect(master);
    const chingh = ctx.createOscillator();
    chingh.type = 'sine';
    chingh.frequency.value = 5700;
    chingh.connect(chinghGain);
    chingh.start(chingStart);
    chingh.stop(chingStart + 0.25);

    // Mechanical click noise (cash register drawer)
    const clickLen = 0.015;
    const clickBuf = ctx.createBuffer(1, ctx.sampleRate * clickLen, ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickData.length; i++) {
      clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickData.length * 0.08));
    }
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 4000;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.12, chaStart);
    clickGain.gain.exponentialRampToValueAtTime(0.001, chaStart + clickLen);
    clickSrc.connect(clickFilter).connect(clickGain).connect(master);
    clickSrc.start(chaStart);
    clickSrc.stop(chaStart + clickLen + 0.01);

    // Coin jingle scatter — tiny metallic pings
    for (let j = 0; j < 4; j++) {
      const delay = 0.25 + Math.random() * 0.3;
      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0, now + delay);
      coinGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.04, now + delay + 0.001);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      coinGain.connect(master);
      const coin = ctx.createOscillator();
      coin.type = 'sine';
      coin.frequency.value = 5000 + Math.random() * 3000;
      coin.connect(coinGain);
      coin.start(now + delay);
      coin.stop(now + delay + 0.15);
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
