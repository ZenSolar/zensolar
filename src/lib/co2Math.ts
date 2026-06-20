/**
 * Per-source CO₂ avoidance math for Proof-of-Genesis receipts.
 *
 * Every source displaces a different counterfactual, so we cannot apply
 * one flat grid-average factor across the board. The receipt sums the
 * contribution of each source independently.
 *
 *   Solar production    → grid kWh you would have pulled instead
 *                         = kWh × 0.709 kg/kWh (U.S. EIA avg)
 *
 *   Battery export      → grid kWh that did not have to be dispatched
 *                         = kWh × 0.709 kg/kWh (conservative; uses grid
 *                           avg rather than peaker marginal — easier to
 *                           defend, undersells real impact)
 *
 *   Home charging       → gasoline miles the EV would otherwise have
 *                         needed; convert kWh → mi at 3.5 mi/kWh
 *                         efficiency, then × 0.364 kg/mi
 *
 *   Tesla Supercharging → already 100% renewable-matched via Tesla's
 *                         retired RECs, so we DO NOT double-count the
 *                         grid offset. We DO credit the ICE miles the
 *                         driver did not burn gasoline on — same kWh→mi
 *                         conversion as home charging.
 *
 *   EV miles            → straight ICE-equivalent at 24.4 mpg
 *                         = miles × 0.364 kg/mi
 *
 * Tweaking these factors? Update CO2_FACTORS below, then re-run
 * `bun test src/lib/__tests__/co2Math.test.ts` if/when that file is added.
 */

export const GRID_KG_PER_KWH = 0.709;       // U.S. EIA avg
export const CO2_KG_PER_EV_MILE = 0.364;    // EV displacing 24.4-mpg ICE
export const EV_MI_PER_KWH = 3.5;           // typical real-world efficiency

/**
 * kg CO₂ avoided per unit of each `source_breakdown` key.
 *   *_kwh keys are kg per kWh
 *   ev_miles is kg per mile
 */
export const CO2_FACTORS: Record<string, number> = {
  solar_kwh:         GRID_KG_PER_KWH,
  battery_kwh:       GRID_KG_PER_KWH,
  home_charging_kwh: EV_MI_PER_KWH * CO2_KG_PER_EV_MILE,   // ≈1.274 kg/kWh
  supercharging_kwh: EV_MI_PER_KWH * CO2_KG_PER_EV_MILE,   // ICE miles avoided only (REC-matched)
  ev_kwh:            EV_MI_PER_KWH * CO2_KG_PER_EV_MILE,
  ev_miles:          CO2_KG_PER_EV_MILE,
};

export type Co2Stats = {
  tokens: number;
  kwh: number;            // sum of all *_kwh keys (display only)
  miles: number;          // miles_delta passthrough
  co2Kg: number;          // per-source weighted sum
  breakdown: Array<{ key: string; amount: number; kg: number }>;
};

/**
 * Compute total CO₂ avoided from a receipt's source_breakdown.
 * Falls back to the legacy single-multiply when no breakdown exists.
 */
export function computeCo2(input: {
  tokens_minted?: number | string | null;
  kwh_delta?: number | string | null;
  miles_delta?: number | string | null;
  source_breakdown?: Record<string, number> | null;
}): Co2Stats {
  const tokens = Number(input.tokens_minted ?? 0);
  const milesRaw = Number(input.miles_delta ?? 0);
  const kwhExplicit = Number(input.kwh_delta ?? 0);
  const sb = input.source_breakdown ?? null;

  // ----- Per-source sum (preferred) -----
  if (sb && Object.keys(sb).length > 0) {
    const breakdown: Co2Stats['breakdown'] = [];
    let co2Kg = 0;
    let kwhSum = 0;
    for (const [key, raw] of Object.entries(sb)) {
      const amt = Number(raw);
      if (!amt || amt <= 0) continue;
      const factor = CO2_FACTORS[key] ?? 0;
      const kg = amt * factor;
      co2Kg += kg;
      if (key.endsWith('_kwh')) kwhSum += amt;
      breakdown.push({ key, amount: amt, kg });
    }
    return {
      tokens,
      kwh: kwhSum || kwhExplicit,
      miles: milesRaw,
      co2Kg,
      breakdown,
    };
  }

  // ----- Legacy fallback (no breakdown stored) -----
  // Treat as Tesla Supercharging-only per the unified-receipt spec, so
  // credit ICE miles avoided rather than a grid offset.
  const kwh = kwhExplicit > 0
    ? kwhExplicit
    : (milesRaw === 0 && tokens > 0 ? tokens : 0);
  const co2Kg = milesRaw > 0
    ? milesRaw * CO2_KG_PER_EV_MILE
    : kwh * (CO2_FACTORS.supercharging_kwh ?? GRID_KG_PER_KWH);

  return { tokens, kwh, miles: milesRaw, co2Kg, breakdown: [] };
}

/**
 * Tesla Supercharger receipt helper — returns the two CO₂ numbers the
 * Proof-of-Genesis receipt displays side-by-side.
 *
 *   tesla_rec_kg          → 0 (Tesla retires RECs covering 100% of Supercharger
 *                              electricity, so the grid offset is already claimed)
 *   grid_avg_kg           → what the same kWh would have emitted on the local
 *                              grid — used purely as a "vs grid" comparator.
 *   ice_miles_avoided_kg  → ICE-equivalent miles the driver did not burn; the
 *                              number we DO credit on the receipt.
 */
export function teslaRecCo2(kwh: number): {
  tesla_rec_kg: number;
  grid_avg_kg: number;
  ice_miles_avoided_kg: number;
} {
  const k = Number(kwh);
  const safe = Number.isFinite(k) && k > 0 ? k : 0;
  return {
    tesla_rec_kg: 0,
    grid_avg_kg: safe * GRID_KG_PER_KWH,
    ice_miles_avoided_kg: safe * EV_MI_PER_KWH * CO2_KG_PER_EV_MILE,
  };
}

