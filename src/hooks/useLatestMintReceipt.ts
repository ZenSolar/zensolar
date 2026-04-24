import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useLatestMintReceipt
 * --------------------
 * Loads the **signed-in user's most recent** mint_transactions row plus the
 * matching connected_devices row (vehicle / solar / battery) so the
 * Proof-of-Genesis receipt can render real, on-chain numbers.
 *
 * Why this hook exists:
 *   The receipt page used to render hardcoded mock data. The user pointed
 *   out that their actual last mint was 1,165.29 $ZSOLAR (≈ 1,553 EV miles
 *   delta), but the receipt showed 39 $ZSOLAR / 52 mi. That was a mock,
 *   not a bug in the math. This hook is the live wire-up.
 *
 * Math reconstruction for legacy mints:
 *   Tokens are split 75% user / 20% burn / 3% LP / 2% treasury.
 *   So: gross_tokens = tokens_minted / 0.75
 *   For a pure EV mint:  miles_delta ≈ gross_tokens (1 token / mile)
 *   kWh equivalent (Tesla Y/3 baseline): miles / 3.0 mi/kWh
 *
 * Going forward, edge functions should populate `miles_delta`, `kwh_delta`
 * and `source_breakdown` directly on the mint row — see migration
 * 2026-04-24 add_mint_deltas. This hook prefers those columns when present
 * and falls back to the back-calc above only for legacy rows.
 */

// User-share split — keep in sync with smart contract & tokenomics doc
const USER_SHARE = 0.75; // 75% user, 20% burn, 3% LP, 2% treasury
const EV_MI_PER_KWH = 3.0;

export type LiveMintReceipt = {
  id: string;
  tx_hash: string;
  block_number: string | null;
  minted_at: string;
  action: string;
  tokens_minted: number;          // user share, what landed in their wallet
  gross_tokens: number;           // pre-split (= miles for EV-only)
  miles_delta: number | null;     // EV miles since prior mint
  kwh_delta: number | null;       // total verified kWh
  primary_source: 'solar' | 'battery' | 'ev_charging' | 'mixed';
  source_breakdown: Record<string, number>;
  device_provider: string | null;
  device_id: string | null;
  prior_odometer: number | null;
  current_odometer: number | null;
};

type State =
  | { status: 'loading'; receipt: null; error: null }
  | { status: 'empty'; receipt: null; error: null }
  | { status: 'ready'; receipt: LiveMintReceipt; error: null }
  | { status: 'error'; receipt: null; error: string };

export function useLatestMintReceipt(): State {
  const [state, setState] = useState<State>({ status: 'loading', receipt: null, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setState({ status: 'empty', receipt: null, error: null });
          return;
        }

        // 1. Most recent mint for this user
        const { data: mints, error: mintErr } = await supabase
          .from('mint_transactions')
          .select('id, tx_hash, block_number, created_at, action, tokens_minted, miles_delta, kwh_delta, source_breakdown')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(2); // 2 so we can compute prior odometer for legacy rows

        if (mintErr) throw mintErr;
        if (!mints || mints.length === 0) {
          if (!cancelled) setState({ status: 'empty', receipt: null, error: null });
          return;
        }

        const last = mints[0];

        // 2. Vehicle device for this user (provider + current odometer)
        const { data: devices } = await supabase
          .from('connected_devices')
          .select('device_id, provider, device_type, lifetime_totals')
          .eq('user_id', session.user.id)
          .in('device_type', ['vehicle', 'ev', 'tesla_vehicle']);

        const vehicle = devices?.[0] ?? null;
        const currentOdometer = vehicle?.lifetime_totals
          ? Number((vehicle.lifetime_totals as Record<string, unknown>).odometer ?? 0) || null
          : null;

        // 3. Reconstruct deltas
        const tokensMinted = Number(last.tokens_minted ?? 0);
        const grossTokens = tokensMinted / USER_SHARE;

        const sourceBreakdown =
          (last.source_breakdown as Record<string, number> | null) ?? {};

        // Prefer stored deltas; back-calc for legacy mints
        let milesDelta: number | null =
          last.miles_delta != null ? Number(last.miles_delta) : null;
        let kwhDelta: number | null =
          last.kwh_delta != null ? Number(last.kwh_delta) : null;

        // Heuristic: action = mint-rewards with no NFTs → assume EV-driven
        // (matches current minter behavior). Future mints will set
        // source_breakdown explicitly.
        const isEvHeuristic =
          milesDelta == null &&
          kwhDelta == null &&
          last.action === 'mint-rewards' &&
          tokensMinted > 0;

        if (isEvHeuristic) {
          milesDelta = grossTokens; // 1 token = 1 mile (pre-split)
          kwhDelta = milesDelta / EV_MI_PER_KWH;
        }

        const primarySource: LiveMintReceipt['primary_source'] =
          milesDelta != null && milesDelta > 0 && (sourceBreakdown.solar_kwh ?? 0) === 0
            ? 'ev_charging'
            : (sourceBreakdown.solar_kwh ?? 0) > 0 && (sourceBreakdown.battery_kwh ?? 0) > 0
              ? 'mixed'
              : (sourceBreakdown.solar_kwh ?? 0) > 0
                ? 'solar'
                : (sourceBreakdown.battery_kwh ?? 0) > 0
                  ? 'battery'
                  : 'ev_charging';

        // Prior odometer for receipt context = current - delta
        const priorOdometer =
          currentOdometer != null && milesDelta != null
            ? currentOdometer - milesDelta
            : null;

        const receipt: LiveMintReceipt = {
          id: last.id,
          tx_hash: last.tx_hash,
          block_number: last.block_number,
          minted_at: last.created_at,
          action: last.action,
          tokens_minted: tokensMinted,
          gross_tokens: grossTokens,
          miles_delta: milesDelta,
          kwh_delta: kwhDelta,
          primary_source: primarySource,
          source_breakdown: sourceBreakdown,
          device_provider: vehicle?.provider ?? null,
          device_id: vehicle?.device_id ?? null,
          prior_odometer: priorOdometer,
          current_odometer: currentOdometer,
        };

        if (!cancelled) setState({ status: 'ready', receipt, error: null });
      } catch (e) {
        if (!cancelled) {
          setState({
            status: 'error',
            receipt: null,
            error: e instanceof Error ? e.message : 'Failed to load mint receipt',
          });
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
