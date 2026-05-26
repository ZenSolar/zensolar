import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Hash, Coins, Image as ImageIcon, ShieldCheck, Share2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedSourceBadge, type VerifiedSourceProvider } from '@/components/proof/VerifiedSourceBadge';
import { ProofOfMintModal } from '@/components/proof/ProofOfMintModal';
import { VerifyPoASheet } from '@/components/proof/VerifyPoASheet';
import { toast } from '@/hooks/use-toast';

interface RecentMint {
  id: string;
  tx_hash: string;
  chain_hash: string | null;
  action: string;
  tokens_minted: number;
  nfts_minted: number[] | null;
  nft_names: string[] | null;
  created_at: string;
  source_breakdown: Record<string, number> | null;
}

const ACTION_LABEL: Record<string, string> = {
  register: 'Welcome NFT',
  'mint-rewards': 'Token Mint',
  'mint-combos': 'Combo NFTs',
  'claim-milestone-nfts': 'Milestone NFTs',
};

/**
 * Source attribution for a mint row.
 *
 * Per the Proof-of-Genesis unified-receipt spec:
 *   Legacy `mint-rewards` rows with no explicit `source_breakdown`
 *   are Tesla Supercharging-only — never infer Wallbox/Enphase/etc.
 *
 * If a row carries `source_breakdown` we pick the dominant source.
 * Otherwise we default to Tesla Supercharging (the only historical source).
 */
function inferSource(tx: RecentMint): {
  provider: VerifiedSourceProvider;
  deviceLabel: string;
  kwh?: number;
  miles?: number;
} | null {
  if (tx.action !== 'mint-rewards') return null;
  const tokens = tx.tokens_minted || 0;
  // Mint ratio is 1:1 across every source — 1 token per kWh (solar, battery,
  // home charging, Supercharging) OR 1 token per mile (EV driving only).
  // Never multiply by 10. Charging is ALWAYS kWh — never miles.
  const kwh = tokens > 0 ? Math.round(tokens * 10) / 10 : undefined;

  const sb = tx.source_breakdown ?? {};
  const solar = Number(sb.solar_kwh ?? 0);
  const battery = Number(sb.battery_kwh ?? 0);
  const home = Number(sb.home_charging_kwh ?? 0);
  const supercharge = Number(sb.supercharging_kwh ?? sb.ev_kwh ?? 0);
  const driving = Number(sb.ev_miles ?? 0);

  if (solar > 0 && solar >= battery && solar >= home && solar >= supercharge && solar >= driving) {
    return { provider: 'enphase', deviceLabel: 'IQ8 Microinverters', kwh: solar };
  }
  if (battery > 0 && battery >= home && battery >= supercharge && battery >= driving) {
    return { provider: 'tesla_energy', deviceLabel: 'Powerwall 3', kwh: battery };
  }
  if (home > 0 && home >= supercharge && home >= driving) {
    return { provider: 'wallbox', deviceLabel: 'Pulsar Plus', kwh: home };
  }
  if (driving > 0 && driving > supercharge) {
    return { provider: 'tesla_vehicle', deviceLabel: 'EV Driving', miles: driving };
  }
  // Default: Tesla Supercharging (legacy mint-rewards rows) — kWh, not miles.
  return { provider: 'tesla_vehicle', deviceLabel: 'Supercharging', kwh };
}

/**
 * "View Proof" shortcut for the Wallet page.
 *
 * Shows the 3 most recent mint transactions and deep-links each row into Mint History,
 * which is the canonical home for full ERC-20 / ERC-1155 proof links + per-NFT token IDs.
 */
export function RecentMintProofs() {
  const [mints, setMints] = useState<RecentMint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proofTx, setProofTx] = useState<RecentMint | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [pogSheetHash, setPogSheetHash] = useState<string | null>(null);

  async function handleShare(e: React.MouseEvent, tx: RecentMint, source: ReturnType<typeof inferSource>) {
    e.preventDefault();
    e.stopPropagation();
    const path = tx.chain_hash ? `/verify/${tx.chain_hash}` : `/mint-history#tx-${tx.id}`;
    const url = `https://beta.zen.solar${path}`;
    const sourceLine = source
      ? `\nSource: ${source.deviceLabel}${source.kwh ? ` · ${source.kwh} kWh` : source.miles ? ` · ${source.miles} mi` : ''}`
      : '';
    const text = `Verified $ZSOLAR Mint Proof\n${tx.tokens_minted.toLocaleString()} $ZSOLAR minted${sourceLine}\nProof: ${url}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'ZenSolar Mint Proof', text, url });
        return;
      }
    } catch {
      // user cancelled or share failed → fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text);
      setSharedId(tx.id);
      toast({ title: 'Proof link copied', description: 'Share it anywhere — opens the public verifier.' });
      setTimeout(() => setSharedId((curr) => (curr === tx.id ? null : curr)), 2000);
    } catch {
      toast({ title: 'Could not copy link', description: url, variant: 'destructive' });
    }
  }


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('mint_transactions')
        .select('id, tx_hash, chain_hash, action, tokens_minted, nfts_minted, nft_names, created_at, source_breakdown')
        .order('created_at', { ascending: false })
        .limit(3);

      if (cancelled) return;
      if (!error && data) setMints(data as RecentMint[]);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!isLoading && mints.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">View Proof</h3>
              <p className="text-[11px] text-muted-foreground">
                Recent mints — tap for tx hash & metadata
              </p>
            </div>
          </div>
          <Link
            to="/mint-history"
            className="text-xs h-8 px-2 inline-flex items-center gap-1 text-primary hover:underline"
          >
            All history
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </>
          ) : (
            mints.map((tx) => {
              const label = ACTION_LABEL[tx.action] || tx.action;
              const nftCount = tx.nfts_minted?.length || 0;
              const source = inferSource(tx);
              const hasChainHash = !!tx.chain_hash;
              const RowTag: any = hasChainHash ? 'button' : Link;
              const rowProps = hasChainHash
                ? {
                    type: 'button' as const,
                    onClick: () => setPogSheetHash(tx.chain_hash!),
                  }
                : { to: `/mint-history#tx-${tx.id}` };
              return (
                <RowTag
                  key={tx.id}
                  {...rowProps}
                  className="flex w-full flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                        {tx.tokens_minted > 0 ? (
                          <Coins className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{label}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Hash className="h-2.5 w-2.5" />
                          <span className="font-mono truncate">
                            {tx.tx_hash.slice(0, 8)}…{tx.tx_hash.slice(-4)}
                          </span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        {tx.tokens_minted > 0 && (
                          <p className="text-xs font-semibold tabular-nums text-foreground">
                            {tx.tokens_minted.toLocaleString()}
                          </p>
                        )}
                        {nftCount > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {nftCount} NFT{nftCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleShare(e as any, tx, source)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleShare(e as any, tx, source);
                          }
                        }}
                        aria-label="Share mint proof"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        {sharedId === tx.id ? (
                          <Check className="h-4 w-4 text-primary" aria-hidden />
                        ) : (
                          <Share2 className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  {source && (
                    <div className="pl-9">
                      <VerifiedSourceBadge
                        variant="compact"
                        provider={source.provider}
                        deviceLabel={source.deviceLabel}
                        kwh={source.kwh}
                        miles={source.miles}
                        timestamp={tx.created_at}
                        onClick={() => setProofTx(tx)}
                      />
                    </div>
                  )}
                </RowTag>
              );
            })
          )}
        </div>
      </div>

      {proofTx && (() => {
        const src = inferSource(proofTx);
        return (
          <ProofOfMintModal
            open={!!proofTx}
            onOpenChange={(v) => !v && setProofTx(null)}
            provider={src?.provider || 'unknown'}
            deviceLabel={src?.deviceLabel}
            kwh={src?.kwh}
            miles={src?.miles}
            timestamp={proofTx.created_at}
            tokens={proofTx.tokens_minted}
            txHash={proofTx.tx_hash?.startsWith('0x') ? proofTx.tx_hash : undefined}
            proofUrl={`/mint-history#tx-${proofTx.id}`}
          />
        );
      })()}

      <VerifyPoASheet
        chainHash={pogSheetHash ?? undefined}
        open={!!pogSheetHash}
        onOpenChange={(v) => !v && setPogSheetHash(null)}
      />
    </motion.div>
  );
}
