import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lock down the route table:
 *   - /simulator and /founders/simulator MUST resolve directly to <FoundersSimulator />.
 *   - Wrapping them in <FounderRoute> or auth redirects is forbidden.
 *   - The page must show a founder PIN gate immediately, then render the simulator.
 */
describe("App.tsx — /simulator route configuration (regression)", () => {
  const src = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");

  it("/simulator route is NOT wrapped in <FounderRoute>", () => {
    expect(src).toContain(
      `<Route path="/simulator" element={<FoundersSimulator />} />`,
    );
    expect(src).not.toMatch(
      /<Route path="\/simulator" element={<FounderRoute>/,
    );
  });

  it("/founders/simulator route is NOT wrapped in <FounderRoute>", () => {
    expect(src).toContain(
      `<Route path="/founders/simulator" element={<FoundersSimulator />} />`,
    );
    expect(src).not.toMatch(
      /<Route path="\/founders\/simulator" element={<FounderRoute>/,
    );
  });
});

/**
 * The simulator page must never construct an auth redirect. The public founder
 * PIN is the route-level gate for this page.
 */
describe("FoundersSimulator.tsx — auth redirect contract", () => {
  const src = readFileSync(
    resolve(__dirname, "../pages/FoundersSimulator.tsx"),
    "utf8",
  );

  it("does not import auth/role gate code", () => {
    expect(src).not.toContain(`from "@/hooks/useAuth"`);
    expect(src).not.toContain(`from "@/lib/simulatorGate"`);
    expect(src).not.toContain("VaultPinGate");
  });

  it("does not redirect simulator visitors to /auth", () => {
    expect(src).not.toContain("/auth");
    expect(src).not.toContain("<Navigate");
  });

  it("shows the public founder PIN gate before simulator content", () => {
    expect(src).toContain("function PublicSimulatorPinGate");
    expect(src).toContain("Enter Founder PIN");
    expect(src).toContain("deck-pin-verify");
  });
});

/**
 * Auth.tsx must honor the `redirect` query param via the sanitizer.
 */
describe("Auth.tsx — post-login redirect contract", () => {
  const src = readFileSync(resolve(__dirname, "../pages/Auth.tsx"), "utf8");

  it("reads the `redirect` query param", () => {
    expect(src).toMatch(/searchParams\.get\(['"]redirect['"]\)/);
  });

  it("routes the value through safeRedirectPath (no raw navigate)", () => {
    expect(src).toContain("safeRedirectPath");
  });

  it("does not drop simulator redirects after email/password login", () => {
    expect(src).not.toContain("navigate('/');");
    expect(src).toMatch(
      /navigate\(safeRedirectPath\(searchParams\.get\(['"]redirect['"]\), ['"]\/['"]\), \{ replace: true \}\)/,
    );
  });

  it("preserves simulator redirects through social login", () => {
    expect(src).toContain("const redirectTo = safeRedirectPath(searchParams.get('redirect'), '/');");
    expect(src).toContain("redirect_uri: `${window.location.origin}${redirectTo}`");
  });
});
