import { Sparkles, Calendar, Gift, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENESIS_HALVING } from "@/lib/tokenomics";

interface GenesisHalvingAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional countdown date for the halving (ISO string). */
  scheduledDate?: string;
  /** Bonus-month end date (ISO string) — date through which the pre-halving rate still applies. */
  bonusMonthEnds?: string;
  onLearnMore?: () => void;
}

/**
 * One-time announcement modal for the Genesis Halving event.
 * Mirrors the email template copy so users see the same message both places.
 */
export function GenesisHalvingAnnouncementModal({
  open,
  onOpenChange,
  scheduledDate,
  bonusMonthEnds,
  onLearnMore,
}: GenesisHalvingAnnouncementModalProps) {
  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full p-5 sm:p-6 max-h-[90svh] overflow-y-auto rounded-2xl">
        <DialogHeader className="space-y-2">
          <Badge className="w-fit bg-primary/10 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            One-time event
          </Badge>
          <DialogTitle className="text-xl sm:text-2xl leading-tight">
            {GENESIS_HALVING.publicName} is coming
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base pt-1 leading-relaxed">
            We're about to hit <strong>250,000 paying subscribers</strong> — the trigger for the
            first halving. Mint rewards will be cut in half, just like Bitcoin's halvings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">What changes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Per-kWh mint rate drops by 50%. Same proof, half the supply created.
                Existing tier prices and 50/50 LP/treasury split do not change.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Gift className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Your bonus month</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You're already a subscriber, so you get one extra month at the{" "}
                <strong>pre-halving rate</strong>
                {bonusMonthEnds ? <> through <strong>{formatDate(bonusMonthEnds)}</strong></> : null}.
                Mint as much as you can before then.
              </p>
            </div>
          </div>

          {scheduledDate && (
            <p className="text-xs text-center text-muted-foreground">
              Halving locks in on <strong>{formatDate(scheduledDate)}</strong>.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button className="w-full min-h-[44px]" onClick={() => onOpenChange(false)}>
            Got it — I'll mint while I can
          </Button>
          {onLearnMore && (
            <Button variant="ghost" className="w-full min-h-[44px]" onClick={onLearnMore}>
              Learn how halvings work
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GenesisHalvingAnnouncementModal;
