/**
 * Pure decision function for the /simulator route gate.
 *
 * Flow contract (must not regress):
 *   1. /simulator is public at the route level — never redirect to /auth.
 *   2. The founder PIN itself is the credential.
 *   3. After a valid founder/admin PIN, render the simulator in place.
 */
export type SimulatorGateInput = {
  pinUnlocked: boolean;
};

export type SimulatorGateDecision = "needs-pin" | "allowed";

export function decideSimulatorAccess(input: SimulatorGateInput): SimulatorGateDecision {
  return input.pinUnlocked ? "allowed" : "needs-pin";
}
