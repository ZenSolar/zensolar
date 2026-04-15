import gongUrl from '@/assets/audio/demo-entry-gong.wav';
import humUrl from '@/assets/audio/demo-entry-hum-loop.wav';
import { logAudioDebug } from '@/lib/audioDebug';
import { getSharedAudioContext, runWhenAudioContextRunning } from '@/hooks/useMintSound';

interface DemoEntryFallbackAudioElements {
  gong: HTMLAudioElement;
  hum: HTMLAudioElement;
}

interface ArmDemoEntryFallbackOptions {
  gong?: boolean;
  hum?: boolean;
}

type AudioKind = 'gong' | 'hum';
type AudioTransport = 'media-element' | 'web-audio';

type HumDecodeContext = Pick<BaseAudioContext, 'createBuffer' | 'decodeAudioData'>;

interface HumLoopVoice {
  gain: GainNode;
  source: AudioBufferSourceNode;
}

interface HumLoopGraph {
  buffer: AudioBuffer;
  ctx: AudioContext;
  gain: GainNode;
  nextVoiceOffset: number;
  nextVoiceStartTime: number | null;
  schedulerTimer: number | null;
  voices: Set<HumLoopVoice>;
}

let fallbackAudio: DemoEntryFallbackAudioElements | null = null;
let fallbackHumActive = false;
let preloadLogged = false;
let humFadeFrame: number | null = null;
let humStopTimer: number | null = null;
let humMediaFadeFrame: number | null = null;
let humMediaStopTimer: number | null = null;
let humMediaHandoffTimer: number | null = null;
let humFetchedBuffer: ArrayBuffer | null = null;
let humFetchPromise: Promise<ArrayBuffer | null> | null = null;
let humDecodedBuffer: AudioBuffer | null = null;
let humLoopBuffer: AudioBuffer | null = null;
let humLoopBlobUrl: string | null = null;
let humDecodePromise: Promise<AudioBuffer | null> | null = null;
let humDecodeContext: HumDecodeContext | null = null;
let humLoopGraph: HumLoopGraph | null = null;
let humMediaResumeCleanup: (() => void) | null = null;
let humMediaBridgeActive = false;
let humRevealStartedAt = 0;
let humLoopTrimSeconds = 0;
const fallbackGestureArmed: Record<AudioKind, boolean> = {
  gong: false,
  hum: false,
};

const GONG_VOLUME = 0.9;
const HUM_VOLUME = 0.36;
const HUM_LOOP_START = 0.56;
const HUM_LOOP_END = 9.669333333333332;
const HUM_LOOP_CROSSFADE_MS = 160;
const HUM_FADE_IN_MS = 220;
const HUM_FADE_OUT_MS = 180;
const GONG_DURATION_S = 6.0;
const HUM_FADE_IN_DELAY_S = 1.8; // Start fading in hum partway through gong tail

// Silent placeholder graph: a silent oscillator started synchronously inside
// the gesture to keep the AudioContext "unlocked" on iOS/Chrome. Once the real
// hum buffer is decoded we swap it in.
interface SilentPlaceholderGraph {
  ctx: AudioContext;
  osc: OscillatorNode;
  gain: GainNode;
}
let silentPlaceholder: SilentPlaceholderGraph | null = null;
let humFadeInTimer: number | null = null;

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
    const hum = createAudioElement(humLoopBlobUrl ?? humUrl, { loop: true, volume: 0 });
    hum.dataset.zenHumLoopSource = humLoopBlobUrl ? 'seamless' : 'raw';
    fallbackAudio = {
      gong: createAudioElement(gongUrl, { volume: GONG_VOLUME }),
      hum,
    };
  } else if (humLoopBlobUrl && !humMediaBridgeActive && fallbackAudio.hum.paused) {
    syncHumMediaSource(fallbackAudio.hum, { resetCurrentTime: false });
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

function clearHumMediaFadeFrame() {
  if (typeof window === 'undefined' || humMediaFadeFrame === null) return;
  window.cancelAnimationFrame(humMediaFadeFrame);
  humMediaFadeFrame = null;
}

function clearHumStopTimer() {
  if (typeof window === 'undefined' || humStopTimer === null) return;
  window.clearTimeout(humStopTimer);
  humStopTimer = null;
}

function clearHumMediaStopTimer() {
  if (typeof window === 'undefined' || humMediaStopTimer === null) return;
  window.clearTimeout(humMediaStopTimer);
  humMediaStopTimer = null;
}

function clearHumMediaHandoffTimer() {
  if (typeof window === 'undefined' || humMediaHandoffTimer === null) return;
  window.clearTimeout(humMediaHandoffTimer);
  humMediaHandoffTimer = null;
}

function clearHumFadeInTimer() {
  if (typeof window === 'undefined' || humFadeInTimer === null) return;
  window.clearTimeout(humFadeInTimer);
  humFadeInTimer = null;
}

function clearHumMediaResumeCleanup() {
  humMediaResumeCleanup?.();
  humMediaResumeCleanup = null;
}

function destroySilentPlaceholder() {
  if (!silentPlaceholder) return;
  try { silentPlaceholder.osc.stop(); } catch { /* no-op */ }
  try { silentPlaceholder.osc.disconnect(); silentPlaceholder.gain.disconnect(); } catch { /* no-op */ }
  silentPlaceholder = null;
}

function createSilentPlaceholder(ctx: AudioContext): SilentPlaceholderGraph {
  destroySilentPlaceholder();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(0, ctx.currentTime);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  silentPlaceholder = { ctx, osc, gain };
  logAudioDebug('hum-silent-placeholder-started', { ctxState: ctx.state });
  return silentPlaceholder;
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

function animateHumMediaVolume(audio: HTMLAudioElement, targetVolume: number, durationMs = 220) {
  clearHumMediaFadeFrame();

  const clampedTarget = Math.max(0, Math.min(1, targetVolume));
  if (typeof window === 'undefined' || durationMs <= 0) {
    try {
      audio.volume = clampedTarget;
      audio.muted = clampedTarget <= 0;
    } catch {
      // no-op
    }
    return;
  }

  const startedAt = performance.now();
  const startVolume = audio.volume;

  const step = (now: number) => {
    const progress = Math.min((now - startedAt) / durationMs, 1);
    const nextVolume = startVolume + ((clampedTarget - startVolume) * progress);

    try {
      audio.volume = Math.max(0, Math.min(1, nextVolume));
      audio.muted = audio.volume <= 0;
    } catch {
      humMediaFadeFrame = null;
      return;
    }

    if (progress < 1) {
      humMediaFadeFrame = window.requestAnimationFrame(step);
    } else {
      humMediaFadeFrame = null;
    }
  };

  humMediaFadeFrame = window.requestAnimationFrame(step);
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

function createOutputAudioBuffer(channelCount: number, frameCount: number, sampleRate: number) {
  const decodeContext = getHumDecodeContext();
  if (decodeContext?.createBuffer) {
    return decodeContext.createBuffer(channelCount, frameCount, sampleRate);
  }

  return new AudioBuffer({
    length: frameCount,
    numberOfChannels: channelCount,
    sampleRate,
  });
}

interface SyncHumMediaSourceOptions {
  allowWhilePlaying?: boolean;
  resetCurrentTime?: boolean;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createHumLoopBlobUrl(buffer: AudioBuffer) {
  const channelCount = buffer.numberOfChannels;
  const frameCount = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frameCount * blockAlign;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = buffer.getChannelData(channel)[frame] ?? 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, Math.round(pcm), true);
      offset += bytesPerSample;
    }
  }

  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
}

function isSeamlessHumMediaSource(audio?: HTMLAudioElement | null) {
  return audio?.dataset.zenHumLoopSource === 'seamless';
}

function getHumMediaLoopStart(audio?: HTMLAudioElement | null) {
  return isSeamlessHumMediaSource(audio) ? 0 : HUM_LOOP_START;
}

function syncHumMediaSource(
  audio: HTMLAudioElement,
  { allowWhilePlaying = false, resetCurrentTime = false }: SyncHumMediaSourceOptions = {},
) {
  const nextMode = humLoopBlobUrl ? 'seamless' : 'raw';
  const currentMode = audio.dataset.zenHumLoopSource ?? 'raw';

  if (currentMode === nextMode) {
    if (resetCurrentTime) {
      try {
        audio.currentTime = getHumMediaLoopStart(audio);
      } catch {
        // no-op
      }
    }
    return true;
  }

  if (!allowWhilePlaying && (humMediaBridgeActive || !audio.paused)) {
    return false;
  }

  const loop = audio.loop;
  const muted = audio.muted;
  const volume = audio.volume;

  try {
    audio.pause();
    audio.src = humLoopBlobUrl ?? humUrl;
    audio.dataset.zenHumLoopSource = nextMode;
    audio.loop = loop;
    audio.muted = muted;
    audio.volume = volume;
    requestLoad(audio);
    if (resetCurrentTime) {
      audio.currentTime = nextMode === 'seamless' ? 0 : HUM_LOOP_START;
    }
    logAudioDebug('hum-media-source-prepared', {
      source: nextMode,
      loopDuration: nextMode === 'seamless' ? humLoopBuffer?.duration : undefined,
      loopStart: nextMode === 'seamless' ? 0 : HUM_LOOP_START,
      loopEnd: nextMode === 'seamless' ? humLoopBuffer?.duration : HUM_LOOP_END,
    });
    return true;
  } catch (error) {
    logPlayFailure('hum', error, {
      mode: 'media-source-sync',
      source: nextMode,
      transport: 'media-element',
    });
    return false;
  }
}

function getAudioTransport(kind: AudioKind, details?: Record<string, unknown>): AudioTransport {
  const explicitTransport = details?.transport;
  if (explicitTransport === 'media-element' || explicitTransport === 'web-audio') {
    return explicitTransport;
  }

  return kind === 'hum' ? 'web-audio' : 'media-element';
}

function logPlaySuccess(kind: AudioKind, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-fired`, {
    ctx: getAudioTransport(kind, details),
    mode: 'fallback',
    ...details,
  });
}

function logPlayFailure(kind: AudioKind, error: unknown, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-missed`, {
    ctx: getAudioTransport(kind, details),
    reason: error instanceof DOMException ? error.name : error instanceof Error ? error.message : 'play-rejected',
    ...details,
  });
}

function logArmSuccess(kind: AudioKind, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-armed`, {
    ctx: getAudioTransport(kind, details),
    mode: 'fallback',
    ...details,
  });
}

function logArmFailure(kind: AudioKind, error: unknown, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-arm-missed`, {
    ctx: getAudioTransport(kind, details),
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

function armMutedLoop(kind: AudioKind, audio: HTMLAudioElement, loop: boolean, details?: Record<string, unknown>) {
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
          ...details,
        });
      }).catch((error) => {
        fallbackGestureArmed[kind] = false;
        logArmFailure(kind, error, {
          readyState: audio.readyState,
          paused: audio.paused,
          ...details,
        });
      });
    } else {
      logArmSuccess(kind, {
        readyState: audio.readyState,
        loop: audio.loop,
        muted: audio.muted,
        ...details,
      });
    }
    return true;
  } catch (error) {
    logArmFailure(kind, error, {
      readyState: audio.readyState,
      paused: audio.paused,
      ...details,
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
        const seamlessLoop = buildSeamlessHumLoopBuffer(buffer);
        humLoopBuffer = seamlessLoop.buffer;
        humLoopTrimSeconds = seamlessLoop.trimSeconds;

        if (typeof window !== 'undefined') {
          if (humLoopBlobUrl) {
            URL.revokeObjectURL(humLoopBlobUrl);
          }
          humLoopBlobUrl = createHumLoopBlobUrl(seamlessLoop.buffer);
          if (fallbackAudio && fallbackAudio.hum.paused && !humMediaBridgeActive) {
            syncHumMediaSource(fallbackAudio.hum, { resetCurrentTime: false });
          }
        }

        logAudioDebug('hum-buffer-decoded', {
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          loopStart: HUM_LOOP_START,
          loopEnd: HUM_LOOP_END,
          seamlessDuration: seamlessLoop.buffer.duration,
          seamTrimMs: HUM_LOOP_CROSSFADE_MS,
          mediaSourceReady: humLoopBlobUrl ? 'yes' : 'no',
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

  if (typeof window !== 'undefined' && humLoopGraph.schedulerTimer !== null) {
    window.clearTimeout(humLoopGraph.schedulerTimer);
    humLoopGraph.schedulerTimer = null;
  }

  for (const voice of humLoopGraph.voices) {
    try {
      voice.source.onended = null;
      voice.source.stop();
    } catch {
      // no-op
    }

    try {
      voice.source.disconnect();
      voice.gain.disconnect();
    } catch {
      // no-op
    }
  }

  humLoopGraph.voices.clear();

  if (resetGain) {
    humLoopGraph.gain.gain.value = 0;
  }

  try {
    humLoopGraph.gain.disconnect();
  } catch {
    // no-op
  }

  humLoopGraph = null;
}

function createHumLoopGraph(ctx: AudioContext, buffer: AudioBuffer) {
  if (humLoopGraph?.ctx === ctx && humLoopGraph.buffer === buffer) {
    return humLoopGraph;
  }

  destroyHumLoopGraph(false);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.connect(ctx.destination);

  humLoopGraph = {
    buffer,
    ctx,
    gain,
    nextVoiceOffset: getHumLoopStart(buffer),
    nextVoiceStartTime: null,
    schedulerTimer: null,
    voices: new Set(),
  };

  return humLoopGraph;
}

function getPreparedHumLoopGraph(ctx: AudioContext) {
  const buffer = humLoopBuffer ?? humDecodedBuffer;
  if (!buffer) return null;
  if (humLoopGraph?.ctx === ctx && humLoopGraph.buffer === buffer) return humLoopGraph;
  return createHumLoopGraph(ctx, buffer);
}

function isProcessedHumLoopBuffer(buffer?: AudioBuffer | null) {
  return Boolean(buffer && humLoopBuffer && buffer === humLoopBuffer);
}

function getHumLoopStart(buffer?: AudioBuffer | null) {
  return isProcessedHumLoopBuffer(buffer) ? 0 : HUM_LOOP_START;
}

function getHumLoopEnd(buffer?: AudioBuffer | null) {
  if (isProcessedHumLoopBuffer(buffer)) {
    return Math.max(0.001, buffer?.duration ?? 0);
  }

  return Math.max(HUM_LOOP_START + 0.001, Math.min(HUM_LOOP_END, buffer?.duration ?? HUM_LOOP_END));
}

function buildSeamlessHumLoopBuffer(buffer: AudioBuffer) {
  const sampleRate = buffer.sampleRate;
  const loopStartFrame = Math.max(0, Math.floor(HUM_LOOP_START * sampleRate));
  const loopEndFrame = Math.min(buffer.length, Math.floor(getHumLoopEnd(buffer) * sampleRate));
  const rawLoopFrameCount = Math.max(2, loopEndFrame - loopStartFrame);
  const requestedTrimFrames = Math.round((sampleRate * HUM_LOOP_CROSSFADE_MS) / 1000);
  const trimFrames = Math.max(1, Math.min(requestedTrimFrames, Math.floor((rawLoopFrameCount - 1) / 2)));
  const bodyFrameCount = Math.max(1, rawLoopFrameCount - (trimFrames * 2));
  const outputFrameCount = bodyFrameCount + trimFrames;
  const seamlessBuffer = createOutputAudioBuffer(buffer.numberOfChannels, outputFrameCount, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const source = buffer.getChannelData(channel);
    const output = seamlessBuffer.getChannelData(channel);

    for (let i = 0; i < bodyFrameCount; i += 1) {
      output[i] = source[loopStartFrame + trimFrames + i] ?? 0;
    }

    for (let i = 0; i < trimFrames; i += 1) {
      const progress = trimFrames === 1 ? 1 : i / (trimFrames - 1);
      const fadeOut = Math.cos(progress * Math.PI * 0.5);
      const fadeIn = Math.sin(progress * Math.PI * 0.5);
      const tailSample = source[loopEndFrame - trimFrames + i] ?? 0;
      const headSample = source[loopStartFrame + i] ?? 0;
      output[bodyFrameCount + i] = (tailSample * fadeOut) + (headSample * fadeIn);
    }
  }

  return {
    buffer: seamlessBuffer,
    trimSeconds: trimFrames / sampleRate,
  };
}

function getHumHandoffOffset(audio: HTMLAudioElement, buffer?: AudioBuffer | null) {
  const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : getHumMediaLoopStart(audio);

  if (isSeamlessHumMediaSource(audio) && isProcessedHumLoopBuffer(buffer)) {
    const processedDuration = Math.max(buffer?.duration ?? 0, 0.001);
    return Math.min(processedDuration - 0.001, Math.max(0, currentTime % processedDuration));
  }

  const rawLoopStart = getHumMediaLoopStart(audio);
  const rawLoopDuration = Math.max((isSeamlessHumMediaSource(audio) ? (audio.duration || (buffer?.duration ?? 0) || (HUM_LOOP_END - HUM_LOOP_START)) : (HUM_LOOP_END - HUM_LOOP_START)), 0.001);
  const normalizedRawOffset = currentTime <= rawLoopStart
    ? 0
    : (currentTime - rawLoopStart) % rawLoopDuration;

  if (isProcessedHumLoopBuffer(buffer) && humLoopTrimSeconds > 0) {
    const processedDuration = Math.max(buffer?.duration ?? 0, 0.001);
    const processedOffset = normalizedRawOffset < humLoopTrimSeconds
      ? (processedDuration - humLoopTrimSeconds) + normalizedRawOffset
      : normalizedRawOffset - humLoopTrimSeconds;

    return Math.min(processedDuration - 0.001, Math.max(0, processedOffset));
  }

  return Math.min(getHumLoopEnd(buffer) - 0.001, rawLoopStart + normalizedRawOffset);
}

function clearHumLoopScheduler(graph: HumLoopGraph | null = humLoopGraph) {
  if (typeof window === 'undefined' || !graph || graph.schedulerTimer === null) return;
  window.clearTimeout(graph.schedulerTimer);
  graph.schedulerTimer = null;
}

function getHumLoopOverlapSeconds(loopDuration: number, startOffset: number) {
  const availableDuration = Math.max(0.02, loopDuration - (startOffset - HUM_LOOP_START));
  return Math.max(0.02, Math.min(HUM_LOOP_CROSSFADE_MS / 1000, availableDuration * 0.45));
}

function scheduleHumLoopVoice(graph: HumLoopGraph, startTime: number, startOffset: number, fadeIn: boolean) {
  const loopStart = getHumLoopStart(graph.buffer);
  const loopEnd = getHumLoopEnd(graph.buffer);
  const safeOffset = Math.min(loopEnd - 0.001, Math.max(loopStart, startOffset));
  const duration = Math.max(0.02, loopEnd - safeOffset);
  const overlap = getHumLoopOverlapSeconds(loopEnd - loopStart, safeOffset);
  const fadeOutStart = Math.max(startTime, startTime + duration - overlap);

  const source = graph.ctx.createBufferSource();
  source.buffer = graph.buffer;

  const gain = graph.ctx.createGain();
  gain.gain.setValueAtTime(fadeIn ? 0 : 1, startTime);
  if (fadeIn && overlap > 0) {
    gain.gain.linearRampToValueAtTime(1, startTime + overlap);
  }
  gain.gain.setValueAtTime(1, fadeOutStart);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  source.connect(gain);
  gain.connect(graph.gain);

  const voice: HumLoopVoice = { gain, source };
  graph.voices.add(voice);

  source.onended = () => {
    graph.voices.delete(voice);
    logAudioDebug('hum-voice-ended', {
      ctxNow: graph.ctx.currentTime.toFixed(3),
      remainingVoices: graph.voices.size,
    });
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // no-op
    }
  };

  source.start(startTime, safeOffset, duration);
  source.stop(startTime + duration + 0.03);

  logAudioDebug('hum-voice-scheduled', {
    startTime: startTime.toFixed(3),
    ctxNow: graph.ctx.currentTime.toFixed(3),
    offset: safeOffset.toFixed(3),
    duration: duration.toFixed(3),
    overlap: overlap.toFixed(3),
    fadeIn,
    voices: graph.voices.size,
    bufDur: graph.buffer.duration.toFixed(3),
    loopStart: loopStart.toFixed(3),
    loopEnd: loopEnd.toFixed(3),
  });

  return {
    duration,
    overlap,
    startOffset: safeOffset,
  };
}

function scheduleHumLoopVoicesAhead(graph: HumLoopGraph) {
  if (typeof window === 'undefined' || humLoopGraph !== graph || !fallbackHumActive) return;

  clearHumLoopScheduler(graph);

  const lookAheadSeconds = 0.8;
  while (graph.nextVoiceStartTime !== null && graph.nextVoiceStartTime <= graph.ctx.currentTime + lookAheadSeconds) {
    const scheduled = scheduleHumLoopVoice(graph, graph.nextVoiceStartTime, graph.nextVoiceOffset, true);
    graph.nextVoiceStartTime = graph.nextVoiceStartTime + scheduled.duration - scheduled.overlap;
    graph.nextVoiceOffset = getHumLoopStart(graph.buffer);
  }

  if (graph.nextVoiceStartTime === null) return;

  const delayMs = Math.max(40, (graph.nextVoiceStartTime - graph.ctx.currentTime - 0.35) * 1000);
  graph.schedulerTimer = window.setTimeout(() => {
    graph.schedulerTimer = null;
    scheduleHumLoopVoicesAhead(graph);
  }, delayMs);
}

function resetHumMediaElement(audio: HTMLAudioElement, reset = true) {
  try {
    audio.pause();
    syncHumMediaSource(audio, { allowWhilePlaying: true, resetCurrentTime: false });
    if (reset) {
      audio.currentTime = getHumMediaLoopStart(audio);
    }
    audio.loop = true;
    audio.muted = true;
    audio.volume = 0;
  } catch {
    // no-op
  }
}

function stopHumMediaBridge(reset = true) {
  clearHumMediaFadeFrame();
  clearHumMediaStopTimer();
  clearHumMediaHandoffTimer();
  clearHumMediaResumeCleanup();
  humMediaBridgeActive = false;

  if (fallbackAudio) {
    resetHumMediaElement(fallbackAudio.hum, reset);
  }
}

function startPreparedHumLoopGraph(graph: HumLoopGraph, startOffset?: number) {
  try {
    if (graph.voices.size > 0) {
      fallbackHumActive = true;
      fallbackGestureArmed.hum = true;
      return true;
    }

    const loopStart = getHumLoopStart(graph.buffer);
    const initialOffset = Math.min(
      getHumLoopEnd(graph.buffer) - 0.001,
      Math.max(loopStart, startOffset ?? loopStart),
    );
    const scheduled = scheduleHumLoopVoice(graph, graph.ctx.currentTime, initialOffset, false);
    graph.nextVoiceStartTime = graph.ctx.currentTime + scheduled.duration - scheduled.overlap;
    graph.nextVoiceOffset = getHumLoopStart(graph.buffer);
    scheduleHumLoopVoicesAhead(graph);

    fallbackHumActive = true;
    fallbackGestureArmed.hum = true;
    logPlaySuccess('hum', {
      mode: 'crossfaded-overlap-loop',
      loopStart,
      loopEnd: getHumLoopEnd(graph.buffer),
      startOffset: initialOffset,
      overlapMs: HUM_LOOP_CROSSFADE_MS,
      duration: graph.buffer.duration,
    });
    return true;
  } catch (error) {
    logPlayFailure('hum', error, { mode: 'crossfaded-overlap-loop-start' });
    destroyHumLoopGraph();
    fallbackHumActive = false;
    fallbackGestureArmed.hum = false;
    return false;
  }
}

/**
 * Start hum at zero gain and schedule fade-in after gong tail.
 * If buffer is ready: create + start the real loop silently.
 * If buffer is NOT ready: start a silent placeholder oscillator to keep
 * the gesture context alive, then swap in the real buffer once decoded.
 */
function startHumSilentlyWithDeferredFadeIn(ctx: AudioContext) {
  clearHumFadeInTimer();
  destroySilentPlaceholder();

  let humStartedSilently = false;

  // Try to start the real hum buffer at zero gain
  const graph = getPreparedHumLoopGraph(ctx);
  if (graph) {
    // Start at zero gain — no audible output yet
    graph.gain.gain.setValueAtTime(0, ctx.currentTime);
    humStartedSilently = startPreparedHumLoopGraph(graph);

    if (humStartedSilently) {
      // Schedule the fade-in after the gong's initial attack fades
      humFadeInTimer = window.setTimeout(() => {
        humFadeInTimer = null;
        if (humLoopGraph === graph && fallbackHumActive) {
          animateHumVolume(graph, HUM_VOLUME, HUM_FADE_IN_MS);
          logAudioDebug('hum-fade-in-after-gong', { mode: 'buffer-ready' });
        }
      }, HUM_FADE_IN_DELAY_S * 1000);
    }

    return humStartedSilently;
  }

  // Buffer not decoded yet — start a silent placeholder synchronously
  createSilentPlaceholder(ctx);

  // Kick off decode and swap in the real hum once ready
  void decodeHumBuffer().then((buffer) => {
    const loopBuffer = humLoopBuffer ?? buffer;
    if (!loopBuffer || !silentPlaceholder || silentPlaceholder.ctx !== ctx) return;

    destroySilentPlaceholder();
    const realGraph = createHumLoopGraph(ctx, loopBuffer);
    realGraph.gain.gain.setValueAtTime(0, ctx.currentTime);
    const started = startPreparedHumLoopGraph(realGraph);

    if (started) {
      // Schedule the fade-in
      clearHumFadeInTimer();
      humFadeInTimer = window.setTimeout(() => {
        humFadeInTimer = null;
        if (humLoopGraph === realGraph && fallbackHumActive) {
          animateHumVolume(realGraph, HUM_VOLUME, HUM_FADE_IN_MS);
          logAudioDebug('hum-fade-in-after-gong', { mode: 'deferred-decode' });
        }
      }, HUM_FADE_IN_DELAY_S * 1000);
    }
  });

  // Return true because the placeholder keeps the gesture context alive
  fallbackHumActive = true;
  return true;
}

function startHumMediaBridge(audio: HTMLAudioElement) {
  clearHumFadeInTimer();
  clearHumMediaFadeFrame();
  clearHumMediaStopTimer();
  clearHumMediaHandoffTimer();

  syncHumMediaSource(audio, { allowWhilePlaying: true, resetCurrentTime: false });
  requestLoad(audio);
  humRevealStartedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    audio.loop = true;
    audio.muted = true;
    audio.volume = 0;
    audio.currentTime = getHumMediaLoopStart(audio);
  } catch {
    // no-op
  }

  let started = false;
  if (fallbackGestureArmed.hum && !audio.paused) {
    started = true;
    logPlaySuccess('hum', {
      armed: true,
      mode: 'media-bridge',
      readyState: audio.readyState,
      transport: 'media-element',
    });
  } else {
    started = attemptPlay('hum', audio, {
      armed: false,
      mode: 'media-bridge',
      transport: 'media-element',
    });
  }

  if (!started) return false;

  humMediaBridgeActive = true;
  fallbackHumActive = true;

  humFadeInTimer = window.setTimeout(() => {
    humFadeInTimer = null;
    if (!humMediaBridgeActive || audio.paused) return;

    try {
      audio.muted = false;
    } catch {
      // no-op
    }

    animateHumMediaVolume(audio, HUM_VOLUME, HUM_FADE_IN_MS);
    logAudioDebug('hum-fade-in-after-gong', { mode: 'media-bridge' });
  }, HUM_FADE_IN_DELAY_S * 1000);

  return true;
}

function queueHumMediaBridgeHandoff(ctx: AudioContext, audio: HTMLAudioElement) {
  clearHumMediaResumeCleanup();
  clearHumMediaHandoffTimer();

  const handoff = () => {
    const startHandoff = (buffer: AudioBuffer) => {
      if (!fallbackHumActive || !humMediaBridgeActive || ctx.state !== 'running') return;

      const graph = createHumLoopGraph(ctx, buffer);
      graph.gain.gain.setValueAtTime(0, ctx.currentTime);

      const startOffset = getHumHandoffOffset(audio, buffer);
      const started = startPreparedHumLoopGraph(graph, startOffset);
      if (!started) return;

      const targetVolume = audio.volume > 0 ? audio.volume : HUM_VOLUME;
      animateHumVolume(graph, targetVolume, HUM_FADE_IN_MS);
      animateHumMediaVolume(audio, 0, HUM_FADE_OUT_MS);

      clearHumMediaStopTimer();
      humMediaStopTimer = window.setTimeout(() => {
        humMediaStopTimer = null;
        humMediaBridgeActive = false;
        resetHumMediaElement(audio, false);
      }, Math.max(HUM_FADE_IN_MS, HUM_FADE_OUT_MS) + 48);

      logAudioDebug('hum-media-bridge-handoff', {
        loopStart: HUM_LOOP_START,
        loopEnd: getHumLoopEnd(buffer),
        startOffset,
      });
    };

    if (humLoopBuffer || humDecodedBuffer) {
      startHandoff(humLoopBuffer ?? humDecodedBuffer!);
      return;
    }

    void decodeHumBuffer().then((buffer) => {
      const loopBuffer = humLoopBuffer ?? buffer;
      if (loopBuffer) {
        startHandoff(loopBuffer);
      }
    });
  };

  const scheduleHandoff = () => {
    const safeHandoffAt = humRevealStartedAt + (HUM_FADE_IN_DELAY_S * 1000) + HUM_FADE_IN_MS + 48;
    const delay = Math.max(0, safeHandoffAt - (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    if (delay <= 0) {
      handoff();
      return;
    }

    humMediaHandoffTimer = window.setTimeout(() => {
      humMediaHandoffTimer = null;
      handoff();
    }, delay);
  };

  if (ctx.state === 'running') {
    scheduleHandoff();
    return;
  }

  humMediaResumeCleanup = runWhenAudioContextRunning(
    ctx,
    () => {
      humMediaResumeCleanup = null;
      scheduleHandoff();
    },
    12_000,
    () => {
      humMediaResumeCleanup = null;
    },
  );
}

export function armDemoEntryFallbackGestureAudio({ gong = true, hum = true }: ArmDemoEntryFallbackOptions = {}) {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  requestLoad(audio.hum);
  clearHumFadeFrame();
  clearHumStopTimer();
  clearHumMediaFadeFrame();
  clearHumMediaStopTimer();
  clearHumMediaHandoffTimer();
  clearHumMediaResumeCleanup();

  fallbackHumActive = false;
  humMediaBridgeActive = false;
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
    syncHumMediaSource(audio.hum, { allowWhilePlaying: false, resetCurrentTime: false });
    fallbackGestureArmed.hum = armMutedLoop('hum', audio.hum, true, {
      mode: 'media-bridge',
      transport: 'media-element',
      mediaSource: isSeamlessHumMediaSource(audio.hum) ? 'seamless' : 'raw',
    });

    const ctx = getAudioContext();
    const graph = ctx ? getPreparedHumLoopGraph(ctx) : null;

    if (graph) {
      logAudioDebug('hum-buffer-ready', {
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
    stopHumMediaBridge();
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
  requestLoad(audio.hum);
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
  requestLoad(audio.hum);
  clearHumFadeFrame();
  clearHumStopTimer();
  clearHumFadeInTimer();
  clearHumMediaFadeFrame();
  clearHumMediaStopTimer();
  clearHumMediaHandoffTimer();
  clearHumMediaResumeCleanup();

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

  // Start hum as a pre-armed media bridge inside the same gesture.
  // Once Web Audio is truly running, hand off to the gapless buffer loop.
  const ctx = getAudioContext();
  const humStarted = startHumMediaBridge(audio.hum);
  if (humStarted && ctx) {
    queueHumMediaBridgeHandoff(ctx, audio.hum);
  }

  fallbackHumActive = humStarted;
  fallbackGestureArmed.gong = false;
  fallbackGestureArmed.hum = humStarted;
  logAudioDebug('entry-fallback-triggered', {
    gongReady: audio.gong.readyState,
    humBuffered: Boolean(humDecodedBuffer),
    humArmed: humStarted,
    mode: humStarted ? 'media-bridge-handoff' : 'missed',
  });

  return gongStarted || humStarted;
}

export function handoffDemoEntryFallbackHum(durationMs = HUM_FADE_OUT_MS) {
  clearHumFadeInTimer();
  destroySilentPlaceholder();
  stopHumMediaBridge(false);
  if (!humLoopGraph) return false;

  const graph = humLoopGraph;
  clearHumLoopScheduler(graph);
  graph.nextVoiceStartTime = null;
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
  clearHumFadeInTimer();
  destroySilentPlaceholder();
  clearHumFadeFrame();
  clearHumStopTimer();
  stopHumMediaBridge(reset);
  destroyHumLoopGraph();

  if (fallbackAudio) {
    try {
      fallbackAudio.gong.pause();
      if (reset) fallbackAudio.gong.currentTime = 0;
      fallbackAudio.gong.loop = false;
      fallbackAudio.gong.muted = false;
      fallbackAudio.gong.volume = GONG_VOLUME;
      resetHumMediaElement(fallbackAudio.hum, reset);
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

export interface HumLoopDiagnostics {
  active: boolean;
  voices: number;
  ctxTime: number;
  ctxState: string;
  nextStart: number | null;
  nextOffset: number;
  bufferDuration: number;
  loopStart: number;
  loopEnd: number;
  overlapMs: number;
  mediaBridge: boolean;
  mediaTime: number;
  mediaPlaying: boolean;
  mediaSource: string;
  gainValue: number;
}

export function getHumLoopDiagnostics(): HumLoopDiagnostics {
  const graph = humLoopGraph;
  const audio = fallbackAudio?.hum;
  return {
    active: fallbackHumActive,
    voices: graph?.voices.size ?? 0,
    ctxTime: graph?.ctx.currentTime ?? 0,
    ctxState: graph?.ctx.state ?? (getAudioContext()?.state ?? 'null'),
    nextStart: graph?.nextVoiceStartTime ?? null,
    nextOffset: graph?.nextVoiceOffset ?? 0,
    bufferDuration: graph?.buffer.duration ?? 0,
    loopStart: graph ? getHumLoopStart(graph.buffer) : HUM_LOOP_START,
    loopEnd: graph ? getHumLoopEnd(graph.buffer) : HUM_LOOP_END,
    overlapMs: HUM_LOOP_CROSSFADE_MS,
    mediaBridge: humMediaBridgeActive,
    mediaTime: audio?.currentTime ?? 0,
    mediaPlaying: audio ? !audio.paused : false,
    mediaSource: audio?.dataset.zenHumLoopSource ?? 'unknown',
    gainValue: graph?.gain.gain.value ?? 0,
  };
}

if (typeof window !== 'undefined') {
  void fetchHumArrayBuffer();
}
