import gongUrl from '@/assets/audio/demo-entry-gong.wav';
import humUrl from '@/assets/audio/demo-entry-hum-loop.wav';
import { logAudioDebug } from '@/lib/audioDebug';

interface DemoEntryFallbackAudioElements {
  gong: HTMLAudioElement;
  hum: HTMLAudioElement;
}

let fallbackAudio: DemoEntryFallbackAudioElements | null = null;
let fallbackHumActive = false;
let preloadLogged = false;

function createAudioElement(src: string, { loop = false, volume = 1 }: { loop?: boolean; volume?: number }) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.loop = loop;
  audio.volume = volume;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', 'true');
  return audio;
}

function ensureFallbackAudio() {
  if (typeof window === 'undefined') return null;

  if (!fallbackAudio) {
    fallbackAudio = {
      gong: createAudioElement(gongUrl, { volume: 0.9 }),
      hum: createAudioElement(humUrl, { loop: true, volume: 0.22 }),
    };
  }

  return fallbackAudio;
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

function logPlaySuccess(kind: 'gong' | 'hum', audio: HTMLAudioElement) {
  logAudioDebug(`${kind}-fired`, {
    ctx: 'media-element',
    mode: 'fallback',
    readyState: audio.readyState,
    loop: audio.loop,
  });
}

function logPlayFailure(kind: 'gong' | 'hum', error: unknown, audio: HTMLAudioElement) {
  logAudioDebug(`${kind}-missed`, {
    reason: error instanceof DOMException ? error.name : 'play-rejected',
    readyState: audio.readyState,
    paused: audio.paused,
  });
}

function attemptPlay(kind: 'gong' | 'hum', audio: HTMLAudioElement) {
  try {
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(() => {
        logPlaySuccess(kind, audio);
      }).catch((error) => {
        logPlayFailure(kind, error, audio);
      });
    } else {
      logPlaySuccess(kind, audio);
    }
    return true;
  } catch (error) {
    logPlayFailure(kind, error, audio);
    return false;
  }
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

  try {
    audio.gong.pause();
    audio.gong.currentTime = 0;
  } catch {
    // no-op
  }

  try {
    if (audio.hum.paused) {
      audio.hum.currentTime = 0;
    }
  } catch {
    // no-op
  }

  const gongStarted = attemptPlay('gong', audio.gong);
  const humStarted = audio.hum.paused ? attemptPlay('hum', audio.hum) : true;

  fallbackHumActive = humStarted;
  logAudioDebug('entry-fallback-triggered', {
    gongReady: audio.gong.readyState,
    humReady: audio.hum.readyState,
    humAlreadyPlaying: !audio.hum.paused,
  });

  return gongStarted || humStarted;
}

export function stopDemoEntryFallbackHum(reset = true) {
  if (!fallbackAudio) return;

  try {
    fallbackAudio.hum.pause();
    if (reset) fallbackAudio.hum.currentTime = 0;
  } catch {
    // no-op
  }

  try {
    fallbackAudio.gong.pause();
    if (reset) fallbackAudio.gong.currentTime = 0;
  } catch {
    // no-op
  }

  fallbackHumActive = false;
  logAudioDebug('entry-fallback-stopped');
}

export function isDemoEntryFallbackHumActive() {
  return fallbackHumActive;
}