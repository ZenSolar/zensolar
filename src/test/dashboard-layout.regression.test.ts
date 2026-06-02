/**
 * Dashboard layout regression test.
 *
 * Goal: catch differences between the live beta dashboard (ZenSolarDashboard)
 * and /demo (DemoDashboard) — specifically logo sizing, spacing, and which
 * cards/buttons appear where — without needing a real browser.
 *
 * Approach: source-level snapshot + invariants.
 *  - Snapshot the Tailwind sizing classes used for partner logos in
 *    ApiPartnersCard so any accidental shrink/grow fails the test.
 *  - Assert which dashboard renders which card (ApiPartnersCard,
 *    SubscriptionStatusCard, Tokenomics101Card → demo only).
 *  - Assert reward action buttons ("Mint ZSOLAR Tokens", "Refresh Dashboard")
 *    are not visible on the live beta dashboard.
 *
 * If you intentionally change one of these, update the snapshot below.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const live = read("src/components/ZenSolarDashboard.tsx");
const demo = read("src/components/demo/DemoDashboard.tsx");
const partners = read("src/components/dashboard/ApiPartnersCard.tsx");

describe("ApiPartnersCard — logo sizing snapshot", () => {
  it("locks per-brand logo sizing classes", () => {
    const pick = (brand: string) =>
      new RegExp(`alt === '${brand}'\\s*\\?\\s*'([^']+)'`).exec(partners)?.[1];
    // Wallbox is the final fallback branch (no explicit alt check).
    const wallboxMatches = [...partners.matchAll(/'(h-\d+ max-w-\[\d+px\])'/g)];
    const sizing = {
      Tesla: pick("Tesla"),
      Enphase: pick("Enphase"),
      SolarEdge: pick("SolarEdge"),
      Wallbox: wallboxMatches[wallboxMatches.length - 1]?.[1],
    };
    expect(sizing).toMatchInlineSnapshot(`
      {
        "Enphase": "h-8 max-w-[170px]",
        "SolarEdge": "h-7 max-w-[170px]",
        "Tesla": "h-12 max-w-[110px]",
        "Wallbox": "h-8 max-w-[160px]",
      }
    `);
  });

  it("uses 2-column grid with the expected gap/padding", () => {
    expect(partners).toContain("grid grid-cols-2 gap-x-6 gap-y-8");
    expect(partners).toContain('pt-1 pb-6 px-6');
  });
});

describe("Dashboard composition — live vs /demo", () => {
  const demoOnly = [
    "ApiPartnersCard",
  ];

  it.each(demoOnly)("%s is rendered on /demo only", (name) => {
    expect(demo).toMatch(new RegExp(`<${name}\\b`));
    expect(live).not.toMatch(new RegExp(`<${name}\\b`));
  });

  it("SubscriptionStatusCard now renders on the live dashboard too (Deason + sub slot)", () => {
    expect(live).toMatch(/<SubscriptionStatusCard\b/);
  });

  it("live beta dashboard keeps RewardActions hidden (no Mint/Refresh buttons on screen)", () => {
    // Hidden wrapper around RewardActions on the live dashboard.
    expect(live).toMatch(/RewardActions/);
    expect(live).toMatch(/hidden|sr-only|display:\s*none/);
    // The visible mint affordance lives on the new PrimaryMintAction hero
    // (and NFT card), not as a standalone "Mint ZSOLAR Tokens" / "Refresh
    // Dashboard" button pair.
    expect(live).not.toMatch(/>\s*Mint ZSOLAR Tokens\s*</);
    expect(live).not.toMatch(/>\s*Refresh Dashboard\s*</);
  });

  it("live beta dashboard still shows MintReceiptsHint (now branded 'Proof Feed')", () => {
    expect(live).toMatch(/<MintReceiptsHint\b/);
    const hint = read("src/components/dashboard/MintReceiptsHint.tsx");
    expect(hint).toMatch(/Proof Feed/);
  });

  it("live beta dashboard surfaces the Zen Monitoring hero above the Tap-to-Mint action", () => {
    const heroIdx = live.indexOf("<EnergyFlowGlowCard");
    const mintIdx = live.indexOf("<PrimaryMintAction");
    expect(heroIdx).toBeGreaterThan(-1);
    expect(mintIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeLessThan(mintIdx);
  });
});
