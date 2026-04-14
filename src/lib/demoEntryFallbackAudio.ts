import gongUrl from '@/assets/audio/demo-entry-gong.wav';
import humUrl from '@/assets/audio/demo-entry-hum-loop.wav';
import { logAudioDebug } from '@/lib/audioDebug';

interface DemoEntryFallbackAudioElements {
  gong: HTMLAudioElement;
  hum: HTMLAudioElement;
}

type AudioKind = keyof DemoEntryFallbackAudioElements;

let fallbackAudio: DemoEntryFallbackAudioElements | null = null;
let fallbackHumActive = false;
let preloadLogged = false;
let humFadeFrame: number | null = null;
const fallbackGestureArmed: Record<AudioKind, boolean> = {
  gong: false,
  hum: false,
};

const GONG_VOLUME = 0.9;
const HUM_VOLUME = 0.22;

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
      hum: createAudioElement(humUrl, { loop: true, volume: HUM_VOLUME }),
    };
  }

  return fallbackAudio;
}

function cancelHumFade() {
  if (typeof window === 'undefined' || humFadeFrame === null) return;
  window.cancelAnimationFrame(humFadeFrame);
  humFadeFrame = null;
}

function fadeHumTo(audio: HTMLAudioElement, targetVolume: number, durationMs = 220) {
  cancelHumFade();

  if (typeof window === 'undefined' || durationMs <= 0) {
    audio.volume = targetVolume;
    return;
  }

  const startVolume = audio.volume;
  const startedAt = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - startedAt) / durationMs, 1);
    audio.volume = startVolume + ((targetVolume - startVolume) * progress);

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

function logPlaySuccess(kind: AudioKind, audio: HTMLAudioElement, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-fired`, {
    ctx: 'media-element',
    mode: 'fallback',
    readyState: audio.readyState,
    loop: audio.loop,
    ...details,
  });
}

function logPlayFailure(kind: AudioKind, error: unknown, audio: HTMLAudioElement, details?: Record<string, unknown>) {
  logAudioDebug(`${kind}-missed`, {
    reason: error instanceof DOMException ? error.name : 'play-rejected',
    readyState: audio.readyState,
    paused: audio.paused,
    ...details,
  });
}

function logArmSuccess(kind: AudioKind, audio: HTMLAudioElement) {
  logAudioDebug(`${kind}-armed`, {
    ctx: 'media-element',
    mode: 'fallback',
    readyState: audio.readyState,
    loop: audio.loop,
    muted: audio.muted,
  });
}

function logArmFailure(kind: AudioKind, error: unknown, audio: HTMLAudioElement) {
  logAudioDebug(`${kind}-arm-missed`, {
    reason: error instanceof DOMException ? error.name : 'play-rejected',
    readyState: audio.readyState,
    paused: audio.paused,
  });
}

function attemptPlay(kind: AudioKind, audio: HTMLAudioElement, details?: Record<string, unknown>) {
  try {
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(() => {
        logPlaySuccess(kind, audio, details);
      }).catch((error) => {
        logPlayFailure(kind, error, audio, details);
      });
    } else {
      logPlaySuccess(kind, audio, details);
    }
    return true;
  } catch (error) {
    logPlayFailure(kind, error, audio, details);
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
        logArmSuccess(kind, audio);
      }).catch((error) => {
        fallbackGestureArmed[kind] = false;
        logArmFailure(kind, error, audio);
      });
    } else {
      logArmSuccess(kind, audio);
    }
    return true;
  } catch (error) {
    logArmFailure(kind, error, audio);
    return false;
  }
}

export function armDemoEntryFallbackGestureAudio() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  requestLoad(audio.hum);
  cancelHumFade();

  fallbackHumActive = false;
  fallbackGestureArmed.gong = armMutedLoop('gong', audio.gong, true);
  fallbackGestureArmed.hum = armMutedLoop('hum', audio.hum, true);

  logAudioDebug('entry-fallback-armed', {
    gongArmed: fallbackGestureArmed.gong,
    humArmed: fallbackGestureArmed.hum,
    gongReady: audio.gong.readyState,
    humReady: audio.hum.readyState,
  });

  return fallbackGestureArmed.gong || fallbackGestureArmed.hum;
}

export function preloadDemoEntryFallbackAudio() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  requestLoad(audio.hum);

  if (!preloadLogged) {
    preloadLogged = true;
    logAudioDebug('entry-fallback-preloaded', {
      gongReady: audio.gong.readyState,
      humReady: audio.hum.readyState,
    });
  }

  return true;
}

export function playDemoEntryFallbackRevealAudio() {
  const audio = ensureFallbackAudio();
  if (!audio) return false;

  requestLoad(audio.gong);
  requestLoad(audio.hum);
  cancelHumFade();

  let gongStarted = false;
  if (fallbackGestureArmed.gong && !audio.gong.paused) {
    try {
      audio.gong.loop = false;
      audio.gong.currentTime = 0;
      audio.gong.volume = GONG_VOLUME;
      audio.gong.muted = false;
      gongStarted = true;
      logPlaySuccess('gong', audio.gong, { armed: true });
    } catch (error) {
      logPlayFailure('gong', error, audio.gong, { armed: true });
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

  let humStarted = false;
  if (fallbackGestureArmed.hum && !audio.hum.paused) {
    try {
      audio.hum.loop = true;
      audio.hum.muted = false;
      fadeHumTo(audio.hum, HUM_VOLUME);
      humStarted = true;
      logPlaySuccess('hum', audio.hum, { armed: true });
    } catch (error) {
      logPlayFailure('hum', error, audio.hum, { armed: true });
    }
  } else {
    audio.hum.loop = true;
    audio.hum.muted = false;
    audio.hum.volume = HUM_VOLUME;

    try {
      if (audio.hum.paused) {
        audio.hum.currentTime = 0;
      }
    } catch {
      // no-op
    }

    humStarted = audio.hum.paused ? attemptPlay('hum', audio.hum, { armed: false }) : true;
    if (humStarted && !audio.hum.paused) {
      logPlaySuccess('hum', audio.hum, { armed: false, resumed: true });
    }
  }

  fallbackHumActive = humStarted;
  fallbackGestureArmed.gong = false;
  fallbackGestureArmed.hum = humStarted;
  logAudioDebug('entry-fallback-triggered', {
    gongReady: audio.gong.readyState,
    humReady: audio.hum.readyState,
    humAlreadyPlaying: !audio.hum.paused,
    gongArmed: gongStarted,
    humArmed: humStarted,
  });

  return gongStarted || humStarted;
}

export function stopDemoEntryFallbackHum(reset = true) {
  if (!fallbackAudio) return;

  cancelHumFade();

  try {
    fallbackAudio.hum.pause();
    if (reset) fallbackAudio.hum.currentTime = 0;
    fallbackAudio.hum.loop = true;
    fallbackAudio.hum.muted = false;
    fallbackAudio.hum.volume = HUM_VOLUME;
  } catch {
    // no-op
  }

  try {
    fallbackAudio.gong.pause();
    if (reset) fallbackAudio.gong.currentTime = 0;
    fallbackAudio.gong.loop = false;
    fallbackAudio.gong.muted = false;
    fallbackAudio.gong.volume = GONG_VOLUME;
  } catch {
    // no-op
  }

  fallbackHumActive = false;
  fallbackGestureArmed.gong = false;
  fallbackGestureArmed.hum = false;
  logAudioDebug('entry-fallback-stopped');
}

export function isDemoEntryFallbackHumActive() {
  return fallbackHumActive;
}