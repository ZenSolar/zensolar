import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Coins, Hash, Image as ImageIcon, ShieldCheck, Sun, BatteryCharging, Car, Plug } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProvenanceEntry } from '@/hooks/useProvenanceLedger';
import { formatUnitLabel } from '@/lib/mintSourceAttribution';

interface ProvenanceLedgerProps {
  entries: ProvenanceEntry[];
  isLoading: boolean;
}

const CATEGORY_ICON: Record<string, typeof Sun> = {
  Solar: Sun,
  Battery: BatteryCharging,
  'Home Charging': Plug,
  Supercharging: Plug,
  Driving: Car,
};

const ACTION_LABEL: Record<string, string> = {
  register: 'Welcome NFT',
  'mint-rewards': 'Energy credit',
  'mint-combos': 'Combo NFTs',
  'claim-milestone-nfts': 'Milestone NFTs',
};

/**
 * Tier 3 — Provenance ledger.
 *
 * The part no other wallet has: every credit line reads as an energy receipt
 * ("Solar · 4.2 kWh · Enphase · verified"), not "Transfer +4.2", and links
 * straight to its Merkle proof.
 */
export function ProvenanceLedger({ entries, isLoading }: ProvenanceLedgerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Provenance</h2>
            <p className="text-[11px] text-muted-foreground">Every credit traced to a device and a proof</p>
          </div>
        </div>
        <Link to="/mint-history" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          All history
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2 px-4 pb-4">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 text-center">
            <p className="text-sm font-medium text-foreground">No credits yet</p>
            <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
              Once your devices deliver a verified reading, each credit appears here with its device, delta and proof.
            </p>
          </div>
        ) : (
          entries.map((e) => {
            const src = e.source;
            const Icon = src ? CATEGORY_ICON[src.category] ?? Coins : e.nftIds.length > 0 ? ImageIcon : Coins;
            const unit = formatUnitLabel(src);
            const to = e.chainHash ? `/verify/${e.chainHash}` : `/mint-history#tx-${e.id}`;

            return (
              <Link
                key={e.id}
                to={to}
                className="group flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/25 p-3 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 p-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {src ? src.category : ACTION_LABEL[e.action] ?? e.action}
                        {unit && <span className="text-muted-foreground"> · {unit}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {src ? src.deviceLabel : ACTION_LABEL[e.action] ?? e.action}
                        {' · '}
                        {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {e.tokens > 0 && (
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        +{e.tokens.toLocaleString()}
                      </p>
                    )}
                    {e.nftIds.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {e.nftIds.length} medallion{e.nftIds.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                  <span
                    className={`rounded-full border px-1.5 py-px text-[9px] font-medium uppercase tracking-wide ${
                      src?.measured
                        ? 'border-eco/30 bg-eco/10 text-eco'
                        : 'border-border/60 bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {src?.measured ? 'Measured' : 'Attributed'}
                  </span>
                  <span className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                    <Hash className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate font-mono">
                      {e.txHash.slice(0, 10)}…{e.txHash.slice(-4)}
                    </span>
                  </span>
                  <span className="ml-auto flex-shrink-0 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {e.chainHash ? 'Merkle proof' : 'Details'}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
