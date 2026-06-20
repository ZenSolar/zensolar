/**
 * Mint Loudness — calm-by-default UX rule for the Tesla Charging Experience v2.
 *
 * See mem://features/minting-loudness-levels.md for full spec.
 *
 *   L1 Silent  (default)  — no banner, no toast, no celebration.
 *                           KPIs animate value changes only.
 *   L2 Light             — thin top banner, 8s auto-dismiss, no sound.
 *                           First-ever Supercharger session, first-ever home
 *                           session, paused/resumed, classifier error.
 *   L3 Delight           — scale-in only (no confetti, no audio). First-ever
 *                           mint, 1k kWh lifetime, 10k $ZSOLAR lifetime.
 *
 * This is a pure function — easy to unit-test without React.
 */

export type LoudnessLevel = 'L1' | 'L2' | 'L3';

export type LoudnessEvent =
  | { kind: 'session_started'; source: 'home' | 'wallbox' | 'supercharger' | 'third_party_dc'; isFirstEver: boolean }
  | { kind: 'session_paused' }
  | { kind: 'session_resumed' }
  | { kind: 'session_error' }
  | { kind: 'mint_milestone'; milestone: 'first_mint' | 'kwh_1k' | 'tokens_10k' };

export function classifyLoudness(event: LoudnessEvent): LoudnessLevel {
  switch (event.kind) {
    case 'session_started':
      return event.isFirstEver ? 'L2' : 'L1';
    case 'session_paused':
    case 'session_resumed':
    case 'session_error':
      return 'L2';
    case 'mint_milestone':
      return 'L3';
    default:
      return 'L1';
  }
}

/**
 * React hook variant. Stateless wrapper — components pass an event and get a
 * level. Kept as a hook so future versions can read protocol settings.
 */
export function useMintLoudness() {
  return { classifyLoudness };
}
