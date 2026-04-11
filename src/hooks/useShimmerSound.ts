import { useEffect, useRef, useCallback } from 'react';
import {
  getSafeAudioStartTime,
  getSharedAudioContext,
  IMMEDIATE_SOUND_LEAD,
  POST_RESUME_SOUND_LEAD,
  runWhenAudioContextRunning,
} from './useMintSound';

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

type ShimmerNodes = {
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
};

export function useShimmerSound({
  cycleDuration = 5,
  volume = 0.06,
  enabled = true,
}: ShimmerSoundOptions = {}) {
  const nodesRef = useRef<ShimmerNodes | null>(null);
  const pendingStartRef = useRef(false);
  const volumeRef = useRef(volume);
  const cycleDurationRef = useRef(cycleDuration);
  volumeRef.current = volume;
  cycleDurationRef.current = cycleDuration;

  const stopSound = useCallback(() => {
    if (!nodesRef.current) return;

    const n = nodesRef.current;
    n.master.gain.cancelScheduledValues(n.ctx.currentTime);
    n.master.gain.setTargetAtTime(0, n.ctx.currentTime, 0.3);

    const captured = n;
    window.setTimeout(() => {
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
      } catch {
        /* already stopped */
      }
    }, 1500);

    nodesRef.current = null;
    pendingStartRef.current = false;
  }, []);

  const startSound = useCallback(function startSoundInternal(scheduledStartTime?: number) {
    if (nodesRef.current || pendingStartRef.current) return true;

    const ctx = getSharedAudioContext();
    if (!ctx) return false;

    // CRITICAL: On iOS, schedule nodes immediately even if ctx is suspended.
    // Nodes scheduled on a suspended context will play once resume() resolves.
    // Deferring via runWhenAudioContextRunning breaks the gesture chain.
    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }

    const now = getSafeAudioStartTime(
      ctx,
      scheduledStartTime,
      scheduledStartTime === undefined ? IMMEDIATE_SOUND_LEAD : POST_RESUME_SOUND_LEAD,
    );

    const vol = volumeRef.current;
    const lfoFreq = 1 / cycleDurationRef.current;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.connect(ctx.destination);

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

    const harmOsc = ctx.createOscillator();
    harmOsc.type = 'sine';
    harmOsc.frequency.setValueAtTime(184, now);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.25, now);

    harmOsc.connect(harmGain);
    harmGain.connect(master);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(46, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.3, now);

    subOsc.connect(subGain);
    subGain.connect(master);

    const gongOsc = ctx.createOscillator();
    gongOsc.type = 'sine';
    gongOsc.frequency.setValueAtTime(55, now);

    const gongOsc2 = ctx.createOscillator();
    gongOsc2.type = 'sine';
    gongOsc2.frequency.setValueAtTime(110, now);

    const gongOsc3 = ctx.createOscillator();
    gongOsc3.type = 'sine';
    gongOsc3.frequency.setValueAtTime(165, now);

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

    const gongLp = ctx.createBiquadFilter();
    gongLp.type = 'lowpass';
    gongLp.frequency.setValueAtTime(180, now);
    gongLp.Q.setValueAtTime(0.7, now);

    gongMaster.connect(gongLp);
    gongLp.connect(master);

    const wobbleLfo = ctx.createOscillator();
    wobbleLfo.type = 'sine';
    wobbleLfo.frequency.setValueAtTime(5.5, now);

    const wobbleGain = ctx.createGain();
    wobbleGain.gain.setValueAtTime(3, now);

    wobbleLfo.connect(wobbleGain);
    wobbleGain.connect(baseOsc.frequency);
    wobbleGain.connect(harmOsc.frequency);

    const gongWobbleGain = ctx.createGain();
    gongWobbleGain.gain.setValueAtTime(1.2, now);
    wobbleLfo.connect(gongWobbleGain);
    gongWobbleGain.connect(gongOsc.frequency);

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
      ctx,
      master,
      lfo,
      biasNode,
      lfoGain,
      baseOsc,
      harmOsc,
      subOsc,
      wobbleLfo,
      gongOsc,
      gongOsc2,
      gongOsc3,
      gongBias,
    };

    return true;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopSound();
      return;
    }

    if (startSound()) {
      return () => stopSound();
    }

    let disposed = false;
    let pollId: number | undefined;

    const tryStart = () => {
      if (disposed || nodesRef.current) return;
      if (startSound()) return;
      pollId = window.setTimeout(tryStart, 120);
    };

    tryStart();

    return () => {
      disposed = true;
      if (pollId !== undefined) window.clearTimeout(pollId);
      stopSound();
    };
  }, [enabled, startSound, stopSound]);

  useEffect(() => {
    if (!nodesRef.current) return;
    const { ctx, lfoGain, biasNode } = nodesRef.current;
    const now = ctx.currentTime;
    lfoGain.gain.setTargetAtTime(volume * 0.45, now, 0.1);
    biasNode.offset.setTargetAtTime(volume * 0.55, now, 0.1);
  }, [volume]);

  useEffect(() => {
    if (!nodesRef.current) return;
    const { ctx, lfo } = nodesRef.current;
    lfo.frequency.setTargetAtTime(1 / cycleDuration, ctx.currentTime, 0.1);
  }, [cycleDuration]);

  return startSound;
}
