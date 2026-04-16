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

/** Play a confetti popping / crackling celebration sound */
function playCelebrationPop() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // 1. Initial POP — short burst of filtered noise
    const popLen = 0.08;
    const popBuffer = ctx.createBuffer(1, ctx.sampleRate * popLen, ctx.sampleRate);
    const popData = popBuffer.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
      // Sharp attack, fast decay
      const env = Math.exp(-i / (popData.length * 0.15));
      popData[i] = (Math.random() * 2 - 1) * env;
    }
    const popSrc = ctx.createBufferSource();
    popSrc.buffer = popBuffer;
    const popFilter = ctx.createBiquadFilter();
    popFilter.type = 'bandpass';
    popFilter.frequency.value = 1800;
    popFilter.Q.value = 1.2;
    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.35, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + popLen);
    popSrc.connect(popFilter).connect(popGain).connect(ctx.destination);
    popSrc.start(now);
    popSrc.stop(now + popLen);

    // 2. Low thump for body
    const thumpOsc = ctx.createOscillator();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(120, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.25, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thumpOsc.connect(thumpGain).connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.15);

    // 3. Crackle scatter — several tiny noise pops spread over ~300ms
    for (let j = 0; j < 6; j++) {
      const delay = 0.03 + Math.random() * 0.25;
      const crackleLen = 0.02 + Math.random() * 0.03;
      const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * crackleLen, ctx.sampleRate);
      const crackleData = crackleBuffer.getChannelData(0);
      for (let i = 0; i < crackleData.length; i++) {
        crackleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackleData.length * 0.3));
      }
      const crackleSrc = ctx.createBufferSource();
      crackleSrc.buffer = crackleBuffer;
      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 2000 + Math.random() * 3000;
      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0.08 + Math.random() * 0.12, now + delay);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + delay + crackleLen);
      crackleSrc.connect(crackleFilter).connect(crackleGain).connect(ctx.destination);
      crackleSrc.start(now + delay);
      crackleSrc.stop(now + delay + crackleLen + 0.01);
    }

    // 4. Bright shimmer tail — short high-freq sweep for sparkle
    const shimmerOsc = ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(4000, now + 0.05);
    shimmerOsc.frequency.exponentialRampToValueAtTime(8000, now + 0.25);
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    shimmerOsc.connect(shimmerGain).connect(ctx.destination);
    shimmerOsc.start(now + 0.05);
    shimmerOsc.stop(now + 0.35);
  } catch {
    // Silently fail
  }
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
    playCelebrationPop();

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
    playCelebrationPop();

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
    playCelebrationPop();
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
