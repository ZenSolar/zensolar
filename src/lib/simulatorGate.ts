/**
 * Pure decision function for the /simulator route gate.
 *
 * Flow contract (must not regress):
 *   1. While auth/role lookups are pending → "loading"  (show splash, no redirect)
 *   2. No authenticated user                → "needs-auth"   (send to /auth?redirect=…)
 *   3. Authenticated but not founder/admin  → "forbidden"    (send to /)
 *   4. Founder or admin                     → "allowed"      (render PIN gate, then simulator)
 */
export type SimulatorGateInput = {
  authLoading: boolean;
  roleReady: boolean;
  hasUser: boolean;
  isFounder: boolean;
};

export type SimulatorGateDecision = "loading" | "needs-auth" | "forbidden" | "allowed";

export function decideSimulatorAccess(input: SimulatorGateInput): SimulatorGateDecision {
  if (input.authLoading || !input.roleReady) return "loading";
  if (!input.hasUser) return "needs-auth";
  if (!input.isFounder) return "forbidden";
  return "allowed";
}
