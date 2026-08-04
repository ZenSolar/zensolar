import { Link } from 'react-router-dom';
import { Images, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getMilestoneForTokenId } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';

interface MedallionStripProps {
  tokenIds: number[];
  isLoading: boolean;
}

function artworkFor(tokenId: number): string {
  const milestoneId = getMilestoneForTokenId(tokenId);
  if (milestoneId) {
    const art = getNftArtwork(milestoneId);
    if (art) return art;
  }
  return '/nft-images/welcome.png';
}

function nameFor(tokenId: number): string {
  const milestoneId = getMilestoneForTokenId(tokenId);
  if (milestoneId) return milestoneId.replace('_', ' #').toUpperCase();
  return `Medallion #${tokenId}`;
}

/**
 * Tier 4 — Medallion strip.
 * Horizontal scroll of the soulbound milestone medallions; tap for the receipt.
 */
export function MedallionStrip({ tokenIds, isLoading }: MedallionStripProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-secondary/10 p-1.5">
            <Images className="h-3.5 w-3.5 text-secondary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Medallions</h2>
            <p className="text-[11px] text-muted-foreground">Milestones earned on-chain</p>
          </div>
        </div>
        <Link to="/nft-collection" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-xl" />
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-xl" />
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-xl" />
          </div>
        ) : tokenIds.length === 0 ? (
          <p className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Hit your first milestone to earn a medallion — one for every major step of your clean-energy record.
          </p>
        ) : (
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            {tokenIds.map((id) => (
              <Link
                key={id}
                to="/nft-collection"
                className="group relative h-20 w-20 flex-shrink-0 snap-start overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 transition-all hover:ring-primary/40"
              >
                <img src={artworkFor(id)} alt={nameFor(id)} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-1 pb-1 pt-3 text-center text-[9px] font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  #{id}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
