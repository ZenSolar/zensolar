// Deno-compatible mirror of src/lib/subscriptionSplitModel.ts
// Keep IN SYNC. Verification step asserts both produce identical summaries.

export const MODEL_VERSION = "v1.0";

export const BASE_PRICE = 9.99;
export const AUTOMINT_PRICE = 19.99;
export const AUTOMINT_ATTACH = 0.30;
export const BLENDED_ARPU =
  BASE_PRICE * (1 - AUTOMINT_ATTACH) + AUTOMINT_PRICE * AUTOMINT_ATTACH;

export const LP_SHARE = 0.5;
export const COMPANY_SHARE = 0.5;

export const SEED_USDC = 200_000;
export const SEED_ZSOLAR_LP = 2_000_000;
export const TRANCHE_USDC = 200_000;
export const TRANCHE_ZSOLAR = 2_000_000;

export type Wave = { id: string; name: string; users: number };
export const WAVES: Wave[] = [
  { id: "W1", name: "Genesis",   users: 1_000 },
  { id: "W2", name: "Founders",  users: 5_000 },
  { id: "W3", name: "Pioneers",  users: 25_000 },
  { id: "W4", name: "Builders",  users: 100_000 },
  { id: "W5", name: "Network",   users: 300_000 },
  { id: "W6", name: "Expansion", users: 600_000 },
  { id: "W7", name: "Mass",      users: 1_000_000 },
];

export type WaveRow = Wave & {
  monthlyRev: number; arr: number;
  lpInjectYr: number; companyYr: number;
  cumUsdc: number; cumZsolarLp: number; floor: number;
};

export function buildWaveMath(): WaveRow[] {
  let usdc = SEED_USDC;
  let zlp = SEED_ZSOLAR_LP;
  return WAVES.map((w) => {
    usdc += TRANCHE_USDC;
    zlp += TRANCHE_ZSOLAR;
    const monthlyRev = w.users * BLENDED_ARPU;
    const lpInjectYr = monthlyRev * LP_SHARE * 12;
    const companyYr = monthlyRev * COMPANY_SHARE * 12;
    usdc += lpInjectYr;
    return {
      ...w, monthlyRev, arr: monthlyRev * 12,
      lpInjectYr, companyYr,
      cumUsdc: usdc, cumZsolarLp: zlp, floor: usdc / zlp,
    };
  });
}

export type ModelSummary = {
  modelVersion: string;
  blendedArpu: number;
  finalArr: number;
  finalLpInjectYr: number;
  finalCompanyYr: number;
  finalFloor: number;
  rowCount: number;
  totalLpYr: number;
  totalCompanyYr: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

export function summarizeModel(rows: WaveRow[] = buildWaveMath()): ModelSummary {
  const last = rows[rows.length - 1];
  return {
    modelVersion: MODEL_VERSION,
    blendedArpu: r2(BLENDED_ARPU),
    finalArr: r2(last.arr),
    finalLpInjectYr: r2(last.lpInjectYr),
    finalCompanyYr: r2(last.companyYr),
    finalFloor: r4(last.floor),
    rowCount: rows.length,
    totalLpYr: r2(rows.reduce((s, r) => s + r.lpInjectYr, 0)),
    totalCompanyYr: r2(rows.reduce((s, r) => s + r.companyYr, 0)),
  };
}

export function diffSummaries(a: ModelSummary, b: ModelSummary): string[] {
  const issues: string[] = [];
  for (const k of Object.keys(a) as (keyof ModelSummary)[]) {
    if (a[k] !== b[k]) issues.push(`${k}: client=${a[k]} server=${b[k]}`);
  }
  return issues;
}
