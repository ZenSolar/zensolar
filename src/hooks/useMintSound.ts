import { useCallback, useRef } from 'react';

/**
 * Synthesised tap-to-mint sound effects using Web Audio API.
 * Each energy category has a unique sonic signature — no audio files needed.
 */

type SoundProfile = {
  /** Base frequency in Hz */
  freq: number;
  /** Second harmonic frequency */
  freq2: number;
  /** Waveform type */
  wave: OscillatorType;
  /** Attack time (seconds) */
  attack: number;
  /** Decay time (seconds) */
  decay: number;
  /** Optional click noise at start */
  click: boolean;
};

/**
 * Unified "electric buzz" — a low rhythmic pulse with crackling overtones.
 * Feels like touching a live energy conduit.
 */
const BUZZ: SoundProfile = {
  freq: 90,       // Deep sub-bass foundation
  freq2: 180,     // Octave harmonic
  wave: 'sawtooth',
  attack: 0.003,
  decay: 0.35,
  click: true,
};

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

  const playMintSound = useCallback((_color?: string) => {
    try {
      const ctx = getCtx();
      const p = BUZZ;
      const now = ctx.currentTime;

      // --- Layer 1: Deep sawtooth pulse (the "body") ---
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.10, now + p.attack);
      // Rhythmic amplitude modulation — 3 quick pulses
      const pulseRate = 0.045;
      for (let i = 0; i < 3; i++) {
        const t = now + p.attack + i * pulseRate * 2;
        masterGain.gain.setValueAtTime(0.10, t);
        masterGain.gain.linearRampToValueAtTime(0.03, t + pulseRate);
        masterGain.gain.linearRampToValueAtTime(0.10, t + pulseRate * 1.8);
      }
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = p.wave;
      osc1.frequency.setValueAtTime(p.freq, now);
      // Slight downward sweep for weight
      osc1.frequency.exponentialRampToValueAtTime(p.freq * 0.7, now + p.decay);
      osc1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + p.decay + 0.05);

      // --- Layer 2: Octave harmonic (adds "electric" edge) ---
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0, now);
      harmGain.gain.linearRampToValueAtTime(0.04, now + p.attack);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + p.decay * 0.6);
      harmGain.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      osc2.type = 'square'; // Buzzy square wave
      osc2.frequency.setValueAtTime(p.freq2, now);
      osc2.frequency.exponentialRampToValueAtTime(p.freq2 * 0.8, now + p.decay * 0.5);
      osc2.connect(harmGain);
      osc2.start(now);
      osc2.stop(now + p.decay);

      // --- Layer 3: High crackle transient (the "zap") ---
      const crackleLen = 0.04;
      const bufSize = Math.ceil(ctx.sampleRate * crackleLen);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        // Sparse crackle — only ~30% of samples have signal
        data[i] = Math.random() < 0.3
          ? (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.8
          : 0;
      }
      const crackle = ctx.createBufferSource();
      crackle.buffer = buf;

      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0.06, now);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + crackleLen);

      // Bandpass keeps it sizzly, not hissy
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4500;
      bp.Q.value = 2;

      crackle.connect(bp);
      bp.connect(crackleGain);
      crackleGain.connect(ctx.destination);
      crackle.start(now);
      crackle.stop(now + crackleLen);
    } catch {
      // Silent fail — sound is enhancement, not critical
    }
  }, [getCtx]);
  return { playMintSound };
}
