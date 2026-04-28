/**
 * First-mint celebration tracker.
 *
 * The full ProtocolCinematicSequence (Variant D, ~11s) plays exactly once
 * per browser/profile on the user's first successful mint. Every subsequent
 * mint plays the embedded MicroProtocolBadge (Variant C, ~6.5s) inside the
 * transmit dialog.
 *
 * Storage is local-only on purpose — this is a UX delight, not a permission
 * gate. If a user clears storage they get the cinematic again, which is fine.
 */

const KEY = 'zen:firstMintCelebrationShown:v1';
const DEMO_SESSION_KEY = 'zen:demoCinematicDShown:session';

export function hasShownFirstMintCelebration(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markFirstMintCelebrationShown(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore — storage may be blocked */
  }
}

/** Reset both the live and demo flags so Cinematic D will play again. */
export function resetFirstMintCelebration(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem(DEMO_SESSION_KEY); } catch { /* ignore */ }
}

// Expose globally so it can be triggered from the browser console or a
// PWA without dev tools (e.g. Ferriter's demo). Safe — it only resets a
// local UX flag.
if (typeof window !== 'undefined') {
  (window as any).zenReplayCinematic = () => {
    resetFirstMintCelebration();
    // eslint-disable-next-line no-console
    console.log('%c✓ Cinematic D will play on your next mint.', 'color:#10b981;font-weight:bold');
  };
}
