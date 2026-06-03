import { describe, it, expect } from "vitest";
import { decideSimulatorAccess } from "@/lib/simulatorGate";

/**
 * Locks in the /simulator route contract:
 *   - signed-out visitors see the PIN gate directly
 *   - successful founder/admin PIN unlock renders the simulator
 *   - /simulator never redirects to /auth
 */
describe("decideSimulatorAccess — /simulator gate", () => {
  it("returns 'needs-pin' before the founder PIN is unlocked", () => {
    expect(decideSimulatorAccess({ pinUnlocked: false })).toBe("needs-pin");
  });

  it("returns 'allowed' after the founder PIN is unlocked", () => {
    expect(decideSimulatorAccess({ pinUnlocked: true })).toBe("allowed");
  });
});
