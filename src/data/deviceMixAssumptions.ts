/**
 * Device Mix Assumptions for Financial Modeling
 * 
 * These assumptions drive mint rate projections, circulating supply models,
 * and LP coverage calculations across tokenomics tools.
 * 
 * Conservative estimates — designed for investor credibility.
 * Updated: Feb 2026
 */

export interface DeviceSegment {
  id: string;
  label: string;
  description: string;
  percentage: number;
  monthlyTokensRaw: number;
  breakdown: string;
}

export const DEVICE_MIX: DeviceSegment[] = [
  {
    id: "solar-only",
    label: "Solar Only",
    description: "Residential solar (avg 7kW system)",
    percentage: 55,
    monthlyTokensRaw: 900,
    breakdown: "~900 kWh/mo production",
  },
  {
    id: "solar-ev",
    label: "Solar + EV",
    description: "Solar producer with electric vehicle",
    percentage: 25,
    monthlyTokensRaw: 1800,
    breakdown: "~900 kWh solar + ~900 miles EV",
  },
  {
    id: "solar-battery",
    label: "Solar + Battery",
    description: "Solar with home battery storage",
    percentage: 12,
    monthlyTokensRaw: 1100,
    breakdown: "~900 kWh solar + ~200 kWh battery cycling",
  },
  {
    id: "all-three",
    label: "Solar + Battery + EV",
    description: "Full clean energy stack",
    percentage: 8,
    monthlyTokensRaw: 2000,
    breakdown: "~900 kWh + ~200 battery + ~900 EV miles",
  },
];

/** Weighted average raw tokens minted per user per month */
export const WEIGHTED_AVG_RAW_TOKENS = DEVICE_MIX.reduce(
  (sum, seg) => sum + (seg.percentage / 100) * seg.monthlyTokensRaw,
  0
);

/** After 20% mint burn + 5% transfer tax → ~75% net to user */
export const NET_MULTIPLIER = 0.75;

/** Weighted average NET tokens received per user per month */
export const WEIGHTED_AVG_NET_TOKENS = Math.round(WEIGHTED_AVG_RAW_TOKENS * NET_MULTIPLIER);
