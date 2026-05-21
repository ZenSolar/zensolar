/**
 * KpiActivityLogSheet — bottom-sheet "receipts" view for a Clean Energy
 * Center KPI card.
 *
 * UX (per founder spec, 1A + 2B):
 *   • Tap any KPI card → this sheet slides up from the bottom
 *   • Header shows the KPI label + pending total (the headline number)
 *   • Body is a scrollable log of the individual contributions that add
 *     up to that total — date, device/location, kWh|mi, verified badge
 *   • Footer is a sticky "MINT N tokens" CTA — the user has now SEEN
 *     the receipts (Proof-of-Delta™) before tapping mint (Proof-of-Mint™)
 *
 * The sheet itself does not perform the mint — it calls back to the
 * parent's existing onMintRequest pipeline so the confirm/sign/broadcast
 * flow is unchanged.
 */
import { format, parseISO } from 'date-fns';
import { ShieldCheck, MapPin, Zap, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKpiContributions, type KpiContributionRow } from '@/hooks/useKpiContributions';
import type { MintCategory, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { MINT_RATIO_KWH_PER_TOKEN, getRewardMultiplier } from '@/lib/tokenomics';

export interface KpiSheetState {
  open: boolean;
  category: MintCategory | null;
  deviceId?: string;
  deviceName?: string;
  label: string;
  unit: 'kWh' | 'mi';
  pending: number;
}

interface Props {
  state: KpiSheetState;
  onOpenChange: (open: boolean) => void;
  onMintRequest?: (req: MintRequest) => void;
}

function formatRowDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d · h:mm a');
  } catch {
    try { return format(new Date(iso), 'MMM d'); } catch { return iso; }
  }
}

function providerLabel(p: string): string {
  switch (p) {
    case 'tesla':
    case 'tesla_historical':
      return 'Tesla';
    case 'enphase': return 'Enphase';
    case 'solaredge': return 'SolarEdge';
    case 'wallbox': return 'Wallbox';
    default: return p;
  }
}

function ContributionRow({ row }: { row: KpiContributionRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {formatRowDate(row.recordedAt)}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <span className="truncate">{providerLabel(row.provider)}</span>
          {row.verified && <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />}
        </div>
        {row.location && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.location}</span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {row.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          <span className="text-xs font-normal text-muted-foreground ml-1">{row.unit}</span>
        </p>
      </div>
    </div>
  );
}

export function KpiActivityLogSheet({ state, onOpenChange, onMintRequest }: Props) {
  const { open, category, deviceId, deviceName, label, unit, pending } = state;

  const { data: rows = [], isLoading } = useKpiContributions(category, deviceId, open);

  const sumOfRows = rows.reduce((s, r) => s + r.amount, 0);

  // Tokens preview — same math as ActivityMetrics
  const eligibleTokens = Math.floor(pending / MINT_RATIO_KWH_PER_TOKEN);
  const userShare = Math.floor((pending * getRewardMultiplier() / MINT_RATIO_KWH_PER_TOKEN) * 0.75);

  const canMint = pending > 0 && !!onMintRequest;

  const handleMint = () => {
    if (!canMint || !category) return;
    onMintRequest!({ category, deviceId, deviceName });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 border-t border-primary/30 bg-background h-[85svh] flex flex-col rounded-t-2xl"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 space-y-2 text-left border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-primary">
                Proof-of-Delta™
              </p>
              <SheetTitle className="text-base font-bold text-foreground leading-tight truncate">
                {label}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Every activity that contributed to your pending total
              </SheetDescription>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                {pending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
              </p>
              {eligibleTokens > 0 && (
                <p className="text-[10px] text-primary font-semibold mt-1">
                  ≈ {eligibleTokens.toLocaleString()} $ZSOLAR eligible
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Body — scrollable activity log */}
        <ScrollArea className="flex-1 px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading receipts…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Once your connected device reports activity, every contribution will appear here as a verifiable receipt.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 text-[11px] text-muted-foreground border-b border-border/40">
                <span>{rows.length} contribution{rows.length !== 1 ? 's' : ''}</span>
                <span className="tabular-nums">
                  Σ {sumOfRows.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit}
                </span>
              </div>
              <div>
                {rows.map((row) => <ContributionRow key={row.id} row={row} />)}
              </div>
              <div className="py-4 text-center">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-success/30 text-success bg-success/5">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified by OEM API
                </Badge>
              </div>
            </>
          )}
        </ScrollArea>

        {/* Sticky MINT CTA — proof seen, now mint */}
        <div
          className="px-5 py-4 border-t border-border/60 bg-card/95 backdrop-blur-md"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {canMint ? (
            <>
              <Button
                size="lg"
                onClick={handleMint}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.4)]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Mint {userShare.toLocaleString()} $ZSOLAR
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                75% to you · 20% burned · 3% LP · 2% treasury
              </p>
            </>
          ) : (
            <Button size="lg" disabled className="w-full h-12 text-base">
              Nothing to mint yet
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
