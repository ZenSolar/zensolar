/**
 * Invariant tests: Supercharger and Home charging must NEVER be merged.
 *
 * Surfaces guarded:
 *  1. supabase/functions/mint-onchain/index.ts — recon log writes must emit
 *     separate `supercharger` and `home_charging` categories (no combined
 *     `charging` recon row). Contract ABI sum is the only allowed merge.
 *  2. src/pages/AdminKpiReconciliation.tsx — CATEGORY_LABEL exposes
 *     `supercharger` and `home_charging` as distinct rows.
 *  3. src/components/dashboard/ActivityMetrics.tsx — Clean Energy Center
 *     exposes `supercharger` and `home_charger` as distinct KPI tiles /
 *     MintCategory values.
 *  4. src/components/dashboard/ChargingDriftBreakdownCard.tsx — dashboard
 *     drift card queries both categories independently.
 *
 * These are static-source assertions: cheap, deterministic, and they fail
 * loudly the moment anyone collapses the two providers back into one bucket.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("charging split invariants — mint-onchain edge function", () => {
  const src = read("supabase/functions/mint-onchain/index.ts");

  it("tracks supercharger and home charging as separate kWh deltas", () => {
    expect(src).toMatch(/superchargerDeltaKwh/);
    expect(src).toMatch(/homeChargingDeltaKwh/);
  });

  it("emits per-mint recon rows for both providers", () => {
    expect(src).toMatch(/cat:\s*['"]supercharger['"]/);
    expect(src).toMatch(/cat:\s*['"]home_charging['"]/);
  });

  it("never writes a combined 'charging' recon row to mint_reconciliation_log", () => {
    // The per-category loop array must not include a combined charging entry.
    expect(src).not.toMatch(/cat:\s*['"]charging['"]/);
  });

  it("only sums supercharger + home charging at the contract ABI boundary", () => {
    // Exactly one place may add the two together — the on-chain call site.
    const merges = src.match(/superchargerDeltaKwh\s*\+\s*homeChargingDeltaKwh/g) ?? [];
    expect(merges.length).toBeGreaterThan(0);
    expect(merges.length).toBeLessThanOrEqual(2); // contract call + headline-denominator
  });

  it("exposes on_chain_delta_split with both providers in source_breakdown", () => {
    expect(src).toMatch(/on_chain_delta_split/);
    expect(src).toMatch(/supercharger:\s*superchargerOnChain/);
    expect(src).toMatch(/home_charging:\s*homeChargingOnChain/);
  });
});

describe("charging split invariants — /admin/kpi-reconciliation", () => {
  const src = read("src/pages/AdminKpiReconciliation.tsx");

  it("labels supercharger and home_charging as separate categories", () => {
    expect(src).toMatch(/supercharger:\s*["']Supercharger kWh["']/);
    expect(src).toMatch(/home_charging:\s*["']Home charging kWh["']/);
  });

  it("does not relabel 'charging' as a first-class active category", () => {
    // Legacy combined bucket may exist for historical rows but MUST be marked
    // pre-split / legacy so it can never masquerade as a current provider.
    const chargingLabel = src.match(/(?<![_a-zA-Z])charging:\s*["']([^"']+)["']/)?.[1] ?? "";
    if (chargingLabel) {
      expect(chargingLabel.toLowerCase()).toMatch(/legacy|pre-split|combined/);
    }
  });
});

describe("charging split invariants — Clean Energy Center dashboard", () => {
  const activity = read("src/components/dashboard/ActivityMetrics.tsx");

  it("exposes supercharger and home_charger as distinct MintCategory values", () => {
    expect(activity).toMatch(/MintCategory\s*=[^;]*['"]supercharger['"]/);
    expect(activity).toMatch(/MintCategory\s*=[^;]*['"]home_charger['"]/);
  });

  it("renders separate KPI tiles for Supercharger and Home charging", () => {
    expect(activity).toMatch(/isHidden\(['"]supercharger['"]\)/);
    expect(activity).toMatch(/isHidden\(['"]home_charger['"]\)/);
    expect(activity).toMatch(/category:\s*['"]supercharger['"]/);
    expect(activity).toMatch(/category:\s*['"]home_charger['"]/);
  });

  it("tracks superchargerKwh independently of chargingKwh in activity data", () => {
    expect(activity).toMatch(/superchargerKwh\??:\s*number/);
    // chargingKwh stays only as the legacy combined fallback path.
    expect(activity).toMatch(/chargingKwh:\s*number/);
  });
});

describe("charging split invariants — dashboard drift card", () => {
  const card = read("src/components/dashboard/ChargingDriftBreakdownCard.tsx");

  it("queries mint_reconciliation_log for both categories independently", () => {
    expect(card).toMatch(/mint_reconciliation_log/);
    expect(card).toMatch(/\.in\(\s*["']category["']\s*,\s*\[\s*["']supercharger["']\s*,\s*["']home_charging["']\s*\]/);
  });

  it("does not sum supercharger + home charging into a single bucket", () => {
    expect(card).not.toMatch(/supercharger.*\+.*home_charging/);
    expect(card).not.toMatch(/home_charging.*\+.*supercharger/);
  });
});
