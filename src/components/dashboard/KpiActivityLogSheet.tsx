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
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ShieldCheck, MapPin, Zap, ArrowRight, Loader2, Sparkles, ChevronDown, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useKpiContributions, type KpiContributionRow } from '@/hooks/useKpiContributions';
import type { MintCategory, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { MINT_RATIO_KWH_PER_TOKEN } from '@/lib/tokenomics';
import { useDemoContextSafe } from '@/contexts/DemoContext';
import { generateDailyBreakdown, type DailyCategory } from '@/lib/dailyMintBreakdown';

export type KpiAccent = 'solar' | 'secondary' | 'primary' | 'energy' | 'token';

export interface KpiSheetState {
  open: boolean;
  category: MintCategory | null;
  deviceId?: string;
  deviceName?: string;
  label: string;
  unit: 'kWh' | 'mi';
  pending: number;
  /** Semantic color token matching the KPI field — drives the drawer outline. */
  accent?: KpiAccent;
}


interface Props {
  state: KpiSheetState;
  onOpenChange: (open: boolean) => void;
  onMintRequest?: (req: MintRequest) => void;
}

function formatRowDate(iso: string, hasRealTime: boolean): string {
  try {
    const d = parseISO(iso);
    return format(d, hasRealTime ? 'MMM d · h:mm a' : 'MMM d');
  } catch {
    try { return format(new Date(iso), 'MMM d'); } catch { return iso; }
  }
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
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

function apiProviderLabel(p: string): string {
  switch (p) {
    case 'tesla':
    case 'tesla_historical':
      return 'Tesla API';
    case 'enphase': return 'Enphase API';
    case 'solaredge': return 'SolarEdge API';
    case 'wallbox': return 'Wallbox API';
    default: return 'OEM API';
  }
}

function ContributionRow({ row }: { row: KpiContributionRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {formatRowDate(row.recordedAt, row.hasRealTime)}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <span className="truncate">{providerLabel(row.provider)}</span>
          {row.verified && <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />}
        </div>
        {row.durationMinutes ? (
          <p className="text-[11px] text-muted-foreground">
            Session length = {formatDuration(row.durationMinutes)}
          </p>
        ) : null}
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

/**
 * Interval-based KPIs (solar/battery/ev_miles) come in as raw 5–15min
 * samples. Rolling them up by calendar day keeps the receipt feel without
 * a wall of rows.
 */
// Every mintable category now rolls up by calendar day in the receipt sheet
// so users see "May 21 — 18.4 kWh" instead of a wall of individual samples or
// sessions. Tap a day to expand into its underlying contributions.
const INTERVAL_CATEGORIES: ReadonlyArray<MintCategory> = [
  'solar',
  'battery',
  'ev_miles',
  'supercharger',
  'home_charger',
  'charging',
];

type DayGroup = {
  dayKey: string;       // "2026-05-21"
  dayLabel: string;     // "May 21"
  total: number;
  count: number;
  rows: KpiContributionRow[];
};

function groupByDay(rows: KpiContributionRow[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const r of rows) {
    let key: string;
    let label: string;
    try {
      const d = parseISO(r.recordedAt);
      key = format(d, 'yyyy-MM-dd');
      label = format(d, 'MMM d');
    } catch {
      key = r.recordedAt.slice(0, 10);
      label = key;
    }
    const g = map.get(key);
    if (g) {
      g.total += r.amount;
      g.count += 1;
      g.rows.push(r);
    } else {
      map.set(key, { dayKey: key, dayLabel: label, total: r.amount, count: 1, rows: [r] });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
}

function DayGroupRow({ group, unit, category }: { group: DayGroup; unit: 'kWh' | 'mi'; category: MintCategory | null }) {
  const [expanded, setExpanded] = useState(false);
  const descriptor = category === 'solar'
    ? group.count === 1 ? 'daily production total' : `${group.count} system totals`
    : `${group.count} sample${group.count !== 1 ? 's' : ''}`;
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 py-3 text-left active:bg-muted/30 transition-colors touch-manipulation"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {group.dayLabel}
          </p>
          <p className="text-sm text-foreground">
            {descriptor}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm font-bold tabular-nums text-foreground">
            {group.total.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
          </p>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>
      {expanded && (
        <div className="pb-2 pl-3 border-l border-border/40 ml-1">
          {group.rows.map((r) => <ContributionRow key={r.id} row={r} />)}
        </div>
      )}
    </div>
  );
}
export function KpiActivityLogSheet({ state, onOpenChange, onMintRequest }: Props) {
  const { open, category, deviceId, deviceName, label, unit, pending, accent } = state;
  const accentVar = `--${accent ?? 'primary'}`;

  const demoCtx = useDemoContextSafe();
  const isDemo = !!demoCtx;

  const { data: liveRows = [], isLoading: liveLoading } = useKpiContributions(category, deviceId, open && !isDemo, pending);

  // In demo mode the backend has no real receipts, so synthesize a 14-day
  // breakdown that sums exactly to the headline `pending`. Stable per
  // (category, pending, deviceId) so re-opens don't reshuffle.
  const demoRows = useMemo<KpiContributionRow[]>(() => {
    if (!isDemo || !category || pending <= 0) return [];
    const catMap: Record<MintCategory, DailyCategory | null> = {
      solar: 'solar',
      battery: 'battery',
      ev_miles: 'ev_miles',
      charging: 'charging',
      supercharger: 'supercharging',
      home_charger: 'home_charging',
      all: null,
    };
    const dCat = catMap[category];
    if (!dCat) return [];
    const providerByCategory: Record<string, string> = {
      solar: 'solaredge',
      battery: 'tesla',
      ev_miles: 'tesla',
      supercharger: 'tesla',
      home_charger: 'tesla',
      charging: 'tesla',
    };
    const provider = providerByCategory[category] || 'tesla';
    // Scale window to keep daily values realistic (avoids 400 mi/day spikes
    // when pending is large). Cap at ~90 days for legibility.
    const typicalPerDay: Record<string, number> = {
      solar: 30,         // kWh/day
      battery: 10,       // kWh/day
      ev_miles: 38,      // mi/day
      supercharger: 25,  // kWh/day avg (sparse, big spikes)
      home_charger: 14,  // kWh/day
      charging: 18,      // kWh/day
    };
    const tpd = typicalPerDay[category] || 20;
    const days = Math.min(90, Math.max(7, Math.ceil(pending / tpd)));
    const seed = `demo|${category}|${deviceId ?? 'all'}|${Math.round(pending)}`;
    const { points, unit: u } = generateDailyBreakdown(dCat, Math.round(pending), { seed, days, unit });
    return points
      .filter((p) => p.value > 0)
      .map((p, i) => ({
        id: `demo-${category}-${p.date}-${i}`,
        recordedAt: `${p.date}T${category === 'supercharger' ? '14' : category === 'home_charger' ? '22' : '12'}:00:00Z`,
        hasRealTime: category === 'supercharger' || category === 'home_charger',
        durationMinutes: category === 'supercharger' ? 25 + ((i * 7) % 20) : category === 'home_charger' ? 240 + ((i * 13) % 120) : null,
        amount: p.value,
        unit: u,
        provider,
        deviceId: deviceId ?? null,
        deviceName: deviceName ?? null,
        location: category === 'supercharger' ? 'Tesla Supercharger' : category === 'home_charger' ? 'Home' : null,
        verified: true,
      }));
  }, [isDemo, category, pending, deviceId, deviceName, unit]);

  const rows = isDemo ? demoRows : liveRows;
  const isLoading = isDemo ? false : liveLoading;

  const sumOfRows = rows.reduce((s, r) => s + r.amount, 0);

  const isInterval = !!category && INTERVAL_CATEGORIES.includes(category);
  const dayGroups = useMemo(() => (isInterval ? groupByDay(rows) : []), [rows, isInterval]);

  // Tokens preview — same math as ActivityMetrics
  const eligibleTokens = Math.floor(pending / MINT_RATIO_KWH_PER_TOKEN);




  const canMint = pending > 0 && !!onMintRequest;

  const handleMint = () => {
    if (!canMint || !category) return;
    onMintRequest!({ category, deviceId, deviceName });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} closeThreshold={0.35}>
      <DrawerContent
        style={{
          borderColor: `hsl(var(${accentVar}) / 0.55)`,
          boxShadow: `0 -8px 32px hsl(var(${accentVar}) / 0.18)`,
        }}
        className="p-0 border-2 bg-background h-[85svh] min-h-0 flex flex-col rounded-t-2xl focus:outline-none will-change-transform touch-pan-y"
      >

        {/* Header */}
        <DrawerHeader className="px-5 pt-2 pb-3 space-y-2 text-left border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-primary">
                Proof-of-Delta™
              </p>
              <DrawerTitle className="text-base font-bold text-foreground leading-tight truncate">
                {label}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Activity receipts for {label}
              </DrawerDescription>
            </div>
            <div className="flex items-start gap-2 shrink-0">
              <div className="text-right">
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
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
          </div>
          {rows.length > 0 && (() => {
            const provider = rows[0]?.provider || '';
            const isTesla = provider.startsWith('tesla');
            return (
              <div className="pt-1">
                <Badge
                  variant="outline"
                  className={
                    isTesla
                      ? "text-[10px] uppercase tracking-wider border-[hsl(0_85%_55%/0.5)] text-[hsl(0_85%_65%)] bg-[hsl(0_85%_45%/0.08)]"
                      : "text-[10px] uppercase tracking-wider border-success/30 text-success bg-success/5"
                  }
                >
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified by {apiProviderLabel(provider)}
                </Badge>
              </div>
            );
          })()}
        </DrawerHeader>



        {/* Body — scrollable activity log */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
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
              {(() => {
                const sectionTitle =
                  category === 'solar' ? 'Daily Production'
                  : category === 'battery' ? 'Daily Battery Exports'
                  : category === 'ev_miles' ? 'Daily Miles Driven'
                  : category === 'supercharger' ? 'Supercharging Sessions'
                  : category === 'home_charger' ? 'Home Charging Sessions'
                  : category === 'charging' ? 'Charging Sessions'
                  : 'Contributions';
                const meta = isInterval
                  ? category === 'solar'
                    ? `${dayGroups.length} day${dayGroups.length !== 1 ? 's' : ''} · ${rows.length} daily total${rows.length !== 1 ? 's' : ''}`
                    : `${dayGroups.length} day${dayGroups.length !== 1 ? 's' : ''} · ${rows.length} sample${rows.length !== 1 ? 's' : ''}`
                  : `${rows.length} contribution${rows.length !== 1 ? 's' : ''}`;
                return (
                  <div className="pt-4 pb-2.5 border-b border-border/60">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground leading-none">
                          {sectionTitle}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{meta}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none">Total</p>
                        <p className="text-sm font-bold tabular-nums text-foreground mt-1">
                          {sumOfRows.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          <span className="text-[10px] font-normal text-muted-foreground ml-1">{unit}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div>
                {isInterval
                  ? dayGroups.map((g) => <DayGroupRow key={g.dayKey} group={g} unit={unit} category={category} />)
                  : rows.map((row) => <ContributionRow key={row.id} row={row} />)}
              </div>
              <div className="py-4" />

            </>
          )}
        </div>

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
                Mint {eligibleTokens.toLocaleString()} $ZSOLAR
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Split shown on confirm · 75% to you · 20% burned · 3% LP · 2% treasury
              </p>
            </>
          ) : (
            <Button size="lg" disabled className="w-full h-12 text-base">
              Nothing to mint yet
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
