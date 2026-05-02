import { Link } from 'react-router-dom';
import { Receipt, ArrowRight } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

/**
 * Lightweight discoverability strip that always tells the user where to find
 * their full mint receipts (Proof-of-Mint records). Intentionally minimal —
 * it does NOT render the latest receipt itself (that lives in Wallet /
 * Mint History) but ensures the dashboard never leaves the user wondering
 * "where did my receipt go?" after a mint.
 *
 * Works on both `/` (auth) and `/demo` via useBasePath.
 */
export function MintReceiptsHint() {
  const basePath = useBasePath();

  return (
    <Link
      to={`${basePath}/mint-history`}
      className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all"
      aria-label="View all mint receipts in Mint History"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Your mint receipts</p>
          <p className="text-[11px] text-muted-foreground truncate">
            Every Tap-to-Mint™ generates a verifiable on-chain receipt
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-primary flex-shrink-0">
        <span>View all</span>
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
