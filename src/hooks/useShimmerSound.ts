import { useEffect, useRef } from 'react';

/**
 * useShimmerSound — continuous lightsaber-style ambient hum
 * that pulses in sync with the dashboard shimmer sweep cycle.
 *
 * Uses the shared AudioContext from useMintSound's module scope.
 * The hum swells and fades on each shimmer pass (~5s cycle).
 */

let sharedCtx: AudioContext | null = null;

const getOrCreateCtx = (): AudioContext | null => {
  try {
    if (!sharedCtx || sharedCtx.state === 'closed') {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      sharedCtx = new Ctor();
    }
    return sharedCtx;
  } catch {
    return null;
  }
};

interface ShimmerSoundOptions {
  /** Duration of one shimmer cycle in seconds (default 5) */
  cycleDuration?: number;
  /** Master volume 0-1 (default 0.06 — very subtle) */
  volume?: number;
  /** Whether the sound is active */
  enabled?: boolean;
}

export function useShimmerSound({
  cycleDuration = 5,
  volume = 0.06,
  enabled = true,
}: ShimmerSoundOptions = {}) {
  const nodesRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
    baseOsc: OscillatorNode;
    harmOsc: OscillatorNode;
    subOsc: OscillatorNode;
    wobbleLfo: OscillatorNode;
    wobbleGain: GainNode;
  } | null>(null);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    if (!enabled) {
      // Fade out and stop if disabled
      if (nodesRef.current) {
        const { master, ctx } = nodesRef.current;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        const nodes = nodesRef.current;
        setTimeout(() => {
          try {
            nodes.baseOsc.stop();
            nodes.harmOsc.stop();
            nodes.subOsc.stop();
            nodes.lfo.stop();
            nodes.wobbleLfo.stop();
          } catch { /* already stopped */ }
          nodesRef.current = null;
        }, 1500);
      }
      return;
    }

    // Need a user gesture to start — we wait for the shared context to exist
    // and be running, then start our ambient hum.
    let startTimeout: ReturnType<typeof setTimeout>;
    let disposed = false;

    const tryStart = () => {
      if (disposed || nodesRef.current) return;

      const ctx = getOrCreateCtx();
      if (!ctx || ctx.state !== 'running') {
        // Retry — the context will be unlocked by useMintSound's global listeners
        startTimeout = setTimeout(tryStart, 500);
        return;
      }

      const now = ctx.currentTime;

      // ─── Master gain ───
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      // Fade in over 2 seconds
      master.gain.linearRampToValueAtTime(volumeRef.current, now + 2);
      master.connect(ctx.destination);

      // ─── LFO: volume swell synced to shimmer cycle ───
      // The shimmer sweeps left→right over cycleDuration.
      // We pulse the volume with the same period.
      const lfoFreq = 1 / cycleDuration;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(lfoFreq, now);

      // LFO → gain modulation: amplitude swings ±0.5 around 0.5
      // so volume goes 0→1→0 each cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.45, now); // depth of pulse

      const lfoBias = ctx.createGain();
      lfoBias.gain.setValueAtTime(0.55, now); // center point

      // We'll use a ConstantSource for bias
      const biasNode = ctx.createConstantSource();
      biasNode.offset.setValueAtTime(0.55, now);

      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      biasNode.connect(master.gain);

      // Actually, let's simplify: use setValueAtTime scheduling 
      // for more precise sync with the CSS animation.
      // Re-approach: Just use the LFO approach - it's smooth and close enough.
      
      // Disconnect bias approach, just let master.gain be modulated
      // The LFO will add a sine wave to the gain value
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(volumeRef.current * 0.55, now);

      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);

      biasNode.connect(master.gain);
      biasNode.offset.setValueAtTime(volumeRef.current * 0.55, now);
      lfoGain.gain.setValueAtTime(volumeRef.current * 0.45, now);

      // ─── Base hum: sawtooth @ 92Hz, heavily lowpassed ───
      // Classic lightsaber fundamental
      const baseOsc = ctx.createOscillator();
      baseOsc.type = 'sawtooth';
      baseOsc.frequency.setValueAtTime(92, now);

      const baseLp = ctx.createBiquadFilter();
      baseLp.type = 'lowpass';
      baseLp.frequency.setValueAtTime(220, now);
      baseLp.Q.setValueAtTime(2.0, now);

      const baseGain = ctx.createGain();
      baseGain.gain.setValueAtTime(0.5, now);

      baseOsc.connect(baseLp);
      baseLp.connect(baseGain);
      baseGain.connect(master);

      // ─── Harmonic: sine @ 184Hz (2nd harmonic) ───
      const harmOsc = ctx.createOscillator();
      harmOsc.type = 'sine';
      harmOsc.frequency.setValueAtTime(184, now);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.25, now);

      harmOsc.connect(harmGain);
      harmGain.connect(master);

      // ─── Sub-bass: sine @ 46Hz ───
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(46, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.3, now);

      subOsc.connect(subGain);
      subGain.connect(master);

      // ─── Frequency wobble LFO: slight pitch modulation ───
      // Gives it that alive, unstable lightsaber character
      const wobbleLfo = ctx.createOscillator();
      wobbleLfo.type = 'sine';
      wobbleLfo.frequency.setValueAtTime(5.5, now); // ~5.5Hz wobble

      const wobbleGain = ctx.createGain();
      wobbleGain.gain.setValueAtTime(3, now); // ±3Hz pitch wobble

      wobbleLfo.connect(wobbleGain);
      wobbleGain.connect(baseOsc.frequency);
      wobbleGain.connect(harmOsc.frequency);

      // Start everything
      lfo.start(now);
      biasNode.start(now);
      baseOsc.start(now);
      harmOsc.start(now);
      subOsc.start(now);
      wobbleLfo.start(now);

      nodesRef.current = {
        ctx,
        master,
        lfo,
        lfoGain,
        baseOsc,
        harmOsc,
        subOsc,
        wobbleLfo,
        wobbleGain,
      };
    };

    // Small delay to let the page settle
    startTimeout = setTimeout(tryStart, 300);

    return () => {
      disposed = true;
      clearTimeout(startTimeout);
      if (nodesRef.current) {
        const { master, ctx, baseOsc, harmOsc, subOsc, lfo, wobbleLfo } = nodesRef.current;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        setTimeout(() => {
          try {
            baseOsc.stop();
            harmOsc.stop();
            subOsc.stop();
            lfo.stop();
            wobbleLfo.stop();
          } catch { /* already stopped */ }
        }, 1500);
        nodesRef.current = null;
      }
    };
  }, [enabled, cycleDuration]);

  // Update volume dynamically
  useEffect(() => {
    if (!nodesRef.current) return;
    const { master, ctx, lfoGain } = nodesRef.current;
    const now = ctx.currentTime;
    // Update bias and LFO depth to match new volume
    master.gain.cancelScheduledValues(now);
    // The bias + LFO centers at volume*0.55, swings ±volume*0.45
    lfoGain.gain.setTargetAtTime(volume * 0.45, now, 0.1);
  }, [volume]);
}
