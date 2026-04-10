import { useEffect, useRef } from 'react';
import { getSharedAudioContext } from './useMintSound';

/**
 * useShimmerSound — continuous lightsaber-style ambient hum
 * that pulses in sync with the dashboard shimmer sweep cycle.
 *
 * Reuses the shared AudioContext from useMintSound so it benefits
 * from the same user-gesture unlock and keep-alive infrastructure.
 */

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
    biasNode: ConstantSourceNode;
    lfoGain: GainNode;
    baseOsc: OscillatorNode;
    harmOsc: OscillatorNode;
    subOsc: OscillatorNode;
    wobbleLfo: OscillatorNode;
    gongOsc: OscillatorNode;
    gongOsc2: OscillatorNode;
    gongOsc3: OscillatorNode;
    gongBias: ConstantSourceNode;
  } | null>(null);

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    if (!enabled) {
      if (nodesRef.current) {
        const n = nodesRef.current;
        n.master.gain.cancelScheduledValues(n.ctx.currentTime);
        n.master.gain.setTargetAtTime(0, n.ctx.currentTime, 0.3);
        const captured = n;
        setTimeout(() => {
           try {
            captured.baseOsc.stop();
            captured.harmOsc.stop();
            captured.subOsc.stop();
            captured.lfo.stop();
            captured.biasNode.stop();
            captured.wobbleLfo.stop();
            captured.gongOsc.stop();
            captured.gongOsc2.stop();
            captured.gongOsc3.stop();
            captured.gongBias.stop();
          } catch { /* already stopped */ }
        }, 1500);
        nodesRef.current = null;
      }
      return;
    }

    let disposed = false;
    let pollId: ReturnType<typeof window.setTimeout> | undefined;

    const tryStart = () => {
      if (disposed || nodesRef.current) return;

      // Reuse the shared AudioContext that useMintSound unlocks
      const ctx = getSharedAudioContext();
      if (!ctx || ctx.state !== 'running') {
        // Retry quickly after the first gesture so ambient audio begins right away
        pollId = window.setTimeout(tryStart, 120);
        return;
      }

      const now = ctx.currentTime;
      const vol = volumeRef.current;

      // ─── Master gain (modulated by LFO) ───
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.connect(ctx.destination);

      // ─── LFO: volume swell synced to shimmer cycle ───
      const lfoFreq = 1 / cycleDuration;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(lfoFreq, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(vol * 0.45, now);

      const biasNode = ctx.createConstantSource();
      biasNode.offset.setValueAtTime(vol * 0.55, now);

      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      biasNode.connect(master.gain);

      // ─── Base hum: sawtooth @ 92Hz, heavily lowpassed ───
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

      // ─── Harmonic: sine @ 184Hz ───
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

      // ─── Soft gong tone: sine @ 55Hz (A1) with slow decay per cycle ───
      // Resonant bowl tone that blooms at each shimmer peak
      const gongOsc = ctx.createOscillator();
      gongOsc.type = 'sine';
      gongOsc.frequency.setValueAtTime(55, now);

      const gongOsc2 = ctx.createOscillator();
      gongOsc2.type = 'sine';
      gongOsc2.frequency.setValueAtTime(110, now); // octave partial

      const gongOsc3 = ctx.createOscillator();
      gongOsc3.type = 'sine';
      gongOsc3.frequency.setValueAtTime(165, now); // 3rd partial — inharmonic gong char

      // Gong volume modulated by same LFO but with sharper envelope (squared)
      // Use a waveshaper to square the LFO signal for a bloom-then-decay feel
      const gongLfoGain = ctx.createGain();
      gongLfoGain.gain.setValueAtTime(0.4, now);

      const gongBias = ctx.createConstantSource();
      gongBias.offset.setValueAtTime(0.35, now);

      const gongMaster = ctx.createGain();
      gongMaster.gain.setValueAtTime(0, now);

      lfo.connect(gongLfoGain);
      gongLfoGain.connect(gongMaster.gain);
      gongBias.connect(gongMaster.gain);

      const gong1Gain = ctx.createGain();
      gong1Gain.gain.setValueAtTime(0.35, now);
      gongOsc.connect(gong1Gain);
      gong1Gain.connect(gongMaster);

      const gong2Gain = ctx.createGain();
      gong2Gain.gain.setValueAtTime(0.18, now);
      gongOsc2.connect(gong2Gain);
      gong2Gain.connect(gongMaster);

      const gong3Gain = ctx.createGain();
      gong3Gain.gain.setValueAtTime(0.08, now);
      gongOsc3.connect(gong3Gain);
      gong3Gain.connect(gongMaster);

      // Lowpass to soften the gong
      const gongLp = ctx.createBiquadFilter();
      gongLp.type = 'lowpass';
      gongLp.frequency.setValueAtTime(180, now);
      gongLp.Q.setValueAtTime(0.7, now);

      gongMaster.connect(gongLp);
      gongLp.connect(master);

      // ─── Frequency wobble: ±3Hz pitch modulation @ 5.5Hz ───
      const wobbleLfo = ctx.createOscillator();
      wobbleLfo.type = 'sine';
      wobbleLfo.frequency.setValueAtTime(5.5, now);

      const wobbleGain = ctx.createGain();
      wobbleGain.gain.setValueAtTime(3, now);

      wobbleLfo.connect(wobbleGain);
      wobbleGain.connect(baseOsc.frequency);
      wobbleGain.connect(harmOsc.frequency);

      // Gentle wobble on gong too — slower, subtler
      const gongWobbleGain = ctx.createGain();
      gongWobbleGain.gain.setValueAtTime(1.2, now);
      wobbleLfo.connect(gongWobbleGain);
      gongWobbleGain.connect(gongOsc.frequency);

      // Start everything
      lfo.start(now);
      biasNode.start(now);
      gongBias.start(now);
      baseOsc.start(now);
      harmOsc.start(now);
      subOsc.start(now);
      gongOsc.start(now);
      gongOsc2.start(now);
      gongOsc3.start(now);
      wobbleLfo.start(now);

      nodesRef.current = {
        ctx, master, lfo, biasNode, lfoGain, baseOsc, harmOsc, subOsc, wobbleLfo,
        gongOsc, gongOsc2, gongOsc3, gongBias,
      };
    };

    tryStart();

    return () => {
      disposed = true;
      clearTimeout(pollId);
      if (nodesRef.current) {
        const n = nodesRef.current;
        n.master.gain.cancelScheduledValues(n.ctx.currentTime);
        n.master.gain.setTargetAtTime(0, n.ctx.currentTime, 0.3);
        setTimeout(() => {
          try {
            n.baseOsc.stop();
            n.harmOsc.stop();
            n.subOsc.stop();
            n.lfo.stop();
            n.biasNode.stop();
            n.wobbleLfo.stop();
            n.gongOsc.stop();
            n.gongOsc2.stop();
            n.gongOsc3.stop();
            n.gongBias.stop();
          } catch { /* already stopped */ }
        }, 1500);
        nodesRef.current = null;
      }
    };
  }, [enabled, cycleDuration]);

  // Update volume dynamically
  useEffect(() => {
    if (!nodesRef.current) return;
    const { ctx, lfoGain, biasNode } = nodesRef.current;
    const now = ctx.currentTime;
    lfoGain.gain.setTargetAtTime(volume * 0.45, now, 0.1);
    biasNode.offset.setTargetAtTime(volume * 0.55, now, 0.1);
  }, [volume]);
}
