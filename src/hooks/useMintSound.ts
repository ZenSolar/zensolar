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
      const duration = 0.3;

      // --- Layer 1: Low sine hum (gentle foundation) ---
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0, now);
      humGain.gain.linearRampToValueAtTime(0.07, now + 0.01);
      humGain.gain.setValueAtTime(0.07, now + duration * 0.4);
      humGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      humGain.connect(ctx.destination);

      const hum = ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(65, now); // Very low — like a transformer hum
      hum.frequency.exponentialRampToValueAtTime(55, now + duration);
      hum.connect(humGain);
      hum.start(now);
      hum.stop(now + duration + 0.05);

      // --- Layer 2: Soft triangle overtone (warmth) ---
      const warmGain = ctx.createGain();
      warmGain.gain.setValueAtTime(0, now);
      warmGain.gain.linearRampToValueAtTime(0.03, now + 0.015);
      warmGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
      warmGain.connect(ctx.destination);

      const warm = ctx.createOscillator();
      warm.type = 'triangle';
      warm.frequency.setValueAtTime(130, now); // Octave above
      warm.frequency.exponentialRampToValueAtTime(110, now + duration * 0.6);
      warm.connect(warmGain);
      warm.start(now);
      warm.stop(now + duration);

      // --- Layer 3: Very subtle electric texture (filtered noise) ---
      const texLen = 0.06;
      const bufSize = Math.ceil(ctx.sampleRate * texLen);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        // Very sparse, gentle crackle
        data[i] = Math.random() < 0.15
          ? (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.4
          : 0;
      }
      const tex = ctx.createBufferSource();
      tex.buffer = buf;

      const texGain = ctx.createGain();
      texGain.gain.setValueAtTime(0.025, now);
      texGain.gain.exponentialRampToValueAtTime(0.001, now + texLen);

      // Low-pass keeps it muffled/warm, not sharp
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2000;
      lp.Q.value = 0.7;

      tex.connect(lp);
      lp.connect(texGain);
      texGain.connect(ctx.destination);
      tex.start(now);
      tex.stop(now + texLen);

      // --- Haptic: light tap synchronized with sound ---
      triggerHaptic('light');
    } catch {
      // Silent fail — sound is enhancement, not critical
    }
  }, [getCtx, triggerHaptic]);

  /** Heavier haptic + sound for confirmation screen */
  const playConfirmSound = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Deeper, slightly longer version
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
      gain.gain.setValueAtTime(0.09, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.45);

      // Warm overtone
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.04, now + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      g2.connect(ctx.destination);

      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(110, now);
      o2.connect(g2);
      o2.start(now);
      o2.stop(now + 0.35);

      triggerHaptic('confirm');
    } catch {
      // Silent fail
    }
  }, [getCtx, triggerHaptic]);

  return { playMintSound, playConfirmSound, triggerHaptic };
}
