import { useEffect, useId, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { RecentMintProofs } from '@/components/wallet/RecentMintProofs';
import { useBasePath } from '@/hooks/useBasePath';

/**
 * Lightweight discoverability strip → opens a swipe-down bottom sheet
 * showing the user's most recent Proof-of-Mint receipts inline.
 *
 * Drawer-open state is mirrored to the URL hash (`#receipts`) so that
 * navigating away to a Proof-of-Genesis receipt and pressing Back lands
 * the user right back on the dashboard with the drawer re-opened —
 * instead of dumping them at the top of the dashboard.
 */
export function MintReceiptsHint() {
  const basePath = useBasePath();
  const location = useLocation();
  const navigate = useNavigate();
  const panelId = useId();
  const [open, setOpen] = useState(() => location.hash === '#receipts');

  // Keep React state in sync when the user navigates (back/forward) and
  // the hash changes underneath us.
  useEffect(() => {
    setOpen(location.hash === '#receipts');
  }, [location.hash]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && location.hash !== '#receipts') {
      navigate({ pathname: location.pathname, search: location.search, hash: '#receipts' });
    } else if (!next && location.hash === '#receipts') {
      // Pop the hash entry so Back doesn't re-open the drawer in a loop.
      navigate(-1);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="View your Proof Feed"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Proof Feed</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Your recent Proof-of-Genesis™ receipts, on-chain &amp; verifiable
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary flex-shrink-0">
          <span>View</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange} dismissible>
        <DrawerContent
          id={panelId}
          aria-labelledby={`${panelId}-title`}
          aria-describedby={`${panelId}-desc`}
          className="max-h-[85dvh] lg:max-h-none"
        >
          <div className="mx-auto w-full max-w-md px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain">
            <DrawerHeader className="px-0 pt-1 pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DrawerTitle id={`${panelId}-title`} className="text-left text-lg">
                    Your mint receipts
                  </DrawerTitle>
                  <DrawerDescription id={`${panelId}-desc`} className="text-left text-xs">
                    Recent Proof-of-Mint™ records · swipe down or press Esc to close
                  </DrawerDescription>
                </div>
                <DrawerClose
                  aria-label="Close receipts"
                  className="inline-flex h-11 w-11 -mr-2 -mt-1 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <X className="h-5 w-5" aria-hidden />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <RecentMintProofs />

            <Link
              to={`${basePath}/mint-history`}
              onClick={() => handleOpenChange(false)}
              className="mt-4 flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-lg border border-border/60 bg-card/40 hover:bg-card/70 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
