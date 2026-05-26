import { ArrowLeft } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { VerifyPoAContent } from './VerifyPoAContent';

/**
 * Swipe-down Drawer presentation of the Proof-of-Genesis receipt.
 *
 * Used when a user taps a receipt row from the dashboard's mint-receipts
 * drawer — instead of navigating to `/verify/:poa` (which is reserved for
 * cold loads / share links), we stack a second Drawer on top so:
 *   - swipe-down peels back one layer at a time (PoG → receipts → dashboard)
 *   - the back arrow obviously dismisses just the PoG layer
 *   - share links, SEO, and the public `/verify/:poa` route are untouched
 */
export function VerifyPoASheet({
  chainHash,
  open,
  onOpenChange,
}: {
  chainHash: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible>
      <DrawerContent
        aria-labelledby="pog-sheet-title"
        aria-describedby="pog-sheet-desc"
        className="max-h-[92dvh] lg:max-h-none"
      >
        {/* Sticky top bar — obvious back arrow even when the body scrolls */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 pt-2 pb-3 bg-background/95 backdrop-blur border-b border-border/40">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Back to receipts"
            className="inline-flex h-10 items-center gap-1.5 -ml-2 px-2.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>Back</span>
          </button>
          <DrawerTitle id="pog-sheet-title" className="sr-only">
            Proof-of-Genesis Receipt
          </DrawerTitle>
          <DrawerDescription id="pog-sheet-desc" className="sr-only">
            Swipe down or press Escape to return to your receipts list.
          </DrawerDescription>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          <div className="container max-w-3xl mx-auto px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <VerifyPoAContent poa={chainHash} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
