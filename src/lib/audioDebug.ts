export const AUDIO_DEBUG_EVENT = 'zen-audio-debug';

export interface AudioDebugEntry {
  id: string;
  time: string;
  message: string;
}

interface AudioDebugEventDetail {
  entry: AudioDebugEntry;
  entries: AudioDebugEntry[];
}

const MAX_AUDIO_DEBUG_ENTRIES = 24;
const audioDebugHistory: AudioDebugEntry[] = [];

function formatValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }

  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }

  return String(value);
}

function formatDetails(details?: Record<string, unknown>) {
  if (!details) return '';

  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' | ');
}

export function isAudioDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const forced = (window as Window & { __ZEN_FORCE_AUDIO_DEBUG__?: boolean }).__ZEN_FORCE_AUDIO_DEBUG__ === true;
  return forced || searchParams.has('audio-debug');
}

export function getAudioDebugEntries() {
  return [...audioDebugHistory];
}

export function clearAudioDebugEntries() {
  audioDebugHistory.length = 0;
}

export function logAudioDebug(message: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !isAudioDebugEnabled()) return;

  const formattedDetails = formatDetails(details);
  const entry: AudioDebugEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString().slice(11, 23),
    message: formattedDetails ? `${message} | ${formattedDetails}` : message,
  };

  audioDebugHistory.push(entry);
  if (audioDebugHistory.length > MAX_AUDIO_DEBUG_ENTRIES) {
    audioDebugHistory.splice(0, audioDebugHistory.length - MAX_AUDIO_DEBUG_ENTRIES);
  }

  window.dispatchEvent(
    new CustomEvent<AudioDebugEventDetail>(AUDIO_DEBUG_EVENT, {
      detail: {
        entry,
        entries: getAudioDebugEntries(),
      },
    }),
  );
}