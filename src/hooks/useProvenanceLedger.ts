import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { attributeMintSource, type MintSourceAttribution } from '@/lib/mintSourceAttribution';

export interface ProvenanceEntry {
  id: string;
  txHash: string;
  chainHash: string | null;
  action: string;
  tokens: number;
  nftIds: number[];
  nftNames: string[];
  createdAt: string;
  source: MintSourceAttribution | null;
}

export interface ProvenanceLedgerResult {
  entries: ProvenanceEntry[];
  /** Lifetime kWh credited (1 token = 1 kWh of the user's 50% share). */
  lifetimeKwh: number;
  /** Lifetime tokens across all recorded mints. */
  lifetimeTokens: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * The provenance ledger is the differentiator: every credit line carries the
 * device, the delta and a link to its Merkle proof. Read-only.
 */
export function useProvenanceLedger(limit = 25): ProvenanceLedgerResult {
  const [entries, setEntries] = useState<ProvenanceEntry[]>([]);
  const [totals, setTotals] = useState({ kwh: 0, tokens: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setEntries([]); setIsLoading(false); }
        return;
      }

      const { data, error: qErr } = await supabase
        .from('mint_transactions')
        .select('id, tx_hash, chain_hash, action, tokens_minted, nfts_minted, nft_names, created_at, source_breakdown')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cancelled) return;

      if (qErr) {
        setError(qErr.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as Array<{
        id: string;
        tx_hash: string;
        chain_hash: string | null;
        action: string;
        tokens_minted: number | null;
        nfts_minted: number[] | null;
        nft_names: string[] | null;
        created_at: string;
        source_breakdown: Record<string, number> | null;
      }>;

      const mapped: ProvenanceEntry[] = rows.map((r) => ({
        id: r.id,
        txHash: r.tx_hash,
        chainHash: r.chain_hash,
        action: r.action,
        tokens: r.tokens_minted ?? 0,
        nftIds: r.nfts_minted ?? [],
        nftNames: r.nft_names ?? [],
        createdAt: r.created_at,
        source: attributeMintSource({
          action: r.action,
          tokens_minted: r.tokens_minted ?? 0,
          source_breakdown: r.source_breakdown,
        }),
      }));

      const tokens = mapped.reduce((s, e) => s + e.tokens, 0);
      const kwh = mapped.reduce((s, e) => s + (e.source?.kwh ?? 0), 0);

      setEntries(mapped);
      setTotals({ kwh: Math.round(kwh * 10) / 10, tokens });
      setError(null);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [limit, nonce]);

  return {
    entries,
    lifetimeKwh: totals.kwh,
    lifetimeTokens: totals.tokens,
    isLoading,
    error,
    refetch: () => setNonce((n) => n + 1),
  };
}
