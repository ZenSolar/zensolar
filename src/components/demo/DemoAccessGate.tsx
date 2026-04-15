import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react'; // sync-fix
import { Input } from '@/components/ui/input';
import { Lock, Sparkles, ShieldCheck, Sun, Zap, Battery, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logAudioDebug } from '@/lib/audioDebug';
import {
  armDemoEntryFallbackGestureAudio,
  playDemoEntryFallbackRevealAudio,
  preloadDemoEntryFallbackAudio,
  stopDemoEntryFallbackHum,
} from '@/lib/demoEntryFallbackAudio';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { AudioDebugOverlay } from '@/components/demo/AudioDebugOverlay';
import { GateHexBackground } from '@/components/demo/GateHexBackground';
import { ReleaseAudioDiagnostics } from '@/components/demo/ReleaseAudioDiagnostics';
import { HumLoopDiagnosticsOverlay } from '@/components/demo/HumLoopDiagnostics';
import { NdaSignatureStep } from '@/components/demo/NdaSignatureStep';
import { getSafeAudioStartTime, getSharedAudioContext, IMMEDIATE_SOUND_LEAD, runWhenAudioContextRunning, useMintSound } from '@/hooks/useMintSound';



const LS_KEY = 'zen_demo_access';
const NDA_EMAIL_KEY = 'zen_nda_email';
const TTL_MS = 24 * 60 * 60 * 1000;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return value ? decodeURIComponent(value) : null;
}

function writeCookie(name: string, value: string, maxAgeMs: number) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.floor(maxAgeMs / 1000)}; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? readCookie(key);
  } catch {
    return readCookie(key);
  }
}

function writeStoredValue(key: string, value: string, maxAgeMs: number) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }

  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }

  writeCookie(key, value, maxAgeMs);
}

function removeStoredValue(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }

  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }

  removeCookie(key);
}

function parseRecentEmailRecord(raw: string | null): { email: string; ts: number } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { email?: string; ts?: number };
    if (!parsed.email || typeof parsed.ts !== 'number') return null;
    return parsed.ts > 0 && Date.now() - parsed.ts < TTL_MS ? { email: parsed.email, ts: parsed.ts } : null;
  } catch {
    return null;
  }
}

function isAccessGranted(): boolean {
  try {
    const raw = readStoredValue(LS_KEY);
    if (!raw) return false;
    const { ts, ndaSigned } = JSON.parse(raw);
    // Access requires both a valid timestamp AND a signed NDA
    return ndaSigned === true && Date.now() - ts < TTL_MS;
  } catch {
    return false;
  }
}

function grantAccess() {
  writeStoredValue(LS_KEY, JSON.stringify({ ts: Date.now(), ndaSigned: true }), TTL_MS);
}

function getSavedNdaEmail(): string | null {
  const raw = readStoredValue(NDA_EMAIL_KEY);
  const parsed = parseRecentEmailRecord(raw);

  if (parsed) return parsed.email;
  return raw;
}

function saveNdaEmail(email: string) {
  writeStoredValue(NDA_EMAIL_KEY, JSON.stringify({ email, ts: Date.now() }), TTL_MS);
}

async function checkExistingNda(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_nda_signed', { _email: email });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

// ─── Burst particles ────
const PARTICLE_COUNT = 12;
const RGBA = '34, 197, 94';
const RGBA_GOLD = '255, 180, 60';
const PARTICLE_SHAPE = 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)';

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const dist = 40 + Math.random() * 50;
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      size: 4 + Math.random() * 5,
      rotation: Math.random() * 360,
      alpha: 0.7 + Math.random() * 0.2,
      delay: i * 22,
      isGold: i % 4 === 0,
    };
  });
}

// ─── Attraction particles for hold effect ────
const ATTRACT_PARTICLE_COUNT = 8;
function generateAttractParticles() {
  return Array.from({ length: ATTRACT_PARTICLE_COUNT }, (_, i) => {
    const angle = (i / ATTRACT_PARTICLE_COUNT) * 360 + (Math.random() * 30 - 15);
    const rad = (angle * Math.PI) / 180;
    const dist = 55 + Math.random() * 30;
    return {
      x: Math.cos(rad) * dist,
      y: Math.sin(rad) * dist,
      size: 2 + Math.random() * 3,
      delay: i * 60 + Math.random() * 40,
      isGold: i % 3 === 0,
    };
  });
}

// ─── Timing constants ────
const DOUBLE_TAP_WINDOW = 500;
const TAP_HINT_VISIBILITY_MS = 1800;
const FIRST_TAP_BURST_MS = 620;
const GHOST_CLICK_SUPPRESSION = 400;
const LOCK_FLASH_MS = 600;
const HOLD_THRESHOLD_MS = 550;     // Short enough to feel immediate, long enough to unlock audio on iOS
const HOLD_RELEASE_GRACE_MS = 80;  // Absorb finger-lift timing variance on iPhone Safari/Chrome
const HAPTIC_PULSE_PROGRESS = [0, 0.28, 0.52, 0.74, 0.92] as const;
interface DemoAccessGateProps {
  children: React.ReactNode;
}

// ─── Interaction state managed via ref to avoid re-render storms ────
interface GateState {
  phase: 'idle' | 'verifying' | 'burst' | 'denied';
  showTapAgain: boolean;
  firstTapBurst: boolean;
  burstKey: number;
  revealed: boolean;
  hexAwake: boolean;
  lockedFlash: boolean;
  holding: boolean;       // true while finger is down & charging
  holdReady: boolean;     // true once hold threshold met (ring filled)
  holdHint: boolean;      // "hold longer" nudge after premature release
}

interface ReleaseAudioDiagnosticsState {
  fallbackArmed: string;
  fallbackFired: string;
  audioContextState: string;
  synthHandoff: string;
  lastEvent: string;
  updatedAt: number | null;
}

const INITIAL_RELEASE_AUDIO_DIAGNOSTICS: ReleaseAudioDiagnosticsState = {
  fallbackArmed: 'idle',
  fallbackFired: 'idle',
  audioContextState: 'null',
  synthHandoff: 'idle',
  lastEvent: 'waiting-for-gesture',
  updatedAt: null,
};

export function DemoAccessGate({ children }: DemoAccessGateProps) {
  const [granted, setGranted] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      removeStoredValue(LS_KEY);
      window.history.replaceState({}, '', window.location.pathname);
      return false;
    }
    return isAccessGranted();
  });
  const [code, setCode] = useState('');
  const [showNda, setShowNda] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [releaseAudioDiagnostics, setReleaseAudioDiagnostics] = useState<ReleaseAudioDiagnosticsState>(INITIAL_RELEASE_AUDIO_DIAGNOSTICS);
  const showAudioDebug = false;
  const showReleaseAudioDiagnostics = false;
  

  // ── stateRef pattern: single ref holds all interaction state ──
  const stateRef = useRef<GateState>({
    phase: 'idle',
    showTapAgain: false,
    firstTapBurst: false,
    burstKey: 0,
    revealed: false,
    hexAwake: false,
    lockedFlash: false,
    holding: false,
    holdReady: false,
    holdHint: false,
  });
  const [, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  const updateState = useCallback((patch: Partial<GateState>) => {
    Object.assign(stateRef.current, patch);
    forceRender();
  }, [forceRender]);
  const updateReleaseAudioDiagnostics = useCallback((patch: Partial<ReleaseAudioDiagnosticsState>) => {
    setReleaseAudioDiagnostics((prev) => ({
      ...prev,
      ...patch,
      updatedAt: Date.now(),
    }));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const lockButtonRef = useRef<HTMLButtonElement>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignorePointerUntilRef = useRef<number>(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdPulseTimersRef = useRef<number[]>([]);
  const holdStartRef = useRef<number>(0);
  const nativeGestureReadyRef = useRef(false);
  const fallbackGestureTimeRef = useRef(0);
  const audioReadyRef = useRef(false);
  const audioWakeCleanupRef = useRef<(() => void) | null>(null);

  const { primeAudio, prewarmSingingBowl, playDeniedSound, playMintSound, playWelcomeTap } = useMintSound();

  useEffect(() => {
    if (!showAudioDebug) return;
    logAudioDebug('access-gate-debug-enabled', { path: window.location.pathname });
  }, [showAudioDebug]);

  useEffect(() => {
    if (granted) return;

    const recentEmail = parseRecentEmailRecord(readStoredValue(NDA_EMAIL_KEY));
    if (!recentEmail) return;

    let cancelled = false;

    checkExistingNda(recentEmail.email).then((alreadySigned) => {
      if (cancelled || !alreadySigned) return;

      grantAccess();
      setGranted(true);
      toast.success('Welcome back!', { description: 'Your recent demo access has been restored.' });
    }).catch(() => {
      // best-effort restore only
    });

    return () => {
      cancelled = true;
    };
  }, [granted]);

  useEffect(() => {
    if (!showReleaseAudioDiagnostics) return;

    const syncAudioContextState = () => {
      const nextState = getSharedAudioContext()?.state ?? 'null';
      setReleaseAudioDiagnostics((prev) => (
        prev.audioContextState === nextState
          ? prev
          : { ...prev, audioContextState: nextState }
      ));
    };

    syncAudioContextState();
    const id = window.setInterval(syncAudioContextState, 150);

    return () => {
      window.clearInterval(id);
    };
  }, [showReleaseAudioDiagnostics]);

  useEffect(() => {
    preloadDemoEntryFallbackAudio();
    return () => {
      stopDemoEntryFallbackHum();
    };
  }, []);

  const logGestureDebug = useCallback((eventName: string, details?: Record<string, unknown>) => {
    const ctx = getSharedAudioContext();
    logAudioDebug(eventName, {
      ctx: ctx?.state ?? 'null',
      ...details,
    });
  }, []);

  const markHoldReady = useCallback((source: string, reason: 'threshold' | 'audio-ready') => {
    if (!stateRef.current.holding || stateRef.current.holdReady) return;

    updateState({ holdReady: true });
    if ('vibrate' in navigator) {
      try { navigator.vibrate([18, 24, 20]); } catch {}
    }
    logGestureDebug(`${source}-hold-ready`, { reason });
  }, [logGestureDebug, updateState]);

  // Stable particles — only regenerate on burstKey change
  const particles = useMemo(
    () => generateParticles(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stateRef.current.burstKey]
  );

  // Stable attraction particles for hold effect
  const attractParticles = useMemo(() => generateAttractParticles(), []);

  // No auto-focus — let user take in the full page experience first

  // Track the visual viewport so mobile browser chrome never exposes a dead strip
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const syncViewport = () => {
      if (!containerRef.current) return;
      const visibleHeight = Math.ceil(viewport?.height ?? window.innerHeight);
      const visibleOffsetTop = Math.max(Math.ceil(viewport?.offsetTop ?? 0), 0);
      const coverageHeight = Math.max(
        visibleHeight,
        window.innerHeight,
        document.documentElement.clientHeight,
        window.screen?.height ?? 0
      );

      containerRef.current.style.setProperty('--gate-visible-height', `${visibleHeight}px`);
      containerRef.current.style.setProperty('--gate-visible-offset-top', `${visibleOffsetTop}px`);
      containerRef.current.style.height = `${coverageHeight}px`;
      containerRef.current.style.minHeight = `${coverageHeight}px`;
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      if (lockFlashTimerRef.current) clearTimeout(lockFlashTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (lockedIndicatorTimerRef.current) clearTimeout(lockedIndicatorTimerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      audioWakeCleanupRef.current?.();
      holdPulseTimersRef.current.forEach(t => clearTimeout(t));
      holdPulseTimersRef.current = [];
    };
  }, []);

  // ── Core submit logic ──
  const submitCode = useCallback(async () => {
    const trimmed = code.trim();
    const s = stateRef.current;
    if (!trimmed || s.phase === 'verifying' || s.phase === 'burst') return;

    updateState({ phase: 'verifying', showTapAgain: false });
    

    try {
      const { data, error } = await supabase.rpc('verify_demo_code', { _code: trimmed });
      if (error) throw error;

      if (data === true) {
        updateState({ phase: 'burst', burstKey: s.burstKey + 1 });
        playMintSound();

        if ('vibrate' in navigator) {
          try { navigator.vibrate([15, 30, 10]); } catch {}
        }

        setTimeout(async () => {
          // Blur input to dismiss keyboard & reset iOS viewport zoom before showing NDA
          inputRef.current?.blur();
          stopDemoEntryFallbackHum();
          // Force viewport zoom reset on iOS
          const vp = document.querySelector('meta[name="viewport"]');
          if (vp) {
            const original = vp.getAttribute('content') || '';
            vp.setAttribute('content', original.replace(/maximum-scale=[^,]*/,'maximum-scale=1.0'));
            requestAnimationFrame(() => {
              vp.setAttribute('content', original);
            });
          }
          // Check if user has already signed NDA
          const savedEmail = getSavedNdaEmail();
          if (savedEmail) {
            const alreadySigned = await checkExistingNda(savedEmail);
            if (alreadySigned) {
              // Skip NDA, grant access directly
              grantAccess();
              setGranted(true);
              toast.success('Welcome back!', { description: 'NDA already on file.' });
              return;
            }
          }
          // Show NDA for new signers
          setVerifiedCode(code.trim());
          setShowNda(true);
        }, 1000);
      } else {
        updateState({ phase: 'denied' });
        playDeniedSound();
        toast.error('Invalid access code', { description: 'Please check your code and try again.' });

        setTimeout(() => {
          updateState({ phase: 'idle' });
          setCode('');
          lastTapTimeRef.current = 0;
          inputRef.current?.focus();
        }, 600);
      }
    } catch {
      updateState({ phase: 'idle' });
      toast.error('Connection error', { description: 'Please try again.' });
    }
  }, [code, playMintSound, playDeniedSound, updateState]);

  // ── Trigger first-tap burst (shared between single & double) ──
  const triggerBurst = useCallback(() => {
    const s = stateRef.current;
    updateState({ firstTapBurst: true, burstKey: s.burstKey + 1 });

    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => {
      updateState({ firstTapBurst: false });
    }, FIRST_TAP_BURST_MS);
  }, [updateState]);

  const triggerConfirmedMintBurst = useCallback((onComplete?: () => void) => {
    const s = stateRef.current;
    updateState({
      phase: 'burst',
      burstKey: s.burstKey + 1,
      firstTapBurst: false,
      lockedFlash: false,
      showTapAgain: false,
    });

    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    playMintSound();

    if ('vibrate' in navigator) {
      try { navigator.vibrate([20, 50, 30]); } catch {}
    }

    burstTimerRef.current = setTimeout(() => {
      updateState({ phase: 'idle' });
      onComplete?.();
    }, FIRST_TAP_BURST_MS);
  }, [playMintSound, updateState]);

  const triggerLockedIndicator = useCallback(() => {
    if (lockedIndicatorTimerRef.current) clearTimeout(lockedIndicatorTimerRef.current);
    updateState({
      firstTapBurst: false,
      lockedFlash: true,
      showTapAgain: false,
    });

    if ('vibrate' in navigator) {
      try { navigator.vibrate([20, 40, 20]); } catch {}
    }

    lockedIndicatorTimerRef.current = setTimeout(() => {
      updateState({ lockedFlash: false });
    }, LOCK_FLASH_MS);
  }, [updateState]);

  // ── Hold-to-unlock gesture ──
  // On press: prime audio synchronously (iOS gesture context), start charging ring.
  // On release after HOLD_THRESHOLD_MS: fire cinematic gong + curtain.
  // On release too early: show "hold longer" hint.

  const handleHoldStart = useCallback((source = 'pointerdown') => {
    if (Date.now() < ignorePointerUntilRef.current) {
      logGestureDebug(`${source}-ignored-ghost-click`);
      return;
    }

    const s = stateRef.current;
    if (s.phase === 'verifying' || s.phase === 'burst') return;

    audioWakeCleanupRef.current?.();
    audioWakeCleanupRef.current = null;

    const ctx = primeAudio();
    preloadDemoEntryFallbackAudio();
    updateReleaseAudioDiagnostics({
      fallbackArmed: s.hexAwake ? 'skipped' : 'arming',
      fallbackFired: 'idle',
      synthHandoff: s.hexAwake ? 'skipped' : 'idle',
      audioContextState: ctx?.state ?? 'null',
      lastEvent: `${source}-hold-start`,
    });

    if (!ctx) {
      updateReleaseAudioDiagnostics({
        audioContextState: 'null',
        lastEvent: `${source}-prime-audio-missed`,
      });
      logGestureDebug(`${source}-prime-audio-missed`);
    }

    let gongPrewarmed = false;
    let fallbackArmed = false;
    if (!s.hexAwake) {
      fallbackArmed = !!armDemoEntryFallbackGestureAudio({ gong: true, hum: true });
      gongPrewarmed = prewarmSingingBowl();
      updateReleaseAudioDiagnostics({
        fallbackArmed: fallbackArmed ? 'armed' : 'failed',
        synthHandoff: 'waiting-reveal',
        audioContextState: ctx?.state ?? 'null',
        lastEvent: `${source}-entry-audio-prewarmed`,
      });
      logGestureDebug(`${source}-entry-audio-prewarmed`, {
        gongPrewarmed,
        fallbackArmed,
        humMode: 'direct-file-loop',
      });
    }

    audioReadyRef.current = Boolean(s.hexAwake || fallbackArmed || (ctx && ctx.state === 'running'));
    if (!s.hexAwake && ctx && ctx.state !== 'running') {
      audioWakeCleanupRef.current = runWhenAudioContextRunning(
        ctx,
        () => {
          audioReadyRef.current = true;
          updateReleaseAudioDiagnostics({
            audioContextState: ctx.state,
            lastEvent: `${source}-audio-running`,
          });
          logGestureDebug(`${source}-audio-running`, { currentTime: ctx.currentTime });
          if (performance.now() - holdStartRef.current >= HOLD_THRESHOLD_MS - HOLD_RELEASE_GRACE_MS) {
            markHoldReady(source, 'audio-ready');
          }
        },
        1600,
        () => {
          updateReleaseAudioDiagnostics({
            audioContextState: ctx.state,
            lastEvent: `${source}-audio-running-timeout`,
          });
          logGestureDebug(`${source}-audio-running-timeout`, { ctxState: ctx.state });
        },
      );
    }

    holdStartRef.current = performance.now();
    updateState({ holding: true, holdReady: false, holdHint: false });
    logGestureDebug(`${source}-hold-start`);

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdPulseTimersRef.current.forEach(t => clearTimeout(t));
    holdPulseTimersRef.current = [];

    HAPTIC_PULSE_PROGRESS.forEach((progress, i) => {
      const delay = Math.round(HOLD_THRESHOLD_MS * progress);
      const timer = window.setTimeout(() => {
        if (!stateRef.current.holding) return;
        const intensity = 10 + i * 5;
        if ('vibrate' in navigator) {
          try { navigator.vibrate(intensity); } catch {}
        }
      }, delay);
      holdPulseTimersRef.current.push(timer);
    });

    holdTimerRef.current = window.setTimeout(() => {
      if (stateRef.current.hexAwake || audioReadyRef.current || ctx) {
        markHoldReady(source, 'threshold');
      } else {
        logGestureDebug(`${source}-hold-threshold-waiting-audio`, { ctxState: ctx?.state ?? 'null' });
        // Still mark ready after a short grace — the fallback gong handles audio
        window.setTimeout(() => {
          if (stateRef.current.holding && !stateRef.current.holdReady) {
            markHoldReady(source, 'threshold');
          }
        }, 120);
      }
    }, HOLD_THRESHOLD_MS);
  }, [logGestureDebug, markHoldReady, prewarmSingingBowl, primeAudio, updateState]);

  const handleHoldEnd = useCallback((source = 'pointerup') => {
    const s = stateRef.current;
    if (!s.holding) return;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdPulseTimersRef.current.forEach(t => clearTimeout(t));
    holdPulseTimersRef.current = [];
    audioWakeCleanupRef.current?.();
    audioWakeCleanupRef.current = null;

    const held = performance.now() - holdStartRef.current;
    // Snapshot holdReady BEFORE mutating stateRef (s is a live reference)
    const wasHoldReady = s.holdReady;
    const heldLongEnough = wasHoldReady || held >= HOLD_THRESHOLD_MS - HOLD_RELEASE_GRACE_MS;
    const ctx = primeAudio() ?? getSharedAudioContext();
    const audioReady = Boolean(s.hexAwake || audioReadyRef.current || ctx);
    updateState({ holding: false, holdReady: false });
    updateReleaseAudioDiagnostics({
      audioContextState: ctx?.state ?? 'null',
      lastEvent: `${source}-hold-end`,
    });
    logGestureDebug(`${source}-hold-end`, {
      held,
      heldLongEnough,
      audioReady,
      ctxState: ctx?.state ?? 'null',
      metHoldThreshold: heldLongEnough,
    });

    const showHoldHint = () => {
      updateState({ holdHint: true });
      if (lockFlashTimerRef.current) clearTimeout(lockFlashTimerRef.current);
      lockFlashTimerRef.current = setTimeout(() => {
        updateState({ holdHint: false });
      }, 2000);
    };

    if (!heldLongEnough) {
      if (!s.hexAwake) {
        stopDemoEntryFallbackHum();
      }
      updateReleaseAudioDiagnostics({
        fallbackFired: 'idle',
        synthHandoff: 'skipped',
        audioContextState: ctx?.state ?? 'null',
        lastEvent: `${source}-hold-end-too-early`,
      });
      showHoldHint();
      return;
    }

    const firstReveal = !s.hexAwake;

    const revealVisuals = () => {
      triggerBurst();
      updateState({ showTapAgain: false, revealed: true, hexAwake: true, holdReady: false, holdHint: false, lockedFlash: false });
      ignorePointerUntilRef.current = Date.now() + GHOST_CLICK_SUPPRESSION;

      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(() => {
        updateState({ revealed: false });
      }, LOCK_FLASH_MS);
    };

    const fireRevealAudio = (startTime: number, warmStart: boolean) => {
      if (firstReveal) {
        const revealAudioStarted = playDemoEntryFallbackRevealAudio();

        audioReadyRef.current = audioReadyRef.current || revealAudioStarted;
        updateReleaseAudioDiagnostics({
          fallbackFired: revealAudioStarted ? 'fired' : 'missed',
          audioContextState: ctx?.state ?? 'null',
          synthHandoff: revealAudioStarted ? 'direct-file-loop' : 'missed',
          lastEvent: `${source}-cinematic-reveal`,
        });
        logGestureDebug(`${source}-cinematic-reveal`, {
          start: startTime,
          ctxState: ctx?.state ?? 'null',
          warmStart,
          revealAudioStarted,
          audioMode: revealAudioStarted ? 'direct-file-loop' : 'missed',
          visualReveal: true,
        });
        return false;
      }

      playWelcomeTap(startTime);
      updateReleaseAudioDiagnostics({
        fallbackFired: 'skipped',
        synthHandoff: 'skipped',
        audioContextState: ctx?.state ?? 'null',
        lastEvent: `${source}-welcome-tap`,
      });
      logGestureDebug(`${source}-welcome-tap`, {
        start: startTime,
        ctxState: ctx?.state ?? 'null',
        warmStart,
        visualReveal: true,
      });
      return false;
    };

    // CRITICAL: Set hexAwake BEFORE firing audio so the reveal state is already committed.
    if (firstReveal) {
      stateRef.current.hexAwake = true;
    }

    // CRITICAL: Fire audio BEFORE any DOM mutations to preserve iOS gesture context
    if (ctx) {
      if (ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }

      const startTime = getSafeAudioStartTime(
        ctx,
        undefined,
        ctx.state === 'running' ? 0.005 : IMMEDIATE_SOUND_LEAD,
      );

      fireRevealAudio(startTime, ctx.state !== 'running');
    } else {
      // No AudioContext — still fire the direct reveal audio synchronously in gesture context
      if (firstReveal) {
        const revealAudioStarted = playDemoEntryFallbackRevealAudio();
        updateReleaseAudioDiagnostics({
          fallbackFired: revealAudioStarted ? 'fired' : 'missed',
          synthHandoff: revealAudioStarted ? 'direct-file-loop' : 'missed',
          audioContextState: 'null',
          lastEvent: `${source}-reveal-fallback-only`,
        });
        logGestureDebug(`${source}-reveal-fallback-only`, {
          revealAudioStarted,
          audioMode: revealAudioStarted ? 'direct-file-loop' : 'missed',
          visualReveal: true,
        });
      }
    }

    // Visuals AFTER audio to keep gesture context intact (hexAwake already set above)
    revealVisuals();

    if (!ctx) {
      logGestureDebug(`${source}-reveal-visual-only-no-audio-ctx`, { audioReady, visualReveal: true });
    }
  }, [logGestureDebug, playWelcomeTap, primeAudio, triggerBurst, updateReleaseAudioDiagnostics, updateState]);

  // ── Double-tap mint after reveal, hold-to-reveal before ──
  const handleLockPointerDown = useCallback((source = 'pointerdown') => {
    if (Date.now() < ignorePointerUntilRef.current) return;

    const s = stateRef.current;
    if (s.phase === 'verifying' || s.phase === 'burst') return;

    // After the initial hold-and-release reveal, the icon behaves like the KPI cards:
    // first tap = burst cue, second tap inside the window = confirmed mint action.
    if (s.hexAwake) {
      const now = Date.now();
      const hasCode = Boolean(code.trim());
      const isDoubleTap = lastTapTimeRef.current > 0 && now - lastTapTimeRef.current < DOUBLE_TAP_WINDOW;

      if (isDoubleTap) {
        if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
        lastTapTimeRef.current = 0;
        if (!hasCode) {
          logGestureDebug(`${source}-double-tap-locked`, { hasCode });
          triggerLockedIndicator();
          return;
        }

        logGestureDebug(`${source}-double-tap-access`, { hasCode });
        triggerConfirmedMintBurst(() => { void submitCode(); });
        return;
      }

      lastTapTimeRef.current = now;
      triggerBurst();
      playMintSound();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([15, 30, 10]); } catch {}
      }
      updateState({ showTapAgain: true, lockedFlash: false });
      logGestureDebug(`${source}-first-tap-sparks`, { hasCode });

      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        updateState({ showTapAgain: false });
      }, TAP_HINT_VISIBILITY_MS);
      return;
    }

    // Pre-reveal: no tap-to-submit — hold gesture handles everything
  }, [code, logGestureDebug, playMintSound, submitCode, triggerBurst, triggerConfirmedMintBurst, updateState]);

  const handlePreboundGestureFallback = useCallback(() => {
    if (nativeGestureReadyRef.current) return;
    const now = performance.now();
    if (now - fallbackGestureTimeRef.current < 80) return;
    fallbackGestureTimeRef.current = now;
    handleHoldStart('react-fallback');
  }, [handleHoldStart]);

  // Native event listeners for iOS gesture-chain audio unlock
  useLayoutEffect(() => {
    const btn = lockButtonRef.current;
    if (!btn) return;
    nativeGestureReadyRef.current = true;
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      // After reveal: tap handling switches to KPI-style mint confirmation
      if (stateRef.current.hexAwake) {
        handleLockPointerDown('touchstart');
        logGestureDebug('touchstart-post-reveal');
        return;
      }
      // Pre-reveal: hold gesture
      handleHoldStart('touchstart');
      logGestureDebug('touchstart');
    };
    const onTouchEnd = () => {
      // After reveal, touchend is a no-op (single tap handled in touchstart)
      if (!stateRef.current.holding) return;
      handleHoldEnd('touchend');
      logGestureDebug('touchend');
    };
    const onTouchCancel = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdPulseTimersRef.current.forEach(t => clearTimeout(t));
      holdPulseTimersRef.current = [];
      stopDemoEntryFallbackHum();
      updateState({ holding: false, holdReady: false });
      logGestureDebug('touchcancel');
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      // After reveal: pointer interactions use the same mint confirmation flow
      if (stateRef.current.hexAwake) {
        handleLockPointerDown(`pointerdown-${e.pointerType}`);
        logGestureDebug('pointerdown-post-reveal', { pointerType: e.pointerType });
        return;
      }
      handleHoldStart(`pointerdown-${e.pointerType}`);
      logGestureDebug('pointerdown', { pointerType: e.pointerType });
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      handleHoldEnd(`pointerup-${e.pointerType}`);
    };
    const onClick = () => {
      logGestureDebug('click');
    };
    btn.addEventListener('touchstart', onTouchStart, { capture: true, passive: false });
    btn.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    btn.addEventListener('touchcancel', onTouchCancel, { capture: true, passive: true });
    btn.addEventListener('pointerdown', onPointer, true);
    btn.addEventListener('pointerup', onPointerUp, true);
    btn.addEventListener('click', onClick, true);
    return () => {
      nativeGestureReadyRef.current = false;
      btn.removeEventListener('touchstart', onTouchStart, true);
      btn.removeEventListener('touchend', onTouchEnd, true);
      btn.removeEventListener('touchcancel', onTouchCancel, true);
      btn.removeEventListener('pointerdown', onPointer, true);
      btn.removeEventListener('pointerup', onPointerUp, true);
      btn.removeEventListener('click', onClick, true);
    };
  }, [handleHoldStart, handleHoldEnd, handleLockPointerDown, logGestureDebug, updateState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      primeAudio();
      submitCode();
    }
  };

  // Show unlock hint when input is focused or has text
  const showUnlockHint = inputFocused || code.trim().length > 0;

  const handleNdaSigned = useCallback((email?: string) => {
    stopDemoEntryFallbackHum();
    setShowNda(false);
    grantAccess();
    if (email) saveNdaEmail(email);
    setGranted(true);
  }, []);

  if (granted) return <>{children}</>;

  const { phase, firstTapBurst, showTapAgain, burstKey, revealed, hexAwake, lockedFlash, holding, holdReady, holdHint } = stateRef.current;
  const isBursting = phase === 'burst';
  const isDenied = phase === 'denied';
  const isVerifying = phase === 'verifying';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden touch-none"
      style={{
        backgroundColor: hexAwake ? 'hsl(var(--background))' : 'hsl(var(--gate-splash-background))',
        overscrollBehavior: 'none',
        minHeight: '100dvh',
        contain: 'strict',
        isolation: 'isolate',
      }}
    >
      {showAudioDebug && <AudioDebugOverlay />}
      {showAudioDebug && <HumLoopDiagnosticsOverlay />}
      {showReleaseAudioDiagnostics && (
        <ReleaseAudioDiagnostics
          fallbackArmed={releaseAudioDiagnostics.fallbackArmed}
          fallbackFired={releaseAudioDiagnostics.fallbackFired}
          audioContextState={releaseAudioDiagnostics.audioContextState}
          synthHandoff={releaseAudioDiagnostics.synthHandoff}
          lastEvent={releaseAudioDiagnostics.lastEvent}
          updatedAt={releaseAudioDiagnostics.updatedAt}
        />
      )}


      <div
        className="absolute inset-0"
        style={{
          touchAction: 'none',
          width: '100%',
          height: '100%',
          opacity: hexAwake ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
        }}
      >
        <GateHexBackground activated={hexAwake} />
      </div>

      {/* Radial vignette */}
      <div className={cn("absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)] pointer-events-none transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')} />

      {/* Ghost dashboard teaser */}
      <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
        <div className="w-full max-w-md px-6 opacity-[0.04] blur-[2px] flex flex-col gap-4 mt-40">
          <div className="flex gap-3">
            {[
              { icon: Sun, label: '12.4 kWh' },
              { icon: Battery, label: '8.2 kWh' },
              { icon: Car, label: '34 mi' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex-1 rounded-xl border border-foreground/20 p-3 flex flex-col items-center gap-1">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-mono">{label}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-foreground/20 h-24 flex items-end px-3 pb-2 gap-1">
            {[40, 65, 55, 80, 70, 90, 60, 75, 85, 50, 95, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-foreground/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="rounded-xl border border-foreground/20 p-3 flex items-center gap-3">
            <Zap className="h-5 w-5" />
            <div className="flex-1">
              <div className="h-2 w-20 bg-foreground/20 rounded" />
              <div className="h-3 w-32 bg-foreground/20 rounded mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Central content */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: 'var(--gate-visible-offset-top, 0px)',
          height: 'var(--gate-visible-height, 100dvh)',
        }}
      >
        <div className={cn("relative mx-auto flex h-full max-w-sm w-full flex-col items-center justify-center px-6 pointer-events-none", hexAwake ? 'gap-8' : 'gap-4')}>
          {/* Logo */}
          <img
            src={zenLogo}
            alt="ZenSolar"
            className={cn("h-8 w-auto object-contain transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}
            style={{ filter: 'drop-shadow(0 0 12px hsl(142 76% 36% / 0.45)) brightness(1.8)' }}
          />

          {/* $Z / Lock icon with burst effect */}
          <div className="relative pointer-events-auto" style={{ touchAction: 'manipulation', contain: 'layout style' }}>
            {/* Beckoning glow ring — GPU-composited opacity+transform only */}
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                boxShadow: '0 0 0 3px hsl(var(--primary) / 0.3), 0 0 24px 6px hsl(var(--primary) / 0.15), 0 0 50px 12px hsl(var(--primary) / 0.06)',
                animation: 'zenLockBeckon 3.5s ease-in-out infinite',
              }}
            />

            {/* Orbiting Tap-to-Mint™️ badge */}
            {!isBursting && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  animation: 'zenOrbit 8s linear infinite',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                }}
              >
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] font-bold tracking-wider bg-card/80 border border-primary/30 rounded-full px-2 py-0.5"
                  style={{
                    textShadow: '0 0 10px hsl(var(--primary) / 0.55)',
                  }}
                >
                  <span className="text-primary">Tap-to-Mint</span>
                  <span className="text-solar">™</span>
                </span>
              </div>
            )}

            <button
              ref={lockButtonRef}
              disabled={isVerifying || isBursting}
              className={cn(
                'relative w-20 h-20 rounded-full flex items-center justify-center touch-manipulation select-none overflow-visible cursor-pointer',
                isBursting
                  ? 'bg-primary/30'
                  : lockedFlash
                    ? 'bg-destructive/25'
                  : isDenied
                    ? 'bg-destructive/30 animate-shake'
                    : isVerifying
                      ? 'bg-primary/20 animate-pulse'
                      : firstTapBurst
                        ? 'bg-primary/30'
                        : 'bg-primary/20 hover:bg-primary/30',
              )}
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                backgroundColor: holdReady
                  ? 'hsla(142, 76%, 36%, 0.35)'
                  : undefined,
                boxShadow: holdReady
                  ? '0 0 48px hsla(142, 76%, 42%, 0.6), 0 0 16px hsla(142, 76%, 42%, 0.3)'
                  : lockedFlash
                    ? '0 0 44px hsl(var(--destructive) / 0.45), 0 0 16px hsl(var(--destructive) / 0.22)'
                  : isBursting || firstTapBurst
                    ? '0 0 40px hsl(var(--primary) / 0.5)'
                    : isDenied
                      ? '0 0 40px hsl(var(--destructive) / 0.5)'
                      : '0 0 24px hsl(var(--primary) / 0.3)',
                transform: holding
                  ? 'scale(0.92)'
                  : lockedFlash
                    ? 'scale(0.94)'
                  : firstTapBurst || isBursting
                    ? 'scale(0.92)'
                    : undefined,
                transition: holding
                  ? 'transform 80ms ease-out, background-color 120ms, box-shadow 120ms'
                  : lockedFlash
                    ? 'transform 70ms ease-out, background-color 120ms, box-shadow 120ms'
                  : firstTapBurst
                    ? 'transform 60ms, background-color 60ms, box-shadow 60ms'
                    : 'transform 200ms ease-out, background-color 200ms, box-shadow 200ms',
                animation: holding
                  ? 'none'
                  : firstTapBurst || isBursting
                    ? 'zenMintStampBurst 0.55s cubic-bezier(0.22, 1, 0.36, 1) both'
                    : (!isDenied && !isVerifying ? 'zenCircleBreathe 2.8s ease-in-out infinite' : 'none'),
              }}
              onTouchStartCapture={(e) => {
                if (nativeGestureReadyRef.current) return;
                e.preventDefault();
                handlePreboundGestureFallback();
              }}
              onPointerDownCapture={() => {
                handlePreboundGestureFallback();
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLockPointerDown('keyboard'); } }}
            >
              {isBursting ? (
                <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
              ) : lockedFlash ? (
                <Lock className="h-8 w-8 text-destructive" style={{ animation: 'zenSymbolFadeIn 160ms ease-out both' }} />
              ) : revealed ? (
                <Lock
                  className="h-8 w-8 text-primary"
                  style={{ animation: 'zenSymbolFadeIn 200ms ease-out both' }}
                />
              ) : (
                <span
                  className="select-none font-black"
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: holdReady
                      ? 'hsl(142, 76%, 56%)'
                      : holding
                        ? 'hsl(142, 76%, 52%)'
                        : 'hsla(142, 76%, 42%, 0.9)',
                    textShadow: holdReady
                      ? '0 0 20px hsla(142, 76%, 50%, 0.8), 0 0 40px hsla(142, 76%, 50%, 0.4)'
                      : holding
                        ? undefined
                        : '0 0 16px hsl(142 76% 42% / 0.55), 0 0 32px hsl(142 76% 42% / 0.25)',
                    willChange: 'transform, opacity, filter',
                    transition: 'color 120ms, text-shadow 120ms',
                    animation: firstTapBurst
                      ? 'zenSymbolFadeOut 200ms ease-out both'
                      : holding && !holdReady
                        ? `zenPlasmaCore ${HOLD_THRESHOLD_MS}ms ease-in forwards`
                        : 'none',
                  }}
                >
                  $Z
                </span>
              )}

              {/* First-tap burst particles (KPI-style impact) */}
              {firstTapBurst && !isBursting && particles.map((p, i) => (
                <div
                  key={`fp-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: p.size,
                    height: p.size,
                    background: `rgba(${p.isGold ? RGBA_GOLD : '255,255,255'}, ${p.alpha * 0.85})`,
                    boxShadow: `0 0 ${p.isGold ? 12 : 8}px rgba(${p.isGold ? RGBA_GOLD : RGBA}, 0.6)`,
                    clipPath: PARTICLE_SHAPE,
                    transform: `rotate(${p.rotation}deg)`,
                    animation: `zenFlareParticle 650ms ${p.delay}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}

              {/* First-tap ripple */}
              {firstTapBurst && !isBursting && (
                <div
                  key={`fr-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '280%',
                    height: '280%',
                    background: 'radial-gradient(circle, rgba(255,200,60,0.18) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
                    animation: 'zenTouchRipple 650ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {firstTapBurst && !isBursting && (
                <div
                  key={`fw-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '280%',
                    height: '280%',
                    border: '2px solid rgba(255,255,255,0.7)',
                    animation: 'zenPressureWave 550ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {firstTapBurst && !isBursting && [0, 1, 2].map((i) => (
                <div
                  key={`ffr-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 18,
                    height: 18,
                    marginLeft: -9,
                    marginTop: -9,
                    borderRadius: '50%',
                    border: `2px solid rgba(255,255,255, ${0.75 - i * 0.2})`,
                    animation: `zenFlareRing 650ms ${i * 80}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}

              {firstTapBurst && !isBursting && (
                <div
                  key={`fg-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 70,
                    height: 70,
                    marginLeft: -35,
                    marginTop: -35,
                    background: `radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(${RGBA}, 0.15) 40%, transparent 70%)`,
                    animation: 'zenEnergyRelease 550ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {lockedFlash && !isBursting && (
                <div
                  key={`lock-glow-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 70,
                    height: 70,
                    marginLeft: -35,
                    marginTop: -35,
                    background: 'radial-gradient(circle, hsl(var(--destructive) / 0.38) 0%, hsl(var(--destructive) / 0.14) 45%, transparent 72%)',
                    animation: 'zenEnergyRelease 420ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {lockedFlash && !isBursting && [0, 1].map((i) => (
                <div
                  key={`lock-ring-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 18,
                    height: 18,
                    marginLeft: -9,
                    marginTop: -9,
                    borderRadius: '50%',
                    border: `2px solid hsl(var(--destructive) / ${0.9 - i * 0.28})`,
                    animation: `zenFlareRing 460ms ${i * 70}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}

              {lockedFlash && !isBursting && (
                <div
                  key={`lock-wave-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '240%',
                    height: '240%',
                    border: '2px solid hsl(var(--destructive) / 0.7)',
                    animation: 'zenPressureWave 420ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {/* Success burst particles */}
              {isBursting && particles.map((p, i) => (
                <div
                  key={`p-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: p.size,
                    height: p.size,
                    background: `rgba(255,255,255, ${p.alpha})`,
                    boxShadow: `0 0 8px rgba(${RGBA}, 0.6)`,
                    clipPath: PARTICLE_SHAPE,
                    transform: `rotate(${p.rotation}deg)`,
                    animation: `zenFlareParticle 800ms ${p.delay}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Burst ripple */}
              {isBursting && (
                <div
                  key={`ripple-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '300%',
                    height: '300%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    animation: 'zenTouchRipple 800ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {isBursting && (
                <div
                  key={`wave-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '280%',
                    height: '280%',
                    border: '2px solid rgba(255,255,255,0.7)',
                    animation: 'zenPressureWave 550ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}

              {isBursting && [0, 1, 2].map((i) => (
                <div
                  key={`ring-${burstKey}-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 18,
                    height: 18,
                    marginLeft: -9,
                    marginTop: -9,
                    borderRadius: '50%',
                    border: `2px solid rgba(255,255,255, ${0.75 - i * 0.2})`,
                    animation: `zenFlareRing 650ms ${i * 80}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}

              {/* Burst glow */}
              {isBursting && (
                <div
                  key={`glow-${burstKey}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 100,
                    height: 100,
                    marginLeft: -50,
                    marginTop: -50,
                    background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(${RGBA}, 0.2) 40%, transparent 70%)`,
                    animation: 'zenEnergyRelease 700ms ease-out forwards',
                    willChange: 'transform, opacity',
                  }}
                />
              )}
            </button>

            {/* ── Charging rings & particles — positioned relative to the button container ── */}
            {holding && (
              <div className="absolute inset-0 pointer-events-none" style={{ animation: 'zenSymbolFadeIn 80ms ease-out both' }}>
                {/* Background resonance pulse — centered on button */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 300,
                    height: 300,
                    marginLeft: -150,
                    marginTop: -150,
                    background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 40%, transparent 70%)',
                    animation: `zenResonancePulse ${HOLD_THRESHOLD_MS * 1.2}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />

                {/* Dual charging rings SVG — centered on button */}
                <svg
                  width="120" height="120" viewBox="0 0 120 120"
                  className="absolute pointer-events-none"
                  style={{ left: '50%', top: '50%', marginTop: -60, marginLeft: -60 }}
                >
                  {/* Outer ring */}
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke={holdReady ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.35)'}
                    strokeWidth={holdReady ? 3.5 : 2.5}
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{
                      animation: holdReady
                        ? 'zenHoldReadyFlash 400ms ease-in-out 2'
                        : `zenHoldRingFill ${HOLD_THRESHOLD_MS}ms linear forwards`,
                      transformOrigin: 'center',
                      transform: 'rotate(-90deg)',
                      filter: holdReady ? 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))' : 'none',
                      transition: 'stroke-width 150ms, filter 150ms',
                    }}
                  />
                  {/* Inner ring */}
                  <circle
                    cx="60" cy="60" r="44"
                    fill="none"
                    stroke={holdReady ? 'hsl(var(--primary) / 0.8)' : 'hsl(var(--primary) / 0.2)'}
                    strokeWidth="1.5"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{
                      animation: holdReady
                        ? 'zenHoldReadyFlash 400ms ease-in-out 2'
                        : `zenHoldRingFill ${HOLD_THRESHOLD_MS * 0.7}ms ease-in forwards`,
                      transformOrigin: 'center',
                      transform: 'rotate(90deg)',
                      filter: holdReady ? 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))' : 'none',
                    }}
                  />
                  {/* Decorative rotating glow arc */}
                  <circle
                    cx="60" cy="60" r="48"
                    fill="none"
                    stroke="hsl(var(--primary) / 0.15)"
                    strokeWidth="1"
                    strokeDasharray="20 60"
                    strokeLinecap="round"
                    style={{
                      animation: `zenRingGlowSpin ${HOLD_THRESHOLD_MS * 2}ms linear infinite`,
                      transformOrigin: 'center',
                    }}
                  />
                </svg>

                {/* Attraction particles — spiral inward toward center */}
                {attractParticles.map((p, i) => (
                  <div
                    key={`attract-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: p.size,
                      height: p.size,
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      background: p.isGold
                        ? 'radial-gradient(circle, rgba(255,200,80,0.9) 0%, rgba(255,160,40,0.4) 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, hsl(var(--primary) / 0.4) 100%)',
                      boxShadow: p.isGold
                        ? '0 0 6px rgba(255,180,60,0.6)'
                        : '0 0 4px hsl(var(--primary) / 0.5)',
                      animation: `zenParticleAttract ${HOLD_THRESHOLD_MS * 0.9}ms ${p.delay}ms ease-in forwards`,
                      willChange: 'transform, opacity',
                      '--attract-x': `${p.x}px`,
                      '--attract-y': `${p.y}px`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hold hint — shown after premature release */}
          {holdHint && !hexAwake && (
            <div
              className="text-center pointer-events-none"
              style={{ animation: 'zenSymbolFadeIn 300ms ease-out both' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide rounded-full px-3 py-1"
                style={{
                  color: 'hsl(var(--primary))',
                  background: 'hsl(var(--primary) / 0.1)',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                  textShadow: '0 0 8px hsl(var(--primary) / 0.4)',
                }}
              >
                almost… hold a bit longer ✨
              </span>
            </div>
          )}

          {/* Title */}
          <div className={cn("text-center space-y-1 transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
            <h1 className="text-lg font-semibold text-foreground drop-shadow-[0_0_6px_hsl(var(--primary)/0.2)]">Private Demo</h1>
            <p className="text-sm text-foreground/70">Enter your access code to continue</p>
          </div>

          {/* Code input — hidden until first tap */}
          <div className={cn("w-full px-4 space-y-3 pointer-events-auto transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Access code"
              disabled={isVerifying || isBursting}
              className={cn(
                'text-center font-mono tracking-wider h-12 transition-all text-[16px]',
                isBursting && 'border-primary bg-primary/5',
                isDenied && 'border-destructive bg-destructive/5 animate-shake'
              )}
              autoComplete="off"
              autoCapitalize="off"
            />

            {/* Unlock / tap hint */}
            <div className="flex justify-center h-8">
              {showUnlockHint ? (
                <span
                  className="text-xs font-semibold text-primary flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30"
                  style={{ animation: 'zenSymbolFadeIn 300ms ease-out both' }}
                >
                  <Lock className="h-3 w-3" />
                  {showTapAgain ? 'double tap grants access' : hexAwake ? 'single tap sparks • double tap grants access' : 'press & hold $Z'}
                </span>
              ) : (
                <span className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {showTapAgain ? 'double tap grants access' : hexAwake ? 'single tap sparks • double tap grants access' : 'press & hold $Z'}
                </span>
              )}
            </div>
          </div>

          {/* Pre-tap hint — visible only before first tap, hidden after */}
          {!hexAwake && !holdHint && (
            <div className="flex justify-center">
              <span className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                press &amp; hold the $Z
              </span>
            </div>
          )}

          {/* Fine print */}
          <p className={cn("text-[10px] text-muted-foreground/70 text-center pointer-events-auto transition-opacity duration-1000", hexAwake ? 'opacity-100' : 'opacity-0')}>
            Request access at{' '}
            <a href="mailto:joe@zen.solar" className="underline hover:text-muted-foreground">
              joe@zen.solar
            </a>
          </p>
        </div>
      </div>

      {/* NDA Signature Overlay */}
      {showNda && (
        <div
          className="absolute inset-0 z-[110] bg-background/95 backdrop-blur-sm"
          style={{
            animation: 'zenSymbolFadeIn 400ms ease-out both',
          }}
        >
          <NdaSignatureStep
            accessCodeUsed={verifiedCode}
            onSigned={handleNdaSigned}
          />
        </div>
      )}
    </div>
  );
}
