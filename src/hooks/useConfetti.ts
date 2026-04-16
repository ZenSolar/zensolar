import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

const CONFETTI_Z = 99999;

// Shared AudioContext — created on first user gesture, reused forever
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browsers auto-suspend after idle)
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/** Warm up the AudioContext on a user gesture so it's ready later */
export function warmAudioContext() {
  getAudioCtx();
}

/** Play a short celebratory chime via Web Audio API */
function playCelebrationChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch {
    // Silently fail if Web Audio unavailable
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
    playCelebrationChime();

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
    playCelebrationChime();

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
    playCelebrationChime();
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
