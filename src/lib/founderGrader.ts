/**
 * Founder Tokenomics & Launch Simulator — Scenario Grader.
 *
 * Pure, client-side scoring. Takes the current `SimulatorConfig` + `SimulatorResult`
 * (plus the engine's baseline run with secondary revenue disabled, used for
 * comparison KPIs) and returns a transparent A–F grade with per-category
 * subscores so the founders can see exactly *why* a scenario got its grade.
 *
 * Categories & weights (total 100):
 *  - Flywheel Strength         30
 *  - Sell Pressure Management  25
 *  - Long-term Token Health    20
 *  - Capital Efficiency        15
 *  - Risk & Realism            10
 */

import type { SimulatorConfig, SimulatorResult } from "@/lib/founderSimulator";
import { MAX_SUPPLY } from "@/lib/tokenomics";

export type LetterGrade = "A" | "B" | "C" | "D" | "F";

export interface CategoryScore {
  key: string;
  label: string;
  weight: number;        // 0..100
  score: number;         // 0..100
  weighted: number;      // score * weight / 100
  rationale: string;
}

export interface ScenarioGrade {
  letter: LetterGrade;
  total: number;         // 0..100
  summary: string;
  categories: CategoryScore[];
}

export const GRADER_WEIGHTS = {
  flywheel: 30,
  sellPressure: 25,
  tokenHealth: 20,
  capitalEfficiency: 15,
  riskRealism: 10,
} as const;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function toLetter(total: number): LetterGrade {
  if (total >= 90) return "A";
  if (total >= 80) return "B";
  if (total >= 70) return "C";
  if (total >= 60) return "D";
  return "F";
}

export function letterColor(letter: LetterGrade): {
  text: string;
  bg: string;
  border: string;
} {
  switch (letter) {
    case "A": return { text: "text-emerald-400", bg: "from-emerald-500/30 to-emerald-500/5", border: "border-emerald-400/50" };
    case "B": return { text: "text-primary",     bg: "from-primary/30 to-primary/5",         border: "border-primary/50" };
    case "C": return { text: "text-amber-300",   bg: "from-amber-400/30 to-amber-400/5",     border: "border-amber-400/50" };
    case "D": return { text: "text-orange-400",  bg: "from-orange-500/30 to-orange-500/5",   border: "border-orange-500/50" };
    case "F": return { text: "text-destructive", bg: "from-destructive/30 to-destructive/5", border: "border-destructive/50" };
  }
}

/**
 * Compute the scenario grade.
 *
 * Heuristics — kept transparent on purpose, mirrored in the "How grading works"
 * UI block. Tune carefully; founders are reading the math.
 */
export function gradeScenario(
  cfg: SimulatorConfig,
  result: SimulatorResult,
): ScenarioGrade {
  const horizon = cfg.horizonMonths;
  const last = result.months[result.months.length - 1];

  // ----- 1. Flywheel Strength (30%) -----
  // Earlier self-sustaining = better. Never reaching = 0.
  let flywheel = 0;
  if (result.selfSustainingMonth !== null) {
    const frac = result.selfSustainingMonth / Math.max(1, horizon);
    flywheel = clamp(100 - frac * 100);
    // bonus for the explicit "Self-Sustaining" badge
    if (result.flywheelStrength === "Self-Sustaining") flywheel = Math.max(flywheel, 80);
  } else {
    flywheel = result.flywheelStrength === "Strong" ? 55
      : result.flywheelStrength === "Building" ? 35
      : 15;
  }
  const flywheelMsg = result.selfSustainingMonth !== null
    ? `Self-sustaining at month ${result.selfSustainingMonth} of ${horizon}.`
    : `Never self-sustains in horizon — ${result.flywheelStrength} flywheel at end.`;

  // ----- 2. Sell Pressure Management (25%) -----
  // Compare avg organic LP inflow to avg sell USDC out across the horizon.
  let totalInflow = 0;
  let totalSell = 0;
  for (const m of result.months) {
    totalInflow += m.taxToLPUSDC + m.secondaryInjectedUSDC + m.buybackUSDC;
    totalSell += m.sellUSDCOut;
  }
  const sellRatio = totalSell > 0 ? totalInflow / totalSell : 5;
  // ratio 1.0 → 70, ratio 2.0+ → 100, ratio 0.5 → 35
  const sellScore = clamp(sellRatio * 50);
  const sellMsg = totalSell > 0
    ? `Organic inflow covers ${(sellRatio * 100).toFixed(0)}% of sell pressure.`
    : "Sell pressure is negligible — caps and staking are highly effective.";

  // ----- 3. Long-term Token Health (20%) -----
  // Weighted on: dilution control + burn rate + locked supply share.
  const circulatingPct = (last?.circulatingSupply ?? 0) / MAX_SUPPLY * 100;
  const burnPct = result.totalBurned > 0 && last
    ? (result.totalBurned / (result.totalBurned + last.circulatingSupply)) * 100
    : 0;
  const lockedPct = last && last.circulatingSupply > 0
    ? (last.lockedSupply / last.circulatingSupply) * 100
    : 0;

  // Dilution: <10% of cap is great, >50% is bad.
  const dilutionScore = clamp(100 - circulatingPct * 2);
  // Burn: 5%+ is excellent.
  const burnScore = clamp(burnPct * 12);
  // Locked supply: 40%+ is excellent.
  const lockedScore = clamp(lockedPct * 1.8);
  const tokenHealth = clamp(dilutionScore * 0.5 + burnScore * 0.25 + lockedScore * 0.25);
  const tokenMsg = `${circulatingPct.toFixed(1)}% of 1T circulating · ${burnPct.toFixed(1)}% burned · ${lockedPct.toFixed(0)}% locked.`;

  // ----- 4. Capital Efficiency (15%) -----
  // Lower tranche USDC to reach self-sustaining = better.
  let capEff = 0;
  let capMsg = "";
  if (result.selfSustainingMonth !== null) {
    // $5M of seed is the budget. 0 used → 100, $5M → 50, $10M+ → 0.
    capEff = clamp(100 - (result.totalTrancheUSDC / 100_000));
    capMsg = `Used ${(result.totalTrancheUSDC / 1_000_000).toFixed(2)}M USDC to reach self-sustaining.`;
  } else {
    capEff = clamp(40 - (result.totalTrancheUSDC / 250_000));
    capMsg = `Spent ${(result.totalTrancheUSDC / 1_000_000).toFixed(2)}M USDC without reaching self-sustaining.`;
  }

  // ----- 5. Risk & Realism (10%) -----
  // Penalize aggressive secondary revenue, very high secondary growth, and
  // very high power-tier sell rates.
  let risk = 100;
  const risks: string[] = [];
  if (cfg.secondaryRevenue.enabled) {
    const sec = cfg.secondaryRevenue;
    const usersAtEnd = last?.users ?? 0;
    const revPerUserAnnual = usersAtEnd > 0 ? (sec.monthlyUSD * 12) / usersAtEnd : 0;
    if (revPerUserAnnual > 200) {
      risk -= 25;
      risks.push(`secondary revenue is $${revPerUserAnnual.toFixed(0)}/user/yr (high)`);
    }
    if (sec.growthRatePerMonth > 0.1) {
      risk -= 20;
      risks.push(`${(sec.growthRatePerMonth * 100).toFixed(0)}%/mo compounding is aggressive`);
    }
  }
  if (cfg.tiers.base.sellRate < 0.5) {
    risk -= 15;
    risks.push("Base sell rate <50% is optimistic");
  }
  if (cfg.monthlyGrowthRate > 0.5) {
    risk -= 20;
    risks.push(`${(cfg.monthlyGrowthRate * 100).toFixed(0)}%/mo user growth is very aggressive`);
  }
  risk = clamp(risk);
  const riskMsg = risks.length === 0
    ? "Assumptions are within reasonable bounds."
    : `Watch-outs: ${risks.join("; ")}.`;

  const categories: CategoryScore[] = [
    { key: "flywheel",         label: "Flywheel Strength",        weight: GRADER_WEIGHTS.flywheel,         score: flywheel,   weighted: 0, rationale: flywheelMsg },
    { key: "sellPressure",     label: "Sell Pressure Management", weight: GRADER_WEIGHTS.sellPressure,     score: sellScore,  weighted: 0, rationale: sellMsg },
    { key: "tokenHealth",      label: "Long-term Token Health",   weight: GRADER_WEIGHTS.tokenHealth,      score: tokenHealth,weighted: 0, rationale: tokenMsg },
    { key: "capitalEfficiency",label: "Capital Efficiency",       weight: GRADER_WEIGHTS.capitalEfficiency,score: capEff,     weighted: 0, rationale: capMsg },
    { key: "riskRealism",      label: "Risk & Realism",           weight: GRADER_WEIGHTS.riskRealism,      score: risk,       weighted: 0, rationale: riskMsg },
  ];
  for (const c of categories) c.weighted = (c.score * c.weight) / 100;
  const total = categories.reduce((s, c) => s + c.weighted, 0);
  const letter = toLetter(total);

  // Build a one-sentence headline.
  const strong = categories.filter((c) => c.score >= 80).map((c) => c.label.toLowerCase());
  const weak = categories.filter((c) => c.score < 50).map((c) => c.label.toLowerCase());
  let summary: string;
  if (letter === "A") {
    summary = `Excellent scenario${strong.length ? ` — strong ${strong[0]}` : ""}${weak.length ? `, but watch ${weak[0]}` : ""}.`;
  } else if (letter === "B") {
    summary = `Solid plan${strong.length ? ` with strong ${strong[0]}` : ""}${weak.length ? `; ${weak[0]} needs work` : ""}.`;
  } else if (letter === "C") {
    summary = weak.length ? `Workable but ${weak.join(" and ")} drag the grade.` : "Workable plan with mixed signals across categories.";
  } else if (letter === "D") {
    summary = `Risky — ${weak.length ? weak.join(" and ") : "multiple categories"} below acceptable.`;
  } else {
    summary = "Scenario unlikely to succeed without major changes.";
  }

  return { letter, total, summary, categories };
}
