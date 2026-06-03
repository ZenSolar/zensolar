import { describe, it, expect } from "vitest";
import { decideSimulatorAccess } from "@/lib/simulatorGate";

/**
 * Locks in the /simulator route contract:
 *   - loading state never leaks (no premature redirect)
 *   - signed-out users go to /auth (PIN gate cannot run without a user)
 *   - signed-in non-founders bounce to /
 *   - founders / admins are allowed through to the PIN gate
 */
describe("decideSimulatorAccess — /simulator gate", () => {
  it("returns 'loading' while auth is still resolving", () => {
    expect(
      decideSimulatorAccess({
        authLoading: true,
        roleReady: false,
        hasUser: false,
        isFounder: false,
      }),
    ).toBe("loading");
  });

  it("returns 'loading' while role lookup is still pending (auth done, role not yet)", () => {
    expect(
      decideSimulatorAccess({
        authLoading: false,
        roleReady: false,
        hasUser: true,
        isFounder: false,
      }),
    ).toBe("loading");
  });

  it("returns 'needs-auth' for a signed-out visitor (will redirect to /auth?redirect=…)", () => {
    expect(
      decideSimulatorAccess({
        authLoading: false,
        roleReady: true,
        hasUser: false,
        isFounder: false,
      }),
    ).toBe("needs-auth");
  });

  it("returns 'forbidden' for a signed-in non-founder", () => {
    expect(
      decideSimulatorAccess({
        authLoading: false,
        roleReady: true,
        hasUser: true,
        isFounder: false,
      }),
    ).toBe("forbidden");
  });

  it("returns 'allowed' for a signed-in founder (PIN gate then simulator)", () => {
    expect(
      decideSimulatorAccess({
        authLoading: false,
        roleReady: true,
        hasUser: true,
        isFounder: true,
      }),
    ).toBe("allowed");
  });
});
