export type ShimmerNodes = {
  ctx: AudioContext;
  master: GainNode;
  lfo: OscillatorNode;
  biasNode: ConstantSourceNode;
  lfoGain: GainNode;
  baseOsc: OscillatorNode;
  harmOsc: OscillatorNode;
  presenceOsc: OscillatorNode;
  subOsc: OscillatorNode;
  wobbleLfo: OscillatorNode;
  gongOsc: OscillatorNode;
  gongOsc2: OscillatorNode;
  gongOsc3: OscillatorNode;
  gongBias: ConstantSourceNode;
};

interface CreateShimmerAudioGraphOptions {
  cycleDuration: number;
  volume: number;
}

export function createShimmerAudioGraph(
  ctx: AudioContext,
  now: number,
  { cycleDuration, volume }: CreateShimmerAudioGraphOptions,
): ShimmerNodes {
  const lfoFreq = 1 / cycleDuration;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.connect(ctx.destination);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(lfoFreq, now);

  // Start silent and ramp up over ~180ms to avoid clicks on cold start
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0, now);
  lfoGain.gain.setTargetAtTime(volume * 0.45, now, 0.06);

  const biasNode = ctx.createConstantSource();
  biasNode.offset.setValueAtTime(0, now);
  biasNode.offset.setTargetAtTime(volume * 0.55, now, 0.06);

  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  biasNode.connect(master.gain);

  const baseOsc = ctx.createOscillator();
  baseOsc.type = 'sawtooth';
  baseOsc.frequency.setValueAtTime(110, now);

  const baseLp = ctx.createBiquadFilter();
  baseLp.type = 'lowpass';
  baseLp.frequency.setValueAtTime(520, now);
  baseLp.Q.setValueAtTime(1.2, now);

  const baseGain = ctx.createGain();
  baseGain.gain.setValueAtTime(0.34, now);

  baseOsc.connect(baseLp);
  baseLp.connect(baseGain);
  baseGain.connect(master);

  const harmOsc = ctx.createOscillator();
  harmOsc.type = 'sine';
  harmOsc.frequency.setValueAtTime(220, now);

  const harmGain = ctx.createGain();
  harmGain.gain.setValueAtTime(0.18, now);

  harmOsc.connect(harmGain);
  harmGain.connect(master);

  const presenceOsc = ctx.createOscillator();
  presenceOsc.type = 'triangle';
  presenceOsc.frequency.setValueAtTime(330, now);

  const presenceBp = ctx.createBiquadFilter();
  presenceBp.type = 'bandpass';
  presenceBp.frequency.setValueAtTime(560, now);
  presenceBp.Q.setValueAtTime(0.8, now);

  const presenceGain = ctx.createGain();
  presenceGain.gain.setValueAtTime(0.12, now);

  presenceOsc.connect(presenceBp);
  presenceBp.connect(presenceGain);
  presenceGain.connect(master);

  const subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(55, now);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.14, now);

  subOsc.connect(subGain);
  subGain.connect(master);

  const gongOsc = ctx.createOscillator();
  gongOsc.type = 'sine';
  gongOsc.frequency.setValueAtTime(165, now);

  const gongOsc2 = ctx.createOscillator();
  gongOsc2.type = 'sine';
  gongOsc2.frequency.setValueAtTime(330, now);

  const gongOsc3 = ctx.createOscillator();
  gongOsc3.type = 'sine';
  gongOsc3.frequency.setValueAtTime(495, now);

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
  gong1Gain.gain.setValueAtTime(0.18, now);
  gongOsc.connect(gong1Gain);
  gong1Gain.connect(gongMaster);

  const gong2Gain = ctx.createGain();
  gong2Gain.gain.setValueAtTime(0.11, now);
  gongOsc2.connect(gong2Gain);
  gong2Gain.connect(gongMaster);

  const gong3Gain = ctx.createGain();
  gong3Gain.gain.setValueAtTime(0.06, now);
  gongOsc3.connect(gong3Gain);
  gong3Gain.connect(gongMaster);

  const gongLp = ctx.createBiquadFilter();
  gongLp.type = 'lowpass';
  gongLp.frequency.setValueAtTime(620, now);
  gongLp.Q.setValueAtTime(0.55, now);

  gongMaster.connect(gongLp);
  gongLp.connect(master);

  const wobbleLfo = ctx.createOscillator();
  wobbleLfo.type = 'sine';
  wobbleLfo.frequency.setValueAtTime(5.5, now);

  const wobbleGain = ctx.createGain();
  wobbleGain.gain.setValueAtTime(4.2, now);

  wobbleLfo.connect(wobbleGain);
  wobbleGain.connect(baseOsc.frequency);
  wobbleGain.connect(harmOsc.frequency);

  const presenceWobbleGain = ctx.createGain();
  presenceWobbleGain.gain.setValueAtTime(2.6, now);
  wobbleLfo.connect(presenceWobbleGain);
  presenceWobbleGain.connect(presenceOsc.frequency);

  const gongWobbleGain = ctx.createGain();
  gongWobbleGain.gain.setValueAtTime(2.1, now);
  wobbleLfo.connect(gongWobbleGain);
  gongWobbleGain.connect(gongOsc.frequency);

  lfo.start(now);
  biasNode.start(now);
  gongBias.start(now);
  baseOsc.start(now);
  harmOsc.start(now);
  presenceOsc.start(now);
  subOsc.start(now);
  gongOsc.start(now);
  gongOsc2.start(now);
  gongOsc3.start(now);
  wobbleLfo.start(now);

  return {
    ctx,
    master,
    lfo,
    biasNode,
    lfoGain,
    baseOsc,
    harmOsc,
    presenceOsc,
    subOsc,
    wobbleLfo,
    gongOsc,
    gongOsc2,
    gongOsc3,
    gongBias,
  };
}

export function setShimmerGraphVolume(
  nodes: ShimmerNodes,
  targetVolume: number,
  now: number,
  timeConstant = 0.06,
) {
  nodes.lfoGain.gain.cancelScheduledValues(now);
  nodes.biasNode.offset.cancelScheduledValues(now);
  nodes.lfoGain.gain.setTargetAtTime(targetVolume * 0.45, now, timeConstant);
  nodes.biasNode.offset.setTargetAtTime(targetVolume * 0.55, now, timeConstant);
}

export function fadeOutShimmerGraph(nodes: ShimmerNodes, now: number, timeConstant = 0.3) {
  setShimmerGraphVolume(nodes, 0, now, timeConstant);
}

export function setShimmerGraphCycleDuration(
  nodes: ShimmerNodes,
  cycleDuration: number,
  now: number,
  timeConstant = 0.1,
) {
  nodes.lfo.frequency.setTargetAtTime(1 / cycleDuration, now, timeConstant);
}

export function stopShimmerGraph(nodes: ShimmerNodes) {
  try {
    nodes.baseOsc.stop();
    nodes.harmOsc.stop();
    nodes.presenceOsc.stop();
    nodes.subOsc.stop();
    nodes.lfo.stop();
    nodes.biasNode.stop();
    nodes.wobbleLfo.stop();
    nodes.gongOsc.stop();
    nodes.gongOsc2.stop();
    nodes.gongOsc3.stop();
    nodes.gongBias.stop();
  } catch {
    /* already stopped */
  }
}