import gongUrl from '@/assets/audio/demo-entry-gong.wav';
import humUrl from '@/assets/audio/demo-entry-hum-loop.wav';
import { logAudioDebug } from '@/lib/audioDebug';
import { getSharedAudioContext } from '@/hooks/useMintSound';

interface DemoEntryFallbackAudioElements {
  gong: HTMLAudioElement;
}

interface ArmDemoEntryFallbackOptions {
  gong?: boolean;
  hum?: boolean;
}

type AudioKind = 'gong' | 'hum';

type HumDecodeContext = Pick<BaseAudioContext, 'decodeAudioData'>;

interface HumLoopGraph {
  ctx: AudioContext;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let fallbackAudio: DemoEntryFallbackAudioElements | null = null;
let fallbackHumActive = false;
let preloadLogged = false;
let humFadeFrame: number | null = null;
let humStopTimer: number | null = null;
let humFetchedBuffer: ArrayBuffer | null = null;
let humFetchPromise: Promise<ArrayBuffer | null> | null = null;
let humDecodedBuffer: AudioBuffer | null = null;
let humDecodePromise: Promise<AudioBuffer | null> | null = null;
let humDecodeContext: HumDecodeContext | null = null;
let humLoopGraph: HumLoopGraph | null = null;
const fallbackGestureArmed: Record<AudioKind, boolean> = {
  gong: false,
  hum: false,
};

const GONG_VOLUME = 0.9;
const HUM_VOLUME = 0.36;
const HUM_LOOP_START = 0.56;
const HUM_LOOP_END = 9.669333333333332;
const HUM_FADE_IN_MS = 220;
const HUM_FADE_OUT_MS = 180;

function createAudioElement(src: string, { loop = false, volume = 1 }: { loop?: boolean; volume?: number }) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.loop = loop;
  audio.volume = volume;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', 'true');
  return audio;
}

function ensureFallbackAudio() {
  if (typeof window === 'undefined') return null;

  if (!fallbackAudio) {
    fallbackAudio = {
      gong: createAudioElement(gongUrl, { volume: GONG_VOLUME }),
    };
  }

  return fallbackAudio;
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  return getSharedAudioContext();
}

function getHumDecodeContext() {
  if (typeof window === 'undefined') return null;
  if (humDecodeContext) return humDecodeContext;

  const OfflineAudioContextCtor = window.OfflineAudioContext || (window as Window & { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (typeof OfflineAudioContextCtor === 'function') {
    humDecodeContext = new OfflineAudioContextCtor(1, 1, 48_000);
    return humDecodeContext;
  }

  const ctx = getAudioContext();
  if (ctx) {
    humDecodeContext = ctx;
  }

  return humDecodeContext;
}

function fetchHumArrayBuffer() {
  if (humFetchedBuffer) {
    return Promise.resolve(humFetchedBuffer);
  }

  if (!humFetchPromise) {
    humFetchPromise = fetch(humUrl)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        humFetchedBuffer = arrayBuffer;
        return arrayBuffer;
      })
      .catch((error) => {
        humFetchPromise = null;
        logPlayFailure('hum', error, { mode: 'fetch-buffer' });
        return null;
      });
  }

  return humFetchPromise;
}

function clearHumFadeFrame() {
  if (typeof window === 'undefined' || humFadeFrame === null) return;
  window.cancelAnimationFrame(humFadeFrame);
  humFadeFrame = null;
}

function clearHumStopTimer() {
  if (typeof window === 'undefined' || humStopTimer === null) return;
  window.clearTimeout(humStopTimer);
  humStopTimer = null;
}

function animateHumVolume(graph: HumLoopGraph, targetVolume: number, durationMs = 220) {
  clearHumFadeFrame();

  if (typeof window === 'undefined' || durationMs <= 0) {
    graph.gain.gain.setValueAtTime(targetVolume, graph.ctx.currentTime);
    return;
  }

  const startedAt = performance.now();
  const startVolume = graph.gain.gain.value;

  const step = (now: number) => {
    if (!humLoopGraph || humLoopGraph !== graph) {
      humFadeFrame = null;
      return;
    }

    const progress = Math.min((now - startedAt) / durationMs, 1);
    const nextVolume = startVolume + ((targetVolume - startVolume) * progress);
    graph.gain.gain.setValueAtTime(nextVolume, graph.ctx.currentTime);

    if (progress < 1) {
      humFadeFrame = window.requestAnimationFrame(step);
    } else {
      humFadeFrame = null;
    }
  };

  humFadeFrame = window.requestAnimationFrame(step);
}

function requestLoad(audio: HTMLAudioElement) {
  try {
    if (audio.networkState === HTMLMediaElement.NETWORK_EMPTY || audio.readyState === 0) {
      audio.load();
    }
  } catch {
    // Ignore load errors; play() will log if it fails.
  }
}

function logPlaySuccess(kind: AudioKind, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-fired`, {
    ctx: kind === 'hum' ? 'web-audio' : 'media-element',
    mode: 'fallback',
    ...details,
  });
}

function logPlayFailure(kind: AudioKind, error: unknown, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-missed`, {
    reason: error instanceof DOMException ? error.name : error instanceof Error ? error.message : 'play-rejected',
    ...details,
  });
}

function logArmSuccess(kind: AudioKind, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-armed`, {
    ctx: kind === 'hum' ? 'web-audio' : 'media-element',
    mode: 'fallback',
    ...details,
  });
}

function logArmFailure(kind: AudioKind, error: unknown, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-arm-missed`, {
    reason: error instanceof DOMException ? error.name : error instanceof Error ? error.message : 'play-rejected',
    ...details,
  });
}

function attemptPlay(kind: AudioKind, audio: HTMLAudioElement, details?: Record<string, unknown>) {
  try {
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(() => {
        logPlaySuccess(kind, {
          readyState: audio.readyState,
          loop: audio.loop,
          ...details,
        });
      }).catch((error) => {
        logPlayFailure(kind, error, {
          readyState: audio.readyState,
          paused: audio.paused,
          ...details,
        });
      });
    } else {
      logPlaySuccess(kind, {
        readyState: audio.readyState,
        loop: audio.loop,
        ...details,
      });
    }
    return true;
  } catch (error) {
    logPlayFailure(kind, error, {
      readyState: audio.readyState,
      paused: audio.paused,
      ...details,
    });
    return false;
  }
}

function armMutedLoop(kind: AudioKind, audio: HTMLAudioElement, loop: boolean) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // no-op
  }

  audio.loop = loop;
  audio.volume = 0;
  audio.muted = true;

  try {
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(() => {
        logArmSuccess(kind, {
          readyState: audio.readyState,
          loop: audio.loop,
          muted: audio.muted,
        });
      }).catch((error) => {
        fallbackGestureArmed[kind] = false;
        logArmFailure(kind, error, {
          readyState: audio.readyState,
          paused: audio.paused,
        });
      });
    } else {
      logArmSuccess(kind, {
        readyState: audio.readyState,
        loop: audio.loop,
        muted: audio.muted,
      });
    }
    return true;
  } catch (error) {
    logArmFailure(kind, error, {
      readyState: audio.readyState,
      paused: audio.paused,
    });
    return false;
  }
}

async function decodeHumBuffer() {
  if (humDecodedBuffer) return humDecodedBuffer;

  if (!humDecodePromise) {
    humDecodePromise = fetchHumArrayBuffer()
      .then((arrayBuffer) => {
        if (!arrayBuffer) return null;
        const decoder = getHumDecodeContext();
        if (!decoder) throw new Error('decode-context-unavailable');
        return decoder.decodeAudioData(arrayBuffer.slice(0));
      })
      .then((buffer) => {
        if (!buffer) return null;
        humDecodedBuffer = buffer;
        logAudioDebug('hum-buffer-decoded', {
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          loopStart: HUM_LOOP_START,
          loopEnd: HUM_LOOP_END,
        });
        return buffer;
      })
      .catch((error) => {
        humDecodePromise = null;
        logPlayFailure('hum', error, { mode: 'decode-buffer' });
        return null;
      });
  }

  return humDecodePromise;
}

function destroyHumLoopGraph(resetGain = true) {
  clearHumFadeFrame();
  clearHumStopTimer();

  if (!humLoopGraph) return;

  try {
    humLoopGraph.source.onended = null;
    humLoopGraph.source.stop();
  } catch {
    // no-op
  }

  try {
    humLoopGraph.source.disconnect();
    humLoopGraph.gain.disconnect();
  } catch {
    // no-op
  }

  if (resetGain) {
    humLoopGraph.gain.gain.value = 0;
  }

  humLoopGraph = null;
}

function createHumLoopGraph(ctx: AudioContext, buffer: AudioBuffer) {
  destroyHumLoopGraph(false);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = HUM_LOOP_START;
  source.loopEnd = Math.min(HUM_LOOP_END, buffer.duration);
  source.connect(gain);
  source.onended = () => {
    if (humLoopGraph?.source === source) {
      humLoopGraph = null;
      fallbackHumActive = false;
    }
  };

  humLoopGraph = { ctx, source, gain };
  return humLoopGraph;
}

function getPreparedHumLoopGraph(ctx: AudioContext) {
  if (humLoopGraph?.ctx === ctx) return humLoopGraph;
  if (!humDecodedBuffer) return null;
  return createHumLoopGraph(ctx, humDecodedBuffer);
}

function startPreparedHumLoopGraph(graph: HumLoopGraph) {
  try {
    graph.source.start(graph.ctx.currentTime, HUM_LOOP_START);
    animateHumVolume(graph, HUM_VOLUME, HUM_FADE_IN_MS);
    fallbackHumActive = true;
    fallbackGestureArmed.hum = true;
    logPlaySuccess('hum', {
      mode: 'gapless-buffer-loop',
      loopStart: HUM_LOOP_START,
      loopEnd: HUM_LOOP_END,
      duration: graph.source.buffer?.duration,
    });
    return true;
  } catch (error) {
    logPlayFailure('hum', error, { mode: 'gapless-buffer-loop-start' });
    destroyHumLoopGraph();
    fallbackHumActive = false;
    fallbackGestureArmed.hum = false;
    return false;
  }
}

export function armDemoEntryFallbackGestureAudio({ gong = true, hum = true }: ArmDemoEntryFallbackOptions = {}) {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  clearHumFadeFrame();
  clearHumStopTimer();

  fallbackHumActive = false;
  fallbackGestureArmed.gong = gong ? armMutedLoop('gong', audio.gong, true) : false;
  fallbackGestureArmed.hum = false;

  if (!gong) {
    try {
      audio.gong.pause();
      audio.gong.currentTime = 0;
      audio.gong.loop = false;
      audio.gong.muted = false;
      audio.gong.volume = GONG_VOLUME;
    } catch {
      // no-op
    }
  }

  if (hum) {
    const ctx = getAudioContext();
    const graph = ctx ? getPreparedHumLoopGraph(ctx) : null;
    fallbackGestureArmed.hum = Boolean(graph);

    if (graph) {
      logArmSuccess('hum', {
        mode: 'gapless-buffer-loop',
        loopStart: HUM_LOOP_START,
        loopEnd: HUM_LOOP_END,
      });
    } else {
      void decodeHumBuffer().then((buffer) => {
        if (buffer) {
          logAudioDebug('hum-buffer-ready', {
            mode: 'offline-predecode',
            loopStart: HUM_LOOP_START,
            loopEnd: HUM_LOOP_END,
          });
          return;
        }

        logArmFailure('hum', new Error('buffer-unavailable'), {
          mode: 'gapless-buffer-loop',
        });
      });
    }
  } else {
    destroyHumLoopGraph();
  }

  logAudioDebug('entry-fallback-armed', {
    gongEnabled: gong,
    humEnabled: hum,
    gongArmed: fallbackGestureArmed.gong,
    humArmed: fallbackGestureArmed.hum,
    humBuffered: Boolean(humDecodedBuffer),
    gongReady: audio.gong.readyState,
  });

  return fallbackGestureArmed.gong || fallbackGestureArmed.hum || hum;
}

export function playDemoEntryFallbackGong() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);

  let gongStarted = false;
  if (fallbackGestureArmed.gong && !audio.gong.paused) {
    try {
      audio.gong.loop = false;
      audio.gong.currentTime = 0;
      audio.gong.volume = GONG_VOLUME;
      audio.gong.muted = false;
      gongStarted = true;
      logPlaySuccess('gong', { armed: true, readyState: audio.gong.readyState });
    } catch (error) {
      logPlayFailure('gong', error, { armed: true, readyState: audio.gong.readyState });
    }
  } else {
    audio.gong.loop = false;
    audio.gong.volume = GONG_VOLUME;
    audio.gong.muted = false;

    try {
      audio.gong.pause();
      audio.gong.currentTime = 0;
    } catch {
      // no-op
    }

    gongStarted = attemptPlay('gong', audio.gong, { armed: false });
  }

  fallbackGestureArmed.gong = false;
  logAudioDebug('entry-fallback-gong-triggered', {
    gongReady: audio.gong.readyState,
    gongArmed: gongStarted,
  });

  return gongStarted;
}

export function preloadDemoEntryFallbackAudio() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  void fetchHumArrayBuffer();
  void decodeHumBuffer();

  if (!preloadLogged) {
    preloadLogged = true;
    logAudioDebug('entry-fallback-preloaded', {
      gongReady: audio.gong.readyState,
      humBuffered: Boolean(humDecodedBuffer),
    });
  }

  return true;
}

export function playDemoEntryFallbackRevealAudio() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  clearHumFadeFrame();
  clearHumStopTimer();

  let gongStarted = false;
  if (fallbackGestureArmed.gong && !audio.gong.paused) {
    try {
      audio.gong.loop = false;
      audio.gong.currentTime = 0;
      audio.gong.volume = GONG_VOLUME;
      audio.gong.muted = false;
      gongStarted = true;
      logPlaySuccess('gong', { armed: true, readyState: audio.gong.readyState });
    } catch (error) {
      logPlayFailure('gong', error, { armed: true, readyState: audio.gong.readyState });
    }
  } else {
    audio.gong.loop = false;
    audio.gong.volume = GONG_VOLUME;
    audio.gong.muted = false;

    try {
      audio.gong.pause();
      audio.gong.currentTime = 0;
    } catch {
      // no-op
    }

    gongStarted = attemptPlay('gong', audio.gong, { armed: false });
  }

  const ctx = getAudioContext();
  const graph = ctx ? getPreparedHumLoopGraph(ctx) : humLoopGraph;
  const humStarted = graph ? startPreparedHumLoopGraph(graph) : false;

  if (!humStarted) {
    void decodeHumBuffer();
  }

  fallbackHumActive = humStarted;
  fallbackGestureArmed.gong = false;
  fallbackGestureArmed.hum = humStarted;
  logAudioDebug('entry-fallback-triggered', {
    gongReady: audio.gong.readyState,
    humBuffered: Boolean(humDecodedBuffer),
    humArmed: humStarted,
    mode: humStarted ? 'gapless-buffer-loop' : 'buffer-not-ready',
  });

  return gongStarted || humStarted;
}

export function handoffDemoEntryFallbackHum(durationMs = HUM_FADE_OUT_MS) {
  if (!humLoopGraph) return false;

  const graph = humLoopGraph;
  clearHumFadeFrame();
  clearHumStopTimer();
  animateHumVolume(graph, 0, durationMs);

  if (typeof window === 'undefined' || durationMs <= 0) {
    destroyHumLoopGraph();
  } else {
    humStopTimer = window.setTimeout(() => {
      humStopTimer = null;
      destroyHumLoopGraph();
    }, durationMs + 48);
  }

  fallbackHumActive = false;
  fallbackGestureArmed.hum = false;
  logAudioDebug('entry-fallback-hum-handed-off', {
    durationMs,
    mode: 'gapless-buffer-loop',
  });
  return true;
}

export function playDemoEntryFallbackHum(): boolean {
  const ctx = getAudioContext();
  const graph = ctx ? getPreparedHumLoopGraph(ctx) : humLoopGraph;
  if (!graph) {
    logAudioDebug('entry-fallback-hum-triggered', {
      humBuffered: Boolean(humDecodedBuffer),
      humStarted: false,
      mode: 'gapless-buffer-loop',
    });
    return false;
  }

  const started = startPreparedHumLoopGraph(graph);
  logAudioDebug('entry-fallback-hum-triggered', {
    humBuffered: Boolean(humDecodedBuffer),
    humStarted: started,
    mode: 'gapless-buffer-loop',
  });
  return started;
}

export function stopDemoEntryFallbackHum(reset = true) {
  clearHumFadeFrame();
  clearHumStopTimer();
  destroyHumLoopGraph();

  if (fallbackAudio) {
    try {
      fallbackAudio.gong.pause();
      if (reset) fallbackAudio.gong.currentTime = 0;
      fallbackAudio.gong.loop = false;
      fallbackAudio.gong.muted = false;
      fallbackAudio.gong.volume = GONG_VOLUME;
    } catch {
      // no-op
    }
  }

  fallbackHumActive = false;
  fallbackGestureArmed.gong = false;
  fallbackGestureArmed.hum = false;
  logAudioDebug('entry-fallback-stopped');
}

export function isDemoEntryFallbackHumActive() {
  return fallbackHumActive;
}

if (typeof window !== 'undefined') {
  void fetchHumArrayBuffer();
}
