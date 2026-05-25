import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SecurityGuarantees, SECURITY_TAGLINE } from './SecurityGuarantees';

interface SecuritySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet revealing the full set of ZenSolar security guarantees.
 * Opened from the wallet choice screen, the dashboard wallet card, the
 * wallet tour, and anywhere else trust matters.
 */
export function SecuritySheet({ open, onOpenChange }: SecuritySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background pb-8"
      >
        <div className="mx-auto w-12 h-1.5 rounded-full bg-border/60 mb-4 -mt-2" />

        <SheetHeader className="text-center mb-5">
          <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" strokeWidth={2} />
          </div>
          <SheetTitle className="text-xl font-semibold tracking-tight">
            How we protect you
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
            {SECURITY_TAGLINE}
          </SheetDescription>
        </SheetHeader>

        <SecurityGuarantees />

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" asChild className="w-full h-11">
            <Link to="/security" onClick={() => onOpenChange(false)}>
              Read full security details
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <p className="text-[11px] text-center text-muted-foreground/70 mt-1">
            ZenSolar Beta · Base Sepolia · audited contracts
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
