import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowRight, ChevronDown } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { RecentMintProofs } from '@/components/wallet/RecentMintProofs';
import { useBasePath } from '@/hooks/useBasePath';

/**
 * Lightweight discoverability strip → opens a swipe-down bottom sheet
 * showing the user's most recent Proof-of-Mint receipts inline. Avoids the
 * heavyweight Mint History page (which traps users with no back nav inside
 * the PWA) for the common "where's my receipt?" peek.
 *
 * The drawer footer still links to the full Mint History for power users.
 */
export function MintReceiptsHint() {
  const basePath = useBasePath();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all text-left"
        aria-label="View your recent mint receipts"
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
          <span>View</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-md px-4 pb-6 overflow-y-auto">
            <DrawerHeader className="px-0 pt-1 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-left text-lg">Your mint receipts</DrawerTitle>
                  <DrawerDescription className="text-left text-xs">
                    Recent Proof-of-Mint™ records · swipe down to close
                  </DrawerDescription>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/60" aria-hidden />
              </div>
            </DrawerHeader>

            <RecentMintProofs />

            <Link
              to={`${basePath}/mint-history`}
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg border border-border/60 bg-card/40 hover:bg-card/70 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View full mint history
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
