import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Leaf, TreePine, Sun, BatteryCharging, Zap, Home, ChevronRight, Car, Calculator } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ActivityData,
  CO2Breakdown,
  calculateCO2Breakdown,
  EPA_CO2_LBS_PER_KWH,
  CO2_LBS_PER_GAS_MILE,
  EV_KWH_PER_MILE,
} from '@/types/dashboard';
import { generateDailyBreakdown } from '@/lib/dailyMintBreakdown';

interface CO2OffsetCardProps {
  /** Full activity data — used to compute per-activity CO₂ breakdown. */
  activityData?: ActivityData;
  /** Legacy: lifetime CO2 offset in pounds. Used as fallback when activityData is absent. */
  co2Pounds?: number;
  isLoading?: boolean;
  className?: string;
}

const LBS_PER_TON = 2000;
const LBS_PER_TREE_YEAR = 48;

type CategoryKey = 'solar' | 'battery' | 'supercharger' | 'home_charger' | 'ev_miles';

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  icon: typeof Sun;
  accentClass: string;
  iconBgClass: string;
  iconTextClass: string;
  barBgClass: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'solar',
    label: 'Solar',
    shortLabel: 'Solar',
    icon: Sun,
    accentClass: 'border-l-amber-400/70',
    iconBgClass: 'bg-amber-400/15',
    iconTextClass: 'text-amber-400',
    barBgClass: 'bg-amber-400',
  },
  {
    key: 'battery',
    label: 'Battery',
    shortLabel: 'Battery',
    icon: BatteryCharging,
    accentClass: 'border-l-primary/70',
    iconBgClass: 'bg-primary/15',
    iconTextClass: 'text-primary',
    barBgClass: 'bg-primary',
  },
  {
    key: 'supercharger',
    label: 'Tesla Supercharging',
    shortLabel: 'Supercharger',
    icon: Zap,
    accentClass: 'border-l-destructive/70',
    iconBgClass: 'bg-destructive/15',
    iconTextClass: 'text-destructive',
    barBgClass: 'bg-destructive',
  },
  {
    key: 'home_charger',
    label: 'Home Charging',
    shortLabel: 'Home Charger',
    icon: Home,
    accentClass: 'border-l-eco/70',
    iconBgClass: 'bg-eco/15',
    iconTextClass: 'text-eco',
    barBgClass: 'bg-eco',
  },
  {
    key: 'ev_miles',
    label: 'EV Miles Driven',
    shortLabel: 'EV Miles',
    icon: Car,
    accentClass: 'border-l-eco/70',
    iconBgClass: 'bg-eco/15',
    iconTextClass: 'text-eco',
    barBgClass: 'bg-eco',
  },
];

function formatTons(lbs: number): string {
  const tons = lbs / LBS_PER_TON;
  if (tons >= 100) return tons.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (tons >= 1) return tons.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return tons.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function lbsOf(breakdown: CO2Breakdown, key: CategoryKey): number {
  if (key === 'solar') return breakdown.solarLbs;
  if (key === 'battery') return breakdown.batteryLbs;
  if (key === 'supercharger') return breakdown.evSuperchargerLbs;
  if (key === 'ev_miles') return breakdown.evLbs;
  return breakdown.evHomeChargerLbs;
}

const EMPTY_BREAKDOWN = (totalLbs: number): CO2Breakdown => ({
  solarLbs: totalLbs,
  batteryLbs: 0,
  evLbs: 0,
  evSuperchargerLbs: 0,
  evHomeChargerLbs: 0,
  totalLbs,
  inputs: {
    solarKwh: 0,
    batteryKwh: 0,
    evMiles: 0,
    evKwhUsed: 0,
    evGasBaselineLbs: 0,
    evElectricityEmissionsLbs: 0,
    superchargerKwh: 0,
    homeChargerKwh: 0,
  },
});

export function CO2OffsetCard({ activityData, co2Pounds, isLoading, className }: CO2OffsetCardProps) {
  const [openCategory, setOpenCategory] = useState<CategoryKey | null>(null);

  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-l-2 border-l-primary/60 bg-gradient-to-br from-eco/10 to-primary/5',
          className,
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted/50 animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdown: CO2Breakdown = activityData
    ? calculateCO2Breakdown(activityData)
    : EMPTY_BREAKDOWN(co2Pounds ?? 0);

  const totalLbs = breakdown.totalLbs;
  const treeYears = Math.max(0, Math.round(totalLbs / LBS_PER_TREE_YEAR));

  const activeCategory = openCategory ? CATEGORIES.find((c) => c.key === openCategory) : null;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border-l-2 border-l-primary bg-gradient-to-br from-eco/10 via-primary/5 to-transparent transition-colors hover:border-l-primary/80',
          className,
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco/20 text-eco shrink-0">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Lifetime CO₂ offset
              </p>
              <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-foreground">
                {formatTons(totalLbs)}
                <span className="ml-1.5 text-base font-semibold text-muted-foreground">tons of CO₂ offset</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {totalLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs of CO₂ offset
                </span>
                <span className="inline-flex items-center gap-1">
                  <TreePine className="h-3 w-3 text-eco" />
                  ≈ {treeYears.toLocaleString()} tree-years
                </span>
              </div>
            </div>
          </div>

          {/* 2x2 grid — drillable (EV miles is shown below as a full-width banner) */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CATEGORIES.filter((c) => c.key !== 'ev_miles').map((cat) => {
              const lbs = lbsOf(breakdown, cat.key);
              const pct = totalLbs > 0 ? Math.round((lbs / totalLbs) * 100) : 0;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setOpenCategory(cat.key)}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border border-border/60 border-l-2 bg-card/40 p-2.5 text-left transition-all hover:bg-card/70 hover:border-border active:scale-[0.98]',
                    cat.accentClass,
                  )}
                  aria-label={`${cat.label} CO₂ offset breakdown`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-md',
                        cat.iconBgClass,
                        cat.iconTextClass,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {cat.shortLabel}
                  </p>
                  <p className="mt-0.5 text-base font-bold leading-none tabular-nums text-foreground">
                    {formatTons(lbs)}
                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">tons of CO₂ offset</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {pct}% of total
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={cn('h-full rounded-full', cat.barBgClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* EV miles summary — full width, biggest contributor, drillable */}
          {breakdown.inputs.evMiles > 0 && (
            <button
              type="button"
              onClick={() => setOpenCategory('ev_miles')}
              className="mt-2 w-full rounded-lg border border-border/60 border-l-2 border-l-eco/70 bg-gradient-to-r from-eco/10 via-card/40 to-card/40 p-3 text-left transition-all hover:bg-card/60 active:scale-[0.99] group"
              aria-label="EV Miles CO₂ offset breakdown"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-eco/15 text-eco shrink-0">
                  <Car className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    EV Miles Driven (Lifetime)
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl font-bold leading-none tabular-nums text-foreground">
                      {breakdown.inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="ml-1 text-xs font-medium text-muted-foreground">mi</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      = {formatTons(breakdown.evLbs)} tons of CO₂ offset
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0" />
              </div>
            </button>
          )}
        </CardContent>
      </Card>

      <Drawer open={!!openCategory} onOpenChange={(o) => !o && setOpenCategory(null)}>
        <DrawerContent>
          {activeCategory && (
            <div className="mx-auto w-full max-w-md px-4 pb-4">
              <DrawerHeader className="px-0 pt-1 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      activeCategory.iconBgClass,
                      activeCategory.iconTextClass,
                    )}
                  >
                    <activeCategory.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <DrawerTitle className="text-left text-lg">
                      {activeCategory.label} CO₂ Offset
                    </DrawerTitle>
                    <DrawerDescription className="text-left text-xs">
                      How this category contributes to your lifetime tons avoided
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>

              <CategoryDetails category={activeCategory.key} breakdown={breakdown} />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function CategoryDetails({ category, breakdown }: { category: CategoryKey; breakdown: CO2Breakdown }) {
  const [splitOpen, setSplitOpen] = useState(false);
  const lbs = lbsOf(breakdown, category);
  const treeYears = Math.max(0, Math.round(lbs / LBS_PER_TREE_YEAR));
  const pct = breakdown.totalLbs > 0 ? (lbs / breakdown.totalLbs) * 100 : 0;
  const { inputs } = breakdown;

  const isCharger = category === 'supercharger' || category === 'home_charger';
  const chargerKwh =
    category === 'supercharger' ? inputs.superchargerKwh : inputs.homeChargerKwh;
  const chargerLabel = category === 'supercharger' ? 'Supercharger' : 'Home charger';

  // Daily trend (last 30 days) — for ev_miles, derive miles + kWh + tons offset.
  const evTrend = useMemo(() => {
    if (category !== 'ev_miles' || inputs.evMiles <= 0) return [];
    const milesDaily = generateDailyBreakdown('ev_miles', Math.round(inputs.evMiles), {
      days: 30,
      seed: 'co2-ev-miles',
      unit: 'mi',
    });
    return milesDaily.points.map((p) => {
      const miles = p.value;
      const kwh = miles * EV_KWH_PER_MILE;
      const gasLbs = miles * CO2_LBS_PER_GAS_MILE;
      const gridLbs = kwh * EPA_CO2_LBS_PER_KWH;
      const netLbs = Math.max(0, gasLbs - gridLbs);
      return {
        day: p.weekday,
        date: p.date,
        miles,
        kwh: Math.round(kwh * 10) / 10,
        tons: Math.round((netLbs / LBS_PER_TON) * 1000) / 1000,
      };
    });
  }, [category, inputs.evMiles]);

  const netLbsEv = Math.max(0, inputs.evGasBaselineLbs - inputs.evElectricityEmissionsLbs);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Lifetime CO₂ offset
        </p>
        <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-foreground">
          {formatTons(lbs)}
          <span className="ml-1.5 text-base font-semibold text-muted-foreground">tons of CO₂ offset</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs
          </span>
          <span className="inline-flex items-center gap-1">
            <TreePine className="h-3 w-3 text-eco" />
            ≈ {treeYears.toLocaleString()} tree-years
          </span>
          <span className="tabular-nums">{pct.toFixed(1)}% of lifetime total</span>
        </div>
      </div>

      {category === 'ev_miles' && evTrend.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Last 30 days
            </p>
            <p className="text-[10px] text-muted-foreground">miles · kWh · tons</p>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evTrend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.3)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  interval={3}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <RTooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'miles') return [`${value.toLocaleString()} mi`, 'Miles'];
                    if (name === 'kwh') return [`${value} kWh`, 'Charging'];
                    if (name === 'tons') return [`${value.toFixed(3)} tons of CO₂ offset`, 'CO₂ offset'];
                    return [value, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="miles" fill="hsl(var(--eco))" radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="kwh"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tons"
                  stroke="hsl(var(--amber-400, 48 96% 53%))"
                  strokeWidth={1.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-eco" /> Miles driven
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-primary" /> Charging kWh
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-amber-400" /> Tons of CO₂ offset
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
          How it's calculated
        </p>
        {category === 'solar' && (
          <>
            <Row
              label="Solar energy produced"
              value={`${inputs.solarKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row label="EPA grid factor" value={`${EPA_CO2_LBS_PER_KWH} lbs CO₂ / kWh`} />
            <Row
              label="= CO₂ displaced"
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Every kWh of solar you produce displaces a kWh of average US grid electricity
              (eGRID 2022, adjusted for ~5.1% transmission losses).
            </p>
          </>
        )}
        {category === 'battery' && (
          <>
            <Row
              label="Battery energy discharged"
              value={`${inputs.batteryKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row label="EPA grid factor" value={`${EPA_CO2_LBS_PER_KWH} lbs CO₂ / kWh`} />
            <Row
              label="= CO₂ displaced"
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Stored energy you discharge into your home served load that would otherwise have
              come from the grid.
            </p>
          </>
        )}
        {category === 'ev_miles' && (
          <>
            <Row
              label="EV miles driven (lifetime)"
              value={`${inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`}
            />
            <Row
              label="Gasoline baseline avoided"
              value={`${inputs.evGasBaselineLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <Row
              label="− Grid emissions from charging"
              value={`${inputs.evElectricityEmissionsLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <Row
              label="= Net CO₂ offset"
              value={`${netLbsEv.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <button
              type="button"
              onClick={() => setSplitOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Calculator className="h-3 w-3" />
              See full gasoline vs grid split
            </button>
          </>
        )}
        {isCharger && (
          <>
            <Row
              label={`${chargerLabel} energy delivered`}
              value={`${chargerKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
            />
            <Row
              label="Share of total EV charging"
              value={`${inputs.evKwhUsed > 0 ? Math.round((chargerKwh / inputs.evKwhUsed) * 100) : 0}%`}
            />
            <Row
              label="EV miles driven (lifetime)"
              value={`${inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`}
            />
            <Row
              label="Gasoline baseline avoided"
              value={`${inputs.evGasBaselineLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs (${CO2_LBS_PER_GAS_MILE} lbs/mi)`}
            />
            <Row
              label="− Grid emissions from charging"
              value={`${inputs.evElectricityEmissionsLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <Row
              label={`= Net CO₂ avoided (allocated)`}
              value={`${lbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              EV net offset = gasoline baseline (~404 g CO₂/mile) minus grid emissions from
              charging. Allocated to {chargerLabel.toLowerCase()} proportionally to its share
              of total kWh delivered ({EV_KWH_PER_MILE} kWh/mi assumed if no charger data).
            </p>
          </>
        )}
      </div>

      {category === 'ev_miles' && (
        <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4 text-primary" />
                Gasoline vs Grid — Full Split
              </DialogTitle>
              <DialogDescription className="text-xs">
                Exact line-by-line math behind your {formatTons(lbs)} tons of CO₂ offset.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-eco/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-eco font-semibold">
                  + Gasoline avoided
                </p>
                <Row
                  label="Miles driven (lifetime)"
                  value={`${inputs.evMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`}
                />
                <Row label="ICE baseline" value={`${CO2_LBS_PER_GAS_MILE} lbs CO₂ / mile`} />
                <Row
                  label="= Gasoline CO₂ avoided"
                  value={`${inputs.evGasBaselineLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  US fleet avg 24.4 mpg × 8.887 kg CO₂/gal = ~404 g/mile (EPA).
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-destructive/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">
                  − Grid emissions from charging
                </p>
                <Row
                  label="kWh used to charge"
                  value={`${inputs.evKwhUsed.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
                />
                <Row
                  label="Efficiency assumed"
                  value={`${EV_KWH_PER_MILE} kWh / mile`}
                />
                <Row label="EPA grid factor" value={`${EPA_CO2_LBS_PER_KWH} lbs CO₂ / kWh`} />
                <Row
                  label="= Grid CO₂ emitted"
                  value={`${inputs.evElectricityEmissionsLbs.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
                />
              </div>

              <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                  = Net CO₂ offset
                </p>
                <Row
                  label="Gasoline avoided − Grid emitted"
                  value={`${netLbsEv.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs`}
                />
                <Row
                  label="In tons"
                  value={`${formatTons(netLbsEv)} tons`}
                />
                <Row
                  label="≈ Tree-years equivalent"
                  value={`${Math.max(0, Math.round(netLbsEv / LBS_PER_TREE_YEAR)).toLocaleString()} yr`}
                />
              </div>

              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Every mint = 1 on-chain tx on Base (~0 kg CO₂). Bitcoin PoW = ~707 kg CO₂/tx.
                Proof-of-Genesis™ is the regenerative inverse of PoW.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

