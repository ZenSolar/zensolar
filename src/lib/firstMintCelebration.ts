/**
 * First-mint celebration tracker.
 *
 * The full ProtocolCinematicSequence (Variant D, ~10s) plays exactly once
 * per browser/profile on the user's first successful mint. Every subsequent
 * mint plays the embedded MicroProtocolBadge (Variant C, ~6.5s) inside the
 * existing success dialog.
 *
 * Storage is local-only on purpose — this is a UX delight, not a permission
 * gate. If a user clears storage they get the cinematic again, which is fine.
 */

const KEY = 'zen:firstMintCelebrationShown:v1';

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

/** Test-only utility — not used in app code. */
export function resetFirstMintCelebration(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
