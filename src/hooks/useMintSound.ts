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

const profiles: Record<string, SoundProfile> = {
  // Solar: warm chime — bright rising tone
  gold: { freq: 880, freq2: 1320, wave: 'sine', attack: 0.005, decay: 0.25, click: true },
  // Battery: deep thump — low resonant pulse
  teal: { freq: 220, freq2: 330, wave: 'triangle', attack: 0.003, decay: 0.2, click: true },
  // EV Miles: electric whir — mid sweep
  green: { freq: 440, freq2: 660, wave: 'sine', attack: 0.01, decay: 0.18, click: true },
  // Supercharger: electric zap — sharp crackling
  cyan: { freq: 1200, freq2: 600, wave: 'sawtooth', attack: 0.002, decay: 0.12, click: true },
  // Home charger: soft hum — gentle pulse
  greenGold: { freq: 520, freq2: 780, wave: 'sine', attack: 0.008, decay: 0.2, click: true },
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

  const playMintSound = useCallback((color: string) => {
    try {
      const ctx = getCtx();
      const profile = profiles[color] || profiles.gold;
      const now = ctx.currentTime;

      // Master gain — keep it subtle
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.12, now + profile.attack);
      master.gain.exponentialRampToValueAtTime(0.001, now + profile.attack + profile.decay);
      master.connect(ctx.destination);

      // Primary tone
      const osc1 = ctx.createOscillator();
      osc1.type = profile.wave;
      osc1.frequency.setValueAtTime(profile.freq, now);
      // Slight pitch rise for that "energy release" feel
      osc1.frequency.exponentialRampToValueAtTime(profile.freq * 1.15, now + profile.decay * 0.6);
      osc1.connect(master);
      osc1.start(now);
      osc1.stop(now + profile.attack + profile.decay + 0.05);

      // Harmonic layer (quieter)
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0, now);
      harmGain.gain.linearRampToValueAtTime(0.05, now + profile.attack);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + profile.attack + profile.decay * 0.7);
      harmGain.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(profile.freq2, now);
      osc2.connect(harmGain);
      osc2.start(now);
      osc2.stop(now + profile.attack + profile.decay);

      // Click transient — very short noise burst for tactile "snap"
      if (profile.click) {
        const clickLen = 0.015;
        const bufferSize = Math.ceil(ctx.sampleRate * clickLen);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Decaying noise
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const clickNode = ctx.createBufferSource();
        clickNode.buffer = buffer;

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.08, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + clickLen);

        // Bandpass to keep it crisp, not hissy
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 1.5;

        clickNode.connect(filter);
        filter.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickNode.start(now);
        clickNode.stop(now + clickLen);
      }
    } catch {
      // Silent fail — sound is enhancement, not critical
    }
  }, [getCtx]);

  return { playMintSound };
}
