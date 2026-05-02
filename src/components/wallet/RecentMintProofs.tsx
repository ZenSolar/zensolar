import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Hash, Coins, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedSourceBadge, type VerifiedSourceProvider } from '@/components/proof/VerifiedSourceBadge';

interface RecentMint {
  id: string;
  tx_hash: string;
  action: string;
  tokens_minted: number;
  nfts_minted: number[] | null;
  nft_names: string[] | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  register: 'Welcome NFT',
  'mint-rewards': 'Token Mint',
  'mint-combos': 'Combo NFTs',
  'claim-milestone-nfts': 'Milestone NFTs',
};

/**
 * "View Proof" shortcut for the Wallet page.
 *
 * Shows the 3 most recent mint transactions and deep-links each row into Mint History,
 * which is the canonical home for full ERC-20 / ERC-1155 proof links + per-NFT token IDs.
 */
export function RecentMintProofs() {
  const [mints, setMints] = useState<RecentMint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('mint_transactions')
        .select('id, tx_hash, action, tokens_minted, nfts_minted, nft_names, created_at')
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
              return (
                <Link
                  key={tx.id}
                  to={`/mint-history#tx-${tx.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group"
                >
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
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
