/**
 * SuperchargerDetailSheet — opt-in deeper view for an active Supercharger
 * session. Shown via [View details] from SuperchargerLiveCard. Keeps the main
 * card calm by moving secondary metrics behind a tap.
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { ActiveChargingSession } from '@/hooks/useActiveChargingSessionV2';
import type { SuperchargerSite } from '@/hooks/useSuperchargerSite';
import { teslaRecCo2 } from '@/lib/co2Math';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ActiveChargingSession;
  site: SuperchargerSite | null;
}

function elapsedLabel(startedAt: string) {
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function SuperchargerDetailSheet({ open, onOpenChange, session, site }: Props) {
  const co2 = teslaRecCo2(session.kwh_so_far);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-card/95 backdrop-blur-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base font-semibold">
            {site?.name ?? 'Tesla Supercharger'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {[site?.city, site?.region].filter(Boolean).join(', ') || 'Live session'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailTile label="Energy added" value={`${session.kwh_so_far.toFixed(1)} kWh`} />
          <DetailTile
            label="Power"
            value={session.charger_power_kw ? `${Math.round(session.charger_power_kw)} kW` : '—'}
          />
          <DetailTile label="Elapsed" value={elapsedLabel(session.started_at)} />
          <DetailTile
            label="$ZSOLAR (1:1)"
            value={`+${session.kwh_so_far.toFixed(1)}`}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-3 text-[12px] text-muted-foreground">
          <div className="font-medium text-foreground">100% REC-matched clean energy</div>
          <div className="mt-1">
            {(co2.tesla_rec_kg / 1000).toFixed(2)} t CO₂ via Tesla REC · {(co2.grid_avg_kg / 1000).toFixed(2)} t vs local grid avg
          </div>
        </div>

        <p className="mt-4 text-[11px] italic text-muted-foreground">
          ↳ Strengthening the $ZSOLAR Liquidity Pool for all holders.
        </p>
      </SheetContent>
    </Sheet>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  );
}
