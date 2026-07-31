/**
 * PROOF-OF-DELTA WRITE CONTRACT (post 2026-07-31 issuance cutover).
 *
 * `energy_production.production_wh` is the ISSUABLE DELTA for that row and
 * nothing else — `_shared/unmintedDeltas.ts` sums it directly.
 * The cumulative meter reading (odometer, lifetime Wh, day-to-date Wh, …)
 * lives in `proof_metadata.value`, tagged with:
 *   value_semantics          : cumulative_snapshot | day_to_date | period_total
 *   production_wh_semantics  : issuable_delta
 *
 * Previous-value resolution therefore reads `proof_metadata.value` first and
 * only falls back to `production_wh` for legacy pre-cutover rows.
 */

export type ValueSemantics = 'cumulative_snapshot' | 'day_to_date' | 'period_total';

export interface PrevProof {
  prevHash: string;
  prevValue: number;
  prevRecordedAt: string | null;
  /** Semantics of the previous row's stored `value` (null for legacy rows). */
  prevSemantics: ValueSemantics | null;
}

/** Read the cumulative value off a row, with legacy fallback. */
export function readSnapshotValue(row: any): number {
  const meta = (row?.proof_metadata as any) || null;
  const v = meta && meta.value !== undefined && meta.value !== null
    ? Number(meta.value)
    : Number(row?.production_wh || 0);
  return Number.isFinite(v) ? v : 0;
}

/** Latest proof row for a (user, provider, device, data_type) series. */
export async function getPreviousProof(
  client: { from: (t: string) => any },
  deviceId: string,
  provider: string,
  dataType: string,
  userId: string,
): Promise<PrevProof> {
  const { data: prevRecord } = await client
    .from('energy_production')
    .select('proof_metadata, production_wh, recorded_at')
    .eq('device_id', deviceId)
    .eq('provider', provider)
    .eq('data_type', dataType)
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    prevHash: (prevRecord?.proof_metadata as any)?.hash || 'genesis',
    prevValue: readSnapshotValue(prevRecord),
    prevRecordedAt: (prevRecord?.recorded_at as string) ?? null,
    prevSemantics: ((prevRecord?.proof_metadata as any)?.value_semantics as ValueSemantics) ?? null,
  };
}

/** Issuable delta between two cumulative snapshots. */
export function snapshotDelta(value: number, prevValue: number): number {
  return Math.max(0, (Number(value) || 0) - (Number(prevValue) || 0));
}

export function buildProofMetadata(opts: {
  hash: string;
  prevHash: string;
  deviceId: string;
  value: number;
  prevValue: number;
  delta: number;
  dataType: string;
  timestamp: string;
  unit?: string;
  valueSemantics?: ValueSemantics;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    hash: opts.hash,
    prev_hash: opts.prevHash,
    device_id: opts.deviceId,
    value: opts.value,
    prev_value: opts.prevValue,
    delta: opts.delta,
    value_semantics: opts.valueSemantics ?? 'cumulative_snapshot',
    production_wh_semantics: 'issuable_delta',
    data_type: opts.dataType,
    unit: opts.unit ?? 'wh',
    timestamp: opts.timestamp,
    algorithm: 'SHA-256',
    preimage_format: 'device_id|timestamp|value|prevHash',
    ...(opts.extra ?? {}),
  };
}

/**
 * DAY-TO-DATE SOURCES (Enphase `energy_today`, SolarEdge `lastDayData`).
 *
 * The reading resets to 0 at local midnight and grows through the day, so a
 * naive "value - previous row's value" over-counts: every same-day row would
 * re-issue the whole day so far.
 *
 * Fix: each hourly bucket row stores the day-to-date reading captured at the
 * START of that bucket (`bucket_start_value`). The row's issuable delta is
 * `todayValue - bucket_start_value`. Because the anchor is pinned to the
 * bucket and re-read on every rewrite of the same bucket, repeated runs inside
 * one hour are idempotent (the row simply grows), a new hour starts from the
 * previous row's reading, and the first row of a new day anchors at 0.
 */
export async function resolveBucketAnchor(
  client: { from: (t: string) => any },
  args: {
    userId: string;
    deviceId: string;
    provider: string;
    dataType: string;
    recordedAt: string;
    prev: PrevProof;
    /** true for day-to-date meters that reset at local midnight. */
    resetsDaily: boolean;
    /** Current reading. A reading BELOW the anchor proves a meter reset. */
    currentValue?: number;
    /**
     * Semantics of the reading being written. When set, anchors carried by
     * rows of a DIFFERENT semantics are refused: mixing a day-to-date anchor
     * with a lifetime reading would emit the entire lifetime as one delta.
     */
    expectSemantics?: ValueSemantics;
  },
): Promise<number> {
  // Same bucket already written? Reuse its pinned anchor.
  const { data: sameBucket } = await client
    .from('energy_production')
    .select('proof_metadata, minted_at')
    .eq('user_id', args.userId)
    .eq('device_id', args.deviceId)
    .eq('provider', args.provider)
    .eq('data_type', args.dataType)
    .eq('recorded_at', args.recordedAt)
    .maybeSingle();

  const cur = Number(args.currentValue);
  const belowAnchor = (a: number) => Number.isFinite(cur) && cur < a;

  // FAIL CLOSED on a semantics change in the series (e.g. day_to_date rows
  // followed by cumulative lifetime rows). Anchor at the current reading so
  // the transition row issues exactly 0 rather than a lifetime total.
  // A bucket row that has already been consumed (minted or quarantined) is
  // CLOSED: never re-open it with a fresh anchor. Anchor at the current
  // reading so the rewrite issues 0.
  if (sameBucket && (sameBucket as any).minted_at && Number.isFinite(cur)) return cur;

  const bucketSem = (sameBucket?.proof_metadata as any)?.value_semantics ?? null;
  if (args.expectSemantics && Number.isFinite(cur)) {
    const mismatched =
      (sameBucket && bucketSem !== args.expectSemantics) ||
      (!sameBucket && args.prev.prevRecordedAt && args.prev.prevSemantics !== args.expectSemantics);
    if (mismatched) return cur;
  }

  const pinned = (sameBucket?.proof_metadata as any)?.bucket_start_value;
  if (pinned !== undefined && pinned !== null && Number.isFinite(Number(pinned))) {
    // A reading below the pinned anchor means the meter rolled over mid-bucket
    // (local midnight vs. the UTC date used for bucketing). Re-anchor at 0.
    return args.resetsDaily && belowAnchor(Number(pinned)) ? 0 : Number(pinned);
  }

  // New bucket: anchor on the previous row's reading. For day-to-date meters
  // the anchor drops to 0 when the previous row is from an earlier calendar
  // day, because the meter reset overnight.
  if (!args.prev.prevRecordedAt) return args.resetsDaily ? 0 : (Number.isFinite(cur) ? cur : args.prev.prevValue);
  if (!args.resetsDaily) return args.prev.prevValue;
  const sameDay = args.prev.prevRecordedAt.slice(0, 10) === args.recordedAt.slice(0, 10);
  if (!sameDay) return 0;
  // Same UTC date but a smaller reading ⇒ the local day already rolled over.
  return belowAnchor(args.prev.prevValue) ? 0 : args.prev.prevValue;
}

/** Day-to-date convenience wrapper (Enphase energy_today, SolarEdge lastDayData). */
export async function resolveDayToDateAnchor(
  client: { from: (t: string) => any },
  args: { userId: string; deviceId: string; provider: string; dataType: string; recordedAt: string; prev: PrevProof; currentValue: number },
): Promise<number> {
  return await resolveBucketAnchor(client, { ...args, resetsDaily: true, expectSemantics: 'day_to_date' });
}

/** Cumulative-snapshot convenience wrapper (lifetime meters, odometers). */
export async function resolveCumulativeAnchor(
  client: { from: (t: string) => any },
  args: { userId: string; deviceId: string; provider: string; dataType: string; recordedAt: string; prev: PrevProof; currentValue?: number },
): Promise<number> {
  return await resolveBucketAnchor(client, { ...args, resetsDaily: false, expectSemantics: 'cumulative_snapshot' });
}
