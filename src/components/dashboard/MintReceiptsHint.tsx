import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
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
 * showing the user's most recent Proof-of-Mint receipts inline. Avoids the
 * heavyweight Mint History page (which traps users with no back nav inside
 * the PWA) for the common "where's my receipt?" peek.
 *
 * Accessibility / UX:
 * - vaul (the Drawer primitive) handles focus trap, escape-to-close,
 *   focus restore back to the trigger, and body scroll lock automatically.
 * - The trigger advertises its state via `aria-expanded` / `aria-controls`
 *   so AT users know it opens a panel and that the panel is now open.
 * - The drawer has a visible × close button for keyboard and desktop users
 *   (swipe-down is mobile-only; keyboard users need a focusable affordance).
 * - The scroll container uses `overscroll-contain` so a swipe that starts
 *   at the top of the receipts list cleanly transfers into a drawer drag
 *   instead of getting eaten by scroll inertia. The receipts list itself
 *   can scroll inside the sheet without dismissing it.
 */
export function MintReceiptsHint() {
  const basePath = useBasePath();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/40 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="View your recent mint receipts"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
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

      <Drawer open={open} onOpenChange={setOpen} dismissible>
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
              onClick={() => setOpen(false)}
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
