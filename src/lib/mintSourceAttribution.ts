import type { VerifiedSourceProvider } from '@/components/proof/VerifiedSourceBadge';

export interface MintSourceAttribution {
  provider: VerifiedSourceProvider;
  /** Human category: Solar, Battery, Home Charging, Supercharging, Driving */
  category: string;
  deviceLabel: string;
  kwh?: number;
  miles?: number;
  /** Whether the attribution came from an explicit source_breakdown row. */
  measured: boolean;
}

export interface MintRowLike {
  action: string;
  tokens_minted: number;
  source_breakdown?: Record<string, number> | null;
}

/**
 * Canonical source attribution for a mint row.
 *
 * Per the Proof-of-Genesis unified-receipt spec: legacy `mint-rewards` rows
 * with no explicit `source_breakdown` are Tesla Supercharging-only — never
 * infer Wallbox/Enphase/etc. Rows carrying a breakdown pick the dominant
 * source and are flagged `measured: true`.
 *
 * Mint ratio is 1:1 across every source — 1 token per kWh (solar, battery,
 * home charging, Supercharging) OR 1 token per mile (EV driving only).
 */
export function attributeMintSource(tx: MintRowLike): MintSourceAttribution | null {
  if (tx.action !== 'mint-rewards') return null;

  const tokens = tx.tokens_minted || 0;
  const kwh = tokens > 0 ? Math.round(tokens * 10) / 10 : undefined;

  const sb = tx.source_breakdown ?? {};
  const solar = Number(sb.solar_kwh ?? 0);
  const battery = Number(sb.battery_kwh ?? 0);
  const home = Number(sb.home_charging_kwh ?? 0);
  const supercharge = Number(sb.supercharging_kwh ?? sb.ev_kwh ?? 0);
  const driving = Number(sb.ev_miles ?? 0);

  if (solar > 0 && solar >= battery && solar >= home && solar >= supercharge && solar >= driving) {
    return { provider: 'enphase', category: 'Solar', deviceLabel: 'IQ8 Microinverters', kwh: solar, measured: true };
  }
  if (battery > 0 && battery >= home && battery >= supercharge && battery >= driving) {
    return { provider: 'tesla_energy', category: 'Battery', deviceLabel: 'Powerwall 3', kwh: battery, measured: true };
  }
  if (home > 0 && home >= supercharge && home >= driving) {
    return { provider: 'wallbox', category: 'Home Charging', deviceLabel: 'Pulsar Plus', kwh: home, measured: true };
  }
  if (driving > 0 && driving > supercharge) {
    return { provider: 'tesla_vehicle', category: 'Driving', deviceLabel: 'EV Driving', miles: driving, measured: true };
  }
  if (supercharge > 0) {
    return { provider: 'tesla_vehicle', category: 'Supercharging', deviceLabel: 'Supercharger', kwh: supercharge, measured: true };
  }
  return {
    provider: 'tesla_vehicle',
    category: 'Supercharging',
    deviceLabel: 'Supercharging',
    kwh,
    measured: false,
  };
}

export function formatUnitLabel(a: MintSourceAttribution | null): string | null {
  if (!a) return null;
  if (a.kwh != null) return `${a.kwh.toLocaleString()} kWh`;
  if (a.miles != null) return `${a.miles.toLocaleString()} mi`;
  return null;
}
