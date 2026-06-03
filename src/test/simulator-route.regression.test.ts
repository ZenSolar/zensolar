import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lock down the route table:
 *   - /simulator and /founders/simulator MUST resolve directly to <FoundersSimulator />.
 *   - Wrapping them in <FounderRoute> caused production redirects to /auth that
 *     dropped the `?redirect=` param, leaving users stranded on `/` post-login.
 *   - The page already runs its own auth + role + PIN gate; the wrapper is forbidden.
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
 * The simulator page must construct the auth redirect with a `?redirect=` query
 * param so Auth can bounce the user back to /simulator after login (instead of /).
 */
describe("FoundersSimulator.tsx — auth redirect contract", () => {
  const src = readFileSync(
    resolve(__dirname, "../pages/FoundersSimulator.tsx"),
    "utf8",
  );

  it("uses decideSimulatorAccess (shared gate logic)", () => {
    expect(src).toContain(`from "@/lib/simulatorGate"`);
    expect(src).toContain("decideSimulatorAccess");
  });

  it("redirects unauthenticated visitors to /auth WITH a redirect= param", () => {
    expect(src).toMatch(/\/auth\?redirect=\$\{encodeURIComponent\(path\)\}/);
  });

  it("wraps the live simulator content in <VaultPinGate>", () => {
    expect(src).toMatch(/<VaultPinGate userId=\{user\.id\}>/);
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
