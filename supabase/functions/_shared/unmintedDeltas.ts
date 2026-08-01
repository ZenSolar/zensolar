/**
 * UNMINTED DELTA READER — the only legitimate source of issuable quantity.
 *
 * Issuance is the sum of unminted `energy_production` rows, NOT a lifetime
 * counter minus a possibly-absent baseline. Every token therefore traces to
 * specific proof-chain rows, and a row consumed by one mint can never be
 * consumed again (enforced by `public.consume_energy_rows`, which only claims
 * rows where `minted_at IS NULL`).
 *
 * Cutover 2026-07-31 (option A): every row predating the cutover carries
 * `consumed_reason = 'pre_cutover'` and is invisible here. See
 * `public.issuance_cutovers` for the audit record and the reversal path.
 */

import type { MintCategory } from './mintFactors.ts';

/** `energy_production.data_type` -> canonical issuance category. */
export const DATA_TYPE_TO_CATEGORY: Record<string, MintCategory> = {
  solar: 'solar_kwh',
  battery_discharge: 'battery_export_kwh',
  ev_miles: 'ev_miles',
  fsd_miles: 'fsd_miles',
  // ev_charging is split by provider below: the home charger providers net,
  // everything else is supercharging.
};

const HOME_CHARGING_PROVIDERS = new Set(['tesla_home_charging', 'wallbox']);

export function categoryForRow(dataType: string, provider: string): MintCategory | null {
  if (dataType === 'ev_charging') {
    return HOME_CHARGING_PROVIDERS.has(provider) ? 'home_charging_kwh' : 'supercharging_kwh';
  }
  return DATA_TYPE_TO_CATEGORY[dataType] ?? null;
}

/** Mile-denominated categories store the value directly; energy stores watt-hours. */
const MILE_CATEGORIES = new Set<MintCategory>(['ev_miles', 'fsd_miles']);

export interface UnmintedRow {
  id: string;
  data_type: string;
  provider: string;
  device_id: string;
  production_wh: number;
  recorded_at: string;
  proof_metadata?: Record<string, unknown> | null;
}

/**
 * PROVENANCE GATE — a row that cannot prove itself is not mintable.
 *
 * A mintable row must carry BOTH:
 *   1. `production_wh_semantics: 'issuable_delta'` — the writer's explicit
 *      claim that `production_wh` is a delta, not a cumulative reading, and
 *   2. a contemporaneous `hash` written by that same writer.
 *
 * Everything else — the pre-Pillar-1 backfill, any row written before the
 * stamp convention, anything hand-inserted — is REFUSED: never counted, never
 * consumed, left in place and logged. 86% of today's table is discarded
 * testnet history; this is what keeps it out of issuance permanently rather
 * than by accident.
 */
export function rowIsStamped(row: UnmintedRow): boolean {
  const meta = (row.proof_metadata ?? null) as any;
  if (!meta || typeof meta !== 'object') return false;
  if (meta.production_wh_semantics !== 'issuable_delta') return false;
  return typeof meta.hash === 'string' && meta.hash.length > 0;
}

export interface ProvenancePartition {
  stamped: UnmintedRow[];
  refused: UnmintedRow[];
  /** Why each refused row failed, for the audit log. */
  refusedReasons: Array<{ id: string; data_type: string; provider: string; reason: string }>;
}

export function partitionByProvenance(rows: UnmintedRow[]): ProvenancePartition {
  const stamped: UnmintedRow[] = [];
  const refused: UnmintedRow[] = [];
  const refusedReasons: ProvenancePartition['refusedReasons'] = [];
  for (const r of rows) {
    if (rowIsStamped(r)) { stamped.push(r); continue; }
    const meta = (r.proof_metadata ?? null) as any;
    const reason = !meta
      ? 'no_proof_metadata'
      : meta.production_wh_semantics !== 'issuable_delta'
        ? 'missing_issuable_delta_stamp'
        : 'missing_hash';
    refused.push(r);
    refusedReasons.push({ id: r.id, data_type: r.data_type, provider: r.provider, reason });
  }
  return { stamped, refused, refusedReasons };
}

export interface UnmintedDeltas {
  /** Native-unit quantity per category (kWh or miles), pre-pipeline. */
  quantities: Partial<Record<MintCategory, number>>;
  /** Row ids backing each category — these are what get consumed. */
  rowIdsByCategory: Partial<Record<MintCategory, string[]>>;
  /** Flat list of every row id in this issuance. */
  allRowIds: string[];
  rowCount: number;
  earliest: string | null;
  latest: string | null;
}

export function aggregateUnmintedRows(rows: UnmintedRow[]): UnmintedDeltas {
  const quantities: Partial<Record<MintCategory, number>> = {};
  const rowIdsByCategory: Partial<Record<MintCategory, string[]>> = {};
  const allRowIds: string[] = [];
  let earliest: string | null = null;
  let latest: string | null = null;

  for (const r of rows) {
    const cat = categoryForRow(r.data_type, String(r.provider || '').toLowerCase());
    if (!cat) continue;

    const raw = Number(r.production_wh) || 0;
    if (raw <= 0) continue;

    const qty = MILE_CATEGORIES.has(cat) ? raw : raw / 1000;

    quantities[cat] = (quantities[cat] ?? 0) + qty;
    (rowIdsByCategory[cat] ??= []).push(r.id);
    allRowIds.push(r.id);

    if (!earliest || r.recorded_at < earliest) earliest = r.recorded_at;
    if (!latest || r.recorded_at > latest) latest = r.recorded_at;
  }

  return { quantities, rowIdsByCategory, allRowIds, rowCount: allRowIds.length, earliest, latest };
}

/**
 * Which `data_type`s a UI mint category covers. Used to scope a per-category
 * mint to just its own rows.
 */
export const MINT_CATEGORY_DATA_TYPES: Record<string, string[]> = {
  solar: ['solar'],
  battery: ['battery_discharge'],
  ev_miles: ['ev_miles', 'fsd_miles'],
  charging: ['ev_charging'],
  all: ['solar', 'battery_discharge', 'ev_miles', 'fsd_miles', 'ev_charging'],
};

/** Fetch every unminted row for a user, optionally scoped to a mint category and device. */
export async function fetchUnmintedRows(
  admin: { from: (t: string) => any },
  userId: string,
  mintCategory: string,
  deviceId?: string | null,
): Promise<UnmintedRow[]> {
  const dataTypes = MINT_CATEGORY_DATA_TYPES[mintCategory] ?? MINT_CATEGORY_DATA_TYPES.all;

  const out: UnmintedRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = admin
      .from('energy_production')
      .select('id, data_type, provider, device_id, production_wh, recorded_at, proof_metadata')
      .eq('user_id', userId)
      .is('minted_at', null)
      .in('data_type', dataTypes)
      .order('recorded_at', { ascending: true })
      .range(from, from + PAGE - 1);

    if (deviceId) q = q.eq('device_id', deviceId);

    const { data, error } = await q;
    if (error) throw new Error(`fetchUnmintedRows: ${error.message}`);
    out.push(...((data ?? []) as UnmintedRow[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}
